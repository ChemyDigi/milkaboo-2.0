"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { gameConfig } from "@/lib/gameConfig";
import type { DeviceTier } from "@/hooks/useDeviceTier";
import { applyCurse, type CurseUniforms } from "./curse";
import { CUP, cupRadius } from "./cupShape";
import type { Visual } from "./sceneState";
import { condensationBump, condensationRoughness } from "./textures";

const { colors, cup } = gameConfig;
const PEARL_RADIUS = 0.085;
const PILE_COUNT = 26;
const WALL_COUNT = 20;

/**
 * Pearls as in the photo: a pile at the bottom, plus pearls pressed against the wall at different heights,
 * poking just out of the tea so they show through the clear plastic as dark circles.
 */
function pearlPositions(): THREE.Vector3[] {
  const out: THREE.Vector3[] = [];
  let seed = 3;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; out.length < PILE_COUNT && i < 500; i++) {
    const layer = Math.floor(out.length / 11);
    const y = CUP.bottom + 0.11 + layer * 0.15 + rand() * 0.04;
    const r = Math.sqrt(rand()) * (cupRadius(y) - 0.13);
    const a = rand() * Math.PI * 2;
    const p = new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r);
    if (out.every((q) => q.distanceTo(p) > PEARL_RADIUS * 1.9)) out.push(p);
  }
  for (let i = 0; out.length < PILE_COUNT + WALL_COUNT && i < 500; i++) {
    const y = CUP.bottom + 0.45 + rand() * (CUP.teaTop - CUP.bottom - 0.75);
    const a = rand() * Math.PI * 2;
    const r = cupRadius(y) - CUP.wallGap - PEARL_RADIUS * 0.7;
    const p = new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r);
    if (out.every((q) => q.distanceTo(p) > PEARL_RADIUS * 2.2)) out.push(p);
  }
  return out;
}

interface Props {
  curse: CurseUniforms;
  visual: Visual;
  tier: DeviceTier;
}

/**
 * Stand-in for /public/models/milkaboo-cup.glb, built to match the product photo: a tall tapered clear cup
 * beaded with condensation, taro-purple milk tea filled nearly to the top, boba pearls, a flat clear lid
 * with the logo printed on it, and the logo on the front.
 */
