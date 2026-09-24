// ── Render-to-texture and richer meshes for the advanced figures ──────────────
// Framebuffers (depth, colour, float, multiple targets, cube depth), a
// fullscreen pass, and meshes carrying UVs and tangents for normal mapping.

import { mat4, type Mat4, type Vec3 } from "./gl";

// ── Matrices GLM has and gl.ts did not need yet ───────────────────────────────
/** glm::ortho(left, right, bottom, top, near, far) */
export function ortho(l: number, r: number, b: number, t: number, n: number, f: number): Mat4 {
  const m = mat4.identity();
  m[0] = 2 / (r - l); m[5] = 2 / (t - b); m[10] = -2 / (f - n);
  m[12] = -(r + l) / (r - l); m[13] = -(t + b) / (t - b); m[14] = -(f + n) / (f - n);
  return m;
}

/** Model matrix: translate · (optional Y rotation) · non-uniform scale. */
export function trs(p: Vec3, s: Vec3 | number = 1, rotY = 0): Mat4 {
  const [sx, sy, sz] = typeof s === "number" ? [s, s, s] : s;
  const c = Math.cos(rotY), n = Math.sin(rotY);
  const m = mat4.identity();
  m[0] = c * sx; m[2] = -n * sx;
  m[5] = sy;
  m[8] = n * sz; m[10] = c * sz;
  m[12] = p[0]; m[13] = p[1]; m[14] = p[2];
  return m;
}

// ── Capabilities ──────────────────────────────────────────────────────────────
/** Float colour targets (HDR, G-buffers) need this extension in WebGL2. */
export const floatTargets = (gl: WebGL2RenderingContext) => !!gl.getExtension("EXT_color_buffer_float");

