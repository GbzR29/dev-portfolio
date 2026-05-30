// src/lib/tracks/opengl/index.tsx
"use client";

import { Track } from "@/lib/tracks/types";
import {
  CodeBlock, Callout, IC, H2, H3,
  PipelineDiagram, NDCDiagram,
  VBOFlowDiagram, VAODiagram, LessonTable,
  MathBlock, Matrix4x4,
} from "@/components/lesson/LessonComponents";
import { InteractiveNDC2D } from "@/components/lesson/InteractiveNDC2D";
import { InteractiveNDC3D } from "@/components/lesson/InteractiveNDC3D";

// tx: returns translated string or English fallback. Never shows a key name.
function tx(t: any, key: string, fallback: string): string {
  const val = t?.[key];
  return val && val.length > 0 ? val : fallback;
}

// ── Chapter 00: Legacy & Modern OpenGL ───────────────────────────────────────

function LegacyContent({ t }: { t: any }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "ch00_intro",
          "OpenGL was created in 1992. Over 30 years, it went through three distinct eras: Immediate Mode (the original, now obsolete API), the Retained Mode transition, and Modern Core Profile OpenGL — which is what this entire track teaches. Understanding why the old way was abandoned explains every design decision in the modern API."
        )}
      </p>

      <H2>{tx(t, "ch00_historyTitle", "A brief history of OpenGL versions")}</H2>
      <LessonTable
        headers={["Version", "Year", "Key addition"]}
        rows={[
          ["1.0",  "1992", tx(t, "ch00_v10",  "Immediate Mode — glBegin/glEnd, fixed-function pipeline")],
          ["2.0",  "2004", tx(t, "ch00_v20",  "GLSL shaders introduced — but still optional, legacy intact")],
          ["3.0",  "2008", tx(t, "ch00_v30",  "Immediate Mode marked deprecated")],
          ["3.2",  "2009", tx(t, "ch00_v32",  "Core Profile introduced — a clean break from legacy")],
          ["4.5",  "2014", tx(t, "ch00_v45",  "Direct State Access (DSA) — no more blind binding")],
          ["4.6",  "2017", tx(t, "ch00_v46",  "Current version — SPIR-V shaders, last major release")],
        ]}
      />

      <Callout type="info" t={t}>
        {tx(t, "ch00_vulkanNote",
          "Vulkan (2016) and Metal (2014) are the successors for when you need maximum GPU control. Modern OpenGL 4.6 is still the right choice for learning graphics programming — it exposes the core concepts without Vulkan's 800-line boilerplate."
        )}
      </Callout>

      <H2>{tx(t, "ch00_immediateTitle", "Immediate Mode — how it worked")}</H2>
      <p>
        {tx(t, "ch00_immediateBody",
          "In OpenGL 1.x you submitted vertex data one call at a time, directly between glBegin and glEnd. Every vertex was its own function call, crossing the CPU-GPU boundary individually."
        )}
      </p>
      <CodeBlock lang="cpp" filename="legacy_immediate.cpp" t={t}>{`// OpenGL 1.x — Immediate Mode (DO NOT USE)
// This was removed in Core Profile 3.2

glBegin(GL_TRIANGLES);
  glColor3f(1.0f, 0.0f, 0.0f);        // set color for next vertex
  glVertex3f(-0.5f, -0.5f, 0.0f);     // v0

  glColor3f(0.0f, 1.0f, 0.0f);
  glVertex3f( 0.5f, -0.5f, 0.0f);     // v1

  glColor3f(0.0f, 0.0f, 1.0f);
  glVertex3f( 0.0f,  0.5f, 0.0f);     // v2
glEnd();`}</CodeBlock>

      <H2>{tx(t, "ch00_whyBadTitle", "Why Immediate Mode was abandoned")}</H2>
      <p>{tx(t, "ch00_whyBadBody", "The problems were architectural, not superficial:")}</p>
      <ul className="space-y-3 ml-1">
        {[
          [tx(t, "ch00_bad1title", "CPU-GPU bottleneck"), tx(t, "ch00_bad1body", "Every glVertex3f call crosses the CPU-GPU boundary. 1 million vertices = 1 million function calls. The bus was the bottleneck, not the GPU.")],
          [tx(t, "ch00_bad2title", "Zero parallelism"), tx(t, "ch00_bad2body", "The GPU can process thousands of vertices in parallel, but immediate mode fed them one at a time. 99% of GPU potential was wasted.")],
          [tx(t, "ch00_bad3title", "Fixed-function pipeline"), tx(t, "ch00_bad3body", "Lighting, fogging, and blending were hardcoded into the driver. You could configure them but not reprogram them. No custom math, no custom effects.")],
          [tx(t, "ch00_bad4title", "Stateful color model"), tx(t, "ch00_bad4body", "glColor3f set a 'current color' global state. Forgetting to set it before a vertex silently used the last color. These bugs were notoriously hard to find.")],
        ].map(([title, body], i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-md bg-red-500/10 border border-red-500/25 flex items-center justify-center font-mono text-[9px] font-bold text-red-400 mt-0.5">
              {i+1}
            </span>
            <span>
              <strong className="text-[var(--text-main)] text-sm">{title}. </strong>
              {body}
            </span>
          </li>
        ))}
      </ul>

      <H2>{tx(t, "ch00_coreTitle", "Core Profile vs Compatibility Profile")}</H2>
      <p>
        {tx(t, "ch00_coreBody",
          "When OpenGL 3.2 introduced the Core Profile in 2009, it split into two modes. You choose which one at context creation time (through GLFW window hints or equivalent)."
        )}
      </p>
      <LessonTable
        headers={[tx(t, "ch00_profileHeader0", "Profile"), tx(t, "ch00_profileHeader1", "Legacy API"), tx(t, "ch00_profileHeader2", "Use case")]}
        rows={[
          [tx(t, "ch00_coreLabel",   "Core"),          tx(t, "ch00_coreHasLegacy",   "Removed"),   tx(t, "ch00_coreUse",   "New projects — everything in this track")],
          [tx(t, "ch00_compatLabel", "Compatibility"), tx(t, "ch00_compatHasLegacy", "Available"), tx(t, "ch00_compatUse", "Maintaining old codebases only")],
        ]}
      />
      <CodeBlock lang="cpp" filename="core_profile.cpp" t={t}>{`// GLFW: request a Core Profile context (required for modern OpenGL)
glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 4);
glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 6);
glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);  // ← this is the key line
// GLFW_OPENGL_COMPAT_PROFILE would enable legacy code — avoid it`}</CodeBlock>

      <H2>{tx(t, "ch00_modernTitle", "Modern OpenGL: the core ideas")}</H2>
      <p>
        {tx(t, "ch00_modernBody",
          "Everything in this track follows three principles that replace Immediate Mode:"
        )}
      </p>
      <LessonTable
        headers={[tx(t, "ch00_modernHeader0", "Old way"), tx(t, "ch00_modernHeader1", "Modern way"), tx(t, "ch00_modernHeader2", "Why")]}
        rows={[
          [tx(t, "ch00_old1", "glVertex per vertex"), tx(t, "ch00_new1", "VBO — upload all at once"), tx(t, "ch00_why1", "One bus transfer instead of N")],
          [tx(t, "ch00_old2", "Fixed lighting model"), tx(t, "ch00_new2", "GLSL fragment shader"), tx(t, "ch00_why2", "Programmable — any math you want")],
          [tx(t, "ch00_old3", "glColor / global state"), tx(t, "ch00_new3", "Vertex attributes + uniforms"), tx(t, "ch00_why3", "Explicit, per-draw, no hidden state")],
        ]}
      />

      <Callout type="tip" t={t}>
        {tx(t, "ch00_gluNote",
          "You may also encounter GLU (GL Utilities) functions like gluPerspective and gluLookAt. GLU was a companion library to Immediate Mode that pre-computed common matrices. In modern OpenGL these are replaced by GLM — a C++ math library with the same functions but as proper mat4 objects you can pass as uniforms."
        )}
      </Callout>

    </article>
  );
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

      <InteractiveNDC2D />

      <Callout type="tip" t={t}>
        {tx(t, "ch01_ndcInteractiveTip",
          "Drag any vertex on the canvas above. Notice how moving a point outside the [-1, 1] boundary clips it — the triangle edge disappears at the border. The CCW/CW indicator shows the winding order (covered in chapter 10)."
        )}
      </Callout>

      <H2>{tx(t, "ch01_ndc3dTitle", "NDC in 3D")}</H2>
      <p>
        {tx(t, "ch01_ndc3dBody",
          "In 3D, NDC is a cube: every axis from -1.0 to +1.0. Any vertex outside this cube on any axis is clipped and not drawn. The Z axis controls depth — Z = -1.0 is the near clip plane, Z = +1.0 is the far clip plane. Rotate the visualizer below to see how different shapes sit inside the NDC cube."
        )}
      </p>

      <InteractiveNDC3D />

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
      <LessonTable
        headers={[tx(t, "vboTableHeader0", "Hint"), tx(t, "vboTableHeader1", "When to use")]}
        rows={[
          ["GL_STATIC_DRAW",  tx(t, "vboStaticDesc",  "Data is set once, used many times. Good for static geometry like terrain or models.")],
          ["GL_DYNAMIC_DRAW", tx(t, "vboDynamicDesc", "Data is modified and used many times. Good for animated or procedural geometry.")],
          ["GL_STREAM_DRAW",  tx(t, "vboStreamDesc",  "Data is set once, used a few times. Good for per-frame particle systems.")],
        ]}
      />
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

      <Callout type="warn" t={t}>
        {tx(t, "ch05_windingWarn",
          "The vertex order in your array is not arbitrary — it defines the winding order of the face. OpenGL expects counter-clockwise (CCW) winding for front-facing triangles by default. In the hello triangle above, the three vertices go bottom-left → bottom-right → top-center, which is CCW. Chapter 10 explains why this matters for face culling."
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

// ── Chapter 06: EBO / Indexed Drawing ────────────────────────────────────────

function EBOContent({ t }: { t: any }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "ch06_intro",
          "Every quad is two triangles that share two vertices. Without indices, you store those vertices twice — wasting VRAM and making mesh changes error-prone. An Element Buffer Object (EBO) stores a list of indices so each unique vertex lives exactly once."
        )}
      </p>

      <H2>{tx(t, "ch06_whyTitle", "The duplication problem")}</H2>
      <p>
        {tx(t, "ch06_whyBody",
          "A quad has four corners. GL_TRIANGLES expects three vertices per triangle, so without indices you pass six vertices total — two of which are duplicated."
        )}
      </p>
      <CodeBlock lang="cpp" filename="no_ebo.cpp" t={t}>{`// Without EBO — 6 vertices, only 4 are unique
float vertices[] = {
    // triangle 1
    -0.5f,  0.5f, 0.0f,  // 0 top-left
    -0.5f, -0.5f, 0.0f,  // 1 bottom-left
     0.5f, -0.5f, 0.0f,  // 2 bottom-right
    // triangle 2
    -0.5f,  0.5f, 0.0f,  // DUPLICATE of 0
     0.5f, -0.5f, 0.0f,  // DUPLICATE of 2
     0.5f,  0.5f, 0.0f,  // 3 top-right
};`}</CodeBlock>

      <H2>{tx(t, "ch06_solutionTitle", "The EBO solution")}</H2>
      <p>
        {tx(t, "ch06_solutionBody",
          "Store four unique vertices and a separate index list. The GPU reads each index, looks up the corresponding vertex, and assembles triangles without any data duplication."
        )}
      </p>
      <CodeBlock lang="cpp" filename="with_ebo.cpp" t={t}>{`float vertices[] = {
    -0.5f,  0.5f, 0.0f,   // 0 — top-left
    -0.5f, -0.5f, 0.0f,   // 1 — bottom-left
     0.5f, -0.5f, 0.0f,   // 2 — bottom-right
     0.5f,  0.5f, 0.0f,   // 3 — top-right
};

unsigned int indices[] = {
    0, 1, 2,   // bottom-left triangle
    0, 2, 3    // top-right triangle
};`}</CodeBlock>

      <H2>{tx(t, "ch06_createTitle", "Creating the EBO")}</H2>
      <p>
        {tx(t, "ch06_createBody",
          "An EBO is created exactly like a VBO. The only differences are the buffer target (GL_ELEMENT_ARRAY_BUFFER) and that the EBO must be bound while the VAO is active so the VAO records it."
        )}
      </p>
      <CodeBlock lang="cpp" filename="ebo_setup.cpp" t={t}>{`unsigned int VAO, VBO, EBO;
glGenVertexArrays(1, &VAO);
glGenBuffers(1, &VBO);
glGenBuffers(1, &EBO);

glBindVertexArray(VAO);  // start recording

glBindBuffer(GL_ARRAY_BUFFER, VBO);
glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
glEnableVertexAttribArray(0);

// EBO — bind after VAO so it is recorded inside it
glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, EBO);
glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);

glBindVertexArray(0);`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "ch06_eboWarn",
          "Do not unbind the EBO before unbinding the VAO. The VAO stores the GL_ELEMENT_ARRAY_BUFFER binding — unbinding the EBO first removes that association and the VAO will draw nothing."
        )}
      </Callout>

      <H2>{tx(t, "ch06_drawTitle", "Drawing with glDrawElements")}</H2>
      <p>
        {tx(t, "ch06_drawBody",
          "Replace glDrawArrays with glDrawElements. The second argument is the number of indices (not vertices). The last argument is the byte offset into the EBO — 0 to start from the beginning."
        )}
      </p>
      <CodeBlock lang="cpp" filename="render.cpp" t={t}>{`while (!glfwWindowShouldClose(window)) {
    glClear(GL_COLOR_BUFFER_BIT);
    glUseProgram(shaderProgram);
    glBindVertexArray(VAO);
    glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);
    // 6 indices total, type must match the index array type
    glfwSwapBuffers(window);
    glfwPollEvents();
}`}</CodeBlock>

      <H2>{tx(t, "ch06_wireframeTitle", "Debug tip: wireframe mode")}</H2>
      <p>
        {tx(t, "ch06_wireframeBody",
          "During development you can switch to wireframe to verify your indices are correct and both triangles share the right vertices."
        )}
      </p>
      <CodeBlock lang="cpp" filename="wireframe.cpp" t={t}>{`glPolygonMode(GL_FRONT_AND_BACK, GL_LINE);   // wireframe
// glPolygonMode(GL_FRONT_AND_BACK, GL_FILL); // restore filled (default)`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "ch06_nextTip",
          "EBOs become even more valuable with complex 3D meshes where sharing vertices saves thousands of bytes per mesh. Most mesh loading libraries (Assimp, tinyobjloader) output indexed geometry by default."
        )}
      </Callout>

    </article>
  );
}

