"use client";

// GLSL track — "Noise & Procedural Patterns".

import type { TrackTranslations } from "@/lib/tracks/types";
import { tx } from "@/lib/tracks/tx";
import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { KeyIdeas } from "@/components/lesson/Prose";
import { ShaderPlayground } from "@/components/lesson/glsl/ShaderPlayground";
import { Noise1DFigure } from "@/components/lesson/glsl/Noise1DFigure";
import { NOISE_PRESETS } from "../presets/effects";

const r = String.raw;

export function NoiseContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "glsl05_intro",
          "Noise is the foundation of procedural textures, terrain generation, material variation, and organic-looking effects. GLSL has no built-in noise function (the historical noise() was removed from the spec), so you write your own using hash functions."
        )}
      </p>

      <H2>{tx(t, "glsl05_hashTitle", "Hash function")}</H2>
      <p>{tx(t, "glsl05_hashBody", "A hash function maps a value to a pseudo-random number. In GLSL, the classic approach uses dot product + sin + fract to generate repeatable pseudo-random floats from a vec2 input.")}</p>
      <CodeBlock lang="glsl" filename="hash.glsl" t={t}>{`// Returns pseudo-random float in [0, 1) from a vec2 seed
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// 2D hash — returns pseudo-random vec2
vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)),
             dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
}

// Usage: pixel-level noise (completely white-noise, no smoothness)
float noise = hash(floor(uv * 10.0));  // 10×10 grid of random values`}</CodeBlock>

      <H2>{tx(t, "glsl05_valueNoiseTitle", "Value noise")}</H2>
      <p>{tx(t, "glsl05_valueNoiseBody", "Value noise interpolates between random values on a grid. It produces the characteristic smooth, blobby look seen in clouds and terrain.")}</p>
      <CodeBlock lang="glsl" filename="value_noise.glsl" t={t}>{`float noise(vec2 p) {
    vec2 i = floor(p);      // integer cell
    vec2 f = fract(p);      // position within cell

    // Smooth the interpolation factor (Hermite cubic)
    vec2 u = f * f * (3.0 - 2.0*f);

    // Sample four corners of the cell
    float a = hash(i + vec2(0,0));
    float b = hash(i + vec2(1,0));
    float c = hash(i + vec2(0,1));
    float d = hash(i + vec2(1,1));

    // Bilinear interpolation
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Usage: smooth noise at scale
float n = noise(uv * 4.0);  // 4 "cells" across the screen`}</CodeBlock>

      <H2>{tx(t, "glsl05_fbmTitle", "Fractal Brownian Motion (fBm)")}</H2>
      <p>{tx(t, "glsl05_fbmBody", "fBm layers multiple octaves of noise at increasing frequency and decreasing amplitude. This produces the natural, self-similar look of clouds, mountains, and fire. Each layer is called an octave.")}</p>
      <CodeBlock lang="glsl" filename="fbm.glsl" t={t}>{`float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 6; i++) {
        value     += amplitude * noise(p * frequency);
        frequency *= 2.0;    // each octave doubles the frequency
        amplitude *= 0.5;    // each octave halves the amplitude
    }
    return value;
}

// Cloud-like effect
void main() {
    vec2  uv    = (gl_FragCoord.xy * 2.0 - uResolution) / uResolution.y;
    float cloud = fbm(uv * 3.0 + uTime * 0.1);  // slowly drifting clouds
    vec3  color = mix(vec3(0.3, 0.4, 0.8), vec3(1.0), cloud);
    FragColor = vec4(color, 1.0);
}`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "glsl05_fbmTip",
          "The octave loop multiplies frequency by 2.0 (lacunarity) and amplitude by 0.5 (gain) each iteration. After 4-6 octaves, adding more has diminishing returns and can cause aliasing artifacts."
        )}
      </Callout>


      <H2>{tx(t, "glsl05_insideTitle", "Inside the noise functions")}</H2>
      <p>{tx(t, "glsl05_insideBody", "Every lattice noise has the same three parts: a hash that gives each integer point a random value, what is stored there (a value or a gradient), and the curve used to blend between points. The figure takes them apart in one dimension, where each piece is visible.")}</p>
      <Noise1DFigure t={t} />
      <Equation label={tx(t, "glsl05_gradLabel", "Gradient noise in 2D (Perlin)")}
        where={[
          [r`\mathbf i,\ \mathbf f`, tx(t, "glsl05_wIF", "integer cell and fractional position inside it")],
          [r`\mathbf g(\cdot)`, tx(t, "glsl05_wG", "random unit gradient at a lattice corner (from a hash)")],
          [r`u = 6f^5 - 15f^4 + 10f^3`, tx(t, "glsl05_wU", "the quintic fade, per axis")],
        ]}
        note={tx(t, "glsl05_gradNote", "Each corner contributes a plane (gradient · offset) that is zero at the corner itself; the fade blends the four. Because the value at every lattice point is 0, peaks fall between the points and the grid is far less visible than with value noise.")}>
        {r`n(\mathbf p) = \operatorname{mix}\!\Big(\operatorname{mix}\big(\mathbf g_{00}\cdot\mathbf f,\ \mathbf g_{10}\cdot(\mathbf f - (1,0)),\ u_x\big),\ \operatorname{mix}\big(\mathbf g_{01}\cdot(\mathbf f - (0,1)),\ \mathbf g_{11}\cdot(\mathbf f - (1,1)),\ u_x\big),\ u_y\Big)`}
      </Equation>
      <Equation label={tx(t, "glsl05_fbmLabel", "Fractal sum (fBm)")}
        where={[
          [r`\lambda`, tx(t, "glsl05_wLac", "lacunarity: frequency multiplier per octave, usually ≈ 2")],
          [r`g`, tx(t, "glsl05_wGain", "gain (persistence): amplitude multiplier, usually 0.5")],
          [r`H`, tx(t, "glsl05_wH", "the Hurst exponent: g = λ^(−H); H = 1 is the natural 1/f spectrum")],
        ]}>
        {r`\operatorname{fbm}(\mathbf p) = \sum_{i=0}^{N-1} g^{\,i}\; n\!\left(\lambda^{i}\,R^{i}\,\mathbf p\right)`}
      </Equation>
      <LessonTable
        headers={[tx(t, "glsl05_thKind", "Noise"), tx(t, "glsl05_thCost", "Cost (2D)"), tx(t, "glsl05_thLook", "Look / use")]}
        rows={[
          [tx(t, "glsl05_k1", "Value"), tx(t, "glsl05_k1c", "4 hashes"), tx(t, "glsl05_k1l", "blocky blobs; cheap clouds, dithering")],
          [tx(t, "glsl05_k2", "Gradient (Perlin)"), tx(t, "glsl05_k2c", "4 hashes + 4 dots"), tx(t, "glsl05_k2l", "smooth, grid mostly hidden: terrain, fBm")],
          [tx(t, "glsl05_k3", "Simplex"), tx(t, "glsl05_k3c", "3 corners (n + 1 in n-D)"), tx(t, "glsl05_k3l", "like Perlin, no axis bias, scales better to 3D/4D")],
          [tx(t, "glsl05_k4", "Worley (cellular)"), tx(t, "glsl05_k4c", "9 feature points"), tx(t, "glsl05_k4l", "cells, stones, scales, caustics, cracks")],
          [tx(t, "glsl05_k5", "Domain-warped fBm"), tx(t, "glsl05_k5c", "3× fBm"), tx(t, "glsl05_k5l", "marble, gas giants, smoke, alien flesh")],
        ]}
      />
      <ShaderPlayground presets={NOISE_PRESETS} t={t} id="glsl05Noise" />
      <Callout type="warn" t={t}>
        {tx(t, "glsl05_hashWarn", "The classic fract(sin(dot(p, k)) · 43758.5453) hash is fine for effects, but on some mobile GPUs sin() loses precision for large arguments and the noise turns into visible stripes. For anything long-lived or large-scale, use an integer hash (PCG, xxHash-style) on uint coordinates, or a tileable noise texture, which is also faster.")}
      </Callout>
      <KeyIdeas t={t} id="glsl05" items={[
        "Lattice noise = hash at integer points + stored value or gradient + a fade curve.",
        "Gradient (Perlin) noise hides the grid better than value noise; simplex is cheaper in higher dimensions.",
        "Worley noise measures distance to random feature points: cells.",
        "fBm sums octaves (×lacunarity in frequency, ×gain in amplitude); domain warping feeds noise into noise.",
      ]} />
    </article>
  );
}
