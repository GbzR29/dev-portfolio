"use client";

import { useEffect, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { compileProgram } from "../gl";
import { FULL_VS, drawFullscreen, makeColorTarget, type ColorTarget } from "../glx";
import { GLView, useAnimationTime, type Look } from "../GLView";

// ── What this figure shows ────────────────────────────────────────────────────
// Temporal anti-aliasing, one ingredient at a time, on a deliberately tiny
// image (192×108, shown with big pixels): a spinning wheel of thin spokes and
// a sliding fence. Jitter alone flickers; blending without reprojection
// smears; reprojecting with motion vectors follows the motion; clamping the
// history to the current neighbourhood removes the ghosts that remain.

const RW = 192, RH = 108;

// The scene and its motion, shared by every pass. p is in [0,1]×[0,1] of the low-res image.
const SCENE = `
const float ASPECT = ${(RW / RH).toFixed(5)};
uniform float uAng, uShift;         // wheel angle, fence offset (now)
uniform float uDAng, uDShift;       // how much they moved since the last frame
const vec2 WHEEL = vec2(0.3, 0.5);
vec2 toWorld(vec2 p) { return vec2(p.x * ASPECT, p.y); }
float lineAA(float d, float w) { return step(abs(d), w); }       // hard, one-sample coverage on purpose
vec3 scene(vec2 p) {
  vec2 q = toWorld(p);
  vec3 col = mix(vec3(0.1, 0.12, 0.18), vec3(0.18, 0.2, 0.28), p.y);
  // wheel: rim + 14 spokes, thinner than a pixel
  vec2 w = q - toWorld(WHEEL);
  float r = length(w);
  if (r < 0.3) {
    float a = atan(w.y, w.x) - uAng;
    float s = abs(fract(a / 6.2831853 * 14.0 + 0.5) - 0.5) / 14.0 * 6.2831853 * r;   // distance to the nearest spoke
    col = mix(col, vec3(0.95, 0.8, 0.35), lineAA(s, 0.0035));
  }
  col = mix(col, vec3(0.95, 0.8, 0.35), lineAA(r - 0.3, 0.004));
  // fence: thin vertical bars sliding to the right
  if (q.x > 1.0 && q.x < 1.72 && p.y > 0.18 && p.y < 0.82) {
    float x = fract((q.x - uShift) * 22.0);
    col = mix(col, vec3(0.5, 0.85, 1.0), lineAA(x - 0.5, 0.07));
  }
  // a static fan of thin lines
  vec2 f = q - vec2(1.36, 0.05);
  float fa = atan(f.y, f.x);
  col = mix(col, vec3(0.8, 0.5, 0.9), lineAA(sin(fa * 40.0) * length(f), 0.0035) * step(length(f), 0.12));
  return col;
}
// Where was the surface under p one frame ago? (exact, since we know how things move)
vec2 prevPos(vec2 p) {
  vec2 q = toWorld(p);
  vec2 w = q - toWorld(WHEEL);
  if (length(w) < 0.305) {
    float c = cos(-uDAng), s = sin(-uDAng);
    vec2 wp = vec2(c * w.x - s * w.y, s * w.x + c * w.y);
    q = toWorld(WHEEL) + wp;
  } else if (q.x > 1.0 && q.x < 1.72 && p.y > 0.18 && p.y < 0.82) {
    q.x -= uDShift;
  }
  return vec2(q.x / ASPECT, q.y);
}`;

const CURRENT_FS = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 FragColor;
uniform vec2 uJitter;               // sub-pixel offset in pixels, −0.5 … 0.5
uniform int uRef;                   // 1: 8×8 supersampled reference
${SCENE}
void main() {
  vec2 px = gl_FragCoord.xy;
  if (uRef == 1) {
    vec3 c = vec3(0.0);
    for (int j = 0; j < 8; j++) for (int i = 0; i < 8; i++) c += scene((floor(px) + (vec2(i, j) + 0.5) / 8.0) / vec2(${RW}.0, ${RH}.0));
    FragColor = vec4(c / 64.0, 1.0);
    return;
  }
  // One sample per pixel, at the pixel centre shifted by this frame's jitter
  FragColor = vec4(scene((px + uJitter) / vec2(${RW}.0, ${RH}.0)), 1.0);
}`;

const RESOLVE_FS = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 FragColor;
uniform sampler2D uCur, uHist;
uniform int uMode;                  // 2 blend, 3 reproject, 4 reproject + clamp
uniform float uAlpha;
uniform bool uFirst;
${SCENE}
void main() {
  vec2 uv = gl_FragCoord.xy / vec2(${RW}.0, ${RH}.0);
  vec3 cur = texture(uCur, uv).rgb;
  if (uFirst) { FragColor = vec4(cur, 1.0); return; }
  vec2 prevUv = uMode >= 3 ? prevPos(uv) : uv;            // follow the motion vector back
  vec3 hist = texture(uHist, prevUv).rgb;
  if (uMode == 4) {
    // Clamp the history into the colour range of the current 3×3 neighbourhood
    vec3 lo = vec3(1e9), hi = vec3(-1e9);
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec3 c = texture(uCur, uv + vec2(i, j) / vec2(${RW}.0, ${RH}.0)).rgb;
      lo = min(lo, c); hi = max(hi, c);
    }
    hist = clamp(hist, lo, hi);
  }
  // off-screen history is unusable: take the current sample
  if (any(lessThan(prevUv, vec2(0.0))) || any(greaterThan(prevUv, vec2(1.0)))) hist = cur;
  FragColor = vec4(mix(hist, cur, uAlpha), 1.0);
}`;

const SHOW_FS = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 FragColor;
uniform sampler2D uImg;
uniform bool uVectors;
${SCENE}
void main() {
  vec3 c = texture(uImg, vUV).rgb;          // NEAREST: each low-res pixel is a visible block
  if (uVectors) {
    vec2 mv = (vUV - prevPos(vUV)) * vec2(${RW}.0, ${RH}.0);   // motion in pixels per frame
    c = mix(c, vec3(0.5 + mv * 0.25, 0.5), clamp(length(mv) * 2.0, 0.0, 0.8));
  }
  FragColor = vec4(c, 1.0);
}`;

const MODES = ["no AA", "jitter only", "blend history", "+ reprojection", "+ neighbourhood clamp", "reference (64 spp)"] as const;
const halton = (i: number, b: number) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };
const JITTER = Array.from({ length: 16 }, (_, i) => [halton(i + 1, 2) - 0.5, halton(i + 1, 3) - 0.5]);

type Res = {
  cur: WebGLProgram; resolve: WebGLProgram; show: WebGLProgram; vao: WebGLVertexArrayObject;
  curT: ColorTarget; hist: [ColorTarget, ColorTarget]; ping: number; frame: number; lastTime: number; ang: number; shift: number; mode: number;
};
const LOOK: Look = { yaw: 0, pitch: 0, fov: 1 };

export function TaaFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState(4);
  const [alpha, setAlpha] = useState(0.1);
  const [speed, setSpeed] = useState(1);
  const [vectors, setVectors] = useState(false);
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
  const time = useAnimationTime(playing && inView);

  const init = (gl: WebGL2RenderingContext): Res => {
    const mk = () => makeColorTarget(gl, RW, RH, { float: true, depth: false, linear: true });
    const curT = mk();
    for (const tgt of [curT]) { gl.bindTexture(gl.TEXTURE_2D, tgt.tex[0]); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); }
    return {
      cur: compileProgram(gl, FULL_VS, CURRENT_FS), resolve: compileProgram(gl, FULL_VS, RESOLVE_FS), show: compileProgram(gl, FULL_VS, SHOW_FS),
      vao: gl.createVertexArray()!, curT, hist: [mk(), mk()], ping: 0, frame: 0, lastTime: 0, ang: 0, shift: 0, mode: -1,
    };
  };

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    const dt = Math.min(0.05, Math.max(0, time - r.lastTime));
    r.lastTime = time;
    const dAng = 1.6 * speed * dt, dShift = 0.25 * speed * dt;
    r.ang += dAng; r.shift += dShift;
    const first = r.mode !== mode;
    r.mode = mode;
    r.frame++;
    const jitter = mode === 0 ? [0, 0] : JITTER[r.frame % JITTER.length];
    const setMotion = (p: WebGLProgram) => {
      gl.uniform1f(gl.getUniformLocation(p, "uAng"), r.ang); gl.uniform1f(gl.getUniformLocation(p, "uShift"), r.shift);
      gl.uniform1f(gl.getUniformLocation(p, "uDAng"), dAng); gl.uniform1f(gl.getUniformLocation(p, "uDShift"), dShift);
    };
    // 1. This frame, one jittered sample per pixel
    gl.bindFramebuffer(gl.FRAMEBUFFER, r.curT.fbo);
    gl.viewport(0, 0, RW, RH);
    gl.useProgram(r.cur);
    setMotion(r.cur);
    gl.uniform2f(gl.getUniformLocation(r.cur, "uJitter"), jitter[0], jitter[1]);
    gl.uniform1i(gl.getUniformLocation(r.cur, "uRef"), mode === 5 ? 1 : 0);
    drawFullscreen(gl, r.vao);
    // 2. Resolve against the history (modes 2–4)
    let shown = r.curT.tex[0];
    if (mode >= 2 && mode <= 4) {
      const src = r.hist[r.ping], dst = r.hist[1 - r.ping];
      gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fbo);
      gl.useProgram(r.resolve);
      setMotion(r.resolve);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, r.curT.tex[0]); gl.uniform1i(gl.getUniformLocation(r.resolve, "uCur"), 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, src.tex[0]); gl.uniform1i(gl.getUniformLocation(r.resolve, "uHist"), 1);
      gl.uniform1i(gl.getUniformLocation(r.resolve, "uMode"), mode);
      gl.uniform1f(gl.getUniformLocation(r.resolve, "uAlpha"), alpha);
      gl.uniform1i(gl.getUniformLocation(r.resolve, "uFirst"), first ? 1 : 0);
      drawFullscreen(gl, r.vao);
      r.ping = 1 - r.ping;
      shown = dst.tex[0];
    }
    // 3. Show, with big pixels
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, size.w, size.h);
    gl.useProgram(r.show);
    setMotion(r.show);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, shown);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.uniform1i(gl.getUniformLocation(r.show, "uImg"), 0);
    gl.uniform1i(gl.getUniformLocation(r.show, "uVectors"), vectors ? 1 : 0);
    drawFullscreen(gl, r.vao);
    gl.bindTexture(gl.TEXTURE_2D, shown);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);          // history is read with bilinear filtering
  };

  const btn = (active: boolean) =>
    `px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all ${active
      ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]"
      : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40"}`;
  const notes: [string, string][] = [
    ["figTaa_n0", "One sample at every pixel centre. The thin spokes and bars fall between samples and vanish or break into stairs, and the moving ones crawl."],
    ["figTaa_n1", "Each frame the sample moves to a different spot inside the pixel (a Halton sequence). Over 16 frames the pixel sees 16 positions, but shown one at a time they only flicker."],
    ["figTaa_n2", "Blend each new frame into the previous result: history = mix(history, current, α). The static fan becomes smooth, since it is the average of all the jittered samples. Everything that moves smears into a trail, because the history at this pixel belongs to where the object used to be."],
    ["figTaa_n3", "Motion vectors say where each pixel's surface was one frame ago, and the history is read from there. The wheel and fence now stay sharp while moving. Ghosts remain where the history is simply wrong: at edges, where a surface just appeared (disocclusion)."],
    ["figTaa_n4", "Before blending, the history colour is clamped into the range of the current pixel's 3×3 neighbourhood. History that cannot belong here (a ghost) is pulled back to plausible colours. This is the step that made TAA shippable."],
    ["figTaa_n5", "The ground truth: 64 samples per pixel every frame. TAA with clamping gets close to this at the cost of one sample per pixel plus one history read."],
  ];

  return (
    <figure ref={figRef} className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{tx(t, "figTaa_title", "Temporal Anti-Aliasing, Step by Step")}</span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{RW}×{RH} {tx(t, "figTaa_px", "pixels, magnified")}</span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> init={init} draw={draw} look={LOOK} frame={[time, mode, alpha, speed, vectors]} aspect={RW / RH} />
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap items-center">
          {MODES.map((m, i) => <button key={m} className={btn(mode === i)} onClick={() => setMode(i)}>{i + 1}. {m}</button>)}
        </div>
        <div className="flex gap-4 flex-wrap items-center">
          {([["α (new frame weight)", alpha, setAlpha, 0.02, 0.6, 0.01], ["motion speed", speed, setSpeed, 0, 3, 0.05]] as const).map(([label, v, fn, min, max, step]) => (
            <label key={label} className="flex items-center gap-2 flex-1 min-w-[220px]">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-36">{label}</span>
              <input type="range" min={min} max={max} step={step} value={v} onChange={e => fn(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{v}</span>
            </label>
          ))}
          <button className={btn(vectors)} onClick={() => setVectors(v => !v)}>{vectors ? "✓ " : ""}{tx(t, "figTaa_mv", "show motion vectors")}</button>
          <button className={btn(playing)} onClick={() => setPlaying(v => !v)}>{playing ? "❚❚ pause" : "▶ play"}</button>
        </div>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">{tx(t, notes[mode][0], notes[mode][1])}</p>
      </div>
    </figure>
  );
}
