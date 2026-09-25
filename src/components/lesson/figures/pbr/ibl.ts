// ── PBR and image-based lighting on the GPU ───────────────────────────────────
// The same precomputation the chapters describe, done live in WebGL2:
//   environment cube (HDR) → irradiance cube (diffuse) → prefiltered cube with
//   one roughness per mip level (specular) + the split-sum BRDF lookup table.

import { compileProgram, makeCubemap, type Vec3 } from "../gl";
import { FULL_VS, drawFullscreen, floatTargets } from "../glx";
import type { SkyImages } from "../GLView";

// ── Shared GLSL ───────────────────────────────────────────────────────────────
/** The OpenGL cube-map face table (same as gl.ts faceDir): texel (s, t) → direction. */
export const FACE_DIR_GLSL = `
vec3 faceDir(int face, vec2 st) {
  vec2 c = st * 2.0 - 1.0;          // sc, tc
  if (face == 0) return vec3( 1.0, -c.y, -c.x);
  if (face == 1) return vec3(-1.0, -c.y,  c.x);
  if (face == 2) return vec3( c.x,  1.0,  c.y);
  if (face == 3) return vec3( c.x, -1.0, -c.y);
  if (face == 4) return vec3( c.x, -c.y,  1.0);
  return vec3(-c.x, -c.y, -1.0);
}`;

/** Cook-Torrance building blocks, exactly as the PBR chapter writes them. */
export const PBR_GLSL = `
const float PI = 3.14159265359;
float D_GGX(float NdotH, float a) {              // a = roughness²
  float a2 = a * a;
  float d = NdotH * NdotH * (a2 - 1.0) + 1.0;
  return a2 / (PI * d * d);
}
float G_SchlickGGX(float NdotX, float k) { return NdotX / (NdotX * (1.0 - k) + k); }
float G_Smith(float NdotV, float NdotL, float k) { return G_SchlickGGX(NdotV, k) * G_SchlickGGX(NdotL, k); }
vec3 F_Schlick(float cosT, vec3 F0) { return F0 + (1.0 - F0) * pow(clamp(1.0 - cosT, 0.0, 1.0), 5.0); }
vec3 F_SchlickRoughness(float cosT, vec3 F0, float r) {
  return F0 + (max(vec3(1.0 - r), F0) - F0) * pow(clamp(1.0 - cosT, 0.0, 1.0), 5.0);
}
// Low-discrepancy sequence for importance sampling (radical inverse, no bitfieldReverse in ES 3.0)
float radicalInverse(uint b) {
  b = (b << 16u) | (b >> 16u);
  b = ((b & 0x55555555u) << 1u) | ((b & 0xAAAAAAAAu) >> 1u);
  b = ((b & 0x33333333u) << 2u) | ((b & 0xCCCCCCCCu) >> 2u);
  b = ((b & 0x0F0F0F0Fu) << 4u) | ((b & 0xF0F0F0F0u) >> 4u);
  b = ((b & 0x00FF00FFu) << 8u) | ((b & 0xFF00FF00u) >> 8u);
  return float(b) * 2.3283064365386963e-10;
}
vec2 hammersley(uint i, uint N) { return vec2(float(i) / float(N), radicalInverse(i)); }
vec3 importanceSampleGGX(vec2 Xi, vec3 N, float roughness) {
  float a = roughness * roughness;
  float phi = 2.0 * PI * Xi.x;
  float cosTheta = sqrt((1.0 - Xi.y) / (1.0 + (a * a - 1.0) * Xi.y));
  float sinTheta = sqrt(1.0 - cosTheta * cosTheta);
  vec3 H = vec3(cos(phi) * sinTheta, sin(phi) * sinTheta, cosTheta);
  vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
  vec3 T = normalize(cross(up, N));
  vec3 B = cross(N, T);
  return normalize(T * H.x + B * H.y + N * H.z);
}`;

