"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, forwardFrom, norm, type Vec3 } from "../../kit/gl/gl";
import { GLView, type Look } from "../../kit/gl/GLView";
import {
  ortho, uploadMesh, cubePNUT, spherePNUT, planePNUT, makeDepthTarget, FULL_VS, drawFullscreen,
  SHADOW_SCENE, type Mesh, type DepthTarget,
} from "../../kit/gl/glx";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// Real two-pass shadow mapping. Pass 1 renders the scene's depth from the
// light into a texture; pass 2 renders from the camera and compares each
// fragment's light-space depth with the stored one. Every knob from the
// chapter — bias, slope-scaled bias, PCF, map size, front-face culling — is live.

const DEPTH_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
uniform mat4 uLightSpace, uModel;
void main() { gl_Position = uLightSpace * uModel * vec4(aPos, 1.0); }`;
const DEPTH_FS = `#version 300 es
precision highp float;
void main() {}`;

const VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
uniform mat4 uModel, uView, uProjection, uLightSpace;
out vec3 vWorld; out vec3 vNormal; out vec4 vLightSpace;
void main() {
  vec4 w = uModel * vec4(aPos, 1.0);
  vWorld = w.xyz;
  vNormal = mat3(uModel) * aNormal;
  vLightSpace = uLightSpace * w;
  gl_Position = uProjection * uView * w;
}`;

const FS = `#version 300 es
precision highp float;
in vec3 vWorld; in vec3 vNormal; in vec4 vLightSpace;
uniform highp sampler2D uShadowMap;   // depth needs full precision
uniform vec3 uLightDir, uColor, uCam;
uniform float uBias, uSlopeBias, uPcf, uShadowsOn;
out vec4 FragColor;

float shadowFactor(vec3 N, vec3 L) {
  vec3 p = vLightSpace.xyz / vLightSpace.w;     // manual perspective divide
  p = p * 0.5 + 0.5;                            // NDC → [0, 1]
  if (p.z > 1.0 || any(lessThan(p.xy, vec2(0.0))) || any(greaterThan(p.xy, vec2(1.0)))) return 0.0;
  float bias = uSlopeBias > 0.5 ? max(uBias * 10.0 * (1.0 - dot(N, L)), uBias) : uBias;
  vec2 texel = 1.0 / vec2(textureSize(uShadowMap, 0));
  int r = int(uPcf);
  float s = 0.0, n = 0.0;
  for (int x = -2; x <= 2; x++) for (int y = -2; y <= 2; y++) {
    if (abs(x) > r || abs(y) > r) continue;
    float stored = texture(uShadowMap, p.xy + vec2(x, y) * texel).r;
    s += p.z - bias > stored ? 1.0 : 0.0;
    n += 1.0;
  }
  return s / n;
}

void main() {
  vec3 N = normalize(vNormal);
  vec3 L = normalize(-uLightDir);
  vec3 V = normalize(uCam - vWorld);
  float diff = max(dot(N, L), 0.0);
  float spec = diff > 0.0 ? pow(max(dot(N, normalize(L + V)), 0.0), 64.0) * 0.3 : 0.0;
  float shadow = uShadowsOn > 0.5 ? shadowFactor(N, L) : 0.0;
  vec3 c = uColor * 0.18 + (1.0 - shadow) * (uColor * diff + spec);
  FragColor = vec4(pow(c, vec3(1.0 / 2.2)), 1.0);
}`;

