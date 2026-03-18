// src/lib/tracks/opengl/chapters/02-vbo.tsx

import { CodeBlock, Callout, IC, H2, H3, VBOFlowDiagram } from "@/components/lesson/LessonComponents";

export const VBOChapter = (
  <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

    <p className="text-lg text-[var(--text-main)]">
      Your vertex data starts as a C++ array living in RAM. The GPU cannot access RAM directly,
      it can only read from its own memory (VRAM). A{" "}
      <strong className="text-white">Vertex Buffer Object (VBO)</strong> is the mechanism
      OpenGL provides to copy that data from your CPU into the GPU, where the vertex shader
      can read it.
    </p>

    <H2>The data flow</H2>

    <p>
      Before a single triangle gets drawn, this is what happens under the hood:
    </p>

    <VBOFlowDiagram />

    <p>
      You define the data, create a buffer on the GPU, upload the data to it with{" "}
      <IC>glBufferData</IC>, then issue a draw call. The GPU does the rest.
    </p>

    <H2>Creating a VBO step by step</H2>

    <H3>Step 1: Generate the buffer</H3>

    <p>
      Everything in OpenGL is identified by an integer ID. You ask OpenGL to create a buffer
      object and it gives you back an ID you use for all future operations on that buffer.
    </p>

    <CodeBlock lang="cpp" filename="main.cpp">{`unsigned int VBO;
glGenBuffers(1, &VBO);  // create 1 buffer, store its ID in VBO`}</CodeBlock>

    <H3>Step 2: Bind the buffer</H3>

    <p>
      OpenGL is a state machine. To operate on a buffer, you first "bind" it, which means
      "make this the currently active buffer of this type". From this point on, any buffer
      operation will apply to the bound buffer.
    </p>

    <CodeBlock lang="cpp" filename="main.cpp">{`// GL_ARRAY_BUFFER is the target for vertex attribute data
glBindBuffer(GL_ARRAY_BUFFER, VBO);`}</CodeBlock>

    <Callout type="info">
      OpenGL has multiple buffer targets. <IC>GL_ARRAY_BUFFER</IC> is for vertex data.
      You will also see <IC>GL_ELEMENT_ARRAY_BUFFER</IC> for index buffers when we cover
      indexed drawing later.
    </Callout>

    <H3>Step 3: Upload the data</H3>

    <p>
      Now you copy the vertex array from RAM to the GPU with <IC>glBufferData</IC>. The last
      argument is a hint to the driver about how often this data will change, which influences
      where the driver places the buffer in memory.
    </p>

    <CodeBlock lang="cpp" filename="main.cpp">{`float vertices[] = {
    -0.5f, -0.5f, 0.0f,
     0.5f, -0.5f, 0.0f,
     0.0f,  0.5f, 0.0f
};

glBufferData(
    GL_ARRAY_BUFFER,           // target: the currently bound array buffer
    sizeof(vertices),          // size in bytes
    vertices,                  // pointer to the data
    GL_STATIC_DRAW             // usage hint
);`}</CodeBlock>

    <p>
      The three usage hints you need to know:
    </p>

    <div className="rounded-xl border border-white/10 overflow-hidden my-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.03]">
            <th className="text-left px-4 py-3 font-mono text-[11px] text-[var(--text-muted)] uppercase tracking-widest">Hint</th>
            <th className="text-left px-4 py-3 font-mono text-[11px] text-[var(--text-muted)] uppercase tracking-widest">When to use</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          <tr>
            <td className="px-4 py-3 font-mono text-xs text-[var(--primary)]">GL_STATIC_DRAW</td>
            <td className="px-4 py-3 text-[var(--text-muted)] text-xs">Data is set once, used many times. Good for static geometry like terrain or models.</td>
          </tr>
          <tr>
            <td className="px-4 py-3 font-mono text-xs text-[var(--primary)]">GL_DYNAMIC_DRAW</td>
            <td className="px-4 py-3 text-[var(--text-muted)] text-xs">Data is modified and used many times. Good for animated or procedural geometry.</td>
          </tr>
          <tr>
            <td className="px-4 py-3 font-mono text-xs text-[var(--primary)]">GL_STREAM_DRAW</td>
            <td className="px-4 py-3 text-[var(--text-muted)] text-xs">Data is set once, used a few times. Good for per-frame particle systems.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <Callout type="tip">
      These hints do not change the behavior of your program, they are just performance hints.
      The driver uses them to decide where in GPU memory to place the buffer. Getting them
      wrong will not break anything, but it may cause unnecessary memory transfers.
    </Callout>

    <H2>Telling OpenGL how to interpret the data</H2>

    <p>
      The VBO is just a blob of bytes on the GPU. OpenGL does not know that your bytes
      represent three floats per vertex. You need to tell it using{" "}
      <IC>glVertexAttribPointer</IC>.
    </p>

    <CodeBlock lang="cpp" filename="main.cpp">{`// Each vertex attribute is at index 0 (matches "layout (location = 0)" in GLSL)
// It has 3 components (x, y, z)
// Each component is a float (GL_FLOAT)
// Do not normalize the data (GL_FALSE)
// The stride: how many bytes to skip to get to the next vertex (3 floats = 12 bytes)
// The offset: where the attribute starts in the vertex (0 = starts at the beginning)
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);

// Enable the attribute at index 0 (attributes are disabled by default)
glEnableVertexAttribArray(0);`}</CodeBlock>

    <Callout type="warn">
      The first argument (0) must match the <IC>layout (location = 0)</IC> declaration in
      your vertex shader. If they do not match, the shader reads garbage data or nothing at all.
    </Callout>

    <H2>The full VBO setup in one place</H2>

    <CodeBlock lang="cpp" filename="main.cpp">{`// --- Setup (runs once, before the render loop) ---

float vertices[] = {
    -0.5f, -0.5f, 0.0f,
     0.5f, -0.5f, 0.0f,
     0.0f,  0.5f, 0.0f
};

unsigned int VBO;
glGenBuffers(1, &VBO);
glBindBuffer(GL_ARRAY_BUFFER, VBO);
glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);

glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
glEnableVertexAttribArray(0);

// --- Render loop ---
while (!glfwWindowShouldClose(window)) {
    glClear(GL_COLOR_BUFFER_BIT);

    glUseProgram(shaderProgram);
    glBindBuffer(GL_ARRAY_BUFFER, VBO);
    glDrawArrays(GL_TRIANGLES, 0, 3);  // draw 3 vertices as a triangle

    glfwSwapBuffers(window);
    glfwPollEvents();
}`}</CodeBlock>

    <H2>Why you should not stop here</H2>

    <p>
      The code above works, but it has a problem: every frame you need to rebind the VBO and
      re-specify the vertex attribute layout. For a single triangle this is fine, but for a
      real scene with hundreds of meshes it becomes expensive and repetitive.
    </p>
    <p>
      The next chapter introduces <strong className="text-white">Vertex Array Objects (VAOs)</strong>,
      which let you record all the VBO bindings and attribute specifications once, then replay
      them with a single bind call.
    </p>

  </article>
);