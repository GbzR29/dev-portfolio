"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, SKYBOX_CUBE, sphereMesh, boxMesh, forwardFrom } from "../kit/gl/gl";
import { GLView, useSky, skyTexture, SkyPicker, type Look, type SkyImages } from "../kit/gl/GLView";
import { Arrow, Label } from "../kit/svg";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// Environment mapping: an object with no texture of its own, coloured entirely
// by looking up the sky cube map along a reflected or refracted direction.

const SKY_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
uniform mat4 uView, uProjection;
out vec3 vDir;
void main() { vDir = aPos; vec4 p = uProjection * uView * vec4(aPos, 1.0); gl_Position = p.xyww; }`;
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
out vec3 vWorld;
out vec3 vNormal;
void main() {
  vec4 w = uModel * vec4(aPos, 1.0);
  vWorld = w.xyz;
  vNormal = mat3(uModel) * aNormal;
  gl_Position = uProjection * uView * w;
}`;
const OBJ_FS = `#version 300 es
precision highp float;
in vec3 vWorld;
in vec3 vNormal;
uniform samplerCube uSky;
uniform vec3 uCameraPos;
uniform float uMode;      // 0 reflect, 1 refract, 2 fresnel
uniform float uIor;
out vec4 FragColor;
void main() {
  vec3 I = normalize(vWorld - uCameraPos);
  vec3 N = normalize(vNormal);
  vec3 R = reflect(I, N);
  vec3 T = refract(I, N, 1.0 / uIor);
  if (dot(T, T) < 1e-4) T = R;                       // total internal reflection
  vec3 c;
  if (uMode < 0.5) c = texture(uSky, R).rgb;
  else if (uMode < 1.5) c = texture(uSky, T).rgb;
  else {
    float f0 = pow((1.0 - uIor) / (1.0 + uIor), 2.0);
    float F = f0 + (1.0 - f0) * pow(1.0 - max(dot(-I, N), 0.0), 5.0);   // Schlick
    c = mix(texture(uSky, T).rgb, texture(uSky, R).rgb, F);
  }
  FragColor = vec4(c, 1.0);
}`;

type Res = {
  sky: WebGLProgram; obj: WebGLProgram; skyVao: WebGLVertexArrayObject;
  sphere: { vao: WebGLVertexArrayObject; count: number }; box: { vao: WebGLVertexArrayObject; count: number };
  skyTex?: WebGLTexture | null; skyFrom?: SkyImages | null;
};
type Mode = 0 | 1 | 2;
const PRESETS: [string, number][] = [["air", 1.0], ["water", 1.33], ["glass", 1.52], ["diamond", 2.42]];

function meshVao(gl: WebGL2RenderingContext, data: Float32Array) {
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

// ── The vectors, in 2D ────────────────────────────────────────────────────────
function RayDiagram({ ior, mode }: { ior: number; mode: Mode }) {
  const W = 260, H = 170, O = { x: 130, y: 92 }, L = 70;
  const inc = (40 * Math.PI) / 180;                             // angle of incidence
  const sinT = Math.sin(inc) / ior;
  const tir = sinT > 1;
  const th = tir ? 0 : Math.asin(sinT);
  const iStart = { x: O.x - Math.sin(inc) * L, y: O.y - Math.cos(inc) * L };
  const rEnd = { x: O.x + Math.sin(inc) * L, y: O.y - Math.cos(inc) * L };
  const tEnd = { x: O.x + Math.sin(th) * L, y: O.y + Math.cos(th) * L };
  const showR = mode !== 1 || tir, showT = mode !== 0 && !tir;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[260px] h-auto">
      <rect x={0} y={O.y} width={W} height={H - O.y} fill="rgba(59,130,246,0.10)" />
      <line x1={0} y1={O.y} x2={W} y2={O.y} stroke="var(--code-muted)" />
      <line x1={O.x} y1={O.y - 78} x2={O.x} y2={O.y + 70} stroke="var(--code-muted)" strokeDasharray="3 3" />
      <Arrow a={iStart} b={O} color="#f59e0b" w={2} head={7} />
      <Arrow a={O} b={{ x: O.x, y: O.y - 55 }} color="#22c55e" w={2} head={7} />
      {showR && <Arrow a={O} b={rEnd} color="#ef4444" w={2} head={7} />}
      {showT && <Arrow a={O} b={tEnd} color="#3b82f6" w={2} head={7} />}
      <Label x={iStart.x - 4} y={iStart.y + 2} anchor="end" color="#f59e0b" bold>I</Label>
      <Label x={O.x + 5} y={O.y - 50} color="#22c55e" bold>N</Label>
      {showR && <Label x={rEnd.x + 4} y={rEnd.y + 2} color="#ef4444" bold>R</Label>}
      {showT && <Label x={tEnd.x + 4} y={tEnd.y} color="#3b82f6" bold>{`T  ${((th * 180) / Math.PI).toFixed(0)}°`}</Label>}
      <Label x={6} y={O.y - 6}>air</Label>
      <Label x={6} y={O.y + 16}>{`IOR ${ior.toFixed(2)}`}</Label>
    </svg>
  );
}

