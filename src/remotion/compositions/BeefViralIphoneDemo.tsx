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
import { AUDIO, DURATION_IN_FRAMES, SCENES, SCREEN } from "../lib/timeline";
import { CAPTIONS } from "../data/demoCase";
import { DEVICE_H, IPhone17Frame } from "../components/IPhone17Frame";
import { StageBackground } from "../components/StageBackground";
import { CaptionOverlay } from "../components/CaptionOverlay";
import { EndCard } from "../components/EndCard";
import { HomeScreen } from "../screens/HomeScreen";
import { WizardScreen } from "../screens/WizardScreen";
import { DeliberationScreen } from "../screens/DeliberationScreen";
import { VerdictScreen } from "../screens/VerdictScreen";

const PHONE_ZOOM = 2.6;
const SCREEN_CENTER_Y = 426; // logical center of the 852pt screen

// ---- Camera track ----

interface CamKey {
  f: number;
  s: number;
  /** Logical screen Y the camera centers on (426 = screen center). */
  fy: number;
  rz: number;
  ry: number;
  /** Extra canvas-space Y offset (used for entrance/end framing). */
  y: number;
}

const CAM: CamKey[] = [
  { f: 0, s: 0.6, fy: 426, rz: -10, ry: 24, y: 620 },
  { f: 42, s: 0.68, fy: 426, rz: -5, ry: 13, y: 150 },
  { f: 88, s: 0.7, fy: 426, rz: -2, ry: 5, y: 0 },
  { f: 112, s: 0.74, fy: 426, rz: -1, ry: 2.5, y: 0 },
  { f: 142, s: 0.865, fy: 426, rz: 0, ry: 0, y: 0 },
  { f: 166, s: 0.865, fy: 426, rz: 0, ry: 0, y: 0 },
  // Punch in on the title being typed
  { f: 182, s: 0.98, fy: 340, rz: 0, ry: 0, y: 0 },
  { f: 232, s: 0.98, fy: 340, rz: 0, ry: 0, y: 0 },
  { f: 254, s: 0.865, fy: 426, rz: 0, ry: 0, y: 0 },
  // Side A argument punch
  { f: 330, s: 0.865, fy: 426, rz: 0, ry: 0, y: 0 },
  { f: 346, s: 0.95, fy: 400, rz: 0, ry: 0, y: 0 },
  { f: 394, s: 0.95, fy: 400, rz: 0, ry: 0, y: 0 },
  { f: 412, s: 0.865, fy: 426, rz: 0, ry: 0, y: 0 },
  // Side B argument punch
  { f: 458, s: 0.865, fy: 426, rz: 0, ry: 0, y: 0 },
  { f: 472, s: 0.94, fy: 400, rz: 0, ry: 0, y: 0 },
  { f: 508, s: 0.94, fy: 400, rz: 0, ry: 0, y: 0 },
  { f: 526, s: 0.865, fy: 426, rz: 0, ry: 0, y: 0 },
  // Review scan (slow pan down the summary)
  { f: 534, s: 0.885, fy: 380, rz: 0, ry: 0, y: 0 },
  { f: 598, s: 0.885, fy: 500, rz: 0, ry: 0, y: 0 },
  { f: 614, s: 0.865, fy: 426, rz: 0, ry: 0, y: 0 },
  // Deliberation creep (tension)
  { f: 640, s: 0.875, fy: 430, rz: 0, ry: 0, y: 0 },
  { f: 716, s: 0.93, fy: 430, rz: 0, ry: 0, y: 0 },
  // KO punch + settle
  { f: 722, s: 1.04, fy: 420, rz: 0, ry: 0, y: 0 },
  { f: 740, s: 0.95, fy: 426, rz: 0, ry: 0, y: 0 },
  { f: 764, s: 0.9, fy: 426, rz: 0, ry: 0, y: 0 },
  // Verdict beauty pull-back ("THE COURT HAS SPOKEN." beat)
  { f: 800, s: 0.79, fy: 426, rz: 0, ry: 0, y: 0 },
  { f: 864, s: 0.79, fy: 426, rz: 0, ry: 0, y: 0 },
  // Verdict read
  { f: 892, s: 0.9, fy: 420, rz: 0, ry: 0, y: 0 },
  { f: 956, s: 0.885, fy: 435, rz: 0, ry: 0, y: 0 },
  // Share section
  { f: 1004, s: 0.9, fy: 470, rz: 0, ry: 0, y: 0 },
  { f: 1096, s: 0.92, fy: 500, rz: 0, ry: 0, y: 0 },
  // Quick pull-back so the social-proof pop sits clear of the UI
  { f: 1104, s: 0.92, fy: 500, rz: 0, ry: 0, y: 0 },
  { f: 1122, s: 0.8, fy: 426, rz: 0, ry: 0, y: -40 },
  { f: 1148, s: 0.87, fy: 445, rz: 0, ry: 0, y: 0 },
  // End pull-back
  { f: 1188, s: 0.6, fy: 426, rz: 2, ry: -7, y: 150 },
  { f: 1259, s: 0.55, fy: 426, rz: 3.5, ry: -11, y: 170 },
];

function camChannel(frame: number, pick: (k: CamKey) => number): number {
  return interpolate(
    frame,
    CAM.map((k) => k.f),
    CAM.map(pick),
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    }
  );
}

