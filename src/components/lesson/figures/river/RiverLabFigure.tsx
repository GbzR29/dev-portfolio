"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { compileProgram, forwardFrom, mat4, type Vec3 } from "../../kit/gl/gl";
import { FULL_VS, drawFullscreen, ensureColorTarget, type ColorTarget } from "../../kit/gl/glx";
import { GLView, rayDir, lookBasis, useAnimationTime, type Look } from "../../kit/gl/GLView";
import { useVisible } from "../../kit/figure";
import { DEFAULT_SKY_PARAMS, type SkyParams } from "../sky/proceduralSky";
import { applyUniforms, skyUniforms } from "../water/waterCommon";
import { WATER_COLOURS } from "../water/waterParams";
import { loadPhotos, bindPhotos, type PhotoList } from "../water/photoTextures";
import { PROBE_FS, makeSkyProbe, renderSkyProbe, bindSkyProbe, type SkyProbe } from "../water/skyProbe";
import { buildFlow, paintFlow, uploadFlow, areaAt, RIVER_VIEWS, type FlowMap } from "./riverScene";
import { makeDetailTexture } from "./riverDetail";
import { SKY_FS, TERRAIN_VS, TERRAIN_FS, WATER_VS, WATER_FS, GRID_N } from "./riverShader";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// A valley where a river runs through rapids between rocks, then widens into a
// lake. The flow map is computed from the channel's shape (continuity and
// Manning's law) and potential flow around each rock; the water carries its
// ripples and foam along it with the two-phase trick. The lake reflects the
// valley through a mirrored render. Drag to orbit, or switch on the brush and
// paint new currents on the water.

const PHOTOS: PhotoList = [
  ["uGrassA", "mat:grasspatchyground:albedo"], ["uGrassN", "mat:grasspatchyground:normal"],
  ["uSandA", "mat:groundsand:albedo"], ["uSandN", "mat:groundsand:normal"],
];
const MODES = ["scroll", "one phase", "two phases"] as const;
const VIEWS = ["final", "flow", "uv", "foam"] as const;
const CENTRE: [number, number] = [0, -5];

type Orbit = { target: Vec3; yaw: number; pitch: number; dist: number; fov: number };
type Params = {
  mode: number; period: number; offset: number; Q: number; rocks: boolean;
  ripple: number; wind: number; windDir: number; foam: number; caustics: number; distort: number;
  colour: string; clarity: number; view: number; paint: boolean;
};
const DEFAULT: Params = {
  mode: 2, period: 1.2, offset: 1, Q: 8, rocks: true, ripple: 1, wind: 0.25, windDir: 40,
  foam: 1, caustics: 1, distort: 0.04, colour: "lake", clarity: 1.6, view: 0, paint: false,
};

type Res = {
  sky: WebGLProgram; terrain: WebGLProgram; water: WebGLProgram; probeProg: WebGLProgram; probe: SkyProbe;
  vao: WebGLVertexArrayObject; grid: { vao: WebGLVertexArrayObject; count: number }; quad: WebGLVertexArrayObject;
  detail: WebGLTexture; flowTex: WebGLTexture | null; flowGen: number; refl: ColorTarget | null; tex: (WebGLTexture | null)[];
};

