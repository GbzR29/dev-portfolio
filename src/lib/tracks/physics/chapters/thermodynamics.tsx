"use client";

// Fluids & Heat 4: thermodynamics — the ideal gas law; kinetic theory:
// pressure derived from molecules hitting a wall, temperature as average
// kinetic energy, rms speed; the first law ΔU = Q − W, work as the area under
// a p–V curve, the four processes (isobaric, isochoric, isothermal,
// adiabatic); heat engines and efficiency; the Carnot cycle and the limit
// 1 − T_c/T_h derived; the second law, entropy (Q/T and k ln Ω);
// refrigerators and heat pumps; the four laws side by side.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { GasFigure } from "@/components/lesson/figures/physics/GasFigure";
import { CycleFigure } from "@/components/lesson/figures/physics/CycleFigure";

const r = String.raw;
const num = (v: number, d = 1) => String(+v.toFixed(d)).replace("-", "−");

// ── Live formulas: the numbers plugged in ─────────────────────────────────────

/** Adiabatic compression of air (γ = 1.4): T₂ = T₁ r^(γ−1). */
const adiabatNumbers = (t: TrackTranslations) => (v: Record<string, number>) => {
  const T2 = v.T1 * v.r ** 0.4, p2 = v.r ** 1.4;
  return {
    tex: r`T_2 = T_1 \left(\frac{V_1}{V_2}\right)^{\gamma - 1} = ${num(v.T1, 0)} \times ${num(v.r, 1)}^{0.4} = \amber{${num(T2, 0)}\ \text{K}}`,
    meter: Math.min(1, T2 / 1300), meterLabel: `${num(T2 - 273.15, 0)} °C · ${tx(t, "phTherm_livePress", "pressure ×")} ${num(p2, 1)}${T2 > 530 ? ` · ${tx(t, "phTherm_liveDiesel", "hot enough to ignite diesel fuel")}` : ""}`,
  };
};

