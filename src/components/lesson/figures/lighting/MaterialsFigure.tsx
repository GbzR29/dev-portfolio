"use client";

import { useEffect, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { drawPhongSphere, rgbCss, type PhongMaterial, type RGB } from "./sphere";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// The classic OpenGL/VRML material table (the one LearnOpenGL uses), rendered
// with the exact Phong formula. Each material is four numbers per channel:
// how much ambient, diffuse and specular light it reflects, and how tight
// its highlight is.

type Mat = PhongMaterial & { name: string };
const m = (name: string, a: RGB, d: RGB, s: RGB, shin: number): Mat =>
  ({ name, ambient: a, diffuse: d, specular: s, shininess: shin * 128 });

export const MATERIALS: Mat[] = [
  m("emerald",   [0.0215, 0.1745, 0.0215],   [0.07568, 0.61424, 0.07568], [0.633, 0.727811, 0.633], 0.6),
  m("jade",      [0.135, 0.2225, 0.1575],    [0.54, 0.89, 0.63],          [0.316228, 0.316228, 0.316228], 0.1),
  m("obsidian",  [0.05375, 0.05, 0.06625],   [0.18275, 0.17, 0.22525],    [0.332741, 0.328634, 0.346435], 0.3),
  m("pearl",     [0.25, 0.20725, 0.20725],   [1, 0.829, 0.829],           [0.296648, 0.296648, 0.296648], 0.088),
  m("ruby",      [0.1745, 0.01175, 0.01175], [0.61424, 0.04136, 0.04136], [0.727811, 0.626959, 0.626959], 0.6),
  m("turquoise", [0.1, 0.18725, 0.1745],     [0.396, 0.74151, 0.69102],   [0.297254, 0.30829, 0.306678], 0.1),
  m("brass",     [0.329412, 0.223529, 0.027451], [0.780392, 0.568627, 0.113725], [0.992157, 0.941176, 0.807843], 0.21794872),
  m("bronze",    [0.2125, 0.1275, 0.054],    [0.714, 0.4284, 0.18144],    [0.393548, 0.271906, 0.166721], 0.2),
  m("chrome",    [0.25, 0.25, 0.25],         [0.4, 0.4, 0.4],             [0.774597, 0.774597, 0.774597], 0.6),
  m("copper",    [0.19125, 0.0735, 0.0225],  [0.7038, 0.27048, 0.0828],   [0.256777, 0.137622, 0.086014], 0.1),
  m("gold",      [0.24725, 0.1995, 0.0745],  [0.75164, 0.60648, 0.22648], [0.628281, 0.555802, 0.366065], 0.4),
  m("silver",    [0.19225, 0.19225, 0.19225], [0.50754, 0.50754, 0.50754], [0.508273, 0.508273, 0.508273], 0.4),
  m("red plastic",  [0, 0, 0],               [0.5, 0, 0],                 [0.7, 0.6, 0.6], 0.25),
  m("cyan plastic", [0, 0.1, 0.06],          [0, 0.50980392, 0.50980392], [0.50196078, 0.50196078, 0.50196078], 0.25),
  m("black rubber", [0.02, 0.02, 0.02],      [0.01, 0.01, 0.01],          [0.4, 0.4, 0.4], 0.078125),
  m("white rubber", [0.05, 0.05, 0.05],      [0.5, 0.5, 0.5],             [0.7, 0.7, 0.7], 0.078125),
];

const WHITE: RGB = [1, 1, 1];

function Swatch({ mat, selected, onClick }: { mat: Mat; selected: boolean; onClick: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) drawPhongSphere(ref.current, mat, { dir: [-0.5, 0.6, 0.75], ambient: WHITE, diffuse: WHITE, specular: WHITE });
  }, [mat]);
  return (
    <button onClick={onClick} title={mat.name}
      className={`flex flex-col items-center gap-0.5 p-1 rounded-lg border transition-all ${selected
        ? "border-[var(--primary)]/60 bg-[var(--primary-low)]" : "border-transparent hover:border-[var(--border)]"}`}>
      <canvas ref={ref} width={48} height={48} className="w-10 h-10" />
      <span className="text-[8.5px] font-mono text-[var(--text-muted)] leading-tight text-center">{mat.name}</span>
    </button>
  );
}

