"use client";

// Sound: timbre — why the same note sounds different on different instruments.
// A pitched sound repeats at f but is not a sine; Fourier's sum turns its shape
// into a recipe of harmonics at f, 2f, 3f… A string makes exactly those
// frequencies (standing waves), the spectrum shows the recipe, the ear mostly
// ignores phase and even fills in a missing fundamental. Attack and formants
// are the rest of the story.

import { H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { MusicHarmonicBuilderFigure } from "@/components/lesson/figures/music/HarmonicBuilderFigure";
import { MusicHarmonicSeriesFigure } from "@/components/lesson/figures/music/HarmonicSeriesFigure";
import { MusicSpectrumFigure } from "@/components/lesson/figures/music/SpectrumFigure";
import { harmonicNumbers, stringNumbers } from "../live/timbre";

const r = String.raw;

export function TimbreContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "musTim_intro",
          "Play the same A on a piano, a flute and a violin, equally loud. The pitch is the same, the loudness is the same, and yet you can tell the three apart instantly, even over a bad phone line. That quality is called timbre (say \"TAM-ber\"), or tone colour. This chapter shows where it comes from: the shape of the wave, and the recipe of pure tones hidden inside that shape.")}
      </Lead>

      <Goals t={t} id="musTim" items={[
        "Explain why two instruments playing the same note sound different.",
        "Describe a repeating wave as a sum of harmonics at f, 2f, 3f…",
        "Derive why a string vibrates at whole-number multiples of its lowest frequency.",
        "Read a spectrum and recognise the recipes of a sine, a square and a sawtooth wave.",
        "Explain the missing fundamental and why phase barely changes the sound.",
      ]} />

      <H2>{tx(t, "musTim_shapeTitle", "Same note, different shapes")}</H2>
      <p>
        {tx(t, "musTim_shapeBody",
          "Chapter 1 used the simplest sound, a pure tone, whose pressure follows a sine wave. Real instruments almost never make one. Record a violin playing A3 and the pressure wave has a jagged, sawtooth-like shape; a clarinet's looks closer to a square; a flute's is nearly smooth. What all of them share is that the shape repeats 220 times a second. As chapter 2 promised, that repetition rate is what you hear as the pitch. The shape inside each repetition is what you hear as the timbre.")}
      </p>

      <H2>{tx(t, "musTim_fourierTitle", "Every shape is a sum of sines")}</H2>
      <p>
        {tx(t, "musTim_fourierBody",
          "In 1807 the French mathematician Joseph Fourier claimed something surprising: any shape that repeats with frequency f can be built by adding up pure sine waves whose frequencies are f, 2f, 3f, 4f and so on, each with its own amplitude. These ingredients are called harmonics. Harmonic 1, at f itself, is the fundamental; harmonic n is at n·f. So a shape is a recipe: how much of each harmonic to add.")}
      </p>
      <Equation label={tx(t, "musTim_eqFourier", "A repeating sound as a sum of harmonics")}
        where={[
          [r`p(t)`, tx(t, "musTim_wP", "the pressure at your ear at time t, above or below normal, as in chapter 1")],
          [r`\sum_{n=1}^{\infty}`, tx(t, "musTim_wSum", "\"add up the term on the right for n = 1, 2, 3, … without end\". In practice, the first few dozen terms are all the ear can tell apart")],
          [r`n`, tx(t, "musTim_wN", "the harmonic number: 1 is the fundamental, 2 the second harmonic, and so on")],
          [r`a_n`, tx(t, "musTim_wA", "the amplitude of harmonic n: how much of it is in the recipe. Zero means that harmonic is missing")],
          [r`n f`, tx(t, "musTim_wNf", "the frequency of harmonic n: n times the fundamental f. Every harmonic fits a whole number of cycles into one period of the fundamental, so the sum repeats at f")],
          [r`\varphi_n`, tx(t, "musTim_wPhi", "the phase of harmonic n (Greek phi): how far along its cycle it is at t = 0. It slides the harmonic in time without changing its frequency or amplitude")],
        ]}
        words={tx(t, "musTim_fourierWords", "Any sound that repeats f times a second is a pile of pure tones at f, 2f, 3f…, each with its own strength and its own starting point.")}>
        {r`p(t) = \sum_{n=1}^{\infty} a_n \sin(2\pi\, n f\, t + \varphi_n)`}
      </Equation>
      <p>
        {tx(t, "musTim_names",
          "Two other words mean nearly the same thing. A partial is any of the pure tones in a sound, whether or not it sits at a whole multiple of f. An overtone is any partial above the fundamental, numbered from the first one above it: the first overtone is harmonic 2. This track says \"harmonic n\", which avoids the off-by-one.")}
      </p>

      <MusicHarmonicBuilderFigure t={t} />

      <p>
        {tx(t, "musTim_recipes",
          "The textbook waves have simple recipes. A square wave uses only the odd harmonics, each weaker in proportion to its number: 1, 1/3, 1/5, 1/7… A sawtooth uses all of them at 1, 1/2, 1/3, 1/4… A triangle uses the odd ones but falls much faster, 1, 1/9, 1/25…, which is why it sounds soft and close to a sine. More strong high harmonics make a sound brighter and sharper; fewer make it darker and rounder.")}
      </p>
      <Equation label={tx(t, "musTim_eqSquare", "The recipe of a square wave")}
        where={[
          [r`\frac{4}{\pi}`, tx(t, "musTim_w4pi", "a constant (about 1.27) that makes the square's height exactly 1. Without it the sum would flatten out at π/4 ≈ 0.785")],
          [r`\sin(2\pi f t)`, tx(t, "musTim_wS1", "the fundamental, at full strength")],
          [r`\frac{1}{3}\sin(2\pi\, 3f\, t)`, tx(t, "musTim_wS3", "harmonic 3 at a third of the strength. Harmonics 2, 4, 6… are missing altogether")],
        ]}
        words={tx(t, "musTim_squareWords", "A square wave is the odd harmonics only, the n-th one 1/n as strong.")}
        note={tx(t, "musTim_squareNote", "The more terms you add, the flatter the tops and the steeper the sides. In the figure, a square from ten harmonics still has little ripples near the jumps; they never fully go away (the Gibbs phenomenon), but they get narrower.")}>
        {r`p(t) = \frac{4}{\pi}\left( \sin(2\pi f t) + \frac{1}{3}\sin(2\pi\, 3f\, t) + \frac{1}{5}\sin(2\pi\, 5f\, t) + \cdots \right)`}
      </Equation>

      <H3>{tx(t, "musTim_phaseTitle", "The ear barely hears phase")}</H3>
      <p>
        {tx(t, "musTim_phaseBody",
          "Press \"shuffle phases\" in the figure. Each harmonic slides forward or back in time by a random amount. The wave on screen turns into something unrecognisable, yet the sound is almost unchanged. The inner ear works like a row of tuned detectors, each listening to a narrow band of frequencies, and it mainly reports how strong each band is. So the amplitudes aₙ shape the timbre, and the phases φₙ hardly matter. This was noticed by Georg Ohm and Hermann von Helmholtz in the 1800s, and it is why two very different-looking waves can sound the same.")}
      </p>

      <H2>{tx(t, "musTim_stringTitle", "Why instruments make harmonics")}</H2>
      <p>
        {tx(t, "musTim_stringBody",
          "Fourier says any repeating sound can be split into harmonics. But instruments also produce them directly, because of how they vibrate. Take a guitar string, held still at both ends. A wave runs along it, bounces off each end and comes back. Only shapes that fit neatly between the two fixed ends survive; those are called standing waves, because the pattern stays in place while it vibrates.")}
      </p>
      <Derivation t={t} label={tx(t, "musTim_dString", "Why a string vibrates at f, 2f, 3f…")}
        steps={[
          { tex: r`L = n \cdot \frac{\lambda_n}{2}, \quad n = 1, 2, 3, \dots`, why: tx(t, "musTim_d0", "both ends must stay still, so a whole number n of half-waves has to fit along the string's length L. A half-wave is one bump between two still points") },
          { tex: r`\lambda_n = \frac{2L}{n}`, why: tx(t, "musTim_d1", "solve for the wavelength of mode n: the more bumps, the shorter the wave") },
          { tex: r`f_n = \frac{v}{\lambda_n} = \frac{n\, v}{2L}`, why: tx(t, "musTim_d2", "frequency is speed divided by wavelength, the λ = v/f of chapter 1 turned around. Here v is the speed of waves along the string, not the speed of sound in air") },
          { tex: r`f_n = n \cdot \amber{\frac{v}{2L}} = n \cdot \amber{f_1}`, why: tx(t, "musTim_d3", "every mode is a whole-number multiple of the lowest one, f₁ = v/(2L): exactly the harmonic series") },
        ]} />

      <MusicHarmonicSeriesFigure t={t} />

      <p>
        {tx(t, "musTim_stringReal",
          "A plucked string does not pick one mode: it vibrates in all of them at once, and the sound it makes is their sum. Where you pluck decides the recipe. Pluck in the middle and the modes that have a still point there (2, 4, 6…) are not excited, so the sound is hollow; pluck near the end, as most guitarists do, and many high harmonics join in, so the sound is bright. Air in a pipe works the same way: a flute, open at both ends, makes all the harmonics; a clarinet, closed at one end by the player's mouth, mostly makes the odd ones, which is why its low notes sound hollow and square-ish.")}
      </p>
      <LiveFormula label={tx(t, "musTim_liveHarm", "Try it: any harmonic")}
        tex={r`f_n = n \cdot f_1`}
        vars={[
          { id: "f1", label: tx(t, "musTim_liveF1", "fundamental f₁ (Hz)"), min: 55, max: 440, step: 1, value: 110 },
          { id: "n", label: tx(t, "musTim_liveN", "harmonic n"), min: 1, max: 16, step: 1, value: 3 },
        ]}
        compute={harmonicNumbers}
        where={[
          [r`f_n`, tx(t, "musTim_wFn", "the frequency of harmonic n, and the nearest piano key with how many cents it is off")],
          [r`f_1`, tx(t, "musTim_wF1", "the fundamental: the lowest frequency, the one heard as the pitch")],
        ]}
        note={tx(t, "musTim_liveHarmNote", "Harmonics 2, 4, 8 and 16 are octaves of the fundamental. Harmonic 3 lands 2 cents above a fifth above an octave; harmonic 7 lands 31 cents flat of any key, which is why piano tuning ignores it.")} />
      <p>
        {tx(t, "musTim_mersenne",
          "And what sets f₁? The speed v depends on how tight the string is pulled and how heavy it is: v = √(T/μ). That gives the three ways to tune a string, worked out by Marin Mersenne in 1636: shorten it (a guitarist's fret), tighten it (the tuning peg), or make it heavier (the thick low strings).")}
      </p>
      <LiveFormula label={tx(t, "musTim_liveString", "Try it: tune a guitar string")}
        tex={r`v = \sqrt{\frac{T}{\mu}} \qquad f_1 = \frac{v}{2L}`}
        vars={[
          { id: "L", label: tx(t, "musTim_liveL", "length L (m)"), min: 0.3, max: 1.0, step: 0.001, value: 0.648, fmt: v => `${v.toFixed(3)} m` },
          { id: "T", label: tx(t, "musTim_liveT", "tension T (N)"), min: 20, max: 150, step: 1, value: 73, fmt: v => `${v} N` },
          { id: "mu", label: tx(t, "musTim_liveMu", "weight μ (g per metre)"), min: 0.2, max: 10, step: 0.05, value: 0.4, fmt: v => `${v.toFixed(2)} g/m` },
        ]}
        compute={stringNumbers}
        where={[
          [r`v`, tx(t, "musTim_wV", "the speed of waves along the string, in m/s")],
          [r`T`, tx(t, "musTim_wT", "the tension: how hard the string is pulled, in newtons (N). 73 N is about the pull of a 7.4 kg weight")],
          [r`\mu`, tx(t, "musTim_wMu", "the string's mass per metre (Greek mu), in kg/m. The slider is in grams per metre; the formula uses 1 g/m = 0.001 kg/m")],
          [r`L`, tx(t, "musTim_wL", "the vibrating length, from the nut (or a fret) to the bridge, in metres")],
        ]}
        note={tx(t, "musTim_liveStringNote", "The starting values are a guitar's thin high E string: 0.648 m long, 73 N, 0.4 g/m, giving E4 at 329.6 Hz. Halve L (the 12th fret) and the note goes up an octave. Quadruple T and it also goes up an octave, because of the square root.")} />

      <H2>{tx(t, "musTim_specTitle", "Seeing the recipe: the spectrum")}</H2>
      <p>
        {tx(t, "musTim_specBody",
          "A graph of how strong each frequency is in a sound is called its spectrum. A pressure-against-time graph shows the shape; the spectrum shows the recipe. Computers find it with the Fourier transform, Fourier's idea run backwards: from the shape, recover the aₙ. Your browser can do this live. The figure below listens to everything this page plays and draws its spectrum. Hold a key and watch where the peaks land.")}
      </p>

      <MusicSpectrumFigure t={t} />

      <p>
        {tx(t, "musTim_specRead",
          "The vertical axis is in decibels (dB) below the strongest frequency: each 20 dB down is ten times less pressure, so −40 dB is a hundred times weaker. Chapter 4 explains decibels properly. The piano's peaks also drift very slightly above the dashed lines in the high notes: a real string is a little stiff, which pushes its upper modes sharp. Piano tuners stretch their octaves a little to match.")}
      </p>
      <LessonTable
        headers={[tx(t, "musTim_tInst", "Instrument"), tx(t, "musTim_tRecipe", "Typical recipe"), tx(t, "musTim_tSounds", "Sounds")]}
        rows={[
          [tx(t, "musTim_i1", "Flute (soft)"), tx(t, "musTim_i1r", "strong fundamental, a few weak harmonics"), tx(t, "musTim_i1s", "pure, breathy, close to a sine")],
          [tx(t, "musTim_i2", "Clarinet (low notes)"), tx(t, "musTim_i2r", "odd harmonics strong, even ones weak"), tx(t, "musTim_i2s", "hollow, woody")],
          [tx(t, "musTim_i3", "Violin, trumpet"), tx(t, "musTim_i3r", "many strong harmonics, high into the spectrum"), tx(t, "musTim_i3s", "bright, rich, sawtooth-like")],
          [tx(t, "musTim_i4", "Oboe"), tx(t, "musTim_i4r", "weak fundamental, strong harmonics 2 to 5"), tx(t, "musTim_i4s", "nasal, penetrating")],
          [tx(t, "musTim_i5", "Piano"), tx(t, "musTim_i5r", "all harmonics, upper ones fading fast after the hammer strike"), tx(t, "musTim_i5s", "bright at first, then mellow")],
        ]}
      />

      <H3>{tx(t, "musTim_missTitle", "The missing fundamental")}</H3>
      <p>
        {tx(t, "musTim_missBody",
          "A phone speaker is too small to push air at 100 Hz, so a bass note at 100 Hz comes out with its fundamental almost gone. Yet you still hear the bass line at the right pitch. The remaining harmonics, 200, 300, 400 Hz…, are still spaced 100 Hz apart, and their sum still repeats 100 times a second. Your brain hears that repetition and supplies the missing pitch. Try the \"no fundamental\" recipe in the builder: the 220 Hz bar is empty, but the readout still says the wave repeats 220 times a second, and it still sounds like A3, only thinner.")}
      </p>

      <H2>{tx(t, "musTim_moreTitle", "Timbre is more than the recipe")}</H2>
      <p>
        {tx(t, "musTim_moreBody",
          "The recipe is not frozen. A piano note starts with a hammer's thump full of high harmonics, which fade within a second while the low ones ring on. A violin note starts with a scratchy moment before the bow settles. Cut the first fraction of a second off recordings and listeners struggle to tell many instruments apart: the start of a note carries much of its identity. Chapter 4 looks at how loudness rises and falls over a note, its envelope.")}
      </p>
      <p>
        {tx(t, "musTim_formants",
          "Your voice shows the other twist. Sing \"ah\" and then \"ee\" on the same pitch: the harmonics stay at the same frequencies, but your mouth and throat change shape and boost different bands of them. Those boosted bands are called formants, and they are how you tell vowels apart. A vowel is a timbre.")}
      </p>

      <KeyIdeas t={t} id="musTim" items={[
        "Timbre is what makes the same note, equally loud, sound different on different instruments; it comes from the shape of the wave.",
        "Any sound that repeats at f is a sum of harmonics at f, 2f, 3f…: p(t) = Σ aₙ·sin(2π·n·f·t + φₙ). The amplitudes aₙ are the recipe.",
        "Square: odd harmonics at 1/n. Sawtooth: all at 1/n. More strong high harmonics sound brighter.",
        "A string fixed at both ends fits n half-waves, so it vibrates at fₙ = n·v/(2L) = n·f₁, with v = √(T/μ).",
        "The spectrum shows how strong each frequency is; the ear mostly ignores phase, and hears the repetition rate even when the fundamental is missing.",
        "Timbre also lives in time (the attack of a note) and in formants, the boosted bands that make vowels.",
      ]} />
    </Article>
  );
}
