"use client";

// GLSL track — "Types & Vectors".

import type { TrackTranslations } from "@/lib/tracks/types";
import { tx } from "@/lib/tracks/tx";
import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { KeyIdeas } from "@/components/lesson/Prose";
import { ShaderPlayground } from "@/components/lesson/glsl/ShaderPlayground";
import { SWIZZLE_PRESETS } from "../presets/basics";

export function TypesContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "glsl01_intro",
          "GLSL has a richer type system than C++ in one specific area: built-in vector and matrix types that map directly to GPU registers. Understanding them and how to manipulate them efficiently is the foundation of every shader you will write."
        )}
      </p>

      <H2>{tx(t, "glsl01_scalarsTitle", "Scalar types")}</H2>
      <p>{tx(t, "glsl01_scalarsBody", "GLSL has four scalar types. float is the workhorse — most math in shaders uses it. Integer types are limited on older hardware; prefer float arithmetic unless you genuinely need integer semantics.")}</p>
      <LessonTable
        headers={["Type", "Description", "Example"]}
        rows={[
          ["float",  "32-bit floating point — default for all math",     "float f = 1.5;"],
          ["int",    "32-bit signed integer",                             "int i = -3;"],
          ["uint",   "32-bit unsigned integer",                           "uint u = 42u;"],
          ["bool",   "Boolean — true or false",                           "bool b = true;"],
        ]}
      />

      <H2>{tx(t, "glsl01_vectorsTitle", "Vector types")}</H2>
      <p>{tx(t, "glsl01_vectorsBody", "Vectors are the most important types in GLSL. You will use vec2, vec3, and vec4 constantly. They can represent positions, colors, directions, UV coordinates — any set of 2–4 related floats.")}</p>
      <CodeBlock lang="glsl" filename="vectors.glsl" t={t}>{`vec2 uv       = vec2(0.5, 0.75);   // 2 floats — UV coordinates
vec3 color    = vec3(1.0, 0.0, 0.0); // 3 floats — red
vec4 position = vec4(0.0, 0.0, 0.0, 1.0); // 4 floats — homogeneous coord

// Integer and boolean variants
ivec2 texelCoord = ivec2(128, 256);
bvec3 mask       = bvec3(true, false, true);`}</CodeBlock>

      <H2>{tx(t, "glsl01_swizzleTitle", "Swizzling")}</H2>
      <p>{tx(t, "glsl01_swizzleBody", "Swizzling lets you reorder and select components of a vector in a single expression. You can use .xyzw, .rgba, or .stpq — all equivalent aliases for the same four components. You can read any combination and even repeat components.")}</p>
      <CodeBlock lang="glsl" filename="swizzle.glsl" t={t}>{`vec4 v = vec4(1.0, 2.0, 3.0, 4.0);

// Read individual components
float x = v.x;   // 1.0  (same as v.r, v.s)
float w = v.w;   // 4.0  (same as v.a, v.q)

// Reorder into a new vector
vec3 yzx  = v.yzx;  // vec3(2.0, 3.0, 1.0)
vec2 ww   = v.ww;   // vec2(4.0, 4.0)  — can repeat
vec3 rgb  = v.rgb;  // same as v.xyz — color alias

// Write multiple components at once
v.xy = vec2(10.0, 20.0);  // sets x and y
v.zw = v.xy;              // copy xy into zw`}</CodeBlock>

      <H2>{tx(t, "glsl01_constructorsTitle", "Constructors")}</H2>
      <p>{tx(t, "glsl01_constructorsBody", "Vectors are constructed by calling the type as a function. You can mix scalars and smaller vectors to fill a larger one. A single scalar fills all components — vec3(1.0) creates (1.0, 1.0, 1.0).")}</p>
      <CodeBlock lang="glsl" filename="constructors.glsl" t={t}>{`vec3 a = vec3(1.0);              // (1.0, 1.0, 1.0) — broadcast scalar
vec3 b = vec3(vec2(1.0, 2.0), 3.0); // combine smaller vector + scalar
vec4 c = vec4(b, 1.0);          // extend vec3 with w=1.0
vec2 d = vec2(c.zw);            // take last two components of c`}</CodeBlock>

      <H2>{tx(t, "glsl01_matricesTitle", "Matrices")}</H2>
      <p>{tx(t, "glsl01_matricesBody", "mat4 is a 4×4 matrix stored column-major. mat4(1.0) creates an identity matrix. Matrix × vector multiplication follows standard linear algebra: transform = mat4 * vec4.")}</p>
      <CodeBlock lang="glsl" filename="matrices.glsl" t={t}>{`mat4 identity = mat4(1.0);   // diagonal = 1, rest = 0
mat2 m2 = mat2(1.0, 0.0,     // column 0
               0.0, 1.0);    // column 1

// Matrix-vector multiplication (standard linear algebra)
vec4 transformed = identity * vec4(1.0, 2.0, 3.0, 1.0);

// Access columns with [] operator (column-major!)
vec4 col0 = identity[0];  // first column`}</CodeBlock>

      <H2>{tx(t, "glsl01_castingTitle", "Type casting")}</H2>
      <p>{tx(t, "glsl01_castingBody", "GLSL has no implicit conversions. You must cast explicitly: float(myInt), int(myFloat). Forgetting this is a very common compile error when mixing integer and float expressions.")}</p>
      <CodeBlock lang="glsl" filename="casting.glsl" t={t}>{`int   i = 3;
float f = float(i);   // 3.0  — REQUIRED, not implicit

float pi = 3.14159;
int   n  = int(pi);   // 3    — truncates, not rounds

// Common pattern: cast texel coordinates to float for UV math
ivec2 coord = ivec2(gl_FragCoord.xy);
vec2  uv    = vec2(coord) / vec2(uResolution);`}</CodeBlock>


      <H2>{tx(t, "glsl01_precisionTitle", "Precision qualifiers")}</H2>
      <p>{tx(t, "glsl01_precisionBody", "GLSL ES (WebGL, mobile) makes you say how precise each float is. Desktop GLSL accepts the keywords and ignores them. highp is 32-bit IEEE. mediump is at least 16-bit half precision (range ±65504, about 3 decimal digits), and on mobile GPUs it can run twice as fast. Colours are fine in mediump; positions, UVs on large textures and time are not.")}</p>
      <CodeBlock lang="glsl" filename="precision.glsl" t={t}>{`#version 300 es
precision highp float;       // default for every float in this shader
precision mediump sampler2D;

mediump vec3 color;          // per-variable override
highp   vec2 uv;             // needs full precision on a 4K texture

// A classic mediump bug: uTime grows forever. After ~1 hour, sin(uTime * 10.0)
// in half precision has lost every digit after the point, and the animation freezes.
// Keep time in highp, or wrap it: mod(uTime, 1000.0).`}</CodeBlock>

      <H2>{tx(t, "glsl01_aggTitle", "Arrays, structs and functions")}</H2>
      <p>{tx(t, "glsl01_aggBody", "Arrays have a fixed size known at compile time. Structs group fields as in C. Functions pass parameters by value, and the qualifiers in, out and inout say which direction data flows. There are no pointers and no recursion, because the GPU has no call stack to speak of.")}</p>
      <CodeBlock lang="glsl" filename="aggregates.glsl" t={t}>{`struct Light {
    vec3  position;
    vec3  color;
    float radius;
};
uniform Light uLights[4];                       // array of structs, set per field from C++

const vec2 OFFSETS[4] = vec2[4](vec2(-1, 0), vec2(1, 0), vec2(0, -1), vec2(0, 1));

// in: copied in (default)   out: written back   inout: both
void split(in vec3 c, out float luma, inout vec3 accum) {
    luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
    accum += c;
}

float sum = 0.0;
for (int i = 0; i < 4; i++) sum += OFFSETS[i].x;  // constant trip count: the compiler unrolls it`}</CodeBlock>

      <H2>{tx(t, "glsl01_swizzleLiveTitle", "Swizzling, live")}</H2>
      <ShaderPlayground presets={SWIZZLE_PRESETS} t={t} id="glsl01Swz" />
      <Callout type="warn" t={t}>
        {tx(t, "glsl01_intWarn", "Integer and float literals are different types: 1 is an int, 1.0 a float, and vec3 v = 1 does not compile in strict compilers (WebGL is strict). Division of ints truncates: 3 / 2 == 1. Write float literals with a dot, and use float(i) whenever a loop index takes part in maths.")}
      </Callout>
      <KeyIdeas t={t} id="glsl01" items={[
        "Scalars float/int/uint/bool; vectors vecN/ivecN/bvecN; matrices matN, column-major.",
        "Swizzle freely: .xyzw = .rgba = .stpq; reorder, repeat, and assign to several components at once.",
        "No implicit conversions: 1 is an int, 1.0 a float; cast explicitly.",
        "highp for positions, UVs and time; mediump is fine for colours.",
        "Fixed-size arrays, C-like structs, in/out/inout parameters, no recursion.",
      ]} />
    </article>
  );
}
