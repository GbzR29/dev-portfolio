"use client";

import { useEffect, useRef, useState } from "react";
import { FigureIcon } from "../kit/protoTexture";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Arrow, Label, type P2 } from "../kit/svg";

// ── What this figure shows ────────────────────────────────────────────────────
// Left: the textbook Phong diagram at one surface point — drag the light and the
// eye and watch N, L, R, V (and H for Blinn-Phong) and the three terms change.
// Right: the same light on a sphere, rendered per pixel with the same formulas,
// with each term switchable so you can see what it contributes.

const W = 360, H = 250;
const SURF_Y = 196;
const PNT: P2 = { x: 180, y: SURF_Y };
const VLEN = 78;

const COL_N = "#22c55e", COL_L = "#f59e0b", COL_R = "#ef4444", COL_V = "#3b82f6", COL_H = "#a855f7";
const OBJ = [0.35, 0.55, 1.0];            // object colour (blue-ish)

type V2 = { x: number; y: number };
const n2 = (v: V2): V2 => { const l = Math.hypot(v.x, v.y) || 1; return { x: v.x / l, y: v.y / l }; };
const d2 = (a: V2, b: V2) => a.x * b.x + a.y * b.y;

/** reflect(I, N) = I - 2·dot(N, I)·N, exactly like GLSL. */
const reflect2 = (i: V2, n: V2): V2 => { const k = 2 * d2(n, i); return { x: i.x - k * n.x, y: i.y - k * n.y }; };

const f2 = (v: number) => v.toFixed(2);

// ── Sphere render ─────────────────────────────────────────────────────────────
const SPH = 170;

