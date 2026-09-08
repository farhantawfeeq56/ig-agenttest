import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

// ponytail: try every known location — server PATH often lacks the hermes bin dir (ENOENT), and env varies by how the server was launched.
const ABS = join(process.env.LOCALAPPDATA ?? "", "hermes", "bin", "hermes.exe");
const BINS = [process.env.HERMES_BIN, existsSync(ABS) ? ABS : null, "hermes"].filter((b): b is string => !!b);

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
  let last = "";
  for (const bin of BINS) {
    try {
      return Response.json({ output: await run(prompt, bin) });
    } catch (e) {
      last = `${bin}: ${e instanceof Error ? e.message : String(e)}`;
      if (!/enoent/i.test(last)) return Response.json({ error: `agent failed: ${last}` }, { status: 502 });
    }
  }
  return Response.json({ error: `agent failed: ${last}` }, { status: 502 });
}
