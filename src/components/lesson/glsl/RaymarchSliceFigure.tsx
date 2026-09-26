"use client";

import { useEffect, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Label } from "../kit/svg";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// Sphere tracing in a 2D slice. The scene is a signed distance function: at
// any point it returns the distance to the nearest surface. That distance is
// a radius the ray can safely advance without hitting anything, so each step
// jumps exactly that far: huge steps in open space, tiny ones near surfaces.
// Drag the eye (blue) and the aim point (amber). Over-relaxation (ω > 1)
// steps further than safe and backs off when the unbounding circles stop
// overlapping (Keinert et al. 2014).

const W = 560, H = 300;
type P = { x: number; y: number };

const sdCircle = (p: P, c: P, r: number) => Math.hypot(p.x - c.x, p.y - c.y) - r;
const sdBox = (p: P, c: P, b: P) => {
  const dx = Math.abs(p.x - c.x) - b.x, dy = Math.abs(p.y - c.y) - b.y;
  return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0);
};
function scene(p: P) {
  const floor = 268 - p.y;                                          // plane y = 268 (surface below)
  const ball = sdCircle(p, { x: 330, y: 120 }, 42);
  const box = sdBox(p, { x: 450, y: 205 }, { x: 44, y: 28 });
  const pillar = sdBox(p, { x: 215, y: 220 }, { x: 14, y: 60 });
  return Math.min(floor, ball, box, pillar);
}

function march(o: P, d: P, maxSteps: number, eps: number, omega: number) {
  const steps: { p: P; r: number; back?: boolean }[] = [];
  let t = 0, prevR = 0, stepLen = 0, hit = false, w = omega;
  for (let i = 0; i < maxSteps; i++) {
    const p = { x: o.x + d.x * t, y: o.y + d.y * t };
    const r = scene(p);
    // Over-relaxation safety: the two unbounding circles must overlap, else undo the last step
    if (w > 1 && Math.abs(r) + prevR < stepLen) {
      t -= stepLen - stepLen / w; w = 1; stepLen = 0; steps.push({ p, r, back: true }); continue;
    }
    steps.push({ p, r });
    if (r < eps) { hit = true; break; }
    if (t > 900) break;
    stepLen = r * w; prevR = r; t += stepLen;
  }
  return { steps, hit, t };
}

