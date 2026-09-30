"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, C } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// What a vertex array object records. The setup code runs one line at a time;
// the panel shows the context's bindings and the VAO's contents. Each
// glVertexAttribPointer stores, in the bound VAO, the attribute's format AND
// the buffer bound to GL_ARRAY_BUFFER at that moment; the GL_ARRAY_BUFFER
// binding itself is not part of the VAO, so changing it afterwards has no
// effect. The GL_ELEMENT_ARRAY_BUFFER binding is part of it. In the second
// program no VAO is bound, which a Core context rejects.

type AttribState = { enabled: boolean; buffer: number; size: number; stride: number; offset: number } | null;
type S = { vao: number; vaoExists: boolean; arrayBuffer: number; attribs: [AttribState, AttribState]; ebo: number; buffers: number[]; err?: string; hit?: string };
type Op = { code: string; key: string; en: string; run: (s: S) => S };

const START: S = { vao: 0, vaoExists: false, arrayBuffer: 0, attribs: [null, null], ebo: 0, buffers: [] };
const noHit = (s: S): S => ({ ...s, hit: undefined, err: undefined });
const pointer = (loc: 0 | 1, offset: number): Op => ({
  code: `glVertexAttribPointer(${loc}, 3, GL_FLOAT, GL_FALSE, 24, (void*)${offset});`,
  key: `ptr${loc}`,
  en: loc === 0
    ? "Stores attribute 0's format in the bound VAO (3 floats, stride 24, offset 0) together with the buffer currently bound to GL_ARRAY_BUFFER, buffer 1. This is the moment the VAO learns which buffer to read."
    : "Attribute 1, the colour: same buffer, same stride, starting 12 bytes in.",
  run: s => {
    if (!s.vao) return { ...s, err: "GL_INVALID_OPERATION", hit: undefined };
    const a = [...s.attribs] as S["attribs"];
    a[loc] = { enabled: a[loc]?.enabled ?? false, buffer: s.arrayBuffer, size: 3, stride: 24, offset };
    return { ...noHit(s), attribs: a, hit: `a${loc}` };
  },
});
const enable = (loc: 0 | 1): Op => ({
  code: `glEnableVertexAttribArray(${loc});`,
  key: `en${loc}`,
  en: `Switches attribute ${loc} on in the VAO. A disabled attribute is not read from the buffer at all; the shader gets a constant value instead.`,
  run: s => {
    if (!s.vao) return { ...s, err: "GL_INVALID_OPERATION", hit: undefined };
    const a = [...s.attribs] as S["attribs"];
    a[loc] = { ...(a[loc] ?? { buffer: 0, size: 4, stride: 0, offset: 0 }), enabled: true };
    return { ...noHit(s), attribs: a, hit: `a${loc}` };
  },
});

const GEN_VAO: Op = { code: "glGenVertexArrays(1, &vao);", key: "genVao", en: "Creates VAO 1. It starts empty: every attribute disabled, no element buffer.", run: s => ({ ...noHit(s), vaoExists: true, hit: "vao" }) };
const GEN_BUF: Op = { code: "glGenBuffers(1, &vbo); glGenBuffers(1, &ebo);", key: "genBuf", en: "Two buffer objects: 1 for the vertices, 2 for the indices.", run: s => ({ ...noHit(s), buffers: [1, 2] }) };
const BIND_VAO: Op = { code: "glBindVertexArray(vao);", key: "bindVao", en: "From now on, attribute and element-buffer calls are recorded into VAO 1.", run: s => ({ ...noHit(s), vao: 1, hit: "ctxVao" }) };
const BIND_VBO: Op = { code: "glBindBuffer(GL_ARRAY_BUFFER, vbo);", key: "bindVbo", en: "Binds buffer 1 to GL_ARRAY_BUFFER. This is context state: the VAO does not store it.", run: s => ({ ...noHit(s), arrayBuffer: 1, hit: "ctxArray" }) };
const DATA: Op = { code: "glBufferData(GL_ARRAY_BUFFER, sizeof v, v, GL_STATIC_DRAW);", key: "data", en: "Uploads the vertices into buffer 1. Uploading is independent of the VAO; it could happen before or after.", run: s => noHit(s) };
const BIND_EBO: Op = { code: "glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, ebo);", key: "bindEbo", en: "Unlike GL_ARRAY_BUFFER, the element (index) buffer binding IS stored in the bound VAO: VAO 1 now remembers buffer 2 as its index buffer (EBO chapter).", run: s => (s.vao ? { ...noHit(s), ebo: 2, hit: "ebo" } : noHit(s)) };
const UNBIND_VAO: Op = { code: "glBindVertexArray(0);", key: "unbindVao", en: "Stops recording. VAO 1 keeps everything it recorded; binding it again restores the whole layout in one call.", run: s => ({ ...noHit(s), vao: 0, hit: "ctxVao" }) };
const UNBIND_VBO: Op = { code: "glBindBuffer(GL_ARRAY_BUFFER, 0);", key: "unbindVbo", en: "Changes only the context's GL_ARRAY_BUFFER binding. The VAO's attributes still point at buffer 1, because they captured it at glVertexAttribPointer time.", run: s => ({ ...noHit(s), arrayBuffer: 0, hit: "ctxArray" }) };

