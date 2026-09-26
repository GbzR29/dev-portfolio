"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, forwardFrom, type Vec3 } from "../../kit/gl/gl";
import { GLView, type Look } from "../../kit/gl/GLView";
import { planePNUT, uploadMesh, trs, type Mesh } from "../../kit/gl/glx";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// A floor lit by a light close to it, seen at a low angle — the situation
// where Phong breaks. Left half: Phong. Right half: Blinn-Phong. With a low
// shininess, Phong's highlight ends in a hard edge where r̂·v̂ crosses zero.

const VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
uniform mat4 uModel, uView, uProjection;
out vec3 vWorld; out vec3 vNormal;
void main() {
  vec4 w = uModel * vec4(aPos, 1.0);
  vWorld = w.xyz; vNormal = mat3(uModel) * aNormal;
  gl_Position = uProjection * uView * w;
}`;

const FS = `#version 300 es
precision highp float;
in vec3 vWorld; in vec3 vNormal;
uniform vec3 uLight, uCam;
uniform float uShin, uSplitX, uBlinnMul;
out vec4 FragColor;
void main() {
  vec3 N = normalize(vNormal);
  vec3 L = normalize(uLight - vWorld);
  vec3 V = normalize(uCam - vWorld);
  bool blinn = gl_FragCoord.x > uSplitX;
  float spec;
  if (blinn) {
    vec3 H = normalize(L + V);
    spec = pow(max(dot(N, H), 0.0), uShin * uBlinnMul);
  } else {
    vec3 R = reflect(-L, N);
    spec = pow(max(dot(V, R), 0.0), uShin);
  }
  float diff = max(dot(N, L), 0.0);
  vec2 g = abs(fract(vWorld.xz) - 0.5);
  float grid = 1.0 - smoothstep(0.47, 0.49, max(g.x, g.y));
  vec3 albedo = mix(vec3(0.18, 0.2, 0.24), vec3(0.24, 0.26, 0.3), 1.0 - grid);
  vec3 c = albedo * (0.08 + 0.6 * diff) + vec3(0.95, 0.85, 0.65) * spec;
  if (abs(gl_FragCoord.x - uSplitX) < 1.0) c = vec3(1.0);
  FragColor = vec4(c, 1.0);
}`;

type Res = { prog: WebGLProgram; plane: Mesh };

export function BlinnCompareFigure({ t }: { t?: TrackTranslations }) {
  const [look, setLook] = useState<Look>({ yaw: 0, pitch: -0.62, fov: 0.9 });
  const [shin, setShin] = useState(2);
  const [height, setHeight] = useState(0.5);
  const [match, setMatch] = useState(false);

  const f = forwardFrom(look.yaw, look.pitch);
  const target: Vec3 = [0, 0, -3];
  const cam: Vec3 = [target[0] - f[0] * 6, Math.max(0.3, target[1] - f[1] * 6), target[2] - f[2] * 6];
  const light: Vec3 = [0, height, -3];                 // right under the view centre

  const init = (gl: WebGL2RenderingContext): Res => ({ prog: compileProgram(gl, VS, FS), plane: uploadMesh(gl, planePNUT()) });

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    gl.viewport(0, 0, size.w, size.h);
    gl.clearColor(0.03, 0.035, 0.05, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    const u = (n: string) => gl.getUniformLocation(r.prog, n);
    gl.useProgram(r.prog);
    gl.uniformMatrix4fv(u("uModel"), false, trs([0, 0, -4], [30, 1, 30]));
    gl.uniformMatrix4fv(u("uView"), false, mat4.lookAt(cam, target, [0, 1, 0]));
    gl.uniformMatrix4fv(u("uProjection"), false, mat4.perspective(look.fov, size.aspect, 0.1, 100));
    gl.uniform3fv(u("uLight"), light);
    gl.uniform3fv(u("uCam"), cam);
    gl.uniform1f(u("uShin"), shin);
    gl.uniform1f(u("uSplitX"), size.w / 2);
    gl.uniform1f(u("uBlinnMul"), match ? 4 : 1);
    gl.bindVertexArray(r.plane.vao);
    gl.drawArrays(gl.TRIANGLES, 0, r.plane.count);
  };

  return (
    <FigureShell>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figBlinnC_title", "Phong vs Blinn-Phong — Side by Side")}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{tx(t, "figScene_hint", "drag to orbit · scroll to zoom")}</span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2 relative">
        <GLView<Res> orbit init={init} draw={draw} look={look} onLook={setLook} fovRange={[0.4, 1.3]}
          frame={[look, shin, height, match]} aspect={16 / 9} />
        <span className="absolute top-4 left-4 text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-red-300">Phong</span>
        <span className="absolute top-4 right-4 text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-purple-300">Blinn-Phong</span>
      </div>
      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[var(--text-muted)] w-20">shininess</span>
            <input type="range" min={1} max={64} step={1} value={shin} onChange={e => setShin(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
            <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{shin}</span>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[var(--text-muted)] w-20">light height</span>
            <input type="range" min={0.1} max={3} step={0.05} value={height} onChange={e => setHeight(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
            <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{height}</span>
          </label>
          <button onClick={() => setMatch(m => !m)}
            className={`px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${match
              ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)]"}`}>
            {match ? "✓ " : ""}{tx(t, "figBlinnC_match", "Blinn exponent × 4")}
          </button>
        </div>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {tx(t, "figBlinnC_note", "With shininess 1–4 the Phong half shows a highlight that stops dead along a curve: past it r̂·v̂ is negative and the max() clamps it to zero. Blinn-Phong fades out naturally. Turn on the ×4 exponent and the two highlights become almost the same size.")}
        </p>
      </div>
    </FigureShell>
  );
}
