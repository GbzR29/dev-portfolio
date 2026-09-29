"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { compileProgram } from "../../kit/gl/gl";
import { FULL_VS, drawFullscreen } from "../../kit/gl/glx";
import { GLView, lookBasis, useAnimationTime, type Look } from "../../kit/gl/GLView";
import { Btn, Readout, Row, Slider, Sliders, useVisible } from "../../kit/figure";
import { FigureShell } from "@/components/lesson/kit/FigureShell";
import { makeBlackbodyTexture } from "./blackbody";
import { BLACKHOLE_FS } from "./blackholeShader";
import { redshift, shadowRadius, orbitSpeed, tangentialEll, type Bending } from "./geodesic";

// ── What this figure shows ────────────────────────────────────────────────────
// A Schwarzschild black hole with a thin accretion disk, rendered by tracing
// every pixel's light path backwards through the curved space around it. Drag
// to orbit, scroll or pinch to zoom. The bending can be switched between none,
// Newton's and Einstein's, and the debug views show which image of the disk a
// pixel sees, the frequency shift g, and how many steps each ray took.

const BENDINGS: readonly Bending[] = ["none", "newton", "einstein"];
const VIEWS = ["final", "images", "shift g", "steps"] as const;

type Params = {
  bending: number; dist: number; disk: boolean; rIn: number; rOut: number; temp: number; density: number;
  doppler: boolean; grav: boolean; spin: number; exposure: number; back: number; view: number; step: number;
};
const DEFAULT: Params = {
  bending: 2, dist: 22, disk: true, rIn: 3, rOut: 12, temp: 5000, density: 0.75,
  doppler: true, grav: true, spin: 8, exposure: 0.7, back: 0, view: 0, step: 0.06,
};
const START: Look = { yaw: 0, pitch: -0.1, fov: 0.8 };

type Res = { prog: WebGLProgram; vao: WebGLVertexArrayObject; bb: WebGLTexture };

