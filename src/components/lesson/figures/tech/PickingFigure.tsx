"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, forwardFrom, type Mat4, type Vec3 } from "../../kit/gl/gl";
import { GLView, type Look } from "../../kit/gl/GLView";
import { trs } from "../../kit/gl/glx";
import { invert } from "./mat4util";
import { ROOM, LIT_VS, LIT_FS, SUN, sceneMeshes, roomCamera, clampRoomLook, ROOM_LOOK, type SceneMeshes } from "../post/scene";

// ── What this figure shows ────────────────────────────────────────────────────
// Three ways to answer "what is under the mouse?":
//   bounding spheres — unproject the pointer into a world-space ray, test it
//                      against one sphere per object: fast, but loose
//   exact shapes     — move the ray into each object's local space with the
//                      inverse model matrix and test the unit box / sphere /
//                      plane exactly (slab test, quadratic)
//   ID buffer        — render every object with its id as the colour into an
//                      offscreen buffer, read back the one pixel under the
//                      pointer: exact to the pixel, whatever the shape
// The orange marker is the ray's hit point.

const NAMES = ["floor", "back wall", "left wall", "big box", "small box", "sphere", "step 1", "step 2", "step 3", "red cube", "yellow ball"];
const MODES = ["bounding spheres", "exact shapes", "ID buffer"] as const;

const ID_FS = `#version 300 es
precision highp float;
in vec3 vWorld; in vec3 vNormal; in vec2 vUV;
uniform vec3 uColor;        // the id, encoded as a colour: (id + 1) / 255 in red
uniform vec3 uCam, uSun; uniform float uGrid;
out vec4 FragColor;
void main() { FragColor = vec4(uColor, 1.0); }`;
const VIEW_FS = `#version 300 es
precision highp float;
in vec3 vWorld; in vec3 vNormal; in vec2 vUV;
uniform vec3 uColor, uCam, uSun; uniform float uGrid;
out vec4 FragColor;
void main() {
  float id = floor(uColor.r * 255.0 + 0.5);
  vec3 c = 0.5 + 0.5 * cos(6.2831 * (id * 0.137 + vec3(0.0, 0.33, 0.67)));   // false colour per id
  FragColor = vec4(c, 1.0);
}`;

const xf4 = (m: Mat4, v: [number, number, number, number]) => [0, 1, 2, 3].map(r => m[r] * v[0] + m[4 + r] * v[1] + m[8 + r] * v[2] + m[12 + r] * v[3]);

/** Ray vs unit shapes in local space. Returns t or Infinity. */
function hitLocal(kind: "cube" | "sphere" | "plane", o: Vec3, d: Vec3): number {
  if (kind === "sphere") {                                   // |o + t d| = 0.5
    const b = o[0] * d[0] + o[1] * d[1] + o[2] * d[2], c = o[0] ** 2 + o[1] ** 2 + o[2] ** 2 - 0.25;
    const a = d[0] ** 2 + d[1] ** 2 + d[2] ** 2, h = b * b - a * c;
    if (h < 0) return Infinity;
    const t = (-b - Math.sqrt(h)) / a;
    return t > 0 ? t : Infinity;
  }
  if (kind === "plane") {
    if (Math.abs(d[1]) < 1e-8) return Infinity;
    const t = -o[1] / d[1], x = o[0] + d[0] * t, z = o[2] + d[2] * t;
    return t > 0 && Math.abs(x) <= 0.5 && Math.abs(z) <= 0.5 ? t : Infinity;
  }
  let tin = -Infinity, tout = Infinity;                      // slab test against [-0.5, 0.5]³
  for (let k = 0; k < 3; k++) {
    const inv = 1 / d[k], t0 = (-0.5 - o[k]) * inv, t1 = (0.5 - o[k]) * inv;
    tin = Math.max(tin, Math.min(t0, t1)); tout = Math.min(tout, Math.max(t0, t1));
  }
  return tin <= tout && tout > 0 ? Math.max(tin, 0) : Infinity;
}

type Target = { fbo: WebGLFramebuffer; tex: WebGLTexture; rb: WebGLRenderbuffer; w: number; h: number };
type Res = { lit: WebGLProgram; id: WebGLProgram; view: WebGLProgram; meshes: SceneMeshes; target: Target | null };

