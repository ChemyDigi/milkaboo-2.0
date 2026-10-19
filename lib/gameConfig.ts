/**
 * "Free the Milkaboo Cup": every tunable number lives here.
 * Shared by the client (game loop, mic, 3D) and the server (anti-cheat), so the two never disagree.
 * Tune on real phones with `?debug` (see README-halloween.md).
 */

/**
 * Testing only: NEXT_PUBLIC_GAME_EASY=true makes the game easy to win (values after `EASY ?`).
 * NEXT_PUBLIC_ so the browser and the server's anti-cheat use the same rules. Read at build/dev start.
 */
const EASY = process.env.NEXT_PUBLIC_GAME_EASY === "true";

export const gameConfig = {
  /** shown as a badge in the game so easy mode is never shipped by accident */
  easy: EASY,

  round: {
    /** seconds the player has to free the cup */
    timeLimit: EASY ? 30 : 20,
    /** seconds of continuous, threshold-level suction needed to go 0 → 100% */
    fillSeconds: EASY ? 3 : 7,
    /** progress lost per second while not sucking (0.16 = 16%/s): the ghost wraps back */
    drainPerSec: EASY ? 0.04 : 0.16,
    /** stronger suction peels faster, up to this multiple of the base rate */
    maxBoost: 1.5,
    /** how quickly extra loudness turns into boost: 1 + (rms / threshold − 1) × boostSlope */
    boostSlope: 0.35,
    /** the "Shhh… 3-2-1" screen, in ms; the mic calibrates during the first `mic.calibrationMs` of it */
    countdownMs: 3000,
  },

  fightBack: {
    /** the ghost fights back at a random moment every minInterval–maxInterval seconds */
    minInterval: EASY ? 8 : 3.5,
    maxInterval: EASY ? 12 : 5.5,
    /** …for this many seconds */
    duration: 1.4,
    /** while fighting, the suction threshold is this much higher… */
    thresholdMultiplier: EASY ? 1.1 : 1.7,
    /** …and the ghost wraps back this much faster */
    drainMultiplier: EASY ? 1.2 : 2.2,
    /** Android haptics pattern when it grips (ms on/off/on) */
    vibratePattern: [70, 40, 90] as number[],
  },

  mic: {
    fftSize: 2048,
    /** analyser smoothing; low keeps the meter snappy, a little smooths the flatness reading */
    smoothingTimeConstant: 0.35,
    /** spectral flatness is measured in this band: breath and air are flat across it, voice is not */
    bandLowHz: 200,
    bandHighHz: 6000,
    /** quiet-room calibration window */
    calibrationMs: 2000,
    /** threshold = clamp(roomNoise × thresholdFactor, minThreshold, maxThreshold) */
    thresholdFactor: EASY ? 1.6 : 2.6,
    minThreshold: EASY ? 0.008 : 0.018,
    /** stops a noisy room from making the game impossible */
    maxThreshold: 0.14,
    /** 0–1. Breath is ~0.3–0.7 here, voice/whistle ~0.02–0.2. Raise it if shouting works, lower it if breath doesn't. */
    minFlatness: EASY ? 0.18 : 0.28,
    /** debounce so one noisy frame doesn't flip the state: must hold for attack, survives gaps up to release */
    attackMs: 60,
    releaseMs: 140,
    /** level meter smoothing (per-second rates) */
    rmsAttack: 30,
    rmsRelease: 8,
  },

  limits: {
    /** tries per device per day (counted on the server when a round starts) */
    maxAttemptsPerDay: 3,
    /** backup limit for the whole IP: shop wifi and carrier NAT share IPs, so keep it loose */
    maxAttemptsPerIpPerDay: 30,
    /** prizes one email can win over the whole campaign */
    prizesPerEmail: 1,
    /** prizes one device can win per day */
    prizesPerDevicePerDay: 1,
    /** free cups the server will hand out per day, across everyone */
    dailyPrizeBudget: 50,
    /** "day" for all the limits above is the calendar day in this time zone */
    timeZone: "Asia/Colombo",
  },

  server: {
    /** a session token from /api/game/start is only good for this long (covers the email form after a win) */
    tokenTtlSec: 15 * 60,
    /** the client records progress this often; the server replays it */
    sampleIntervalMs: 250,
    /** extra seconds allowed past timeLimit for frame jitter and the win animation */
    durationSlackSec: 3,
    /** the fastest legal progress rate is maxBoost / fillSeconds; samples may exceed it by this factor */
    rateTolerance: 1.2,
    /** codes look like BOO-XXXXX and stay valid this many days */
    codePrefix: "BOO",
    codeValidDays: 7,
  },

  /** where the ghost lets go, in progress (0–1). Shared by the 3D reveal and the status copy. */
  stages: {
    /** 0 → stretchEnd: the ghost only stretches toward the player */
    stretchEnd: 0.3,
    /** stretchEnd → logoOnly: it peels from the top; lid and straw come free */
    logoOnly: 0.7,
    /** logoOnly → 1: only the logo is still covered; it clings on with its hands */
  },

  cup: {
    /** drop the real model here; the primitive placeholder is used until it exists (see README) */
    modelUrl: "/models/milkaboo-cup.glb",
    /** set to true once the .glb is in /public/models */
    useModel: false,
    /** the GLB is scaled so its height matches this (scene units), and sits on y = bottom */
    height: 2.6,
    bottom: -1.35,
    /** extra rotation for the GLB so the logo faces the camera (radians, around Y) */
    modelRotationY: 0,
    /** the logo's centre on the cup surface: angle around Y (0 = facing the camera) and height */
    logoAngle: 0,
    logoY: -0.1,
    /** half-size of the logo, measured along the surface (scene units) */
    logoHalfWidth: 0.3,
    logoHalfHeight: 0.46,
  },

  /** colours used in the 3D scene (the UI uses the CSS tokens in globals.css) */
  colors: {
    /** sky at the top and at the horizon (the horizon is also the fog colour) */
    night: "#07040f",
    fog: "#2a1a3f",
    /** the ghost: a grimy pale sheet with an ectoplasm-green glow, ember eyes, red when it fights back */
    ghost: "#dfe6dd",
    ghostGlow: "#7ff5c8",
    rim: "#8affd6",
    grip: "#ff2a3c",
    ember: "#ff4a1a",
    /** the cup, from the product photo: taro-purple tea, near-black pearls */
    taro: "#9d6ee4",
    pearl: "#1a0d08",
    pumpkin: "#ff8a1f",
    moon: "#dfe6ff",
    warm: "#ffc39c",
  },

  sound: {
    /** keep the in-game sounds quiet: the mic runs without echo cancellation and would hear them */
    ambient: 0.35,
    slurp: 0.25,
    sfx: 0.7,
  },
} as const;

export type GameConfig = typeof gameConfig;

/** The fastest a legitimate round can possibly be (seconds of play): full suction at max boost, no fight-backs. */
export const minRoundSeconds = gameConfig.round.fillSeconds / gameConfig.round.maxBoost;
