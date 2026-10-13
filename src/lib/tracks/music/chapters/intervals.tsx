"use client";

// Scales: intervals. Two measures of the distance between two notes: the
// number (letters counted, both ends included, n = d₂ − d₁ + 1) and the size
// (half steps, s = m₂ − m₁); why the same number comes in two sizes on the
// white keys (s = 2(n − 1) − h); the qualities (perfect, major, minor,
// augmented, diminished) from Δ = s − s_ref(n); same keys with different names
// (A2/m3, A4/d5, the two half steps); inversion (n + n' = 9, s + s' = 12);
// compound intervals; consonance and dissonance, with tunes to learn them by.

import { H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { ForInstrument } from "@/components/lesson/kit/audio/useInstrument";
import { MusicIntervalFigure } from "@/components/lesson/figures/music/IntervalFigure";
import { MusicIntervalLadderFigure } from "@/components/lesson/figures/music/IntervalLadderFigure";
import { MusicIntervalQuizFigure } from "@/components/lesson/figures/music/IntervalQuizFigure";
import { abbr } from "@/components/lesson/figures/music/intervals";
import { nameNumbers } from "../live/intervals";

const r = String.raw;

export function IntervalsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "musInt_intro",
          "The last chapter talked about fifths and thirds before saying what the names mean. An interval is the distance between two notes, and musicians measure it twice: once by counting letters on the staff, which gives its number (third, fifth…), and once by counting keys, which gives its exact size and decides its quality (major, minor, perfect…). \"Major third\" is both measures in two words. This chapter shows how to read them, why the same keys can make two different intervals, and how to recognise the common ones by ear.")}
      </Lead>

      <Goals t={t} id="musInt" items={[
        "Find the number of any interval by counting letters, n = d₂ − d₁ + 1, and explain why a fifth spans only four steps.",
        "Explain why two thirds can differ in size, and find the size of a white-key interval with s = 2(n − 1) − h.",
        "Name any interval in full (perfect, major, minor, augmented, diminished) from its number and its size.",
        "Tell apart intervals that sound the same but are spelled differently, like C–D♯ and C–E♭, or the two half steps.",
        "Invert an interval (n + n' = 9, s + s' = 12) and name intervals larger than an octave.",
        "Sort the intervals into consonances and dissonances, and recognise the common ones by ear with a tune you know.",
      ]} />

      <H2>{tx(t, "musInt_twoTitle", "Two ways to measure a distance")}</H2>
      <p>
        {tx(t, "musInt_twoBody",
          "Take C4 and G4. On the staff, G sits four steps above C: line, space, line… On the keyboard, G is seven keys above C. Both numbers matter. The staff count says how the notes are written and which letters they use; the key count says exactly how far apart they sound. An interval's name carries both: the number from the letters, the quality from the keys.")}
      </p>
      <p>
        {tx(t, "musInt_twoKinds",
          "The two notes can sound one after the other, a melodic interval, as in a tune, or at the same time, a harmonic interval, as in a chord. The name is the same either way. In a melody, a move to the next letter is a step and anything larger is a leap; most tunes are mostly steps, with a few leaps for colour.")}
      </p>

      <H2>{tx(t, "musInt_numTitle", "The number: count the letters")}</H2>
      <p>
        {tx(t, "musInt_numBody",
          "To find the number, count the letters from the lower note to the upper one, counting both of them. From C to G: C, D, E, F, G, five letters, so C–G is a fifth. From C to E: C, D, E, a third. Two notes on the same line or space are a unison (one letter), the next letter is a second, and eight letters, C up to the next C, an octave, from the Latin for eight.")}
      </p>
      <Derivation t={t} label={tx(t, "musInt_dNum", "The number from the staff positions")}
        steps={[
          { tex: r`d = 7\,o + \ell`, why: tx(t, "musInt_n0", "chapter 10 gave every line and space a number d, one per letter: C4 = 28, D4 = 29… Signs do not change d") },
          { tex: r`d_2 - d_1`, why: tx(t, "musInt_n1", "the difference is how many steps of the staff separate the notes: C4 → G4 is 32 − 28 = 4 steps") },
          { tex: r`n = d_2 - d_1 + 1`, why: tx(t, "musInt_n2", "the name counts letters, not steps, and there is always one more letter than steps: 4 steps join 5 letters, like 4 gaps between 5 fence posts") },
          { tex: r`\text{C4}\!-\!\text{G4}:\ n = 32 - 28 + 1 = \amber{5}`, why: tx(t, "musInt_n3", "a fifth. And C4–C5: 35 − 28 + 1 = 8, the octave") },
        ]} />
      <p>
        {tx(t, "musInt_numWhy",
          "Counting both ends is old: it is how Latin counted. The French still call a week \"huit jours\" (eight days) and two weeks \"quinze jours\", and Portuguese says \"quinze dias\" for two weeks, because they count from one Monday to the next, both included. The price is that intervals do not add like numbers: a third on top of a third is a fifth, not a sixth, because the middle note is counted twice (3 + 3 − 1 = 5).")}
      </p>

      <H2>{tx(t, "musInt_sizeTitle", "Same number, different sizes")}</H2>
      <p>
        {tx(t, "musInt_sizeBody",
          "The number ignores something important. C–E and D–F are both thirds, but C–E spans 4 half steps and D–F only 3. The reason is the two half steps among the white keys, E–F and B–C (chapter 11): every move from one letter to the next is 2 half steps, except those two, which are 1. D–F crosses E–F; C–E does not.")}
      </p>
      <Derivation t={t} label={tx(t, "musInt_dSize", "The size of an interval between white keys")}
        steps={[
          { tex: r`n - 1\ \text{${tx(t, "musInt_sSteps", "letter steps")}}`, why: tx(t, "musInt_s0", "an interval of number n climbs n − 1 times from one letter to the next") },
          { tex: r`2\,(n - 1)`, why: tx(t, "musInt_s1", "if every step were a whole step, the size would be 2 half steps per step") },
          { tex: r`s = 2\,(n - 1) - h`, why: tx(t, "musInt_s2", "but each step that crosses E–F or B–C is only a half step: subtract 1 for each. h is how many of them the interval crosses") },
          { tex: r`\text{C–E}: 2 \times 2 - 0 = 4, \qquad \text{D–F}: 2 \times 2 - 1 = \amber{3}`, why: tx(t, "musInt_s3", "two thirds, two sizes. Likewise C–F (a fourth, crossing E–F) is 6 − 1 = 5, but F–B crosses neither and is 6") },
        ]} />
      <LessonTable
        headers={[tx(t, "musInt_tNum", "Number"), tx(t, "musInt_tBig", "Larger size (count)"), tx(t, "musInt_tSmall", "Smaller size (count)")]}
        rows={[
          [tx(t, "musInt_tSecond", "second"), tx(t, "musInt_t2b", "2 half steps (5: C–D, D–E, F–G, G–A, A–B)"), tx(t, "musInt_t2s", "1 (2: E–F, B–C)")],
          [tx(t, "musInt_tThird", "third"), tx(t, "musInt_t3b", "4 (3: C–E, F–A, G–B)"), tx(t, "musInt_t3s", "3 (4: D–F, E–G, A–C, B–D)")],
          [tx(t, "musInt_tFourth", "fourth"), tx(t, "musInt_t4b", "6 (1: F–B)"), tx(t, "musInt_t4s", "5 (6: all the others)")],
          [tx(t, "musInt_tFifth", "fifth"), tx(t, "musInt_t5b", "7 (6: all but one)"), tx(t, "musInt_t5s", "6 (1: B–F)")],
          [tx(t, "musInt_tSixth", "sixth"), tx(t, "musInt_t6b", "9 (4: C–A, D–B, F–D, G–E)"), tx(t, "musInt_t6s", "8 (3: E–C, A–F, B–G)")],
          [tx(t, "musInt_tSeventh", "seventh"), tx(t, "musInt_t7b", "11 (2: C–B, F–E)"), tx(t, "musInt_t7s", "10 (5: the others)")],
        ]}
      />

      <H2>{tx(t, "musInt_qualTitle", "The quality: perfect, major, minor")}</H2>
      <p>
        {tx(t, "musInt_qualBody",
          "The quality is the word that tells the two sizes apart. Unisons, fourths, fifths and octaves come almost always in one size among the white keys, and that size is called perfect: these are the intervals of the simplest ratios, 1 : 1, 4 : 3, 3 : 2 and 2 : 1, the smoothest of chapter 12. Seconds, thirds, sixths and sevenths come in two common sizes: the larger is major, the smaller minor. One half step more than major or perfect is augmented; one half step less than minor or perfect is diminished.")}
      </p>
      <LessonTable
        headers={[tx(t, "musInt_tName", "Interval"), tx(t, "musInt_tAbbr", "Short"), tx(t, "musInt_tHalf", "Half steps"), tx(t, "musInt_tFromC", "From C"), tx(t, "musInt_tPureR", "Pure ratio")]}
        rows={[
          [tx(t, "musInt_rP1", "perfect unison"), abbr("P", 1, t), "0", "C–C", "1 : 1"],
          [tx(t, "musInt_rm2", "minor second"), abbr("m", 2, t), "1", "C–D♭", "16 : 15"],
          [tx(t, "musInt_rM2", "major second"), abbr("M", 2, t), "2", "C–D", "9 : 8"],
          [tx(t, "musInt_rm3", "minor third"), abbr("m", 3, t), "3", "C–E♭", "6 : 5"],
          [tx(t, "musInt_rM3", "major third"), abbr("M", 3, t), "4", "C–E", "5 : 4"],
          [tx(t, "musInt_rP4", "perfect fourth"), abbr("P", 4, t), "5", "C–F", "4 : 3"],
          [tx(t, "musInt_rA4", "augmented fourth / diminished fifth"), `${abbr("A", 4, t)} / ${abbr("d", 5, t)}`, "6", "C–F♯ / C–G♭", "45 : 32"],
          [tx(t, "musInt_rP5", "perfect fifth"), abbr("P", 5, t), "7", "C–G", "3 : 2"],
          [tx(t, "musInt_rm6", "minor sixth"), abbr("m", 6, t), "8", "C–A♭", "8 : 5"],
          [tx(t, "musInt_rM6", "major sixth"), abbr("M", 6, t), "9", "C–A", "5 : 3"],
          [tx(t, "musInt_rm7", "minor seventh"), abbr("m", 7, t), "10", "C–B♭", "16 : 9"],
          [tx(t, "musInt_rM7", "major seventh"), abbr("M", 7, t), "11", "C–B", "15 : 8"],
          [tx(t, "musInt_rP8", "perfect octave"), abbr("P", 8, t), "12", "C–C", "2 : 1"],
        ]}
      />
      <p>
        {tx(t, "musInt_qualRef",
          "Notice the column \"from C\": every interval from C up to a white key is perfect or major. That gives a simple reference to measure any interval against.")}
      </p>
      <Equation label={tx(t, "musInt_eqQual", "The quality of an interval")}
        where={[
          [r`n`, tx(t, "musInt_wn", "the number, from the letters: n = d₂ − d₁ + 1")],
          [r`s`, tx(t, "musInt_ws", "the size in half steps, from the keys: s = m₂ − m₁ (chapter 11 gives m for any written note)")],
          [r`s_{\text{ref}}(n)`, tx(t, "musInt_wref", "the size of the same number from C to a white key: 0 2 4 5 7 9 11 for numbers 1 to 7, plus 12 per octave")],
          [r`\Delta`, tx(t, "musInt_wd", "how far the interval is from that reference, in half steps")],
        ]}
        words={tx(t, "musInt_eqQualWords", "Compare the interval with the same number counted from C on white keys. Perfect numbers (1, 4, 5, 8): equal is perfect, one more augmented, one less diminished. The others: equal is major, one less minor, two less diminished, one more augmented.")}>
        {r`\Delta = s - s_{\text{ref}}(n): \quad \begin{array}{c|ccccc} & -2 & -1 & 0 & +1 \\ \hline 1,4,5,8 & \text{dd} & \text{d} & \text{${tx(t, "figMus_ivAP", "P")}} & \text{A} \\ 2,3,6,7 & \text{d} & \text{m} & \text{M} & \text{A} \end{array}`}
      </Equation>
      <LiveFormula label={tx(t, "musInt_liveName", "Try it: name an interval from its two numbers")}
        tex={r`s_{\text{ref}}(n) = 12k + \text{ref}(n_s), \quad n = 7k + n_s, \qquad \Delta = s - s_{\text{ref}}`}
        vars={[
          { id: "n", label: tx(t, "musInt_liveN", "number n (letters)"), min: 1, max: 15, step: 1, value: 3, fmt: v => String(v) },
          { id: "s", label: tx(t, "musInt_liveS", "size s (half steps)"), min: 0, max: 26, step: 1, value: 3, fmt: v => String(v) },
        ]}
        compute={nameNumbers(t)}
        where={[
          [r`k`, tx(t, "musInt_wk", "whole octaves inside the interval (0 up to an octave… 1 from the ninth)")],
          [r`n_s`, tx(t, "musInt_wns", "the simple number, 1 to 7, left after taking the octaves out")],
        ]}
        note={tx(t, "musInt_liveNameNote", "Start at a minor third (n = 3, s = 3). Raise s to 4: major. To 5: augmented, the same keys as a perfect fourth. Set n = 5: s = 7 is perfect, 6 diminished. Push n past 8 to name the compound intervals: n = 10 with s = 16 is a major tenth, an octave plus a major third.")} />

      <MusicIntervalFigure t={t} />

      <H3>{tx(t, "musInt_enhTitle", "Same keys, different intervals")}</H3>
      <p>
        {tx(t, "musInt_enhBody",
          "Because the number comes from the letters, two intervals can use exactly the same keys and still have different names. C–E♭ is a minor third (C, D, E: three letters, 3 half steps). C–D♯ is an augmented second (C, D: two letters, 3 half steps). On the piano they are the same two keys. In music they do different jobs: E♭ usually moves down, D♯ usually moves up, and which one the composer writes tells the player where the music is going. The same goes for the interval of 6 half steps, half an octave, the tritone: F–B is an augmented fourth (four letters), B–F a diminished fifth (five letters).")}
      </p>
      <p>
        {tx(t, "musInt_twoHalf",
          "This also names the two half steps of chapter 11. C–C♯ keeps the letter: one letter, an augmented unison, the chromatic half step. C–D♭ changes the letter: a minor second, the diatonic half step. In equal temperament both are 100 cents. In pure tuning they are not: the minor second is 16 : 15 ≈ 111.7 cents and the chromatic half step 25 : 24 ≈ 70.7 cents, which is why singers and string players, who tune by ear, can tell them apart.")}
      </p>

      <H2>{tx(t, "musInt_invTitle", "Inversion: turning an interval upside down")}</H2>
      <p>
        {tx(t, "musInt_invBody",
          "Move the lower note up an octave, and the interval is inverted: C–E (a third) becomes E–C (a sixth). Together the two fill exactly one octave, which gives simple rules for the number, the size and the quality.")}
      </p>
      <Derivation t={t} label={tx(t, "musInt_dInv", "The rules of inversion")}
        steps={[
          { tex: r`n + n' - 1 = 8`, why: tx(t, "musInt_i0", "the interval and its inversion stack up to an octave (8 letters), and stacking counts the shared middle note twice, so subtract 1") },
          { tex: r`n + n' = 9`, why: tx(t, "musInt_i1", "so a third inverts to a sixth, a second to a seventh, a fourth to a fifth, a unison to an octave") },
          { tex: r`s + s' = 12`, why: tx(t, "musInt_i2", "sizes simply add, since half steps are not counted at both ends: the two sizes fill the 12 half steps of the octave") },
          { tex: r`s_{\text{ref}}(n) + s_{\text{ref}}(n') = 12 \ \text{(P)}, \quad 13 \ \text{(M)}`, why: tx(t, "musInt_i3", "the references: 5 + 7 = 12 for a fourth and a fifth, but 4 + 9 = 13 for a major third and a major sixth (a major interval and its inversion overfill the octave by one)") },
          { tex: r`\Delta' = -\Delta \ \text{(P)}, \qquad \Delta' = -1 - \Delta \ \text{(M, m)}`, why: tx(t, "musInt_i4", "subtracting: for perfect numbers, perfect stays perfect and augmented becomes diminished; for the others, Δ = 0 (major) becomes −1 (minor) and back, and augmented (+1) becomes diminished (−2)") },
        ]} />
      <LessonTable
        headers={[tx(t, "musInt_tInterval", "Interval"), tx(t, "musInt_tInverted", "Inverted"), tx(t, "musInt_tCheck", "Check")]}
        rows={[
          [tx(t, "musInt_v0", "major third C–E (4)"), tx(t, "musInt_v0i", "minor sixth E–C (8)"), "3 + 6 = 9, 4 + 8 = 12"],
          [tx(t, "musInt_v1", "perfect fifth C–G (7)"), tx(t, "musInt_v1i", "perfect fourth G–C (5)"), "5 + 4 = 9, 7 + 5 = 12"],
          [tx(t, "musInt_v2", "minor second B–C (1)"), tx(t, "musInt_v2i", "major seventh C–B (11)"), "2 + 7 = 9, 1 + 11 = 12"],
          [tx(t, "musInt_v3", "augmented fourth F–B (6)"), tx(t, "musInt_v3i", "diminished fifth B–F (6)"), "4 + 5 = 9, 6 + 6 = 12"],
        ]}
      />
      <p>
        {tx(t, "musInt_invUse",
          "Inversion is a shortcut for reading big intervals: a sixth is hard to judge at a glance, but its inversion, a third, is easy. C–A? Invert it: A–C is a minor third, so C–A is a major sixth. The tritone is the only interval that inverts to its own size, 6 + 6 = 12: it cuts the octave exactly in half.")}
      </p>

      <H2>{tx(t, "musInt_compTitle", "Beyond the octave: compound intervals")}</H2>
      <p>
        {tx(t, "musInt_compBody",
          "Intervals wider than an octave are compound: a simple interval plus one or more octaves. C4–D5 is a ninth, C4–E5 a tenth. They keep the quality of their simple form, and they are named the same way, with one more correction for the shared note:")}
      </p>
      <Derivation t={t} label={tx(t, "musInt_dComp", "Splitting off the octaves")}
        steps={[
          { tex: r`n = 7k + n_s, \quad 1 \le n_s \le 7`, why: tx(t, "musInt_c0", "each octave adds 7 letters, not 8, because the octave's top note is the next interval's bottom note: a ninth is an octave (8) plus a second (2) minus the shared note, 8 + 2 − 1 = 9 = 7 + 2") },
          { tex: r`s = 12k + s_s`, why: tx(t, "musInt_c1", "each octave adds 12 half steps") },
          { tex: r`\text{C4–E5}:\ n = 37 - 28 + 1 = 10 = 7 + 3, \quad s = 76 - 60 = 16 = 12 + 4`, why: tx(t, "musInt_c2", "a tenth whose simple form is a third of 4 half steps: a major tenth") },
        ]} />
      <p>
        {tx(t, "musInt_compUse",
          "In practice only the ninth, eleventh and thirteenth keep their compound names, because they appear in chord names (chapter 18). For everything else, musicians just say \"a third, an octave up\".")}
      </p>

      <H2>{tx(t, "musInt_hearTitle", "How the intervals sound")}</H2>
      <p>
        {tx(t, "musInt_hearBody",
          "Chapter 12 explained why some intervals sound still and others restless: the simpler the ratio, the more harmonics the two notes share. Music theory sorts the intervals into three families. The perfect consonances, unison, octave, fifth and fourth, are so smooth they sound almost empty. The imperfect consonances, thirds and sixths, are sweet and full. The dissonances, seconds, sevenths and the tritone, sound tense and seem to want to move to a consonance; music lives on that pull. The fourth sits on the border: smooth on its own, but older rules of counterpoint treated it as a dissonance when it stood above the lowest voice.")}
      </p>
      <p>
        {tx(t, "musInt_tritone",
          "The tritone has the strongest reputation. Medieval singers avoided F–B (chapter 11), and a later Latin saying called it \"diabolus in musica\", the devil in music. Yet it is everywhere in modern music: it is the tension inside the dominant seventh chord that makes a cadence pull home (chapter 20), and Bernstein opened \"Maria\" with it.")}
      </p>

      <MusicIntervalLadderFigure t={t} />

      <p>
        {tx(t, "musInt_songs",
          "Ear training starts with these anchor tunes. Hear an interval, sing it, and ask which tune it starts. With time the tunes fall away and the intervals are recognised directly, by their colour: the open fifth, the bright major third, the darker minor third, the yearning major seventh.")}
      </p>

      <ForInstrument only="guitar">
        <H3>{tx(t, "musInt_gtTitle", "Intervals as shapes on the neck")}</H3>
        <p>
          {tx(t, "musInt_gtBody",
            "On the guitar an interval is a shape, and the same shape gives the same interval anywhere on the neck, which is why guitarists often learn intervals by eye. Neighbouring strings are a perfect fourth apart (5 frets), except G and B, a major third (4 frets). So from any note: the same fret on the next string is a perfect fourth; two frets higher on the next string, a perfect fifth (the root and fifth of a power chord); two frets higher two strings up, the octave. One fret back on the next string is a major third, two frets back a minor third. Every shape that crosses from the G string to the B string needs one fret more to the right, because that pair is one fret closer.")}
        </p>
      </ForInstrument>
      <ForInstrument only="piano">
        <H3>{tx(t, "musInt_pnTitle", "Intervals as hand shapes")}</H3>
        <p>
          {tx(t, "musInt_pnBody",
            "On the white keys the number is easy to see as a pattern of fingers: a third is play one, skip one, play one; a fifth spans five white keys, thumb to little finger in a relaxed hand; an octave is the widest common stretch. The quality is then a matter of the black keys and the two half steps: a white-key third that contains E–F or B–C is minor, and moving either note onto a black key changes the size without changing the number.")}
        </p>
      </ForInstrument>

      <H2>{tx(t, "musInt_practTitle", "Practice")}</H2>
      <p>
        {tx(t, "musInt_practBody",
          "Reading intervals is the same two moves every time: count the letters for the number, then check the size for the quality. Start with the numbers alone, then full names on white keys, then with sharps and flats. The hearing rounds start with the three easiest to tell apart, the major third, the fifth and the octave, and grow to all twelve.")}
      </p>

      <MusicIntervalQuizFigure t={t} />

      <p>
        {tx(t, "musInt_next",
          "Chapter 8 ended with a West African bell pattern of 7 strokes in 12 pulses, gaps 2 2 1 2 2 2 1, and chapter 9 found the same gaps between the white keys from C. Read with this chapter's eyes, those gaps are major and minor seconds. The next chapter puts them in order and builds the major scale: why every major scale is the same pattern of whole and half steps, why each one uses every letter once, and how the sharps and flats of a key come from that rule.")}
      </p>

      <KeyIdeas t={t} id="musInt" items={[
        "An interval has a number, from the letters counted with both ends (n = d₂ − d₁ + 1, so C–G is a fifth), and a size, in half steps (s = m₂ − m₁).",
        "The same number comes in different sizes because of the half steps E–F and B–C: between white keys, s = 2(n − 1) − h.",
        "Unisons, fourths, fifths and octaves are perfect; seconds, thirds, sixths and sevenths major or minor; one half step more is augmented, less diminished: Δ = s − s_ref(n).",
        "The same keys can make different intervals: C–D♯ (augmented second) and C–E♭ (minor third); the chromatic half step is an augmented unison, the diatonic one a minor second.",
        "Inverting an interval gives n + n' = 9 and s + s' = 12; major ↔ minor, augmented ↔ diminished, perfect stays perfect. Compound intervals add 7 letters and 12 half steps per octave.",
        "Perfect consonances (P1 P8 P5 P4), imperfect consonances (thirds, sixths) and dissonances (seconds, sevenths, the tritone): a tune you know is the easiest way to learn each one by ear.",
      ]} />
    </Article>
  );
}
