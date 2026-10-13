// ── Practice sounds ───────────────────────────────────────────────────────────
// Two tiny synthesized cues for a practice session: a bright rising chime for
// a right answer (two sine notes a fourth apart, E6 then A6) and a soft low
// "bonk" for a wrong one (a short falling pair). Kept quiet, so they sit
// under whatever the question itself plays (a piano note, say).

import { audio, startAudio } from "@/components/lesson/kit/audio/context";
import { playTone } from "@/components/lesson/kit/audio/synth";

const BLIP = { attack: 0.005, decay: 0.08, sustain: 0.35, release: 0.18 };

/** The "right!" chime, `delay` seconds from now. */
export function chime(delay = 0) {
  const { ctx } = startAudio(), t0 = ctx.currentTime + delay;
  playTone(1318.5, { level: 0.12, env: BLIP, when: t0, duration: 0.09 });
  playTone(1760, { level: 0.12, env: BLIP, when: t0 + 0.09, duration: 0.2 });
}

/** The "not quite" cue. */
export function bonk() {
  const { ctx } = audio(), t0 = ctx.currentTime;
  playTone(220, { wave: "triangle", level: 0.12, env: BLIP, when: t0, duration: 0.1 });
  playTone(174.6, { wave: "triangle", level: 0.12, env: BLIP, when: t0 + 0.1, duration: 0.22 });
}
