"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, SKYBOX_CUBE, makeTexture2D, forwardFrom, dot as dot3, FACE_NAMES, CROSS_CELLS, crossCellOf } from "../kit/gl/gl";
import { GLView, rayDir, faceHref, useSky, skyTexture, SkyPicker, type Look, type SkyImages } from "../kit/gl/GLView";
import { PROC_SKY_FS, DEFAULT_SKY_PARAMS, setSkyUniforms, sunDirection } from "./sky/proceduralSky";

// ── What this figure shows ────────────────────────────────────────────────────
// Three ways to put a sky behind a scene, rendered by the same skybox cube:
// a cube map, one equirectangular panorama, and a sky computed in the shader.
// Only the fragment shader changes between them — that is the whole point.

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

const FS_CUBE = `#version 300 es
precision highp float;
in vec3 vDir;
uniform samplerCube uSky;
out vec4 FragColor;
void main() { FragColor = vec4(texture(uSky, vDir).rgb, 1.0); }`;

const FS_EQUI = `#version 300 es
precision highp float;
in vec3 vDir;
uniform sampler2D uPano;
uniform float uFixSeam;
uniform float uGrid;
out vec4 FragColor;
const float PI = 3.14159265;
void main() {
  vec3 d = normalize(vDir);
  // Direction → longitude/latitude → panorama UV
  vec2 uv = vec2(atan(d.z, d.x) / (2.0 * PI) + 0.5, 0.5 - asin(d.y) / PI);
  vec3 c = uFixSeam > 0.5
    ? textureLod(uPano, uv, 0.0).rgb     // no mip selection → no seam
    : texture(uPano, uv).rgb;            // derivatives jump at u = 0|1 → seam
  if (uGrid > 0.5) {
    // Lines every 15°: evenly spaced in the image, bunched up toward the poles
    vec2 g = abs(fract(uv * vec2(24.0, 12.0)) - 0.5);
    float line = 1.0 - smoothstep(0.0, fwidth(uv.x * 24.0) * 1.5, 0.5 - g.x);
    line = max(line, 1.0 - smoothstep(0.0, fwidth(uv.y * 12.0) * 1.5, 0.5 - g.y));
    c = mix(c, vec3(1.0, 0.55, 0.1), line * 0.8);
  }
  FragColor = vec4(c, 1.0);
}`;

// The procedural tab uses the chapter's layered sky (see sky/proceduralSky.ts)
const FS_PROC = PROC_SKY_FS;

type Kind = "cube" | "equi" | "proc";
type Res = {
  vao: WebGLVertexArrayObject; progs: Record<Kind, WebGLProgram>;
  skyTex?: WebGLTexture | null; skyFrom?: SkyImages | null;
  pano?: WebGLTexture | null; panoFrom?: SkyImages | null;
};

const f2 = (n: number) => n.toFixed(2);

