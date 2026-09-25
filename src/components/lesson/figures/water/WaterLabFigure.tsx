"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { compileProgram } from "../../kit/gl/gl";
import { FULL_VS, drawFullscreen } from "../../kit/gl/glx";
import { GLView, useAnimationTime, type Look } from "../../kit/gl/GLView";
import { useVisible } from "../../kit/figure";
import { loadPhotos, bindPhotos, type PhotoList } from "./photoTextures";
import { DEFAULT_SKY_PARAMS, type SkyParams } from "../sky/proceduralSky";
import {
  WATER_FS, WATER_PRESETS, WATER_COLOURS, DEFAULT_WATER, MAX_WAVES, waterUniforms, applyUniforms, type WaterParams,
} from "./waterShader";

// ── What this figure shows ────────────────────────────────────────────────────
// The chapter's water, assembled: a traced Gerstner surface with every term
// the text derives. Terms can be switched off, and the debug views show the
// quantities behind them (normals, the Jacobian, water thickness, caustics,
// Fresnel). It only animates while it is on screen.

// Photo textures for the bed, in shader sampler order (see photoTextures.ts)
const TEX: PhotoList = [
  ["uSandA", "mat:groundsand:albedo"], ["uSandN", "mat:groundsand:normal"], ["uSandAO", "mat:groundsand:ao"],
  ["uPoolA", "mat:squareceramicglossytile-aqua-blue:albedo"], ["uPoolN", "mat:squareceramicglossytile-aqua-blue:normal"],
];
const GROUPS = [[0, 1, 2], [3, 4]];

type Res = { prog: WebGLProgram; vao: WebGLVertexArrayObject; tex: (WebGLTexture | null)[] };
type Tab = "waves" | "water" | "effects" | "sky";

const VIEWS = ["final", "normals", "Jacobian J", "thickness", "caustics", "Fresnel"] as const;
const QUALITY: [string, number][] = [["low", 0.4], ["medium", 0.6], ["high", 1]];

