"use client";

import { useEffect, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

// ── What this figure shows ────────────────────────────────────────────────────
// 1. A test you run on your own screen: a fine black/white checker emits 50%
//    light; the flat swatch that matches it is ~0.735, not 0.5.
// 2. The curves: what the display does (x^2.2), the inverse the shader
//    applies, and the exact sRGB transfer function.
// 3. Lighting maths done in the wrong space, the right one, and twice.

type Tab = "test" | "curves" | "light";

const srgbToLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const linearToSrgb = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

// ── 1. The checker test ───────────────────────────────────────────────────────
function CheckerTest({ t }: { t?: TrackTranslations }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    // Draw at device resolution so each checker cell is ONE physical pixel
    const dpr = window.devicePixelRatio || 1;
    const css = 140;
    c.width = c.height = Math.round(css * dpr);
    c.style.width = c.style.height = `${css}px`;
    const g = c.getContext("2d")!;
    const img = g.createImageData(c.width, c.height);
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
      const v = (x + y) % 2 ? 255 : 0, o = (y * c.width + x) * 4;
      img.data[o] = img.data[o + 1] = img.data[o + 2] = v; img.data[o + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }, []);
  const sw = (v: number, label: string) => (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-[140px] h-[140px] rounded" style={{ background: `rgb(${Math.round(v * 255)},${Math.round(v * 255)},${Math.round(v * 255)})` }} />
      <span className="text-[10px] font-mono text-[var(--text-main)]">{label}</span>
    </div>
  );
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap justify-center gap-4 p-4 rounded-lg bg-[#16181d]">
        {sw(0.5, "0.5")}
        <div className="flex flex-col items-center gap-1.5">
          <canvas ref={ref} className="rounded" style={{ imageRendering: "pixelated" }} />
          <span className="text-[10px] font-mono text-[var(--text-main)]">50% light</span>
        </div>
        {sw(0.735, "0.735")}
      </div>
      <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">
        {tx(t, "figGamma_testNote", "The middle square alternates black and white pixels, so it emits exactly half the light of white. Step back or squint: it matches the 0.735 swatch, not 0.5. A pixel value of 0.5 produces only about 21% of the light — the monitor raises values to the power 2.2 before turning them into light.")}
      </p>
    </div>
  );
}

