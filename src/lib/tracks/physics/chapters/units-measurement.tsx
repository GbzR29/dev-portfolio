"use client";

// Foundations 1: what a physical quantity is (number × unit); the SI base
// units and how they are defined today; derived units; prefixes and
// scientific notation; converting units with factors equal to one;
// dimensions and why both sides of an equation must match; dimensional
// analysis (the pendulum's period found without solving anything); orders of
// magnitude and Fermi estimates; uncertainty and significant figures.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { PendulumDimensionsFigure } from "@/components/lesson/figures/physics/PendulumDimensionsFigure";

const r = String.raw;
const num = (v: number, d = 3) => String(+v.toFixed(d)).replace("-", "−");

// ── Live formulas: the numbers plugged in ─────────────────────────────────────

/** Area of a measured rectangle, with the uncertainty carried through. */
function areaNumbers(v: Record<string, number>) {
  const { a, b, da, db } = v;
  const A = a * b, rel = da / a + db / b, dA = A * rel;
  return {
    tex: r`A = ${num(a, 1)} \times ${num(b, 1)} = \amber{${num(A, 1)}}\ \text{cm}^2 \qquad \frac{\Delta A}{A} = \frac{${num(da, 1)}}{${num(a, 1)}} + \frac{${num(db, 1)}}{${num(b, 1)}} = ${num(rel * 100, 1)}\% \qquad A = \green{${num(A, 0)} \pm ${num(dA, 0)}}\ \text{cm}^2`,
    meter: Math.min(1, rel * 5), meterLabel: `${num(rel * 100, 1)} %`,
  };
}

