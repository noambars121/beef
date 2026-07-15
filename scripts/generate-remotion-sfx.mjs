// Deterministic, royalty-free SFX generator for the BEEF Remotion demo video.
// Synthesizes every sound from scratch (square/sine/noise primitives) so the
// render never depends on third-party audio. Run once:
//
//   node scripts/generate-remotion-sfx.mjs
//
// Output: public/remotion-sfx/*.wav  (44.1kHz, 16-bit, mono)

import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SR = 44100;
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "remotion-sfx");

/** Deterministic PRNG (mulberry32) so re-runs produce identical files. */
function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seconds(s) {
  return Math.round(s * SR);
}

function writeWav(name, samples) {
  const clamped = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    clamped[i] = Math.round(v * 32767);
  }
  const dataSize = clamped.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SR, 24);
  buffer.writeUInt32LE(SR * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  Buffer.from(clamped.buffer).copy(buffer, 44);
  writeFileSync(join(OUT_DIR, name), buffer);
  console.log(`wrote ${name} (${(clamped.length / SR).toFixed(2)}s)`);
}

const square = (phase) => (Math.sin(phase) >= 0 ? 1 : -1);
const tri = (phase) => (2 / Math.PI) * Math.asin(Math.sin(phase));

/** Simple one-pole low-pass. */
function lowPass(samples, cutoffHz) {
  const rc = 1 / (2 * Math.PI * cutoffHz);
  const dt = 1 / SR;
  const alpha = dt / (rc + dt);
  let prev = 0;
  const out = new Float64Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    prev = prev + alpha * (samples[i] - prev);
    out[i] = prev;
  }
  return out;
}

function highPass(samples, cutoffHz) {
  const lp = lowPass(samples, cutoffHz);
  const out = new Float64Array(samples.length);
  for (let i = 0; i < samples.length; i++) out[i] = samples[i] - lp[i];
  return out;
}

/** Classic two-tone arcade coin insert (original synthesis). */
function coinInsert() {
  const len = seconds(0.62);
  const out = new Float64Array(len);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const freq = t < 0.075 ? 987.77 : 1318.51; // B5 -> E6
    phase += (2 * Math.PI * freq) / SR;
    const env =
      t < 0.075
        ? Math.min(1, t / 0.004)
        : Math.exp(-(t - 0.075) * 7.5);
    out[i] = square(phase) * env * 0.34 + tri(phase * 2) * env * 0.08;
  }
  return lowPass(out, 7500);
}

/** Short arcade confirm arpeggio. */
function arcadeConfirm() {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  const noteLen = 0.075;
  const tail = 0.35;
  const len = seconds(notes.length * noteLen + tail);
  const out = new Float64Array(len);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const idx = Math.min(notes.length - 1, Math.floor(t / noteLen));
    phase += (2 * Math.PI * notes[idx]) / SR;
    const local = t - idx * noteLen;
    const isLast = idx === notes.length - 1;
    const env = isLast ? Math.exp(-local * 6) : Math.exp(-local * 10);
    out[i] = square(phase) * env * 0.26;
  }
  return lowPass(out, 6800);
}

/** CRT power-on: low thump + bright sweep. */
function crtPowerOn() {
  const rng = makeRng(101);
  const len = seconds(0.7);
  const out = new Float64Array(len);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const thump = Math.sin(2 * Math.PI * 46 * t) * Math.exp(-t * 16) * 0.75;
    const sweepFreq = 200 + 5200 * Math.min(1, t / 0.42);
    phase += (2 * Math.PI * sweepFreq) / SR;
    const sweep = Math.sin(phase) * Math.exp(-t * 5.2) * 0.1;
    const fizz = (rng() * 2 - 1) * Math.exp(-t * 9) * 0.12;
    out[i] = thump + sweep + fizz;
  }
  return out;
}

/** Soft UI tap: quick pitch-dropping sine knock. */
function tap() {
  const len = seconds(0.11);
  const out = new Float64Array(len);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const freq = 1150 - 850 * Math.min(1, t / 0.05);
    phase += (2 * Math.PI * freq) / SR;
    const env = Math.exp(-t * 60);
    out[i] = Math.sin(phase) * env * 0.5;
  }
  return out;
}

/** Mechanical-ish key ticks for fast typing (2.4s, even spacing). */
function typeLoop() {
  const rng = makeRng(7);
  const len = seconds(2.4);
  const out = new Float64Array(len);
  const interval = 1 / 16.5; // ticks per second
  for (let start = 0.01; start < 2.36; start += interval) {
    const startIdx = seconds(start);
    const clickPitch = 2100 + rng() * 900;
    const gain = 0.16 + rng() * 0.1;
    for (let j = 0; j < seconds(0.028); j++) {
      const t = j / SR;
      const idx = startIdx + j;
      if (idx >= len) break;
      const body = Math.sin(2 * Math.PI * clickPitch * t) * 0.5 + (rng() * 2 - 1) * 0.5;
      out[idx] += body * Math.exp(-t * 320) * gain;
    }
  }
  return highPass(out, 900);
}

