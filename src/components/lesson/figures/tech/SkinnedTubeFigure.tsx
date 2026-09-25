"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, forwardFrom, type Vec3 } from "../gl";
import { GLView, useAnimationTime, type Look } from "../GLView";
import { qAxis, qMul, qRotate, slerp, toDual, type Quat, type V3 } from "./dq";

// ── What this figure shows ────────────────────────────────────────────────────
// GPU skinning, the way a game engine does it. A tube (a tentacle, a finger,
// a tail) is modelled once in its rest pose along +Y; four bones of length 1
// run up its middle. Every vertex stores up to four bone indices and weights.
// Each frame the CPU computes one transform per bone (from the bones' local
// rotations, composed down the hierarchy) and the vertex shader blends them:
//   LBS — Σ wᵢ·Mᵢ·v         (matrices, the classic)
//   DQS — dual quaternions   (rigid transforms blended as rigid transforms)
// Twisting the last bone exposes LBS's "candy wrapper": at 180° of twist the
// averaged matrices squash the joint to a line.

const VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec4 aBones;       // bone indices (as floats)
layout(location = 3) in vec4 aWeights;     // matching weights, sum = 1
layout(location = 4) in float aAround;     // 0..1 around the tube, for stripes
uniform mat4 uSkin[4];                     // skinning matrices: pose · inverse(bind)
uniform vec4 uReal[4], uDual[4];           // the same transforms as dual quaternions
uniform int uMethod;
uniform mat4 uView, uProjection;
out vec3 vNormal; out vec3 vWorld; out vec4 vW; out vec4 vB; out float vAround; out float vY;

vec3 qrot(vec4 q, vec3 v) { return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }

void main() {
  ivec4 b = ivec4(aBones + 0.5);
  vec3 p, n;
  if (uMethod == 0) {                                    // linear blend skinning
    mat4 M = aWeights.x * uSkin[b.x] + aWeights.y * uSkin[b.y] + aWeights.z * uSkin[b.z] + aWeights.w * uSkin[b.w];
    p = (M * vec4(aPos, 1.0)).xyz;
    n = mat3(M) * aNormal;                               // fine for rotations; LBS matrices are not rigid anyway
  } else {                                               // dual quaternion skinning
    vec4 r0 = uReal[b.x];
    vec4 r = vec4(0.0), d = vec4(0.0);
    for (int k = 0; k < 4; k++) {
      float w = aWeights[k];
      vec4 rk = uReal[b[k]], dk = uDual[b[k]];
      if (dot(rk, r0) < 0.0) w = -w;                     // same hemisphere: q and −q are the same rotation
      r += w * rk; d += w * dk;
    }
    float len = length(r);
    r /= len; d /= len;                                  // back to a unit dual quaternion
    vec3 trans = 2.0 * (r.w * d.xyz - d.w * r.xyz + cross(r.xyz, d.xyz));
    p = qrot(r, aPos) + trans;
    n = qrot(r, aNormal);
  }
  vNormal = n; vWorld = p; vW = aWeights; vB = aBones; vAround = aAround; vY = aPos.y;
  gl_Position = uProjection * uView * vec4(p - vec3(0.0, 1.6, 0.0), 1.0);
}`;
const FS = `#version 300 es
precision highp float;
in vec3 vNormal; in vec3 vWorld; in vec4 vW; in vec4 vB; in float vAround; in float vY;
uniform int uView2;
uniform vec3 uCam;
out vec4 FragColor;
const vec3 BONE[4] = vec3[4](vec3(0.25, 0.55, 1.0), vec3(0.2, 0.85, 0.45), vec3(1.0, 0.75, 0.2), vec3(1.0, 0.35, 0.4));
void main() {
  vec3 N = normalize(vNormal);
  if (!gl_FrontFacing) N = -N;
  vec3 L = normalize(vec3(0.5, 0.8, 0.6)), V = normalize(uCam - vWorld), H = normalize(L + V);
  vec3 albedo = vec3(0.85, 0.55, 0.5);
  if (uView2 == 1) {                                   // weights: mix the bone colours
    ivec4 b = ivec4(vB + 0.5);
    albedo = vW.x * BONE[b.x] + vW.y * BONE[b.y] + vW.z * BONE[b.z] + vW.w * BONE[b.w];
  } else if (uView2 == 2) {                            // stripes along the tube show the twist
    float s = step(0.5, fract(vAround * 8.0));
    albedo = mix(vec3(0.95), vec3(0.2, 0.4, 0.9), s);
  }
  float ring = 1.0 - smoothstep(0.0, 0.03, abs(fract(vY + 0.5) - 0.5));   // joint rings at y = 1, 2, 3
  if (uView2 != 1) albedo = mix(albedo, vec3(0.1), ring * 0.35);
  vec3 c = albedo * (0.25 + 0.75 * max(dot(N, L), 0.0)) + 0.25 * pow(max(dot(N, H), 0.0), 40.0);
  FragColor = vec4(pow(c, vec3(1.0 / 2.2)), 1.0);
}`;
const LINE_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
uniform mat4 uView, uProjection;
void main() { gl_Position = uProjection * uView * vec4(aPos - vec3(0.0, 1.6, 0.0), 1.0); gl_PointSize = 9.0; }`;
const LINE_FS = `#version 300 es
precision highp float;
uniform vec3 uColor;
out vec4 FragColor;
void main() { FragColor = vec4(uColor, 1.0); }`;

