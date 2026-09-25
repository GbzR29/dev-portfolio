"use client";

// C++ track — "Ranges & Views".

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export function RangesContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "cpp08_intro",
          "The C++98 algorithms took two iterators, which meant every call started with begin() and end() and no two calls could be chained. Ranges take the container itself and compose with the pipe operator, so a five-line loop becomes one readable expression that still compiles down to a loop."
        )}
      </p>

      <H2>{tx(t, "cpp08_algosTitle", "Range algorithms")}</H2>

      <CodeBlock lang="cpp" filename="ranges_algos.cpp" t={t}>{`std::vector<Entity> entities = loadScene();

std::ranges::sort(entities, {}, &Entity::depth);   // sort by a member — no lambda
auto it = std::ranges::find(entities, 42, &Entity::id);
bool any = std::ranges::any_of(entities, &Entity::visible);

// The third parameter is a "projection": what to look at for each element.
// It replaces the comparator lambda you used to write by hand.`}</CodeBlock>

      <H2>{tx(t, "cpp08_viewsTitle", "Views are lazy pipelines")}</H2>
      <p>
        {tx(t, "cpp08_viewsBody",
          "A view does not own or copy anything and does no work until you iterate it. Chaining ten views still walks the source exactly once."
        )}
      </p>

      <CodeBlock lang="cpp" filename="views.cpp" t={t}>{`namespace rv = std::views;

// The imperative version
std::vector<std::string> names;
for (const auto& e : entities) {
    if (!e.visible) continue;
    if (e.distance > 100.0f) continue;
    names.push_back(e.name);
    if (names.size() == 10) break;
}

// The same thing as a pipeline
auto visible = entities
    | rv::filter([](const Entity& e) { return e.visible; })
    | rv::filter([](const Entity& e) { return e.distance <= 100.0f; })
    | rv::transform(&Entity::name)
    | rv::take(10);

for (const auto& name : visible) { /* nothing has been evaluated until here */ }

// C++23: materialize a view back into a container
auto names2 = visible | std::ranges::to<std::vector>();`}</CodeBlock>

      <H2>{tx(t, "cpp08_catalogTitle", "The views worth memorizing")}</H2>
      <LessonTable
        headers={[tx(t, "cpp08_h0", "View"), tx(t, "cpp08_h1", "Does"), tx(t, "cpp08_h2", "Since")]}
        rows={[
          ["filter / transform", tx(t, "cpp08_r1", "Keep matching elements / map each element."), "C++20"],
          ["take / drop",        tx(t, "cpp08_r2", "First N / everything after the first N."), "C++20"],
          ["reverse",            tx(t, "cpp08_r3", "Iterate backwards without a reverse iterator."), "C++20"],
          ["iota",               tx(t, "cpp08_r4", "A lazy sequence of numbers — replaces the index for-loop."), "C++20"],
          ["enumerate",          tx(t, "cpp08_r5", "Yields (index, element) pairs. What everyone wanted from day one."), "C++23"],
          ["zip",                tx(t, "cpp08_r6", "Walks several ranges in lockstep as tuples."), "C++23"],
          ["chunk / slide",      tx(t, "cpp08_r7", "Fixed-size blocks / sliding window. Great for mesh triangles."), "C++23"],
          ["join_with",          tx(t, "cpp08_r8", "Flattens a range of ranges with a separator."), "C++23"],
        ]}
      />

      <CodeBlock lang="cpp" filename="views23.cpp" t={t}>{`// enumerate — index and value together
for (auto [i, v] : std::views::enumerate(vertices))
    std::println("v{} = {}", i, v);

// zip — parallel arrays, walked safely to the shorter length
for (auto [pos, vel] : std::views::zip(positions, velocities))
    pos += vel * dt;

// chunk — treat a flat float buffer as triangles
for (auto tri : mesh.indices | std::views::chunk(3))
    drawTriangle(tri[0], tri[1], tri[2]);`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "cpp08_dangleWarn",
          "A view refers to its source. If the source is a temporary, the view dangles — auto v = getVector() | views::filter(f); is a use-after-free waiting to happen. The library catches many of these cases at compile time through borrowed_range, but not all of them. Keep the owning container alive for as long as the view."
        )}
      </Callout>

      <Callout type="tip" t={t}>
        {tx(t, "cpp08_perfTip",
          "Views optimize well at -O2 but are dramatically slower in unoptimized debug builds, because every stage is a separate iterator adaptor that the inliner has not collapsed yet. If your debug frame rate matters, keep the innermost per-frame loops plain and use views for setup and tooling code."
        )}
      </Callout>

    </article>
  );
}
