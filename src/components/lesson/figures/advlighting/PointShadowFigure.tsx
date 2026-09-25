"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, forwardFrom, type Vec3 } from "../../kit/gl/gl";
import { GLView, useAnimationTime, type Look } from "../../kit/gl/GLView";
import { useVisible } from "../../kit/figure";
import { uploadMesh, cubePNUT, makeDepthCube, cubeFaceViews, trs, type Mesh, type DepthCube } from "../../kit/gl/glx";

// ── What this figure shows ────────────────────────────────────────────────────
// Omnidirectional shadows: the scene is rendered six times per frame from the
// light, once per cube-map face, storing the LINEAR distance to the light.
// The lighting pass then looks that distance up along the light→fragment
// direction with a samplerCube.

const FAR = 22;

const DEPTH_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
uniform mat4 uModel, uLightViewProj;
out vec3 vWorld;
void main() { vec4 w = uModel * vec4(aPos, 1.0); vWorld = w.xyz; gl_Position = uLightViewProj * w; }`;
const DEPTH_FS = `#version 300 es
precision highp float;
in vec3 vWorld;
uniform vec3 uLightPos;
uniform float uFar;
void main() {
  // Store distance to the light, mapped to [0, 1] — linear, unlike normal depth
  gl_FragDepth = length(vWorld - uLightPos) / uFar;
}`;

const VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
uniform mat4 uModel, uView, uProjection;
uniform float uFlip;
out vec3 vWorld; out vec3 vNormal;
void main() {
  vec4 w = uModel * vec4(aPos, 1.0);
  vWorld = w.xyz; vNormal = mat3(uModel) * aNormal * uFlip;
  gl_Position = uProjection * uView * w;
}`;

const FS = `#version 300 es
precision highp float;
in vec3 vWorld; in vec3 vNormal;
uniform highp samplerCube uDepthCube;
uniform vec3 uLightPos, uColor, uCam;
uniform float uFar, uPcf, uShowDepth, uShadowsOn, uEmissive;
out vec4 FragColor;

const vec3 OFFSETS[20] = vec3[](
  vec3( 1, 1, 1), vec3( 1,-1, 1), vec3(-1,-1, 1), vec3(-1, 1, 1),
  vec3( 1, 1,-1), vec3( 1,-1,-1), vec3(-1,-1,-1), vec3(-1, 1,-1),
  vec3( 1, 1, 0), vec3( 1,-1, 0), vec3(-1,-1, 0), vec3(-1, 1, 0),
  vec3( 1, 0, 1), vec3(-1, 0, 1), vec3( 1, 0,-1), vec3(-1, 0,-1),
  vec3( 0, 1, 1), vec3( 0,-1, 1), vec3( 0,-1,-1), vec3( 0, 1,-1));

float shadowFactor(vec3 toFrag) {
  float current = length(toFrag);
  float bias = 0.05 + 0.02 * current;          // distant fragments cover more of a texel
  if (uPcf < 0.5) {
    float closest = texture(uDepthCube, toFrag).r * uFar;
    return current - bias > closest ? 1.0 : 0.0;
  }
  float s = 0.0;
  float radius = (1.0 + current / uFar) * 0.05;   // wider for distant fragments
  for (int i = 0; i < 20; i++) {
    float closest = texture(uDepthCube, toFrag + OFFSETS[i] * radius).r * uFar;
    s += current - bias > closest ? 1.0 : 0.0;
  }
  return s / 20.0;
}

void main() {
  if (uEmissive > 0.5) { FragColor = vec4(1.0, 0.92, 0.7, 1.0); return; }
  vec3 toFrag = vWorld - uLightPos;
  if (uShowDepth > 0.5) {
    float d = texture(uDepthCube, toFrag).r;
    FragColor = vec4(vec3(pow(d, 0.6)), 1.0);
    return;
  }
  vec3 N = normalize(vNormal), L = normalize(-toFrag), V = normalize(uCam - vWorld);
  float d = length(toFrag);
  float att = 1.0 / (1.0 + 0.045 * d + 0.0075 * d * d);
  float diff = max(dot(N, L), 0.0);
  float spec = diff > 0.0 ? pow(max(dot(N, normalize(L + V)), 0.0), 48.0) * 0.25 : 0.0;
  float shadow = uShadowsOn > 0.5 ? shadowFactor(toFrag) : 0.0;
  vec3 c = uColor * 0.06 + (1.0 - shadow) * att * (uColor * diff + spec) * 1.6;
  FragColor = vec4(pow(c, vec3(1.0 / 2.2)), 1.0);
}`;

type Res = { depthProg: WebGLProgram; prog: WebGLProgram; cube: Mesh; target: DepthCube };

const BOXES: { p: Vec3; s: number; rot: number; c: Vec3 }[] = [
  { p: [-2.5, -1.8, -1.5], s: 1.2, rot: 0.4, c: [0.96, 0.6, 0.11] },
  { p: [2.2, 1.2, -2.5], s: 1.0, rot: 0.9, c: [0.55, 0.25, 0.9] },
  { p: [1.5, -2.2, 2.0], s: 1.6, rot: 0.2, c: [0.18, 0.75, 0.38] },
  { p: [-2.0, 1.8, 2.2], s: 0.9, rot: 1.2, c: [0.9, 0.2, 0.3] },
  { p: [0.3, 0.2, -3.2], s: 0.8, rot: 0.6, c: [0.3, 0.55, 0.95] },
];
const ROOM: Vec3 = [0.7, 0.7, 0.72];

