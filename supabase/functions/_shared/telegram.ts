// Shared helpers used by all telegram edge functions.
// Note: Deno edge functions cannot import from outside their folder using relative paths
// reliably in deploy, so we keep this in _shared and import via relative path.

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

export async function sendTelegram(chatId: number, text: string, parseMode: "HTML" | "Markdown" = "HTML") {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
  const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY")!;
  const r = await fetch(`${GATEWAY_URL}/sendMessage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TELEGRAM_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
  });
  if (!r.ok) {
    const body = await r.text();
    console.error("sendTelegram failed", r.status, body);
  }
  return r.ok;
}

export function daysSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const start = new Date(dateStr).getTime();
  if (isNaN(start)) return null;
  return Math.floor((Date.now() - start) / 86_400_000);
}

export function parseDateMx(input: string): string | null {
  // Accept dd/mm/yyyy or yyyy-mm-dd or dd-mm-yyyy
  const trimmed = input.trim();
  let m = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    const dd = d.padStart(2, "0");
    const mm = mo.padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  }
  m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return trimmed;
  return null;
}
