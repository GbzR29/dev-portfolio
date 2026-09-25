"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, forwardFrom, norm, cross, type Vec3 } from "../../kit/gl/gl";
import { GLView, useAnimationTime, type Look } from "../../kit/gl/GLView";
import { useVisible } from "../../kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Rain as a CPU particle system with three pools:
//   • drops    — spawned at the top of a box that follows the camera, wrapped
//                horizontally so the rain never runs out; drawn as streaks
//                along the velocity, length = speed × shutter time
//   • splashes — child particles spawned where a drop hits the pavement
//   • ripples  — ring decals spawned where a drop hits the pond
// Four draw calls per frame: ground, ripples, splashes, drops.

const GROUND_VS = `#version 300 es
layout(location = 0) in vec2 aXZ;
uniform mat4 uView, uProjection;
uniform vec3 uCam;
out vec3 vWorld;
void main() {
  vWorld = vec3(aXZ.x + floor(uCam.x), 0.0, aXZ.y + floor(uCam.z));   // the ground plane follows the camera
  gl_Position = uProjection * uView * vec4(vWorld, 1.0);
}`;
const GROUND_FS = `#version 300 es
precision highp float;
in vec3 vWorld;
uniform vec3 uCam, uPond, uFog;
uniform float uPondR;
out vec4 FragColor;
void main() {
  vec3 V = normalize(uCam - vWorld);
  float fres = 0.02 + 0.98 * pow(1.0 - V.y, 5.0);
  vec3 sky = mix(uFog * 1.15, uFog * 0.7, V.y);
  vec3 col;
  if (length(vWorld.xz - uPond.xz) < uPondR) {
    col = mix(vec3(0.02, 0.035, 0.04), sky, fres);                    // pond: dark water + sky reflection
  } else {
    vec2 g = abs(fract(vWorld.xz * 0.8) - 0.5);                         // wet paving stones
    float grout = smoothstep(0.475, 0.495, max(g.x, g.y));
    float shade = 0.85 + 0.3 * fract(sin(dot(floor(vWorld.xz * 0.8), vec2(12.9, 78.2))) * 43758.5);
    vec3 stone = vec3(0.16, 0.16, 0.17) * shade;
    col = mix(stone, vec3(0.06), grout) + sky * fres * 0.6;             // wet = darker + shinier
  }
  float fog = 1.0 - exp(-length(uCam - vWorld) / 35.0);
  FragColor = vec4(pow(mix(col, uFog, fog), vec3(1.0 / 2.2)), 1.0);
}`;

// Streaks: each instance is one drop (position, velocity). The quad spans
// from the drop back along its velocity for one shutter interval.
const DROP_VS = `#version 300 es
layout(location = 0) in vec3 iPos;
layout(location = 1) in vec3 iVel;
uniform mat4 uView, uProjection;
uniform vec3 uCam;
uniform float uShutter, uWidth, uPixel, uMinPx;
out vec2 vC; out float vA;
void main() {
  vec2 c = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1));      // (0,0) (1,0) (0,1) (1,1)
  vec3 p = iPos - iVel * uShutter * c.y;                                // head → tail
  vec3 toCam = normalize(uCam - iPos);
  vec3 side = normalize(cross(iVel, toCam));
  // Never thinner than one pixel: widen far streaks, and lower their alpha to keep the same light
  float dist = length(uCam - iPos);
  float w = uMinPx > 0.5 ? max(uWidth, dist * uPixel) : uWidth;
  vA = uWidth / w;
  p += side * w * (c.x - 0.5);
  vC = c;
  gl_Position = uProjection * uView * vec4(p, 1.0);
}`;
const DROP_FS = `#version 300 es
precision highp float;
in vec2 vC; in float vA;
uniform vec3 uTint;
uniform float uAlpha;
out vec4 FragColor;
void main() {
  float across = 1.0 - pow(abs(vC.x - 0.5) * 2.0, 2.0);
  float along = mix(1.0, 0.25, vC.y);                                   // the head is brighter than the tail
  FragColor = vec4(uTint, uAlpha * across * along * vA);
}`;

