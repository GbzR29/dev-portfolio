// ── Live formulas of "Cubemaps & Skybox" (and its parts cubemap-files / cubemap-sky) ──

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { fac, num, r, vec } from "./fmt";

type V = Record<string, number>;

const rad = (deg: number) => (deg * Math.PI) / 180;

/** The direction for a yaw φ around +Y from +X toward +Z, and a pitch θ above the horizon. */
const dirOf = (phi: number, theta: number) =>
  [Math.cos(rad(theta)) * Math.cos(rad(phi)), Math.sin(rad(theta)), Math.cos(rad(theta)) * Math.sin(rad(phi))];

/** OpenGL's face table: which face, and the (sc, tc, ma) it divides. */
function pickFace([x, y, z]: number[]) {
  const ax = Math.abs(x), ay = Math.abs(y), az = Math.abs(z);
  if (ax >= ay && ax >= az) return x > 0 ? { f: "+X", sc: -z, tc: -y, ma: ax, axis: "x" } : { f: "-X", sc: z, tc: -y, ma: ax, axis: "x" };
  if (ay >= az) return y > 0 ? { f: "+Y", sc: x, tc: z, ma: ay, axis: "y" } : { f: "-Y", sc: x, tc: -z, ma: ay, axis: "y" };
  return z > 0 ? { f: "+Z", sc: x, tc: -y, ma: az, axis: "z" } : { f: "-Z", sc: -x, tc: -y, ma: az, axis: "z" };
}

/** texture(samplerCube, d): the largest component picks the face, the other two divided by it give (s, t). */
export const faceNumbers = (t: TrackTranslations) => ({ phi, theta }: V) => {
  const d = dirOf(phi, theta), F = pickFace(d), s = (F.sc / F.ma + 1) / 2, tt = (F.tc / F.ma + 1) / 2;
  return {
    tex: r`\begin{aligned} \mathbf d &= ${vec(d)} \\[4pt] \text{${tx(t, "oglCube_liveFace", "face")}} &= \amber{${F.f.replace("-", "−")}} \quad (|d_${F.axis}| = ${num(F.ma)}\ \text{${tx(t, "oglCube_liveLargest", "is the largest")}}) \\[4pt] s &= \tfrac12\Big(\frac{${fac(F.sc)}}{${num(F.ma)}} + 1\Big) = \amber{${num(s, 3)}} \\[4pt] t &= \tfrac12\Big(\frac{${fac(F.tc)}}{${num(F.ma)}} + 1\Big) = \amber{${num(tt, 3)}} \end{aligned}`,
  };
};

/** Snell's law for a ray entering a material of index n from air. */
export const refractNumbers = (t: TrackTranslations) => ({ th, n }: V) => {
  const st = Math.sin(rad(th)) / n, tt = (Math.asin(st) * 180) / Math.PI;
  return {
    tex: r`\begin{aligned} \sin\theta_t &= \frac{1}{${num(n)}}\,\sin ${th}^\circ = ${num(st, 3)} \;\Rightarrow\; \theta_t = \amber{${num(tt, 1)}^\circ} \\[4pt] &\text{${tx(t, "oglCube_liveBent", "bent toward the normal by")}}\ ${num(th - tt, 1)}^\circ \end{aligned}`,
  };
};

/** A direction from yaw and pitch, and where it lands in a 4096 × 2048 panorama. */
export const panoNumbers = () => ({ phi, theta }: V) => {
  const d = dirOf(phi, theta), u = Math.atan2(d[2], d[0]) / (2 * Math.PI) + 0.5, v = 0.5 - Math.asin(d[1]) / Math.PI;
  return {
    tex: r`\begin{aligned} \mathbf d &= ${vec(d)} \\[4pt] u &= \frac{\operatorname{atan2}(${fac(d[2])}, ${fac(d[0])})}{2\pi} + \frac12 = \amber{${num(u, 3)}} \\[4pt] v &= \frac12 - \frac{\arcsin(${fac(d[1])})}{\pi} = \amber{${num(v, 3)}} \\[4pt] &\to (${Math.min(4095, Math.floor(u * 4096))},\ ${Math.min(2047, Math.floor(v * 2048))})\ \text{px in } 4096 \times 2048 \end{aligned}`,
  };
};

/** Relative sky coverage of a cube texel at (s_c, t_c) and of a panorama texel at latitude θ. */
export const solidNumbers = (t: TrackTranslations) => ({ s, tc, lat }: V) => {
  const cube = Math.pow(1 + s * s + tc * tc, -1.5), pano = Math.cos(rad(lat));
  return {
    tex: r`\begin{aligned} \Delta\omega_{\text{cube}} &\propto (1 + ${fac(s)}^2 + ${fac(tc)}^2)^{-3/2} = \amber{${num(cube, 3)}} \\[4pt] \Delta\omega_{\text{pano}} &\propto \cos ${lat}^\circ = \amber{${num(pano, 3)}} \end{aligned}`,
    meter: cube,
    meterLabel: tx(t, "oglCube_liveMeterCube", "cube texel's share of the sky, relative to the face centre"),
  };
};

/** The gradient sky's blend factor d_y^0.45 at an elevation angle. */
export const gradNumbers = (t: TrackTranslations) => ({ el }: V) => {
  const y = Math.sin(rad(el)), k = Math.pow(y, 0.45);
  return {
    tex: r`d_y = \sin ${el}^\circ = ${num(y, 3)} \qquad d_y^{\,0.45} = \amber{${num(k, 3)}}`,
    meter: k,
    meterLabel: tx(t, "oglCube_liveMeterGrad", "share of the zenith colour"),
  };
};

const BETA_R = [0.035, 0.107, 0.33];
const hex = (c: number[]) => "#" + c.map(x => Math.round(Math.min(1, Math.max(0, x)) * 255).toString(16).padStart(2, "0")).join("");

/** Air mass toward the sun at elevation e, and the share of each colour that survives Rayleigh scattering. */
export const airNumbers = (t: TrackTranslations) => ({ el }: V) => {
  const y = Math.max(0, Math.sin(rad(el))), m = 1 / (y + 0.025), T = BETA_R.map(b => Math.exp(-b * m));
  const peak = Math.max(...T), shown = T.map(x => x / peak);
  return {
    tex: r`\begin{aligned} m &= \frac{1}{${num(y, 3)} + 0.025} = ${num(m, 2)} \\[4pt] T &= e^{-\beta_R m} = \big(e^{-0.035 \cdot ${num(m, 2)}},\ e^{-0.107 \cdot ${num(m, 2)}},\ e^{-0.33 \cdot ${num(m, 2)}}\big) \\[4pt] &= \amber{(${T.map(x => (x < 0.001 ? x.toExponential(1).replace(/e(-?\d+)/, r` \times 10^{$1}`) : num(x, 3))).join(",\\ ")})} \;\; \textcolor{${hex(shown)}}{\blacksquare\!\blacksquare} \end{aligned}`,
    meter: T[2],
    meterLabel: tx(t, "oglCube_liveMeterBlue", "blue light that survives the path"),
  };
};
