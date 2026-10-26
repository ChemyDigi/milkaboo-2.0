"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Sparkles, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { gameConfig } from "@/lib/gameConfig";
import type { DeviceTier } from "@/hooks/useDeviceTier";
import type { CurseUniforms } from "./curse";
import { batGeometry, contactShadow, softDot } from "./textures";
import type { Visual } from "./sceneState";

const { colors, backdrop } = gameConfig;
const HORIZON = new THREE.Color(colors.fog);
const WARM_HORIZON = new THREE.Color("#4a2a44");
/** the ground the cup stands on, in world space; the backdrop's painted ground is lined up with it */
export const GROUND_Y = -1.5;
useTexture.preload(backdrop.url);

interface Props {
  visual: Visual;
  tier: DeviceTier;
  reducedMotion: boolean;
  curse: CurseUniforms;
}

/**
 * The night: the painted cemetery backdrop, lightning, drifting fog, the purple mist leaking from under
 * the ghost, fireflies and bats. The haze clears to a warm glow when the cup is freed.
 */
export default function Atmosphere({ visual, tier, reducedMotion, curse }: Props) {
  const scene = useThree((s) => s.scene);
  const fog = useMemo(() => new THREE.Fog(HORIZON.clone(), 6, 30), []);

  useEffect(() => {
    scene.fog = fog;
    return () => {
      scene.fog = null;
    };
  }, [scene, fog]);

  useFrame(() => {
    fog.color.copy(HORIZON).lerp(WARM_HORIZON, visual.warm);
    fog.far = 30 + visual.warm * 12;
  });

  const low = tier === "low";
  return (
    <>
      {/* the painting loads on its own; the night sky colour shows meanwhile */}
      <color attach="background" args={[colors.night]} />
      <Suspense fallback={null}>
        <Backdrop curse={curse} />
      </Suspense>
      <Lightning visual={visual} curse={curse} reducedMotion={reducedMotion} />
      <CupShadow visual={visual} />
      {!low && (
        <Sparkles count={30} scale={[10, 2.4, 5]} position={[0, GROUND_Y + 1.2, -2.5]} size={2.2} speed={0.25} color="#ffb3d9" opacity={0.6} />
      )}
      <GroundMist visual={visual} count={low ? 4 : 7} reducedMotion={reducedMotion} />
      <FogPuffs visual={visual} count={low ? 4 : 8} reducedMotion={reducedMotion} />
      <Mist visual={visual} count={low ? 4 : 7} />
      <Bats visual={visual} reducedMotion={reducedMotion} count={low ? 4 : 7} center={[0, 2.6, -5]} radius={3.5} size={0.5} speed={0.3} />
      <Bats visual={visual} reducedMotion={reducedMotion} count={low ? 3 : 6} center={[2.4, 5.2, -12]} radius={3.0} size={0.8} speed={0.18} />
      <BatSwarm visual={visual} curse={curse} reducedMotion={reducedMotion} count={low ? 6 : 12} />
    </>
  );
}

/**
 * The painted cemetery (`gameConfig.backdrop`), far behind everything. It always fills the screen like
 * CSS `object-fit: cover` (never zoomed in beyond that), and is slid so its painted ground (`backdrop.ground`)
 * comes as close as it can to the cup's base on screen: the cup stands on the painting. It lights up with
 * the lightning (the sky more than the ground) and the warm glow of the win.
 */
