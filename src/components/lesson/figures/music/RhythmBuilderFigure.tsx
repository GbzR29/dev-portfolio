"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Figure, Readout, Row, Slider, T, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";
import { NoteGlyph, RestGlyph, VALUES, beatsOf, valueName, type NoteValue } from "./notation";
import { useRhythmPlayer, type RhythmEvent } from "./useRhythmPlayer";

// ── What this figure shows ────────────────────────────────────────────────────
// A rhythm builder: two bars of four beats to fill with notes and rests.
// Pick a value in the palette (with or without a dot, as a note or a rest)
// and it is added after the last one, if it still fits. The ruler below adds
// up the beats; the bar fills with a coloured block per note, as long as the
// note lasts. Three famous openings show halves and quarters (Twinkle), a
// dotted quarter (Jingle Bells) and rests (Beethoven's Fifth). The reader's
// own notes all sound on one key: rhythm only, pitch comes later.

const W = 600, H = 176, X0 = 24, X1 = 584, BEATS = 8, BAR = 4;
const NOTE_Y = 66, BLOCK_Y = 92, RULER_Y = 128;
const COLOR: Record<NoteValue, string> = { 1: C.sky, 2: C.teal, 4: C.green, 8: C.amber, 16: C.pink };
const OWN = 67;                                               // G4: the key the reader's own notes play on

type Item = { v: NoteValue; dots: number; rest: boolean; midi: number };

const n = (v: NoteValue, midi: number, dots = 0): Item => ({ v, dots, rest: false, midi });
const r = (v: NoteValue): Item => ({ v, dots: 0, rest: true, midi: 0 });

const PRESETS: { id: string; name: string; items: Item[] }[] = [
  { id: "twinkle", name: "Twinkle, Twinkle", items: [
    n(4, 60), n(4, 60), n(4, 67), n(4, 67), n(4, 69), n(4, 69), n(2, 67),
  ] },
  { id: "jingle", name: "Jingle Bells", items: [
    n(4, 64), n(4, 67), n(4, 60, 1), n(8, 62), n(1, 64),
  ] },
  { id: "fifth", name: "Beethoven 5", items: [
    r(8), n(8, 67), n(8, 67), n(8, 67), n(2, 63), r(8), n(8, 65), n(8, 65), n(8, 65), n(2, 62),
  ] },
];

const lenOf = (it: Item) => beatsOf(it.v, it.dots);
const xB = (b: number) => X0 + (b / BEATS) * (X1 - X0);
const fmt = (b: number) => (Number.isInteger(b) ? String(b) : b.toFixed(b * 4 === Math.round(b * 4) ? 2 : 3).replace(/0+$/, ""));

/** Each item with its start in beats. */
const layout = (items: Item[]) => items.map((it, i) => ({ it, at: items.slice(0, i).reduce((s, x) => s + lenOf(x), 0) }));

function PaletteGlyph({ v, dots, rest }: { v: NoteValue; dots: number; rest: boolean }) {
  return (
    <svg viewBox="-9 -28 30 40" width={22} height={30} aria-hidden>
      {rest ? <RestGlyph x={0} y={0} value={v} dots={dots} color="currentColor" /> : <NoteGlyph x={0} y={0} value={v} dots={dots} color="currentColor" />}
    </svg>
  );
}

