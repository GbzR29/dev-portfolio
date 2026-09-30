"use client";

// OpenGL track — "Drawing the Triangle": the complete program, assembled from
// the previous chapters; a map of which part does what; one frame in order;
// the "Hello Triangle debugger" (figure) and the black-screen checklist;
// reading GL errors (glGetError, the debug callback, RenderDoc); cleaning up;
// winding; exercises.

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

      <H2>{tx(t, "oglTri_programTitle", "The complete program")}</H2>
      <CodeBlock lang="cpp" filename="hello_triangle.cpp" t={t}>{`#include <glad/glad.h>          // before glfw3.h
#include <GLFW/glfw3.h>
#include <cstdio>

// ── Shaders (First Shaders chapter) ─────────────────────────────────────────
const char* kVertexSrc = R"(#version 460 core
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aColor;
out vec3 vColor;
void main() {
    gl_Position = vec4(aPos, 1.0);
    vColor = aColor;
})";

const char* kFragmentSrc = R"(#version 460 core
in  vec3 vColor;
out vec4 FragColor;
void main() {
    FragColor = vec4(vColor, 1.0);
})";

GLuint compileShader(GLenum type, const char* src) {
    GLuint s = glCreateShader(type);
    glShaderSource(s, 1, &src, nullptr);
    glCompileShader(s);
    GLint ok = 0;
    glGetShaderiv(s, GL_COMPILE_STATUS, &ok);
    if (!ok) {
        char log[1024];
        glGetShaderInfoLog(s, sizeof log, nullptr, log);
        std::fprintf(stderr, "shader compile error:\\n%s\\n", log);
    }
    return s;
}

GLuint makeProgram() {
    GLuint vs = compileShader(GL_VERTEX_SHADER, kVertexSrc);
    GLuint fs = compileShader(GL_FRAGMENT_SHADER, kFragmentSrc);
    GLuint p = glCreateProgram();
    glAttachShader(p, vs);
    glAttachShader(p, fs);
    glLinkProgram(p);
    GLint ok = 0;
    glGetProgramiv(p, GL_LINK_STATUS, &ok);
    if (!ok) {
        char log[1024];
        glGetProgramInfoLog(p, sizeof log, nullptr, log);
        std::fprintf(stderr, "program link error:\\n%s\\n", log);
    }
    glDeleteShader(vs);
    glDeleteShader(fs);
    return p;
}

void onResize(GLFWwindow*, int w, int h) { glViewport(0, 0, w, h); }

int main() {
    // ── Window and context (Window & Context chapter) ────────────────────────
    if (!glfwInit()) return 1;
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 4);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 6);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
    GLFWwindow* window = glfwCreateWindow(800, 600, "Hello Triangle", nullptr, nullptr);
    if (!window) { glfwTerminate(); return 1; }
    glfwMakeContextCurrent(window);
    if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)) return 1;
    glfwSwapInterval(1);                                    // vsync

    int fbw, fbh;
    glfwGetFramebufferSize(window, &fbw, &fbh);             // pixels, not window units
    glViewport(0, 0, fbw, fbh);
    glfwSetFramebufferSizeCallback(window, onResize);

    // ── Shaders ───────────────────────────────────────────────────────────────
    GLuint program = makeProgram();

    // ── Vertex data: VBO + VAO (VBO and VAO chapters) ─────────────────────────
    float vertices[] = {
    //    x      y      z     r     g     b
        -0.6f, -0.55f, 0.0f, 1.0f, 0.27f, 0.27f,
         0.65f,-0.45f, 0.0f, 0.13f,0.77f, 0.37f,
         0.0f,  0.65f, 0.0f, 0.23f,0.51f, 0.96f,
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

    // ── The render loop ───────────────────────────────────────────────────────
    while (!glfwWindowShouldClose(window)) {
        glClearColor(0.06f, 0.07f, 0.10f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT);

        glUseProgram(program);
        glBindVertexArray(vao);
        glDrawArrays(GL_TRIANGLES, 0, 3);                   // 3 vertices from index 0

        glfwSwapBuffers(window);
        glfwPollEvents();
    }

    // ── Clean up, children before the context ─────────────────────────────────
    glDeleteVertexArrays(1, &vao);
    glDeleteBuffers(1, &vbo);
    glDeleteProgram(program);
    glfwTerminate();
    return 0;
}`}</CodeBlock>

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
      <p>
        {tx(t, "oglTri_frameBody",
          "Inside one frame, glDrawArrays(GL_TRIANGLES, 0, 3) is the only call that makes the GPU do real work, and it sets off the whole pipeline of the Pipeline chapter: the vertex fetch reads 3 vertices through the VAO, the vertex shader runs 3 times, the triangle is clipped and mapped to the viewport, the rasterizer creates a fragment for every covered pixel, and the fragment shader runs once for each, writing the interpolated colour. This triangle's area in NDC is ½ · |1.25 · 1.2 − 0.1 · 0.6| = 0.72, out of 2 × 2 = 4 for the whole window, so it covers 18% of it: at 800 × 600 that is about 86 000 pixels, so the fragment shader runs about 86 000 times per frame, over 5 million times per second at 60 fps.")}
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
        {tx(t, "oglTri_errorsBody",
          "Every OpenGL call that fails records an error code, and glGetError returns and clears the oldest one. Calling it in a loop after a suspicious call tells you whether that call failed, and with which code: GL_INVALID_ENUM (a bad constant), GL_INVALID_VALUE (a bad number), GL_INVALID_OPERATION (a call not allowed in the current state, by far the most common). On OpenGL 4.3 and newer the debug callback is much better: the driver calls your function with a readable message the moment an error happens, and a breakpoint inside it shows the exact line in the debugger. The Debugging chapter sets both up; RenderDoc then shows every call and buffer of a captured frame.")}
      </p>
      <CodeBlock lang="cpp" filename="check.cpp" t={t}>{`void checkGL(const char* where) {
    for (GLenum e; (e = glGetError()) != GL_NO_ERROR; )
        std::fprintf(stderr, "GL error 0x%04X after %s\\n", e, where);   // 0x0502 = INVALID_OPERATION
}

glDrawArrays(GL_TRIANGLES, 0, 3);
checkGL("glDrawArrays");`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "oglTri_windingWarn", "The order of the vertices in the array is not arbitrary: it defines the winding of the triangle. OpenGL treats counter-clockwise triangles (as seen on screen) as front-facing. Nothing depends on it yet, but once face culling is enabled, clockwise triangles disappear. The Face Winding & Culling chapter explains it with an interactive figure.")}
      </Callout>

      <H2>{tx(t, "oglTri_exercisesTitle", "Exercises")}</H2>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "oglTri_x1", "Change the clear colour to white, then make the triangle a single colour by ignoring vColor in the fragment shader.")}</li>
        <li>{tx(t, "oglTri_x2", "Add a second triangle next to the first by extending the array to 6 vertices and drawing 6. Where does it appear if you give it z = 2.0?")}</li>
        <li>{tx(t, "oglTri_x3", "Add a uniform float uTime, set it every frame from glfwGetTime(), and use it to move the triangle with sin() in the vertex shader.")}</li>
        <li>{tx(t, "oglTri_x4", "Draw with GL_LINE_LOOP and GL_POINTS instead of GL_TRIANGLES (call glPointSize(10.0f) to see the points).")}</li>
        <li>{tx(t, "oglTri_x5", "Break one thing on purpose, as in the figure, and find it again using only glGetError.")}</li>
      </ol>

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