function Backdrop({ curse }: { curse: CurseUniforms }) {
  const map = useTexture(backdrop.url);
  const mesh = useRef<THREE.Mesh>(null);
  const material = useMemo(() => {
    map.colorSpace = THREE.SRGBColorSpace;
    return new THREE.ShaderMaterial({
      depthWrite: false,
      uniforms: { uMap: { value: map }, uHaze: { value: HORIZON.clone() }, uFlash: curse.uFlash, uWarm: curse.uWarm },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap;
        uniform vec3 uHaze;
        uniform float uFlash;
        uniform float uWarm;
        varying vec2 vUv;
        void main() {
          // seen through the night haze: softer and lower in contrast, so the cup and the ghost stand out
          vec3 col = mix(uHaze * 0.6, texture2D(uMap, vUv).rgb, ${backdrop.opacity.toFixed(2)});
          float sky = smoothstep(0.35, 0.8, vUv.y);
          col += col * uFlash * (0.5 + 1.6 * sky) + vec3(0.35, 0.4, 0.75) * uFlash * 0.22 * sky;
          col = mix(col, col * vec3(1.35, 1.1, 1.0) + vec3(0.03, 0.015, 0.0), uWarm * 0.35);
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });
  }, [map, curse]);
  useEffect(() => () => material.dispose(), [material]);

  const forward = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(), []);
  const base = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    const m = mesh.current;
    if (!m) return;
    const cam = camera as THREE.PerspectiveCamera;
    const image = map.image as { width: number; height: number };
    const imageAspect = image.width / image.height;
    const d = backdrop.distance;
    const viewH = 2 * d * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const viewW = viewH * (size.width / Math.max(size.height, 1));
    // where the cup's base is on screen, as a height on the backdrop's plane
    cam.updateMatrixWorld();
    const baseY = (base.set(0, GROUND_Y, 0).project(cam).y * viewH) / 2;
    // just cover the view (a hair more for the parallax), never zoom in further; then slide the painted
    // ground as close to the cup's base as the picture allows without showing its top or bottom edge
    const h = Math.max(viewH, viewW / imageAspect) * 1.02;
    const slideY = THREE.MathUtils.clamp(baseY - (backdrop.ground - 0.5) * h, -(h - viewH) / 2, (h - viewH) / 2);
    const w = h * imageAspect;
    const slideX = THREE.MathUtils.clamp((0.5 - backdrop.focusX) * w - cam.position.x * 0.4, -(w - viewW) / 2, (w - viewW) / 2);
    cam.getWorldDirection(forward);
    right.setFromMatrixColumn(cam.matrixWorld, 0);
    up.setFromMatrixColumn(cam.matrixWorld, 1);
    m.position.copy(cam.position).addScaledVector(forward, d).addScaledVector(right, slideX).addScaledVector(up, slideY);
    m.quaternion.copy(cam.quaternion);
    m.scale.set(w, h, 1);
  });

  return (
    <mesh ref={mesh} material={material} renderOrder={-10} frustumCulled={false}>
      <planeGeometry />
    </mesh>
  );
}

/** Lightning every so often: a bolt across the sky, the backdrop, ghost and cup light up, and the bats scatter. */
function Lightning({ visual, curse, reducedMotion }: { visual: Visual; curse: CurseUniforms; reducedMotion: boolean }) {
  const light = useRef<THREE.DirectionalLight>(null);
  const strike = useRef({ next: 5, flashes: [] as { at: number; power: number }[], boltUntil: 0 });
  const bolt = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(16 * 3), 3));
    const material = new THREE.LineBasicMaterial({ color: new THREE.Color(2.5, 2.6, 3.5), toneMapped: false, fog: false, transparent: true });
    const line = new THREE.Line(geometry, material);
    line.visible = false;
    line.frustumCulled = false;
    return line;
  }, []);
  useEffect(
    () => () => {
      bolt.geometry.dispose();
      (bolt.material as THREE.Material).dispose();
    },
    [bolt],
  );

  useFrame(() => {
    const t = visual.time;
    const s = strike.current;
    if (t >= s.next) {
      s.flashes = [
        { at: t, power: 1 },
        { at: t + 0.1, power: 0.45 },
        { at: t + 0.28, power: 0.8 },
      ];
      s.next = t + 7 + Math.random() * 10;
      s.boltUntil = t + 0.26;
      // a fresh jagged bolt from the clouds to the hill
      const pos = bolt.geometry.attributes.position as THREE.BufferAttribute;
      let x = -8 + Math.random() * 16;
      let y = 11;
      for (let i = 0; i < pos.count; i++) {
        pos.setXYZ(i, x, y, -20 - Math.random() * 0.5);
        x += (Math.random() - 0.5) * 1.5;
        y -= 0.8 * (0.5 + Math.random());
      }
      pos.needsUpdate = true;
    }
    let flash = 0;
    for (const f of s.flashes) if (t >= f.at) flash += f.power * Math.exp(-(t - f.at) * 16);
    if (reducedMotion) flash = Math.min(flash, 0.15);
    curse.uFlash.value = flash;
    if (light.current) light.current.intensity = flash * 5;
    bolt.visible = !reducedMotion && t < s.boltUntil && flash > 0.05;
    (bolt.material as THREE.LineBasicMaterial).opacity = Math.min(1, flash);
  });

  return (
    <>
      <directionalLight ref={light} position={[-3, 8, -8]} color="#c2ccff" intensity={0} />
      <primitive object={bolt} />
    </>
  );
}

