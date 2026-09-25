"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Arrow, Label, type P2 } from "../../kit/svg";
import { useStepper, stepAmount, StepperControls } from "../../kit/Stepper";
import { Tex } from "../../Tex";

// ── What this figure shows ────────────────────────────────────────────────────
// Deriving the reflection vector with nothing but a projection:
//   1. project l̂ onto n̂           → (n̂·l̂) n̂
//   2. go twice as far             → 2 (n̂·l̂) n̂
//   3. step back by l̂             → r̂ = 2 (n̂·l̂) n̂ − l̂

const W = 380, H = 250;
const O: P2 = { x: 190, y: 205 };
const U = 130;                                     // px per unit
const sc = (v: P2): P2 => ({ x: O.x + v.x * U, y: O.y - v.y * U });
const COL_N = "#22c55e", COL_L = "#f59e0b", COL_P = "#a855f7", COL_R = "#ef4444";

export function ReflectFigure({ t }: { t?: TrackTranslations }) {
  const [deg, setDeg] = useState(50);
  const st = useStepper(3, 1300);
  const a1 = stepAmount(st.p, 1), a2 = stepAmount(st.p, 2), a3 = stepAmount(st.p, 3);

  const th = (deg * Math.PI) / 180;
  const L = { x: -Math.sin(th), y: Math.cos(th) };   // unit, toward the light
  const ndl = L.y;                                    // n̂ = (0, 1)
  const proj = { x: 0, y: ndl };                      // (n̂·l̂) n̂
  const twice = { x: 0, y: ndl * (1 + a2) };          // grows to 2 (n̂·l̂) n̂
  const R = { x: -L.x, y: L.y };

  // Step 3: from the tip of 2(n̂·l̂)n̂, walk −l̂ (drawn growing)
  const minusL = { x: twice.x - L.x * a3, y: twice.y - L.y * a3 };

  const steps: [string, string][] = [
    ["figReflect_s0", "Start with the normal n̂ and the direction to the light l̂, both unit length."],
    ["figReflect_s1", "Project l̂ onto n̂: its shadow along the normal is (n̂·l̂) n̂."],
    ["figReflect_s2", "Go twice as far along the normal: 2 (n̂·l̂) n̂."],
    ["figReflect_s3", "Step back by l̂. You land on the mirror image: r̂ = 2 (n̂·l̂) n̂ − l̂."],
  ];
  const current = Math.round(st.raw);

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figReflect_title", "Deriving the Reflection Vector — Step by Step")}
        </span>
      </div>

      <div className="grid md:grid-cols-[1.25fr_1fr]">
        <div className="bg-[var(--code-bg)] md:border-r border-b md:border-b-0 border-[var(--border)]">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none" role="img" aria-label="Reflection vector derivation">
            <rect x={20} y={O.y} width={W - 40} height={H - O.y - 14} fill="rgba(90,140,255,0.10)" />
            <line x1={20} y1={O.y} x2={W - 20} y2={O.y} stroke="var(--code-muted)" strokeWidth="1.4" />

            {/* 1. projection: dashed drop from l̂'s tip to the normal */}
            {a1 > 0 && (
              <g opacity={a1}>
                <line x1={sc(L).x} y1={sc(L).y} x2={sc(proj).x} y2={sc(proj).y} stroke="var(--code-muted)" strokeDasharray="3 3" />
                <rect x={sc(proj).x} y={sc(proj).y} width={7} height={7} fill="none" stroke="var(--code-muted)"
                  transform={`translate(${-7} 0)`} />
              </g>
            )}

            {/* The projection / doubled projection along n̂ */}
            {a1 > 0 && <Arrow a={O} b={sc({ x: 0, y: a2 > 0 ? twice.y : proj.y * a1 })} color={COL_P} w={4} head={9} opacity={0.85} />}

            {/* 3. −l̂ from the tip of 2(n̂·l̂)n̂ */}
            {a3 > 0 && <Arrow a={sc(twice)} b={sc(minusL)} color={COL_L} w={1.8} head={7} dash="5 3" />}
            {a3 >= 1 && <Arrow a={O} b={sc(R)} color={COL_R} w={2.6} head={9} />}

            <Arrow a={O} b={sc({ x: 0, y: 1 })} color={COL_N} w={2.2} head={8} />
            <Arrow a={O} b={sc(L)} color={COL_L} w={2.6} head={9} />

            <Label x={sc({ x: 0, y: 1 }).x + 8} y={sc({ x: 0, y: 1 }).y + 4} color={COL_N} bold>n̂</Label>
            <Label x={sc(L).x - 8} y={sc(L).y} anchor="end" color={COL_L} bold>l̂</Label>
            {a1 > 0 && a2 === 0 && <Label x={O.x + 8} y={sc(proj).y + 18} color={COL_P}>(n̂·l̂) n̂</Label>}
            {a2 > 0 && <Label x={O.x + 8} y={sc(twice).y + 4} color={COL_P}>2(n̂·l̂) n̂</Label>}
            {a3 > 0.5 && <Label x={(sc(twice).x + sc(minusL).x) / 2 + 6} y={(sc(twice).y + sc(minusL).y) / 2 - 6} color={COL_L}>−l̂</Label>}
            {a3 >= 1 && <Label x={sc(R).x + 8} y={sc(R).y} color={COL_R} bold>r̂</Label>}
            <circle cx={O.x} cy={O.y} r={3} fill="var(--text-main)" />
          </svg>
        </div>

        <div className="p-4 md:p-5 space-y-3 min-w-0">
          <ol className="space-y-1">
            {steps.map(([key, text], i) => (
              <li key={key} onClick={() => st.scrub(i)}
                className={`cursor-pointer rounded-lg px-2.5 py-1.5 text-[12px] leading-snug transition-colors flex gap-2 ${
                  i === current ? "bg-[var(--primary-low)] text-[var(--text-main)]" : "text-[var(--text-muted)] hover:bg-[var(--primary-low)]/50"
                } ${i > current ? "opacity-55" : ""}`}>
                <span className={`flex-shrink-0 w-4 h-4 mt-px rounded-full text-[9px] font-bold flex items-center justify-center ${
                  i <= current ? "bg-[var(--primary)] text-white" : "border border-[var(--border)]"}`}>{i}</span>
                <span>{tx(t, key, text)}</span>
              </li>
            ))}
          </ol>
          <label className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[var(--text-muted)] w-14">{tx(t, "figReflect_angle", "light at")}</span>
            <input type="range" min={5} max={85} step={1} value={deg}
              onChange={e => setDeg(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
            <span className="text-[10px] font-mono text-[var(--primary)] w-9 text-right">{deg}°</span>
          </label>
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            {tx(t, "figReflect_glsl", "GLSL's reflect(I, N) computes I − 2(N·I)N for the incoming direction I = −l̂, which is the same vector: ")}
            <Tex>{String.raw`\text{reflect}(-\vL, \vN) = 2(\dotp{\vN}{\vL})\,\vN - \vL = \vR`}</Tex>
          </p>
        </div>
      </div>

      <div className="px-4 md:px-5 pb-4">
        <StepperControls s={st} />
      </div>
    </figure>
  );
}
