"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { compileProgram, makeTexture2D, type TexImage, type Vec3 } from "../gl";
import { FULL_VS, drawFullscreen } from "../glx";
import { GLView, useSky, SkyPicker, type Look, type SkyImages } from "../GLView";

// ── What this figure shows ────────────────────────────────────────────────────
// A light probe in 9 numbers. The sky's radiance is projected onto the first
// three bands of spherical harmonics (computed on the CPU from the panorama);
// the irradiance those 9 RGB coefficients predict is compared with a brute-
// force Monte Carlo reference. The top row shows the 9 basis functions.

// SH basis (real, orthonormal) for a unit direction, bands 0–2
const shBasis = (x: number, y: number, z: number) => [
  0.282095,
  0.488603 * y, 0.488603 * z, 0.488603 * x,
  1.092548 * x * y, 1.092548 * y * z, 0.315392 * (3 * z * z - 1), 1.092548 * x * z, 0.546274 * (x * x - y * y),
];

/** Projects an equirectangular image onto 9 SH coefficients per channel. */
function projectSH(img: TexImage): Vec3[] {
  const W = 128, H = 64;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(img, 0, 0, W, H);
  const px = g.getImageData(0, 0, W, H).data;
  const out: Vec3[] = Array.from({ length: 9 }, () => [0, 0, 0]);
  for (let j = 0; j < H; j++) {
    const th = (0.5 - (j + 0.5) / H) * Math.PI;                  // latitude
    const dOmega = Math.cos(th) * (2 * Math.PI / W) * (Math.PI / H); // solid angle of this pixel
    for (let i = 0; i < W; i++) {
      const ph = ((i + 0.5) / W - 0.5) * 2 * Math.PI;
      const d = [Math.cos(th) * Math.cos(ph), Math.sin(th), Math.cos(th) * Math.sin(ph)];
      const Y = shBasis(d[0], d[1], d[2]);
      const o = (j * W + i) * 4;
      const L = [0, 1, 2].map(k => Math.pow(px[o + k] / 255, 2.2));   // sRGB → linear radiance
      for (let n = 0; n < 9; n++) for (let k = 0; k < 3; k++) out[n][k] += L[k] * Y[n] * dOmega;
    }
  }
  return out;
}

const FS = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 FragColor;
uniform sampler2D uEnv;
uniform vec3 uSH[9];
uniform int uBands;
uniform float uAspect;
const float PI = 3.14159265;

vec3 env(vec3 d) {
  vec2 uv = vec2(atan(d.z, d.x) / (2.0 * PI) + 0.5, 0.5 - asin(clamp(d.y, -1.0, 1.0)) / PI);
  return pow(textureLod(uEnv, uv, 0.0).rgb, vec3(2.2));
}
float basis(int i, vec3 n) {
  float x = n.x, y = n.y, z = n.z;
  if (i == 0) return 0.282095;
  if (i == 1) return 0.488603 * y;
  if (i == 2) return 0.488603 * z;
  if (i == 3) return 0.488603 * x;
  if (i == 4) return 1.092548 * x * y;
  if (i == 5) return 1.092548 * y * z;
  if (i == 6) return 0.315392 * (3.0 * z * z - 1.0);
  if (i == 7) return 1.092548 * x * z;
  return 0.546274 * (x * x - y * y);
}
// Irradiance from SH: each band is scaled by the cosine lobe's own SH weight Â_l
vec3 shIrradiance(vec3 n) {
  const float A0 = PI, A1 = 2.0 * PI / 3.0, A2 = PI / 4.0;
  vec3 e = A0 * uSH[0] * basis(0, n);
  if (uBands >= 1) for (int i = 1; i < 4; i++) e += A1 * uSH[i] * basis(i, n);
  if (uBands >= 2) for (int i = 4; i < 9; i++) e += A2 * uSH[i] * basis(i, n);
  return max(e, 0.0);
}
// Reference: ∫ L(ω) max(n·ω, 0) dω by Monte Carlo, 256 cosine-weighted samples (Hammersley)
vec3 refIrradiance(vec3 n) {
  vec3 t = normalize(abs(n.y) < 0.99 ? cross(n, vec3(0, 1, 0)) : cross(n, vec3(1, 0, 0)));
  vec3 b = cross(n, t), sum = vec3(0.0);
  for (int i = 0; i < 256; i++) {
    uint bits = uint(i);
    bits = (bits << 16u) | (bits >> 16u);
    bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
    bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
    bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
    bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
    float u1 = float(i) / 256.0, u2 = float(bits) * 2.3283064365386963e-10;
    float r = sqrt(u1), phi = 2.0 * PI * u2;
    vec3 d = t * r * cos(phi) + b * r * sin(phi) + n * sqrt(1.0 - u1);
    sum += env(d);
  }
  return sum / 256.0 * PI;      // cosine-weighted: E = π · average radiance
}
vec3 tone(vec3 c) { return pow(c / (1.0 + c), vec3(1.0 / 2.2)); }

