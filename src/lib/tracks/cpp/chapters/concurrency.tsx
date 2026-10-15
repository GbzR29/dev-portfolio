"use client";

// Systems & Performance 2: concurrency. Starts from a game that loads its
// textures on one core while the others sit idle; then threads and join,
// jthread and stop tokens, the data race on a shared counter with measured
// numbers (figure: the reader schedules two threads instruction by
// instruction with int, mutex and atomic), mutexes and lock_guard, deadlock
// and scoped_lock, atomics and memory order (release/acquire), false sharing
// with measured numbers, async and futures, how many threads, and what
// C++26's std::execution adds.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { InterleaveFigure } from "@/components/lesson/figures/cpp/InterleaveFigure";

export function ConcurrencyContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "cppThr_intro",
          "The loading screen shows a bar that crawls. Behind it, the game reads two hundred textures from disk and decodes them, one after another, on one core of a processor that has twelve. The other eleven are idle. Putting them to work is the promise of threads, and it is real: four textures that take 50 ms each load in about 57 ms instead of 200. But threads also bring the hardest bugs in programming, the ones that appear one run in a thousand and vanish the moment you add a print. This chapter is about getting the speed without those bugs.")}
      </Lead>

      <Goals t={t} id="cppThr" items={[
        "Start threads with std::jthread and stop them cleanly.",
        "Explain why two threads incrementing one int lose updates, at the level of machine instructions.",
        "Protect shared data with a mutex or an atomic, and avoid deadlock.",
        "Recognise false sharing and measure before parallelising.",
      ]} />

      <H2>{tx(t, "cppThr_threadTitle", "A thread is a second line of execution")}</H2>
      <CodeBlock lang="cpp" filename="threads.cpp" t={t}>{`#include <thread>

std::vector<std::jthread> workers;
for (std::string name : {"stone", "grass", "water", "sand"})
    workers.emplace_back([name] { std::println("{}", load_texture(name)); });
workers.clear();                       // each jthread joins in its destructor
std::println("all loaded");`}</CodeBlock>
      <p>
        {tx(t, "cppThr_threadBody",
          "A thread runs a function alongside the rest of the program, with its own stack but sharing all the program's memory. The operating system decides which thread runs on which core and when, and switches between them many times per second. That is why the four lines appear in a different order on every run: this machine printed water, sand, stone, grass. Joining a thread means waiting for it to finish. std::jthread (C++20) joins automatically in its destructor; the older std::thread calls std::terminate if it is destroyed without join() or detach(), which is an easy way to crash.")}
      </p>
      <LessonTable
        headers={[tx(t, "cppThr_hPart", "Part"), tx(t, "cppThr_hMeans", "What it means")]}
        rows={[
          ["std::jthread w{f}", tx(t, "cppThr_t1", "Starts a new thread that runs f().")],
          ["[name] { … }", tx(t, "cppThr_t2", "The lambda captures name by value, so each thread has its own copy (the Lambdas chapter). Capturing it by reference would let every thread read a loop variable that keeps changing.")],
          ["workers.clear()", tx(t, "cppThr_t3", "Destroys the jthreads; each destructor waits for its thread to finish.")],
          ["std::thread::hardware_concurrency()", tx(t, "cppThr_t4", "How many threads the hardware runs at once: 12 on this machine (6 cores, 2 threads each).")],
        ]}
      />
      <CodeBlock lang="cpp" filename="stop.cpp" t={t}>{`std::jthread ticker{[](std::stop_token st) {
    while (!st.stop_requested()) {     // polite question, asked every loop
        autosave_if_needed();
        std::this_thread::sleep_for(10ms);
    }
}};
// ... later
ticker.request_stop();                 // the destructor also does this before joining`}</CodeBlock>
      <p>
        {tx(t, "cppThr_stopBody",
          "A thread cannot be killed safely from outside: it might be holding a lock or halfway through writing a file. Instead you ask it to stop. If the jthread's function takes a std::stop_token, the jthread passes one in, and request_stop() makes stop_requested() return true. The thread checks it at points where stopping is safe.")}
      </p>

      <H2>{tx(t, "cppThr_raceTitle", "Two threads, one counter")}</H2>
      <CodeBlock lang="cpp" filename="race.cpp" t={t}>{`int counter = 0;

void work() { for (int i = 0; i < 1'000'000; ++i) ++counter; }

std::jthread a{work}, b{work};
// after both finish: 2,000,000? `}</CodeBlock>
      <p>
        {tx(t, "cppThr_raceBody",
          "Compiled with -O0 on this machine, three runs printed 1,134,342, then 1,103,592, then 1,101,869: almost half of the increments vanished. ++counter looks like one operation, but the processor does it in three: copy counter into a register, add 1 in the register, write the register back. If the other thread runs between the copy and the write-back, both threads read the same old value and both write the same new one. Be the scheduler below and make it happen.")}
      </p>
      <InterleaveFigure t={t} />
      <p>
        {tx(t, "cppThr_raceAfter",
          "Two threads touching the same memory, at least one of them writing, with nothing ordering the accesses, is a data race, and a data race is undefined behaviour in C++, not just a wrong number. Compiled with -O2, the same program printed 2,000,000 every time: the optimiser turned each loop into a single counter += 1000000, which made the window tiny. The bug did not go away; it only became rare, which is worse. ThreadSanitizer (the Tooling chapter) finds it every time.")}
      </p>

      <H2>{tx(t, "cppThr_mutexTitle", "Mutexes: one thread at a time")}</H2>
      <CodeBlock lang="cpp" filename="mutex.cpp" t={t}>{`#include <mutex>

int counter = 0;
std::mutex m;

void work() {
    for (int i = 0; i < 1'000'000; ++i) {
        std::lock_guard g{m};     // locks m; waits if another thread holds it
        ++counter;                // only one thread at a time gets here
    }                             // ~lock_guard unlocks m
}`}</CodeBlock>
      <p>
        {tx(t, "cppThr_mutexBody",
          "A mutex (mutual exclusion) is a lock that only one thread can hold. The code between lock and unlock is called a critical section, and while one thread is in it, every other thread that wants the same mutex waits. Never call lock() and unlock() by hand: an exception or an early return between them would leave the mutex locked forever. std::lock_guard is RAII for locks, exactly like unique_ptr for memory.")}
      </p>
      <LessonTable
        headers={[tx(t, "cppThr_hVersion", "Version (2 threads × 1,000,000, -O2)"), tx(t, "cppThr_hResult", "Result"), tx(t, "cppThr_hTime", "Time on this machine")]}
        rows={[
          ["int", tx(t, "cppThr_m1", "wrong at -O0, right by luck at -O2"), "0.2 ms"],
          ["std::atomic<int>", "2,000,000", "16 ms"],
          ["int + std::mutex", "2,000,000", "39 ms"],
        ]}
      />
      <p>
        {tx(t, "cppThr_costBody",
          "Correctness costs time, because the two cores now have to agree on who owns counter for every single increment. The lesson is not \"use atomics, they are faster\" but \"share less\": give each thread its own counter and add the totals once at the end, and the threads do not need to talk at all.")}
      </p>

      <H3>{tx(t, "cppThr_deadTitle", "Deadlock, and scoped_lock")}</H3>
      <CodeBlock lang="cpp" filename="transfer.cpp" t={t}>{`struct Account { std::mutex m; int balance = 100; };

void transfer(Account& from, Account& to, int amount) {
    std::scoped_lock lock{from.m, to.m};    // locks both, without deadlock
    from.balance -= amount;
    to.balance += amount;
}

// thread 1: transfer(a, b, 1);   thread 2: transfer(b, a, 1);`}</CodeBlock>
      <p>
        {tx(t, "cppThr_deadBody",
          "If transfer locked from.m and then to.m with two lock_guards, thread 1 could lock a.m while thread 2 locks b.m, and then each would wait forever for the mutex the other holds: a deadlock. The program does not crash; it simply stops. std::scoped_lock (C++17) locks several mutexes with an algorithm that avoids this, whatever order they are passed in. The general rule, when you cannot use it, is to always lock mutexes in the same global order.")}
      </p>

      <H2>{tx(t, "cppThr_atomicTitle", "Atomics")}</H2>
      <CodeBlock lang="cpp" filename="atomic.cpp" t={t}>{`#include <atomic>

std::atomic<int> counter{0};
counter.fetch_add(1);              // one indivisible read-add-write: lock add [counter], 1
int now = counter.load();          // a read that never sees half a write
counter.store(0);`}</CodeBlock>
      <p>
        {tx(t, "cppThr_atomicBody",
          "An atomic variable is one whose operations cannot be interrupted halfway: no other thread can see or slip in between the read and the write of fetch_add. On x86-64 g++ turns it into one instruction with a lock prefix, which tells the processor to hold that cache line for the whole operation. Atomics suit single values: counters, flags, an index. For several values that must change together, such as two balances, use a mutex.")}
      </p>
      <H3>{tx(t, "cppThr_orderTitle", "Memory order: publishing data to another thread")}</H3>
      <CodeBlock lang="cpp" filename="publish.cpp" t={t}>{`int payload = 0;                         // plain data
std::atomic<bool> ready{false};          // the flag that publishes it

// producer thread
payload = 42;
ready.store(true, std::memory_order_release);    // everything above is published

// consumer thread
while (!ready.load(std::memory_order_acquire)) {}   // wait for the flag
std::println("{}", payload);                     // guaranteed to see 42`}</CodeBlock>
      <p>
        {tx(t, "cppThr_orderBody",
          "Compilers and processors reorder memory operations when no single thread can tell the difference. Another thread can: without rules, the consumer could see ready == true and still read the old payload. A release store and an acquire load that reads its value form a pair: everything the producer wrote before the release is visible to the consumer after the acquire. The default, memory_order_seq_cst, gives this and more, and is the right choice until a profiler says otherwise. memory_order_relaxed only promises that the atomic itself is not torn, which is enough for a statistics counter and nothing else.")}
      </p>

      <H2>{tx(t, "cppThr_fsTitle", "False sharing")}</H2>
      <CodeBlock lang="cpp" filename="false_sharing.cpp" t={t}>{`struct Counters {                         // 8 bytes: a and b share one 64-byte cache line
    std::atomic<long> a{0}, b{0};
};

struct PaddedCounters {                   // 128 bytes: one cache line each
    alignas(64) std::atomic<long> a{0};
    alignas(64) std::atomic<long> b{0};
};
// thread 1 increments a, thread 2 increments b, 20,000,000 times each`}</CodeBlock>
      <p>
        {tx(t, "cppThr_fsBody",
          "The two threads never touch the same variable, so there is no race. Yet on this machine the first struct took 356 ms and the padded one 32 ms, eleven times faster. Caches move memory in blocks of 64 bytes called cache lines (the Performance chapter). When a and b live in one line, every write by one core takes the whole line away from the other core, and they spend their time passing it back and forth. alignas(64) puts each counter at the start of its own line. std::hardware_destructive_interference_size names that distance portably; it is 64 here.")}
      </p>

      <H2>{tx(t, "cppThr_asyncTitle", "Tasks with a result: async and future")}</H2>
      <CodeBlock lang="cpp" filename="async.cpp" t={t}>{`#include <future>

std::future<std::string> f = std::async(std::launch::async, load_texture, "lava");
do_other_work();
std::string result = f.get();     // waits if it is not ready; rethrows its exception`}</CodeBlock>
      <p>
        {tx(t, "cppThr_asyncBody",
          "std::async runs a function on another thread and hands back a std::future, a ticket for the result. get() waits for it and returns it once; if the function threw, get() throws the same exception in the caller's thread. std::launch::async forces a new thread; without it, the library may decide to run the function lazily inside get(). Engines usually go one step further and keep a thread pool: a fixed set of worker threads, created once, that take small jobs from a queue, so no thread is created per task.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "cppThr_execNote",
          "C++26 adds std::execution, a standard way to describe chains of asynchronous work (senders) and where they run (schedulers), meant to become the common language of thread pools, GPU queues and network libraries. Library support is still arriving in 2026; until it does, NVIDIA's stdexec library implements it.")}
      </Callout>

      <H2>{tx(t, "cppThr_rulesTitle", "Rules that prevent most bugs")}</H2>
      <LessonTable
        headers={[tx(t, "cppThr_hRule", "Rule"), tx(t, "cppThr_hWhy", "Why")]}
        rows={[
          [tx(t, "cppThr_r1", "Share as little as possible: give each thread its own data and combine at the end."), tx(t, "cppThr_r1w", "Nothing shared means nothing to race on and nothing to wait for.")],
          [tx(t, "cppThr_r2", "Shared and changing means a mutex or an atomic, always."), tx(t, "cppThr_r2w", "\"It is only a bool\" is still a data race, and still undefined behaviour.")],
          [tx(t, "cppThr_r3", "Lock with RAII: lock_guard, scoped_lock, unique_lock."), tx(t, "cppThr_r3w", "An exception or an early return cannot leave a mutex locked.")],
          [tx(t, "cppThr_r4", "Keep critical sections short; never call unknown code while holding a lock."), tx(t, "cppThr_r4w", "Unknown code may try to take the same lock: a deadlock with yourself.")],
          [tx(t, "cppThr_r5", "Measure before and after, and run the tests under ThreadSanitizer."), tx(t, "cppThr_r5w", "Threads often make code slower, and race bugs hide in normal runs.")],
        ]}
      />

      <H2>{tx(t, "cppThr_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "cppThr_try1", "Run the counter race at -O0 five times and write down the results. Then make counter a std::atomic<int> and run it again.")}</li>
        <li>{tx(t, "cppThr_try2", "Sum the numbers 1 to 100,000,000 with 1, 2, 4 and 8 jthreads, each summing its own slice into its own variable. Print the times: where does adding threads stop helping?")}</li>
        <li>{tx(t, "cppThr_try3", "Write transfer with two lock_guards, locking from.m then to.m, and run the two opposite transfer loops. How long until it freezes? Then switch to scoped_lock.")}</li>
        <li>{tx(t, "cppThr_try4", "Measure the false-sharing pair on your machine, then try alignas(32) and alignas(128). Explain the results with the cache-line size.")}</li>
      </ol>

      <KeyIdeas t={t} id="cppThr" items={[
        "A thread shares all memory with the others; the operating system decides when each one runs, so order between threads is never guaranteed.",
        "std::jthread joins in its destructor and can be asked to stop with a stop_token.",
        "++counter is load, add, store; two unsynchronised threads lose updates, and a data race is undefined behaviour.",
        "A mutex lets one thread at a time into a critical section; lock it with RAII and lock several with scoped_lock.",
        "Atomics make one variable's operations indivisible; release/acquire publishes the data written before the store.",
        "False sharing makes independent variables slow when they share a 64-byte cache line; share less and measure.",
      ]} />
    </Article>
  );
}
