"use client";

// Fluids & Heat 1: fluids at rest — density, pressure p = F/A and its units,
// atmospheric pressure, p = p₀ + ρgh derived from a column of liquid, why
// only depth matters (connected vessels), pressure in the atmosphere, the
// barometer and the manometer, Pascal's principle and the hydraulic press
// (force multiplied, work not), Archimedes' principle derived from the
// pressure difference, floating and the fraction submerged, surface tension.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { PressureFigure } from "@/components/lesson/figures/physics/PressureFigure";
import { BuoyancyFigure } from "@/components/lesson/figures/physics/BuoyancyFigure";

const r = String.raw;
const num = (v: number, d = 1) => String(+v.toFixed(d)).replace("-", "−");

// ── Live formulas: the numbers plugged in ─────────────────────────────────────

/** Hydraulic jack: F₂ = F₁ (d₂/d₁)², diameters in cm. */
const jackNumbers = (t: TrackTranslations) => (v: Record<string, number>) => {
  const k = (v.d2 / v.d1) ** 2, F2 = v.F1 * k;
  return {
    tex: r`F_2 = F_1 \frac{A_2}{A_1} = ${num(v.F1, 0)} \times \left(\frac{${num(v.d2, 1)}}{${num(v.d1, 1)}}\right)^2 = \amber{${num(F2, 0)}\ \text{N}}`,
    meter: Math.min(1, F2 / 20000), meterLabel: `${tx(t, "phFlu_liveLifts", "lifts")} ${num(F2 / 9.81, 0)} kg · ${tx(t, "phFlu_livePush", "push 1 m to raise it")} ${num(100 / k, 1)} cm`,
  };
};

