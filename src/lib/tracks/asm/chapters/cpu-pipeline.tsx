"use client";

// Performance 2: inside the CPU — latency against throughput; the five-stage
// pipeline (figure: overlap, forwarding, load-use bubble, flushed branch);
// what a modern core adds (decode to µops, out of order, several ports, ~19
// stages); dependency chains measured (one float accumulator 0.64 ns, four
// 0.17 ns); branch prediction with a 2-bit counter and history (figure) and
// the sorted/random/alternating timings, cmov; the cache staircase measured
// with pointer chasing (L1 0.87 ns → RAM 100 ns, figure); what to do about it.
// Every number was measured on a Ryzen 5 5600X with gcc 14.

import { H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { BranchPredictorFigure } from "@/components/lesson/figures/asm/BranchPredictorFigure";
import { CompilerOutputFigure } from "@/components/lesson/figures/asm/CompilerOutputFigure";
import { LatencyFigure } from "@/components/lesson/figures/asm/LatencyFigure";
import { PipelineFigure } from "@/components/lesson/figures/asm/PipelineFigure";

export function CpuPipelineContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "asmPipe_intro",
          "Counting instructions is a poor guide to speed. The same number of additions ran 4 times faster when they did not depend on each other, the same loop 5 times slower on unsorted data, and the same load took 0.9 or 100 nanoseconds depending on where the data was. This chapter opens the processor far enough to explain those numbers, all measured on one machine, a Ryzen 5 5600X: the pipeline, branch prediction and the caches.")}
      </Lead>

      <Goals t={t} id="asmPipe" items={[
        "Explain how a pipeline overlaps instructions, and what stalls, bubbles and flushes are.",
        "Tell latency from throughput, and break a dependency chain to make a loop faster.",
        "Explain why a branch on random data is slow, and how sorting or cmov fixes it.",
        "Read the cache staircase, and say how long a load takes from L1, L2, L3 and RAM.",
      ]} />

      <H2>{tx(t, "asmPipe_pipeTitle", "The pipeline")}</H2>
      <p>
        {tx(t, "asmPipe_pipeBody",
          "Running one instruction takes several steps: fetch its bytes, decode them, execute, access memory, write the result. A processor that waited for each instruction to finish before starting the next would leave most of its circuits idle. A pipeline works like an assembly line instead: while one instruction executes, the next is being decoded and the one after that fetched. Each instruction still takes five cycles, but one finishes every cycle.")}
      </p>
      <PipelineFigure t={t} />
      <LessonTable
        headers={[tx(t, "asmPipe_hWord", "Word"), tx(t, "asmPipe_hMeans", "Means")]}
        rows={[
          [tx(t, "asmPipe_w1", "stall"), tx(t, "asmPipe_w1v", "an instruction waits in a stage because a value it needs is not ready")],
          [tx(t, "asmPipe_w2", "bubble"), tx(t, "asmPipe_w2v", "the empty slot a stall leaves travelling down the pipe")],
          [tx(t, "asmPipe_w3", "forwarding"), tx(t, "asmPipe_w3v", "sending a result straight to the next instruction, before it is written to the register")],
          [tx(t, "asmPipe_w4", "flush"), tx(t, "asmPipe_w4v", "throwing away instructions fetched on a wrong guess")],
        ]}
      />
      <p>
        {tx(t, "asmPipe_modern",
          "A modern x86 core is far more elaborate. It decodes each instruction into simpler micro-operations (µops), keeps a window of a few hundred of them, and executes any whose inputs are ready, out of order, on several execution units at once; the results are then retired in program order, so the program never notices. A Zen 3 core can start up to six µops per cycle and has a pipeline of about 19 stages. The words stay the same, and so do the two enemies: instructions that wait for each other, and wrong guesses.")}
      </p>

      <H2>{tx(t, "asmPipe_chainTitle", "Latency, throughput and dependency chains")}</H2>
      <p>
        {tx(t, "asmPipe_chainBody",
          "Every instruction has two costs. Its latency is the time until its result can be used: 3 cycles for addss on Zen 3. Its throughput is how many can start per cycle when they are independent: two addss per cycle. A loop whose every step needs the previous result runs at the speed of latency; a loop of independent steps runs at the speed of throughput. Here is a float sum with one accumulator and with four:")}
      </p>
      <CompilerOutputFigure t={t} programs={["ilp"]} />
      <LessonTable
        headers={[tx(t, "asmPipe_hVersion", "Version"), tx(t, "asmPipe_hTime", "Time per element"), tx(t, "asmPipe_hWhy", "Limited by")]}
        rows={[
          [tx(t, "asmPipe_v1", "one accumulator"), "0.64 ns ≈ 3 " + tx(t, "asmPipe_cycles", "cycles"), tx(t, "asmPipe_v1w", "the latency of addss: each add waits for the last")],
          [tx(t, "asmPipe_v2", "four accumulators"), "0.17 ns ≈ 0.8 " + tx(t, "asmPipe_cycles", "cycles"), tx(t, "asmPipe_v2w", "four chains in flight at once")],
        ]}
      />
      <p>
        {tx(t, "asmPipe_chainAfter",
          "Same additions, same instructions, 3.85 times faster: the second version only gave the processor independent work to overlap. This is also what SIMD exploits, and what -ffast-math allows the compiler to do for you, since splitting a float sum into several changes the order of the additions.")}
      </p>

      <H2>{tx(t, "asmPipe_branchTitle", "Branch prediction")}</H2>
      <p>
        {tx(t, "asmPipe_branchBody",
          "A conditional jump is decided deep in the pipeline, but the fetch stage needs to know where to go next right away. So the processor guesses, keeps fetching and executing along the guessed path, and throws the work away if the guess was wrong. Predictors learn from what each branch did before. The simplest is a 2-bit counter per branch; real ones also look at the recent history of outcomes:")}
      </p>
      <BranchPredictorFigure t={t} />
      <p>
        {tx(t, "asmPipe_branchRun",
          "The loop below adds the bytes of an array that are 128 or more. Built so that the if stays a branch, it was timed on the same 32,768 bytes in three orders:")}
      </p>
      <CompilerOutputFigure t={t} programs={["branch"]} />
      <LessonTable
        headers={[tx(t, "asmPipe_hData", "Data"), tx(t, "asmPipe_hBranch", "With the branch"), tx(t, "asmPipe_hCmov", "With cmov")]}
        rows={[
          [tx(t, "asmPipe_d1", "random bytes"), "2.02 ns", "0.43 ns"],
          [tx(t, "asmPipe_d2", "the same bytes, sorted"), "0.38 ns", "0.43 ns"],
          [tx(t, "asmPipe_d3", "alternating 10, 200, 10, 200…"), "0.34 ns", "0.43 ns"],
        ]}
      />
      <p>
        {tx(t, "asmPipe_branchAfter",
          "On random data half the guesses are wrong, and each wrong guess costs roughly 15 cycles of thrown-away work: the loop is 5 times slower than on sorted data, where the branch goes the same way thousands of times in a row. The alternating data is as fast as the sorted: the real predictor uses history and learns the pattern, which a single 2-bit counter cannot. The cmov version never guesses, so it takes the same time on any data. gcc -O3 vectorised the loop and needed 0.097 ns on all three.")}
      </p>

      <H2>{tx(t, "asmPipe_cacheTitle", "The memory hierarchy")}</H2>
      <p>
        {tx(t, "asmPipe_cacheBody",
          "Main memory is far away: about 100 ns, some 460 cycles, for a load that misses every cache. To hide that, the processor keeps copies of recently used memory in caches, in blocks of 64 bytes called cache lines. To measure each level, a program follows a chain of pointers spread at random over an area of a given size; every load depends on the previous one, so nothing can overlap and the time per load is the true latency.")}
      </p>
      <LatencyFigure t={t} />
      <LessonTable
        headers={[tx(t, "asmPipe_hLevel", "Level"), tx(t, "asmPipe_hSize", "Size on this CPU"), tx(t, "asmPipe_hLat", "Measured latency")]}
        rows={[
          ["L1", tx(t, "asmPipe_l1", "32 KiB per core"), "0.9 ns ≈ 4 " + tx(t, "asmPipe_cycles", "cycles")],
          ["L2", tx(t, "asmPipe_l2", "512 KiB per core"), "2.6 ns ≈ 12 " + tx(t, "asmPipe_cycles", "cycles")],
          ["L3", tx(t, "asmPipe_l3", "32 MiB shared by the 6 cores"), tx(t, "asmPipe_l3v", "10 to 23 ns, rising with size")],
          ["RAM", "DDR4", "≈ 100 ns ≈ 460 " + tx(t, "asmPipe_cycles", "cycles")],
        ]}
      />
      <p>
        {tx(t, "asmPipe_cacheAfter",
          "The L3 steps are not flat because larger areas also miss in the TLB, a small cache of the page-table translations from the pointers chapter, and every miss there adds a page-table walk. Real programs are rarely this unlucky: walking an array in order lets the hardware prefetcher fetch the next lines before they are asked for, and many independent loads can be in flight at once. Random access to more data than the caches hold, such as following pointers through a big linked list or tree, is where the 100 ns show up.")}
      </p>

      <H2>{tx(t, "asmPipe_doTitle", "What to do about it")}</H2>
      <LessonTable
        headers={[tx(t, "asmPipe_hProblem", "Problem"), tx(t, "asmPipe_hFix", "Fix")]}
        rows={[
          [tx(t, "asmPipe_f1", "a long dependency chain"), tx(t, "asmPipe_f1v", "split it into several independent ones (more accumulators), or let the compiler with -ffast-math")],
          [tx(t, "asmPipe_f2", "an unpredictable branch"), tx(t, "asmPipe_f2v", "sort the data, compute both sides and select (cmov, or arithmetic), or vectorise")],
          [tx(t, "asmPipe_f3", "cache misses"), tx(t, "asmPipe_f3v", "smaller data (struct padding, smaller types), access in order, arrays instead of linked structures, struct of arrays for hot fields")],
          [tx(t, "asmPipe_f4", "not knowing which"), tx(t, "asmPipe_f4v", "measure: perf stat counts cycles, instructions, branch misses and cache misses for a whole program")],
        ]}
      />

      <H2>{tx(t, "asmPipe_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "asmPipe_try1", "In the pipeline figure, how many cycles would 100 independent instructions take? And 100 in the chain without forwarding?")}</li>
        <li>{tx(t, "asmPipe_try2", "On Linux, run perf stat -e branches,branch-misses on a program that sums the big bytes of a random and of a sorted array. Compare the miss rates.")}</li>
        <li>{tx(t, "asmPipe_try3", "Change the float sum to 8 accumulators. Does it get faster than 4? (Zen 3 can start two addss per cycle, each taking 3: how many must be in flight to keep both units busy?)")}</li>
      </ol>

      <KeyIdeas t={t} id="asmPipe" items={[
        "A pipeline overlaps instructions: each takes several cycles, but one can finish every cycle.",
        "Stalls are waits for a value, flushes throw away work done on a wrong guess; forwarding avoids most stalls.",
        "Modern cores decode into µops and execute them out of order on several units, about 19 stages deep.",
        "Latency limits dependent instructions, throughput limits independent ones: four accumulators made a float sum 3.85× faster.",
        "A branch on random data is mispredicted half the time, about 15 cycles each: 5× slower here than on sorted data. cmov never guesses.",
        "Measured latency: L1 about 4 cycles, L2 about 12, L3 tens, RAM about 460 cycles.",
        "Measure before optimising: perf stat shows cycles, instructions, branch misses and cache misses.",
      ]} />
    </Article>
  );
}
