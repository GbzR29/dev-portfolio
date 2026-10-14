"use client";

import { useMemo, useState, type ReactNode } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Choice, Figure, Row } from "@/components/lesson/kit/figure";
import { useStepper } from "@/components/lesson/kit/Stepper";
import { Transport } from "@/components/lesson/kit/Transport";
import {
  FN, OBJ_ADDR, OBJ_SIZE, PATH_ADDR, VT_ADDR, callSteps, compileError, fnName, sourceLines, vtable,
  type CallId, type Cls, type FnId, type Switches,
} from "./vtableModel";

// ── What this figure shows ────────────────────────────────────────────────────
// A virtual call taken apart. Enemy* e points at an Enemy, a Slime or a Bat;
// the call e->update(), e->hit() or delete e is run one step at a time across
// the four places it touches: the pointer on the stack, the object on the heap
// (with its hidden vptr), the three vtables in read-only data, and the
// functions in the code. "Break it" switches: drop virtual from update or from
// the destructor, give Bat's update the wrong parameter type, and write or
// omit override (which turns the last two mistakes into compile errors).

const CLS_COL: Record<Cls, string> = { Enemy: C.sky, Slime: C.green, Bat: C.purple };
const fnCls = (id: FnId): Cls => id[0] === "S" ? "Slime" : id[0] === "B" ? "Bat" : "Enemy";
const CLASSES: Cls[] = ["Enemy", "Slime", "Bat"];

