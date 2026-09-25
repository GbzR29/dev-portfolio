// ── A shared test scene for the post-processing chapters ──────────────────────
// A room corner (floor + two walls) with stacked boxes, a sphere resting in the
// corner and a short staircase: plenty of creases for SSAO, hard silhouettes
// for anti-aliasing and colour variety for post effects.

import { mat4, compileProgram, type Mat4, type Vec3 } from "../../kit/gl/gl";
import { uploadMesh, cubePNUT, spherePNUT, planePNUT, trs, type Mesh, type SceneItem } from "../../kit/gl/glx";

export const ROOM: SceneItem[] = [
  { mesh: "plane", model: trs([0, 0, 0], [10, 1, 10]), color: [0.7, 0.7, 0.72] },
  { mesh: "cube", model: trs([0, 2, -3], [10, 4, 0.2]), color: [0.75, 0.72, 0.68] },       // back wall
  { mesh: "cube", model: trs([-3, 2, 0], [0.2, 4, 10]), color: [0.66, 0.7, 0.76] },        // left wall
  { mesh: "cube", model: trs([-2.2, 0.6, -2.2], 1.2, 0.2), color: [0.95, 0.55, 0.12] },    // stacked boxes in the corner
  { mesh: "cube", model: trs([-2.15, 1.6, -2.25], 0.8, 0.6), color: [0.2, 0.55, 0.95] },
  { mesh: "sphere", model: trs([-0.4, 0.75, -2.1], 1.5), color: [0.92, 0.92, 0.94] },       // sphere against the wall
  { mesh: "cube", model: trs([1.4, 0.2, -1.2], [1.6, 0.4, 1.2]), color: [0.25, 0.75, 0.4] }, // stairs
  { mesh: "cube", model: trs([1.4, 0.6, -1.6], [1.6, 0.4, 0.8]), color: [0.25, 0.75, 0.4] },
  { mesh: "cube", model: trs([1.4, 1.0, -2.0], [1.6, 0.4, 0.4]), color: [0.25, 0.75, 0.4] },
  { mesh: "cube", model: trs([0.6, 0.35, 0.8], 0.7, 0.7), color: [0.85, 0.2, 0.25] },
  { mesh: "sphere", model: trs([-1.5, 0.35, 0.6], 0.7), color: [0.95, 0.8, 0.2] },
];

export type SceneMeshes = Record<SceneItem["mesh"], Mesh>;
export const sceneMeshes = (gl: WebGL2RenderingContext): SceneMeshes => ({
  cube: uploadMesh(gl, cubePNUT()), sphere: uploadMesh(gl, spherePNUT(40, 64)), plane: uploadMesh(gl, planePNUT(8)),
});

/** Plain forward shading: one sun, hemisphere ambient, Blinn-Phong, a faint grid on the floor. */
export const LIT_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aUV;
uniform mat4 uModel, uView, uProjection;
out vec3 vWorld; out vec3 vNormal; out vec2 vUV;
void main() {
  vec4 w = uModel * vec4(aPos, 1.0);
  vWorld = w.xyz; vNormal = mat3(uModel) * aNormal; vUV = aUV;
  gl_Position = uProjection * uView * w;
}`;
export const LIT_FS = `#version 300 es
precision highp float;
in vec3 vWorld; in vec3 vNormal; in vec2 vUV;
uniform vec3 uColor, uCam, uSun;
uniform float uGrid;
out vec4 FragColor;
void main() {
  vec3 N = normalize(vNormal), V = normalize(uCam - vWorld), H = normalize(uSun + V);
  vec3 albedo = uColor;
  if (uGrid > 0.5) {                                  // thin lines: good aliasing test material
    vec2 g = abs(fract(vUV) - 0.5);
    albedo *= 1.0 - 0.3 * step(0.47, max(g.x, g.y));
  }
  float diff = max(dot(N, uSun), 0.0);
  float spec = pow(max(dot(N, H), 0.0), 64.0) * 0.35;
  vec3 amb = mix(vec3(0.16, 0.15, 0.14), vec3(0.2, 0.24, 0.32), N.y * 0.5 + 0.5);
  vec3 c = albedo * (amb + diff * vec3(1.0, 0.95, 0.85)) + spec;
  FragColor = vec4(pow(c, vec3(1.0 / 2.2)), 1.0);
}`;

export const SUN: Vec3 = (() => { const v: Vec3 = [0.5, 0.8, 0.35]; const l = Math.hypot(...v); return [v[0] / l, v[1] / l, v[2] / l]; })();

export const compileLit = (gl: WebGL2RenderingContext) => compileProgram(gl, LIT_VS, LIT_FS);

/** Draws the room with any program that has uModel / uColor (and optionally uGrid). */
export function drawRoom(gl: WebGL2RenderingContext, prog: WebGLProgram, meshes: SceneMeshes, extra: SceneItem[] = []) {
  const uModel = gl.getUniformLocation(prog, "uModel"), uColor = gl.getUniformLocation(prog, "uColor");
  const uGrid = gl.getUniformLocation(prog, "uGrid");
  for (const it of [...ROOM, ...extra]) {
    gl.uniformMatrix4fv(uModel, false, it.model);
    gl.uniform3fv(uColor, it.color);
    gl.uniform1f(uGrid, it.mesh === "plane" ? 1 : 0);
    const m = meshes[it.mesh];
    gl.bindVertexArray(m.vao);
    gl.drawArrays(gl.TRIANGLES, 0, m.count);
  }
}

/** Keeps the orbit in front of the two walls (the room is open toward +X and +Z). */
export const clampRoomLook = <L extends { yaw: number; pitch: number }>(l: L): L =>
  ({ ...l, yaw: Math.max(-1.45, Math.min(0.05, l.yaw)), pitch: Math.max(-1.2, Math.min(-0.05, l.pitch)) });
export const ROOM_LOOK = { yaw: -0.62, pitch: -0.38, fov: 0.95 };

/** Orbit camera around the corner of the room. */
export function roomCamera(f: Vec3, dist = 7.5, target: Vec3 = [-0.6, 0.9, -1.2]): { cam: Vec3; view: Mat4 } {
  const cam: Vec3 = [target[0] - f[0] * dist, Math.max(0.25, target[1] - f[1] * dist), target[2] - f[2] * dist];
  return { cam, view: mat4.lookAt(cam, target, [0, 1, 0]) };
}
