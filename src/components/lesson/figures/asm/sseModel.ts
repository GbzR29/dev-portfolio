// ── A tiny SSE machine for the floating-point figure ─────────────────────────
// Runs the scalar SSE instructions gcc emits for small C functions, one line
// at a time: xmm registers are 16 real bytes (so a scalar op visibly touches
// only the low lane), a few integer registers, the flags comisd / ucomisd set
// (ZF, PF, CF), and the constants gcc keeps in .rodata. The listings are gcc
// 14 -O2 output, copied as Compiler Explorer prints it. Results use the same
// IEEE arithmetic as the CPU: Float64 for sd, Math.fround for ss.

export type Xmm = Uint8Array;                       // 16 bytes, lane 0 first
export type SseState = {
  xmm: Xmm[];                                       // xmm0 – xmm2
  gpr: Record<"rax" | "rdx" | "rsi", bigint>;
  flags: { zf: boolean; pf: boolean; cf: boolean };
  done: boolean;
};
export type SseStep = { line: number; state: SseState; wrote: string[] };

const B32 = (BigInt(1) << BigInt(32)) - BigInt(1);
const B64 = (BigInt(1) << BigInt(64)) - BigInt(1);

export const f64 = (x: Xmm, lane = 0) => new DataView(x.buffer, x.byteOffset).getFloat64(lane * 8, true);
export const f32 = (x: Xmm, lane = 0) => new DataView(x.buffer, x.byteOffset).getFloat32(lane * 4, true);
const setF64 = (x: Xmm, v: number, lane = 0) => new DataView(x.buffer, x.byteOffset).setFloat64(lane * 8, v, true);
const setF32 = (x: Xmm, v: number, lane = 0) => new DataView(x.buffer, x.byteOffset).setFloat32(lane * 4, v, true);
export const laneHex = (x: Xmm, lane: number, bytes: 4 | 8) =>
  Array.from(x.slice(lane * bytes, lane * bytes + bytes)).reverse().map(b => b.toString(16).padStart(2, "0")).join("");

/** The shortest decimal that reads back as the same float (4 bytes) or double. */
export function shortest(v: number, single = false): string {
  if (Number.isNaN(v)) return "NaN";
  if (!Number.isFinite(v)) return v > 0 ? "inf" : "-inf";
  if (Object.is(v, -0)) return "-0";
  if (!single) return String(v);
  for (let p = 1; p <= 9; p++) { const s = v.toPrecision(p); if (Math.fround(Number(s)) === v) return String(Number(s)); }
  return String(v);
}

export type SseInput = { xmm?: (number | [number, number])[]; rax?: number; rsi?: number };
export type SseProgram = {
  code: string[];
  consts: Record<string, number>;                   // .LCn → value (double, or float for DWORD loads)
  single?: boolean;                                 // show xmm as 4 floats
  regs: ("xmm0" | "xmm1" | "xmm2" | "rax" | "eax" | "edx" | "esi")[];   // e…: shown as 32-bit values
  flags?: boolean;
  inputs: [label: string, input: SseInput][];
  cuts?: number[][];
};

const XMM = /^xmm(\d)$/;

