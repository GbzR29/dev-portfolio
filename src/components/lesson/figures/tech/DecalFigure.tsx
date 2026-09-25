"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, forwardFrom, type Mat4 } from "../gl";
import { GLView, type Look } from "../GLView";
import { FULL_VS, drawFullscreen } from "../glx";
import { LIT_VS, LIT_FS, SUN, sceneMeshes, drawRoom, roomCamera, clampRoomLook, ROOM_LOOK, type SceneMeshes } from "../post/scene";
import { invert } from "./mat4util";

// ── What this figure shows ────────────────────────────────────────────────────
// A projected ("deferred") decal. The room is rendered first, keeping its depth
// texture. Then, for every pixel, the decal pass:
//   1. reconstructs the pixel's world position from depth and the inverse
//      view-projection matrix
//   2. moves it into the decal box's local space with the inverse decal matrix
//   3. discards it if it falls outside the unit box
//   4. uses the local x and z as texture coordinates (it projects along −Y)
// Surfaces facing away from the projection axis get a stretched decal; the
// angle fade compares the surface normal with the axis and fades those out.

const DECAL_FS = `#version 300 es
precision highp float;
in vec2 vUV;
uniform highp sampler2D uDepth;
uniform sampler2D uDecal;
uniform mat4 uInvViewProj, uInvDecal;
uniform vec3 uAxis;              // the decal's projection direction reversed (its local +Y in world space)
uniform float uFade;
out vec4 FragColor;
void main() {
  float d = texture(uDepth, vUV).r;
  if (d >= 1.0) discard;                                            // sky
  vec4 ndc = vec4(vUV * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);
  vec4 w = uInvViewProj * ndc;
  vec3 world = w.xyz / w.w;                                         // 1. world position from depth
  vec3 local = (uInvDecal * vec4(world, 1.0)).xyz;                  // 2. into the decal's box
  vec3 N = normalize(cross(dFdx(world), dFdy(world)));              // surface normal from the reconstructed positions
  if (any(greaterThan(abs(local), vec3(0.5)))) discard;            // 3. outside the box
  vec2 uv = local.xz + 0.5;                                         // 4. project along the box's Y axis
  vec4 c = texture(uDecal, uv);
  float facing = abs(dot(N, uAxis));
  float fade = uFade > 0.5 ? smoothstep(0.25, 0.6, facing) : 1.0;   // grazing surfaces: fade out instead of stretching
  float edge = smoothstep(0.5, 0.42, abs(local.y));                 // soft near/far ends of the box
  FragColor = vec4(c.rgb, c.a * fade * edge * 0.95);
}`;
const COPY_FS = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uTex;
out vec4 FragColor;
void main() { FragColor = texture(uTex, vUV); }`;
const LINE_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
uniform mat4 uMVP;
void main() { gl_Position = uMVP * vec4(aPos, 1.0); }`;
const LINE_FS = `#version 300 es
precision highp float;
out vec4 FragColor;
void main() { FragColor = vec4(1.0, 0.85, 0.2, 1.0); }`;

/** A paint-splat decal with an emblem, drawn once into a canvas (RGBA with alpha). */
function decalCanvas() {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d")!;
  let s = 5;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  g.fillStyle = "#e0402a";
  g.beginPath(); g.arc(128, 128, 78, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < 26; i++) {                                     // splat blobs and drips
    const a = rnd() * Math.PI * 2, d = 70 + rnd() * 45, r = 4 + rnd() * 16;
    g.beginPath(); g.arc(128 + Math.cos(a) * d, 128 + Math.sin(a) * d, r, 0, Math.PI * 2); g.fill();
  }
  g.fillStyle = "#fff3d6";
  g.beginPath();
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? 22 : 52; g.lineTo(128 + Math.cos(a) * rr, 128 + Math.sin(a) * rr); }
  g.closePath(); g.fill();
  return c;
}