const SHOW_FS = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uTex;
out vec4 FragColor;
void main() { float d = texture(uTex, vUV).r; FragColor = vec4(vec3(pow(d, 3.0)), 1.0); }`;

type Res = {
  depthProg: WebGLProgram; prog: WebGLProgram; showProg: WebGLProgram;
  meshes: Record<"cube" | "sphere" | "plane", Mesh>;
  target: DepthTarget; fullVao: WebGLVertexArrayObject;
};
const SIZES = [256, 512, 1024, 2048];

export function ShadowMapFigure({ t }: { t?: TrackTranslations }) {
  const [look, setLook] = useState<Look>({ yaw: 0.5, pitch: -0.45, fov: 0.8 });
  const [az, setAz] = useState(35), [el, setEl] = useState(40);
  const [bias, setBias] = useState(0.002);
  const [slopeBias, setSlopeBias] = useState(true);
  const [pcf, setPcf] = useState(1);
  const [sizeIdx, setSizeIdx] = useState(1);
  const [cullFront, setCullFront] = useState(false);
  const [shadowsOn, setShadowsOn] = useState(true);
  const [showMap, setShowMap] = useState(true);
  const resRef = useRef<Res | null>(null);

  const lightDir: Vec3 = norm([
    -Math.cos((el * Math.PI) / 180) * Math.sin((az * Math.PI) / 180),
    -Math.sin((el * Math.PI) / 180),
    -Math.cos((el * Math.PI) / 180) * Math.cos((az * Math.PI) / 180),
  ]);
  const f = forwardFrom(look.yaw, look.pitch);
  const cam: Vec3 = [-f[0] * 10, -f[1] * 10 + 0.5, -f[2] * 10];

  const init = (gl: WebGL2RenderingContext): Res => {
    const r: Res = {
      depthProg: compileProgram(gl, DEPTH_VS, DEPTH_FS),
      prog: compileProgram(gl, VS, FS),
      showProg: compileProgram(gl, FULL_VS, SHOW_FS),
      meshes: { cube: uploadMesh(gl, cubePNUT()), sphere: uploadMesh(gl, spherePNUT(24, 36)), plane: uploadMesh(gl, planePNUT()) },
      target: makeDepthTarget(gl, SIZES[sizeIdx]),
      fullVao: gl.createVertexArray()!,
    };
    resRef.current = r;
    return r;
  };

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    if (r.target.size !== SIZES[sizeIdx]) {
      gl.deleteFramebuffer(r.target.fbo); gl.deleteTexture(r.target.tex);
      r.target = makeDepthTarget(gl, SIZES[sizeIdx]);
    }
    // The light's camera: orthographic, looking along the light direction
    const lp: Vec3 = [-lightDir[0] * 9, -lightDir[1] * 9, -lightDir[2] * 9];
    const lightSpace = mat4.multiply(ortho(-6, 6, -6, 6, 1, 20), mat4.lookAt(lp, [0, 0, 0], Math.abs(lightDir[1]) > 0.99 ? [0, 0, 1] : [0, 1, 0]));

    const drawScene = (prog: WebGLProgram, withColor: boolean) => {
      const uModel = gl.getUniformLocation(prog, "uModel"), uColor = gl.getUniformLocation(prog, "uColor");
      for (const it of SHADOW_SCENE) {
        const m = r.meshes[it.mesh];
        gl.uniformMatrix4fv(uModel, false, it.model);
        if (withColor) gl.uniform3fv(uColor, it.color.map(c => Math.pow(c, 2.2)));
        gl.bindVertexArray(m.vao);
        gl.drawArrays(gl.TRIANGLES, 0, m.count);
      }
    };

    // ── Pass 1: depth from the light ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, r.target.fbo);
    gl.viewport(0, 0, r.target.size, r.target.size);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    if (cullFront) { gl.enable(gl.CULL_FACE); gl.cullFace(gl.FRONT); } else gl.disable(gl.CULL_FACE);
    gl.useProgram(r.depthProg);
    gl.uniformMatrix4fv(gl.getUniformLocation(r.depthProg, "uLightSpace"), false, lightSpace);
    drawScene(r.depthProg, false);
    gl.disable(gl.CULL_FACE);

    // ── Pass 2: the scene from the camera ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, size.w, size.h);
    gl.clearColor(0.05, 0.06, 0.08, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const p = r.prog, u = (n: string) => gl.getUniformLocation(p, n);
    gl.useProgram(p);
    gl.uniformMatrix4fv(u("uView"), false, mat4.lookAt(cam, [0, 0.5, 0], [0, 1, 0]));
    gl.uniformMatrix4fv(u("uProjection"), false, mat4.perspective(look.fov, size.aspect, 0.1, 100));
    gl.uniformMatrix4fv(u("uLightSpace"), false, lightSpace);
    gl.uniform3fv(u("uLightDir"), lightDir);
    gl.uniform3fv(u("uCam"), cam);
    gl.uniform1f(u("uBias"), bias);
    gl.uniform1f(u("uSlopeBias"), slopeBias ? 1 : 0);
    gl.uniform1f(u("uPcf"), pcf);
    gl.uniform1f(u("uShadowsOn"), shadowsOn ? 1 : 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, r.target.tex);
    gl.uniform1i(u("uShadowMap"), 0);
    drawScene(p, true);

    // ── Inset: the depth map itself ──
    if (showMap) {
      const s = Math.round(Math.min(size.w, size.h) * 0.3);
      gl.viewport(size.w - s - 8, size.h - s - 8, s, s);
      gl.disable(gl.DEPTH_TEST);
      gl.useProgram(r.showProg);
      gl.uniform1i(gl.getUniformLocation(r.showProg, "uTex"), 0);
      drawFullscreen(gl, r.fullVao);
      gl.enable(gl.DEPTH_TEST);
    }
  };

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;
  const slider = (label: string, v: number, set: (n: number) => void, min: number, max: number, step: number, fmt = (x: number) => String(x)) => (
    <label className="flex items-center gap-2">
      <span className="text-[9px] font-mono text-[var(--text-muted)] w-20">{label}</span>
      <input type="range" min={min} max={max} step={step} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
      <span className="text-[10px] font-mono text-[var(--primary)] w-14 text-right">{fmt(v)}</span>
    </label>
  );

  return (
    <FigureShell>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figShadow_title", "Shadow Mapping — Both Passes, Live")}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{tx(t, "figShadow_hint", "drag to orbit · inset: depth seen from the light")}</span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> orbit init={init} draw={draw} look={look} onLook={setLook} fovRange={[0.4, 1.2]}
          frame={[look, az, el, bias, slopeBias, pcf, sizeIdx, cullFront, shadowsOn, showMap]} aspect={16 / 9} />
      </div>
      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          {slider("light azimuth", az, setAz, -180, 180, 1, v => `${v}°`)}
          {slider("light elevation", el, setEl, 12, 88, 1, v => `${v}°`)}
          {slider("bias", bias, setBias, 0, 0.02, 0.0005, v => v.toFixed(4))}
          <div className="flex gap-1.5 flex-wrap items-center pt-1">
            <span className="text-[9px] font-mono text-[var(--text-muted)] w-20">map size</span>
            {SIZES.map((s, i) => <button key={s} className={btn(sizeIdx === i)} onClick={() => setSizeIdx(i)}>{s}</button>)}
          </div>
          <div className="flex gap-1.5 flex-wrap items-center">
            <span className="text-[9px] font-mono text-[var(--text-muted)] w-20">PCF</span>
            {[0, 1, 2].map(k => <button key={k} className={btn(pcf === k)} onClick={() => setPcf(k)}>{2 * k + 1}×{2 * k + 1}</button>)}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex gap-1.5 flex-wrap">
            <button className={btn(shadowsOn)} onClick={() => setShadowsOn(v => !v)}>{shadowsOn ? "✓ " : ""}shadows</button>
            <button className={btn(slopeBias)} onClick={() => setSlopeBias(v => !v)}>{slopeBias ? "✓ " : ""}slope-scaled bias</button>
            <button className={btn(cullFront)} onClick={() => setCullFront(v => !v)}>{cullFront ? "✓ " : ""}cull front faces (pass 1)</button>
            <button className={btn(showMap)} onClick={() => setShowMap(v => !v)}>{showMap ? "✓ " : ""}depth map</button>
          </div>
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            {tx(t, "figShadow_note", "Set bias to 0 and turn off slope-scaling: acne crawls over every lit surface. Push bias up to 0.02: shadows detach from the boxes (peter-panning). Drop the map to 256 and the edges go blocky — then turn PCF up to 5×5 to soften them.")}
          </p>
        </div>
      </div>
    </FigureShell>
  );
}
