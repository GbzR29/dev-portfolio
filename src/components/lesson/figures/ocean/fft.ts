// ── The ocean on the GPU: spectrum → FFT → displacement, every frame ──────────
// Per cascade and per frame:
//   1. evolve    h̃(k, t) from h̃0, and the seven other spectra needed (horizontal
//                displacement and slopes), packed two real fields per complex
//                number into two RGBA32F textures;
//   2. FFT       log2 N horizontal then log2 N vertical Stockham butterfly
//                passes, ping-ponging between two such texture pairs;
//   3. assemble  undo the centred-index sign, scale the horizontal
//                displacement by the choppiness, and write the displacement
//                and derivative textures the water shaders sample (with mips);
// Then, once per frame:
//   4. foam      where the summed cascades fold the surface (J < threshold),
//                foam is injected into a texture that keeps it with exponential
//                decay, so it lingers behind breaking crests. It covers the
//                largest tile at 1024² (0.5 m texels): the web-like detail
//                comes from a pattern at shading time, so it can be coarse.

import { compileProgram } from "../../kit/gl/gl";
import { FULL_VS, drawFullscreen, floatTargets } from "../../kit/gl/glx";
import { N, CASCADES } from "./spectrum";

const LOG_N = Math.log2(N);
export const FOAM_N = 1024;

// ── Shaders ───────────────────────────────────────────────────────────────────
const EVOLVE_FS = `#version 300 es
precision highp float;
uniform sampler2D uH0;             // h̃0(k), conj h̃0(−k)
uniform float uL, uTime;
layout(location = 0) out vec4 O0;  // (h + i·Dx, Dz + i·hx)
layout(location = 1) out vec4 O1;  // (hz + i·Dxx, Dzz + i·Dxz)
vec2 cmul(vec2 a, vec2 b) { return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x); }
vec2 ci(vec2 a) { return vec2(-a.y, a.x); }                 // i·a
void main() {
  ivec2 t = ivec2(gl_FragCoord.xy);
  vec2 k = 6.2831853 * vec2(t - ${N / 2}) / uL;
  float kl = length(k);
  vec4 s = texelFetch(uH0, t, 0);
  float w = sqrt(9.81 * kl);                                 // deep water: ω² = g·k
  vec2 e = vec2(cos(w * uTime), sin(w * uTime));
  // h̃(k, t) = h̃0(k)·e^(−iωt) + conj h̃0(−k)·e^(iωt): the two halves make h real
  vec2 h = cmul(s.xy, vec2(e.x, -e.y)) + cmul(s.zw, e);
  vec2 kn = kl > 0.0 ? k / kl : vec2(0.0);
  // D = i·(k/|k|)·h̃ moves points toward the crests (Tessendorf writes −i and
  // uses a negative λ; the sign is folded in here so λ stays positive)
  vec2 dx = ci(h) * kn.x, dz = ci(h) * kn.y;
  vec2 hx = ci(h) * k.x, hz = ci(h) * k.y;                   // ∂h/∂x = i·kx·h̃
  float inv = kl > 0.0 ? 1.0 / kl : 0.0;                     // ∂Dx/∂x = i·kx · i·kx/k · h̃ = −kx²/k · h̃
  vec2 dxx = -h * k.x * k.x * inv, dzz = -h * k.y * k.y * inv, dxz = -h * k.x * k.y * inv;
  // Two real fields a, b travel as one complex spectrum a + i·b
  O0 = vec4(h + ci(dx), dz + ci(hx));
  O1 = vec4(hz + ci(dxx), dzz + ci(dxz));
}`;

