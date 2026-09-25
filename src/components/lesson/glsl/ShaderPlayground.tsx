"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVisible } from "../kit/figure";
import { claimContext, releaseContext } from "../kit/gl/context";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, forwardFrom, type Vec3 } from "../kit/gl/gl";
import type { Mesh } from "../kit/gl/glx";
import {
  buildProgram, buildMeshes, parseControls, usedChannels, DEFAULT_VERTEX,
  type Mode, type MeshKind, type ShaderError, type Control,
} from "./engine";
import { textureOptions, loadOption, slotOption, slotChannel, withOption } from "./textures";

// ── What this widget is ───────────────────────────────────────────────────────
// A small ShaderToy inside the lesson. The reader edits real GLSL ES 3.00 and
// sees it recompile as they type. Errors point at their own line numbers,
// controls appear for annotated uniforms, and uTex0..3 can be bound to any
// texture in the site's library. "mesh" presets render a lit mesh with an
// editable vertex and fragment shader, and drag orbits the camera.
// It renders only while on screen.

export type PlaygroundPreset = {
  id: string;
  label: string;
  mode?: Mode;
  frag: string;
  vert?: string;
  mesh?: MeshKind;
  /** Texture option ids for uTex0..3 (see textures.ts), null = keep default. */
  channels?: (string | null)[];
  /** A sentence shown under the canvas when this preset is active. */
  note?: string;
  /** Mesh mode: how fragments combine with what is behind them. */
  blend?: "none" | "additive" | "alpha";
};

type GLState = {
  gl: WebGL2RenderingContext;
  program: WebGLProgram | null;
  mode: Mode;
  meshes: Record<MeshKind, Mesh> | null;
  empty: WebGLVertexArrayObject;
  black: WebGLTexture;
  tex: (WebGLTexture | null)[];
  locs: Map<string, WebGLUniformLocation | null>;
};

const DEFAULT_CHANNELS = ["noise", "clouds", "checker", "uvgrid"];