// Splash droplets: small camera-facing quads
const SPLASH_VS = `#version 300 es
layout(location = 0) in vec4 iPosLife;          // xyz, remaining life 0…1
uniform mat4 uView, uProjection;
uniform vec3 uRight, uUp;
out vec2 vUV; out float vLife;
void main() {
  vec2 c = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1)) * 2.0 - 1.0;
  vec3 p = iPosLife.xyz + (uRight * c.x + uUp * c.y) * 0.011;
  vUV = c; vLife = iPosLife.w;
  gl_Position = uProjection * uView * vec4(p, 1.0);
}`;
const SPLASH_FS = `#version 300 es
precision highp float;
in vec2 vUV; in float vLife;
uniform vec3 uTint;
out vec4 FragColor;
void main() {
  float a = 1.0 - smoothstep(0.4, 1.0, length(vUV));
  FragColor = vec4(uTint, a * vLife * 0.55);
}`;

// Ripples: flat quads on the water, a ring drawn in the fragment shader
const RIPPLE_VS = `#version 300 es
layout(location = 0) in vec3 iRip;              // x, z, age
uniform mat4 uView, uProjection;
uniform float uSpeed;
out vec2 vP; out float vAge;
void main() {
  vec2 c = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1)) * 2.0 - 1.0;
  float R = iRip.z * uSpeed + 0.08;               // quad just large enough for the ring
  vP = c * R; vAge = iRip.z;
  gl_Position = uProjection * uView * vec4(iRip.x + c.x * R, 0.003, iRip.y + c.y * R, 1.0);
}`;
const RIPPLE_FS = `#version 300 es
precision highp float;
in vec2 vP; in float vAge;
uniform float uSpeed, uLife;
out vec4 FragColor;
void main() {
  float r = length(vP), front = vAge * uSpeed;
  float ring = exp(-pow((r - front) / 0.012, 2.0)) + 0.5 * exp(-pow((r - front + 0.05) / 0.012, 2.0));
  float fade = pow(1.0 - vAge / uLife, 2.0);
  FragColor = vec4(vec3(0.75, 0.8, 0.85), ring * fade * 0.55);
}`;

