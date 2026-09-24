"use client";

import { useEffect, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, boxMesh, sphereMesh, forwardFrom, norm, type Vec3 } from "../gl";
import { GLView, type Look } from "../GLView";

// ── What this figure shows ────────────────────────────────────────────────────
// One small scene lit by a real multi-light Phong shader. The Light Casters
// chapter shows one caster at a time; Multiple Lights turns them all on and
// sums them, exactly like the chapter's fragment shader.

export type SceneMode = "directional" | "point" | "spot" | "multi";

const VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
uniform mat4 uModel, uView, uProjection;
out vec3 vWorld;
out vec3 vNormal;
void main() {
  vec4 w = uModel * vec4(aPos, 1.0);
  vWorld = w.xyz;
  vNormal = mat3(uModel) * aNormal;   // uniform scales only in this scene
  gl_Position = uProjection * uView * w;
}`;

const FS = `#version 300 es
precision highp float;
in vec3 vWorld;
in vec3 vNormal;
uniform vec3 uCam;
uniform vec3 uAlbedo;
uniform float uEmissive;
uniform float uDirOn;   uniform vec3 uDirDir;   uniform vec3 uDirCol;
uniform float uPointOn[4]; uniform vec3 uPointPos[4]; uniform vec3 uPointCol[4];
uniform vec3 uAtt;       // constant, linear, quadratic
uniform float uSpotOn;  uniform vec3 uSpotPos;  uniform vec3 uSpotDir; uniform vec3 uSpotCol;
uniform float uCutOff;  uniform float uOuterCutOff;
out vec4 FragColor;

vec3 phong(vec3 L, vec3 color, vec3 N, vec3 V) {
  float diff = max(dot(N, L), 0.0);
  vec3 R = reflect(-L, N);
  float spec = diff > 0.0 ? pow(max(dot(V, R), 0.0), 32.0) : 0.0;
  return color * (diff * uAlbedo + 0.45 * spec);
}
float attenuation(float d) { return 1.0 / (uAtt.x + uAtt.y * d + uAtt.z * d * d); }