export function ShaderPlayground({ presets, t, title, aspect = 16 / 9, initialPreset, editorOpen = true, id }: {
  presets: PlaygroundPreset[];
  t?: TrackTranslations;
  title?: string;
  aspect?: number;
  initialPreset?: string;
  editorOpen?: boolean;
  /** Stable id for translations of preset notes. */
  id?: string;
}) {
  const first = presets.find(p => p.id === initialPreset) ?? presets[0];
  const [presetId, setPresetId] = useState(first.id);
  const preset = presets.find(p => p.id === presetId) ?? first;
  const mode: Mode = preset.mode ?? "2d";
  const [frag, setFrag] = useState(first.frag);
  const [vert, setVert] = useState(first.vert ?? DEFAULT_VERTEX);
  const [tab, setTab] = useState<"frag" | "vert">("frag");
  const [mesh, setMesh] = useState<MeshKind>(first.mesh ?? "sphere");
  const [channels, setChannels] = useState<string[]>(() => DEFAULT_CHANNELS.map((d, i) => first.channels?.[i] ?? d));
  const [errors, setErrors] = useState<ShaderError[]>([]);
  const [playing, setPlaying] = useState(true);
  const [showEditor, setShowEditor] = useState(editorOpen);
  const [values, setValues] = useState<Record<string, number | number[]>>({});
  const [fps, setFps] = useState(0);
  const [full, setFull] = useState(false);

  const rootRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<GLState | null>(null);
  const time = useRef({ t: 0, last: 0, frame: 0, fpsAcc: 0, fpsN: 0 });
  const mouse = useRef<[number, number, number, number]>([0, 0, 0, 0]);   // ShaderToy semantics: xy while pressed, zw = press point (negative after release)
  const orbit = useRef({ yaw: -0.6, pitch: -0.35, dist: 4.2 });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const { ref: viewRef, on: inView } = useVisible<HTMLElement>();
  const setRoot = useCallback((el: HTMLElement | null) => { rootRef.current = el; viewRef.current = el; }, [viewRef]);

  const controls = useMemo<Control[]>(() => parseControls(frag, mode === "mesh" ? vert : ""), [frag, vert, mode]);
  const used = useMemo(() => usedChannels(frag, mode === "mesh" ? vert : ""), [frag, vert, mode]);
  const options = useMemo(() => (typeof document === "undefined" ? [] : textureOptions()), []);

  const valuesRef = useRef(values); valuesRef.current = values;
  const controlsRef = useRef(controls); controlsRef.current = controls;
  const meshRef = useRef(mesh); meshRef.current = mesh;
  const blendRef = useRef(preset.blend ?? "none"); blendRef.current = preset.blend ?? "none";
  const playingRef = useRef(playing); playingRef.current = playing;

  // ── Context ──
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    claimContext(c);
    const gl = c.getContext("webgl2", { antialias: true, preserveDrawingBuffer: true });
    if (!gl) { setErrors([{ stage: "link", line: null, message: "WebGL2 is not available in this browser." }]); return; }
    const black = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, black);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
    glRef.current = { gl, program: null, mode, meshes: null, empty: gl.createVertexArray()!, black, tex: [null, null, null, null], locs: new Map() };
    return () => releaseContext(c, gl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Compile (debounced while typing) ──
  useEffect(() => {
    const id = setTimeout(() => {
      const S = glRef.current;
      if (!S) return;
      const { program, errors: errs } = buildProgram(S.gl, mode, frag, vert);
      setErrors(errs);
      if (program) {
        if (S.program) S.gl.deleteProgram(S.program);
        S.program = program; S.mode = mode; S.locs.clear();
        if (mode === "mesh" && !S.meshes) S.meshes = buildMeshes(S.gl);
      }
    }, 280);
    return () => clearTimeout(id);
  }, [frag, vert, mode]);

  // ── Textures ──
  useEffect(() => {
    const S = glRef.current;
    if (!S) return;
    let alive = true;
    channels.forEach((idc, i) => {
      if (!used.includes(i)) return;
      loadOption(S.gl, idc).then(tex => { if (alive) S.tex[i] = tex; }).catch(() => { if (alive) S.tex[i] = null; });
    });
    return () => { alive = false; };
  }, [channels, used]);

  // ── Default values for new controls ──
  useEffect(() => {
    setValues(v => {
      const n = { ...v };
      for (const c of controls) if (!(c.name in n)) n[c.name] = c.def;
      return n;
    });
  }, [controls]);

  // ── Render loop ──
  const renderOnce = useCallback(() => {
    const S = glRef.current, c = canvasRef.current;
    if (!S || !c || !S.program) return;
    const gl = S.gl;
    const r = c.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    const now = performance.now();
    const T = time.current;
    const dt = T.last ? Math.min(0.1, (now - T.last) / 1000) : 0;
    T.last = now;
    if (playingRef.current) { T.t += dt; T.frame++; }
    if (dt > 0) { T.fpsAcc += dt; T.fpsN++; if (T.fpsAcc > 0.5) { setFps(T.fpsN / T.fpsAcc); T.fpsAcc = 0; T.fpsN = 0; } }

    const loc = (n: string) => { if (!S.locs.has(n)) S.locs.set(n, gl.getUniformLocation(S.program!, n)); return S.locs.get(n)!; };
    gl.viewport(0, 0, w, h);
    gl.clearColor(0.055, 0.062, 0.08, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(S.program);
    gl.uniform2f(loc("uResolution"), w, h);
    gl.uniform1f(loc("uTime"), T.t);
    gl.uniform1f(loc("uDelta"), playingRef.current ? dt : 0);
    gl.uniform1i(loc("uFrame"), T.frame);
    gl.uniform4f(loc("uMouse"), mouse.current[0] * dpr, mouse.current[1] * dpr, mouse.current[2] * dpr, mouse.current[3] * dpr);
    for (let i = 0; i < 4; i++) {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, S.tex[i] ?? S.black);
      gl.uniform1i(loc(`uTex${i}`), i);
    }
    for (const ctl of controlsRef.current) {
      const v = valuesRef.current[ctl.name] ?? ctl.def;
      const l = loc(ctl.name);
      if (ctl.kind === "color") gl.uniform3fv(l, v as number[]);
      else if (ctl.type === "int" || ctl.type === "bool") gl.uniform1i(l, Math.round(v as number));
      else gl.uniform1f(l, v as number);
    }

    if (S.mode === "2d") {
      gl.disable(gl.DEPTH_TEST);
      gl.bindVertexArray(S.empty);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    } else if (S.meshes) {
      const o = orbit.current;
      const f = forwardFrom(o.yaw, o.pitch);
      const cam: Vec3 = [-f[0] * o.dist, -f[1] * o.dist, -f[2] * o.dist];
      gl.enable(gl.DEPTH_TEST);
      gl.uniformMatrix4fv(loc("uModel"), false, mat4.identity());
      gl.uniformMatrix4fv(loc("uView"), false, mat4.lookAt(cam, [0, 0, 0], [0, 1, 0]));
      gl.uniformMatrix4fv(loc("uProjection"), false, mat4.perspective(0.8, w / h, 0.05, 100));
      gl.uniform3fv(loc("uCamPos"), cam);
      const L = [0.45, 0.75, 0.48], ll = Math.hypot(...L);
      gl.uniform3f(loc("uLightDir"), L[0] / ll, L[1] / ll, L[2] / ll);
      const m = S.meshes[meshRef.current];
      const blend = blendRef.current;
      if (blend !== "none") {                                      // see-through: no depth writes, both sides
        gl.enable(gl.BLEND);
        if (blend === "additive") gl.blendFunc(gl.ONE, gl.ONE); else gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);
      }
      gl.bindVertexArray(m.vao);
      gl.drawArrays(gl.TRIANGLES, 0, m.count);
      gl.disable(gl.BLEND);
      gl.depthMask(true);
    }
  }, []);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    time.current.last = 0;
    const tick = () => { renderOnce(); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, renderOnce]);

  // ── Presets ──
  const choose = (id: string) => {
    const p = presets.find(q => q.id === id)!;
    setPresetId(id);
    setFrag(p.frag);
    setVert(p.vert ?? DEFAULT_VERTEX);
    setTab("frag");
    if (p.mesh) setMesh(p.mesh);
    setChannels(DEFAULT_CHANNELS.map((d, i) => p.channels?.[i] ?? d));
    setValues({});
    time.current.t = 0;
  };

  // ── Fullscreen ──
  useEffect(() => {
    const f = () => setFull(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", f);
    return () => document.removeEventListener("fullscreenchange", f);
  }, []);
  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else rootRef.current?.requestFullscreen?.();
  };

  // ── Pointer: uMouse, and orbit in mesh mode ──
  const pos = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return [e.clientX - r.left, r.height - (e.clientY - r.top)] as const;
  };
  const onDown = (e: React.PointerEvent) => {
    canvasRef.current?.setPointerCapture(e.pointerId);
    const [x, y] = pos(e);
    mouse.current = [x, y, x, y];
    drag.current = { x: e.clientX, y: e.clientY };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const [x, y] = pos(e);
    mouse.current = [x, y, mouse.current[2], mouse.current[3]];
    if (mode === "mesh") {
      const o = orbit.current;
      o.yaw += (e.clientX - drag.current!.x) * 0.006;                  // Blender-style: drag right, the object turns right
      o.pitch = Math.max(-1.45, Math.min(1.45, o.pitch - (e.clientY - drag.current!.y) * 0.006));
      drag.current = { x: e.clientX, y: e.clientY };
    }
  };
  const onUp = () => {
    drag.current = null;
    mouse.current = [mouse.current[0], mouse.current[1], -Math.abs(mouse.current[2]), -Math.abs(mouse.current[3])];
  };
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const wheel = (e: WheelEvent) => {
      if (mode !== "mesh") return;
      e.preventDefault();
      orbit.current.dist = Math.max(1.6, Math.min(12, orbit.current.dist * (e.deltaY > 0 ? 1.08 : 0.92)));
    };
    c.addEventListener("wheel", wheel, { passive: false });
    return () => c.removeEventListener("wheel", wheel);
  }, [mode]);

  // ── Editor helpers ──
  const code = tab === "frag" ? frag : vert;
  const setCode = tab === "frag" ? setFrag : setVert;
  const stage = tab === "frag" ? "fragment" : "vertex";
  const errLines = new Set(errors.filter(e => e.stage === stage && e.line).map(e => e.line!));
  const gutterRef = useRef<HTMLDivElement>(null);
  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget, s = el.selectionStart, en = el.selectionEnd;
      const next = code.slice(0, s) + "    " + code.slice(en);
      setCode(next);
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 4; });
    }
  };

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;
  const sel = "bg-[var(--code-bg)] border border-[var(--border)] rounded px-1.5 py-1 text-[10px] font-mono text-[var(--text-main)] max-w-[220px]";
  const groups = ["procedural", "materials", "prototype"];
  const nLines = code.split("\n").length;
  const note = preset.note ? tx(t, `${id ?? "pg"}_${preset.id}_note`, preset.note) : null;

  return (
    <figure ref={setRoot} className={`my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm ${full ? "flex flex-col h-screen" : ""}`}>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {title ?? tx(t, "pg_title", "Shader Playground")}
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {presets.length > 1 && (
            <select className={sel} value={presetId} onChange={e => choose(e.target.value)} aria-label="preset">
              {presets.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          )}
          <button className={btn(false)} onClick={() => setPlaying(p => !p)}>{playing ? "❚❚" : "▶"}</button>
          <button className={btn(false)} onClick={() => { time.current.t = 0; time.current.frame = 0; }} title="restart time">⟲</button>
          <button className={btn(false)} onClick={() => choose(presetId)} title="reset code">reset</button>
          <button className={btn(showEditor)} onClick={() => setShowEditor(s => !s)}>code</button>
          <button className={btn(full)} onClick={toggleFull} title="fullscreen">⛶</button>
        </div>
      </div>

      <div className={`${full ? "flex-1 min-h-0 grid md:grid-cols-2" : ""}`}>
        <div className={`bg-[var(--code-bg)] ${full ? "relative min-h-0" : "border-b border-[var(--border)] p-2"}`}>
          <div className="relative" style={full ? { position: "absolute", inset: 0 } : { aspectRatio: String(aspect) }}>
            <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full rounded ${mode === "mesh" ? "cursor-grab active:cursor-grabbing" : "cursor-crosshair"}`}
              style={{ touchAction: "none" }} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} />
            <div className="absolute top-2 right-2 font-mono text-[10px] text-white/80 bg-black/45 rounded px-1.5 py-0.5 pointer-events-none">
              {fps ? `${fps.toFixed(0)} fps` : ""} · t = {time.current.t.toFixed(1)}s
            </div>
            {errors.length > 0 && (
              <div className="absolute bottom-2 left-2 right-2 font-mono text-[10.5px] text-red-300 bg-black/70 rounded px-2 py-1 pointer-events-none max-h-[40%] overflow-hidden">
                {errors.slice(0, 3).map((e, i) => <div key={i}>{e.stage}{e.line ? `:${e.line}` : ""} — {e.message}</div>)}
              </div>
            )}
          </div>
        </div>

        <div className={`${full ? "min-h-0 overflow-auto" : ""} p-3 md:p-4 space-y-3`}>
          {(controls.length > 0 || mode === "mesh" || used.length > 0) && (
            <div className="space-y-2">
              {mode === "mesh" && (
                <div className="flex gap-1.5 flex-wrap items-center">
                  <span className="text-[10px] font-mono text-[var(--text-muted)] w-20">mesh</span>
                  {(["sphere", "torus", "cube", "plane"] as MeshKind[]).map(m => <button key={m} className={btn(mesh === m)} onClick={() => setMesh(m)}>{m}</button>)}
                </div>
              )}
              {controls.length > 0 && (
                <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                  {controls.map(c => (
                    <label key={c.name} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[var(--text-muted)] w-20 truncate" title={c.name}>{c.name}</span>
                      {c.kind === "slider" && (
                        <>
                          <input type="range" min={c.min} max={c.max} step={c.step} value={(values[c.name] as number) ?? c.def}
                            onChange={e => setValues(v => ({ ...v, [c.name]: Number(e.target.value) }))} className="flex-1 accent-[var(--primary)]" />
                          <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{Number((values[c.name] as number) ?? c.def).toFixed(c.type === "int" ? 0 : 2)}</span>
                        </>
                      )}
                      {c.kind === "color" && (
                        <input type="color" value={toHex((values[c.name] as number[]) ?? c.def)}
                          onChange={e => setValues(v => ({ ...v, [c.name]: fromHex(e.target.value) }))} className="h-6 w-12 bg-transparent" />
                      )}
                      {c.kind === "toggle" && (
                        <input type="checkbox" checked={((values[c.name] as number) ?? c.def) > 0.5}
                          onChange={e => setValues(v => ({ ...v, [c.name]: e.target.checked ? 1 : 0 }))} className="accent-[var(--primary)]" />
                      )}
                    </label>
                  ))}
                </div>
              )}
              {used.length > 0 && (
                <div className="flex gap-x-4 gap-y-1.5 flex-wrap">
                  {used.map(i => (
                    <label key={i} className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)]">
                      uTex{i}
                      <select className={sel} value={slotOption(channels[i])} onChange={e => setChannels(ch => ch.map((x, k) => (k === i ? withOption(x, e.target.value) : x)))}>
                        {groups.map(g => (
                          <optgroup key={g} label={g}>
                            {options.filter(o => o.group === g).map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                          </optgroup>
                        ))}
                      </select>
                      {slotChannel(channels[i]) && <span className="text-[var(--primary)]">· {slotChannel(channels[i])}</span>}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {note && <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">{note}</p>}

          {showEditor && (
            <div className="rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] overflow-hidden">
              {mode === "mesh" && (
                <div className="flex border-b border-[var(--code-border)] text-[10px] font-mono">
                  {(["frag", "vert"] as const).map(k => (
                    <button key={k} onClick={() => setTab(k)}
                      className={`px-3 py-1.5 ${tab === k ? "text-[var(--primary)] bg-[var(--primary-low)]" : "text-[var(--code-muted)] hover:text-[var(--code-text)]"}`}>
                      {k === "frag" ? "fragment" : "vertex"}{errors.some(e => e.stage === (k === "frag" ? "fragment" : "vertex")) ? " ●" : ""}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex max-h-[420px] overflow-auto" onScroll={e => { if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop; }}>
                <div ref={gutterRef} className="select-none text-right font-mono text-[11.5px] leading-[1.55] py-2 pl-2 pr-2 text-[var(--code-muted)] border-r border-[var(--code-border)]">
                  {Array.from({ length: nLines }, (_, i) => (
                    <div key={i} className={errLines.has(i + 1) ? "text-red-400 bg-red-500/15 rounded-sm" : ""}>{i + 1}</div>
                  ))}
                </div>
                <textarea value={code} onChange={e => setCode(e.target.value)} onKeyDown={onKey} spellCheck={false}
                  aria-label={`${stage} shader source`}
                  className="flex-1 min-w-0 resize-none bg-transparent font-mono text-[11.5px] leading-[1.55] py-2 px-3 text-[var(--code-text)] outline-none whitespace-pre overflow-hidden"
                  style={{ height: `${nLines * 1.55 * 11.5 + 18}px`, tabSize: 4 }} wrap="off" />
              </div>
              <div className={`px-3 py-1.5 border-t border-[var(--code-border)] font-mono text-[10px] ${errors.length ? "text-red-400" : "text-[#22c55e]"}`}>
                {errors.length
                  ? errors.map((e, i) => <div key={i}>{e.stage}{e.line ? ` line ${e.line}` : ""}: {e.message}</div>)
                  : tx(t, "pg_ok", "compiled ✓ — edits recompile automatically")}
              </div>
            </div>
          )}
        </div>
      </div>
    </figure>
  );
}

const toHex = (c: number[]) => "#" + c.map(v => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0")).join("");
const fromHex = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
