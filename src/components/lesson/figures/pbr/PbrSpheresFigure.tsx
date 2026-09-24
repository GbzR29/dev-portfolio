"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, forwardFrom, SKYBOX_CUBE, SUN_DIR, type Vec3 } from "../gl";
import { GLView, type Look } from "../GLView";
import { uploadMesh, spherePNUT, trs, FULL_VS, drawFullscreen, type Mesh } from "../glx";
import { PBR_GLSL, buildIBL, SKY_VS, SKY_FS, type IBL } from "./ibl";

// ── What this figure shows ────────────────────────────────────────────────────
// The classic PBR test chart: a 7×7 grid of spheres, metallic rising bottom to
// top, roughness rising left to right, shaded with Cook-Torrance.
//   ibl = false       four point lights only (the "PBR Lighting" chapter)
//   ibl = "diffuse"   + the irradiance map as ambient light
//   ibl = "specular"  + prefiltered environment and the BRDF lookup table
// Debug views isolate D, F, G or the diffuse / specular halves.

const PBR_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
uniform mat4 uModel, uView, uProjection;
out vec3 vWorld; out vec3 vNormal;
void main() {
  vec4 w = uModel * vec4(aPos, 1.0);
  vWorld = w.xyz; vNormal = mat3(uModel) * aNormal;
  gl_Position = uProjection * uView * w;
}`;

const PBR_FS = `#version 300 es
precision highp float;
in vec3 vWorld; in vec3 vNormal;
uniform vec3 uCam, uAlbedo;
uniform float uMetallic, uRoughness, uExposure, uLightsOn, uPreMax;
uniform int uMode, uIbl;                 // mode: 0 full, 1 D, 2 F, 3 G, 4 diffuse, 5 specular
uniform vec3 uLightPos[4], uLightCol[4];
uniform samplerCube uIrr, uPre;
uniform sampler2D uLut;
out vec4 FragColor;
${PBR_GLSL}
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
void main() {
  vec3 N = normalize(vNormal), V = normalize(uCam - vWorld);
  float NdotV = max(dot(N, V), 0.0001);
  float rough = max(uRoughness, 0.04);
  vec3 F0 = mix(vec3(0.04), uAlbedo, uMetallic);          // metallic workflow

  vec3 Lo = vec3(0.0), Ld = vec3(0.0), Ls = vec3(0.0), dbg = vec3(0.0);
  float k = (rough + 1.0) * (rough + 1.0) / 8.0;
  for (int i = 0; i < 4; i++) {
    vec3 L = normalize(uLightPos[i] - vWorld), H = normalize(V + L);
    float dist = length(uLightPos[i] - vWorld);
    vec3 radiance = uLightCol[i] / (dist * dist);
    float NdotL = max(dot(N, L), 0.0), NdotH = max(dot(N, H), 0.0);

    float D = D_GGX(NdotH, rough * rough);
    float G = G_Smith(NdotV, NdotL, k);
    vec3  F = F_Schlick(max(dot(H, V), 0.0), F0);

    vec3 specular = D * G * F / (4.0 * NdotV * NdotL + 0.0001);
    vec3 kD = (vec3(1.0) - F) * (1.0 - uMetallic);        // energy that was not reflected, and metals have no diffuse
    vec3 diffuse = kD * uAlbedo / PI;
    Ld += diffuse * radiance * NdotL * uLightsOn;
    Ls += specular * radiance * NdotL * uLightsOn;
    if (NdotL > 0.0) {
      if (uMode == 1) dbg += vec3(D * 0.25);
      if (uMode == 2) dbg += F * 0.25;
      if (uMode == 3) dbg += vec3(G * 0.25);
    }
  }

  // Image-based ambient
  vec3 Ad = uAlbedo * 0.03, As = vec3(0.0);
  if (uIbl > 0) {
    vec3 F = F_SchlickRoughness(NdotV, F0, rough);
    vec3 kD = (1.0 - F) * (1.0 - uMetallic);
    Ad = kD * texture(uIrr, N).rgb * uAlbedo;
    if (uIbl > 1) {
      vec3 R = reflect(-V, N);
      vec3 pre = textureLod(uPre, R, uRoughness * uPreMax).rgb;
      vec2 ab = texture(uLut, vec2(NdotV, uRoughness)).rg;
      As = pre * (F * ab.x + ab.y);
    }
  }

  vec3 c;
  if (uMode == 0) c = Ld + Ls + Ad + As;
  else if (uMode == 4) c = Ld + Ad;
  else if (uMode == 5) c = Ls + As;
  else { FragColor = vec4(pow(dbg / (dbg + 1.0) * 2.0, vec3(1.0 / 2.2)), 1.0); return; }
  c = aces(c * uExposure);
  FragColor = vec4(pow(c, vec3(1.0 / 2.2)), 1.0);
}`;

const LUT_FS = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uLut;
out vec4 FragColor;
void main() { FragColor = vec4(texture(uLut, vUV).rg, 0.0, 1.0); }`;

