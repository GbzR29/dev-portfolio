"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, C, T, useFrame, useVisible, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Dimensional analysis as an experiment. A pendulum swings on the left with
// the period it really has. The reader guesses a law T = k · Lᵃ · gᵇ · mᶜ by
// picking the three exponents. The middle column works out the dimensions of
// Lᵃ gᵇ mᶜ (it must come out as seconds), and the table on the right divides
// four measured periods by the guess: a true law gives the SAME k for every
// pendulum (2π), a wrong one gives a k that changes from row to row.

const W = 560, H = 270;
const EXPS = [-1, -0.5, 0, 0.5, 1] as const;
const PLANETS = [["earth", 9.81], ["moon", 1.62], ["mars", 3.71]] as const;
type Planet = (typeof PLANETS)[number][0];
const gOf = (p: Planet) => PLANETS.find(e => e[0] === p)![1];
const period = (L: number, g: number) => 2 * Math.PI * Math.sqrt(L / g);
const AMP = 0.21;                                   // 12° swing, small enough for the formula

/** Four reference pendulums: length (m), mass (kg), planet. */
const REF: [number, number, Planet][] = [[0.5, 1, "earth"], [2, 1, "earth"], [1, 5, "earth"], [1, 1, "moon"]];

const sup = (v: number) => (v === 0.5 ? "½" : v === -0.5 ? "−½" : String(v).replace("-", "−"));
const PLANET_NAME: Record<Planet, string> = { earth: "Earth", moon: "Moon", mars: "Mars" };
export const planetName = (t: TrackTranslations | undefined, p: Planet) => tx(t, `figPhDim_${p}`, PLANET_NAME[p]);

/** "L" with its power raised as a real superscript (none for power 1). */
const Pow = ({ base, v }: { base: string; v: number }) => (
  <>{base}{v !== 1 && <><tspan dy={-5} fontSize={8}>{sup(v)}</tspan><tspan dy={5}>{" "}</tspan></>}</>
);

