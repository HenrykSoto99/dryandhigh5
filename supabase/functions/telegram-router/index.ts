import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendTelegram, daysSince, parseDateMx } from "../_shared/telegram.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MILESTONES = [
  { days: 1, msg: "¡{nombre}! 🎉 ¡Tu primer día completo! El viaje de mil millas empieza con un paso, carnal." },
  { days: 7, msg: "¡UNA SEMANA, {nombre}! 🔥 7 días de pura voluntad. ¡Eso es de guerreros!" },
  { days: 14, msg: "¡Dos semanas, compa! 💪 {nombre}, ya le estás agarrando el ritmo." },
  { days: 30, msg: "¡UN MES! 🏆 {nombre}, 30 días de libertad. Esto ya es un estilo de vida, bro." },
  { days: 60, msg: "¡60 DÍAS! 🌟 {nombre}, dos meses de chingón. ¡Qué orgullo, carnal!" },
  { days: 100, msg: "¡¡¡CIEN DÍAS!!! 🎊🎊🎊 {nombre}, triple dígitos. Eres una inspiración, hermano." },
  { days: 180, msg: "¡MEDIO AÑO! 🏅 {nombre}, 180 días. Ya eres leyenda, compa." },
  { days: 365, msg: "¡¡¡UN AÑO!!! 🏆🎉🌟 {nombre}, 365 días de libertad. No tengo palabras, carnal. ¡ERES INCREÍBLE!" },
];

const SOS_MESSAGE = `Estoy aquí, {nombre}. Vamos a hacer algo juntos ahora mismo. 🧘

<b>Ejercicio de grounding 5-4-3-2-1:</b>
👀 Dime <b>5 cosas</b> que puedas VER ahora mismo
✋ <b>4 cosas</b> que puedas TOCAR
👂 <b>3 cosas</b> que puedas ESCUCHAR
👃 <b>2 cosas</b> que puedas OLER
👅 <b>1 cosa</b> que puedas SABOREAR

Tómate tu tiempo, aquí espero. Y recuerda:
📞 <b>Línea de la Vida:</b> 800 911 2000 (24/7)
📞 <b>SAPTEL:</b> 55 5259 8121`;

const HIGH_CRISIS_RESPONSE = `Oye {nombre}, te escucho y estoy aquí contigo. 🤝 Lo que sientes es real y válido. Respira conmigo un momento...

Recuerda: un tropiezo no borra tu camino. Tus <b>{dias}</b> días cuentan.

Si necesitas hablar con alguien ahora mismo:
📞 <b>Línea de la Vida:</b> 800 911 2000 (24/7, gratuita)
📞 <b>SAPTEL:</b> 55 5259 8121`;

