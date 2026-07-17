# BEEF ⚖️

> **Stop arguing in group chats. Use BEEF.**

BEEF is a social **Crowd Court for Petty Debates**. Submit both sides, share the case link, and make the group pick a side before the AI judge’s verdict is revealed.

The verdict is permanently sealed on Monad Testnet, creating a tamper-evident court record.

**Hackathon:** Spark / Build Anything

## Live App

[Open BEEF](https://sendbeef.vercel.app/)

## How It Works

1. Create a case and submit both sides of the argument.
2. Share the case link with the group chat.
3. Friends vote before they can see the verdict.
4. The AI judge delivers a verdict, reasoning, scores, and a roast.
5. The final ruling is sealed on Monad Testnet.

## Why Monad

BEEF is built around dramatic finality: once the court rules, there are no take-backs.

Each sealed verdict records an onchain reference to the case, winner, judge scores, and a hash of the verdict text. This means the ruling can be verified as unchanged after it is issued.

- **Network:** Monad Testnet
- **Chain ID:** `10143`
- **Registry contract:** `0x7660ec3069f4332013aa4f3fa4d691cfc7b69ffa`
- **Contract source:** [`contracts/BeefVerdictRegistry.sol`](contracts/BeefVerdictRegistry.sol)

### What gets sealed

A Convex action signs a `sealVerdict` transaction with the server judge wallet and writes:

- `caseKey` — keccak256 of the case id
- `docketNo`, winner (`SideA` / `SideB`), weighted judge scores
- `verdictHash` — keccak256 of the ruling + roast text

If an appeal overturns a ruling, `overturnVerdict` flips the winner onchain as well. Case pages link to the Monad explorer so anyone can verify the record.

## Core Mechanics

- **Pick Before You Peek:** voters must choose a side before the verdict unseals.
- **Crowd Court:** an optional timed jury mode for group participation.
- **The People vs. The Judge:** compare crowd consensus against the AI ruling.
- **Appeals:** the losing side gets one appeal path.
- **Onchain Verdict Sealing:** verdict records are sealed on Monad Testnet.
- **Shareable Cases:** designed for group chats, reactions, screenshots, and rematches.
- **Hall of Shame:** closed cases ranked by time-decayed heat.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) + TypeScript + Tailwind |
| Backend / DB | Convex (durable actions run the AI judge + chain seals) |
| Verdict engine | OpenAI **gpt-5-nano** |
| Onchain | Solidity 0.8.28 on **Monad Testnet**, viem, server-signed txs |
| Video | Remotion (demo video from the app’s design system) |

## Running Locally

```bash
npm install
npx convex dev          # backend (terminal 1)
npm run dev             # frontend (terminal 2)
```

`.env.local` (see `.env.example`):

```
OPENAI_API_KEY=...             # AI judge (defaults to gpt-5-nano)
MONAD_JUDGE_PRIVATE_KEY=0x...  # server wallet that signs seals
MONAD_REGISTRY_ADDRESS=0x...   # deployed BeefVerdictRegistry
```

Set the same Monad vars (and `OPENAI_API_KEY`) on the Convex deployment (`npx convex env set`) — sealing and verdict generation run in Convex actions, not in Next.js.

### Deploying the contract

```bash
npm run chain:wallet    # generate the judge wallet (prints address)
# fund it at https://faucet.monad.xyz
npm run chain:compile   # solc → contracts/BeefVerdictRegistry.json
npm run chain:deploy    # deploy to Monad Testnet, prints the address
```

## Architecture Notes

- No user accounts: anonymous browser sessions identify case owners, voters, and rate-limit buckets. Users never need a wallet — the app signs all chain writes.
- Verdict generation and chain sealing both run as **durable Convex actions**, scheduled transactionally with the verdict insert.
- Chain writes are retried and the UI reports seal status (`SEALING` → `SEALED · VERIFY TX`, or a graceful off-chain fallback if the RPC is down).
