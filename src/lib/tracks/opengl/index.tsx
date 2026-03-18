// src/lib/tracks/opengl/index.tsx
"use client";

import { Track } from "@/lib/tracks/types";
import {
  CodeBlock, Callout, IC, H2, H3,
  PipelineDiagram, NDCDiagram,
  VBOFlowDiagram, VAODiagram,
} from "@/components/lesson/LessonComponents";

// tx: returns translated string or English fallback. Never shows a key name.
function tx(t: any, key: string, fallback: string): string {
  const val = t?.[key];
  return val && val.length > 0 ? val : fallback;
}

// ── Chapter 01: The Graphics Pipeline ─────────────────────────────────────────

function PipelineContent({ t }: { t: any }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "ch01_intro",
          "OpenGL operates in 3D space, but your screen is a 2D grid of pixels. The graphics pipeline is the sequence of steps that transforms your 3D vertex data into the colored pixels you see. Understanding it is the single most important thing you can do before writing a single line of OpenGL code."
        )}
      </p>

      <H2>{tx(t, "ch01_stagesTitle", "The stages")}</H2>
      <p>
        {tx(t, "ch01_stagesBody",
          "The pipeline is made up of stages, some of which are fixed (you cannot change them, only configure them), and some of which are programmable via small programs called shaders, written in GLSL (OpenGL Shading Language)."
        )}
      </p>

      <PipelineDiagram t={t} />

      <p>
        {tx(t, "ch01_stagesNote",
          "The two stages you will interact with most are the Vertex Shader and the Fragment Shader. They are the minimum you need to write before drawing anything to the screen."
        )}
      </p>

      <H2>{tx(t, "ch01_ndcTitle", "Normalized Device Coordinates")}</H2>
      <p>
        {tx(t, "ch01_ndcBody",
          "OpenGL does not use pixel coordinates (0 to 800, 0 to 600). Instead, it defines a coordinate system called Normalized Device Coordinates (NDC) where every axis goes from -1.0 to +1.0. Any vertex outside this range is clipped and not drawn."
        )}
      </p>

      <NDCDiagram />

      <p>
        {tx(t, "ch01_ndcAfter",
          "This is what the three vertices of a simple triangle look like in NDC:"
        )}
      </p>

      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`// Three vertices, each with 3 floats: X, Y, Z
float vertices[] = {
    -0.5f, -0.5f, 0.0f,   // bottom left
     0.5f, -0.5f, 0.0f,   // bottom right
     0.0f,  0.5f, 0.0f    // top center
};`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "ch01_ndcCallout",
          "NDC is not the same as screen space. After the vertex shader runs, OpenGL automatically converts NDC coordinates to screen pixels using the viewport dimensions you set with glViewport(). You do not do this conversion yourself."
        )}
      </Callout>

      <H2>{tx(t, "ch01_vertexShaderTitle", "The Vertex Shader")}</H2>
      <p>
        {tx(t, "ch01_vertexShaderBody",
          "The vertex shader runs once per vertex. Its only required job is to output the final clip-space position of the vertex through the built-in variable gl_Position. For now, we will pass the vertex position through unchanged."
        )}
      </p>

      <CodeBlock lang="glsl" filename="vertex.glsl" t={t}>{`#version 460 core

layout (location = 0) in vec3 aPos;

void main() {
    gl_Position = vec4(aPos.x, aPos.y, aPos.z, 1.0);
}`}</CodeBlock>

      <H2>{tx(t, "ch01_fragmentShaderTitle", "The Fragment Shader")}</H2>
      <p>
        {tx(t, "ch01_fragmentShaderBody",
          "After rasterization, the fragment shader runs once per pixel fragment. Its job is to output the final color of that pixel. The output variable can be named anything, but it must be declared as an out vec4."
        )}
      </p>

      <CodeBlock lang="glsl" filename="fragment.glsl" t={t}>{`#version 460 core

out vec4 FragColor;

void main() {
    FragColor = vec4(1.0f, 0.5f, 0.2f, 1.0f);
}`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "ch01_colorTip",
          "Colors in GLSL are represented as floats in the range 0.0 to 1.0, not 0 to 255. To convert: divide your RGB value by 255. So rgb(255, 128, 51) becomes vec4(1.0, 0.5, 0.2, 1.0)."
        )}
      </Callout>

      <H2>{tx(t, "ch01_compileTitle", "How shaders get compiled")}</H2>
      <p>
        {tx(t, "ch01_compileBody",
          "Shaders are not compiled on your CPU at build time. They are compiled at runtime by the GPU driver. The process looks like this:"
        )}
      </p>

      <CodeBlock lang="cpp" filename="shader_compile.cpp" t={t}>{`unsigned int vertexShader = glCreateShader(GL_VERTEX_SHADER);
glShaderSource(vertexShader, 1, &vertexShaderSource, NULL);
glCompileShader(vertexShader);

// Always check for compile errors
int success;
glGetShaderiv(vertexShader, GL_COMPILE_STATUS, &success);
if (!success) {
    char infoLog[512];
    glGetShaderInfoLog(vertexShader, 512, NULL, infoLog);
    std::cerr << "Shader compile error: " << infoLog << std::endl;
}

unsigned int shaderProgram = glCreateProgram();
glAttachShader(shaderProgram, vertexShader);
glAttachShader(shaderProgram, fragmentShader);
glLinkProgram(shaderProgram);
glDeleteShader(vertexShader);
glDeleteShader(fragmentShader);`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "ch01_compileWarn",
          "Always check for shader compile errors during development. A typo in your GLSL will silently produce a black screen without the error check. The error message from glGetShaderInfoLog tells you the exact line number that failed."
        )}
      </Callout>

      <H2>{tx(t, "ch01_nextTitle", "What comes next")}</H2>
      <p>
        {tx(t, "ch01_nextBody",
          "Now that you understand the pipeline stages, we need to actually get the vertex data from the CPU to the GPU. That is the job of Vertex Buffer Objects (VBOs), which is exactly what the next chapter covers."
        )}
      </p>

    </article>
  );
}

