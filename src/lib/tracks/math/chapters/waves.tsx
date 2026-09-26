"use client";

// Trigonometry 6: waves and oscillation — circular motion seen from the side,
// the sinusoid and its four parameters, period, frequency and phase, adding
// waves (same frequency, beats, harmonics and Fourier), damped oscillation,
// Lissajous figures, and oscillators in C++.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { WaveFigure } from "@/components/lesson/figures/math/WaveFigure";
import { HarmonicsFigure } from "@/components/lesson/figures/math/HarmonicsFigure";

const r = String.raw;

export function WavesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mWv_intro",
          "Things that go back and forth are everywhere in games: a coin bobbing, a torch flickering, a flag waving, the sun rising and setting, water, sound, screen shake. Almost all of them are built from one shape, the sine wave, stretched, shifted and added together. This chapter shows where the wave comes from, what each of its numbers controls, and how combining waves gives square waves, beats, figure eights and motion that dies down.")}
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
          [r`\varphi`, tx(t, "mTrig_wPhi", "the phase: a head start along the cycle, in radians. Giving each object a different φ keeps a row of bobbing coins from moving in lockstep")],
          [r`C`, tx(t, "mTrig_wC", "the offset: the centre line")],
        ]}>
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
        note={tx(t, "mWv_relNote", "Example: a warning light pulses twice per second: f = 2 Hz, T = 0.5 s, ω = 4π ≈ 12.57 rad/s. To make a second light lag a quarter cycle behind, delay it by T/4 = 0.125 s, which is a phase of −π/2.")}>
        {r`T = \frac{1}{f} \qquad \omega = 2\pi f = \frac{2\pi}{T} \qquad \sin\big(\omega(t - d)\big) = \sin(\omega t - \omega d)`}
      </Equation>
      <p>
        {tx(t, "mTrig_waveUses",
          "Uses are everywhere: a hovering pickup bobs with A = 0.1 m and f = 0.5 Hz, a warning light pulses its brightness, a day–night cycle drives the sun's height with a period of 20 minutes, water surfaces sum several sines of different directions and frequencies (Gerstner waves in the GLSL track), and an idle character breathes by scaling its chest. Adding sines with unrelated frequencies gives motion that never visibly repeats, a cheap alternative to noise.")}
      </p>
      <Callout type="tip" t={t}>
        {tx(t, "mTrig_timeTip", "sin(time · ω) with a float time that keeps growing loses precision after hours: at time = 100 000 s, float time has a resolution of about 8 ms, and fast waves stutter. Wrap the phase instead: phase = fmod(phase + ω·dt, 2π).")}
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
      <p>
        {tx(t, "mWv_beatsBody",
          "Waves with slightly different frequencies drift in and out of step: in step they reinforce, out of step they cancel, and the sum swells and fades at the difference of the two frequencies. The second-wave button of the figure above shows these beats. Waves with frequencies that are whole multiples of a base frequency, f, 2f, 3f and so on, are its harmonics. Adding harmonics with the right amplitudes builds almost any repeating shape; that is Fourier's discovery, and the harmonics mode below builds a square wave and a sawtooth out of plain sines.")}
      </p>

      <HarmonicsFigure t={t} />

      <Equation label={tx(t, "mWv_eqSquare", "A square wave as a sum of sines")}
        where={[
          [r`\sin(k x)/k`, tx(t, "mWv_wK", "the k-th harmonic: k times the frequency, 1/k of the amplitude")],
          [r`\tfrac{4}{\pi}`, tx(t, "mWv_w4pi", "a scale factor that makes the flat parts come out at exactly ±1")],
        ]}>
        {r`\text{square}(x) = \frac{4}{\pi}\left(\sin x + \frac{\sin 3x}{3} + \frac{\sin 5x}{5} + \frac{\sin 7x}{7} + \cdots\right)`}
      </Equation>

      <H2>{tx(t, "mWv_dampTitle", "Damped oscillation")}</H2>
      <p>
        {tx(t, "mWv_dampBody",
          "Real oscillations lose energy and die down. Multiplying a sine by a decaying exponential, from the exponents chapter, gives exactly that: the sine keeps its rhythm while its amplitude shrinks by the same fraction every second. The decay rate λ (lambda) controls how quickly; the amplitude halves every ln 2 / λ seconds. This is the classic screen shake: offset the camera by a damped sine each frame after an explosion, with a new random phase per axis so it does not shake along a line.")}
      </p>
      <Equation label={tx(t, "mWv_eqDamp", "Damped sine")}
        where={[
          [r`A`, tx(t, "mWv_wA0", "the starting amplitude")],
          [r`e^{-\lambda t}`, tx(t, "mWv_wEnv", "the envelope: 1 at t = 0, shrinking towards 0")],
          [r`\lambda`, tx(t, "mWv_wLam", "the decay rate per second; 0 means no damping")],
        ]}
        note={tx(t, "mWv_dampNote", "Example: a shake with A = 0.5 m and λ = 4/s is down to 0.5 · e^(−2) ≈ 0.07 m after half a second, and its amplitude halves every ln 2 / 4 ≈ 0.17 s.")}>
        {r`y(t) = A\,e^{-\lambda t}\,\sin(2\pi f t + \varphi)`}
      </Equation>

      <H2>{tx(t, "mWv_lissTitle", "Two directions at once: Lissajous figures")}</H2>
      <p>
        {tx(t, "mWv_lissBody",
          "Give the x and the y of a point their own oscillations: x = sin(at), y = sin(bt + φ). With a = b the point goes round an ellipse, which becomes the unit circle when φ = π/2, because then y = cos(at) and the point is (sin, cos) again. Other whole-number ratios trace closed knots: 1 : 2 a figure eight, 3 : 2 a pretzel. The Lissajous mode of the figure draws them. They make cheap organic paths: a hovering drone, an idle camera sway or a firefly that never quite retraces itself if the ratio is not a whole number.")}
      </p>

      <H2>{tx(t, "mWv_exTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "mWv_ex1",
          "1. A coin should bob 0.2 m above and below a height of 1 m, once every 2 s. So A = 0.2, C = 1, T = 2 s, f = 0.5 Hz, ω = π: y(t) = 0.2 sin(πt) + 1. A row of coins with phase φ = 0.5 · i for coin i makes a travelling ripple.")}
      </p>
      <p>
        {tx(t, "mWv_ex2",
          "2. A day in the game lasts 20 minutes (1200 s) and the sun's height should be sin of the time of day, highest at noon. ω = 2π / 1200 ≈ 0.00524 rad/s; start at sunrise with φ = 0, so noon comes at t = 300 s, a quarter period, where the sine is 1.")}
      </p>
      <p>
        {tx(t, "mWv_ex3",
          "3. Two engines hum at 100 Hz and 103 Hz. Together they swell and fade 3 times per second, the beat frequency |103 − 100|.")}
      </p>

      <H2>{tx(t, "mWv_codeTitle", "Oscillators in C++")}</H2>
      <p>
        {tx(t, "mWv_codeBody",
          "The Oscillator keeps its own phase and wraps it, so it stays precise however long the game runs, and changing its frequency does not make it jump. The Shake is a damped sine per axis with random phases, triggered by an impact.")}
      </p>
      <CodeBlock lang="cpp" filename="oscillators.hpp" t={t}>{`#include <cmath>
#include <numbers>

constexpr float TAU = 2.0f * std::numbers::pi_v<float>;

struct Oscillator {
    float amplitude = 1, frequency = 1, offset = 0;    // A, f (Hz), C
    float phase = 0;                                   // radians, kept in [0, 2π)
    float update(float dt) {
        phase = std::fmod(phase + TAU * frequency * dt, TAU);   // wrap: no precision loss
        return amplitude * std::sin(phase) + offset;
    }
};

// Damped screen shake: A e^(-λt) sin(2πft + φ) on each axis
struct Shake {
    float amplitude = 0, decay = 4, frequency = 18, t = 0, phaseX = 0, phaseY = 1.7f;
    void trigger(float strength, float randomPhase) { amplitude = strength; t = 0; phaseX = randomPhase; }
    void offset(float dt, float& dx, float& dy) {
        t += dt;
        float env = amplitude * std::exp(-decay * t);    // the shrinking envelope
        dx = env * std::sin(TAU * frequency * t + phaseX);
        dy = env * std::sin(TAU * frequency * 1.3f * t + phaseY);  // different rate per axis
    }
};

// A point on a Lissajous path: x = sin(a t), y = sin(b t + φ), scaled by size
void lissajous(float t, float a, float b, float phi, float size, float& x, float& y) {
    x = size * std::sin(a * t);
    y = size * std::sin(b * t + phi);
}`}</CodeBlock>

      <H2>{tx(t, "mWv_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mWv_tWrong", "Wrong"), tx(t, "mWv_tRight", "Right"), tx(t, "mWv_tWhy", "Why")]}
        rows={[
          ["sin(f * t)", "sin(2π * f * t)", tx(t, "mWv_m1", "without 2π, f = 1 gives one cycle every 6.28 s, not every second")],
          [tx(t, "mWv_m2w", "changing f while computing sin(2πf · time)"), tx(t, "mWv_m2r", "accumulate the phase: phase += 2πf · dt"), tx(t, "mWv_m2", "a new f with the same large time jumps to a different point of the cycle")],
          [tx(t, "mWv_m3w", "all objects share one sin(time)"), tx(t, "mWv_m3r", "give each its own phase"), tx(t, "mWv_m3", "identical timing looks mechanical")],
          [tx(t, "mWv_m4w", "phase in degrees"), tx(t, "mWv_m4r", "phase in radians"), tx(t, "mWv_m4", "sin takes radians, including the phase")],
          [tx(t, "mWv_m5w", "screen shake with a plain sine"), tx(t, "mWv_m5r", "damp it with e^(−λt)"), tx(t, "mWv_m5", "an undamped shake never stops")],
        ]}
      />

      <KeyIdeas t={t} id="mWv" items={[
        "The height of a point going round a circle at speed ω is sin ωt: simple harmonic motion.",
        "A sin(2πft + φ) + C: amplitude, frequency, phase, offset; T = 1/f, ω = 2πf.",
        "a sin ωt + b cos ωt is one wave with amplitude √(a² + b²) and phase atan2(b, a).",
        "Close frequencies beat; harmonics added together build square and sawtooth waves.",
        "A e^(−λt) sin(…) dies away: screen shake, springs, plucked strings.",
        "Wrap the phase instead of feeding an ever-growing time into sin.",
      ]} />
    </Article>
  );
}