const LINE_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
uniform mat4 uView, uProjection;
void main() { gl_Position = uProjection * uView * vec4(aPos, 1.0); }`;
const LINE_FS = `#version 300 es
precision highp float;
out vec4 FragColor;
void main() { FragColor = vec4(1.0, 0.7, 0.2, 0.9); }`;

const DROP_CAP = 12000, SPLASH_CAP = 6000, RIPPLE_CAP = 2500;
const H = 12, GROUND_HALF = 60, VT = 9;               // volume height, ground extent, terminal speed (m/s)
const POND: Vec3 = [0, 0, -3.5], POND_R = 4.5;
const RIPPLE_SPEED = 0.35, RIPPLE_LIFE = 1.0;
const FOG: Vec3 = [0.36, 0.39, 0.43];

type Sim = {
  dp: Float32Array; dv: Float32Array; drops: number;
  sp: Float32Array; sv: Float32Array; sl: Float32Array; sLife: Float32Array; splashes: number;
  rp: Float32Array; ripples: number;
  acc: number; last: number; camZ: number; warm: boolean; epoch: number;
};
type Res = {
  ground: WebGLProgram; drop: WebGLProgram; splash: WebGLProgram; ripple: WebGLProgram; line: WebGLProgram;
  gVao: WebGLVertexArrayObject; gCount: number;
  dVao: WebGLVertexArrayObject; dBuf: WebGLBuffer; dInst: Float32Array;
  sVao: WebGLVertexArrayObject; sBuf: WebGLBuffer; sInst: Float32Array;
  rVao: WebGLVertexArrayObject; rBuf: WebGLBuffer; rInst: Float32Array;
  lVao: WebGLVertexArrayObject; lBuf: WebGLBuffer;
  sim: Sim | null;
};

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export function RainFigure({ t }: { t?: TrackTranslations }) {
  const [look, setLook] = useState<Look>({ yaw: 0, pitch: -0.3, fov: 1.2 });
  const [density, setDensity] = useState(15);       // drops per second per m²
  const [wind, setWind] = useState(1.5);
  const [shutter, setShutter] = useState(16);       // ms
  const [width, setWidth] = useState(3);            // mm
  const [splashN, setSplashN] = useState(4);
  const [box, setBox] = useState(10);               // half-size of the rain volume (m)
  const [walk, setWalk] = useState(false);
  const [showBox, setShowBox] = useState(false);
  const [minPx, setMinPx] = useState(true);
  const [prewarm, setPrewarm] = useState(true);
  const [paused, setPaused] = useState(false);
  const [epoch, setEpoch] = useState(0);            // bumped by "restart"
  const [stats, setStats] = useState({ drops: 0, splashes: 0, ripples: 0 });
  const vis = useVisible<HTMLElement>();
  const time = useAnimationTime(!paused && vis.on);

  const init = (gl: WebGL2RenderingContext): Res => {
    const inst = (cap: number, floats: number, attribs: [number, number, number][]) => {
      const vao = gl.createVertexArray()!, buf = gl.createBuffer()!;
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, cap * floats * 4, gl.STREAM_DRAW);
      for (const [loc, size, off] of attribs) {
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, size, gl.FLOAT, false, floats * 4, off * 4);
        gl.vertexAttribDivisor(loc, 1);
      }
      return { vao, buf, data: new Float32Array(cap * floats) };
    };
    // Ground: a grid of quads (fine enough for per-vertex fog to look smooth)
    const N = 60, verts: number[] = [];
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const x0 = -GROUND_HALF + (i / N) * GROUND_HALF * 2, x1 = x0 + (GROUND_HALF * 2) / N;
      const z0 = -GROUND_HALF + (j / N) * GROUND_HALF * 2, z1 = z0 + (GROUND_HALF * 2) / N;
      verts.push(x0, z0, x1, z0, x1, z1, x0, z0, x1, z1, x0, z1);
    }
    const gVao = gl.createVertexArray()!;
    gl.bindVertexArray(gVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
    const d = inst(DROP_CAP, 6, [[0, 3, 0], [1, 3, 3]]);
    const s = inst(SPLASH_CAP, 4, [[0, 4, 0]]);
    const r = inst(RIPPLE_CAP, 3, [[0, 3, 0]]);
    const lVao = gl.createVertexArray()!, lBuf = gl.createBuffer()!;
    gl.bindVertexArray(lVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, lBuf);
    gl.bufferData(gl.ARRAY_BUFFER, 24 * 3 * 4, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
    return {
      ground: compileProgram(gl, GROUND_VS, GROUND_FS), drop: compileProgram(gl, DROP_VS, DROP_FS),
      splash: compileProgram(gl, SPLASH_VS, SPLASH_FS), ripple: compileProgram(gl, RIPPLE_VS, RIPPLE_FS), line: compileProgram(gl, LINE_VS, LINE_FS),
      gVao, gCount: verts.length / 2,
      dVao: d.vao, dBuf: d.buf, dInst: d.data, sVao: s.vao, sBuf: s.buf, sInst: s.data, rVao: r.vao, rBuf: r.buf, rInst: r.data,
      lVao, lBuf, sim: null,
    };
  };

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    if (!r.sim || r.sim.epoch !== epoch) r.sim = {
      dp: new Float32Array(DROP_CAP * 3), dv: new Float32Array(DROP_CAP * 3), drops: 0,
      sp: new Float32Array(SPLASH_CAP * 3), sv: new Float32Array(SPLASH_CAP * 3), sl: new Float32Array(SPLASH_CAP), sLife: new Float32Array(SPLASH_CAP), splashes: 0,
      rp: new Float32Array(RIPPLE_CAP * 3), ripples: 0, acc: 0, last: time, camZ: 3.5, warm: false, epoch,
    };
    const S = r.sim;
    const dt = Math.min(0.05, Math.max(0, time - S.last));
    S.last = time;
    if (walk) { S.camZ -= 2.5 * dt; if (S.camZ < -40) S.camZ += 60; }
    const cam: Vec3 = [0, 1.7, S.camZ];

    const newDrop = (y: number) => {
      if (S.drops >= DROP_CAP) return;
      const i = S.drops++, k = i * 3;
      S.dp[k] = cam[0] + rnd(-box, box); S.dp[k + 1] = y; S.dp[k + 2] = cam[2] + rnd(-box, box);
      S.dv[k] = wind * rnd(0.8, 1.2); S.dv[k + 1] = -VT * rnd(0.85, 1.15); S.dv[k + 2] = rnd(-0.2, 0.2);
    };
    // Prewarm: the first frame fills the whole volume, not just its top
    if (!S.warm) {
      if (prewarm) { const n = Math.min(DROP_CAP, density * (2 * box) ** 2 * (H / VT)); for (let i = 0; i < n; i++) newDrop(rnd(0, H)); }
      S.warm = true;
    }
    // Emission: drops per second = density × area of the volume's top
    S.acc += density * (2 * box) ** 2 * dt;
    let spawn = Math.floor(S.acc);
    S.acc -= spawn;
    while (spawn-- > 0) newDrop(cam[1] + H - 1.7);

    // Drops: move, wrap around the camera, and die on the ground
    for (let i = 0; i < S.drops;) {
      const k = i * 3;
      S.dp[k] += S.dv[k] * dt; S.dp[k + 1] += S.dv[k + 1] * dt; S.dp[k + 2] += S.dv[k + 2] * dt;
      // Wrap: a drop that leaves the box on one side comes back on the other
      const dx = S.dp[k] - cam[0], dz = S.dp[k + 2] - cam[2];
      if (dx > box) S.dp[k] -= 2 * box; else if (dx < -box) S.dp[k] += 2 * box;
      if (dz > box) S.dp[k + 2] -= 2 * box; else if (dz < -box) S.dp[k + 2] += 2 * box;
      if (S.dp[k + 1] <= 0) {
        const x = S.dp[k], z = S.dp[k + 2];
        if (Math.hypot(x - POND[0], z - POND[2]) < POND_R) {
          if (S.ripples < RIPPLE_CAP) { S.rp.set([x, z, 0], S.ripples * 3); S.ripples++; }
        } else {
          for (let n = 0; n < splashN && S.splashes < SPLASH_CAP; n++) {          // sub-emitter: a crown of droplets
            const j = S.splashes++, a = Math.random() * Math.PI * 2, sp = rnd(0.4, 1.3);
            S.sp.set([x, 0.01, z], j * 3);
            S.sv.set([Math.cos(a) * sp, rnd(0.8, 2.0), Math.sin(a) * sp], j * 3);
            S.sLife[j] = rnd(0.2, 0.4); S.sl[j] = S.sLife[j];
          }
        }
        const last = --S.drops;                                               // swap-remove
        S.dp.copyWithin(k, last * 3, last * 3 + 3); S.dv.copyWithin(k, last * 3, last * 3 + 3);
        continue;
      }
      i++;
    }
    // Splash droplets: ballistic, short-lived
    for (let i = 0; i < S.splashes;) {
      const k = i * 3;
      S.sl[i] -= dt;
      if (S.sl[i] <= 0 || S.sp[k + 1] < 0) {
        const last = --S.splashes;
        S.sp.copyWithin(k, last * 3, last * 3 + 3); S.sv.copyWithin(k, last * 3, last * 3 + 3);
        S.sl[i] = S.sl[last]; S.sLife[i] = S.sLife[last];
        continue;
      }
      S.sv[k + 1] -= 9.8 * dt;
      S.sp[k] += S.sv[k] * dt; S.sp[k + 1] += S.sv[k + 1] * dt; S.sp[k + 2] += S.sv[k + 2] * dt;
      i++;
    }
    // Ripples: just age
    for (let i = 0; i < S.ripples;) {
      S.rp[i * 3 + 2] += dt;
      if (S.rp[i * 3 + 2] >= RIPPLE_LIFE) { const last = --S.ripples; S.rp.copyWithin(i * 3, last * 3, last * 3 + 3); continue; }
      i++;
    }

    // ── Camera ──
    const f = forwardFrom(look.yaw, look.pitch);
    const V = mat4.lookAt(cam, [cam[0] + f[0], cam[1] + f[1], cam[2] + f[2]], [0, 1, 0]);
    const P = mat4.perspective(look.fov, size.aspect, 0.05, 120);
    const right = norm(cross(f, [0, 1, 0])), up = cross(right, f);

    gl.viewport(0, 0, size.w, size.h);
    const fogS = FOG.map(c => Math.pow(c, 1 / 2.2)) as Vec3;
    gl.clearColor(fogS[0], fogS[1], fogS[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    const set = (p: WebGLProgram) => {
      gl.useProgram(p);
      gl.uniformMatrix4fv(gl.getUniformLocation(p, "uView"), false, V);
      gl.uniformMatrix4fv(gl.getUniformLocation(p, "uProjection"), false, P);
      return (n: string) => gl.getUniformLocation(p, n);
    };
    // 1. Ground
    let u = set(r.ground);
    gl.uniform3fv(u("uCam"), cam); gl.uniform3fv(u("uPond"), POND); gl.uniform1f(u("uPondR"), POND_R); gl.uniform3fv(u("uFog"), FOG);
    gl.bindVertexArray(r.gVao);
    gl.drawArrays(gl.TRIANGLES, 0, r.gCount);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    // 2. Ripples
    r.rInst.set(S.rp.subarray(0, S.ripples * 3));
    gl.bindBuffer(gl.ARRAY_BUFFER, r.rBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, r.rInst, 0, S.ripples * 3);
    u = set(r.ripple);
    gl.uniform1f(u("uSpeed"), RIPPLE_SPEED); gl.uniform1f(u("uLife"), RIPPLE_LIFE);
    gl.bindVertexArray(r.rVao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, S.ripples);
    // 3. Splashes
    for (let i = 0; i < S.splashes; i++) r.sInst.set([S.sp[i * 3], S.sp[i * 3 + 1], S.sp[i * 3 + 2], S.sl[i] / S.sLife[i]], i * 4);
    gl.bindBuffer(gl.ARRAY_BUFFER, r.sBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, r.sInst, 0, S.splashes * 4);
    u = set(r.splash);
    gl.uniform3fv(u("uRight"), right); gl.uniform3fv(u("uUp"), up); gl.uniform3fv(u("uTint"), [0.7, 0.74, 0.8]);
    gl.bindVertexArray(r.sVao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, S.splashes);
    // 4. Drops
    for (let i = 0; i < S.drops; i++) {
      r.dInst[i * 6] = S.dp[i * 3]; r.dInst[i * 6 + 1] = S.dp[i * 3 + 1]; r.dInst[i * 6 + 2] = S.dp[i * 3 + 2];
      r.dInst[i * 6 + 3] = S.dv[i * 3]; r.dInst[i * 6 + 4] = S.dv[i * 3 + 1]; r.dInst[i * 6 + 5] = S.dv[i * 3 + 2];
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, r.dBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, r.dInst, 0, S.drops * 6);
    u = set(r.drop);
    gl.uniform3fv(u("uCam"), cam);
    gl.uniform1f(u("uShutter"), shutter / 1000);
    gl.uniform1f(u("uWidth"), width / 1000);
    gl.uniform1f(u("uPixel"), (2 * Math.tan(look.fov / 2)) / size.h);
    gl.uniform1f(u("uMinPx"), minPx ? 1 : 0);
    gl.uniform3fv(u("uTint"), [0.78, 0.82, 0.88]);
    gl.uniform1f(u("uAlpha"), 0.95);
    gl.bindVertexArray(r.dVao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, S.drops);
    // Debug: the rain volume that travels with the camera
    if (showBox) {
      const x0 = cam[0] - box, x1 = cam[0] + box, z0 = cam[2] - box, z1 = cam[2] + box, y0 = 0.02, y1 = cam[1] + H - 1.7;
      const c = [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]];
      const e = [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7];
      gl.bindBuffer(gl.ARRAY_BUFFER, r.lBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(e.flatMap(i => c[i])));
      set(r.line);
      gl.bindVertexArray(r.lVao);
      gl.drawArrays(gl.LINES, 0, 24);
    }
    gl.disable(gl.BLEND);
    gl.depthMask(true);

    if (Math.abs(stats.drops - S.drops) > 20 || Math.abs(stats.splashes - S.splashes) > 10 || Math.abs(stats.ripples - S.ripples) > 5)
      setStats({ drops: S.drops, splashes: S.splashes, ripples: S.ripples });
  };

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;
  const sliders: [string, number, (v: number) => void, number, number, number, string][] = [
    ["density", density, setDensity, 0, 60, 1, " /s·m²"],
    ["wind", wind, setWind, -6, 6, 0.1, " m/s"],
    ["shutter", shutter, setShutter, 0, 60, 1, " ms"],
    ["drop width", width, setWidth, 0.5, 6, 0.1, " mm"],
    ["splash droplets", splashN, setSplashN, 0, 10, 1, ""],
    ["volume half-size", box, setBox, 3, 20, 0.5, " m"],
  ];

  return (
    <figure ref={vis.ref} className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figRain_title", "Rain — Streaks, Splashes and Ripples")}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{tx(t, "figRain_hint", "drag to look around · the pond is ahead")}</span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2 relative">
        <GLView<Res> init={init} draw={draw} look={look} onLook={l => setLook({ ...l, pitch: Math.max(-1.2, Math.min(1.0, l.pitch)) })} fovRange={[0.5, 1.6]}
          frame={[look, time, density, wind, shutter, width, splashN, box, walk, showBox, minPx, epoch]} aspect={16 / 9} />
        <div className="absolute top-3 left-3 font-mono text-[10px] text-white/85 bg-black/45 rounded px-2 py-1 pointer-events-none leading-relaxed">
          <div>{stats.drops} {tx(t, "figRain_drops", "drops")} · {stats.splashes} {tx(t, "figRain_splashes", "splash droplets")} · {stats.ripples} {tx(t, "figRain_ripples", "ripples")}</div>
          <div>4 {tx(t, "figRain_calls", "draw calls")} · {(((stats.drops * 6 + stats.splashes * 4 + stats.ripples * 3) * 4) / 1024).toFixed(0)} KB {tx(t, "figRain_upload", "uploaded / frame")}</div>
        </div>
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {sliders.map(([label, v, setV, min, max, step, unit]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-28 shrink-0">{label}</span>
              <input type="range" min={min} max={max} step={step} value={v} onChange={e => setV(Number(e.target.value))} className="flex-1 min-w-0 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-20 text-right">{v}{unit}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button className={btn(walk)} onClick={() => setWalk(v => !v)}>{walk ? "✓ " : ""}{tx(t, "figRain_walk", "walk forward")}</button>
          <button className={btn(showBox)} onClick={() => setShowBox(v => !v)}>{showBox ? "✓ " : ""}{tx(t, "figRain_box", "show rain volume")}</button>
          <button className={btn(minPx)} onClick={() => setMinPx(v => !v)}>{minPx ? "✓ " : ""}{tx(t, "figRain_minpx", "at least 1 px wide")}</button>
          <button className={btn(prewarm)} onClick={() => setPrewarm(v => !v)}>{prewarm ? "✓ " : ""}{tx(t, "figRain_prewarm", "prewarm")}</button>
          <button className={btn(false)} onClick={() => setEpoch(e => e + 1)}>↻ {tx(t, "figRain_restart", "restart")}</button>
          <button className={btn(false)} onClick={() => setPaused(p => !p)}>{paused ? "▶ play" : "❚❚ pause"}</button>
        </div>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {tx(t, "figRain_note", "Walk forward with the volume shown: the box moves with you, and drops leaving one side re-enter on the other, so a few thousand particles fake rain over the whole city. Set the shutter to 0 and the streaks collapse into dots: the long lines are motion blur, not the shape of a drop. Untick the 1-pixel rule and look into the distance: thin far streaks break into flickering dashes.")}
        </p>
      </div>
    </figure>
  );
}
