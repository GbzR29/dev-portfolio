// ── Sky probe: the procedural sky, rendered once per frame into a texture ─────
// Water shading looks at the sky three times per pixel (the reflection, the
// ambient light from above, the haze at the horizon), and the procedural sky
// with its clouds is several noise evaluations each time. Engines render the
// environment into a texture (a reflection probe) and sample that instead.
// This one covers the upper hemisphere: u = azimuth, v = √(d.y), so the
// horizon, where grazing reflections look, gets most of the rows. Mipmaps
// give the blurred versions (the ambient light is a high mip).

import { PROC_SKY_GLSL } from "../sky/proceduralSky";
import { floatTargets } from "../../kit/gl/glx";

export const PROBE_W = 512, PROBE_H = 128;

/** GLSL for the shaders that sample the probe. */
export const SKY_ENV_GLSL = `
uniform sampler2D uSkyEnv;
uniform float uSkyEnc;             // 1: stored as c / (1 + c) in 8 bits (no float targets)
vec3 skyEnv(vec3 d, float lod) {
  d = normalize(d);
  vec2 uv = vec2(atan(d.z, d.x) / 6.2831853 + 0.5, sqrt(clamp(d.y, 0.0, 1.0)));
  vec3 c = textureLod(uSkyEnv, uv, lod).rgb;
  return uSkyEnc > 0.5 ? c / max(1.0 - c, 1e-3) : c;
}
`;

export const PROBE_FS = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 FragColor;
uniform float uSkyEnc;
${PROC_SKY_GLSL}
void main() {
  float y = vUV.y * vUV.y, phi = (vUV.x - 0.5) * 6.2831853, r = sqrt(max(1.0 - y * y, 0.0));
  vec3 c = sky(vec3(cos(phi) * r, y, sin(phi) * r));
  FragColor = vec4(uSkyEnc > 0.5 ? c / (1.0 + c) : c, 1.0);
}`;

export type SkyProbe = { fbo: WebGLFramebuffer; tex: WebGLTexture; enc: number };

export function makeSkyProbe(gl: WebGL2RenderingContext): SkyProbe {
  const float = floatTargets(gl);
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  const levels = Math.floor(Math.log2(Math.max(PROBE_W, PROBE_H))) + 1;
  gl.texStorage2D(gl.TEXTURE_2D, levels, float ? gl.RGBA16F : gl.RGBA8, PROBE_W, PROBE_H);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);         // azimuth wraps around
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { fbo, tex, enc: float ? 0 : 1 };
}

/**
 * Renders the sky into the probe with `prog` (compiled from FULL_VS + PROBE_FS,
 * its sky uniforms already set), then rebuilds the mipmaps. `draw` issues the
 * fullscreen triangle. Leaves the default framebuffer bound.
 */
export function renderSkyProbe(gl: WebGL2RenderingContext, probe: SkyProbe, prog: WebGLProgram, draw: () => void) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, probe.fbo);
  gl.viewport(0, 0, PROBE_W, PROBE_H);
  gl.disable(gl.DEPTH_TEST);
  gl.useProgram(prog);
  gl.uniform1f(gl.getUniformLocation(prog, "uSkyEnc"), probe.enc);
  draw();
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, probe.tex);
  gl.generateMipmap(gl.TEXTURE_2D);
}

/** Binds the probe for a shader that includes SKY_ENV_GLSL. */
export function bindSkyProbe(gl: WebGL2RenderingContext, prog: WebGLProgram, probe: SkyProbe, unit: number) {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, probe.tex);
  gl.uniform1i(gl.getUniformLocation(prog, "uSkyEnv"), unit);
  gl.uniform1f(gl.getUniformLocation(prog, "uSkyEnc"), probe.enc);
  gl.activeTexture(gl.TEXTURE0);
}
