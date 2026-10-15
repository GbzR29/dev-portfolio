// ── Where each argument goes: System V vs Win64 ──────────────────────────────
// The two x86-64 calling conventions, reduced to what the figure needs:
// integer and pointer arguments, double/float arguments, one 16-byte struct
// return and one variadic call. Every result here was checked against real
// gcc 14 -O2 output: Linux (Compiler Explorer) for System V, MinGW-w64 for
// Win64 (sum8 reads its 7th argument at [rsp+8] / its 5th at [rsp+40], make
// returns rax:rdx / through the pointer in rcx, printf gets eax = 1 / the
// double in both xmm2 and r8).

export type ArgKind = "int" | "ptr" | "i64" | "double" | "float";
export type Arg = { name: string; kind: ArgKind };
export type Sig = {
  id: string;
  c: string;                          // the C declaration (or call) as shown
  args: Arg[];
  ret: "int" | "double" | "pair";     // pair = struct { long long x, y; }, 16 bytes
  variadic?: number;                  // index of the first argument matched by "..."
};

const ints = (names: string) => names.split(" ").map(name => ({ name, kind: "int" as const }));

export const SIGS: Sig[] = [
  { id: "add3", c: "int add3(int a, int b, int c);", args: ints("a b c"), ret: "int" },
  { id: "sum8", c: "int sum8(int a, int b, int c, int d,\n         int e, int f, int g, int h);", args: ints("a b c d e f g h"), ret: "int" },
  { id: "mix", c: "double mix(int n, double x, float y, char *s);",
    args: [{ name: "n", kind: "int" }, { name: "x", kind: "double" }, { name: "y", kind: "float" }, { name: "s", kind: "ptr" }], ret: "double" },
  { id: "make", c: "struct Pair { long long x, y; };\nstruct Pair make(long long a);", args: [{ name: "a", kind: "i64" }], ret: "pair" },
  { id: "printf", c: "printf(\"%d %f\\n\", 7, 2.5);",
    args: [{ name: "fmt", kind: "ptr" }, { name: "7", kind: "int" }, { name: "2.5", kind: "double" }], ret: "int", variadic: 1 },
];

/** One argument's home: one or two registers, or a stack slot at function entry. */
export type Place = { arg: string; kind: ArgKind | "hidden"; regs: string[]; stack?: number };
export type Layout = {
  places: Place[];
  ret: string;                         // where the result comes back
  extra: string[];                     // keys of the notes that apply (figAsmCc_x_<key>)
  stackTop: number;                    // highest stack offset used, for the drawing
};

const SYSV_INT: [string, string][] = [["rdi", "edi"], ["rsi", "esi"], ["rdx", "edx"], ["rcx", "ecx"], ["r8", "r8d"], ["r9", "r9d"]];
const WIN_INT: [string, string][] = [["rcx", "ecx"], ["rdx", "edx"], ["r8", "r8d"], ["r9", "r9d"]];
const isFloat = (k: ArgKind) => k === "double" || k === "float";
const regName = (pair: [string, string], k: ArgKind | "hidden") => (k === "int" ? pair[1] : pair[0]);

export function sysv(sig: Sig): Layout {
  let gi = 0, fi = 0, st = 8;                    // [rsp] holds the return address at entry
  const places: Place[] = sig.args.map(a => {
    if (isFloat(a.kind) && fi < 8) return { arg: a.name, kind: a.kind, regs: [`xmm${fi++}`] };
    if (!isFloat(a.kind) && gi < 6) return { arg: a.name, kind: a.kind, regs: [regName(SYSV_INT[gi++], a.kind)] };
    const p = { arg: a.name, kind: a.kind, regs: [], stack: st };
    st += 8;
    return p;
  });
  const extra: string[] = [];
  if (sig.variadic !== undefined) extra.push("al");
  if (st > 8) extra.push("sysvStack");
  if (sig.ret === "pair") extra.push("pair");
  return { places, ret: sig.ret === "double" ? "xmm0" : sig.ret === "pair" ? "rax : rdx" : "eax", extra, stackTop: st };
}

export function win64(sig: Sig): Layout {
  const places: Place[] = [];
  const all: { name: string; kind: ArgKind | "hidden" }[] = sig.args.map(a => ({ ...a }));
  if (sig.ret === "pair") all.unshift({ name: "&result", kind: "hidden" });   // > 8 bytes: returned through memory
  let st = 40;                                   // return address + 32 bytes of shadow space
  all.forEach((a, i) => {
    if (i < 4) {
      if (a.kind !== "hidden" && isFloat(a.kind)) {
        // A variadic double also goes in the matching integer register, for the callee to spill
        const both = sig.variadic !== undefined && i >= sig.variadic;
        places.push({ arg: a.name, kind: a.kind, regs: both ? [`xmm${i}`, WIN_INT[i][0]] : [`xmm${i}`] });
      } else places.push({ arg: a.name, kind: a.kind, regs: [regName(WIN_INT[i], a.kind)] });
    } else {
      places.push({ arg: a.name, kind: a.kind, regs: [], stack: st });
      st += 8;
    }
  });
  const extra = ["shadow"];
  if (sig.ret === "pair") extra.push("hidden");
  if (sig.variadic !== undefined) extra.push("winVar");
  if (sig.args.some(a => isFloat(a.kind)) && sig.variadic === undefined) extra.push("positional");
  return { places, ret: sig.ret === "double" ? "xmm0" : sig.ret === "pair" ? "rax = &result" : "eax", extra, stackTop: st };
}
