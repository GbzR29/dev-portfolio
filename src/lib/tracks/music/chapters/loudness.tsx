"use client";

// Sound: loudness — how strong a sound is, and how a note's strength changes
// over its life. Pressure swing → intensity (∝ p²); the ear hears ratios, so
// levels are logarithmic: the decibel, derived from the bel. Distance (inverse
// square), adding instruments, phons and sones, equal-loudness curves, safe
// listening, dynamics marks, and the ADSR envelope.

import { H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { MusicLoudnessStepsFigure } from "@/components/lesson/figures/music/LoudnessStepsFigure";
import { MusicEqualLoudnessFigure } from "@/components/lesson/figures/music/EqualLoudnessFigure";
import { MusicEnvelopeFigure } from "@/components/lesson/figures/music/EnvelopeFigure";
import { distanceNumbers, exposureNumbers, pa, sectionNumbers, splNumbers } from "../live/loudness";

const r = String.raw;

export function LoudnessContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "musLou_intro",
          "Pitch is how often the air is pushed; timbre is the shape of each push. The last basic property of a sound is how hard it pushes: its loudness. Measuring it turns out to need the same trick as pitch, because the ear hears ratios again. This chapter builds the decibel from scratch, shows why the ear is not a meter, and ends with the shape of loudness over a single note: its envelope.")}
      </Lead>

      <Goals t={t} id="musLou" items={[
        "Explain why sound levels are measured on a logarithmic scale.",
        "Derive the decibel from a ratio of intensities, and convert between pressure and dB.",
        "Use the rules of thumb: +6 dB doubles the pressure, +3 dB doubles the power, +10 dB sounds about twice as loud.",
        "Explain why a quiet bass note sounds weaker than a quiet treble note of the same level.",
        "Describe a note's envelope with attack, decay, sustain and release.",
      ]} />

      <H2>{tx(t, "musLou_ampTitle", "From pressure swing to power")}</H2>
      <p>
        {tx(t, "musLou_ampBody",
          "Chapter 1 showed that a bigger pressure swing, a bigger amplitude, sounds louder. But the energy a sound carries grows faster than its swing. Push the air twice as hard and it also moves twice as fast, so each push delivers four times the energy. The energy that flows through one square metre each second is called the intensity, and it grows with the square of the pressure.")}
      </p>
      <Equation label={tx(t, "musLou_eqI", "Intensity of a sound wave")}
        where={[
          [r`I`, tx(t, "musLou_wI", "the intensity: the power of the sound passing through each square metre, in watts per square metre (W/m²)")],
          [r`p`, tx(t, "musLou_wP", "the pressure swing in pascals. Strictly it is the root-mean-square value, a kind of average swing: for a pure tone, the amplitude divided by √2 ≈ 1.41. The tables in this track use it")],
          [r`\rho`, tx(t, "musLou_wRho", "the density of air (Greek rho), about 1.2 kg/m³")],
          [r`c`, tx(t, "musLou_wC", "the speed of sound, about 343 m/s, as in chapter 1. Together, ρ·c ≈ 413 says how stiffly air resists being pushed")],
        ]}
        words={tx(t, "musLou_iWords", "Twice the pressure swing carries four times the power.")}
        note={tx(t, "musLou_iNote", "Normal conversation, p = 0.02 Pa, gives I = 0.0004 / 413 ≈ 0.000001 W/m²: a millionth of a watt on each square metre. Sound carries astonishingly little energy; it is the ear that is astonishingly sensitive.")}>
        {r`I = \frac{p^2}{\rho\, c}`}
      </Equation>

      <H2>{tx(t, "musLou_ratioTitle", "The ear hears ratios, again")}</H2>
      <p>
        {tx(t, "musLou_ratioBody",
          "From the quietest sound you can hear to a painful one, the pressure swing grows a million times, and the intensity a million million times. No ear could hear that range in even steps. Instead it works as it does for pitch: what you notice is the ratio. Going from 1 to 2 violins is a clear step up; going from 50 to 51 is nothing, although both add one violin. Doubling the pressure feels like roughly the same step wherever you start. This idea, that the senses respond to ratios, is called the Weber–Fechner law, after the two German scientists who measured it in the 1800s. Hear it for yourself:")}
      </p>

      <MusicLoudnessStepsFigure t={t} />

      <H2>{tx(t, "musLou_dbTitle", "The decibel")}</H2>
      <p>
        {tx(t, "musLou_dbBody",
          "A scale that turns equal ratios into equal steps is a logarithm. Engineers at Bell Telephone needed one in the 1920s to describe how much a signal weakens along a telephone line, and named the unit after Alexander Graham Bell. Here is how it is built.")}
      </p>
      <Derivation t={t} label={tx(t, "musLou_dDb", "From a ratio of powers to decibels")}
        steps={[
          { tex: r`\frac{I}{I_0}`, why: tx(t, "musLou_d0", "start from a ratio: how many times more intense the sound I is than a reference I₀. For sound, I₀ = 10⁻¹² W/m², about the quietest sound a young ear can hear") },
          { tex: r`\log_{10} \frac{I}{I_0}\ \ \text{bels}`, why: tx(t, "musLou_d1", "take its logarithm in base 10: it counts how many times you multiplied by 10. A sound 1000 times more intense is 3 bels. Equal ratios are now equal steps") },
          { tex: r`L = 10 \log_{10} \frac{I}{I_0}\ \ \text{dB}`, why: tx(t, "musLou_d2", "a bel is a big step, so we count tenths of a bel: decibels, written dB. Multiply by 10. Now a sound 1000 times more intense is 30 dB") },
          { tex: r`L = 10 \log_{10} \frac{p^2}{p_0^2}`, why: tx(t, "musLou_d3", "intensity grows with the pressure squared (I = p²/ρc; the ρc cancels in the ratio), so swap I/I₀ for p²/p₀², with p₀ the pressure of the reference sound") },
          { tex: r`L = 10 \cdot 2 \log_{10} \frac{p}{p_0} = \amber{20 \log_{10} \frac{p}{p_0}}`, why: tx(t, "musLou_d4", "the logarithm of a square is twice the logarithm (log x² = 2 log x). So for pressures, the factor is 20, not 10") },
        ]} />
      <Equation label={tx(t, "musLou_eqSpl", "Sound pressure level")}
        where={[
          [r`L`, tx(t, "musLou_wL", "the sound pressure level, in decibels (dB)")],
          [r`p`, tx(t, "musLou_wP2", "the pressure swing of the sound, in pascals")],
          [r`p_0`, tx(t, "musLou_wP0", "the reference pressure, 0.00002 Pa (20 micropascals): about the quietest sound a young ear can hear at 1000 Hz. A sound exactly that strong is 0 dB")],
          [r`\log_{10}`, tx(t, "musLou_wLog", "the logarithm in base 10: the power you must raise 10 to. log₁₀ 100 = 2, log₁₀ 1 000 000 = 6")],
        ]}
        words={tx(t, "musLou_splWords", "Count how many times ten the pressure is above the faintest audible sound, and multiply by 20.")}
        note={tx(t, "musLou_splNote", "0 dB is not silence: it is the edge of hearing. Sounds quieter than that have negative levels.")}>
        {r`L = 20 \log_{10} \frac{p}{p_0}`}
      </Equation>
      <LiveFormula label={tx(t, "musLou_liveSpl", "Try it: pressure to decibels")}
        tex={r`L = 20 \log_{10} \frac{p}{p_0}`}
        vars={[
          { id: "e", label: tx(t, "musLou_liveP", "pressure swing p (the slider moves in powers of ten)"), min: -4.7, max: 1.6, step: 0.05, value: -1.7, fmt: v => `${pa(10 ** v)} Pa` },
        ]}
        compute={splNumbers}
        where={[
          [r`p_0`, tx(t, "musLou_wP0b", "0.00002 Pa, the edge of hearing")],
        ]}
        note={tx(t, "musLou_liveSplNote", "Every ×10 of pressure adds 20 dB: 0.0002 Pa is 20 dB, 0.002 Pa is 40 dB, 0.02 Pa is 60 dB. The whole range of hearing, a factor of a million in pressure, fits between 0 and 120 dB.")} />
      <LessonTable
        headers={[tx(t, "musLou_tSound", "Sound"), tx(t, "musLou_tP", "Pressure"), tx(t, "musLou_tL", "Level")]}
        rows={[
          [tx(t, "musLou_s1", "Edge of hearing"), "0.00002 Pa", "0 dB"],
          [tx(t, "musLou_s2", "Rustling leaves, quiet breathing"), "0.00006 Pa", "10 dB"],
          [tx(t, "musLou_s3", "Whisper, 1 m away"), "0.0006 Pa", "30 dB"],
          [tx(t, "musLou_s4", "Normal conversation, 1 m away"), "0.02 Pa", "60 dB"],
          [tx(t, "musLou_s5", "Busy street; a piano played loudly nearby"), "0.2 Pa", "80 dB"],
          [tx(t, "musLou_s6", "Front row of a rock concert"), "2 Pa", "100 dB"],
          [tx(t, "musLou_s7", "Pain: a jet engine nearby"), "20 Pa", "120 dB"],
        ]}
      />
      <LessonTable
        headers={[tx(t, "musLou_rChange", "Change in level"), tx(t, "musLou_rP", "Pressure"), tx(t, "musLou_rI", "Intensity (power)")]}
        rows={[
          ["+3 dB", "×1.41 (√2)", "×2"],
          ["+6 dB", "×2", "×4"],
          ["+10 dB", "×3.16 (√10)", "×10"],
          ["+20 dB", "×10", "×100"],
        ]}
      />
      <p>
        {tx(t, "musLou_rules",
          "Each row follows from the formula. 20·log₁₀ 2 = 20 × 0.301 = 6.02, so doubling the pressure adds 6 dB; doubling the power is a square root of that, half the decibels, 3 dB. Decibels add where ratios multiply: +6 dB and then +6 dB more is +12 dB, four times the pressure.")}
      </p>

      <H3>{tx(t, "musLou_distTitle", "Walking away from the sound")}</H3>
      <p>
        {tx(t, "musLou_distBody",
          "Outdoors, sound spreads from its source in every direction, like a growing bubble. The same power is spread over the bubble's surface, which grows with the square of its radius. That is why a sound gets quieter as you walk away.")}
      </p>
      <Derivation t={t} label={tx(t, "musLou_dDist", "Why each doubling of distance costs 6 dB")}
        steps={[
          { tex: r`I = \frac{P}{4 \pi r^2}`, why: tx(t, "musLou_e0", "a source of power P (watts) spreads it over a sphere of radius r, whose area is 4πr²") },
          { tex: r`\frac{I_2}{I_1} = \frac{r_1^2}{r_2^2} = \left(\frac{r_1}{r_2}\right)^2`, why: tx(t, "musLou_e1", "compare two distances: P and 4π cancel. Twice as far is a quarter of the intensity: the inverse-square law") },
          { tex: r`L_2 - L_1 = 10 \log_{10} \left(\frac{r_1}{r_2}\right)^2 = -20 \log_{10} \frac{r_2}{r_1}`, why: tx(t, "musLou_e2", "turn the ratio into decibels. The square becomes a factor 2, and flipping the fraction flips the sign") },
          { tex: r`r_2 = 2 r_1 \ \Rightarrow\ L_2 - L_1 = -20 \times 0.301 = \amber{-6\ \text{dB}}`, why: tx(t, "musLou_e3", "every doubling of the distance takes 6 dB away") },
        ]} />
      <LiveFormula label={tx(t, "musLou_liveDist", "Try it: how loud from further away")}
        tex={r`L_2 = L_1 - 20 \log_{10} \frac{r_2}{r_1}`}
        vars={[
          { id: "L1", label: tx(t, "musLou_liveL1", "level L₁ at the first distance (dB)"), min: 40, max: 120, step: 1, value: 100, fmt: v => `${v} dB` },
          { id: "r1", label: tx(t, "musLou_liveR1", "first distance r₁ (m)"), min: 1, max: 10, step: 0.5, value: 1, fmt: v => `${v} m` },
          { id: "r2", label: tx(t, "musLou_liveR2", "new distance r₂ (m)"), min: 1, max: 200, step: 1, value: 16, fmt: v => `${v} m` },
        ]}
        compute={distanceNumbers}
        where={[
          [r`L_1`, tx(t, "musLou_wL1", "the level measured at distance r₁")],
          [r`L_2`, tx(t, "musLou_wL2", "the level at the new distance r₂")],
        ]}
        note={tx(t, "musLou_liveDistNote", "A guitar amp at 100 dB a metre away is still 76 dB at 16 m: four doublings, 4 × 6 = 24 dB. Indoors the walls reflect sound back, so levels fall more slowly than this.")} />

      <H3>{tx(t, "musLou_addTitle", "Adding instruments")}</H3>
      <p>
        {tx(t, "musLou_addBody",
          "Two violins playing the same note equally loud are not twice the decibels. Their waves are not lined up, so their powers add, not their pressures: twice the power is +3 dB. A section of n equal instruments is 10·log₁₀ n decibels louder than one. And how loud does that sound? Experiments by the American psychologist Stanley Smith Stevens in the 1930s found that about +10 dB is heard as twice as loud. That is why an orchestra needs so many violins.")}
      </p>
      <LiveFormula label={tx(t, "musLou_liveSection", "Try it: a section of n instruments")}
        tex={r`L = L_1 + 10 \log_{10} n \qquad \text{loudness} \times 2^{(L - L_1)/10}`}
        vars={[
          { id: "L1", label: tx(t, "musLou_liveOne", "one instrument L₁ (dB)"), min: 40, max: 100, step: 1, value: 70, fmt: v => `${v} dB` },
          { id: "n", label: tx(t, "musLou_liveN", "number of instruments n"), min: 1, max: 64, step: 1, value: 16 },
        ]}
        compute={sectionNumbers(t)}
        where={[
          [r`L_1`, tx(t, "musLou_wOne", "the level of one instrument on its own")],
          [r`n`, tx(t, "musLou_wN", "how many equal instruments play together")],
          [r`2^{(L - L_1)/10}`, tx(t, "musLou_wTwice", "how many times louder it sounds: each +10 dB doubles the loudness")],
        ]}
        note={tx(t, "musLou_liveSectionNote", "Sixteen violins are 12 dB above one, and sound only about 2.3 times as loud. To sound twice as loud again you need ten times the players: 160.")} />

      <H2>{tx(t, "musLou_perceptTitle", "Level is not loudness")}</H2>
      <p>
        {tx(t, "musLou_perceptBody",
          "Decibels describe the sound; loudness is what you hear, and they are not the same thing. Chapter 1 noted that the ear is most sensitive between 2 and 5 kHz. In 1933 Harvey Fletcher and Wilden Munson, at Bell Labs, asked listeners to match the loudness of tones at many frequencies against a 1000 Hz tone. The results are equal-loudness curves: for each frequency, the level needed to sound equally loud. Loudness measured this way has its own unit, the phon: a sound is 40 phons if it sounds as loud as a 40 dB tone at 1000 Hz. Measure your own:")}
      </p>

      <MusicEqualLoudnessFigure t={t} />

      <p>
        {tx(t, "musLou_perceptAfter",
          "A quiet 63 Hz tone needs about 33 dB more than 1000 Hz to sound as loud: about 45 times the pressure. At loud levels the curves flatten out, so the ear hears the bass better when the music is loud. That is why music played softly sounds thin, and why old stereos had a \"loudness\" button that boosted the bass at low volume. Sound level meters copy the quiet curve with a filter called A-weighting, and report dB(A), or dBA.")}
      </p>

      <H3>{tx(t, "musLou_safeTitle", "Protecting your hearing")}</H3>
      <p>
        {tx(t, "musLou_safeBody",
          "The tiny hair cells in the inner ear that detect sound do not grow back once loud sound has destroyed them. Health agencies such as the American NIOSH say 85 dBA is safe for 8 hours a day, and that the safe time halves for every 3 dB above that, because +3 dB is twice the power.")}
      </p>
      <LiveFormula label={tx(t, "musLou_liveSafe", "Try it: safe listening time per day")}
        tex={r`T = \frac{8\ \text{h}}{2^{(L - 85)/3}}`}
        vars={[
          { id: "L", label: tx(t, "musLou_liveLevel", "level L (dBA)"), min: 85, max: 115, step: 1, value: 100, fmt: v => `${v} dBA` },
        ]}
        compute={exposureNumbers}
        where={[
          [r`T`, tx(t, "musLou_wT", "the longest safe listening time in one day")],
          [r`L`, tx(t, "musLou_wLevel", "the A-weighted level at your ears")],
          [r`(L - 85)/3`, tx(t, "musLou_wHalvings", "how many 3 dB steps above 85: each one halves the time")],
        ]}
        note={tx(t, "musLou_liveSafeNote", "A concert at 100 dBA is safe for about 15 minutes; earplugs that take 20 dB off bring it down to 80 dBA, safe for the whole day. Headphones at full volume can pass 100 dBA too.")} />

      <H2>{tx(t, "musLou_dynTitle", "Loudness in music: dynamics")}</H2>
      <p>
        {tx(t, "musLou_dynBody",
          "Composers write loudness with Italian words, called dynamics. They are relative, not decibel values: a forte on a flute is much quieter than a forte on a trumpet. Around 1700 Bartolomeo Cristofori in Florence built a keyboard whose hammers played softer or louder depending on how hard the key was struck, something the harpsichord could not do. He called it the gravicembalo col piano e forte, the \"harpsichord with soft and loud\". We still call it the pianoforte, or piano.")}
      </p>
      <LessonTable
        headers={[tx(t, "musLou_dMark", "Mark"), tx(t, "musLou_dWord", "Italian"), tx(t, "musLou_dMeans", "Means")]}
        rows={[
          ["pp", "pianissimo", tx(t, "musLou_dPp", "very soft")],
          ["p", "piano", tx(t, "musLou_dP", "soft")],
          ["mp", "mezzo-piano", tx(t, "musLou_dMp", "moderately soft")],
          ["mf", "mezzo-forte", tx(t, "musLou_dMf", "moderately loud")],
          ["f", "forte", tx(t, "musLou_dF", "loud")],
          ["ff", "fortissimo", tx(t, "musLou_dFf", "very loud")],
          ["cresc. / <", "crescendo", tx(t, "musLou_dCresc", "getting louder")],
          ["dim. / >", "diminuendo", tx(t, "musLou_dDim", "getting softer")],
        ]}
      />

      <H2>{tx(t, "musLou_envTitle", "The life of a note: its envelope")}</H2>
      <p>
        {tx(t, "musLou_envBody",
          "Loudness also changes within a single note. A piano note jumps to full strength the instant the hammer hits, then fades away even while you hold the key. An organ pipe sounds at a steady level for as long as the key is down. A violinist can let a note swell. This rise and fall of a note's level over time is its envelope. Synthesizers describe it with four numbers, ADSR:")}
      </p>
      <LessonTable
        headers={[tx(t, "musLou_aStage", "Stage"), tx(t, "musLou_aWhen", "When"), tx(t, "musLou_aWhat", "What happens")]}
        rows={[
          [tx(t, "musLou_aA", "A — attack"), tx(t, "musLou_aAw", "the key goes down"), tx(t, "musLou_aAd", "the level rises from silence to its peak; the attack is the time this takes")],
          [tx(t, "musLou_aD", "D — decay"), tx(t, "musLou_aDw", "right after the peak"), tx(t, "musLou_aDd", "the level falls from the peak towards the sustain level")],
          [tx(t, "musLou_aS", "S — sustain"), tx(t, "musLou_aSw", "while the key stays down"), tx(t, "musLou_aSd", "the level held. It is a level (0 to 100 %), not a time: it lasts as long as you hold")],
          [tx(t, "musLou_aR", "R — release"), tx(t, "musLou_aRw", "the key is let go"), tx(t, "musLou_aRd", "the level fades to silence; the release is the time this takes")],
        ]}
      />
      <Equation label={tx(t, "musLou_eqDecay", "The decay stage, as this track's synthesizer makes it")}
        where={[
          [r`g(t)`, tx(t, "musLou_wG", "the level of the note at time t, from 0 (silent) to 1 (the peak); it multiplies the wave's amplitude")],
          [r`S`, tx(t, "musLou_wS", "the sustain level the decay heads for")],
          [r`A`, tx(t, "musLou_wA", "the attack time: the decay starts when the attack ends, at t = A")],
          [r`e`, tx(t, "musLou_wE", "Euler's number, about 2.718. e raised to a growing negative power shrinks smoothly towards 0")],
          [r`\tau`, tx(t, "musLou_wTau", "the time constant (Greek tau): every τ seconds, the gap to S shrinks to 37 % (1/e). With τ = D/3, after D seconds only e⁻³ ≈ 5 % of the gap is left, so D is when the decay is 95 % done")],
        ]}
        words={tx(t, "musLou_decayWords", "After the peak, the level slides towards S, closing the same fraction of the remaining gap every moment.")}
        note={tx(t, "musLou_decayNote", "The release has the same shape, heading for 0 instead of S. Natural sounds fade like this, by a fixed fraction per second, which is a fixed number of decibels per second: a piano note loses roughly the same number of dB every second.")}>
        {r`g(t) = S + (1 - S)\, e^{-(t - A)/\tau}, \qquad \tau = \frac{D}{3}`}
      </Equation>

      <MusicEnvelopeFigure t={t} />

      <p>
        {tx(t, "musLou_envAfter",
          "Chapter 3 said the start of a note carries much of its identity, and the figure proves it: the harmonics never change, yet the envelope alone turns an organ into a plucked string or a violin. Real instruments go further, because their recipe also changes along the envelope; a piano's high harmonics die out faster than its low ones. The envelope is also a limit on rhythm: a note cannot be shorter than its attack, which is why slow-speaking instruments like the tuba or a church organ's big pipes struggle with fast passages. Rhythm is where the next section starts.")}
      </p>

      <KeyIdeas t={t} id="musLou" items={[
        "Intensity, the power per square metre, grows with the square of the pressure: I = p²/(ρc).",
        "The ear hears ratios of loudness, so levels are logarithmic: L = 10·log₁₀(I/I₀) = 20·log₁₀(p/p₀) dB, with p₀ = 0.00002 Pa (0 dB, the edge of hearing).",
        "+3 dB doubles the power, +6 dB doubles the pressure, +10 dB sounds about twice as loud; twice the distance outdoors is −6 dB, n equal instruments add 10·log₁₀ n.",
        "The ear is far less sensitive to low tones at quiet levels (equal-loudness curves, phons, dBA).",
        "85 dBA is safe for 8 hours; every +3 dB halves the safe time.",
        "Dynamics (pp … ff) are relative marks; the piano is named after them.",
        "A note's envelope is attack, decay, sustain (a level) and release; with the same harmonics, the envelope alone can change the instrument.",
      ]} />
    </Article>
  );
}
