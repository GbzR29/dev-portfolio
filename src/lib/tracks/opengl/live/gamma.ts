// ── Live formulas of "Gamma Correction" ───────────────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { num, r } from "./fmt";

type V = Record<string, number>;

/** The exact sRGB encoding of a linear value, next to the 2.2 approximation. */
export const srgb = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export const srgbNumbers = (t: TrackTranslations) => ({ lin }: V) => {
  const exact = srgb(lin), approx = lin ** (1 / 2.2);
  const branch = lin <= 0.0031308
    ? r`12.92 \cdot ${num(lin, 4)}`
    : r`1.055 \cdot ${num(lin, 4)}^{1/2.4} - 0.055`;
  return {
    tex: r`\begin{aligned} &C_{\text{sRGB}} = ${branch} = \amber{${num(exact, 4)}} \quad (\text{byte } ${Math.round(exact * 255)}) \\[4pt] &${num(lin, 4)}^{1/2.2} = ${num(approx, 4)} \quad (\text{byte } ${Math.round(approx * 255)}) \\[4pt] &\text{${tx(t, "oglGamma_liveDiff", "difference")}}: ${num(Math.abs(exact - approx) * 255, 1)}\ \text{${tx(t, "oglGamma_liveCodes", "codes")}} \end{aligned}`,
    meter: exact,
    meterLabel: tx(t, "oglGamma_liveEncoded", "encoded value"),
  };
};

/** One albedo texel lit at N·L, through the right and the wrong pipeline. */
export const texelNumbers = (t: TrackTranslations) => ({ byte, ndl }: V) => {
  const v = byte / 255, albedo = v ** 2.2, lit = albedo * ndl, out = lit ** (1 / 2.2);
  const wrong = v * ndl, wrongEmit = wrong ** 2.2;
  return {
    tex: r`\begin{aligned} &\text{${tx(t, "oglGamma_liveRight", "right")}}: \ ${num(v, 3)}^{2.2} \cdot ${num(ndl, 2)} = ${num(albedo, 3)} \cdot ${num(ndl, 2)} = \green{${num(lit, 3)}} \;\to\; \text{byte } ${Math.round(out * 255)} \\[4pt] &\text{${tx(t, "oglGamma_liveWrong", "wrong")}}: \ (${num(v, 3)} \cdot ${num(ndl, 2)})^{2.2} = ${num(wrong, 3)}^{2.2} = \amber{${num(wrongEmit, 3)}} \\[4pt] &\frac{${num(wrongEmit, 3)}}{${num(lit, 3)}} = ${lit > 0 ? num(wrongEmit / lit, 2) : "–"} \quad \text{${tx(t, "oglGamma_liveRatio", "of the light it should emit")}} \end{aligned}`,
    meter: lit > 0 ? Math.min(1, wrongEmit / lit) : 0,
    meterLabel: tx(t, "oglGamma_liveMeter", "wrong pipeline ÷ right pipeline"),
  };
};

/** How many codes above black (1 … 255) fall inside the darkest fraction p of the light, stored linearly or through 1/2.2. */
export const codesNumbers = (t: TrackTranslations) => ({ p }: V) => {
  const f = p / 100, linear = Math.floor(f * 255), gamma = Math.floor(f ** (1 / 2.2) * 255);
  return {
    tex: r`\begin{aligned} &\text{${tx(t, "oglGamma_liveLinear", "linear")}}: \ \lfloor ${num(f, 3)} \cdot 255 \rfloor = \lfloor ${num(f * 255, 2)} \rfloor = \amber{${linear}}\ \text{${tx(t, "oglGamma_liveCodes", "codes")}} \\[4pt] &\text{${tx(t, "oglGamma_liveCurve", "through the curve")}}: \ \lfloor ${num(f, 3)}^{1/2.2} \cdot 255 \rfloor = \lfloor ${num(f ** (1 / 2.2) * 255, 1)} \rfloor = \green{${gamma}}\ \text{${tx(t, "oglGamma_liveCodes", "codes")}} \end{aligned}`,
    meter: gamma / 256,
    meterLabel: tx(t, "oglGamma_liveShare", "share of the 256 codes, through the curve"),
  };
};
