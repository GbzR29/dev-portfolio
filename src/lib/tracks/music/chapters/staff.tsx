"use client";

// Notes: the staff and clefs. Pitch drawn as height: lines and spaces, one
// letter per step; finding the note of any position with d = 7·o + ℓ (the
// white keys counted mod 7); clefs as the letters G, F and C; the grand staff
// as eleven lines with middle C's line left out; ledger lines, landmarks,
// stems and 8va.

import { H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { MusicStaffFigure } from "@/components/lesson/figures/music/StaffFigure";
import { MusicClefMelodyFigure } from "@/components/lesson/figures/music/ClefMelodyFigure";
import { MusicStaffQuizFigure } from "@/components/lesson/figures/music/StaffQuizFigure";
import { MusicTabFigure } from "@/components/lesson/figures/music/TabFigure";
import { ForInstrument } from "@/components/lesson/kit/audio/useInstrument";
import { staffNumbers } from "../live/staff";

const r = String.raw;

export function StaffContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "musStf_intro",
          "Chapter 6 wrote down how long notes last. Now for how high they are. Written music draws pitch as height: five horizontal lines, and the higher a note sits on them, the higher it sounds. One symbol at the start, the clef, says which line is which note. With those two ideas, a melody can be read at a glance, by anyone, in any country, which is why this way of writing has lasted almost a thousand years.")}
      </Lead>

      <Goals t={t} id="musStf" items={[
        "Explain how the staff turns pitch into height: every line and every space is the next letter.",
        "Find the note at any position of a staff by counting steps, and with d = 7·o + ℓ.",
        "Read the treble, bass and alto clefs, and say which note each one marks.",
        "Explain the grand staff and why middle C sits on a ledger line between its two staves.",
        "Use landmarks, ledger lines and octave signs to read notes quickly.",
      ]} />

      <H2>{tx(t, "musStf_heightTitle", "Pitch as height")}</H2>
      <p>
        {tx(t, "musStf_heightBody",
          "Before the year 1000, chant was written with small marks, neumes, floating over the words: they showed the shape of a melody (up here, down there) but not exactly how far. Singers still had to learn each tune by ear. Guido of Arezzo, the monk of the do-re-mi syllables, fixed this around 1025 with horizontal lines: each line and each space between lines is one fixed note, so a mark's height says exactly which note it is. His staves had four lines, one of them red for F and one yellow for C. Gregorian chant is still written on four; music for instruments settled on five by the 16th century.")}
      </p>
      <p>
        {tx(t, "musStf_heightSteps",
          "The rule of the staff is simple: lines and spaces alternate, and each one is the next white-key letter. If a line is E, the space above it is F, the next line G, the next space A, and so on. Moving from a line to the next space (or a space to the next line) is a step, one letter. Moving from a line to the next line skips one letter, so it is two letters up: E to G, G to B. Five lines and the four spaces between them make nine positions, nine letters in a row, from the bottom line to the top one.")}
      </p>

      <H2>{tx(t, "musStf_findTitle", "Which note is on which line?")}</H2>
      <p>
        {tx(t, "musStf_findBody",
          "Counting letters works, but there is a neater way, the same trick as chapter 9's key numbers. There, the 12 keys of an octave were counted together, and a division by 12 split a key number into a name and an octave. On the staff only the white keys exist (the black ones need extra signs, next chapter), so count only white keys: 7 per octave, numbered from C = 0.")}
      </p>
      <Derivation t={t} label={tx(t, "musStf_dTitle", "The note at a position of the staff")}
        steps={[
          { tex: r`\ell = 0, 1, 2, 3, 4, 5, 6 \;\leftrightarrow\; \text{C D E F G A B}`, why: tx(t, "musStf_d0", "give each letter a number ℓ, starting from C, since octave numbers change at C (chapter 9)") },
          { tex: r`d = 7\,o + \ell`, why: tx(t, "musStf_d1", "count every white key from the bottom with one number d: each octave o adds 7 keys, and the letter adds ℓ more. Middle C, C4, is d = 7 × 4 + 0 = 28") },
          { tex: r`d_{\text{${tx(t, "musStf_dBottom", "bottom")}}} = 7 \times 4 + 2 = 30\ (\text{E4})`, why: tx(t, "musStf_d2", "the treble clef makes the bottom line E4 (the next section shows why). Its d is 30") },
          { tex: r`d = d_{\text{${tx(t, "musStf_dBottom", "bottom")}}} + s`, why: tx(t, "musStf_d3", "a note s steps above the bottom line (s counts lines and spaces; negative below) is s white keys higher, because each step of the staff is one letter") },
          { tex: r`\ell = d \bmod 7, \qquad o = \left\lfloor \frac{d}{7} \right\rfloor`, why: tx(t, "musStf_d4", "split d back into letter and octave: the remainder after dividing by 7 is the letter, the quotient the octave") },
          { tex: r`s = 8:\ d = 38 = 7 \times 5 + 3 \;\Rightarrow\; \amber{\text{F5}}`, why: tx(t, "musStf_d5", "the top line of the treble staff. And s = −2, one ledger line below: d = 28, C4, middle C") },
        ]} />
      <Equation label={tx(t, "musStf_eqPos", "Note at step s of a staff")}
        where={[
          [r`d`, tx(t, "musStf_wd", "the white-key number: 7 per octave, C4 = 28")],
          [r`d_{\text{${tx(t, "musStf_dBottom", "bottom")}}}`, tx(t, "musStf_wdb", "the d of the bottom line, set by the clef: 30 (E4) in treble, 18 (G2) in bass, 24 (F3) in alto")],
          [r`s`, tx(t, "musStf_ws", "how many steps (lines and spaces) above the bottom line: 0 is the bottom line, 1 the first space, 8 the top line")],
          [r`\ell`, tx(t, "musStf_wl", "the letter: 0 = C, 1 = D, 2 = E, 3 = F, 4 = G, 5 = A, 6 = B")],
          [r`o`, tx(t, "musStf_wo", "the octave number, as in C4")],
        ]}
        words={tx(t, "musStf_eqWords", "Add the steps to the bottom line's number; divide by 7: the remainder is the letter, the quotient the octave.")}>
        {r`d = d_{\text{${tx(t, "musStf_dBottom", "bottom")}}} + s, \qquad \ell = d \bmod 7, \quad o = \left\lfloor \frac{d}{7} \right\rfloor`}
      </Equation>
      <LiveFormula label={tx(t, "musStf_liveTitle", "Try it: any position, any clef")}
        tex={r`d = d_{\text{${tx(t, "musStf_dBottom", "bottom")}}} + s`}
        vars={[
          { id: "k", label: tx(t, "musStf_liveClef", "clef"), min: 0, max: 2, step: 1, value: 0, fmt: k => [tx(t, "musStf_lvTreble", "treble"), tx(t, "musStf_lvBass", "bass"), tx(t, "musStf_lvAlto", "alto")][k] },
          { id: "s", label: tx(t, "musStf_liveS", "steps above the bottom line (s)"), min: -6, max: 14, step: 1, value: 4, fmt: v => String(v) },
        ]}
        compute={staffNumbers(t)}
        where={[
          [r`d`, tx(t, "musStf_wd2", "the white-key number of the note; ℓ and o name it")],
        ]}
        note={tx(t, "musStf_liveNote", "Keep s = 4 (the middle line) and change the clef: B4 in treble, D3 in bass, C4 in alto. Then set s = −2 in treble and s = 10 in bass: both are C4, middle C, one ledger line away from each staff.")} />

      <H2>{tx(t, "musStf_clefTitle", "Clefs: letters that became symbols")}</H2>
      <p>
        {tx(t, "musStf_clefBody",
          "Five lines alone do not say which note is which; the clef does. Medieval scribes simply wrote a letter at the start of one line, G, F or C, meaning \"this line is that note\". Copied by hand for centuries, the letters curled into the three signs used today, and each still points at its own line.")}
      </p>
      <LessonTable
        headers={[tx(t, "musStf_tClef", "Clef"), tx(t, "musStf_tMarks", "Marks"), tx(t, "musStf_tLines", "Lines, bottom to top"), tx(t, "musStf_tUsed", "Used for")]}
        rows={[
          [tx(t, "musStf_tTreble", "treble (G clef)"), tx(t, "musStf_tTrebleM", "its curl wraps line 2: G4"), "E4 G4 B4 D5 F5", tx(t, "musStf_tTrebleU", "violin, flute, voice, the piano's right hand; guitar, sounding an octave lower")],
          [tx(t, "musStf_tBass", "bass (F clef)"), tx(t, "musStf_tBassM", "its two dots straddle line 4: F3"), "G2 B2 D3 F3 A3", tx(t, "musStf_tBassU", "cello, bass, bassoon, trombone, low voices, the piano's left hand")],
          [tx(t, "musStf_tAlto", "alto (C clef)"), tx(t, "musStf_tAltoM", "its centre points at line 3: C4"), "F3 A3 C4 E4 G4", tx(t, "musStf_tAltoU", "viola; on line 4 (tenor clef) for high cello, bassoon and trombone parts")],
        ]}
      />
      <p>
        {tx(t, "musStf_clefWhy",
          "Why several clefs? Each instrument plays in its own range, and a clef places that range on the five lines, so its notes need few ledger lines. A cello in treble clef would live below the staff; in bass clef it sits right on it. The C clef can even slide to another line, which is why it has survived only for the instruments in between, like the viola.")}
      </p>
      <p>
        {tx(t, "musStf_mnemonic",
          "Students remember the lines with sentences. Treble lines E G B D F: \"Every Good Boy Does Fine\"; treble spaces spell F A C E. Bass lines G B D F A: \"Good Boys Do Fine Always\"; bass spaces A C E G: \"All Cows Eat Grass\". Handy at first, but slow: the widgets below train the faster way, landmarks.")}
      </p>

      <MusicStaffFigure t={t} />

      <H3>{tx(t, "musStf_clefMoves", "The clef moves every note")}</H3>
      <p>
        {tx(t, "musStf_clefMovesBody",
          "The same drawing means different notes under different clefs. A melody in treble clef, read in bass clef, is not simply lower: every note gets a different letter, and the half steps E–F and B–C (chapter 9) stay with the letters, not with the positions. So some steps of the tune change size, and it sounds bent. Hear it in the next widget.")}
      </p>

      <MusicClefMelodyFigure t={t} />

      <H2>{tx(t, "musStf_grandTitle", "The grand staff and middle C")}</H2>
      <p>
        {tx(t, "musStf_grandBody",
          "A piano covers far more than one staff, so piano music uses two at once, joined by a brace: treble on top for the right hand, bass below for the left. This is the grand staff. The two staves fit together exactly, with room for one note line between them, and that line belongs to middle C.")}
      </p>
      <Derivation t={t} label={tx(t, "musStf_gTitle", "What fits between the two staves")}
        steps={[
          { tex: r`\text{${tx(t, "musStf_gTop", "bass top line")}} = \text{A3} = 26`, why: tx(t, "musStf_g0", "the bass staff's lines are G2 B2 D3 F3 A3, so its top line has d = 7 × 3 + 5 = 26") },
          { tex: r`\text{${tx(t, "musStf_gBottom", "treble bottom line")}} = \text{E4} = 30`, why: tx(t, "musStf_g1", "the treble staff starts at E4, d = 30") },
          { tex: r`27,\ 28,\ 29 = \text{B3},\ \text{C4},\ \text{D4}`, why: tx(t, "musStf_g2", "three positions are left between them: a space, a line, a space") },
          { tex: r`28 = \text{C4}:\ \amber{\text{${tx(t, "musStf_gLine", "a line")}}}`, why: tx(t, "musStf_g3", "lines and spaces alternate, and 26 and 30 are lines, so 28 is a line too: the one line between the staves is middle C. It is drawn only as a short ledger line, when a note needs it") },
          { tex: r`5 + 1 + 5 = 11`, why: tx(t, "musStf_g4", "so the grand staff is one staff of eleven lines with its middle line left out. Leaving it out lets the eye split the eleven lines into two groups of five, which it can read at a glance") },
        ]} />
      <p>
        {tx(t, "musStf_grandC",
          "That makes middle C the anchor of everything: one ledger line below the treble staff, one ledger line above the bass staff, the same key either way. The G clef's G4 is two steps above it (on the treble's line 2), and the F clef's F3 two steps below (on the bass's line 4). Show the hidden line in the first widget to see all eleven.")}
      </p>

      <H2>{tx(t, "musStf_readTitle", "Reading fast")}</H2>
      <p>
        {tx(t, "musStf_ledgerBody",
          "Notes above or below the five lines borrow short lines of their own, ledger lines, which extend the staff just for that note. Two or three are easy to read; more are not, so very high or very low passages use an octave sign: \"8va\" over the notes means \"play an octave higher than written\" (8vb or 8va below, an octave lower; 15ma, two octaves), with a dashed line showing how far it lasts. Guitar music goes the other way: it is written in treble clef an octave higher than it sounds, sometimes with a small 8 under the clef.")}
      </p>
      <p>
        {tx(t, "musStf_stems",
          "Notes with stems (chapter 6) follow a rule that keeps them inside the staff: below the middle line, the stem goes up on the right of the head; on or above it, the stem goes down on the left. The rule is pure readability, so the stems do not stick out into the next staff.")}
      </p>
      <p>
        {tx(t, "musStf_landmarks",
          "Fluent readers do not count from the bottom line. They know a few landmarks by sight, the clef's own line, middle C, the top and bottom lines, and count from the nearest one. They also read shapes rather than single notes: line to next line is a skip of a third (two letters), line to next space a step, and a melody that moves by steps looks like a little staircase. The game below starts the habit.")}
      </p>

      <MusicStaffQuizFigure t={t} />

      <ForInstrument only="guitar">
        <H2>{tx(t, "musStf_gtTitle", "Guitar music: the staff and the tablature")}</H2>
        <p>
          {tx(t, "musStf_gtOctave",
            "Guitar music is written in the treble clef, but one octave higher than it sounds. The reason is the guitar's range. Its lowest note, the open low E string, is E2: on the treble staff that would hang seven ledger lines below the bottom line, and on the bass staff the high notes would fly off the top. Written an octave up, the open low E becomes E3, three ledger lines below the treble staff, and almost everything a guitar plays fits on one staff with a few ledger lines. A small 8 under the clef says so. Without it, guitarists simply know.")}
        </p>
        <Equation label={tx(t, "musStf_gtEqLabel", "Where a guitar note is written")}
          where={[
            [r`d_{\text{${tx(t, "musStf_gtSounding", "sounding")}}}`, tx(t, "musStf_gtWd", "the note the guitar actually plays, as this chapter's white-key number d = 7·octave + letter (C4 = 28)")],
            [r`d_{\text{${tx(t, "musStf_gtWritten", "written")}}}`, tx(t, "musStf_gtWw", "the line or space where it is drawn on the treble staff")],
            [r`7`, tx(t, "musStf_gtW7", "one octave: seven letters, C D E F G A B, so seven lines and spaces")],
          ]}
          words={tx(t, "musStf_gtWords", "Draw every note seven steps (one octave) higher than it sounds.")}>
          {r`d_{\text{${tx(t, "musStf_gtWritten", "written")}}} = d_{\text{${tx(t, "musStf_gtSounding", "sounding")}}} + 7`}
        </Equation>
        <p>
          {tx(t, "musStf_gtExample",
            "So the open high E string, which sounds E4 (d = 30), is written E5 (d = 37), the space at the top of the staff. The open low E, sounding E2 (d = 16), is written E3 (d = 23). The note does not change, only where it is drawn.")}
        </p>
        <p>
          {tx(t, "musStf_gtTab",
            "The staff tells you which note to play, but on a guitar most notes can be played in two or three places. Tablature, or tab, tells the hand where. It has six lines, one for each string, with the thin high E on top, as in the widgets of this track. A number on a line is the fret to press on that string; 0 means the string is played open. Tab is older than the staff for plucked instruments: lute players in the 1500s already read it.")}
        </p>
        <p>
          {tx(t, "musStf_gtBoth",
            "Each one has a blind spot. Tab says nothing about the note's name, and plain tab usually says nothing about rhythm, so you cannot sing a melody from it. The staff says nothing about strings and frets. That is why guitar books print the two together, one note above the other: the staff for what and how long, the tab for where. The tab also records the player's choice of place, which changes how easy a passage is and even how it sounds, since the same note on a thicker string is a little darker.")}
        </p>

        <MusicTabFigure t={t} />
      </ForInstrument>

      <p>
        {tx(t, "musStf_next",
          "So far, every note on the staff has been a white key. The black keys need something more: a sign in front of the note that raises or lowers it by a half step. The next chapter brings in the sharp ♯, the flat ♭ and the natural ♮, finally names the black keys, and shows why one key can have two names.")}
      </p>

      <KeyIdeas t={t} id="musStf" items={[
        "The staff draws pitch as height: lines and spaces alternate, and each is the next letter; line to space is a step, line to line a skip of two letters.",
        "Number the white keys d = 7·o + ℓ (C4 = 28); a note s steps above the bottom line has d = d_bottom + s, letter d mod 7 and octave ⌊d/7⌋.",
        "Clefs began as the letters G, F and C: the treble clef marks G4 on line 2 (lines E4–F5), the bass clef F3 on line 4 (G2–A3), the alto clef C4 on line 3.",
        "The same picture under another clef is other notes, and since the half steps stay with the letters, a tune read in the wrong clef bends.",
        "The grand staff is eleven lines with the middle one left out: that line is middle C, one ledger line below the treble staff and one above the bass.",
        "Ledger lines extend the staff, 8va moves notes an octave, stems point up below the middle line and down above it; read from landmarks, not from the bottom line.",
      ]} />
    </Article>
  );
}
