"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

type BgPair = {
  mobile: string;
  desktop: string;
};

const HOME: BgPair = {
  mobile: "/cyber-judge-bg.png",
  desktop: "/cyber-judge-bg-desktop.png",
};

const BACKGROUNDS: Record<string, BgPair> = {
  "/": HOME,
  "/gallery": {
    mobile: "/bg-hall-mobile.jpg",
    desktop: "/bg-hall-desktop.jpg",
  },
  "/case/new": {
    mobile: "/bg-insert-mobile.jpg",
    desktop: "/bg-insert-desktop.jpg",
  },
};

function resolveBackground(pathname: string | null): BgPair {
  if (!pathname) return HOME;
  if (BACKGROUNDS[pathname]) return BACKGROUNDS[pathname];
  if (pathname.startsWith("/case/")) {
    return {
      mobile: "/bg-verdict-mobile.jpg",
      desktop: "/bg-verdict-desktop.jpg",
    };
  }
  return HOME;
}

const ALL_BG_URLS = [
  HOME.mobile,
  HOME.desktop,
  "/bg-hall-mobile.jpg",
  "/bg-hall-desktop.jpg",
  "/bg-insert-mobile.jpg",
  "/bg-insert-desktop.jpg",
  "/bg-verdict-mobile.jpg",
  "/bg-verdict-desktop.jpg",
];

const EASE = [0.22, 1, 0.36, 1] as const;
const DURATION = 0.5;

export function CourtroomBackground() {
  const pathname = usePathname();
  const { mobile, desktop } = resolveBackground(pathname);

  // Prefetch all page backgrounds so crossfades don't hitch
  useEffect(() => {
    ALL_BG_URLS.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#050508]">
      <div className="absolute inset-0 sm:hidden">
        <AnimatePresence initial={false}>
          <motion.div
            key={mobile}
            className="absolute inset-0 bg-cover bg-[center_top_12%] bg-no-repeat will-change-[opacity]"
            style={{ backgroundImage: `url('${mobile}')` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION, ease: EASE }}
            aria-hidden
          />
        </AnimatePresence>
      </div>

      <div className="absolute inset-0 hidden sm:block">
        <AnimatePresence initial={false}>
          <motion.div
            key={desktop}
            className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-[opacity]"
            style={{ backgroundImage: `url('${desktop}')` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION, ease: EASE }}
            aria-hidden
          />
        </AnimatePresence>
      </div>

      <div
        className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/55"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-arcade-pink/8 via-transparent to-arcade-blue/8"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,transparent_0%,rgba(0,0,0,0.2)_55%,rgba(0,0,0,0.55)_100%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 3px,
            rgba(255, 255, 255, 0.12) 3px,
            rgba(255, 255, 255, 0.12) 6px
          )`,
        }}
        aria-hidden
      />
    </div>
  );
}
