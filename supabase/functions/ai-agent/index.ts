import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AIRequest {
  message: string;
  user_id: string;
  user_context: {
    first_name?: string;
    sobriety_start_date?: string;
    risk_level?: string;
    emotional_state?: string;
  };
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

async function getConversationHistory(userId: string): Promise<ConversationMessage[]> {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/telegram_messages?user_id=eq.${userId}&order=created_at.desc&limit=20`,
    {
      headers: {
        "apikey": SUPABASE_SERVICE_ROLE_KEY || "",
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );

  const messages = await response.json();

  const history: ConversationMessage[] = messages
    .reverse()
    .map((msg: Record<string, unknown>) => ({
      role: msg.message_type === "user" ? "user" : "assistant",
      content: msg.content as string,
    }));

  return history;
}

function buildSystemPrompt(userContext: AIRequest["user_context"]): string {
  let prompt = `Eres el asistente de Dry & High Five, un acompañante de sobriedad empático, jovial y en español mexicano.

Tu identidad y tono:
- Nunca juzgas, solo escuchas y apoyas
- Celebras logros pequeños y grandes
- Usas términos cariñosos como "compa", "hermano", "carnal", "bro", "dale", "tranqui"
- Eres amigable, cálido y genuino
- No haces sermones ni predicciones sobre el futuro
- Respuestas naturales y conversacionales

Tu propósito:
- Proporcionar apoyo emocional en el camino de sobriedad
- Escuchar activamente sin juzgar
- Ayudar con estrategias de afrontamiento
- Detectar señales de crisis y responder con empatía
- Celebrar días de sobriedad y progreso

Límites claros:
- NUNCA ofrezcas consejo médico o psicológico profesional
- Si alguien menciona urgencia médica, recomienda llamar al 911
- Para problemas clínicos, sugiere hablar con un profesional de salud mental`;

  if (userContext.first_name) {
    prompt += `\n\nNombre del usuario: ${userContext.first_name}`;
  }

  if (userContext.sobriety_start_date) {
    const days = Math.floor(
      (new Date().getTime() - new Date(userContext.sobriety_start_date).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    prompt += `\nDías de sobriedad: ${days} días`;
  }

  if (userContext.risk_level) {
    prompt += `\nNivel de riesgo actual: ${userContext.risk_level}`;
  }

  if (userContext.emotional_state) {
    prompt += `\nEstado emocional anterior: ${userContext.emotional_state}`;
  }

  prompt += `\n\nResponde siempre en español mexicano auténtico. Mantén respuestas concisas pero significativas. Sé empático y cálido.`;

  return prompt;
}

async function callOpenRouter(
  messages: ConversationMessage[],
  systemPrompt: string
): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": Deno.env.get("SUPABASE_URL") || "https://dryandHighFive.app",
      "X-Title": "Dry & High Five Bot",
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-lite:free",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("OpenRouter error:", error);
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.choices || !data.choices[0]?.message?.content) {
    throw new Error("Invalid response from OpenRouter");
  }

  return data.choices[0].message.content;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const payload: AIRequest = await req.json();

    const { message, user_id, user_context } = payload;

    if (!message || !user_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get conversation history
    const history = await getConversationHistory(user_id);

    // Add current message to history
    const messages: ConversationMessage[] = [
      ...history,
      {
        role: "user",
        content: message,
      },
    ];

    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(user_context);

    // Call OpenRouter API
    const aiResponse = await callOpenRouter(messages, systemPrompt);

    return new Response(
      JSON.stringify({
        response: aiResponse,
        confidence: 0.95,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("AI Agent error:", error);
    return new Response(
      JSON.stringify({
        error: String(error),
        response:
          "Lo siento, compa. Tuve un pequeño problema procesando eso. Intenta de nuevo.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
