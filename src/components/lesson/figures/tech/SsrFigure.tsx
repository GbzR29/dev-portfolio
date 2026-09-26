"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, forwardFrom, type Mat4 } from "../../kit/gl/gl";
import { GLView, type Look } from "../../kit/gl/GLView";
import { ensureColorTarget, FULL_VS, drawFullscreen, floatTargets, type ColorTarget } from "../../kit/gl/glx";
import { ROOM, LIT_VS, LIT_FS, SUN, sceneMeshes, roomCamera, clampRoomLook, type SceneMeshes } from "../post/scene";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// A polished floor, reflected two ways:
//   planar — render the scene again mirrored in the floor plane (y → −y) and
//            sample it at the same screen position: exact, one extra scene pass
//   SSR    — no extra geometry pass: for every floor pixel, reflect the view
//            direction and march the ray in view space against the G-buffer's
//            positions, projecting each step to the screen; on a hit, copy that
//            pixel's lit colour. Misses fade out at screen edges.
// Tilt the camera down and see what SSR cannot know: anything off-screen, and
// the faces of objects that point away from the camera.

const GEO_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aUV;
uniform mat4 uModel, uView, uProjection;
out vec3 vPos; out vec3 vNormal; out vec2 vUV;
void main() {
  vec4 v = uView * uModel * vec4(aPos, 1.0);
  vPos = v.xyz; vNormal = mat3(uView * uModel) * aNormal; vUV = aUV;
  gl_Position = uProjection * v;
}`;
const GEO_FS = `#version 300 es
precision highp float;
in vec3 vPos; in vec3 vNormal; in vec2 vUV;
uniform vec3 uColor; uniform float uGrid, uReflect;
layout(location = 0) out vec4 gPosition;
layout(location = 1) out vec4 gNormal;     // w = reflectivity
layout(location = 2) out vec4 gAlbedo;
void main() {
  vec3 albedo = uColor;
  if (uGrid > 0.5) { vec2 g = abs(fract(vUV) - 0.5); albedo *= 1.0 - 0.3 * step(0.47, max(g.x, g.y)); }
  gPosition = vec4(vPos, 1.0);
  gNormal = vec4(normalize(vNormal), uReflect);
  gAlbedo = vec4(albedo, 1.0);
}`;
const LIGHT_FS = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D gPosition, gNormal, gAlbedo;
uniform vec3 uSunView;
out vec4 FragColor;
void main() {
  vec4 P = texture(gPosition, vUV);
  if (P.w == 0.0) { FragColor = vec4(0.62, 0.7, 0.8, 1.0); return; }
  vec3 N = normalize(texture(gNormal, vUV).xyz), A = texture(gAlbedo, vUV).rgb;
  vec3 amb = mix(vec3(0.16, 0.15, 0.14), vec3(0.2, 0.24, 0.32), N.y * 0.5 + 0.5);
  vec3 c = A * (amb + max(dot(N, uSunView), 0.0) * vec3(1.0, 0.95, 0.85));
  FragColor = vec4(pow(c, vec3(1.0 / 2.2)), 1.0);
}`;
const SSR_FS = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D gPosition, gNormal, uLit;
uniform mat4 uProjection;
uniform int uSteps;
uniform float uStep, uThickness, uRefine;
out vec4 FragColor;                              // rgb: reflected colour, a: confidence
vec2 project(vec3 p) { vec4 c = uProjection * vec4(p, 1.0); return c.xy / c.w * 0.5 + 0.5; }
void main() {
  vec4 P = texture(gPosition, vUV), Nr = texture(gNormal, vUV);
  if (P.w == 0.0 || Nr.w < 0.01) { FragColor = vec4(0.0); return; }
  vec3 N = normalize(Nr.xyz);
  vec3 V = normalize(P.xyz);                     // camera at the origin in view space
  vec3 R = normalize(reflect(V, N));
  vec3 pos = P.xyz + N * 0.01, prev = pos;
  for (int i = 0; i < 160; i++) {
    if (i >= uSteps) break;
    pos += R * uStep * (1.0 + float(i) * 0.04);   // steps grow a little with distance
    vec2 uv = project(pos);
    if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0))) || pos.z > -0.05) break;   // off screen or behind the camera
    vec4 S = texture(gPosition, uv);
    if (S.w == 0.0) { prev = pos; continue; }
    if (S.z - pos.z > 0.0) {                      // this step took the ray behind the stored surface
      // Where exactly did it cross? Deciding hit-or-miss at the coarse step
      // would depend on where each ray's steps happen to land: neighbouring
      // pixels would disagree, drawing rings and streaks. So refine first,
      // then apply the thickness test at the crossing.
      vec3 hit = pos;
      if (uRefine > 0.5) {                        // binary search for the crossing
        vec3 lo = prev, hi = pos;
        for (int b = 0; b < 6; b++) {
          vec3 mid = 0.5 * (lo + hi);
          vec4 M = texture(gPosition, project(mid));
          if (M.w != 0.0 && M.z - mid.z > 0.0) hi = mid; else lo = mid;
        }
        hit = hi;
      }
      uv = project(hit);
      vec4 H = texture(gPosition, uv);
      // The surface is assumed to be uThickness deep. Deeper than that, the ray
      // only passed behind an object: keep marching.
      float behind = H.z - hit.z;
      if (H.w == 0.0 || behind > uThickness) { prev = pos; continue; }
      vec2 edge = smoothstep(0.0, 0.12, uv) * smoothstep(0.0, 0.12, 1.0 - uv);   // fade near screen borders
      float conf = edge.x * edge.y * (1.0 - float(i) / float(uSteps));
      // A real hit ends on the surface (behind ≈ 0). Deeper inside the assumed
      // thickness the ray passed behind a silhouette and only guesses what is
      // hidden there: fade it out instead of smearing the silhouette's pixels.
      conf *= 1.0 - smoothstep(0.25 * uThickness, uThickness, behind);
      FragColor = vec4(texture(uLit, uv).rgb, conf);
      return;
    }
    prev = pos;
  }
  FragColor = vec4(0.0);                          // miss
}`;
const COMP_FS = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uLit, uSsr, uPlanar, gNormal, gPosition;
uniform int uMethod, uView;
uniform float uStrength;
out vec4 FragColor;
// Raw SSR is noisy wherever rays graze a surface or guess at what is hidden
// (under the spheres, rays alternate between hitting the sphere and passing
// under it). Engines always denoise it; here a small blur weighted by the
// confidence turns that noise into a soft falloff.
vec4 ssrBlurred(vec2 uv) {
  vec2 px = 1.5 / vec2(textureSize(uSsr, 0));
  vec4 sum = vec4(0.0);
  for (int y = -2; y <= 2; y++) for (int x = -2; x <= 2; x++) {
    vec4 s = texture(uSsr, uv + vec2(x, y) * px);
    sum += vec4(s.rgb * s.a, s.a);
  }
  return sum.a > 0.0 ? vec4(sum.rgb / sum.a, sum.a / 25.0) : vec4(0.0);
}
void main() {
  vec3 lit = texture(uLit, vUV).rgb;
  vec4 Nr = texture(gNormal, vUV), P = texture(gPosition, vUV);
  float refl = Nr.w * uStrength;
  float fres = 0.04 + 0.96 * pow(1.0 - max(dot(normalize(Nr.xyz), -normalize(P.xyz)), 0.0), 5.0);
  float k = refl * mix(0.35, 1.0, fres);                     // polished: always some reflection, more at grazing angles
  vec4 r = uMethod == 1 ? ssrBlurred(vUV) : uMethod == 2 ? vec4(texture(uPlanar, vUV).rgb, 1.0) : vec4(0.0);
  if (uView == 1) { FragColor = vec4(r.rgb * r.a * step(0.01, Nr.w), 1.0); return; }
  if (uView == 2) { FragColor = vec4(vec3(r.a * step(0.01, Nr.w)), 1.0); return; }
  FragColor = vec4(mix(lit, r.rgb, k * r.a), 1.0);
}`;

