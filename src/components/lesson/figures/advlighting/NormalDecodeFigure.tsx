"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Readout, Row, Slider, Sliders, C, T, Handle, useDrag, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// One normal-map texel decoded by hand. The disk is every tangent-space normal
// seen from above (x along the texture's u, y along v, z out of the surface),
// each painted with the colour a normal map stores for it: rgb = n/2 + 1/2.
// Drag the dot to pick a texel. The column on the right follows it through the
// fragment shader: bytes → [0, 1] → [−1, 1] → the TBN matrix of a floor
// (T = +x, B = −z, N = +y) → world normal → N·L, next to the flat normal's
// N·L. The arrow in the disk shows where the light comes from.

const W = 620, H = 250, CX = 125, CY = 125, R = 104, CELLS = 26;

const enc = (v: number) => Math.round((v * 0.5 + 0.5) * 255);
const shade = (d: number) => Math.round((0.8 * Math.max(0, d)) ** (1 / 2.2) * 255);

export function NormalDecodeFigure({ t }: { t?: TrackTranslations }) {
  const L = (k: string, en: string) => tx(t, `figNDec_${k}`, en);
  const [n, setN] = useState({ x: 0.3, y: 0 });
  const [az, setAz] = useState(0);
  const [el, setEl] = useState(45);
  const [flip, setFlip] = useState(false);

  const drag = useDrag<"n">(
    p => (Math.hypot(p.x - CX, p.y - CY) < R + 12 ? "n" : null),
    (_, p) => {
      let x = (p.x - CX) / R, y = -(p.y - CY) / R;
      const len = Math.hypot(x, y);
      if (len > 0.97) { x *= 0.97 / len; y *= 0.97 / len; }
      setN({ x, y });
    },
  );

  const z = Math.sqrt(Math.max(0, 1 - n.x * n.x - n.y * n.y));
  const bytes = [enc(n.x), enc(n.y), enc(z)];
  const unit = bytes.map(b => b / 255);
  const dec = unit.map(u => u * 2 - 1);
  if (flip) dec[1] = -dec[1];
  const len = Math.hypot(...dec);
  const nt = dec.map(v => v / len);
  const nw = [nt[0], nt[2], -nt[1]];                                   // x·T + y·B + z·N with T = +x, B = −z, N = +y
  const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180;
  const lw = [Math.cos(e) * Math.cos(a), Math.sin(e), -Math.cos(e) * Math.sin(a)];
  const flat = lw[1];
  const mapped = nw[0] * lw[0] + nw[1] * lw[1] + nw[2] * lw[2];
  const v3 = (v: number[]) => `(${v.map(c => f2(c, 3)).join(", ")})`;

  const rows: [string, string, string?][] = [
    [L("bytes", "texel bytes"), `(${bytes.join(", ")})`],
    ["÷ 255", v3(unit)],
    ["× 2 − 1", v3(dec), flip ? L("flipped", "green negated") : undefined],
    ["normalize", v3(nt), `${L("was", "length before")} ${f2(len, 4)}`],
    [L("world", "TBN · n (world)"), v3(nw)],
  ];

  return (
    <Figure
      title={L("title", "Decoding one normal-map texel")}
      head={<Btn active={flip} onClick={() => setFlip(v => !v)}>{flip ? "☑" : "☐"} {L("flip", "shader flips green (DirectX map)")}</Btn>}
      controls={<>
        <Sliders>
          <Slider label={L("azimuth", "light azimuth")} value={az} min={0} max={359} step={1} onChange={setAz} fmt={v => `${v}°`} />
          <Slider label={L("elevation", "light elevation")} value={el} min={5} max={90} step={1} onChange={setEl} fmt={v => `${v}°`} />
        </Sliders>
        <Row>
          <Readout color={C.muted}>{L("flat", "flat normal")} N·L = {f2(flat, 3)}</Readout>
          <Readout color={C.green}>{L("mapped", "mapped normal")} n·L = {f2(mapped, 3)}</Readout>
          <Readout>{L("tilt", "tilt from N")} {f2((Math.acos(Math.min(1, nt[2])) * 180) / Math.PI, 1)}°</Readout>
        </Row>
      </>}
      note={L("note", "The centre of the disk is the flat normal (0, 0, 1), stored as (128, 128, 255): the lavender of every normal map. Moving right tilts the normal toward +u and adds red, moving up tilts it toward +v and adds green. Note that 128 decodes to 0.0039, not 0, because 8 bits cannot store 0.5 exactly; that is one reason the shader normalises. Put the light on the side the normal leans toward (azimuth 0° for a dot on the right) and the mapped surface gets brighter than the flat one; move it to the other side (180°) and it gets darker. That light/dark pair along each bump is the whole illusion. Tick the flip with the dot up or down and the bump is lit from the wrong side.")}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <clipPath id="ndec-disk"><circle cx={CX} cy={CY} r={R} /></clipPath>
        <g clipPath="url(#ndec-disk)">{Array.from({ length: CELLS * CELLS }, (_, k) => {
          const i = k % CELLS, j = Math.floor(k / CELLS);
          const x = ((i + 0.5) / CELLS) * 2 - 1, y = 1 - ((j + 0.5) / CELLS) * 2;
          if (x * x + y * y > 1.1) return null;
          const zz = Math.sqrt(Math.max(0, 1 - x * x - y * y));
          return <rect key={k} x={CX - R + (i / CELLS) * 2 * R} y={CY - R + (j / CELLS) * 2 * R} width={(2 * R) / CELLS + 0.4} height={(2 * R) / CELLS + 0.4}
            fill={`rgb(${enc(x)},${enc(y)},${enc(zz)})`} />;
        })}</g>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke={C.axis} strokeWidth={1.5} />
        <line x1={CX - R} x2={CX + R} y1={CY} y2={CY} stroke="#000" strokeOpacity={0.25} />
        <line x1={CX} x2={CX} y1={CY - R} y2={CY + R} stroke="#000" strokeOpacity={0.25} />
        <T x={CX + R + 4} y={CY + 3} size={8.5}>+u</T>
        <T x={CX - 6} y={CY - R - 5} size={8.5}>+v</T>
        <line x1={CX} y1={CY} x2={CX + Math.cos(a) * R * Math.cos(e)} y2={CY - Math.sin(a) * R * Math.cos(e)} stroke={C.amber} strokeWidth={2.5} strokeDasharray="5 3" />
        <circle cx={CX + Math.cos(a) * R * Math.cos(e)} cy={CY - Math.sin(a) * R * Math.cos(e)} r={6} fill={C.amber} stroke="#000" strokeOpacity={0.4} />
        <Handle x={CX + n.x * R} y={CY - n.y * R} color="#111" active={drag.dragging === "n"} />
        {rows.map(([k, v, extra], i) => <g key={k}>
          <T x={262} y={34 + i * 26} size={9} color={C.muted}>{k}</T>
          <T x={372} y={34 + i * 26} size={10} color={C.fg}>{v}</T>
          {extra && <T x={372} y={46 + i * 26} size={8} color={i === 2 ? C.red : C.muted}>{extra}</T>}
        </g>)}
        <rect x={262} y={172} width={40} height={40} rx={4} fill={`rgb(${bytes.join(",")})`} stroke={C.axis} />
        <T x={282} y={226} size={8} anchor="middle">{L("texel", "texel")}</T>
        {[[flat, L("flatS", "flat")], [mapped, L("mappedS", "mapped")]].map(([d, label], i) => <g key={i}>
          <rect x={352 + i * 70} y={172} width={40} height={40} rx={4} fill={`rgb(${shade(d as number)},${shade(d as number)},${shade(d as number)})`} stroke={C.axis} />
          <T x={372 + i * 70} y={226} size={8} anchor="middle">{label as string}</T>
        </g>)}
      </svg>
    </Figure>
  );
}
