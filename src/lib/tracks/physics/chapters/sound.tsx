"use client";

// Oscillations & Waves 4: sound — a longitudinal pressure wave; its speed
// v = √(B/ρ), in air √(γRT/M) ≈ 331 + 0.6 T; the range of hearing;
// intensity, the inverse-square law and decibels; standing waves in open and
// closed pipes (flute, clarinet, bottle); beats; the Doppler effect for a
// moving source and a moving listener; the Mach cone and the sonic boom.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { BeatsFigure } from "@/components/lesson/figures/physics/BeatsFigure";
import { DopplerFigure } from "@/components/lesson/figures/physics/DopplerFigure";

const r = String.raw;
const num = (v: number, d = 1) => String(+v.toFixed(d)).replace("-", "−");

// ── Live formulas: the numbers plugged in ─────────────────────────────────────

/** Sound level at distance r from a point source radiating P watts of sound. */
const levelNumbers = (t: TrackTranslations) => (v: Record<string, number>) => {
  const I = v.P / (4 * Math.PI * v.r * v.r), dB = 10 * Math.log10(I / 1e-12);
  const exp = Math.floor(Math.log10(I)), mant = I / 10 ** exp;
  return {
    tex: r`I = \frac{${num(v.P, 2)}}{4\pi \times ${num(v.r, 0)}^2} = ${num(mant, 2)} \times 10^{${exp}}\ \tfrac{\text{W}}{\text{m}^2}, \quad \beta = 10 \log_{10}\frac{I}{10^{-12}} = \amber{${num(dB, 0)}\ \text{dB}}`,
    meter: Math.min(1, Math.max(0, dB / 140)),
    meterLabel: dB >= 120 ? tx(t, "phSnd_livePain", "painful") : dB >= 85 ? tx(t, "phSnd_liveRisk", "harmful over long periods") : tx(t, "phSnd_liveSafe", "safe to hear"),
  };
};

