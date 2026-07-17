// Master timeline for BeefViralIphoneDemo — 30fps, 1180 frames = 39.3s.
// All values are absolute composition frames; the whole edit is deterministic.

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const DURATION_IN_FRAMES = 1180; // 39.3s (max 45s)

// ---- Scene boundaries (for reference) ----
export const SCENES = {
  hook: { from: 0, to: 92 },
  startCase: { from: 92, to: 206 },
  sides: { from: 206, to: 366 },
  review: { from: 366, to: 466 }, // incl. JURY MODE toggle + consent
  juryBox: { from: 466, to: 556 }, // owner: COURT IN RECESS + countdown
  trap: { from: 556, to: 660 }, // the friend's pick-a-side gate
  juryCountdown: { from: 660, to: 768 }, // bet placed → clock hits zero
  verdict: { from: 768, to: 1002 },
  share: { from: 1002, to: 1030 },
  hall: { from: 1030, to: 1128 }, // HALL OF SHAME leaderboard
  end: { from: 1128, to: 1180 },
} as const;

// ---- Phone screen content timeline ----
// Screens crossfade with a smooth PageTransition feel (~0.47s).
export const ROUTE_TRANSITION_FRAMES = 14;

export const SCREEN = {
  // Home
  homeFrom: 0,
  homeTapCta: 92,
  homeTo: 108,

  // Wizard — dispute step
  wizardFrom: 108,
  titleTypeStart: 122,
  titleTypeEnd: 168, // 30 chars, rapid-fire typing
  categoryTap: 178,
  disputeContinueTap: 196,
  disputeStepEnd: 206,

  // Wizard — side A
  sideAFrom: 206,
  sideANameStart: 214,
  sideANameEnd: 230,
  sideAArgStart: 236,
  sideAArgEnd: 272,
  sideAContinueTap: 278,
  sideAEnd: 286,

  // Wizard — side B
  sideBFrom: 286,
  sideBNameStart: 294,
  sideBNameEnd: 308,
  sideBArgStart: 314,
  sideBArgEnd: 350,
  sideBContinueTap: 356,
  sideBEnd: 366,

  // Wizard — review (scrolls down to JURY MODE + FINAL CLEARANCE)
  reviewFrom: 366,
  reviewScrollStart: 378,
  reviewScrollEnd: 396,
  juryToggleTap: 404,
  consentTap1: 420,
  consentTap2: 432,
  submitTap: 448,
  wizardTo: 466,

  // JURY BOX — owner view: COURT IN RECESS, countdown, judge status ticking
  juryOwnerFrom: 466,
  juryOwnerTo: 556,

  // THE TRAP — the friend's phone: pick a side to unseal
  trapFrom: 556,
  trapTapSide: 632,
  trapTo: 660,

  // JURY BOX — voter view: bet placed, clock spins down to zero
  juryVoterFrom: 660,
  jurySpinStart: 712,
  jurySpinEnd: 744, // hits 00:00
  juryUnsealFrom: 744, // THE JUDGE ENTERS THE COURT
  juryVoterTo: 772,

  // KO reveal overlay
  koFlash: 768,
  koWinnerText: 782,
  koEnd: 826,
  verdictFrom: 768, // mounts under the white flash
  verdictCardsIn: 806,

  // Verdict page scroll + reactions + share
  scrollStart: 928,
  scrollEnd: 956,
  tapLaugh: 968,
  tapShock: 984,
  tapShare: 1002,
  shareHint: 1006,

  // HALL OF SHAME — the case is crowned #1
  hallFrom: 1030,
  hallScrollStart: 1046,
  hallScrollEnd: 1072,
  hallTo: 1128,

  // End: back to home screen inside phone
  endHomeFrom: 1128,
} as const;

// ---- Audio cue frames ----
export const AUDIO = {
  crtPowerOn: 0,
  coinInsert: 6,
  arcadeStart: 24,
  tapHome: SCREEN.homeTapCta,
  whooshWizard: SCREEN.homeTo - 5,
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
  tapJury: SCREEN.juryToggleTap,
  popJuryOn: SCREEN.juryToggleTap + 2,
  tapConsent1: SCREEN.consentTap1,
  tapConsent2: SCREEN.consentTap2,
  tapSubmit: SCREEN.submitTap,
  slamSubmit: SCREEN.submitTap + 4,
  whooshJuryBox: SCREEN.juryOwnerFrom - 5,
  riser: SCREEN.juryOwnerFrom + 4,
  whooshTrap: SCREEN.trapFrom - 4,
  confirmTrap: SCREEN.trapFrom + 6,
  tapTrapSide: SCREEN.trapTapSide,
  slamTrapSide: SCREEN.trapTapSide + 2,
  spinRiser: SCREEN.jurySpinStart - 2,
  spinTicks: SCREEN.jurySpinStart,
  slamUnseal: SCREEN.juryUnsealFrom + 2,
  coinUnseal: SCREEN.juryUnsealFrom + 8,
  impact: SCREEN.koFlash,
  slamVerdict: SCREEN.koFlash + 2,
  crowd: SCREEN.koFlash + 6,
  confirmVerdict: SCREEN.koWinnerText,
  popLaugh: SCREEN.tapLaugh + 2,
  popShock: SCREEN.tapShock + 2,
  tapShareBtn: SCREEN.tapShare,
  popSocial: SCREEN.shareHint + 4,
  whooshHall: SCREEN.hallFrom - 5,
  crowdHall: SCREEN.hallFrom + 6,
  confirmHall: SCREEN.hallScrollEnd + 2,
  whooshEnd: SCENES.end.from - 4,
  chimeEnd: SCENES.end.from + 10,
} as const;