// ── Chapter 07: Textures ──────────────────────────────────────────────────────

function TexturesContent({ t }: { t: any }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "ch07_intro",
          "A texture is a 2D image stored in GPU VRAM that your fragment shader can sample per pixel. Vertex data alone gives you solid colors — textures give you detail, surface variety, and photorealism without adding geometry."
        )}
      </p>

      <H2>{tx(t, "ch07_uvTitle", "UV / texture coordinates")}</H2>
      <p>
        {tx(t, "ch07_uvBody",
          "Each vertex carries a pair of floats (U, V) that tell the GPU which part of the texture maps to that vertex point. In OpenGL, (0,0) is the bottom-left corner and (1,1) is the top-right. Values outside [0,1] are handled by the wrap mode you configure."
        )}
      </p>
      <CodeBlock lang="cpp" filename="quad_with_uv.cpp" t={t}>{`// position (x,y,z)   +   texcoord (u,v)
float vertices[] = {
    // pos                  UV
    -0.5f,  0.5f, 0.0f,   0.0f, 1.0f,  // top-left
    -0.5f, -0.5f, 0.0f,   0.0f, 0.0f,  // bottom-left
     0.5f, -0.5f, 0.0f,   1.0f, 0.0f,  // bottom-right
     0.5f,  0.5f, 0.0f,   1.0f, 1.0f,  // top-right
};

// stride = 5 floats now (xyz + uv)
int stride = 5 * sizeof(float);

glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, stride, (void*)0);               // position
glEnableVertexAttribArray(0);
glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE, stride, (void*)(3*sizeof(float))); // texcoord
glEnableVertexAttribArray(1);`}</CodeBlock>

      <H2>{tx(t, "ch07_loadTitle", "Loading an image with stb_image")}</H2>
      <p>
        {tx(t, "ch07_loadBody",
          "stb_image.h is the standard single-header image loader for OpenGL projects. You include the implementation exactly once in one .cpp file, then call stbi_load to get a pointer to raw pixel data."
        )}
      </p>
      <CodeBlock lang="cpp" filename="load_texture.cpp" t={t}>{`#define STB_IMAGE_IMPLEMENTATION
#include "stb_image.h"

// OpenGL's origin is bottom-left; images are stored top-left — flip them
stbi_set_flip_vertically_on_load(true);

int width, height, channels;
unsigned char* data = stbi_load("assets/wall.jpg", &width, &height, &channels, 0);

if (!data) {
    std::cerr << "Failed to load texture: " << stbi_failure_reason() << std::endl;
}`}</CodeBlock>

      <H2>{tx(t, "ch07_createTitle", "Creating the texture object")}</H2>
      <CodeBlock lang="cpp" filename="create_texture.cpp" t={t}>{`unsigned int texture;
glGenTextures(1, &texture);
glBindTexture(GL_TEXTURE_2D, texture);

// Wrapping — what happens when UV goes outside [0, 1]
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);

// Filtering — how to sample between texels
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);

// Upload pixel data to GPU
GLenum format = (channels == 4) ? GL_RGBA : GL_RGB;
glTexImage2D(GL_TEXTURE_2D, 0, format, width, height, 0, format, GL_UNSIGNED_BYTE, data);
glGenerateMipmap(GL_TEXTURE_2D);

stbi_image_free(data);  // CPU copy no longer needed`}</CodeBlock>

      <LessonTable
        headers={[
          tx(t, "texWrapHeader0", "Wrap mode"),
          tx(t, "texWrapHeader1", "Behavior"),
        ]}
        rows={[
          ["GL_REPEAT",          tx(t, "texRepeat",  "Tiles the texture. Default and most common.")],
          ["GL_CLAMP_TO_EDGE",   tx(t, "texClamp",   "Stretches the edge pixel. Good for UI sprites.")],
          ["GL_MIRRORED_REPEAT", tx(t, "texMirror",  "Tiles but mirrors every other tile.")],
        ]}
      />

      <H2>{tx(t, "ch07_shaderTitle", "Sampling in the fragment shader")}</H2>
      <CodeBlock lang="glsl" filename="textured.vert" t={t}>{`#version 460 core

layout (location = 0) in vec3 aPos;
layout (location = 1) in vec2 aTexCoord;

out vec2 TexCoord;

void main() {
    gl_Position = vec4(aPos, 1.0);
    TexCoord = aTexCoord;
}`}</CodeBlock>
      <CodeBlock lang="glsl" filename="textured.frag" t={t}>{`#version 460 core

in  vec2 TexCoord;
out vec4 FragColor;

uniform sampler2D uTexture;

void main() {
    FragColor = texture(uTexture, TexCoord);
}`}</CodeBlock>

      <H2>{tx(t, "ch07_bindTitle", "Binding the texture before drawing")}</H2>
      <CodeBlock lang="cpp" filename="render.cpp" t={t}>{`// Bind to texture unit 0 and tell the shader which unit to use
glActiveTexture(GL_TEXTURE0);
glBindTexture(GL_TEXTURE_2D, texture);

glUseProgram(shaderProgram);
glUniform1i(glGetUniformLocation(shaderProgram, "uTexture"), 0); // unit 0

glBindVertexArray(VAO);
glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "ch07_unitsNote",
          "OpenGL supports at least 16 simultaneous texture units (GL_TEXTURE0 through GL_TEXTURE15). You activate a unit, bind a texture to it, then tell the uniform sampler which unit number to read from. This is how you use multiple textures in one draw call."
        )}
      </Callout>

    </article>
  );
}

// ── Chapter 08: Linear Algebra for 3D ────────────────────────────────────────

function LinearAlgebraContent({ t }: { t: any }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "ch08la_intro",
          "3D graphics code is just linear algebra on a GPU. Every transformation — moving an object, rotating a camera, projecting to a 2D screen — is a matrix multiplication. This chapter bridges the gap between the math you see on paper and the C++/GLSL code you write."
        )}
      </p>

      {/* ── VECTORS ─────────────────────────────────────────────────────── */}
      <H2>{tx(t, "ch08la_vectorsTitle", "Vectors")}</H2>
      <p>
        {tx(t, "ch08la_vectorsBody",
          "A vector is a quantity with direction and magnitude. In 3D graphics, vec3 can represent a position in world space, a direction (like a surface normal), a color (RGB), or UV coordinates — context determines meaning."
        )}
      </p>

      <MathBlock label={tx(t, "ch08la_addLabel", "Addition")} glsl="vec3 r = a + b;" glm="glm::vec3 r = a + b;">
        <span className="text-[var(--primary)]">a</span>
        {" + "}
        <span className="text-[var(--primary)]">b</span>
        {" = (a"}
        <sub>x</sub>{" + b"}<sub>x</sub>
        {",  a"}<sub>y</sub>{" + b"}<sub>y</sub>
        {",  a"}<sub>z</sub>{" + b"}<sub>z</sub>
        {")"}
        <div className="text-[var(--text-muted)] text-[11px] mt-1.5">
          {tx(t, "ch08la_addNote", "Use: displacement, moving a point by an offset, combining forces")}
        </div>
      </MathBlock>

      <MathBlock label={tx(t, "ch08la_dotLabel", "Dot product")} glsl="float d = dot(a, b);" glm="float d = glm::dot(a, b);">
        <span className="text-[var(--primary)]">a</span>
        {" · "}
        <span className="text-[var(--primary)]">b</span>
        {" = a"}<sub>x</sub>{"b"}<sub>x</sub>
        {" + a"}<sub>y</sub>{"b"}<sub>y</sub>
        {" + a"}<sub>z</sub>{"b"}<sub>z</sub>
        {"  =  |a| |b| cos(θ)"}
        <div className="text-[var(--text-muted)] text-[11px] mt-1.5 space-y-0.5">
          <div>{tx(t, "ch08la_dotNote1", "→ result = 1: vectors parallel (same direction)")}</div>
          <div>{tx(t, "ch08la_dotNote2", "→ result = 0: vectors perpendicular (90°)")}</div>
          <div>{tx(t, "ch08la_dotNote3", "→ result < 0: vectors opposing (> 90°)")}</div>
          <div className="text-[var(--primary)]/70">{tx(t, "ch08la_dotUse", "Use: Phong diffuse lighting — dot(normal, lightDir) gives brightness")}</div>
        </div>
      </MathBlock>

      <MathBlock label={tx(t, "ch08la_lenLabel", "Length / normalize")} glsl="float l = length(a);  vec3 u = normalize(a);" glm="float l = glm::length(a);  glm::vec3 u = glm::normalize(a);">
        {"|a|  =  √(a"}<sub>x</sub>{"² + a"}<sub>y</sub>{"² + a"}<sub>z</sub>{"²)"}
        <br />
        {"â  =  a / |a|  →  |â| = 1"}
        <div className="text-[var(--text-muted)] text-[11px] mt-1.5">
          {tx(t, "ch08la_lenNote", "Unit vectors are essential for lighting — dot(normalize(normal), normalize(lightDir))")}
        </div>
      </MathBlock>

      <MathBlock label={tx(t, "ch08la_crossLabel", "Cross product")} glsl="vec3 n = cross(a, b);" glm="glm::vec3 n = glm::cross(a, b);">
        <span className="text-[var(--primary)]">a</span>
        {" × "}
        <span className="text-[var(--primary)]">b</span>
        {" = (a"}<sub>y</sub>{"b"}<sub>z</sub>{" − a"}<sub>z</sub>{"b"}<sub>y</sub>
        {",  a"}<sub>z</sub>{"b"}<sub>x</sub>{" − a"}<sub>x</sub>{"b"}<sub>z</sub>
        {",  a"}<sub>x</sub>{"b"}<sub>y</sub>{" − a"}<sub>y</sub>{"b"}<sub>x</sub>
        {")"}
        <div className="text-[var(--text-muted)] text-[11px] mt-1.5">
          {tx(t, "ch08la_crossNote", "Result is perpendicular to both a and b (right-hand rule). Use: computing surface normals from two edge vectors")}
        </div>
      </MathBlock>

      <CodeBlock lang="cpp" filename="normal_from_edges.cpp" t={t}>{`// Compute face normal from two edges — cross product in practice
glm::vec3 edge1 = B - A;           // vector along one edge
glm::vec3 edge2 = C - A;           // vector along adjacent edge
glm::vec3 normal = glm::normalize(glm::cross(edge1, edge2));
// normal is now perpendicular to the triangle face`}</CodeBlock>

      {/* ── MATRICES ────────────────────────────────────────────────────── */}
      <H2>{tx(t, "ch08la_matricesTitle", "4×4 Matrices")}</H2>
      <p>
        {tx(t, "ch08la_matricesBody",
          "A matrix transforms a vector: multiply M × v and you get a new vector. The 4×4 size (instead of 3×3) is deliberate — the extra row and column make translation possible in matrix form (the w component trick)."
        )}
      </p>

      <div className="my-6 flex flex-wrap gap-8 items-start justify-start">
        <Matrix4x4 label={tx(t, "ch08la_identityLabel", "Identity")} data={[
          [1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]
        ]} />
        <Matrix4x4 label={tx(t, "ch08la_translateLabel", "Translate (tx, ty, tz)")} data={[
          [1,0,0,"tx"],[0,1,0,"ty"],[0,0,1,"tz"],[0,0,0,1]
        ]} />
        <Matrix4x4 label={tx(t, "ch08la_scaleLabel", "Scale (sx, sy, sz)")} data={[
          ["sx",0,0,0],[0,"sy",0,0],[0,0,"sz",0],[0,0,0,1]
        ]} />
      </div>

      <div className="my-6">
        <Matrix4x4 label={tx(t, "ch08la_rotYLabel", "Rotation around Y axis (θ)")} data={[
          ["cos θ",0,"sin θ",0],
          [0,      1, 0,     0],
          ["-sin θ",0,"cos θ",0],
          [0,      0, 0,     1],
        ]} />
      </div>

      <p className="text-sm">
        {tx(t, "ch08la_matrixNote",
          "These matrices are column-major in OpenGL/GLM. GLM constructs them for you — glm::translate, glm::rotate, glm::scale all return a mat4 you can multiply directly."
        )}
      </p>

      <CodeBlock lang="cpp" filename="matrix_ops.cpp" t={t}>{`// GLM generates these matrices for you — no manual construction needed
glm::mat4 T = glm::translate(glm::mat4(1.0f), glm::vec3(2.0f, 0.0f, 0.0f));
glm::mat4 S = glm::scale(glm::mat4(1.0f),     glm::vec3(0.5f));
glm::mat4 R = glm::rotate(glm::mat4(1.0f),    glm::radians(45.0f), glm::vec3(0,1,0));

// glm::mat4(1.0f) is the identity — the starting point for all transforms
// glm::radians converts degrees to radians (all trig in OpenGL uses radians)`}</CodeBlock>

      {/* ── HOMOGENEOUS ─────────────────────────────────────────────────── */}
      <H2>{tx(t, "ch08la_homogTitle", "Homogeneous Coordinates — why vec4?")}</H2>
      <p>
        {tx(t, "ch08la_homogBody",
          "You cannot represent translation with a 3×3 matrix. The trick: add a 4th component w. A 4×4 matrix multiplied by a vec4(position, 1.0) correctly applies translation. A vec4(direction, 0.0) is immune to translation — directions should not move when the world does."
        )}
      </p>

      <MathBlock label={tx(t, "ch08la_wLabel", "The w trick")}>
        <div className="space-y-1">
          <div>
            {"vec4(px, py, pz,  "}
            <span className="text-[var(--primary)]">1.0</span>
            {")  →  "}
            {tx(t, "ch08la_wPos", "position — translation applies")}
          </div>
          <div>
            {"vec4(dx, dy, dz,  "}
            <span className="text-red-400">0.0</span>
            {")  →  "}
            {tx(t, "ch08la_wDir", "direction / normal — translation does NOT apply")}
          </div>
        </div>
      </MathBlock>

      <CodeBlock lang="glsl" filename="homogeneous.glsl" t={t}>{`// In the vertex shader — all positions are vec4
layout (location = 0) in vec3 aPos;  // 3-component input
// ...
gl_Position = uMVP * vec4(aPos, 1.0);  // ← w=1 makes translation work
//                   ^^^^^^^^^^^^^^^^^
//                   vec3 → vec4 expansion, w=1.0

// For normals (directions):
vec3 transformedNormal = mat3(uModel) * aNormal;
// mat3() strips the 4th row/column — applies rotation/scale but NOT translation`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "ch08la_wNote",
          "After the vertex shader, the GPU automatically divides x, y, z by w (perspective divide). For regular geometry w=1 so nothing changes. For perspective projection, the projection matrix sets w to the original z value — the divide then makes far objects appear smaller. This is how perspective works mathematically."
        )}
      </Callout>

      {/* ── MVP ─────────────────────────────────────────────────────────── */}
      <H2>{tx(t, "ch08la_mvpTitle", "From local space to the screen — MVP step by step")}</H2>
      <p>
        {tx(t, "ch08la_mvpBody",
          "Every vertex in your model starts in local (object) space. To get it to the screen it passes through three matrix multiplications. Here is exactly what each step does, with the numbers:"
        )}
      </p>

      <div className="my-6 space-y-4">
        {[
          {
            step: "1", label: tx(t, "ch08la_step1Title", "Model matrix (M)"),
            from: tx(t, "ch08la_step1From", "Local space"), to: tx(t, "ch08la_step1To", "World space"),
            desc: tx(t, "ch08la_step1Desc", "Places the object in the world. Applies your translate/rotate/scale transforms."),
            code: "glm::mat4 M = glm::translate(I, pos) * glm::rotate(I, angle, axis) * glm::scale(I, size);",
            color: "blue",
          },
          {
            step: "2", label: tx(t, "ch08la_step2Title", "View matrix (V)"),
            from: tx(t, "ch08la_step2From", "World space"), to: tx(t, "ch08la_step2To", "Camera space"),
            desc: tx(t, "ch08la_step2Desc", "Simulates a camera. Moves and rotates the entire world so the camera is at the origin looking down -Z."),
            code: "glm::mat4 V = glm::lookAt(cameraPos, cameraTarget, upVector);",
            color: "emerald",
          },
          {
            step: "3", label: tx(t, "ch08la_step3Title", "Projection matrix (P)"),
            from: tx(t, "ch08la_step3From", "Camera space"), to: tx(t, "ch08la_step3To", "Clip space → NDC"),
            desc: tx(t, "ch08la_step3Desc", "Creates perspective (or orthographic). Sets w = original z so the GPU divide makes far objects smaller."),
            code: "glm::mat4 P = glm::perspective(glm::radians(45.0f), aspect, 0.1f, 100.0f);",
            color: "purple",
          },
        ].map(({ step, label, from, to, desc, code, color }) => (
          <div key={step} className={`p-4 rounded-xl border ${
            color === "blue"   ? "border-blue-500/20 bg-blue-500/5"   :
            color === "emerald"? "border-emerald-500/20 bg-emerald-500/5" :
                                 "border-purple-500/20 bg-purple-500/5"
          }`}>
            <div className="flex items-start gap-3 mb-3">
              <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-mono text-[11px] font-bold ${
                color === "blue"   ? "bg-blue-500/20 text-blue-400"   :
                color === "emerald"? "bg-emerald-500/20 text-emerald-400" :
                                     "bg-purple-500/20 text-purple-400"
              }`}>{step}</span>
              <div>
                <div className="font-semibold text-[var(--text-main)] text-sm">{label}</div>
                <div className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">
                  {from} <span className="text-[var(--text-muted)]">→</span> {to}
                </div>
              </div>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-2 ml-9">{desc}</p>
            <div className="ml-9 font-mono text-[10px] bg-[var(--code-bg)] rounded-lg px-3 py-2 text-[#e6edf3] overflow-x-auto">
              {code}
            </div>
          </div>
        ))}
      </div>

      <MathBlock label={tx(t, "ch08la_fullMVP", "Complete MVP formula")}>
        {"v"}<sub>{"clip"}</sub>{" = "}
        <span className="text-purple-400">P</span>
        {" × "}
        <span className="text-emerald-400">V</span>
        {" × "}
        <span className="text-blue-400">M</span>
        {" × v"}<sub>{"local"}</sub>
        <br />
        {"v"}<sub>{"ndc"}</sub>{"  = v"}<sub>{"clip"}</sub>{".xyz / v"}<sub>{"clip"}</sub>{".w  "}
        <span className="text-[var(--text-muted)] text-[11px]">{"← done automatically by GPU"}</span>
      </MathBlock>

      <CodeBlock lang="glsl" filename="mvp_vertex.glsl" t={t}>{`#version 460 core

layout (location = 0) in vec3 aPos;

uniform mat4 uModel;       // M: local → world
uniform mat4 uView;        // V: world → camera
uniform mat4 uProjection;  // P: camera → clip

void main() {
    // Right-to-left: apply M first, then V, then P
    gl_Position = uProjection * uView * uModel * vec4(aPos, 1.0);
    //            ─────────── order matters! ───────────
    //            Matrix multiplication is NOT commutative: A×B ≠ B×A
}`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "ch08la_orderWarn",
          "Matrix multiplication order is RIGHT-TO-LEFT in both GLSL and GLM. P × V × M × v means: apply M first (local→world), then V (world→camera), then P (camera→clip). Writing them left-to-right would produce wrong results with no error or warning."
        )}
      </Callout>

    </article>
  );
}

// ── Chapter 08: Transformations + GLM ────────────────────────────────────────

function TransformationsContent({ t }: { t: any }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "ch08_intro",
          "Everything you have drawn so far lives at fixed coordinates in NDC space. To move, rotate, and scale objects — and to place a camera anywhere in the scene — you need matrix math. GLM is the header-only C++ library that mirrors GLSL math types and is the standard choice for OpenGL projects."
        )}
      </p>

      <H2>{tx(t, "ch08_glmTitle", "Adding GLM to your project")}</H2>
      <CodeBlock lang="cpp" filename="includes.cpp" t={t}>{`#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <glm/gtc/type_ptr.hpp>  // for glm::value_ptr

// GLM mirrors GLSL types directly:
glm::vec3 position(0.0f, 0.0f, 0.0f);
glm::mat4 identity(1.0f);  // identity matrix`}</CodeBlock>

      <H2>{tx(t, "ch08_mvpTitle", "The MVP matrices")}</H2>
      <p>
        {tx(t, "ch08_mvpBody",
          "Every vertex goes through three transformations before reaching the screen. Each transformation is a 4×4 matrix, and you multiply them together in reverse order: gl_Position = Projection × View × Model × vertex."
        )}
      </p>

      <LessonTable
        headers={[
          tx(t, "mvpHeader0", "Matrix"),
          tx(t, "mvpHeader1", "Purpose"),
          tx(t, "mvpHeader2", "GLM function"),
        ]}
        rows={[
          ["Model",      tx(t, "mvpModel",      "Places the object in world space (translate / rotate / scale)"),   "glm::translate / rotate / scale"],
          ["View",       tx(t, "mvpView",       "Simulates a camera — transforms world space to camera space"),     "glm::lookAt"],
          ["Projection", tx(t, "mvpProjection", "Applies perspective — things far away appear smaller"),            "glm::perspective"],
        ]}
      />

      <H2>{tx(t, "ch08_modelTitle", "Model matrix — placing objects")}</H2>
      <p>
        {tx(t, "ch08_modelBody",
          "Start with an identity matrix and apply transformations. Order matters: scale first, then rotate, then translate. In code you write them in reverse (TRS applied right-to-left by the GPU)."
        )}
      </p>
      <CodeBlock lang="cpp" filename="model_matrix.cpp" t={t}>{`glm::mat4 model(1.0f);  // start with identity

// 1. Rotate 45° around Z axis
model = glm::rotate(model, glm::radians(45.0f), glm::vec3(0.0f, 0.0f, 1.0f));

// 2. Scale by 0.5 on all axes
model = glm::scale(model, glm::vec3(0.5f, 0.5f, 0.5f));

// 3. Move 1 unit to the right
model = glm::translate(model, glm::vec3(1.0f, 0.0f, 0.0f));`}</CodeBlock>

      <H2>{tx(t, "ch08_viewTitle", "View matrix — camera")}</H2>
      <p>
        {tx(t, "ch08_viewBody",
          "glm::lookAt takes three vectors: the camera position (eye), the point it is looking at (center), and which direction is up. It returns a view matrix that transforms world space into camera space."
        )}
      </p>
      <CodeBlock lang="cpp" filename="view_matrix.cpp" t={t}>{`glm::mat4 view = glm::lookAt(
    glm::vec3(0.0f, 0.0f,  3.0f),  // camera at Z=3
    glm::vec3(0.0f, 0.0f,  0.0f),  // looking at origin
    glm::vec3(0.0f, 1.0f,  0.0f)   // Y is up
);`}</CodeBlock>

      <H2>{tx(t, "ch08_projTitle", "Projection matrix — perspective")}</H2>
      <p>
        {tx(t, "ch08_projBody",
          "glm::perspective creates a frustum where things farther away appear smaller. The arguments are the vertical field of view in radians, the aspect ratio of your window, and the near/far clip planes."
        )}
      </p>
      <CodeBlock lang="cpp" filename="projection_matrix.cpp" t={t}>{`float aspect = (float)windowWidth / (float)windowHeight;

glm::mat4 projection = glm::perspective(
    glm::radians(45.0f),  // vertical FOV
    aspect,               // width / height
    0.1f,                 // near plane (do not set to 0)
    100.0f                // far plane
);`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "ch08_nearWarn",
          "Never set the near plane to 0. It causes depth precision issues (z-fighting) because the depth buffer's precision is distributed between near and far — a near plane of 0 gives you no precision at all."
        )}
      </Callout>

      <H2>{tx(t, "ch08_shaderTitle", "Applying MVP in the vertex shader")}</H2>
      <CodeBlock lang="glsl" filename="mvp.vert" t={t}>{`#version 460 core

layout (location = 0) in vec3 aPos;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

void main() {
    gl_Position = uProjection * uView * uModel * vec4(aPos, 1.0);
}`}</CodeBlock>
      <CodeBlock lang="cpp" filename="set_uniforms.cpp" t={t}>{`glUseProgram(shaderProgram);

glUniformMatrix4fv(glGetUniformLocation(shaderProgram, "uModel"),      1, GL_FALSE, glm::value_ptr(model));
glUniformMatrix4fv(glGetUniformLocation(shaderProgram, "uView"),       1, GL_FALSE, glm::value_ptr(view));
glUniformMatrix4fv(glGetUniformLocation(shaderProgram, "uProjection"), 1, GL_FALSE, glm::value_ptr(projection));`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "ch08_animTip",
          "To animate rotation, multiply the angle by glfwGetTime() every frame: glm::rotate(model, (float)glfwGetTime() * glm::radians(50.0f), glm::vec3(0,1,0)). The model will spin continuously without any extra state."
        )}
      </Callout>

    </article>
  );
}

