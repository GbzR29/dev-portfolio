"use client";

// Calculus 17: partial differential equations — what a PDE is (u_t, u_xx,
// order, linearity, superposition); the three classics (heat, wave, Laplace);
// the heat equation derived from neighbours on a grid; boundary and initial
// conditions; separation of variables with the sine modes and the Fourier
// sine series; the wave equation from a string, its modes and d'Alembert's
// travelling waves; Laplace and the mean value property; the explicit grid
// scheme and its stability limit; and the Schrödinger-type equation u_t = i u_xx,
// whose modes turn instead of decaying.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { PdeFigure } from "@/components/lesson/figures/math/PdeFigure";
import { MathPracticeFigure } from "@/components/lesson/figures/math/MathPracticeFigure";

const r = String.raw;
const n = (v: number) => String(+v.toFixed(4)).replace("-", "−");

// ── Live formula: one explicit grid step ─────────────────────────────────────

function stepNumbers(v: Record<string, number>) {
  const L = 0, M = 1, R = 0, next = M + v.r * (L - 2 * M + R);
  return {
    tex: r`u_i^{\text{new}} = 1 + ${n(v.r)}\,(0 - 2 \cdot 1 + 0) = ${next < 0 ? r`\red{${n(next)}}` : r`\green{${n(next)}}`}`,
    meter: Math.max(0, Math.min(1, (next + 1) / 2)),
  };
}

