"use client";

import { Suspense, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { gameConfig } from "@/lib/gameConfig";
import { damp } from "@/lib/breath";
import { GHOST_BOTTOM, revealShape } from "@/lib/reveal";
import type { DeviceTier } from "@/hooks/useDeviceTier";
import Atmosphere from "./Atmosphere";
import Cup from "./Cup";
import { createCurseUniforms, type CurseUniforms } from "./curse";
import Ghost from "./Ghost";
import Reveal from "./Reveal";
import { EXIT_SECONDS, createVisual, type SceneMode, type SceneStateRef, type Visual } from "./sceneState";

const { colors } = gameConfig;
const LOOK_AT = new THREE.Vector3(0, 0.55, 0);
/** what must stay in frame (scene units): the whole ghost plus a little air */
const FRAME_HEIGHT = 5.5;
const FRAME_WIDTH = 2.9;

interface SceneProps {
  state: SceneStateRef;
  tier: DeviceTier;
  reducedMotion: boolean;
}

/**
 * Runs first every frame: turns the game's raw numbers into smoothed visuals and writes the shared
 * uniforms (where the ghost grips, the cup-space matrices, flicker, warmth, the logo glint).
 */
function Director({
  state,
  visual,
  curse,
  cup,
  reducedMotion,
}: {
  state: SceneStateRef;
  visual: Visual;
  curse: CurseUniforms;
  cup: RefObject<THREE.Group | null>;
  reducedMotion: boolean;
}) {
  const flicker = useRef(0);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const s = state.current;
    const since = (performance.now() - s.modeSince) / 1000;
    const freeing = s.mode === "exiting" || s.mode === "won";

    visual.time += dt;
    const target = freeing ? 1 : s.progress;
    // snaps back fast when you stop (the ghost wraps the cup again), wraps slowly after a loss
    const rate = s.mode === "lost" ? 2.5 : target < visual.progress ? 7 : 10;
    visual.progress = damp(visual.progress, target, rate, dt);
    const suck = s.mode === "playing" ? s.suck : 0;
    visual.suck = damp(visual.suck, suck, suck > visual.suck ? 14 : 5, dt);
    visual.grip = damp(visual.grip, s.grip && s.mode === "playing" ? 1 : 0, 12, dt);
    visual.exit = freeing ? Math.min(1, s.mode === "won" ? 1 : since / EXIT_SECONDS) : 0;
    visual.winT = s.mode === "won" ? since : -1;
    visual.loseT = s.mode === "lost" ? since : -1;
    visual.warm = damp(visual.warm, s.mode === "won" ? 1 : 0, s.mode === "won" ? 1.6 : 4, dt);

    const shape = revealShape(visual.progress);
    const e = visual.exit;
    curse.uRevealY.value = THREE.MathUtils.lerp(shape.revealY, GHOST_BOTTOM - 1, e);
    curse.uPatch.value = THREE.MathUtils.lerp(shape.patch, -3, e);
    curse.uTime.value = visual.time;
    curse.uWarm.value = visual.warm;

    // the cursed cup's light stutters now and then (not with reduced motion)
    if (!reducedMotion && Math.random() < dt * 0.9) flicker.current = 0.18;
    flicker.current = Math.max(0, flicker.current - dt);
    curse.uFlicker.value = flicker.current > 0 ? 0.5 + 0.5 * Math.random() : 0;

    // the logo glint sweeps across every 3.2 s once the cup is free
    curse.uShine.value = visual.winT > 0.8 ? (((visual.winT - 0.8) % 3.2) / 1.4) * 1.9 - 0.3 : -1;

    // the freed cup holds still for the first glint, then turns slowly like a product shot;
    // between rounds it settles back to face front
    const g = cup.current;
    if (g) {
      if (visual.winT > 2.2) g.rotation.y += dt * (reducedMotion ? 0.12 : 0.35);
      else g.rotation.y = damp(g.rotation.y, Math.round(g.rotation.y / (Math.PI * 2)) * Math.PI * 2, 3, dt);
      g.updateMatrixWorld();
      curse.uCupToWorld.value.copy(g.matrixWorld);
      curse.uWorldToCup.value.copy(g.matrixWorld).invert();
    }
  }, -1);

  return null;
}

/**
 * How each screen frames the cup around its UI: `zoom` > 1 pulls back, `lift` raises the cup on screen
 * (as a fraction of the screen height). Intro and result screens have a panel over the bottom half.
 */
const FRAMING: Record<SceneMode, { zoom: number; lift: number }> = {
  intro: { zoom: 1.6, lift: 0.07 },
  calibrating: { zoom: 1, lift: 0 },
  playing: { zoom: 1, lift: 0 },
  exiting: { zoom: 1, lift: 0 },
  won: { zoom: 1.2, lift: 0.08 },
  lost: { zoom: 1.2, lift: 0.08 },
};