export function FluidStaticsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "phFlu_intro",
          "Why are dams thicker at the bottom? How does a car's brake pedal stop a tonne of metal with a gentle push? Why does a steel ship float while a steel nail sinks? All three answers come from one idea, pressure, applied to fluids that are not moving. This chapter builds the physics of fluids at rest, hydrostatics, from a single column of liquid, and ends with Archimedes' principle, one of the oldest laws in physics.")}
      </Lead>

      <Goals t={t} id="phFlu" items={[
        "Define density and pressure, and convert between the common units of pressure.",
        "Derive p = p₀ + ρ g h and explain why the pressure depends only on depth.",
        "Use Pascal's principle to explain the hydraulic press, and read a barometer.",
        "Derive Archimedes' principle and predict whether, and how deep, an object floats.",
      ]} />

      <H2>{tx(t, "phFlu_fluidTitle", "Fluids, density and pressure")}</H2>
      <p>
        {tx(t, "phFlu_fluidBody",
          "A fluid is anything that flows: liquids and gases. Unlike a solid, a fluid at rest cannot push sideways along a surface; it would simply flow. So every force a resting fluid exerts on a wall, or on anything inside it, pushes straight against the surface. That is why we describe it by a pressure rather than by individual forces.")}
      </p>
      <p>
        {tx(t, "phFlu_rhoBody",
          "The first property of a fluid, or of anything, is its density ρ (the Greek letter rho): mass per unit volume, ρ = m / V, in kg/m³. A litre of water (0.001 m³) has a mass of 1 kg, so water's density is 1 000 kg/m³.")}
      </p>
      <LessonTable
        headers={[tx(t, "phFlu_tSub", "Substance"), tx(t, "phFlu_tRho", "Density (kg/m³)")]}
        rows={[
          [tx(t, "phFlu_d1", "air at sea level"), "1.2"],
          [tx(t, "phFlu_d2", "cork"), "240"],
          [tx(t, "phFlu_d3", "pine wood"), "500"],
          [tx(t, "phFlu_d4", "ice"), "917"],
          [tx(t, "phFlu_d5", "fresh water"), "1 000"],
          [tx(t, "phFlu_d6", "sea water"), "1 025"],
          [tx(t, "phFlu_d7", "aluminium"), "2 700"],
          [tx(t, "phFlu_d8", "iron"), "7 870"],
          [tx(t, "phFlu_d9", "mercury"), "13 600"],
          [tx(t, "phFlu_d10", "gold"), "19 300"],
        ]}
      />
      <Equation label={tx(t, "phFlu_eqP", "Pressure")}
        where={[
          [r`p`, tx(t, "phFlu_wP", "the pressure (Pa, pascals: 1 Pa = 1 N/m²)")],
          [r`F`, tx(t, "phFlu_wF", "the force pushing straight against the surface (N)")],
          [r`A`, tx(t, "phFlu_wA", "the area it is spread over (m²)")],
        ]}
        words={tx(t, "phFlu_pWords", "The same force on a smaller area is a bigger pressure.")}
        note={tx(t, "phFlu_pNote", "Pressure is a scalar: at a point inside a fluid it pushes equally in every direction. A 60 kg person on one stiletto heel of 1 cm² presses the floor with 5.9 million pascals; a 5-tonne elephant spreads its weight over four feet of about 0.1 m² each, about 120 000 Pa. The heel is far more likely to dent a wooden floor.")}>
        {r`p = \frac{F}{A}`}
      </Equation>
      <p>
        {tx(t, "phFlu_atmBody",
          "We live at the bottom of an ocean of air. Its weight presses on everything with the atmospheric pressure, about 101 325 Pa at sea level: the weight of 10 tonnes on every square metre. We do not feel it because it pushes on us from every side, and the fluids inside our bodies push back out just as hard. Pump the air out of a tin can and the outside air crushes it at once.")}
      </p>

      <H2>{tx(t, "phFlu_depthTitle", "Pressure grows with depth")}</H2>
      <p>
        {tx(t, "phFlu_depthBody",
          "Imagine a cylinder of liquid inside a larger body of liquid, with its top face at the surface and its bottom face at depth h, and cross-section A. It is at rest, so the forces on it balance. Down: the air pressing on its top, and its own weight. Up: the liquid underneath pushing on its bottom face.")}
      </p>
      <Derivation t={t} label={tx(t, "phFlu_eqDepthD", "Pressure at depth h")}
        steps={[
          { tex: r`p\,A = p_0\,A + m g`, why: tx(t, "phFlu_s1", "the upward push on the bottom balances the air on top plus the weight; the sideways pushes cancel") },
          { tex: r`m = \rho\, V = \rho\, A\, h`, why: tx(t, "phFlu_s2", "the mass of the cylinder: density times volume") },
          { tex: r`p\,A = p_0\,A + \rho\, A\, h\, g`, why: tx(t, "phFlu_s3", "substitute") },
          { tex: r`\green{p = p_0 + \rho\, g\, h}`, why: tx(t, "phFlu_s4", "divide by A: the area cancels, so the result holds for any shape") },
        ]} />
      <Equation label={tx(t, "phFlu_eqDepth", "Hydrostatic pressure")}
        where={[
          [r`p`, tx(t, "phFlu_wPd", "the pressure at depth h (Pa)")],
          [r`p_0`, tx(t, "phFlu_wP0", "the pressure at the surface, usually the air's (Pa)")],
          [r`\rho`, tx(t, "phFlu_wRho", "the density of the liquid (kg/m³)")],
          [r`g`, tx(t, "phFlu_wG", "the acceleration of gravity, 9.81 m/s²")],
          [r`h`, tx(t, "phFlu_wH", "the depth below the surface, measured straight down (m)")],
        ]}
        words={tx(t, "phFlu_depthWords", "Go deeper and the pressure rises steadily, by the weight of the liquid above each square metre.")}
        note={tx(t, "phFlu_depthNote", "ρ g h alone, the part added by the liquid, is the gauge pressure: what a tyre gauge or a depth gauge reads, measured above the air's. p, including p₀, is the absolute pressure. In water, ρ g = 9 810 Pa per metre, so every 10 m of depth adds about one atmosphere.")}>
        {r`p = p_0 + \rho\, g\, h`}
      </Equation>
      <p>
        {tx(t, "phFlu_paraBody",
          "Notice what is missing: the shape of the container. The pressure depends only on how deep you are, not on how much liquid is above you or how wide the vessel is. This surprised people for centuries and is called the hydrostatic paradox. It explains why connected vessels of any shapes fill to the same level, why a water tower on a hill can push water up to the top floors of buildings in the valley, and why a dam must be thick at the bottom, where the pressure is greatest, but its thickness does not depend on how long the lake behind it is.")}
      </p>
      <PressureFigure t={t} />
      <LessonTable
        headers={[tx(t, "phFlu_tWhere", "Where"), tx(t, "phFlu_tDepth", "Depth"), tx(t, "phFlu_tAbs", "Absolute pressure")]}
        rows={[
          [tx(t, "phFlu_w1", "bottom of a 2.5 m pool"), "2.5 m", "126 kPa ≈ 1.2 atm"],
          [tx(t, "phFlu_w2", "a recreational dive"), "30 m", "≈ 4 atm"],
          [tx(t, "phFlu_w3", "the wreck of the Titanic"), "3 800 m", "≈ 380 atm"],
          [tx(t, "phFlu_w4", "the bottom of the Mariana Trench"), "≈ 11 000 m", tx(t, "phFlu_w4p", "≈ 1 100 atm (sea water gets slightly denser down there)")],
        ]}
      />
      <H3>{tx(t, "phFlu_airTitle", "Pressure in the air")}</H3>
      <p>
        {tx(t, "phFlu_airBody",
          "The same reasoning holds for the atmosphere, with one difference: air is compressible, so it is denser at the bottom, where it is squeezed by the air above, and thinner higher up. Pressure does not fall in a straight line but roughly halves every 5.5 km. On the summit of Everest (8 849 m) it is about a third of sea-level pressure, and each breath brings in a third as much oxygen. Climbing just 10 m lowers the air pressure by about 120 Pa, which a phone's barometer can sense: that is how it counts the floors you climb.")}
      </p>

      <H2>{tx(t, "phFlu_measTitle", "Measuring pressure")}</H2>
      <p>
        {tx(t, "phFlu_baroBody",
          "In 1643 Evangelista Torricelli filled a glass tube with mercury, closed it with a finger and turned it upside down into a bowl of mercury. The mercury fell until the column was about 76 cm high, leaving empty space at the top. The air pressing on the bowl holds up the column: p₀ = ρ g h, so h = 101 325 / (13 600 × 9.81) = 0.760 m. That is the mercury barometer, and the origin of the unit \"millimetres of mercury\". With water, 13.6 times lighter, the column would be 10.3 m tall. That is also the highest a pump can lift water by sucking: it can only remove the air above the water, and the atmosphere can push no higher.")}
      </p>
      <LessonTable
        headers={[tx(t, "phFlu_tUnit", "Unit"), tx(t, "phFlu_tPa", "In pascals"), tx(t, "phFlu_tUse", "Where you meet it")]}
        rows={[
          [tx(t, "phFlu_u1", "pascal (Pa)"), "1", tx(t, "phFlu_u1w", "the SI unit; weather maps use hectopascals (hPa = 100 Pa)")],
          [tx(t, "phFlu_u2", "bar"), "100 000", tx(t, "phFlu_u2w", "tyres, scuba tanks")],
          [tx(t, "phFlu_u3", "atmosphere (atm)"), "101 325", tx(t, "phFlu_u3w", "average sea-level air pressure")],
          [tx(t, "phFlu_u4", "millimetre of mercury (mmHg)"), "133.3", tx(t, "phFlu_u4w", "blood pressure: 120/80 mmHg is 16/10.7 kPa above the air's")],
          [tx(t, "phFlu_u5", "pound per square inch (psi)"), "6 895", tx(t, "phFlu_u5w", "tyres in the US: 32 psi ≈ 2.2 bar")],
        ]}
      />

      <H2>{tx(t, "phFlu_pascalTitle", "Pascal's principle and the hydraulic press")}</H2>
      <p>
        {tx(t, "phFlu_pascalBody",
          "Push on a liquid sealed in a container and the extra pressure appears everywhere in it, undiminished: Blaise Pascal's principle (1653). It follows from p = p₀ + ρ g h: raise p₀ by some amount and the pressure at every depth rises by the same amount. Now connect a narrow cylinder to a wide one, both with pistons, and fill them with oil.")}
      </p>
      <Derivation t={t} label={tx(t, "phFlu_eqPress", "The hydraulic press")}
        steps={[
          { tex: r`p = \frac{F_1}{A_1}`, why: tx(t, "phFlu_h1", "a force F₁ on the small piston, of area A₁, adds this pressure to the oil") },
          { tex: r`F_2 = p\, A_2 = F_1\, \frac{A_2}{A_1}`, why: tx(t, "phFlu_h2", "the same pressure pushes on the large piston, of area A₂: the force is multiplied by A₂/A₁") },
          { tex: r`A_1\, d_1 = A_2\, d_2`, why: tx(t, "phFlu_h3", "oil does not compress: the volume pushed out of the small cylinder fills the large one") },
          { tex: r`\green{F_2\, d_2 = F_1\, d_1}`, why: tx(t, "phFlu_h4", "multiply: the work in equals the work out. The force is multiplied, the distance is divided, and no energy is created") },
        ]} />
      <LiveFormula label={tx(t, "phFlu_liveJack", "Try it: a hydraulic car jack")}
        tex={r`F_2 = F_1 \frac{A_2}{A_1} = F_1 \left(\frac{d_2}{d_1}\right)^2`}
        vars={[
          { id: "F1", label: "F₁ (N)", min: 20, max: 500, step: 10, value: 200, fmt: v => `${num(v, 0)} N` },
          { id: "d1", label: tx(t, "phFlu_liveD1", "small piston Ø (cm)"), min: 1, max: 5, step: 0.1, value: 2, fmt: v => `${num(v, 1)} cm` },
          { id: "d2", label: tx(t, "phFlu_liveD2", "large piston Ø (cm)"), min: 4, max: 20, step: 0.5, value: 10, fmt: v => `${num(v, 1)} cm` },
        ]}
        compute={jackNumbers(t)}
        note={tx(t, "phFlu_liveJackNote", "Pistons of 2 cm and 10 cm diameter have areas in the ratio 5² = 25: a 200 N push becomes 5 000 N, enough to lift 510 kg. But to raise the load 10 cm you must push the small piston through 2.5 m in total, which is why a jack is pumped with many short strokes. Car brakes work the same way: your foot moves a small piston, and larger pistons at each wheel squeeze the brake pads.")} />

      <H2>{tx(t, "phFlu_archTitle", "Buoyancy: Archimedes' principle")}</H2>
      <p>
        {tx(t, "phFlu_archBody",
          "Hold a beach ball under water and it pushes up hard against your hands. Every object in a fluid feels an upward force, the buoyant force. It comes straight from the growth of pressure with depth: the fluid pushes up on the bottom of the object harder than it pushes down on its top, because the bottom is deeper.")}
      </p>
      <Derivation t={t} label={tx(t, "phFlu_eqArch", "The buoyant force on a submerged block")}
        steps={[
          { tex: r`F_{up} - F_{down} = (p_0 + \rho g (h + a))A - (p_0 + \rho g h) A`, why: tx(t, "phFlu_a1", "a block of height a and top area A, its top at depth h; the sideways pushes cancel") },
          { tex: r`= \rho\, g\, a\, A`, why: tx(t, "phFlu_a2", "p₀ and the depth h cancel: only the height difference of the faces is left") },
          { tex: r`\green{B = \rho_{fluid}\, g\, V_{displaced}}`, why: tx(t, "phFlu_a3", "a A is the block's volume: the buoyant force equals the weight of the fluid the object pushes aside") },
        ]} />
      <p>
        {tx(t, "phFlu_archBody2",
          "The result holds for any shape, by a neat argument: picture the object replaced by fluid of the same shape. That fluid would sit still, so the surrounding fluid must push it up with exactly its weight. The surrounding fluid cannot tell what is inside the boundary, so it pushes the real object up with the same force. This is Archimedes' principle, stated around 250 BC: a body in a fluid is pushed up by the weight of the fluid it displaces. Notice that depth does not appear: once fully under, an object feels the same buoyancy at any depth.")}
      </p>
      <BuoyancyFigure t={t} />

      <H3>{tx(t, "phFlu_floatTitle", "Sinking and floating")}</H3>
      <p>
        {tx(t, "phFlu_floatBody",
          "Fully submerged, an object of density ρ_obj and volume V weighs ρ_obj g V and is pushed up by ρ_fluid g V. Compare the densities: if ρ_obj > ρ_fluid it sinks; if ρ_obj < ρ_fluid it rises until only part of it is under, just enough to displace its own weight. Setting ρ_obj V = ρ_fluid V_under gives the fraction under the surface.")}
      </p>
      <Equation label={tx(t, "phFlu_eqFloat", "The fraction of a floating object under the surface")}
        where={[
          [r`V_{under}`, tx(t, "phFlu_wVu", "the volume below the surface")],
          [r`V`, tx(t, "phFlu_wV", "the whole volume of the object")],
          [r`\rho_{obj},\ \rho_{fluid}`, tx(t, "phFlu_wRhos", "the densities of the object and of the fluid")],
        ]}
        note={tx(t, "phFlu_floatNote", "Ice in sea water: 917/1025 = 0.89, so about 89% of an iceberg is hidden. A ship is made of steel, nearly eight times denser than water, but its hull encloses a large volume of air, so its average density is less than water's. A ship that sails from a river into the sea rises a little, since sea water is denser; the Plimsoll marks painted on hulls show the safe loading lines for each.")}>
        {r`\frac{V_{under}}{V} = \frac{\rho_{obj}}{\rho_{fluid}}`}
      </Equation>
      <p>
        {tx(t, "phFlu_floatBody2",
          "Living things and machines adjust their average density to choose their depth. A fish fills or empties its swim bladder; a submarine floods its ballast tanks with water to dive and blows them full of air to surface. A hot-air balloon floats in the air itself: air at 100 °C is about a fifth less dense than air at 20 °C, so a 2 800 m³ balloon gets about 700 kg of lift, enough for its envelope, basket and a few passengers. In the Dead Sea, whose very salty water has a density of about 1 240 kg/m³, a person floats with a fifth of the body above the surface.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "phFlu_eureka", "The legend says King Hiero of Syracuse asked Archimedes whether a new crown was pure gold. Gold is so dense that a crown mixed with silver would need a larger volume for the same mass. Archimedes could have measured the crown's volume by the water it pushed aside, or, more precisely, weighed it under water: a smaller apparent loss of weight means a smaller volume and a denser metal. The story of him running naked through the streets shouting \"Eureka!\" comes from a writer two centuries later.")}
      </Callout>

      <H3>{tx(t, "phFlu_tensionTitle", "Surface tension")}</H3>
      <p>
        {tx(t, "phFlu_tensionBody",
          "At the surface of a liquid, molecules are pulled sideways and inwards by their neighbours but not outwards, so the surface behaves like a stretched skin. That surface tension makes small drops round (a sphere has the least surface for its volume), lets water striders and a carefully placed steel needle rest on water, and pulls water up narrow glass tubes and the fine channels of paper towels and plants (capillary action). It matters for small things; for anything much bigger than a few millimetres, gravity and pressure win.")}
      </p>

      <H2>{tx(t, "phFlu_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "phFlu_ex1", "1. At the bottom of a 2.5 m pool, the water adds ρ g h = 1000 × 9.81 × 2.5 = 24.5 kPa. The absolute pressure is 101.3 + 24.5 = 125.8 kPa.")}</p>
      <p>{tx(t, "phFlu_ex2", "2. A diver at 10 m: the extra 98 kPa on an eardrum of about 0.5 cm² (5 × 10⁻⁵ m²) is a force of 4.9 N, like a half-kilogram weight. That is why divers equalise the pressure in their ears.")}</p>
      <p>{tx(t, "phFlu_ex3", "3. On Everest the air pressure is about 33 kPa. A mercury barometer there reads h = 33 000 / (13 600 × 9.81) = 0.25 m, a third of the sea-level 760 mm.")}</p>
      <p>{tx(t, "phFlu_ex4", "4. An aluminium cube 20 cm on a side (8 litres) weighs 2 700 × 9.81 × 0.008 = 212 N. Under water it displaces 8 kg of water, so B = 78.5 N, and a spring scale holding it reads 133 N.")}</p>
      <p>{tx(t, "phFlu_ex5", "5. A pine block floats in fresh water with 500/1000 = half its volume under. In sea water, 500/1025 = 49% is under: it floats slightly higher.")}</p>

      <H2>{tx(t, "phFlu_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "phFlu_tWrong", "Wrong"), tx(t, "phFlu_tRight", "Right"), tx(t, "phFlu_tWhy", "Why")]}
        rows={[
          [tx(t, "phFlu_m1w", "more water above means more pressure"), tx(t, "phFlu_m1r", "only the depth matters"), tx(t, "phFlu_m1", "p = p₀ + ρ g h; the area cancels in the derivation")],
          [tx(t, "phFlu_m2w", "pressure pushes only downwards"), tx(t, "phFlu_m2r", "equally in every direction"), tx(t, "phFlu_m2", "that is why it pushes sideways on dams and upwards on boats")],
          [tx(t, "phFlu_m3w", "a hydraulic press creates energy"), tx(t, "phFlu_m3r", "it trades distance for force"), tx(t, "phFlu_m3", "F₁ d₁ = F₂ d₂")],
          [tx(t, "phFlu_m4w", "buoyancy grows with depth"), tx(t, "phFlu_m4r", "constant once fully under"), tx(t, "phFlu_m4", "the pressure rises equally on the top and the bottom")],
          [tx(t, "phFlu_m5w", "heavy things sink, light things float"), tx(t, "phFlu_m5r", "compare densities"), tx(t, "phFlu_m5", "a 50 000-tonne ship floats, a 1 g pebble sinks")],
          [tx(t, "phFlu_m6w", "forgetting p₀"), tx(t, "phFlu_m6r", "say gauge or absolute"), tx(t, "phFlu_m6", "a tyre at \"2 bar\" holds 3 bar absolute")],
        ]}
      />

      <KeyIdeas t={t} id="phFlu" items={[
        "Density ρ = m/V; pressure p = F/A, in pascals, acting equally in every direction at a point.",
        "In a liquid at rest p = p₀ + ρ g h: the pressure depends only on depth, so connected vessels fill to one level.",
        "Atmospheric pressure, about 101 kPa, holds up 760 mm of mercury or 10.3 m of water.",
        "Pascal: extra pressure spreads through a sealed liquid; a hydraulic press multiplies force by A₂/A₁ and divides the distance by the same factor.",
        "Archimedes: the buoyant force equals the weight of the fluid displaced, B = ρ_fluid g V.",
        "An object floats if it is less dense than the fluid, with the fraction ρ_obj/ρ_fluid of its volume under the surface.",
      ]} />
    </Article>
  );
}