void main() {
  if (uEmissive > 0.5) { FragColor = vec4(uAlbedo, 1.0); return; }
  vec3 N = normalize(vNormal), V = normalize(uCam - vWorld);
  vec3 c = 0.05 * uAlbedo;                                   // a little ambient
  if (uDirOn > 0.5) c += phong(normalize(-uDirDir), uDirCol, N, V);
  for (int i = 0; i < 4; i++) {
    if (uPointOn[i] < 0.5) continue;
    vec3 toL = uPointPos[i] - vWorld;
    float d = length(toL);
    c += attenuation(d) * phong(toL / d, uPointCol[i], N, V);
  }
  if (uSpotOn > 0.5) {
    vec3 toL = uSpotPos - vWorld;
    float d = length(toL);
    vec3 L = toL / d;
    float theta = dot(L, normalize(-uSpotDir));
    float I = clamp((theta - uOuterCutOff) / (uCutOff - uOuterCutOff), 0.0, 1.0);
    c += I * attenuation(d) * phong(L, uSpotCol, N, V);
  }
  FragColor = vec4(c, 1.0);
}`;

type Mesh = { vao: WebGLVertexArrayObject; count: number };
type Res = { prog: WebGLProgram; box: Mesh; sphere: Mesh };

const OBJECTS: { kind: "box" | "sphere"; p: Vec3; s: Vec3; c: Vec3 }[] = [
  { kind: "box", p: [0, -0.05, 0], s: [14, 0.1, 14], c: [0.55, 0.57, 0.6] },
  { kind: "box", p: [-2.1, 0.5, -1.2], s: [1, 1, 1], c: [0.96, 0.6, 0.11] },
  { kind: "box", p: [1.6, 0.75, -2.2], s: [1.5, 1.5, 1.5], c: [0.55, 0.25, 0.9] },
  { kind: "box", p: [2.3, 0.4, 1.6], s: [0.8, 0.8, 0.8], c: [0.18, 0.75, 0.38] },
  { kind: "box", p: [-1.7, 0.35, 1.9], s: [0.7, 0.7, 0.7], c: [0.9, 0.2, 0.3] },
  { kind: "sphere", p: [0.1, 0.65, 0.3], s: [0.65, 0.65, 0.65], c: [0.85, 0.85, 0.88] },
];

const POINT_COLORS: Vec3[] = [[1, 0.35, 0.3], [0.35, 1, 0.45], [0.35, 0.55, 1], [1, 0.95, 0.85]];
const POINT_BASE: Vec3[] = [[-3, 1.3, 0], [3, 1.3, 0.5], [0, 1.3, -3.4], [0.2, 1.3, 3.2]];
const ATT_13: Vec3 = [1, 0.35, 0.44];
const ATT_20: Vec3 = [1, 0.22, 0.2];
const ATT_50: Vec3 = [1, 0.09, 0.032];    // the lamp above the scene sits ~5 units away

function meshVao(gl: WebGL2RenderingContext, data: Float32Array): Mesh {
  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
  return { vao, count: data.length / 6 };
}

const model = (p: Vec3, s: Vec3) => {
  const m = mat4.translation(p[0], p[1], p[2]);
  m[0] = s[0]; m[5] = s[1]; m[10] = s[2];
  return m;
};

export function LightingSceneFigure({ t, mode }: { t?: TrackTranslations; mode: SceneMode }) {
  const [look, setLook] = useState<Look>({ yaw: 0.55, pitch: -0.42, fov: 0.85 });
  // Directional
  const [sunAz, setSunAz] = useState(-40), [sunEl, setSunEl] = useState(45);
  // Point
  const [px, setPx] = useState(-1.2), [pz, setPz] = useState(0.8), [py, setPy] = useState(1.3);
  // Spot
  const [cut, setCut] = useState(18), [outer, setOuter] = useState(25), [aimX, setAimX] = useState(0);
  // Multi
  const [on, setOn] = useState({ dir: true, p0: true, p1: true, p2: true, p3: true, flash: false });
  const [animate, setAnimate] = useState(mode === "multi");
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (!animate) return;
    let raf = 0, last = performance.now();
    const tick = (now: number) => { setTime(v => v + Math.max(0, now - last) / 1000); last = now; raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animate]);

  const target: Vec3 = [0, 0.4, 0];
  const f = forwardFrom(look.yaw, look.pitch);
  const DIST = 9.5;
  const cam: Vec3 = [target[0] - f[0] * DIST, target[1] - f[1] * DIST, target[2] - f[2] * DIST];

  const sunDir: Vec3 = norm([
    -Math.cos((sunEl * Math.PI) / 180) * Math.sin((sunAz * Math.PI) / 180),
    -Math.sin((sunEl * Math.PI) / 180),
    -Math.cos((sunEl * Math.PI) / 180) * Math.cos((sunAz * Math.PI) / 180),
  ]);

  // Point lights for this mode
  const points: { pos: Vec3; col: Vec3; on: boolean }[] = mode === "point"
    ? [{ pos: [px, py, pz], col: [1, 0.95, 0.85], on: true }]
    : mode === "multi"
      ? POINT_BASE.map((b, i) => {
          const a = time * (0.4 + i * 0.12) + i * 1.7;
          const r = Math.hypot(b[0], b[2]);
          return { pos: [Math.cos(a) * r, b[1] + Math.sin(time * 1.3 + i) * 0.3, Math.sin(a) * r] as Vec3, col: POINT_COLORS[i], on: on[`p${i}` as "p0"] };
        })
      : [];

  // Spotlight: a lamp above the scene (spot mode) or a flashlight on the camera (multi)
  const spotPos: Vec3 = mode === "multi" ? cam : [0, 4.2, 3.2];
  const spotAim: Vec3 = mode === "multi" ? [cam[0] + f[0], cam[1] + f[1], cam[2] + f[2]] : [aimX, 0, 0];
  const spotDir = norm([spotAim[0] - spotPos[0], spotAim[1] - spotPos[1], spotAim[2] - spotPos[2]]);
  const spotOn = mode === "spot" || (mode === "multi" && on.flash);
  const cutDeg = mode === "multi" ? 12 : Math.min(cut, outer - 0.5), outerDeg = mode === "multi" ? 17 : outer;

  const init = (gl: WebGL2RenderingContext): Res => ({
    prog: compileProgram(gl, VS, FS),
    box: meshVao(gl, boxMesh()),
    sphere: meshVao(gl, sphereMesh(24, 36)),
  });

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    gl.viewport(0, 0, size.w, size.h);
    gl.clearColor(0.05, 0.06, 0.08, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    const p = r.prog;
    const u = (n: string) => gl.getUniformLocation(p, n);
    gl.useProgram(p);
    gl.uniformMatrix4fv(u("uView"), false, mat4.lookAt(cam, target, [0, 1, 0]));
    gl.uniformMatrix4fv(u("uProjection"), false, mat4.perspective(look.fov, size.aspect, 0.1, 100));
    gl.uniform3fv(u("uCam"), cam);
    gl.uniform3fv(u("uAtt"), mode === "multi" ? ATT_13 : mode === "spot" ? ATT_50 : ATT_20);

    const dirOn = mode === "directional" || (mode === "multi" && on.dir);
    gl.uniform1f(u("uDirOn"), dirOn ? 1 : 0);
    gl.uniform3fv(u("uDirDir"), sunDir);
    gl.uniform3fv(u("uDirCol"), mode === "multi" ? [0.35, 0.35, 0.4] : [1, 0.97, 0.9]);

    for (let i = 0; i < 4; i++) {
      const pt = points[i];
      gl.uniform1f(u(`uPointOn[${i}]`), pt && pt.on ? 1 : 0);
      gl.uniform3fv(u(`uPointPos[${i}]`), pt ? pt.pos : [0, 0, 0]);
      gl.uniform3fv(u(`uPointCol[${i}]`), pt ? pt.col : [0, 0, 0]);
    }
    gl.uniform1f(u("uSpotOn"), spotOn ? 1 : 0);
    gl.uniform3fv(u("uSpotPos"), spotPos);
    gl.uniform3fv(u("uSpotDir"), spotDir);
    gl.uniform3fv(u("uSpotCol"), mode === "spot" ? [1.5, 1.44, 1.28] : [1, 0.96, 0.85]);
    gl.uniform1f(u("uCutOff"), Math.cos((cutDeg * Math.PI) / 180));
    gl.uniform1f(u("uOuterCutOff"), Math.cos((outerDeg * Math.PI) / 180));

    const drawMesh = (m: Mesh, mm: Float32Array, c: Vec3, emissive = false) => {
      gl.uniformMatrix4fv(u("uModel"), false, mm);
      gl.uniform3fv(u("uAlbedo"), c);
      gl.uniform1f(u("uEmissive"), emissive ? 1 : 0);
      gl.bindVertexArray(m.vao);
      gl.drawArrays(gl.TRIANGLES, 0, m.count);
    };
    for (const o of OBJECTS) drawMesh(o.kind === "box" ? r.box : r.sphere, model(o.p, o.s), o.c);
    // Little emissive markers where the lights are
    for (const pt of points) if (pt.on) drawMesh(r.box, model(pt.pos, [0.18, 0.18, 0.18]), pt.col, true);
    if (mode === "spot") drawMesh(r.box, model(spotPos, [0.3, 0.3, 0.3]), [1, 0.96, 0.85], true);
  };

  const slider = (label: string, v: number, set: (n: number) => void, min: number, max: number, step: number, unit = "") => (
    <label className="flex items-center gap-2">
      <span className="text-[9px] font-mono text-[var(--text-muted)] w-20">{label}</span>
      <input type="range" min={min} max={max} step={step} value={v}
        onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
      <span className="text-[10px] font-mono text-[var(--primary)] w-12 text-right">{v}{unit}</span>
    </label>
  );
  const chip = (k: keyof typeof on, label: string, color: string) => (
    <button onClick={() => setOn(s => ({ ...s, [k]: !s[k] }))}
      className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on[k]
        ? "border-[var(--primary)]/50 text-[var(--text-main)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] opacity-60"}`}>
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />{label}
    </button>
  );

  const code = mode === "directional"
    ? `vec3 lightDir = normalize(-light.direction);   // same for every fragment
float diff = max(dot(norm, lightDir), 0.0);`
    : mode === "point"
      ? `vec3 lightDir = normalize(light.position - FragPos);
float d = length(light.position - FragPos);
float attenuation = 1.0 / (light.constant + light.linear * d
                         + light.quadratic * d * d);`
      : mode === "spot"
        ? `float theta = dot(lightDir, normalize(-light.direction));
float epsilon = light.cutOff - light.outerCutOff;
float intensity = clamp((theta - light.outerCutOff) / epsilon, 0.0, 1.0);`
        : `vec3 result = CalcDirLight(dirLight, norm, viewDir);
for (int i = 0; i < NR_POINT_LIGHTS; i++)
    result += CalcPointLight(pointLights[i], norm, FragPos, viewDir);
result += CalcSpotLight(spotLight, norm, FragPos, viewDir);`;

  const titles: Record<SceneMode, [string, string]> = {
    directional: ["figScene_dir", "Directional Light — One Direction for Everything"],
    point: ["figScene_point", "Point Light — Position and Falloff"],
    spot: ["figScene_spot", "Spotlight — A Cone of Light"],
    multi: ["figScene_multi", "Multiple Lights — Just Add Them Up"],
  };

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{tx(t, ...titles[mode])}</span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{tx(t, "figScene_hint", "drag to orbit · scroll to zoom")}</span>
      </div>

      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> init={init} draw={draw} look={look} onLook={setLook} fovRange={[0.4, 1.3]}
          frame={[look, sunAz, sunEl, px, py, pz, cut, outer, aimX, on, time, mode]} aspect={16 / 9} />
      </div>

      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5 min-w-0">
          {mode === "directional" && (<>
            {slider("sun azimuth", sunAz, setSunAz, -180, 180, 1, "°")}
            {slider("sun elevation", sunEl, setSunEl, 5, 90, 1, "°")}
            <p className="text-[11px] font-mono text-[var(--text-muted)] pt-1">direction = ({sunDir.map(v => v.toFixed(2)).join(", ")})</p>
          </>)}
          {mode === "point" && (<>
            {slider("x", px, setPx, -4, 4, 0.05)}
            {slider("height", py, setPy, 0.3, 4, 0.05)}
            {slider("z", pz, setPz, -4, 4, 0.05)}
            <p className="text-[11px] font-mono text-[var(--text-muted)] pt-1">constant 1 · linear 0.22 · quadratic 0.20 (range 20)</p>
          </>)}
          {mode === "spot" && (<>
            {slider("inner (cutOff)", cut, setCut, 3, 40, 0.5, "°")}
            {slider("outer", outer, setOuter, 3.5, 45, 0.5, "°")}
            {slider("aim x", aimX, setAimX, -3, 3, 0.05)}
          </>)}
          {mode === "multi" && (<>
            <div className="flex gap-1.5 flex-wrap">
              {chip("dir", "sun", "#94a3b8")}
              {chip("p0", "red", "#f87171")}
              {chip("p1", "green", "#4ade80")}
              {chip("p2", "blue", "#60a5fa")}
              {chip("p3", "white", "#f5f5f4")}
              {chip("flash", "flashlight", "#fde68a")}
            </div>
            <button onClick={() => setAnimate(a => !a)}
              className={`mt-1 px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${animate
                ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)]"}`}>
              {animate ? "❚❚ stop" : "▶ move the lights"}
            </button>
          </>)}
        </div>
        <pre className="text-[10px] font-mono rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 overflow-x-auto leading-relaxed text-[var(--code-text)] whitespace-pre">{code}</pre>
      </div>
    </figure>
  );
}
