"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { gameConfig } from "@/lib/gameConfig";
import type { DeviceTier } from "@/hooks/useDeviceTier";
import { pumpkinGlow, pumpkinSkin, softDot, tombstoneTexture } from "./textures";
import type { Visual } from "./sceneState";

const { colors } = gameConfig;
/** the ground, in world space */
export const GROUND_Y = -1.5;
const UP = new THREE.Vector3(0, 1, 0);

function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

/** A rounded-top headstone, 0.6 wide and 0.9 tall, standing on y = 0. */
function headstoneGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.3, 0);
  shape.lineTo(0.3, 0);
  shape.lineTo(0.3, 0.6);
  shape.absarc(0, 0.6, 0.3, 0, Math.PI, false);
  shape.lineTo(-0.3, 0);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 1 });
  geo.translate(0, 0, -0.07);
  return geo;
}

function crossGeometry() {
  const post = new THREE.BoxGeometry(0.12, 1.05, 0.1);
  post.translate(0, 0.525, 0);
  const bar = new THREE.BoxGeometry(0.6, 0.12, 0.1);
  bar.translate(0, 0.78, 0);
  const merged = mergeGeometries([post, bar]);
  [post, bar].forEach((g) => g.dispose());
  return merged ?? post;
}

function fencePostGeometry() {
  const post = new THREE.BoxGeometry(0.05, 1.0, 0.05);
  post.translate(0, 0.5, 0);
  const spike = new THREE.ConeGeometry(0.06, 0.16, 4);
  spike.translate(0, 1.08, 0);
  const merged = mergeGeometries([post, spike].map((g) => g.toNonIndexed()));
  [post, spike].forEach((g) => g.dispose());
  return merged ?? post;
}

/** A bare, twisted tree: cylinders branching recursively, merged into one geometry. */
function deadTreeGeometry(seed: number) {
  const rand = seeded(seed);
  const parts: THREE.BufferGeometry[] = [];
  const branch = (start: THREE.Vector3, dir: THREE.Vector3, length: number, radius: number, depth: number) => {
    const geo = new THREE.CylinderGeometry(radius * 0.55, radius, length, 5, 1, true);
    geo.translate(0, length / 2, 0);
    geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, dir));
    geo.translate(start.x, start.y, start.z);
    parts.push(geo);
    if (depth === 0) return;
    const end = start.clone().addScaledVector(dir, length);
    const count = depth >= 4 ? 3 : 2;
    for (let i = 0; i < count; i++) {
      const axis = new THREE.Vector3(rand() - 0.5, rand() * 0.3, rand() - 0.5).normalize();
      const next = dir.clone().applyAxisAngle(axis, 0.45 + rand() * 0.6);
      if (next.y < 0.1) next.y = 0.1 + rand() * 0.3;
      branch(end, next.normalize(), length * (0.6 + rand() * 0.15), radius * 0.62, depth - 1);
    }
  };
  branch(new THREE.Vector3(), UP.clone(), 1.7, 0.17, 5);
  const merged = mergeGeometries(parts.map((g) => g.toNonIndexed()));
  parts.forEach((g) => g.dispose());
  return merged!;
}

/** A haunted house in silhouette: main block with a gable, a tower with a spire, and a chimney. */
function houseGeometry() {
  const house = new THREE.Shape();
  [
    [0, 0], [0, 2.2], [1.7, 3.9], [2.9, 2.75], [3.4, 2.2], [3.4, 3.4], [3.3, 3.4], [4.0, 5.1], [4.7, 3.4], [4.6, 3.4], [4.6, 0],
  ].forEach(([x, y], i) => (i === 0 ? house.moveTo(x, y) : house.lineTo(x, y)));
  const chimney = new THREE.Shape();
  [[0.45, 0], [0.45, 3.3], [0.78, 3.3], [0.78, 0]].forEach(([x, y], i) => (i === 0 ? chimney.moveTo(x, y) : chimney.lineTo(x, y)));
  return new THREE.ShapeGeometry([house, chimney]);
}

