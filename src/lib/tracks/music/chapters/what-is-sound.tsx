"use client";

// Sound: what sound physically is — a vibration passed along through air as
// pressure — and the numbers that describe the simplest sound, a pure tone:
// amplitude, frequency, period and wavelength. Ends at the piano: a note is a
// sound with a steady frequency.

import { H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { MusicAirFigure } from "@/components/lesson/figures/music/AirFigure";
import { MusicWaveFigure } from "@/components/lesson/figures/music/WaveFigure";
import { MusicPianoFigure } from "@/components/lesson/figures/music/PianoFigure";

const r = String.raw;

// ── Live wavelength: v from the air temperature, then λ = v / f ──────────────

function wavelengthNumbers(v: Record<string, number>) {
  const speed = 331.3 + 0.606 * v.temp;
  const lambda = speed / v.f;
  return {
    tex: r`v = 331.3 + 0.606 \cdot ${v.temp} = \amber{${speed.toFixed(1)}}\ \text{m/s} \qquad \lambda = \frac{${speed.toFixed(1)}}{${v.f}} = \green{${lambda >= 1 ? lambda.toFixed(2) + r`\ \text{m}` : (lambda * 100).toFixed(1) + r`\ \text{cm}`}}`,
  };
}

export function WhatIsSoundContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "musSnd_intro",
          "Everything you hear is air being pushed back and forth. A guitar string, a drum skin or a speaker cone vibrates. It shoves the air next to it, and that air shoves the air next to it. The push travels to your ear. Music is sound organised in time, so before notes, rhythm or chords, this chapter looks at sound itself. It describes the simplest sound with a few numbers: how hard the air is pushed, how often, and how far apart the pushes are.")}
      </Lead>

      <Goals t={t} id="musSnd" items={[
        "Explain how a vibrating object makes your eardrum move.",
        "Read the amplitude, frequency and period of a tone from its graph.",
        "Convert between frequency and period with T = 1/f.",
        "Compute a wavelength with λ = v/f.",
        "Say which frequencies a human can hear.",
      ]} />

      <H2>{tx(t, "musSnd_travelTitle", "A vibration that travels")}</H2>
      <p>
        {tx(t, "musSnd_travelBody",
          "Air is made of tiny particles (molecules) that are always bumping into each other. When a speaker cone moves forward, it squeezes the air in front of it: the particles there crowd together. That crowded patch is called a compression. The crowded particles push on their neighbours, so the compression moves on. When the cone moves back, it leaves a patch with fewer particles than usual, a rarefaction. Compressions and rarefactions take turns and travel away from the speaker. This travelling pattern is a sound wave.")}
      </p>
      <p>
        {tx(t, "musSnd_travelBody2",
          "The air itself does not fly to your ear. Each particle only rocks back and forth around its place, like a person in a stadium wave who stands up and sits down without leaving their seat. Only the push travels. When it reaches your ear it moves the eardrum, a thin skin inside your ear, in and out in step with the speaker.")}
      </p>

      <MusicAirFigure t={t} />

      <p>
        {tx(t, "musSnd_vacuum",
          "Sound needs something to travel through: air, water, wood, metal. In a vacuum there are no particles to pass the push along. That is why space is silent. An explosion outside a spaceship makes no sound at all, however close it is.")}
      </p>

      <H2>{tx(t, "musSnd_pressureTitle", "Pressure: what your ear measures")}</H2>
      <p>
        {tx(t, "musSnd_pressureBody",
          "Pressure is how hard the air pushes on a surface, measured in pascals (Pa). One pascal is a force of one newton on one square metre. Still air at sea level already pushes with about 101 325 Pa. Sound is a tiny ripple on top of that: a compression is slightly above normal pressure, a rarefaction slightly below. Your eardrum feels the difference between the air outside and the air inside your ear, so it follows those ripples. The ear is astonishingly sensitive: the quietest sound you can hear changes the pressure by about one part in five billion.")}
      </p>
      <LessonTable
        headers={[tx(t, "musSnd_tSound", "Sound"), tx(t, "musSnd_tSwing", "Pressure swing"), tx(t, "musSnd_tShare", "Share of normal air pressure")]}
        rows={[
          [tx(t, "musSnd_t1", "Quietest sound a young ear can hear"), "0.00002 Pa", "0.00000002 %"],
          [tx(t, "musSnd_t2", "Normal conversation, 1 m away"), "0.02 Pa", "0.00002 %"],
          [tx(t, "musSnd_t3", "Front row of a rock concert"), "2 Pa", "0.002 %"],
          [tx(t, "musSnd_t4", "Painful: a jet engine nearby"), tx(t, "musSnd_t4b", "20 Pa and more"), "0.02 %"],
        ]}
      />
      <p>
        {tx(t, "musSnd_pressureEnd",
          "From the quietest sound to a painful one, the pressure swing grows a million times. Chapter 4 shows how the decibel scale tames numbers that far apart.")}
      </p>

      <H2>{tx(t, "musSnd_toneTitle", "The simplest sound: a pure tone")}</H2>
      <p>
        {tx(t, "musSnd_toneBody",
          "Stand still and measure the pressure at your ear while a sound plays. You get a graph of pressure against time. For most sounds it is a messy, jagged line. The simplest possible sound repeats one smooth swing for ever: a sine wave. It is called a pure tone. A tuning fork and a flute playing softly come close to it. Real instruments add other ingredients on top, which chapter 3 takes apart. Two numbers describe a pure tone completely: its amplitude and its frequency.")}
      </p>
      <Equation label={tx(t, "musSnd_eqTone", "A pure tone")}
        where={[
          [r`p(t)`, tx(t, "musSnd_wP", "how far the pressure at your ear is above (+) or below (−) normal, at time t")],
          [r`A`, tx(t, "musSnd_wA", "the amplitude: the biggest swing, reached at the top and bottom of each cycle. A bigger swing sounds louder")],
          [r`f`, tx(t, "musSnd_wF", "the frequency: how many full cycles happen per second, in hertz (Hz). 440 Hz means 440 cycles every second. A higher frequency sounds higher")],
          [r`t`, tx(t, "musSnd_wT", "time, in seconds")],
          [r`2\pi`, tx(t, "musSnd_w2pi", "one full turn of the sine (sin repeats every 2π). Every time f·t grows by 1, the angle 2π·f·t grows by one full turn and one cycle is complete")],
        ]}
        words={tx(t, "musSnd_toneWords", "The pressure at your ear rises and falls smoothly, f times every second, reaching A above normal and A below.")}>
        {r`p(t) = A \,\sin(2\pi f\, t)`}
      </Equation>

      <H3>{tx(t, "musSnd_periodTitle", "Frequency and period")}</H3>
      <p>
        {tx(t, "musSnd_periodBody",
          "The period T is the time one cycle takes. Frequency and period are two views of the same thing. If 4 cycles fit in one second, each one lasts a quarter of a second. So the period is one divided by the frequency, and the frequency is one divided by the period.")}
      </p>
      <Equation label={tx(t, "musSnd_eqPeriod", "Period and frequency")}
        where={[
          [r`T`, tx(t, "musSnd_wPeriod", "the period: seconds per cycle")],
          [r`f`, tx(t, "musSnd_wFreq", "the frequency: cycles per second (Hz)")],
        ]}
        words={tx(t, "musSnd_periodWords", "One cycle lasts one second divided by the number of cycles per second.")}
        note={tx(t, "musSnd_periodNote", "Example: the A that orchestras tune to is 440 Hz. One cycle lasts T = 1/440 s ≈ 0.00227 s = 2.27 milliseconds (ms). A sound at 20 Hz has T = 50 ms; one at 20 000 Hz has T = 0.05 ms.")}>
        {r`T = \frac{1}{f} \qquad f = \frac{1}{T}`}
      </Equation>

      <MusicWaveFigure t={t} />

      <H3>{tx(t, "musSnd_rangeTitle", "What you can hear")}</H3>
      <p>
        {tx(t, "musSnd_rangeBody",
          "A young ear hears from about 20 Hz to about 20 000 Hz (20 kHz). Below 20 Hz the pressure swings are felt as rumble rather than heard as a tone; whales and elephants use them. Above 20 kHz is ultrasound; dogs and bats hear it. The top of your range falls with age, so most adults stop around 14 to 17 kHz. In the figure, press the 16 kHz button and see if you hear it. The ear is also most sensitive between about 2 and 5 kHz, the range of a baby's cry. A tone there sounds louder than a 100 Hz tone with the same amplitude.")}
      </p>
      <p>
        {tx(t, "musSnd_rangeMusic",
          "Music sits inside this range. The lowest key of a piano is about 27.5 Hz and the highest about 4 186 Hz. A singer's voice spans roughly 80 Hz (a deep bass) to 1 000 Hz (a high soprano). The frequencies above that still matter: they colour the sound, as chapter 3 will show.")}
      </p>

      <H2>{tx(t, "musSnd_waveTitle", "Wavelength: how far apart the pushes are")}</H2>
      <p>
        {tx(t, "musSnd_waveBody",
          "Sound travels through air at about 343 metres per second (m/s) at room temperature. That is fast, but not instant. You see lightning before you hear the thunder: the light arrives almost at once, while the sound needs about 3 seconds for every kilometre. The wavelength λ (the Greek letter lambda) is the distance between two neighbouring compressions. It follows from the speed and the frequency.")}
      </p>
      <Derivation t={t} label={tx(t, "musSnd_eqLambda", "Why λ = v / f")}
        steps={[
          { full: true, tex: r`\text{${tx(t, "musSnd_d0", "one cycle of the speaker")}} \;\Rightarrow\; \text{${tx(t, "musSnd_d0b", "one new compression")}}`, why: tx(t, "musSnd_s0", "the speaker sends out one compression every time it moves forward, once per cycle") },
          { full: true, tex: r`\lambda = v \cdot \amber{T}`, why: tx(t, "musSnd_s1", "while the speaker completes one cycle (T seconds), the previous compression travels v·T metres. The next one starts exactly then, so v·T is the gap between them") },
          { full: true, tex: r`\lambda = v \cdot \amber{\frac{1}{f}} = \frac{v}{f}`, why: tx(t, "musSnd_s2", "replace T with 1/f") },
          { full: true, tex: r`\lambda = \frac{343}{440} \approx \green{0.78\ \text{m}}`, why: tx(t, "musSnd_s3", "for the 440 Hz A: the compressions are 78 cm apart") },
        ]} />
      <p>
        {tx(t, "musSnd_waveRange",
          "Across the range of hearing, the wavelength goes from 343/20 ≈ 17 m for the lowest tone to 343/20 000 ≈ 1.7 cm for the highest. That is why a bass speaker is big and a tweeter is small: to push air efficiently, a speaker should not be much smaller than the waves it makes.")}
      </p>
      <LiveFormula label={tx(t, "musSnd_liveLambda", "Try it: wavelength in warm and cold air")}
        tex={r`v \approx 331.3 + 0.606\,\theta \qquad \lambda = \frac{v}{f}`}
        vars={[
          { id: "f", label: tx(t, "musSnd_liveF", "frequency f (Hz)"), min: 20, max: 2000, step: 10, value: 440 },
          { id: "temp", label: tx(t, "musSnd_liveTemp", "air temperature θ (°C)"), min: -20, max: 40, step: 1, value: 20, fmt: v => `${v} °C` },
        ]}
        compute={wavelengthNumbers}
        where={[
          [r`v`, tx(t, "musSnd_wV", "the speed of sound in air, in m/s")],
          [r`\theta`, tx(t, "musSnd_wTheta", "the air temperature in °C. Warmer particles move faster and pass the push along sooner: about 0.6 m/s more for every degree")],
          [r`331.3`, tx(t, "musSnd_w331", "the speed of sound in air at 0 °C, in m/s (measured)")],
        ]}
        note={tx(t, "musSnd_liveNote", "This is why a wind instrument goes sharp as the hall warms up. The length of its tube fixes the wavelength, so when v rises the frequency f = v/λ rises with it.")} />
      <LessonTable
        headers={[tx(t, "musSnd_mMat", "Material"), tx(t, "musSnd_mSpeed", "Speed of sound"), tx(t, "musSnd_mLambda", "λ at 440 Hz")]}
        rows={[
          [tx(t, "musSnd_m1", "Air, 20 °C"), "343 m/s", "0.78 m"],
          [tx(t, "musSnd_m2", "Helium"), "≈ 1 000 m/s", "≈ 2.3 m"],
          [tx(t, "musSnd_m3", "Water"), "≈ 1 480 m/s", "≈ 3.4 m"],
          [tx(t, "musSnd_m4", "Steel"), "≈ 5 900 m/s", "≈ 13 m"],
        ]}
      />
      <p>
        {tx(t, "musSnd_materials",
          "Sound moves faster through stiffer materials, because the particles pass the push to each other more quickly. In steel it is about 17 times faster than in air. That is why you can hear a train coming by putting your ear to the rail long before you hear it through the air (please don't).")}
      </p>

      <H2>{tx(t, "musSnd_musicTitle", "From sound to music")}</H2>
      <p>
        {tx(t, "musSnd_musicBody",
          "Some sounds repeat: a string, a flute or a voice singing \"ah\" produces the same shape of swing over and over. The ear hears a repeating sound as having a pitch, a note you can sing back. Other sounds never repeat: rain, a cymbal crash, the letter \"sh\". They are noise, with no single pitch. Most music is built from pitched sounds, with drums and cymbals adding unpitched ones for rhythm.")}
      </p>
      <p>
        {tx(t, "musSnd_musicPiano",
          "A note is a sound with a steady frequency. Every key of a piano plays one. Press a few keys below and look at the frequency each one shows. Moving one key to the right always multiplies the frequency by the same number, about 1.06. The next chapter explains where that number comes from and why 12 steps double the frequency.")}
      </p>

      <MusicPianoFigure t={t} />

      <KeyIdeas t={t} id="musSnd" items={[
        "Sound is a push passed along through a material: compressions and rarefactions travel, the particles only rock in place. No material, no sound.",
        "The ear measures tiny swings of air pressure on top of the 101 325 Pa of still air.",
        "A pure tone is p(t) = A·sin(2πft): amplitude A (how hard, heard as loudness) and frequency f in Hz (how often, heard as pitch).",
        "The period is T = 1/f; at 440 Hz one cycle lasts 2.27 ms.",
        "Sound travels at about 343 m/s in air; the wavelength is λ = v/f, from 17 m at 20 Hz to 1.7 cm at 20 kHz.",
        "Humans hear roughly 20 Hz to 20 kHz; a note is a sound with a steady frequency.",
      ]} />
    </Article>
  );
}