/** An HDR procedural sky: the same look as the Cubemaps chapter, but the sun is ~40× brighter than 1.0. */
const SKY_GLSL = `
uniform vec3 uSun;
vec3 sky(vec3 d) {
  d = normalize(d);
  vec3 zenith = vec3(0.16, 0.36, 0.75), horizon = vec3(0.75, 0.84, 0.95);
  vec3 c;
  if (d.y >= 0.0) {
    c = mix(horizon, zenith, pow(d.y, 0.45));
    float s = max(dot(d, uSun), 0.0);
    c += vec3(1.0, 0.85, 0.6) * (pow(s, 900.0) * 40.0 + pow(s, 32.0) * 0.8 + pow(s, 4.0) * 0.15);
  } else {
    vec2 g = d.xz / -d.y;
    vec2 w = abs(fract(g) - 0.5);
    float line = (1.0 - smoothstep(0.46, 0.49, max(w.x, w.y))) * min(1.0, -d.y * 3.0);
    vec3 ground = mix(vec3(0.16, 0.2, 0.17), vec3(0.3, 0.36, 0.32), 1.0 - line);
    c = mix(ground, horizon, pow(1.0 - min(1.0, -d.y * 4.0), 3.0));
  }
  return c;
}`;

// ── Programs ──────────────────────────────────────────────────────────────────
const CAPTURE_FS = (fromImage: boolean) => `#version 300 es
precision highp float;
in vec2 vUV;
uniform int uFace;
${fromImage ? "uniform samplerCube uSrc;" : ""}
out vec4 FragColor;
${FACE_DIR_GLSL}
${SKY_GLSL}
void main() {
  vec3 d = faceDir(uFace, vUV);
  ${fromImage
    ? `// sRGB image → linear. An 8-bit sky clips the sun to 1.0, so boost the
    // near-white pixels: a crude inverse tone map that gives the sun back
    // some of the energy it lost (a real HDR file needs none of this).
    vec3 c = pow(texture(uSrc, d).rgb, vec3(2.2));
    float m = max(c.r, max(c.g, c.b));
    FragColor = vec4(c * (1.0 + 12.0 * pow(smoothstep(0.9, 1.0, m), 2.0)), 1.0);`
    : "FragColor = vec4(sky(d), 1.0);"}
}`;

const IRRADIANCE_FS = `#version 300 es
precision highp float;
in vec2 vUV;
uniform int uFace;
uniform samplerCube uEnv;
uniform float uDelta;
out vec4 FragColor;
${FACE_DIR_GLSL}
const float PI = 3.14159265359;
void main() {
  vec3 N = normalize(faceDir(uFace, vUV));
  vec3 up = abs(N.y) < 0.999 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 right = normalize(cross(up, N));
  up = cross(N, right);
  vec3 sum = vec3(0.0);
  float n = 0.0;
  // Riemann sum over the hemisphere: E(n) = ∫ L(ω) cosθ sinθ dθ dφ
  for (float phi = 0.0; phi < 2.0 * PI; phi += uDelta) {
    for (float theta = 0.0; theta < 0.5 * PI; theta += uDelta) {
      vec3 t = vec3(sin(theta) * cos(phi), sin(theta) * sin(phi), cos(theta));
      vec3 dir = t.x * right + t.y * up + t.z * N;
      sum += textureLod(uEnv, dir, 3.0).rgb * cos(theta) * sin(theta);
      n += 1.0;
    }
  }
  FragColor = vec4(PI * sum / n, 1.0);
}`;