export function EnvMapFigure({ t }: { t?: TrackTranslations }) {
  const [look, setLook] = useState<Look>({ yaw: 0.5, pitch: -0.25, fov: 0.9 });
  const [mode, setMode] = useState<Mode>(0);
  const [ior, setIor] = useState(1.52);
  const [shape, setShape] = useState<"sphere" | "box">("sphere");
  const sky = useSky();

  // Orbit: the camera sits behind the look direction, always aiming at the origin
  const f = forwardFrom(look.yaw, look.pitch);
  const DIST = 3.2;
  const cam: [number, number, number] = [-f[0] * DIST, -f[1] * DIST, -f[2] * DIST];

  const init = async (gl: WebGL2RenderingContext): Promise<Res> => {
    const skyVao = gl.createVertexArray()!;
    gl.bindVertexArray(skyVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, SKYBOX_CUBE, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
    return {
      sky: compileProgram(gl, SKY_VS, SKY_FS), obj: compileProgram(gl, OBJ_VS, OBJ_FS), skyVao,
      sphere: meshVao(gl, sphereMesh()), box: meshVao(gl, boxMesh()),
    };
  };

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    gl.viewport(0, 0, size.w, size.h);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);        // closed meshes: the depth test is enough
    const view = mat4.lookAt(cam, [0, 0, 0], [0, 1, 0]);
    const proj = mat4.perspective(look.fov, size.aspect, 0.1, 50);
    const cube = skyTexture(gl, r, sky.images);
    if (!cube) return;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cube);

    const m = shape === "sphere" ? r.sphere : r.box;
    gl.useProgram(r.obj);
    gl.uniformMatrix4fv(gl.getUniformLocation(r.obj, "uModel"), false, shape === "sphere" ? mat4.identity() : mat4.scale(1.4));
    gl.uniformMatrix4fv(gl.getUniformLocation(r.obj, "uView"), false, view);
    gl.uniformMatrix4fv(gl.getUniformLocation(r.obj, "uProjection"), false, proj);
    gl.uniform3fv(gl.getUniformLocation(r.obj, "uCameraPos"), cam);
    gl.uniform1f(gl.getUniformLocation(r.obj, "uMode"), mode);
    gl.uniform1f(gl.getUniformLocation(r.obj, "uIor"), ior);
    gl.uniform1i(gl.getUniformLocation(r.obj, "uSky"), 0);
    gl.bindVertexArray(m.vao);
    gl.drawArrays(gl.TRIANGLES, 0, m.count);

    gl.depthFunc(gl.LEQUAL);
    gl.useProgram(r.sky);
    gl.uniformMatrix4fv(gl.getUniformLocation(r.sky, "uView"), false, mat4.stripTranslation(view));
    gl.uniformMatrix4fv(gl.getUniformLocation(r.sky, "uProjection"), false, proj);
    gl.uniform1i(gl.getUniformLocation(r.sky, "uSky"), 0);
    gl.bindVertexArray(r.skyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
    gl.depthFunc(gl.LESS);
  };

  const btn = (active: boolean) =>
    `px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all ${active
      ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]"
      : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40"}`;

  const code = mode === 0 ? "vec3 R = reflect(I, N);\nFragColor = texture(uSkybox, R);"
    : mode === 1 ? `vec3 T = refract(I, N, 1.0 / ${ior.toFixed(2)});\nFragColor = texture(uSkybox, T);`
    : `float F = f0 + (1.0 - f0) * pow(1.0 - dot(-I, N), 5.0);\nFragColor = mix(texture(uSkybox, T), texture(uSkybox, R), F);`;

  return (
    <FigureShell>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figEnv_title", "Environment Mapping — Mirror and Glass")}
        </span>
        <div className="flex gap-1.5 flex-wrap">
          {(["reflect", "refract", "fresnel"] as const).map((l, i) => (
            <button key={l} className={btn(mode === i)} onClick={() => setMode(i as Mode)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> orbit init={init} draw={draw} look={look} onLook={setLook}
          frame={[look, mode, ior, shape, sky.images]} aspect={16 / 9} fovRange={[0.4, 1.4]} />
      </div>

      <div className="p-4 md:p-5 grid gap-5 md:grid-cols-[auto_1fr] items-start">
        <RayDiagram ior={ior} mode={mode} />
        <div className="space-y-2.5 min-w-0">
          <div className="flex gap-1.5 flex-wrap items-center">
            <span className="text-[9px] font-mono text-[var(--text-muted)] mr-1">object</span>
            <button className={btn(shape === "sphere")} onClick={() => setShape("sphere")}>sphere</button>
            <button className={btn(shape === "box")} onClick={() => setShape("box")}>box</button>
            <span className="ml-auto"><SkyPicker sources={sky.sources} value={sky.id} onChange={sky.setId} busy={sky.busy} /></span>
          </div>
          {mode !== 0 && (
            <>
              <label className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-[var(--text-muted)] w-8">IOR</span>
                <input type="range" min={1} max={2.5} step={0.01} value={ior}
                  onChange={e => setIor(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
                <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{ior.toFixed(2)}</span>
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {PRESETS.map(([name, v]) => (
                  <button key={name} className={btn(Math.abs(ior - v) < 0.005)} onClick={() => setIor(v)}>{name} {v}</button>
                ))}
              </div>
            </>
          )}
          <pre className="text-[10px] font-mono rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 overflow-x-auto leading-relaxed text-[var(--code-text)] whitespace-pre">{code}</pre>
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            {mode === 0 && tx(t, "figEnv_reflect", "The object has no colour of its own: each pixel bounces the view ray off the surface and reads the sky where it lands. Orbit it and the reflection slides across, because R depends on where the eye is.")}
            {mode === 1 && tx(t, "figEnv_refract", "refract bends the ray into the material by Snell's law. IOR 1.0 is invisible — the ray goes straight through. The higher the index, the stronger the bend and the more the sky behind it appears flipped.")}
            {mode === 2 && tx(t, "figEnv_fresnel", "Real glass does both. Facing it head-on you mostly see through; at grazing angles it turns into a mirror — look at the rim of the sphere. Schlick's approximation gives that blend in one line.")}
          </p>
        </div>
      </div>
    </FigureShell>
  );
}
