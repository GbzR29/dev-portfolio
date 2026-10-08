"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, C, T, useDrag, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// The unit circle definition of sine and cosine: a point at angle θ on a
// circle of radius 1 has coordinates (cos θ, sin θ). Drag it around, or let
// the Transport spin it. The right panel unrolls the angle along the
// horizontal axis, so the point's height traces the sine wave and its x
// traces the cosine wave. tan θ = sin θ / cos θ is the height where the ray
// meets the line x = 1.
// The lab: the top of the circle, one radian, a full spin drawing the waves,
// then the tangent and where it breaks.

const W = 560, H = 250, R = 90, CX = 115, CY = 125;
const WX0 = 250, WX1 = 545;         // the unrolled wave panel spans θ ∈ [0, 2π]
const TAU = Math.PI * 2, DEG = Math.PI / 180;
const STEP = 15;                    // degrees per Transport step

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
/** An angle in whole degrees as a multiple of π: 45 → "π/4", 270 → "3π/2". */
function piFrac(deg: number) {
  if (deg === 0) return "0";
  const g = gcd(deg, 180), n = deg / g, d = 180 / g;
  if (d > 12) return `${(deg / 180).toFixed(3)}π`;
  return `${n === 1 ? "" : n}π${d === 1 ? "" : `/${d}`}`;
}

/** The svg; owns the drag (it is mounted twice while the lab is open). */
function UcStage({ theta, setTheta, showTan }: { theta: number; setTheta: (v: number) => void; showTan: boolean }) {
  const drag = useDrag<"p">(() => "p", (_, q) => {
    let a = Math.atan2(-(q.y - CY), q.x - CX);
    if (q.x > WX0 - 10) a = ((q.x - WX0) / (WX1 - WX0)) * TAU;      // dragging in the wave panel scrubs θ
    if (a < 0) a += TAU;
    setTheta(Math.round(Math.max(0, Math.min(TAU, a)) / DEG) % 360 * DEG);
  });

  const c = Math.cos(theta), s = Math.sin(theta);
  const px = CX + c * R, py = CY - s * R;
  const WX = (a: number) => WX0 + (a / TAU) * (WX1 - WX0);
  const wave = (fn: (a: number) => number) => Array.from({ length: 121 }, (_, i) => { const a = (i / 120) * TAU; return `${i ? "L" : "M"}${WX(a).toFixed(1)},${(CY - fn(a) * R).toFixed(1)}`; }).join("");
  const tanV = s / c, tanOk = Math.abs(c) > 0.06;
  const large = theta > Math.PI ? 1 : 0;

  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto cursor-grab">
      {/* circle */}
      <line x1={CX - R - 20} x2={CX + R + 20} y1={CY} y2={CY} stroke={C.axis} />
      <line x1={CX} x2={CX} y1={CY - R - 20} y2={CY + R + 20} stroke={C.axis} />
      <circle cx={CX} cy={CY} r={R} fill="none" stroke={C.muted} strokeWidth={1.3} />
      <path d={`M${CX + 22},${CY} A22,22 0 ${large} 0 ${CX + 22 * c},${CY - 22 * s}`} fill="none" stroke={C.purple} strokeWidth={2} />
      <path d={`M${CX + R},${CY} A${R},${R} 0 ${large} 0 ${px},${py}`} fill="none" stroke={C.purple} strokeWidth={3} opacity={0.45} />
      <T x={CX + 26 * Math.cos(theta / 2) + 2} y={CY - 26 * Math.sin(theta / 2) + 3} size={9.5} color={C.purple}>θ</T>
      <line x1={CX} y1={CY} x2={px} y2={py} stroke={C.fg} strokeWidth={1.6} />
      <line x1={CX} y1={CY} x2={px} y2={CY} stroke={C.red} strokeWidth={3} />
      <line x1={px} y1={CY} x2={px} y2={py} stroke={C.green} strokeWidth={3} />
      {showTan && tanOk && (
        <g>
          <line x1={CX + R} x2={CX + R} y1={CY - R - 20} y2={CY + R + 20} stroke={C.amber} strokeDasharray="3 3" opacity={0.5} />
          <line x1={CX} y1={CY} x2={CX + R} y2={CY - tanV * R} stroke={C.amber} strokeDasharray="4 3" />
          <line x1={CX + R} y1={CY} x2={CX + R} y2={CY - Math.max(-1.4, Math.min(1.4, tanV)) * R} stroke={C.amber} strokeWidth={3} />
        </g>
      )}
      <circle cx={px} cy={py} r={10} fill={C.sky} opacity={0.2} />
      <circle cx={px} cy={py} r={5.5} fill={C.sky} />
      <T x={CX + R + 4} y={CY + 12} size={8.5}>1</T>
      {/* waves */}
      <line x1={WX0} x2={WX1} y1={CY} y2={CY} stroke={C.axis} />
      {[0.5, 1, 1.5, 2].map(k => (
        <g key={k}>
          <line x1={WX(k * Math.PI)} x2={WX(k * Math.PI)} y1={CY - R} y2={CY + R} stroke={C.grid} />
          <T x={WX(k * Math.PI)} y={CY + R + 14} size={8.5} anchor="middle">{k === 1 ? "π" : k === 2 ? "2π" : `${k}π`}</T>
        </g>
      ))}
      <path d={wave(Math.sin)} fill="none" stroke={C.green} strokeWidth={1.8} />
      <path d={wave(Math.cos)} fill="none" stroke={C.red} strokeWidth={1.4} opacity={0.75} />
      <line x1={px} y1={py} x2={WX(theta)} y2={py} stroke={C.green} strokeDasharray="2 3" opacity={0.6} />
      <line x1={WX(theta)} x2={WX(theta)} y1={CY - R - 6} y2={CY + R + 4} stroke={C.purple} opacity={0.6} />
      <circle cx={WX(theta)} cy={CY - s * R} r={4.5} fill={C.green} />
      <circle cx={WX(theta)} cy={CY - c * R} r={4} fill={C.red} />
      <T x={WX1} y={CY - R - 8} size={9} anchor="end" color={C.green}>sin θ</T>
      <T x={WX1 - 44} y={CY - R - 8} size={9} anchor="end" color={C.red}>cos θ</T>
    </svg>
  );
}

