"use client";

// ── Practice session ──────────────────────────────────────────────────────────
// A study-app style run of questions inside a widget. The widget supplies the
// questions (`make`) and draws each one (`stage`: the picture and the place to
// answer, which calls `submit(ok)`); this component runs the session:
//   start card → N questions with a progress bar → summary → review of the
//   mistakes (asked again until right) → summary.
// A right answer covers the stage with a short celebration and moves on by
// itself; a wrong one slides up a sheet with the right answer and waits for
// "continue". The best score is kept per viewer in localStorage under
// practice:<id> (guarded: storage may be blocked). Styles: src/styles/practice.css.

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { bonk, chime } from "./sounds";

export type PracticeQuestion = { key: string };
export type Feedback = { ok: boolean } | null;
export type StageApi = { submit: (ok: boolean) => void; feedback: Feedback };

type Record_ = { best: number; rounds: number };
type Phase = "start" | "ask" | "done";
type Round = "main" | "review";

const NEXT_MS = 1150;
const PARTICLES = ["#22c55e", "#f59e0b", "#0ea5e9", "#ec4899", "#a855f7", "#14b8a6"];

function loadRecord(id: string): Record_ {
  try {
    const v = JSON.parse(localStorage.getItem(`practice:${id}`) ?? "null");
    if (v && Number.isFinite(v.best)) return { best: v.best, rounds: v.rounds ?? 0 };
  } catch { /* storage blocked or corrupt */ }
  return { best: 0, rounds: 0 };
}
function saveRecord(id: string, r: Record_) {
  try { localStorage.setItem(`practice:${id}`, JSON.stringify(r)); } catch { /* storage blocked */ }
}

