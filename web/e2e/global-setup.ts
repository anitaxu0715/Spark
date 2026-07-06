import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function localEnvironment(repositoryRoot: string) {
  const values = new Map<string, string>();
  const source = fs.readFileSync(path.join(repositoryRoot, "web/.env.local"), "utf8");
  for (const line of source.split(/\r?\n/)) {
    const separator = line.indexOf("=");
    if (separator > 0) values.set(line.slice(0, separator), line.slice(separator + 1));
  }
  return values;
}

export default async function globalSetup() {
  const repositoryRoot = path.resolve(__dirname, "../..");
  const cli = path.join(repositoryRoot, "web/node_modules/supabase/dist/supabase.js");
  execFileSync(process.execPath, [cli, "db", "reset", "--local", "--workdir", repositoryRoot], {
    cwd: repositoryRoot,
    stdio: "inherit",
  });

  const environment = localEnvironment(repositoryRoot);
  const apiUrl = environment.get("NEXT_PUBLIC_SUPABASE_URL");
  const key = environment.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  if (!apiUrl || !key) throw new Error("Local Supabase environment is incomplete.");
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const [auth, rest] = await Promise.all([
        fetch(`${apiUrl}/auth/v1/health`),
        fetch(`${apiUrl}/rest/v1/university_domains?select=domain&limit=1`, {
          headers: { apikey: key, Authorization: `Bearer ${key}` },
        }),
      ]);
      if (auth.ok && rest.ok) return;
    } catch {
      // Local containers are still reconnecting after the reset.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Local Supabase services did not become ready after the database reset.");
}
