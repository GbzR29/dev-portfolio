"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, forwardFrom } from "../gl";
import { GLView, useAnimationTime, type Look } from "../GLView";
import { ensureColorTarget, FULL_VS, drawFullscreen, type ColorTarget } from "../glx";
import { sceneMeshes, compileLit, drawRoom, roomCamera, clampRoomLook, ROOM_LOOK, SUN, type SceneMeshes } from "./scene";

// ── What this figure shows ────────────────────────────────────────────────────
// A post-processing stack. The scene is rendered once into a texture; every
// effect after that is a fullscreen fragment shader reading it. The Gaussian
// blur runs as two passes (horizontal then vertical) — the separable trick.
// Drag the split line to compare with the untouched image.

const BLUR_FS = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uSrc;
uniform vec2 uDir;            // (1/w, 0) or (0, 1/h)
uniform float uSigma;
out vec4 FragColor;
void main() {
  // 1D Gaussian: weights e^(−x²/2σ²), normalised by their sum
  vec3 sum = texture(uSrc, vUV).rgb;
  float wsum = 1.0;
  for (int i = 1; i <= 24; i++) {
    float x = float(i);
    if (x > uSigma * 3.0) break;
    float w = exp(-x * x / (2.0 * uSigma * uSigma));
    sum += (texture(uSrc, vUV + uDir * x).rgb + texture(uSrc, vUV - uDir * x).rgb) * w;
    wsum += 2.0 * w;
  }
  FragColor = vec4(sum / wsum, 1.0);
}`;

const POST_FS = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uScene, uBlurred;
uniform vec2 uTexel;
uniform float uSplit, uTime;
uniform float uBlur, uPixel, uCA, uKernelOn, uGrey, uInvert, uSepia, uVignette, uGrain, uPoster;
uniform float uExposure, uContrast, uSaturation, uTemp;
uniform float uKernel[9];
out vec4 FragColor;

vec3 src(vec2 uv) { return uBlur > 0.5 ? texture(uBlurred, uv).rgb : texture(uScene, uv).rgb; }
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  vec2 uv = vUV;
  if (uv.x < uSplit) { FragColor = vec4(texture(uScene, uv).rgb, 1.0); return; }

  // 1. UV effects: pixelate snaps the coordinate to a coarse grid
  if (uPixel > 1.0) { vec2 cell = uTexel * uPixel; uv = (floor(uv / cell) + 0.5) * cell; }

  // 2. Chromatic aberration: R and B sampled slightly outward / inward from the centre
  vec3 c;
  if (uCA > 0.0) {
    vec2 d = (uv - 0.5) * uCA * 0.02;
    c = vec3(src(uv + d).r, src(uv).g, src(uv - d).b);
  } else c = src(uv);

  // 3. 3×3 convolution kernel
  if (uKernelOn > 0.5) {
    vec3 s = vec3(0.0);
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++)
      s += src(uv + vec2(i, -j) * uTexel) * uKernel[(j + 1) * 3 + (i + 1)];
    c = s;
  }

  // 4. Colour grading
  c *= uExposure;
  c += vec3(0.06, 0.0, -0.06) * uTemp;                               // warm ↔ cool
  float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(luma), c, uSaturation);
  c = (c - 0.5) * uContrast + 0.5;

  // 5. Colour remaps
  luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
  if (uGrey > 0.5) c = vec3(luma);
  if (uSepia > 0.5) c = vec3(luma) * vec3(1.07, 0.74, 0.43) * 1.1;
  if (uInvert > 0.5) c = 1.0 - c;
  if (uPoster > 1.0) c = floor(c * uPoster + 0.5) / uPoster;

  // 6. Vignette: darken by distance from the centre
  float r = length(vUV - 0.5) * 1.414;
  c *= 1.0 - uVignette * smoothstep(0.35, 1.05, r);

  // 7. Film grain, animated
  c += (hash(vUV * 800.0 + uTime) - 0.5) * uGrain;

  FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
  if (abs(vUV.x - uSplit) < uTexel.x * 1.5) FragColor = vec4(1.0, 0.75, 0.2, 1.0);
}`;

const KERNELS: Record<string, number[]> = {
  sharpen: [0, -1, 0, -1, 5, -1, 0, -1, 0],
  edges: [1, 1, 1, 1, -8, 1, 1, 1, 1],
  emboss: [-2, -1, 0, -1, 1, 1, 0, 1, 2],
};