// Is p inside a sphere drawn at centre c with radius r (both in screen units)? Returns the normal.
bool sphereAt(vec2 p, vec2 c, float r, out vec3 n) {
  vec2 q = (p - c) / r;
  float d = dot(q, q);
  if (d > 1.0) return false;
  n = vec3(q.x, q.y, sqrt(1.0 - d));        // facing the viewer (+z)
  // turn so the viewer looks at the sphere from the side (+z world → −x screen…)
  n = vec3(n.z, n.y, -n.x);
  return true;
}

void main() {
  vec2 p = vec2(vUV.x * uAspect, vUV.y);
  vec3 col = vec3(0.07, 0.08, 0.1);
  vec3 n;
  // Top row: the 9 basis functions, as a pyramid (1 / 3 / 5)
  for (int i = 0; i < 9; i++) {
    int l = i == 0 ? 0 : i < 4 ? 1 : 2;
    int m = i == 0 ? 0 : i < 4 ? i - 2 : i - 6;
    vec2 c = vec2(0.46 + float(m) * 0.145, 0.86 - float(l) * 0.15);
    if (sphereAt(p, c, 0.062, n)) {
      float v = basis(i, n) * 2.0;
      col = v > 0.0 ? mix(vec3(0.12), vec3(0.95, 0.35, 0.25), clamp(v, 0.0, 1.0)) : mix(vec3(0.12), vec3(0.25, 0.5, 0.95), clamp(-v, 0.0, 1.0));
      col *= 0.6 + 0.4 * max(dot(n, normalize(vec3(0.6, 0.5, 0.6))), 0.0);   // a little shading to read the shape
    }
  }
  // Bottom row: environment · reference · SH · error
  float R = 0.15, y = 0.24;
  vec2 cs[4] = vec2[4](vec2(0.2, y), vec2(0.58, y), vec2(0.96, y), vec2(1.34, y));
  for (int k = 0; k < 4; k++) {
    if (!sphereAt(p, cs[k], R, n)) continue;
    if (k == 0) col = tone(env(reflect(vec3(-1.0, 0.0, 0.0), n)));        // mirror ball: what the probe sees
    else if (k == 1) col = tone(refIrradiance(n) / PI);
    else if (k == 2) col = tone(shIrradiance(n) / PI);
    else col = vec3(length(refIrradiance(n) - shIrradiance(n)) / PI * 4.0);
  }
  FragColor = vec4(col, 1.0);
}`;

type Res = { prog: WebGLProgram; vao: WebGLVertexArrayObject; env?: WebGLTexture; envFrom?: SkyImages | null };
const LOOK: Look = { yaw: 0, pitch: 0, fov: 1 };
const LABELS = ["probe's view (mirror ball)", "reference irradiance", "SH irradiance", "error × 4"];

export function ShProbeFigure({ t }: { t?: TrackTranslations }) {
  const sky = useSky();
  const [bands, setBands] = useState(2);
  const coeffs = useMemo(() => (sky.images ? projectSH(sky.images.equirect) : null), [sky.images]);

  const init = (gl: WebGL2RenderingContext): Res => ({ prog: compileProgram(gl, FULL_VS, FS), vao: gl.createVertexArray()! });
  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    gl.viewport(0, 0, size.w, size.h);
    gl.clearColor(0.07, 0.08, 0.1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (!sky.images || !coeffs) return;
    if (r.envFrom !== sky.images) {
      if (r.env) gl.deleteTexture(r.env);
      r.env = makeTexture2D(gl, sky.images.equirect);
      r.envFrom = sky.images;
    }
    gl.useProgram(r.prog);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, r.env!);
    gl.uniform1i(gl.getUniformLocation(r.prog, "uEnv"), 0);
    gl.uniform3fv(gl.getUniformLocation(r.prog, "uSH[0]"), coeffs.flat());
    gl.uniform1i(gl.getUniformLocation(r.prog, "uBands"), bands);
    gl.uniform1f(gl.getUniformLocation(r.prog, "uAspect"), size.aspect);
    drawFullscreen(gl, r.vao);
  };

  const btn = (active: boolean) =>
    `px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all ${active
      ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]"
      : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40"}`;
  const swatch = (c: Vec3) => {
    const m = Math.max(1e-6, ...c.map(Math.abs));
    return `rgb(${c.map(v => Math.round(128 + (v / m) * 127)).join(",")})`;
  };

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{tx(t, "figSh_title", "A Light Probe in Nine Numbers")}</span>
        <SkyPicker sources={sky.sources} value={sky.id} onChange={sky.setId} busy={sky.busy} />
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2 relative">
        <GLView<Res> init={init} draw={draw} look={LOOK} frame={[bands, coeffs, sky.images]} aspect={1.55} />
        <div className="absolute left-3 top-3 text-[10px] font-mono text-white/70 pointer-events-none">
          {tx(t, "figSh_basis", "the 9 basis functions Yₗₘ — red +, blue −")}
        </div>
        <div className="absolute inset-x-2 bottom-3 grid grid-cols-4 text-center text-[9px] font-mono text-white/70 pointer-events-none">
          {LABELS.map(l => <span key={l}>{l}</span>)}
        </div>
      </div>
      <div className="p-4 md:p-5 grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <div className="flex gap-1.5 flex-wrap items-center">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mr-1">{tx(t, "figSh_use", "use bands")}</span>
            <button className={btn(bands === 0)} onClick={() => setBands(0)}>l = 0 (1 coeff)</button>
            <button className={btn(bands === 1)} onClick={() => setBands(1)}>l ≤ 1 (4)</button>
            <button className={btn(bands === 2)} onClick={() => setBands(2)}>l ≤ 2 (9)</button>
          </div>
          <div className="grid grid-cols-3 gap-1 font-mono text-[9px]">
            {(coeffs ?? []).map((c, i) => (
              <div key={i} className="flex items-center gap-1.5 rounded border border-[var(--code-border)] bg-[var(--code-bg)] px-1.5 py-1">
                <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: swatch(c) }} />
                <span className="text-[var(--text-muted)]">L{i === 0 ? "00" : i < 4 ? `1${i - 2}` : `2${i - 6}`}</span>
                <span className="text-[var(--text-main)] truncate">{c.map(v => v.toFixed(2)).join(" ")}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {tx(t, "figSh_note", "One coefficient is the average colour of the sky: a flat, uniform ambient. Four add a direction: brighter on the side the light comes from. Nine add the difference between top, horizon and ground, and between opposite sides. With nine, the error sphere is nearly black for every sky: a matte object cannot tell those 27 numbers from the whole panorama. That is why games store light probes as spherical harmonics.")}
        </p>
      </div>
    </figure>
  );
}
