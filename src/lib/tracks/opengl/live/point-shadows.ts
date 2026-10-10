// ── Live formulas of "Point Shadows" ──────────────────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { fac, num, r, vec } from "./fmt";

type V = Record<string, number>;

/** The worked example's scene: light at (0, 4, 0), far plane 25, bias 0.15. */
const LIGHT_Y = 4, FAR = 25, BIAS = 0.15;

/** The cube-map face a direction reads: the axis of its largest component, with that component's sign. */
const face = ([x, y, z]: number[]) => {
  const ax = [Math.abs(x), Math.abs(y), Math.abs(z)], i = ax.indexOf(Math.max(...ax));
  return `${[x, y, z][i] < 0 ? "-" : "+"}${"XYZ"[i]}`;
};

/**
 * A floor fragment at (x, 0, z) and a box top at height h that the light ray
 * crosses on its way down: the crossing is (4 − h)/4 of the way along fragToLight.
 */
export const pointShadowNumbers = (t: TrackTranslations) => ({ x, z, h }: V) => {
  const v = [x, -LIGHT_Y, z], cur = Math.hypot(...v);
  const k = (LIGHT_Y - h) / LIGHT_Y, closest = k * cur, stored = closest / FAR;
  const hit = [x * k, h, z * k];
  const inShadow = cur - BIAS > closest;
  return {
    tex: r`\begin{aligned} &\text{fragToLight} = ${vec(v)} \;\to\; \text{${tx(t, "oglPShadow_liveFace", "face")}}\ ${face(v)} \\[4pt] &\text{current} = \sqrt{${fac(x)}^2 + 16 + ${fac(z)}^2} = ${num(cur, 3)} \\[4pt] &\text{${tx(t, "oglPShadow_liveHit", "box top hit at")}}\ ${vec(hit)} \\[4pt] &\text{closest} = ${num(k, 3)} \cdot ${num(cur, 3)} = ${num(closest, 3)} \quad (\text{${tx(t, "oglPShadow_liveStored", "stored")}}\ ${num(stored, 4)}) \\[4pt] &${num(cur, 3)} - 0.15 = ${num(cur - BIAS, 3)} \ ${inShadow ? ">" : r`\le`} \ ${num(closest, 3)} \;\Rightarrow\; ${inShadow ? r`\amber{\text{${tx(t, "oglPShadow_liveShadow", "in shadow")}}}` : r`\green{\text{${tx(t, "oglPShadow_liveLit", "lit")}}}`} \end{aligned}`,
  };
};

/** Memory and extra scene passes for L shadowed point lights with faces of size s × s and 32-bit depth. */
export const pointCostNumbers = (t: TrackTranslations) => ({ k, lights }: V) => {
  const s = 2 ** k, mib = (s * s * 4 * 6) / 2 ** 20;
  return {
    tex: r`\begin{aligned} &${s}^2 \cdot 4\ \text{B} \cdot 6 = ${num(mib, 2)}\ \text{MiB} \;\Rightarrow\; ${lights} \cdot ${num(mib, 2)} = \amber{${num(mib * lights, 1)}\ \text{MiB}} \\[4pt] &${lights} \cdot 6 = \amber{${lights * 6}}\ \text{${tx(t, "oglPShadow_livePasses", "extra scene passes per frame")}} \end{aligned}`,
  };
};
