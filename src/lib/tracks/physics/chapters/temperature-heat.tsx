"use client";

// Fluids & Heat 3: temperature and heat — thermal equilibrium and the zeroth
// law, the Celsius, Fahrenheit and Kelvin scales, absolute zero; thermal
// expansion and the anomaly of water; heat as energy in transit (Joule);
// specific heat Q = m c ΔT, latent heat Q = m L, calorimetry; how heat
// travels: conduction (Fourier's law, the heat equation), convection,
// radiation (Stefan–Boltzmann, Wien), and Newton's law of cooling.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { HeatingCurveFigure } from "@/components/lesson/figures/physics/HeatingCurveFigure";
import { ConductionFigure } from "@/components/lesson/figures/physics/ConductionFigure";

const r = String.raw;
const num = (v: number, d = 1) => String(+v.toFixed(d)).replace("-", "−");

// ── Live formulas: the numbers plugged in ─────────────────────────────────────

/** Kettle: time to heat m kg of water by ΔT with a heater of P watts (no losses). */
const kettleNumbers = (t: TrackTranslations) => (v: Record<string, number>) => {
  const Q = v.m * 4186 * v.dT, time = Q / v.P;
  return {
    tex: r`t = \frac{m c \Delta T}{P} = \frac{${num(v.m, 2)} \times 4186 \times ${num(v.dT, 0)}}{${num(v.P, 0)}} = \amber{${num(time, 0)}\ \text{s}}`,
    meter: Math.min(1, time / 900), meterLabel: `${num(time / 60, 1)} min · Q = ${num(Q / 1000, 0)} kJ ${tx(t, "phHeat_liveKcal", "or")} ${num(Q / 4186, 0)} kcal`,
  };
};

