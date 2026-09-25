"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { compileProgram, forwardFrom, norm, cross, type Vec3 } from "../../kit/gl/gl";
import { FULL_VS, drawFullscreen } from "../../kit/gl/glx";
import { GLView, useAnimationTime, type Look } from "../../kit/gl/GLView";
import { useVisible } from "../../kit/figure";
import { DEFAULT_SKY_PARAMS, type SkyParams } from "../sky/proceduralSky";
import { WATER_COLOURS } from "./waterShader";
import { SHORE_FS, SHORE_PRESETS, DEFAULT_SHORE, shoreUniforms, applyShoreUniforms, type ShoreParams } from "./shoreShader";

// ── What this figure shows ────────────────────────────────────────────────────
// Shallow water from above: colour by depth, cellular shore foam, contact
// foam around rocks and posts (from the distance field), caustics, sea grass,
// and rain — ring ripples, splashes and streaks. Orbit camera around the bay.

type Res = { prog: WebGLProgram; vao: WebGLVertexArrayObject };
type Tab = "water" | "foam" | "rain" | "sky";
const VIEWS = ["final", "thickness", "foam mask", "normal", "caustics"] as const;
const QUALITY: [string, number][] = [["low", 0.4], ["medium", 0.6], ["high", 1]];
const TARGET: Vec3 = [0.5, 0, 0.5];

