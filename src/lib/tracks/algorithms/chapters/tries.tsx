"use client";

// Trees 5: tries — why string keys are costly for hashing and search trees,
// the trie (one letter per edge, an end-of-word flag), insert/contains/
// startsWith in O(L), counting words by prefix, deleting with pruning,
// autocomplete by a depth-first walk (alphabetical output: tries sort strings),
// memory per node and other child layouts, compressed (radix) tries, a
// binary trie for integers and the maximum-XOR pair, uses (routing, spell
// check), a comparison for string keys, a recap of the Trees section; worked
// examples; common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { TrieFigure } from "@/components/lesson/figures/algo/TrieFigure";

export function TriesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "alTrie_intro",
          "Type \"alg\" into a search box and it suggests \"algebra\", \"algorithm\", \"algae\". A hash table cannot do that: it can tell whether \"alg\" itself is stored, but the hash of \"alg\" says nothing about the hash of \"algebra\". A search tree can, with a range query, but every comparison inside it compares whole strings. The trie (from retrieval, usually pronounced \"try\") is a tree built for strings: each level handles one character, so words that begin alike share the same path, and every question about prefixes is answered by walking down that path.")}
      </Lead>

      <Goals t={t} id="alTrie" items={[
        "Insert and look up words in a trie, and test prefixes.",
        "Build autocomplete, and list words in sorted order for free.",
        "Estimate the memory a trie uses.",
        "Choose between a trie, a hash table and a search tree for string keys.",
      ]} />

      <H2>{tx(t, "alTrie_costTitle", "What string keys cost elsewhere")}</H2>
      <p>
        {tx(t, "alTrie_costBody",
          "Comparing two strings is not one step. It goes character by character until they differ or one ends, so it costs up to L steps for strings of length L. A balanced search tree makes about log₂ n comparisons per lookup, so it really costs O(L log n). A hash table must first hash the whole key, O(L), and then compare it with what it finds in the bucket, another O(L): O(L) on average, but with no notion of order or prefixes. A trie also costs O(L), one step per character, and in exchange for memory it answers prefix questions for free.")}
      </p>

      <H2>{tx(t, "alTrie_structTitle", "The structure")}</H2>
      <p>
        {tx(t, "alTrie_structBody",
          "A trie is a tree whose edges are labelled with characters. The root stands for the empty string. Each node has at most one child per possible character, and the characters on the path from the root to a node spell a prefix: the node for \"car\" is reached by following c, then a, then r. A node exists exactly when some stored word starts with its prefix. Because a prefix can be a complete word too (\"car\" is a word, and also the start of \"card\"), each node carries a flag saying whether a word ends there. With lowercase English letters, a node can simply hold an array of 26 child pointers, indexed by c − 'a'.")}
      </p>
      <CodeBlock lang="cpp" filename="trie_node.cpp" t={t}>{`struct TrieNode {
    TrieNode* next[26] = {};         // next[c - 'a']: the child for letter c, or nullptr
    bool      end = false;           // does a stored word end here?
    int       pass = 0;              // how many stored words pass through (or end at) this node
};`}</CodeBlock>

      <H2>{tx(t, "alTrie_opsTitle", "Insert, search, prefix")}</H2>
      <p>
        {tx(t, "alTrie_opsBody",
          "Insertion walks down one letter at a time, creating any missing child on the way, and marks the last node as the end of a word. Looking a word up walks the same way; if a child is missing, the word (and every word with that prefix) is absent, and if the walk succeeds, the word is present only if the last node is marked. A prefix query is the same walk without the final check. Each operation touches one node per character: O(L) for a string of length L, no matter how many words the trie holds.")}
      </p>
      <CodeBlock lang="cpp" filename="trie.cpp" t={t}>{`struct Trie {
    TrieNode* root = new TrieNode();

    void insert(const char* w) {                   // lowercase a-z only
        if (contains(w)) return;                   // keep the pass counts exact
        TrieNode* n = root;
        n->pass++;
        for (int i = 0; w[i] != '\\0'; ++i) {
            int c = w[i] - 'a';
            if (!n->next[c]) n->next[c] = new TrieNode();
            n = n->next[c];
            n->pass++;
        }
        n->end = true;
    }

    // The node for prefix p, or nullptr if no stored word starts with p.
    TrieNode* walk(const char* p) const {
        TrieNode* n = root;
        for (int i = 0; p[i] != '\\0' && n; ++i)
            n = n->next[p[i] - 'a'];
        return n;
    }

    bool contains(const char* w) const   { TrieNode* n = walk(w); return n && n->end; }
    bool startsWith(const char* p) const { return walk(p) != nullptr; }
    int  countPrefix(const char* p) const { TrieNode* n = walk(p); return n ? n->pass : 0; }
};`}</CodeBlock>
      <p>
        {tx(t, "alTrie_passBody",
          "The pass counter is an augmentation, like the subtree sizes of the BST chapter: every node on an inserted word's path adds one, so a node's count is the number of stored words that have its prefix. \"How many words start with ca?\" is then answered by one walk of two steps, without looking at the words themselves.")}
      </p>

      <TrieFigure t={t} />

      <H3>{tx(t, "alTrie_delTitle", "Deleting and pruning")}</H3>
      <p>
        {tx(t, "alTrie_delBody",
          "To delete a word, clear its end flag. That alone is correct, but may leave a tail of nodes that no word needs any more. A node can be removed when no word ends there and it has no children; removing it may make its parent removable in turn. The recursive version checks this on the way back up, so pruning stops at the first node that is still needed, such as \"car\" after deleting \"card\".")}
      </p>
      <CodeBlock lang="cpp" filename="trie_erase.cpp" t={t}>{`bool hasChildren(const TrieNode* n) {
    for (int c = 0; c < 26; ++c) if (n->next[c]) return true;
    return false;
}

// Removes w below n (w must be stored). Returns true if n itself is no longer needed.
bool erase(TrieNode* n, const char* w) {
    n->pass--;
    if (*w == '\\0') {
        n->end = false;                            // the word ended here
    } else {
        int c = *w - 'a';
        if (erase(n->next[c], w + 1)) {            // the child became useless:
            delete n->next[c];                     // free it and forget it
            n->next[c] = nullptr;
        }
    }
    return !n->end && !hasChildren(n);
}

// Usage: if (trie.contains(w)) erase(trie.root, w);   (the root itself is never deleted)`}</CodeBlock>

      <H2>{tx(t, "alTrie_autoTitle", "Autocomplete, and sorting for free")}</H2>
      <p>
        {tx(t, "alTrie_autoBody",
          "The words that start with a prefix are exactly the words stored in the subtree below the prefix's node. So autocomplete is: walk to the prefix node (O(L)), then do a depth-first traversal of its subtree, collecting every node marked as an end. Visiting the children in index order, a before b before c, produces the words in alphabetical order, because at the first letter where two words differ, the smaller letter's branch is explored first. A trie therefore also sorts strings: insert them all and traverse from the root. This is most-significant-digit radix sort in disguise, the counterpart of the LSD radix sort of the Linear Sorts chapter.")}
      </p>
      <CodeBlock lang="cpp" filename="autocomplete.cpp" t={t}>{`// Prints every stored word below n; buf holds the prefix spelled so far (depth characters).
void collect(const TrieNode* n, char* buf, int depth) {
    if (n->end) { buf[depth] = '\\0'; printf("%s\\n", buf); }
    for (int c = 0; c < 26; ++c) {                 // alphabetical order
        if (!n->next[c]) continue;
        buf[depth] = (char)('a' + c);
        collect(n->next[c], buf, depth + 1);
    }
}

void autocomplete(const Trie& t, const char* prefix) {
    char buf[64];                                  // long enough for our words
    int len = 0;
    while (prefix[len] != '\\0') { buf[len] = prefix[len]; ++len; }
    if (const TrieNode* n = t.walk(prefix)) collect(n, buf, len);
}`}</CodeBlock>
      <p>
        {tx(t, "alTrie_autoCost",
          "The traversal costs time proportional to the size of the subtree it explores, times 26 for scanning each node's child array. A real autocomplete wants only the best few suggestions, so it stores extra information in the nodes (for example the most popular completions below each node) and stops early.")}
      </p>

      <H2>{tx(t, "alTrie_memTitle", "The price: memory")}</H2>
      <p>
        {tx(t, "alTrie_memBody",
          "Each node of the version above holds 26 pointers of 8 bytes, a bool and an int: 216 bytes after padding, most of them nullptr. A trie has at most one node per stored character plus the root, fewer when words share prefixes. A dictionary of 100 000 English words with 900 000 letters in total might need around 250 000 nodes after sharing, about 54 MB, while the words themselves take under 1 MB. There are several ways to trade some speed for space:")}
      </p>
      <LessonTable
        headers={[tx(t, "alTrie_tLayout", "Children stored as"), tx(t, "alTrie_tStep", "cost of one step"), tx(t, "alTrie_tMem", "memory per node")]}
        rows={[
          [tx(t, "alTrie_m1", "array of 26 (or 256) pointers"), "O(1)", tx(t, "alTrie_m1b", "the alphabet size, even for one child")],
          [tx(t, "alTrie_m2", "sorted small array of (letter, child)"), tx(t, "alTrie_m2b", "O(log k) with binary search, k children"), tx(t, "alTrie_m2c", "proportional to the actual children")],
          [tx(t, "alTrie_m3", "first-child / next-sibling list"), tx(t, "alTrie_m3b", "O(k)"), tx(t, "alTrie_m3c", "two pointers")],
          [tx(t, "alTrie_m4", "a hash map per node"), tx(t, "alTrie_m4b", "O(1) average"), tx(t, "alTrie_m4c", "a table per node; any alphabet, such as Unicode")],
        ]}
      />
      <H3>{tx(t, "alTrie_radixTitle", "Compressed tries")}</H3>
      <p>
        {tx(t, "alTrie_radixBody",
          "Long chains of nodes with a single child, such as the tail of \"encyclopedia\" once no other word shares it, waste the most. A compressed trie (also called a radix tree or Patricia trie) merges each such chain into one edge labelled with a whole string. Every remaining internal node then either branches or ends a word, which bounds the node count by about twice the number of words, independent of their length. Lookups compare the edge labels a character at a time, still O(L) overall.")}
      </p>

      <H2>{tx(t, "alTrie_bitsTitle", "Binary tries for numbers")}</H2>
      <p>
        {tx(t, "alTrie_bitsBody",
          "Nothing restricts a trie to letters. Write each integer as its bits from the most significant down, and insert the bit strings into a trie with two children per node (0 and 1). Numbers with the same leading bits share a path, and walking down is comparing them from the most significant bit, which makes some bit problems easy. Classic example: among n numbers, find two whose XOR is largest. For each number x, walk the trie of all numbers greedily, at every bit taking the child with the opposite bit if it exists, because a 1 in a higher bit of the XOR beats anything in the lower bits. That is 32 steps per number, O(32n) in total instead of trying all n² pairs.")}
      </p>
      <CodeBlock lang="cpp" filename="max_xor.cpp" t={t}>{`struct BitNode { BitNode* next[2] = {}; };

void insertBits(BitNode* root, unsigned x) {
    BitNode* n = root;
    for (int b = 31; b >= 0; --b) {                // most significant bit first
        int bit = (x >> b) & 1;
        if (!n->next[bit]) n->next[bit] = new BitNode();
        n = n->next[bit];
    }
}

unsigned bestXorWith(const BitNode* root, unsigned x) {   // the trie must be non-empty
    const BitNode* n = root;
    unsigned result = 0;
    for (int b = 31; b >= 0; --b) {
        int want = 1 - ((x >> b) & 1);             // the opposite bit makes this XOR bit 1
        if (n->next[want]) { result |= 1u << b; n = n->next[want]; }
        else               { n = n->next[1 - want]; }
    }
    return result;                                 // the largest x XOR y over the stored y
}`}</CodeBlock>
      <p>
        {tx(t, "alTrie_usesBody",
          "The same longest-shared-prefix idea routes internet traffic: a router keeps a binary trie of address prefixes and sends each packet by the longest prefix that matches its destination address. Spell checkers use tries to walk all dictionary words within a few edits of a typo, and word games use them to abandon a search as soon as no word starts with the letters chosen so far.")}
      </p>

      <H2>{tx(t, "alTrie_compareTitle", "Choosing a structure for string keys")}</H2>
      <LessonTable
        headers={[tx(t, "alTrie_tStruct", "Structure"), tx(t, "alTrie_tLookup", "lookup"), tx(t, "alTrie_tPrefix", "all words with a prefix"), tx(t, "alTrie_tSorted", "sorted order"), tx(t, "alTrie_tMemory", "memory")]}
        rows={[
          [tx(t, "alTrie_s1", "hash table"), tx(t, "alTrie_s1a", "O(L) average"), tx(t, "alTrie_s1b", "scan everything"), tx(t, "alTrie_no", "no"), tx(t, "alTrie_s1c", "low")],
          [tx(t, "alTrie_s2", "balanced BST (std::set)"), "O(L log n)", tx(t, "alTrie_s2b", "range query, O(L log n + output)"), tx(t, "alTrie_yes", "yes"), tx(t, "alTrie_s2c", "low")],
          [tx(t, "alTrie_s3", "trie"), "O(L)", tx(t, "alTrie_s3b", "O(L + output)"), tx(t, "alTrie_yes", "yes"), tx(t, "alTrie_s3c", "high, unless compressed")],
        ]}
      />

      <H2>{tx(t, "alTrie_recapTitle", "The Trees section in one table")}</H2>
      <LessonTable
        headers={[tx(t, "alTrie_tTree", "Tree"), tx(t, "alTrie_tOrder", "order it keeps"), tx(t, "alTrie_tCost", "cost per operation"), tx(t, "alTrie_tFor", "use it for")]}
        rows={[
          [tx(t, "alTrie_r1", "binary search tree"), tx(t, "alTrie_r1b", "left < node < right"), tx(t, "alTrie_r1c", "O(h): log n if lucky, n if not"), tx(t, "alTrie_r1d", "understanding; random keys")],
          [tx(t, "alTrie_r2", "AVL / red-black tree"), tx(t, "alTrie_r1b", "left < node < right"), "O(log n)", tx(t, "alTrie_r2d", "sorted sets and maps, range queries")],
          [tx(t, "alTrie_r3", "binary heap"), tx(t, "alTrie_r3b", "parent ≥ children"), tx(t, "alTrie_r3c", "O(1) top, O(log n) push/pop"), tx(t, "alTrie_r3d", "priority queues, heapsort")],
          [tx(t, "alTrie_r4", "trie"), tx(t, "alTrie_r4b", "one character per level"), "O(L)", tx(t, "alTrie_r4d", "prefixes, autocomplete, bit tricks")],
        ]}
      />

      <H2>{tx(t, "alTrie_workedTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "alTrie_w1",
          "1. Insert car, card, care, cat, do, dog, dot (the figure's words). The c branch has the nodes c, ca, car, card, care, cat; the d branch has d, do, dog, dot. That is 10 nodes plus the root for 22 letters. The nodes car, card, care, cat, do, dog and dot are marked as word ends; c, ca and d are not.")}
      </p>
      <p>
        {tx(t, "alTrie_w2",
          "2. Queries on that trie. contains(\"ca\"): the walk succeeds but ca is not marked, so false; startsWith(\"ca\") is true, and countPrefix(\"ca\") = 4 (car, card, care, cat). contains(\"cart\"): c, a, r exist, but car has no child t, so false after 4 steps. countPrefix(\"x\"): the root has no child x, 0 after 1 step.")}
      </p>
      <p>
        {tx(t, "alTrie_w3",
          "3. erase(\"card\"): the pass counts on c, ca, car, card drop by one; card loses its end mark and has no children, so it is freed; back at car, which is still a word end, pruning stops. erase(\"do\") only clears the mark on do, which still has the children g and t.")}
      </p>
      <p>
        {tx(t, "alTrie_w4",
          "4. Maximum XOR among 3, 10, 5, 25, 2, 8. In binary: 00011, 01010, 00101, 11001, 00010, 01000. Take x = 5 = 00101 and walk the trie of all six, bit 4 first. Bit 4: x has 0, we want 1, and 25 = 11001 starts with 1: take it, XOR bit 1. From now on only 25 is below us. Bit 3: want 1, 25 has 1: XOR bit 1. Bit 2: x has 1, want 0, 25 has 0: XOR bit 1. Bit 1: want 1, 25 has 0, the only child: XOR bit 0. Bit 0: want 0, 25 has 1: XOR bit 0. Result 11100 = 28 = 5 XOR 25. Doing this for every x and keeping the largest confirms 28 is the best pair.")}
      </p>

      <H2>{tx(t, "alTrie_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "alTrie_tMistake", "Mistake"), tx(t, "alTrie_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "alTrie_e1", "Treating \"the node exists\" as \"the word exists\""), tx(t, "alTrie_e1b", "every prefix of a word has a node; check the end flag")],
          [tx(t, "alTrie_e2", "Characters outside a–z"), tx(t, "alTrie_e2b", "c − 'a' becomes negative or ≥ 26 and indexes outside next[]. Validate, lowercase, or use 256 children")],
          [tx(t, "alTrie_e3", "Deleting nodes other words still use"), tx(t, "alTrie_e3b", "prune only nodes that end no word and have no children, stopping at the first one still needed")],
          [tx(t, "alTrie_e4", "Counting a word twice"), tx(t, "alTrie_e4b", "inserting an existing word again would bump every pass count; check contains first")],
          [tx(t, "alTrie_e5", "Ignoring memory"), tx(t, "alTrie_e5b", "26 pointers per node add up quickly; use compact child lists or a compressed trie for big dictionaries")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "alTrie_nextNote", "The next section, Algorithm Design, steps back from structures to strategies: greedy choices and dynamic programming. Tries, heaps and search trees will keep showing up as the tools inside those algorithms and inside the graph algorithms after them.")}
      </Callout>

      <KeyIdeas t={t} id="alTrie" items={[
        "A trie stores strings one character per level; the path from the root spells a prefix.",
        "Each node marks whether a word ends there: a prefix node is not automatically a word.",
        "insert, contains and startsWith all cost O(L), independent of the number of words.",
        "The words with a prefix are the subtree below its node; a depth-first walk lists them alphabetically.",
        "Tries trade memory for speed; compressed tries merge single-child chains.",
        "Binary tries over bits answer questions like the maximum XOR pair in O(32n).",
      ]} />
    </Article>
  );
}