export function UnitCircleFigure({ t }: { t?: TrackTranslations }) {
  // `turn` keeps growing while the Transport spins, so it also counts the laps
  const [turn, setTheta] = useState(0.7);
  const [playing, setPlaying] = useState(false);
  const [showTan, setShowTan] = useState(false);
  const lab = useLab("math-unit-circle");
  const vis = useVisible<HTMLDivElement>();
  useFrame(playing && (vis.on || lab.open), dt => setTheta(a => a + dt * 0.8));

  const theta = turn % TAU, laps = Math.floor(turn / TAU);
  const c = Math.cos(theta), s = Math.sin(theta);
  const deg = theta / DEG, whole = Math.round(deg);
  const exact = Math.abs(deg - whole) < 1e-6;
  const tanOk = Math.abs(c) > 0.06;
  const near = (a: number, tol = 0.02) => Math.abs(theta - a) < tol;
  const stepTo = (k: number) => { setPlaying(false); setTheta((((k * STEP) % 360 + 360) % 360) * DEG); };

  const view = (
    <div>
      <UcStage theta={theta} setTheta={v => { setPlaying(false); setTheta(v); }} showTan={showTan} />
      <Transport t={t} playing={playing}
        onPlay={() => setPlaying(p => !p)}
        playLabel={tx(t, "figUnit_play", "spin")}
        onStep={() => stepTo(Math.floor(deg / STEP + 1e-6) + 1)}
        onBack={() => stepTo(Math.ceil(deg / STEP - 1e-6) - 1)}
        onReset={() => { setPlaying(false); setTheta(0); }}
        readout={`θ = ${exact ? `${whole}° = ${piFrac(whole)}` : `${deg.toFixed(0)}°`}`} />
    </div>
  );
  const tanBtn = <Btn active={showTan} onClick={() => setShowTan(v => !v)}>tan θ</Btn>;
  const controls = <Row>
    <Readout>θ = {deg.toFixed(1)}° = {theta.toFixed(3)} rad = {(theta / Math.PI).toFixed(3)}π</Readout>
    <Readout color={C.red}>cos θ = {c.toFixed(3)}</Readout>
    <Readout color={C.green}>sin θ = {s.toFixed(3)}</Readout>
    {showTan && <Readout color={C.amber}>tan θ = {tanOk ? (s / c).toFixed(3) : "±∞"}</Readout>}
    <Readout color={C.muted}>cos² + sin² = {(c * c + s * s).toFixed(3)}</Readout>
  </Row>;

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figUnitL1_t", "A point on the circle"),
      body: <>
        <p>{tx(t, "figUnitL1_b1", "The blue point sits at angle θ on a circle of radius 1. Its x is cos θ (red), its y is sin θ (green).")}</p>
        <p>{tx(t, "figUnitL1_b2", "Drag it to the very top of the circle.")}</p>
      </>,
      goal: { text: tx(t, "figUnitL1_g", "θ = 90°: cos θ = 0, sin θ = 1."), done: near(Math.PI / 2) },
      setup: () => { setPlaying(false); setTheta(40 * DEG); setShowTan(false); },
    },
    {
      title: tx(t, "figUnitL2_t", "Quick check"),
      body: <p>{tx(t, "figUnitL2_b", "The point is always (cos θ, sin θ).")}</p>,
      quiz: {
        q: tx(t, "figUnitL2_q", "Where is the point at θ = 180° (π radians)?"),
        options: ["(−1, 0)", "(0, −1)", "(1, 0)", "(0, 1)"],
        answer: 0,
        why: tx(t, "figUnitL2_w", "Half a turn from (1, 0) lands on the far left of the circle: cos 180° = −1 and sin 180° = 0."),
      },
    },
    {
      title: tx(t, "figUnitL3_t", "One radian"),
      body: <>
        <p>{tx(t, "figUnitL3_b1", "The pale purple arc is the path walked along the circle. On a circle of radius 1 its length is θ in radians.")}</p>
        <p>{tx(t, "figUnitL3_b2", "Drag until the arc is as long as the radius: one radian.")}</p>
      </>,
      goal: { text: tx(t, "figUnitL3_g", "θ = 1 rad (about 57°)."), done: near(1) },
      hint: tx(t, "figUnitL3_h", "Watch the rad value in the first readout; 1 rad is a bit less than 60°."),
      setup: () => { setPlaying(false); setTheta(20 * DEG); },
    },
    {
      title: tx(t, "figUnitL4_t", "Unroll the circle"),
      body: <>
        <p>{tx(t, "figUnitL4_b1", "On the right the angle is laid out along a line. As the point goes round, its height draws the green sine wave and its x the red cosine wave.")}</p>
        <p>{tx(t, "figUnitL4_b2", "Press play and let it go round once.")}</p>
      </>,
      goal: { text: tx(t, "figUnitL4_g", "One full turn."), done: laps >= 1 },
      focus: "play",
      setup: () => { setPlaying(false); setTheta(0); },
    },
    {
      title: tx(t, "figUnitL5_t", "Quick check"),
      body: <p>{tx(t, "figUnitL5_b", "At 45° the point is on the diagonal, so its x and y are equal.")}</p>,
      quiz: {
        q: tx(t, "figUnitL5_q", "At which other angle between 0° and 360° is sin θ = cos θ?"),
        options: ["225°", "135°", "315°", "90°"],
        answer: 0,
        why: tx(t, "figUnitL5_w", "The diagonal y = x crosses the circle twice: at 45° and opposite it, at 45° + 180° = 225°, where both are −√2/2."),
      },
    },
    {
      title: tx(t, "figUnitL6_t", "The tangent"),
      body: <>
        <p>{tx(t, "figUnitL6_b1", "Switch on tan θ. Extend the radius until it meets the dashed line x = 1: that height is tan θ = sin θ / cos θ, the slope of the radius.")}</p>
        <p>{tx(t, "figUnitL6_b2", "Find an angle past 180° where tan θ = 1.")}</p>
      </>,
      goal: { text: tx(t, "figUnitL6_g", "tan θ = 1 with θ > 180°."), done: showTan && near(225 * DEG) },
      hint: tx(t, "figUnitL6_h", "The radius through the opposite point has the same slope: 45° + 180°."),
      setup: () => { setPlaying(false); setTheta(45 * DEG); },
    },
    {
      title: tx(t, "figUnitL7_t", "Quick check"),
      body: <p>{tx(t, "figUnitL7_b", "Drag the point toward the top and watch the amber segment.")}</p>,
      quiz: {
        q: tx(t, "figUnitL7_q", "Why is tan 90° undefined?"),
        options: [tx(t, "figUnitL7_o1", "cos 90° = 0, and tan divides by it"), tx(t, "figUnitL7_o2", "sin 90° = 0"), tx(t, "figUnitL7_o3", "angles past 89° are not allowed"), tx(t, "figUnitL7_o4", "the point leaves the circle")],
        answer: 0,
        why: tx(t, "figUnitL7_w", "At 90° the radius is vertical: it runs parallel to the line x = 1 and never meets it. In numbers, sin 90° / cos 90° = 1 / 0."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "axis", tone: "info", when: !playing && exact && whole % 90 === 0,
      title: tx(t, "figUnitI1_t", "On an axis"),
      body: tx(t, "figUnitI1_b", "Every quarter turn the point lands on an axis: one coordinate is 0 and the other is 1 or −1."),
    },
    {
      id: "rad", tone: "ok", when: !playing && near(1),
      title: tx(t, "figUnitI2_t", "One radian"),
      body: tx(t, "figUnitI2_b", "The arc walked equals the radius: θ = 1 rad ≈ 57.3°. A full turn is 2π ≈ 6.28 of these."),
    },
    {
      id: "neg", tone: "info", when: !playing && (c < -0.05 || s < -0.05),
      title: tx(t, "figUnitI3_t", "Negative values"),
      body: tx(t, "figUnitI3_b", "Sine and cosine are coordinates, so they carry signs: left of the y-axis cos θ < 0, below the x-axis sin θ < 0."),
    },
    {
      id: "tanBlow", tone: "warn", when: showTan && Math.abs(c) < 0.15,
      title: tx(t, "figUnitI4_t", "The tangent blows up"),
      body: tx(t, "figUnitI4_b", "The radius is nearly vertical, so it meets the line x = 1 very far away. At exactly 90° or 270° it never meets it: tan θ is undefined."),
    },
  ];

  const title = tx(t, "figUnit_title", "The unit circle: sine and cosine");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{tanBtn}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={tx(t, "figUnit_note2", "Drag the point around the circle, drag in the wave panel, or press play. The angle θ is measured from the positive x axis, counter-clockwise. The point's x coordinate is cos θ (red), its y coordinate is sin θ (green). Because the radius is 1, Pythagoras gives cos²θ + sin²θ = 1 at every angle. Unrolling the angle along a line turns the circular motion into the familiar waves: sine starts at 0, cosine at 1, a quarter turn (π/2) apart. The arc length from the x axis to the point equals θ in radians, which is exactly what a radian is.")}
      >
        <div ref={vis.ref}>{view}</div>
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{tanBtn}</Row>{controls}</>}
        recap={[
          tx(t, "figUnitR1", "The point at angle θ on the unit circle is (cos θ, sin θ), for every angle."),
          tx(t, "figUnitR2", "On the unit circle the arc length is the angle in radians; a full turn is 2π."),
          tx(t, "figUnitR3", "Unrolled, the height draws the sine wave and the x the cosine wave, a quarter turn apart."),
          tx(t, "figUnitR4", "tan θ is the slope of the radius; it repeats every 180° and is undefined where cos θ = 0."),
        ]}
      />
    </>
  );
}