const BONES = 4, RINGS = 96, SEGS = 32, RADIUS = 0.32;

/** The tube in its bind pose, with per-vertex bone indices and weights (top 2 of a smooth falloff). */
function buildTube(blend: number) {
  const out: number[] = [];
  const vert = (i: number, j: number) => {
    const y = (i / RINGS) * BONES, a = (j / SEGS) * Math.PI * 2;
    const taper = 1 - 0.35 * (y / BONES);
    const ws = Array.from({ length: BONES }, (_, b) => Math.max(0, 1 - Math.abs(y - (b + 0.5)) / (0.5 + blend)));
    const order = ws.map((w, b) => [w, b]).sort((p, q) => q[0] - p[0]).slice(0, 4);
    const top2 = order.slice(0, 2), sum = top2[0][0] + top2[1][0] || 1;
    return [Math.cos(a) * RADIUS * taper, y, Math.sin(a) * RADIUS * taper, Math.cos(a), 0.12, Math.sin(a),
      top2[0][1], top2[1][1], 0, 0, top2[0][0] / sum, top2[1][0] / sum, 0, 0, j / SEGS];
  };
  for (let i = 0; i < RINGS; i++) for (let j = 0; j < SEGS; j++) {
    const a = vert(i, j), b = vert(i + 1, j), c = vert(i + 1, j + 1), d = vert(i, j + 1);
    out.push(...a, ...c, ...b, ...a, ...d, ...c);
  }
  return new Float32Array(out);
}

type Pose = { bend: number; twist: number };
const KEYS: Pose[] = [{ bend: 0, twist: 0 }, { bend: 38, twist: 0 }, { bend: -30, twist: 170 }, { bend: 10, twist: -90 }, { bend: 0, twist: 0 }];

/** Local rotation of each bone for a pose: the bend is shared by the joints, the twist is all on the last bone. */
const localRots = (p: Pose): Quat[] => Array.from({ length: BONES }, (_, i) =>
  qMul(qAxis([0, 0, 1], i === 0 ? 0 : (p.bend * Math.PI) / 180), qAxis([0, 1, 0], i === BONES - 1 ? (p.twist * Math.PI) / 180 : 0)));

function quatToMat(q: Quat, t: V3) {
  const [x, y, z, w] = q, m = mat4.identity();
  m[0] = 1 - 2 * (y * y + z * z); m[1] = 2 * (x * y + z * w); m[2] = 2 * (x * z - y * w);
  m[4] = 2 * (x * y - z * w); m[5] = 1 - 2 * (x * x + z * z); m[6] = 2 * (y * z + x * w);
  m[8] = 2 * (x * z + y * w); m[9] = 2 * (y * z - x * w); m[10] = 1 - 2 * (x * x + y * y);
  m[12] = t[0]; m[13] = t[1]; m[14] = t[2];
  return m;
}

type Res = { prog: WebGLProgram; line: WebGLProgram; vao: WebGLVertexArrayObject; vbo: WebGLBuffer; count: number; lineVao: WebGLVertexArrayObject; lineVbo: WebGLBuffer; blend: number };