export function Practice<Q extends PracticeQuestion>({ t, id, length = 10, make, prompt, stage, solution, onAnswer, onShow, settings }: {
  t?: TrackTranslations;
  /** Names the practice in storage: keep it stable, e.g. "music-find-note". */
  id: string;
  length?: number;
  /** A new question, preferably not the one whose key is `avoid`. */
  make: (avoid: string | null) => Q;
  /** The big line on top: "Find the G". */
  prompt: (q: Q) => ReactNode;
  /** The drawing and the answer controls; they call api.submit and may colour themselves by api.feedback. */
  stage: (q: Q, api: StageApi) => ReactNode;
  /** The right answer in words, for the wrong-answer sheet and the summary. */
  solution: (q: Q) => ReactNode;
  /** After every answer (play the note, say). */
  onAnswer?: (q: Q, ok: boolean) => void;
  /** When a question appears (play what it asks about, say). */
  onShow?: (q: Q) => void;
  /** Options shown on the start and summary cards. */
  settings?: ReactNode;
}) {
  const [phase, setPhase] = useState<Phase>("start");
  const [round, setRound] = useState<Round>("main");
  const [queue, setQueue] = useState<Q[]>([]);
  const [i, setI] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [mistakes, setMistakes] = useState<Q[]>([]);
  const [record, setRecord] = useState<Record_>({ best: 0, rounds: 0 });
  const [newBest, setNewBest] = useState(false);
  const [time, setTime] = useState(0);
  const [shake, setShake] = useState(0);
  const t0 = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cont = useRef<HTMLButtonElement>(null);

  useEffect(() => { setRecord(loadRecord(id)); }, [id]);
  const show = useRef(onShow);
  useEffect(() => { show.current = onShow; });
  const current = phase === "ask" ? queue[i] : undefined;
  useEffect(() => { if (current) show.current?.(current); }, [current, i, round]);   // i: a question asked twice in a row
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => { if (feedback && !feedback.ok) cont.current?.focus({ preventScroll: true }); }, [feedback]);

  const begin = (r: Round, qs: Q[]) => {
    if (timer.current) clearTimeout(timer.current);
    setRound(r); setQueue(qs); setI(0); setResults([]); setFeedback(null);
    setStreak(0); setBestStreak(0); setNewBest(false); setPhase("ask");
    t0.current = Date.now();
  };
  const start = () => {
    const qs: Q[] = [];
    for (let k = 0; k < length; k++) qs.push(make(qs.length ? qs[qs.length - 1].key : null));
    setMistakes([]);
    begin("main", qs);
  };
  const review = () => begin("review", mistakes);

  const finish = useCallback((res: boolean[]) => {
    setTime(Math.round((Date.now() - t0.current) / 1000));
    setPhase("done");
    if (round !== "main") return;
    const score = res.filter(Boolean).length, rec = loadRecord(id);
    const next = { best: Math.max(rec.best, score), rounds: rec.rounds + 1 };
    setNewBest(score > rec.best && rec.rounds > 0);
    setRecord(next); saveRecord(id, next);
  }, [id, round]);

  // The newest "next" (the auto-advance timer must not call an old one, which
  // would miss the answer just given)
  const next = () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    setFeedback(null);
    if (i + 1 >= queue.length) finish(results); else setI(i + 1);
  };
  const nextRef = useRef(next);
  useEffect(() => { nextRef.current = next; });

  const submit = useCallback((ok: boolean) => {
    if (feedback || phase !== "ask") return;
    const q = queue[i];
    setFeedback({ ok });
    setResults(r => [...r, ok]);
    onAnswer?.(q, ok);
    if (ok) {
      chime(0.12);
      setStreak(s => { const n = s + 1; setBestStreak(b => Math.max(b, n)); return n; });
      timer.current = setTimeout(() => nextRef.current(), NEXT_MS);
    } else {
      bonk();
      setShake(s => s + 1);
      setStreak(0);
      if (round === "main") setMistakes(ms => (ms.some(m => m.key === q.key) ? ms : [...ms, q]));
      else setQueue(qs => [...qs, q]);                       // asked again at the end, until it is right
    }
  }, [feedback, phase, queue, i, onAnswer, round]);

  // ── Start card ──
  if (phase === "start") {
    return (
      <div className="pr-root px-4 py-8 flex flex-col items-center text-center gap-4 min-h-[300px] justify-center">
        <div className="text-[34px] leading-none" aria-hidden>🎯</div>
        <p className="text-[18px] font-semibold text-[var(--text-main)]">{tx(t, "figPr_startTitle", "A round of {n} questions").replace("{n}", String(length))}</p>
        <p className="text-[13px] text-[var(--text-muted)] max-w-sm">{tx(t, "figPr_startBody", "Answer as many as you can. Mistakes come back at the end for a review round.")}</p>
        {settings && <div className="flex flex-wrap gap-2 justify-center">{settings}</div>}
        {record.rounds > 0 && <p className="text-[12px] font-mono text-[var(--text-muted)]">{tx(t, "figPr_record", "your best")}: {record.best}/{length} · {record.rounds} {tx(t, "figPr_rounds", "rounds")}</p>}
        <button type="button" onClick={start}
          className="mt-1 h-12 px-8 rounded-full bg-[var(--primary)] text-[var(--card)] text-[14px] font-bold shadow-sm hover:brightness-110 active:scale-[0.97] transition">
          {tx(t, "figPr_start", "start")}
        </button>
      </div>
    );
  }

  // ── Summary card ──
  if (phase === "done") {
    const score = results.filter(Boolean).length, total = results.length, frac = total ? score / total : 0;
    const msg = round === "review" ? tx(t, "figPr_reviewDone", "Review complete: every mistake fixed!")
      : frac === 1 ? tx(t, "figPr_perfect", "Perfect round!")
      : frac >= 0.8 ? tx(t, "figPr_great", "Great job!")
      : frac >= 0.5 ? tx(t, "figPr_good", "Good practice!")
      : tx(t, "figPr_keepGoing", "Keep going, it gets easier!");
    const R = 42, L = 2 * Math.PI * R;
    return (
      <div className="pr-root px-4 py-7 flex flex-col items-center text-center gap-3 min-h-[300px] justify-center pr-card-in">
        {round === "main" ? (
          <svg viewBox="0 0 100 100" className="w-28 h-28 pr-pop" aria-hidden>
            <circle cx={50} cy={50} r={R} fill="none" stroke="var(--border)" strokeWidth={9} />
            <circle cx={50} cy={50} r={R} fill="none" stroke={frac >= 0.8 ? "var(--pr-ok)" : "var(--pr-gold)"} strokeWidth={9} strokeLinecap="round"
              strokeDasharray={`${L * frac} ${L}`} transform="rotate(-90 50 50)" />
            <text x={50} y={57} textAnchor="middle" fontSize={22} fontWeight={700} fill="var(--text-main)">{score}/{total}</text>
          </svg>
        ) : <div className="text-[40px] pr-pop" aria-hidden>✨</div>}
        <p className="text-[18px] font-semibold text-[var(--text-main)]">{msg}</p>
        {newBest && <p className="text-[13px] font-semibold pr-pop" style={{ color: "var(--pr-gold)" }}>🏆 {tx(t, "figPr_newBest", "new personal best!")}</p>}
        <div className="flex flex-wrap gap-2 justify-center text-[12px] font-mono text-[var(--text-muted)]">
          {round === "main" && <span>{tx(t, "figPr_bestStreak", "best streak")}: {bestStreak}</span>}
          {round === "review" && <span>{tx(t, "figPr_tries", "answers")}: {total}</span>}
          <span>· {tx(t, "figPr_time", "time")}: {Math.floor(time / 60)}:{String(time % 60).padStart(2, "0")}</span>
        </div>
        {round === "main" && mistakes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-center max-w-md">
            {mistakes.map(m => <span key={m.key} className="text-[12px] px-2 py-0.5 rounded-md border" style={{ borderColor: "var(--pr-bad)", color: "var(--pr-bad)" }}>{solution(m)}</span>)}
          </div>
        )}
        {settings && <div className="flex flex-wrap gap-2 justify-center">{settings}</div>}
        <div className="flex flex-wrap gap-2 justify-center mt-1">
          {round === "main" && mistakes.length > 0 && (
            <button type="button" onClick={review}
              className="h-11 px-6 rounded-full bg-[var(--primary)] text-[var(--card)] text-[13px] font-bold hover:brightness-110 active:scale-[0.97] transition">
              {tx(t, "figPr_review", "review my mistakes")} ({mistakes.length})
            </button>
          )}
          <button type="button" onClick={start}
            className={`h-11 px-6 rounded-full text-[13px] font-bold active:scale-[0.97] transition ${round === "main" && mistakes.length > 0
              ? "border border-[var(--border)] text-[var(--text-main)] hover:border-[var(--primary)]"
              : "bg-[var(--primary)] text-[var(--card)] hover:brightness-110"}`}>
            {tx(t, "figPr_again", "new round")}
          </button>
        </div>
      </div>
    );
  }

  // ── A question ──
  const q = queue[i];
  return (
    <div className="pr-root relative overflow-hidden min-h-[300px]">
      {/* progress: one segment per question, coloured by its answer */}
      <div className="flex items-center gap-2 px-4 pt-3">
        <button type="button" onClick={() => { if (timer.current) clearTimeout(timer.current); setPhase("start"); }}
          className="w-7 h-7 rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] text-[16px] leading-none" aria-label={tx(t, "figPr_quit", "leave the round")}>×</button>
        <div className="flex-1 flex gap-1">
          {queue.map((_, k) => (
            <div key={k} className="pr-seg flex-1 h-2 rounded-full" style={{
              background: k < results.length ? (results[k] ? "var(--pr-ok)" : "var(--pr-bad)") : k === i ? "color-mix(in srgb, var(--primary) 45%, var(--border))" : "var(--border)",
            }} />
          ))}
        </div>
        <span key={streak} className={`text-[12px] font-mono min-w-[3.2rem] text-right ${streak >= 2 ? "pr-streak" : ""}`}
          style={{ color: streak >= 2 ? "var(--pr-gold)" : "var(--text-muted)" }}>
          {streak >= 2 ? `🔥 ${streak}` : round === "review" ? tx(t, "figPr_reviewTag", "review") : `${i + 1}/${queue.length}`}
        </span>
      </div>

      <div key={`${round}-${i}`} className="pr-card-in">
        <div key={shake} className={`px-4 pt-4 pb-2 text-center text-[20px] font-semibold text-[var(--text-main)] ${shake && feedback && !feedback.ok ? "pr-shake" : ""}`}>
          {prompt(q)}
        </div>
        <div className={feedback ? "pointer-events-none" : undefined}>{stage(q, { submit, feedback })}</div>
      </div>

      {/* right: a celebration over the stage, then the next question by itself */}
      {feedback?.ok && (
        <button type="button" onClick={next} className="pr-fade-in absolute inset-0 flex flex-col items-center justify-center gap-2 cursor-pointer"
          style={{ background: "color-mix(in srgb, var(--card) 72%, transparent)", backdropFilter: "blur(2px)" }}>
          <div className="relative w-24 h-24">
            {Array.from({ length: 14 }, (_, k) => (
              <span key={k} className="pr-particle" style={{
                background: PARTICLES[k % PARTICLES.length], ["--a" as string]: `${(360 / 14) * k + (k % 2) * 9}deg`,
                ["--d" as string]: `${70 + (k % 3) * 18}px`, animationDelay: `${(k % 4) * 0.03}s`,
              }} />
            ))}
            <svg viewBox="0 0 96 96" className="pr-pop pr-check absolute inset-0" aria-hidden>
              <circle cx={48} cy={48} r={40} fill="var(--pr-ok)" />
              <path d="M30 49 L43 62 L67 36" fill="none" stroke="#fff" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="pr-pop text-[22px] font-bold" style={{ color: "var(--pr-ok)" }}>
            {[tx(t, "figPr_ok0", "Correct!"), tx(t, "figPr_ok1", "Nice!"), tx(t, "figPr_ok2", "Exactly!"), tx(t, "figPr_ok3", "Well done!")][(i + results.length) % 4]}
          </p>
          {streak >= 3 && <p className="pr-pop text-[14px] font-semibold" style={{ color: "var(--pr-gold)" }}>🔥 {streak} {tx(t, "figPr_inARow", "in a row")}</p>}
        </button>
      )}

      {/* wrong: a sheet with the right answer, waiting for "continue" */}
      {feedback && !feedback.ok && (
        <div className="pr-sheet absolute left-0 right-0 bottom-0 px-4 py-3 flex flex-wrap items-center gap-3 border-t"
          style={{ background: "color-mix(in srgb, var(--pr-bad) 14%, var(--card))", borderColor: "var(--pr-bad)" }}>
          <div className="flex-1 min-w-[12rem]">
            <p className="text-[15px] font-bold" style={{ color: "var(--pr-bad)" }}>{tx(t, "figPr_wrong", "Not quite")}</p>
            <p className="text-[13px] text-[var(--text-main)]">{tx(t, "figPr_answer", "The answer")}: <strong>{solution(q)}</strong>
              {round === "main" && <span className="text-[var(--text-muted)]"> · {tx(t, "figPr_later", "it comes back in the review")}</span>}</p>
          </div>
          <button ref={cont} type="button" onClick={next}
            className="h-10 px-6 rounded-full text-[13px] font-bold text-white active:scale-[0.97] transition" style={{ background: "var(--pr-bad)" }}>
            {tx(t, "figPr_continue", "continue")}
          </button>
        </div>
      )}
    </div>
  );
}
