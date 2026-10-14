"use client";

// Objects & functions 3: choosing a container. Big-O in plain words, the
// family of standard containers, std::array, std::map (lookup, insertion, the
// operator[] trap, structured bindings), the figure comparing vector / map /
// unordered_map on the same keys, how a tree and a hash table work inside,
// custom keys, sets, iterators and invalidation, why vector usually wins
// anyway (cache, flat_map), the adaptors (stack, queue, priority_queue), and
// a decision table, closing with a word-count example.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { ContainerFigure } from "@/components/lesson/figures/cpp/ContainerFigure";

export function CppContainersContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "cppCon_intro",
          "std::vector carried us a long way, and it should stay your first choice. But some questions it answers badly. How many arrows does the player have? With a vector of items, the program must look at every item until it finds the arrows. A save file with ten thousand entries makes that ten thousand checks, every time. The standard library has a whole family of containers, each built around a different shape of memory, and each fast at different questions. This chapter shows the main ones, how they work inside, and how to choose.")}
      </Lead>

      <Goals t={t} id="cppCon" items={[
        "Read the cost of an operation in big-O notation and compare O(1), O(log n) and O(n).",
        "Use std::map and std::unordered_map, and avoid the operator[] trap.",
        "Explain how a red-black tree and a hash table find a key.",
        "Pick a container for a job, knowing why std::vector is still the default.",
      ]} />

      <H2>{tx(t, "cppCon_bigOTitle", "How cost grows: big-O in plain words")}</H2>
      <p>
        {tx(t, "cppCon_bigOBody",
          "The cost of an operation is described by how it grows with n, the number of elements, ignoring constant factors. This is written with a capital O, as in O(n), read \"order of n\". It answers one question: if the container gets a thousand times bigger, how much slower does this get?")}
      </p>
      <LessonTable
        headers={[tx(t, "cppCon_hNot", "Notation"), tx(t, "cppCon_hName", "Name"), tx(t, "cppCon_hMeans", "What it means"), "n = 1 000 000"]}
        rows={[
          ["O(1)", tx(t, "cppCon_o1n", "constant"), tx(t, "cppCon_o1", "The same work however big the container is. Example: v[i], push_back (on average)."), tx(t, "cppCon_o1v", "1 step")],
          ["O(log n)", tx(t, "cppCon_o2n", "logarithmic"), tx(t, "cppCon_o2", "One more step each time n doubles. log₂ of a million is about 20. Example: finding a key in a std::map."), tx(t, "cppCon_o2v", "about 20 steps")],
          ["O(n)", tx(t, "cppCon_o3n", "linear"), tx(t, "cppCon_o3", "Work proportional to n: twice the elements, twice the time. Example: searching an unsorted vector."), tx(t, "cppCon_o3v", "1 000 000 steps")],
          ["O(n log n)", tx(t, "cppCon_o4n", "n log n"), tx(t, "cppCon_o4", "The cost of a good sort."), tx(t, "cppCon_o4v", "about 20 000 000 steps")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "cppCon_bigOWarn",
          "Big-O hides the size of each step. A step that waits for main memory can cost a hundred times one that finds its data in the CPU cache. For small containers, the shape of memory often matters more than the O: the last section returns to this.")}
      </Callout>

      <H2>{tx(t, "cppCon_famTitle", "The family")}</H2>
      <LessonTable
        headers={[tx(t, "cppCon_hCont", "Container"), tx(t, "cppCon_hShape", "Shape in memory"), tx(t, "cppCon_hGood", "Good at")]}
        rows={[
          ["std::array<T, N>", tx(t, "cppCon_f1s", "N elements side by side, size fixed at compile time; no heap."), tx(t, "cppCon_f1g", "Small fixed sets: a 4×4 matrix, the 6 faces of a cube.")],
          ["std::vector<T>", tx(t, "cppCon_f2s", "One block on the heap, grows by moving to a bigger block."), tx(t, "cppCon_f2g", "Almost everything: walking in order, adding at the end, access by index.")],
          ["std::deque<T>", tx(t, "cppCon_f3s", "Several fixed-size blocks plus a table of them."), tx(t, "cppCon_f3g", "Adding and removing at both ends.")],
          ["std::list<T>", tx(t, "cppCon_f4s", "One heap node per element, each with pointers to the next and previous."), tx(t, "cppCon_f4g", "Rarely the right answer: splicing, or elements that must never move.")],
          ["std::map<K, V> / std::set<K>", tx(t, "cppCon_f5s", "A balanced binary tree of nodes, kept sorted by key."), tx(t, "cppCon_f5g", "Lookup by key in O(log n), and visiting keys in sorted order.")],
          ["std::unordered_map<K, V> / std::unordered_set<K>", tx(t, "cppCon_f6s", "A hash table: an array of buckets, each a short chain of nodes."), tx(t, "cppCon_f6g", "Lookup by key in O(1) on average, when order does not matter.")],
          ["std::stack, std::queue, std::priority_queue", tx(t, "cppCon_f7s", "Adaptors: a restricted interface over another container (by default deque, deque and vector)."), tx(t, "cppCon_f7g", "Last-in-first-out, first-in-first-out, and always-take-the-largest.")],
        ]}
      />

      <H3>{tx(t, "cppCon_arrTitle", "std::array: a C array that behaves")}</H3>
      <CodeBlock lang="cpp" filename="array.cpp" t={t}>{`#include <array>

std::array<float, 3> color{1.0f, 0.5f, 0.2f};   // lives on the stack, like float[3]
color.size();                                    // 3: it knows its size
auto copy = color;                               // copies all 3 (a C array cannot be assigned)
color.at(5);                                     // throws std::out_of_range instead of UB`}</CodeBlock>
      <p>
        {tx(t, "cppCon_arrAfter",
          "std::array costs exactly what a C array costs, but it knows its size, can be copied, compared and returned from a function, and does not decay into a pointer when passed around.")}
      </p>

      <H2>{tx(t, "cppCon_mapTitle", "std::map: lookup by key")}</H2>
      <CodeBlock lang="cpp" filename="inventory.cpp" t={t}>{`#include <map>
#include <print>
#include <string>

std::map<std::string, int> inv;          // key: item name, value: how many

inv["arrow"] = 20;                       // insert, or overwrite
inv["potion"] += 3;                      // missing key: starts at 0, then += 3
inv.insert({"sword", 1});                // insert only if absent

if (auto it = inv.find("arrow"); it != inv.end())
    std::println("{} arrows", it->second);

if (inv.contains("key")) { /* … */ }    // C++20

inv.erase("potion");

for (const auto& [name, count] : inv)    // visits keys in sorted order
    std::println("{:<8}{}", name, count);`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "cppCon_hPart", "Part"), tx(t, "cppCon_hPartM", "What it means")]}
        rows={[
          ["std::map<std::string, int>", tx(t, "cppCon_m1", "A map from keys of type std::string to values of type int. Each key appears at most once.")],
          ["inv.find(k)", tx(t, "cppCon_m2", "Returns an iterator, a position in the container. If the key is absent it returns inv.end(), the position one past the last element.")],
          ["it->second", tx(t, "cppCon_m3", "Each element is a std::pair: first is the key (const, so it cannot be changed in place), second is the value.")],
          ["if (auto it = …; cond)", tx(t, "cppCon_m4", "An if with an initialiser (C++17): it exists only inside the if, so it cannot be misused afterwards.")],
          ["const auto& [name, count]", tx(t, "cppCon_m5", "A structured binding: gives the pair's two parts their own names. & avoids copying each string.")],
        ]}
      />
      <Callout type="warn" t={t}>
        {tx(t, "cppCon_idxTrap",
          "inv[key] never fails: if the key is missing, it inserts it with a default value (0 for an int, \"\" for a string) and returns that. Handy for counting, a bug when you only meant to look. It also cannot be used on a const map. To ask without changing anything, use find, contains, or at(key), which throws if the key is absent.")}
      </Callout>

      <H2>{tx(t, "cppCon_figTitle", "Three containers, the same question")}</H2>
      <p>
        {tx(t, "cppCon_figBody",
          "Here the same inventory lives in a vector, a map and an unordered_map. Click an item to look it up in all three, and compare how many keys each one must compare. Then insert more items and watch how the counts change, and finally tick the box and look up the dragon.")}
      </p>
      <ContainerFigure t={t} />

      <H3>{tx(t, "cppCon_treeTitle", "Inside std::map: a red-black tree")}</H3>
      <p>
        {tx(t, "cppCon_treeBody",
          "Each element of a map lives in its own node on the heap, with pointers to a left child, a right child and its parent. Every key in a node's left subtree is smaller than the node's key, every key in its right subtree larger. To find a key, start at the root and go left or right at each node: each step discards about half of what is left, so it takes about log₂ n steps. That only holds if the tree stays balanced. A red-black tree guarantees it with a colour per node and two rules (a red node has no red child; every path from the root down passes the same number of black nodes), which together keep the longest path at most twice the shortest. Insertions repair the rules with a few rotations.")}
      </p>
      <H3>{tx(t, "cppCon_hashTitle", "Inside std::unordered_map: a hash table")}</H3>
      <p>
        {tx(t, "cppCon_hashBody",
          "A hash function turns a key into a large number, always the same number for the same key. The table takes that number modulo the bucket count to choose a bucket, and only the few keys in that bucket are compared. With a good hash, keys spread evenly and each bucket holds about one key. The load factor is elements ÷ buckets; when it passes max_load_factor() (1.0 by default), the table allocates more buckets and moves every element, a rehash. Like vector growth, this is rare enough that insertion stays O(1) on average. The bad case is many keys landing in one bucket, which makes a lookup O(n).")}
      </p>
      <CodeBlock lang="cpp" filename="custom_key.cpp" t={t}>{`struct Cell { int x, y; bool operator==(const Cell&) const = default; };

struct CellHash {
    std::size_t operator()(const Cell& c) const {
        return std::hash<int>{}(c.x) * 31 + std::hash<int>{}(c.y);
    }
};

std::unordered_map<Cell, Tile, CellHash> world;   // a sparse tile map
world[{3, -7}] = Tile::Water;`}</CodeBlock>
      <p>
        {tx(t, "cppCon_customAfter",
          "A key type needs two things in an unordered_map: a way to compare keys for equality (here the defaulted ==) and a hash function, passed as a third template argument. For a std::map, a key needs instead a way to order keys: operator<, or the defaulted <=> from C++20.")}
      </p>

      <H2>{tx(t, "cppCon_iterTitle", "Iterators, and when they go stale")}</H2>
      <p>
        {tx(t, "cppCon_iterBody",
          "Every container hands out iterators: small objects that mark a position, move with ++ and give the element with *. begin() is the first position and end() is one past the last, so a range is half-open: [begin, end). The range-for loop and every algorithm are written in terms of them. Like a pointer, an iterator can go stale when the container changes underneath it, and using a stale one is undefined behaviour.")}
      </p>
      <LessonTable
        headers={[tx(t, "cppCon_hCont", "Container"), tx(t, "cppCon_hInval", "What makes iterators, pointers and references stale")]}
        rows={[
          ["vector", tx(t, "cppCon_i1", "Any insertion that reallocates invalidates all of them; insert or erase in the middle invalidates everything after that point.")],
          ["deque", tx(t, "cppCon_i2", "Insertion at either end invalidates iterators but not references; anything in the middle invalidates all.")],
          ["list, map, set", tx(t, "cppCon_i3", "Only the erased element's. Nodes never move: this stability is their real advantage.")],
          ["unordered_map, unordered_set", tx(t, "cppCon_i4", "A rehash invalidates iterators but not references to elements; erasing invalidates only the erased one.")],
        ]}
      />
      <CodeBlock lang="cpp" filename="erase_loop.cpp" t={t}>{`// Wrong: erase makes it stale, and ++it then uses it
for (auto it = inv.begin(); it != inv.end(); ++it)
    if (it->second == 0) inv.erase(it);

// Right: erase returns the next valid position
for (auto it = inv.begin(); it != inv.end(); )
    it = (it->second == 0) ? inv.erase(it) : std::next(it);

// Simplest (C++20)
std::erase_if(inv, [](const auto& kv) { return kv.second == 0; });`}</CodeBlock>

      <H2>{tx(t, "cppCon_cacheTitle", "Why std::vector still wins most of the time")}</H2>
      <p>
        {tx(t, "cppCon_cacheBody",
          "The CPU does not read memory one byte at a time: it fetches 64-byte lines into its cache and guesses which lines you will want next. A vector's elements sit side by side, so walking it uses every byte fetched and the guesses are always right. A map or list scatters its nodes over the heap, and each step to the next node can mean a wait for main memory, a hundred times slower than a cache hit. In practice, for a few hundred elements, a plain linear search through a vector often beats a map lookup, and inserting in the middle of a vector often beats a list, despite the O.")}
      </p>
      <CodeBlock lang="cpp" filename="sorted_vector.cpp" t={t}>{`std::vector<std::pair<std::string, int>> inv;   // kept sorted by name
auto it = std::ranges::lower_bound(inv, name, {}, &std::pair<std::string, int>::first);
bool found = it != inv.end() && it->first == name;  // binary search: O(log n), cache-friendly

// C++23 packages this idea: std::flat_map, a map stored as two sorted vectors`}</CodeBlock>
      <p>
        {tx(t, "cppCon_cacheAfter",
          "A sorted vector with binary search gives O(log n) lookups with the memory shape of a vector. Its cost is insertion, which shifts elements: ideal for data that is built once and read often, such as a level's asset table. lower_bound returns the first position whose key is not less than the one searched.")}
      </p>

      <H2>{tx(t, "cppCon_adTitle", "Adaptors: stack, queue, priority_queue")}</H2>
      <CodeBlock lang="cpp" filename="adaptors.cpp" t={t}>{`#include <queue>
#include <stack>

std::stack<Screen> screens;          // last in, first out: menus over menus
screens.push(Screen::Pause);
screens.pop();                       // back to the game

std::queue<Event> events;            // first in, first out
events.push(e);  events.front();  events.pop();

// always hands out the largest element first; std::greater flips it to the smallest
std::priority_queue<Timer, std::vector<Timer>, std::greater<>> timers;
timers.push({.at = 2.5f});
timers.top();                        // the timer due soonest`}</CodeBlock>
      <p>
        {tx(t, "cppCon_adAfter",
          "An adaptor is not a new data structure: it wraps a container and only lets through the operations that fit the job, so the code says what it means. priority_queue keeps a binary heap inside a vector (a tree stored in an array, unrelated to the heap of memory), with push and pop in O(log n). It is the core of A* pathfinding and of event schedulers.")}
      </p>

      <H2>{tx(t, "cppCon_chooseTitle", "Choosing")}</H2>
      <LessonTable
        headers={[tx(t, "cppCon_hNeed", "You need"), tx(t, "cppCon_hUse", "Use")]}
        rows={[
          [tx(t, "cppCon_c1", "A list of things, in order, walked often"), "std::vector"],
          [tx(t, "cppCon_c2", "A fixed, small number of things"), "std::array"],
          [tx(t, "cppCon_c3", "Lookup by key, order does not matter"), "std::unordered_map"],
          [tx(t, "cppCon_c4", "Lookup by key and keys in sorted order, or the nearest key (lower_bound)"), "std::map"],
          [tx(t, "cppCon_c5", "Build once, look up many times"), tx(t, "cppCon_c5u", "sorted std::vector, or std::flat_map (C++23)")],
          [tx(t, "cppCon_c6", "Just \"have I seen this?\""), "std::unordered_set / std::set"],
          [tx(t, "cppCon_c7", "Add and remove at both ends"), "std::deque"],
          [tx(t, "cppCon_c8", "Always the smallest or largest next"), "std::priority_queue"],
          [tx(t, "cppCon_c9", "Elements that must never move in memory"), tx(t, "cppCon_c9u", "std::list, a map, or a vector of unique_ptr")],
        ]}
      />

      <H2>{tx(t, "cppCon_wcTitle", "Worked example: counting words")}</H2>
      <CodeBlock lang="cpp" filename="wordcount.cpp" t={t}>{`#include <algorithm>
#include <iostream>
#include <print>
#include <ranges>
#include <string>
#include <unordered_map>
#include <vector>

int main() {
    std::unordered_map<std::string, int> count;
    std::string word;
    while (std::cin >> word)
        ++count[word];                            // here operator[] is exactly right

    std::vector<std::pair<std::string, int>> top(count.begin(), count.end());
    std::ranges::sort(top, [](const auto& a, const auto& b) { return a.second > b.second; });

    for (const auto& [w, n] : top | std::views::take(10))
        std::println("{:>6}  {}", n, w);
}`}</CodeBlock>
      <p>
        {tx(t, "cppCon_wcAfter",
          "Each container does what it is good at: the hash table counts in O(1) per word, then the pairs are copied into a vector to be sorted, since a hash table has no order to sort. The lambda from the previous chapter says what \"first\" means, and views::take(10), from the Ranges chapter, stops after ten. Run it with ./wordcount < book.txt.")}
      </p>

      <H2>{tx(t, "cppCon_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "cppCon_try1", "Write a function that prints an item's count from a const std::map<std::string, int>& without changing the map. Why does inv[name] not compile there?")}</li>
        <li>{tx(t, "cppCon_try2", "Fill a vector, a map and an unordered_map with 1 000 000 ints, then time 1 000 000 lookups in each (the ScopeTimer from the Classes chapter helps). Repeat with 100 elements.")}</li>
        <li>{tx(t, "cppCon_try3", "Store Cell keys in an unordered_set with your own hash. Then make the hash return 0 for everything and time it again.")}</li>
        <li>{tx(t, "cppCon_try4", "Use a std::priority_queue to print a list of timers in the order they go off.")}</li>
      </ol>

      <KeyIdeas t={t} id="cppCon" items={[
        "Big-O tells how cost grows with n: O(1) stays flat, O(log n) adds a step per doubling, O(n) grows in proportion.",
        "std::map is a sorted red-black tree: O(log n) lookups and sorted iteration.",
        "std::unordered_map is a hash table: O(1) lookups on average, no order.",
        "map[key] inserts a missing key; use find, contains or at to only look.",
        "Iterators go stale when the container moves its elements; use the iterator erase returns, or std::erase_if.",
        "Contiguous memory is fast memory: std::vector (sorted, if you need lookups) is the default until measurements say otherwise.",
      ]} />
    </Article>
  );
}