const LIGHT_FS = `#version 300 es
precision highp float;
out vec4 FragColor;
void main() { FragColor = vec4(1.0, 0.95, 0.85, 1.0); }`;

type Res = {
  pbr: WebGLProgram; sky: WebGLProgram; lutProg: WebGLProgram; lamp: WebGLProgram;
  sphere: Mesh; cube: WebGLVertexArrayObject; full: WebGLVertexArrayObject; ibl: IBL | null;
};

const GRID = 7, GAP = 1.25;
const LIGHTS: Vec3[] = [[-5, 4, 7], [5, 4, 7], [-5, -4, 7], [5, -4, 7]];
const ALBEDOS: { name: string; srgb: Vec3 }[] = [
  { name: "red", srgb: [0.8, 0.12, 0.1] },
  { name: "gold", srgb: [1.0, 0.78, 0.34] },
  { name: "white", srgb: [0.92, 0.92, 0.92] },
  { name: "blue", srgb: [0.15, 0.35, 0.85] },
];
const lin = (c: Vec3): Vec3 => [c[0] ** 2.2, c[1] ** 2.2, c[2] ** 2.2];
const MODES = ["full", "D", "F", "G", "diffuse", "specular"] as const;
const BACKGROUNDS = ["environment", "irradiance", "prefiltered"] as const;