export function WaterLabFigure({ t }: { t?: TrackTranslations }) {
  const first = WATER_PRESETS[0];
  const [look, setLook] = useState<Look>({ yaw: 1.2, pitch: -0.1, fov: 1.2 });
  const [w, setW] = useState<WaterParams>({ ...DEFAULT_WATER, ...first.water });
  const [sky, setSky] = useState<SkyParams>({ ...DEFAULT_SKY_PARAMS, ...first.sky });
  const [preset, setPreset] = useState(first.id);
  const [tab, setTab] = useState<Tab>("waves");
  const [quality, setQuality] = useState(0.6);
  const [playing, setPlaying] = useState(true);
  const { ref: figRef, on: inView } = useVisible<HTMLElement>();
  const time = useAnimationTime(playing && inView);
  const [aspect, setAspect] = useState(16 / 9);

  const setWater = <K extends keyof WaterParams>(k: K, v: WaterParams[K]) => { setW(o => ({ ...o, [k]: v })); setPreset(""); };
  const setSk = <K extends keyof SkyParams>(k: K, v: SkyParams[K]) => { setSky(o => ({ ...o, [k]: v })); setPreset(""); };
  const loadPreset = (id: string) => {
    const p = WATER_PRESETS.find(x => x.id === id)!;
    setW(o => ({ ...DEFAULT_WATER, ...p.water, terms: o.terms, view: o.view, speed: o.speed }));
    setSky({ ...DEFAULT_SKY_PARAMS, ...p.sky });
    setPreset(id);
  };

  const [texReady, setTexReady] = useState(0);        // bumps as textures arrive, so a paused view redraws
  const init = (gl: WebGL2RenderingContext): Res => ({
    prog: compileProgram(gl, FULL_VS, WATER_FS), vao: gl.createVertexArray()!,
    tex: loadPhotos(gl, TEX, () => setTexReady(n => n + 1)),
  });
  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    if (size.aspect !== aspect) setAspect(size.aspect);
    gl.viewport(0, 0, size.w, size.h);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(r.prog);
    applyUniforms(gl, r.prog, waterUniforms(w, sky, look, size.aspect, time + 3));
    gl.uniform1f(gl.getUniformLocation(r.prog, "uPix"), 2 * Math.tan(look.fov / 2) / size.h);
    bindPhotos(gl, r.prog, TEX, r.tex, "uHave", GROUPS);
    drawFullscreen(gl, r.vao);
  };

  const btn = (active: boolean) =>
    `px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all ${active
      ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]"
      : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40"}`;
  const slider = (label: string, value: number, onChange: (v: number) => void, min: number, max: number, step: number, unit = "") => (
    <label key={label} className="flex items-center gap-2">
      <span className="text-[9px] font-mono text-[var(--text-muted)] w-24 shrink-0">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))} className="flex-1 min-w-0 accent-[var(--primary)]" />
      <span className="text-[10px] font-mono text-[var(--primary)] w-14 text-right">{+value.toFixed(2)}{unit}</span>
    </label>
  );
  const term = (k: keyof WaterParams["terms"], label: string) => (
    <button key={k} className={btn(w.terms[k])} onClick={() => setW(o => ({ ...o, terms: { ...o.terms, [k]: !o.terms[k] } }))}>
      {w.terms[k] ? "✓ " : ""}{label}
    </button>
  );

  const notes: Record<number, [string, string]> = {
    0: ["figWater_n0", "Every pixel is one ray: find where it meets the waves, then mix what the surface reflects and what it lets through by Fresnel's ratio. Switch terms off to see what each one adds."],
    1: ["figWater_n1", "The exact normal from the Gerstner tangents, plus small ripples that only exist in the normal. Colours are the normal's x, y, z mapped to red, green, blue."],
    2: ["figWater_n2", "J is how much a patch of the calm surface is stretched (J > 1, white) or squeezed (J < 1, grey) by the horizontal Gerstner motion. Red: J < 0, the surface has folded over itself. That is where waves break, so that is where foam goes."],
    3: ["figWater_n3", "Length of water the refracted ray crosses before hitting the bed. Beer–Lambert turns it into colour: the longer the path, the more red and green are absorbed."],
    4: ["figWater_n4", "Sunlight through a curved surface converges under crests and spreads under troughs. The brightness is the inverse of how much a small beam's area changes on its way down, a determinant of the refraction map's Jacobian."],
    5: ["figWater_n5", "Schlick's Fresnel for water: only 2% reflection looking straight down, rising to 100% at grazing angles. That is why the distant sea is a mirror of the sky and the water at your feet is transparent."],
  };
  const note = notes[w.view];
  const colourId = WATER_COLOURS.find(c => c.absorb.every((v, i) => v === w.absorb[i]))?.id;

  return (
    <figure ref={figRef} className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figWater_title", "Water Lab")}
        </span>
        <div className="flex gap-1.5 flex-wrap">
          {WATER_PRESETS.map(p => <button key={p.id} className={btn(preset === p.id)} onClick={() => loadPreset(p.id)}>{p.label}</button>)}
        </div>
      </div>

      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> init={init} draw={draw} look={look} onLook={setLook} resolution={quality}
          frame={[look, w, sky, time, aspect, texReady]} aspect={16 / 9} fovRange={[0.5, 1.8]} />
      </div>

      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap items-center">
          <button className={btn(playing)} onClick={() => setPlaying(v => !v)}>{playing ? "❚❚ pause" : "▶ play"}</button>
          <button className={btn(w.style === 0)} onClick={() => setWater("style", 0)}>{tx(t, "figWater_real", "realistic")}</button>
          <button className={btn(w.style === 1)} onClick={() => setWater("style", 1)}>{tx(t, "figWater_toon", "stylised")}</button>
          <span className="w-px h-5 bg-[var(--border)] mx-1" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{tx(t, "figWater_view", "view")}</span>
          {VIEWS.map((v, i) => <button key={v} className={btn(w.view === i)} onClick={() => setW(o => ({ ...o, view: i }))}>{v}</button>)}
        </div>
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{tx(t, "figWater_terms", "terms")}</span>
          {term("reflect", "reflection")}{term("refract", "refraction")}{term("sss", "crest glow")}{term("foam", "foam")}
          <span className="w-px h-5 bg-[var(--border)] mx-1" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{tx(t, "figWater_quality", "quality")}</span>
          {QUALITY.map(([l, q]) => <button key={l} className={btn(quality === q)} onClick={() => setQuality(q)}>{l}</button>)}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2 min-w-0">
            <div className="flex gap-1 border-b border-[var(--border)]">
              {([["waves", "Waves"], ["water", "Water"], ["effects", "Foam & light"], ["sky", "Sky & camera"]] as [Tab, string][]).map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)}
                  className={`px-2.5 py-1.5 text-[10px] font-semibold border-b-2 -mb-px ${tab === k ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-[var(--text-muted)] hover:text-[var(--primary)]"}`}>{l}</button>
              ))}
            </div>
            {tab === "waves" && <>
              {slider("wave height", w.amp, v => setWater("amp", v), 0, 3, 0.01, " m")}
              {slider("wavelength", w.wavelength, v => setWater("wavelength", v), 1, 80, 0.5, " m")}
              {slider("choppiness", w.chop, v => setWater("chop", v), 0, 4, 0.05)}
              {slider("wave count", w.waves, v => setWater("waves", v), 1, MAX_WAVES, 1)}
              {slider("wind direction", w.windDir, v => setWater("windDir", v), -180, 180, 1, "°")}
              {slider("spread", w.spread, v => setWater("spread", v), 0, 1, 0.01)}
              {slider("ripples", w.detail, v => setWater("detail", v), 0, 2, 0.01)}
              {slider("time speed", w.speed, v => setWater("speed", v), 0, 3, 0.05)}
            </>}
            {tab === "water" && <>
              <div className="flex gap-1.5 flex-wrap">
                {WATER_COLOURS.map(c => (
                  <button key={c.id} className={btn(colourId === c.id)} onClick={() => { setW(o => ({ ...o, absorb: c.absorb, scatter: c.scatter })); setPreset(""); }}>{c.label}</button>
                ))}
              </div>
              {slider("clarity", w.clarity, v => setWater("clarity", v), 0.2, 4, 0.05, "×")}
              {slider("depth", w.depth, v => setWater("depth", v), 0.5, 60, 0.1, " m")}
              {slider("beach slope", w.slope, v => setWater("slope", v), 0, 0.2, 0.005)}
              <div className="flex gap-1.5 flex-wrap items-center">
                <span className="text-[9px] font-mono text-[var(--text-muted)] w-24">sea bed</span>
                <button className={btn(w.bed === 0)} onClick={() => setWater("bed", 0)}>sand</button>
                <button className={btn(w.bed === 1)} onClick={() => setWater("bed", 1)}>pool tiles</button>
              </div>
              {w.style === 1 && slider("colour bands", w.bands, v => setWater("bands", v), 2, 8, 1)}
            </>}
            {tab === "effects" && <>
              {slider("crest foam", w.foam, v => setWater("foam", v), 0, 1.5, 0.01)}
              {slider("foam below J =", w.foamEdge, v => setWater("foamEdge", v), -0.5, 1.5, 0.01)}
              {slider("shore foam", w.shoreFoam, v => setWater("shoreFoam", v), 0, 1.5, 0.01)}
              {slider("caustics", w.caustics, v => setWater("caustics", v), 0, 2, 0.01)}
              {slider("crest glow", w.sss, v => setWater("sss", v), 0, 3, 0.01)}
              {slider("sun glints", w.glint, v => setWater("glint", v), 0, 3, 0.01)}
            </>}
            {tab === "sky" && <>
              {slider("sun elevation", sky.sunEl, v => setSk("sunEl", v), -10, 90, 1, "°")}
              {slider("sun azimuth", sky.sunAz, v => setSk("sunAz", v), -180, 180, 1, "°")}
              {slider("cloud cover", sky.cover, v => setSk("cover", v), 0, 1, 0.01)}
              {slider("exposure", sky.exposure, v => setSk("exposure", v), 0.2, 4, 0.05)}
              {slider("camera height", w.camHeight, v => setWater("camHeight", v), 0.5, 30, 0.1, " m")}
            </>}
          </div>
          <div className="space-y-2 min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{VIEWS[w.view]}</p>
            <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">{tx(t, note[0], note[1])}</p>
            <p className="text-[11px] font-mono text-[var(--text-muted)]">
              {tx(t, "figWater_hint", "drag to look · scroll to zoom · the lagoon and stylised presets have a beach to the right (+X)")}
            </p>
          </div>
        </div>
      </div>
    </figure>
  );
}
