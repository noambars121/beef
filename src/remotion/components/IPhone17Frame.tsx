import type { CSSProperties, ReactNode } from "react";

// Logical (pt) geometry of a modern 6.3" iPhone — 393 x 852 screen.
export const SCREEN_W = 393;
export const SCREEN_H = 852;
const BEZEL = 5.5; // uniform thin black bezel
const RIM = 3.5; // titanium body edge
export const DEVICE_W = SCREEN_W + 2 * (BEZEL + RIM); // 411
export const DEVICE_H = SCREEN_H + 2 * (BEZEL + RIM); // 870
const OUTER_RADIUS = 64;
const SCREEN_RADIUS = 55;

const ISLAND_W = 125;
const ISLAND_H = 36.5;
const ISLAND_TOP = 11.5;

/** iOS-style status bar (time + signal / wifi / battery), original artwork. */
function StatusBar() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 54,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 30px 0 40px",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: 100,
          textAlign: "center",
          color: "#ffffff",
          fontFamily:
            "var(--font-body), -apple-system, 'Segoe UI', sans-serif",
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: 0.2,
          textShadow: "0 1px 2px rgba(0,0,0,0.45)",
        }}
      >
        9:41
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Cellular bars */}
        <svg width="20" height="13" viewBox="0 0 20 13" fill="none">
          <rect x="0" y="8" width="3.4" height="5" rx="1" fill="#fff" />
          <rect x="5.2" y="5.5" width="3.4" height="7.5" rx="1" fill="#fff" />
          <rect x="10.4" y="3" width="3.4" height="10" rx="1" fill="#fff" />
          <rect x="15.6" y="0.5" width="3.4" height="12.5" rx="1" fill="#fff" />
        </svg>
        {/* Wi-Fi */}
        <svg width="18" height="13" viewBox="0 0 18 13" fill="none">
          <path
            d="M9 12.4c.9 0 2.6-1.9 2.6-1.9a3.7 3.7 0 0 0-5.2 0S8.1 12.4 9 12.4Z"
            fill="#fff"
          />
          <path
            d="M9 6.6c1.9 0 3.7.75 5 2l1.9-1.95A9.6 9.6 0 0 0 9 3.9a9.6 9.6 0 0 0-6.9 2.75L4 8.6a7.1 7.1 0 0 1 5-2Z"
            fill="#fff"
            opacity="0.98"
          />
          <path
            d="M9 1.3c3.2 0 6.1 1.25 8.2 3.3l.8-.8A12.4 12.4 0 0 0 9 0 12.4 12.4 0 0 0 0 3.8l.8.8A11.6 11.6 0 0 1 9 1.3Z"
            fill="#fff"
            opacity="0"
          />
        </svg>
        {/* Battery */}
        <div style={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <div
            style={{
              width: 25,
              height: 12.5,
              borderRadius: 4,
              border: "1.4px solid rgba(255,255,255,0.55)",
              padding: 1.6,
            }}
          >
            <div
              style={{
                width: "78%",
                height: "100%",
                borderRadius: 1.8,
                background: "#fff",
              }}
            />
          </div>
          <div
            style={{
              width: 1.6,
              height: 4.4,
              borderRadius: "0 2px 2px 0",
              background: "rgba(255,255,255,0.55)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function SideButton({
  side,
  top,
  height,
}: {
  side: "left" | "right";
  top: number;
  height: number;
}) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top,
        height,
        width: 3.6,
        [side]: -3.2,
        borderRadius: 2.4,
        background: "linear-gradient(90deg, #4c4f55, #202226, #4c4f55)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.6)",
      }}
    />
  );
}

interface IPhone17FrameProps {
  children: ReactNode;
  /** Extra glow strength around the device (0..1), e.g. for the end card pulse. */
  glow?: number;
  style?: CSSProperties;
}

/**
 * Premium iPhone 17 style device frame: thin uniform bezel, Dynamic Island,
 * iOS status bar, side buttons and home indicator. All artwork is original.
 * Children fill the 393x852 logical screen behind the status bar (like a real
 * full-screen web app with viewport-fit=cover).
 */
export function IPhone17Frame({ children, glow = 0.5, style }: IPhone17FrameProps) {
  return (
    <div
      style={{
        position: "relative",
        width: DEVICE_W,
        height: DEVICE_H,
        ...style,
      }}
    >
      {/* Titanium body */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: OUTER_RADIUS,
          background:
            "linear-gradient(145deg, #5a5d63 0%, #2b2d31 18%, #17181b 50%, #26282c 82%, #4a4d53 100%)",
          boxShadow: [
            `0 0 ${90 + glow * 110}px rgba(255, 0, 127, ${0.1 + glow * 0.16})`,
            `0 0 ${140 + glow * 140}px rgba(0, 240, 255, ${0.06 + glow * 0.1})`,
            "0 60px 140px rgba(0, 0, 0, 0.82)",
            "0 20px 50px rgba(0, 0, 0, 0.65)",
          ].join(", "),
        }}
      />
      {/* Side buttons */}
      <SideButton side="left" top={168} height={22} />
      <SideButton side="left" top={216} height={46} />
      <SideButton side="left" top={270} height={46} />
      <SideButton side="right" top={232} height={78} />

      {/* Black bezel */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: RIM,
          borderRadius: OUTER_RADIUS - RIM,
          background: "#000",
          boxShadow: "inset 0 0 3px rgba(255,255,255,0.16)",
        }}
      />

      {/* Screen */}
      <div
        style={{
          position: "absolute",
          inset: RIM + BEZEL,
          borderRadius: SCREEN_RADIUS,
          overflow: "hidden",
          background: "#050508",
          // Chrome antialiasing seam fix on rounded clipped corners
          transform: "translateZ(0)",
        }}
      >
        {/* App content (393 x 852) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: SCREEN_W,
            height: SCREEN_H,
          }}
        >
          {children}
        </div>

        <StatusBar />

        {/* Dynamic Island */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: ISLAND_TOP,
            left: "50%",
            width: ISLAND_W,
            height: ISLAND_H,
            transform: "translateX(-50%)",
            borderRadius: ISLAND_H / 2,
            background: "#000",
            zIndex: 45,
            boxShadow: "inset 0 0 4px rgba(255,255,255,0.09)",
          }}
        >
          {/* camera lens hint */}
          <div
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              width: 12,
              height: 12,
              transform: "translateY(-50%)",
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 35% 35%, #1e2f4d 0%, #0a0f1c 55%, #000 100%)",
            }}
          />
        </div>

        {/* Home indicator */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: 8,
            left: "50%",
            transform: "translateX(-50%)",
            width: 140,
            height: 5,
            borderRadius: 3,
            background: "rgba(255,255,255,0.92)",
            zIndex: 45,
            boxShadow: "0 0 6px rgba(0,0,0,0.4)",
          }}
        />

        {/* Glass reflection */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 50,
            pointerEvents: "none",
            background:
              "linear-gradient(112deg, rgba(255,255,255,0.085) 0%, rgba(255,255,255,0.035) 12%, rgba(255,255,255,0) 26%, rgba(255,255,255,0) 74%, rgba(255,255,255,0.03) 92%, rgba(255,255,255,0.06) 100%)",
            borderRadius: SCREEN_RADIUS,
          }}
        />
      </div>
    </div>
  );
}
