"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, forwardFrom, type Mat4 } from "../../kit/gl/gl";
import { GLView, type Look } from "../../kit/gl/GLView";
import { FULL_VS, drawFullscreen } from "../../kit/gl/glx";
import { ROOM, LIT_FS, LIT_VS, SUN, sceneMeshes, roomCamera, clampRoomLook, ROOM_LOOK, type SceneMeshes } from "../post/scene";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// The classic stencil outline, run for real in an offscreen framebuffer with a
// DEPTH24_STENCIL8 attachment (WebGL's default canvas has no stencil unless asked):
//   1. draw everything else, stencil writes off
//   2. draw the selected objects with ALWAYS/REPLACE → stencil = 1 under them
//   3. draw them again, enlarged, flat colour, only where stencil ≠ 1
// The enlarged copy can be made three ways (uniform scale, extrusion along the
// normal in world units, extrusion in clip space by N pixels) — each fails
// differently. "stencil" shows the buffer itself, drawn with EQUAL tests.

const OUT_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
uniform mat4 uModel, uView, uProjection;
uniform int uMethod;          // 0 scale (done in uModel), 1 world normal, 2 screen pixels
uniform float uWidth;         // world units for 1, pixels for 2
uniform vec2 uViewport;
void main() {
  vec3 N = normalize(mat3(uModel) * aNormal);
  vec4 world = uModel * vec4(aPos, 1.0);
  if (uMethod == 1) world.xyz += N * uWidth;
  vec4 clip = uProjection * uView * world;
  if (uMethod == 2) {
    // Push the vertex along the screen-space normal; × w undoes the perspective divide
    vec2 n = normalize((uProjection * uView * vec4(N, 0.0)).xy + 1e-6);
    clip.xy += n * uWidth * 2.0 / uViewport * clip.w;
  }
  gl_Position = clip;
}`;
const FLAT_FS = `#version 300 es
precision highp float;
uniform vec4 uColor;
out vec4 FragColor;
void main() { FragColor = uColor; }`;

const COPY_FS = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uTex;
out vec4 FragColor;
void main() { FragColor = texture(uTex, vUV); }`;

const FILL_VS = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const OBJECTS = [
  { id: "sphere", items: [5] },
  { id: "boxes", items: [3, 4] },
  { id: "stairs", items: [6, 7, 8] },
  { id: "red cube", items: [9] },
  { id: "yellow ball", items: [10] },
] as const;
const METHODS = ["scale", "normal (world)", "normal (pixels)"] as const;
const VIEWS = ["final", "stencil", "no stencil test"] as const;

type Target = { fbo: WebGLFramebuffer; tex: WebGLTexture; rb: WebGLRenderbuffer; w: number; h: number };
type Res = { lit: WebGLProgram; out: WebGLProgram; copy: WebGLProgram; fill: WebGLProgram; meshes: SceneMeshes; full: WebGLVertexArrayObject; target: Target | null };

function ensureTarget(gl: WebGL2RenderingContext, cur: Target | null, w: number, h: number): Target {
  if (cur && cur.w === w && cur.h === h) return cur;
  if (cur) { gl.deleteTexture(cur.tex); gl.deleteRenderbuffer(cur.rb); gl.deleteFramebuffer(cur.fbo); }
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  const rb = gl.createRenderbuffer()!;
  gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH24_STENCIL8, w, h);   // 24-bit depth + 8-bit stencil, packed
  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, rb);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { fbo, tex, rb, w, h };
}

/** Model matrix scaled by k about the object's own centre. */
const scaled = (m: Mat4, k: number) => mat4.multiply(m, mat4.scale(k));

