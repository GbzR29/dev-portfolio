"use client";

// C Foundations 5: the preprocessor and the build — the three stages and how to
// look at each (gcc -E, -c, nm, link); #include, #define constants and macros
// and their traps, conditional compilation, assert/NDEBUG and -D; declaration
// vs definition; what goes in a header; include guards and #pragma once;
// extern and static (linkage); reading compiler and linker errors; a minimal
// Makefile and incremental builds.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { BuildPipelineFigure } from "@/components/lesson/figures/c/BuildPipelineFigure";

export function CPreprocessorBuildContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "cPre_intro",
          "So far every program fitted in one file. Real programs are split across dozens or thousands of them, and a game engine can take minutes to build. This chapter opens up the single gcc command from the first chapter and shows the three programs hiding inside it: the preprocessor, the compiler and the linker. Knowing which of them complained is half of fixing any build error, and it explains rules that otherwise look arbitrary, such as why headers hold declarations and .c files hold definitions.")}
      </Lead>

      <Goals t={t} id="cPre" items={[
        "Name the three stages of a build and run each one on its own.",
        "Write #define constants and macros, and avoid their classic traps.",
        "Split a program into headers and .c files, with include guards.",
        "Tell a declaration from a definition, and use static and extern.",
        "Read an error message and say which stage produced it.",
      ]} />

      <H2>{tx(t, "cPre_stagesTitle", "Three stages, three programs")}</H2>
      <p>
        {tx(t, "cPre_stagesBody",
          "Each .c file is built on its own, without looking at the others. The preprocessor turns it into a translation unit: the file with every #include pasted in and every macro expanded. The compiler turns each translation unit into an object file (.o on Linux and macOS, .obj on Windows) of machine code. An object file lists the symbols it defines, meaning the functions and global variables whose code or data it contains, and the symbols it needs from elsewhere. Finally the linker joins all the object files and libraries, and matches every needed symbol with exactly one definition.")}
      </p>
      <LessonTable
        headers={[tx(t, "cPre_hStage", "Stage"), tx(t, "cPre_hIn", "Input → output"), tx(t, "cPre_hSee", "See it on its own")]}
        rows={[
          [tx(t, "cPre_s1", "Preprocess"), tx(t, "cPre_s1io", "main.c → translation unit (text)"), "gcc -E main.c"],
          [tx(t, "cPre_s2", "Compile"), tx(t, "cPre_s2io", "translation unit → main.o (machine code + symbol table)"), "gcc -c main.c"],
          [tx(t, "cPre_s3", "Link"), tx(t, "cPre_s3io", "main.o + vec.o + libraries → executable"), "gcc main.o vec.o -lm -o game"],
        ]}
      />
      <CodeBlock lang="bash" filename="stages.sh" t={t}>{`gcc -c main.c          # compile only: writes main.o
gcc -c vec.c           # writes vec.o
nm main.o              # list its symbols
#                  U printf      U = undefined here: needed from elsewhere
#  0000000000000000 T main       T = defined here, in the code ("text") section
#                  U vec_len
gcc main.o vec.o -lm -o game    # link; -lm adds the maths library (sqrtf)`}</CodeBlock>

      <H2>{tx(t, "cPre_ppTitle", "The preprocessor only edits text")}</H2>
      <p>
        {tx(t, "cPre_ppBody",
          "Lines starting with # are directives to the preprocessor. It knows nothing about C: it copies files, replaces words and removes lines, then hands the result to the compiler. #include \"file.h\" pastes in a file of your project, searched first next to the current file. #include <file.h> pastes a system header, searched in the compiler's own directories. #define NAME text replaces every later NAME by text.")}
      </p>
      <CodeBlock lang="c" filename="macros.c" t={t}>{`#define MAX_PLAYERS 4                   // a constant: MAX_PLAYERS becomes 4
#define SQUARE_BAD(x) x * x             // a macro with a parameter
#define SQUARE(x) ((x) * (x))           // parenthesised: the safe spelling

int a = SQUARE_BAD(1 + 2);   // becomes 1 + 2 * 1 + 2  = 5, not 9
int b = SQUARE(1 + 2);       // becomes ((1 + 2) * (1 + 2)) = 9
int i = 3;
int c = SQUARE(i++);         // ((i++) * (i++)): i incremented twice, undefined behaviour

// Better: a real function, checked by the compiler and evaluated once
static inline int square(int x) { return x * x; }`}</CodeBlock>
      <Callout type="warn" t={t}>
        {tx(t, "cPre_macroWarn",
          "A macro is pasted, not called. Wrap every parameter and the whole body in parentheses, and never pass an argument with a side effect such as i++. For constants prefer enum or const; for small functions prefer static inline. Keep macros for what only text substitution can do, such as the conditional compilation below.")}
      </Callout>
      <H3>{tx(t, "cPre_condTitle", "Conditional compilation")}</H3>
      <p>
        {tx(t, "cPre_condBody",
          "#if, #ifdef and #ifndef keep or drop lines before the compiler sees them. This is how one source file builds on Windows and Linux, and how debug checks disappear from release builds. The flag -DNAME defines a name from the command line, as if the file began with #define NAME.")}
      </p>
      <CodeBlock lang="c" filename="platform.c" t={t}>{`#include <assert.h>

#ifdef _WIN32                       // defined by every Windows compiler
    #define PATH_SEP '\\\\'
#else
    #define PATH_SEP '/'
#endif

void set_health(int hp) {
    assert(hp >= 0);                // checked in debug builds; removed when NDEBUG is defined
    // ...
}
// gcc -O2 -DNDEBUG game.c   → release build: every assert becomes nothing`}</CodeBlock>

      <H2>{tx(t, "cPre_headersTitle", "Headers: declarations shared between files")}</H2>
      <p>
        {tx(t, "cPre_headersBody",
          "Because each .c file is compiled alone, main.c cannot see the functions written in vec.c. It only needs to know they exist and what they look like, and a declaration says exactly that. A definition is the thing itself: the body of a function, or the storage of a variable. A program may declare something as often as it likes, but must define it exactly once. So the declarations go in a header that every user includes, and the definitions go in one .c file.")}
      </p>
      <LessonTable
        headers={["", tx(t, "cPre_hDecl", "Declaration (in the .h)"), tx(t, "cPre_hDef", "Definition (in one .c)")]}
        rows={[
          [tx(t, "cPre_d1", "Function"), "float vec_len(Vec v);", "float vec_len(Vec v) { return …; }"],
          [tx(t, "cPre_d2", "Global variable"), "extern int frame_count;", "int frame_count = 0;"],
          [tx(t, "cPre_d3", "Type"), "typedef struct { float x, y; } Vec;", tx(t, "cPre_d3b", "(a type is not a symbol: it lives entirely in the header)")],
        ]}
      />
      <p>
        {tx(t, "cPre_guardBody",
          "A header can be pasted twice into one translation unit, directly or through another header. Its types would then be defined twice, which is an error. An include guard makes the second paste empty: the first time, VEC_H is not defined, so the contents are kept and VEC_H gets defined; the second time, the #ifndef skips everything. Every compiler also accepts the shorter #pragma once at the top of the file.")}
      </p>
      <CodeBlock lang="c" filename="vec.h" t={t}>{`#ifndef VEC_H
#define VEC_H

typedef struct { float x, y; } Vec;

float vec_len(Vec v);            // declaration: the body lives in vec.c
extern int vec_calls;            // declaration of a global defined in vec.c

static inline Vec vec_add(Vec a, Vec b) {   // small helpers may live here: static inline
    return (Vec){ a.x + b.x, a.y + b.y };
}

#endif`}</CodeBlock>
      <H3>{tx(t, "cPre_staticTitle", "static: private to one file")}</H3>
      <p>
        {tx(t, "cPre_staticBody",
          "Outside a function, static means \"visible only inside this translation unit\". The linker never sees the name, so two files can each have their own static helper called clamp without a clash. Mark every function and global static unless another file truly needs it: it keeps names from colliding and lets the compiler optimise more freely. Inside a function, static means something else: a local variable that keeps its value between calls, as in the memory chapter.")}
      </p>

      <H2>{tx(t, "cPre_figTitle", "Break the build")}</H2>
      <p>
        {tx(t, "cPre_figBody",
          "The figure builds a small project of four files. Look at each translation unit, at what every object file defines and needs, and at how the linker matches them. Then use the switches to break it in the four classic ways and read the error each one produces.")}
      </p>
      <BuildPipelineFigure t={t} />

      <H2>{tx(t, "cPre_errorsTitle", "Which stage complained?")}</H2>
      <LessonTable
        headers={[tx(t, "cPre_hMsg", "Message"), tx(t, "cPre_hFrom", "From"), tx(t, "cPre_hFix", "Usual fix")]}
        rows={[
          ["fatal error: vec.h: No such file", tx(t, "cPre_e1s", "preprocessor"), tx(t, "cPre_e1f", "wrong file name, or add the folder with -I include/")],
          ["unknown type name 'Body'", tx(t, "cPre_e2s", "compiler"), tx(t, "cPre_e2f", "include the header that defines the type")],
          ["implicit declaration of function 'vec_len'", tx(t, "cPre_e3s", "compiler"), tx(t, "cPre_e3f", "include the header that declares it (an error since C99 in strict mode)")],
          ["conflicting types / redefinition", tx(t, "cPre_e4s", "compiler"), tx(t, "cPre_e4f", "a header pasted twice without a guard, or two different declarations")],
          ["undefined reference to `vec_len'", tx(t, "cPre_e5s", "linker"), tx(t, "cPre_e5f", "the .c file or library with the definition was not linked (-lm for maths)")],
          ["multiple definition of `sq'", tx(t, "cPre_e6s", "linker"), tx(t, "cPre_e6f", "a definition in a header: make it static inline, or move the body to one .c")],
        ]}
      />

      <H2>{tx(t, "cPre_makeTitle", "Building only what changed")}</H2>
      <p>
        {tx(t, "cPre_makeBody",
          "Since each .c file compiles on its own, changing vec.c only requires recompiling vec.c and linking again. A build tool keeps track of that for you. make, from 1976, reads a Makefile of rules: a target, the files it depends on, and the command that rebuilds it. It reruns a command only when a dependency is newer than its target. Large projects use CMake, which writes the build files for make, Ninja or Visual Studio; the Tooling chapter of this track covers it.")}
      </p>
      <CodeBlock lang="makefile" filename="Makefile" t={t}>{`CFLAGS = -std=c17 -Wall -Wextra -g

game: main.o vec.o               # the program needs both objects
	cc main.o vec.o -lm -o game

main.o: main.c vec.h body.h      # rebuild main.o if any of these changed
	cc $(CFLAGS) -c main.c

vec.o: vec.c vec.h
	cc $(CFLAGS) -c vec.c`}</CodeBlock>
      <Callout type="info" t={t}>
        {tx(t, "cPre_tabNote",
          "The command lines of a Makefile must start with a real tab character, not spaces. It is a famous design accident from 1976 that nobody could fix once the first users existed.")}
      </Callout>

      <H2>{tx(t, "cPre_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "cPre_try1", "Run gcc -E on a hello-world program and count the lines. Where did they all come from?")}</li>
        <li>{tx(t, "cPre_try2", "Split one of your programs into main.c, a module .c and its .h. Compile each with -c and inspect them with nm.")}</li>
        <li>{tx(t, "cPre_try3", "Write a macro MAX(a, b) and find an argument for which it gives a wrong answer. Then write it as a static inline function.")}</li>
      </ol>

      <KeyIdeas t={t} id="cPre" items={[
        "A build has three stages: the preprocessor pastes text, the compiler makes one object file per .c, the linker joins them.",
        "Each .c file is compiled alone; headers tell it what exists elsewhere.",
        "Declare as often as you like, define exactly once: declarations in headers, definitions in one .c file.",
        "Every header needs an include guard or #pragma once.",
        "Macros are text substitution: parenthesise them, or use enum, const and static inline instead.",
        "static hides a name inside its file. Errors mentioning undefined or multiple definitions come from the linker.",
      ]} />
    </Article>
  );
}
