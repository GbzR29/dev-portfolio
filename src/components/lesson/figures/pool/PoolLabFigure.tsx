"use client";

import { useEffect, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { compileProgram, forwardFrom, mat4, type Vec3 } from "../../kit/gl/gl";
import { FULL_VS, drawFullscreen, makeColorTarget, type ColorTarget } from "../../kit/gl/glx";
import { GLView, rayDir, lookBasis, useAnimationTime, type Look } from "../../kit/gl/GLView";
import { useVisible } from "../../kit/figure";
import { DEFAULT_SKY_PARAMS, type SkyParams } from "../sky/proceduralSky";
import { applyUniforms } from "../water/waterCommon";
import { WATER_COLOURS } from "../water/waterParams";
import { loadPhotos, bindPhotos, type PhotoList } from "../water/photoTextures";
import { PROBE_FS, makeSkyProbe, renderSkyProbe, bindSkyProbe, type SkyProbe } from "../water/skyProbe";
import { makePoolSim, stepPoolSim, resetPoolSim, simTexture, SIM_N, POOL_HALF, POOL_DEPTH, type PoolSim } from "./poolSim";
import { CAUSTIC_VS, CAUSTIC_FS, SCENE_FS, WATER_VS, WATER_FS, CAUSTIC_N, RIM, skyUniforms } from "./poolShader";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// Evan Wallace's WebGL Water, rebuilt: a 256 × 256 height field stepped with
// the wave equation, a ball that floats and pushes the water aside, caustics
// from the refracted water mesh, and a pool, deck and ball traced per pixel.
// Click or drag on the water to make waves, drag the ball to move or throw it,
// drag anywhere else to orbit.

const TILES: PhotoList = [["uPoolA", "mat:squareceramicglossytile-aqua-blue:albedo"], ["uPoolN", "mat:squareceramicglossytile-aqua-blue:normal"]];
const BALL_R = 0.25, G = 9.81;
const STEPS_PER_S = 120;
const TARGET: Vec3 = [0, -0.25, 0];
const VIEWS = ["final", "heights", "caustics"] as const;

type Orbit = { yaw: number; pitch: number; dist: number; fov: number };
type Params = {
  courant2: number; damping: number; drop: number; density: number;
  gravity: boolean; rain: boolean; colour: string; clarity: number; view: number; mosaic: boolean;
};
const DEFAULT: Params = { courant2: 0.5, damping: 0.995, drop: 0.04, density: 0.5, gravity: true, rain: false, colour: "tropical", clarity: 2.5, view: 0, mosaic: false };

type Ball = { pos: Vec3; vel: Vec3; drawn: Vec3 };
type Res = {
  sim: PoolSim; caustic: ColorTarget; causticProg: WebGLProgram; scene: WebGLProgram; water: WebGLProgram;
  probeProg: WebGLProgram; probe: SkyProbe; vao: WebGLVertexArrayObject; grid: { vao: WebGLVertexArrayObject; count: number };
  tex: (WebGLTexture | null)[]; last: number; acc: number; reset: boolean;
};

/** A grid of SIM_N × SIM_N rest positions over the pool (attribute 0), as triangles. */
function poolGrid(gl: WebGL2RenderingContext) {
  const n = SIM_N, pos = new Float32Array(n * n * 2), idx = new Uint32Array((n - 1) * (n - 1) * 6);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    pos[(j * n + i) * 2] = (i / (n - 1) * 2 - 1) * POOL_HALF;
    pos[(j * n + i) * 2 + 1] = (j / (n - 1) * 2 - 1) * POOL_HALF;
  }
  let k = 0;
  for (let j = 0; j + 1 < n; j++) for (let i = 0; i + 1 < n; i++) {
    const a = j * n + i, b = a + 1, c = a + n, d = c + 1;
    idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d;
  }
  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
  gl.bindVertexArray(null);
  return { vao, count: idx.length };
}