// ── Chapter 02: VBOs ──────────────────────────────────────────────────────────

function VBOContent({ t }: { t: any }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "ch02_intro",
          "Your vertex data starts as a C++ array living in RAM. The GPU cannot access RAM directly, it can only read from its own memory (VRAM). A Vertex Buffer Object (VBO) is the mechanism OpenGL provides to copy that data from your CPU into the GPU, where the vertex shader can read it."
        )}
      </p>

      <H2>{tx(t, "ch02_flowTitle", "The data flow")}</H2>
      <VBOFlowDiagram t={t} />
      <p>
        {tx(t, "ch02_flowAfter",
          "You define the data, create a buffer on the GPU, upload the data to it with glBufferData, then issue a draw call. The GPU does the rest."
        )}
      </p>

      <H2>{tx(t, "ch02_stepTitle", "Creating a VBO step by step")}</H2>

      <H3>{tx(t, "ch02_step1Title", "Step 1: Generate the buffer")}</H3>
      <p>
        {tx(t, "ch02_step1Body",
          "Everything in OpenGL is identified by an integer ID. You ask OpenGL to create a buffer object and it gives you back an ID you use for all future operations on that buffer."
        )}
      </p>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`unsigned int VBO;
glGenBuffers(1, &VBO);  // create 1 buffer, store its ID in VBO`}</CodeBlock>

      <H3>{tx(t, "ch02_step2Title", "Step 2: Bind the buffer")}</H3>
      <p>
        {tx(t, "ch02_step2Body",
          "OpenGL is a state machine. To operate on a buffer, you first bind it, which means make this the currently active buffer of this type. From this point on, any buffer operation will apply to the bound buffer."
        )}
      </p>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`glBindBuffer(GL_ARRAY_BUFFER, VBO);`}</CodeBlock>
      <Callout type="info" t={t}>
        {tx(t, "ch02_step2Callout",
          "OpenGL has multiple buffer targets. GL_ARRAY_BUFFER is for vertex data. You will also see GL_ELEMENT_ARRAY_BUFFER for index buffers when we cover indexed drawing later."
        )}
      </Callout>

      <H3>{tx(t, "ch02_step3Title", "Step 3: Upload the data")}</H3>
      <p>
        {tx(t, "ch02_step3Body",
          "Now you copy the vertex array from RAM to the GPU with glBufferData. The last argument is a hint to the driver about how often this data will change, which influences where the driver places the buffer in memory."
        )}
      </p>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`float vertices[] = {
    -0.5f, -0.5f, 0.0f,
     0.5f, -0.5f, 0.0f,
     0.0f,  0.5f, 0.0f
};

glBufferData(
    GL_ARRAY_BUFFER,
    sizeof(vertices),
    vertices,
    GL_STATIC_DRAW
);`}</CodeBlock>

      <p>{tx(t, "ch02_step3TableIntro", "The three usage hints you need to know:")}</p>
      <div className="rounded-xl border border-white/10 overflow-hidden my-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03]">
              <th className="text-left px-4 py-3 font-mono text-[11px] text-[var(--text-muted)] uppercase tracking-widest">
                {tx(t, "vboTableHeader0", "Hint")}
              </th>
              <th className="text-left px-4 py-3 font-mono text-[11px] text-[var(--text-muted)] uppercase tracking-widest">
                {tx(t, "vboTableHeader1", "When to use")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <tr>
              <td className="px-4 py-3 font-mono text-xs text-[var(--primary)]">GL_STATIC_DRAW</td>
              <td className="px-4 py-3 text-[var(--text-muted)] text-xs">
                {tx(t, "vboStaticDesc", "Data is set once, used many times. Good for static geometry like terrain or models.")}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-mono text-xs text-[var(--primary)]">GL_DYNAMIC_DRAW</td>
              <td className="px-4 py-3 text-[var(--text-muted)] text-xs">
                {tx(t, "vboDynamicDesc", "Data is modified and used many times. Good for animated or procedural geometry.")}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-mono text-xs text-[var(--primary)]">GL_STREAM_DRAW</td>
              <td className="px-4 py-3 text-[var(--text-muted)] text-xs">
                {tx(t, "vboStreamDesc", "Data is set once, used a few times. Good for per-frame particle systems.")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <Callout type="tip" t={t}>
        {tx(t, "ch02_usageHintTip",
          "These hints do not change the behavior of your program, they are just performance hints. The driver uses them to decide where in GPU memory to place the buffer. Getting them wrong will not break anything, but it may cause unnecessary memory transfers."
        )}
      </Callout>

      <H2>{tx(t, "ch02_interpretTitle", "Telling OpenGL how to interpret the data")}</H2>
      <p>
        {tx(t, "ch02_interpretBody",
          "The VBO is just a blob of bytes on the GPU. OpenGL does not know that your bytes represent three floats per vertex. You need to tell it using glVertexAttribPointer."
        )}
      </p>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`// index=0, 3 components, float, no normalize, stride=12 bytes, offset=0
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
glEnableVertexAttribArray(0);`}</CodeBlock>
      <Callout type="warn" t={t}>
        {tx(t, "ch02_interpretWarn",
          "The first argument (0) must match the layout (location = 0) declaration in your vertex shader. If they do not match, the shader reads garbage data or nothing at all."
        )}
      </Callout>

      <H2>{tx(t, "ch02_fullTitle", "The full VBO setup in one place")}</H2>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`unsigned int VBO;
glGenBuffers(1, &VBO);
glBindBuffer(GL_ARRAY_BUFFER, VBO);
glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
glEnableVertexAttribArray(0);

while (!glfwWindowShouldClose(window)) {
    glClear(GL_COLOR_BUFFER_BIT);
    glUseProgram(shaderProgram);
    glDrawArrays(GL_TRIANGLES, 0, 3);
    glfwSwapBuffers(window);
    glfwPollEvents();
}`}</CodeBlock>

      <H2>{tx(t, "ch02_nextTitle", "Why you should not stop here")}</H2>
      <p>
        {tx(t, "ch02_nextBody",
          "The code above works, but it has a problem: every frame you need to rebind the VBO and re-specify the vertex attribute layout. For a single triangle this is fine, but for a real scene with hundreds of meshes it becomes expensive and repetitive. The next chapter introduces Vertex Array Objects (VAOs), which let you record all the VBO bindings and attribute specifications once, then replay them with a single bind call."
        )}
      </p>

    </article>
  );
}

