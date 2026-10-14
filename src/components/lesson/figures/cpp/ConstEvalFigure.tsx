"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Choice, Figure, Slider } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Who runs factorial(): the compiler, or the CPU when the program runs? Pick
// how the result is requested and the argument N. The loop's iterations are
// listed (the same ones in both cases, only the time differs), then the
// machine code g++ emits, simplified: one mov of the finished number, or a
// call into the compiled loop. "Break it": N = 13 overflows int. Asked for a
// constant, the compiler refuses (undefined behaviour is not allowed at
// compile time); asked for a plain int, g++ quietly falls back to running it.

type Form = "cx" | "plain" | "input" | "ceLit" | "ceIn";
type Who = "compiler" | "runtime" | "error";

const FORMS: { id: Form; line: (n: number) => string; input?: boolean }[] = [
  { id: "cx", line: n => `constexpr int r = factorial(${n});` },
  { id: "plain", line: n => `int r = factorial(${n});` },
  { id: "input", line: () => "int r = factorial(n);", input: true },
  { id: "ceLit", line: n => `int r = factorial_ce(${n});` },
  { id: "ceIn", line: () => "int r = factorial_ce(n);", input: true },
];

const INT_MAX = 2147483647;
const exactFact = (n: number) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
const intFact = (n: number) => { let r = 1; for (let i = 2; i <= n; i++) r = Math.imul(r, i); return r; };

function decide(form: Form, n: number): { who: Who; msg?: string[] } {
  const overflow = exactFact(n) > INT_MAX;
  if (form === "ceIn") return { who: "error", msg: [
    "main.cpp: error: call to consteval function 'factorial_ce(n)' is not a constant expression",
    "main.cpp: error: the value of 'n' is not usable in a constant expression",
    "main.cpp: note: 'int n' is not const",
  ] };
  if (form === "input") return { who: "runtime" };
  if (overflow && (form === "cx" || form === "ceLit")) return { who: "error", msg: [
    `main.cpp: in 'constexpr' expansion of 'factorial(${n})'`,
    "main.cpp: error: overflow in constant expression [-fpermissive]",
    "    |     for (int i = 2; i <= n; ++i) r *= i;",
    "    |                                  ~~^~~~",
  ] };
  // A plain int may be computed either way: g++ does it at compile time when it
  // can, and silently falls back to a run-time call when it cannot.
  if (form === "plain" && overflow) return { who: "runtime" };
  return { who: "compiler" };
}

