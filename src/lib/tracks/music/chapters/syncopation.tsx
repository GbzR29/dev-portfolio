"use client";

// Rhythm: syncopation — notes that start on weak positions and leave the
// strong ones silent, against a meter that keeps going. Why it makes people
// move (the inverted U), how to score it with the metrical grid (Longuet-
// Higgins & Lee), its kinds, the backbeat as accent syncopation, and the
// tresillo family explained as Euclidean rhythms: k notes over n pulses with
// gaps from n = k·q + r.

import { H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { MusicSyncopationFigure } from "@/components/lesson/figures/music/SyncopationFigure";
import { MusicBackbeatFigure } from "@/components/lesson/figures/music/BackbeatFigure";
import { MusicEuclidFigure } from "@/components/lesson/figures/music/EuclidFigure";
import { euclidNumbers, noteScore, posName } from "../live/syncopation";

const r = String.raw;

export function SyncopationContent({ t }: { t: TrackTranslations }) {
  const pos = posName(t);
  return (
    <Article>
      <Lead>
        {tx(t, "musSyn_intro",
          "Chapter 7 built an expectation: strong beats here, weak beats there, repeating bar after bar. Now break it on purpose. Start a note just before the beat and hold it through, leave beat 1 empty, put the loudest sound on the weak beats. The meter does not disappear; the listener keeps feeling it, and the music pulls against it. That pull is syncopation, and it is what makes samba, funk, reggae and most pop music make you want to move.")}
      </Lead>

      <Goals t={t} id="musSyn" items={[
        "Explain syncopation as a note that starts on a weak position while a stronger one stays silent, and why it makes people move.",
        "Score how syncopated a rhythm is with the metrical grid, note by note.",
        "Tell apart the kinds: anticipation, offbeats, the missing downbeat, and the backbeat, which syncopates by accent.",
        "Recognize the tresillo, the cinquillo and the clave, and where they are heard.",
        "Spread k notes over n pulses as evenly as possible and derive the gaps from n = k·q + r.",
      ]} />

      <H2>{tx(t, "musSyn_whatTitle", "What syncopation is")}</H2>
      <p>
        {tx(t, "musSyn_whatBody",
          "Count \"1 & 2 & 3 & 4 &\" steadily and clap on 1, on 2, on the \"&\" after 2, and on 4. The third clap comes half a beat early, and nothing new happens on 3: the strong beat you were waiting for arrives in silence, because its sound was already played. That is a syncopation. In general, a note is syncopated when it starts on a weak position and no new note starts on the stronger position that follows, so the stress of the strong position moves back onto the weak one. Whether the note is held through the strong beat (tied, as in chapter 6) or followed by a rest makes no difference: what counts is where notes start.")}
      </p>
      <p>
        {tx(t, "musSyn_whatWord",
          "The word comes from the Greek synkopē, \"cutting short\". Grammar uses it for a sound dropped from the middle of a word, as in \"choc'late\" for \"chocolate\"; medicine for fainting, when the blood flow is cut for a moment. In music the cut is the strong beat that does not get its note.")}
      </p>
      <p>
        {tx(t, "musSyn_whyMove",
          "Why does it feel good? The brain predicts where the next beat will land (chapter 5) and checks every note against the prediction. A syncopated note is a small surprise, a gap the body wants to fill, often by moving on the missing beat. Too little surprise is dull, too much and the meter is lost. In 2014 a team led by Maria Witek played 50 drum grooves to listeners and asked how much each one made them want to move and how much they enjoyed it. Both peaked in the middle: grooves with a medium amount of syncopation beat both the plain and the very syncopated ones, an inverted U. To find that middle, you need a way to measure syncopation.")}
      </p>

      <H2>{tx(t, "musSyn_measureTitle", "Measuring syncopation with the metrical grid")}</H2>
      <p>
        {tx(t, "musSyn_measureBody",
          "Chapter 7 gave every position in a bar a strength: the number of pulse levels that start there. Going one level finer, to sixteenth notes, a 4/4 bar has 16 positions, counted \"1 e & a 2 e & a…\", and five levels (bar, half bar, beat, eighth, sixteenth). Beat 1 starts all five, beat 3 four, beats 2 and 4 three, the \"&\"s two and the \"e\"s and \"a\"s only one:")}
      </p>
      <LessonTable
        headers={[tx(t, "musSyn_tPos", "position"), ...Array.from({ length: 16 }, (_, p) => pos(p))]}
        rows={[[tx(t, "musSyn_tWeight", "weight w"), "5", "1", "2", "1", "3", "1", "2", "1", "4", "1", "2", "1", "3", "1", "2", "1"]]}
      />
      <p>
        {tx(t, "musSyn_measureLHL",
          "In 1984 Christopher Longuet-Higgins and Christopher Lee turned the idea of a \"missing strong beat\" into a number. Take each note in turn and look at the stretch of silence after it, up to the next note. If that silence covers a position heavier than the note's own, the note is syncopated, and the bigger the difference, the stronger the syncopation.")}
      </p>
      <Derivation t={t} label={tx(t, "musSyn_dTitle", "The syncopation score of a rhythm")}
        steps={[
          { tex: r`w(p) = 1 + \#\{\text{${tx(t, "musSyn_dLevels", "slower levels that start at p")}}\}`, why: tx(t, "musSyn_d0", "every position gets its weight from the grid: 5 on beat 1 down to 1 on the \"e\"s and \"a\"s") },
          { tex: r`p \;\to\; p'`, why: tx(t, "musSyn_d1", "take a note that starts at position p; the next note starts at p'. In between, no note starts, whether the first note is held or a rest follows") },
          { tex: r`w_{\max} = \max_{p < q < p'} w(q)`, why: tx(t, "musSyn_d2", "find the heaviest position inside that silence. If the gap is empty (p' comes right after p), there is none and the note cannot be syncopated") },
          { tex: r`s = w_{\max} - w(p) \quad \text{${tx(t, "musSyn_dIf", "if")}}\ w_{\max} > w(p)`, why: tx(t, "musSyn_d3", "if the silence swallows a stronger position, the note took that position's stress: score the difference in weight. Starting on an \"e\" (1) and skipping beat 3 (4) scores 3; starting on beat 2 (3) and skipping beat 3 scores only 1") },
          { tex: r`s = \max\bigl(0,\ w_{\max} - w(p)\bigr)`, why: tx(t, "musSyn_d4", "otherwise the note is on a position at least as strong as anything it skips, and scores 0. The max with 0 says both cases at once") },
          { tex: r`S = \amber{\textstyle\sum_{\text{${tx(t, "musSyn_dNotes", "notes")}}} s}`, why: tx(t, "musSyn_d5", "add the scores of all the notes in the bar. When the bar loops, the silence after the last note runs on into the next bar, up to the first note there") },
        ]} />
      <Equation label={tx(t, "musSyn_eqS", "Syncopation of a bar")}
        where={[
          [r`S`, tx(t, "musSyn_wS", "the syncopation of the whole bar: 0 for a rhythm with every note on a strong position")],
          [r`w(p)`, tx(t, "musSyn_wwp", "the weight of the position where the note starts, from the metrical grid")],
          [r`w(q)`, tx(t, "musSyn_wwq", "the weight of a position q inside the silence after the note, before the next note starts at p'")],
          [r`\max(0,\ \dots)`, tx(t, "musSyn_wmax", "only a silence heavier than the note counts; anything else adds 0")],
        ]}
        words={tx(t, "musSyn_eqWords", "For each note, how much stronger is the strongest silent position it skips? Add it up.")}>
        {r`S = \sum_{\text{${tx(t, "musSyn_dNotes", "notes")}}} \max\Bigl(0,\ \max_{p < q < p'} w(q) - w(p)\Bigr)`}
      </Equation>
      <p>
        {tx(t, "musSyn_example",
          "Four notes on the four beats score S = 0: every silence is lighter than the note before it. The tresillo plays on 1, on the \"&\" of 2 and on 4 (positions 1, 2& and 4 in the table). The note on 2& (weight 2) is followed by silence over beat 3 (weight 4), so it scores 4 − 2 = 2; the other two notes skip only lighter positions. S = 2: one clear syncopation in the bar. Notes only on the \"&\"s score 1 + 2 + 1 + 3 = 7, the last one skipping the next bar's downbeat.")}
      </p>
      <LiveFormula label={tx(t, "musSyn_liveNote", "Try it: score one note")}
        tex={r`s = \max\bigl(0,\ w_{\max} - w(p)\bigr)`}
        vars={[
          { id: "p", label: tx(t, "musSyn_liveP", "the note starts on"), min: 0, max: 15, step: 1, value: 6, fmt: v => pos(v) },
          { id: "len", label: tx(t, "musSyn_liveLen", "next note after (sixteenths)"), min: 1, max: 16, step: 1, value: 6, fmt: v => String(v) },
        ]}
        compute={noteScore(t)}
        where={[
          [r`w_{\max}`, tx(t, "musSyn_wwmax", "the heaviest position in the silence; the list shows the weight of every silent position")],
        ]}
        note={tx(t, "musSyn_liveNoteNote", "Start a note on 2& and slide the next note further away: as soon as the silence reaches beat 3, the score jumps to 2. Then move the note to beat 2 itself: the same silence scores only 1. On beat 1, nothing can be heavier, so no silence makes it syncopated.")} />

      <MusicSyncopationFigure t={t} />

      <H2>{tx(t, "musSyn_kindsTitle", "Kinds of syncopation")}</H2>
      <p>
        {tx(t, "musSyn_kindsBody",
          "Syncopations come in a few familiar shapes. Each is a different way of leaving a strong position without a new note, or of making the weak positions the loud ones:")}
      </p>
      <LessonTable
        headers={[tx(t, "musSyn_kName", "Kind"), tx(t, "musSyn_kWhat", "What happens"), tx(t, "musSyn_kWhere", "Heard in")]}
        rows={[
          [tx(t, "musSyn_kAnt", "anticipation (push)"), tx(t, "musSyn_kAntW", "a note arrives half a beat or a sixteenth early and holds through the beat it belongs to"), tx(t, "musSyn_kAntH", "pop vocals, chord changes in funk, jazz and Latin music")],
          [tx(t, "musSyn_kOff", "offbeats"), tx(t, "musSyn_kOffW", "notes only on the \"&\"s, the beats left empty"), tx(t, "musSyn_kOffH", "the guitar \"skank\" of ska and reggae, the open hi-hat of disco")],
          [tx(t, "musSyn_kMiss", "missing downbeat"), tx(t, "musSyn_kMissW", "beat 1 itself has no new note"), tx(t, "musSyn_kMissH", "the reggae one drop, phrases that start just after the 1")],
          [tx(t, "musSyn_kChar", "\"characteristic syncopation\""), tx(t, "musSyn_kCharW", "sixteenth, eighth, sixteenth inside one beat: the middle note starts on the \"e\" and skips the \"&\""), tx(t, "musSyn_kCharH", "Brazilian maxixe, choro and samba")],
          [tx(t, "musSyn_kAcc", "accent syncopation"), tx(t, "musSyn_kAccW", "no note moves, but the weak beats are played louder than the strong ones"), tx(t, "musSyn_kAccH", "the rock and pop backbeat (snare on 2 and 4)")],
        ]}
      />
      <p>
        {tx(t, "musSyn_kindsAfter",
          "The opposite also exists. Funk, as James Brown shaped it in the 1960s, syncopates almost everything except beat 1, which the whole band hits together: \"on the one\". The heavier the syncopation around it, the more that shared downbeat feels like landing.")}
      </p>

      <H2>{tx(t, "musSyn_backTitle", "The backbeat")}</H2>
      <p>
        {tx(t, "musSyn_backBody",
          "In almost every rock, pop, soul and hip hop song, the kick drum plays on beats 1 and 3 and the snare, much louder and sharper, on 2 and 4. Those weak beats become the loudest sounds in the bar: this is the backbeat. Grown in African-American gospel, where congregations clap on 2 and 4, and in the rhythm and blues of the 1940s, it became the engine of rock and roll in the 1950s and has never left.")}
      </p>
      <p>
        {tx(t, "musSyn_backScore",
          "The score of the last section cannot see it. It only looks at where notes start, and with the kick on 1 and 3 every strong beat has its note, so S = 0. The backbeat syncopates by accent instead, by how loud the notes are. (Played alone, the snare on 2 and 4 does score: 1 for skipping beat 3 and 2 for skipping the next downbeat. Without the kick, the ear can even hear the snare as beats 1 and 3, the meter turned around.) This is why audiences who clap on 1 and 3 sound wrong at a rock concert: their claps line up with the kick, the meter's strong beats, and fight the groove's accents.")}
      </p>

      <MusicBackbeatFigure t={t} />

      <H2>{tx(t, "musSyn_tresTitle", "The tresillo and the clave")}</H2>
      <p>
        {tx(t, "musSyn_tresBody",
          "The most travelled rhythm in the world fits in one bar of eight eighths: 3 + 3 + 2, notes on 1, on the \"&\" of 2, and on 4. Cuban musicians call it the tresillo. It came to the Americas from West and Central Africa, and spread from Cuba through the whole continent: in the habanera and the tango, in New Orleans rhythm and blues of the 1950s, in the bass lines of countless pop songs, and today as the dembow of reggaeton, where the snare plays it over a steady kick. Add notes between and around it and you get its relatives: the cinquillo (2 + 1 + 2 + 1 + 2), and the son clave, 3 + 3 + 4 + 2 + 4 over two bars, the pattern that holds a whole Cuban band together. In Brazil, the ethnomusicologist Carlos Sandroni showed in 2001 how samba moved from the \"tresillo paradigm\" to a longer 16-pulse pattern around 1930, the \"Estácio paradigm\" named after the Rio neighbourhood where the first samba schools began.")}
      </p>

      <H3>{tx(t, "musSyn_euTitle", "Why 3 + 3 + 2? Spreading notes evenly")}</H3>
      <p>
        {tx(t, "musSyn_euBody",
          "Here is a way to see the tresillo. Take a loop of 8 pulses and place 3 notes as evenly as you can. Perfectly even would be 8/3 ≈ 2.67 pulses apart, but notes must sit on pulses, so the gaps have to be whole numbers close to 2.67: some 3s and some 2s. In 2005 the computer scientist Godfried Toussaint noticed that this simple rule, \"spread k notes over n pulses as evenly as possible\", produces dozens of traditional rhythms from all over the world. He called them Euclidean rhythms, because the steps that build them are the same as in Euclid's algorithm for the greatest common divisor (an engineer, Eric Bjorklund, had used the same procedure to time the pulses of a particle accelerator).")}
      </p>
      <Derivation t={t} label={tx(t, "musSyn_deTitle", "The gaps of k notes spread over n pulses")}
        steps={[
          { tex: r`\frac{n}{k}`, why: tx(t, "musSyn_de0", "the perfectly even gap: n pulses shared among k notes. For 3 notes in 8 pulses, 8/3 ≈ 2.67, not a whole number") },
          { tex: r`n = k \cdot q + r, \qquad q = \left\lfloor \frac{n}{k} \right\rfloor,\ 0 \le r < k`, why: tx(t, "musSyn_de1", "divide with remainder, as in primary school: q is the whole part of n/k and r what is left over. 8 = 3 × 2 + 2") },
          { tex: r`\text{${tx(t, "musSyn_deGap", "each gap")}} = q\ \ \text{${tx(t, "musSyn_deOr", "or")}}\ \ q + 1`, why: tx(t, "musSyn_de2", "the most even choice uses only the two whole numbers on either side of n/k. A gap of q − 1 or q + 2 would sit further from n/k than necessary") },
          { tex: r`x(q+1) + (k - x)\,q = n`, why: tx(t, "musSyn_de3", "call x the number of long gaps (q + 1); the other k − x are short (q). Going once round the loop, the gaps add up to n") },
          { tex: r`kq + x = n \;\Rightarrow\; \amber{x = r}`, why: tx(t, "musSyn_de4", "expand: xq + x + kq − xq = kq + x. Compare with n = kq + r: the number of long gaps is exactly the remainder") },
          { tex: r`8 = 3 \times 2 + 2 \;\Rightarrow\; 3 + 3 + 2`, why: tx(t, "musSyn_de5", "two long gaps of 3 and one short gap of 2: the tresillo. 5 notes in 8: 8 = 5 × 1 + 3, three 2s and two 1s, the cinquillo 2 + 1 + 2 + 1 + 2") },
        ]} />
      <p>
        {tx(t, "musSyn_euRule",
          "One question is left: in which order do the long and short gaps go? Spread them evenly too. A neat rule does it all at once: walk round the loop adding k at every pulse, and play a note every time the running total passes a multiple of n. In symbols, pulse p gets a note when p·k mod n < k (mod is the remainder of the division). It is the same rule a computer uses to draw a slanted line on a grid of pixels, deciding at each column whether the line steps up a row: a straight line, as even as the grid allows.")}
      </p>
      <Equation label={tx(t, "musSyn_eqEu", "Euclidean rhythm E(k, n)")}
        where={[
          [r`n`, tx(t, "musSyn_wn", "the pulses in the loop: 8 eighths, 12 in 12/8, 16 sixteenths")],
          [r`k`, tx(t, "musSyn_wk", "the notes to place")],
          [r`q`, tx(t, "musSyn_wq", "the short gap, n/k rounded down")],
          [r`r`, tx(t, "musSyn_wr", "the remainder: how many gaps are one pulse longer")],
        ]}
        words={tx(t, "musSyn_euWords", "r gaps of q + 1 and k − r gaps of q; pulse p plays when p·k mod n is less than k.")}>
        {r`n = k \cdot q + r \quad\Rightarrow\quad r \times (q + 1)\ +\ (k - r) \times q, \qquad p\ \text{${tx(t, "musSyn_euPlays", "plays if")}}\ \ p k \bmod n < k`}
      </Equation>
      <LiveFormula label={tx(t, "musSyn_liveEu", "Try it: spread k notes over n pulses")}
        tex={r`n = k \cdot q + r`}
        vars={[
          { id: "n", label: tx(t, "musSyn_liveN", "pulses (n)"), min: 2, max: 16, step: 1, value: 8, fmt: v => String(v) },
          { id: "k", label: tx(t, "musSyn_liveK", "notes (k)"), min: 1, max: 16, step: 1, value: 3, fmt: v => String(v) },
        ]}
        compute={euclidNumbers}
        where={[
          [r`\times`, tx(t, "musSyn_wx", "in the last line, a note; the dots are the silent pulses, from pulse 0")],
        ]}
        note={tx(t, "musSyn_liveEuNote", "3 in 8 is the tresillo and 5 in 8 the cinquillo. 2 in 5 gives 3 + 2, Take Five's bar; 3 in 7 gives the 2s and 3s of the Balkan 7/8 from chapter 7. 4 in 16 has no remainder: four equal gaps, the four beats of 4/4, and no syncopation at all.")} />
      <p>
        {tx(t, "musSyn_euSync",
          "This also explains why these rhythms are syncopated. A loop of 8 eighths has its beats every 2 pulses. Spread 3 notes evenly and they cannot all fit on beats, because 8 is not a multiple of 3: some notes must land between beats and skip the beat after them. The evenness that makes the tresillo sound balanced is exactly what makes it fight the meter.")}
      </p>

      <MusicEuclidFigure t={t} />

      <p>
        {tx(t, "musSyn_next",
          "This closes the rhythm section: pulse and tempo, durations, meter, and the syncopation that plays against it. The next section turns to the notes themselves: their names, the keys of the piano and why they come in a pattern of 7 white and 5 black. That pattern is already in the last widget: spread 7 notes over 12 pulses and you get the West African bell, gaps 2 2 1 2 2 2 1. Keep it in mind; it will come back as the major scale.")}
      </p>

      <KeyIdeas t={t} id="musSyn" items={[
        "A note is syncopated when it starts on a weak position and the stronger position after it gets no new note; held or followed by a rest makes no difference.",
        "Syncopation is a small broken prediction; medium amounts make people want to move the most (the inverted U of Witek et al., 2014).",
        "Score it with the metrical grid: each note scores s = max(0, w_max − w(p)), the strongest skipped position minus its own; the bar's syncopation S is the sum.",
        "Kinds: anticipation, offbeats, the missing downbeat, the Brazilian sixteenth–eighth–sixteenth; the backbeat syncopates by accent (loud on 2 and 4), which onset scores cannot see.",
        "The tresillo 3 + 3 + 2 travelled from Africa through Cuba to the whole world; the cinquillo and the clave grow from it.",
        "Euclidean rhythms spread k notes over n pulses: n = kq + r gives r gaps of q + 1 and k − r of q; when k does not divide n, some notes must fall between beats.",
      ]} />
    </Article>
  );
}
