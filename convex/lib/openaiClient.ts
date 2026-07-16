/**
 * OpenAI Chat Completions client for Convex Node actions.
 * Default model: gpt-5-nano (cheap + fast for JSON verdicts).
 */

const OPENAI_API_BASE = "https://api.openai.com/v1";

export class OpenAIApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: string
  ) {
    super(message);
    this.name = "OpenAIApiError";
  }
}

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

function getApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new OpenAIApiError("OPENAI_API_KEY is not configured", 500);
  }
  return key;
}

function defaultModelId(): string {
  return process.env.OPENAI_MODEL_ID ?? "gpt-5-nano";
}

export async function completeJudgePrompt(
  promptText: string,
  options?: { repairOf?: string }
): Promise<string> {
  const messages: Array<{ role: "system" | "user"; content: string }> = [
    {
      role: "system",
      content:
        "You are BEEF, a dramatic AI judge. Reply with a single valid JSON object only — no markdown fences, no commentary.",
    },
    { role: "user", content: promptText },
  ];

  if (options?.repairOf) {
    messages.push({
      role: "user",
      content: options.repairOf,
    });
  }

  const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: defaultModelId(),
      messages,
      // GPT-5 family: budget covers reasoning + visible output.
      max_completion_tokens: 4000,
      reasoning_effort: "minimal",
      response_format: { type: "json_object" },
    }),
    cache: "no-store",
  });

  const body = await response.text();
  if (!response.ok) {
    throw new OpenAIApiError(
      `OpenAI API error: ${response.status}`,
      response.status,
      body
    );
  }

  let parsed: {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  try {
    parsed = JSON.parse(body) as typeof parsed;
  } catch {
    throw new OpenAIApiError("OpenAI returned invalid JSON envelope", 502, body);
  }

  const content = parsed.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new OpenAIApiError("OpenAI returned an empty completion", 502, body);
  }
  return content;
}