export function PbrSpheresFigure({ t, ibl = false }: { t?: TrackTranslations; ibl?: false | "diffuse" | "specular" }) {
  const [look, setLook] = useState<Look>({ yaw: 0, pitch: 0, fov: 0.8 });
  const [mode, setMode] = useState(0);
  const [albedo, setAlbedo] = useState(ibl === "diffuse" ? 2 : ibl === "specular" ? 1 : 0);
  const [lights, setLights] = useState(!ibl);
  const [power, setPower] = useState(300);
  const [exposure, setExposure] = useState(1);
  const [bg, setBg] = useState(0);
  const [lod, setLod] = useState(2);
  const [showLut, setShowLut] = useState(ibl === "specular");
  const [loading, setLoading] = useState(!!ibl);
  const iblLevel = ibl === "specular" ? 2 : ibl === "diffuse" ? 1 : 0;

  // Orbit: the camera circles the chart (drag right and the chart turns right)
  const f = forwardFrom(look.yaw, look.pitch);
  const DIST = 10.5;
  const cam: Vec3 = [-f[0] * DIST, -f[1] * DIST, -f[2] * DIST];

  const init = async (gl: WebGL2RenderingContext): Promise<Res> => {
    const cube = gl.createVertexArray()!;
    gl.bindVertexArray(cube);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, SKYBOX_CUBE, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
    const res: Res = {
      pbr: compileProgram(gl, PBR_VS, PBR_FS),
      sky: compileProgram(gl, SKY_VS, SKY_FS),
      lutProg: compileProgram(gl, FULL_VS, LUT_FS),
      lamp: compileProgram(gl, PBR_VS, LIGHT_FS),
      sphere: uploadMesh(gl, spherePNUT(40, 64)),
      cube, full: gl.createVertexArray()!, ibl: null,
    };
    if (ibl) { res.ibl = await buildIBL(gl, { sun: SUN_DIR }); setLoading(false); }
    return res;
  };

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, size.w, size.h);
    gl.clearColor(0.03, 0.035, 0.045, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);

    const view = mat4.lookAt(cam, [0, 0, 0], [0, 1, 0]);
    const proj = mat4.perspective(look.fov, size.aspect, 0.1, 100);
    const p = r.pbr, u = (n: string) => gl.getUniformLocation(p, n);
    gl.useProgram(p);
    gl.uniformMatrix4fv(u("uView"), false, view);
    gl.uniformMatrix4fv(u("uProjection"), false, proj);
    gl.uniform3fv(u("uCam"), cam);
    gl.uniform3fv(u("uAlbedo"), lin(ALBEDOS[albedo].srgb));
    gl.uniform1f(u("uExposure"), exposure);
    gl.uniform1f(u("uLightsOn"), lights ? 1 : 0);
    gl.uniform1i(u("uMode"), mode);
    gl.uniform1i(u("uIbl"), r.ibl ? iblLevel : 0);
    LIGHTS.forEach((l, i) => { gl.uniform3fv(u(`uLightPos[${i}]`), l); gl.uniform3fv(u(`uLightCol[${i}]`), [power, power, power]); });
    // Samplers of different types must never share a unit, even when unused
    gl.uniform1i(u("uIrr"), 0); gl.uniform1i(u("uPre"), 1); gl.uniform1i(u("uLut"), 2);
    if (r.ibl) {
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_CUBE_MAP, r.ibl.irradiance);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_CUBE_MAP, r.ibl.prefilter);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, r.ibl.lut);
      gl.uniform1f(u("uPreMax"), r.ibl.prefilterLevels - 1);
    }
    gl.bindVertexArray(r.sphere.vao);
    for (let row = 0; row < GRID; row++) for (let col = 0; col < GRID; col++) {
      gl.uniform1f(u("uMetallic"), row / (GRID - 1));
      gl.uniform1f(u("uRoughness"), Math.max(0.05, col / (GRID - 1)));
      gl.uniformMatrix4fv(u("uModel"), false, trs([(col - (GRID - 1) / 2) * GAP, (row - (GRID - 1) / 2) * GAP, 0], 1));
      gl.drawArrays(gl.TRIANGLES, 0, r.sphere.count);
    }

    // Lamps
    if (lights) {
      gl.useProgram(r.lamp);
      gl.uniformMatrix4fv(gl.getUniformLocation(r.lamp, "uView"), false, view);
      gl.uniformMatrix4fv(gl.getUniformLocation(r.lamp, "uProjection"), false, proj);
      for (const l of LIGHTS) {
        gl.uniformMatrix4fv(gl.getUniformLocation(r.lamp, "uModel"), false, trs(l, 0.3));
        gl.drawArrays(gl.TRIANGLES, 0, r.sphere.count);
      }
    }

    // Environment behind everything
    if (r.ibl) {
      gl.depthFunc(gl.LEQUAL);
      gl.useProgram(r.sky);
      const s = (n: string) => gl.getUniformLocation(r.sky, n);
      gl.uniformMatrix4fv(s("uView"), false, mat4.stripTranslation(view));
      gl.uniformMatrix4fv(s("uProjection"), false, proj);
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, bg === 0 ? r.ibl.env : bg === 1 ? r.ibl.irradiance : r.ibl.prefilter);
      gl.uniform1i(s("uCube"), 3);
      gl.uniform1f(s("uLod"), bg === 2 ? lod : 0);
      gl.uniform1f(s("uExposure"), exposure);
      gl.bindVertexArray(r.cube);
      gl.drawArrays(gl.TRIANGLES, 0, 36);
      gl.depthFunc(gl.LESS);

      if (showLut) {
        const side = Math.round(Math.min(size.w, size.h) * 0.22);
        gl.disable(gl.DEPTH_TEST);
        gl.viewport(size.w - side - 8, 8, side, side);
        gl.useProgram(r.lutProg);
        gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, r.ibl.lut);
        gl.uniform1i(gl.getUniformLocation(r.lutProg, "uLut"), 2);
        drawFullscreen(gl, r.full);
        gl.viewport(0, 0, size.w, size.h);
        gl.enable(gl.DEPTH_TEST);
      }
    }
  };

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;
  const title = ibl === "diffuse"
    ? tx(t, "figPbr_titleIrr", "Diffuse IBL — the Irradiance Map as Ambient Light")
    : ibl === "specular"
      ? tx(t, "figPbr_titleSpec", "Full IBL — Prefiltered Reflections and the BRDF LUT")
      : tx(t, "figPbr_title", "Cook-Torrance — Metallic × Roughness");
  const note = mode === 1 ? tx(t, "figPbr_noteD", "D alone: tiny intense dots on the smooth left column, wide soft blobs on the right. Metallic does not change D at all — it is pure geometry of the microsurface.")
    : mode === 2 ? tx(t, "figPbr_noteF", "F alone: dark (4%) in the centre of the dielectric rows and bright at their rims; the metal rows reflect their albedo colour everywhere.")
      : mode === 3 ? tx(t, "figPbr_noteG", "G alone: close to white except near the silhouette, and darker the rougher the sphere — self-shadowing of the microfacets.")
        : ibl === "diffuse" ? tx(t, "figPbr_noteIrr", "Turn the lights off: the bottom rows are still lit, tinted blue from above and warm from the sun's side — that is the irradiance map. The metal rows turn black: metals have no diffuse, so they wait for the specular half of IBL.")
          : ibl === "specular" ? tx(t, "figPbr_noteSpec", "Now the metals mirror the sky, sharp on the left and blurred on the right: each column reads a different mip of the prefiltered map. Show the prefiltered background and move the level to see the blur each roughness uses. The inset is the BRDF LUT: red = scale, green = bias.")
            : tx(t, "figPbr_note", "Bottom row: plastic-like dielectrics — coloured diffuse plus a white highlight. Top row: metals — no diffuse, a highlight tinted by the albedo. Left to right, the highlight spreads and dims as roughness grows, but the total energy stays the same.");

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{title}</span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{tx(t, "figPbr_hint", "drag to orbit · wheel to zoom")}</span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> orbit init={init} draw={draw} look={look} onLook={setLook} fovRange={[0.35, 1.2]}
          frame={[look, mode, albedo, lights, power, exposure, bg, lod, showLut, loading]} aspect={16 / 10}>
          <span className="absolute left-3 bottom-2 text-[9px] font-mono text-white/70 pointer-events-none">roughness →</span>
          <span className="absolute left-2 top-3 text-[9px] font-mono text-white/70 pointer-events-none [writing-mode:vertical-rl] rotate-180">metallic →</span>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-[11px] font-mono text-white/80 pointer-events-none">
              {tx(t, "figPbr_loading", "precomputing irradiance, prefilter and LUT…")}
            </div>
          )}
        </GLView>
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap items-center">
          {MODES.map((m, i) => <button key={m} className={btn(mode === i)} onClick={() => setMode(i)}>{m}</button>)}
          <span className="w-px h-5 bg-[var(--border)] mx-1" />
          {ALBEDOS.map((a, i) => (
            <button key={a.name} className={btn(albedo === i)} onClick={() => setAlbedo(i)}>
              <span className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5 align-middle" style={{ background: `rgb(${a.srgb.map(c => Math.round(c * 255)).join(",")})` }} />{a.name}
            </button>
          ))}
        </div>
        {ibl && (
          <div className="flex gap-1.5 flex-wrap items-center">
            <button className={btn(lights)} onClick={() => setLights(v => !v)}>{lights ? "lights on" : "lights off"}</button>
            <span className="w-px h-5 bg-[var(--border)] mx-1" />
            {BACKGROUNDS.slice(0, ibl === "specular" ? 3 : 2).map((b, i) => <button key={b} className={btn(bg === i)} onClick={() => setBg(i)}>{b}</button>)}
            {ibl === "specular" && <button className={btn(showLut)} onClick={() => setShowLut(v => !v)}>BRDF LUT</button>}
          </div>
        )}
        {([
          ...(lights ? [["light power", power, setPower, 20, 1200, 10] as const] : []),
          ["exposure", exposure, setExposure, 0.2, 4, 0.05] as const,
          ...(ibl === "specular" && bg === 2 ? [["mip level", lod, setLod, 0, 4, 0.1] as const] : []),
        ]).map(([label, v, set, min, max, step]) => (
          <label key={label} className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[var(--text-muted)] w-20">{label}</span>
            <input type="range" min={min} max={max} step={step} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
            <span className="text-[10px] font-mono text-[var(--primary)] w-14 text-right">
              {label === "mip level" ? `${v.toFixed(1)} (r≈${(v / 4).toFixed(2)})` : v}
            </span>
          </label>
        ))}
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">{note}</p>
      </div>
    </figure>
  );
}
