"use client";

import { useEffect, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { drawPhongSphere, rgbCss, type RGB } from "./sphere";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// The colour we see is the light's colour multiplied, channel by channel, by
// the fraction of each channel the surface reflects. Whatever is not reflected
// is absorbed. Pick a light and a surface and watch the three channels.

const LIGHTS: [string, RGB][] = [
  ["white", [1, 1, 1]], ["warm", [1, 0.78, 0.5]], ["red", [1, 0.15, 0.15]], ["green", [0.2, 1, 0.3]], ["blue", [0.25, 0.4, 1]],
];
const SURFACES: [string, RGB][] = [
  ["coral", [1, 0.5, 0.31]], ["white", [0.9, 0.9, 0.9]], ["leaf", [0.25, 0.7, 0.2]], ["sky", [0.3, 0.55, 0.95]], ["grey", [0.5, 0.5, 0.5]],
];
const CH = ["R", "G", "B"] as const;
const CH_COL = ["#ef4444", "#22c55e", "#3b82f6"];

function ColorSliders({ value, onChange }: { value: RGB; onChange: (c: RGB) => void }) {
  return (
    <div className="space-y-1">
      {CH.map((ch, i) => (
        <label key={ch} className="flex items-center gap-2">
          <span className="text-[10px] font-mono w-3" style={{ color: CH_COL[i] }}>{ch}</span>
          <input type="range" min={0} max={1} step={0.01} value={value[i]}
            onChange={e => { const n = [...value] as RGB; n[i] = Number(e.target.value); onChange(n); }}
            className="flex-1" style={{ accentColor: CH_COL[i] }} />
          <span className="text-[10px] font-mono text-[var(--text-main)] w-9 text-right">{value[i].toFixed(2)}</span>
        </label>
      ))}
    </div>
  );
}

export function ColorMixFigure({ t }: { t?: TrackTranslations }) {
  const [light, setLight] = useState<RGB>([1, 1, 1]);
  const [surf, setSurf] = useState<RGB>([1, 0.5, 0.31]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const result: RGB = [light[0] * surf[0], light[1] * surf[1], light[2] * surf[2]];

  useEffect(() => {
    if (!canvas.current) return;
    drawPhongSphere(canvas.current,
      { ambient: surf, diffuse: surf, specular: [0.4, 0.4, 0.4], shininess: 32 },
      { dir: [-0.5, 0.6, 0.8], ambient: light.map(c => c * 0.12) as RGB, diffuse: light, specular: light });
  }, [light, surf]);

  // Ray diagram: incoming strands ∝ light, reflected strands ∝ light × surface
  const W = 300, H = 150, P = { x: 150, y: 122 };
  const strand = (i: number, k: number, out: boolean) => {
    const off = (i - 1) * 7;
    const a = out ? { x: P.x + off, y: P.y } : { x: 30 + off, y: 18 };
    const b = out ? { x: 270 + off, y: 18 } : { x: P.x + off, y: P.y };
    return <line key={`${out}${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={CH_COL[i]}
      strokeWidth={Math.max(0.4, k * 5)} strokeLinecap="round" opacity={0.25 + k * 0.75} />;
  };

  const preset = (items: [string, RGB][], cur: RGB, set: (c: RGB) => void) => (
    <div className="flex gap-1.5 flex-wrap">
      {items.map(([name, c]) => {
        const on = c.every((v, i) => Math.abs(v - cur[i]) < 0.005);
        return (
          <button key={name} onClick={() => set(c)}
            className={`flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono rounded-md border transition-all ${on
              ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]"
              : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`}>
            <span className="w-2.5 h-2.5 rounded-full border border-black/20" style={{ background: rgbCss(c) }} />{name}
          </button>
        );
      })}
    </div>
  );

  return (
    <FigureShell>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figColor_title", "Light × Surface — Where Colour Comes From")}
        </span>
      </div>

      <div className="grid md:grid-cols-[1fr_1.1fr]">
        <div className="bg-[var(--code-bg)] md:border-r border-b md:border-b-0 border-[var(--border)] p-4 flex flex-col items-center gap-3">
          <canvas ref={canvas} width={180} height={180} className="w-40 h-40" aria-label="Sphere under the chosen light" />
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[300px] h-auto">
            <rect x={60} y={P.y} width={180} height={14} rx={2} fill={rgbCss(surf)} opacity={0.85} />
            {[0, 1, 2].map(i => strand(i, light[i], false))}
            {[0, 1, 2].map(i => strand(i, result[i], true))}
            <text x={24} y={12} fill="var(--code-muted)" fontSize="9" fontFamily="monospace">{tx(t, "figColor_in", "light in")}</text>
            <text x={276} y={12} fill="var(--code-muted)" fontSize="9" fontFamily="monospace" textAnchor="end">{tx(t, "figColor_out", "reflected")}</text>
            <text x={150} y={147} fill="var(--code-muted)" fontSize="9" fontFamily="monospace" textAnchor="middle">{tx(t, "figColor_rest", "the rest is absorbed")}</text>
          </svg>
        </div>

        <div className="p-4 md:p-5 space-y-4 min-w-0">
          <div className="space-y-2">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{tx(t, "figColor_light", "Light colour")}</p>
            {preset(LIGHTS, light, setLight)}
            <ColorSliders value={light} onChange={setLight} />
          </div>
          <div className="space-y-2">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{tx(t, "figColor_surface", "Surface colour (what it reflects)")}</p>
            {preset(SURFACES, surf, setSurf)}
            <ColorSliders value={surf} onChange={setSurf} />
          </div>
          <div className="rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 font-mono text-[11px] space-y-1">
            {CH.map((ch, i) => (
              <div key={ch} className="flex items-center gap-2">
                <span className="w-3" style={{ color: CH_COL[i] }}>{ch}</span>
                <span className="text-[var(--code-text)]">{light[i].toFixed(2)} × {surf[i].toFixed(2)} =</span>
                <span className="font-bold" style={{ color: CH_COL[i] }}>{result[i].toFixed(2)}</span>
                <span className="flex-1 h-1.5 rounded-full bg-[var(--border)] overflow-hidden ml-1">
                  <span className="block h-full" style={{ width: `${result[i] * 100}%`, background: CH_COL[i] }} />
                </span>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-1 text-[var(--code-text)]">
              <span className="w-4 h-4 rounded border border-[var(--border)]" style={{ background: rgbCss(result) }} />
              vec3 result = lightColor * objectColor;
            </div>
          </div>
        </div>
      </div>
    </FigureShell>
  );
}
