"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, SKYBOX_CUBE, loadCubemap, loadTexture2D, forwardFrom, norm, type Vec3 } from "./gl";
import { GLView, rayDir, skySources, faceHref, type Look, type SkySource } from "./GLView";

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

const FS_PROC = `#version 300 es
precision highp float;
in vec3 vDir;
uniform vec3 uSun;
out vec4 FragColor;
void main() {
  vec3 d = normalize(vDir);
  float sunH = uSun.y;                                       // −1 night … 1 noon
  float day = smoothstep(-0.25, 0.35, sunH);
  float dusk = exp(-pow(sunH * 5.0, 2.0));                  // strongest near the horizon

  vec3 zenith  = mix(vec3(0.02, 0.03, 0.08), vec3(0.18, 0.40, 0.78), day);
  vec3 horizon = mix(vec3(0.05, 0.07, 0.15), vec3(0.78, 0.86, 0.94), day);
  horizon = mix(horizon, vec3(1.0, 0.45, 0.2), dusk * 0.8);

  vec3 c;
  if (d.y >= 0.0) {
    c = mix(horizon, zenith, pow(d.y, 0.45));
    float s = max(dot(d, uSun), 0.0);
    c += vec3(1.0, 0.8, 0.55) * (pow(s, 64.0) * 0.9 + pow(s, 6.0) * 0.25 * day);
    c += step(0.9985, s) * vec3(1.0, 0.95, 0.85);
  } else {
    vec2 g = d.xz / -d.y;                                    // ground plane y = −1
    vec2 w = abs(fract(g) - 0.5);
    float line = (1.0 - smoothstep(0.46, 0.49, max(w.x, w.y))) * min(1.0, -d.y * 3.0);
    vec3 ground = mix(vec3(0.29, 0.36, 0.3), vec3(0.52, 0.6, 0.54), 1.0 - line) * (0.25 + 0.75 * day);
    c = mix(ground, horizon, pow(1.0 - min(1.0, -d.y * 4.0), 3.0));
  }
  FragColor = vec4(c, 1.0);
}`;

type Kind = "cube" | "equi" | "proc";
type Res = {
  gl: WebGL2RenderingContext; vao: WebGLVertexArrayObject;
  progs: Record<Kind, WebGLProgram>; cube: WebGLTexture; pano: WebGLTexture;
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
  const [sources, setSources] = useState<SkySource[]>([]);
  const resRef = useRef<Res | null>(null);

  useEffect(() => { setSources(skySources()); }, []);
  const src = sources[0];
  const panoHref = useMemo(() => (src ? faceHref(src.equirect) : ""), [src]);
  const faceHrefs = useMemo(() => (src ? src.faces.map(faceHref) : []), [src]);

  const sun: Vec3 = norm([
    Math.cos((sunEl * Math.PI) / 180) * Math.sin((sunAz * Math.PI) / 180),
    Math.sin((sunEl * Math.PI) / 180),
    -Math.cos((sunEl * Math.PI) / 180) * Math.cos((sunAz * Math.PI) / 180),
  ]);

  const init = async (gl: WebGL2RenderingContext): Promise<Res> => {
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, SKYBOX_CUBE, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
    const s = skySources()[0];
    const r: Res = {
      gl, vao,
      progs: { cube: compileProgram(gl, VS, FS_CUBE), equi: compileProgram(gl, VS, FS_EQUI), proc: compileProgram(gl, VS, FS_PROC) },
      cube: await loadCubemap(gl, s.faces),
      pano: await loadTexture2D(gl, s.equirect),
    };
    resRef.current = r;
    return r;
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
    if (kind === "cube") {
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, r.cube);
      gl.uniform1i(gl.getUniformLocation(p, "uSky"), 0);
    } else if (kind === "equi") {
      gl.bindTexture(gl.TEXTURE_2D, r.pano);
      gl.uniform1i(gl.getUniformLocation(p, "uPano"), 0);
      gl.uniform1f(gl.getUniformLocation(p, "uFixSeam"), fixSeam ? 1 : 0);
      gl.uniform1f(gl.getUniformLocation(p, "uGrid"), grid ? 1 : 0);
    } else {
      gl.uniform3fv(gl.getUniformLocation(p, "uSun"), sun);
    }
    gl.bindVertexArray(r.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
  };

  // Panorama coordinate of the hovered (or central) ray, for the marker
  const d = hover ? rayDir(look, aspect, hover.x, hover.y) : forwardFrom(look.yaw, look.pitch);
  const u = Math.atan2(d[2], d[0]) / (2 * Math.PI) + 0.5, v = 0.5 - Math.asin(Math.max(-1, Math.min(1, d[1]))) / Math.PI;

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
vec3 c = mix(horizon, zenith, pow(dir.y, 0.45));
c += sunColor * pow(max(dot(dir, uSun), 0.0), 64.0);`;

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
          frame={[kind, look, fixSeam, grid, sunEl, sunAz, aspect]} aspect={16 / 9} />
      </div>

      <div className="p-4 md:p-5 grid gap-5 md:grid-cols-2">
        {/* What the sky is made of */}
        <div className="space-y-2 min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            {tx(t, "figSkyT_source", "Source data")}
          </p>
          {kind === "cube" && (
            <div className="grid grid-cols-6 gap-1">
              {faceHrefs.map((h, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={h} alt="" className="w-full aspect-square rounded-sm border border-[var(--code-border)]" />
              ))}
            </div>
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
