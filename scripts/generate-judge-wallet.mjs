// Generates the BEEF judge server wallet for Monad and stores the private key
// in .env.local (git-ignored). Prints ONLY the public address.
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const ENV_PATH = new URL("../.env.local", import.meta.url);
const KEY_NAME = "MONAD_JUDGE_PRIVATE_KEY";

let env = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, "utf8") : "";

const existing = env
  .split(/\r?\n/)
  .find((line) => line.startsWith(`${KEY_NAME}=`));

if (existing) {
  const key = existing.slice(KEY_NAME.length + 1).trim();
  const account = privateKeyToAccount(key);
  console.log(`EXISTING ${account.address}`);
} else {
  const key = generatePrivateKey();
  const account = privateKeyToAccount(key);
  env = env.trimEnd() + `\n\n# Monad testnet server wallet (judge signer) — NEVER commit\n${KEY_NAME}=${key}\n`;
  writeFileSync(ENV_PATH, env);
  console.log(`CREATED ${account.address}`);
}
