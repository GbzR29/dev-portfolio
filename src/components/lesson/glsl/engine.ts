// ── The shader playground's engine ───────────────────────────────────────────
// Wraps the reader's GLSL in a fixed prelude (version, precision, built-in
// uniforms), compiles it, and maps driver error lines back to the reader's
// own line numbers. Also parses control annotations on uniforms:
//
//   uniform float uEdge;   // @slider 0 1 0.25        min max default [step]
//   uniform vec3  uTint;   // @color 1 0.5 0          default colour (0..1)
//   uniform float uGlow;   // @toggle 1               checkbox → 0.0 / 1.0
//
// Two modes: "2d" runs one fragment shader over the whole canvas; "mesh"
// renders a mesh with an editable vertex and fragment shader.

import { cubePNUT, spherePNUT, uploadMesh, type Mesh } from "../kit/gl/glx";

export type Mode = "2d" | "mesh";
export type MeshKind = "sphere" | "torus" | "cube" | "plane";

const COMMON = `uniform vec2  uResolution;   // canvas size in pixels
uniform float uTime;         // seconds (pausable)
uniform float uDelta;        // seconds since the last frame
uniform int   uFrame;
uniform vec4  uMouse;        // xy: pointer (px), zw: press position (px), negative when released
uniform sampler2D uTex0, uTex1, uTex2, uTex3;
`;

export const PRELUDE_2D = `#version 300 es
precision highp float;
precision highp int;
${COMMON}out vec4 FragColor;
`;

export const PRELUDE_MESH_VS = `#version 300 es
precision highp float;
precision highp int;
${COMMON}uniform mat4 uModel, uView, uProjection;
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aUV;
layout(location = 3) in vec3 aTangent;
out vec3 vWorld; out vec3 vNormal; out vec2 vUV; out vec3 vTangent;
`;

export const PRELUDE_MESH_FS = `#version 300 es
precision highp float;
precision highp int;
${COMMON}uniform vec3 uCamPos;       // camera position, world space
uniform vec3 uLightDir;      // unit vector toward the light
in vec3 vWorld; in vec3 vNormal; in vec2 vUV; in vec3 vTangent;
out vec4 FragColor;
`;

export const DEFAULT_VERTEX = `void main() {
    vec3 p = aPos;
    vec3 n = aNormal;

    vec4 world = uModel * vec4(p, 1.0);
    vWorld   = world.xyz;
    vNormal  = mat3(uModel) * n;
    vUV      = aUV;
    vTangent = mat3(uModel) * aTangent;
    gl_Position = uProjection * uView * world;
}`;

