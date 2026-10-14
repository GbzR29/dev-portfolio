"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Choice, Figure, Readout, Row } from "@/components/lesson/kit/figure";
import { useStepper } from "@/components/lesson/kit/Stepper";
import { Transport } from "@/components/lesson/kit/Transport";
import { lifeSnapshots, type Obj, type ObjState } from "./lifeModel";
import { LIFE_PROGRAMS, type LifeProgramId } from "./lifePrograms";

// ── What this figure shows ────────────────────────────────────────────────────
// A short C++ program on the left, run one step at a time; on the right, its
// scopes as nested boxes and the objects alive in each, with member objects
// drawn inside the object that holds them. Colours give each object's stage:
// amber while its constructor has not finished, blue when complete, red while
// it is being destroyed. The console shows what the constructors and
// destructors print. "No destructors" mode skips every call the compiler
// inserts at the end of a scope, the way C behaves, and the summary then lists
// the resources nobody released.

const STATE_COL: Record<ObjState, string> = { building: C.amber, alive: C.sky, dying: C.red, dead: C.red };

export function LifetimeFigure({ t, programs }: { t?: TrackTranslations; programs: LifeProgramId[] }) {
  const [pid, setPid] = useState<LifeProgramId>(programs[0]);
  const [noDtors, setNoDtors] = useState(false);
  const prog = LIFE_PROGRAMS[pid];
  const snaps = useMemo(() => lifeSnapshots(prog, noDtors), [prog, noDtors]);
  const s = useStepper(snaps.length - 1, 900, 500);
  const k = Math.max(0, Math.min(snaps.length - 1, Math.floor(s.raw + 1e-9)));
  const snap = snaps[k];
  const st = snap.state;
  const alive = st.scopes.filter(sc => !sc.closed).flatMap(sc => sc.objs).filter(o => o.state !== "dead").length;

  const choose = (id: LifeProgramId) => { setPid(id); s.restart(); };
  const toggle = (v: boolean) => { setNoDtors(v); s.restart(); };

  const stateName = (o: Obj) => o.state === "building" ? tx(t, "figCppLife_building", "being built")
    : o.state === "dying" ? tx(t, "figCppLife_dying", "being destroyed")
      : o.state === "dead" ? tx(t, "figCppLife_dead", "destroyed")
        : tx(t, "figCppLife_alive", "alive");

  const drawObj = (o: Obj, all: Obj[]) => {
    const kids = all.filter(x => x.parent === o.id);
    const col = STATE_COL[o.state];
    const hot = snap.touched.has(o.id);
    return (
      <div key={o.id} className="rounded-lg border px-2.5 py-1.5 bg-[var(--code-surface)] transition-opacity"
        style={{ borderColor: col, borderWidth: hot ? 2 : 1, opacity: o.state === "dead" ? 0.45 : 1 }}>
        <div className="flex items-baseline gap-2 flex-wrap font-mono text-[12px]">
          <span className={`font-bold text-[var(--text-main)] ${o.state === "dead" ? "line-through" : ""}`}>{o.name}</span>
          <span className="text-[var(--text-muted)] text-[11px]">{o.type}</span>
          <span className="ml-auto text-[10.5px]" style={{ color: col }}>{stateName(o)}</span>
        </div>
        {o.res && <div className="font-mono text-[10.5px] text-[var(--text-muted)]">{tx(t, "figCppLife_owns", "owns")}: {o.res}</div>}
        {kids.length > 0 && <div className="mt-1.5 ml-2 flex flex-col gap-1.5">{kids.map(c => drawObj(c, all))}</div>}
      </div>
    );
  };

  return (
    <Figure
      title={tx(t, "figCppLife_title", "Lifetime: when constructors and destructors run")}
      head={programs.length > 1 ? (
        <Choice value={pid} onChange={choose}
          options={programs.map(id => [id, tx(t, `figCppLife_name_${id}`, NAMES[id])] as [LifeProgramId, string])} />
      ) : undefined}
      controls={<>
        <Row>
          <Readout>{tx(t, "figCppLife_aliveN", "objects alive")}: {alive}</Readout>
          <Readout color={st.leaks.length ? C.red : undefined}>
            {tx(t, "figCppLife_held", "resources never released")}: {st.leaks.length ? st.leaks.join(", ") : "0"}
          </Readout>
        </Row>
        <label className="flex items-center gap-2 text-[12px] text-[var(--text-main)] cursor-pointer select-none">
          <input type="checkbox" checked={noDtors} onChange={e => toggle(e.target.checked)} className="accent-[var(--primary)]" />
          {tx(t, "figCppLife_noDtors", "Break it: no destructors (what C does)")}
        </label>
      </>}
      note={tx(t, "figCppLife_note", "Amber: under construction. Blue: complete. Red: being destroyed. With destructors switched off, objects simply vanish at the end of their scope and whatever they owned stays taken: in C, that is the cleanup call you had to remember yourself.")}
    >
      <div className="grid 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* ── Code ── */}
        <div className="p-3 2xl:border-r border-b 2xl:border-b-0 border-[var(--border)] flex flex-col gap-3 min-w-0">
          <ol className="font-mono text-[12px] leading-[1.55] overflow-x-auto">
            {prog.code.map((ln, i) => (
              <li key={i} className={`flex items-start gap-2 rounded px-1 ${snap.line === i ? "bg-[var(--primary-low)]" : ""}`}>
                <span className="w-4 shrink-0 text-right text-[var(--text-muted)] opacity-60 select-none">{i + 1}</span>
                <span className={`whitespace-pre flex-1 ${snap.line === i ? "text-[var(--text-main)]" : "text-[var(--text-muted)]"}`}>{ln}</span>
              </li>
            ))}
          </ol>
          <p className="text-[13px] leading-relaxed text-[var(--text-main)] min-h-[4.5rem]" aria-live="polite">{tx(t, snap.key, snap.en)}</p>
        </div>

        {/* ── Scopes and objects ── */}
        <div className="min-w-0 flex flex-col">
          <div className="p-3 flex-1 flex flex-col gap-2 min-h-[13rem]">
            {st.scopes.length === 0 && <span className="text-[12px] text-[var(--text-muted)]">{tx(t, "figCppLife_empty", "Nothing is running yet.")}</span>}
            {st.scopes.map((sc, depth) => {
              const all = sc.objs;
              return (
                <div key={sc.uid} className="rounded-lg border border-dashed px-2.5 py-2 flex flex-col gap-1.5"
                  style={{ marginLeft: depth * 14, borderColor: "var(--code-border)", opacity: sc.closed ? 0.45 : 1 }}>
                  <div className="flex items-baseline gap-2 font-mono text-[11px]">
                    <span className="text-[var(--text-main)] font-bold">{sc.label}</span>
                    <span className="text-[var(--text-muted)]">{sc.closed ? tx(t, "figCppLife_closed", "scope ended") : tx(t, "figCppLife_scope", "scope")}</span>
                  </div>
                  {all.filter(o => !o.parent).map(o => drawObj(o, all))}
                </div>
              );
            })}
          </div>
          <div className="px-3 pb-3">
            <div className="rounded-lg bg-[var(--code-surface)] border border-[var(--code-border)] px-3 py-2 font-mono text-[11.5px] leading-[1.5] min-h-[3rem]">
              <div className="uppercase tracking-wider text-[10px] text-[var(--text-muted)] mb-0.5">{tx(t, "figCppLife_output", "output")}</div>
              {st.out.length ? st.out.map((l, i) => (
                <div key={i} style={{ color: l.startsWith("-") || l.startsWith("close") ? C.red : C.green }}>{l}</div>
              )) : <div className="text-[var(--text-muted)]">—</div>}
            </div>
          </div>
          <Transport t={t} playing={s.playing} onPlay={s.play} onStep={s.next} onBack={s.prev} onReset={s.restart} speed
            readout={`${tx(t, "figCppLife_step", "step")} ${k + 1} / ${snaps.length}`} />
        </div>
      </div>
    </Figure>
  );
}

const NAMES: Record<LifeProgramId, string> = {
  scopes: "scopes",
  members: "members",
  early: "early return",
};
