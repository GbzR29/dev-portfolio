"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, forwardFrom, type Vec3 } from "../gl";
import { GLView, useAnimationTime, type Look } from "../GLView";
import {
  uploadMesh, cubePNUT, spherePNUT, planePNUT, trs, ensureColorTarget, FULL_VS, drawFullscreen,
  type Mesh, type ColorTarget,
} from "../glx";

// ── What this figure shows ────────────────────────────────────────────────────
// Deferred shading. The geometry pass writes position, normal and colour into
// three textures at once (multiple render targets). A single fullscreen pass
// then lights each pixel with every light — once per pixel, no matter how
// many objects overlapped there.

const MAX_LIGHTS = 64;

const GEO_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
uniform mat4 uModel, uView, uProjection;
out vec3 vWorld; out vec3 vNormal;
void main() {
  vec4 w = uModel * vec4(aPos, 1.0);
  vWorld = w.xyz; vNormal = mat3(uModel) * aNormal;
  gl_Position = uProjection * uView * w;
}`;
const GEO_FS = `#version 300 es
precision highp float;
in vec3 vWorld; in vec3 vNormal;
uniform vec3 uAlbedo;
uniform float uSpec;
layout(location = 0) out vec4 gPosition;
layout(location = 1) out vec4 gNormal;
layout(location = 2) out vec4 gAlbedoSpec;
void main() {
  gPosition   = vec4(vWorld, 1.0);
  gNormal     = vec4(normalize(vNormal), 1.0);
  gAlbedoSpec = vec4(uAlbedo, uSpec);
}`;
const LIGHT_FS = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D gPosition, gNormal, gAlbedoSpec;
uniform vec3 uLightPos[${MAX_LIGHTS}];
uniform vec3 uLightCol[${MAX_LIGHTS}];
uniform int uCount;
uniform vec3 uCam;
uniform float uView;
out vec4 FragColor;
void main() {
  vec4 P = texture(gPosition, vUV);
  vec3 N = texture(gNormal, vUV).xyz;
  vec4 AS = texture(gAlbedoSpec, vUV);
  if (uView > 0.5) {                                   // show one G-buffer
    vec3 c = uView < 1.5 ? fract(P.xyz * 0.25)
           : uView < 2.5 ? N * 0.5 + 0.5
           : uView < 3.5 ? AS.rgb
           : vec3(AS.a);
    FragColor = vec4(P.w > 0.5 ? c : vec3(0.0), 1.0);
    return;
  }
  if (P.w < 0.5) { FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
  vec3 V = normalize(uCam - P.xyz);
  vec3 c = AS.rgb * 0.02;
  for (int i = 0; i < ${MAX_LIGHTS}; i++) {
    if (i >= uCount) break;
    vec3 toL = uLightPos[i] - P.xyz;
    float d = length(toL);
    if (d > 4.5) continue;                             // outside this light's volume
    vec3 L = toL / d;
    float att = 1.0 / (1.0 + 0.7 * d + 1.8 * d * d);
    float diff = max(dot(N, L), 0.0);
    float spec = pow(max(dot(N, normalize(L + V)), 0.0), 32.0) * AS.a;
    c += uLightCol[i] * att * (AS.rgb * diff + spec) * 2.0;
  }
  c = vec3(1.0) - exp(-c);
  FragColor = vec4(pow(c, vec3(1.0 / 2.2)), 1.0);
}`;
const QUAD_FS = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uTex;
uniform float uKind;
out vec4 FragColor;
void main() {
  vec4 v = texture(uTex, vUV);
  vec3 c = uKind < 0.5 ? fract(v.xyz * 0.25) : uKind < 1.5 ? v.xyz * 0.5 + 0.5 : uKind < 2.5 ? v.rgb : vec3(v.a);
  FragColor = vec4(c, 1.0);
}`;

type Res = { geo: WebGLProgram; light: WebGLProgram; quad: WebGLProgram; cube: Mesh; sphere: Mesh; plane: Mesh; full: WebGLVertexArrayObject; g: ColorTarget | null };
const VIEWS = ["final", "position", "normal", "albedo", "specular", "all four"] as const;

const hash = (i: number) => { const s = Math.sin(i * 91.7) * 43758.5453; return s - Math.floor(s); };

export function DeferredFigure({ t }: { t?: TrackTranslations }) {
  const [look, setLook] = useState<Look>({ yaw: 0.5, pitch: -0.55, fov: 0.85 });
  const [count, setCount] = useState(32);
  const [view, setView] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [floatOk, setFloatOk] = useState(true);
  const time = useAnimationTime(animate);

  const f = forwardFrom(look.yaw, look.pitch);
  const cam: Vec3 = [-f[0] * 11, -f[1] * 11, -f[2] * 11];

  const lights = Array.from({ length: MAX_LIGHTS }, (_, i) => {
    const a = hash(i) * Math.PI * 2 + time * (0.2 + hash(i + 7) * 0.5) * (i % 2 ? 1 : -1);
    const rad = 1 + hash(i + 3) * 4.5;
    const hue = hash(i + 11) * 6;
    const col: Vec3 = [
      Math.max(0, Math.min(1, Math.abs(hue - 3) - 1)),
      Math.max(0, Math.min(1, 2 - Math.abs(hue - 2))),
      Math.max(0, Math.min(1, 2 - Math.abs(hue - 4))),
    ];
    return { p: [Math.cos(a) * rad, 0.35 + hash(i + 5) * 0.8, Math.sin(a) * rad] as Vec3, c: col };
  });

  const init = (gl: WebGL2RenderingContext): Res => ({
    geo: compileProgram(gl, GEO_VS, GEO_FS),
    light: compileProgram(gl, FULL_VS, LIGHT_FS),
    quad: compileProgram(gl, FULL_VS, QUAD_FS),
    cube: uploadMesh(gl, cubePNUT()), sphere: uploadMesh(gl, spherePNUT(20, 28)), plane: uploadMesh(gl, planePNUT()),
    full: gl.createVertexArray()!, g: null,
  });

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    r.g = ensureColorTarget(gl, r.g, size.w, size.h, { float: true, count: 3, linear: false });
    if (r.g.float !== floatOk) setFloatOk(r.g.float);

    // ── Geometry pass: 3 outputs at once ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, r.g.fbo);
    gl.viewport(0, 0, size.w, size.h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    const g = r.geo, u = (n: string) => gl.getUniformLocation(g, n);
    gl.useProgram(g);
    gl.uniformMatrix4fv(u("uView"), false, mat4.lookAt(cam, [0, 0, 0], [0, 1, 0]));
    gl.uniformMatrix4fv(u("uProjection"), false, mat4.perspective(look.fov, size.aspect, 0.1, 100));
    const drawMesh = (m: Mesh, model: Float32Array, c: Vec3, spec: number) => {
      gl.uniformMatrix4fv(u("uModel"), false, model); gl.uniform3fv(u("uAlbedo"), c); gl.uniform1f(u("uSpec"), spec);
      gl.bindVertexArray(m.vao); gl.drawArrays(gl.TRIANGLES, 0, m.count);
    };
    drawMesh(r.plane, trs([0, 0, 0], [14, 1, 14]), [0.6, 0.6, 0.62], 0.2);
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
      const p: Vec3 = [(i - 2) * 1.8, 0.4, (j - 2) * 1.8];
      const c: Vec3 = [0.7 + hash(i * 5 + j) * 0.3, 0.7 + hash(i * 5 + j + 40) * 0.3, 0.7 + hash(i * 5 + j + 80) * 0.3];
      if ((i + j) % 2) drawMesh(r.sphere, trs(p, 0.8), c, 1);
      else drawMesh(r.cube, trs(p, 0.7, i + j), c, 0.5);
    }
    gl.disable(gl.DEPTH_TEST);

    // ── Lighting pass (or G-buffer views) ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, size.w, size.h);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    r.g.tex.forEach((tex, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tex); });
    if (view === 5) {
      // Mosaic: position, normal, albedo, specular
      gl.useProgram(r.quad);
      const hw = size.w / 2, hh = size.h / 2;
      [[0, 1], [1, 1], [0, 0], [1, 0]].forEach(([cx, cy], k) => {
        gl.viewport(cx * hw, cy * hh, hw, hh);
        gl.uniform1i(gl.getUniformLocation(r.quad, "uTex"), k < 3 ? k : 2);
        gl.uniform1f(gl.getUniformLocation(r.quad, "uKind"), k);
        drawFullscreen(gl, r.full);
      });
    } else {
      const L = r.light, lu = (n: string) => gl.getUniformLocation(L, n);
      gl.useProgram(L);
      gl.uniform1i(lu("gPosition"), 0); gl.uniform1i(lu("gNormal"), 1); gl.uniform1i(lu("gAlbedoSpec"), 2);
      gl.uniform3fv(lu("uLightPos"), new Float32Array(lights.flatMap(l => l.p)));
      gl.uniform3fv(lu("uLightCol"), new Float32Array(lights.flatMap(l => l.c)));
      gl.uniform1i(lu("uCount"), count);
      gl.uniform3fv(lu("uCam"), cam);
      gl.uniform1f(lu("uView"), view);
      drawFullscreen(gl, r.full);
    }
    gl.activeTexture(gl.TEXTURE0);
  };

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figDeferred_title", "Deferred Shading — The G-Buffer")}
        </span>
        <div className="flex gap-1.5 flex-wrap">
          {VIEWS.map((l, i) => <button key={l} className={btn(view === i)} onClick={() => setView(i)}>{l}</button>)}
        </div>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> orbit init={init} draw={draw} look={look} onLook={setLook} fovRange={[0.4, 1.3]}
          frame={[look, count, view, time]} aspect={16 / 9} />
        {!floatOk && <p className="text-[11px] font-mono text-red-400 px-2 pt-1">{tx(t, "figDeferred_noFloat", "This browser cannot render to float textures, so positions are clipped to 8 bits and lighting will look wrong.")}</p>}
      </div>
      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-[var(--text-muted)] w-14">lights</span>
            <input type="range" min={1} max={MAX_LIGHTS} step={1} value={count} onChange={e => setCount(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
            <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{count}</span>
          </label>
          <button className={btn(animate)} onClick={() => setAnimate(v => !v)}>{animate ? "❚❚ lights" : "▶ lights"}</button>
          <p className="font-mono text-[10.5px] text-[var(--text-muted)] pt-1">
            {tx(t, "figDeferred_cost", "lighting cost ≈ pixels × lights, independent of how many objects overlap")}
          </p>
        </div>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {tx(t, "figDeferred_note", "Open 'all four' to see what the geometry pass stores: world position (as a repeating colour), the normal, the albedo and the specular strength. The lighting pass never touches a mesh — it only reads these textures, so overdraw no longer multiplies the lighting cost.")}
        </p>
      </div>
    </figure>
  );
}
