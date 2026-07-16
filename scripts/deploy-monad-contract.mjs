// Deploys BeefVerdictRegistry to Monad testnet using the judge wallet from
// .env.local. Prints the deployed address and explorer link.
import { createPublicClient, createWalletClient, http, formatEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { readFileSync } from "node:fs";

const MONAD_TESTNET = {
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet-rpc.monad.xyz"] } },
};

function readEnvKey(name) {
  const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const line = env.split(/\r?\n/).find((l) => l.startsWith(`${name}=`));
  if (!line) throw new Error(`${name} missing from .env.local`);
  return line.slice(name.length + 1).trim();
}

const artifact = JSON.parse(
  readFileSync(new URL("../contracts/BeefVerdictRegistry.json", import.meta.url), "utf8")
);

const account = privateKeyToAccount(readEnvKey("MONAD_JUDGE_PRIVATE_KEY"));
const publicClient = createPublicClient({ chain: MONAD_TESTNET, transport: http() });
const walletClient = createWalletClient({
  chain: MONAD_TESTNET,
  transport: http(),
  account,
});

const balance = await publicClient.getBalance({ address: account.address });
console.log(`Judge wallet: ${account.address}`);
console.log(`Balance: ${formatEther(balance)} MON`);

if (balance === 0n) {
  console.error("Wallet has 0 MON — fund it at https://faucet.monad.xyz first.");
  process.exit(2);
}

console.log("Deploying BeefVerdictRegistry...");
const hash = await walletClient.deployContract({
  abi: artifact.abi,
  bytecode: artifact.bytecode,
});
console.log(`Deploy tx: ${hash}`);

const receipt = await publicClient.waitForTransactionReceipt({ hash });
if (receipt.status !== "success" || !receipt.contractAddress) {
  console.error("Deployment failed:", receipt.status);
  process.exit(1);
}

console.log(`DEPLOYED ${receipt.contractAddress}`);
console.log(`Explorer: https://testnet.monadexplorer.com/address/${receipt.contractAddress}`);
console.log(`Block: ${receipt.blockNumber}`);
