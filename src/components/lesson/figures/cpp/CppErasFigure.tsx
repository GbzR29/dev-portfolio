"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure, Row } from "@/components/lesson/kit/figure";
import { ERAS, STDS, type EraId } from "./erasData";

// ── What this figure shows ────────────────────────────────────────────────────
// One small program (list two shader names, then print them numbered) written
// the way each era of C++ wrote it, from C++98 to C++23. The lines that changed
// since the previous era are marked, and each change has a short note. Under the
// code, a mock compiler builds the selected version with the -std flag the
// reader picks: code from a newer era than the flag fails, with the error the
// compiler really gives for its first new feature ("break it").

export function CppErasFigure({ t }: { t?: TrackTranslations }) {
  const [era, setEra] = useState<EraId>("cpp98");
  const [std, setStd] = useState<EraId>("cpp23");
  const i = ERAS.findIndex(e => e.id === era);
  const e = ERAS[i];
  const prev = i > 0 ? ERAS[i - 1] : null;
  const changed = new Set(prev ? e.code.filter(l => !prev.code.includes(l)) : []);
  const stdIndex = ERAS.findIndex(x => x.id === std);
  const ok = i <= stdIndex;
  const flag = STDS[std];

  return (
    <Figure
      title={tx(t, "figCppEra_title", "One program, five eras of C++")}
      head={<Choice value={era} onChange={setEra} options={ERAS.map(x => [x.id, x.label] as [EraId, string])} />}
      controls={<>
        <Row>
          <span className="text-[12px] text-[var(--text-main)] mr-1">{tx(t, "figCppEra_compileWith", "Compile with")}</span>
          {ERAS.map(x => <Btn key={x.id} active={std === x.id} onClick={() => setStd(x.id)}>{STDS[x.id]}</Btn>)}
        </Row>
      </>}
      note={tx(t, "figCppEra_note", "Pick an era to see how the same program was written then; marked lines changed since the era before. Then break it: compile new code with an old -std flag and read the error. Old code still compiles with every newer flag.")}
    >
      <div className="p-4 grid gap-4 2xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <pre className="rounded-lg border border-[var(--code-border)] bg-[var(--code-surface)] px-3 py-2 font-mono text-[12px] leading-[1.6] overflow-x-auto min-w-0">
          {e.code.map((l, k) => (
            <div key={k} className="flex gap-2">
              <span className="w-2 shrink-0 select-none" style={{ color: C.green }}>{changed.has(l) ? "+" : " "}</span>
              <span className={changed.has(l) ? "text-[var(--text-main)]" : "text-[var(--text-muted)]"}
                style={changed.has(l) ? { background: "color-mix(in srgb, #22c55e 12%, transparent)" } : undefined}>{l || " "}</span>
            </div>
          ))}
        </pre>

        <div className="flex flex-col gap-3 min-w-0">
          <div className="text-[13px] leading-relaxed text-[var(--text-main)]">
            <div className="font-mono text-[11px] text-[var(--primary)] mb-1">{e.label} · {e.year}</div>
            {tx(t, `figCppEra_${e.id}_sum`, e.summary)}
          </div>
          {e.changes.length > 0 && (
            <ul className="flex flex-col gap-2 text-[12px] leading-relaxed">
              {e.changes.map((c, k) => (
                <li key={k} className="flex gap-2">
                  <span className="font-mono shrink-0" style={{ color: C.green }}>+</span>
                  <span><code className="font-mono text-[var(--text-main)]">{c.code}</code>{" "}
                    <span className="text-[var(--text-muted)]">{tx(t, `figCppEra_${e.id}_c${k}`, c.en)}</span></span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Terminal */}
        <pre className="2xl:col-span-2 rounded-lg bg-[var(--code-bg)] border border-[var(--code-border)] px-3 py-2 font-mono text-[12px] leading-[1.6] overflow-x-auto" aria-live="polite">
          <div className="text-[var(--text-muted)]">$ g++ -std={flag} shaders.cpp -o shaders</div>
          {ok ? <>
            <div className="text-[var(--text-muted)]">$ ./shaders</div>
            <div style={{ color: C.green }}>0: vertex</div>
            <div style={{ color: C.green }}>1: fragment</div>
          </> : (
            <div style={{ color: C.red }}>{e.error}</div>
          )}
        </pre>
      </div>
    </Figure>
  );
}
