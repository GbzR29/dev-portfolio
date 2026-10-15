"use client";

// What's Next 2: tooling, the closing chapter of the track. Starts from the
// bug that only shows on the tester's machine; then compiler warnings with
// real g++ messages, sanitizers (figure: five bugs built five ways, real gcc
// 14.2 output), how sanitizers work and what they cost, the debugger, a
// target-based CMake project (tested), presets and compile_commands.json,
// dependencies, formatting and static analysis, Compiler Explorer, a debug
// and a release recipe, and where to go after the track.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { SanitizerFigure } from "@/components/lesson/figures/cpp/SanitizerFigure";

export function ToolingContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "cppTool_intro",
          "The game runs perfectly on your machine. On the tester's machine it crashes once an hour, always somewhere different, and never when the debugger is attached. Almost every chapter of this track has met the cause: undefined behaviour, which can look fine for months and then stop looking fine. You cannot find these bugs by staring at code, and C++ programmers do not try. They let tools find them: the compiler's warnings, sanitizers that watch the program while it runs, a debugger, and a build setup that makes all of them the default. This last chapter puts that toolbox together.")}
      </Lead>

      <Goals t={t} id="cppTool" items={[
        "Turn on the warnings that catch real mistakes, and read them.",
        "Choose the right sanitizer for a bug and read its report.",
        "Set up a target-based CMake project and use a debugger on it.",
        "Know which tools to add next: package managers, formatters, static analysers.",
      ]} />

      <H2>{tx(t, "cppTool_warnTitle", "Warnings: the cheapest tool")}</H2>
      <CodeBlock lang="cpp" filename="w.cpp" t={t}>{`int health(int level) {
    if (level > 0) return level * 10;
}                                            // and if level <= 0?

float average(const std::vector<int>& v) {
    int sum = 0;
    for (int i = 0; i < v.size(); ++i) sum += v[i];
    short s = sum;
    int level = 1;
    { int level = 2; }
    return sum / v.size() + s + level;
}`}</CodeBlock>
      <CodeBlock lang="text" filename="g++ -Wall -Wextra -Wshadow -Wconversion" t={t}>{`w.cpp:4:1: warning: control reaches end of non-void function [-Wreturn-type]
w.cpp:7:23: warning: comparison of integer expressions of different signedness: 'int' and 'std::vector<int>::size_type' {aka 'long long unsigned int'} [-Wsign-compare]
w.cpp:8:15: warning: conversion from 'int' to 'short int' may change value [-Wconversion]
w.cpp:10:11: warning: declaration of 'level' shadows a previous local [-Wshadow]
w.cpp:11:31: warning: conversion from 'std::vector<int>::size_type' {aka 'long long unsigned int'} to 'float' may change value [-Wconversion]`}</CodeBlock>
      <p>
        {tx(t, "cppTool_warnBody",
          "Without flags, g++ compiles this silently. With them, it finds five problems in eleven lines. The first is serious: falling off the end of a non-void function is undefined behaviour. sum / v.size() is a quieter one: sum is converted to unsigned before dividing, so a negative sum gives a huge number. Each message ends with the name of the flag that produced it, which is what you search for to learn more.")}
      </p>
      <LessonTable
        headers={[tx(t, "cppTool_hFlag", "Flag"), tx(t, "cppTool_hTurns", "What it turns on")]}
        rows={[
          ["-Wall", tx(t, "cppTool_w1", "The common, reliable warnings. Despite the name, not all of them.")],
          ["-Wextra", tx(t, "cppTool_w2", "More of them: unused parameters, comparisons that are always true, and so on.")],
          ["-Wshadow", tx(t, "cppTool_w3", "A name declared inside a block hides one outside it.")],
          ["-Wconversion", tx(t, "cppTool_w4", "Implicit conversions that may lose information. Noisy on old code, valuable on new code.")],
          ["-Wpedantic", tx(t, "cppTool_w5", "Compiler extensions that are not standard C++.")],
          ["-Werror", tx(t, "cppTool_w6", "Turns every warning into an error, so none can be ignored. Common in continuous integration, painful when a new compiler adds warnings.")],
        ]}
      />

      <H2>{tx(t, "cppTool_sanTitle", "Sanitizers: the program watches itself")}</H2>
      <p>
        {tx(t, "cppTool_sanBody",
          "Warnings only see the source code; most undefined behaviour depends on values that exist only while the program runs. A sanitizer is extra code the compiler inserts around memory accesses, arithmetic or thread operations, which checks each one as it happens and reports the first violation with the exact line. You turn it on with one flag. Below, five programs from earlier chapters, each with one bug, built five different ways. Every output is real.")}
      </p>
      <SanitizerFigure t={t} />
      <p>
        {tx(t, "cppTool_sanAfter",
          "Look at the plain column: every program ran, exited normally and printed a number that looks plausible. That is what undefined behaviour usually does, and why it reaches players. Also look at the warnings column: no warning at all, and -O2 made the race print the correct 200000, which looks fixed and is worse than a crash. And no gcc tool caught the uninitialised read; for that, Clang has MemorySanitizer, and Valgrind works on any binary.")}
      </p>
      <LessonTable
        headers={[tx(t, "cppTool_hSan", "Sanitizer"), tx(t, "cppTool_hFinds", "Finds"), tx(t, "cppTool_hCost", "Cost, roughly")]}
        rows={[
          ["-fsanitize=address", tx(t, "cppTool_s1", "out-of-bounds reads and writes, use after free, double free, leaks (on Linux)"), tx(t, "cppTool_s1c", "about 2× slower, 2–3× more memory")],
          ["-fsanitize=undefined", tx(t, "cppTool_s2", "signed overflow, shifts too far, null dereference, misaligned access, bad casts"), tx(t, "cppTool_s2c", "small; cheap enough for most test runs")],
          ["-fsanitize=thread", tx(t, "cppTool_s3", "data races, plus use after free"), tx(t, "cppTool_s3c", "5–15× slower, much more memory")],
          ["-fsanitize=memory (Clang)", tx(t, "cppTool_s4", "reads of uninitialised memory"), tx(t, "cppTool_s4c", "about 3× slower")],
        ]}
      />
      <H3>{tx(t, "cppTool_howTitle", "How AddressSanitizer knows")}</H3>
      <p>
        {tx(t, "cppTool_howBody",
          "ASan keeps a second, smaller map of memory called shadow memory: one shadow byte for every 8 bytes of the program, saying whether those bytes may be touched. Around every heap block it places a few forbidden bytes, the red zones, and freed blocks are marked forbidden and kept out of use for a while. Before each load and store, the inserted code checks the shadow byte. In the report of the first bug, \"0 bytes after 16-byte region\" means the read landed in the red zone right after the four ints. Because of the shadow memory, ASan and TSan cannot be combined in one build; run your tests once with each.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "cppTool_winWarn",
          "The MinGW build of g++ on Windows has no sanitizer libraries: -fsanitize=address fails with cannot find -lasan. On Windows, use MSVC (/fsanitize=address) or Clang, or build and test under WSL or in a Linux container. Compiler Explorer, which produced the outputs above, runs Linux compilers and can execute small programs.")}
      </Callout>

      <H2>{tx(t, "cppTool_dbgTitle", "The debugger")}</H2>
      <CodeBlock lang="bash" filename="gdb" t={t}>{`g++ -g -O0 game.cpp -o game     # -g keeps names and line numbers in the program
gdb ./game
(gdb) break update_player       # stop when this function is entered
(gdb) run
(gdb) bt                         # backtrace: who called whom to get here
(gdb) print player.hp            # look at any variable
(gdb) next                       # run one line, stepping over calls
(gdb) step                       # run one line, stepping into calls
(gdb) watch player.hp            # stop whenever this value changes
(gdb) continue`}</CodeBlock>
      <p>
        {tx(t, "cppTool_dbgBody",
          "A debugger runs your program under its control: it can stop at a line, show the call stack and every variable, and run one line at a time. -g adds the debug information that maps machine code back to lines and names; -O0 keeps the code in the order you wrote it, since at -O2 variables vanish into registers and lines are reordered. watch is the tool for \"something changes hp and I do not know what\". Visual Studio, VS Code and CLion offer the same operations with buttons; the ideas are identical.")}
      </p>

      <H2>{tx(t, "cppTool_cmakeTitle", "A build that carries the settings: CMake")}</H2>
      <CodeBlock lang="cmake" filename="CMakeLists.txt" t={t}>{`cmake_minimum_required(VERSION 3.20)
project(game CXX)
set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

add_library(engine engine.cpp)
target_include_directories(engine PUBLIC include)
target_compile_options(engine PRIVATE -Wall -Wextra)

add_executable(game main.cpp)
target_link_libraries(game PRIVATE engine)`}</CodeBlock>
      <CodeBlock lang="bash" filename="build" t={t}>{`cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug    # configure: write the build files into build/
cmake --build build                             # compile and link
./build/game                                    # engine 3`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "cppTool_hLine", "Line"), tx(t, "cppTool_hMeans", "What it means")]}
        rows={[
          ["add_library / add_executable", tx(t, "cppTool_c1", "Declare targets: things to build, each with its own sources and settings.")],
          ["target_include_directories(… PUBLIC …)", tx(t, "cppTool_c2", "engine's headers live in include/. PUBLIC: anything that links engine gets the path too.")],
          ["target_compile_options(… PRIVATE …)", tx(t, "cppTool_c3", "Warnings for engine's own files only. PRIVATE settings do not spread to users.")],
          ["target_link_libraries(game PRIVATE engine)", tx(t, "cppTool_c4", "game uses engine: CMake links it and passes along engine's PUBLIC settings.")],
          ["CMAKE_EXPORT_COMPILE_COMMANDS", tx(t, "cppTool_c5", "Writes build/compile_commands.json, the exact command for every file, which editors and clang-tidy read to understand your project.")],
        ]}
      />
      <p>
        {tx(t, "cppTool_cmakeBody",
          "CMake does not compile anything itself: it generates the files for a real build tool (Ninja, Make, Visual Studio) on each platform. The modern style is target-based: every setting is attached to a target with PUBLIC or PRIVATE, instead of global variables that affect everything. This project was configured and built with CMake 3.30 and g++ 14 while writing this chapter. A CMakePresets.json file can then store named configurations, such as debug, release and asan, so nobody types long command lines.")}
      </p>
      <CodeBlock lang="cmake" filename="sanitize in CMake" t={t}>{`option(GAME_ASAN "Build with AddressSanitizer" OFF)
if(GAME_ASAN)
    add_compile_options(-fsanitize=address -fno-omit-frame-pointer)
    add_link_options(-fsanitize=address)
endif()
# cmake -S . -B build-asan -DGAME_ASAN=ON`}</CodeBlock>

      <H2>{tx(t, "cppTool_moreTitle", "The rest of the toolbox")}</H2>
      <LessonTable
        headers={[tx(t, "cppTool_hTool", "Tool"), tx(t, "cppTool_hFor", "For")]}
        rows={[
          [tx(t, "cppTool_t1k", "vcpkg, Conan"), tx(t, "cppTool_t1", "Package managers: download, build and link libraries such as SDL3, GLM or fmt with one line of configuration, for every platform.")],
          ["FetchContent", tx(t, "cppTool_t2", "A CMake module that downloads a library's source at configure time and builds it with your project. Simple for small dependencies.")],
          ["clang-format", tx(t, "cppTool_t3", "Formats code according to a .clang-format file, so nobody argues about braces in code review.")],
          ["clang-tidy", tx(t, "cppTool_t4", "Static analysis: hundreds of checks such as bugprone-use-after-move or modernize-use-nullptr, some with automatic fixes. Reads compile_commands.json.")],
          ["cppcheck", tx(t, "cppTool_t5", "Another static analyser, independent of any compiler.")],
          ["Compiler Explorer (godbolt.org)", tx(t, "cppTool_t6", "Compile a snippet with dozens of compilers and versions, read the assembly, run it. Every compiler claim in this track was checked there or with the local g++.")],
          [tx(t, "cppTool_t7k", "profilers"), tx(t, "cppTool_t7", "perf, Visual Studio's profiler, AMD uProf, Tracy: where the time goes (the Performance chapter).")],
        ]}
      />

      <H2>{tx(t, "cppTool_recipeTitle", "Two builds to keep")}</H2>
      <LessonTable
        headers={[tx(t, "cppTool_hBuild", "Build"), tx(t, "cppTool_hFlags", "Flags"), tx(t, "cppTool_hUse", "Use it for")]}
        rows={[
          [tx(t, "cppTool_b1", "debug + sanitizers"), "-g -O1 -Wall -Wextra -fsanitize=address,undefined", tx(t, "cppTool_b1u", "Every day and every test run. -O1 keeps it fast enough; address and undefined combine fine.")],
          [tx(t, "cppTool_b2", "thread check"), "-g -O1 -fsanitize=thread", tx(t, "cppTool_b2u", "The tests of any code that uses threads, regularly.")],
          [tx(t, "cppTool_b3", "release"), "-O2 -DNDEBUG (+ -flto)", tx(t, "cppTool_b3u", "What players get, and what you profile.")],
        ]}
      />

      <H2>{tx(t, "cppTool_nextTitle", "Where to go from here")}</H2>
      <p>
        {tx(t, "cppTool_nextBody",
          "This is the end of the track. You started with printf and pointers in C and finished with modules, threads and reflection. The best next step is a project of your own, built with the debug recipe above from the first day: a small game with SDL3 (the SDL3 track), a renderer (the OpenGL and Vulkan tracks), or a tool you need. When a question comes up, cppreference.com is the reference for the language and library, and the C++ Core Guidelines (isocpp.github.io/CppCoreGuidelines) collect the advice of this track and much more, with reasons.")}
      </p>

      <H2>{tx(t, "cppTool_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "cppTool_try1", "Build a project of yours with -Wall -Wextra -Wshadow -Wconversion and fix every warning. Which one surprised you?")}</li>
        <li>{tx(t, "cppTool_try2", "On Compiler Explorer, run the five programs of the figure with -fsanitize=address,undefined together, and compare with the grid.")}</li>
        <li>{tx(t, "cppTool_try3", "Create the CMake project above, add the GAME_ASAN option, and make main.cpp read past the end of an array. Build it twice, with and without the option.")}</li>
        <li>{tx(t, "cppTool_try4", "Put a bug in a loop that changes a variable on the 1000th iteration, then find the iteration with gdb's watch instead of adding prints.")}</li>
      </ol>

      <KeyIdeas t={t} id="cppTool" items={[
        "Undefined behaviour usually looks fine, so finding it is the tools' job, not the eyes'.",
        "-Wall -Wextra and a few extra flags catch real mistakes at no cost; each warning names its flag.",
        "ASan finds memory errors, UBSan arithmetic and similar undefined behaviour, TSan data races; none of the gcc ones finds uninitialised reads.",
        "Optimisation can hide bugs: test with sanitizers, not by checking that the output looks right.",
        "A debugger stops the program anywhere and shows the stack and every variable; watch finds who changes a value.",
        "Target-based CMake carries warnings, sanitizers and settings with the project, so the safe build is the default one.",
      ]} />
    </Article>
  );
}