const PREFILTER_FS = `#version 300 es
precision highp float;
in vec2 vUV;
uniform int uFace;
uniform samplerCube uEnv;
uniform float uRoughness, uEnvSize;
out vec4 FragColor;
${FACE_DIR_GLSL}
${PBR_GLSL}
void main() {
  vec3 N = normalize(faceDir(uFace, vUV));
  vec3 V = N;                                           // the split-sum assumption: v = n = r
  const uint COUNT = 512u;
  vec3 sum = vec3(0.0);
  float w = 0.0;
  for (uint i = 0u; i < COUNT; i++) {
    vec3 H = importanceSampleGGX(hammersley(i, COUNT), N, uRoughness);
    vec3 L = normalize(2.0 * dot(V, H) * H - V);
    float NdotL = max(dot(N, L), 0.0);
    if (NdotL > 0.0) {
      // Sample a blurrier mip where the GGX density is low (fewer samples cover more solid angle)
      float NdotH = max(dot(N, H), 0.0), HdotV = max(dot(H, V), 0.0);
      float a = uRoughness * uRoughness;
      float pdf = D_GGX(NdotH, a) * NdotH / (4.0 * HdotV) + 0.0001;
      float saTexel = 4.0 * PI / (6.0 * uEnvSize * uEnvSize);
      float saSample = 1.0 / (float(COUNT) * pdf + 0.0001);
      float lod = uRoughness == 0.0 ? 0.0 : 0.5 * log2(saSample / saTexel);
      sum += textureLod(uEnv, L, lod).rgb * NdotL;
      w += NdotL;
    }
  }
  FragColor = vec4(sum / w, 1.0);
}`;

