"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { gameConfig } from "@/lib/gameConfig";
import { damp } from "@/lib/breath";
import { revealShape } from "@/lib/reveal";
import type { CurseUniforms } from "./curse";
import { createGhostUniforms, makeGhostSpriteMaterial } from "./ghostMaterial";
import type { SceneStateRef, Visual } from "./sceneState";

const { cup, ghostSprite, stages } = gameConfig;
// start loading her portrait with the scene, not when she first appears
useTexture.preload(ghostSprite.url);

interface Props {
  curse: CurseUniforms;
  visual: Visual;
  state: SceneStateRef;
  reducedMotion: boolean;
}

/**
 * The ghost: her portrait draped over the front of the cup, head above the lid. Lives inside the cup group
 * (cup space). Where she still has hold of the cup is drawn on the cup itself (the curse in curse.ts).
 */
export default function Ghost({ curse, visual, state, reducedMotion }: Props) {
  const mesh = useRef<THREE.Mesh>(null);
  const anim = useRef({
    twitchNext: 1.5,
    tiltTarget: 0,
    tiltNext: 2,
    lungeNext: 4,
    wasGripping: false,
  });

  const map = useTexture(ghostSprite.url);
  const ghost = useMemo(() => createGhostUniforms(), []);
  const { geometry, material } = useMemo(() => {
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    const [width, height] = ghostSprite.size;
    const [faceX, faceY] = ghostSprite.face;
    // her face sits left of the image's centre: shift the picture so the face is over the cup
    const center = new THREE.Vector3(
      (0.5 - faceX) * width,
      cup.bottom + cup.height + ghostSprite.faceAboveLid - (faceY - 0.5) * height,
      ghostSprite.depth,
    );
    const head = new THREE.Vector2((faceX - 0.5) * width, (faceY - 0.5) * height);
    return {
      geometry: new THREE.PlaneGeometry(width, height, 40, 28),
      material: makeGhostSpriteMaterial(curse, ghost, map, center, head),
    };
  }, [map, curse, ghost]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((_, dt) => {
    const s = state.current;
    const t = visual.time;
    const shape = revealShape(visual.progress);
    const u = ghost;
    const an = anim.current;
    const motion = reducedMotion ? 0.3 : 1;

    u.uStretch.value = shape.stretch;
    u.uSuck.value = visual.suck;
    u.uGrip.value = visual.grip;
    u.uExit.value = visual.exit;
    // she rises off the cup as it peels, hanging on to the logo at the end
    u.uLift.value = THREE.MathUtils.smoothstep(visual.progress, stages.stretchEnd, 1) * motion;
    // the seam on the cup where she's letting go, red while she fights back
    curse.uEdge.value = THREE.MathUtils.smoothstep(visual.progress, stages.stretchEnd - 0.04, stages.stretchEnd + 0.02);
    curse.uGrip.value = visual.grip;

    // nervous spasms
    if (t > an.twitchNext) {
      u.uTwitch.value = motion;
      an.twitchNext = t + 1.2 + Math.random() * 3;
    }
    u.uTwitch.value *= Math.exp(-dt * 10);

    // the head tilts as she sizes you up; it shakes when she fights back
    if (t > an.tiltNext) {
      an.tiltTarget = (Math.random() - 0.5) * 0.5;
      an.tiltNext = t + 1.5 + Math.random() * 3;
    }
    u.uTilt.value = damp(u.uTilt.value, an.tiltTarget + visual.grip * 0.12 * Math.sin(t * 30) * motion, 4, dt);

    // she lunges at you: on the intro taunt and when she grabs the cup tighter
    const gripping = visual.grip > 0.5;
    if ((gripping && !an.wasGripping) || (s.mode === "intro" && t > an.lungeNext)) {
      u.uLunge.value = motion;
      an.lungeNext = t + 5 + Math.random() * 5;
    }
    an.wasGripping = gripping;
    u.uLunge.value *= Math.exp(-dt * 5);

    // and laughs at you when you lose
    u.uLaugh.value = damp(u.uLaugh.value, s.mode === "lost" ? (visual.loseT < 2.4 ? 1 : 0.25) * motion : 0, 10, dt);

    if (mesh.current) mesh.current.visible = visual.exit < 0.999;
  });

  return <mesh ref={mesh} geometry={geometry} material={material} renderOrder={5} frustumCulled={false} />;
}
