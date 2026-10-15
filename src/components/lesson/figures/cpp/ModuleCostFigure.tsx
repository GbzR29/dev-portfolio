"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Choice, Figure, Slider } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The cost of a full rebuild of a project whose .cpp files all use <vector>,
// <string>, <algorithm> and <unordered_map>. Measured with g++ 14.2 (MinGW,
// -O0, one file at a time) on a Ryzen 5 5600X: with #include each file is
// 43,135 lines after preprocessing and compiles in 488 ms; compiling the four
// header units once takes 1,681 ms, after which a file that imports them
// compiles in 92 ms. A file with no headers at all compiles in 87 ms.

const INC_MS = 488, IMP_MS = 92, BUILD_MS = 1681, LINES = 43_135;

const fmtTime = (ms: number) => (ms < 10_000 ? `${(ms / 1000).toFixed(1)} s` : ms < 120_000 ? `${Math.round(ms / 1000)} s` : `${(ms / 60_000).toFixed(1)} min`);
const fmtInt = (n: number) => n.toLocaleString("en-US");

export function ModuleCostFigure({ t }: { t?: TrackTranslations }) {
  const [files, setFiles] = useState(300);
  const [mode, setMode] = useState<"include" | "import">("include");
  const inc = files * INC_MS;
  const imp = BUILD_MS + files * IMP_MS;
  const max = Math.max(inc, imp);

  const box = "rounded-lg bg-[var(--code-surface)] border border-[var(--code-border)] px-3 py-2";
  const bar = (name: string, ms: number, col: string, on: boolean, detail: string) => (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2 text-[12px]">
        <span className="font-mono font-bold" style={{ color: on ? "var(--text-main)" : "var(--text-muted)" }}>{name}</span>
        <span className="text-[11px] text-[var(--text-muted)]">{detail}</span>
        <span className="ml-auto font-mono font-bold" style={{ color: col }}>{fmtTime(ms)}</span>
      </div>
      <div className="h-4 rounded bg-[var(--code-surface)] border border-[var(--code-border)] overflow-hidden">
        <div className="h-full rounded transition-all" style={{ width: `${(ms / max) * 100}%`, background: col, opacity: on ? 0.9 : 0.45 }} />
      </div>
    </div>
  );

  return (
    <Figure
      title={tx(t, "figCppMod_title", "A full rebuild: #include against import")}
      head={<Choice value={mode} onChange={setMode} options={[["include", "#include"], ["import", "import"]]} />}
      controls={<Slider label={tx(t, "figCppMod_files", ".cpp files")} value={files} min={1} max={500} step={1} onChange={setFiles} fmt={v => String(v)} width="w-20" />}
      note={tx(t, "figCppMod_note", "Move the number of .cpp files. Measured with g++ 14 on one core: a build system spreads the files over all cores, which divides both totals but not their ratio. With only a few files, building the modules first does not pay off yet; find where the bars cross.")}
    >
      <div className="p-3 flex flex-col gap-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <pre className={box + " font-mono text-[11.5px] leading-[1.55] overflow-x-auto"}>
            {mode === "include"
              ? <><span className="text-[var(--text-main)]">{"#include <vector>\n#include <string>\n#include <algorithm>\n#include <unordered_map>"}</span>{"\n\nint add(int a, int b) { return a + b; }"}</>
              : <><span className="text-[var(--text-main)]">{"import <vector>;\nimport <string>;\nimport <algorithm>;\nimport <unordered_map>;"}</span>{"\n\nint add(int a, int b) { return a + b; }"}</>}
          </pre>
          <div className={box + " flex flex-col gap-1 justify-center"}>
            <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{tx(t, "figCppMod_perFile", "what the compiler does for each file")}</div>
            {mode === "include" ? (
              <p className="text-[12.5px] leading-relaxed text-[var(--text-main)]">
                {tx(t, "figCppMod_incText", "The preprocessor pastes the four headers in: {n} lines of library code before your one-line function. The compiler parses and checks all of it, in every file, every build: 488 ms.").replace("{n}", fmtInt(LINES))}
              </p>
            ) : (
              <p className="text-[12.5px] leading-relaxed text-[var(--text-main)]">
                {tx(t, "figCppMod_impText", "The four headers were compiled once into binary module files (1.7 s). Each import loads a ready-made, already-checked description of the declarations instead of parsing text: 92 ms, almost the 87 ms of a file with no headers at all.")}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {bar("#include", inc, C.red, mode === "include", `${files} × 488 ms`)}
          {bar("import", imp, C.green, mode === "import", `1,681 ms + ${files} × 92 ms`)}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div className={box}>
            <div className="text-[10px] text-[var(--text-muted)] leading-tight">{tx(t, "figCppMod_lines", "header lines parsed in total")}</div>
            <div className="font-mono text-[15px] font-bold" style={{ color: mode === "include" ? C.red : C.green }}>
              {mode === "include" ? fmtInt(files * LINES) : fmtInt(LINES)}
            </div>
          </div>
          <div className={box}>
            <div className="text-[10px] text-[var(--text-muted)] leading-tight">{tx(t, "figCppMod_ratio", "import is faster by")}</div>
            <div className="font-mono text-[15px] font-bold" style={{ color: imp < inc ? C.green : C.amber }}>{(inc / imp).toFixed(1)}×</div>
          </div>
          <div className={box}>
            <div className="text-[10px] text-[var(--text-muted)] leading-tight">{tx(t, "figCppMod_even", "break-even")}</div>
            <div className="font-mono text-[15px] font-bold text-[var(--text-main)]">{tx(t, "figCppMod_evenN", "5 files")}</div>
          </div>
        </div>
      </div>
    </Figure>
  );
}
