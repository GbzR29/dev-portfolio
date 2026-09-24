"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, loadTexture2D, forwardFrom, type Vec3 } from "../gl";
import { GLView, useAnimationTime, type Look } from "../GLView";
import { uploadMesh, wallPNUT, cubePNUT, trs, type Mesh } from "../glx";
import { mapUrl } from "../protoTexture";

// ── What this figure shows ────────────────────────────────────────────────────
// A flat quad that looks like bricks. The normal map stores a tangent-space
// normal per texel as a colour (n = 2·rgb − 1); the TBN matrix built from the
// vertex normal and tangent turns it into world space before lighting.

const VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aUV;
layout(location = 3) in vec3 aTangent;
uniform mat4 uModel, uView, uProjection;
out vec3 vWorld; out vec2 vUV; out mat3 vTBN;
void main() {
  vec4 w = uModel * vec4(aPos, 1.0);
  vWorld = w.xyz; vUV = aUV;
  vec3 N = normalize(mat3(uModel) * aNormal);
  vec3 T = normalize(mat3(uModel) * aTangent);
  T = normalize(T - dot(T, N) * N);          // Gram-Schmidt: keep T ⟂ N
  vec3 B = cross(N, T);
  vTBN = mat3(T, B, N);                       // columns: tangent space → world
  gl_Position = uProjection * uView * w;
}`;

const FS = `#version 300 es
precision highp float;
in vec3 vWorld; in vec2 vUV; in mat3 vTBN;
uniform sampler2D uAlbedo, uNormalMap;
uniform vec3 uLight, uCam;
uniform float uUseMap, uStrength, uMode, uMarker;
out vec4 FragColor;
void main() {
  if (uMarker > 0.5) { FragColor = vec4(1.0, 0.93, 0.75, 1.0); return; }
  vec3 nTex = texture(uNormalMap, vUV).rgb * 2.0 - 1.0;   // [0,1] → [-1,1]
  nTex.xy *= uStrength;
  vec3 N = uUseMap > 0.5 ? normalize(vTBN * nTex) : vTBN[2];
  vec3 L = normalize(uLight - vWorld), V = normalize(uCam - vWorld);
  vec3 albedo = pow(texture(uAlbedo, vUV).rgb, vec3(2.2));
  float diff = max(dot(N, L), 0.0);
  float spec = pow(max(dot(N, normalize(L + V)), 0.0), 32.0) * 0.25;
  float d = length(uLight - vWorld);
  float att = 1.0 / (1.0 + 0.09 * d + 0.032 * d * d);
  vec3 c = albedo * 0.05 + att * (albedo * diff + spec) * 2.2;
  if (uMode > 0.5 && uMode < 1.5) c = pow(texture(uNormalMap, vUV).rgb, vec3(2.2));   // show the map
  else if (uMode > 1.5) c = vec3(att * diff * 1.4);                                    // lighting only
  FragColor = vec4(pow(c, vec3(1.0 / 2.2)), 1.0);
}`;

// ── Procedural bricks (generated in UV space: row y ↔ v = y / size) ──────────
const SIZE = 256, ROWS = 6, COLS = 3, MORTAR = 0.035;
const hash = (x: number, y: number) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };

function brickHeight(u: number, v: number) {
  const row = Math.floor(v * ROWS);
  const off = row % 2 ? 0.5 / COLS : 0;
  const bu = ((u + off) * COLS) % 1, bv = (v * ROWS) % 1;
  const edge = Math.min(bu, 1 - bu, bv * (COLS / ROWS) * 2, (1 - bv) * (COLS / ROWS) * 2) / COLS;  // distance to mortar in u units
  const bevel = Math.min(1, Math.max(0, (edge - MORTAR * 0.5) / 0.03));
  const noise = (hash(Math.floor(u * 120), Math.floor(v * 120)) - 0.5) * 0.08;
  return bevel * 0.9 + noise * bevel;
}

function makeBrickMaps(): { albedo: HTMLCanvasElement; normal: HTMLCanvasElement } {
  const mk = () => { const c = document.createElement("canvas"); c.width = c.height = SIZE; return c; };
  const albedo = mk(), normal = mk();
  const ga = albedo.getContext("2d")!, gn = normal.getContext("2d")!;
  const ia = ga.createImageData(SIZE, SIZE), inn = gn.createImageData(SIZE, SIZE);
  const e = 1 / SIZE, k = 18;                     // gradient step and bump scale
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const u = (x + 0.5) / SIZE, v = (y + 0.5) / SIZE;
    const h = brickHeight(u, v);
    // Tangent-space normal from the height gradient: (−∂h/∂u, −∂h/∂v, 1)
    const dhdu = (brickHeight(u + e, v) - brickHeight(u - e, v)) / (2 * e);
    const dhdv = (brickHeight(u, v + e) - brickHeight(u, v - e)) / (2 * e);
    let nx = -dhdu / k, ny = -dhdv / k, nz = 1;
    const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    const o = (y * SIZE + x) * 4;
    inn.data[o] = (nx * 0.5 + 0.5) * 255; inn.data[o + 1] = (ny * 0.5 + 0.5) * 255; inn.data[o + 2] = (nz * 0.5 + 0.5) * 255; inn.data[o + 3] = 255;
    const row = Math.floor(v * ROWS), col = Math.floor((u + (row % 2 ? 0.5 / COLS : 0)) * COLS);
    const tone = 0.85 + hash(row, col) * 0.3;
    const brick = h > 0.3;
    const base = brick ? [0.62 * tone, 0.3 * tone, 0.22 * tone] : [0.55, 0.53, 0.5];
    const grain = 0.9 + hash(x, y) * 0.2;
    ia.data[o] = base[0] * grain * 255; ia.data[o + 1] = base[1] * grain * 255; ia.data[o + 2] = base[2] * grain * 255; ia.data[o + 3] = 255;
  }
  ga.putImageData(ia, 0, 0); gn.putImageData(inn, 0, 0);
  return { albedo, normal };
}

type Res = { prog: WebGLProgram; wall: Mesh; cube: Mesh; albedo: WebGLTexture; normal: WebGLTexture };

export function NormalMapFigure({ t }: { t?: TrackTranslations }) {
  const [look, setLook] = useState<Look>({ yaw: 0.35, pitch: -0.05, fov: 0.8 });
  const [useMap, setUseMap] = useState(true);
  const [strength, setStrength] = useState(1);
  const [view, setView] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [hover, setHover] = useState<{ u: number; v: number } | null>(null);
  const time = useAnimationTime(animate);
  const preview = useRef<HTMLCanvasElement>(null);
  const maps = useMemo(() => (typeof document === "undefined" ? null : makeBrickMaps()), []);

  const light: Vec3 = [Math.sin(time * 0.9) * 1.6, Math.cos(time * 0.7) * 0.9, 0.9];
  const f = forwardFrom(look.yaw, look.pitch);
  const cam: Vec3 = [-f[0] * 3.4, -f[1] * 3.4, -f[2] * 3.4];

  useEffect(() => {
    const c = preview.current;
    if (!c || !maps) return;
    c.getContext("2d")!.drawImage(maps.normal, 0, 0, c.width, c.height);
  }, [maps]);

  const init = async (gl: WebGL2RenderingContext): Promise<Res> => {
    const m = maps ?? makeBrickMaps();
    const [albedo, normal] = await Promise.all([
      loadTexture2D(gl, mapUrl("bricks_diffuse") ?? m.albedo, true),     // the wall tiles it 2×2
      loadTexture2D(gl, mapUrl("bricks_normal") ?? m.normal, true),
    ]);
    return { prog: compileProgram(gl, VS, FS), wall: uploadMesh(gl, wallPNUT(2)), cube: uploadMesh(gl, cubePNUT()), albedo, normal };
  };

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    gl.viewport(0, 0, size.w, size.h);
    gl.clearColor(0.03, 0.035, 0.05, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    const p = r.prog, u = (n: string) => gl.getUniformLocation(p, n);
    gl.useProgram(p);
    gl.uniformMatrix4fv(u("uView"), false, mat4.lookAt(cam, [0, 0, 0], [0, 1, 0]));
    gl.uniformMatrix4fv(u("uProjection"), false, mat4.perspective(look.fov, size.aspect, 0.05, 50));
    gl.uniform3fv(u("uLight"), light);
    gl.uniform3fv(u("uCam"), cam);
    gl.uniform1f(u("uUseMap"), useMap ? 1 : 0);
    gl.uniform1f(u("uStrength"), strength);
    gl.uniform1f(u("uMode"), view);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, r.albedo); gl.uniform1i(u("uAlbedo"), 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, r.normal); gl.uniform1i(u("uNormalMap"), 1);
    gl.uniform1f(u("uMarker"), 0);
    gl.uniformMatrix4fv(u("uModel"), false, trs([0, 0, 0], [4, 4, 1]));
    gl.bindVertexArray(r.wall.vao);
    gl.drawArrays(gl.TRIANGLES, 0, r.wall.count);
    gl.uniform1f(u("uMarker"), 1);
    gl.uniformMatrix4fv(u("uModel"), false, trs(light, 0.08));
    gl.bindVertexArray(r.cube.vao);
    gl.drawArrays(gl.TRIANGLES, 0, r.cube.count);
  };

  // Decode the hovered texel of the preview
  let decoded: { rgb: number[]; n: number[] } | null = null;
  if (hover && maps) {
    const x = Math.min(SIZE - 1, Math.floor(hover.u * SIZE)), y = Math.min(SIZE - 1, Math.floor(hover.v * SIZE));
    const d = maps.normal.getContext("2d")!.getImageData(x, y, 1, 1).data;
    const rgb = [d[0] / 255, d[1] / 255, d[2] / 255];
    decoded = { rgb, n: rgb.map(c => c * 2 - 1) };
  }

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figNMap_title", "Normal Mapping — Detail Without Geometry")}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{tx(t, "figScene_hint", "drag to orbit · scroll to zoom")}</span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> init={init} draw={draw} look={look} onLook={setLook} fovRange={[0.35, 1.2]}
          frame={[look, useMap, strength, view, time]} aspect={16 / 9} />
      </div>
      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="space-y-2 min-w-0">
          <div className="flex gap-1.5 flex-wrap">
            <button className={btn(useMap)} onClick={() => setUseMap(v => !v)}>{useMap ? "✓ " : ""}normal map</button>
            {["shaded", "normal map", "lighting only"].map((l, i) => (
              <button key={l} className={btn(view === i)} onClick={() => setView(i)}>{l}</button>
            ))}
            <button className={btn(animate)} onClick={() => setAnimate(v => !v)}>{animate ? "❚❚ light" : "▶ light"}</button>
          </div>
          <label className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-[var(--text-muted)] w-16">strength</span>
            <input type="range" min={0} max={3} step={0.05} value={strength} onChange={e => setStrength(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
            <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{strength.toFixed(2)}</span>
          </label>
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            {tx(t, "figNMap_note", "It is one flat quad — two triangles. Switch the map off and the wall goes flat; switch to lighting only and watch the bricks' bevels catch the moving light on one side and fall into shade on the other.")}
          </p>
        </div>
        <div className="space-y-1.5">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{tx(t, "figNMap_decode", "Hover to decode")}</p>
          <canvas ref={preview} width={140} height={140} className="w-[140px] h-[140px] rounded border border-[var(--code-border)] cursor-crosshair"
            onPointerMove={e => { const q = e.currentTarget.getBoundingClientRect(); setHover({ u: (e.clientX - q.left) / q.width, v: (e.clientY - q.top) / q.height }); }}
            onPointerLeave={() => setHover(null)} />
          <div className="font-mono text-[10px] leading-5 text-[var(--text-main)] min-h-[40px]">
            {decoded ? (<>
              <div>rgb ({decoded.rgb.map(v => v.toFixed(2)).join(", ")})</div>
              <div>n = 2·rgb − 1 = ({decoded.n.map(v => v.toFixed(2)).join(", ")})</div>
            </>) : <div className="text-[var(--text-muted)]">{tx(t, "figNMap_decodeHint", "mostly (0.5, 0.5, 1) — straight out")}</div>}
          </div>
        </div>
      </div>
    </figure>
  );
}
