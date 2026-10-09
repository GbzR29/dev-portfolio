"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, C, T, f2, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// product — a rectangle u × v whose sides grow by Δu and Δv. The new area is
//           the old one plus two strips (v·Δu and u·Δv) plus a corner Δu·Δv.
//           Shrink the nudges: the corner vanishes much faster than the
//           strips, leaving (uv)′ = u′v + uv′.
// chain   — three number lines with the same scale: x, u = x², y = sin u.
//           A small piece dx is stretched by g′(x) = 2x on its way to the
//           u-line, then by f′(u) = cos u on its way to the y-line. The
//           stretch factors multiply: that is the chain rule.
// sine    — a point on the unit circle moves a tiny arc dθ. The arc is
//           perpendicular to the radius, so its little triangle is the big
//           one turned a quarter turn: it rises cos θ · dθ. The sine graph
//           on the right (same scale) therefore has slope cos θ.
// In every mode the Transport shrinks the nudge: Δu, Δv, dx and dθ are all
// their starting size times k, and ⏭ halves k (play keeps shrinking it).
// The lab: the corner dies first, the chain's stretches multiply (and flip),
// then the sine's rise matches cos θ · dθ.

type Mode = "product" | "chain" | "sine";
const W = 560, H = 280;
const K_MIN = 1 / 64;                                    // play stops shrinking here
const DU = 0.6, DV = 0.45, DX = 0.2, DTH = 0.5;          // the nudges at k = 1
const n3 = (v: number) => f2(v, 3).replace("-", "−");

// ── The drawings ──────────────────────────────────────────────────────────────

function ProductDrawing({ u, v, du, dv }: { u: number; v: number; du: number; dv: number }) {
  const s = 70, ox = 40, oy = H - 30;                     // 70 px per unit, origin bottom-left
  const R = (x0: number, y0: number, w: number, h: number, col: string, op: number) =>
    <rect x={ox + x0 * s} y={oy - (y0 + h) * s} width={w * s} height={h * s} fill={col} fillOpacity={op} stroke={col} strokeWidth={1.2} />;
  const room = du * s > 30 && dv * s > 14;                // enough room for the strip labels
  return <>
    {R(0, 0, u, v, C.sky, 0.18)}
    {R(u, 0, du, v, C.amber, 0.35)}
    {R(0, v, u, dv, C.green, 0.35)}
    {R(u, v, du, dv, C.red, 0.55)}
    <T x={ox + (u * s) / 2} y={oy - (v * s) / 2} color={C.sky} anchor="middle" size={12} bold>u · v</T>
    {room && <>
      <T x={ox + (u + du / 2) * s} y={oy - (v * s) / 2} color={C.amber} anchor="middle" bold>{"v·Δu"}</T>
      <T x={ox + (u * s) / 2} y={oy - (v + dv / 2) * s + 4} color={C.green} anchor="middle" bold>{"u·Δv"}</T>
    </>}
    <T x={ox + (u + du) * s + 6} y={oy - (v + dv) * s + 10} color={C.red} bold>{"Δu·Δv"}</T>
    <T x={ox + (u * s) / 2} y={oy + 16} color={C.muted} anchor="middle">u</T>
    <T x={ox - 8} y={oy - (v * s) / 2} color={C.muted} anchor="end">v</T>
  </>;
}