// Stockham radix-2 step: output i combines the "even" and "odd" halves of
// the previous stage with the twiddle factor e^(+2πi·i/size) (inverse DFT)
const FFT_FS = `#version 300 es
precision highp float;
uniform sampler2D uSrc0, uSrc1;
uniform float uSize;               // 2^(stage + 1)
uniform int   uHorizontal;
layout(location = 0) out vec4 O0;
layout(location = 1) out vec4 O1;
vec2 cmul(vec2 a, vec2 b) { return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x); }
void main() {
  ivec2 t = ivec2(gl_FragCoord.xy);
  float i = float(uHorizontal == 1 ? t.x : t.y);
  float half_ = uSize * 0.5;
  float ev = floor(i / uSize) * half_ + mod(i, half_);
  ivec2 a = uHorizontal == 1 ? ivec2(int(ev), t.y) : ivec2(t.x, int(ev));
  ivec2 b = uHorizontal == 1 ? ivec2(int(ev) + ${N / 2}, t.y) : ivec2(t.x, int(ev) + ${N / 2});
  float arg = 6.2831853 * i / uSize;
  vec2 tw = vec2(cos(arg), sin(arg));
  vec4 e0 = texelFetch(uSrc0, a, 0), o0 = texelFetch(uSrc0, b, 0);
  vec4 e1 = texelFetch(uSrc1, a, 0), o1 = texelFetch(uSrc1, b, 0);
  O0 = vec4(e0.xy + cmul(tw, o0.xy), e0.zw + cmul(tw, o0.zw));
  O1 = vec4(e1.xy + cmul(tw, o1.xy), e1.zw + cmul(tw, o1.zw));
}`;

const ASSEMBLE_FS = `#version 300 es
precision highp float;
uniform sampler2D uSrc0, uSrc1;
uniform float uChop;
layout(location = 0) out vec4 Disp;   // (λ·Dx, h, λ·Dz, λ·∂Dx/∂z)
layout(location = 1) out vec4 Deriv;  // (∂h/∂x, ∂h/∂z, λ·∂Dx/∂x, λ·∂Dz/∂z)
void main() {
  ivec2 t = ivec2(gl_FragCoord.xy);
  // The spectrum was stored with k = 0 in the middle (index N/2): that shift
  // multiplies every output by e^(iπ(x + z)) = ±1, a checkerboard sign
  float sgn = ((t.x + t.y) & 1) == 1 ? -1.0 : 1.0;
  vec4 a = texelFetch(uSrc0, t, 0) * sgn, b = texelFetch(uSrc1, t, 0) * sgn;
  // a = (h, Dx, Dz, hx), b = (hz, Dxx, Dzz, Dxz)
  Disp = vec4(uChop * a.y, a.x, uChop * a.z, uChop * b.w);
  Deriv = vec4(a.w, b.x, uChop * b.y, uChop * b.z);
}`;

// The foam texel at x₀ (in the largest tile) reads every cascade at x₀:
// folding is a property of the summed surface, not of one band. Each cascade
// is read at the mip whose texels match a foam texel, so folds smaller than
// that are averaged out instead of sprinkling foam everywhere.
const FOAM_FS = `#version 300 es
precision highp float;
uniform sampler2D uPrev, uDisp0, uDisp1, uDisp2, uDeriv0, uDeriv1, uDeriv2;
uniform vec3  uL, uOn;
uniform float uDecay;              // e^(−dt/τ)
uniform float uBias, uGain;        // foam where J < bias, reaching 1 at J = bias − 1/gain
out vec4 Foam;
void main() {
  vec2 x0 = gl_FragCoord.xy / ${FOAM_N.toFixed(1)} * uL.x;
  vec2 u0 = x0 / uL.x, u1 = x0 / uL.y, u2 = x0 / uL.z;
  vec3 lod = max(log2(uL.x / ${FOAM_N.toFixed(1)} * ${N.toFixed(1)} / uL), 0.0);
  vec4 d = textureLod(uDeriv0, u0, lod.x) * uOn.x + textureLod(uDeriv1, u1, lod.y) * uOn.y + textureLod(uDeriv2, u2, lod.z) * uOn.z;
  float dxz = textureLod(uDisp0, u0, lod.x).w * uOn.x + textureLod(uDisp1, u1, lod.y).w * uOn.y + textureLod(uDisp2, u2, lod.z).w * uOn.z;
  float J = (1.0 + d.z) * (1.0 + d.w) - dxz * dxz;
  float inject = clamp((uBias - J) * uGain, 0.0, 1.0);
  Foam = vec4(max(texelFetch(uPrev, ivec2(gl_FragCoord.xy), 0).r * uDecay, inject), J, 0.0, 1.0);
}`;

