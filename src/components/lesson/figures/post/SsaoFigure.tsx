"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, forwardFrom, type Mat4 } from "../../kit/gl/gl";
import { GLView, type Look } from "../../kit/gl/GLView";
import { ensureColorTarget, FULL_VS, drawFullscreen, floatTargets, type ColorTarget } from "../../kit/gl/glx";
import { sceneMeshes, drawRoom, roomCamera, clampRoomLook, ROOM_LOOK, SUN, type SceneMeshes } from "./scene";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// The whole SSAO pipeline, as in the chapter:
//   1. geometry pass → G-buffer with view-space position, normal and albedo
//   2. SSAO pass     → for each pixel, N kernel samples in a normal-oriented
//                      hemisphere, rotated by a tiled 4×4 noise texture, each
//                      compared against the depth stored at its screen position
//   3. blur pass     → 4×4 box blur that removes the noise pattern
//   4. lighting      → ambient term multiplied by the blurred AO
// Every intermediate buffer can be shown on its own.

const GEO_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
uniform mat4 uModel, uView, uProjection;
out vec3 vPos; out vec3 vNormal;
void main() {
  vec4 v = uView * uModel * vec4(aPos, 1.0);
  vPos = v.xyz;
  vNormal = mat3(uView * uModel) * aNormal;
  gl_Position = uProjection * v;
}`;
const GEO_FS = `#version 300 es
precision highp float;
in vec3 vPos; in vec3 vNormal;
uniform vec3 uColor;
layout(location = 0) out vec4 gPosition;
layout(location = 1) out vec4 gNormal;
layout(location = 2) out vec4 gAlbedo;
void main() {
  gPosition = vec4(vPos, 1.0);                  // w = 1 marks "geometry here"
  gNormal = vec4(normalize(vNormal), 1.0);
  gAlbedo = vec4(uColor, 1.0);
}`;

const SSAO_FS = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D gPosition, gNormal, uNoise;
uniform vec3 uSamples[64];
uniform mat4 uProjection;
uniform vec2 uNoiseScale;
uniform int uCount;
uniform float uRadius, uBias, uRange, uRotate, uPower;
out vec4 FragColor;
void main() {
  vec4 P = texture(gPosition, vUV);
  if (P.w == 0.0) { FragColor = vec4(1.0); return; }
  vec3 fragPos = P.xyz;
  vec3 normal = normalize(texture(gNormal, vUV).xyz);
  vec3 randomVec = uRotate > 0.5 ? normalize(texture(uNoise, vUV * uNoiseScale).xyz * 2.0 - 1.0) : vec3(1.0, 0.0, 0.0);
  // Gram-Schmidt: a tangent perpendicular to the normal, tilted by the random vector
  vec3 tangent = normalize(randomVec - normal * dot(randomVec, normal));
  vec3 bitangent = cross(normal, tangent);
  mat3 TBN = mat3(tangent, bitangent, normal);

  float occlusion = 0.0;
  for (int i = 0; i < 64; i++) {
    if (i >= uCount) break;
    vec3 s = fragPos + TBN * uSamples[i] * uRadius;          // sample position, view space
    vec4 offset = uProjection * vec4(s, 1.0);                 // → clip → NDC → [0, 1]
    offset.xy = offset.xy / offset.w * 0.5 + 0.5;
    vec4 stored = texture(gPosition, offset.xy);
    if (stored.w == 0.0) continue;                            // sky: never occludes
    float rangeCheck = uRange > 0.5 ? smoothstep(0.0, 1.0, uRadius / abs(fragPos.z - stored.z)) : 1.0;
    occlusion += (stored.z >= s.z + uBias ? 1.0 : 0.0) * rangeCheck;
  }
  float ao = pow(1.0 - occlusion / float(uCount), uPower);
  FragColor = vec4(ao, ao, ao, 1.0);
}`;

const BLUR_FS = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uAO;
uniform vec2 uTexel;
out vec4 FragColor;
void main() {
  float sum = 0.0;
  for (int x = -2; x < 2; x++) for (int y = -2; y < 2; y++)   // 4×4 — the size of the noise tile
    sum += texture(uAO, vUV + vec2(x, y) * uTexel).r;
  float ao = sum / 16.0;
  FragColor = vec4(ao, ao, ao, 1.0);
}`;

const LIGHT_FS = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D gPosition, gNormal, gAlbedo, uAORaw, uAOBlur;
uniform vec3 uSunView;
uniform int uMode;
out vec4 FragColor;
void main() {
  vec4 P = texture(gPosition, vUV);
  float raw = texture(uAORaw, vUV).r, blur = texture(uAOBlur, vUV).r;
  if (uMode == 2) { FragColor = vec4(vec3(raw), 1.0); return; }
  if (uMode == 3) { FragColor = vec4(vec3(blur), 1.0); return; }
  if (P.w == 0.0) { FragColor = vec4(0.55, 0.62, 0.72, 1.0); return; }
  vec3 N = normalize(texture(gNormal, vUV).xyz);
  if (uMode == 4) { FragColor = vec4(N * 0.5 + 0.5, 1.0); return; }
  vec3 albedo = texture(gAlbedo, vUV).rgb;
  float ao = uMode == 1 ? 1.0 : blur;
  vec3 ambient = albedo * 0.8 * ao;                    // AO only darkens the ambient term
  vec3 diffuse = albedo * max(dot(N, uSunView), 0.0) * 0.35;
  FragColor = vec4(pow(ambient + diffuse, vec3(1.0 / 2.2)), 1.0);
}`;