export function PdeContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mPde_intro",
          "The differential equations chapter followed one quantity changing in time: y(t). But the temperature of a metal rod is different at every point and changes at every moment, so it is a function of two variables, u(x, t). An equation linking its partial derivatives is a partial differential equation, or PDE. Three of them describe an enormous part of the physical world: the heat equation (spreading), the wave equation (travelling and vibrating) and Laplace's equation (balance). This chapter derives them and solves them with the Fourier series of the previous chapters.")}
      </Lead>

      <Goals t={t} id="mPde" items={[
        "Read the notation u_t, u_xx and say what the heat, wave and Laplace equations describe.",
        "Derive the heat equation from the rule \"each point moves towards the average of its neighbours\".",
        "Solve the heat and wave equations on an interval by separation of variables and a Fourier sine series.",
        "Explain d'Alembert's travelling waves, the stability limit of a grid solution, and how u_t = i u_xx differs from heat.",
      ]} />

      <H2>{tx(t, "mPde_whatTitle", "What a PDE is")}</H2>
      <p>
        {tx(t, "mPde_whatBody",
          "Write u(x, t) for the unknown function. Partial derivatives get short names: u_t = ∂u/∂t is how fast u changes in time at a fixed place, u_x = ∂u/∂x is the slope along x at a fixed time, and u_xx = ∂²u/∂x² is the curvature, how fast that slope changes. The order of a PDE is its highest derivative. It is linear when u and its derivatives appear only to the first power, never multiplied together. For a linear equation with zero on the right, sums of solutions are solutions: this is superposition, and it is what makes the Fourier method work.")}
      </p>
      <LessonTable
        headers={[tx(t, "mPde_tName", "Equation"), tx(t, "mPde_tForm", "Form"), tx(t, "mPde_tDesc", "Describes")]}
        rows={[
          [tx(t, "mPde_tHeat", "heat (diffusion)"), "u_t = α u_xx", tx(t, "mPde_tHeatD", "temperature evening out, ink spreading in water")],
          [tx(t, "mPde_tWave", "wave"), "u_tt = c² u_xx", tx(t, "mPde_tWaveD", "a vibrating string, sound, light")],
          [tx(t, "mPde_tLap", "Laplace"), "u_xx + u_yy = 0", tx(t, "mPde_tLapD", "a steady state: temperature after it has settled, a soap film, electric potential")],
        ]}
      />

      <H2>{tx(t, "mPde_heatTitle", "Where the heat equation comes from")}</H2>
      <p>
        {tx(t, "mPde_heatBody",
          "Cut the rod into small pieces of length h and look at three neighbours with temperatures uᵢ₋₁, uᵢ, uᵢ₊₁. Heat flows from hot to cold at a rate proportional to the temperature difference. So piece i gains heat from a hotter neighbour and loses it to a colder one: it warms up exactly when it is colder than the average of its two neighbours.")}
      </p>
      <Derivation t={t} label={tx(t, "mPde_eqHeatDer", "From neighbours to u_t = α u_xx")}
        steps={[
          { full: true, tex: r`\frac{du_i}{dt} = k\big[(u_{i+1} - u_i) - (u_i - u_{i-1})\big] = k\,(u_{i+1} - 2u_i + u_{i-1})`, why: tx(t, "mPde_h1", "inflow from the right minus outflow to the left; k measures how well the material conducts") },
          { full: true, tex: r`\frac{u_{i+1} - 2u_i + u_{i-1}}{h^2} \approx u_{xx}`, why: tx(t, "mPde_h2", "a difference of two slopes, divided by h again: the second derivative (the Taylor series of u(x ± h) shows the error is about h²)") },
          { full: true, tex: r`u_t = \alpha\,u_{xx}, \quad \alpha = k h^2`, why: tx(t, "mPde_h3", "as the pieces shrink, kh² tends to a constant α, the thermal diffusivity of the material") },
        ]} />
      <Equation label={tx(t, "mPde_eqHeat", "The heat equation")}
        where={[
          [r`u(x, t)`, tx(t, "mPde_wU", "the temperature at position x and time t")],
          [r`u_t`, tx(t, "mPde_wUt", "the rate of change of temperature at a fixed point")],
          [r`u_{xx}`, tx(t, "mPde_wUxx", "the curvature of the temperature graph: positive where the point is colder than its neighbours")],
          [r`\alpha`, tx(t, "mPde_wAlpha", "the diffusivity (m²/s): large for copper, small for wood")],
        ]}
        words={tx(t, "mPde_heatWords", "Every point warms up or cools down towards the average of its surroundings, faster the more it differs from them.")}>
        {r`\frac{\partial u}{\partial t} = \alpha\,\frac{\partial^2 u}{\partial x^2}`}
      </Equation>
      <p>
        {tx(t, "mPde_bcBody",
          "One equation has infinitely many solutions; two more pieces of information pick out one. Boundary conditions say what happens at the ends: here both ends sit in ice water, u(0, t) = u(L, t) = 0. An initial condition gives the starting temperature everywhere: u(x, 0) = f(x). With both, the solution exists and is unique.")}
      </p>

      <H2>{tx(t, "mPde_sepTitle", "Separation of variables")}</H2>
      <p>
        {tx(t, "mPde_sepBody",
          "Fourier's idea: first look for the simplest solutions, those whose shape never changes and only shrinks or grows, u = X(x) · T(t). Substituting splits the PDE into two ordinary differential equations, one in x and one in t. Then build every other solution as a sum of these.")}
      </p>
      <Derivation t={t} label={tx(t, "mPde_eqSepDer", "Solving u_t = α u_xx with u = 0 at x = 0 and x = L")}
        steps={[
          { full: true, tex: r`X(x)\,T'(t) = \alpha\,X''(x)\,T(t) \;\Rightarrow\; \frac{T'(t)}{\alpha\,T(t)} = \frac{X''(x)}{X(x)}`, why: tx(t, "mPde_s1", "substitute u = X T and divide by α X T") },
          { full: true, tex: r`\frac{T'}{\alpha T} = \frac{X''}{X} = -\lambda`, why: tx(t, "mPde_s2", "the left side depends only on t and the right side only on x; if they are always equal, both are the same constant, called −λ") },
          { full: true, tex: r`X'' = -\lambda X,\ X(0) = X(L) = 0 \;\Rightarrow\; X_n = \sin\frac{n\pi x}{L},\ \lambda_n = \Big(\frac{n\pi}{L}\Big)^2`, why: tx(t, "mPde_s3", "solutions of X″ = −λX are sines and cosines; X(0) = 0 rules out the cosine, and X(L) = 0 needs a whole number n of half-waves in L") },
          { full: true, tex: r`T' = -\alpha\lambda_n T \;\Rightarrow\; T_n = e^{-\alpha (n\pi/L)^2 t}`, why: tx(t, "mPde_s4", "exponential decay, from the chapter on differential equations") },
          { full: true, tex: r`u(x, t) = \sum_{n=1}^{\infty} b_n \sin\frac{n\pi x}{L}\; e^{-\alpha (n\pi/L)^2 t}`, why: tx(t, "mPde_s5", "superposition: any sum of solutions is a solution") },
          { full: true, tex: r`u(x, 0) = \sum b_n \sin\frac{n\pi x}{L} = f(x) \;\Rightarrow\; b_n = \frac{2}{L}\int_0^L f(x)\sin\frac{n\pi x}{L}\,dx`, why: tx(t, "mPde_s6", "at t = 0 the sum must be f: the bₙ are its Fourier sine coefficients, from the Fourier chapter") },
        ]} />
      <Equation label={tx(t, "mPde_eqHeatSol", "The solution of the heat equation on [0, L]")}
        where={[
          [r`b_n`, tx(t, "mPde_wBn", "the sine coefficients of the starting temperature f")],
          [r`\sin\frac{n\pi x}{L}`, tx(t, "mPde_wMode", "mode n: n half-waves between the ends")],
          [r`e^{-\alpha (n\pi/L)^2 t}`, tx(t, "mPde_wDecay", "how mode n fades: n² times faster than mode 1")],
        ]}
        words={tx(t, "mPde_heatSolWords", "Split the starting temperature into sine waves; each wave keeps its shape and fades, the fine ones fastest.")}>
        {r`u(x, t) = \sum_{n=1}^{\infty} b_n\,\sin\frac{n\pi x}{L}\;e^{-\alpha n^2\pi^2 t / L^2}`}
      </Equation>
      <p>
        {tx(t, "mPde_smooth",
          "Because mode n decays like e^(−n²…), the high modes, which carry corners and fine detail, disappear almost instantly. Heat smooths everything: even a block with sharp edges becomes a smooth curve after the shortest time. After a while only mode 1 remains, a single sine hump shrinking towards 0.")}
      </p>

      <PdeFigure t={t} />

      <H2>{tx(t, "mPde_waveTitle", "The wave equation")}</H2>
      <p>
        {tx(t, "mPde_waveBody",
          "Now a string stretched with tension τ, with mass ρ per unit length, and u(x, t) its sideways displacement. A small piece of length dx is pulled by the tension at both ends. If the string is straight the two pulls cancel; if it is curved they do not, and the leftover force is τ u_xx dx. Newton's law, force = mass × acceleration, gives τ u_xx dx = ρ dx u_tt.")}
      </p>
      <Equation label={tx(t, "mPde_eqWave", "The wave equation")}
        where={[
          [r`u_{tt}`, tx(t, "mPde_wUtt", "the acceleration of the string at x")],
          [r`c = \sqrt{\tau/\rho}`, tx(t, "mPde_wC", "the wave speed: tighter or lighter strings carry waves faster")],
          [r`u_{xx}`, tx(t, "mPde_wUxx2", "the curvature, which sets the net force on each piece")],
        ]}
        words={tx(t, "mPde_waveWords", "Each piece of string accelerates towards straightening itself, in proportion to how bent it is.")}>
        {r`\frac{\partial^2 u}{\partial t^2} = c^2\,\frac{\partial^2 u}{\partial x^2}`}
      </Equation>
      <p>
        {tx(t, "mPde_waveSep",
          "Separation of variables runs exactly as before, with one change: T″ = −c²λT is the oscillator equation, so the time part is a cosine instead of a decay. For a string released from rest in the shape f, u = Σ bₙ sin(nπx/L) cos(nπct/L). Mode n vibrates with frequency fₙ = nc / (2L) cycles per second: the fundamental and its whole-number multiples, the harmonics of the music and waves chapters. Nothing decays, so the string keeps ringing.")}
      </p>
      <H3>{tx(t, "mPde_dalTitle", "Travelling waves: d'Alembert")}</H3>
      <p>
        {tx(t, "mPde_dalBody",
          "There is a second way to see every solution. Take any shape F and slide it to the right at speed c: u = F(x − ct). Then u_t = −c F′ and u_tt = c² F″, while u_xx = F″, so it solves the wave equation. A shape G sliding left, G(x + ct), works too, and so does their sum. In fact every solution on the whole line is F(x − ct) + G(x + ct). A string released from rest in the shape f splits into two half-height copies running apart: u = ½ f(x − ct) + ½ f(x + ct). The pluck in the figure does exactly this.")}
      </p>

      <H2>{tx(t, "mPde_lapTitle", "Laplace's equation: the steady state")}</H2>
      <p>
        {tx(t, "mPde_lapBody",
          "Wait long enough with the ends of the rod held at fixed temperatures A and B, and nothing changes any more: u_t = 0, so u_xx = 0, and the temperature is the straight line from A to B. In two dimensions the steady state solves u_xx + u_yy = 0, Laplace's equation. Its solutions are called harmonic, and they have a striking property: the value at any point is the average of the values on any circle around it. So a harmonic function has no peaks or pits inside the region; its largest and smallest values are on the boundary.")}
      </p>

      <H2>{tx(t, "mPde_gridTitle", "Solving on a grid, and a speed limit")}</H2>
      <p>
        {tx(t, "mPde_gridBody",
          "Most PDEs have no formula for their solution, so computers solve them on a grid: positions xᵢ = iΔx and times tₖ = kΔt. Replace u_t by (new − old)/Δt and u_xx by the second difference. This gives the explicit scheme, which computes each new value from three old ones.")}
      </p>
      <Equation label={tx(t, "mPde_eqGrid", "The explicit scheme for u_t = u_xx")}
        where={[
          [r`u_i`, tx(t, "mPde_wUi", "the temperature at grid point i, now")],
          [r`r = \frac{\Delta t}{\Delta x^2}`, tx(t, "mPde_wR", "the time step measured against the square of the grid spacing")],
        ]}
        note={tx(t, "mPde_gridNote", "Stable only if r ≤ ½. For r > ½ the fastest zigzag, + − + − …, is multiplied by 1 − 4r < −1 every step and explodes, although the true solution decays.")}
        words={tx(t, "mPde_gridWords", "Move each value a fraction r of the way towards what its neighbours suggest.")}>
        {r`u_i^{\text{new}} = u_i + r\,\big(u_{i-1} - 2u_i + u_{i+1}\big)`}
      </Equation>
      <LiveFormula label={tx(t, "mPde_liveStep", "Try it: a single hot point between two cold ones")}
        tex={r`u_i^{\text{new}} = u_i + r\,(u_{i-1} - 2u_i + u_{i+1})`}
        vars={[{ id: "r", label: "r", min: 0.05, max: 1, step: 0.05, value: 0.25, fmt: (v: number) => v.toFixed(2) }]}
        compute={stepNumbers}
        note={tx(t, "mPde_liveStepNote", "With r = ½ the hot point drops exactly to 0. Beyond that it overshoots below 0: a hot point cannot become colder than everything around it. That overshoot, repeated every step, is the instability.")} />
      <Callout type="warn" t={t}>
        {tx(t, "mPde_cfl", "Halving Δx to see more detail forces Δt to shrink four times, so the computation costs eight times as much. Implicit schemes, which solve a linear system at every step, remove the limit. For the wave equation the condition is c Δt ≤ Δx (the CFL condition): information may not cross more than one grid cell per step.")}
      </Callout>

      <H2>{tx(t, "mPde_schTitle", "A look ahead: u_t = i u_xx")}</H2>
      <p>
        {tx(t, "mPde_schBody",
          "Put the imaginary unit i in front of the heat equation's right side: u_t = i u_xx, with u now complex. Separation of variables gives the same sine modes, but the time part solves T′ = −iλT, so T = e^(−iλt). That is not a decay: by Euler's formula it is a point turning round the unit circle. Every mode keeps its size forever and only rotates its phase, at a speed λₙ = (nπ/L)² that grows like n². Physics knows this equation: with constants attached, it is the Schrödinger equation for a particle in a box, and the λₙ become the allowed energies, which come in whole-number steps n² because only whole numbers of half-waves fit between the walls.")}
      </p>
      <LessonTable
        headers={[tx(t, "mPde_tEq", "Equation"), tx(t, "mPde_tTime", "time part of mode n"), tx(t, "mPde_tBehave", "behaviour")]}
        rows={[
          ["u_t = u_xx", "e^(−λₙ t)", tx(t, "mPde_tB1", "decays, smooths out")],
          ["u_tt = u_xx", "cos(√λₙ t)", tx(t, "mPde_tB2", "oscillates, rings forever")],
          ["u_t = i u_xx", "e^(−iλₙ t)", tx(t, "mPde_tB3", "keeps its size, turns its phase")],
        ]}
      />

      <H2>{tx(t, "mPde_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mPde_ex1", "1. Does u = e^(−4t) sin 2x solve u_t = u_xx? u_t = −4e^(−4t) sin 2x and u_xx = −4e^(−4t) sin 2x. Yes. In general e^(−kt) sin nx needs k = n² (k = αn² with diffusivity α).")}</p>
      <p>{tx(t, "mPde_ex2", "2. A rod of length L = 1 with α = 1 starts as u = 3 sin πx + sin 3πx. Then u = 3 e^(−π²t) sin πx + e^(−9π²t) sin 3πx. At t = 0.1 the factors are 0.373 and 0.00014: the second mode has practically gone.")}</p>
      <p>{tx(t, "mPde_ex3", "3. A guitar string 0.65 m long carries waves at c = 286 m/s. Its fundamental is f₁ = c/(2L) = 286/1.3 = 220 Hz, the note A3, with harmonics 440, 660, 880 Hz …")}</p>
      <p>{tx(t, "mPde_ex4", "4. A rod with ends held at 20 °C and 80 °C settles to the straight line u = 20 + 60x/L. Halfway along it is 50 °C.")}</p>

      <MathPracticeFigure t={t} set="pde" />

      <H2>{tx(t, "mPde_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mPde_tWrong", "Wrong"), tx(t, "mPde_tRight", "Right"), tx(t, "mPde_tWhy", "Why")]}
        rows={[
          [tx(t, "mPde_m1w", "mode n decays like e^(−nt)"), "e^(−αn²π²t/L²)", tx(t, "mPde_m1", "two derivatives in x bring down (nπ/L) twice")],
          [tx(t, "mPde_m2w", "cosines for fixed ends"), tx(t, "mPde_m2r", "sines sin(nπx/L)"), tx(t, "mPde_m2", "only the sines are 0 at x = 0 and x = L")],
          [tx(t, "mPde_m3w", "forgetting the initial condition"), tx(t, "mPde_m3r", "bₙ from f"), tx(t, "mPde_m3", "the modes alone do not say how much of each is present")],
          [tx(t, "mPde_m4w", "a smaller grid spacing with the same Δt"), "Δt ≤ Δx²/2", tx(t, "mPde_m4", "the explicit scheme becomes unstable")],
          [tx(t, "mPde_m5w", "waves fade like heat"), tx(t, "mPde_m5r", "cos, not e^(−…)"), tx(t, "mPde_m5", "the wave equation has a second time derivative: an oscillator")],
        ]}
      />

      <KeyIdeas t={t} id="mPde" items={[
        "A PDE links partial derivatives of u(x, t); linear ones obey superposition.",
        "Heat: u_t = α u_xx, each point moves towards the average of its neighbours; waves: u_tt = c² u_xx; steady state: u_xx + u_yy = 0.",
        "Boundary conditions (the ends) and an initial condition (the start) pick out one solution.",
        "Separation u = X(x)T(t) gives the modes sin(nπx/L); the Fourier sine series of the start gives their amounts.",
        "Heat modes decay like e^(−αn²π²t/L²), wave modes oscillate with frequencies nc/(2L); d'Alembert: F(x − ct) + G(x + ct).",
        "The explicit grid scheme needs Δt ≤ Δx²/2; with u_t = i u_xx the modes turn instead of decaying, as in quantum physics.",
      ]} />
    </Article>
  );
}