function renderSphere(ctx: CanvasRenderingContext2D, light: [number, number, number], opts: {
  amb: number; spec: number; shin: number; blinn: boolean; show: { a: boolean; d: boolean; s: boolean };
}) {
  const img = ctx.createImageData(SPH, SPH);
  const ll = Math.hypot(...light);
  const L = light.map(c => c / ll);
  const V = [0, 0, 1];
  const Hh = (() => { const h = [L[0] + V[0], L[1] + V[1], L[2] + V[2]]; const l = Math.hypot(...h); return h.map(c => c / l); })();
  const r = SPH / 2 - 4;
  for (let py = 0; py < SPH; py++) {
    for (let px = 0; px < SPH; px++) {
      const x = (px - SPH / 2 + 0.5) / r, y = -(py - SPH / 2 + 0.5) / r;
      const rr = x * x + y * y;
      const o = (py * SPH + px) * 4;
      if (rr > 1) { img.data[o + 3] = 0; continue; }
      const N = [x, y, Math.sqrt(1 - rr)];
      const ndl = N[0] * L[0] + N[1] * L[1] + N[2] * L[2];
      const diff = Math.max(ndl, 0);
      let sp: number;
      if (opts.blinn) {
        sp = Math.pow(Math.max(N[0] * Hh[0] + N[1] * Hh[1] + N[2] * Hh[2], 0), opts.shin);
      } else {
        const R = [2 * ndl * N[0] - L[0], 2 * ndl * N[1] - L[1], 2 * ndl * N[2] - L[2]];
        sp = Math.pow(Math.max(R[2], 0), opts.shin);        // dot(R, V) with V = +z
      }
      if (ndl <= 0) sp = 0;
      const a = opts.show.a ? opts.amb : 0, d = opts.show.d ? diff : 0, s = opts.show.s ? sp * opts.spec : 0;
      // Anti-aliased rim
      const edge = Math.min(1, (1 - Math.sqrt(rr)) * r * 1.2);
      img.data[o]     = Math.min(255, (OBJ[0] * (a + d) + s) * 255);
      img.data[o + 1] = Math.min(255, (OBJ[1] * (a + d) + s) * 255);
      img.data[o + 2] = Math.min(255, (OBJ[2] * (a + d) + s) * 255);
      img.data[o + 3] = Math.round(edge * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function Sun({ p, active }: { p: P2; active: boolean }) {
  return (
    <g>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return <line key={i} x1={p.x + Math.cos(a) * 11} y1={p.y + Math.sin(a) * 11}
          x2={p.x + Math.cos(a) * 16} y2={p.y + Math.sin(a) * 16} stroke={COL_L} strokeWidth="2" strokeLinecap="round" />;
      })}
      <circle cx={p.x} cy={p.y} r={8} fill={COL_L} stroke={active ? "white" : "none"} strokeWidth="1.5" />
    </g>
  );
}

function Eye({ p, look, active }: { p: P2; look: V2; active: boolean }) {
  return (
    <g>
      <path d={`M ${p.x - 13} ${p.y} Q ${p.x} ${p.y - 11} ${p.x + 13} ${p.y} Q ${p.x} ${p.y + 11} ${p.x - 13} ${p.y} Z`}
        fill="var(--card)" stroke={COL_V} strokeWidth={active ? 2.2 : 1.6} />
      <circle cx={p.x + look.x * 3} cy={p.y + look.y * 3} r={4.2} fill={COL_V} />
      <circle cx={p.x + look.x * 3} cy={p.y + look.y * 3} r={1.6} fill="var(--code-bg)" />
    </g>
  );
}

// ── Figure ────────────────────────────────────────────────────────────────────
export function PhongFigure({ t }: { t?: TrackTranslations }) {
  const [light, setLight] = useState<P2>({ x: 90, y: 60 });
  const [eye, setEye] = useState<P2>({ x: 300, y: 80 });
  const [shin, setShin] = useState(32);
  const [amb, setAmb] = useState(0.1);
  const [specS, setSpecS] = useState(0.5);
  const [blinn, setBlinn] = useState(false);
  const [show, setShow] = useState({ a: true, d: true, s: true });
  const [hover, setHover] = useState<"light" | "eye" | null>(null);
  const drag = useRef<"light" | "eye" | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  // Screen y grows downward; flip it so the maths reads like the shader.
  const up = (a: P2, b: P2): V2 => ({ x: b.x - a.x, y: -(b.y - a.y) });
  const N: V2 = { x: 0, y: 1 };
  const L = n2(up(PNT, light));
  const V = n2(up(PNT, eye));
  const R = reflect2({ x: -L.x, y: -L.y }, N);
  const Hv = n2({ x: L.x + V.x, y: L.y + V.y });

  const diffuse = Math.max(d2(N, L), 0);
  const specBase = blinn ? Math.max(d2(N, Hv), 0) : Math.max(d2(V, R), 0);
  const specular = diffuse > 0 ? Math.pow(specBase, shin) * specS : 0;
  const total = amb + diffuse + specular;

  // The sphere uses the same light direction, tilted slightly toward the viewer
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    renderSphere(ctx, [L.x, L.y, 0.65], { amb, spec: specS, shin, blinn, show });
  }, [L.x, L.y, amb, specS, shin, blinn, show]);

  // ── Dragging the light and the eye ────────────────────────────────────────
  const local = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };
  const pick = (p: P2) =>
    Math.hypot(p.x - light.x, p.y - light.y) < 20 ? "light"
      : Math.hypot(p.x - eye.x, p.y - eye.y) < 18 ? "eye" : null;
  const clampP = (p: P2): P2 => ({ x: Math.max(16, Math.min(W - 16, p.x)), y: Math.max(16, Math.min(SURF_Y - 14, p.y)) });

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const k = pick(local(e));
    if (!k) return;
    drag.current = k;
    svg.current?.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const p = local(e);
    if (!drag.current) { setHover(pick(p)); return; }
    (drag.current === "light" ? setLight : setEye)(clampP(p));
  };
  const onUp = () => { drag.current = null; };

  // Vector tips in screen space
  const tip = (v: V2, l = VLEN): P2 => ({ x: PNT.x + v.x * l, y: PNT.y - v.y * l });

  // Angle arc between two unit vectors, around PNT
  const arc = (a: V2, b: V2, r: number, color: string, label: string) => {
    const a0 = Math.atan2(a.y, a.x), a1 = Math.atan2(b.y, b.x);
    let d = a1 - a0;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    const p0 = { x: PNT.x + Math.cos(a0) * r, y: PNT.y - Math.sin(a0) * r };
    const p1 = { x: PNT.x + Math.cos(a0 + d) * r, y: PNT.y - Math.sin(a0 + d) * r };
    const m = { x: PNT.x + Math.cos(a0 + d / 2) * (r + 11), y: PNT.y - Math.sin(a0 + d / 2) * (r + 11) };
    return (
      <g>
        <path d={`M ${p0.x} ${p0.y} A ${r} ${r} 0 0 ${d > 0 ? 0 : 1} ${p1.x} ${p1.y}`} fill="none" stroke={color} strokeWidth="1.3" />
        <text x={m.x} y={m.y + 3} fill={color} fontSize="9" fontFamily="monospace" textAnchor="middle">{label}</text>
      </g>
    );
  };

  const bar = (label: string, value: number, color: string, on: boolean, toggle?: () => void) => (
    <div className="flex items-center gap-2">
      <button onClick={toggle} disabled={!toggle}
        className={`w-20 text-left text-[10px] font-mono flex items-center gap-1.5 ${toggle ? "cursor-pointer" : "cursor-default"} ${on ? "text-[var(--text-main)]" : "text-[var(--text-muted)] line-through opacity-60"}`}>
        {toggle && <span className="w-2.5 h-2.5 rounded-sm border flex-shrink-0" style={{ borderColor: color, background: on ? color : "transparent" }} />}
        {label}
      </button>
      <div className="flex-1 h-2.5 rounded-full bg-[var(--code-bg)] border border-[var(--code-border)] overflow-hidden">
        <div className="h-full rounded-full transition-[width] duration-100" style={{ width: `${Math.min(1, value) * 100}%`, background: color, opacity: on ? 1 : 0.25 }} />
      </div>
      <span className="w-10 text-right text-[10px] font-mono text-[var(--text-main)]">{f2(value)}</span>
    </div>
  );

  const slider = (label: string, value: number, set: (n: number) => void, min: number, max: number, step: number) => (
    <label className="flex items-center gap-2">
      <span className="text-[9px] font-mono text-[var(--text-muted)] w-20">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
      <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{value}</span>
    </label>
  );

  const behind = d2(N, L) <= 0;
  const lookDir = n2({ x: PNT.x - eye.x, y: PNT.y - eye.y });

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figPhong_title", "Phong Lighting — The Vectors Behind the Shine")}
        </span>
        <div className="flex gap-1.5">
          {([false, true] as const).map(b => (
            <button key={String(b)} onClick={() => setBlinn(b)}
              className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all ${
                blinn === b ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]"
                  : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40"}`}>
              {b ? "Blinn-Phong" : "Phong"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-[1.5fr_1fr]">
        {/* Diagram */}
        <div className="bg-[var(--code-bg)] md:border-r border-b md:border-b-0 border-[var(--border)]">
          <svg ref={svg} viewBox={`0 0 ${W} ${H}`}
            className={`w-full h-auto select-none ${hover ? "cursor-grab" : "cursor-default"}`}
            style={{ touchAction: "none" }} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
            role="img" aria-label="Phong lighting vectors">
            {/* Surface */}
            <rect x={30} y={SURF_Y} width={W - 60} height={H - SURF_Y - 18} fill="rgba(90,140,255,0.12)" />
            <line x1={30} y1={SURF_Y} x2={W - 30} y2={SURF_Y} stroke="var(--code-muted)" strokeWidth="1.5" />
            {Array.from({ length: 14 }, (_, i) => (
              <line key={i} x1={40 + i * 21} y1={SURF_Y + 2} x2={30 + i * 21} y2={SURF_Y + 12} stroke="var(--code-line)" />
            ))}

            {/* Light ray */}
            <line x1={light.x} y1={light.y} x2={PNT.x} y2={PNT.y} stroke={COL_L} strokeWidth="1" strokeDasharray="4 4" opacity={0.6} />

            {/* Angles */}
            {!behind && arc(N, L, 30, COL_L, "θ")}
            {!behind && !blinn && arc(R, V, 46, COL_R, "α")}
            {!behind && blinn && arc(N, Hv, 46, COL_H, "α")}

            {/* Vectors */}
            <Arrow a={PNT} b={tip(N)} color={COL_N} w={2.4} head={8} />
            <Arrow a={PNT} b={tip(L)} color={COL_L} w={2.4} head={8} />
            {!behind && !blinn && <Arrow a={PNT} b={tip(R)} color={COL_R} w={2.4} head={8} />}
            <Arrow a={PNT} b={tip(V)} color={COL_V} w={2.4} head={8} />
            {blinn && <Arrow a={PNT} b={tip(Hv)} color={COL_H} w={2.4} head={8} />}

            <Label x={tip(N).x + 6} y={tip(N).y + 2} color={COL_N} bold>N</Label>
            <Label x={tip(L).x + 6} y={tip(L).y + 10} color={COL_L} bold>L</Label>
            {!behind && !blinn && <Label x={tip(R).x + 6} y={tip(R).y + 10} color={COL_R} bold>R</Label>}
            <Label x={tip(V).x + 6} y={tip(V).y + 10} color={COL_V} bold>V</Label>
            {blinn && <Label x={tip(Hv).x + 6} y={tip(Hv).y - 2} color={COL_H} bold>H</Label>}

            <circle cx={PNT.x} cy={PNT.y} r={3.5} fill="var(--text-main)" />
            <Label x={PNT.x + 6} y={PNT.y + 15} color="var(--text-main)">P</Label>

            <FigureIcon name="sun" x={light.x} y={light.y} size={36}>
              <Sun p={light} active={hover === "light"} />
            </FigureIcon>
            <FigureIcon name="eye" x={eye.x} y={eye.y} size={32}>
              <Eye p={eye} look={lookDir} active={hover === "eye"} />
            </FigureIcon>

            {behind && (
              <Label x={W / 2} y={22} anchor="middle" color={COL_R} bold>
                {tx(t, "figPhong_behind", "light below the surface: dot(N, L) < 0 → no diffuse, no specular")}
              </Label>
            )}
          </svg>
        </div>

        {/* Sphere + numbers */}
        <div className="p-4 space-y-3 min-w-0">
          <div className="flex items-center gap-4">
            <canvas ref={canvas} width={SPH} height={SPH} className="w-28 h-28 flex-shrink-0"
              aria-label="Sphere lit with the same light" />
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              {tx(t, "figPhong_sphere", "The same light on a sphere, seen from the front. Every pixel runs the three formulas with its own normal.")}
            </p>
          </div>

          <div className="space-y-1.5">
            {bar("ambient", amb, "#94a3b8", show.a, () => setShow(s => ({ ...s, a: !s.a })))}
            {bar("diffuse", diffuse, COL_L, show.d, () => setShow(s => ({ ...s, d: !s.d })))}
            {bar("specular", specular, "var(--code-text)", show.s, () => setShow(s => ({ ...s, s: !s.s })))}
            {bar("total", Math.min(1, total), "var(--primary)", true)}
          </div>
        </div>
      </div>

      <div className="p-4 md:p-5 border-t border-[var(--border)] grid gap-4 md:grid-cols-2">
        <pre className="text-[10px] font-mono rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 overflow-x-auto leading-relaxed text-[var(--code-text)]">
{`ambient = ${f2(amb)}
diffuse = max(dot(N, L), 0)      = ${f2(diffuse)}
${blinn
  ? `H       = normalize(L + V)
spec    = pow(max(dot(N, H), 0), ${shin}) = ${f2(diffuse > 0 ? Math.pow(specBase, shin) : 0)}`
  : `R       = reflect(-L, N)
spec    = pow(max(dot(V, R), 0), ${shin}) = ${f2(diffuse > 0 ? Math.pow(specBase, shin) : 0)}`}
result  = (ambient + diffuse) * objectColor
        + ${f2(specS)} * spec * lightColor`}
        </pre>
        <div className="space-y-1.5">
          {slider("shininess", shin, setShin, 2, 256, 1)}
          {slider("ambient", amb, setAmb, 0, 0.5, 0.01)}
          {slider("specular str.", specS, setSpecS, 0, 1, 0.05)}
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed pt-1">
            {blinn
              ? tx(t, "figPhong_blinnNote", "Blinn-Phong measures N against the halfway vector H instead of V against R. The highlight is wider for the same shininess, so real projects raise the exponent (roughly ×2–4).")
              : tx(t, "figPhong_note", "Drag the sun and the eye. Diffuse only cares about θ (light vs normal); specular only about α (reflection vs eye). Raise shininess and the highlight gets smaller and sharper.")}
          </p>
        </div>
      </div>
    </figure>
  );
}
