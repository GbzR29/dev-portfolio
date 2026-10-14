"use client";

// First steps in C++ 1 (rewritten 2026-10-14): what "modern C++" means, told
// through one program written in five eras (figure); hello.cpp line by line,
// with <print> and with <iostream>; who decides what C++ is (WG21, standards,
// compilers catching up); compiling with g++/clang++/MSVC, each flag
// explained; the four defaults of today's C++ and the chapter that teaches
// each; the plan of this section.

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { CppErasFigure } from "@/components/lesson/figures/cpp/CppErasFigure";

export function LandscapeContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "cppLand_intro",
          "Open the source of a game engine written in 2003 and of one written last year. Both are C++, both still compile with today's compilers, and they barely look like the same language. The old one fills its arrays one call at a time, frees its memory by hand and counts with indices. The new one says what it wants in a line, and its objects clean up after themselves. C++ never threw old code away: it grew around it. So learning C++ today means learning which parts of that history people still reach for. This chapter shows you the language as it is written now, and gets your first program built and running.")}
      </Lead>

      <Goals t={t} id="cppLand" items={[
        "Explain why old and new C++ look so different, and why both still compile.",
        "Read every line of a first C++ program.",
        "Compile it with a chosen standard and with warnings switched on.",
        "Name the defaults that today's C++ code follows.",
      ]} />

      <H2>{tx(t, "cppLand_erasTitle", "One program, five eras")}</H2>
      <p>
        {tx(t, "cppLand_erasBody",
          "The program below keeps two shader names in a list and prints them numbered. It is the same program in every tab. Only the era changes. Step through them in order: each era removes a little ceremony that the one before needed.")}
      </p>
      <CppErasFigure t={t} />
      <p>
        {tx(t, "cppLand_erasAfter",
          "Two things stand out. First, every version still compiles with the newest compiler, because the people who design C++ almost never break old code. Second, the newer versions are shorter, but they are not doing less: the compiler has taken over work you used to write out. That is what people mean by modern C++. It is not a separate language, just the newer tools used by default.")}
      </p>

      <H2>{tx(t, "cppLand_helloTitle", "Your first C++ program")}</H2>
      <CodeBlock lang="cpp" filename="hello.cpp" t={t}>{`#include <print>
#include <string>

int main() {
    std::string name = "C++";
    std::println("Hello, {}!", name);
}`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "cppLand_hLine", "Line"), tx(t, "cppLand_hMeans", "What it means")]}
        rows={[
          ["#include <print>", tx(t, "cppLand_l1", "Pastes in the declarations of std::print and std::println, as #include <stdio.h> did for printf. C++ standard headers have no .h.")],
          ["#include <string>", tx(t, "cppLand_l2", "The std::string type: a piece of text that manages its own memory, with no '\\0' to look after.")],
          ["int main()", tx(t, "cppLand_l3", "Where the program starts, as in C. Empty parentheses already mean \"no parameters\" in C++: no void needed.")],
          ["std::string name = \"C++\";", tx(t, "cppLand_l4", "A variable of type std::string, holding the text C++. std:: means \"from the standard library\": every name the library defines lives in the namespace std.")],
          ["std::println(\"Hello, {}!\", name);", tx(t, "cppLand_l5", "Prints the text with name put in place of {}, then a newline. The compiler checks that the value fits the {}, so the %d-versus-%s mistakes of printf cannot happen.")],
          ["}", tx(t, "cppLand_l6", "main may end without return 0: reaching the end of main returns 0 for you.")],
        ]}
      />
      <p>
        {tx(t, "cppLand_iostreamBody",
          "std::println is from C++23. A lot of existing code, and every C++ book older than a few years, prints with streams instead. You will read this form constantly, so here it is too:")}
      </p>
      <CodeBlock lang="cpp" filename="hello_streams.cpp" t={t}>{`#include <iostream>
#include <string>

int main() {
    std::string name = "C++";
    std::cout << "Hello, " << name << "!\\n";
}`}</CodeBlock>
      <p>
        {tx(t, "cppLand_iostreamAfter",
          "std::cout is the standard output, and << sends each piece to it in turn. It works with every compiler, so if yours does not have <print> yet, use this form; nothing else in this track depends on the difference.")}
      </p>

      <H2>{tx(t, "cppLand_whoTitle", "Who decides what C++ is")}</H2>
      <p>
        {tx(t, "cppLand_whoBody",
          "No company owns C++. It is defined by a document, the ISO C++ standard, written by a committee called WG21: a few hundred volunteers from companies such as Microsoft, Google, Apple, Nvidia and game studios, plus universities and individuals. They meet several times a year and vote on proposals. Since 2011 they publish a new version every three years, with whatever is ready by then. The standard only says what C++ code means. Compiler teams then implement it, and that takes time: the large features of a standard usually arrive one to three years after it is published.")}
      </p>
      <LessonTable
        headers={[tx(t, "cppLand_hStd", "Version"), tx(t, "cppLand_hBrought", "What it brought, in plain words")]}
        rows={[
          ["C++98", tx(t, "cppLand_v98", "The first standard: classes, templates, std::string, std::vector and the algorithms.")],
          ["C++11", tx(t, "cppLand_v11", "The big modernisation: auto, the range-based for, lambdas (small unnamed functions), smart pointers that free memory by themselves, move semantics (cheap transfers instead of copies), threads.")],
          ["C++14 / 17", tx(t, "cppLand_v17", "Polish and convenience: std::optional (a value that may be absent), std::string_view (a view of text without copying it), structured bindings, if constexpr.")],
          ["C++20", tx(t, "cppLand_v20", "Four big features: concepts (rules for template arguments), ranges, modules (a replacement for #include), coroutines. Plus std::format.")],
          ["C++23", tx(t, "cppLand_v23", "std::print, std::expected (a result or an error), import std, and many smaller fixes.")],
          ["C++26", tx(t, "cppLand_v26", "Finished in 2025–2026: reflection (code that inspects types at compile time), contracts, std::execution. Compilers are adding it now.")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "cppLand_isoNote",
          "The nickname gives the year the work was finished, and the official document is sometimes dated a year later: C++23 is ISO/IEC 14882:2024. Cppreference.com keeps a table of which compiler version supports which feature. Check it before you rely on something new.")}
      </Callout>

      <H2>{tx(t, "cppLand_buildTitle", "Compiling: choose a standard, ask for warnings")}</H2>
      <p>
        {tx(t, "cppLand_buildBody",
          "C++ files end in .cpp (sometimes .cc or .cxx). Build them with g++ or clang++ rather than gcc or clang: the ++ drivers also link the C++ standard library. Compilers do not always default to the newest standard, so say which one you want.")}
      </p>
      <CodeBlock lang="bash" filename="build.sh" t={t}>{`# Linux / macOS
g++ -std=c++23 -Wall -Wextra -Wconversion -g hello.cpp -o hello
./hello

# Windows, in a "Developer Command Prompt" (MSVC)
cl /std:c++latest /W4 /permissive- /EHsc hello.cpp
hello.exe`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "cppLand_hFlag", "Flag"), tx(t, "cppLand_hDoes", "What it does")]}
        rows={[
          ["-std=c++23", tx(t, "cppLand_f1", "Compile as C++23. Older code keeps compiling; newer features are rejected, as the figure above showed.")],
          ["-Wall -Wextra", tx(t, "cppLand_f2", "Turn on the common warnings. A warning is the compiler saying \"this is legal, but it is probably a mistake\". Treat each one as a bug report.")],
          ["-Wconversion", tx(t, "cppLand_f3", "Warn when a value is silently converted to a smaller type, e.g. a double stored in an int loses its fraction.")],
          ["-g", tx(t, "cppLand_f4", "Keep debugging information, so a debugger can show your source lines and variable names.")],
          ["-o hello", tx(t, "cppLand_f5", "Name of the program to write. Without it you get a.out.")],
          ["/std:c++latest /W4", tx(t, "cppLand_f6", "MSVC's way to say the same: the newest standard it knows, and warning level 4.")],
          ["/permissive- /EHsc", tx(t, "cppLand_f7", "Make MSVC follow the standard strictly, and turn on standard C++ exception handling.")],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "cppLand_explorerTip",
          "To try a snippet without installing anything, paste it into Compiler Explorer (godbolt.org). Pick a compiler and a -std flag and you will see the errors, the output and even the machine code it produces.")}
      </Callout>

      <H2>{tx(t, "cppLand_defaultsTitle", "The defaults of today's C++")}</H2>
      <p>
        {tx(t, "cppLand_defaultsBody",
          "Modern C++ is less a list of features than a handful of habits. Each one exists to turn a kind of bug you met in C into something the compiler handles or rejects.")}
      </p>
      <LessonTable
        headers={[tx(t, "cppLand_hHabit", "Habit"), tx(t, "cppLand_hWhy", "Why"), tx(t, "cppLand_hWhere", "Taught in")]}
        rows={[
          [tx(t, "cppLand_d1", "Objects clean up after themselves"), tx(t, "cppLand_d1w", "A destructor releases memory, files and locks at the end of a scope, on every path. No free() to forget."), tx(t, "cppLand_d1c", "Classes; RAII & Smart Pointers")],
          [tx(t, "cppLand_d2", "Use the standard library first"), tx(t, "cppLand_d2w", "std::string and std::vector replace '\\0' strings and hand-grown arrays; std::sort replaces your own sorting loop."), tx(t, "cppLand_d2c", "std::string & std::vector")],
          [tx(t, "cppLand_d3", "Work with values"), tx(t, "cppLand_d3w", "Return results instead of filling out-parameters. Moving makes passing big objects around cheap."), tx(t, "cppLand_d3c", "Initialization & Values; Move Semantics")],
          [tx(t, "cppLand_d4", "Let the compiler check"), tx(t, "cppLand_d4w", "Types, const, references and templates move mistakes from run time to compile time, where they are cheap to fix."), tx(t, "cppLand_d4c", "References; Templates; Concepts")],
        ]}
      />

      <H2>{tx(t, "cppLand_nextTitle", "The rest of this section")}</H2>
      <p>
        {tx(t, "cppLand_nextBody",
          "The next three chapters are your first real steps. References, overloading and namespaces: the small changes that make functions nicer to call. Classes, constructors and destructors: how an object guards its own data and cleans up after itself. std::string and std::vector: the two types you will use in nearly every program. After them, the section \"Language Core\" goes deeper into values, ownership and moves.")}
      </p>

      <KeyIdeas t={t} id="cppLand" items={[
        "C++ grew for forty years without breaking old code, so old and new styles both compile.",
        "\"Modern C++\" means using the newer tools by default, not a different language.",
        "WG21 publishes a standard every three years; compilers implement it over the following years.",
        "Build with g++/clang++ -std=c++23 -Wall -Wextra (MSVC: /std:c++latest /W4) and fix every warning.",
        "std::println prints with {} placeholders checked by the compiler; std::cout << is the older stream form.",
      ]} />
    </Article>
  );
}
