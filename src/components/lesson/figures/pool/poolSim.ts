// ── The pool's water: a height field under the wave equation ──────────────────
// One RGBA float texture covers the pool, one texel per grid cell:
//   r = height h above the rest level (m), g = velocity (m per step),
//   b, a = the surface normal's x and z (y follows from unit length).
// Every pass reads one texture and writes the other (ping-pong), because a
// fragment shader cannot read the texture it is drawing into.
// Passes: drops (a raised-cosine bump), the ball's displacement, the wave
// equation step, and the normals.

import { compileProgram } from "../../kit/gl/gl";
import { FULL_VS, drawFullscreen } from "../../kit/gl/glx";
import type { Vec3 } from "../../kit/gl/gl";

export const SIM_N = 256;          // texels across the pool
export const POOL_HALF = 1;        // the pool spans x, z ∈ [−1, 1] m
export const POOL_DEPTH = 1;       // floor at y = −1 m

const HEAD = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 FragColor;
uniform sampler2D uSim;
`;

const DROP_FS = `${HEAD}
uniform vec2  uCenter;             // pool coordinates (x, z)
uniform float uRadius, uStrength;  // metres
void main() {
  vec4 s = texture(uSim, vUV);
  vec2 x = (vUV * 2.0 - 1.0) * ${POOL_HALF.toFixed(1)};
  float r = length(x - uCenter) / uRadius;
  // A raised cosine: 1 at the centre, 0 with zero slope at r = 1
  float bump = r < 1.0 ? 0.5 + 0.5 * cos(3.14159265 * r) : 0.0;
  s.r += bump * uStrength;
  FragColor = s;
}`;

// The ball pushes aside the water in each column it occupies below the rest
// level: the column's water rises by the change in that submerged length.
const BALL_FS = `${HEAD}
uniform vec4 uOld, uNew;           // ball centre (xyz) and radius (w), last frame and now
float submerged(vec2 x, vec4 b) {
  float rho2 = dot(x - b.xz, x - b.xz);
  if (rho2 >= b.w * b.w) return 0.0;
  float s = sqrt(b.w * b.w - rho2);              // half the ball's height at x
  // From its bottom up to the rest level. The column length drops to 0 with
  // an infinite slope at the rim; that kink would ring at the grid scale, so
  // the outer 15% of the radius is eased out.
  float ease = smoothstep(1.0, 0.85, sqrt(rho2) / b.w);
  return max(min(b.y + s, 0.0) - (b.y - s), 0.0) * ease;
}
void main() {
  vec4 s = texture(uSim, vUV);
  vec2 x = (vUV * 2.0 - 1.0) * ${POOL_HALF.toFixed(1)};
  s.r += submerged(x, uNew) - submerged(x, uOld);
  FragColor = s;
}`;

// The wave equation, one step: velocity from the Laplacian, then height from velocity
const STEP_FS = `${HEAD}
uniform float uCourant2;           // c²Δt²/Δx², at most 0.5 in 2D
uniform float uDamping;            // velocity kept per step
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy), m = ivec2(${SIM_N - 1});
  vec4 s = texelFetch(uSim, p, 0);
  // Neighbours outside the pool are the edge texel itself: a wall that reflects
  float sum = texelFetch(uSim, clamp(p + ivec2(1, 0), ivec2(0), m), 0).r
            + texelFetch(uSim, clamp(p - ivec2(1, 0), ivec2(0), m), 0).r
            + texelFetch(uSim, clamp(p + ivec2(0, 1), ivec2(0), m), 0).r
            + texelFetch(uSim, clamp(p - ivec2(0, 1), ivec2(0), m), 0).r;
  s.g += uCourant2 * (sum - 4.0 * s.r);
  s.g *= uDamping;
  s.r += s.g;
  FragColor = s;
}`;

const NORMAL_FS = `${HEAD}
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy), m = ivec2(${SIM_N - 1});
  vec4 s = texelFetch(uSim, p, 0);
  float dx = ${((2 * POOL_HALF) / SIM_N).toFixed(6)} * 2.0;   // two texels, in metres
  float hx = texelFetch(uSim, clamp(p + ivec2(1, 0), ivec2(0), m), 0).r - texelFetch(uSim, clamp(p - ivec2(1, 0), ivec2(0), m), 0).r;
  float hz = texelFetch(uSim, clamp(p + ivec2(0, 1), ivec2(0), m), 0).r - texelFetch(uSim, clamp(p - ivec2(0, 1), ivec2(0), m), 0).r;
  vec3 n = normalize(vec3(-hx / dx, 1.0, -hz / dx));
  s.ba = n.xz;
  FragColor = s;
}`;

export type PoolSim = {
  tex: [WebGLTexture, WebGLTexture]; fbo: [WebGLFramebuffer, WebGLFramebuffer]; cur: number;
  drop: WebGLProgram; ball: WebGLProgram; step: WebGLProgram; normal: WebGLProgram;
  vao: WebGLVertexArrayObject; linear: boolean;
};

/** The best float format this browser can render into, or null. */
function simFormat(gl: WebGL2RenderingContext) {
  const full = !!gl.getExtension("EXT_color_buffer_float");
  if (full && gl.getExtension("OES_texture_float_linear")) return { internal: gl.RGBA32F, type: gl.FLOAT, linear: true };
  if (full || gl.getExtension("EXT_color_buffer_half_float")) return { internal: gl.RGBA16F, type: gl.HALF_FLOAT, linear: true };
  return null;
}

export function makePoolSim(gl: WebGL2RenderingContext): PoolSim {
  const f = simFormat(gl);
  if (!f) throw new Error("This figure needs float render targets (EXT_color_buffer_float), which this browser does not offer.");
  const make = () => {
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texStorage2D(gl.TEXTURE_2D, 1, f.internal, SIM_N, SIM_N);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f.linear ? gl.LINEAR : gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f.linear ? gl.LINEAR : gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return [t, fb] as const;
  };
  const a = make(), b = make();
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return {
    tex: [a[0], b[0]], fbo: [a[1], b[1]], cur: 0,
    drop: compileProgram(gl, FULL_VS, DROP_FS), ball: compileProgram(gl, FULL_VS, BALL_FS),
    step: compileProgram(gl, FULL_VS, STEP_FS), normal: compileProgram(gl, FULL_VS, NORMAL_FS),
    vao: gl.createVertexArray()!, linear: f.linear,
  };
}

/** The texture holding the latest state. */
export const simTexture = (s: PoolSim) => s.tex[s.cur];

/** Runs one pass: reads the current texture, writes the other, then swaps. */
function pass(gl: WebGL2RenderingContext, s: PoolSim, prog: WebGLProgram, set: (loc: (n: string) => WebGLUniformLocation | null) => void) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, s.fbo[1 - s.cur]);
  gl.viewport(0, 0, SIM_N, SIM_N);
  gl.useProgram(prog);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, s.tex[s.cur]);
  gl.uniform1i(gl.getUniformLocation(prog, "uSim"), 0);
  set(n => gl.getUniformLocation(prog, n));
  drawFullscreen(gl, s.vao);
  s.cur = 1 - s.cur;
}

export type SimInput = {
  drops: { x: number; z: number; radius: number; strength: number }[];
  ball: { old: Vec3; now: Vec3; r: number };
  steps: number; courant2: number; damping: number;
};

/** Advances the water by one frame. Leaves the default framebuffer bound. */
export function stepPoolSim(gl: WebGL2RenderingContext, s: PoolSim, inp: SimInput) {
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);
  for (const d of inp.drops) {
    pass(gl, s, s.drop, loc => {
      gl.uniform2f(loc("uCenter"), d.x, d.z);
      gl.uniform1f(loc("uRadius"), d.radius);
      gl.uniform1f(loc("uStrength"), d.strength);
    });
  }
  const { old, now, r } = inp.ball;
  if (old.some((v, i) => v !== now[i])) {
    pass(gl, s, s.ball, loc => {
      gl.uniform4f(loc("uOld"), old[0], old[1], old[2], r);
      gl.uniform4f(loc("uNew"), now[0], now[1], now[2], r);
    });
  }
  for (let i = 0; i < inp.steps; i++) {
    pass(gl, s, s.step, loc => {
      gl.uniform1f(loc("uCourant2"), inp.courant2);
      gl.uniform1f(loc("uDamping"), inp.damping);
    });
  }
  pass(gl, s, s.normal, () => {});
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

/** Flattens the water. */
export function resetPoolSim(gl: WebGL2RenderingContext, s: PoolSim) {
  gl.clearColor(0, 0, 0, 0);
  for (const fb of s.fbo) { gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.clear(gl.COLOR_BUFFER_BIT); }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}
