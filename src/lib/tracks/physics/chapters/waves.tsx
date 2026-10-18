"use client";

// Oscillations & Waves 3: waves — a travelling disturbance that carries
// energy, not matter; transverse and longitudinal; wavelength, period,
// v = f λ; the wave function y = A sin(kx − ωt) and why it moves; the wave
// speed on a string v = √(T/μ) derived from Newton's law on a small piece
// (the wave equation); energy ∝ A² f²; superposition, reflection at fixed and
// free ends; standing waves, nodes, harmonics f_n = n v / 2L, Mersenne's laws,
// and the many harmonics of a real string.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { WaveFigure } from "@/components/lesson/figures/physics/WaveFigure";
import { StandingWaveFigure } from "@/components/lesson/figures/physics/StandingWaveFigure";

const r = String.raw;
const num = (v: number, d = 1) => String(+v.toFixed(d)).replace("-", "−");

// ── Live formulas: the numbers plugged in ─────────────────────────────────────

/** Fundamental of a string fixed at both ends: f₁ = √(T/μ) / 2L (μ entered in g/m). */
const stringNumbers = (t: TrackTranslations) => (v: Record<string, number>) => {
  const mu = v.mu / 1000, speed = Math.sqrt(v.T / mu), f1 = speed / (2 * v.L);
  return {
    tex: r`f_1 = \frac{1}{2 \times ${num(v.L, 2)}} \sqrt{\frac{${num(v.T, 0)}}{${num(mu, 5)}}} = \frac{${num(speed, 0)}}{${num(2 * v.L, 2)}} = \amber{${num(f1, 1)}\ \text{Hz}}`,
    meter: Math.min(1, f1 / 1000), meterLabel: `v = √(T/μ) = ${num(speed, 0)} m/s · ${tx(t, "phWave_liveNext", "next harmonics")} ${num(2 * f1, 0)}, ${num(3 * f1, 0)} Hz`,
  };
};

