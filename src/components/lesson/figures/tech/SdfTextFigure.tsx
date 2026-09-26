"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { compileProgram } from "../../kit/gl/gl";
import { GLView, type Look } from "../../kit/gl/GLView";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// Two font atlases for printable ASCII, both built here in the browser:
//   bitmap — each glyph rasterised at 32 px: coverage (alpha) per texel
//   SDF    — each glyph rasterised at 128 px, turned into a signed distance
//            field with an exact Euclidean distance transform (Felzenszwalb &
//            Huttenlocher), then sampled down to the same 32 px cells
// The same 32 px atlas budget, drawn at any size: the bitmap blurs, the SDF
// stays sharp, and thresholds on the distance give outlines, glows and
// shadows for free.

const COLS = 16, ROWS = 6, CELL = 32, SRC = 128, RATIO = SRC / CELL;
const FONT_PX = 88, BASE = 100, PEN = 20;             // glyph placement inside a 128 px source cell
const SPREAD = 16;                                      // distance (source px) mapped to the 0..1 range
const FIRST = 32, COUNT = 95;

/** 1D squared distance transform of f (Felzenszwalb & Huttenlocher 2012). */
function edt1d(f: Float64Array, n: number, d: Float64Array, v: Int32Array, z: Float64Array) {
  let k = 0;
  v[0] = 0; z[0] = -Infinity; z[1] = Infinity;
  for (let q = 1; q < n; q++) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) { k--; s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
    k++; v[k] = q; z[k] = s; z[k + 1] = Infinity;
  }
  k = 0;
  for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
}
/** In place: turns squared seed distances (0 on features, 1e20 elsewhere, fractional on edges) into distances. */
function edt2d(grid: Float64Array, w: number, h: number) {
  const n = Math.max(w, h);
  const f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) f[y] = grid[y * w + x];
    edt1d(f, h, d, v, z);
    for (let y = 0; y < h; y++) grid[y * w + x] = d[y];
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) f[x] = grid[y * w + x];
    edt1d(f, w, d, v, z);
    for (let x = 0; x < w; x++) grid[y * w + x] = Math.sqrt(d[x]);
  }
}

type Atlas = { sdf: ImageData; bitmap: ImageData; advance: number[] };
let cached: Atlas | null = null;

function buildAtlas(): Atlas {
  if (cached) return cached;
  const font = `${FONT_PX}px Georgia, 'Times New Roman', serif`;
  const src = document.createElement("canvas"); src.width = src.height = SRC;
  const sg = src.getContext("2d", { willReadFrequently: true })!;
  const bm = document.createElement("canvas"); bm.width = COLS * CELL; bm.height = ROWS * CELL;
  const bg = bm.getContext("2d")!;
  const sdf = new ImageData(COLS * CELL, ROWS * CELL);
  const advance: number[] = [];
  bg.font = `${FONT_PX / RATIO}px Georgia, 'Times New Roman', serif`;
  bg.fillStyle = "white";
  for (let i = 0; i < COUNT; i++) {
    const ch = String.fromCharCode(FIRST + i), cx = (i % COLS) * CELL, cy = Math.floor(i / COLS) * CELL;
    // Bitmap: rasterise straight at 32 px
    bg.fillText(ch, cx + PEN / RATIO, cy + BASE / RATIO);
    // SDF: rasterise at 128 px, threshold, distance-transform both sides
    sg.clearRect(0, 0, SRC, SRC);
    sg.font = font; sg.fillStyle = "white";
    sg.fillText(ch, PEN, BASE);
    advance.push(sg.measureText(ch).width);
    const px = sg.getImageData(0, 0, SRC, SRC).data;
    // Seed both transforms with the anti-aliased coverage (TinySDF's trick): an edge pixel with
    // coverage a is about (0.5 − a) px from the outline, which gives sub-pixel accurate distances.
    const toInk = new Float64Array(SRC * SRC).fill(1e20), toEmpty = new Float64Array(SRC * SRC);
    for (let p = 0; p < SRC * SRC; p++) {
      const a = px[p * 4 + 3] / 255;
      if (a === 0) continue;
      if (a === 1) { toInk[p] = 0; toEmpty[p] = 1e20; continue; }
      const e = 0.5 - a;
      toInk[p] = e > 0 ? e * e : 0;
      toEmpty[p] = e < 0 ? e * e : 0;
    }
    edt2d(toInk, SRC, SRC); edt2d(toEmpty, SRC, SRC);
    const toOutside = toEmpty, toInside = toInk;
    for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
      let signed = 0;                                             // average the 4×4 source block (> 0 inside)
      for (let j = 0; j < RATIO; j++) for (let i = 0; i < RATIO; i++) {
        const s = (y * RATIO + j) * SRC + x * RATIO + i;
        signed += toOutside[s] - toInside[s];
      }
      signed /= RATIO * RATIO;
      const val = Math.max(0, Math.min(1, 0.5 + signed / (2 * SPREAD)));
      const o = ((cy + y) * COLS * CELL + cx + x) * 4;
      sdf.data[o] = sdf.data[o + 1] = sdf.data[o + 2] = Math.round(val * 255); sdf.data[o + 3] = 255;
    }
  }
  cached = { sdf, bitmap: bg.getImageData(0, 0, bm.width, bm.height), advance };
  return cached;
}

