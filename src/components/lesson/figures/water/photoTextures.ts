// ── Photo textures for the ray-traced water scenes ────────────────────────────
// The Water and Shore labs shade surfaces found by tracing rays (also bent by
// refraction), so they sample textures by hand: planar mapping from above,
// the mip level picked from the ray length, sRGB decoded to linear.
// Materials come from the asset manifest; a missing one keeps the scene's
// procedural look, which the shader selects through a "have" flag per group.

import { pickTexture, loadOption } from "../../glsl/textures";

/** GLSL helpers; the shader must declare `uniform float uPix` (world size of one pixel at distance 1). */
export const PHOTO_GLSL = `
// Mip level for a texture tiled every tile metres, seen dist metres away on a
// surface with normal n: texels per pixel, in powers of two. −0.5 keeps it a
// little sharper, since one isotropic level blurs ground seen at an angle.
float lodFor(float dist, float tile, vec3 n) { return log2(max(dist * uPix * 1024.0 / (tile * max(n.y, 0.3)), 1.0)) - 0.5; }
vec3 srgbTex(sampler2D s, vec2 uv, float lod) { return pow(textureLod(s, uv, lod).rgb, vec3(2.2)); }
// uv = (x, −z) / tile: +u runs along +x, +v along −z. Tangent-space normal map
// → world with T = +x and B = n × T (= −z on flat ground), both kept perpendicular to n.
vec2 planarUV(vec3 p, float tile) { return vec2(p.x, -p.z) / tile; }
vec3 bumped(vec3 n, sampler2D s, vec2 uv, float lod) {
  vec3 tn = textureLod(s, uv, lod).xyz * 2.0 - 1.0;
  vec3 T = normalize(vec3(1.0, 0.0, 0.0) - n * n.x);
  return normalize(tn.x * T + tn.y * cross(n, T) + tn.z * n);
}
`;

/** [sampler uniform, texture id] pairs, in texture-unit order. */
export type PhotoList = readonly (readonly [string, string])[];

/** Starts loading every texture that exists; onLoad fires as each arrives. */
export function loadPhotos(gl: WebGL2RenderingContext, list: PhotoList, onLoad: () => void): (WebGLTexture | null)[] {
  const tex: (WebGLTexture | null)[] = list.map(() => null);
  list.forEach(([, id], i) => {
    if (pickTexture(id) !== id) return;
    loadOption(gl, id).then(t => { tex[i] = t; onLoad(); }).catch(() => {});
  });
  return tex;
}

/** Binds the list to units 0…n−1 and sets the "have" flags: 1 where a whole group loaded. */
export function bindPhotos(gl: WebGL2RenderingContext, prog: WebGLProgram, list: PhotoList, tex: (WebGLTexture | null)[],
  have: string, groups: number[][]) {
  list.forEach(([name], i) => {
    gl.activeTexture(gl.TEXTURE0 + i);
    gl.bindTexture(gl.TEXTURE_2D, tex[i]);
    gl.uniform1i(gl.getUniformLocation(prog, name), i);
  });
  gl.activeTexture(gl.TEXTURE0);
  const flags = groups.map(g => (g.every(i => tex[i]) ? 1 : 0));
  const loc = gl.getUniformLocation(prog, have);
  if (flags.length === 2) gl.uniform2fv(loc, flags); else gl.uniform3fv(loc, flags);
}
