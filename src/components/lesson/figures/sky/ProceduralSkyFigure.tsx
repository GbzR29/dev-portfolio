"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, SKYBOX_CUBE, forwardFrom } from "../../kit/gl/gl";
import { GLView, useAnimationTime, type Look } from "../../kit/gl/GLView";
import { useVisible } from "../../kit/figure";
import { PROC_SKY_FS, DEFAULT_SKY_PARAMS, setSkyUniforms, sunDirection, type SkyParams } from "./proceduralSky";

// ── What this figure shows ────────────────────────────────────────────────────
// The chapter's procedural sky, one layer at a time. Every layer can be
// switched off or shown alone ("solo"), and the code panel shows the lines
// that produce the layer being looked at.

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

type Res = { prog: WebGLProgram; vao: WebGLVertexArrayObject };

const LAYERS = [
  { solo: 0, key: "base", label: "base sky" },
  { solo: 1, key: "sun", label: "sun" },
  { solo: 2, key: "stars", label: "stars" },
  { solo: 3, key: "milky", label: "Milky Way" },
  { solo: 4, key: "clouds", label: "clouds" },
] as const;

const PRESETS: [string, number][] = [["noon", 70], ["afternoon", 25], ["sunset", 2], ["twilight", -6], ["night", -30]];

const CODE: Record<string, string> = {
  all: `vec3 c = baseSky(d, sun)          // gradient or scattering
      + stars(d, sun) + milkyWay(d, sun) + sunDisc(d, sun);
vec4 cl = clouds(d, sun, base);    // colour + coverage
c = mix(c, cl.rgb, cl.a);          // clouds cover what is behind
FragColor = vec4(pow(1.0 - exp(-c * exposure), vec3(1.0 / 2.2)), 1.0);`,
  gradient: `float day = smoothstep(-0.25, 0.35, sun.y);
vec3 zenith  = mix(nightZenith,  dayZenith,  day);
vec3 horizon = mix(nightHorizon, dayHorizon, day);
horizon = mix(horizon, orange, dusk * towardSun);
return mix(horizon, zenith, pow(d.y, 0.45));`,
  scatter: `vec3 L = 20.0 * exp(-(BETA_R + BETA_M + BETA_O) * airMass(sun.y));
float m = airMass(d.y);                    // 1 / (d.y + 0.025)
vec3 rayleigh = (1.0 - exp(-BETA_R * m)) * phaseRayleigh(mu);
vec3 mie      = (1.0 - exp(-BETA_M * m)) * phaseHG(mu, 0.8);
return L * (rayleigh + mie);`,
  sun: `float mu = dot(d, sun);                     // cos of the angle to the sun
float disc = smoothstep(cos(R * 1.15), cos(R), mu);
return sunLight(sun) * disc * 4.0;          // reddened by the same air`,
  stars: `vec3 p = d * 70.0;  vec3 cell = floor(p);
if (hash13(cell) > density * 0.35) return vec3(0);   // empty cell
vec3 c = cell + 0.5 + (hash33(cell) - 0.5) * 0.6;   // jittered centre
float b = exp(-dot(p - c, p - c) * 90.0) * brightness;
return tint * b * twinkle * night;`,
  milky: `float x = dot(d, G);                         // sin(angle off the band)
float band = exp(-x * x / (2.0 * 0.12 * 0.12));
float dust = 1.0 - 0.6 * lane(x) * fbm3(d * 7.0);
return colour * band * fbm3(d * 6.0) * dust * night;`,
  clouds: `float t = 1.0 / d.y;                  // ray meets the layer y = 1
vec2 p = d.xz * t * 0.7 + wind * time;
float n = fbm2(p);
float a = smoothstep(edge, edge + 0.2, n);           // coverage
float lit = exp(-max(fbm2(p + toSun) - n, 0.0) * 8.0); // one step to the sun
return vec4(ambient + sunCol * lit, a * exp(-0.12 * t));`,
};