/** LearnOpenGL's kernel: random points in the +Z hemisphere, pushed toward the centre. */
function makeKernel(count: number) {
  let s = 12345;
  const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const out = new Float32Array(64 * 3);
  for (let i = 0; i < count; i++) {
    let x = r() * 2 - 1, y = r() * 2 - 1, z = r();
    const l = Math.hypot(x, y, z) || 1;
    const len = r();
    const k = i / count, sc = 0.1 + 0.9 * k * k;            // lerp(0.1, 1.0, scale²)
    x = (x / l) * len * sc; y = (y / l) * len * sc; z = (z / l) * len * sc;
    out.set([x, y, z], i * 3);
  }
  return out;
}

type Res = {
  geo: WebGLProgram; ssao: WebGLProgram; blur: WebGLProgram; light: WebGLProgram;
  meshes: SceneMeshes; full: WebGLVertexArrayObject; noise: WebGLTexture;
  g: ColorTarget | null; aoRaw: ColorTarget | null; aoBlur: ColorTarget | null;
};
const MODES = ["final", "no AO", "AO raw", "AO blurred", "normals"] as const;

export function SsaoFigure({ t }: { t?: TrackTranslations }) {
  const [look, setLook] = useState<Look>(ROOM_LOOK);
  const [mode, setMode] = useState(0);
  const [radius, setRadius] = useState(0.8);
  const [bias, setBias] = useState(0.025);
  const [count, setCount] = useState(32);
  const [power, setPower] = useState(2.2);
  const [range, setRange] = useState(true);
  const [rotate, setRotate] = useState(true);
  const [floatOk, setFloatOk] = useState(true);

  const init = (gl: WebGL2RenderingContext): Res => {
    // 4×4 random rotation vectors around Z, tiled over the screen
    const noise = gl.createTexture()!;
    const px = new Uint8Array(16 * 4);
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2;
      px.set([Math.round((Math.cos(a) * 0.5 + 0.5) * 255), Math.round((Math.sin(a) * 0.5 + 0.5) * 255), 128, 255], i * 4);
    }
    gl.bindTexture(gl.TEXTURE_2D, noise);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 4, 4, 0, gl.RGBA, gl.UNSIGNED_BYTE, px);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    if (!floatTargets(gl)) setFloatOk(false);
    return {
      geo: compileProgram(gl, GEO_VS, GEO_FS), ssao: compileProgram(gl, FULL_VS, SSAO_FS),
      blur: compileProgram(gl, FULL_VS, BLUR_FS), light: compileProgram(gl, FULL_VS, LIGHT_FS),
      meshes: sceneMeshes(gl), full: gl.createVertexArray()!, noise,
      g: null, aoRaw: null, aoBlur: null,
    };
  };

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    r.g = ensureColorTarget(gl, r.g, size.w, size.h, { float: true, count: 3, linear: false });
    r.aoRaw = ensureColorTarget(gl, r.aoRaw, size.w, size.h, { depth: false, linear: false });
    r.aoBlur = ensureColorTarget(gl, r.aoBlur, size.w, size.h, { depth: false, linear: false });
    const { view } = roomCamera(forwardFrom(look.yaw, look.pitch));
    const proj: Mat4 = mat4.perspective(look.fov, size.aspect, 0.1, 60);

    // ── 1. Geometry pass ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, r.g.fbo);
    gl.viewport(0, 0, size.w, size.h);
    gl.clearBufferfv(gl.COLOR, 0, [0, 0, -1000, 0]);
    gl.clearBufferfv(gl.COLOR, 1, [0, 0, 0, 0]);
    gl.clearBufferfv(gl.COLOR, 2, [0, 0, 0, 0]);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(r.geo);
    gl.uniformMatrix4fv(gl.getUniformLocation(r.geo, "uView"), false, view);
    gl.uniformMatrix4fv(gl.getUniformLocation(r.geo, "uProjection"), false, proj);
    drawRoom(gl, r.geo, r.meshes);
    gl.disable(gl.DEPTH_TEST);

    // ── 2. SSAO ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, r.aoRaw.fbo);
    gl.useProgram(r.ssao);
    const s = (n: string) => gl.getUniformLocation(r.ssao, n);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, r.g.tex[0]);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, r.g.tex[1]);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, r.noise);
    gl.uniform1i(s("gPosition"), 0); gl.uniform1i(s("gNormal"), 1); gl.uniform1i(s("uNoise"), 2);
    gl.uniform3fv(s("uSamples"), makeKernel(count));        // the kernel spans the full radius for any N
    gl.uniformMatrix4fv(s("uProjection"), false, proj);
    gl.uniform2f(s("uNoiseScale"), size.w / 4, size.h / 4);
    gl.uniform1i(s("uCount"), count);
    gl.uniform1f(s("uRadius"), radius);
    gl.uniform1f(s("uBias"), bias);
    gl.uniform1f(s("uRange"), range ? 1 : 0);
    gl.uniform1f(s("uRotate"), rotate ? 1 : 0);
    gl.uniform1f(s("uPower"), power);
    drawFullscreen(gl, r.full);

    // ── 3. Blur ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, r.aoBlur.fbo);
    gl.useProgram(r.blur);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, r.aoRaw.tex[0]);
    gl.uniform1i(gl.getUniformLocation(r.blur, "uAO"), 0);
    gl.uniform2f(gl.getUniformLocation(r.blur, "uTexel"), 1 / size.w, 1 / size.h);
    drawFullscreen(gl, r.full);

    // ── 4. Lighting ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(r.light);
    const l = (n: string) => gl.getUniformLocation(r.light, n);
    [r.g.tex[0], r.g.tex[1], r.g.tex[2], r.aoRaw.tex[0], r.aoBlur.tex[0]].forEach((tex, i) => {
      gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tex);
    });
    ["gPosition", "gNormal", "gAlbedo", "uAORaw", "uAOBlur"].forEach((n, i) => gl.uniform1i(l(n), i));
    // The sun direction, rotated into view space (w = 0: no translation)
    const sv = [0, 1, 2].map(i => view[i] * SUN[0] + view[4 + i] * SUN[1] + view[8 + i] * SUN[2]);
    gl.uniform3fv(l("uSunView"), sv);
    gl.uniform1i(l("uMode"), mode);
    drawFullscreen(gl, r.full);
  };

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;

  return (
    <FigureShell>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figSsao_title", "SSAO — From G-Buffer to Soft Contact Shadows")}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{tx(t, "figScene_hint", "drag to orbit · scroll to zoom")}</span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> orbit init={init} draw={draw} look={look} onLook={l => setLook(clampRoomLook(l))} fovRange={[0.5, 1.4]}
          frame={[look, mode, radius, bias, count, power, range, rotate]} aspect={16 / 9} />
        {!floatOk && <p className="text-[11px] font-mono text-red-400 px-2 pt-1">{tx(t, "figSsao_noFloat", "This browser cannot render to float textures, so view-space positions lose precision and the AO will be wrong.")}</p>}
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap">
          {MODES.map((m, i) => <button key={m} className={btn(mode === i)} onClick={() => setMode(i)}>{m}</button>)}
        </div>
        <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {([["radius", radius, setRadius, 0.05, 2, 0.05], ["bias", bias, setBias, 0, 0.15, 0.005], ["samples", count, setCount, 4, 64, 1], ["power", power, setPower, 0.5, 4, 0.1]] as const).map(([label, v, set, min, max, step]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-16">{label}</span>
              <input type="range" min={min} max={max} step={step} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-12 text-right">{v}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-4 flex-wrap text-[10px] font-mono text-[var(--text-muted)]">
          {([["range check", range, setRange], ["random rotation (4×4 noise)", rotate, setRotate]] as const).map(([lbl, v, set]) => (
            <label key={lbl} className="flex items-center gap-1.5"><input type="checkbox" checked={v} onChange={e => set(e.target.checked)} className="accent-[var(--primary)]" />{lbl}</label>
          ))}
        </div>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {mode === 2
            ? tx(t, "figSsao_rawNote", "The raw AO is noisy on purpose: each pixel of a 4×4 tile rotates the same kernel differently. With only a few samples per pixel, the rotation trades banding (switch it off to see the rings) for high-frequency noise that a small blur removes.")
            : tx(t, "figSsao_note", "Compare final with no AO: the creases where the boxes meet the floor, the corner of the room and the underside of the sphere darken, and objects stop floating. Raise the radius and the shadows spread; turn off the range check and a dark halo appears on the wall behind the sphere and stairs.")}
        </p>
      </div>
    </FigureShell>
  );
}
