# BEEF — AI Judge with an On-Chain Court Record on Monad

> **Settle arguments with AI. Two sides. One verdict. Zero mercy. Sealed on Monad forever.**

**Live demo:** https://beefjudge.vercel.app

BEEF is a viral, arcade-themed web app where two people submit both sides of an argument and an AI judge delivers a dramatic verdict — scores, reasoning, and a "fatal roast." Every ruling is then **sealed on Monad testnet** as a permanent, tamper-proof court record.

## The on-chain component (Monad)

Contract: [`contracts/BeefVerdictRegistry.sol`](contracts/BeefVerdictRegistry.sol) — **live on Monad testnet** (chain id `10143`):

- **Registry address:** [`0x7660ec3069f4332013aa4f3fa4d691cfc7b69ffa`](https://testnet.monadexplorer.com/address/0x7660ec3069f4332013aa4f3fa4d691cfc7b69ffa)
- **Example sealed verdict:** [case #0021 seal tx](https://testnet.monadexplorer.com/tx/0x1536e1e9d60a099630f0bfc8f099e00c48f26cc7444e881a8496c26081971c63)

The flow:

1. The AI judge (Cursor agent running Gemini) delivers a verdict; it is stored in Convex.
2. A Convex action immediately signs a `sealVerdict` transaction with the server "judge wallet" and writes to the registry on Monad:
   - `caseKey` — keccak256 of the case id
   - `docketNo`, winner (`SideA`/`SideB`), weighted judge scores
   - `verdictHash` — keccak256 of the ruling + roast text, so anyone can prove the ruling was never edited after the fact
3. The case page shows **"⛓ VERDICT SEALED ON MONAD — VERIFY TX"** linking to the transaction on the [Monad explorer](https://testnet.monadexplorer.com).
4. If the appellate court overturns a ruling, `overturnVerdict` flips the winner **on-chain** too, and the badge links to the overturn transaction.

Why it fits: BEEF verdicts are theatrical but final — "no take-backs" is the whole point. The blockchain makes that literal: the judge cannot quietly rewrite history, because the record lives on Monad, not in our database.

## Everything else

- **THE TRAP** — visitors must pick a side before the verdict unseals (arguments blurred until you commit)
- **JURY MODE** — optional 5-minute crowd court: everyone bets blind, then the judge enters
- **THE PEOPLE VS THE JUDGE** — crowd consensus vs the AI ruling (consensus / crowd-was-wrong / hung jury)
- **Appeals** — the losing side gets one appellate plea; overturns flip the verdict (and the chain record)
- **Hall of Shame** — closed cases ranked by time-decayed heat
- Share cards, OG images, reactions, roast lines — built to be screenshotted

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) + TypeScript + Tailwind |
| Backend / DB | Convex (durable actions run the AI judge + chain seals) |
| AI judge | Cursor Cloud Agents API (Gemini) |
| On-chain | Solidity 0.8.28 on **Monad testnet**, viem, server-signed txs |
| Video | Remotion (demo video rendered from the app's real design system) |

## Running locally

```bash
npm install
npx convex dev          # backend (terminal 1)
npm run dev             # frontend (terminal 2)
```

`.env.local` (see `.env.example`):

```
CURSOR_API_KEY=...             # AI judge
MONAD_JUDGE_PRIVATE_KEY=0x...  # server wallet that signs seals
MONAD_REGISTRY_ADDRESS=0x...   # deployed BeefVerdictRegistry
```

Set the same Monad vars on the Convex deployment (`npx convex env set`) — the sealing runs in Convex actions, not in Next.js.

### Deploying the contract

```bash
npm run chain:wallet    # generate the judge wallet (prints address)
# fund it at https://faucet.monad.xyz
npm run chain:compile   # solc → contracts/BeefVerdictRegistry.json
npm run chain:deploy    # deploy to Monad testnet, prints the address
```

## Architecture notes

- No user accounts: anonymous browser sessions identify case owners, voters and rate-limit buckets. No user ever needs a wallet — the app signs all chain writes, so the on-chain record is invisible-infra, not a UX tax.
- Verdict generation and chain sealing both run as **durable Convex actions**, scheduled transactionally with the verdict insert — a serverless request dying cannot lose a seal.
- Chain writes are retried 3× and the UI reports the truth: `SEALING ON MONAD…` → `SEALED · VERIFY TX` (or a graceful off-chain fallback if the RPC is down).
