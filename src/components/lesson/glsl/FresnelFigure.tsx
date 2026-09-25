"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Arrow, Label } from "../figures/svg";

// ── What this figure shows ────────────────────────────────────────────────────
// Left: a ray hitting the boundary between two media. Snell's law bends the
// transmitted ray, n₁ sin θᵢ = n₂ sin θₜ, and the Fresnel equations split
// the energy: the reflected ray's brightness is R, the refracted ray's 1 − R.
// Going from dense to thin (glass → air) past the critical angle, no
// refracted ray exists: total internal reflection.
// Right: R(θ) exact (average of s and p polarisation) vs Schlick's fit,
// R ≈ R₀ + (1 − R₀)(1 − cos θ)⁵ — the curve every real-time shader uses.

const MEDIA = [["air", 1.0], ["water", 1.333], ["glass", 1.5], ["diamond", 2.42]] as const;
const W = 560, H = 250, CX = 150, CY = 125, RAY = 105;

function fresnel(n1: number, n2: number, ci: number) {
  const si = Math.sqrt(Math.max(0, 1 - ci * ci)), st = (n1 / n2) * si;
  if (st >= 1) return { R: 1, Rs: 1, Rp: 1, ct: 0, tir: true };
  const ct = Math.sqrt(1 - st * st);
  const Rs = ((n1 * ci - n2 * ct) / (n1 * ci + n2 * ct)) ** 2;
  const Rp = ((n1 * ct - n2 * ci) / (n1 * ct + n2 * ci)) ** 2;
  return { R: (Rs + Rp) / 2, Rs, Rp, ct, tir: false };
}
function schlick(n1: number, n2: number, ci: number) {
  const r0 = ((n1 - n2) / (n1 + n2)) ** 2;
  let c = ci;
  if (n1 > n2) {                                                     // use the transmitted angle when leaving the dense medium
    const st2 = (n1 / n2) ** 2 * (1 - ci * ci);
    if (st2 > 1) return 1;
    c = Math.sqrt(1 - st2);
  }
  return r0 + (1 - r0) * (1 - c) ** 5;
}

