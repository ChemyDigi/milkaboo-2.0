import * as THREE from "three";
import { gameConfig } from "@/lib/gameConfig";
import { GHOST_BOTTOM, GHOST_TOP } from "@/lib/reveal";
import { coverageGLSL, type CurseUniforms } from "./curse";

const { colors } = gameConfig;

/** Uniforms every ghost part shares (on top of the curse uniforms). */
export function createGhostUniforms() {
  return {
    /** 0–1 stage-one stretch toward the player */
    uStretch: { value: 0 },
    uSuck: { value: 0 },
    uGrip: { value: 0 },
    uExit: { value: 0 },
    /** 0–1 the glowing seam where the ghost is letting go */
    uEdge: { value: 0 },
    /** the player's mouth, in cup space: freed cloth streams toward it */
    uMouth: { value: new THREE.Vector3(0, 0.5, 6) },
    /** nervous spasms, lunges at the player and a slow tilt of the hood */
    uTwitch: { value: 0 },
    uLunge: { value: 0 },
    uTilt: { value: 0 },
    /** where the eyes look, −1…1 on each axis (0,0 = straight at the player) */
    uLook: { value: new THREE.Vector2() },
    uEyeGlow: { value: 1 },
    /** 1 = eyes lit; drops to 0 for a moment when they "blink" out */
    uBlink: { value: 1 },
    uMouthOpen: { value: 0 },
    uColor: { value: new THREE.Color(colors.ghost) },
    uGlow: { value: new THREE.Color(colors.ghostGlow) },
    uRim: { value: new THREE.Color(colors.rim) },
    uGripColor: { value: new THREE.Color(colors.grip) },
    uEmber: { value: new THREE.Color(colors.ember) },
  };
}

export type GhostUniforms = ReturnType<typeof createGhostUniforms>;

const extents = /* glsl */ `
const float GHOST_TOP = ${GHOST_TOP.toFixed(2)};
const float GHOST_BOTTOM = ${GHOST_BOTTOM.toFixed(2)};
`;

const vertexShader = /* glsl */ `
uniform mat4 uWorldToCup;
uniform mat4 uCupToWorld;
uniform float uStretch;
uniform float uSuck;
uniform float uGrip;
uniform float uExit;
uniform float uTwitch;
uniform float uLunge;
uniform float uTilt;
uniform vec3 uMouth;
uniform float uIsArm;
${extents}
${coverageGLSL}

varying vec3 vRest;
varying vec3 vNormalV;
varying vec3 vViewV;
varying vec2 vUv;

void main() {
  // everything happens in cup space, so the arms (separate meshes) and the body deform alike
  mat4 toCup = uWorldToCup * modelMatrix;
  vec3 p = (toCup * vec4(position, 1.0)).xyz;
  vec3 n = normalize(mat3(toCup) * normal);
  vRest = p;
  vUv = uv;

  float body = 1.0 - uIsArm;
  float a = atan(p.x, p.z);

  // the hood leans forward over the player
  float hood = smoothstep(1.2, GHOST_TOP, p.y) * body;
  p.z += hood * hood * 0.45;
  p.y -= hood * hood * 0.12;

  // the head tilts, slowly, like it's sizing you up
  float tilt = smoothstep(0.6, GHOST_TOP, p.y) * uTilt * body;
  float ct = cos(tilt);
  float st = sin(tilt);
  vec2 q = vec2(p.x, p.y - 0.6);
  p.xy = vec2(ct * q.x - st * q.y, st * q.x + ct * q.y) + vec2(0.0, 0.6);

  // cloth: slow breathing, a fluttering ragged hem; it tightens and shivers when it fights back
  float hem = (1.0 - smoothstep(GHOST_BOTTOM, -0.8, p.y)) * body;
  float wobble = sin(uTime * 1.4 + p.y * 3.0 + a * 2.0) * 0.018
    + hem * sin(a * 9.0 + uTime * 2.6) * 0.07
    - uGrip * 0.04
    + uGrip * sin(uTime * 55.0 + p.y * 20.0) * 0.014;
  p += n * wobble;

  // nervous spasms, and lunges at the player
  p.x += uTwitch * sin(p.y * 23.0 + uTime * 70.0) * 0.025;
  p.z += uTwitch * cos(p.y * 17.0 + uTime * 53.0) * 0.02;
  p += vec3(0.0, 0.1, 0.55) * smoothstep(-0.6, 2.0, p.y) * uLunge;

  // pulled toward the player's mouth: first the whole sheet stretches (front and top most),
  // then whatever has come free streams away like taffy
  vec3 toMouth = normalize(uMouth - p);
  float facing = clamp(dot(n, toMouth) * 0.5 + 0.5, 0.0, 1.0);
  float pull = 0.35 + 0.65 * uSuck;
  float height = smoothstep(-1.0, 2.4, p.y);
  float stretch = uStretch * pull * facing * facing * (0.25 + 0.75 * height) * 0.22;
  float cover = uIsArm > 0.5 ? 1.0 : ghostCover(vRest);
  float freed = clamp(-cover / 0.9, 0.0, 1.0);
  float stream = freed * (0.3 + 0.5 * uSuck) * (0.4 + 0.6 * facing);
  float t = clamp(stretch + stream, 0.0, 0.85);
  t = mix(t, 1.0, uExit * uExit); // the win: all of it into the camera
  p = mix(p, uMouth, t);

  vec4 world = uCupToWorld * vec4(p, 1.0);
  vec4 view = viewMatrix * world;
  vNormalV = normalize(mat3(viewMatrix) * (mat3(uCupToWorld) * n));
  vViewV = -view.xyz;
  gl_Position = projectionMatrix * view;
}
`;

