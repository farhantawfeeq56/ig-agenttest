import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

// ponytail: absolute path — the Next server's PATH often lacks the hermes bin dir, so bare "hermes" spawns ENOENT.
const ABS = join(process.env.LOCALAPPDATA ?? "", "hermes", "bin", "hermes.exe");
const BIN = process.env.HERMES_BIN ?? (existsSync(ABS) ? ABS : "hermes");

export async function POST(req: Request) {
  const { prompt = "" }: { prompt?: string } = await req.json().catch(() => ({}));
  if (!prompt.trim()) return Response.json({ error: "empty prompt" }, { status: 400 });
  try {
    const output = await new Promise<string>((resolve, reject) => {
      execFile(BIN, ["-z", prompt], { timeout: 280_000, maxBuffer: 2 * 1024 * 1024 }, (err, stdout, stderr) =>
        err ? reject(new Error(stderr.trim() || err.message)) : resolve(stdout.trim() || "(empty)"),
      );
    });
    return Response.json({ output });
  } catch (e) {
    return Response.json({ error: `agent failed: ${e instanceof Error ? e.message : String(e)}` }, { status: 502 });
  }
}