// ── Chapter 09: Phong Lighting ────────────────────────────────────────────────

function LightingContent({ t }: { t: any }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "ch09_intro",
          "Lighting transforms a flat-shaded object into something that reads as three-dimensional. The Phong model — the most widely used introductory lighting model — breaks illumination into three independent components: ambient, diffuse, and specular."
        )}
      </p>

      <H2>{tx(t, "ch09_componentsTitle", "The three components")}</H2>
      <LessonTable
        headers={[
          tx(t, "phongHeader0", "Component"),
          tx(t, "phongHeader1", "What it simulates"),
          tx(t, "phongHeader2", "Key variable"),
        ]}
        rows={[
          ["Ambient",  tx(t, "phongAmbient",  "Indirect light — prevents fully unlit surfaces from being pure black"),  "ambientStrength (e.g. 0.1)"],
          ["Diffuse",  tx(t, "phongDiffuse",  "Direct light — brightness depends on angle between surface and light"),   "dot(normal, lightDir)"],
          ["Specular", tx(t, "phongSpecular", "Highlight — depends on angle between reflected light and camera"),        "shininess (e.g. 32)"],
        ]}
      />

      <H2>{tx(t, "ch09_normalsTitle", "Normals as a vertex attribute")}</H2>
      <p>
        {tx(t, "ch09_normalsBody",
          "A normal is a unit vector perpendicular to the surface at each vertex. It tells the lighting equation which direction the surface is facing. You add it as a third vertex attribute."
        )}
      </p>
      <CodeBlock lang="cpp" filename="normals.cpp" t={t}>{`// position (xyz)  +  normal (xyz)  — stride = 6 floats
float vertices[] = {
    -0.5f, -0.5f,  0.5f,    0.0f, 0.0f, 1.0f,  // front face
     0.5f, -0.5f,  0.5f,    0.0f, 0.0f, 1.0f,
     0.5f,  0.5f,  0.5f,    0.0f, 0.0f, 1.0f,
    // ... more faces
};

int stride = 6 * sizeof(float);

glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, stride, (void*)0);               // position
glEnableVertexAttribArray(0);
glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, stride, (void*)(3*sizeof(float))); // normal
glEnableVertexAttribArray(1);`}</CodeBlock>

      <H2>{tx(t, "ch09_vertTitle", "Vertex shader")}</H2>
      <p>
        {tx(t, "ch09_vertBody",
          "The vertex shader passes the world-space position and normal to the fragment shader. We transform the position by the model matrix to get world space, and the normal by the normal matrix to account for non-uniform scaling."
        )}
      </p>
      <CodeBlock lang="glsl" filename="phong.vert" t={t}>{`#version 460 core

layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aNormal;

out vec3 FragPos;
out vec3 Normal;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
uniform mat3 uNormalMatrix;  // transpose(inverse(mat3(model)))

void main() {
    FragPos = vec3(uModel * vec4(aPos, 1.0));
    Normal  = normalize(uNormalMatrix * aNormal);
    gl_Position = uProjection * uView * vec4(FragPos, 1.0);
}`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "ch09_normalMatrixNote",
          "The normal matrix is needed because non-uniform scaling distorts normals. Compute it on the CPU each frame: glm::mat3 normalMatrix = glm::transpose(glm::inverse(glm::mat3(model))), then upload with glUniformMatrix3fv."
        )}
      </Callout>

      <H2>{tx(t, "ch09_fragTitle", "Fragment shader — full Phong calculation")}</H2>
      <CodeBlock lang="glsl" filename="phong.frag" t={t}>{`#version 460 core

in  vec3 FragPos;
in  vec3 Normal;
out vec4 FragColor;

uniform vec3 uLightPos;
uniform vec3 uLightColor;
uniform vec3 uObjectColor;
uniform vec3 uViewPos;   // camera position

void main() {
    // --- Ambient ---
    float ambientStrength = 0.1;
    vec3 ambient = ambientStrength * uLightColor;

    // --- Diffuse ---
    vec3 norm     = normalize(Normal);
    vec3 lightDir = normalize(uLightPos - FragPos);
    float diff    = max(dot(norm, lightDir), 0.0);
    vec3 diffuse  = diff * uLightColor;

    // --- Specular ---
    float specularStrength = 0.5;
    vec3 viewDir    = normalize(uViewPos - FragPos);
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec      = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    vec3 specular   = specularStrength * spec * uLightColor;

    vec3 result = (ambient + diffuse + specular) * uObjectColor;
    FragColor = vec4(result, 1.0);
}`}</CodeBlock>

      <H2>{tx(t, "ch09_cpuTitle", "Setting the uniforms from C++")}</H2>
      <CodeBlock lang="cpp" filename="lighting_uniforms.cpp" t={t}>{`glUseProgram(shaderProgram);

glm::vec3 lightPos(1.2f, 1.0f, 2.0f);
glm::vec3 cameraPos(0.0f, 0.0f, 3.0f);

glUniform3fv(glGetUniformLocation(shaderProgram, "uLightPos"),    1, glm::value_ptr(lightPos));
glUniform3fv(glGetUniformLocation(shaderProgram, "uLightColor"),  1, glm::value_ptr(glm::vec3(1.0f)));      // white light
glUniform3fv(glGetUniformLocation(shaderProgram, "uObjectColor"), 1, glm::value_ptr(glm::vec3(1.0f, 0.5f, 0.31f))); // coral
glUniform3fv(glGetUniformLocation(shaderProgram, "uViewPos"),     1, glm::value_ptr(cameraPos));

glm::mat3 normalMatrix = glm::transpose(glm::inverse(glm::mat3(model)));
glUniformMatrix3fv(glGetUniformLocation(shaderProgram, "uNormalMatrix"), 1, GL_FALSE, glm::value_ptr(normalMatrix));`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "ch09_nextTip",
          "Try moving the light position with glfwGetTime() — multiply by a sin/cos to orbit the light around your object. It immediately makes the lighting feel dynamic and proves your normal calculations are correct."
        )}
      </Callout>

    </article>
  );
}

