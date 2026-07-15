"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "beef_bgm_muted";
const BG_SRC = "/sounds/bg.mp3";
const BG_VOLUME = 0.28;

type BgmContextValue = {
  muted: boolean;
  ready: boolean;
  toggle: () => void;
};

const BgmContext = createContext<BgmContextValue | null>(null);

/**
 * Site-wide arcade BGM engine. Keeps audio mounted across route changes.
 * Browsers block autoplay with sound, so we:
 * 1. Respect a remembered mute preference
 * 2. Start on the first user gesture if unmuted
 */
export function BackgroundMusicProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setMuted(stored === "1");
    } catch {
      setMuted(false);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    const audio = new Audio(BG_SRC);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = BG_VOLUME;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  const tryPlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || muted) return;
    try {
      await audio.play();
    } catch {
      // Autoplay blocked until a later gesture
    }
  }, [muted]);

  useEffect(() => {
    if (!ready) return;
    const audio = audioRef.current;
    if (!audio) return;

    if (muted) {
      audio.pause();
      return;
    }

    void tryPlay();

    const unlock = () => {
      void tryPlay();
    };

    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [muted, ready, tryPlay]);

  const toggle = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      if (!next) {
        queueMicrotask(() => {
          void audioRef.current?.play().catch(() => undefined);
        });
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ muted, ready, toggle }),
    [muted, ready, toggle]
  );

  return <BgmContext.Provider value={value}>{children}</BgmContext.Provider>;
}

function useBgm() {
  const ctx = useContext(BgmContext);
  if (!ctx) {
    throw new Error("useBgm must be used within BackgroundMusicProvider");
  }
  return ctx;
}

/** Mute toggle — fixed top-right; does not scroll with page content. */
export function BgmMuteButton({ className = "" }: { className?: string }) {
  const { muted, ready, toggle } = useBgm();

  if (!ready) {
    return (
      <span
        className={`inline-block h-11 w-11 shrink-0 ${className}`}
        aria-hidden
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={muted ? "Unmute background music" : "Mute background music"}
      aria-pressed={!muted}
      className={[
        "touch-target flex h-11 w-11 shrink-0 items-center justify-center border-4 border-black bg-arcade-yellow text-black shadow-[4px_4px_0_#000] transition-transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0_#000]",
        className,
      ].join(" ")}
    >
      {muted ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 9v6h3l5 4V5L7 9H4z" fill="currentColor" />
          <path
            d="M16.5 8.5l5 5m0-5l-5 5"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="square"
          />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 9v6h3l5 4V5L7 9H4z" fill="currentColor" />
          <path
            d="M15.5 8.5a4.5 4.5 0 010 7M18 6a8 8 0 010 12"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="square"
            fill="none"
          />
        </svg>
      )}
    </button>
  );
}