export function PointShadowFigure({ t }: { t?: TrackTranslations }) {
  const [look, setLook] = useState<Look>({ yaw: 0.6, pitch: -0.25, fov: 1.1 });
  const [animate, setAnimate] = useState(true);
  const [pcf, setPcf] = useState(true);
  const [shadowsOn, setShadowsOn] = useState(true);
  const [showDepth, setShowDepth] = useState(false);
  const vis = useVisible<HTMLElement>();
  const time = useAnimationTime(animate && vis.on);

  const light: Vec3 = [Math.sin(time * 0.6) * 2.4, Math.sin(time * 0.9) * 1.2, Math.cos(time * 0.6) * 1.6];
  const f = forwardFrom(look.yaw, look.pitch);
  const cam: Vec3 = [-f[0] * 4.2, -f[1] * 4.2, -f[2] * 4.2];

  const init = (gl: WebGL2RenderingContext): Res => ({
    depthProg: compileProgram(gl, DEPTH_VS, DEPTH_FS),
    prog: compileProgram(gl, VS, FS),
    cube: uploadMesh(gl, cubePNUT()),
    target: makeDepthCube(gl, 512),
  });

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    const items = [
      { m: trs([0, 0, 0], 10), c: ROOM, flip: -1 },
      ...BOXES.map(b => ({ m: trs(b.p, b.s, b.rot), c: b.c, flip: 1 })),
    ];
    const drawItems = (prog: WebGLProgram, color: boolean) => {
      const uModel = gl.getUniformLocation(prog, "uModel");
      gl.bindVertexArray(r.cube.vao);
      for (const it of items) {
        gl.uniformMatrix4fv(uModel, false, it.m);
        if (color) {
          gl.uniform3fv(gl.getUniformLocation(prog, "uColor"), it.c.map(c => Math.pow(c, 2.2)));
          gl.uniform1f(gl.getUniformLocation(prog, "uFlip"), it.flip);
        }
        gl.drawArrays(gl.TRIANGLES, 0, r.cube.count);
      }
    };

    // ── Pass 1: six faces of distance from the light ──
    const proj = mat4.perspective(Math.PI / 2, 1, 0.1, FAR);
    const views = cubeFaceViews(light);
    gl.bindFramebuffer(gl.FRAMEBUFFER, r.target.fbo);
    gl.viewport(0, 0, r.target.size, r.target.size);
    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(r.depthProg);
    gl.uniform3fv(gl.getUniformLocation(r.depthProg, "uLightPos"), light);
    gl.uniform1f(gl.getUniformLocation(r.depthProg, "uFar"), FAR);
    for (let i = 0; i < 6; i++) {
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, r.target.tex, 0);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(gl.getUniformLocation(r.depthProg, "uLightViewProj"), false, mat4.multiply(proj, views[i]));
      drawItems(r.depthProg, false);
    }

    // ── Pass 2: lighting ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, size.w, size.h);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const p = r.prog, u = (n: string) => gl.getUniformLocation(p, n);
    gl.useProgram(p);
    gl.uniformMatrix4fv(u("uView"), false, mat4.lookAt(cam, [0, 0, 0], [0, 1, 0]));
    gl.uniformMatrix4fv(u("uProjection"), false, mat4.perspective(look.fov, size.aspect, 0.05, 50));
    gl.uniform3fv(u("uLightPos"), light);
    gl.uniform3fv(u("uCam"), cam);
    gl.uniform1f(u("uFar"), FAR);
    gl.uniform1f(u("uPcf"), pcf ? 1 : 0);
    gl.uniform1f(u("uShowDepth"), showDepth ? 1 : 0);
    gl.uniform1f(u("uShadowsOn"), shadowsOn ? 1 : 0);
    gl.uniform1f(u("uEmissive"), 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, r.target.tex);
    gl.uniform1i(u("uDepthCube"), 0);
    drawItems(p, true);
    // The bulb
    gl.uniform1f(u("uEmissive"), 1);
    gl.uniformMatrix4fv(u("uModel"), false, trs(light, 0.18));
    gl.drawArrays(gl.TRIANGLES, 0, r.cube.count);
  };

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;

  return (
    <figure ref={vis.ref} className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figPShadow_title", "Point Shadows — Six Faces per Frame")}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{tx(t, "figScene_hint", "drag to orbit · scroll to zoom")}</span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> orbit init={init} draw={draw} look={look} onLook={setLook} fovRange={[0.5, 1.5]}
          frame={[look, time, pcf, shadowsOn, showDepth]} aspect={16 / 9} />
      </div>
      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-2">
        <div className="flex gap-1.5 flex-wrap content-start">
          <button className={btn(animate)} onClick={() => setAnimate(v => !v)}>{animate ? "❚❚ light" : "▶ light"}</button>
          <button className={btn(shadowsOn)} onClick={() => setShadowsOn(v => !v)}>{shadowsOn ? "✓ " : ""}shadows</button>
          <button className={btn(pcf)} onClick={() => setPcf(v => !v)}>{pcf ? "✓ " : ""}PCF (20 samples)</button>
          <button className={btn(showDepth)} onClick={() => setShowDepth(v => !v)}>{showDepth ? "✓ " : ""}show depth cube</button>
        </div>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {showDepth
            ? tx(t, "figPShadow_depthNote", "This is the cube map itself, looked up from each wall: black near the bulb, brighter far away. Each value is the distance from the light to the first thing it hits in that direction.")
            : tx(t, "figPShadow_note", "The light flies around the room and every box casts shadows in all directions at once. Turn PCF off to see the raw, hard-edged result of a single lookup per fragment.")}
        </p>
      </div>
    </figure>
  );
}