const fragmentShader = /* glsl */ `
uniform float uSuck;
uniform float uGrip;
uniform float uExit;
uniform float uEdge;
uniform float uEyeGlow;
uniform float uBlink;
uniform float uMouthOpen;
uniform float uIsArm;
uniform float uArmCut;
uniform float uFace;
uniform float uFlash;
uniform vec2 uLook;
uniform vec3 uColor;
uniform vec3 uGlow;
uniform vec3 uRim;
uniform vec3 uGripColor;
uniform vec3 uEmber;
${extents}
${coverageGLSL}

varying vec3 vRest;
varying vec3 vNormalV;
varying vec3 vViewV;
varying vec2 vUv;

/* 1 at d = 0, fading to 0 at d = w */
float line(float d, float w) {
  return 1.0 - smoothstep(0.0, w, d);
}

void main() {
  if (uIsArm > 0.5 && vUv.x < uArmCut) discard;

  // dissolve: freed cloth breaks into holes and fades as it streams away
  float cover = uIsArm > 0.5 ? 1.0 : ghostCover(vRest);
  float freed = clamp(-cover, 0.0, 1.0);
  if (cvNoise(vRest * 9.0 + uTime * 0.5) < freed * 1.8 - 0.05) discard;

  float body = 1.0 - uIsArm;
  float a = atan(vRest.x, vRest.z);
  vec2 f = logoSpace(vRest) * uLogo.zw;
  float front = step(0.0, cos(a - uLogo.x));
  float inFace = front * uFace * (1.0 - smoothstep(0.32, 0.5, length(f / vec2(1.0, 1.25))));

  // torn cloth: a ragged hem and holes ripped through the sheet (not through the face)
  float ragged = (1.0 - smoothstep(GHOST_BOTTOM - 0.05, GHOST_BOTTOM + 0.6, vRest.y)) * body;
  if (cvNoise(vRest * 7.0 + 11.0) < ragged * 1.35 - 0.2) discard;
  float tear = cvNoise(vRest * vec3(2.5, 7.0, 2.5) + 4.0);
  if (tear > 0.905 && body > 0.5 && inFace < 0.5) discard;
  float frayed = smoothstep(0.86, 0.905, tear) * body * (1.0 - inFace);

  vec3 N = normalize(vNormalV);
  vec3 V = normalize(vViewV);
  float fresnel = pow(1.0 - abs(dot(N, V)), 2.2);
  float light = 0.35 + 0.65 * clamp(N.y * 0.5 + 0.5, 0.0, 1.0) * (0.7 + 0.3 * abs(dot(N, V)));
  float folds = 0.84 + 0.16 * sin(a * 9.0 + vRest.y * 2.0 + sin(vRest.y * 3.0 + uTime) * 0.6);
  vec3 shade = vec3(0.22, 0.26, 0.27);
  vec3 col = mix(shade, uColor, light * folds);

  // grime, old stains and dark veins running through the sheet
  float grime = cvNoise(vRest * 2.2 + 5.0);
  float stain = smoothstep(0.55, 0.85, cvNoise(vRest * 1.3 + 2.0));
  col *= 0.74 + 0.26 * grime;
  col = mix(col, col * vec3(0.5, 0.58, 0.46), stain * 0.65);
  float vein = line(abs(cvNoise(vRest * 3.0 + 9.0) - 0.5), 0.025);
  col = mix(col, col * 0.55, vein * 0.35);
  col = mix(col, col * 0.3, frayed * 0.8);
  // ectoplasm glow at the edges
  col = mix(col, uGlow * 1.3, fresnel * 0.85);

  // the glowing seam where it's letting go (red while it fights back)
  float seam = (1.0 - smoothstep(0.0, 0.14, abs(cover))) * uEdge;
  vec3 rim = mix(uRim, uGripColor, uGrip);
  col += rim * seam * (2.0 + uSuck * 2.0);
  col = mix(col, col * vec3(1.0, 0.6, 0.65), uGrip * 0.45);
  // lightning
  col += vec3(0.55, 0.6, 0.9) * uFlash * (0.35 + 0.65 * max(0.0, N.y));

  float alpha = (0.84 + 0.16 * fresnel) * (1.0 - smoothstep(0.05, 0.6, freed));

  // the face, over the logo: hollow sockets, black tears, ember pupils and a gaping jagged scream
  if (uFace > 0.5) {
    float nE = cvNoise(vec3(f * 9.0, 3.0)) - 0.5;
    vec2 eL = vec2(-0.17, 0.24);
    vec2 eR = vec2(0.16, 0.2);
    float sockL = 1.0 - smoothstep(0.6, 1.0, length((f - eL) / vec2(0.13, 0.17)) + nE * 0.3);
    float sockR = 1.0 - smoothstep(0.6, 1.0, length((f - eR) / vec2(0.15, 0.21)) + nE * 0.3);
    float sockets = max(sockL, sockR);

    float drip = 0.5 + 0.5 * cvNoise(vec3(f * 20.0, 1.0));
    float streak = line(abs(f.x - eL.x + sin(f.y * 28.0) * 0.012), 0.03) * (1.0 - smoothstep(eL.y - 0.3, eL.y - 0.08, f.y))
      + line(abs(f.x - eR.x + cos(f.y * 24.0) * 0.012), 0.035) * (1.0 - smoothstep(eR.y - 0.36, eR.y - 0.08, f.y));
    streak *= drip * step(-0.7, f.y);

    float open = 0.12 + uMouthOpen * 0.2;
    vec2 d = f - vec2(0.0, -0.22 - uMouthOpen * 0.05);
    float ang = atan(d.y, d.x);
    float jag = 0.08 * abs(sin(ang * 7.0 + 0.4)) + 0.06 * cvNoise(vec3(ang * 3.0, 0.0, 2.0));
    float rr = length(d / vec2(0.25 + uMouthOpen * 0.06, open));
    float mouth = 1.0 - smoothstep(0.82 - jag, 1.0 - jag, rr);
    float throat = (1.0 - smoothstep(0.0, 0.6, rr)) * mouth;
    // crooked teeth hanging from the upper lip and jutting up from the lower
    float toothWidth = clamp((rr - 0.5) / 0.45, 0.0, 1.0);
    float upperTeeth = step(0.0, d.y) * step(abs(fract(d.x * 26.0) - 0.5) * 2.0, toothWidth);
    float lowerTeeth = step(d.y, 0.0) * step(abs(fract(d.x * 20.0 + 0.3) - 0.5) * 2.0, toothWidth * 0.7);
    float teeth = max(upperTeeth, lowerTeeth) * smoothstep(0.5, 0.6, rr) * mouth;

    float crack = line(abs(cvNoise(vec3(f * 6.0, 7.0)) - 0.5), 0.04) * (1.0 - smoothstep(0.25, 0.75, length(f)));

    float dark = max(max(sockets, mouth), max(streak * 0.85, crack * 0.6)) * front;
    col = mix(col, vec3(0.015, 0.008, 0.02), dark * 0.96);
    col += vec3(0.5, 0.04, 0.02) * throat * front * 0.6;
    col = mix(col, vec3(0.78, 0.76, 0.66), teeth * front * 0.9);

    vec2 look = uLook * 0.05;
    float pL = length(f - (eL + look));
    float pR = length(f - (eR + look));
    float pupil = line(pL, 0.03) + line(pR, 0.036);
    float halo = line(pL, 0.1) * 0.35 + line(pR, 0.12) * 0.35;
    vec3 eyeCol = mix(uEmber, uGripColor, uGrip) * uEyeGlow;
    col += eyeCol * (pupil * 3.2 + halo) * front * uBlink * sockets;

    alpha = max(alpha, dark * 0.98);
  }

  alpha *= 1.0 - uExit;
  gl_FragColor = vec4(col, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/**
 * The ghost's cloth. One factory for the body and its arms/hands: they share every uniform object
 * (so a single write animates them all) and differ only in `uIsArm`, `uArmCut` and `uFace`.
 */
export function makeGhostMaterial(
  curse: CurseUniforms,
  ghost: GhostUniforms,
  part: { isArm?: boolean; face?: boolean } = {},
) {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...curse,
      ...ghost,
      uIsArm: { value: part.isArm ? 1 : 0 },
      uArmCut: { value: -1 },
      uFace: { value: part.face ? 1 : 0 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
  });
}
