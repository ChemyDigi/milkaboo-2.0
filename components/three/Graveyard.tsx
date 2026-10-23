"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { gameConfig } from "@/lib/gameConfig";
import type { DeviceTier } from "@/hooks/useDeviceTier";
import { pumpkinGlow, pumpkinSkin } from "./textures";
import type { Visual } from "./sceneState";

const { colors } = gameConfig;
/** the ground, in world space */
export const GROUND_Y = -1.5;

function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
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

/**
 * What stands around the cup in front of the painted backdrop (Atmosphere's Backdrop has the graveyard,
 * house, fence and moon): jack-o'-lanterns on the ground and in the air, and fireflies.
 */
export default function Graveyard({ visual, tier, reducedMotion }: Props) {
  const low = tier === "low";
  return (
    <group position={[0, GROUND_Y, 0]}>
      <Pumpkins visual={visual} reducedMotion={reducedMotion} groundCount={low ? 6 : 10} />
      {!low && (
        <Sparkles count={36} scale={[12, 2.4, 6]} position={[0, 1.2, -3]} size={2.2} speed={0.25} color="#ffb3d9" opacity={0.6} />
      )}
    </group>
  );
}

const GROUND_PUMPKINS: [number, number, number][] = [
  // x, z, scale. None in front of the cup, where the player looks; all near it, on the lit patch of ground.
  [-2.1, -1.6, 0.46],
  [1.9, -2.0, 0.42],
  [-2.6, 0.4, 0.38],
  [2.5, 0.2, 0.34],
  [-1.2, -3.2, 0.32],
  [3.4, -3.5, 0.5],
  [-3.6, -3.0, 0.44],
  [0.8, -4.6, 0.36],
  [-1.7, 1.3, 0.28],
  [1.6, 1.5, 0.3],
];
const FLOATING_PUMPKINS = [
  { position: [1.9, 3.6, -3.2] as const, scale: 0.34, phase: 2 },
  { position: [-2.3, 4.3, -4.6] as const, scale: 0.3, phase: 4 },
  { position: [-1.9, 2.3, -2.4] as const, scale: 0.24, phase: 1 },
  { position: [2.4, 1.4, -3.6] as const, scale: 0.28, phase: 5 },
];
const LIT_PUMPKINS = [0, 1, 5];

/** Jack-o'-lanterns: ten on the ground (instanced), four drifting in the air, the nearest casting orange light. */
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
