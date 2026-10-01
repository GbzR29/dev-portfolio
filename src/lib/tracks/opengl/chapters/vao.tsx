"use client";

// OpenGL track — "Vertex Array Objects": the gap between bytes and shader
// inputs; glVertexAttribPointer argument by argument and the address formula
// (worked example); the live layout editor (figure); interleaved vs separate
// layouts; normalized and integer attributes; what a VAO stores and what it
// does not, step by step (figure); does the order matter (VBO first or VAO
// first, and the one order that breaks); creating, using and drawing several
// meshes (makeMesh); a DSA preview; the code-along checkpoint (the whole
// main.cpp so far); common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { VertexLayoutFigure } from "@/components/lesson/figures/glintro/VertexLayoutFigure";
import { VaoRecordFigure } from "@/components/lesson/figures/glintro/VaoRecordFigure";

const r = String.raw;

export function VAOContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglVao_intro",
          "The VBO holds your vertices as raw bytes. The vertex shader asks for named, typed inputs: a vec3 aPos at location 0, a vec3 aColor at location 1. Something has to connect the two by saying where in the bytes each input's values are and how to read them. That description is the vertex layout, and the object that stores it is the Vertex Array Object (VAO). This chapter explains every number in the description, lets you break it on purpose to see what each one does, and shows exactly what a VAO remembers, so that drawing a mesh becomes a single bind.")}
      </Lead>

      <H2>{tx(t, "oglVao_inputsTitle", "From bytes to shader inputs")}</H2>
      <p>
        {tx(t, "oglVao_inputsBody",
          "Each input of the vertex shader declared with in is a vertex attribute, and layout(location = n) gives it a number, its location. For every vertex, the GPU's vertex fetch stage reads each enabled attribute's values from a buffer and hands them to the shader. Our triangle now carries a colour per vertex, so the shader has two attributes:")}
      </p>
      <CodeBlock lang="glsl" filename="vertex.glsl" t={t}>{`#version 460 core
layout (location = 0) in vec3 aPos;     // attribute 0: 3 floats
layout (location = 1) in vec3 aColor;   // attribute 1: 3 floats

out vec3 vColor;                        // passed on, interpolated (Pipeline chapter)

void main() {
    gl_Position = vec4(aPos, 1.0);
    vColor = aColor;
}`}</CodeBlock>
      <p>
        {tx(t, "oglVao_interleavedBody",
          "The buffer stores the vertices interleaved: all of vertex 0's data, then all of vertex 1's, and so on. Each vertex is x, y, z, r, g, b: 6 floats, 24 bytes.")}
      </p>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`float vertices[] = {
//    x      y     z      r     g     b
    -0.6f, -0.55f, 0.0f,  1.0f, 0.27f, 0.27f,   // vertex 0, bytes  0..23
     0.65f, -0.45f, 0.0f, 0.13f, 0.77f, 0.37f,  // vertex 1, bytes 24..47
     0.0f,  0.65f, 0.0f,  0.23f, 0.51f, 0.96f,  // vertex 2, bytes 48..71
};`}</CodeBlock>
      <Callout type="info" t={t}>
        {tx(t, "oglVao_changeNote", "Changed since the last chapter: the VBO chapter's vertices had 3 floats each (only a position, 12 bytes). From here on each vertex has 6 floats (position and colour, 24 bytes), so the array above replaces the old one, and the two shaders pass the colour along: the vertex shader reads aColor and hands it on as vColor, and the fragment shader uses vColor instead of the fixed orange (the First Shaders chapter explains in and out). If you are coding along, make both changes now; the checkpoint at the end of this chapter shows the whole file.")}
      </Callout>

      <H2>{tx(t, "oglVao_pointerTitle", "glVertexAttribPointer, argument by argument")}</H2>
      <p>{tx(t, "oglVao_pointerBody", "One call describes one attribute. For the position:")}</p>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`glVertexAttribPointer(
    0,                   // index: the shader's layout(location = 0)
    3,                   // size: 3 components (x, y, z)
    GL_FLOAT,            // type of each component in the buffer
    GL_FALSE,            // normalized: convert integers to 0..1? (not for floats)
    6 * sizeof(float),   // stride: 24 bytes from one vertex to the next
    (void*)0);           // offset of the first component, in bytes, as a pointer
glEnableVertexAttribArray(0);   // attributes are disabled until enabled`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "oglVao_tArg", "Argument"), tx(t, "oglVao_tMeaning", "Meaning")]}
        rows={[
          ["index", tx(t, "oglVao_a1", "the attribute location, matching layout(location = …) in the shader. Every GPU supports at least 16 (GL_MAX_VERTEX_ATTRIBS).")],
          ["size", tx(t, "oglVao_a2", "how many components per vertex, 1 to 4. If it is smaller than the shader's type, the missing components are filled with 0 for y and z and 1 for w.")],
          ["type", tx(t, "oglVao_a3", "how each component is stored in the buffer: GL_FLOAT (4 bytes), GL_UNSIGNED_BYTE (1), GL_SHORT (2), GL_INT (4), GL_HALF_FLOAT (2), and so on.")],
          ["normalized", tx(t, "oglVao_a4", "for integer types only: GL_TRUE maps the integer range to 0…1 (unsigned) or −1…1 (signed), so the byte 255 arrives as 1.0. GL_FALSE converts the number as is (255 becomes 255.0).")],
          ["stride", tx(t, "oglVao_a5", "bytes from the start of one vertex's value to the start of the next vertex's. 0 is a special value meaning \"tightly packed\": size × the type's size, as if nothing else were in between.")],
          ["pointer", tx(t, "oglVao_a6", "despite its type, a byte offset into the bound GL_ARRAY_BUFFER, where the first vertex's value starts. It is cast to void* for historical reasons: before buffers existed it really was a pointer into your memory.")],
        ]}
      />
      <p>
        {tx(t, "oglVao_formulaBody",
          "Together, these say exactly which bytes the GPU reads. For vertex number i, component k of an attribute is at:")}
      </p>
      <Equation label={tx(t, "oglVao_eqAddr", "Where the vertex fetcher reads")}
        where={[
          [r`\text{offset}`, tx(t, "oglVao_wOffset", "the last argument: where vertex 0's value starts, in bytes from the start of the buffer")],
          [r`i`, tx(t, "oglVao_wI", "the vertex number, 0 for the first vertex of the draw")],
          [r`\text{stride}`, tx(t, "oglVao_wStride", "the distance in bytes between consecutive vertices (size × type size if 0 was passed)")],
          [r`k`, tx(t, "oglVao_wK", "the component: 0 for x or r, 1 for y or g, 2 for z or b, 3 for w or a")],
          [r`s`, tx(t, "oglVao_wS", "the size in bytes of one component of the given type: 4 for GL_FLOAT")],
        ]}
        note={tx(t, "oglVao_eqAddrNote", "It is the array-indexing formula base + i · size from the Algorithms track, with the stride playing the role of the element size and the offset picking a field inside each element.")}>
        {r`\text{byte} = \text{offset} + i \cdot \text{stride} + k \cdot s`}
      </Equation>
      <p>
        {tx(t, "oglVao_worked",
          "Worked example. The colour attribute has offset 12 (it follows 3 position floats) and stride 24. The green component (k = 1) of vertex 2 is at 12 + 2 · 24 + 1 · 4 = 12 + 48 + 4 = 64, the 17th float (64 / 4 = 16, counting from 0), which is indeed 0.51 in the array. The x of vertex 1 (position offset 0, k = 0) is at 0 + 1 · 24 + 0 = 24, float number 6, which holds 0.65. Try a wrong stride of 12 and the same formula sends vertex 1's position to byte 12: the colour of vertex 0.")}
      </p>
      <p>
        {tx(t, "oglVao_figIntro",
          "The figure performs exactly this fetch for both attributes and renders what arrives. Start from the correct layout, then use the presets or the sliders to break it.")}
      </p>

      <VertexLayoutFigure t={t} />

      <H3>{tx(t, "oglVao_layoutsTitle", "Interleaved or separate")}</H3>
      <p>
        {tx(t, "oglVao_layoutsBody",
          "Interleaving is not the only option. The same data can be stored as all positions first and then all colours ([x y z x y z x y z][r g b r g b r g b]), in one buffer or in two. Then each attribute is tightly packed: stride 12 for both, offset 0 for the position and 36 (3 vertices × 12 bytes) for the colour. Both layouts are correct; they differ in speed and convenience.")}
      </p>
      <LessonTable
        headers={[tx(t, "oglVao_tLayout", "Layout"), tx(t, "oglVao_tGood", "Good for"), tx(t, "oglVao_tCost", "Cost")]}
        rows={[
          [tx(t, "oglVao_l1", "Interleaved: [xyzrgb][xyzrgb]…"), tx(t, "oglVao_l1b", "drawing: one vertex's attributes are neighbours in memory, so the fetch reads one contiguous chunk per vertex"), tx(t, "oglVao_l1c", "updating one attribute (say, only positions) touches the whole buffer")],
          [tx(t, "oglVao_l2", "Separate: [xyz xyz…][rgb rgb…]"), tx(t, "oglVao_l2b", "updating one attribute often (animated positions, fixed colours), and passes that need only positions, such as shadow maps"), tx(t, "oglVao_l2c", "one more stream to fetch per vertex")],
        ]}
      />
      <CodeBlock lang="cpp" filename="separate.cpp" t={t}>{`// [x y z] × 3, then [r g b] × 3 in the same buffer: each attribute tightly packed
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)(9 * sizeof(float)));  // byte 36`}</CodeBlock>

      <H3>{tx(t, "oglVao_compactTitle", "Smaller attributes: normalized bytes")}</H3>
      <p>
        {tx(t, "oglVao_compactBody",
          "A colour does not need 32-bit floats. Stored as four unsigned bytes (red, green, blue, alpha from 0 to 255) with normalized = GL_TRUE, it arrives in the shader as a vec4 of 0…1 values, exactly as if it had been floats. The vertex shrinks from 12 + 12 = 24 bytes to 12 + 4 = 16, a third less memory and bandwidth for the same picture. Integer data that must stay integer, such as bone indices for skeletal animation, uses glVertexAttribIPointer instead (note the I) and an int or ivec input in the shader.")}
      </p>
      <CodeBlock lang="cpp" filename="compact.cpp" t={t}>{`struct Vertex { float pos[3]; uint8_t rgba[4]; };             // 16 bytes
glVertexAttribPointer(0, 3, GL_FLOAT,         GL_FALSE, sizeof(Vertex), (void*)offsetof(Vertex, pos));
glVertexAttribPointer(1, 4, GL_UNSIGNED_BYTE, GL_TRUE,  sizeof(Vertex), (void*)offsetof(Vertex, rgba));
// 255 → 1.0, 128 → 0.502, 0 → 0.0 in the shader's vec4 aColor`}</CodeBlock>
      <Callout type="tip" t={t}>
        {tx(t, "oglVao_offsetofTip", "Describing a C++ struct with sizeof(Vertex) as the stride and offsetof(Vertex, field) as each offset keeps the numbers correct even if you add fields or the compiler inserts padding (the Algorithms track's memory chapter explains padding).")}
      </Callout>

      <H2>{tx(t, "oglVao_whatTitle", "What a VAO stores")}</H2>
      <p>
        {tx(t, "oglVao_whatBody",
          "All of these descriptions have to live somewhere, and that is the Vertex Array Object. While a VAO is bound, glVertexAttribPointer and glEnableVertexAttribArray write into it, and so does binding an element buffer. Later, binding the VAO again restores the whole layout in one call. Step through the setup and watch which calls change the VAO and which only change the context.")}
      </p>

      <VaoRecordFigure t={t} />

      <LessonTable
        headers={[tx(t, "oglVao_tStored", "Stored in the VAO"), tx(t, "oglVao_tNotStored", "Not stored in the VAO")]}
        rows={[
          [tx(t, "oglVao_st1", "per attribute: enabled or not, size, type, normalized, stride, offset"), tx(t, "oglVao_ns1", "the GL_ARRAY_BUFFER binding itself")],
          [tx(t, "oglVao_st2", "per attribute: the buffer bound to GL_ARRAY_BUFFER when glVertexAttribPointer ran"), tx(t, "oglVao_ns2", "the shader program (glUseProgram), uniforms and textures")],
          [tx(t, "oglVao_st3", "the GL_ELEMENT_ARRAY_BUFFER binding (the index buffer)"), tx(t, "oglVao_ns3", "the contents of the buffers: those live in the buffers, and the VAO only points at them")],
        ]}
      />
      <H2>{tx(t, "oglVao_orderTitle", "Does the order matter? VBO first or VAO first")}</H2>
      <p>
        {tx(t, "oglVao_orderBody",
          "Mostly no. Creating the VBO (glGenBuffers) and filling it (glBufferData) do not involve the VAO at all, so they can happen before or after the VAO is created. The order matters at exactly one moment: when you describe an attribute.")}
      </p>
      <Callout type="tip" t={t}>
        {tx(t, "oglVao_goldenRule2", "The rule: when glVertexAttribPointer runs, two things must be bound. (1) The VAO, because the description is written into it; glEnableVertexAttribArray needs it too. (2) The right VBO on GL_ARRAY_BUFFER, because the VAO records \"this attribute reads from the buffer bound right now\".")}
      </Callout>
      <p>
        {tx(t, "oglVao_orderBoth",
          "So both of these orders are correct and give the same result:")}
      </p>
      <CodeBlock lang="cpp" filename="order_vbo_first.cpp" t={t}>{`// A) VBO first, then VAO: correct
GLuint vbo;
glGenBuffers(1, &vbo);
glBindBuffer(GL_ARRAY_BUFFER, vbo);        // vbo is now bound to GL_ARRAY_BUFFER...
glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);

GLuint vao;
glGenVertexArrays(1, &vao);
glBindVertexArray(vao);                    // ...and binding a VAO does not unbind it
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)0);  // VAO ✓  VBO ✓
glEnableVertexAttribArray(0);`}</CodeBlock>
      <CodeBlock lang="cpp" filename="order_vao_first.cpp" t={t}>{`// B) VAO first, then VBO: correct (the usual way)
GLuint vao, vbo;
glGenVertexArrays(1, &vao);
glGenBuffers(1, &vbo);
glBindVertexArray(vao);                    // bind the VAO once; everything below is recorded in it
glBindBuffer(GL_ARRAY_BUFFER, vbo);
glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)0);  // VAO ✓  VBO ✓
glEnableVertexAttribArray(0);`}</CodeBlock>
      <p>
        {tx(t, "oglVao_orderWhyB",
          "Order A works because the GL_ARRAY_BUFFER binding belongs to the context, not to the VAO: binding the VAO leaves vbo bound. Most code, and this track, uses order B. It is not more correct; it is simply harder to get wrong, because once the VAO is bound at the top you no longer have to think about it.")}
      </p>
      <p>
        {tx(t, "oglVao_orderBroken", "What does break is describing the attribute before any VAO is bound:")}
      </p>
      <CodeBlock lang="cpp" filename="order_wrong.cpp" t={t}>{`// ✗ Wrong: the attribute is described while no VAO is bound
glBindBuffer(GL_ARRAY_BUFFER, vbo);
glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)0);  // GL_INVALID_OPERATION
glEnableVertexAttribArray(0);                                                  // GL_INVALID_OPERATION

glGenVertexArrays(1, &vao);
glBindVertexArray(vao);   // too late: this VAO is empty, and the draw shows nothing`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "oglVao_tStep", "Step"), tx(t, "oglVao_tNeedsVao", "Needs the VAO bound?"), tx(t, "oglVao_tNeedsVbo", "Needs the VBO bound?")]}
        rows={[
          ["glGenBuffers, glGenVertexArrays", tx(t, "oglVao_o1a", "no"), tx(t, "oglVao_o1b", "no")],
          ["glBufferData", tx(t, "oglVao_o2a", "no"), tx(t, "oglVao_o2b", "yes, on GL_ARRAY_BUFFER: it fills the bound buffer")],
          ["glVertexAttribPointer", tx(t, "oglVao_o3a", "yes: the description is stored in it"), tx(t, "oglVao_o3b", "yes: the VAO records which buffer this attribute reads")],
          ["glEnableVertexAttribArray", tx(t, "oglVao_o4a", "yes"), tx(t, "oglVao_o4b", "no")],
          ["glDrawArrays", tx(t, "oglVao_o5a", "yes: the VAO of the mesh you want to draw"), tx(t, "oglVao_o5b", "no: the VAO already knows its buffer")],
        ]}
      />

      <H2>{tx(t, "oglVao_useTitle", "Creating and using VAOs")}</H2>
      <p>
        {tx(t, "oglVao_useBody",
          "For our triangle, with both attributes, order B looks like this. It goes in main, after the shaders are compiled and before the render loop (step 4 of the file).")}
      </p>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`GLuint vao, vbo;
glGenVertexArrays(1, &vao);
glGenBuffers(1, &vbo);

glBindVertexArray(vao);                       // start recording into vao
glBindBuffer(GL_ARRAY_BUFFER, vbo);
glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)0);
glEnableVertexAttribArray(0);
glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)(3 * sizeof(float)));
glEnableVertexAttribArray(1);
glBindVertexArray(0);                         // done; unbinding protects it from later calls`}</CodeBlock>
      <p>
        {tx(t, "oglVao_manyBody",
          "A program usually has one VAO per mesh, each with its own buffers and layout. Drawing then becomes: pick the shader, bind the mesh's VAO, draw. Switching meshes is one bind instead of re-describing every attribute.")}
      </p>
      <p>
        {tx(t, "oglVao_manyHow",
          "To build several meshes without copying the block above each time, wrap it in a function. It takes the vertex data and its size in bytes, and returns a VAO that is ready to draw. The size is passed in because, inside the function, data is only a pointer and sizeof(data) would be 8 (the trap from the VBO chapter).")}
      </p>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`// Above main: the setup block as a function. Vertices are x y z r g b.
GLuint makeMesh(const float* data, GLsizeiptr bytes, GLuint* vboOut) {
    GLuint vao, vbo;
    glGenVertexArrays(1, &vao);
    glGenBuffers(1, &vbo);
    glBindVertexArray(vao);
    glBindBuffer(GL_ARRAY_BUFFER, vbo);
    glBufferData(GL_ARRAY_BUFFER, bytes, data, GL_STATIC_DRAW);
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)0);
    glEnableVertexAttribArray(0);
    glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)(3 * sizeof(float)));
    glEnableVertexAttribArray(1);
    glBindVertexArray(0);
    *vboOut = vbo;          // the caller keeps the VBO's name to delete it later
    return vao;
}

// In main, step 4: two meshes, two VAOs
float triangleVertices[] = {   // 3 vertices
    -0.9f, -0.5f, 0.0f,  1.0f, 0.27f, 0.27f,
    -0.1f, -0.5f, 0.0f,  0.13f, 0.77f, 0.37f,
    -0.5f,  0.5f, 0.0f,  0.23f, 0.51f, 0.96f,
};
float quadVertices[] = {       // a square = 2 triangles = 6 vertices
     0.1f, -0.5f, 0.0f,  1.0f, 0.8f, 0.2f,
     0.9f, -0.5f, 0.0f,  1.0f, 0.8f, 0.2f,
     0.9f,  0.3f, 0.0f,  1.0f, 0.8f, 0.2f,
     0.1f, -0.5f, 0.0f,  1.0f, 0.8f, 0.2f,
     0.9f,  0.3f, 0.0f,  1.0f, 0.8f, 0.2f,
     0.1f,  0.3f, 0.0f,  1.0f, 0.8f, 0.2f,
};
GLuint triangleVbo, quadVbo;
GLuint triangleVao = makeMesh(triangleVertices, sizeof(triangleVertices), &triangleVbo);
GLuint quadVao     = makeMesh(quadVertices,     sizeof(quadVertices),     &quadVbo);`}</CodeBlock>
      <p>
        {tx(t, "oglVao_manyLoop",
          "Here sizeof works, because triangleVertices and quadVertices are real arrays in main: 18 floats are 72 bytes, 36 floats are 144. The render loop then draws each mesh with one bind:")}
      </p>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`while (!glfwWindowShouldClose(window)) {
    glClear(GL_COLOR_BUFFER_BIT);
    glUseProgram(shaderProgram);

    glBindVertexArray(triangleVao);           // layout + buffer of mesh 1
    glDrawArrays(GL_TRIANGLES, 0, 3);         // its 3 vertices

    glBindVertexArray(quadVao);               // layout + buffer of mesh 2
    glDrawArrays(GL_TRIANGLES, 0, 6);         // its 6 vertices

    glfwSwapBuffers(window);
    glfwPollEvents();
}

// After the loop: the VAOs, then the buffers
glDeleteVertexArrays(1, &triangleVao);
glDeleteVertexArrays(1, &quadVao);
glDeleteBuffers(1, &triangleVbo);
glDeleteBuffers(1, &quadVbo);`}</CodeBlock>
      <p>
        {tx(t, "oglVao_manyNote",
          "This is only to show the pattern. Our code-along program keeps one triangle and the plain variable names vao and vbo, as in the checkpoint below. The quad comes back in the EBO chapter, where it needs only 4 vertices instead of 6.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "oglVao_dsaNote", "OpenGL 4.5's Direct State Access splits the same information more cleanly: glVertexArrayAttribFormat describes an attribute's format, glVertexArrayVertexBuffer attaches a buffer with its stride, and nothing has to be bound while you set it up. The DSA chapter rewrites this setup that way.")}
      </Callout>

      <H2>{tx(t, "oglVao_soFarTitle", "Your main.cpp so far")}</H2>
      <p>
        {tx(t, "oglVao_soFarBody",
          "The whole file at the end of this chapter, to compare with yours. Compared with the VBO chapter's version, three things changed, each marked NEW: the shaders pass a colour along, the vertices have 6 floats, and step 4b now creates the VAO first (order B) and describes both attributes. If you kept the VBO first (order A), your file is also correct, as long as the VAO is bound before glVertexAttribPointer.")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp" t={t}>{`#include <glad/glad.h>      // MUST come before glfw3.h
#include <GLFW/glfw3.h>
#include <iostream>

// ── Shaders ─────────────────────────────────── NEW: the colour is passed along
const char* vertexShaderSource = R"(#version 460 core
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aColor;
out vec3 vColor;
void main() {
    gl_Position = vec4(aPos, 1.0);
    vColor = aColor;
})";

const char* fragmentShaderSource = R"(#version 460 core
in vec3 vColor;
out vec4 FragColor;
void main() {
    FragColor = vec4(vColor, 1.0);
})";

void framebufferSizeCallback(GLFWwindow*, int width, int height) {
    glViewport(0, 0, width, height);
}

int main() {
    // ── 1. Window library and context ────────────────────────────────────────
    if (!glfwInit()) return 1;
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 4);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 6);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
    GLFWwindow* window = glfwCreateWindow(1280, 720, "GLApp", nullptr, nullptr);
    if (!window) { glfwTerminate(); return 1; }
    glfwMakeContextCurrent(window);
    glfwSwapInterval(1);

    // ── 2. Load the OpenGL functions (no gl* call before this) ───────────────
    if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)) return 1;

    // ── 3. Viewport, now and on every resize ─────────────────────────────────
    int fbw, fbh;
    glfwGetFramebufferSize(window, &fbw, &fbh);
    glViewport(0, 0, fbw, fbh);
    glfwSetFramebufferSizeCallback(window, framebufferSizeCallback);

    // ── 4. One-time setup ────────────────────────────────────────────────────
    // 4a. Shaders → program (unchanged)
    GLint success;
    char infoLog[512];

    GLuint vertexShader = glCreateShader(GL_VERTEX_SHADER);
    glShaderSource(vertexShader, 1, &vertexShaderSource, NULL);
    glCompileShader(vertexShader);
    glGetShaderiv(vertexShader, GL_COMPILE_STATUS, &success);
    if (!success) {
        glGetShaderInfoLog(vertexShader, 512, NULL, infoLog);
        std::cerr << "Vertex shader error: " << infoLog << "\\n";
    }

    GLuint fragmentShader = glCreateShader(GL_FRAGMENT_SHADER);
    glShaderSource(fragmentShader, 1, &fragmentShaderSource, NULL);
    glCompileShader(fragmentShader);
    glGetShaderiv(fragmentShader, GL_COMPILE_STATUS, &success);
    if (!success) {
        glGetShaderInfoLog(fragmentShader, 512, NULL, infoLog);
        std::cerr << "Fragment shader error: " << infoLog << "\\n";
    }

    GLuint shaderProgram = glCreateProgram();
    glAttachShader(shaderProgram, vertexShader);
    glAttachShader(shaderProgram, fragmentShader);
    glLinkProgram(shaderProgram);
    glGetProgramiv(shaderProgram, GL_LINK_STATUS, &success);
    if (!success) {
        glGetProgramInfoLog(shaderProgram, 512, NULL, infoLog);
        std::cerr << "Program link error: " << infoLog << "\\n";
    }
    glDeleteShader(vertexShader);
    glDeleteShader(fragmentShader);

    // 4b. Vertex data → VAO + VBO                   >>> NEW in this chapter
    float vertices[] = {
    //    x      y      z     r     g     b
        -0.6f, -0.55f, 0.0f, 1.0f, 0.27f, 0.27f,   // vertex 0
         0.65f,-0.45f, 0.0f, 0.13f,0.77f, 0.37f,   // vertex 1
         0.0f,  0.65f, 0.0f, 0.23f,0.51f, 0.96f,   // vertex 2
    };
    GLuint vao, vbo;
    glGenVertexArrays(1, &vao);
    glGenBuffers(1, &vbo);

    glBindVertexArray(vao);                         // from here on, recorded in vao
    glBindBuffer(GL_ARRAY_BUFFER, vbo);
    glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
    // attribute 0 = aPos: 3 floats, stride 24 bytes, starts at byte 0
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)0);
    glEnableVertexAttribArray(0);
    // attribute 1 = aColor: 3 floats, stride 24 bytes, starts at byte 12
    glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)(3 * sizeof(float)));
    glEnableVertexAttribArray(1);
    glBindVertexArray(0);                           // done recording
    //                                               <<< end of NEW

    // ── 5. The render loop ───────────────────────────────────────────────────
    while (!glfwWindowShouldClose(window)) {
        if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
            glfwSetWindowShouldClose(window, true);

        glClearColor(0.06f, 0.07f, 0.10f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

        // ... draw (Drawing the Triangle chapter) ...

        glfwSwapBuffers(window);
        glfwPollEvents();
    }

    // ── 6. Clean up ──────────────────────────────────────────────────────────
    glDeleteVertexArrays(1, &vao);                  // NEW: free the VAO
    glDeleteBuffers(1, &vbo);
    glDeleteProgram(shaderProgram);
    glfwTerminate();
    return 0;
}`}</CodeBlock>
      <p>
        {tx(t, "oglVao_soFarRun",
          "Run it: still only the clear colour, and that is correct. Everything the triangle needs is now on the GPU: the program, the bytes and their description. What is missing is the order to draw, inside the loop.")}
      </p>
      <Callout type="tip" t={t}>
        {tx(t, "oglVao_peekTip", "Want to see it already? Replace the // ... draw ... line in the loop with these three lines: glUseProgram(shaderProgram); glBindVertexArray(vao); glDrawArrays(GL_TRIANGLES, 0, 3);. The coloured triangle appears. The First Shaders chapter explains the shaders in detail, and Drawing the Triangle explains these three lines and shows the finished program, the same steps with the shader code moved into helper functions.")}
      </Callout>

      <H2>{tx(t, "oglVao_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "oglVao_tMistake", "Mistake"), tx(t, "oglVao_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "oglVao_e1", "No VAO bound in a Core context"), tx(t, "oglVao_e1b", "glVertexAttribPointer, glEnableVertexAttribArray and glDrawArrays fail with GL_INVALID_OPERATION; the screen stays empty. Create and bind a VAO first.")],
          [tx(t, "oglVao_e2", "Stride of one attribute instead of the whole vertex"), tx(t, "oglVao_e2b", "with interleaved data, every attribute's stride is the full vertex size (24 here). Using 12 reads the colours as positions.")],
          [tx(t, "oglVao_e3", "Stride 0 with interleaved data"), tx(t, "oglVao_e3b", "0 means tightly packed (size × type size), not \"none\". Pass the real vertex size.")],
          [tx(t, "oglVao_e4", "Offset as a number of floats"), tx(t, "oglVao_e4b", "offsets are in bytes: the colour after 3 floats starts at (void*)(3 * sizeof(float)), not (void*)3.")],
          [tx(t, "oglVao_e5", "Forgetting glEnableVertexAttribArray"), tx(t, "oglVao_e5b", "the attribute is not read; the shader gets a constant (usually 0, 0, 0, 1). Enable every attribute you describe.")],
          [tx(t, "oglVao_e6", "Index not matching the shader's location"), tx(t, "oglVao_e6b", "the data goes to a location the shader does not read, and the shader's input gets the constant. Keep the numbers in one place, or query glGetAttribLocation.")],
          [tx(t, "oglVao_e7", "Wrong VBO bound at glVertexAttribPointer"), tx(t, "oglVao_e7b", "the attribute reads a different buffer forever. Bind the VBO right before describing the attributes that use it.")],
          [tx(t, "oglVao_e8", "Leaving a VAO bound after setup"), tx(t, "oglVao_e8b", "later code that binds an element buffer or describes attributes silently changes this mesh. Unbind with glBindVertexArray(0) when done.")],
        ]}
      />

      <KeyIdeas t={t} id="oglVao" items={[
        "Vertex attributes are the shader's in variables; their locations connect them to buffer data.",
        "glVertexAttribPointer(index, size, type, normalized, stride, offset) describes one attribute; glEnableVertexAttribArray switches it on.",
        "Component k of vertex i is read at byte offset + i · stride + k · (type size); stride 0 means tightly packed.",
        "Interleaved layouts use the whole vertex size as every attribute's stride; separate layouts use each attribute's own size and a larger offset.",
        "Normalized integer types (colours as 4 bytes) and glVertexAttribIPointer (true integers) save memory and bandwidth.",
        "A VAO stores each attribute's format, enabled state and source buffer, plus the element buffer binding, but not the GL_ARRAY_BUFFER binding, the program or textures.",
        "The buffer an attribute reads is captured when glVertexAttribPointer runs, with the VAO bound.",
        "One VAO per mesh turns drawing into: use program, bind VAO, draw.",
      ]} />
    </Article>
  );
}
