"use client";

// Notes: sharps, flats and naturals. Half and whole steps; the three signs and
// where they came from (the round and square b); the key a written note asks
// for, m = 12(o + 1) + P(ℓ) + a; the black keys' two names; enharmonic
// spellings (35 names for 12 keys, G♯/A♭ the only key with two); whether
// G♯ and A♭ really sound the same (the Pythagorean comma); how long a sign
// lasts (to the bar line), ties, courtesy signs and key signatures.

import { H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { MusicAccidentalFigure } from "@/components/lesson/figures/music/AccidentalFigure";
import { MusicEnharmonicFigure } from "@/components/lesson/figures/music/EnharmonicFigure";
import { MusicBarRuleFigure } from "@/components/lesson/figures/music/BarRuleFigure";
import { MusicAccidentalQuizFigure } from "@/components/lesson/figures/music/AccidentalQuizFigure";
import { MusicScoreEditorFigure } from "@/components/lesson/figures/music/score/ScoreEditorFigure";
import { accNumbers } from "../live/accidentals";

const r = String.raw;
const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];

export function AccidentalsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "musAcc_intro",
          "The staff of the last chapter has a line or a space for every white key, and nothing for the five black keys of each octave. Rather than squeeze in more lines, musicians added three small signs: the sharp ♯ raises a note by one key, the flat ♭ lowers it by one key, and the natural ♮ cancels both. With them, every key of the piano can be written, and some can be written in two or three different ways.")}
      </Lead>

      <Goals t={t} id="musAcc" items={[
        "Tell a half step from a whole step on the keyboard, and find the two half steps among the white keys.",
        "Say what the sharp, the flat and the natural do, and find the key any written note asks for, also with m = 12(o + 1) + P(ℓ) + a.",
        "Name every black key two ways, and find the other names of any key (E♯ = F, C♭ = B, and the double signs).",
        "Explain why G♯ and A♭ are one key on the piano but were not the same note in older tunings.",
        "Apply the rule of the bar line: a sign lasts for its line or space until the end of the bar.",
        "Write a short melody of your own on the staff, with durations, rests, ties and signs, and check that every bar adds up.",
      ]} />

      <H2>{tx(t, "musAcc_stepsTitle", "Half steps and whole steps")}</H2>
      <p>
        {tx(t, "musAcc_stepsBody",
          "Two keys side by side, with nothing between them, are a half step apart, also called a semitone: the smallest step of the piano, the frequency ratio 2^(1/12) ≈ 1.06 of chapter 2. Two half steps make a whole step, or tone. Chapter 9 found the pattern of the white keys from C: whole, whole, half, whole, whole, whole, half. So most white keys are a whole step apart, with a black key between them, and two pairs are only a half step apart, with no black key: E–F and B–C.")}
      </p>
      <p>
        {tx(t, "musAcc_stepsMeaning",
          "That is why the black keys exist at all. Every whole step between two white keys leaves one key in the middle, and there are five whole steps per octave, so five black keys. A half step leaves nothing in between. The staff only counts letters, so it treats E–F the same as F–G (one step each) even though one is half the size of the other. The signs are how written music reaches the keys in between.")}
      </p>

      <H2>{tx(t, "musAcc_signsTitle", "Three signs: sharp, flat, natural")}</H2>
      <LessonTable
        headers={[tx(t, "musAcc_tSign", "Sign"), tx(t, "musAcc_tName", "Name"), tx(t, "musAcc_tDoes", "What it does"), tx(t, "musAcc_tEx", "Example")]}
        rows={[
          ["♯", tx(t, "musAcc_tSharp", "sharp"), tx(t, "musAcc_tSharpD", "raises the note one half step: the next key to the right"), tx(t, "musAcc_tSharpE", "F♯ is the black key just right of F")],
          ["♭", tx(t, "musAcc_tFlat", "flat"), tx(t, "musAcc_tFlatD", "lowers the note one half step: the next key to the left"), tx(t, "musAcc_tFlatE", "B♭ is the black key just left of B")],
          ["♮", tx(t, "musAcc_tNatural", "natural"), tx(t, "musAcc_tNaturalD", "cancels a sharp or a flat: back to the white key"), tx(t, "musAcc_tNaturalE", "B♮ after a B♭ is plain B again")],
          [tx(t, "musAcc_tDoubleS", "small x"), tx(t, "musAcc_tDsharp", "double sharp"), tx(t, "musAcc_tDsharpD", "raises two half steps"), tx(t, "musAcc_tDsharpE", "F double sharp is the key of G")],
          ["♭♭", tx(t, "musAcc_tDflat", "double flat"), tx(t, "musAcc_tDflatD", "lowers two half steps"), tx(t, "musAcc_tDflatE", "B double flat is the key of A")],
        ]}
      />
      <p>
        {tx(t, "musAcc_signsOrder",
          "Signs are written and said in opposite orders. On the staff the sign comes first, just left of the note head and on the same line or space, so the eye meets it before the note. In words it comes after: we write ♯ then the note, but say \"F sharp\". A sharp does not always land on a black key: it means \"the next key to the right\", whatever colour that is. E♯ is the key of F, and C♭ the key of B.")}
      </p>

      <H3>{tx(t, "musAcc_histTitle", "Where the signs came from: two kinds of b")}</H3>
      <p>
        {tx(t, "musAcc_histBody",
          "The first note to get a sign was B. In medieval chant, the step from F up to B spans three whole steps, the tritone, an interval singers found harsh and avoided. So they often sang B a half step lower, and scribes marked the lower B with a round letter b, called \"b molle\" (soft b), and the normal B with a square b, \"b durum\" (hard b). The round b became the flat ♭. The square b became the natural ♮, and a crossed version of it, used to raise other notes, became the sharp ♯. The words stayed too: French bémol and bécarre, Italian bemolle and bequadro. In German, the square b looked like an h, which is why German calls B♭ \"B\" and B natural \"H\", as chapter 9 promised to explain; and the German words for major and minor, Dur and Moll, are the hard and soft b.")}
      </p>

      <H2>{tx(t, "musAcc_keyTitle", "Which key does a written note ask for?")}</H2>
      <p>
        {tx(t, "musAcc_keyBody",
          "Chapter 9 turned a key number into a name; chapter 10 turned a position on the staff into a letter and an octave. A sign adds one last step: it moves the white key of that letter left or right. Putting the three together gives the key number of any written note.")}
      </p>
      <Derivation t={t} label={tx(t, "musAcc_dTitle", "From a written note to its key")}
        steps={[
          { tex: r`\ell,\ o \;\leftarrow\; \text{${tx(t, "musAcc_dStaff", "the staff")}}`, why: tx(t, "musAcc_d0", "read the letter ℓ and the octave o from the line or space, as in chapter 10, ignoring the sign") },
          { tex: r`P(\ell) = 0,\ 2,\ 4,\ 5,\ 7,\ 9,\ 11`, why: tx(t, "musAcc_d1", "how many keys the letter's white key sits above C: C 0, D 2, E 4, F 5, G 7, A 9, B 11. The jumps of 2 are whole steps, the jumps of 1 (E→F, B→C) the two half steps") },
          { tex: r`m_{\text{${tx(t, "musAcc_dWhite", "white")}}} = 12\,(o + 1) + P(\ell)`, why: tx(t, "musAcc_d2", "chapter 9 wrote every key as m = 12q + pc with octave o = q − 1, so q = o + 1. For a white key, the pitch class pc is P(ℓ)") },
          { tex: r`m = 12\,(o + 1) + P(\ell) + a`, why: tx(t, "musAcc_d3", "each half step is one key, so the sign adds a keys: a = +1 for a sharp, −1 for a flat, 0 for none or a natural, ±2 for the double signs") },
          { tex: r`\text{F}{\sharp}\text{4}:\ 12 \times 5 + 5 + 1 = \amber{66}, \quad f = 440 \cdot 2^{(66 - 69)/12} \approx 369.99\ \text{Hz}`, why: tx(t, "musAcc_d4", "an example: F is letter 3 with P = 5, octave 4, sharp a = +1. The frequency follows from the key number exactly as in chapter 2") },
          { tex: r`\text{B}{\sharp}\text{3}:\ 12 \times 4 + 11 + 1 = 60 = \text{C4}`, why: tx(t, "musAcc_d5", "a surprise: B♯3 is middle C. The octave number belongs to the letter, and B3 is the last key of octave 3, so raising it steps into octave 4. Likewise C♭4 is the key of B3") },
        ]} />
      <Equation label={tx(t, "musAcc_eqKey", "The key of a written note")}
        where={[
          [r`m`, tx(t, "musAcc_wm", "the key number (MIDI), as in chapters 2 and 9: middle C = 60, A4 = 69")],
          [r`o`, tx(t, "musAcc_wo", "the octave number of the letter, as in C4")],
          [r`P(\ell)`, tx(t, "musAcc_wP", "the white key of letter ℓ, counted in keys above C: 0, 2, 4, 5, 7, 9, 11 for C D E F G A B")],
          [r`a`, tx(t, "musAcc_wa", "the sign: +1 sharp, −1 flat, 0 natural or none, +2 double sharp, −2 double flat")],
        ]}
        words={tx(t, "musAcc_eqWords", "Find the letter's white key in its octave, then move one key right for each sharp and one key left for each flat.")}>
        {r`m = 12\,(o + 1) + P(\ell) + a`}
      </Equation>
      <LiveFormula label={tx(t, "musAcc_liveTitle", "Try it: any letter, any sign")}
        tex={r`m = 12\,(o + 1) + P(\ell) + a`}
        vars={[
          { id: "l", label: tx(t, "musAcc_liveL", "letter (ℓ)"), min: 0, max: 6, step: 1, value: 3, fmt: v => LETTERS[v] },
          { id: "o", label: tx(t, "musAcc_liveO", "octave (o)"), min: 2, max: 6, step: 1, value: 4, fmt: v => String(v) },
          { id: "a", label: tx(t, "musAcc_liveA", "sign (a)"), min: -2, max: 2, step: 1, value: 1, fmt: v => ["♭♭", "♭", tx(t, "musAcc_liveNone", "none"), "♯", "♯♯"][v + 2] },
        ]}
        compute={accNumbers(t)}
        where={[
          [r`m`, tx(t, "musAcc_wm2", "the key the note asks for; the last line lists its other names")],
        ]}
        note={tx(t, "musAcc_liveNote", "Start at F♯4 = 66. Set the letter to G and the sign to ♭: G♭4 is 66 too, the same key. Then try E with a sharp (E♯4 = 65 = F4), B with a sharp (B♯3 = 60, middle C) and the double signs. Watch the last line: every key has two or three names.")} />

      <MusicAccidentalFigure t={t} />

      <H2>{tx(t, "musAcc_blackTitle", "Naming the black keys")}</H2>
      <p>
        {tx(t, "musAcc_blackBody",
          "Each black key sits between two white keys, so it can be named from either side: as its left neighbour raised, or as its right neighbour lowered. Every black key has a sharp name and a flat name.")}
      </p>
      <LessonTable
        headers={[tx(t, "musAcc_tKey", "Key (octave 4)"), tx(t, "musAcc_tAsSharp", "as a sharp"), tx(t, "musAcc_tAsFlat", "as a flat"), tx(t, "musAcc_tSolfa", "in solfège")]}
        rows={[
          ["61", "C♯", "D♭", tx(t, "musAcc_tS1", "do sharp / re flat")],
          ["63", "D♯", "E♭", tx(t, "musAcc_tS3", "re sharp / mi flat")],
          ["66", "F♯", "G♭", tx(t, "musAcc_tS6", "fa sharp / sol flat")],
          ["68", "G♯", "A♭", tx(t, "musAcc_tS8", "sol sharp / la flat")],
          ["70", "A♯", "B♭", tx(t, "musAcc_tS10", "la sharp / si flat")],
        ]}
      />
      <p>
        {tx(t, "musAcc_whichName",
          "Which name is right? Both, and the choice is not free: it depends on what the music is doing. A melody climbing from F to G through the black key usually writes F♯ (raise the note you are leaving); one falling from G to F writes G♭. That is why the chromatic scale, all twelve keys in a row, is usually written with sharps going up and flats coming down. The deeper reason comes with scales (chapter 14): a scale uses each letter once, so the letters, not the keys, decide the spelling.")}
      </p>
      <p>
        {tx(t, "musAcc_twoSemitones",
          "This gives two kinds of half step. C to C♯ keeps the letter: a chromatic half step. C to D♭ changes the letter: a diatonic half step, like E–F and B–C. On the piano they are the same key, same sound. On paper they are different, and that difference will matter when intervals are named in chapter 13.")}
      </p>

      <H2>{tx(t, "musAcc_enhTitle", "One key, many names")}</H2>
      <p>
        {tx(t, "musAcc_enhBody",
          "Two spellings of the same key, like G♯ and A♭, are called enharmonic, from the Greek for \"in tune with\". White keys have them too: E♯ = F, F♭ = E, B♯ = C, C♭ = B. The double signs add even more: F double sharp is G, and B double flat is A. They look like pedantry, but some scales really need them, as later chapters will show. How many names are there, in all?")}
      </p>
      <Derivation t={t} label={tx(t, "musAcc_cTitle", "Counting every name of every key")}
        steps={[
          { tex: r`7 \times 5 = 35`, why: tx(t, "musAcc_c0", "every name is a letter (7 choices) with a sign (5 choices: double flat, flat, none, sharp, double sharp). So there are 35 names for the 12 keys of an octave, almost 3 each") },
          { tex: r`a = p - P(\ell), \quad -2 \le a \le 2`, why: tx(t, "musAcc_c1", "a letter can name key p (counted from C, 0 to 11) only if its white key is at most 2 keys away: the sign must make up the difference") },
          { tex: r`\text{C}:\ \text{B}{\sharp},\ \text{C},\ \text{D}{\flat}{\flat}`, why: tx(t, "musAcc_c2", "a white key has its own letter, the letter below it (1 or 2 keys away) and the letter above it (1 or 2 keys away): 3 names. True for all 7 white keys") },
          { tex: r`\text{C}{\sharp}:\ \text{B}{\sharp}{\sharp},\ \text{C}{\sharp},\ \text{D}{\flat}`, why: tx(t, "musAcc_c3", "a black key has its two neighbours, 1 key away each. A third letter fits only if it is 2 keys away: past a half step, like B below C♯. Four black keys border a half step (C♯, D♯, F♯, A♯) and get 3 names") },
          { tex: r`\text{G}{\sharp} = \text{A}{\flat}:\ \text{F},\ \text{B}\ \text{${tx(t, "musAcc_cFar", "are 3 keys away")}}`, why: tx(t, "musAcc_c4", "the middle black key of the group of three has whole steps on both sides, F–G and A–B, so the next letters are 3 keys off: out of reach. G♯/A♭ is the only key with just 2 names") },
          { tex: r`7 \times 3 + 4 \times 3 + 1 \times 2 = \amber{35}`, why: tx(t, "musAcc_c5", "the count checks out: every one of the 35 names lands on exactly one key") },
        ]} />

      <MusicEnharmonicFigure t={t} />

      <H3>{tx(t, "musAcc_sameTitle", "Do G♯ and A♭ really sound the same?")}</H3>
      <p>
        {tx(t, "musAcc_sameBody",
          "On a modern piano, yes: one key, one string, one frequency. But for most of history they were two different notes. Older tunings built the scale from pure fifths, the ratio 3 : 2 that sounds perfectly smooth (chapter 3). Reach G♯ by going up in fifths from C, and A♭ by going down, and the two do not meet:")}
      </p>
      <Derivation t={t} label={tx(t, "musAcc_pTitle", "G♯ and A♭ built from pure fifths")}
        steps={[
          { tex: r`\text{C} \to \text{G} \to \text{D} \to \text{A} \to \text{E} \to \text{B} \to \text{F}{\sharp} \to \text{C}{\sharp} \to \text{G}{\sharp}`, why: tx(t, "musAcc_p0", "G♯ is 8 fifths above C. Each fifth multiplies the frequency by 3/2") },
          { tex: r`\text{G}{\sharp} = \frac{(3/2)^8}{2^4} = \frac{6561}{4096} \approx 1.6018`, why: tx(t, "musAcc_p1", "(3/2)⁸ ≈ 25.6 lands four octaves too high, so divide by 2⁴ = 16 to bring it back into the octave above C") },
          { tex: r`\text{C} \to \text{F} \to \text{B}{\flat} \to \text{E}{\flat} \to \text{A}{\flat}`, why: tx(t, "musAcc_p2", "A♭ is 4 fifths below C: each step down divides by 3/2") },
          { tex: r`\text{A}{\flat} = \left(\tfrac{2}{3}\right)^4 \cdot 2^3 = \frac{128}{81} \approx 1.5802`, why: tx(t, "musAcc_p3", "(2/3)⁴ ≈ 0.198 is three octaves too low, so multiply by 2³ = 8") },
          { tex: r`\frac{\text{G}{\sharp}}{\text{A}{\flat}} = \frac{(3/2)^{12}}{2^7} = \frac{531441}{524288} \approx 1.0136`, why: tx(t, "musAcc_p4", "their ratio is 12 fifths over 7 octaves: the two routes together climb 12 fifths, which almost, but not quite, equals 7 octaves") },
          { tex: r`1200 \cdot \log_2 1.0136 \approx \amber{23.5\ \text{cents}}`, why: tx(t, "musAcc_p5", "in cents (chapter 2: 100 cents per half step), G♯ comes out about a quarter of a half step higher than A♭. This gap is the Pythagorean comma") },
        ]} />
      <p>
        {tx(t, "musAcc_sameEnd",
          "A quarter of a half step is easy to hear in a slow chord. Singers and string players, who can place a note anywhere, still often lean a G♯ that leads up to A slightly higher. Keyboards, with one key per slot, had to choose, and the choice the modern piano made is the next chapter: split the comma evenly among all twelve keys, so G♯ and A♭ become exactly the same.")}
      </p>

      <H2>{tx(t, "musAcc_ruleTitle", "How long a sign lasts")}</H2>
      <p>
        {tx(t, "musAcc_ruleBody",
          "Writing a sign before every single note would clutter the page, so a sign is written once and then holds: for the rest of the bar, every note on the same line or space keeps it, without repeating it. The bar line (chapter 7) wipes the slate clean: in the next bar the note is plain again unless a sign is written again. Inside the bar, a natural is the way to cancel a sign early.")}
      </p>
      <LessonTable
        headers={[tx(t, "musAcc_tRule", "Rule"), tx(t, "musAcc_tMeans", "What it means")]}
        rows={[
          [tx(t, "musAcc_r0", "until the bar line"), tx(t, "musAcc_r0d", "a sign holds for the rest of its bar, then ends")],
          [tx(t, "musAcc_r1", "one line or space only"), tx(t, "musAcc_r1d", "a sharp on F5 does not raise F4 in the same bar: each octave needs its own sign")],
          [tx(t, "musAcc_r2", "ties carry it"), tx(t, "musAcc_r2d", "a note tied across the bar line (chapter 6) keeps its sign, since it is one sound")],
          [tx(t, "musAcc_r3", "natural cancels"), tx(t, "musAcc_r3d", "a ♮ inside the bar returns the note to its white key until the bar line, or until a new sign")],
          [tx(t, "musAcc_r4", "courtesy signs"), tx(t, "musAcc_r4d", "a reminder that the rules did not need, often in brackets, e.g. a ♮ in the bar after a sharp, so nobody plays the old sign")],
        ]}
      />
      <p>
        {tx(t, "musAcc_ruleFurElise",
          "The first notes of Beethoven's \"Für Elise\" use both rules within a few seconds, which is why its score has two signs that look redundant at first. Try erasing them.")}
      </p>

      <MusicBarRuleFigure t={t} />

      <p>
        {tx(t, "musAcc_keySig",
          "Music that uses the same sharps or flats all the time does not repeat them bar after bar. It writes them once, at the start of every staff, right after the clef: a key signature. Unlike the signs written by a note, these hold everywhere: every bar, every octave, until the piece says otherwise. A single sharp on the F line means every F is F♯. Which sharps and flats go together, and why, is the story of keys and the circle of fifths, near the end of this track.")}
      </p>

      <H2>{tx(t, "musAcc_readTitle", "Reading sharps and flats")}</H2>
      <p>
        {tx(t, "musAcc_readBody",
          "Reading a note with a sign takes two moves, and it helps to keep them apart. First the position, exactly as in chapter 10: the letter and the octave, as if the sign were not there. Then the sign: one key right for a sharp, one key left for a flat, counting every key whatever its colour. With practice the two moves merge into one look, but at first, slow and in order is faster than guessing.")}
      </p>

      <MusicAccidentalQuizFigure t={t} />

      <H2>{tx(t, "musAcc_writeTitle", "Write it yourself")}</H2>
      <p>
        {tx(t, "musAcc_writeBody",
          "Reading is half of notation; the other half is writing. Everything since the Rhythm section now fits on one staff: the values and dots of chapter 6, the bars and time signatures of chapter 7, the lines and clefs of chapter 10 and the signs of this chapter. The editor below checks the two things beginners most often get wrong. First, every bar must add up to its time signature: in 4/4, a half note, a quarter and two eighths make exactly four beats, and a note that would run past the bar line has to be split into two notes joined by a tie. Second, the signs follow the rule of the bar line, so the editor shows which notes sound sharp or flat because of a sign written earlier.")}
      </p>
      <p>
        {tx(t, "musAcc_writeTry",
          "Start from \"Ode to Joy\" and change it: make the last note of bar 4 a whole note and watch the bar line turn red, then let the editor split it. Or clear the staff and write a tune you know by ear, listening to every note as you place it.")}
      </p>

      <MusicScoreEditorFigure t={t} />

      <p>
        {tx(t, "musAcc_next",
          "The piano gets away with one key for G♯ and A♭ only because its twelve half steps were made exactly equal, which pure fifths cannot do. The next chapter is that compromise: why the octave has twelve notes and not ten or nineteen, how close 2^(7/12) comes to 3/2, and what equal temperament gave up, cent by cent.")}
      </p>

      <KeyIdeas t={t} id="musAcc" items={[
        "Neighbouring keys are a half step (semitone) apart, two half steps make a whole step; among the white keys, only E–F and B–C are half steps.",
        "The sharp raises a note one key, the flat lowers it one key, the natural cancels both; written before the note, said after it. They grew from the round and square b of medieval B.",
        "A written note asks for key m = 12(o + 1) + P(ℓ) + a, with P = 0 2 4 5 7 9 11 and a the sign; the octave follows the letter, so B♯3 is middle C.",
        "Every black key has a sharp name and a flat name; with E♯, C♭ and the double signs, 35 names cover the 12 keys, three per key except G♯/A♭, which has two.",
        "Built from pure fifths, G♯ is about 23.5 cents higher than A♭ (the Pythagorean comma); the piano makes them equal, which is the next chapter.",
        "A sign holds for its line or space until the bar line; a natural cancels it early, ties carry it over, and a key signature holds for the whole piece.",
      ]} />
    </Article>
  );
}

