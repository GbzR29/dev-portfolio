"use client";

// Systems & Performance 3: performance and data layout. Starts from 4,000,000
// particles that blow the frame budget until their layout changes; then
// measuring (steady_clock, release builds, profilers), the memory hierarchy
// of the machine the numbers were taken on, cache lines and prefetching
// (vector against list, measured), array of structs against struct of arrays
// (figure: the cache lines each layout loads), hot/cold splitting, branches
// and the conditional move g++ chose, allocation (new against an arena and
// reserve, measured), what the compiler can do with flags, and containers.
// Every number was measured on a Ryzen 5 5600X with g++ 14 -O2.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { CacheLineFigure } from "@/components/lesson/figures/cpp/CacheLineFigure";

export function PerformanceContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "cppPerf_intro",
          "A particle system moves four million sparks. Updating their height takes 33 milliseconds, and at 60 frames per second the whole frame has only 16.7. The maths is a single multiply and add per particle, and the processor can do billions of those per second, so the maths is not the problem. The problem is where the numbers live in memory. Rearranging the same data, without changing a single formula, brings the loop down to 3.7 ms. This chapter is about that kind of speed: measuring first, then giving the hardware data in the shape it likes. Every number here was measured on one machine, a Ryzen 5 5600X, with g++ 14 at -O2; yours will differ, and the reasons will not.")}
      </Lead>

      <Goals t={t} id="cppPerf" items={[
        "Time code correctly and know when a measurement can be trusted.",
        "Explain caches, cache lines and why memory access patterns dominate speed.",
        "Choose between an array of structs and a struct of arrays for a given loop.",
        "Cut allocation costs with reserve and arenas, and let the compiler help.",
      ]} />

      <H2>{tx(t, "cppPerf_measureTitle", "Measure first")}</H2>
      <CodeBlock lang="cpp" filename="timing.cpp" t={t}>{`#include <chrono>

auto t0 = std::chrono::steady_clock::now();
update_particles(particles, dt);
auto t1 = std::chrono::steady_clock::now();

double ms = std::chrono::duration<double, std::milli>(t1 - t0).count();
std::println("update: {:.2f} ms", ms);`}</CodeBlock>
      <p>
        {tx(t, "cppPerf_measureBody",
          "steady_clock is a clock that only moves forward, unlike system_clock, which jumps when the computer's time is corrected. duration<double, std::milli> converts the difference to milliseconds as a double. Intuition about speed is wrong surprisingly often, even for experts, so every change in this chapter starts and ends with a number.")}
      </p>
      <LessonTable
        headers={[tx(t, "cppPerf_hRule", "Rule"), tx(t, "cppPerf_hWhy", "Why")]}
        rows={[
          [tx(t, "cppPerf_m1", "Measure optimised builds (-O2)."), tx(t, "cppPerf_m1w", "-O0 is often many times slower, and slow in different places, so it points at the wrong code.")],
          [tx(t, "cppPerf_m2", "Repeat, and ignore the first run."), tx(t, "cppPerf_m2w", "The first run pays for cold caches and the operating system handing out fresh memory: the arena below took 14 ms once, then 4.3.")],
          [tx(t, "cppPerf_m3", "Use the result."), tx(t, "cppPerf_m3w", "If nothing reads what a loop computes, the optimiser may delete the loop and you time nothing.")],
          [tx(t, "cppPerf_m4", "Use a profiler to find where time goes."), tx(t, "cppPerf_m4w", "perf on Linux, Visual Studio's profiler, AMD uProf or Intel VTune sample the program thousands of times a second; Tracy is popular in games.")],
        ]}
      />

      <H2>{tx(t, "cppPerf_memTitle", "Memory is far away")}</H2>
      <p>
        {tx(t, "cppPerf_memBody",
          "A processor core can add numbers in a fraction of a nanosecond, but fetching a value from main memory takes around 70 to 100 nanoseconds. To hide that, every core has small, fast memories called caches that keep copies of recently used data. When the data is in a cache, it is a hit; when it is not, a miss, and the core waits.")}
      </p>
      <LessonTable
        headers={[tx(t, "cppPerf_hLevel", "Level"), tx(t, "cppPerf_hSize", "Size on a Ryzen 5 5600X"), tx(t, "cppPerf_hLat", "Time to read, roughly")]}
        rows={[
          [tx(t, "cppPerf_l1", "registers"), tx(t, "cppPerf_l1s", "16 general-purpose + 16 vector, per core"), tx(t, "cppPerf_l1t", "0 (already there)")],
          ["L1", tx(t, "cppPerf_l2s", "32 KB of data per core"), "~1 ns"],
          ["L2", tx(t, "cppPerf_l3s", "512 KB per core"), "~3 ns"],
          ["L3", tx(t, "cppPerf_l4s", "32 MB shared by the 6 cores"), "~10 ns"],
          [tx(t, "cppPerf_l5", "main memory (RAM)"), tx(t, "cppPerf_l5s", "gigabytes"), "~70–100 ns"],
        ]}
      />
      <H3>{tx(t, "cppPerf_lineTitle", "Cache lines and prefetching")}</H3>
      <p>
        {tx(t, "cppPerf_lineBody",
          "Caches never fetch a single byte. They move memory in blocks of 64 bytes, called cache lines: read one float, and its 15 neighbours come along for free. And when the hardware notices that a program walks memory in order, a part of the processor called the prefetcher starts loading the next lines before they are asked for. So memory read in order is fast twice over, and memory read in a scattered order pays the full trip each time.")}
      </p>
      <CodeBlock lang="cpp" filename="vector_list.cpp" t={t}>{`std::vector<int> vec(1'000'000, 1);   // one contiguous block of 4 MB
std::list<int>   lst(1'000'000, 1);   // a million separate nodes, linked by pointers

long a = 0; for (int x : vec) a += x;   // 0.3–0.4 ms
long b = 0; for (int x : lst) b += x;   // 6.4–8.5 ms: about 20 times slower`}</CodeBlock>
      <p>
        {tx(t, "cppPerf_listBody",
          "Same million additions. Each list node is a separate allocation holding the int and two pointers, so the loop follows a pointer to find each element, cannot know the next address until it has read the current node, and gives the prefetcher nothing to predict. Here the nodes were even allocated one after another; in a real program, after insertions and deletions, they end up scattered and the gap grows. This is why the advice for containers is \"start with std::vector\".")}
      </p>

      <H2>{tx(t, "cppPerf_layoutTitle", "Array of structs, struct of arrays")}</H2>
      <CodeBlock lang="cpp" filename="layouts.cpp" t={t}>{`// Array of structs (AoS): the natural way to write it
struct Particle { float x, y, z, vx, vy, vz, r, g, b, a, life, size, mass, drag, spin, age; };
std::vector<Particle> particles;            // sizeof(Particle) == 64

// Struct of arrays (SoA): one array per field
struct Particles { std::vector<float> x, y, z, vx, vy, vz, r, g, b, a, life, size, mass, drag, spin, age; };`}</CodeBlock>
      <p>
        {tx(t, "cppPerf_layoutBody",
          "A Particle is sixteen floats, 64 bytes, exactly one cache line. Updating y only needs y and vy, 8 of those bytes, but the cache cannot load half a line: it brings all 64. Seven eighths of the memory traffic is wasted. In a struct of arrays, all the ys sit side by side, so one cache line carries the y of 16 particles and the arrays the loop never touches never leave memory. Pick a loop and look at what each layout loads.")}
      </p>
      <CacheLineFigure t={t} />
      <p>
        {tx(t, "cppPerf_layoutAfter",
          "SoA wins by more than the 8 to 1 ratio of bytes suggests, because the compiler can also process the side-by-side floats with vector instructions, several particles per instruction (SIMD: one instruction, multiple data). The price is code that reads less naturally, and loops that use every field gain nothing. A middle way is hot/cold splitting: keep the fields every frame needs (position, velocity) in one struct, and move the rarely used ones (name, spawn time, debug data) into a second array indexed the same way.")}
      </p>
      <Callout type="tip" t={t}>
        {tx(t, "cppPerf_padTip",
          "Field order matters even inside one struct. struct { char a; double b; char c; } is 24 bytes because each double must start at a multiple of 8, so the compiler inserts padding after a and after c. Ordered as double, char, char it is 16. Sort members from largest to smallest when a struct is stored by the million.")}
      </Callout>

      <H2>{tx(t, "cppPerf_branchTitle", "Branches and prediction")}</H2>
      <CodeBlock lang="cpp" filename="branch.cpp" t={t}>{`long sum_big(const std::vector<int>& data) {
    long t = 0;
    for (int d : data)
        if (d >= 128) t += d;    // half of random bytes pass, unpredictably
    return t;
}`}</CodeBlock>
      <p>
        {tx(t, "cppPerf_branchBody",
          "A processor starts working on the next instructions long before it knows the result of an if, by guessing which way it will go: branch prediction. A correct guess costs nothing; a wrong one throws away the guessed work, around 15 cycles. With random data the guess is a coin toss, so the classic advice is to sort the data first, which makes the branch predictable. On this machine sorting changed nothing: 1.8 ms either way. g++ looked at the if and replaced it with a cmovg instruction, a conditional move that picks between two values without jumping, so there was no branch left to mispredict. Both halves of the lesson are useful: unpredictable branches in hot loops are expensive, and the compiler often removes them, so measure before rewriting.")}
      </p>

      <H2>{tx(t, "cppPerf_allocTitle", "Allocation")}</H2>
      <CodeBlock lang="cpp" filename="arena.cpp" t={t}>{`struct Bullet { float x, y, vx, vy; };

// One million separate allocations
for (int i = 0; i < N; ++i) ptrs[i] = new Bullet{};       // + a delete for each: ~49 ms

// An arena: one big block, handed out piece by piece, freed all at once
std::pmr::monotonic_buffer_resource arena;
std::pmr::polymorphic_allocator<Bullet> alloc{&arena};
for (int i = 0; i < N; ++i) ptrs[i] = alloc.new_object<Bullet>();   // ~4.4 ms, freed with arena

// Or no pointers at all: values in a vector, with room reserved up front
std::vector<Bullet> bullets;
bullets.reserve(N);                                       // one allocation
for (int i = 0; i < N; ++i) bullets.push_back({});        // ~3 ms (6.5 ms without reserve)`}</CodeBlock>
      <p>
        {tx(t, "cppPerf_allocBody",
          "new has to find a free block of the right size, record it, and later delete has to give it back, and both may have to coordinate between threads. An arena (std::pmr::monotonic_buffer_resource, C++17) takes one big block and hands out pieces just by moving a pointer forward; it never frees single objects, only everything at once when it is destroyed. That suits data that lives exactly one frame or one level. Better still is not allocating per object: a vector of values with reserve() makes one allocation for all of them, and growing without reserve copies everything several times (the std::string & std::vector chapter).")}
      </p>

      <H2>{tx(t, "cppPerf_compilerTitle", "Let the compiler help")}</H2>
      <LessonTable
        headers={[tx(t, "cppPerf_hFlag", "Flag or habit"), tx(t, "cppPerf_hDoes", "What it does")]}
        rows={[
          ["-O2", tx(t, "cppPerf_c1", "The normal optimised build: inlining, keeping values in registers, removing dead code. -O3 tries more aggressive transformations, sometimes faster, sometimes larger and slower: measure.")],
          ["-march=native", tx(t, "cppPerf_c2", "Uses every instruction this processor has (AVX2 here). The program may then crash with \"illegal instruction\" on an older machine, so do not ship it that way.")],
          ["-flto", tx(t, "cppPerf_c3", "Link-time optimisation: the optimiser sees all .cpp files at once and can inline across them.")],
          [tx(t, "cppPerf_c4k", "small functions in headers"), tx(t, "cppPerf_c4", "A function the compiler can see can be inlined: its body copied into the caller, with no call at all.")],
          [tx(t, "cppPerf_c5k", "no virtual calls in the hottest loops"), tx(t, "cppPerf_c5", "A virtual call cannot be inlined unless the compiler knows the exact type (the Inheritance chapter); sort objects by type or use templates there.")],
        ]}
      />

      <H2>{tx(t, "cppPerf_contTitle", "Containers, in one table")}</H2>
      <LessonTable
        headers={[tx(t, "cppPerf_hNeed", "Need"), tx(t, "cppPerf_hUse", "Use"), tx(t, "cppPerf_hNote", "Note")]}
        rows={[
          [tx(t, "cppPerf_n1", "a sequence"), "std::vector", tx(t, "cppPerf_n1n", "The default. Contiguous, prefetch-friendly, reserve when you know the size.")],
          [tx(t, "cppPerf_n2", "a fixed number of elements"), "std::array", tx(t, "cppPerf_n2n", "No heap at all.")],
          [tx(t, "cppPerf_n3", "lookup by key, many lookups"), "std::unordered_map", tx(t, "cppPerf_n3n", "Each element is its own node; reserve() avoids rehashing.")],
          [tx(t, "cppPerf_n4", "lookup by key, small or rarely changed"), "std::flat_map (C++23)", tx(t, "cppPerf_n4n", "Sorted vectors of keys and values: fast to walk, slow to insert. In libstdc++ since GCC 15.")],
          [tx(t, "cppPerf_n5", "inserting in the middle of huge sequences"), "std::list", tx(t, "cppPerf_n5n", "Rarely the right answer; measure against a vector first.")],
        ]}
      />

      <H2>{tx(t, "cppPerf_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "cppPerf_try1", "Rebuild the AoS against SoA test on your machine for \"move y\" and \"move in 3D\". Then shrink Particle to 8 floats and measure again. How does the gap change, and why?")}</li>
        <li>{tx(t, "cppPerf_try2", "Shuffle the nodes of the std::list (insert the values in a random order, then sort the list) and time the sum again.")}</li>
        <li>{tx(t, "cppPerf_try3", "Compile sum_big with -O2 -S -masm=intel and find the cmov. Then add a function call inside the if and look for the jump that appears instead.")}</li>
        <li>{tx(t, "cppPerf_try4", "Print sizeof for struct { char a; double b; char c; } and the reordered version, then for a struct with a bool between two floats.")}</li>
      </ol>

      <KeyIdeas t={t} id="cppPerf" items={[
        "Measure optimised builds, repeat the runs, and use a profiler to find where the time goes.",
        "Main memory is about a hundred times slower than the L1 cache; most slow loops are waiting for memory.",
        "Caches move 64-byte lines, and the prefetcher rewards walking memory in order: vectors beat linked structures.",
        "Struct of arrays loads only the fields a loop uses; array of structs loads every field of every element.",
        "Unpredictable branches are costly, but the compiler often turns them into conditional moves: check before rewriting.",
        "Fewer, larger allocations win: reserve, arenas, and values instead of pointers.",
      ]} />
    </Article>
  );
}
