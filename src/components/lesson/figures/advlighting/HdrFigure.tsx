"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, forwardFrom, type Vec3 } from "../../kit/gl/gl";
import { GLView, type Look } from "../../kit/gl/GLView";
import {
  uploadMesh, cubePNUT, trs, ensureColorTarget, FULL_VS, drawFullscreen, type Mesh, type ColorTarget,
} from "../../kit/gl/glx";

// ── What this figure shows ────────────────────────────────────────────────────
// A corridor with a light far brighter than 1.0 at its end, rendered into a
// floating-point framebuffer, then squeezed back into [0, 1] by a tone-mapping
// operator. Switch operators and move the exposure to see what each keeps.

const SCENE_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
uniform mat4 uModel, uView, uProjection;
out vec3 vWorld; out vec3 vNormal;
void main() {
  vec4 w = uModel * vec4(aPos, 1.0);
  vWorld = w.xyz; vNormal = -(mat3(uModel) * aNormal);      // we are inside the tunnel
  gl_Position = uProjection * uView * w;
}`;
const SCENE_FS = `#version 300 es
precision highp float;
in vec3 vWorld; in vec3 vNormal;
uniform vec3 uLightPos[4];
uniform vec3 uLightCol[4];
out vec4 FragColor;
void main() {
  vec3 N = normalize(vNormal);
  vec3 albedo = vec3(0.55);
  vec2 g = abs(fract(vWorld.xz * 0.5) - 0.5);
  albedo *= 0.85 + 0.15 * step(0.46, max(g.x, g.y));
  vec3 c = vec3(0.0);
  for (int i = 0; i < 4; i++) {
    vec3 toL = uLightPos[i] - vWorld;
    float d2 = dot(toL, toL);
    c += uLightCol[i] * albedo * max(dot(N, normalize(toL)), 0.0) / d2;    // physical 1/d²
  }
  FragColor = vec4(c, 1.0);            // no clamp: values above 1.0 survive in RGBA16F
}`;
const TONE_FS = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uHdr;
uniform float uOp, uExposure;
out vec4 FragColor;
vec3 aces(vec3 x) {                      // Narkowicz's fit of the ACES filmic curve
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}
void main() {
  vec3 hdr = texture(uHdr, vUV).rgb * uExposure;
  vec3 m;
  if (uOp < 0.5)      m = clamp(hdr, 0.0, 1.0);          // none: just clip
  else if (uOp < 1.5) m = hdr / (hdr + vec3(1.0));       // Reinhard
  else if (uOp < 2.5) m = vec3(1.0) - exp(-hdr);         // exposure
  else                m = aces(hdr);                      // ACES
  FragColor = vec4(pow(m, vec3(1.0 / 2.2)), 1.0);
}`;

type Res = { scene: WebGLProgram; tone: WebGLProgram; cube: Mesh; full: WebGLVertexArrayObject; target: ColorTarget | null; float: boolean };
const OPS = ["none (clamp)", "Reinhard", "exposure", "ACES"] as const;

const ops = [
  (x: number) => Math.min(1, x),
  (x: number) => x / (x + 1),
  (x: number) => 1 - Math.exp(-x),
  (x: number) => Math.min(1, Math.max(0, (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14))),
];
const OP_COLORS = ["#94a3b8", "#22c55e", "#3b82f6", "#f59e0b"];

