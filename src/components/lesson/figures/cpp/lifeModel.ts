// ── Model for the C++ object-lifetime figure ──────────────────────────────────
// A hand-scripted picture of when C++ objects are built and destroyed: nested
// scopes (a function body, a block) holding objects, objects holding member
// objects, and the lines the program prints. A program is a list of steps; each
// step changes the state through `Life`. Steps flagged `dtor` are the calls the
// compiler inserts at the end of a scope: the figure can skip them all ("C
// mode") to show what is left behind without destructors. Objects that own a
// resource (`res`) and vanish without their destructor are reported as leaks.
//
// The heap: objects can hold a pointer (`ptr`) to a heap block. Blocks can be
// reference counted (shared_ptr), can point at other blocks (a member inside a
// heap object), and are freed by a step. Freeing a block twice is recorded as a
// double free; a block nobody frees and nothing alive can reach is a leak
// (computed by `heapLeaks`). Used by the values, move and RAII chapters.

export type ObjState = "building" | "alive" | "dying" | "dead";

export type Obj = {
  id: string;                  // unique per program run
  name: string;
  type: string;
  state: ObjState;
  parent?: string;             // member objects: the id of the object they live in
  res?: string;                // the resource it owns, e.g. "level.dat (open)"
  ptr?: string;                // id of the heap block it points at
  note?: string;               // e.g. "nullptr (empty)" after a move
};
export type Scope = { uid: number; label: string; objs: Obj[]; closed?: boolean };
export type Block = {
  id: string;                  // "#1", shown in the drawing
  label: string;               // what lives there, e.g. "int[3] {1, 2, 3}"
  refs?: number;               // shared_ptr owners (control block), if counted
  weak?: number;               // weak_ptr observers
  to?: string;                 // another block this one points at
  toWeak?: boolean;            // ...through a weak_ptr: it does not own it
  freed?: boolean;
  doubleFree?: boolean;
  hidden?: boolean;            // freed in an earlier step: no longer drawn
};
export type LifeState = { scopes: Scope[]; heap: Block[]; out: string[]; leaks: string[]; errors: string[]; serial: number };

const fresh = (): LifeState => ({ scopes: [], heap: [], out: [], leaks: [], errors: [], serial: 0 });

// ── Step helpers ──────────────────────────────────────────────────────────────

export class Life {
  touched = new Set<string>();           // object ids and "h"+block ids changed by this step
  constructor(public s: LifeState) {
    // What ended in the previous step disappears now: closed scopes, destroyed objects, freed blocks
    s.scopes = s.scopes.filter(sc => !sc.closed);
    for (const sc of s.scopes) sc.objs = sc.objs.filter(o => o.state !== "dead");
    for (const b of s.heap) if (b.freed && !b.doubleFree) b.hidden = true;
  }

  private top() { return this.s.scopes.at(-1)!; }
  private find(name: string) {
    for (let i = this.s.scopes.length - 1; i >= 0; i--) {
      const o = this.s.scopes[i].objs.find(o => o.name === name);
      if (o) return o;
    }
    throw new Error(`no object ${name}`);
  }
  private block(id: string) {
    const b = this.s.heap.find(b => b.id === id);
    if (!b) throw new Error(`no block ${id}`);
    return b;
  }

  /** A function body or a { } block starts. */
  enter(label: string) { this.s.scopes.push({ uid: ++this.s.serial, label, objs: [] }); }

  /** The innermost scope ends. Objects still alive in it were never destroyed: their resources leak. */
  exit() {
    const sc = this.top();
    for (const o of sc.objs) if (o.state !== "dead" && o.res) this.s.leaks.push(`${o.name}: ${o.res}`);
    sc.closed = true;
  }

  /** An object is defined in the innermost scope (or `scope`, counted from the outermost). `building` = its constructor body has not run yet. */
  make(name: string, type: string, o: { building?: boolean; parent?: string; res?: string; print?: string; ptr?: string; note?: string; scope?: number } = {}) {
    const obj: Obj = {
      id: `${++this.s.serial}`, name, type, state: o.building ? "building" : "alive",
      parent: o.parent ? this.find(o.parent).id : undefined, res: o.res, ptr: o.ptr, note: o.note,
    };
    (o.scope !== undefined ? this.s.scopes[o.scope] : this.top()).objs.push(obj);
    this.touched.add(obj.id);
    if (o.print) this.print(o.print);
    return obj;
  }
  /** The constructor body of an object that was `building` finishes. */
  built(name: string, print?: string) {
    const o = this.find(name);
    o.state = "alive";
    this.touched.add(o.id);
    if (print) this.print(print);
  }
  /** The destructor body starts (members still alive). */
  dying(name: string, print?: string) {
    const o = this.find(name);
    o.state = "dying";
    this.touched.add(o.id);
    if (print) this.print(print);
  }
  /** The object is gone; its resource, if any, has been released. */
  kill(name: string, print?: string) {
    const o = this.find(name);
    o.state = "dead";
    this.touched.add(o.id);
    if (print) this.print(print);
  }
  /** The object keeps living under another name (a returned object that becomes the caller's variable). */
  rename(name: string, to: string) {
    const o = this.find(name);
    o.name = to;
    this.touched.add(o.id);
  }
  /** Something happens to an existing object (e.g. copy assignment); it is highlighted. */
  touch(name: string, print?: string) {
    this.touched.add(this.find(name).id);
    if (print) this.print(print);
  }
  print(line: string) { this.s.out.push(line); }

