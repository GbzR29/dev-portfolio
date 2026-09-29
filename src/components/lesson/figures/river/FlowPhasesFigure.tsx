"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { compileProgram } from "../../kit/gl/gl";
import { FULL_VS, drawFullscreen } from "../../kit/gl/glx";
import { GLView, useAnimationTime } from "../../kit/gl/GLView";
import { useVisible } from "../../kit/figure";
import { makeDetailTexture } from "./riverDetail";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// A stream flowing past a round rock, seen from above, with a texture carried
// by its flow map in three ways: scrolled for ever (it stretches without end),
// restarted every cycle (it jumps), or as two phases half a cycle apart,
// cross-faded with triangle weights (smooth). The plot under it shows the two
// weights and where in the cycle the animation is.

const HALF_H = 2;          // the view spans y = −2 … 2 m
const ROCK = 0.6;          // rock radius (m)

const FS = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 FragColor;
uniform sampler2D uDetail;
uniform float uTime, uPeriod, uOffset, uSpeed, uAspect;
uniform int uMode, uPattern;
const float A = ${ROCK.toFixed(2)};

// Potential flow past a cylinder: the free stream U plus −U·a²/ζ², ζ = x + i·y
vec2 flowAt(vec2 p) {
  float r2 = dot(p, p);
  if (r2 < A * A) return vec2(0.0);
  vec2 inv = vec2(p.x * p.x - p.y * p.y, -2.0 * p.x * p.y) / (r2 * r2);
  return uSpeed * (vec2(1.0, 0.0) - A * A * vec2(inv.x, -inv.y));
}

vec3 pattern(vec2 uv) {
  if (uPattern == 0) {
    vec2 g = floor(uv * 2.0);
    float c = mod(g.x + g.y, 2.0);
    return mix(vec3(0.16, 0.2, 0.28), vec3(0.85, 0.87, 0.9), c);
  }
  // Ripples lit from the upper left, with the foam pattern on top
  vec4 s = texture(uDetail, uv * 0.5);
  vec3 n = normalize(vec3(-(s.r * 2.0 - 1.0) * 3.0, -(s.g * 2.0 - 1.0) * 3.0, 1.0));
  float l = 0.55 + 0.6 * dot(n, normalize(vec3(-0.5, 0.6, 0.7)));
  return mix(vec3(0.05, 0.25, 0.35) * l, vec3(0.9), smoothstep(0.45, 0.75, s.b) * 0.8);
}

