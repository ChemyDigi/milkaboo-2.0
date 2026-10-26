import * as THREE from "three";
import { gameConfig } from "@/lib/gameConfig";

const { cup, colors } = gameConfig;

/**
 * Uniforms shared by the ghost and every cup material. Updated once per frame by the Director (Scene.tsx);
 * because the same uniform objects are referenced everywhere, one write reaches every shader.
 */
export function createCurseUniforms() {
  return {
    uTime: { value: 0 },
    /** cup surface above this height is free (cup space) */
    uRevealY: { value: 10 },
    /** size of the patch still covering the logo, in logo half-sizes */
    uPatch: { value: 1.35 },
    /** logo centre and half-size on the cup surface: (angle, y, halfWidth, halfHeight) */
    uLogo: { value: new THREE.Vector4(cup.logoAngle, cup.logoY, cup.logoHalfWidth, cup.logoHalfHeight) },
    uWorldToCup: { value: new THREE.Matrix4() },
    uCupToWorld: { value: new THREE.Matrix4() },
    /** 0–1 lamp flicker on the cursed parts */
    uFlicker: { value: 0 },
    /** 0–1 the warm glow of the win reveal */
    uWarm: { value: 0 },
    /** logo glint position for the win (−1 = off) */
    uShine: { value: -1 },
    /** 0–1 lightning flash (written by Atmosphere, read by the ghost and the sky) */
    uFlash: { value: 0 },
    /** 0–1 the glowing seam where the ghost is letting go (written by Ghost) */
    uEdge: { value: 0 },
    /** 0–1 the ghost is fighting back: the seam turns red (written by Ghost) */
    uGrip: { value: 0 },
    uHaunt: { value: new THREE.Color(colors.ghostGlow) },
    uSeam: { value: new THREE.Color(colors.rim) },
    uSeamGrip: { value: new THREE.Color(colors.grip) },
  };
}

export type CurseUniforms = ReturnType<typeof createCurseUniforms>;

/**
 * Signed coverage in cup space: > 0 where the ghost still covers the cup, < 0 where it has let go.
 * Two parts: a sweep from the top down (revealY), and the patch clinging over the logo.
 */
export const coverageGLSL = /* glsl */ `
uniform float uTime;
uniform float uRevealY;
uniform float uPatch;
uniform vec4 uLogo;

float cvHash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float cvNoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(cvHash(i), cvHash(i + vec3(1, 0, 0)), f.x), mix(cvHash(i + vec3(0, 1, 0)), cvHash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(cvHash(i + vec3(0, 0, 1)), cvHash(i + vec3(1, 0, 1)), f.x), mix(cvHash(i + vec3(0, 1, 1)), cvHash(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}
/* position on the cup surface relative to the logo centre, in logo half-sizes */
vec2 logoSpace(vec3 p) {
  float r = max(length(p.xz), 0.3);
  float a = atan(p.x, p.z) - uLogo.x;
  a = atan(sin(a), cos(a));
  return vec2(a * r / uLogo.z, (p.y - uLogo.y) / uLogo.w);
}
float ghostCover(vec3 p) {
  float n = cvNoise(p * 3.5 + vec3(0.0, uTime * 0.3, 0.0)) - 0.5;
  float sweep = uRevealY - p.y + n * 0.35;
  float cling = (uPatch - length(logoSpace(p))) * 0.4 + n * 0.12;
  return max(sweep, cling);
}
`;

/**
 * Makes a cup material "haunted" wherever the ghost covers it: a pale ghostly sheen, with her pink glow swirling
 * through it and a stuttering light, and in its real colours where it's free. A glowing seam marks where
 * she's letting go. Works on any built-in material, so it also works on the real GLB's materials.
 * `shine` adds the glint that sweeps across the logo in the win reveal (needs a `map`).
 */
export function applyCurse<T extends THREE.Material>(material: T, uniforms: CurseUniforms, shine = false): T {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vCurseWorld;")
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>
        vec4 curseLocal = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          curseLocal = instanceMatrix * curseLocal;
        #endif
        vCurseWorld = (modelMatrix * curseLocal).xyz;`,
      );
    let fragment = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vCurseWorld;
        uniform mat4 uWorldToCup;
        uniform float uFlicker;
        uniform float uWarm;
        uniform float uShine;
        uniform float uEdge;
        uniform float uGrip;
        uniform vec3 uHaunt;
        uniform vec3 uSeam;
        uniform vec3 uSeamGrip;
        ${coverageGLSL}`,
      )
      .replace(
        "#include <opaque_fragment>",
        `#include <opaque_fragment>
        vec3 cupP = (uWorldToCup * vec4(vCurseWorld, 1.0)).xyz;
        float cover = ghostCover(cupP);
        float cursed = smoothstep(-0.12, 0.05, cover);
        float lum = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));
        float swirl = cvNoise(cupP * 2.5 + vec3(0.0, uTime * 0.35, uTime * 0.2));
        vec3 milky = mix(gl_FragColor.rgb, vec3(lum) * vec3(0.92, 0.86, 1.0), 0.6);
        vec3 haunted = milky * (1.0 - 0.2 * uFlicker) + uHaunt * (0.06 + smoothstep(0.45, 0.85, swirl) * 0.25);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, haunted, cursed * 0.55);
        float seam = (1.0 - smoothstep(0.0, 0.07, abs(cover))) * uEdge;
        gl_FragColor.rgb += mix(uSeam, uSeamGrip, uGrip) * seam * 1.4;
        gl_FragColor.rgb *= 1.0 + uWarm * 0.2;`,
      );
    if (shine) {
      fragment = fragment.replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        #ifdef USE_MAP
          float glint = 1.0 - smoothstep(0.0, 0.1, abs(vMapUv.x * 0.8 + vMapUv.y * 0.45 - uShine));
          totalEmissiveRadiance += vec3(1.0, 0.95, 0.85) * glint * diffuseColor.a * 3.0;
        #endif`,
      );
    }
    shader.fragmentShader = fragment;
  };
  material.customProgramCacheKey = () => (shine ? "milkaboo-curse-shine" : "milkaboo-curse");
  return material;
}
