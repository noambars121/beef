import { interpolate, useCurrentFrame } from "remotion";

interface TypeTextProps {
  text: string;
  /** Absolute composition frame when typing starts. */
  startFrame: number;
  /** Absolute composition frame when the last character lands. */
  endFrame: number;
  /** Show a blinking block caret while typing / shortly after. */
  caret?: boolean;
  caretColor?: string;
}

/**
 * Deterministic, frame-driven typing. Fast and cinematic — the char count is
 * interpolated with a slight ease so bursts feel human, never wall-clock based.
 */
export function TypeText({
  text,
  startFrame,
  endFrame,
  caret = true,
  caretColor = "#ffe600",
}: TypeTextProps) {
  const frame = useCurrentFrame();

  const chars = Math.round(
    interpolate(frame, [startFrame, endFrame], [0, text.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  const isTyping = frame >= startFrame - 8 && frame <= endFrame + 24;
  const caretOn = Math.floor(frame / 8) % 2 === 0;

  return (
    <span className="whitespace-pre-wrap">
      {text.slice(0, chars)}
      {caret && isTyping && (
        <span
          aria-hidden
          style={{
            display: "inline-block",
            width: "0.55em",
            height: "1.05em",
            verticalAlign: "text-bottom",
            marginLeft: 1,
            backgroundColor: caretOn ? caretColor : "transparent",
          }}
        />
      )}
    </span>
  );
}

/** Returns the currently-typed slice as a plain string (for value display). */
export function typedSlice(
  frame: number,
  text: string,
  startFrame: number,
  endFrame: number
): string {
  const chars = Math.round(
    interpolate(frame, [startFrame, endFrame], [0, text.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  return text.slice(0, chars);
}