void main() {
  vec2 p = (vUV * 2.0 - 1.0) * vec2(uAspect, 1.0) * ${HALF_H.toFixed(1)};
  if (length(p) < A) { FragColor = vec4(vec3(0.42, 0.4, 0.37) * (0.8 + 0.2 * p.y), 1.0); return; }
  vec2 v = flowAt(p);
  vec3 col;
  if (uMode == 0) col = pattern(p - v * uTime);
  else {
    float tt = uTime / uPeriod + texture(uDetail, p * 0.08).a * uOffset * 2.0;
    int phases = uMode == 1 ? 1 : 2;
    col = vec3(0.0);
    for (int k = 0; k < 2; k++) {
      if (k >= phases) break;
      float fk = float(k) * 0.5, ph = fract(tt + fk);
      float w = phases == 1 ? 1.0 : 1.0 - abs(1.0 - 2.0 * ph);
      col += w * pattern(p - v * ph * uPeriod + floor(tt + fk) * vec2(0.213, 0.371) + fk);
    }
  }
  FragColor = vec4(pow(col, vec3(1.0 / 1.1)), 1.0);
}`;

type Res = { prog: WebGLProgram; vao: WebGLVertexArrayObject; detail: WebGLTexture };
const MODES = ["scroll", "one phase", "two phases"] as const;

export function FlowPhasesFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState(2);
  const [patternId, setPatternId] = useState(0);
  const [period, setPeriod] = useState(1.5);
  const [speed, setSpeed] = useState(0.6);
  const [offset, setOffset] = useState(0);
  const [arrows, setArrows] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [t0, setT0] = useState(0);
  const [aspect, setAspect] = useState(2);
  const vis = useVisible<HTMLElement>();
  const clock = useAnimationTime(playing && vis.on);
  const time = clock - t0;

  const init = (gl: WebGL2RenderingContext): Res => ({
    prog: compileProgram(gl, FULL_VS, FS), vao: gl.createVertexArray()!, detail: makeDetailTexture(gl),
  });
  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    if (size.aspect !== aspect) setAspect(size.aspect);
    gl.viewport(0, 0, size.w, size.h);
    gl.useProgram(r.prog);
    const u = (n: string) => gl.getUniformLocation(r.prog, n);
    gl.uniform1f(u("uTime"), time);
    gl.uniform1f(u("uPeriod"), period);
    gl.uniform1f(u("uOffset"), offset);
    gl.uniform1f(u("uSpeed"), speed);
    gl.uniform1f(u("uAspect"), size.aspect);
    gl.uniform1i(u("uMode"), mode);
    gl.uniform1i(u("uPattern"), patternId);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, r.detail);
    gl.uniform1i(u("uDetail"), 0);
    drawFullscreen(gl, r.vao);
  };

  // The flow as arrows, from the same formula as the shader
  const W = HALF_H * aspect, arrowList: { x: number; y: number; vx: number; vy: number }[] = [];
  for (let y = -HALF_H + 0.4; y < HALF_H; y += 0.55) for (let x = -W + 0.4; x < W; x += 0.55) {
    const r2 = x * x + y * y;
    if (r2 < (ROCK + 0.15) ** 2) continue;
    const ix = (x * x - y * y) / (r2 * r2), iy = (-2 * x * y) / (r2 * r2);
    arrowList.push({ x, y, vx: 1 - ROCK * ROCK * ix, vy: ROCK * ROCK * iy });
  }

  // Weights over two cycles, and the cursor (the offset shifts each point's phase; the plot shows zero offset)
  const PW = 400, PH = 64;
  const tri = (ph: number) => 1 - Math.abs(1 - 2 * (((ph % 1) + 1) % 1));
  const curve = (shift: number) => Array.from({ length: 201 }, (_, i) => {
    const ph = (i / 200) * 2;
    return `${(i / 200) * PW},${PH - 6 - (mode === 1 ? 1 : tri(ph + shift)) * (PH - 14)}`;
  }).join(" ");
  const cursor = (((time / period) % 2) + 2) % 2 / 2 * PW;

  const btn = (active: boolean) =>
    `px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all ${active
      ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]"
      : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40"}`;
  const slider = (label: string, value: number, onChange: (v: number) => void, min: number, max: number, step: number, unit = "") => (
    <label key={label} className="flex items-center gap-2">
      <span className="text-[9px] font-mono text-[var(--text-muted)] w-24 shrink-0">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))} className="flex-1 min-w-0 accent-[var(--primary)]" />
      <span className="text-[10px] font-mono text-[var(--primary)] w-14 text-right">{value.toFixed(2)}{unit}</span>
    </label>
  );
  const notes: [string, string][] = [
    ["figFlowPh_n0", "Each point reads the texture at p − v·t. Where the flow is uniform that is a plain scroll, but around the rock neighbouring points move at different speeds, so their texture coordinates drift apart for ever: the pattern smears into ever thinner streaks. Press 'restart time' to see how it began."],
    ["figFlowPh_n1", "Restart every T seconds: p − v·fract(t/T)·T. The stretching never exceeds one cycle's worth, but at every reset the whole pattern jumps back."],
    ["figFlowPh_n2", "Two copies half a cycle apart, each faded out at its own reset: the plot shows their weights, which always add up to 1. The jumps are gone. With the offset at 0 you can still see the whole picture pulse in step; raise it and every point cycles at its own moment."],
  ];

  return (
    <FigureShell ref={vis.ref}>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figFlowPh_title", "Carrying a texture along a flow")}
        </span>
        <div className="flex gap-1.5 flex-wrap">
          {MODES.map((m, i) => <button key={m} className={btn(mode === i)} onClick={() => setMode(i)}>{m}</button>)}
        </div>
      </div>

      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> init={init} draw={draw} look={{ yaw: 0, pitch: 0, fov: 1 }} aspect={2} phoneAspect={1.4}
          frame={[time, mode, patternId, period, speed, offset]}>
          {arrows && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`${-W} ${-HALF_H} ${2 * W} ${2 * HALF_H}`} preserveAspectRatio="none">
              {arrowList.map((a, i) => {
                // In world units, y up (the SVG's y runs down)
                const L = 0.16, x2 = a.x + a.vx * L, y2 = a.y + a.vy * L;
                const len = Math.hypot(a.vx, a.vy) || 1, ux = a.vx / len, uy = a.vy / len, hd = 0.07;
                const head = `${x2 + ux * hd},${-(y2 + uy * hd)} ${x2 - uy * hd * 0.6},${-(y2 - ux * hd * 0.6)} ${x2 + uy * hd * 0.6},${-(y2 + ux * hd * 0.6)}`;
                return (
                  <g key={i} fill="#fde68a" stroke="#fde68a" opacity={0.8}>
                    <line x1={a.x} y1={-a.y} x2={x2} y2={-y2} strokeWidth={0.025} />
                    <polygon points={head} stroke="none" />
                  </g>
                );
              })}
            </svg>
          )}
        </GLView>
      </div>

      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap items-center">
          <button className={btn(playing)} onClick={() => setPlaying(v => !v)}>{playing ? "❚❚ pause" : "▶ play"}</button>
          <button className={btn(false)} onClick={() => setT0(clock)}>{tx(t, "figFlowPh_restart", "restart time")}</button>
          <button className={btn(arrows)} onClick={() => setArrows(v => !v)}>{arrows ? "✓ " : ""}{tx(t, "figFlowPh_arrows", "flow arrows")}</button>
          <span className="w-px h-5 bg-[var(--border)] mx-1" />
          <button className={btn(patternId === 0)} onClick={() => setPatternId(0)}>checker</button>
          <button className={btn(patternId === 1)} onClick={() => setPatternId(1)}>{tx(t, "figFlowPh_water", "ripples + foam")}</button>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2 min-w-0">
            {slider("stream speed", speed, setSpeed, 0.1, 1.5, 0.05, " m/s")}
            {slider("cycle T", period, setPeriod, 0.3, 4, 0.05, " s")}
            {slider("phase offset", offset, setOffset, 0, 1, 0.05)}
            <p className="text-[11px] font-mono text-[var(--text-muted)]">
              t = {time.toFixed(1)} s{mode === 0 ? ` · ${tx(t, "figFlowPh_drift", "largest drift")} ≈ ${(speed * 2 * time).toFixed(1)} m` : ""}
            </p>
          </div>
          <div className="space-y-2 min-w-0">
            <svg viewBox={`0 0 ${PW} ${PH}`} className="w-full h-16" aria-hidden>
              <line x1={0} x2={PW} y1={PH - 6} y2={PH - 6} stroke="var(--border)" />
              {mode === 0 ? (
                <text x={PW / 2} y={PH / 2} textAnchor="middle" fontSize={11} fill="var(--text-muted)">
                  {tx(t, "figFlowPh_noCycle", "no cycle: t grows for ever")}
                </text>
              ) : (
                <>
                  <polyline points={curve(0)} fill="none" stroke="#f59e0b" strokeWidth={2} />
                  {mode === 2 && <polyline points={curve(0.5)} fill="none" stroke="#3b82f6" strokeWidth={2} />}
                  <line x1={cursor} x2={cursor} y1={2} y2={PH - 6} stroke="var(--text-main)" strokeDasharray="3 3" />
                </>
              )}
            </svg>
            <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">{tx(t, notes[mode][0], notes[mode][1])}</p>
          </div>
        </div>
      </div>
    </FigureShell>
  );
}
