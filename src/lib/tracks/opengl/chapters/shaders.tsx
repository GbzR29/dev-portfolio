"use client";

// OpenGL track — "First Shaders".

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export function ShadersContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "ch04_intro",
          "Shaders are small programs that run on the GPU for every vertex or pixel. Writing them in GLSL feels different from writing C++, but the concepts are familiar: you have types, functions, and control flow. This chapter covers everything you need to write your first pair of shaders."
        )}
      </p>

      <H2>{tx(t, "ch04_basicsTitle", "GLSL basics")}</H2>
      <CodeBlock lang="glsl" filename="types.glsl" t={t}>{`// Scalar types
float f = 1.0;
int   i = 2;

// Vector types
vec2 uv    = vec2(0.5, 0.5);
vec3 color = vec3(1.0, 0.0, 0.0);  // red
vec4 pos   = vec4(0.0, 0.0, 0.0, 1.0);

// Swizzling: access any combination of components
vec3 n  = vec3(0.0, 1.0, 0.0);
float y = n.y;    // 1.0
vec2 xz = n.xz;  // vec2(0.0, 0.0)

// Matrix type
mat4 transform = mat4(1.0);  // identity matrix`}</CodeBlock>

      <H2>{tx(t, "ch04_passingTitle", "Passing data between stages")}</H2>
      <p>{tx(t, "ch04_passingBody", "Data flows through the pipeline using qualifiers. The keywords changed between older and modern GLSL:")}</p>

      <LessonTable
        headers={[
          tx(t, "shaderTableHeader0", "Qualifier"),
          tx(t, "shaderTableHeader1", "Used in"),
          tx(t, "shaderTableHeader2", "Meaning"),
        ]}
        rows={[
          ["in",      tx(t, "shaderQualInVertex",    "vertex shader"),   tx(t, "shaderQualInMeaning",      "Data coming from the VBO (one value per vertex)")],
          ["out",     tx(t, "shaderQualInVertex",    "vertex shader"),   tx(t, "shaderQualOutMeaning",     "Data passed to the next stage (interpolated)")],
          ["in",      tx(t, "shaderQualInFrag",      "fragment shader"), tx(t, "shaderQualInFragMeaning",  "Receives the interpolated out from vertex shader")],
          ["uniform", tx(t, "shaderQualBoth",        "both"),            tx(t, "shaderQualUniformMeaning", "Value set from C++, same for all vertices and pixels")],
        ]}
      />

      <H2>{tx(t, "ch04_colorExampleTitle", "A color interpolation example")}</H2>
      <p>{tx(t, "ch04_colorExampleBody", "Let us pass a color per vertex and let OpenGL interpolate it across the triangle. This is the classic OpenGL rainbow triangle.")}</p>

      <CodeBlock lang="glsl" filename="vertex_color.glsl" t={t}>{`#version 460 core

layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aColor;

out vec3 vertexColor;  // sent to fragment shader (interpolated)

void main() {
    gl_Position = vec4(aPos, 1.0);
    vertexColor = aColor;
}`}</CodeBlock>

      <CodeBlock lang="glsl" filename="fragment_color.glsl" t={t}>{`#version 460 core

in  vec3 vertexColor;  // received from vertex shader
out vec4 FragColor;

void main() {
    FragColor = vec4(vertexColor, 1.0);
}`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "ch04_interpolationNote",
          "When the GPU rasterizes a triangle, each pixel fragment gets a color that is the weighted average of the three vertex colors based on how close the pixel is to each vertex. This automatic interpolation is called barycentric interpolation and it is free, you do not need to write any code for it."
        )}
      </Callout>

      <H2>{tx(t, "ch04_uniformTitle", "Uniforms")}</H2>
      <p>
        {tx(t, "ch04_uniformBody",
          "A uniform is a value you set from your C++ code that stays the same for all vertices in a draw call. It is perfect for things like transformation matrices, time, or a global color tint."
        )}
      </p>

      <CodeBlock lang="glsl" filename="uniform.glsl" t={t}>{`#version 460 core

out vec4 FragColor;
uniform vec4 uColor;  // set from C++

void main() {
    FragColor = uColor;
}`}</CodeBlock>

      <CodeBlock lang="cpp" filename="set_uniform.cpp" t={t}>{`glUseProgram(shaderProgram);  // must be active first

int loc = glGetUniformLocation(shaderProgram, "uColor");
glUniform4f(loc, 1.0f, 0.5f, 0.2f, 1.0f);`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "ch04_uniformWarn",
          "glUniform* always writes to the program currently in use, so call glUseProgram first. With no program in use the call fails with GL_INVALID_OPERATION. With a different program in use it writes into that one instead, if it happens to have a uniform at that location. OpenGL 4.1 added glProgramUniform*, which takes the program as its first argument and needs no glUseProgram at all."
        )}
      </Callout>

      <Callout type="warn" t={t}>
        {tx(t, "ch04_unusedWarn",
          "glGetUniformLocation returns −1 when the name does not exist, and also when the uniform exists but is never used: the compiler removes unused uniforms from the program. A glUniform* call with location −1 is silently ignored. So a typo, or a uniform whose only use you commented out while testing, just looks like 'my uniform does nothing'. While debugging, check the location against −1."
        )}
      </Callout>

      <Callout type="tip" t={t}>
        {tx(t, "ch04_classTip",
          "Looking up a location and calling glUniform* for every value quickly gets repetitive. The GLSL track's Shader Class in C++ chapter wraps loading from files, compiling, linking, the error checks and the uniform setters into one small class. Later chapters of this track use that style: shader.use(), then shader.setMat4(\"model\", model), shader.setVec3(…) and so on. A setter the class does not have yet, such as setMat3, is a one-line addition of the same shape."
        )}
      </Callout>

    </article>
  );
}
