"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useState, useRef } from "react";
import { BuilderCredit } from "@/components/layout/BuilderCredit";
import type {
  CaseEnvelope,
  CrowdVoteTally,
  Party,
  PartySide,
  PredictResponse,
  ReactionType,
  SharePackage,
  SideScores,
} from "@/types";
import {
  BLOWOUT_LABELS,
  REACTION_META,
  REACTION_TYPE_VALUES,
  crowdMajority,
  crowdPercent,
  crowdTotal,
  effectiveWinnerSide,
  formatDocketNo,
  getBlowoutTier,
  getCategoryLabel,
  monadTxUrl,
  partyLabel,
  weightedScore,
} from "@/types";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { PixelFrame } from "@/components/pixel/PixelFrame";
import { ScalesWeighSprite } from "@/components/pixel/ScalesWeighSprite";

interface VerdictViewProps {
  initialData: CaseEnvelope;
}

interface FloatingSpark {
  id: number;
  text: string;
  color: string;
  x: number;
  y: number;
}

const DELIBERATION_LOGS = [
  "SCALPEL SHARPENING...",
  "CALCULATING LEVEL OF STUPIDITY...",
  "GATHERING PERSONAL INSULTS...",
  "WRITING THE FATAL ROAST...",
];

function deliberationProgress(data: CaseEnvelope): number {
  if (data.deliberation.in_progress) {
    return Math.max(5, Math.min(99, data.deliberation.progress ?? 5));
  }
  if (data.appeal_state.in_progress) {
    return Math.max(5, Math.min(99, data.appeal_state.progress ?? 5));
  }
  return 0;
}

function deliberationPhase(
  data: CaseEnvelope,
  logIndex: number
): string {
  if (data.deliberation.in_progress && data.deliberation.phase) {
    return data.deliberation.phase;
  }
  if (data.appeal_state.in_progress && data.appeal_state.phase) {
    return data.appeal_state.phase;
  }
  return DELIBERATION_LOGS[logIndex] ?? DELIBERATION_LOGS[0];
}

const MAX_WEIGHTED_SCORE = 30; // logic(10)*2 + evidence(10)

/** Arcade K.O. hit stinger (no voice). Silent on failure. */
function playKoSound() {
  try {
    const hit = new Audio("/sounds/ko.mp3");
    hit.volume = 0.9;
    void hit.play().catch(() => undefined);
  } catch {
    // Audio is decoration; never let it break the reveal.
  }
}

