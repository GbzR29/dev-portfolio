"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { compileProgram } from "../../kit/gl/gl";
import { FULL_VS, drawFullscreen } from "../../kit/gl/glx";
import { GLView, useAnimationTime, type Look } from "../../kit/gl/GLView";
import { useVisible } from "../../kit/figure";
import { DEFAULT_SKY_PARAMS, type SkyParams } from "../sky/proceduralSky";
import { DEFAULT_WATER, WATER_COLOURS, type WaterParams } from "../water/waterParams";
import { applyUniforms } from "../water/waterCommon";
import { ringGrid, drawGrid, deleteGrid, type WaterGrid } from "../water/waterGrid";
import { PROBE_FS, makeSkyProbe, renderSkyProbe, bindSkyProbe, type SkyProbe } from "../water/skyProbe";
import { CASCADES, initialSpectrum, seaStats, type SeaState } from "./spectrum";
import { makeOcean, uploadSpectrum, stepOcean, currentFoam, type Ocean } from "./fft";
import { OCEAN_VS, OCEAN_FS, OCEAN_SKY_FS, oceanUniforms } from "./oceanShader";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// A Tessendorf ocean: the JONSWAP spectrum for a wind speed and fetch, three
// FFT cascades (500 m, 83 m and 14 m tiles) evaluated on the GPU every frame,
// a displaced ring mesh, and foam that is injected where the surface folds
// and fades over seconds. Cascades can be switched off one by one, and the
// views show the Jacobian, the foam density and which cascade does what.

type Foam = { bias: number; gain: number; life: number; amount: number; scale: number };
type Params = { sea: SeaState; chop: number; foam: Foam; water: WaterParams };

const PRESETS: { id: string; label: string; sea: SeaState; chop: number; sky: Partial<SkyParams>; cam: number }[] = [
  { id: "calm", label: "Light air", sea: { wind: 5, fetch: 40, gamma: 3.3, windDir: 30, spread: 8, short: 1.2 }, chop: 0.9,
    sky: { sunEl: 35, sunAz: 60, cover: 0.25, model: 1 }, cam: 3 },
  { id: "breeze", label: "Fresh breeze", sea: { wind: 10, fetch: 120, gamma: 3.3, windDir: 30, spread: 6, short: 1.4 }, chop: 1.2,
    sky: { sunEl: 18, sunAz: 70, cover: 0.4, model: 1 }, cam: 5 },
  { id: "gale", label: "Gale", sea: { wind: 17, fetch: 400, gamma: 3.3, windDir: 10, spread: 5, short: 1.7 }, chop: 1.4,
    sky: { sunEl: 22, sunAz: 200, cover: 0.85, model: 1 }, cam: 10 },
  { id: "swell", label: "Long swell", sea: { wind: 14, fetch: 1000, gamma: 5, windDir: 0, spread: 30, short: 1 }, chop: 1,
    sky: { sunEl: 4, sunAz: 5, cover: 0.3, model: 1 }, cam: 6 },
];
const first = PRESETS[1];
const DEFAULT: Params = {
  sea: first.sea, chop: first.chop,
  foam: { bias: 0.5, gain: 3, life: 4, amount: 1, scale: 1.2 },
  water: { ...DEFAULT_WATER, depth: 400, slope: 0, detail: 0, shoreFoam: 0, caustics: 0, camHeight: first.cam },
};

type Res = {
  water: WebGLProgram; sky: WebGLProgram; probeProg: WebGLProgram; probe: SkyProbe; ocean: Ocean;
  vao: WebGLVertexArrayObject; grid: WaterGrid; seaKey: string; last: number;
};
type Tab = "sea" | "foam" | "water" | "sky";
// Water Lab views 0–2 and 5, plus the ocean's own (6 = foam density, 7 = cascades)
const VIEWS: [number, string][] = [[0, "final"], [1, "normals"], [2, "Jacobian J"], [5, "Fresnel"], [6, "foam density"], [7, "cascades"]];
const QUALITY: [string, number][] = [["low", 0.4], ["medium", 0.6], ["high", 1]];
const SEED = 7;

