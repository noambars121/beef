// The video reuses the app's real design system: globals.css is imported
// as-is (Tailwind directives are processed by src/remotion/tailwind.config.ts)
// and remotion-overrides.css only neutralizes desktop-viewport media queries.
import "../app/globals.css";
import "./remotion-overrides.css";
import { Composition } from "remotion";
import { BeefViralIphoneDemo } from "./compositions/BeefViralIphoneDemo";
import { DURATION_IN_FRAMES, FPS, HEIGHT, WIDTH } from "./lib/timeline";

export function RemotionRoot() {
  return (
    <Composition
      id="BeefViralIphoneDemo"
      component={BeefViralIphoneDemo}
      durationInFrames={DURATION_IN_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
}
