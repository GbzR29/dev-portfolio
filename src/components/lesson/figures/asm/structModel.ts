// ── Struct layout and the loads gcc makes for it ────────────────────────────
// The System V x86-64 rules: each field starts at a multiple of its alignment
// (its size, for these types), padding fills the gaps, and the struct's size
// is rounded up to a multiple of its largest alignment so that every element
// of an array stays aligned. accessAsm() gives the instructions gcc 14 -O2
// emits to read p->f and a[i].f (p, a in rdi, i in rsi as a long); the
// patterns were checked against real gcc output for every stride from 1 to 64.

export type FType = "char" | "short" | "int" | "float" | "double" | "char *";
export type Field = { type: FType; name: string };

export const SIZE: Record<FType, number> = { char: 1, short: 2, int: 4, float: 4, double: 8, "char *": 8 };

export type Placed = Field & { offset: number; size: number };
export type Layout = { fields: Placed[]; size: number; align: number; padding: number };

export function layout(fields: Field[]): Layout {
  let off = 0, align = 1;
  const placed = fields.map(f => {
    const s = SIZE[f.type];
    off = Math.ceil(off / s) * s;
    align = Math.max(align, s);
    const p = { ...f, offset: off, size: s };
    off += s;
    return p;
  });
  const size = Math.max(1, Math.ceil(off / align) * align);
  return { fields: placed, size, align, padding: size - placed.reduce((a, f) => a + f.size, 0) };
}

/** Which field (index) owns each byte of the struct, or -1 for padding. */
export const byteOwners = (L: Layout) =>
  Array.from({ length: L.size }, (_, b) => L.fields.findIndex(f => b >= f.offset && b < f.offset + f.size));

// gcc's load for each type, returning the value as int / pointer / float / double
const LOAD: Record<FType, [string, string, string]> = {
  char: ["movsx", "eax", "BYTE"],
  short: ["movsx", "eax", "WORD"],
  int: ["mov", "eax", "DWORD"],
  float: ["movss", "xmm0", "DWORD"],
  double: ["movsd", "xmm0", "QWORD"],
  "char *": ["mov", "rax", "QWORD"],
};

const ins = (op: string, args: string) => `${op.padEnd(8)}${args}`;
const load = (t: FType, addr: string) => { const [op, r, w] = LOAD[t]; return ins(op, `${r}, ${w} PTR [${addr}]`); };
const plus = (off: number) => (off ? `+${off}` : "");

/** p->f with p in rdi. */
export const fieldAsm = (f: Placed) => [load(f.type, `rdi${plus(f.offset)}`)];

/** The load at a + r × k + off, written the way gcc orders the address. */
const scaled = (t: FType, r: string, k: number, off: number) =>
  load(t, k > 1 ? `rdi${plus(off)}+${r}*${k}` : off ? `${r}+${off}+rdi` : `rdi+${r}`);

/** a[i].f with a in rdi and i in rsi: i × stride (with lea, shifts or imul), then the load at the field's offset. */
export function elemAsm(f: Placed, stride: number): string[] {
  const t = f.type, off = f.offset;
  const k = (m: number) => [1, 2, 4, 8].find(s => s * m === stride);
  if ([1, 2, 4, 8].includes(stride)) return [load(t, `rdi${plus(off)}+rsi${stride > 1 ? "*" + stride : ""}`)];
  for (const m of [3, 5, 9]) {
    if (k(m)) return [ins("lea", `rax, [rsi+rsi*${m - 1}]`), scaled(t, "rax", k(m)!, off)];
  }
  if (k(7) && k(7)! > 1) return [ins("lea", "rax, [0+rsi*8]"), ins("sub", "rax, rsi"), scaled(t, "rax", k(7)!, off)];
  if (k(11)) return [ins("lea", "rax, [rsi+rsi*4]"), ins("lea", "rax, [rsi+rax*2]"), scaled(t, "rax", k(11)!, off)];
  const sh = Math.log2(stride), sh3 = Math.log2(stride / 3);
  if (Number.isInteger(sh)) return [ins("sal", `rsi, ${sh}`), scaled(t, "rsi", 1, off)];
  if (Number.isInteger(sh3)) return [ins("lea", "rax, [rsi+rsi*2]"), ins("sal", `rax, ${sh3}`), scaled(t, "rax", 1, off)];
  return [ins("imul", `rsi, rsi, ${stride}`), scaled(t, "rsi", 1, off)];
}

/** Strides elemAsm() reproduces exactly (checked against gcc); the figure only builds structs of these sizes. */
export const CHECKED_STRIDES = [1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 44, 48, 56, 64];