export function OceanLabFigure({ t }: { t?: TrackTranslations }) {
  const [look, setLook] = useState<Look>({ yaw: 0.9, pitch: -0.12, fov: 1.1 });
  const [p, setP] = useState<Params>(DEFAULT);
  const [sky, setSky] = useState<SkyParams>({ ...DEFAULT_SKY_PARAMS, ...first.sky });
  const [preset, setPreset] = useState(first.id);
  const [on, setOn] = useState<[boolean, boolean, boolean]>([true, true, true]);
  const [tab, setTab] = useState<Tab>("sea");
  const [quality, setQuality] = useState(0.6);
  const [playing, setPlaying] = useState(true);
  const { ref: figRef, on: inView } = useVisible<HTMLElement>();
  const time = useAnimationTime(playing && inView);
  const stats = seaStats(p.sea);

  const setSea = <K extends keyof SeaState>(k: K, v: SeaState[K]) => { setP(o => ({ ...o, sea: { ...o.sea, [k]: v } })); setPreset(""); };
  const setFoam = <K extends keyof Foam>(k: K, v: Foam[K]) => setP(o => ({ ...o, foam: { ...o.foam, [k]: v } }));
  const setWater = <K extends keyof WaterParams>(k: K, v: WaterParams[K]) => setP(o => ({ ...o, water: { ...o.water, [k]: v } }));
  const setSk = <K extends keyof SkyParams>(k: K, v: SkyParams[K]) => { setSky(o => ({ ...o, [k]: v })); setPreset(""); };
  const loadPreset = (id: string) => {
    const x = PRESETS.find(q => q.id === id)!;
    setP(o => ({ ...o, sea: x.sea, chop: x.chop, water: { ...o.water, camHeight: x.cam } }));
    setSky({ ...DEFAULT_SKY_PARAMS, ...x.sky });
    setPreset(id);
  };

  const init = (gl: WebGL2RenderingContext): Res => ({
    water: compileProgram(gl, OCEAN_VS, OCEAN_FS), sky: compileProgram(gl, FULL_VS, OCEAN_SKY_FS),
    probeProg: compileProgram(gl, FULL_VS, PROBE_FS), probe: makeSkyProbe(gl), ocean: makeOcean(gl),
    vao: gl.createVertexArray()!, grid: ringGrid(gl, p.water.camHeight), seaKey: "", last: time,
  });
  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    // A new sea state means new random amplitudes h̃0 for every cascade
    const key = JSON.stringify(p.sea);
    if (key !== r.seaKey) {
      let lMax = Infinity;
      CASCADES.forEach((c, i) => { uploadSpectrum(gl, r.ocean, i, initialSpectrum(p.sea, c, lMax, SEED + i).data); lMax = c.lMin; });
      r.seaKey = key;
    }
    const camHeight = Math.max(p.water.camHeight, stats.hs + 1);
    if (r.grid.height !== camHeight) { deleteGrid(gl, r.grid); r.grid = ringGrid(gl, camHeight); }
    const dt = Math.min(Math.max(time - r.last, 0), 0.1);
    r.last = time;
    const simTime = (time + 20) * p.water.speed;
    stepOcean(gl, r.ocean, {
      time: simTime, dt: dt * p.water.speed, chop: p.chop, on,
      foamBias: p.foam.bias, foamGain: p.foam.gain, foamLife: p.foam.life,
    });
    const w = { ...p.water, camHeight, foam: p.foam.amount };
    const u = oceanUniforms(w, sky, look, size.aspect, time, r.grid, { on, view: p.water.view, foamScale: p.foam.scale, hs: stats.hs });
    gl.useProgram(r.probeProg);
    applyUniforms(gl, r.probeProg, u);
    renderSkyProbe(gl, r.probe, r.probeProg, () => drawFullscreen(gl, r.vao));

    gl.viewport(0, 0, size.w, size.h);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(r.sky);
    applyUniforms(gl, r.sky, u);
    drawFullscreen(gl, r.vao);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.useProgram(r.water);
    applyUniforms(gl, r.water, u);
    gl.uniform1f(gl.getUniformLocation(r.water, "uPix"), 2 * Math.tan(look.fov / 2) / size.h);
    const bindTex = (unit: number, name: string, tex: WebGLTexture) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(gl.getUniformLocation(r.water, name), unit);
    };
    r.ocean.cascades.forEach((c, i) => { bindTex(i, `uDisp${i}`, c.disp); bindTex(3 + i, `uDeriv${i}`, c.deriv); });
    bindTex(6, "uFoam", currentFoam(r.ocean));
    bindSkyProbe(gl, r.water, r.probe, 7);
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
  const label = (s: string) => <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{s}</span>;
  const colourId = WATER_COLOURS.find(c => c.absorb.every((v, i) => v === p.water.absorb[i]))?.id;

  const notes: Record<number, [string, string]> = {
    0: ["figOcean_n0", "Thousands of waves at once: every texel of the three spectra is one wave with its own length, direction and random phase. Switch cascades off to see what each band adds."],
    1: ["figOcean_n1", "The normal from the summed slopes of the three cascades. Far away the derivative textures are read from smaller mips, which averages detail the pixels could not show."],
    2: ["figOcean_n2", "J from the derivatives of the horizontal displacement. Red is J < 0: the choppy displacement folded the surface over. Raise the wind or the choppiness to see more of it."],
    5: ["figOcean_n5", "Schlick's Fresnel, as in the Water Lab: dark water close by, the mirror of the sky toward the horizon."],
    6: ["figOcean_n6", "The foam density the simulation keeps. Folds inject foam; each frame the old foam is multiplied by e^(−dt/τ), so the white trails behind a breaking crest fade over a few seconds."],
    7: ["figOcean_n7", "Which cascade moves each point most: red is the 500 m tile (swell), green the 83 m tile, blue the 14 m tile (chop and ripples)."],
  };
  const note = notes[p.water.view];

  return (
    <FigureShell ref={figRef}>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figOcean_title", "Ocean Lab (FFT)")}
        </span>
        <div className="flex gap-1.5 flex-wrap">
          {PRESETS.map(x => <button key={x.id} className={btn(preset === x.id)} onClick={() => loadPreset(x.id)}>{x.label}</button>)}
        </div>
      </div>

      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> init={init} draw={draw} look={look} onLook={setLook} resolution={quality}
          frame={[look, p, sky, time, on]} aspect={16 / 9} fovRange={[0.4, 1.8]} />
      </div>

      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap items-center">
          <button className={btn(playing)} onClick={() => setPlaying(v => !v)}>{playing ? "❚❚ pause" : "▶ play"}</button>
          <span className="w-px h-5 bg-[var(--border)] mx-1" />
          {label(tx(t, "figWater_view", "view"))}
          {VIEWS.map(([i, v]) => <button key={v} className={btn(p.water.view === i)} onClick={() => setWater("view", i)}>{v}</button>)}
        </div>
        <div className="flex gap-1.5 flex-wrap items-center">
          {label(tx(t, "figOcean_cascades", "cascades"))}
          {CASCADES.map((c, i) => (
            <button key={c.L} className={btn(on[i])} onClick={() => setOn(o => o.map((v, j) => (j === i ? !v : v)) as [boolean, boolean, boolean])}>
              {on[i] ? "✓ " : ""}{c.L} m
            </button>
          ))}
          <span className="w-px h-5 bg-[var(--border)] mx-1" />
          {label(tx(t, "figWater_quality", "quality"))}
          {QUALITY.map(([l, q]) => <button key={l} className={btn(quality === q)} onClick={() => setQuality(q)}>{l}</button>)}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2 min-w-0">
            <div className="flex gap-1 border-b border-[var(--border)]">
              {([["sea", "Sea state"], ["foam", "Foam"], ["water", "Water"], ["sky", "Sky & camera"]] as [Tab, string][]).map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)}
                  className={`px-2.5 py-1.5 text-[10px] font-semibold border-b-2 -mb-px ${tab === k ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-[var(--text-muted)] hover:text-[var(--primary)]"}`}>{l}</button>
              ))}
            </div>
            {tab === "sea" && <>
              {slider("wind speed U", p.sea.wind, v => setSea("wind", v), 2, 20, 0.5, " m/s")}
              {slider("fetch F", p.sea.fetch, v => setSea("fetch", v), 5, 2000, 5, " km")}
              {slider("peak γ", p.sea.gamma, v => setSea("gamma", v), 1, 7, 0.1)}
              {slider("wind direction", p.sea.windDir, v => setSea("windDir", v), -180, 180, 1, "°")}
              {slider("alignment s", p.sea.spread, v => setSea("spread", v), 1, 40, 1)}
              {slider("short waves ×", p.sea.short, v => setSea("short", v), 1, 2.5, 0.05)}
              {slider("choppiness λ", p.chop, v => { setP(o => ({ ...o, chop: v })); setPreset(""); }, 0, 2, 0.05)}
              {slider("time speed", p.water.speed, v => setWater("speed", v), 0, 3, 0.05)}
            </>}
            {tab === "foam" && <>
              {slider("foam below J =", p.foam.bias, v => setFoam("bias", v), -0.5, 1, 0.01)}
              {slider("injection gain", p.foam.gain, v => setFoam("gain", v), 0.5, 8, 0.1)}
              {slider("lifetime τ", p.foam.life, v => setFoam("life", v), 0.2, 12, 0.1, " s")}
              {slider("coverage", p.foam.amount, v => setFoam("amount", v), 0, 2, 0.01)}
              {slider("cell size", 1 / p.foam.scale, v => setFoam("scale", 1 / v), 0.2, 3, 0.05, " m")}
            </>}
            {tab === "water" && <>
              <div className="flex gap-1.5 flex-wrap">
                {WATER_COLOURS.map(c => (
                  <button key={c.id} className={btn(colourId === c.id)} onClick={() => setP(o => ({ ...o, water: { ...o.water, absorb: c.absorb, scatter: c.scatter } }))}>{c.label}</button>
                ))}
              </div>
              {slider("clarity", p.water.clarity, v => setWater("clarity", v), 0.2, 4, 0.05, "×")}
              {slider("crest glow", p.water.sss, v => setWater("sss", v), 0, 3, 0.01)}
              {slider("sun glints", p.water.glint, v => setWater("glint", v), 0, 3, 0.01)}
            </>}
            {tab === "sky" && <>
              {slider("sun elevation", sky.sunEl, v => setSk("sunEl", v), -10, 90, 1, "°")}
              {slider("sun azimuth", sky.sunAz, v => setSk("sunAz", v), -180, 180, 1, "°")}
              {slider("cloud cover", sky.cover, v => setSk("cover", v), 0, 1, 0.01)}
              {slider("exposure", sky.exposure, v => setSk("exposure", v), 0.2, 4, 0.05)}
              {slider("camera height", p.water.camHeight, v => setWater("camHeight", v), 1, 40, 0.5, " m")}
            </>}
          </div>
          <div className="space-y-2 min-w-0">
            <div className="flex gap-1.5 flex-wrap">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[var(--text-main)]">
                H<sub>s</sub> = {stats.hs.toFixed(2)} m
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[var(--text-main)]">
                λ<sub>p</sub> = {stats.lambdaP.toFixed(0)} m
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[var(--text-main)]">
                T<sub>p</sub> = {stats.tp.toFixed(1)} s
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[var(--text-main)]">
                {tx(t, "figOcean_mss", "slope²")} {stats.mss.toFixed(3)} · Cox–Munk {stats.mssCoxMunk.toFixed(3)}
              </span>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{VIEWS.find(v => v[0] === p.water.view)?.[1]}</p>
            <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">{tx(t, note[0], note[1])}</p>
            <p className="text-[11px] font-mono text-[var(--text-muted)]">
              {tx(t, "figOcean_hint", "drag to look · scroll to zoom · Hs, λp and Tp are the significant wave height, peak wavelength and peak period of this sea state")}
            </p>
          </div>
        </div>
      </div>
    </FigureShell>
  );
}
