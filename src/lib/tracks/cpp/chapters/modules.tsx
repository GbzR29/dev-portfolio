"use client";

// Systems & Performance 1: modules. Starts from a 300-file game where one
// header change costs minutes; then what #include really costs (measured),
// the four problems of textual inclusion and the old remedies, the measured
// rebuild (figure: #include against import as the file count grows), a first
// named module with real g++ errors for a private name and a macro, the
// global module fragment, interface and implementation units, partitions,
// header units and include translation, import std, CMake, and the state of
// compiler support in 2026.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { ModuleCostFigure } from "@/components/lesson/figures/cpp/ModuleCostFigure";

export function ModulesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "cppMod_intro",
          "A game has three hundred .cpp files. You fix a typo in a comment of a header that everything includes, press build, and go make coffee. The machine is not compiling your three hundred files so much as compiling the standard library three hundred times, because #include, inherited from C in the 1970s, is a copy and paste. C++20 modules replace the paste with something the compiler reads once and remembers. This chapter measures the difference, writes a module, and is honest about how ready the tools are.")}
      </Lead>

      <Goals t={t} id="cppMod" items={[
        "Explain, with numbers, why #include makes large builds slow.",
        "Write a named module, export what callers may use, and import it.",
        "Split a module into an interface, implementation units and partitions.",
        "Judge what your compiler and build system support today.",
      ]} />

      <H2>{tx(t, "cppMod_costTitle", "What #include really costs")}</H2>
      <CodeBlock lang="cpp" filename="light.cpp / heavy.cpp" t={t}>{`// light.cpp: 87 ms to compile
int add(int a, int b) { return a + b; }

// heavy.cpp: 973 ms to compile, 67,221 lines after the preprocessor
#include <vector>
#include <string>
#include <memory>
#include <algorithm>
#include <unordered_map>
#include <print>
int add(int a, int b) { return a + b; }`}</CodeBlock>
      <p>
        {tx(t, "cppMod_costBody",
          "The preprocessor (the Preprocessor & the Build chapter) replaces each #include with the whole text of the file, and that file's own includes, recursively. Six common headers turn one line of yours into 67,221 lines that the compiler must read, parse and check; the file takes more than ten times longer to compile. Measured with g++ 14 on this machine. And the next .cpp file that includes the same headers starts again from zero.")}
      </p>
      <LessonTable
        headers={[tx(t, "cppMod_hProblem", "Problem"), tx(t, "cppMod_hMeans", "What it means")]}
        rows={[
          [tx(t, "cppMod_p1k", "repeated work"), tx(t, "cppMod_p1", "N files including the same headers parse them N times. Include guards and #pragma once only stop a header from being pasted twice into the same file.")],
          [tx(t, "cppMod_p2k", "macros leak"), tx(t, "cppMod_p2", "A #define in a header changes every line after the include. <windows.h> famously defines min and max as macros, which breaks std::min and std::max unless NOMINMAX is defined first.")],
          [tx(t, "cppMod_p3k", "order matters"), tx(t, "cppMod_p3", "Because of those macros, the same two includes in the opposite order can mean different code.")],
          [tx(t, "cppMod_p4k", "no privacy"), tx(t, "cppMod_p4", "Every helper in a header is visible to every includer, and changing it recompiles all of them.")],
        ]}
      />
      <p>
        {tx(t, "cppMod_remedyBody",
          "The old remedies help without curing: forward declarations (class Texture; instead of including texture.h) avoid some includes, and precompiled headers let the compiler save its state after a fixed set of headers, a single shared snapshot per project that every file has to start with. Modules fix the cause: a module is compiled once into a binary file that describes its declarations, and importing it loads that description.")}
      </p>
      <ModuleCostFigure t={t} />
      <p>
        {tx(t, "cppMod_figAfter",
          "The modules side pays 1.7 s up front to compile the four headers as modules, then saves almost 0.4 s on every file. From five files on it wins, and for three hundred files the rebuild drops from about two and a half minutes to half a minute. Your own headers count too: in a real game, the engine's headers are usually bigger than the standard ones.")}
      </p>

      <H2>{tx(t, "cppMod_firstTitle", "A first module")}</H2>
      <CodeBlock lang="cpp" filename="geometry.cppm" t={t}>{`module;                      // the global module fragment: plain #includes go here
#include <cmath>

export module geometry;      // this file is the interface of the module "geometry"

#define SQUARE(x) ((x) * (x))                  // macros stay inside the module

float square(float x) { return SQUARE(x); }   // not exported: private to the module

export struct Vec2 { float x, y; };

export float length(Vec2 v) {
    return std::sqrt(square(v.x) + square(v.y));
}`}</CodeBlock>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`import geometry;
#include <cstdio>

int main() {
    Vec2 v{3, 4};
    std::printf("%g\\n", length(v));   // 5
}`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "cppMod_hLine", "Line"), tx(t, "cppMod_hMeans", "What it means")]}
        rows={[
          ["module;", tx(t, "cppMod_l1", "Opens the global module fragment, the only place where a module file may use #include. What is included there is not part of the module and is not exported.")],
          ["export module geometry;", tx(t, "cppMod_l2", "Declares that this file is the primary interface of the module named geometry. Everything after it belongs to the module.")],
          ["export", tx(t, "cppMod_l3", "Makes a declaration visible to whoever imports the module. Without it, a function or type is usable inside the module only.")],
          ["import geometry;", tx(t, "cppMod_l4", "Makes the module's exported names visible. Unlike #include, it is not text: order does not matter and nothing leaks in either direction.")],
          [".cppm", tx(t, "cppMod_l5", "A common extension for module interfaces (MSVC uses .ixx). g++ needs -x c++ to accept it.")],
        ]}
      />
      <CodeBlock lang="bash" filename="build" t={t}>{`g++ -std=c++23 -fmodules-ts -c -x c++ geometry.cppm   # writes gcm.cache/geometry.gcm and geometry.o
g++ -std=c++23 -fmodules-ts main.cpp geometry.o -o main
./main                                                 # 5`}</CodeBlock>
      <p>
        {tx(t, "cppMod_buildBody",
          "Compiling the interface produces two things: the object file with the machine code, and a compiled module interface (gcm.cache/geometry.gcm for g++, called a BMI in general), which importers read. That creates an order headers never had: geometry.cppm must be compiled before any file that imports it. GCC 14 needs -fmodules-ts; GCC 15 and later accept -fmodules. The three errors below are real g++ 14 output.")}
      </p>
      <CodeBlock lang="text" filename="g++ 14" t={t}>{`// main.cpp calls square(2), which geometry does not export
main.cpp:8:25: error: 'square' was not declared in this scope

// main.cpp uses SQUARE(3): macros do not cross a module boundary
main.cpp:11:25: error: 'SQUARE' was not declared in this scope

// main.cpp compiled before geometry.cppm
geometry: error: failed to read compiled module: No such file or directory
geometry: note: compiled module file is 'gcm.cache/geometry.gcm'
geometry: note: imports must be built before being imported`}</CodeBlock>

      <H2>{tx(t, "cppMod_splitTitle", "Interfaces, implementations, partitions")}</H2>
      <CodeBlock lang="cpp" filename="geometry-shapes.cppm, geometry.cppm, geometry_impl.cpp" t={t}>{`// geometry-shapes.cppm: a partition, one piece of the module
export module geometry:shapes;
export struct Circle { float r; };
export float area(Circle c);              // declared here, defined elsewhere

// geometry.cppm: the primary interface gathers the pieces
export module geometry;
export import :shapes;                    // re-export the partition

// geometry_impl.cpp: an implementation unit, no export at all
module geometry;
float area(Circle c) { return 3.14159f * c.r * c.r; }`}</CodeBlock>
      <p>
        {tx(t, "cppMod_splitBody",
          "A module can span many files. Partitions (the :shapes after the name) split a big interface into pieces that only the module itself can import by name; the primary interface re-exports them with export import, so users still write a single import geometry. An implementation unit starts with module geometry; without export: it sees everything in the module, private names included, and holds function bodies. Changing a body there recompiles that file only, never the importers, which is the module version of keeping bodies out of headers.")}
      </p>

      <H3>{tx(t, "cppMod_huTitle", "Header units: import <vector>")}</H3>
      <p>
        {tx(t, "cppMod_huBody",
          "A header unit is an ordinary header compiled as if it were a module, so it can be imported: import <vector>;. Unlike a named module, a header unit still exports its macros, because existing headers depend on them. It is a bridge for code that cannot be rewritten. g++ also has include translation: with -fmodules-ts, once gcm.cache holds a header unit for <vector>, a plain #include <vector> is quietly treated as import <vector>;. That is why, on this machine, the #include version also compiled in 93 ms once the header units existed.")}
      </p>

      <H3>{tx(t, "cppMod_stdTitle", "import std")}</H3>
      <CodeBlock lang="cpp" filename="hello.cpp" t={t}>{`import std;                 // C++23: the whole standard library, one import

int main() { std::println("hi {}", std::vector{1, 2}.size()); }

// g++ 16:  g++ -std=c++26 -fmodules --compile-std-module hello.cpp`}</CodeBlock>
      <p>
        {tx(t, "cppMod_stdBody",
          "C++23 packages the entire standard library as the module std (and std.compat, which also puts the C functions such as printf in the global namespace). Importing everything costs less than including a handful of headers, because nothing is parsed again. The std module still has to be compiled once per compiler and set of flags: GCC 16 does it with --compile-std-module, and build systems handle it for you.")}
      </p>

      <H2>{tx(t, "cppMod_cmakeTitle", "Modules in CMake")}</H2>
      <CodeBlock lang="cmake" filename="CMakeLists.txt" t={t}>{`cmake_minimum_required(VERSION 3.28)
project(game CXX)
set(CMAKE_CXX_STANDARD 23)

add_library(geometry)
target_sources(geometry PUBLIC FILE_SET CXX_MODULES FILES
    geometry.cppm geometry-shapes.cppm)
target_sources(geometry PRIVATE geometry_impl.cpp)

add_executable(game main.cpp)
target_link_libraries(game PRIVATE geometry)`}</CodeBlock>
      <p>
        {tx(t, "cppMod_cmakeBody",
          "Since CMake 3.28, a FILE_SET of type CXX_MODULES tells CMake which files are module interfaces. CMake then scans every source file for import lines before compiling, works out the order, and builds the interfaces first. This scanning needs a generator that supports it: Ninja, or Visual Studio, not the plain Makefiles generator.")}
      </p>

      <H2>{tx(t, "cppMod_realTitle", "How ready is it, in 2026")}</H2>
      <LessonTable
        headers={[tx(t, "cppMod_hTool", "Tool"), tx(t, "cppMod_hState", "State")]}
        rows={[
          ["GCC 14", tx(t, "cppMod_s1", "Named modules and partitions work with -fmodules-ts. Header units are rough: on this machine <memory> and <print> failed to import.")],
          ["GCC 15–16", tx(t, "cppMod_s2", "-fmodules; import std; GCC 16 can build the std module itself with --compile-std-module.")],
          ["Clang 17+", tx(t, "cppMod_s3", "Named modules; import std with libc++.")],
          ["MSVC (Visual Studio 2022)", tx(t, "cppMod_s4", "The most complete and the first to ship import std.")],
          ["CMake 3.28+ with Ninja", tx(t, "cppMod_s5", "Named modules supported; import std through an experimental setting.")],
          [tx(t, "cppMod_s6k", "editors and tools"), tx(t, "cppMod_s6", "The weakest part: code completion, clang-tidy and some IDEs still understand modules partially.")],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "cppMod_adoptTip",
          "A practical path: keep headers for code shared with older compilers, start using import std or header units for the standard library in new code, and turn one self-contained part of your own code (a maths library, say) into a named module. Measure the build time before and after.")}
      </Callout>

      <H2>{tx(t, "cppMod_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "cppMod_try1", "Preprocess a file with g++ -E and count the lines, first with #include <iostream>, then with #include <print>.")}</li>
        <li>{tx(t, "cppMod_try2", "Build the geometry module, then try to call square from main.cpp, then try to use SQUARE. Read both errors.")}</li>
        <li>{tx(t, "cppMod_try3", "Move the body of length into an implementation unit. Change the body and check which files your build recompiles.")}</li>
        <li>{tx(t, "cppMod_try4", "Time a clean build of a small project of your own with headers, then with import std, using the same number of parallel jobs.")}</li>
      </ol>

      <KeyIdeas t={t} id="cppMod" items={[
        "#include pastes text, so every file parses its headers again: one line plus six headers became 67,221 lines and took ten times longer.",
        "A module is compiled once into a binary interface that importers load; order of imports does not matter.",
        "Only what is exported is visible to importers, and macros never cross a module boundary.",
        "Interfaces must be compiled before their importers, which is why build systems scan for imports.",
        "Partitions split a module's interface; implementation units hold bodies without making importers recompile.",
        "Support is good for named modules and import std in recent compilers, and still rough in tools and header units.",
      ]} />
    </Article>
  );
}
