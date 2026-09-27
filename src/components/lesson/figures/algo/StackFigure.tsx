"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, C, T } from "@/components/lesson/kit/figure";
import { useStepper, StepperControls } from "@/components/lesson/kit/Stepper";

// ── What this figure shows ────────────────────────────────────────────────────
// Two classic jobs for a stack, one token at a time. "brackets": every
// opening bracket is pushed; every closing bracket must match the one on top,
// which is popped. The text is balanced if nothing ever mismatches and the
// stack ends empty. "postfix": numbers are pushed; an operator pops two
// numbers, combines them and pushes the result; the one number left at the
// end is the value. The column on the right is the stack, top at the top.

type Frame = { pos: number; stack: string[]; msg: string; state: "run" | "ok" | "bad" };

const BRACKETS = ["{ a[i] * (b + c) }", "( [ a + b ) ]", "f(g(x)"];
const POSTFIX = ["3 4 + 2 *", "5 1 2 + 4 * + 3 -", "2 3 4 * +"];
const PAIR: Record<string, string> = { ")": "(", "]": "[", "}": "{" };

function bracketFrames(src: string, t?: TrackTranslations): Frame[] {
  const tokens = src.split("");
  const st: string[] = [];
  const out: Frame[] = [{ pos: -1, stack: [], msg: tx(t, "figStack_bStart", "read left to right"), state: "run" }];
  for (let i = 0; i < tokens.length; ++i) {
    const c = tokens[i];
    if ("([{".includes(c)) { st.push(c); out.push({ pos: i, stack: [...st], msg: `'${c}': ${tx(t, "figStack_push", "push")}`, state: "run" }); }
    else if (")]}".includes(c)) {
      const top = st[st.length - 1];
      if (top !== PAIR[c]) {
        out.push({ pos: i, stack: [...st], msg: `'${c}' ${tx(t, "figStack_vs", "but the top is")} ${top ? `'${top}'` : tx(t, "figStack_nothing", "nothing")}: ${tx(t, "figStack_mismatch", "not balanced")}`, state: "bad" });
        return out;
      }
      st.pop();
      out.push({ pos: i, stack: [...st], msg: `'${c}' ${tx(t, "figStack_matches", "matches the top: pop")}`, state: "run" });
    }
  }
  out.push(st.length
    ? { pos: tokens.length, stack: [...st], msg: tx(t, "figStack_left", "end of text, but the stack is not empty: not balanced"), state: "bad" }
    : { pos: tokens.length, stack: [], msg: tx(t, "figStack_balanced", "end of text and the stack is empty: balanced"), state: "ok" });
  return out;
}

function postfixFrames(src: string, t?: TrackTranslations): Frame[] {
  const tokens = src.split(" ");
  const st: number[] = [];
  const out: Frame[] = [{ pos: -1, stack: [], msg: tx(t, "figStack_pStart", "numbers are pushed, operators pop two"), state: "run" }];
  tokens.forEach((tok, i) => {
    if (/^\d+$/.test(tok)) { st.push(Number(tok)); out.push({ pos: i, stack: st.map(String), msg: `${tok}: ${tx(t, "figStack_push", "push")}`, state: "run" }); return; }
    const b = st.pop()!, a = st.pop()!;
    const r = tok === "+" ? a + b : tok === "-" ? a - b : tok === "*" ? a * b : Math.trunc(a / b);
    st.push(r);
    out.push({ pos: i, stack: st.map(String), msg: `'${tok}': ${tx(t, "figStack_pop2", "pop")} ${b} ${tx(t, "figStack_and", "and")} ${a}, ${tx(t, "figStack_pushRes", "push")} ${a} ${tok} ${b} = ${r}`, state: "run" });
  });
  out.push({ pos: tokens.length, stack: st.map(String), msg: `${tx(t, "figStack_value", "value")} = ${st[0]}`, state: "ok" });
  return out;
}

const W = 560, H = 200;

export function StackFigure({ t, initial = "brackets" }: { t?: TrackTranslations; initial?: "brackets" | "postfix" }) {
  const [mode, setMode] = useState<"brackets" | "postfix">(initial);
  const [ex, setEx] = useState(0);
  const src = mode === "brackets" ? BRACKETS[ex] : POSTFIX[ex];
  const frames = useMemo(() => (mode === "brackets" ? bracketFrames(src, t) : postfixFrames(src, t)), [mode, src, t]);
  const s = useStepper(frames.length - 1, 900, 250);
  const f = frames[Math.min(frames.length - 1, Math.floor(s.raw + 1e-9))];
  const tokens = mode === "brackets" ? src.split("") : src.split(" ");
  const tw = mode === "brackets" ? 18 : 30;

  return (
    <Figure
      title={tx(t, "figStack_title", "A stack at work")}
      head={<Choice value={mode} onChange={v => { setMode(v); setEx(0); s.restart(); }} options={[["brackets", tx(t, "figStack_brackets", "brackets")], ["postfix", tx(t, "figStack_postfix", "postfix")]] as const} />}
      controls={<>
        <Row>{(mode === "brackets" ? BRACKETS : POSTFIX).map((e, i) => (
          <Btn key={i} active={ex === i} onClick={() => { setEx(i); s.restart(); }}>{e}</Btn>
        ))}</Row>
        <StepperControls s={s} />
        <Row><Readout>{tx(t, "figStack_depth", "stack size")}: {f.stack.length}</Readout></Row>
      </>}
      note={tx(t, "figStack_note", "A stack only ever touches its top: push puts a value there, pop takes it back, both O(1). That is exactly what nesting needs: the bracket opened last must be closed first, and in postfix notation an operator always applies to the two most recent values. 5 1 2 + 4 * + 3 − means 5 + (1 + 2) · 4 − 3 = 14, with no brackets and no precedence rules.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <T x={16} y={20} size={10} color={f.state === "ok" ? C.green : f.state === "bad" ? C.red : C.fg} bold>{f.msg}</T>
        {tokens.map((tok, i) => (
          <g key={i}>
            {i === f.pos && tok.trim() && <rect x={16 + i * tw} y={44} width={tw - 2} height={26} rx={4} fill={f.state === "bad" ? C.red : C.amber} fillOpacity={0.3} />}
            <T x={16 + i * tw + (tw - 2) / 2} y={62} size={13} anchor="middle" color={i <= f.pos ? C.fg : C.muted} bold={i === f.pos}>{tok}</T>
          </g>
        ))}
        <T x={430} y={H - 8} size={9} anchor="middle">{tx(t, "figStack_bottom", "bottom")}</T>
        <rect x={380} y={H - 22} width={100} height={2} fill={C.axis} />
        {f.stack.map((v, i) => {
          const y = H - 50 - i * 26, top = i === f.stack.length - 1;
          return <g key={i}>
            <rect x={385} y={y} width={90} height={24} rx={4} fill={top ? C.purple : C.sky} fillOpacity={top ? 0.45 : 0.22} stroke={top ? C.purple : C.sky} />
            <T x={430} y={y + 16} size={12} anchor="middle" color={C.fg} bold>{v}</T>
            {top && <T x={482} y={y + 16} size={9} color={C.purple} bold>← top</T>}
          </g>;
        })}
      </svg>
    </Figure>
  );
}
