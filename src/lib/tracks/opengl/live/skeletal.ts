// ── Live formulas of "Skeletal Animation" ─────────────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { num, r, vec } from "./fmt";

type V = Record<string, number>;

const RAD = Math.PI / 180;
const rot = (deg: number, [x, y]: number[]) => [x * Math.cos(deg * RAD) - y * Math.sin(deg * RAD), x * Math.sin(deg * RAD) + y * Math.cos(deg * RAD)];

/** A two-bone arm in 2D: upper arm a = 1 from the shoulder, forearm b = 0.8 from the elbow. */
export const chainNumbers = (t: TrackTranslations) => ({ th1, th2 }: V) => {
  const e = rot(th1, [1, 0]), f = rot(th1 + th2, [0.8, 0]), h = [e[0] + f[0], e[1] + f[1]];
  return {
    tex: r`\begin{aligned} &\text{${tx(t, "oglSkel_liveElbow", "elbow")}} = R(${num(th1, 0)}^\circ)\,(1,\ 0) = ${vec(e)} \\[4pt] &\text{${tx(t, "oglSkel_liveHand", "hand")}} = ${vec(e)} + R(${num(th1, 0)}^\circ + ${num(th2, 0)}^\circ)\,(0.8,\ 0) = \amber{${vec(h)}} \end{aligned}`,
  };
};

/** Slerp from the identity to a turn of phi degrees about one axis, with the sign flip. */
export const slerpNumbers = (t: TrackTranslations) => ({ phi, u }: V) => {
  const c = Math.cos((phi / 2) * RAD), flip = c < 0, th = Math.acos(Math.min(1, Math.abs(c)));
  const s = Math.sin(th), a = s < 1e-6 ? 1 - u : Math.sin((1 - u) * th) / s, b = s < 1e-6 ? u : Math.sin(u * th) / s;
  const total = flip ? phi - 360 : phi, turned = u * total;
  const flipTex = flip ? r`\;<\;0 \;\Rightarrow\; q_1 \to -q_1` : "";
  return {
    tex: r`\begin{aligned} &q_0\cdot q_1 = \cos(${num(phi, 0)}^\circ / 2) = ${num(c, 3)}${flipTex} \\[4pt] &\theta = \arccos(${num(Math.abs(c), 3)}) = ${num(th / RAD, 1)}^\circ \qquad \text{${tx(t, "oglSkel_liveWeights", "weights")}}\ ${num(a, 3)},\ ${num(b, 3)} \\[4pt] &\text{${tx(t, "oglSkel_liveTurned", "bone turned by")}}\ ${num(u, 2)} \cdot ${num(total, 0)}^\circ = \amber{${num(turned, 1)}^\circ} \end{aligned}`,
    meter: u,
    meterLabel: tx(t, "oglSkel_liveSlerpMeter", "u: how far from the first key to the second"),
  };
};

/** Linear blend skinning of a vertex at radius ρ around a twisting joint, two bones with weights 1 − w and w. */
export const candyNumbers = (t: TrackTranslations) => ({ phi, w }: V) => {
  const k = Math.sqrt(Math.max(0, (1 - w) ** 2 + w ** 2 + 2 * w * (1 - w) * Math.cos(phi * RAD)));
  return {
    tex: r`\begin{aligned} &\frac{\rho'_{\text{LBS}}}{\rho} = \sqrt{(1 - ${num(w)})^2 + ${num(w)}^2 + 2 \cdot ${num(w)} \cdot ${num(1 - w)} \cos ${num(phi, 0)}^\circ} = \amber{${num(k, 3)}} \\[4pt] &\frac{\rho'_{\text{DQS}}}{\rho} = 1 \end{aligned}`,
    meter: k,
    meterLabel: tx(t, "oglSkel_liveCandyMeter", "skin thickness LBS keeps at the joint"),
  };
};

/** Two-bone IK by the law of cosines; d is clamped to the reachable range. */
export const ikNumbers = (t: TrackTranslations) => ({ a, b, d }: V) => {
  const dc = Math.min(a + b, Math.max(Math.abs(a - b), d));
  const cb = (a * a + b * b - dc * dc) / (2 * a * b), ca = (a * a + dc * dc - b * b) / (2 * a * dc);
  const beta = Math.acos(Math.max(-1, Math.min(1, cb))) / RAD, alpha = Math.acos(Math.max(-1, Math.min(1, ca))) / RAD;
  const clamp = dc !== d ? r`\quad (\text{${tx(t, "oglSkel_liveClamp", "clamped from")}}\ ${num(d)})` : "";
  return {
    tex: r`\begin{aligned} &d = ${num(dc)}${clamp} \\[4pt] &\cos\beta = \frac{${num(a)}^2 + ${num(b)}^2 - ${num(dc)}^2}{2 \cdot ${num(a)} \cdot ${num(b)}} = ${num(cb, 3)} \;\Rightarrow\; \beta = \amber{${num(beta, 1)}^\circ} \\[4pt] &\cos\alpha = \frac{${num(a)}^2 + ${num(dc)}^2 - ${num(b)}^2}{2 \cdot ${num(a)} \cdot ${num(dc)}} = ${num(ca, 3)} \;\Rightarrow\; \alpha = \amber{${num(alpha, 1)}^\circ} \end{aligned}`,
    meter: dc / (a + b),
    meterLabel: tx(t, "oglSkel_liveIkMeter", "d as a share of the full reach a + b"),
  };
};
