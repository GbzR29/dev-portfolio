"use client";

// GLSL track — "Types & Vectors".

import type { TrackTranslations } from "@/lib/tracks/types";
import { tx } from "@/lib/tracks/tx";
import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { KeyIdeas, Goals } from "@/components/lesson/Prose";
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

      <Goals t={t} id="glsl01" items={[
        "Pick the right scalar, vector or matrix type for a value.",
        "Read and reorder vector components with swizzles.",
        "Build vectors and matrices with constructors, and convert between types.",
        "Avoid the int-versus-float mistakes that stop a shader compiling.",
      ]} />

      <H2>{tx(t, "glsl01_scalarsTitle", "Scalar types")}</H2>
      <p>{tx(t, "glsl01_scalarsBody", "GLSL has four scalar types. float is the workhorse — most math in shaders uses it. Integer types are limited on older hardware; prefer float arithmetic unless you genuinely need integer semantics.")}</p>
      <LessonTable
        headers={[tx(t, "glsl01_thType", "Type"), tx(t, "glsl01_thDesc", "Description"), tx(t, "glsl01_thEx", "Example")]}
        rows={[
          ["float", tx(t, "glsl01_tFloat", "32-bit floating point — default for all math"), "float f = 1.5;"],
          ["int",   tx(t, "glsl01_tInt", "32-bit signed integer"), "int i = -3;"],
          ["uint",  tx(t, "glsl01_tUint", "32-bit unsigned integer"), "uint u = 42u;"],
          ["bool",  tx(t, "glsl01_tBool", "Boolean — true or false"), "bool b = true;"],
        ]}
      />
      <p>{tx(t, "glsl01_floatSteps", "What 32-bit float means in practice: about 7 significant decimal digits. 1.0 + 0.0000001 is still 1.0, and at 100 000 the gap between neighbouring floats is about 0.008. That is why a timer running for days, or world positions millions of units from the origin, start to jitter: the small changes no longer fit. int holds whole numbers from about −2.1 billion to +2.1 billion; uint from 0 to about 4.3 billion, and the u suffix marks a uint literal.")}</p>

      <H2>{tx(t, "glsl01_vectorsTitle", "Vector types")}</H2>
      <p>{tx(t, "glsl01_vectorsBody", "Vectors are the most important types in GLSL. You will use vec2, vec3, and vec4 constantly. They can represent positions, colors, directions, UV coordinates — any set of 2–4 related floats.")}</p>
      <CodeBlock lang="glsl" filename="vectors.glsl" t={t}>{`vec2 uv       = vec2(0.5, 0.75);   // 2 floats — UV coordinates
vec3 color    = vec3(1.0, 0.0, 0.0); // 3 floats — red
vec4 position = vec4(0.0, 0.0, 0.0, 1.0); // 4 floats — homogeneous coord

// Integer and boolean variants
ivec2 texelCoord = ivec2(128, 256);
bvec3 mask       = bvec3(true, false, true);`}</CodeBlock>
      <p>{tx(t, "glsl01_vecMathBody", "Arithmetic on vectors works component by component, which is what makes colour and position maths so short. Worked: vec3(1, 2, 3) + vec3(10, 20, 30) = (11, 22, 33); vec3(1, 2, 3) * vec3(2, 0, 1) = (2, 0, 3), not a dot product; vec3(1, 2, 3) * 2.0 = (2, 4, 6), the scalar applies to every component. Darkening a colour by 30% is simply color * 0.7, and tinting it is color * tint. The dot and cross products have their own functions, dot() and cross().")}</p>

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
      <p>{tx(t, "glsl01_swizzleRules", "Three rules the compiler enforces. You cannot mix alias sets in one swizzle: v.xg is an error. A swizzle you write to cannot repeat a component: v.xx = … is an error, because x would be written twice. And you cannot name a component the type does not have: a vec2 has no .z. Swizzles cost nothing at run time; the GPU routes components while reading registers.")}</p>

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
      <p>{tx(t, "glsl01_matSteps", "Column-major means the constructor fills one column at a time, top to bottom. mat2(1, 2, 3, 4) is the matrix whose first column is (1, 2) and second column (3, 4), so its top row reads 1 3 and its bottom row 2 4. Worked: that matrix times vec2(1, 1) is 1·(1, 2) + 1·(3, 4) = (4, 6), the columns weighted by the vector's components. m[1] is the second column (3, 4), and m[1][0] is 3. Order matters: M * v treats v as a column, v * M as a row, which equals transpose(M) * v. The usual vertex line is projection * view * model * position, read right to left: model first, projection last.")}</p>

      <H2>{tx(t, "glsl01_castingTitle", "Type casting")}</H2>
      <p>{tx(t, "glsl01_castingBody2", "Desktop GLSL (1.20 and later) silently converts int to float in a few places, but GLSL ES, used by WebGL and phones, converts nothing, and no version converts float to int for you. Write explicit casts, float(myInt) and int(myFloat), and your shader compiles everywhere. Forgetting them is the most common compile error when a shader moves from desktop to the web.")}</p>
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

      <H2>{tx(t, "glsl01_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "glsl01_thSymptom", "Symptom"), tx(t, "glsl01_thCause", "Cause"), tx(t, "glsl01_thFix", "Fix")]}
        rows={[
          [tx(t, "glsl01_m1a", "\"cannot convert from int to float\""), tx(t, "glsl01_m1b", "Integer literal or variable used in float maths (strict compiler)"), tx(t, "glsl01_m1c", "Write 1.0, not 1; wrap variables in float()")],
          [tx(t, "glsl01_m2a", "A ratio is always 0"), tx(t, "glsl01_m2b", "Integer division: i / n with both ints truncates"), tx(t, "glsl01_m2c", "float(i) / float(n)")],
          [tx(t, "glsl01_m3a", "Transform looks mirrored or skewed"), tx(t, "glsl01_m3b", "Matrix filled row by row, or v * M instead of M * v"), tx(t, "glsl01_m3c", "Constructors take columns; put the matrix on the left")],
          [tx(t, "glsl01_m4a", "\"illegal vector field selection\""), tx(t, "glsl01_m4b", "Mixed alias sets (.xg), or .z on a vec2"), tx(t, "glsl01_m4c", "One set per swizzle; check the vector's size")],
          [tx(t, "glsl01_m5a", "Animation freezes on phones only"), tx(t, "glsl01_m5b", "Time or UVs in mediump"), tx(t, "glsl01_m5c", "highp for time, positions and UVs")],
        ]}
      />
      <KeyIdeas t={t} id="glsl01" items={[
        "Scalars float/int/uint/bool; vectors vecN/ivecN/bvecN; matrices matN, column-major.",
        "Swizzle freely: .xyzw = .rgba = .stpq; reorder, repeat, and assign to several components at once.",
        "1 is an int, 1.0 a float; cast explicitly so the shader also compiles under strict GLSL ES.",
        "highp for positions, UVs and time; mediump is fine for colours.",
        "Fixed-size arrays, C-like structs, in/out/inout parameters, no recursion.",
      ]} />
    </article>
  );
}