/** Runs the program on one input; `skip` = removed lines. */
export function runSse(p: SseProgram, input: SseInput, skip: Set<number> = new Set()): SseStep[] {
  const s: SseState = {
    xmm: [0, 1, 2].map(() => new Uint8Array(16)),
    gpr: { rax: BigInt(input.rax ?? 0) & B64, rdx: BigInt(0), rsi: BigInt(input.rsi ?? 0) & B64 },
    flags: { zf: false, pf: false, cf: false }, done: false,
  };
  (input.xmm ?? []).forEach((v, i) => {
    const [lo, hi] = Array.isArray(v) ? v : [v, 0];
    if (p.single) setF32(s.xmm[i], lo); else { setF64(s.xmm[i], lo); setF64(s.xmm[i], hi, 1); }
  });
  const clone = (): SseState => ({ xmm: s.xmm.map(x => x.slice()), gpr: { ...s.gpr }, flags: { ...s.flags }, done: s.done });
  const steps: SseStep[] = [{ line: -1, state: clone(), wrote: [] }];

  const src = (a: string, single: boolean): number => {
    const x = a.match(XMM);
    if (x) return single ? f32(s.xmm[+x[1]]) : f64(s.xmm[+x[1]]);
    const c = a.match(/(\.LC\d+)\[rip\]/);
    if (c) return single ? Math.fround(p.consts[c[1]]) : p.consts[c[1]];
    throw new Error(`sse: bad operand ${a}`);
  };
  const gpr = (r: string) => {
    const base = r === "eax" || r === "rax" || r === "al" ? "rax" : r === "edx" || r === "rdx" ? "rdx" : "rsi";
    return { base: base as "rax" | "rdx" | "rsi", w: r.startsWith("r") ? 64 : r === "al" ? 8 : 32 };
  };
  const setGpr = (r: string, v: bigint) => {
    const { base, w } = gpr(r);
    s.gpr[base] = w === 8 ? (s.gpr[base] & ~BigInt(255)) | (v & BigInt(255)) : v & (w === 64 ? B64 : B32);
  };
  const getGpr = (r: string) => { const { base, w } = gpr(r); return w === 64 ? s.gpr[base] : s.gpr[base] & (w === 8 ? BigInt(255) : B32); };
  const signed = (v: bigint, w: number) => Number(v >= BigInt(1) << BigInt(w - 1) ? v - (BigInt(1) << BigInt(w)) : v);

  for (let line = 0; line < p.code.length && !s.done; line++) {
    if (skip.has(line)) continue;
    const body = p.code[line].trim();
    if (!body || /^[\w.]+:/.test(body)) continue;    // a label ("average:   ..." marks a fragment)
    const sp = body.search(/\s/);
    const op = sp < 0 ? body : body.slice(0, sp);
    const args = sp < 0 ? [] : body.slice(sp).split(",").map(a => a.trim());
    const wrote: string[] = [];
    const dx = args[0]?.match(XMM);
    switch (op) {
      case "addsd": case "subsd": case "mulsd": case "divsd": case "sqrtsd":
      case "addss": case "subss": case "mulss": case "divss": {
        const single = op.endsWith("ss");
        const a = src(args[0], single), b = src(args[1], single);
        const k = op.slice(0, -2);
        let r = k === "add" ? a + b : k === "sub" ? a - b : k === "mul" ? a * b : k === "div" ? a / b : Math.sqrt(b);
        if (single) { r = Math.fround(r); setF32(s.xmm[+dx![1]], r); } else setF64(s.xmm[+dx![1]], r);
        wrote.push(args[0]); break;
      }
      case "movsd": {                                // from memory: the upper lane is zeroed
        const x = s.xmm[+dx![1]];
        x.fill(0); setF64(x, src(args[1], false)); wrote.push(args[0]); break;
      }
      case "pxor": case "xorps": s.xmm[+dx![1]].fill(0); wrote.push(args[0]); break;
      case "cvtsi2sd": {                             // keeps the upper lane
        const r = args[1], w = gpr(r).w;
        setF64(s.xmm[+dx![1]], signed(getGpr(r), w)); wrote.push(args[0]); break;
      }
      case "cvttsd2si": {
        const v = f64(s.xmm[+args[1].match(XMM)![1]]);
        const w = gpr(args[0]).w;
        const lim = 2 ** (w - 1);
        const r = Number.isNaN(v) || v >= lim || v < -lim ? -lim : Math.trunc(v);   // out of range: the "integer indefinite" value
        setGpr(args[0], BigInt(r)); wrote.push(gpr(args[0]).base); break;
      }
      case "comisd": case "ucomisd": {
        const a = src(args[0], false), b = src(args[1], false);
        const un = Number.isNaN(a) || Number.isNaN(b);
        s.flags = un ? { zf: true, pf: true, cf: true } : { zf: a === b, pf: false, cf: a < b };
        wrote.push("flags"); break;
      }
      case "xor": setGpr(args[0], BigInt(0)); wrote.push(gpr(args[0]).base); break;
      case "mov": setGpr(args[0], BigInt(Number(args[1]))); wrote.push(gpr(args[0]).base); break;
      case "seta": case "setnp": {
        const f = s.flags;
        setGpr(args[0], BigInt((op === "seta" ? !f.cf && !f.zf : !f.pf) ? 1 : 0)); wrote.push("rax"); break;
      }
      case "cmovne": if (!s.flags.zf) { setGpr(args[0], getGpr(args[1])); wrote.push(gpr(args[0]).base); } break;
      case "ret": s.done = true; break;
      default: throw new Error(`sse: unknown instruction ${op}`);
    }
    steps.push({ line, state: clone(), wrote });
  }
  return steps;
}
