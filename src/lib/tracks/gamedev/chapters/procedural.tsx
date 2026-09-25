"use client";

// "Procedural Generation": pseudo-random generators, seeds, hashing, shaping
// distributions, Poisson disk sampling, Perlin noise and fractal terrain.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { RandomFigure } from "@/components/lesson/figures/gamedev/RandomFigure";
import { ScatterFigure } from "@/components/lesson/figures/gamedev/ScatterFigure";
import { PerlinStepsFigure } from "@/components/lesson/figures/gamedev/PerlinStepsFigure";
import { TerrainFigure } from "@/components/lesson/figures/gamedev/TerrainFigure";

const r = String.raw;

// ═════════════════════════════════════════════════════════════════════════════
// Randomness, Seeds & Hashing
// ═════════════════════════════════════════════════════════════════════════════

export function RandomContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "gdRand_intro",
          "Games use randomness everywhere: critical hits, loot, enemy spawns, particle directions, whole worlds. But a processor cannot flip a coin. Every instruction it executes is deterministic, so the \"random\" numbers in a game come from a formula whose output merely looks random. Understanding that formula, and its one input, the seed, is what lets you generate a planet from a single number and replay a match exactly.")}
      </Lead>

      <H2>{tx(t, "gdRand_prngTitle", "Pseudo-random number generators")}</H2>
      <p>
        {tx(t, "gdRand_prngBody",
          "A pseudo-random number generator (PRNG) keeps a small hidden state, usually one to four integers. Each call scrambles the state into a new state and derives an output number from it. Because the next state depends only on the current one, the whole sequence is decided the moment the state is initialised; that initial value is the seed. Three properties matter: the period (how many numbers before the sequence repeats), the quality (whether statistical tests can tell the output from true randomness) and the speed.")}
      </p>
      <p>
        {tx(t, "gdRand_lcgBody",
          "The oldest and simplest design is the linear congruential generator (LCG), which multiplies, adds and wraps around. Many C library rand() implementations, Microsoft's among them, are LCGs.")}
      </p>
      <Equation label={tx(t, "gdRand_eqLcg", "Linear congruential generator")}
        where={[
          [r`x_n`, tx(t, "gdRand_wXn", "the state; x₀ is the seed")],
          [r`a`, tx(t, "gdRand_wA", "the multiplier. It spreads nearby states far apart")],
          [r`c`, tx(t, "gdRand_wC", "the increment; it must be odd for the generator to visit every state when m is a power of two")],
          [r`m`, tx(t, "gdRand_wM", "the modulus: the state wraps around at m, so there are at most m different states and the period is at most m. With m = 2³², \"mod m\" is free: 32-bit unsigned arithmetic wraps by itself")],
          [r`u_n = x_n / m`, tx(t, "gdRand_wU", "the output scaled to a float in [0, 1)")],
        ]}
        note={tx(t, "gdRand_eqLcgNote", "The next value is a straight-line function of the previous one, folded by the modulus. That is why consecutive pairs from an LCG lie on a small set of parallel lines (Marsaglia, 1968): switch the figure to the weak LCG. Its low bits are also poor: with m a power of two, the lowest bit of the state simply alternates 0, 1, 0, 1, which is why good LCG-based generators only output their high bits.")}>
        {r`x_{n+1} = (a\,x_n + c) \bmod m`}
      </Equation>

      <RandomFigure t={t} />

      <H3>{tx(t, "gdRand_goodTitle", "What to use instead")}</H3>
      <p>
        {tx(t, "gdRand_goodBody",
          "Modern small generators mix the state with operations that move information between high and low bits. Multiplication by a large odd constant pushes low bits upward; an xor with a right-shifted copy (x ^ (x >> 15)) folds high bits back down. A few rounds of that make every output bit depend on every state bit. PCG (O'Neill, 2014) adds such an output permutation on top of an LCG; xoshiro/xoroshiro use only xors, shifts and rotations; SplitMix64 is a counter pushed through a strong mixing function. All pass the standard statistical test suites and run in a couple of nanoseconds. The C++ standard library's std::mt19937 (Mersenne Twister) is also good, but its state is 2.5 KB, which is heavy if every entity or chunk wants its own generator.")}
      </p>
      <CodeBlock lang="cpp" filename="splitmix64.hpp" t={t}>{`// SplitMix64: tiny, fast, statistically strong. Good for games and for seeding
// bigger generators. The state just counts up by a large odd constant; the
// output function scrambles it.
struct SplitMix64 {
    uint64_t state;
    explicit SplitMix64(uint64_t seed) : state(seed) {}

    uint64_t next() {
        uint64_t z = (state += 0x9E3779B97F4A7C15ull);   // 2^64 / golden ratio
        z = (z ^ (z >> 30)) * 0xBF58476D1CE4E5B9ull;     // fold high bits down, spread up
        z = (z ^ (z >> 27)) * 0x94D049BB133111EBull;
        return z ^ (z >> 31);
    }
    // Top 24 bits → float in [0, 1): a float has a 24-bit significand
    float nextFloat() { return (next() >> 40) * (1.0f / 16777216.0f); }
};`}</CodeBlock>

      <H2>{tx(t, "gdRand_seedTitle", "Seeds and determinism")}</H2>
      <p>
        {tx(t, "gdRand_seedBody",
          "Seeding from the clock gives a different game each run. Seeding with a fixed number gives the same game every time, and that is a feature, not a limitation. Minecraft stores a whole infinite world as one 64-bit seed plus the player's changes. Roguelikes offer daily challenges where everyone plays the same seed. A replay system only has to record the seed and the player's inputs; the simulation regenerates everything else. And a bug report that includes the seed can be reproduced exactly.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "gdRand_streams", "Use separate generators (streams) for separate systems. If world generation, loot and cosmetic particles all draw from one generator, adding a single particle effect shifts every later number, and the same seed suddenly produces a different dungeon. Give each system its own generator, seeded from the master seed plus a constant: worldRng(seed ^ 0x1), lootRng(seed ^ 0x2)…")}
      </Callout>

      <H2>{tx(t, "gdRand_hashTitle", "Hashing: randomness without state")}</H2>
      <p>
        {tx(t, "gdRand_hashBody",
          "A PRNG must be called in order: to get the 1000th number you generate the first 999. Procedural worlds need random access instead: \"what tree grows at tile (812, −47)?\" must have the same answer whenever the player walks back, in whatever order chunks are loaded. A hash function gives exactly that: it maps an input (coordinates plus a seed) to a random-looking output, with no state at all. Integer hashes use the same multiply–xorshift mixing as the generators above. The noise functions later in this chapter are built on one.")}
      </p>
      <CodeBlock lang="cpp" filename="hash.hpp" t={t}>{`// Stateless: same (x, y, seed) → same value, in any order, on any machine.
uint32_t hash2(int32_t x, int32_t y, uint32_t seed) {
    uint32_t h = seed;
    h ^= uint32_t(x) * 0x27D4EB2Du;       // large odd constants: spread the bits
    h ^= uint32_t(y) * 0x165667B1u;
    h  = (h ^ (h >> 15)) * 0x85EBCA6Bu;    // "finaliser" from MurmurHash3
    h  = (h ^ (h >> 13)) * 0xC2B2AE35u;
    return h ^ (h >> 16);
}
float hash01(int x, int y, uint32_t seed) { return (hash2(x, y, seed) >> 8) * (1.0f / 16777216.0f); }

bool hasTree(int tx, int ty) { return hash01(tx, ty, worldSeed) < 0.08f; }   // 8% of tiles`}</CodeBlock>

      <H2>{tx(t, "gdRand_shapeTitle", "Shaping the numbers")}</H2>
      <p>
        {tx(t, "gdRand_rangeBody",
          "A generator gives uniform numbers: every value equally likely. Games rarely want that directly. To pick an integer in [0, n), use floor(u · n) with a float u in [0, 1), not next() % n: when n does not divide the generator's range evenly, the modulo makes small results slightly more likely (modulo bias). To pick in [a, b], use a + floor(u · (b − a + 1)).")}
      </p>
      <p>
        {tx(t, "gdRand_distBody",
          "Combining several uniform numbers changes the shape of the distribution; the \"distributions\" view of the figure above shows each one. The average of two numbers is triangular: extreme values need both numbers to be extreme, which is rare. The average of many approaches the bell-shaped normal distribution (the central limit theorem), a cheap way to get \"mostly average, occasionally extreme\" damage rolls or NPC heights. The minimum of two leans toward 0, the maximum toward 1: a quick way to make rare drops rarer or good rolls more common.")}
      </p>
      <Equation label={tx(t, "gdRand_eqTable", "Weighted choice (loot tables)")}
        where={[
          [r`w_i`, tx(t, "gdRand_wW", "the weight of item i; they do not need to add up to 1")],
          [r`W = \sum_i w_i`, tx(t, "gdRand_wSum", "the total weight")],
          [r`u`, tx(t, "gdRand_wU2", "one uniform number in [0, 1)")],
          [r`k`, tx(t, "gdRand_wK", "the chosen item: the first one whose running total of weights exceeds u·W. Item i is chosen with probability wᵢ / W")],
        ]}
        note={tx(t, "gdRand_eqTableNote", "Picture the weights as segments laid end to end on a line of length W. u·W is a random point on that line; the item whose segment contains the point wins, and longer segments catch the point more often. For big tables, store the running totals and binary-search them.")}>
        {r`k = \min\Big\{\, j \;:\; \sum_{i \le j} w_i > u\,W \Big\}`}
      </Equation>
      <CodeBlock lang="cpp" filename="random_tools.hpp" t={t}>{`template <class T>
const T& weightedPick(const std::vector<std::pair<T, float>>& table, Rng& rng) {
    float total = 0; for (auto& [item, w] : table) total += w;
    float roll = rng.nextFloat() * total;
    for (auto& [item, w] : table) { if (roll < w) return item; roll -= w; }
    return table.back().first;                  // guards against rounding at the end
}

// Fisher–Yates: every permutation equally likely. Walk from the end, swap each
// element with a random one at or before it.
template <class T>
void shuffle(std::vector<T>& v, Rng& rng) {
    for (size_t i = v.size() - 1; i > 0; --i) {
        size_t j = size_t(rng.nextFloat() * (i + 1));   // 0 ≤ j ≤ i
        std::swap(v[i], v[j]);
    }
}`}</CodeBlock>
      <Callout type="info" t={t}>
        {tx(t, "gdRand_fairBody", "True randomness often feels unfair: a 25% crit chance can miss eight times in a row (a 10% chance per sequence of eight). Games smooth it out on purpose. A shuffle bag puts the outcomes in a bag (1 crit, 3 normal), shuffles it and draws without replacement, refilling when empty. Pseudo-random distribution (used in Dota 2 and Warcraft III) starts the chance low and raises it after every miss, resetting on a hit, so streaks become rare while the average stays the same.")}
      </Callout>

      <H2>{tx(t, "gdRand_scatterTitle", "Scattering objects: blue noise")}</H2>
      <p>
        {tx(t, "gdRand_scatterBody",
          "Placing trees or rocks at uniform random positions looks wrong: truly random points clump together and leave holes, because nothing stops two of them landing side by side. Natural distributions are spread more evenly: trees compete for light, so no two grow too close. Point sets with a minimum distance between points are called blue noise (their frequency content lacks the low frequencies that make clumps). The standard algorithm for them is Robert Bridson's fast Poisson disk sampling (2007).")}
      </p>

      <ScatterFigure t={t} />

      <p>
        {tx(t, "gdRand_bridsonBody",
          "Bridson's algorithm keeps an \"active list\" of points that may still have room around them. It starts with one random point. Repeatedly, it picks a random active point and tries up to k = 30 random candidates in the ring between r and 2r around it. A candidate is accepted if no existing point is closer than r; if all k candidates fail, the active point is retired. When the active list is empty, the area is full. The distance check is fast because of a background grid with cells of size r/√2: a cell's diagonal is then exactly r, so a cell can contain at most one point, and only the 5 × 5 block of cells around a candidate can hold a point closer than r. The whole algorithm runs in time proportional to the number of points.")}
      </p>

      <H2>{tx(t, "gdRand_pitTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "gdRand_tSym", "Symptom"), tx(t, "gdRand_tCause", "Cause"), tx(t, "gdRand_tFix", "Fix")]}
        rows={[
          [tx(t, "gdRand_b1", "Same \"random\" level every launch"), tx(t, "gdRand_c1", "generator never seeded, or seeded with a constant"), tx(t, "gdRand_f1", "seed from time or std::random_device (and log the seed)")],
          [tx(t, "gdRand_b2", "Seeded world changes after a patch"), tx(t, "gdRand_c2", "one shared generator; a new call shifted the sequence"), tx(t, "gdRand_f2", "one stream per system, or hash(coordinates, seed)")],
          [tx(t, "gdRand_b3", "Small values slightly too common"), tx(t, "gdRand_c3", "next() % n (modulo bias), or rand() with RAND_MAX = 32767 on MSVC"), tx(t, "gdRand_f3", "floor(u · n) from a good generator")],
          [tx(t, "gdRand_b4", "Some orders never appear after shuffling"), tx(t, "gdRand_c4", "swapping every element with any random index (the naive shuffle is biased)"), tx(t, "gdRand_f4", "Fisher–Yates: j from 0…i only")],
          [tx(t, "gdRand_b5", "Every enemy spawned in the same frame acts the same"), tx(t, "gdRand_c5", "each seeded with the current time, which is identical"), tx(t, "gdRand_f5", "seed from one master generator, or hash(entity id, seed)")],
        ]}
      />

      <KeyIdeas t={t} id="gdRand" items={[
        "A PRNG is deterministic: the seed decides the whole sequence. That enables seeds, replays and reproducible bugs.",
        "LCGs are fast but structured; prefer PCG, xoshiro or SplitMix64.",
        "Hash(coordinates, seed) gives random access with no state: the basis of procedural worlds and noise.",
        "floor(u·n), not % n; weighted tables walk cumulative weights; shuffle with Fisher–Yates.",
        "Poisson disk sampling spreads objects naturally: a minimum distance r, grid cells of r/√2.",
      ]} />
    </Article>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Perlin Noise
// ═════════════════════════════════════════════════════════════════════════════

export function PerlinContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "gdPerlin_intro",
          "Ask a random number generator for the height of every point of a landscape and you get static: each point unrelated to its neighbour. Real landscapes, clouds, marble and fire are random at a large scale but smooth up close. Ken Perlin invented a function with exactly that property in 1983, after working on the film Tron, and won a technical Academy Award for it in 1997. Almost every procedural world since then, from Minecraft's terrain to shader clouds, starts with some form of his noise.")}
      </Lead>

      <H2>{tx(t, "gdPerlin_wantTitle", "What we want from noise")}</H2>
      <p>
        {tx(t, "gdPerlin_wantBody",
          "We want a function noise(x, y) that returns a number for any point of the plane, such that nearby points get similar values (it is continuous and smooth), there is no visible pattern or repetition, the size of its features is predictable (about one unit), and it is deterministic: the same point always gives the same value, so it can be computed on demand in any order. The trick is to put randomness only on a grid, at the integer points, and fill the space between them smoothly.")}
      </p>

      <H2>{tx(t, "gdPerlin_valueTitle", "Value noise first")}</H2>
      <p>
        {tx(t, "gdPerlin_valueBody",
          "The most direct version gives every integer grid point a random height (with the hash function from the previous chapter) and blends the four corners of the cell containing the point. This is value noise. It works, but it looks blocky: the highest and lowest values always sit exactly on grid points, so the eye picks up the grid, and features tend to be squares aligned with the axes. Perlin's improvement was to make the random thing at each corner a direction instead of a height.")}
      </p>

      <H2>{tx(t, "gdPerlin_gradTitle", "Gradient noise, step by step")}</H2>
      <p>
        {tx(t, "gdPerlin_gradBody",
          "In Perlin (gradient) noise each grid corner gets a random unit vector, its gradient. Think of it as a tilted plane through that corner at height zero, sloping upward in the gradient's direction. For a point inside a cell, each of the four corners proposes a height: the height of its tilted plane at the point. Those four proposals are blended into the final value. Use the step buttons to follow one evaluation.")}
      </p>

      <PerlinStepsFigure t={t} />

      <Equation label={tx(t, "gdPerlin_eqCorner", "Steps 1–3: each corner's contribution")}
        where={[
          [r`\mathbf p = (x, y)`, tx(t, "gdPerlin_wP", "the point where we evaluate the noise")],
          [r`(i, j) = (\lfloor x \rfloor, \lfloor y \rfloor)`, tx(t, "gdPerlin_wIJ", "the integer coordinates of the cell's lower-left corner. ⌊·⌋ is floor: round down")],
          [r`(f_x, f_y) = (x - i,\ y - j)`, tx(t, "gdPerlin_wF", "the fractional part: where p sits inside its cell, each between 0 and 1")],
          [r`\mathbf g_{ab}`, tx(t, "gdPerlin_wG", "the gradient at corner (i + a, j + b), with a, b ∈ {0, 1}: a unit vector chosen by hashing the corner's coordinates with the seed")],
          [r`\mathbf p - (i{+}a,\ j{+}b)`, tx(t, "gdPerlin_wOff", "the offset from that corner to the point: (f_x − a, f_y − b)")],
          [r`d_{ab}`, tx(t, "gdPerlin_wD", "the dot product: the height of the corner's tilted plane at p. It is 0 at the corner itself, positive on the side the gradient points to, negative behind it")],
        ]}>
        {r`d_{ab} = \mathbf g_{ab} \cdot \big(f_x - a,\ f_y - b\big) \qquad a, b \in \{0, 1\}`}
      </Equation>
      <Equation label={tx(t, "gdPerlin_eqBlend", "Steps 4–5: fade and blend")}
        where={[
          [r`u = \operatorname{fade}(f_x),\ v = \operatorname{fade}(f_y)`, tx(t, "gdPerlin_wUV", "the blend weights. Using f_x directly (plain bilinear interpolation) would leave a visible crease along every cell border, because the slope jumps there")],
          [r`\operatorname{lerp}(d_{00}, d_{10}, u)`, tx(t, "gdPerlin_wBottom", "blend the two bottom corners along x")],
          [r`\operatorname{lerp}(d_{01}, d_{11}, u)`, tx(t, "gdPerlin_wTop", "blend the two top corners along x")],
          [r`\operatorname{lerp}(\ldots, \ldots, v)`, tx(t, "gdPerlin_wOuter", "blend those two results along y")],
        ]}>
        {r`\text{noise}(x, y) = \operatorname{lerp}\big(\operatorname{lerp}(d_{00}, d_{10}, u),\ \operatorname{lerp}(d_{01}, d_{11}, u),\ v\big)`}
      </Equation>

      <H3>{tx(t, "gdPerlin_fadeTitle", "Where the fade curve comes from")}</H3>
      <p>
        {tx(t, "gdPerlin_fadeBody",
          "Two neighbouring cells share an edge and the two corners on it, but each blends a different set of four corners. For the surface to join without a crease, the blend weight must stop changing at the edges, so the neighbouring cell's corners can take over smoothly. Perlin's original noise used smoothstep, 3t² − 2t³, whose slope is zero at t = 0 and t = 1. That removes creases in the value, but its second derivative (the curvature) still jumps at the edges, and when the noise is used to bend light, as in bump mapping, that jump shows up as visible grid lines. In 2002 Perlin switched to a fifth-degree polynomial that also has zero curvature at both ends.")}
      </p>
      <Equation label={tx(t, "gdPerlin_eqFade", "The quintic fade")}
        where={[
          [r`f(0) = 0,\ f(1) = 1`, tx(t, "gdPerlin_wEnds", "it goes from one corner's weight to the other's")],
          [r`f'(0) = f'(1) = 0`, tx(t, "gdPerlin_wSlope", "zero slope at the ends: no crease in the surface")],
          [r`f''(0) = f''(1) = 0`, tx(t, "gdPerlin_wCurv", "zero curvature at the ends: no crease in the lighting of the surface")],
        ]}
        note={tx(t, "gdPerlin_eqFadeNote", "Six conditions need a polynomial with six coefficients, which is degree 5. Solving them gives exactly 6t⁵ − 15t⁴ + 10t³. Written as t·t·t·(t·(6t − 15) + 10), it costs five multiplications.")}>
        {r`\operatorname{fade}(t) = 6t^5 - 15t^4 + 10t^3`}
      </Equation>

      <H3>{tx(t, "gdPerlin_codeTitle", "The code")}</H3>
      <p>
        {tx(t, "gdPerlin_codeBody",
          "Perlin's reference implementation does not hash with multiplications. It uses a permutation table: the numbers 0–255 in a shuffled order, stored twice in a row so indices up to 511 need no wrap. perm[perm[i] + j] turns a pair of cell coordinates into a pseudo-random byte, and the byte picks one of a few fixed gradient directions. Shuffling the table with a seeded generator gives a different noise per seed. The version below follows that structure in 2D, with 8 gradient directions.")}
      </p>
      <CodeBlock lang="cpp" filename="perlin2d.hpp" t={t}>{`class Perlin2D {
    uint8_t perm[512];
public:
    explicit Perlin2D(uint32_t seed) {
        std::array<uint8_t, 256> p;
        std::iota(p.begin(), p.end(), 0);                 // 0, 1, ..., 255
        std::mt19937 rng(seed);
        std::shuffle(p.begin(), p.end(), rng);            // a random permutation per seed
        for (int i = 0; i < 512; ++i) perm[i] = p[i & 255];   // stored twice: no wrap needed
    }

    float noise(float x, float y) const {
        int   xi = int(std::floor(x)), yi = int(std::floor(y));
        float fx = x - xi,             fy = y - yi;       // position inside the cell
        xi &= 255; yi &= 255;                             // the lattice repeats every 256 cells

        // Hash each corner to a byte
        int h00 = perm[perm[xi]     + yi],     h10 = perm[perm[xi + 1] + yi];
        int h01 = perm[perm[xi]     + yi + 1], h11 = perm[perm[xi + 1] + yi + 1];

        // Dot products with the corner offsets
        float d00 = grad(h00, fx,     fy);
        float d10 = grad(h10, fx - 1, fy);
        float d01 = grad(h01, fx,     fy - 1);
        float d11 = grad(h11, fx - 1, fy - 1);

        float u = fade(fx), v = fade(fy);
        return lerp(lerp(d00, d10, u), lerp(d01, d11, u), v);   // about −0.7 … 0.7
    }
private:
    static float fade(float t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    static float lerp(float a, float b, float t) { return a + (b - a) * t; }
    static float grad(int h, float x, float y) {
        // 8 directions: the 4 axes and the 4 diagonals (diagonals scaled to length 1)
        constexpr float D = 0.70710678f;
        switch (h & 7) {
            case 0: return  x;       case 1: return -x;
            case 2: return  y;       case 3: return -y;
            case 4: return ( x + y) * D;  case 5: return (-x + y) * D;
            case 6: return ( x - y) * D;  default: return (-x - y) * D;
        }
    }
};`}</CodeBlock>
      <H3>{tx(t, "gdPerlin_rangeTitle", "Range, scale and dimensions")}</H3>
      <p>
        {tx(t, "gdPerlin_rangeBody",
          "The output is not in [−1, 1]. In 2D the largest possible value is √2/2 ≈ 0.707 (at the centre of a cell whose four gradients all point at it), and typical values stay well inside ±0.5. Remap it to whatever range you need, and do not assume the extremes are ever reached. The noise has features about one cell wide, so noise(x · s, y · s) with a frequency s makes them 1/s units wide: to get hills 200 metres apart, sample noise(x / 200, z / 200). The same construction works in any dimension: 3D noise uses the 8 corners of a cube, and using time as an extra dimension (noise(x, y, time)) animates a 2D pattern smoothly, for clouds or fire.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "gdPerlin_zeroWarn", "Gradient noise is exactly 0 at every integer point, because the offset from a corner to itself is zero. A classic bug is sampling noise(x, y) at integer tile coordinates, noise(3, 7), noise(4, 7)…, and getting a perfectly flat world. Always scale the coordinates by a non-integer frequency, or add an offset such as 0.5.")}
      </Callout>

      <H2>{tx(t, "gdPerlin_fbmTitle", "Fractal noise: adding octaves")}</H2>
      <p>
        {tx(t, "gdPerlin_fbmBody",
          "One layer of noise gives smooth rolling blobs, all about the same size. Real terrain has detail at every scale: mountain ranges, then individual peaks, then ridges, then rocks. The standard way to get that is fractal Brownian motion (fBm): add several copies of the noise, each at a higher frequency and a lower amplitude than the previous one. Each copy is called an octave, borrowing the musical term, because the usual choice doubles the frequency each time.")}
      </p>
      <Equation label={tx(t, "gdPerlin_eqFbm", "Fractal Brownian motion")}
        where={[
          [r`N`, tx(t, "gdPerlin_wN", "the number of octaves. Each adds detail half the size of the previous one, so there is no point going past the size of a pixel or a vertex: 4–8 is typical")],
          [r`\ell`, tx(t, "gdPerlin_wLac", "lacunarity: the frequency multiplier between octaves, usually 2. Values that are not exactly 2 (like 1.98) keep the octaves' grids from lining up")],
          [r`g`, tx(t, "gdPerlin_wGain", "gain (or persistence): the amplitude multiplier, usually 0.5. Higher gain = rougher terrain, because the small details are nearly as strong as the big shapes")],
          [r`\textstyle\sum_k g^k`, tx(t, "gdPerlin_wNorm", "the sum of all amplitudes; dividing by it keeps the output in the same range whatever the number of octaves")],
          [r`\mathbf o_k`, tx(t, "gdPerlin_wOffset", "an offset (or a different seed) per octave, so the zeros at integer points of different octaves do not coincide")],
        ]}
        note={tx(t, "gdPerlin_eqFbmNote", "With ℓ = 2 and g = 0.5 each octave has half the size and half the height of the previous one. That self-similarity, the same statistics at every zoom level, is what makes the result look like natural terrain: coastlines, mountains and clouds are all roughly fractal.")}>
        {r`\operatorname{fbm}(\mathbf p) = \frac{\sum_{k=0}^{N-1} g^k\ \operatorname{noise}\!\big(\ell^k\,\mathbf p + \mathbf o_k\big)}{\sum_{k=0}^{N-1} g^k}`}
      </Equation>

      <TerrainFigure t={t} />

      <CodeBlock lang="cpp" filename="fbm.hpp" t={t}>{`float fbm(const Perlin2D& n, float x, float y, int octaves, float lacunarity = 2.f, float gain = 0.5f) {
    float sum = 0, amp = 1, freq = 1, norm = 0;
    for (int k = 0; k < octaves; ++k) {
        sum  += amp * n.noise(x * freq + k * 17.13f, y * freq - k * 9.71f);  // offset per octave
        norm += amp;
        amp  *= gain;
        freq *= lacunarity;
    }
    return sum / norm;
}

// A heightmap in metres: continents 2 km wide, up to 300 m high
float height(float wx, float wz) {
    float h = fbm(perlin, wx / 2000.f, wz / 2000.f, 6);      // about −0.5 … 0.5
    return (h * 1.25f + 0.5f) * 300.f;                        // remap to ~0 … 300
}`}</CodeBlock>

      <H3>{tx(t, "gdPerlin_variantsTitle", "Variations that shape the result")}</H3>
      <LessonTable
        headers={[tx(t, "gdPerlin_tVar", "Variation"), tx(t, "gdPerlin_tFormula", "Formula"), tx(t, "gdPerlin_tLook", "Look")]}
        rows={[
          [tx(t, "gdPerlin_v1", "Turbulence"), "Σ gᵏ |noise(ℓᵏp)|", tx(t, "gdPerlin_v1b", "the absolute value folds valleys into sharp creases: fire, smoke, marble veins")],
          [tx(t, "gdPerlin_v2", "Ridged"), "Σ gᵏ (1 − |noise(ℓᵏp)|)²", tx(t, "gdPerlin_v2b", "the creases turned upward into sharp mountain ridges")],
          [tx(t, "gdPerlin_v3", "Domain warping"), "fbm(p + w · fbm₂(p))", tx(t, "gdPerlin_v3b", "the lookup position is pushed around by another noise: swirls, eroded shapes, alien landscapes")],
          [tx(t, "gdPerlin_v4", "Island mask"), "h − k·|p − centre|²", tx(t, "gdPerlin_v4b", "lowers the edges of the map into the sea")],
          [tx(t, "gdPerlin_v5", "Terracing"), "round(h · n) / n (softened)", tx(t, "gdPerlin_v5b", "stepped plateaus, canyon walls")],
          [tx(t, "gdPerlin_v6", "Biomes"), tx(t, "gdPerlin_v6f", "height + a second, low-frequency noise for moisture"), tx(t, "gdPerlin_v6b", "a 2D lookup (height × moisture) picks desert, forest, tundra…")],
        ]}
      />

      <H2>{tx(t, "gdPerlin_simplexTitle", "Simplex noise and friends")}</H2>
      <p>
        {tx(t, "gdPerlin_simplexBody",
          "Classic Perlin noise blends 2ⁿ corners in n dimensions: 4 in 2D, 8 in 3D, 16 in 4D, and its square grid leaves faint horizontal and vertical streaks. Perlin's Simplex noise (2001) uses a grid of triangles (tetrahedra in 3D), the simplest shapes that fill space, so a point only has n + 1 corners, and each corner's contribution is a smooth radial falloff instead of a bilinear blend. It is faster in higher dimensions and looks more isotropic. Its 3D version was patented until January 2022, which led to OpenSimplex, a patent-free alternative; OpenSimplex2 is a good default today. In practice, most games use a library such as FastNoiseLite, which implements all of these plus cellular (Voronoi) noise and domain warping, in C++, C#, GLSL and more.")}
      </p>

      <H2>{tx(t, "gdPerlin_usesTitle", "Where games use noise")}</H2>
      <LessonTable
        headers={[tx(t, "gdPerlin_tUse", "Use"), tx(t, "gdPerlin_tHow", "How")]}
        rows={[
          [tx(t, "gdPerlin_u1", "Terrain"), tx(t, "gdPerlin_u1b", "fBm heightmap, sampled per vertex or per chunk; biomes from extra noise channels")],
          [tx(t, "gdPerlin_u2", "Caves"), tx(t, "gdPerlin_u2b", "3D noise: a voxel is solid where noise(x, y, z) > threshold")],
          [tx(t, "gdPerlin_u3", "Clouds, fire, water"), tx(t, "gdPerlin_u3b", "noise in a shader with time as a dimension (see the GLSL track)")],
          [tx(t, "gdPerlin_u4", "Camera shake, idle motion"), tx(t, "gdPerlin_u4b", "1D noise over time: smooth, random, frame-rate independent")],
          [tx(t, "gdPerlin_u5", "Wind in grass and trees"), tx(t, "gdPerlin_u5b", "noise(position + wind · time): neighbouring blades sway together, far ones do not")],
          [tx(t, "gdPerlin_u6", "Spawn density"), tx(t, "gdPerlin_u6b", "use the noise value as the probability of spawning, so forests have dense cores and sparse edges")],
        ]}
      />

      <H2>{tx(t, "gdPerlin_pitTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "gdPerlin_tSym", "Symptom"), tx(t, "gdPerlin_tCause", "Cause"), tx(t, "gdPerlin_tFix", "Fix")]}
        rows={[
          [tx(t, "gdPerlin_b1", "Completely flat terrain"), tx(t, "gdPerlin_c1", "sampling at integer coordinates, where gradient noise is 0"), tx(t, "gdPerlin_f1", "scale by a frequency like 1/64, or offset by 0.5")],
          [tx(t, "gdPerlin_b2", "Visible grid lines or diagonal streaks"), tx(t, "gdPerlin_c2", "linear or smoothstep fade; few gradient directions; octaves aligned"), tx(t, "gdPerlin_f2", "quintic fade, per-octave offsets, lacunarity ≠ 2 exactly, or simplex noise")],
          [tx(t, "gdPerlin_b3", "Terrain gets noisier far from the origin"), tx(t, "gdPerlin_c3", "float precision: at x = 100 000, a float's steps are ~0.008"), tx(t, "gdPerlin_f3", "use double for world coordinates, or noise relative to the chunk origin")],
          [tx(t, "gdPerlin_b4", "More octaves made it lower-contrast"), tx(t, "gdPerlin_c4", "normalising by Σgᵏ averages more layers, and averages are less extreme"), tx(t, "gdPerlin_f4", "remap by the observed range, or apply a curve afterwards")],
          [tx(t, "gdPerlin_b5", "The pattern repeats"), tx(t, "gdPerlin_c5", "the 256-entry permutation table repeats every 256 cells"), tx(t, "gdPerlin_f5", "a larger table or an integer hash instead of the table")],
        ]}
      />

      <KeyIdeas t={t} id="gdPerlin" items={[
        "Noise = randomness on a grid, smooth in between; deterministic, so it is computed on demand.",
        "Perlin: random gradients at corners; each corner votes g · (p − corner); blend the votes.",
        "The quintic fade 6t⁵ − 15t⁴ + 10t³ removes creases in both the surface and its shading.",
        "The output is roughly ±0.7, exactly 0 on integer points; scale coordinates by a frequency.",
        "fBm sums octaves: frequency × lacunarity, amplitude × gain; normalise by the total amplitude.",
      ]} />
    </Article>
  );
}
