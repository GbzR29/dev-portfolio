"use client";

// "Architecture & Patterns": the object pool, free lists, generational
// handles and dense storage.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "../../opengl/chapters/lighting-advanced";
import { PoolFigure } from "@/components/lesson/figures/gamedev/PoolFigure";

const r = String.raw;

export function ObjectPoolContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "gdPool_intro",
          "Bullets, sparks, damage numbers, footstep decals, enemies in a horde mode: games create and destroy huge numbers of short-lived objects. An object pool keeps a fixed set of them alive for the whole level and recycles them, so creating a bullet becomes \"take one from the shelf\" and destroying it becomes \"put it back\". It is one of the most common patterns in game code, and building it well (O(1) operations, safe references, no stale state) teaches a lot about memory.")}
      </Lead>

      <H2>{tx(t, "gdPool_costTitle", "What creating an object costs")}</H2>
      <p>
        {tx(t, "gdPool_costBody",
          "new in C++ (or malloc in C) asks a general-purpose allocator for memory. The allocator has to find a free block of the right size, record that it is in use, and possibly ask the operating system for more memory; a later delete has to put the block back and maybe merge it with its neighbours. The common case is fast, tens of nanoseconds, but the worst case is not, and it is unpredictable: a frame that happens to need a system call or a lock held by another thread pays for it. Three other costs are often bigger than the call itself:")}
      </p>
      <LessonTable
        headers={[tx(t, "gdPool_tCost", "Cost"), tx(t, "gdPool_tWhy", "Why it hurts games")]}
        rows={[
          [tx(t, "gdPool_c1", "Garbage collection"), tx(t, "gdPool_c1b", "in C#, Java or JavaScript, every discarded object is work for the garbage collector, which runs at a moment of its choosing and can take several milliseconds: a visible hitch in a 16.7 ms frame. This is the main reason Unity games pool aggressively")],
          [tx(t, "gdPool_c2", "Fragmentation"), tx(t, "gdPool_c2b", "after hours of allocating and freeing objects of different sizes, free memory is scattered in small holes; a large allocation can fail even though enough memory is free in total. Consoles, with fixed memory and no swap, feel this most")],
          [tx(t, "gdPool_c3", "Cache misses"), tx(t, "gdPool_c3b", "objects allocated one by one end up scattered across the heap. Updating all bullets then jumps around memory, and each jump can cost a trip to main memory (~100 ns) instead of a cache hit (~1 ns)")],
          [tx(t, "gdPool_c4", "Construction"), tx(t, "gdPool_c4b", "some objects are expensive to set up: loading a mesh, creating a physics body, registering with systems. A pool pays this once")],
        ]}
      />

      <H2>{tx(t, "gdPool_patternTitle", "The pattern")}</H2>
      <p>
        {tx(t, "gdPool_patternBody",
          "Allocate an array of N objects when the level loads. Each object has a flag saying whether it is in use. To \"create\" a bullet, find an unused one, initialise its fields and mark it used. To \"destroy\" it, mark it unused. Nothing is ever allocated or freed while the game runs. The simplest version finds a free object by scanning the array.")}
      </p>
      <CodeBlock lang="cpp" filename="pool_naive.hpp" t={t}>{`struct Bullet { Vec2 pos, vel; float life; bool active = false; };

class BulletPool {
    std::array<Bullet, 256> bullets;              // allocated once, with the pool
public:
    Bullet* spawn(Vec2 pos, Vec2 vel) {
        for (Bullet& b : bullets)                  // O(N): walks until it finds a free one
            if (!b.active) { b = { pos, vel, 2.0f, true }; return &b; }
        return nullptr;                            // pool exhausted
    }
    void update(float dt) {
        for (Bullet& b : bullets) {
            if (!b.active) continue;
            b.pos  += b.vel * dt;
            b.life -= dt;
            if (b.life <= 0) b.active = false;     // "destroy": just flip the flag
        }
    }
};`}</CodeBlock>
      <p>
        {tx(t, "gdPool_naiveProblem",
          "Scanning is fine for a few dozen objects. With thousands, and a mostly-full pool, every spawn walks past most of the array. The classic fix is a free list.")}
      </p>

      <H2>{tx(t, "gdPool_freeTitle", "The free list")}</H2>
      <p>
        {tx(t, "gdPool_freeBody",
          "A free list is a linked list threaded through the unused objects themselves. The pool keeps the index of the first free slot (the head). Each free slot stores the index of the next free slot, in memory that it does not need while it is unused. Taking a slot pops the head: the slot the head points to is returned, and the head moves to that slot's \"next\". Returning a slot pushes it: its \"next\" becomes the old head, and the head becomes this slot. Both are two assignments, O(1), with no search. Returned slots are reused first (last in, first out), which is good for the cache: the most recently used memory is the most likely to still be in it.")}
      </p>

      <PoolFigure t={t} />

      <CodeBlock lang="cpp" filename="pool.hpp" t={t}>{`template <class T, size_t N>
class Pool {
    // A slot holds either a live object or, while free, the index of the next free slot.
    union Slot { T obj; int32_t nextFree; Slot() : nextFree(-1) {} ~Slot() {} };
    std::array<Slot, N> slots;
    std::array<bool, N> alive{};
    int32_t head = 0;                                 // first free slot, -1 when full

public:
    Pool() {
        for (size_t i = 0; i < N; ++i) slots[i].nextFree = (i + 1 < N) ? int32_t(i + 1) : -1;
    }
    template <class... Args>
    T* acquire(Args&&... args) {
        if (head < 0) return nullptr;                 // exhausted: caller decides what to do
        int32_t i = head;
        head = slots[i].nextFree;                     // pop the free list
        alive[i] = true;
        return new (&slots[i].obj) T(std::forward<Args>(args)...);   // construct in place
    }
    void release(T* p) {
        int32_t i = int32_t(reinterpret_cast<Slot*>(p) - slots.data());
        p->~T();                                      // run the destructor, keep the memory
        alive[i] = false;
        slots[i].nextFree = head;                     // push onto the free list
        head = i;
    }
};`}</CodeBlock>
      <p>
        {tx(t, "gdPool_unionBody",
          "The union lets the same bytes hold either a T or an int: a free slot does not need its T, so it can store its link there for free. \"Placement new\", new (&slot) T(...), constructs an object in memory that already exists instead of allocating, and calling the destructor explicitly tears it down without freeing. The pool never calls the real new or delete after it is built.")}
      </p>

      <H2>{tx(t, "gdPool_handleTitle", "Dangling references and generational handles")}</H2>
      <p>
        {tx(t, "gdPool_handleBody",
          "Pools create a sneaky bug. A homing missile stores a pointer to its target enemy. The enemy dies and its slot goes back to the pool; a moment later a new enemy is spawned into the same slot. The missile's pointer is still \"valid\" memory, so nothing crashes, but the missile now chases a different enemy. The fix is to hand out handles instead of pointers: the slot index plus a generation counter. Every time a slot is released, its generation goes up by one. Looking up a handle checks that the slot's current generation matches the handle's; if the slot has been recycled, the check fails and the lookup returns null.")}
      </p>
      <CodeBlock lang="cpp" filename="handle.hpp" t={t}>{`struct Handle { uint32_t index; uint32_t generation; };

// Inside the pool:
std::array<uint32_t, N> generation{};

Handle handleOf(int32_t i) const { return { uint32_t(i), generation[i] }; }

T* get(Handle h) {
    if (h.index >= N || !alive[h.index] || generation[h.index] != h.generation)
        return nullptr;                               // released (and maybe reused) since
    return &slots[h.index].obj;
}
// In release(): ++generation[i];   // invalidates every handle to the old object

// The missile:
if (Enemy* e = enemies.get(missile.target)) steerToward(e->pos);
else missile.target = findNewTarget();`}</CodeBlock>
      <Callout type="info" t={t}>
        {tx(t, "gdPool_handleNote", "Handles are also smaller than pointers (two 32-bit numbers, or both packed into one), they stay valid if the pool's array is moved or saved to disk, and they are the foundation of how entity-component systems (ECS) identify entities. A 32-bit generation wraps around only after four billion reuses of one slot.")}
      </Callout>

      <H2>{tx(t, "gdPool_sizeTitle", "How big should a pool be?")}</H2>
      <p>
        {tx(t, "gdPool_sizeBody",
          "On average the number of objects alive at once equals how fast they are created times how long each one lives. This is Little's law from queueing theory, and it applies to bullets as well as to customers in a shop.")}
      </p>
      <Equation label={tx(t, "gdPool_eqLittle", "Little's law")}
        where={[
          [r`L`, tx(t, "gdPool_wL", "the average number of objects alive at the same time")],
          [r`\lambda`, tx(t, "gdPool_wLambda", "the arrival rate: objects created per second (9 bullets per second)")],
          [r`W`, tx(t, "gdPool_wW", "the average lifetime of one object in seconds (1.4 s)")],
        ]}
        note={tx(t, "gdPool_eqLittleNote", "9 × 1.4 = 12.6 bullets alive on average, so a 12-slot pool will run dry, as in the figure. Size for the peak, not the average: several ships firing at once, a boss's bullet storm. Measure the high-water mark during playtests and add a margin.")}>
        {r`L = \lambda\,W`}
      </Equation>
      <LessonTable
        headers={[tx(t, "gdPool_tPolicy", "When empty…"), tx(t, "gdPool_tGood", "Good for"), tx(t, "gdPool_tBad", "Watch out")]}
        rows={[
          [tx(t, "gdPool_p1", "refuse (return null)"), tx(t, "gdPool_p1g", "cosmetic effects: nobody misses the 201st spark"), tx(t, "gdPool_p1b", "gameplay objects: a bullet that silently does not fire is a bug")],
          [tx(t, "gdPool_p2", "grow (allocate a bigger block)"), tx(t, "gdPool_p2g", "editors, tools, unknown peaks"), tx(t, "gdPool_p2b", "one allocation spike; moving objects invalidates pointers (handles survive); grow in chunks rather than reallocating the array")],
          [tx(t, "gdPool_p3", "recycle the oldest"), tx(t, "gdPool_p3g", "decals, corpses, shell casings"), tx(t, "gdPool_p3b", "something visible may vanish; needs a way to find the oldest (a ring buffer does it naturally)")],
        ]}
      />

      <H2>{tx(t, "gdPool_resetTitle", "Reset everything")}</H2>
      <p>
        {tx(t, "gdPool_resetBody",
          "A recycled object still holds the state of its previous life. Forgetting to reset one field produces some of the strangest bugs in games: an enemy that spawns already burning, a bullet that inherits the previous bullet's homing target, a particle that fades from the old one's alpha. Always initialise every field on acquire (constructing in place, as above, does this by design) and unregister the object from every system on release: physics, events, timers, audio.")}
      </p>

      <H2>{tx(t, "gdPool_denseTitle", "Iterating a pool: sparse vs dense")}</H2>
      <p>
        {tx(t, "gdPool_denseBody",
          "The update loop in the naive pool walks all N slots and skips the dead ones. With 10 bullets alive in a 1000-slot pool that is 990 wasted checks. The alternative is to keep live objects packed at the front of the array: to remove object i, move the last live object into slot i and shrink the count by one (\"swap and pop\"). Iteration then touches only live objects, contiguously, which is as cache-friendly as it gets. The price is that objects move, so outside code must refer to them through handles that go through an index table (a \"sparse set\"), which is exactly how most ECS libraries store components.")}
      </p>
      <CodeBlock lang="cpp" filename="dense.hpp" t={t}>{`std::vector<Bullet> live;        // only live bullets, contiguous

void remove(size_t i) {
    live[i] = live.back();        // move the last one into the hole
    live.pop_back();              // O(1), but order is not preserved
}
for (size_t i = 0; i < live.size(); ) {
    live[i].life -= dt;
    if (live[i].life <= 0) remove(i);   // do not advance i: slot i now holds a new bullet
    else ++i;
}`}</CodeBlock>

      <H3>{tx(t, "gdPool_whenNotTitle", "When not to pool")}</H3>
      <p>
        {tx(t, "gdPool_whenNotBody",
          "A pool holds its memory for as long as it exists, even when empty, and adds code that must be kept correct. Objects created a few times per level (a boss, a menu) do not need one. Measure first: in C++ with a decent allocator many games never need pools except for particles and projectiles, while in garbage-collected engines they pay off much sooner. Engines also ship them: Unity has UnityEngine.Pool.ObjectPool<T> since 2021, and most particle systems pool internally.")}
      </p>

      <KeyIdeas t={t} id="gdPool" items={[
        "A pool allocates N objects once and recycles them: no allocation or GC during play.",
        "A free list threads free slots together through their own memory: acquire and release are O(1).",
        "Hand out handles (index + generation), not pointers, so recycled slots are detected.",
        "Size for the peak: alive ≈ creation rate × lifetime (Little's law), plus a margin.",
        "Reset every field on acquire; unregister from every system on release.",
      ]} />
    </Article>
  );
}
