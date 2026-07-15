"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useMemo, type ReactNode } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

/**
 * Renders children without a provider when NEXT_PUBLIC_CONVEX_URL is absent
 * (e.g. mid-provisioning builds) instead of crashing the entire app at module
 * scope. All data currently flows through REST routes, which surface their own
 * configuration errors per-request.
 */
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(
    () => (convexUrl ? new ConvexReactClient(convexUrl) : null),
    []
  );

  if (!client) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "NEXT_PUBLIC_CONVEX_URL is not set; Convex realtime features are disabled."
      );
    }
    return <>{children}</>;
  }

  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
