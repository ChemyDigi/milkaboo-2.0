"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { gameConfig } from "@/lib/gameConfig";
import type { DeviceTier } from "@/hooks/useDeviceTier";
import type { CurseUniforms } from "./curse";
import Graveyard, { GROUND_Y } from "./Graveyard";
import { batGeometry, groundTexture, moonTexture, softDot } from "./textures";
import type { Visual } from "./sceneState";

const { colors } = gameConfig;
const HORIZON = new THREE.Color(colors.fog);
const WARM_HORIZON = new THREE.Color("#4a2a44");
const MOON = { position: [3.8, 6.8, -24] as [number, number, number], radius: 2.1 };

interface Props {
  visual: Visual;
  tier: DeviceTier;
  reducedMotion: boolean;
  curse: CurseUniforms;
}

/**
 * The night: a starry sky with a full moon and storm clouds, lightning, the graveyard, drifting fog,
 * the purple mist leaking from under the ghost, and bats. The haze clears to a warm glow when the cup is freed.
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
      <Sky visual={visual} curse={curse} />
      <Moon />
      <Clouds visual={visual} reducedMotion={reducedMotion} />
      <Lightning visual={visual} curse={curse} reducedMotion={reducedMotion} />
      <Ground visual={visual} />
      <Graveyard visual={visual} tier={tier} reducedMotion={reducedMotion} />
      <GroundMist visual={visual} count={low ? 4 : 7} reducedMotion={reducedMotion} />
      <FogPuffs visual={visual} count={low ? 4 : 8} reducedMotion={reducedMotion} />
      <Mist visual={visual} count={low ? 4 : 7} />
      <Bats visual={visual} reducedMotion={reducedMotion} count={low ? 4 : 6} center={[0, 2.6, -5]} radius={3.5} size={0.5} speed={0.3} />
      <Bats visual={visual} reducedMotion={reducedMotion} count={low ? 3 : 6} center={MOON.position} radius={3.0} size={1.0} speed={0.18} />
    </>
  );
}

/** Sky dome: a gradient from the horizon to a near-black zenith, twinkling stars, lightning and the win's warmth. */
function Sky({ visual, curse }: { visual: Visual; curse: CurseUniforms }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uHorizon: { value: HORIZON.clone() },
          uZenith: { value: new THREE.Color(colors.night) },
          uTime: { value: 0 },
          uFlash: curse.uFlash,
          uWarm: curse.uWarm,
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uHorizon;
          uniform vec3 uZenith;
          uniform float uTime;
          uniform float uFlash;
          uniform float uWarm;
          varying vec3 vDir;
          float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          void main() {
            vec3 d = normalize(vDir);
            float h = clamp(d.y * 1.5 + 0.12, 0.0, 1.0);
            vec3 col = mix(uHorizon, uZenith, pow(h, 0.6));
            // stars, denser and brighter toward the zenith
            vec2 sph = vec2(atan(d.z, d.x), asin(clamp(d.y, -1.0, 1.0))) * 70.0;
            vec2 id = floor(sph);
            vec2 fr = fract(sph) - 0.5;
            float rnd = hash(id);
            vec2 offset = (vec2(hash(id + 1.3), hash(id + 2.7)) - 0.5) * 0.6;
            float star = (1.0 - smoothstep(0.0, 0.05, length(fr - offset))) * step(0.92, rnd);
            star *= (0.55 + 0.45 * sin(uTime * 2.5 + rnd * 40.0)) * smoothstep(0.02, 0.3, d.y);
            col += vec3(0.9, 0.92, 1.0) * star * 0.8;
            col += vec3(0.5, 0.55, 0.8) * uFlash;
            col = mix(col, col * vec3(1.4, 1.1, 1.0) + vec3(0.03, 0.015, 0.0), uWarm * 0.35);
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      }),
    [curse],
  );
  useEffect(() => () => material.dispose(), [material]);
  useFrame(() => {
    material.uniforms.uTime.value = visual.time;
    (material.uniforms.uHorizon.value as THREE.Color).copy(HORIZON).lerp(WARM_HORIZON, visual.warm);
  });
  return (
    <mesh material={material} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[60, 24, 16]} />
    </mesh>
  );
}

function Moon() {
  const { disc, glow } = useMemo(
    () => ({
      disc: new THREE.MeshBasicMaterial({ map: moonTexture(), color: new THREE.Color(1.0, 1.02, 1.18), fog: false, toneMapped: false }),
      glow: new THREE.SpriteMaterial({
        map: softDot(),
        color: "#8c9cff",
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
      }),
    }),
    [],
  );
  useEffect(
    () => () => {
      disc.dispose();
      glow.dispose();
    },
    [disc, glow],
  );
  return (
    <group position={MOON.position}>
      <sprite material={glow} scale={MOON.radius * 4.2} position={[0, 0, -0.5]} />
      <mesh material={disc}>
        <circleGeometry args={[MOON.radius, 48]} />
      </mesh>
    </group>
  );
}

/** Storm clouds crawling across the moon. */
function Clouds({ visual, reducedMotion }: { visual: Visual; reducedMotion: boolean }) {
  const group = useRef<THREE.Group>(null);
  const material = useMemo(
    () => new THREE.SpriteMaterial({ map: softDot(), color: "#15102a", transparent: true, opacity: 0.85, depthWrite: false, fog: false }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);
  const clouds = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        x: -14 + i * 7,
        y: MOON.position[1] - 2 + (i % 3) * 1.6,
        w: 9 + (i % 2) * 4,
        h: 2.4 + (i % 3) * 0.6,
        speed: 0.12 + (i % 3) * 0.05,
      })),
    [],
  );
  useFrame(() => {
    const drift = reducedMotion ? 0.25 : 1;
    group.current?.children.forEach((c, i) => {
      const k = clouds[i];
      c.position.x = ((k.x + visual.time * k.speed * drift + 18) % 36) - 18;
    });
    material.opacity = 0.85 - visual.warm * 0.5;
  });
  return (
    <group ref={group} position={[0, 0, MOON.position[2] + 1.5]}>
      {clouds.map((k, i) => (
        <sprite key={i} material={material} position={[k.x, k.y, 0]} scale={[k.w, k.h, 1]} />
      ))}
    </group>
  );
}

/** Lightning every so often: a bolt behind the hill, the sky and the ghost light up, and the moonlight flares. */
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

/** Dark earth stretching back to the horizon, and the cup's soft shadow on it. */
function Ground({ visual }: { visual: Visual }) {
  const { material, shadow } = useMemo(() => {
    const map = groundTexture();
    map.repeat.set(14, 14);
    return {
      material: new THREE.MeshStandardMaterial({ map, color: "#b4a4cc", roughness: 1 }),
      shadow: new THREE.MeshBasicMaterial({ map: softDot(), color: "#000", transparent: true, opacity: 0.75, depthWrite: false }),
    };
  }, []);
  useEffect(
    () => () => {
      material.dispose();
      shadow.dispose();
    },
    [material, shadow],
  );
  useFrame(() => {
    shadow.opacity = 0.75 - visual.warm * 0.3;
  });
  return (
    <>
      <mesh material={material} rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND_Y, -10]}>
        <planeGeometry args={[90, 70]} />
      </mesh>
      <mesh material={shadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND_Y + 0.01, 0.1]} scale={[3.2, 2.0, 1]}>
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