// ── Chapter 10: Face Winding & Culling ────────────────────────────────────────

function WindingContent({ t }: { t: any }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "ch10_intro",
          "The order in which you specify a triangle's vertices is not cosmetic — it tells OpenGL which side of the face is the 'front'. OpenGL uses this to skip drawing back-facing triangles entirely, cutting fragment shader work roughly in half on closed meshes."
        )}
      </p>

      <H2>{tx(t, "ch10_windingTitle", "What winding order means")}</H2>
      <p>
        {tx(t, "ch10_windingBody",
          "When you look at a triangle from the front, trace its vertices in order. If they go counter-clockwise (CCW), OpenGL treats it as front-facing. If they go clockwise (CW), it is back-facing. This is determined by the cross product of two edge vectors — it always points toward the viewer for a front face."
        )}
      </p>

      {/* Visual diagram */}
      <div className="my-6 grid grid-cols-2 gap-4">
        {[
          { label: "CCW — Front face ✓", color: "#22c55e", bg: "bg-emerald-500/5 border-emerald-500/20", pts: "150,30 40,220 260,220" },
          { label: "CW  — Back face  ✗", color: "#ef4444", bg: "bg-red-500/5 border-red-500/20",       pts: "150,30 260,220 40,220" },
        ].map(({ label, color, bg, pts }) => (
          <div key={label} className={`rounded-xl border ${bg} p-4 flex flex-col items-center gap-3`}>
            <svg viewBox="0 0 300 250" className="w-full max-w-[180px]">
              <polygon points={pts} fill={color + "18"} stroke={color + "aa"} strokeWidth="2" />
              {pts.split(" ").map((p, i) => {
                const [x,y] = p.split(",").map(Number);
                const offsets = [[-14,-10],[10,8],[-24,8]];
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="7" fill={color} fillOpacity={0.85} />
                    <text x={x+offsets[i][0]} y={y+offsets[i][1]} fill={color} fontSize="13" fontFamily="monospace" fontWeight="bold">v{i}</text>
                  </g>
                );
              })}
              {/* Arrow arc */}
              <path d={pts.split(" ").length >= 3 ?
                `M 150 135 m 0 -30 a 30 30 0 1 ${pts === "150,30 40,220 260,220" ? "1" : "0"} 0.01 0`
                : ""} fill="none" stroke={color} strokeWidth="1.5" strokeOpacity={0.5} markerEnd="url(#arr)" />
            </svg>
            <span className="font-mono text-[10px] font-bold" style={{ color }}>{label}</span>
          </div>
        ))}
      </div>

      <H2>{tx(t, "ch10_cullingTitle", "Enabling face culling")}</H2>
      <p>
        {tx(t, "ch10_cullingBody",
          "Face culling is disabled by default. You enable it once during initialization. After that, every back-facing triangle is rejected before the fragment shader even runs."
        )}
      </p>
      <CodeBlock lang="cpp" filename="culling_setup.cpp" t={t}>{`// Call once during initialization, before the render loop
glEnable(GL_CULL_FACE);     // enable culling (disabled by default)
glCullFace(GL_BACK);        // cull back-facing triangles (default)
glFrontFace(GL_CCW);        // CCW = front face (default)

// If your faces are vanishing unexpectedly, try:
// glCullFace(GL_FRONT);    // temporarily cull front faces instead
// — if they appear, your winding order is reversed`}</CodeBlock>

      <LessonTable
        headers={["Function", "Options", "Default"]}
        rows={[
          ["glCullFace",  "GL_BACK, GL_FRONT, GL_FRONT_AND_BACK",  "GL_BACK"],
          ["glFrontFace", "GL_CCW, GL_CW",                          "GL_CCW"],
        ]}
      />

      <Callout type="info" t={t}>
        {tx(t, "ch10_perfNote",
          "On a closed mesh (like a sphere or cube) where no back face is ever visible, enabling culling eliminates roughly 50% of all fragment shader invocations. For complex scenes this is one of the cheapest performance wins available."
        )}
      </Callout>

      <H2>{tx(t, "ch10_normalsTitle", "Normals and winding order")}</H2>
      <p>
        {tx(t, "ch10_normalsBody",
          "The surface normal of a triangle — the vector perpendicular to it pointing outward — is implicitly defined by its winding order. Using the right-hand rule: curl your fingers from edge v0→v1 to edge v0→v2 and your thumb points in the direction of the outward normal. This is why consistent winding matters when you compute normals for lighting."
        )}
      </p>
      <CodeBlock lang="cpp" filename="normal_from_winding.cpp" t={t}>{`// For a triangle with vertices A, B, C in CCW order:
glm::vec3 edge1 = B - A;
glm::vec3 edge2 = C - A;
glm::vec3 normal = glm::normalize(glm::cross(edge1, edge2));
// normal now points toward the front face (outward)`}</CodeBlock>

      <H2>{tx(t, "ch10_debugTitle", "Debugging winding issues")}</H2>
      <p>
        {tx(t, "ch10_debugBody",
          "Missing faces on a 3D model almost always mean incorrect or inconsistent winding. Common causes:"
        )}
      </p>
      <ul className="space-y-2 ml-4 list-disc text-[var(--text-muted)] text-sm">
        <li>{tx(t, "ch10_debug1", "Mesh loaded from a file that uses CW winding — flip with glFrontFace(GL_CW) or fix in the exporter")}</li>
        <li>{tx(t, "ch10_debug2", "Non-uniform scale (negative scale on one axis mirrors faces, reversing winding) — multiply model matrix determinant, reverse if negative")}</li>
        <li>{tx(t, "ch10_debug3", "Manually defined quads where the two triangles have inconsistent vertex order")}</li>
      </ul>

      <Callout type="tip" t={t}>
        {tx(t, "ch10_debugTip",
          "When debugging winding issues, temporarily call glDisable(GL_CULL_FACE) to see all faces. If the mesh looks correct with culling disabled, the problem is winding order. If it still looks wrong, the issue is elsewhere (normals, shader, transform)."
        )}
      </Callout>

    </article>
  );
}

