"use client";

import { useRef, useState, useEffect, useCallback } from "react";

// ── What this widget is ───────────────────────────────────────────────────────
// A real fragment shader running in WebGL. The body of main() is editable, the
// canvas can be dropped to a handful of fragments so each one is visible, and
// hovering a fragment reads back its gl_FragCoord, its UV and the colour the
// shader actually wrote for it.

const W = 340;                 // logical canvas width (CSS px)
const ASPECTS = {
  square: { label: "1:1",  h: 340 },
  wide:   { label: "16:10", h: 212 },
} as const;
type AspectKey = keyof typeof ASPECTS;

// Horizontal fragment counts. "full" renders at device resolution.
const RESOLUTIONS = [
  { label: "12",   cols: 12 },
  { label: "24",   cols: 24 },
  { label: "64",   cols: 64 },
  { label: "full", cols: 0 },
] as const;
const GRID_MAX_COLS = 32;      // draw the fragment grid only while it stays readable

// ── Presets ───────────────────────────────────────────────────────────────────
// Bodies are written the way the lesson writes GLSL (FragColor, not
// gl_FragColor). The WebGL preamble below maps one onto the other.
type Preset = { id: string; label: string; body: string };

const PRESETS: Preset[] = [
  {
    id: "uv", label: "UV",
    body: `// Pixel position → [0, 1] on both axes
vec2 uv = gl_FragCoord.xy / uResolution;

// red = u (left → right), green = v (bottom → top)
FragColor = vec4(uv, 0.0, 1.0);`,
  },
  {
    id: "centered", label: "Centered",
    body: `// Origin in the middle, height is [-1, 1],
// width is [-aspect, aspect] so circles stay round
vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution) / uResolution.y;

vec3 col = vec3(uv * 0.5 + 0.5, 0.0);

// Ring where length(uv) == 0.5
float ring = smoothstep(0.02, 0.0, abs(length(uv) - 0.5));
col = mix(col, vec3(1.0), ring);

FragColor = vec4(col, 1.0);`,
  },
  {
    id: "tiling", label: "fract()",
    body: `vec2 uv = gl_FragCoord.xy / uResolution;

// Scale up, keep only the fractional part:
// every tile gets its own [0, 1) UV
vec2 cell = fract(uv * uTiles);

FragColor = vec4(cell, 0.0, 1.0);`,
  },
  {
    id: "checker", label: "Checker",
    body: `vec2 uv = gl_FragCoord.xy / uResolution;

// floor() gives the integer id of each tile
vec2  id = floor(uv * uTiles);
float c  = mod(id.x + id.y, 2.0);

FragColor = vec4(vec3(c), 1.0);`,
  },
  {
    id: "polar", label: "Polar",
    body: `vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution) / uResolution.y;

float angle = atan(uv.y, uv.x);   // [-PI, PI]
float r     = length(uv);         // distance from the centre

// red = angle mapped to [0, 1], green = radius
FragColor = vec4(angle / 6.2831853 + 0.5, r, 0.0, 1.0);`,
  },
  {
    id: "mouse", label: "Mouse",
    body: `vec2 uv = gl_FragCoord.xy / uResolution;
vec2 m  = uMouse / uResolution;   // cursor, also in UV space

// Distance from this fragment to the cursor
float d = distance(uv, m);

vec3 col = vec3(uv, 0.0) * 0.35;
col += vec3(1.0, 0.8, 0.3) * smoothstep(0.25, 0.0, d);

FragColor = vec4(col, 1.0);`,
  },
  {
    id: "time", label: "uTime",
    body: `vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution) / uResolution.y;

float angle = atan(uv.y, uv.x) + uTime;
float r     = length(uv);
float bands = sin(angle * 6.0 + r * 10.0) * 0.5 + 0.5;

FragColor = vec4(bands, bands * 0.5, 1.0 - bands, 1.0);`,
  },
];

// What the reader sees above the editable body.
const HEADER = `uniform vec2  uResolution;  // canvas size, in fragments
uniform float uTime;        // seconds since start
uniform float uTiles;       // the tiles slider
uniform vec2  uMouse;       // cursor, in fragments

out vec4 FragColor;

void main() {`;

// What WebGL actually compiles. Keep the line count in sync with PREAMBLE_LINES.
const PREAMBLE = `precision highp float;
#define FragColor gl_FragColor
uniform vec2  uResolution;
uniform float uTime;
uniform float uTiles;
uniform vec2  uMouse;
void main() {
`;
const PREAMBLE_LINES = PREAMBLE.split("\n").length - 1;

