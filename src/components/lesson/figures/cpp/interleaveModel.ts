// ── Interleave model ──────────────────────────────────────────────────────────
// Two threads each run ++counter once. With a plain int, ++ is three machine
// steps (load into a register, add, store back) and the scheduler may switch
// threads between any two of them. With a mutex, the three steps sit between
// lock and unlock, and a thread that finds the mutex taken waits. With
// std::atomic, the increment is one indivisible instruction. The machine code
// is what g++ 14 emits for x86-64: -O0 for the plain int (at -O2 it is a single
// add [counter], 1, still read-add-write inside the CPU and not atomic), and
// the lock add of -O2 for the atomic.

export type ThrMode = "plain" | "mutex" | "atomic";
export type Tid = "A" | "B";
export type Op = "lock" | "load" | "add" | "store" | "unlock" | "rmw";

export const PROGRAM: Record<ThrMode, Op[]> = {
  plain: ["load", "add", "store"],
  mutex: ["lock", "load", "add", "store", "unlock"],
  atomic: ["rmw"],
};

export const SOURCE: Record<ThrMode, string[]> = {
  plain: ["++counter;"],
  mutex: ["std::lock_guard g{m};", "++counter;", "}  // ~lock_guard"],
  atomic: ["counter.fetch_add(1);"],
};

export const ASM: Record<Op, string> = {
  lock: "call  pthread_mutex_lock",
  load: "mov   eax, [counter]",
  add: "add   eax, 1",
  store: "mov   [counter], eax",
  unlock: "call  pthread_mutex_unlock",
  rmw: "lock add [counter], 1",
};

/** The source line each op belongs to (index into SOURCE[mode]). */
export const OP_LINE: Record<ThrMode, number[]> = { plain: [0, 0, 0], mutex: [0, 1, 1, 1, 2], atomic: [0] };

export type ThrState = {
  pc: Record<Tid, number>;
  reg: Record<Tid, number | null>;
  mem: number;
  owner: Tid | null;
  /** What the last step did, as a translation key + English with {t}/{v} blanks. */
  last: { key: string; en: string; t: Tid; v: number } | null;
  /** Each store and atomic add, in order: the value written and who wrote it. */
  writes: { t: Tid; v: number }[];
};

export const START: ThrState = { pc: { A: 0, B: 0 }, reg: { A: null, B: null }, mem: 0, owner: null, last: null, writes: [] };

export const done = (s: ThrState, mode: ThrMode, t: Tid) => s.pc[t] >= PROGRAM[mode].length;

export function step(s: ThrState, mode: ThrMode, t: Tid): ThrState {
  if (done(s, mode, t)) return s;
  const op = PROGRAM[mode][s.pc[t]];
  const n: ThrState = { ...s, pc: { ...s.pc }, reg: { ...s.reg }, writes: [...s.writes] };
  const adv = () => { n.pc[t]++; };
  switch (op) {
    case "lock":
      if (s.owner && s.owner !== t) {
        n.last = { key: "blocked", en: "Thread {t} tries to lock m, but it is taken. It waits: the operating system puts it to sleep until m is unlocked.", t, v: 0 };
        return n;
      }
      n.owner = t; adv();
      n.last = { key: "lock", en: "Thread {t} locks m. Until it unlocks, any other thread that tries to lock m has to wait.", t, v: 0 };
      break;
    case "load":
      n.reg[t] = s.mem; adv();
      n.last = { key: "load", en: "Thread {t} copies counter from memory into its own register: {v}.", t, v: s.mem };
      break;
    case "add":
      n.reg[t] = (s.reg[t] ?? 0) + 1; adv();
      n.last = { key: "add", en: "Thread {t} adds 1 in its register: {v}. Memory has not changed yet.", t, v: n.reg[t]! };
      break;
    case "store":
      n.mem = s.reg[t] ?? 0; adv(); n.writes.push({ t, v: n.mem });
      n.last = { key: "store", en: "Thread {t} writes its register back to memory: counter = {v}.", t, v: n.mem };
      break;
    case "unlock":
      n.owner = null; adv();
      n.last = { key: "unlock", en: "Thread {t} unlocks m (the lock_guard's destructor). A waiting thread may now take it.", t, v: 0 };
      break;
    case "rmw":
      n.mem = s.mem + 1; adv(); n.writes.push({ t, v: n.mem });
      n.last = { key: "rmw", en: "Thread {t} adds 1 to counter in one indivisible step: read, add and write happen as one. counter = {v}.", t, v: n.mem };
      break;
  }
  return n;
}

/** Schedules worth trying, as the thread that runs each step. */
export const SCHEDULES: Record<ThrMode, Record<string, Tid[]>> = {
  plain: { serial: ["A", "A", "A", "B", "B", "B"], lost: ["A", "B", "A", "B", "A", "B"] },
  mutex: { serial: ["A", "A", "A", "A", "A", "B", "B", "B", "B", "B"], lost: ["A", "B", "A", "B", "A", "B", "A", "B", "A", "B", "B", "B", "B", "B"] },
  atomic: { serial: ["A", "B"], lost: ["B", "A"] },
};
