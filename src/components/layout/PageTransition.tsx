"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { usePathname } from "next/navigation";
import {
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { BgmMuteButton } from "@/components/layout/BackgroundMusic";
import { SiteFooter } from "@/components/layout/SiteFooter";

/**
 * Freeze the App Router context for the exiting page so AnimatePresence
 * can finish the exit animation before the old route unmounts.
 */
function FrozenRouter({ children }: { children: ReactNode }) {
  const context = useContext(LayoutRouterContext);
  const frozen = useRef(context).current;

  return (
    <LayoutRouterContext.Provider value={frozen}>
      {children}
    </LayoutRouterContext.Provider>
  );
}

const EASE = [0.22, 1, 0.36, 1] as const;
const DURATION = 0.42;

function PageChrome({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-full min-h-0 w-full overflow-x-hidden overflow-y-auto">
      {/* Fixed mute — stays put while page content scrolls */}
      <div className="pointer-events-none fixed right-[max(0.75rem,env(safe-area-inset-right))] top-[max(0.75rem,env(safe-area-inset-top))] z-[60]">
        <div className="pointer-events-auto">
          <BgmMuteButton />
        </div>
      </div>

      {/* Footer sits at the bottom of the document — only visible when scrolled down */}
      <div className="flex min-h-full flex-col">
        <div className="min-h-0 flex-1">{children}</div>
        <SiteFooter />
      </div>
    </div>
  );
}

/**
 * Crossfade route transitions that actually complete in App Router.
 * Pages stack absolutely so enter/exit overlap — no blank "wait" gap.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (reducedMotion) {
    return (
      <div className="h-full min-h-0 w-full">
        <PageChrome>{children}</PageChrome>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.div
          key={pathname}
          className="absolute inset-0 h-full min-h-0 w-full will-change-[opacity,transform]"
          initial={{ opacity: 0, y: 10, pointerEvents: "none" }}
          animate={{ opacity: 1, y: 0, pointerEvents: "auto" }}
          exit={{ opacity: 0, y: -8, pointerEvents: "none" }}
          transition={{ duration: DURATION, ease: EASE }}
        >
          <FrozenRouter>
            <PageChrome>{children}</PageChrome>
          </FrozenRouter>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
