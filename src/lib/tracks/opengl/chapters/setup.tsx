// src/lib/tracks/opengl/chapters/setup.tsx
"use client";

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

// ── Window & Context ──────────────────────────────────────────────────────────

export function SetupContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "oglSetup_intro",
          "OpenGL is a specification, not a library. There is no opengl.dll you link against that contains the modern functions — the implementation lives inside your graphics driver, and the entry points must be looked up at runtime. On top of that, OpenGL knows nothing about windows, keyboards or monitors. Two extra libraries fill those gaps, and this chapter sets both up."
        )}
      </p>

      <H2>{tx(t, "oglSetup_piecesTitle", "The three pieces")}</H2>
      <LessonTable
        headers={[tx(t, "oglSetup_h0", "Piece"), tx(t, "oglSetup_h1", "Provides"), tx(t, "oglSetup_h2", "Common choice")]}
        rows={[
          [tx(t, "oglSetup_p1", "Window + context"), tx(t, "oglSetup_p1b", "Creates the window, the OpenGL context, and delivers input events."), "GLFW, SDL3"],
          [tx(t, "oglSetup_p2", "Function loader"), tx(t, "oglSetup_p2b", "Resolves the driver's function pointers so glDrawArrays exists at all."), "GLAD, glew"],
          [tx(t, "oglSetup_p3", "Math"), tx(t, "oglSetup_p3b", "Vectors, matrices and the projection helpers. OpenGL has no math API."), "GLM"],
        ]}
      />

      <Callout type="info" t={t}>
        {tx(t, "oglSetup_loaderNote",
          "The loader is not optional and it is not a convenience. Your operating system ships headers for OpenGL 1.1 (Windows) or an old baseline (Linux, macOS). Everything added after that — every function in this track — has to be fetched from the driver by name at runtime. GLAD generates the code that does it."
        )}
      </Callout>

      <H2>{tx(t, "oglSetup_gladTitle", "Generating GLAD")}</H2>
      <p>
        {tx(t, "oglSetup_gladBody",
          "GLAD is generated, not downloaded. You pick the API version and profile on the generator page and it produces a header plus one C file tailored to exactly the functions that version exposes. For this track: OpenGL, version 4.6, Core profile."
        )}
      </p>

      <CodeBlock lang="bash" filename="project_layout.txt" t={t}>{`# What the generator gives you
include/glad/glad.h
include/KHR/khrplatform.h
src/glad.c          # compile this into your target like any other source file`}</CodeBlock>

      <H2>{tx(t, "oglSetup_cmakeTitle", "The build file")}</H2>
      <CodeBlock lang="cmake" filename="CMakeLists.txt" t={t}>{`cmake_minimum_required(VERSION 3.20)
project(GLApp LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(FetchContent)

FetchContent_Declare(glfw
    GIT_REPOSITORY https://github.com/glfw/glfw.git
    GIT_TAG        3.4)
set(GLFW_BUILD_DOCS     OFF CACHE BOOL "" FORCE)
set(GLFW_BUILD_TESTS    OFF CACHE BOOL "" FORCE)
set(GLFW_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(glfw)

FetchContent_Declare(glm
    GIT_REPOSITORY https://github.com/g-truc/glm.git
    GIT_TAG        1.0.1)
FetchContent_MakeAvailable(glm)

# GLAD is generated source — compile it directly
add_library(glad STATIC src/glad.c)
target_include_directories(glad PUBLIC include)

add_executable(app src/main.cpp)
target_link_libraries(app PRIVATE glad glfw glm::glm)`}</CodeBlock>

      <H2>{tx(t, "oglSetup_contextTitle", "Creating the context")}</H2>
      <p>
        {tx(t, "oglSetup_contextBody",
          "The window hints must be set before the window is created — they describe the context you want, and GLFW cannot change them afterwards. Requesting the Core profile is what removes the legacy API discussed in chapter one."
        )}
      </p>

      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`#include <glad/glad.h>      // MUST come before glfw3.h
#include <GLFW/glfw3.h>
#include <iostream>

int main() {
    if (!glfwInit()) {
        std::cerr << "glfwInit failed\\n";
        return 1;
    }

    // Describe the context BEFORE creating the window
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 4);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 6);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
    glfwWindowHint(GLFW_OPENGL_DEBUG_CONTEXT, GLFW_TRUE);   // enables the debug callback
#ifdef __APPLE__
    glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GLFW_TRUE);  // required on macOS
#endif

    GLFWwindow* window = glfwCreateWindow(1280, 720, "GLApp", nullptr, nullptr);
    if (!window) {
        std::cerr << "window creation failed — is 4.6 Core supported?\\n";
        glfwTerminate();
        return 1;
    }

    glfwMakeContextCurrent(window);   // the loader needs a current context
    glfwSwapInterval(1);              // vsync

    if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)) {
        std::cerr << "GLAD failed to load OpenGL\\n";
        return 1;
    }

    std::cout << "GL "     << glGetString(GL_VERSION)
              << " | "     << glGetString(GL_RENDERER) << std::endl;

    glViewport(0, 0, 1280, 720);
    return 0;
}`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "oglSetup_orderWarn",
          "Three ordering rules cause almost every setup failure. glad.h must be included before glfw3.h, or GLFW pulls in the system GL header first and you get hundreds of redefinition errors. glfwMakeContextCurrent must run before gladLoadGLLoader, because the loader queries the current context. And no gl* call is valid before the loader has run — calling one gives you a null function pointer crash."
        )}
      </Callout>

      <H2>{tx(t, "oglSetup_loopTitle", "The render loop and resizing")}</H2>
      <CodeBlock lang="cpp" filename="loop.cpp" t={t}>{`void framebufferSizeCallback(GLFWwindow*, int width, int height) {
    glViewport(0, 0, width, height);   // NDC maps to the new pixel rectangle
}

glfwSetFramebufferSizeCallback(window, framebufferSizeCallback);

float lastFrame = 0.0f;
while (!glfwWindowShouldClose(window)) {
    const float now = (float)glfwGetTime();
    const float dt  = now - lastFrame;
    lastFrame = now;

    if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
        glfwSetWindowShouldClose(window, true);

    glClearColor(0.06f, 0.07f, 0.10f, 1.0f);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

    // ... draw ...

    glfwSwapBuffers(window);
    glfwPollEvents();
}

glfwTerminate();`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "oglSetup_dpiTip",
          "Use the FRAMEBUFFER size callback, not the window size callback. On a high-DPI display the framebuffer is larger than the window in logical units — a 1280x720 window can have a 2560x1440 framebuffer — and glViewport works in pixels. Getting this wrong renders your scene into the bottom-left quarter of the screen on a Retina Mac."
        )}
      </Callout>

      <H3>{tx(t, "oglSetup_checkTitle", "Sanity check")}</H3>
      <p>
        {tx(t, "oglSetup_checkBody",
          "If the window opens and shows your clear colour, everything is wired correctly and you can move on. If it opens white or black, the clear colour is not being applied — check that glClear runs inside the loop and that glfwSwapBuffers is called after drawing, not before."
        )}
      </p>

    </article>
  );
}
