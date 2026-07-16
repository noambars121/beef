// End-to-end smoke test against the deployed BeefVerdictRegistry on Monad
// testnet: seals a synthetic case, reads it back, verifies every field.
// Usage: node scripts/smoke-test-registry.mjs <registryAddress>
import {
  createPublicClient,
  createWalletClient,
  http,
  keccak256,
  stringToBytes,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { readFileSync } from "node:fs";

const registry = process.argv[2];
if (!registry) {
  console.error("Usage: node scripts/smoke-test-registry.mjs <registryAddress>");
  process.exit(1);
}

const MONAD_TESTNET = {
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet-rpc.monad.xyz"] } },
};

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const key = env
  .split(/\r?\n/)
  .find((l) => l.startsWith("MONAD_JUDGE_PRIVATE_KEY="))
  .slice("MONAD_JUDGE_PRIVATE_KEY=".length)
  .trim();

const abi = JSON.parse(
  readFileSync(new URL("../contracts/BeefVerdictRegistry.json", import.meta.url), "utf8")
).abi;

const account = privateKeyToAccount(key);
const publicClient = createPublicClient({ chain: MONAD_TESTNET, transport: http() });
const walletClient = createWalletClient({ chain: MONAD_TESTNET, transport: http(), account });

const caseId = `smoke-test-${Date.now()}`;
const caseKey = keccak256(stringToBytes(caseId));
const verdictHash = keccak256(stringToBytes("TEST VERDICT|TEST ROAST"));

console.log(`Sealing synthetic case "${caseId}"...`);
const hash = await walletClient.writeContract({
  address: registry,
  abi,
  functionName: "sealVerdict",
  args: [caseKey, 9999, 1, 25, 12, verdictHash],
});
const receipt = await publicClient.waitForTransactionReceipt({ hash });
console.log(`Seal tx: ${hash} (status ${receipt.status}, block ${receipt.blockNumber})`);

const record = await publicClient.readContract({
  address: registry,
  abi,
  functionName: "getVerdict",
  args: [caseKey],
});

const checks = [
  ["docketNo", record.docketNo === 9999],
  ["winner=SideA", record.winner === 1],
  ["scoreA", record.scoreA === 25],
  ["scoreB", record.scoreB === 12],
  ["verdictHash", record.verdictHash === verdictHash],
  ["sealedAt>0", record.sealedAt > 0n],
  ["not overturned", record.overturnedOnAppeal === false],
];

let ok = true;
for (const [name, pass] of checks) {
  console.log(`${pass ? "PASS" : "FAIL"} ${name}`);
  if (!pass) ok = false;
}

// Overturn path
console.log("Overturning...");
const hash2 = await walletClient.writeContract({
  address: registry,
  abi,
  functionName: "overturnVerdict",
  args: [caseKey],
});
await publicClient.waitForTransactionReceipt({ hash: hash2 });
const after = await publicClient.readContract({
  address: registry,
  abi,
  functionName: "getVerdict",
  args: [caseKey],
});
const flipOk = after.winner === 2 && after.overturnedOnAppeal === true;
console.log(`${flipOk ? "PASS" : "FAIL"} overturn flips winner`);
if (!flipOk) ok = false;

const total = await publicClient.readContract({
  address: registry,
  abi,
  functionName: "totalVerdicts",
});
console.log(`totalVerdicts on-chain: ${total}`);
console.log(ok ? "SMOKE TEST PASSED" : "SMOKE TEST FAILED");
process.exit(ok ? 0 : 1);