function ChainDrawing({ x, dx }: { x: number; dx: number }) {
  const s = 150, L = 50;                                  // same px per unit on all three lines
  const u0 = x * x, u1 = (x + dx) ** 2;
  const lines: [string, number, number, number, number, string, number, number][] = [
    // label, row y, range start, value, value after nudge, colour, range lo, range hi
    ["x", 50, 0, x, x + dx, C.sky, 0, 2],
    ["u = x²", 140, 0, u0, u1, C.amber, 0, 3.2],
    ["y = sin u", 230, -1, Math.sin(u0), Math.sin(u1), C.green, -1, 1],
  ];
  const P = (lo: number, val: number) => L + (val - lo) * s;
  return <>
    {lines.map(([label, yy, lo, a, b, col, r0, r1], i) => <g key={i}>
      <line x1={P(lo, r0)} x2={P(lo, r1)} y1={yy} y2={yy} stroke={C.axis} strokeWidth={1.2} />
      {Array.from({ length: Math.round((r1 - r0) * 2) + 1 }, (_, k) => r0 + k / 2).map(v =>
        <g key={v}><line x1={P(lo, v)} x2={P(lo, v)} y1={yy - 4} y2={yy + 4} stroke={C.axis} />
          <T x={P(lo, v)} y={yy + 16} size={8.5} anchor="middle" color={C.axis}>{String(v).replace("-", "−")}</T></g>)}
      <line x1={P(lo, a)} x2={P(lo, b)} y1={yy} y2={yy} stroke={col} strokeWidth={7} strokeLinecap="butt" opacity={0.85} />
      <T x={6} y={yy - 10} color={col} bold>{label}</T>
    </g>)}
    {[0, 1].map(i => {
      const [, ya, la, a0, b0] = lines[i], [, yb, lb, a1, b1] = lines[i + 1];
      return <g key={i} opacity={0.5}>
        <line x1={P(la, a0)} y1={ya + 4} x2={P(lb, a1)} y2={yb - 4} stroke={C.muted} strokeDasharray="3 3" />
        <line x1={P(la, b0)} y1={ya + 4} x2={P(lb, b1)} y2={yb - 4} stroke={C.muted} strokeDasharray="3 3" />
      </g>;
    })}
  </>;
}

function SineDrawing({ th, dth }: { th: number; dth: number }) {
  const R = 90, cx = 120, cy = 140, gx = 250, gs = 290 / (2 * Math.PI);
  const P = (a: number) => ({ x: cx + R * Math.cos(a), y: cy - R * Math.sin(a) });
  const p0 = P(th), p1 = P(th + dth);
  const tip = { x: p0.x - R * dth * Math.sin(th), y: p0.y - R * dth * Math.cos(th) };   // along the tangent
  const G = (a: number) => ({ x: gx + a * gs, y: cy - R * Math.sin(a) });
  const sinPath = Array.from({ length: 121 }, (_, k) => G((k / 120) * 2 * Math.PI))
    .map((q, k) => `${k ? "L" : "M"}${q.x.toFixed(1)},${q.y.toFixed(1)}`).join("");
  const g0 = G(th), m = Math.cos(th);
  return <>
    <line x1={cx - R - 12} x2={cx + R + 12} y1={cy} y2={cy} stroke={C.axis} />
    <line x1={cx} x2={cx} y1={cy - R - 12} y2={cy + R + 12} stroke={C.axis} />
    <circle cx={cx} cy={cy} r={R} fill="none" stroke={C.muted} strokeDasharray="3 3" />
    <line x1={cx} y1={cy} x2={p0.x} y2={p0.y} stroke={C.sky} strokeWidth={2} />
    <line x1={p0.x} y1={cy} x2={p0.x} y2={p0.y} stroke={C.sky} strokeDasharray="3 3" />
    <path d={`M${p0.x},${p0.y} A${R},${R} 0 0 0 ${p1.x},${p1.y}`} fill="none" stroke={C.amber} strokeWidth={3} />
    <polygon points={`${p0.x},${p0.y} ${tip.x},${p0.y} ${tip.x},${tip.y}`} fill={C.green} fillOpacity={0.2} stroke={C.green} strokeWidth={1.2} />
    <line x1={tip.x} y1={p0.y} x2={tip.x} y2={tip.y} stroke={C.green} strokeWidth={2.5} />
    <circle cx={p0.x} cy={p0.y} r={4} fill={C.sky} />
    <T x={cx + 14} y={cy - 6} color={C.sky}>θ</T>
    {dth > 0.08 && <T x={tip.x + (tip.x < p0.x ? -6 : 6)} y={(p0.y + tip.y) / 2 + 3} color={C.green} anchor={tip.x < p0.x ? "end" : "start"} bold>{"cos θ · dθ"}</T>}
    <line x1={gx} x2={gx + 2 * Math.PI * gs} y1={cy} y2={cy} stroke={C.axis} />
    <path d={sinPath} fill="none" stroke={C.sky} strokeWidth={2} />
    <line x1={g0.x - 40} y1={g0.y + 40 * m * (R / gs)} x2={g0.x + 40} y2={g0.y - 40 * m * (R / gs)} stroke={C.purple} strokeWidth={1.8} strokeDasharray="5 3" />
    <line x1={p0.x} y1={p0.y} x2={g0.x} y2={g0.y} stroke={C.muted} strokeDasharray="2 4" />
    <circle cx={g0.x} cy={g0.y} r={4} fill={C.sky} />
    <T x={gx + 2 * Math.PI * gs} y={cy + 14} anchor="end">2π</T>
    <T x={gx + Math.PI * gs} y={cy + 14} anchor="middle">π</T>
  </>;
}

