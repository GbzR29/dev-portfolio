"use client";

// C++ track — "Tooling, Build & Sanitizers".

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export function ToolingContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "cpp15_intro",
          "C++ has no official build system, package manager or formatter, which means the ecosystem chose several of each. This chapter is the setup that a new project in 2026 should start from — modern CMake, a package manager, sanitizers on by default in debug, and a linter in CI."
        )}
      </p>

      <H2>{tx(t, "cpp15_cmakeTitle", "Target-based CMake")}</H2>
      <p>
        {tx(t, "cpp15_cmakeBody",
          "The rule that separates modern CMake from the old style: never set a global variable. Attach everything to a target, and mark each property PUBLIC if consumers need it or PRIVATE if it stops at this target."
        )}
      </p>

      <CodeBlock lang="cmake" filename="CMakeLists.txt" t={t}>{`cmake_minimum_required(VERSION 3.28)
project(Engine LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)          # -std=c++23, not -std=gnu++23
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)  # clangd / clang-tidy need this

add_library(engine_core)
target_sources(engine_core PRIVATE src/renderer.cpp src/scene.cpp)
target_include_directories(engine_core PUBLIC include)
target_compile_features(engine_core PUBLIC cxx_std_23)

target_compile_options(engine_core PRIVATE
    $<$<CXX_COMPILER_ID:GNU,Clang>:-Wall -Wextra -Wconversion -Wshadow>
    $<$<CXX_COMPILER_ID:MSVC>:/W4 /permissive->)

find_package(SDL3 REQUIRED)
target_link_libraries(engine_core PUBLIC SDL3::SDL3)

add_executable(game src/main.cpp)
target_link_libraries(game PRIVATE engine_core)`}</CodeBlock>

      <H2>{tx(t, "cpp15_presetsTitle", "Presets kill the wall of flags")}</H2>

      <CodeBlock lang="cpp" filename="CMakePresets.json" t={t}>{`{
  "version": 6,
  "configurePresets": [
    {
      "name": "debug",
      "generator": "Ninja",
      "binaryDir": "build/debug",
      "cacheVariables": {
        "CMAKE_BUILD_TYPE": "Debug",
        "CMAKE_CXX_FLAGS": "-fsanitize=address,undefined -fno-omit-frame-pointer"
      }
    },
    {
      "name": "release",
      "generator": "Ninja",
      "binaryDir": "build/release",
      "cacheVariables": { "CMAKE_BUILD_TYPE": "RelWithDebInfo" }
    }
  ]
}

// cmake --preset debug && cmake --build build/debug`}</CodeBlock>

      <H2>{tx(t, "cpp15_sanitizersTitle", "Sanitizers find what code review does not")}</H2>
      <LessonTable
        headers={[tx(t, "cpp15_h0", "Sanitizer"), tx(t, "cpp15_h1", "Catches"), tx(t, "cpp15_h2", "Slowdown")]}
        rows={[
          ["-fsanitize=address",   tx(t, "cpp15_r1", "Use-after-free, buffer overflow, leaks, double free."), "~2x"],
          ["-fsanitize=undefined", tx(t, "cpp15_r2", "Signed overflow, bad shifts, misaligned access, null deref."), "~1.2x"],
          ["-fsanitize=thread",    tx(t, "cpp15_r3", "Data races. The only practical way to find them."), "~5-15x"],
          ["_GLIBCXX_ASSERTIONS",  tx(t, "cpp15_r4", "Bounds checks inside libstdc++ containers and iterators."), tx(t, "cpp15_r4b", "Small")],
        ]}
      />

      <Callout type="warn" t={t}>
        {tx(t, "cpp15_tsanWarn",
          "ASan and TSan cannot be combined in one build — run them as separate CI jobs. And run your test suite under sanitizers, not just the game: a data race that only fires once every ten thousand frames will never reproduce under a debugger, but TSan flags it the first time the code path executes."
        )}
      </Callout>

      <H2>{tx(t, "cpp15_pkgTitle", "Dependencies")}</H2>
      <LessonTable
        headers={[tx(t, "cpp15_p0", "Tool"), tx(t, "cpp15_p1", "Best for")]}
        rows={[
          ["vcpkg",     tx(t, "cpp15_t1", "Large catalogue, manifest mode pins versions per project. Strong on Windows and MSVC.")],
          ["Conan",     tx(t, "cpp15_t2", "Binary caching and custom ABI configurations. Common in larger studios and CI-heavy setups.")],
          ["CPM.cmake", tx(t, "cpp15_t3", "A thin wrapper over FetchContent. No installation step — good for small projects and samples.")],
          ["Submodules",tx(t, "cpp15_t4", "Total control, zero tooling, manual updates forever. Still the most common choice in gamedev.")],
        ]}
      />

      <H2>{tx(t, "cpp15_lintTitle", "Formatting and static analysis")}</H2>

      <CodeBlock lang="bash" filename="lint.sh" t={t}>{`# Format — settle the style argument once, in a file
clang-format -i $(git diff --name-only --diff-filter=ACM '*.cpp' '*.hpp')

# Static analysis — needs compile_commands.json from CMake
clang-tidy -p build/debug src/renderer.cpp

# .clang-tidy
# Checks: 'bugprone-*,performance-*,modernize-*,readability-*,-modernize-use-trailing-return-type'

# Ask the compiler where the build time went (Clang)
clang++ -std=c++23 -ftime-trace -c src/renderer.cpp
# then open renderer.json in chrome://tracing or Perfetto`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "cpp15_ciTip",
          "The highest-value CI pipeline for a C++ project is four jobs: build with GCC, build with Clang, build with MSVC, and run the tests under ASan+UBSan. Three compilers disagree about far more than you expect, and each disagreement is usually a real bug or a portability issue you would otherwise ship."
        )}
      </Callout>

      <H2>{tx(t, "cpp15_nextTitle", "Where to go from here")}</H2>
      <p>
        {tx(t, "cpp15_nextBody",
          "You now have the language. The natural next steps in this track set are SDL3 for windowing, input and audio, and OpenGL or GLSL for the rendering side — both assume exactly the C++ taught here: RAII wrappers around C handles, spans at the API boundary, and value semantics everywhere else."
        )}
      </p>

    </article>
  );
}