type Tgt = { w: number; h: number; fbo: WebGLFramebuffer; color: WebGLTexture; depth: WebGLTexture };
type Res = { lit: WebGLProgram; decal: WebGLProgram; copy: WebGLProgram; line: WebGLProgram; meshes: SceneMeshes; full: WebGLVertexArrayObject; decalTex: WebGLTexture; boxVao: WebGLVertexArrayObject; tgt: Tgt | null };

function makeTarget(gl: WebGL2RenderingContext, w: number, h: number): Tgt {
  const color = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, color);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  const depth = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, depth);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, w, h, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color, 0);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depth, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { w, h, fbo, color, depth };
}

/** Decal box: translate · rotate (yaw about Y, then pitch about X) · scale. */
function decalMatrix(x: number, y: number, z: number, yaw: number, pitch: number, size: number, depth: number): Mat4 {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const Ry = mat4.identity(); Ry[0] = cy; Ry[2] = -sy; Ry[8] = sy; Ry[10] = cy;
  const Rx = mat4.identity(); Rx[5] = cp; Rx[6] = sp; Rx[9] = -sp; Rx[10] = cp;
  const S = mat4.identity(); S[0] = size; S[5] = depth; S[10] = size;
  return mat4.multiply(mat4.multiply(mat4.multiply(mat4.translation(x, y, z), Ry), Rx), S);
}

