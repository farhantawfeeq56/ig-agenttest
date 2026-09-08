"use client";
import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setOutput("");
    try {
      const r = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const d = await r.json();
      setOutput(d.output ?? d.error ?? "failed");
    } catch (e) {
      setOutput(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-4 p-8 font-sans">
      <h1 className="text-2xl font-semibold">Agent</h1>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) run(); }}
        placeholder="Ask anything… (Ctrl+Enter to run)"
        rows={5}
        className="w-full rounded-lg border border-black/10 p-3 text-sm dark:border-white/15"
      />
      <button
        onClick={run}
        disabled={loading || !prompt.trim()}
        className="h-11 w-36 rounded-full bg-black text-white disabled:opacity-40 dark:bg-white dark:text-black"
      >
        {loading ? "Running…" : "Run"}
      </button>
      {output && <pre className="whitespace-pre-wrap rounded-lg border border-black/10 p-4 text-sm dark:border-white/15">{output}</pre>}
    </main>
  );
}
