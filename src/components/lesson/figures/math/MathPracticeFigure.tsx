"use client";

import { useRef, useState } from "react";
import { Delete } from "lucide-react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Choice, Figure } from "@/components/lesson/kit/figure";
import { TOUCH, useMediaQuery } from "@/components/lesson/kit/media";
import { Practice, type StageApi } from "@/components/lesson/kit/practice/Practice";
import { Tex } from "@/components/lesson/Tex";
import { check, pick, type Level, type Problem } from "./practice/problem";
import { SETS, type SetId } from "./practice/sets";

// ── What this figure shows ────────────────────────────────────────────────────
// A practice round (kit/practice) of exercises made on the spot by the
// generators in ./practice: the answer is chosen first and the question built
// around it, with exact fractions, so the key is always right. The reader
// types the answer (a keypad on touch screens); 0.75, 3/4 and 6/8 are read as
// the same number. A wrong answer shows the worked solution, line by line.
// `set` picks the chapter's exercises (practice/sets.ts).

type Msg = "unread" | "simplify" | null;
const KEYS = ["7", "8", "9", "back", "4", "5", "6", "/", "1", "2", "3", "-", "0", "."] as const;

export function MathPracticeFigure({ t, set }: { t?: TrackTranslations; set: SetId }) {
  const def = SETS[set];
  const [level, setLevel] = useState<Level>(1);
  const [kind, setKind] = useState("mix");
  const [vals, setVals] = useState<string[]>([]);
  const [active, setActive] = useState(0);
  const [msg, setMsg] = useState<Msg>(null);
  const touch = useMediaQuery(TOUCH);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  const make = (avoid: string | null): Problem => {
    for (let i = 0; ; i++) {
      const k = kind === "mix" ? pick(def.kinds) : def.kinds.find(d => d.id === kind) ?? def.kinds[0];
      const p = k.make(level);
      if (p.key !== avoid || i > 20) return p;
    }
  };

  const stage = (q: Problem, { submit, feedback }: StageApi) => {
    const empty = q.fields.findIndex((_, i) => !(vals[i] ?? "").trim());
    const send = () => {
      if (empty >= 0) { setActive(empty); if (!touch) boxes.current[empty]?.focus(); return; }
      const v = check(q, vals);
      if (v === "unread" || v === "simplify") { setMsg(v); return; }
      setMsg(null);
      submit(v === "ok");
    };
    const press = (k: string) => {
      setMsg(null);
      setVals(vs => {
        const n = [...vs], s = n[active] ?? "";
        n[active] = k === "back" ? s.slice(0, -1) : s.length < 16 ? s + k : s;
        return n;
      });
    };
    const wrong = feedback && !feedback.ok;
    return (
      <div className={`px-4 ${wrong ? "pb-28" : "pb-4"}`}>
        <form onSubmit={e => { e.preventDefault(); send(); }} className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
          {q.fields.map((f, i) => (
            <label key={i} className="flex items-center gap-2 text-[18px] text-[var(--text-main)]">
              {f.label && <Tex>{`${f.label} =`}</Tex>}
              <input ref={el => { boxes.current[i] = el; }} value={vals[i] ?? ""}
                onChange={e => { const s = e.target.value; setMsg(null); setVals(vs => { const n = [...vs]; n[i] = s.slice(0, 16); return n; }); }}
                onFocus={() => setActive(i)} inputMode={touch ? "none" : "text"} autoComplete="off" spellCheck={false}
                aria-label={f.label ? tx(t, "figMP_boxFor", "answer for {x}").replace("{x}", f.label.replace(/[_{}]/g, "")) : tx(t, "figMP_box", "your answer")}
                className="w-28 h-12 rounded-xl border-2 border-b-4 text-center text-[18px] font-bold bg-[var(--card)] text-[var(--text-main)] outline-none transition-colors"
                style={{
                  borderColor: feedback ? (feedback.ok ? "var(--pr-ok)" : "var(--pr-bad)")
                    : i === active && (touch || q.fields.length > 1) ? "var(--primary)" : "var(--border)",
                }} />
              {f.suffix && <span className="text-[15px] text-[var(--text-muted)]">{f.suffix}</span>}
            </label>
          ))}
          {!touch && (
            <button type="submit" className="h-12 px-6 rounded-xl bg-[var(--primary)] text-[var(--card)] text-[14px] font-bold hover:brightness-110 active:scale-[0.97] transition">
              {tx(t, "figMP_check", "check")}
            </button>
          )}
        </form>

        {msg && (
          <p className="text-center text-[12px] font-semibold mt-2" style={{ color: "var(--pr-gold)" }}>
            {msg === "simplify"
              ? tx(t, "figMP_simplify", "Right value! Now write it in lowest terms.")
              : tx(t, "figMP_unread", "Type a number such as 12, -3, 2.5 or 3/4.")}
          </p>
        )}
        {!feedback && !touch && !msg && (
          <p className="text-center text-[11px] text-[var(--text-muted)] mt-2" data-mouse-only>
            {tx(t, "figMP_hint", "Fractions as 3/4, negatives as -3. Enter checks.")}
          </p>
        )}

        {touch && !feedback && (
          <div className="grid grid-cols-4 gap-1.5 max-w-[17rem] mx-auto mt-3">
            {KEYS.map(k => (
              <button key={k} type="button" onClick={() => press(k)}
                aria-label={k === "back" ? tx(t, "figMP_back", "delete") : k}
                className="h-11 rounded-xl border-2 border-b-4 border-[var(--border)] bg-[var(--card)] text-[17px] font-bold text-[var(--text-main)] flex items-center justify-center active:border-b-2 active:scale-95 transition">
                {k === "back" ? <Delete size={18} /> : k === "-" ? "−" : k}
              </button>
            ))}
            <button type="button" onClick={send}
              className="col-span-2 h-11 rounded-xl bg-[var(--primary)] text-[var(--card)] text-[14px] font-bold active:scale-95 transition">
              {empty >= 0 && empty !== active && (vals[active] ?? "").trim() ? tx(t, "figMP_next", "next box") : tx(t, "figMP_check", "check")}
            </button>
          </div>
        )}

        {wrong && (
          <div className="mt-4 mx-auto max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 overflow-x-auto">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1.5">{tx(t, "figMP_worked", "worked solution")}</p>
            <div className="space-y-1 text-[15px] text-[var(--text-main)]">
              {q.steps.map((s, i) => <div key={i}><Tex>{`\\displaystyle ${s}`}</Tex></div>)}
            </div>
          </div>
        )}
      </div>
    );
  };

  const settings = <>
    <Choice value={String(level) as "1" | "2" | "3"} onChange={v => setLevel(Number(v) as Level)} options={[
      ["1", tx(t, "figMP_l1", "easy")], ["2", tx(t, "figMP_l2", "medium")], ["3", tx(t, "figMP_l3", "hard")],
    ]} />
    {def.kinds.length > 1 && (
      <Choice value={kind} onChange={setKind} options={[["mix", tx(t, "figMP_mixed", "mixed")], ...def.kinds.map(k => [k.id, tx(t, k.label[0], k.label[1])] as const)]} />
    )}
  </>;

  return (
    <Figure title={tx(t, def.title[0], def.title[1])}
      note={tx(t, "figMP_note", "Every exercise is made on the spot, so a new round is never the same. The computer picks the answer first and builds the question around it, working with exact fractions, so the answer key is always right. Answers are read exactly: 0.75, 3/4 and 6/8 count as the same number (where lowest terms are asked for, 6/8 just gets a reminder). A wrong answer shows the worked solution line by line, in the order the lesson does it; the new number in each line is coloured.")}>
      <Practice<Problem> t={t} id={`math-${set}-${kind}-${level}`} make={make} settings={settings}
        prompt={q => <>
          <div className="text-[13px] font-medium text-[var(--text-muted)] mb-2">{tx(t, q.ask[0], q.ask[1])}</div>
          <div className="overflow-x-auto"><Tex>{`\\displaystyle ${q.tex}`}</Tex></div>
        </>}
        stage={stage}
        solution={q => <Tex>{q.short}</Tex>}
        onShow={() => {
          setVals([]); setMsg(null); setActive(0);
          if (!touch) setTimeout(() => boxes.current[0]?.focus({ preventScroll: true }), 30);
        }} />
    </Figure>
  );
}