export function MusicRhythmBuilderFigure({ t }: { t?: TrackTranslations }) {
  const [items, setItems] = useState<Item[]>(PRESETS[0].items);
  const [dot, setDot] = useState(false);
  const [rest, setRest] = useState(false);
  const [bpm, setBpm] = useState(100);
  const [clicks, setClicks] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const vis = useVisible<HTMLDivElement>();
  const player = useRhythmPlayer(vis.on);
  const head = useRef<SVGLineElement>(null);

  useFrame(vis.on && player.playing, () => {
    const x = String(xB(Math.max(0, Math.min(BEATS, player.now()))));
    head.current?.setAttribute("x1", x);
    head.current?.setAttribute("x2", x);
  });

  const placed = layout(items);
  const used = items.reduce((s, x) => s + lenOf(x), 0);
  const left = BEATS - used;

  const edit = (next: Item[]) => { player.stop(); setItems(next); setMsg(null); };
  const add = (v: NoteValue) => {
    const it: Item = { v, dots: dot && v > 1 ? 1 : 0, rest, midi: OWN };
    if (lenOf(it) > left + 1e-9) {
      setMsg(tx(t, "figMus_rbNoFit", "does not fit: it lasts {a} beats, only {b} left").replace("{a}", fmt(lenOf(it))).replace("{b}", fmt(left)));
      return;
    }
    edit([...items, it]);
  };
  const play = () => {
    if (player.playing) return player.stop();
    const events: RhythmEvent[] = placed.map(({ it, at }) => ({ at, len: lenOf(it), midi: it.rest ? null : it.midi }));
    player.play(events, bpm, { beats: BEATS, clicks });
  };
  const lit = (at: number, len: number) => player.pos !== null && player.pos >= at && player.pos < at + len;

  return (
    <Figure title={tx(t, "figMus_rbTitle", "Build a rhythm: two bars of four beats")}
      head={<>{PRESETS.map(p => <Btn key={p.id} onClick={() => edit(p.items)}>{tx(t, `figMus_rb_${p.id}`, p.name)}</Btn>)}</>}
      controls={<>
        <div className="flex flex-wrap gap-1.5 items-center">
          {VALUES.map(v => (
            <button key={v} type="button" onClick={() => add(v)} title={valueName(t, v)}
              className="h-11 px-2 flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text-main)] hover:border-[var(--primary)]/50 hover:text-[var(--primary)] transition-all">
              <PaletteGlyph v={v} dots={dot && v > 1 ? 1 : 0} rest={rest} />
              <span className="text-[10px] font-mono" style={{ color: COLOR[v] }}>{fmt(beatsOf(v, dot && v > 1 ? 1 : 0))}</span>
            </button>
          ))}
          <Btn active={dot} onClick={() => setDot(d => !d)}>{tx(t, "figMus_rbDot", "dotted")}</Btn>
          <Btn active={rest} onClick={() => setRest(x => !x)}>{tx(t, "figMus_rbRest", "rest")}</Btn>
          <Btn onClick={() => edit(items.slice(0, -1))}>{tx(t, "figMus_rbUndo", "undo")}</Btn>
          <Btn onClick={() => edit([])}>{tx(t, "figMus_rbClear", "clear")}</Btn>
        </div>
        <Slider label={tx(t, "figMus_rbBpm", "tempo (BPM)")} value={bpm} min={50} max={160} step={1}
          onChange={v => { player.stop(); setBpm(v); }} fmt={v => `${v} BPM`} width="w-28" />
        <Row>
          <Btn active={clicks} onClick={() => setClicks(c => !c)}>{tx(t, "figMus_rbClicks", "click on every beat")}</Btn>
          <Readout color={left === 0 ? C.green : undefined}>{fmt(used)} / {BEATS} {tx(t, "figMus_rbBeats", "beats")}{left === 0 ? ` · ${tx(t, "figMus_rbFull", "full")}` : ""}</Readout>
          <Readout>{fmt(used)} × 60/{bpm} = {((used * 60) / bpm).toFixed(2)} s</Readout>
          {msg && <Readout color={C.red}>{msg}</Readout>}
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={tx(t, "figMus_rbNote", "Load a tune, play it, then clear and build your own. The number on each palette button is how many beats that value lasts; switch on \"dotted\" and every number grows by half. A note that would not fit in what is left of the two bars is refused. Rests are silent but still take their beats: listen to how the rests in Beethoven's Fifth make the notes come late.")}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none">
          {/* the single line the rhythm is written on, and the bar lines */}
          <line x1={X0} x2={X1} y1={NOTE_Y} y2={NOTE_Y} stroke={C.grid} />
          {[0, BAR, BEATS].map(b => <line key={b} x1={xB(b)} x2={xB(b)} y1={NOTE_Y - 26} y2={RULER_Y} stroke={C.axis} strokeWidth={b === BEATS ? 3 : 1.5} />)}
          <T x={xB(0) + 4} y={22} size={8.5}>{tx(t, "figMus_rbBar", "bar")} 1</T>
          <T x={xB(BAR) + 4} y={22} size={8.5}>{tx(t, "figMus_rbBar", "bar")} 2</T>

          {/* what is left, hatched */}
          {left > 0 && <rect x={xB(used)} y={BLOCK_Y - 2} width={xB(BEATS) - xB(used)} height={14} fill={C.grid} opacity={0.5} />}
          {left > 0 && <T x={(xB(used) + xB(BEATS)) / 2} y={BLOCK_Y + 26} anchor="middle" size={8}>{fmt(left)} {tx(t, "figMus_rbBeatsLeft", "beats left")}</T>}

          {placed.map(({ it, at }, i) => {
            const a = xB(at), b = xB(at + lenOf(it)), on = lit(at, lenOf(it)), col = it.rest ? C.muted : COLOR[it.v];
            return (
              <g key={i}>
                {it.rest
                  ? <RestGlyph x={a + 9} y={NOTE_Y} value={it.v} dots={it.dots} color={on ? C.purple : C.fg} scale={0.9} />
                  : <NoteGlyph x={a + 9} y={NOTE_Y} value={it.v} dots={it.dots} color={on ? COLOR[it.v] : C.fg} scale={0.9} />}
                <rect x={a + 1} y={BLOCK_Y} width={Math.max(2, b - a - 3)} height={10} rx={3}
                  fill={it.rest ? "none" : col} stroke={it.rest ? col : "none"} strokeDasharray={it.rest ? "3 3" : undefined}
                  opacity={on ? 1 : 0.55} />
              </g>
            );
          })}

          {/* beat ruler */}
          {Array.from({ length: BEATS * 4 + 1 }, (_, q) => (
            <line key={q} x1={xB(q / 4)} x2={xB(q / 4)} y1={RULER_Y + 8} y2={RULER_Y + 8 + (q % 4 === 0 ? 8 : 3)} stroke={C.axis} />
          ))}
          {Array.from({ length: BEATS }, (_, b) => (
            <T key={b} x={xB(b) + 3} y={RULER_Y + 30} size={9} bold={b % BAR === 0} color={C.fg}>{(b % BAR) + 1}</T>
          ))}
          <line ref={head} x1={X0} x2={X0} y1={NOTE_Y - 30} y2={RULER_Y + 16} stroke={C.fg} strokeWidth={1.2} opacity={player.playing ? 0.6 : 0} />
        </svg>
        <div className="px-3 pb-3 flex items-center gap-3">
          <SoundButton on={player.playing} onClick={play}>
            {player.playing ? tx(t, "figMus_stop", "stop") : tx(t, "figMus_rbPlay", "play the rhythm")}
          </SoundButton>
          {player.load === "loading" && <span className="text-[11px] font-mono text-[var(--text-muted)]">{tx(t, "figMus_loading", "loading the piano (1.3 MB)…")}</span>}
        </div>
      </div>
    </Figure>
  );
}