// ── Textures and framebuffers ─────────────────────────────────────────────────
function tex(gl: WebGL2RenderingContext, internal: number, mips: boolean, size = N) {
  const t = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texStorage2D(gl.TEXTURE_2D, mips ? Math.log2(size) + 1 : 1, internal, size, size);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mips ? gl.LINEAR_MIPMAP_LINEAR : gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, mips ? gl.LINEAR : gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);      // a tile repeats
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  return t;
}
function fbo(gl: WebGL2RenderingContext, ...targets: WebGLTexture[]) {
  const f = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, f);
  targets.forEach((t, i) => gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t, 0));
  gl.drawBuffers(targets.map((_, i) => gl.COLOR_ATTACHMENT0 + i));
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return f;
}

type Pair = { tex: [WebGLTexture, WebGLTexture]; fbo: WebGLFramebuffer };
export type CascadeTex = { h0: WebGLTexture; disp: WebGLTexture; deriv: WebGLTexture; out: WebGLFramebuffer };
export type Ocean = {
  progs: { evolve: WebGLProgram; fft: WebGLProgram; assemble: WebGLProgram; foam: WebGLProgram };
  vao: WebGLVertexArrayObject; ping: [Pair, Pair]; cascades: CascadeTex[];
  foam: [WebGLTexture, WebGLTexture]; foamFbo: [WebGLFramebuffer, WebGLFramebuffer]; foamCur: number;
};

/** Everything the simulation needs; throws when float render targets are missing. */
export function makeOcean(gl: WebGL2RenderingContext): Ocean {
  if (!floatTargets(gl)) throw new Error("This figure needs float render targets (EXT_color_buffer_float).");
  const pair = (): Pair => { const a = tex(gl, gl.RGBA32F, false), b = tex(gl, gl.RGBA32F, false); return { tex: [a, b], fbo: fbo(gl, a, b) }; };
  const cascades = CASCADES.map(() => {
    const disp = tex(gl, gl.RGBA16F, true), deriv = tex(gl, gl.RGBA16F, true);
    return { h0: tex(gl, gl.RGBA32F, false), disp, deriv, out: fbo(gl, disp, deriv) };
  });
  const foam: [WebGLTexture, WebGLTexture] = [tex(gl, gl.RGBA16F, true, FOAM_N), tex(gl, gl.RGBA16F, true, FOAM_N)];
  return {
    progs: {
      evolve: compileProgram(gl, FULL_VS, EVOLVE_FS), fft: compileProgram(gl, FULL_VS, FFT_FS),
      assemble: compileProgram(gl, FULL_VS, ASSEMBLE_FS), foam: compileProgram(gl, FULL_VS, FOAM_FS),
    },
    vao: gl.createVertexArray()!, ping: [pair(), pair()], cascades,
    foam, foamFbo: [fbo(gl, foam[0]), fbo(gl, foam[1])], foamCur: 0,
  };
}

/** The foam texture to shade with this frame. */
export const currentFoam = (o: Ocean) => o.foam[o.foamCur];

/** Uploads a cascade's initial spectrum (from initialSpectrum). */
export function uploadSpectrum(gl: WebGL2RenderingContext, o: Ocean, i: number, data: Float32Array) {
  gl.bindTexture(gl.TEXTURE_2D, o.cascades[i].h0);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, N, N, gl.RGBA, gl.FLOAT, data);
}

export type OceanStep = {
  time: number; dt: number; chop: number; on: boolean[];
  foamBias: number; foamGain: number; foamLife: number;
};

