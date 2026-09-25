"use client";

// OpenGL track — "Drawing the Triangle".

import { CodeBlock, Callout, H2 } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export function TriangleContent({ t }: { t: TrackTranslations }) {
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