// ── Chapter 03: VAOs ──────────────────────────────────────────────────────────

function VAOContent({ t }: { t: any }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "ch03_intro",
          "Every time you draw a mesh, OpenGL needs to know which buffer the vertex data lives in, and how that buffer is laid out. Without a VAO you would need to re-specify all of this before every draw call. A Vertex Array Object (VAO) records all of that state once so you can replay it with a single bind."
        )}
      </p>

      <H2>{tx(t, "ch03_whatTitle", "What a VAO stores")}</H2>
      <VAODiagram t={t} />
      <p>
        {tx(t, "ch03_whatAfter",
          "When a VAO is bound, every call to glVertexAttribPointer and glEnableVertexAttribArray is recorded inside it. The bound GL_ELEMENT_ARRAY_BUFFER (index buffer) is also stored. The GL_ARRAY_BUFFER binding itself is not stored directly, but the association between each attribute and its source buffer is."
        )}
      </p>

      <H2>{tx(t, "ch03_createTitle", "Creating and using a VAO")}</H2>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`// 1. Create and bind the VAO FIRST — before touching any VBO
unsigned int VAO;
glGenVertexArrays(1, &VAO);
glBindVertexArray(VAO);  // start recording

// 2. Set up the VBO as normal — the VAO records all of this
unsigned int VBO;
glGenBuffers(1, &VBO);
glBindBuffer(GL_ARRAY_BUFFER, VBO);
glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
glEnableVertexAttribArray(0);

// 3. Unbind when setup is done
glBindVertexArray(0);`}</CodeBlock>

      <p>{tx(t, "ch03_renderLoop", "Now in the render loop, instead of re-specifying all of that, you just bind the VAO:")}</p>

      <CodeBlock lang="cpp" filename="render_loop.cpp" t={t}>{`while (!glfwWindowShouldClose(window)) {
    glClear(GL_COLOR_BUFFER_BIT);
    glUseProgram(shaderProgram);
    glBindVertexArray(VAO);          // replaces all the VBO setup
    glDrawArrays(GL_TRIANGLES, 0, 3);
    glfwSwapBuffers(window);
    glfwPollEvents();
}`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "ch03_goldenRule",
          "The golden rule: create your VAO before you set up your VBOs. If you bind the VBO first and the VAO after, the VAO will not have recorded the attribute pointers."
        )}
      </Callout>

      <H2>{tx(t, "ch03_interleavedTitle", "Interleaved vertex data")}</H2>
      <p>
        {tx(t, "ch03_interleavedBody",
          "Real vertices have more than just a position. A typical vertex has position, texture coordinates, and a normal vector, all packed together in a single buffer. The stride and offset arguments in glVertexAttribPointer handle this."
        )}
      </p>
      <CodeBlock lang="cpp" filename="interleaved.cpp" t={t}>{`// Layout: [X Y Z] [U V] [NX NY NZ] per vertex
int stride = 8 * sizeof(float);

// position: 3 floats at offset 0
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, stride, (void*)0);
glEnableVertexAttribArray(0);

// texcoord: 2 floats at offset 12
glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE, stride, (void*)(3 * sizeof(float)));
glEnableVertexAttribArray(1);

// normal: 3 floats at offset 20
glVertexAttribPointer(2, 3, GL_FLOAT, GL_FALSE, stride, (void*)(5 * sizeof(float)));
glEnableVertexAttribArray(2);`}</CodeBlock>

    </article>
  );
}

