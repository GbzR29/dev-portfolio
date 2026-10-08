// src/lib/tracks/opengl/chapters/setup.tsx
"use client";

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { StateMachineFigure } from "@/components/lesson/figures/glintro/StateMachineFigure";
import { DoubleBufferFigure } from "@/components/lesson/figures/glintro/DoubleBufferFigure";

// ── Window & Context ──────────────────────────────────────────────────────────
// The three pieces (window library, loader, maths); what a context is and the
// state machine (bind points, object names, the forgotten-bind bug, figure);
// generating GLAD; the CMake file; creating a 4.6 Core context (hints, order
// rules, macOS 4.1); double buffering and vsync (figure); the render loop,
// line by line; resizing and high-DPI; the whole file and a sanity check;
// the same program with SDL3, SFML and LWJGL; the code-along roadmap of the
// next chapters; common mistakes.

export function SetupContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>

      <Lead>
        {tx(t, "oglSetup_intro",
          "OpenGL is a specification, not a library. There is no opengl.dll you link against that contains the modern functions — the implementation lives inside your graphics driver, and the entry points must be looked up at runtime. On top of that, OpenGL knows nothing about windows, keyboards or monitors. Two extra libraries fill those gaps, and this chapter sets both up."
        )}
      </Lead>

      <Goals t={t} id="oglSetup" items={[
        "Create a window and an OpenGL context with GLFW and GLAD.",
        "Set up the build with CMake.",
        "Write a render loop with double buffering, vsync and resizing.",
        "Know what each later chapter adds to main.cpp.",
      ]} />

      <Callout type="info" t={t}>
        {tx(t, "oglSetup_stackNote",
          "What this track uses: C++, with GLFW for the window, GLAD to load the OpenGL functions and GLM for the maths, built with CMake. It is the most common combination in books and tutorials, so it is the one you will find answers for most easily. If you already use SDL, SFML or Java with LWJGL, keep it: only about ten lines, the ones that create the window and run the loop, are different. The section \"Using another window library\" near the end shows them side by side. Every gl… call, and every shader, is exactly the same in all of them.")}
      </Callout>

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

      <H2>{tx(t, "oglSetup_ctxWhatTitle", "What a context is")}</H2>
      <p>
        {tx(t, "oglSetup_ctxWhatBody",
          "Every OpenGL call acts on a context: a large block of state that the driver keeps for your program. It contains every object you create (buffers, textures, shaders), every setting (the clear colour, the viewport, whether depth testing is on) and the connection to one window's framebuffer. A context is current on one thread at a time; OpenGL calls made on a thread with no current context do nothing, or crash. The window library creates the context together with the window, and glfwMakeContextCurrent makes it current on the calling thread.")}
      </p>
      <p>
        {tx(t, "oglSetup_stateBody",
          "The context works as a state machine: most calls do not produce an effect by themselves, they change a stored value that later calls read. Objects are referred to by names, plain unsigned integers (GLuint) that glGen* hands out; 0 always means \"no object\". To work on an object you first bind it to a bind point (a named slot such as GL_ARRAY_BUFFER), and then calls that mention only the bind point, such as glBufferData, act on whatever object is bound there. Step through the two little programs below and watch the state change.")}
      </p>

      <StateMachineFigure t={t} />

      <LessonTable
        headers={[tx(t, "oglSetup_tTerm", "Term"), tx(t, "oglSetup_tMeans", "Meaning")]}
        rows={[
          [tx(t, "oglSetup_s1", "Object name"), tx(t, "oglSetup_s1b", "a GLuint that identifies an object inside the context, such as 1 or 2. It is not a pointer and means nothing in another context.")],
          [tx(t, "oglSetup_s2", "Bind point (target)"), tx(t, "oglSetup_s2b", "a slot in the context, such as GL_ARRAY_BUFFER or GL_TEXTURE_2D, that holds one object name at a time.")],
          [tx(t, "oglSetup_s3", "Bind"), tx(t, "oglSetup_s3b", "glBind*(target, name): put the object in the slot. It stays there until another bind replaces it; binding 0 empties the slot.")],
          [tx(t, "oglSetup_s4", "State setter"), tx(t, "oglSetup_s4b", "a call such as glClearColor or glEnable(GL_DEPTH_TEST) that stores a value used by later calls, until you change it again.")],
        ]}
      />

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

      <Callout type="tip" t={t}>
        {tx(t, "oglSetup_glad2Tip",
          "There are two versions of GLAD. This track uses GLAD 1 (generator at glad.dav1d.de): header glad/glad.h, loaded with gladLoadGLLoader((GLADloadproc)glfwGetProcAddress). The newer GLAD 2 (gen.glad.sh) works the same way but names things differently: header glad/gl.h and the call gladLoadGL(glfwGetProcAddress). Either works; just do not mix the header of one with the call of the other.")}
      </Callout>

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
    // macOS stops at OpenGL 4.1: asking for 4.6 makes glfwCreateWindow fail
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 1);
    glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GLFW_TRUE);  // required for any Core context on macOS
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

      <Callout type="info" t={t}>
        {tx(t, "oglSetup_macNote",
          "On macOS, OpenGL ends at version 4.1. Apple deprecated it in 2018 and never shipped anything newer, so a 4.6 request simply fails. There, write #version 410 core in your shaders and expect some chapters of this track not to run: the debug callback, compute shaders and SSBOs need 4.3, layout(binding = …) needs 4.2, persistent mapping 4.4 and DSA 4.5. The concepts all carry over, and Windows and Linux drivers support 4.6 on any GPU from the last decade."
        )}
      </Callout>

      <H2>{tx(t, "oglSetup_bufTitle", "Double buffering and vsync")}</H2>
      <p>
        {tx(t, "oglSetup_bufBody",
          "A monitor does not show a picture all at once: 60 or more times per second it reads the image from memory line by line, top to bottom. If a program drew straight into the image being read, the viewer would see it half drawn: the clear colour flashing, objects appearing one by one. So the window has two images, the front buffer, which the monitor shows, and the back buffer, into which every OpenGL draw goes. When the frame is complete, glfwSwapBuffers exchanges them. glfwSwapInterval(1) turns on vsync: the swap waits for the vertical blank, the moment the monitor has finished one picture and returns to the top. Without it (interval 0) the swap happens immediately, possibly in the middle of a scan, and the top and bottom of the screen show different frames: a tear.")}
      </p>

      <DoubleBufferFigure t={t} />

      <p>
        {tx(t, "oglSetup_bufAfter",
          "Vsync also paces the program. With interval 1, glfwSwapBuffers blocks until the next vertical blank, so a 60 Hz monitor lets the loop run at most 60 times per second, which saves power and heat. With interval 0 the loop runs as fast as it can, useful for measuring performance but wasteful otherwise. The Vulkan track's swapchain chapter goes deeper into the same trade-offs (FIFO, mailbox, immediate).")}
      </p>

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

      <LessonTable
        headers={[tx(t, "oglSetup_tLine", "Line"), tx(t, "oglSetup_tDoes", "What it does")]}
        rows={[
          ["glfwWindowShouldClose", tx(t, "oglSetup_l1", "true once the user has clicked the close button (or the program asked to close). The loop runs one frame per iteration until then.")],
          ["glfwGetTime / dt", tx(t, "oglSetup_l2", "seconds since glfwInit, as a double. The difference from the previous frame, dt (delta time), is how long the last frame took; movement multiplied by dt runs at the same speed at any frame rate.")],
          ["glfwGetKey", tx(t, "oglSetup_l3", "the current state of one key, GLFW_PRESS or GLFW_RELEASE, as of the last glfwPollEvents.")],
          ["glClearColor + glClear", tx(t, "oglSetup_l4", "glClearColor stores the colour (red, green, blue, alpha, each 0 to 1); glClear fills the back buffer with it. GL_DEPTH_BUFFER_BIT also resets the depth buffer, which the Depth Testing chapter needs.")],
          ["glfwSwapBuffers", tx(t, "oglSetup_l5", "shows the finished back buffer, as in the figure above, waiting for vsync if it is on.")],
          ["glfwPollEvents", tx(t, "oglSetup_l6", "processes the operating system's queued events (keys, mouse, resize, close) and calls your callbacks. Without it the window stops responding.")],
          ["glfwTerminate", tx(t, "oglSetup_l7", "destroys the remaining windows and their contexts and frees GLFW's resources.")],
        ]}
      />

      <Callout type="tip" t={t}>
        {tx(t, "oglSetup_dpiTip",
          "Use the FRAMEBUFFER size callback, not the window size callback. On a high-DPI display the framebuffer is larger than the window in logical units — a 1280x720 window can have a 2560x1440 framebuffer — and glViewport works in pixels. Getting this wrong renders your scene into the bottom-left quarter of the screen on a Retina Mac."
        )}
      </Callout>

      <H2>{tx(t, "oglSetup_fullTitle", "The whole file")}</H2>
      <p>
        {tx(t, "oglSetup_fullBody",
          "The pieces above, joined into one main.cpp that compiles with the CMake file from this chapter. This is your project at the end of this chapter: a window that opens, shows a dark blue-grey colour and closes with Esc. The next chapters add to this same file; the comment // ... draw ... marks where the drawing will go.")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp" t={t}>{`#include <glad/glad.h>      // MUST come before glfw3.h
#include <GLFW/glfw3.h>
#include <iostream>

// Called by GLFW whenever the framebuffer changes size (in pixels)
void framebufferSizeCallback(GLFWwindow*, int width, int height) {
    glViewport(0, 0, width, height);
}

int main() {
    // ── 1. Window library and context ────────────────────────────────────────
    if (!glfwInit()) {
        std::cerr << "glfwInit failed\\n";
        return 1;
    }
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 4);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 6);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
#ifdef __APPLE__
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 1);
    glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GLFW_TRUE);