/** A pumpkin: a sphere with ribs pressed in and a crooked stem; the face is in its textures. */
function pumpkinGeometry() {
  const body = new THREE.SphereGeometry(1, 20, 12);
  const pos = body.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const rib = 1 - 0.09 * Math.abs(Math.sin(Math.atan2(v.z, v.x) * 4));
    pos.setXYZ(i, v.x * rib, v.y * 0.8, v.z * rib);
  }
  body.computeVertexNormals();
  const stem = new THREE.CylinderGeometry(0.07, 0.13, 0.4, 6);
  stem.rotateZ(0.3);
  stem.translate(0.05, 0.9, 0);
  return { body, stem };
}

interface Props {
  visual: Visual;
  tier: DeviceTier;
  reducedMotion: boolean;
}

/** The graveyard behind the cup: headstones, a spiked fence, dead trees, a haunted house, pumpkins and fireflies. */
export default function Graveyard({ visual, tier, reducedMotion }: Props) {
  const low = tier === "low";
  return (
    <group position={[0, GROUND_Y, 0]}>
      <Headstones />
      <Fence />
      <Candles visual={visual} />
      <DeadTrees />
      <HauntedHouse visual={visual} />
      <Pumpkins visual={visual} reducedMotion={reducedMotion} groundCount={low ? 7 : 12} />
      {!low && (
        <Sparkles count={36} scale={[14, 2.4, 10]} position={[0, 1.2, -5]} size={2.2} speed={0.25} color="#a8ffb8" opacity={0.6} />
      )}
    </group>
  );
}

const HEADSTONES: { x: number; z: number; scale: number; rotY: number; tilt: number; cross?: boolean }[] = [
  { x: -2.7, z: -3.4, scale: 1.0, rotY: 0.3, tilt: -0.12 },
  { x: 2.6, z: -3.8, scale: 0.9, rotY: -0.4, tilt: 0.08 },
  { x: -1.6, z: -6.2, scale: 0.85, rotY: 0.1, tilt: 0.15, cross: true },
  { x: 3.6, z: -6.8, scale: 1.1, rotY: -0.2, tilt: -0.05 },
  { x: -4.4, z: -5.2, scale: 0.95, rotY: 0.6, tilt: 0.2 },
  { x: 1.1, z: -8.6, scale: 1.0, rotY: 0.0, tilt: -0.18, cross: true },
  { x: 5.0, z: -4.8, scale: 0.8, rotY: -0.7, tilt: 0.1 },
  { x: -0.7, z: -10.2, scale: 1.15, rotY: 0.2, tilt: 0.0 },
  { x: -5.6, z: -8.4, scale: 1.05, rotY: 0.4, tilt: -0.1 },
];

function Headstones() {
  const stones = useRef<THREE.InstancedMesh>(null);
  const crosses = useRef<THREE.InstancedMesh>(null);
  const { stone, cross, stoneMaterial, crossMaterial } = useMemo(() => {
    const map = tombstoneTexture();
    // the extrusion's UVs are the shape's own coordinates (x −0.3…0.3, y 0…0.9); map the texture onto them
    map.repeat.set(1 / 0.6, 1 / 0.9);
    map.offset.set(0.5, 0);
    return {
      stone: headstoneGeometry(),
      cross: crossGeometry(),
      stoneMaterial: new THREE.MeshStandardMaterial({ map, roughness: 0.95 }),
      crossMaterial: new THREE.MeshStandardMaterial({ color: "#2e2838", roughness: 0.9 }),
    };
  }, []);
  useEffect(
    () => () => {
      [stone, cross].forEach((g) => g.dispose());
      [stoneMaterial, crossMaterial].forEach((m) => m.dispose());
    },
    [stone, cross, stoneMaterial, crossMaterial],
  );

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    let si = 0;
    let ci = 0;
    for (const h of HEADSTONES) {
      dummy.position.set(h.x, 0, h.z);
      dummy.rotation.set(0, h.rotY, h.tilt);
      dummy.scale.setScalar(h.scale);
      dummy.updateMatrix();
      if (h.cross) crosses.current?.setMatrixAt(ci++, dummy.matrix);
      else stones.current?.setMatrixAt(si++, dummy.matrix);
    }
    if (stones.current) stones.current.instanceMatrix.needsUpdate = true;
    if (crosses.current) crosses.current.instanceMatrix.needsUpdate = true;
  }, []);

  const crossCount = HEADSTONES.filter((h) => h.cross).length;
  return (
    <>
      <instancedMesh ref={stones} args={[stone, stoneMaterial, HEADSTONES.length - crossCount]} />
      <instancedMesh ref={crosses} args={[cross, crossMaterial, crossCount]} />
    </>
  );
}

