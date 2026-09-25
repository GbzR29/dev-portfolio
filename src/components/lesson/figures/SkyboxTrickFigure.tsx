"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, SKYBOX_CUBE, boxMesh, forwardFrom, type Vec3 } from "../kit/gl/gl";
import { GLView, useSky, skyTexture, SkyPicker, type Look, type SkyImages } from "../kit/gl/GLView";

// ── What this figure shows ────────────────────────────────────────────────────
// A tiny scene with a real skybox, where each line of the skybox recipe is a
// switch: drop the translation from the view matrix, force depth to 1.0 with
// xyww, and draw with GL_LEQUAL. Turn one off and walk around to see exactly
// what it was protecting you from.

const SKY_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
uniform mat4 uView;
uniform mat4 uProjection;
uniform float uXYWW;
out vec3 vDir;
void main() {
  vDir = aPos;
  vec4 p = uProjection * uView * vec4(aPos, 1.0);
  gl_Position = uXYWW > 0.5 ? p.xyww : p;
}`;
const SKY_FS = `#version 300 es
precision highp float;
in vec3 vDir;
uniform samplerCube uSky;
out vec4 FragColor;
void main() { FragColor = vec4(texture(uSky, vDir).rgb, 1.0); }`;

const OBJ_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
uniform mat4 uModel, uView, uProjection;
out vec3 vNormal;
out vec3 vWorld;
void main() {
  vec4 w = uModel * vec4(aPos, 1.0);
  vWorld = w.xyz;
  vNormal = mat3(uModel) * aNormal;
  gl_Position = uProjection * uView * w;
}`;
const OBJ_FS = `#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vWorld;
uniform vec3 uColor;
uniform float uGround;
out vec4 FragColor;
void main() {
  vec3 n = normalize(vNormal);
  float light = 0.35 + 0.65 * max(dot(n, normalize(vec3(0.5, 0.9, 0.4))), 0.0);
  vec3 c = uColor * light;
  if (uGround > 0.5) {
    vec2 g = abs(fract(vWorld.xz) - 0.5);
    float line = 1.0 - smoothstep(0.47, 0.49, max(g.x, g.y));
    c = mix(vec3(0.22, 0.24, 0.28), vec3(0.45, 0.48, 0.55), 1.0 - line);
  }
  FragColor = vec4(c, 1.0);
}`;

type Res = {
  sky: WebGLProgram; obj: WebGLProgram;
  skyVao: WebGLVertexArrayObject; boxVao: WebGLVertexArrayObject;
  skyTex?: WebGLTexture | null; skyFrom?: SkyImages | null;
};

const BOXES: { p: Vec3; s: number; c: Vec3 }[] = [
  { p: [-1.6, 0.5, -2.2], s: 1.0, c: [0.96, 0.6, 0.11] },
  { p: [1.9, 0.75, -4.2], s: 1.5, c: [0.55, 0.25, 0.9] },
  { p: [-0.6, 0.4, -6.5], s: 0.8, c: [0.18, 0.75, 0.38] },
  { p: [2.4, 0.5, -0.6], s: 1.0, c: [0.9, 0.2, 0.3] },
];

const CLEAR: [number, number, number] = [0.42, 0.08, 0.36];     // loud magenta: "nothing was drawn here"

