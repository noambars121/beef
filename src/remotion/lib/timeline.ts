// Master timeline for BeefViralIphoneDemo — 30fps, 1260 frames = 42.0s.
// All values are absolute composition frames; the whole edit is deterministic.

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const DURATION_IN_FRAMES = 1260; // 42.0s (target 38-42s, max 45s)

// ---- Scene boundaries ----
export const SCENES = {
  hook: { from: 0, to: 105 }, // 0.0 - 3.5s
  startCase: { from: 105, to: 270 }, // 3.5 - 9.0s
  sides: { from: 270, to: 495 }, // 9.0 - 16.5s
  judge: { from: 495, to: 675 }, // 16.5 - 22.5s
  verdict: { from: 675, to: 960 }, // 22.5 - 32.0s
  share: { from: 960, to: 1155 }, // 32.0 - 38.5s
  end: { from: 1155, to: 1260 }, // 38.5 - 42.0s
} as const;

// ---- Phone screen content timeline ----
// Screens crossfade with the app's real PageTransition feel (0.42s ≈ 13 frames).
export const ROUTE_TRANSITION_FRAMES = 13;

export const SCREEN = {
  // Home
  homeFrom: 0,
  homeTapCta: 118, // tap CALL THE JUDGE
  homeTo: 138,

  // Wizard — dispute step
  wizardFrom: 138,
  titleTypeStart: 158,
  titleTypeEnd: 228, // 29 chars, fast cinematic typing
  categoryTap: 244,
  disputeContinueTap: 280,
  disputeStepEnd: 292,

  // Wizard — side A
  sideAFrom: 292,
  sideANameStart: 302,
  sideANameEnd: 326,
  sideAArgStart: 332,
  sideAArgEnd: 390,
  sideAContinueTap: 402,
  sideAEnd: 414,

  // Wizard — side B
  sideBFrom: 414,
  sideBNameStart: 424,
  sideBNameEnd: 446,
  sideBArgStart: 452,
  sideBArgEnd: 506,
  sideBContinueTap: 516,
  sideBEnd: 528,

  // Wizard — review
  reviewFrom: 528,
  reviewToneFlash: 556,
  submitTap: 608,
  wizardTo: 630,

  // Case page — deliberation
  deliberationFrom: 630,
  deliberationTo: 720,

  // KO reveal overlay
  koFlash: 720,
  koBadge: 722,
  koWinnerText: 738,
  koEnd: 792,

  // Verdict revealed
  verdictFrom: 748,
  verdictCardsIn: 792,
  scrollStart: 962,
  scrollEnd: 998,
  tapLaugh: 1022,
  tapShock: 1052,
  tapShare: 1094,
  shareSheetHint: 1100,

  // End: back to home screen inside phone
  endHomeFrom: 1168,
} as const;

// ---- Audio cue frames ----
export const AUDIO = {
  crtPowerOn: 0,
  coinInsert: 6,
  arcadeStart: 26,
  tapHome: SCREEN.homeTapCta,
  whooshWizard: SCREEN.homeTo - 6,
  typeTitle: SCREEN.titleTypeStart,
  tapCategory: SCREEN.categoryTap,
  tapContinueA: SCREEN.disputeContinueTap,
  typeNameA: SCREEN.sideANameStart,
  typeArgA: SCREEN.sideAArgStart,
  tapContinueA2: SCREEN.sideAContinueTap,
  whooshSideB: SCREEN.sideBFrom - 4,
  typeNameB: SCREEN.sideBNameStart,
  typeArgB: SCREEN.sideBArgStart,
  tapContinueB: SCREEN.sideBContinueTap,
  whooshReview: SCREEN.reviewFrom - 4,
  tapSubmit: SCREEN.submitTap,
  slamSubmit: SCREEN.submitTap + 4,
  riser: SCREEN.deliberationFrom + 2,
  impact: SCREEN.koFlash,
  slamVerdict: SCREEN.koFlash + 2,
  crowd: SCREEN.koFlash + 6,
  confirmVerdict: SCREEN.koWinnerText,
  popLaugh: SCREEN.tapLaugh + 2,
  popShock: SCREEN.tapShock + 2,
  tapShareBtn: SCREEN.tapShare,
  popSocial: SCREEN.shareSheetHint + 4,
  whooshEnd: SCENES.end.from,
  chimeEnd: SCENES.end.from + 18,
} as const;
