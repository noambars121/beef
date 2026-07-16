// Monad testnet client for the BEEF on-chain court record. Only imported from
// "use node" actions — viem never enters the default Convex runtime bundle.
import {
  createPublicClient,
  createWalletClient,
  http,
  keccak256,
  stringToBytes,
  defineChain,
  type Hash,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: "https://testnet.monadexplorer.com",
    },
  },
});

export const MONAD_EXPLORER_URL = "https://testnet.monadexplorer.com";

/** Minimal ABI — mirrors contracts/BeefVerdictRegistry.sol. */
export const BEEF_REGISTRY_ABI = [
  {
    type: "function",
    name: "sealVerdict",
    stateMutability: "nonpayable",
    inputs: [
      { name: "caseKey", type: "bytes32" },
      { name: "docketNo", type: "uint32" },
      { name: "winner", type: "uint8" },
      { name: "scoreA", type: "uint8" },
      { name: "scoreB", type: "uint8" },
      { name: "verdictHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "overturnVerdict",
    stateMutability: "nonpayable",
    inputs: [{ name: "caseKey", type: "bytes32" }],
    outputs: [],
  },
  {
    type: "function",
    name: "isSealed",
    stateMutability: "view",
    inputs: [{ name: "caseKey", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export function isMonadConfigured(): boolean {
  return Boolean(
    process.env.MONAD_JUDGE_PRIVATE_KEY && process.env.MONAD_REGISTRY_ADDRESS
  );
}

function getRegistryAddress(): `0x${string}` {
  const address = process.env.MONAD_REGISTRY_ADDRESS;
  if (!address) throw new Error("MONAD_REGISTRY_ADDRESS is not configured");
  return address as `0x${string}`;
}

function getClients() {
  const key = process.env.MONAD_JUDGE_PRIVATE_KEY;
  if (!key) throw new Error("MONAD_JUDGE_PRIVATE_KEY is not configured");
  const rpcUrl = process.env.MONAD_RPC_URL;
  const transport = http(rpcUrl || undefined);
  const account = privateKeyToAccount(key as `0x${string}`);
  return {
    account,
    publicClient: createPublicClient({ chain: monadTestnet, transport }),
    walletClient: createWalletClient({
      chain: monadTestnet,
      transport,
      account,
    }),
  };
}

/** Stable 32-byte key derived from the app-side Convex case id. */
export function toCaseKey(caseId: string): `0x${string}` {
  return keccak256(stringToBytes(caseId));
}

/** Integrity hash of the ruling text — proves it was never edited later. */
export function toVerdictHash(
  shortVerdict: string,
  roastLine: string
): `0x${string}` {
  return keccak256(stringToBytes(`${shortVerdict}|${roastLine}`));
}

export interface SealResult {
  txHash: string;
  blockNumber: number;
}

export interface SealVerdictInput {
  caseId: string;
  docketNo: number;
  winnerSide: "A" | "B";
  /** Weighted judge scores 0-30 (logic*2 + evidence). */
  scoreA: number;
  scoreB: number;
  shortVerdict: string;
  roastLine: string;
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(255, Math.round(score)));
}

/**
 * Write the verdict to the BeefVerdictRegistry on Monad testnet.
 * If the case is already sealed on-chain (idempotent retry), returns the
 * confirmation of the existing seal instead of throwing.
 */
export async function sealVerdictOnChain(
  input: SealVerdictInput
): Promise<SealResult> {
  const { account, publicClient, walletClient } = getClients();
  const registry = getRegistryAddress();
  const caseKey = toCaseKey(input.caseId);

  const alreadySealed = await publicClient.readContract({
    address: registry,
    abi: BEEF_REGISTRY_ABI,
    functionName: "isSealed",
    args: [caseKey],
  });
  if (alreadySealed) {
    const blockNumber = await publicClient.getBlockNumber();
    return { txHash: "", blockNumber: Number(blockNumber) };
  }

  const hash: Hash = await walletClient.writeContract({
    address: registry,
    abi: BEEF_REGISTRY_ABI,
    functionName: "sealVerdict",
    args: [
      caseKey,
      input.docketNo,
      input.winnerSide === "A" ? 1 : 2,
      clampScore(input.scoreA),
      clampScore(input.scoreB),
      toVerdictHash(input.shortVerdict, input.roastLine),
    ],
    account,
  });

  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
    timeout: 60_000,
  });
  if (receipt.status !== "success") {
    throw new Error(`Monad seal transaction reverted (${hash})`);
  }

  return { txHash: hash, blockNumber: Number(receipt.blockNumber) };
}

/** Record an appellate overturn on-chain (flips the winner in the registry). */
export async function overturnVerdictOnChain(
  caseId: string
): Promise<SealResult> {
  const { account, publicClient, walletClient } = getClients();
  const registry = getRegistryAddress();

  const hash: Hash = await walletClient.writeContract({
    address: registry,
    abi: BEEF_REGISTRY_ABI,
    functionName: "overturnVerdict",
    args: [toCaseKey(caseId)],
    account,
  });

  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
    timeout: 60_000,
  });
  if (receipt.status !== "success") {
    throw new Error(`Monad overturn transaction reverted (${hash})`);
  }

  return { txHash: hash, blockNumber: Number(receipt.blockNumber) };
}