export function VerdictView({ initialData }: VerdictViewProps) {
  const [data, setData] = useState(initialData);
  const [isSummoning, setIsSummoning] = useState(false);
  const [summonError, setSummonError] = useState<string | null>(null);
  const [pendingReaction, setPendingReaction] = useState<ReactionType | null>(null);
  const [copied, setCopied] = useState<"link" | "text" | "shame" | null>(null);
  const [logIndex, setLogIndex] = useState(0);
  const [floatingSparks, setFloatingSparks] = useState<FloatingSpark[]>([]);
  const [isVoting, setIsVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [isSlamming, setIsSlamming] = useState(false);
  const [plea, setPlea] = useState("");
  const [isAppealing, setIsAppealing] = useState(false);
  const [appealError, setAppealError] = useState<string | null>(null);
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [sharingCard, setSharingCard] = useState(false);
  const sparkIdRef = useRef(0);
  const slamTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const caseId = data.case.id;
  const isOpen = data.case.status === "open";
  const juryActive = data.jury.active;
  // Poll while: the judge/appellate court works, the jury window is open
  // (live crowd heat + the automatic unseal for everyone on the page), a
  // non-owner sits on an open case waiting for the verdict to land, or the
  // on-chain Monad seal is still confirming (flips PENDING → SEALED live).
  const shouldPoll =
    juryActive ||
    (isOpen && (data.deliberation.in_progress || !data.viewer.is_owner)) ||
    data.appeal_state.in_progress ||
    data.verdict?.monad_status === "pending" ||
    data.appeal?.monad_status === "pending";

  const refreshEnvelope = useCallback(async () => {
    try {
      const response = await fetch(`/api/cases/${caseId}`, {
        cache: "no-store",
      });
      if (response.ok) {
        setData((await response.json()) as CaseEnvelope);
      }
    } catch {
      // Transient failures are fine; the poll loop retries.
    }
  }, [caseId]);

  // ---- Jury countdown: server clock is authoritative, local clock ticks ----
  const [juryRemainingMs, setJuryRemainingMs] = useState(
    data.jury.remaining_ms
  );
  const juryDeadlineRef = useRef<number | null>(null);

  useEffect(() => {
    if (juryActive) {
      // Re-derive the local deadline from every server response so clock
      // skew never accumulates beyond one poll interval.
      juryDeadlineRef.current = Date.now() + data.jury.remaining_ms;
      setJuryRemainingMs(data.jury.remaining_ms);
    } else {
      juryDeadlineRef.current = null;
      setJuryRemainingMs(0);
    }
  }, [juryActive, data.jury.remaining_ms]);

  useEffect(() => {
    if (!juryActive) return;
    let unsealFired = false;
    const tick = setInterval(() => {
      const deadline = juryDeadlineRef.current;
      if (deadline === null) return;
      const remaining = Math.max(0, deadline - Date.now());
      setJuryRemainingMs(remaining);
      if (remaining <= 0 && !unsealFired) {
        unsealFired = true;
        // The judge enters the court — pull the unsealed envelope right away
        // instead of waiting for the next poll tick.
        void refreshEnvelope();
      }
    }, 200);
    return () => clearInterval(tick);
  }, [juryActive, refreshEnvelope]);

  useEffect(() => {
    return () => {
      if (slamTimerRef.current) clearTimeout(slamTimerRef.current);
    };
  }, []);

  // K.O. slam on every null → verdict transition: covers both the voter's
  // reveal and the owner watching deliberation finish. Never on initial load.
  const hasVerdict = data.verdict !== null;
  const prevHadVerdictRef = useRef(hasVerdict);
  useEffect(() => {
    if (hasVerdict && !prevHadVerdictRef.current) {
      playKoSound();
      setIsSlamming(true);
      if (slamTimerRef.current) clearTimeout(slamTimerRef.current);
      slamTimerRef.current = setTimeout(() => setIsSlamming(false), 1100);
    }
    prevHadVerdictRef.current = hasVerdict;
  }, [hasVerdict]);

  // Fallback arcade logs only when the server hasn't sent a phase yet
  useEffect(() => {
    if (!shouldPoll) return;
    if (data.deliberation.phase || data.appeal_state.phase) return;
    const logInterval = setInterval(() => {
      setLogIndex((prev) => (prev + 1) % DELIBERATION_LOGS.length);
    }, 2000);
    return () => clearInterval(logInterval);
  }, [shouldPoll, data.deliberation.phase, data.appeal_state.phase]);

  useEffect(() => {
    if (!shouldPoll) return;

    const interval = setInterval(() => {
      void refreshEnvelope();
    }, 1200);

    return () => clearInterval(interval);
  }, [shouldPoll, refreshEnvelope]);

  const summonJudge = useCallback(async () => {
    setIsSummoning(true);
    setSummonError(null);
    try {
      const response = await fetch(`/api/cases/${caseId}/verdict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to summon the judge");
      }
      setData((prev) => ({
        ...prev,
        deliberation: {
          in_progress: true,
          error: null,
          progress: 5,
          phase: "SUMMONING THE JUDGE...",
        },
      }));
    } catch (error) {
      setSummonError(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsSummoning(false);
    }
  }, [caseId]);

  const castVote = useCallback(
    async (side: PartySide) => {
      setIsVoting(true);
      setVoteError(null);
      try {
        const response = await fetch(`/api/cases/${caseId}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ side }),
        });
        const body = (await response.json()) as PredictResponse & {
          error?: string;
        };
        if (!response.ok) {
          throw new Error(body.error ?? "The ballot box jammed. Try again.");
        }

        // While the jury window is open the verdict stays null and the UI
        // moves to the jury box; otherwise the null → verdict effect fires
        // the K.O. sound + screen slam.
        setData((prev) => ({
          ...prev,
          crowd: body.crowd,
          verdict: body.verdict,
          appeal: body.appeal,
          verdict_sealed: body.verdict_sealed,
          jury: body.jury,
        }));
      } catch (error) {
        setVoteError(
          error instanceof Error ? error.message : "Something went wrong"
        );
      } finally {
        setIsVoting(false);
      }
    },
    [caseId]
  );

  const lodgeAppeal = useCallback(async () => {
    const trimmed = plea.trim();
    if (trimmed.length < 20) {
      setAppealError("State your grounds — at least 20 characters");
      return;
    }
    setIsAppealing(true);
    setAppealError(null);
    try {
      const response = await fetch(`/api/cases/${caseId}/appeal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plea: trimmed }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "The appellate court refused the filing");
      }
      setData((prev) => ({
        ...prev,
        appeal_state: {
          in_progress: true,
          error: null,
          progress: 5,
          phase: "FILING THE APPEAL...",
        },
      }));
      setShowAppealForm(false);
    } catch (error) {
      setAppealError(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsAppealing(false);
    }
  }, [caseId, plea]);

  const spawnSparks = useCallback((tag: string, label: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top;

    const sparkColors = ["#00f0ff", "#ff007f", "#ffe600", "#39ff14"];
    const popupTexts = [`${tag} HIT!`, "+100 PTS", "COMBO!", "CRITICAL!"];

    const newSparks = Array.from({ length: 6 }).map((_, i) => ({
      id: sparkIdRef.current++,
      text: i === 0 ? popupTexts[Math.floor(Math.random() * popupTexts.length)] : tag,
      color: sparkColors[Math.floor(Math.random() * sparkColors.length)],
      x: x + (Math.random() - 0.5) * 80,
      y: y + (Math.random() - 0.5) * 30,
    }));

    setFloatingSparks((prev) => [...prev, ...newSparks]);

    setTimeout(() => {
      setFloatingSparks((prev) => prev.filter((fs) => !newSparks.some((ns) => ns.id === fs.id)));
    }, 1200);
  }, []);

  const react = useCallback(
    async (type: ReactionType, event: React.MouseEvent<HTMLButtonElement>) => {
      spawnSparks(REACTION_META[type].tag, REACTION_META[type].label, event);
      setPendingReaction(type);
      try {
        const response = await fetch(`/api/cases/${caseId}/reactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        });
        if (response.ok) {
          const result = (await response.json()) as {
            reactions: CaseEnvelope["reactions"];
            viral_rank: number;
          };
          setData((prev) => ({
            ...prev,
            reactions: result.reactions,
            case: { ...prev.case, viral_rank: result.viral_rank },
          }));
        }
      } finally {
        setPendingReaction(null);
      }
    },
    [caseId, spawnSparks]
  );

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied("link");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard unavailable; nothing to do.
    }
  }, []);

  const copyShareText = useCallback(
    async (variant: "text" | "shame") => {
      try {
        const response = await fetch(`/api/cases/${caseId}/share`);
        if (!response.ok) return;
        const sharePackage = (await response.json()) as SharePackage;
        await navigator.clipboard.writeText(
          variant === "shame"
            ? sharePackage.loser_share_text
            : sharePackage.share_text
        );
        setCopied(variant);
        setTimeout(() => setCopied(null), 2000);
      } catch {
        // Clipboard unavailable; nothing to do.
      }
    },
    [caseId]
  );

  const shareCard = useCallback(async () => {
    const imagePath =
      data.appeal?.share_image_url ?? data.verdict?.share_image_url;
    if (!imagePath) return;

    const imageUrl = new URL(imagePath, window.location.origin).href;
    setSharingCard(true);
    try {
      let shareText = data.case.title;
      try {
        const response = await fetch(`/api/cases/${caseId}/share`);
        if (response.ok) {
          const pack = (await response.json()) as SharePackage;
          shareText = pack.share_text;
        }
      } catch {
        // Fall back to title-only share text.
      }

      if (typeof navigator.share === "function") {
        try {
          const res = await fetch(imageUrl);
          const blob = await res.blob();
          const file = new File([blob], `beef-${caseId.slice(0, 8)}.png`, {
            type: blob.type || "image/png",
          });
          const withFiles = { title: "BEEF", text: shareText, files: [file] };
          if (
            typeof navigator.canShare === "function" &&
            navigator.canShare(withFiles)
          ) {
            await navigator.share(withFiles);
            return;
          }
          await navigator.share({
            title: "BEEF",
            text: shareText,
            url: window.location.href,
          });
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          // Fall through to open/download fallback.
        }
      }

      window.open(imageUrl, "_blank", "noopener,noreferrer");
    } finally {
      setSharingCard(false);
    }
  }, [caseId, data.appeal?.share_image_url, data.case.title, data.verdict?.share_image_url]);

  const sideA = data.parties.find((p) => p.side === "A");
  const sideB = data.parties.find((p) => p.side === "B");
  const nameA = partyLabel("A", sideA?.display_name);
  const nameB = partyLabel("B", sideB?.display_name);
  const docket = formatDocketNo(data.case.docket_no);
  const jurors = crowdTotal(data.crowd.tally);
  const caseMeta = `CASE ${docket} · ${getCategoryLabel(data.case.category)} · ${data.case.title}`;

  // ---- STATE A: THE TRAP — pick a side before you peek ----
  // Every non-owner visitor hits this gate first, whatever the case status.
  // Arguments stay blurred; the only way forward is choosing a team.
  if (!data.viewer.is_owner && data.crowd.viewer_vote === null) {
    return (
      <div className="arcade-panel arcade-screen relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-none crt-flicker">
        <div className="arcade-grid absolute inset-0 -z-10 opacity-30" />

        <header className="relative shrink-0 border-b-4 border-arcade-border bg-black/80 px-3 py-2 text-center sm:px-4 sm:py-3">
          <p className="font-arcade text-[7px] uppercase tracking-widest text-court-crimson text-flash sm:text-[9px]">
            ⚖ VERDICT SEALED ⚖
          </p>
          <h1 className="mt-1 break-words font-arcade text-sm leading-relaxed text-arcade-yellow uppercase tracking-wider sm:text-xl">
            YOU HAVE BEEN SUMMONED
          </h1>
          <p className="mt-1 font-arcade text-[8px] leading-relaxed text-white uppercase tracking-wider sm:text-[10px]">
            PICK A SIDE TO UNSEAL THE VERDICT.
          </p>
          <p className="mt-1 break-words px-1 font-mono text-[10px] uppercase tracking-wide text-court-muted line-clamp-1 sm:text-xs">
            {caseMeta}
          </p>
          {juryActive && (
            <motion.p
              animate={{ opacity: [1, 0.55, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              className="mt-1.5 inline-block border-2 border-court-crimson bg-black px-2 py-1 font-arcade text-[7px] uppercase tracking-widest text-court-crimson sm:text-[8px]"
            >
              JURY MODE · JUDGE ENTERS IN {formatCountdown(juryRemainingMs)}
            </motion.p>
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-4">
            {sideA && (
              <TrapSideCard
                party={sideA}
                displayName={nameA}
                playerNum="1"
                disabled={isVoting}
                onVote={() => castVote("A")}
              />
            )}
            {sideB && (
              <TrapSideCard
                party={sideB}
                displayName={nameB}
                playerNum="2"
                disabled={isVoting}
                onVote={() => castVote("B")}
              />
            )}
          </div>

          {voteError && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mx-auto mt-3 max-w-md border-4 border-arcade-pink bg-black p-3 text-center font-mono text-xs text-arcade-pink uppercase"
              role="alert"
            >
              [ERROR: {voteError}]
            </motion.p>
          )}

          <p className="mt-3 text-center font-arcade text-[7px] uppercase tracking-widest text-court-muted sm:text-[8px]">
            {jurors > 0 ? `${jurors} JUROR${jurors === 1 ? "" : "S"} HAVE PICKED · ` : ""}
            VOTES ARE FINAL · NO NEUTRAL GROUND
          </p>
          <p className="mt-1.5 text-center">
            <AiDisclosureTag />
          </p>
        </div>
      </div>
    );
  }

  // ---- STATE B: THE JURY BOX — bet placed, verdict sealed, clock running ----
  if (juryActive) {
    const viewerVote = data.crowd.viewer_vote;
    const unsealing = juryRemainingMs <= 0;
    return (
      <div className="arcade-panel arcade-screen relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-none crt-flicker">
        <div className="arcade-grid absolute inset-0 -z-10 opacity-30" />

        <header className="relative shrink-0 border-b-4 border-arcade-border bg-black/80 px-3 py-2 text-center sm:px-4 sm:py-3">
          <p className="font-arcade text-[7px] uppercase tracking-widest text-court-crimson text-flash sm:text-[9px]">
            COURT IN RECESS — THE CROWD DECIDES FIRST
          </p>
          <p className="mt-1 break-words px-1 font-mono text-[10px] uppercase tracking-wide text-court-muted line-clamp-1 sm:text-xs">
            {caseMeta}
          </p>
        </header>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-x-hidden overflow-y-auto px-3 py-3 text-center sm:px-4">
          {unsealing ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center"
            >
              <PixelIcon asset="gavel" size={72} alt="" className="pixel-bob" />
              <p className="mt-3 font-arcade text-sm text-arcade-yellow uppercase tracking-widest text-flash sm:text-lg">
                THE JUDGE ENTERS THE COURT
              </p>
              <p className="mt-2 font-mono text-[10px] uppercase text-court-muted sm:text-xs">
                UNSEALING THE VERDICT...
              </p>
            </motion.div>
          ) : (
            <>
              <p className="font-arcade text-[8px] uppercase tracking-widest text-white sm:text-[10px]">
                JURY DELIBERATING
              </p>
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [1, 0.82, 1],
                }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                className="mt-2 border-4 border-court-crimson bg-black px-5 py-3 font-arcade text-2xl tabular-nums text-court-crimson sm:px-8 sm:py-4 sm:text-4xl"
                style={{
                  textShadow:
                    "0 0 16px rgba(255,32,64,0.85), 0 0 42px rgba(255,32,64,0.4)",
                  boxShadow:
                    "0 0 22px rgba(255,32,64,0.35), inset 0 0 14px rgba(255,32,64,0.2)",
                }}
              >
                {formatCountdown(juryRemainingMs)}
              </motion.div>
              <p className="mt-3 max-w-md px-2 font-arcade text-[7px] leading-relaxed text-arcade-yellow uppercase tracking-wider sm:text-[9px]">
                {data.viewer.is_owner
                  ? "THE CROWD IS JUDGING YOUR BEEF."
                  : "YOU'VE PLACED YOUR BET."}{" "}
                THE JUDGE ENTERS THE COURT IN {formatCountdown(juryRemainingMs)}.
              </p>
            </>
          )}

          <div className="mt-4 w-full max-w-md">
            <CrowdHeatBar
              tally={data.crowd.tally}
              nameA={nameA}
              nameB={nameB}
            />
            {viewerVote !== null && (
              <p className="mt-2 font-arcade text-[7px] uppercase tracking-widest text-court-muted sm:text-[8px]">
                YOUR BET:{" "}
                <span
                  className={
                    viewerVote === "A" ? "text-arcade-blue" : "text-arcade-pink"
                  }
                >
                  {viewerVote === "A" ? nameA : nameB}
                </span>
              </p>
            )}
          </div>

          {/* The judge can still be summoned/rescued while the jury votes */}
          {data.viewer.is_owner && isOpen && (
            <div className="mt-4 w-full max-w-md">
              {data.deliberation.in_progress ? (
                <p className="font-mono text-[9px] uppercase text-arcade-blue sm:text-[10px]">
                  &gt; JUDGE STATUS: {deliberationPhase(data, logIndex)} (
                  {deliberationProgress(data)}%)
                </p>
              ) : (
                <>
                  {(data.deliberation.error || summonError) && (
                    <p
                      className="border-4 border-arcade-pink bg-black p-2 font-mono text-[10px] text-arcade-pink uppercase"
                      role="alert"
                    >
                      [ERROR: {summonError ?? data.deliberation.error}]
                    </p>
                  )}
                  <button
                    disabled={isSummoning}
                    onClick={summonJudge}
                    className="touch-target mt-2 border-4 border-b-8 border-r-8 border-black bg-arcade-yellow px-4 py-2.5 font-arcade text-[8px] uppercase text-black transition-all hover:bg-white active:border-b-4 active:border-r-4 disabled:opacity-50"
                  >
                    {isSummoning ? "LOADING..." : "SUMMON THE JUDGE"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <footer className="relative shrink-0 border-t-4 border-arcade-border bg-black/40 px-3 py-1.5 text-center sm:px-4">
          <AiDisclosureTag />
        </footer>
      </div>
    );
  }

  if (isOpen) {
    if (data.deliberation.in_progress) {
      return (
        <div className="arcade-panel arcade-screen relative flex h-full min-h-0 flex-1 flex-col items-center justify-center overflow-x-hidden overflow-y-auto rounded-none p-3 text-center crt-flicker sm:p-6">
          <div className="arcade-grid absolute inset-0 -z-10 opacity-30" />

          {/* Weighing scales sprite sheet — tips R / center / L */}
          <div className="relative mx-auto flex flex-col items-center">
            <ScalesWeighSprite size={96} fps={5} className="sm:hidden" />
            <ScalesWeighSprite size={140} fps={5} className="hidden sm:block" />
            <p className="mt-1 font-arcade text-[7px] uppercase tracking-widest text-arcade-yellow/80 text-flash">
              WEIGHING ARGUMENTS
            </p>
          </div>

          <h1 className="mt-3 font-arcade text-xs tracking-wider text-arcade-yellow sm:mt-5 sm:text-lg">
            JUDGE DELIBERATING...
          </h1>
          <p className="mx-auto mt-2 max-w-full break-all px-1 font-mono text-[10px] uppercase text-court-muted sm:mt-3 sm:max-w-md sm:break-words sm:px-0 sm:text-xs border-b-4 border-double border-arcade-border pb-3">
            {data.case.title}
          </p>

          {/* Cycling Deliberation Logs — driven by real AI phase when available */}
          <div className="mt-3 flex h-8 items-center justify-center px-2 sm:mt-4">
            <AnimatePresence mode="wait">
              <motion.p
                key={deliberationPhase(data, logIndex)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="font-arcade text-[9px] leading-snug text-arcade-blue sm:text-[10px]"
              >
                &gt; {deliberationPhase(data, logIndex)}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Progress bar tied to real deliberation stages */}
          <div className="mx-auto mt-3 mb-1 h-5 w-full max-w-xs border-4 border-arcade-border bg-black p-0.5 sm:mt-3">
            <motion.div
              className="h-full bg-arcade-pink"
              initial={false}
              animate={{ width: `${deliberationProgress(data)}%` }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            />
          </div>
          <p className="mt-1 font-arcade text-[7px] text-arcade-yellow/80">
            {deliberationProgress(data)}%
          </p>
        </div>
      );
    }

    return (
      <div className="arcade-panel arcade-screen relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-none p-4 text-center crt-flicker sm:p-6">
        <div className="arcade-grid absolute inset-0 -z-10 opacity-30" />
        
        <PixelIcon asset="coin" size={64} alt="" className="pixel-bob mx-auto sm:hidden" />
        <PixelIcon asset="coin" size={88} alt="" className="pixel-bob mx-auto hidden sm:block" />
        <h1 className="mt-3 font-arcade text-xs text-arcade-yellow sm:mt-4 sm:text-xl">
          CHOOSE YOUR VERDICT
        </h1>
        <p className="mt-2 break-words px-1 text-[10px] text-court-muted font-mono sm:mt-3 sm:max-w-md sm:px-0 sm:text-xs mx-auto border-b-4 border-double border-arcade-border pb-3">
          {data.case.title}
        </p>

        {(data.deliberation.error || summonError) && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-auto mt-6 max-w-md border-4 border-arcade-pink bg-black p-3 font-mono text-xs text-arcade-pink uppercase"
            role="alert"
          >
            [ERROR: {summonError ?? data.deliberation.error}]
          </motion.p>
        )}

        {data.viewer.is_owner ? (
          <div className="mt-5">
            <button
              disabled={isSummoning}
              onClick={summonJudge}
              className="touch-target w-full max-w-xs px-6 py-4 font-arcade text-[8px] uppercase bg-arcade-yellow border-4 border-b-8 border-r-8 border-black active:border-b-4 active:border-r-4 text-black hover:bg-white transition-all sm:w-auto sm:max-w-none sm:px-8 sm:text-xs"
            >
              {isSummoning ? "LOADING..." : "INSERT COIN & DECIDE"}
            </button>
          </div>
        ) : (
          <p className="mt-5 font-arcade text-[9px] uppercase text-court-muted text-flash">
            BET LOCKED — WAITING FOR THE JUDGE TO TAKE THE BENCH
          </p>
        )}
      </div>
    );
  }

  const verdict = data.verdict;
  if (!verdict) {
    return (
      <div className="arcade-panel flex min-h-0 flex-1 flex-col items-center justify-center rounded-none p-6 text-center border-arcade-pink">
        <PixelIcon asset="ko" size={72} alt="" className="mx-auto" />
        <p className="mt-4 text-court-muted font-mono text-xs uppercase">
          [VERDICT_DATA_ERROR: MISSING ROM]
        </p>
      </div>
    );
  }

  const appeal = data.appeal;
  const finalWinner = effectiveWinnerSide(verdict, appeal);
  const winnerName = finalWinner === "A" ? nameA : nameB;
  const blowout = getBlowoutTier(verdict.scores);
  const viewerVote = data.crowd.viewer_vote;
  const canAppeal =
    data.viewer.is_owner && !appeal && !data.appeal_state.in_progress;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {/* Arcade Hit Sparks Portal */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        <AnimatePresence>
          {floatingSparks.map((fs) => (
            <motion.div
              key={fs.id}
              initial={{ opacity: 1, scale: 0.8, x: fs.x, y: fs.y }}
              animate={{ 
                opacity: 0, 
                scale: [1, 1.8, 0.5], 
                y: fs.y - 120 - Math.random() * 60,
                x: fs.x + (Math.random() - 0.5) * 100
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute font-arcade text-[10px] font-black select-none"
              style={{ 
                color: fs.color,
                textShadow: `0 0 8px ${fs.color}, 0 2px 0 #000`
              }}
            >
              {fs.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Gavel slam & K.O. overlay on reveal */}
      <AnimatePresence>
        {isSlamming && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            {/* Street Fighter style screen white flash */}
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="absolute inset-0 bg-white z-50"
            />

            <div className="flex flex-col items-center justify-center max-w-lg px-4">
              <motion.div
                initial={{ scale: 5, opacity: 0, rotate: -30 }}
                animate={{ 
                  scale: [5, 1, 1.25, 1], 
                  opacity: 1, 
                  rotate: [-30, 10, -5, 0] 
                }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="relative flex flex-col items-center justify-center"
              >
                {/* Big neon glow behind K.O. */}
                <div className="absolute inset-0 bg-arcade-pink/30 rounded-full blur-2xl filter animate-pulse" />
                <PixelIcon asset="ko" size={180} alt="K.O." className="drop-shadow-[0_0_24px_rgba(255,0,127,0.85)] filter relative" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.35, duration: 0.3, type: "spring", stiffness: 120 }}
                className="mt-6 font-arcade text-lg sm:text-2xl text-arcade-yellow tracking-widest text-center"
                style={{ textShadow: "0 0 12px #ffe600, 0 3px 0 #000" }}
              >
                {winnerName} WINS!
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1, 1, 0.8] }}
                transition={{ delay: 0.15, duration: 0.8 }}
                className="absolute top-10 flex flex-col items-center gap-1.5"
              >
                <PixelIcon asset="gavel" size={48} alt="" />
                <span className="font-arcade text-[10px] text-arcade-yellow uppercase tracking-widest">ORDER!</span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <article
        className={[
          "arcade-panel arcade-screen relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-none crt-flicker neon-glow-yellow",
          isSlamming ? "verdict-slam" : "",
        ].join(" ")}
      >
        <div className="arcade-grid absolute inset-0 -z-10 opacity-20" />

        {/* Header banner */}
        <header className="relative shrink-0 border-b-4 border-arcade-border bg-black/80 px-3 py-2 text-center sm:px-4 sm:py-3">
          <p className="font-arcade text-[7px] uppercase tracking-widest text-arcade-yellow sm:text-[9px]">
            JUDGMENT DELIVERED
            {appeal && (
              <span
                className={
                  appeal.outcome === "overturned"
                    ? " text-arcade-green"
                    : " text-arcade-pink"
                }
              >
                {appeal.outcome === "overturned"
                  ? " · OVERTURNED ON APPEAL"
                  : " · UPHELD ON APPEAL"}
              </span>
            )}
          </p>
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="mt-1 break-words font-arcade text-[10px] leading-relaxed text-white uppercase tracking-wider sm:text-sm md:text-base"
          >
            {verdict.short_verdict}
          </motion.h1>
          <p className="mt-1 break-words px-1 font-mono text-[10px] uppercase tracking-wide text-foreground/85 sm:text-xs">
            CASE {docket} · {getCategoryLabel(data.case.category)} · {data.case.title}
          </p>
          <MonadSealBadge verdict={verdict} appeal={appeal} />
        </header>

        {/* Blowout banner — only when the scores justify the drama */}
        {blowout !== "standard" && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0.4 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.25, type: "spring", stiffness: 160 }}
            className={[
              "shrink-0 border-b-4 py-1 text-center font-arcade text-[8px] tracking-[0.15em] sm:text-sm sm:tracking-[0.3em]",
              blowout === "fatality"
                ? "border-arcade-pink bg-arcade-pink/15 text-arcade-pink"
                : "border-arcade-yellow bg-arcade-yellow/15 text-arcade-yellow",
            ].join(" ")}
          >
            <span className="text-flash">{BLOWOUT_LABELS[blowout]}</span>
          </motion.div>
        )}

        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-2 sm:px-4 sm:py-3">
          <div className="sm:grid sm:grid-cols-2 sm:gap-3">
            {/* VS Battle */}
            <div className="flex shrink-0 flex-col border-b-4 border-double border-arcade-border pb-2 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-3">
              {/* Fighter stage — sprites face each other */}
              <div className="relative grid grid-cols-[1fr_auto_1fr] items-end gap-0 sm:gap-1">
                <div className="flex justify-end pr-0.5 sm:pr-2">
                  <PixelIcon
                    asset="fighterP1"
                    size={64}
                    alt="Player 1"
                    className={[
                      "sm:hidden",
                      finalWinner === "A" ? "drop-shadow-[0_0_12px_rgba(0,240,255,0.6)]" : "opacity-85",
                    ].join(" ")}
                  />
                  <PixelIcon
                    asset="fighterP1"
                    size={88}
                    alt="Player 1"
                    className={[
                      "hidden sm:block",
                      finalWinner === "A" ? "drop-shadow-[0_0_14px_rgba(0,240,255,0.6)]" : "opacity-85",
                    ].join(" ")}
                  />
                </div>
                <div className="flex items-center justify-center self-center px-0.5 pb-3 sm:px-1 sm:pb-4">
                  <PixelIcon asset="vs" size={40} alt="VS" className="sm:hidden" />
                  <PixelIcon asset="vs" size={56} alt="VS" className="hidden sm:block" />
                </div>
                <div className="flex justify-start pl-0.5 sm:pl-2">
                  <PixelIcon
                    asset="fighterP2"
                    size={64}
                    alt="Player 2"
                    className={[
                      "-scale-x-100 sm:hidden",
                      finalWinner === "B" ? "drop-shadow-[0_0_12px_rgba(255,0,127,0.6)]" : "opacity-85",
                    ].join(" ")}
                  />
                  <PixelIcon
                    asset="fighterP2"
                    size={88}
                    alt="Player 2"
                    className={[
                      "-scale-x-100 hidden sm:block",
                      finalWinner === "B" ? "drop-shadow-[0_0_14px_rgba(255,0,127,0.6)]" : "opacity-85",
                    ].join(" ")}
                  />
                </div>
              </div>

              <div className="mt-2 grid min-w-0 grid-cols-1 gap-2 sm:mt-3 sm:grid-cols-2 sm:gap-3">
                {sideA && (
                  <SideFighterCard
                    party={sideA}
                    displayName={nameA}
                    isWinner={finalWinner === "A"}
                    playerNum="1"
                    colorClass="text-arcade-blue"
                    barColor="bg-arcade-blue"
                    scores={verdict.scores?.A}
                    compact
                    hideSprite
                  />
                )}
                {sideB && (
                  <SideFighterCard
                    party={sideB}
                    displayName={nameB}
                    isWinner={finalWinner === "B"}
                    playerNum="2"
                    colorClass="text-arcade-pink"
                    barColor="bg-arcade-pink"
                    scores={verdict.scores?.B}
                    compact
                    hideSprite
                  />
                )}
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 120 }}
                className="mt-2 sm:mt-3"
              >
                <PixelFrame
                  variant="crimson"
                  className="bg-black/90 p-2.5 sm:p-3"
                >
                  <div className="flex items-center gap-2 border-b-2 border-dotted border-court-crimson/50 pb-1">
                    <span className="text-[14px]">🔥</span>
                    <span className="font-arcade text-[7px] uppercase tracking-widest text-court-crimson sm:text-[8px]">
                      FATAL ROAST
                    </span>
                    <span className="text-[14px]">🔥</span>
                  </div>
                  <p className="mt-2 break-words font-display text-xs italic font-black text-white leading-snug border-l-4 border-court-crimson pl-2 sm:text-sm sm:pl-3">
                    &ldquo;{appeal?.roast_line ?? verdict.roast_line}&rdquo;
                  </p>
                </PixelFrame>
              </motion.div>
            </div>

            {/* Analysis + appeal */}
            <div className="flex min-w-0 flex-col gap-2 pt-2 sm:pt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="arcade-panel relative border-4 border-arcade-border bg-black p-2 font-mono text-[11px] leading-relaxed sm:p-3 sm:text-xs neon-glow-blue"
              >
                <div className="absolute top-0 left-2 -translate-y-1/2 bg-black px-1.5 border-x-4 border-arcade-border font-arcade text-[7px] uppercase tracking-wider text-foreground/90">
                  JUDGE ANALYSIS
                </div>
                <p className="break-words text-foreground">
                  {verdict.full_reasoning}
                </p>
              </motion.div>

              {/* Appellate ruling — sits above the fatal roast when present */}
              {appeal && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className={[
                    "shrink-0 border-4 bg-black p-2 sm:p-3",
                    appeal.outcome === "overturned"
                      ? "border-arcade-green shadow-[0_0_20px_rgba(57,255,20,0.2)]"
                      : "border-arcade-yellow shadow-[0_0_20px_rgba(255,230,0,0.15)]",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "flex items-center gap-2 border-b-2 border-dotted pb-1",
                      appeal.outcome === "overturned"
                        ? "border-arcade-green/40"
                        : "border-arcade-yellow/40",
                    ].join(" ")}
                  >
                    <PixelIcon asset="gavel" size={18} alt="" />
                    <span
                      className={[
                        "font-arcade text-[7px] uppercase tracking-widest sm:text-[8px]",
                        appeal.outcome === "overturned"
                          ? "text-arcade-green"
                          : "text-arcade-yellow",
                      ].join(" ")}
                    >
                      APPELLATE COURT: {appeal.outcome === "overturned" ? "VERDICT OVERTURNED" : "APPEAL DENIED"}
                    </span>
                  </div>
                  <p className="mt-1 break-words font-mono text-[10px] leading-relaxed text-foreground/90 sm:text-xs">
                    {appeal.ruling}
                  </p>
                  <p className="mt-1 break-words font-display text-[11px] italic font-black text-white leading-snug border-l-4 pl-2 sm:text-xs border-current">
                    &ldquo;{appeal.roast_line}&rdquo;
                  </p>
                </motion.div>
              )}

              {/* THE PEOPLE VS THE JUDGE — crowd consensus vs AI ruling */}
              {jurors > 0 && (
                <PeopleVsJudgePanel
                  tally={data.crowd.tally}
                  jurors={jurors}
                  finalWinner={finalWinner}
                  nameA={nameA}
                  nameB={nameB}
                  viewerVote={viewerVote}
                />
              )}

              {/* Appellate court in session */}
              {data.appeal_state.in_progress && (
                <div className="shrink-0 border-4 border-arcade-yellow bg-black p-2 text-center sm:p-3">
                  <p className="font-arcade text-[8px] uppercase tracking-widest text-arcade-yellow text-flash">
                    APPELLATE COURT DELIBERATING...
                  </p>
                  <p className="mt-1 font-mono text-[9px] uppercase text-arcade-blue">
                    &gt; {deliberationPhase(data, logIndex)}
                  </p>
                  <div className="mx-auto mt-2 h-3 w-full max-w-xs border-2 border-arcade-border bg-black p-0.5">
                    <motion.div
                      className="h-full bg-arcade-yellow"
                      initial={false}
                      animate={{ width: `${deliberationProgress(data)}%` }}
                      transition={{ duration: 0.45, ease: "easeOut" }}
                    />
                  </div>
                  <p className="mt-1 font-arcade text-[6px] text-arcade-yellow/80">
                    {deliberationProgress(data)}%
                  </p>
                </div>
              )}

              {data.appeal_state.error && !data.appeal_state.in_progress && !appeal && (
                <p
                  className="shrink-0 border-4 border-arcade-pink bg-black p-2 font-mono text-[10px] uppercase text-arcade-pink"
                  role="alert"
                >
                  [APPEAL ERROR: {data.appeal_state.error}]
                </p>
              )}

              {/* Appeal filing — one shot, owner only */}
              {canAppeal && (
                <div className="shrink-0 border-4 border-dashed border-arcade-border bg-black/60 p-2 sm:p-3">
                  {showAppealForm ? (
                    <div>
                      <p className="font-arcade text-[7px] uppercase tracking-widest text-arcade-yellow sm:text-[8px]">
                        GROUNDS FOR APPEAL — ONE SHOT ONLY
                      </p>
                      <textarea
                        value={plea}
                        onChange={(e) => {
                          setPlea(e.target.value);
                          setAppealError(null);
                        }}
                        maxLength={600}
                        rows={3}
                        placeholder="Where exactly did the judge get it wrong? Wounded pride is not grounds."
                        className="arcade-input mt-2 !min-h-0 resize-none py-2 text-base sm:text-sm"
                      />
                      {appealError && (
                        <p className="mt-1 font-mono text-[10px] uppercase text-arcade-pink" role="alert">
                          [ERROR: {appealError}]
                        </p>
                      )}
                      <div className="mt-2 flex flex-col gap-1.5 sm:flex-row sm:gap-2">
                        <button
                          disabled={isAppealing}
                          onClick={lodgeAppeal}
                          className="touch-target flex-1 border-4 border-b-8 border-r-8 border-black bg-arcade-yellow px-3 py-2 font-arcade text-[8px] uppercase text-black transition-all hover:bg-white active:border-b-4 active:border-r-4 disabled:opacity-50"
                        >
                          {isAppealing ? "FILING..." : "INSERT COIN — FILE APPEAL"}
                        </button>
                        <button
                          disabled={isAppealing}
                          onClick={() => setShowAppealForm(false)}
                          className="touch-target border-4 border-arcade-border bg-black px-3 py-2 font-arcade text-[8px] uppercase text-court-muted transition-all hover:border-arcade-pink"
                        >
                          WITHDRAW
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAppealForm(true)}
                      className="touch-target w-full py-2 text-center font-arcade text-[8px] uppercase tracking-widest text-court-muted transition-colors hover:text-arcade-yellow"
                    >
                      LOSER&apos;S LAST RESORT: INSERT COIN TO APPEAL →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Reactions + actions */}
          <div className="mt-2 space-y-2 border-t-4 border-double border-arcade-border pt-2 sm:mt-3">
            <div className="text-center">
              <p className="mb-1.5 font-arcade text-[7px] uppercase tracking-widest text-foreground/85 sm:text-[8px]">
                RATE THE EXECUTION
              </p>
              <div className="grid grid-cols-3 gap-1.5 sm:flex sm:justify-center sm:gap-2">
                {REACTION_TYPE_VALUES.map((type) => {
                  const row = data.reactions.find((r) => r.type === type);
                  return (
                    <motion.button
                      key={type}
                      type="button"
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={pendingReaction !== null}
                      onClick={(e) => react(type, e)}
                      className="touch-target inline-flex items-center justify-center gap-1.5 border-4 border-arcade-border bg-black px-2 py-2 transition-all hover:border-arcade-yellow disabled:opacity-50 sm:gap-2 sm:px-3"
                    >
                      <PixelIcon asset={REACTION_META[type].asset} size={18} alt="" />
                      <span className="font-arcade text-[7px] text-foreground/90 uppercase sm:text-[8px]">
                        {REACTION_META[type].label}
                      </span>
                      <span className="font-mono text-[10px] font-bold text-arcade-yellow">
                        {row?.count ?? 0}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-2">
              <button
                onClick={copyLink}
                className="touch-target w-full px-3 py-2 font-arcade text-[8px] uppercase bg-black border-4 border-arcade-border text-foreground hover:border-arcade-blue transition-all sm:w-auto sm:px-4"
              >
                {copied === "link" ? "COPIED!" : "COPY LINK"}
              </button>
              <button
                onClick={() => copyShareText("text")}
                className="touch-target w-full px-3 py-2 font-arcade text-[8px] uppercase bg-black border-4 border-arcade-border text-foreground hover:border-arcade-pink transition-all sm:w-auto sm:px-4"
              >
                {copied === "text" ? "COPIED!" : "BRAG TEXT"}
              </button>
              <button
                onClick={() => copyShareText("shame")}
                className="touch-target w-full px-3 py-2 font-arcade text-[8px] uppercase bg-black border-4 border-arcade-border text-foreground hover:border-arcade-pink transition-all sm:w-auto sm:px-4"
              >
                {copied === "shame" ? "COPIED!" : "SHAME TEXT"}
              </button>
              <button
                type="button"
                onClick={() => void shareCard()}
                disabled={sharingCard}
                className="touch-target inline-flex w-full items-center justify-center gap-2 border-4 border-arcade-yellow bg-arcade-yellow px-3 py-2 font-arcade text-[8px] uppercase text-black transition-all hover:bg-white disabled:opacity-60 sm:w-auto sm:px-4"
              >
                {sharingCard ? "SHARING…" : "SHARE CARD"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="relative shrink-0 border-t-4 border-arcade-border px-3 py-1.5 text-center bg-black/40 sm:px-4">
          <p>
            <AiDisclosureTag />
          </p>
          <p className="mt-1 break-all font-arcade text-[6px] uppercase tracking-wider text-foreground/80 sm:text-[8px] sm:tracking-widest">
            CASE_{docket} · {winnerName} WINS · SHAME_HEAT_{data.case.viral_rank} · COIN_OP_SYSTEM
          </p>
          <div className="mt-1">
            <BuilderCredit />
          </div>
        </footer>
      </article>
    </div>
  );
}

// ---- Monad on-chain seal badge ----

const MONAD_PURPLE = "#836EF9";

interface MonadSealBadgeProps {
  verdict: {
    monad_status?: "pending" | "sealed" | "failed" | null;
    monad_tx_hash?: string | null;
  };
  appeal: {
    outcome: "upheld" | "overturned";
    monad_status?: "pending" | "sealed" | "failed" | null;
    monad_tx_hash?: string | null;
  } | null;
}

/**
 * The permanent court record: every verdict is sealed on Monad testnet.
 * Links straight to the transaction in the Monad explorer so anyone can
 * verify the ruling was never edited. Overturns supersede the original seal.
 */
function MonadSealBadge({ verdict, appeal }: MonadSealBadgeProps) {
  const overturn =
    appeal?.outcome === "overturned" && appeal.monad_tx_hash
      ? appeal
      : null;
  const status = overturn ? overturn.monad_status : verdict.monad_status;
  const txHash = overturn ? overturn.monad_tx_hash : verdict.monad_tx_hash;

  // Verdicts that predate the on-chain rollout have no record — show nothing.
  if (!status) return null;

  if (status === "pending") {
    return (
      <motion.p
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        className="mt-1.5 inline-flex items-center gap-1.5 border-2 bg-black px-2 py-1 font-arcade text-[7px] uppercase tracking-widest sm:text-[8px]"
        style={{ borderColor: MONAD_PURPLE, color: MONAD_PURPLE }}
      >
        ⛓ SEALING ON MONAD...
      </motion.p>
    );
  }

  if (status === "failed" || !txHash) {
    return (
      <p className="mt-1.5 inline-block border-2 border-arcade-border bg-black px-2 py-1 font-arcade text-[7px] uppercase tracking-widest text-court-muted sm:text-[8px]">
        ⛓ CHAIN SEAL DEFERRED — OFF-CHAIN RECORD ACTIVE
      </p>
    );
  }

  return (
    <motion.a
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 160 }}
      href={monadTxUrl(txHash)}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1.5 inline-flex items-center gap-1.5 border-2 bg-black px-2 py-1 font-arcade text-[7px] uppercase tracking-widest transition-all hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:text-[8px]"
      style={{
        borderColor: MONAD_PURPLE,
        color: MONAD_PURPLE,
        boxShadow: `0 0 12px ${MONAD_PURPLE}55, inset 0 0 8px ${MONAD_PURPLE}22`,
        textShadow: `0 0 8px ${MONAD_PURPLE}aa`,
      }}
    >
      ⛓ {overturn ? "OVERTURN SEALED ON MONAD" : "VERDICT SEALED ON MONAD"} ·
      VERIFY TX ↗
    </motion.a>
  );
}

// ---- AI transparency label ----

/** Required disclosure shown near every verdict; links to /ai-disclosure. */
function AiDisclosureTag() {
  return (
    <Link
      href="/ai-disclosure"
      className="inline-block font-mono text-[9px] uppercase tracking-wide text-court-muted underline decoration-court-muted/40 underline-offset-2 transition-colors hover:text-arcade-yellow hover:decoration-arcade-yellow/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arcade-yellow sm:text-[10px]"
    >
      AI ENTERTAINMENT VERDICT — NOT A REAL LEGAL RULING
    </Link>
  );
}

// ---- Jury countdown formatting ----

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// ---- Trap side card (pick-before-you-peek gate) ----

/** Longest blurred teaser shown behind the seal — enough to tempt, not read. */
const TRAP_PREVIEW_CHARS = 150;

interface TrapSideCardProps {
  party: Party;
  displayName: string;
  playerNum: string;
  disabled: boolean;
  onVote: () => void;
}

function TrapSideCard({
  party,
  displayName,
  playerNum,
  disabled,
  onVote,
}: TrapSideCardProps) {
  const isP1 = playerNum === "1";
  const frameVariant = isP1 ? "blue" : "pink";
  const accent = isP1 ? "text-arcade-blue" : "text-arcade-pink";
  const buttonClass = isP1
    ? "bg-arcade-blue neon-glow-blue"
    : "bg-arcade-pink neon-glow-pink";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: isP1 ? 0.1 : 0.2 }}
    >
      <PixelFrame
        variant={frameVariant}
        className="flex h-full flex-col bg-black/80 p-2.5 sm:p-3"
      >
        <div className="flex items-center gap-2 border-b-2 border-arcade-border pb-1.5">
          <PixelIcon
            asset={isP1 ? "fighterP1" : "fighterP2"}
            size={36}
            alt=""
            className={isP1 ? "" : "-scale-x-100"}
          />
          <div className="min-w-0">
            <p className={`truncate font-arcade text-[9px] sm:text-[10px] ${accent}`}>
              {displayName}
            </p>
            <p className="font-arcade text-[6px] uppercase text-court-muted">
              TEAM {isP1 ? "A" : "B"} · PLAYER {playerNum}
            </p>
          </div>
        </div>

        {/* Blurred teaser — the argument stays sealed until you commit */}
        <div className="relative mt-2 min-h-0 flex-1 overflow-hidden" aria-hidden>
          <p className="pointer-events-none select-none break-all font-mono text-[11px] leading-relaxed text-foreground/60 blur-[6px] sm:break-words sm:text-xs line-clamp-4">
            {party.argument_text.slice(0, TRAP_PREVIEW_CHARS)}
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="border-2 border-arcade-border bg-black/80 px-2 py-1 font-arcade text-[7px] uppercase tracking-widest text-court-muted">
              ARGUMENT SEALED
            </span>
          </div>
        </div>

        {/* The most tactile button in the app — a real coin-op slam */}
        <motion.button
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.95, y: 1 }}
          disabled={disabled}
          onClick={onVote}
          className={`touch-target mt-3 w-full border-4 border-b-8 border-r-8 border-black px-3 py-3.5 font-arcade text-[10px] uppercase tracking-wider text-black transition-colors hover:bg-white active:border-b-4 active:border-r-4 disabled:opacity-50 sm:py-4 sm:text-xs ${buttonClass}`}
        >
          {disabled ? "COUNTING..." : `SIDE WITH ${displayName}`}
        </motion.button>
      </PixelFrame>
    </motion.div>
  );
}

// ---- Crowd heat bar (live A/B split) ----

interface CrowdHeatBarProps {
  tally: CrowdVoteTally;
  nameA: string;
  nameB: string;
}

function CrowdHeatBar({ tally, nameA, nameB }: CrowdHeatBarProps) {
  const jurors = crowdTotal(tally);
  const pctA = crowdPercent(tally, "A");
  const pctB = crowdPercent(tally, "B");

  return (
    <div className="border-4 border-arcade-border bg-black/70 p-2 text-left sm:p-3">
      <div className="flex items-center justify-between font-arcade text-[6px] uppercase tracking-wider text-foreground/85 sm:text-[7px]">
        <span>CROWD HEAT · LIVE</span>
        <span>
          {jurors} JUROR{jurors === 1 ? "" : "S"}
        </span>
      </div>
      <div className="mt-1.5 flex h-3 w-full overflow-hidden border-2 border-arcade-border bg-black">
        {jurors === 0 ? (
          <motion.div
            animate={{ opacity: [0.15, 0.35, 0.15] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="h-full w-full bg-court-muted/40"
          />
        ) : (
          <>
            <div
              className="h-full bg-arcade-blue transition-all duration-700"
              style={{ width: `${pctA}%` }}
            />
            <div
              className="h-full bg-arcade-pink transition-all duration-700"
              style={{ width: `${pctB}%` }}
            />
          </>
        )}
      </div>
      <div className="mt-1 flex items-center justify-between font-mono text-[9px] uppercase sm:text-[10px]">
        <span className="truncate pr-2 text-arcade-blue">
          {pctA}% {nameA}
        </span>
        <span className="truncate pl-2 text-right text-arcade-pink">
          {pctB}% {nameB}
        </span>
      </div>
      {jurors === 0 && (
        <p className="mt-1 text-center font-arcade text-[6px] uppercase tracking-widest text-court-muted sm:text-[7px]">
          AWAITING JURORS — SHARE THE LINK
        </p>
      )}
    </div>
  );
}

// ---- The People vs The Judge (crowd consensus vs AI ruling) ----

interface PeopleVsJudgePanelProps {
  tally: CrowdVoteTally;
  jurors: number;
  finalWinner: PartySide;
  nameA: string;
  nameB: string;
  viewerVote: PartySide | null;
}

function PeopleVsJudgePanel({
  tally,
  jurors,
  finalWinner,
  nameA,
  nameB,
  viewerVote,
}: PeopleVsJudgePanelProps) {
  const majority = crowdMajority(tally);
  const crowdAgrees = majority !== "tie" && majority === finalWinner;
  const majorityPct = majority === "tie" ? 50 : crowdPercent(tally, majority);
  const majorityName = majority === "A" ? nameA : nameB;

  const stamp =
    majority === "tie"
      ? {
          label: "HUNG JURY",
          detail: `THE PEOPLE SPLIT ${crowdPercent(tally, "A")}/${crowdPercent(tally, "B")}. THE JUDGE BROKE THE TIE.`,
          color: "text-arcade-yellow",
          border: "border-arcade-yellow",
          glow: "shadow-[0_0_20px_rgba(255,230,0,0.2)]",
        }
      : crowdAgrees
        ? {
            label: "ABSOLUTE CONSENSUS",
            detail: `THE PEOPLE (${majorityPct}%) AND THE JUDGE STAND AS ONE.`,
            color: "text-arcade-green",
            border: "border-arcade-green",
            glow: "shadow-[0_0_20px_rgba(57,255,20,0.2)]",
          }
        : {
            label: "THE CROWD WAS WRONG",
            detail: `${majorityPct}% BACKED ${majorityName} — THE JUDGE ANSWERS TO NO ONE.`,
            color: "text-court-crimson",
            border: "border-court-crimson",
            glow: "shadow-[0_0_20px_rgba(255,32,64,0.25)]",
          };

  const viewerCalledIt = viewerVote !== null && viewerVote === finalWinner;
  const viewerPct = viewerVote !== null ? crowdPercent(tally, viewerVote) : 0;
  const viewerWithMajority = viewerVote !== null && viewerVote === majority;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className={`shrink-0 border-4 bg-black/70 p-2 sm:p-3 ${stamp.border} ${stamp.glow}`}
    >
      <div className="flex flex-col gap-1 border-b-2 border-dotted border-arcade-border pb-1.5 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-arcade text-[6px] uppercase tracking-wider text-foreground/85 sm:text-[7px]">
          THE PEOPLE VS THE JUDGE · {jurors} JUROR{jurors === 1 ? "" : "S"}
        </span>
        <motion.span
          initial={{ scale: 1.6, opacity: 0, rotate: -6 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ delay: 0.75, type: "spring", stiffness: 200 }}
          className={`font-arcade text-[8px] uppercase tracking-widest sm:text-[10px] ${stamp.color}`}
        >
          {stamp.label}
        </motion.span>
      </div>

      <p className={`mt-1.5 font-arcade text-[6px] leading-relaxed uppercase tracking-wider sm:text-[8px] ${stamp.color}`}>
        {stamp.detail}
      </p>

      <div className="mt-1.5 flex h-3 w-full overflow-hidden border-2 border-arcade-border bg-black">
        <div
          className="h-full bg-arcade-blue transition-all duration-700"
          style={{ width: `${crowdPercent(tally, "A")}%` }}
        />
        <div
          className="h-full bg-arcade-pink transition-all duration-700"
          style={{ width: `${crowdPercent(tally, "B")}%` }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between font-mono text-[9px] uppercase sm:text-[10px]">
        <span className="truncate pr-2 text-arcade-blue">
          {crowdPercent(tally, "A")}% {nameA}
        </span>
        <span className="truncate pl-2 text-arcade-pink">
          {crowdPercent(tally, "B")}% {nameB}
        </span>
      </div>

      {viewerVote !== null && (
        <div className="mt-1.5 space-y-0.5 border-t-2 border-dotted border-arcade-border pt-1 text-center">
          <p
            className={[
              "font-arcade text-[7px] uppercase tracking-wider sm:text-[8px]",
              viewerCalledIt ? "text-arcade-green" : "text-arcade-pink",
            ].join(" ")}
          >
            {viewerCalledIt
              ? "YOU CALLED IT — JUDGE MATERIAL"
              : "THE JUDGE OVERRULES YOU"}
          </p>
          <p className="font-arcade text-[6px] uppercase tracking-wider text-court-muted sm:text-[7px]">
            {majority === "tie"
              ? `YOU WERE ON THE ${viewerPct}% LINE OF A DEAD SPLIT`
              : viewerWithMajority
                ? `YOU WERE WITH THE ${viewerPct}% MAJORITY`
                : `YOU STOOD WITH THE ${viewerPct}% MINORITY`}
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ---- Fighter scorecard ----

interface SideFighterCardProps {
  party: Party;
  displayName: string;
  isWinner: boolean;
  playerNum: string;
  colorClass: string;
  barColor: string;
  scores?: SideScores;
  compact?: boolean;
  hideSprite?: boolean;
}

function SideFighterCard({
  party,
  displayName,
  isWinner,
  playerNum,
  colorClass,
  barColor,
  scores,
  compact = false,
  hideSprite = false,
}: SideFighterCardProps) {
  const fighterAsset = playerNum === "1" ? "fighterP1" : "fighterP2";
  const frameVariant = isWinner ? "green" : playerNum === "1" ? "blue" : "pink";
  const showSprite = !hideSprite;

  // Real judge scores drive the HP bar; pre-scoring verdicts fall back to
  // the old binary full/empty presentation.
  const weighted = scores ? weightedScore(scores) : null;
  const hpPercent =
    weighted !== null
      ? Math.max(6, Math.round((weighted / MAX_WEIGHTED_SCORE) * 100))
      : isWinner
        ? 100
        : 0;
  const hpLabel =
    weighted !== null
      ? String(weighted).padStart(2, "0")
      : isWinner
        ? "99"
        : "00";

  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: isWinner ? 0.1 : 0.2 }}
    >
      <PixelFrame
        variant={frameVariant}
        className={[
          "relative min-w-0 bg-black/80 transition-all duration-200",
          compact ? "p-1.5 sm:p-2.5" : "p-3 sm:p-4",
          isWinner ? "neon-glow-green" : "opacity-90",
        ].join(" ")}
      >
        {showSprite && !compact && (
          <div className="mb-2 flex justify-center">
            <PixelIcon asset={fighterAsset} size={72} alt={`Player ${playerNum}`} className="sm:hidden" />
            <PixelIcon asset={fighterAsset} size={96} alt={`Player ${playerNum}`} className="hidden sm:block" />
          </div>
        )}
        {showSprite && compact && (
          <div className="mb-1 flex justify-center">
            <PixelIcon asset={fighterAsset} size={36} alt={`Player ${playerNum}`} className="sm:hidden" />
            <PixelIcon asset={fighterAsset} size={40} alt={`Player ${playerNum}`} className="hidden sm:block" />
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-1 border-b-2 border-arcade-border pb-1">
          <span className={`min-w-0 truncate font-arcade text-[7px] sm:text-[8px] ${colorClass}`}>
            {displayName}
          </span>
          <span
            className={[
              "font-arcade text-[6px] px-1.5 py-0.5 border-2 sm:text-[7px]",
              isWinner
                ? "bg-arcade-green/20 text-arcade-green border-arcade-green animate-pulse shadow-[0_0_8px_rgba(57,255,20,0.6)]"
                : "bg-black text-foreground/70 border-arcade-border",
            ].join(" ")}
          >
            {isWinner ? "WINNER" : "KO"}
          </span>
        </div>

        <div className={compact ? "mt-1.5" : "mt-3"}>
          <div className="mb-0.5 flex justify-between font-arcade text-[6px] text-foreground/90 sm:text-[7px]">
            <span>{scores ? "JUDGE PWR" : "HP"}</span>
            <span>
              {hpLabel}
              {scores ? `/${MAX_WEIGHTED_SCORE}` : ""}
            </span>
          </div>
          <div className={`border-2 border-arcade-border bg-black p-0.5 ${compact ? "h-2.5" : "h-4"}`}>
            <div
              className={[
                "h-full transition-all duration-700",
                isWinner ? barColor : "bg-arcade-pink/70",
              ].join(" ")}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
          {scores && (
            <div className="mt-0.5 flex justify-between font-mono text-[8px] text-foreground/90 sm:text-[9px]">
              <span>LOGIC {scores.logic}/10</span>
              <span>EVID {scores.evidence}/10</span>
            </div>
          )}
        </div>

        <div className={compact ? "mt-1.5" : "mt-2 sm:mt-3"}>
          <p
            className={[
              "break-all font-mono leading-relaxed text-foreground sm:break-words",
              compact ? "text-[10px] sm:text-[11px]" : "text-xs",
            ].join(" ")}
          >
            {party.argument_text}
          </p>
        </div>

        {party.evidence_summary && (
          <div
            className={[
              "break-all border-t-2 border-dotted border-arcade-border font-mono italic text-court-muted sm:break-words",
              compact ? "mt-1.5 pt-1.5 text-[9px]" : "mt-3 pt-2 text-[10px] sm:mt-4",
            ].join(" ")}
          >
            <span className="mb-0.5 block font-arcade text-[7px] not-italic text-arcade-yellow">
              EVIDENCE_ROM:
            </span>
            {party.evidence_summary}
          </div>
        )}
      </PixelFrame>
    </motion.article>
  );
}