type Fx = {
  blur: number; pixel: number; ca: number; kernel: "" | keyof typeof KERNELS; grey: boolean; invert: boolean; sepia: boolean;
  vignette: number; grain: number; poster: number; exposure: number; contrast: number; saturation: number; temp: number;
};
const NONE: Fx = { blur: 0, pixel: 1, ca: 0, kernel: "", grey: false, invert: false, sepia: false, vignette: 0, grain: 0, poster: 0, exposure: 1, contrast: 1, saturation: 1, temp: 0 };
const PRESETS: Record<string, Fx> = {
  none: NONE,
  cinematic: { ...NONE, vignette: 0.7, grain: 0.06, ca: 0.8, contrast: 1.2, saturation: 0.85, temp: 0.6 },
  retro: { ...NONE, pixel: 5, poster: 5, saturation: 1.3 },
  "night vision": { ...NONE, grey: true, vignette: 0.9, grain: 0.14, exposure: 1.6, temp: -1 },
  "comic edges": { ...NONE, kernel: "edges", invert: true, grey: true },
  dream: { ...NONE, blur: 4, exposure: 1.15, saturation: 1.2, vignette: 0.4 },
};

type Res = { lit: WebGLProgram; blur: WebGLProgram; post: WebGLProgram; meshes: SceneMeshes; full: WebGLVertexArrayObject; scene: ColorTarget | null; a: ColorTarget | null; b: ColorTarget | null };

