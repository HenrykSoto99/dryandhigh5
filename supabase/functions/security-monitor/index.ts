import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendTelegram } from "../_shared/telegram.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Security monitor: scans unnotified security_alerts and pushes a Telegram
 * message to the admin chat. Runs on a cron (every minute).
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { data: chatSetting } = await supabase
      .from("bot_settings")
      .select("setting_value")
      .eq("setting_key", "admin_telegram_chat_id")
      .maybeSingle();

    const adminChatId = chatSetting?.setting_value as number | null;

    const { data: alerts } = await supabase
      .from("security_alerts")
      .select("id, alert_type, severity, summary, details, created_at")
      .eq("notified", false)
      .order("created_at", { ascending: true })
      .limit(20);

    if (!alerts || alerts.length === 0) {
      return new Response(JSON.stringify({ ok: true, processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    for (const a of alerts) {
      if (adminChatId) {
        const emoji = a.severity === "critical" ? "🚨" : "⚠️";
        const detailsStr = JSON.stringify(a.details, null, 2).slice(0, 800);
        const text =
          `${emoji} <b>ALERTA DE SEGURIDAD</b>\n\n` +
          `<b>Tipo:</b> ${a.alert_type}\n` +
          `<b>Severidad:</b> ${a.severity.toUpperCase()}\n` +
          `<b>Resumen:</b> ${a.summary}\n\n` +
          `<b>Detalles:</b>\n<code>${escapeHtml(detailsStr)}</code>\n\n` +
          `<i>${new Date(a.created_at).toLocaleString("es-MX")}</i>`;
        const ok = await sendTelegram(adminChatId, text);
        if (ok) sent++;
      }
      await supabase
        .from("security_alerts")
        .update({ notified: true, notified_at: new Date().toISOString() })
        .eq("id", a.id);
    }

    return new Response(JSON.stringify({ ok: true, processed: alerts.length, sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("security-monitor error", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}