#endif

    GLFWwindow* window = glfwCreateWindow(1280, 720, "GLApp", nullptr, nullptr);
    if (!window) {
        std::cerr << "window creation failed\\n";
        glfwTerminate();
        return 1;
    }
    glfwMakeContextCurrent(window);
    glfwSwapInterval(1);                                        // vsync

    // ── 2. Load the OpenGL functions (no gl* call before this) ───────────────
    if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)) {
        std::cerr << "GLAD failed to load OpenGL\\n";
        return 1;
    }
    std::cout << "GL " << glGetString(GL_VERSION) << "\\n";

    // ── 3. Viewport, now and on every resize ─────────────────────────────────
    int fbw, fbh;
    glfwGetFramebufferSize(window, &fbw, &fbh);                 // pixels, not window units
    glViewport(0, 0, fbw, fbh);
    glfwSetFramebufferSizeCallback(window, framebufferSizeCallback);

    // ── 4. One-time setup: shaders, buffers (next chapters) ──────────────────

    // ── 5. The render loop: input, clear, draw, swap, poll ───────────────────
    while (!glfwWindowShouldClose(window)) {
        if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
            glfwSetWindowShouldClose(window, true);

        glClearColor(0.06f, 0.07f, 0.10f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

        // ... draw ...

        glfwSwapBuffers(window);
        glfwPollEvents();
    }

    // ── 6. Clean up ──────────────────────────────────────────────────────────
    glfwTerminate();
    return 0;
}`}</CodeBlock>

      <H3>{tx(t, "oglSetup_checkTitle", "Sanity check")}</H3>
      <p>
        {tx(t, "oglSetup_checkBody",
          "If the window opens and shows your clear colour, everything is wired correctly and you can move on. If it opens white or black, the clear colour is not being applied — check that glClear runs inside the loop and that glfwSwapBuffers is called after drawing, not before."
        )}
      </p>

      <H2>{tx(t, "oglSetup_otherTitle", "Using another window library")}</H2>
      <p>
        {tx(t, "oglSetup_otherBody",
          "GLFW does only four jobs in this program: it creates the window and the context, tells GLAD where to find the OpenGL functions, shows the finished frame, and delivers events such as keys, resizes and the close button. Every other line is plain OpenGL and does not care which library opened the window. So if you use SDL, SFML or LWJGL, replace only the lines in this table and copy the rest of each chapter unchanged.")}
      </p>
      <LessonTable
        headers={[tx(t, "oglSetup_oJob", "Job"), "GLFW", "SDL3", "SFML 3"]}
        rows={[
          [tx(t, "oglSetup_o1", "Ask for 4.6 Core"), "glfwWindowHint", "SDL_GL_SetAttribute", "sf::ContextSettings"],
          [tx(t, "oglSetup_o2", "Create window + context"), "glfwCreateWindow, glfwMakeContextCurrent", "SDL_CreateWindow, SDL_GL_CreateContext", "sf::Window(…, settings)"],
          [tx(t, "oglSetup_o3", "Address for GLAD"), "glfwGetProcAddress", "SDL_GL_GetProcAddress", "sf::Context::getFunction"],
          [tx(t, "oglSetup_o4", "Vsync"), "glfwSwapInterval(1)", "SDL_GL_SetSwapInterval(1)", "setVerticalSyncEnabled(true)"],
          [tx(t, "oglSetup_o5", "Show the frame"), "glfwSwapBuffers", "SDL_GL_SwapWindow", "window.display()"],
          [tx(t, "oglSetup_o6", "Events and closing"), "glfwPollEvents", "SDL_PollEvent", "window.pollEvent()"],
          [tx(t, "oglSetup_o7", "Size in pixels"), "glfwGetFramebufferSize", "SDL_GetWindowSizeInPixels", "window.getSize()"],
        ]}
      />
      <p>
        {tx(t, "oglSetup_otherSdl",
          "The same program with SDL3. Note the order is the same as with GLFW: describe the context, create the window, create the context (SDL makes it current at once), load GLAD, and only then call OpenGL.")}
      </p>
      <CodeBlock lang="cpp" filename="main_sdl3.cpp" t={t}>{`#include <glad/glad.h>
