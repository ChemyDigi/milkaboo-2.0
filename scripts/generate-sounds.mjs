// Synthesises placeholder sounds into public/sounds/*.wav. Replace them with real sound design any time
// (keep the file names). Run: node scripts/generate-sounds.mjs
//
// Note on "slurp": the mic runs without echo cancellation, so an in-game whoosh made of noise would be heard
// by the mic and could keep the detector triggered by itself. The slurp is deliberately tonal (bubbly blips),
// which the spectral-flatness check ignores. Keep any replacement tonal too.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const RATE = 22050;
const OUT = join(process.cwd(), "public", "sounds");
mkdirSync(OUT, { recursive: true });

let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
const TAU = Math.PI * 2;

function writeWav(name, samples) {
  const data = Buffer.alloc(samples.length * 2);
  let peak = 0;
  for (const s of samples) peak = Math.max(peak, Math.abs(s));
  const gain = peak > 0 ? 0.9 / peak : 1;
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s * gain)) * 32767), i * 2));
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  writeFileSync(join(OUT, `${name}.wav`), Buffer.concat([header, data]));
  console.log(`wrote ${name}.wav (${(samples.length / RATE).toFixed(1)}s)`);
}

const render = (seconds, fn) => Float32Array.from({ length: Math.round(seconds * RATE) }, (_, i) => fn(i / RATE, i));
const env = (t, attack, release, length) => Math.min(1, t / attack) * Math.min(1, Math.max(0, (length - t) / release));

// ambient: a 10 s seamless drone (every frequency fits a whole number of cycles into 10 s) plus soft wind
{
  const len = 10;
  let lp = 0;
  const wind = render(len, () => (lp += (rand() - lp) * 0.02));
  const out = render(len, (t, i) => {
    const swell = 0.6 + 0.4 * Math.sin((TAU * t) / 5);
    const drone = Math.sin(TAU * 55 * t) * 0.5 + Math.sin(TAU * 82.4 * t) * 0.25 * swell + Math.sin(TAU * 110.3 * t) * 0.12;
    const bell = Math.sin(TAU * 659.3 * t) * Math.exp(-((t % 5) * 1.2)) * 0.06;
    return drone * 0.5 + wind[i] * 1.2 * (0.5 + 0.5 * Math.sin((TAU * t) / 10)) + bell;
  });
  // crossfade the wind's ends so the loop point is invisible
  const fade = Math.round(0.5 * RATE);
  for (let i = 0; i < fade; i++) {
    const k = i / fade;
    out[i] = out[i] * k + out[out.length - fade + i] * (1 - k);
  }
  writeWav("ambient", out.slice(0, out.length - fade));
}

// wail: a ghostly "oooOOOooo" glide with vibrato
{
  const len = 1.4;
  let phase = 0;
  writeWav(
    "wail",
    render(len, (t) => {
      const glide = 300 + 260 * Math.sin((Math.PI * t) / len) + 12 * Math.sin(TAU * 6 * t);
      phase += (TAU * glide) / RATE;
      return (Math.sin(phase) + 0.3 * Math.sin(phase * 2) + 0.12 * Math.sin(phase * 3)) * env(t, 0.15, 0.4, len);
    }),
  );
}

// slurp: tonal boba-bubble blips, loops for as long as the player sucks
{
  const len = 1.2;
  const blips = [0.0, 0.17, 0.31, 0.5, 0.62, 0.8, 0.95, 1.06];
  writeWav(
    "slurp",
    render(len, (t) => {
      let s = 0;
      blips.forEach((at, k) => {
        const dt = t - at;
        if (dt < 0 || dt > 0.12) return;
        const f = 260 + (k % 3) * 70 + dt * 1800;
        s += Math.sin(TAU * f * dt) * Math.exp(-dt * 30);
      });
      return s;
    }),
  );
}

// shloop: the ghost sucked off the cup, a fast falling sweep
{
  const len = 0.7;
  let phase = 0;
  writeWav(
    "shloop",
    render(len, (t) => {
      const f = 1200 * Math.pow(120 / 1200, t / len);
      phase += (TAU * f) / RATE;
      return (Math.sin(phase) + 0.15 * rand()) * env(t, 0.02, 0.25, len);
    }),
  );
}

// win: bright major arpeggio with a sparkle
{
  const len = 2.2;
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
  writeWav(
    "win",
    render(len, (t) => {
      let s = 0;
      notes.forEach((f, k) => {
        const dt = t - k * 0.12;
        if (dt < 0) return;
        s += (Math.sin(TAU * f * dt) + 0.3 * Math.sin(TAU * f * 2 * dt)) * Math.exp(-dt * 2.2) * 0.4;
      });
      return s;
    }),
  );
}

// laugh: "ha-ha-ha-haaa" from a buzzy voice falling in pitch
{
  const len = 1.8;
  let phase = 0;
  writeWav(
    "laugh",
    render(len, (t) => {
      const k = Math.floor(t / 0.28);
      const local = t - k * 0.28;
      const on = k < 6 ? Math.max(0, Math.sin((Math.PI * local) / 0.22)) * (local < 0.22 ? 1 : 0) : 0;
      const f = 210 - k * 14 + 30 * Math.exp(-local * 10);
      phase += (TAU * f) / RATE;
      const buzz = (phase % TAU) / Math.PI - 1; // sawtooth
      return (buzz * 0.6 + Math.sin(phase * 3) * 0.3) * on * env(t, 0.01, 0.2, len);
    }),
  );
}