export function HdrFigure({ t }: { t?: TrackTranslations }) {
  const [look, setLook] = useState<Look>({ yaw: 0, pitch: 0, fov: 1.1 });
  const [op, setOp] = useState(1);
  const [exposure, setExposure] = useState(1);
  const [bright, setBright] = useState(50);
  const [floatOk, setFloatOk] = useState(true);

  const f = forwardFrom(look.yaw, look.pitch);
  const cam: Vec3 = [0, 0, 8];
  const lights: { p: Vec3; c: Vec3 }[] = [
    { p: [0, 0, -18], c: [bright, bright, bright * 0.9] },
    { p: [-1.4, -0.5, 2], c: [0.3, 0, 0] },
    { p: [0, -1.4, -4], c: [0, 0, 0.35] },
    { p: [1.3, 0.2, -9], c: [0, 0.25, 0] },
  ];

  const init = (gl: WebGL2RenderingContext): Res => ({
    scene: compileProgram(gl, SCENE_VS, SCENE_FS),
    tone: compileProgram(gl, FULL_VS, TONE_FS),
    cube: uploadMesh(gl, cubePNUT()),
    full: gl.createVertexArray()!,
    target: null,
    float: false,
  });

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    r.target = ensureColorTarget(gl, r.target, size.w, size.h, { float: true });
    if (r.target.float !== floatOk) setFloatOk(r.target.float);

    // ── Pass 1: HDR scene ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, r.target.fbo);
    gl.viewport(0, 0, size.w, size.h);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    const s = r.scene, u = (n: string) => gl.getUniformLocation(s, n);
    gl.useProgram(s);
    gl.uniformMatrix4fv(u("uView"), false, mat4.lookAt(cam, [cam[0] + f[0], cam[1] + f[1], cam[2] + f[2]], [0, 1, 0]));
    gl.uniformMatrix4fv(u("uProjection"), false, mat4.perspective(look.fov, size.aspect, 0.1, 100));
    lights.forEach((l, i) => { gl.uniform3fv(u(`uLightPos[${i}]`), l.p); gl.uniform3fv(u(`uLightCol[${i}]`), l.c); });
    gl.uniformMatrix4fv(u("uModel"), false, trs([0, 0, -6], [4, 4, 30]));
    gl.bindVertexArray(r.cube.vao);
    gl.drawArrays(gl.TRIANGLES, 0, r.cube.count);

    // ── Pass 2: tone map to the screen ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(r.tone);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, r.target.tex[0]);
    gl.uniform1i(gl.getUniformLocation(r.tone, "uHdr"), 0);
    gl.uniform1f(gl.getUniformLocation(r.tone, "uOp"), op);
    gl.uniform1f(gl.getUniformLocation(r.tone, "uExposure"), exposure);
    drawFullscreen(gl, r.full);
  };

  // Curves
  const PW = 300, PH = 170, pl = 28, pb = 22, maxX = 6;
  const px = (x: number) => pl + (x / maxX) * (PW - pl - 8), py = (v: number) => 8 + (1 - v) * (PH - 8 - pb);
  const path = (fn: (x: number) => number) => Array.from({ length: 121 }, (_, i) => {
    const x = (i / 120) * maxX; return `${i ? "L" : "M"} ${px(x).toFixed(1)} ${py(fn(x * exposure)).toFixed(1)}`;
  }).join(" ");

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figHdr_title", "HDR and Tone Mapping — Light Beyond 1.0")}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{tx(t, "figHdr_hint", "drag to look around")}</span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> init={init} draw={draw} look={look} onLook={setLook} fovRange={[0.5, 1.4]}
          frame={[look, op, exposure, bright]} aspect={16 / 9} />
        {!floatOk && <p className="text-[11px] font-mono text-red-400 px-2 pt-1">{tx(t, "figHdr_noFloat", "This browser cannot render to float textures — values are clipped to 8 bits, so every operator looks like clamp.")}</p>}
      </div>
      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="space-y-2 min-w-0">
          <div className="flex gap-1.5 flex-wrap">
            {OPS.map((l, i) => <button key={l} className={btn(op === i)} onClick={() => setOp(i)}>{l}</button>)}
          </div>
          {([["exposure", exposure, setExposure, 0.1, 5, 0.05], ["end light", bright, setBright, 1, 200, 1]] as const).map(([label, v, set, min, max, step]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-[var(--text-muted)] w-16">{label}</span>
              <input type="range" min={min} max={max} step={step} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-12 text-right">{v}</span>
            </label>
          ))}
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            {op === 0
              ? tx(t, "figHdr_noneNote", "Without tone mapping everything above 1.0 clips to flat white: the far end of the corridor is a featureless blob and the coloured lights near you are the only detail left.")
              : tx(t, "figHdr_note", "The buffer holds values up to hundreds; the operator decides how to fold them into [0, 1]. Reinhard never clips but flattens highlights; exposure lets you pick what is mid-grey; ACES adds the gentle toe and shoulder of film.")}
          </p>
        </div>
        <svg viewBox={`0 0 ${PW} ${PH}`} className="w-full max-w-[300px] h-auto">
          <line x1={pl} y1={py(1)} x2={PW - 8} y2={py(1)} stroke="var(--code-line)" />
          <line x1={pl} y1={py(0)} x2={PW - 8} y2={py(0)} stroke="var(--code-line)" />
          <text x={pl - 4} y={py(1) + 3} fill="var(--code-muted)" fontSize="8" fontFamily="monospace" textAnchor="end">1</text>
          <text x={pl - 4} y={py(0) + 3} fill="var(--code-muted)" fontSize="8" fontFamily="monospace" textAnchor="end">0</text>
          {[0, 2, 4, 6].map(x => <text key={x} x={px(x)} y={PH - 8} fill="var(--code-muted)" fontSize="8" fontFamily="monospace" textAnchor="middle">{x}</text>)}
          <text x={PW - 8} y={PH - 1} fill="var(--code-muted)" fontSize="8" fontFamily="monospace" textAnchor="end">HDR value</text>
          {ops.map((fn, i) => (
            <path key={i} d={path(fn)} fill="none" stroke={OP_COLORS[i]} strokeWidth={op === i ? 2.6 : 1.1} opacity={op === i ? 1 : 0.55} />
          ))}
        </svg>
      </div>
    </figure>
  );
}
