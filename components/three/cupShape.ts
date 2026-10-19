import * as THREE from "three";
import { GHOST_BOTTOM, GHOST_TOP } from "@/lib/reveal";

/**
 * The placeholder cup's dimensions (cup space, scene units), taken from the product photo:
 * a tall tapered clear cup, filled almost to the top, with a flat clear lid. The ghost's sheet is shaped around them.
 */
export const CUP = {
  bottom: -1.35,
  rim: 1.15,
  radiusBottom: 0.5,
  radiusTop: 0.8,
  lidThickness: 0.07,
  lidRadius: 0.85,
  teaTop: 1.0,
  /** gap between the tea and the cup wall */
  wallGap: 0.03,
};

export const cupRadius = (y: number) =>
  CUP.radiusBottom + ((y - CUP.bottom) / (CUP.rim - CUP.bottom)) * (CUP.radiusTop - CUP.radiusBottom);

/** The ghost's sheet: a lathe that hugs the cup, spreads on the ground, and rises into a tall hood above the lid. */
export function ghostSheetGeometry(): THREE.LatheGeometry {
  const pad = 0.085;
  const outline: [number, number][] = [
    [0.0, GHOST_BOTTOM + 0.02],
    [1.05, GHOST_BOTTOM],
    [cupRadius(-1.15) + 0.2, -1.15],
    [cupRadius(-0.5) + pad, -0.5],
    [cupRadius(0.2) + pad, 0.2],
    [cupRadius(0.9) + pad, 0.9],
    [CUP.lidRadius + pad + 0.02, 1.2],
    [0.92, 1.45],
    [0.9, 1.72],
    [0.76, 2.0],
    [0.5, 2.25],
    [0.24, 2.45],
    [0.09, 2.62],
    [0.0, GHOST_TOP],
  ];
  const curve = new THREE.CatmullRomCurve3(
    outline.map(([r, y]) => new THREE.Vector3(r, y, 0)),
    false,
    "centripetal",
  );
  const points = curve.getPoints(96).map((p) => new THREE.Vector2(Math.max(0, p.x), p.y));
  return new THREE.LatheGeometry(points, 64);
}
