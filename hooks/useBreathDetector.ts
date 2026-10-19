"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { gameConfig } from "@/lib/gameConfig";
import { damp, rms as frameRms, spectralFlatness, thresholdFromNoise } from "@/lib/breath";

const cfg = gameConfig.mic;

export type MicStatus =
  | "idle"
  | "requesting"
  | "ready"
  | "denied"
  | "insecure"
  | "unsupported"
  | "no-device"
  | "error";

export interface BreathReading {
  /** smoothed loudness, 0–1 */
  rms: number;
  /** spectral flatness 200 Hz–6 kHz, 0–1 (breath is high, voice is low) */
  flatness: number;
  /** current suction threshold from calibration */
  threshold: number;
  /** debounced: breath-like (flat) AND louder than the threshold */
  isSucking: boolean;
  /** true while Space is held in ?debug mode */
  simulated: boolean;
}

export interface BreathDetector extends BreathReading {
  status: MicStatus;
  /** Live values, updated every animation frame. Read this from game loops; the state fields above update ~12×/s for UI. */
  readingRef: RefObject<BreathReading>;
  /** Must be called from a tap/click handler (iOS needs the AudioContext created inside a user gesture). */
  start: () => Promise<boolean>;
  stop: () => void;
  /** Listen to the quiet room for `mic.calibrationMs` and set the threshold. Resolves with the new threshold. */
  calibrate: () => Promise<number>;
  /** ?debug: simulate strong suction (wired to the Space key by the game) */
  setSimulated: (on: boolean) => void;
  /** ?debug on a computer without a mic: run the detector on Space-key input only */
  startSimulated: () => void;
}

const UI_INTERVAL_MS = 80;

/**
 * Microphone breath detector.
 * Counts as "sucking" only when the sound is loud enough AND noise-like (flat spectrum), so shouting,
 * singing or whistling into the phone doesn't work. A mic can't tell sucking from blowing, so both count.
 */
export function useBreathDetector(): BreathDetector {
  const [status, setStatus] = useState<MicStatus>("idle");
  const [ui, setUi] = useState<BreathReading>({
    rms: 0,
    flatness: 0,
    threshold: cfg.minThreshold,
    isSucking: false,
    simulated: false,
  });

  const readingRef = useRef<BreathReading>({ ...ui });
  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef(0);
  const simulatedRef = useRef(false);
  const calibrationRef = useRef<{ samples: number[]; until: number; resolve: (t: number) => void } | null>(null);

  const loop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    // analyser is null in ?debug's mic-less mode: everything reads as silence unless Space is held
    const analyser = analyserRef.current;
    const sampleRate = ctxRef.current?.sampleRate ?? 48000;
    const time = new Float32Array(cfg.fftSize);
    const freq = new Float32Array(cfg.fftSize / 2);
    let last = performance.now();
    let lastUi = 0;
    let rawSince = -1;
    let rawLastTrue = -Infinity;
    let held = false;
    let smoothRms = 0;

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);
      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;

      let r = 0;
      let flat = 0;
      if (analyser) {
        analyser.getFloatTimeDomainData(time);
        analyser.getFloatFrequencyData(freq);
        r = frameRms(time);
        flat = spectralFlatness(freq, sampleRate, cfg.bandLowHz, cfg.bandHighHz);
      }

      const cal = calibrationRef.current;
      if (cal) {
        cal.samples.push(r);
        if (now >= cal.until) {
          calibrationRef.current = null;
          const threshold = thresholdFromNoise(cal.samples, cfg);
          readingRef.current.threshold = threshold;
          cal.resolve(threshold);
        }
      }

      smoothRms = damp(smoothRms, r, r > smoothRms ? cfg.rmsAttack : cfg.rmsRelease, dt);
      const reading = readingRef.current;
      const simulated = simulatedRef.current;

      reading.rms = simulated ? reading.threshold * 2.2 : smoothRms;
      reading.flatness = simulated ? 0.6 : flat;
      reading.simulated = simulated;

      // debounce: on after `attackMs` of raw signal, off after `releaseMs` without it
      const raw = !cal && reading.flatness >= cfg.minFlatness && reading.rms >= reading.threshold;
      if (raw) {
        if (rawSince < 0) rawSince = now;
        rawLastTrue = now;
        if (now - rawSince >= cfg.attackMs) held = true;
      } else {
        rawSince = -1;
        if (now - rawLastTrue >= cfg.releaseMs) held = false;
      }
      reading.isSucking = held;

      if (now - lastUi >= UI_INTERVAL_MS) {
        lastUi = now;
        setUi({ ...reading });
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    analyserRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    readingRef.current.isSucking = false;
    readingRef.current.rms = 0;
    setStatus((s) => (s === "ready" ? "idle" : s));
  }, []);

  const start = useCallback(async () => {
    if (analyserRef.current) return true;

    // create/resume the context synchronously, inside the tap, before any await (iOS Safari)
    let ctx = ctxRef.current;
    try {
      if (!ctx) {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) {
          setStatus("unsupported");
          return false;
        }
        ctx = new Ctor();
        ctxRef.current = ctx;
      }
      void ctx.resume();
    } catch {
      setStatus("unsupported");
      return false;
    }

    if (!window.isSecureContext) {
      setStatus("insecure");
      return false;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      return false;
    }

    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      streamRef.current = stream;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = cfg.fftSize;
      analyser.smoothingTimeConstant = cfg.smoothingTimeConstant;
      source.connect(analyser); // not connected to the speakers
      sourceRef.current = source;
      analyserRef.current = analyser;
      setStatus("ready");
      loop();
      return true;
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") setStatus("denied");
      else if (name === "NotFoundError" || name === "OverconstrainedError") setStatus("no-device");
      else setStatus("error");
      return false;
    }
  }, [loop]);

  const startSimulated = useCallback(() => {
    setStatus("ready");
    loop();
  }, [loop]);

  const calibrate = useCallback(
    () =>
      new Promise<number>((resolve) => {
        if (!analyserRef.current) {
          resolve(readingRef.current.threshold);
          return;
        }
        calibrationRef.current = { samples: [], until: performance.now() + cfg.calibrationMs, resolve };
      }),
    [],
  );

  const setSimulated = useCallback((on: boolean) => {
    simulatedRef.current = on;
  }, []);

  useEffect(
    () => () => {
      stop();
      void ctxRef.current?.close();
      ctxRef.current = null;
    },
    [stop],
  );

  return { ...ui, status, readingRef, start, startSimulated, stop, calibrate, setSimulated };
}
