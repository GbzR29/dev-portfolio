"use client";

// C++ track — "Concepts & Constraints".

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export function ConceptsContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "cpp06_intro",
          "Before C++20, a template said nothing about what its type argument had to support. You found out by passing the wrong type and reading four hundred lines of instantiation backtrace. Concepts let you state the requirement up front, so the error points at the call site and says what is missing."
        )}
      </p>

      <H2>{tx(t, "cpp06_beforeTitle", "Before and after")}</H2>

      <CodeBlock lang="cpp" filename="before_after.cpp" t={t}>{`// C++17: the requirement is implicit, the error is a backtrace
template <typename T>
T maxOf(T a, T b) { return a < b ? b : a; }

// C++20: the requirement is part of the signature
template <std::totally_ordered T>
T maxOf(T a, T b) { return a < b ? b : a; }

// error: constraints not satisfied
//   note: 'Mesh' does not satisfy 'totally_ordered'
//   note: the required expression 'a < b' is invalid`}</CodeBlock>

      <H2>{tx(t, "cpp06_writingTitle", "Writing a concept")}</H2>

      <CodeBlock lang="cpp" filename="concepts.cpp" t={t}>{`template <typename T>
concept Drawable = requires(const T& obj, Renderer& r) {
    { obj.bounds() } -> std::convertible_to<AABB>;   // must exist, must convert
    { obj.draw(r) }  -> std::same_as<void>;
    typename T::VertexType;                          // must have this nested type
    requires std::is_move_constructible_v<T>;        // nested boolean requirement
};

template <typename T>
concept Numeric = std::integral<T> || std::floating_point<T>;

// Four equivalent ways to apply it
template <Drawable T> void render(const T&);
template <typename T> requires Drawable<T> void render2(const T&);
template <typename T> void render3(const T&) requires Drawable<T>;
void render4(const Drawable auto&);              // terse — usually the nicest`}</CodeBlock>

      <H2>{tx(t, "cpp06_stdTitle", "The standard concepts you will actually use")}</H2>
      <LessonTable
        headers={[tx(t, "cpp06_h0", "Concept"), tx(t, "cpp06_h1", "Requires")]}
        rows={[
          ["std::integral / std::floating_point", tx(t, "cpp06_r1", "An integer or floating-point type. Replaces most enable_if on arithmetic.")],
          ["std::same_as<T, U>",                  tx(t, "cpp06_r2", "Exactly the same type, both directions.")],
          ["std::convertible_to<From, To>",       tx(t, "cpp06_r3", "Implicit conversion is valid.")],
          ["std::derived_from<D, B>",             tx(t, "cpp06_r4", "Public, unambiguous inheritance.")],
          ["std::invocable<F, Args...>",          tx(t, "cpp06_r5", "Callable with those arguments. The right constraint for callbacks.")],
          ["std::ranges::range",                  tx(t, "cpp06_r6", "Has begin() and end(). Use this instead of taking a vector.")],
        ]}
      />

      <H2>{tx(t, "cpp06_overloadTitle", "Overloading on constraints")}</H2>
      <p>
        {tx(t, "cpp06_overloadBody",
          "When two overloads both match, the more constrained one wins — this is called subsumption, and it replaces the tag-dispatch and enable_if tricks used to pick a specialized implementation."
        )}
      </p>

      <CodeBlock lang="cpp" filename="subsumption.cpp" t={t}>{`template <std::input_iterator It>
void advanceBy(It& it, int n) { while (n--) ++it; }          // generic

template <std::random_access_iterator It>
void advanceBy(It& it, int n) { it += n; }                   // more constrained → wins

std::list<int>::iterator   li;  advanceBy(li, 5);   // picks the loop
std::vector<int>::iterator vi;  advanceBy(vi, 5);   // picks +=`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "cpp06_apiTip",
          "Concepts are documentation the compiler enforces. Even if you never overload on them, constraining a public template with a concept turns 'read the header comment and hope' into a checked contract — and shrinks the error message from pages to three lines."
        )}
      </Callout>

    </article>
  );
}
