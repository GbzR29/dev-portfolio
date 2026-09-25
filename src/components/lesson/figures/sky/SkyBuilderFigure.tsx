"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, SKYBOX_CUBE, forwardFrom } from "../../kit/gl/gl";
import { GLView, useAnimationTime, type Look } from "../../kit/gl/GLView";
import { useVisible } from "../../kit/figure";
import { DEFAULT_SKY_PARAMS, setSkyUniforms, type SkyParams } from "./proceduralSky";
import { BUILDER_FS, STEPS, type SkyPart } from "./skySteps";

// ── What this figure shows ────────────────────────────────────────────────────
// One sky layer built in small steps. Each step shows its render, the code a
// reader would have written at that point, and why. The last step is the
// real layer function of the full procedural sky.

const VS = `#version 300 es
layout(location = 0) in vec3 aPos;
uniform mat4 uView;
uniform mat4 uProjection;
out vec3 vDir;
void main() {
  vDir = aPos;
  vec4 p = uProjection * uView * vec4(aPos, 1.0);
  gl_Position = p.xyww;
}`;

type Res = { prog: WebGLProgram; vao: WebGLVertexArrayObject };

const PART_SETUP: Record<SkyPart, { index: number; title: string; look: Look; sky: Partial<SkyParams> }> = {
  stars: { index: 0, title: "Stars, step by step", look: { yaw: 0.4, pitch: 0.75, fov: 1.3 }, sky: { sunEl: -30, exposure: 1.6 } },
  clouds: { index: 1, title: "Clouds, step by step", look: { yaw: 0.8, pitch: 0.3, fov: 1.5 }, sky: { sunEl: 20, sunAz: 55, cover: 0.5 } },
  milky: { index: 2, title: "The Milky Way, step by step", look: { yaw: 0.9, pitch: 0.55, fov: 1.6 }, sky: { sunEl: -30, exposure: 2.5 } },
};

export function SkyBuilderFigure({ t, part }: { t?: TrackTranslations; part: SkyPart }) {
  const setup = PART_SETUP[part];
  const steps = STEPS[part];
  const [step, setStep] = useState(0);
  const [look, setLook] = useState<Look>(setup.look);
  const [scale, setScale] = useState(12);
  const [sky, setSky] = useState<SkyParams>({ ...DEFAULT_SKY_PARAMS, ...setup.sky });
  const [animate, setAnimate] = useState(part === "clouds");
  const vis = useVisible<HTMLElement>();
  const time = useAnimationTime(animate && vis.on);

  const init = (gl: WebGL2RenderingContext): Res => {
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, SKYBOX_CUBE, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
    return { prog: compileProgram(gl, VS, BUILDER_FS), vao };
  };

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    gl.viewport(0, 0, size.w, size.h);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    const f = forwardFrom(look.yaw, look.pitch);
    const u = (n: string) => gl.getUniformLocation(r.prog, n);
    gl.useProgram(r.prog);
    gl.uniformMatrix4fv(u("uView"), false, mat4.stripTranslation(mat4.lookAt([0, 0, 0], f, [0, 1, 0])));
    gl.uniformMatrix4fv(u("uProjection"), false, mat4.perspective(look.fov, size.aspect, 0.1, 10));
    setSkyUniforms(gl, r.prog, { ...sky, time });
    gl.uniform1i(u("uPart"), setup.index);
    gl.uniform1i(u("uStep"), step);
    gl.uniform1f(u("uScale"), scale);
    gl.bindVertexArray(r.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
  };

  const cur = steps[step];
  const btn = (active: boolean) =>
    `px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all ${active
      ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]"
      : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40"}`;
  const slider = (label: string, value: number, onChange: (v: number) => void, min: number, max: number, stepSize: number) => (
    <label className="flex items-center gap-2">
      <span className="text-[9px] font-mono text-[var(--text-muted)] w-24 shrink-0">{label}</span>
      <input type="range" min={min} max={max} step={stepSize} value={value}
        onChange={e => onChange(Number(e.target.value))} className="flex-1 min-w-0 accent-[var(--primary)]" />
      <span className="text-[10px] font-mono text-[var(--primary)] w-12 text-right">{+value.toFixed(2)}</span>
    </label>
  );
  const k = `figSkyB_${part}${step}`;

  return (
    <figure ref={vis.ref} className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, `figSkyB_${part}Title`, setup.title)}
        </span>
        <div className="flex gap-1 items-center">
          <button className={btn(false)} disabled={step === 0} onClick={() => setStep(s => Math.max(0, s - 1))}>←</button>
          {steps.map((_, i) => (
            <button key={i} className={`${btn(step === i)} w-7 px-0`} onClick={() => setStep(i)}>{i + 1}</button>
          ))}
          <button className={btn(false)} disabled={step === steps.length - 1} onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))}>→</button>
        </div>
      </div>

      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> init={init} draw={draw} look={look} onLook={setLook}
          frame={[look, step, scale, sky, time]} aspect={16 / 9} fovRange={[0.5, 2.2]} />
      </div>

      <div className="p-4 md:p-5 grid gap-5 md:grid-cols-2">
        <div className="space-y-2 min-w-0">
          <p className="text-[12px] font-semibold text-[var(--text-main)]">
            {tx(t, "figSkyB_step", "Step")} {step + 1} / {steps.length} · {tx(t, `${k}t`, cur.title)}
          </p>
          <pre className="text-[10px] font-mono rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 overflow-x-auto leading-relaxed text-[var(--code-text)] whitespace-pre">{cur.code}</pre>
          <div className="space-y-1.5 pt-1">
            {part === "stars" && step >= 1 && step <= 5 && slider("SCALE", scale, setScale, 3, 80, 1)}
            {part === "stars" && step >= 2 && slider("density", sky.density, v => setSky(s => ({ ...s, density: v })), 0, 1, 0.01)}
            {part === "clouds" && step >= 3 && slider("cover", sky.cover, v => setSky(s => ({ ...s, cover: v })), 0, 1, 0.01)}
            {part === "clouds" && step >= 5 && slider("sun elevation", sky.sunEl, v => setSky(s => ({ ...s, sunEl: v })), -10, 80, 1)}
            {part === "clouds" && step >= 5 && slider("sun azimuth", sky.sunAz, v => setSky(s => ({ ...s, sunAz: v })), -180, 180, 1)}
            {(part !== "clouds" ? step === steps.length - 1 : step >= 4) && (
              <button className={btn(animate)} onClick={() => setAnimate(v => !v)}>{animate ? "❚❚ pause" : "▶ animate"}</button>
            )}
          </div>
        </div>
        <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">{tx(t, `${k}x`, cur.text)}</p>
      </div>
    </figure>
  );
}