export function VtableFigure({ t }: { t?: TrackTranslations }) {
  const [cls, setCls] = useState<Cls>("Bat");
  const [call, setCall] = useState<CallId>("update");
  const [sw, setSw] = useState<Switches>({ vUpdate: true, vDtor: true, typo: false, override: true });
  const error = compileError(sw);
  const lines = useMemo(() => sourceLines(cls, call, sw), [cls, call, sw]);
  const steps = useMemo(() => callSteps(cls, call, sw), [cls, call, sw]);
  const s = useStepper(steps.length - 1, 1000, 500);
  const k = Math.max(0, Math.min(steps.length - 1, Math.floor(s.raw + 1e-9)));
  const step = steps[k];
  const hi = new Set(error ? [] : step.hi);
  const curLine = error ? -1 : lines.findIndex(l => l.tag === step.tag);

  const restart = () => s.restart();
  const pickCls = (c: Cls) => { setCls(c); restart(); };
  const pickCall = (c: CallId) => { setCall(c); restart(); };
  const flip = (key: keyof Switches) => (v: boolean) => { setSw({ ...sw, [key]: v }); restart(); };

  const fill = (txt: string) => txt
    .replace(/\{cls\}/g, cls)
    .replace(/\{fn\}/g, step.fn ? fnName(step.fn, sw) : "")
    .replace(/\{addr\}/g, step.fn ? FN[step.fn].addr : "")
    .replace(/\{slot\}/g, String(step.slot ?? ""))
    .replace(/\{size\}/g, String(OBJ_SIZE[cls]));

  const objGone = step.obj === "freed";
  const fields: [string, string, ReactNode, boolean][] = [
    ["+0", "vptr", <span key="v" style={{ color: CLS_COL[cls] }}>{VT_ADDR[cls]} → vtable {cls}</span>, hi.has("vptr")],
    ["+8", "int hp", String(step.hp), false],
  ];
  if (cls === "Slime") fields.push(["+12", "float size", "1.0", false]);
  if (cls === "Bat") fields.push(["+16", "std::vector path", `{${PATH_ADDR}, 3, 3}`, hi.has("path")]);

  const fnList: FnId[] = ["E_dtor", "E_upd", "E_hit", "S_dtor", "S_upd", "S_hit", "B_dtor", "B_upd"];
  const inTable = new Set(CLASSES.flatMap(c => vtable(c, sw).map(sl => sl.target)));

  const panel = (label: string, children: ReactNode, wide = false) => (
    <div className={`min-w-0 flex flex-col gap-1.5 ${wide ? "md:col-span-2" : ""}`}>
      <div className="uppercase tracking-wider text-[10px] text-[var(--text-muted)]">{label}</div>
      {children}
    </div>
  );
  const box = (on: boolean, color: string, children: ReactNode, faded = false) => (
    <div className="rounded-lg border bg-[var(--code-surface)] px-2.5 py-1.5 font-mono text-[11.5px] transition-all"
      style={{ borderColor: on ? color : "var(--code-border)", borderWidth: on ? 2 : 1, opacity: faded ? 0.4 : 1 }}>
      {children}
    </div>
  );

  return (
    <Figure
      title={tx(t, "figCppVt_title", "A virtual call, step by step: pointer, vptr, vtable, function")}
      controls={<>
        <Row>
          <span className="text-[12px] text-[var(--text-main)] mr-1">{tx(t, "figCppVt_points", "e points at a")}</span>
          <Choice value={cls} onChange={pickCls} options={CLASSES.map(c => [c, c] as [Cls, string])} />
        </Row>
        <Row>
          <span className="text-[12px] text-[var(--text-main)] mr-1">{tx(t, "figCppVt_call", "and the program runs")}</span>
          <Choice value={call} onChange={pickCall} options={[["update", "e->update()"], ["hit", "e->hit(4)"], ["delete", "delete e"]]} />
        </Row>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
          {([
            ["vUpdate", tx(t, "figCppVt_swUpd", "virtual on Enemy::update")],
            ["vDtor", tx(t, "figCppVt_swDtor", "virtual on Enemy::~Enemy")],
            ["typo", tx(t, "figCppVt_swTypo", "Break it: Bat::update takes a double")],
            ["override", tx(t, "figCppVt_swOv", "write override in Slime and Bat")],
          ] as [keyof Switches, string][]).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-[12px] text-[var(--text-main)] cursor-pointer select-none">
              <input type="checkbox" checked={sw[key]} onChange={e => flip(key)(e.target.checked)} className="accent-[var(--primary)]" />
              {label}
            </label>
          ))}
        </div>
      </>}
      note={tx(t, "figCppVt_note", "Break it: untick virtual on update and call it on a Bat; untick virtual on the destructor and delete a Bat; then give Bat's update a double. Each time, untick override too, to see the silent version of the bug. The real table built by GCC and Clang also holds the type's identity (for dynamic_cast) and two destructor entries; this one keeps only the slots you call.")}
    >
      <div className="grid 2xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        {/* ── Code ── */}
        <div className="p-3 2xl:border-r border-b 2xl:border-b-0 border-[var(--border)] flex flex-col gap-3 min-w-0">
          <ol className="font-mono text-[11.5px] leading-[1.55] overflow-x-auto">
            {lines.map((ln, i) => (
              <li key={i} className={`flex items-start gap-2 rounded px-1 ${curLine === i ? "bg-[var(--primary-low)]" : ""}`}>
                <span className="w-4 shrink-0 text-right text-[var(--text-muted)] opacity-60 select-none">{i + 1}</span>
                <span className={`whitespace-pre flex-1 ${curLine === i ? "text-[var(--text-main)]" : "text-[var(--text-muted)]"}`}>{ln.text}</span>
              </li>
            ))}
          </ol>
          {error
            ? <pre className="rounded-lg border px-3 py-2 font-mono text-[11.5px] whitespace-pre-wrap" style={{ borderColor: C.red, color: C.red }}>
              {error}
              <div className="font-sans text-[12.5px] text-[var(--text-main)] mt-1">
                {tx(t, "figCppVt_errBody", "override promises that the function replaces a virtual function of the base. Here there is no such function to replace, so the compiler stops. Without override, the same mistake compiles and quietly calls the wrong function.")}
              </div>
            </pre>
            : <p className="text-[13px] leading-relaxed text-[var(--text-main)] min-h-[4.5rem]" aria-live="polite">{fill(tx(t, step.key, step.en))}</p>}
        </div>

        {/* ── Memory ── */}
        <div className="min-w-0 flex flex-col" style={{ opacity: error ? 0.35 : 1 }}>
          <div className="p-3 grid md:grid-cols-2 gap-3">
            {panel(tx(t, "figCppVt_stack", "stack"), box(hi.has("ptr"), C.amber,
              <>Enemy* e = <span className="text-[var(--text-main)]">{OBJ_ADDR}</span></>))}
            {panel(`${tx(t, "figCppVt_heap", "heap")} · ${OBJ_ADDR}`, <>
              {box(hi.has("obj"), CLS_COL[cls], <>
                <div className="flex justify-between gap-2 mb-0.5">
                  <span className="font-bold" style={{ color: CLS_COL[cls] }}>{cls}</span>
                  <span className="text-[var(--text-muted)]">{OBJ_SIZE[cls]} bytes{objGone ? ` · ${tx(t, "figCppVt_freed", "freed")}` : step.obj === "dying" ? ` · ${tx(t, "figCppVt_dying", "being destroyed")}` : ""}</span>
                </div>
                {fields.map(([off, name, val, on]) => (
                  <div key={off} className="grid grid-cols-[2.2rem_minmax(0,1fr)] gap-x-2 rounded px-1" style={{ background: on ? "var(--primary-low)" : undefined }}>
                    <span className="text-[var(--text-muted)]">{off}</span>
                    <span className="min-w-0 break-words"><span className="text-[var(--text-muted)]">{name}</span> {val}</span>
                  </div>
                ))}
              </>, objGone)}
              {cls === "Bat" && box(hi.has("path"), step.block === "leaked" ? C.red : C.purple,
                <div className="flex justify-between gap-2">
                  <span>{PATH_ADDR}: Vec2[3]</span>
                  <span style={{ color: step.block === "leaked" ? C.red : "var(--text-muted)" }}>
                    {step.block === "leaked" ? tx(t, "figCppVt_leaked", "leaked") : step.block === "freed" ? tx(t, "figCppVt_freed", "freed") : tx(t, "figCppVt_live", "in use")}
                  </span>
                </div>, step.block === "freed")}
            </>)}

            {panel(tx(t, "figCppVt_rodata", "read-only data: one vtable per class"),
              <div className="grid sm:grid-cols-3 gap-2">
                {CLASSES.map(c => {
                  const active = c === cls && hi.has("vt");
                  return (
                    <div key={c}>{box(active, CLS_COL[c], <>
                      <div className="mb-0.5" style={{ color: CLS_COL[c] }}>vtable {c} <span className="text-[var(--text-muted)]">{VT_ADDR[c]}</span></div>
                      {vtable(c, sw).map((sl, i) => {
                        const on = c === cls && hi.has("slot") && step.slot === i;
                        return (
                          <div key={i} className="grid grid-cols-[1.4rem_minmax(0,1fr)] gap-x-1 rounded px-1" style={{ background: on ? "var(--primary-low)" : undefined }}>
                            <span className="text-[var(--text-muted)]">[{i}]</span>
                            <span className="min-w-0 break-words" style={{ color: CLS_COL[fnCls(sl.target)] }}>{FN[sl.target].name.replace("(float)", "").replace("(int)", "").replace("()", "")}</span>
                          </div>
                        );
                      })}
                    </>, c !== cls)}</div>
                  );
                })}
              </div>, true)}

            {panel(tx(t, "figCppVt_code", "code: the compiled functions"),
              <div className="grid sm:grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[11px]">
                {fnList.map(id => {
                  const on = hi.has("fn") && step.fn === id;
                  const loose = !inTable.has(id);
                  return (
                    <div key={id} className="flex gap-2 rounded px-1.5 py-0.5 border transition-all"
                      style={{ borderColor: on ? CLS_COL[fnCls(id)] : "transparent", background: on ? "var(--primary-low)" : undefined }}>
                      <span className="text-[var(--text-muted)]">{FN[id].addr}</span>
                      <span className="min-w-0 break-words" style={{ color: CLS_COL[fnCls(id)] }}>{fnName(id, sw)}</span>
                      {loose && <span className="ml-auto text-[var(--text-muted)] italic">{tx(t, "figCppVt_noSlot", "in no vtable")}</span>}
                    </div>
                  );
                })}
              </div>, true)}
          </div>
          <div className="px-3 pb-3">
            <div className="rounded-lg bg-[var(--code-surface)] border border-[var(--code-border)] px-3 py-2 font-mono text-[11.5px] leading-[1.5] min-h-[3rem]">
              <div className="uppercase tracking-wider text-[10px] text-[var(--text-muted)] mb-0.5">{tx(t, "figCppVt_output", "output")}</div>
              {step.out.length && !error ? step.out.map((l, i) => (
                <div key={i} style={{ color: l.startsWith("~") ? C.red : l.startsWith("(") ? C.amber : C.green }}>{l}</div>
              )) : <div className="text-[var(--text-muted)]">—</div>}
            </div>
          </div>
          {!error && <Transport t={t} playing={s.playing} onPlay={s.play} onStep={s.next} onBack={s.prev} onReset={s.restart} speed
            readout={`${tx(t, "figCppVt_step", "step")} ${k + 1} / ${steps.length}`} />}
        </div>
      </div>
    </Figure>
  );
}
