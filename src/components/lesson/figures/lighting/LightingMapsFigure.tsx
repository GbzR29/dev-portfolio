"use client";

import { useEffect, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, boxMeshUV, loadTexture2D, forwardFrom, type Vec3 } from "../gl";
import { GLView, type Look } from "../GLView";
import { mapUrl } from "../protoTexture";

// ── What this figure shows ────────────────────────────────────────────────────
// A crate with three textures: a diffuse map (its colour), a specular map (how
// shiny each texel is) and an emission map (light it gives off by itself).
// The maps are drawn in code, unless public/textures/maps/container_*.png
// exist — then those are used.

const VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aUV;
uniform mat4 uModel, uView, uProjection;
out vec3 vWorld; out vec3 vNormal; out vec2 vUV;
void main() {
  vec4 w = uModel * vec4(aPos, 1.0);
  vWorld = w.xyz; vNormal = mat3(uModel) * aNormal; vUV = aUV;
  gl_Position = uProjection * uView * w;
}`;

const FS = `#version 300 es
precision highp float;
in vec3 vWorld; in vec3 vNormal; in vec2 vUV;
uniform sampler2D uDiffuse, uSpecular, uEmission;
uniform vec3 uLightPos, uCam;
uniform float uMode;        // 0 final, 1 diffuse map, 2 specular map, 3 specular term, 4 specular term (no map)
uniform float uUseEmission;
uniform float uMarker;
out vec4 FragColor;
void main() {
  if (uMarker > 0.5) { FragColor = vec4(1.0, 0.95, 0.8, 1.0); return; }
  vec3 albedo = texture(uDiffuse, vUV).rgb;
  vec3 specMap = texture(uSpecular, vUV).rgb;
  vec3 N = normalize(vNormal);
  vec3 L = normalize(uLightPos - vWorld);
  vec3 V = normalize(uCam - vWorld);
  vec3 R = reflect(-L, N);
  float diff = max(dot(N, L), 0.0);
  float spec = diff > 0.0 ? pow(max(dot(V, R), 0.0), 64.0) : 0.0;

  vec3 ambient  = 0.12 * albedo;
  vec3 diffuse  = diff * albedo;
  vec3 specular = spec * specMap;
  vec3 emission = texture(uEmission, vUV).rgb * uUseEmission;

  vec3 c = ambient + diffuse + specular + emission;
  if (uMode > 0.5 && uMode < 1.5) c = albedo;
  else if (uMode < 2.5 && uMode > 1.5) c = specMap;
  else if (uMode < 3.5 && uMode > 2.5) c = specular;
  else if (uMode > 3.5) c = vec3(spec);
  FragColor = vec4(c, 1.0);
}`;

// ── Procedural crate maps ─────────────────────────────────────────────────────
const SIZE = 256;
const frameW = 0.11;
const hash = (x: number, y: number) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };

function makeMap(kind: "diffuse" | "specular" | "emission"): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = SIZE;
  const g = c.getContext("2d")!;
  const img = g.createImageData(SIZE, SIZE);
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const u = (x + 0.5) / SIZE, v = (y + 0.5) / SIZE;
    const edge = Math.min(u, v, 1 - u, 1 - v);
    const frame = edge < frameW;
    const n = hash(x, y);
    // Rivets at the frame corners and midpoints
    const rivet = frame && [0.055, 0.5, 0.945].some(a => [0.055, 0.5, 0.945].some(b =>
      (a !== 0.5 || b !== 0.5) && Math.hypot(u - a, v - b) < 0.022));
    let r = 0, gg = 0, b = 0;
    if (kind === "diffuse") {
      if (frame) {
        const k = 0.5 + n * 0.08 + (rivet ? 0.18 : 0);
        r = k; gg = k * 1.02; b = k * 1.08;
      } else {
        const plank = Math.floor((v - frameW) / ((1 - 2 * frameW) / 4));
        const gap = Math.abs(((v - frameW) / ((1 - 2 * frameW) / 4)) % 1) < 0.04 ? 0.45 : 1;
        const grain = 0.8 + 0.2 * Math.sin(u * 60 + Math.sin(v * 22 + plank * 3) * 4 + plank * 7) + n * 0.08;
        r = 0.62 * grain * gap; gg = 0.4 * grain * gap; b = 0.2 * grain * gap;
      }
    } else if (kind === "specular") {
      const s = frame ? 0.8 + n * 0.2 - (hash(x * 3, y) > 0.985 ? 0.5 : 0) : 0.03 + n * 0.03;
      r = gg = b = s;
    } else {
      // Glowing circuit lines on the wood
      if (!frame) {
        const lu = Math.abs(((u * 6) % 1) - 0.5) < 0.03 && ((Math.floor(v * 5) + Math.floor(u * 6)) % 3 === 0);
        const lv = Math.abs(((v * 5) % 1) - 0.5) < 0.035 && ((Math.floor(u * 6) + Math.floor(v * 5)) % 2 === 0);
        const on = lu || lv ? 1 : 0;
        r = 0.1 * on; gg = 0.95 * on; b = 0.75 * on;
      }
    }
    const o = (y * SIZE + x) * 4;
    img.data[o] = Math.min(255, r * 255); img.data[o + 1] = Math.min(255, gg * 255); img.data[o + 2] = Math.min(255, b * 255); img.data[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

type Res = { prog: WebGLProgram; vao: WebGLVertexArrayObject; count: number; tex: WebGLTexture[] };
const VIEWS: [string, string][] = [
  ["final", "final"], ["diffuse map", "diffuse map"], ["specular map", "specular map"],
  ["specular (with map)", "specular × map"], ["specular (no map)", "specular, no map"],
];

export function LightingMapsFigure({ t }: { t?: TrackTranslations }) {
  const [look, setLook] = useState<Look>({ yaw: 0.6, pitch: -0.35, fov: 0.75 });
  const [view, setView] = useState(0);
  const [emission, setEmission] = useState(false);
  const [animate, setAnimate] = useState(true);
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (!animate) return;
    let raf = 0, last = performance.now();
    const tick = (now: number) => { setTime(v => v + Math.max(0, now - last) / 1000); last = now; raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animate]);

  const f = forwardFrom(look.yaw, look.pitch);
  const cam: Vec3 = [-f[0] * 3.6, -f[1] * 3.6, -f[2] * 3.6];
  const light: Vec3 = [Math.cos(time * 0.8) * 1.4, 0.8, Math.sin(time * 0.8) * 1.4];

  const init = async (gl: WebGL2RenderingContext): Promise<Res> => {
    const prog = compileProgram(gl, VS, FS);
    const data = boxMeshUV();
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 32, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 32, 24);
    const load = (name: string, kind: "diffuse" | "specular" | "emission") => loadTexture2D(gl, mapUrl(name) ?? makeMap(kind));
    const tex = await Promise.all([
      load("container_diffuse", "diffuse"), load("container_specular", "specular"), load("container_emission", "emission"),
    ]);
    return { prog, vao, count: data.length / 8, tex };
  };

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    gl.viewport(0, 0, size.w, size.h);
    gl.clearColor(0.05, 0.06, 0.08, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    const p = r.prog, u = (n: string) => gl.getUniformLocation(p, n);
    gl.useProgram(p);
    gl.uniformMatrix4fv(u("uView"), false, mat4.lookAt(cam, [0, 0, 0], [0, 1, 0]));
    gl.uniformMatrix4fv(u("uProjection"), false, mat4.perspective(look.fov, size.aspect, 0.1, 50));
    gl.uniform3fv(u("uLightPos"), light);
    gl.uniform3fv(u("uCam"), cam);
    gl.uniform1f(u("uMode"), view);
    gl.uniform1f(u("uUseEmission"), emission ? 1 : 0);
    ["uDiffuse", "uSpecular", "uEmission"].forEach((name, i) => {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, r.tex[i]);
      gl.uniform1i(u(name), i);
    });
    gl.bindVertexArray(r.vao);
    gl.uniform1f(u("uMarker"), 0);
    gl.uniformMatrix4fv(u("uModel"), false, mat4.identity());
    gl.drawArrays(gl.TRIANGLES, 0, r.count);
    // The light
    gl.uniform1f(u("uMarker"), 1);
    const m = mat4.translation(...light); m[0] = m[5] = m[10] = 0.08;
    gl.uniformMatrix4fv(u("uModel"), false, m);
    gl.drawArrays(gl.TRIANGLES, 0, r.count);
  };

  const btn = (active: boolean) =>
    `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${active
      ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]"
      : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figMaps_title", "Lighting Maps — Per-Texel Materials")}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{tx(t, "figScene_hint", "drag to orbit · scroll to zoom")}</span>
      </div>

      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> init={init} draw={draw} look={look} onLook={setLook} fovRange={[0.35, 1.2]}
          frame={[look, view, emission, time]} aspect={16 / 9} />
      </div>

      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-2">
        <div className="space-y-2 min-w-0">
          <div className="flex gap-1.5 flex-wrap">
            {VIEWS.map(([key, label], i) => (
              <button key={key} className={btn(view === i)} onClick={() => setView(i)}>{label}</button>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button className={btn(emission)} onClick={() => setEmission(v => !v)}>{emission ? "✓ " : ""}emission map</button>
            <button className={btn(animate)} onClick={() => setAnimate(v => !v)}>{animate ? "❚❚ light" : "▶ light"}</button>
          </div>
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            {view === 3 || view === 4
              ? tx(t, "figMaps_specNote", "Compare the two specular views: without a map the wooden planks shine like the steel; with the specular map only the metal frame catches the highlight.")
              : tx(t, "figMaps_note", "A material no longer has one colour and one shininess — every texel has its own. Switch views to see each map on its own, then turn the emission map on: it is added after lighting, so it glows even on the side facing away from the light.")}
          </p>
        </div>
        <pre className="text-[10px] font-mono rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 overflow-x-auto leading-relaxed text-[var(--code-text)] whitespace-pre">
{`vec3 albedo   = texture(material.diffuse, TexCoords).rgb;
vec3 ambient  = light.ambient  * albedo;
vec3 diffuse  = light.diffuse  * diff * albedo;
vec3 specular = light.specular * spec
              * texture(material.specular, TexCoords).rgb;
vec3 emission = texture(material.emission, TexCoords).rgb;
FragColor = vec4(ambient + diffuse + specular${emission ? " + emission" : ""}, 1.0);`}
        </pre>
      </div>
    </figure>
  );
}
