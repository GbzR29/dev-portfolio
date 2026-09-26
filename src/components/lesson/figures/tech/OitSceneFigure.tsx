"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, forwardFrom, type Mat4, type Vec3 } from "../../kit/gl/gl";
import { GLView, useAnimationTime, type Look } from "../../kit/gl/GLView";
import { useVisible } from "../../kit/figure";
import { uploadMesh, spherePNUT, planePNUT, wallPNUT, cubePNUT, trs, floatTargets, FULL_VS, drawFullscreen, type Mesh } from "../../kit/gl/glx";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// Transparent geometry that no sort can fix: three coloured glass panes that
// cut through each other at the centre, plus a ring of glass balls.
//   unsorted — "over" blending in submission order
//   sorted   — objects sorted back to front by their centres (the usual fix):
//              correct for the balls, still wrong where the panes intersect
//   WBOIT    — weighted blended OIT, two render targets:
//                accum  (RGBA16F, ONE+ONE):              Σ w·α·C, Σ w·α
//                reveal (R8, ZERO + ONE_MINUS_SRC_COLOR): Π (1 − α)
//              then one fullscreen pass composites them over the opaque image
//   additive — ONE+ONE: order-free, but only right for light-like effects

const OBJ_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
uniform mat4 uModel, uView, uProjection;
out vec3 vNormal; out float vDepth; out vec3 vWorld;
void main() {
  vec4 w = uModel * vec4(aPos, 1.0), v = uView * w;
  vWorld = w.xyz; vNormal = mat3(uModel) * aNormal; vDepth = -v.z;
  gl_Position = uProjection * v;
}`;
const OPAQUE_FS = `#version 300 es
precision highp float;
in vec3 vNormal; in float vDepth; in vec3 vWorld;
uniform vec3 uColor;
out vec4 FragColor;
void main() {
  vec3 N = normalize(vNormal);
  vec2 g = abs(fract(vWorld.xz * 0.5) - 0.5);
  float line = step(0.46, max(g.x, g.y)) * step(0.5, N.y);
  vec3 c = uColor * (0.35 + 0.65 * max(dot(N, normalize(vec3(0.4, 0.8, 0.3))), 0.0)) * (1.0 - 0.3 * line);
  FragColor = vec4(pow(c, vec3(1.0 / 2.2)), 1.0);
}`;
const GLASS_FS = `#version 300 es
precision highp float;
in vec3 vNormal; in float vDepth; in vec3 vWorld;
uniform vec3 uColor;
uniform float uAlpha;
uniform int uPass;          // 0 over, 1 additive, 2 WBOIT accumulate, 3 WBOIT revealage
out vec4 FragColor;
void main() {
  vec3 N = normalize(vNormal);
  if (!gl_FrontFacing) N = -N;
  vec3 c = uColor * (0.55 + 0.45 * abs(dot(N, normalize(vec3(0.4, 0.8, 0.3)))));
  float a = uAlpha;
  if (uPass == 0) FragColor = vec4(c, a);
  else if (uPass == 1) FragColor = vec4(c * a, 1.0);
  else if (uPass == 2) {
    // McGuire & Bavoil's depth weight (their eq. 7): nearer surfaces count more
    float w = clamp(10.0 / (1e-5 + pow(vDepth / 5.0, 2.0) + pow(vDepth / 200.0, 6.0)), 1e-2, 3e3);
    FragColor = vec4(c * a * w, a * w);
  } else FragColor = vec4(a);                  // blended as dst · (1 − a)
}`;
const COMPOSITE_FS = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uOpaque, uAccum, uReveal;
uniform int uWboit;
out vec4 FragColor;
void main() {
  vec3 opaque = texture(uOpaque, vUV).rgb;
  if (uWboit == 0) { FragColor = vec4(opaque, 1.0); return; }
  vec4 acc = texture(uAccum, vUV);
  float r = texture(uReveal, vUV).r;                          // Π (1 − αᵢ): how much background survives
  vec3 avg = acc.rgb / max(acc.a, 1e-5);                      // weighted average colour of the layers
  FragColor = vec4(avg * (1.0 - r) + opaque * r, 1.0);
}`;

const MODES = ["unsorted", "sorted by object", "WBOIT", "additive"] as const;
type Obj = { mesh: "quad" | "sphere"; model: Mat4; color: Vec3; center: Vec3 };

