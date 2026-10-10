// ── Live formulas of "Basic Lighting (Phong)" ─────────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { num, r } from "./fmt";

type V = Record<string, number>;
const rad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Phong at one point, with the constants of the chapter's phong.frag:
 * ambient 0.1, diffuse strength 1, specular strength 0.5. θ is the angle
 * between n and l, φ the angle between r and v, α the shininess.
 */
export const phongNumbers = (t: TrackTranslations) => ({ theta, phi, alpha }: V) => {
  const cl = Math.cos(rad(theta)), cv = Math.cos(rad(phi));
  const d = Math.max(0, cl), s = 0.5 * Math.max(0, cv) ** alpha, I = 0.1 + d + s;
  const clip = I > 1 ? r`\;\Rightarrow\; \text{${tx(t, "oglPhong_liveClip", "clipped to")}}\ 1` : "";
  return {
    tex: r`\begin{aligned} &I_a = \amber{0.1} \\[4pt] &I_d = 1 \cdot \max(0,\ \cos ${theta}^\circ) = \max(0,\ ${num(cl, 3)}) = \green{${num(d, 3)}} \\[4pt] &I_s = 0.5 \cdot \max(0,\ \cos ${phi}^\circ)^{${alpha}} = 0.5 \cdot ${num(Math.max(0, cv), 3)}^{${alpha}} = \blue{${num(s, 3)}} \\[4pt] &I = 0.1 + ${num(d, 3)} + ${num(s, 3)} = ${num(I, 3)}${clip} \end{aligned}`,
    meter: Math.min(1, I),
    meterLabel: tx(t, "oglPhong_liveBright", "brightness on screen"),
  };
};

/** How wide the highlight is: the angle φ at which cos^α φ has dropped to one half. */
export const highlightNumbers = (t: TrackTranslations) => ({ alpha }: V) => {
  const c = 0.5 ** (1 / alpha), half = (Math.acos(c) * 180) / Math.PI;
  return {
    tex: r`\begin{aligned} &\cos^{${alpha}} \varphi = \tfrac12 \;\Rightarrow\; \cos \varphi = 0.5^{1/${alpha}} = ${num(c, 4)} \\[4pt] &\varphi_{1/2} = \arccos(${num(c, 4)}) = \amber{${num(half, 1)}^\circ} \qquad \text{${tx(t, "oglPhong_liveWidth", "width")}} = 2\varphi_{1/2} = ${num(2 * half, 1)}^\circ \end{aligned}`,
  };
};
