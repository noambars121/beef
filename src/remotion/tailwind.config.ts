import type { Config } from "tailwindcss";
import baseConfig from "../../tailwind.config";

/**
 * Tailwind config used ONLY by the Remotion bundle (see remotion.config.ts).
 *
 * It inherits every design token from the production config, then pushes all
 * responsive breakpoints out of reach. The video renders at 1080x1920, but the
 * app UI lives inside a 393pt-wide iPhone screen — so every `sm:`/`md:` class
 * must resolve to its mobile branch, exactly like on a real phone.
 */
const config: Config = {
  ...baseConfig,
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    ...baseConfig.theme,
    screens: {
      sm: "9990px",
      md: "9991px",
      lg: "9992px",
      xl: "9993px",
      "2xl": "9994px",
    },
  },
};

export default config;
