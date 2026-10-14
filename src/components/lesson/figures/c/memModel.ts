// ── Memory model for the C memory-box figure ──────────────────────────────────
// A tiny, hand-scripted picture of a C program's memory: stack frames holding
// variables (boxes with an address, a type and a value) and heap blocks from
// malloc. A program is a list of steps; each step mutates the state through
// the helpers of `Mem` and records which boxes it touched. Pointers store an
// address plus the variable they were taken from ("owner"), so the figure can
// tell a good pointer from a dangling or out-of-bounds one by itself.

/** A pointer value: an address and the variable or block it was taken from. NULL is `null`. */
export type Ptr = { addr: number; owner: string } | null;

export type Cell = {
  key: string;                 // unique: "<frame uid>.<name>" or "#<block n>"
  name: string;
  type: string;                // shown as written in C: "int", "char[6]", "int *"
  elem: number;                // bytes per element
  addr: number;                // address of element 0
  vals: (string | null)[];     // one per element; null = never written (garbage)
  labels?: string[];           // element labels (struct fields); default [0], [1]…
  pointee?: number;            // pointer cells: size of what it points at (for p + 1)
  ptr?: Ptr;                   // pointer cells: undefined = uninitialised
};

export type Frame = { uid: number; fn: string; cells: Cell[]; dead?: boolean; base: number };
export type Block = Cell & { freed?: boolean; bytes: number };
export type State = { frames: Frame[]; heap: Block[]; sp: number; hp: number; out: string; serial: number };

export const STACK_TOP = 0x7ffe50;
export const HEAP_BASE = 0x4052a0;
export const hex = (n: number) => "0x" + n.toString(16);

const fresh = (): State => ({ frames: [], heap: [], sp: STACK_TOP, hp: HEAP_BASE, out: "", serial: 0 });

// ── Step helpers ──────────────────────────────────────────────────────────────

export class Mem {
  touched = new Set<string>();          // "<cell key>:<element>" written by this step
  constructor(public s: State) {}

  private top() { return this.s.frames.filter(f => !f.dead).at(-1)!; }

  /** Finds a variable by name, innermost live frame first, or a heap block by its id ("#1"). */
  cell(name: string): Cell {
    if (name.startsWith("#")) return this.s.heap.find(b => b.key === name)!;
    const live = this.s.frames.filter(f => !f.dead);
    for (let i = live.length - 1; i >= 0; i--) {
      const c = live[i].cells.find(c => c.name === name);
      if (c) return c;
    }
    throw new Error(`no variable ${name}`);
  }

  /** A function starts: returned frames are reused (their memory is handed out again). */
  call(fn: string) {
    const deadFrom = this.s.frames.findIndex(f => f.dead);
    if (deadFrom >= 0) {
      this.s.sp = this.s.frames[deadFrom].base;
      this.s.frames = this.s.frames.slice(0, deadFrom);
    }
    this.s.frames.push({ uid: ++this.s.serial, fn, cells: [], base: this.s.sp });
  }
  /** The innermost function returns: its frame stays drawn as "returned" until reused. */
  ret() { this.top().dead = true; }

  /** Declares a variable in the innermost frame (first declared = highest address). */
  local(name: string, type: string, elem: number, vals: (string | null)[], o: { labels?: string[]; pointee?: number } = {}) {
    const f = this.top();
    this.s.sp -= elem * vals.length;
    this.s.sp -= this.s.sp % Math.min(elem, 8);           // keep it aligned to its element size
    const c: Cell = { key: `${f.uid}.${name}`, name, type, elem, addr: this.s.sp, vals: [...vals], ...o };
    f.cells.push(c);
    vals.forEach((v, i) => v !== null && this.touched.add(`${c.key}:${i}`));
    return c;
  }
  /** A pointer variable; `to` as for `point`. */
  pointer(name: string, type: string, pointee: number, to?: [string, number?] | null) {
    const c = this.local(name, type, 8, [null], { pointee });
    if (to !== undefined) this.point(name, to);
    return c;
  }
  /** A variable leaves scope (a loop counter after its loop). */
  drop(name: string) {
    const f = this.top();
    f.cells = f.cells.filter(c => c.name !== name);
  }

