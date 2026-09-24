"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, forwardFrom, type Vec3 } from "../gl";
import { GLView, useAnimationTime, type Look } from "../GLView";
import {
  uploadMesh, cubePNUT, planePNUT, trs, ensureColorTarget, FULL_VS, drawFullscreen, type Mesh, type ColorTarget,
} from "../glx";

// ── What this figure shows ────────────────────────────────────────────────────
// Bloom as four passes: render HDR → keep only what is brighter than a
// threshold → blur it with a separable Gaussian, ping-ponging between two
// half-resolution buffers → add it back and tone map. Every stage can be shown.

const WEIGHTS = [0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216];

const SCENE_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
uniform mat4 uModel, uView, uProjection;
out vec3 vWorld; out vec3 vNormal;
void main() {
  vec4 w = uModel * vec4(aPos, 1.0);
  vWorld = w.xyz; vNormal = mat3(uModel) * aNormal;
  gl_Position = uProjection * uView * w;
}`;
const SCENE_FS = `#version 300 es
precision highp float;
in vec3 vWorld; in vec3 vNormal;
uniform vec3 uColor;
uniform float uEmissive;
uniform vec3 uLightPos[3];
uniform vec3 uLightCol[3];
out vec4 FragColor;
void main() {
  if (uEmissive > 0.5) { FragColor = vec4(uColor, 1.0); return; }     // light sources: HDR colour > 1
  vec3 N = normalize(vNormal), c = uColor * 0.03;
  for (int i = 0; i < 3; i++) {
    vec3 toL = uLightPos[i] - vWorld;
    c += uLightCol[i] * uColor * max(dot(N, normalize(toL)), 0.0) / dot(toL, toL);
  }
  FragColor = vec4(c, 1.0);
}`;
const BRIGHT_FS = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uScene;
uniform float uThreshold;
out vec4 FragColor;
void main() {
  vec3 c = texture(uScene, vUV).rgb;
  float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
  float k = smoothstep(uThreshold, uThreshold + 0.5, lum);   // soft knee instead of a hard cut
  FragColor = vec4(c * k, 1.0);
}`;
const BLUR_FS = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uImage;
uniform vec2 uDir;                     // (1,0) horizontal, (0,1) vertical
uniform float uW[5];
out vec4 FragColor;
void main() {
  vec2 texel = uDir / vec2(textureSize(uImage, 0));
  vec3 c = texture(uImage, vUV).rgb * uW[0];
  for (int i = 1; i < 5; i++) {
    c += texture(uImage, vUV + texel * float(i)).rgb * uW[i];
    c += texture(uImage, vUV - texel * float(i)).rgb * uW[i];
  }
  FragColor = vec4(c, 1.0);
}`;
const FINAL_FS = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uScene, uBloom;
uniform float uIntensity, uStage;
out vec4 FragColor;
void main() {
  vec3 scene = texture(uScene, vUV).rgb, bloom = texture(uBloom, vUV).rgb;
  vec3 c = uStage < 0.5 ? scene + bloom * uIntensity
         : uStage < 1.5 ? scene
         : bloom;
  c = vec3(1.0) - exp(-c * 1.1);                     // exposure tone mapping
  FragColor = vec4(pow(c, vec3(1.0 / 2.2)), 1.0);
}`;

type Res = {
  scene: WebGLProgram; bright: WebGLProgram; blur: WebGLProgram; final: WebGLProgram;
  cube: Mesh; plane: Mesh; full: WebGLVertexArrayObject;
  hdr: ColorTarget | null; ping: ColorTarget | null; pong: ColorTarget | null;
};
const STAGES = ["final", "scene only", "bright pass", "blurred bloom"] as const;