export function DecalFigure({ t }: { t?: TrackTranslations }) {
  const [look, setLook] = useState<Look>(ROOM_LOOK);
  const [pos, setPos] = useState({ x: 0.35, z: 0.45 });
  const [height, setHeight] = useState(0.35);
  const [yaw, setYaw] = useState(0.3);
  const [pitch, setPitch] = useState(0);
  const [size, setSize] = useState(1.9);
  const [depthLen, setDepthLen] = useState(1.4);
  const [fade, setFade] = useState(false);
  const [showBox, setShowBox] = useState(true);

  const M = decalMatrix(pos.x, height, pos.z, yaw, pitch, size, depthLen);

  const init = (gl: WebGL2RenderingContext): Res => {
    const decalTex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, decalTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, decalCanvas());
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);          // no mips: the uv jumps at box edges
    const edges = [[-1, -1, -1], [1, -1, -1], [1, -1, -1], [1, 1, -1], [1, 1, -1], [-1, 1, -1], [-1, 1, -1], [-1, -1, -1],
      [-1, -1, 1], [1, -1, 1], [1, -1, 1], [1, 1, 1], [1, 1, 1], [-1, 1, 1], [-1, 1, 1], [-1, -1, 1],
      [-1, -1, -1], [-1, -1, 1], [1, -1, -1], [1, -1, 1], [1, 1, -1], [1, 1, 1], [-1, 1, -1], [-1, 1, 1]].flat().map(v => v * 0.5);
    const boxVao = gl.createVertexArray()!;
    gl.bindVertexArray(boxVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(edges), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
    return {
      lit: compileProgram(gl, LIT_VS, LIT_FS), decal: compileProgram(gl, FULL_VS, DECAL_FS), copy: compileProgram(gl, FULL_VS, COPY_FS),
      line: compileProgram(gl, LINE_VS, LINE_FS), meshes: sceneMeshes(gl), full: gl.createVertexArray()!, decalTex, boxVao, tgt: null,
    };
  };

  const draw = (gl: WebGL2RenderingContext, r: Res, size2: { w: number; h: number; aspect: number }) => {
    if (!r.tgt || r.tgt.w !== size2.w || r.tgt.h !== size2.h) r.tgt = makeTarget(gl, size2.w, size2.h);
    const { cam, view: V } = roomCamera(forwardFrom(look.yaw, look.pitch));
    const P = mat4.perspective(look.fov, size2.aspect, 0.1, 60);
    const VP = mat4.multiply(P, V);

    // ── The scene, with a depth texture ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, r.tgt.fbo);
    gl.viewport(0, 0, size2.w, size2.h);
    gl.clearColor(0.55, 0.62, 0.72, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(r.lit);
    const l = (n: string) => gl.getUniformLocation(r.lit, n);
    gl.uniformMatrix4fv(l("uView"), false, V);
    gl.uniformMatrix4fv(l("uProjection"), false, P);
    gl.uniform3fv(l("uCam"), cam);
    gl.uniform3fv(l("uSun"), SUN);
    drawRoom(gl, r.lit, r.meshes);
    gl.disable(gl.DEPTH_TEST);

    // ── To the screen, then the decal blended on top ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, size2.w, size2.h);
    gl.useProgram(r.copy);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, r.tgt.color);
    gl.uniform1i(gl.getUniformLocation(r.copy, "uTex"), 0);
    drawFullscreen(gl, r.full);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(r.decal);
    const d = (n: string) => gl.getUniformLocation(r.decal, n);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, r.tgt.depth);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, r.decalTex);
    gl.uniform1i(d("uDepth"), 0); gl.uniform1i(d("uDecal"), 1);
    gl.uniformMatrix4fv(d("uInvViewProj"), false, invert(VP));
    gl.uniformMatrix4fv(d("uInvDecal"), false, invert(M));
    const axis = [M[4], M[5], M[6]], al = Math.hypot(axis[0], axis[1], axis[2]);
    gl.uniform3f(d("uAxis"), axis[0] / al, axis[1] / al, axis[2] / al);
    gl.uniform1f(d("uFade"), fade ? 1 : 0);
    drawFullscreen(gl, r.full);
    gl.disable(gl.BLEND);

    if (showBox) {
      gl.useProgram(r.line);
      gl.uniformMatrix4fv(gl.getUniformLocation(r.line, "uMVP"), false, mat4.multiply(VP, M));
      gl.bindVertexArray(r.boxVao);
      gl.drawArrays(gl.LINES, 0, 24);
    }
  };

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figDecal_title", "A Projected Decal — Reconstructed From the Depth Buffer")}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{tx(t, "figScene_hint", "drag to orbit · scroll to zoom")}</span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> orbit init={init} draw={draw} look={look} onLook={l => setLook(clampRoomLook(l))} fovRange={[0.5, 1.4]}
          frame={[look, pos.x, pos.z, height, yaw, pitch, size, depthLen, fade, showBox]} aspect={16 / 9} />
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {([["x", pos.x, (v: number) => setPos(p => ({ ...p, x: v })), -2.8, 2, 0.02], ["z", pos.z, (v: number) => setPos(p => ({ ...p, z: v })), -2.8, 2, 0.02],
            ["height", height, setHeight, 0, 3, 0.02], ["yaw", yaw, setYaw, -3.14, 3.14, 0.02], ["tilt (pitch)", pitch, setPitch, -1.57, 1.57, 0.02],
            ["size", size, setSize, 0.4, 4, 0.02], ["projection depth", depthLen, setDepthLen, 0.1, 4, 0.02]] as [string, number, (v: number) => void, number, number, number][]).map(([label, v, set, min, max, step]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-24">{label}</span>
              <input type="range" min={min} max={max} step={step} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{v.toFixed(2)}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-4 flex-wrap text-[10px] font-mono text-[var(--text-muted)]">
          <button className={btn(fade)} onClick={() => setFade(f => !f)}>{fade ? "angle fade on" : "angle fade off"}</button>
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={showBox} onChange={e => setShowBox(e.target.checked)} className="accent-[var(--primary)]" />{tx(t, "figDecal_box", "show the projector box")}</label>
        </div>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {fade
            ? tx(t, "figDecal_fadeNote", "With the angle fade, only surfaces that roughly face the projector keep the decal; the smear on the wall disappears. It is one dot product between the reconstructed normal and the box axis. This is also why engines limit a decal to surfaces within ~60° of its direction.")
            : tx(t, "figDecal_note", "The decal lands on whatever the box contains: the floor, the wall and the boxes alike, with no knowledge of meshes. Tilt it toward the corner. On the floor it looks right, but on the wall, nearly parallel to the projection axis, one row of texels is smeared across the whole wall height. Turn on the angle fade. Moving objects inside the box would pick it up too, which is why engines mask decals with the stencil buffer or per-object flags.")}
        </p>
      </div>
    </figure>
  );
}
