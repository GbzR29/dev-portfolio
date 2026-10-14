"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A four-file C project (vec.h, body.h, vec.c, main.c) going through the three
// stages of a build. The preprocessor turns each .c file into a translation
// unit by pasting in its headers; the compiler turns each unit into an object
// file that defines some symbols and needs others; the linker matches every
// need with exactly one definition. Four switches break it the classic ways:
// no include guard (a type defined twice), a missing #include (an unknown
// type), a function body in a header (defined in two object files) and a .c
// file left out of the build (an undefined reference).

type Helper = "none" | "plain" | "inline";
type FileId = "vec.h" | "body.h" | "vec.c" | "main.c";

function sources(guard: boolean, includeBody: boolean, helper: Helper): Record<FileId, { text: string; on?: boolean }[]> {
  return {
    "vec.h": [
      { text: "#ifndef VEC_H", on: guard },
      { text: "#define VEC_H", on: guard },
      { text: "typedef struct { float x, y; } Vec;" },
      { text: "float vec_len(Vec v);           // declaration only" },
      { text: helper === "inline" ? "static inline float sq(float a) { return a * a; }" : "float sq(float a) { return a * a; }", on: helper !== "none" },
      { text: "#endif", on: guard },
    ],
    "body.h": [
      { text: "#include \"vec.h\"" },
      { text: "typedef struct { Vec pos, vel; } Body;" },
    ],
    "vec.c": [
      { text: "#include <math.h>" },
      { text: "#include \"vec.h\"" },
      { text: "float vec_len(Vec v) {" },
      { text: "    return sqrtf(v.x * v.x + v.y * v.y);" },
      { text: "}" },
    ],
    "main.c": [
      { text: "#include <stdio.h>" },
      { text: "#include \"vec.h\"" },
      { text: "#include \"body.h\"", on: includeBody },
      { text: "int main(void) {" },
      { text: "    Body b = { {3, 4}, {0, 0} };" },
      { text: "    printf(\"%.1f\\n\", vec_len(b.pos));" },
      { text: "}" },
    ],
  };
}

const Stage = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
  <div className="min-w-0 flex flex-col gap-2">
    <div className="flex items-baseline gap-2">
      <span className="font-mono text-[11px] text-[var(--primary)]">{n}</span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{title}</span>
    </div>
    {children}
  </div>
);

const Card = ({ title, bad, children }: { title: string; bad?: boolean; children: React.ReactNode }) => (
  <div className="rounded-lg border px-3 py-2 bg-[var(--code-surface)] text-[12px] font-mono"
    style={{ borderColor: bad ? C.red : "var(--code-border)" }}>
    <div className="text-[var(--text-main)] font-bold mb-1">{title}</div>
    {children}
  </div>
);

