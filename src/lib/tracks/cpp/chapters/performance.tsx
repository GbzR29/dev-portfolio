"use client";

// C++ track — "Performance & Data-Oriented Design".

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export function PerformanceContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "cpp13_intro",
          "At 60 frames per second you have 16.6 milliseconds for everything. On modern hardware the limiting factor is almost never arithmetic — it is waiting for memory. A cache miss costs a few hundred cycles, enough time to have done a hundred multiplications. Data-oriented design is the practice of laying out data so those misses do not happen."
        )}
      </p>

      <H2>{tx(t, "cpp13_cacheTitle", "The numbers that drive every decision")}</H2>
      <LessonTable
        headers={[tx(t, "cpp13_h0", "Access"), tx(t, "cpp13_h1", "Approximate cost"), tx(t, "cpp13_h2", "In perspective")]}
        rows={[
          ["L1 cache",   "~4 cycles",    tx(t, "cpp13_r1", "Effectively free")],
          ["L2 cache",   "~14 cycles",   tx(t, "cpp13_r2", "Noticeable in a tight loop")],
          ["L3 cache",   "~50 cycles",   tx(t, "cpp13_r3", "You are now memory-bound")],
          ["Main RAM",   "~200+ cycles", tx(t, "cpp13_r4", "A hundred wasted multiplies")],
          [tx(t, "cpp13_r5k", "Cache line"), "64 bytes", tx(t, "cpp13_r5", "You always pay for 64 bytes, even reading one")],
        ]}
      />

      <H2>{tx(t, "cpp13_soaTitle", "Array of structs vs struct of arrays")}</H2>
      <p>
        {tx(t, "cpp13_soaBody",
          "This is the single highest-leverage change in most particle, physics and ECS code. If a loop touches two fields out of a fat struct, an AoS layout drags the other sixty bytes through cache for nothing."
        )}
      </p>

      <CodeBlock lang="cpp" filename="aos_soa.cpp" t={t}>{`// AoS — 64 bytes per particle, but the update loop only reads 24 of them
struct Particle {
    glm::vec3 position;   // 12
    glm::vec3 velocity;   // 12
    glm::vec4 color;      // 16
    float     lifetime;   //  4
    Texture*  texture;    //  8  ← pointer chasing in the middle of your hot data
};
std::vector<Particle> particles;

for (auto& p : particles)
    p.position += p.velocity * dt;      // ~62% of every cache line wasted

// SoA — the update loop reads two arrays back to back, fully sequential
struct ParticleSystem {
    std::vector<glm::vec3> positions;
    std::vector<glm::vec3> velocities;
    std::vector<glm::vec4> colors;
    std::vector<float>     lifetimes;
};

for (auto [pos, vel] : std::views::zip(ps.positions, ps.velocities))
    pos += vel * dt;                    // every byte loaded is used, and it vectorizes`}</CodeBlock>

      <H2>{tx(t, "cpp13_allocTitle", "Allocation is the other half")}</H2>

      <CodeBlock lang="cpp" filename="alloc.cpp" t={t}>{`// Bad — reallocates and copies log2(N) times while filling
std::vector<Vertex> v;
for (const auto& x : source) v.push_back(transform(x));

// Good — one allocation
std::vector<Vertex> v;
v.reserve(source.size());
for (const auto& x : source) v.emplace_back(transform(x));

// Better — reuse the buffer across frames; clear() keeps the capacity
struct FrameData { std::vector<DrawCall> calls; };
void beginFrame(FrameData& f) { f.calls.clear(); }   // no free, no realloc

// C++17 polymorphic allocators: a bump arena reset once per frame
std::array<std::byte, 1 << 20> buffer;
std::pmr::monotonic_buffer_resource arena{buffer.data(), buffer.size()};
std::pmr::vector<DrawCall> calls{&arena};            // allocation is a pointer bump`}</CodeBlock>

      <H2>{tx(t, "cpp13_containersTitle", "Newer containers worth knowing")}</H2>
      <LessonTable
        headers={[tx(t, "cpp13_ch0", "Container"), tx(t, "cpp13_ch1", "What it gives you"), tx(t, "cpp13_ch2", "Since")]}
        rows={[
          ["std::flat_map / flat_set", tx(t, "cpp13_c1", "Map semantics over two sorted vectors. Far better cache behaviour than a red-black tree for lookups; slow inserts."), "C++23"],
          ["std::inplace_vector",      tx(t, "cpp13_c2", "A vector with a fixed capacity stored inline. No heap allocation at all — ideal for per-frame buffers."), "C++26"],
          ["std::hive",                tx(t, "cpp13_c3", "Bucketed storage with stable references and O(1) erase. Built for entities that are created and destroyed constantly."), "C++26"],
          ["std::mdspan",              tx(t, "cpp13_c4", "A multidimensional non-owning view over a flat buffer. Textures and voxel grids without index arithmetic."), "C++23"],
          ["std::simd",                tx(t, "cpp13_c5", "Portable explicit vectorization. Write it once, get SSE / AVX / NEON."), "C++26"],
        ]}
      />

      <CodeBlock lang="cpp" filename="new_containers.cpp" t={t}>{`// inplace_vector — a bounded stack buffer with vector's interface
std::inplace_vector<Light, 8> visibleLights;      // capacity 8, zero allocations
if (visibleLights.try_push_back(light)) { /* fits */ }

// mdspan — treat a flat float buffer as a 2D image
std::vector<float> pixels(width * height);
std::mdspan image{pixels.data(), height, width};
image[y, x] = 1.0f;                                // C++23 multidim subscript`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "cpp13_measureWarn",
          "Every claim on this page is a hypothesis until you measure it on your data. Compilers vectorize, prefetch and elide aggressively at -O2, and modern branch predictors are extremely good. Profile first, change one thing, profile again — and never benchmark a debug build, where the standard library is full of iterator checks that do not exist in release."
        )}
      </Callout>

      <Callout type="tip" t={t}>
        {tx(t, "cpp13_toolsTip",
          "The tools that pay for themselves: perf or VTune for where the time goes, Compiler Explorer for what the compiler actually emitted, cachegrind for miss rates, and Tracy for a frame-by-frame timeline of a running game."
        )}
      </Callout>

    </article>
  );
}
