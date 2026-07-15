import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        court: {
          gold: "var(--court-gold)",
          "gold-dim": "var(--court-gold-dim)",
          crimson: "var(--court-crimson)",
          "crimson-glow": "var(--court-crimson-glow)",
          slate: "var(--court-slate)",
          panel: "var(--court-panel)",
          border: "var(--court-border)",
          muted: "var(--court-muted)",
          accent: "var(--court-accent)",
          purple: "var(--court-purple)",
          "purple-glow": "var(--court-purple-glow)",
        },
        arcade: {
          blue: "var(--arcade-blue)",
          pink: "var(--arcade-pink)",
          yellow: "var(--arcade-yellow)",
          green: "var(--arcade-green)",
          dark: "var(--arcade-dark)",
          panel: "var(--arcade-panel)",
          border: "var(--arcade-border)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        arcade: ["var(--font-arcade)", "monospace"],
      },
      spacing: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-left": "env(safe-area-inset-left)",
        "safe-right": "env(safe-area-inset-right)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