const VS = `#version 300 es
layout(location = 0) in vec2 aPos;       // layout units (source px), baseline at y = 0
layout(location = 1) in vec2 aUV;
uniform vec2 uScale, uOffset;            // → clip space
out vec2 vUV;
void main() { vUV = aUV; gl_Position = vec4(aPos * uScale + uOffset, 0.0, 1.0); }`;
const FS = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uSdf, uBitmap;
uniform int uMode;                       // 0 bitmap, 1 SDF, 2 raw distance
uniform float uOutline, uGlow, uShadow, uSoft, uWeight;
uniform vec2 uShadowOffset;
out vec4 FragColor;                      // premultiplied alpha
void main() {
  if (uMode == 0) { float a = texture(uBitmap, vUV).a; FragColor = vec4(vec3(a), a); return; }
  float d = texture(uSdf, vUV).r;
  if (uMode == 2) { FragColor = vec4(vec3(d), 1.0); return; }
  float edge = 0.5 - uWeight;                                   // move the threshold: bolder or thinner
  float w = max(fwidth(d), 1e-4) * (1.0 + uSoft * 12.0);        // one screen pixel of the distance field
  float fill    = smoothstep(edge - w, edge + w, d);
  float outline = smoothstep(edge - uOutline - w, edge - uOutline + w, d);
  float glow    = smoothstep(edge - uGlow, edge, d) * uGlow * 6.0;
  float sh      = smoothstep(edge - 0.12, edge + 0.05, texture(uSdf, vUV - uShadowOffset).r) * uShadow;

  vec4 c = vec4(0.0);
  c = mix(c, vec4(0.0, 0.0, 0.0, 0.7), sh);                               // drop shadow
  c = mix(c, vec4(vec3(0.2, 0.6, 1.0) * min(glow, 1.0), min(glow, 1.0)), min(glow, 1.0) * (1.0 - fill));
  c = mix(c, vec4(0.95, 0.45, 0.1, 1.0), outline * step(0.001, uOutline)); // outline ring
  c = mix(c, vec4(1.0), fill);                                            // the glyph itself
  FragColor = c;
}`;

type Res = { prog: WebGLProgram; vao: WebGLVertexArrayObject; vbo: WebGLBuffer; sdf: WebGLTexture; bitmap: WebGLTexture; atlas: Atlas; count: number; text: string };
const MODES = ["bitmap 32px", "SDF 32px", "raw distance"] as const;

export function SdfTextFigure({ t }: { t?: TrackTranslations }) {
  const [text, setText] = useState("Glyphs & SDF");
  const [mode, setMode] = useState(1);
  const [size, setSize] = useState(84);
  const [outline, setOutline] = useState(0);
  const [glow, setGlow] = useState(0);
  const [shadow, setShadow] = useState(0);
  const [soft, setSoft] = useState(0);
  const [weight, setWeight] = useState(0);
  const [showAtlas, setShowAtlas] = useState(false);
  const look: Look = { yaw: 0, pitch: 0, fov: 1 };

  const init = (gl: WebGL2RenderingContext): Res => {
    const atlas = buildAtlas();
    const tex = (img: ImageData) => {
      const tt = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tt);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return tt;
    };
    const vao = gl.createVertexArray()!, vbo = gl.createBuffer()!;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
    return { prog: compileProgram(gl, VS, FS), vao, vbo, sdf: tex(atlas.sdf), bitmap: tex(atlas.bitmap), atlas, count: 0, text: "" };
  };

  const draw = (gl: WebGL2RenderingContext, r: Res, sz: { w: number; h: number; aspect: number }) => {
    const AW = COLS * CELL, AH = ROWS * CELL;
    let width = 0;
    if (showAtlas) {
      const verts = [0, 0, 0, 1, AW * RATIO, 0, 1, 1, AW * RATIO, AH * RATIO, 1, 0, 0, 0, 0, 1, AW * RATIO, AH * RATIO, 1, 0, 0, AH * RATIO, 0, 0];
      gl.bindBuffer(gl.ARRAY_BUFFER, r.vbo);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW);
      r.count = 6; width = AW * RATIO;
    } else {
      // One quad per glyph: the whole 128 px source cell, positioned at the pen
      const verts: number[] = [];
      let pen = 0;
      for (const ch of text) {
        const i = ch.charCodeAt(0) - FIRST;
        if (i < 0 || i >= COUNT) continue;
        const u0 = ((i % COLS) * CELL) / AW, u1 = u0 + CELL / AW, v0 = (Math.floor(i / COLS) * CELL) / AH, v1 = v0 + CELL / AH;
        const x0 = pen - PEN, x1 = x0 + SRC, yTop = BASE, yBot = BASE - SRC;
        verts.push(x0, yBot, u0, v1, x1, yBot, u1, v1, x1, yTop, u1, v0, x0, yBot, u0, v1, x1, yTop, u1, v0, x0, yTop, u0, v0);
        pen += r.atlas.advance[i];
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, r.vbo);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW);
      r.count = verts.length / 4; width = pen;
    }
    // Layout units → pixels (FONT_PX layout units = `size` screen px) → clip space
    const dpr = sz.w / (gl.canvas as HTMLCanvasElement).clientWidth || 1;
    const k = (size / FONT_PX) * dpr * (showAtlas ? 0.25 : 1);
    const sx = (2 * k) / sz.w, sy = (2 * k) / sz.h;
    const ox = -(width * k) / sz.w, oy = showAtlas ? -(ROWS * CELL * RATIO * k) / sz.h : -((BASE - 60) * k) / sz.h;

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, sz.w, sz.h);
    gl.clearColor(0.11, 0.12, 0.15, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(r.prog);
    const u = (n: string) => gl.getUniformLocation(r.prog, n);
    gl.uniform2f(u("uScale"), sx, sy);
    gl.uniform2f(u("uOffset"), ox, oy);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, r.sdf);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, r.bitmap);
    gl.uniform1i(u("uSdf"), 0); gl.uniform1i(u("uBitmap"), 1);
    gl.uniform1i(u("uMode"), mode);
    gl.uniform1f(u("uOutline"), outline);
    gl.uniform1f(u("uGlow"), glow);
    gl.uniform1f(u("uShadow"), shadow);
    gl.uniform1f(u("uSoft"), soft);
    gl.uniform1f(u("uWeight"), weight);
    gl.uniform2f(u("uShadowOffset"), 1.2 / (COLS * CELL), -1.2 / (ROWS * CELL));
    gl.bindVertexArray(r.vao);
    gl.drawArrays(gl.TRIANGLES, 0, r.count);
    gl.disable(gl.BLEND);
  };

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;

  return (
    <FigureShell>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figSdfText_title", "Same 32 px Atlas, Any Size — Bitmap vs Signed Distance Field")}
        </span>
        <div className="flex gap-1.5">{MODES.map((m, i) => <button key={m} className={btn(mode === i)} onClick={() => setMode(i)}>{m}</button>)}</div>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> init={init} draw={draw} look={look} frame={[text, mode, size, outline, glow, shadow, soft, weight, showAtlas]} aspect={16 / 7} />
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <input value={text} onChange={e => setText(e.target.value.slice(0, 20))} spellCheck={false}
          className="w-full bg-[var(--code-bg)] border border-[var(--code-border)] rounded px-2 py-1 font-mono text-[12px] text-[var(--code-text)] outline-none focus:border-[var(--primary)]" />
        <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {([["size (px)", size, setSize, 12, 400, 1], ["weight", weight, setWeight, -0.2, 0.2, 0.01], ["outline", outline, setOutline, 0, 0.25, 0.005], ["glow", glow, setGlow, 0, 0.3, 0.005], ["drop shadow", shadow, setShadow, 0, 1, 0.05], ["softness", soft, setSoft, 0, 1, 0.02]] as const).map(([label, v, set, min, max, step]) => (
            <label key={label} className={`flex items-center gap-2 ${mode !== 1 && label !== "size (px)" ? "opacity-40" : ""}`}>
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-20">{label}</span>
              <input type="range" min={min} max={max} step={step} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{v}</span>
            </label>
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)]">
          <input type="checkbox" checked={showAtlas} onChange={e => setShowAtlas(e.target.checked)} className="accent-[var(--primary)]" />{tx(t, "figSdfText_atlas", "show the whole atlas (512 × 192)")}
        </label>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {mode === 0
            ? tx(t, "figSdfText_bmNote", "A bitmap atlas stores coverage. Magnify it and bilinear filtering blends neighbouring texels into a blur, because 32 px of information cannot become 400 px of edge. Games used to ship one atlas per font size for exactly this reason.")
            : mode === 2
              ? tx(t, "figSdfText_rawNote", "What the SDF atlas actually stores: 0.5 on the outline, brighter inside, darker outside, changing smoothly. Bilinear filtering of a smooth ramp is almost exact, so the 0.5 crossing, the edge, is reconstructed precisely at any magnification.")
              : tx(t, "figSdfText_sdfNote", "The same 32 px budget, stored as distance. The shader thresholds the interpolated distance at 0.5 with a smoothstep one screen pixel wide, so the edge stays sharp at 400 px. Moving the threshold makes the text bolder or thinner; a second threshold draws an outline, a wide smooth band a glow, and a shifted lookup a shadow, all from one texture fetch or two. Very sharp corners round off slightly, which is what multi-channel SDFs fix.")}
        </p>
      </div>
    </FigureShell>
  );
}
