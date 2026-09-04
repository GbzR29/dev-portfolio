// src/lib/tracks/glsl/index.tsx
"use client";

import { Track } from "@/lib/tracks/types";
import {
  CodeBlock, Callout, H2, LessonTable,
} from "@/components/lesson/LessonComponents";

function tx(t: any, key: string, fallback: string): string {
  const val = t?.[key];
  return val && val.length > 0 ? val : fallback;
}

// ── Chapter 01: Types & Vectors ───────────────────────────────────────────────

function TypesContent({ t }: { t: any }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "glsl01_intro",
          "GLSL has a richer type system than C++ in one specific area: built-in vector and matrix types that map directly to GPU registers. Understanding them is the foundation of every shader you will write."
        )}
      </p>

      <H2>{tx(t, "glsl01_scalarsTitle", "Scalar types")}</H2>
      <p>{tx(t, "glsl01_scalarsBody", "GLSL has four scalar types. float is the workhorse — most math in shaders uses it.")}</p>
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
      <p>{tx(t, "glsl01_vectorsBody", "Vectors are the most important types in GLSL.")}</p>
      <CodeBlock lang="glsl" filename="vectors.glsl" t={t}>{`vec2 uv       = vec2(0.5, 0.75);   // 2 floats — UV coordinates
vec3 color    = vec3(1.0, 0.0, 0.0); // 3 floats — red
vec4 position = vec4(0.0, 0.0, 0.0, 1.0); // 4 floats — homogeneous coord

// Integer and boolean variants
ivec2 texelCoord = ivec2(128, 256);
bvec3 mask       = bvec3(true, false, true);`}</CodeBlock>

      <H2>{tx(t, "glsl01_swizzleTitle", "Swizzling")}</H2>
      <p>{tx(t, "glsl01_swizzleBody", "Swizzling lets you reorder and select components in a single expression.")}</p>
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
      <p>{tx(t, "glsl01_constructorsBody", "Vectors are constructed by calling the type as a function.")}</p>
      <CodeBlock lang="glsl" filename="constructors.glsl" t={t}>{`vec3 a = vec3(1.0);              // (1.0, 1.0, 1.0) — broadcast scalar
vec3 b = vec3(vec2(1.0, 2.0), 3.0); // combine smaller vector + scalar
vec4 c = vec4(b, 1.0);          // extend vec3 with w=1.0
vec2 d = vec2(c.zw);            // take last two components of c`}</CodeBlock>

      <H2>{tx(t, "glsl01_matricesTitle", "Matrices")}</H2>
      <p>{tx(t, "glsl01_matricesBody", "mat4 is a 4×4 matrix stored column-major.")}</p>
      <CodeBlock lang="glsl" filename="matrices.glsl" t={t}>{`mat4 identity = mat4(1.0);   // diagonal = 1, rest = 0
mat2 m2 = mat2(1.0, 0.0,     // column 0
               0.0, 1.0);    // column 1

// Matrix-vector multiplication (standard linear algebra)
vec4 transformed = identity * vec4(1.0, 2.0, 3.0, 1.0);

// Access columns with [] operator (column-major!)
vec4 col0 = identity[0];  // first column`}</CodeBlock>

      <H2>{tx(t, "glsl01_castingTitle", "Type casting")}</H2>
      <p>{tx(t, "glsl01_castingBody", "GLSL has no implicit conversions — cast explicitly.")}</p>
      <CodeBlock lang="glsl" filename="casting.glsl" t={t}>{`int   i = 3;
float f = float(i);   // 3.0  — REQUIRED, not implicit

float pi = 3.14159;
int   n  = int(pi);   // 3    — truncates, not rounds

// Common pattern: cast texel coordinates to float for UV math
ivec2 coord = ivec2(gl_FragCoord.xy);
vec2  uv    = vec2(coord) / vec2(uResolution);`}</CodeBlock>

    </article>
  );
}

// ── Chapter 02: Built-in Functions ────────────────────────────────────────────

