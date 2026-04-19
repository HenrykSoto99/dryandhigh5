import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendTelegram } from "../_shared/telegram.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const today = new Date();
  const in48h = new Date(today.getTime() + 48 * 3600_000);
  const todayStr = today.toISOString().slice(0, 10);
  const targetStr = in48h.toISOString().slice(0, 10);

  // Find high-risk holidays in 48h that have not been alerted
  const { data: holidays } = await supabase
    .from("mexican_holidays")
    .select("*")
    .eq("is_high_risk", true)
    .eq("alert_sent", false)
    .gte("holiday_date", todayStr)
    .lte("holiday_date", targetStr);

  const { data: users } = await supabase
    .from("telegram_users")
    .select("id, first_name, telegram_chat_id")
    .eq("onboarding_completed", true);

  let alertsSent = 0;
  for (const h of holidays || []) {
    for (const u of users || []) {
      const msg = `Hey <b>${u.first_name || "compa"}</b>, se acerca <b>${h.name}</b> y sabemos que puede ser un momento retador. 🎯

Algunas estrategias que te pueden servir:
• Ten un plan: ¿qué vas a hacer si sientes tentación?
• Identifica tus triggers y evítalos
• Mantente cerca de tu red de apoyo
• Recuerda por qué empezaste este camino

Estoy aquí para ti antes, durante y después. 💪 Si la cosa aprieta, escribe <b>/sos</b>.`;
      const ok = await sendTelegram(u.telegram_chat_id, msg);
      if (ok) {
        await supabase.from("telegram_messages").insert({
          user_id: u.id,
          message_type: "bot",
          content: msg,
        });
        alertsSent++;
      }
    }
    await supabase.from("mexican_holidays").update({ alert_sent: true }).eq("id", h.id);
  }

  // Friday weekend prep — UTC day 5 (Friday). Run only when scheduled at 18:00 MX
  const mxHour = (today.getUTCHours() - 6 + 24) % 24;
  const isFriday = today.getUTCDay() === 5;
  if (isFriday && mxHour === 18) {
    for (const u of users || []) {
      const msg = `¡Hey <b>${u.first_name || "compa"}</b>! 🌆 Llega el finde y sabemos que a veces es cuando más aprieta.

Ten tu plan listo:
• ¿Qué vas a hacer si te invitan a tomar?
• ¿A quién puedes hablarle si sientes tentación?
• ¿Qué actividad te puede mantener ocupado?

Estoy contigo, carnal. 💪 Cualquier cosa: <b>/sos</b>.`;
      const ok = await sendTelegram(u.telegram_chat_id, msg);
      if (ok) alertsSent++;
    }
  }

  return new Response(JSON.stringify({ ok: true, alertsSent, holidaysProcessed: holidays?.length || 0 }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
