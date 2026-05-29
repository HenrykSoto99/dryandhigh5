// Shared internal-secret guard for edge functions that are not user-facing.
// Returns null when authorized; otherwise a Response to return immediately.
export function requireInternalSecret(req: Request): Response | null {
  const expected = Deno.env.get("INTERNAL_FUNCTION_SECRET");
  if (!expected) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  const provided =
    req.headers.get("x-internal-secret") ||
    req.headers.get("X-Internal-Secret");
  if (!provided || provided !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}
