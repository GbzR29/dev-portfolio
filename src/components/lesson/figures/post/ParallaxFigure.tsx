"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, loadTexture2D, forwardFrom, type Vec3 } from "../../kit/gl/gl";
import { GLView, useAnimationTime, type Look } from "../../kit/gl/GLView";
import { useVisible } from "../../kit/figure";
import { uploadMesh, planePNUT, cubePNUT, trs, type Mesh } from "../../kit/gl/glx";
import { mapUrl } from "../../kit/protoTexture";
import { makeBrickMaps } from "../../kit/gl/bricks";

// ── What this figure shows ────────────────────────────────────────────────────
// A single flat quad on the floor, textured as bricks, rendered four ways:
// normal mapping only, plain parallax, steep parallax and parallax occlusion
// mapping. Look at it from a low angle: the bricks should stand up and hide
// the mortar behind them. Layers adapt to the angle (more when grazing).
// Drop bricks_depth.png (white = deep) into public/textures/maps to use a real map.

const VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aUV;
layout(location = 3) in vec3 aTangent;
uniform mat4 uModel, uView, uProjection;
uniform vec3 uLight, uCam;
out vec2 vUV; out vec3 vTanFrag; out vec3 vTanCam; out vec3 vTanLight;
void main() {
  vec4 w = uModel * vec4(aPos, 1.0);
  vec3 N = normalize(mat3(uModel) * aNormal);
  vec3 T = normalize(mat3(uModel) * aTangent);
  T = normalize(T - dot(T, N) * N);
  vec3 B = cross(N, T);
  mat3 toTangent = transpose(mat3(T, B, N));      // world → tangent space
  vTanFrag = toTangent * w.xyz;
  vTanCam = toTangent * uCam;
  vTanLight = toTangent * uLight;
  vUV = aUV;
  gl_Position = uProjection * uView * w;
}`;

const FS = `#version 300 es
precision highp float;
in vec2 vUV; in vec3 vTanFrag; in vec3 vTanCam; in vec3 vTanLight;
uniform sampler2D uAlbedo, uNormalMap, uDepth;
uniform float uScale, uMinLayers, uMaxLayers, uClip, uTiles;
uniform int uMethod, uShow;
out vec4 FragColor;

vec2 parallax(vec2 uv, vec3 V) {
  if (uMethod == 1) {                               // plain parallax: one offset
    float h = texture(uDepth, uv).r;
    return uv - V.xy / V.z * (h * uScale);
  }
  // Steep: more layers when looking at a grazing angle
  float numLayers = mix(uMaxLayers, uMinLayers, abs(V.z));
  float layerDepth = 1.0 / numLayers;
  vec2 deltaUV = V.xy / V.z * uScale / numLayers;  // the full offset P, split into equal steps
  float cur = 0.0;
  vec2 cuv = uv;
  float d = texture(uDepth, cuv).r;
  for (int i = 0; i < 128; i++) {
    if (cur >= d) break;
    cuv -= deltaUV;
    d = texture(uDepth, cuv).r;
    cur += layerDepth;
  }
  if (uMethod == 2) return cuv;
  // POM: interpolate between the layer before and after the hit
  vec2 prev = cuv + deltaUV;
  float after = d - cur;
  float before = texture(uDepth, prev).r - cur + layerDepth;
  float w = after / (after - before);
  return prev * w + cuv * (1.0 - w);
}

