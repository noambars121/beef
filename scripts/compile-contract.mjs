// Compiles contracts/BeefVerdictRegistry.sol with solc-js and writes the ABI +
// bytecode to contracts/BeefVerdictRegistry.json (consumed by the deploy
// script and the Convex sealing action).
import solc from "solc";
import { readFileSync, writeFileSync } from "node:fs";

const SOURCE_PATH = new URL("../contracts/BeefVerdictRegistry.sol", import.meta.url);
const OUT_PATH = new URL("../contracts/BeefVerdictRegistry.json", import.meta.url);

const source = readFileSync(SOURCE_PATH, "utf8");

const input = {
  language: "Solidity",
  sources: { "BeefVerdictRegistry.sol": { content: source } },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: {
      "*": { "*": ["abi", "evm.bytecode.object"] },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

const errors = (output.errors ?? []).filter((e) => e.severity === "error");
if (errors.length > 0) {
  for (const e of errors) console.error(e.formattedMessage);
  process.exit(1);
}
for (const w of output.errors ?? []) console.warn(w.formattedMessage);

const contract = output.contracts["BeefVerdictRegistry.sol"].BeefVerdictRegistry;
writeFileSync(
  OUT_PATH,
  JSON.stringify(
    {
      contractName: "BeefVerdictRegistry",
      abi: contract.abi,
      bytecode: `0x${contract.evm.bytecode.object}`,
    },
    null,
    2
  )
);

console.log(`Compiled OK — ABI entries: ${contract.abi.length}, bytecode bytes: ${contract.evm.bytecode.object.length / 2}`);