export function SkyboxTypesFigure({ t }: { t?: TrackTranslations }) {
  const [kind, setKind] = useState<Kind>("cube");
  const [look, setLook] = useState<Look>({ yaw: 0.6, pitch: 0.15, fov: 1.35 });
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const [aspect, setAspect] = useState(16 / 9);
  const [fixSeam, setFixSeam] = useState(false);
  const [grid, setGrid] = useState(false);
  const [sunEl, setSunEl] = useState(18);
  const [sunAz, setSunAz] = useState(55);
  const sky = useSky();
  const panoHref = useMemo(() => (sky.images ? faceHref(sky.images.equirect) : ""), [sky.images]);
  const faceHrefs = useMemo(() => (sky.images ? sky.images.faces.map(faceHref) : []), [sky.images]);
  const sun = sunDirection(sunEl, sunAz);

  const init = (gl: WebGL2RenderingContext): Res => {
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, SKYBOX_CUBE, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
    return {
      vao,
      progs: { cube: compileProgram(gl, VS, FS_CUBE), equi: compileProgram(gl, VS, FS_EQUI), proc: compileProgram(gl, VS, FS_PROC) },
    };
  };

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    if (size.aspect !== aspect) setAspect(size.aspect);
    gl.viewport(0, 0, size.w, size.h);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    const p = r.progs[kind];
    const f = forwardFrom(look.yaw, look.pitch);
    gl.useProgram(p);
    gl.uniformMatrix4fv(gl.getUniformLocation(p, "uView"), false, mat4.stripTranslation(mat4.lookAt([0, 0, 0], f, [0, 1, 0])));
    gl.uniformMatrix4fv(gl.getUniformLocation(p, "uProjection"), false, mat4.perspective(look.fov, size.aspect, 0.1, 10));
    gl.activeTexture(gl.TEXTURE0);
    const cube = skyTexture(gl, r, sky.images);
    if (sky.images && r.panoFrom !== sky.images) {
      if (r.pano) gl.deleteTexture(r.pano);
      r.pano = makeTexture2D(gl, sky.images.equirect);
      r.panoFrom = sky.images;
    }
    if (kind !== "proc" && !cube) return;
    if (kind === "cube") {
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, cube);
      gl.uniform1i(gl.getUniformLocation(p, "uSky"), 0);
    } else if (kind === "equi") {
      gl.bindTexture(gl.TEXTURE_2D, r.pano ?? null);
      gl.uniform1i(gl.getUniformLocation(p, "uPano"), 0);
      gl.uniform1f(gl.getUniformLocation(p, "uFixSeam"), fixSeam ? 1 : 0);
      gl.uniform1f(gl.getUniformLocation(p, "uGrid"), grid ? 1 : 0);
    } else {
      setSkyUniforms(gl, p, { ...DEFAULT_SKY_PARAMS, sunEl, sunAz });
    }
    gl.bindVertexArray(r.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
  };

  // Panorama coordinate of the hovered (or central) ray, for the marker
  const d = hover ? rayDir(look, aspect, hover.x, hover.y) : forwardFrom(look.yaw, look.pitch);
  const u = Math.atan2(d[2], d[0]) / (2 * Math.PI) + 0.5, v = 0.5 - Math.asin(Math.max(-1, Math.min(1, d[1]))) / Math.PI;
  // …and in the cross: the cell looking most along d, then d projected onto its image axes
  const cell = CROSS_CELLS.reduce((best, c) => (dot3(c.fwd, d) > dot3(best.fwd, d) ? c : best));
  const along = dot3(cell.fwd, d);
  const crossAt = {
    x: (cell.col + (dot3(cell.right, d) / along + 1) / 2) / 4,
    y: (cell.row + (dot3(cell.down, d) / along + 1) / 2) / 3,
  };

  const tabs: [Kind, string, string][] = [
    ["cube", "figSkyT_cube", "Cube map"],
    ["equi", "figSkyT_equi", "Equirectangular"],
    ["proc", "figSkyT_proc", "Procedural"],
  ];
  const btn = (active: boolean) =>
    `px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all ${active
      ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]"
      : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40"}`;

  const shader = kind === "cube"
    ? "vec3 c = texture(uSky, dir).rgb;          // samplerCube: the GPU picks the face"
    : kind === "equi"
      ? `vec2 uv = vec2(atan(dir.z, dir.x) / (2.0 * PI) + 0.5,
               0.5 - asin(dir.y) / PI);
vec3 c = ${fixSeam ? "textureLod(uPano, uv, 0.0)" : "texture(uPano, uv)"}.rgb;`
      : `// no texture at all: colour from the direction and a sun uniform
vec3 c = sky(dir);   // scattering + sun + stars + clouds
// built step by step in "A procedural sky" below`;

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figSkyT_title", "Three Kinds of Sky")}
        </span>
        <div className="flex gap-1.5 flex-wrap">
          {tabs.map(([k, key, label]) => (
            <button key={k} className={btn(kind === k)} onClick={() => setKind(k)}>{tx(t, key, label)}</button>
          ))}
        </div>
      </div>

      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> init={init} draw={draw} look={look} onLook={setLook} onHover={setHover}
          frame={[kind, look, fixSeam, grid, sunEl, sunAz, aspect, sky.images]} aspect={16 / 9} />
      </div>

      <div className="p-4 md:p-5 grid gap-5 md:grid-cols-2">
        {/* What the sky is made of */}
        <div className="space-y-2 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
              {tx(t, "figSkyT_source", "Source data")}
            </p>
            {kind !== "proc" && <SkyPicker sources={sky.sources} value={sky.id} onChange={sky.setId} busy={sky.busy} />}
          </div>
          {kind === "cube" && sky.images?.cross && (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sky.images.cross} alt="" className="w-full rounded border border-[var(--code-border)] bg-black" />
              {CROSS_CELLS.map((c, i) => (
                <span key={i} className="absolute text-[9px] font-mono font-bold text-white [text-shadow:0_0_3px_#000]"
                  style={{ left: `${(c.col / 4) * 100 + 1}%`, top: `${(c.row / 3) * 100 + 1}%` }}>
                  {FACE_NAMES[[0, 1, 2, 3, 4, 5].find(f => crossCellOf(f) === c)!]}
                </span>
              ))}
              <span className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-amber-500 border-2 border-white"
                style={{ left: `${crossAt.x * 100}%`, top: `${crossAt.y * 100}%` }} />
            </div>
          )}
          {kind === "cube" && (
            <div className="grid grid-cols-6 gap-1">
              {faceHrefs.map((h, i) => (
                <div key={i} className="space-y-0.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={h} alt="" className="w-full aspect-square rounded-sm border border-[var(--code-border)]" />
                  <p className="text-[8px] font-mono text-center text-[var(--text-muted)]">{FACE_NAMES[i]}</p>
                </div>
              ))}
            </div>
          )}
          {kind === "cube" && sky.images?.cross && (
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              {tx(t, "figSkyT_crossNote", "Above: the file as downloaded, a 4×3 cross seen from inside. Below: the six faces cut from it, in the order and orientation glTexImage2D expects — several come out mirrored or turned, which is the cube map convention, not a bug.")}
            </p>
          )}
          {kind === "equi" && panoHref && (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={panoHref} alt="" className="w-full rounded border border-[var(--code-border)]" />
              <span className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-amber-500 border-2 border-white"
                style={{ left: `${u * 100}%`, top: `${v * 100}%` }} />
            </div>
          )}
          {kind === "proc" && (
            <div className="space-y-1.5 pt-1">
              {([["sun elevation", sunEl, setSunEl, -25, 85], ["sun azimuth", sunAz, setSunAz, -180, 180]] as const).map(([label, value, set, min, max]) => (
                <label key={label} className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-[var(--text-muted)] w-24">{label}</span>
                  <input type="range" min={min} max={max} step={1} value={value}
                    onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
                  <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{value}°</span>
                </label>
              ))}
              <p className="text-[11px] font-mono text-[var(--text-muted)]">uSun = ({sun.map(f2).join(", ")})</p>
            </div>
          )}
          {kind === "equi" && (
            <div className="flex gap-1.5 flex-wrap">
              <button className={btn(fixSeam)} onClick={() => setFixSeam(v => !v)}>{fixSeam ? "✓ " : ""}{tx(t, "figSkyT_fix", "fix the seam")}</button>
              <button className={btn(grid)} onClick={() => setGrid(v => !v)}>{grid ? "✓ " : ""}{tx(t, "figSkyT_grid", "15° lat/long grid")}</button>
            </div>
          )}
        </div>

        {/* How it is sampled */}
        <div className="space-y-2 min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            {tx(t, "figSkyT_shader", "Fragment shader")}
          </p>
          <pre className="text-[10px] font-mono rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 overflow-x-auto leading-relaxed text-[var(--code-text)] whitespace-pre">{shader}</pre>
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            {kind === "cube" && tx(t, "figSkyT_cubeNote", "Six square images, no distortion anywhere and hardware filtering across the edges. The standard choice for a static sky and for reflections.")}
            {kind === "equi" && (fixSeam
              ? tx(t, "figSkyT_equiFixed", "textureLod skips mip selection, so the seam disappears. The real fix keeps mips: convert the panorama to a cube map once at load time (render it into the six faces).")
              : tx(t, "figSkyT_equiNote", "One 2:1 image — how HDRIs are shared. Look behind you (the −X direction): a thin seam where u wraps from 1 to 0, because the GPU picks a tiny mip level there. Turn on the grid and look up: every meridian squeezes into the pole."))}
            {kind === "proc" && tx(t, "figSkyT_procNote", "No texture memory, infinite resolution and it can change every frame — drag the sun below the horizon for a sunset. The cost moves to the fragment shader, and it only looks as good as the formula.")}
          </p>
        </div>
      </div>
    </figure>
  );
}
