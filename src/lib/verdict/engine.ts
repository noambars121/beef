import { ApiError } from "@/lib/api-error";
import * as db from "@/lib/store/db";
import type { VerdictTone } from "@/types";

export interface GenerateVerdictOptions {
  tone?: VerdictTone;
  requesterSessionId?: string;
}

/**
 * Enqueue durable deliberation on Convex. The Next.js route returns 202;
 * the Cursor agent loop runs in a Convex action that survives serverless.
 */
export async function startVerdictGeneration(
  caseId: string,
  options: GenerateVerdictOptions = {}
): Promise<void> {
  const result = await db.enqueueDeliberation(
    caseId,
    options.tone,
    options.requesterSessionId
  );
  if (!result.ok) {
    throw new ApiError(result.error, result.status);
  }
}

export interface GenerateAppealOptions {
  plea: string;
  requesterSessionId?: string;
}

/** Enqueue durable appeal hearing on Convex (serverless-safe). */
export async function startAppealGeneration(
  caseId: string,
  options: GenerateAppealOptions
): Promise<void> {
  const result = await db.enqueueAppeal(
    caseId,
    options.plea,
    options.requesterSessionId
  );
  if (!result.ok) {
    throw new ApiError(result.error, result.status);
  }
}