export function PendulumDimensionsFigure({ t }: { t?: TrackTranslations }) {
  const [a, setA] = useState<number>(1);
  const [b, setB] = useState<number>(0);
  const [c, setC] = useState<number>(0);
  const [L, setL] = useState(1);
  const [m, setM] = useState(1);
  const [planet, setPlanet] = useState<Planet>("earth");
  const [time, setTime] = useState(0);
  const vis = useVisible<HTMLDivElement>();
  useFrame(vis.on, dt => setTime(v => v + dt));

  const g = gOf(planet), Treal = period(L, g);
  const theta = AMP * Math.cos((2 * Math.PI * time) / Treal);
  const guess = (l: number, mm: number, gg: number) => l ** a * gg ** b * mm ** c;

  // Dimensions of Lᵃ gᵇ mᶜ: g is L T⁻², so M^c L^(a+b) T^(−2b)
  const dM = c, dL = a + b, dT = -2 * b;
  const ok = dM === 0 && dL === 0 && dT === 1;
  const ks = REF.map(([l, mm, p]) => period(l, gOf(p)) / guess(l, mm, gOf(p)));
  const spread = (Math.max(...ks) - Math.min(...ks)) / Math.min(...ks);
  const same = spread < 0.005;

  // ── Pendulum geometry
  const px = 120, py = 30, len = 40 + (L - 0.25) * (170 / 1.75);
  const bx = px + len * Math.sin(theta), by = py + len * Math.cos(theta);
  const br = 7 + 4 * Math.cbrt(m);

  const dimRow = (label: string, val: number, want: number, y: number, col: string) => (
    <g>
      <T x={262} y={y} color={col} bold>{label}</T>
      <T x={300} y={y} color={val === want ? C.green : C.red} bold>{sup(val)}</T>
      <T x={330} y={y} color={C.muted}>{`(${tx(t, "figPhDim_want", "want")} ${want})`}</T>
    </g>
  );

  const view = (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {/* pendulum */}
      <line x1={60} x2={180} y1={py} y2={py} stroke={C.axis} strokeWidth={3} />
      <line x1={px} y1={py} x2={px} y2={py + len + 14} stroke={C.grid} strokeDasharray="3 4" />
      <line x1={px} y1={py} x2={bx} y2={by} stroke={C.fg} strokeWidth={1.6} />
      <circle cx={bx} cy={by} r={br} fill={C.sky} />
      <T x={px} y={H - 28} anchor="middle" color={C.muted}>{`L = ${f2(L)} m · m = ${f2(m, 1)} kg`}</T>
      <T x={px} y={H - 14} anchor="middle" color={C.amber} bold>{`${tx(t, "figPhDim_measured", "measured")} T = ${f2(Treal)} s`}</T>

      {/* dimensions of the guess */}
      <line x1={240} x2={240} y1={16} y2={H - 16} stroke={C.grid} />
      <T x={256} y={28} color={C.fg} size={11} bold>T = k · <Pow base="L" v={a} /> · <Pow base="g" v={b} /> · <Pow base="m" v={c} /></T>
      <T x={256} y={50} color={C.muted}>{tx(t, "figPhDim_units", "g is in m/s², so its dimension is L·T⁻²")}</T>
      <T x={256} y={72} color={C.muted}>{tx(t, "figPhDim_power", "power of each base dimension:")}</T>
      {dimRow("M", dM, 0, 94, C.purple)}
      {dimRow("L", dL, 0, 112, C.sky)}
      {dimRow("T", dT, 1, 130, C.amber)}
      <T x={256} y={156} color={ok ? C.green : C.red} bold>
        {ok ? tx(t, "figPhDim_okDim", "comes out in seconds") : tx(t, "figPhDim_badDim", "not a time: cannot be a period")}
      </T>

      {/* the four reference pendulums */}
      <T x={256} y={186} color={C.muted}>{tx(t, "figPhDim_table", "k = measured T ÷ guess, four pendulums:")}</T>
      {REF.map(([l, mm, p], i) => {
        const y = 204 + i * 15;
        return (
          <g key={i}>
            <T x={256} y={y} color={C.muted}>{`${f2(l, 1)} m, ${mm} kg, ${planetName(t, p)}`}</T>
            <T x={W - 16} y={y} anchor="end" color={same ? C.green : C.red} bold>{`k = ${Number.isFinite(ks[i]) ? f2(ks[i], 3) : "—"}`}</T>
          </g>
        );
      })}
    </svg>
  );

  const pick = (label: string, v: number, set: (v: number) => void) => (
    <Row>
      <span className="text-[10px] font-mono text-[var(--text-muted)] w-24">{label}</span>
      <Choice value={String(v)} onChange={s => set(Number(s))} options={EXPS.map(e => [String(e), sup(e)] as const)} />
    </Row>
  );

  return (
    <Figure title={tx(t, "figPhDim_title", "Guess the pendulum's law")}
      controls={<>
        {pick(tx(t, "figPhDim_expL", "power of L"), a, setA)}
        {pick(tx(t, "figPhDim_expG", "power of g"), b, setB)}
        {pick(tx(t, "figPhDim_expM", "power of m"), c, setC)}
        <Sliders>
          <Slider label={tx(t, "figPhDim_len", "length L")} value={L} min={0.25} max={2} step={0.05} onChange={setL} fmt={v => `${f2(v)} m`} />
          <Slider label={tx(t, "figPhDim_mass", "mass m")} value={m} min={0.1} max={5} step={0.1} onChange={setM} fmt={v => `${f2(v, 1)} kg`} />
        </Sliders>
        <Row>
          <Choice value={planet} onChange={setPlanet} options={PLANETS.map(([k, gg]) => [k, `${planetName(t, k)} (g = ${gg})`] as const)} />
        </Row>
        <Row>
          <Readout color={ok ? C.green : C.red}>{`[${tx(t, "figPhDim_guess", "guess")}] = M${sup(dM)} L${sup(dL)} T${sup(dT)}`}</Readout>
          <Readout color={same ? C.green : C.red}>{same
            ? `${tx(t, "figPhDim_found", "same k for all four")}: k = ${f2(ks[0], 3)} ≈ 2π`
            : `${tx(t, "figPhDim_spread", "k changes by")} ${f2(spread * 100, 0)}%`}</Readout>
        </Row>
      </>}
      note={tx(t, "figPhDim_note", "The period T of a pendulum could depend on its length L, on gravity g and on the mass m of the bob. Guess a law by picking the powers. First look at the middle column: the guess must come out in seconds, so M and L must cancel (power 0) and T must have power 1. Then look at the table: it divides four real periods by your guess. A wrong law needs a different k for every pendulum; the right one needs the same k every time. Change L, m and the planet to see what the period really depends on.")}>
      <div ref={vis.ref}>{view}</div>
    </Figure>
  );
}