  set(name: string, i: number, v: string) {
    const c = this.cell(name);
    c.vals[i] = v;
    this.touched.add(`${c.key}:${i}`);
  }
  /** p = &x[i] (or NULL). */
  point(name: string, to: [string, number?] | null) {
    const p = this.cell(name);
    if (to === null) p.ptr = null;
    else {
      const t = this.cell(to[0]);
      p.ptr = { addr: t.addr + (to[1] ?? 0) * t.elem, owner: t.key };
    }
    this.touched.add(`${p.key}:0`);
  }
  /** p = q (copies the address and where it came from). */
  copy(name: string, from: string) {
    const p = this.cell(name);
    p.ptr = this.cell(from).ptr;
    this.touched.add(`${p.key}:0`);
  }
  /** p += n: pointer arithmetic moves by n elements of the pointed-to type. */
  move(name: string, n: number) {
    const p = this.cell(name);
    if (p.ptr) p.ptr = { ...p.ptr, addr: p.ptr.addr + n * (p.pointee ?? 1) };
    this.touched.add(`${p.key}:0`);
  }

  /** A heap block of n elements; returns its id ("#1") for point(). `label` replaces "malloc(bytes)". */
  malloc(type: string, elem: number, n: number, label?: string, vals?: string[]) {
    const bytes = elem * n;
    const id = `#${this.s.heap.length + 1}`;
    this.s.heap.push({ key: id, name: label ?? `malloc(${bytes})`, type, elem, addr: this.s.hp, vals: vals ? [...vals] : Array(n).fill(null), bytes });
    vals?.forEach((_, i) => this.touched.add(`${id}:${i}`));
    this.s.hp += Math.ceil((bytes + 16) / 16) * 16;     // allocator bookkeeping + rounding
    return id;
  }
  free(id: string) {
    const b = this.s.heap.find(b => b.key === id)!;
    b.freed = true;
  }
  /** Frees whatever block the pointer variable points at, as free(p) does. */
  freeVia(name: string) {
    const p = this.cell(name).ptr;
    const b = p && this.s.heap.find(b => b.key === p.owner);
    if (b) b.freed = true;
  }
  print(text: string) { this.s.out += text; }
}

// ── Programs and their snapshots ──────────────────────────────────────────────

export type Step = {
  line: number;                 // 0-based line of `code` this step executes
  key: string;                  // tx key of the explanation
  en: string;
  run?: (m: Mem) => void;
  /** The reader may remove this step's line ("break it"). */
  cut?: boolean;
};
export type Program = { id: string; code: string[]; steps: Step[] };

export type Snap = { state: State; touched: Set<string>; line: number; key: string; en: string };

/** Runs the program, skipping removed lines; snapshot 0 is "before the first step". */
export function snapshots(p: Program, removed: ReadonlySet<number>): Snap[] {
  let s = fresh();
  const out: Snap[] = [];
  p.steps.forEach((st, i) => {
    if (removed.has(i)) return;
    s = structuredClone(s);
    const m = new Mem(s);
    st.run?.(m);
    out.push({ state: s, touched: m.touched, line: st.line, key: st.key, en: st.en });
  });
  return out;
}

// ── Diagnosis: what is wrong with the memory right now ────────────────────────

export type PtrState = "ok" | "null" | "uninit" | "dangling" | "outside" | "end";

const liveCells = (s: State) => [
  ...s.frames.filter(f => !f.dead).flatMap(f => f.cells),
  ...s.heap.filter(b => !b.freed),
];
const allCells = (s: State) => [...s.frames.flatMap(f => f.cells), ...s.heap];

const inside = (c: Cell, addr: number) => addr >= c.addr && addr < c.addr + c.elem * c.vals.length;

/** Where a pointer cell points, and whether that is allowed. */
export function pointerState(s: State, c: Cell): { state: PtrState; target?: Cell; index?: number } {
  if (c.ptr === undefined) return { state: "uninit" };
  if (c.ptr === null) return { state: "null" };
  const { addr, owner } = c.ptr;
  const ownerLive = liveCells(s).find(x => x.key === owner);
  // The box drawn at that address now: live ones first (a reused frame), then dead/freed
  const target = liveCells(s).find(x => inside(x, addr)) ?? allCells(s).find(x => inside(x, addr));
  const index = target ? Math.floor((addr - target.addr) / target.elem) : undefined;
  if (!ownerLive) return { state: "dangling", target, index };
  // One past the end: allowed to hold, not to read. Whatever lies there is drawn as the target.
  if (addr === ownerLive.addr + ownerLive.elem * ownerLive.vals.length)
    return target ? { state: "end", target, index } : { state: "end", target: ownerLive, index: ownerLive.vals.length };
  if (!inside(ownerLive, addr)) return { state: "outside", target, index };
  return { state: "ok", target, index };
}

/** Heap blocks still allocated with no pointer to them anywhere: leaked. */
export function leakedBlocks(s: State): Block[] {
  const ptrs = liveCells(s).filter(c => c.pointee !== undefined && c.ptr).map(c => c.ptr!.addr);
  return s.heap.filter(b => !b.freed && !ptrs.some(a => inside(b, a) || a === b.addr + b.bytes));
}
