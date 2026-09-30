"use client";

import { useState, type ReactNode } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, C } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The OpenGL context as a state machine. Each line of a short program is run
// one at a time; the panel shows the context's state after it: the bind points
// (which buffer is "the" GL_ARRAY_BUFFER, which program is in use, the clear
// colour) and the objects that exist. Calls such as glBufferData name no
// object: they act on whatever is bound. The "forgot a bind" program shows the
// classic bug that follows: the second upload overwrites the first buffer.

type Buf = { name: number; data: string | null; hit?: boolean };
type State = { buffers: Buf[]; arrayBuffer: number; program: number; clear: [number, number, number]; framebuffer: [number, number, number] | null; err?: boolean };
type Op = { code: string; key: string; en: string; run: (s: State) => State };

const START: State = { buffers: [], arrayBuffer: 0, program: 0, clear: [0, 0, 0], framebuffer: null };
const upd = (s: State, name: number, data: string): State => ({
  ...s, buffers: s.buffers.map(b => ({ ...b, hit: b.name === name, data: b.name === name ? data : b.data })),
});
const clearHits = (s: State): State => ({ ...s, buffers: s.buffers.map(b => ({ ...b, hit: false })) });

const GEN_A: Op = { code: "glGenBuffers(1, &triVbo);", key: "genA", en: "Creates a buffer object and writes its name, the number 1, into triVbo. The buffer exists but holds no data yet.", run: s => ({ ...clearHits(s), buffers: [...s.buffers, { name: 1, data: null, hit: true }] }) };
const GEN_B: Op = { code: "glGenBuffers(1, &quadVbo);", key: "genB", en: "A second buffer object, name 2.", run: s => ({ ...clearHits(s), buffers: [...s.buffers, { name: 2, data: null, hit: true }] }) };
const BIND_A: Op = { code: "glBindBuffer(GL_ARRAY_BUFFER, triVbo);", key: "bindA", en: "Makes buffer 1 the current GL_ARRAY_BUFFER. Nothing is copied: the context just remembers which buffer that name refers to from now on.", run: s => ({ ...clearHits(s), arrayBuffer: 1 }) };
const DATA_A: Op = { code: "glBufferData(GL_ARRAY_BUFFER, sizeof tri, tri, GL_STATIC_DRAW);", key: "dataA", en: "Copies the triangle's 36 bytes into whatever buffer is bound to GL_ARRAY_BUFFER. The call never names the buffer: it is 1 because of the previous line.", run: s => upd(s, s.arrayBuffer, "triangle · 36 B") };
const BIND_B: Op = { code: "glBindBuffer(GL_ARRAY_BUFFER, quadVbo);", key: "bindB", en: "Switches the GL_ARRAY_BUFFER binding to buffer 2. Buffer 1 keeps its data; it is simply no longer the bound one.", run: s => ({ ...clearHits(s), arrayBuffer: 2 }) };
const DATA_B: Op = { code: "glBufferData(GL_ARRAY_BUFFER, sizeof quad, quad, GL_STATIC_DRAW);", key: "dataB", en: "Copies the quad's 72 bytes into the bound buffer.", run: s => upd(s, s.arrayBuffer, "quad · 72 B") };
const CLEARC: Op = { code: "glClearColor(0.10f, 0.45f, 0.60f, 1.0f);", key: "clearC", en: "Sets the clear colour. Nothing is drawn: this is one more value stored in the context, used by every later glClear.", run: s => ({ ...clearHits(s), clear: [0.1, 0.45, 0.6] }) };
const CLEAR: Op = { code: "glClear(GL_COLOR_BUFFER_BIT);", key: "clear", en: "Fills the framebuffer with the current clear colour.", run: s => ({ ...clearHits(s), framebuffer: s.clear }) };
const USE: Op = { code: "glUseProgram(program);", key: "use", en: "Makes program 3 current: every draw call from now on uses its shaders, until another glUseProgram.", run: s => ({ ...clearHits(s), program: 3 }) };

const PROGRAMS = {
  ok: [GEN_A, GEN_B, BIND_A, DATA_A, BIND_B, DATA_B, CLEARC, CLEAR, USE],
  bug: [GEN_A, GEN_B, BIND_A, DATA_A,
    { ...DATA_B, key: "dataBug", en: "The bind of quadVbo was forgotten, so GL_ARRAY_BUFFER still means buffer 1. The quad silently overwrites the triangle, and buffer 2 stays empty. No error is raised: the call was perfectly valid.", run: (s: State) => ({ ...upd(s, s.arrayBuffer, "quad · 72 B"), err: true }) },
    CLEARC, CLEAR, USE],
};
type Prog = keyof typeof PROGRAMS;

const rgb = (c: [number, number, number]) => `rgb(${c.map(v => Math.round(v * 255)).join(",")})`;

