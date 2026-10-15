"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Printing every field of a struct, written by hand or with C++26 static
// reflection. Tick the members Player has; the reflection version asks the
// compiler for the list of members and "template for" stamps out one line per
// member, so it always matches. The hand-written version was written when
// Player had name, hp and speed. Break it: add "alive" and watch only the
// hand-written output fall behind. The program and its output were checked
// with g++ 16.2 -std=c++26 -freflection.

type Member = "name" | "hp" | "speed" | "alive";
const MEMBERS: { id: Member; type: string; init: string; out: string }[] = [
  { id: "name", type: "std::string", init: "\"Ada\"", out: "Ada" },
  { id: "hp", type: "int", init: "90", out: "90" },
  { id: "speed", type: "float", init: "4.5f", out: "4.5" },
  { id: "alive", type: "bool", init: "true", out: "true" },
];
const HAND: Member[] = ["name", "hp", "speed"];

export function ReflectFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<"reflect" | "hand">("reflect");
  const [on, setOn] = useState<Record<Member, boolean>>({ name: true, hp: true, speed: true, alive: false });
  const members = MEMBERS.filter(m => on[m.id]);
  const toggle = (id: Member) => setOn(o => ({ ...o, [id]: !o[id] }));

  const missingInStruct = HAND.filter(h => !on[h]);           // hand-written code names a member that is gone
  const notPrinted = members.filter(m => !HAND.includes(m.id)); // members the hand-written code forgot
  const handBroken = mode === "hand" && missingInStruct.length > 0;

  const box = "rounded-lg bg-[var(--code-surface)] border border-[var(--code-border)] px-3 py-2";
  const label = (txt: string) => <div className="uppercase tracking-wider text-[10px] text-[var(--text-muted)] mb-1">{txt}</div>;
  const pre = "font-mono text-[11.5px] leading-[1.55] overflow-x-auto whitespace-pre";

  const structCode = [
    "struct Player {",
    ...members.map(m => `    ${m.type.padEnd(12)}${m.id};`),
    "};",
  ];
  const reflectCode = [
    "template <typename T>",
    "void print_fields(const T& obj) {",
    "    constexpr auto ctx = std::meta::access_context::unchecked();",
    "    template for (constexpr auto m :",
    "            std::define_static_array(std::meta::nonstatic_data_members_of(^^T, ctx)))",
    "        std::println(\"{} = {}\", std::meta::identifier_of(m), obj.[:m:]);",
    "}",
  ];
  const handCode = [
    "void print_fields(const Player& p) {   // written when Player had 3 members",
    ...HAND.map(h => `    std::println("${h} = {}", p.${h});`),
    "}",
  ];
  const expansion = members.map(m => `std::println("{} = {}", "${m.id}", obj.${m.id});`);
  const output = mode === "reflect" ? members : members.filter(m => HAND.includes(m.id));

  return (
    <Figure
      title={tx(t, "figCppRefl_title", "Printing every field: by hand, or by asking the compiler")}
      head={<Choice value={mode} onChange={setMode} options={[
        ["reflect", tx(t, "figCppRefl_reflect", "C++26 reflection")],
        ["hand", tx(t, "figCppRefl_hand", "written by hand")],
      ]} />}
      controls={
        <div className="flex gap-1.5 items-center" style={{ flexWrap: "wrap" }}>
          <span className="text-[12px] text-[var(--text-main)] mr-1">{tx(t, "figCppRefl_members", "Player's members")}</span>
          {MEMBERS.map(m => (
            <Btn key={m.id} active={on[m.id]} onClick={() => toggle(m.id)}>{on[m.id] ? "✓ " : ""}{m.id}{m.id === "alive" ? ` · ${tx(t, "figCppRefl_breakIt", "break it")}` : ""}</Btn>
          ))}
        </div>
      }
      note={tx(t, "figCppRefl_note", "Tick and untick members of Player. The reflection version is one function for any struct; the expansion panel shows the lines the compiler stamps out for this one. Break it: add alive and switch to the hand-written version, then remove hp.")}
    >
      <div className="grid 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="p-3 2xl:border-r border-b 2xl:border-b-0 border-[var(--border)] flex flex-col gap-3 min-w-0">
          <div className={box}>
            {label(tx(t, "figCppRefl_struct", "the struct"))}
            <div className={pre + " text-[var(--text-main)]"}>{structCode.join("\n")}</div>
          </div>
          <div className={box}>
            {label(mode === "reflect" ? tx(t, "figCppRefl_fnReflect", "one function for every struct") : tx(t, "figCppRefl_fnHand", "one function per struct, kept up to date by hand"))}
            <div className={pre + " text-[var(--text-muted)]"}>{(mode === "reflect" ? reflectCode : handCode).join("\n")}</div>
          </div>
        </div>
        <div className="p-3 flex flex-col gap-3 min-w-0">
          {mode === "reflect" && (
            <div className={box}>
              {label(tx(t, "figCppRefl_expand", "what template for stamps out for Player"))}
              <div className={pre} style={{ color: C.purple }}>{expansion.length ? expansion.join("\n") : tx(t, "figCppRefl_empty", "(no members: nothing at all)")}</div>
            </div>
          )}
          <div className={box + " min-h-[6rem]"}>
            {label(handBroken ? "g++ -std=c++26" : tx(t, "figCppRefl_output", "output"))}
            {handBroken ? (
              <div className={pre + " whitespace-pre-wrap"} style={{ color: C.red }}>
                {missingInStruct.map(h => `error: 'const struct Player' has no member named '${h}'`).join("\n")}
              </div>
            ) : (
              <div className={pre}>
                {output.map(m => <div key={m.id} style={{ color: C.green }}>{`${m.id} = ${m.out}`}</div>)}
                {output.length === 0 && <span className="text-[var(--text-muted)]">—</span>}
              </div>
            )}
          </div>
          <p className="text-[12.5px] leading-relaxed text-[var(--text-main)]" aria-live="polite">
            {mode === "reflect"
              ? tx(t, "figCppRefl_okReflect", "The compiler lists Player's members while compiling, so the output always matches the struct, whatever you tick.")
              : handBroken
                ? tx(t, "figCppRefl_brokenHand", "The hand-written function still names a member that no longer exists, so it does not even compile.")
                : notPrinted.length
                  ? tx(t, "figCppRefl_staleHand", "It compiles and runs, and silently leaves out {m}: nobody updated the function when the struct changed.").replace("{m}", notPrinted.map(m => m.id).join(", "))
                  : tx(t, "figCppRefl_okHand", "Correct, for now: the function and the struct happen to agree.")}
          </p>
        </div>
      </div>
    </Figure>
  );
}
