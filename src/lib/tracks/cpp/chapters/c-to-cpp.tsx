"use client";

// From C to C++: the same program in both languages; each C problem met in
// the C chapters and the C++ tool that answers it (with the chapter that
// teaches it); references; destructors and std::vector as the automated IntVec
// (memory figure); a FILE wrapper class; zero overhead (std::sort vs qsort);
// C habits to drop; mixing C and C++ (extern "C", name mangling).

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { MemoryBoxFigure } from "@/components/lesson/figures/c/MemoryBoxFigure";

export function CToCppContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "cCpp_intro",
          "You now know C's model of the machine, and you have met its costs. Every malloc needs a free on every path. Arrays forget their length. Strings depend on a zero byte. Error codes are easy to ignore. None of these is a mistake in C's design: C simply does no bookkeeping you did not write. C++ keeps the same model, the same boxes at the same addresses, and adds ways to make the compiler do the bookkeeping for you, without making the program slower. This chapter puts the two side by side and maps each C problem to the C++ tool that answers it, and to the chapter of this track that teaches it.")}
      </Lead>

      <Goals t={t} id="cCpp" items={[
        "Name the C problem that each main C++ feature was made to solve.",
        "Use a reference where C would pass a pointer.",
        "Explain how a destructor makes a std::vector free its own memory.",
        "Replace common C habits with their C++ equivalents.",
        "Call C code from C++ with extern \"C\".",
      ]} />

      <H2>{tx(t, "cCpp_sameTitle", "One program, two languages")}</H2>
      <p>
        {tx(t, "cCpp_sameBody",
          "Both programs read lines of the form \"name score\" from standard input, sort the players by score and print them. Look at what the C version must manage by hand, and at what each line could get wrong.")}
      </p>
      <CodeBlock lang="c" filename="ranking.c" t={t}>{`#include <stdio.h>
#include <stdlib.h>

typedef struct { char name[32]; int score; } Player;

static int by_score(const void *a, const void *b) {      // qsort sees only void *
    return ((const Player *)b)->score - ((const Player *)a)->score;
}

int main(void) {
    Player *all = NULL;
    size_t n = 0, cap = 0;
    Player p;
    while (scanf("%31s %d", p.name, &p.score) == 2) {    // width 31: room for '\\0'
        if (n == cap) {
            cap = cap ? cap * 2 : 8;
            Player *tmp = realloc(all, cap * sizeof *tmp);
            if (!tmp) { free(all); return 1; }
            all = tmp;
        }
        all[n++] = p;
    }
    qsort(all, n, sizeof *all, by_score);
    for (size_t i = 0; i < n; i++) printf("%s %d\\n", all[i].name, all[i].score);
    free(all);                                           // on every path
    return 0;
}`}</CodeBlock>
      <CodeBlock lang="cpp" filename="ranking.cpp" t={t}>{`#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

struct Player { std::string name; int score; };          // any length of name

int main() {
    std::vector<Player> all;                             // grows by itself
    Player p;
    while (std::cin >> p.name >> p.score)
        all.push_back(p);
    std::sort(all.begin(), all.end(),
              [](const Player& a, const Player& b) { return a.score > b.score; });
    for (const Player& q : all) std::cout << q.name << ' ' << q.score << '\\n';
}                                                        // all memory freed here`}</CodeBlock>
      <p>
        {tx(t, "cCpp_sameAfter",
          "The C++ version has no capacity, no realloc, no free, no name length limit and no casts from void *. Each of those was a place for a bug in C. It is not slower either: std::sort usually beats qsort, as explained below.")}
      </p>

      <H2>{tx(t, "cCpp_mapTitle", "Each C problem and its C++ answer")}</H2>
      <LessonTable
        headers={[tx(t, "cCpp_hProb", "In C you had to…"), tx(t, "cCpp_hTool", "C++ gives you"), tx(t, "cCpp_hWhere", "Taught in")]}
        rows={[
          [tx(t, "cCpp_p1", "remember free, fclose and every destroy function"), tx(t, "cCpp_t1", "destructors: cleanup runs automatically at the end of scope (RAII)"), tx(t, "cCpp_w1", "RAII & Smart Pointers")],
          [tx(t, "cCpp_p2", "pass every array with its length, grow it with realloc"), "std::vector, std::span", tx(t, "cCpp_w2", "Vocabulary Types, Ranges")],
          [tx(t, "cCpp_p3", "keep a '\\0' and size every buffer"), "std::string, std::string_view", tx(t, "cCpp_w3", "Vocabulary Types")],
          [tx(t, "cCpp_p4", "pass a pointer so a function can change your variable"), tx(t, "cCpp_t4", "references (T&)"), tx(t, "cCpp_w4", "below")],
          [tx(t, "cCpp_p5", "check error codes that are easy to ignore"), tx(t, "cCpp_t5", "exceptions, std::expected"), tx(t, "cCpp_w5", "Error Handling")],
          [tx(t, "cCpp_p6", "write generic code with void * or macros"), tx(t, "cCpp_t6", "templates and concepts, checked by the compiler"), tx(t, "cCpp_w6", "Templates, Concepts")],
          [tx(t, "cCpp_p7", "tag unions by hand"), "std::variant, std::optional", tx(t, "cCpp_w7", "Vocabulary Types")],
          [tx(t, "cCpp_p8", "use #define for constants and tables"), "constexpr", tx(t, "cCpp_w8", "Compile-Time C++")],
          [tx(t, "cCpp_p9", "prefix every name (vec_len) to avoid clashes"), tx(t, "cCpp_t9", "namespaces (math::length)"), tx(t, "cCpp_w9", "Modules & Build Hygiene")],
        ]}
      />

      <H2>{tx(t, "cCpp_refTitle", "References: an alias instead of an address")}</H2>
      <p>
        {tx(t, "cCpp_refBody",
          "A reference is a second name for an existing variable. Declared as int &a, it must be bound to a variable when it is created, it can never be NULL, and it can never be changed to refer to something else. Under the hood the compiler passes an address, exactly like the pointer version of swap, but the code reads like plain variables and there is no NULL to check.")}
      </p>
      <CodeBlock lang="cpp" filename="swap.cpp" t={t}>{`void swap_c(int *a, int *b) { int t = *a; *a = *b; *b = t; }   // C: swap_c(&x, &y)
void swap(int &a, int &b)    { int t = a;  a = b;   b = t;  }   // C++: swap(x, y)

void print(const Player &p);   // const&: no copy, and the function cannot change p`}</CodeBlock>

      <H2>{tx(t, "cCpp_dtorTitle", "Destructors: the bookkeeping, automated")}</H2>
      <p>
        {tx(t, "cCpp_dtorBody",
          "In the memory chapter you wrote IntVec with vec_create and vec_destroy, and the whole difficulty was calling vec_destroy on every path. A C++ class can have a constructor, which runs when an object is created, and a destructor, which runs when it goes out of scope. The compiler inserts the destructor call itself: at the closing brace, at every return, and when an exception passes through. std::vector is IntVec with a destructor. Step through it and compare with the C chapter.")}
      </p>
      <MemoryBoxFigure t={t} programs={["vector"]} />
      <p>
        {tx(t, "cCpp_fileBody",
          "The same trick works for any resource. Here is a FILE * wrapped in a class, so a file can no longer be left open.")}
      </p>
      <CodeBlock lang="cpp" filename="file.cpp" t={t}>{`#include <cstdio>

class File {
public:
    File(const char *path, const char *mode) : f_(std::fopen(path, mode)) {}   // constructor: open
    ~File() { if (f_) std::fclose(f_); }                                       // destructor: close
    File(const File &) = delete;              // no copies: two Files would close the same FILE twice
    File &operator=(const File &) = delete;
    std::FILE *get() const { return f_; }
    explicit operator bool() const { return f_ != nullptr; }
private:
    std::FILE *f_;
};

int count_lines(const char *path) {
    File f(path, "r");
    if (!f) return -1;                        // returns early: ~File still runs (nothing to close)
    int n = 0;
    for (int c; (c = std::fgetc(f.get())) != EOF; ) n += (c == '\\n');
    return n;                                 // ~File closes the file here
}`}</CodeBlock>

      <H2>{tx(t, "cCpp_zeroTitle", "Not slower: zero overhead")}</H2>
      <p>
        {tx(t, "cCpp_zeroBody",
          "None of this costs speed. Indexing a std::vector compiles to the same instruction as indexing a C array. The destructor call is the same free you would have written. std::sort is usually faster than qsort: qsort calls the comparison through a function pointer for every pair, while std::sort is a template, so the compiler sees the comparison and inlines it into the sorting loop. This is Stroustrup's zero-overhead rule from the history chapter, at work.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "cCpp_costNote",
          "C++ has costs of other kinds: a much larger language, slower compilation, and features (exceptions, virtual functions, shared_ptr) with real run-time costs that you choose to pay. Later chapters say which ones cost what.")}
      </Callout>

      <H2>{tx(t, "cCpp_habitsTitle", "C habits to leave behind")}</H2>
      <LessonTable
        headers={[tx(t, "cCpp_hC", "C habit"), tx(t, "cCpp_hCpp", "In C++")]}
        rows={[
          ["malloc / free", tx(t, "cCpp_h1", "std::vector, std::make_unique: no raw new and delete either")],
          ["char buf[64]", "std::string"],
          ["NULL", "nullptr"],
          ["(int)x", tx(t, "cCpp_h4", "static_cast<int>(x): visible, searchable, and limited to safe conversions")],
          ["#define N 64", "constexpr int N = 64;"],
          ["printf(\"%d\", x)", tx(t, "cCpp_h6", "std::print(\"{}\", x) (C++23), type-checked")],
          [tx(t, "cCpp_h7c", "out-parameters (int *result)"), tx(t, "cCpp_h7", "return the value; return a struct, std::optional or std::expected for several results or failure")],
        ]}
      />

      <H2>{tx(t, "cCpp_externTitle", "Mixing the two: extern \"C\"")}</H2>
      <p>
        {tx(t, "cCpp_externBody",
          "C++ allows two functions with the same name and different parameters, so its compiler encodes the parameter types into each symbol name. This is name mangling: vec_len(Vec) becomes a symbol such as _Z7vec_len3Vec. C does not do this; the symbol is just vec_len. To call a C library from C++, its declarations must be marked extern \"C\", which tells the C++ compiler to use plain C names. Headers meant for both languages do it themselves; open SDL.h or vulkan.h and you will find exactly this.")}
      </p>
      <CodeBlock lang="c" filename="vec.h" t={t}>{`#ifdef __cplusplus        /* defined only when a C++ compiler reads this */
extern "C" {
#endif

float vec_len(Vec v);

#ifdef __cplusplus
}
#endif`}</CodeBlock>

      <H2>{tx(t, "cCpp_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "cCpp_try1", "Compile ranking.c as C++ (g++ -x c++ ranking.c). What does the compiler reject, and why?")}</li>
        <li>{tx(t, "cCpp_try2", "Run nm on a .o compiled from C and the same file compiled as C++. Find the mangled names, and decode one with c++filt.")}</li>
        <li>{tx(t, "cCpp_try3", "Add a member function lines() to the File class and use it in two places. Put an early return in one of them and check, with ASan's leak checker, that no file stays open.")}</li>
      </ol>

      <KeyIdeas t={t} id="cCpp" items={[
        "C++ keeps C's memory model and adds tools that let the compiler do the bookkeeping.",
        "Destructors run automatically at the end of a scope, so cleanup cannot be forgotten: that is RAII.",
        "std::vector and std::string replace manual arrays and '\\0' strings; references replace most pointer parameters.",
        "These tools cost nothing extra at run time; std::sort even beats qsort.",
        "C++ mangles names; extern \"C\" lets C++ call C libraries such as SDL and Vulkan.",
      ]} />
    </Article>
  );
}
