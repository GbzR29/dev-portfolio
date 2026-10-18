"use client";

// Fluids & Heat 2: fluids in motion — the ideal fluid and streamlines; the
// continuity equation A v = constant; Bernoulli's equation derived from the
// work–energy theorem; Venturi tubes, atomisers, roofs in storms and how a
// wing really makes lift; Torricelli's law from Bernoulli and the leaking
// tank; real fluids: viscosity, Poiseuille's r⁴ law, laminar and turbulent
// flow and the Reynolds number, drag.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { VenturiFigure } from "@/components/lesson/figures/physics/VenturiFigure";
import { DrainFigure } from "@/components/lesson/figures/physics/DrainFigure";

const r = String.raw;
const num = (v: number, d = 1) => String(+v.toFixed(d)).replace("-", "−");

// ── Live formulas: the numbers plugged in ─────────────────────────────────────

/** Torricelli: jet speed and flow through a round hole of diameter d (mm). */
const jetNumbers = (t: TrackTranslations) => (v: Record<string, number>) => {
  const speed = Math.sqrt(2 * 9.81 * v.h), area = Math.PI * (v.d / 2000) ** 2, Q = speed * area * 1000 * 60;
  return {
    tex: r`v = \sqrt{2 \times 9.81 \times ${num(v.h, 2)}} = \amber{${num(speed, 2)}\ \text{m/s}}`,
    meter: Math.min(1, speed / 15), meterLabel: `${tx(t, "phFlow_liveFlow", "flow through the hole")} Q = A v = ${num(Q, 1)} L/min`,
  };
};