export function PickingFigure({ t }: { t?: TrackTranslations }) {
  const [look, setLook] = useState<Look>(ROOM_LOOK);
  const [mode, setMode] = useState(1);
  const [showIds, setShowIds] = useState(false);
  const [hover, setHover] = useState<{ x: number; y: number } | null>({ x: 0.1, y: -0.2 });
  const [result, setResult] = useState<{ ray: number; rayT: number; id: number }>({ ray: -1, rayT: 0, id: -1 });

  const init = (gl: WebGL2RenderingContext): Res => ({
    lit: compileProgram(gl, LIT_VS, LIT_FS), id: compileProgram(gl, LIT_VS, ID_FS), view: compileProgram(gl, LIT_VS, VIEW_FS),
    meshes: sceneMeshes(gl), target: null,
  });

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    const { cam, view: V } = roomCamera(forwardFrom(look.yaw, look.pitch));
    const P = mat4.perspective(look.fov, size.aspect, 0.1, 60);

    // ── 1. The ray: unproject the pointer at the near and far planes ──
    let rayHit = -1, rayT = Infinity, hitPoint: Vec3 | null = null;
    if (hover) {
      const inv = invert(mat4.multiply(P, V));
      const n = xf4(inv, [hover.x, hover.y, -1, 1]), f = xf4(inv, [hover.x, hover.y, 1, 1]);
      const pn: Vec3 = [n[0] / n[3], n[1] / n[3], n[2] / n[3]], pf: Vec3 = [f[0] / f[3], f[1] / f[3], f[2] / f[3]];
      const dir: Vec3 = [pf[0] - pn[0], pf[1] - pn[1], pf[2] - pn[2]];
      const dl = Math.hypot(...dir); dir[0] /= dl; dir[1] /= dl; dir[2] /= dl;
      ROOM.forEach((it, i) => {
        let tt: number;
        if (mode === 0) {                                     // one bounding sphere per object
          const c: Vec3 = [it.model[12], it.model[13], it.model[14]];
          const s = Math.max(Math.hypot(it.model[0], it.model[1], it.model[2]), Math.hypot(it.model[4], it.model[5], it.model[6]), Math.hypot(it.model[8], it.model[9], it.model[10]));
          const rad = it.mesh === "sphere" ? s * 0.5 : s * 0.5 * Math.sqrt(it.mesh === "plane" ? 2 : 3);
          const oc: Vec3 = [pn[0] - c[0], pn[1] - c[1], pn[2] - c[2]];
          const b = oc[0] * dir[0] + oc[1] * dir[1] + oc[2] * dir[2], h = b * b - (oc[0] ** 2 + oc[1] ** 2 + oc[2] ** 2 - rad * rad);
          tt = h < 0 ? Infinity : -b - Math.sqrt(h) > 0 ? -b - Math.sqrt(h) : Infinity;
        } else {                                              // exact: into local space, unit shape
          const im = invert(it.model);
          const lo = xf4(im, [pn[0], pn[1], pn[2], 1]), ld = xf4(im, [dir[0], dir[1], dir[2], 0]);
          tt = hitLocal(it.mesh, [lo[0], lo[1], lo[2]], [ld[0], ld[1], ld[2]]);   // same t: ld is not normalised
        }
        if (tt < rayT) { rayT = tt; rayHit = i; }
      });
      if (rayHit >= 0) hitPoint = [pn[0] + dir[0] * rayT, pn[1] + dir[1] * rayT, pn[2] + dir[2] * rayT];
    }

    // ── 2. The ID buffer: every object drawn in a flat colour that encodes its index ──
    if (!r.target || r.target.w !== size.w || r.target.h !== size.h) {
      if (r.target) { gl.deleteTexture(r.target.tex); gl.deleteRenderbuffer(r.target.rb); gl.deleteFramebuffer(r.target.fbo); }
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, size.w, size.h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      const rb = gl.createRenderbuffer()!;
      gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, size.w, size.h);
      const fbo = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);
      r.target = { fbo, tex, rb, w: size.w, h: size.h };
    }
    const drawAll = (prog: WebGLProgram, color: (i: number) => Vec3, fb: WebGLFramebuffer | null) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.viewport(0, 0, size.w, size.h);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.useProgram(prog);
      const u = (n: string) => gl.getUniformLocation(prog, n);
      gl.uniformMatrix4fv(u("uView"), false, V);
      gl.uniformMatrix4fv(u("uProjection"), false, P);
      gl.uniform3fv(u("uCam"), cam);
      gl.uniform3fv(u("uSun"), SUN);
      ROOM.forEach((it, i) => {
        gl.uniformMatrix4fv(u("uModel"), false, it.model);
        gl.uniform3fv(u("uColor"), color(i));
        gl.uniform1f(u("uGrid"), it.mesh === "plane" ? 1 : 0);
        const m = r.meshes[it.mesh];
        gl.bindVertexArray(m.vao);
        gl.drawArrays(gl.TRIANGLES, 0, m.count);
      });
    };
    gl.clearColor(0, 0, 0, 0);
    drawAll(r.id, i => [(i + 1) / 255, 0, 0], r.target.fbo);
    let idHit = -1;
    if (hover) {
      const px = new Uint8Array(4);
      const x = Math.round(((hover.x + 1) / 2) * size.w), y = Math.round(((hover.y + 1) / 2) * size.h);   // GL: y up
      gl.readPixels(Math.min(size.w - 1, Math.max(0, x)), Math.min(size.h - 1, Math.max(0, y)), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      idHit = px[0] - 1;                                                     // 0 = background
    }

    // ── 3. What the reader sees ──
    const picked = mode === 2 ? idHit : rayHit;
    gl.clearColor(0.55, 0.62, 0.72, 1);
    if (showIds) drawAll(r.view, i => [(i + 1) / 255, 0, 0], null);
    else drawAll(r.lit, i => (i === picked ? [1.0, 0.62, 0.15] : ROOM[i].color), null);
    if (hitPoint && mode !== 2) {                                            // hit marker
      gl.useProgram(r.lit);
      gl.uniformMatrix4fv(gl.getUniformLocation(r.lit, "uModel"), false, trs(hitPoint, 0.12));
      gl.uniform3fv(gl.getUniformLocation(r.lit, "uColor"), [1, 0.3, 0.1]);
      gl.uniform1f(gl.getUniformLocation(r.lit, "uGrid"), 0);
      gl.disable(gl.DEPTH_TEST);
      gl.bindVertexArray(r.meshes.sphere.vao);
      gl.drawArrays(gl.TRIANGLES, 0, r.meshes.sphere.count);
      gl.enable(gl.DEPTH_TEST);
    }
    if (result.ray !== rayHit || result.id !== idHit || Math.abs(result.rayT - rayT) > 1e-3) setResult({ ray: rayHit, rayT: Number.isFinite(rayT) ? rayT : 0, id: idHit });
  };

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;
  const disagree = result.ray !== result.id;

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figPick_title", "Picking — What Is Under the Mouse?")}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{tx(t, "figPick_hint", "move the pointer over the scene · drag to orbit")}</span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2 relative">
        <GLView<Res> orbit init={init} draw={draw} look={look} onLook={l => setLook(clampRoomLook(l))} onHover={h => { if (h) setHover(h); }}
          fovRange={[0.5, 1.4]} frame={[look, mode, showIds, hover?.x, hover?.y]} aspect={16 / 9} />
        <div className="absolute top-3 left-3 font-mono text-[10.5px] text-white/90 bg-black/55 rounded px-2 py-1.5 pointer-events-none leading-relaxed">
          <div>{mode === 0 ? "sphere" : "exact"} ray → <b>{result.ray >= 0 ? NAMES[result.ray] : "nothing"}</b>{result.ray >= 0 ? ` (t = ${result.rayT.toFixed(2)})` : ""}</div>
          <div>ID buffer → <b>{result.id >= 0 ? `${NAMES[result.id]} (id ${result.id})` : "background"}</b></div>
          {disagree && <div className="text-amber-300">{tx(t, "figPick_disagree", "the two methods disagree here")}</div>}
        </div>
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-20">{tx(t, "figPick_highlight", "highlight")}</span>
          {MODES.map((m, i) => <button key={m} className={btn(mode === i)} onClick={() => setMode(i)}>{m}</button>)}
          <label className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)] ml-3">
            <input type="checkbox" checked={showIds} onChange={e => setShowIds(e.target.checked)} className="accent-[var(--primary)]" />{tx(t, "figPick_showIds", "show the ID buffer")}
          </label>
        </div>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {mode === 0
            ? tx(t, "figPick_sphereNote", "One sphere per object is the cheapest test, but a sphere around a flat wall or a long step is mostly empty space. Point at the air near the stairs or the corner of a box: the sphere test claims a hit that the ID buffer (and your eyes) disagree with. Good as a first rejection pass, not as the answer.")
            : mode === 1
              ? tx(t, "figPick_exactNote", "The same ray, moved into each object's local space by its inverse model matrix, where every box is the unit cube and every ball the unit sphere. Rotations and non-uniform scales come for free. It agrees with the ID buffer everywhere and gives the hit point and distance, which the ID buffer does not.")
              : tx(t, "figPick_idNote", "The ID buffer renders the scene once more with each object's index as its colour, then reads back one pixel. It is exact for any shape, including alpha-tested leaves and skinned characters, because it is the rasteriser's own answer. The cost is an extra pass and a GPU→CPU readback, done asynchronously in a real engine (see Buffer Streaming & Sync).")}
        </p>
      </div>
    </figure>
  );
}