/** Frames the cup for any aspect ratio and screen, sways gently, shakes when the ghost fights back and with the thunder. */
function CameraRig({
  state,
  visual,
  curse,
  reducedMotion,
}: {
  state: SceneStateRef;
  visual: Visual;
  curse: CurseUniforms;
  reducedMotion: boolean;
}) {
  const frame = useRef({ zoom: 1.6, lift: 0.07 });
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera, size }, dt) => {
    const cam = camera as THREE.PerspectiveCamera;
    const goal = FRAMING[state.current.mode];
    const f = frame.current;
    f.zoom = damp(f.zoom, goal.zoom, 2.5, dt);
    f.lift = damp(f.lift, goal.lift, 2.5, dt);

    const aspect = size.width / Math.max(size.height, 1);
    const tan = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const distance = Math.max(FRAME_HEIGHT / 2 / tan, FRAME_WIDTH / 2 / (tan * aspect)) * f.zoom;
    // looking lower moves the cup up the screen: lift × the visible height at the cup
    const lift = f.lift * 2 * distance * tan;
    const t = visual.time;
    const sway = reducedMotion ? 0 : 1;
    const shake = reducedMotion ? 0 : visual.grip * 0.035 + Math.min(curse.uFlash.value, 1) * 0.06;
    target.set(0, LOOK_AT.y - lift, 0);
    cam.position.set(
      Math.sin(t * 0.27) * 0.14 * sway + (Math.random() - 0.5) * shake,
      target.y + 0.15 + Math.sin(t * 0.37) * 0.07 * sway + (Math.random() - 0.5) * shake,
      distance,
    );
    cam.lookAt(target);
  });
  return null;
}

/** Moonlight from behind, a cold key from the front, and the ghost's own sickly glow. */
function Lights({ visual }: { visual: Visual }) {
  const ambient = useRef<THREE.AmbientLight>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const ghostGlow = useRef<THREE.PointLight>(null);
  const cold = useMemo(() => new THREE.Color("#5c4a8a"), []);
  const warm = useMemo(() => new THREE.Color(colors.warm), []);
  const keyCold = useMemo(() => new THREE.Color("#b9b4e6"), []);

  useFrame(() => {
    ambient.current?.color.copy(cold).lerp(warm, visual.warm * 0.5);
    if (ambient.current) ambient.current.intensity = 0.35 + visual.warm * 0.6;
    key.current?.color.copy(keyCold).lerp(warm, visual.warm * 0.3);
    if (key.current) key.current.intensity = 1.1 + visual.warm * 0.8;
    if (ghostGlow.current) ghostGlow.current.intensity = (2.2 + visual.grip * 3) * (1 - visual.exit);
  });

  return (
    <>
      <ambientLight ref={ambient} intensity={0.35} />
      <hemisphereLight args={["#3a2a5a", "#1a1020", 0.7]} />
      <directionalLight ref={key} position={[2.5, 4, 5]} intensity={1.1} />
      <directionalLight position={[-3, 6, -5]} intensity={1.6} color="#8fa3ff" />
      <pointLight position={[0, 1.8, -2.4]} intensity={6} distance={8} color="#8a4cff" />
      <pointLight ref={ghostGlow} position={[0, 0.4, 1.6]} distance={5} color={colors.ghostGlow} />
    </>
  );
}

function Effects({ tier }: { tier: DeviceTier }) {
  if (tier === "low") return null;
  return (
    <EffectComposer multisampling={tier === "high" ? 4 : 0} enableNormalPass={false}>
      <Bloom mipmapBlur luminanceThreshold={0.85} luminanceSmoothing={0.2} intensity={tier === "high" ? 1.1 : 0.8} radius={0.7} />
      {/* film grain and a heavy vignette for the horror-movie look */}
      <Noise premultiply blendFunction={BlendFunction.SCREEN} opacity={0.12} />
      <Vignette offset={0.2} darkness={0.85} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}

const lowerTier = (t: DeviceTier): DeviceTier => (t === "high" ? "mid" : "low");

/** The whole 3D scene. Reads the game through `state` (a ref), so it never re-renders during play. */
export default function Scene({ state, tier: initialTier, reducedMotion }: SceneProps) {
  const [tier, setTier] = useState(initialTier);
  const visual = useMemo(() => createVisual(), []);
  const curse = useMemo(() => createCurseUniforms(), []);
  const cup = useRef<THREE.Group>(null);

  return (
    <Canvas
      dpr={tier === "high" ? [1, 2] : tier === "mid" ? [1, 1.5] : 1}
      gl={{ antialias: tier === "low", powerPreference: "high-performance", alpha: false, stencil: false }}
      camera={{ fov: 35, position: [0, 0.6, 9], near: 0.1, far: 120 }}
      onCreated={({ gl }) => {
        // the clear cup re-renders what's behind it; half resolution is plenty on phones
        gl.transmissionResolutionScale = tier === "high" ? 1 : 0.5;
      }}
    >
      <PerformanceMonitor flipflops={3} onDecline={() => setTier(lowerTier)} onFallback={() => setTier("low")} />
      <Director state={state} visual={visual} curse={curse} cup={cup} reducedMotion={reducedMotion} />
      <CameraRig state={state} visual={visual} curse={curse} reducedMotion={reducedMotion} />
      <Lights visual={visual} />
      {/* a tiny studio environment rendered once, for the plastic's reflections; no HDR download */}
      <Environment resolution={64} frames={1}>
        <Lightformer intensity={2.0} position={[0, 4, 3]} scale={[6, 1.2, 1]} color="#dfe6ff" />
        <Lightformer intensity={1.6} position={[-4, 2, -2]} rotation-y={Math.PI / 2} scale={[4, 2, 1]} color="#8fa3ff" />
        <Lightformer intensity={1.0} position={[4, 0.2, -1]} rotation-y={-Math.PI / 2} scale={[4, 2, 1]} color={colors.pumpkin} />
      </Environment>
      <Atmosphere visual={visual} tier={tier} reducedMotion={reducedMotion} curse={curse} />
      <Cup ref={cup} curse={curse} visual={visual} tier={tier}>
        {/* her portrait loads on its own; the cup and the scene don't wait for it */}
        <Suspense fallback={null}>
          <Ghost curse={curse} visual={visual} state={state} reducedMotion={reducedMotion} />
        </Suspense>
      </Cup>
      <Reveal visual={visual} tier={tier} />
      <Effects tier={tier} />
    </Canvas>
  );
}
