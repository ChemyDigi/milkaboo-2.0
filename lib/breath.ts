/**
 * Pure signal maths for breath detection. No Web Audio here, so it is easy to unit test.
 */

/** Root-mean-square loudness of a time-domain frame (samples in −1…1). */
export function rms(samples: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}

/**
 * Spectral flatness (geometric mean ÷ arithmetic mean of power) over [lowHz, highHz].
 * ~1 for white noise (air, breath), near 0 for tones (voice, whistling, music).
 * `spectrumDb` is AnalyserNode.getFloatFrequencyData output.
 */
export function spectralFlatness(
  spectrumDb: Float32Array,
  sampleRate: number,
  lowHz: number,
  highHz: number,
): number {
  const binHz = sampleRate / 2 / spectrumDb.length;
  const lo = Math.max(1, Math.floor(lowHz / binHz));
  const hi = Math.min(spectrumDb.length - 1, Math.ceil(highHz / binHz));
  let logSum = 0;
  let sum = 0;
  let n = 0;
  for (let i = lo; i <= hi; i++) {
    const db = spectrumDb[i];
    // −Infinity is digital silence; floor it so log() stays finite
    const power = Math.pow(10, (Number.isFinite(db) ? Math.max(db, -160) : -160) / 10);
    logSum += Math.log(power);
    sum += power;
    n++;
  }
  if (n === 0 || sum <= 0) return 0;
  return Math.exp(logSum / n) / (sum / n);
}

/** Threshold from a quiet-room recording: a high percentile of the noise, so one clatter doesn't count. */
export function thresholdFromNoise(
  noiseRms: number[],
  opts: { thresholdFactor: number; minThreshold: number; maxThreshold: number },
): number {
  if (noiseRms.length === 0) return opts.minThreshold;
  const sorted = [...noiseRms].sort((a, b) => a - b);
  const p90 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9))];
  return Math.min(opts.maxThreshold, Math.max(opts.minThreshold, p90 * opts.thresholdFactor));
}

/** Frame-rate independent exponential approach of `current` toward `target` (`rate` per second). */
export function damp(current: number, target: number, rate: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-rate * dt));
}
