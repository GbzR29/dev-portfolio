"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, forwardFrom } from "../../kit/gl/gl";
import { GLView, useAnimationTime, type Look } from "../../kit/gl/GLView";
import { useVisible } from "../../kit/figure";
import { ensureColorTarget, FULL_VS, drawFullscreen, trs, type ColorTarget, type SceneItem } from "../../kit/gl/glx";
import { sceneMeshes, compileLit, drawRoom, roomCamera, clampRoomLook, ROOM_LOOK, SUN, type SceneMeshes } from "./scene";

// ── What this figure shows ────────────────────────────────────────────────────
// The same frame with four anti-aliasing strategies, rendered at a reduced
// resolution (pixel size) and scaled up without filtering so every pixel is
// visible:
//   none — one sample per pixel
//   MSAA — a multisampled renderbuffer, resolved with glBlitFramebuffer
//   SSAA — rendered at 2×2 the resolution, then averaged down
//   FXAA — a post-process pass that finds luma edges and blurs along them
// A fence of thin posts and the floor grid make the difference obvious;
// "sway" moves the camera slowly so you can see edges crawl.

const DOWN_FS = `#version 300 es
precision highp float;
uniform sampler2D uSrc;
out vec4 FragColor;
void main() {                       // 2×2 box filter: SSAA resolve
  ivec2 p = ivec2(gl_FragCoord.xy) * 2;
  vec3 c = texelFetch(uSrc, p, 0).rgb + texelFetch(uSrc, p + ivec2(1, 0), 0).rgb
         + texelFetch(uSrc, p + ivec2(0, 1), 0).rgb + texelFetch(uSrc, p + ivec2(1, 1), 0).rgb;
  FragColor = vec4(c * 0.25, 1.0);
}`;

const FXAA_FS = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uSrc;
uniform vec2 uTexel;
uniform float uShowEdges;
out vec4 FragColor;
// The classic FXAA (Lottes): estimate the edge direction from the luma of the
// four diagonal neighbours, then blend along it.
void main() {
  const float SPAN_MAX = 8.0, REDUCE_MUL = 1.0 / 8.0, REDUCE_MIN = 1.0 / 128.0;
  const vec3 LUMA = vec3(0.299, 0.587, 0.114);
  vec3 rgbM = texture(uSrc, vUV).rgb;
  float lNW = dot(texture(uSrc, vUV + vec2(-1.0, -1.0) * uTexel).rgb, LUMA);
  float lNE = dot(texture(uSrc, vUV + vec2( 1.0, -1.0) * uTexel).rgb, LUMA);
  float lSW = dot(texture(uSrc, vUV + vec2(-1.0,  1.0) * uTexel).rgb, LUMA);
  float lSE = dot(texture(uSrc, vUV + vec2( 1.0,  1.0) * uTexel).rgb, LUMA);
  float lM = dot(rgbM, LUMA);
  float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE)));
  float lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
  if (uShowEdges > 0.5) { float e = step(0.1, lMax - lMin); FragColor = vec4(mix(rgbM * 0.35, vec3(1.0, 0.2, 0.3), e), 1.0); return; }
  vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), (lNW + lSW) - (lNE + lSE));
  float dirReduce = max((lNW + lNE + lSW + lSE) * 0.25 * REDUCE_MUL, REDUCE_MIN);
  float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
  dir = clamp(dir * rcpDirMin, vec2(-SPAN_MAX), vec2(SPAN_MAX)) * uTexel;
  vec3 A = 0.5 * (texture(uSrc, vUV + dir * (1.0 / 3.0 - 0.5)).rgb + texture(uSrc, vUV + dir * (2.0 / 3.0 - 0.5)).rgb);
  vec3 B = A * 0.5 + 0.25 * (texture(uSrc, vUV - dir * 0.5).rgb + texture(uSrc, vUV + dir * 0.5).rgb);
  float lB = dot(B, LUMA);
  FragColor = vec4((lB < lMin || lB > lMax) ? A : B, 1.0);
}`;

const SHOW_FS = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uSrc;
out vec4 FragColor;
void main() { FragColor = vec4(texture(uSrc, vUV).rgb, 1.0); }   // NEAREST: pixels stay square`;

