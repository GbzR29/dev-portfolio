"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Readout, Row, C, T, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// What "light × surface" really is. Real light is a spectrum: some power at
// every wavelength from violet (400 nm) to red (700 nm). A surface reflects a
// fraction of each wavelength. The light that leaves it is the product,
// wavelength by wavelength (the filled curve), and the eye (or a camera) sums
// that product through three sensitivity curves to get R, G and B. The shader
// shortcut multiplies the light's RGB by the surface's RGB instead. The two
// swatches compare the two: close for smooth spectra like daylight, clearly
// wrong for spiky ones like a sodium street lamp.

const N = 61;                                              // 400…700 nm in 5 nm steps
const LAMBDA = Array.from({ length: N }, (_, i) => 400 + 5 * i);
const gauss = (l: number, mu: number, s: number) => Math.exp(-0.5 * ((l - mu) / s) ** 2);
const sigm = (l: number, mu: number, w: number) => 1 / (1 + Math.exp(-(l - mu) / w));

/** Simplified R, G, B sensitivities (camera-like, not the exact CIE curves). */
const SENS = [
  LAMBDA.map(l => gauss(l, 600, 38)),
  LAMBDA.map(l => gauss(l, 545, 38)),
  LAMBDA.map(l => gauss(l, 450, 28)),
];
const SENS_SUM = SENS.map(s => s.reduce((a, b) => a + b, 0));

type Key = "day" | "tungsten" | "led" | "rgbled" | "sodium";
const LIGHTS: Record<Key, number[]> = {
  day: LAMBDA.map(l => 0.85 + 0.15 * gauss(l, 470, 60) - 0.1 * gauss(l, 690, 30)),
  tungsten: LAMBDA.map(l => { const x = (l * 1e-9) * 2856 / 1.4388e-2; return 1 / (l ** 5 * (Math.exp(1 / x) - 1)); }),
  led: LAMBDA.map(l => gauss(l, 450, 10) + 0.75 * gauss(l, 565, 55)),
  rgbled: LAMBDA.map(l => gauss(l, 460, 9) + gauss(l, 528, 12) + gauss(l, 630, 9)),
  sodium: LAMBDA.map(l => gauss(l, 589, 4) + 0.02),
};
type SKey = "coral" | "leaf" | "paint" | "grey";
const SURFS: Record<SKey, number[]> = {
  coral: LAMBDA.map(l => 0.12 + 0.8 * sigm(l, 575, 18)),
  leaf: LAMBDA.map(l => 0.05 + 0.4 * gauss(l, 550, 25) + 0.5 * sigm(l, 700, 8)),
  paint: LAMBDA.map(l => 0.08 + 0.75 * gauss(l, 470, 35)),
  grey: LAMBDA.map(() => 0.5),
};

/** Σ spectrum · sensitivity, normalised so that a flat spectrum of 1 gives 1 in every channel. */
const toRgb = (spec: number[]) => SENS.map((s, c) => s.reduce((a, v, i) => a + v * spec[i], 0) / SENS_SUM[c]) as [number, number, number];
const css = (c: number[], k = 1) => `rgb(${c.map(v => Math.round(Math.min(1, Math.max(0, v * k)) ** (1 / 2.2) * 255)).join(",")})`;

const W = 620, H = 232, X0 = 34, X1 = 600, Y0 = 30, Y1 = 200;     // the legend sits above Y0
const px = (l: number) => X0 + ((l - 400) / 300) * (X1 - X0);
const py = (v: number) => Y1 - v * (Y1 - Y0);
const path = (v: number[]) => v.map((y, i) => `${i ? "L" : "M"}${px(LAMBDA[i]).toFixed(1)},${py(y).toFixed(1)}`).join("");