#include <SDL3/SDL.h>

int main(int, char**) {
    SDL_Init(SDL_INIT_VIDEO);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_MAJOR_VERSION, 4);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_MINOR_VERSION, 6);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_PROFILE_MASK, SDL_GL_CONTEXT_PROFILE_CORE);

    SDL_Window* window = SDL_CreateWindow("GLApp", 1280, 720,
                                          SDL_WINDOW_OPENGL | SDL_WINDOW_RESIZABLE);
    SDL_GLContext context = SDL_GL_CreateContext(window);    // also makes it current
    gladLoadGLLoader((GLADloadproc)SDL_GL_GetProcAddress);
    SDL_GL_SetSwapInterval(1);

    bool running = true;
    while (running) {
        SDL_Event e;
        while (SDL_PollEvent(&e)) {
            if (e.type == SDL_EVENT_QUIT) running = false;
            if (e.type == SDL_EVENT_WINDOW_PIXEL_SIZE_CHANGED)
                glViewport(0, 0, e.window.data1, e.window.data2);
        }
        glClearColor(0.06f, 0.07f, 0.10f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
        // ... draw: identical to the GLFW version ...
        SDL_GL_SwapWindow(window);
    }

    SDL_GL_DestroyContext(context);
    SDL_DestroyWindow(window);
    SDL_Quit();
    return 0;
}`}</CodeBlock>
      <p>
        {tx(t, "oglSetup_otherSfml",
          "With SFML, use sf::Window, not sf::RenderWindow: the plain window gives you an OpenGL context without SFML's own 2D drawing state getting in the way.")}
      </p>
      <CodeBlock lang="cpp" filename="main_sfml.cpp" t={t}>{`#include <glad/glad.h>