void main() {
  vec3 V = normalize(vTanCam - vTanFrag);
  vec2 uv = uMethod == 0 ? vUV : parallax(vUV, V);
  if (uClip > 0.5 && (uv.x < 0.0 || uv.y < 0.0 || uv.x > uTiles || uv.y > uTiles)) discard;
  if (uShow == 1) { FragColor = vec4(vec3(texture(uDepth, uv).r), 1.0); return; }
  if (uShow == 2) { FragColor = vec4(fract(uv), 0.0, 1.0); return; }
  vec3 N = normalize(texture(uNormalMap, uv).rgb * 2.0 - 1.0);
  vec3 L = normalize(vTanLight - vTanFrag), H = normalize(L + V);
  vec3 albedo = pow(texture(uAlbedo, uv).rgb, vec3(2.2));
  float diff = max(dot(N, L), 0.0);
  float spec = pow(max(dot(N, H), 0.0), 32.0) * 0.2;
  vec3 c = albedo * (0.12 + diff * 1.1) + spec;
  FragColor = vec4(pow(c, vec3(1.0 / 2.2)), 1.0);
}`;

const LAMP_FS = `#version 300 es
precision highp float;
out vec4 FragColor;
void main() { FragColor = vec4(1.0, 0.93, 0.75, 1.0); }`;

type Res = { prog: WebGLProgram; lamp: WebGLProgram; floor: Mesh; cube: Mesh; albedo: WebGLTexture; normal: WebGLTexture; depth: WebGLTexture };
const METHODS = ["normal map only", "parallax", "steep parallax", "POM"] as const;
const TILES = 2;

export function ParallaxFigure({ t }: { t?: TrackTranslations }) {
  const [look, setLook] = useState<Look>({ yaw: 0, pitch: -0.42, fov: 0.75 });
  const [method, setMethod] = useState(3);
  const [scale, setScale] = useState(0.08);
  const [maxLayers, setMaxLayers] = useState(32);
  const [clip, setClip] = useState(true);
  const [view, setView] = useState(0);
  const [animate, setAnimate] = useState(true);
  const vis = useVisible<HTMLElement>();
  const time = useAnimationTime(animate && vis.on);
  const maps = useMemo(() => (typeof document === "undefined" ? null : makeBrickMaps()), []);

  const light: Vec3 = [Math.sin(time * 0.8) * 1.4, 0.9, Math.cos(time * 0.6) * 1.2];
  const f = forwardFrom(look.yaw, look.pitch);
  const cam: Vec3 = [-f[0] * 3.2, Math.max(0.12, -f[1] * 3.2), -f[2] * 3.2];

  const init = async (gl: WebGL2RenderingContext): Promise<Res> => {
    const m = maps ?? makeBrickMaps();
    const [albedo, normal, depth] = await Promise.all([
      loadTexture2D(gl, mapUrl("bricks_diffuse") ?? m.albedo, true),
      loadTexture2D(gl, mapUrl("bricks_normal") ?? m.normal, true),
      loadTexture2D(gl, mapUrl("bricks_depth") ?? m.depth, true),
    ]);
    return {
      prog: compileProgram(gl, VS, FS), lamp: compileProgram(gl, VS, LAMP_FS),
      floor: uploadMesh(gl, planePNUT(TILES)), cube: uploadMesh(gl, cubePNUT()), albedo, normal, depth,
    };
  };

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    gl.viewport(0, 0, size.w, size.h);
    gl.clearColor(0.03, 0.035, 0.05, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    const view4 = mat4.lookAt(cam, [0, 0, 0], [0, 1, 0]);
    const proj = mat4.perspective(look.fov, size.aspect, 0.05, 50);
    const p = r.prog, u = (n: string) => gl.getUniformLocation(p, n);
    gl.useProgram(p);
    gl.uniformMatrix4fv(u("uView"), false, view4);
    gl.uniformMatrix4fv(u("uProjection"), false, proj);
    gl.uniform3fv(u("uLight"), light);
    gl.uniform3fv(u("uCam"), cam);
    gl.uniform1f(u("uScale"), scale);
    gl.uniform1f(u("uMinLayers"), 8);
    gl.uniform1f(u("uMaxLayers"), maxLayers);
    gl.uniform1f(u("uClip"), clip ? 1 : 0);
    gl.uniform1f(u("uTiles"), TILES);
    gl.uniform1i(u("uMethod"), method);
    gl.uniform1i(u("uShow"), view);
    [r.albedo, r.normal, r.depth].forEach((tex, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tex); });
    gl.uniform1i(u("uAlbedo"), 0); gl.uniform1i(u("uNormalMap"), 1); gl.uniform1i(u("uDepth"), 2);
    gl.uniformMatrix4fv(u("uModel"), false, trs([0, 0, 0], [3, 1, 3]));
    gl.bindVertexArray(r.floor.vao);
    gl.drawArrays(gl.TRIANGLES, 0, r.floor.count);

    gl.useProgram(r.lamp);
    const l = (n: string) => gl.getUniformLocation(r.lamp, n);
    gl.uniformMatrix4fv(l("uView"), false, view4);
    gl.uniformMatrix4fv(l("uProjection"), false, proj);
    gl.uniformMatrix4fv(l("uModel"), false, trs(light, 0.07));
    gl.bindVertexArray(r.cube.vao);
    gl.drawArrays(gl.TRIANGLES, 0, r.cube.count);
  };

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;

  return (
    <figure ref={vis.ref} className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figParallax_title", "Parallax Mapping — Depth on a Flat Quad")}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{tx(t, "figScene_hint", "drag to orbit · scroll to zoom")}</span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> orbit init={init} draw={draw} look={look} onLook={l => setLook({ ...l, pitch: Math.min(-0.08, l.pitch) })} fovRange={[0.35, 1.2]}
          frame={[look, method, scale, maxLayers, clip, view, time]} aspect={16 / 9} />
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap items-center">
          {METHODS.map((m, i) => <button key={m} className={btn(method === i)} onClick={() => setMethod(i)}>{m}</button>)}
          <span className="w-px h-5 bg-[var(--border)] mx-1" />
          {["shaded", "depth map", "final uv"].map((m, i) => <button key={m} className={btn(view === i)} onClick={() => setView(i)}>{m}</button>)}
          <button className={btn(animate)} onClick={() => setAnimate(v => !v)}>{animate ? "❚❚ light" : "▶ light"}</button>
        </div>
        <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {([["height scale", scale, setScale, 0, 0.2, 0.005], ["max layers", maxLayers, setMaxLayers, 8, 96, 1]] as const).map(([label, v, set, min, max, step]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-20">{label}</span>
              <input type="range" min={min} max={max} step={step} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-12 text-right">{v}</span>
            </label>
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)]">
          <input type="checkbox" checked={clip} onChange={e => setClip(e.target.checked)} className="accent-[var(--primary)]" />
          {tx(t, "figParallax_clip", "discard texels whose uv left [0, 1] (clean silhouette at the edges)")}
        </label>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {tx(t, "figParallax_note", "Drag down to look along the floor. With normal mapping only, the bricks are lit correctly but stay painted on. Plain parallax shifts them but smears at grazing angles; steep parallax shows layer slices when max layers is low; POM keeps the bricks solid and lets them hide the mortar behind them. It is still one flat quad — the silhouette gives it away.")}
        </p>
      </div>
    </figure>
  );
}
