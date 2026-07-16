import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const teamId = "team_f7ZDi8IQ0mmPXO3BE0oQzuKy";
const project = "beef";
const token = process.env.VERCEL_TOKEN;

if (!token) {
  console.error("Missing VERCEL_TOKEN. Create one at https://vercel.com/account/tokens");
  process.exit(1);
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    const hash = value.indexOf(" #");
    if (hash !== -1) value = value.slice(0, hash).trim();
    out[key] = value;
  }
  return out;
}

const env = {
  ...parseEnvFile(path.join(root, ".env")),
  ...parseEnvFile(path.join(root, ".env.local")),
  REPORT_EMAIL_USER: "barsbuildme@gmail.com",
  NEXT_PUBLIC_APP_URL: "https://beef-beige.vercel.app",
};

const targets = ["production", "preview", "development"];

async function upsertEnv(key, value) {
  const res = await fetch(
    `https://api.vercel.com/v10/projects/${project}/env?upsert=true&teamId=${teamId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key,
        value,
        type: "encrypted",
        target: targets,
      }),
    },
  );

  const body = await res.text();
  if (!res.ok) {
    throw new Error(`${key}: ${res.status} ${body}`);
  }
  return key;
}

const keys = [
  "NEXT_PUBLIC_CONVEX_URL",
  "NEXT_PUBLIC_CONVEX_SITE_URL",
  "CONVEX_DEPLOYMENT",
  "OPENAI_MODEL_ID",
  "OPENAI_API_KEY",
  "REPORT_EMAIL_USER",
  "REPORT_EMAIL_PASS",
  "NEXT_PUBLIC_APP_URL",
];

const results = [];
for (const key of keys) {
  const value = env[key];
  if (!value) {
    console.warn(`skip ${key} (empty)`);
    continue;
  }
  results.push(await upsertEnv(key, value));
}

console.log(JSON.stringify({ ok: true, set: results }));