export function BloomFigure({ t }: { t?: TrackTranslations }) {
  const [look, setLook] = useState<Look>({ yaw: 0.4, pitch: -0.3, fov: 0.9 });
  const [stage, setStage] = useState(0);
  const [threshold, setThreshold] = useState(1);
  const [passes, setPasses] = useState(5);
  const [intensity, setIntensity] = useState(1);
  const [animate, setAnimate] = useState(true);
  const time = useAnimationTime(animate);

  const f = forwardFrom(look.yaw, look.pitch);
  const cam: Vec3 = [-f[0] * 8, -f[1] * 8 + 0.5, -f[2] * 8];
  const emissive: { p: Vec3; c: Vec3 }[] = [
    { p: [Math.cos(time * 0.7) * 2.2, 1.1, Math.sin(time * 0.7) * 2.2], c: [8, 1.4, 0.8] },
    { p: [-2.4, 0.6, -1.4], c: [1, 4, 9] },
    { p: [1.8, 0.4, 1.8], c: [2, 9, 3] },
  ];

  const init = (gl: WebGL2RenderingContext): Res => ({
    scene: compileProgram(gl, SCENE_VS, SCENE_FS),
    bright: compileProgram(gl, FULL_VS, BRIGHT_FS),
    blur: compileProgram(gl, FULL_VS, BLUR_FS),
    final: compileProgram(gl, FULL_VS, FINAL_FS),
    cube: uploadMesh(gl, cubePNUT()), plane: uploadMesh(gl, planePNUT()),
    full: gl.createVertexArray()!, hdr: null, ping: null, pong: null,
  });

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    const hw = Math.max(1, size.w >> 1), hh = Math.max(1, size.h >> 1);
    r.hdr = ensureColorTarget(gl, r.hdr, size.w, size.h, { float: true });
    r.ping = ensureColorTarget(gl, r.ping, hw, hh, { float: true, depth: false });
    r.pong = ensureColorTarget(gl, r.pong, hw, hh, { float: true, depth: false });

    // ── 1. HDR scene ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, r.hdr.fbo);
    gl.viewport(0, 0, size.w, size.h);
    gl.clearColor(0.004, 0.005, 0.008, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    const s = r.scene, u = (n: string) => gl.getUniformLocation(s, n);
    gl.useProgram(s);
    gl.uniformMatrix4fv(u("uView"), false, mat4.lookAt(cam, [0, 0.4, 0], [0, 1, 0]));
    gl.uniformMatrix4fv(u("uProjection"), false, mat4.perspective(look.fov, size.aspect, 0.1, 100));
    emissive.forEach((e, i) => { gl.uniform3fv(u(`uLightPos[${i}]`), e.p); gl.uniform3fv(u(`uLightCol[${i}]`), e.c); });
    const drawMesh = (m: Mesh, model: Float32Array, c: Vec3, em: boolean) => {
      gl.uniformMatrix4fv(u("uModel"), false, model); gl.uniform3fv(u("uColor"), c); gl.uniform1f(u("uEmissive"), em ? 1 : 0);
      gl.bindVertexArray(m.vao); gl.drawArrays(gl.TRIANGLES, 0, m.count);
    };
    drawMesh(r.plane, trs([0, 0, 0], [14, 1, 14]), [0.5, 0.5, 0.55], false);
    drawMesh(r.cube, trs([0, 0.6, 0], 1.2, 0.5), [0.7, 0.7, 0.72], false);
    drawMesh(r.cube, trs([-1, 0.35, 1.5], 0.7, 0.2), [0.6, 0.5, 0.4], false);
    emissive.forEach(e => drawMesh(r.cube, trs(e.p, 0.35, time), e.c, true));
    gl.disable(gl.DEPTH_TEST);

    // ── 2. Bright pass (to half resolution) ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, r.ping.fbo);
    gl.viewport(0, 0, hw, hh);
    gl.useProgram(r.bright);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, r.hdr.tex[0]);
    gl.uniform1i(gl.getUniformLocation(r.bright, "uScene"), 0);
    gl.uniform1f(gl.getUniformLocation(r.bright, "uThreshold"), threshold);
    drawFullscreen(gl, r.full);

    // ── 3. Separable blur, ping-pong ──
    gl.useProgram(r.blur);
    gl.uniform1fv(gl.getUniformLocation(r.blur, "uW"), WEIGHTS);
    gl.uniform1i(gl.getUniformLocation(r.blur, "uImage"), 0);
    let src = r.ping, dst = r.pong;
    if (stage !== 2) {
      for (let i = 0; i < passes * 2; i++) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fbo);
        gl.uniform2f(gl.getUniformLocation(r.blur, "uDir"), i % 2 === 0 ? 1 : 0, i % 2 === 0 ? 0 : 1);
        gl.bindTexture(gl.TEXTURE_2D, src.tex[0]);
        drawFullscreen(gl, r.full);
        [src, dst] = [dst, src];
      }
    }

    // ── 4. Composite + tone map ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, size.w, size.h);
    gl.useProgram(r.final);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, r.hdr.tex[0]);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, src.tex[0]);
    gl.uniform1i(gl.getUniformLocation(r.final, "uScene"), 0);
    gl.uniform1i(gl.getUniformLocation(r.final, "uBloom"), 1);
    gl.uniform1f(gl.getUniformLocation(r.final, "uIntensity"), intensity);
    gl.uniform1f(gl.getUniformLocation(r.final, "uStage"), stage === 0 ? 0 : stage === 1 ? 1 : 2);
    drawFullscreen(gl, r.full);
    gl.activeTexture(gl.TEXTURE0);
  };

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;

  // Kernel plot: the 9 taps of one 1D pass
  const KW = 220, KH = 90, taps = [-4, -3, -2, -1, 0, 1, 2, 3, 4];

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figBloom_title", "Bloom — Four Passes")}
        </span>
        <div className="flex gap-1.5 flex-wrap">
          {STAGES.map((l, i) => <button key={l} className={btn(stage === i)} onClick={() => setStage(i)}>{i + 1}. {l}</button>)}
        </div>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> orbit init={init} draw={draw} look={look} onLook={setLook} fovRange={[0.4, 1.3]}
          frame={[look, stage, threshold, passes, intensity, time]} aspect={16 / 9} />
      </div>
      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="space-y-1.5 min-w-0">
          {([["threshold", threshold, setThreshold, 0.2, 4, 0.05], ["blur passes", passes, setPasses, 1, 10, 1], ["intensity", intensity, setIntensity, 0, 3, 0.05]] as const).map(([label, v, set, min, max, step]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-[var(--text-muted)] w-20">{label}</span>
              <input type="range" min={min} max={max} step={step} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{v}</span>
            </label>
          ))}
          <button className={btn(animate)} onClick={() => setAnimate(v => !v)}>{animate ? "❚❚ move" : "▶ move"}</button>
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed pt-1">
            {tx(t, "figBloom_note", "Step through the stages. The bright pass keeps only the light sources; each blur pass spreads them further, at half resolution to save time; the composite adds that glow back before tone mapping. Raise the threshold and the lit walls stop blooming — only the lamps do.")}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{tx(t, "figBloom_kernel", "One 1D pass: 9 taps")}</p>
          <svg viewBox={`0 0 ${KW} ${KH}`} className="w-[220px] h-auto">
            {taps.map((k, i) => {
              const w = WEIGHTS[Math.abs(k)], h = (w / WEIGHTS[0]) * (KH - 26);
              const x = 10 + i * ((KW - 20) / 9);
              return (
                <g key={k}>
                  <rect x={x + 2} y={KH - 16 - h} width={(KW - 20) / 9 - 4} height={h} rx={2} fill="var(--primary)" opacity={0.35 + 0.65 * (w / WEIGHTS[0])} />
                  <text x={x + (KW - 20) / 18} y={KH - 4} fill="var(--code-muted)" fontSize="8" fontFamily="monospace" textAnchor="middle">{k}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </figure>
  );
}