export function StencilOutlineFigure({ t }: { t?: TrackTranslations }) {
  const [look, setLook] = useState<Look>(ROOM_LOOK);
  const [selected, setSelected] = useState<string[]>(["sphere", "stairs"]);
  const [method, setMethod] = useState(2);
  const [width, setWidth] = useState(4);
  const [view, setView] = useState(0);
  const [depthOff, setDepthOff] = useState(true);
  const [xray, setXray] = useState(false);

  // Width means different things per method; one slider, three ranges
  const worldW = width * 0.012, scaleK = 1 + width * 0.02;

  const init = (gl: WebGL2RenderingContext): Res => ({
    lit: compileProgram(gl, LIT_VS, LIT_FS), out: compileProgram(gl, OUT_VS, FLAT_FS),
    copy: compileProgram(gl, FULL_VS, COPY_FS), fill: compileProgram(gl, FILL_VS, FLAT_FS),
    meshes: sceneMeshes(gl), full: gl.createVertexArray()!, target: null,
  });

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    r.target = ensureTarget(gl, r.target, size.w, size.h);
    const { cam, view: V } = roomCamera(forwardFrom(look.yaw, look.pitch));
    const P = mat4.perspective(look.fov, size.aspect, 0.1, 60);
    const sel = new Set<number>(OBJECTS.filter(o => selected.includes(o.id)).flatMap(o => [...o.items]));

    const drawItem = (prog: WebGLProgram, i: number, model: Mat4) => {
      const it = ROOM[i];
      gl.uniformMatrix4fv(gl.getUniformLocation(prog, "uModel"), false, model);
      const m = r.meshes[it.mesh];
      gl.bindVertexArray(m.vao);
      gl.drawArrays(gl.TRIANGLES, 0, m.count);
    };

    gl.bindFramebuffer(gl.FRAMEBUFFER, r.target.fbo);
    gl.viewport(0, 0, size.w, size.h);
    gl.stencilMask(0xff);                                      // glClear obeys the write mask too
    gl.clearColor(0.55, 0.62, 0.72, 1);
    gl.clearStencil(0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.STENCIL_TEST);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);

    // ── 1. Everything else: stencil untouched ──
    gl.useProgram(r.lit);
    const u = (n: string) => gl.getUniformLocation(r.lit, n);
    gl.uniformMatrix4fv(u("uView"), false, V);
    gl.uniformMatrix4fv(u("uProjection"), false, P);
    gl.uniform3fv(u("uCam"), cam);
    gl.uniform3fv(u("uSun"), SUN);
    gl.stencilMask(0x00);
    ROOM.forEach((it, i) => {
      if (sel.has(i)) return;
      gl.uniform3fv(u("uColor"), it.color);
      gl.uniform1f(u("uGrid"), it.mesh === "plane" ? 1 : 0);
      drawItem(r.lit, i, it.model);
    });

    // ── 2. Selected objects: write 1 wherever they pass the depth test ──
    gl.stencilFunc(gl.ALWAYS, 1, 0xff);
    gl.stencilMask(0xff);
    for (const i of sel) {
      gl.uniform3fv(u("uColor"), ROOM[i].color);
      gl.uniform1f(u("uGrid"), 0);
      drawItem(r.lit, i, ROOM[i].model);
    }

    // Optional x-ray: the hidden parts of the selection, seen through what covers them
    gl.useProgram(r.out);
    const o = (n: string) => gl.getUniformLocation(r.out, n);
    gl.uniformMatrix4fv(o("uView"), false, V);
    gl.uniformMatrix4fv(o("uProjection"), false, P);
    gl.uniform2f(o("uViewport"), size.w, size.h);
    if (xray) {
      gl.stencilMask(0x00);
      gl.stencilFunc(gl.ALWAYS, 1, 0xff);
      gl.depthFunc(gl.GREATER);                                // only where something is in front
      gl.depthMask(false);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.uniform1i(o("uMethod"), 0);
      gl.uniform4f(o("uColor"), 1.0, 0.55, 0.1, 0.35);
      for (const i of sel) drawItem(r.out, i, ROOM[i].model);
      gl.disable(gl.BLEND);
      gl.depthMask(true);
      gl.depthFunc(gl.LESS);
    }

    // ── 3. Enlarged copy, flat colour, only where stencil ≠ 1 ──
    gl.stencilFunc(view === 2 ? gl.ALWAYS : gl.NOTEQUAL, 1, 0xff);
    gl.stencilMask(0x00);
    if (depthOff) gl.disable(gl.DEPTH_TEST);
    gl.uniform1i(o("uMethod"), method);
    gl.uniform1f(o("uWidth"), method === 1 ? worldW : width);
    gl.uniform4f(o("uColor"), 1.0, 0.6, 0.1, 1);
    for (const i of sel) drawItem(r.out, i, method === 0 ? scaled(ROOM[i].model, scaleK) : ROOM[i].model);
    gl.enable(gl.DEPTH_TEST);

    // ── Stencil view: fill the screen once per value with an EQUAL test ──
    if (view === 1) {
      gl.disable(gl.DEPTH_TEST);
      gl.useProgram(r.fill);
      gl.bindVertexArray(r.full);
      gl.stencilMask(0x00);
      const fillC = gl.getUniformLocation(r.fill, "uColor");
      ([[0, [0.08, 0.09, 0.12, 1]], [1, [0.95, 0.95, 0.95, 1]]] as const).forEach(([ref, c]) => {
        gl.stencilFunc(gl.EQUAL, ref, 0xff);
        gl.uniform4fv(fillC, c);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      });
      gl.enable(gl.DEPTH_TEST);
    }
    gl.disable(gl.STENCIL_TEST);
    gl.stencilMask(0xff);

    // ── Present ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(r.copy);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, r.target.tex);
    gl.uniform1i(gl.getUniformLocation(r.copy, "uTex"), 0);
    drawFullscreen(gl, r.full);
  };

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;
  const toggle = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const unit = method === 0 ? `×${scaleK.toFixed(2)}` : method === 1 ? `${worldW.toFixed(3)} u` : `${width} px`;

  const note = view === 1
    ? tx(t, "figStencilOut_stencilNote", "The stencil buffer after step 2: white where a selected object passed the depth test. Where a selected object is hidden behind an unselected one, the value stays 0, because a fragment that fails the depth test never reaches the REPLACE op. Select only the stairs and orbit until the sphere covers them to see it.")
    : view === 2
      ? tx(t, "figStencilOut_noTestNote", "Without the stencil test the enlarged copy simply covers the objects. The stencil is what turns a bigger silhouette into a ring.")
      : method === 0
        ? tx(t, "figStencilOut_scaleNote", "Uniform scale about the centre: the outline is thicker on big objects and thinner on small ones, and the thin stair steps barely get one. Off-centre shapes would shift instead of grow.")
        : method === 1
          ? tx(t, "figStencilOut_worldNote", "Extruding along the normals keeps the width constant in world units, so it shrinks with distance. On the cubes, each face moves out on its own and the corners split open: flat-shaded meshes need a separate set of smoothed normals for outlines.")
          : tx(t, "figStencilOut_pixelNote", "Extruding in clip space by N pixels gives the same width at any distance, which is what most games want. The cube corners still open slightly; games bake smoothed normals into a spare vertex channel for this.");

  return (
    <FigureShell>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figStencilOut_title", "Object Outlines with the Stencil Buffer")}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{tx(t, "figScene_hint", "drag to orbit · scroll to zoom")}</span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> orbit init={init} draw={draw} look={look} onLook={l => setLook(clampRoomLook(l))} fovRange={[0.5, 1.4]}
          frame={[look, selected, method, width, view, depthOff, xray]} aspect={16 / 9} />
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-16">{tx(t, "figStencilOut_select", "select")}</span>
          {OBJECTS.map(ob => <button key={ob.id} className={btn(selected.includes(ob.id))} onClick={() => toggle(ob.id)}>{ob.id}</button>)}
        </div>
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-16">{tx(t, "figStencilOut_method", "enlarge by")}</span>
          {METHODS.map((m, i) => <button key={m} className={btn(method === i)} onClick={() => setMethod(i)}>{m}</button>)}
        </div>
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-16">{tx(t, "figStencilOut_view", "show")}</span>
          {VIEWS.map((v, i) => <button key={v} className={btn(view === i)} onClick={() => setView(i)}>{v}</button>)}
        </div>
        <label className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-16">width</span>
          <input type="range" min={1} max={12} step={1} value={width} onChange={e => setWidth(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
          <span className="text-[10px] font-mono text-[var(--primary)] w-16 text-right">{unit}</span>
        </label>
        <div className="flex gap-4 flex-wrap text-[10px] font-mono text-[var(--text-muted)]">
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={depthOff} onChange={e => setDepthOff(e.target.checked)} className="accent-[var(--primary)]" />{tx(t, "figStencilOut_depthOff", "depth test off for the outline")}</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={xray} onChange={e => setXray(e.target.checked)} className="accent-[var(--primary)]" />{tx(t, "figStencilOut_xray", "x-ray hidden parts (depth GREATER)")}</label>
        </div>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">{note}</p>
      </div>
    </FigureShell>
  );
}

