"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { gameConfig } from "@/lib/gameConfig";
import type { DeviceTier } from "@/hooks/useDeviceTier";
import { softDot } from "./textures";
import type { Visual } from "./sceneState";

const { colors } = gameConfig;

/**
 * The hero moment: a flash of light as the ghost lets go, a warm halo that stays behind the cup,
 * sparkles drifting up, and a warm key light. (The spin, the bouncing pearls and the logo glint live
 * with the cup; the clearing haze lives in Atmosphere.)
 */
export default function Reveal({ visual, tier }: { visual: Visual; tier: DeviceTier }) {
  const burst = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const [sparkles, setSparkles] = useState(false);

  const materials = useMemo(() => {
    const glow = (color: string) =>
      new THREE.MeshBasicMaterial({
        map: softDot(),
        color,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0,
        fog: false,
        toneMapped: false,
      });
    return { burst: glow("#fff4e0"), halo: glow(colors.warm) };
  }, []);
  useEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials]);

  useFrame(() => {
    const t = visual.winT;
    const on = t >= 0;
    if (on !== sparkles) setSparkles(on);

    // flash: expands and fades over ~1.2 s
    const flash = on ? Math.max(0, 1 - t / 1.2) : 0;
    if (burst.current) {
      const s = 1 + (on ? Math.min(t, 1.2) : 0) * 7;
      burst.current.scale.setScalar(s);
      burst.current.visible = flash > 0;
    }
    materials.burst.opacity = flash * 1.6;

    // halo: breathes in behind the cup and stays
    materials.halo.opacity = visual.warm * (0.55 + 0.08 * Math.sin(visual.time * 2));
    if (halo.current) halo.current.visible = visual.warm > 0.01;
    if (light.current) light.current.intensity = visual.warm * 10 + flash * 30;
  });

  return (
    <group>
      <Billboard position={[0, 0.5, -1.2]}>
        <mesh ref={halo} material={materials.halo} scale={6.5}>
          <planeGeometry />
        </mesh>
      </Billboard>
      <Billboard position={[0, 0.4, 0.8]}>
        <mesh ref={burst} material={materials.burst}>
          <planeGeometry />
        </mesh>
      </Billboard>
      <pointLight ref={light} position={[0.6, 1.2, 2.6]} color={colors.warm} intensity={0} distance={12} />
      {sparkles && (
        <Sparkles
          count={tier === "low" ? 28 : 70}
          scale={[3.2, 4.2, 2.4]}
          position={[0, 0.5, 0]}
          size={tier === "low" ? 3 : 4.5}
          speed={0.5}
          color={colors.warm}
          opacity={0.9}
        />
      )}
    </group>
  );
}
