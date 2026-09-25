"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { compileProgram, forwardFrom, norm, cross, type Vec3 } from "../../kit/gl/gl";
import { FULL_VS, drawFullscreen } from "../../kit/gl/glx";
import { GLView, type Look } from "../../kit/gl/GLView";
import { WHITTED_FS, DEFAULT_WHITTED, type WhittedParams } from "./whittedShader";

// ── What this figure shows ────────────────────────────────────────────────────
// A classic (Whitted) ray tracer: primary rays, shadow rays, reflection and
// refraction, with the recursion replaced by a stack. Each feature can be
// switched off, the depth limited, and the cost per pixel inspected.

type Res = { prog: WebGLProgram; vao: WebGLVertexArrayObject };
const VIEWS = ["image", "normals", "distance", "rays / pixel"] as const;
const TARGET: Vec3 = [0, 0.5, 0.2];

export function WhittedFigure({ t }: { t?: TrackTranslations }) {
  const [look, setLook] = useState<Look>({ yaw: 0.35, pitch: -0.28, fov: 0.9 });
  const [p, setP] = useState<WhittedParams>({ ...DEFAULT_WHITTED });
  const set = <K extends keyof WhittedParams>(k: K, v: WhittedParams[K]) => setP(o => ({ ...o, [k]: v }));

  const init = (gl: WebGL2RenderingContext): Res => ({ prog: compileProgram(gl, FULL_VS, WHITTED_FS), vao: gl.createVertexArray()! });
  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    const f = forwardFrom(look.yaw, look.pitch), dist = 6.5;
    const right = norm(cross(f, [0, 1, 0])), up = cross(right, f);
    const cam: Vec3 = [TARGET[0] - f[0] * dist, Math.max(0.15, TARGET[1] - f[1] * dist), TARGET[2] - f[2] * dist];
    const a = (p.lightAngle * Math.PI) / 180;
    gl.viewport(0, 0, size.w, size.h);
    gl.useProgram(r.prog);
    const u = (n: string) => gl.getUniformLocation(r.prog, n);
    gl.uniform3fv(u("uCamPos"), cam); gl.uniform3fv(u("uCamF"), f); gl.uniform3fv(u("uCamR"), right); gl.uniform3fv(u("uCamU"), up);
    gl.uniform1f(u("uTanHalf"), Math.tan(look.fov / 2)); gl.uniform1f(u("uAspect"), size.aspect);
    gl.uniform1f(u("uIor"), p.ior);
    gl.uniform1i(u("uDepth"), p.depth); gl.uniform1i(u("uView"), p.view);
    gl.uniform1i(u("uShadows"), +p.shadows); gl.uniform1i(u("uReflect"), +p.reflections); gl.uniform1i(u("uRefract"), +p.refraction);
    gl.uniform3fv(u("uLight"), [Math.cos(a) * 4, 5, Math.sin(a) * 4]);
    drawFullscreen(gl, r.vao);
  };

  const btn = (active: boolean) =>
    `px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all ${active
      ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]"
      : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40"}`;
  const toggle = (k: "shadows" | "reflections" | "refraction", label: string) =>
    <button key={k} className={btn(p[k])} onClick={() => set(k, !p[k])}>{p[k] ? "✓ " : ""}{label}</button>;

  const note = p.view === 3
    ? tx(t, "figWhit_cost", "Rays traced per pixel: blue is 1 (a primary ray that hit something matte), red is 16 or more. Glass doubles the rays at every hit, one reflected and one refracted, so the tree grows as 2^depth. Lower the depth and watch the glass spheres cool down.")
    : tx(t, "figWhit_note", "Every pixel sends one ray. At a matte surface it stops, after asking the light whether it is visible (a shadow ray). The mirror adds one reflected ray. Glass adds a reflected and a refracted ray, weighted by Fresnel. Switch each feature off to see what it adds, and set the depth to 1 to see a single bounce.");

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{tx(t, "figWhit_title", "A Whitted Ray Tracer")}</span>
        <div className="flex gap-1.5 flex-wrap">{VIEWS.map((v, i) => <button key={v} className={btn(p.view === i)} onClick={() => set("view", i)}>{v}</button>)}</div>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> orbit init={init} draw={draw} look={look}
          onLook={l => setLook({ ...l, pitch: Math.max(-1.3, Math.min(-0.02, l.pitch)) })} fovRange={[0.4, 1.4]}
          frame={[look, p]} aspect={16 / 9} />
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap items-center">
          {toggle("shadows", "shadow rays")}{toggle("reflections", "reflection rays")}{toggle("refraction", "refraction rays")}
        </div>
        <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {([["max depth", p.depth, (v: number) => set("depth", v), 0, 10, 1], ["glass IOR", p.ior, (v: number) => set("ior", v), 1, 2.5, 0.01],
            ["light angle", p.lightAngle, (v: number) => set("lightAngle", v), -180, 180, 1]] as const).map(([label, v, fn, min, max, step]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-20">{label}</span>
              <input type="range" min={min} max={max} step={step} value={v} onChange={e => fn(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{v}</span>
            </label>
          ))}
        </div>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">{note}</p>
      </div>
    </figure>
  );
}