export function UnitsMeasurementContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "phUnit_intro",
          "Physics describes nature with numbers. A number alone says nothing, though: \"the table is 2 long\" could mean 2 metres or 2 kilometres. Every measured number comes with a unit, and every unit is a comparison with an agreed standard. This first chapter sets up the tools the rest of the track uses on every page: units, conversions, dimensions, rough estimates and honest uncertainty.")}
      </Lead>

      <Goals t={t} id="phUnit" items={[
        "Write any measurement as a number times a unit, and name the seven SI base units.",
        "Convert units by multiplying by factors equal to one.",
        "Check an equation with dimensions, and use them to guess a law.",
        "Estimate orders of magnitude, and report a result with its uncertainty.",
      ]} />

      <H2>{tx(t, "phUnit_qtyTitle", "A quantity is a number times a unit")}</H2>
      <p>
        {tx(t, "phUnit_qtyBody",
          "A physical quantity is anything that can be measured: a length, a time, a mass, a temperature. To measure it is to count how many times an agreed standard, the unit, fits into it. A corridor of 12 metres is 12 copies of one metre laid end to end. So every quantity has two parts, and the unit is not decoration: it is half of the information. Change the unit and the number changes, while the quantity itself stays the same. 1.5 m and 150 cm are the same length.")}
      </p>
      <Equation label={tx(t, "phUnit_eqQty", "A physical quantity")}
        where={[
          [r`Q`, tx(t, "phUnit_wQ", "the quantity itself, for example the length of a corridor")],
          [r`\{Q\}`, tx(t, "phUnit_wNum", "its numerical value: how many units fit into it (12)")],
          [r`[Q]`, tx(t, "phUnit_wUnit", "the unit used as the standard (the metre)")],
        ]}
        words={tx(t, "phUnit_qtyWords", "A quantity is how many units it contains, times the unit.")}>
        {r`Q = \{Q\} \cdot [Q] \qquad \text{e.g.}\quad L = 12\ \text{m}`}
      </Equation>

      <H2>{tx(t, "phUnit_siTitle", "The SI: seven base units")}</H2>
      <p>
        {tx(t, "phUnit_siBody",
          "Almost every country and every laboratory uses the International System of Units, the SI (from the French Système international). It picks seven base quantities and gives each a base unit. Every other unit is built from these seven. Since 2019 all seven are defined by fixing the exact value of a constant of nature, so anyone with the right equipment can rebuild them anywhere, with no reference object kept in a vault.")}
      </p>
      <LessonTable
        headers={[tx(t, "phUnit_tQty", "Quantity"), tx(t, "phUnit_tUnit", "Unit"), tx(t, "phUnit_tSym", "Symbol"), tx(t, "phUnit_tDef", "Defined by fixing")]}
        rows={[
          [tx(t, "phUnit_r1q", "time"), tx(t, "phUnit_r1u", "second"), "s", tx(t, "phUnit_r1d", "the frequency of a caesium-133 atomic transition: 9 192 631 770 Hz")],
          [tx(t, "phUnit_r2q", "length"), tx(t, "phUnit_r2u", "metre"), "m", tx(t, "phUnit_r2d", "the speed of light: c = 299 792 458 m/s")],
          [tx(t, "phUnit_r3q", "mass"), tx(t, "phUnit_r3u", "kilogram"), "kg", tx(t, "phUnit_r3d", "Planck's constant: h = 6.626 070 15 × 10⁻³⁴ J·s")],
          [tx(t, "phUnit_r4q", "electric current"), tx(t, "phUnit_r4u", "ampere"), "A", tx(t, "phUnit_r4d", "the charge of one electron: e = 1.602 176 634 × 10⁻¹⁹ C")],
          [tx(t, "phUnit_r5q", "temperature"), tx(t, "phUnit_r5u", "kelvin"), "K", tx(t, "phUnit_r5d", "Boltzmann's constant: k = 1.380 649 × 10⁻²³ J/K")],
          [tx(t, "phUnit_r6q", "amount of substance"), tx(t, "phUnit_r6u", "mole"), "mol", tx(t, "phUnit_r6d", "Avogadro's number: 6.022 140 76 × 10²³ per mole")],
          [tx(t, "phUnit_r7q", "luminous intensity"), tx(t, "phUnit_r7u", "candela"), "cd", tx(t, "phUnit_r7d", "the luminous efficacy of green light at 540 THz: 683 lm/W")],
        ]}
      />
      <p>
        {tx(t, "phUnit_siBody2",
          "Read the metre's row carefully: light travels exactly 299 792 458 metres in one second, by definition. So once the second is fixed by the caesium clock, the metre is simply the distance light covers in 1/299 792 458 of a second. You do not need to understand Planck's constant or the electron's charge yet; they appear in the quantum and electricity chapters. What matters now is the idea: units are anchored to nature, not to objects.")}
      </p>

      <H3>{tx(t, "phUnit_derTitle", "Derived units")}</H3>
      <p>
        {tx(t, "phUnit_derBody",
          "Every other unit is a product or quotient of base units. Speed is a distance divided by a time, so its unit is metres per second, m/s. Acceleration is a change of speed per second, (m/s)/s = m/s². Some derived units are used so often that they get their own name, usually after a physicist. You will meet each of these properly in later chapters; the table only shows that they are made of the base units.")}
      </p>
      <LessonTable
        headers={[tx(t, "phUnit_tQty", "Quantity"), tx(t, "phUnit_tUnit", "Unit"), tx(t, "phUnit_tBase", "In base units"), tx(t, "phUnit_tFrom", "Comes from")]}
        rows={[
          [tx(t, "phUnit_d1q", "force"), "newton (N)", "kg·m/s²", tx(t, "phUnit_d1f", "mass × acceleration")],
          [tx(t, "phUnit_d2q", "energy, work"), "joule (J)", "kg·m²/s²", tx(t, "phUnit_d2f", "force × distance")],
          [tx(t, "phUnit_d3q", "power"), "watt (W)", "kg·m²/s³", tx(t, "phUnit_d3f", "energy per second")],
          [tx(t, "phUnit_d4q", "pressure"), "pascal (Pa)", "kg/(m·s²)", tx(t, "phUnit_d4f", "force per area")],
          [tx(t, "phUnit_d5q", "frequency"), "hertz (Hz)", "1/s", tx(t, "phUnit_d5f", "events per second")],
        ]}
      />

      <H2>{tx(t, "phUnit_preTitle", "Prefixes and powers of ten")}</H2>
      <p>
        {tx(t, "phUnit_preBody",
          "Physics spans absurd ranges: a proton is about 0.000 000 000 000 001 m across, the observable universe about 880 000 000 000 000 000 000 000 000 m. Writing zeros is error-prone, so we use scientific notation: a number between 1 and 10 times a power of ten. The proton becomes 1 × 10⁻¹⁵ m and the universe 8.8 × 10²⁶ m. The exponent counts how many places the decimal point moved: positive for big numbers, negative for small ones. Common powers also have a prefix, a word glued in front of the unit.")}
      </p>
      <LessonTable
        headers={[tx(t, "phUnit_tPrefix", "Prefix"), tx(t, "phUnit_tSym", "Symbol"), tx(t, "phUnit_tFactor", "Factor"), tx(t, "phUnit_tExample", "Example")]}
        rows={[
          ["giga", "G", "10⁹", tx(t, "phUnit_p1", "1 GHz: a billion cycles per second")],
          ["mega", "M", "10⁶", tx(t, "phUnit_p2", "1 MW: a small power station")],
          [tx(t, "phUnit_pk", "kilo"), "k", "10³", "1 km = 1000 m"],
          ["centi", "c", "10⁻²", "1 cm = 0.01 m"],
          [tx(t, "phUnit_pm", "milli"), "m", "10⁻³", "1 mm = 0.001 m"],
          ["micro", "µ", "10⁻⁶", tx(t, "phUnit_p6", "1 µm: about a bacterium")],
          ["nano", "n", "10⁻⁹", tx(t, "phUnit_p7", "500 nm: the wavelength of green light")],
        ]}
      />
      <Callout type="warn" t={t}>
        {tx(t, "phUnit_kgWarn", "The kilogram is the odd one out: it is the base unit, yet it already carries the prefix kilo. A gram is 10⁻³ kg. In formulas always use kilograms, metres and seconds, and convert everything else first.")}
      </Callout>

      <H2>{tx(t, "phUnit_convTitle", "Converting units")}</H2>
      <p>
        {tx(t, "phUnit_convBody",
          "Since 1 km = 1000 m, the fraction (1000 m)/(1 km) equals exactly 1. Multiplying any quantity by 1 does not change it, so we can multiply by such fractions as often as we like. We choose them so that the unwanted units cancel, as in an ordinary fraction. Units behave like algebraic symbols: km over km cancels just as x/x = 1. Here is a car's speed of 72 km/h turned into metres per second.")}
      </p>
      <Derivation t={t} label={tx(t, "phUnit_eqConv", "72 km/h in m/s")}
        steps={[
          { tex: r`72\ \frac{\text{km}}{\text{h}}` },
          { tex: r`= 72\ \frac{\text{km}}{\text{h}} \times \frac{1000\ \text{m}}{1\ \text{km}}`, why: tx(t, "phUnit_c1", "multiply by 1000 m / 1 km, a fraction equal to 1, with km below so it cancels") },
          { tex: r`= 72\ \frac{\cancel{\text{km}}}{\text{h}} \times \frac{1000\ \text{m}}{1\ \cancel{\text{km}}} \times \frac{1\ \text{h}}{3600\ \text{s}}`, why: tx(t, "phUnit_c2", "one hour is 3600 seconds; put h on top so it cancels the h below") },
          { tex: r`= \frac{72 \times 1000}{3600}\ \frac{\text{m}}{\text{s}}`, why: tx(t, "phUnit_c3", "km and h are gone: only m/s is left") },
          { tex: r`= \green{20\ \text{m/s}}`, why: tx(t, "phUnit_c4", "72 000 / 3600 = 20") },
        ]} />
      <p>
        {tx(t, "phUnit_convBody2",
          "The shortcut to remember: km/h to m/s, divide by 3.6; m/s to km/h, multiply by 3.6 (because 3600/1000 = 3.6). Squared and cubed units need the factor squared or cubed: 1 m² = (100 cm)² = 10 000 cm², not 100 cm². A cube 1 m on each side holds 1 000 000 cm³, which is 1000 litres.")}
      </p>

      <H2>{tx(t, "phUnit_dimTitle", "Dimensions")}</H2>
      <p>
        {tx(t, "phUnit_dimBody",
          "A metre, a centimetre and a mile are different units of the same kind of thing: a length. That kind is called a dimension. We write the dimension of a quantity in square brackets, with L for length, M for mass and T for time (and a few more for current, temperature and amount). A speed has dimension L/T, written L T⁻¹, whatever units it is measured in. An acceleration has L T⁻², a force M L T⁻².")}
      </p>
      <p>
        {tx(t, "phUnit_dimRule",
          "The rule that makes dimensions useful: you can only add, subtract or compare quantities of the same dimension. Three metres plus two seconds means nothing. So in every correct equation, every term has the same dimension. This catches mistakes instantly. Check the equation for a speed that grows steadily, v = v₀ + a t, from the next chapter:")}
      </p>
      <Equation label={tx(t, "phUnit_eqHom", "Checking an equation by its dimensions")}
        where={[
          [r`v,\ v_0`, tx(t, "phUnit_wV", "speeds now and at the start: dimension L T⁻¹")],
          [r`a`, tx(t, "phUnit_wA", "acceleration: dimension L T⁻²")],
          [r`t`, tx(t, "phUnit_wT", "time: dimension T")],
        ]}
        note={tx(t, "phUnit_homNote", "Every term is L T⁻¹, so the equation is at least possible. Had someone written v = v₀ + a t², the last term would be L, a length, and the equation would be certainly wrong.")}>
        {r`\underbrace{v}_{L\,T^{-1}} = \underbrace{v_0}_{L\,T^{-1}} + \underbrace{a\,t}_{L\,T^{-2}\cdot T \;=\; L\,T^{-1}}`}
      </Equation>
      <Callout type="info" t={t}>
        {tx(t, "phUnit_dimTip", "Numbers like 2, ½ or π have no dimension, and neither do angles in radians (an arc length divided by a radius, L/L). Functions such as sin, cos, eˣ and log only accept dimensionless inputs: sin(3 metres) is meaningless.")}
      </Callout>

      <H2>{tx(t, "phUnit_daTitle", "Dimensional analysis: a law for free")}</H2>
      <p>
        {tx(t, "phUnit_daBody",
          "Dimensions can do more than catch errors: they can guess a law. Take a pendulum, a weight on a string. Its period T (the time of one full swing, back and forth) could depend on the length L of the string, on the strength of gravity g (9.81 m/s² on Earth) and on the mass m of the weight. Suppose the law is a product of powers, T = k · Lᵃ · gᵇ · mᶜ, with k a pure number. The left side is a time, so the right side must be one too. That single demand fixes all three powers.")}
      </p>
      <Derivation t={t} label={tx(t, "phUnit_eqPend", "The pendulum's period from dimensions alone")}
        steps={[
          { tex: r`T = k\, L^a\, g^b\, m^c` },
          { tex: r`[T] = L^a \,(L\,T^{-2})^b\, M^c`, why: tx(t, "phUnit_p1s", "replace each quantity by its dimension; k is a pure number and drops out") },
          { tex: r`T^1 = M^{c}\; L^{a + b}\; T^{-2b}`, why: tx(t, "phUnit_p2s", "gather the powers of M, L and T") },
          { tex: r`c = 0, \quad a + b = 0, \quad -2b = 1`, why: tx(t, "phUnit_p3s", "match the powers on both sides: no M, no L, and T to the power 1") },
          { tex: r`b = -\tfrac12, \quad a = \tfrac12, \quad c = 0`, why: tx(t, "phUnit_p4s", "solve the three small equations") },
          { tex: r`T = \green{k \sqrt{L / g}}`, why: tx(t, "phUnit_p5s", "L to the ½ over g to the ½ is the square root of L/g; the mass does not appear at all") },
        ]} />
      <p>
        {tx(t, "phUnit_daBody2",
          "Without solving a single equation of motion we learned three things: a pendulum four times longer swings twice as slowly; on the Moon, where g is six times smaller, it swings √6 ≈ 2.4 times slower; and the mass makes no difference. What dimensions cannot give is the pure number k. An experiment, or the full theory in the oscillations chapter, shows that k = 2π for small swings. Try it in the figure: guess the powers, and watch whether one k fits all four pendulums.")}
      </p>
      <PendulumDimensionsFigure t={t} />
      <Equation label={tx(t, "phUnit_eqPeriod", "Period of a pendulum (small swings)")}
        where={[
          [r`T`, tx(t, "phUnit_wPer", "the period, the time of one full swing (s)")],
          [r`L`, tx(t, "phUnit_wLen", "the length from the pivot to the centre of the weight (m)")],
          [r`g`, tx(t, "phUnit_wG", "the acceleration of gravity (m/s²): 9.81 on Earth")],
          [r`2\pi`, tx(t, "phUnit_w2pi", "the pure number dimensions cannot find")],
        ]}
        note={tx(t, "phUnit_periodNote", "A 1 m pendulum on Earth: T = 2π √(1 / 9.81) = 2.01 s. That is why old grandfather clocks have pendulums about a metre long: each swing one way takes one second.")}>
        {r`T = 2\pi \sqrt{\frac{L}{g}}`}
      </Equation>

      <H2>{tx(t, "phUnit_oomTitle", "Orders of magnitude and estimates")}</H2>
      <p>
        {tx(t, "phUnit_oomBody",
          "The order of magnitude of a quantity is its power of ten after rounding: 300 is of order 10², 8000 of order 10⁴ (8000 is closer to 10 000 than to 1000 on a logarithmic scale). Physicists often care more about the order of magnitude than the exact value, because it tells you which effects matter. A good estimate, named after Enrico Fermi who loved them, breaks a hard question into easy guesses and multiplies them. Errors in the guesses tend to cancel, so the answer is usually right within a factor of a few.")}
      </p>
      <LessonTable
        headers={[tx(t, "phUnit_tThing", "Thing"), tx(t, "phUnit_tSize", "Size")]}
        rows={[
          [tx(t, "phUnit_s1", "proton"), "10⁻¹⁵ m"],
          [tx(t, "phUnit_s2", "atom"), "10⁻¹⁰ m"],
          [tx(t, "phUnit_s3", "human cell"), "10⁻⁵ m"],
          [tx(t, "phUnit_s4", "person"), "10⁰ m"],
          [tx(t, "phUnit_s5", "Earth (diameter)"), "10⁷ m"],
          [tx(t, "phUnit_s6", "Earth to Sun"), "10¹¹ m"],
          [tx(t, "phUnit_s7", "Milky Way"), "10²¹ m"],
          [tx(t, "phUnit_s8", "observable universe"), "10²⁷ m"],
        ]}
      />
      <p>
        {tx(t, "phUnit_fermi",
          "Example: how many times does a heart beat in a lifetime? About 70 beats per minute, 60 minutes per hour, 24 hours per day, 365 days per year, 80 years. 70 × 60 × 24 × 365 × 80 ≈ 2.9 × 10⁹: about three billion beats. Rounding every factor to one significant figure (100 × 60 × 20 × 400 × 100 ≈ 5 × 10⁹) already gives the right order of magnitude.")}
      </p>

      <H2>{tx(t, "phUnit_uncTitle", "Uncertainty and significant figures")}</H2>
      <p>
        {tx(t, "phUnit_uncBody",
          "No measurement is exact. A ruler marked in millimetres cannot tell 12.34 cm from 12.36 cm. An honest result says how far it can be trusted: 12.3 ± 0.1 cm means the true value most likely lies between 12.2 and 12.4 cm. The ± part is the absolute uncertainty. Divided by the value it gives the relative uncertainty, 0.1/12.3 ≈ 0.8%, which lets you compare the quality of measurements of very different sizes.")}
      </p>
      <p>
        {tx(t, "phUnit_sigBody",
          "Significant figures are the digits that carry information. 12.3 has three; 0.0045 has two (the leading zeros only place the decimal point); 4.50 has three, because the final zero says \"measured to the hundredth\". A calculated result cannot be more precise than what went in. Multiply 12.3 cm by 4.5 cm and the calculator shows 55.35, but with only two significant figures in 4.5 the honest answer is 55 cm².")}
      </p>
      <Equation label={tx(t, "phUnit_eqProp", "How uncertainties combine (simple worst case)")}
        where={[
          [r`\Delta x`, tx(t, "phUnit_wDx", "the absolute uncertainty of x, in the same unit as x")],
          [r`\Delta x / x`, tx(t, "phUnit_wRel", "the relative uncertainty of x, a pure number or a percentage")],
        ]}
        words={tx(t, "phUnit_propWords", "When you add or subtract, add the absolute uncertainties. When you multiply or divide, add the relative uncertainties.")}>
        {r`x \pm y:\ \ \Delta = \Delta x + \Delta y \qquad\qquad x\,y \ \text{ or }\ \frac{x}{y}:\ \ \frac{\Delta}{|{\rm result}|} = \frac{\Delta x}{|x|} + \frac{\Delta y}{|y|}`}
      </Equation>
      <LiveFormula label={tx(t, "phUnit_liveArea", "Try it: the area of a measured sheet")}
        tex={r`A = a\,b \qquad \frac{\Delta A}{A} = \frac{\Delta a}{a} + \frac{\Delta b}{b}`}
        vars={[
          { id: "a", label: "a (cm)", min: 5, max: 40, step: 0.1, value: 29.7, fmt: v => num(v, 1) },
          { id: "da", label: "Δa (cm)", min: 0.1, max: 2, step: 0.1, value: 0.1, fmt: v => num(v, 1) },
          { id: "b", label: "b (cm)", min: 5, max: 40, step: 0.1, value: 21, fmt: v => num(v, 1) },
          { id: "db", label: "Δb (cm)", min: 0.1, max: 2, step: 0.1, value: 0.1, fmt: v => num(v, 1) },
        ]}
        compute={areaNumbers}
        note={tx(t, "phUnit_liveAreaNote", "It starts on an A4 sheet measured with a millimetre ruler: 624 ± 5 cm², under 1%. Make one side rough (Δb = 2 cm) and the whole area becomes uncertain by about 10%: the weakest measurement dominates.")} />
      <Callout type="info" t={t}>
        {tx(t, "phUnit_statTip", "Adding uncertainties like this is the cautious worst case. When errors are random and independent they partly cancel, and statisticians add them \"in quadrature\" instead: √(Δx² + Δy²). The Math track's sampling chapter explains why.")}
      </Callout>

      <H2>{tx(t, "phUnit_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "phUnit_ex1", "1. A sprinter runs 100 m in 9.58 s. Average speed: 100 / 9.58 = 10.4 m/s, and 10.4 × 3.6 = 37.6 km/h.")}</p>
      <p>{tx(t, "phUnit_ex2", "2. A room is 4 m × 5 m × 2.5 m. Its volume is 50 m³, which is 50 × 1000 = 50 000 litres of air, since 1 m³ = 1000 L.")}</p>
      <p>{tx(t, "phUnit_ex3", "3. Is E = m c the energy of a mass m (c is a speed)? Dimensions: M · L T⁻¹. Energy is a force times a distance, M L T⁻² · L = M L² T⁻². They differ by L T⁻¹, one more speed, so the correct form must be E = m c², as the relativity chapters derive.")}</p>
      <H3>{tx(t, "phUnit_ex4Title", "A pendulum on Mars")}</H3>
      <p>{tx(t, "phUnit_ex4", "4. A 1 m pendulum swings with T = 2.01 s on Earth. On Mars, g = 3.71 m/s². Since T ∝ 1/√g, T_Mars = 2.01 × √(9.81 / 3.71) = 2.01 × 1.63 = 3.27 s. No new experiment needed, only the ratio.")}</p>

      <H2>{tx(t, "phUnit_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "phUnit_tWrong", "Wrong"), tx(t, "phUnit_tRight", "Right"), tx(t, "phUnit_tWhy", "Why")]}
        rows={[
          [tx(t, "phUnit_m1w", "dropping the unit"), tx(t, "phUnit_m1r", "12 m, never just 12"), tx(t, "phUnit_m1", "the unit is half of the information")],
          [tx(t, "phUnit_m2w", "1 m² = 100 cm²"), tx(t, "phUnit_m2r", "1 m² = 10 000 cm²"), tx(t, "phUnit_m2", "square the conversion factor too")],
          [tx(t, "phUnit_m3w", "mixing km/h and m/s in one formula"), tx(t, "phUnit_m3r", "convert everything to SI first"), tx(t, "phUnit_m3", "the formula assumes consistent units")],
          [tx(t, "phUnit_m4w", "copying 8 calculator digits"), tx(t, "phUnit_m4r", "keep the significant figures of the data"), tx(t, "phUnit_m4", "extra digits claim precision you do not have")],
          [tx(t, "phUnit_m5w", "trusting dimensions for the constant"), tx(t, "phUnit_m5r", "dimensions give powers, not 2π"), tx(t, "phUnit_m5", "pure numbers have no dimension")],
        ]}
      />

      <KeyIdeas t={t} id="phUnit" items={[
        "A quantity is a number times a unit; the unit is half of the information.",
        "The SI has seven base units (s, m, kg, A, K, mol, cd), all fixed by constants of nature since 2019.",
        "Convert by multiplying by fractions equal to 1 so unwanted units cancel; square or cube the factor for areas and volumes.",
        "Every term of a correct equation has the same dimension (L, M, T…).",
        "Dimensional analysis finds how a law depends on its inputs (T ∝ √(L/g)), but not its pure-number constant.",
        "Orders of magnitude and Fermi estimates give the right size of an answer fast.",
        "Report results with their uncertainty and no more significant figures than the data allow.",
      ]} />
    </Article>
  );
}
