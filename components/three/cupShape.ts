/**
 * The placeholder cup's dimensions (cup space, scene units), taken from the product photo:
 * a tall tapered clear cup, filled almost to the top, with a flat clear lid.
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
