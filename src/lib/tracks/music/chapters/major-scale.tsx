"use client";

// Scales: the major scale. The pattern 2 2 1 2 2 2 1 as whole and half steps;
// degrees and their names; building it on any tonic, m_k = m_1 + M(k), one
// letter per degree; why "major" (every interval from the tonic is major or
// perfect); tetrachords and why each fifth up adds one sharp; the scale as 7
// neighbours on the line of fifths (letter 4q mod 7, sign ⌊(q + 1)/7⌋); key
// signatures and their order; enharmonic keys; transposition; the scale under
// the hand on piano and guitar.

import { H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { ForInstrument } from "@/components/lesson/kit/audio/useInstrument";
import { spelledName } from "@/components/lesson/figures/music/accidentals";
import { tonicOf } from "@/components/lesson/figures/music/scales";
import { MusicScaleBuilderFigure } from "@/components/lesson/figures/music/ScaleBuilderFigure";
import { MusicKeysFigure } from "@/components/lesson/figures/music/KeysFigure";
import { MusicScaleQuizFigure } from "@/components/lesson/figures/music/ScaleQuizFigure";
import { degreeNumbers } from "../live/major-scale";

const r = String.raw;

export function MajorScaleContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "musMaj_intro",
          "Play the white keys from C to C and you hear a sound everyone knows: do re mi fa sol la si do. That is the major scale, the backbone of most of the music you have heard, from nursery rhymes to symphonies to pop songs. This chapter takes it apart: the pattern of whole and half steps that makes it, why the same pattern can start on any key, why every major scale uses each letter once, and how that one rule produces all the sharps and flats of the key signatures.")}
      </Lead>

      <Goals t={t} id="musMaj" items={[
        "Describe the major scale as the step pattern whole, whole, half, whole, whole, whole, half, and name its seven degrees.",
        "Build the major scale on any of the 15 tonics, spelled with each letter once, also with m_k = m₁ + M(k).",
        "Explain the name \"major\": every interval from the tonic to a degree is major or perfect.",
        "Explain why going up a fifth adds one sharp and going down a fifth adds one flat, using tetrachords and the line of fifths.",
        "Read and write key signatures, in the fixed order of sharps (F C G D A E B) and flats (B E A D G C F), and find the key of a signature.",
        "Transpose a melody to another key, and play a one-octave major scale on your instrument.",
      ]} />

      <H2>{tx(t, "musMaj_patternTitle", "A pattern of steps")}</H2>
      <p>
        {tx(t, "musMaj_patternBody",
          "A scale is a set of notes in order of pitch, from one note to its octave. Chapter 9 counted the gaps between the white keys from C: 2 2 1 2 2 2 1 half steps. Chapter 13 gave those gaps names: a gap of 2 is a major second, a whole step; a gap of 1 a minor second, a half step. So the major scale is the pattern whole, whole, half, whole, whole, whole, half. The two half steps sit between degrees 3 and 4 and between 7 and 8, and they shape the whole sound of the scale.")}
      </p>
      <LessonTable
        headers={[tx(t, "musMaj_tDeg", "Degree"), tx(t, "musMaj_tInC", "In C"), tx(t, "musMaj_tName", "Name"), tx(t, "musMaj_tSolfa", "Movable do"), tx(t, "musMaj_tRole", "What it does")]}
        rows={[
          ["1", "C", tx(t, "musMaj_n1", "tonic"), "do", tx(t, "musMaj_r1", "home: where melodies end and feel at rest")],
          ["2", "D", tx(t, "musMaj_n2", "supertonic"), "re", tx(t, "musMaj_r2", "a step above home, usually passing")],
          ["3", "E", tx(t, "musMaj_n3", "mediant"), "mi", tx(t, "musMaj_r3", "halfway to the dominant; its major third gives the scale its bright colour")],
          ["4", "F", tx(t, "musMaj_n4", "subdominant"), "fa", tx(t, "musMaj_r4", "a half step above 3, tends to fall back to it")],
          ["5", "G", tx(t, "musMaj_n5", "dominant"), "sol", tx(t, "musMaj_r5", "the strongest note after the tonic, a fifth above it")],
          ["6", "A", tx(t, "musMaj_n6", "submediant"), "la", tx(t, "musMaj_r6", "halfway down from tonic to subdominant")],
          ["7", "B", tx(t, "musMaj_n7", "leading tone"), tx(t, "musMaj_tTi", "si (ti)"), tx(t, "musMaj_r7", "a half step below the tonic: it leans up into it")],
        ]}
      />
      <p>
        {tx(t, "musMaj_movable",
          "The column \"movable do\" uses the syllables of chapter 9 for degrees, not for letters: in any major key the tonic is do, the second re, and so on. Singers learn melodies this way because the syllables then say how each note relates to home, whatever the key. The song \"Do-Re-Mi\" from The Sound of Music teaches exactly this. Where do is always C (fixed do, as in Brazil and much of Europe), musicians simply say \"degree 3\" instead.")}
      </p>

      <H2>{tx(t, "musMaj_buildTitle", "The same pattern from any note")}</H2>
      <p>
        {tx(t, "musMaj_buildBody",
          "Because the pattern is a list of steps, it can start on any key, and it will always sound like a major scale, only higher or lower: the ear hears the steps, not the starting point. Start on G: whole step to A, whole to B, half to C, whole to D, whole to E, whole to F♯ (F would be only a half step above E), half to G. One black key is needed, F♯, and it is needed by the pattern itself.")}
      </p>
      <Derivation t={t} label={tx(t, "musMaj_dBuild", "The notes of the major scale on any tonic")}
        steps={[
          { tex: r`M(k) = 0,\ 2,\ 4,\ 5,\ 7,\ 9,\ 11`, why: tx(t, "musMaj_b0", "add up the steps 2 2 1 2 2 2 from the tonic: the half steps from degree 1 to degree k, for k = 1…7 (and 12 for the octave)") },
          { tex: r`m_k = m_1 + M(k)`, why: tx(t, "musMaj_b1", "the key of degree k is the tonic's key number (chapter 9) plus that many half steps") },
          { tex: r`\ell_k = \ell_1 + (k - 1)`, why: tx(t, "musMaj_b2", "the letter of degree k: one letter per degree, counting up from the tonic's letter (wrapping G → A)") },
          { tex: r`a_k = m_k - m_{\text{${tx(t, "musMaj_bWhite", "white")}}}(\ell_k)`, why: tx(t, "musMaj_b3", "the sign is whatever it takes to move that letter's white key onto key m_k (chapter 11: a = +1 sharp, −1 flat)") },
          { tex: r`\text{D: } k = 3:\ m = 62 + 4 = 66,\ \ \ell = \text{F},\ \ a = 66 - 65 = +1 \;\Rightarrow\; \amber{\text{F}{\sharp}}`, why: tx(t, "musMaj_b4", "an example: the third degree of D major is F♯, not G♭, because degree 3 must use the third letter from D") },
        ]} />

      <MusicScaleBuilderFigure t={t} />

      <H3>{tx(t, "musMaj_lettersTitle", "Why each letter once")}</H3>
      <p>
        {tx(t, "musMaj_lettersBody",
          "Why insist on one letter per degree, when F major could just as well be written with A♯ instead of B♭? Three reasons. On the staff, one letter per degree means one line or space per degree: the scale climbs evenly, and a melody looks like its shape. Each key then needs only one kind of sign, all sharps or all flats, which is what makes a key signature possible. And the names keep the intervals honest: from F, B♭ is a perfect fourth, the interval degree 4 always makes, while A♯ would be an augmented third, a name that says something false about how the note behaves.")}
      </p>

      <H2>{tx(t, "musMaj_whyTitle", "Why it is called major")}</H2>
      <p>
        {tx(t, "musMaj_whyBody",
          "Measure every degree from the tonic, with chapter 13's names: C–D a major second, C–E a major third, C–F a perfect fourth, C–G a perfect fifth, C–A a major sixth, C–B a major seventh, C–C a perfect octave. Every one is major or perfect. That is the meaning of the name: the major scale is the scale of the major intervals above its tonic. It also explains chapter 13's reference: \"from C to a white key\" was really \"from the tonic of a major scale\". The most important of these is the third: the major third between degrees 1 and 3 gives the scale its bright colour, and the next chapter's minor scale is above all the scale with a minor third.")}
      </p>

      <H2>{tx(t, "musMaj_tetraTitle", "Two halves and the next key")}</H2>
      <p>
        {tx(t, "musMaj_tetraBody",
          "Split the major scale in the middle: C D E F and G A B C. Each half is four notes with the steps whole, whole, half, called a tetrachord (Greek for \"four strings\"), and a whole step joins them. The two halves are identical in shape, and this explains how the keys are related.")}
      </p>
      <Derivation t={t} label={tx(t, "musMaj_dTetra", "Why one fifth up adds one sharp")}
        steps={[
          { tex: r`\underbrace{\text{C D E F}}_{2\,2\,1}\ \overset{2}{}\ \underbrace{\text{G A B C}}_{2\,2\,1}`, why: tx(t, "musMaj_t0", "C major: two tetrachords of the same shape, joined by a whole step (F to G)") },
          { tex: r`\underbrace{\text{G A B C}}_{2\,2\,1}\ \overset{2}{}\ \underbrace{\text{D E F G}}_{2\,\red{1\,2}}`, why: tx(t, "musMaj_t1", "a scale on G can reuse C's upper half as its lower half. Its upper half starts on D, a whole step above C, and must again be whole, whole, half; but D E F G is whole, half, whole: E to F is only a half step") },
          { tex: r`\text{D E}\ \amber{\text{F}{\sharp}}\ \text{G}: \ 2\,2\,1 \checkmark`, why: tx(t, "musMaj_t2", "raising F to F♯ fixes it. One new sharp, on the new seventh degree, the leading tone of G") },
          { tex: r`\text{C} \to \text{G} \to \text{D} \to \ldots: \ +1\ {\sharp}\ \text{${tx(t, "musMaj_tEach", "each time")}}`, why: tx(t, "musMaj_t3", "repeat: the scale on D reuses G's upper half and needs C♯. Each key a fifth higher keeps every sign and adds one sharp") },
          { tex: r`\text{C} \to \text{F}: \ \text{B} \to \text{B}{\flat}`, why: tx(t, "musMaj_t4", "going down a fifth runs the other way: C's lower half becomes F's upper half, and F's lower half F G A B needs B♭ to be whole, whole, half. One new flat, on the new fourth degree") },
        ]} />

      <H2>{tx(t, "musMaj_lineTitle", "The scale on the line of fifths")}</H2>
      <p>
        {tx(t, "musMaj_lineBody",
          "Chapter 12 stacked fifths: C, G, D, A, E, B, F♯… Write every note name on one line, a fifth apart, extending both ways: … B♭ F C G D A E B F♯ C♯ … Now look at C major's notes on that line: F C G D A E B, seven neighbours. Every major scale is seven neighbours on the line of fifths, the tonic second from the left, and moving the tonic a fifth slides the window by one place. That is the tetrachord argument seen from above: one note leaves on one side, its sharpened or flattened twin enters on the other.")}
      </p>
      <Derivation t={t} label={tx(t, "musMaj_dLine", "Names on the line of fifths")}
        steps={[
          { tex: r`q:\ \ldots,\ \underset{-2}{\text{B}{\flat}},\ \underset{-1}{\text{F}},\ \underset{0}{\text{C}},\ \underset{1}{\text{G}},\ \underset{2}{\text{D}},\ \ldots,\ \underset{5}{\text{B}},\ \underset{6}{\text{F}{\sharp}},\ \ldots`, why: tx(t, "musMaj_l0", "number the positions: C = 0, one more for each fifth up, one less for each fifth down") },
          { tex: r`\ell = 4q \bmod 7`, why: tx(t, "musMaj_l1", "a fifth up is 4 letters up (C D E F G), so the letter index (C = 0 … B = 6) of position q is 4q, wrapped round the 7 letters") },
          { tex: r`a = \left\lfloor \frac{q + 1}{7} \right\rfloor`, why: tx(t, "musMaj_l2", "the naturals are the 7 positions F…B, q = −1 to 5. The next 7 (F♯…B♯) carry one sharp, the 7 before (F♭…B♭) one flat: every 7 fifths, the sign changes by one") },
          { tex: r`\text{${tx(t, "musMaj_lScale", "major scale of")}}\ p:\ q = p - 1,\ \ldots,\ p + 5`, why: tx(t, "musMaj_l3", "C major is q = −1…5, and moving the tonic one fifth moves every note one fifth, so the window just slides") },
          { tex: r`\#\text{${tx(t, "musMaj_lSigns", "signs")}} = |p|`, why: tx(t, "musMaj_l4", "the window p − 1 … p + 5 reaches past B (q = 5) by exactly p places when p > 0: p sharps. With p < 0 it reaches below F by −p places: −p flats") },
        ]} />
      <Equation label={tx(t, "musMaj_eqDeg", "Degree k of the major scale on tonic p")}
        where={[
          [r`p`, tx(t, "musMaj_wp", "the tonic's position on the line of fifths: C 0, G 1, D 2, F −1, B♭ −2…")],
          [r`f_k`, tx(t, "musMaj_wf", "where degree k sits relative to the tonic: 0, 2, 4, −1, 1, 3, 5 for degrees 1 to 7 (degree 4 is a fifth below, degree 7 five fifths above)")],
          [r`q`, tx(t, "musMaj_wq", "the position of the note asked for; its letter is 4q mod 7 and its sign ⌊(q + 1)/7⌋")],
        ]}
        words={tx(t, "musMaj_eqDegWords", "Find the tonic on the line of fifths, step to the degree's place, and read the name there.")}>
        {r`q = p + f_k, \qquad f = (0,\ 2,\ 4,\ -1,\ 1,\ 3,\ 5)`}
      </Equation>
      <LiveFormula label={tx(t, "musMaj_liveDeg", "Try it: any degree of any major key")}
        tex={r`q = p + f_k, \quad \ell = 4q \bmod 7, \quad a = \left\lfloor \tfrac{q + 1}{7} \right\rfloor`}
        vars={[
          { id: "p", label: tx(t, "musMaj_liveP", "tonic (p)"), min: -7, max: 7, step: 1, value: 2, fmt: v => spelledName(tonicOf(v), false) },
          { id: "k", label: tx(t, "musMaj_liveK", "degree (k)"), min: 1, max: 7, step: 1, value: 3, fmt: v => String(v) },
        ]}
        compute={degreeNumbers(t)}
        where={[
          [r`\ell,\ a`, tx(t, "musMaj_wla", "the letter (C = 0 … B = 6) and the sign (+1 sharp, −1 flat) of the answer")],
        ]}
        note={tx(t, "musMaj_liveDegNote", "D major, degree 3: q = 2 + 4 = 6, letter 24 mod 7 = 3 (F), sign ⌊7/7⌋ = 1: F♯. Move the tonic to the flat side and watch degree 4 turn into the new flat each time; to the sharp side, degree 7 into the new sharp.")} />

      <MusicKeysFigure t={t} />

      <H2>{tx(t, "musMaj_sigTitle", "Key signatures")}</H2>
      <p>
        {tx(t, "musMaj_sigBody",
          "Chapter 11 promised the story of key signatures; here it is. A piece in D major uses F♯ and C♯ all the time, so instead of writing the signs beside every F and C, it writes them once, right after the clef on every staff, and they hold for every octave. Because each new key adds the next sign on the line of fifths, the signs always appear in the same order, and a signature is just the first few of that list.")}
      </p>
      <LessonTable
        headers={[tx(t, "musMaj_tSigns", "Signs"), tx(t, "musMaj_tSharpKeys", "Sharp keys"), tx(t, "musMaj_tFlatKeys", "Flat keys")]}
        rows={[
          ["0", "C", "C"],
          ["1", "G (F♯)", "F (B♭)"],
          ["2", "D (F♯ C♯)", "B♭ (B♭ E♭)"],
          ["3", "A (+ G♯)", "E♭ (+ A♭)"],
          ["4", "E (+ D♯)", "A♭ (+ D♭)"],
          ["5", tx(t, "musMaj_t5s", "B (+ A♯) = C♭"), tx(t, "musMaj_t5f", "D♭ (+ G♭) = C♯")],
          ["6", tx(t, "musMaj_t6s", "F♯ (+ E♯) = G♭"), tx(t, "musMaj_t6f", "G♭ (+ C♭) = F♯")],
          ["7", tx(t, "musMaj_t7s", "C♯ (+ B♯) = D♭"), tx(t, "musMaj_t7f", "C♭ (+ F♭) = B")],
        ]}
      />
      <p>
        {tx(t, "musMaj_sigTricks",
          "Two quick ways to name the key of a signature. With sharps, the last sharp is the leading tone, degree 7, so the key is one half step above it: F♯ C♯ G♯ → A major. With flats, the last flat is the new degree 4, so the second-to-last flat is the tonic: B♭ E♭ A♭ → E♭ major (and one flat, which has no second-to-last, is F). The order itself is the line of fifths: F C G D A E B for sharps, and backwards, B E A D G C F, for flats.")}
      </p>
      <p>
        {tx(t, "musMaj_enh",
          "There are 15 key names but only 12 tonic keys on the piano: three pairs are enharmonic, the same sounds spelled two ways (chapter 11). B major (5 sharps) is C♭ major (7 flats); F♯ major (6 sharps) is G♭ major (6 flats); C♯ major (7 sharps) is D♭ major (5 flats). Composers usually pick the spelling with fewer signs. Where the two directions meet, the line of fifths bends into a circle: the circle of fifths, which the Harmony section will use to relate keys and chords.")}
      </p>

      <H2>{tx(t, "musMaj_transTitle", "Transposing a melody")}</H2>
      <p>
        {tx(t, "musMaj_transBody",
          "Since every major scale has the same steps, a melody written with degrees can be played in any key: \"Twinkle, Twinkle\" is 1 1 5 5 6 6 5, 4 4 3 3 2 2 1 in every key. In C that is C C G G A A G; in G it is G G D D E E D, and the descending line uses F♯ nowhere because degree 7 never appears. Moving a whole melody to another key is called transposing. Singers do it to fit their voice, guitarists with a capo, and the melody stays the same tune: every interval inside it is kept, only the starting pitch changes.")}
      </p>

      <ForInstrument only="piano">
        <H3>{tx(t, "musMaj_pnTitle", "The scale under the hand")}</H3>
        <p>
          {tx(t, "musMaj_pnBody",
            "Five fingers cannot cover eight notes, so pianists cross. In C major the right hand plays 1 2 3 (thumb, index, middle on C D E), then the thumb passes under to F and the hand continues 1 2 3 4 5 (F G A B C). The left hand mirrors it going up: 5 4 3 2 1 (C D E F G), the middle finger crosses over to A, then 3 2 1 (A B C). Other keys keep the idea but move the crossings so the thumb avoids the black keys.")}
        </p>
      </ForInstrument>
      <ForInstrument only="guitar">
        <H3>{tx(t, "musMaj_gtTitle", "One movable shape")}</H3>
        <p>
          {tx(t, "musMaj_gtBody",
            "On the guitar a major scale is a shape you can slide to any key. With the tonic on the low E string at fret r: on that string play frets r and r + 2; on the A string, frets r − 1, r and r + 2; on the D string, frets r − 1, r + 1 and r + 2. With r = 3 that is G A | B C D | E F♯ G, G major; slide it to r = 5 and it is A major, without thinking about a single sharp. The steps are built into the shape: every half step (B–C, F♯–G) is two neighbouring frets.")}
        </p>
      </ForInstrument>

      <H2>{tx(t, "musMaj_practTitle", "Practice")}</H2>
      <p>
        {tx(t, "musMaj_practBody",
          "Three skills make a key familiar: spelling any degree (the letter is fixed by counting, only the sign is in question), reading a signature at a glance, and hearing where a note sits relative to home. Start with keys of up to two signs, then widen.")}
      </p>

      <MusicScaleQuizFigure t={t} />

      <p>
        {tx(t, "musMaj_next",
          "Start the same white keys on A instead of C and the steps change: whole, half, whole, whole, half, whole, whole. The third above the tonic is now minor, and the music sounds darker. The next chapter is the minor scale, in its three forms (natural, harmonic and melodic), and the close relation between a major key and its relative minor, which share the same signature.")}
      </p>

      <KeyIdeas t={t} id="musMaj" items={[
        "The major scale is the step pattern whole, whole, half, whole, whole, whole, half (2 2 1 2 2 2 1), with degrees tonic, supertonic, mediant, subdominant, dominant, submediant and leading tone.",
        "On any tonic, degree k is key m₁ + M(k) (M = 0 2 4 5 7 9 11) written with the k-th letter from the tonic: each letter once, so each key needs only sharps or only flats.",
        "It is called major because every interval from the tonic to a degree is major or perfect; the major third gives it its bright colour.",
        "It is two identical tetrachords (whole, whole, half) joined by a whole step; one fifth up keeps every sign and adds a sharp on the new 7th degree, one fifth down adds a flat on the new 4th.",
        "Every major scale is seven neighbours on the line of fifths (letter 4q mod 7, sign ⌊(q + 1)/7⌋); key signatures list the signs in the fixed orders F C G D A E B and B E A D G C F.",
        "15 key names cover 12 tonics (B = C♭, F♯ = G♭, C♯ = D♭); a melody written in degrees can be transposed to any key unchanged.",
      ]} />
    </Article>
  );
}