#include <SFML/Window.hpp>

int main() {
    sf::ContextSettings settings;
    settings.majorVersion   = 4;
    settings.minorVersion   = 6;
    settings.attributeFlags = sf::ContextSettings::Attribute::Core;
    settings.depthBits      = 24;

    sf::Window window(sf::VideoMode({1280, 720}), "GLApp",
                      sf::Style::Default, sf::State::Windowed, settings);
    window.setVerticalSyncEnabled(true);
    window.setActive(true);                                     // make the context current
    gladLoadGLLoader((GLADloadproc)sf::Context::getFunction);

    while (window.isOpen()) {
        while (const std::optional event = window.pollEvent()) {
            if (event->is<sf::Event::Closed>()) window.close();
            if (const auto* r = event->getIf<sf::Event::Resized>())
                glViewport(0, 0, r->size.x, r->size.y);
        }
        glClearColor(0.06f, 0.07f, 0.10f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
        // ... draw: identical to the GLFW version ...
        window.display();
    }
}`}</CodeBlock>
      <p>
        {tx(t, "oglSetup_otherLwjgl",
          "LWJGL (Java, and Kotlin) wraps GLFW itself, so the window code is almost word for word the GLFW code, with long window instead of GLFWwindow*. It needs no GLAD: GL.createCapabilities(), called after glfwMakeContextCurrent, does the loader's job. With import static org.lwjgl.opengl.GL46C.*; the gl… calls keep their C names. The differences you will meet are in how data is passed: glGenBuffers() returns the name instead of writing it into a variable, and arrays go in as Java arrays or FloatBuffers instead of pointers with a size in bytes. The shaders are the same text, character for character.")}
      </p>

      <H2>{tx(t, "oglSetup_alongTitle", "Coding along: what each chapter adds")}</H2>
      <p>
        {tx(t, "oglSetup_alongBody2",
          "The rest of this section builds one program: first the coloured triangle, then a square, then a square with an image on it. Each chapter explains a single piece, so for a while you will be adding code whose result you cannot see yet. That is expected. This is what each chapter adds to the main.cpp above, and what you should see when you run it.")}
      </p>
      <LessonTable
        headers={[tx(t, "oglSetup_aCh", "Chapter"), tx(t, "oglSetup_aAdds", "Adds to main.cpp"), tx(t, "oglSetup_aSee", "What you see")]}
        rows={[
          [tx(t, "oglSetup_a1", "Window & Context (this one)"), tx(t, "oglSetup_a1b", "the window, the context, GLAD and the loop"), tx(t, "oglSetup_a1c", "a window filled with the clear colour")],
          [tx(t, "oglSetup_a2", "The Graphics Pipeline"), tx(t, "oglSetup_a2b", "the two shaders as text, compiled and linked into a program (step 4)"), tx(t, "oglSetup_a2c", "the same window; the console prints any shader error")],
          [tx(t, "oglSetup_a3", "Vertex Buffer Objects"), tx(t, "oglSetup_a3b", "the vertex array, copied into a buffer on the GPU (step 4)"), tx(t, "oglSetup_a3c", "no change yet")],
          [tx(t, "oglSetup_a4", "Vertex Array Objects"), tx(t, "oglSetup_a4b", "the description of the vertex layout, glVertexAttribPointer (step 4)"), tx(t, "oglSetup_a4c", "no change yet")],
          [tx(t, "oglSetup_a5", "First Shaders"), tx(t, "oglSetup_a5b2", "the compileShader and makeProgram helpers above main; step 4a becomes one call"), tx(t, "oglSetup_a5c2", "no change yet, but a shader error now prints its line and closes the program")],
          [tx(t, "oglSetup_a6", "Drawing the Triangle"), tx(t, "oglSetup_a6b", "glUseProgram, glBindVertexArray and glDrawArrays inside the loop (step 5)"), tx(t, "oglSetup_a6c", "the coloured triangle; the chapter also shows the complete file")],
          [tx(t, "oglSetup_a7", "Indexed Drawing (EBO)"), tx(t, "oglSetup_a7b", "4 vertices and an index list instead of the triangle, an EBO, glDrawElements"), tx(t, "oglSetup_a7c", "a square with a colour in each corner")],
          [tx(t, "oglSetup_a8", "Textures"), tx(t, "oglSetup_a8b", "stb_image, an image file, (u, v) per vertex, a loadTexture helper, the texture bound in the loop"), tx(t, "oglSetup_a8c", "your image on the square")],
        ]}
      />
      <p>
        {tx(t, "oglSetup_alongCheck",
          "From Vertex Buffer Objects on, every one of these chapters ends with \"Your main.cpp so far\": the whole file, with the new parts marked NEW, to compare with yours.")}
      </p>

      <H2>{tx(t, "oglSetup_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "oglSetup_tMistake", "Mistake"), tx(t, "oglSetup_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "oglSetup_e1", "Calling gl functions before gladLoadGLLoader"), tx(t, "oglSetup_e1b", "the function pointers are still null, so the first call crashes. Create the window, make the context current, load GLAD, then use OpenGL.")],
          [tx(t, "oglSetup_e2", "Including glfw3.h before glad.h"), tx(t, "oglSetup_e2b", "the system's old gl.h is pulled in first and GLAD reports redefinitions. Include glad.h first, or define GLFW_INCLUDE_NONE.")],
          [tx(t, "oglSetup_e3", "Calling OpenGL from another thread"), tx(t, "oglSetup_e3b", "that thread has no current context, so calls are ignored or crash. Keep all OpenGL calls on the thread that made the context current.")],
          [tx(t, "oglSetup_e4", "Forgetting a bind"), tx(t, "oglSetup_e4b", "the call acts on whatever was bound before, silently, as in the state-machine figure. Bind right before the calls that depend on it, or use DSA (4.5).")],
          [tx(t, "oglSetup_e5", "Using the window size for glViewport"), tx(t, "oglSetup_e5b", "on high-DPI screens the picture fills only part of the window. Use the framebuffer size callback or glfwGetFramebufferSize.")],
          [tx(t, "oglSetup_e6", "Not calling glfwPollEvents"), tx(t, "oglSetup_e6b", "the operating system marks the window as not responding and input never arrives. Call it once per frame.")],
          [tx(t, "oglSetup_e7", "Drawing after glfwSwapBuffers"), tx(t, "oglSetup_e7b", "those draws land in the next back buffer and are cleared before being seen. Order: clear, draw, swap, poll.")],
        ]}
      />

      <KeyIdeas t={t} id="oglSetup" items={[
        "OpenGL needs three helpers: a window library that creates the context (GLFW), a loader that fetches the driver's functions (GLAD) and a maths library (GLM).",
        "A context holds all of OpenGL's state and objects and is current on one thread at a time.",
        "OpenGL is a state machine: objects are named by GLuints, bound to bind points, and many calls act on whatever is currently bound.",
        "Request a 4.6 Core context with window hints before creating the window; macOS stops at 4.1.",
        "Order matters: include glad.h first, make the context current, then load GLAD, then call OpenGL.",
        "Draw into the back buffer and swap; vsync (glfwSwapInterval(1)) waits for the vertical blank, so frames never tear and the loop is paced to the display.",
        "Each frame: measure dt, handle input, clear, draw, swap, poll events; set glViewport from the framebuffer size, in pixels.",
        "Only the window code depends on the library (GLFW, SDL, SFML, LWJGL); every gl… call and every shader is the same in all of them.",
      ]} />

    </Article>
  );
}
