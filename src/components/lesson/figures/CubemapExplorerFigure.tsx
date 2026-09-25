"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import {
  mat4, compileProgram, SKYBOX_CUBE, dirToFace, FACE_NAMES, FACE_FILES, forwardFrom, type Vec3,
} from "./gl";
import { GLView, rayDir, faceHref, useSky, skyTexture, SkyPicker, type Look, type SkyImages } from "./GLView";

// ── What this figure shows ────────────────────────────────────────────────────
// You stand inside a real samplerCube. Hover any pixel: the figure shows the
// direction that pixel sends to texture(), which face the GPU picks (largest
// component wins) and where on that face it lands — the same arithmetic as the
// OpenGL spec. The unfolded cube on the right marks the same texel.

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

const FS = `#version 300 es
precision highp float;
in vec3 vDir;
uniform samplerCube uSky;
uniform float uShowFaces;
uniform vec3 uHoverDir;
uniform float uHover;
out vec4 FragColor;

vec3 faceTint(vec3 d) {
  vec3 a = abs(d);
  if (a.x >= a.y && a.x >= a.z) return d.x > 0.0 ? vec3(1.0, 0.35, 0.35) : vec3(0.3, 0.9, 0.9);
  if (a.y >= a.z)               return d.y > 0.0 ? vec3(0.35, 1.0, 0.4) : vec3(0.95, 0.4, 0.95);
  return d.z > 0.0 ? vec3(0.35, 0.5, 1.0) : vec3(1.0, 0.9, 0.3);
}

void main() {
  vec3 d = normalize(vDir);
  vec3 c = texture(uSky, d).rgb;
  if (uShowFaces > 0.5) {
    vec3 a = abs(d);
    float hi = max(a.x, max(a.y, a.z));
    float mid = a.x + a.y + a.z - hi - min(a.x, min(a.y, a.z));
    float seam = smoothstep(0.975, 0.998, mid / hi);   // two components tie → an edge
    c = mix(c, faceTint(d), 0.28);
    c = mix(c, vec3(1.0), seam * 0.85);
  }
  // A small ring where the hovered ray points
  float h = smoothstep(0.99985, 0.9999, dot(d, normalize(uHoverDir))) - smoothstep(0.99994, 0.99997, dot(d, normalize(uHoverDir)));
  c = mix(c, vec3(1.0, 0.6, 0.1), h * uHover);
  FragColor = vec4(c, 1.0);
}`;

type Res = { prog: WebGLProgram; vao: WebGLVertexArrayObject; skyTex?: WebGLTexture | null; skyFrom?: SkyImages | null };

// Unfolded cube: [−X][+Z][+X][−Z] across, +Y above +Z, −Y below it. With the
// faces stored the way OpenGL stores them, these edges line up seamlessly.
const NET: Record<number, [number, number]> = { 1: [0, 1], 4: [1, 1], 0: [2, 1], 5: [3, 1], 2: [1, 0], 3: [1, 2] };
const CELL = 80;

const f2 = (n: number) => (Math.abs(n) < 0.005 ? 0 : n).toFixed(2);

