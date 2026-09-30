"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Readout, Row, Slider, Sliders, C, T, f2, hash2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A 16 × 16 crate face and its three lighting maps, texel by texel: diffuse
// (colour), specular (how strongly the highlight shows) and emission (light
// the surface gives off). On the right, the lit result: every texel runs the
// same shader with the same light, only the map values differ. Click a texel
// to see its numbers go through the formula.

type RGB = [number, number, number];
const NT = 16;
const isRim = (x: number, y: number) => x < 2 || y < 2 || x >= NT - 2 || y >= NT - 2;
const isBolt = (x: number, y: number) => (x === 0 || x === NT - 1) && (y === 0 || y === NT - 1);
const isRune = (x: number, y: number) => {
  const dx = x - 7.5, dy = y - 7.5;                           // a small ring in the middle
  const d = Math.hypot(dx, dy);
  return d > 1.6 && d < 3.1 && !(Math.abs(dx) < 0.6 && dy > 0);
};

function maps() {
  const D: RGB[] = [], S: number[] = [], E: RGB[] = [];
  for (let y = 0; y < NT; y++)
    for (let x = 0; x < NT; x++) {
      if (isBolt(x, y)) { D.push([0.35, 0.35, 0.37]); S.push(1); E.push([0, 0, 0]); continue; }
      if (isRim(x, y)) {
        const n = 0.9 + 0.1 * hash2(x, y, 3);
        D.push([0.42 * n, 0.43 * n, 0.46 * n]); S.push(0.7 + 0.2 * hash2(x, y, 5)); E.push([0, 0, 0]); continue;
      }
      const plank = Math.floor((y - 2) / 3);                   // horizontal planks, 3 texels tall
      const grain = 0.8 + 0.2 * hash2(x, plank, 7) + ((y - 2) % 3 === 2 ? -0.25 : 0);   // dark gap under each plank
      D.push([0.62 * grain, 0.4 * grain, 0.2 * grain]);
      S.push(0.04 + 0.04 * hash2(x, y, 9));
      E.push(isRune(x, y) ? [1, 0.45, 0.1] : [0, 0, 0]);
    }
  return { D, S, E };
}

const css = (c: number[]) => `rgb(${c.map(v => Math.round(Math.min(1, Math.max(0, v)) ** (1 / 2.2) * 255)).join(",")})`;
const CELL = 8, BIG = 12;

export function TexelProbeFigure({ t }: { t?: TrackTranslations }) {
  const [ndl, setNdl] = useState(0.8);
  const [spec, setSpec] = useState(0.35);
  const [emOn, setEmOn] = useState(true);
  const [sel, setSel] = useState<[number, number]>([1, 8]);
  const L = (k: string, en: string) => tx(t, `figTexel_${k}`, en);
  const { D, S, E } = useMemo(maps, []);

  // the chapter's light: ambient 0.2, diffuse 0.5, specular 1.0, white
  const shade = (i: number): RGB => D[i].map((d, c) =>
    0.2 * d + 0.5 * d * ndl + 1.0 * S[i] * spec + (emOn ? E[i][c] : 0)) as RGB;
  const i = sel[1] * NT + sel[0];
  const terms = {
    amb: D[i].map(d => 0.2 * d), dif: D[i].map(d => 0.5 * d * ndl),
    spc: [0, 1, 2].map(() => S[i] * spec), em: emOn ? E[i] : [0, 0, 0],
  };
  const out = shade(i);

  const grid = (x0: number, y0: number, size: number, color: (k: number) => string, label: string) => (
    <g>
      <T x={x0} y={y0 - 5} size={8.5} bold color={C.fg}>{label}</T>
      {Array.from({ length: NT * NT }, (_, k) => (
        <rect key={k} x={x0 + (k % NT) * size} y={y0 + Math.floor(k / NT) * size} width={size} height={size} fill={color(k)}
          onClick={() => setSel([k % NT, Math.floor(k / NT)])} style={{ cursor: "pointer" }} />
      ))}
      <rect x={x0 + sel[0] * size - 1} y={y0 + sel[1] * size - 1} width={size + 2} height={size + 2} fill="none" stroke={C.amber} strokeWidth={2} pointerEvents="none" />
    </g>
  );
  const vs = (v: number[]) => `(${v.map(x => f2(x, 3)).join(", ")})`;

  return (
    <Figure
      title={L("title", "Three maps, one shader, texel by texel")}
      head={<Btn active={emOn} onClick={() => setEmOn(v => !v)}>{emOn ? "☑" : "☐"} {L("emission", "emission")}</Btn>}
      controls={<>
        <Sliders>
          <Slider label="N·L" value={ndl} min={0} max={1} step={0.01} onChange={setNdl} />
          <Slider label="(R·V)^α" value={spec} min={0} max={1} step={0.01} onChange={setSpec} />
        </Sliders>
        <Row>
          <Readout>{L("texel", "texel")} ({sel[0]}, {sel[1]})</Readout>
          <Readout>D = {vs(D[i])}</Readout>
          <Readout>S = {f2(S[i], 3)}</Readout>
          <Readout>E = {vs(emOn ? E[i] : [0, 0, 0])}</Readout>
        </Row>
        <div className="text-[10.5px] font-mono text-[var(--text-muted)] leading-relaxed">
          0.2·D {vs(terms.amb)} + 0.5·D·N·L {vs(terms.dif)} + 1.0·S·spec {vs(terms.spc)} + E {vs(terms.em)} = <span style={{ color: out.some(v => v > 1) ? C.red : C.fg }}>{vs(out)}</span>
        </div>
      </>}
      note={L("note", "The three small grids are the textures the shader samples; the big one is what it outputs. The face is flat and lit uniformly, so N·L and (R·V)^α are the same for every texel and are set by the sliders; everything that varies across the face comes from the maps. Click the steel rim and a plank: their diffuse colours differ, but the real difference is the specular map (about 0.8 against 0.05), so raising the specular slider lights up the rim and leaves the wood almost unchanged. The glowing ring is in the emission map only: it adds its colour after the lighting, so with N·L = 0 and no specular it still glows while the rest of the face drops to its ambient 0.2·D.")}
    >
      <svg viewBox="0 0 620 230" className="w-full h-auto" role="img">
        {grid(14, 26, CELL, k => css(D[k]), L("diffuseMap", "diffuse map D"))}
        {grid(150, 26, CELL, k => css([S[k], S[k], S[k]]), L("specularMap", "specular map S"))}
        {grid(286, 26, CELL, k => css(emOn ? E[k] : [0, 0, 0]), L("emissionMap", "emission map E"))}
        {grid(420, 26, BIG, k => css(shade(k)), L("result", "lit result"))}
        <T x={14} y={178} size={8.5}>{L("hint", "click any texel, in any grid")}</T>
      </svg>
    </Figure>
  );
}