/** An n × n grid over −1 … 1 (attribute 0), as indexed triangles. */
function makeGrid(gl: WebGL2RenderingContext, n: number) {
  const pos = new Float32Array(n * n * 2), idx = new Uint32Array((n - 1) * (n - 1) * 6);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    pos[(j * n + i) * 2] = (i / (n - 1)) * 2 - 1;
    pos[(j * n + i) * 2 + 1] = (j / (n - 1)) * 2 - 1;
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

const eyeOf = (o: Orbit): Vec3 => {
  const f = forwardFrom(o.yaw, o.pitch);
  return [o.target[0] - f[0] * o.dist, o.target[1] - f[1] * o.dist, o.target[2] - f[2] * o.dist];
};
// Keep the eye at least 1.5 m above the water
const clampPitch = (o: Orbit) => Math.max(-1.45, Math.min(-Math.asin(Math.min(1, 1.5 / o.dist)), o.pitch));
const fromView = (i: number): Orbit => { const v = RIVER_VIEWS[i]; return { target: [...v.target] as Vec3, yaw: v.yaw, pitch: v.pitch, dist: v.dist, fov: 0.95 }; };

export function RiverLabFigure({ t }: { t?: TrackTranslations }) {
  const [orbit, setOrbit] = useState<Orbit>(() => fromView(0));
  const [p, setP] = useState<Params>(DEFAULT);
  const [sky, setSky] = useState<SkyParams>({ ...DEFAULT_SKY_PARAMS, sunEl: 32, sunAz: 125, cover: 0.3, exposure: 1.3 });
  const [playing, setPlaying] = useState(true);
  const [texReady, setTexReady] = useState(0);
  const { ref: figRef, on: inView } = useVisible<HTMLElement>();
  const time = useAnimationTime(playing && inView);
  const [aspect, setAspect] = useState(16 / 9);
  const overlay = useRef<HTMLDivElement>(null);
  const grab = useRef<null | { mode: "orbit" | "pan" | "paint"; x: number; y: number; hit?: [number, number] }>(null);

  // The flow map lives on the CPU (so the brush can change it) and is uploaded when its generation changes
  const flow = useRef<FlowMap | null>(null);
  const [flowGen, setFlowGen] = useState(0);
  useEffect(() => { flow.current = buildFlow(p.Q, p.rocks); setFlowGen(g => g + 1); }, [p.Q, p.rocks]);

  const look: Look = { yaw: orbit.yaw, pitch: orbit.pitch, fov: orbit.fov };
  const setK = <K extends keyof Params>(k: K, v: Params[K]) => setP(o => ({ ...o, [k]: v }));
  const setSk = <K extends keyof SkyParams>(k: K, v: SkyParams[K]) => setSky(o => ({ ...o, [k]: v }));
  const colour = WATER_COLOURS.find(c => c.id === p.colour) ?? WATER_COLOURS[2];

  const init = (gl: WebGL2RenderingContext): Res => {
    const quad = gl.createVertexArray()!;
    gl.bindVertexArray(quad);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    return {
      sky: compileProgram(gl, FULL_VS, SKY_FS), terrain: compileProgram(gl, TERRAIN_VS, TERRAIN_FS),
      water: compileProgram(gl, WATER_VS, WATER_FS), probeProg: compileProgram(gl, FULL_VS, PROBE_FS), probe: makeSkyProbe(gl),
      vao: gl.createVertexArray()!, grid: makeGrid(gl, GRID_N), quad,
      detail: makeDetailTexture(gl), flowTex: null, flowGen: -1, refl: null,
      tex: loadPhotos(gl, PHOTOS, () => setTexReady(n => n + 1)),
    };
  };

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    if (size.aspect !== aspect) setAspect(size.aspect);
    if (flow.current && r.flowGen !== flowGen) { r.flowTex = uploadFlow(gl, r.flowTex, flow.current); r.flowGen = flowGen; }
    if (!r.flowTex) return;

    // 1. The sky probe the water and the ground read
    const skySet = skyUniforms(sky, time);
    gl.useProgram(r.probeProg);
    applyUniforms(gl, r.probeProg, skySet);
    renderSkyProbe(gl, r.probe, r.probeProg, () => drawFullscreen(gl, r.vao));

    const eye = eyeOf(orbit);
    const { f, r: right, u } = lookBasis(look);
    const proj = mat4.perspective(orbit.fov, size.aspect, 0.1, 1500);
    const view = mat4.lookAt(eye, [eye[0] + f[0], eye[1] + f[1], eye[2] + f[2]], [0, 1, 0]);
    const wind = [Math.sin((p.windDir * Math.PI) / 180) * 0.6, -Math.cos((p.windDir * Math.PI) / 180) * 0.6];
    const common = {
      f1: {
        uTanHalf: Math.tan(orbit.fov / 2), uAspect: size.aspect, uPix: (2 * Math.tan(orbit.fov / 2)) / size.h,
        uFlowTime: time, uPeriod: p.period, uOffset: p.offset, uRipple: p.ripple, uWind: p.wind,
        uFoamAmt: p.foam, uDistort: p.distort, uCaustics: p.caustics, uMirror: 0,
      },
      i1: { uFlowMode: p.mode, uView: p.view },
      v3: { uCamPos: eye, uCamF: f, uCamR: right, uCamU: u, uAbsorb: colour.absorb.map(v => v / p.clarity), uScatter: colour.scatter },
      v4: {},
      m4: { uViewProj: mat4.multiply(proj, view) },
    };
    const bind = (prog: WebGLProgram, unit: number, name: string, tex: WebGLTexture) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(gl.getUniformLocation(prog, name), unit);
    };
    const pass = (prog: WebGLProgram) => {
      gl.useProgram(prog);
      applyUniforms(gl, prog, skySet, common);
      gl.uniform2f(gl.getUniformLocation(prog, "uCentre"), CENTRE[0], CENTRE[1]);
      gl.uniform2f(gl.getUniformLocation(prog, "uWindVec"), wind[0], wind[1]);
      bindPhotos(gl, prog, PHOTOS, r.tex, "uHave", [[0, 1], [2, 3]]);
      bindSkyProbe(gl, prog, r.probe, 4);
      bind(prog, 5, "uDetail", r.detail);
      bind(prog, 6, "uFlow", r.flowTex!);
    };

    // 2. The valley mirrored through the water plane, seen from the mirrored eye
    r.refl = ensureColorTarget(gl, r.refl, size.w, size.h, { float: true, depth: true });
    gl.bindFramebuffer(gl.FRAMEBUFFER, r.refl.fbo);
    gl.viewport(0, 0, size.w, size.h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    pass(r.terrain);
    gl.uniform1f(gl.getUniformLocation(r.terrain, "uMirror"), 1);
    gl.uniform3fv(gl.getUniformLocation(r.terrain, "uCamPos"), [eye[0], -eye[1], eye[2]]);
    gl.bindVertexArray(r.grid.vao);
    gl.drawElements(gl.TRIANGLES, r.grid.count, gl.UNSIGNED_INT, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // 3. Sky, valley, water
    gl.viewport(0, 0, size.w, size.h);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    pass(r.sky);
    drawFullscreen(gl, r.vao);
    gl.enable(gl.DEPTH_TEST);
    pass(r.terrain);
    gl.bindVertexArray(r.grid.vao);
    gl.drawElements(gl.TRIANGLES, r.grid.count, gl.UNSIGNED_INT, 0);
    pass(r.water);
    gl.uniform2f(gl.getUniformLocation(r.water, "uScreen"), size.w, size.h);
    bind(r.water, 7, "uRefl", r.refl.tex[0]);
    gl.bindVertexArray(r.quad);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  // ── Pointer: orbit, pan (right button) or paint the flow ────────────────────
  const hitWater = (e: { clientX: number; clientY: number }): [number, number] | null => {
    const b = overlay.current!.getBoundingClientRect();
    const d = rayDir(look, aspect, ((e.clientX - b.left) / b.width) * 2 - 1, 1 - ((e.clientY - b.top) / b.height) * 2);
    const o = eyeOf(orbit);
    if (d[1] >= -1e-3) return null;
    const s = -o[1] / d[1];
    return [o[0] + d[0] * s, o[2] + d[2] * s];
  };
  const onDown = (e: React.PointerEvent) => {
    overlay.current?.setPointerCapture(e.pointerId);
    const mode = p.paint && e.button === 0 ? "paint" : e.button === 2 || e.shiftKey ? "pan" : "orbit";
    grab.current = { mode, x: e.clientX, y: e.clientY, hit: mode === "paint" ? hitWater(e) ?? undefined : undefined };
  };
  const onMove = (e: React.PointerEvent) => {
    const g = grab.current;
    if (!g) return;
    const dx = e.clientX - g.x, dy = e.clientY - g.y;
    g.x = e.clientX; g.y = e.clientY;
    if (g.mode === "orbit") {
      const k = 0.0045 * (orbit.fov / 1.2);
      setOrbit(o => { const n = { ...o, yaw: o.yaw + dx * k, pitch: o.pitch - dy * k }; return { ...n, pitch: clampPitch(n) }; });
    } else if (g.mode === "pan") {
      // Slide the target over the ground, by an amount that follows the distance
      const k = orbit.dist * 0.0018, s = Math.sin(orbit.yaw), c = Math.cos(orbit.yaw);
      setOrbit(o => ({ ...o, target: [o.target[0] - (c * dx - s * dy) * k, 0, o.target[2] - (s * dx + c * dy) * k] }));
    } else {
      const h = hitWater(e);
      if (!h || !flow.current) return;
      if (g.hit) {
        const mx = h[0] - g.hit[0], mz = h[1] - g.hit[1], len = Math.hypot(mx, mz);
        if (len < 0.2) return;
        paintFlow(flow.current, h[0], h[1], [(mx / len) * 1.6, (mz / len) * 1.6], 2.5);
        setFlowGen(n => n + 1);
      }
      g.hit = h;
    }
  };
  const onUp = () => { grab.current = null; };

  // Wheel = distance (a listener, since React's wheel events are passive)
  useEffect(() => {
    const el = overlay.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setOrbit(o => { const n = { ...o, dist: Math.max(4, Math.min(160, o.dist * (e.deltaY > 0 ? 1.1 : 0.91))) }; return { ...n, pitch: clampPitch(n) }; });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Mean speeds Q / A in the rapids and in the lake: continuity at work
  const speeds = useMemo(() => ({ river: p.Q / areaAt(-30), lake: p.Q / areaAt(30) }), [p.Q]);

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
  const chip = (s: string) => (
    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[var(--text-main)]">{s}</span>
  );

  const notes: [string, string][] = [
    ["figRiver_n0", "Drag to orbit, right-drag (or shift-drag) to pan, scroll to zoom. The ripples and foam ride the flow map: quick and rough in the rapids, torn into white wakes behind the rocks, almost still on the lake, where the valley shows in the water."],
    ["figRiver_n1", "The flow map: hue is the direction, brightness the speed. The rapids are bright; the lake, with twelve times the cross-section, is nearly black. Each rock splits the stream, faster at its sides, with a slow wake behind it."],
    ["figRiver_n2", "The texture coordinates the ripples are read at, as a checkerboard: orange for one phase, blue for the other. Switch the method to 'scroll' and watch the squares stretch without end where the flow varies."],
    ["figRiver_n3", "Foam alone: the flow map says where and how much (wakes, the water piling against rocks, fast water), and the carried foam texture gives it its web-like shape."],
  ];
  const note = notes[p.view];

  return (
    <FigureShell ref={figRef}>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figRiver_title", "River Lab")}
        </span>
        <div className="flex gap-1.5 flex-wrap">
          {RIVER_VIEWS.map((v, i) => (
            <button key={v.id} className={btn(false)} onClick={() => setOrbit(fromView(i))}>{tx(t, `figRiver_view_${v.id}`, v.id)}</button>
          ))}
        </div>
      </div>

      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> init={init} draw={draw} look={look} resolution={0.8}
          frame={[orbit, p, sky, time, texReady, flowGen]} aspect={16 / 9}>
          <div ref={overlay} className={`absolute inset-0 ${p.paint ? "cursor-cell" : "cursor-grab"}`} style={{ touchAction: "none" }}
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onContextMenu={e => e.preventDefault()} />
        </GLView>
      </div>

      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap items-center">
          <button className={btn(playing)} onClick={() => setPlaying(v => !v)}>{playing ? "❚❚ pause" : "▶ play"}</button>
          <button className={btn(p.paint)} onClick={() => setK("paint", !p.paint)}>{p.paint ? "✓ " : ""}{tx(t, "figRiver_paint", "paint the flow")}</button>
          <button className={btn(false)} onClick={() => { flow.current = buildFlow(p.Q, p.rocks); setFlowGen(g => g + 1); }}>{tx(t, "figRiver_reset", "reset the flow")}</button>
          <button className={btn(p.rocks)} onClick={() => setK("rocks", !p.rocks)}>{p.rocks ? "✓ " : ""}{tx(t, "figRiver_rocks", "rocks in the flow")}</button>
          <span className="w-px h-5 bg-[var(--border)] mx-1" />
          {label(tx(t, "figWater_view", "view"))}
          {VIEWS.map((v, i) => <button key={v} className={btn(p.view === i)} onClick={() => setK("view", i)}>{v}</button>)}
        </div>
        <div className="flex gap-1.5 flex-wrap items-center">
          {label(tx(t, "figRiver_method", "method"))}
          {MODES.map((m, i) => <button key={m} className={btn(p.mode === i)} onClick={() => setK("mode", i)}>{m}</button>)}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2 min-w-0">
            {slider("discharge Q", p.Q, v => setK("Q", v), 1, 20, 0.5, " m³/s", 1)}
            {slider("cycle T", p.period, v => setK("period", v), 0.3, 4, 0.05, " s")}
            {slider("phase offset", p.offset, v => setK("offset", v), 0, 1, 0.05)}
            {slider("ripples", p.ripple, v => setK("ripple", v), 0, 2.5, 0.05)}
            {slider("foam", p.foam, v => setK("foam", v), 0, 2, 0.05)}
            {slider("wind", p.wind, v => setK("wind", v), 0, 1.5, 0.05)}
            {slider("wind from", p.windDir, v => setK("windDir", v), -180, 180, 5, "°", 0)}
          </div>
          <div className="space-y-2 min-w-0">
            {slider("caustics", p.caustics, v => setK("caustics", v), 0, 2, 0.05)}
            {slider("reflection wobble", p.distort, v => setK("distort", v), 0, 0.12, 0.005, "", 3)}
            {slider("clarity", p.clarity, v => setK("clarity", v), 0.3, 5, 0.05, "×")}
            {slider("sun elevation", sky.sunEl, v => setSk("sunEl", v), 3, 90, 1, "°", 0)}
            {slider("sun azimuth", sky.sunAz, v => setSk("sunAz", v), -180, 180, 1, "°", 0)}
            <div className="flex gap-1.5 flex-wrap">
              {WATER_COLOURS.map(x => <button key={x.id} className={btn(p.colour === x.id)} onClick={() => setK("colour", x.id)}>{x.label}</button>)}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {chip(`${tx(t, "figRiver_rapids", "rapids")} ū = ${speeds.river.toFixed(2)} m/s`)}
              {chip(`${tx(t, "figRiver_lake", "lake")} ū = ${speeds.lake.toFixed(2)} m/s`)}
            </div>
          </div>
        </div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{VIEWS[p.view]}</p>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">{tx(t, note[0], note[1])}</p>
        {p.paint && (
          <p className="text-[11px] font-mono text-[var(--text-muted)]">
            {tx(t, "figRiver_paintHint", "drag across the water: the current turns to follow your stroke (2.5 m brush, 1.6 m/s)")}
          </p>
        )}
      </div>
    </FigureShell>
  );
}