export function PostFxFigure({ t }: { t?: TrackTranslations }) {
  const [look, setLook] = useState<Look>(ROOM_LOOK);
  const [fx, setFx] = useState<Fx>(PRESETS.cinematic);
  const [split, setSplit] = useState(0.35);
  const time = useAnimationTime(fx.grain > 0);
  const set = <K extends keyof Fx>(k: K, v: Fx[K]) => setFx(f => ({ ...f, [k]: v }));

  const init = (gl: WebGL2RenderingContext): Res => ({
    lit: compileLit(gl), blur: compileProgram(gl, FULL_VS, BLUR_FS), post: compileProgram(gl, FULL_VS, POST_FS),
    meshes: sceneMeshes(gl), full: gl.createVertexArray()!, scene: null, a: null, b: null,
  });

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    r.scene = ensureColorTarget(gl, r.scene, size.w, size.h);
    r.a = ensureColorTarget(gl, r.a, size.w, size.h, { depth: false });
    r.b = ensureColorTarget(gl, r.b, size.w, size.h, { depth: false });

    // ── Pass 1: the scene, into a texture ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, r.scene.fbo);
    gl.viewport(0, 0, size.w, size.h);
    gl.clearColor(0.55, 0.62, 0.72, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    const { cam, view } = roomCamera(forwardFrom(look.yaw, look.pitch));
    gl.useProgram(r.lit);
    const u = (n: string) => gl.getUniformLocation(r.lit, n);
    gl.uniformMatrix4fv(u("uView"), false, view);
    gl.uniformMatrix4fv(u("uProjection"), false, mat4.perspective(look.fov, size.aspect, 0.1, 60));
    gl.uniform3fv(u("uCam"), cam);
    gl.uniform3fv(u("uSun"), SUN);
    drawRoom(gl, r.lit, r.meshes);
    gl.disable(gl.DEPTH_TEST);

    // ── Pass 2 + 3: separable Gaussian blur (scene → a → b) ──
    if (fx.blur > 0) {
      gl.useProgram(r.blur);
      const bu = (n: string) => gl.getUniformLocation(r.blur, n);
      gl.uniform1f(bu("uSigma"), fx.blur);
      gl.uniform1i(bu("uSrc"), 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, r.a.fbo);
      gl.bindTexture(gl.TEXTURE_2D, r.scene.tex[0]);
      gl.uniform2f(bu("uDir"), 1 / size.w, 0);
      drawFullscreen(gl, r.full);
      gl.bindFramebuffer(gl.FRAMEBUFFER, r.b.fbo);
      gl.bindTexture(gl.TEXTURE_2D, r.a.tex[0]);
      gl.uniform2f(bu("uDir"), 0, 1 / size.h);
      drawFullscreen(gl, r.full);
    }

    // ── Final pass: the effect stack, to the screen ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(r.post);
    const p = (n: string) => gl.getUniformLocation(r.post, n);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, r.scene.tex[0]);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, r.b.tex[0]);
    gl.uniform1i(p("uScene"), 0); gl.uniform1i(p("uBlurred"), 1);
    gl.uniform2f(p("uTexel"), 1 / size.w, 1 / size.h);
    gl.uniform1f(p("uSplit"), split);
    gl.uniform1f(p("uTime"), time % 100);
    gl.uniform1f(p("uBlur"), fx.blur > 0 ? 1 : 0);
    gl.uniform1f(p("uPixel"), fx.pixel);
    gl.uniform1f(p("uCA"), fx.ca);
    gl.uniform1f(p("uKernelOn"), fx.kernel ? 1 : 0);
    if (fx.kernel) gl.uniform1fv(p("uKernel"), KERNELS[fx.kernel]);
    gl.uniform1f(p("uGrey"), fx.grey ? 1 : 0);
    gl.uniform1f(p("uInvert"), fx.invert ? 1 : 0);
    gl.uniform1f(p("uSepia"), fx.sepia ? 1 : 0);
    gl.uniform1f(p("uVignette"), fx.vignette);
    gl.uniform1f(p("uGrain"), fx.grain);
    gl.uniform1f(p("uPoster"), fx.poster);
    gl.uniform1f(p("uExposure"), fx.exposure);
    gl.uniform1f(p("uContrast"), fx.contrast);
    gl.uniform1f(p("uSaturation"), fx.saturation);
    gl.uniform1f(p("uTemp"), fx.temp);
    drawFullscreen(gl, r.full);
  };

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;
  const sliders: [keyof Fx, string, number, number, number][] = [
    ["blur", "gaussian σ", 0, 12, 0.5], ["pixel", "pixel size", 1, 16, 1], ["ca", "chromatic ab.", 0, 3, 0.05],
    ["vignette", "vignette", 0, 1.2, 0.05], ["grain", "grain", 0, 0.3, 0.01], ["poster", "posterize", 0, 12, 1],
    ["exposure", "exposure", 0.2, 2.5, 0.05], ["contrast", "contrast", 0.3, 2, 0.05], ["saturation", "saturation", 0, 2, 0.05], ["temp", "temperature", -1.5, 1.5, 0.05],
  ];

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figPostFx_title", "A Post-Processing Stack — One Texture, Many Fullscreen Passes")}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{tx(t, "figScene_hint", "drag to orbit · scroll to zoom")}</span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> orbit init={init} draw={draw} look={look} onLook={l => setLook(clampRoomLook(l))} fovRange={[0.5, 1.4]}
          frame={[look, fx, split, time]} aspect={16 / 9}>
          <span className="absolute left-3 top-2 text-[9px] font-mono text-white/80 pointer-events-none">{tx(t, "figPostFx_before", "original")}</span>
          <span className="absolute right-3 top-2 text-[9px] font-mono text-white/80 pointer-events-none">{tx(t, "figPostFx_after", "post-processed")}</span>
        </GLView>
        <label className="flex items-center gap-2 px-2 pt-2">
          <span className="text-[9px] font-mono text-[var(--code-muted)] w-16">split</span>
          <input type="range" min={0} max={1} step={0.01} value={split} onChange={e => setSplit(Number(e.target.value))} className="flex-1 accent-[#f59e0b]" />
        </label>
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-[9px] font-mono text-[var(--text-muted)] mr-1">presets</span>
          {Object.keys(PRESETS).map(k => <button key={k} className={btn(JSON.stringify(PRESETS[k]) === JSON.stringify(fx))} onClick={() => setFx(PRESETS[k])}>{k}</button>)}
        </div>
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-[9px] font-mono text-[var(--text-muted)] mr-1">kernel</span>
          {(["", "sharpen", "edges", "emboss"] as const).map(k => <button key={k || "off"} className={btn(fx.kernel === k)} onClick={() => set("kernel", k)}>{k || "off"}</button>)}
          <span className="w-px h-5 bg-[var(--border)] mx-1" />
          {(["grey", "sepia", "invert"] as const).map(k => <button key={k} className={btn(fx[k])} onClick={() => set(k, !fx[k])}>{k}</button>)}
        </div>
        <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {sliders.map(([k, label, min, max, step]) => (
            <label key={k} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-24">{label}</span>
              <input type="range" min={min} max={max} step={step} value={fx[k] as number} onChange={e => set(k, Number(e.target.value) as never)} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{(fx[k] as number).toFixed(step < 0.1 ? 2 : step < 1 ? 1 : 0)}</span>
            </label>
          ))}
        </div>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {tx(t, "figPostFx_note", "The 3D scene is drawn only once per frame. Everything else — blur, grading, vignette, grain — is a fullscreen fragment shader reading that texture, so its cost depends on the number of pixels, not on how many objects are in the scene.")}
        </p>
      </div>
    </figure>
  );
}
