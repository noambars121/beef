// Remotion configuration for the BEEF demo video renders.
// Kept at the repo root so `npx remotion ...` picks it up automatically.
import path from "node:path";
import { Config } from "@remotion/cli/config";
import { enableTailwind } from "@remotion/tailwind";

Config.setEntryPoint("src/remotion/index.ts");

Config.overrideWebpackConfig((currentConfiguration) => {
  const withTailwind = enableTailwind(currentConfiguration, {
    // Video-only Tailwind config: same design tokens as the app, but with
    // breakpoints pushed out of reach so the phone screen always renders
    // the real mobile layout regardless of the 1080x1920 render viewport.
    configLocation: path.join(process.cwd(), "src", "remotion", "tailwind.config.ts"),
  });

  return {
    ...withTailwind,
    resolve: {
      ...withTailwind.resolve,
      alias: {
        ...(withTailwind.resolve?.alias ?? {}),
        // Mirror the app's `@/*` path alias so real components can be reused.
        "@": path.join(process.cwd(), "src"),
      },
    },
  };
});

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