export function DerivRulesFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("product");
  const [u, setU] = useState(2.4);
  const [v, setV] = useState(1.6);
  const [x, setX] = useState(1);
  const [th, setTh] = useState(0.8);
  const [k, setK] = useState(1);                         // every nudge is its starting size × k
  const [playing, setPlaying] = useState(false);
  const lab = useLab("math-deriv-rules");
  const vis = useVisible<HTMLDivElement>();
  useFrame(playing && (vis.on || lab.open), dt => {
    if (k <= K_MIN) setPlaying(false);
    else setK(Math.max(K_MIN, k * 0.5 ** (dt * 1.2)));
  });

  const stop = () => setPlaying(false);
  const pick = (m: Mode) => { setMode(m); stop(); setK(1); };
  const kTo = (v: number) => { stop(); setK(Math.min(2, Math.max(K_MIN, v))); };
  const du = DU * k, dv = DV * k, dx = DX * k, dth = DTH * k;

  // Numbers shared by the readouts, the lab goals and the insights
  const dA = (u + du) * (v + dv) - u * v;
  const corner = (100 * du * dv) / dA;
  const u0 = x * x, u1 = (x + dx) ** 2, y0 = Math.sin(u0), y1 = Math.sin(u1);
  const g1 = 2 * x, f1 = Math.cos(u0);
  const rise = Math.sin(th + dth) - Math.sin(th), m = Math.cos(th);

  const view = (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {mode === "product" ? <ProductDrawing u={u} v={v} du={du} dv={dv} />
          : mode === "chain" ? <ChainDrawing x={x} dx={dx} /> : <SineDrawing th={th} dth={dth} />}
      </svg>
      <Transport t={t} playing={playing}
        onPlay={() => { if (k <= K_MIN) setK(1); setPlaying(p => !p); }}
        playLabel={tx(t, "figRule_shrink", "shrink the nudge")}
        onStep={() => kTo(k / 2)}
        onBack={() => kTo(k * 2)}
        onReset={() => kTo(1)}
        readout={mode === "product" ? `Δu = ${n3(du)} · Δv = ${n3(dv)}` : mode === "chain" ? `dx = ${n3(dx)}` : `dθ = ${n3(dth)}`} />
    </div>
  );

  let controls: React.ReactNode, note: string;
  if (mode === "product") {
    controls = <>
      <Sliders>
        <Slider label="u" value={u} min={1} max={3.6} step={0.1} onChange={setU} />
        <Slider label="v" value={v} min={0.8} max={2.2} step={0.1} onChange={setV} />
      </Sliders>
      <Row>
        <Readout>{`ΔA = ${n3(dA)}`}</Readout>
        <Readout color={C.amber}>{`v·Δu = ${n3(v * du)}`}</Readout>
        <Readout color={C.green}>{`u·Δv = ${n3(u * dv)}`}</Readout>
        <Readout color={C.red}>{`Δu·Δv = ${n3(du * dv)}  (${corner.toFixed(1)}%)`}</Readout>
      </Row>
    </>;
    note = tx(t, "figRule_noteP2", "The blue rectangle has area u·v. Grow the sides by Δu and Δv: the extra area is an amber strip v·Δu, a green strip u·Δv and a red corner Δu·Δv. Now press ⏭ to halve both nudges. Each strip halves but the corner quarters, so the corner's share of the growth (the percentage) heads to zero. Dividing by the time the growth took and letting it shrink leaves only the strips: (uv)′ = u′v + uv′.");
  } else if (mode === "chain") {
    controls = <>
      <Sliders>
        <Slider label="x" value={x} min={0.2} max={1.7} step={0.01} onChange={setX} />
      </Sliders>
      <Row>
        <Readout color={C.amber}>{`du ≈ g′(x)·dx = ${n3(g1)} · ${n3(dx)} = ${n3(g1 * dx)}   (${tx(t, "figRule_actual", "actual")} ${n3(u1 - u0)})`}</Readout>
        <Readout color={C.green}>{`dy ≈ f′(u)·du = ${n3(f1)} · ${n3(u1 - u0)} = ${n3(f1 * (u1 - u0))}   (${tx(t, "figRule_actual", "actual")} ${n3(y1 - y0)})`}</Readout>
      </Row>
      <Row>
        <Readout>{`dy/dx ≈ ${n3((y1 - y0) / dx)}`}</Readout>
        <Readout color={C.purple}>{`f′(u)·g′(x) = cos(x²)·2x = ${n3(f1 * g1)}`}</Readout>
      </Row>
    </>;
    note = tx(t, "figRule_noteC2", "All three lines use the same scale, so the length of each coloured piece is honest. The blue piece dx is squared on its way to the middle line: near x it is stretched by the factor g′(x) = 2x. The middle piece goes through sine on its way down: it is stretched (or shrunk, or flipped) by f′(u) = cos u. Two stretches in a row multiply, so the total rate is cos(x²) · 2x. Press ⏭ to shrink dx: the approximations match the actual changes better and better. Past x ≈ 1.25, cos u is negative and the bottom piece flips direction.");
  } else {
    controls = <>
      <Sliders>
        <Slider label="θ" value={th} min={0} max={6.28} step={0.01} onChange={setTh} />
      </Sliders>
      <Row>
        <Readout color={C.amber}>{`Δ(sin θ) = ${n3(rise)}`}</Readout>
        <Readout color={C.green}>{`cos θ · dθ = ${n3(m * dth)}`}</Readout>
        <Readout>{`Δ(sin θ)/dθ = ${n3(rise / dth)}`}</Readout>
        <Readout color={C.purple}>{`cos θ = ${n3(m)}`}</Readout>
      </Row>
    </>;
    note = tx(t, "figRule_noteS2", "The point moves round the circle by a small arc dθ (amber; its length is dθ because the radius is 1). A tiny arc is almost a straight step along the tangent, and the tangent is perpendicular to the radius. So the green step triangle is the blue radius triangle turned a quarter turn: its rise is cos θ times its length dθ. The rise is the change in sin θ, so sin θ changes at the rate cos θ. The graph on the right uses the same scale: its tangent (purple) has slope cos θ. Press ⏭ to shrink dθ: the actual change matches cos θ · dθ ever more closely.");
  }
  const modeChoice = <Choice value={mode} onChange={pick} options={[
    ["product", tx(t, "figRule_mP", "product")],
    ["chain", tx(t, "figRule_mC", "chain")],
    ["sine", tx(t, "figRule_mS", "sine")],
  ] as const} />;

  // ── Lab ──
  const prod = mode === "product", chain = mode === "chain", sine = mode === "sine";
  const sineErr = Math.abs(rise / dth - m);
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figRuleL1_t", "The corner dies first"),
      body: <>
        <p>{tx(t, "figRuleL1_b1", "Both sides of the rectangle grow. The new area is two strips plus a small red corner.")}</p>
        <p>{tx(t, "figRuleL1_b2", "Shrink the nudges and watch the corner's share of the growth.")}</p>
      </>,
      goal: { text: fill(tx(t, "figRuleL1_g", "Corner below 5% of the growth (now {p}%)."), { p: corner.toFixed(1) }), done: prod && corner < 5 },
      hint: tx(t, "figRuleL1_h", "Each ⏭ halves Δu and Δv. A few presses."),
      focus: "step",
      setup: () => { pick("product"); setU(2.4); setV(1.6); },
    },
    {
      title: tx(t, "figRuleL2_t", "Quick check"),
      body: <p>{tx(t, "figRuleL2_b", "You halve both Δu and Δv.")}</p>,
      quiz: {
        q: tx(t, "figRuleL2_q", "What happens to the corner's area Δu·Δv?"),
        options: [tx(t, "figRuleL2_o1", "it becomes ¼ of what it was"), tx(t, "figRuleL2_o2", "it halves"), tx(t, "figRuleL2_o3", "it becomes ⅛"), tx(t, "figRuleL2_o4", "it stays the same")],
        answer: 0,
        why: tx(t, "figRuleL2_w", "½ · ½ = ¼. The strips only halve, so after dividing by the step the corner's part still goes to 0 while the strips' parts stay: only u′v + uv′ is left."),
      },
    },
    {
      title: tx(t, "figRuleL3_t", "Quick check"),
      body: <p>{tx(t, "figRuleL3_b", "A rectangle is 3 m by 2 m. Its length grows at 1 m/s and its width at 0.5 m/s.")}</p>,
      quiz: {
        q: tx(t, "figRuleL3_q", "How fast is its area growing right now?"),
        options: ["3.5 m²/s", "0.5 m²/s", "6 m²/s", "1.5 m²/s"],
        answer: 0,
        why: tx(t, "figRuleL3_w", "u′v + uv′ = 1 · 2 + 3 · 0.5 = 2 + 1.5 = 3.5. Multiplying the two rates, 1 · 0.5 = 0.5, is the classic mistake."),
      },
    },
    {
      title: tx(t, "figRuleL4_t", "Stretches multiply"),
      body: <>
        <p>{tx(t, "figRuleL4_b1", "x goes through u = x², then y = sin u. Each step stretches the little blue piece by its own factor: 2x, then cos u.")}</p>
        <p>{tx(t, "figRuleL4_b2", "Find the x where the bottom piece has no length at all: y stops changing.")}</p>
      </>,
      goal: { text: fill(tx(t, "figRuleL4_g", "dy/dx = cos(x²) · 2x = 0 (to 0.05); now {d}."), { d: n3(f1 * g1) }), done: chain && Math.abs(f1 * g1) < 0.05 },
      hint: tx(t, "figRuleL4_h", "2x is never 0 here, so cos u must be: u = x² = π/2, x = √(π/2) ≈ 1.25."),
      setup: () => { pick("chain"); setX(0.6); },
    },
    {
      title: tx(t, "figRuleL5_t", "Quick check"),
      body: <p>{tx(t, "figRuleL5_b", "y = sin(3x). The inner function is u = 3x, the outer is sin u.")}</p>,
      quiz: {
        q: tx(t, "figRuleL5_q", "What is dy/dx at x = 0?"),
        options: ["3", "1", "cos 3", "0"],
        answer: 0,
        why: tx(t, "figRuleL5_w", "Outer derivative at the inside, cos(3 · 0) = 1, times the inner derivative 3: 3. Forgetting the inner factor gives 1."),
      },
    },
    {
      title: tx(t, "figRuleL6_t", "The top of the circle"),
      body: <>
        <p>{tx(t, "figRuleL6_b1", "On the circle, the point's height is sin θ. A small step dθ along the arc raises it by about cos θ · dθ.")}</p>
        <p>{tx(t, "figRuleL6_b2", "Move θ to where the height does not change at all.")}</p>
      </>,
      goal: { text: tx(t, "figRuleL6_g", "cos θ = 0 (to 0.02) on the upper half."), done: sine && Math.abs(m) < 0.02 && Math.sin(th) > 0 },
      hint: tx(t, "figRuleL6_h", "At the top, θ = π/2 ≈ 1.57, the step is horizontal."),
      setup: () => { pick("sine"); setTh(0.8); },
    },
    {
      title: tx(t, "figRuleL7_t", "Rise matches cos θ"),
      body: <>
        <p>{tx(t, "figRuleL7_b1", "With a big dθ the arc bends away from the straight step, so the actual rise and cos θ · dθ differ.")}</p>
        <p>{tx(t, "figRuleL7_b2", "Shrink dθ until the rate Δ(sin θ)/dθ is within 0.01 of cos θ.")}</p>
      </>,
      goal: { text: fill(tx(t, "figRuleL7_g", "|Δ(sin θ)/dθ − cos θ| < 0.01 (now {e})."), { e: n3(sineErr) }), done: sine && sineErr < 0.01 },
      focus: "step",
      setup: () => { pick("sine"); setTh(0.8); },
    },
  ];

  const insights: Insight[] = [
    {
      id: "corner", tone: "ok", when: prod && corner < 2,
      title: tx(t, "figRuleI1_t", "Only the strips are left"),
      body: fill(tx(t, "figRuleI1_b", "The corner is {p}% of the growth. In the limit it is nothing, and the growth rate is exactly the two strips: v·u′ + u·v′."), { p: corner.toFixed(2) }),
    },
    {
      id: "big", tone: "info", when: prod && corner > 8,
      title: tx(t, "figRuleI2_t", "The corner still counts"),
      body: tx(t, "figRuleI2_b", "With nudges this big the red corner is a real part of the growth, so u′v + uv′ is only an approximation. The rule is about the rate at an instant, when the nudges shrink to nothing."),
    },
    {
      id: "flip", tone: "warn", when: chain && f1 < -0.05,
      title: tx(t, "figRuleI3_t", "Flipped"),
      body: fill(tx(t, "figRuleI3_b", "u = x² = {u} is past π/2, so cos u = {c} is negative: sine is falling there. The bottom piece points the other way, and dy/dx = {d} < 0."), { u: n3(u0), c: n3(f1), d: n3(f1 * g1) }),
    },
    {
      id: "flat", tone: "info", when: chain && Math.abs(f1) <= 0.05,
      title: tx(t, "figRuleI4_t", "Stretched to nothing"),
      body: tx(t, "figRuleI4_b", "cos u ≈ 0: u is near π/2, the top of the sine. A small change in u barely moves y, so the second stretch factor squashes the piece flat, whatever the first one did."),
    },
    {
      id: "down", tone: "info", when: sine && m < -0.02,
      title: tx(t, "figRuleI5_t", "Going down"),
      body: tx(t, "figRuleI5_b", "Past the top, cos θ is negative: the step triangle points down and the sine graph is falling. The rule (sin θ)′ = cos θ keeps the sign right by itself."),
    },
    {
      id: "match", tone: "ok", when: sine && sineErr < 0.01,
      title: tx(t, "figRuleI6_t", "Rate = cos θ"),
      body: fill(tx(t, "figRuleI6_b", "Δ(sin θ)/dθ = {r} and cos θ = {c}: the tiny arc is now practically the straight step along the tangent."), { r: n3(rise / dth), c: n3(m) }),
    },
  ];

  const title = tx(t, "figRule_title", "Why the rules are true");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{modeChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={note}
      >
        <div ref={vis.ref}>{view}</div>
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{modeChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figRuleR1", "A growing rectangle gains two strips and a corner; the corner vanishes fastest, leaving (uv)′ = u′v + uv′."),
          tx(t, "figRuleR2", "Feeding one function into another multiplies their stretch factors: the chain rule."),
          tx(t, "figRuleR3", "A tiny step on the unit circle rises cos θ · dθ, so (sin θ)′ = cos θ."),
          tx(t, "figRuleR4", "Every rule is about the limit: the approximations become exact as the nudges shrink."),
        ]}
      />
    </>
  );
}
