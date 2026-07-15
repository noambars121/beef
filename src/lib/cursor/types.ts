export interface CursorPrompt {
  text: string;
  images?: Array<
    | { data: string; mimeType: string }
    | { url: string }
  >;
}

export interface CursorModelSelection {
  id: string;
  params?: Array<{ id: string; value: string }>;
}

export interface CreateAgentRequest {
  prompt: CursorPrompt;
  model?: CursorModelSelection;
  name?: string;
}

export interface CursorAgent {
  id: string;
  name: string;
  status: string;
  latestRunId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CursorRun {
  id: string;
  agentId: string;
  status: "CREATING" | "RUNNING" | "FINISHED" | "ERROR" | "CANCELLED" | "EXPIRED";
  result?: string;
  durationMs?: number;
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
