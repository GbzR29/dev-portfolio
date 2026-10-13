"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure, Readout, Row, Slider, useVisible } from "@/components/lesson/kit/figure";
import { startAudio } from "@/components/lesson/kit/audio/context";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";
import { notesReady, playNote } from "@/components/lesson/kit/audio/instrument";
import { loadStatus, SampleCredit, useNotes } from "@/components/lesson/kit/audio/useInstrument";
import { NoteSurface } from "@/components/lesson/kit/audio/NoteSurface";
import { useVoices } from "@/components/lesson/kit/audio/useVoices";
import { isBlack } from "@/components/lesson/kit/audio/notes";
import { diatonic } from "../staff";
import { valueName, type NoteValue } from "../notation";
import { spelledName, spellings, type Acc } from "../accidentals";
import { useRhythmPlayer } from "../useRhythmPlayer";
import { analyse, barLen, eventsOf, heldBefore, lenOf, METERS, PRESETS, splitAtBars, totalLen, type Item, type Meter, type Score } from "./model";
import { dAt, layout, NARROW, rangeOf, SYS_H, WIDE } from "./layout";
import { PHONE, useMediaQuery } from "@/components/lesson/kit/media";
import { beatsText, ScoreView } from "./ScoreView";
import { Palette, VALUE_KEYS, type Tool } from "./Palette";
import { useScore } from "./useScore";

// ── What this figure shows ────────────────────────────────────────────────────
// A small score editor that puts the Rhythm and Notes chapters to work. Pick
// a value in the palette and click the dashed slot at the end of the staff
// (or press a key, or a fret) to write a note; click a note to select it, and
// the palette, the arrows or a new key then change it. The editor reads the
// score as a musician would: it counts every bar (a note that runs over the
// bar line turns red and can be split with a tie), applies the bar-line rule
// to signs (a purple note sounds sharp or flat because of a sign written
// earlier in the bar) and plays it all back with a moving cursor. Undo,
// redo, the browser keeps the score, and a link shares it.

const RANGE_KEYS = { treble: [53, 84], bass: [36, 64] } as const;

const nearestOfLetter = (letter: number, ref: number) => {
  let best = ref;
  for (let d = ref - 3; d <= ref + 3; d++) if (((d % 7) + 7) % 7 === letter) best = d;
  return best;
};

