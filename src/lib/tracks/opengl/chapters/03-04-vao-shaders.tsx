// src/lib/tracks/opengl/chapters/03-vao.tsx

import { CodeBlock, Callout, IC, H2, H3 } from "@/components/lesson/LessonComponents";

// ─── VAO Diagram inline component ─────────────────────────────────────────────

function VAODiagram() {
  return (
    <div className="my-6 rounded-xl border border-white/10 bg-[#0d1117] p-5">
      <div className="text-[9px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-widest text-center mb-4">
        VAO records bindings so you can replay them with one call
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {/* VAO box */}
        <div className="border-2 border-[var(--primary)]/40 rounded-xl p-4 bg-[var(--primary)]/5 text-center min-w-[130px]">
          <div className="font-mono text-[10px] font-bold text-[var(--primary)] mb-3">VAO</div>
          <div className="space-y-1.5">
            <div className="text-[9px] font-mono text-[var(--text-muted)] text-left">attrib 0 &rarr; VBO #1</div>
            <div className="text-[9px] font-mono text-[var(--text-muted)] text-left">attrib 1 &rarr; VBO #1</div>
            <div className="text-[9px] font-mono text-[var(--text-muted)] text-left">indices &rarr; EBO #1</div>
          </div>
        </div>

        <div className="font-mono text-[var(--text-muted)] text-xs">bind once</div>

        {/* GPU boxes */}
        <div className="flex flex-col gap-2">
          <div className="border border-white/10 rounded-lg px-4 py-2 bg-white/[0.03] font-mono text-[10px] text-white text-center">
            VBO #1 (positions)
          </div>
          <div className="border border-white/10 rounded-lg px-4 py-2 bg-white/[0.03] font-mono text-[10px] text-white text-center">
            VBO #2 (tex coords)
          </div>
          <div className="border border-white/10 rounded-lg px-4 py-2 bg-white/[0.03] font-mono text-[10px] text-white text-center">
            EBO #1 (indices)
          </div>
        </div>
      </div>
    </div>
  );
}