function BuiltinsContent({ t }: { t: any }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "glsl02_intro",
          "GLSL ships with a large library of built-in functions implemented natively in hardware — faster than anything you could write yourself."
        )}
      </p>

      <H2>{tx(t, "glsl02_mathTitle", "Math functions")}</H2>
      <p>{tx(t, "glsl02_mathBody", "The core math functions work component-wise on vectors.")}</p>
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
      <p>{tx(t, "glsl02_interpBody", "These are some of the most used functions in all of GLSL.")}</p>
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
          "smoothstep is everywhere. Unlike step (a hard threshold), it produces a smooth S-curve. Use it for anti-aliased edges, dissolve effects, and gradual transitions."
        )}
      </Callout>

      <H2>{tx(t, "glsl02_geoTitle", "Geometric functions")}</H2>
      <p>{tx(t, "glsl02_geoBody", "Used constantly in lighting, physics, and ray marching.")}</p>
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
      <p>{tx(t, "glsl02_trigBody", "All trig functions work in radians — great for oscillating animations.")}</p>
      <CodeBlock lang="glsl" filename="trig.glsl" t={t}>{`sin(x), cos(x), tan(x)     // standard trig (radians)
asin(x), acos(x), atan(x)  // inverse trig
atan(y, x)                 // 2-argument atan2 equivalent

// Animate a point in a circle of radius r
float angle = uTime * 2.0;              // full revolution per second
vec2 orbit  = vec2(cos(angle), sin(angle)) * 0.5;

// Oscillate between 0 and 1
float pulse = sin(uTime * 3.14159) * 0.5 + 0.5;`}</CodeBlock>

    </article>
  );
}

// ── Chapter 03: Fragment Coordinates & UV ─────────────────────────────────────

function FragCoordContent({ t }: { t: any }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "glsl03_intro",
          "The fragment shader has access to the pixel's screen position through gl_FragCoord. Combined with a resolution uniform, this gives you the foundation for full-screen shader effects."
        )}
      </p>

      <H2>{tx(t, "glsl03_fragcoordTitle", "gl_FragCoord")}</H2>
      <p>{tx(t, "glsl03_fragcoordBody", "gl_FragCoord.xy gives the pixel position with (0,0) at the bottom-left corner.")}</p>
      <CodeBlock lang="glsl" filename="fragcoord.glsl" t={t}>{`// gl_FragCoord is built-in — always available in fragment shaders
// .xy = pixel position in window coordinates (0,0 = bottom-left)
// .z  = depth in [0.0, 1.0]
// .w  = 1.0 / clip-space w (for perspective-correct interpolation)

uniform vec2 uResolution;  // window size in pixels, set from C++

void main() {
    vec2 pixelPos = gl_FragCoord.xy;        // e.g. (400.5, 300.5)
    vec2 uv       = pixelPos / uResolution; // [0,1] range
    FragColor = vec4(uv, 0.0, 1.0);         // red=X, green=Y gradient
}`}</CodeBlock>

      <H2>{tx(t, "glsl03_centeredTitle", "Centering and aspect ratio correction")}</H2>
      <p>{tx(t, "glsl03_centeredBody", "For most effects you want a centered coordinate system with aspect ratio correction.")}</p>
      <CodeBlock lang="glsl" filename="centered_uv.glsl" t={t}>{`uniform vec2 uResolution;

void main() {
    // Standard "ShaderToy" coordinate setup:
    // 1. Center: transform [0,1] to [-1, +1]
    // 2. Correct aspect ratio using height as reference
    vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution) / uResolution.y;
    //         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //         uv.x = [-aspect, +aspect]
    //         uv.y = [-1.0,    +1.0]

    // Now a circle at the origin looks perfectly round
    float circle = length(uv) - 0.5;
    float mask   = smoothstep(0.01, -0.01, circle);
    FragColor = vec4(vec3(mask), 1.0);
}`}</CodeBlock>

      <H2>{tx(t, "glsl03_timeTitle", "Animating with time")}</H2>
      <p>{tx(t, "glsl03_timeBody", "Pass a float uniform that increases each frame, combine with sin/cos for looping animations.")}</p>
      <CodeBlock lang="glsl" filename="time_anim.glsl" t={t}>{`uniform float uTime;       // seconds since start, set each frame
uniform vec2  uResolution;

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution) / uResolution.y;

    // Spinning color pattern
    float angle = atan(uv.y, uv.x) + uTime;
    float r     = length(uv);
    float bands = sin(angle * 6.0 + r * 10.0) * 0.5 + 0.5;

    FragColor = vec4(bands, bands * 0.5, 1.0 - bands, 1.0);
}`}</CodeBlock>

      <CodeBlock lang="cpp" filename="set_uniforms.cpp" t={t}>{`// Set these every frame in your render loop:
glUniform2f(glGetUniformLocation(prog, "uResolution"),
            (float)width, (float)height);
glUniform1f(glGetUniformLocation(prog, "uTime"),
            (float)glfwGetTime());`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "glsl03_patternTip",
          "The pattern uv = (gl_FragCoord.xy * 2.0 - uResolution) / uResolution.y is the standard ShaderToy setup. It centers the coordinate system and corrects the aspect ratio, giving [-aspect, aspect] on X and [-1, 1] on Y."
        )}
      </Callout>

    </article>
  );
}