export function CubemapExplorerFigure({ t }: { t?: TrackTranslations }) {
  const [look, setLook] = useState<Look>({ yaw: 0.35, pitch: 0.12, fov: 1.35 });
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const [showFaces, setShowFaces] = useState(true);
  const sky = useSky({ labels: true });
  const [aspect, setAspect] = useState(16 / 9);

  // Direction under the cursor, or straight ahead
  const dir: Vec3 = hover ? rayDir(look, aspect, hover.x, hover.y) : forwardFrom(look.yaw, look.pitch);
  const hit = dirToFace(dir);
  const ax = Math.abs(dir[0]), ay = Math.abs(dir[1]), az = Math.abs(dir[2]);
  const major = ax >= ay && ax >= az ? 0 : ay >= az ? 1 : 2;
  const ma = [ax, ay, az][major];
  const sc = 2 * hit.s - 1, tc = 2 * hit.t - 1;

  const faceUrls = useMemo(() => (sky.images ? sky.images.faces.map(faceHref) : []), [sky.images]);

  const init = async (gl: WebGL2RenderingContext): Promise<Res> => {
    const prog = compileProgram(gl, VS, FS);
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, SKYBOX_CUBE, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
    return { prog, vao };
  };

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    if (size.aspect !== aspect) setAspect(size.aspect);
    gl.viewport(0, 0, size.w, size.h);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const cube = skyTexture(gl, r, sky.images);
    if (!cube) return;
    const f = forwardFrom(look.yaw, look.pitch);
    const view = mat4.stripTranslation(mat4.lookAt([0, 0, 0], f, [0, 1, 0]));
    const proj = mat4.perspective(look.fov, size.aspect, 0.1, 10);
    gl.useProgram(r.prog);
    gl.uniformMatrix4fv(gl.getUniformLocation(r.prog, "uView"), false, view);
    gl.uniformMatrix4fv(gl.getUniformLocation(r.prog, "uProjection"), false, proj);
    gl.uniform1f(gl.getUniformLocation(r.prog, "uShowFaces"), showFaces ? 1 : 0);
    gl.uniform3fv(gl.getUniformLocation(r.prog, "uHoverDir"), dir);
    gl.uniform1f(gl.getUniformLocation(r.prog, "uHover"), hover ? 1 : 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cube);
    gl.uniform1i(gl.getUniformLocation(r.prog, "uSky"), 0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.bindVertexArray(r.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
  };

  /** Turn to look at the centre of a face (clicked in the net). */
  const lookAtFace = (face: number) => {
    const target: Vec3 = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]][face] as Vec3;
    const pitch = Math.asin(Math.max(-0.999, Math.min(0.999, target[1]))) * 0.97;
    const yaw = Math.abs(target[1]) > 0.9 ? look.yaw : Math.atan2(target[0], -target[2]);
    setLook(l => ({ ...l, yaw, pitch }));
  };

  const hx = (NET[hit.face][0] + hit.s) * CELL, hy = (NET[hit.face][1] + hit.t) * CELL;
  const axisName = "xyz"[major];

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figCube_title", "Inside a Cubemap — Which Face, Which Texel")}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">
          {tx(t, "figCube_hint", "drag to look around · scroll to change FOV · hover to sample")}
        </span>
      </div>

      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> init={init} draw={draw} look={look} onLook={setLook} onHover={setHover}
          frame={[look, hover, showFaces, sky.images, aspect]} aspect={16 / 9} />
      </div>

      <div className="p-4 md:p-5 grid gap-5 md:grid-cols-[1fr_auto]">
        {/* The arithmetic, with the numbers of the hovered ray */}
        <div className="space-y-2.5 min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            {hover ? tx(t, "figCube_hovered", "Ray under the cursor") : tx(t, "figCube_center", "Ray through the centre of the view")}
          </p>
          <div className="font-mono text-[11px] leading-6 text-[var(--text-main)] rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 overflow-x-auto">
            <div>dir = ({f2(dir[0])}, {f2(dir[1])}, {f2(dir[2])})</div>
            <div className="text-[var(--text-muted)]">
              |x| {f2(ax)} · |y| {f2(ay)} · |z| {f2(az)} →{" "}
              <span className="text-[var(--primary)] font-bold">
                {tx(t, "figCube_largest", "largest is")} {axisName} → {FACE_NAMES[hit.face]}
              </span>
            </div>
            <div>ma = {f2(ma)} · sc = {f2(sc * ma)} · tc = {f2(tc * ma)}</div>
            <div>
              s = (sc/ma + 1)/2 = <b>{f2(hit.s)}</b> · t = (tc/ma + 1)/2 = <b>{f2(hit.t)}</b>
            </div>
            <div className="text-[var(--text-muted)]">→ {FACE_FILES[hit.face]}.png, texel ({Math.floor(hit.s * 1024)}, {Math.floor(hit.t * 1024)}) {tx(t, "figCube_of1024", "of a 1024² face")}</div>
          </div>
          <div className="flex gap-1.5 flex-wrap items-center">
            <button onClick={() => setShowFaces(v => !v)}
              className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all ${showFaces
                ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]"
                : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`}>
              {showFaces ? "✓ " : ""}{tx(t, "figCube_showFaces", "tint faces & seams")}
            </button>
            <SkyPicker sources={sky.sources} value={sky.id} onChange={sky.setId} busy={sky.busy} />
          </div>
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            {tx(t, "figCube_note",
              "A cube map is sampled with a direction, not a UV. The GPU picks the face from the largest component, divides the other two by it, and that pair becomes the 2D coordinate on the face. Length never matters — only where the vector points.")}
          </p>
        </div>

        {/* Unfolded cube */}
        <div className="mx-auto">
          <svg viewBox={`0 0 ${CELL * 4} ${CELL * 3}`} className="w-[320px] max-w-full h-auto select-none">
            {Object.entries(NET).map(([fs, [cx, cy]]) => {
              const face = Number(fs);
              const active = face === hit.face;
              return (
                <g key={face} className="cursor-pointer" onClick={() => lookAtFace(face)}>
                  {faceUrls[face] && (
                    <image href={faceUrls[face]} x={cx * CELL} y={cy * CELL} width={CELL} height={CELL} preserveAspectRatio="none" />
                  )}
                  <rect x={cx * CELL + 0.5} y={cy * CELL + 0.5} width={CELL - 1} height={CELL - 1} fill="none"
                    stroke={active ? "#f59e0b" : "rgba(255,255,255,0.35)"} strokeWidth={active ? 2.5 : 1} />
                  <text x={cx * CELL + 4} y={cy * CELL + 12} fill="white" stroke="rgba(0,0,0,0.6)" strokeWidth="2.5"
                    paintOrder="stroke" fontSize="9" fontFamily="monospace" fontWeight="bold">{FACE_NAMES[face]}</text>
                </g>
              );
            })}
            <circle cx={hx} cy={hy} r={5} fill="#f59e0b" stroke="white" strokeWidth="1.5" />
          </svg>
          <p className="text-[10px] font-mono text-[var(--text-muted)] text-center mt-1 max-w-[320px]">
            {tx(t, "figCube_netHint", "the six faces as stored · click one to face it")}
          </p>
        </div>
      </div>
    </figure>
  );
}