export function ShoreLabFigure({ t }: { t?: TrackTranslations }) {
  const [look, setLook] = useState<Look>({ yaw: 0.6, pitch: -0.8, fov: 1.0 });
  const [dist, setDist] = useState(16);
  const [s, setS] = useState<ShoreParams>({ ...DEFAULT_SHORE, ...SHORE_PRESETS[0].shore });
  const [sky, setSky] = useState<SkyParams>({ ...DEFAULT_SKY_PARAMS, ...SHORE_PRESETS[0].sky });
  const [preset, setPreset] = useState(SHORE_PRESETS[0].id);
  const [tab, setTab] = useState<Tab>("water");
  const [quality, setQuality] = useState(0.6);
  const [playing, setPlaying] = useState(true);
  const { ref: figRef, on: inView } = useVisible<HTMLElement>();
  const time = useAnimationTime(playing && inView);

  const set = <K extends keyof ShoreParams>(k: K, v: ShoreParams[K]) => { setS(o => ({ ...o, [k]: v })); setPreset(""); };
  const setSk = <K extends keyof SkyParams>(k: K, v: SkyParams[K]) => { setSky(o => ({ ...o, [k]: v })); setPreset(""); };
  const loadPreset = (id: string) => {
    const p = SHORE_PRESETS.find(x => x.id === id)!;
    setS(o => ({ ...DEFAULT_SHORE, ...p.shore, view: o.view }));
    setSky({ ...DEFAULT_SKY_PARAMS, ...p.sky });
    setPreset(id);
  };

  // Orbit camera: the eye sits behind the look direction, aiming at the bay.
  // The wheel zooms by changing the distance (fov stays fixed).
  const onLook = (l: Look) => {
    if (l.fov !== look.fov) setDist(d => Math.max(4, Math.min(30, d * (l.fov > look.fov ? 1.08 : 0.93))));
    setLook({ ...l, fov: look.fov, pitch: Math.max(-1.45, Math.min(-0.12, l.pitch)) });
  };

  const init = (gl: WebGL2RenderingContext): Res => ({ prog: compileProgram(gl, FULL_VS, SHORE_FS), vao: gl.createVertexArray()! });
  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    const f = forwardFrom(look.yaw, look.pitch);
    const right = norm(cross(f, [0, 1, 0]));
    const cam = { pos: [TARGET[0] - f[0] * dist, TARGET[1] - f[1] * dist, TARGET[2] - f[2] * dist] as Vec3, f, r: right, u: cross(right, f) };
    gl.viewport(0, 0, size.w, size.h);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(r.prog);
    applyShoreUniforms(gl, r.prog, shoreUniforms(s, sky, cam, look.fov, size, time + 5));
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
  const toggle = (on: boolean, label: string, flip: () => void) => <button key={label} className={btn(on)} onClick={flip}>{on ? "✓ " : ""}{label}</button>;
  const colourId = WATER_COLOURS.find(c => c.absorb.every((v, i) => v === s.absorb[i]))?.id;

  const notes: Record<number, [string, string]> = {
    0: ["figShore_n0", "Everything here is one fragment shader. The water is a flat plane whose ripples exist only in its normal; the terrain, rocks and posts are a distance field traced for the view, for the refracted ray and for the reflection."],
    1: ["figShore_n1", "Water thickness above the bed, h = level − bed(x, z). It drives the colour (absorption), the shore foam and, in the stylised mode, the colour bands."],
    2: ["figShore_n2", "Foam amount from two distances: to the bed (shore foam) and to the nearest object (contact foam, read straight from the rocks' distance field). The amount picks how much of each Voronoi cell turns white."],
    3: ["figShore_n3", "The water's normal: wind ripples (sines plus noise) and, with rain on, the rings of every drop."],
    4: ["figShore_n4", "Caustics on the bed from the ripples' Hessian, exactly as in the Water Lab: light focused under crests, spread under troughs."],
  };
  const note = notes[s.view];

  return (
    <figure ref={figRef} className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figShore_title", "Shore & Rain Lab")}
        </span>
        <div className="flex gap-1.5 flex-wrap">
          {SHORE_PRESETS.map(p => <button key={p.id} className={btn(preset === p.id)} onClick={() => loadPreset(p.id)}>{p.label}</button>)}
        </div>
      </div>

      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> orbit init={init} draw={draw} look={look} onLook={onLook} resolution={quality}
          frame={[look, dist, s, sky, time]} aspect={16 / 9} />
      </div>

      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap items-center">
          <button className={btn(playing)} onClick={() => setPlaying(v => !v)}>{playing ? "❚❚ pause" : "▶ play"}</button>
          <button className={btn(s.style === 0)} onClick={() => set("style", 0)}>{tx(t, "figWater_real", "realistic")}</button>
          <button className={btn(s.style === 1)} onClick={() => set("style", 1)}>{tx(t, "figWater_toon", "stylised")}</button>
          <span className="w-px h-5 bg-[var(--border)] mx-1" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{tx(t, "figWater_view", "view")}</span>
          {VIEWS.map((v, i) => <button key={v} className={btn(s.view === i)} onClick={() => setS(o => ({ ...o, view: i }))}>{v}</button>)}
          <span className="w-px h-5 bg-[var(--border)] mx-1" />
          {QUALITY.map(([l, q]) => <button key={l} className={btn(quality === q)} onClick={() => setQuality(q)}>{l}</button>)}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2 min-w-0">
            <div className="flex gap-1 border-b border-[var(--border)]">
              {([["water", "Water"], ["foam", "Foam"], ["rain", "Rain"], ["sky", "Sky"]] as [Tab, string][]).map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)}
                  className={`px-2.5 py-1.5 text-[10px] font-semibold border-b-2 -mb-px ${tab === k ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-[var(--text-muted)] hover:text-[var(--primary)]"}`}>{l}</button>
              ))}
            </div>
            {tab === "water" && <>
              <div className="flex gap-1.5 flex-wrap">
                {WATER_COLOURS.map(c => (
                  <button key={c.id} className={btn(colourId === c.id)} onClick={() => { setS(o => ({ ...o, absorb: c.absorb, scatter: c.scatter })); setPreset(""); }}>{c.label}</button>
                ))}
              </div>
              {slider("water level", s.level, v => set("level", v), -0.8, 0.6, 0.01, " m")}
              {slider("clarity", s.clarity, v => set("clarity", v), 0.2, 4, 0.05, "×")}
              {slider("ripples", s.waves, v => set("waves", v), 0, 3, 0.01)}
              {slider("wind direction", s.windDir, v => set("windDir", v), -180, 180, 1, "°")}
              {slider("caustics", s.caustics, v => set("caustics", v), 0, 2, 0.01)}
              <div className="flex gap-1.5">{toggle(s.grass, "sea grass", () => set("grass", !s.grass))}</div>
            </>}
            {tab === "foam" && <>
              {slider("shore foam", s.foamWidth, v => set("foamWidth", v), 0, 1.5, 0.01, " m")}
              {slider("contact foam", s.contact, v => set("contact", v), 0, 1, 0.01, " m")}
              {slider("cell density", s.cells, v => set("cells", v), 1, 12, 0.1, "/m")}
            </>}
            {tab === "rain" && <>
              {slider("rain", s.rain, v => set("rain", v), 0, 1, 0.01)}
              <div className="flex gap-1.5">
                {toggle(s.streaks, "streaks", () => set("streaks", !s.streaks))}
                {toggle(s.splashes, "splashes", () => set("splashes", !s.splashes))}
              </div>
            </>}
            {tab === "sky" && <>
              {slider("sun elevation", sky.sunEl, v => setSk("sunEl", v), -5, 90, 1, "°")}
              {slider("sun azimuth", sky.sunAz, v => setSk("sunAz", v), -180, 180, 1, "°")}
              {slider("cloud cover", sky.cover, v => setSk("cover", v), 0, 1, 0.01)}
              {slider("exposure", sky.exposure, v => setSk("exposure", v), 0.2, 4, 0.05)}
            </>}
          </div>
          <div className="space-y-2 min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{VIEWS[s.view]}</p>
            <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">{tx(t, note[0], note[1])}</p>
            <p className="text-[11px] font-mono text-[var(--text-muted)]">{tx(t, "figShore_hint", "drag to orbit · scroll to move closer")}</p>
          </div>
        </div>
      </div>
    </figure>
  );
}
