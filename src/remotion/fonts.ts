import type { CSSProperties } from "react";
import { loadFont as loadPressStart2P } from "@remotion/google-fonts/PressStart2P";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadDMSans } from "@remotion/google-fonts/DMSans";
import { loadFont as loadCinzel } from "@remotion/google-fonts/Cinzel";

// Same four families the app loads through next/font in src/app/layout.tsx.
// @remotion/google-fonts blocks rendering until every font is ready.
const pressStart2P = loadPressStart2P("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

const jetBrainsMono = loadJetBrainsMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

const dmSans = loadDMSans("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const cinzel = loadCinzel("normal", {
  weights: ["400", "600", "700"],
  subsets: ["latin"],
});

export const ARCADE_FONT = pressStart2P.fontFamily;
export const MONO_FONT = jetBrainsMono.fontFamily;
export const BODY_FONT = dmSans.fontFamily;
export const DISPLAY_FONT = cinzel.fontFamily;

/**
 * The app's CSS references fonts through `--font-*` variables that next/font
 * normally defines. Spreading these on the composition root recreates the
 * exact same variables for globals.css / Tailwind (`font-arcade`, `font-mono`,
 * `font-display`, `font-body`).
 */
export const FONT_VARIABLES = {
  "--font-arcade": ARCADE_FONT,
  "--font-mono": MONO_FONT,
  "--font-body": BODY_FONT,
  "--font-display": DISPLAY_FONT,
} as unknown as CSSProperties;