// ── 2. The curves ─────────────────────────────────────────────────────────────
function Curves({ t }: { t?: TrackTranslations }) {
  const [x, setX] = useState(0.5);
  const W = 300, H = 220, p = 30;
  const X = (v: number) => p + v * (W - p - 10), Y = (v: number) => H - p + 8 - v * (H - p - 10);
  const path = (f: (v: number) => number) => Array.from({ length: 101 }, (_, i) => `${i ? "L" : "M"} ${X(i / 100).toFixed(1)} ${Y(f(i / 100)).toFixed(1)}`).join(" ");
  const disp = Math.pow(x, 2.2), enc = Math.pow(x, 1 / 2.2);
  return (
    <div className="grid gap-4 md:grid-cols-[auto_1fr] items-start">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[320px] h-auto">
        <line x1={X(0)} y1={Y(0)} x2={X(1)} y2={Y(0)} stroke="var(--code-muted)" />
        <line x1={X(0)} y1={Y(0)} x2={X(0)} y2={Y(1)} stroke="var(--code-muted)" />
        <path d={path(v => v)} fill="none" stroke="var(--code-muted)" strokeDasharray="3 3" />
        <path d={path(v => Math.pow(v, 2.2))} fill="none" stroke="#ef4444" strokeWidth="2" />
        <path d={path(v => Math.pow(v, 1 / 2.2))} fill="none" stroke="#22c55e" strokeWidth="2" />
        <path d={path(linearToSrgb)} fill="none" stroke="#3b82f6" strokeWidth="1.3" strokeDasharray="5 2" />
        <line x1={X(x)} y1={Y(0)} x2={X(x)} y2={Y(1)} stroke="var(--text-main)" strokeWidth="0.8" />
        <circle cx={X(x)} cy={Y(disp)} r={3.5} fill="#ef4444" />
        <circle cx={X(x)} cy={Y(enc)} r={3.5} fill="#22c55e" />
        <text x={X(0.02)} y={Y(0.95)} fill="#22c55e" fontSize="9" fontFamily="monospace">encode x^(1/2.2)</text>
        <text x={X(0.55)} y={Y(0.12)} fill="#ef4444" fontSize="9" fontFamily="monospace">display x^2.2</text>
        <text x={X(0.02)} y={Y(0.83)} fill="#3b82f6" fontSize="9" fontFamily="monospace">exact sRGB</text>
        <text x={X(1)} y={Y(0) + 16} fill="var(--code-muted)" fontSize="8" fontFamily="monospace" textAnchor="end">value sent</text>
      </svg>
      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-6">x</span>
          <input type="range" min={0} max={1} step={0.01} value={x} onChange={e => setX(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
          <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{x.toFixed(2)}</span>
        </label>
        <div className="font-mono text-[11px] leading-6 text-[var(--text-main)]">
          <div><span className="text-red-400">display</span> {x.toFixed(2)}^2.2 = <b>{disp.toFixed(3)}</b> of full light</div>
          <div><span className="text-green-400">encode</span> {x.toFixed(2)}^(1/2.2) = <b>{enc.toFixed(3)}</b></div>
          <div><span className="text-blue-400">sRGB</span> {linearToSrgb(x).toFixed(3)} · back: {srgbToLinear(linearToSrgb(x)).toFixed(3)}</div>
        </div>
        <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">
          {tx(t, "figGamma_curveNote", "The two curves cancel out: encode with 1/2.2 and the display's 2.2 brings you back to the straight line. That round trip is the whole idea — do the maths on linear values, encode once at the very end.")}
        </p>
      </div>
    </div>
  );
}

// ── 3. Lighting in three spaces ───────────────────────────────────────────────
type Mode = "none" | "correct" | "double";
function LightStrips({ t }: { t?: TrackTranslations }) {
  const refs = { none: useRef<HTMLCanvasElement>(null), correct: useRef<HTMLCanvasElement>(null), double: useRef<HTMLCanvasElement>(null) };
  const [intensity, setIntensity] = useState(2.5);
  const albedoSrgb = [0.8, 0.45, 0.3];                                 // what the artist painted (sRGB)

  useEffect(() => {
    (Object.keys(refs) as Mode[]).forEach(mode => {
      const c = refs[mode].current;
      if (!c) return;
      const w = c.width, h = c.height;
      const g = c.getContext("2d")!;
      const img = g.createImageData(w, h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        // A floor seen from above, a point light 0.6 above its centre, 1/d² falloff
        const px = (x / w - 0.5) * 6, pz = (y / h - 0.5) * 3;
        const d2 = px * px + pz * pz + 0.36;
        const cos = 0.6 / Math.sqrt(d2);
        const light = (intensity * cos) / d2;
        const o = (y * w + x) * 4;
        for (let k = 0; k < 3; k++) {
          // "none": sRGB texture used as if linear, result sent raw
          // "correct": decode texture, light in linear, encode at the end
          // "double": decode is skipped but the output is encoded anyway
          const albedo = mode === "correct" ? srgbToLinear(albedoSrgb[k]) : albedoSrgb[k];
          const lin = Math.min(1, albedo * light);
          const out = mode === "none" ? lin : linearToSrgb(lin);
          img.data[o + k] = Math.round(Math.min(1, out) * 255);
        }
        img.data[o + 3] = 255;
      }
      g.putImageData(img, 0, 0);
    });
  }, [intensity]); // eslint-disable-line react-hooks/exhaustive-deps

  const strip = (mode: Mode, label: string, desc: string, color: string) => (
    <div className="space-y-1">
      <div className="flex items-baseline gap-2">
        <span className="text-[11px] font-mono font-bold" style={{ color }}>{label}</span>
        <span className="text-[11px] text-[var(--text-muted)]">{desc}</span>
      </div>
      <canvas ref={refs[mode]} width={420} height={90} className="w-full h-auto rounded border border-[var(--code-border)]" />
    </div>
  );
  return (
    <div className="space-y-3">
      {strip("none", "✗ no correction", tx(t, "figGamma_none", "lighting on sRGB values, output raw — falloff too harsh, dark and murky"), "#f87171")}
      {strip("correct", "✓ linear workflow", tx(t, "figGamma_correct", "decode the texture, light in linear, encode once"), "#4ade80")}
      {strip("double", "✗ double gamma", tx(t, "figGamma_double", "texture never decoded but the output is encoded — washed out"), "#fbbf24")}
      <label className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-[var(--text-muted)] w-16">light</span>
        <input type="range" min={0.5} max={6} step={0.1} value={intensity} onChange={e => setIntensity(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
        <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{intensity.toFixed(1)}</span>
      </label>
    </div>
  );
}

export function GammaFigure({ t }: { t?: TrackTranslations }) {
  const [tab, setTab] = useState<Tab>("test");
  const tabs: [Tab, string, string][] = [
    ["test", "figGamma_tTest", "50% grey test"], ["curves", "figGamma_tCurves", "Curves"], ["light", "figGamma_tLight", "Lighting"],
  ];
  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figGamma_title", "Gamma — Your Monitor Is Not Linear")}
        </span>
        <div className="flex gap-1.5">
          {tabs.map(([id, key, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all ${tab === id
                ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]"
                : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`}>{tx(t, key, label)}</button>
          ))}
        </div>
      </div>
      <div className="p-4 md:p-5">
        {tab === "test" ? <CheckerTest t={t} /> : tab === "curves" ? <Curves t={t} /> : <LightStrips t={t} />}
      </div>
    </figure>
  );
}