  // ── Heap ──

  /** new / malloc / make_shared: a block appears. `refs` makes it reference counted. */
  alloc(id: string, label: string, o: { refs?: number; to?: string } = {}) {
    this.s.heap.push({ id, label, refs: o.refs, to: o.to });
    this.touched.add(`h${id}`);
  }
  /** The contents of a block change. */
  fill(id: string, label: string) {
    this.block(id).label = label;
    this.touched.add(`h${id}`);
  }
  /** Sets what an object's pointer holds; no block = nullptr, with an optional note such as "empty". */
  point(name: string, block?: string, note?: string) {
    const o = this.find(name);
    o.ptr = block;
    o.note = note;
    this.touched.add(o.id);
  }
  /** A pointer stored inside a heap block (a member of a heap object); `weak` = a weak_ptr. */
  link(id: string, to?: string, weak = false) {
    const b = this.block(id);
    b.to = to;
    b.toWeak = weak;
    this.touched.add(`h${id}`);
  }
  /** The block's shared_ptr / weak_ptr counts change. */
  count(id: string, refs: number, weak?: number) {
    const b = this.block(id);
    b.refs = refs;
    if (weak !== undefined) b.weak = weak;
    this.touched.add(`h${id}`);
  }
  /**
   * A shared_ptr owner lets go. At 0 the object is freed, and so is what it
   * owned through its own shared_ptr member (a chain); a weak_ptr member only
   * lowers its target's weak count.
   */
  release(id: string, print?: string) {
    const b = this.block(id);
    b.refs = (b.refs ?? 1) - 1;
    this.touched.add(`h${id}`);
    if (b.refs > 0) return;
    this.free(id);
    if (print) this.print(print);
    if (b.to && !b.toWeak) this.release(b.to);
    else if (b.to) { const w = this.block(b.to); w.weak = Math.max(0, (w.weak ?? 1) - 1); }
  }
  /** delete / free. A second free of the same block is a double free. */
  free(id: string) {
    const b = this.block(id);
    if (b.freed) {
      b.doubleFree = true;
      b.hidden = false;
      this.s.errors.push(`double free ${id}`);
    }
    b.freed = true;
    this.touched.add(`h${id}`);
  }
}

// ── Programs and their snapshots ──────────────────────────────────────────────

export type LifeStep = {
  line: number;                // 0-based line of `code` this step executes
  key: string;                 // tx key of the explanation
  en: string;
  run?: (m: Life) => void;
  /** A destructor call the compiler inserted; skipped in "no destructors" mode. */
  dtor?: boolean;
};
export type LifeProgram = { id: string; code: string[]; steps: LifeStep[] };
export type LifeSnap = { state: LifeState; touched: Set<string>; line: number; key: string; en: string };

/** Runs the program; with `noDtors` the compiler-inserted destructor steps are left out. */
export function lifeSnapshots(p: LifeProgram, noDtors: boolean): LifeSnap[] {
  let s = fresh();
  const out: LifeSnap[] = [];
  for (const st of p.steps) {
    if (noDtors && st.dtor) continue;
    s = structuredClone(s);
    const m = new Life(s);
    st.run?.(m);
    out.push({ state: s, touched: m.touched, line: st.line, key: st.key, en: st.en });
  }
  return out;
}

/** Blocks nobody freed that no live object can reach any more, directly or through other blocks. */
export function heapLeaks(s: LifeState): Block[] {
  const reach = new Set<string>();
  const live = s.scopes.filter(sc => !sc.closed).flatMap(sc => sc.objs).filter(o => o.state !== "dead");
  const visit = (id?: string) => {
    if (!id || reach.has(id)) return;
    reach.add(id);
    visit(s.heap.find(b => b.id === id)?.to);
  };
  for (const o of live) visit(o.ptr);
  return s.heap.filter(b => !b.freed && !reach.has(b.id));
}
