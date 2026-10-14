"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Figure } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The "initialisation zoo" as a grid: eight ways to write a definition (rows)
// for three kinds of type (columns): a built-in int, a class with constructors
// (std::vector<int>) and a plain struct (an aggregate, Point). Each cell gives
// what the variable ends up holding, coloured ok / surprise / compile error;
// clicking it shows the full line, the compiler's message when there is one,
// and why. Results are what GCC 15 / Clang 20 give with -std=c++23.

type Kind = "ok" | "warn" | "error";
type TypeId = "int" | "vec" | "point";
type FormId = "decl" | "empty" | "p5" | "b5" | "eq5" | "p37" | "b37" | "fn";

const FORMS: { id: FormId; code: string }[] = [
  { id: "decl", code: "T x;" },
  { id: "empty", code: "T x{};" },
  { id: "p5", code: "T x(5);" },
  { id: "b5", code: "T x{5};" },
  { id: "eq5", code: "T x = 5;" },
  { id: "p37", code: "T x(3.7);" },
  { id: "b37", code: "T x{3.7};" },
  { id: "fn", code: "T x();" },
];

const TYPES: { id: TypeId; name: string; decl: string; var: string }[] = [
  { id: "int", name: "int", decl: "int", var: "x" },
  { id: "vec", name: "std::vector<int>", decl: "std::vector<int>", var: "v" },
  { id: "point", name: "Point", decl: "Point", var: "p" },
];

const NARROW = "error: narrowing conversion of '3.7000000000000002e+0' from 'double' to 'int' [-Wnarrowing]";
const VEXING = "warning: empty parentheses were disambiguated as a function declaration [-Wvexing-parse]";

// [result shown in the cell, kind, compiler message, English explanation]
type Cell = [string, Kind, string, string];
const CELLS: Record<TypeId, Record<FormId, Cell>> = {
  int: {
    decl: ["?", "warn", "", "A local int with no initialiser is left uninitialised: it holds whatever bits were in that memory. Reading it was undefined behaviour; since C++26 it is erroneous behaviour, still a bug, but one that tools can reliably catch."],
    empty: ["0", "ok", "", "Empty braces mean value-initialisation, which for an int is zero. Always, wherever the variable lives."],
    p5: ["5", "ok", "", "Direct initialisation with the value 5."],
    b5: ["5", "ok", "", "List initialisation with the value 5. For an int, the same result as the parentheses."],
    eq5: ["5", "ok", "", "Copy initialisation. For an int, again the same result; the name comes from the = sign, nothing is copied twice."],
    p37: ["3", "warn", "", "The double is converted to int by dropping the fraction, without a word. -Wconversion would warn; -Wall does not."],
    b37: ["—", "error", NARROW, "Braces refuse a conversion that can lose information (a narrowing conversion), so the compiler stops you here instead of quietly storing 3."],
    fn: ["fn()", "error", VEXING, "This is not a variable. It declares a function named x that takes no arguments and returns an int: the \"most vexing parse\". Any later use of x as a number fails to compile."],
  },
  vec: {
    decl: ["{}", "ok", "", "An object of a class type is never left uninitialised: its default constructor runs and builds an empty vector."],
    empty: ["{}", "ok", "", "Empty braces call the default constructor too: an empty vector."],
    p5: ["{0,0,0,0,0}", "ok", "", "Parentheses call the constructor vector(size): five elements, each set to 0."],
    b5: ["{5}", "warn", "", "When a class has a constructor taking an initializer_list (a list of values in braces), braces prefer it. So this is a vector holding one element, the number 5, not five elements."],
    eq5: ["—", "error", "error: conversion from 'int' to non-scalar type 'std::vector<int>' requested", "The constructor vector(size) is marked explicit, so the = form may not use it to turn a number into a vector. That is deliberate: v = 5 meaning \"five zeros\" would be a trap."],
    p37: ["{0,0,0}", "warn", "", "3.7 is converted to the size 3 without a word: a vector of three zeros."],
    b37: ["—", "error", NARROW, "Braces pick the initializer_list<int> constructor, and turning 3.7 into an int is narrowing: compile error."],
    fn: ["fn()", "error", VEXING, "Again a function declaration: v is a function returning a vector, not a vector."],
  },
  point: {
    decl: ["{?, ?}", "warn", "", "Point has no constructor, so nothing initialises its members: both hold garbage, like the int."],
    empty: ["{0, 0}", "ok", "", "Empty braces value-initialise every member: both 0."],
    p5: ["{5, 0}", "ok", "", "Since C++20, parentheses can fill a plain struct too: values go to the members in order, and the members left out are 0. Before C++20 this was an error."],
    b5: ["{5, 0}", "ok", "", "Aggregate initialisation: the values fill the members in declaration order (x = 5), and the members left out are set to 0."],
    eq5: ["—", "error", "error: conversion from 'int' to non-scalar type 'Point' requested", "There is no constructor that turns an int into a Point, so = has nothing to call."],
    p37: ["{3, 0}", "warn", "", "Parentheses allow narrowing, even here: x quietly becomes 3."],
    b37: ["—", "error", NARROW, "Braces refuse the narrowing from 3.7 to int."],
    fn: ["fn()", "error", VEXING, "A function declaration once more, not a Point."],
  },
};