export function ThermodynamicsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "phTherm_intro",
          "Thermodynamics began with a practical question: how much work can a steam engine get out of a tonne of coal? The answer turned out to reach far beyond engines. It explains why a bicycle pump gets hot, why a refrigerator needs to be plugged in, why no engine can ever be perfect, and why time seems to run in only one direction. This chapter first looks inside a gas, at the molecules whose motion is the heat, then states the laws of thermodynamics and follows them to the best engine allowed by nature.")}
      </Lead>

      <Goals t={t} id="phTherm" items={[
        "Use the ideal gas law, and explain pressure and temperature in terms of moving molecules.",
        "Apply the first law, ΔU = Q − W, to the four basic processes, with work as an area on a p–V diagram.",
        "Explain how a heat engine works and derive the Carnot limit on its efficiency.",
        "State the second law, use entropy, and explain refrigerators and heat pumps.",
      ]} />

      <H2>{tx(t, "phTherm_gasTitle", "The ideal gas law")}</H2>
      <p>
        {tx(t, "phTherm_gasBody",
          "Three experimental rules about gases were found between 1662 and 1802. Squeeze a gas at constant temperature and its pressure rises in proportion: p V stays constant (Boyle). Warm it at constant pressure and its volume grows in proportion to the absolute temperature (Charles). Warm it in a closed rigid box and its pressure grows in proportion to the absolute temperature (Gay-Lussac). All three, plus the amount of gas, fit into a single law.")}
      </p>
      <Equation label={tx(t, "phTherm_eqGas", "The ideal gas law")}
        where={[
          [r`p`, tx(t, "phTherm_wP", "the pressure (Pa)")],
          [r`V`, tx(t, "phTherm_wV", "the volume (m³)")],
          [r`n`, tx(t, "phTherm_wN", "the amount of gas in moles; one mole is 6.022 × 10²³ molecules (Avogadro's number N_A)")],
          [r`R`, tx(t, "phTherm_wR", "the gas constant, 8.314 J/(mol·K)")],
          [r`T`, tx(t, "phTherm_wT", "the absolute temperature (K)")],
          [r`N,\ k`, tx(t, "phTherm_wNk", "the number of molecules, and Boltzmann's constant k = R/N_A = 1.381 × 10⁻²³ J/K")],
        ]}
        words={tx(t, "phTherm_gasWords", "Pressure times volume is fixed by how many molecules there are and how hot they are.")}
        note={tx(t, "phTherm_gasNote", "An ideal gas is one whose molecules are tiny compared with the space between them and do not attract each other. Air at everyday conditions is very close to ideal. One mole of any ideal gas at 0 °C and 1 atm fills 22.4 litres, whatever the gas. A room of 50 m³ at 20 °C holds n = p V / (R T) = 2 080 mol of air, which at 29 g/mol is 60 kg.")}>
        {r`p V = n R T = N k T`}
      </Equation>

      <H2>{tx(t, "phTherm_kinTitle", "Inside the gas: kinetic theory")}</H2>
      <p>
        {tx(t, "phTherm_kinBody",
          "Why should a gas push on its container at all? Because its molecules are flying about at hundreds of metres per second and bouncing off the walls. Each bounce gives the wall a tiny push; billions of billions of them every second add up to a steady pressure. Daniel Bernoulli worked this out in 1738, and it can be made exact with nothing more than Newton's laws.")}
      </p>
      <Derivation t={t} label={tx(t, "phTherm_eqKin", "Pressure from molecules")}
        steps={[
          { tex: r`\Delta p_x = 2 m v_x`, why: tx(t, "phTherm_k1", "a molecule of mass m hits the wall of a cube of side L and bounces back: its momentum across the wall reverses") },
          { tex: r`F = \frac{2 m v_x}{2L / v_x} = \frac{m v_x^2}{L}`, why: tx(t, "phTherm_k2", "it returns to that wall every 2L / v_x seconds: average force = momentum per hit ÷ time between hits") },
          { tex: r`p = \frac{F_{total}}{L^2} = \frac{N m \langle v_x^2 \rangle}{V}`, why: tx(t, "phTherm_k3", "add up N molecules (⟨ ⟩ means the average over them) and divide by the wall's area; L³ = V") },
          { tex: r`p V = \tfrac13 N m \langle v^2 \rangle = \tfrac23 N \langle \tfrac12 m v^2 \rangle`, why: tx(t, "phTherm_k4", "no direction is special, so ⟨v_x²⟩ is a third of ⟨v²⟩ = ⟨v_x² + v_y² + v_z²⟩") },
          { tex: r`\green{\langle \tfrac12 m v^2 \rangle = \tfrac32\, k T}`, why: tx(t, "phTherm_k5", "compare with p V = N k T: the average kinetic energy of a molecule is set by the temperature alone") },
        ]} />
      <p>
        {tx(t, "phTherm_kinBody2",
          "This is what temperature means: a measure of the average kinetic energy of the molecules. At absolute zero, that motion would be as small as quantum physics allows. The typical speed, the root-mean-square speed, follows: v_rms = √(3kT/m) = √(3RT/M), with M the molar mass. Nitrogen at room temperature (300 K, M = 0.028 kg/mol) gives √(3 × 8.314 × 300 / 0.028) = 517 m/s, faster than sound, which is carried by these same molecules. Lighter molecules move faster at the same temperature: hydrogen at 1 900 m/s, fast enough that the Earth's gravity has lost most of it to space over billions of years. For a gas of single atoms, all the internal energy is this motion: U = 3/2 n R T.")}
      </p>
      <GasFigure t={t} />

      <H2>{tx(t, "phTherm_firstTitle", "The first law: energy is conserved")}</H2>
      <p>
        {tx(t, "phTherm_firstBody",
          "A gas can gain energy in two ways: by being heated, or by having work done on it. It can lose energy by giving off heat or by doing work, for instance pushing a piston out. The first law of thermodynamics is energy conservation written for these transfers.")}
      </p>
      <Equation label={tx(t, "phTherm_eqFirst", "The first law of thermodynamics")}
        where={[
          [r`\Delta U`, tx(t, "phTherm_wU", "the change in internal energy of the gas (J)")],
          [r`Q`, tx(t, "phTherm_wQ", "the heat added to the gas (J); negative if heat leaves")],
          [r`W`, tx(t, "phTherm_wW", "the work done by the gas on its surroundings (J); negative if work is done on it")],
        ]}
        words={tx(t, "phTherm_firstWords", "The energy a gas gains is the heat put in minus the work it does.")}
        note={tx(t, "phTherm_firstNote", "Some books write ΔU = Q + W with W the work done on the gas; it is the same law with the opposite sign for W. U depends only on the state of the gas (for an ideal gas, only on T), but Q and W depend on how you get from one state to another.")}>
        {r`\Delta U = Q - W`}
      </Equation>
      <p>
        {tx(t, "phTherm_workBody",
          "When a gas at pressure p pushes a piston of area A out by a small distance Δx, it does work F Δx = p A Δx = p ΔV. Over a whole change of volume, the work is the sum of all these slices, W = ∫ p dV (an integral, from the Math track): the area under the curve on a pressure–volume diagram. Expanding, the gas does positive work; compressed, work is done on it.")}
      </p>
      <H3>{tx(t, "phTherm_procTitle", "Four basic processes")}</H3>
      <LessonTable
        headers={[tx(t, "phTherm_tProc", "Process"), tx(t, "phTherm_tFixed", "What stays fixed"), "W", tx(t, "phTherm_tFirst", "First law")]}
        rows={[
          [tx(t, "phTherm_p1", "isobaric"), tx(t, "phTherm_p1f", "pressure"), "p ΔV", "Q = ΔU + p ΔV"],
          [tx(t, "phTherm_p2", "isochoric"), tx(t, "phTherm_p2f", "volume"), "0", "Q = ΔU"],
          [tx(t, "phTherm_p3", "isothermal"), tx(t, "phTherm_p3f", "temperature"), "n R T ln(V₂/V₁)", "ΔU = 0, Q = W"],
          [tx(t, "phTherm_p4", "adiabatic"), tx(t, "phTherm_p4f", "no heat flows (Q = 0); p V^γ is constant"), "−ΔU", "W = −ΔU"],
        ]}
      />
      <p>
        {tx(t, "phTherm_adiaBody",
          "In an adiabatic process, insulated or simply too fast for heat to flow, all the work goes into or comes out of the internal energy. So squeezing a gas quickly heats it, and letting it expand quickly cools it. The exponent γ (gamma) is the ratio of the gas's specific heats at constant pressure and constant volume: 5/3 for gases of single atoms like helium, 7/5 for air. Combining p V^γ = constant with p V = n R T gives T V^(γ−1) = constant. A bicycle pump warms as you pump; a spray can gets cold as the gas inside expands; and a diesel engine needs no spark plug, because squeezing air to a twentieth of its volume heats it enough to ignite the fuel sprayed in.")}
      </p>
      <LiveFormula label={tx(t, "phTherm_liveAdia", "Try it: squeeze air quickly")}
        tex={r`T_2 = T_1 \left(\frac{V_1}{V_2}\right)^{\gamma - 1}, \quad \gamma = 1.4`}
        vars={[
          { id: "T1", label: "T₁ (K)", min: 250, max: 350, step: 1, value: 300, fmt: v => `${num(v, 0)} K` },
          { id: "r", label: "V₁/V₂", min: 1, max: 25, step: 0.5, value: 20, fmt: v => `${num(v, 1)}×` },
        ]}
        compute={adiabatNumbers(t)}
        note={tx(t, "phTherm_liveAdiaNote", "A diesel engine's compression ratio of about 20 takes air from 300 K to about 990 K (720 °C), above the roughly 250 °C at which diesel fuel ignites. A petrol engine compresses only about 10 times, reaching about 750 K, low enough that the fuel waits for the spark.")} />

      <H2>{tx(t, "phTherm_engineTitle", "Heat engines")}</H2>
      <p>
        {tx(t, "phTherm_engineBody",
          "A heat engine turns heat into work by running a gas (or steam) round a cycle, returning to its starting state each time. In every cycle it takes heat Q_h from something hot (burning fuel, a nuclear reactor), does work W, and gives heat Q_c to something cold (the air, a river). Since the gas returns to its start, ΔU = 0 over a cycle and the first law gives W = Q_h − Q_c. The efficiency is what you get divided by what you pay for.")}
      </p>
      <Equation label={tx(t, "phTherm_eqEff", "Efficiency of a heat engine")}
        where={[
          [r`\eta`, tx(t, "phTherm_wEta", "the efficiency (the Greek letter eta), between 0 and 1")],
          [r`W`, tx(t, "phTherm_wWe", "the work done per cycle (J)")],
          [r`Q_h,\ Q_c`, tx(t, "phTherm_wQhc", "the heat taken from the hot side and given to the cold side per cycle (J)")],
        ]}
        note={tx(t, "phTherm_effNote", "Car petrol engines reach 25–35%, diesels up to about 45%, coal and nuclear power stations 33–40%, and the best combined-cycle gas power stations about 60%. The rest leaves as heat in the exhaust and the cooling water.")}>
        {r`\eta = \frac{W}{Q_h} = 1 - \frac{Q_c}{Q_h}`}
      </Equation>
      <H3>{tx(t, "phTherm_carnotTitle", "The best possible engine: Carnot")}</H3>
      <p>
        {tx(t, "phTherm_carnotBody",
          "In 1824 the young French engineer Sadi Carnot asked what limits an engine's efficiency. He imagined an ideal engine with no friction and no heat leaking across temperature differences, running a cycle of two isothermal and two adiabatic steps between a hot reservoir at T_h and a cold one at T_c. For an ideal gas its efficiency can be worked out exactly.")}
      </p>
      <Derivation t={t} label={tx(t, "phTherm_eqCarnot", "The efficiency of a Carnot engine")}
        steps={[
          { tex: r`Q_h = n R T_h \ln\frac{V_2}{V_1}, \qquad Q_c = n R T_c \ln\frac{V_3}{V_4}`, why: tx(t, "phTherm_c1", "on the isotherms ΔU = 0, so the heat equals the work, n R T ln(volume ratio)") },
          { tex: r`T_h V_2^{\gamma-1} = T_c V_3^{\gamma-1}, \qquad T_h V_1^{\gamma-1} = T_c V_4^{\gamma-1}`, why: tx(t, "phTherm_c2", "the two adiabats link the volumes: T V^(γ−1) is constant along each") },
          { tex: r`\frac{V_3}{V_4} = \frac{V_2}{V_1}`, why: tx(t, "phTherm_c3", "divide one adiabat equation by the other: the temperatures cancel") },
          { tex: r`\frac{Q_c}{Q_h} = \frac{T_c}{T_h}`, why: tx(t, "phTherm_c4", "so the logarithms are equal and only the temperatures remain") },
          { tex: r`\green{\eta_{Carnot} = 1 - \frac{T_c}{T_h}}`, why: tx(t, "phTherm_c5", "with absolute temperatures; it does not depend on the gas, the volumes or the size of the engine") },
        ]} />
      <CycleFigure t={t} />
      <p>
        {tx(t, "phTherm_carnotBody2",
          "Carnot proved more: no engine working between the same two temperatures can beat this efficiency, otherwise you could combine it with a Carnot engine running backwards and move heat from cold to hot for free. So the limit is set by the temperatures alone. A power station boiling steam at 565 °C (838 K) and cooling it with river water at 25 °C (298 K) can never exceed 1 − 298/838 = 64%; real ones reach about 40%. To improve an engine, run its hot side hotter or its cold side colder. Even a perfect engine must throw some heat away.")}
      </p>

      <H2>{tx(t, "phTherm_secondTitle", "The second law")}</H2>
      <p>
        {tx(t, "phTherm_secondBody",
          "The first law says energy is conserved. It does not forbid a cup of tea from cooling the room until the tea boils, or a ship from sucking heat out of the sea to drive its propellers. Something else forbids those, the second law of thermodynamics. It has two classic statements, and each implies the other.")}
      </p>
      <LessonTable
        headers={[tx(t, "phTherm_tStmt", "Statement"), tx(t, "phTherm_tSays", "What it says")]}
        rows={[
          [tx(t, "phTherm_st1", "Clausius (1850)"), tx(t, "phTherm_st1s", "heat never flows by itself from a colder body to a hotter one")],
          [tx(t, "phTherm_st2", "Kelvin–Planck"), tx(t, "phTherm_st2s", "no engine working in a cycle can turn heat from a single reservoir entirely into work; some must be given to a colder one")],
        ]}
      />
      <H3>{tx(t, "phTherm_entTitle", "Entropy")}</H3>
      <p>
        {tx(t, "phTherm_entBody",
          "Rudolf Clausius found a quantity that captures the second law in one statement. When a body at temperature T receives a small amount of heat Q reversibly, its entropy S grows by ΔS = Q / T (in J/K). Follow heat Q leaking from a hot body at T_h to a cold one at T_c: the hot body's entropy falls by Q/T_h, the cold body's rises by Q/T_c, and since T_c < T_h the total goes up. Every real process does the same.")}
      </p>
      <Equation label={tx(t, "phTherm_eqEnt", "Entropy and the second law")}
        where={[
          [r`\Delta S`, tx(t, "phTherm_wS", "the change in entropy (J/K)")],
          [r`Q`, tx(t, "phTherm_wQs", "the heat received reversibly (J)")],
          [r`T`, tx(t, "phTherm_wTs", "the absolute temperature at which it is received (K)")],
        ]}
        words={tx(t, "phTherm_entWords", "The total entropy of an isolated system never decreases: it stays the same in an ideal reversible process and grows in every real one.")}
        note={tx(t, "phTherm_entNote", "Melting 1 kg of ice at 273 K raises its entropy by 334 000 / 273 = 1 220 J/K. The Carnot engine is the one that creates no entropy at all: it takes entropy Q_h/T_h from the hot side and delivers exactly the same Q_c/T_c to the cold side, which is another way to see why Q_c/Q_h = T_c/T_h.")}>
        {r`\Delta S = \frac{Q}{T}, \qquad \Delta S_{total} \ge 0`}
      </Equation>
      <p>
        {tx(t, "phTherm_boltzBody",
          "What is entropy, physically? Ludwig Boltzmann's answer is engraved on his tombstone: S = k ln Ω, where Ω (omega) is the number of microscopic arrangements of molecules that look the same from outside. A drop of ink spread through a glass of water can be arranged in vastly more ways than ink gathered in one corner, so random molecular motion carries it from the few ordered arrangements into the overwhelming number of spread-out ones, and essentially never back. The second law is not a force pushing things apart; it is the statistics of enormous numbers. That is also why it gives time a direction: films of eggs breaking look normal, films of eggs reassembling look wrong. A later chapter, on statistical mechanics, builds this idea properly.")}
      </p>
      <H3>{tx(t, "phTherm_fridgeTitle", "Refrigerators and heat pumps")}</H3>
      <p>
        {tx(t, "phTherm_fridgeBody",
          "Run a heat engine backwards and it becomes a refrigerator: by doing work W on a working fluid, it pumps heat Q_c out of a cold place and dumps Q_h = Q_c + W into a warm one. The second law does not forbid heat flowing from cold to hot; it forbids it happening by itself, without work. That is why the back of a fridge is warm. The same machine used to warm a house, taking heat from the cold outdoor air, is a heat pump. Their performance is measured by the coefficient of performance, COP: what you want divided by the work you pay for.")}
      </p>
      <LessonTable
        headers={[tx(t, "phTherm_tMach", "Machine"), tx(t, "phTherm_tCop", "COP"), tx(t, "phTherm_tMax", "Best possible (Carnot)")]}
        rows={[
          [tx(t, "phTherm_f1", "refrigerator"), "Q_c / W", "T_c / (T_h − T_c)"],
          [tx(t, "phTherm_f2", "heat pump"), "Q_h / W", "T_h / (T_h − T_c)"],
        ]}
      />
      <p>
        {tx(t, "phTherm_fridgeBody2",
          "A heat pump keeping a house at 20 °C (293 K) when it is 0 °C (273 K) outside could in principle deliver 293 / 20 = 14.7 joules of heat for every joule of electricity. Real ones manage 3 to 4, which still makes them three to four times better than an electric heater, which turns each joule into exactly one joule of heat. The colder it is outside, the lower the COP, since the heat must be lifted across a larger temperature gap.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "phTherm_laws", "The laws of thermodynamics are often summed up as a game you cannot win. Zeroth: there is a game (temperature is well defined). First: you cannot win (you cannot get out more energy than you put in). Second: you cannot break even (some heat is always lost to the cold side, except at absolute zero). Third: you cannot leave the game (absolute zero cannot be reached in a finite number of steps).")}
      </Callout>

      <H2>{tx(t, "phTherm_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "phTherm_ex1", "1. A car tyre at 2.2 bar gauge (3.2 bar absolute) and 15 °C (288 K) warms on the motorway to 45 °C (318 K). At fixed volume p ∝ T: 3.2 × 318/288 = 3.53 bar absolute, 2.5 bar on the gauge.")}</p>
      <p>{tx(t, "phTherm_ex2", "2. Oxygen molecules (M = 0.032 kg/mol) at 300 K: v_rms = √(3 × 8.314 × 300 / 0.032) = 484 m/s.")}</p>
      <p>{tx(t, "phTherm_ex3", "3. A gas expands at a constant 200 kPa from 2 L to 5 L while 1 000 J of heat is added. W = p ΔV = 200 000 × 0.003 = 600 J, so ΔU = 1 000 − 600 = 400 J: the gas warms.")}</p>
      <p>{tx(t, "phTherm_ex4", "4. One mole of gas expands isothermally at 300 K to twice its volume: W = Q = 8.314 × 300 × ln 2 = 1 730 J, all of the heat turned into work, but only once: to repeat it the gas must be compressed again, and that is where the cold reservoir comes in.")}</p>
      <p>{tx(t, "phTherm_ex5", "5. An engine takes 2 000 J per cycle from a reservoir at 800 K and dumps heat at 300 K. The most work it could do is 2 000 × (1 − 300/800) = 1 250 J per cycle; any claim of more would break the second law.")}</p>

      <H2>{tx(t, "phTherm_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "phTherm_tWrong", "Wrong"), tx(t, "phTherm_tRight", "Right"), tx(t, "phTherm_tWhy", "Why")]}
        rows={[
          [tx(t, "phTherm_m1w", "using °C in p V = n R T"), tx(t, "phTherm_m1r", "kelvin"), tx(t, "phTherm_m1", "p and V are proportional to the absolute temperature")],
          [tx(t, "phTherm_m2w", "temperature is the energy of the gas"), tx(t, "phTherm_m2r", "the average energy per molecule"), tx(t, "phTherm_m2", "a big cold tank can hold more energy than a small hot one")],
          [tx(t, "phTherm_m3w", "an isothermal process has no heat"), tx(t, "phTherm_m3r", "an adiabatic one has no heat"), tx(t, "phTherm_m3", "isothermal: heat flows in to keep T fixed")],
          [tx(t, "phTherm_m4w", "a perfect engine could reach 100%"), tx(t, "phTherm_m4r", "at most 1 − T_c/T_h"), tx(t, "phTherm_m4", "some heat must always go to the cold side")],
          [tx(t, "phTherm_m5w", "a fridge breaks the second law"), tx(t, "phTherm_m5r", "it uses work to do it"), tx(t, "phTherm_m5", "heat flows from cold to hot only with work put in")],
          [tx(t, "phTherm_m6w", "entropy never decreases anywhere"), tx(t, "phTherm_m6r", "the total never decreases"), tx(t, "phTherm_m6", "a freezer lowers the entropy of the water inside while raising the kitchen's more")],
        ]}
      />

      <KeyIdeas t={t} id="phTherm" items={[
        "An ideal gas obeys p V = n R T = N k T, with T in kelvin.",
        "Pressure is molecules hitting the walls; temperature is their average kinetic energy, ⟨½ m v²⟩ = 3/2 k T.",
        "First law: ΔU = Q − W, with W = ∫ p dV the area under the p–V curve; adiabatic squeezing heats a gas.",
        "A heat engine's efficiency is W/Q_h = 1 − Q_c/Q_h, and can never exceed Carnot's 1 − T_c/T_h.",
        "Second law: heat does not flow from cold to hot by itself; the total entropy (ΔS = Q/T, S = k ln Ω) never decreases.",
        "Refrigerators and heat pumps use work to move heat uphill; a heat pump can deliver several joules of heat per joule of work.",
      ]} />
    </Article>
  );
}