export const VAOChapter = (
  <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

    <p className="text-lg text-[var(--text-main)]">
      Every time you draw a mesh, OpenGL needs to know which buffer the vertex data lives in,
      and how that buffer is laid out. Without a VAO you would need to re-specify all of this
      before every draw call. A <strong className="text-white">Vertex Array Object (VAO)</strong>{" "}
      records all of that state once so you can replay it with a single bind.
    </p>

    <H2>What a VAO stores</H2>

    <VAODiagram />

    <p>
      When a VAO is bound, every call to <IC>glVertexAttribPointer</IC> and{" "}
      <IC>glEnableVertexAttribArray</IC> is recorded inside it. The bound{" "}
      <IC>GL_ELEMENT_ARRAY_BUFFER</IC> (index buffer) is also stored. The{" "}
      <IC>GL_ARRAY_BUFFER</IC> binding itself is not stored directly, but the association
      between each attribute and its source buffer is.
    </p>

    <H2>Creating and using a VAO</H2>

    <CodeBlock lang="cpp" filename="main.cpp">{`// 1. Generate and bind the VAO FIRST, before touching any VBO
unsigned int VAO;
glGenVertexArrays(1, &VAO);
glBindVertexArray(VAO);  // start recording

// 2. Now set up your VBO as normal — the VAO records all of this
unsigned int VBO;
glGenBuffers(1, &VBO);
glBindBuffer(GL_ARRAY_BUFFER, VBO);
glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);

glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
glEnableVertexAttribArray(0);

// 3. Unbind the VAO when done with setup (optional but good practice)
glBindVertexArray(0);`}</CodeBlock>

    <p>
      Now in the render loop, instead of re-specifying all of that, you just bind the VAO:
    </p>

    <CodeBlock lang="cpp" filename="render_loop.cpp">{`while (!glfwWindowShouldClose(window)) {
    glClear(GL_COLOR_BUFFER_BIT);
    glUseProgram(shaderProgram);

    // One line replaces all the VBO setup and attribute pointer calls
    glBindVertexArray(VAO);
    glDrawArrays(GL_TRIANGLES, 0, 3);

    glfwSwapBuffers(window);
    glfwPollEvents();
}`}</CodeBlock>

    <Callout type="tip">
      The golden rule: create your VAO before you set up your VBOs. If you bind the VBO
      first and the VAO after, the VAO will not have recorded the attribute pointers.
    </Callout>

    <H2>Interleaved vertex data</H2>

    <p>
      Real vertices have more than just a position. A typical vertex has position, texture
      coordinates, and a normal vector, all packed together in a single buffer. The{" "}
      <strong className="text-white">stride</strong> and <strong className="text-white">offset</strong>{" "}
      arguments in <IC>glVertexAttribPointer</IC> handle this.
    </p>

    <CodeBlock lang="cpp" filename="interleaved.cpp">{`// Interleaved layout: [X Y Z] [U V] [NX NY NZ] per vertex
float vertices[] = {
//   position           texcoord    normal
    -0.5f, -0.5f, 0.0f, 0.0f, 0.0f, 0.0f, 0.0f, 1.0f,
     0.5f, -0.5f, 0.0f, 1.0f, 0.0f, 0.0f, 0.0f, 1.0f,
     0.0f,  0.5f, 0.0f, 0.5f, 1.0f, 0.0f, 0.0f, 1.0f,
};

// Each vertex is 8 floats = 32 bytes
int stride = 8 * sizeof(float);

// Attribute 0: position (3 floats, starts at byte 0)
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, stride, (void*)0);
glEnableVertexAttribArray(0);

// Attribute 1: tex coord (2 floats, starts at byte 12)
glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE, stride, (void*)(3 * sizeof(float)));
glEnableVertexAttribArray(1);

// Attribute 2: normal (3 floats, starts at byte 20)
glVertexAttribPointer(2, 3, GL_FLOAT, GL_FALSE, stride, (void*)(5 * sizeof(float)));
glEnableVertexAttribArray(2);`}</CodeBlock>

  </article>
);

// ─── Chapter 4: First Shaders ─────────────────────────────────────────────────