type Res = {
  geo: WebGLProgram; light: WebGLProgram; ssr: WebGLProgram; comp: WebGLProgram; lit: WebGLProgram;
  meshes: SceneMeshes; full: WebGLVertexArrayObject;
  g: ColorTarget | null; litT: ColorTarget | null; ssrT: ColorTarget | null; planar: ColorTarget | null; float: boolean;
};
const METHODS = ["none", "SSR", "planar"] as const;
const VIEWS = ["final", "reflection only", "SSR confidence"] as const;

export function SsrFigure({ t }: { t?: TrackTranslations }) {
  const [look, setLook] = useState<Look>({ yaw: -0.62, pitch: -0.3, fov: 0.95 });
  const [method, setMethod] = useState(1);
  const [view, setView] = useState(0);
  const [steps, setSteps] = useState(64);
  const [stepLen, setStepLen] = useState(0.12);
  const [thick, setThick] = useState(0.4);
  const [strength, setStrength] = useState(0.8);
  const [refine, setRefine] = useState(true);
  const [floatOk, setFloatOk] = useState(true);

  const init = (gl: WebGL2RenderingContext): Res => {
    const float = floatTargets(gl);
    if (!float) setFloatOk(false);
    return {
      geo: compileProgram(gl, GEO_VS, GEO_FS), light: compileProgram(gl, FULL_VS, LIGHT_FS), ssr: compileProgram(gl, FULL_VS, SSR_FS),
      comp: compileProgram(gl, FULL_VS, COMP_FS), lit: compileProgram(gl, LIT_VS, LIT_FS),
      meshes: sceneMeshes(gl), full: gl.createVertexArray()!, g: null, litT: null, ssrT: null, planar: null, float,
    };
  };

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    r.g = ensureColorTarget(gl, r.g, size.w, size.h, { float: true, count: 3, linear: false });
    r.litT = ensureColorTarget(gl, r.litT, size.w, size.h, { depth: false });
    r.ssrT = ensureColorTarget(gl, r.ssrT, size.w, size.h, { depth: false });
    r.planar = ensureColorTarget(gl, r.planar, size.w, size.h, {});
    const { cam, view: V } = roomCamera(forwardFrom(look.yaw, look.pitch));
    const P: Mat4 = mat4.perspective(look.fov, size.aspect, 0.1, 60);

    const drawItems = (prog: WebGLProgram, model: (m: Mat4) => Mat4, skipFloor: boolean, extra?: (i: number) => void) => {
      const u = (n: string) => gl.getUniformLocation(prog, n);
      ROOM.forEach((it, i) => {
        if (skipFloor && i === 0) return;
        gl.uniformMatrix4fv(u("uModel"), false, model(it.model));
        gl.uniform3fv(u("uColor"), it.color);
        gl.uniform1f(u("uGrid"), it.mesh === "plane" ? 1 : 0);
        extra?.(i);
        const m = r.meshes[it.mesh];
        gl.bindVertexArray(m.vao);
        gl.drawArrays(gl.TRIANGLES, 0, m.count);
      });
    };

    // ── G-buffer ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, r.g.fbo);
    gl.viewport(0, 0, size.w, size.h);
    gl.clearBufferfv(gl.COLOR, 0, [0, 0, 0, 0]); gl.clearBufferfv(gl.COLOR, 1, [0, 0, 0, 0]); gl.clearBufferfv(gl.COLOR, 2, [0, 0, 0, 0]);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(r.geo);
    gl.uniformMatrix4fv(gl.getUniformLocation(r.geo, "uView"), false, V);
    gl.uniformMatrix4fv(gl.getUniformLocation(r.geo, "uProjection"), false, P);
    const uRefl = gl.getUniformLocation(r.geo, "uReflect");
    drawItems(r.geo, m => m, false, i => gl.uniform1f(uRefl, i === 0 ? 1 : 0));   // only the floor is polished
    gl.disable(gl.DEPTH_TEST);

    // ── Lighting ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, r.litT.fbo);
    gl.useProgram(r.light);
    [r.g.tex[0], r.g.tex[1], r.g.tex[2]].forEach((tt, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tt); });
    ["gPosition", "gNormal", "gAlbedo"].forEach((n, i) => gl.uniform1i(gl.getUniformLocation(r.light, n), i));
    const sv = [0, 1, 2].map(i => V[i] * SUN[0] + V[4 + i] * SUN[1] + V[8 + i] * SUN[2]);
    gl.uniform3fv(gl.getUniformLocation(r.light, "uSunView"), sv);
    drawFullscreen(gl, r.full);

    // ── SSR ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, r.ssrT.fbo);
    gl.useProgram(r.ssr);
    const s = (n: string) => gl.getUniformLocation(r.ssr, n);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, r.g.tex[0]);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, r.g.tex[1]);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, r.litT.tex[0]);
    gl.uniform1i(s("gPosition"), 0); gl.uniform1i(s("gNormal"), 1); gl.uniform1i(s("uLit"), 2);
    gl.uniformMatrix4fv(s("uProjection"), false, P);
    gl.uniform1i(s("uSteps"), steps);
    gl.uniform1f(s("uStep"), stepLen);
    gl.uniform1f(s("uThickness"), thick);
    gl.uniform1f(s("uRefine"), refine ? 1 : 0);
    drawFullscreen(gl, r.full);

    // ── Planar: the scene mirrored in y = 0, rendered normally ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, r.planar.fbo);
    gl.clearColor(0.62, 0.7, 0.8, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(r.lit);
    const l = (n: string) => gl.getUniformLocation(r.lit, n);
    gl.uniformMatrix4fv(l("uView"), false, V);
    gl.uniformMatrix4fv(l("uProjection"), false, P);
    // Lighting in the mirror: the camera is mirrored too, so reflect the light the same way
    gl.uniform3fv(l("uCam"), [cam[0], -cam[1], cam[2]]);
    gl.uniform3fv(l("uSun"), [SUN[0], -SUN[1], SUN[2]]);
    const mirror = mat4.identity(); mirror[5] = -1;
    drawItems(r.lit, m => mat4.multiply(mirror, m), true);
    gl.disable(gl.DEPTH_TEST);

    // ── Composite ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, size.w, size.h);
    gl.useProgram(r.comp);
    const c = (n: string) => gl.getUniformLocation(r.comp, n);
    [r.litT.tex[0], r.ssrT.tex[0], r.planar.tex[0], r.g.tex[1], r.g.tex[0]].forEach((tt, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tt); });
    ["uLit", "uSsr", "uPlanar", "gNormal", "gPosition"].forEach((n, i) => gl.uniform1i(c(n), i));
    gl.uniform1i(c("uMethod"), method);
    gl.uniform1i(c("uView"), view);
    gl.uniform1f(c("uStrength"), strength);
    drawFullscreen(gl, r.full);
  };

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;

  return (
    <FigureShell>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figSsr_title", "A Polished Floor — Planar Reflection vs SSR")}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{tx(t, "figScene_hint", "drag to orbit · scroll to zoom")}</span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> orbit init={init} draw={draw} look={look} onLook={l => setLook(clampRoomLook(l))} fovRange={[0.5, 1.4]}
          frame={[look, method, view, steps, stepLen, thick, strength, refine]} aspect={16 / 9} />
        {!floatOk && <p className="text-[11px] font-mono text-red-400 px-2 pt-1">{tx(t, "figSsr_noFloat", "This browser cannot render to float textures; the G-buffer loses precision and SSR will be noisy.")}</p>}
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-16">method</span>
          {METHODS.map((m, i) => <button key={m} className={btn(method === i)} onClick={() => setMethod(i)}>{m}</button>)}
          <span className="text-[10px] font-mono text-[var(--text-muted)] ml-3">show</span>
          {VIEWS.map((v, i) => <button key={v} className={btn(view === i)} onClick={() => setView(i)}>{v}</button>)}
        </div>
        <div className={`grid gap-x-6 gap-y-1.5 sm:grid-cols-2 ${method !== 1 ? "opacity-50" : ""}`}>
          {([["max steps", steps, setSteps, 8, 160, 1], ["step length", stepLen, setStepLen, 0.02, 0.5, 0.01], ["thickness", thick, setThick, 0.02, 2, 0.02], ["strength", strength, setStrength, 0, 1, 0.05]] as const).map(([label, v, set, min, max, step]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-20">{label}</span>
              <input type="range" min={min} max={max} step={step} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{v}</span>
            </label>
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)]">
          <input type="checkbox" checked={refine} onChange={e => setRefine(e.target.checked)} className="accent-[var(--primary)]" />{tx(t, "figSsr_refine", "binary-search refinement")}
        </label>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {method === 2
            ? tx(t, "figSsr_planarNote", "Planar reflection renders the whole scene a second time through a mirror matrix. It is exact, including things outside the view and the undersides of objects, and costs one extra scene pass per reflective plane. That is fine for one floor or one lake, impossible for every shiny surface.")
            : method === 1
              ? tx(t, "figSsr_ssrNote", "SSR reuses the image already rendered, so its cost does not depend on scene complexity. Compare with planar: the reflections of the sphere and boxes match where their reflected faces are visible on screen, but look under the sphere and at the base of the stairs, where the mirror would show surfaces the camera never saw. SSR leaves holes or smears there, and fades out toward the screen edges.")
              : tx(t, "figSsr_noneNote", "The floor with no reflection: its only information about the room is the diffuse lighting.")}
        </p>
      </div>
    </FigureShell>
  );
}
