// ── A tiny x86-64 CPU for the Assembly track ─────────────────────────────────
// Runs a small subset of NASM (Intel syntax) one instruction at a time, the way
// a Linux process would: code at 0x401000, .data right after at 0x402000, a
// stack near the top of the address space, and the two system calls a first
// program needs (write and exit). Registers are 64-bit BigInts; writing a
// 32-bit part clears the top half, writing an 8- or 16-bit part keeps the
// rest, exactly like the real CPU. Instruction lengths come from the real
// encodings (each program line carries NASM's bytes), so rip moves the way it
// does on hardware. Touching memory that is not mapped stops the program with
// a segmentation fault, as Linux would.
//
// The parser is not an assembler: it understands the programs written for the
// figures (see cpuPrograms.ts) and throws on anything else, so a typo shows up
// at once while writing a lesson.

export const GPR = ["rax", "rbx", "rcx", "rdx", "rsi", "rdi", "rbp", "rsp",
  "r8", "r9", "r10", "r11", "r12", "r13", "r14", "r15"] as const;
export type Gpr = (typeof GPR)[number];
export type Width = 8 | 16 | 32 | 64;

/** A register name as written: the 64-bit register it lives in, its width and its bit offset. */
export type RegRef = { name: string; base: Gpr; width: Width; shift: 0 | 8 };

export const TEXT_BASE = 0x401000;
export const DATA_BASE = 0x402000;
export const STACK_TOP = 0x7ffffffde000;
const STACK_SIZE = 0x1000;
const PAGE = 0x1000;

// ── Register names ───────────────────────────────────────────────────────────

const REGS = new Map<string, RegRef>();
{
  const legacy: [Gpr, string, string, string, string?][] = [
    ["rax", "eax", "ax", "al", "ah"], ["rbx", "ebx", "bx", "bl", "bh"],
    ["rcx", "ecx", "cx", "cl", "ch"], ["rdx", "edx", "dx", "dl", "dh"],
    ["rsi", "esi", "si", "sil"], ["rdi", "edi", "di", "dil"],
    ["rbp", "ebp", "bp", "bpl"], ["rsp", "esp", "sp", "spl"],
  ];
  for (const [r, d, w, b, h] of legacy) {
    REGS.set(r, { name: r, base: r, width: 64, shift: 0 });
    REGS.set(d, { name: d, base: r, width: 32, shift: 0 });
    REGS.set(w, { name: w, base: r, width: 16, shift: 0 });
    REGS.set(b, { name: b, base: r, width: 8, shift: 0 });
    if (h) REGS.set(h, { name: h, base: r, width: 8, shift: 8 });
  }
  for (let i = 8; i <= 15; i++) {
    const r = `r${i}` as Gpr;
    REGS.set(r, { name: r, base: r, width: 64, shift: 0 });
    REGS.set(`${r}d`, { name: `${r}d`, base: r, width: 32, shift: 0 });
    REGS.set(`${r}w`, { name: `${r}w`, base: r, width: 16, shift: 0 });
    REGS.set(`${r}b`, { name: `${r}b`, base: r, width: 8, shift: 0 });
  }
}
export const regRef = (name: string) => REGS.get(name.toLowerCase());

// BigInt constants (the build targets ES2017, which has no 1n literals)
export const B0 = BigInt(0), B1 = BigInt(1), B8 = BigInt(8), BFF = BigInt(255);
const M64 = (B1 << BigInt(64)) - B1;
export const mask = (w: Width) => (B1 << BigInt(w)) - B1;
/** Reads `v` (w bits) as a signed number. */
export const signed = (v: bigint, w: Width) => ((v >> BigInt(w - 1)) & B1) === B1 ? v - (B1 << BigInt(w)) : v;
/** A negative number as the 64-bit pattern a register holds. */
const neg64 = (n: number) => BigInt(n) & M64;
export const hex64 = (v: bigint) => v.toString(16).padStart(16, "0");
export const hexAddr = (n: number) => "0x" + n.toString(16);

// ── State ────────────────────────────────────────────────────────────────────

export type Flags = { zf: boolean; sf: boolean; cf: boolean; of: boolean };