// ── Chapter 04: First Shaders ─────────────────────────────────────────────────

function ShadersContent({ t }: { t: any }) {
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

      <div className="rounded-xl border border-white/10 overflow-hidden my-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03]">
              <th className="text-left px-4 py-3 font-mono text-[11px] text-[var(--text-muted)] uppercase tracking-widest">
                {tx(t, "shaderTableHeader0", "Qualifier")}
              </th>
              <th className="text-left px-4 py-3 font-mono text-[11px] text-[var(--text-muted)] uppercase tracking-widest">
                {tx(t, "shaderTableHeader1", "Used in")}
              </th>
              <th className="text-left px-4 py-3 font-mono text-[11px] text-[var(--text-muted)] uppercase tracking-widest">
                {tx(t, "shaderTableHeader2", "Meaning")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs">
            <tr>
              <td className="px-4 py-3 font-mono text-[var(--primary)]">in</td>
              <td className="px-4 py-3 text-[var(--text-muted)]">{tx(t, "shaderQualInVertex", "vertex shader")}</td>
              <td className="px-4 py-3 text-[var(--text-muted)]">{tx(t, "shaderQualInMeaning", "Data coming from the VBO (one value per vertex)")}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-mono text-[var(--primary)]">out</td>
              <td className="px-4 py-3 text-[var(--text-muted)]">{tx(t, "shaderQualInVertex", "vertex shader")}</td>
              <td className="px-4 py-3 text-[var(--text-muted)]">{tx(t, "shaderQualOutMeaning", "Data passed to the next stage (interpolated)")}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-mono text-[var(--primary)]">in</td>
              <td className="px-4 py-3 text-[var(--text-muted)]">{tx(t, "shaderQualInFrag", "fragment shader")}</td>
              <td className="px-4 py-3 text-[var(--text-muted)]">{tx(t, "shaderQualInFragMeaning", "Receives the interpolated out from vertex shader")}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-mono text-[var(--primary)]">uniform</td>
              <td className="px-4 py-3 text-[var(--text-muted)]">{tx(t, "shaderQualBoth", "both")}</td>
              <td className="px-4 py-3 text-[var(--text-muted)]">{tx(t, "shaderQualUniformMeaning", "Value set from C++, same for all vertices and pixels")}</td>
            </tr>
          </tbody>
        </table>
      </div>

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
          "You must call glUseProgram before setting uniforms. Uniforms belong to the currently active program. Setting a uniform on the wrong program has no effect."
        )}
      </Callout>

    </article>
  );
}