/** The cup's shadow on the painted ground: a wide soft one, and a dark contact shadow hugging the base. */
function CupShadow({ visual }: { visual: Visual }) {
  const { shadow, contact } = useMemo(
    () => ({
      shadow: new THREE.MeshBasicMaterial({ map: softDot(), color: "#000", transparent: true, opacity: 0.85, depthWrite: false }),
      contact: new THREE.MeshBasicMaterial({ map: contactShadow(), transparent: true, opacity: 0.9, depthWrite: false }),
    }),
    [],
  );
  useEffect(
    () => () => {
      shadow.dispose();
      contact.dispose();
    },
    [shadow, contact],
  );
  useFrame(() => {
    shadow.opacity = 0.85 - visual.warm * 0.3;
    contact.opacity = 0.9 - visual.warm * 0.25;
  });
  return (
    <>
      <mesh material={shadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND_Y + 0.01, 0.15]} scale={[4.4, 3.0, 1]}>
        <planeGeometry />
      </mesh>
      <mesh material={contact} rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND_Y + 0.02, 0.05]} scale={[2.3, 2.0, 1]}>
        <planeGeometry />
      </mesh>
    </>
  );
}

/** Low mist creeping over the graves. */
function GroundMist({ visual, count, reducedMotion }: { visual: Visual; count: number; reducedMotion: boolean }) {
  const group = useRef<THREE.Group>(null);
  const material = useMemo(
    () => new THREE.SpriteMaterial({ map: softDot(), color: "#4a3a6a", transparent: true, opacity: 0.22, depthWrite: false }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);
  const puffs = useMemo(
    () => Array.from({ length: count }, (_, i) => ({ x: (i / count - 0.5) * 14, z: -1 - (i % 4) * 2.2, w: 6 + (i % 3) * 2, speed: 0.1 + (i % 3) * 0.04 })),
    [count],
  );
  useFrame(() => {
    const drift = reducedMotion ? 0.2 : 1;
    group.current?.children.forEach((c, i) => {
      const p = puffs[i];
      c.position.x = ((p.x + visual.time * p.speed * drift + 9) % 18) - 9;
    });
    material.opacity = 0.22 * (1 - visual.warm * 0.6);
  });
  return (
    <group ref={group}>
      {puffs.map((p, i) => (
        <sprite key={i} material={material} position={[p.x, GROUND_Y + 0.35, p.z]} scale={[p.w, 1.5, 1]} />
      ))}
    </group>
  );
}

/** Big, slow, drifting sheets of purple fog behind and in front of the cup. */
function FogPuffs({ visual, count, reducedMotion }: { visual: Visual; count: number; reducedMotion: boolean }) {
  const group = useRef<THREE.Group>(null);
  const puffs = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: (i / count - 0.5) * 9,
        y: -1.3 + (i % 3) * 1.1,
        z: -5 + (i % 4) * 1.6,
        size: 4 + (i % 3) * 1.5,
        speed: 0.08 + (i % 5) * 0.03,
      })),
    [count],
  );
  const material = useMemo(
    () => new THREE.SpriteMaterial({ map: softDot(), color: "#6b3fb8", transparent: true, depthWrite: false, opacity: 0.14 }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);

  useFrame(() => {
    const children = group.current?.children;
    if (!children) return;
    const drift = reducedMotion ? 0.2 : 1;
    puffs.forEach((p, i) => {
      children[i].position.x = ((p.x + visual.time * p.speed * drift + 6) % 12) - 6;
    });
    material.opacity = 0.14 * (1 - visual.warm * 0.75);
  });

  return (
    <group ref={group}>
      {puffs.map((p, i) => (
        <sprite key={i} material={material} position={[p.x, p.y, p.z]} scale={[p.size, p.size * 0.6, 1]} />
      ))}
    </group>
  );
}

