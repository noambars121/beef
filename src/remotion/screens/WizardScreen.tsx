import type { CSSProperties, ReactNode } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { CASE_CATEGORIES, VERDICT_TONES } from "@/types";
import { DEMO_CASE, DEMO_SIDE_A, DEMO_SIDE_B } from "../data/demoCase";
import { SCREEN } from "../lib/timeline";
import { typedSlice } from "../components/TypeText";
import { RemotionPixelIcon } from "../components/RemotionPixelIcon";
import { ScreenBackground } from "../components/StageBackground";
import { AppChrome } from "../components/AppChrome";
import { TapIndicator } from "../components/TapIndicator";
import { SCREEN_H, SCREEN_W } from "../components/IPhone17Frame";

type WizardStep = "dispute" | "side-a" | "side-b" | "review";

// Mirrors STEPS in src/components/case/FormStepIndicator.tsx (kept local so
// the video bundle never imports next/image through the real module).
const STEPS = [
  { id: "dispute" as const, label: "DISPUTE", asset: "scales" as const },
  { id: "side-a" as const, label: "P1", asset: "fighterP1" as const },
  { id: "side-b" as const, label: "P2", asset: "fighterP2" as const },
  { id: "review" as const, label: "SEAL", asset: "gavel" as const },
];

const FOCUS_GLOW: CSSProperties = {
  borderColor: "#ffe600",
  boxShadow: "0 0 15px rgba(255, 230, 0, 0.4)",
};