export function SpectrumFigure({ t }: { t?: TrackTranslations }) {
  const [light, setLight] = useState<Key>("day");
  const [surf, setSurf] = useState<SKey>("coral");
  const L = (k: string, en: string) => tx(t, `figSpec_${k}`, en);

  const raw = LIGHTS[light];
  const lRgbRaw = toRgb(raw);
  const k = 1 / Math.max(...lRgbRaw);                      // scale the light so its brightest channel is 1
  const E = raw.map(v => v * k);
  const peak = Math.max(...E);
  const rho = SURFS[surf];
  const prod = E.map((v, i) => v * rho[i]);
  const Lrgb = toRgb(E), Srgb = toRgb(rho);
  const truth = toRgb(prod);
  const shortcut = Lrgb.map((v, i) => v * Srgb[i]);
  const err = Math.max(...truth.map((v, i) => Math.abs(v - shortcut[i])));

  return (
    <Figure
      title={L("title", "Spectra: what light × surface really means")}
      head={<Choice value={surf} onChange={setSurf} options={[["coral", L("coral", "coral")], ["leaf", L("leaf", "leaf")], ["paint", L("paint", "blue paint")], ["grey", L("grey", "grey card")]] as const} />}
      controls={<>
        <Row>
          <Choice value={light} onChange={setLight} options={[["day", L("day", "daylight")], ["tungsten", L("tungsten", "light bulb")], ["led", L("led", "white LED")], ["rgbled", L("rgbled", "RGB LED")], ["sodium", L("sodium", "sodium street lamp")]] as const} />
        </Row>
        <div className="flex flex-wrap gap-4 items-center">
          {[[L("spectral", "spectral (truth)"), truth], [L("shortcut", "RGB shortcut L ⊙ S"), shortcut]].map(([label, c]) => (
            <div key={label as string} className="flex items-center gap-2">
              <span className="w-10 h-10 rounded-md border border-[var(--border)]" style={{ background: css(c as number[]) }} />
              <span className="text-[10.5px] font-mono text-[var(--text-muted)] leading-tight">{label as string}<br />
                <span className="text-[var(--text-main)]">({(c as number[]).map(v => f2(v, 2)).join(", ")})</span></span>
            </div>
          ))}
        </div>
        <Row>
          <Readout>L = ({Lrgb.map(v => f2(v, 2)).join(", ")})</Readout>
          <Readout>S = ({Srgb.map(v => f2(v, 2)).join(", ")})</Readout>
          <Readout color={err < 0.03 ? C.green : err < 0.1 ? C.amber : C.red}>{L("err", "largest channel error")} {f2(err, 3)}</Readout>
        </Row>
      </>}
      note={L("note", "Orange: the light's power at each wavelength. Dashed: the fraction the surface reflects. Filled: their product, the light that actually leaves the surface. The faint curves at the bottom are the three sensitivities that turn a spectrum into R, G and B: each channel is the area of the filled curve seen through its sensitivity. The shader instead reduces the light and the surface to three numbers each first, then multiplies (L ⊙ S). For smooth spectra (daylight, the bulb, the grey card) the two swatches agree closely. For spiky ones they drift apart, because the RGB numbers have forgotten where inside each channel the power sits: under the sodium lamp's single yellow line, every surface is some shade of yellow-orange or black.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <defs>
          <linearGradient id="spec-rainbow" x1="0" x2="1">
            {[400, 450, 490, 530, 580, 620, 700].map((l, i) => {
              const c = ["#6d28d9", "#2563eb", "#06b6d4", "#22c55e", "#eab308", "#f97316", "#dc2626"][i];
              return <stop key={l} offset={(l - 400) / 300} stopColor={c} />;
            })}
          </linearGradient>
        </defs>
        <rect x={X0} y={Y1 + 4} width={X1 - X0} height={6} fill="url(#spec-rainbow)" />
        {[400, 450, 500, 550, 600, 650, 700].map(l => <T key={l} x={px(l)} y={H - 6} size={8} anchor="middle">{l}</T>)}
        <T x={X1} y={H - 16} size={8} anchor="end">nm</T>
        {SENS.map((s, c) => <path key={c} d={path(s.map(v => v * 0.25))} fill="none" stroke={[C.red, C.green, C.blue][c]} strokeOpacity={0.45} strokeWidth={1} />)}
        <path d={`${path(prod.map(v => v / Math.max(peak, 1e-9)))}L${px(700)},${py(0)}L${px(400)},${py(0)}Z`} fill={css(truth)} fillOpacity={0.85} stroke={C.fg} strokeWidth={0.6} />
        <path d={path(E.map(v => v / Math.max(peak, 1e-9)))} fill="none" stroke={C.amber} strokeWidth={2} />
        <path d={path(rho)} fill="none" stroke={C.fg} strokeWidth={1.5} strokeDasharray="5 3" />
        <T x={X0 + 4} y={14} size={8.5} color={C.amber} bold>{L("lightCurve", "light")}</T>
        <T x={X0 + 50} y={14} size={8.5} color={C.fg} bold>{L("surfCurve", "- - reflectance")}</T>
        <T x={X0 + 160} y={14} size={8.5} color={C.fg}>{L("prodCurve", "▇ light leaving the surface")}</T>
      </svg>
    </Figure>
  );
}