export function MusicScoreEditorFigure({ t }: { t?: TrackTranslations }) {
  const { score, update, undo, redo, link } = useScore();
  const [sel, setSel] = useState<number | null>(null);
  const [tool, setTool] = useState<Tool>({ v: 4, dot: false, rest: false, acc: null, tie: false });
  const [ghost, setGhost] = useState<{ d: number } | null>(null);
  const [metro, setMetro] = useState(true);
  const [copied, setCopied] = useState(false);
  const [pressed, setPressed] = useState<ReadonlySet<number>>(new Set());
  const { inst, load, ensure } = useNotes();
  const vis = useVisible<HTMLDivElement>();
  const voices = useVoices(vis.on);
  const player = useRhythmPlayer(vis.on, { instrument: true });
  const svg = useRef<SVGSVGElement>(null);

  // On the guitar the treble staff is written an octave above the sound (chapter 10)
  const octaveClef = inst === "guitar" && score.clef === "treble", shift = octaveClef ? -12 : 0;
  const reads = useMemo(() => analyse(score), [score]);
  const phone = useMediaQuery(PHONE);
  const lay = useMemo(() => layout(score, reads, phone ? NARROW : WIDE), [score, reads, phone]);
  const range = rangeOf(score);
  const selIt = sel !== null ? score.items[sel] ?? null : null;
  const shown: Tool = selIt ? { v: selIt.v, dot: selIt.dot, rest: selIt.d === null, acc: selIt.acc, tie: selIt.tie } : tool;

  // ── Sound ───────────────────────────────────────────────────────────────────
  const sound = useCallback((key: number | null) => {
    if (key === null) return;
    startAudio();
    const m = key + shift;
    const go = () => { voices.start(m, playNote(m)); setTimeout(() => voices.release(m), 700); };
    if (notesReady()) go(); else ensure().then(go, () => {});
  }, [ensure, voices, shift]);
  /** Changes the score and sounds item i of the new score. */
  const edit = useCallback((fn: (s: Score) => Score, hear: number | null) => {
    player.stop();
    const next = fn(score);
    update(() => next);
    if (hear !== null && next.items[hear]) sound(analyse(next)[hear].key);
  }, [player, score, update, sound]);

  // ── Writing ─────────────────────────────────────────────────────────────────
  const append = (d: number | null, acc: Acc | null = tool.acc) => {
    const it: Item = { v: tool.v, dot: tool.dot && tool.v !== 16, d, acc: d === null ? null : acc, tie: d !== null && tool.tie };
    edit(s => ({ ...s, items: [...s.items, it] }), score.items.length);
    setTool(tl => ({ ...tl, acc: null, tie: false }));      // a sign and a tie belong to one note
  };
  const change = (i: number, patch: Partial<Item>) =>
    edit(s => ({ ...s, items: s.items.map((it, j) => (j === i ? { ...it, ...patch, dot: (patch.dot ?? it.dot) && (patch.v ?? it.v) !== 16 } : it)) }), i);
  /** A note at d: changes the selected item, or writes a new one at the end. */
  const put = (d: number, acc: Acc | null) => (sel !== null ? change(sel, { d, acc }) : append(d, acc));
  const remove = () => {
    const i = sel ?? score.items.length - 1;
    if (i < 0) return;
    edit(s => ({ ...s, items: s.items.filter((_, j) => j !== i) }), null);
    setSel(sel === null || score.items.length <= 1 ? null : Math.min(sel, score.items.length - 2));
  };
  const step = (dir: 1 | -1) => {
    const i = sel ?? score.items.length - 1, it = score.items[i];
    if (!it || it.d === null) return;
    change(i, { d: Math.max(range.lo, Math.min(range.hi, it.d + dir)) });
  };

  // ── The palette: the next note's tool, or the selected item ─────────────────
  const onValue = (v: NoteValue) => (sel !== null ? change(sel, { v }) : setTool(tl => ({ ...tl, v, dot: tl.dot && v !== 16 })));
  const onDot = () => (sel !== null ? change(sel, { dot: !shown.dot }) : setTool(tl => ({ ...tl, dot: !tl.dot })));
  const onRest = () => {
    if (sel === null) { setTool(tl => ({ ...tl, rest: !tl.rest })); return; }
    change(sel, selIt!.d === null ? { d: staffMid(score) } : { d: null, acc: null, tie: false });
  };
  const onAcc = (a: Acc | null) => (sel !== null ? change(sel, { acc: a }) : setTool(tl => ({ ...tl, acc: a })));
  const onTie = () => {
    // with nothing selected, the tie goes on the last note (it ties to the next one written)
    if (sel !== null) { change(sel, { tie: !selIt!.tie }); return; }
    const last = score.items.length - 1;
    if (last >= 0 && score.items[last].d !== null) change(last, { tie: !score.items[last].tie });
    else setTool(tl => ({ ...tl, tie: !tl.tie }));
  };

  // ── Pointer on the staff ────────────────────────────────────────────────────
  const where = (e: PointerEvent<SVGSVGElement>) => {
    const r = svg.current!.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * lay.width, y = ((e.clientY - r.top) / r.height) * lay.height;
    const sys = Math.min(lay.systems - 1, Math.floor(y / SYS_H));
    return { x, sys, d: Math.max(range.lo, Math.min(range.hi, dAt(score, y, sys))) };
  };
  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    const p = where(e);
    if (p.sys === lay.slot.sys && p.x >= lay.slot.x0) {
      setSel(null);
      append(tool.rest ? null : p.d);
      return;
    }
    const i = lay.items.findIndex(q => q && q.sys === p.sys && p.x >= q.x0 && p.x < q.x1);
    if (i < 0) { setSel(null); return; }
    // the first click selects; a click on the selected note moves it there
    if (i === sel && score.items[i].d !== null) change(i, { d: p.d });
    else { setSel(i); sound(reads[i].key); }
  };
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (e.pointerType !== "mouse" || tool.rest) { setGhost(null); return; }
    const p = where(e);
    const g = p.sys === lay.slot.sys && p.x >= lay.slot.x0 ? { d: p.d } : null;
    setGhost(o => (o?.d === g?.d ? o : g));
  };

  // ── Keys and frets ──────────────────────────────────────────────────────────
  const onKeyDown = (m: number) => {
    setPressed(s => new Set(s).add(m));
    // the written key; black keys are spelled with a sharp, or a flat when ♭ is chosen
    const w = m - shift, flat = shown.acc === -1;
    const sp = isBlack(w) ? spellings(w, 1).find(x => x.a === (flat ? -1 : 1))! : { d: diatonic(w)!, a: 0 as Acc };
    // write a sign only where the bar-line rule does not already give it
    put(sp.d, heldBefore(score, reads, sel ?? score.items.length, sp.d) === sp.a ? null : sp.a);
  };
  const onKeyUp = useCallback((m: number) => setPressed(s => { const n = new Set(s); n.delete(m); return n; }), []);

  const keys = (e: KeyboardEvent) => {
    const k = e.key, ctrl = e.ctrlKey || e.metaKey;
    // sliders keep their arrows; buttons keep space and enter
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || (tag === "BUTTON" && (k === " " || k === "Enter"))) return;
    const ref = selIt?.d ?? [...score.items].reverse().find(it => it.d !== null)?.d ?? staffMid(score);
    let done = true;
    if (ctrl && k.toLowerCase() === "z") (e.shiftKey ? redo : undo)();
    else if (ctrl && k.toLowerCase() === "y") redo();
    else if (ctrl) done = false;
    else if (/^[a-g]$/i.test(k)) put(nearestOfLetter("CDEFGAB".indexOf(k.toUpperCase()), ref), shown.acc);
    else if (VALUE_KEYS[k]) onValue(VALUE_KEYS[k]);
    else if (k === ".") onDot();
    else if (k === "0") { if (sel !== null) onRest(); else append(null); }
    else if (k === "t") onTie();
    else if (k === "ArrowUp") step(1);
    else if (k === "ArrowDown") step(-1);
    else if (k === "ArrowLeft") setSel(s => (s === null ? (score.items.length ? score.items.length - 1 : null) : Math.max(0, s - 1)));
    else if (k === "ArrowRight") setSel(s => (s === null || s >= score.items.length - 1 ? null : s + 1));
    else if (k === "Backspace" || k === "Delete") remove();
    else if (k === "Escape") setSel(null);
    else if (k === " ") play();
    else done = false;
    if (done) e.preventDefault();
  };
  // The keys work wherever the focus is inside the figure (the palette's buttons too)
  const keysRef = useRef(keys);
  useEffect(() => { keysRef.current = keys; });
  useEffect(() => {
    const fig = vis.ref.current?.closest("figure");
    if (!fig) return;
    const on = (e: globalThis.KeyboardEvent) => keysRef.current(e);
    fig.addEventListener("keydown", on);
    return () => fig.removeEventListener("keydown", on);
  }, [vis.ref]);

  // ── Playing ─────────────────────────────────────────────────────────────────
  const total = totalLen(score), bl = barLen(score), bars = Math.ceil(total / bl);
  const play = () => {
    if (player.playing) { player.stop(); return; }
    if (!score.items.length) return;
    player.play(eventsOf(score, reads, shift), score.bpm, { beats: bars * score.meter, clicks: metro, accentEvery: score.meter });
  };
  const sounding = player.pos === null ? null
    : reads.findIndex((r, i) => player.pos! * 4 >= r.start && player.pos! * 4 < r.start + lenOf(score.items[i]));

  // ── What the editor says ────────────────────────────────────────────────────
  const crossing = reads.findIndex(r => r.crosses), badTie = reads.findIndex(r => r.tieBad);
  const open = total % bl, status = load === "loading" || load === "error" ? loadStatus(t, inst, load) : null;
  const copy = () => {
    navigator.clipboard?.writeText(link()).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }, () => {});
  };

  return (
    <Figure title={tx(t, "figMus_seTitle", "Score editor")}
      head={<SoundButton on={player.playing} onClick={play}>
        {player.playing ? tx(t, "figMus_stop", "stop") : tx(t, "figMus_sePlay", "play the score")}
      </SoundButton>}
      controls={<>
        <Palette t={t} tool={shown} onValue={onValue} onDot={onDot} onRest={onRest} onAcc={onAcc} onTie={onTie} />
        <Row>
          {sel !== null && selIt
            ? <>
              <Readout color={C.blue}>
                {selIt.d === null ? tx(t, "figMus_seRestWord", "rest") : spelledName({ d: selIt.d, a: reads[sel].a })}
                {" · "}{valueName(t, selIt.v)}{selIt.dot ? ` ${tx(t, "figMus_seDotted", "dotted")}` : ""} · {beatsText(lenOf(selIt))} {tx(t, "figMus_seBeats", "beats")}
              </Readout>
              {reads[sel].carried && <Readout color={C.purple}>{tx(t, "figMus_seCarried", "sign carried from earlier in the bar")}</Readout>}
            </>
            : <Readout>{tx(t, "figMus_seNext", "next")}: {shown.rest ? tx(t, "figMus_seRestWord", "rest") : valueName(t, shown.v)}{shown.dot ? ` ${tx(t, "figMus_seDotted", "dotted")}` : ""}</Readout>}
          <Readout>
            {bars === 0 ? tx(t, "figMus_seEmpty", "empty score")
              : open === 0 ? `${bars} ${tx(t, "figMus_seBarsFull", "full bars")}`
              : `${tx(t, "figMus_seBar", "bar")} ${bars}: ${beatsText(open)} ${tx(t, "figMus_seOf", "of")} ${score.meter} ${tx(t, "figMus_seBeats", "beats")}`}
          </Readout>
        </Row>
        {crossing >= 0 && (
          <Row>
            <Readout color={C.red}>{tx(t, "figMus_seCrosses", "a note runs over the bar line in bar")} {reads[crossing].bar + 1}</Readout>
            <Btn onClick={() => {
              edit(s => ({ ...s, items: splitAtBars(s, reads, crossing) }), null);
              setSel(null);
              vis.ref.current?.focus({ preventScroll: true });     // the button goes away: keep the keys working
            }}>
              {tx(t, "figMus_seSplit", "split it with a tie")}
            </Btn>
          </Row>
        )}
        {badTie >= 0 && <Row><Readout color={C.red}>{tx(t, "figMus_seBadTie", "a tie joins two notes of the same pitch: this one has nothing to hold on to")}</Readout></Row>}
        <Row>
          <Btn onClick={undo}>{tx(t, "figMus_seUndo", "undo")}</Btn>
          <Btn onClick={redo}>{tx(t, "figMus_seRedo", "redo")}</Btn>
          <Btn onClick={remove}>{sel !== null ? tx(t, "figMus_seDelete", "delete") : tx(t, "figMus_seDeleteLast", "delete the last")}</Btn>
          <span className="w-px h-5 bg-[var(--border)] mx-1" />
          <Btn onClick={() => { edit(() => PRESETS.ode, null); setSel(null); }}>{tx(t, "figMus_seOde", "Ode to Joy")}</Btn>
          <Btn onClick={() => { edit(() => PRESETS.twinkle, null); setSel(null); }}>{tx(t, "figMus_seTwinkle", "Twinkle")}</Btn>
          <Btn onClick={() => { edit(s => ({ ...s, items: [] }), null); setSel(null); }}>{tx(t, "figMus_stClear", "clear")}</Btn>
          <span className="w-px h-5 bg-[var(--border)] mx-1" />
          <Btn onClick={copy}>{copied ? tx(t, "figMus_seCopied", "link copied") : tx(t, "figMus_seLink", "copy a link")}</Btn>
        </Row>
        <Row>
          <Choice value={score.clef} onChange={c => edit(s => ({ ...s, clef: c }), null)} options={[
            ["treble", tx(t, "figMus_seTreble", "treble clef")], ["bass", tx(t, "figMus_seBass", "bass clef")],
          ]} />
          <span className="w-px h-5 bg-[var(--border)] mx-1" />
          <Choice value={String(score.meter)} onChange={m => edit(s => ({ ...s, meter: Number(m) as Meter }), null)}
            options={METERS.map(m => [String(m), `${m}/4`] as const)} />
          <span className="w-px h-5 bg-[var(--border)] mx-1" />
          <Btn active={metro} onClick={() => setMetro(m => !m)}>{tx(t, "figMus_seMetro", "metronome")}</Btn>
        </Row>
        <Slider label={tx(t, "figMus_seTempo", "tempo (♩/min)")} value={score.bpm} min={40} max={200} step={1}
          onChange={v => update(s => ({ ...s, bpm: v }), false)} fmt={v => `${v}`} width="w-28" />
        <VolumeSlider t={t} />
        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed" data-mouse-only>
          {tx(t, "figMus_seKeys", "Keys (click the score first): A–G write a note, 3–7 pick sixteenth … whole, . dot, 0 rest, t tie, ↑ ↓ move a note, ← → select, Backspace delete, Ctrl+Z undo, space play.")}
        </p>
      </>}
      note={<>
        {tx(t, "figMus_seNote", "Pick a value, then click the dashed slot at the end to write it, at the height you click; or press keys on the instrument below, which also spells black keys and adds signs only where the bar-line rule needs them. Click a note to select it: the palette, the arrows and the instrument then change that note, and a second click on it moves it. The editor counts every bar: a note that runs past the bar line turns red, and the button splits it into two notes joined by a tie. Purple notes have no sign of their own, but sound sharp or flat because of one written earlier in the same bar. Your score stays in this browser, and the link opens it anywhere.")}
        {" "}<SampleCredit t={t} />
      </>}>
      <div ref={vis.ref} tabIndex={0} className="outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40"
        aria-label={tx(t, "figMus_seAria", "score editor: click the score, then type notes")}>
        <div className="px-1 pt-2">
          <ScoreView score={score} reads={reads} lay={lay} sel={sel} sounding={sounding !== null && sounding >= 0 ? sounding : null}
            ghost={ghost} octaveClef={octaveClef} svgRef={svg}
            onPointerDown={e => { (e.currentTarget.closest("[tabindex]") as HTMLElement | null)?.focus({ preventScroll: true }); onPointerDown(e); }}
            onPointerMove={onPointerMove} onPointerLeave={() => setGhost(null)}
            emptyHint={tx(t, "figMus_seEmptyHint", "click here to write the first note")} />
        </div>
        <div className="px-3 pb-3 mx-auto w-full" style={{ maxWidth: 560 }}>
          <NoteSurface t={t} lo={octaveClef ? 40 : RANGE_KEYS[score.clef][0]} hi={octaveClef ? 76 : RANGE_KEYS[score.clef][1]}
            pressed={pressed} onDown={onKeyDown} onUp={onKeyUp} labels="c"
            ariaLabel={tx(t, "figMus_seKeysAria", "keyboard that writes notes on the score")}
            guitarAriaLabel={tx(t, "figMus_seNeckAria", "guitar neck that writes notes on the score")} />
          {status && <span className="text-[11px] font-mono text-[var(--text-muted)]">{status}</span>}
        </div>
      </div>
    </Figure>
  );
}

/** The middle line of the score's staff. */
const staffMid = (s: Score) => (s.clef === "bass" ? 22 : 34);