function Cell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="py-1 border-b border-[var(--border)] last:border-0 min-w-0">
      <div className="font-mono text-[10px] text-[var(--text-muted)]">{label}</div>
      <div className="font-mono text-[12px] text-[var(--text-main)]">{children}</div>
    </div>
  );
}

export function StateMachineFigure({ t }: { t?: TrackTranslations }) {
  const [prog, setProg] = useState<Prog>("ok");
  const [k, setK] = useState(0);                          // lines executed
  const ops = PROGRAMS[prog];
  const state = ops.slice(0, k).reduce((s, op) => op.run(s), START);
  const last = k > 0 ? ops[k - 1] : null;

  return (
    <Figure
      title={tx(t, "figGlState_title", "The context is a state machine")}
      head={<Choice value={prog} onChange={p => { setProg(p); setK(0); }} options={[["ok", tx(t, "figGlState_ok", "correct")], ["bug", tx(t, "figGlState_bug", "forgot a bind")]] as const} />}
      controls={<>
        <Row>
          <Btn onClick={() => setK(v => Math.max(0, v - 1))}>◀</Btn>
          <Btn onClick={() => setK(v => Math.min(ops.length, v + 1))}>{tx(t, "figGlState_step", "run next line")} ▶</Btn>
          <Btn onClick={() => setK(0)}>↻</Btn>
        </Row>
        <p className="text-[13px] leading-relaxed min-h-[3em]" style={{ color: last && state.err && last.key === "dataBug" ? C.red : "var(--text-main)" }}>
          {last ? tx(t, `figGlState_${last.key}`, last.en) : tx(t, "figGlState_start", "A fresh context: no objects, nothing bound (0 means \"none\"), a black clear colour. Run the program one line at a time.")}
        </p>
      </>}
      note={tx(t, "figGlState_note", "Most OpenGL calls do not say which object they act on. They act on whatever is bound to a bind point, and bind points are global state that stays set until you change it. That makes the order of calls part of the meaning of the program, and a forgotten bind is not an error, just a different, valid program. Direct State Access (4.5, a later chapter) removes the problem by naming the object in every call.")}
    >
      <div className="grid md:grid-cols-2 gap-0">
        <ol className="p-3 font-mono text-[11.5px] leading-relaxed">
          {ops.map((op, i) => (
            <li key={i} className="px-2 py-0.5 rounded"
              style={{
                background: i === k - 1 ? "var(--primary-low)" : undefined,
                color: i < k ? "var(--text-main)" : "var(--text-muted)",
                opacity: i < k ? 1 : 0.55,
              }}>
              <span className="select-none text-[var(--text-muted)] mr-2">{i + 1}</span>{op.code}
            </li>
          ))}
          {prog === "bug" && <li className="px-2 py-0.5 text-[10.5px]" style={{ color: C.red }}>{tx(t, "figGlState_missing", "(glBindBuffer(GL_ARRAY_BUFFER, quadVbo) is missing before line 5)")}</li>}
        </ol>
        <div className="p-3 md:border-l border-t md:border-t-0 border-[var(--border)] space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">{tx(t, "figGlState_ctx", "context state")}</p>
            <Cell label="GL_ARRAY_BUFFER">{state.arrayBuffer || "0"}</Cell>
            <Cell label="GL_CURRENT_PROGRAM">{state.program || "0"}</Cell>
            <Cell label="GL_COLOR_CLEAR_VALUE">
              <span className="inline-block w-3 h-3 rounded-sm align-middle mr-2 border border-[var(--border)]" style={{ background: rgb(state.clear) }} />
              {state.clear.map(v => v.toFixed(2)).join(", ")}
            </Cell>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">{tx(t, "figGlState_objects", "buffer objects")}</p>
            {state.buffers.length === 0 && <p className="font-mono text-[11px] text-[var(--text-muted)]">—</p>}
            {state.buffers.map(b => (
              <div key={b.name} className="flex items-center gap-2 font-mono text-[11.5px] py-0.5">
                <span className="px-1.5 rounded border" style={{ borderColor: b.name === state.arrayBuffer ? C.amber : "var(--border)", color: C.fg }}>#{b.name}</span>
                <span style={{ color: b.hit ? (state.err && b.name === 1 ? C.red : C.green) : "var(--text-muted)" }}>{b.data ?? tx(t, "figGlState_empty", "(empty)")}</span>
                {b.name === state.arrayBuffer && <span className="text-[10px]" style={{ color: C.amber }}>← GL_ARRAY_BUFFER</span>}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">framebuffer</p>
            <span className="inline-block w-24 h-12 rounded border border-[var(--border)]" style={{ background: state.framebuffer ? rgb(state.framebuffer) : "#000" }} />
          </div>
        </div>
      </div>
    </Figure>
  );
}
