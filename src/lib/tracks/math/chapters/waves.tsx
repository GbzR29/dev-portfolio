"use client";

// Trigonometry 6: waves and oscillation — circular motion seen from the side,
// the sinusoid and its four parameters, period, frequency and phase, adding
// waves (same frequency, beats, harmonics and Fourier), damped oscillation,
// Lissajous figures, and reading and building waves by hand.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { WaveFigure } from "@/components/lesson/figures/math/WaveFigure";
import { HarmonicsFigure } from "@/components/lesson/figures/math/HarmonicsFigure";

const r = String.raw;

// ── Live formulas: a wave from measurements, sine plus cosine, damping ────────

const num = (v: number) => String(Math.round(v * 1000) / 1000).replace("-", "−");

function fitNumbers(v: Record<string, number>, t: TrackTranslations) {
  if (v.max <= v.min) return { tex: r`\red{\text{${tx(t, "mWv_liveMaxMin", "the highest value must be above the lowest")}}}` };
  const C = (v.max + v.min) / 2, A = (v.max - v.min) / 2, w = (2 * Math.PI) / v.T;
  return {
    tex: r`\begin{aligned} C &= \tfrac{${num(v.max)} + ${num(v.min)}}{2} = \green{${num(C)}} \qquad A = \tfrac{${num(v.max)} - ${num(v.min)}}{2} = \green{${num(A)}} \\ \omega &= \tfrac{2\pi}{${num(v.T)}} \approx \green{${num(w)}} \qquad y = ${num(A)}\sin(${num(w)}\,t) + ${num(C)} \end{aligned}`,
  };
}

function mixNumbers(v: Record<string, number>) {
  const R = Math.hypot(v.a, v.b);
  if (R === 0) return { tex: r`0` };
  const phi = (Math.atan2(v.b, v.a) * 180) / Math.PI;
  return {
    tex: r`${num(v.a)}\sin t ${v.b < 0 ? "-" : "+"} ${num(Math.abs(v.b))}\cos t = \green{${num(R)}}\,\sin(t ${phi < 0 ? "-" : "+"} \green{${num(Math.abs(phi))}^\circ})`,
  };
}

function dampNumbers(v: Record<string, number>) {
  const env = v.A * Math.exp(-v.lam * v.t);
  return {
    tex: r`A\,e^{-\lambda t} = ${num(v.A)}\cdot e^{-${num(v.lam * v.t)}} \approx \green{${num(env)}} \qquad \tfrac{\ln 2}{\lambda} = ${v.lam > 0 ? r`${num(Math.LN2 / v.lam)}\ \text{s}` : r`\infty`}`,
    meter: env / v.A,
    meterLabel: `${num((100 * env) / v.A)}%`,
  };
}