function glassObjects(spin: number): Obj[] {
  const rotY = (a: number) => { const m = mat4.identity(); m[0] = Math.cos(a); m[2] = -Math.sin(a); m[8] = Math.sin(a); m[10] = Math.cos(a); return m; };
  const rotX = (a: number) => { const m = mat4.identity(); m[5] = Math.cos(a); m[6] = Math.sin(a); m[9] = -Math.sin(a); m[10] = Math.cos(a); return m; };
  const base = mat4.multiply(mat4.translation(0, 1.6, 0), rotY(spin));
  const s = mat4.scale(2.6);
  const out: Obj[] = [
    { mesh: "quad", model: mat4.multiply(base, s), color: [1, 0.25, 0.2], center: [0, 1.6, 0] },
    { mesh: "quad", model: mat4.multiply(mat4.multiply(base, rotY(Math.PI / 2)), s), color: [0.2, 1, 0.35], center: [0, 1.6, 0] },
    { mesh: "quad", model: mat4.multiply(mat4.multiply(base, rotX(Math.PI / 2)), s), color: [0.25, 0.5, 1], center: [0, 1.6, 0] },
  ];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + spin * 0.5, p: Vec3 = [Math.cos(a) * 2.8, 0.7, Math.sin(a) * 2.8];
    out.push({ mesh: "sphere", model: trs(p, 1.3), color: [0.5 + 0.5 * Math.cos(i), 0.5 + 0.5 * Math.cos(i + 2), 0.5 + 0.5 * Math.cos(i + 4)], center: p });
  }
  return out;
}

type Tgt = { w: number; h: number; depth: WebGLRenderbuffer; main: WebGLFramebuffer; mainTex: WebGLTexture; acc: WebGLFramebuffer; accTex: WebGLTexture; rev: WebGLFramebuffer; revTex: WebGLTexture };
type Res = { opaque: WebGLProgram; glass: WebGLProgram; comp: WebGLProgram; meshes: Record<"quad" | "sphere" | "plane" | "cube", Mesh>; full: WebGLVertexArrayObject; tgt: Tgt | null; float: boolean };

function makeTargets(gl: WebGL2RenderingContext, w: number, h: number, float: boolean): Tgt {
  const depth = gl.createRenderbuffer()!;
  gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h);
  const color = (internal: number, format: number, type: number) => {
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);   // shared depth
    return { fbo, tex };
  };
  const m = color(gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE);
  const a = float ? color(gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT) : color(gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE);
  const rv = color(gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { w, h, depth, main: m.fbo, mainTex: m.tex, acc: a.fbo, accTex: a.tex, rev: rv.fbo, revTex: rv.tex };
}