// ── Chapter 05: Drawing the Triangle ─────────────────────────────────────────

function TriangleContent({ t }: { t: any }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "ch05_intro",
          "You now have all the pieces. This chapter puts them together to render a working triangle, the traditional Hello World of graphics programming."
        )}
      </p>

      <H2>{tx(t, "ch05_fullTitle", "The complete program")}</H2>

      <CodeBlock lang="cpp" filename="hello_triangle.cpp" t={t}>{`#include <glad/glad.h>
#include <GLFW/glfw3.h>
#include <iostream>

const char* vertSrc = R"(
    #version 460 core
    layout (location = 0) in vec3 aPos;
    void main() { gl_Position = vec4(aPos, 1.0); }
)";

const char* fragSrc = R"(
    #version 460 core
    out vec4 FragColor;
    void main() { FragColor = vec4(0.22f, 0.51f, 1.0f, 1.0f); }
)";

unsigned int CompileShader(unsigned int type, const char* src) {
    unsigned int shader = glCreateShader(type);
    glShaderSource(shader, 1, &src, nullptr);
    glCompileShader(shader);
    int ok; glGetShaderiv(shader, GL_COMPILE_STATUS, &ok);
    if (!ok) {
        char log[512];
        glGetShaderInfoLog(shader, 512, nullptr, log);
        std::cerr << log << std::endl;
    }
    return shader;
}

int main() {
    glfwInit();
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 4);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 6);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

    GLFWwindow* window = glfwCreateWindow(800, 600, "Hello Triangle", nullptr, nullptr);
    glfwMakeContextCurrent(window);
    gladLoadGLLoader((GLADloadproc)glfwGetProcAddress);
    glViewport(0, 0, 800, 600);

    unsigned int vs      = CompileShader(GL_VERTEX_SHADER,   vertSrc);
    unsigned int fs      = CompileShader(GL_FRAGMENT_SHADER, fragSrc);
    unsigned int program = glCreateProgram();
    glAttachShader(program, vs); glAttachShader(program, fs);
    glLinkProgram(program);
    glDeleteShader(vs); glDeleteShader(fs);

    float vertices[] = {
        -0.5f, -0.5f, 0.0f,
         0.5f, -0.5f, 0.0f,
         0.0f,  0.5f, 0.0f
    };

    unsigned int VAO, VBO;
    glGenVertexArrays(1, &VAO); glGenBuffers(1, &VBO);
    glBindVertexArray(VAO);
    glBindBuffer(GL_ARRAY_BUFFER, VBO);
    glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
    glEnableVertexAttribArray(0);
    glBindVertexArray(0);

    while (!glfwWindowShouldClose(window)) {
        glClearColor(0.06f, 0.07f, 0.1f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT);
        glUseProgram(program);
        glBindVertexArray(VAO);
        glDrawArrays(GL_TRIANGLES, 0, 3);
        glfwSwapBuffers(window);
        glfwPollEvents();
    }

    glDeleteVertexArrays(1, &VAO);
    glDeleteBuffers(1, &VBO);
    glDeleteProgram(program);
    glfwTerminate();
    return 0;
}`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "ch05_blackScreenTip",
          "If you see a black screen with no errors, the most common causes are: the VAO was bound after the VBO setup, the shader location does not match the attribute pointer index, or the viewport was not set with glViewport."
        )}
      </Callout>

      <H2>{tx(t, "ch05_nextTitle", "What to try next")}</H2>
      <p>
        {tx(t, "ch05_nextBody",
          "Now that the triangle works, try these exercises before moving on: change the triangle color by modifying the fragment shader, add a second triangle by expanding the vertex array, and try passing a color per vertex as shown in the Shaders chapter."
        )}
      </p>

    </article>
  );
}

// ── Exported track ────────────────────────────────────────────────────────────

export const openGLTrack: Track = {
  id: "opengl",
  title: "OpenGL 4.6",
  chapters: [
    { id: "pipeline", title: "The Graphics Pipeline", minRead: 8,  content: (t) => <PipelineContent t={t} /> },
    { id: "vbo",      title: "Vertex Buffer Objects", minRead: 10, content: (t) => <VBOContent t={t} />      },
    { id: "vao",      title: "Vertex Array Objects",  minRead: 7,  content: (t) => <VAOContent t={t} />      },
    { id: "shaders",  title: "First Shaders",         minRead: 9,  content: (t) => <ShadersContent t={t} />  },
    { id: "triangle", title: "Drawing the Triangle",  minRead: 5,  content: (t) => <TriangleContent t={t} /> },
  ],
};