// ── Fullscreen pass ───────────────────────────────────────────────────────────
export const FULL_VS = `#version 300 es
out vec2 vUV;
void main() {
  // One oversized triangle; no vertex buffer needed
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUV = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

/** Draws the fullscreen triangle (bind any VAO — attributes are not used). */
export function drawFullscreen(gl: WebGL2RenderingContext, vao: WebGLVertexArrayObject) {
  gl.bindVertexArray(vao);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// ── Framebuffers ──────────────────────────────────────────────────────────────
function tex2D(gl: WebGL2RenderingContext, w: number, h: number, internal: number, format: number, type: number, filter: number) {
  const t = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return t;
}

export type DepthTarget = { fbo: WebGLFramebuffer; tex: WebGLTexture; size: number };

/** A depth-only framebuffer, like the chapter's shadow map. */
export function makeDepthTarget(gl: WebGL2RenderingContext, size: number): DepthTarget {
  const tex = tex2D(gl, size, size, gl.DEPTH_COMPONENT24, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, gl.NEAREST);
  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, tex, 0);
  gl.drawBuffers([gl.NONE]);
  gl.readBuffer(gl.NONE);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { fbo, tex, size };
}

export type ColorTarget = { fbo: WebGLFramebuffer; tex: WebGLTexture[]; w: number; h: number; float: boolean };

/**
 * A framebuffer with `count` colour textures (RGBA16F when `float` and the
 * extension allows it, RGBA8 otherwise) and, optionally, a depth buffer.
 */
export function makeColorTarget(gl: WebGL2RenderingContext, w: number, h: number,
  { float = false, count = 1, depth = true, linear = true } = {}): ColorTarget {
  const useFloat = float && floatTargets(gl);
  const internal = useFloat ? gl.RGBA16F : gl.RGBA8;
  const type = useFloat ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE;
  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  const tex: WebGLTexture[] = [];
  const bufs: number[] = [];
  for (let i = 0; i < count; i++) {
    const t = tex2D(gl, w, h, internal, gl.RGBA, type, linear ? gl.LINEAR : gl.NEAREST);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t, 0);
    tex.push(t); bufs.push(gl.COLOR_ATTACHMENT0 + i);
  }
  gl.drawBuffers(bufs);
  if (depth) {
    const rb = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { fbo, tex, w, h, float: useFloat };
}

export function deleteColorTarget(gl: WebGL2RenderingContext, t: ColorTarget | null) {
  if (!t) return;
  t.tex.forEach(x => gl.deleteTexture(x));
  gl.deleteFramebuffer(t.fbo);
}

/** Keeps a colour target sized to the canvas, recreating it on resize. */
export function ensureColorTarget(gl: WebGL2RenderingContext, cur: ColorTarget | null, w: number, h: number,
  opts: Parameters<typeof makeColorTarget>[3] = {}): ColorTarget {
  if (cur && cur.w === w && cur.h === h) return cur;
  deleteColorTarget(gl, cur);
  return makeColorTarget(gl, w, h, opts);
}

export type DepthCube = { fbo: WebGLFramebuffer; tex: WebGLTexture; size: number };

/** A depth cube map; faces are attached one at a time while rendering. */
export function makeDepthCube(gl: WebGL2RenderingContext, size: number): DepthCube {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);
  for (let i = 0; i < 6; i++) {
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.DEPTH_COMPONENT24, size, size, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
  }
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.drawBuffers([gl.NONE]);
  gl.readBuffer(gl.NONE);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { fbo, tex, size };
}

/** View matrices for the six cube faces, in GL_TEXTURE_CUBE_MAP_POSITIVE_X… order. */
export function cubeFaceViews(p: Vec3): Mat4[] {
  const dirs: Vec3[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const ups: Vec3[] = [[0, -1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1], [0, -1, 0], [0, -1, 0]];
  return dirs.map((d, i) => mat4.lookAt(p, [p[0] + d[0], p[1] + d[1], p[2] + d[2]], ups[i]));
}

// ── Meshes with position, normal, uv and tangent (11 floats) ─────────────────
export type Mesh = { vao: WebGLVertexArrayObject; count: number };

/** Uploads interleaved pos(3) normal(3) uv(2) tangent(3) at locations 0..3. */
export function uploadMesh(gl: WebGL2RenderingContext, data: Float32Array): Mesh {
  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  const S = 44;
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, S, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, S, 12);
  gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, S, 24);
  gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 3, gl.FLOAT, false, S, 32);
  return { vao, count: data.length / 11 };
}

/** Unit cube (±0.5) with per-face UVs and tangents. */
export function cubePNUT(uvScale = 1): Float32Array {
  const faces: [Vec3, Vec3, Vec3][] = [
    [[1, 0, 0], [0, 0, -1], [0, 1, 0]], [[-1, 0, 0], [0, 0, 1], [0, 1, 0]],
    [[0, 1, 0], [1, 0, 0], [0, 0, -1]], [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
    [[0, 0, 1], [1, 0, 0], [0, 1, 0]], [[0, 0, -1], [-1, 0, 0], [0, 1, 0]],
  ];
  const out: number[] = [];
  for (const [n, u, v] of faces) {
    const c = (a: number, b: number) => [
      (n[0] + u[0] * a + v[0] * b) * 0.5, (n[1] + u[1] * a + v[1] * b) * 0.5, (n[2] + u[2] * a + v[2] * b) * 0.5,
      ...n, ((a + 1) / 2) * uvScale, ((b + 1) / 2) * uvScale, ...u,
    ];
    out.push(...c(-1, -1), ...c(1, -1), ...c(1, 1), ...c(-1, -1), ...c(1, 1), ...c(-1, 1));
  }
  return new Float32Array(out);
}

/** A square in the XZ plane (±0.5), facing +Y, UVs repeated `uvScale` times. */
export function planePNUT(uvScale = 1): Float32Array {
  const c = (x: number, z: number) => [x, 0, z, 0, 1, 0, (x + 0.5) * uvScale, (0.5 - z) * uvScale, 1, 0, 0];
  return new Float32Array([...c(-0.5, 0.5), ...c(0.5, 0.5), ...c(0.5, -0.5), ...c(-0.5, 0.5), ...c(0.5, -0.5), ...c(-0.5, -0.5)]);
}

/** A square in the XY plane (±0.5), facing +Z — a wall. */
export function wallPNUT(uvScale = 1): Float32Array {
  const c = (x: number, y: number) => [x, y, 0, 0, 0, 1, (x + 0.5) * uvScale, (y + 0.5) * uvScale, 1, 0, 0];
  return new Float32Array([...c(-0.5, -0.5), ...c(0.5, -0.5), ...c(0.5, 0.5), ...c(-0.5, -0.5), ...c(0.5, 0.5), ...c(-0.5, 0.5)]);
}

/** UV sphere (radius 0.5) with UVs and tangents along +longitude. */
export function spherePNUT(rings = 32, segments = 48): Float32Array {
  const out: number[] = [];
  const v = (i: number, j: number) => {
    const th = (i / rings) * Math.PI, ph = (j / segments) * Math.PI * 2;
    const x = Math.sin(th) * Math.cos(ph), y = Math.cos(th), z = Math.sin(th) * Math.sin(ph);
    return [x * 0.5, y * 0.5, z * 0.5, x, y, z, j / segments, i / rings, -Math.sin(ph), 0, Math.cos(ph)];
  };
  for (let i = 0; i < rings; i++) for (let j = 0; j < segments; j++) {
    const a = v(i, j), b = v(i + 1, j), c = v(i + 1, j + 1), d = v(i, j + 1);
    out.push(...a, ...c, ...b, ...a, ...d, ...c);
  }
  return new Float32Array(out);
}

// ── A shared test scene for the lighting chapters ─────────────────────────────
export type SceneItem = { mesh: "cube" | "sphere" | "plane"; model: Mat4; color: Vec3 };

export const SHADOW_SCENE: SceneItem[] = [
  { mesh: "plane", model: trs([0, 0, 0], [16, 1, 16]), color: [0.62, 0.64, 0.68] },
  { mesh: "cube", model: trs([-1.6, 0.5, -0.6], 1, 0.5), color: [0.96, 0.6, 0.11] },
  { mesh: "cube", model: trs([1.4, 0.9, -1.4], [0.9, 1.8, 0.9], -0.3), color: [0.55, 0.25, 0.9] },
  { mesh: "cube", model: trs([1.9, 0.3, 1.5], 0.6, 0.9), color: [0.18, 0.75, 0.38] },
  { mesh: "sphere", model: trs([-0.2, 0.7, 1.2], 1.4), color: [0.88, 0.88, 0.9] },
];