const f3 = (v: number) => v.toFixed(3);
const vec = (c: RGB) => `vec3(${c.map(f3).join(", ")})`;

export function MaterialsFigure({ t }: { t?: TrackTranslations }) {
  const [sel, setSel] = useState(10);            // gold
  const [az, setAz] = useState(-35);
  const [show, setShow] = useState({ a: true, d: true, s: true });
  const big = useRef<HTMLCanvasElement>(null);
  const mat = MATERIALS[sel];

  useEffect(() => {
    if (!big.current) return;
    const r = (az * Math.PI) / 180;
    const zero: RGB = [0, 0, 0];
    drawPhongSphere(big.current, mat, {
      dir: [Math.sin(r) * 0.8, 0.55, Math.cos(r) * 0.8],
      ambient: show.a ? WHITE : zero, diffuse: show.d ? WHITE : zero, specular: show.s ? WHITE : zero,
    });
  }, [mat, az, show]);

  const term = (k: "a" | "d" | "s", label: string, c: RGB) => (
    <button onClick={() => setShow(v => ({ ...v, [k]: !v[k] }))}
      className={`flex items-center gap-2 w-full text-left px-2 py-1 rounded-md border transition-all ${show[k]
        ? "border-[var(--border)]" : "border-transparent opacity-45 line-through"}`}>
      <span className="w-3.5 h-3.5 rounded-sm border border-black/20 flex-shrink-0" style={{ background: rgbCss(c, k === "a" ? 3 : 1) }} />
      <span className="text-[10.5px] font-mono text-[var(--text-main)]">{label}</span>
      <span className="ml-auto text-[10px] font-mono text-[var(--text-muted)]">{c.map(v => v.toFixed(2)).join(" ")}</span>
    </button>
  );

  return (
    <FigureShell>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figMat_title", "Materials — Four Numbers per Surface")}
        </span>
      </div>

      <div className="grid md:grid-cols-[auto_1fr]">
        <div className="bg-[var(--code-bg)] md:border-r border-b md:border-b-0 border-[var(--border)] p-4 flex flex-col items-center gap-2">
          <canvas ref={big} width={220} height={220} className="w-48 h-48" aria-label={`${mat.name} sphere`} />
          <p className="text-[12px] font-semibold text-[var(--text-main)] capitalize">{mat.name}</p>
          <label className="flex items-center gap-2 w-full">
            <span className="text-[9px] font-mono text-[var(--text-muted)] w-10">light</span>
            <input type="range" min={-80} max={80} step={1} value={az}
              onChange={e => setAz(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
          </label>
        </div>

        <div className="p-4 md:p-5 space-y-3 min-w-0">
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
            {MATERIALS.map((mm, i) => <Swatch key={mm.name} mat={mm} selected={i === sel} onClick={() => setSel(i)} />)}
          </div>
          <div className="space-y-1">
            {term("a", "ambient", mat.ambient)}
            {term("d", "diffuse", mat.diffuse)}
            {term("s", "specular", mat.specular)}
            <div className="flex items-center gap-2 px-2 py-1 text-[10.5px] font-mono">
              <span className="text-[var(--text-main)]">shininess</span>
              <span className="ml-auto text-[var(--text-muted)]">{mat.shininess.toFixed(1)}</span>
            </div>
          </div>
          <pre className="text-[10px] font-mono rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 overflow-x-auto leading-relaxed text-[var(--code-text)]">
{`material.ambient   = ${vec(mat.ambient)};
material.diffuse   = ${vec(mat.diffuse)};
material.specular  = ${vec(mat.specular)};
material.shininess = ${mat.shininess.toFixed(1)};`}
          </pre>
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            {tx(t, "figMat_note", "Click the terms to switch them off. Metals (gold, copper, chrome) have a specular colour close to their diffuse colour and a tight highlight; plastics have a white, broad one; rubber barely reflects at all. The shininess in the table is stored as 0–1 and multiplied by 128 here, as the original GL spec did.")}
          </p>
        </div>
      </div>
    </FigureShell>
  );
}
