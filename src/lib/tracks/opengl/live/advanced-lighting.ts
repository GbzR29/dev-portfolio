// ── Live formulas of "Blinn-Phong" ────────────────────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { fac, num, r } from "./fmt";

type V = Record<string, number>;
const rad = (deg: number) => (deg * Math.PI) / 180;

/**
 * One fragment in the plane of the drawing, N straight up: the light θL to the
 * left of N, the eye θV to the right (negative θV = on the light's side). Phong's angle α = |θL − θV| (R is the
 * light mirrored to the right), Blinn's angle is α/2 (H halfway between L and V).
 */
export const blinnNumbers = (t: TrackTranslations) => ({ light, eye, n }: V) => {
  const alpha = Math.abs(light - eye), beta = alpha / 2;
  const rv = Math.cos(rad(alpha)), nh = Math.cos(rad(beta));
  const phong = Math.max(0, rv) ** n, blinn = nh ** n, blinn4 = nh ** (4 * n);
  return {
    tex: r`\begin{aligned} &\alpha = |${light}^\circ - ${fac(eye, 0)}^\circ| = ${num(alpha, 1)}^\circ \qquad \beta = \tfrac{\alpha}{2} = ${num(beta, 1)}^\circ \\[4pt] &\text{Phong: } \max(0,\ \cos ${num(alpha, 1)}^\circ)^{${n}} = ${num(Math.max(0, rv), 3)}^{${n}} = \amber{${num(phong, 3)}} \\[4pt] &\text{Blinn: } \cos^{${n}} ${num(beta, 1)}^\circ = ${num(nh, 3)}^{${n}} = ${num(blinn, 3)} \\[4pt] &\text{Blinn, } 4 \cdot ${n} = ${4 * n}: \ ${num(nh, 3)}^{${4 * n}} = \green{${num(blinn4, 3)}} \end{aligned}`,
    meter: blinn4,
    meterLabel: tx(t, "oglBlinn_liveMeter", "Blinn-Phong highlight with 4× the exponent"),
  };
};