const FENCE_Z = -9.6;
const FENCE_POSTS = 27;

function Fence() {
  const posts = useRef<THREE.InstancedMesh>(null);
  const { post, rail, material } = useMemo(
    () => ({
      post: fencePostGeometry(),
      rail: new THREE.BoxGeometry((FENCE_POSTS - 1) * 0.5 + 0.1, 0.05, 0.04),
      material: new THREE.MeshStandardMaterial({ color: "#0a0810", roughness: 0.8, metalness: 0.4 }),
    }),
    [],
  );
  useEffect(
    () => () => {
      post.dispose();
      rail.dispose();
      material.dispose();
    },
    [post, rail, material],
  );
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    const rand = seeded(13);
    for (let i = 0; i < FENCE_POSTS; i++) {
      dummy.position.set((i - (FENCE_POSTS - 1) / 2) * 0.5, 0, FENCE_Z);
      dummy.rotation.set(0, 0, (rand() - 0.5) * 0.12);
      dummy.updateMatrix();
      posts.current?.setMatrixAt(i, dummy.matrix);
    }
    if (posts.current) posts.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <>
      <instancedMesh ref={posts} args={[post, material, FENCE_POSTS]} />
      <mesh geometry={rail} material={material} position={[0, 0.42, FENCE_Z]} />
      <mesh geometry={rail} material={material} position={[0, 0.88, FENCE_Z]} />
    </>
  );
}