/** ShaderToy compatibility: mainImage() without main() gets wrapped. */
function shadertoy(code: string) {
  if (!/\bmainImage\s*\(/.test(code) || /\bvoid\s+main\s*\(/.test(code)) return { head: "", tail: "" };
  return {
    head: "#define iResolution vec3(uResolution, 1.0)\n#define iTime uTime\n#define iTimeDelta uDelta\n#define iFrame uFrame\n#define iMouse uMouse\n#define iChannel0 uTex0\n#define iChannel1 uTex1\n#define iChannel2 uTex2\n#define iChannel3 uTex3\n",
    tail: "\nvoid main() { mainImage(FragColor, gl_FragCoord.xy); }\n",
  };
}

const lines = (s: string) => s.split("\n").length - 1;

export type ShaderError = { stage: "vertex" | "fragment" | "link"; line: number | null; message: string };

function compileStage(gl: WebGL2RenderingContext, type: number, prelude: string, code: string): { shader: WebGLShader | null; errors: ShaderError[] } {
  const { head, tail } = type === gl.FRAGMENT_SHADER ? shadertoy(code) : { head: "", tail: "" };
  const full = prelude + head + code + tail;
  const offset = lines(prelude + head);
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, full);
  gl.compileShader(sh);
  if (gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return { shader: sh, errors: [] };
  const log = gl.getShaderInfoLog(sh) ?? "unknown error";
  gl.deleteShader(sh);
  const stage = type === gl.VERTEX_SHADER ? "vertex" : "fragment";
  const errors: ShaderError[] = [];
  for (const raw of log.split("\n")) {
    const m = raw.match(/^(?:ERROR|WARNING):\s*\d+:(\d+):\s*(.*)$/);
    if (m) errors.push({ stage, line: Math.max(1, Number(m[1]) - offset), message: m[2].trim() });
    else if (raw.trim() && !/^\s*$/.test(raw)) errors.push({ stage, line: null, message: raw.trim() });
  }
  return { shader: null, errors: errors.length ? errors : [{ stage, line: null, message: log }] };
}

const FULL_VS = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

export function buildProgram(gl: WebGL2RenderingContext, mode: Mode, frag: string, vert: string): { program: WebGLProgram | null; errors: ShaderError[] } {
  const f = compileStage(gl, gl.FRAGMENT_SHADER, mode === "2d" ? PRELUDE_2D : PRELUDE_MESH_FS, frag);
  const v = mode === "2d"
    ? compileStage(gl, gl.VERTEX_SHADER, "", FULL_VS)
    : compileStage(gl, gl.VERTEX_SHADER, PRELUDE_MESH_VS, vert);
  const errors = [...v.errors, ...f.errors];
  if (!f.shader || !v.shader) {
    if (f.shader) gl.deleteShader(f.shader);
    if (v.shader) gl.deleteShader(v.shader);
    return { program: null, errors };
  }
  const p = gl.createProgram()!;
  gl.attachShader(p, v.shader); gl.attachShader(p, f.shader);
  gl.linkProgram(p);
  gl.deleteShader(v.shader); gl.deleteShader(f.shader);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const msg = gl.getProgramInfoLog(p) ?? "link failed";
    gl.deleteProgram(p);
    return { program: null, errors: [{ stage: "link", line: null, message: msg }] };
  }
  return { program: p, errors: [] };
}

// ── Annotations ───────────────────────────────────────────────────────────────
export type Control =
  | { kind: "slider"; name: string; type: string; min: number; max: number; def: number; step: number }
  | { kind: "color"; name: string; def: [number, number, number] }
  | { kind: "toggle"; name: string; type: string; def: number };

export function parseControls(...sources: string[]): Control[] {
  const out: Control[] = [];
  const seen = new Set<string>();
  const re = /uniform\s+(float|int|vec3|bool)\s+(\w+)\s*;\s*\/\/\s*@(slider|color|toggle)\b([^\n]*)/g;
  for (const src of sources) {
    for (const m of src.matchAll(re)) {
      const [, type, name, kind, rest] = m;
      if (seen.has(name)) continue;
      seen.add(name);
      const nums = (rest.match(/-?\d*\.?\d+(?:e-?\d+)?/g) ?? []).map(Number);
      if (kind === "slider") {
        const [min = 0, max = 1, def = min, step] = nums;
        out.push({ kind: "slider", name, type, min, max, def, step: step ?? (type === "int" ? 1 : (max - min) / 200) });
      } else if (kind === "color") out.push({ kind: "color", name, def: [nums[0] ?? 1, nums[1] ?? 1, nums[2] ?? 1] });
      else out.push({ kind: "toggle", name, type, def: nums[0] ?? 1 });
    }
  }
  return out;
}

/** Which uTexN the code actually samples (so the UI only shows those pickers). */
export const usedChannels = (...sources: string[]) =>
  [0, 1, 2, 3].filter(i => sources.some(s => new RegExp(`\\b(uTex${i}|iChannel${i})\\b`).test(s)));

// ── Meshes ────────────────────────────────────────────────────────────────────
function torusPNUT(R = 0.65, r = 0.28, segs = 96, rings = 48): Float32Array {
  const out: number[] = [];
  const v = (i: number, j: number) => {
    const u = (i / segs) * Math.PI * 2, w = (j / rings) * Math.PI * 2;
    const n = [Math.cos(w) * Math.cos(u), Math.sin(w), Math.cos(w) * Math.sin(u)];
    return [(R + r * Math.cos(w)) * Math.cos(u), r * Math.sin(w), (R + r * Math.cos(w)) * Math.sin(u), ...n, i / segs, j / rings, -Math.sin(u), 0, Math.cos(u)];
  };
  for (let i = 0; i < segs; i++) for (let j = 0; j < rings; j++) {
    const a = v(i, j), b = v(i + 1, j), c = v(i + 1, j + 1), d = v(i, j + 1);
    out.push(...a, ...c, ...b, ...a, ...d, ...c);
  }
  return new Float32Array(out);
}

/** A subdivided square in XZ (−1..1), facing +Y — enough vertices for waves. */
function gridPNUT(n = 160): Float32Array {
  const out: number[] = [];
  const v = (i: number, j: number) => { const x = (i / n) * 2 - 1, z = (j / n) * 2 - 1; return [x, 0, z, 0, 1, 0, i / n, 1 - j / n, 1, 0, 0]; };
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const a = v(i, j), b = v(i + 1, j), c = v(i + 1, j + 1), d = v(i, j + 1);
    out.push(...a, ...c, ...b, ...a, ...d, ...c);
  }
  return new Float32Array(out);
}

export function buildMeshes(gl: WebGL2RenderingContext): Record<MeshKind, Mesh> {
  const scale = (d: Float32Array, k: number) => { for (let i = 0; i < d.length; i += 11) { d[i] *= k; d[i + 1] *= k; d[i + 2] *= k; } return d; };
  return {
    sphere: uploadMesh(gl, scale(spherePNUT(64, 96), 1.8)),
    torus: uploadMesh(gl, torusPNUT()),
    cube: uploadMesh(gl, scale(cubePNUT(), 1.3)),
    plane: uploadMesh(gl, gridPNUT()),
  };
}