const KIND_COL: Record<Kind, string> = { ok: C.green, warn: C.amber, error: C.red };

export function InitFigure({ t }: { t?: TrackTranslations }) {
  const [sel, setSel] = useState<[TypeId, FormId]>(["vec", "b5"]);
  const [ty, fm] = sel;
  const type = TYPES.find(x => x.id === ty)!;
  const form = FORMS.find(f => f.id === fm)!;
  const [, kind, msg, en] = CELLS[ty][fm];
  const line = form.code.replace("T x", `${type.decl} ${type.var}`);
  const kindName = (k: Kind) => k === "ok" ? tx(t, "figCppInit_ok", "as expected")
    : k === "warn" ? tx(t, "figCppInit_warn", "surprise") : tx(t, "figCppInit_error", "does not compile");

  return (
    <Figure
      title={tx(t, "figCppInit_title", "The initialisation zoo: eight spellings, three types")}
      controls={
        <div className="flex gap-x-4 gap-y-1 flex-wrap text-[11px] font-mono">
          {(["ok", "warn", "error"] as Kind[]).map(k => (
            <span key={k} className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: KIND_COL[k] }} />
              <span className="text-[var(--text-muted)]">{kindName(k)}</span>
            </span>
          ))}
        </div>
      }
      note={tx(t, "figCppInit_note", "Click any cell. Read the {} row first: braces never leave garbage, never narrow silently and never declare a function, which is why they are the default in modern C++. Their one trap is the {5} row for a vector.")}
    >
      <div className="p-3 sm:p-4 flex flex-col gap-3">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-1 font-mono text-[11.5px]">
            <thead>
              <tr>
                <th className="text-left font-normal text-[var(--text-muted)] px-1">{tx(t, "figCppInit_form", "written as")}</th>
                {TYPES.map(x => <th key={x.id} className="font-normal text-[var(--text-main)] px-1 whitespace-nowrap">{x.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {FORMS.map(f => (
                <tr key={f.id}>
                  <td className="whitespace-nowrap px-1 text-[var(--text-main)]">{f.code}</td>
                  {TYPES.map(x => {
                    const [r, k] = CELLS[x.id][f.id];
                    const on = ty === x.id && fm === f.id;
                    return (
                      <td key={x.id} className="p-0">
                        <button type="button" onClick={() => setSel([x.id, f.id])}
                          aria-pressed={on}
                          className="w-full rounded-md px-1 sm:px-1.5 py-1 bg-[var(--code-surface)] text-center whitespace-nowrap text-[10px] sm:text-[11.5px] transition-colors"
                          style={{ border: `${on ? 2 : 1}px solid ${on ? "var(--primary)" : KIND_COL[k]}`, color: KIND_COL[k] }}>
                          {r}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg bg-[var(--code-surface)] border border-[var(--code-border)] px-3 py-2 flex flex-col gap-1" aria-live="polite">
          {ty === "point" && <code className="font-mono text-[11.5px] text-[var(--text-muted)]">struct Point {"{ int x; int y; }"};</code>}
          <div className="flex items-baseline gap-2 flex-wrap">
            <code className="font-mono text-[13px] text-[var(--text-main)]">{line}</code>
            <span className="ml-auto font-mono text-[11px] font-bold" style={{ color: KIND_COL[kind] }}>{kindName(kind)}</span>
          </div>
          {msg && <code className="font-mono text-[11px] break-words" style={{ color: msg.startsWith("error") ? C.red : C.amber }}>{msg}</code>}
          <p className="text-[13px] leading-relaxed text-[var(--text-main)]">{tx(t, `figCppInit_${ty}_${fm}`, en)}</p>
        </div>
      </div>
    </Figure>
  );
}
