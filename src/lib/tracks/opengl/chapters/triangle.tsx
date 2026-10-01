"use client";

// OpenGL track — "Drawing the Triangle": the three draw calls line by line and
// where they go; the complete program (the code-along file, finished); what you
// see when you run it; a map of which part does what; one frame in order, with
// the fragment count worked out; the "Hello Triangle debugger" (figure) and the
// black-screen checklist; reading GL errors (glGetError, the debug callback,
// RenderDoc); winding; exercises.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { TriangleDebugFigure } from "@/components/lesson/figures/glintro/TriangleDebugFigure";

export function TriangleContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglTri_intro",
          "Every piece is now in place: a window and a context, a buffer holding the vertices, a vertex array describing them, and a pair of shaders. This chapter puts them together into one complete program, the traditional first program of graphics, and then does what every graphics programmer spends a good part of their time doing: working out why the screen is black. The figure lets you remove any call from the program and see exactly what breaks.")}
      </Lead>

      <H2>{tx(t, "oglTri_drawTitle", "The three missing lines")}</H2>
      <p>
        {tx(t, "oglTri_drawBody",
          "Your main.cpp already creates everything the triangle needs. What it never does is ask for a draw. That takes three lines inside the render loop, in step 5, where the comment // ... draw ... has been waiting since the Window & Context chapter.")}
      </p>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`// In step 5, between glClear and glfwSwapBuffers:
glUseProgram(shaderProgram);          // which shaders run
glBindVertexArray(vao);               // which mesh: its buffer and layout
glDrawArrays(GL_TRIANGLES, 0, 3);     // draw: 3 vertices, starting at vertex 0`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "oglTri_tLine", "Line"), tx(t, "oglTri_tDoes", "What it does")]}
        rows={[
          ["glUseProgram(shaderProgram)", tx(t, "oglTri_d1", "makes the program from step 4a the current one. Every draw after it runs these shaders, until another glUseProgram.")],
          ["glBindVertexArray(vao)", tx(t, "oglTri_d2", "makes the VAO from step 4b the current one. It brings back the whole layout: which buffer to read, and how attributes 0 and 1 are laid out in it.")],
          ["GL_TRIANGLES", tx(t, "oglTri_d3", "the mode: group the vertices in threes, each three forming one filled triangle. Other modes are GL_LINES, GL_LINE_LOOP and GL_POINTS (exercise 4).")],
          ["0", tx(t, "oglTri_d4", "the first vertex to read. 0 is the start of the buffer.")],
          ["3", tx(t, "oglTri_d5", "how many vertices to read: 3 vertices, so 1 triangle. It counts vertices, not triangles and not floats.")],
        ]}
      />
      <p>
        {tx(t, "oglTri_drawOrder",
          "The order inside the loop matters. Clear first, so the old frame is wiped. Then draw. Then swap, so the finished picture is shown. A draw placed after glfwSwapBuffers lands in the next back buffer and is cleared before anyone sees it.")}
      </p>

      <H2>{tx(t, "oglTri_programTitle", "The complete program")}</H2>
      <p>
        {tx(t, "oglTri_programBody",
          "Here is the whole file: the main.cpp from the end of First Shaders, plus the three lines, marked NEW. If you have been coding along, yours should match it line for line. If you are starting here, this file compiles on its own with the CMake file from the Window & Context chapter.")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp" t={t}>{`#include <glad/glad.h>      // MUST come before glfw3.h
#include <GLFW/glfw3.h>
#include <iostream>

// ── Shaders (Pipeline, VAO and First Shaders chapters) ──────────────────────
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

// ── Shader helpers (First Shaders chapter) ──────────────────────────────────
GLuint compileShader(GLenum type, const char* src) {
    GLuint s = glCreateShader(type);
    glShaderSource(s, 1, &src, nullptr);
    glCompileShader(s);
    GLint ok = 0;
    glGetShaderiv(s, GL_COMPILE_STATUS, &ok);
    if (!ok) {
        char log[1024];
        glGetShaderInfoLog(s, sizeof log, nullptr, log);
        std::cerr << (type == GL_VERTEX_SHADER ? "Vertex" : "Fragment")
                  << " shader error: " << log << "\\n";
    }
    return s;
}

GLuint makeProgram(const char* vsSrc, const char* fsSrc) {
    GLuint vs = compileShader(GL_VERTEX_SHADER, vsSrc);
    GLuint fs = compileShader(GL_FRAGMENT_SHADER, fsSrc);
    GLuint p = glCreateProgram();
    glAttachShader(p, vs);
    glAttachShader(p, fs);
    glLinkProgram(p);
    GLint ok = 0;
    glGetProgramiv(p, GL_LINK_STATUS, &ok);
    if (!ok) {
        char log[1024];
        glGetProgramInfoLog(p, sizeof log, nullptr, log);
        std::cerr << "Program link error: " << log << "\\n";
    }
    glDeleteShader(vs);
    glDeleteShader(fs);
    if (!ok) {
        glDeleteProgram(p);
        return 0;                   // 0 = "no program"
    }
    return p;
}

void framebufferSizeCallback(GLFWwindow*, int width, int height) {
    glViewport(0, 0, width, height);
}

int main() {
    // ── 1. Window library and context (Window & Context chapter) ─────────────
    if (!glfwInit()) return 1;
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 4);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 6);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
    GLFWwindow* window = glfwCreateWindow(1280, 720, "GLApp", nullptr, nullptr);
    if (!window) { glfwTerminate(); return 1; }
    glfwMakeContextCurrent(window);
    glfwSwapInterval(1);                                    // vsync

    // ── 2. Load the OpenGL functions (no gl* call before this) ───────────────
    if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)) return 1;

    // ── 3. Viewport, now and on every resize ─────────────────────────────────
    int fbw, fbh;
    glfwGetFramebufferSize(window, &fbw, &fbh);             // pixels, not window units
    glViewport(0, 0, fbw, fbh);
    glfwSetFramebufferSizeCallback(window, framebufferSizeCallback);

    // ── 4. One-time setup ────────────────────────────────────────────────────
    // 4a. Shaders → program
    GLuint shaderProgram = makeProgram(vertexShaderSource, fragmentShaderSource);
    if (shaderProgram == 0) { glfwTerminate(); return 1; }

    // 4b. Vertex data → VAO + VBO (VBO and VAO chapters)
    float vertices[] = {
    //    x      y      z     r     g     b
        -0.6f, -0.55f, 0.0f, 1.0f, 0.27f, 0.27f,   // vertex 0: red, bottom left
         0.65f,-0.45f, 0.0f, 0.13f,0.77f, 0.37f,   // vertex 1: green, bottom right
         0.0f,  0.65f, 0.0f, 0.23f,0.51f, 0.96f,   // vertex 2: blue, top
    };
    GLuint vao, vbo;
    glGenVertexArrays(1, &vao);
    glGenBuffers(1, &vbo);

    glBindVertexArray(vao);
    glBindBuffer(GL_ARRAY_BUFFER, vbo);
    glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)0);
    glEnableVertexAttribArray(0);
    glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)(3 * sizeof(float)));
    glEnableVertexAttribArray(1);
    glBindVertexArray(0);

    // ── 5. The render loop ───────────────────────────────────────────────────
    while (!glfwWindowShouldClose(window)) {
        if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
            glfwSetWindowShouldClose(window, true);

        glClearColor(0.06f, 0.07f, 0.10f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

        glUseProgram(shaderProgram);                        // >>> NEW in this chapter
        glBindVertexArray(vao);
        glDrawArrays(GL_TRIANGLES, 0, 3);                   // <<< end of NEW

        glfwSwapBuffers(window);
        glfwPollEvents();
    }

    // ── 6. Clean up, children before the context ─────────────────────────────
    glDeleteVertexArrays(1, &vao);
    glDeleteBuffers(1, &vbo);
    glDeleteProgram(shaderProgram);
    glfwTerminate();
    return 0;
}`}</CodeBlock>
      <p>
        {tx(t, "oglTri_runBody",
          "Run it. On the dark clear colour you should see the triangle: red at the bottom left, green at the bottom right, blue at the top, and smooth blends in between. Those blends are the interpolation from the First Shaders chapter.")}
      </p>
      <p>
        {tx(t, "oglTri_runResize",
          "Now resize the window. The triangle stretches with it, because NDC always spans the whole viewport, whatever its size (Pipeline chapter). Keeping shapes from stretching needs a projection matrix, in the Transformations section. Esc closes the window.")}
      </p>

      <H2>{tx(t, "oglTri_mapTitle", "What each part does")}</H2>
      <LessonTable
        headers={[tx(t, "oglTri_tPart", "Part"), tx(t, "oglTri_tRuns", "Runs"), tx(t, "oglTri_tJob", "Job"), tx(t, "oglTri_tChapter", "Chapter")]}
        rows={[
          [tx(t, "oglTri_m1", "Window and context"), tx(t, "oglTri_once", "once"), tx(t, "oglTri_m1b", "creates the window and a 4.6 Core context, loads the functions, sets the viewport from the framebuffer size"), tx(t, "oglTri_m1c", "Window & Context")],
          [tx(t, "oglTri_m2", "makeProgram"), tx(t, "oglTri_once", "once"), tx(t, "oglTri_m2b", "compiles both shaders on the driver and links them into one program, printing any error"), tx(t, "oglTri_m2c", "Pipeline, First Shaders")],
          [tx(t, "oglTri_m3", "VBO + VAO"), tx(t, "oglTri_once", "once"), tx(t, "oglTri_m3b", "copies the 72 bytes of vertex data to the GPU and records how locations 0 and 1 read them"), tx(t, "oglTri_m3c", "VBO, VAO")],
          [tx(t, "oglTri_m4", "Render loop"), tx(t, "oglTri_frame", "every frame"), tx(t, "oglTri_m4b", "clear, choose the program and the mesh, draw 3 vertices, show the back buffer, handle events"), tx(t, "oglTri_m4c", "Window & Context, Pipeline")],
          [tx(t, "oglTri_m5", "Clean up"), tx(t, "oglTri_once", "once"), tx(t, "oglTri_m5b", "frees the GPU objects, then the context and window"), "—"],
        ]}
      />

      <H3>{tx(t, "oglTri_frameTitle", "What one glDrawArrays sets off")}</H3>
      <p>
        {tx(t, "oglTri_frameBody2",
          "Inside one frame, glDrawArrays is the only call that makes the GPU do real work. It starts the whole pipeline from the Pipeline chapter, in this order:")}
      </p>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "oglTri_f1", "The vertex fetch reads 3 vertices from the buffer, using the layout stored in the VAO.")}</li>
        <li>{tx(t, "oglTri_f2", "The vertex shader runs 3 times, once per vertex, and writes gl_Position and vColor.")}</li>
        <li>{tx(t, "oglTri_f3", "The triangle is clipped to the visible area and mapped to the viewport, from NDC to pixels.")}</li>
        <li>{tx(t, "oglTri_f4", "The rasterizer creates one fragment for every pixel the triangle covers.")}</li>
        <li>{tx(t, "oglTri_f5", "The fragment shader runs once per fragment and writes the interpolated colour into the back buffer.")}</li>
      </ol>
      <p>
        {tx(t, "oglTri_frameArea",
          "How many fragments is that? Start with the triangle's area in NDC. Take the two edges that leave vertex 0: to vertex 1 is (0.65 − (−0.6), −0.45 − (−0.55)) = (1.25, 0.1), and to vertex 2 is (0.6, 1.2). Half the absolute value of their cross product is the area: ½ · |1.25 · 1.2 − 0.1 · 0.6| = ½ · 1.44 = 0.72.")}
      </p>
      <p>
        {tx(t, "oglTri_frameCount",
          "The whole window is 2 × 2 = 4 in NDC, so the triangle covers 0.72 / 4 = 18% of it. At 1280 × 720 that is 0.18 × 921 600 ≈ 166 000 pixels. So per frame the vertex shader runs 3 times and the fragment shader about 166 000 times: about 10 million times per second at 60 fps.")}
      </p>

      <H2>{tx(t, "oglTri_debugTitle", "When the screen stays black")}</H2>
      <p>
        {tx(t, "oglTri_debugBody",
          "Most mistakes in a first OpenGL program do not crash and do not print anything. The failing call sets an error flag, returns, and the frame ends with nothing but the clear colour. Remove calls from the program below to see which omissions crash, which ones leave a black window, and the two that seem to change nothing at all.")}
      </p>

      <TriangleDebugFigure t={t} />

      <H3>{tx(t, "oglTri_checklistTitle", "The black-screen checklist")}</H3>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "oglTri_c1", "Did the shaders compile and link? Read the info logs; they name the line.")}</li>
        <li>{tx(t, "oglTri_c2", "Is a VAO bound both while describing the attributes and at draw time?")}</li>
        <li>{tx(t, "oglTri_c3", "Are the attribute locations in glVertexAttribPointer the same as layout(location = …) in the shader, and are they enabled?")}</li>
        <li>{tx(t, "oglTri_c4", "Are the sizes, strides and offsets in bytes, and does the buffer hold what you think (sizeof on a real array, not a pointer)?")}</li>
        <li>{tx(t, "oglTri_c5", "Are the positions inside −1…+1, with w = 1?")}</li>
        <li>{tx(t, "oglTri_c6", "Is glUseProgram called before the draw, and glfwSwapBuffers after it?")}</li>
        <li>{tx(t, "oglTri_c7", "Later, with culling on: is the winding counter-clockwise? (Face Winding & Culling chapter)")}</li>
      </ol>

      <H3>{tx(t, "oglTri_errorsTitle", "Making errors visible")}</H3>
      <p>
        {tx(t, "oglTri_errorsBody2",
          "Every OpenGL call that fails records an error code. glGetError returns the oldest recorded code and clears it. Calling it in a loop right after a suspicious call tells you whether that call failed, and how.")}
      </p>
      <LessonTable
        headers={[tx(t, "oglTri_tCode", "Code"), tx(t, "oglTri_tMeans", "Means")]}
        rows={[
          ["GL_INVALID_ENUM (0x0500)", tx(t, "oglTri_g1", "a constant that this function does not accept, such as a mipmap filter passed as GL_TEXTURE_MAG_FILTER.")],
          ["GL_INVALID_VALUE (0x0501)", tx(t, "oglTri_g2", "a number out of range, such as a negative size or an attribute index above the maximum.")],
          ["GL_INVALID_OPERATION (0x0502)", tx(t, "oglTri_g3", "a call that is not allowed in the current state, such as drawing with no VAO bound. By far the most common.")],
        ]}
      />
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`// Above main, next to the shader helpers:
void checkGL(const char* where) {
    for (GLenum e; (e = glGetError()) != GL_NO_ERROR; )
        std::cerr << "GL error 0x" << std::hex << e << std::dec << " after " << where << "\\n";
}

