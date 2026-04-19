import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendTelegram, daysSince } from "../_shared/telegram.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mexico City timezone offset (UTC-6 standard, -5 DST). For simplicity we use -6.
const MX_TZ_OFFSET_MIN = -360;

function nowInMexico() {
  const now = new Date();
  return new Date(now.getTime() + (MX_TZ_OFFSET_MIN - now.getTimezoneOffset()) * 60_000);
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

const FALLBACK_MORNING = [
  "¡Buenos días, {nombre}! 🌅 Hoy es tu día {dias_sobriedad} de libertad. ¡Qué chingón suena eso! ¿Cómo amaneciste?",
  "¡Arriba, {nombre}! ☀️ Otro día más en tu camino, ya van {dias_sobriedad}. ¿Qué planes tienes para hoy?",
  "¡Qué onda, {nombre}! 🌄 Día {dias_sobriedad} y contando. ¿Cómo te sientes esta mañana?",
];

const FALLBACK_EVENING = [
  "Oye {nombre}, ¿cómo te fue hoy? 💪 Cuéntame cómo estuvo tu día.",
  "Hey {nombre}, ya casi termina el día {dias_sobriedad}. 🌙 ¿Cómo la llevas?",
  "¿Qué tal, {nombre}? 🌆 Otro día más que sumas. ¿Cómo te sientes esta noche?",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const mx = nowInMexico();
  const currentMinutes = mx.getHours() * 60 + mx.getMinutes();
  const WINDOW = 30; // ±30 minutes (since cron runs hourly)

  const { data: settings } = await supabase
    .from("bot_settings")
    .select("setting_key, setting_value")
    .in("setting_key", ["checkin_morning_templates", "checkin_evening_templates"]);

  const morningTemplates =
    (settings?.find((s) => s.setting_key === "checkin_morning_templates")?.setting_value as string[]) || FALLBACK_MORNING;
  const eveningTemplates =
    (settings?.find((s) => s.setting_key === "checkin_evening_templates")?.setting_value as string[]) || FALLBACK_EVENING;

  const { data: users } = await supabase
    .from("telegram_users")
    .select("id, first_name, sobriety_start_date, telegram_chat_id, preferred_checkin_morning, preferred_checkin_evening")
    .eq("onboarding_completed", true);

  let sent = 0;
  for (const u of users || []) {
    const morningMin = timeToMinutes(u.preferred_checkin_morning);
    const eveningMin = timeToMinutes(u.preferred_checkin_evening);
    const dias = daysSince(u.sobriety_start_date) ?? 0;

    let template: string | null = null;
    let kind: "morning" | "evening" | null = null;
    if (Math.abs(currentMinutes - morningMin) <= WINDOW) {
      template = morningTemplates[Math.floor(Math.random() * morningTemplates.length)];
      kind = "morning";
    } else if (Math.abs(currentMinutes - eveningMin) <= WINDOW) {
      template = eveningTemplates[Math.floor(Math.random() * eveningTemplates.length)];
      kind = "evening";
    }

    if (!template || !kind) continue;

    // Avoid double-send: check last bot event of this kind today
    const todayStart = new Date(mx.getFullYear(), mx.getMonth(), mx.getDate()).toISOString();
    const { data: existing } = await supabase
      .from("bot_events")
      .select("id")
      .eq("user_id", u.id)
      .eq("event_type", `checkin_${kind}_sent`)
      .gte("created_at", todayStart)
      .limit(1);
    if (existing && existing.length > 0) continue;

    const text = template
      .replaceAll("{nombre}", u.first_name || "compa")
      .replaceAll("{dias_sobriedad}", String(dias));

    const ok = await sendTelegram(u.telegram_chat_id, text);
    if (ok) {
      await supabase.from("telegram_messages").insert({
        user_id: u.id,
        message_type: "bot",
        content: text,
      });
      await supabase.from("bot_events").insert({
        user_id: u.id,
        event_type: `checkin_${kind}_sent`,
        event_data: { template, dias },
      });
      sent++;
    }
  }

  return new Response(JSON.stringify({ ok: true, sent, time_mx: mx.toISOString() }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