export function WavesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mWv_intro",
          "Things that go back and forth are everywhere: a swing, a pendulum clock, a guitar string, the tides, the length of the day over a year, sound, the alternating current in a wall socket. Almost all of them are built from one shape, the sine wave, stretched, shifted and added together. This chapter shows where the wave comes from, what each of its numbers controls, and how combining waves gives square waves, beats, figure eights and motion that dies down.")}
      </Lead>

      <H2>{tx(t, "mWv_circTitle", "A circle seen from the side")}</H2>
      <p>
        {tx(t, "mWv_circBody",
          "Let a point go round the unit circle at a steady angular speed ω (radians per second, from the unit circle chapter). After t seconds its angle is ωt, so its position is (cos ωt, sin ωt). Now look at the circle edge-on, so that only the height is visible: the point moves up and down between −1 and 1, fast through the middle and slowly at the ends, where it turns round. That motion, y = sin ωt, is called simple harmonic motion. It is how a mass on a spring and a pendulum (for small swings) move, and it is the smoothest possible back-and-forth.")}
      </p>

      <H2>{tx(t, "mTrig_waveTitle", "Waves")}</H2>
      <p>
        {tx(t, "mTrig_waveBody",
          "Unroll the unit circle over time and the height of the moving point traces a sine wave: the smoothest possible back-and-forth motion. Four numbers shape it, the same four as the function transformations of the Functions & Graphs chapter: amplitude (how far), frequency (how often), phase (where in the cycle it starts) and offset (around which value).")}
      </p>
      <Equation label={tx(t, "mTrig_eqWave", "A sinusoid")}
        where={[
          [r`A`, tx(t, "mTrig_wA", "the amplitude: the wave goes from C − A to C + A")],
          [r`f`, tx(t, "mTrig_wF", "the frequency in cycles per second (Hz). The period, the duration of one cycle, is T = 1/f")],
          [r`2\pi f`, tx(t, "mTrig_wOmega", "the angular frequency ω, in radians per second: it converts seconds into an angle so that one period is one full turn")],
          [r`\varphi`, tx(t, "mTrig_wPhi", "the phase: a head start along the cycle, in radians. Two pendulums with the same A and f but different φ swing with the same rhythm, one ahead of the other")],
          [r`C`, tx(t, "mTrig_wC", "the offset: the centre line")],
        ]}
        words={tx(t, "mTrig_waveWords", "Go round a circle f times a second, starting φ ahead; take the height, stretch it by A and lift it by C.")}>
        {r`y(t) = A\,\sin(2\pi f\,t + \varphi) + C`}
      </Equation>

      <WaveFigure t={t} />

      <H3>{tx(t, "mWv_phaseTitle", "Period, frequency and phase")}</H3>
      <p>
        {tx(t, "mWv_phaseBody",
          "Frequency and period are two views of one number: 4 cycles per second means each cycle takes ¼ s. The angular frequency ω = 2πf is the same speed measured in radians per second, the unit the sine function wants. The phase is a shift along the cycle measured as an angle; converted to time it is a delay of φ/ω seconds, with the sign flipped: sin(ω(t − d)) = sin(ωt − ωd), so a delay d is a phase of −ωd. A phase of π/2 turns sine into cosine and a phase of π turns the wave upside down.")}
      </p>
      <Equation label={tx(t, "mWv_eqRel", "How the numbers relate")}
        where={[
          [r`T`, tx(t, "mWv_wT", "the period, in seconds per cycle")],
          [r`\omega`, tx(t, "mWv_wW", "the angular frequency, in radians per second")],
          [r`d`, tx(t, "mWv_wD", "a delay in seconds")],
        ]}
        words={tx(t, "mWv_relWords", "The period is one over the frequency; the angular frequency is a full turn, 2π, per period; and delaying a wave by d seconds is the same as a phase of −ωd.")}
        note={tx(t, "mWv_relNote", "Example: a warning light pulses twice per second: f = 2 Hz, T = 0.5 s, ω = 4π ≈ 12.57 rad/s. To make a second light lag a quarter cycle behind, delay it by T/4 = 0.125 s, which is a phase of −π/2.")}>
        {r`T = \frac{1}{f} \qquad \omega = 2\pi f = \frac{2\pi}{T} \qquad \sin\big(\omega(t - d)\big) = \sin(\omega t - \omega d)`}
      </Equation>
      <p>
        {tx(t, "mTrig_waveUses",
          "Sinusoids describe a surprising amount of the world. The tide rises and falls with a period of about 12.4 hours. The voltage in a wall socket swings with f = 50 or 60 Hz, depending on the country. The note A above middle C is air pressure oscillating at 440 Hz. The length of the day follows a sinusoid with a period of one year. In each case the four numbers carry a physical meaning: A how strong, f how often, φ when it starts, C the average level.")}
      </p>
      <Callout type="tip" t={t}>
        {tx(t, "mTrig_timeTip", "Reading a wave off its graph: the offset C is halfway between the highest and the lowest value, the amplitude A is half the distance between them, and the period T is the time from one peak to the next.")}
      </Callout>

      <H2>{tx(t, "mWv_addTitle", "Adding waves")}</H2>
      <p>
        {tx(t, "mWv_addBody",
          "Two waves with the same frequency add up to a single wave of that frequency, only with a new amplitude and phase. The angle-sum formula of the identities chapter shows why: R sin(ωt + φ) = R cos φ · sin ωt + R sin φ · cos ωt, a mix of a sine and a cosine. Reading it backwards, any mix a sin ωt + b cos ωt is one sinusoid, and its amplitude and phase are the polar coordinates of the point (a, b).")}
      </p>
      <Equation label={tx(t, "mWv_eqMix", "A sine plus a cosine is one wave")}
        where={[
          [r`a,\ b`, tx(t, "mWv_wAB", "how much sine and how much cosine are mixed")],
          [r`R = \sqrt{a^2 + b^2}`, tx(t, "mWv_wR", "the amplitude of the result, the distance of (a, b) from the origin")],
          [r`\varphi = \operatorname{atan2}(b, a)`, tx(t, "mWv_wPhi", "its phase, the angle of (a, b)")],
        ]}
        note={tx(t, "mWv_mixNote", "Example: 3 sin t + 4 cos t = 5 sin(t + 53.1°). Two equal waves in phase double the amplitude; half a cycle apart (φ = π) they cancel completely, which is how noise-cancelling headphones work.")}>
        {r`a\sin\omega t + b\cos\omega t = R\,\sin(\omega t + \varphi)`}
      </Equation>
      <LiveFormula label={tx(t, "mWv_liveMix", "Try it: a sine plus a cosine")}
        tex={r`a\sin t + b\cos t = R\,\sin(t + \varphi) \qquad R = \sqrt{a^2 + b^2},\ \ \varphi = \operatorname{atan2}(b, a)`}
        vars={[
          { id: "a", label: "a", min: -5, max: 5, step: 1, value: 3, fmt: num },
          { id: "b", label: "b", min: -5, max: 5, step: 1, value: 4, fmt: num },
        ]}
        compute={mixNumbers}
        note={tx(t, "mWv_liveMixNote", "a = 3 and b = 4 give R = 5 and φ ≈ 53.1°, the example above. Set b = 0: no cosine, so R = a and φ = 0. Set a = b: equal parts, φ = 45°. A negative a puts φ past 90°, which is why atan2, not arctan, is needed.")} />
      <p>
        {tx(t, "mWv_beatsBody",
          "Waves with slightly different frequencies drift in and out of step: in step they reinforce, out of step they cancel, and the sum swells and fades at the difference of the two frequencies. The second-wave button of the figure above shows these beats. Waves with frequencies that are whole multiples of a base frequency, f, 2f, 3f and so on, are its harmonics. Adding harmonics with the right amplitudes builds almost any repeating shape; that is Fourier's discovery, and the harmonics mode below builds a square wave and a sawtooth out of plain sines.")}
      </p>

      <HarmonicsFigure t={t} />

      <Equation label={tx(t, "mWv_eqSquare", "A square wave as a sum of sines")}
        where={[
          [r`\sin(k x)/k`, tx(t, "mWv_wK", "the k-th harmonic: k times the frequency, 1/k of the amplitude")],
          [r`\tfrac{4}{\pi}`, tx(t, "mWv_w4pi", "a scale factor that makes the flat parts come out at exactly ±1")],
        ]}
        words={tx(t, "mWv_squareWords", "Add the odd harmonics, each one as many times weaker as it is faster, and the sum flattens into a square wave.")}>
        {r`\text{square}(x) = \frac{4}{\pi}\left(\sin x + \frac{\sin 3x}{3} + \frac{\sin 5x}{5} + \frac{\sin 7x}{7} + \cdots\right)`}
      </Equation>

      <H2>{tx(t, "mWv_dampTitle", "Damped oscillation")}</H2>
      <p>
        {tx(t, "mWv_dampBody",
          "Real oscillations lose energy and die down. Multiplying a sine by a decaying exponential, from the exponents chapter, gives exactly that: the sine keeps its rhythm while its amplitude shrinks by the same fraction every second. The decay rate λ (lambda) controls how quickly; the amplitude halves every ln 2 / λ seconds. A swing left alone, a car's suspension after a bump and a plucked guitar string all move like this.")}
      </p>
      <Equation label={tx(t, "mWv_eqDamp", "Damped sine")}
        where={[
          [r`A`, tx(t, "mWv_wA0", "the starting amplitude")],
          [r`e^{-\lambda t}`, tx(t, "mWv_wEnv", "the envelope: 1 at t = 0, shrinking towards 0")],
          [r`\lambda`, tx(t, "mWv_wLam", "the decay rate per second; 0 means no damping")],
        ]}
        note={tx(t, "mWv_dampNote", "Example: a car body bouncing with A = 5 cm and λ = 4 per second is down to 5 · e^(−2) ≈ 0.68 cm after half a second (λt = 4 · 0.5 = 2), and its amplitude halves every ln 2 / 4 ≈ 0.17 s.")}>
        {r`y(t) = A\,e^{-\lambda t}\,\sin(2\pi f t + \varphi)`}
      </Equation>
      <LiveFormula label={tx(t, "mWv_liveDamp", "Try it: how much swing is left")}
        tex={r`\text{${tx(t, "mWv_liveEnv", "envelope")}} = A\,e^{-\lambda t}`}
        vars={[
          { id: "A", label: "A", min: 1, max: 10, step: 1, value: 5, fmt: num },
          { id: "lam", label: "λ", min: 0, max: 8, step: 0.5, value: 4, fmt: num },
          { id: "t", label: "t (s)", min: 0, max: 3, step: 0.1, value: 0.5, fmt: num },
        ]}
        compute={dampNumbers}
        note={tx(t, "mWv_liveDampNote", "Starts on the car example: A = 5 cm, λ = 4, after 0.5 s about 0.68 cm, 13.5% of the start. The bar is the share of the starting amplitude that is left. Every half-life cuts it in half again.")} />

      <H2>{tx(t, "mWv_lissTitle", "Two directions at once: Lissajous figures")}</H2>
      <p>
        {tx(t, "mWv_lissBody",
          "Give the x and the y of a point their own oscillations: x = sin(at), y = sin(bt + φ). With a = b the point goes round an ellipse, which becomes the unit circle when φ = π/2, because then y = cos(at) and the point is (sin, cos) again. Other whole-number ratios trace closed knots: 1 : 2 a figure eight, 3 : 2 a pretzel. The Lissajous mode of the figure draws them. They appear on an oscilloscope when two electrical signals are compared, and a pendulum free to swing in two directions draws them in sand. When the ratio is not a fraction of whole numbers the curve never closes and slowly fills a rectangle.")}
      </p>

      <H2>{tx(t, "mWv_exTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "mWv_ex1",
          "1. A buoy bobs 0.2 m above and below its rest height of 1 m, once every 2 s. So A = 0.2, C = 1, T = 2 s, f = 0.5 Hz, ω = 2π/2 = π: y(t) = 0.2 sin(πt) + 1. At t = 0.5 s, a quarter period, y = 0.2 · sin(π/2) + 1 = 1.2 m, the top.")}
      </p>
      <p>
        {tx(t, "mWv_ex2",
          "2. In a certain city the day lasts between 10 h and 14 h over the year, longest on day 172 (21 June). So C = 12 h, A = 2 h, T = 365 days. A plain sine peaks a quarter period after it starts, at 365/4 = 91.25 days, so the wave must be delayed by d = 172 − 91.25 = 80.75 days: L(t) = 2 sin(2π(t − 80.75)/365) + 12. Check day 172: 2π · 91.25/365 = π/2, sin = 1, L = 14 h ✓.")}
      </p>
      <p>
        {tx(t, "mWv_ex3",
          "3. Two tuning forks ring at 440 Hz and 443 Hz. Together they swell and fade 3 times per second, the beat frequency |443 − 440|. Piano tuners listen for these beats and adjust the string until they slow down and stop.")}
      </p>

      <H2>{tx(t, "mWv_handTitle", "Waves by hand")}</H2>
      <H3>{tx(t, "mWv_sketchTitle", "Sketching from quarter periods")}</H3>
      <p>
        {tx(t, "mWv_sketchBody",
          "A sine passes through five landmarks in each cycle, one every quarter period: the centre line going up, the top, the centre line going down, the bottom, the centre line again. To sketch y = A sin(ω(t − d)) + C, start at t = d, step by T/4, and plot C, C + A, C, C − A, C; then join them with a smooth wave. For y = 3 sin(πt) + 4: T = 2π/π = 2, so the steps are 0.5 apart.")}
      </p>
      <LessonTable
        headers={["t", "0", "0.5", "1", "1.5", "2"]}
        rows={[
          ["πt", "0", "π/2", "π", "3π/2", "2π"],
          ["sin(πt)", "0", "1", "0", "−1", "0"],
          ["y = 3 sin(πt) + 4", "4", "7", "4", "1", "4"],
        ]}
      />
      <H3>{tx(t, "mWv_fitTitle", "Finding the equation from measurements")}</H3>
      <p>
        {tx(t, "mWv_fitBody",
          "Reverse the sketch. Measurements of a wave show a highest value of 7, a lowest of 1, and peaks at t = 0.5 s and t = 2.5 s. Then C = (7 + 1)/2 = 4 and A = (7 − 1)/2 = 3. The peaks are 2 s apart, so T = 2 s and ω = 2π/T = π. A plain sine peaks a quarter period (0.5 s) after it starts; here the peak is at 0.5 s, so the wave starts at t = 0 and d = 0. Result: y = 3 sin(πt) + 4, the wave of the table above.")}
      </p>
      <LiveFormula label={tx(t, "mWv_liveFit", "Try it: a wave from three measurements")}
        tex={r`C = \frac{\max + \min}{2} \qquad A = \frac{\max - \min}{2} \qquad \omega = \frac{2\pi}{T}`}
        vars={[
          { id: "max", label: tx(t, "mWv_liveMax", "highest value"), min: -5, max: 10, step: 0.5, value: 7, fmt: num },
          { id: "min", label: tx(t, "mWv_liveMin", "lowest value"), min: -5, max: 10, step: 0.5, value: 1, fmt: num },
          { id: "T", label: tx(t, "mWv_liveT", "peak to peak T (s)"), min: 0.5, max: 12, step: 0.5, value: 2, fmt: num },
        ]}
        compute={v => fitNumbers(v, t)}
        note={tx(t, "mWv_liveFitNote", "It starts on the measurements above: 7, 1 and 2 s give y = 3 sin(πt) + 4 (ω ≈ 3.142 is π). The phase still has to be read from where the first peak sits, a quarter period after the wave starts.")} />
      <H3>{tx(t, "mWv_combTitle", "Combining a sine and a cosine, step by step")}</H3>
      <p>
        {tx(t, "mWv_combBody2",
          "Write 3 sin t + 4 cos t as one wave R sin(t + φ). Expand the target, match it term by term with the given mix, then solve for R and φ.")}
      </p>
      <Derivation t={t} label={tx(t, "mWv_eqComb", "3 sin t + 4 cos t as one wave")}
        note={tx(t, "mWv_combNote", "The combined wave's largest value is R = 5, reached when t + 53.1° = 90°, at t = 36.9°.")}
        steps={[
          { full: true, tex: r`R\sin(t + \varphi) = R\cos\varphi\,\sin t + R\sin\varphi\,\cos t`, why: tx(t, "mWv_cb1", "expand the target with the angle-sum formula") },
          { full: true, tex: r`R\cos\varphi = 3 \qquad R\sin\varphi = 4`, why: tx(t, "mWv_cb2", "match the coefficients of sin t and of cos t with 3 sin t + 4 cos t") },
          { full: true, tex: r`R^2(\cos^2\varphi + \sin^2\varphi) = 9 + 16 \;\Rightarrow\; R = 5`, why: tx(t, "mWv_cb3", "square both equations and add them; the bracket is 1, so R² = 25") },
          { full: true, tex: r`\tan\varphi = \tfrac43 \;\Rightarrow\; \varphi \approx 53.1^\circ`, why: tx(t, "mWv_cb4", "divide the second equation by the first; cos φ and sin φ are both positive, so φ is in quadrant I") },
          { full: true, tex: r`\green{3\sin t + 4\cos t = 5\sin(t + 53.1^\circ)}`, why: tx(t, "mWv_cb5", "put R and φ back into the target") },
        ]} />

      <H2>{tx(t, "mWv_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mWv_tWrong", "Wrong"), tx(t, "mWv_tRight", "Right"), tx(t, "mWv_tWhy", "Why")]}
        rows={[
          ["sin(f t)", "sin(2π f t)", tx(t, "mWv_m1", "without 2π, f = 1 gives one cycle every 6.28 s, not every second")],
          [tx(t, "mWv_m2w", "\"f = 2 s\""), tx(t, "mWv_m2r", "T = 2 s, so f = 0.5 Hz"), tx(t, "mWv_m2", "the period counts seconds per cycle; the frequency counts cycles per second")],
          [tx(t, "mWv_m3w", "A = max − min"), tx(t, "mWv_m3r", "A = (max − min)/2"), tx(t, "mWv_m3", "the amplitude is measured from the centre line, not from bottom to top")],
          [tx(t, "mWv_m4w", "phase in degrees"), tx(t, "mWv_m4r", "phase in radians"), tx(t, "mWv_m4", "sin takes radians, including the phase")],
          [tx(t, "mWv_m5w", "damping with e^(λt)"), tx(t, "mWv_m5r", "e^(−λt), with the minus sign"), tx(t, "mWv_m5", "without it the swing grows instead of dying away")],
        ]}
      />

      <KeyIdeas t={t} id="mWv" items={[
        "The height of a point going round a circle at speed ω is sin ωt: simple harmonic motion.",
        "A sin(2πft + φ) + C: amplitude, frequency, phase, offset; T = 1/f, ω = 2πf.",
        "a sin ωt + b cos ωt is one wave with amplitude √(a² + b²) and phase atan2(b, a).",
        "Close frequencies beat; harmonics added together build square and sawtooth waves.",
        "A e^(−λt) sin(…) dies away: swings, springs, plucked strings.",
        "From a graph: C = (max + min)/2, A = (max − min)/2, T = peak to peak.",
      ]} />
    </Article>
  );
}
