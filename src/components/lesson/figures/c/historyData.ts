// ── Events of the C / C++ history timeline ────────────────────────────────────
// One entry per milestone, on the C lane or the C++ lane. Text is English with
// tx keys (figCHist_<id>_title / _who / _body); code samples are period code
// and are not translated.

export type Lane = "c" | "cpp";
export type HistEvent = {
  id: string;
  lane: Lane;
  year: number;
  title: string;
  who: string;
  body: string;
  code?: string;
};

export const EVENTS: HistEvent[] = [
  {
    id: "bcpl", lane: "c", year: 1967, title: "BCPL", who: "Martin Richards, Cambridge",
    body: "A small language for writing compilers. It had one type only: the machine word. Thompson and Ritchie used it at Bell Labs, and it is the grandparent of C.",
  },
  {
    id: "b", lane: "c", year: 1969, title: "Unix and the language B", who: "Ken Thompson, Bell Labs",
    body: "Thompson writes the first Unix in assembly on a spare PDP-7, then a cut-down BCPL for it, called B. B still has no types: every value is a word. This is the oldest surviving \"hello, world\", from Brian Kernighan's B tutorial, with the text packed four characters per word.",
    code: `main( ) {
  extrn a, b, c;
  putchar(a); putchar(b); putchar(c); putchar('!*n');
}

a 'hell';
b 'o, w';
c 'orld';`,
  },
  {
    id: "c", lane: "c", year: 1972, title: "C", who: "Dennis Ritchie, Bell Labs",
    body: "The new PDP-11 addresses single bytes, and a typeless language cannot tell a char from an int. Ritchie adds types to B, then structs and pointers to them. The result is named C, the letter after B.",
  },
  {
    id: "unixc", lane: "c", year: 1973, title: "Unix rewritten in C", who: "Thompson and Ritchie",
    body: "The Unix kernel is rewritten in C. An operating system in a high-level language was a bold idea then. It pays off at once: to move Unix to a new machine, you write a C compiler for it and recompile.",
  },
  {
    id: "kr", lane: "c", year: 1978, title: "The C Programming Language", who: "Brian Kernighan and Dennis Ritchie",
    body: "The book everyone calls \"K&R\". For eleven years it is the only definition of C. Its first example made \"hello, world\" the first program of almost every language since. Functions declared their parameter types on separate lines.",
    code: `main()
{
    printf("hello, world\\n");
}

int add(a, b)       /* K&R style parameters */
int a, b;
{
    return a + b;
}`,
  },
  {
    id: "classes", lane: "cpp", year: 1979, title: "C with Classes", who: "Bjarne Stroustrup, Bell Labs",
    body: "Stroustrup arrives at Bell Labs from a PhD at Cambridge. There he had loved Simula's classes but found its programs too slow, and found BCPL fast but painful. He sets out to add classes to C without losing C's speed. Constructors, destructors, public and private arrive first.",
  },
  {
    id: "cpp", lane: "cpp", year: 1983, title: "The name C++", who: "suggested by Rick Mascitti",
    body: "The language gets its name: ++ is C's increment operator, so C++ is \"one more than C\". Virtual functions, overloading, references and const are added around this time.",
  },
  {
    id: "cfront", lane: "cpp", year: 1985, title: "Cfront and the book", who: "Bjarne Stroustrup",
    body: "The first commercial release, together with the book The C++ Programming Language. The compiler, Cfront, translates C++ into C, so C++ runs anywhere a C compiler exists. It spreads fast for that reason.",
  },
  {
    id: "c89", lane: "c", year: 1989, title: "ANSI C (C89)", who: "ANSI committee X3J11",
    body: "C becomes an official standard, adopted by ISO in 1990 as C90. Prototypes, borrowed back from C++, let the compiler check every call's arguments. void, const and the standard library are fixed.",
    code: `#include <stdio.h>

int add(int a, int b);     /* prototype: checked calls */

int main(void)
{
    printf("%d\\n", add(2, 3));
    return 0;
}`,
  },
  {
    id: "cpp2", lane: "cpp", year: 1989, title: "C++ 2.0", who: "AT&T",
    body: "Multiple inheritance, abstract classes and static member functions. Templates and exceptions follow in the next few years, and a standards committee forms.",
  },
  {
    id: "stl", lane: "cpp", year: 1994, title: "The STL", who: "Alexander Stepanov and Meng Lee",
    body: "Stepanov's Standard Template Library is voted into the draft standard: generic containers (vector, list, map), iterators and algorithms (sort, find) that work on any of them. It reshapes the whole language around generic code.",
  },
  {
    id: "cpp98", lane: "cpp", year: 1998, title: "C++98, the first ISO standard", who: "ISO/IEC 14882:1998",
    body: "C++ is standardised with templates, exceptions, namespaces and the STL. C++03 (2003) only fixes defects. Then the committee works for eight years on a large revision.",
    code: `#include <iostream>
#include <vector>

int main()
{
    std::vector<int> v;
    v.push_back(3);
    v.push_back(4);
    for (std::vector<int>::size_type i = 0; i < v.size(); ++i)
        std::cout << v[i] << std::endl;
    return 0;
}`,
  },
  {
    id: "c99", lane: "c", year: 1999, title: "C99", who: "ISO/IEC 9899:1999",
    body: "// comments, long long, <stdint.h>, bool, declarations anywhere in a block, designated initialisers and variable-length arrays.",
    code: `#include <stdint.h>

struct point { int x, y; };

int64_t sum(void) {
    int64_t total = 0;                  // a 64-bit int, by name
    for (int i = 0; i < 10; i++)        // i declared in the loop
        total += i;
    struct point p = { .y = 2, .x = 1 };   // fields by name
    return total + p.x + p.y;
}`,
  },
  {
    id: "cpp11", lane: "cpp", year: 2011, title: "C++11", who: "ISO/IEC 14882:2011",
    body: "So large that Stroustrup said it feels like a new language: move semantics, auto, lambdas, range-for, smart pointers, threads, nullptr. Afterwards the committee ships a new standard every three years.",
    code: `#include <iostream>
#include <memory>
#include <vector>

int main() {
    std::vector<int> v{3, 4};
    auto sq = [](int x) { return x * x; };
    for (int x : v) std::cout << sq(x) << '\\n';
    auto p = std::make_unique<int>(42);    // freed automatically
}`,
  },
  {
    id: "c11", lane: "c", year: 2011, title: "C11", who: "ISO/IEC 9899:2011",
    body: "Threads and atomics in the standard library, _Generic for type-based selection, _Static_assert, and the bounds-checked functions as an option. C17 (2018) is a bug-fix release of it.",
  },
  {
    id: "cpp20", lane: "cpp", year: 2020, title: "C++20", who: "ISO/IEC 14882:2020",
    body: "The biggest step since C++11: concepts (named requirements on templates), ranges, modules, coroutines, the three-way comparison <=> and std::format.",
  },
  {
    id: "c23", lane: "c", year: 2024, title: "C23", who: "ISO/IEC 9899:2024",
    body: "bool, true, false and nullptr become keywords, typeof and constexpr objects arrive, #embed pastes a binary file into an array, and binary literals and digit separators make numbers easier to read.",
    code: `constexpr int size = 1'000;        // digit separator
unsigned char mask = 0b1010'0101;   // binary literal
int *p = nullptr;
static const unsigned char icon[] = {
#embed "icon.png"                   // the file's bytes, at compile time
};`,
  },
  {
    id: "cpp23", lane: "cpp", year: 2024, title: "C++23", who: "ISO/IEC 14882:2024",
    body: "import std replaces every standard #include, std::println prints formatted text, std::expected returns a value or an error, and mdspan views multi-dimensional data.",
    code: `import std;

int main() {
    std::vector<int> v{3, 4};
    for (int x : v) std::println("{}", x * x);
}`,
  },
  {
    id: "cpp26", lane: "cpp", year: 2026, title: "C++26", who: "ISO/IEC 14882:2026 (expected)",
    body: "Static reflection lets a program inspect its own types while compiling. Contracts state a function's preconditions in its declaration. std::execution brings a model for asynchronous work.",
  },
];