export function SoundContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "phSnd_intro",
          "Everything you hear is a wave in the air: a loudspeaker cone, a vocal cord or a guitar string pushes on the air next to it, that air pushes on the next, and a pattern of tiny pressure changes runs out at about 340 metres per second until it moves your eardrum. This chapter applies the physics of waves to sound: how fast it goes and why, how loudness is measured, how pipes and bottles pick out notes, why two nearly equal notes throb, and why a passing siren drops in pitch. The Music track looks at the same sounds from the musician's side.")}
      </Lead>

      <Goals t={t} id="phSnd" items={[
        "Describe sound as a longitudinal pressure wave and find its speed in air, water and steel.",
        "Use intensity, the inverse-square law and the decibel scale.",
        "Find the notes of open and closed pipes from their length.",
        "Explain beats, the Doppler effect and the sonic boom, and compute the frequencies heard.",
      ]} />

      <H2>{tx(t, "phSnd_pressTitle", "Sound is a pressure wave")}</H2>
      <p>
        {tx(t, "phSnd_pressBody",
          "When a loudspeaker cone moves forward it squeezes the air in front of it: a compression, where the pressure is slightly above normal. When it moves back it leaves a rarefaction, where the pressure is slightly below. The air molecules only jiggle back and forth along the direction of travel, so sound is a longitudinal wave, like the longitudinal view of the string figure in the last chapter. The pressure changes are astonishingly small. Normal air pressure is about 101 000 Pa; ordinary conversation changes it by about 0.02 Pa, two parts in ten million. The faintest sound you can hear changes it by 0.00002 Pa.")}
      </p>

      <H2>{tx(t, "phSnd_speedTitle", "The speed of sound")}</H2>
      <p>
        {tx(t, "phSnd_speedBody",
          "The speed of a wave on a string was √(tension / mass per length): restoring force over inertia. Sound follows the same pattern. The restoring property of a fluid is its bulk modulus B: how much extra pressure it takes to squeeze it by a given fraction of its volume (B = −Δp / (ΔV/V), in pascals). The inertia is its density ρ (the Greek letter rho, kg/m³).")}
      </p>
      <Equation label={tx(t, "phSnd_eqSpeed", "The speed of sound")}
        where={[
          [r`v`, tx(t, "phSnd_wV", "the speed of sound (m/s)")],
          [r`B`, tx(t, "phSnd_wB", "the bulk modulus: stiffness against squeezing (Pa)")],
          [r`\rho`, tx(t, "phSnd_wRho", "the density (kg/m³)")],
          [r`\gamma`, tx(t, "phSnd_wGamma", "for a gas, how much its pressure rises when squeezed quickly; 1.4 for air")],
          [r`R`, tx(t, "phSnd_wR", "the gas constant, 8.314 J/(mol·K)")],
          [r`T`, tx(t, "phSnd_wT", "the absolute temperature, in kelvin (°C + 273.15)")],
          [r`M`, tx(t, "phSnd_wM", "the mass of one mole of the gas: 0.029 kg/mol for air")],
        ]}
        words={tx(t, "phSnd_speedWords", "Stiffer materials carry sound faster, heavier ones slower; in a gas only the temperature and the kind of gas matter.")}
        note={tx(t, "phSnd_speedNote", "For a gas, B = γ p and ρ = p M / (R T), so the pressure p cancels: sound is as fast on a mountain as at sea level at the same temperature. Warmer air is faster: near room temperature v ≈ 331 + 0.6 × (temperature in °C) m/s. Air at 20 °C gives √(1.4 × 8.314 × 293 / 0.029) = 343 m/s.")}>
        {r`v = \sqrt{\frac{B}{\rho}} \qquad \text{(gas)}\quad v = \sqrt{\frac{\gamma R T}{M}}`}
      </Equation>
      <LessonTable
        headers={[tx(t, "phSnd_tMed", "Medium"), tx(t, "phSnd_tV", "Speed of sound"), tx(t, "phSnd_tWhy", "Why")]}
        rows={[
          [tx(t, "phSnd_s1", "air, 0 °C"), "331 m/s", tx(t, "phSnd_s1w", "cold molecules move more slowly")],
          [tx(t, "phSnd_s2", "air, 20 °C"), "343 m/s", tx(t, "phSnd_s2w", "the usual value in this chapter")],
          [tx(t, "phSnd_s3", "helium, 20 °C"), "1 007 m/s", tx(t, "phSnd_s3w", "very light molecules (M = 0.004 kg/mol)")],
          [tx(t, "phSnd_s4", "water"), "1 480 m/s", tx(t, "phSnd_s4w", "denser than air, but far stiffer")],
          [tx(t, "phSnd_s5", "steel"), "≈ 5 900 m/s", tx(t, "phSnd_s5w", "denser still, and stiffer still")],
        ]}
      />
      <p>
        {tx(t, "phSnd_speedBody2",
          "Light arrives almost instantly, sound takes about 3 seconds per kilometre. Count the seconds between a lightning flash and its thunder and divide by 3 to get the distance in kilometres. Breathe helium and your voice sounds squeaky: your vocal cords still vibrate at the same rate, but the resonances of your throat and mouth, which shape the sound, move up because sound travels three times faster there.")}
      </p>
      <p>
        {tx(t, "phSnd_rangeBody",
          "Young people hear from about 20 Hz to 20 000 Hz, wavelengths from 17 m down to 1.7 cm; the top end falls with age. Below 20 Hz is infrasound, used by elephants and produced by earthquakes. Above 20 kHz is ultrasound: bats navigate with it, and medical scanners use a few million hertz, whose millimetre wavelengths can picture small details inside the body.")}
      </p>

      <H2>{tx(t, "phSnd_intTitle", "Loudness: intensity and decibels")}</H2>
      <p>
        {tx(t, "phSnd_intBody",
          "The physical measure of loudness is the intensity I: the power the wave carries through each square metre facing it, in W/m². A small source sends its power out equally in all directions, spread over spheres that grow as you move away. The area of a sphere is 4π r², so the intensity falls with the square of the distance.")}
      </p>
      <Equation label={tx(t, "phSnd_eqInv", "The inverse-square law")}
        where={[
          [r`I`, tx(t, "phSnd_wI", "the intensity at distance r (W/m²)")],
          [r`P`, tx(t, "phSnd_wP", "the sound power the source sends out (W)")],
          [r`r`, tx(t, "phSnd_wRr", "the distance from the source (m)")],
        ]}
        words={tx(t, "phSnd_invWords", "Twice as far away, the same power is spread over four times the area, so the sound is a quarter as intense.")}>
        {r`I = \frac{P}{4\pi r^2}`}
      </Equation>
      <p>
        {tx(t, "phSnd_dbBody",
          "The ear handles an enormous range: the loudest bearable sound is a million million (10¹²) times as intense as the faintest audible one. And we perceive loudness roughly by ratios: each tenfold step in intensity sounds like a similar step up. So loudness is measured on a logarithmic scale, the decibel scale (dB), named after Alexander Graham Bell.")}
      </p>
      <Equation label={tx(t, "phSnd_eqDb", "Sound level in decibels")}
        where={[
          [r`\beta`, tx(t, "phSnd_wBeta", "the sound level (dB)")],
          [r`I`, tx(t, "phSnd_wI2", "the intensity (W/m²)")],
          [r`I_0`, tx(t, "phSnd_wI0", "the threshold of hearing, 10⁻¹² W/m², the faintest sound a good ear hears at 1 000 Hz")],
        ]}
        note={tx(t, "phSnd_dbNote", "log₁₀ asks \"10 to what power?\" (Math track, exponents and logarithms). Ten times the intensity adds 10 dB; twice the intensity adds 3 dB, since log₁₀ 2 = 0.30. Twice the distance from a source means a quarter of the intensity: 6 dB less. 0 dB is not silence but the quietest sound one can hear.")}>
        {r`\beta = 10\, \log_{10} \frac{I}{I_0}`}
      </Equation>
      <LessonTable
        headers={[tx(t, "phSnd_tSound", "Sound"), tx(t, "phSnd_tLevel", "Level"), tx(t, "phSnd_tInt", "Intensity")]}
        rows={[
          [tx(t, "phSnd_l1", "threshold of hearing"), "0 dB", "10⁻¹² W/m²"],
          [tx(t, "phSnd_l2", "a whisper, a quiet library"), "30 dB", "10⁻⁹ W/m²"],
          [tx(t, "phSnd_l3", "normal conversation at 1 m"), "60 dB", "10⁻⁶ W/m²"],
          [tx(t, "phSnd_l4", "busy street traffic"), "80 dB", "10⁻⁴ W/m²"],
          [tx(t, "phSnd_l5", "rock concert near the speakers"), "110 dB", "0.1 W/m²"],
          [tx(t, "phSnd_l6", "threshold of pain"), "120 – 130 dB", "1 – 10 W/m²"],
        ]}
      />
      <LiveFormula label={tx(t, "phSnd_liveDb", "Try it: how loud is it from here?")}
        tex={r`\beta = 10 \log_{10} \frac{P / 4\pi r^2}{10^{-12}}`}
        vars={[
          { id: "P", label: "P (W)", min: 0.01, max: 100, step: 0.01, value: 1, fmt: v => `${num(v, 2)} W` },
          { id: "r", label: "r (m)", min: 1, max: 200, step: 1, value: 10, fmt: v => `${num(v, 0)} m` },
        ]}
        compute={levelNumbers(t)}
        note={tx(t, "phSnd_liveDbNote", "A loudspeaker sending out 1 W of sound (it draws far more electrical power, since speakers are only about 1% efficient) gives 89 dB at 10 m. Walk to 20 m: 83 dB. Ten such speakers together: 99 dB. Long exposure above about 85 dB damages hearing.")} />
      <Callout type="info" t={t}>
        {tx(t, "phSnd_feel", "Decibels measure intensity, not how loud something feels. The ear's sensitivity depends strongly on frequency: it is best between about 2 000 and 5 000 Hz and poor at low frequencies, so a 50 Hz hum must be much more intense than a 3 000 Hz tone to sound equally loud. As a rule of thumb, a sound must rise by about 10 dB to seem twice as loud.")}
      </Callout>

      <H2>{tx(t, "phSnd_pipeTitle", "Notes from pipes")}</H2>
      <p>
        {tx(t, "phSnd_pipeBody",
          "A wind instrument is a column of air with standing sound waves in it, like a string with standing transverse waves. The difference is what happens at the ends. At a closed end the air cannot move, so it is a node of the air's motion. At an open end the air opens into the room, the pressure cannot build up, and the air moves freely: an antinode of motion. Fitting whole patterns into the pipe gives its notes.")}
      </p>
      <LessonTable
        headers={[tx(t, "phSnd_tPipe", "Pipe"), tx(t, "phSnd_tEnds", "Ends (motion)"), tx(t, "phSnd_tFit", "What fits"), tx(t, "phSnd_tNotes", "Frequencies"), tx(t, "phSnd_tInst", "Examples")]}
        rows={[
          [tx(t, "phSnd_p1", "open at both ends"), tx(t, "phSnd_p1e", "antinode, antinode"), "L = n λ/2", "f_n = n v / 2L, n = 1, 2, 3…", tx(t, "phSnd_p1i", "flute, open organ pipes")],
          [tx(t, "phSnd_p2", "closed at one end"), tx(t, "phSnd_p2e", "node, antinode"), "L = n λ/4, n odd", "f_n = n v / 4L, n = 1, 3, 5…", tx(t, "phSnd_p2i", "clarinet, pan pipes, a bottle you blow across")],
        ]}
      />
      <p>
        {tx(t, "phSnd_pipeBody2",
          "A closed pipe sounds an octave lower than an open pipe of the same length (λ = 4L instead of 2L), and has only odd harmonics. That missing set of even harmonics is part of the hollow sound of a clarinet, whose reed end acts as closed: its 60 cm tube gives f₁ ≈ 343 / (4 × 0.6) = 143 Hz, close to its lowest note, D3 at 147 Hz. An open organ pipe for the low C at 65 Hz must be about 343 / (2 × 65) = 2.6 m long. (In practice the antinode sits slightly beyond an open end, by about 0.6 times the pipe's radius, so real pipes are a little shorter.)")}
      </p>

      <H2>{tx(t, "phSnd_beatTitle", "Beats")}</H2>
      <p>
        {tx(t, "phSnd_beatBody",
          "Two tones of almost the same frequency drift in and out of step. When their crests line up they add; half a beat later crest meets trough and they cancel. The ear hears a single tone whose loudness throbs.")}
      </p>
      <Derivation t={t} label={tx(t, "phSnd_eqBeats", "Where beats come from")}
        steps={[
          { tex: r`y = \sin(2\pi f_1 t) + \sin(2\pi f_2 t)`, why: tx(t, "phSnd_b1", "two tones of equal size at one place, your ear") },
          { tex: r`= 2 \cos\!\Big(2\pi\, \frac{f_1 - f_2}{2}\, t\Big)\, \sin\!\Big(2\pi\, \frac{f_1 + f_2}{2}\, t\Big)`, why: tx(t, "phSnd_b2", "the sum-to-product identity used for standing waves") },
          { tex: r`\green{f_{beat} = |f_1 - f_2|}`, why: tx(t, "phSnd_b3", "a tone at the average frequency inside a slowly varying envelope; the loudness peaks twice per cycle of the cosine, so the beats come |f₁ − f₂| times a second") },
        ]} />
      <BeatsFigure t={t} />
      <p>
        {tx(t, "phSnd_beatBody2",
          "Beats are a sensitive tuning tool. Play a string together with a 440 Hz reference: four beats a second mean the string is 4 Hz off, at 436 or 444 Hz. Tighten it a little: if the beats slow down you are going the right way. When they stop, the two are in tune.")}
      </p>

      <H2>{tx(t, "phSnd_dopTitle", "The Doppler effect")}</H2>
      <p>
        {tx(t, "phSnd_dopBody",
          "A car horn or an ambulance siren sounds higher while it comes towards you and drops suddenly as it passes. The source does not change its note; the waves reaching you do. Christian Doppler explained it in 1842: once a crest leaves the source, it travels through the air at the speed of sound v, whatever the source does next. A source moving towards you chases its own crests, so they arrive closer together.")}
      </p>
      <Derivation t={t} label={tx(t, "phSnd_eqDopSrc", "A source moving towards you")}
        steps={[
          { tex: r`T = \frac{1}{f}`, why: tx(t, "phSnd_d1", "the source sends one crest every period T") },
          { tex: r`\lambda' = v T - v_s T = \frac{v - v_s}{f}`, why: tx(t, "phSnd_d2", "in one period the last crest moves v T ahead, but the source moves v_s T after it before sending the next: the gap shrinks") },
          { tex: r`\green{f' = \frac{v}{\lambda'} = f\, \frac{v}{v - v_s}}`, why: tx(t, "phSnd_d3", "the crests still travel at v, so you meet them more often") },
        ]} />
      <p>
        {tx(t, "phSnd_dopBody2",
          "If instead you move towards a source at rest, the wavelength is unchanged but you run into the crests faster, at v + v_o, so f' = f (v + v_o)/v. Both effects together give one formula.")}
      </p>
      <Equation label={tx(t, "phSnd_eqDop", "The Doppler effect for sound")}
        where={[
          [r`f'`, tx(t, "phSnd_wFp", "the frequency the listener hears (Hz)")],
          [r`f`, tx(t, "phSnd_wF", "the frequency the source sends out (Hz)")],
          [r`v`, tx(t, "phSnd_wVs", "the speed of sound in the air (m/s)")],
          [r`v_o`, tx(t, "phSnd_wVo", "the listener's speed, positive when moving towards the source")],
          [r`v_s`, tx(t, "phSnd_wVsrc", "the source's speed, positive when moving towards the listener")],
        ]}
        words={tx(t, "phSnd_dopWords", "Approaching raises the pitch, moving apart lowers it; the speeds are measured relative to the air.")}
        note={tx(t, "phSnd_dopNote", "For receding motion, make the speeds negative. A steady speed gives a steady pitch: the note does not climb as the source gets nearer, it jumps from high to low as it goes past.")}>
        {r`f' = f\, \frac{v + v_o}{v - v_s}`}
      </Equation>
      <DopplerFigure t={t} />
      <p>
        {tx(t, "phSnd_ambBody",
          "An ambulance at 25 m/s (90 km/h) with a 700 Hz siren: coming towards you, f' = 700 × 343/318 = 755 Hz; going away, f' = 700 × 343/368 = 652 Hz. The drop as it passes is about two and a half semitones. Police radar, weather radar and medical Doppler scans of blood flow all use the same effect with waves bounced off moving targets; with light, the Doppler shift tells astronomers how fast galaxies move away from us (the relativity chapters redo it for light).")}
      </p>

      <H3>{tx(t, "phSnd_boomTitle", "Faster than sound: the sonic boom")}</H3>
      <p>
        {tx(t, "phSnd_boomBody",
          "As v_s approaches v, the formula's denominator approaches zero: the source keeps pace with its own crests and they pile up into a wall of compressed air in front of it, the \"sound barrier\". Faster than sound, the source outruns its waves. Their fronts overlap along a cone trailing behind it, the Mach cone, whose half-angle θ satisfies sin θ = v / v_s. The ratio v_s / v is the Mach number. The cone carries a sudden jump in pressure, heard on the ground as a bang, the sonic boom, wherever the cone sweeps, all along the flight path, not only at the moment the plane passes Mach 1. Concorde at Mach 2 trailed a cone of half-angle 30°. The crack of a whip is a tiny sonic boom: its tip moves faster than sound.")}
      </p>

      <H2>{tx(t, "phSnd_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "phSnd_ex1", "1. Thunder arrives 6 s after the flash. The storm is 343 × 6 = 2.1 km away.")}</p>
      <p>{tx(t, "phSnd_ex2", "2. On a 30 °C day, v ≈ 331 + 0.6 × 30 = 349 m/s; on a 0 °C day, 331 m/s. Wind instruments go sharp as they warm up, because their notes are set by v / L.")}</p>
      <p>{tx(t, "phSnd_ex3", "3. One violin plays at 70 dB. Ten violins give ten times the intensity: 80 dB. Two give 73 dB, not 140.")}</p>
      <p>{tx(t, "phSnd_ex4", "4. You blow across a bottle with 25 cm of air above the liquid (closed at the bottom). f₁ = 343 / (4 × 0.25) = 343 Hz. Drink some: the column gets longer and the note goes down.")}</p>
      <p>{tx(t, "phSnd_ex5", "5. A train whistle at 500 Hz approaches at 30 m/s. f' = 500 × 343/313 = 548 Hz. You run towards a stationary whistle at 5 m/s: f' = 500 × 348/343 = 507 Hz.")}</p>

      <H2>{tx(t, "phSnd_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "phSnd_tWrong", "Wrong"), tx(t, "phSnd_tRight", "Right"), tx(t, "phSnd_tWhy2", "Why")]}
        rows={[
          [tx(t, "phSnd_m1w", "sound is faster in denser materials"), tx(t, "phSnd_m1r", "it depends on stiffness over density"), tx(t, "phSnd_m1", "steel is fast because it is far stiffer; helium because it is light")],
          [tx(t, "phSnd_m2w", "0 dB means silence"), tx(t, "phSnd_m2r", "the threshold of hearing"), tx(t, "phSnd_m2", "negative decibels exist; they are just too faint to hear")],
          [tx(t, "phSnd_m3w", "60 dB + 60 dB = 120 dB"), tx(t, "phSnd_m3r", "63 dB"), tx(t, "phSnd_m3", "intensities add, and twice the intensity is +3 dB")],
          [tx(t, "phSnd_m4w", "the pitch rises as the siren gets closer"), tx(t, "phSnd_m4r", "steady high, then steady low"), tx(t, "phSnd_m4", "it depends on the speed, not the distance; it drops as it passes")],
          [tx(t, "phSnd_m5w", "the boom happens once, when passing Mach 1"), tx(t, "phSnd_m5r", "the cone trails all along the flight"), tx(t, "phSnd_m5", "everyone under the path hears it as the cone sweeps by")],
          [tx(t, "phSnd_m6w", "a closed pipe has all harmonics"), tx(t, "phSnd_m6r", "odd harmonics only"), tx(t, "phSnd_m6", "a node at one end and an antinode at the other allow only odd quarter-waves")],
        ]}
      />

      <KeyIdeas t={t} id="phSnd" items={[
        "Sound is a longitudinal pressure wave; the pressure changes are tiny compared with air pressure.",
        "v = √(B/ρ); in a gas v = √(γRT/M), 343 m/s in air at 20 °C, independent of pressure, faster when warm.",
        "Intensity falls as 1/r² from a small source; β = 10 log₁₀(I/I₀): ×10 is +10 dB, ×2 is +3 dB.",
        "Open pipes ring at f_n = n v / 2L (all n), pipes closed at one end at n v / 4L (odd n only).",
        "Two close frequencies beat |f₁ − f₂| times a second.",
        "Doppler: f' = f (v + v_o)/(v − v_s); faster than sound, the waves form a Mach cone with sin θ = v / v_s.",
      ]} />
    </Article>
  );
}
