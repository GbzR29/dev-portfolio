"use client";

// Standard Library 1: ranges and views. Starts from a HUD that wants the
// names of the first three living enemies in range, written as a hand loop
// and with C++98 algorithms; then iterators and half-open ranges, the
// two-iterator mistake, range algorithms with projections, views and the pipe,
// laziness (figure: the pipeline pulled one element at a time, against one
// vector per stage), the views worth knowing, ranges::to, and the traps:
// dangling results, const filter views, changing elements under a filter, and
// slow debug builds.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { PipelineFigure } from "@/components/lesson/figures/cpp/PipelineFigure";

export function RangesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "cppRng_intro",
          "The HUD of a game wants the names of the first three living enemies within 50 metres. As a loop, that is a for with two ifs, a counter and a break, and the question is buried in the mechanics. With the C++98 algorithms it is worse: copy_if into one vector, transform into another, then cut it to three, with begin() and end() written six times. Ranges, added in C++20, let you write the question as it sounds: the enemies, filtered, mapped to names, the first three. This chapter shows how that works, why it does less work than the loop you would expect, and where it can bite.")}
      </Lead>

      <Goals t={t} id="cppRng" items={[
        "Explain what an iterator pair and a half-open range are.",
        "Call range algorithms on whole containers, with projections.",
        "Build a lazy pipeline with views and predict which elements it reads.",
        "Turn a view back into a container, and avoid views that dangle.",
      ]} />

      <H2>{tx(t, "cppRng_oldTitle", "The same question, three ways")}</H2>
      <CodeBlock lang="cpp" filename="hud.cpp" t={t}>{`struct Enemy { std::string name; int hp; float distance; };
std::vector<Enemy> enemies = load_enemies();

// 1. A hand loop
std::vector<std::string> names;
for (const Enemy& e : enemies) {
    if (e.hp <= 0) continue;
    if (e.distance > 50.0f) continue;
    names.push_back(e.name);
    if (names.size() == 3) break;
}

// 2. C++98 algorithms: two temporary vectors, every enemy checked
std::vector<Enemy> near;
std::copy_if(enemies.begin(), enemies.end(), std::back_inserter(near),
             [](const Enemy& e) { return e.hp > 0 && e.distance <= 50.0f; });
std::vector<std::string> names2;
std::transform(near.begin(), near.end(), std::back_inserter(names2),
               [](const Enemy& e) { return e.name; });
if (names2.size() > 3) names2.resize(3);

// 3. Ranges (C++20): the question as one expression
auto names3 = enemies
    | std::views::filter([](const Enemy& e) { return e.hp > 0 && e.distance <= 50.0f; })
    | std::views::transform(&Enemy::name)
    | std::views::take(3);`}</CodeBlock>
      <p>
        {tx(t, "cppRng_oldBody",
          "The loop is fast but hard to read: you have to run it in your head to see what it computes. The algorithms say what they do, but they allocate two vectors and check all thousand enemies even though three were enough. The ranges version reads like the sentence and, as the figure below will show, stops as soon as it has three names. Before views, though, the vocabulary they are built on.")}
      </p>

      <H2>{tx(t, "cppRng_itTitle", "Iterators and half-open ranges")}</H2>
      <p>
        {tx(t, "cppRng_itBody",
          "An iterator is an object that marks a position in a sequence: *it reads the element there, ++it moves to the next one. For a vector it is a thin wrapper around a pointer. v.begin() is the position of the first element and v.end() is the position just after the last one, where nothing may be read. Together they describe a half-open range, written [begin, end): begin is included, end is not.")}
      </p>
      <LessonTable
        headers={[tx(t, "cppRng_hPiece", "Piece"), tx(t, "cppRng_hMeans", "What it means")]}
        rows={[
          ["*it", tx(t, "cppRng_i1", "The element at the position, like *p for a pointer.")],
          ["++it", tx(t, "cppRng_i2", "Move to the next position.")],
          ["it != v.end()", tx(t, "cppRng_i3", "Not past the last element yet: the loop may continue.")],
          ["[begin, end)", tx(t, "cppRng_i4", "Half-open: an empty range is simply begin == end, and the number of elements is end − begin. No special cases.")],
        ]}
      />
      <CodeBlock lang="cpp" filename="two_iterators.cpp" t={t}>{`std::vector<int> a{5, 3, 1}, b{9, 7};
std::sort(a.begin(), a.end());    // fine
std::sort(a.begin(), b.end());    // compiles. Walks from a's memory into b's: undefined behaviour`}</CodeBlock>
      <p>
        {tx(t, "cppRng_itBug",
          "Every classic algorithm takes a pair of iterators, so every call repeats the container twice, and nothing checks that both iterators belong to the same container. A range is anything that has a begin() and an end(): a vector, a string, an array, or a view. Passing one object instead of two removes the mistake.")}
      </p>

      <H2>{tx(t, "cppRng_algoTitle", "Range algorithms")}</H2>
      <CodeBlock lang="cpp" filename="algorithms.cpp" t={t}>{`#include <algorithm>

std::ranges::sort(enemies, {}, &Enemy::hp);                // sort by hp, lowest first
auto it  = std::ranges::find(enemies, "Ogre", &Enemy::name); // first enemy named Ogre
int dead = std::ranges::count_if(enemies, [](const Enemy& e) { return e.hp <= 0; });
auto top = std::ranges::max(enemies, {}, &Enemy::hp);        // a copy of the strongest

if (it != enemies.end()) std::println("{} has {} hp", it->name, it->hp);`}</CodeBlock>
      <p>
        {tx(t, "cppRng_algoBody",
          "Every algorithm in <algorithm> has a twin in the std::ranges namespace that takes the range itself. Most also take a projection: a function applied to each element before it is compared. &Enemy::hp is a pointer to a member, and used as a projection it means \"look at e.hp\". It replaces the lambda you used to write just to say which field to compare.")}
      </p>
      <LessonTable
        headers={[tx(t, "cppRng_hArg", "Argument"), tx(t, "cppRng_hMeans", "What it means")]}
        rows={[
          ["enemies", tx(t, "cppRng_a1", "The range: the whole vector, no begin/end pair.")],
          ["{}", tx(t, "cppRng_a2", "The comparison, left at its default: std::ranges::less, which is a < b. The braces make a default-constructed one.")],
          ["&Enemy::hp", tx(t, "cppRng_a3", "The projection: compare e.hp instead of the whole Enemy. Any function or lambda works too.")],
          ["\"Ogre\"", tx(t, "cppRng_a4", "For find, the value to look for. It is compared with the projected name, not with the Enemy.")],
        ]}
      />

      <H2>{tx(t, "cppRng_viewTitle", "Views: looking without copying")}</H2>
      <p>
        {tx(t, "cppRng_viewBody",
          "A view is a range that does not own its elements. std::views::filter(v, is_even) does not build a new vector: it builds a small object that remembers v and is_even, and produces the even elements when someone walks through it. Copying a view is cheap, and making one does no work at all. Views live in <ranges>, and std::views is a short name for std::ranges::views.")}
      </p>
      <CodeBlock lang="cpp" filename="pipe.cpp" t={t}>{`#include <ranges>

bool is_even(int x) { return x % 2 == 0; }
int  square(int x)  { return x * x; }

std::vector<int> v{3, 8, 1, 6, 4, 9, 2, 10, 5, 7};

auto a = std::views::filter(v, is_even);          // the function form
auto b = v | std::views::filter(is_even);         // the same view, written with |

auto p = v | std::views::filter(is_even)
           | std::views::transform(square)
           | std::views::take(3);

for (int x : p) std::println("{}", x);            // 64, 36, 16`}</CodeBlock>
      <p>
        {tx(t, "cppRng_pipeBody",
          "The | here is not a bitwise or. For ranges, the library overloads it so that r | f(x) means f(r, x): the thing on the left becomes the first argument. It reads left to right like a Unix shell pipe, where the output of one stage flows into the next. Each | wraps the view on its left in a new one, so p is a take view of a transform view of a filter view of v.")}
      </p>

      <H2>{tx(t, "cppRng_lazyTitle", "Lazy: nothing happens until the loop asks")}</H2>
      <p>
        {tx(t, "cppRng_lazyBody",
          "When the for loop runs, it asks p for its first element. p asks the view below it, which asks the one below that, down to v. The filter reads elements until one passes, the transform squares it, and only that one value travels up to the loop. Then the loop asks for the next. This is called pulling, and it is why views are called lazy: no element is read or computed before something needs it. Step through it below, then switch to the eager version, which is the C++98 code with one vector per stage.")}
      </p>
      <PipelineFigure t={t} />
      <p>
        {tx(t, "cppRng_lazyAfter",
          "Two details in the figure are worth a second look. First, filter reads one element more than you might expect: after the third value, the loop calls ++it before it checks whether it is done, and filter's ++ already searches for the next even number. Take only stops after that. Second, square runs exactly three times, because transform works when an element is read, not when it passes by. The eager code squares all five even numbers and then throws two away.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "cppRng_orderWarn",
          "The order of the stages is part of the meaning. v | take(3) | filter(is_even) is \"the even numbers among the first three\", not \"the first three even numbers\". Read a pipeline aloud from left to right before trusting it.")}
      </Callout>

      <H2>{tx(t, "cppRng_catalogTitle", "The views worth knowing")}</H2>
      <LessonTable
        headers={[tx(t, "cppRng_hView", "View"), tx(t, "cppRng_hDoes", "What it gives"), tx(t, "cppRng_hSince", "Since")]}
        rows={[
          ["filter(pred)", tx(t, "cppRng_r1", "Only the elements for which pred returns true."), "C++20"],
          ["transform(f)", tx(t, "cppRng_r2", "f(x) for each element x, computed when it is read."), "C++20"],
          ["take(n) / drop(n)", tx(t, "cppRng_r3", "The first n elements / everything after the first n."), "C++20"],
          ["take_while(pred)", tx(t, "cppRng_r4", "Elements from the start until pred first returns false."), "C++20"],
          ["reverse", tx(t, "cppRng_r5", "The elements from last to first."), "C++20"],
          ["iota(a, b)", tx(t, "cppRng_r6", "The numbers a, a+1, …, b−1, made up on the fly. iota(a) never ends."), "C++20"],
          ["keys / values", tx(t, "cppRng_r7", "The first / second part of each pair, e.g. the keys of a std::map."), "C++20"],
          ["split(sep)", tx(t, "cppRng_r8", "The pieces of a range between separators, e.g. the words of a string."), "C++20"],
          ["enumerate", tx(t, "cppRng_r9", "Pairs (index, element): the index the range-for never gave you."), "C++23"],
          ["zip(a, b)", tx(t, "cppRng_r10", "Tuples (a[i], b[i]), stopping at the shorter range."), "C++23"],
          ["chunk(n) / slide(n)", tx(t, "cppRng_r11", "Groups of n side by side / every window of n neighbours."), "C++23"],
          ["join / join_with(sep)", tx(t, "cppRng_r12", "Flattens a range of ranges into one, with a separator between them for join_with."), "C++20 / C++23"],
        ]}
      />
      <CodeBlock lang="cpp" filename="views23.cpp" t={t}>{`for (int i : std::views::iota(0, 5)) std::print("{} ", i);      // 0 1 2 3 4

for (auto [i, e] : std::views::enumerate(enemies))               // index and element
    std::println("{}: {}", i, e.name);

for (auto [pos, vel] : std::views::zip(positions, velocities))   // two vectors in step
    pos += vel * dt;

for (auto tri : indices | std::views::chunk(3))                  // a flat index list as triangles
    draw_triangle(tri[0], tri[1], tri[2]);

for (auto w : samples | std::views::slide(3))                    // moving average of 3 samples
    std::println("{}", (w[0] + w[1] + w[2]) / 3.0f);`}</CodeBlock>
      <p>
        {tx(t, "cppRng_catalogAfter",
          "auto [i, e] is a structured binding: it unpacks the pair into two names (the Vocabulary Types chapter covers it). With chunk(3), the list 0 1 2 2 1 3 becomes the groups (0 1 2) and (2 1 3), one triangle each. With slide(3), the samples 4 6 8 10 give the windows (4 6 8) and (6 8 10), so the loop prints 6 and 8.")}
      </p>

      <H2>{tx(t, "cppRng_toTitle", "Back into a container: ranges::to")}</H2>
      <CodeBlock lang="cpp" filename="to.cpp" t={t}>{`auto names = enemies
    | std::views::filter([](const Enemy& e) { return e.hp > 0; })
    | std::views::transform(&Enemy::name)
    | std::ranges::to<std::vector>();     // C++23: std::vector<std::string>, filled now

std::set<int> unique = v | std::ranges::to<std::set>();`}</CodeBlock>
      <p>
        {tx(t, "cppRng_toBody",
          "A view computes its elements again on every walk and depends on its source staying alive. When you need to keep the result, store it, or walk it many times, materialise it: ranges::to runs the pipeline once and fills a real container. You only name the container template; the element type, std::string here, is worked out from the view. Before C++23 you wrote the loop with push_back yourself.")}
      </p>

      <H2>{tx(t, "cppRng_trapsTitle", "Where views bite")}</H2>
      <H3>{tx(t, "cppRng_dangleTitle", "Results that point into a dead temporary")}</H3>
      <CodeBlock lang="cpp" filename="dangling.cpp" t={t}>{`std::vector<int> make() { return {3, 8, 1, 6}; }

auto it = std::ranges::find(make(), 6);   // the vector dies at the end of this line
std::println("{}", *it);
// error: no match for 'operator*' (operand type is 'std::ranges::dangling')

auto evens = make() | std::views::filter(is_even);   // fine: the view takes ownership of the temporary`}</CodeBlock>
      <p>
        {tx(t, "cppRng_dangleBody",
          "A range algorithm called on a temporary container does not return an iterator into it, since the container is about to be destroyed. It returns std::ranges::dangling, an empty type that cannot be dereferenced, so the bug becomes a compile error. Piping a temporary into a view is safe since a C++20 fix: the view moves the vector inside itself (an owning_view). What the library cannot see is a view that outlives a named container, such as a function returning a view of its own local vector.")}
      </p>
      <CodeBlock lang="cpp" filename="local.cpp" t={t}>{`auto evens_of_level() {
    std::vector<int> ids = load_ids();
    return ids | std::views::filter(is_even);   // holds a reference to ids...
}                                               // ...which dies here: the caller walks freed memory`}</CodeBlock>

      <H3>{tx(t, "cppRng_constTitle", "A filter view cannot be walked through const&")}</H3>
      <CodeBlock lang="cpp" filename="const_view.cpp" t={t}>{`void show(const auto& r) { for (int x : r) std::print("{} ", x); }

show(v | std::views::filter(is_even));
// error: passing 'const std::ranges::filter_view<...>' as 'this' argument discards qualifiers`}</CodeBlock>
      <p>
        {tx(t, "cppRng_constBody",
          "filter's begin() has to search for the first passing element, and it remembers the answer so that a second walk does not search again. Remembering changes the view, so begin() is not const, and a const view cannot be walked. Take views as auto&& (any range, const or not) or by value, which is cheap for a view. The cached answer has a second consequence: do not change elements through a filter so that they stop passing it, because the remembered start may then be wrong.")}
      </p>

      <H3>{tx(t, "cppRng_debugTitle", "Slow debug builds")}</H3>
      <p>
        {tx(t, "cppRng_debugBody",
          "With -O2, the compiler inlines every stage and the pipeline becomes the hand loop you would have written. With -O0 every stage stays a real function call, often several per element, and a pipeline is often several times slower than the loop. That matters for a game that must run at 60 frames per second in a debug build. Keep the hottest per-frame loops plain if your debug builds are too slow, and use views everywhere else.")}
      </p>

      <H2>{tx(t, "cppRng_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "cppRng_try1", "Print the squares of the odd numbers from 1 to 19 with iota, filter and transform, and no container at all.")}</li>
        <li>{tx(t, "cppRng_try2", "Add a transform that prints \"read x\" before the filter in the pipeline of the figure. Count the lines and compare with the figure's counters. Then explain why the passing elements are printed twice.")}</li>
        <li>{tx(t, "cppRng_try3", "Sort a vector of enemies by distance with one ranges::sort call and a projection, then by name in reverse order using std::ranges::greater{} as the comparison.")}</li>
        <li>{tx(t, "cppRng_try4", "Split the string \"wood,stone,,iron\" on ',' with views::split and print each piece in brackets. How many pieces do you get, and why?")}</li>
      </ol>

      <KeyIdeas t={t} id="cppRng" items={[
        "A range is anything with begin() and end(); [begin, end) includes begin and excludes end.",
        "std::ranges algorithms take the whole range, and projections say which part of each element to look at.",
        "A view owns nothing and does no work when it is made; r | f(x) means f(r, x).",
        "Views are lazy: the loop pulls one element at a time, and elements after the last one needed are never read.",
        "The order of stages changes the meaning; read the pipeline aloud from left to right.",
        "Materialise with ranges::to when you need to keep the result, and never let a view outlive the container it looks at.",
      ]} />
    </Article>
  );
}