// A fence of thin posts and rails in front of the stairs
const FENCE: SceneItem[] = [
  ...Array.from({ length: 11 }, (_, i) => ({ mesh: "cube" as const, model: trs([-1.2 + i * 0.36, 0.6, 1.9], [0.045, 1.2, 0.045]), color: [0.12, 0.12, 0.14] as [number, number, number] })),
  { mesh: "cube", model: trs([0.6, 1.0, 1.9], [3.8, 0.035, 0.035]), color: [0.12, 0.12, 0.14] },
  { mesh: "cube", model: trs([0.6, 0.45, 1.9], [3.8, 0.035, 0.035]), color: [0.12, 0.12, 0.14] },
];

type Msaa = { fbo: WebGLFramebuffer; color: WebGLRenderbuffer; depth: WebGLRenderbuffer; w: number; h: number; samples: number };
type Res = {
  lit: WebGLProgram; down: WebGLProgram; fxaa: WebGLProgram; show: WebGLProgram; meshes: SceneMeshes; full: WebGLVertexArrayObject;
  base: ColorTarget | null; big: ColorTarget | null; post: ColorTarget | null; msaa: Msaa | null; maxSamples: number;
};
const MODES = ["none", "MSAA", "SSAA 2×2", "FXAA"] as const;

function ensureMsaa(gl: WebGL2RenderingContext, cur: Msaa | null, w: number, h: number, samples: number): Msaa {
  if (cur && cur.w === w && cur.h === h && cur.samples === samples) return cur;
  if (cur) { gl.deleteFramebuffer(cur.fbo); gl.deleteRenderbuffer(cur.color); gl.deleteRenderbuffer(cur.depth); }
  const fbo = gl.createFramebuffer()!, color = gl.createRenderbuffer()!, depth = gl.createRenderbuffer()!;
  gl.bindRenderbuffer(gl.RENDERBUFFER, color);
  gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.RGBA8, w, h);
  gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
  gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.DEPTH_COMPONENT24, w, h);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, color);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { fbo, color, depth, w, h, samples };
}