// ── Chapter 04: Signed Distance Functions ─────────────────────────────────────

function SDFContent({ t }: { t: any }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "glsl04_intro",
          "A Signed Distance Function (SDF) returns the distance from a point to the nearest surface of a shape. Negative = inside, positive = outside, zero = exactly on the edge. SDFs let you draw any shape analytically with perfect anti-aliased edges."
        )}
      </p>

      <H2>{tx(t, "glsl04_conceptTitle", "The concept")}</H2>
      <p>{tx(t, "glsl04_conceptBody", "Sample the SDF at the current UV position. If negative, output the shape color. Use smoothstep to anti-alias the edge.")}</p>
      <CodeBlock lang="glsl" filename="sdf_concept.glsl" t={t}>{`float sdfCircle(vec2 p, float r) {
    return length(p) - r;
}

void main() {
    vec2  uv   = (gl_FragCoord.xy * 2.0 - uResolution) / uResolution.y;
    float dist = sdfCircle(uv, 0.5);

    // Hard edge — aliased
    // float inside = dist < 0.0 ? 1.0 : 0.0;

    // Smooth edge — anti-aliased using screen-space derivative
    float px     = fwidth(dist);  // pixel width in SDF space
    float inside = smoothstep(px, -px, dist);

    FragColor = vec4(vec3(inside), 1.0);
}`}</CodeBlock>

      <H2>{tx(t, "glsl04_circleTitle", "SDF: Circle")}</H2>
      <p>{tx(t, "glsl04_circleBody", "The simplest SDF. Distance from a point to a circle of radius r at the origin is length(p) - r.")}</p>
      <CodeBlock lang="glsl" filename="sdf_shapes.glsl" t={t}>{`float sdfCircle(vec2 p, float r) {
    return length(p) - r;
}

// Translate: move the shape by subtracting offset from p
float c1 = sdfCircle(uv - vec2(0.3, 0.0), 0.2);   // circle at (0.3, 0)
float c2 = sdfCircle(uv - vec2(-0.3, 0.0), 0.15);  // circle at (-0.3, 0)`}</CodeBlock>

      <H2>{tx(t, "glsl04_boxTitle", "SDF: Rectangle")}</H2>
      <p>{tx(t, "glsl04_boxBody", "The exact box SDF — b is the half-size of the box.")}</p>
      <CodeBlock lang="glsl" filename="sdf_box.glsl" t={t}>{`float sdfBox(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

// Rounded rectangle: add a radius to the SDF
float sdfRoundedBox(vec2 p, vec2 b, float r) {
    return sdfBox(p, b - r) - r;
}

// Usage
float box     = sdfBox(uv, vec2(0.4, 0.2));          // 0.8 wide, 0.4 tall
float rounded = sdfRoundedBox(uv, vec2(0.4, 0.2), 0.05); // with rounded corners`}</CodeBlock>

      <H2>{tx(t, "glsl04_combineTitle", "Combining shapes")}</H2>
      <p>{tx(t, "glsl04_combineBody", "Because SDFs return distances, combining them takes only a few characters.")}</p>
      <CodeBlock lang="glsl" filename="sdf_combine.glsl" t={t}>{`// Boolean operations
float sdfUnion(float d1, float d2)     { return min(d1, d2); }
float sdfSubtract(float d1, float d2)  { return max(d1, -d2); }
float sdfIntersect(float d1, float d2) { return max(d1, d2); }

// Smooth union — organic blending (k controls blend radius)
float sdfSmoothUnion(float d1, float d2, float k) {
    float h = clamp(0.5 + 0.5*(d2-d1)/k, 0.0, 1.0);
    return mix(d2, d1, h) - k*h*(1.0-h);
}

// Example: two circles that smoothly merge into each other
float c1     = sdfCircle(uv - vec2( 0.3*sin(uTime), 0.0), 0.25);
float c2     = sdfCircle(uv - vec2(-0.3*sin(uTime), 0.0), 0.20);
float merged = sdfSmoothUnion(c1, c2, 0.15);`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "glsl04_combineWarn",
          "Smooth union (smin) blends two shapes smoothly at their boundary using parameter k to control the blending radius. This is how organic-looking blobs and metaballs are made — the shapes attract each other."
        )}
      </Callout>

    </article>
  );
}

