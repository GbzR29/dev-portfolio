"use client";

// Rhythm: pulse and tempo — the steady beat under most music and how fast it
// goes. The beat is something the listener's brain makes; tempo is counted in
// beats per minute, so one beat lasts 60/BPM seconds. Tap tempo, tempo words
// and the metronome, the range of tempos a beat can have, the point where a
// fast enough rhythm turns into a pitch, the grouping the brain adds by
// itself, and tempo that bends: accelerando, ritardando, rubato.

import { H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { MusicMetronomeFigure } from "@/components/lesson/figures/music/MetronomeFigure";
import { MusicRhythmToPitchFigure } from "@/components/lesson/figures/music/RhythmToPitchFigure";
import { MusicTempoShapesFigure } from "@/components/lesson/figures/music/TempoShapesFigure";
import { beatNumbers, tapNumbers } from "../live/pulse";

const r = String.raw;

export function PulseContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "musPul_intro",
          "The first four chapters were about a single sound: how high, what colour, how loud. Music is sounds arranged in time, and the arrangement in time is called rhythm. Under almost all of it runs something you can feel without any training: a steady beat you tap your foot to. This chapter is about that beat, the pulse, and how fast it goes, the tempo.")}
      </Lead>

      <Goals t={t} id="musPul" items={[
        "Explain what the pulse of a piece is and why it is something the listener's brain makes.",
        "Convert a tempo in beats per minute into the length of one beat, and back.",
        "Measure a tempo by tapping, and explain why averaging several taps helps.",
        "Name the main Italian tempo words and the range of tempos a beat can have.",
        "Explain why a rhythm played fast enough becomes a pitch.",
      ]} />

      <H2>{tx(t, "musPul_beatTitle", "The pulse")}</H2>
      <p>
        {tx(t, "musPul_beatBody",
          "Put on almost any song and within a few seconds you start nodding or tapping, evenly, without deciding to. What you are tapping is the pulse, also called the beat: a series of equally spaced moments that the music seems to move along. The drums or the bass may mark it, but they do not have to. A beat continues through a pause, and you can feel it on moments where no note sounds at all. The beat is not in the sound wave; it is something your brain builds from the sound, a prediction of when the next important moment will come.")}
      </p>
      <p>
        {tx(t, "musPul_entrain",
          "Locking your movements onto a beat is called entrainment. It looks effortless, but very few animals can do it. In 2009 the scientist Aniruddh Patel showed that Snowball, a sulphur-crested cockatoo, bobbed his head in time to a pop song and followed when the song was sped up or slowed down. Our closest relatives, chimpanzees, mostly cannot. Newborn babies already notice when an expected beat is missing.")}
      </p>

      <H2>{tx(t, "musPul_tempoTitle", "Tempo: beats per minute")}</H2>
      <p>
        {tx(t, "musPul_tempoBody",
          "Tempo is how fast the beat goes. It is counted in beats per minute, BPM, the same unit a doctor uses for your heart. A tempo of 60 BPM is one beat each second; 120 BPM is two. What a musician usually needs is the other way round: how long one beat lasts.")}
      </p>
      <Derivation t={t} label={tx(t, "musPul_dBeat", "From beats per minute to the length of one beat")}
        steps={[
          { tex: r`\text{BPM beats} \;\leftrightarrow\; 60\ \text{s}`, why: tx(t, "musPul_d0", "a tempo of BPM means that many beats fit in one minute, which is 60 seconds") },
          { tex: r`T = \frac{60\ \text{s}}{\text{BPM}}`, why: tx(t, "musPul_d1", "the beats are equally spaced, so share the 60 seconds equally among them: each beat lasts 60 divided by BPM seconds") },
          { tex: r`T_{\text{ms}} = \frac{60\,000}{\text{BPM}}`, why: tx(t, "musPul_d2", "in milliseconds, the unit of music software: multiply by 1000. At 120 BPM, 60 000 / 120 = 500 ms") },
          { tex: r`f = \frac{1}{T} = \amber{\frac{\text{BPM}}{60}}\ \text{Hz}`, why: tx(t, "musPul_d3", "turned around, as in chapter 1 (f = 1/T): the beat is a repetition with a frequency in hertz, beats per second. 120 BPM is 2 Hz. This will matter at the end of the chapter") },
        ]} />
      <Equation label={tx(t, "musPul_eqBeat", "Length of one beat")}
        where={[
          [r`T`, tx(t, "musPul_wT", "the beat period: the time from one beat to the next, in seconds")],
          [r`\text{BPM}`, tx(t, "musPul_wBpm", "the tempo, in beats per minute")],
          [r`60`, tx(t, "musPul_w60", "the number of seconds in a minute, which turns \"per minute\" into seconds")],
        ]}
        words={tx(t, "musPul_beatWords", "Share one minute equally among the beats.")}>
        {r`T = \frac{60}{\text{BPM}}`}
      </Equation>
      <LiveFormula label={tx(t, "musPul_liveBeat", "Try it: a tempo in seconds and hertz")}
        tex={r`T = \frac{60}{\text{BPM}} \qquad f = \frac{\text{BPM}}{60}`}
        vars={[
          { id: "bpm", label: tx(t, "musPul_liveBpm", "tempo (BPM)"), min: 30, max: 240, step: 1, value: 120, fmt: v => `${v} BPM` },
          { id: "min", label: tx(t, "musPul_liveMin", "length of the song (minutes)"), min: 1, max: 10, step: 0.5, value: 3.5, fmt: v => `${v} min` },
        ]}
        compute={beatNumbers(t)}
        where={[
          [r`T`, tx(t, "musPul_wT2", "how long each beat lasts")],
          [r`f`, tx(t, "musPul_wF", "how many beats per second: the beat as a frequency")],
        ]}
        note={tx(t, "musPul_liveBeatNote", "A three-and-a-half-minute song at 120 BPM has 420 beats. Producers use T to set echo effects: an echo 500 ms long lands exactly on the next beat at 120 BPM.")} />

      <MusicMetronomeFigure t={t} />

      <H3>{tx(t, "musPul_tapTitle", "Measuring a tempo by tapping")}</H3>
      <p>
        {tx(t, "musPul_tapBody",
          "To find the tempo of a song, tap along and time the gaps. Any one gap is a little off, because no hand is perfectly steady; but the errors go both ways, so averaging several gaps cancels much of them out. That is what the metronome's tap button and every \"tap tempo\" button on a drum machine do.")}
      </p>
      <LiveFormula label={tx(t, "musPul_liveTap", "Try it: three taps' worth of gaps")}
        tex={r`\text{BPM} = \frac{60}{\overline{\Delta t}}`}
        vars={[
          { id: "g1", label: tx(t, "musPul_liveG1", "gap 1 (ms)"), min: 300, max: 900, step: 1, value: 588, fmt: v => `${v} ms` },
          { id: "g2", label: tx(t, "musPul_liveG2", "gap 2 (ms)"), min: 300, max: 900, step: 1, value: 562, fmt: v => `${v} ms` },
          { id: "g3", label: tx(t, "musPul_liveG3", "gap 3 (ms)"), min: 300, max: 900, step: 1, value: 580, fmt: v => `${v} ms` },
        ]}
        compute={tapNumbers}
        where={[
          [r`\Delta t`, tx(t, "musPul_wDt", "one gap between two taps (Greek capital delta, \"change in\", and t for time)")],
          [r`\overline{\Delta t}`, tx(t, "musPul_wMean", "the average gap: the bar on top means \"average\". Add the gaps and divide by how many there are")],
          [r`60`, tx(t, "musPul_w60b", "seconds per minute: the average gap, in seconds, turned into beats per minute")],
        ]}
        note={tx(t, "musPul_liveTapNote", "The three gaps alone would give 102, 107 and 103 BPM; their average gives 104.0, right on the 104 BPM of \"Stayin' Alive\", the song first-aid courses use to teach the pace of chest compressions.")} />

      <H3>{tx(t, "musPul_wordsTitle", "Tempo words and the metronome")}</H3>
      <p>
        {tx(t, "musPul_wordsBody",
          "For centuries composers wrote tempo with Italian words that describe a character as much as a speed: largo is \"broad\", andante \"walking\", allegro \"cheerful\". In 1815 Johann Nepomuk Maelzel patented the clockwork metronome, a pendulum with a sliding weight: higher up, the swing is slower. Beethoven was one of the first composers to write metronome numbers into his music, as M.M. ♩ = 120, \"Maelzel's metronome, 120 quarter notes a minute\". The ranges below are typical; books disagree by a few BPM.")}
      </p>
      <LessonTable
        headers={[tx(t, "musPul_tWord", "Word"), tx(t, "musPul_tMeans", "Literally"), tx(t, "musPul_tBpm", "About (BPM)")]}
        rows={[
          ["Grave", tx(t, "musPul_m1", "heavy, solemn"), tx(t, "musPul_b1", "below 40")],
          ["Largo", tx(t, "musPul_m2", "broad"), "40–60"],
          ["Adagio", tx(t, "musPul_m3", "at ease"), "66–76"],
          ["Andante", tx(t, "musPul_m4", "walking"), "76–108"],
          ["Moderato", tx(t, "musPul_m5", "moderate"), "108–120"],
          ["Allegro", tx(t, "musPul_m6", "cheerful, lively"), "120–156"],
          ["Vivace", tx(t, "musPul_m7", "lively, brisk"), "156–176"],
          ["Presto", tx(t, "musPul_m8", "quick"), "168–200"],
          ["Prestissimo", tx(t, "musPul_m9", "as quick as possible"), tx(t, "musPul_b9", "above 200")],
        ]}
      />
      <LessonTable
        headers={[tx(t, "musPul_eWhat", "Everyday tempos"), tx(t, "musPul_eBpm", "BPM")]}
        rows={[
          [tx(t, "musPul_e1", "Resting heartbeat of an adult"), "60–100"],
          [tx(t, "musPul_e2", "Hip-hop"), "85–95"],
          [tx(t, "musPul_e3", "Chest compressions in first aid"), "100–120"],
          [tx(t, "musPul_e4", "Walking: steps per minute"), "100–120"],
          [tx(t, "musPul_e5", "House and most dance-pop"), "118–130"],
          [tx(t, "musPul_e6", "Techno"), "125–140"],
          [tx(t, "musPul_e7", "Drum and bass"), "165–180"],
        ]}
      />

      <H3>{tx(t, "musPul_rangeTitle", "How slow and how fast a beat can be")}</H3>
      <p>
        {tx(t, "musPul_rangeBody",
          "Asked to tap at whatever speed feels natural, most people settle near 100 to 120 BPM, a beat every half second or so, which is also the pace of walking. A beat can stretch from roughly 30 BPM (2 seconds between beats) to roughly 300 BPM (0.2 seconds). Slower than that and the beats stop feeling connected: you count them instead of feeling them. Faster and you can no longer tap along, so the brain feels every second or fourth event as the beat instead. And when people tap with a metronome, they tend to tap slightly early, often 20 to 50 milliseconds before the click, as if the brain aims for the sound to arrive with the tap. Trained musicians are earlier by less.")}
      </p>

      <H2>{tx(t, "musPul_pitchTitle", "When rhythm becomes pitch")}</H2>
      <p>
        {tx(t, "musPul_pitchBody",
          "The beat has a frequency, BPM/60 hertz. So what happens if a rhythm keeps getting faster? Chapter 1 said the ear hears tones from about 20 Hz upward, and chapter 3 said the rate at which a wave repeats is its pitch. Put the two together: a click repeated 20 times a second is 1200 BPM, and that is about where clicks stop being separate events and fuse into a low buzz. Rhythm and pitch are the same thing, repetition, heard at different speeds.")}
      </p>

      <MusicRhythmToPitchFigure t={t} />

      <p>
        {tx(t, "musPul_pitchAfter",
          "Seen this way, the note A4 is a \"rhythm\" of 440 beats per second, 26 400 BPM. The composer Karlheinz Stockhausen made the same point in 1957: speed up a rhythm and it becomes a timbre and a pitch; slow down a note and it becomes a rhythm.")}
      </p>

      <H2>{tx(t, "musPul_groupTitle", "The beat your brain adds")}</H2>
      <p>
        {tx(t, "musPul_groupBody",
          "Start the metronome at about 100 BPM and just listen. Every click is identical, yet after a few seconds most people hear them in pairs, tick-tock, or in fours, with the first of each group a little stronger. The psychologist Thaddeus Bolton described this in 1894; it is called subjective rhythmization. The brain does not like an unstructured stream and groups it by itself. Music makes that grouping explicit with accents, which is what meter, two chapters from now, is about.")}
      </p>

      <H2>{tx(t, "musPul_bendTitle", "Bending the tempo")}</H2>
      <p>
        {tx(t, "musPul_bendBody",
          "A metronome never wavers, but music often does on purpose. Accelerando means gradually faster, ritardando (rit.) gradually slower, often at the end of a piece; a tempo means back to the original tempo. Rubato, Italian for \"stolen\", is a give and take inside a phrase: time stolen from some notes is given back to others, so the music breathes. Chopin's piano music is famous for it. Once the tempo changes, each beat has its own length, and the moment a note sounds is the sum of the beats before it.")}
      </p>
      <Equation label={tx(t, "musPul_eqOnset", "When beat n arrives, if the tempo changes")}
        where={[
          [r`t_n`, tx(t, "musPul_wTn", "the time, in seconds from the start, at which beat n sounds")],
          [r`\sum_{k=0}^{n-1}`, tx(t, "musPul_wSum", "add up the term on the right for every beat before beat n: k = 0, 1, …, n − 1")],
          [r`\text{BPM}_k`, tx(t, "musPul_wBpmK", "the tempo during beat k. With a steady tempo every BPMₖ is the same, and the sum is just n · 60/BPM")],
          [r`\frac{60}{\text{BPM}_k}`, tx(t, "musPul_wLen", "the length of beat k, from the formula above")],
        ]}
        words={tx(t, "musPul_onsetWords", "A note arrives when all the beats before it have gone by, each lasting as long as its own tempo says.")}>
        {r`t_n = \sum_{k=0}^{n-1} \frac{60}{\text{BPM}_k}`}
      </Equation>

      <MusicTempoShapesFigure t={t} />

      <p>
        {tx(t, "musPul_bendAfter",
          "A fermata, a dot under an arch written over a note, says \"hold it as long as you like\": the beat stops altogether and restarts after it. These freedoms are why a live performance never matches a metronome, and why a conductor's main job is to show the whole orchestra where the beat is right now. The beats of a piece are not the only durations, though: notes can last half a beat, two beats, a beat and a half. Those are the next chapter.")}
      </p>

      <KeyIdeas t={t} id="musPul" items={[
        "The pulse, or beat, is a series of equally spaced moments the music moves along; the listener's brain builds it, and it continues through silences.",
        "Tempo is counted in beats per minute: one beat lasts T = 60/BPM seconds (60 000/BPM ms), and the beat has a frequency of BPM/60 Hz.",
        "Tapping measures a tempo: BPM = 60 / average gap; averaging cancels much of the hand's unsteadiness.",
        "Italian tempo words run from largo (≈ 40–60) through andante (walking) and allegro to presto; a beat can range from about 30 to 300 BPM, and most people prefer about 100–120.",
        "Speed a rhythm up past about 20 events a second and it fuses into a pitch: rhythm and pitch are both repetition.",
        "The brain groups even identical clicks; tempo can bend on purpose (accelerando, ritardando, rubato), and then each note arrives at tₙ = Σ 60/BPMₖ.",
      ]} />
    </Article>
  );
}