// ── Chapter 11: Bind-to-Edit vs DSA ─────────────────────────────────────────

function DSAContent({ t }: { t: any }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "ch11_intro",
          "Every chapter so far used the traditional bind-to-edit pattern: bind an object, modify it, unbind it. OpenGL 4.5 introduced Direct State Access (DSA) — a parallel API that lets you modify any object by its ID without ever binding it to a global target. Both approaches produce identical GPU behavior; the difference is only in how you write the CPU-side code."
        )}
      </p>

      <H2>{tx(t, "ch11_problemTitle", "The bind-to-edit problem")}</H2>
      <p>
        {tx(t, "ch11_problemBody",
          "Binding is implicit global state. When you call glBindBuffer, every subsequent buffer operation silently targets that buffer until you bind something else. This makes code harder to read, and it is easy to accidentally modify the wrong buffer."
        )}
      </p>
      <CodeBlock lang="cpp" filename="bind_to_edit.cpp" t={t}>{`// Traditional bind-to-edit — what we have used so far
unsigned int VBO;
glGenBuffers(1, &VBO);
glBindBuffer(GL_ARRAY_BUFFER, VBO);  // ← sets global state
glBufferData(GL_ARRAY_BUFFER,        // ← "which buffer?" — whichever is bound
             sizeof(data), data, GL_STATIC_DRAW);

// A month later, someone inserts a glBindBuffer here
// and your glBufferData silently corrupts the wrong buffer.
// This is a real class of bug in large OpenGL codebases.`}</CodeBlock>

      <H2>{tx(t, "ch11_dsaTitle", "DSA: operate by ID, no binding")}</H2>
      <p>
        {tx(t, "ch11_dsaBody",
          "DSA functions take the object ID as their first argument. You never need to bind the object first. The same data upload from above looks like this:"
        )}
      </p>
      <CodeBlock lang="cpp" filename="dsa_buffer.cpp" t={t}>{`// DSA — OpenGL 4.5+
unsigned int VBO;
glCreateBuffers(1, &VBO);             // glCreate* instead of glGen*
// Note: glCreateBuffers initializes the object immediately.
// glGenBuffers just reserves an ID — it is not usable until bound.

glNamedBufferData(VBO,                // ← object ID, not a target enum
                  sizeof(data), data, GL_STATIC_DRAW);
// No binding needed. VBO is modified directly by its ID.`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "ch11_createVsGen",
          "glCreate* vs glGen*: glGen* functions (glGenBuffers, glGenTextures) only reserve an ID. The object is not initialized until it is first bound. glCreate* (DSA) both reserves the ID and initializes the object, so you can use it immediately without binding."
        )}
      </Callout>

      <H2>{tx(t, "ch11_vaoTitle", "DSA for VAOs")}</H2>
      <p>
        {tx(t, "ch11_vaoBody",
          "The VAO setup is where DSA shows the biggest improvement in readability. Instead of binding the VAO, then binding the VBO inside it, you explicitly link them:"
        )}
      </p>
      <CodeBlock lang="cpp" filename="dsa_vao.cpp" t={t}>{`// ── Traditional (what you have been using) ───────────────────────────────────
unsigned int VAO, VBO;
glGenVertexArrays(1, &VAO); glGenBuffers(1, &VBO);
glBindVertexArray(VAO);                                    // bind VAO
  glBindBuffer(GL_ARRAY_BUFFER, VBO);                      // bind VBO inside VAO
  glBufferData(GL_ARRAY_BUFFER, sizeof(verts), verts, GL_STATIC_DRAW);
  glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, stride, (void*)0);
  glEnableVertexAttribArray(0);
glBindVertexArray(0);


// ── DSA equivalent ────────────────────────────────────────────────────────────
unsigned int dVAO, dVBO;
glCreateVertexArrays(1, &dVAO);
glCreateBuffers(1, &dVBO);

// Upload data — no binding
glNamedBufferStorage(dVBO, sizeof(verts), verts, GL_DYNAMIC_STORAGE_BIT);

// Attach buffer to VAO at binding point 0
glVertexArrayVertexBuffer(
    dVAO,           // which VAO
    0,              // binding point index
    dVBO,           // which buffer
    0,              // offset into buffer (bytes)
    stride          // stride between vertices (bytes)
);

// Describe attribute 0: 3 floats, not normalized, offset 0 within vertex
glVertexArrayAttribFormat(dVAO, /*attrib*/0, /*size*/3, GL_FLOAT, GL_FALSE, /*relativeOffset*/0);

// Connect attrib 0 to binding point 0
glVertexArrayAttribBinding(dVAO, /*attrib*/0, /*bindingPoint*/0);

// Enable attrib 0
glEnableVertexArrayAttrib(dVAO, 0);

// Render — same as always
glBindVertexArray(dVAO);
glDrawArrays(GL_TRIANGLES, 0, 3);`}</CodeBlock>

      <H2>{tx(t, "ch11_comparisonTitle", "Side-by-side comparison")}</H2>
      <LessonTable
        headers={[tx(t, "ch11_compHeader0", "Operation"), tx(t, "ch11_compHeader1", "Bind-to-edit"), tx(t, "ch11_compHeader2", "DSA")]}
        rows={[
          [tx(t, "ch11_op1", "Create buffer"),      "glGenBuffers + glBindBuffer",    "glCreateBuffers"],
          [tx(t, "ch11_op2", "Upload data"),         "glBufferData (bound target)",    "glNamedBufferData (by ID)"],
          [tx(t, "ch11_op3", "Update partial data"), "glBufferSubData (bound target)", "glNamedBufferSubData (by ID)"],
          [tx(t, "ch11_op4", "Create texture"),      "glGenTextures + glBindTexture",  "glCreateTextures"],
          [tx(t, "ch11_op5", "Upload texture"),      "glTexImage2D (bound target)",    "glTextureStorage2D + glTextureSubImage2D"],
          [tx(t, "ch11_op6", "VAO attrib setup"),    "glVertexAttribPointer",          "glVertexArrayAttribFormat + Binding"],
        ]}
      />

      <H2>{tx(t, "ch11_whenTitle", "When to use which")}</H2>
      <LessonTable
        headers={[tx(t, "ch11_whenHeader0", "Situation"), tx(t, "ch11_whenHeader1", "Recommended")]}
        rows={[
          [tx(t, "ch11_when1", "Learning OpenGL concepts"),          tx(t, "ch11_whenRec1", "Bind-to-edit — most tutorials use it, easier to find help")],
          [tx(t, "ch11_when2", "New project, OpenGL 4.5+ available"), tx(t, "ch11_whenRec2", "DSA — cleaner, safer, easier to debug")],
          [tx(t, "ch11_when3", "Maintaining existing codebase"),      tx(t, "ch11_whenRec3", "Bind-to-edit — don't mix styles in the same file")],
          [tx(t, "ch11_when4", "Need OpenGL 3.3 compatibility"),      tx(t, "ch11_whenRec4", "Bind-to-edit — DSA requires 4.5+")],
        ]}
      />

      <Callout type="tip" t={t}>
        {tx(t, "ch11_extensionTip",
          "DSA was originally available as the extension ARB_direct_state_access before becoming core in 4.5. You can check support with GLEW: if (GLEW_ARB_direct_state_access) — though on any GPU made after 2014, support is effectively universal."
        )}
      </Callout>

    </article>
  );
}

