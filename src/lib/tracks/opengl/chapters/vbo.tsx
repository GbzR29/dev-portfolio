"use client";

// OpenGL track — "Vertex Buffer Objects": where vertex data lives (RAM, VRAM,
// the PCIe bus, integrated GPUs; bandwidth figure); a vertex array as bytes
// (sizeof, IEEE-754, little-endian; figure with the sizeof-pointer bug);
// creating a VBO (gen, bind, glBufferData with every argument explained);
// GLuint and the other GL types (why not unsigned int);
// usage hints (frequency × access); updating (glBufferSubData, orphaning with
// nullptr); lifetime and deletion; worked examples; the attribute description
// and why nothing draws without a VAO; the code-along checkpoint (the whole
// main.cpp so far); common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { UploadFigure } from "@/components/lesson/figures/glintro/UploadFigure";
import { FloatBytesFigure } from "@/components/lesson/figures/glintro/FloatBytesFigure";

export function VBOContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglVbo_intro",
          "The pipeline starts with vertex data, and so far that data is a C++ array in your program's memory. The vertex shader cannot read a C++ array: it runs on the GPU and reads from buffer objects, blocks of memory that OpenGL manages and places wherever the GPU reads them fastest. A Vertex Buffer Object (VBO) is a buffer object that holds vertex data. This chapter explains why the data has to move, what exactly gets copied, how to create, fill, update and delete a VBO, and why a VBO on its own still does not draw anything.")}
      </Lead>

      <Goals t={t} id="oglVbo" items={[
        "Put vertex data in GPU memory with a vertex buffer.",
        "Count the bytes you upload.",
        "Choose a usage hint, and update or delete a buffer.",
      ]} />

      <H2>{tx(t, "oglVbo_whereTitle", "Where vertex data lives")}</H2>
      <p>
        {tx(t, "oglVbo_whereBody",
          "A computer with a discrete graphics card has two separate memories. System RAM belongs to the CPU; your arrays, vectors and objects live there. The graphics card has its own memory, VRAM (video RAM), soldered next to the GPU and built for enormous bandwidth: the GPU can read it at hundreds of gigabytes per second, because thousands of shader cores read vertices and textures in parallel. The two are connected by the PCIe bus, which is fast by everyday standards but more than ten times slower than VRAM. An integrated GPU, built into the processor, has no VRAM: it reads system RAM directly, sharing it and its bandwidth with the CPU.")}
      </p>
      <p>
        {tx(t, "oglVbo_whereAfter",
          "So the question is not only how to hand the GPU your vertices, but where they should sit while it reads them every frame. Choose a location and a data size in the figure and compare the cost of reading the data once per frame.")}
      </p>

      <UploadFigure t={t} />

      <p>
        {tx(t, "oglVbo_whereConclusion",
          "This is what a VBO is for. You copy the data into a buffer object once, the driver places it in VRAM (or wherever this GPU reads it fastest), and from then on every frame's draw call reads it from there without the CPU touching it. The copy crosses the bus once; the reads never do.")}
      </p>

      <H2>{tx(t, "oglVbo_bytesTitle", "What gets copied: bytes")}</H2>
      <p>
        {tx(t, "oglVbo_bytesBody",
          "A buffer object stores bytes and nothing else: it has no idea that they are floats, or which ones make up a vertex. Our triangle's array holds 9 floats (3 vertices × 3 coordinates), each 4 bytes, so it is 36 bytes long, and those 36 bytes are exactly what the upload copies. sizeof(vertices) gives that size in bytes for a real array. The figure shows the array as the bytes the buffer receives, and the most common mistake with sizeof.")}
      </p>

      <FloatBytesFigure t={t} />

      <H2>{tx(t, "oglVbo_createTitle", "Creating a VBO, step by step")}</H2>
      <H3>{tx(t, "oglVbo_s1Title", "1. Create a buffer object")}</H3>
      <p>
        {tx(t, "oglVbo_s1Body",
          "glGenBuffers(n, names) creates n buffer object names and writes them into the array you pass. A name is a GLuint, a plain number such as 1; the buffer does not get any storage yet.")}
      </p>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`GLuint vbo;
glGenBuffers(1, &vbo);   // one new buffer name, written into vbo`}</CodeBlock>

      <H3>{tx(t, "oglVbo_glTypesTitle", "Why GLuint and not unsigned int")}</H3>
      <p>
        {tx(t, "oglVbo_glTypesBody",
          "GLuint is not a new kind of number. The OpenGL header defines it with typedef, and on every desktop platform it is exactly unsigned int. So GLuint vbo; and unsigned int vbo; compile to the same thing.")}
      </p>
      <p>
        {tx(t, "oglVbo_glTypesWhy",
          "The difference is a guarantee. The C++ standard only promises that an unsigned int has at least 16 bits; the real size is up to the compiler. The OpenGL specification promises that a GLuint has exactly 32 bits on every platform. The GL types exist so that every number you pass has the size the driver expects. The same family covers the other arguments you will meet:")}
      </p>
      <LessonTable
        headers={[tx(t, "oglVbo_tGlType", "GL type"), tx(t, "oglVbo_tCppType", "On desktop"), tx(t, "oglVbo_tSize", "Size"), tx(t, "oglVbo_tUsedFor", "Used for")]}
        rows={[
          ["GLuint", "unsigned int", "32 bits", tx(t, "oglVbo_gt1", "object names (buffers, shaders, textures) and unsigned index values (GL_UNSIGNED_INT)")],
          ["GLint", "int", "32 bits", tx(t, "oglVbo_gt2", "signed values, such as a uniform location (−1 means \"not found\") or a status read with glGet*iv")],
          ["GLsizei", "int", "32 bits", tx(t, "oglVbo_gt3", "counts, such as the n of glGenBuffers or the vertex count of glDrawArrays; never negative")],
          ["GLenum", "unsigned int", "32 bits", tx(t, "oglVbo_gt4", "named constants: GL_ARRAY_BUFFER, GL_TRIANGLES, GL_FLOAT")],
          ["GLfloat", "float", "32 bits", tx(t, "oglVbo_gt5", "floating-point values, as in glClearColor or glUniform1f")],
          ["GLboolean", "unsigned char", "8 bits", tx(t, "oglVbo_gt6", "GL_TRUE or GL_FALSE, such as the normalized argument of glVertexAttribPointer")],
          ["GLsizeiptr", "ptrdiff_t", tx(t, "oglVbo_gt7s", "64 bits on a 64-bit program"), tx(t, "oglVbo_gt7", "sizes in bytes of buffers, as in glBufferData; as wide as a pointer, so a buffer can be larger than 4 GB")],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "oglVbo_glTypesTip", "Which one to write: use the GL types in code that talks to OpenGL. GLuint vbo tells the reader \"this number is an OpenGL name\"; unsigned int vbo could be any count. It also keeps the C++ type next to its matching enum: an index array of GLuint goes with GL_UNSIGNED_INT, one of GLushort with GL_UNSIGNED_SHORT (EBO chapter). For your own maths and logic, ordinary C++ types are fine. Many tutorials, LearnOpenGL included, write unsigned int: the program behaves the same, so do not let it confuse you.")}
      </Callout>

      <H3>{tx(t, "oglVbo_s2Title", "2. Bind it")}</H3>
      <p>
        {tx(t, "oglVbo_s2Body",
          "As the setup chapter showed, OpenGL is a state machine: calls act on whatever is bound. glBindBuffer(GL_ARRAY_BUFFER, vbo) makes vbo the current vertex buffer. GL_ARRAY_BUFFER is the bind point (target) for vertex data; the same buffer object could also be bound to other targets, such as GL_ELEMENT_ARRAY_BUFFER for indices (EBO chapter), because the target describes how it is being used, not what it is.")}
      </p>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`glBindBuffer(GL_ARRAY_BUFFER, vbo);`}</CodeBlock>

      <H3>{tx(t, "oglVbo_s3Title", "3. Allocate and fill it")}</H3>
      <p>
        {tx(t, "oglVbo_s3Body",
          "glBufferData allocates storage for the bound buffer and copies your data into it. When it returns, the copy is made: your array can change or be freed without affecting the buffer.")}
      </p>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`float vertices[] = {
    -0.5f, -0.5f, 0.0f,    // vertex 0
     0.5f, -0.5f, 0.0f,    // vertex 1
     0.0f,  0.5f, 0.0f,    // vertex 2
};

glBufferData(GL_ARRAY_BUFFER,     // target: the buffer bound there
             sizeof(vertices),    // size in BYTES: 36
             vertices,            // where to copy from (nullptr = allocate only)
             GL_STATIC_DRAW);     // usage hint`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "oglVbo_tArg", "Argument"), tx(t, "oglVbo_tMeaning", "Meaning")]}
        rows={[
          ["target", tx(t, "oglVbo_a1", "which bind point's buffer to fill. The call never names the buffer itself; it uses whatever is bound to this target.")],
          ["size", tx(t, "oglVbo_a2", "the number of bytes to allocate, of type GLsizeiptr. Bytes, not floats and not vertices: 9 floats are 36 bytes.")],
          ["data", tx(t, "oglVbo_a3", "a pointer to the bytes to copy. nullptr allocates the storage without filling it, to be filled later.")],
          ["usage", tx(t, "oglVbo_a4", "a hint about how the data will be used, so the driver can choose where to place it (next section).")],
        ]}
      />
      <Callout type="warn" t={t}>
        {tx(t, "oglVbo_vectorWarn", "With std::vector<float> v, sizeof(v) is the size of the vector object itself (typically 24 bytes: three pointers), not of its contents. Use v.size() * sizeof(float) for the size and v.data() for the pointer. The same trap hits arrays passed to a function, which arrive as pointers: sizeof then gives 8.")}
      </Callout>

      <H2>{tx(t, "oglVbo_usageTitle", "Usage hints")}</H2>
      <p>
        {tx(t, "oglVbo_usageBody",
          "The usage argument combines two words. The first says how often the contents will change: STATIC (set once, used many times), DYNAMIC (changed repeatedly, used many times) or STREAM (set once, used only a few times, then replaced). The second says who reads the data: DRAW (the GPU reads it to draw, the usual case), READ (the application reads it back) or COPY (the GPU reads it to write into other GPU buffers). Vertex data is almost always one of the three below.")}
      </p>
      <LessonTable
        headers={[tx(t, "oglVbo_tHint", "Hint"), tx(t, "oglVbo_tWhen", "When to use")]}
        rows={[
          ["GL_STATIC_DRAW", tx(t, "oglVbo_h1", "uploaded once, drawn many times: level geometry, character models, anything loaded from a file")],
          ["GL_DYNAMIC_DRAW", tx(t, "oglVbo_h2", "changed now and then and drawn many times in between: a deformable mesh, a UI whose layout changes")],
          ["GL_STREAM_DRAW", tx(t, "oglVbo_h3", "rewritten every frame and drawn once or twice: particles, debug lines, text generated each frame")],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "oglVbo_usageTip", "Hints never change what your program does, only how fast it may run. A wrong hint is not an error; at worst the driver places the buffer somewhere slower to update or slower to read. Drivers also watch how a buffer is actually used and may move it.")}
      </Callout>

      <H2>{tx(t, "oglVbo_updateTitle", "Updating and deleting")}</H2>
      <p>
        {tx(t, "oglVbo_updateBody",
          "glBufferData always allocates new storage, discarding the old. To change some bytes of an existing buffer without reallocating, use glBufferSubData(target, offset, size, data), which overwrites size bytes starting at byte offset. The offset and size must stay inside the buffer. Calling glBufferData with the same size and nullptr before rewriting everything is a known trick called orphaning: the driver can hand you fresh memory while the GPU keeps reading the old contents for frames still in flight, instead of waiting for it. The Buffer Data chapter covers these and mapping in depth.")}
      </p>
      <CodeBlock lang="cpp" filename="update.cpp" t={t}>{`// Move vertex 2 up: its y is float number 7, at byte offset 7 * 4 = 28.
float newY = 0.8f;
glBindBuffer(GL_ARRAY_BUFFER, vbo);
glBufferSubData(GL_ARRAY_BUFFER, 7 * sizeof(float), sizeof(float), &newY);

// When the buffer is no longer needed (for example at shutdown):
glDeleteBuffers(1, &vbo);   // frees the GPU storage; the name 0 is ignored`}</CodeBlock>

      <H2>{tx(t, "oglVbo_workedTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "oglVbo_w1",
          "1. A model with 10 000 vertices, each with a position (3 floats), a normal (3 floats) and a texture coordinate (2 floats): 8 floats × 4 bytes = 32 bytes per vertex, 10 000 × 32 = 320 000 bytes, about 312.5 KiB (320 000 / 1024). Uploading it once over a PCIe bus at about 25 GB/s takes 320 000 / 25 000 000 000 s ≈ 0.0000128 s, 12.8 microseconds.")}
      </p>
      <p>
        {tx(t, "oglVbo_w2",
          "2. A large scene with 100 MB of vertex data. Read from VRAM at about 450 GB/s, one pass over it takes 0.1 / 450 s ≈ 0.22 ms. Read over PCIe from system RAM at about 25 GB/s, it takes 0.1 / 25 s = 4 ms, a quarter of a 60 fps frame spent only moving vertices. That difference is why data that does not change belongs in a VBO with GL_STATIC_DRAW.")}
      </p>
      <p>
        {tx(t, "oglVbo_w3",
          "3. Where is vertex 1's z in our triangle's buffer? Each vertex is 3 floats = 12 bytes, so vertex 1 starts at byte 12; z is its third float, 2 × 4 = 8 bytes further, at byte 20. glBufferSubData(GL_ARRAY_BUFFER, 20, 4, &z) would change exactly that value.")}
      </p>

      <H2>{tx(t, "oglVbo_describeTitle", "Bytes still need a description")}</H2>
      <p>
        {tx(t, "oglVbo_describeBody",
          "The buffer now holds 36 bytes, but the vertex shader asks for a vec3 called aPos at location 0. Someone has to say that location 0 takes 3 floats per vertex, starting at byte 0, with 12 bytes from one vertex to the next. That is glVertexAttribPointer. In a Core profile context that description has to be stored in a Vertex Array Object, and without one bound both the description and the draw call fail with GL_INVALID_OPERATION: the only symptom is an empty screen. (Compatibility contexts have a built-in default VAO, which is why many older tutorials skip it.) The next chapter builds the VAO and explains every argument of glVertexAttribPointer.")}
      </p>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`GLuint vbo;
glGenBuffers(1, &vbo);
glBindBuffer(GL_ARRAY_BUFFER, vbo);
glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
// Next chapter: create and bind a VAO, then
// glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
// glEnableVertexAttribArray(0);`}</CodeBlock>

      <H2>{tx(t, "oglVbo_soFarTitle", "Your main.cpp so far")}</H2>
      <p>
        {tx(t, "oglVbo_soFarBody",
          "If you are coding along, this is the whole file at the end of this chapter. It is the Window & Context file, plus the shaders from the Graphics Pipeline chapter, plus this chapter's VBO. The parts marked NEW are the ones this chapter adds. Compare it with yours line by line.")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp" t={t}>{`#include <glad/glad.h>      // MUST come before glfw3.h
#include <GLFW/glfw3.h>
#include <iostream>

// ── Shaders (Graphics Pipeline chapter) ──────────────────────────────────────
const char* vertexShaderSource = R"(#version 460 core
layout (location = 0) in vec3 aPos;
void main() {
    gl_Position = vec4(aPos, 1.0);
})";

