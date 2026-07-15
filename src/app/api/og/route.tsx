import { ImageResponse } from "next/og";

// Edge avoids the Windows Node bug in @vercel/og where
// `join(import.meta.url, "../noto-sans…")` becomes `.\file:\C:\…` (ERR_INVALID_URL).
export const runtime = "edge";

const MAX_WEIGHTED_SCORE = 30;
const W = 1200;
const H = 630;

const C = {
  bg: "#08080c",
  panel: "#0d0d14",
  border: "#333348",
  yellow: "#ffe600",
  cyan: "#00f0ff",
  pink: "#ff007f",
  green: "#39ff14",
  muted: "#6e6e82",
  white: "#f4f4f8",
  crimson: "#ff2040",
  black: "#000000",
} as const;

function parseScore(raw: string | null): number | null {
  if (raw === null || raw === "") return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.min(MAX_WEIGHTED_SCORE, Math.round(value)));
}

/** Crowd approval percentage (0–100) for the jury chip; null hides it. */
function parseJuryPct(raw: string | null): number | null {
  if (raw === null || raw === "") return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatCaseRef(raw: string): string {
  if (raw === "") return "#————";
  return /^\d+$/.test(raw)
    ? `#${raw.padStart(4, "0")}`
    : `#${raw.slice(0, 8).toUpperCase()}`;
}

function cleanName(name: string): string {
  return name.trim().toUpperCase() || "FIGHTER";
}

/** Fit name without ugly mid-word cut when possible. */
function displayName(name: string, max = 14): string {
  const cleaned = cleanName(name);
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1)}…`;
}

/** Truncate on word boundary so roast never ends mid-word. */
function fitRoast(roast: string, max = 130): string {
  const cleaned = roast.trim().replace(/\s+/g, " ");
  if (!cleaned) return "";
  if (cleaned.length <= max) return cleaned;
  const sliced = cleaned.slice(0, max);
  const lastSpace = sliced.lastIndexOf(" ");
  const base = lastSpace > 40 ? sliced.slice(0, lastSpace) : sliced;
  return `${base.replace(/[.,;:!?]+$/, "")}…`;
}

function assetUrl(request: Request, path: string): string {
  return new URL(path, request.url).toString();
}

async function loadArcadeFont(): Promise<ArrayBuffer> {
  const res = await fetch(
    new URL("./PressStart2P-Regular.ttf", import.meta.url)
  );
  if (!res.ok) {
    throw new Error(`Failed to load arcade font (${res.status})`);
  }
  return res.arrayBuffer();
}

function hpPercent(score: number | null, won: boolean): number {
  if (score === null) return won ? 100 : 8;
  return Math.max(8, Math.round((score / MAX_WEIGHTED_SCORE) * 100));
}

/**
 * Quote-forward KO poster.
 * Hierarchy: brand → winner → roast (hero) → compact fighter strip.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const title = (searchParams.get("title") ?? "Untitled Beef").slice(0, 36);
  const winner = searchParams.get("winner") === "B" ? "B" : "A";
  const roastRaw = searchParams.get("roast") ?? "";
  const caseRef = (searchParams.get("case") ?? "").slice(0, 12);
  const nameA = displayName(searchParams.get("na") ?? "PLAYER 1");
  const nameB = displayName(searchParams.get("nb") ?? "PLAYER 2");
  const scoreA = parseScore(searchParams.get("wa"));
  const scoreB = parseScore(searchParams.get("wb"));
  const stampParam = searchParams.get("stamp");
  const stamp =
    stampParam === "overturned" || stampParam === "upheld" ? stampParam : null;
  const juryPct = parseJuryPct(searchParams.get("jury"));

  const winnerName = winner === "A" ? nameA : nameB;
  const loserName = winner === "A" ? nameB : nameA;
  const hasScores = scoreA !== null && scoreB !== null;
  const fontData = await loadArcadeFont();

  const p1Src = assetUrl(request, "/pixel/fighter-p1.png");
  const p2Src = assetUrl(request, "/pixel/fighter-p2.png");
  const koSrc = assetUrl(request, "/pixel/ko-badge.png");
  const gavelSrc = assetUrl(request, "/pixel/pixel-gavel.png");

  const roastBody = fitRoast(roastRaw, 128);
  const roastText = roastBody
    ? `“${roastBody}”`
    : `“${winnerName} takes the match. ${loserName} leaves in shame.”`;

  const roastSize =
    roastText.length > 110 ? 20 : roastText.length > 85 ? 22 : 26;
  const winSize = winnerName.length > 11 ? 28 : 34;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: C.bg,
          fontFamily: "Arcade",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "radial-gradient(ellipse 90% 60% at 50% 0%, rgba(255,230,0,0.18) 0%, transparent 55%), radial-gradient(circle at 10% 90%, rgba(0,240,255,0.12) 0%, transparent 40%), radial-gradient(circle at 90% 90%, rgba(255,0,127,0.12) 0%, transparent 40%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 16,
            display: "flex",
            border: `4px solid ${C.yellow}`,
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            padding: "34px 48px 26px",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img
                src={gavelSrc}
                width={40}
                height={40}
                alt=""
                style={{ imageRendering: "pixelated" }}
              />
              <div
                style={{
                  display: "flex",
                  fontSize: 40,
                  color: C.yellow,
                  letterSpacing: 8,
                  lineHeight: 1,
                }}
              >
                BEEF
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {juryPct !== null ? (
                <div
                  style={{
                    display: "flex",
                    padding: "10px 14px",
                    backgroundColor: C.black,
                    border: `3px solid ${C.green}`,
                    color: C.green,
                    fontSize: 12,
                    letterSpacing: 2,
                  }}
                >
                  {`JURY ${juryPct}% AGREED`}
                </div>
              ) : null}
              <div
                style={{
                  display: "flex",
                  fontSize: 11,
                  color: C.pink,
                  letterSpacing: 3,
                }}
              >
                {stamp ? "APPELLATE RULING" : "OFFICIAL KO"}
              </div>
              <div
                style={{
                  display: "flex",
                  padding: "10px 14px",
                  backgroundColor: C.black,
                  border: `3px solid ${C.yellow}`,
                  color: C.yellow,
                  fontSize: 14,
                  letterSpacing: 2,
                }}
              >
                {formatCaseRef(caseRef)}
              </div>
            </div>
          </div>

          {/* Winner line */}
          <div
            style={{
              display: "flex",
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
              gap: 18,
              marginTop: 22,
            }}
          >
            <img
              src={koSrc}
              width={88}
              height={52}
              alt=""
              style={{ imageRendering: "pixelated" }}
            />
            <div
              style={{
                display: "flex",
                fontSize: winSize,
                color: C.green,
                letterSpacing: 2,
                lineHeight: 1,
                textShadow: `0 0 24px rgba(57,255,20,0.45)`,
              }}
            >
              {`${winnerName} WINS`}
            </div>
            <img
              src={koSrc}
              width={88}
              height={52}
              alt=""
              style={{ imageRendering: "pixelated" }}
            />
          </div>

          {/* Roast hero */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              marginTop: 20,
              backgroundColor: "rgba(255,0,127,0.08)",
              border: `4px solid ${C.pink}`,
              padding: "22px 28px",
              gap: 12,
              minHeight: 150,
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 12,
                color: C.pink,
                letterSpacing: 4,
              }}
            >
              FATAL ROAST
            </div>
            <div
              style={{
                display: "flex",
                fontSize: roastSize,
                color: C.white,
                lineHeight: 1.4,
                letterSpacing: 0.3,
              }}
            >
              {roastText}
            </div>
          </div>

          {/* Fighter strip */}
          <div
            style={{
              display: "flex",
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 20,
              marginTop: 18,
            }}
          >
            <FighterStrip
              name={nameA}
              score={scoreA}
              won={winner === "A"}
              accent={C.cyan}
              fighterSrc={p1Src}
              hasScores={hasScores}
              side="P1"
            />
            <FighterStrip
              name={nameB}
              score={scoreB}
              won={winner === "B"}
              accent={C.pink}
              fighterSrc={p2Src}
              hasScores={hasScores}
              side="P2"
            />
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 10,
                color: C.muted,
                letterSpacing: 1,
                maxWidth: 720,
                overflow: "hidden",
              }}
            >
              {title.toUpperCase()}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 10,
                color: C.green,
                letterSpacing: 2,
              }}
            >
              BARSBUILD.ME
            </div>
          </div>

          {stamp ? (
            <div
              style={{
                position: "absolute",
                top: 250,
                right: 56,
                display: "flex",
                padding: "10px 16px",
                border: `5px solid ${stamp === "overturned" ? C.green : C.crimson}`,
                color: stamp === "overturned" ? C.green : C.crimson,
                fontSize: 18,
                letterSpacing: 2,
                transform: "rotate(-12deg)",
                backgroundColor: "rgba(8,8,12,0.92)",
              }}
            >
              {stamp === "overturned" ? "OVERTURNED" : "APPEAL DENIED"}
            </div>
          ) : null}
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: [
        {
          name: "Arcade",
          data: fontData,
          style: "normal",
          weight: 400,
        },
      ],
    }
  );
}

function FighterStrip({
  name,
  score,
  won,
  accent,
  fighterSrc,
  hasScores,
  side,
}: {
  name: string;
  score: number | null;
  won: boolean;
  accent: string;
  fighterSrc: string;
  hasScores: boolean;
  side: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        alignItems: "center",
        gap: 14,
        backgroundColor: C.panel,
        border: `3px solid ${won ? C.green : C.border}`,
        padding: "12px 14px",
        opacity: won ? 1 : 0.7,
      }}
    >
      <img
        src={fighterSrc}
        width={70}
        height={70}
        alt=""
        style={{
          imageRendering: "pixelated",
          opacity: won ? 1 : 0.45,
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          gap: 6,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 15,
              color: won ? C.white : C.muted,
              letterSpacing: 1,
            }}
          >
            {name}
          </div>
          <div
            style={{
              display: "flex",
              padding: "4px 8px",
              backgroundColor: won ? C.green : C.crimson,
              color: C.black,
              fontSize: 11,
              letterSpacing: 1,
            }}
          >
            {won ? "WIN" : "KO"}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 9,
            color: C.muted,
          }}
        >
          <div style={{ display: "flex", color: accent }}>{side}</div>
          <div style={{ display: "flex", color: won ? C.yellow : C.muted }}>
            {hasScores
              ? `${String(score).padStart(2, "0")}/${MAX_WEIGHTED_SCORE}`
              : won
                ? "99"
                : "00"}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            height: 12,
            backgroundColor: C.black,
            border: `2px solid ${C.border}`,
            padding: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              width: `${hpPercent(score, won)}%`,
              backgroundColor: won ? accent : C.pink,
            }}
          />
        </div>
      </div>
    </div>
  );
}
