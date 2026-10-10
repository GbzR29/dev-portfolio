"use client";

// Sound: pitch — how high a sound feels — and how it follows frequency. The ear
// hears ratios, not differences, so equal steps of pitch are equal factors of
// frequency: ×2 is an octave, and twelve equal factors of 2^(1/12) are the
// piano's semitones. Ends with the key-number formula, a tuner's inverse of
// it, cents, and where the 440 Hz A comes from.

import { H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { noteName } from "@/components/lesson/kit/audio/notes";
import { MusicLadderFigure } from "@/components/lesson/figures/music/LadderFigure";
import { MusicOctaveFigure } from "@/components/lesson/figures/music/OctaveFigure";
import { MusicSemitoneFigure } from "@/components/lesson/figures/music/SemitoneFigure";
import { MusicPianoFigure } from "@/components/lesson/figures/music/PianoFigure";
import { intervalNumbers, keyNumbers, tunerNumbers } from "../live/pitch";

const r = String.raw;

export function PitchContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "musPit_intro",
          "Sing a low note, then a high one. What changed is the pitch: how high or low the sound feels. The last chapter showed that a note is a sound with a steady frequency. This chapter connects the two. It turns out the ear does not count hertz the way a meter does: it compares them. That one fact explains the octave, the twelve keys of the piano, and the number 1.06 you saw at the end of the last chapter.")}
      </Lead>

      <Goals t={t} id="musPit" items={[
        "Tell pitch (what you hear) apart from frequency (what a meter measures).",
        "Explain why equal steps of pitch are equal ratios of frequency.",
        "Say why two notes an octave apart sound like the same note.",
        "Derive the semitone ratio 2^(1/12) and compute the frequency of any piano key.",
        "Measure the distance between two frequencies in semitones and cents.",
      ]} />

      <H2>{tx(t, "musPit_whatTitle", "Pitch is how high a sound feels")}</H2>
      <p>
        {tx(t, "musPit_whatBody",
          "Frequency is a physical number: how many cycles of pressure reach your ear each second. Pitch is a sensation: where you would place the sound on a scale from low to high. They are tied together. Raise the frequency and the pitch rises; lower it and the pitch falls. A sound has a clear pitch only when it repeats, like the pure tone of the last chapter or a sung vowel. Noise, like rain, has none.")}
      </p>
      <p>
        {tx(t, "musPit_whatBody2",
          "A real instrument does not play a pure sine wave; its wave has a more complicated shape. But that shape still repeats a fixed number of times per second, and that repetition rate is the pitch you hear. Chapter 3 opens the shape up. Here, one number per note is enough: its frequency f.")}
      </p>

      <H2>{tx(t, "musPit_ratioTitle", "The ear hears ratios, not differences")}</H2>
      <p>
        {tx(t, "musPit_ratioBody",
          "Play 100 Hz, then 200 Hz. Now play 1 000 Hz, then 1 100 Hz. Both jumps add 100 Hz, but the first sounds huge and the second tiny. Now play 1 000 Hz, then 2 000 Hz: that jump sounds exactly as big as 100 → 200. What the two big jumps share is not the difference (100 Hz against 1 000 Hz) but the ratio: in both, the second frequency is twice the first.")}
      </p>
      <p>
        {tx(t, "musPit_ratioBody2",
          "So a step of pitch is a multiplication of frequency. Steps that multiply by the same factor sound the same size, wherever they start. The figure below builds two ladders from 110 Hz: one adds 110 Hz per rung, the other doubles. Listen to which one climbs evenly.")}
      </p>

      <MusicLadderFigure t={t} />

      <p>
        {tx(t, "musPit_ladderAfter",
          "The adding ladder (110, 220, 330, 440, 550, 660 Hz) will come back in chapter 3: it is the harmonic series, the set of frequencies hidden inside every note a string or a voice makes.")}
      </p>
      <Equation label={tx(t, "musPit_eqInterval", "The size of a step of pitch")}
        where={[
          [r`f_1`, tx(t, "musPit_wF1", "the frequency you start from, in Hz")],
          [r`f_2`, tx(t, "musPit_wF2", "the frequency you move to, in Hz")],
          [r`\frac{f_2}{f_1}`, tx(t, "musPit_wRatio", "the ratio: how many times bigger f₂ is than f₁. A ratio of 2 is the same heard step from 100 Hz or from 1 000 Hz")],
          [r`n`, tx(t, "musPit_wN", "the size of the step in octaves. One octave is one doubling (the next section explains the name)")],
          [r`\log_2`, tx(t, "musPit_wLog", "the logarithm base 2. log₂ x answers \"2 to what power gives x?\" log₂ 8 = 3 because 2³ = 8; log₂ 1.5 ≈ 0.585 because 2^0.585 ≈ 1.5. It counts how many doublings fit in the ratio")],
        ]}
        words={tx(t, "musPit_intervalWords", "To measure a step of pitch, divide the two frequencies and ask how many doublings that ratio is.")}>
        {r`n = \log_2 \frac{f_2}{f_1}`}
      </Equation>
      <Derivation t={t} label={tx(t, "musPit_dRange", "How many octaves does a piano span?")}
        steps={[
          { tex: r`f_1 = 27.5\ \text{Hz} \qquad f_2 = 4186.01\ \text{Hz}`, why: tx(t, "musPit_r0", "the lowest key of a piano (A0) and the highest (C8)") },
          { tex: r`\frac{f_2}{f_1} = \frac{4186.01}{27.5} \approx \amber{152.2}`, why: tx(t, "musPit_r1", "the top key vibrates about 152 times faster than the bottom one") },
          { tex: r`n = \log_2 152.2 \approx \green{7.25}`, why: tx(t, "musPit_r2", "2⁷ = 128 and 2⁸ = 256, so 152.2 lies between 7 and 8 doublings: 7.25 octaves") },
          { tex: r`7.25 \times 12 = 87\ \text{${tx(t, "musPit_r3t", "steps")}} \;\Rightarrow\; 88\ \text{${tx(t, "musPit_r3k", "keys")}}`, why: tx(t, "musPit_r3", "each octave has 12 keys (the next sections explain why); 87 steps join 88 keys") },
        ]} />

      <H2>{tx(t, "musPit_octTitle", "The octave: the same note, higher")}</H2>
      <p>
        {tx(t, "musPit_octBody",
          "Multiply a frequency by 2 and something special happens: the new note sounds like the old one, only higher. When men and women sing a melody together, they usually sing it an octave apart without noticing. Almost every musical culture in the world treats notes an octave apart as \"the same note\". This step is called an octave because in the most common Western scales it is the eighth note (Latin octavus, eighth) counting from the first.")}
      </p>
      <p>
        {tx(t, "musPit_octWhy",
          "The waves show why. In the time the lower note makes one cycle, the higher one makes exactly two. So the two waves start a new cycle together, again and again, and the pair repeats as one combined shape. The ear hears that shape as one note, not two.")}
      </p>

      <MusicOctaveFigure t={t} />

      <p>
        {tx(t, "musPit_octNames",
          "That is why note names repeat. Every A on the piano is called A; a number after the letter says which octave it is in. A4 is the A that orchestras tune to, A3 is the one an octave lower, A5 the one an octave higher. The octave number changes at every C, so B3 sits just below C4, which is middle C, the C in the middle of the piano.")}
      </p>
      <LessonTable
        headers={[tx(t, "musPit_tNote", "Note"), "A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"]}
        rows={[[tx(t, "musPit_tFreq", "Frequency (Hz)"), "27.5", "55", "110", "220", "440", "880", "1 760", "3 520"]]}
      />
      <Equation label={tx(t, "musPit_eqOct", "Octaves of a note")}
        where={[
          [r`f`, tx(t, "musPit_wOctF", "the frequency of the starting note, in Hz")],
          [r`k`, tx(t, "musPit_wK", "how many octaves you move: 1 is one octave up, −1 one octave down, 0 stays put")],
          [r`2^k`, tx(t, "musPit_w2k", "2 multiplied by itself k times (for negative k, 1 divided by that): ×2, ×4, ×8 up; ×½, ×¼ down")],
        ]}
        words={tx(t, "musPit_octWords", "Each octave up doubles the frequency; each octave down halves it.")}
        note={tx(t, "musPit_octNote", "Example: A4 is 440 Hz, so A2, two octaves lower (k = −2), is 440 · 2⁻² = 440 / 4 = 110 Hz.")}>
        {r`f_k = f \cdot 2^k`}
      </Equation>

      <H2>{tx(t, "musPit_semiTitle", "Twelve equal steps")}</H2>
      <p>
        {tx(t, "musPit_semiBody",
          "An octave is a big jump; melodies need smaller steps. Western music cuts every octave into 12 steps called semitones (half steps). On the piano, one semitone is the move from a key to the very next one, black or white. Count them from A3 to A4: A3, A♯3, B3, C4, C♯4, D4, D♯4, E4, F4, F♯4, G4, G♯4, A4. Thirteen keys, twelve steps.")}
      </p>
      <p>
        {tx(t, "musPit_semiBody2",
          "The steps should all sound the same size. Since the ear hears ratios, that means every step must multiply the frequency by the same number r. Twelve steps make one octave, so twelve multiplications by r must make one multiplication by 2.")}
      </p>
      <Derivation t={t} label={tx(t, "musPit_dSemi", "The semitone ratio")}
        steps={[
          { tex: r`f \cdot \underbrace{r \cdot r \cdots r}_{12} = f \cdot r^{12}`, why: tx(t, "musPit_s0", "climbing 12 semitones multiplies the frequency by r twelve times") },
          { tex: r`f \cdot r^{12} = 2f \;\Rightarrow\; r^{12} = 2`, why: tx(t, "musPit_s1", "12 semitones must land exactly one octave up, on 2f. Divide both sides by f") },
          { tex: r`r = 2^{1/12} = \sqrt[12]{2}`, why: tx(t, "musPit_s2", "r is the twelfth root of 2: the number that, multiplied by itself 12 times, gives 2") },
          { tex: r`r \approx \green{1.059463}`, why: tx(t, "musPit_s3", "the \"about 1.06\" from the last chapter: each key is about 6 % higher than the one below it") },
          { tex: r`1.059463^{12} \approx 2.0000 \checkmark`, why: tx(t, "musPit_s4", "check: twelve steps of 1.059463 give back the octave") },
        ]} />

      <MusicSemitoneFigure t={t} />

      <p>
        {tx(t, "musPit_semiAfter",
          "Notice the price of equal steps: in hertz the semitones are not equal at all. From A3 to A♯3 is 13.1 Hz; from G♯4 to A4 is 24.7 Hz. One octave higher every gap doubles again. Only the ratios stay the same.")}
      </p>
      <p>
        {tx(t, "musPit_why12",
          "Why 12 and not 10 or 20? Nothing in physics demands it. Twelve won because its steps land almost exactly on the other simple ratios the ear loves, after the octave. The most important is 3 : 2, the fifth: seven semitones give 2^(7/12) ≈ 1.498, very close to 1.5. A later chapter, Equal temperament, tells that story and the small compromise it hides.")}
      </p>

      <H2>{tx(t, "musPit_keyTitle", "The frequency of any key")}</H2>
      <p>
        {tx(t, "musPit_keyBody",
          "Give every key a number m that goes up by one per semitone. The standard choice comes from MIDI, the language electronic instruments use to talk to each other: middle C is 60 and the tuning A (A4) is 69. The piano runs from 21 (A0) to 108 (C8). Now start at A4 = 440 Hz and climb m − 69 semitones: each one multiplies by 2^(1/12).")}
      </p>
      <Equation label={tx(t, "musPit_eqKey", "Frequency of key m")}
        where={[
          [r`f`, tx(t, "musPit_wKF", "the key's frequency, in Hz")],
          [r`m`, tx(t, "musPit_wM", "the key number: 60 is middle C, 69 is A4, one more for each semitone up")],
          [r`440`, tx(t, "musPit_w440", "the frequency of A4, the agreed starting point (the last section says why 440)")],
          [r`69`, tx(t, "musPit_w69", "the key number of A4, so that m − 69 counts semitones from A4: negative below it, positive above")],
          [r`12`, tx(t, "musPit_w12", "semitones per octave: every 12 keys the exponent grows by 1 and the frequency doubles")],
        ]}
        words={tx(t, "musPit_keyWords", "Start at 440 Hz and multiply by 2^(1/12) once for every key you move up from A4 (divide, for every key down).")}>
        {r`f = 440 \cdot 2^{(m - 69)/12}`}
      </Equation>
      <Derivation t={t} label={tx(t, "musPit_dMiddleC", "Middle C, step by step")}
        steps={[
          { tex: r`m = 60 \;\Rightarrow\; m - 69 = -9`, why: tx(t, "musPit_c0", "middle C is 9 semitones below A4 (count the keys: C, C♯, D, D♯, E, F, F♯, G, G♯, then A)") },
          { tex: r`f = 440 \cdot 2^{-9/12} = 440 \cdot 2^{-0.75}`, why: tx(t, "musPit_c1", "nine steps down, three quarters of an octave") },
          { tex: r`2^{-0.75} = \frac{1}{2^{0.75}} \approx \frac{1}{1.6818} \approx 0.5946`, why: tx(t, "musPit_c2", "a negative power means dividing: going down shrinks the frequency") },
          { tex: r`f \approx 440 \times 0.5946 \approx \green{261.63\ \text{Hz}}`, why: tx(t, "musPit_c3", "the frequency of middle C") },
        ]} />
      <LiveFormula label={tx(t, "musPit_liveKey", "Try it: any key's frequency")}
        tex={r`f = 440 \cdot 2^{(m - 69)/12}`}
        vars={[{ id: "m", label: tx(t, "musPit_liveM", "key number m"), min: 21, max: 108, step: 1, value: 60, fmt: v => `${v} = ${noteName(v)}` }]}
        compute={keyNumbers}
        where={[
          [r`m`, tx(t, "musPit_wM2", "the key number, from 21 (A0, lowest piano key) to 108 (C8, highest)")],
        ]}
        note={tx(t, "musPit_liveKeyNote", "Move m by 12 and watch the result double or halve. Move it by 1 and it changes by about 6 %.")} />

      <H3>{tx(t, "musPit_tunerTitle", "Backwards: which key is this frequency?")}</H3>
      <p>
        {tx(t, "musPit_tunerBody",
          "A guitar tuner does the formula backwards: it measures a frequency and finds the key. Solving f = 440 · 2^((m − 69)/12) for m undoes each step in reverse order: divide by 440, take log₂ (which undoes \"2 to the power\"), multiply by 12, add 69. The answer is usually not a whole number. The nearest whole number is the note you are playing; the leftover says how far off you are.")}
      </p>
      <LiveFormula label={tx(t, "musPit_liveTuner", "Try it: a tuner")}
        tex={r`m = 69 + 12 \log_2 \frac{f}{440}`}
        vars={[{ id: "f", label: tx(t, "musPit_liveTF", "frequency f (Hz)"), min: 100, max: 1000, step: 0.5, value: 300 }]}
        compute={tunerNumbers(t)}
        where={[
          [r`m`, tx(t, "musPit_wTM", "the key number the frequency falls on, usually between two keys")],
          [r`f`, tx(t, "musPit_wTF", "the measured frequency, in Hz")],
          [r`\log_2 \frac{f}{440}`, tx(t, "musPit_wTLog", "how many octaves f is above A4 (negative when below)")],
        ]}
        note={tx(t, "musPit_liveTunerNote", "300 Hz gives m ≈ 62.37: nearest key 62 (D4, 293.66 Hz), and the 0.37 left over is 37 cents sharp. The next section explains cents.")} />

      <H2>{tx(t, "musPit_centsTitle", "Cents: steps smaller than a key")}</H2>
      <p>
        {tx(t, "musPit_centsBody",
          "To talk about \"a little out of tune\", musicians split each semitone into 100 equal steps called cents, so one octave is 1 200 cents. Like semitones, cents are equal ratios: one cent multiplies the frequency by 2^(1/1200) ≈ 1.000578. In the middle of the range of hearing most listeners can tell two tones apart when they differ by about 5 to 10 cents; a trained ear does a little better. A tuner's needle shows exactly this number.")}
      </p>
      <Equation label={tx(t, "musPit_eqCents", "The distance between two frequencies, in cents")}
        where={[
          [r`c`, tx(t, "musPit_wC", "the distance in cents: positive when f₂ is higher, negative when lower")],
          [r`1200`, tx(t, "musPit_w1200", "cents per octave: 12 semitones × 100 cents")],
          [r`\log_2 \frac{f_2}{f_1}`, tx(t, "musPit_wCLog", "the distance in octaves, from the first formula of this chapter")],
        ]}
        words={tx(t, "musPit_centsWords", "Measure the step in octaves, then multiply by 1 200 to get cents (or by 12 to get semitones).")}>
        {r`c = 1200 \log_2 \frac{f_2}{f_1}`}
      </Equation>
      <LiveFormula label={tx(t, "musPit_liveCents", "Try it: how far apart are two tones?")}
        tex={r`c = 1200 \log_2 \frac{f_2}{f_1}`}
        vars={[
          { id: "f1", label: tx(t, "musPit_liveF1", "f₁ (Hz)"), min: 100, max: 1000, step: 1, value: 440 },
          { id: "f2", label: tx(t, "musPit_liveF2", "f₂ (Hz)"), min: 100, max: 1000, step: 1, value: 660 },
        ]}
        compute={intervalNumbers(t)}
        note={tx(t, "musPit_liveCentsNote", "440 and 660 Hz are in the ratio 3 : 2: 702 cents, two cents wider than the 700 of seven piano semitones. Try 440 and 880 (1 200 cents), then 440 and 441: one hertz is about 4 cents here.")} />

      <H2>{tx(t, "musPit_440Title", "Where 440 comes from")}</H2>
      <p>
        {tx(t, "musPit_440Body",
          "Nothing in nature makes A equal 440 Hz. The formula needs one fixed note, and for centuries every city, church and orchestra picked its own. Instruments built for one town were out of tune in the next. The number was settled by agreement.")}
      </p>
      <LessonTable
        headers={[tx(t, "musPit_hWhen", "When"), tx(t, "musPit_hWho", "Who"), "A4"]}
        rows={[
          [tx(t, "musPit_h1w", "1600s–1700s"), tx(t, "musPit_h1", "Baroque Europe: varied from town to town"), tx(t, "musPit_h1a", "about 390 to 465 Hz")],
          ["1859", tx(t, "musPit_h2", "France fixes a national \"diapason normal\""), "435 Hz"],
          ["1939", tx(t, "musPit_h3", "International conference in London"), "440 Hz"],
          ["1975", tx(t, "musPit_h4", "ISO 16, the international standard"), "440 Hz"],
          [tx(t, "musPit_h5w", "today"), tx(t, "musPit_h5", "Many European orchestras, for a brighter sound"), "442–443 Hz"],
          [tx(t, "musPit_h6w", "today"), tx(t, "musPit_h6", "Baroque ensembles on period instruments"), "415 Hz"],
        ]}
      />
      <p>
        {tx(t, "musPit_440End",
          "Baroque groups chose 415 Hz for a neat reason: 440 · 2^(−1/12) = 415.3 Hz, exactly one semitone lower. A keyboard can then switch between the two by shifting every key by one. Change the 440 in the formula and every key moves with it; the ratios between keys, and so the music, stay the same.")}
      </p>
      <p>
        {tx(t, "musPit_end",
          "Play the piano again with all this in mind. Every key is 2^(1/12) above the one to its left, every twelfth key doubles, and each readout is the formula of this chapter.")}
      </p>

      <MusicPianoFigure t={t} />

      <KeyIdeas t={t} id="musPit" items={[
        "Pitch is the sensation, frequency the measurement; a sound has a clear pitch when its wave repeats.",
        "The ear hears ratios: steps that multiply the frequency by the same factor sound the same size. Size in octaves: n = log₂(f₂/f₁).",
        "An octave doubles the frequency; the waves line up, so the two notes sound like the same note, and note names repeat.",
        "The octave is cut into 12 equal semitones of ratio 2^(1/12) ≈ 1.0595, so their sizes in hertz grow as you go up.",
        "Key m has frequency f = 440 · 2^((m − 69)/12); a tuner solves it backwards, m = 69 + 12·log₂(f/440).",
        "A cent is 1/100 of a semitone; c = 1200·log₂(f₂/f₁). A4 = 440 Hz is an agreement (1939, ISO 16), not a law of nature.",
      ]} />
    </Article>
  );
}
