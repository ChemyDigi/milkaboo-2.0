import * as THREE from "three";

/** Small canvas-drawn textures, so the scene needs no extra downloads. Each is made once and cached. */
const cache = new Map<string, THREE.Texture>();

function canvasTexture(
  key: string,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
  opts: { srgb?: boolean; repeat?: boolean } = { srgb: true },
) {
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext("2d")!);
  const texture = new THREE.CanvasTexture(canvas);
  if (opts.srgb) texture.colorSpace = THREE.SRGBColorSpace;
  if (opts.repeat) texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  cache.set(key, texture);
  return texture;
}

/** deterministic random so every texture is the same on every load */
function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

/** a soft white puff: fog, mist, glows */
export const softDot = () =>
  canvasTexture("soft", 128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,0.45)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  });

/* ---------- the cup: condensation ---------- */

function droplets(seed: number) {
  const rand = seeded(seed);
  const drops: { x: number; y: number; r: number }[] = [];
  for (let i = 0; i < 1100; i++) {
    const big = rand() < 0.08;
    drops.push({ x: rand() * 512, y: rand() * 512, r: big ? 6 + rand() * 7 : 1.2 + rand() * 3.2 });
  }
  return drops;
}

/** height map of water droplets (and a few runs) for the cup wall's bump map */
export const condensationBump = () =>
  canvasTexture(
    "condensation-bump",
    512,
    512,
    (ctx) => {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, 512, 512);
      for (const d of droplets(11)) {
        const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r);
        g.addColorStop(0, "rgba(255,255,255,1)");
        g.addColorStop(0.7, "rgba(255,255,255,0.6)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(d.x - d.r, d.y - d.r, d.r * 2, d.r * 2);
      }
      // a few drops that have run down the wall
      const rand = seeded(5);
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineCap = "round";
      for (let i = 0; i < 14; i++) {
        const x = rand() * 512;
        const y = rand() * 400;
        ctx.lineWidth = 2 + rand() * 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (rand() - 0.5) * 6, y + 30 + rand() * 90);
        ctx.stroke();
      }
    },
    { srgb: false, repeat: true },
  );

/** roughness map: the plastic is a little hazy, the droplets are glassy */
export const condensationRoughness = () =>
  canvasTexture(
    "condensation-rough",
    512,
    512,
    (ctx) => {
      ctx.fillStyle = "#5a5a5a";
      ctx.fillRect(0, 0, 512, 512);
      ctx.fillStyle = "#101010";
      for (const d of droplets(11)) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r * 0.85, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    { srgb: false, repeat: true },
  );

/* ---------- the ground ---------- */

/** dark, patchy earth */
export const groundTexture = () =>
  canvasTexture(
    "ground",
    256,
    256,
    (ctx) => {
      ctx.fillStyle = "#1a1226";
      ctx.fillRect(0, 0, 256, 256);
      const rand = seeded(23);
      for (let i = 0; i < 2600; i++) {
        ctx.fillStyle = rand() < 0.5 ? "rgba(36,26,51,0.9)" : "rgba(14,9,22,0.9)";
        const r = 1 + rand() * 4;
        ctx.beginPath();
        ctx.ellipse(rand() * 256, rand() * 256, r * (1 + rand()), r, rand() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      // dead grass
      ctx.strokeStyle = "rgba(60,48,70,0.6)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 500; i++) {
        const x = rand() * 256;
        const y = rand() * 256;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (rand() - 0.5) * 6, y - 4 - rand() * 6);
        ctx.stroke();
      }
    },
    { srgb: true, repeat: true },
  );

/** alpha for the ground around the cup: solid in the middle, fading out so the painted backdrop shows beyond */
export const groundFade = () =>
  canvasTexture(
    "ground-fade",
    128,
    128,
    (ctx) => {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, 128, 128);
      const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, "#fff");
      g.addColorStop(0.45, "#fff");
      g.addColorStop(1, "#000");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
    },
    { srgb: false },
  );

/* ---------- pumpkins ---------- */

function drawPumpkinFace(ctx: CanvasRenderingContext2D, color: string) {
  // the sphere's u = 0.25 faces +z, so the face is centred at x = 64 on a 256-wide map
  ctx.fillStyle = color;
  const tri = (a: [number, number], b: [number, number], c: [number, number]) => {
    ctx.beginPath();
    ctx.moveTo(...a);
    ctx.lineTo(...b);
    ctx.lineTo(...c);
    ctx.closePath();
    ctx.fill();
  };
  // angry slanted eyes and a nose
  tri([34, 56], [62, 44], [58, 64]);
  tri([94, 56], [66, 44], [70, 64]);
  tri([64, 64], [57, 76], [71, 76]);
  // a wide jagged grin
  ctx.beginPath();
  ctx.moveTo(26, 80);
  [36, 44, 52, 60, 68, 76, 84, 92].forEach((x, i) => ctx.lineTo(x, i % 2 ? 80 : 88));
  ctx.lineTo(102, 80);
  ctx.quadraticCurveTo(64, 116, 26, 80);
  ctx.fill();
}

export const pumpkinSkin = () =>
  canvasTexture("pumpkin-skin", 256, 128, (ctx) => {
    ctx.fillStyle = "#d9661a";
    ctx.fillRect(0, 0, 256, 128);
    ctx.strokeStyle = "rgba(100,30,0,0.45)";
    ctx.lineWidth = 4;
    for (let x = 0; x < 256; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 128);
      ctx.stroke();
    }
    const rand = seeded(9);
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = "rgba(80,30,0,0.25)";
      ctx.fillRect(rand() * 256, rand() * 128, 1 + rand() * 3, 1 + rand() * 2);
    }
    drawPumpkinFace(ctx, "#1a0802");
  });

export const pumpkinGlow = () =>
  canvasTexture("pumpkin-glow", 256, 128, (ctx) => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, 256, 128);
    drawPumpkinFace(ctx, "#ffd36b");
  });

/** a bat silhouette, wings spread, about 1 unit wide */
export function batGeometry(): THREE.ShapeGeometry {
  const half: [number, number][] = [
    [0, 0.1],
    [0.04, 0.17],
    [0.06, 0.09],
    [0.16, 0.13],
    [0.34, 0.2],
    [0.5, 0.1],
    [0.42, 0.02],
    [0.34, 0.05],
    [0.26, -0.04],
    [0.16, 0.0],
    [0.07, -0.08],
    [0, -0.13],
  ];
  const shape = new THREE.Shape();
  shape.moveTo(half[0][0], half[0][1]);
  half.slice(1).forEach(([x, y]) => shape.lineTo(x, y));
  [...half].reverse().slice(1).forEach(([x, y]) => shape.lineTo(-x, y));
  return new THREE.ShapeGeometry(shape);
}
