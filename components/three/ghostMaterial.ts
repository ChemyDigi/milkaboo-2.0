import * as THREE from "three";
import { gameConfig } from "@/lib/gameConfig";
import type { CurseUniforms } from "./curse";

const { colors } = gameConfig;

/** The ghost's animation uniforms (on top of the curse uniforms). */
export function createGhostUniforms() {
  return {
    /** 0–1 stage-one stretch toward the player */
    uStretch: { value: 0 },
    uSuck: { value: 0 },
    uGrip: { value: 0 },
    uExit: { value: 0 },
    /** nervous spasms, lunges at the player and a slow tilt of the head */
    uTwitch: { value: 0 },
    uLunge: { value: 0 },
    uTilt: { value: 0 },
    /** 0–1 how far her body has been pulled up off the cup (stages two and three) */
    uLift: { value: 0 },
    /** 0–1 she bounces with laughter when you lose */
    uLaugh: { value: 0 },
    uGripColor: { value: new THREE.Color(colors.grip) },
  };
}

export type GhostUniforms = ReturnType<typeof createGhostUniforms>;

const spriteVertexShader = /* glsl */ `
uniform float uTime;
uniform float uStretch;
uniform float uSuck;
uniform float uGrip;
uniform float uExit;
uniform float uTwitch;
uniform float uLunge;
uniform float uTilt;
uniform float uLift;
uniform float uLaugh;
uniform vec3 uCenter;
uniform vec2 uHead;

varying vec2 vUv;

void main() {
  vUv = uv;
  vec2 c = position.xy;
  float t = uTime;
  float tail = 1.0 - uv.y;

  // floating: a slow bob, and the wisps of her tail drifting more the further down they are
  c.y += sin(t * 1.1) * 0.05;
  c.x += sin(uv.y * 7.0 + t * 1.7) * 0.06 * tail * tail + sin(uv.y * 3.0 + t * 0.9) * 0.02;
  c.y += sin(uv.x * 6.0 + t * 1.3) * 0.03 * tail;

  // her head tilts, sizing you up
  vec2 h = c - uHead;
  float ct = cos(uTilt * 0.6);
  float st = sin(uTilt * 0.6);
  c = uHead + vec2(ct * h.x - st * h.y, st * h.x + ct * h.y);

  // pulled toward the player: she stretches up and thins like taffy, the upper body first
  float pull = uStretch * (0.35 + 0.65 * uSuck);
  c.y += pull * 0.22 * uv.y;
  c.x *= 1.0 - pull * 0.1 * uv.y;
  c += vec2(sin(t * 47.0 + uv.y * 9.0), cos(t * 39.0 + uv.x * 7.0)) * 0.012 * uSuck;

  // fights back: clamps down on the cup and shudders
  c.y -= uGrip * 0.14;
  c.x += uGrip * sin(t * 55.0 + uv.y * 12.0) * 0.035;
  // nervous spasms
  c.x += uTwitch * sin(uv.y * 23.0 + t * 70.0) * 0.03;
  // shakes with laughter when you lose
  c.y += uLaugh * abs(sin(t * 19.0)) * 0.12;

  vec3 p = uCenter + vec3(c, 0.0);
  // lunges at you, and rises off the cup as it's freed
  p += vec3(0.0, 0.1, 0.55) * uLunge;
  p += vec3(0.0, 0.35, 0.3) * uLift + vec3(0.0, 0.0, 0.45) * pull * uv.y;

  // the win: she spins and is sucked into the camera
  float e = uExit * uExit;
  vec2 d = p.xy - vec2(0.0, uCenter.y);
  float spin = e * 5.0 * (1.2 - uv.y * 0.6);
  d = vec2(cos(spin) * d.x - sin(spin) * d.y, sin(spin) * d.x + cos(spin) * d.y) * (1.0 - e * 0.7);
  p.xy = vec2(0.0, uCenter.y) + d;
  p.z += e * 7.0;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

const spriteFragmentShader = /* glsl */ `
uniform sampler2D uMap;
uniform float uTime;
uniform float uSuck;
uniform float uGrip;
uniform float uExit;
uniform float uFlash;
uniform vec3 uGripColor;

varying vec2 vUv;

void main() {
  vec4 tex = texture2D(uMap, vUv);
  vec3 col = tex.rgb;
  // she shimmers, glows brighter as she's pulled, and flushes red when she fights back
  col *= 1.0 + sin(uTime * 2.3) * 0.04 + uSuck * 0.2;
  col = mix(col, col * uGripColor * 1.7, uGrip * 0.5);
  col += vec3(0.55, 0.6, 0.9) * uFlash * 0.35;
  // a little see-through, like any self-respecting ghost
  float alpha = tex.a * 0.95 * (1.0 - uExit);
  gl_FragColor = vec4(col, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/**
 * The ghost herself: her portrait on a subdivided plane in cup space, animated in the vertex shader
 * (drifting wisps, stretching toward the player, shuddering, laughing, spinning into the camera).
 */
export function makeGhostSpriteMaterial(
  curse: CurseUniforms,
  ghost: GhostUniforms,
  map: THREE.Texture,
  center: THREE.Vector3,
  head: THREE.Vector2,
) {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...curse,
      ...ghost,
      uMap: { value: map },
      uCenter: { value: center },
      uHead: { value: head },
    },
    vertexShader: spriteVertexShader,
    fragmentShader: spriteFragmentShader,
    transparent: true,
    depthWrite: false,
  });
}
