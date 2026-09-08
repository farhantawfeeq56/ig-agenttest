const URL = process.env.HERMES_API_URL ?? "http://127.0.0.1:8642/v1/chat/completions";
const KEY = process.env.HERMES_API_KEY ?? "warehouse-dev-key-123";

export async function POST(req: Request) {
  const { prompt = "" }: { prompt?: string } = await req.json().catch(() => ({}));
  if (!prompt.trim()) return Response.json({ error: "empty prompt" }, { status: 400 });
  try {
    const r = await fetch(URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "hermes-agent", stream: false, messages: [{ role: "user", content: prompt }] }),
      signal: AbortSignal.timeout(280_000),
    });
    if (!r.ok) throw new Error(`hermes ${r.status}`);
    const data = await r.json();
    return Response.json({ output: data?.choices?.[0]?.message?.content ?? "(empty)" });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 502 });
  }
}
