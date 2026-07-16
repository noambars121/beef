// Polls the judge wallet balance on Monad testnet until it is funded.
// Exits 0 when MON arrives, 3 on timeout (45 min).
import { createPublicClient, http, formatEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const key = env
  .split(/\r?\n/)
  .find((l) => l.startsWith("MONAD_JUDGE_PRIVATE_KEY="))
  .slice("MONAD_JUDGE_PRIVATE_KEY=".length)
  .trim();

const account = privateKeyToAccount(key);
const client = createPublicClient({
  chain: { id: 10143, name: "Monad Testnet", nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 }, rpcUrls: { default: { http: ["https://testnet-rpc.monad.xyz"] } } },
  transport: http(),
});

const DEADLINE = Date.now() + 45 * 60 * 1000;
console.log(`Watching ${account.address} for faucet MON...`);

for (;;) {
  try {
    const balance = await client.getBalance({ address: account.address });
    if (balance > 0n) {
      console.log(`FUNDED ${formatEther(balance)} MON`);
      process.exit(0);
    }
  } catch (error) {
    console.warn("balance check failed:", error?.message ?? error);
  }
  if (Date.now() > DEADLINE) {
    console.error("TIMEOUT waiting for funding");
    process.exit(3);
  }
  await new Promise((r) => setTimeout(r, 20_000));
}
