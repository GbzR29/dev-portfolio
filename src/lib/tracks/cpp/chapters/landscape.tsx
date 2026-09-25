"use client";

// C++ track — "The Modern C++ Landscape".

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export function LandscapeContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "cpp01_intro",
          "C++ ships a new standard every three years. That cadence means the language you learned five years ago is not the language people write today. This track teaches the C++ that a graphics and game programmer actually writes in 2026: value semantics, RAII, compile-time computation, and the standard library that replaced most of the hand-rolled code of the 2000s."
        )}
      </p>

      <H2>{tx(t, "cpp01_trainTitle", "The three-year release train")}</H2>
      <p>
        {tx(t, "cpp01_trainBody",
          "Since C++11 the committee freezes features on a fixed schedule and ships whatever is ready. A standard being published is not the same as your compiler implementing it — the two are usually two to four years apart for the larger features."
        )}
      </p>

      <LessonTable
        headers={["Standard", "Published", "Headline features"]}
        rows={[
          ["C++11", "2011", tx(t, "cpp01_v11", "Move semantics, lambdas, auto, smart pointers, threads. The break with C++98.")],
          ["C++14", "2014", tx(t, "cpp01_v14", "Generic lambdas, return type deduction, variable templates. A bugfix release.")],
          ["C++17", "2017", tx(t, "cpp01_v17", "Structured bindings, if constexpr, optional / variant / string_view, filesystem.")],
          ["C++20", "2020", tx(t, "cpp01_v20", "Concepts, ranges, modules, coroutines, <format>, the spaceship operator, jthread.")],
          ["C++23", "2024", tx(t, "cpp01_v23", "import std, std::expected, std::print, mdspan, deducing this, flat_map, generator.")],
          ["C++26", "~2026", tx(t, "cpp01_v26", "Reflection, contracts, std::execution, std::simd, inplace_vector, pack indexing.")],
        ]}
      />

      <Callout type="info" t={t}>
        {tx(t, "cpp01_publishNote",
          "The published ISO documents are named after the year they were finalized, not the year in the standard's nickname. C++23 was published as ISO/IEC 14882:2024. C++26 was feature-frozen in 2025 and is heading for publication as ISO/IEC 14882:2026, so parts of it are already shipping behind compiler flags."
        )}
      </Callout>

      <H2>{tx(t, "cpp01_meaningTitle", "What 'modern C++' actually means")}</H2>
      <p>
        {tx(t, "cpp01_meaningBody",
          "Modern C++ is less a list of features than a set of defaults. Almost every rule below exists to move a category of bug from runtime to compile time, or to delete it entirely."
        )}
      </p>

      <ul className="space-y-3 ml-1">
        {[
          [tx(t, "cpp01_rule1t", "Own with types, not comments"), tx(t, "cpp01_rule1b", "Every resource has a destructor that releases it. No manual new/delete, no goto cleanup, no 'remember to call Destroy()'.")],
          [tx(t, "cpp01_rule2t", "Prefer values to indirection"), tx(t, "cpp01_rule2b", "Pass and return by value; let move semantics make it cheap. Pointers are for optional and non-owning, not for 'avoiding a copy'.")],
          [tx(t, "cpp01_rule3t", "Push work to compile time"), tx(t, "cpp01_rule3b", "constexpr, concepts and templates turn logic errors into compile errors and lookup tables into constants baked into the binary.")],
          [tx(t, "cpp01_rule4t", "Use the standard library"), tx(t, "cpp01_rule4b", "It is written by people who read the generated assembly. Hand-rolled containers are a performance decision you must justify with a profiler, not a default.")],
        ].map(([title, body], i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-md bg-[var(--primary)]/10 border border-[var(--primary)]/25 flex items-center justify-center font-mono text-[9px] font-bold text-[var(--primary)] mt-0.5">
              {i + 1}
            </span>
            <span>
              <strong className="text-[var(--text-main)] text-sm">{title}. </strong>
              {body}
            </span>
          </li>
        ))}
      </ul>

      <H2>{tx(t, "cpp01_helloTitle", "Hello, modern world")}</H2>
      <p>
        {tx(t, "cpp01_helloBody",
          "Two versions of the same program, twelve years apart. The C++23 one has no headers, no stream operators, and no manual formatting."
        )}
      </p>

      <CodeBlock lang="cpp" filename="hello_old.cpp" t={t}>{`// C++98 style — still compiles, still taught, still everywhere
#include <iostream>
#include <vector>
#include <string>

int main() {
    std::vector<std::string> names;
    names.push_back("vertex");
    names.push_back("fragment");

    for (size_t i = 0; i < names.size(); ++i) {
        std::cout << i << ": " << names[i] << std::endl;
    }
    return 0;
}`}</CodeBlock>

      <CodeBlock lang="cpp" filename="hello_modern.cpp" t={t}>{`// C++23 — import std replaces every #include of the standard library
import std;

int main() {
    std::vector<std::string> names{"vertex", "fragment"};

    for (auto [i, name] : std::views::enumerate(names)) {
        std::println("{}: {}", i, name);
    }
}`}</CodeBlock>

      <H2>{tx(t, "cpp01_flagsTitle", "Turning the standard on")}</H2>
      <p>
        {tx(t, "cpp01_flagsBody",
          "Compilers still default to an older standard. You must ask for the one you want, and you should ask for warnings while you are at it."
        )}
      </p>

      <CodeBlock lang="bash" filename="flags.sh" t={t}>{`# GCC / Clang
g++   -std=c++23 -Wall -Wextra -Wconversion -O2 main.cpp
clang++ -std=c++23 -Wall -Wextra -Wconversion -O2 main.cpp

# MSVC — /std:c++latest opts into in-progress C++26 features too
cl /std:c++23 /W4 /permissive- /EHsc main.cpp`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "cpp01_supportWarn",
          "Compiler support for the newest features is uneven and moves every few months. Before you build a design on reflection, contracts or modules, check the compiler support tables on cppreference for your exact toolchain version — 'C++26 is done' and 'my compiler does this' are very different statements."
        )}
      </Callout>

      <H2>{tx(t, "cpp01_nextTitle", "What comes next")}</H2>
      <p>
        {tx(t, "cpp01_nextBody",
          "The next chapter starts at the bottom: how a variable comes into existence. Initialization sounds trivial, but it is the single largest source of undefined behaviour in real C++ codebases, and C++26 changed the rules to make it diagnosable."
        )}
      </p>

    </article>
  );
}