interface TGUpdate {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number; type: string };
    from: { id: number; first_name: string; username?: string };
    text?: string;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const update: TGUpdate = await req.json();
    if (!update.message?.text) return new Response(JSON.stringify({ ok: true }));

    const { message } = update;
    const chatId = message.chat.id;
    // Sanitize: strip control chars + zero-widths, hard-cap length.
    const text = message.text
      .replace(/[\u0000-\u001F\u007F\u200B-\u200F\u202A-\u202E\uFEFF]/g, "")
      .trim()
      .slice(0, 2000);

    if (!text) return new Response(JSON.stringify({ ok: true }));

    const { data: existingUser } = await supabase
      .from("telegram_users")
      .select("*")
      .eq("telegram_user_id", message.from.id)
      .maybeSingle();

    let user = existingUser;
    if (!user) {
      const { data: newUser } = await supabase
        .from("telegram_users")
        .insert({
          telegram_user_id: message.from.id,
          telegram_chat_id: chatId,
          telegram_username: message.from.username,
          first_name: message.from.first_name,
          onboarding_step: "ask_name",
        })
        .select()
        .single();
      user = newUser;
    }

    if (!user) {
      return new Response(JSON.stringify({ error: "user create failed" }), { status: 500 });
    }

    // Per-user soft rate limit: max 30 user messages / 60s window
    const since = new Date(Date.now() - 60_000).toISOString();
    const { count: recentCount } = await supabase
      .from("telegram_messages")
      .select("id", { count: "exact", head: true })
      .eq("message_type", "user")
      .eq("user_id", user.id)
      .gte("created_at", since);

    if ((recentCount ?? 0) > 30) {
      await supabase.from("security_alerts").insert({
        alert_type: "rate_limit_exceeded",
        severity: "warning",
        summary: "Posible flood / abuso del bot",
        details: {
          telegram_user_id: message.from.id,
          username: message.from.username,
          messages_last_minute: recentCount,
        },
        source_telegram_user_id: user.id,
      });
      return new Response(JSON.stringify({ ok: true, throttled: true }));
    }

    await supabase.from("telegram_messages").insert({
      user_id: user.id,
      message_type: "user",
      content: text,
      telegram_message_id: message.message_id,
    });

    const lower = text.toLowerCase();
    const sosTriggers = ["🆘", "/sos", "ayudame", "ayúdame", "necesito ayuda"];
    if (sosTriggers.some((t) => lower.includes(t))) {
      const reply = SOS_MESSAGE.replace("{nombre}", user.first_name || "compa");
      await sendTelegram(chatId, reply);
      await supabase.from("telegram_messages").insert({
        user_id: user.id,
        message_type: "bot",
        content: reply,
      });
      await supabase.from("crisis_flags").insert({
        user_id: user.id,
        severity: "high",
        trigger_keywords: ["sos_command"],
      });
      await supabase.from("bot_events").insert({
        user_id: user.id,
        event_type: "sos_triggered",
        severity: "critical",
        event_data: { text },
      });
      return new Response(JSON.stringify({ ok: true }));
    }

    if (text.startsWith("/")) {
      const cmd = text.split(" ")[0].substring(1).toLowerCase();
      let reply = "";
      if (cmd === "start") {
        await supabase
          .from("telegram_users")
          .update({ onboarding_step: "ask_name", onboarding_completed: false })
          .eq("id", user.id);
        reply = `¡Qué onda, compa! 🤙 Bienvenido a <b>Dry & High Five</b>. Soy tu compañero en este camino de libertad. Vamos a conocernos un poco...\n\n¿Cómo te llamo, carnal? 😊`;
      } else if (cmd === "help") {
        reply = `📚 Comandos disponibles:\n\n/start — Empezar de nuevo\n/status — Ver tu progreso\n/sos — Ayuda inmediata 🆘\n/help — Este menú\n\nTambién puedes solo escribirme lo que sientas. Aquí estoy. 💪`;
      } else if (cmd === "status") {
        const dias = daysSince(user.sobriety_start_date);
        reply = `📊 Tu estado, ${user.first_name || "compa"}:\n\n🎯 Días de sobriedad: <b>${dias ?? "—"}</b>\n⚡ Riesgo actual: ${user.risk_level}\n${user.onboarding_completed ? "✅ Onboarding completo" : "⏳ Onboarding en proceso"}`;
      } else {
        reply = "No reconozco ese comando, compa. Usa /help para ver qué puedo hacer. 🤙";
      }
      await sendTelegram(chatId, reply);
      await supabase.from("telegram_messages").insert({
        user_id: user.id,
        message_type: "bot",
        content: reply,
      });
      return new Response(JSON.stringify({ ok: true }));
    }

    const { data: settings } = await supabase
      .from("bot_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["crisis_keywords_high", "crisis_keywords_medium", "crisis_keywords_low"]);

    const kwHigh = (settings?.find((s) => s.setting_key === "crisis_keywords_high")?.setting_value as string[]) || [];
    const kwMed = (settings?.find((s) => s.setting_key === "crisis_keywords_medium")?.setting_value as string[]) || [];
    const kwLow = (settings?.find((s) => s.setting_key === "crisis_keywords_low")?.setting_value as string[]) || [];

    const matchedHigh = kwHigh.filter((k) => lower.includes(k.toLowerCase()));
    const matchedMed = kwMed.filter((k) => lower.includes(k.toLowerCase()));
    const matchedLow = kwLow.filter((k) => lower.includes(k.toLowerCase()));

    if (matchedHigh.length > 0) {
      const dias = daysSince(user.sobriety_start_date);
      const reply = HIGH_CRISIS_RESPONSE
        .replace("{nombre}", user.first_name || "compa")
        .replace("{dias}", String(dias ?? 0));
      await sendTelegram(chatId, reply);
      await supabase.from("telegram_messages").insert({
        user_id: user.id,
        message_type: "bot",
        content: reply,
      });
      await supabase.from("crisis_flags").insert({
        user_id: user.id,
        severity: "high",
        trigger_keywords: matchedHigh,
        response_sent: true,
      });
      await supabase
        .from("telegram_users")
        .update({ risk_level: "high", emotional_state: "crisis" })
        .eq("id", user.id);
      await supabase.from("bot_events").insert({
        user_id: user.id,
        event_type: "crisis_keyword_high",
        severity: "critical",
        event_data: { keywords: matchedHigh, text },
      });
      return new Response(JSON.stringify({ ok: true }));
    }

    if (matchedMed.length > 0) {
      await supabase.from("crisis_flags").insert({
        user_id: user.id,
        severity: "medium",
        trigger_keywords: matchedMed,
      });
      await supabase
        .from("telegram_users")
        .update({ risk_level: "medium" })
        .eq("id", user.id);
      await supabase.from("bot_events").insert({
        user_id: user.id,
        event_type: "crisis_keyword_medium",
        severity: "warning",
        event_data: { keywords: matchedMed },
      });
    } else if (matchedLow.length > 0) {
      await supabase.from("bot_events").insert({
        user_id: user.id,
        event_type: "crisis_keyword_low",
        severity: "info",
        event_data: { keywords: matchedLow },
      });
    }

    if (!user.onboarding_completed) {
      const reply = await handleOnboarding(supabase, user, text, chatId);
      if (reply) {
        await sendTelegram(chatId, reply);
        await supabase.from("telegram_messages").insert({
          user_id: user.id,
          message_type: "bot",
          content: reply,
        });
        return new Response(JSON.stringify({ ok: true }));
      }
    }

    const aiResp = await fetch(`${SUPABASE_URL}/functions/v1/ai-agent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ message: text, telegram_user_id: user.id }),
    });
    const aiData = await aiResp.json();
    const aiText = aiData.response || "Te escucho, compa. ¿Me cuentas más?";

    await sendTelegram(chatId, aiText);
    await supabase.from("telegram_messages").insert({
      user_id: user.id,
      message_type: "bot",
      content: aiText,
      ai_confidence: aiData.confidence ?? null,
    });

    await supabase
      .from("telegram_users")
      .update({ last_interaction_at: new Date().toISOString() })
      .eq("id", user.id);

    await checkMilestone(supabase, user, chatId);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("router error", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleOnboarding(
  supabase: ReturnType<typeof createClient>,
  user: Record<string, unknown>,
  text: string,
  _chatId: number,
): Promise<string | null> {
  const step = user.onboarding_step as string | null;

  if (!step || step === "ask_name") {
    if (!step) {
      await supabase.from("telegram_users").update({ onboarding_step: "got_name" }).eq("id", user.id);
      return `¡Qué onda, compa! 🤙 Bienvenido a <b>Dry & High Five</b>. Soy tu compañero en este camino de libertad. Vamos a conocernos un poco...\n\n¿Cómo te llamo, carnal? 😊`;
    }
    const name = text.split(" ").slice(0, 3).join(" ").substring(0, 50);
    await supabase
      .from("telegram_users")
      .update({ first_name: name, onboarding_step: "ask_date" })
      .eq("id", user.id);
    return `¡Mucho gusto, <b>${name}</b>! 🙌\n\nCuéntame, ¿cuándo empezó tu camino de sobriedad? Dime la fecha en formato <b>dd/mm/aaaa</b> (ejemplo: 15/03/2026). Si hoy es tu día 1, escribe <b>"hoy"</b>. 📅`;
  }

  if (step === "got_name") {
    const name = text.split(" ").slice(0, 3).join(" ").substring(0, 50);
    await supabase
      .from("telegram_users")
      .update({ first_name: name, onboarding_step: "ask_date" })
      .eq("id", user.id);
    return `¡Mucho gusto, <b>${name}</b>! 🙌\n\nCuéntame, ¿cuándo empezó tu camino de sobriedad? Dime la fecha en formato <b>dd/mm/aaaa</b> (ejemplo: 15/03/2026). Si hoy es tu día 1, escribe <b>"hoy"</b>. 📅`;
  }

  if (step === "ask_date") {
    let date: string | null = null;
    if (text.toLowerCase() === "hoy") {
      date = new Date().toISOString().slice(0, 10);
    } else {
      date = parseDateMx(text);
    }
    if (!date) {
      return "Mmm, no pude leer la fecha. Mándamela como <b>dd/mm/aaaa</b> (ejemplo: 15/03/2026) o escribe <b>hoy</b>. 🙏";
    }
    await supabase
      .from("telegram_users")
      .update({ sobriety_start_date: date, onboarding_step: "ask_times" })
      .eq("id", user.id);
    return `¡Va! 📌 Anotado.\n\nÚltima cosita: ¿a qué hora te late que te mande un saludo en la <b>mañana</b> y otro en la <b>noche</b>? Mándamelas así: <b>8:00 y 20:00</b>. ⏰`;
  }

  if (step === "ask_times") {
    const m = text.match(/(\d{1,2}):?(\d{0,2}).*?(\d{1,2}):?(\d{0,2})/);
    let morning = "08:00";
    let evening = "20:00";
    if (m) {
      const h1 = m[1].padStart(2, "0");
      const min1 = (m[2] || "00").padStart(2, "0");
      const h2 = m[3].padStart(2, "0");
      const min2 = (m[4] || "00").padStart(2, "0");
      morning = `${h1}:${min1}`;
      evening = `${h2}:${min2}`;
    }
    const dias = daysSince(user.sobriety_start_date as string | null);
    await supabase
      .from("telegram_users")
      .update({
        preferred_checkin_morning: morning,
        preferred_checkin_evening: evening,
        onboarding_completed: true,
        onboarding_step: "completed",
      })
      .eq("id", user.id);
    await supabase.from("bot_events").insert({
      user_id: user.id,
      event_type: "onboarding_completed",
      event_data: { morning, evening },
    });
    return `¡Órale, <b>${user.first_name}</b>! 🎉 Ya estás dentro.\n\nLlevas <b>${dias ?? 0}</b> día(s) de libertad y eso es de admirar. Te mandaré un saludo a las <b>${morning}</b> y a las <b>${evening}</b>.\n\nAquí estoy para lo que necesites, compa. 💪 Si en algún momento la cosa se pone difícil, escribe <b>/sos</b> y te ayudo al instante.`;
  }

  return null;
}

async function checkMilestone(
  supabase: ReturnType<typeof createClient>,
  user: Record<string, unknown>,
  chatId: number,
) {
  const dias = daysSince(user.sobriety_start_date as string | null);
  if (dias === null) return;

  const milestone = MILESTONES.find((m) => m.days === dias);
  if (!milestone) return;

  const { data: existing } = await supabase
    .from("milestones")
    .select("id, celebrated")
    .eq("telegram_user_id", user.id as string)
    .eq("days_count", dias)
    .maybeSingle();

  if (existing?.celebrated) return;

  const msg = milestone.msg.replace("{nombre}", (user.first_name as string) || "compa");
  await sendTelegram(chatId, msg);
  await supabase.from("telegram_messages").insert({
    user_id: user.id,
    message_type: "bot",
    content: msg,
  });

  if (existing) {
    await supabase.from("milestones").update({ celebrated: true }).eq("id", existing.id);
  } else {
    await supabase.from("milestones").insert({
      telegram_user_id: user.id,
      milestone_type: `day_${dias}`,
      days_count: dias,
      celebrated: true,
    });
  }
}
