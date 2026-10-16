"use client";

// Performance 1: SIMD — one instruction, many lanes; SSE (xmm, 4 floats or
// ints), AVX/AVX2 (ymm, 8), AVX-512 (zmm, 16) and which CPUs have them; a race
// of scalar / SSE / AVX2 sums with timings measured on a Ryzen 5 5600X;
// gcc's auto-vectorisation of a scale loop (-O2, -O3, -O3 -mavx2: broadcast,
// main loop, remainder, vzeroupper); why a float sum needs -ffast-math;
// packed SSE by hand in NASM (checked on Linux); intrinsics; -march and
// checking CPU features before using them.

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { CompilerOutputFigure } from "@/components/lesson/figures/asm/CompilerOutputFigure";
import { SimdRaceFigure } from "@/components/lesson/figures/asm/SimdRaceFigure";

export function SimdContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "asmSimd_intro",
          "The floating-point chapter used one lane of each xmm register and left the rest empty. SIMD, single instruction multiple data, fills them all: one addps adds four pairs of floats, one AVX vaddps adds eight. Loops over arrays of numbers, which is most of graphics, audio, physics and machine learning, can run four to sixteen times faster this way. This chapter shows the registers, times the speed-up on a real machine, and reads the vector code gcc writes, then writes some by hand.")}
      </Lead>

      <Goals t={t} id="asmSimd" items={[
        "Explain what a packed instruction does, and how many lanes SSE, AVX and AVX-512 registers have for each type.",
        "Read gcc's vectorised loop: the broadcast, the main loop and the remainder.",
        "Say why a float sum is only vectorised with -ffast-math.",
        "Write packed SSE in NASM and with intrinsics, and know what -mavx2 and -march do.",
      ]} />

      <H2>{tx(t, "asmSimd_lanesTitle", "One instruction, many lanes")}</H2>
      <p>
        {tx(t, "asmSimd_lanesBody",
          "A packed instruction does the same operation in every lane of its registers at once. x86 has grown three generations of vector registers, each twice as wide as the last, and the lower half of each is the previous one: xmm0 is the low half of ymm0, which is the low half of zmm0.")}
      </p>
      <LessonTable
        headers={[tx(t, "asmSimd_hExt", "Extension"), tx(t, "asmSimd_hRegs", "Registers"), tx(t, "asmSimd_hLanes", "Lanes (float / int / double)"), tx(t, "asmSimd_hWho", "Which processors")]}
        rows={[
          ["SSE / SSE2", "xmm0 – xmm15, 128 bits", "4 / 4 / 2", tx(t, "asmSimd_w1", "every x86-64 processor")],
          ["AVX / AVX2", "ymm0 – ymm15, 256 bits", "8 / 8 / 4", tx(t, "asmSimd_w2", "AVX since 2011; AVX2, which adds the integer operations, since 2013 on Intel and 2015 on AMD")],
          ["AVX-512", "zmm0 – zmm31, 512 bits", "16 / 16 / 8", tx(t, "asmSimd_w3", "Intel server chips, AMD since Zen 4 (2022); not the Ryzen 5 5600X used here")],
        ]}
      />
      <p>
        {tx(t, "asmSimd_names",
          "The names follow the scalar ones: addps is add packed single (4 floats), addpd add packed double, paddd add packed doublewords (4 ints, the p in front is for the integer instructions), mulps, subps, sqrtps and so on. The AVX forms add a v and a third operand: vaddps ymm0, ymm1, ymm2 writes ymm0 and leaves both sources intact.")}
      </p>

      <H2>{tx(t, "asmSimd_raceTitle", "How much faster?")}</H2>
      <p>
        {tx(t, "asmSimd_raceBody",
          "Here is the sum loop from the reading-compiler-output chapter, three ways. The scalar loop adds one element per trip. The SSE loop gcc -O3 writes keeps four partial sums in the four lanes of xmm0, and the AVX2 one eight in ymm0; at the end the lanes are folded together.")}
      </p>
      <SimdRaceFigure t={t} />
      <LessonTable
        headers={[tx(t, "asmSimd_hBuild", "Build"), tx(t, "asmSimd_hTime", "Time per element"), tx(t, "asmSimd_hSpeed", "Speed-up")]}
        rows={[
          ["gcc -O2", "0.268 ns", "1×"],
          ["gcc -O3", "0.052 ns", "5.2×"],
          ["gcc -O3 -mavx2", "0.025 ns", "10.7×"],
        ]}
      />
      <p>
        {tx(t, "asmSimd_raceAfter",
          "Measured with gcc 14 on a Ryzen 5 5600X, summing 4,096 ints, small enough to stay in the L1 cache, 100,000 times; the best of seven runs. SSE gives a little more than 4× because the vector loop also has fewer loop instructions per element. Once the data no longer fits in the caches, the speed-up shrinks: the CPU can add faster than memory can deliver, as the next chapter measures.")}
      </p>

      <H2>{tx(t, "asmSimd_autoTitle", "Auto-vectorisation: reading gcc's vector loop")}</H2>
      <p>
        {tx(t, "asmSimd_autoBody",
          "You rarely write SIMD by hand: the compiler does it for simple loops, at -O3 (and in cheap cases at -O2 since gcc 12). The result has the same three parts every time. Look at a loop that multiplies every element of an array by k:")}
      </p>
      <CompilerOutputFigure t={t} programs={["scale"]} />
      <LessonTable
        headers={[tx(t, "asmSimd_hPart", "Part"), tx(t, "asmSimd_hDoes", "What it does")]}
        rows={[
          [tx(t, "asmSimd_p1", "setup"), tx(t, "asmSimd_p1v", "skips short arrays, and copies k into every lane (shufps or vbroadcastss): a broadcast")],
          [tx(t, "asmSimd_p2", "main loop"), tx(t, "asmSimd_p2v", "load 4 or 8 elements, one packed multiply, store: the fast part")],
          [tx(t, "asmSimd_p3", "remainder"), tx(t, "asmSimd_p3v", "the last n mod 4 (or n mod 8) elements, with scalar or narrower instructions")],
        ]}
      />
      <p>
        {tx(t, "asmSimd_whenNot",
          "The compiler only vectorises when it can prove the result is the same. A loop whose iterations depend on each other, such as a[i] = a[i - 1] * k, cannot be split into lanes. Pointers that might overlap force a run-time check or stop it altogether; restrict promises they do not. And floating-point sums run into a rule of their own:")}
      </p>
      <CompilerOutputFigure t={t} programs={["fsum"]} />
      <p>
        {tx(t, "asmSimd_assoc",
          "In real numbers, (a + b) + c = a + (b + c). In floats it is not always true, because each addition rounds: (0.1 + 0.2) + 0.3 is 0.6000000000000001 while 0.1 + (0.2 + 0.3) is 0.6. Four lanes add the elements in a different order from the loop, so gcc refuses without -ffast-math or the narrower -fassociative-math. Integer sums have no such problem, which is why the int sum above was vectorised at -O3.")}
      </p>

      <H2>{tx(t, "asmSimd_handTitle", "Packed instructions by hand")}</H2>
      <p>
        {tx(t, "asmSimd_handBody",
          "In NASM the packed instructions look like the scalar ones with a different suffix. This function adds two arrays of four floats; C calls it like any other function:")}
      </p>
      <CodeBlock lang="nasm" filename="add4.asm" t={t}>{`        section .note.GNU-stack noalloc noexec nowrite progbits
        section .text
        global  add4
add4:                                   ; void add4(float *dst, const float *a, const float *b)
        movups  xmm0, [rsi]             ; 4 floats from a
        movups  xmm1, [rdx]             ; 4 floats from b
        addps   xmm0, xmm1              ; 4 additions in one instruction
        movups  [rdi], xmm0             ; 4 floats to dst
        ret`}</CodeBlock>
      <p>
        {tx(t, "asmSimd_handRun",
          "Called with {1, 2, 3, 4} and {10, 20, 30, 40}, it gives 11 22 33 44. movups loads 16 bytes from any address. movaps, a for aligned, is the same load but faults if the address is not a multiple of 16; on modern processors movups on aligned data is just as fast, so compilers mostly use it.")}
      </p>

      <H2>{tx(t, "asmSimd_intrinTitle", "Intrinsics: SIMD from C")}</H2>
      <p>
        {tx(t, "asmSimd_intrinBody",
          "Between trusting the compiler and writing assembly sits a middle way, intrinsics: C functions that the compiler turns into one instruction each. The data types are __m128 (4 floats), __m128i (integers), __m256 and so on.")}
      </p>
      <CompilerOutputFigure t={t} programs={["intrin"]} />
      <p>
        {tx(t, "asmSimd_intrinAfter",
          "The names read like the instructions: _mm_ for 128 bits, _mm256_ for 256, then the operation, then ps, pd or epi32 for the type. Intel's online Intrinsics Guide lists every one with its instruction and its cost. Intrinsics are what libraries such as image codecs and math kernels use: you pick the instructions, and the compiler still allocates the registers, schedules the code and inlines it.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "asmSimd_sigill",
          "-mavx2 and -march=native let gcc use AVX2 everywhere in that file. The program then crashes with SIGILL, illegal instruction, on a processor without it. Software shipped to other people checks first, with __builtin_cpu_supports(\"avx2\") or the cpuid instruction, and picks a version at run time; gcc can build both versions for you with __attribute__((target_clones(\"avx2\", \"default\"))).")}
      </Callout>

      <H2>{tx(t, "asmSimd_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "asmSimd_try1", "Extend add4.asm to add8 with AVX: ymm registers, vmovups and vaddps ymm0, ymm0, ymm1. Assemble it and call it from C. What happens if you leave out vzeroupper before ret?")}</li>
        <li>{tx(t, "asmSimd_try2", "On Compiler Explorer, compile the scale loop with -O3 -march=x86-64-v4 (AVX-512). How many floats does each trip handle now?")}</li>
        <li>{tx(t, "asmSimd_try3", "Write void prefix(float *a, int n) { for (int i = 1; i < n; i++) a[i] += a[i - 1]; } and compile with -O3. Is it vectorised? Why not?")}</li>
      </ol>

      <KeyIdeas t={t} id="asmSimd" items={[
        "A packed instruction does the same operation in every lane: addps adds 4 floats, vaddps on ymm adds 8.",
        "SSE has 16 xmm registers of 128 bits, AVX 16 ymm of 256, AVX-512 32 zmm of 512; each contains the previous one as its low half.",
        "Measured on a Ryzen 5 5600X: an int sum ran 5.2× faster with SSE and 10.7× faster with AVX2.",
        "gcc's vector loops have a setup with a broadcast, a main loop and a scalar remainder.",
        "Float reductions are only vectorised with -ffast-math, because float addition is not associative.",
        "Intrinsics give SIMD from C with one instruction per call; the compiler still handles registers and scheduling.",
        "Code built for AVX crashes with SIGILL on processors without it: check with __builtin_cpu_supports or cpuid.",
      ]} />
    </Article>
  );
}