export function OitSceneFigure({ t }: { t?: TrackTranslations }) {
  const [look, setLook] = useState<Look>({ yaw: -0.5, pitch: -0.32, fov: 0.9 });
  const [mode, setMode] = useState(2);
  const [alpha, setAlpha] = useState(0.5);
  const [spin, setSpin] = useState(true);
  const [floatOk, setFloatOk] = useState(true);
  const vis = useVisible<HTMLElement>();
  const time = useAnimationTime(spin && vis.on);

  const init = (gl: WebGL2RenderingContext): Res => {
    const float = floatTargets(gl);
    if (!float) setFloatOk(false);
    return {
      opaque: compileProgram(gl, OBJ_VS, OPAQUE_FS), glass: compileProgram(gl, OBJ_VS, GLASS_FS), comp: compileProgram(gl, FULL_VS, COMPOSITE_FS),
      meshes: { quad: uploadMesh(gl, wallPNUT()), sphere: uploadMesh(gl, spherePNUT(32, 48)), plane: uploadMesh(gl, planePNUT()), cube: uploadMesh(gl, cubePNUT()) },
      full: gl.createVertexArray()!, tgt: null, float,
    };
  };

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    if (!r.tgt || r.tgt.w !== size.w || r.tgt.h !== size.h) r.tgt = makeTargets(gl, size.w, size.h, r.float);
    const T = r.tgt;
    const f = forwardFrom(look.yaw, look.pitch), target: Vec3 = [0, 1.2, 0];
    const cam: Vec3 = [target[0] - f[0] * 10, target[1] - f[1] * 10, target[2] - f[2] * 10];
    const V = mat4.lookAt(cam, target, [0, 1, 0]), P = mat4.perspective(look.fov, size.aspect, 0.1, 80);
    const objs = glassObjects(time * 0.4);

    const setCommon = (prog: WebGLProgram) => {
      gl.useProgram(prog);
      gl.uniformMatrix4fv(gl.getUniformLocation(prog, "uView"), false, V);
      gl.uniformMatrix4fv(gl.getUniformLocation(prog, "uProjection"), false, P);
    };
    const drawMesh = (prog: WebGLProgram, mesh: Mesh, model: Mat4, color: Vec3) => {
      gl.uniformMatrix4fv(gl.getUniformLocation(prog, "uModel"), false, model);
      gl.uniform3fv(gl.getUniformLocation(prog, "uColor"), color);
      gl.bindVertexArray(mesh.vao);
      gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
    };

    // ── Opaque: floor and a pillar, depth written ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, T.main);
    gl.viewport(0, 0, size.w, size.h);
    gl.clearColor(0.55, 0.6, 0.68, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.disable(gl.CULL_FACE);
    setCommon(r.opaque);
    drawMesh(r.opaque, r.meshes.plane, trs([0, 0, 0], [16, 1, 16]), [0.7, 0.7, 0.72]);
    drawMesh(r.opaque, r.meshes.cube, trs([-2.2, 1.2, -2.6], [1, 2.4, 1]), [0.9, 0.75, 0.3]);

    // ── Transparent ──
    gl.depthMask(false);                                   // test against opaque depth, never write
    gl.enable(gl.BLEND);
    setCommon(r.glass);
    const g = (n: string) => gl.getUniformLocation(r.glass, n);
    gl.uniform1f(g("uAlpha"), alpha);
    const viewDepth = (c: Vec3) => -(V[2] * c[0] + V[6] * c[1] + V[10] * c[2] + V[14]);
    const wboit = mode === 2 && r.float;
    if (!wboit) {
      let list = objs;
      if (mode === 1) list = [...objs].sort((a, b) => viewDepth(b.center) - viewDepth(a.center));   // back to front
      gl.uniform1i(g("uPass"), mode === 3 ? 1 : 0);
      if (mode === 3) gl.blendFunc(gl.ONE, gl.ONE); else gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      for (const o of list) drawMesh(r.glass, r.meshes[o.mesh], o.model, o.color);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, T.acc);            // Σ w·α·C  and  Σ w·α
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.uniform1i(g("uPass"), 2);
      for (const o of objs) drawMesh(r.glass, r.meshes[o.mesh], o.model, o.color);
      gl.bindFramebuffer(gl.FRAMEBUFFER, T.rev);            // Π (1 − α)
      gl.clearColor(1, 1, 1, 1); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_COLOR);
      gl.uniform1i(g("uPass"), 3);
      for (const o of objs) drawMesh(r.glass, r.meshes[o.mesh], o.model, o.color);
    }
    gl.disable(gl.BLEND);
    gl.depthMask(true);

    // ── Composite to the screen ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, size.w, size.h);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(r.comp);
    [T.mainTex, T.accTex, T.revTex].forEach((tt, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tt); });
    gl.uniform1i(gl.getUniformLocation(r.comp, "uOpaque"), 0);
    gl.uniform1i(gl.getUniformLocation(r.comp, "uAccum"), 1);
    gl.uniform1i(gl.getUniformLocation(r.comp, "uReveal"), 2);
    gl.uniform1i(gl.getUniformLocation(r.comp, "uWboit"), wboit ? 1 : 0);
    drawFullscreen(gl, r.full);
  };

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;
  const notes = [
    tx(t, "figOitS_unsortedNote", "Drawn in list order: the panes were submitted first, so balls behind them are painted on top and look like they are in front. As the scene turns, whole objects flip from behind to in front."),
    tx(t, "figOitS_sortedNote", "Sorting whole objects by their centres fixes the balls, but the three panes share one centre and cut through each other. Each pane is partly in front of and partly behind the others, so no order of whole objects is right. Look at where the colours cross: one quadrant is always wrong."),
    tx(t, "figOitS_wboitNote", "No sorting at all. Coverage is exact everywhere, and the crossing panes blend into a plausible mix, with nearer glass weighted a little more. The colours are an approximation: strongly coloured layers far apart in depth come out more mixed than true over-compositing would give. For glass, smoke and foliage that trade is almost always worth it."),
    tx(t, "figOitS_addNote", "Additive blending is order-independent because addition is. But it only adds light, so everything brightens toward white and glass no longer darkens what is behind it. Right for fire and holograms, wrong for glass."),
  ];

  return (
    <FigureShell ref={vis.ref}>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figOitS_title", "Intersecting Glass — Sorting vs Weighted Blended OIT")}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{tx(t, "figScene_hint", "drag to orbit · scroll to zoom")}</span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> orbit init={init} draw={draw} look={look} onLook={setLook} fovRange={[0.4, 1.4]} frame={[look, mode, alpha, spin ? time : 0]} aspect={16 / 9} />
        {!floatOk && <p className="text-[11px] font-mono text-red-400 px-2 pt-1">{tx(t, "figOitS_noFloat", "This browser cannot render to float textures; WBOIT falls back to unsorted blending.")}</p>}
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap items-center">
          {MODES.map((m, i) => <button key={m} className={btn(mode === i)} onClick={() => setMode(i)}>{m}</button>)}
          <label className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)] ml-3">
            <input type="checkbox" checked={spin} onChange={e => setSpin(e.target.checked)} className="accent-[var(--primary)]" />{tx(t, "figOitS_spin", "rotate")}
          </label>
        </div>
        <label className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-16">opacity α</span>
          <input type="range" min={0.05} max={0.95} step={0.01} value={alpha} onChange={e => setAlpha(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
          <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{alpha}</span>
        </label>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">{notes[mode]}</p>
      </div>
    </FigureShell>
  );
}
