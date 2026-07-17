import type { ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Audio } from "@remotion/media";
import { FONT_VARIABLES } from "../fonts";
import {
  AUDIO,
  DURATION_IN_FRAMES,
  ROUTE_TRANSITION_FRAMES,
  SCENES,
  SCREEN,
} from "../lib/timeline";
import { CAPTIONS } from "../data/demoCase";
import { DEVICE_H, IPhone17Frame } from "../components/IPhone17Frame";
import { StageBackground } from "../components/StageBackground";
import { CaptionOverlay } from "../components/CaptionOverlay";
import { EndCard } from "../components/EndCard";
import { HomeScreen } from "../screens/HomeScreen";
import { WizardScreen } from "../screens/WizardScreen";
import { JuryBoxScreen, TrapScreen } from "../screens/JuryTrapScreens";
import { VerdictScreen } from "../screens/VerdictScreen";
import { HallOfShameScreen } from "../screens/HallOfShameScreen";

const PHONE_ZOOM = 2.6;
// Largest scale at which the full device (2262px zoomed) still fits 1920px.
const MAX_SCALE = 0.84;

// ---- Camera track ----
// The device is NEVER cropped: every scale stays <= MAX_SCALE and vertical
// nudges (y) are sized so top/bottom edges remain on canvas. Captions get
// dedicated clear bands by nudging the phone away from their edge.

interface CamKey {
  f: number;
  s: number;
  /** Canvas-space Y offset (positive pushes the phone down). */
  y: number;
  rz: number;
  ry: number;
}

const CAM: CamKey[] = [
  // Entrance — slow glide in
  { f: 0, s: 0.58, y: 600, rz: -8, ry: 20 },
  { f: 40, s: 0.66, y: 160, rz: -4, ry: 10 },
  { f: 78, s: 0.72, y: 48, rz: -1.5, ry: 3 },
  { f: 100, s: 0.76, y: 36, rz: -0.5, ry: 1 },
  { f: 112, s: 0.8, y: 0, rz: 0, ry: 0 },
  // Title typing — gentle punch
  { f: 126, s: 0.83, y: 0, rz: 0, ry: 0 },
  { f: 172, s: 0.83, y: 0, rz: 0, ry: 0 },
  { f: 186, s: 0.8, y: 0, rz: 0, ry: 0 },
  // "TWO SIDES ENTER." band (top) — room for large captions
  { f: 206, s: 0.76, y: 56, rz: 0, ry: 0 },
  { f: 238, s: 0.76, y: 56, rz: 0, ry: 0 },
  // Side A argument punch
  { f: 244, s: 0.83, y: 0, rz: 0, ry: 0 },
  { f: 276, s: 0.83, y: 0, rz: 0, ry: 0 },
  { f: 286, s: 0.8, y: 0, rz: 0, ry: 0 },
  // Side B typing punch
  { f: 294, s: 0.82, y: 0, rz: 0, ry: 0 },
  { f: 352, s: 0.82, y: 0, rz: 0, ry: 0 },
  // "ONE EGO LEAVES DAMAGED." band (top)
  { f: 360, s: 0.76, y: 56, rz: 0, ry: 0 },
  { f: 390, s: 0.76, y: 56, rz: 0, ry: 0 },
  // Review scan + taps
  { f: 396, s: 0.81, y: 0, rz: 0, ry: 0 },
  { f: 452, s: 0.81, y: 0, rz: 0, ry: 0 },
  { f: 464, s: 0.8, y: 0, rz: 0, ry: 0 },
  // "NEW: JURY MODE" band (top, two lines)
  { f: 472, s: 0.76, y: 88, rz: 0, ry: 0 },
  { f: 548, s: 0.76, y: 88, rz: 0, ry: 0 },
  // Phone-swap swing into the friend's phone (THE TRAP)
  { f: 554, s: 0.78, y: 48, rz: -1.2, ry: 10 },
  { f: 566, s: 0.76, y: 64, rz: 0.4, ry: -3 },
  // "NEW: THE TRAP" band (top, two lines)
  { f: 572, s: 0.76, y: 88, rz: 0, ry: 0 },
  { f: 624, s: 0.76, y: 88, rz: 0, ry: 0 },
  // Trap tap
  { f: 632, s: 0.81, y: 0, rz: 0, ry: 0 },
  { f: 650, s: 0.81, y: 0, rz: 0, ry: 0 },
  // Swing back to the voter's jury box
  { f: 658, s: 0.78, y: -24, rz: 0.8, ry: 7 },
  // "5 MINUTES LATER…" band (bottom)
  { f: 668, s: 0.76, y: -72, rz: 0, ry: 0 },
  { f: 710, s: 0.76, y: -72, rz: 0, ry: 0 },
  // Countdown spin + unseal
  { f: 718, s: 0.82, y: 0, rz: 0, ry: 0 },
  { f: 766, s: 0.83, y: 0, rz: 0, ry: 0 },
  // K.O. settle to a full-phone beauty shot
  { f: 786, s: 0.74, y: 0, rz: 0, ry: 0 },
  // Verdict beauty + "THE COURT HAS SPOKEN." / Monad band (bottom)
  { f: 824, s: 0.72, y: -78, rz: 0, ry: 0 },
  { f: 900, s: 0.72, y: -78, rz: 0, ry: 0 },
  // Verdict read + scroll to reactions/share
  { f: 908, s: 0.81, y: 0, rz: 0, ry: 0 },
  { f: 1000, s: 0.81, y: 0, rz: 0, ry: 0 },
  // "SEND THIS TO THE GROUP CHAT" band (bottom)
  { f: 1004, s: 0.76, y: -72, rz: 0, ry: 0 },
  { f: 1032, s: 0.76, y: -72, rz: 0, ry: 0 },
  // HALL OF SHAME: caption band up top, then push in on the board
  { f: 1038, s: 0.76, y: 80, rz: 0, ry: 0 },
  { f: 1090, s: 0.76, y: 80, rz: 0, ry: 0 },
  { f: 1100, s: 0.81, y: 0, rz: 0, ry: 0 },
  { f: 1118, s: 0.81, y: 0, rz: 0, ry: 0 },
  // End pull-back
  { f: 1140, s: 0.6, y: 140, rz: 1.5, ry: -6 },
  { f: 1179, s: 0.54, y: 170, rz: 2.5, ry: -9 },
];

