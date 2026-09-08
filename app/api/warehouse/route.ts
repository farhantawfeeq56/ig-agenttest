type Company = { name: string; url: string; blurb: string };

const HERMES_URL =
  process.env.HERMES_API_URL ?? "http://127.0.0.1:8642/v1/chat/completions";
const HERMES_KEY = process.env.HERMES_API_KEY ?? "warehouse-dev-key-123";

// ponytail: static fallback so the demo never dead-ends when the gateway is down; delete if you want hard failures.
const FALLBACK: Company[] = [
  { name: "GXO Logistics", url: "https://www.gxologistics.com", blurb: "Large contract logistics and warehouse operator." },
  { name: "Prologis", url: "https://www.prologis.com", blurb: "Global warehouse property owner and operator." },
  { name: "DSV", url: "https://www.dsv.com", blurb: "Global freight and contract logistics provider." },
  { name: "Kuehne+Nagel", url: "https://www.kuehne-nagel.com", blurb: "Sea, air and contract logistics worldwide." },
  { name: "Lineage", url: "https://www.onelineage.com", blurb: "World's largest cold-storage warehouse REIT." },
];

function extract(content: string): Company[] | null {
  const m = content.match(/\[[\s\S]*\]/);
  if (!m) return null;
  try {
    const arr = JSON.parse(m[0]);
    if (!Array.isArray(arr)) return null;
    const out = arr
      .filter((c) => c && typeof c.name === "string")
      .slice(0, 5)
      .map((c) => ({
        name: String(c.name).slice(0, 80),
        url: String(c.url ?? "").slice(0, 200),
        blurb: String(c.blurb ?? "").slice(0, 120),
      }));
    return out.length ? out : null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const { exclude = [] }: { exclude?: string[] } = await req
    .json()
    .catch(() => ({}));
  const avoid =
    exclude.length > 0
      ? ` Avoid these already shown: ${exclude.slice(0, 60).join(", ")}.`
      : "";
  try {
    const r = await fetch(HERMES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HERMES_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "hermes-agent",
        stream: false,
        messages: [
          {
            role: "user",
            content: `Use your browser and web search tools to visit warehouse-related websites and find 5 real warehouse/logistics companies.${avoid} Each url must be the company's own homepage, not a directory or rankings page. Reply with ONLY a JSON array of 5 objects with keys name, url, blurb (under 12 words each). No other text.`,
          },
        ],
      }),
      signal: AbortSignal.timeout(280_000),
    });
    if (!r.ok) throw new Error(`hermes ${r.status}`);
    const data = await r.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";
    const companies = extract(content);
    if (!companies) throw new Error("unparseable");
    return Response.json({ companies, via: "hermes" });
  } catch {
    const seen = new Set(exclude);
    const fb = FALLBACK.filter((c) => !seen.has(c.name));
    return Response.json({
      companies: (fb.length ? fb : FALLBACK).slice(0, 5),
      via: "fallback",
    });
  }
}
