"use node";

import { v } from "convex/values";
import { api } from "./_generated/api";
import { internalAction } from "./_generated/server";
import {
  isMonadConfigured,
  overturnVerdictOnChain,
  sealVerdictOnChain,
} from "./lib/monadClient";
import { computeWeightedScore } from "./lib/verdictAnalysis";

const MAX_CHAIN_ATTEMPTS = 3;
const RETRY_DELAY_MS = 4_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Seal a delivered verdict on the BeefVerdictRegistry (Monad testnet).
 * Scheduled from runDeliberation right after the verdict lands in Convex.
 * Best-effort with retries; the app-side verdict is never blocked on chain
 * availability, but the UI shows the seal status truthfully.
 */
export const sealVerdictOnMonad = internalAction({
  args: { caseId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!isMonadConfigured()) {
      console.warn("[sealVerdictOnMonad] Monad env not configured; skipping");
      await ctx.runMutation(api.cases.setVerdictMonadSeal, {
        caseId: args.caseId,
        status: "failed",
      });
      return null;
    }

    const caseRecord = await ctx.runQuery(api.cases.get, {
      caseId: args.caseId,
    });
    const verdict = await ctx.runQuery(api.cases.getVerdict, {
      caseId: args.caseId,
    });
    if (!caseRecord || !verdict) {
      console.error("[sealVerdictOnMonad] case or verdict missing", args.caseId);
      return null;
    }

    const scoreA = verdict.scores ? computeWeightedScore(verdict.scores.A) : 0;
    const scoreB = verdict.scores ? computeWeightedScore(verdict.scores.B) : 0;

    let lastError = "";
    for (let attempt = 1; attempt <= MAX_CHAIN_ATTEMPTS; attempt++) {
      try {
        const result = await sealVerdictOnChain({
          caseId: args.caseId,
          docketNo: caseRecord.docket_no,
          winnerSide: verdict.winner_side,
          scoreA,
          scoreB,
          shortVerdict: verdict.short_verdict,
          roastLine: verdict.roast_line,
        });

        await ctx.runMutation(api.cases.setVerdictMonadSeal, {
          caseId: args.caseId,
          status: "sealed",
          tx_hash: result.txHash || undefined,
          block_number: result.blockNumber,
        });
        console.log(
          "[sealVerdictOnMonad] sealed",
          args.caseId,
          result.txHash,
          `block ${result.blockNumber}`
        );
        return null;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        console.error(
          `[sealVerdictOnMonad] attempt ${attempt}/${MAX_CHAIN_ATTEMPTS} failed:`,
          lastError
        );
        if (attempt < MAX_CHAIN_ATTEMPTS) {
          await sleep(RETRY_DELAY_MS * attempt);
        }
      }
    }

    await ctx.runMutation(api.cases.setVerdictMonadSeal, {
      caseId: args.caseId,
      status: "failed",
    });
    console.error("[sealVerdictOnMonad] gave up:", args.caseId, lastError);
    return null;
  },
});

/**
 * Record an appellate overturn on-chain. Scheduled from runAppeal when the
 * appellate court flips the original ruling.
 */
export const recordOverturnOnMonad = internalAction({
  args: { caseId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!isMonadConfigured()) {
      console.warn("[recordOverturnOnMonad] Monad env not configured; skipping");
      await ctx.runMutation(api.cases.setAppealMonadSeal, {
        caseId: args.caseId,
        status: "failed",
      });
      return null;
    }

    let lastError = "";
    for (let attempt = 1; attempt <= MAX_CHAIN_ATTEMPTS; attempt++) {
      try {
        const result = await overturnVerdictOnChain(args.caseId);
        await ctx.runMutation(api.cases.setAppealMonadSeal, {
          caseId: args.caseId,
          status: "sealed",
          tx_hash: result.txHash,
        });
        console.log(
          "[recordOverturnOnMonad] recorded",
          args.caseId,
          result.txHash
        );
        return null;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        console.error(
          `[recordOverturnOnMonad] attempt ${attempt}/${MAX_CHAIN_ATTEMPTS} failed:`,
          lastError
        );
        if (attempt < MAX_CHAIN_ATTEMPTS) {
          await sleep(RETRY_DELAY_MS * attempt);
        }
      }
    }

    await ctx.runMutation(api.cases.setAppealMonadSeal, {
      caseId: args.caseId,
      status: "failed",
    });
    console.error("[recordOverturnOnMonad] gave up:", args.caseId, lastError);
    return null;
  },
});