export type CpuState = {
  regs: Record<Gpr, bigint>;
  rip: number;
  flags: Flags;
  mem: Map<number, number>;          // address → byte (unwritten bytes read as 0)
  out: string;
  exit?: number;                     // set once the program has ended (exit status)
  fault?: string;                    // English description of the crash
  faultAddr?: number;
};

// ── Program text ─────────────────────────────────────────────────────────────

/** One source line and NASM's bytes for it ("" for lines that make no code). */
export type SrcLine = [src: string, bytes: string];

type Mem = { base?: Gpr; index?: Gpr; scale: number; disp: number; size?: Width };
type Opnd = { k: "reg"; r: RegRef } | { k: "imm"; v: bigint } | { k: "mem"; m: Mem };
export type Instr = { line: number; addr: number; len: number; op: string; args: Opnd[] };

export type Image = {
  instrs: Instr[];
  byAddr: Map<number, number>;       // instruction address → index
  lineAddr: (number | undefined)[];  // per source line: its address (code or data)
  symbols: Map<string, number>;
  data: Map<number, number>;         // initial bytes of .data
  dataEnd: number;                   // first address after .data / .bss
  textEnd: number;
};

const stripComment = (s: string) => {
  let q = false;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '"' || s[i] === "'") q = !q;
    else if (s[i] === ";" && !q) return s.slice(0, i);
  }
  return s;
};

