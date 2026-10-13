"use client";

// Notes: the names of the notes and the keyboard. Seven letters and seven
// solfège syllables for the white keys, repeating every octave; finding them
// by the groups of 2 and 3 black keys; why 7 white and 5 black (whole and
// half steps: a + b = 7, 2a + b = 12, and the most even 7 of 12); octave
// numbers and pitch classes (o = ⌊m/12⌋ − 1, pc = m mod 12); the 88 keys.

import { H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { MusicKeyNamesFigure } from "@/components/lesson/figures/music/KeyNamesFigure";
import { MusicSevenOfTwelveFigure } from "@/components/lesson/figures/music/SevenOfTwelveFigure";
import { MusicNoteQuizFigure } from "@/components/lesson/figures/music/NoteQuizFigure";
import { InstrumentPicker } from "@/components/lesson/figures/music/InstrumentPicker";
import { ForInstrument } from "@/components/lesson/kit/audio/useInstrument";
import { keyNumbers } from "../live/note-names";

const r = String.raw;

export function NoteNamesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "musNam_intro",
          "Chapter 2 numbered every piano key: middle C is 60, the tuning A is 69, one step per key. Numbers are perfect for computers, but musicians talk in names: \"play a C\", \"the song is in G\", \"dó ré mi\". This chapter teaches those names, how to find any of them on a keyboard in a second, and why the keyboard looks the way it does, with its seven white keys and five black ones repeating all the way up.")}
      </Lead>

      <Goals t={t} id="musNam" items={[
        "Name the white keys with letters (C D E F G A B) and with solfège (do re mi fa sol la si).",
        "Find any white key on a keyboard from the groups of two and three black keys.",
        "Explain why an octave has 7 white keys and 5 black ones, from whole and half steps.",
        "Turn a key number into a name with its octave (C4, A4), and back.",
        "Count the 88 keys of a piano: how many white, how many black.",
      ]} />

      <InstrumentPicker t={t} />

      <H2>{tx(t, "musNam_sevenTitle", "Seven names, over and over")}</H2>
      <p>
        {tx(t, "musNam_sevenBody",
          "The white keys of a piano carry seven names, given in order going up: C, D, E, F, G, A, B. After B comes C again, and the seven names repeat, octave after octave. That is no accident: chapter 2 showed that a note and the one an octave above (twice the frequency) sound so alike that the ear hears them as \"the same note, higher\". Musicians call this octave equivalence, and it is why one name can serve a whole family of keys. Every C on the piano is a C, from the lowest to the highest.")}
      </p>
      <p>
        {tx(t, "musNam_sevenWhyC",
          "Why does the list start on C and not on A? The letters were given in the Middle Ages to a scale that started on A. Centuries later the scale that starts on C, the major scale, became the reference for everything, and C took the first place, but the letters kept their old order. So the alphabet runs A B C D E F G, and music runs C D E F G A B.")}
      </p>

      <H3>{tx(t, "musNam_solfaTitle", "Do re mi: names you can sing")}</H3>
      <p>
        {tx(t, "musNam_solfaBody",
          "Around the year 1025, the Italian monk Guido of Arezzo needed a way to teach singers new melodies quickly. He used a hymn to St John, \"Ut queant laxis\", whose lines each start one note higher than the one before, and named the notes after the first syllable of each line: ut, re, mi, fa, sol, la. A seventh syllable, si, came later from the initials of the hymn's last line, \"Sancte Iohannes\". In the 17th century Italians swapped ut for do, easier to sing. English speakers often sing ti instead of si, a 19th-century change so that no two syllables start with the same letter.")}
      </p>
      <p>
        {tx(t, "musNam_solfaFixed",
          "In Brazil, Portugal, France, Spain, Italy and much of Latin America, do is always C: these syllables are simply the names of the notes (\"fixed do\"). In English-speaking countries the letters are the names, and do re mi is mostly used to sing the steps of a scale from whatever note it starts on (\"movable do\"). The two systems meet in chord symbols: a Brazilian guitarist reads C, Am and G7 in letters too.")}
      </p>
      <LessonTable
        headers={[tx(t, "musNam_tSys", "System"), "", "", "", "", "", "", ""]}
        rows={[
          [tx(t, "musNam_tLetters", "letters (English)"), "C", "D", "E", "F", "G", "A", "B"],
          [tx(t, "musNam_tSolfa", "solfège (Portuguese, Italian, French…)"), tx(t, "musNam_do", "do"), tx(t, "musNam_re", "re"), tx(t, "musNam_mi", "mi"), tx(t, "musNam_fa", "fa"), "sol", tx(t, "musNam_la", "la"), "si"],
          [tx(t, "musNam_tGerman", "German"), "C", "D", "E", "F", "G", "A", "H"],
        ]}
      />
      <p>
        {tx(t, "musNam_german",
          "The German H is a leftover from medieval notation, where the letter B was written two ways, round for one version of the note and square for a slightly higher one; the square b looked like an h. In Germany B still means the lower one, B flat (chapter 11). That is how Johann Sebastian Bach could spell his own name in notes, B-A-C-H, and composers have quoted that four-note motif ever since.")}
      </p>

      <H2>{tx(t, "musNam_findTitle", "Finding the notes on the keyboard")}</H2>
      <p>
        {tx(t, "musNam_findBody",
          "Look at the black keys, not the white ones. They come in groups: two, a gap, three, a gap, two, three, all the way up. Those groups are the map. The white key just left of each group of two is a C (do); the white key just left of each group of three is an F (fa). From those two landmarks you can name any white key by counting: C D E across the group of two, F G A B across the group of three. Notice also where there is no black key: between E and F, and between B and C. Those two pairs of white keys sit right next to each other, and the next section shows why.")}
      </p>

      <ForInstrument only="guitar">
        <H3>{tx(t, "musNam_gtTitle", "On the guitar neck")}</H3>
        <p>
          {tx(t, "musNam_gtOpen",
            "A guitar has six strings. Played open, with no fret pressed, they give from the thickest to the thinnest: E2, A2, D3, G3, B3, E4. Learn these six names first. They are your landmarks, the way C and F are on the keyboard. A sentence helps to remember them: \"Eddie Ate Dynamite, Good Bye Eddie\".")}
        </p>
        <p>
          {tx(t, "musNam_gtFrets",
            "Pressing a string just behind a fret shortens the part that vibrates, and each fret raises the note by one half step: fret 1 is one half step up, fret 2 a whole step, fret 12 a whole octave (the string is exactly halved there, chapter 2's ratio 2:1). So one string is a keyboard laid out in a line, with no black or white: every fret is simply the next key. The natural notes follow the same pattern as on the piano: two frets apart, except E–F and B–C, which are only one fret apart. Along the A string: A open, B at fret 2, C at 3, D at 5, E at 7, F at 8, G at 10, and A again at 12.")}
        </p>
        <p>
          {tx(t, "musNam_gtSame",
            "Unlike on the piano, the same note lives in several places. Fret 5 of the low E string is A2, the same note as the open A string. Fret 5 of the A string gives the open D, and fret 5 of the D string the open G. Then the pattern breaks once: fret 4 of the G string gives the open B. After that, fret 5 of the B string gives the high E again. The reason is the tuning itself. Neighbouring strings are 5 half steps apart, except G and B, which are 4 apart. Guitarists use exactly this to tune by ear. In the widget below, the note you play is filled and every other place where it lives gets a ring.")}
        </p>
      </ForInstrument>

      <MusicKeyNamesFigure t={t} />

      <H2>{tx(t, "musNam_whyTitle", "Why 7 white keys and 5 black ones")}</H2>
      <p>
        {tx(t, "musNam_whyBody",
          "Chapter 2 split the octave into 12 equal steps, one per key, each a factor of 2^(1/12). Musicians call the step from a key to the very next one, white or black, a half step (or semitone), and two half steps a whole step (or tone). Going up the white keys, some steps are whole (C to D skips the black key between them) and some are half (E to F, B to C: nothing between). How many of each? The keyboard answers it with two facts.")}
      </p>
      <Derivation t={t} label={tx(t, "musNam_dTitle", "How many whole and half steps, and how many black keys")}
        steps={[
          { tex: r`a + b = 7`, why: tx(t, "musNam_d0", "going up the 7 white keys from C to the next C takes 7 steps; call a the number of whole steps and b the number of half steps") },
          { tex: r`2a + b = 12`, why: tx(t, "musNam_d1", "measured in half steps (keys), the 7 steps add up to one octave, 12 half steps. A whole step counts 2, a half step 1") },
          { tex: r`(2a + b) - (a + b) = 12 - 7`, why: tx(t, "musNam_d2", "subtract the first equation from the second: b cancels") },
          { tex: r`\amber{a = 5}, \quad b = 7 - 5 = \amber{2}`, why: tx(t, "musNam_d3", "five whole steps and two half steps: C–D, D–E, F–G, G–A, A–B are whole; E–F and B–C are half") },
          { tex: r`\text{${tx(t, "musNam_dBlacks", "black keys")}} = a = \green{5}`, why: tx(t, "musNam_d4", "every whole step skips exactly one key, and that skipped key is black; half steps skip none. So there are as many black keys as whole steps: 5, and 7 + 5 = 12") },
        ]} />
      <Equation label={tx(t, "musNam_eqSteps", "The white keys in steps")}
        where={[
          [r`2`, tx(t, "musNam_w2", "a whole step: two keys up, with a black key skipped in between")],
          [r`1`, tx(t, "musNam_w1", "a half step: the very next key (E to F, B to C)")],
          [r`12`, tx(t, "musNam_w12", "the steps add up to one octave of 12 half steps")],
        ]}
        words={tx(t, "musNam_eqStepsWords", "From C: whole, whole, half, whole, whole, whole, half, and you are on C again.")}>
        {r`\underset{C\to D}{2} + \underset{D\to E}{2} + \underset{E\to F}{1} + \underset{F\to G}{2} + \underset{G\to A}{2} + \underset{A\to B}{2} + \underset{B\to C}{1} = 12`}
      </Equation>
      <p>
        {tx(t, "musNam_whyEven",
          "But why that order, 2 2 1 2 2 2 1, and not, say, 2 2 2 2 2 1 1? The last chapter already met this pattern: spread 7 notes over 12 pulses as evenly as you can and you get exactly these gaps, the West African bell. The white keys are the most even way to choose 7 of the 12 notes; the two half steps are as far apart as they can be (one after 2 whole steps, the other after 3). Music theorists John Clough and Jack Douthett made this precise in 1991 and called such sets maximally even. The 5 black keys, the notes left over, are maximally even too: 5 spread over 12 (gaps 2 3 2 2 3, with the 3s round the white-key half steps). Both sets will return as scales: the white keys are the major scale, the black keys the pentatonic.")}
      </p>
      <p>
        {tx(t, "musNam_whyHistory",
          "Keyboards did not start with all twelve. Early medieval organs had only the \"natural\" notes, the white keys. The first extra key was B flat, between A and B, because singers already used it to avoid a harsh interval; the others were added one by one, and by the 15th century the 7 + 5 layout of today was settled. Putting the extra keys in a raised back row, in groups of 2 and 3, is what makes the keyboard so easy to read.")}
      </p>

      <MusicSevenOfTwelveFigure t={t} />

      <H2>{tx(t, "musNam_octTitle", "Octave numbers: which C?")}</H2>
      <p>
        {tx(t, "musNam_octBody",
          "A piano has eight Cs, so \"C\" alone is not enough to point at a key. The usual answer is scientific pitch notation: write the octave number after the letter. The lowest C on the piano is C1, the next C2, and so on up to C8; middle C, the one near the middle of the keyboard (and of the treble and bass staves of the next chapter), is C4. The tuning A just above it is A4, the 440 Hz of chapter 2. The number changes at every C, not at A, so the B just below middle C is B3, and C4 is the next key. The key number of chapter 2, m, gives both parts of the name with one division.")}
      </p>
      <Derivation t={t} label={tx(t, "musNam_doTitle", "From key number to name with octave")}
        steps={[
          { tex: r`m = 12 \cdot \text{${tx(t, "musNam_doQuot", "quotient")}} + \text{${tx(t, "musNam_doRem", "remainder")}}`, why: tx(t, "musNam_do0", "divide the key number by 12, the keys in an octave. Every C is a multiple of 12 (middle C = 60 = 12 × 5), so the remainder says how many keys above a C the key is") },
          { tex: r`pc = m \bmod 12`, why: tx(t, "musNam_do1", "the remainder 0 to 11 is the pitch class, the name without the octave: 0 = C, 2 = D, 4 = E, 5 = F, 7 = G, 9 = A, 11 = B, and the odd ones in between the black keys") },
          { tex: r`o = \left\lfloor \frac{m}{12} \right\rfloor - 1`, why: tx(t, "musNam_do2", "the quotient ⌊m/12⌋ (division rounded down) counts the Cs from the start of the MIDI numbers. MIDI 0 is the C of octave −1, so subtract 1: 60 / 12 = 5, and middle C is in octave 4") },
          { tex: r`69 = 12 \times 5 + 9 \;\Rightarrow\; pc = 9 = \text{A},\ o = 4 \;\Rightarrow\; \amber{\text{A4}}`, why: tx(t, "musNam_do3", "the tuning A. And 59 = 12 × 4 + 11 gives B3, the key just below C4") },
          { tex: r`m = 12\,(o + 1) + pc`, why: tx(t, "musNam_do4", "backwards: G2 is 12 × 3 + 7 = 43") },
        ]} />
      <Equation label={tx(t, "musNam_eqName", "Name of key m")}
        where={[
          [r`m`, tx(t, "musNam_wm", "the key number (MIDI): 60 is middle C, 21 the lowest key of a piano, 108 the highest")],
          [r`pc`, tx(t, "musNam_wpc", "the pitch class, 0 to 11: which of the 12 names, C = 0")],
          [r`\bmod`, tx(t, "musNam_wmod", "the remainder of a division: 69 mod 12 = 9, because 69 = 5 × 12 + 9")],
          [r`o`, tx(t, "musNam_wo", "the octave number, written after the letter: C4, A4")],
          [r`\lfloor\ \rfloor`, tx(t, "musNam_wfloor", "round down to a whole number: ⌊5.75⌋ = 5")],
        ]}
        words={tx(t, "musNam_eqNameWords", "Divide the key number by 12: the remainder is the name, the quotient minus 1 the octave.")}>
        {r`pc = m \bmod 12, \qquad o = \left\lfloor \frac{m}{12} \right\rfloor - 1`}
      </Equation>
      <p>
        {tx(t, "musNam_clock",
          "Pitch classes work like the hours on a clock. Twelve keys up from E is E again, just as 12 hours after 3 o'clock it is 3 o'clock again. Mathematicians call this arithmetic modulo 12, and music uses it constantly: 5 half steps up from G (7) is 7 + 5 = 12, which on the 12-clock is 0, C. The figure above already drew the octave as a clock for that reason.")}
      </p>
      <p>
        {tx(t, "musNam_conventions",
          "One warning: not everybody numbers octaves the same way. Many keyboards and music programs (Yamaha, for one) call middle C \"C3\", and in France, and often in Brazil, it is \"Dó3\"; older German books write it c′. The note is the same, only the label moves. When in doubt, ask which C is \"middle C\".")}
      </p>
      <LiveFormula label={tx(t, "musNam_liveKey", "Try it: name any key")}
        tex={r`pc = m \bmod 12, \qquad o = \left\lfloor \frac{m}{12} \right\rfloor - 1`}
        vars={[
          { id: "m", label: tx(t, "musNam_liveM", "key number (m)"), min: 21, max: 108, step: 1, value: 60, fmt: v => String(v) },
        ]}
        compute={keyNumbers(t)}
        where={[
          [r`f`, tx(t, "musNam_wf", "the frequency from chapter 2, f = 440 · 2^((m − 69)/12)")],
        ]}
        note={tx(t, "musNam_liveKeyNote", "Step from 59 to 60: the octave number jumps from 3 to 4 between B and C. Then try 21 and 108, the two ends of the piano, and 69, the A that orchestras tune to.")} />

      <H2>{tx(t, "musNam_88Title", "The 88 keys")}</H2>
      <p>
        {tx(t, "musNam_88Body",
          "A modern piano runs from A0, at 27.5 Hz, to C8, at about 4186 Hz: from key number 21 to key number 108. Pianos of Mozart's time had only about five octaves; makers kept adding keys through the 19th century, and around 1880 settled on 88, beyond which the notes are too low or too high to sound clearly as pitches. How many of them are white?")}
      </p>
      <Derivation t={t} label={tx(t, "musNam_8dTitle", "Counting the keys of a piano")}
        steps={[
          { tex: r`108 - 21 + 1 = \amber{88}`, why: tx(t, "musNam_8d0", "every key from 21 to 108, both ends included: subtracting gives the steps between them, and the + 1 counts the first key") },
          { tex: r`\underbrace{2}_{\text{A0 B0}} + \underbrace{7 \times 7}_{\text{C1 … B7}} + \underbrace{1}_{\text{C8}} = \green{52}`, why: tx(t, "musNam_8d1", "the white keys: the two at the bottom, seven full octaves of 7 white keys, and the top C") },
          { tex: r`88 - 52 = \green{36}`, why: tx(t, "musNam_8d2", "the rest are black: one at the bottom (between A0 and B0) plus 7 octaves of 5 = 36") },
        ]} />

      <H2>{tx(t, "musNam_practiceTitle", "Practice")}</H2>
      <p>
        {tx(t, "musNam_practiceBody",
          "Knowing the rule is not the same as seeing a key and knowing its name at once. That comes from a few minutes of practice, a few days in a row: spacing practice out works far better than one long session. The game below asks for names and keys, with letters or with do re mi.")}
      </p>

      <MusicNoteQuizFigure t={t} />

      <p>
        {tx(t, "musNam_next",
          "The keyboard gives every note a place. Written music needs one too: a way to put pitch on paper so that a musician can read it at a glance. The next chapter builds the staff, five lines on which higher notes sit higher, and the clefs that say which line is which note, starting from middle C, C4.")}
      </p>

      <KeyIdeas t={t} id="musNam" items={[
        "The white keys are named C D E F G A B (do re mi fa sol la si), repeating every octave, since notes an octave apart sound like the same note.",
        "The black keys come in groups of 2 and 3: C is just left of each group of two, F just left of each group of three.",
        "A half step is the next key; a whole step skips one. The white keys go 2 2 1 2 2 2 1: from a + b = 7 and 2a + b = 12, five whole steps (each hiding a black key) and two half steps, E–F and B–C.",
        "The white keys are the most even 7 of the 12 notes, and the 5 black keys the most even 5: the major and pentatonic scales to come.",
        "Scientific pitch notation adds the octave: middle C = C4 = key 60, A4 = 440 Hz; pc = m mod 12 and o = ⌊m/12⌋ − 1, the number changing at every C.",
        "A piano has 88 keys, A0 to C8: 52 white and 36 black.",
      ]} />
    </Article>
  );
}
