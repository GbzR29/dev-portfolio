"use client";

// Linear Structures 5: hash tables — sets and maps; direct addressing and its
// limit; hash functions, k mod m and why m should be prime; collisions are
// unavoidable (pigeonhole, birthday problem); separate chaining with an
// Entry** erase and rehashing, expected chain length α; hashing strings with
// a polynomial hash; linear probing, clustering, Knuth's probe counts and
// tombstones; resizing as amortised O(1); worst case and hash flooding;
// std::unordered_map; worked examples; common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { HashTableFigure } from "@/components/lesson/figures/algo/HashTableFigure";

const r = String.raw;

export function HashTableContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "alHash_intro",
          "Binary search finds a key among a billion in 30 steps. A hash table usually finds it in one or two. It computes where the key should be stored directly from the key itself, and looks only there. It is the structure behind every dictionary, symbol table, cache and \"have I seen this before?\" check, and after the dynamic array it is probably the most used data structure in practice. It builds on everything in this section: an array of buckets, linked lists inside them, and doubling to grow.")}
      </Lead>

      <Goals t={t} id="alHash" items={[
        "Map keys to buckets with a hash function, strings included.",
        "Handle collisions with separate chaining and with linear probing.",
        "Keep the load factor in check by growing the table.",
        "Explain the worst case and how attackers can trigger it.",
      ]} />

      <H2>{tx(t, "alHash_goalTitle", "Sets and maps")}</H2>
      <p>
        {tx(t, "alHash_goalBody",
          "Two abstract data types are in play. A set stores keys and answers \"is k in the set?\"; it supports insert, contains and erase. A map (also called a dictionary or associative array) stores pairs key → value, such as word → number of occurrences or student ID → record, and supports put(k, v), get(k) and erase(k). Each key appears at most once. With a sorted array these take O(log n) to search and O(n) to insert; with a plain list, O(n). The hash table aims at O(1) on average for all of them.")}
      </p>

      <H2>{tx(t, "alHash_directTitle", "The starting point: direct addressing")}</H2>
      <p>
        {tx(t, "alHash_directBody",
          "If the keys are small whole numbers, say 0 to 999, the answer is easy: an array of 1000 slots, and key k lives in slot k. Every operation is one array access. Counting sort used exactly this idea. It breaks down when the set of possible keys, the universe, is huge compared with the number of keys actually stored: 50 phone numbers with 11 digits would need 10¹¹ slots. A hash table keeps the array but makes it small, of some size m, and uses a function to squeeze every possible key into the range 0 to m − 1.")}
      </p>

      <H2>{tx(t, "alHash_funcTitle", "Hash functions")}</H2>
      <p>
        {tx(t, "alHash_funcBody",
          "A hash function h maps each key to a bucket number h(k) between 0 and m − 1. For whole-number keys the simplest choice is the remainder, h(k) = k mod m (the division method). A good hash function must be deterministic (the same key always gives the same bucket, otherwise we could never find it again), fast, use every part of the key, and spread typical keys evenly over the buckets.")}
      </p>
      <p>
        {tx(t, "alHash_primeBody",
          "The choice of m matters. Suppose the keys are prices in cents that are all multiples of 10, and m = 100. Then k mod 100 is always a multiple of 10: only 10 of the 100 buckets are ever used. In general, if the keys share a common factor d with m, they land only in buckets that are multiples of gcd(d, m) (Math track, Divisibility). A prime m shares no factor with anything smaller than itself, so it avoids such patterns; that is why tables built on k mod m use prime sizes such as 11, 23, 47, 97.")}
      </p>

      <H2>{tx(t, "alHash_collTitle", "Collisions are unavoidable")}</H2>
      <p>
        {tx(t, "alHash_collBody",
          "Two different keys with the same bucket collide. Since the universe is larger than m, collisions must exist: with m buckets and m + 1 keys, some bucket gets two (the pigeonhole principle). Worse, they happen long before the table is full. This is the birthday problem from the Math track's Probability chapter: with 365 possible birthdays, 23 people already have a better than even chance that two share one. For a hash table with m buckets, collisions become likely once there are about √m keys. So a hash table is not a way to avoid collisions; it is a way to handle them cheaply.")}
      </p>
      <Equation label={tx(t, "alHash_eqBday", "Probability of no collision among n keys in m buckets")}
        where={[
          [r`m`, tx(t, "alHash_wM", "the number of buckets, all equally likely for each key")],
          [r`n`, tx(t, "alHash_wN", "the number of keys")],
          [r`1 - \tfrac{i}{m}`, tx(t, "alHash_wFree", "the chance that key i + 1 misses the i buckets already used")],
        ]}
        note={tx(t, "alHash_eqBdayNote", "For m = 365 and n = 23 the product is 0.493, so a collision has probability 0.507. For n = 50 it is 0.030: a collision is almost certain with the table less than 14% full.")}>
        {r`P(\text{no collision}) = 1 \cdot \left(1-\tfrac{1}{m}\right)\left(1-\tfrac{2}{m}\right)\cdots\left(1-\tfrac{n-1}{m}\right)`}
      </Equation>

      <H2>{tx(t, "alHash_chainTitle", "Separate chaining")}</H2>
      <p>
        {tx(t, "alHash_chainBody",
          "The simplest way to handle collisions: every bucket holds a linked list, a chain, of the entries whose keys hash there. To look up k, compute h(k) and walk that one chain. To insert, look up first (a key must not appear twice), then push the new entry at the front of the chain, O(1). The table is an array of m chain heads.")}
      </p>
      <CodeBlock lang="cpp" filename="chained_map.cpp" t={t}>{`struct Entry {
    int    key;
    int    value;
    Entry* next;                                   // the chain of this bucket
};

struct ChainedMap {
    Entry** buckets = nullptr;                     // m chain heads
    int m = 0;                                     // number of buckets
    int n = 0;                                     // number of entries

    explicit ChainedMap(int m0 = 11) : m(m0) {
        buckets = new Entry*[m];
        for (int i = 0; i < m; ++i) buckets[i] = nullptr;
    }
    ~ChainedMap() {
        for (int i = 0; i < m; ++i)
            for (Entry* e = buckets[i]; e; ) { Entry* next = e->next; delete e; e = next; }
        delete[] buckets;
    }
    ChainedMap(const ChainedMap&) = delete;
    ChainedMap& operator=(const ChainedMap&) = delete;

    int bucket(int key) const {                    // key mod m, never negative
        int h = key % m;
        return h < 0 ? h + m : h;
    }
    Entry* find(int key) {                         // walks one chain
        for (Entry* e = buckets[bucket(key)]; e; e = e->next)
            if (e->key == key) return e;
        return nullptr;
    }
    void put(int key, int value) {
        if (Entry* e = find(key)) { e->value = value; return; }   // already there: update
        if (n + 1 > m) rehash(2 * m + 1);          // keep the load factor at most 1
        int b = bucket(key);
        buckets[b] = new Entry{key, value, buckets[b]};             // push at the front
        ++n;
    }
    bool erase(int key) {
        Entry** link = &buckets[bucket(key)];      // the pointer that points at the entry
        while (*link) {
            if ((*link)->key == key) {
                Entry* dead = *link;
                *link = dead->next;                // bypass it, first entry or not
                delete dead;
                --n;
                return true;
            }
            link = &(*link)->next;
        }
        return false;
    }
    void rehash(int newM);                         // below
};`}</CodeBlock>
      <p>
        {tx(t, "alHash_linkBody",
          "erase uses a pointer to a pointer, Entry** link. It does not point at an entry but at the pointer that points at the entry: first the bucket's head pointer, then the next field of each entry in turn. Changing *link therefore rewires whichever pointer led to the dead entry, so removing the first entry of a chain needs no special case. It is the same idea as the sentinel of the Linked Lists chapter, without a dummy node.")}
      </p>

      <HashTableFigure t={t} />

      <H3>{tx(t, "alHash_loadTitle", "The load factor")}</H3>
      <p>
        {tx(t, "alHash_loadBody",
          "The cost of a lookup is the length of one chain. With n keys in m buckets, the average chain length is the load factor α = n/m. If the hash function spreads keys like independent uniform random choices (the simple uniform hashing assumption), an unsuccessful search walks a whole chain, α entries on average, and a successful one about 1 + α/2 (the key is found halfway along a chain, on average, and the chain it is in holds the key itself plus others). Keeping α below a constant, here 1, makes every operation O(1) on average.")}
      </p>
      <Equation label={tx(t, "alHash_eqLoad", "Load factor and expected cost with chaining")}
        where={[
          [r`\alpha`, tx(t, "alHash_wAlpha", "the load factor: keys per bucket on average")],
          [r`1 + \alpha/2`, tx(t, "alHash_wHit", "entries examined in a successful search, on average")],
          [r`\alpha`, tx(t, "alHash_wMiss", "entries examined in an unsuccessful search, on average (plus computing h)")],
        ]}>
        {r`\alpha = \frac{n}{m}, \qquad \text{hit} \approx 1 + \frac{\alpha}{2}, \qquad \text{miss} \approx \alpha`}
      </Equation>
      <H3>{tx(t, "alHash_rehashTitle", "Growing: rehashing")}</H3>
      <p>
        {tx(t, "alHash_rehashBody",
          "When n passes m, allocate about twice as many buckets and move every entry into its new bucket. Every entry must be rehashed, because its bucket k mod m depends on m. No entries are copied: the nodes are relinked. As with the dynamic array, doubling makes this amortised O(1) per insertion: after a rehash to 2m, another m insertions must happen before the next one, and they pay for it. 2m + 1 keeps m odd, a cheap stand-in for choosing the next prime.")}
      </p>
      <CodeBlock lang="cpp" filename="rehash.cpp" t={t}>{`void ChainedMap::rehash(int newM) {
    Entry** old = buckets;
    int oldM = m;
    m = newM;                                      // bucket() now uses the new m
    buckets = new Entry*[m];
    for (int i = 0; i < m; ++i) buckets[i] = nullptr;
    for (int i = 0; i < oldM; ++i) {
        Entry* e = old[i];
        while (e) {
            Entry* next = e->next;                 // save before relinking
            int b = bucket(e->key);
            e->next = buckets[b];                  // push the node onto its new chain
            buckets[b] = e;
            e = next;
        }
    }
    delete[] old;                                  // only the array of heads
}`}</CodeBlock>

      <H2>{tx(t, "alHash_stringTitle", "Hashing strings")}</H2>
      <p>
        {tx(t, "alHash_stringBody",
          "Most keys are not numbers. A string must first be turned into a number that depends on every character and on their order. Adding the character codes fails the second test: \"cat\" and \"act\" both sum to 99 + 97 + 116 = 312, so every anagram collides. The standard fix treats the characters as the digits of a number in some base, usually a small odd prime such as 31: h = ((c₀ · 31 + c₁) · 31 + c₂) … , computed with Horner's rule. The value quickly exceeds 32 bits, and the code lets it wrap around: arithmetic on unsigned integers in C++ is defined to be done mod 2³², which simply keeps the low 32 bits. The table then takes this number mod m.")}
      </p>
      <CodeBlock lang="cpp" filename="hash_string.cpp" t={t}>{`unsigned hashString(const char* s) {
    unsigned h = 0;
    for (int i = 0; s[i] != '\\0'; ++i)
        h = h * 31 + (unsigned char)s[i];      // Horner's rule, wrapping mod 2^32
    return h;                                  // the table uses h % m
}`}</CodeBlock>
      <p>
        {tx(t, "alHash_stringCalc",
          "By hand for \"cat\" (codes 99, 97, 116): h = 99; h = 99 · 31 + 97 = 3166; h = 3166 · 31 + 116 = 98 262. With m = 11: 98 262 = 11 · 8932 + 10, bucket 10. For \"act\": 97, then 97 · 31 + 99 = 3106, then 3106 · 31 + 116 = 96 402, and 96 402 mod 11 = 9. The anagrams now land in different buckets.")}
      </p>

      <H2>{tx(t, "alHash_openTitle", "Open addressing: linear probing")}</H2>
      <p>
        {tx(t, "alHash_openBody",
          "Chaining allocates a node per entry. Open addressing stores the keys in the array itself, one per slot, with no pointers at all. If the slot h(k) is taken, try the next slot, h(k) + 1, then h(k) + 2, and so on, wrapping around at the end (linear probing). A search follows the same path: it succeeds when it finds k, and fails when it reaches an empty slot, because the insertion would have used that slot. The table must never be full, and in practice it is kept at most half to three quarters full.")}
      </p>
      <CodeBlock lang="cpp" filename="probing_set.cpp" t={t}>{`const int EMPTY = -1;                         // a set of non-negative ints

struct ProbingSet {
    int* slots = nullptr;
    int  m = 0;
    int  n = 0;

    explicit ProbingSet(int m0 = 17) : m(m0) {
        slots = new int[m];
        for (int i = 0; i < m; ++i) slots[i] = EMPTY;
    }
    ~ProbingSet() { delete[] slots; }
    ProbingSet(const ProbingSet&) = delete;
    ProbingSet& operator=(const ProbingSet&) = delete;

    bool contains(int key) const {
        for (int i = key % m; slots[i] != EMPTY; i = (i + 1) % m)   // stop at a hole
            if (slots[i] == key) return true;
        return false;
    }
    void insert(int key) {
        if (2 * (n + 1) > m) rehash(2 * m + 1);   // keep the load factor at most 1/2
        int i = key % m;
        while (slots[i] != EMPTY) {
            if (slots[i] == key) return;          // already present
            i = (i + 1) % m;
        }
        slots[i] = key;
        ++n;
    }
    void rehash(int newM) {
        int* old = slots;
        int oldM = m;
        m = newM;
        slots = new int[m];
        for (int i = 0; i < m; ++i) slots[i] = EMPTY;
        n = 0;
        for (int i = 0; i < oldM; ++i)
            if (old[i] != EMPTY) insert(old[i]);  // every key gets a new home
        delete[] old;
    }
};`}</CodeBlock>
      <p>
        {tx(t, "alHash_clusterBody",
          "Linear probing is fast in practice, because a probe sequence reads neighbouring slots, which the cache loves. Its weakness is clustering: occupied slots form runs, any key hashing into a run must walk to its end and then makes the run longer, so long runs grow faster than short ones. Switch the figure to linear probing and insert keys until α is near 0.8: the pink keys, which sit away from their home slot, pile up behind each other. Donald Knuth worked out the expected number of probes in 1963.")}
      </p>
      <Equation label={tx(t, "alHash_eqKnuth", "Expected probes with linear probing (Knuth)")}
        where={[
          [r`\alpha`, tx(t, "alHash_wAlpha2", "the load factor n/m, which must stay below 1")],
          [r`\tfrac{1}{1-\alpha}`, tx(t, "alHash_wBlow", "grows without bound as the table fills: this is the price of clustering")],
        ]}>
        {r`\text{hit} \approx \frac{1}{2}\left(1 + \frac{1}{1-\alpha}\right), \qquad \text{miss} \approx \frac{1}{2}\left(1 + \frac{1}{(1-\alpha)^2}\right)`}
      </Equation>
      <LessonTable
        headers={[tx(t, "alHash_tAlpha", "load factor α"), tx(t, "alHash_tChainHit", "chaining, hit"), tx(t, "alHash_tProbeHit", "probing, hit"), tx(t, "alHash_tProbeMiss", "probing, miss")]}
        rows={[
          ["0.5", "1.25", "1.5", "2.5"],
          ["0.75", "1.38", "2.5", "8.5"],
          ["0.9", "1.45", "5.5", "50.5"],
        ]}
      />
      <H3>{tx(t, "alHash_tombTitle", "Deleting from an open-addressing table")}</H3>
      <p>
        {tx(t, "alHash_tombBody",
          "Erasing a key by marking its slot EMPTY breaks other keys. If key B was pushed past A's slot by a collision, emptying A's slot creates a hole in B's probe path, and a later search for B stops at the hole and wrongly reports it missing. The usual fix is a tombstone: a third marker, DELETED, which searches walk past as if it were occupied and insertions may reuse. Tombstones pile up and slow the searches down, so the table is rebuilt from time to time.")}
      </p>

      <H2>{tx(t, "alHash_worstTitle", "The worst case, and attacks")}</H2>
      <p>
        {tx(t, "alHash_worstBody",
          "All the O(1) results are averages that rely on the keys being spread evenly. If every key lands in the same bucket, a hash table degrades into one long list: Θ(n) per operation and Θ(n²) to insert n keys. With a fixed, known hash function an attacker can choose such keys on purpose, for example by sending a web server thousands of request parameters that all collide, and make it spend seconds on a single request. This attack is called hash flooding. Defences choose the hash function at random when the program starts (a secret seed mixed into every hash), so the attacker cannot predict the collisions.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "alHash_stdNote", "C++ offers std::unordered_set and std::unordered_map in <unordered_set> and <unordered_map>: separate chaining, a default maximum load factor of 1, and rehashing on growth. They keep no order: iterating visits the keys in bucket order, which changes after a rehash. When you need the keys in sorted order, or queries such as \"all keys between 10 and 20\", use std::map, a balanced search tree from the next section, at O(log n) per operation.")}
      </Callout>

      <H2>{tx(t, "alHash_workedTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "alHash_w1",
          "1. Insert 22, 15, 37, 4, 58 into m = 11 buckets with chaining. 22 mod 11 = 0, 15 mod 11 = 4, 37 mod 11 = 4, 4 mod 11 = 4, 58 mod 11 = 3. Bucket 4 holds a chain of three keys; buckets 0 and 3 hold one each; seven buckets are empty. α = 5/11 ≈ 0.45. A search for 15 walks bucket 4's chain; a search for 26 (26 mod 11 = 4) walks all three entries and fails.")}
      </p>
      <p>
        {tx(t, "alHash_w2",
          "2. The same keys with linear probing. 22 → slot 0. 15 → slot 4. 37 → slot 4 is taken, slot 5. 4 → slots 4 and 5 taken, slot 6. 58 → slot 3. A search for 4 probes slots 4, 5, 6: three probes. A search for 26 probes 4, 5, 6, 7 and stops at the empty slot 7: four probes. This is the figure's starting state.")}
      </p>
      <p>
        {tx(t, "alHash_w3",
          "3. Counting words. For each word of a text, look it up in a map from word to count; if present add 1, otherwise insert it with count 1. With a hash table each word costs O(1) on average, so a text of a million words is counted in about a million steps. With a sorted array it would be O(log n) per lookup but O(n) per new word inserted.")}
      </p>

      <H2>{tx(t, "alHash_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "alHash_tMistake", "Mistake"), tx(t, "alHash_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "alHash_e1", "A hash that ignores part of the key"), tx(t, "alHash_e1b", "using only the first character of a string, or summing the characters, sends many keys to the same bucket. Mix in every character, in order")],
          [tx(t, "alHash_e2", "A table size that shares factors with the keys"), tx(t, "alHash_e2b", "k mod 100 on multiples of 10 uses a tenth of the buckets. Use a prime m with the division method")],
          [tx(t, "alHash_e3", "Changing a key while it is in the table"), tx(t, "alHash_e3b", "its bucket no longer matches its hash, and it can never be found again. Erase, change, re-insert")],
          [tx(t, "alHash_e4", "Emptying a slot to delete under open addressing"), tx(t, "alHash_e4b", "breaks the probe paths of other keys. Use tombstones")],
          [tx(t, "alHash_e5", "Negative keys with %"), tx(t, "alHash_e5b", "−7 % 11 is −7 in C++: a negative bucket. Add m when the remainder is negative")],
          [tx(t, "alHash_e6", "Relying on the iteration order"), tx(t, "alHash_e6b", "it depends on the hash and changes after every rehash. Sort the keys, or use an ordered map")],
        ]}
      />

      <KeyIdeas t={t} id="alHash" items={[
        "A hash function maps each key to a bucket 0..m − 1, so a lookup examines one bucket instead of the whole collection.",
        "Collisions are unavoidable and appear early (the birthday problem: around √m keys).",
        "Separate chaining keeps a list per bucket; the average chain length is the load factor α = n/m.",
        "Growing the table by doubling and rehashing every key keeps α bounded and operations O(1) on average, amortised.",
        "Linear probing stores keys in the array itself; it is cache friendly but clusters, and its cost explodes as α → 1.",
        "Deleting under open addressing needs tombstones.",
        "Average O(1) needs keys spread evenly; bad hashes or attackers give Θ(n), which random seeds defend against.",
      ]} />
    </Article>
  );
}