export function WavesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "phWave_intro",
          "Flick one end of a rope and a bump runs along it to the far end. The rope itself has not gone anywhere: each bit of it moved up, then down, and passed the motion on to the next bit. That travelling disturbance is a wave. Waves carry energy and information across a distance without carrying matter with them, and they are everywhere: ripples on a pond, sound, earthquakes, light, radio. This chapter builds the language for all of them on the simplest case, a stretched string.")}
      </Lead>

      <Goals t={t} id="phWave" items={[
        "Explain what a wave carries, and tell transverse from longitudinal waves.",
        "Use the wave function y = A sin(kx − ωt) and the relation v = f λ.",
        "Derive the speed of a wave on a string from its tension and its mass per length.",
        "Explain superposition, reflection and standing waves, and find the harmonics of a string.",
      ]} />

      <H2>{tx(t, "phWave_whatTitle", "What a wave is")}</H2>
      <p>
        {tx(t, "phWave_whatBody",
          "A mechanical wave needs a medium: a string, water, air, rock. Each small part of the medium is held in place by its neighbours, like the blocks and springs of the last two chapters linked in a long chain. Push one part and its springs push the next one, a moment later, and so on. Every part only oscillates around its own resting place; what moves along is the pattern. A stadium wave works the same way: each fan stands up and sits down, and the wave runs round the stadium.")}
      </p>
      <LessonTable
        headers={[tx(t, "phWave_tKind", "Kind"), tx(t, "phWave_tMotion", "The medium moves"), tx(t, "phWave_tEx", "Examples")]}
        rows={[
          [tx(t, "phWave_k1", "transverse"), tx(t, "phWave_k1m", "across the direction the wave travels"), tx(t, "phWave_k1e", "a wave on a string, the S waves of an earthquake, light (with fields instead of matter)")],
          [tx(t, "phWave_k2", "longitudinal"), tx(t, "phWave_k2m", "along the direction the wave travels, in squeezes and stretches"), tx(t, "phWave_k2e", "sound, a pushed slinky, the P waves of an earthquake")],
        ]}
      />
      <WaveFigure t={t} />

      <H2>{tx(t, "phWave_descTitle", "Describing a travelling wave")}</H2>
      <p>
        {tx(t, "phWave_descBody",
          "A wave has two pictures. Freeze it in time, like a photograph, and you see a shape in space: the distance from one crest to the next is the wavelength λ (the Greek letter lambda). Watch one point of the string instead, and you see an oscillation in time, with a period T and a frequency f = 1/T. The two are linked: in one period, each crest moves forward exactly one wavelength, so the wave travels at v = λ / T.")}
      </p>
      <Equation label={tx(t, "phWave_eqSpeed", "The wave relation")}
        where={[
          [r`v`, tx(t, "phWave_wV", "the speed of the wave: how fast a crest moves (m/s)")],
          [r`f`, tx(t, "phWave_wF", "the frequency: crests passing a point per second (Hz)")],
          [r`\lambda`, tx(t, "phWave_wL", "the wavelength: crest-to-crest distance (m)")],
        ]}
        words={tx(t, "phWave_speedWords", "Speed equals the number of crests per second times the distance between them.")}
        note={tx(t, "phWave_speedNote", "The speed is set by the medium (how stiff, how heavy). The frequency is set by whatever makes the wave. The wavelength then follows: shake faster and the crests crowd together, at the same speed.")}>
        {r`v = f \lambda = \frac{\lambda}{T}`}
      </Equation>
      <LessonTable
        headers={[tx(t, "phWave_tWave", "Wave"), "v", "f", "λ = v/f"]}
        rows={[
          [tx(t, "phWave_e1", "the note A in air"), "343 m/s", "440 Hz", "78 cm"],
          [tx(t, "phWave_e2", "lowest sound we hear"), "343 m/s", "20 Hz", "17 m"],
          [tx(t, "phWave_e3", "highest sound we hear"), "343 m/s", "20 000 Hz", "1.7 cm"],
          [tx(t, "phWave_e4", "an FM radio station"), "300 000 km/s", "100 MHz", "3 m"],
          [tx(t, "phWave_e5", "an ocean swell"), "≈ 16 m/s", "0.1 Hz", "≈ 160 m"],
        ]}
      />

      <H3>{tx(t, "phWave_funcTitle", "The wave function")}</H3>
      <p>
        {tx(t, "phWave_funcBody",
          "To describe the whole string at every moment we need the displacement y as a function of both position x and time t. For a sine-shaped wave moving to the right, it is y = A sin(kx − ωt). Two new constants turn distances and times into angles: the wave number k = 2π/λ (radians per metre), so that the sine repeats every wavelength, and the angular frequency ω = 2πf, as in simple harmonic motion.")}
      </p>
      <Derivation t={t} label={tx(t, "phWave_eqMoves", "Why kx − ωt moves to the right at v = ω/k")}
        steps={[
          { tex: r`y(x, t) = A \sin(kx - \omega t)`, why: tx(t, "phWave_f1", "at a fixed x this is simple harmonic motion in time; at a fixed t it is a sine curve in space") },
          { tex: r`kx - \omega t = \text{const}`, why: tx(t, "phWave_f2", "follow one crest: the angle inside the sine must stay the same") },
          { tex: r`x = \frac{\omega}{k}\, t + \text{const}`, why: tx(t, "phWave_f3", "solve for x: as t grows, the crest's position grows steadily") },
          { tex: r`\green{v = \frac{\omega}{k} = \frac{2\pi f}{2\pi/\lambda} = f\lambda}`, why: tx(t, "phWave_f4", "the same wave relation as before; a plus sign, kx + ωt, would move left") },
        ]} />

      <H2>{tx(t, "phWave_speedTitle", "How fast a wave runs along a string")}</H2>
      <p>
        {tx(t, "phWave_stringBody",
          "Two properties of the string set the speed: the tension T (in newtons) that pulls it straight, and its mass per unit length μ (the Greek letter mu, in kg/m). Tension is the restoring force; mass per length is the inertia. Units alone almost give the answer: N / (kg/m) = (kg·m/s²)·(m/kg) = m²/s², so √(T/μ) is a speed. Newton's second law on a tiny piece of string confirms it, and gives the number in front, exactly 1.")}
      </p>
      <Derivation t={t} label={tx(t, "phWave_eqWaveEq", "The wave equation for a string")}
        steps={[
          { tex: r`m = \mu\, \Delta x`, why: tx(t, "phWave_w1", "a short piece of length Δx has mass μ Δx") },
          { tex: r`F_y = T \left( \frac{\partial y}{\partial x}\Big|_{x+\Delta x} - \frac{\partial y}{\partial x}\Big|_{x} \right) \approx T\, \frac{\partial^2 y}{\partial x^2}\, \Delta x`, why: tx(t, "phWave_w2", "the tension pulls along the string at each end; for small slopes the up-down part of each pull is T times the slope there, and the difference of the slopes is the curvature times Δx") },
          { tex: r`\mu\, \Delta x\, \frac{\partial^2 y}{\partial t^2} = T\, \frac{\partial^2 y}{\partial x^2}\, \Delta x`, why: tx(t, "phWave_w3", "Newton's second law, F = m a, for the up-down motion of the piece") },
          { tex: r`\green{\frac{\partial^2 y}{\partial t^2} = v^2\, \frac{\partial^2 y}{\partial x^2}, \qquad v = \sqrt{\frac{T}{\mu}}}`, why: tx(t, "phWave_w4", "the wave equation: any shape f(x − vt) solves it, so every shape travels unchanged at v") },
        ]} />
      <p>
        {tx(t, "phWave_stringBody2",
          "The symbol ∂ means a partial derivative: the rate of change with respect to one variable while the other is held fixed (Math track, partial derivatives; the wave equation itself is solved in the chapter on partial differential equations). A curved piece of string accelerates towards straightening out, faster where the curve is sharper. A tighter string snaps back faster; a heavier one responds more slowly. A rope of 0.3 kg/m under 120 N carries waves at √(120/0.3) = 20 m/s.")}
      </p>

      <H3>{tx(t, "phWave_energyTitle", "Waves carry energy")}</H3>
      <p>
        {tx(t, "phWave_energyBody",
          "Every bit of a string carrying a wave is a small oscillator, with energy ½ k A² as in simple harmonic motion, and its stiffness k grows with ω². So the energy a wave carries grows with the square of its amplitude and the square of its frequency. For a string the power is P = ½ μ v ω² A². Double the amplitude and you send four times the power. This A² rule holds for every wave, from sound to light.")}
      </p>

      <H2>{tx(t, "phWave_superTitle", "Superposition")}</H2>
      <p>
        {tx(t, "phWave_superBody",
          "When two waves meet on the same string, the displacements simply add: y = y₁ + y₂. This is the principle of superposition. It holds whenever the medium's restoring force is proportional to the displacement, which is true for small waves. Two pulses running towards each other overlap, add up for a moment, and then pass through each other and go on unchanged, as if the other had never been there. Where crest meets crest the waves reinforce (constructive interference); where crest meets trough they cancel (destructive interference).")}
      </p>
      <H3>{tx(t, "phWave_reflTitle", "Reflection")}</H3>
      <p>
        {tx(t, "phWave_reflBody",
          "At the end of a string a wave bounces back. If the end is tied to a wall, the returning pulse is upside down: the wall pulls the string the opposite way to stay still. You can see this by superposition: picture an imaginary upside-down pulse coming from beyond the wall; the two always cancel exactly at the wall, which keeps that point at rest. If the end is free, for instance a ring that slides on a smooth pole, the pulse comes back upright. Where a light string joins a heavy one, part of the wave goes on and part reflects, upside down; going from heavy to light, the reflected part is upright.")}
      </p>

      <H2>{tx(t, "phWave_standTitle", "Standing waves")}</H2>
      <p>
        {tx(t, "phWave_standBody",
          "Send a steady wave down a string tied at the far end. The reflection comes back the other way, with the same frequency and amplitude, and the two overlap. Adding two identical waves moving in opposite directions gives something that does not move along at all.")}
      </p>
      <Derivation t={t} label={tx(t, "phWave_eqStand", "Two opposite waves make a standing wave")}
        steps={[
          { tex: r`y = A\sin(kx - \omega t) + A\sin(kx + \omega t)`, why: tx(t, "phWave_s1", "a wave going right plus the same wave going left") },
          { tex: r`\sin a + \sin b = 2 \sin\tfrac{a+b}{2} \cos\tfrac{a-b}{2}`, why: tx(t, "phWave_s2", "the sum-to-product identity from trigonometry") },
          { tex: r`\green{y = 2A \sin(kx)\, \cos(\omega t)}`, why: tx(t, "phWave_s3", "the shape sin(kx) stays put; the whole of it just grows and shrinks in time") },
        ]} />
      <p>
        {tx(t, "phWave_standBody2",
          "Wherever sin(kx) = 0 the string never moves: those points are nodes, half a wavelength apart. Halfway between them are the antinodes, where it swings most. On a string tied at both ends, both ends must be nodes, so a whole number n of half wavelengths must fit exactly into the length L: L = n λ/2. Only those wavelengths, and so only those frequencies, can form a standing wave. They are the string's harmonics, or normal modes.")}
      </p>
      <Equation label={tx(t, "phWave_eqHarm", "Harmonics of a string fixed at both ends")}
        where={[
          [r`f_n`, tx(t, "phWave_wFn", "the frequency of harmonic number n (Hz)")],
          [r`n`, tx(t, "phWave_wN", "1, 2, 3, …: the number of loops between the ends")],
          [r`v`, tx(t, "phWave_wV2", "the wave speed on the string, √(T/μ)")],
          [r`L`, tx(t, "phWave_wLen", "the length of string free to vibrate (m)")],
        ]}
        words={tx(t, "phWave_harmWords", "A string can only ring at whole-number multiples of its lowest frequency.")}
        note={tx(t, "phWave_harmNote", "n = 1 is the fundamental, with one loop and λ = 2L. The others are exact multiples: 2f₁, 3f₁, 4f₁ and so on.")}>
        {r`f_n = n\, \frac{v}{2L} = \frac{n}{2L} \sqrt{\frac{T}{\mu}}`}
      </Equation>
      <StandingWaveFigure t={t} />
      <LessonTable
        headers={["n", tx(t, "phWave_tLam", "Wavelength"), tx(t, "phWave_tFreq", "Frequency (L = 65 cm, f₁ = 220 Hz)"), tx(t, "phWave_tNodes", "Nodes, ends included"), tx(t, "phWave_tMusic", "Musically")]}
        rows={[
          ["1", "2L = 130 cm", "220 Hz", "2", tx(t, "phWave_h1", "the note itself (A3)")],
          ["2", "L = 65 cm", "440 Hz", "3", tx(t, "phWave_h2", "an octave higher")],
          ["3", "2L/3 = 43 cm", "660 Hz", "4", tx(t, "phWave_h3", "an octave and a fifth")],
          ["4", "L/2 = 32.5 cm", "880 Hz", "5", tx(t, "phWave_h4", "two octaves")],
        ]}
      />
      <p>
        {tx(t, "phWave_mersBody",
          "The formula contains every rule a string player knows, found by Marin Mersenne in 1636. Press the string against a fret and L gets shorter: the pitch rises. Tighten the peg and T rises: so does the pitch, but only as √T, so a 12% increase in tension raises the note by a semitone (6%). The low strings of a guitar are thicker and often wound with wire to make μ large, so that they can sound low without being slack or very long.")}
      </p>
      <LiveFormula label={tx(t, "phWave_liveString", "Try it: tune a string")}
        tex={r`f_1 = \frac{1}{2L} \sqrt{\frac{T}{\mu}}`}
        vars={[
          { id: "L", label: "L (m)", min: 0.3, max: 1.2, step: 0.01, value: 0.65, fmt: v => `${num(v, 2)} m` },
          { id: "T", label: "T (N)", min: 20, max: 150, step: 1, value: 72, fmt: v => `${num(v, 0)} N` },
          { id: "mu", label: "μ (g/m)", min: 0.2, max: 8, step: 0.01, value: 0.39, fmt: v => `${num(v, 2)} g/m` },
        ]}
        compute={stringNumbers(t)}
        note={tx(t, "phWave_liveStringNote", "The defaults are a guitar's thin top string: steel 0.25 mm thick (μ = 0.39 g/m), 65 cm long, at about 72 N, which gives 330 Hz, the note E4. Raise μ to about 6.4 g/m, like the thickest wound string, and the same tension and length give a note two octaves lower.")} />

      <H3>{tx(t, "phWave_timbreTitle", "Many harmonics at once")}</H3>
      <p>
        {tx(t, "phWave_timbreBody",
          "A plucked string does not vibrate in just one mode. The pluck gives it a kinked shape, and by superposition that shape is a sum of many harmonics, each swinging at its own frequency. The mix of harmonics, how strong each one is, is what gives an instrument its character, its timbre: a guitar and a piano playing the same note share the frequencies but not the mix (see the Music track, Timbre and Harmonics, and the Fourier series in the Math track, which says how any shape splits into sines). Touch the string lightly at its middle while it rings and you force a node there: every odd harmonic dies and the string jumps up an octave. Guitarists call it a natural harmonic.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "phWave_water", "Waves on deep water are neither transverse nor longitudinal: each bit of water moves in a small circle, up and forward under a crest, down and back under a trough. A floating leaf bobs in circles as the waves pass, and stays roughly where it was.")}
      </Callout>

      <H2>{tx(t, "phWave_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "phWave_ex1", "1. You shake a rope 5 times a second and the crests are 0.8 m apart. v = f λ = 5 × 0.8 = 4 m/s.")}</p>
      <p>{tx(t, "phWave_ex2", "2. The same rope, shaken 10 times a second: the speed is still 4 m/s (set by the rope), so λ = 4/10 = 0.4 m.")}</p>
      <p>{tx(t, "phWave_ex3", "3. A guitar's A string is 65 cm long and sounds 110 Hz. The wave speed on it is v = 2 L f₁ = 2 × 0.65 × 110 = 143 m/s. Its third harmonic is 330 Hz, with nodes every 65/3 = 21.7 cm.")}</p>
      <p>{tx(t, "phWave_ex4", "4. A 1.2 m string fixed at both ends has v = 48 m/s. f₁ = 48/2.4 = 20 Hz. At 60 Hz it forms its third harmonic, with nodes at 0, 0.4, 0.8 and 1.2 m.")}</p>
      <p>{tx(t, "phWave_ex5", "5. How much more tension raises a string by an octave? f ∝ √T, so doubling f needs four times the tension. That is why strings are tuned with fine pegs: small changes in T make big changes in pitch.")}</p>

      <H2>{tx(t, "phWave_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "phWave_tWrong", "Wrong"), tx(t, "phWave_tRight", "Right"), tx(t, "phWave_tWhy", "Why")]}
        rows={[
          [tx(t, "phWave_m1w", "the medium travels with the wave"), tx(t, "phWave_m1r", "only the pattern and the energy travel"), tx(t, "phWave_m1", "each bit just oscillates around its place")],
          [tx(t, "phWave_m2w", "shaking faster makes the wave faster"), tx(t, "phWave_m2r", "it makes λ shorter"), tx(t, "phWave_m2", "v is set by the medium: v = √(T/μ) for a string")],
          [tx(t, "phWave_m3w", "the speed of the wave = the speed of the string"), tx(t, "phWave_m3r", "two different speeds"), tx(t, "phWave_m3", "the crest moves along at v; each bit moves up and down at up to ω A")],
          [tx(t, "phWave_m4w", "a standing wave is a wave that stopped"), tx(t, "phWave_m4r", "two travelling waves added"), tx(t, "phWave_m4", "energy still flows both ways; the pattern stays put")],
          [tx(t, "phWave_m5w", "any frequency makes a standing wave on a string"), tx(t, "phWave_m5r", "only f_n = n v / 2L"), tx(t, "phWave_m5", "both fixed ends must be nodes")],
          [tx(t, "phWave_m6w", "the wavelength of the fundamental is L"), tx(t, "phWave_m6r", "λ₁ = 2L"), tx(t, "phWave_m6", "one loop is half a wavelength")],
        ]}
      />

      <KeyIdeas t={t} id="phWave" items={[
        "A wave is a travelling disturbance: it carries energy and information, not matter. Transverse waves move the medium across, longitudinal along.",
        "v = f λ: the medium sets the speed, the source sets the frequency, and the wavelength follows.",
        "A sine wave moving right is y = A sin(kx − ωt), with k = 2π/λ and ω = 2πf, travelling at ω/k.",
        "On a string v = √(T/μ), from Newton's law on a small piece: the wave equation.",
        "Waves add (superposition); a fixed end reflects a pulse upside down, a free end upright.",
        "Opposite waves make a standing wave with nodes λ/2 apart; a string fixed at both ends rings only at f_n = n v / 2L.",
      ]} />
    </Article>
  );
}
