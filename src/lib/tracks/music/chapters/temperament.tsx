"use client";

// Notes: equal temperament. Why pure intervals sound still (harmonics meet)
// and near misses beat (|p·f2 − q·f1| per second); tuning by pure fifths and
// the circle that does not close (Pythagorean comma, wolf fifth, wide thirds,
// syntonic comma); why 12 (n fifths ≈ m octaves, continued fractions, other
// divisions of the octave); equal temperament splits the comma, its price
// cent by cent; meantone and well temperaments; frets; stretched octaves.

import { H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { ForInstrument } from "@/components/lesson/kit/audio/useInstrument";
import { MusicBeatsFigure } from "@/components/lesson/figures/music/BeatsFigure";
import { MusicFifthsSpiralFigure } from "@/components/lesson/figures/music/FifthsSpiralFigure";
import { MusicTuningFigure } from "@/components/lesson/figures/music/TuningFigure";
import { edoNumbers, fifthsNumbers, fretNumbers } from "../live/temperament";

const r = String.raw;

export function TemperamentContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "musTem_intro",
          "The last chapter ended with a puzzle: built from pure fifths, G♯ and A♭ come out a quarter of a half step apart, yet the piano gives them one key. This chapter is the story of that key. The ear loves a few simple ratios, the octave 2 : 1, the fifth 3 : 2, the major third 5 : 4, and no set of twelve notes can have all of them pure in every key. Tuning is the art of deciding where to hide the error. The modern answer, equal temperament, hides it everywhere at once, in equal tiny pieces.")}
      </Lead>

      <Goals t={t} id="musTem" items={[
        "Explain why pure intervals sound still and nearly pure ones beat, and work out the beat rate |p·f₂ − q·f₁|.",
        "Stack pure fifths, see why twelve of them overshoot seven octaves by the Pythagorean comma, and say what a wolf fifth is.",
        "Explain why the octave has 12 notes, by finding which numbers of fifths come close to whole octaves.",
        "Say what equal temperament changes, cent by cent: fifths 2 cents narrow, major thirds 14 cents wide.",
        "Tell meantone, well temperament and equal temperament apart, and hear why old tunings had good and bad keys.",
        "Place the frets of a guitar with d = L(1 − 2^(−n/12)), and explain why a piano's octaves are stretched.",
      ]} />

      <H2>{tx(t, "musTem_pureTitle", "Why some intervals sound still")}</H2>
      <p>
        {tx(t, "musTem_pureBody",
          "Chapter 3 showed that a musical tone is not one frequency but a stack of harmonics: f, 2f, 3f, 4f… Play two tones together and the two stacks overlap. If the frequencies are in a simple ratio, many harmonics of one tone land exactly on harmonics of the other. A3 at 220 Hz and E4 at 330 Hz are in the ratio 3 : 2, and the third harmonic of A (660 Hz) is the second harmonic of E (660 Hz). The two tones share part of their sound, and the pair is heard as smooth and still: consonant.")}
      </p>
      <LessonTable
        headers={[tx(t, "musTem_tInt", "Interval"), tx(t, "musTem_tRatio", "Pure ratio"), tx(t, "musTem_tKeys", "Keys apart"), tx(t, "musTem_tMeet", "First harmonics that meet")]}
        rows={[
          [tx(t, "musTem_tOct", "octave"), "2 : 1", "12", tx(t, "musTem_tOctM", "harmonic 2 of the lower = harmonic 1 of the upper")],
          [tx(t, "musTem_tFifth", "fifth"), "3 : 2", "7", tx(t, "musTem_tFifthM", "3rd of the lower = 2nd of the upper")],
          [tx(t, "musTem_tFourth", "fourth"), "4 : 3", "5", tx(t, "musTem_tFourthM", "4th = 3rd")],
          [tx(t, "musTem_tMaj3", "major third"), "5 : 4", "4", tx(t, "musTem_tMaj3M", "5th = 4th")],
          [tx(t, "musTem_tMin3", "minor third"), "6 : 5", "3", tx(t, "musTem_tMin3M", "6th = 5th")],
        ]}
      />
      <p>
        {tx(t, "musTem_pureNames",
          "The names (fifth, third…) count letters, as chapter 13 will explain; for now, read them as \"7 keys apart\", \"4 keys apart\". The pattern in the table is the important part: for a pure ratio q : p, harmonic q of the lower tone meets harmonic p of the upper one. The smaller the numbers, the lower the meeting point and the louder the shared harmonics, which is why the octave and the fifth sound smoother than the thirds.")}
      </p>

      <H3>{tx(t, "musTem_beatsTitle", "Beats: hearing a near miss")}</H3>
      <p>
        {tx(t, "musTem_beatsBody",
          "What if the two harmonics almost meet? Two tones a few hertz apart do not sound like two tones. They merge into one tone whose loudness swells and fades, wah-wah-wah, called beats. Every tuner of pianos, guitars and orchestras listens for them, because beats are how the ear measures a near miss.")}
      </p>
      <Derivation t={t} label={tx(t, "musTem_dBeats", "Why two close tones pulse")}
        steps={[
          { tex: r`y = \sin(2\pi f_a t) + \sin(2\pi f_b t)`, why: tx(t, "musTem_b0", "two pure tones of frequencies f_a and f_b sound together: the air carries their sum (chapter 1)") },
          { tex: r`\sin A + \sin B = 2 \cos\!\left(\tfrac{A - B}{2}\right) \sin\!\left(\tfrac{A + B}{2}\right)`, why: tx(t, "musTem_b1", "a trigonometry identity (sum to product) that turns a sum of two waves into a product") },
          { tex: r`y = \underbrace{2\cos\!\big(\pi (f_a - f_b)\, t\big)}_{\text{${tx(t, "musTem_bSlow", "slow: the loudness")}}} \cdot \underbrace{\sin\!\big(2\pi \tfrac{f_a + f_b}{2}\, t\big)}_{\text{${tx(t, "musTem_bFast", "fast: the pitch")}}}`, why: tx(t, "musTem_b2", "with A = 2πf_a t and B = 2πf_b t. The second factor is a tone at the average frequency; the first changes slowly and acts as its volume") },
          { tex: r`\left|\cos(\pi \Delta\, t)\right|\ \text{${tx(t, "musTem_bRepeats", "repeats every")}}\ \tfrac{1}{\Delta}\ \text{s}, \quad \Delta = |f_a - f_b|`, why: tx(t, "musTem_b3", "the ear hears the size of the swing, not its sign. |cos| repeats every half turn, which takes 1/Δ seconds") },
          { tex: r`440\ \text{Hz} + 443\ \text{Hz} \;\Rightarrow\; \amber{3\ \text{${tx(t, "musTem_bPerSec", "beats per second")}}}`, why: tx(t, "musTem_b4", "an example: the tone swells three times a second. At 0 Hz apart the beats stop: the tones are in tune") },
        ]} />
      <p>
        {tx(t, "musTem_beatsInterval",
          "For an interval the same thing happens one floor up, between the two harmonics that should meet. In a fifth, harmonic 3 of the lower tone and harmonic 2 of the upper one should both sit at 3f₁. If the upper tone is a little off, they miss, and the whole chord beats at the size of the miss.")}
      </p>
      <Equation label={tx(t, "musTem_eqBeats", "Beat rate of a nearly pure interval")}
        where={[
          [r`b`, tx(t, "musTem_wb", "beats per second: how many times a second the sound swells")],
          [r`f_1,\ f_2`, tx(t, "musTem_wf", "the lower and the upper frequency, in hertz")],
          [r`q : p`, tx(t, "musTem_wqp", "the pure ratio the interval aims at, upper : lower, e.g. 3 : 2 for a fifth")],
          [r`p f_2,\ q f_1`, tx(t, "musTem_wpf", "the two harmonics that should meet: harmonic p of the upper tone and harmonic q of the lower one")],
        ]}
        words={tx(t, "musTem_eqBeatsWords", "Find the harmonics that should coincide, and subtract: the difference in hertz is the number of beats per second.")}>
        {r`b = \left|\, p\, f_2 - q\, f_1 \right|`}
      </Equation>

      <MusicBeatsFigure t={t} />

      <H2>{tx(t, "musTem_pythTitle", "Tuning by fifths")}</H2>
      <p>
        {tx(t, "musTem_pythBody",
          "The oldest recipe for a scale, credited to Pythagoras, uses only the two smoothest intervals: tune pure fifths, one after another, and fold every new note back into the octave by halving. C, then G a fifth up, then D a fifth above G (folded down an octave), then A, E, B… Each step is easy to tune by ear: turn the peg until the beats stop. The last chapter followed this chain to G♯ and found the trouble. Here it is in full: after twelve fifths the chain should arrive back on C, and it doesn't.")}
      </p>

      <MusicFifthsSpiralFigure t={t} />

      <p>
        {tx(t, "musTem_pythWhy",
          "The reason is arithmetic, not physics. Twelve fifths multiply the frequency by (3/2)¹² = 3¹²/2¹², and seven octaves by 2⁷. A power of 3 is always odd and a power of 2 is always even, so no number of pure fifths can ever equal a whole number of octaves. Some stacks just come closer than others. Try it: how close does each number of fifths come to a whole number of octaves?")}
      </p>
      <LiveFormula label={tx(t, "musTem_liveFifths", "Try it: n fifths against the nearest octave")}
        tex={r`n \cdot \log_2 \tfrac{3}{2} \;\approx\; m, \qquad \text{${tx(t, "musTem_liveGap", "gap")}} = 1200\,\big(n \cdot 0.58496 - m\big)\ \text{cents}`}
        vars={[
          { id: "n", label: tx(t, "musTem_liveN", "fifths (n)"), min: 1, max: 60, step: 1, value: 12, fmt: v => String(v) },
        ]}
        compute={fifthsNumbers(t)}
        where={[
          [r`n`, tx(t, "musTem_wn", "how many pure fifths are stacked")],
          [r`\log_2 \tfrac{3}{2}`, tx(t, "musTem_wlog", "the size of one pure fifth in octaves, 0.58496: 3/2 = 2^0.58496")],
          [r`m`, tx(t, "musTem_wm", "the whole number of octaves nearest to the stack")],
        ]}
        note={tx(t, "musTem_liveFifthsNote", "Most values of n miss by a lot: 5 fifths miss 3 octaves by 90 cents, 7 fifths miss 4 octaves by 114. Then 12 fifths come within 23.46 cents of 7 octaves, the Pythagorean comma. You have to go up to 41 (20 cents) and 53 (3.6 cents) to do better. Keep this list in mind: it is the answer to \"why twelve?\".")} />

      <H3>{tx(t, "musTem_wolfTitle", "The wolf")}</H3>
      <p>
        {tx(t, "musTem_wolfBody",
          "A keyboard tuned in pure fifths must still close its circle, because it only has twelve keys. So eleven fifths are tuned pure and the twelfth takes the whole comma: 701.96 − 23.46 = 678.49 cents, a fifth so out of tune that it beats furiously. Musicians called it the wolf, because it howls. Old keyboards put the wolf between G♯ and E♭, keys that the music of the time rarely needed together.")}
      </p>

      <H3>{tx(t, "musTem_thirdTitle", "The thirds go wrong too")}</H3>
      <p>
        {tx(t, "musTem_thirdBody",
          "Medieval music was built on octaves, fifths and fourths, and Pythagorean tuning served it well. But from the 1400s on, music fell in love with the major third, and the chain of fifths makes a bad one: C–G–D–A–E is four fifths, and E lands well above the pure third 5 : 4.")}
      </p>
      <Derivation t={t} label={tx(t, "musTem_dSynt", "The Pythagorean third and the syntonic comma")}
        steps={[
          { tex: r`\text{C} \to \text{G} \to \text{D} \to \text{A} \to \text{E}`, why: tx(t, "musTem_s0", "four fifths up from C reach E, two octaves and a third higher") },
          { tex: r`\left(\tfrac{3}{2}\right)^4 \div 2^2 = \frac{81}{64} = 1.2656`, why: tx(t, "musTem_s1", "four pure fifths, then divide by 2² to come down two octaves: the Pythagorean major third") },
          { tex: r`\frac{5}{4} = 1.25`, why: tx(t, "musTem_s2", "the pure major third, where harmonic 5 of C meets harmonic 4 of E") },
          { tex: r`\frac{81/64}{5/4} = \frac{81}{80}, \qquad 1200 \log_2 \tfrac{81}{80} \approx \amber{21.51\ \text{cents}}`, why: tx(t, "musTem_s3", "the gap between the two thirds has its own name: the syntonic comma. 407.82 − 386.31 = 21.51 cents. A Pythagorean third beats fast and sounds bright, even harsh") },
        ]} />
      <p>
        {tx(t, "musTem_twoCommas",
          "So pure fifths cause two problems at once: they never close the circle (Pythagorean comma, 23.46 cents) and they make wide thirds (syntonic comma, 21.51 cents). Every tuning since is a different way of paying for these two debts.")}
      </p>

      <H2>{tx(t, "musTem_whyTitle", "Why twelve notes?")}</H2>
      <p>
        {tx(t, "musTem_whyBody",
          "Turn the question around. Suppose the octave is cut into N equal steps. Which N gives a step pattern containing a good fifth? A fifth is 0.58496 of an octave, so we want some number of steps k with k/N close to 0.58496. A circle of N equal fifths closes after N fifths and k octaves, so this is the same question as the stack of fifths above, asked backwards: the good values of N are the good values of n.")}
      </p>
      <Derivation t={t} label={tx(t, "musTem_dWhy", "The best fractions for a fifth")}
        steps={[
          { tex: r`\log_2 \tfrac{3}{2} = 0.5849625\ldots`, why: tx(t, "musTem_w0", "the fifth as a fraction of the octave. It is irrational: no fraction equals it exactly (an odd power of 3 is never a power of 2)") },
          { tex: r`0.58496 = \cfrac{1}{1 + \cfrac{1}{1 + \cfrac{1}{2 + \cfrac{1}{2 + \cfrac{1}{3 + \cdots}}}}}`, why: tx(t, "musTem_w1", "a continued fraction: take the whole part, flip the rest, repeat. 1/0.58496 = 1.7095, so 1 and 0.7095; 1/0.7095 = 1.409, so 1 and 0.409; and so on") },
          { tex: r`\tfrac{1}{2},\ \tfrac{3}{5},\ \amber{\tfrac{7}{12}},\ \tfrac{24}{41},\ \tfrac{31}{53},\ \ldots`, why: tx(t, "musTem_w2", "cutting the continued fraction short gives these fractions, the convergents. Each one is closer to 0.58496 than any fraction with a smaller bottom number") },
          { tex: r`\tfrac{7}{12} = 0.58333, \quad 1200 \times \left(\tfrac{7}{12} - 0.58496\right) = -1.96\ \text{cents}`, why: tx(t, "musTem_w3", "7 steps of 12 make a fifth only 1.96 cents narrow. The fractions before it miss by 16 cents or more (3/5 and 1/2), and the next good one needs 41 steps per octave") },
        ]} />
      <LessonTable
        headers={[tx(t, "musTem_tN", "Steps per octave"), tx(t, "musTem_tFifthErr", "Best fifth, error"), tx(t, "musTem_tThirdErr", "Best major third, error"), tx(t, "musTem_tWhere", "Where it appears")]}
        rows={[
          ["5", "720 ¢, +18.0", "480 ¢, +93.7", tx(t, "musTem_tW5", "close to the slendro of Javanese gamelan, which is tuned by ear and varies")],
          ["7", "685.7 ¢, −16.2", "342.9 ¢, −43.5", tx(t, "musTem_tW7", "close to some Thai classical tunings")],
          ["12", "700 ¢, −2.0", "400 ¢, +13.7", tx(t, "musTem_tW12", "the piano, the guitar, almost all music today")],
          ["19", "694.7 ¢, −7.2", "378.9 ¢, −7.4", tx(t, "musTem_tW19", "proposed in the 1500s (Costeley); good thirds and minor thirds")],
          ["31", "696.8 ¢, −5.2", "387.1 ¢, +0.8", tx(t, "musTem_tW31", "Huygens (1691): almost exactly quarter-comma meantone; Fokker organ, Haarlem (1950)")],
          ["53", "701.9 ¢, −0.07", "384.9 ¢, −1.4", tx(t, "musTem_tW53", "known in ancient China (Jing Fang) and to Mercator; used in Turkish music theory")],
        ]}
      />
      <LiveFormula label={tx(t, "musTem_liveEdo", "Try it: cut the octave into N equal steps")}
        tex={r`\text{${tx(t, "musTem_liveStep", "step")}} = \frac{1200}{N}\ \text{cents}, \qquad k = \operatorname{round}\!\left(N \log_2 \tfrac{3}{2}\right)`}
        vars={[
          { id: "N", label: tx(t, "musTem_liveNN", "steps per octave (N)"), min: 5, max: 60, step: 1, value: 12, fmt: v => String(v) },
        ]}
        compute={edoNumbers(t)}
        where={[
          [r`N`, tx(t, "musTem_wN", "how many equal steps the octave is cut into (12 on the piano)")],
          [r`k`, tx(t, "musTem_wk", "how many steps make the best fifth: N times 0.58496, rounded. For the third, N times log₂(5/4) = 0.32193, rounded")],
        ]}
        note={tx(t, "musTem_liveEdoNote", "Green means within 5 cents of pure, amber within 15, red worse. Twelve is the smallest N whose fifth is green, and its third, at +13.7, is still amber. Try 19, 31 and 53: better thirds, but 19 to 53 keys per octave would be a much harder instrument to build and to play. Twelve is the sweet spot between small and good.")} />

      <H2>{tx(t, "musTem_etTitle", "Equal temperament: share the comma")}</H2>
      <p>
        {tx(t, "musTem_etBody",
          "Equal temperament takes the 12 steps literally: every semitone is exactly 2^(1/12), as in chapter 2, so every key is exactly 100 cents from the next. The circle closes because twelve fifths of 700 cents are exactly seven octaves. Seen from the chain of pure fifths, it pays the Pythagorean comma in twelve equal installments.")}
      </p>
      <Derivation t={t} label={tx(t, "musTem_dEt", "Splitting the comma")}
        steps={[
          { tex: r`12 \times 701.955 - 7 \times 1200 = 23.460\ \text{cents}`, why: tx(t, "musTem_e0", "twelve pure fifths overshoot seven octaves by the Pythagorean comma") },
          { tex: r`\frac{23.460}{12} = 1.955\ \text{cents}`, why: tx(t, "musTem_e1", "make every fifth narrower by the same amount, so nobody takes the whole comma: no wolf") },
          { tex: r`701.955 - 1.955 = \amber{700\ \text{cents}} = 7 \times 100`, why: tx(t, "musTem_e2", "each fifth is now exactly 7 semitones of 100 cents") },
          { tex: r`2^{7/12} = 1.49831 \quad \text{vs} \quad \tfrac{3}{2} = 1.5`, why: tx(t, "musTem_e3", "as ratios: the piano's fifth is 0.11 % short of pure, the near miss chapter 2 promised to explain") },
          { tex: r`\text{A3}\!-\!\text{E4}:\ \left|\,2 \times 329.63 - 3 \times 220\right| = \amber{0.74\ \text{${tx(t, "musTem_eBps", "beats/s")}}}`, why: tx(t, "musTem_e4", "the beat equation: one slow swell every 1.3 seconds, too slow to notice in music") },
        ]} />
      <Equation label={tx(t, "musTem_eqEt", "An equal-tempered interval")}
        where={[
          [r`k`, tx(t, "musTem_wk2", "the number of semitones (keys) in the interval: 7 for a fifth, 4 for a major third")],
          [r`\rho`, tx(t, "musTem_wrho", "the frequency ratio of the interval")],
          [r`c`, tx(t, "musTem_wc", "its size in cents: exactly 100 per semitone")],
        ]}
        words={tx(t, "musTem_eqEtWords", "Every semitone is the same ratio, so an interval of k semitones is that ratio k times: 100k cents.")}>
        {r`\rho = 2^{k/12}, \qquad c = 1200 \log_2 \rho = 100\,k`}
      </Equation>
      <p>
        {tx(t, "musTem_etPrice",
          "The fifth hardly moved. The real price is paid by the thirds and sixths, the intervals that the chain of fifths already got wrong:")}
      </p>
      <LessonTable
        headers={[tx(t, "musTem_tInt", "Interval"), tx(t, "musTem_tRatio", "Pure ratio"), tx(t, "musTem_tPureC", "Pure, cents"), tx(t, "musTem_tEtC", "Equal, cents"), tx(t, "musTem_tErr", "Error")]}
        rows={[
          [tx(t, "musTem_tOct", "octave"), "2 : 1", "1200.00", "1200", "0"],
          [tx(t, "musTem_tFifth", "fifth"), "3 : 2", "701.96", "700", "−1.96"],
          [tx(t, "musTem_tFourth", "fourth"), "4 : 3", "498.04", "500", "+1.96"],
          [tx(t, "musTem_tMaj3", "major third"), "5 : 4", "386.31", "400", "+13.69"],
          [tx(t, "musTem_tMin3", "minor third"), "6 : 5", "315.64", "300", "−15.64"],
          [tx(t, "musTem_tMaj6", "major sixth"), "5 : 3", "884.36", "900", "+15.64"],
          [tx(t, "musTem_tMin6", "minor sixth"), "8 : 5", "813.69", "800", "−13.69"],
        ]}
      />
      <p>
        {tx(t, "musTem_etThird",
          "A major third 13.7 cents wide is easy to hear in a slow chord. Middle C and E4: harmonic 4 of E is 4 × 329.63 = 1318.51 Hz and harmonic 5 of C is 5 × 261.63 = 1308.13 Hz, so the chord beats about 10 times a second. Barbershop quartets and string quartets, free to place every note, sing and play their thirds closer to pure. We stopped noticing the piano's thirds only because we grew up with them.")}
      </p>

      <H2>{tx(t, "musTem_histTitle", "Between pure and equal")}</H2>
      <p>
        {tx(t, "musTem_mtBody",
          "Equal temperament was known in theory long before it won. For about three centuries keyboards used tunings that chose differently. The most important was quarter-comma meantone (described by Pietro Aron in 1523): make the thirds pure and let the fifths pay.")}
      </p>
      <Derivation t={t} label={tx(t, "musTem_dMt", "Quarter-comma meantone: pure thirds")}
        steps={[
          { tex: r`x^4 \div 2^2 = \tfrac{5}{4}`, why: tx(t, "musTem_m0", "ask four equal fifths of ratio x (C–G–D–A–E), brought down two octaves, to give the pure third 5/4 instead of 81/64") },
          { tex: r`x = \sqrt[4]{5} = 1.49535`, why: tx(t, "musTem_m1", "multiply both sides by 4, then take the fourth root: x⁴ = 5") },
          { tex: r`1200 \log_2 1.49535 = 696.58\ \text{cents} = 701.96 - \tfrac{21.51}{4}`, why: tx(t, "musTem_m2", "each fifth is narrowed by a quarter of the syntonic comma, hence the name: the four fifths share that comma") },
          { tex: r`8400 - 11 \times 696.58 = \red{737.64\ \text{cents}}`, why: tx(t, "musTem_m3", "eleven such fifths leave a twelfth that is 35.7 cents too wide: an even worse wolf, and four keys whose thirds are 41 cents wide") },
        ]} />
      <p>
        {tx(t, "musTem_wellBody",
          "Meantone made the common keys sweeter than anything a piano can play today, and made the rare keys unusable. As composers wanted to travel further from home, organ builders invented well temperaments, like Andreas Werckmeister's (1691): every key usable, but not all equal. Keys near C had purer thirds, distant keys sharper ones, and each key had its own colour. Bach's \"Well-Tempered Clavier\" (1722), a prelude and fugue in all 24 keys, celebrates this: \"well\" tempered, not necessarily equally. Equal temperament had been computed exactly by Zhu Zaiyu in China (1584) and by Simon Stevin in Flanders (around 1605), but it took until the 1800s to become the normal way of tuning a piano.")}
      </p>

      <MusicTuningFigure t={t} />

      <LessonTable
        headers={[tx(t, "musTem_tTuning", "Tuning"), tx(t, "musTem_tFifths", "Fifths"), tx(t, "musTem_tThirds", "Major thirds"), tx(t, "musTem_tKeysOk", "Keys")]}
        rows={[
          [tx(t, "musTem_tPyth", "Pythagorean"), tx(t, "musTem_tPythF", "pure, one wolf (−23.5)"), tx(t, "musTem_tPythT", "+21.5, harsh"), tx(t, "musTem_tPythK", "fine for melody and fifths, few keys")],
          [tx(t, "musTem_tMean", "quarter-comma meantone"), tx(t, "musTem_tMeanF", "−5.4, one wolf (+35.7)"), tx(t, "musTem_tMeanT", "pure in 8 keys, +41 in 4"), tx(t, "musTem_tMeanK", "sweet near C, four keys unusable")],
          [tx(t, "musTem_tWell", "well temperament (Werckmeister III)"), tx(t, "musTem_tWellF", "8 pure, 4 at −5.9"), tx(t, "musTem_tWellT", "+3.9 to +21.5"), tx(t, "musTem_tWellK", "all usable, each a different colour")],
          [tx(t, "musTem_tEq", "equal temperament"), "−1.96", "+13.69", tx(t, "musTem_tEqK", "all identical")],
        ]}
      />

      <H2>{tx(t, "musTem_woodTitle", "Equal temperament in wood and wire")}</H2>
      <p>
        {tx(t, "musTem_fretBody",
          "A fretted instrument has equal temperament built into its neck. Chapter 3 found that a string's frequency is inversely proportional to its vibrating length (Mersenne): half the length, twice the frequency. Each fret shortens the string so that the note rises one equal semitone. Where must fret n go?")}
      </p>
      <Derivation t={t} label={tx(t, "musTem_dFret", "Placing the frets")}
        steps={[
          { tex: r`f \propto \frac{1}{\ell}`, why: tx(t, "musTem_f0", "Mersenne's law: with the same tension and string, frequency is inversely proportional to the vibrating length ℓ") },
          { tex: r`f_n = f_0 \cdot 2^{n/12} \;\Rightarrow\; \ell_n = L \cdot 2^{-n/12}`, why: tx(t, "musTem_f1", "fret n must raise the open string (length L, frequency f₀) by n equal semitones, so the length shrinks by the same factor") },
          { tex: r`d_n = L - \ell_n = L\left(1 - 2^{-n/12}\right)`, why: tx(t, "musTem_f2", "the fret sits where the vibrating part ends, measured from the nut") },
          { tex: r`d_{12} = L\,(1 - \tfrac{1}{2}) = \tfrac{L}{2}`, why: tx(t, "musTem_f3", "the 12th fret, the octave, is exactly in the middle of the string") },
          { tex: r`\frac{d_1}{L} = 1 - 2^{-1/12} = \frac{1}{17.817}`, why: tx(t, "musTem_f4", "the first fret takes 1/17.817 of the string. Luthiers long used the \"rule of 18\": each fret one eighteenth of the remaining length, which comes out slightly flat") },
        ]} />
      <LiveFormula label={tx(t, "musTem_liveFret", "Try it: where does fret n go?")}
        tex={r`d_n = L\left(1 - 2^{-n/12}\right)`}
        vars={[
          { id: "L", label: tx(t, "musTem_liveL", "scale length L (mm)"), min: 550, max: 700, step: 1, value: 650, fmt: v => `${v} mm` },
          { id: "n", label: tx(t, "musTem_liveFretN", "fret (n)"), min: 1, max: 19, step: 1, value: 12, fmt: v => String(v) },
        ]}
        compute={fretNumbers(t)}
        where={[
          [r`d_n`, tx(t, "musTem_wd", "distance from the nut to fret n")],
          [r`L`, tx(t, "musTem_wL", "the scale length: nut to bridge saddle, about 650 mm on a classical guitar")],
          [r`n`, tx(t, "musTem_wnf", "the fret number, one equal semitone each")],
        ]}
        note={tx(t, "musTem_liveFretNote", "The gaps shrink as you go up, each one 2^(−1/12) ≈ 0.944 times the one before: on a 650 mm scale, 36.5 mm for the first fret and 19.3 mm for the twelfth. Every guitar, lute and mandolin fretted this way plays in equal temperament, whatever music it plays.")} />

      <ForInstrument only="guitar">
        <H3>{tx(t, "musTem_gtTitle", "On the guitar: why tuning by harmonics drifts")}</H3>
        <p>
          {tx(t, "musTem_gtBody",
            "A popular way to tune a guitar compares harmonics: the light touch at the 5th fret of one string (harmonic 4) against the 7th fret of the next (harmonic 3), and you turn the peg until the beats stop. That makes each pair of strings a pure fourth, 498.04 cents, but the frets give an equal fourth, 500 cents. Every string tuned this way ends up 1.96 cents flat of where the frets expect it, and the errors pile up across the strings. The G–B pair is worse: it is a major third, and matching harmonic 5 of G with harmonic 4 of B makes it pure, 13.7 cents narrower than the frets'. That is why chords can sound sour after a careful tuning by harmonics. Use them to check, but tune with fretted unisons or an electronic tuner, which aim at equal temperament.")}
        </p>
      </ForInstrument>
      <ForInstrument only="piano">
        <H3>{tx(t, "musTem_pnTitle", "On the piano: tuning by counting beats")}</H3>
        <p>
          {tx(t, "musTem_pnBody",
            "A piano tuner does not measure cents; they count beats. First they set the octave in the middle of the keyboard, the temperament octave: each fifth is made slightly narrow until it beats a little under once a second, each third wide until it beats about 7 to 10 times a second, faster as the thirds go up. Then every other string is tuned by octaves and unisons from that octave, until the beats stop. The beat equation of this chapter is exactly what their ears compute.")}
        </p>
      </ForInstrument>

      <H3>{tx(t, "musTem_stretchTitle", "Real strings stretch the octave")}</H3>
      <p>
        {tx(t, "musTem_stretchBody",
          "One last twist. A real piano string is stiff steel, not the ideal string of chapter 3, and stiffness pushes its harmonics slightly sharp: harmonic 2 is a little more than 2f. A tuner who makes an octave beat-free matches the upper note to that sharp harmonic, so the octave comes out slightly wider than 2 : 1. Repeated across the keyboard, the top notes end up some 30 cents above the equal-tempered numbers and the bottom ones as much below: a stretched tuning (the Railsback curve). It sounds right precisely because it follows the strings' own harmonics. Equal temperament is the plan; real instruments bend it to their physics.")}
      </p>

      <p>
        {tx(t, "musTem_next",
          "Fifths, fourths, thirds: this chapter used their names before explaining them, counting only keys and cents. The next chapter, Intervals, names them properly: why a fifth is \"five\" when it spans seven keys, what makes a third major or minor, and why the two kinds of semitone of chapter 11 now matter.")}
      </p>

      <KeyIdeas t={t} id="musTem" items={[
        "In a pure interval q : p, harmonic q of the lower tone meets harmonic p of the upper; if they miss, the sound beats |p·f₂ − q·f₁| times a second.",
        "Pure fifths never close the circle: 12 fifths overshoot 7 octaves by the Pythagorean comma (23.46 ¢), and four fifths give a third 21.51 ¢ too wide (the syntonic comma).",
        "Twelve notes win because 7/12 is the best small fraction for the fifth (0.58496 of an octave): 12 fifths almost equal 7 octaves. The next good choices are 41 and 53.",
        "Equal temperament makes every semitone 2^(1/12): fifths 1.96 ¢ narrow (barely heard), major thirds 13.69 ¢ wide (the real price), every key the same.",
        "Meantone kept pure thirds and a wolf; well temperaments made every key usable with its own colour; equal temperament became the standard in the 1800s.",
        "Frets sit at d = L(1 − 2^(−n/12)), the 12th in the middle; stiff piano strings stretch the octaves wider than 2 : 1.",
      ]} />
    </Article>
  );
}