// In the loop, right after a call you suspect:
glDrawArrays(GL_TRIANGLES, 0, 3);
checkGL("glDrawArrays");`}</CodeBlock>
      <p>
        {tx(t, "oglTri_errorsWhere",
          "Use checkGL while hunting a bug, then remove the calls. Each glGetError can make the CPU wait for the driver, so a program full of them runs slower.")}
      </p>
      <p>
        {tx(t, "oglTri_errorsBetter",
          "On OpenGL 4.3 and newer there is something much better: the debug callback. The driver calls your function with a readable message the moment an error happens, and a breakpoint inside it shows the exact line in the debugger. The Debugging chapter sets it up. RenderDoc then shows every call and buffer of a captured frame.")}
      </p>

      <Callout type="warn" t={t}>
        {tx(t, "oglTri_windingWarn", "The order of the vertices in the array is not arbitrary: it defines the winding of the triangle. OpenGL treats counter-clockwise triangles (as seen on screen) as front-facing. Nothing depends on it yet, but once face culling is enabled, clockwise triangles disappear. The Face Winding & Culling chapter explains it with an interactive figure.")}
      </Callout>

      <H2>{tx(t, "oglTri_exercisesTitle", "Exercises")}</H2>
      <p>
        {tx(t, "oglTri_exercisesBody", "Each exercise starts from the complete program above. Keep a copy of it, so you can go back.")}
      </p>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "oglTri_x1", "Change the clear colour to white, then make the triangle a single colour by ignoring vColor in the fragment shader.")}</li>
        <li>{tx(t, "oglTri_x2", "Add a second triangle next to the first by extending the array to 6 vertices and drawing 6. Where does it appear if you give it z = 2.0?")}</li>
        <li>{tx(t, "oglTri_x3", "Add a uniform float uTime, set it every frame from glfwGetTime(), and use it to move the triangle with sin() in the vertex shader.")}</li>
        <li>{tx(t, "oglTri_x4", "Draw with GL_LINE_LOOP and GL_POINTS instead of GL_TRIANGLES (call glPointSize(10.0f) to see the points).")}</li>
        <li>{tx(t, "oglTri_x5", "Break one thing on purpose, as in the figure, and find it again using only glGetError.")}</li>
      </ol>
      <Callout type="tip" t={t}>
        {tx(t, "oglTri_x3Hint", "A hint for exercise 3. In the vertex shader, declare uniform float uTime; and write gl_Position = vec4(aPos.x + 0.3 * sin(uTime), aPos.y, aPos.z, 1.0);. In the loop, after glUseProgram, add glUniform1f(glGetUniformLocation(shaderProgram, \"uTime\"), (float)glfwGetTime());. The triangle slides 0.3 left and right, one full swing every 2π ≈ 6.3 seconds.")}
      </Callout>
      <p>
        {tx(t, "oglTri_nextBody",
          "Next, the Indexed Drawing chapter turns this triangle into a square drawn from 4 vertices instead of 6, and ends with the updated file.")}
      </p>

      <KeyIdeas t={t} id="oglTri" items={[
        "A complete OpenGL program is: window and context, shaders, vertex data (VBO + VAO), a render loop, clean-up.",
        "One glDrawArrays call runs the whole pipeline: vertex fetch, vertex shader, clipping, viewport, rasterization, fragment shader, tests, framebuffer.",
        "Most mistakes do not crash: a call fails with a GL error and the window shows only the clear colour.",
        "Missing GLAD or a current context crashes; a missing VAO, program, enable or draw leaves a black screen; missing swap shows nothing; missing poll freezes the window.",
        "glGetError reports errors after the fact; the 4.3 debug callback reports them as they happen, with a message.",
        "Vertex order sets the winding, which matters once face culling is on.",
      ]} />
    </Article>
  );
}