// ---- Route transitions (mirrors the app's PageTransition feel) ----

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
    ? interpolate(frame, [appearAt, appearAt + 13], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      })
    : 1;
  const exit = animateOut
    ? interpolate(frame, [leaveAt - 13, leaveAt - 1], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      })
    : 1;

  const opacity = Math.min(enter, exit);
  const y = (1 - enter) * 10 + (1 - exit) * -8;

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

      <RouteFade appearAt={SCREEN.homeTo - 13} leaveAt={SCREEN.wizardTo}>
        <WizardScreen />
      </RouteFade>

      <RouteFade
        appearAt={SCREEN.wizardTo - 13}
        leaveAt={SCREEN.koFlash + 4}
        animateOut={false}
      >
        <DeliberationScreen />
      </RouteFade>

      {/* Swap hidden under the K.O. white flash */}
      <RouteFade
        appearAt={SCREEN.koFlash + 4}
        leaveAt={SCREEN.endHomeFrom}
        animateIn={false}
      >
        <VerdictScreen />
      </RouteFade>

      <RouteFade
        appearAt={SCREEN.endHomeFrom - 13}
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
  { file: "type-loop.wav", at: AUDIO.typeTitle, volume: 0.55, trimAfter: 70 },
  { file: "tap.wav", at: AUDIO.tapCategory, volume: 0.8 },
  { file: "tap.wav", at: AUDIO.tapContinueA, volume: 0.8 },
  { file: "whoosh.wav", at: SCREEN.sideAFrom - 4, volume: 0.35 },
  { file: "type-loop.wav", at: AUDIO.typeNameA, volume: 0.5, trimAfter: 24 },
  { file: "type-loop.wav", at: AUDIO.typeArgA, volume: 0.55, trimAfter: 58 },
  { file: "tap.wav", at: AUDIO.tapContinueA2, volume: 0.8 },
  { file: "whoosh.wav", at: AUDIO.whooshSideB, volume: 0.35 },
  { file: "type-loop.wav", at: AUDIO.typeNameB, volume: 0.5, trimAfter: 22 },
  { file: "type-loop.wav", at: AUDIO.typeArgB, volume: 0.55, trimAfter: 54 },
  { file: "tap.wav", at: AUDIO.tapContinueB, volume: 0.8 },
  { file: "whoosh.wav", at: AUDIO.whooshReview, volume: 0.35 },
  { file: "tap.wav", at: AUDIO.tapSubmit, volume: 0.85 },
  { file: "slam.wav", at: AUDIO.slamSubmit, volume: 0.6 },
  { file: "whoosh.wav", at: SCREEN.wizardTo - 8, volume: 0.45 },
  { file: "type-loop.wav", at: SCREEN.deliberationFrom + 8, volume: 0.16, playbackRate: 1.35, trimAfter: 66 },
  { file: "riser.wav", at: AUDIO.riser, volume: 0.6 },
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
            [0, 20, AUDIO.impact - 10, AUDIO.impact + 4, AUDIO.impact + 50, 1200, 1250],
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

  const s = camChannel(frame, (k) => k.s);
  const fy = camChannel(frame, (k) => k.fy);
  const rz = camChannel(frame, (k) => k.rz);
  const ry = camChannel(frame, (k) => k.ry);
  const extraY = camChannel(frame, (k) => k.y);

  // Center the focused screen point, clamped so the device never detaches
  // from the viewport edges during close-ups.
  const rawShift = (SCREEN_CENTER_Y - fy) * PHONE_ZOOM * s;
  const maxShift = Math.max(0, (DEVICE_H * PHONE_ZOOM * s) / 2 - 960 - 8);
  const focusShift = Math.max(-maxShift, Math.min(maxShift, rawShift));

  // Subtle handheld sway
  const swayX = Math.sin(frame * 0.041) * 3 + Math.sin(frame * 0.013) * 2;
  const swayY = Math.cos(frame * 0.029) * 2.6;

  // Impact shake at the K.O.
  const sinceImpact = frame - SCREEN.koFlash;
  const impactAmp = sinceImpact >= 0 ? 15 * Math.exp(-sinceImpact / 5.5) : 0;
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
              `translate(${swayX + shakeX}px, ${extraY + focusShift + swayY + shakeY}px)`,
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

      {/* Burned-in captions (sound-off friendly) */}
      <CaptionOverlay text={CAPTIONS.hook} from={40} to={100} position="top" accent="#ffe600" fontSize={44} />
      <CaptionOverlay text={CAPTIONS.twoSides} from={188} to={252} position="top" accent="#00f0ff" fontSize={40} />
      <CaptionOverlay text={CAPTIONS.oneEgo} from={470} to={540} position="top" accent="#ff007f" fontSize={40} />
      <CaptionOverlay text={CAPTIONS.courtSpoken} from={808} to={880} position="bottom" accent="#ffe600" fontSize={40} />
      <CaptionOverlay text={CAPTIONS.sendIt} from={1110} to={1136} position="bottom" accent="#ff007f" fontSize={29} edgeOffset={38} pop />

      <EndCard />

      <SoundTrack />
    </AbsoluteFill>
  );
}
