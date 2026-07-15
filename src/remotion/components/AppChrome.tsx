/**
 * The floating BGM mute toggle that PageTransition renders on every real BEEF
 * page (see BgmMuteButton in src/components/layout/BackgroundMusic.tsx).
 * Recreated statically in its unmuted state — the original needs React
 * context + localStorage. Positioned where iOS safe-area would put it.
 */
export function AppChrome() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: 62,
        right: 12,
        zIndex: 30,
      }}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center border-4 border-black bg-arcade-yellow text-black shadow-[4px_4px_0_#000]">
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
      </div>
    </div>
  );
}
