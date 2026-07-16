/**
 * Cursor Cloud Agents client for Convex Node actions.
 * Mirrors src/lib/cursor/client.ts — keep behavior in sync.
 */

const CURSOR_API_BASE = "https://api.cursor.com/v1";

export type CursorRunStatus =
  | "CREATING"
  | "RUNNING"
  | "FINISHED"
  | "ERROR"
  | "CANCELLED"
  | "EXPIRED";

export interface CursorRun {
  id: string;
  agentId: string;
  status: CursorRunStatus;
  result?: string;
  durationMs?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CursorAgent {
  id: string;
  name: string;
  status: string;
  latestRunId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentResponse {
  agent: CursorAgent;
  run: CursorRun;
}

export class CursorApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: string
  ) {
    super(message);
    this.name = "CursorApiError";
  }
}

export function isCursorConfigured(): boolean {
  return Boolean(process.env.CURSOR_API_KEY);
}

function getApiKey(): string {
  const key = process.env.CURSOR_API_KEY;
  if (!key) {
    throw new CursorApiError("CURSOR_API_KEY is not configured", 500);
  }
  return key;
}

function authHeader(): string {
  const key = getApiKey();
  const encoded = Buffer.from(`${key}:`).toString("base64");
  return `Basic ${encoded}`;
}

function defaultModelId(): string {
  return process.env.CURSOR_MODEL_ID ?? "gemini-3.5-flash";
}

async function cursorFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${CURSOR_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  const body = await response.text();

  if (!response.ok) {
    throw new CursorApiError(
      `Cursor API error: ${response.status}`,
      response.status,
      body
    );
  }

  return JSON.parse(body) as T;
}

export async function createVerdictAgent(
  promptText: string,
  caseTitle: string
): Promise<CreateAgentResponse> {
  return cursorFetch<CreateAgentResponse>("/agents", {
    method: "POST",
    body: JSON.stringify({
      prompt: { text: promptText },
      model: { id: defaultModelId() },
      name: `Verdict: ${caseTitle.slice(0, 80)}`,
    }),
  });
}

export async function createFollowUpRun(
  agentId: string,
  promptText: string
): Promise<CursorRun> {
  const response = await cursorFetch<{ run: CursorRun }>(
    `/agents/${agentId}/runs`,
    {
      method: "POST",
      body: JSON.stringify({ prompt: { text: promptText } }),
    }
  );
  return response.run;
}

export async function getRun(
  agentId: string,
  runId: string
): Promise<CursorRun> {
  return cursorFetch<CursorRun>(`/agents/${agentId}/runs/${runId}`);
}

const TERMINAL_STATUSES = new Set<CursorRunStatus>([
  "FINISHED",
  "ERROR",
  "CANCELLED",
  "EXPIRED",
]);

export async function pollRunUntilComplete(
  agentId: string,
  runId: string,
  options?: {
    maxAttempts?: number;
    intervalMs?: number;
    onPoll?: (info: {
      attempt: number;
      maxAttempts: number;
      status: CursorRunStatus;
    }) => void | Promise<void>;
  }
): Promise<CursorRun> {
  const maxAttempts = options?.maxAttempts ?? 60;
  const intervalMs = options?.intervalMs ?? 2000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const run = await getRun(agentId, runId);

    await options?.onPoll?.({
      attempt,
      maxAttempts,
      status: run.status,
    });

    if (TERMINAL_STATUSES.has(run.status)) {
      return run;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new CursorApiError("Verdict deliberation timed out", 504);
}