export function ProceduralSkyFigure({ t }: { t?: TrackTranslations }) {
  const [look, setLook] = useState<Look>({ yaw: 0.95, pitch: 0.28, fov: 1.5 });
  const [p, setP] = useState<SkyParams>({ ...DEFAULT_SKY_PARAMS });
  const [animate, setAnimate] = useState(false);
  const vis = useVisible<HTMLElement>();
  const time = useAnimationTime(animate && vis.on);
  const set = <K extends keyof SkyParams>(k: K, v: SkyParams[K]) => setP(o => ({ ...o, [k]: v }));

  const init = (gl: WebGL2RenderingContext): Res => {
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, SKYBOX_CUBE, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
    return { prog: compileProgram(gl, VS, PROC_SKY_FS), vao };
  };

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    gl.viewport(0, 0, size.w, size.h);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    const f = forwardFrom(look.yaw, look.pitch);
    gl.useProgram(r.prog);
    gl.uniformMatrix4fv(gl.getUniformLocation(r.prog, "uView"), false, mat4.stripTranslation(mat4.lookAt([0, 0, 0], f, [0, 1, 0])));
    gl.uniformMatrix4fv(gl.getUniformLocation(r.prog, "uProjection"), false, mat4.perspective(look.fov, size.aspect, 0.1, 10));
    setSkyUniforms(gl, r.prog, { ...p, time });
    gl.bindVertexArray(r.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
  };

  const on: Record<string, boolean> = { base: true, sun: p.sun, stars: p.stars, milky: p.milky, clouds: p.clouds };
  const toggle = (key: string) => { if (key !== "base") set(key as "sun" | "stars" | "milky" | "clouds", !on[key]); };
  const codeKey = p.solo < 0 ? "all" : p.solo === 0 ? (p.model === 0 ? "gradient" : "scatter") : LAYERS[p.solo].key;
  const sun = sunDirection(p.sunEl, p.sunAz);

  const btn = (active: boolean) =>
    `px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all ${active
      ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]"
      : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40"}`;
  const slider = (label: string, value: number, onChange: (v: number) => void, min: number, max: number, step: number, fmt: (v: number) => string) => (
    <label className="flex items-center gap-2">
      <span className="text-[9px] font-mono text-[var(--text-muted)] w-24 shrink-0">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))} className="flex-1 min-w-0 accent-[var(--primary)]" />
      <span className="text-[10px] font-mono text-[var(--primary)] w-12 text-right">{fmt(value)}</span>
    </label>
  );

  const notes: Record<string, [string, string]> = {
    all: ["figPSky_nAll", "Five independent functions of one direction, added and blended in order. Drag the sun through the day, then solo each layer to see what it contributes."],
    gradient: ["figPSky_nGrad", "Two colours and a curve. pow(d.y, 0.45) spends most of the change near the horizon, where the real sky changes fastest. Cheap and fully art-directable, but the colours only change because the formula says so."],
    scatter: ["figPSky_nScat", "Physics, simplified: sunlight dims and reddens on its way in (the exp term with the sun's air mass), and each view ray collects the fraction that scatters toward the eye. Blue scatters most, so the zenith is blue; the horizon's long path saturates every colour, so it turns white."],
    sun: ["figPSky_nSun", "A disc is a threshold on the angle to the sun: mu = dot(d, sun) is its cosine. The disc takes its colour from the same attenuated sunlight as the sky, so it reddens at sunset for free."],
    stars: ["figPSky_nStars", "Hashing turns a cell index into a repeatable random number, so the same stars appear every frame without storing any of them. Most stars are made faint on purpose: pow(random, 6) gives many dim ones and a few bright."],
    milky: ["figPSky_nMilky", "A band around a great circle: dot(d, G) is zero on the band's plane, and a Gaussian of it gives the band's soft edge. Noise adds structure; a narrower, darker Gaussian gives the dust lane down the middle."],
    clouds: ["figPSky_nClouds", "The view ray is intersected with a flat layer at height 1, and 2D noise is read where it lands. Far away the hit points are spread out, so the clouds are faded with distance before they turn into noise."],
  };
  const note = notes[codeKey];

  return (
    <figure ref={vis.ref} className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figPSky_title", "A Procedural Sky, Layer by Layer")}
        </span>
        <div className="flex gap-1.5 flex-wrap">
          <button className={btn(p.model === 0)} onClick={() => set("model", 0)}>{tx(t, "figPSky_grad", "gradient")}</button>
          <button className={btn(p.model === 1)} onClick={() => set("model", 1)}>{tx(t, "figPSky_scat", "Rayleigh + Mie")}</button>
        </div>
      </div>

      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> init={init} draw={draw} look={look} onLook={setLook}
          frame={[look, p, time]} aspect={16 / 9} fovRange={[0.6, 2.2]} />
      </div>

      <div className="p-4 md:p-5 grid gap-5 md:grid-cols-2">
        <div className="space-y-2.5 min-w-0">
          <div className="flex gap-1.5 flex-wrap items-center">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mr-1">{tx(t, "figPSky_layers", "layers")}</span>
            {LAYERS.map(l => (
              <span key={l.key} className="inline-flex">
                <button className={`${btn(on[l.key])} rounded-r-none`} onClick={() => toggle(l.key)} disabled={l.key === "base"}>
                  {on[l.key] ? "✓ " : ""}{l.label}
                </button>
                <button title="solo" className={`${btn(p.solo === l.solo)} rounded-l-none border-l-0 px-1.5`}
                  onClick={() => set("solo", p.solo === l.solo ? -1 : l.solo)}>S</button>
              </span>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap items-center">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mr-1">{tx(t, "figPSky_time", "time")}</span>
            {PRESETS.map(([name, el]) => (
              <button key={name} className={btn(p.sunEl === el)} onClick={() => set("sunEl", el)}>{name}</button>
            ))}
            <button className={btn(animate)} onClick={() => setAnimate(v => !v)}>{animate ? "❚❚" : "▶"} {tx(t, "figPSky_anim", "animate")}</button>
          </div>
          {slider("sun elevation", p.sunEl, v => set("sunEl", v), -35, 90, 1, v => `${v}°`)}
          {slider("sun azimuth", p.sunAz, v => set("sunAz", v), -180, 180, 1, v => `${v}°`)}
          {slider("cloud cover", p.cover, v => set("cover", v), 0, 1, 0.01, v => v.toFixed(2))}
          {slider("star density", p.density, v => set("density", v), 0, 1, 0.01, v => v.toFixed(2))}
          {slider("exposure", p.exposure, v => set("exposure", v), 0.2, 6, 0.05, v => v.toFixed(2))}
          <p className="text-[11px] font-mono text-[var(--text-muted)]">
            sun = ({sun.map(v => v.toFixed(2)).join(", ")}) · {tx(t, "figPSky_look", "drag to look · scroll to zoom")}
          </p>
        </div>

        <div className="space-y-2 min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            {p.solo < 0 ? tx(t, "figPSky_codeAll", "Putting it together") : `${tx(t, "figPSky_codeSolo", "Only this layer")}: ${LAYERS[p.solo].label}`}
          </p>
          <pre className="text-[10px] font-mono rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 overflow-x-auto leading-relaxed text-[var(--code-text)] whitespace-pre">{CODE[codeKey]}</pre>
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">{tx(t, note[0], note[1])}</p>
        </div>
      </div>
    </figure>
  );
}
