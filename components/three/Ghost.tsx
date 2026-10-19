"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { gameConfig } from "@/lib/gameConfig";
import { damp } from "@/lib/breath";
import { revealShape } from "@/lib/reveal";
import type { CurseUniforms } from "./curse";
import { cupRadius, ghostSheetGeometry } from "./cupShape";
import { createGhostUniforms, makeGhostMaterial } from "./ghostMaterial";
import type { SceneStateRef, Visual } from "./sceneState";

const { cup } = gameConfig;
const ARM_REACH = 2.3; // radians of cup the arm wraps from the back to the hand
const armRadiusAt = (y: number) => cupRadius(y) + 0.13;
const STRAIGHT = new THREE.Vector2();

/** One arm (the left one), from behind the cup round to a hand at angle 0. The right arm is its mirror image. */
function armGeometry() {
  const points: THREE.Vector3[] = [];
  for (let k = 0; k <= 8; k++) {
    const t = k / 8;
    const angle = -ARM_REACH * (1 - t);
    const y = cup.logoY + 0.42 * (1 - t) + 0.07 * Math.sin(k * 1.3);
    const r = armRadiusAt(y);
    points.push(new THREE.Vector3(Math.sin(angle) * r, y, Math.cos(angle) * r));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 48, 0.055, 8, false);
}

/** A clawed hand: a bony palm and four long fingers, each ending in a talon, reaching toward the logo (+x). */
function handGeometry() {
  const palm = new THREE.SphereGeometry(0.085, 12, 8);
  palm.scale(1.05, 0.8, 0.5);
  const parts: THREE.BufferGeometry[] = [palm];
  const spread = [-0.42, -0.14, 0.14, 0.42];
  spread.forEach((angle, i) => {
    const length = 0.13 + (i === 1 || i === 2 ? 0.04 : 0);
    const finger = new THREE.CapsuleGeometry(0.02, length, 3, 8);
    finger.rotateZ(-Math.PI / 2);
    finger.translate(length / 2 + 0.05, 0, 0);
    const talon = new THREE.ConeGeometry(0.02, 0.08, 7);
    talon.rotateZ(-Math.PI / 2);
    talon.translate(length + 0.09, 0, 0);
    [finger, talon].forEach((g) => {
      g.rotateZ(angle * 0.55);
      g.translate(0, angle * 0.06, 0.01);
      parts.push(g);
    });
  });
  const merged = mergeGeometries(parts.map((g) => g.toNonIndexed()));
  parts.forEach((g) => g.dispose());
  return merged ?? palm;
}

interface Props {
  curse: CurseUniforms;
  visual: Visual;
  state: SceneStateRef;
  reducedMotion: boolean;
}

