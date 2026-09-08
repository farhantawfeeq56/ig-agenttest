"use client";

import { useState } from "react";

type Company = { name: string; url: string; blurb: string };

export default function Home() {
  const [batches, setBatches] = useState<Company[][]>([]);
  const [loading, setLoading] = useState(false);
  const [via, setVia] = useState<string | null>(null);

  async function addFive() {
    if (loading) return;
    setLoading(true);
    try {
      const exclude = batches.flat().map((c) => c.name);
      const r = await fetch("/api/warehouse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exclude }),
      });
      const data = await r.json();
      setBatches((b) => [...b, data.companies ?? []]);
      setVia(data.via ?? null);
    } finally {
      setLoading(false);
    }
  }

  const total = batches.flat().length;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 p-8 font-sans">
      <div>
        <h1 className="text-2xl font-semibold">Warehouse finder</h1>
        <p className="text-sm text-zinc-500">
          Powered by Hermes Agent API server (browser + web search).
          {total > 0 && ` ${total} companies so far.`}
          {via === "fallback" && " Hermes unreachable — showing fallback list."}
        </p>
      </div>

      <button
        onClick={addFive}
        disabled={loading}
        className="h-12 w-56 rounded-full bg-black text-white transition-opacity hover:opacity-80 disabled:opacity-40 dark:bg-white dark:text-black"
      >
        {loading ? "Searching warehouses…" : "+ Add 5 warehouses"}
      </button>

      <div className="flex flex-col gap-6">
        {batches.map((batch, i) => (
          <section key={i}>
            <h2 className="mb-2 text-sm font-medium text-zinc-500">
              Batch {i + 1}
            </h2>
            <ul className="flex flex-col gap-2">
              {batch.map((c) => (
                <li
                  key={c.name}
                  className="rounded-lg border border-black/10 p-3 dark:border-white/15"
                >
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline"
                  >
                    {c.name}
                  </a>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {c.blurb}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