/** Recreates the FormStepIndicator (motion pulse re-driven by frames). */
function StepIndicator({ step, compact }: { step: WizardStep; compact: boolean }) {
  const frame = useCurrentFrame();
  const currentIndex = STEPS.findIndex((s) => s.id === step);
  const pulse = 1 + 0.05 * Math.sin((frame / 45) * Math.PI * 2);

  return (
    <nav
      aria-label="Form progress"
      className={[
        "shrink-0 border-b-4 border-double border-arcade-border",
        compact ? "mb-3 pb-3" : "mb-4 pb-4",
      ].join(" ")}
    >
      <ol className="flex items-center justify-between gap-0.5">
        {STEPS.map((s, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = s.id === step;
          return (
            <li key={s.id} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <div className="relative flex w-full items-center">
                {index > 0 && (
                  <div
                    className={[
                      "absolute right-1/2 h-1 w-full -translate-y-1/2",
                      isComplete || isCurrent ? "bg-arcade-yellow" : "bg-arcade-border",
                    ].join(" ")}
                    style={{ top: "50%", width: "100%", left: "-50%" }}
                  />
                )}
                <div
                  className={[
                    "relative z-10 mx-auto flex shrink-0 items-center justify-center border-4 bg-black",
                    compact ? "h-8 w-8" : "h-9 w-9",
                    isCurrent
                      ? "border-arcade-yellow shadow-[0_0_10px_rgba(255,230,0,0.5)]"
                      : isComplete
                        ? "border-arcade-green"
                        : "border-arcade-border opacity-60",
                  ].join(" ")}
                  style={isCurrent ? { transform: `scale(${pulse})` } : undefined}
                >
                  <RemotionPixelIcon asset={s.asset} size={compact ? 18 : 20} />
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-center font-arcade text-[7px] text-arcade-yellow">
        STEP {currentIndex + 1}/{STEPS.length}: {STEPS[currentIndex].label}
      </p>
    </nav>
  );
}

/** Emulates the wizard's AnimatePresence mode="wait" step slide (0.25s). */
function StepSlide({
  from,
  to,
  children,
}: {
  from: number;
  to: number;
  children: ReactNode;
}) {
  const frame = useCurrentFrame();
  if (frame < from || frame >= to) return null;

  const enter = interpolate(frame, [from, from + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exit = interpolate(frame, [to - 8, to - 1], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(enter, exit);
  const x = (1 - enter) * 16 + (1 - exit) * -16;

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      style={{ opacity, transform: `translateX(${x}px)` }}
    >
      {children}
    </div>
  );
}

function PressWrap({
  tapFrame,
  children,
  className = "",
}: {
  tapFrame: number;
  children: ReactNode;
  className?: string;
}) {
  const frame = useCurrentFrame();
  const press = interpolate(frame, [tapFrame - 1, tapFrame + 2, tapFrame + 8], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      className={className}
      style={{ transform: `translateY(${press * 2}px) scale(${1 - press * 0.03})` }}
    >
      {children}
    </div>
  );
}

// ---- Steps (copy of the real step components, motion removed) ----

function DisputeStepR() {
  const frame = useCurrentFrame();
  const typedTitle = typedSlice(
    frame,
    DEMO_CASE.title,
    SCREEN.titleTypeStart,
    SCREEN.titleTypeEnd
  );
  const isTypingTitle = frame >= SCREEN.titleTypeStart - 6 && frame <= SCREEN.titleTypeEnd + 10;
  const categoryChosen = frame >= SCREEN.categoryTap + 2;

  return (
    <div className="space-y-5 text-left">
      <div className="text-left">
        <p className="font-arcade text-[7px] uppercase tracking-wider text-arcade-pink">
          STAGE 01
        </p>
        <h2 className="mt-2 font-arcade text-xs leading-relaxed text-arcade-yellow">
          NAME THE FIGHT
        </h2>
        <p className="mt-2 font-mono text-[10px] uppercase text-court-muted">
          Pick your arena and title the match.
        </p>
      </div>

      <div className="space-y-5 text-left">
        <Input
          name="title"
          label="Case Title"
          placeholder="What's the drama?"
          value={typedTitle}
          readOnly
          hint="Punchy headline for the docket"
          maxLength={120}
          style={isTypingTitle ? FOCUS_GLOW : undefined}
        />

        <div className="space-y-1.5">
          <label htmlFor="category" className="arcade-label">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={categoryChosen ? DEMO_CASE.category : ""}
            onChange={() => undefined}
            className={[
              "arcade-input touch-target appearance-none text-base",
              categoryChosen ? "" : "text-court-muted",
            ].join(" ")}
            style={
              frame >= SCREEN.categoryTap - 2 && frame <= SCREEN.categoryTap + 10
                ? FOCUS_GLOW
                : undefined
            }
          >
            <option value="" disabled>
              Choose the arena…
            </option>
            {CASE_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

const SIDE_CONFIG = {
  A: {
    accent: "text-arcade-blue",
    border: "border-arcade-blue/50",
    glow: "neon-glow-blue",
    badge: "border-arcade-blue text-arcade-blue bg-arcade-blue/10",
    title: "PLAYER 1",
    subtitle: "Make your case.",
    namePlaceholder: "Danny, Mom, The Roommate…",
  },
  B: {
    accent: "text-arcade-pink",
    border: "border-arcade-pink/50",
    glow: "neon-glow-pink",
    badge: "border-arcade-pink text-arcade-pink bg-arcade-pink/10",
    title: "PLAYER 2",
    subtitle: "Counter-attack.",
    namePlaceholder: "Maya, Dad, The Landlord…",
  },
} as const;

function PartyStepR({ side }: { side: "A" | "B" }) {
  const frame = useCurrentFrame();
  const config = SIDE_CONFIG[side];
  const data = side === "A" ? DEMO_SIDE_A : DEMO_SIDE_B;
  const nameStart = side === "A" ? SCREEN.sideANameStart : SCREEN.sideBNameStart;
  const nameEnd = side === "A" ? SCREEN.sideANameEnd : SCREEN.sideBNameEnd;
  const argStart = side === "A" ? SCREEN.sideAArgStart : SCREEN.sideBArgStart;
  const argEnd = side === "A" ? SCREEN.sideAArgEnd : SCREEN.sideBArgEnd;

  const typedName = typedSlice(frame, data.name, nameStart, nameEnd);
  const typedArg = typedSlice(frame, data.argument, argStart, argEnd);
  const nameFocused = frame >= nameStart - 6 && frame <= nameEnd + 4;
  const argFocused = frame > nameEnd + 4 && frame <= argEnd + 10;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="shrink-0 text-left">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={`inline-block border-2 px-2 py-0.5 font-arcade text-[7px] uppercase tracking-wider ${config.badge}`}
          >
            SIDE {side}
          </span>
          <h2 className={`font-arcade text-xs ${config.accent}`}>{config.title}</h2>
          <span className="font-mono text-[10px] uppercase text-court-muted">
            {config.subtitle}
          </span>
        </div>
      </div>

      <div
        className={`flex min-h-0 flex-1 flex-col gap-3 border-4 bg-black/80 p-3 ${config.border} ${config.glow}`}
      >
        <Input
          name={`name_${side.toLowerCase()}`}
          label="Fighter Name (Optional)"
          placeholder={config.namePlaceholder}
          value={typedName}
          readOnly
          hint="Real stakes need real names — tag your opponent"
          maxLength={24}
          className="py-2 text-base"
          style={nameFocused ? FOCUS_GLOW : undefined}
        />

        <Textarea
          name={`argument_${side.toLowerCase()}`}
          label="File your evidence. No crying."
          placeholder="Present your strongest case..."
          value={typedArg}
          readOnly
          maxLength={3000}
          showCount
          rows={4}
          className="!min-h-0 resize-none py-2 text-base"
          style={argFocused ? FOCUS_GLOW : undefined}
        />

        <Textarea
          name={`evidence_${side.toLowerCase()}`}
          label="Evidence (Optional)"
          placeholder="Screenshots, timestamps, witnesses..."
          value=""
          readOnly
          maxLength={1000}
          rows={2}
          className="!min-h-0 shrink-0 resize-none py-2 text-base"
        />
      </div>
    </div>
  );
}

function ReviewStepR() {
  const frame = useCurrentFrame();
  // Savage tone selection pulse
  const toneFlash = interpolate(
    frame,
    [SCREEN.reviewToneFlash, SCREEN.reviewToneFlash + 4, SCREEN.reviewToneFlash + 12],
    [0, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="shrink-0 text-left">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="font-arcade text-[7px] uppercase tracking-wider text-arcade-yellow">
            FINAL REVIEW
          </p>
          <h2 className="font-arcade text-xs text-foreground">SEAL THE ROM</h2>
          <span className="font-mono text-[10px] uppercase text-court-muted">
            Pick the judge&apos;s tone.
          </span>
        </div>
      </div>

      <article className="shrink-0 border-4 border-arcade-border bg-black/80 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-arcade text-[7px] uppercase tracking-wider text-arcade-yellow">
            MATCH
          </p>
          <span className="border-2 border-arcade-border px-2 py-0.5 font-arcade text-[6px] uppercase tracking-wider text-court-muted">
            {DEMO_CASE.categoryLabel}
          </span>
        </div>
        <h3 className="mt-1 break-words font-mono text-sm font-bold leading-snug line-clamp-2">
          {DEMO_CASE.title}
        </h3>
      </article>

      <div className="grid min-h-0 shrink-0 gap-2">
        <article className="border-4 border-arcade-blue/40 bg-arcade-blue/5 p-3">
          <p className="break-words font-arcade text-[7px] uppercase tracking-wider text-arcade-blue">
            P1 — {DEMO_SIDE_A.name}
          </p>
          <p className="mt-1 break-words text-xs leading-relaxed text-foreground/90 line-clamp-3">
            {DEMO_SIDE_A.argument}
          </p>
        </article>

        <article className="border-4 border-arcade-pink/40 bg-arcade-pink/5 p-3">
          <p className="break-words font-arcade text-[7px] uppercase tracking-wider text-arcade-pink">
            P2 — {DEMO_SIDE_B.name}
          </p>
          <p className="mt-1 break-words text-xs leading-relaxed text-foreground/90 line-clamp-3">
            {DEMO_SIDE_B.argument}
          </p>
        </article>
      </div>

      <div className="min-h-0 shrink-0">
        <p className="arcade-label mb-2">Judge&apos;s Tone</p>
        <div className="grid grid-cols-1 gap-2">
          {VERDICT_TONES.map((tone) => {
            const selected = tone.value === DEMO_CASE.tone;
            return (
              <label
                key={tone.value}
                className={[
                  "touch-target cursor-pointer border-4 p-2",
                  selected
                    ? "border-arcade-yellow bg-arcade-yellow/10 neon-glow-yellow"
                    : "border-arcade-border bg-black",
                ].join(" ")}
                style={
                  selected
                    ? { transform: `scale(${1 + toneFlash * 0.03})` }
                    : undefined
                }
              >
                <input
                  type="radio"
                  name="tone"
                  value={tone.value}
                  checked={selected}
                  readOnly
                  className="sr-only"
                />
                <p
                  className={[
                    "font-arcade text-[8px] uppercase tracking-wider",
                    selected ? "text-arcade-yellow" : "text-foreground",
                  ].join(" ")}
                >
                  {tone.label}
                </p>
                <p className="mt-0.5 font-mono text-[10px] leading-snug text-court-muted line-clamp-2">
                  {tone.description}
                </p>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---- Whole wizard page (adapts /case/new + CaseSubmissionForm shell) ----

export function WizardScreen() {
  const frame = useCurrentFrame();

  const step: WizardStep =
    frame < SCREEN.disputeStepEnd
      ? "dispute"
      : frame < SCREEN.sideAEnd
        ? "side-a"
        : frame < SCREEN.sideBEnd
          ? "side-b"
          : "review";

  const isCompactStep = step !== "dispute";

  const continueTap =
    step === "dispute"
      ? SCREEN.disputeContinueTap
      : step === "side-a"
        ? SCREEN.sideAContinueTap
        : step === "side-b"
          ? SCREEN.sideBContinueTap
          : SCREEN.submitTap;

  return (
    <div
      className="relative overflow-hidden"
      style={{ width: SCREEN_W, height: SCREEN_H }}
    >
      <ScreenBackground route="wizard" />
      <AppChrome />

      <main
        className="page-shell relative z-10 items-stretch justify-start py-2"
        style={{ paddingTop: 58, paddingBottom: 18 }}
      >
        <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col">
          <div className="mb-2 flex shrink-0 items-center justify-between gap-2 pr-14">
            <span className="touch-target inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-none border-4 border-arcade-border bg-black px-3 py-2 font-arcade text-[8px] uppercase tracking-wider text-court-muted">
              ← BACK
            </span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col items-stretch">
            <div className="arcade-panel arcade-screen flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-none p-4">
              {step === "dispute" && (
                <header className="mb-2 shrink-0 text-center">
                  <p className="font-arcade text-[7px] uppercase tracking-[0.2em] text-arcade-pink">
                    STAGE 01: CHARACTER SELECT
                  </p>
                  <h1 className="mx-auto mt-1 font-arcade text-sm leading-relaxed text-arcade-yellow filter drop-shadow-[0_2px_0_#000]">
                    INSERT YOUR DISPUTE
                  </h1>
                </header>
              )}

              <StepIndicator step={step} compact={isCompactStep} />

              <div
                className={[
                  "min-h-0 flex-1 px-0.5 text-left",
                  isCompactStep ? "flex flex-col overflow-hidden" : "overflow-y-auto",
                ].join(" ")}
              >
                <StepSlide from={SCREEN.wizardFrom} to={SCREEN.disputeStepEnd}>
                  <DisputeStepR />
                </StepSlide>
                <StepSlide from={SCREEN.sideAFrom} to={SCREEN.sideAEnd}>
                  <PartyStepR side="A" />
                </StepSlide>
                <StepSlide from={SCREEN.sideBFrom} to={SCREEN.sideBEnd}>
                  <PartyStepR side="B" />
                </StepSlide>
                <StepSlide from={SCREEN.reviewFrom} to={SCREEN.wizardTo + 10}>
                  <ReviewStepR />
                </StepSlide>
              </div>

              <div className="mt-3 flex shrink-0 flex-col-reverse gap-2 border-t-4 border-arcade-border pt-3">
                <Button variant="ghost" className="w-full">
                  ← BACK
                </Button>

                {step === "review" ? (
                  <PressWrap tapFrame={SCREEN.submitTap} className="w-full">
                    <Button variant="primary" size="lg" className="w-full">
                      <span className="inline-flex items-center gap-2">
                        <RemotionPixelIcon asset="gavel" size={18} />
                        DRAG THEM TO COURT
                      </span>
                    </Button>
                  </PressWrap>
                ) : (
                  <PressWrap tapFrame={continueTap} className="w-full">
                    <Button variant="secondary" className="w-full">
                      CONTINUE →
                    </Button>
                  </PressWrap>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Tap choreography */}
      <TapIndicator x={196} y={531} tapFrame={SCREEN.categoryTap} />
      <TapIndicator x={196} y={748} tapFrame={SCREEN.disputeContinueTap} />
      <TapIndicator x={196} y={748} tapFrame={SCREEN.sideAContinueTap} />
      <TapIndicator x={196} y={748} tapFrame={SCREEN.sideBContinueTap} />
      <TapIndicator x={196} y={748} tapFrame={SCREEN.submitTap} />
    </div>
  );
}