export function ConstEvalFigure({ t }: { t?: TrackTranslations }) {
  const [form, setForm] = useState<Form>("cx");
  const [n, setN] = useState(10);
  const f = FORMS.find(x => x.id === form)!;
  const d = decide(form, n);
  const exact = exactFact(n);
  const overflow = exact > INT_MAX;
  const wrapped = intFact(n);

  const label = (txt: string) => <div className="uppercase tracking-wider text-[10px] text-[var(--text-muted)] mb-1">{txt}</div>;
  const box = "rounded-lg bg-[var(--code-surface)] border border-[var(--code-border)] px-3 py-2 font-mono text-[11.5px] leading-[1.55] overflow-x-auto";

  const src = [
    "constexpr int factorial(int n) {",
    "    int r = 1;",
    "    for (int i = 2; i <= n; ++i) r *= i;",
    "    return r;",
    "}",
    "consteval int factorial_ce(int n) { return factorial(n); }",
    "",
    "int main() {",
    ...(f.input ? ["    int n = read_int();          // typed by the user: " + n] : []),
    "    " + f.line(n),
    "    std::println(\"{}\", r);",
    "}",
  ];
  const cur = src.length - 3;

  const rows: { i: number; r: number; exact: number; bad: boolean }[] = [];
  { let r = 1; for (let i = 2; i <= n; i++) { r = Math.imul(r, i); const e = exactFact(i); rows.push({ i, r, exact: e, bad: e > INT_MAX }); } }

  const asm = d.who === "compiler"
    ? [
      "main:",
      `    mov  esi, ${exact}${" ".repeat(Math.max(1, 12 - String(exact).length))}; factorial(${n}), already computed`,
      "    lea  rdi, [fmt]",
      "    call std::println",
      "",
      "; factorial(int) is not in the program at all: nobody calls it",
    ]
    : [
      "main:",
      ...(f.input ? ["    call read_int()           ; n arrives in eax", "    mov  edi, eax"] : [`    mov  edi, ${n}`]),
      "    call factorial(int)       ; run the loop now",
      "    mov  esi, eax",
      "    lea  rdi, [fmt]",
      "    call std::println",
      "factorial(int):",
      "    mov  eax, 1               ; r = 1",
      "    mov  ecx, 2               ; i = 2",
      ".loop:",
      "    cmp  ecx, edi             ; i <= n ?",
      "    jg   .done",
      "    imul eax, ecx             ; r *= i",
      "    inc  ecx                  ; ++i",
      "    jmp  .loop",
      ".done:",
      "    ret",
    ];

  const whoText = d.who === "compiler"
    ? tx(t, "figCppCx_whoCompiler", "The compiler runs the loop while it compiles. The program only contains the answer.")
    : d.who === "runtime"
      ? tx(t, "figCppCx_whoRuntime", "The CPU runs the loop every time the program runs.")
      : tx(t, "figCppCx_whoError", "Nobody: the program does not compile.");

  const why: Record<Form, string> = {
    cx: overflow
      ? "A constexpr variable must be a constant, so the compiler has to run the loop, and it checks every step. 13! does not fit in an int: signed overflow is undefined behaviour, and undefined behaviour is never allowed in a constant expression. The bug is caught before the program exists."
      : "A constexpr variable must be initialised by a constant expression, so the compiler is forced to run factorial now.",
    plain: overflow
      ? "Nothing forces compile time here. g++ tries, meets the overflow, gives up without a word and emits a call. At run time the multiplication overflows: undefined behaviour, which in practice prints a wrong number."
      : "Nothing forces compile time here, but the argument is a constant and factorial is constexpr, so g++ computes it anyway (even at -O0). Another compiler, or the same one at another setting, may emit a call instead: it is allowed, not promised.",
    input: overflow
      ? "n is only known when the program runs, so the same constexpr function simply runs at run time. With n = 13 it overflows there, silently: undefined behaviour."
      : "n is only known when the program runs, so the same constexpr function simply runs at run time, like any function. constexpr means \"may run at compile time\", never \"must\".",
    ceLit: overflow
      ? "consteval demands compile time, so the overflow is caught exactly as with constexpr int."
      : "consteval means the function must run at compile time, every call. With a constant argument, that works.",
    ceIn: "consteval allows no run-time call. n comes from read_int(), so its value does not exist yet when the compiler needs it.",
  };

  return (
    <Figure
      title={tx(t, "figCppCx_title", "Compile time or run time? Who runs factorial()")}
      head={<Choice value={form} onChange={setForm} options={[
        ["cx", "constexpr int"], ["plain", "int"], ["input", `int, ${tx(t, "figCppCx_nRead", "n read")}`],
        ["ceLit", "consteval"], ["ceIn", `consteval, ${tx(t, "figCppCx_nRead", "n read")}`],
      ]} />}
      controls={<Slider label="N" value={n} min={0} max={15} step={1} onChange={setN} fmt={v => String(v)} />}
      note={tx(t, "figCppCx_note", "Move N and switch between the five lines. Break it: set N to 13, the first factorial that does not fit in an int (2 147 483 647), and compare constexpr int with plain int.")}
    >
      <div className="grid 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* ── Source and the loop ── */}
        <div className="p-3 2xl:border-r border-b 2xl:border-b-0 border-[var(--border)] flex flex-col gap-3 min-w-0">
          <ol className="font-mono text-[11.5px] leading-[1.55] overflow-x-auto">
            {src.map((ln, i) => (
              <li key={i} className={`flex items-start gap-2 rounded px-1 ${i === cur ? "bg-[var(--primary-low)]" : ""}`}>
                <span className="w-4 shrink-0 text-right text-[var(--text-muted)] opacity-60 select-none">{i + 1}</span>
                <span className={`whitespace-pre flex-1 ${i === cur ? "text-[var(--text-main)]" : "text-[var(--text-muted)]"}`}>{ln}</span>
              </li>
            ))}
          </ol>
          <div className={box}>
            {label(`${tx(t, "figCppCx_loop", "the loop")} · ${d.who === "compiler" ? tx(t, "figCppCx_inCompiler", "run inside the compiler") : d.who === "runtime" ? tx(t, "figCppCx_atRuntime", "run by the CPU") : tx(t, "figCppCx_stopped", "stopped")}`)}
            {form === "ceIn"
              ? <div className="text-[var(--text-muted)]">{tx(t, "figCppCx_noStart", "never started: the compiler does not know n")}</div>
              : rows.length === 0 && <div className="text-[var(--text-muted)]">{tx(t, "figCppCx_noLoop", "i = 2 > n: the loop body never runs, r stays 1")}</div>}
            {form !== "ceIn" && <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,1fr)] gap-x-2">
              {rows.length > 0 && <><span className="text-[var(--text-muted)]">i</span><span className="text-[var(--text-muted)]">r (int)</span><span className="text-[var(--text-muted)]">{tx(t, "figCppCx_true", "true value")}</span></>}
              {rows.map(row => {
                const stop = d.who === "error" && row.bad && !rows.find(x => x.bad && x.i < row.i);
                const hidden = d.who === "error" && row.bad && !stop;
                if (hidden) return null;
                return [
                  <span key={`i${row.i}`} className="text-[var(--text-main)]">{row.i}</span>,
                  <span key={`r${row.i}`} style={{ color: row.bad ? C.red : C.sky }}>{stop ? tx(t, "figCppCx_refused", "refused") : row.r}</span>,
                  <span key={`e${row.i}`} style={{ color: row.bad ? C.red : "var(--text-muted)" }}>{row.exact}{row.bad ? " > INT_MAX" : ""}</span>,
                ];
              })}
            </div>}
          </div>
        </div>

        {/* ── Verdict and machine code ── */}
        <div className="p-3 min-w-0 flex flex-col gap-3">
          <div className="rounded-lg border-2 px-3 py-2 bg-[var(--code-surface)]"
            style={{ borderColor: d.who === "compiler" ? C.green : d.who === "runtime" ? C.amber : C.red }} aria-live="polite">
            <div className="font-bold text-[13px] mb-1" style={{ color: d.who === "compiler" ? C.green : d.who === "runtime" ? C.amber : C.red }}>{whoText}</div>
            <p className="text-[12.5px] leading-relaxed text-[var(--text-main)]">{tx(t, `figCppCx_why_${form}${overflow ? "_ov" : ""}`, why[form])}</p>
          </div>
          {d.who === "error"
            ? <pre className={box + " whitespace-pre-wrap break-words"} style={{ color: C.red }}>{d.msg!.join("\n")}</pre>
            : <>
              <div>
                {label(tx(t, "figCppCx_asm", "machine code g++ emits (x86-64, simplified)"))}
                <pre className={box + " text-[var(--text-muted)]"}>{asm.join("\n")}</pre>
              </div>
              <div className={box}>
                {label(tx(t, "figCppCx_output", "output"))}
                <span style={{ color: overflow ? C.red : C.green }}>{wrapped}</span>
                {overflow && <span className="font-sans text-[11px] text-[var(--text-muted)]"> · {tx(t, "figCppCx_ub", "undefined behaviour: this wrapped value is what x86 usually gives, nothing promises it")}</span>}
              </div>
            </>}
        </div>
      </div>
    </Figure>
  );
}
