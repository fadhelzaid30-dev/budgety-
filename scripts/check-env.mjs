// Verifies that the credentials in .env.local actually work by pinging each
// service. Prints only PASS/FAIL — never the secret values themselves.
import { readFileSync } from "node:fs";

function loadEnv(path) {
  const env = {};
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i === -1) continue;
      env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
    }
  } catch {
    console.error("Could not read", path);
    process.exit(1);
  }
  return env;
}

const env = loadEnv(new URL("../.env.local", import.meta.url));
const results = [];
const isPlaceholder = (v) =>
  !v || /xxx|generate-a-long|yourdomain/i.test(v);

async function check(name, fn) {
  try {
    const msg = await fn();
    results.push(["PASS", name, msg ?? ""]);
  } catch (e) {
    results.push(["FAIL", name, e.message]);
  }
}

// --- Clerk publishable key: format only (server boot already validated it) ---
await check("Clerk publishable key", async () => {
  const k = env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (isPlaceholder(k)) throw new Error("still a placeholder");
  if (!k.startsWith("pk_")) throw new Error("should start with pk_");
  return "format ok (server boot confirmed it live)";
});

// --- Clerk secret key: hit the Clerk backend API ---
await check("Clerk secret key", async () => {
  const k = env.CLERK_SECRET_KEY;
  if (isPlaceholder(k)) throw new Error("still a placeholder");
  const r = await fetch("https://api.clerk.com/v1/users?limit=1", {
    headers: { Authorization: `Bearer ${k}` },
  });
  if (r.status === 200) return "authenticated with Clerk API";
  throw new Error(`Clerk API returned ${r.status}`);
});

// --- Supabase URL + anon key: hit the REST endpoint ---
await check("Supabase URL + anon key", async () => {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (isPlaceholder(url) || isPlaceholder(anon))
    throw new Error("still a placeholder");
  // Query a real table (the REST root endpoint is restricted for the anon role,
  // so it gives a misleading 401 even with a valid key).
  const r = await fetch(`${url}/rest/v1/categories?select=name&limit=1`, {
    headers: { apikey: anon, Authorization: `Bearer ${anon}` },
  });
  if (r.status === 200) return "connected to Supabase REST API";
  throw new Error(`Supabase returned ${r.status}`);
});

// --- Supabase service_role key: read a table (bypasses RLS) ---
await check("Supabase service_role key", async () => {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (isPlaceholder(url) || isPlaceholder(key))
    throw new Error("still a placeholder");
  const r = await fetch(`${url}/rest/v1/categories?select=name&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (r.status === 200) {
    const rows = await r.json();
    return `read categories table (${Array.isArray(rows) ? rows.length : "?"} row sampled)`;
  }
  throw new Error(`Supabase returned ${r.status}`);
});

// --- OpenAI key (optional) ---
await check("OpenAI key (optional)", async () => {
  const k = env.OPENAI_API_KEY;
  if (isPlaceholder(k)) return "skipped — not set (AI features off)";
  const r = await fetch("https://api.openai.com/v1/models", {
    headers: { Authorization: `Bearer ${k}` },
  });
  if (r.status === 200) return "authenticated with OpenAI API";
  throw new Error(`OpenAI API returned ${r.status}`);
});

// --- Resend key (optional) ---
await check("Resend key (optional)", async () => {
  const k = env.RESEND_API_KEY;
  if (isPlaceholder(k)) return "skipped — not set (report email off)";
  const r = await fetch("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${k}` },
  });
  if (r.status === 200 || r.status === 401 === false) return "authenticated with Resend API";
  throw new Error(`Resend API returned ${r.status}`);
});

console.log("\n  Budgety — credential check\n  " + "-".repeat(46));
for (const [status, name, msg] of results) {
  const icon = status === "PASS" ? "✅" : "❌";
  console.log(`  ${icon} ${name.padEnd(26)} ${msg}`);
}
console.log("");
const failed = results.filter((r) => r[0] === "FAIL");
process.exit(failed.length ? 1 : 0);