export const ShadersChapter = (
  <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

    <p className="text-lg text-[var(--text-main)]">
      Shaders are small programs that run on the GPU for every vertex or pixel. Writing them
      in GLSL feels different from writing C++, but the concepts are familiar: you have types,
      functions, and control flow. This chapter covers everything you need to write your first
      pair of shaders.
    </p>

    <H2>GLSL basics</H2>

    <p>
      GLSL looks like C, but it comes with built-in vector and matrix types that make graphics
      math natural. The most common types are:
    </p>

    <CodeBlock lang="glsl" filename="types.glsl">{`// Scalar types
float  f = 1.0;
int    i = 2;
bool   b = true;

// Vector types (2, 3, or 4 components)
vec2 uv    = vec2(0.5, 0.5);
vec3 color = vec3(1.0, 0.0, 0.0);  // red
vec4 pos   = vec4(0.0, 0.0, 0.0, 1.0);

// Accessing components: .x .y .z .w or .r .g .b .a
vec3 normal = vec3(0.0, 1.0, 0.0);
float y = normal.y;       // 1.0
vec2  xz = normal.xz;    // "swizzling" — grab any combination

// Matrix types
mat4 transform = mat4(1.0);  // identity matrix`}</CodeBlock>

    <H2>Passing data between stages</H2>

    <p>
      Data flows through the pipeline using qualifiers. The keywords changed between older
      and modern GLSL:
    </p>

    <div className="rounded-xl border border-white/10 overflow-hidden my-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.03]">
            <th className="text-left px-4 py-3 font-mono text-[11px] text-[var(--text-muted)] uppercase tracking-widest">Qualifier</th>
            <th className="text-left px-4 py-3 font-mono text-[11px] text-[var(--text-muted)] uppercase tracking-widest">Used in</th>
            <th className="text-left px-4 py-3 font-mono text-[11px] text-[var(--text-muted)] uppercase tracking-widest">Meaning</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-xs">
          <tr>
            <td className="px-4 py-3 font-mono text-[var(--primary)]">in</td>
            <td className="px-4 py-3 text-[var(--text-muted)]">vertex shader</td>
            <td className="px-4 py-3 text-[var(--text-muted)]">Data coming from the VBO (one value per vertex)</td>
          </tr>
          <tr>
            <td className="px-4 py-3 font-mono text-[var(--primary)]">out</td>
            <td className="px-4 py-3 text-[var(--text-muted)]">vertex shader</td>
            <td className="px-4 py-3 text-[var(--text-muted)]">Data passed to the next stage (interpolated)</td>
          </tr>
          <tr>
            <td className="px-4 py-3 font-mono text-[var(--primary)]">in</td>
            <td className="px-4 py-3 text-[var(--text-muted)]">fragment shader</td>
            <td className="px-4 py-3 text-[var(--text-muted)]">Receives the interpolated out from vertex shader</td>
          </tr>
          <tr>
            <td className="px-4 py-3 font-mono text-[var(--primary)]">uniform</td>
            <td className="px-4 py-3 text-[var(--text-muted)]">both</td>
            <td className="px-4 py-3 text-[var(--text-muted)]">Value set from C++, same for all vertices/pixels</td>
          </tr>
        </tbody>
      </table>
    </div>

    <H2>A color interpolation example</H2>

    <p>
      Let us pass a color per vertex and let OpenGL interpolate it across the triangle.
      This is the classic OpenGL rainbow triangle.
    </p>

    <CodeBlock lang="glsl" filename="vertex_color.glsl">{`#version 460 core

layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aColor;  // color attribute from VBO

out vec3 vertexColor;  // will be interpolated and sent to fragment shader

void main() {
    gl_Position = vec4(aPos, 1.0);
    vertexColor = aColor;
}`}</CodeBlock>

    <CodeBlock lang="glsl" filename="fragment_color.glsl">{`#version 460 core

in  vec3 vertexColor;  // received from vertex shader (interpolated)
out vec4 FragColor;

void main() {
    FragColor = vec4(vertexColor, 1.0);
}`}</CodeBlock>

    <Callout type="info">
      When the GPU rasterizes a triangle, each pixel fragment gets a color that is the
      weighted average of the three vertex colors based on how close the pixel is to each
      vertex. This automatic interpolation is called <strong className="text-white">barycentric interpolation</strong>{" "}
      and it is free, you do not need to write any code for it.
    </Callout>

    <H2>Uniforms</H2>

    <p>
      A <strong className="text-white">uniform</strong> is a value you set from your C++
      code that stays the same for all vertices in a draw call. It is perfect for things
      like transformation matrices, time, or a global color tint.
    </p>

    <CodeBlock lang="glsl" filename="uniform_example.glsl">{`#version 460 core

out vec4 FragColor;
uniform vec4 uColor;  // set from C++

void main() {
    FragColor = uColor;
}`}</CodeBlock>

    <CodeBlock lang="cpp" filename="set_uniform.cpp">{`// Set the uniform from C++
glUseProgram(shaderProgram);  // must be active

// Find the location of the uniform by name
int colorLocation = glGetUniformLocation(shaderProgram, "uColor");

// Set it (vec4: r, g, b, a)
glUniform4f(colorLocation, 1.0f, 0.5f, 0.2f, 1.0f);`}</CodeBlock>

    <Callout type="warn">
      You must call <IC>glUseProgram</IC> before setting uniforms. Uniforms belong to the
      currently active program. Setting a uniform on the wrong program has no effect.
    </Callout>

  </article>
);