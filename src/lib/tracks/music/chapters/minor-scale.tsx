"use client";

// Scales: the minor scales. The natural minor as the major's notes from degree
// 6 (steps 2 1 2 2 1 2 2, sizes N(k) = M(k + 5) − 9); why "minor" (3, 6, 7
// minor from the tonic); relative minor (same window on the line of fifths,
// tonic three fifths up, signature r − 3) and parallel minor (window three
// places flatwards: three more flats); the missing leading tone and the
// harmonic minor (raised 7th, the step and a half); the melodic minor (raised
// 6th and 7th going up, natural coming down; jazz minor); raised notes written
// as accidentals; whether minor is sad; the scale under the hand.

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
import { MusicMinorScaleFigure } from "@/components/lesson/figures/music/MinorScaleFigure";
import { MusicRelativeFigure } from "@/components/lesson/figures/music/RelativeFigure";
import { MusicMinorQuizFigure } from "@/components/lesson/figures/music/MinorQuizFigure";
import { minorDegreeNumbers } from "../live/minor-scale";

const r = String.raw;

export function MinorScaleContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "musMin_intro",
          "Play the white keys again, but start on A and stop on A. Nothing new has been added, not a single black key, and yet the music sounds different: darker, more serious, somehow unfinished in a new way. That is the minor scale. This chapter shows where that difference comes from (three notes, each a half step lower), how every major key has a minor partner with the same signature, and why musicians use not one minor scale but three.")}
      </Lead>

      <Goals t={t} id="musMin" items={[
        "Describe the natural minor as the step pattern whole, half, whole, whole, half, whole, whole, and derive it from the major scale started on degree 6.",
        "Explain the name \"minor\": degrees 3, 6 and 7 are minor intervals above the tonic, a half step lower than in the major scale on the same note.",
        "Find the relative minor of any major key (and back) and the signature of any minor key, using the line of fifths: tonic three fifths up, signature r − 3.",
        "Tell relative from parallel keys, and explain why the parallel minor has three more flats.",
        "Build the harmonic and the melodic minor, explain why each one exists (the leading tone, the step and a half), and write their raised notes as accidentals.",
        "Recognise major and the three minor forms by ear, and play a minor scale on your instrument.",
      ]} />

      <H2>{tx(t, "musMin_naturalTitle", "Same keys, another home")}</H2>
      <p>
        {tx(t, "musMin_naturalBody",
          "From A to A on the white keys the gaps are 2 1 2 2 1 2 2 half steps: whole, half, whole, whole, half, whole, whole. These are the major scale's steps (2 2 1 2 2 2 1) started from a different place, the sixth one, because A is degree 6 of C major. The notes are the same; what changes is which note is home, and with it every interval measured from home. This scale is the natural minor. Its half steps now sit between degrees 2 and 3 and between 5 and 6.")}
      </p>
      <Derivation t={t} label={tx(t, "musMin_dNatural", "The natural minor from the major scale")}
        steps={[
          { tex: r`2\,2\,1\,2\,2\,\underbrace{2\,1}_{}\ \to\ \underbrace{2\,1}_{}\,2\,2\,1\,2\,2`, why: tx(t, "musMin_n0", "start the major steps at the step from degree 6 to 7, and wrap round: the last two steps move to the front") },
          { tex: r`N(k) = 0,\ 2,\ 3,\ 5,\ 7,\ 8,\ 10`, why: tx(t, "musMin_n1", "add the steps up: the half steps from the tonic to degree k of the natural minor, k = 1…7 (12 for the octave)") },
          { tex: r`N(k) = M(k + 5) - M(6)`, why: tx(t, "musMin_n2", "the same numbers read off the major scale: the minor's degree k is the major's degree k + 5, measured from the major's degree 6 (M(6) = 9). Past degree 7, M continues an octave up: M(8) = 12, M(9) = 14…") },
          { tex: r`N(3) = M(8) - 9 = 12 - 9 = 3`, why: tx(t, "musMin_n3", "one example: the minor's third degree is C, the major's degree 8 (its octave), three half steps above A") },
          { tex: r`N(k) = M(k) - 1 \quad \text{${tx(t, "musMin_nFor", "for")}}\ k = \red{3},\ \red{6},\ \red{7}`, why: tx(t, "musMin_n4", "compare with the major scale on the same tonic, M = 0 2 4 5 7 9 11: degrees 1, 2, 4 and 5 agree, degrees 3, 6 and 7 are one half step lower") },
        ]} />
      <LessonTable
        headers={[tx(t, "musMin_tDeg", "Degree"), tx(t, "musMin_tInA", "In A"), tx(t, "musMin_tInC", "In C"), tx(t, "musMin_tFrom", "From the tonic"), tx(t, "musMin_tVsMajor", "Compared with major")]}
        rows={[
          ["1", "A", "C", tx(t, "musMin_i1", "perfect unison"), tx(t, "musMin_same", "same")],
          ["2", "B", "D", tx(t, "musMin_i2", "major 2nd"), tx(t, "musMin_same", "same")],
          ["3", "C", "E♭", tx(t, "musMin_i3", "minor 3rd"), tx(t, "musMin_lower", "a half step lower")],
          ["4", "D", "F", tx(t, "musMin_i4", "perfect 4th"), tx(t, "musMin_same", "same")],
          ["5", "E", "G", tx(t, "musMin_i5", "perfect 5th"), tx(t, "musMin_same", "same")],
          ["6", "F", "A♭", tx(t, "musMin_i6", "minor 6th"), tx(t, "musMin_lower", "a half step lower")],
          ["7", "G", "B♭", tx(t, "musMin_i7", "minor 7th"), tx(t, "musMin_lower", "a half step lower")],
        ]}
      />

      <H3>{tx(t, "musMin_whyTitle", "Why it is called minor")}</H3>
      <p>
        {tx(t, "musMin_whyBody",
          "The last chapter named the major scale after its intervals from the tonic, all major or perfect. Here three of them are minor: the third, the sixth and the seventh. The third matters most. The tonic, the third and the fifth together make the scale's home chord, and with a minor third that chord is the minor chord, the darker sound everyone recognises. That is why a key is called minor or major after its third alone: the 6th and 7th colour the melody, the third decides the mode.")}
      </p>

      <H2>{tx(t, "musMin_relTitle", "Relative and parallel keys")}</H2>
      <p>
        {tx(t, "musMin_relBody",
          "A minor and C major use exactly the same seven notes, so they share a key signature: none. Two keys like this are called relative: A minor is the relative minor of C major, and C major the relative major of A minor. Every major key has one, on its 6th degree, a minor third (three half steps, three letters) below its tonic. Two keys on the same tonic, like C major and C minor, are called parallel (in Portuguese, \"homônimas\": same name). They share a home but not their notes. The line of fifths of the last chapter shows both relations at a glance.")}
      </p>
      <Derivation t={t} label={tx(t, "musMin_dRel", "Minor keys on the line of fifths")}
        steps={[
          { tex: r`\text{${tx(t, "musMin_rMajor", "major of")}}\ p:\ q = p - 1,\ \ldots,\ p + 5`, why: tx(t, "musMin_r0", "from the last chapter: a major key is 7 neighbours on the line of fifths, its tonic p second from the left, and it has p sharps (or −p flats)") },
          { tex: r`\text{${tx(t, "musMin_rDeg6", "degree 6")}}:\ q = p + 3`, why: tx(t, "musMin_r1", "the 6th degree sits three fifths above the tonic (C → G → D → A): that is where the relative minor's tonic is") },
          { tex: r`\text{${tx(t, "musMin_rMinor", "natural minor of")}}\ r:\ q = r - 4,\ \ldots,\ r + 2`, why: tx(t, "musMin_r2", "the same window seen from the minor tonic r = p + 3: four places to its left, two to its right. A minor: F C G D A E B, A fifth from the left") },
          { tex: r`\#\text{${tx(t, "musMin_rSigns", "signs")}}(r\ \text{${tx(t, "musMin_rMin", "minor")}}) = r - 3`, why: tx(t, "musMin_r3", "the window is the one of the major key p = r − 3, so the minor key has that key's signature: A (r = 3) none, E (4) one sharp, D (2) one flat") },
          { tex: r`\text{${tx(t, "musMin_rPar", "parallel")}}:\ r = p \;\Rightarrow\; p - 3`, why: tx(t, "musMin_r4", "on the same tonic, the minor window is three places to the left of the major one: three notes leave on the sharp side and come back flattened on the flat side, the 3rd, 6th and 7th. Three more flats, or three fewer sharps: D major has 2 sharps, D minor 2 − 3 = −1, one flat") },
        ]} />
      <MusicRelativeFigure t={t} />
      <LessonTable
        headers={[tx(t, "musMin_tSigns", "Signs"), tx(t, "musMin_tSharpSide", "Sharps: minor (relative major)"), tx(t, "musMin_tFlatSide", "Flats: minor (relative major)")]}
        rows={[
          ["0", "A (C)", "A (C)"],
          ["1", "E (G)", "D (F)"],
          ["2", "B (D)", "G (B♭)"],
          ["3", "F♯ (A)", "C (E♭)"],
          ["4", "C♯ (E)", "F (A♭)"],
          ["5", tx(t, "musMin_t5s", "G♯ (B) = A♭"), tx(t, "musMin_t5f", "B♭ (D♭) = A♯")],
          ["6", tx(t, "musMin_t6s", "D♯ (F♯) = E♭"), tx(t, "musMin_t6f", "E♭ (G♭) = D♯")],
          ["7", tx(t, "musMin_t7s", "A♯ (C♯) = B♭"), tx(t, "musMin_t7f", "A♭ (C♭) = G♯")],
        ]}
      />
      <p>
        {tx(t, "musMin_relTricks",
          "To name the minor key of a signature, find its major key and go down a minor third. Or read it straight off the signs. With sharps, the last sharp is the major's degree 7, which is the minor's degree 2, so the minor tonic is a whole step below it: F♯ → E minor, F♯ C♯ → B minor. With flats, the last flat is the major's degree 4, which is the minor's degree 6, so the minor tonic is a major third above it: B♭ → D minor, B♭ E♭ → G minor. The signature alone cannot tell you whether a piece is in the major key or in its relative minor; the music has to, and the next section shows the usual clue.")}
      </p>

      <H2>{tx(t, "musMin_harmTitle", "The missing leading tone: harmonic minor")}</H2>
      <p>
        {tx(t, "musMin_harmBody",
          "In the major scale, degree 7 sits a half step below the tonic and leans into it: B pulls to C. That pull is what makes a melody feel it has arrived home. The natural minor has lost it: its 7th, G in A minor, is a whole step below the tonic, the subtonic, and the ending sounds soft and open. For centuries, musicians in minor keys have simply raised the 7th by a half step when they wanted a strong arrival: G♯ in A minor. The scale with that raised 7th is the harmonic minor, so called because it gives the chords (the harmony) of the key their leading tone, which the Harmony section will need.")}
      </p>
      <p>
        {tx(t, "musMin_aug2",
          "The price is a new gap. Degree 6 stayed where it was, F, so from F to G♯ there are now three half steps: a step and a half, an augmented second (chapter 13: the same keys as a minor third, but between neighbouring letters). The steps of the harmonic minor are 2 1 2 2 1 3 1. That gap has a sound of its own, which many listeners hear as exotic; the same step and a half is central to the Arabic maqam Hijaz and to the freygish mode of klezmer music.")}
      </p>
      <p>
        {tx(t, "musMin_written",
          "The raised 7th is not in the key signature. A minor's signature stays empty and every G♯ is written as an accidental, every time; C minor keeps three flats and writes B♮. The signature always belongs to the natural minor, the one that shares its notes with the relative major. That gives the clue the last section promised: a piece with one sharp in the signature and many D♯s is in E minor, because D♯ is the leading tone of E; with no D♯ at all it is probably in G major.")}
      </p>

      <H2>{tx(t, "musMin_melTitle", "Smoothing the gap: melodic minor")}</H2>
      <p>
        {tx(t, "musMin_melBody",
          "Singers and melody writers found the step and a half awkward on the way up to the tonic. The fix is to raise degree 6 as well: F♯ G♯ A in A minor. The steps become 2 1 2 2 2 2 1, and the upper half of the scale is now exactly the upper half of the major scale (E F♯ G♯ A in both A minor and A major). Only the minor third at the bottom keeps it minor. Coming down, the melody is moving away from the tonic and needs no leading tone, so classical practice uses the natural form on the way down: A G F E. That scale, raised going up and natural coming down, is the melodic minor. Jazz musicians keep the raised form in both directions and call it the jazz minor.")}
      </p>
      <Equation label={tx(t, "musMin_eqForms", "The three minor scales, in half steps from the tonic")}
        where={[
          [r`N`, tx(t, "musMin_wN", "the natural minor: the major's notes from degree 6; degrees 3, 6, 7 minor")],
          [r`H`, tx(t, "musMin_wH", "the harmonic minor: the 7th raised to 11, a leading tone; between 8 and 11, the step and a half")],
          [r`U`, tx(t, "musMin_wU", "the melodic minor going up: the 6th raised too, to 9; coming down it is N again")],
          [r`M`, tx(t, "musMin_wM", "the major scale, for comparison: the melodic minor differs from it only at degree 3")],
        ]}
        words={tx(t, "musMin_eqFormsWords", "All three minors share the first five degrees, with the minor third; they differ only in how they reach the octave.")}>
        {r`\begin{aligned} N &= (0,\ 2,\ 3,\ 5,\ 7,\ 8,\ 10) \\ H &= (0,\ 2,\ 3,\ 5,\ 7,\ 8,\ \amber{11}) \\ U &= (0,\ 2,\ 3,\ 5,\ 7,\ \amber{9},\ \amber{11}) \\ M &= (0,\ 2,\ \red{4},\ 5,\ 7,\ 9,\ 11) \end{aligned}`}
      </Equation>

      <MusicMinorScaleFigure t={t} />

      <H3>{tx(t, "musMin_spellTitle", "Spelling any degree of any minor key")}</H3>
      <p>
        {tx(t, "musMin_spellBody",
          "The line of fifths spells the minor scales as easily as the major. The natural minor's degrees sit at fixed places around the tonic: the 3rd, 6th and 7th to its left, on the flat side. Raising a note by a half step without changing its letter (G to G♯) is a jump of seven places to the right: seven fifths up is four octaves plus that chromatic half step (chapter 11), and the letter comes round to itself because 4 × 7 is a multiple of 7.")}
      </p>
      <LiveFormula label={tx(t, "musMin_liveDeg", "Try it: any degree of any minor key")}
        tex={r`q = r + g_k + 7\rho, \quad \ell = 4q \bmod 7, \quad a = \left\lfloor \tfrac{q + 1}{7} \right\rfloor`}
        vars={[
          { id: "r", label: tx(t, "musMin_liveR", "tonic (r)"), min: -4, max: 10, step: 1, value: 3, fmt: v => spelledName(tonicOf(v), false) },
          { id: "k", label: tx(t, "musMin_liveK", "degree (k)"), min: 1, max: 7, step: 1, value: 7, fmt: v => String(v) },
          { id: "form", label: tx(t, "musMin_liveForm", "form"), min: 0, max: 2, step: 1, value: 1, fmt: v => [tx(t, "musMin_lvNat", "natural"), tx(t, "musMin_lvHar", "harmonic"), tx(t, "musMin_lvMel", "melodic")][v] },
        ]}
        compute={minorDegreeNumbers(t)}
        where={[
          [r`r`, tx(t, "musMin_wr", "the minor tonic's position on the line of fifths: A 3, E 4, D 2, C 0, G♯ 8…")],
          [r`g_k`, tx(t, "musMin_wg", "where natural-minor degree k sits relative to the tonic: 0, 2, −3, −1, 1, −4, −2 for degrees 1 to 7")],
          [r`\rho`, tx(t, "musMin_wrho", "1 if the form raises this degree (the 7th in harmonic and melodic, the 6th in melodic), else 0: raising is 7 places to the right")],
          [r`\ell,\ a`, tx(t, "musMin_wla", "the letter (C = 0 … B = 6) and the sign of the answer, as in the last chapter")],
        ]}
        note={tx(t, "musMin_liveNote", "A harmonic minor, degree 7: q = 3 − 2 + 7 = 8, letter 32 mod 7 = 4 (G), sign ⌊9/7⌋ = 1: G♯. Now pick C (r = 0): the 7th is 0 − 2 + 7 = 5, B with no sign, written B♮ because the signature has B♭. In flat minor keys the raised notes are naturals, in sharp keys they are sharps or even double sharps: try G♯ minor.")} />

      <H2>{tx(t, "musMin_sadTitle", "Is minor sad?")}</H2>
      <p>
        {tx(t, "musMin_sadBody",
          "In Western music, minor is strongly linked to sadness, and listeners from that tradition agree about it quickly and reliably. But the link is partly learned. Children start to use mode to judge whether music is happy or sad only around age 6, later than they use tempo (Dalla Bella and colleagues, 2001). There may also be a natural seed: in speech, sad voices tend to fall in small steps, and a study of actors' speech found that the minor third shows up in sad speech much as it does in sad music (Curtis and Bharucha, 2010). Context does a lot of the work: \"Billie Jean\" and \"Rolling in the Deep\" are in minor keys and make people dance, while \"Asa Branca\", a song about drought and leaving home, is in a major key. Minor is a colour, not a mood fixed by law.")}
      </p>

      <ForInstrument only="piano">
        <H3>{tx(t, "musMin_pnTitle", "Minor under the hand")}</H3>
        <p>
          {tx(t, "musMin_pnBody",
            "A natural minor uses the fingering of its relative major's shape where it can: A minor, all white keys, is fingered like C major (right hand 1 2 3, thumb under, 1 2 3 4 5; left hand 5 4 3 2 1, middle finger over, 3 2 1). In the harmonic and melodic forms only one or two notes change to black keys (G♯, or F♯ and G♯), and the fingers stay the same: the hand does not move, a finger just reaches a little further in.")}
        </p>
      </ForInstrument>
      <ForInstrument only="guitar">
        <H3>{tx(t, "musMin_gtTitle", "A movable minor shape")}</H3>
        <p>
          {tx(t, "musMin_gtBody",
            "With the tonic on the low E string at fret r, the natural minor is three notes on each of the first two strings and two on the third: frets r, r + 2, r + 3 on the low E string; r, r + 2, r + 3 on the A string; r and r + 2 on the D string. At r = 5 that is A B C | D E F | G A, A minor. For the harmonic minor, play the D string's r + 1 instead of r (G♯); for the melodic, also the A string's r + 4 instead of r + 3 (F♯). Compare it with the major shape of the last chapter: the minor shape lies flatter, its degrees 3, 6 and 7 one fret lower.")}
        </p>
      </ForInstrument>

      <H2>{tx(t, "musMin_practTitle", "Practice")}</H2>
      <p>
        {tx(t, "musMin_practBody",
          "First learn to hear major against minor: listen to the third note of the scale. Then add the harmonic minor's step and a half near the top, and finally the melodic minor, which sounds major at the top and minor at the bottom. On paper, practise finding the minor key of a signature and the relative key of any key, both ways.")}
      </p>

      <MusicMinorQuizFigure t={t} />

      <p>
        {tx(t, "musMin_next",
          "The natural minor is the major scale's notes started from degree 6. Nothing stops us starting from the other degrees too: from D on the white keys, from E, from G… Each gives a scale with its own pattern of steps and its own colour, and these are the modes, Dorian, Phrygian, Lydian and the rest, still heard in folk music, jazz and film scores. The next chapter builds all seven, and then removes notes to get the five-note pentatonic scale, the one the black keys have been playing since chapter 9.")}
      </p>

      <KeyIdeas t={t} id="musMin" items={[
        "The natural minor is the major scale's notes from degree 6: steps whole, half, whole, whole, half, whole, whole (2 1 2 2 1 2 2), sizes 0 2 3 5 7 8 10 from the tonic.",
        "Compared with the major scale on the same tonic, degrees 3, 6 and 7 are a half step lower; the minor third above the tonic gives the key its name and its darker colour.",
        "Every major key has a relative minor on its 6th degree (a minor third below), with the same notes and signature; on the line of fifths the minor tonic is three places right of the major one, and a minor key at r has r − 3 sharps.",
        "Parallel keys share a tonic: the minor has three more flats (or three fewer sharps), its 3rd, 6th and 7th lowered.",
        "The harmonic minor raises the 7th to get a leading tone back (steps 2 1 2 2 1 3 1, with a step and a half between 6 and 7); the melodic minor raises the 6th too going up (2 1 2 2 2 2 1) and is natural coming down.",
        "The signature is always the natural minor's: raised 6ths and 7ths are written as accidentals, which is also the clue that tells a minor key from its relative major.",
      ]} />
    </Article>
  );
}
