"use client";

import { useEffect, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Label } from "../../kit/svg";

// ── What this figure shows ────────────────────────────────────────────────────
// The CIE 1931 xy chromaticity diagram: every colour a human can see, with
// brightness factored out. The curved edge is pure spectral light (380–700 nm),
// the straight bottom edge the purples. A colour space's primaries are three
// points here, and it can only mix colours inside their triangle: its gamut.
// Colours outside sRGB are painted as the nearest colour your screen can show,
// because no sRGB display can show them.

// Spectral locus (CIE 1931 2°), x, y at selected wavelengths
const LOCUS: [number, number, number][] = [
  [380, 0.1741, 0.005], [420, 0.1714, 0.0051], [440, 0.1644, 0.0109], [450, 0.1566, 0.0177], [460, 0.144, 0.0297], [470, 0.1241, 0.0578],
  [475, 0.1096, 0.0868], [480, 0.0913, 0.1327], [485, 0.0687, 0.2007], [490, 0.0454, 0.295], [495, 0.0235, 0.4127], [500, 0.0082, 0.5384],
  [505, 0.0039, 0.6548], [510, 0.0139, 0.7502], [515, 0.0389, 0.812], [520, 0.0743, 0.8338], [525, 0.1142, 0.8262], [530, 0.1547, 0.8059],
  [540, 0.2296, 0.7543], [550, 0.3016, 0.6923], [560, 0.3731, 0.6245], [570, 0.4441, 0.5547], [580, 0.5125, 0.4866], [590, 0.5752, 0.4242],
  [600, 0.627, 0.3725], [610, 0.6658, 0.334], [620, 0.6915, 0.3083], [630, 0.7079, 0.292], [640, 0.719, 0.2809], [650, 0.726, 0.274], [700, 0.7347, 0.2653],
];
const GAMUTS = [
  { id: "sRGB / Rec.709", color: "#ffffff", p: [[0.64, 0.33], [0.3, 0.6], [0.15, 0.06]] },
  { id: "Display P3", color: "#f59e0b", p: [[0.68, 0.32], [0.265, 0.69], [0.15, 0.06]] },
  { id: "Rec.2020", color: "#22c55e", p: [[0.708, 0.292], [0.17, 0.797], [0.131, 0.046]] },
  { id: "ACEScg (AP1)", color: "#a855f7", p: [[0.713, 0.293], [0.165, 0.83], [0.128, 0.044]] },
] as const;
const D65 = [0.3127, 0.329];
const W = 380, H = 400, PAD = 34, SX = (W - 2 * PAD) / 0.8, SY = (H - 2 * PAD) / 0.9;
const X = (x: number) => PAD + x * SX, Y = (y: number) => H - PAD - y * SY;

const inPoly = (x: number, y: number, poly: number[][]) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const area = (p: readonly (readonly number[])[]) => Math.abs(p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + a[0] * b[1] - b[0] * a[1]; }, 0)) / 2;
const LOCUS_XY = LOCUS.map(([, x, y]) => [x, y]);

