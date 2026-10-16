// ── The textbook five-stage pipeline ─────────────────────────────────────────
// Fetch, Decode, eXecute, Memory, Write back, one instruction entering per
// cycle, in order. An instruction waits in Decode until its inputs are ready:
// with forwarding, an ALU result can be used by the next instruction's
// execute stage straight away, and a load's result one cycle later (the
// load-use bubble); without forwarding, the value must first be written back
// (written in the first half of a cycle, read in the second). A branch is
// resolved in execute: if it was predicted wrongly, the instructions fetched
// behind it are thrown away and fetching restarts at the right address.
// Real x86 cores are out of order and much deeper; this is the model that
// explains the words (stall, bubble, flush) they are described with.

export type PInstr = {
  text: string;
  dst?: string;                      // register written
  src?: string[];                    // registers read
  load?: boolean;                    // result comes from memory (ready after M)
  mispredict?: boolean;              // a branch the predictor got wrong
  wrongPath?: boolean;               // fetched after a mispredicted branch, then flushed
};

export type Timing = { f: number; d: number; x: number; flushed: boolean };

export function schedule(prog: PInstr[], forwarding: boolean): { t: Timing[]; cycles: number } {
  const t: Timing[] = [];
  const ready = new Map<string, number>();       // register → first cycle its value can enter X
  let fetchAt = 0, prevX = -1, flushUntil = -1;
  for (const ins of prog) {
    if (ins.wrongPath) {
      // Fetched and decoded behind the branch, then thrown away when it executes
      const f = fetchAt, d = Math.max(f + 1, prevX);
      t.push({ f, d, x: -1, flushed: true });
      fetchAt = d;
      continue;
    }
    const f = Math.max(fetchAt, flushUntil);
    const d = Math.max(f + 1, prevX);
    let x = Math.max(d + 1, prevX + 1);
    for (const r of ins.src ?? []) x = Math.max(x, ready.get(r) ?? 0);
    t.push({ f, d, x, flushed: false });
    if (ins.dst) ready.set(ins.dst, forwarding ? x + (ins.load ? 2 : 1) : x + 3);
    fetchAt = d; prevX = x;
    if (ins.mispredict) flushUntil = x + 1;
  }
  const last = t.filter(q => !q.flushed).reduce((m, q) => Math.max(m, q.x + 2), 0);
  return { t, cycles: last + 1 };
}

/** The stage an instruction is in at `cycle`: F, D, X, M, W, "stall" (waiting in D), or "" (not in the pipe). */
export function stageAt(q: Timing, cycle: number, flushAt: number): string {
  if (cycle < q.f || (q.flushed && cycle >= flushAt)) return "";
  if (cycle < q.d) return cycle === q.f ? "F" : "fwait";
  if (q.flushed || cycle < q.x) return cycle === q.d ? "D" : "stall";
  return ["X", "M", "W"][cycle - q.x] ?? "";
}

export type PipeProgramId = "independent" | "chain" | "loadUse" | "branch";

export const PIPE_PROGRAMS: Record<PipeProgramId, PInstr[]> = {
  independent: [
    { text: "add eax, 1", dst: "eax", src: ["eax"] },
    { text: "add ebx, 2", dst: "ebx", src: ["ebx"] },
    { text: "add ecx, 3", dst: "ecx", src: ["ecx"] },
    { text: "add edx, 4", dst: "edx", src: ["edx"] },
    { text: "add esi, 5", dst: "esi", src: ["esi"] },
  ],
  chain: [
    { text: "add eax, 1", dst: "eax", src: ["eax"] },
    { text: "add eax, 2", dst: "eax", src: ["eax"] },
    { text: "add eax, 3", dst: "eax", src: ["eax"] },
    { text: "add eax, 4", dst: "eax", src: ["eax"] },
  ],
  loadUse: [
    { text: "mov eax, [rdi]", dst: "eax", src: ["rdi"], load: true },
    { text: "add eax, 1", dst: "eax", src: ["eax"] },
    { text: "mov ebx, [rsi]", dst: "ebx", src: ["rsi"], load: true },
    { text: "add ecx, 2", dst: "ecx", src: ["ecx"] },
    { text: "add ebx, ecx", dst: "ebx", src: ["ebx", "ecx"] },
  ],
  branch: [
    { text: "cmp eax, 0", src: ["eax"], dst: "flags" },
    { text: "jne .skip", src: ["flags"], mispredict: true },
    { text: "add ebx, 1", wrongPath: true },
    { text: "add ecx, 1", wrongPath: true },
    { text: ".skip: mov edx, 5", dst: "edx" },
    { text: "add esi, 1", dst: "esi", src: ["esi"] },
  ],
};
