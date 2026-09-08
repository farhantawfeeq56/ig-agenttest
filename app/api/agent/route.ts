import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

// ponytail: every known location — the server's env varies by how it was launched, and the exe needs no env to run.
const KNOWN = "C:/Users/Welcome/AppData/Local/hermes/bin/hermes.exe";
const CANDS = [
  process.env.HERMES_BIN,
  process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, "hermes", "bin", "hermes.exe"),
  process.env.USERPROFILE && join(process.env.USERPROFILE, "AppData", "Local", "hermes", "bin", "hermes.exe"),
  existsSync(KNOWN) ? KNOWN : null,
  "hermes",
].filter((b): b is string => !!b);
const BINS = [...new Set(CANDS)];

function run(prompt: string, bin: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    execFile(bin, ["-z", prompt], { timeout: 280_000, maxBuffer: 2 * 1024 * 1024 }, (err, stdout, stderr) =>
      err ? reject(new Error(stderr.trim() || err.message)) : resolve(stdout.trim() || "(empty)"),
    );
  });
}

export async function POST(req: Request) {
  const { prompt = "" }: { prompt?: string } = await req.json().catch(() => ({}));
  if (!prompt.trim()) return Response.json({ error: "empty prompt" }, { status: 400 });
  const tried: string[] = [];
  for (const bin of BINS) {
    try {
      return Response.json({ output: await run(prompt, bin) });
    } catch (e) {
      tried.push(`${bin} (${e instanceof Error ? e.message : String(e)})`);
    }
  }
  return Response.json({ error: `agent failed, tried: ${tried.join("; ")}` }, { status: 502 });
}
