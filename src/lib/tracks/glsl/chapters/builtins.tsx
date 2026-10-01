"use client";

// GLSL track — "Built-in Functions".

import type { TrackTranslations } from "@/lib/tracks/types";
import { tx } from "@/lib/tracks/tx";
import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { KeyIdeas } from "@/components/lesson/Prose";
import { FunctionPlotter } from "@/components/lesson/glsl/FunctionPlotter";

const r = String.raw;

export function BuiltinsContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "glsl02_intro",
          "GLSL ships with a large library of built-in functions implemented natively in hardware — they are faster than anything you could write yourself. Knowing them well means shorter, faster shaders."
        )}
      </p>

      <H2>{tx(t, "glsl02_mathTitle", "Math functions")}</H2>
      <p>{tx(t, "glsl02_mathBody", "The core math functions work component-wise on vectors, which is very useful for per-channel color operations.")}</p>
      <CodeBlock lang="glsl" filename="math.glsl" t={t}>{`// Component-wise on scalars and vectors equally
abs(x)        // absolute value
sign(x)       // -1.0, 0.0, or 1.0
floor(x)      // round toward -∞
ceil(x)       // round toward +∞
round(x)      // nearest integer
fract(x)      // fractional part: x - floor(x)
mod(x, y)     // floating-point remainder
min(x, y)     // component-wise minimum
max(x, y)     // component-wise maximum
clamp(x,lo,hi)// clamp to [lo, hi]

// Example: tile coordinates to create a repeating grid
vec2 tiled = fract(uv * 5.0);  // 5×5 grid of [0,1] tiles`}</CodeBlock>
      <p>{tx(t, "glsl02_mathSteps", "Component-wise means the function runs on each component separately: abs(vec3(−1, 2, −3)) = (1, 2, 3), and min(vec2(1, 5), vec2(3, 2)) = (1, 2). Worked rounding with x = −1.3: floor = −2 (towards −∞, so down, not towards zero), ceil = −1, round = −1, fract = −1.3 − (−2) = 0.7. GLSL's mod(x, y) is x − y·floor(x/y), so mod(−1.3, 1.0) = 0.7 as well: unlike C's fmod (−0.3), it never goes negative for positive y, which is what makes it safe for tiling across the origin. In the tiling line, a pixel at uv = (0.47, 0.9) gives uv·5 = (2.35, 4.5) and tiled = (0.35, 0.5).")}</p>

      <H2>{tx(t, "glsl02_interpTitle", "Interpolation functions")}</H2>
      <p>{tx(t, "glsl02_interpBody", "These are some of the most used functions in all of GLSL. They control how values transition between states and are the basis of many visual effects.")}</p>
      <CodeBlock lang="glsl" filename="interp.glsl" t={t}>{`// mix: linear interpolation between a and b by t
mix(a, b, t)   // = a*(1-t) + b*t,  t in [0,1]

vec3 warm = vec3(1.0, 0.5, 0.0);
vec3 cool = vec3(0.0, 0.5, 1.0);
vec3 c    = mix(warm, cool, 0.5);  // midpoint between orange and blue

// step: hard threshold — 0 if x < edge, else 1
step(edge, x)

// smoothstep: smooth S-curve transition between edge0 and edge1
smoothstep(0.0, 1.0, x)  // slow start, fast middle, slow end
smoothstep(0.4, 0.6, x)  // transition only happens between 0.4 and 0.6`}</CodeBlock>
      <p>{tx(t, "glsl02_interpSteps", "Worked: mix(warm, cool, 0.5) = warm·0.5 + cool·0.5 = (0.5, 0.5, 0.5), a grey, because orange and blue are opposites; with t = 0.25 it is (0.75, 0.5, 0.25), still mostly orange. t is not clamped, so t = 1.5 extrapolates past b. step(0.5, 0.49) = 0 and step(0.5, 0.5) = 1: note the edge comes first, the opposite order from most languages' comparisons. smoothstep(0.4, 0.6, 0.45): t = (0.45 − 0.4)/0.2 = 0.25, and t²(3 − 2t) = 0.0625 · 2.5 = 0.156, lower than the straight-line 0.25 because the curve starts slowly.")}</p>

      <Callout type="tip" t={t}>
        {tx(t, "glsl02_smoothstepNote",
          "smoothstep is everywhere. Unlike step (a hard threshold), it produces a smooth S-curve transition. Use it for anti-aliased edges, dissolve effects, and any time you want a gradual transition without an explicit lerp."
        )}
      </Callout>

      <H2>{tx(t, "glsl02_geoTitle", "Geometric functions")}</H2>
      <p>{tx(t, "glsl02_geoBody", "Used constantly in lighting, physics, and ray marching. These operate on the vector as a whole, not component-wise.")}</p>
      <CodeBlock lang="glsl" filename="geo.glsl" t={t}>{`length(v)          // magnitude of vector:  sqrt(dot(v,v))
distance(a, b)     // = length(b - a)
dot(a, b)          // dot product: |a||b|cos(angle)  — used in lighting
cross(a, b)        // cross product (vec3 only) — perpendicular vector
normalize(v)       // unit vector in direction of v: v / length(v)
reflect(I, N)      // reflect incident ray I across normal N
refract(I, N, eta) // Snell's law refraction, eta = ratio of IOR

// Lighting pattern: diffuse intensity
float diff = max(dot(normalize(normal), normalize(lightDir)), 0.0);`}</CodeBlock>
      <p>{tx(t, "glsl02_geoSteps", "Worked: v = (3, 4, 0) has length √(9 + 16) = 5, so normalize(v) = (0.6, 0.8, 0). dot((0, 1, 0), (0.6, 0.8, 0)) = 0.8, which is cos of the angle between them (about 37°): the diffuse line above would light that surface at 80%. max(…, 0) stops surfaces facing away from getting negative light. reflect(I, N) = I − 2·dot(N, I)·N: a ray going down-right, I = (0.707, −0.707, 0), off a floor with N = (0, 1, 0) gives dot = −0.707 and I + 1.414·N = (0.707, 0.707, 0), the same ray bouncing up-right. N must be normalised or the result is scaled wrongly. In refract, eta is n₁/n₂, e.g. 1.0/1.5 from air into glass.")}</p>

      <H2>{tx(t, "glsl02_trigTitle", "Trigonometric functions")}</H2>
      <p>{tx(t, "glsl02_trigBody", "All trig functions work in radians. They are great for creating oscillating animations and circular motion — combine sin and cos to trace a circle.")}</p>
      <CodeBlock lang="glsl" filename="trig.glsl" t={t}>{`sin(x), cos(x), tan(x)     // standard trig (radians)
asin(x), acos(x), atan(x)  // inverse trig
atan(y, x)                 // 2-argument atan2 equivalent

// Animate a point in a circle of radius r
float angle = uTime * 6.28318;          // 2π rad/s = one full revolution per second
vec2 orbit  = vec2(cos(angle), sin(angle)) * 0.5;   // radius 0.5

// Oscillate between 0 and 1, one cycle every 2 seconds
float pulse = sin(uTime * 3.14159) * 0.5 + 0.5;`}</CodeBlock>
      <p>{tx(t, "glsl02_trigSteps", "Radians measure an angle by arc length on a circle of radius 1, so a full turn is 2π ≈ 6.283. Multiplying time by 2π gives exactly one turn per second; multiplying by 2.0 would give one turn every π ≈ 3.14 s. (cos(a), sin(a)) is the point on the unit circle at angle a, so at uTime = 0.25 s the angle is π/2 and orbit = (0, 1)·0.5 = (0, 0.5), a quarter-turn up. For the pulse, sin has period 2π, so sin(uTime·π) repeats every 2 s; · 0.5 + 0.5 maps −1..1 to 0..1.")}</p>


      <H2>{tx(t, "glsl02_plotTitle", "See every function")}</H2>
      <p>{tx(t, "glsl02_plotBody", "Shader programmers think in graphs. Before writing a shader you picture the curve that maps an input (a distance, an angle, a time) to an output (a brightness, a blend factor). The plotter below runs on the GPU and accepts any GLSL expression in x. Try the presets, then edit them: combine abs, fract, smoothstep and pow until you get the shape you want.")}</p>
      <FunctionPlotter t={t} />
      <Equation label={tx(t, "glsl02_smoothLabel", "smoothstep, exactly")}
        note={tx(t, "glsl02_smoothNote", "A Hermite cubic with zero slope at both ends, which is why joins made with it look seamless. The quintic 6t⁵ − 15t⁴ + 10t³ also has zero curvature at the ends (Perlin's \"smootherstep\"), which matters when the result is differentiated for normals.")}
        glsl="float t = clamp((x - e0) / (e1 - e0), 0.0, 1.0);  return t * t * (3.0 - 2.0 * t);">
        {r`\operatorname{smoothstep}(e_0, e_1, x) = t^2(3 - 2t), \quad t = \operatorname{clamp}\!\left(\frac{x - e_0}{e_1 - e_0},\ 0,\ 1\right)`}
      </Equation>
      <LessonTable
        headers={[tx(t, "glsl02_thShape", "Shape you want"), tx(t, "glsl02_thExpr", "Expression"), tx(t, "glsl02_thUse", "Typical use")]}
        rows={[
          [tx(t, "glsl02_s1", "Repeating 0→1 ramp (saw)"), "fract(x)", tx(t, "glsl02_s1u", "tiling, scrolling, stripes")],
          [tx(t, "glsl02_s2", "Triangle wave"), "abs(fract(x) * 2.0 - 1.0)", tx(t, "glsl02_s2u", "ping-pong animation, mirrored tiling")],
          [tx(t, "glsl02_s3", "Square wave"), "step(0.5, fract(x))", tx(t, "glsl02_s3u", "checkers, blinking")],
          [tx(t, "glsl02_s4", "Smooth pulse around c"), "1.0 - smoothstep(0.0, w, abs(x - c))", tx(t, "glsl02_s4u", "lines, rings, highlights")],
          [tx(t, "glsl02_s5", "Remap a range"), "(x - a) / (b - a)", tx(t, "glsl02_s5u", "the inverse of mix(a, b, t)")],
          [tx(t, "glsl02_s6", "Ease in / out"), "pow(x, k)  /  1.0 - pow(1.0 - x, k)", tx(t, "glsl02_s6u", "animation curves, falloffs")],
          [tx(t, "glsl02_s7", "Pixel-width edge"), "smoothstep(-w, w, d), w = fwidth(d)", tx(t, "glsl02_s7u", "anti-aliasing any threshold")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "glsl02_derivNote", "dFdx(v), dFdy(v) and fwidth(v) = |dFdx(v)| + |dFdy(v)| tell you how much any value changes to the next pixel. The GPU shades pixels in 2×2 quads and simply subtracts neighbours. They exist only in fragment shaders, and they are how texture() picks mip levels and how every edge in this track is anti-aliased.")}
      </Callout>

      <H2>{tx(t, "glsl02_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "glsl02_thSymptom", "Symptom"), tx(t, "glsl02_thCause", "Cause"), tx(t, "glsl02_thFix", "Fix")]}
        rows={[
          [tx(t, "glsl02_m1a", "Threshold inverted"), tx(t, "glsl02_m1b", "Wrote step(x, edge) instead of step(edge, x)"), tx(t, "glsl02_m1c", "Edge first, value second")],
          [tx(t, "glsl02_m2a", "NaN / black pixels"), tx(t, "glsl02_m2b", "pow(x, k) with x < 0, sqrt of a negative, normalize(vec3(0))"), tx(t, "glsl02_m2c", "max(x, 0.0) first; guard zero-length vectors")],
          [tx(t, "glsl02_m3a", "Animation far too fast or slow"), tx(t, "glsl02_m3b", "Degrees passed to sin/cos"), tx(t, "glsl02_m3c", "Use radians: radians(deg) or deg · π/180")],
          [tx(t, "glsl02_m4a", "Lighting too bright or dim"), tx(t, "glsl02_m4b", "dot of vectors that are not unit length"), tx(t, "glsl02_m4c", "normalize both before dot")],
          [tx(t, "glsl02_m5a", "smoothstep gives garbage"), tx(t, "glsl02_m5b", "e0 == e1 divides by zero; the spec also calls e0 > e1 undefined, though GPUs compute the inverted curve"), tx(t, "glsl02_m5c", "Keep e0 < e1; write 1.0 − smoothstep(e0, e1, x) for the inverted curve")],
        ]}
      />
      <KeyIdeas t={t} id="glsl02" items={[
        "Built-ins are component-wise and hardware-accelerated: abs, fract, mod, clamp, mix, step, smoothstep…",
        "Think in curves: plot the function from input to output before writing it.",
        "smoothstep is a clamped Hermite cubic: seamless transitions and anti-aliased edges.",
        "fwidth(x) gives the per-pixel change of anything: the key to resolution-independent edges.",
      ]} />
    </article>
  );
}
