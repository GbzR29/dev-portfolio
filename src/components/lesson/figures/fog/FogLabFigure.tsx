"use client";

import { useEffect, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { compileProgram, forwardFrom, norm, cross, type Vec3 } from "../gl";
import { FULL_VS, drawFullscreen } from "../glx";
import { GLView, useAnimationTime, type Look } from "../GLView";
import { DEFAULT_SKY_PARAMS, type SkyParams } from "../sky/proceduralSky";
import { FOG_FS, FOG_LAB_PRESETS, DEFAULT_FOG, fogUniforms, applyFogUniforms, type FogParams } from "./fogShader";

// ── What this figure shows ────────────────────────────────────────────────────
// A valley with every kind of fog from the chapter. The layer modes keep the
// fog near the ground; rise above it with the camera height to see it from
// the top. "Mist" raymarches the same layer with drifting noise.

type Res = { prog: WebGLProgram; vao: WebGLVertexArrayObject };
const MODES = ["none", "linear", "exp", "exp²", "height", "ground layer", "mist"] as const;
const VIEWS = ["final", "fog amount", "no fog"] as const;
const QUALITY: [string, number][] = [["low", 0.4], ["medium", 0.6], ["high", 1]];
const COLOURS: [string, Vec3][] = [["grey", [0.72, 0.76, 0.8]], ["white", [0.88, 0.88, 0.9]], ["warm", [0.8, 0.72, 0.65]], ["blue", [0.55, 0.65, 0.8]], ["green", [0.55, 0.65, 0.5]]];

export function FogLabFigure({ t }: { t?: TrackTranslations }) {
  const first = FOG_LAB_PRESETS[0];
  const [look, setLook] = useState<Look>({ yaw: 0.2, pitch: -0.05, fov: 1.2 });
  const [p, setP] = useState<FogParams>({ ...DEFAULT_FOG, ...first.fog });
  const [sky, setSky] = useState<SkyParams>({ ...DEFAULT_SKY_PARAMS, ...first.sky });
  const [preset, setPreset] = useState(first.id);
  const [quality, setQuality] = useState(0.6);
  const [playing, setPlaying] = useState(true);
  const figRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = figRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const time = useAnimationTime(playing && inView && p.mode === 6);

  const set = <K extends keyof FogParams>(k: K, v: FogParams[K]) => { setP(o => ({ ...o, [k]: v })); setPreset(""); };
  const setSk = <K extends keyof SkyParams>(k: K, v: SkyParams[K]) => { setSky(o => ({ ...o, [k]: v })); setPreset(""); };
  const loadPreset = (id: string) => {
    const pr = FOG_LAB_PRESETS.find(x => x.id === id)!;
    setP(o => ({ ...DEFAULT_FOG, ...pr.fog, view: o.view }));
    setSky({ ...DEFAULT_SKY_PARAMS, ...pr.sky });
    setPreset(id);
  };

  const init = (gl: WebGL2RenderingContext): Res => ({ prog: compileProgram(gl, FULL_VS, FOG_FS), vao: gl.createVertexArray()! });
  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    const f = forwardFrom(look.yaw, look.pitch);
    const right = norm(cross(f, [0, 1, 0]));
    gl.viewport(0, 0, size.w, size.h);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(r.prog);
    applyFogUniforms(gl, r.prog, fogUniforms(p, sky, { pos: [0, p.camHeight, 0], f, r: right, u: cross(right, f) }, look.fov, size.aspect, time + 5));
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
      <span className="text-[10px] font-mono text-[var(--primary)] w-14 text-right">{+value.toFixed(3)}{unit}</span>
    </label>
  );

  const layer = p.mode >= 4;
  const notes: [string, string][] = [
    ["figFogL_m0", "No fog: the scene as the camera would see it in perfectly clear air. Far hills keep their full contrast, and the eye reads them as flat cut-outs."],
    ["figFogL_m1", "Linear: visibility falls in a straight line from 2 m to 1/density. It is simple to art-direct but has a hard start and end, and nothing physical behind it."],
    ["figFogL_m2", "Exponential: a uniform medium, visibility e^(−ρd). Every metre removes the same fraction of light. It fills all of space, including the air above your head."],
    ["figFogL_m3", "Exp²: e^(−(ρd)²) keeps nearby things crisp and then closes in quickly."],
    ["figFogL_m4", "Height fog: density ρ·e^(−(y−H)/s) is thick low down and thins upward, so the sky stays clear while valleys fill up. Its integral along a ray has a closed form."],
    ["figFogL_m5", "Ground layer: constant density up to height H, then a soft exponential top of thickness s. Above the layer the air is clear. Raise the camera above H to see it from the top."],
    ["figFogL_m6", "Mist: the ground layer with drifting 3D noise in its density, which no closed form can integrate, so the shader marches the ray through it in 40 steps. The sun lights each step, dimmed by the fog between it and the sun."],
  ];
  const note = notes[p.mode];

  return (
    <figure ref={figRef} className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{tx(t, "figFogL_title", "Fog Lab")}</span>
        <div className="flex gap-1.5 flex-wrap">
          {FOG_LAB_PRESETS.map(x => <button key={x.id} className={btn(preset === x.id)} onClick={() => loadPreset(x.id)}>{x.label}</button>)}
        </div>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> init={init} draw={draw} look={look} onLook={setLook} resolution={quality}
          frame={[look, p, sky, time]} aspect={16 / 9} fovRange={[0.5, 1.8]} />
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{tx(t, "figFogL_mode", "fog")}</span>
          {MODES.map((m, i) => <button key={m} className={btn(p.mode === i)} onClick={() => set("mode", i)}>{m}</button>)}
        </div>
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{tx(t, "figWater_view", "view")}</span>
          {VIEWS.map((v, i) => <button key={v} className={btn(p.view === i)} onClick={() => setP(o => ({ ...o, view: i }))}>{v}</button>)}
          <span className="w-px h-5 bg-[var(--border)] mx-1" />
          {QUALITY.map(([l, q]) => <button key={l} className={btn(quality === q)} onClick={() => setQuality(q)}>{l}</button>)}
          {p.mode === 6 && <button className={btn(playing)} onClick={() => setPlaying(v => !v)}>{playing ? "❚❚ pause" : "▶ play"}</button>}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-1.5 min-w-0">
            {slider("density", p.density, v => set("density", v), 0.002, 0.5, 0.001, " /m")}
            {layer && slider(p.mode === 4 ? "reference height" : "fog height", p.height, v => set("height", v), -3, 15, 0.1, " m")}
            {layer && slider(p.mode === 4 ? "falloff scale" : "soft top", p.soft, v => set("soft", v), 0.1, 10, 0.1, " m")}
            {p.mode === 6 && slider("noise", p.noise, v => set("noise", v), 0, 1, 0.01)}
            {p.mode === 6 && slider("wind", p.wind, v => set("wind", v), 0, 6, 0.1, " m/s")}
            {slider("sun scattering", p.scatter, v => set("scatter", v), 0, 2, 0.01)}
            {slider("camera height", p.camHeight, v => set("camHeight", v), 0.5, 30, 0.1, " m")}
            {slider("sun elevation", sky.sunEl, v => setSk("sunEl", v), -5, 80, 1, "°")}
            {slider("sun azimuth", sky.sunAz, v => setSk("sunAz", v), -180, 180, 1, "°")}
            <div className="flex gap-1.5 flex-wrap items-center pt-1">
              <span className="text-[9px] font-mono text-[var(--text-muted)] w-24">fog colour</span>
              {COLOURS.map(([n, c]) => (
                <button key={n} title={n} onClick={() => set("colour", c)}
                  className={`w-6 h-6 rounded-md border ${p.colour === c ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/40" : "border-[var(--border)]"}`}
                  style={{ background: `rgb(${c.map(v => Math.round(v * 255)).join(",")})` }} />
              ))}
              <button className={btn(p.fogSky)} onClick={() => set("fogSky", !p.fogSky)}>{p.fogSky ? "✓ " : ""}fog the sky</button>
            </div>
          </div>
          <div className="space-y-2 min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{MODES[p.mode]}</p>
            <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">{tx(t, note[0], note[1])}</p>
            <p className="text-[11px] font-mono text-[var(--text-muted)]">{tx(t, "figFogL_hint", "drag to look · heights are measured from the valley floor")}</p>
          </div>
        </div>
      </div>
    </figure>
  );
}
