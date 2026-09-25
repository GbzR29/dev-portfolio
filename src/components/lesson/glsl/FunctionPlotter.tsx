"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { buildProgram, type ShaderError } from "./engine";

// ── What this widget is ───────────────────────────────────────────────────────
// A function plotter that runs on the GPU, like Íñigo Quílez's Graphtoy. Up to
// three GLSL expressions in x (and t, the time) are compiled into a fragment
// shader. Every pixel evaluates them and measures its distance to each curve,
// divided by the slope (|y − f(x)| / √(1 + f′²)), so steep curves stay as thin
// and crisp as flat ones. What you type is real GLSL: if it plots here, it
// works in your shader.

const HELPERS = `
const float PI = 3.14159265, TAU = 6.28318531;
float almostIdentity(float x, float m, float n) { if (x > m) return x; float a = 2.0*n - m, b = 2.0*m - 3.0*n, t = x/m; return (a*t + b)*t*t + n; }
float expImpulse(float x, float k) { float h = k*x; return h*exp(1.0 - h); }
float cubicPulse(float c, float w, float x) { x = abs(x - c); if (x > w) return 0.0; x /= w; return 1.0 - x*x*(3.0 - 2.0*x); }
float parabola(float x, float k) { return pow(4.0*x*(1.0 - x), k); }
float gain(float x, float k) { float a = 0.5*pow(2.0*((x < 0.5) ? x : 1.0 - x), k); return (x < 0.5) ? a : 1.0 - a; }
float easeInOutCubic(float x) { return x < 0.5 ? 4.0*x*x*x : 1.0 - pow(-2.0*x + 2.0, 3.0)/2.0; }
float hash11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float noise1(float x) { float i = floor(x), f = fract(x); float u = f*f*(3.0 - 2.0*f); return mix(hash11(i), hash11(i + 1.0), u); }
`;

function source(exprs: string[]) {
  const fns = exprs.map((e, i) => `float f${i}(float x, float t) { return ${e.trim() || "0.0"}; }`).join("\n");
  return `${HELPERS}
${fns}
uniform vec4 uRange;      // xmin, xmax, ymin, ymax
uniform vec3 uOn;
const vec3 COL[3] = vec3[3](vec3(1.0, 0.65, 0.15), vec3(0.3, 0.65, 1.0), vec3(0.35, 0.9, 0.45));

float curve(int i, float x, float y, float t, float px) {
  float h = (uRange.y - uRange.x) / uResolution.x;          // one pixel in x
  float v, d;
  if (i == 0) { v = f0(x, t); d = (f0(x + h, t) - f0(x - h, t)) / (2.0 * h); }
  else if (i == 1) { v = f1(x, t); d = (f1(x + h, t) - f1(x - h, t)) / (2.0 * h); }
  else { v = f2(x, t); d = (f2(x + h, t) - f2(x - h, t)) / (2.0 * h); }
  float dist = abs(y - v) / sqrt(1.0 + d * d) / px;          // distance to the curve, in pixels
  return 1.0 - smoothstep(0.8, 2.0, dist);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float x = mix(uRange.x, uRange.y, uv.x), y = mix(uRange.z, uRange.w, uv.y);
  float px = (uRange.w - uRange.z) / uResolution.y;          // one pixel in y
  vec3 col = vec3(0.075, 0.085, 0.11);
  // grid: unit lines and tenths
  vec2 g = abs(fract(vec2(x, y) + 0.5) - 0.5) / vec2((uRange.y - uRange.x) / uResolution.x, px);
  col = mix(col, vec3(0.2, 0.22, 0.27), 1.0 - smoothstep(0.0, 1.2, min(g.x, g.y)));
  vec2 g10 = abs(fract(vec2(x, y) * 10.0 + 0.5) - 0.5) / (vec2((uRange.y - uRange.x) / uResolution.x, px) * 10.0);
  col = mix(col, vec3(0.13, 0.145, 0.18), (1.0 - smoothstep(0.0, 1.0, min(g10.x, g10.y))) * 0.6);
  vec2 ax = abs(vec2(x, y)) / vec2((uRange.y - uRange.x) / uResolution.x, px);
  col = mix(col, vec3(0.5, 0.52, 0.58), 1.0 - smoothstep(0.0, 1.5, min(ax.x, ax.y)));
  for (int i = 0; i < 3; i++) {
    if (uOn[i] < 0.5) continue;
    col = mix(col, COL[i], curve(i, x, y, uTime, px));
  }
  FragColor = vec4(col, 1.0);
}`;
}

const PRESETS: { label: string; exprs: string[]; range: [number, number, number, number] }[] = [
  { label: "step vs smoothstep", exprs: ["step(0.5, x)", "smoothstep(0.2, 0.8, x)", "clamp(x, 0.0, 1.0)"], range: [-0.25, 1.25, -0.25, 1.25] },
  { label: "fract, floor, mod", exprs: ["fract(x)", "floor(x) * 0.25", "mod(x, 0.5)"], range: [-2, 2, -1, 1.5] },
  { label: "sin & friends", exprs: ["sin(x)", "abs(sin(x))", "sin(x) * 0.5 + 0.5"], range: [-6.3, 6.3, -1.5, 1.5] },
  { label: "pow shapes", exprs: ["pow(x, 0.5)", "pow(x, 2.0)", "pow(x, 5.0)"], range: [0, 1, 0, 1] },
  { label: "pulses (IQ)", exprs: ["cubicPulse(0.5, 0.2, x)", "expImpulse(x, 8.0)", "parabola(x, 1.0)"], range: [0, 1, -0.1, 1.1] },
  { label: "easing", exprs: ["easeInOutCubic(clamp(x, 0.0, 1.0))", "gain(clamp(x, 0.0, 1.0), 4.0)", "x * x * (3.0 - 2.0 * x)"], range: [0, 1, 0, 1] },
  { label: "animated (t)", exprs: ["sin(x * 3.0 + t * 2.0)", "noise1(x * 4.0 + t)", "smoothstep(-0.2, 0.2, sin(x + t))"], range: [-3, 3, -1.3, 1.3] },
  { label: "triangle, square, saw", exprs: ["abs(fract(x) * 2.0 - 1.0)", "step(0.5, fract(x))", "fract(x)"], range: [-2, 2, -0.3, 1.3] },
];
const COLORS = ["#ffa626", "#4da6ff", "#59e673"];