export function BlackHoleLabFigure({ t }: { t?: TrackTranslations }) {
  const [p, setP] = useState<Params>(DEFAULT);
  const [look, setLook] = useState<Look>(START);
  const [playing, setPlaying] = useState(true);
  const vis = useVisible<HTMLElement>();
  const clock = useAnimationTime(playing && vis.on);
  const set = <K extends keyof Params>(k: K, v: Params[K]) => setP(o => ({ ...o, [k]: v }));

  const init = (gl: WebGL2RenderingContext): Res => ({
    prog: compileProgram(gl, FULL_VS, BLACKHOLE_FS), vao: gl.createVertexArray()!, bb: makeBlackbodyTexture(gl),
  });

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    const { f, r: right, u } = lookBasis(look);
    // Orbit camera around the hole: it sits behind its own forward direction
    const eye = [-f[0] * p.dist, -f[1] * p.dist, -f[2] * p.dist];
    gl.viewport(0, 0, size.w, size.h);
    gl.useProgram(r.prog);
    const loc = (n: string) => gl.getUniformLocation(r.prog, n);
    gl.uniform3fv(loc("uCamPos"), eye);
    gl.uniform3fv(loc("uCamF"), f);
    gl.uniform3fv(loc("uCamR"), right);
    gl.uniform3fv(loc("uCamU"), u);
    const tanHalf = Math.tan(look.fov / 2);
    gl.uniform1f(loc("uTanHalf"), tanHalf);
    gl.uniform1f(loc("uAspect"), size.aspect);
    gl.uniform1f(loc("uPix"), (2 * tanHalf) / size.h);
    // Simulated time in units of r_s/c: `spin` of them per second
    gl.uniform1f(loc("uTime"), clock * p.spin);
    gl.uniform1f(loc("uPeriod"), 30);
    gl.uniform1f(loc("uStepK"), p.step);
    gl.uniform1f(loc("uDiskIn"), p.rIn);
    gl.uniform1f(loc("uDiskOut"), p.rOut);
    gl.uniform1f(loc("uTemp"), p.temp);
    gl.uniform1f(loc("uDensity"), p.density);
    gl.uniform1f(loc("uExposure"), p.exposure);
    gl.uniform1i(loc("uBending"), p.bending);
    gl.uniform1i(loc("uDisk"), p.disk ? 1 : 0);
    gl.uniform1i(loc("uDoppler"), p.doppler ? 1 : 0);
    gl.uniform1i(loc("uGravShift"), p.grav ? 1 : 0);
    gl.uniform1i(loc("uBack"), p.back);
    gl.uniform1i(loc("uView"), p.view);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, r.bb);
    gl.uniform1i(loc("uBB"), 0);
    drawFullscreen(gl, r.vao);
  };

  // Numbers for the readouts, from the same formulas as the shader
  const deg = (a: number) => (a * 180) / Math.PI;
  const shadow = 2 * deg(shadowRadius(p.dist));
  const beta = orbitSpeed(p.rIn);
  const ell = tangentialEll(p.rIn);
  const gHi = redshift(p.rIn, ell, { doppler: p.doppler, gravity: p.grav });
  const gLo = redshift(p.rIn, -ell, { doppler: p.doppler, gravity: p.grav });

  const notes: [string, string][] = [
    ["figBh_n0", "Drag to orbit, scroll or pinch to zoom. The hump over the shadow is the far side of the disk, its light bent up over the top of the hole; the thin bright rim hugging the shadow is light that went half-way round. One side of the disk is brighter and bluer: the gas there is coming towards you."],
    ["figBh_n1", "How many times the path had met the disk when it picked up this light. Orange: the first time, which includes the arc over the shadow, the far side's top face seen with light bent over the hole. Teal: the second time, light that got through the gas once and met it again, such as the far side's lower face seen under the shadow through the near side. Magenta: three times or more."],
    ["figBh_n2", "The frequency ratio g = ν seen / ν emitted: blue where the light arrives with more energy than it left with (g > 1), red where it lost energy. Turn off Doppler to see gravity alone, which reddens the inner disk evenly."],
    ["figBh_n3", "How many RK4 steps each ray took (white = the limit of 400). Rays that skim the photon sphere circle it and take the most; the step grows with r, so far-away rays are cheap."],
  ];
  const note = notes[p.view];

  return (
    <FigureShell ref={vis.ref}>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figBh_title", "Black Hole Lab")}
        </span>
        <div className="flex gap-1.5 flex-wrap">
          {VIEWS.map((v, i) => <Btn key={v} active={p.view === i} onClick={() => set("view", i)}>{v}</Btn>)}
        </div>
      </div>

      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> init={init} draw={draw} look={look} onLook={setLook} orbit resolution={0.75} fovRange={[0.12, 1.7]}
          frame={[look, p, clock]} aspect={16 / 9} />
      </div>

      <div className="p-4 md:p-5 space-y-3">
        <Row>
          <Btn active={playing} onClick={() => setPlaying(v => !v)}>{playing ? "❚❚ pause" : "▶ play"}</Btn>
          <Btn onClick={() => { setLook(START); setP(DEFAULT); }}>{tx(t, "figBh_reset", "reset")}</Btn>
          <span className="w-px h-5 bg-[var(--border)] mx-1" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{tx(t, "figBh_bending", "bending")}</span>
          {BENDINGS.map((b, i) => <Btn key={b} active={p.bending === i} onClick={() => set("bending", i)}>{b}</Btn>)}
        </Row>
        <Row>
          <Btn active={p.disk} onClick={() => set("disk", !p.disk)}>{p.disk ? "✓ " : ""}{tx(t, "figBh_disk", "disk")}</Btn>
          <Btn active={p.doppler} onClick={() => set("doppler", !p.doppler)}>{p.doppler ? "✓ " : ""}Doppler</Btn>
          <Btn active={p.grav} onClick={() => set("grav", !p.grav)}>{p.grav ? "✓ " : ""}{tx(t, "figBh_grav", "gravitational redshift")}</Btn>
          <span className="w-px h-5 bg-[var(--border)] mx-1" />
          <Btn active={p.back === 0} onClick={() => set("back", 0)}>{tx(t, "figBh_stars", "stars")}</Btn>
          <Btn active={p.back === 1} onClick={() => set("back", 1)}>{tx(t, "figBh_grid", "sky grid")}</Btn>
        </Row>
        <Sliders>
          <Slider label="distance D" value={p.dist} min={2.5} max={60} step={0.1} onChange={v => set("dist", v)} fmt={v => `${v.toFixed(1)} rₛ`} width="w-28" />
          <Slider label="peak temperature" value={p.temp} min={2500} max={20000} step={100} onChange={v => set("temp", v)} fmt={v => `${Math.round(v)} K`} width="w-28" />
          <Slider label="inner edge" value={p.rIn} min={1.6} max={6} step={0.05} onChange={v => set("rIn", Math.min(v, p.rOut - 1))} fmt={v => `${v.toFixed(2)} rₛ`} width="w-28" />
          <Slider label="outer edge" value={p.rOut} min={5} max={30} step={0.5} onChange={v => set("rOut", Math.max(v, p.rIn + 1))} fmt={v => `${v.toFixed(1)} rₛ`} width="w-28" />
          <Slider label="opacity" value={p.density} min={0} max={1} step={0.01} onChange={v => set("density", v)} width="w-28" />
          <Slider label="time scale" value={p.spin} min={0} max={40} step={0.5} onChange={v => set("spin", v)} fmt={v => `${v.toFixed(1)}×`} width="w-28" />
          <Slider label="exposure" value={p.exposure} min={-4} max={4} step={0.1} onChange={v => set("exposure", v)} fmt={v => `${v.toFixed(1)} EV`} width="w-28" />
          <Slider label="step k" value={p.step} min={0.02} max={0.4} step={0.01} onChange={v => set("step", v)} width="w-28" />
        </Sliders>
        <Row>
          <Readout>{tx(t, "figBh_shadow", "shadow")} ≈ {shadow.toFixed(1)}°</Readout>
          <Readout>{tx(t, "figBh_speed", "gas at the inner edge")}: {beta.toFixed(2)} c</Readout>
          <Readout>g: {gLo.toFixed(2)} … {gHi.toFixed(2)}</Readout>
        </Row>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">{tx(t, note[0], note[1])}</p>
      </div>
    </FigureShell>
  );
}
