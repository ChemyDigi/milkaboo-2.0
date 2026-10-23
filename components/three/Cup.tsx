"use client";

import { Suspense, useMemo, type ReactNode, type Ref } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { gameConfig } from "@/lib/gameConfig";
import type { DeviceTier } from "@/hooks/useDeviceTier";
import { applyCurse, type CurseUniforms } from "./curse";
import PlaceholderCup from "./PlaceholderCup";
import type { Visual } from "./sceneState";

const { cup } = gameConfig;
// the model is big: start downloading it as soon as the game loads
if (cup.useModel) useGLTF.preload(cup.modelUrl);

/**
 * The real cup model (`cup.modelUrl`), scaled to `cup.height` and stood on `cup.bottom`.
 * Every material gets the curse; a material whose name contains "logo" also gets the win glint.
 */
function ModelCup({ curse }: { curse: CurseUniforms }) {
  const { scene } = useGLTF(cup.modelUrl);
  const model = useMemo(() => {
    const root = scene.clone(true);
    root.rotation.y = cup.modelRotationY;
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const scale = cup.height / Math.max(size.y, 1e-6);
    root.scale.setScalar(scale);
    const center = box.getCenter(new THREE.Vector3());
    root.position.set(-center.x * scale, cup.bottom - box.min.y * scale, -center.z * scale);
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const curseOne = (m: THREE.Material) => applyCurse(m.clone(), curse, /logo/i.test(m.name));
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(curseOne) : curseOne(mesh.material);
    });
    return root;
  }, [scene, curse]);
  return <primitive object={model} />;
}

interface Props {
  ref?: Ref<THREE.Group>;
  curse: CurseUniforms;
  visual: Visual;
  tier: DeviceTier;
  /** the ghost, authored in cup space */
  children?: ReactNode;
}

/** The cup group. Its world matrix defines "cup space" for the ghost and the curse shaders. */
export default function Cup({ ref, curse, visual, tier, children }: Props) {
  return (
    <group ref={ref}>
      <Suspense fallback={null}>
        {cup.useModel ? <ModelCup curse={curse} /> : <PlaceholderCup curse={curse} visual={visual} tier={tier} />}
      </Suspense>
      {children}
    </group>
  );
}