/** Submerged share of a ball of radius r whose centre is y metres above the rest level. */
export function submergedFraction(y: number, r: number) {
  const h = Math.min(Math.max(r - y, 0), 2 * r);            // height of the submerged cap
  return (h * h * (3 * r - h)) / (4 * r * r * r);          // π h²(3r − h)/3 over 4πr³/3
}

const eyeOf = (o: Orbit): Vec3 => {
  const f = forwardFrom(o.yaw, o.pitch);
  return [TARGET[0] - f[0] * o.dist, TARGET[1] - f[1] * o.dist, TARGET[2] - f[2] * o.dist];
};
const clampPitch = (o: Orbit) => {
  // Keep the eye above the deck: TARGET.y − sin(pitch)·dist ≥ RIM + 0.15
  const minDrop = Math.asin(Math.min(1, (RIM + 0.15 - TARGET[1]) / o.dist));
  return Math.max(-1.5, Math.min(-minDrop, o.pitch));
};

export function PoolLabFigure({ t }: { t?: TrackTranslations }) {
  const [orbit, setOrbit] = useState<Orbit>({ yaw: 0.5, pitch: -0.72, dist: 3.1, fov: 0.95 });
  const [p, setP] = useState<Params>(DEFAULT);
  const [sky, setSky] = useState<SkyParams>({ ...DEFAULT_SKY_PARAMS, sunEl: 58, sunAz: 150, cover: 0.2, exposure: 1.4 });
  const [playing, setPlaying] = useState(true);
  const [texReady, setTexReady] = useState(0);
  const { ref: figRef, on: inView } = useVisible<HTMLElement>();
  const time = useAnimationTime(playing && inView);
  const [aspect, setAspect] = useState(16 / 9);
  const [floatInfo, setFloatInfo] = useState(0);

  // Mutable state the draw call advances every frame
  const ball = useRef<Ball>({ pos: [0.35, 0.6, -0.2], vel: [0, 0, 0], drawn: [0.35, 0.6, -0.2] });
  const drops = useRef<{ x: number; z: number; radius: number; strength: number }[]>([]);
  const grab = useRef<null | { mode: "ball" | "water" | "orbit"; x: number; y: number; plane?: { n: Vec3; d: number; off: Vec3 } }>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const resetWater = useRef(false);

  const look: Look = { yaw: orbit.yaw, pitch: orbit.pitch, fov: orbit.fov };
  const setK = <K extends keyof Params>(k: K, v: Params[K]) => setP(o => ({ ...o, [k]: v }));
  const colour = WATER_COLOURS.find(c => c.id === p.colour) ?? WATER_COLOURS[1];

  // A few drops to start with, as in the original
  useEffect(() => {
    for (let i = 0; i < 12; i++) drops.current.push({ x: Math.random() * 2 - 1, z: Math.random() * 2 - 1, radius: 0.03, strength: (i & 1 ? 0.01 : -0.01) });
  }, []);

  const init = (gl: WebGL2RenderingContext): Res => {
    const caustic = makeColorTarget(gl, CAUSTIC_N, CAUSTIC_N, { float: true, depth: false });
    return {
      sim: makePoolSim(gl), caustic,
      causticProg: compileProgram(gl, CAUSTIC_VS, CAUSTIC_FS), scene: compileProgram(gl, FULL_VS, SCENE_FS),
      water: compileProgram(gl, WATER_VS, WATER_FS), probeProg: compileProgram(gl, FULL_VS, PROBE_FS), probe: makeSkyProbe(gl),
      vao: gl.createVertexArray()!, grid: poolGrid(gl),
      tex: loadPhotos(gl, TILES, () => setTexReady(n => n + 1)), last: time, acc: 0, reset: false,
    };
  };

  const physics = (dt: number) => {
    const b = ball.current;
    if (grab.current?.mode === "ball" || !p.gravity || dt <= 0) return;
    const f = submergedFraction(b.pos[1], BALL_R);
    // Weight, buoyancy (the water's weight displaced, over the ball's mass), and water drag
    b.vel[1] += (-G + (G * f) / p.density) * dt;
    const drag = Math.exp(-dt * (0.3 + 4 * f));
    b.vel = b.vel.map(v => v * drag) as Vec3;
    b.pos = b.pos.map((v, i) => v + b.vel[i] * dt) as Vec3;
    const lim = POOL_HALF - BALL_R;
    for (const i of [0, 2]) {
      if (Math.abs(b.pos[i]) > lim) { b.pos[i] = Math.sign(b.pos[i]) * lim; b.vel[i] *= -0.4; }
    }
    if (b.pos[1] < -POOL_DEPTH + BALL_R) { b.pos[1] = -POOL_DEPTH + BALL_R; b.vel[1] *= -0.3; }
  };

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    if (size.aspect !== aspect) setAspect(size.aspect);
    const dt = Math.min(Math.max(time - r.last, 0), 1 / 20);
    r.last = time;
    if (resetWater.current) { resetPoolSim(gl, r.sim); resetWater.current = false; }

    // 1. Ball physics, then the water: drops, the ball's push, wave-equation steps
    physics(dt);
    if (p.rain && dt > 0 && Math.random() < dt * 20) {
      drops.current.push({ x: Math.random() * 2 - 1, z: Math.random() * 2 - 1, radius: 0.02, strength: 0.006 });
    }
    r.acc += dt * STEPS_PER_S;
    const steps = Math.min(Math.floor(r.acc), 8);
    r.acc -= Math.floor(r.acc);
    const b = ball.current;
    stepPoolSim(gl, r.sim, {
      drops: drops.current.splice(0), ball: { old: b.drawn, now: b.pos, r: BALL_R },
      steps, courant2: p.courant2, damping: p.damping,
    });
    b.drawn = [...b.pos] as Vec3;
    const frac = submergedFraction(b.pos[1], BALL_R);
    if (Math.abs(frac - floatInfo) > 0.01) setFloatInfo(frac);

    const absorb = colour.absorb.map(v => v / p.clarity) as Vec3;
    const skySet = skyUniforms(sky, time);
    const common = {
      f1: { uCausRead: r.caustic.float ? 1 : 4, uStore: r.caustic.float ? 1 : 0.25 },
      i1: { uView: p.view },
      v3: { uAbsorb: absorb, uScatter: colour.scatter },
      v4: { uBall: [...b.pos, BALL_R] },
    };

    // 2. Caustics: the refracted water mesh, summed into the map
    gl.bindFramebuffer(gl.FRAMEBUFFER, r.caustic.fbo);
    gl.viewport(0, 0, CAUSTIC_N, CAUSTIC_N);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(r.causticProg);
    applyUniforms(gl, r.causticProg, skySet, common);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, simTexture(r.sim));
    gl.uniform1i(gl.getUniformLocation(r.causticProg, "uSim"), 0);
    gl.bindVertexArray(r.grid.vao);
    gl.drawElements(gl.TRIANGLES, r.grid.count, gl.UNSIGNED_INT, 0);
    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // 3. The sky probe the water reflects
    gl.useProgram(r.probeProg);
    applyUniforms(gl, r.probeProg, skySet);
    renderSkyProbe(gl, r.probe, r.probeProg, () => drawFullscreen(gl, r.vao));

    // 4. Scene (sky, deck, pool, ball) with depth, then the water on top
    const eye = eyeOf(orbit);
    const { f, r: right, u } = lookBasis(look);
    const proj = mat4.perspective(orbit.fov, size.aspect, 0.02, 200);
    const view = mat4.lookAt(eye, [eye[0] + f[0], eye[1] + f[1], eye[2] + f[2]], [0, 1, 0]);
    const frame = {
      f1: { uTanHalf: Math.tan(orbit.fov / 2), uAspect: size.aspect, uDepthA: proj[10], uDepthB: proj[14], uPix: 2 * Math.tan(orbit.fov / 2) / size.h },
      i1: {}, v3: { uCamPos: eye, uCamF: f, uCamR: right, uCamU: u }, v4: {},
      m4: { uViewProj: mat4.multiply(proj, view) },
    };
    gl.viewport(0, 0, size.w, size.h);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    const pass = (prog: WebGLProgram) => {
      gl.useProgram(prog);
      applyUniforms(gl, prog, skySet, common, frame);
      bindPhotos(gl, prog, TILES, r.tex, "uHave", [[0, 1]]);
      if (!p.mosaic) gl.uniform1f(gl.getUniformLocation(prog, "uHave"), 0);   // plain tiles show the caustics best
      const bind = (unit: number, name: string, tex: WebGLTexture) => {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.uniform1i(gl.getUniformLocation(prog, name), unit);
      };
      bind(2, "uSim", simTexture(r.sim));
      bind(3, "uCaustic", r.caustic.tex[0]);
      bindSkyProbe(gl, prog, r.probe, 4);
    };
    pass(r.scene);
    gl.depthFunc(gl.ALWAYS);
    drawFullscreen(gl, r.vao);
    pass(r.water);
    gl.depthFunc(gl.LESS);
    gl.bindVertexArray(r.grid.vao);
    gl.drawElements(gl.TRIANGLES, r.grid.count, gl.UNSIGNED_INT, 0);
  };

  // ── Pointer: the ball, the water, or the camera ─────────────────────────────
  const ndc = (e: { clientX: number; clientY: number }) => {
    const b = overlay.current!.getBoundingClientRect();
    return { x: ((e.clientX - b.left) / b.width) * 2 - 1, y: 1 - ((e.clientY - b.top) / b.height) * 2 };
  };
  const ray = (e: { clientX: number; clientY: number }) => {
    const n = ndc(e);
    return { o: eyeOf(orbit), d: rayDir(look, aspect, n.x, n.y) };
  };
  const hitWater = (o: Vec3, d: Vec3) => {
    if (d[1] >= 0) return null;
    const t = -o[1] / d[1], x = o[0] + d[0] * t, z = o[2] + d[2] * t;
    return Math.abs(x) < POOL_HALF && Math.abs(z) < POOL_HALF ? { x, z } : null;
  };
  const addDrop = (x: number, z: number, strength: number) => drops.current.push({ x, z, radius: p.drop, strength });

  const onDown = (e: React.PointerEvent) => {
    overlay.current?.setPointerCapture(e.pointerId);
    const { o, d } = ray(e);
    const b = ball.current;
    const oc: Vec3 = [o[0] - b.pos[0], o[1] - b.pos[1], o[2] - b.pos[2]];
    const bb = oc[0] * d[0] + oc[1] * d[1] + oc[2] * d[2], c = oc[0] ** 2 + oc[1] ** 2 + oc[2] ** 2 - BALL_R * BALL_R;
    if (bb * bb - c > 0 && -bb > 0) {
      // Move the ball in the plane through its centre that faces the camera
      const th = -bb - Math.sqrt(bb * bb - c);
      const hit: Vec3 = [o[0] + d[0] * th, o[1] + d[1] * th, o[2] + d[2] * th];
      const n = forwardFrom(orbit.yaw, orbit.pitch);
      grab.current = { mode: "ball", x: e.clientX, y: e.clientY,
        plane: { n, d: n[0] * b.pos[0] + n[1] * b.pos[1] + n[2] * b.pos[2], off: [hit[0] - b.pos[0], hit[1] - b.pos[1], hit[2] - b.pos[2]] } };
      b.vel = [0, 0, 0];
      return;
    }
    const w = hitWater(o, d);
    if (w) { grab.current = { mode: "water", x: e.clientX, y: e.clientY }; addDrop(w.x, w.z, 0.02); return; }
    grab.current = { mode: "orbit", x: e.clientX, y: e.clientY };
  };
  const onMove = (e: React.PointerEvent) => {
    const g = grab.current;
    if (!g) return;
    const dx = e.clientX - g.x, dy = e.clientY - g.y;
    g.x = e.clientX; g.y = e.clientY;
    if (g.mode === "orbit") {
      const k = 0.0045 * (orbit.fov / 1.2);
      setOrbit(o => { const n = { ...o, yaw: o.yaw + dx * k, pitch: o.pitch - dy * k }; return { ...n, pitch: clampPitch(n) }; });
      return;
    }
    const { o, d } = ray(e);
    if (g.mode === "water") { const w = hitWater(o, d); if (w) addDrop(w.x, w.z, 0.01); return; }
    const pl = g.plane!;
    const den = pl.n[0] * d[0] + pl.n[1] * d[1] + pl.n[2] * d[2];
    if (Math.abs(den) < 1e-4) return;
    const t = (pl.d + pl.n[0] * pl.off[0] + pl.n[1] * pl.off[1] + pl.n[2] * pl.off[2] - (pl.n[0] * o[0] + pl.n[1] * o[1] + pl.n[2] * o[2])) / den;
    const lim = POOL_HALF - BALL_R;
    const b = ball.current, prev = [...b.pos];
    b.pos = [
      Math.max(-lim, Math.min(lim, o[0] + d[0] * t - pl.off[0])),
      Math.max(-POOL_DEPTH + BALL_R, Math.min(1, o[1] + d[1] * t - pl.off[1])),
      Math.max(-lim, Math.min(lim, o[2] + d[2] * t - pl.off[2])),
    ];
    // The hand's velocity, kept when the ball is let go: it can be thrown
    b.vel = b.pos.map((v, i) => (v - prev[i]) * 60) as Vec3;
  };
  const onUp = () => { grab.current = null; };

  // Wheel = distance (a listener, since React's wheel events are passive)
  useEffect(() => {
    const el = overlay.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setOrbit(o => { const n = { ...o, dist: Math.max(2.4, Math.min(9, o.dist * (e.deltaY > 0 ? 1.08 : 0.93))) }; return { ...n, pitch: clampPitch(n) }; });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const btn = (active: boolean) =>
    `px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all ${active
      ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]"
      : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40"}`;
  const slider = (label: string, value: number, onChange: (v: number) => void, min: number, max: number, step: number, unit = "", digits = 2) => (
    <label key={label} className="flex items-center gap-2">
      <span className="text-[9px] font-mono text-[var(--text-muted)] w-24 shrink-0">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))} className="flex-1 min-w-0 accent-[var(--primary)]" />
      <span className="text-[10px] font-mono text-[var(--primary)] w-14 text-right">{value.toFixed(digits)}{unit}</span>
    </label>
  );
  const label = (s: string) => <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{s}</span>;
  const dx = (2 * POOL_HALF) / SIM_N;
  const c = Math.sqrt(p.courant2) * dx * STEPS_PER_S;
  const setSk = <K extends keyof SkyParams>(k: K, v: SkyParams[K]) => setSky(o => ({ ...o, [k]: v }));

  const notes: [string, string][] = [
    ["figPool_n0", "Click or drag on the water to make waves. Drag the ball to lift, sink or throw it; let go and it floats back up. Drag outside the pool to orbit, scroll to zoom. The bright network on the floor and walls is sunlight focused by the waves."],
    ["figPool_n1", "The simulated height: red above the rest level, blue below. Watch a ring spread, reflect off the walls and interfere with itself. The damping slider sets how long it rings."],
    ["figPool_n2", "The caustic map as the pool receives it: the water mesh projected along the refracted sunbeams, each triangle as bright as its area shrank. The ball's shadow is part of it."],
  ];
  const note = notes[p.view];

  return (
    <FigureShell ref={figRef}>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figPool_title", "Pool Lab")}
        </span>
        <div className="flex gap-1.5 flex-wrap">
          <button className={btn(false)} onClick={() => { resetWater.current = true; }}>{tx(t, "figPool_calm", "calm the water")}</button>
          <button className={btn(false)} onClick={() => { ball.current.pos = [0.35 * (Math.random() * 2 - 1), 0.8, 0.35 * (Math.random() * 2 - 1)]; ball.current.vel = [0, 0, 0]; setK("gravity", true); }}>
            {tx(t, "figPool_dropBall", "drop the ball")}
          </button>
          <button className={btn(p.rain)} onClick={() => setK("rain", !p.rain)}>{p.rain ? "✓ " : ""}{tx(t, "figPool_rain", "rain")}</button>
          <button className={btn(p.mosaic)} onClick={() => setK("mosaic", !p.mosaic)}>{p.mosaic ? "✓ " : ""}{tx(t, "figPool_mosaic", "mosaic tiles")}</button>
        </div>
      </div>

      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> init={init} draw={draw} look={look} resolution={0.8}
          frame={[orbit, p, sky, time, texReady]} aspect={16 / 9}>
          <div ref={overlay} className="absolute inset-0 cursor-crosshair" style={{ touchAction: "none" }}
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onContextMenu={e => e.preventDefault()} />
        </GLView>
      </div>

      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap items-center">
          <button className={btn(playing)} onClick={() => setPlaying(v => !v)}>{playing ? "❚❚ pause" : "▶ play"}</button>
          <button className={btn(p.gravity)} onClick={() => setK("gravity", !p.gravity)}>{p.gravity ? "✓ " : ""}{tx(t, "figPool_gravity", "gravity")}</button>
          <span className="w-px h-5 bg-[var(--border)] mx-1" />
          {label(tx(t, "figWater_view", "view"))}
          {VIEWS.map((v, i) => <button key={v} className={btn(p.view === i)} onClick={() => setK("view", i)}>{v}</button>)}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2 min-w-0">
            {slider("wave speed C²", p.courant2, v => setK("courant2", v), 0.05, 0.5, 0.01)}
            {slider("damping", p.damping, v => setK("damping", v), 0.97, 0.999, 0.001, "", 3)}
            {slider("drop radius", p.drop * 100, v => setK("drop", v / 100), 1.5, 10, 0.5, " cm", 1)}
            {slider("ball density", p.density, v => setK("density", v), 0.1, 2, 0.05, "×", 2)}
            {slider("clarity", p.clarity, v => setK("clarity", v), 0.3, 5, 0.05, "×")}
            {slider("sun elevation", sky.sunEl, v => setSk("sunEl", v), 10, 90, 1, "°", 0)}
            {slider("sun azimuth", sky.sunAz, v => setSk("sunAz", v), -180, 180, 1, "°", 0)}
            <div className="flex gap-1.5 flex-wrap">
              {WATER_COLOURS.map(x => <button key={x.id} className={btn(p.colour === x.id)} onClick={() => setK("colour", x.id)}>{x.label}</button>)}
            </div>
          </div>
          <div className="space-y-2 min-w-0">
            <div className="flex gap-1.5 flex-wrap">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[var(--text-main)]">
                c = {c.toFixed(2)} m/s
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[var(--text-main)]">
                Δx = {(dx * 1000).toFixed(1)} mm · Δt = 1/{STEPS_PER_S} s
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[var(--text-main)]">
                {tx(t, "figPool_sub", "ball submerged")} {(floatInfo * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{VIEWS[p.view]}</p>
            <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">{tx(t, note[0], note[1])}</p>
            <p className="text-[11px] font-mono text-[var(--text-muted)]">
              {tx(t, "figPool_hint", "a ball less dense than water (below 1×) floats with that share of itself submerged")}
            </p>
          </div>
        </div>
      </div>
    </FigureShell>
  );
}
