import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    date: number;
    chat: {
      id: number;
      type: string;
      username?: string;
      first_name?: string;
    };
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
      language_code?: string;
    };
    text?: string;
  };
}

interface TelegramResponse {
  ok: boolean;
  result?: Record<string, unknown>;
}

const TELEGRAM_API = "https://api.telegram.org/bot";
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

async function sendTelegramMessage(
  chatId: number,
  text: string
): Promise<TelegramResponse> {
  const response = await fetch(
    `${TELEGRAM_API}${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "HTML",
      }),
    }
  );
  return response.json();
}

async function getOrCreateUser(update: TelegramUpdate) {
  if (!update.message) return null;

  const { chat, from } = update.message;
  const telegramUserId = from.id;
  const telegramChatId = chat.id;

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/telegram_users?telegram_user_id=eq.${telegramUserId}`,
    {
      method: "GET",
      headers: {
        "apikey": SUPABASE_SERVICE_ROLE_KEY || "",
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );

  const users = await response.json();

  if (users.length > 0) {
    return users[0];
  }

  const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/telegram_users`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_SERVICE_ROLE_KEY || "",
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
    },
    body: JSON.stringify({
      telegram_user_id: telegramUserId,
      telegram_chat_id: telegramChatId,
      telegram_username: from.username || null,
      first_name: from.first_name,
    }),
  });

  const newUsers = await createResponse.json();
  return newUsers[0] || null;
}

async function logEvent(userId: string, eventType: string, eventData: Record<string, unknown>) {
  await fetch(`${SUPABASE_URL}/rest/v1/bot_events`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_SERVICE_ROLE_KEY || "",
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
      event_type: eventType,
      event_data: eventData,
    }),
  });
}

async function handleCommand(
  update: TelegramUpdate,
  user: Record<string, unknown>,
  command: string
): Promise<string> {
  const chatId = update.message?.chat.id;
  const firstName = update.message?.from.first_name || "Compa";

  switch (command) {
    case "start":
      await logEvent(user.id as string, "user_started_bot", {
        username: user.telegram_username,
        first_name: user.first_name,
      });
      return `¡Hola ${firstName}! 👋 Bienvenido a Dry & High Five, tu acompañante de sobriedad.\n\nSoy tu compa virtual para apoyarte en tu camino de libertad. Juntos vamos a:\n✨ Celebrar tus días sin alcohol\n💪 Apoyarte en momentos difíciles\n🎯 Mantener tu enfoque en la sobriedad\n\nCuéntame tu nombre y te gustaría saber tu fecha de sobriedad (o si hoy es tu día 1). ¿Listo para empezar?`;

    case "help":
      return `📚 Aquí está lo que puedo hacer por ti:\n\n/start - Comenzar la configuración\n/status - Ver tu progreso\n/reset - Reiniciar conversación\n/help - Este menú\n\nTambién puedo:\n💬 Escucharte sin juzgar\n🚨 Apoyarte en momentos de crisis\n📅 Recordarte tu progreso\n\n¿En qué te puedo ayudar?`;

    case "status":
      const sobrietyDate = user.sobriety_start_date as string;
      let statusMsg = `📊 Tu estado actual:\n\n`;
      if (sobrietyDate) {
        const days = Math.floor(
          (new Date().getTime() - new Date(sobrietyDate).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        statusMsg += `🎯 Días de sobriedad: <b>${days}</b> días\n`;
      }
      statusMsg += `⚡ Nivel de riesgo: ${user.risk_level}\n`;
      statusMsg += `📝 Onboarding completado: ${user.onboarding_completed ? "Sí ✅" : "No ⏳"}\n`;
      return statusMsg;

    case "reset":
      await fetch(`${SUPABASE_URL}/rest/v1/telegram_conversations?user_id=eq.${user.id}`, {
        method: "DELETE",
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY || "",
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      });
      await logEvent(user.id as string, "conversation_reset", {});
      return `✨ Conversación reiniciada. Podemos empezar de cero cuando quieras. ¿Cómo te sientes ahora?`;

    default:
      return `No reconozco ese comando. Usa /help para ver qué puedo hacer por ti.`;
  }
}

async function detectCrisisKeywords(message: string): Promise<string[]> {
  const crisisResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/bot_settings?setting_key=eq.crisis_keywords`,
    {
      headers: {
        "apikey": SUPABASE_SERVICE_ROLE_KEY || "",
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );

  const settings = await crisisResponse.json();
  if (settings.length === 0) return [];

  const keywords = JSON.parse(settings[0].setting_value) as string[];
  const lowerMessage = message.toLowerCase();
  return keywords.filter((k) => lowerMessage.includes(k.toLowerCase()));
}

async function callAIAgent(
  message: string,
  user: Record<string, unknown>
): Promise<string> {
  const aiUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/ai-agent`;

  const response = await fetch(aiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      message,
      user_id: user.id,
      user_context: {
        first_name: user.first_name,
        sobriety_start_date: user.sobriety_start_date,
        risk_level: user.risk_level,
        emotional_state: user.emotional_state,
      },
    }),
  });

  if (!response.ok) {
    return "Lo siento compa, tuve un problema para procesar tu mensaje. Intenta de nuevo.";
  }

  const data = await response.json();
  return data.response || "No pude entender eso. ¿Puedes repetir?";
}

async function handleMessage(update: TelegramUpdate): Promise<string> {
  if (!update.message?.text) return "";

  const user = await getOrCreateUser(update);
  if (!user) return "";

  const text = update.message.text;
  const chatId = update.message.chat.id;

  // Check for commands
  if (text.startsWith("/")) {
    const command = text.split(" ")[0].substring(1).toLowerCase();
    const response = await handleCommand(update, user, command);
    await sendTelegramMessage(chatId, response);
    return "ok";
  }

  // Log user message
  await fetch(`${SUPABASE_URL}/rest/v1/telegram_messages`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_SERVICE_ROLE_KEY || "",
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: user.id,
      message_type: "user",
      content: text,
      telegram_message_id: update.message.message_id,
    }),
  });

  await logEvent(user.id as string, "user_message_received", {
    message: text,
  });

  // Detect crisis keywords
  const detectedKeywords = await detectCrisisKeywords(text);
  if (detectedKeywords.length > 0) {
    await fetch(`${SUPABASE_URL}/rest/v1/crisis_flags`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_SERVICE_ROLE_KEY || "",
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: user.id,
        severity: "high",
        trigger_keywords: detectedKeywords,
      }),
    });

    await logEvent(user.id as string, "crisis_keyword_detected", {
      keywords: detectedKeywords,
      message: text,
    });
  }

  // Call AI agent
  const aiResponse = await callAIAgent(text, user);

  // Log bot response
  await fetch(`${SUPABASE_URL}/rest/v1/telegram_messages`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_SERVICE_ROLE_KEY || "",
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: user.id,
      message_type: "bot",
      content: aiResponse,
    }),
  });

  await logEvent(user.id as string, "ai_response_sent", {
    response: aiResponse,
  });

  // Send response to Telegram
  await sendTelegramMessage(chatId, aiResponse);

  // Update last interaction
  await fetch(
    `${SUPABASE_URL}/rest/v1/telegram_users?id=eq.${user.id}`,
    {
      method: "PATCH",
      headers: {
        "apikey": SUPABASE_SERVICE_ROLE_KEY || "",
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        last_interaction_at: new Date().toISOString(),
      }),
    }
  );

  return "ok";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const update: TelegramUpdate = await req.json();

    if (update.message) {
      await handleMessage(update);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});