export function ChromaticityFigure({ t }: { t?: TrackTranslations }) {
  const [on, setOn] = useState<Record<string, boolean>>({ "sRGB / Rec.709": true, "Display P3": true, "Rec.2020": false, "ACEScg (AP1)": false });
  const [probe, setProbe] = useState<[number, number] | null>([0.17, 0.7]);
  const [img, setImg] = useState<string | null>(null);

  useEffect(() => {
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d");
    if (!g) return;
    const im = g.createImageData(W, H);
    for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
      const x = (px - PAD) / SX, y = (H - PAD - py) / SY;
      if (y <= 0.001 || !inPoly(x, y, LOCUS_XY)) continue;
      // xyY (Y = 1) → XYZ → linear sRGB
      const Xv = x / y, Zv = (1 - x - y) / y;
      let r = 3.2406 * Xv - 1.5372 - 0.4986 * Zv, gg = -0.9689 * Xv + 1.8758 + 0.0415 * Zv, b = 0.0557 * Xv - 0.204 + 1.057 * Zv;
      const lo = Math.min(r, gg, b);
      if (lo < 0) { r -= lo; gg -= lo; b -= lo; }                 // out of gamut: add white until displayable
      const hi = Math.max(r, gg, b);
      const enc = (v: number) => { v /= hi; return 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055); };
      im.data.set([enc(r), enc(gg), enc(b), 255], (py * W + px) * 4);
    }
    g.putImageData(im, 0, 0);
    setImg(c.toDataURL());
  }, []);

  const locusArea = area(LOCUS_XY);
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (((e.clientX - r.left) / r.width) * W - PAD) / SX, y = (H - PAD - ((e.clientY - r.top) / r.height) * H) / SY;
    setProbe([x, y]);
  };
  const visible = probe ? inPoly(probe[0], probe[1], LOCUS_XY) : false;

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figChroma_title", "The CIE 1931 Chromaticity Diagram and Common Gamuts")}
        </span>
      </div>
      <div className="grid md:grid-cols-[1fr_1fr] bg-[var(--code-bg)] border-b border-[var(--border)]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none cursor-crosshair" role="img" aria-label="Chromaticity diagram" onPointerMove={onMove}>
          {img && <image href={img} x={0} y={0} width={W} height={H} />}
          <polygon points={LOCUS.map(([, x, y]) => `${X(x)},${Y(y)}`).join(" ")} fill="none" stroke="var(--code-muted)" strokeWidth={1} />
          {[0, 0.2, 0.4, 0.6, 0.8].map(v => <text key={`x${v}`} x={X(v)} y={H - PAD + 14} textAnchor="middle" fontSize="8" fontFamily="monospace" fill="var(--code-muted)">{v}</text>)}
          {[0, 0.3, 0.6, 0.9].map(v => <text key={`y${v}`} x={PAD - 6} y={Y(v) + 3} textAnchor="end" fontSize="8" fontFamily="monospace" fill="var(--code-muted)">{v}</text>)}
          {LOCUS.filter(([nm]) => [460, 480, 500, 520, 540, 560, 580, 600, 620].includes(nm)).map(([nm, x, y]) => (
            <text key={nm} x={X(x) + (x < 0.2 ? -6 : 6)} y={Y(y) + 3} textAnchor={x < 0.2 ? "end" : "start"} fontSize="7.5" fontFamily="monospace" fill="var(--code-text)">{nm}</text>
          ))}
          {GAMUTS.filter(g => on[g.id]).map(g => (
            <polygon key={g.id} points={g.p.map(([x, y]) => `${X(x)},${Y(y)}`).join(" ")} fill="none" stroke={g.color} strokeWidth={1.8} />
          ))}
          <circle cx={X(D65[0])} cy={Y(D65[1])} r={3} fill="black" stroke="white" />
          <Label x={X(D65[0]) + 6} y={Y(D65[1]) + 12} size={7.5}>D65</Label>
          {probe && <circle cx={X(probe[0])} cy={Y(probe[1])} r={4} fill="none" stroke={visible ? "white" : "#ef4444"} strokeWidth={1.5} />}
          <text x={W - PAD} y={H - 6} textAnchor="end" fontSize="8" fontFamily="monospace" fill="var(--code-muted)">x →</text>
          <text x={8} y={PAD - 12} fontSize="8" fontFamily="monospace" fill="var(--code-muted)">y ↑</text>
        </svg>
        <div className="p-4 space-y-3 border-t md:border-t-0 md:border-l border-[var(--code-border)]">
          {GAMUTS.map(g => {
            const inside = probe ? inPoly(probe[0], probe[1], g.p.map(q => [...q])) : false;
            return (
              <label key={g.id} className="flex items-center gap-2 text-[10.5px] font-mono text-[var(--code-text)]">
                <input type="checkbox" checked={on[g.id]} onChange={e => setOn(o => ({ ...o, [g.id]: e.target.checked }))} className="accent-[var(--primary)]" />
                <span className="w-3 h-0.5" style={{ background: g.color }} />
                <span className="flex-1">{g.id}</span>
                <span className="text-[var(--code-muted)]">{((area(g.p) / locusArea) * 100).toFixed(0)}%</span>
                {probe && visible && <span className={inside ? "text-[#22c55e]" : "text-red-400"}>{inside ? "✓" : "✗"}</span>}
              </label>
            );
          })}
          <div className="font-mono text-[10.5px] text-[var(--code-text)] rounded border border-[var(--code-border)] p-2">
            {probe ? <>xy = ({probe[0].toFixed(3)}, {probe[1].toFixed(3)}) {visible ? "" : <span className="text-red-400">· {tx(t, "figChroma_invisible", "not a real colour")}</span>}</> : "—"}
            <div className="text-[var(--code-muted)] mt-1">{tx(t, "figChroma_pct", "% = share of the xy area of visible colours (xy area is not perceptually uniform)")}</div>
          </div>
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            {tx(t, "figChroma_note", "Move the pointer over the diagram: ✓ marks the spaces that can represent that chromaticity. sRGB, the space almost every texture and monitor uses, covers barely a third of what we can see, and saturated cyans and greens fall far outside it. Rec.2020 (HDR TV) and ACEScg reach much further. ACEScg's primaries sit on or beyond the spectral locus on purpose: a working space for maths, not a display.")}
          </p>
        </div>
      </div>
    </figure>
  );
}