export function AaCompareFigure({ t }: { t?: TrackTranslations }) {
  const [look, setLook] = useState<Look>({ ...ROOM_LOOK, yaw: -0.35, pitch: -0.3 });
  const [mode, setMode] = useState(0);
  const [pixel, setPixel] = useState(3);
  const [sway, setSway] = useState(false);
  const [edges, setEdges] = useState(false);
  const [samplesInfo, setSamplesInfo] = useState(4);
  const vis = useVisible<HTMLElement>();
  const time = useAnimationTime(sway && vis.on);

  const init = (gl: WebGL2RenderingContext): Res => {
    const maxSamples = Math.min(4, gl.getParameter(gl.MAX_SAMPLES) as number);
    setSamplesInfo(maxSamples);
    return {
      lit: compileLit(gl), down: compileProgram(gl, FULL_VS, DOWN_FS), fxaa: compileProgram(gl, FULL_VS, FXAA_FS), show: compileProgram(gl, FULL_VS, SHOW_FS),
      meshes: sceneMeshes(gl), full: gl.createVertexArray()!, base: null, big: null, post: null, msaa: null, maxSamples,
    };
  };

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    const w = Math.max(1, Math.floor(size.w / pixel)), h = Math.max(1, Math.floor(size.h / pixel));
    r.base = ensureColorTarget(gl, r.base, w, h, { linear: false });
    r.post = ensureColorTarget(gl, r.post, w, h, { depth: false, linear: false });

    const l = { ...look, yaw: look.yaw + (sway ? Math.sin(time * 0.5) * 0.08 : 0) };
    const { cam, view } = roomCamera(forwardFrom(l.yaw, l.pitch));
    const scene = (fbo: WebGLFramebuffer, vw: number, vh: number) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, vw, vh);
      gl.clearColor(0.55, 0.62, 0.72, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.useProgram(r.lit);
      const u = (n: string) => gl.getUniformLocation(r.lit, n);
      gl.uniformMatrix4fv(u("uView"), false, view);
      gl.uniformMatrix4fv(u("uProjection"), false, mat4.perspective(look.fov, size.aspect, 0.1, 60));
      gl.uniform3fv(u("uCam"), cam);
      gl.uniform3fv(u("uSun"), SUN);
      drawRoom(gl, r.lit, r.meshes, FENCE);
      gl.disable(gl.DEPTH_TEST);
    };

    let result: WebGLTexture = r.base.tex[0];
    if (mode === 1) {
      // Render into the multisampled buffer, then resolve (average the samples) into a texture
      r.msaa = ensureMsaa(gl, r.msaa, w, h, r.maxSamples);
      scene(r.msaa.fbo, w, h);
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, r.msaa.fbo);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, r.base.fbo);
      gl.blitFramebuffer(0, 0, w, h, 0, 0, w, h, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    } else if (mode === 2) {
      r.big = ensureColorTarget(gl, r.big, w * 2, h * 2, { linear: false });
      scene(r.big.fbo, w * 2, h * 2);
      gl.bindFramebuffer(gl.FRAMEBUFFER, r.base.fbo);
      gl.viewport(0, 0, w, h);
      gl.useProgram(r.down);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, r.big.tex[0]);
      gl.uniform1i(gl.getUniformLocation(r.down, "uSrc"), 0);
      drawFullscreen(gl, r.full);
    } else {
      scene(r.base.fbo, w, h);
    }
    if (mode === 3) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, r.post.fbo);
      gl.viewport(0, 0, w, h);
      gl.useProgram(r.fxaa);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, r.base.tex[0]);
      // FXAA reads between texels: this texture must be sampled with LINEAR
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.uniform1i(gl.getUniformLocation(r.fxaa, "uSrc"), 0);
      gl.uniform2f(gl.getUniformLocation(r.fxaa, "uTexel"), 1 / w, 1 / h);
      gl.uniform1f(gl.getUniformLocation(r.fxaa, "uShowEdges"), edges ? 1 : 0);
      drawFullscreen(gl, r.full);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      result = r.post.tex[0];
    }

    // Show it, scaled up with NEAREST so each rendered pixel is a visible square
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, size.w, size.h);
    gl.useProgram(r.show);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, result);
    gl.uniform1i(gl.getUniformLocation(r.show, "uSrc"), 0);
    drawFullscreen(gl, r.full);
  };

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;
  const cost = ["1 sample, 1 shader run / pixel", `${samplesInfo} samples, ~1 shader run / pixel`, "4 samples, 4 shader runs / pixel", "1 sample + one fullscreen pass"][mode];

  return (
    <figure ref={vis.ref} className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figAa_title", "Anti-Aliasing Compared — Same Frame, Four Strategies")}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{tx(t, "figScene_hint", "drag to orbit · scroll to zoom")}</span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> orbit init={init} draw={draw} look={look} onLook={lk => setLook(clampRoomLook(lk))} fovRange={[0.4, 1.4]}
          frame={[look, mode, pixel, edges, time]} aspect={16 / 9}>
          <span className="absolute left-3 top-2 text-[10px] font-mono text-white/90 bg-black/40 rounded px-1.5 py-0.5 pointer-events-none">{MODES[mode]} · {cost}</span>
        </GLView>
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap items-center">
          {MODES.map((m, i) => <button key={m} className={btn(mode === i)} onClick={() => setMode(i)}>{m === "MSAA" ? `MSAA ${samplesInfo}×` : m}</button>)}
          <span className="w-px h-5 bg-[var(--border)] mx-1" />
          <button className={btn(sway)} onClick={() => setSway(v => !v)}>{sway ? "❚❚ sway" : "▶ sway"}</button>
          {mode === 3 && <button className={btn(edges)} onClick={() => setEdges(v => !v)}>{tx(t, "figAa_edges", "show detected edges")}</button>}
        </div>
        <label className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-20">pixel size</span>
          <input type="range" min={1} max={6} step={1} value={pixel} onChange={e => setPixel(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
          <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{pixel}×</span>
        </label>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {tx(t, "figAa_note", "Watch the fence posts and the floor grid. Without AA, thin posts break into dotted lines and edges are staircases. MSAA smooths every geometric edge but the grid lines painted by the shader still alias. SSAA fixes both at 4× the shading cost. FXAA is almost free and smooths everything with contrast — including detail that should stay sharp, and it cannot bring back a post that fell between pixels.")}
        </p>
      </div>
    </figure>
  );
}