export function RaymarchSliceFigure({ t: tr }: { t?: TrackTranslations }) {
  const [eye, setEye] = useState<P>({ x: 40, y: 60 });
  const [aim, setAim] = useState<P>({ x: 480, y: 262 });
  const [maxSteps, setMaxSteps] = useState(32);
  const [epsPow, setEpsPow] = useState(-0.5);                        // eps = 10^epsPow pixels
  const [omega, setOmega] = useState(1);
  const [field, setField] = useState(true);
  const [dragging, setDragging] = useState<"eye" | "aim" | null>(null);

  const len = Math.hypot(aim.x - eye.x, aim.y - eye.y) || 1;
  const dir = { x: (aim.x - eye.x) / len, y: (aim.y - eye.y) / len };
  const eps = 10 ** epsPow;
  const { steps, hit, t } = march(eye, dir, maxSteps, eps, omega);

  // The scene is static: paint its distance field once, at 2× resolution, into an image
  const [fieldUrl, setFieldUrl] = useState<string | null>(null);
  useEffect(() => {
    const c = document.createElement("canvas");
    c.width = W * 2; c.height = H * 2;
    const g = c.getContext("2d");
    if (!g) return;
    const img = g.createImageData(c.width, c.height);
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
      const d = scene({ x: (x + 0.5) / 2, y: (y + 0.5) / 2 });
      const i = (y * c.width + x) * 4;
      if (d < 0) { img.data.set([51, 65, 85, 235], i); continue; }
      const band = Math.abs(((d / 24) % 1) - 0.5) * 2;                 // 1 on each 24 px iso-line
      const a = Math.max(0, (band - 0.9) / 0.1) * 150 + Math.exp(-d / 30) * 40;
      img.data.set([30, 58, 95, Math.min(255, a)], i);
    }
    g.putImageData(img, 0, 0);
    setFieldUrl(c.toDataURL());
  }, []);

  const toP = (e: React.PointerEvent<SVGSVGElement>): P => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: Math.max(2, Math.min(W - 2, ((e.clientX - r.left) / r.width) * W)), y: Math.max(2, Math.min(H - 2, ((e.clientY - r.top) / r.height) * H)) };
  };

  return (
    <FigureShell>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(tr, "figMarch_title", "Sphere Tracing, One Step at a Time")}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{tx(tr, "figMarch_hint", "drag the eye and the aim point")}</span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none touch-none" role="img" aria-label="Sphere tracing"
          onPointerDown={e => {
            (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
            const p = toP(e);
            setDragging(Math.hypot(p.x - eye.x, p.y - eye.y) < Math.hypot(p.x - aim.x, p.y - aim.y) ? "eye" : "aim");
            if (Math.hypot(p.x - eye.x, p.y - eye.y) >= Math.hypot(p.x - aim.x, p.y - aim.y)) setAim(p);
          }}
          onPointerMove={e => { if (!dragging) return; const p = toP(e); if (dragging === "eye") setEye(p); else setAim(p); }}
          onPointerUp={() => setDragging(null)}>
          {fieldUrl && <image href={fieldUrl} x={0} y={0} width={W} height={H} opacity={field ? 1 : 0.35} preserveAspectRatio="none" />}
          <line x1={eye.x} y1={eye.y} x2={eye.x + dir.x * 900} y2={eye.y + dir.y * 900} stroke="var(--code-muted)" strokeDasharray="3 4" opacity={0.6} />
          {steps.map((s, i) => (
            <g key={i}>
              <circle cx={s.p.x} cy={s.p.y} r={Math.max(0, s.r)} fill={s.back ? "#ef4444" : "#3b82f6"} fillOpacity={0.05} stroke={s.back ? "#ef4444" : "#3b82f6"} strokeWidth={0.8} opacity={0.8} />
              <circle cx={s.p.x} cy={s.p.y} r={2.2} fill={s.back ? "#ef4444" : "#22c55e"} />
            </g>
          ))}
          {hit && <circle cx={steps[steps.length - 1].p.x} cy={steps[steps.length - 1].p.y} r={6} fill="none" stroke="#f59e0b" strokeWidth={2} />}
          <circle cx={eye.x} cy={eye.y} r={8} fill="#3b82f6" stroke="white" strokeWidth={1.5} style={{ cursor: "grab" }} />
          <circle cx={aim.x} cy={aim.y} r={6} fill="#f59e0b" stroke="white" strokeWidth={1.5} style={{ cursor: "grab" }} />
          <Label x={eye.x + 12} y={eye.y + 4} size={8} color="#3b82f6" bold>eye</Label>
        </svg>
      </div>
      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-[1fr_auto] items-start">
        <div className="space-y-2 min-w-0">
          {([["max steps", maxSteps, setMaxSteps, 1, 128, 1, String(maxSteps)], ["epsilon", epsPow, setEpsPow, -3, 1, 0.1, `${eps.toFixed(3)} px`], ["over-relax ω", omega, setOmega, 1, 1.9, 0.05, String(omega)]] as const).map(([label, v, set, min, max, step, shown]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-24">{label}</span>
              <input type="range" min={min} max={max} step={step} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-16 text-right">{shown}</span>
            </label>
          ))}
          <label className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)]">
            <input type="checkbox" checked={field} onChange={e => setField(e.target.checked)} className="accent-[var(--primary)]" />{tx(tr, "figMarch_field", "show distance bands (every 24 px)")}
          </label>
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            {tx(tr, "figMarch_note", "In the open, the circles are large and the ray covers most of the distance in a handful of steps. Aim the ray so it grazes the ball or the top of the box: near a surface the circles shrink and the ray crawls, and with too few steps it gives up before arriving. Those misses are the dark halos you see around objects in cheap raymarchers. Over-relaxation takes bigger steps and backs off (red) when a step overshot.")}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 font-mono text-[10.5px] leading-relaxed text-[var(--code-text)] min-w-[170px]">
          <div>{tx(tr, "figMarch_steps", "steps")}: <span className="text-[var(--primary)]">{steps.length}</span> / {maxSteps}</div>
          <div>{tx(tr, "figMarch_result", "result")}: <span className={hit ? "text-[#22c55e]" : "text-red-400"}>{hit ? "hit" : steps.length >= maxSteps ? "ran out of steps" : "escaped"}</span></div>
          <div>t = {t.toFixed(1)} px</div>
        </div>
      </div>
    </FigureShell>
  );
}