/** Dark purple mist leaking out from under the ghost; it thins as the cup comes free and is gone at the win. */
function Mist({ visual, count }: { visual: Visual; count: number }) {
  const group = useRef<THREE.Group>(null);
  const material = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: softDot(),
        color: "#7a3cff",
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.4,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);

  useFrame(() => {
    const children = group.current?.children;
    if (!children) return;
    children.forEach((child, i) => {
      const phase = visual.time * 0.35 + i * 0.9;
      const life = phase % 1;
      const angle = i * 2.4 + Math.floor(phase) * 0.7;
      const r = 0.9 + life * 1.0;
      child.position.set(Math.sin(angle) * r, GROUND_Y + 0.15 + life * 0.4, Math.cos(angle) * r * 0.7);
      const size = 1 + life * 1.6;
      child.scale.set(size, size * 0.55, 1);
    });
    material.opacity = 0.32 * (1 - visual.progress * 0.7) * (1 - visual.exit) * (1 + visual.grip * 0.8);
  });

  return (
    <group ref={group}>
      {Array.from({ length: count }, (_, i) => (
        <sprite key={i} material={material} />
      ))}
    </group>
  );
}

interface BatsProps {
  visual: Visual;
  reducedMotion: boolean;
  count: number;
  center: readonly [number, number, number];
  radius: number;
  size: number;
  speed: number;
}

/** A flock of bats looping round a point: one instanced mesh, flapping by squashing their width. */
function Bats({ visual, reducedMotion, count, center, radius, size, speed }: BatsProps) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => batGeometry(), []);
  const material = useMemo(() => new THREE.MeshBasicMaterial({ color: "#070410", side: THREE.DoubleSide }), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const t = visual.time * (reducedMotion ? 0.3 : 1);
    for (let i = 0; i < count; i++) {
      const a = t * (speed + (i % 3) * 0.05) + i * 1.9;
      const r = radius * (0.7 + (i % 3) * 0.15);
      dummy.position.set(center[0] + Math.sin(a) * r, center[1] + (i % 4) * 0.5 - 0.8 + Math.sin(t * 1.3 + i) * 0.4, center[2] + Math.cos(a) * r * 0.4 + 0.6);
      const flap = reducedMotion ? 0.8 : 0.35 + 0.65 * Math.abs(Math.sin(t * 11 + i * 2));
      const heading = Math.cos(a) >= 0 ? 1 : -1;
      const s = size * (0.8 + (i % 3) * 0.2);
      dummy.scale.set(s * flap * heading, s, s);
      dummy.rotation.z = Math.sin(t * 2 + i) * 0.2;
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={mesh} args={[geometry, material, count]} frustumCulled={false} />;
}

/**
 * A swarm of bats bursting across the screen: whenever lightning strikes (and now and then on its own),
 * a dozen bats sweep from one side to the other, flapping hard.
 */
function BatSwarm({ visual, curse, reducedMotion, count }: { visual: Visual; curse: CurseUniforms; reducedMotion: boolean; count: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => batGeometry(), []);
  const material = useMemo(() => new THREE.MeshBasicMaterial({ color: "#070410", side: THREE.DoubleSide }), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const flight = useRef({ start: -100, next: 6, dir: 1, y: 2, wasFlashing: false });
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const t = visual.time;
    const f = flight.current;
    const flashing = curse.uFlash.value > 0.5;
    if (!reducedMotion && ((flashing && !f.wasFlashing && t - f.start > 3) || t > f.next)) {
      f.start = t;
      f.next = t + 14 + Math.random() * 10;
      f.dir = Math.random() < 0.5 ? 1 : -1;
      f.y = 1.6 + Math.random() * 2;
    }
    f.wasFlashing = flashing;
    const k = (t - f.start) / 3.2; // 3.2 s to cross
    m.visible = k >= 0 && k <= 1;
    if (!m.visible) return;
    for (let i = 0; i < count; i++) {
      const lag = (i % 4) * 0.06 + (i / count) * 0.12;
      const x = THREE.MathUtils.lerp(-9, 9, THREE.MathUtils.clamp(k * 1.25 - lag, 0, 1)) * f.dir;
      const y = f.y + ((i * 0.37) % 1.4) - 0.7 + Math.sin(t * 3 + i * 1.7) * 0.25;
      const z = -1.5 - ((i * 0.53) % 3);
      dummy.position.set(x, y, z);
      const flap = 0.3 + 0.7 * Math.abs(Math.sin(t * 16 + i * 2.3));
      const s = 0.32 + (i % 3) * 0.08;
      dummy.scale.set(s * flap * f.dir, s, s);
      dummy.rotation.z = Math.sin(t * 4 + i) * 0.25;
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={mesh} args={[geometry, material, count]} frustumCulled={false} visible={false} />;
}