// ── Exported track ────────────────────────────────────────────────────────────

export const openGLTrack: Track = {
  id: "opengl",
  title: "OpenGL 4.6",
  chapters: [
    { id: "legacy",          title: "Legacy & Modern OpenGL",   minRead: 10, content: (t) => <LegacyContent          t={t} /> },
    { id: "pipeline",        title: "The Graphics Pipeline",    minRead: 8,  content: (t) => <PipelineContent        t={t} /> },
    { id: "vbo",             title: "Vertex Buffer Objects",    minRead: 10, content: (t) => <VBOContent             t={t} /> },
    { id: "vao",             title: "Vertex Array Objects",     minRead: 7,  content: (t) => <VAOContent             t={t} /> },
    { id: "shaders",         title: "First Shaders",            minRead: 9,  content: (t) => <ShadersContent        t={t} /> },
    { id: "triangle",        title: "Drawing the Triangle",     minRead: 5,  content: (t) => <TriangleContent        t={t} /> },
    { id: "ebo",             title: "Indexed Drawing (EBO)",    minRead: 8,  content: (t) => <EBOContent             t={t} /> },
    { id: "textures",        title: "Textures",                 minRead: 12, content: (t) => <TexturesContent        t={t} /> },
    { id: "linear-algebra",  title: "Linear Algebra for 3D",   minRead: 14, content: (t) => <LinearAlgebraContent  t={t} /> },
    { id: "transformations", title: "Transformations + GLM",   minRead: 11, content: (t) => <TransformationsContent t={t} /> },
    { id: "lighting",        title: "Phong Lighting",           minRead: 13, content: (t) => <LightingContent        t={t} /> },
    { id: "winding",         title: "Face Winding & Culling",   minRead: 8,  content: (t) => <WindingContent         t={t} /> },
    { id: "dsa",             title: "Direct State Access (DSA)", minRead: 9, content: (t) => <DSAContent             t={t} /> },
  ],
};