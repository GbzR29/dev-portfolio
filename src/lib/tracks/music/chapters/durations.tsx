"use client";

// Rhythm: note durations — how long each note lasts, counted in beats. The
// halving tree of note values (whole, half, quarter, eighth, sixteenth) and
// their names, b = 4/v when the beat is a quarter note, the symbols (head,
// stem, flags, beams), rests, dots (the series 2 − 1/2ⁿ) and ties, counting
// subdivisions out loud, triplets and other tuplets, swing, and the gap
// between the written length and the heard one.

import { H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { MusicDurationTreeFigure } from "@/components/lesson/figures/music/DurationTreeFigure";
import { MusicRhythmBuilderFigure } from "@/components/lesson/figures/music/RhythmBuilderFigure";
import { MusicSubdivisionFigure } from "@/components/lesson/figures/music/SubdivisionFigure";
import { noteNumbers, tupletNumbers } from "../live/durations";

const r = String.raw;
const NAMES = ["whole", "half", "quarter", "eighth", "sixteenth"];

export function DurationsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "musDur_intro",
          "The last chapter gave music a steady beat and a tempo that says how long one beat lasts. But a melody is not a row of equal notes: \"Happy Birthday\" holds some syllables and hurries over others. This chapter is about how long each note lasts. The answer is always counted in beats, which is why the same written rhythm can be played at any tempo.")}
      </Lead>

      <Goals t={t} id="musDur" items={[
        "Name the five common note values and say how many beats each lasts when the beat is a quarter note.",
        "Read the parts of a note symbol (head, stem, flags, beams) and the matching rests.",
        "Work out the length of a dotted or double-dotted note, and explain why a dot adds exactly half.",
        "Use ties to make lengths no single note can, and to carry a note across a bar line.",
        "Count subdivisions of the beat out loud, and explain triplets, other tuplets and swing.",
      ]} />

      <H2>{tx(t, "musDur_unitTitle", "Lengths are counted in beats")}</H2>
      <p>
        {tx(t, "musDur_unitBody",
          "A written note does not say \"0.5 seconds\". It says \"one beat\", or \"half a beat\", or \"two beats\". The tempo then turns beats into seconds, with the formula from the last chapter: one beat lasts 60/BPM seconds. Writing lengths in beats has a big advantage: a band can play the same song slower or faster, and every note keeps its share of the beat. Only the tempo changes.")}
      </p>
      <Equation label={tx(t, "musDur_eqSec", "From beats to seconds")}
        where={[
          [r`t`, tx(t, "musDur_wt", "how long the note lasts, in seconds")],
          [r`b`, tx(t, "musDur_wb", "how long the note lasts, in beats: what is written on the page")],
          [r`\frac{60}{\text{BPM}}`, tx(t, "musDur_wBeat", "the length of one beat in seconds, from chapter 5: 60 seconds shared among BPM beats")],
        ]}
        words={tx(t, "musDur_secWords", "Seconds = beats × seconds per beat.")}>
        {r`t = b \times \frac{60}{\text{BPM}}`}
      </Equation>

      <H2>{tx(t, "musDur_treeTitle", "The halving tree")}</H2>
      <p>
        {tx(t, "musDur_treeBody",
          "All the common note lengths come from one long note by halving. The longest everyday note is the whole note. Cut it in two and you get two half notes; cut each half in two and you get four quarter notes; then eight eighth notes, sixteen sixteenth notes, and so on. Each name says what fraction of a whole note the note is. In most music the beat is a quarter note, and a whole note then lasts four beats. That number 4 is the only fact you need to remember.")}
      </p>
      <Derivation t={t} label={tx(t, "musDur_dTree", "How many beats a note value lasts")}
        steps={[
          { tex: r`\text{${tx(t, "musDur_dWhole", "whole note")}} = 4\ \text{${tx(t, "musDur_dBeats", "beats")}}`, why: tx(t, "musDur_d0", "the starting point: with the beat as a quarter note, a whole note is four beats (four quarters make a whole)") },
          { tex: r`\frac{1}{v}\ \text{${tx(t, "musDur_dOfWhole", "of a whole note")}} = \frac{1}{v} \times 4`, why: tx(t, "musDur_d1", "a note called \"1/v\" (v = 2 for half, 4 for quarter, 8 for eighth, 16 for sixteenth) lasts that fraction of the whole note's four beats") },
          { tex: r`b = \frac{4}{v}`, why: tx(t, "musDur_d2", "tidied up: the number of beats is 4 divided by the number in the name") },
          { tex: r`b = \frac{4}{1}, \frac{4}{2}, \frac{4}{4}, \frac{4}{8}, \frac{4}{16} = \amber{4,\ 2,\ 1,\ \tfrac12,\ \tfrac14}`, why: tx(t, "musDur_d3", "the five common values: each one is half the one before, because v doubles each time") },
        ]} />
      <Equation label={tx(t, "musDur_eqValue", "Beats in a note value")}
        where={[
          [r`b`, tx(t, "musDur_wb2", "the length in beats")],
          [r`v`, tx(t, "musDur_wv", "the number in the note's name: 1 whole, 2 half, 4 quarter, 8 eighth, 16 sixteenth. It is always a power of 2")],
          [r`4`, tx(t, "musDur_w4", "the beats in a whole note when the beat is a quarter note, the most common case. The chapter on meter shows music where the beat is a different value")],
        ]}
        words={tx(t, "musDur_valueWords", "Four divided by the number in the name.")}>
        {r`b = \frac{4}{v}`}
      </Equation>

      <MusicDurationTreeFigure t={t} />

      <p>
        {tx(t, "musDur_namesBody",
          "The names in this chapter are American English, which counts fractions. British English uses older names that came from medieval Latin, and Portuguese, Spanish and Italian use names from the same family:")}
      </p>
      <LessonTable
        headers={[tx(t, "musDur_tName", "Name"), tx(t, "musDur_tUk", "British name"), tx(t, "musDur_tFrac", "Fraction of a whole"), tx(t, "musDur_tBeats", "Beats (b = 4/v)"), tx(t, "musDur_tMs", "At 120 BPM")]}
        rows={[
          [tx(t, "musDur_n1", "whole note"), tx(t, "musDur_u1", "semibreve"), "1", "4", "2000 ms"],
          [tx(t, "musDur_n2", "half note"), tx(t, "musDur_u2", "minim"), "1/2", "2", "1000 ms"],
          [tx(t, "musDur_n4", "quarter note"), tx(t, "musDur_u4", "crotchet"), "1/4", "1", "500 ms"],
          [tx(t, "musDur_n8", "eighth note"), tx(t, "musDur_u8", "quaver"), "1/8", "1/2", "250 ms"],
          [tx(t, "musDur_n16", "sixteenth note"), tx(t, "musDur_u16", "semiquaver"), "1/16", "1/4", "125 ms"],
          [tx(t, "musDur_n32", "thirty-second note"), tx(t, "musDur_u32", "demisemiquaver"), "1/32", "1/8", "62.5 ms"],
        ]}
      />
      <p>
        {tx(t, "musDur_history",
          "The British names hide a small joke of history. In the 13th century the common notes were the longa (long) and the brevis (short). As composers wrote faster and faster notes, the \"short\" breve became one of the longest, and the semibreve, \"half a short\", became the whole note we use today. The breve still exists, worth two whole notes, but you will rarely meet it.")}
      </p>

      <H3>{tx(t, "musDur_symTitle", "Reading the symbols")}</H3>
      <p>
        {tx(t, "musDur_symBody",
          "A note symbol is built from a few parts, and each part halves the length again. The head is the oval: hollow for whole and half notes, filled in from the quarter note on. The stem is the line on the head; every note shorter than a whole has one, and it can point up or down without changing anything. Flags are the little tails on the stem: one flag makes an eighth, two a sixteenth, three a thirty-second. When several flagged notes sit next to each other, their flags are joined into thick lines called beams, usually one group per beat, so the eye can see where each beat starts.")}
      </p>
      <LessonTable
        headers={[tx(t, "musDur_pPart", "Part"), tx(t, "musDur_pDoes", "What it tells you")]}
        rows={[
          [tx(t, "musDur_p1", "Hollow head, no stem"), tx(t, "musDur_p1d", "whole note: 4 beats")],
          [tx(t, "musDur_p2", "Hollow head + stem"), tx(t, "musDur_p2d", "half note: 2 beats")],
          [tx(t, "musDur_p3", "Filled head + stem"), tx(t, "musDur_p3d", "quarter note: 1 beat")],
          [tx(t, "musDur_p4", "Each flag (or beam)"), tx(t, "musDur_p4d", "halves the length again: 1 flag ½ beat, 2 flags ¼ beat")],
          [tx(t, "musDur_p5", "Dot after the head"), tx(t, "musDur_p5d", "adds half the note's own length (next section)")],
        ]}
      />
      <p>
        {tx(t, "musDur_lineBody",
          "Where the head sits up or down on the staff says which note to play; that is the subject of the Notes section. In this chapter all the notes are drawn on one line, as drummers often write them, because only the length matters here.")}
      </p>

      <H2>{tx(t, "musDur_restTitle", "Rests: silence that counts")}</H2>
      <p>
        {tx(t, "musDur_restBody",
          "Silence in music is measured just like sound. For each note value there is a rest of the same length: a whole rest (a small block hanging under a line), a half rest (a block sitting on it), a quarter rest (a zigzag), an eighth rest (a dot with a slanted stroke, one hook per flag). During a rest the beat keeps going, and the player counts it. The most famous opening in classical music starts with one: Beethoven's Fifth Symphony begins with an eighth rest, so the \"da-da-da\" comes in just after the beat, which is part of why it sounds so urgent. Rests can be dotted like notes.")}
      </p>

      <H2>{tx(t, "musDur_dotTitle", "Dots and ties")}</H2>
      <p>
        {tx(t, "musDur_dotBody",
          "Halving only gives lengths like 4, 2, 1, ½. To get 3 beats, or 1½, music uses a dot: a dot after a note adds half of the note's own length. A dotted half note is 2 + 1 = 3 beats; a dotted quarter is 1 + ½ = 1½. A second dot adds half of what the first one added, a quarter of the note. The pattern continues, and it has a neat closed form.")}
      </p>
      <Derivation t={t} label={tx(t, "musDur_dDots", "The length of a note with n dots")}
        steps={[
          { tex: r`b + \tfrac12 b`, why: tx(t, "musDur_dd0", "one dot: the note's length b, plus half of it") },
          { tex: r`b + \tfrac12 b + \tfrac14 b`, why: tx(t, "musDur_dd1", "two dots: the second dot adds half of what the first added, a quarter of b") },
          { tex: r`b\left(1 + \tfrac12 + \tfrac14 + \dots + \tfrac{1}{2^n}\right)`, why: tx(t, "musDur_dd2", "n dots: each term is half the one before; take b out as a common factor") },
          { tex: r`S = 1 + \tfrac12 + \dots + \tfrac{1}{2^n},\quad \tfrac12 S = \tfrac12 + \dots + \tfrac{1}{2^{n+1}}`, why: tx(t, "musDur_dd3", "call the bracket S, and write half of it underneath: every term of ½S is also in S, shifted one place") },
          { tex: r`S - \tfrac12 S = 1 - \tfrac{1}{2^{n+1}}`, why: tx(t, "musDur_dd4", "subtract: all the middle terms cancel, leaving the first term of S and the last term of ½S") },
          { tex: r`S = 2 - \tfrac{1}{2^n}`, why: tx(t, "musDur_dd5", "multiply both sides by 2 (since S − ½S = ½S)") },
          { tex: r`b_n = \amber{b\left(2 - \tfrac{1}{2^n}\right)}`, why: tx(t, "musDur_dd6", "so no dots gives b·1, one dot b·1.5, two dots b·1.75. However many dots you add, the note never quite reaches twice its length") },
        ]} />
      <Equation label={tx(t, "musDur_eqDots", "A dotted note")}
        where={[
          [r`b_n`, tx(t, "musDur_wbd", "the length of the dotted note, in beats")],
          [r`b`, tx(t, "musDur_wb3", "the length of the same note without dots, 4/v")],
          [r`n`, tx(t, "musDur_wn", "the number of dots: 0, 1 or 2 in practice (three dots exist but are very rare)")],
          [r`2 - \tfrac{1}{2^n}`, tx(t, "musDur_wFactor", "the stretch factor: 1 with no dots, 1.5 with one, 1.75 with two")],
        ]}
        words={tx(t, "musDur_dotWords", "Each dot adds half of what came before it, so the note creeps towards double its length.")}>
        {r`b_n = b\left(2 - \frac{1}{2^n}\right)`}
      </Equation>
      <LiveFormula label={tx(t, "musDur_liveNote", "Try it: a note value, dots and tempo")}
        tex={r`b = \frac{4}{v}\left(2 - \frac{1}{2^{n}}\right) \qquad t = b \times \frac{60}{\text{BPM}}`}
        vars={[
          { id: "k", label: tx(t, "musDur_liveValue", "note value"), min: 0, max: 4, step: 1, value: 2, fmt: k => tx(t, `musDur_lvN${k}`, NAMES[k]) },
          { id: "dots", label: tx(t, "musDur_liveDots", "dots (n)"), min: 0, max: 2, step: 1, value: 1, fmt: v => String(v) },
          { id: "bpm", label: tx(t, "musDur_liveBpm", "tempo (BPM)"), min: 40, max: 200, step: 1, value: 120, fmt: v => `${v} BPM` },
        ]}
        compute={noteNumbers(t)}
        where={[
          [r`v`, tx(t, "musDur_wv2", "the number in the value's name: 1, 2, 4, 8 or 16")],
          [r`n`, tx(t, "musDur_wn2", "the number of dots")],
          [r`t`, tx(t, "musDur_wt2", "the length in seconds at this tempo")],
        ]}
        note={tx(t, "musDur_liveNoteNote", "A dotted quarter at 120 BPM lasts 1.5 beats, 750 ms. It is usually followed by an eighth (½ beat), and the pair fills two beats: that long-short \"dum, da\" is the dotted rhythm of \"Jingle Bells\" (\"jin-gle all the way\").")} />

      <p>
        {tx(t, "musDur_tieBody",
          "A dot can only add half. For any other sum, music uses a tie: a curved line joining two notes of the same pitch, which are then played as one long note lasting both lengths added together. A quarter tied to a sixteenth lasts 1¼ beats, a length no single note or dot can make. Ties are also how a note crosses a bar line (the lines that divide music into groups of beats, next chapter): a note that starts near the end of one bar and goes on into the next is written as two tied notes, one in each bar.")}
      </p>

      <MusicRhythmBuilderFigure t={t} />

      <H2>{tx(t, "musDur_subTitle", "Subdividing the beat")}</H2>
      <p>
        {tx(t, "musDur_subBody",
          "To play short notes evenly, musicians count the parts of each beat out loud. In English the beat is split in two as \"1 and 2 and\" (written 1 & 2 &), and in four as \"1 e and a\" (1 e & a). The numbers fall on the beats; the syllables fill the gaps. Counting keeps a steady grid in your head, so a run of sixteenths does not rush and a long note is held for its full length.")}
      </p>

      <H3>{tx(t, "musDur_tripTitle", "Triplets: three in the time of two")}</H3>
      <p>
        {tx(t, "musDur_tripBody",
          "Halving can split a beat into 2, 4 or 8, but never into 3. For that music uses a triplet: three notes played in the time normally taken by two of the same kind, written with a bracket or beam marked \"3\". Three triplet eighths fill one beat, the time of two ordinary eighths, so each lasts ⅓ of a beat instead of ½. The same idea works for any count, and the general name is tuplet: five in the time of four (a quintuplet), two in the time of three (a duplet), and so on.")}
      </p>
      <Equation label={tx(t, "musDur_eqTuplet", "One note of a tuplet")}
        where={[
          [r`b'`, tx(t, "musDur_wEach", "how long each note of the tuplet lasts, in beats")],
          [r`n`, tx(t, "musDur_wnT", "how many notes are played (3 in a triplet)")],
          [r`m`, tx(t, "musDur_wmT", "how many ordinary notes of the same value they replace (2 in a triplet)")],
          [r`\frac{4}{v}`, tx(t, "musDur_wvT", "the ordinary length of the written value, in beats")],
        ]}
        words={tx(t, "musDur_tupWords", "n notes share the time that m ordinary ones would take.")}>
        {r`b' = \frac{m}{n} \times \frac{4}{v}`}
      </Equation>
      <LiveFormula label={tx(t, "musDur_liveTup", "Try it: n notes in the time of m")}
        tex={r`b' = \frac{m}{n} \times \frac{4}{v}`}
        vars={[
          { id: "n", label: tx(t, "musDur_liveN", "notes played (n)"), min: 2, max: 7, step: 1, value: 3, fmt: v => String(v) },
          { id: "m", label: tx(t, "musDur_liveM", "in the time of (m)"), min: 2, max: 8, step: 1, value: 2, fmt: v => String(v) },
          { id: "k", label: tx(t, "musDur_liveValue", "note value"), min: 0, max: 4, step: 1, value: 3, fmt: k => tx(t, `musDur_lvN${k}`, NAMES[k]) },
          { id: "bpm", label: tx(t, "musDur_liveBpm", "tempo (BPM)"), min: 40, max: 200, step: 1, value: 90, fmt: v => `${v} BPM` },
        ]}
        compute={tupletNumbers(t)}
        where={[
          [r`b'`, tx(t, "musDur_wEach2", "the length of one tuplet note")],
        ]}
        note={tx(t, "musDur_liveTupNote", "The check on the right: n tuplet notes take as long as m ordinary ones (up to rounding). Try 3 in the time of 2 quarter notes: three notes spread over two beats, the \"three against two\" feel of many Latin and African rhythms.")} />

      <H3>{tx(t, "musDur_swingTitle", "Swing")}</H3>
      <p>
        {tx(t, "musDur_swingBody",
          "In jazz, blues and a lot of pop, pairs of eighth notes are not played evenly. The first of each pair is longer and the second shorter and later: \"long-short, long-short\", the lilt of a shuffle. This is called swing, and it is usually written as plain eighths with a note at the top saying \"swing\". A simple model of swing is the triplet: the first eighth takes two triplets (⅔ of the beat) and the second takes one (⅓), a ratio of 2 to 1. Real players vary it: when researchers measured jazz drummers, the ratio was wide at slow tempos, near 3 to 1, and almost even at very fast ones.")}
      </p>

      <MusicSubdivisionFigure t={t} />

      <H2>{tx(t, "musDur_heardTitle", "Written length and heard length")}</H2>
      <p>
        {tx(t, "musDur_heardBody",
          "Strictly, a written value fixes when the next note starts, not how long the sound rings. A note marked staccato (a dot above or below the head, not after it) is played short and detached, and the rest of its time is silence; legato (a curved slur over several notes) joins the notes with no gap. A piano note also fades by itself, and a drum hit is over in a moment, yet a drummer's quarter note still takes up a whole beat before the next hit. So the time from one note's start to the next one's, called the inter-onset interval, is what rhythm is really made of.")}
      </p>
      <p>
        {tx(t, "musDur_heardAfter",
          "In the rhythm builder, the two bars hold exactly four beats each. That is not a coincidence: most music groups its beats into bars of 2, 3 or 4 with a stronger beat at the start of each, the grouping your brain was already adding to the metronome in the last chapter. How those groups are made, and what the two numbers at the start of a piece mean, is the next chapter: meter.")}
      </p>

      <KeyIdeas t={t} id="musDur" items={[
        "Note lengths are counted in beats, so a rhythm keeps its shape at any tempo; seconds = beats × 60/BPM.",
        "The note values halve: whole, half, quarter, eighth, sixteenth. With the beat as a quarter note, a value named 1/v lasts b = 4/v beats (4, 2, 1, ½, ¼).",
        "Hollow or filled head, stem, and flags or beams tell the value; every note value has a rest of the same length, and the beat goes on through it.",
        "A dot adds half the note's length; n dots stretch it to b(2 − 1/2ⁿ), from summing the halving series. A tie adds any two lengths and carries notes across bar lines.",
        "Beats are counted out loud as 1 & 2 & or 1 e & a; a tuplet plays n notes in the time of m, each lasting (m/n)·(4/v) beats, the triplet being 3 in the time of 2.",
        "Swing plays pairs of eighths long-short, close to a 2:1 triplet feel; the written value fixes when the next note starts, while staccato and legato change how long the sound rings.",
      ]} />
    </Article>
  );
}