export function TemperatureHeatContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "phHeat_intro",
          "Hot and cold are among our oldest sensations, but what are they? For a long time heat was thought to be an invisible fluid, \"caloric\", that flowed out of hot things into cold ones. In the 1840s James Joule showed that heat is energy: stirring water warms it by exactly as much as the work done stirring. This chapter separates three ideas that everyday language mixes up, temperature, heat and internal energy, and follows heat as it warms things, melts and boils them, and travels from place to place.")}
      </Lead>

      <Goals t={t} id="phHeat" items={[
        "Explain what a thermometer measures and convert between Celsius, Fahrenheit and kelvin.",
        "Calculate thermal expansion and explain why water behaves strangely near 4 °C.",
        "Use Q = m c ΔT and Q = m L, and find the final temperature of a mixture.",
        "Describe conduction, convection and radiation, and use Fourier's and Stefan–Boltzmann's laws.",
      ]} />

      <H2>{tx(t, "phHeat_tempTitle", "Temperature")}</H2>
      <p>
        {tx(t, "phHeat_tempBody",
          "Put a hot spoon into cold water and wait: the spoon cools, the water warms, and eventually nothing changes any more. The two are in thermal equilibrium, and we say they have the same temperature. Temperature is the property that decides which way heat flows: always from the hotter body to the colder one, until their temperatures are equal. A thermometer works because of a rule so basic that it was named after the others, the zeroth law of thermodynamics: if A and B are each in equilibrium with a third body C (the thermometer), they are in equilibrium with each other. Microscopically, as the next chapter shows, temperature measures the average kinetic energy of the jiggling molecules.")}
      </p>
      <p>
        {tx(t, "phHeat_scaleBody",
          "The Celsius scale puts 0 °C at the freezing point and 100 °C at the boiling point of water at normal air pressure. The Fahrenheit scale, still used in the United States, puts them at 32 °F and 212 °F, so a Celsius degree is 1.8 Fahrenheit degrees. Physics uses the Kelvin scale. Its degrees are the same size as Celsius degrees, but its zero is absolute zero, −273.15 °C, the temperature at which the molecules have the least possible energy and nothing can be colder. Temperatures in kelvin are never negative, and they appear in every formula of the next chapter.")}
      </p>
      <Equation label={tx(t, "phHeat_eqScales", "Temperature scales")}
        where={[
          [r`T`, tx(t, "phHeat_wT", "the absolute temperature, in kelvin (K, with no degree sign)")],
          [r`T_C`, tx(t, "phHeat_wTc", "the temperature in degrees Celsius")],
          [r`T_F`, tx(t, "phHeat_wTf", "the temperature in degrees Fahrenheit")],
        ]}>
        {r`T = T_C + 273.15 \qquad T_F = \tfrac95\, T_C + 32`}
      </Equation>
      <LessonTable
        headers={[tx(t, "phHeat_tWhat", "What"), "K", "°C", "°F"]}
        rows={[
          [tx(t, "phHeat_s1", "absolute zero"), "0", "−273.15", "−459.67"],
          [tx(t, "phHeat_s2", "nitrogen boils"), "77", "−196", "−321"],
          [tx(t, "phHeat_s3", "water freezes"), "273.15", "0", "32"],
          [tx(t, "phHeat_s4", "human body"), "310", "37", "98.6"],
          [tx(t, "phHeat_s5", "water boils (sea level)"), "373.15", "100", "212"],
          [tx(t, "phHeat_s6", "surface of the Sun"), "≈ 5 800", "≈ 5 500", "≈ 10 000"],
        ]}
      />

      <H2>{tx(t, "phHeat_expTitle", "Thermal expansion")}</H2>
      <p>
        {tx(t, "phHeat_expBody",
          "Most things grow when they warm up: their molecules jiggle harder and push one another a little farther apart. For a solid, the change in length is proportional to the length and to the change in temperature.")}
      </p>
      <Equation label={tx(t, "phHeat_eqExp", "Linear thermal expansion")}
        where={[
          [r`\Delta L`, tx(t, "phHeat_wDL", "the change in length (m)")],
          [r`\alpha`, tx(t, "phHeat_wAlpha", "the coefficient of linear expansion of the material (1/K)")],
          [r`L`, tx(t, "phHeat_wL", "the original length (m)")],
          [r`\Delta T`, tx(t, "phHeat_wDT", "the change in temperature (K, or °C: the steps are the same size)")],
        ]}
        note={tx(t, "phHeat_expNote", "Volumes grow by ΔV = β V ΔT, and for a solid β ≈ 3α, since all three dimensions grow. Steel has α = 12 × 10⁻⁶ /K: a 1 km steel bridge grows by 12 × 10⁻⁶ × 1000 × 40 = 0.48 m between a winter and a summer day 40 °C apart. That is why bridges have expansion joints and railway tracks are laid with gaps or under tension.")}>
        {r`\Delta L = \alpha\, L\, \Delta T`}
      </Equation>
      <LessonTable
        headers={[tx(t, "phHeat_tMat", "Material"), tx(t, "phHeat_tAlpha", "α (per K)")]}
        rows={[
          [tx(t, "phHeat_e1", "borosilicate glass (Pyrex)"), "3.3 × 10⁻⁶"],
          [tx(t, "phHeat_e2", "ordinary glass"), "9 × 10⁻⁶"],
          [tx(t, "phHeat_e3", "steel, concrete"), "12 × 10⁻⁶"],
          [tx(t, "phHeat_e4", "aluminium"), "23 × 10⁻⁶"],
        ]}
      />
      <p>
        {tx(t, "phHeat_expBody2",
          "Steel and concrete happen to expand almost equally, which is why reinforced concrete does not crack itself apart. A bimetallic strip, two metals with different α bonded together, bends when it warms because one side grows more: old thermostats and toasters use it as a switch. A thick ordinary glass cracks if boiling water is poured in, because its inside expands before its outside; Pyrex, with a third of the expansion, survives.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "phHeat_water", "Water is a famous exception. Cooled below 4 °C, it expands instead of shrinking, because its molecules begin to line up into the open, hexagonal pattern of ice. So water is densest at 4 °C, and ice, 9% less dense, floats. In winter a lake's surface water cools, sinks, and is replaced by warmer water from below, until the whole lake is at 4 °C; after that, colder water stays on top and freezes, and the ice layer insulates the water beneath. Lakes freeze from the top down, and fish survive the winter in 4 °C water at the bottom.")}
      </Callout>

      <H2>{tx(t, "phHeat_heatTitle", "Heat is energy in transit")}</H2>
      <p>
        {tx(t, "phHeat_heatBody",
          "In 1845 Joule let falling weights turn a paddle wheel inside an insulated tank of water and measured the water warm up: 4.19 joules of work always produced the same warming as one calorie of heat, the heat that warms 1 g of water by 1 °C. Heat and work are two ways of transferring energy. Three words need keeping apart. Internal energy is the energy a body contains in the random motion and interactions of its molecules. Heat Q is energy transferred because of a temperature difference. Temperature is what decides the direction of that transfer. A bathtub of warm water has far more internal energy than a cup of boiling tea, yet heat flows from the tea into the bath.")}
      </p>
      <p>
        {tx(t, "phHeat_calBody",
          "1 calorie (cal) = 4.186 J. The \"Calories\" on food labels are kilocalories: a 250 kcal snack contains about a million joules, enough, in principle, to lift a 70 kg person 1.5 km up a mountain (in practice the body turns only about a quarter of it into work).")}
      </p>

      <H2>{tx(t, "phHeat_cTitle", "Warming things up: specific heat")}</H2>
      <p>
        {tx(t, "phHeat_cBody",
          "Heat a pan of water and an empty iron pan of the same mass on the same burner: the iron gets too hot to touch in seconds, the water takes minutes. Each substance needs its own amount of heat to warm 1 kg by 1 K, its specific heat capacity c.")}
      </p>
      <Equation label={tx(t, "phHeat_eqQ", "Heat and temperature change")}
        where={[
          [r`Q`, tx(t, "phHeat_wQ", "the heat added (J); negative if heat is removed")],
          [r`m`, tx(t, "phHeat_wM", "the mass (kg)")],
          [r`c`, tx(t, "phHeat_wC", "the specific heat capacity of the substance (J/(kg·K))")],
          [r`\Delta T`, tx(t, "phHeat_wDT2", "the change in temperature (K)")],
        ]}
        words={tx(t, "phHeat_qWords", "The heat needed grows with the mass, with how much warmer it gets, and with the material's appetite for heat.")}>
        {r`Q = m\, c\, \Delta T`}
      </Equation>
      <LessonTable
        headers={[tx(t, "phHeat_tSub", "Substance"), tx(t, "phHeat_tC", "c (J/(kg·K))")]}
        rows={[
          [tx(t, "phHeat_c1", "water"), "4 186"],
          [tx(t, "phHeat_c2", "ice"), "2 100"],
          [tx(t, "phHeat_c3", "air (at constant pressure)"), "1 005"],
          [tx(t, "phHeat_c4", "aluminium"), "900"],
          [tx(t, "phHeat_c5", "sand, rock"), "≈ 800"],
          [tx(t, "phHeat_c6", "iron"), "450"],
          [tx(t, "phHeat_c7", "copper"), "385"],
        ]}
      />
      <p>
        {tx(t, "phHeat_cBody2",
          "Water's specific heat is unusually large: kilogram for kilogram it stores five times as much heat per degree as rock. That is why the sea warms slowly in summer and cools slowly in winter, why coastal climates are mild, and why water is used in car radiators and hot-water bottles.")}
      </p>
      <LiveFormula label={tx(t, "phHeat_liveKettle", "Try it: how long does the kettle take?")}
        tex={r`t = \frac{Q}{P} = \frac{m\, c\, \Delta T}{P}`}
        vars={[
          { id: "m", label: tx(t, "phHeat_liveM", "water (kg = L)"), min: 0.1, max: 2, step: 0.05, value: 1, fmt: v => `${num(v, 2)} kg` },
          { id: "dT", label: "ΔT (K)", min: 5, max: 90, step: 1, value: 80, fmt: v => `${num(v, 0)} K` },
          { id: "P", label: "P (W)", min: 500, max: 3000, step: 50, value: 2000, fmt: v => `${num(v, 0)} W` },
        ]}
        compute={kettleNumbers(t)}
        note={tx(t, "phHeat_liveKettleNote", "1 litre from 20 °C to 100 °C needs 335 kJ; a 2 kW kettle supplies that in 2.8 minutes, if no heat escapes (a real kettle loses perhaps 10–20% to the air and its own body). Half the water takes half the time, which is why boiling only what you need saves energy.")} />

      <H3>{tx(t, "phHeat_latentTitle", "Melting and boiling: latent heat")}</H3>
      <p>
        {tx(t, "phHeat_latentBody",
          "Heat a glass of ice water and its temperature stays at 0 °C until the last bit of ice has melted. The heat is going into breaking the bonds that hold the ice crystal together, not into speeding up molecules. The heat needed to change the phase of 1 kg, without changing its temperature, is the latent heat L (latent means \"hidden\": the thermometer does not show it): Q = m L. For water, melting takes L_f = 334 kJ/kg and boiling L_v = 2 256 kJ/kg. Freezing and condensing give the same amounts back.")}
      </p>
      <HeatingCurveFigure t={t} />
      <p>
        {tx(t, "phHeat_latentBody2",
          "Boiling's large latent heat explains several things. Sweating cools you: each litre of sweat that evaporates from the skin carries away about 2.4 MJ. A scald from steam at 100 °C is far worse than one from water at 100 °C, because the steam releases 2 256 kJ/kg as it condenses on the skin before it even starts to cool. And farmers spray orchards with water on frosty nights: as it freezes on the buds it releases its latent heat and holds them at 0 °C, safely above the damaging temperatures.")}
      </p>

      <H3>{tx(t, "phHeat_mixTitle", "Mixing: calorimetry")}</H3>
      <p>
        {tx(t, "phHeat_mixBody",
          "When hot and cold things are put together in an insulated container, energy is conserved: the heat given up by the hot ones equals the heat taken by the cold ones. That is enough to find the final temperature.")}
      </p>
      <Derivation t={t} label={tx(t, "phHeat_eqMix", "Final temperature of a mixture")}
        steps={[
          { tex: r`m_1 c_1 (T_1 - T) = m_2 c_2 (T - T_2)`, why: tx(t, "phHeat_x1", "heat lost by the hot body (from T₁ down to T) = heat gained by the cold one (from T₂ up to T)") },
          { tex: r`m_1 c_1 T_1 + m_2 c_2 T_2 = (m_1 c_1 + m_2 c_2)\, T`, why: tx(t, "phHeat_x2", "multiply out and gather the terms with T") },
          { tex: r`\green{T = \frac{m_1 c_1 T_1 + m_2 c_2 T_2}{m_1 c_1 + m_2 c_2}}`, why: tx(t, "phHeat_x3", "a weighted average of the temperatures, each weighted by its m c") },
        ]} />
      <p>
        {tx(t, "phHeat_mixBody2",
          "200 g of coffee at 90 °C plus 50 g of milk at 5 °C (both roughly water): T = (0.2 × 90 + 0.05 × 5) / 0.25 = 73 °C. If one of the substances changes phase, add its latent heat. Drop 50 g of ice at 0 °C into 300 g of water at 25 °C: melting the ice takes 0.05 × 334 000 = 16.7 kJ, while cooling the water all the way to 0 °C would release 31.4 kJ, so all the ice melts. Then 0.3 × 4186 × (25 − T) = 16 700 + 0.05 × 4186 × T gives T = 10 °C.")}
      </p>

      <H2>{tx(t, "phHeat_travelTitle", "How heat travels")}</H2>
      <H3>{tx(t, "phHeat_condTitle", "Conduction")}</H3>
      <p>
        {tx(t, "phHeat_condBody",
          "Hold one end of a metal rod in a flame and the other end soon gets hot, although nothing moves along the rod. Fast-jiggling atoms at the hot end bump into their neighbours and pass on energy; in metals, free electrons carry it much faster still. The rate of heat flow through a slab is set by its material, its area, its thickness and the temperature difference across it: Joseph Fourier's law (1822).")}
      </p>
      <Equation label={tx(t, "phHeat_eqFourier", "Fourier's law of conduction")}
        where={[
          [r`P`, tx(t, "phHeat_wP", "the rate of heat flow (W = J/s)")],
          [r`k`, tx(t, "phHeat_wK", "the thermal conductivity of the material (W/(m·K))")],
          [r`A`, tx(t, "phHeat_wA", "the area the heat flows through (m²)")],
          [r`\Delta T`, tx(t, "phHeat_wDT3", "the temperature difference between the two faces (K)")],
          [r`L`, tx(t, "phHeat_wLc", "the thickness of the slab (m)")],
        ]}
        note={tx(t, "phHeat_fourierNote", "Before the flow settles, the temperature inside changes with time according to the heat equation, ∂T/∂t = D ∂²T/∂x², with D = k/(ρc) the thermal diffusivity (solved in the Math track's chapter on partial differential equations, and in the figure below).")}>
        {r`P = \frac{k\, A\, \Delta T}{L}`}
      </Equation>
      <LessonTable
        headers={[tx(t, "phHeat_tMat2", "Material"), tx(t, "phHeat_tK", "k (W/(m·K))")]}
        rows={[
          [tx(t, "phHeat_k1", "copper"), "401"],
          [tx(t, "phHeat_k2", "aluminium"), "237"],
          [tx(t, "phHeat_k3", "steel"), "50"],
          [tx(t, "phHeat_k4", "glass"), "1.0"],
          [tx(t, "phHeat_k5", "water"), "0.6"],
          [tx(t, "phHeat_k6", "wood"), "0.15"],
          [tx(t, "phHeat_k7", "glass wool, polystyrene foam"), "≈ 0.04"],
          [tx(t, "phHeat_k8", "still air"), "0.025"],
        ]}
      />
      <ConductionFigure t={t} />
      <p>
        {tx(t, "phHeat_condBody2",
          "This is why a tiled floor feels colder than a wooden one in the same room, at the same temperature: tile conducts heat out of your foot faster. Good insulators work by trapping still air, which conducts badly, in small pockets where it cannot circulate: wool, feathers, foam, double glazing. A 10 m² wall with 10 cm of insulation (k = 0.04) and 20 °C between inside and out loses only 10 × 0.04 × 20 / 0.1 = 80 W.")}
      </p>
      <H3>{tx(t, "phHeat_convTitle", "Convection")}</H3>
      <p>
        {tx(t, "phHeat_convBody",
          "In fluids, heat also travels by convection: the warm fluid itself moves and carries its energy along. Air above a radiator warms, expands, becomes less dense and rises (buoyancy, from the fluids chapter); cooler air flows in to replace it, and a circulating current spreads the heat round the room. On sunny days the land warms faster than the sea, air rises over it and cool air flows in from the water: a sea breeze. Convection churns the outer third of the Sun and the Earth's mantle. Forced convection, with a fan or a pump, is what makes a wind feel colder than still air at the same temperature.")}
      </p>
      <H3>{tx(t, "phHeat_radTitle", "Radiation")}</H3>
      <p>
        {tx(t, "phHeat_radBody",
          "The Sun's heat crosses 150 million kilometres of empty space, so neither conduction nor convection can carry it. Every object emits electromagnetic radiation simply because it has a temperature, and the power grows extremely fast with temperature: Josef Stefan found the fourth-power law in 1879 and Ludwig Boltzmann derived it.")}
      </p>
      <Equation label={tx(t, "phHeat_eqSB", "The Stefan–Boltzmann law")}
        where={[
          [r`P`, tx(t, "phHeat_wPr", "the power radiated (W)")],
          [r`e`, tx(t, "phHeat_wE", "the emissivity, from 0 (a perfect mirror) to 1 (a perfect absorber, a \"black body\")")],
          [r`\sigma`, tx(t, "phHeat_wSigma", "the Stefan–Boltzmann constant, 5.67 × 10⁻⁸ W/(m²·K⁴)")],
          [r`A`, tx(t, "phHeat_wAr", "the surface area (m²)")],
          [r`T`, tx(t, "phHeat_wTr", "the absolute temperature of the surface (K)")],
        ]}
        words={tx(t, "phHeat_sbWords", "Twice the absolute temperature radiates sixteen times the power.")}
        note={tx(t, "phHeat_sbNote", "Objects also absorb radiation from their surroundings, so the net loss is e σ A (T⁴ − T_surr⁴). Your skin, at about 306 K, radiates about 870 W from 1.8 m² and absorbs about 730 W from walls at 20 °C: a net loss of around 140 W, more than your conduction and convection losses indoors. Hotter objects also glow at shorter wavelengths: the peak is at λ = 2.9 mm·K / T (Wien's law), in the infrared at 10 µm for you, and in visible green-yellow light for the Sun's 5 800 K.")}>
        {r`P = e\, \sigma\, A\, T^4`}
      </Equation>
      <p>
        {tx(t, "phHeat_coolBody",
          "Put all three together and a simple rule often describes how a hot object cools: the rate of heat loss is roughly proportional to its temperature difference with the surroundings, Newton's law of cooling. The difference then shrinks exponentially, like the damped oscillator's envelope: a cup of tea at 80 °C in a 20 °C room might drop to 50 °C in 15 minutes (halving the 60 °C difference), to 35 °C after 30 minutes, and so on, approaching the room's temperature but taking longer and longer to get close.")}
      </p>

      <H2>{tx(t, "phHeat_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "phHeat_ex1", "1. A fever of 104 °F is (104 − 32) / 1.8 = 40 °C, or 313 K.")}</p>
      <p>{tx(t, "phHeat_ex2", "2. An aluminium rod 2 m long warms by 50 °C: ΔL = 23 × 10⁻⁶ × 2 × 50 = 2.3 mm.")}</p>
      <p>{tx(t, "phHeat_ex3", "3. A 1.5 kg iron pan from 20 °C to 220 °C: Q = 1.5 × 450 × 200 = 135 kJ, the heat that would warm only 0.4 kg of water by the same 80 °C that a kettle does.")}</p>
      <p>{tx(t, "phHeat_ex4", "4. A freezer must remove heat to turn 1 kg of water at 20 °C into ice at −18 °C: 1 × 4186 × 20 + 1 × 334 000 + 1 × 2100 × 18 = 83.7 + 334 + 37.8 = 455 kJ, three quarters of it to freeze the water.")}</p>
      <p>{tx(t, "phHeat_ex5", "5. A window of 1.5 m² made of 4 mm glass with 15 °C across the glass itself would let through 1.0 × 1.5 × 15 / 0.004 = 5 600 W. Real single windows lose far less, because thin layers of still air on each surface do most of the insulating, and double glazing adds a whole layer of trapped air.")}</p>

      <H2>{tx(t, "phHeat_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "phHeat_tWrong", "Wrong"), tx(t, "phHeat_tRight", "Right"), tx(t, "phHeat_tWhy", "Why")]}
        rows={[
          [tx(t, "phHeat_m1w", "heat and temperature are the same"), tx(t, "phHeat_m1r", "heat is energy moved; temperature sets the direction"), tx(t, "phHeat_m1", "a bath holds more energy than a cup of hot tea, but the tea is hotter")],
          [tx(t, "phHeat_m2w", "a body contains heat"), tx(t, "phHeat_m2r", "it contains internal energy"), tx(t, "phHeat_m2", "heat is a transfer, like work")],
          [tx(t, "phHeat_m3w", "adding heat always raises the temperature"), tx(t, "phHeat_m3r", "not during melting or boiling"), tx(t, "phHeat_m3", "the latent heat goes into changing phase")],
          [tx(t, "phHeat_m4w", "metal is colder than wood in the same room"), tx(t, "phHeat_m4r", "same temperature, faster conduction"), tx(t, "phHeat_m4", "metal draws heat from your hand faster")],
          [tx(t, "phHeat_m5w", "using °C in T⁴"), tx(t, "phHeat_m5r", "kelvin"), tx(t, "phHeat_m5", "absolute temperatures only; 0 °C is not zero energy")],
          [tx(t, "phHeat_m6w", "sweaters make heat"), tx(t, "phHeat_m6r", "they slow its escape"), tx(t, "phHeat_m6", "trapped air conducts very badly")],
        ]}
      />

      <KeyIdeas t={t} id="phHeat" items={[
        "Temperature decides the direction of heat flow; bodies in thermal equilibrium share a temperature (zeroth law). T(K) = T(°C) + 273.15.",
        "Solids expand by ΔL = α L ΔT; water is densest at 4 °C, so ice floats and lakes freeze from the top.",
        "Heat is energy transferred because of a temperature difference (Joule: 1 cal = 4.186 J).",
        "Q = m c ΔT warms a body; Q = m L changes its phase at constant temperature.",
        "In a mixture, heat lost by the hot parts equals heat gained by the cold ones.",
        "Heat travels by conduction (P = k A ΔT/L), convection (moving fluid) and radiation (P = e σ A T⁴).",
      ]} />
    </Article>
  );
}