function camChannel(frame: number, pick: (k: CamKey) => number): number {
  return interpolate(
    frame,
    CAM.map((k) => k.f),
    CAM.map(pick),
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      // Softer camera — less whip, more cinematic glide
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }
  );
}

// ---- Route transitions (fast PageTransition feel) ----

function RouteFade({
  appearAt,
  leaveAt,
  animateIn = true,
  animateOut = true,
  children,
}: {
  appearAt: number;
  leaveAt: number;
  animateIn?: boolean;
  animateOut?: boolean;
  children: ReactNode;
}) {
  const frame = useCurrentFrame();
  if (frame < appearAt || frame >= leaveAt) return null;

  const enter = animateIn
    ? interpolate(frame, [appearAt, appearAt + ROUTE_TRANSITION_FRAMES], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.33, 1, 0.68, 1),
      })
    : 1;
  const exit = animateOut
    ? interpolate(frame, [leaveAt - ROUTE_TRANSITION_FRAMES, leaveAt - 1], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.33, 1, 0.68, 1),
      })
    : 1;

  const opacity = Math.min(enter, exit);
  const y = (1 - enter) * 14 + (1 - exit) * -10;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      {children}
    </div>
  );
}

/** CRT power-on effect over the first moments of the home screen. */
function CrtPowerOn({ children }: { children: ReactNode }) {
  const frame = useCurrentFrame();
  const openY = interpolate(frame, [2, 12], [0.012, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const openX = interpolate(frame, [0, 6], [0.6, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bright = interpolate(frame, [4, 20], [2.6, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dark = frame < 2;

  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: "#000" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scaleY(${openY}) scaleX(${openX})`,
          transformOrigin: "center",
          filter: `brightness(${bright})`,
          opacity: dark ? 0 : 1,
        }}
      >
        {children}
      </div>
      {frame >= 1 && frame <= 13 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "50%",
            height: 3,
            transform: "translateY(-50%)",
            background: "rgba(255,255,255,0.95)",
            boxShadow: "0 0 22px rgba(255,255,255,0.9)",
            opacity: interpolate(frame, [1, 6, 13], [0.9, 0.6, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        />
      )}
    </div>
  );
}

/** Everything shown on the phone display, switched on the master timeline. */
function PhoneScreens() {
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: "#050508" }}>
      <RouteFade appearAt={0} leaveAt={SCREEN.homeTo} animateIn={false}>
        <CrtPowerOn>
          <HomeScreen tapFrame={SCREEN.homeTapCta} />
        </CrtPowerOn>
      </RouteFade>

      <RouteFade appearAt={SCREEN.homeTo - ROUTE_TRANSITION_FRAMES} leaveAt={SCREEN.wizardTo}>
        <WizardScreen />
      </RouteFade>

      {/* Owner's jury box: COURT IN RECESS + countdown + judge status */}
      <RouteFade
        appearAt={SCREEN.wizardTo - ROUTE_TRANSITION_FRAMES}
        leaveAt={SCREEN.trapFrom + 4}
      >
        <JuryBoxScreen variant="owner" />
      </RouteFade>

      {/* THE TRAP — the friend's phone (swap sold by the camera swing) */}
      <RouteFade appearAt={SCREEN.trapFrom - 6} leaveAt={SCREEN.trapTo}>
        <TrapScreen />
      </RouteFade>

      {/* Voter's jury box: bet placed → clock hits zero → unseal */}
      <RouteFade
        appearAt={SCREEN.trapTo - 6}
        leaveAt={SCREEN.koFlash + 3}
        animateOut={false}
      >
        <JuryBoxScreen variant="voter" />
      </RouteFade>

      {/* Swap hidden under the K.O. white flash */}
      <RouteFade
        appearAt={SCREEN.koFlash}
        leaveAt={SCREEN.hallFrom}
        animateIn={false}
      >
        <VerdictScreen />
      </RouteFade>

      {/* HALL OF SHAME — the case is crowned #1 */}
      <RouteFade
        appearAt={SCREEN.hallFrom - ROUTE_TRANSITION_FRAMES}
        leaveAt={SCREEN.endHomeFrom}
      >
        <HallOfShameScreen />
      </RouteFade>

      <RouteFade
        appearAt={SCREEN.endHomeFrom - ROUTE_TRANSITION_FRAMES}
        leaveAt={DURATION_IN_FRAMES + 1}
        animateOut={false}
      >
        <HomeScreen />
      </RouteFade>
    </div>
  );
}

// ---- Audio schedule ----

const sfx = (file: string) => staticFile(`/remotion-sfx/${file}`);

interface Cue {
  file: string;
  at: number;
  volume: number;
  playbackRate?: number;
  trimAfter?: number;
}

const CUES: Cue[] = [
  { file: "crt-power-on.wav", at: AUDIO.crtPowerOn, volume: 0.7 },
  { file: "coin-insert.wav", at: AUDIO.coinInsert, volume: 0.75 },
  { file: "arcade-confirm.wav", at: AUDIO.arcadeStart, volume: 0.5 },
  { file: "tap.wav", at: AUDIO.tapHome, volume: 0.85 },
  { file: "whoosh.wav", at: AUDIO.whooshWizard, volume: 0.45 },
  { file: "type-loop.wav", at: AUDIO.typeTitle, volume: 0.55, trimAfter: 46 },
  { file: "tap.wav", at: AUDIO.tapCategory, volume: 0.8 },
  { file: "tap.wav", at: AUDIO.tapContinueA, volume: 0.8 },
  { file: "whoosh.wav", at: SCREEN.sideAFrom - 4, volume: 0.35 },
  { file: "type-loop.wav", at: AUDIO.typeNameA, volume: 0.5, trimAfter: 16 },
  { file: "type-loop.wav", at: AUDIO.typeArgA, volume: 0.55, trimAfter: 36 },
  { file: "tap.wav", at: AUDIO.tapContinueA2, volume: 0.8 },
  { file: "whoosh.wav", at: AUDIO.whooshSideB, volume: 0.35 },
  { file: "type-loop.wav", at: AUDIO.typeNameB, volume: 0.5, trimAfter: 14 },
  { file: "type-loop.wav", at: AUDIO.typeArgB, volume: 0.55, trimAfter: 36 },
  { file: "tap.wav", at: AUDIO.tapContinueB, volume: 0.8 },
  { file: "whoosh.wav", at: AUDIO.whooshReview, volume: 0.35 },
  { file: "tap.wav", at: AUDIO.tapJury, volume: 0.8 },
  { file: "pop.wav", at: AUDIO.popJuryOn, volume: 0.65 },
  { file: "tap.wav", at: AUDIO.tapConsent1, volume: 0.75 },
  { file: "tap.wav", at: AUDIO.tapConsent2, volume: 0.75 },
  { file: "tap.wav", at: AUDIO.tapSubmit, volume: 0.85 },
  { file: "slam.wav", at: AUDIO.slamSubmit, volume: 0.6 },
  { file: "whoosh.wav", at: AUDIO.whooshJuryBox, volume: 0.45 },
  { file: "riser.wav", at: AUDIO.riser, volume: 0.4 },
  { file: "whoosh.wav", at: AUDIO.whooshTrap, volume: 0.5 },
  { file: "arcade-confirm.wav", at: AUDIO.confirmTrap, volume: 0.4 },
  { file: "tap.wav", at: AUDIO.tapTrapSide, volume: 0.85 },
  { file: "slam.wav", at: AUDIO.slamTrapSide, volume: 0.55 },
  { file: "whoosh.wav", at: SCREEN.juryVoterFrom - 4, volume: 0.4 },
  { file: "riser.wav", at: AUDIO.spinRiser, volume: 0.55, playbackRate: 1.6 },
  { file: "type-loop.wav", at: AUDIO.spinTicks, volume: 0.32, playbackRate: 2, trimAfter: 32 },
  { file: "slam.wav", at: AUDIO.slamUnseal, volume: 0.65 },
  { file: "coin-insert.wav", at: AUDIO.coinUnseal, volume: 0.5 },
  { file: "impact.wav", at: AUDIO.impact, volume: 0.95 },
  { file: "slam.wav", at: AUDIO.slamVerdict, volume: 0.7 },
  { file: "crowd.wav", at: AUDIO.crowd, volume: 0.5 },
  { file: "arcade-confirm.wav", at: AUDIO.confirmVerdict, volume: 0.45 },
  { file: "pop.wav", at: AUDIO.popLaugh, volume: 0.7 },
  { file: "tap.wav", at: SCREEN.tapLaugh, volume: 0.75 },
  { file: "pop.wav", at: AUDIO.popShock, volume: 0.7 },
  { file: "tap.wav", at: SCREEN.tapShock, volume: 0.75 },
  { file: "tap.wav", at: AUDIO.tapShareBtn, volume: 0.8 },
  { file: "pop.wav", at: AUDIO.popSocial, volume: 0.6 },
  { file: "whoosh.wav", at: AUDIO.whooshHall, volume: 0.5 },
  { file: "crowd.wav", at: AUDIO.crowdHall, volume: 0.4 },
  { file: "arcade-confirm.wav", at: AUDIO.confirmHall, volume: 0.4 },
  { file: "whoosh.wav", at: AUDIO.whooshEnd, volume: 0.5 },
  { file: "chime-end.wav", at: AUDIO.chimeEnd, volume: 0.8 },
];

function SoundTrack() {
  return (
    <>
      {/* The product's own arcade BGM loop (public/sounds/bg.mp3), ducked at the K.O. */}
      <Audio
        src={staticFile("/sounds/bg.mp3")}
        loop
        volume={(f) =>
          interpolate(
            f,
            [0, 20, AUDIO.impact - 10, AUDIO.impact + 4, AUDIO.impact + 44, 1116, 1174],
            [0, 0.2, 0.2, 0.08, 0.22, 0.24, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          )
        }
      />
      {/* The app's real K.O. stinger on the verdict reveal */}
      <Sequence from={AUDIO.impact} durationInFrames={70}>
        <Audio src={staticFile("/sounds/ko.mp3")} volume={0.75} trimAfter={68} />
      </Sequence>
      {CUES.map((cue, i) => (
        <Sequence key={i} from={cue.at} durationInFrames={(cue.trimAfter ?? 150) + 10}>
          <Audio
            src={sfx(cue.file)}
            volume={cue.volume}
            playbackRate={cue.playbackRate}
            trimAfter={cue.trimAfter}
          />
        </Sequence>
      ))}
    </>
  );
}

// ---- Composition ----

export function BeefViralIphoneDemo() {
  const frame = useCurrentFrame();

  const rawS = camChannel(frame, (k) => k.s);
  const s = Math.min(MAX_SCALE, rawS);
  const rz = camChannel(frame, (k) => k.rz);
  const ry = camChannel(frame, (k) => k.ry);
  const extraY = camChannel(frame, (k) => k.y);

  // Never let a vertical nudge push the device off-canvas.
  const margin = Math.max(0, (1920 - DEVICE_H * PHONE_ZOOM * s) / 2);
  const boundedY = Math.max(-margin, Math.min(margin, extraY));

  // Subtle handheld sway (kept gentle for a smooth watch)
  const swayX = Math.sin(frame * 0.032) * 2 + Math.sin(frame * 0.011) * 1.2;
  const swayY = Math.cos(frame * 0.024) * 1.4;

  // Impact shake at the K.O.
  const sinceImpact = frame - SCREEN.koFlash;
  const impactAmp = sinceImpact >= 0 ? 12 * Math.exp(-sinceImpact / 6.5) : 0;
  const shakeX = Math.sin(frame * 2.63) * impactAmp;
  const shakeY = Math.cos(frame * 3.11) * impactAmp;

  // Device glow: gentle all along, pulsing on the end card
  const endPulse =
    frame >= SCENES.end.from
      ? 0.5 + 0.45 * ((Math.sin((frame - SCENES.end.from) / 9) + 1) / 2)
      : 0.5;

  return (
    <AbsoluteFill style={{ backgroundColor: "#050508", ...FONT_VARIABLES }}>
      <StageBackground />

      {/* Phone rig */}
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          perspective: 3400,
        }}
      >
        <div
          style={{
            transform: [
              `translate(${swayX + shakeX}px, ${boundedY + swayY + shakeY}px)`,
              `rotate(${rz}deg)`,
              `scale(${s})`,
            ].join(" "),
          }}
        >
          <div style={{ transform: `rotateY(${ry}deg)` }}>
            <div style={{ zoom: PHONE_ZOOM }}>
              <IPhone17Frame glow={endPulse}>
                <PhoneScreens />
              </IPhone17Frame>
            </div>
          </div>
        </div>
      </AbsoluteFill>

      {/* Burned-in captions — large, sound-off friendly */}
      <CaptionOverlay text={CAPTIONS.hook} from={28} to={90} position="top" accent="#ffe600" fontSize={44} edgeOffset={48} />
      <CaptionOverlay text={CAPTIONS.twoSides} from={206} to={240} position="top" accent="#00f0ff" fontSize={54} edgeOffset={36} />
      <CaptionOverlay text={CAPTIONS.oneEgo} from={358} to={392} position="top" accent="#ff007f" fontSize={48} edgeOffset={38} />
      <CaptionOverlay text={CAPTIONS.newJury} subText={CAPTIONS.crowdFirst} from={472} to={550} position="top" accent="#ff2040" fontSize={56} edgeOffset={28} />
      <CaptionOverlay text={CAPTIONS.newTrap} subText={CAPTIONS.pickBlind} from={570} to={624} position="top" accent="#ff2040" fontSize={56} edgeOffset={28} />
      <CaptionOverlay text={CAPTIONS.fiveMinLater} from={666} to={710} position="bottom" accent="#ffe600" fontSize={50} edgeOffset={40} pop />
      <CaptionOverlay text={CAPTIONS.courtSpoken} subText={CAPTIONS.sealedOnChain} from={824} to={900} position="bottom" accent="#ffe600" fontSize={50} edgeOffset={36} />
      <CaptionOverlay text={CAPTIONS.sendIt} from={1002} to={1032} position="bottom" accent="#ff007f" fontSize={42} edgeOffset={40} pop />
      <CaptionOverlay text={CAPTIONS.hall} from={1038} to={1094} position="top" accent="#ff007f" fontSize={48} edgeOffset={36} />

      <EndCard />

      <SoundTrack />
    </AbsoluteFill>
  );
}