export function FunctionPlotter({ t }: { t?: TrackTranslations }) {
  const { ref, inView } = useInView({ threshold: 0.05 });
  const [preset, setPreset] = useState(0);
  const [exprs, setExprs] = useState(PRESETS[0].exprs);
  const [on, setOn] = useState([true, true, true]);
  const [range, setRange] = useState(PRESETS[0].range);
  const [errors, setErrors] = useState<ShaderError[]>([]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef<{ gl: WebGL2RenderingContext; prog: WebGLProgram | null; vao: WebGLVertexArrayObject; t0: number } | null>(null);
  const live = useRef({ range, on }); live.current = { range, on };

  useEffect(() => {
    const gl = canvas.current?.getContext("webgl2", { antialias: false });
    if (!gl) return;
    state.current = { gl, prog: null, vao: gl.createVertexArray()!, t0: performance.now() };
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      const S = state.current;
      if (!S) return;
      const { program, errors: errs } = buildProgram(S.gl, "2d", source(exprs), "");
      // Map errors back to the expression that caused them
      setErrors(errs);
      if (program) { if (S.prog) S.gl.deleteProgram(S.prog); S.prog = program; }
    }, 250);
    return () => clearTimeout(id);
  }, [exprs]);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const tick = () => {
      const S = state.current, c = canvas.current;
      if (S && c && S.prog) {
        const r = c.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
        if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
        const gl = S.gl;
        gl.viewport(0, 0, w, h);
        gl.useProgram(S.prog);
        gl.uniform2f(gl.getUniformLocation(S.prog, "uResolution"), w, h);
        gl.uniform1f(gl.getUniformLocation(S.prog, "uTime"), (performance.now() - S.t0) / 1000);
        gl.uniform4fv(gl.getUniformLocation(S.prog, "uRange"), live.current.range);
        gl.uniform3fv(gl.getUniformLocation(S.prog, "uOn"), live.current.on.map(Number));
        gl.bindVertexArray(S.vao);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView]);

  const choose = (i: number) => { setPreset(i); setExprs(PRESETS[i].exprs); setRange(PRESETS[i].range); setOn([true, true, true]); };
  const [xmin, xmax, ymin, ymax] = range;
  const btn = (a: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${a
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;
  const zoom = (k: number) => {
    const cx = (xmin + xmax) / 2, cy = (ymin + ymax) / 2, hx = ((xmax - xmin) / 2) * k, hy = ((ymax - ymin) / 2) * k;
    setRange([cx - hx, cx + hx, cy - hy, cy + hy]);
  };

  return (
    <figure ref={ref} className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figPlot_title", "GLSL Function Plotter")}
        </span>
        <select className="bg-[var(--code-bg)] border border-[var(--border)] rounded px-1.5 py-1 text-[10px] font-mono text-[var(--text-main)]"
          value={preset} onChange={e => choose(Number(e.target.value))}>
          {PRESETS.map((p, i) => <option key={p.label} value={i}>{p.label}</option>)}
        </select>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2 relative">
        <div className="relative" style={{ aspectRatio: "16 / 9" }}>
          <canvas ref={canvas} className="absolute inset-0 w-full h-full rounded" />
          <span className="absolute left-1 bottom-1 font-mono text-[9px] text-white/60">x ∈ [{xmin.toFixed(2)}, {xmax.toFixed(2)}] · y ∈ [{ymin.toFixed(2)}, {ymax.toFixed(2)}]</span>
        </div>
      </div>
      <div className="p-4 md:p-5 space-y-2">
        {exprs.map((e, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="checkbox" checked={on[i]} onChange={ev => setOn(o => o.map((v, k) => (k === i ? ev.target.checked : v)))} className="accent-[var(--primary)]" />
            <span className="font-mono text-[11px] w-10" style={{ color: COLORS[i] }}>f{i + 1}(x)</span>
            <input value={e} onChange={ev => setExprs(xs => xs.map((v, k) => (k === i ? ev.target.value : v)))} spellCheck={false}
              className="flex-1 min-w-0 bg-[var(--code-bg)] border border-[var(--code-border)] rounded px-2 py-1 font-mono text-[11.5px] text-[var(--code-text)] outline-none focus:border-[var(--primary)]" />
          </div>
        ))}
        <div className="flex gap-1.5 flex-wrap items-center pt-1">
          <button className={btn(false)} onClick={() => zoom(0.8)}>zoom in</button>
          <button className={btn(false)} onClick={() => zoom(1.25)}>zoom out</button>
          <button className={btn(false)} onClick={() => setRange(PRESETS[preset].range)}>reset view</button>
          <span className={`text-[10px] font-mono ml-2 ${errors.length ? "text-red-400" : "text-[var(--text-muted)]"}`}>
            {errors.length ? errors[0].message : tx(t, "figPlot_help", "variables: x, t (seconds) · helpers: PI, TAU, cubicPulse, expImpulse, parabola, gain, noise1…")}
          </span>
        </div>
      </div>
    </figure>
  );
}
