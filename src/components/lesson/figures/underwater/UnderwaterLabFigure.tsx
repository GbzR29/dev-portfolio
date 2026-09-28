"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { compileProgram } from "../../kit/gl/gl";
import { FULL_VS, drawFullscreen } from "../../kit/gl/glx";
import { GLView, useAnimationTime, type Look } from "../../kit/gl/GLView";
import { useVisible } from "../../kit/figure";
import { DEFAULT_SKY_PARAMS, type SkyParams } from "../sky/proceduralSky";
import { loadPhotos, bindPhotos, BED_PHOTOS, BED_GROUPS } from "../water/photoTextures";
import { DEFAULT_WATER, WATER_COLOURS, type WaterParams } from "../water/waterParams";
import { WATER_VS, WATER_FS, BACKGROUND_FS } from "../water/waterShader";
import { applyUniforms } from "../water/waterCommon";
import { ringGrid, drawGrid, deleteGrid, type WaterGrid } from "../water/waterGrid";
import { PROBE_FS, makeSkyProbe, renderSkyProbe, bindSkyProbe, type SkyProbe } from "../water/skyProbe";
import { UNDER_SURFACE_FS, UNDER_BG_FS, underUniforms, type UnderParams } from "./underwaterShader";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// The Water Lab's waves and bed, with the camera under the surface: Snell's
// window overhead, total internal reflection around it, the water's own
// colour and fog, light shafts under the caustics, and caustics on the bed.
// The camera can rise out of the water, where the Water Lab's shaders take over.

type Params = { water: WaterParams; under: UnderParams };
type Preset = { id: string; label: string; water: Partial<WaterParams>; turbid: number; sky: Partial<SkyParams>; look: Look };

const PRESETS: Preset[] = [
  { id: "lagoon", label: "Lagoon",
    water: { amp: 0.12, wavelength: 9, chop: 0.8, waves: 7, windDir: -30, spread: 0.6, detail: 0.7,
      absorb: [0.32, 0.055, 0.06], scatter: [0.01, 0.07, 0.07], clarity: 1.4, depth: 5, slope: 0.08, bed: 0, caustics: 1, camHeight: -2.5 },
    turbid: 0.08, sky: { sunEl: 55, sunAz: 150, cover: 0.3 }, look: { yaw: 1.4, pitch: 0.3, fov: 1.25 } },
  { id: "pool", label: "Swimming pool",
    water: { amp: 0.025, wavelength: 2.2, chop: 0.5, waves: 6, windDir: 40, spread: 0.9, detail: 0.5,
      absorb: [0.3, 0.05, 0.04], scatter: [0.0, 0.03, 0.05], clarity: 2.5, depth: 2, slope: 0, bed: 1, caustics: 1.2, camHeight: -1.2 },
    turbid: 0.03, sky: { sunEl: 62, sunAz: 30, cover: 0.2 }, look: { yaw: 0.6, pitch: -0.05, fov: 1.3 } },
  { id: "ocean", label: "Open ocean",
    water: { amp: 0.8, wavelength: 30, chop: 2, waves: 8, windDir: 20, spread: 0.55, detail: 0.6,
      absorb: [0.45, 0.075, 0.05], scatter: [0.0, 0.018, 0.045], clarity: 1.5, depth: 200, slope: 0, bed: 0, caustics: 1, camHeight: -6 },
    turbid: 0.05, sky: { sunEl: 50, sunAz: 70, cover: 0.3 }, look: { yaw: 1.0, pitch: 0.35, fov: 1.3 } },
  { id: "lake", label: "Green lake",
    water: { amp: 0.06, wavelength: 6, chop: 0.6, waves: 6, windDir: 10, spread: 0.7, detail: 0.5,
      absorb: [0.4, 0.1, 0.25], scatter: [0.025, 0.06, 0.025], clarity: 0.8, depth: 6, slope: 0.05, bed: 0, caustics: 0.8, camHeight: -2 },
    turbid: 0.2, sky: { sunEl: 40, sunAz: 120, cover: 0.5 }, look: { yaw: 1.2, pitch: 0.05, fov: 1.25 } },
];
const first = PRESETS[0];
const withPreset = (x: Preset, w: WaterParams): WaterParams => ({ ...DEFAULT_WATER, foam: 0, shoreFoam: 0.4, ...x.water, speed: w.speed, view: w.view });
const DEFAULT: Params = {
  water: withPreset(first, DEFAULT_WATER),
  under: { turbid: first.turbid, shafts: 1, terms: { fog: true, shafts: true, caustics: true, mirror: true } },
};

