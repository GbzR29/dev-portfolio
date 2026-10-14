"use client";

// C Foundations 1: a first C program — why learn C, the parts of hello.c, from
// source to executable (preprocess, compile, link) with gcc/clang/MSVC and
// warning flags; types and their sizes, stdint.h, signed vs unsigned;
// variables as boxes at addresses, uninitialised garbage; integer division,
// remainder and conversions; printf format specifiers; reading with scanf and
// checking its result; if / loops / functions and prototypes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { MemoryBoxFigure } from "@/components/lesson/figures/c/MemoryBoxFigure";

export function CBasicsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "cBas_intro",
          "C is a small language from 1972 that still runs the world. Operating system kernels, drivers, databases and the libraries behind games are written in it. The APIs you call from C++ are C APIs: OpenGL, Vulkan, SDL and the operating system itself. C++ began as C with classes, and almost every C program is still valid C++. C hides very little. A variable is a box at an address, and you can see that address and work with it. This section teaches that picture first. The C++ chapters that follow make sense once you know what they automate.")}
      </Lead>

      <Goals t={t} id="cBas" items={[
        "Write, compile and run a C program, and read the compiler's warnings.",
        "Pick a type for a value and say how many bytes it takes.",
        "Predict the result of integer division and of mixing int with double.",
        "Print values with printf and read numbers safely with scanf.",
      ]} />

      <H2>{tx(t, "cBas_helloTitle", "The first program")}</H2>
      <CodeBlock lang="c" filename="hello.c" t={t}>{`#include <stdio.h>

int main(void) {
    printf("Hello, C!\\n");
    return 0;
}`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "cBas_hLine", "Line"), tx(t, "cBas_hMeans", "What it means")]}
        rows={[
          ["#include <stdio.h>", tx(t, "cBas_l1", "Pastes in the declarations of the standard input/output functions, printf among them. Lines starting with # are handled by the preprocessor before compiling.")],
          ["int main(void)", tx(t, "cBas_l2", "Defines the function main. Every C program starts there. int is the type of the value it returns; void means it takes no arguments.")],
          ["{ … }", tx(t, "cBas_l3", "The braces hold the body of the function: the statements it runs, top to bottom.")],
          ["printf(\"…\\n\");", tx(t, "cBas_l4", "Calls printf with a string. \\n is the newline character. Each statement ends with a semicolon.")],
          ["return 0;", tx(t, "cBas_l5", "Ends main and hands 0 to the operating system, which by convention means \"success\". Any other number signals an error.")],
        ]}
      />

      <H2>{tx(t, "cBas_buildTitle", "From source file to program")}</H2>
      <p>
        {tx(t, "cBas_buildBody",
          "The processor cannot run hello.c. A compiler turns it into machine code in three stages. The preprocessor handles the # lines. The compiler proper translates the C into an object file (hello.o): machine code with holes where it calls functions defined elsewhere, such as printf. The linker fills the holes from the C standard library and writes the executable. One command runs all three.")}
      </p>
      <CodeBlock lang="bash" filename="build.sh" t={t}>{`# Linux / macOS (gcc or clang take the same flags)
gcc -std=c17 -Wall -Wextra -g hello.c -o hello
./hello

# Windows, in a "Developer Command Prompt" (MSVC)
cl /std:c17 /W4 hello.c
hello.exe`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "cBas_hFlag", "Flag"), tx(t, "cBas_hDoes", "What it does")]}
        rows={[
          ["-std=c17", tx(t, "cBas_f1", "Which version of C to accept. C17 is the safe default; C23 is newer and supported by recent gcc and clang.")],
          ["-Wall -Wextra", tx(t, "cBas_f2", "Turn on most warnings. A warning is the compiler pointing at code that is legal but probably wrong. Treat every one as a bug.")],
          ["-g", tx(t, "cBas_f3", "Keep debug information, so a debugger can show your source lines and variable names.")],
          ["-o hello", tx(t, "cBas_f4", "Name of the output file. Without it gcc writes a.out.")],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "cBas_explorerTip",
          "No compiler installed yet? Compiler Explorer (godbolt.org) compiles and runs C in the browser. Pick \"C\" as the language and add the flags above in the compiler options box.")}
      </Callout>

      <H2>{tx(t, "cBas_typesTitle", "Types: how many bytes, and what they mean")}</H2>
      <p>
        {tx(t, "cBas_typesBody",
          "Memory is a long row of bytes. A byte is 8 bits, so it holds one of 2⁸ = 256 patterns. A type tells the compiler two things: how many bytes a value takes, and how to read those bits (as a whole number, a number with a fraction, or a character). The operator sizeof gives the size in bytes. C fixes only minimums, but every current desktop and phone uses the sizes below.")}
      </p>
      <LessonTable
        headers={[tx(t, "cBas_hType", "Type"), tx(t, "cBas_hBytes", "Bytes"), tx(t, "cBas_hRange", "Holds")]}
        rows={[
          ["char", "1", tx(t, "cBas_t1", "one character (really a small number: 'A' is 65)")],
          ["short", "2", tx(t, "cBas_t2", "whole numbers from −32 768 to 32 767")],
          ["int", "4", tx(t, "cBas_t3", "whole numbers up to about ±2.1 billion; the default choice")],
          ["long long", "8", tx(t, "cBas_t4", "whole numbers up to about ±9.2 · 10¹⁸")],
          ["float", "4", tx(t, "cBas_t5", "numbers with a fraction, about 7 significant digits")],
          ["double", "8", tx(t, "cBas_t6", "numbers with a fraction, about 16 significant digits; the default for decimals")],
          ["size_t", "8", tx(t, "cBas_t7", "sizes and counts, never negative; what sizeof returns")],
          ["bool", "1", tx(t, "cBas_t8", "true or false (include <stdbool.h> before C23)")],
        ]}
      />
      <p>
        {tx(t, "cBas_signedBody",
          "Whole-number types come in two kinds. Signed types (the default) hold negative and positive values. unsigned types hold only zero and up, and in exchange reach twice as high: an unsigned int goes from 0 to about 4.29 billion. When the exact width matters, as in a file format or a network message, use the types from <stdint.h>: int8_t, int32_t, uint64_t and so on, whose names state the number of bits.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "cBas_longNote",
          "long is the one type that differs between systems: 8 bytes on 64-bit Linux and macOS, but 4 on Windows. That is a common source of bugs in code moved between them. Use long long or int64_t when you need 64 bits.")}
      </Callout>

      <H2>{tx(t, "cBas_varsTitle", "Variables are boxes at addresses")}</H2>
      <p>
        {tx(t, "cBas_varsBody",
          "A declaration such as int count = 3; asks for a box of 4 bytes and writes 3 into it. The name count stands for that box from then on. Local variables, the ones declared inside a function, live in that function's stack frame: a stretch of memory created when the function starts and released when it returns. Step through the program below and watch each box appear with its address, type and size.")}
      </p>
      <MemoryBoxFigure t={t} programs={["vars"]} />
      <p>
        {tx(t, "cBas_garbageBody",
          "Look at total before it is assigned. C does not clear new local variables, so the box holds whatever bits a previous function left there. Reading it is a bug that may print 0 on your machine and nonsense on another. The rule is simple: give every variable a value where you declare it. -Wall warns when it can see the mistake.")}
      </p>

      <H2>{tx(t, "cBas_arithTitle", "Arithmetic: the type decides the result")}</H2>
      <p>
        {tx(t, "cBas_arithBody",
          "When both operands are whole numbers, C does whole-number arithmetic. Division drops the fraction (it rounds toward zero), and % gives the remainder. As soon as one operand is a double, the other is converted to double and the result keeps its fraction. A cast, written (type) before a value, converts it on purpose.")}
      </p>
      <CodeBlock lang="c" filename="arith.c" t={t}>{`int a = 7, b = 2;
printf("%d\\n", a / b);           // 3    whole-number division drops .5
printf("%d\\n", a % b);           // 1    remainder: 7 = 3 * 2 + 1
printf("%d\\n", -7 / 2);          // -3   rounds toward zero, not down
printf("%f\\n", a / 2.0);         // 3.500000   2.0 is a double
printf("%f\\n", (double)a / b);   // 3.500000   cast a first, then divide
printf("%f\\n", (double)(a / b)); // 3.000000   too late: a / b was already 3
int big = 2147483647;            // the largest int
// big + 1 overflows: for signed types that is undefined behaviour (a later chapter)`}</CodeBlock>

      <H2>{tx(t, "cBas_printfTitle", "printf: printing values")}</H2>
      <p>
        {tx(t, "cBas_printfBody",
          "printf takes a format string and then the values to put into it. Each % in the string is a conversion specifier: it says where the next value goes and how to print it. The specifier must match the value's type. printf cannot check this itself, but -Wall -Wextra makes the compiler check it for you.")}
      </p>
      <LessonTable
        headers={[tx(t, "cBas_hSpec", "Specifier"), tx(t, "cBas_hFor", "For"), tx(t, "cBas_hEx", "Example → output")]}
        rows={[
          ["%d", "int", "printf(\"%d\", -5) → -5"],
          ["%u", "unsigned int", "printf(\"%u\", 7u) → 7"],
          ["%lld", "long long", "printf(\"%lld\", 1LL << 40) → 1099511627776"],
          ["%zu", "size_t", "printf(\"%zu\", sizeof(double)) → 8"],
          ["%f  %.2f", "double", "printf(\"%.2f\", 3.14159) → 3.14"],
          ["%c", "char", "printf(\"%c\", 65) → A"],
          ["%s", tx(t, "cBas_sStr", "string"), "printf(\"%s\", \"hi\") → hi"],
          ["%x", tx(t, "cBas_sHex", "unsigned, in hexadecimal"), "printf(\"%x\", 255) → ff"],
          ["%p", tx(t, "cBas_sPtr", "an address (pointer)"), "printf(\"%p\", (void *)&a) → 0x7ffe4c"],
        ]}
      />

      <H2>{tx(t, "cBas_scanfTitle", "scanf: reading input")}</H2>
      <p>
        {tx(t, "cBas_scanfBody",
          "scanf is the reverse of printf: it reads text typed by the user and stores the numbers it finds. It needs to change your variable, so you give it the variable's address with &. The next chapter explains addresses fully. scanf returns how many values it managed to store, and you must check that number: if the user types \"abc\" where a number was expected, nothing is stored and the variable keeps its old value.")}
      </p>
      <CodeBlock lang="c" filename="read.c" t={t}>{`#include <stdio.h>

int main(void) {
    int age = 0;
    printf("Your age: ");
    if (scanf("%d", &age) != 1) {          // 1 = one value stored
        printf("That was not a number.\\n");
        return 1;                           // non-zero: report failure
    }
    printf("Next year you will be %d.\\n", age + 1);
    return 0;
}`}</CodeBlock>
      <Callout type="warn" t={t}>
        {tx(t, "cBas_scanfWarn",
          "Never read a word with a bare %s: scanf will write as many characters as the user types, past the end of your array. Always give a width one less than the array size, as in char name[32]; scanf(\"%31s\", name); The last byte is kept for the '\\0' that ends every C string.")}
      </Callout>

      <H2>{tx(t, "cBas_flowTitle", "Decisions, loops and functions")}</H2>
      <p>
        {tx(t, "cBas_flowBody",
          "The control flow of C is the same one C++, Java and JavaScript inherited: if / else, while, for, and functions. A function must be declared before it is called. When its definition comes later in the file, a prototype at the top (the first line of the function followed by a semicolon) tells the compiler its name, parameter types and return type.")}
      </p>
      <CodeBlock lang="c" filename="flow.c" t={t}>{`#include <stdio.h>

int square(int x);                 // prototype: the definition is below main

int main(void) {
    for (int i = 1; i <= 5; i++) {  // start; condition; step
        if (i % 2 == 0)
            printf("%d is even, squared %d\\n", i, square(i));
        else
            printf("%d is odd\\n", i);
    }
    return 0;
}

int square(int x) {
    return x * x;
}`}</CodeBlock>
      <H3>{tx(t, "cBas_vsCppTitle", "Things C does not have")}</H3>
      <p>
        {tx(t, "cBas_vsCppBody",
          "Coming from C++, or going there next, the differences are worth knowing. C has no classes, references, templates, exceptions, namespaces or overloading (two functions cannot share a name). There is no std::string or std::vector: text and lists are arrays you manage yourself. In return, a C program does exactly what its lines say, with nothing running behind your back. The last chapter of this section, From C to C++, shows how C++ builds its safer tools on top of these same boxes.")}
      </p>

      <H2>{tx(t, "cBas_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "cBas_try1", "Print sizeof of every type in the table above on your machine, with %zu. Do they match?")}</li>
        <li>{tx(t, "cBas_try2", "Read two ints with one scanf (\"%d %d\") and print their sum, whole-number quotient, remainder and exact quotient as a double.")}</li>
        <li>{tx(t, "cBas_try3", "Declare int x; without a value and print it. Compile with -Wall -Wextra, then with -O2 added. What do the warnings say?")}</li>
      </ol>

      <KeyIdeas t={t} id="cBas" items={[
        "A C program starts at main. The compiler preprocesses, compiles and links it into an executable.",
        "Compile with -Wall -Wextra and treat every warning as a bug.",
        "A type fixes a value's size in bytes and how its bits are read. sizeof reports the size.",
        "A local variable is a box in its function's stack frame. It holds garbage until you give it a value.",
        "int / int drops the fraction. Make one operand a double to keep it.",
        "printf specifiers must match the types. scanf needs addresses (&x), and its return value must be checked.",
      ]} />
    </Article>
  );
}