export default function PlaceholderCup({ curse, visual, tier }: Props) {
  const logo = useTexture("/images/logo.png");
  const pearls = useRef<THREE.InstancedMesh>(null);
  const pearlHome = useMemo(() => pearlPositions(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const geometry = useMemo(() => {
    const lip = 0.035;
    const body = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0, CUP.bottom),
        new THREE.Vector2(CUP.radiusBottom - 0.05, CUP.bottom),
        new THREE.Vector2(CUP.radiusBottom, CUP.bottom + 0.06),
        new THREE.Vector2(CUP.radiusTop, CUP.rim - 0.02),
        new THREE.Vector2(CUP.radiusTop + lip, CUP.rim),
        new THREE.Vector2(CUP.radiusTop + lip, CUP.rim + 0.05),
      ],
      64,
    );
    const inset = CUP.wallGap;
    const tea = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0, CUP.bottom + 0.04),
        new THREE.Vector2(cupRadius(CUP.bottom) - inset, CUP.bottom + 0.04),
        new THREE.Vector2(cupRadius(CUP.teaTop) - inset, CUP.teaTop),
        new THREE.Vector2(cupRadius(CUP.teaTop) - inset - 0.04, CUP.teaTop + 0.012),
        new THREE.Vector2(0, CUP.teaTop + 0.012),
      ],
      48,
    );
    const lid = new THREE.CylinderGeometry(CUP.lidRadius, CUP.lidRadius, CUP.lidThickness, 64);
    lid.translate(0, CUP.rim + CUP.lidThickness / 2, 0);
    const lidRing = new THREE.TorusGeometry(CUP.lidRadius - 0.12, 0.03, 10, 64);
    lidRing.rotateX(Math.PI / 2);
    lidRing.translate(0, CUP.rim + CUP.lidThickness, 0);
    const lidLogo = new THREE.PlaneGeometry(0.5, 0.78);
    lidLogo.rotateX(-Math.PI / 2);
    lidLogo.translate(0.02, CUP.rim + CUP.lidThickness + 0.004, 0.02);
    const pearl = new THREE.SphereGeometry(PEARL_RADIUS, 12, 8);

    // the front logo: a strip of the cup wall, so it wraps with the taper
    const yTop = cup.logoY + cup.logoHalfHeight;
    const yBottom = cup.logoY - cup.logoHalfHeight;
    const span = (cup.logoHalfWidth * 2) / cupRadius(cup.logoY);
    const logoStrip = new THREE.CylinderGeometry(
      cupRadius(yTop) + 0.006,
      cupRadius(yBottom) + 0.006,
      yTop - yBottom,
      24,
      1,
      true,
      cup.logoAngle - span / 2,
      span,
    );
    logoStrip.translate(0, cup.logoY, 0);
    return { body, tea, lid, lidRing, lidLogo, pearl, logoStrip };
  }, []);

  const materials = useMemo(() => {
    const transmissive = tier !== "low";
    const bump = condensationBump();
    const rough = condensationRoughness();
    bump.repeat.set(3, 1.6);
    rough.repeat.set(3, 1.6);
    const plastic = (roughness: number, side: THREE.Side, dewy: boolean) =>
      applyCurse(
        new THREE.MeshPhysicalMaterial({
          color: "#ffffff",
          roughness,
          roughnessMap: dewy ? rough : null,
          bumpMap: dewy ? bump : null,
          bumpScale: 0.045,
          metalness: 0,
          ior: 1.45,
          thickness: 0.1,
          transmission: transmissive ? 1 : 0,
          transparent: !transmissive,
          opacity: transmissive ? 1 : 0.3,
          clearcoat: 1,
          clearcoatRoughness: 0.08,
          side,
        }),
        curse,
      );
    const logoMaterial = (emissive: number, opacity: number) =>
      applyCurse(
        new THREE.MeshStandardMaterial({
          map: logo,
          emissiveMap: logo,
          emissive: "#ffffff",
          emissiveIntensity: emissive,
          transparent: true,
          opacity,
          alphaTest: 0.05,
          roughness: 0.55,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -2,
        }),
        curse,
        true,
      );
    return {
      body: plastic(0.5, THREE.DoubleSide, true),
      // front faces only: double-sided transmission samples the dark night through the lid's inside
      lid: plastic(0.3, THREE.FrontSide, false),
      tea: applyCurse(
        new THREE.MeshPhysicalMaterial({
          color: colors.taro,
          roughness: 0.42,
          clearcoat: 0.3,
          clearcoatRoughness: 0.4,
          sheen: 0.15,
          sheenColor: "#c9a6ff",
        }),
        curse,
      ),
      pearl: applyCurse(
        new THREE.MeshPhysicalMaterial({ color: colors.pearl, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05 }),
        curse,
      ),
      logo: logoMaterial(0.05, 1),
      lidLogo: logoMaterial(0, 0.8),
    };
  }, [curse, logo, tier]);

  useLayoutEffect(() => {
    logo.colorSpace = THREE.SRGBColorSpace;
    logo.anisotropy = 4;
    logo.needsUpdate = true;
  }, [logo]);

  useEffect(
    () => () => {
      Object.values(geometry).forEach((g) => g.dispose());
      Object.values(materials).forEach((m) => m.dispose());
    },
    [geometry, materials],
  );

  // pearls settle into place, then bounce for joy in the win reveal
  useFrame(() => {
    const mesh = pearls.current;
    if (!mesh) return;
    const bouncing = visual.winT > 0.6;
    if (!bouncing && mesh.userData.placed) return;
    const decay = bouncing ? Math.exp(-(visual.winT - 0.6) * 0.5) : 0;
    pearlHome.forEach((home, i) => {
      const hop = Math.abs(Math.sin(visual.time * 7 + i * 1.7)) * 0.09 * decay;
      dummy.position.set(home.x, home.y + hop, home.z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.userData.placed = true;
  });

  return (
    <group>
      <mesh geometry={geometry.tea} material={materials.tea} />
      <instancedMesh ref={pearls} args={[geometry.pearl, materials.pearl, pearlHome.length]} />
      <mesh geometry={geometry.body} material={materials.body} />
      <mesh geometry={geometry.lid} material={materials.lid} />
      <mesh geometry={geometry.lidRing} material={materials.lid} />
      <mesh geometry={geometry.lidLogo} material={materials.lidLogo} renderOrder={1} />
      <mesh geometry={geometry.logoStrip} material={materials.logo} renderOrder={1} />
    </group>
  );
}