/** Candles left on three graves: a stub of wax and a flickering flame (bright enough for bloom). */
function Candles({ visual }: { visual: Visual }) {
  const flames = useRef<THREE.Group>(null);
  const spots = useMemo(() => [HEADSTONES[0], HEADSTONES[1], HEADSTONES[3]].map((h) => ({ x: h.x + 0.22 * h.scale, z: h.z + 0.25, s: h.scale })), []);
  const { wax, waxMaterial, flameMaterial } = useMemo(
    () => ({
      wax: new THREE.CylinderGeometry(0.04, 0.045, 0.16, 8),
      waxMaterial: new THREE.MeshStandardMaterial({ color: "#e8dcc8", roughness: 0.7, emissive: "#ff9a3c", emissiveIntensity: 0.25 }),
      flameMaterial: new THREE.SpriteMaterial({
        map: softDot(),
        color: new THREE.Color(2.2, 1.3, 0.5),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    }),
    [],
  );
  useEffect(
    () => () => {
      wax.dispose();
      waxMaterial.dispose();
      flameMaterial.dispose();
    },
    [wax, waxMaterial, flameMaterial],
  );
  useFrame(() => {
    flames.current?.children.forEach((flame, i) => {
      const flicker = 0.8 + 0.2 * Math.sin(visual.time * 17 + i * 2.1) * Math.sin(visual.time * 7.3 + i);
      flame.scale.set(0.13 * flicker, 0.24 * flicker, 1);
    });
  });
  return (
    <>
      {spots.map((p, i) => (
        <mesh key={i} geometry={wax} material={waxMaterial} position={[p.x, 0.08, p.z]} />
      ))}
      <group ref={flames}>
        {spots.map((p, i) => (
          <sprite key={i} material={flameMaterial} position={[p.x, 0.24, p.z]} />
        ))}
      </group>
    </>
  );
}

const TREES: { x: number; z: number; scale: number; rotY: number; seed: number }[] = [
  { x: -5.6, z: -7.5, scale: 2.6, rotY: 0.4, seed: 101 },
  { x: 5.4, z: -9.0, scale: 3.0, rotY: 2.1, seed: 202 },
  { x: -3.0, z: -13.5, scale: 2.4, rotY: 1.2, seed: 303 },
  { x: 7.2, z: -13.0, scale: 2.8, rotY: 3.6, seed: 404 },
];

function DeadTrees() {
  const { geometries, material } = useMemo(
    () => ({
      geometries: TREES.map((t) => deadTreeGeometry(t.seed)),
      material: new THREE.MeshStandardMaterial({ color: "#0c0912", roughness: 1, fog: false }),
    }),
    [],
  );
  useEffect(
    () => () => {
      geometries.forEach((g) => g.dispose());
      material.dispose();
    },
    [geometries, material],
  );
  return (
    <>
      {TREES.map((t, i) => (
        <mesh key={i} geometry={geometries[i]} material={material} position={[t.x, 0, t.z]} rotation={[0, t.rotY, 0]} scale={t.scale} />
      ))}
    </>
  );
}

const HOUSE = { x: -7.2, z: -17, scale: 1.25 };
const WINDOWS: [number, number, number, number][] = [
  [0.75, 1.25, 0.32, 0.45],
  [2.45, 1.25, 0.32, 0.45],
  [4.0, 2.65, 0.24, 0.42],
];

/** A haunted house on the hill: a black silhouette with firelit windows that flicker. */
function HauntedHouse({ visual }: { visual: Visual }) {
  const windows = useRef<THREE.Group>(null);
  const { house, houseMaterial, windowMaterial } = useMemo(
    () => ({
      house: houseGeometry(),
      houseMaterial: new THREE.MeshBasicMaterial({ color: "#07040d", fog: false }),
      windowMaterial: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 0.9, 0.3), toneMapped: false, transparent: true }),
    }),
    [],
  );
  useEffect(
    () => () => {
      house.dispose();
      houseMaterial.dispose();
      windowMaterial.dispose();
    },
    [house, houseMaterial, windowMaterial],
  );
  useFrame(() => {
    const t = visual.time;
    windowMaterial.opacity = 0.75 + 0.25 * Math.sin(t * 9.1) * Math.sin(t * 3.7) * Math.sin(t * 13.3);
  });
  return (
    <group position={[HOUSE.x, 0, HOUSE.z]} scale={HOUSE.scale}>
      <mesh geometry={house} material={houseMaterial} />
      <group ref={windows} position={[0, 0, 0.02]}>
        {WINDOWS.map(([x, y, w, h], i) => (
          <mesh key={i} material={windowMaterial} position={[x, y, 0]}>
            <planeGeometry args={[w, h]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

const GROUND_PUMPKINS: [number, number, number][] = [
  // x, z, scale. None in front of the cup, where the player looks.
  [-2.1, -1.6, 0.46],
  [1.9, -2.0, 0.42],
  [-2.6, 0.4, 0.38],
  [2.5, 0.2, 0.34],
  [-1.2, -3.2, 0.32],
  [3.4, -3.5, 0.5],
  [-3.6, -3.0, 0.44],
  [0.8, -4.6, 0.36],
  [-4.8, -6.2, 0.5],
  [4.6, -7.0, 0.48],
  [-2.2, -7.6, 0.4],
  [2.2, -9.2, 0.44],
];
const FLOATING_PUMPKINS = [
  { position: [1.9, 3.6, -3.2] as const, scale: 0.34, phase: 2 },
  { position: [-2.3, 4.3, -4.6] as const, scale: 0.3, phase: 4 },
];
const LIT_PUMPKINS = [0, 1, 5];

/** Jack-o'-lanterns: a dozen on the ground (instanced), two drifting in the air, the nearest casting orange light. */
function Pumpkins({ visual, reducedMotion, groundCount }: { visual: Visual; reducedMotion: boolean; groundCount: number }) {
  const ground = useRef<THREE.InstancedMesh>(null);
  const stems = useRef<THREE.InstancedMesh>(null);
  const floating = useRef<THREE.Group>(null);
  const lights = useRef<THREE.Group>(null);
  const { body, stem, bodyMaterial, stemMaterial } = useMemo(() => {
    const g = pumpkinGeometry();
    return {
      ...g,
      bodyMaterial: new THREE.MeshStandardMaterial({
        map: pumpkinSkin(),
        emissiveMap: pumpkinGlow(),
        emissive: "#ffb347",
        emissiveIntensity: 2.2,
        roughness: 0.65,
      }),
      stemMaterial: new THREE.MeshStandardMaterial({ color: "#2f4a16", roughness: 0.85 }),
    };
  }, []);
  useEffect(
    () => () => {
      body.dispose();
      stem.dispose();
      bodyMaterial.dispose();
      stemMaterial.dispose();
    },
    [body, stem, bodyMaterial, stemMaterial],
  );

  const placed = useMemo(() => GROUND_PUMPKINS.slice(0, groundCount), [groundCount]);

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    const rand = seeded(29);
    placed.forEach(([x, z, s], i) => {
      // the face (local +z) turns toward the camera, give or take
      const toCamera = Math.atan2(-x, 9 - z) + (rand() - 0.5) * 0.6;
      dummy.position.set(x, s * 0.8, z);
      dummy.rotation.set((rand() - 0.5) * 0.15, toCamera, (rand() - 0.5) * 0.15);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      ground.current?.setMatrixAt(i, dummy.matrix);
      stems.current?.setMatrixAt(i, dummy.matrix);
    });
    if (ground.current) ground.current.instanceMatrix.needsUpdate = true;
    if (stems.current) stems.current.instanceMatrix.needsUpdate = true;
  }, [placed]);

  useFrame(() => {
    const t = visual.time;
    const motion = reducedMotion ? 0.25 : 1;
    // candles gutter
    bodyMaterial.emissiveIntensity = 2.0 + Math.sin(t * 13) * 0.3 + Math.sin(t * 31) * 0.2 + visual.warm * 0.5;
    floating.current?.children.forEach((g, i) => {
      const p = FLOATING_PUMPKINS[i];
      g.position.y = p.position[1] + Math.sin(t * 0.9 * motion + p.phase) * 0.18;
      g.rotation.y = Math.sin(t * 0.4 * motion + p.phase) * 0.5;
    });
    lights.current?.children.forEach((l, i) => {
      (l as THREE.PointLight).intensity = (3.2 + Math.sin(t * 11 + i * 2) * 0.8 + Math.sin(t * 27 + i) * 0.4) * (1 - visual.warm * 0.5);
    });
  });

  return (
    <>
      <instancedMesh ref={ground} args={[body, bodyMaterial, placed.length]} />
      <instancedMesh ref={stems} args={[stem, stemMaterial, placed.length]} />
      <group ref={floating}>
        {FLOATING_PUMPKINS.map((p, i) => (
          <group key={i} position={[p.position[0], p.position[1], p.position[2]]} scale={p.scale}>
            <mesh geometry={body} material={bodyMaterial} />
            <mesh geometry={stem} material={stemMaterial} />
          </group>
        ))}
      </group>
      <group ref={lights}>
        {LIT_PUMPKINS.filter((i) => i < placed.length).map((i) => {
          const [x, z, s] = placed[i];
          return <pointLight key={i} position={[x, s * 0.9 + 0.1, z + 0.3]} color={colors.pumpkin} intensity={3} distance={4} decay={2} />;
        })}
      </group>
    </>
  );
}