/** Runs the whole simulation for this frame. Leaves the default framebuffer bound. */
export function stepOcean(gl: WebGL2RenderingContext, o: Ocean, s: OceanStep) {
  const { evolve, fft, assemble, foam } = o.progs;
  const u = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
  const bind = (unit: number, t: WebGLTexture) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); };
  gl.disable(gl.DEPTH_TEST);
  gl.viewport(0, 0, N, N);
  gl.bindVertexArray(o.vao);

  o.cascades.forEach((c, ci) => {
    // 1. Evolve into ping[0]
    gl.bindFramebuffer(gl.FRAMEBUFFER, o.ping[0].fbo);
    gl.useProgram(evolve);
    bind(0, c.h0);
    gl.uniform1i(u(evolve, "uH0"), 0);
    gl.uniform1f(u(evolve, "uL"), CASCADES[ci].L);
    gl.uniform1f(u(evolve, "uTime"), s.time);
    drawFullscreen(gl, o.vao);

    // 2. FFT: rows, then columns; 2·log2 N passes end back in ping[0]
    gl.useProgram(fft);
    gl.uniform1i(u(fft, "uSrc0"), 0);
    gl.uniform1i(u(fft, "uSrc1"), 1);
    let src = 0;
    for (const horizontal of [1, 0]) {
      gl.uniform1i(u(fft, "uHorizontal"), horizontal);
      for (let stage = 0; stage < LOG_N; stage++) {
        const from = o.ping[src], to = o.ping[1 - src];
        gl.bindFramebuffer(gl.FRAMEBUFFER, to.fbo);
        bind(0, from.tex[0]); bind(1, from.tex[1]);
        gl.uniform1f(u(fft, "uSize"), 2 ** (stage + 1));
        drawFullscreen(gl, o.vao);
        src = 1 - src;
      }
    }

    // 3. Assemble into the cascade's displacement and derivative textures
    gl.bindFramebuffer(gl.FRAMEBUFFER, c.out);
    gl.useProgram(assemble);
    bind(0, o.ping[src].tex[0]); bind(1, o.ping[src].tex[1]);
    gl.uniform1i(u(assemble, "uSrc0"), 0);
    gl.uniform1i(u(assemble, "uSrc1"), 1);
    gl.uniform1f(u(assemble, "uChop"), s.chop);
    drawFullscreen(gl, o.vao);

    // Mips, so distant water samples an average instead of aliasing
    for (const t of [c.disp, c.deriv]) { gl.bindTexture(gl.TEXTURE_2D, t); gl.generateMipmap(gl.TEXTURE_2D); }
  });

  // 4. Foam: previous foam, decayed, or fresh foam where the summed surface folds
  const next = 1 - o.foamCur;
  gl.bindFramebuffer(gl.FRAMEBUFFER, o.foamFbo[next]);
  gl.viewport(0, 0, FOAM_N, FOAM_N);
  gl.useProgram(foam);
  bind(0, o.foam[o.foamCur]);
  gl.uniform1i(u(foam, "uPrev"), 0);
  o.cascades.forEach((c, i) => {
    bind(1 + i, c.disp); gl.uniform1i(u(foam, `uDisp${i}`), 1 + i);
    bind(4 + i, c.deriv); gl.uniform1i(u(foam, `uDeriv${i}`), 4 + i);
  });
  gl.uniform3fv(u(foam, "uL"), CASCADES.map(c => c.L));
  gl.uniform3fv(u(foam, "uOn"), s.on.map(Number));
  gl.uniform1f(u(foam, "uDecay"), Math.exp(-s.dt / Math.max(s.foamLife, 0.05)));
  gl.uniform1f(u(foam, "uBias"), s.foamBias);
  gl.uniform1f(u(foam, "uGain"), s.foamGain);
  drawFullscreen(gl, o.vao);
  o.foamCur = next;
  gl.bindTexture(gl.TEXTURE_2D, o.foam[next]);
  gl.generateMipmap(gl.TEXTURE_2D);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.activeTexture(gl.TEXTURE0);
}
