"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { compileProgram } from "../../kit/gl/gl";
import { FULL_VS, drawFullscreen } from "../../kit/gl/glx";
import { GLView, useAnimationTime, type Look } from "../../kit/gl/GLView";
import { useVisible } from "../../kit/figure";
import { WINDOW_FS, WINDOW_PRESETS, DEFAULT_WINDOW, paintCity, type WindowParams } from "./windowShader";

// ── What this figure shows ────────────────────────────────────────────────────
// A window on a rainy night. Drops and trails refract the street behind; the
// condensation is a mask you wipe with the pointer, and it slowly fogs up
// again. Frosted glass, dispersion and the room's reflection are separate
// sliders so each term can be judged on its own.

type Res = { prog: WebGLProgram; vao: WebGLVertexArrayObject; scene: WebGLTexture; mask: WebGLTexture };
const MW = 192, MH = 108;                   // condensation mask resolution
const VIEWS = ["final", "drop mask", "drop normals", "trails", "condensation"] as const;
const LOOK: Look = { yaw: 0, pitch: 0, fov: 1 };

export function WindowLabFigure({ t }: { t?: TrackTranslations }) {
  const [p, setP] = useState<WindowParams>({ ...DEFAULT_WINDOW });
  const [preset, setPreset] = useState("rain");
  const [playing, setPlaying] = useState(true);
  const { ref: figRef, on: inView } = useVisible<HTMLElement>();
  const time = useAnimationTime(playing && inView);

  // Condensation: 255 = fogged, 0 = wiped clean. Lives outside React state.
  const mask = useRef(new Uint8Array(MW * MH).fill(255));
  const lastT = useRef(0);
  const painting = useRef(false);

  const set = <K extends keyof WindowParams>(k: K, v: WindowParams[K]) => { setP(o => ({ ...o, [k]: v })); setPreset(""); };
  const loadPreset = (id: string) => {
    setP(o => ({ ...DEFAULT_WINDOW, ...WINDOW_PRESETS.find(x => x.id === id)!.p, view: o.view }));
    mask.current.fill(255);
    setPreset(id);
  };

  const wipe = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!painting.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const cx = ((e.clientX - r.left) / r.width) * MW, cy = (1 - (e.clientY - r.top) / r.height) * MH;
    const R = MH * 0.09;
    for (let y = Math.max(0, Math.floor(cy - R)); y < Math.min(MH, cy + R); y++)
      for (let x = Math.max(0, Math.floor(cx - R)); x < Math.min(MW, cx + R); x++) {
        const d = Math.hypot(x - cx, y - cy) / R;
        if (d < 1) { const i = y * MW + x; mask.current[i] = Math.min(mask.current[i], Math.round(255 * d * d)); }
      }
  };

  const init = (gl: WebGL2RenderingContext): Res => {
    const scene = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, scene);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);             // canvas rows start at the top
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, paintCity());
    gl.generateMipmap(gl.TEXTURE_2D);                         // the blur levels
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    const m = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, m);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, MW, MH, 0, gl.RED, gl.UNSIGNED_BYTE, mask.current);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return { prog: compileProgram(gl, FULL_VS, WINDOW_FS), vao: gl.createVertexArray()!, scene, mask: m };
  };

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    // The fog creeps back: about 25 s from wiped to fully fogged
    const dt = Math.min(0.1, Math.max(0, time - lastT.current));
    lastT.current = time;
    const add = Math.round(dt * 10);
    if (add > 0) for (let i = 0; i < mask.current.length; i++) mask.current[i] = Math.min(255, mask.current[i] + add);
    gl.bindTexture(gl.TEXTURE_2D, r.mask);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, MW, MH, gl.RED, gl.UNSIGNED_BYTE, mask.current);

    gl.viewport(0, 0, size.w, size.h);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(r.prog);
    const u = (n: string) => gl.getUniformLocation(r.prog, n);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, r.scene); gl.uniform1i(u("uScene"), 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, r.mask); gl.uniform1i(u("uMask"), 1);
    gl.uniform2f(u("uRes"), size.w, size.h);
    const f: [string, number][] = [["uT", time + 20], ["uRain", p.rain], ["uSpeed", p.speed], ["uSize", p.size], ["uStatic", p.staticDrops],
      ["uTrails", p.trails], ["uFog", p.fog], ["uBlur", p.blur], ["uFrost", p.frost], ["uRefr", p.refraction], ["uDisp", p.dispersion], ["uRefl", p.reflection]];
    f.forEach(([k, v]) => gl.uniform1f(u(k), v));
    gl.uniform3fv(u("uTint"), p.tint);
    gl.uniform1i(u("uView"), p.view);
    drawFullscreen(gl, r.vao);
  };

  const btn = (active: boolean) =>
    `px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all ${active
      ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]"
      : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40"}`;
  const slider = (label: string, value: number, onChange: (v: number) => void, min: number, max: number, step: number) => (
    <label key={label} className="flex items-center gap-2">
      <span className="text-[9px] font-mono text-[var(--text-muted)] w-24 shrink-0">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))} className="flex-1 min-w-0 accent-[var(--primary)]" />
      <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{+value.toFixed(2)}</span>
    </label>
  );
  const notes: [string, string][] = [
    ["figWin_n0", "Wipe the fogged glass with the pointer (drag); it slowly fogs up again. Through a drop the street is sharp and bent: every drop is a tiny lens that also wiped its own patch of condensation."],
    ["figWin_n1", "The drop mask c: static drops, sliding drops and the droplets they leave, from three layers of grid cells."],
    ["figWin_n2", "The gradient of c (x → red, y → green). It is the offset used to read the background, so the drop's shape decides how it bends the image."],
    ["figWin_n3", "Trails: the strips a sliding drop has swept. They clear the condensation, exactly as real drops do."],
    ["figWin_n4", "The condensation that is left: the wiped mask times the fog amount, minus the trails. It chooses how blurry the background is at each pixel."],
  ];
  const note = notes[p.view];

  return (
    <figure ref={figRef} className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{tx(t, "figWin_title", "Window Lab — Rain, Fog and Frost on Glass")}</span>
        <div className="flex gap-1.5 flex-wrap">
          {WINDOW_PRESETS.map(x => <button key={x.id} className={btn(preset === x.id)} onClick={() => loadPreset(x.id)}>{x.label}</button>)}
        </div>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <div className="cursor-crosshair" style={{ touchAction: "none" }}
          onPointerDown={e => { painting.current = true; e.currentTarget.setPointerCapture(e.pointerId); wipe(e); }}
          onPointerMove={wipe}
          onPointerUp={() => { painting.current = false; }}
          onPointerCancel={() => { painting.current = false; }}>
          <GLView<Res> init={init} draw={draw} look={LOOK} frame={[p, time]} aspect={16 / 9} />
        </div>
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap items-center">
          <button className={btn(playing)} onClick={() => setPlaying(v => !v)}>{playing ? "❚❚ pause" : "▶ play"}</button>
          <button className={btn(false)} onClick={() => mask.current.fill(255)}>{tx(t, "figWin_refog", "fog it up again")}</button>
          <span className="w-px h-5 bg-[var(--border)] mx-1" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{tx(t, "figWater_view", "view")}</span>
          {VIEWS.map((v, i) => <button key={v} className={btn(p.view === i)} onClick={() => setP(o => ({ ...o, view: i }))}>{v}</button>)}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="grid gap-x-5 gap-y-1.5">
            {slider("rain", p.rain, v => set("rain", v), 0, 1, 0.01)}
            {slider("drop speed", p.speed, v => set("speed", v), 0, 3, 0.05)}
            {slider("drop size", p.size, v => set("size", v), 0.4, 2, 0.01)}
            {slider("static drops", p.staticDrops, v => set("staticDrops", v), 0, 1, 0.01)}
            {slider("trails", p.trails, v => set("trails", v), 0, 1, 0.01)}
            {slider("condensation", p.fog, v => set("fog", v), 0, 1, 0.01)}
            {slider("fog blur", p.blur, v => set("blur", v), 0, 7, 0.1)}
            {slider("frost", p.frost, v => set("frost", v), 0, 1, 0.01)}
            {slider("refraction", p.refraction, v => set("refraction", v), 0, 3, 0.01)}
            {slider("dispersion", p.dispersion, v => set("dispersion", v), 0, 1.5, 0.01)}
            {slider("room reflection", p.reflection, v => set("reflection", v), 0, 1, 0.01)}
          </div>
          <div className="space-y-2 min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{VIEWS[p.view]}</p>
            <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">{tx(t, note[0], note[1])}</p>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              {tx(t, "figWin_credit", "Rain technique after Martijn Steinrucken (BigWIngs), “Heartfelt”, Shadertoy 2017.")}
            </p>
          </div>
        </div>
      </div>
    </figure>
  );
}