const PROGRAMS = {
  ok: [GEN_VAO, GEN_BUF, BIND_VAO, BIND_VBO, DATA, pointer(0, 0), enable(0), pointer(1, 12), enable(1), BIND_EBO, UNBIND_VAO, UNBIND_VBO],
  novao: [GEN_VAO, GEN_BUF, BIND_VBO, DATA,
    { ...pointer(0, 0), key: "ptrNoVao", en: "No VAO is bound. In a Core profile context there is no default VAO, so this call fails with GL_INVALID_OPERATION and records nothing. Nothing will draw, and the only symptom is an empty screen unless you check glGetError or use the debug callback." },
    enable(0)],
};
type Prog = keyof typeof PROGRAMS;

export function VaoRecordFigure({ t }: { t?: TrackTranslations }) {
  const [prog, setProg] = useState<Prog>("ok");
  const [k, setK] = useState(0);
  const ops = PROGRAMS[prog];
  const s = ops.slice(0, k).reduce((st, op) => op.run(st), START);
  const last = k > 0 ? ops[k - 1] : null;
  const glow = (id: string) => (s.hit === id ? { boxShadow: `0 0 0 2px ${C.amber}` } : undefined);

  return (
    <Figure
      title={tx(t, "figGlVao_title", "What a VAO records")}
      head={<Choice value={prog} onChange={p => { setProg(p); setK(0); }} options={[["ok", tx(t, "figGlVao_ok", "record a VAO")], ["novao", tx(t, "figGlVao_novao", "no VAO bound")]] as const} />}
      controls={<>
        <Row>
          <Btn onClick={() => setK(v => Math.max(0, v - 1))}>◀</Btn>
          <Btn onClick={() => setK(v => Math.min(ops.length, v + 1))}>{tx(t, "figGlVao_step", "run next line")} ▶</Btn>
          <Btn onClick={() => setK(0)}>↻</Btn>
        </Row>
        <p className="text-[13px] leading-relaxed min-h-[3em]" style={{ color: s.err ? C.red : "var(--text-main)" }}>
          {s.err && <strong>{s.err}. </strong>}
          {last ? tx(t, `figGlVao_${last.key}`, last.en) : tx(t, "figGlVao_start", "Run the setup code one line at a time and watch what goes into the context and what goes into the VAO.")}
        </p>
      </>}
      note={tx(t, "figGlVao_note", "A VAO stores, for each attribute location: whether it is enabled, its format (size, type, normalized, stride, offset) and the buffer it reads from; plus the element buffer binding. It does not store the GL_ARRAY_BUFFER binding, the shader program, uniforms or textures. The buffer an attribute reads is captured when glVertexAttribPointer runs, so that is the call that needs both the right VAO and the right buffer bound.")}
    >
      <div className="grid md:grid-cols-2">
        <ol className="p-3 font-mono text-[11.5px] leading-relaxed">
          {ops.map((op, i) => (
            <li key={i} className="px-2 py-0.5 rounded" style={{
              background: i === k - 1 ? (s.err ? "rgba(239,68,68,0.15)" : "var(--primary-low)") : undefined,
              color: i < k ? "var(--text-main)" : "var(--text-muted)", opacity: i < k ? 1 : 0.55,
            }}>
              <span className="select-none text-[var(--text-muted)] mr-2">{i + 1}</span>{op.code}
            </li>
          ))}
        </ol>
        <div className="p-3 md:border-l border-t md:border-t-0 border-[var(--border)] space-y-3 font-mono text-[11.5px]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">{tx(t, "figGlVao_ctx", "context")}</p>
            <div className="rounded px-1" style={glow("ctxVao")}>GL_VERTEX_ARRAY_BINDING = <b>{s.vao}</b></div>
            <div className="rounded px-1" style={glow("ctxArray")}>GL_ARRAY_BUFFER = <b>{s.arrayBuffer}</b></div>
          </div>
          <div className="rounded-lg border p-2" style={{ borderColor: s.vao ? C.amber : "var(--border)", ...glow("vao") }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: s.vaoExists ? C.amber : "var(--text-muted)" }}>
              VAO 1 {s.vaoExists ? (s.vao ? tx(t, "figGlVao_recording", "(bound: recording)") : "") : tx(t, "figGlVao_none", "(does not exist yet)")}
            </p>
            {s.vaoExists && <table className="w-full border-separate [border-spacing:6px_1px] -ml-1.5">
              <thead className="text-[var(--text-muted)] text-[10px]"><tr><td>loc</td><td>on</td><td>buffer</td><td>size</td><td>stride</td><td>offset</td></tr></thead>
              <tbody>
                {s.attribs.map((a, i) => (
                  <tr key={i} className="rounded" style={s.hit === `a${i}` ? { background: "var(--primary-low)" } : undefined}>
                    <td>{i}</td>
                    <td style={{ color: a?.enabled ? C.green : C.muted }}>{a?.enabled ? "✓" : "—"}</td>
                    <td>{a ? a.buffer : "—"}</td><td>{a ? a.size : "—"}</td><td>{a ? a.stride : "—"}</td><td>{a ? a.offset : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>}
            {s.vaoExists && <div className="mt-1 rounded px-1" style={glow("ebo")}>GL_ELEMENT_ARRAY_BUFFER = <b>{s.ebo}</b></div>}
          </div>
        </div>
      </div>
    </Figure>
  );
}