export function BuildPipelineFigure({ t }: { t?: TrackTranslations }) {
  const [guard, setGuard] = useState(true);
  const [includeBody, setIncludeBody] = useState(true);
  const [helper, setHelper] = useState<Helper>("none");
  const [linkVec, setLinkVec] = useState(true);
  const [file, setFile] = useState<FileId>("main.c");
  const src = sources(guard, includeBody, helper);

  // ── Stage 1: what each translation unit contains ──
  const mainUnit = [
    { name: "stdio.h", note: tx(t, "figCBuild_sys", "system header, ~800 lines") },
    { name: "vec.h", note: tx(t, "figCBuild_pasted", "pasted") },
    ...(includeBody ? [
      { name: "body.h", note: tx(t, "figCBuild_pasted", "pasted") },
      guard
        ? { name: "→ vec.h", note: tx(t, "figCBuild_skipped", "skipped: VEC_H already defined") }
        : { name: "→ vec.h", note: tx(t, "figCBuild_again", "pasted AGAIN"), bad: true },
    ] : []),
    { name: "main.c", note: tx(t, "figCBuild_own", "its own code") },
  ];
  const vecUnit = [
    { name: "math.h", note: tx(t, "figCBuild_sys", "system header, ~800 lines") },
    { name: "vec.h", note: tx(t, "figCBuild_pasted", "pasted") },
    { name: "vec.c", note: tx(t, "figCBuild_own", "its own code") },
  ];

  // ── Stage 2: compile errors, then symbols ──
  const mainErrors: string[] = [];
  if (!includeBody) mainErrors.push("main.c:5: error: unknown type name 'Body'");
  if (includeBody && !guard) {
    mainErrors.push("vec.h:3: error: conflicting types for 'Vec'");
    if (helper !== "none") mainErrors.push("vec.h:5: error: redefinition of 'sq'");
  }
  const compiled = mainErrors.length === 0;
  const sqSym = helper === "plain" ? ["sq"] : helper === "inline" ? ["sq (static: private to this file)"] : [];
  const mainObj = { defines: ["main", ...sqSym], needs: ["vec_len", "printf"] };
  const vecObj = { defines: ["vec_len", ...sqSym], needs: ["sqrtf"] };

  // ── Stage 3: link ──
  const linkErrors: string[] = [];
  if (compiled) {
    if (!linkVec) linkErrors.push("main.o: undefined reference to `vec_len'");
    if (linkVec && helper === "plain") linkErrors.push("vec.o: multiple definition of `sq'; main.o: first defined here");
  }
  const ok = compiled && linkErrors.length === 0;
  const cmd = `gcc main.c${linkVec ? " vec.c" : ""} -lm -o game`;

  const toggle = (on: boolean, set: (v: boolean) => void, label: string) => (
    <label className="flex items-center gap-2 text-[12px] text-[var(--text-main)] cursor-pointer select-none">
      <input type="checkbox" checked={on} onChange={e => set(e.target.checked)} className="accent-[var(--primary)]" />
      {label}
    </label>
  );

  return (
    <Figure
      title={tx(t, "figCBuild_title", "From four files to one program: preprocess, compile, link")}
      controls={<>
        <div className="grid gap-2 sm:grid-cols-2">
          {toggle(guard, setGuard, tx(t, "figCBuild_tGuard", "include guard in vec.h"))}
          {toggle(includeBody, setIncludeBody, tx(t, "figCBuild_tBody", "main.c includes body.h"))}
          {toggle(linkVec, setLinkVec, tx(t, "figCBuild_tLink", "vec.c is part of the build"))}
          <div className="flex items-center gap-2 flex-wrap text-[12px] text-[var(--text-main)]">
            <span>{tx(t, "figCBuild_tHelper", "sq() in vec.h:")}</span>
            <Choice value={helper} onChange={setHelper} options={[["none", tx(t, "figCBuild_hNone", "none")], ["plain", tx(t, "figCBuild_hPlain", "with a body")], ["inline", "static inline"]] as const} />
          </div>
        </div>
      </>}
      note={tx(t, "figCBuild_note", "Break it: switch off the include guard, drop an #include, put a function body in the header, or leave vec.c out of the build. Each mistake fails at a different stage, and the stage tells you where to look.")}
    >
      <div className="p-4 flex flex-col gap-4">
        {/* Source files, one at a time */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-1.5 flex-wrap">
            {(Object.keys(src) as FileId[]).map(f => <Btn key={f} active={file === f} onClick={() => setFile(f)}>{f}</Btn>)}
          </div>
          <pre className="rounded-lg border border-[var(--code-border)] bg-[var(--code-surface)] px-3 py-2 font-mono text-[12px] leading-[1.6] overflow-x-auto">
            {src[file].map((l, i) => (
              <div key={i} className={l.on === false ? "line-through opacity-35" : "text-[var(--text-main)]"}>{l.text}</div>
            ))}
          </pre>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Stage n={1} title={tx(t, "figCBuild_s1", "Preprocessor: translation units")}>
            {([["main.c", mainUnit], ["vec.c", vecUnit]] as const).filter(([f]) => f === "main.c" || linkVec).map(([f, unit]) => (
              <Card key={f} title={f === "main.c" ? "main.i" : "vec.i"} bad={f === "main.c" && unit.some(u => "bad" in u && u.bad)}>
                {unit.map((u, i) => (
                  <div key={i} className="leading-snug py-0.5">
                    <div style={{ color: "bad" in u && u.bad ? C.red : undefined }}>{u.name}</div>
                    <div className="text-[10.5px]" style={{ color: "bad" in u && u.bad ? C.red : "var(--text-muted)" }}>{u.note}</div>
                  </div>
                ))}
              </Card>
            ))}
          </Stage>

          <Stage n={2} title={tx(t, "figCBuild_s2", "Compiler: object files")}>
            {compiled ? (
              ([["main.o", mainObj], ...(linkVec ? [["vec.o", vecObj]] as const : [])] as const).map(([f, o]) => (
                <Card key={f} title={f}>
                  <div><span className="text-[var(--text-muted)]">{tx(t, "figCBuild_defines", "defines")}: </span>
                    <span style={{ color: C.green }}>{o.defines.join(", ")}</span></div>
                  <div><span className="text-[var(--text-muted)]">{tx(t, "figCBuild_needs", "needs")}: </span>
                    <span style={{ color: C.amber }}>{o.needs.join(", ")}</span></div>
                </Card>
              ))
            ) : (
              <Card title="main.o" bad>
                <span style={{ color: C.red }}>{tx(t, "figCBuild_noObj", "not produced: compile error")}</span>
              </Card>
            )}
          </Stage>

          <Stage n={3} title={tx(t, "figCBuild_s3", "Linker: the program")}>
            <Card title="game" bad={!ok}>
              {!compiled ? (
                <span className="text-[var(--text-muted)]">{tx(t, "figCBuild_notRun", "not run: compiling failed first")}</span>
              ) : (
                <>
                  <div>vec_len → {linkVec ? <span style={{ color: C.green }}>vec.o</span> : <span style={{ color: C.red }}>{tx(t, "figCBuild_nowhere", "nowhere")}</span>}</div>
                  <div>printf → <span style={{ color: C.green }}>libc</span></div>
                  <div>sqrtf → <span style={{ color: C.green }}>libm (-lm)</span></div>
                  {helper === "plain" && linkVec && <div>sq → <span style={{ color: C.red }}>main.o {tx(t, "figCBuild_and", "and")} vec.o</span></div>}
                </>
              )}
            </Card>
          </Stage>
        </div>

        {/* Terminal */}
        <pre className="rounded-lg bg-[var(--code-bg)] border border-[var(--code-border)] px-3 py-2 font-mono text-[12px] leading-[1.6] overflow-x-auto" aria-live="polite">
          <div className="text-[var(--text-muted)]">$ {cmd}</div>
          {[...mainErrors, ...linkErrors].map((e, i) => <div key={i} style={{ color: C.red }}>{e}</div>)}
          {ok && <>
            <div className="text-[var(--text-muted)]">$ ./game</div>
            <div style={{ color: C.green }}>5.0</div>
          </>}
        </pre>
      </div>
    </Figure>
  );
}
