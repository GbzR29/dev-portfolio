"use client";

// Rhythm: meter — beats grouped into bars by a repeating pattern of strong and
// weak beats. The metrical grid (why beat 3 of 4/4 is medium), bars and bar
// lines, the time signature and b = d/v, simple and compound meters (3/4
// against 6/8, the hemiola), odd meters built from 2s and 3s with the count
// c(n) = c(n−2) + c(n−3), pickups and four-bar phrases.

import { H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { MusicMeterFigure } from "@/components/lesson/figures/music/MeterFigure";
import { MusicHemiolaFigure } from "@/components/lesson/figures/music/HemiolaFigure";
import { MusicOddMeterFigure } from "@/components/lesson/figures/music/OddMeterFigure";
import { barNumbers, countNumbers } from "../live/meter";

const r = String.raw;

export function MeterContent({ t }: { t: TrackTranslations }) {
  const DOT = "●";
  return (
    <Article>
      <Lead>
        {tx(t, "musMet_intro",
          "In chapter 5 you heard a metronome whose clicks were all the same, and your brain grouped them anyway: tick-tock, or ONE-two-three. Music builds that grouping in on purpose. Some beats are played stronger than others, in a pattern that repeats, and the pattern is called the meter. It is why a waltz makes you sway in threes and a march makes you step left-right. This chapter shows how meter works, what the two numbers at the start of a piece mean, and why some music counts in 7.")}
      </Lead>

      <Goals t={t} id="musMet" items={[
        "Explain meter as a repeating pattern of strong and weak beats, and find the downbeat.",
        "Use the metrical grid to say how strong each position in a bar is.",
        "Read a time signature: what the top and bottom numbers mean, and how long a bar lasts.",
        "Tell simple meters (beat split in 2) from compound ones (beat split in 3), and hear 3/4 against 6/8.",
        "Build odd meters such as 5/8 and 7/8 from groups of 2 and 3, and count how many ways there are.",
      ]} />

      <H2>{tx(t, "musMet_strongTitle", "Strong and weak beats")}</H2>
      <p>
        {tx(t, "musMet_strongBody",
          "Say \"HAPpy BIRTHday to YOU\" and you stress some syllables and not others. Music does the same with beats. In a waltz every third beat is the strong one: ONE-two-three, ONE-two-three. In a march every second: ONE-two, ONE-two. A group that starts with a strong beat and runs until the next one is a bar (also called a measure), and its first beat is the downbeat. The name comes from conductors, whose hand moves down on that beat; the beat just before it, where the hand comes up, is the upbeat.")}
      </p>
      <p>
        {tx(t, "musMet_strongWhy",
          "The strong beat is not always louder. It can be a bass note, a chord change, a longer note or the stressed syllable of a word: anything that marks the start of the group. What matters is that the pattern repeats, so the listener can predict it. Once the brain has the meter, it knows where the next downbeat will land before it comes, which is what lets a crowd clap, dance or sing together.")}
      </p>

      <MusicMeterFigure t={t} />

      <H3>{tx(t, "musMet_gridTitle", "The metrical grid: how strong is each beat?")}</H3>
      <p>
        {tx(t, "musMet_gridBody",
          "In 4/4, the most common meter, beat 1 is strong, beat 3 medium, and beats 2 and 4 weak. Where does \"medium\" come from? Meter has several levels stacked on top of each other: the eighth notes, the beats, the half bars, the whole bars. Each level is a steady pulse twice as slow as the one below. Mark a dot on every position where a level has a pulse, and count the dots in each column. This picture is called the metrical grid; the music theorists Fred Lerdahl and Ray Jackendoff made it standard in 1983.")}
      </p>
      <LessonTable
        headers={[tx(t, "musMet_gLevel", "Level (one pulse every…)"), "1", "&", "2", "&", "3", "&", "4", "&"]}
        rows={[
          [tx(t, "musMet_gBar", "bar (4 beats)"), DOT, "", "", "", "", "", "", ""],
          [tx(t, "musMet_gHalf", "half bar (2 beats)"), DOT, "", "", "", DOT, "", "", ""],
          [tx(t, "musMet_gBeat", "beat"), DOT, "", DOT, "", DOT, "", DOT, ""],
          [tx(t, "musMet_gEighth", "eighth note (½ beat)"), DOT, DOT, DOT, DOT, DOT, DOT, DOT, DOT],
          [tx(t, "musMet_gTotal", "dots = strength"), "4", "1", "2", "1", "3", "1", "2", "1"],
        ]}
      />
      <p>
        {tx(t, "musMet_gridAfter",
          "Beat 1 starts every level, so it has the most dots and is the strongest. Beat 3 starts a half bar, so it comes second. Beats 2 and 4 belong only to the beat level, and the \"ands\" between beats are weakest of all. The same counting works for any meter, and the next chapter uses it to say exactly what it means for a note to come \"off the beat\".")}
      </p>
      <p>
        {tx(t, "musMet_conduct",
          "Conductors draw the grid in the air. In 2 the hand goes down and up; in 3, down, out to the side and up; in 4, down, across, out and up. Every pattern starts with the big downward stroke on beat 1 and ends rising on the last beat, so the players always know where the bar starts.")}
      </p>

      <H2>{tx(t, "musMet_barTitle", "Bars and bar lines")}</H2>
      <p>
        {tx(t, "musMet_barBody",
          "On the page, a bar line (a thin vertical line) goes before every downbeat, so each bar sits between two lines and holds the same number of beats. A double bar line marks the end of a section, a thin line plus a thick one the end of the piece, and two dots before it mean \"repeat from the start\" (the repeat sign the widget above draws at the end of its bar). Bars give musicians an address: \"start at bar 17\" is how a rehearsal works. Since each bar holds the same beats, its length in seconds follows from the tempo.")}
      </p>
      <Equation label={tx(t, "musMet_eqBar", "The length of one bar")}
        where={[
          [r`t_{\text{bar}}`, tx(t, "musMet_wtBar", "how long one bar lasts, in seconds")],
          [r`n`, tx(t, "musMet_wn", "the number of beats in a bar: 2 in a march, 3 in a waltz, 4 in most pop")],
          [r`\frac{60}{\text{BPM}}`, tx(t, "musMet_wBeat", "the length of one beat in seconds (chapter 5)")],
        ]}
        words={tx(t, "musMet_barWords", "A bar lasts as many beats as it holds, times the length of one beat.")}>
        {r`t_{\text{bar}} = n \times \frac{60}{\text{BPM}}`}
      </Equation>
      <p>
        {tx(t, "musMet_barEx",
          "A waltz at 180 BPM has bars of 3 × 60/180 = 1 second: one sway a second. A pop song in 4/4 at 120 BPM has bars of 2 seconds, and a three-minute song holds 90 of them.")}
      </p>

      <H2>{tx(t, "musMet_sigTitle", "The time signature")}</H2>
      <p>
        {tx(t, "musMet_sigBody",
          "At the start of a piece, right after the clef, two numbers stand one above the other. This is the time signature, and it says what each bar holds. The top number says how many beats are in a bar. The bottom number says which note value counts as one beat, using the numbers in the note names from chapter 6: 4 means a quarter note, 2 a half note, 8 an eighth note. So 3/4 means \"three quarter notes per bar\" and 2/2 means \"two half notes per bar\". It is written without a fraction line, but it can be read as a fraction: the bar lasts that much of a whole note.")}
      </p>
      <Equation label={tx(t, "musMet_eqSig", "Reading a time signature")}
        where={[
          [r`N`, tx(t, "musMet_wN", "the top number: how many of the counted notes fill one bar")],
          [r`d`, tx(t, "musMet_wd", "the bottom number: which note value is counted, 4 for a quarter note, 8 for an eighth, 2 for a half. It is always a power of 2")],
          [r`\frac{N}{d}`, tx(t, "musMet_wFrac", "the length of the bar as a fraction of a whole note: 3/4 is three quarters of a whole note")],
        ]}
        words={tx(t, "musMet_sigWords", "N notes of the value 1/d in every bar.")}>
        {r`\frac{N}{d}\ :\quad \text{${tx(t, "musMet_sigTex", "one bar")}} = N \times \frac{1}{d}\ \text{${tx(t, "musMet_sigOfWhole", "of a whole note")}}`}
      </Equation>
      <p>
        {tx(t, "musMet_sigLink",
          "Chapter 6 counted lengths with b = 4/v, and promised that the 4 would change in some meters. Here is why. The 4 was the bottom number of 4/4, the number of beats in a whole note. With another bottom number, the same reasoning gives a general rule.")}
      </p>
      <Derivation t={t} label={tx(t, "musMet_dBeats", "How many beats a note lasts, for any bottom number")}
        steps={[
          { tex: r`1\ \text{${tx(t, "musMet_dBeat", "beat")}} = \frac{1}{d}\ \text{${tx(t, "musMet_dWhole", "whole note")}}`, why: tx(t, "musMet_d0", "the bottom number d says the beat is the note worth 1/d of a whole note") },
          { tex: r`\text{${tx(t, "musMet_dNote", "note")}} = \frac{1}{v}\ \text{${tx(t, "musMet_dWhole", "whole note")}}`, why: tx(t, "musMet_d1", "the note we want to measure is worth 1/v of a whole note (v = 1, 2, 4, 8, 16 as in chapter 6)") },
          { tex: r`b = \frac{1/v}{1/d}`, why: tx(t, "musMet_d2", "its length in beats is how many times one beat fits into it: divide the two sizes") },
          { tex: r`b = \amber{\frac{d}{v}}`, why: tx(t, "musMet_d3", "dividing by 1/d is multiplying by d. With d = 4 this is chapter 6's 4/v; in 2/2 a quarter note lasts 2/4 = ½ beat; in 3/8 a quarter lasts 8/4 = 2 beats") },
        ]} />

      <LessonTable
        headers={[tx(t, "musMet_tSig", "Signature"), tx(t, "musMet_tBeats", "Beats per bar"), tx(t, "musMet_tBeat", "The beat"), tx(t, "musMet_tHeard", "Heard in")]}
        rows={[
          ["2/4", "2", tx(t, "musMet_tQ", "quarter note"), tx(t, "musMet_h24", "marches, polkas, many children's songs")],
          ["3/4", "3", tx(t, "musMet_tQ", "quarter note"), tx(t, "musMet_h34", "waltzes (The Blue Danube), \"Happy Birthday\"")],
          ["4/4  (C)", "4", tx(t, "musMet_tQ", "quarter note"), tx(t, "musMet_h44", "most pop, rock and hip hop (\"We Will Rock You\")")],
          ["2/2  (¢)", "2", tx(t, "musMet_tH", "half note"), tx(t, "musMet_h22", "fast marches (\"The Stars and Stripes Forever\")")],
          ["6/8", "2", tx(t, "musMet_tDQ", "dotted quarter"), tx(t, "musMet_h68", "\"Row, Row, Row Your Boat\", \"The House of the Rising Sun\"")],
          ["9/8", "3", tx(t, "musMet_tDQ", "dotted quarter"), tx(t, "musMet_h98", "Irish slip jigs")],
          ["12/8", "4", tx(t, "musMet_tDQ", "dotted quarter"), tx(t, "musMet_h128", "slow blues, shuffles, doo-wop ballads")],
          ["5/4", "5 (3 + 2)", tx(t, "musMet_tQ", "quarter note"), tx(t, "musMet_h54", "\"Take Five\", the Mission: Impossible theme")],
          ["7/8", "3 (2 + 2 + 3)", tx(t, "musMet_tUneq", "unequal"), tx(t, "musMet_h78", "Bulgarian and Greek dances")],
        ]}
      />
      <p>
        {tx(t, "musMet_sigHistory",
          "The C used for 4/4 is not a C for \"common time\", though that is its name today. In medieval notation a full circle meant \"perfect time\", grouped in threes (perfect, like the Trinity), and a broken circle meant \"imperfect time\", grouped in twos. The broken circle became the C. Cut through by a line, ¢, it means 2/2, \"cut time\" or alla breve: the same notes as 4/4, but felt in two big beats, which suits fast music.")}
      </p>
      <LiveFormula label={tx(t, "musMet_liveBar", "Try it: a time signature at a tempo")}
        tex={r`\frac{N}{d} \qquad t_{\text{bar}} = n \times \frac{60}{\text{BPM}}`}
        vars={[
          { id: "N", label: tx(t, "musMet_liveN", "top number (N)"), min: 2, max: 12, step: 1, value: 6, fmt: v => String(v) },
          { id: "k", label: tx(t, "musMet_liveD", "bottom number (d)"), min: 1, max: 4, step: 1, value: 3, fmt: k => String(2 ** k) },
          { id: "bpm", label: tx(t, "musMet_liveBpm", "beats per minute"), min: 40, max: 200, step: 1, value: 80, fmt: v => `${v} BPM` },
        ]}
        compute={barNumbers(t)}
        where={[
          [r`n`, tx(t, "musMet_wn2", "the beats felt in a bar: N, or N/3 in a compound meter (next section)")],
        ]}
        note={tx(t, "musMet_liveBarNote", "Try 3/4 and then 6/8: both bars are ¾ of a whole note, but one has 3 beats and the other 2. Then 12/8 against 4/4: four beats each, but in 12/8 every beat splits in three.")} />

      <H2>{tx(t, "musMet_compTitle", "Simple and compound meters")}</H2>
      <p>
        {tx(t, "musMet_compBody",
          "The beat itself splits into smaller pulses, and it can split in two ways. In a simple meter each beat splits in two: in 2/4, 3/4 and 4/4 the beat is a quarter note made of two eighths (\"1 & 2 &\"). In a compound meter each beat splits in three: in 6/8 the six eighths are grouped as two beats of three (\"1 la li 2 la li\"), and the beat is a dotted quarter, three eighths long. A 6/8 bar is not felt as six beats, except at very slow tempos; it is felt as two.")}
      </p>
      <Equation label={tx(t, "musMet_eqComp", "Beats in a compound bar")}
        where={[
          [r`n`, tx(t, "musMet_wnC", "the beats felt in the bar")],
          [r`N`, tx(t, "musMet_wNC", "the top number: 6, 9 or 12 in a compound meter")],
          [r`3`, tx(t, "musMet_w3", "the counted notes in each beat: three eighths make one dotted-quarter beat")],
        ]}
        words={tx(t, "musMet_compWords", "When the top number is 6, 9 or 12, divide it by 3 to get the beats.")}>
        {r`n = \frac{N}{3}, \qquad \text{${tx(t, "musMet_compBeat", "beat")}} = 3 \times \frac{1}{d} = \text{${tx(t, "musMet_compDotted", "a dotted note")}}`}
      </Equation>
      <p>
        {tx(t, "musMet_compWhy",
          "Why a dotted note? Three eighths last 3 × ½ = 1½ beats of a quarter, and from chapter 6 a dot multiplies a note by 1.5, so three eighths are exactly one dotted quarter. Combining the two ideas (two, three or four beats per bar; each split in two or in three) gives the six everyday meters:")}
      </p>
      <LessonTable
        headers={["", tx(t, "musMet_cDuple", "2 beats (duple)"), tx(t, "musMet_cTriple", "3 beats (triple)"), tx(t, "musMet_cQuad", "4 beats (quadruple)")]}
        rows={[
          [tx(t, "musMet_cSimple", "simple: beat split in 2"), "2/4", "3/4", "4/4"],
          [tx(t, "musMet_cCompound", "compound: beat split in 3"), "6/8", "9/8", "12/8"],
        ]}
      />

      <H3>{tx(t, "musMet_hemTitle", "3/4 or 6/8: the same six eighths")}</H3>
      <p>
        {tx(t, "musMet_hemBody",
          "3/4 and 6/8 hold exactly the same: six eighth notes, ¾ of a whole note. The difference is only the grouping. 3/4 hears them in three pairs (three beats), 6/8 in two threes (two beats). Notation shows it with beams: eighths in 3/4 are beamed in pairs, in 6/8 in threes. Switching from one grouping to the other is called a hemiola, from the Greek for \"one and a half\" (the beats in one grouping are 1½ times as long as in the other). Baroque composers used it to slow the music down just before a cadence; it is everywhere in Latin American music, from Mexican huapango to Venezuelan joropo; and \"America\" from West Side Story alternates the two, bar after bar.")}
      </p>

      <MusicHemiolaFigure t={t} />

      <H2>{tx(t, "musMet_oddTitle", "Odd meters: beats of unequal length")}</H2>
      <p>
        {tx(t, "musMet_oddBody",
          "So far every beat in a bar had the same length. Many musical traditions also use bars whose beats are unequal: short beats of two eighths mixed with long beats of three. 5/8 is 2 + 3 or 3 + 2; 7/8 is usually 2 + 2 + 3 or 3 + 2 + 2. Turkish music calls these rhythms aksak, \"limping\", because of the long beat that sticks out. They are everyday dance rhythms in Bulgaria, Greece, Turkey and India, and they found their way into jazz with Dave Brubeck's \"Take Five\" (5/4 as 3 + 2) and \"Blue Rondo à la Turk\" (9/8 as 2 + 2 + 2 + 3), and into rock with Pink Floyd's \"Money\" (7/4).")}
      </p>
      <p>
        {tx(t, "musMet_oddBabies",
          "Odd meters are only \"odd\" to some ears. In 2005 the psychologists Erin Hannon and Sandra Trehub played folk tunes to listeners and then broke the meter. Six-month-old babies noticed the break in both simple and Balkan meters. North American adults noticed it only in the simple ones, while adults who grew up with Bulgarian or Macedonian music noticed it in both. By their first birthday, the North American babies had started to lose the Balkan meters too: we learn the meters of the music around us.")}
      </p>
      <p>
        {tx(t, "musMet_oddWhy",
          "Why only groups of 2 and 3? A group of 1 is too short to feel like a beat of its own, so it is heard as part of a neighbour; a group of 4 is heard as two groups of 2. That leaves 2 and 3 as the building blocks, and raises a counting question: how many different bars can be made from n eighths?")}
      </p>
      <Derivation t={t} label={tx(t, "musMet_dCount", "How many ways to cut n eighths into 2s and 3s")}
        steps={[
          { tex: r`c(n) = \text{${tx(t, "musMet_dcDef", "number of ordered sums of 2s and 3s equal to n")}}`, why: tx(t, "musMet_dc0", "the name for what we count: 7 = 2+2+3, 2+3+2 and 3+2+2 are three different bars, so order matters") },
          { tex: r`\underbrace{\dots}_{n-2} + 2 \quad\text{${tx(t, "musMet_dcOr", "or")}}\quad \underbrace{\dots}_{n-3} + 3`, why: tx(t, "musMet_dc1", "look at the last group of the bar: it is either a 2 or a 3, never both") },
          { tex: r`c(n-2) \quad\text{${tx(t, "musMet_dcAnd", "and")}}\quad c(n-3)`, why: tx(t, "musMet_dc2", "if it is a 2, the rest is any grouping of n − 2 eighths, and there are c(n − 2) of those; if it is a 3, there are c(n − 3)") },
          { tex: r`c(n) = \amber{c(n-2) + c(n-3)}`, why: tx(t, "musMet_dc3", "the two cases never overlap and cover everything, so add them") },
          { tex: r`c(0) = 1,\ c(1) = 0,\ c(2) = 1`, why: tx(t, "musMet_dc4", "the starting values: an empty bar has one grouping (nothing), 1 eighth has none, 2 eighths has one (a single 2)") },
          { tex: r`c(2\dots12) = 1, 1, 1, 2, 2, 3, 4, 5, 7, 9, 12`, why: tx(t, "musMet_dc5", "each number is the sum of the one two places back and the one three places back: c(7) = c(5) + c(4) = 2 + 1 = 3") },
        ]} />
      <Equation label={tx(t, "musMet_eqCount", "Groupings of a bar of n eighths")}
        where={[
          [r`c(n)`, tx(t, "musMet_wc", "the number of different ways to group n eighths into beats of 2 and 3")],
          [r`c(n-2)`, tx(t, "musMet_wc2", "the groupings that end with a beat of 2")],
          [r`c(n-3)`, tx(t, "musMet_wc3", "the groupings that end with a beat of 3")],
        ]}
        words={tx(t, "musMet_countWords", "The ways for n = the ways ending in 2 plus the ways ending in 3.")}>
        {r`c(n) = c(n-2) + c(n-3)`}
      </Equation>
      <p>
        {tx(t, "musMet_countAfter",
          "This sequence is known in mathematics as the Padovan sequence. It grows more slowly than the Fibonacci numbers: each term is about 1.32 times the one before (the \"plastic number\"), against 1.62 for Fibonacci. A bar of 12 eighths already has 12 groupings, and 3 + 3 + 3 + 3 (12/8) is only one of them.")}
      </p>
      <LiveFormula label={tx(t, "musMet_liveCount", "Try it: count the groupings")}
        tex={r`c(n) = c(n-2) + c(n-3)`}
        vars={[
          { id: "n", label: tx(t, "musMet_liveNc", "eighths in the bar (n)"), min: 2, max: 16, step: 1, value: 7, fmt: v => String(v) },
        ]}
        compute={countNumbers}
        where={[
          [r`c(n)`, tx(t, "musMet_wc4", "the number of groupings; up to n = 9 they are all listed")],
        ]}
        note={tx(t, "musMet_liveCountNote", "At n = 6 there are two: 2+2+2 is 3/4 and 3+3 is 6/8, the hemiola pair from the last section. At n = 8 there are four, and one of them, 3+3+2, is the next chapter's star.")} />

      <MusicOddMeterFigure t={t} />

      <H2>{tx(t, "musMet_pickTitle", "Pickups and phrases")}</H2>
      <p>
        {tx(t, "musMet_pickBody",
          "A tune does not have to start on the downbeat. \"Happy Birthday\" is in 3/4, but its first two notes, \"Hap-py\", come on the last beat of an incomplete bar, so that the stressed \"BIRTH\" lands on beat 1. Those notes before the first full bar are called a pickup, or anacrusis. In written music the last bar of the piece is usually shortened by the same amount, so that the pickup and the last bar together make one full bar.")}
      </p>
      <p>
        {tx(t, "musMet_phraseBody",
          "Meter also goes up a level. Just as beats group into bars, bars group into phrases, most often of 4 or 8 bars, with the first bar of a phrase felt as stronger. This is called hypermeter, and it is the grid of the earlier table extended upwards. It is why a dancer knows when a new section is coming, and why a song's chorus so often arrives after exactly 8 or 16 bars.")}
      </p>
      <p>
        {tx(t, "musMet_next",
          "Meter sets up an expectation: strong beats here, weak ones there. The most exciting rhythms play against that expectation, putting accents on weak beats and between beats, while the meter keeps going underneath. That is syncopation, the subject of the next chapter, and the tresillo 3 + 3 + 2 from the last widget is where it starts.")}
      </p>

      <KeyIdeas t={t} id="musMet" items={[
        "Meter is a repeating pattern of strong and weak beats; a bar runs from one strong beat, the downbeat, to the next.",
        "The metrical grid stacks pulses at several levels; a position is stronger the more levels start on it, which makes beat 3 of 4/4 medium.",
        "A bar of n beats lasts t = n × 60/BPM; bar lines mark the downbeats, and double bars and repeat signs mark sections.",
        "A time signature N/d means N notes worth 1/d of a whole note per bar; a note worth 1/v lasts b = d/v beats (chapter 6's 4/v when d = 4).",
        "Simple meters split the beat in 2 (2/4, 3/4, 4/4); compound ones split it in 3, with a dotted beat and N/3 beats per bar (6/8, 9/8, 12/8). 3/4 and 6/8 hold the same six eighths, grouped differently: the hemiola.",
        "Odd meters mix beats of 2 and 3 eighths (5/8, 7/8, 9/8); there are c(n) = c(n−2) + c(n−3) ways to group n eighths. Pickups start a tune before the first downbeat, and bars group into 4- and 8-bar phrases.",
      ]} />
    </Article>
  );
}