const VERT = `attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

// ── GL helpers ────────────────────────────────────────────────────────────────
function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | string {
  const sh = gl.createShader(type);
  if (!sh) return "Could not create shader";
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh) ?? "Unknown compile error";
    gl.deleteShader(sh);
    return log;
  }
  return sh;
}

/** Links a program from the user body. Returns the program or an error log. */
function buildProgram(gl: WebGLRenderingContext, body: string): WebGLProgram | string {
  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  if (typeof vs === "string") return vs;
  const fs = compile(gl, gl.FRAGMENT_SHADER, `${PREAMBLE}${body}\n}`);
  if (typeof fs === "string") { gl.deleteShader(vs); return fs; }

  const prog = gl.createProgram();
  if (!prog) return "Could not create program";
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.bindAttribLocation(prog, 0, "aPos");
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(prog) ?? "Unknown link error";
    gl.deleteProgram(prog);
    return log;
  }
  return prog;
}

/** Rewrites "ERROR: 0:12:" so the line number matches the editable body. */
const remapLog = (log: string) =>
  log
    .replace(/ERROR:\s*0:(\d+):/g, (_, n) => `line ${Math.max(1, Number(n) - PREAMBLE_LINES)}:`)
    .replace(/\u0000/g, "")
    .trim();

const f2 = (n: number) => n.toFixed(2);
const f3 = (n: number) => n.toFixed(3);

// ── Component ─────────────────────────────────────────────────────────────────
export function InteractiveUV() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef     = useRef<WebGLRenderingContext | null>(null);
  const progRef   = useRef<WebGLProgram | null>(null);
  const startRef  = useRef(0);

  const [presetId, setPresetId] = useState("uv");
  const [body,     setBody]     = useState(PRESETS[0].body);
  const [error,    setError]    = useState<string | null>(null);
  const [noGL,     setNoGL]     = useState(false);
  const [tiles,    setTiles]    = useState(4);
  const [resIdx,   setResIdx]   = useState(1);
  const [aspect,   setAspect]   = useState<AspectKey>("square");
  const [playing,  setPlaying]  = useState(true);
  const [grid,     setGrid]     = useState(true);
  // Hovered fragment, in fragment units with (0,0) at the bottom-left.
  const [hover,    setHover]    = useState<{ x: number; y: number } | null>(null);
  const [color,    setColor]    = useState<[number, number, number] | null>(null);
  // Bumped whenever a new program is linked, to trigger a redraw.
  const [progVer,  setProgVer]  = useState(0);

  const H = ASPECTS[aspect].h;
  const res = RESOLUTIONS[resIdx];
  const dpr = typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio || 1, 2);
  const cols = res.cols || Math.round(W * dpr);
  const rows = res.cols ? Math.max(1, Math.round(res.cols * H / W)) : Math.round(H * dpr);
  const pixelated = res.cols > 0;

  const usesTime  = /\buTime\b/.test(body);
  const usesTiles = /\buTiles\b/.test(body);

  // Latest values for the draw call, so the animation loop never goes stale.
  const live = useRef({ tiles, hover, mouse: { x: cols / 2, y: rows / 2 } });
  live.current.tiles = tiles;
  live.current.hover = hover;

  // ── Context and the full-screen triangle ─────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true, antialias: false });
    if (!gl) { setNoGL(true); return; }
    glRef.current = gl;
    startRef.current = performance.now();

    // One oversized triangle covers the viewport with no diagonal seam.
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    return () => {
      if (progRef.current) gl.deleteProgram(progRef.current);
      progRef.current = null;
      gl.deleteBuffer(buf);
      glRef.current = null;
    };
  }, []);

  // ── Compile on edit (debounced) ──────────────────────────────────────────
  useEffect(() => {
    const id = setTimeout(() => {
      const gl = glRef.current;
      if (!gl) return;
      const result = buildProgram(gl, body);
      if (typeof result === "string") { setError(remapLog(result)); return; }
      // Keep drawing the last good program until a new one links.
      if (progRef.current) gl.deleteProgram(progRef.current);
      progRef.current = result;
      setError(null);
      setProgVer(v => v + 1);
    }, 220);
    return () => clearTimeout(id);
  }, [body]);

  // ── Draw ─────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const gl = glRef.current, canvas = canvasRef.current, prog = progRef.current;
    if (!gl || !canvas || !prog) return;
    if (canvas.width !== cols || canvas.height !== rows) {
      canvas.width = cols; canvas.height = rows;
    }
    gl.viewport(0, 0, cols, rows);
    gl.useProgram(prog);

    const L = live.current;
    const t = (performance.now() - startRef.current) / 1000;
    gl.uniform2f(gl.getUniformLocation(prog, "uResolution"), cols, rows);
    gl.uniform1f(gl.getUniformLocation(prog, "uTime"), t);
    gl.uniform1f(gl.getUniformLocation(prog, "uTiles"), L.tiles);
    gl.uniform2f(gl.getUniformLocation(prog, "uMouse"), L.mouse.x, L.mouse.y);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Read back what the shader wrote for the hovered fragment.
    if (L.hover) {
      const px = new Uint8Array(4);
      gl.readPixels(L.hover.x, L.hover.y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      setColor(prev =>
        prev && prev[0] === px[0] && prev[1] === px[1] && prev[2] === px[2]
          ? prev : [px[0], px[1], px[2]]);
    }
  }, [cols, rows]);

  useEffect(() => { draw(); }, [draw, progVer, tiles, hover]);

  // Animate only while the shader actually reads uTime.
  useEffect(() => {
    if (!usesTime || !playing) return;
    let raf = 0;
    const loop = () => { draw(); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [usesTime, playing, draw]);

  // ── Pointer → fragment ───────────────────────────────────────────────────
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const u = (e.clientX - r.left) / r.width;
    const v = 1 - (e.clientY - r.top) / r.height;   // GL origin is bottom-left
    const x = Math.max(0, Math.min(cols - 1, Math.floor(u * cols)));
    const y = Math.max(0, Math.min(rows - 1, Math.floor(v * rows)));
    live.current.mouse = { x: u * cols, y: v * rows };
    if (!hover || hover.x !== x || hover.y !== y) setHover({ x, y });
    else draw();                                     // uMouse moved within a fragment
  };

  const selectPreset = (p: Preset) => {
    setPresetId(p.id);
    setBody(p.body);
  };

  // ── Readout values ───────────────────────────────────────────────────────
  const frag     = hover ? { x: hover.x + 0.5, y: hover.y + 0.5 } : null;
  const uv       = frag ? { x: frag.x / cols, y: frag.y / rows } : null;
  const centered = frag ? { x: (frag.x * 2 - cols) / rows, y: (frag.y * 2 - rows) / rows } : null;

  const showGrid = grid && pixelated && cols <= GRID_MAX_COLS;
  const btn = (active: boolean) =>
    `px-2 py-1 text-[9px] font-mono rounded border transition-all ${
      active
        ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]"
        : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40"
    }`;

  return (
    <div className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">

      {/* Header */}
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          UV &amp; Fragment Shader — Interactive
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono text-right">
          hover a fragment · edit the shader
        </span>
      </div>

      <div className="flex flex-col md:flex-row">

        {/* ── Canvas ── */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center gap-2 bg-[var(--code-bg)] md:border-r border-[var(--border)] p-3">
          {noGL ? (
            <div style={{ width: "min(400px, 88vw)", aspectRatio: `${W} / ${H}` }}
              className="flex items-center justify-center text-[10px] font-mono text-[var(--text-muted)] text-center px-6">
              WebGL is not available in this browser, so the shader cannot run here.
            </div>
          ) : (
            <div
              className="relative select-none cursor-crosshair rounded overflow-hidden"
              style={{ width: "min(400px, 88vw)", aspectRatio: `${W} / ${H}`, touchAction: "none" }}
              onPointerMove={onPointerMove}
              onPointerDown={onPointerMove}
              onPointerLeave={() => { setHover(null); setColor(null); }}
            >
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ imageRendering: pixelated ? "pixelated" : "auto" }}
              />

              {/* Fragment grid + hovered fragment */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox={`0 0 ${cols} ${rows}`} preserveAspectRatio="none">
                {showGrid && Array.from({ length: cols - 1 }, (_, i) => (
                  <line key={`c${i}`} x1={i + 1} y1={0} x2={i + 1} y2={rows}
                    stroke="rgba(0,0,0,0.35)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                ))}
                {showGrid && Array.from({ length: rows - 1 }, (_, i) => (
                  <line key={`r${i}`} x1={0} y1={i + 1} x2={cols} y2={i + 1}
                    stroke="rgba(0,0,0,0.35)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                ))}
                {hover && (
                  <rect x={hover.x} y={rows - 1 - hover.y} width={1} height={1}
                    fill="none" stroke="#fff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                )}
              </svg>

              {/* Corner labels, in UV */}
              <span className="absolute left-1 bottom-1 text-[8.5px] font-mono px-1 rounded bg-black/55 text-white/90 pointer-events-none">
                (0,0)
              </span>
              <span className="absolute right-1 top-1 text-[8.5px] font-mono px-1 rounded bg-black/55 text-white/90 pointer-events-none">
                (1,1)
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 text-[9px] font-mono text-[var(--text-muted)]">
            <span><span className="text-red-400">u →</span> left to right</span>
            <span><span className="text-green-400">v ↑</span> bottom to top</span>
          </div>
        </div>

        {/* ── Panel ── */}
        <div className="flex-1 p-5 space-y-4 min-w-0">

          {/* Presets */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Preset</p>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map(p => (
                <button key={p.id} onClick={() => selectPreset(p)} className={btn(presetId === p.id)}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Readout */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">
              Hovered fragment
            </p>
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono text-[10px] min-h-[64px]">
              {frag && uv && centered ? (
                <>
                  <span className="text-[var(--text-muted)]">gl_FragCoord.xy</span>
                  <span className="text-[var(--text-main)]">({f2(frag.x)}, {f2(frag.y)})</span>
                  <span className="text-[var(--text-muted)]">uv  <span className="opacity-60">[0,1]</span></span>
                  <span>
                    (<span className="text-red-400">{f3(uv.x)}</span>, <span className="text-green-400">{f3(uv.y)}</span>)
                  </span>
                  <span className="text-[var(--text-muted)]">centered</span>
                  <span className="text-[var(--text-main)]">({f3(centered.x)}, {f3(centered.y)})</span>
                  <span className="text-[var(--text-muted)]">FragColor</span>
                  <span className="flex items-center gap-2 text-[var(--text-main)]">
                    {color && (
                      <>
                        <span className="w-3 h-3 rounded-sm border border-[var(--border)]"
                          style={{ background: `rgb(${color[0]},${color[1]},${color[2]})` }} />
                        ({f2(color[0] / 255)}, {f2(color[1] / 255)}, {f2(color[2] / 255)})
                      </>
                    )}
                  </span>
                </>
              ) : (
                <span className="col-span-2 text-[var(--text-muted)] opacity-70">
                  Move the cursor over the canvas. Each square is one fragment, and the shader runs once for each of them.
                </span>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-mono text-[var(--text-muted)] w-16">fragments</span>
              {RESOLUTIONS.map((r, i) => (
                <button key={r.label} onClick={() => { setResIdx(i); setHover(null); setColor(null); }}
                  className={btn(resIdx === i)}>
                  {r.label}
                </button>
              ))}
              <button onClick={() => setGrid(g => !g)} className={btn(grid)} disabled={!pixelated}>
                grid
              </button>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-mono text-[var(--text-muted)] w-16">aspect</span>
              {(Object.keys(ASPECTS) as AspectKey[]).map(k => (
                <button key={k} onClick={() => { setAspect(k); setHover(null); setColor(null); }}
                  className={btn(aspect === k)}>
                  {ASPECTS[k].label}
                </button>
              ))}
              {usesTime && (
                <button onClick={() => setPlaying(p => !p)} className={btn(playing)}>
                  {playing ? "❚❚ pause" : "▶ play"}
                </button>
              )}
            </div>
            {usesTiles && (
              <label className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-[var(--text-muted)] w-16">uTiles</span>
                <input type="range" min={1} max={12} step={1} value={tiles}
                  onChange={e => setTiles(Number(e.target.value))}
                  className="flex-1 accent-[var(--primary)]" />
                <span className="text-[10px] font-mono text-[var(--primary)] w-8 text-right">{tiles.toFixed(1)}</span>
              </label>
            )}
          </div>

          {/* Editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                Fragment shader
              </p>
              <button onClick={() => selectPreset(PRESETS.find(p => p.id === presetId) ?? PRESETS[0])}
                className="text-[9px] font-mono text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors px-2 py-0.5 rounded border border-transparent hover:border-[var(--border)]">
                reset code
              </button>
            </div>
            <div className={`rounded-lg border bg-[var(--code-bg)] overflow-hidden ${
              error ? "border-red-500/50" : "border-[var(--code-border)]"
            }`}>
              <pre className="text-[9.5px] font-mono px-3 pt-2.5 text-[var(--code-text)] opacity-55 whitespace-pre overflow-x-auto leading-relaxed">
                {HEADER}
              </pre>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                spellCheck={false}
                aria-label="Fragment shader body"
                rows={Math.min(14, Math.max(6, body.split("\n").length + 1))}
                onKeyDown={e => {
                  // Tab indents instead of leaving the editor
                  if (e.key !== "Tab") return;
                  e.preventDefault();
                  const el = e.currentTarget;
                  const { selectionStart: a, selectionEnd: b } = el;
                  const next = body.slice(0, a) + "    " + body.slice(b);
                  setBody(next);
                  requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = a + 4; });
                }}
                className="block w-full bg-transparent text-[10px] font-mono text-[var(--code-text)] leading-relaxed
                  pl-7 pr-3 py-1 resize-y focus:outline-none whitespace-pre overflow-x-auto"
              />
              <pre className="text-[9.5px] font-mono px-3 pb-2.5 text-[var(--code-text)] opacity-55">{"}"}</pre>
            </div>
            {error && (
              <pre className="mt-2 text-[9.5px] font-mono text-red-400 whitespace-pre-wrap leading-relaxed">
                {error}
              </pre>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