/** Splits "a, b, c" on top-level commas (not inside quotes or brackets). */
function splitArgs(s: string): string[] {
  const out: string[] = [];
  let cur = "", q = false, depth = 0;
  for (const ch of s) {
    if (ch === '"' || ch === "'") q = !q;
    if (!q && ch === "[") depth++;
    if (!q && ch === "]") depth--;
    if (ch === "," && !q && depth === 0) { out.push(cur.trim()); cur = ""; }
    else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** A number or symbol expression: terms joined by + and -, a term may be a product. */
function evalExpr(s: string, sym: Map<string, number>, here = 0): number {
  const terms = s.replace(/\s+/g, "").replace(/-/g, "+-").split("+").filter(Boolean);
  let sum = 0;
  for (let term of terms) {
    let sign = 1;
    if (term.startsWith("-")) { sign = -1; term = term.slice(1); }
    let prod = 1;
    for (const f of term.split("*")) prod *= atom(f, sym, here);
    sum += sign * prod;
  }
  return sum;
}

function atom(f: string, sym: Map<string, number>, here: number): number {
  if (f === "$") return here;
  if (/^0x[0-9a-f]+$/i.test(f)) return parseInt(f, 16);
  if (/^[0-9a-f]+h$/i.test(f)) return parseInt(f.slice(0, -1), 16);
  if (/^\d+$/.test(f)) return parseInt(f, 10);
  if (/^'.'$/.test(f)) return f.charCodeAt(1);
  const v = sym.get(f);
  if (v === undefined) throw new Error(`cpu: unknown symbol ${f}`);
  return v;
}

const SIZES: Record<string, Width> = { byte: 8, word: 16, dword: 32, qword: 64 };

function parseOperand(s: string, sym: Map<string, number>): Opnd {
  let t = s.trim().toLowerCase();
  let size: Width | undefined;
  const sz = t.match(/^(byte|word|dword|qword)\s+/);
  if (sz) { size = SIZES[sz[1]]; t = t.slice(sz[0].length); }
  if (t.startsWith("[")) {
    const inner = t.slice(1, -1).replace(/^rel\s+/, "").replace(/\s+/g, "").replace(/-/g, "+-");
    const m: Mem = { scale: 1, disp: 0, size };
    for (const part of inner.split("+").filter(Boolean)) {
      const [a, b] = part.split("*");
      const r = regRef(a.replace(/^-/, ""));
      if (r && b) { m.index = r.base; m.scale = Number(b); }
      else if (r && !m.base) m.base = r.base;
      else if (r) m.index = r.base;
      else m.disp += evalExpr(part, sym);
    }
    return { k: "mem", m };
  }
  const r = regRef(t);
  if (r) return { k: "reg", r };
  return { k: "imm", v: BigInt(evalExpr(t, sym)) };
}

/** Bytes as written in the listing, "?" for a byte the linker fills in. */
export function splitBytes(enc: string): string[] {
  const out: string[] = [];
  const s = enc.replace(/\s+/g, "");
  for (let i = 0; i < s.length;) {
    if (s[i] === "(" || s[i] === "[") {
      const end = s.indexOf(s[i] === "(" ? ")" : "]", i);
      for (let k = 0; k < (end - i - 1) / 2; k++) out.push("??");
      i = end + 1;
    } else { out.push(s.slice(i, i + 2)); i += 2; }
  }
  return out;
}

/** Lays the program out in memory and parses its instructions. `skip` = source lines removed ("break it"). */
export function load(lines: SrcLine[], skip: Set<number> = new Set()): Image {
  const symbols = new Map<string, number>();
  const data = new Map<number, number>();
  const lineAddr: (number | undefined)[] = [];
  let section: "text" | "data" | "bss" = "text";
  let text = TEXT_BASE, dat = DATA_BASE;
  const pending: { line: number; addr: number; len: number; body: string }[] = [];

  // Pass 1: addresses of labels and data; instruction lengths come from the bytes
  lines.forEach(([raw, enc], line) => {
    if (skip.has(line)) return;
    let s = stripComment(raw).trim();
    if (!s) return;
    const sec = s.match(/^section\s+\.(\w+)/i);
    if (sec) { section = sec[1] === "text" ? "text" : sec[1] === "bss" ? "bss" : "data"; return; }
    if (/^(global|default|extern|bits)\b/i.test(s)) return;
    const equ = s.match(/^(\w+)\s+equ\s+(.+)$/i);
    if (equ) { symbols.set(equ[1], evalExpr(equ[2], symbols, dat)); return; }
    const lab = s.match(/^([.\w]+):\s*(.*)$/);
    if (lab) {
      symbols.set(lab[1], section === "text" ? text : dat);
      s = lab[2].trim();
      if (!s) return;
    }
    if (section === "text") {
      const len = splitBytes(enc).length;
      lineAddr[line] = text;
      pending.push({ line, addr: text, len, body: s });
      text += len;
      return;
    }
    lineAddr[line] = dat;
    const d = s.match(/^(db|dw|dd|dq|resb|resw|resd|resq)\s+(.+)$/i);
    if (!d) throw new Error(`cpu: cannot read data line "${raw}"`);
    const unit = { b: 1, w: 2, d: 4, q: 8 }[d[1].slice(-1).toLowerCase() as "b" | "w" | "d" | "q"];
    if (d[1].toLowerCase().startsWith("res")) { dat += unit * evalExpr(d[2], symbols); return; }
    for (const item of splitArgs(d[2])) {
      if (/^".*"$/.test(item)) {
        for (const ch of item.slice(1, -1)) data.set(dat++, ch.charCodeAt(0));
      } else {
        let v = BigInt(evalExpr(item, symbols, dat)) & mask((unit * 8) as Width);
        for (let k = 0; k < unit; k++) { data.set(dat++, Number(v & BFF)); v >>= B8; }
      }
    }
  });

  // Pass 2: operands (symbols are all known now)
  const instrs: Instr[] = pending.map(({ line, addr, len, body }) => {
    const sp = body.search(/\s/);
    const op = (sp < 0 ? body : body.slice(0, sp)).toLowerCase();
    const args = sp < 0 ? [] : splitArgs(body.slice(sp + 1)).map(a => parseOperand(a, symbols));
    return { line, addr, len, op, args };
  });
  return {
    instrs, symbols, data, lineAddr,
    byAddr: new Map(instrs.map((ins, i) => [ins.addr, i])),
    dataEnd: dat, textEnd: text,
  };
}

// ── Execution ────────────────────────────────────────────────────────────────

/** What one step did, for the figure to highlight. */
export type Effect = {
  regs: Set<Gpr>;                    // registers written
  wrote?: RegRef;                    // the register part named as destination
  mem: Set<number>;                  // byte addresses written
  read: Set<number>;                 // byte addresses read
  flags: boolean;
  syscall?: "write" | "exit" | "other";
};

export class Fault extends Error {
  constructor(public addr: number) { super("segfault"); }
}

export function initialState(img: Image): CpuState {
  const regs = Object.fromEntries(GPR.map(r => [r, B0])) as Record<Gpr, bigint>;
  regs.rsp = BigInt(STACK_TOP - 0x10);
  return {
    regs, rip: img.instrs[0]?.addr ?? TEXT_BASE,
    flags: { zf: false, sf: false, cf: false, of: false },
    mem: new Map(img.data), out: "",
  };
}

const clone = (s: CpuState): CpuState => ({ ...s, regs: { ...s.regs }, flags: { ...s.flags }, mem: new Map(s.mem) });

export class Cpu {
  fx: Effect = { regs: new Set(), mem: new Set(), read: new Set(), flags: false };
  constructor(public s: CpuState, private img: Image) {}

  /** Linux maps whole 4 KiB pages: bytes just past .data read as 0 instead of crashing. */
  private mapped(a: number) {
    const dataPages = Math.ceil((this.img.dataEnd - DATA_BASE) / PAGE) * PAGE;
    return (a >= DATA_BASE && a < DATA_BASE + dataPages)
      || (a >= STACK_TOP - STACK_SIZE && a < STACK_TOP);
  }
  readMem(a: number, w: Width): bigint {
    let v = B0;
    for (let k = 0; k < w / 8; k++) {                // little-endian: byte k is worth 256^k
      if (!this.mapped(a + k)) throw new Fault(a + k);
      v |= BigInt(this.s.mem.get(a + k) ?? 0) << BigInt(8 * k);
      this.fx.read.add(a + k);
    }
    return v;
  }
  writeMem(a: number, w: Width, v: bigint) {
    for (let k = 0; k < w / 8; k++) {
      if (!this.mapped(a + k)) throw new Fault(a + k);
      this.s.mem.set(a + k, Number((v >> BigInt(8 * k)) & BFF));
      this.fx.mem.add(a + k);
    }
  }

  getReg(r: RegRef): bigint { return (this.s.regs[r.base] >> BigInt(r.shift)) & mask(r.width); }
  setReg(r: RegRef, v: bigint) {
    v &= mask(r.width);
    const old = this.s.regs[r.base];
    // A 32-bit write zero-extends into the whole register; 8/16-bit writes merge
    this.s.regs[r.base] = r.width === 64 ? v
      : r.width === 32 ? v
      : (old & ~(mask(r.width) << BigInt(r.shift)) & M64) | (v << BigInt(r.shift));
    this.fx.regs.add(r.base);
    this.fx.wrote ??= r;
  }

  /** Effective address: base + index × scale + displacement ([rel sym] already holds sym's address). */
  addr(m: Mem): number {
    let a = m.disp;
    if (m.base) a += Number(this.s.regs[m.base]);
    if (m.index) a += Number(this.s.regs[m.index]) * m.scale;
    return a;
  }
  width(o: Opnd, other?: Opnd): Width {
    if (o.k === "reg") return o.r.width;
    if (o.k === "mem" && o.m.size) return o.m.size;
    if (other?.k === "reg") return other.r.width;
    return 64;
  }
  get(o: Opnd, w: Width): bigint {
    if (o.k === "reg") return this.getReg(o.r);
    if (o.k === "imm") return o.v & mask(w);
    return this.readMem(this.addr(o.m), w);
  }
  set(o: Opnd, w: Width, v: bigint) {
    if (o.k === "reg") this.setReg(o.r, v);
    else if (o.k === "mem") this.writeMem(this.addr(o.m), w, v);
  }

  setFlags(res: bigint, w: Width, cf: boolean, of: boolean) {
    const r = res & mask(w);
    this.s.flags = { zf: r === B0, sf: ((r >> BigInt(w - 1)) & B1) === B1, cf, of };
    this.fx.flags = true;
  }
  /** a + b or a − b, with the flags the CPU would set. */
  alu(kind: "add" | "sub", a: bigint, b: bigint, w: Width): bigint {
    const m = mask(w);
    const r = (kind === "add" ? a + b : a - b) & m;
    const sa = signed(a, w) >= B0, sb = signed(b, w) >= B0, sr = signed(r, w) >= B0;
    const cf = kind === "add" ? a + b > m : a < b;
    // Signed overflow: the sign of the result is impossible for the signs of the inputs
    const of = kind === "add" ? sa === sb && sr !== sa : sa !== sb && sr !== sa;
    this.setFlags(r, w, cf, of);
    return r;
  }

  push(v: bigint) {
    const sp = Number(this.s.regs.rsp) - 8;
    this.writeMem(sp, 64, v);
    this.s.regs.rsp = BigInt(sp);
    this.fx.regs.add("rsp");
  }
  pop(): bigint {
    const sp = Number(this.s.regs.rsp);
    const v = this.readMem(sp, 64);
    this.s.regs.rsp = BigInt(sp + 8);
    this.fx.regs.add("rsp");
    return v;
  }

  cond(cc: string): boolean {
    const { zf, sf, cf, of } = this.s.flags;
    switch (cc) {
      case "e": case "z": return zf;
      case "ne": case "nz": return !zf;
      case "l": return sf !== of;
      case "ge": return sf === of;
      case "le": return zf || sf !== of;
      case "g": return !zf && sf === of;
      case "b": case "c": return cf;
      case "ae": case "nc": return !cf;
      case "be": return cf || zf;
      case "a": return !cf && !zf;
      case "s": return sf;
      case "ns": return !sf;
      case "o": return of;
      case "no": return !of;
    }
    throw new Error(`cpu: unknown condition ${cc}`);
  }

  syscall(next: number) {
    const r = this.s.regs;
    const n = Number(r.rax);
    r.rcx = BigInt(next);                          // the kernel keeps the return address here
    r.r11 = BigInt(0x202);                         // …and the flags here
    this.fx.regs.add("rcx").add("r11").add("rax");
    if (n === 60 || n === 231) {
      this.s.exit = Number(r.rdi & BFF);
      this.fx.syscall = "exit";
      return;
    }
    if (n === 1) {
      this.fx.syscall = "write";
      const fd = Number(r.rdi), buf = Number(r.rsi), len = Number(r.rdx);
      if (fd !== 1 && fd !== 2) { r.rax = neg64(-9); return; }               // EBADF
      let text = "";
      for (let k = 0; k < len; k++) {
        if (!this.mapped(buf + k)) { r.rax = neg64(-14); return; }          // EFAULT
        text += String.fromCharCode(this.s.mem.get(buf + k) ?? 0);
        this.fx.read.add(buf + k);
      }
      this.s.out += text;
      r.rax = BigInt(len);
      return;
    }
    this.fx.syscall = "other";
    r.rax = neg64(-38);                              // ENOSYS: not one this CPU knows
  }

  exec(ins: Instr) {
    const next = ins.addr + ins.len;
    const [a, b, c] = ins.args;
    let rip = next;
    const op = ins.op;
    const w = a ? this.width(a, b) : 64;
    switch (op) {
      case "mov": this.set(a, w, this.get(b, w)); break;
      case "movzx": this.set(a, w, this.get(b, this.width(b))); break;
      case "movsx": case "movsxd": {
        const bw = op === "movsxd" ? 32 : this.width(b);
        this.set(a, w, signed(this.get(b, bw), bw) & mask(w)); break;
      }
      case "lea": this.set(a, w, BigInt(this.addr((b as { m: Mem }).m)) & mask(w)); break;
      case "xchg": { const x = this.get(a, w), y = this.get(b, w); this.set(a, w, y); this.set(b, w, x); break; }
      case "add": case "sub": case "cmp": {
        const r = this.alu(op === "add" ? "add" : "sub", this.get(a, w), this.get(b, w), w);
        if (op !== "cmp") this.set(a, w, r);
        break;
      }
      case "inc": case "dec": {
        const cf = this.s.flags.cf;                // inc/dec leave CF alone
        const r = this.alu(op === "inc" ? "add" : "sub", this.get(a, w), B1, w);
        this.s.flags.cf = cf;
        this.set(a, w, r); break;
      }
      case "neg": { const r = this.alu("sub", B0, this.get(a, w), w); this.set(a, w, r); break; }
      case "and": case "or": case "xor": case "test": {
        const x = this.get(a, w), y = this.get(b, w);
        const r = op === "or" ? x | y : op === "xor" ? x ^ y : x & y;
        this.setFlags(r, w, false, false);
        if (op !== "test") this.set(a, w, r);
        break;
      }
      case "not": this.set(a, w, ~this.get(a, w) & mask(w)); break;
      case "shl": case "shr": case "sar": {
        const x = this.get(a, w), n = BigInt(Number(this.get(b, 8)) & 63);
        if (n === B0) break;
        const r = op === "shl" ? (x << n) & mask(w) : op === "shr" ? x >> n : (signed(x, w) >> n) & mask(w);
        const out = op === "shl" ? x >> (BigInt(w) - n) : x >> (n - B1);    // the last bit shifted out
        this.setFlags(r, w, (out & B1) === B1, false);
        this.set(a, w, r); break;
      }
      case "imul": {
        const [src, k] = c ? [b, c] : [a, b];
        const x = signed(this.get(src, w), w), y = signed(this.get(k, w), w);
        const full = x * y, r = full & mask(w);
        const ovf = signed(r, w) !== full;
        this.s.flags.cf = ovf; this.s.flags.of = ovf; this.fx.flags = true;
        this.set(a, w, r); break;
      }
      case "push": this.push(this.get(a, 64)); break;
      case "pop": this.set(a, 64, this.pop()); break;
      case "call": this.push(BigInt(next)); rip = Number(this.get(a, 64)); break;
      case "ret": rip = Number(this.pop()); break;
      case "jmp": rip = Number(this.get(a, 64)); break;
      case "syscall": this.syscall(next); break;
      case "nop": break;
      default: {
        const j = op.match(/^j(\w+)$/);
        if (j) { if (this.cond(j[1])) rip = Number(this.get(a, 64)); break; }
        throw new Error(`cpu: no instruction ${op}`);
      }
    }
    this.s.rip = rip;
  }
}

// ── Running a whole program ──────────────────────────────────────────────────

export type Snap = {
  state: CpuState;
  /** Source line that just ran; -1 before the first step, "ghost" for bytes past the code. */
  line: number | "ghost" | -1;
  fx: Effect;
};

const MAX_STEPS = 400;

/**
 * Every state of the program, from the first instruction to exit, a crash or
 * the end of the snippet. Past the last instruction the CPU keeps going: the
 * zero bytes there decode as `add byte [rax], al`, which is what a real program
 * that forgets to exit runs into.
 */
export function run(lines: SrcLine[], skip: Set<number> = new Set(), snippet = false): { img: Image; snaps: Snap[] } {
  const img = load(lines, skip);
  let s = initialState(img);
  const snaps: Snap[] = [{ state: s, line: -1, fx: { regs: new Set(), mem: new Set(), read: new Set(), flags: false } }];
  for (let n = 0; n < MAX_STEPS && s.exit === undefined && !s.fault; n++) {
    const i = img.byAddr.get(s.rip);
    if (i === undefined && snippet) break;
    const cpu = new Cpu(clone(s), img);
    let line: Snap["line"];
    try {
      if (i === undefined) {
        line = "ghost";
        const a = Number(cpu.s.regs.rax);
        cpu.writeMem(a, 8, (cpu.readMem(a, 8) + (cpu.s.regs.rax & BFF)) & BFF);
        cpu.s.rip += 2;
      } else {
        line = img.instrs[i].line;
        cpu.exec(img.instrs[i]);
      }
    } catch (e) {
      if (!(e instanceof Fault)) throw e;
      line = i === undefined ? "ghost" : img.instrs[i].line;
      cpu.s.fault = "segfault";
      cpu.s.faultAddr = e.addr;
      cpu.s.exit = 139;                              // 128 + SIGSEGV (11)
    }
    s = cpu.s;
    snaps.push({ state: s, line, fx: cpu.fx });
  }
  return { img, snaps };
}
