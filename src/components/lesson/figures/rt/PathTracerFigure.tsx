"use client";

import { useEffect, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { compileProgram, forwardFrom, norm, cross, type Vec3 } from "../gl";
import { FULL_VS, drawFullscreen, makeColorTarget, deleteColorTarget, type ColorTarget } from "../glx";
import { GLView, useAnimationTime, type Look } from "../GLView";
import { PATH_TRACE_FS, PATH_DISPLAY_FS, DEFAULT_PATH, type PathParams } from "./pathShader";

// ── What this figure shows ────────────────────────────────────────────────────
// Progressive path tracing of a Cornell box. Every frame adds `spp` random
// paths per pixel to a running average kept in a float texture; the image
// starts as noise and converges. Any change (camera, settings) restarts it.

type Res = {
  trace: WebGLProgram; show: WebGLProgram; vao: WebGLVertexArrayObject;
  acc: [ColorTarget | null, ColorTarget | null]; ping: number; frames: number; key: string; float: boolean;
};
const MAX_FRAMES = 4000;
const MATS = ["diffuse", "metal", "glass"] as const;

export function PathTracerFigure({ t }: { t?: TrackTranslations }) {
  const [look, setLook] = useState<Look>({ yaw: 0, pitch: 0, fov: 0.75 });
  const [p, setP] = useState<PathParams>({ ...DEFAULT_PATH });
  const [stats, setStats] = useState({ frames: 0, spp: 0, float: true });
  const figRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = figRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const running = inView && stats.frames < MAX_FRAMES;
  const tick = useAnimationTime(running);
  const set = <K extends keyof PathParams>(k: K, v: PathParams[K]) => setP(o => ({ ...o, [k]: v }));

  const init = (gl: WebGL2RenderingContext): Res => ({
    trace: compileProgram(gl, FULL_VS, PATH_TRACE_FS), show: compileProgram(gl, FULL_VS, PATH_DISPLAY_FS),
    vao: gl.createVertexArray()!, acc: [null, null], ping: 0, frames: 0, key: "", float: !!gl.getExtension("EXT_color_buffer_float"),
  });

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    // (Re)create the two accumulation targets at canvas size
    if (!r.acc[0] || r.acc[0].w !== size.w || r.acc[0].h !== size.h) {
      deleteColorTarget(gl, r.acc[0]); deleteColorTarget(gl, r.acc[1]);
      r.acc = [0, 1].map(() => makeColorTarget(gl, size.w, size.h, { float: true, depth: false, linear: false })) as [ColorTarget, ColorTarget];
      r.frames = 0;
    }
    // Anything that changes the picture restarts the average
    const key = JSON.stringify([look, p.bounces, p.sampling, p.nee, p.roulette, p.matA, p.matB, p.rough, p.lightSize, size.w, size.h]);
    if (key !== r.key) { r.key = key; r.frames = 0; }

    const f = forwardFrom(look.yaw, look.pitch), dist = 7.6;
    const right = norm(cross(f, [0, 1, 0])), up = cross(right, f);
    const cam: Vec3 = [-f[0] * dist, -f[1] * dist, -f[2] * dist];

    if (r.frames < MAX_FRAMES) {
      const src = r.acc[r.ping]!, dst = r.acc[1 - r.ping]!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fbo);
      gl.viewport(0, 0, size.w, size.h);
      gl.useProgram(r.trace);
      const u = (n: string) => gl.getUniformLocation(r.trace, n);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, src.tex[0]); gl.uniform1i(u("uPrev"), 0);
      gl.uniform1f(u("uFrame"), r.frames);
      gl.uniform2f(u("uRes"), size.w, size.h);
      gl.uniform3fv(u("uCamPos"), cam); gl.uniform3fv(u("uCamF"), f); gl.uniform3fv(u("uCamR"), right); gl.uniform3fv(u("uCamU"), up);
      gl.uniform1f(u("uTanHalf"), Math.tan(look.fov / 2)); gl.uniform1f(u("uAspect"), size.aspect);
      gl.uniform1f(u("uRough"), p.rough); gl.uniform1f(u("uLightSize"), p.lightSize);
      gl.uniform1i(u("uBounces"), p.bounces); gl.uniform1i(u("uSpp"), p.spp); gl.uniform1i(u("uSampling"), p.sampling);
      gl.uniform1i(u("uMatA"), p.matA); gl.uniform1i(u("uMatB"), p.matB);
      gl.uniform1i(u("uNee"), +p.nee); gl.uniform1i(u("uRoulette"), +p.roulette);
      drawFullscreen(gl, r.vao);
      r.ping = 1 - r.ping;
      r.frames++;
    }
    // Show the average
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, size.w, size.h);
    gl.useProgram(r.show);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, r.acc[r.ping]!.tex[0]);
    gl.uniform1i(gl.getUniformLocation(r.show, "uAcc"), 0);
    gl.uniform1f(gl.getUniformLocation(r.show, "uExposure"), p.exposure);
    drawFullscreen(gl, r.vao);
    if (r.frames !== stats.frames && (r.frames % 4 === 0 || r.frames < 8 || r.frames === MAX_FRAMES)) setStats({ frames: r.frames, spp: r.frames * p.spp, float: r.float });
    else if (r.frames === 0 && stats.frames !== 0) setStats({ frames: 0, spp: 0, float: r.float });
  };

  const btn = (active: boolean) =>
    `px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all ${active
      ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]"
      : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40"}`;
  const slider = (label: string, value: number, onChange: (v: number) => void, min: number, max: number, step: number) => (
    <label key={label} className="flex items-center gap-2">
      <span className="text-[10px] font-mono text-[var(--text-muted)] w-24 shrink-0">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} className="flex-1 min-w-0 accent-[var(--primary)]" />
      <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{value}</span>
    </label>
  );

  return (
    <figure ref={figRef} className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{tx(t, "figPath_title", "A Progressive Path Tracer — Cornell Box")}</span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{tx(t, "figPath_hint", "drag to orbit · any change restarts the average")}</span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2 relative">
        <GLView<Res> orbit init={init} draw={draw} look={look}
          onLook={l => setLook({ ...l, yaw: Math.max(-0.7, Math.min(0.7, l.yaw)), pitch: Math.max(-0.5, Math.min(0.5, l.pitch)) })} fovRange={[0.5, 1.1]}
          frame={[look, p, tick]} aspect={4 / 3} className="max-w-[640px] mx-auto" />
        <div className="absolute top-3 left-3 font-mono text-[10px] text-white/85 bg-black/45 rounded px-2 py-1 pointer-events-none">
          {stats.spp} {tx(t, "figPath_spp", "samples / pixel")}{stats.frames >= MAX_FRAMES ? " · done" : ""}{stats.float ? "" : " · 8-bit fallback"}
        </div>
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mr-1">{tx(t, "figPath_sampling", "sampling")}</span>
          <button className={btn(p.sampling === 0)} onClick={() => set("sampling", 0)}>uniform</button>
          <button className={btn(p.sampling === 1)} onClick={() => set("sampling", 1)}>cosine-weighted</button>
          <button className={btn(p.nee)} onClick={() => set("nee", !p.nee)}>{p.nee ? "✓ " : ""}next event estimation</button>
          <button className={btn(p.roulette)} onClick={() => set("roulette", !p.roulette)}>{p.roulette ? "✓ " : ""}Russian roulette</button>
        </div>
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mr-1">{tx(t, "figPath_left", "left sphere")}</span>
          {MATS.map((m, i) => <button key={m} className={btn(p.matA === i)} onClick={() => set("matA", i)}>{m}</button>)}
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mx-1">{tx(t, "figPath_right", "right sphere")}</span>
          {MATS.map((m, i) => <button key={m} className={btn(p.matB === i)} onClick={() => set("matB", i)}>{m}</button>)}
        </div>
        <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {slider("max bounces", p.bounces, v => set("bounces", v), 0, 12, 1)}
          {slider("samples / frame", p.spp, v => set("spp", v), 1, 16, 1)}
          {slider("light size", p.lightSize, v => set("lightSize", v), 0.03, 0.9, 0.01)}
          {slider("metal roughness", p.rough, v => set("rough", v), 0, 1, 0.01)}
          {slider("exposure", p.exposure, v => set("exposure", v), 0.2, 4, 0.05)}
        </div>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {tx(t, "figPath_note", "Watch the noise melt as samples accumulate. Things to try: switch to uniform sampling and see how much slower the noise clears. Turn off next event estimation and shrink the light: paths must now hit a tiny light by chance, and the image stays speckled far longer. Set the bounces to 0 for direct light only (no colour bleeding from the red and green walls), then 1, 2… each bounce adds one more generation of indirect light.")}
        </p>
      </div>
    </figure>
  );
}