/** Transition whoosh: band-passed noise swell. */
function whoosh() {
  const rng = makeRng(23);
  const len = seconds(0.55);
  const raw = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = Math.sin(Math.PI * Math.min(1, t / 0.55)) ** 2;
    raw[i] = (rng() * 2 - 1) * env * 0.5;
  }
  return lowPass(highPass(raw, 350), 2600);
}

/** Tension riser (~4.5s): climbing tone + accelerating pulse. */
function riser() {
  const rng = makeRng(41);
  const len = seconds(4.5);
  const out = new Float64Array(len);
  let phase = 0;
  let phase2 = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const p = t / 4.5;
    const freq = 82 * Math.pow(2, p * 2.2);
    phase += (2 * Math.PI * freq) / SR;
    phase2 += (2 * Math.PI * (freq * 1.505)) / SR;
    const trem = 0.6 + 0.4 * Math.sin(2 * Math.PI * (2 + p * 14) * t);
    const body = (tri(phase) * 0.6 + tri(phase2) * 0.35) * trem;
    const air = (rng() * 2 - 1) * p * 0.16;
    out[i] = (body * 0.32 + air) * (0.25 + 0.75 * p);
  }
  return lowPass(out, 5200);
}

/** KO impact: sub drop + noise burst + gated echo. */
function impact() {
  const rng = makeRng(77);
  const len = seconds(1.25);
  const out = new Float64Array(len);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const freq = 150 * Math.exp(-t * 6) + 38;
    phase += (2 * Math.PI * freq) / SR;
    const sub = Math.sin(phase) * Math.exp(-t * 3.4) * 0.85;
    const burst = (rng() * 2 - 1) * Math.exp(-t * 26) * 0.6;
    const echo = t > 0.18 ? (rng() * 2 - 1) * Math.exp(-(t - 0.18) * 20) * 0.14 : 0;
    out[i] = sub + burst + echo;
  }
  return lowPass(out, 6000);
}

/** Gavel slam: sharp crack + wooden thud. */
function slam() {
  const rng = makeRng(55);
  const len = seconds(0.65);
  const out = new Float64Array(len);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const crack = (rng() * 2 - 1) * Math.exp(-t * 70) * 0.8;
    const freq = 210 * Math.exp(-t * 9) + 70;
    phase += (2 * Math.PI * freq) / SR;
    const thud = Math.sin(phase) * Math.exp(-t * 12) * 0.7;
    out[i] = crack + thud;
  }
  return lowPass(out, 5000);
}

/** Distant synth crowd swell (amplitude-modulated filtered noise). */
function crowd() {
  const rng = makeRng(93);
  const len = seconds(1.9);
  const raw = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const swell = Math.sin(Math.PI * Math.min(1, t / 1.9)) ** 1.5;
    const chatter =
      0.55 +
      0.2 * Math.sin(2 * Math.PI * 7.3 * t) +
      0.15 * Math.sin(2 * Math.PI * 11.9 * t + 1.3) +
      0.1 * Math.sin(2 * Math.PI * 3.1 * t + 0.5);
    raw[i] = (rng() * 2 - 1) * swell * chatter * 0.4;
  }
  return lowPass(highPass(raw, 320), 1900);
}

/** Reaction pop: bubbly up-blip. */
function pop() {
  const len = seconds(0.14);
  const out = new Float64Array(len);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const freq = 520 + 620 * Math.min(1, t / 0.08);
    phase += (2 * Math.PI * freq) / SR;
    const env = Math.sin(Math.PI * Math.min(1, t / 0.14));
    out[i] = Math.sin(phase) * env * 0.42;
  }
  return out;
}

/** Final confirmation chime: coin + soft major bell. */
function chimeEnd() {
  const len = seconds(1.5);
  const out = new Float64Array(len);
  const bells = [
    { f: 659.25, g: 0.22, d: 2.6 }, // E5
    { f: 987.77, g: 0.16, d: 3.0 }, // B5
    { f: 1318.51, g: 0.12, d: 3.4 }, // E6
  ];
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    let v = 0;
    for (const b of bells) {
      v += Math.sin(2 * Math.PI * b.f * t) * Math.exp(-t * b.d) * b.g;
      v += Math.sin(2 * Math.PI * b.f * 2.01 * t) * Math.exp(-t * (b.d + 2)) * b.g * 0.2;
    }
    out[i] = v;
  }
  const coin = coinInsert();
  for (let i = 0; i < Math.min(coin.length, out.length); i++) {
    out[i] = out[i] * 0.9 + coin[i] * 0.5;
  }
  return out;
}

mkdirSync(OUT_DIR, { recursive: true });
writeWav("coin-insert.wav", coinInsert());
writeWav("arcade-confirm.wav", arcadeConfirm());
writeWav("crt-power-on.wav", crtPowerOn());
writeWav("tap.wav", tap());
writeWav("type-loop.wav", typeLoop());
writeWav("whoosh.wav", whoosh());
writeWav("riser.wav", riser());
writeWav("impact.wav", impact());
writeWav("slam.wav", slam());
writeWav("crowd.wav", crowd());
writeWav("pop.wav", pop());
writeWav("chime-end.wav", chimeEnd());
console.log("All SFX generated into public/remotion-sfx/");