const char* fragmentShaderSource = R"(#version 460 core
out vec4 FragColor;
void main() {
    FragColor = vec4(1.0, 0.5, 0.2, 1.0);
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
    // 4a. Shaders → program (Graphics Pipeline chapter)
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

    // 4b. Vertex data → VBO                         >>> NEW in this chapter
    float vertices[] = {
        -0.5f, -0.5f, 0.0f,    // vertex 0
         0.5f, -0.5f, 0.0f,    // vertex 1
         0.0f,  0.5f, 0.0f,    // vertex 2
    };
    GLuint vbo;
    glGenBuffers(1, &vbo);
    glBindBuffer(GL_ARRAY_BUFFER, vbo);
    glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
    //                                               <<< end of NEW

    // 4c. Next chapter: the VAO, which describes these bytes

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
    glDeleteBuffers(1, &vbo);                        // NEW: free the VBO
    glDeleteProgram(shaderProgram);
    glfwTerminate();
    return 0;
}`}</CodeBlock>
      <p>
        {tx(t, "oglVbo_soFarRun",
          "Run it: the window looks exactly as before. That is correct. The triangle's 36 bytes are now in GPU memory, but nothing reads them yet. The next chapter adds the VAO, which tells the GPU how to read them, in step 4c. Creating the VBO before the VAO, as here, is fine: the next chapter shows the one moment where the order does matter.")}
      </p>

      <H2>{tx(t, "oglVbo_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "oglVbo_tMistake", "Mistake"), tx(t, "oglVbo_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "oglVbo_e1", "sizeof on a pointer or a std::vector"), tx(t, "oglVbo_e1b", "8 or 24 bytes are uploaded instead of the data; the draw reads past the end. Compute count × sizeof(element).")],
          [tx(t, "oglVbo_e2", "Passing a vertex count or float count as the size"), tx(t, "oglVbo_e2b", "the size is in bytes: 3 vertices of 3 floats are 36 bytes, not 3 or 9.")],
          [tx(t, "oglVbo_e3", "glBufferData with no buffer bound"), tx(t, "oglVbo_e3b", "GL_INVALID_OPERATION, nothing is uploaded. Bind the buffer to the target first.")],
          [tx(t, "oglVbo_e4", "Calling glBufferData every frame to update"), tx(t, "oglVbo_e4b", "it reallocates each time. Allocate once and update with glBufferSubData (or orphan deliberately, knowing why).")],
          [tx(t, "oglVbo_e5", "Writing past the end with glBufferSubData"), tx(t, "oglVbo_e5b", "offset + size larger than the buffer raises GL_INVALID_VALUE and writes nothing.")],
          [tx(t, "oglVbo_e6", "Expecting a change to the C++ array to reach the GPU"), tx(t, "oglVbo_e6b", "glBufferData made a copy. Upload the change again.")],
          [tx(t, "oglVbo_e7", "Creating buffers before the context exists"), tx(t, "oglVbo_e7b", "the functions are not loaded yet and the call crashes. Create GL objects only after the window, the current context and GLAD.")],
        ]}
      />

      <KeyIdeas t={t} id="oglVbo" items={[
        "The GPU reads vertex data fastest from its own memory (VRAM); the PCIe bus between system RAM and the GPU is more than ten times slower.",
        "A VBO is a buffer object holding vertex data; uploading it once lets every frame read it without the CPU.",
        "A buffer stores only bytes: 3 vertices × 3 floats × 4 bytes = 36 bytes, and it does not know what they mean.",
        "Create with glGenBuffers, bind to GL_ARRAY_BUFFER, allocate and copy with glBufferData(target, size in bytes, data, usage).",
        "Usage hints (STATIC, DYNAMIC, STREAM × DRAW, READ, COPY) guide placement but never change behaviour.",
        "glBufferSubData changes part of a buffer without reallocating; glDeleteBuffers frees it.",
        "The layout of the bytes is described with glVertexAttribPointer, stored in a VAO; in Core nothing draws without one.",
        "GLuint is OpenGL's unsigned int with a guaranteed 32 bits; use the GL types (GLuint, GLint, GLsizei, GLenum…) where code talks to OpenGL.",
      ]} />
    </Article>
  );
}