export function FresnelFigure({ t }: { t?: TrackTranslations }) {
  const [theta, setTheta] = useState(55);
  const [m1, setM1] = useState(0);
  const [m2, setM2] = useState(2);
  const n1 = MEDIA[m1][1], n2 = MEDIA[m2][1];
  const th = (theta * Math.PI) / 180, ci = Math.cos(th);
  const F = fresnel(n1, n2, ci), S = schlick(n1, n2, ci);
  const crit = n1 > n2 ? (Math.asin(n2 / n1) * 180) / Math.PI : null;
  const brewster = (Math.atan(n2 / n1) * 180) / Math.PI;

  // Rays: incoming from upper-left toward the hit point, reflected to upper-right, refracted below
  const inStart = { x: CX - Math.sin(th) * RAY, y: CY - Math.cos(th) * RAY };
  const refl = { x: CX + Math.sin(th) * RAY, y: CY - Math.cos(th) * RAY };
  const tt = F.tir ? 0 : Math.acos(F.ct);
  const refr = { x: CX + Math.sin(tt) * RAY, y: CY + Math.cos(tt) * RAY };

  const PX = 320, PW = 225, PY = 20, PH = 200;
  const Xp = (deg: number) => PX + (deg / 90) * PW, Yp = (r: number) => PY + (1 - r) * PH;
  const curve = (f: (c: number) => number) => Array.from({ length: 181 }, (_, i) => {
    const d = i / 2, c = Math.cos((d * Math.PI) / 180);
    return `${i ? "L" : "M"}${Xp(d).toFixed(1)},${Yp(Math.min(1, f(c))).toFixed(1)}`;
  }).join(" ");

  const setFromPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W, y = ((e.clientY - r.top) / r.height) * H;
    if (x > PX - 20) return;
    const a = Math.atan2(CX - x, CY - y);                            // angle from the normal, measured on the incoming side
    setTheta(Math.round(Math.max(0, Math.min(89, (a * 180) / Math.PI))));
  };
  const sel = "bg-[var(--code-bg)] border border-[var(--border)] rounded px-1.5 py-1 text-[10px] font-mono text-[var(--text-main)]";

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figFresnel_title", "Snell's Law and the Fresnel Effect")}
        </span>
        <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-muted)]">
          <select className={sel} value={m1} onChange={e => setM1(Number(e.target.value))}>{MEDIA.map(([n], i) => <option key={n} value={i}>{n}</option>)}</select>
          →
          <select className={sel} value={m2} onChange={e => setM2(Number(e.target.value))}>{MEDIA.map(([n], i) => <option key={n} value={i}>{n}</option>)}</select>
          <button className="px-2 py-1 rounded border border-[var(--border)] hover:text-[var(--primary)]" onClick={() => { setM1(m2); setM2(m1); }}>⇅</button>
        </div>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none touch-none cursor-crosshair" role="img" aria-label="Fresnel"
          onPointerDown={e => { (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId); setFromPointer(e); }}
          onPointerMove={e => { if (e.buttons) setFromPointer(e); }}>
          <rect x={10} y={CY} width={280} height={H - CY - 10} fill="#38bdf8" opacity={0.06 + (n2 - 1) * 0.08} />
          <rect x={10} y={10} width={280} height={CY - 10} fill="#38bdf8" opacity={0.06 + (n1 - 1) * 0.08} />
          <line x1={10} y1={CY} x2={290} y2={CY} stroke="var(--code-muted)" />
          <line x1={CX} y1={20} x2={CX} y2={H - 20} stroke="var(--code-muted)" strokeDasharray="3 3" />
          <Label x={16} y={24} size={8}>{`${MEDIA[m1][0]}  n₁ = ${n1}`}</Label>
          <Label x={16} y={H - 16} size={8}>{`${MEDIA[m2][0]}  n₂ = ${n2}`}</Label>
          <Arrow a={inStart} b={{ x: CX, y: CY }} color="#f59e0b" w={2.4} />
          <Arrow a={{ x: CX, y: CY }} b={refl} color="#f59e0b" w={2.4} opacity={0.15 + 0.85 * F.R} />
          {!F.tir && <Arrow a={{ x: CX, y: CY }} b={refr} color="#38bdf8" w={2.4} opacity={0.15 + 0.85 * (1 - F.R)} />}
          <Label x={inStart.x - 6} y={inStart.y - 4} size={8} anchor="end" color="#f59e0b">{`θᵢ = ${theta}°`}</Label>
          <Label x={refl.x + 4} y={refl.y - 4} size={8} color="#f59e0b">{`R = ${(F.R * 100).toFixed(1)}%`}</Label>
          {F.tir
            ? <Label x={CX + 8} y={CY + 30} size={8.5} color="#ef4444" bold>{tx(t, "figFresnel_tir", "total internal reflection")}</Label>
            : <Label x={refr.x + 4} y={refr.y + 2} size={8} color="#38bdf8">{`θₜ = ${((tt * 180) / Math.PI).toFixed(1)}°`}</Label>}

          {/* R(θ) plot */}
          <rect x={PX} y={PY} width={PW} height={PH} fill="var(--code-line)" opacity={0.3} />
          {[0, 0.25, 0.5, 0.75, 1].map(v => <line key={v} x1={PX} y1={Yp(v)} x2={PX + PW} y2={Yp(v)} stroke="var(--code-line)" />)}
          <path d={curve(c => fresnel(n1, n2, c).Rs)} fill="none" stroke="var(--code-muted)" strokeWidth={0.9} strokeDasharray="2 2" />
          <path d={curve(c => fresnel(n1, n2, c).Rp)} fill="none" stroke="var(--code-muted)" strokeWidth={0.9} strokeDasharray="5 2" />
          <path d={curve(c => fresnel(n1, n2, c).R)} fill="none" stroke="#f59e0b" strokeWidth={2} />
          <path d={curve(c => schlick(n1, n2, c))} fill="none" stroke="#a855f7" strokeWidth={1.6} strokeDasharray="6 3" />
          <line x1={Xp(theta)} y1={PY} x2={Xp(theta)} y2={PY + PH} stroke="var(--primary)" />
          {crit && <line x1={Xp(crit)} y1={PY} x2={Xp(crit)} y2={PY + PH} stroke="#ef4444" strokeDasharray="3 2" />}
          <text x={PX} y={PY + PH + 12} fontSize="8" fontFamily="monospace" fill="var(--code-muted)">0°</text>
          <text x={PX + PW} y={PY + PH + 12} fontSize="8" fontFamily="monospace" fill="var(--code-muted)" textAnchor="end">90°</text>
          <text x={PX - 3} y={Yp(1) + 3} fontSize="8" fontFamily="monospace" fill="var(--code-muted)" textAnchor="end">1</text>
          <text x={PX - 3} y={Yp(0) + 3} fontSize="8" fontFamily="monospace" fill="var(--code-muted)" textAnchor="end">0</text>
          <Label x={PX + 6} y={PY + 14} size={7.5} color="#f59e0b">exact</Label>
          <Label x={PX + 50} y={PY + 14} size={7.5} color="#a855f7">Schlick</Label>
          <Label x={PX + 108} y={PY + 14} size={7.5}>- - s, p</Label>
        </svg>
      </div>
      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-[1fr_auto] items-start">
        <div className="space-y-2 min-w-0">
          <label className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[var(--text-muted)] w-24">{tx(t, "figFresnel_angle", "incidence θᵢ")}</span>
            <input type="range" min={0} max={89} step={1} value={theta} onChange={e => setTheta(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
            <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{theta}°</span>
          </label>
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            {n1 > n2
              ? tx(t, "figFresnel_denseNote", "Leaving a dense medium, the ray bends away from the normal. At the critical angle (red line) it runs along the surface, and beyond it nothing gets out: every photon reflects. That is why the underside of a water surface looks like a mirror, and why diamonds, with n = 2.42, trap and sparkle.")
              : tx(t, "figFresnel_note", "Head-on (θ = 0) glass reflects only 4%. At grazing angles almost everything reflects. Look at a lake near your feet and far away to see it. Drag the ray, or drag in the diagram. Schlick's one-line fit (purple) tracks the exact curve closely and is what real-time shaders use. Near the Brewster angle, p-polarised light is not reflected at all.")}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 font-mono text-[10.5px] leading-relaxed text-[var(--code-text)] min-w-[200px]">
          <div>R₀ = ((n₁−n₂)/(n₁+n₂))² = {((((n1 - n2) / (n1 + n2)) ** 2) * 100).toFixed(1)}%</div>
          <div>R exact = {(F.R * 100).toFixed(1)}%</div>
          <div>R Schlick = {(S * 100).toFixed(1)}%</div>
          {crit ? <div className="text-red-400">θ critical = {crit.toFixed(1)}°</div> : <div>θ Brewster = {brewster.toFixed(1)}°</div>}
        </div>
      </div>
    </figure>
  );
}
