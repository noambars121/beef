import { randomUUID } from "crypto";
import { cookies, headers } from "next/headers";

export const SESSION_COOKIE = "beef_session";

export function createSessionId(): string {
  return randomUUID();
}

// Mark the cookie Secure only when the request actually arrived over HTTPS
// (direct or via proxy). Keying off NODE_ENV breaks `next start` over plain
// HTTP localhost, where browsers refuse to send Secure cookies back.
async function isSecureRequest(): Promise<boolean> {
  const headerStore = await headers();
  const proto = headerStore.get("x-forwarded-proto");
  return proto?.split(",")[0]?.trim() === "https";
}

export async function getOrCreateSessionId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(SESSION_COOKIE)?.value;

  if (existing) {
    return existing;
  }

  const sessionId = createSessionId();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: await isSecureRequest(),
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  return sessionId;
}

export async function getSessionId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}
