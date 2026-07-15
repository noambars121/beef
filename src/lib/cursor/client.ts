import type {
  CreateAgentRequest,
  CreateAgentResponse,
  CursorRun,
} from "./types";
import { CursorApiError } from "./types";

const CURSOR_API_BASE = "https://api.cursor.com/v1";
const DEFAULT_MODEL_ID = process.env.CURSOR_MODEL_ID ?? "gemini-3.5-flash";

export function isCursorConfigured(): boolean {
  return Boolean(process.env.CURSOR_API_KEY);
}

function getApiKey(): string {
  const key = process.env.CURSOR_API_KEY;
  if (!key) {
    throw new CursorApiError(
      "CURSOR_API_KEY is not configured",
      500
    );
  }
  return key;
}

function authHeader(): string {
  const key = getApiKey();
  const encoded = Buffer.from(`${key}:`).toString("base64");
  return `Basic ${encoded}`;
}

async function cursorFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
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
  const payload: CreateAgentRequest = {
    prompt: { text: promptText },
    model: { id: DEFAULT_MODEL_ID },
    name: `Verdict: ${caseTitle.slice(0, 80)}`,
  };

  return cursorFetch<CreateAgentResponse>("/agents", {
    method: "POST",
    body: JSON.stringify(payload),
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

const TERMINAL_STATUSES = new Set([
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
      status: CursorRun["status"];
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

export { DEFAULT_MODEL_ID };