export function SkyboxTrickFigure({ t }: { t?: TrackTranslations }) {
  const [look, setLook] = useState<Look>({ yaw: 0.1, pitch: 0.08, fov: 1.2 });
  const [walk, setWalk] = useState(3.5);          // camera z
  const [strip, setStrip] = useState(true);
  const [xyww, setXyww] = useState(true);
  const [lequal, setLequal] = useState(true);
  const sky = useSky();

  const cam: Vec3 = [0.3, 1.2, walk];

  const init = async (gl: WebGL2RenderingContext): Promise<Res> => {
    const sky = compileProgram(gl, SKY_VS, SKY_FS);
    const obj = compileProgram(gl, OBJ_VS, OBJ_FS);
    const skyVao = gl.createVertexArray()!;
    gl.bindVertexArray(skyVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, SKYBOX_CUBE, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
    const boxVao = gl.createVertexArray()!;
    gl.bindVertexArray(boxVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, boxMesh(), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
    return { sky, obj, skyVao, boxVao };
  };

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    gl.viewport(0, 0, size.w, size.h);
    gl.clearColor(...CLEAR, 1);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);

    const f = forwardFrom(look.yaw, look.pitch);
    const view = mat4.lookAt(cam, [cam[0] + f[0], cam[1] + f[1], cam[2] + f[2]], [0, 1, 0]);
    const proj = mat4.perspective(look.fov, size.aspect, 0.1, 100);

    // 1. The scene, with the ordinary depth test
    gl.depthFunc(gl.LESS);
    gl.useProgram(r.obj);
    gl.uniformMatrix4fv(gl.getUniformLocation(r.obj, "uView"), false, view);
    gl.uniformMatrix4fv(gl.getUniformLocation(r.obj, "uProjection"), false, proj);
    gl.bindVertexArray(r.boxVao);
    const uModel = gl.getUniformLocation(r.obj, "uModel"), uColor = gl.getUniformLocation(r.obj, "uColor");
    const uGround = gl.getUniformLocation(r.obj, "uGround");
    // Ground: a flattened box
    const ground = mat4.multiply(mat4.translation(0, -0.05, -3), new Float32Array([40, 0, 0, 0, 0, 0.1, 0, 0, 0, 0, 40, 0, 0, 0, 0, 1]));
    gl.uniformMatrix4fv(uModel, false, ground);
    gl.uniform1f(uGround, 1);
    gl.uniform3f(uColor, 0.4, 0.4, 0.45);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
    gl.uniform1f(uGround, 0);
    for (const b of BOXES) {
      gl.uniformMatrix4fv(uModel, false, mat4.multiply(mat4.translation(...b.p), mat4.scale(b.s)));
      gl.uniform3fv(uColor, b.c);
      gl.drawArrays(gl.TRIANGLES, 0, 36);
    }

    // 2. The skybox, last, exactly as the chapter's code does it
    const cube = skyTexture(gl, r, sky.images);
    if (!cube) return;
    gl.depthFunc(lequal ? gl.LEQUAL : gl.LESS);
    gl.useProgram(r.sky);
    gl.uniformMatrix4fv(gl.getUniformLocation(r.sky, "uView"), false, strip ? mat4.stripTranslation(view) : view);
    gl.uniformMatrix4fv(gl.getUniformLocation(r.sky, "uProjection"), false, proj);
    gl.uniform1f(gl.getUniformLocation(r.sky, "uXYWW"), xyww ? 1 : 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cube);
    gl.uniform1i(gl.getUniformLocation(r.sky, "uSky"), 0);
    gl.bindVertexArray(r.skyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
    gl.depthFunc(gl.LESS);
  };

  // What the current combination does, in one line
  const verdict: { ok: boolean; key: string; text: string } =
    !strip ? { ok: false, key: "figSky_vNoStrip", text: "The sky is a 2×2 box parked at the world origin. Walk away from it and you see it from outside — the magenta is the clear colour showing through." }
    : !xyww ? { ok: false, key: "figSky_vNoXyww", text: "The sky now has the real depth of a cube one unit away, so it wins the depth test against everything farther than that and paints over the scene." }
    : !lequal ? { ok: false, key: "figSky_vLess", text: "xyww makes every sky fragment's depth exactly 1.0 — the same value the depth buffer was cleared to. GL_LESS rejects 1.0 < 1.0, so no sky is drawn at all." }
    : { ok: true, key: "figSky_vOk", text: "Infinitely far: the sky follows you, never covers the scene, and only fills pixels nothing else touched." };

  const line = (on: boolean, good: string, bad: string, comment: string) => (
    <div className={`px-3 flex gap-3 ${on ? "" : "bg-red-500/10"}`}>
      <span className="whitespace-pre" style={{ color: on ? "var(--code-text)" : "#f87171" }}>{on ? good : bad}</span>
      <span className="ml-auto whitespace-pre text-[var(--code-muted)]">{comment}</span>
    </div>
  );
  const toggle = (on: boolean, set: (v: boolean) => void, label: string) => (
    <button onClick={() => set(!on)}
      className={`px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
        ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
        : "border-red-500/50 text-red-400 bg-red-500/10"}`}>
      {on ? "✓" : "✗"} {label}
    </button>
  );

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figSky_title", "The Skybox Trick — Break It to Understand It")}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">
          {tx(t, "figSky_hint", "drag to look · walk with the slider · switch lines off")}
        </span>
      </div>

      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> init={init} draw={draw} look={look} onLook={setLook}
          frame={[look, walk, strip, xyww, lequal, sky.images]} aspect={16 / 9} />
      </div>

      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap items-center">
          {toggle(strip, setStrip, "mat4(mat3(view))")}
          {toggle(xyww, setXyww, "gl_Position = pos.xyww")}
          {toggle(lequal, setLequal, "glDepthFunc(GL_LEQUAL)")}
          <span className="ml-auto"><SkyPicker sources={sky.sources} value={sky.id} onChange={sky.setId} busy={sky.busy} /></span>
        </div>

        <label className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-[var(--text-muted)] w-20">{tx(t, "figSky_walk", "walk (camera z)")}</span>
          <input type="range" min={-7} max={6} step={0.05} value={walk}
            onChange={e => setWalk(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
          <span className="text-[10px] font-mono text-[var(--primary)] w-12 text-right">{walk.toFixed(1)}</span>
        </label>

        <pre className="text-[10px] font-mono rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] py-2 overflow-x-auto leading-relaxed">
          {line(strip, `skyShader.setMat4("uView", glm::mat4(glm::mat3(view)));`, `skyShader.setMat4("uView", view);`, "// C++")}
          {line(xyww, "gl_Position = pos.xyww;", "gl_Position = pos;", "// skybox.vert")}
          {line(lequal, "glDepthFunc(GL_LEQUAL);", "glDepthFunc(GL_LESS);", "// before the draw")}
        </pre>

        <p className={`text-[12.5px] leading-relaxed border-l-2 pl-3 ${verdict.ok ? "border-emerald-500/60 text-[var(--text-muted)]" : "border-red-500/60 text-[var(--text-main)]"}`}>
          <span className={`font-bold ${verdict.ok ? "text-emerald-400" : "text-red-400"}`}>{verdict.ok ? "✓ " : "✗ "}</span>
          {tx(t, verdict.key, verdict.text)}
        </p>
      </div>
    </figure>
  );
}
