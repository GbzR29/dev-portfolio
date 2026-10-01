"use client";

// OpenGL track — "Indexed Drawing (EBO)": the duplication problem (quad, cube,
// and when vertices cannot be shared); index buffers and how the GPU follows
// them (figure); creating the EBO inside the VAO; glDrawElements argument by
// argument, drawing part of a list; index types; memory worked example; the
// post-transform vertex cache; wireframe; the code-along checkpoint (the
// coloured square, the whole main.cpp so far); common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { IndexedGridFigure } from "@/components/lesson/figures/glintro/IndexedGridFigure";

export function EBOContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglEbo_intro",
          "Real meshes are made of triangles that share corners: in a grid every inner point belongs to six triangles. glDrawArrays reads vertices strictly in order, three per triangle, so every shared corner has to be stored again for each triangle that uses it. An Element Buffer Object (EBO), also called an index buffer, fixes this: each unique vertex is stored once, and a separate list of small integers says which three vertices form each triangle. This chapter shows how the GPU follows that list, how much memory it saves, and the few rules that make it work.")}
      </Lead>

      <H2>{tx(t, "oglEbo_dupTitle", "The duplication problem")}</H2>
      <p>
        {tx(t, "oglEbo_dupBody",
          "A rectangle (a quad) has four corners, but GL_TRIANGLES draws it as two triangles of three vertices each: six vertices, two of them copies.")}
      </p>
      <CodeBlock lang="cpp" filename="no_ebo.cpp" t={t}>{`// Without an index buffer: 6 vertices, only 4 different ones
float vertices[] = {
    -0.5f,  0.5f, 0.0f,   // top-left
    -0.5f, -0.5f, 0.0f,   // bottom-left
     0.5f, -0.5f, 0.0f,   // bottom-right
    -0.5f,  0.5f, 0.0f,   // top-left again
     0.5f, -0.5f, 0.0f,   // bottom-right again
     0.5f,  0.5f, 0.0f,   // top-right
};
glDrawArrays(GL_TRIANGLES, 0, 6);`}</CodeBlock>
      <p>
        {tx(t, "oglEbo_dupWhy",
          "Two copies of 12 bytes do not matter. But a copy is made for every triangle that shares a corner, and real vertices are bigger: position, normal and texture coordinate are 32 bytes. Duplicates also make meshes fragile, because moving one corner means finding and changing every copy of it.")}
      </p>

      <H2>{tx(t, "oglEbo_indexTitle", "Indices: numbering the vertices")}</H2>
      <p>
        {tx(t, "oglEbo_indexBody2",
          "With an index buffer, the vertex buffer holds each unique vertex once. The vertices are numbered by their position in it: 0, 1, 2, and so on. The index buffer is a list of those numbers, three per triangle.")}
      </p>
      <p>
        {tx(t, "oglEbo_indexHow",
          "When drawing, the GPU reads the index list in order. For each index, it fetches the vertex with that number from the vertex buffer, using the layout the VAO describes. So the index list decides which vertices form each triangle.")}
      </p>
      <p>
        {tx(t, "oglEbo_indexSave",
          "A vertex used by six triangles now appears six times in the index list. Each time it costs one number of 4 bytes or less, instead of a full 32-byte copy of the vertex.")}
      </p>
      <CodeBlock lang="cpp" filename="with_ebo.cpp" t={t}>{`float vertices[] = {
    -0.5f,  0.5f, 0.0f,   // 0: top-left
    -0.5f, -0.5f, 0.0f,   // 1: bottom-left
     0.5f, -0.5f, 0.0f,   // 2: bottom-right
     0.5f,  0.5f, 0.0f,   // 3: top-right
};
GLuint indices[] = {      // GLuint = unsigned int, read as GL_UNSIGNED_INT
    0, 1, 2,              // first triangle:  top-left, bottom-left, bottom-right
    0, 2, 3,              // second triangle: top-left, bottom-right, top-right
};`}</CodeBlock>
      <p>
        {tx(t, "oglEbo_posOnly",
          "These two snippets show only positions, to keep the numbers easy to follow. In your main.cpp each vertex keeps its colour (6 floats), as the setup code and the checkpoint below show.")}
      </p>
      <p>
        {tx(t, "oglEbo_figIntro",
          "Grow the grid in the figure: the vertex count grows with the number of grid points, while the triangle count and the index list grow with the number of cells. Click a triangle to find its three numbers in the list.")}
      </p>

      <IndexedGridFigure t={t} />

      <H3>{tx(t, "oglEbo_seamTitle", "When vertices cannot be shared")}</H3>
      <p>
        {tx(t, "oglEbo_seamBody2",
          "A vertex is its whole set of attributes, not just its position. Two triangles can share a vertex only if they want the same position, the same normal and the same texture coordinate at that corner.")}
      </p>
      <p>
        {tx(t, "oglEbo_seamCube",
          "A cube shows the difference. It has 8 corners, but each corner belongs to three faces that point in different directions. So the corner needs a different normal on each face (the normal is the direction a surface faces, used for lighting). A lit cube therefore needs 6 faces × 4 corners = 24 vertices, not 8.")}
      </p>
      <p>
        {tx(t, "oglEbo_seamSave",
          "Indices still help: they save the two duplicates inside each face, so the cube is 24 vertices plus 36 indices instead of 36 full vertices. The same splitting happens along texture seams, where the texture coordinates jump.")}
      </p>

      <H2>{tx(t, "oglEbo_createTitle", "Creating the EBO")}</H2>
      <p>
        {tx(t, "oglEbo_createBody",
          "An EBO is an ordinary buffer object bound to a different target, GL_ELEMENT_ARRAY_BUFFER. As the VAO chapter showed, that binding is stored inside the currently bound VAO, so bind the EBO while the mesh's VAO is bound, and the VAO will remember which index buffer belongs to it.")}
      </p>
      <p>
        {tx(t, "oglEbo_createWhere",
          "In your main.cpp this is step 4b, the same block as before with three additions: one more buffer name, the bind of that buffer to GL_ELEMENT_ARRAY_BUFFER, and the upload of the indices. The vertex layout does not change: each vertex is still x y z r g b.")}
      </p>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`GLuint vao, vbo, ebo;
glGenVertexArrays(1, &vao);
glGenBuffers(1, &vbo);
glGenBuffers(1, &ebo);                                   // NEW: one more buffer

glBindVertexArray(vao);                                  // start recording

glBindBuffer(GL_ARRAY_BUFFER, vbo);
glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)0);
glEnableVertexAttribArray(0);
glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)(3 * sizeof(float)));
glEnableVertexAttribArray(1);

glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, ebo);              // NEW: recorded in the VAO
glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);   // NEW

glBindVertexArray(0);                                   // stop recording FIRST...
// ...so a later glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, 0) cannot change this VAO`}</CodeBlock>
      <Callout type="warn" t={t}>
        {tx(t, "oglEbo_unbindWarn", "Do not unbind the EBO while the VAO is still bound. Since the VAO stores the GL_ELEMENT_ARRAY_BUFFER binding, glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, 0) at that moment removes the index buffer from the VAO, and glDrawElements then fails. Unbind the VAO first.")}
      </Callout>

      <H2>{tx(t, "oglEbo_drawTitle", "Drawing with glDrawElements")}</H2>
      <p>
        {tx(t, "oglEbo_drawWhere",
          "In the render loop, glDrawElements replaces glDrawArrays. The other two lines stay.")}
      </p>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`glUseProgram(shaderProgram);
glBindVertexArray(vao);                                  // brings its EBO along
glDrawElements(GL_TRIANGLES,       // mode: how to group the fetched vertices
               6,                  // count: how many INDICES to read
               GL_UNSIGNED_INT,    // type of each index in the EBO
               (void*)0);          // byte offset of the first index in the EBO`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "oglEbo_tArg", "Argument"), tx(t, "oglEbo_tMeaning", "Meaning")]}
        rows={[
          ["mode", tx(t, "oglEbo_a1", "the same primitive modes as glDrawArrays: GL_TRIANGLES, GL_LINES, GL_POINTS…")],
          ["count", tx(t, "oglEbo_a2", "the number of indices to read, not the number of vertices or triangles: 2 triangles need 6.")],
          ["type", tx(t, "oglEbo_a3", "how each index is stored: GL_UNSIGNED_BYTE, GL_UNSIGNED_SHORT or GL_UNSIGNED_INT. It must match the array you uploaded.")],
          ["indices", tx(t, "oglEbo_a4", "a byte offset into the bound EBO, cast to a pointer like glVertexAttribPointer's offset. To start at index number k, pass k × the index size.")],
        ]}
      />
      <p>
        {tx(t, "oglEbo_subsetBody",
          "Because count and offset select a range of the list, one index buffer can hold several parts of a model, drawn separately (for example with different textures). To draw only the second triangle of the quad: glDrawElements(GL_TRIANGLES, 3, GL_UNSIGNED_INT, (void*)(3 * sizeof(unsigned int))), which skips the first 3 indices, 12 bytes.")}
      </p>

      <H3>{tx(t, "oglEbo_typesTitle", "Choosing the index type")}</H3>
      <LessonTable
        headers={[tx(t, "oglEbo_tType", "Type"), tx(t, "oglEbo_tBytes", "Bytes per index"), tx(t, "oglEbo_tMax", "Can number")]}
        rows={[
          ["GL_UNSIGNED_BYTE", "1", tx(t, "oglEbo_i1", "256 vertices (0…255); rarely worth it, and slow on some GPUs")],
          ["GL_UNSIGNED_SHORT", "2", tx(t, "oglEbo_i2", "65 536 vertices: most individual meshes fit, at half the size")],
          ["GL_UNSIGNED_INT", "4", tx(t, "oglEbo_i3", "about 4.3 billion: anything; the safe default")],
        ]}
      />

      <H2>{tx(t, "oglEbo_workedTitle", "Worked example: a terrain grid")}</H2>
      <p>
        {tx(t, "oglEbo_worked",
          "A terrain of 100 × 100 cells has 101 × 101 = 10 201 grid points and 100 × 100 × 2 = 20 000 triangles. With 32-byte vertices, glDrawArrays needs 20 000 × 3 = 60 000 vertices: 60 000 × 32 = 1 920 000 bytes. Indexed, it needs 10 201 × 32 = 326 432 bytes of vertices plus 60 000 indices × 4 = 240 000 bytes, 566 432 bytes in total: 3.4 times less. With GL_UNSIGNED_SHORT indices (10 201 < 65 536, so they fit), the index list halves to 120 000 bytes and the total is 446 432 bytes, 4.3 times less than without indices.")}
      </p>
      <p>
        {tx(t, "oglEbo_cacheBody",
          "Indices save work as well as memory. GPUs keep the results of recent vertex shader runs in a small cache, keyed by vertex index. When an index repeats soon after, as it does for neighbouring triangles, the result is reused instead of running the vertex shader again. With glDrawArrays there are no indices to recognise, so every one of the 60 000 vertices is shaded; with indices, the grid above needs close to one run per unique vertex when the triangles are ordered well.")}
      </p>

      <H2>{tx(t, "oglEbo_wireTitle", "Debugging: wireframe mode")}</H2>
      <p>
        {tx(t, "oglEbo_wireBody",
          "A wrong index draws a triangle between the wrong points, which is hard to see in a filled mesh. glPolygonMode draws only the edges, so the triangulation becomes visible.")}
      </p>
      <CodeBlock lang="cpp" filename="wireframe.cpp" t={t}>{`glPolygonMode(GL_FRONT_AND_BACK, GL_LINE);    // edges only
// ... draw ...
glPolygonMode(GL_FRONT_AND_BACK, GL_FILL);    // back to filled triangles (the default)`}</CodeBlock>
      <Callout type="tip" t={t}>
        {tx(t, "oglEbo_loaderTip", "Model files and loaders work this way: Assimp and tinyobjloader output a vertex array and an index array, ready for a VBO and an EBO (Model Loading chapter).")}
      </Callout>

      <H2>{tx(t, "oglEbo_soFarTitle", "Your main.cpp so far")}</H2>
      <p>
        {tx(t, "oglEbo_soFarBody",
          "The whole file, with the triangle turned into a square. Compared with the complete program of Drawing the Triangle, four places changed, each marked NEW: the vertices (4 corners, each with its own colour) and the new index list in step 4b; the EBO inside the same block; glDrawElements in the loop; and one more glDeleteBuffers at the end. The shaders and the helpers did not change, so they are shortened here.")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp" t={t}>{`#include <glad/glad.h>      // MUST come before glfw3.h
#include <GLFW/glfw3.h>
#include <iostream>

// ── Shaders and helpers (unchanged since Drawing the Triangle) ──────────────
const char* vertexShaderSource   = R"(...)";   // aPos + aColor → vColor
const char* fragmentShaderSource = R"(...)";   // FragColor = vec4(vColor, 1.0)
GLuint compileShader(GLenum type, const char* src) { /* ... */ }
GLuint makeProgram(const char* vsSrc, const char* fsSrc) { /* ... */ }

void framebufferSizeCallback(GLFWwindow*, int width, int height) {
    glViewport(0, 0, width, height);
}

int main() {
    // ── 1–3. Window, GLAD, viewport (unchanged) ─────────────────────────────
    if (!glfwInit()) return 1;
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 4);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 6);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
    GLFWwindow* window = glfwCreateWindow(1280, 720, "GLApp", nullptr, nullptr);
    if (!window) { glfwTerminate(); return 1; }
    glfwMakeContextCurrent(window);
    glfwSwapInterval(1);
    if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)) return 1;
    int fbw, fbh;
    glfwGetFramebufferSize(window, &fbw, &fbh);
    glViewport(0, 0, fbw, fbh);
    glfwSetFramebufferSizeCallback(window, framebufferSizeCallback);

    // ── 4. One-time setup ────────────────────────────────────────────────────
    // 4a. Shaders → program (unchanged)
    GLuint shaderProgram = makeProgram(vertexShaderSource, fragmentShaderSource);
    if (shaderProgram == 0) { glfwTerminate(); return 1; }

    // 4b. Vertex data → VAO + VBO + EBO              >>> NEW: a square, indexed
    float vertices[] = {
    //    x      y     z     r     g     b
        -0.5f,  0.5f, 0.0f, 1.0f, 0.27f, 0.27f,   // 0: top-left, red
        -0.5f, -0.5f, 0.0f, 0.13f,0.77f, 0.37f,   // 1: bottom-left, green
         0.5f, -0.5f, 0.0f, 0.23f,0.51f, 0.96f,   // 2: bottom-right, blue
         0.5f,  0.5f, 0.0f, 1.0f, 0.8f,  0.2f,    // 3: top-right, yellow
    };
    GLuint indices[] = {
        0, 1, 2,              // first triangle
        0, 2, 3,              // second triangle
    };
    GLuint vao, vbo, ebo;
    glGenVertexArrays(1, &vao);
    glGenBuffers(1, &vbo);
    glGenBuffers(1, &ebo);

    glBindVertexArray(vao);
    glBindBuffer(GL_ARRAY_BUFFER, vbo);
    glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)0);
    glEnableVertexAttribArray(0);
    glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)(3 * sizeof(float)));
    glEnableVertexAttribArray(1);
    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, ebo);    // recorded in the VAO
    glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);
    glBindVertexArray(0);                          // unbind the VAO first, keep the EBO in it
    //                                               <<< end of NEW

    // ── 5. The render loop ───────────────────────────────────────────────────
    while (!glfwWindowShouldClose(window)) {
        if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
            glfwSetWindowShouldClose(window, true);

        glClearColor(0.06f, 0.07f, 0.10f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

        glUseProgram(shaderProgram);
        glBindVertexArray(vao);
        glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, (void*)0);   // NEW: 6 indices

        glfwSwapBuffers(window);
        glfwPollEvents();
    }

    // ── 6. Clean up ──────────────────────────────────────────────────────────
    glDeleteVertexArrays(1, &vao);
    glDeleteBuffers(1, &vbo);
    glDeleteBuffers(1, &ebo);                      // NEW
    glDeleteProgram(shaderProgram);
    glfwTerminate();
    return 0;
}`}</CodeBlock>
      <p>
        {tx(t, "oglEbo_soFarRun",
          "Run it: a square with a different colour in each corner, blended across. Look closely at the diagonal from top-left to bottom-right. Along it the colour is a blend of only red and blue, because each triangle blends only its own three corners, and the faint crease you may notice there is that edge.")}
      </p>
      <Callout type="tip" t={t}>
        {tx(t, "oglEbo_soFarWire", "To see the two triangles, add glPolygonMode(GL_FRONT_AND_BACK, GL_LINE); in step 4, after the VAO setup. The diagonal from top-left to bottom-right is the edge both triangles share: vertices 0 and 2, the two numbers that appear in both rows of the index list.")}
      </Callout>
      <p>
        {tx(t, "oglEbo_soFarNext",
          "The Textures chapter puts an image on this square. Its vertices will carry texture coordinates instead of colours.")}
      </p>

      <H2>{tx(t, "oglEbo_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "oglEbo_tMistake", "Mistake"), tx(t, "oglEbo_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "oglEbo_e1", "Passing the triangle or vertex count as count"), tx(t, "oglEbo_e1b", "only part of the mesh draws. count is the number of indices: triangles × 3.")],
          [tx(t, "oglEbo_e2", "type not matching the uploaded array"), tx(t, "oglEbo_e2b", "unsigned int indices read as GL_UNSIGNED_SHORT are split into halves: garbage triangles. Keep the C++ type and the GL enum together.")],
          [tx(t, "oglEbo_e3", "Binding the EBO with no VAO (or the wrong VAO) bound"), tx(t, "oglEbo_e3b", "the binding lands in another VAO or nowhere, and glDrawElements fails. Bind the EBO while the mesh's VAO is bound.")],
          [tx(t, "oglEbo_e4", "Unbinding the EBO before the VAO"), tx(t, "oglEbo_e4b", "removes it from the VAO. Unbind the VAO first, or just leave the EBO bound.")],
          [tx(t, "oglEbo_e5", "An index ≥ the number of vertices"), tx(t, "oglEbo_e5b", "reads past the vertex buffer: undefined, usually stray triangles. Check loaders' output.")],
          [tx(t, "oglEbo_e6", "Offset given in indices instead of bytes"), tx(t, "oglEbo_e6b", "(void*)3 starts in the middle of an index. Multiply by the index size.")],
          [tx(t, "oglEbo_e7", "Sharing vertices across a hard edge"), tx(t, "oglEbo_e7b", "a shared normal is averaged across faces and the cube looks rounded. Split vertices where normals or UVs differ.")],
        ]}
      />

      <KeyIdeas t={t} id="oglEbo" items={[
        "glDrawArrays needs a full copy of every shared vertex; an index buffer stores each unique vertex once and names them by number.",
        "The GPU reads the index list in order and fetches the vertex with each number through the VAO.",
        "A vertex is all its attributes: corners with different normals or texture coordinates must stay separate vertices (a lit cube has 24).",
        "The EBO is a buffer bound to GL_ELEMENT_ARRAY_BUFFER while the VAO is bound, which stores that binding; unbind the VAO first.",
        "glDrawElements(mode, count of indices, index type, byte offset) draws; count and offset can select part of the list.",
        "GL_UNSIGNED_SHORT halves the index size for meshes under 65 536 vertices; GL_UNSIGNED_INT is the safe default.",
        "Repeated indices also let the GPU reuse vertex shader results from its vertex cache.",
      ]} />
    </Article>
  );
}