// ── Chapter 05: Noise & Procedural Patterns ───────────────────────────────────

function NoiseContent({ t }: { t: any }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "glsl05_intro",
          "Noise is the foundation of procedural textures, terrain, material variation, and organic effects. GLSL has no built-in noise function, so you implement your own from hash functions."
        )}
      </p>

      <H2>{tx(t, "glsl05_hashTitle", "Hash function")}</H2>
      <p>{tx(t, "glsl05_hashBody", "A hash maps a value to a pseudo-random number using dot + sin + fract.")}</p>
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
      <p>{tx(t, "glsl05_valueNoiseBody", "Value noise interpolates between random grid values — smooth, blobby like clouds.")}</p>
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
      <p>{tx(t, "glsl05_fbmBody", "fBm layers multiple octaves at increasing frequency and decreasing amplitude.")}</p>
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
          "The octave loop multiplies frequency by 2.0 (lacunarity) and amplitude by 0.5 (gain) each iteration. After 4–6 octaves, adding more has diminishing returns and can introduce aliasing."
        )}
      </Callout>

    </article>
  );
}

// ── Chapter 06: Shader Class in C++ ───────────────────────────────────────────

function ShaderClassContent({ t }: { t: any }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "glsl06_intro",
          "Embedding shader source in C++ string literals works for tiny examples, but breaks down quickly in real projects. A dedicated Shader class that loads, compiles, and manages GLSL files makes iterating dramatically faster."
        )}
      </p>

      <H2>{tx(t, "glsl06_problemTitle", "The problem with string literals")}</H2>
      <p>{tx(t, "glsl06_problemBody", "Shader source in string literals requires a C++ recompile for every GLSL tweak — and you lose IDE syntax highlighting.")}</p>

      <H2>{tx(t, "glsl06_classTitle", "Shader class interface")}</H2>
      <p>{tx(t, "glsl06_classBody", "A minimal Shader class: constructor with file paths, use() to bind it, and uniform setters.")}</p>
      <CodeBlock lang="cpp" filename="Shader.h" t={t}>{`#pragma once
#include <glad/glad.h>
#include <glm/glm.hpp>
#include <string>

class Shader {
public:
    unsigned int ID;

    Shader(const char* vertexPath, const char* fragmentPath);

    void use() const { glUseProgram(ID); }
    void del() const { glDeleteProgram(ID); }

    // Uniform setters
    void setBool (const std::string& name, bool  v) const;
    void setInt  (const std::string& name, int   v) const;
    void setFloat(const std::string& name, float v) const;
    void setVec2 (const std::string& name, glm::vec2 v) const;
    void setVec3 (const std::string& name, glm::vec3 v) const;
    void setMat4 (const std::string& name, glm::mat4 v) const;

private:
    static unsigned int compile(unsigned int type, const std::string& src);
    static void checkErrors(unsigned int id, bool isProgram);
};`}</CodeBlock>

      <H2>{tx(t, "glsl06_implTitle", "Implementation")}</H2>
      <CodeBlock lang="cpp" filename="Shader.cpp" t={t}>{`#include "Shader.h"
#include <glm/gtc/type_ptr.hpp>
#include <fstream>
#include <sstream>
#include <iostream>

// Load file → string
static std::string readFile(const char* path) {
    std::ifstream file(path);
    if (!file) { std::cerr << "Cannot open shader: " << path << "\\n"; return ""; }
    std::stringstream ss;
    ss << file.rdbuf();
    return ss.str();
}

Shader::Shader(const char* vertPath, const char* fragPath) {
    unsigned int vs = compile(GL_VERTEX_SHADER,   readFile(vertPath));
    unsigned int fs = compile(GL_FRAGMENT_SHADER, readFile(fragPath));

    ID = glCreateProgram();
    glAttachShader(ID, vs);
    glAttachShader(ID, fs);
    glLinkProgram(ID);
    checkErrors(ID, true);

    glDeleteShader(vs);
    glDeleteShader(fs);
}

unsigned int Shader::compile(unsigned int type, const std::string& src) {
    unsigned int id = glCreateShader(type);
    const char* c   = src.c_str();
    glShaderSource(id, 1, &c, nullptr);
    glCompileShader(id);
    checkErrors(id, false);
    return id;
}

void Shader::checkErrors(unsigned int id, bool isProgram) {
    int  ok; char log[1024];
    if (isProgram) {
        glGetProgramiv(id, GL_LINK_STATUS, &ok);
        if (!ok) { glGetProgramInfoLog(id, 1024, nullptr, log); std::cerr << "LINK: " << log; }
    } else {
        glGetShaderiv(id, GL_COMPILE_STATUS, &ok);
        if (!ok) { glGetShaderInfoLog(id, 1024, nullptr, log); std::cerr << "COMPILE: " << log; }
    }
}

// Uniform setters — must call use() before calling these
void Shader::setFloat(const std::string& n, float v) const {
    glUniform1f(glGetUniformLocation(ID, n.c_str()), v);
}
void Shader::setVec3(const std::string& n, glm::vec3 v) const {
    glUniform3fv(glGetUniformLocation(ID, n.c_str()), 1, glm::value_ptr(v));
}
void Shader::setMat4(const std::string& n, glm::mat4 v) const {
    glUniformMatrix4fv(glGetUniformLocation(ID, n.c_str()), 1, GL_FALSE, glm::value_ptr(v));
}`}</CodeBlock>

      <H2>{tx(t, "glsl06_hotreloadTitle", "Hot reload pattern")}</H2>
      <p>{tx(t, "glsl06_hotreloadBody", "Watch shader file modification time. When it changes, recompile and swap the program ID.")}</p>
      <CodeBlock lang="cpp" filename="hot_reload.cpp" t={t}>{`#include <filesystem>
#include <chrono>

struct ShaderWatcher {
    Shader*   shader;
    std::string vertPath, fragPath;
    std::filesystem::file_time_type lastMod;

    void update() {
        auto t = std::filesystem::last_write_time(vertPath);
        if (t != lastMod) {
            lastMod = t;
            unsigned int oldID = shader->ID;
            try {
                Shader fresh(vertPath.c_str(), fragPath.c_str());
                glDeleteProgram(oldID);
                shader->ID = fresh.ID;
                std::cout << "Shader reloaded OK\\n";
            } catch (...) {
                std::cerr << "Reload failed — keeping previous shader\\n";
            }
        }
    }
};

// In your render loop:
// watcher.update();  // polls every frame (cheap — just stat() the file)`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "glsl06_errorTip",
          "Always keep the old shader program if recompilation fails — a broken shader should not crash your app. Print the error to stderr with the filename and line number, and continue rendering with the previous working program."
        )}
      </Callout>

    </article>
  );
}

// ── Exported track ────────────────────────────────────────────────────────────

export const glslTrack: Track = {
  id: "glsl",
  title: "GLSL Shaders",
  chapters: [
    { id: "types",       title: "Types & Vectors",            minRead: 8,  content: (t) => <TypesContent      t={t} /> },
    { id: "builtins",    title: "Built-in Functions",         minRead: 10, content: (t) => <BuiltinsContent    t={t} /> },
    { id: "fragcoord",   title: "Fragment Coordinates & UV",  minRead: 9,  content: (t) => <FragCoordContent   t={t} /> },
    { id: "sdf",         title: "Signed Distance Functions",  minRead: 11, content: (t) => <SDFContent         t={t} /> },
    { id: "noise",       title: "Noise & Procedural Patterns",minRead: 10, content: (t) => <NoiseContent       t={t} /> },
    { id: "shaderclass", title: "Shader Class in C++",        minRead: 12, content: (t) => <ShaderClassContent t={t} /> },
  ],
};
