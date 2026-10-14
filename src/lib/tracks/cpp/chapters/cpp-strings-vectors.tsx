"use client";

// First steps in C++ 4: std::string (building, comparing, searching, slicing,
// numbers ↔ text, c_str for C APIs, reading lines, the small-string
// optimisation); std::vector (creating it, the {100} vs (100) trap, the main
// operations, loops by value / reference); inside a vector (size, capacity,
// growth factor, reserve: figure); invalidated pointers and references;
// [] vs at() and debug checks; first algorithms (sort, find, erase); passing
// and returning them; a high-score table that puts it all together.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { VectorGrowthFigure } from "@/components/lesson/figures/cpp/VectorGrowthFigure";

export function CppStringsVectorsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "cppSv_intro",
          "Almost every program handles text and lists. In C, a piece of text was an array of chars whose size you had to guess in advance, with a zero byte you had to keep in place. A list was a pointer, a length and a capacity, grown with realloc and freed by hand. You wrote both in the C chapters, and you saw how many ways they break. C++ gives you two types that do all of that bookkeeping: std::string for text and std::vector for lists. They are the first thing to reach for, and you will use them in nearly every program from now on.")}
      </Lead>

      <Goals t={t} id="cppSv" items={[
        "Build, compare, search and slice text with std::string.",
        "Create a std::vector, add and remove elements, and loop over it.",
        "Explain size, capacity and reallocation, and use reserve.",
        "Avoid the two classic vector bugs: reading out of bounds and keeping a pointer across a reallocation.",
      ]} />

      <H2>{tx(t, "cppSv_strTitle", "std::string: text that manages itself")}</H2>
      <CodeBlock lang="cpp" filename="strings.cpp" t={t}>{`#include <print>
#include <string>

int main() {
    std::string name = "Ada";
    std::string greeting = "Hello, " + name + "!";   // + joins strings
    greeting += " Welcome back.";                    // += appends

    std::println("{} ({} chars)", greeting, greeting.size());
    if (name == "Ada") std::println("same text");    // == compares the text
    char first = name[0];                            // 'A'
}`}</CodeBlock>
      <p>
        {tx(t, "cppSv_strBody",
          "There is no size to choose and no '\\0' to look after. The string allocates more memory as it grows, frees it in its destructor, and == compares the characters, not the addresses, so the strcmp mistakes of C are gone.")}
      </p>
      <LessonTable
        headers={[tx(t, "cppSv_hOp", "Operation"), tx(t, "cppSv_hDoes", "What it does")]}
        rows={[
          ["s.size(), s.empty()", tx(t, "cppSv_s1", "Number of characters (bytes, in fact); whether there are none.")],
          ["s + t, s += t", tx(t, "cppSv_s2", "Join two strings into a new one; append to s.")],
          ["s == t, s < t", tx(t, "cppSv_s3", "Compare text; < is alphabetical (by character code), so strings sort.")],
          ["s[i], s.at(i)", tx(t, "cppSv_s4", "The character at position i, counting from 0. at() checks the position first; [] does not.")],
          ["s.find(\"x\")", tx(t, "cppSv_s5", "Position of the first \"x\", or std::string::npos (a special \"not found\" value) when there is none.")],
          ["s.substr(pos, n)", tx(t, "cppSv_s6", "A new string with n characters starting at pos.")],
          ["s.starts_with(\"x\"), s.contains(\"x\")", tx(t, "cppSv_s7", "Yes/no questions about the text (C++20 and C++23).")],
          ["std::to_string(42), std::stoi(\"42\")", tx(t, "cppSv_s8", "Number to text, text to int. stoi stops with an error (an exception) if the text is not a number.")],
          ["s.c_str()", tx(t, "cppSv_s9", "A const char* to a '\\0'-terminated copy of the text, for C functions such as SDL_SetWindowTitle or fopen.")],
          ["std::getline(std::cin, s)", tx(t, "cppSv_s10", "Reads one whole line of input into s, however long it is.")],
        ]}
      />
      <CodeBlock lang="cpp" filename="path.cpp" t={t}>{`std::string path = "assets/textures/brick.png";
auto slash = path.rfind('/');                 // last '/', searching from the end
auto dot   = path.rfind('.');
std::string file = path.substr(slash + 1);                  // "brick.png"
std::string ext  = path.substr(dot + 1);                    // "png"
std::string stem = path.substr(slash + 1, dot - slash - 1); // "brick"`}</CodeBlock>
      <Callout type="info" t={t}>
        {tx(t, "cppSv_ssoNote",
          "Short strings do not touch the heap at all. A std::string object is about 32 bytes, and when the text fits inside it (up to about 15 to 22 characters, depending on the library), it is stored right there. This is the small-string optimisation, and it is why names, keys and file extensions are cheap.")}
      </Callout>

      <H2>{tx(t, "cppSv_vecTitle", "std::vector: a list that grows")}</H2>
      <p>
        {tx(t, "cppSv_vecBody",
          "std::vector<T> holds any number of values of type T, side by side in memory, exactly like a C array. The type between the angle brackets says what it holds: std::vector<int>, std::vector<std::string>, std::vector<Enemy>. That angle-bracket syntax belongs to templates, a later chapter; for now, read it as \"a vector of\".")}
      </p>
      <CodeBlock lang="cpp" filename="vectors.cpp" t={t}>{`#include <vector>

std::vector<int>   scores;                 // empty
std::vector<int>   primes{2, 3, 5, 7};     // four elements
std::vector<float> heights(100);           // 100 elements, all 0.0f
std::vector<float> one{100};               // ONE element: 100.0f

scores.push_back(40);                      // add at the end: {40}
scores.push_back(75);                      // {40, 75}
int best = scores[1];                      // 75
scores.pop_back();                         // remove the last: {40}

int total = 0;
for (int p : primes) total += p;           // each element, copied into p
for (float& h : heights) h = 1.5f;         // each element, by reference: changes it
for (const auto& name : names) print(name);// big elements: no copy, no change`}</CodeBlock>
      <Callout type="warn" t={t}>
        {tx(t, "cppSv_braceWarn",
          "Parentheses and braces mean different things for a vector. heights(100) asks for 100 elements; one{100} asks for a vector holding the single value 100. The braces form is a list of initial elements. When you mean a count, use parentheses.")}
      </Callout>
      <LessonTable
        headers={[tx(t, "cppSv_hOp", "Operation"), tx(t, "cppSv_hDoes", "What it does"), tx(t, "cppSv_hCost", "Cost")]}
        rows={[
          ["v.push_back(x)", tx(t, "cppSv_v1", "Adds x at the end."), tx(t, "cppSv_v1c", "fast (sometimes a reallocation, see below)")],
          ["v.emplace_back(args…)", tx(t, "cppSv_v2", "Builds the new element in place from constructor arguments: v.emplace_back(\"Ada\", 9000)."), tx(t, "cppSv_v1c", "fast (sometimes a reallocation, see below)")],
          ["v.size(), v.empty()", tx(t, "cppSv_v3", "Number of elements; whether there are none."), tx(t, "cppSv_free", "free")],
          ["v[i], v.at(i)", tx(t, "cppSv_v4", "Element i. at() checks i < size() and reports an error otherwise; [] does not check."), tx(t, "cppSv_free", "free")],
          ["v.front(), v.back()", tx(t, "cppSv_v5", "First and last element (the vector must not be empty)."), tx(t, "cppSv_free", "free")],
          ["v.pop_back(), v.clear()", tx(t, "cppSv_v6", "Remove the last element; remove all of them. The memory is kept."), tx(t, "cppSv_fast", "fast")],
          ["v.insert(pos, x), v.erase(pos)", tx(t, "cppSv_v7", "Add or remove in the middle. Every element after pos has to shift by one."), tx(t, "cppSv_slow", "slow for long vectors")],
        ]}
      />

      <H2>{tx(t, "cppSv_insideTitle", "Inside a vector: size and capacity")}</H2>
      <p>
        {tx(t, "cppSv_insideBody",
          "A vector is the IntVec you wrote in C, finished. On the stack it is three values: a pointer to a heap block, the size (how many elements are in use) and the capacity (how many fit in the block). While size is below capacity, push_back just writes into the spare room. When the block is full, it allocates a bigger one, copies every element across and frees the old block. Push a few elements and watch the counters.")}
      </p>
      <VectorGrowthFigure t={t} />
      <p>
        {tx(t, "cppSv_amortBody",
          "Copying everything on each reallocation sounds expensive, but the capacity grows by a factor, not by one. With doubling, filling a vector to 1 000 elements allocates only 11 blocks (1, 2, 4, … 1 024 elements) and copies 1 023 elements in total: on average each push_back costs a constant amount of work. This is called amortised constant time. When you know roughly how many elements are coming, v.reserve(n) allocates once up front and removes the copying altogether.")}
      </p>

      <H3>{tx(t, "cppSv_invalTitle", "Pointers into a vector can go stale")}</H3>
      <p>
        {tx(t, "cppSv_invalBody",
          "When a vector reallocates, its elements move to new addresses. Any pointer or reference you kept to an element still holds the old address, which now belongs to freed memory. The break-it button in the figure shows it. The same applies to the positions called iterators, which you will meet with the algorithms below.")}
      </p>
      <CodeBlock lang="cpp" filename="stale.cpp" t={t}>{`std::vector<Enemy> enemies(3);
Enemy& boss = enemies[0];
enemies.push_back(Enemy{});    // may reallocate: boss now refers to freed memory
boss.hp = 0;                   // undefined behaviour

for (Enemy& e : enemies)
    if (e.splits) enemies.push_back(e.half());   // also broken: the loop's position goes stale`}</CodeBlock>
      <p>
        {tx(t, "cppSv_invalFix",
          "The fixes are simple: keep an index (size_t i) instead of a pointer, because an index stays valid when the block moves; or reserve enough capacity first; or collect the new elements in a second vector and append them after the loop.")}
      </p>

      <H3>{tx(t, "cppSv_boundsTitle", "[] does not check, at() does")}</H3>
      <p>
        {tx(t, "cppSv_boundsBody",
          "v[10] on a vector of 3 elements is the same out-of-bounds read as in C: undefined behaviour, no message. v.at(10) checks and stops the program with a std::out_of_range error (an exception; a later chapter shows how to catch it). [] stays unchecked because checking every access in a hot loop costs time. During development you can switch the checks on for [] too: build with -D_GLIBCXX_ASSERTIONS on GCC, or in a Debug configuration with MSVC.")}
      </p>

      <H2>{tx(t, "cppSv_algoTitle", "A first taste of the algorithms")}</H2>
      <p>
        {tx(t, "cppSv_algoBody",
          "The header <algorithm> has ready-made loops for the jobs you would otherwise write by hand: sorting, searching, counting, removing. The std::ranges versions take the whole container. The older versions take two positions, v.begin() and v.end(), which mark the first element and the place just past the last; you will see both styles in real code.")}
      </p>
      <CodeBlock lang="cpp" filename="algorithms.cpp" t={t}>{`#include <algorithm>
#include <vector>

std::vector<int> v{5, 3, 9, 1, 3};
std::ranges::sort(v);                         // {1, 3, 3, 5, 9}
std::sort(v.begin(), v.end());                // the same, older style
auto it = std::ranges::find(v, 9);            // position of 9, or v.end()
bool has9 = it != v.end();
auto threes = std::ranges::count(v, 3);       // 2
std::erase(v, 3);                             // remove every 3: {1, 5, 9} (C++20)`}</CodeBlock>

      <H2>{tx(t, "cppSv_passTitle", "Passing and returning them")}</H2>
      <p>
        {tx(t, "cppSv_passBody",
          "Strings and vectors follow the rule from the references chapter: pass them as const& when the function only reads them, as & when it changes the caller's copy. Returning one by value is fine, even a large one: the compiler either builds it directly in the caller's variable or moves it, handing over the heap block without copying a single element. The chapter on move semantics explains how.")}
      </p>
      <CodeBlock lang="cpp" filename="scores.cpp" t={t}>{`#include <algorithm>
#include <print>
#include <string>
#include <vector>

struct Score { std::string name; int points; };

std::vector<Score> top(const std::vector<Score>& all, std::size_t n) {
    std::vector<Score> best = all;                     // our own copy to sort
    std::ranges::sort(best, [](const Score& a, const Score& b) {
        return a.points > b.points;                    // highest first
    });
    if (best.size() > n) best.resize(n);               // keep the first n
    return best;                                       // moved out, not copied
}

int main() {
    std::vector<Score> all{{"Ada", 9000}, {"Linus", 4200}, {"Grace", 12000}};
    all.emplace_back("Dennis", 7000);
    for (const Score& s : top(all, 3))
        std::println("{:<8}{:>6}", s.name, s.points);
}`}</CodeBlock>
      <p>
        {tx(t, "cppSv_scoresAfter",
          "The part in square brackets is a lambda: a small unnamed function written right where it is needed, here to tell sort which of two scores comes first. Lambdas get a chapter of their own. In {:<8} and {:>6}, the < and > align the text left or right in a field 8 or 6 characters wide, so the table lines up.")}
      </p>

      <H2>{tx(t, "cppSv_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "cppSv_try1", "Read lines with std::getline until the input ends, store them in a std::vector<std::string>, then print them in reverse order with their line numbers.")}</li>
        <li>{tx(t, "cppSv_try2", "Write std::string extension(const std::string& path) that returns \"\" when the path has no dot. Test it with \"Makefile\" and \"archive.tar.gz\".")}</li>
        <li>{tx(t, "cppSv_try3", "Push 1 000 000 ints into a vector and print size() and capacity() each time the capacity changes. Count the reallocations, then add a reserve and count again.")}</li>
        <li>{tx(t, "cppSv_try4", "Write the broken boss example, build it with -fsanitize=address and read the report. Then fix it with an index.")}</li>
      </ol>

      <KeyIdeas t={t} id="cppSv" items={[
        "std::string owns its text: no fixed size, no '\\0' to manage, == compares content; c_str() hands it to C APIs.",
        "std::vector<T> keeps elements side by side like a C array, and grows by itself.",
        "Size counts the elements in use, capacity the room in the block; reserve(n) allocates once up front.",
        "Reallocation moves the elements: pointers and references into a vector go stale. Keep indices instead.",
        "[] does not check bounds, at() does; parentheses give a count, braces give the elements.",
        "Pass them by const& or &, return them by value: moving makes it cheap.",
      ]} />
    </Article>
  );
}