type Res = {
  surf: WebGLProgram; bg: WebGLProgram; water: WebGLProgram; beach: WebGLProgram; probeProg: WebGLProgram;
  probe: SkyProbe; vao: WebGLVertexArrayObject; grid: WaterGrid; tex: (WebGLTexture | null)[];
};
type Tab = "water" | "light" | "waves" | "sky";
const VIEWS = ["final", "Snell's window", "scattered light", "caustics"] as const;
// Above the surface the Water Lab's views stand in: final, Fresnel, final, caustics
const ABOVE_VIEW = [0, 5, 0, 4];
const QUALITY: [string, number][] = [["low", 0.4], ["medium", 0.6], ["high", 1]];
const gridHeight = (camHeight: number) => Math.max(0.5, Math.round(Math.abs(camHeight) * 2) / 2);

export function UnderwaterLabFigure({ t }: { t?: TrackTranslations }) {
  const [look, setLook] = useState<Look>(first.look);
  const [p, setP] = useState<Params>(DEFAULT);
  const [sky, setSky] = useState<SkyParams>({ ...DEFAULT_SKY_PARAMS, ...first.sky, model: 1 });
  const [preset, setPreset] = useState(first.id);
  const [tab, setTab] = useState<Tab>("water");
  const [quality, setQuality] = useState(0.6);
  const [playing, setPlaying] = useState(true);
  const [texReady, setTexReady] = useState(0);
  const { ref: figRef, on: inView } = useVisible<HTMLElement>();
  const time = useAnimationTime(playing && inView);
  const w = p.water, u = p.under;

  const setWater = <K extends keyof WaterParams>(k: K, v: WaterParams[K]) => { setP(o => ({ ...o, water: { ...o.water, [k]: v } })); setPreset(""); };
  const setUnder = <K extends keyof UnderParams>(k: K, v: UnderParams[K]) => { setP(o => ({ ...o, under: { ...o.under, [k]: v } })); setPreset(""); };
  const setSk = <K extends keyof SkyParams>(k: K, v: SkyParams[K]) => { setSky(o => ({ ...o, [k]: v })); setPreset(""); };
  const loadPreset = (id: string) => {
    const x = PRESETS.find(q => q.id === id)!;
    setP(o => ({ water: withPreset(x, o.water), under: { ...o.under, turbid: x.turbid } }));
    setSky({ ...DEFAULT_SKY_PARAMS, ...x.sky, model: 1 });
    setLook(x.look);
    setPreset(id);
  };

  const init = (gl: WebGL2RenderingContext): Res => ({
    surf: compileProgram(gl, WATER_VS, UNDER_SURFACE_FS), bg: compileProgram(gl, FULL_VS, UNDER_BG_FS),
    water: compileProgram(gl, WATER_VS, WATER_FS), beach: compileProgram(gl, FULL_VS, BACKGROUND_FS),
    probeProg: compileProgram(gl, FULL_VS, PROBE_FS), probe: makeSkyProbe(gl),
    vao: gl.createVertexArray()!, grid: ringGrid(gl, gridHeight(w.camHeight)),
    tex: loadPhotos(gl, BED_PHOTOS, () => setTexReady(n => n + 1)),
  });
  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    const gh = gridHeight(w.camHeight);
    if (r.grid.height !== gh) { deleteGrid(gl, r.grid); r.grid = ringGrid(gl, gh); }
    const { set, under } = underUniforms(w, u, sky, look, size.aspect, time + 3, r.grid);
    if (!under) set.i1.uView = ABOVE_VIEW[w.view];
    const pix = 2 * Math.tan(look.fov / 2) / size.h;
    // 1. The sky, once, into the probe the surface reflects (above) or lets through (below)
    gl.useProgram(r.probeProg);
    applyUniforms(gl, r.probeProg, set);
    renderSkyProbe(gl, r.probe, r.probeProg, () => drawFullscreen(gl, r.vao));

    gl.viewport(0, 0, size.w, size.h);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    const pass = (prog: WebGLProgram) => {
      gl.useProgram(prog);
      applyUniforms(gl, prog, set);
      gl.uniform1f(gl.getUniformLocation(prog, "uPix"), pix);
      bindPhotos(gl, prog, BED_PHOTOS, r.tex, "uHave", BED_GROUPS);
      bindSkyProbe(gl, prog, r.probe, BED_PHOTOS.length);
    };
    // 2. Background (bed and open water, or sky and beach), writing the bed's depth
    pass(under ? r.bg : r.beach);
    gl.depthFunc(gl.ALWAYS);
    drawFullscreen(gl, r.vao);
    // 3. The surface mesh, hidden behind the bed
    pass(under ? r.surf : r.water);
    gl.depthFunc(gl.LESS);
    drawGrid(gl, r.grid);
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
  const term = (k: keyof UnderParams["terms"], label: string) => (
    <button key={k} className={btn(u.terms[k])} onClick={() => setUnder("terms", { ...u.terms, [k]: !u.terms[k] })}>
      {u.terms[k] ? "✓ " : ""}{label}
    </button>
  );
  const label = (s: string) => <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{s}</span>;
  const colourId = WATER_COLOURS.find(c => c.absorb.every((v, i) => v === w.absorb[i]))?.id;
  // Visibility: the distance at which the least absorbed colour is down to 5%
  const clearest = Math.min(...w.absorb.map(a => a / Math.max(0.05, w.clarity))) + u.turbid;
  const underNow = w.camHeight < 0;

  const notes: Record<number, [string, string]> = {
    0: ["figUnder_n0", "Look up: the sky is squeezed into a bright disc overhead, Snell's window, and around it the surface is a mirror of the water below. Look sideways: the water fades to its own colour. Switch the terms off to see what each one adds."],
    1: ["figUnder_n1", "Green: light from the air gets through the surface (yellow where Fresnel already reflects much of it). Red: the ray meets the surface at more than 48.6° from its normal and is reflected completely. The waves tilt the normal, so the window's edge wobbles."],
    2: ["figUnder_n2", "Only the light the water scatters toward the eye, with the surfaces removed. The bright streaks are the caustics seen from the side: sunlight focused by the crests, lighting up the particles along its way down."],
    3: ["figUnder_n3", "The caustic intensity on the bed: the inverse of how much a thin beam of sunlight is stretched on its way down. The pattern is filtered to the pixel size, so far away it fades to its average instead of shimmering."],
  };
  const note = notes[w.view];

  return (
    <FigureShell ref={figRef}>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figUnder_title", "Underwater Lab")}
        </span>
        <div className="flex gap-1.5 flex-wrap">
          {PRESETS.map(x => <button key={x.id} className={btn(preset === x.id)} onClick={() => loadPreset(x.id)}>{x.label}</button>)}
        </div>
      </div>

      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> init={init} draw={draw} look={look} onLook={setLook} resolution={quality}
          frame={[look, p, sky, time, texReady]} aspect={16 / 9} fovRange={[0.5, 1.9]} />
      </div>

      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap items-center">
          <button className={btn(playing)} onClick={() => setPlaying(v => !v)}>{playing ? "❚❚ pause" : "▶ play"}</button>
          <span className="w-px h-5 bg-[var(--border)] mx-1" />
          {label(tx(t, "figWater_view", "view"))}
          {VIEWS.map((v, i) => <button key={v} className={btn(w.view === i)} onClick={() => setP(o => ({ ...o, water: { ...o.water, view: i } }))}>{v}</button>)}
        </div>
        <div className="flex gap-1.5 flex-wrap items-center">
          {label(tx(t, "figWater_terms", "terms"))}
          {term("fog", "fog")}{term("shafts", "light shafts")}{term("caustics", "caustics")}{term("mirror", "reflection below")}
          <span className="w-px h-5 bg-[var(--border)] mx-1" />
          {label(tx(t, "figWater_quality", "quality"))}
          {QUALITY.map(([l, q]) => <button key={l} className={btn(quality === q)} onClick={() => setQuality(q)}>{l}</button>)}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2 min-w-0">
            <div className="flex gap-1 border-b border-[var(--border)]">
              {([["water", "Water"], ["light", "Light"], ["waves", "Waves"], ["sky", "Sky & camera"]] as [Tab, string][]).map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)}
                  className={`px-2.5 py-1.5 text-[10px] font-semibold border-b-2 -mb-px ${tab === k ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-[var(--text-muted)] hover:text-[var(--primary)]"}`}>{l}</button>
              ))}
            </div>
            {tab === "water" && <>
              <div className="flex gap-1.5 flex-wrap">
                {WATER_COLOURS.map(c => (
                  <button key={c.id} className={btn(colourId === c.id)} onClick={() => { setP(o => ({ ...o, water: { ...o.water, absorb: c.absorb, scatter: c.scatter } })); setPreset(""); }}>{c.label}</button>
                ))}
              </div>
              {slider("clarity", w.clarity, v => setWater("clarity", v), 0.2, 4, 0.05, "×")}
              {slider("turbidity σs", u.turbid, v => setUnder("turbid", v), 0, 0.8, 0.005, "/m")}
              {slider("depth", w.depth, v => { setWater("depth", v); if (w.camHeight < -v + 0.2) setWater("camHeight", -v + 0.2); }, 1, 200, 0.5, " m")}
              {slider("beach slope", w.slope, v => setWater("slope", v), 0, 0.2, 0.005)}
              <div className="flex gap-1.5 flex-wrap items-center">
                <span className="text-[9px] font-mono text-[var(--text-muted)] w-24">sea bed</span>
                <button className={btn(w.bed === 0)} onClick={() => setWater("bed", 0)}>sand</button>
                <button className={btn(w.bed === 1)} onClick={() => setWater("bed", 1)}>pool tiles</button>
              </div>
            </>}
            {tab === "light" && <>
              {slider("shaft contrast", u.shafts, v => setUnder("shafts", v), 0, 2, 0.01)}
              {slider("bed caustics", w.caustics, v => setWater("caustics", v), 0, 2, 0.01)}
              {slider("sun elevation", sky.sunEl, v => setSk("sunEl", v), 2, 90, 1, "°")}
              {slider("sun azimuth", sky.sunAz, v => setSk("sunAz", v), -180, 180, 1, "°")}
              {slider("cloud cover", sky.cover, v => setSk("cover", v), 0, 1, 0.01)}
              {slider("exposure", sky.exposure, v => setSk("exposure", v), 0.2, 6, 0.05)}
            </>}
            {tab === "waves" && <>
              {slider("wave height", w.amp, v => setWater("amp", v), 0, 1.5, 0.005, " m")}
              {slider("wavelength", w.wavelength, v => setWater("wavelength", v), 1, 60, 0.5, " m")}
              {slider("choppiness", w.chop, v => setWater("chop", v), 0, 3, 0.05)}
              {slider("ripples", w.detail, v => setWater("detail", v), 0, 2, 0.01)}
              {slider("time speed", w.speed, v => setWater("speed", v), 0, 3, 0.05)}
            </>}
            {tab === "sky" && <>
              {slider("camera height", w.camHeight, v => setWater("camHeight", v), -Math.min(w.depth - 0.2, 40), 4, 0.05, " m")}
              <p className="text-[11px] text-[var(--text-muted)]">{tx(t, "figUnder_camNote", "Below 0 the camera is under water. Drag it above the surface to switch to the Water Lab's view of the same scene.")}</p>
            </>}
          </div>
          <div className="space-y-2 min-w-0">
            <div className="flex gap-1.5 flex-wrap">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[var(--text-main)]">
                {underNow ? tx(t, "figUnder_below", "under water") : tx(t, "figUnder_above", "above water")}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[var(--text-main)]">
                {tx(t, "figUnder_vis", "visibility")} ≈ {(3 / clearest).toFixed(0)} m
              </span>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{VIEWS[w.view]}</p>
            <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">{tx(t, note[0], note[1])}</p>
            <p className="text-[11px] font-mono text-[var(--text-muted)]">
              {tx(t, "figUnder_hint", "drag to look · scroll to zoom · visibility is where the clearest colour is down to 5% (3 / σt)")}
            </p>
          </div>
        </div>
      </div>
    </FigureShell>
  );
}