/** The ghost wrapped around the cup. Lives inside the cup group, so its geometry is in cup space. */
export default function Ghost({ curse, visual, state, reducedMotion }: Props) {
  const root = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const anim = useRef({
    blinkNext: 2,
    blinkUntil: 0,
    twitchNext: 1.5,
    tiltTarget: 0,
    tiltNext: 2,
    lookTarget: new THREE.Vector2(),
    lookNext: 1,
    lungeNext: 4,
    wasGripping: false,
  });
  const camInCup = useMemo(() => new THREE.Vector3(), []);

  const ghost = useMemo(() => createGhostUniforms(), []);
  const parts = useMemo(() => {
    const handY = cup.logoY;
    const handR = armRadiusAt(handY);
    return {
      sheet: ghostSheetGeometry(),
      arm: armGeometry(),
      hand: handGeometry(),
      handPosition: new THREE.Vector3(0, handY, handR),
      bodyMaterial: makeGhostMaterial(curse, ghost, { face: true }),
      armMaterial: makeGhostMaterial(curse, ghost, { isArm: true }),
      handMaterial: makeGhostMaterial(curse, ghost, { isArm: true }),
    };
  }, [curse, ghost]);

  useEffect(
    () => () => {
      [parts.sheet, parts.arm, parts.hand].forEach((g) => g.dispose());
      [parts.bodyMaterial, parts.armMaterial, parts.handMaterial].forEach((m) => m.dispose());
    },
    [parts],
  );

  useFrame(({ camera }, dt) => {
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
    u.uEdge.value = THREE.MathUtils.smoothstep(visual.progress, gameConfig.stages.stretchEnd - 0.04, gameConfig.stages.stretchEnd + 0.02);

    // the player's mouth, just in front of the camera, in cup space
    camInCup.copy(camera.position).applyMatrix4(curse.uWorldToCup.value);
    u.uMouth.value.set(0, 0.5, 0).lerp(camInCup, 0.82);

    // the eyes go out for an instant every few seconds
    if (t > an.blinkNext) {
      an.blinkUntil = t + 0.12;
      an.blinkNext = t + 2.2 + Math.random() * 3;
    }
    u.uBlink.value = damp(u.uBlink.value, t < an.blinkUntil ? 0 : 1, 45, dt);

    // nervous spasms
    if (t > an.twitchNext) {
      u.uTwitch.value = motion;
      an.twitchNext = t + 1.2 + Math.random() * 3;
    }
    u.uTwitch.value *= Math.exp(-dt * 10);

    // the hood tilts as it sizes you up; it shakes when it fights back
    if (t > an.tiltNext) {
      an.tiltTarget = (Math.random() - 0.5) * 0.5;
      an.tiltNext = t + 1.5 + Math.random() * 3;
    }
    u.uTilt.value = damp(u.uTilt.value, an.tiltTarget + visual.grip * 0.12 * Math.sin(t * 30) * motion, 4, dt);

    // the eyes roam, then lock onto the player when it matters
    if (t > an.lookNext) {
      an.lookTarget.set((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 1.4);
      an.lookNext = t + 0.8 + Math.random() * 2.2;
    }
    const staring = (s.mode === "playing" && (visual.grip > 0.5 || visual.suck > 0.3)) || s.mode === "lost";
    u.uLook.value.lerp(staring ? STRAIGHT : an.lookTarget, 1 - Math.exp(-dt * (staring ? 20 : 6)));

    // it lunges at you: on the intro taunt, when it grabs the cup tighter, and shaking with laughter when you lose
    const gripping = visual.grip > 0.5;
    if ((gripping && !an.wasGripping) || (s.mode === "intro" && t > an.lungeNext)) {
      u.uLunge.value = motion;
      an.lungeNext = t + 5 + Math.random() * 5;
    }
    an.wasGripping = gripping;
    u.uLunge.value =
      s.mode === "lost"
        ? damp(u.uLunge.value, (0.3 + 0.2 * Math.sin(visual.loseT * 19)) * motion, 10, dt)
        : u.uLunge.value * Math.exp(-dt * 5);

    // the mouth: taunts on the intro, screams as it's pulled, laughs when you lose
    let mouth = 0.15;
    let eyes = 1;
    if (s.mode === "intro") mouth = t % 5 < 1.1 ? 0.5 + 0.5 * Math.sin(t * 14) : 0.15;
    else if (s.mode === "calibrating") {
      mouth = 0.25;
      eyes = 1.5;
    } else if (s.mode === "playing") {
      mouth = 0.25 + visual.suck * 0.5 + visual.grip * 0.5;
      eyes = 1 + visual.grip * 1.3 + visual.suck * 0.3;
    } else if (s.mode === "lost") {
      mouth = visual.loseT < 2.4 ? 0.5 + 0.5 * Math.sin(visual.loseT * 19) : 0.35;
      eyes = 3;
    }
    u.uMouthOpen.value = damp(u.uMouthOpen.value, mouth, 18, dt);
    u.uEyeGlow.value = damp(u.uEyeGlow.value, eyes, 6, dt);

    // arms slide round toward the logo; the claws keep hold of its edges, trembling as it loses grip
    const cling = THREE.MathUtils.clamp((visual.progress - gameConfig.stages.logoOnly) / (1 - gameConfig.stages.logoOnly), 0, 1);
    const handAngle = (cup.logoHalfWidth * Math.max(shape.patch, 0.75) * 1.05) / armRadiusAt(cup.logoY);
    const tremble = Math.sin(t * 42) * 0.012 * (cling + visual.grip) * motion;
    if (armL.current) armL.current.rotation.y = -handAngle + tremble;
    if (armR.current) armR.current.rotation.y = -handAngle - tremble;
    parts.armMaterial.uniforms.uArmCut.value = 1 - shape.arm;

    if (root.current) root.current.visible = visual.exit < 0.999;
  });

  const arm = (
    <>
      <mesh geometry={parts.arm} material={parts.armMaterial} renderOrder={3} />
      <mesh geometry={parts.hand} material={parts.handMaterial} position={parts.handPosition} renderOrder={4} />
    </>
  );

  return (
    <group ref={root}>
      <mesh geometry={parts.sheet} material={parts.bodyMaterial} renderOrder={2} />
      <group ref={armL}>{arm}</group>
      {/* mirrored: the same arm wrapping round the other side */}
      <group scale={[-1, 1, 1]}>
        <group ref={armR}>{arm}</group>
      </group>
    </group>
  );
}