export function FluidDynamicsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "phFlow_intro",
          "Put your thumb over the end of a garden hose and the water shoots farther. Open a window on a windy day and the curtain is sucked outwards. Hold a spoon under a running tap and it swings into the stream. These are fluids in motion, and two conservation laws you already know explain most of what they do: what flows in must flow out, and energy is conserved. This chapter turns them into the continuity equation and Bernoulli's equation, then looks at what real, sticky fluids add.")}
      </Lead>

      <Goals t={t} id="phFlow" items={[
        "Use the continuity equation to relate the speed of a flow to the width of the pipe.",
        "Derive Bernoulli's equation from energy conservation and use it to explain low pressure in fast flow.",
        "Find the speed of water leaving a tank with Torricelli's law.",
        "Describe viscosity, laminar and turbulent flow, and use the Reynolds number to tell them apart.",
      ]} />

      <H2>{tx(t, "phFlow_idealTitle", "The ideal fluid")}</H2>
      <p>
        {tx(t, "phFlow_idealBody",
          "Real flows can be wildly complicated, so we start with a model, the ideal fluid. It is incompressible: its density does not change, which is very nearly true for water and also for air moving well below the speed of sound. It has no viscosity: no internal friction. And the flow is steady: at each point the velocity stays the same over time, even though different bits of fluid pass through. In a steady flow, each bit of fluid follows a fixed path called a streamline; smoke in a wind tunnel makes them visible. Streamlines never cross, and where they crowd together the fluid moves faster.")}
      </p>

      <H2>{tx(t, "phFlow_contTitle", "What flows in must flow out: continuity")}</H2>
      <p>
        {tx(t, "phFlow_contBody",
          "Follow water through a pipe that narrows. In a time Δt, the water crossing a section of area A moves forward v Δt, so the volume that passes is A v Δt. The fluid cannot pile up anywhere (it is incompressible and the pipe is full), so the same volume must pass every section in the same time.")}
      </p>
      <Equation label={tx(t, "phFlow_eqCont", "The continuity equation")}
        where={[
          [r`Q`, tx(t, "phFlow_wQ", "the volume flow rate: volume passing per second (m³/s)")],
          [r`A_1,\ A_2`, tx(t, "phFlow_wA", "the cross-sectional areas at two places (m²)")],
          [r`v_1,\ v_2`, tx(t, "phFlow_wV", "the flow speeds there (m/s)")],
        ]}
        words={tx(t, "phFlow_contWords", "Where the pipe is half as wide in area, the fluid moves twice as fast.")}
        note={tx(t, "phFlow_contNote", "Your thumb over a hose works this way: the same flow through a smaller opening must leave faster. A river speeds up where its bed narrows and slows in wide, deep pools. Blood leaves the heart through the aorta (about 3 cm²) at about 30 cm/s, some 90 cm³ every second; spread over the capillaries, whose total cross-section is about 2 500 cm², it crawls along at a third of a millimetre per second, slowly enough to exchange oxygen.")}>
        {r`Q = A_1 v_1 = A_2 v_2`}
      </Equation>

      <H2>{tx(t, "phFlow_bernTitle", "Bernoulli's equation")}</H2>
      <p>
        {tx(t, "phFlow_bernBody",
          "If water speeds up as it enters a narrow section, something must push it forward: the pressure behind it must be higher than the pressure ahead. So in a steady flow, faster fluid has lower pressure. Daniel Bernoulli made this exact in 1738 by applying the work–energy theorem (from the work and energy chapter) to a small chunk of fluid moving along a streamline from place 1 to place 2, possibly at different heights y.")}
      </p>
      <Derivation t={t} label={tx(t, "phFlow_eqBernD", "Bernoulli from work and energy")}
        steps={[
          { tex: r`W = p_1 A_1 \Delta x_1 - p_2 A_2 \Delta x_2 = (p_1 - p_2)\, \Delta V`, why: tx(t, "phFlow_b1", "the fluid behind pushes the chunk forward through Δx₁, the fluid ahead pushes back through Δx₂; by continuity both sweep the same volume ΔV") },
          { tex: r`\Delta K = \tfrac12 \rho\, \Delta V\, (v_2^2 - v_1^2)`, why: tx(t, "phFlow_b2", "the net effect is a mass ρ ΔV moved from speed v₁ to speed v₂") },
          { tex: r`\Delta U = \rho\, \Delta V\, g\, (y_2 - y_1)`, why: tx(t, "phFlow_b3", "and lifted from height y₁ to y₂") },
          { tex: r`(p_1 - p_2)\Delta V = \tfrac12 \rho \Delta V (v_2^2 - v_1^2) + \rho \Delta V g (y_2 - y_1)`, why: tx(t, "phFlow_b4", "the work done by pressure equals the gain in kinetic plus potential energy (no friction in an ideal fluid)") },
          { tex: r`\green{p_1 + \tfrac12 \rho v_1^2 + \rho g y_1 = p_2 + \tfrac12 \rho v_2^2 + \rho g y_2}`, why: tx(t, "phFlow_b5", "divide by ΔV and gather each place's terms on one side") },
        ]} />
      <Equation label={tx(t, "phFlow_eqBern", "Bernoulli's equation")}
        where={[
          [r`p`, tx(t, "phFlow_wP", "the pressure (Pa)")],
          [r`\tfrac12 \rho v^2`, tx(t, "phFlow_wKin", "the kinetic energy per cubic metre (J/m³ = Pa)")],
          [r`\rho g y`, tx(t, "phFlow_wPot", "the gravitational potential energy per cubic metre, y being the height")],
        ]}
        words={tx(t, "phFlow_bernWords", "Along a streamline, pressure, kinetic energy per volume and potential energy per volume always add up to the same total.")}
        note={tx(t, "phFlow_bernNote", "Each term is an energy per volume, and all three are measured in pascals. With no flow it reduces to p + ρ g y = constant, the hydrostatic law of the last chapter. It holds along one streamline of a steady, incompressible flow without friction; for real flows in long pipes the friction losses must be added.")}>
        {r`p + \tfrac12 \rho v^2 + \rho g y = \text{constant}`}
      </Equation>
      <VenturiFigure t={t} />

      <H3>{tx(t, "phFlow_appsTitle", "Bernoulli at work")}</H3>
      <LessonTable
        headers={[tx(t, "phFlow_tEx", "Example"), tx(t, "phFlow_tHow", "What happens")]}
        rows={[
          [tx(t, "phFlow_a1", "Venturi meter"), tx(t, "phFlow_a1m", "the pressure drop at a throat measures the flow speed in a pipe")],
          [tx(t, "phFlow_a2", "perfume atomiser, paint sprayer"), tx(t, "phFlow_a2m", "fast air across a tube lowers the pressure at its top; the liquid is pushed up and torn into droplets")],
          [tx(t, "phFlow_a3", "roofs in storms"), tx(t, "phFlow_a3m", "wind racing over a roof lowers the pressure above it, while still air inside pushes up")],
          [tx(t, "phFlow_a4", "two ships side by side"), tx(t, "phFlow_a4m", "water squeezed between them speeds up and its pressure drops: the hulls are pushed together")],
          [tx(t, "phFlow_a5", "a spoon under a tap"), tx(t, "phFlow_a5m", "the stream curving round the spoon's back has lower pressure there, so the spoon swings in")],
        ]}
      />
      <p>
        {tx(t, "phFlow_roofBody",
          "A storm wind of 40 m/s (144 km/h) over a roof lowers the pressure above it by about ½ × 1.2 × 40² = 960 Pa. On a 100 m² roof that is a net upward force of 96 000 N, the weight of ten tonnes. Roofs are lost to suction from above far more often than to wind pushing on walls.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "phFlow_wing", "A popular explanation of lift says that air going over the curved top of a wing must \"catch up\" with air going underneath, so it moves faster. That is false: in wind tunnels the air over the top arrives at the back well before the air underneath. The correct picture has two consistent halves. A wing, tilted and curved, turns the airflow downwards; by Newton's third law the air pushes the wing up. And because the flow over the top follows a curved path, the pressure there must be lower than the surrounding air's (it is what bends the flow), so it is faster, as Bernoulli says. Both descriptions are the same physics seen from two sides.")}
      </Callout>

      <H2>{tx(t, "phFlow_torrTitle", "Torricelli's law: water leaving a tank")}</H2>
      <p>
        {tx(t, "phFlow_torrBody",
          "Apply Bernoulli to a streamline that starts at the surface of a large open tank and leaves through a small hole at depth h below it.")}
      </p>
      <Derivation t={t} label={tx(t, "phFlow_eqTorr", "Torricelli's law")}
        steps={[
          { tex: r`p_0 + 0 + \rho g h = p_0 + \tfrac12 \rho v^2 + 0`, why: tx(t, "phFlow_t1", "at the surface: air pressure, almost no speed (the tank is wide), height h above the hole; at the hole: air pressure, speed v, height 0") },
          { tex: r`\rho g h = \tfrac12 \rho v^2`, why: tx(t, "phFlow_t2", "p₀ cancels") },
          { tex: r`\green{v = \sqrt{2 g h}}`, why: tx(t, "phFlow_t3", "the density cancels too: the speed a stone would reach falling from the surface to the hole") },
        ]} />
      <p>
        {tx(t, "phFlow_torrBody2",
          "Torricelli found this in 1643, a century before Bernoulli. Once out of the hole, the water is a projectile, as in the projectile chapter: from a hole at height y above the floor it lands a distance R = v √(2y/g) = 2√(h y) away. As the tank empties, h falls, so the jet slows and the level drops ever more slowly.")}
      </p>
      <DrainFigure t={t} />
      <LiveFormula label={tx(t, "phFlow_liveJet", "Try it: the jet from a hole")}
        tex={r`v = \sqrt{2 g h}, \qquad Q = A\, v`}
        vars={[
          { id: "h", label: tx(t, "phFlow_liveH", "depth h (m)"), min: 0.05, max: 10, step: 0.05, value: 2, fmt: v => `${num(v, 2)} m` },
          { id: "d", label: tx(t, "phFlow_liveD", "hole Ø (mm)"), min: 1, max: 50, step: 1, value: 10, fmt: v => `${num(v, 0)} mm` },
        ]}
        compute={jetNumbers(t)}
        note={tx(t, "phFlow_liveJetNote", "A 1 cm hole 2 m below the surface gives a jet at 6.3 m/s and about 30 litres a minute. Four times the depth only doubles the speed. Real holes pass about 60% of this, because the stream narrows just after the hole (the vena contracta), but the speed in the jet follows √(2gh) closely.")} />

      <H2>{tx(t, "phFlow_viscTitle", "Real fluids: viscosity")}</H2>
      <p>
        {tx(t, "phFlow_viscBody",
          "Honey poured from a spoon flows slowly because it is viscous: its layers resist sliding past one another. Picture fluid between two plates a distance d apart, with the top plate dragged at speed v. The layer touching each plate moves with it, and the force needed is F = η A v / d, where A is the plate area and η (the Greek letter eta) is the viscosity, in pascal-seconds. In a pipe, the fluid at the wall is at rest and the centre moves fastest.")}
      </p>
      <LessonTable
        headers={[tx(t, "phFlow_tFluid", "Fluid (20 °C)"), tx(t, "phFlow_tEta", "Viscosity η (Pa·s)")]}
        rows={[
          [tx(t, "phFlow_v1", "air"), "0.000018"],
          [tx(t, "phFlow_v2", "water"), "0.0010"],
          [tx(t, "phFlow_v3", "blood (37 °C)"), "≈ 0.0035"],
          [tx(t, "phFlow_v4", "olive oil"), "≈ 0.08"],
          [tx(t, "phFlow_v5", "honey"), "≈ 2 – 10"],
        ]}
      />
      <p>
        {tx(t, "phFlow_poisBody",
          "For slow, smooth flow through a pipe of radius r and length L, Jean Poiseuille measured (and later physicists derived) the flow rate Q = π r⁴ Δp / (8 η L), where Δp is the pressure difference between the ends. The fourth power is dramatic. Narrow an artery's radius by 20% and, at the same blood pressure, the flow falls to 0.8⁴ = 41% of normal; to restore it the heart must push 2.4 times harder. That is why small deposits in blood vessels matter so much.")}
      </p>

      <H3>{tx(t, "phFlow_turbTitle", "Smooth or chaotic: the Reynolds number")}</H3>
      <p>
        {tx(t, "phFlow_turbBody",
          "Turn on a tap gently and the stream is clear and glassy: laminar flow, in smooth layers. Open it more and the stream turns rough and white: turbulent flow, full of swirling eddies. Smoke rising from a candle does both, smooth at first and breaking into curls higher up. Which one you get depends on a single dimensionless number, the ratio of the fluid's inertia (which keeps disturbances going) to its viscosity (which smooths them out), named after Osborne Reynolds.")}
      </p>
      <Equation label={tx(t, "phFlow_eqRe", "The Reynolds number")}
        where={[
          [r`\rho`, tx(t, "phFlow_wRho", "the fluid's density (kg/m³)")],
          [r`v`, tx(t, "phFlow_wVr", "the flow speed (m/s)")],
          [r`D`, tx(t, "phFlow_wD", "a size: the pipe's diameter, or the object's width (m)")],
          [r`\eta`, tx(t, "phFlow_wEta", "the viscosity (Pa·s)")],
        ]}
        note={tx(t, "phFlow_reNote", "In a pipe, flow is laminar below about Re = 2 000 and turbulent above about 4 000. Water at 1 m/s in a 2 cm pipe has Re = 1000 × 1 × 0.02 / 0.001 = 20 000: turbulent. Blood in the aorta is around 2 000, right at the edge. A bacterium swimming has Re ≈ 0.0001: for it, water is thicker than honey is for us, and it stops dead the instant it stops swimming.")}>
        {r`Re = \frac{\rho\, v\, D}{\eta}`}
      </Equation>
      <p>
        {tx(t, "phFlow_dragBody",
          "Viscosity and turbulence also set the drag on objects moving through a fluid. At low Reynolds number the drag is proportional to the speed (for a small sphere, F = 6π η r v, which is why fine mist drifts so slowly). At the high Reynolds numbers of cars, balls and people, the drag grows with the square of the speed, F = ½ C_d ρ A v², as in the forces chapter: the energy goes into the turbulent wake. The dimples on a golf ball make the thin layer of air next to it turbulent on purpose, which lets the flow cling to the ball longer, shrinks the wake and roughly halves the drag.")}
      </p>

      <H2>{tx(t, "phFlow_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "phFlow_ex1", "1. A hose of 2 cm diameter (3.14 cm²) carries water at 1 m/s: Q = 314 cm³/s, about 19 L/min. Your thumb leaves an opening of 0.5 cm²: the water leaves at 314 / 0.5 = 628 cm/s, 6.3 m/s.")}</p>
      <p>{tx(t, "phFlow_ex2", "2. A Venturi meter narrows a water pipe from 10 cm² to 5 cm² and the pressure difference is 3 kPa. Continuity gives v₂ = 2 v₁; Bernoulli gives 3000 = ½ × 1000 × (4 v₁² − v₁²), so v₁ = 1.41 m/s and Q = 0.001 × 1.41 = 1.41 L/s.")}</p>
      <p>{tx(t, "phFlow_ex3", "3. A tap 30 m below the water level in a water tower: with no flow, the gauge pressure is ρ g h = 294 kPa, about 3 bar. Fully open with no losses, water would leave at √(2 × 9.81 × 30) = 24 m/s.")}</p>
      <p>{tx(t, "phFlow_ex4", "4. A barrel springs a leak 1.2 m below the surface, 0.5 m above the floor. v = √(2 × 9.81 × 1.2) = 4.9 m/s, and the jet lands 2√(1.2 × 0.5) = 1.55 m from the barrel.")}</p>
      <p>{tx(t, "phFlow_ex5", "5. Air at 30 m/s past a car mirror 15 cm wide: Re = 1.2 × 30 × 0.15 / 0.000018 = 300 000, fully turbulent, so the drag grows as v².")}</p>

      <H2>{tx(t, "phFlow_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "phFlow_tWrong", "Wrong"), tx(t, "phFlow_tRight", "Right"), tx(t, "phFlow_tWhy", "Why")]}
        rows={[
          [tx(t, "phFlow_m1w", "faster flow means more pressure"), tx(t, "phFlow_m1r", "less pressure"), tx(t, "phFlow_m1", "the fluid speeds up because the pressure behind it is higher")],
          [tx(t, "phFlow_m2w", "narrowing a pipe slows the flow"), tx(t, "phFlow_m2r", "it speeds up"), tx(t, "phFlow_m2", "A v is the same at every section")],
          [tx(t, "phFlow_m3w", "air over a wing must catch up"), tx(t, "phFlow_m3r", "it arrives earlier"), tx(t, "phFlow_m3", "lift comes from turning the flow down, with lower pressure above")],
          [tx(t, "phFlow_m4w", "Bernoulli holds everywhere"), tx(t, "phFlow_m4r", "along a streamline, no friction, steady"), tx(t, "phFlow_m4", "viscosity and turbulence take energy out")],
          [tx(t, "phFlow_m5w", "the jet speed depends on the hole size"), tx(t, "phFlow_m5r", "v = √(2 g h)"), tx(t, "phFlow_m5", "the hole size changes the flow rate, not the speed")],
          [tx(t, "phFlow_m6w", "double the pipe radius, double the flow"), tx(t, "phFlow_m6r", "16 times (laminar)"), tx(t, "phFlow_m6", "Poiseuille: Q grows as r⁴")],
        ]}
      />

      <KeyIdeas t={t} id="phFlow" items={[
        "An ideal fluid is incompressible, frictionless and steady; each bit follows a streamline.",
        "Continuity: Q = A v is the same through every section, so the flow speeds up where the pipe narrows.",
        "Bernoulli: p + ½ρv² + ρgy is constant along a streamline; faster flow has lower pressure.",
        "Torricelli: water leaves a hole at depth h at v = √(2gh), like a stone falling from the surface.",
        "Viscosity resists sliding layers; laminar pipe flow follows Poiseuille, Q ∝ r⁴.",
        "The Reynolds number ρvD/η tells laminar flow (below about 2 000 in a pipe) from turbulent flow (above about 4 000).",
      ]} />
    </Article>
  );
}