export function SkinnedTubeFigure({ t }: { t?: TrackTranslations }) {
  const [look, setLook] = useState<Look>({ yaw: -0.4, pitch: -0.15, fov: 0.85 });
  const [method, setMethod] = useState(0);
  const [view, setView] = useState(2);
  const [bend, setBend] = useState(30);
  const [twist, setTwist] = useState(150);
  const [blend, setBlend] = useState(0.5);
  const [animate, setAnimate] = useState(false);
  const [bones, setBones] = useState(true);
  const time = useAnimationTime(animate);

  // Current pose: sliders, or keyframes interpolated per bone with slerp
  let rots: Quat[], shown: Pose;
  if (animate) {
    const T = (time * 0.6) % (KEYS.length - 1), k = Math.floor(T), f = T - k, e = f * f * (3 - 2 * f);
    const a = localRots(KEYS[k]), b = localRots(KEYS[k + 1]);
    rots = a.map((q, i) => slerp(q, b[i], e));
    shown = { bend: KEYS[k].bend + (KEYS[k + 1].bend - KEYS[k].bend) * e, twist: KEYS[k].twist + (KEYS[k + 1].twist - KEYS[k].twist) * e };
  } else { rots = localRots({ bend, twist }); shown = { bend, twist }; }

  // Forward kinematics: world rotation and joint position of every bone
  const Q: Quat[] = [], P: V3[] = [];
  for (let i = 0; i < BONES; i++) {
    if (i === 0) { Q.push(rots[0]); P.push([0, 0, 0]); continue; }
    const tip = qRotate(Q[i - 1], [0, 1, 0]);
    P.push([P[i - 1][0] + tip[0], P[i - 1][1] + tip[1], P[i - 1][2] + tip[2]]);
    Q.push(qMul(Q[i - 1], rots[i]));
  }
  const tipEnd = qRotate(Q[BONES - 1], [0, 1, 0]);
  const joints: V3[] = [...P, [P[BONES - 1][0] + tipEnd[0], P[BONES - 1][1] + tipEnd[1], P[BONES - 1][2] + tipEnd[2]]];
  // Skinning transform of bone i: x ↦ Qᵢ·(x − bindᵢ) + Pᵢ, with bindᵢ = (0, i, 0)
  const trans: V3[] = Q.map((q, i) => { const r = qRotate(q, [0, i, 0]); return [P[i][0] - r[0], P[i][1] - r[1], P[i][2] - r[2]]; });

  const init = (gl: WebGL2RenderingContext): Res => {
    const vao = gl.createVertexArray()!, vbo = gl.createBuffer()!;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    const S = 15 * 4;
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, S, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, S, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, S, 24);
    gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 4, gl.FLOAT, false, S, 40);
    gl.enableVertexAttribArray(4); gl.vertexAttribPointer(4, 1, gl.FLOAT, false, S, 56);
    const lineVao = gl.createVertexArray()!, lineVbo = gl.createBuffer()!;
    gl.bindVertexArray(lineVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, lineVbo);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
    return { prog: compileProgram(gl, VS, FS), line: compileProgram(gl, LINE_VS, LINE_FS), vao, vbo, count: 0, lineVao, lineVbo, blend: -1 };
  };

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    if (r.blend !== blend) {                                   // weights depend on the blend width: rebuild
      const data = buildTube(blend);
      gl.bindBuffer(gl.ARRAY_BUFFER, r.vbo);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      r.count = data.length / 15; r.blend = blend;
    }
    const f = forwardFrom(look.yaw, look.pitch);
    const cam: Vec3 = [-f[0] * 4.6, -f[1] * 4.6, -f[2] * 4.6];
    const V = mat4.lookAt(cam, [0, 0, 0], [0, 1, 0]), Pm = mat4.perspective(look.fov, size.aspect, 0.1, 50);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, size.w, size.h);
    gl.clearColor(0.07, 0.08, 0.1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    gl.useProgram(r.prog);
    const u = (n: string) => gl.getUniformLocation(r.prog, n);
    const skin = new Float32Array(64), real = new Float32Array(16), dual = new Float32Array(16);
    Q.forEach((q, i) => {
      skin.set(quatToMat(q, trans[i]), i * 16);
      const d = toDual(q, trans[i]);
      real.set(d.real, i * 4); dual.set(d.dual, i * 4);
    });
    gl.uniformMatrix4fv(u("uSkin"), false, skin);
    gl.uniform4fv(u("uReal"), real);
    gl.uniform4fv(u("uDual"), dual);
    gl.uniform1i(u("uMethod"), method);
    gl.uniform1i(u("uView2"), view);
    gl.uniform3f(u("uCam"), cam[0], cam[1] + 1.6, cam[2]);
    gl.uniformMatrix4fv(u("uView"), false, V);
    gl.uniformMatrix4fv(u("uProjection"), false, Pm);
    gl.bindVertexArray(r.vao);
    gl.drawArrays(gl.TRIANGLES, 0, r.count);

    if (bones) {                                                // the skeleton, drawn on top
      gl.disable(gl.DEPTH_TEST);
      gl.useProgram(r.line);
      gl.uniformMatrix4fv(gl.getUniformLocation(r.line, "uView"), false, V);
      gl.uniformMatrix4fv(gl.getUniformLocation(r.line, "uProjection"), false, Pm);
      gl.uniform3f(gl.getUniformLocation(r.line, "uColor"), 1, 1, 1);
      gl.bindBuffer(gl.ARRAY_BUFFER, r.lineVbo);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(joints.flat()), gl.DYNAMIC_DRAW);
      gl.bindVertexArray(r.lineVao);
      gl.drawArrays(gl.LINE_STRIP, 0, joints.length);
      gl.drawArrays(gl.POINTS, 0, joints.length);
      gl.enable(gl.DEPTH_TEST);
    }
  };

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figSkinTube_title", "GPU Skinning — Four Bones, Two Blending Methods")}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{tx(t, "figScene_hint", "drag to orbit · scroll to zoom")}</span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2 relative">
        <GLView<Res> orbit init={init} draw={draw} look={look} onLook={setLook} fovRange={[0.4, 1.4]}
          frame={[look, method, view, bend, twist, blend, bones, animate ? time : 0]} aspect={16 / 9} />
        <div className="absolute top-3 left-3 font-mono text-[10px] text-white/85 bg-black/45 rounded px-2 py-1 pointer-events-none">
          {animate ? `keyframes · bend ${shown.bend.toFixed(0)}° · twist ${shown.twist.toFixed(0)}°` : `bend ${bend}° · twist ${twist}°`}
        </div>
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-20">{tx(t, "figSkinTube_method", "blending")}</span>
          <button className={btn(method === 0)} onClick={() => setMethod(0)}>linear (LBS)</button>
          <button className={btn(method === 1)} onClick={() => setMethod(1)}>dual quaternion (DQS)</button>
          <span className="text-[10px] font-mono text-[var(--text-muted)] ml-3">view</span>
          {["shaded", "weights", "stripes"].map((v, i) => <button key={v} className={btn(view === i)} onClick={() => setView(i)}>{v}</button>)}
        </div>
        <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {([["bend / joint", bend, setBend, -60, 60, 1], ["twist (last)", twist, setTwist, -180, 180, 1], ["blend width", blend, setBlend, 0.02, 1, 0.02]] as const).map(([label, v, set, min, max, step]) => (
            <label key={label} className={`flex items-center gap-2 ${animate && label !== "blend width" ? "opacity-40" : ""}`}>
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-24">{label}</span>
              <input type="range" min={min} max={max} step={step} value={v} disabled={animate && label !== "blend width"} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{v}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-4 flex-wrap text-[10px] font-mono text-[var(--text-muted)]">
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={animate} onChange={e => setAnimate(e.target.checked)} className="accent-[var(--primary)]" />{tx(t, "figSkinTube_anim", "play keyframes (slerp per bone)")}</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={bones} onChange={e => setBones(e.target.checked)} className="accent-[var(--primary)]" />{tx(t, "figSkinTube_bones", "show skeleton")}</label>
        </div>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {method === 0
            ? tx(t, "figSkinTube_lbsNote", "With twist near 180°, the last joint collapses into a thin neck: the classic LBS \"candy wrapper\". A vertex halfway between two bones gets the average of two rotation matrices 180° apart, and that average is nearly a projection onto the axis, not a rotation. Switch to the stripes view to see the twist spread across the blend region.")
            : tx(t, "figSkinTube_dqsNote", "Same weights, same bones, and the joint keeps its full thickness: blending dual quaternions gives a rigid rotation part-way between the two bones, so the vertex travels around the axis instead of cutting across it. At extreme bends DQS can bulge slightly outward, which is the known trade-off.")}
        </p>
      </div>
    </figure>
  );
}
