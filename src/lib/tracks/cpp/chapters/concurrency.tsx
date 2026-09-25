"use client";

// C++ track — "Concurrency & Threads".

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export function ConcurrencyContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "cpp12_intro",
          "A modern game runs on eight to sixteen cores and a rendering thread that must not stall. C++ gives you portable threads, but the interesting part is not starting a thread — it is the memory model that says when one thread is allowed to see another thread's writes."
        )}
      </p>

      <H2>{tx(t, "cpp12_jthreadTitle", "jthread — the one you should use")}</H2>

      <CodeBlock lang="cpp" filename="jthread.cpp" t={t}>{`// std::thread: you MUST join or detach before the destructor, or terminate() fires
std::thread t{work};
t.join();

// std::jthread (C++20): joins in its destructor and supports cooperative cancellation
std::jthread worker{[](std::stop_token stop) {
    while (!stop.stop_requested()) {
        processJob();
    }
}};
// destructor calls request_stop() then join() — no leak, no terminate`}</CodeBlock>

      <H2>{tx(t, "cpp12_syncTitle", "Synchronization primitives")}</H2>
      <LessonTable
        headers={[tx(t, "cpp12_h0", "Tool"), tx(t, "cpp12_h1", "Use for")]}
        rows={[
          ["std::scoped_lock",       tx(t, "cpp12_r1", "Locking one or more mutexes at once, deadlock-free. The default.")],
          ["std::shared_mutex",      tx(t, "cpp12_r2", "Many readers, one writer. Worth it only when reads dominate heavily.")],
          ["std::atomic<T>",         tx(t, "cpp12_r3", "A single value shared without a mutex — counters, flags, indices.")],
          ["std::latch / barrier",   tx(t, "cpp12_r4", "Wait for N tasks to finish. barrier is reusable per frame, latch is one-shot.")],
          ["std::counting_semaphore",tx(t, "cpp12_r5", "Bounding concurrent access to a limited resource.")],
          ["std::condition_variable",tx(t, "cpp12_r6", "A worker sleeping until there is a job. Always wait with a predicate.")],
        ]}
      />

      <CodeBlock lang="cpp" filename="jobsystem.cpp" t={t}>{`class JobSystem {
    std::vector<std::jthread>         workers;
    std::queue<std::function<void()>> jobs;
    std::mutex                        m;
    std::condition_variable_any       cv;

public:
    explicit JobSystem(unsigned n = std::thread::hardware_concurrency()) {
        for (unsigned i = 0; i < n; ++i)
            workers.emplace_back([this](std::stop_token stop) { run(stop); });
    }

    void submit(std::function<void()> job) {
        { std::scoped_lock lock{m}; jobs.push(std::move(job)); }
        cv.notify_one();
    }

private:
    void run(std::stop_token stop) {
        while (!stop.stop_requested()) {
            std::unique_lock lock{m};
            cv.wait(lock, stop, [this] { return !jobs.empty(); });
            if (jobs.empty()) return;
            auto job = std::move(jobs.front());
            jobs.pop();
            lock.unlock();
            job();
        }
    }
};`}</CodeBlock>

      <H2>{tx(t, "cpp12_atomicTitle", "Atomics and memory order")}</H2>
      <p>
        {tx(t, "cpp12_atomicBody",
          "An atomic operation is indivisible, but it also constrains how the compiler and CPU may reorder the operations around it. The default, seq_cst, is the strongest and slowest; relaxed gives you atomicity with no ordering guarantee at all."
        )}
      </p>

      <CodeBlock lang="cpp" filename="atomics.cpp" t={t}>{`std::atomic<int>  frameCounter{0};
std::atomic<bool> ready{false};

frameCounter.fetch_add(1, std::memory_order_relaxed);   // just a counter, no ordering

// Release/acquire: everything written before the release is visible after the acquire
data = buildFrame();                                    // plain write
ready.store(true, std::memory_order_release);           // publish

if (ready.load(std::memory_order_acquire))              // consume
    use(data);                                          // guaranteed to see buildFrame()`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "cpp12_relaxedWarn",
          "Use the default memory_order_seq_cst until a profiler proves it is your bottleneck. Relaxed and acquire/release code that looks obviously correct is regularly wrong in ways that only appear on a different CPU architecture, months later, in a customer's crash log. Verify with ThreadSanitizer, not by reading."
        )}
      </Callout>

      <H2>{tx(t, "cpp12_sharingTitle", "False sharing")}</H2>

      <CodeBlock lang="cpp" filename="false_sharing.cpp" t={t}>{`// Two counters on the same cache line: every write by thread A invalidates
// thread B's cache line. Correct, and catastrophically slow.
struct Bad  { std::atomic<int> a; std::atomic<int> b; };

struct Good {
    alignas(std::hardware_destructive_interference_size) std::atomic<int> a;
    alignas(std::hardware_destructive_interference_size) std::atomic<int> b;
};`}</CodeBlock>

      <H2>{tx(t, "cpp12_execTitle", "std::execution (C++26)")}</H2>
      <p>
        {tx(t, "cpp12_execBody",
          "C++26 standardizes senders and receivers: a composable model for asynchronous work where you describe a graph of operations and then run it on a chosen scheduler — a thread pool, a GPU stream, an event loop. It is the foundation the standard needed before it could offer real async algorithms."
        )}
      </p>

      <CodeBlock lang="cpp" filename="senders.cpp" t={t}>{`namespace ex = std::execution;

ex::scheduler auto sched = pool.get_scheduler();

// Describe the work — nothing runs yet
ex::sender auto work =
      ex::schedule(sched)
    | ex::then([]      { return loadMesh("bunny.obj"); })
    | ex::then([](Mesh m) { return buildBVH(std::move(m)); });

// Then run it
auto [bvh] = std::this_thread::sync_wait(std::move(work)).value();`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "cpp12_execNote",
          "std::execution is large and brand new. Reference implementations exist (stdexec is the one most people use today) but standard library support is still landing. Learn the model now — sender, scheduler, receiver — because the async story in C++ is going to be built on it for the next decade."
        )}
      </Callout>

    </article>
  );
}
