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

      <H2>{tx(t, "glsl02_trigTitle", "Trigonometric functions")}</H2>
      <p>{tx(t, "glsl02_trigBody", "All trig functions work in radians. They are great for creating oscillating animations and circular motion — combine sin and cos to trace a circle.")}</p>
      <CodeBlock lang="glsl" filename="trig.glsl" t={t}>{`sin(x), cos(x), tan(x)     // standard trig (radians)
asin(x), acos(x), atan(x)  // inverse trig
atan(y, x)                 // 2-argument atan2 equivalent

// Animate a point in a circle of radius r
float angle = uTime * 2.0;              // full revolution per second
vec2 orbit  = vec2(cos(angle), sin(angle)) * 0.5;

// Oscillate between 0 and 1
float pulse = sin(uTime * 3.14159) * 0.5 + 0.5;`}</CodeBlock>


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
      <KeyIdeas t={t} id="glsl02" items={[
        "Built-ins are component-wise and hardware-accelerated: abs, fract, mod, clamp, mix, step, smoothstep…",
        "Think in curves: plot the function from input to output before writing it.",
        "smoothstep is a clamped Hermite cubic: seamless transitions and anti-aliased edges.",
        "fwidth(x) gives the per-pixel change of anything: the key to resolution-independent edges.",
      ]} />
    </article>
  );
}