const BRDF_LUT_FS = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 FragColor;
${PBR_GLSL}
// x axis: n·v, y axis: roughness. Output: scale (r) and bias (g) applied to F0.
void main() {
  float NdotV = max(vUV.x, 0.001), roughness = vUV.y;
  vec3 V = vec3(sqrt(1.0 - NdotV * NdotV), 0.0, NdotV);
  vec3 N = vec3(0.0, 0.0, 1.0);
  float A = 0.0, B = 0.0;
  const uint COUNT = 256u;
  float k = (roughness * roughness) / 2.0;             // IBL remapping of k
  for (uint i = 0u; i < COUNT; i++) {
    vec3 H = importanceSampleGGX(hammersley(i, COUNT), N, roughness);
    vec3 L = normalize(2.0 * dot(V, H) * H - V);
    float NdotL = max(L.z, 0.0), NdotH = max(H.z, 0.0), VdotH = max(dot(V, H), 0.0);
    if (NdotL > 0.0) {
      float G = G_Smith(NdotV, NdotL, k);
      float Gvis = (G * VdotH) / (NdotH * NdotV);
      float Fc = pow(1.0 - VdotH, 5.0);
      A += (1.0 - Fc) * Gvis;
      B += Fc * Gvis;
    }
  }
  FragColor = vec4(A / float(COUNT), B / float(COUNT), 0.0, 1.0);
}`;

// ── Targets ───────────────────────────────────────────────────────────────────
export type IBL = {
  env: WebGLTexture; irradiance: WebGLTexture; prefilter: WebGLTexture; lut: WebGLTexture;
  envSize: number; prefilterLevels: number; float: boolean;
};

function cubeTexture(gl: WebGL2RenderingContext, size: number, float: boolean, mips: boolean) {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);
  const levels = mips ? Math.floor(Math.log2(size)) + 1 : 1;
  gl.texStorage2D(gl.TEXTURE_CUBE_MAP, levels, float ? gl.RGBA16F : gl.RGBA8, size, size);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, mips ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  for (const p of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T, gl.TEXTURE_WRAP_R]) gl.texParameteri(gl.TEXTURE_CUBE_MAP, p, gl.CLAMP_TO_EDGE);
  return tex;
}

/** Runs a fullscreen program once per face into `tex` at mip `level`. */
function renderCube(gl: WebGL2RenderingContext, fbo: WebGLFramebuffer, vao: WebGLVertexArrayObject,
  prog: WebGLProgram, tex: WebGLTexture, size: number, level: number, setup?: () => void) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  const s = Math.max(1, size >> level);
  gl.viewport(0, 0, s, s);
  gl.useProgram(prog);
  setup?.();
  for (let f = 0; f < 6; f++) {
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + f, tex, level);
    gl.uniform1i(gl.getUniformLocation(prog, "uFace"), f);
    drawFullscreen(gl, vao);
  }
}

/** Frees every texture an IBL owns. */
export function disposeIBL(gl: WebGL2RenderingContext, ibl: IBL) {
  [ibl.env, ibl.irradiance, ibl.prefilter, ibl.lut].forEach(t => gl.deleteTexture(t));
}

/**
 * Builds everything image-based lighting needs, from `opts.sky` (a loaded
 * skybox, LDR) or, without one, from the analytic HDR sky.
 */
export async function buildIBL(gl: WebGL2RenderingContext, opts: { sun: Vec3; sky?: SkyImages | null; irradianceDelta?: number }): Promise<IBL> {
  const float = floatTargets(gl);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);
  const vao = gl.createVertexArray()!;
  const fbo = gl.createFramebuffer()!;
  const ENV = 256, IRR = 32, PRE = 128, LEVELS = 5, LUT = 256;

  // 1. Environment
  const env = cubeTexture(gl, ENV, float, true);
  if (opts.sky) {
    const src = makeCubemap(gl, opts.sky.faces);
    const prog = compileProgram(gl, FULL_VS, CAPTURE_FS(true));
    renderCube(gl, fbo, vao, prog, env, ENV, 0, () => {
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_CUBE_MAP, src);
      gl.uniform1i(gl.getUniformLocation(prog, "uSrc"), 0);
    });
    gl.deleteTexture(src);
  } else {
    const prog = compileProgram(gl, FULL_VS, CAPTURE_FS(false));
    renderCube(gl, fbo, vao, prog, env, ENV, 0, () => gl.uniform3fv(gl.getUniformLocation(prog, "uSun"), opts.sun));
  }
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, env);
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

  // 2. Irradiance (diffuse)
  const irradiance = cubeTexture(gl, IRR, float, false);
  const irrProg = compileProgram(gl, FULL_VS, IRRADIANCE_FS);
  renderCube(gl, fbo, vao, irrProg, irradiance, IRR, 0, () => {
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_CUBE_MAP, env);
    gl.uniform1i(gl.getUniformLocation(irrProg, "uEnv"), 0);
    gl.uniform1f(gl.getUniformLocation(irrProg, "uDelta"), opts.irradianceDelta ?? 0.05);
  });

  // 3. Prefiltered specular, one roughness per mip
  const prefilter = cubeTexture(gl, PRE, float, true);
  const preProg = compileProgram(gl, FULL_VS, PREFILTER_FS);
  for (let level = 0; level < LEVELS; level++) {
    renderCube(gl, fbo, vao, preProg, prefilter, PRE, level, () => {
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_CUBE_MAP, env);
      gl.uniform1i(gl.getUniformLocation(preProg, "uEnv"), 0);
      gl.uniform1f(gl.getUniformLocation(preProg, "uRoughness"), level / (LEVELS - 1));
      gl.uniform1f(gl.getUniformLocation(preProg, "uEnvSize"), ENV);
    });
  }
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, prefilter);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAX_LEVEL, LEVELS - 1);

  // 4. BRDF lookup table
  const lut = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, lut);
  gl.texStorage2D(gl.TEXTURE_2D, 1, float ? gl.RGBA16F : gl.RGBA8, LUT, LUT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const lutProg = compileProgram(gl, FULL_VS, BRDF_LUT_FS);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, lut, 0);
  gl.viewport(0, 0, LUT, LUT);
  gl.useProgram(lutProg);
  drawFullscreen(gl, vao);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.deleteFramebuffer(fbo);
  gl.enable(gl.DEPTH_TEST);
  return { env, irradiance, prefilter, lut, envSize: ENV, prefilterLevels: LEVELS, float };
}

/** A skybox pass that shows any cube map (optionally at a fixed mip, e.g. a prefilter level). */
export const SKY_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
uniform mat4 uView, uProjection;
out vec3 vDir;
void main() { vDir = aPos; vec4 p = uProjection * uView * vec4(aPos, 1.0); gl_Position = p.xyww; }`;
export const SKY_FS = `#version 300 es
precision highp float;
in vec3 vDir;
uniform samplerCube uCube;
uniform float uLod, uExposure;
out vec4 FragColor;
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
void main() {
  vec3 c = textureLod(uCube, vDir, uLod).rgb * uExposure;
  FragColor = vec4(pow(aces(c), vec3(1.0 / 2.2)), 1.0);
}`;
