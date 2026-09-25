"use client";

// SDL3 track — "Setup & First Window".

import { TrackTranslations } from "@/lib/tracks/types";
import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";

export function SetupContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "sdl02_intro",
          "Getting SDL3 into a project is the part most tutorials handle badly. The recommended path today is CMake plus FetchContent: no system install, no hunting for development packages, and the exact version you pinned is what every machine builds."
        )}
      </p>

      <H2>{tx(t, "sdl02_cmakeTitle", "The build file")}</H2>

      <CodeBlock lang="cmake" filename="CMakeLists.txt" t={t}>{`cmake_minimum_required(VERSION 3.28)
project(SDL3Game LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(FetchContent)
FetchContent_Declare(SDL3
    GIT_REPOSITORY https://github.com/libsdl-org/SDL.git
    GIT_TAG        release-3.2.0      # pin a tag — never track main
    GIT_SHALLOW    TRUE)
FetchContent_MakeAvailable(SDL3)

add_executable(game src/main.cpp)
target_link_libraries(game PRIVATE SDL3::SDL3)

# On Windows, copy the DLL next to the executable so it runs from the IDE
if (WIN32)
    add_custom_command(TARGET game POST_BUILD
        COMMAND \${CMAKE_COMMAND} -E copy_if_different
                $<TARGET_FILE:SDL3::SDL3> $<TARGET_FILE_DIR:game>)
endif()`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "sdl02_installTip",
          "If SDL3 is already installed on the system (vcpkg, a distro package, or a manual build), replace the FetchContent block with find_package(SDL3 REQUIRED). The target name SDL3::SDL3 is the same either way, so the rest of the file never changes."
        )}
      </Callout>

      <H2>{tx(t, "sdl02_windowTitle", "A window that closes properly")}</H2>

      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`#include <SDL3/SDL.h>
#include <SDL3/SDL_main.h>     // must be included in the file with main()

int main(int argc, char* argv[]) {
    if (!SDL_Init(SDL_INIT_VIDEO)) {
        SDL_Log("SDL_Init failed: %s", SDL_GetError());
        return 1;
    }

    SDL_Window*   window   = nullptr;
    SDL_Renderer* renderer = nullptr;

    // Creates both in one call and pairs them correctly
    if (!SDL_CreateWindowAndRenderer("SDL3 Window", 1280, 720,
                                     SDL_WINDOW_RESIZABLE,
                                     &window, &renderer)) {
        SDL_Log("CreateWindowAndRenderer failed: %s", SDL_GetError());
        SDL_Quit();
        return 1;
    }

    bool running = true;
    while (running) {
        SDL_Event e;
        while (SDL_PollEvent(&e)) {
            if (e.type == SDL_EVENT_QUIT) running = false;
        }

        SDL_SetRenderDrawColor(renderer, 16, 18, 26, 255);
        SDL_RenderClear(renderer);
        SDL_RenderPresent(renderer);
    }

    SDL_DestroyRenderer(renderer);
    SDL_DestroyWindow(window);
    SDL_Quit();
    return 0;
}`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "sdl02_mainWarn",
          "SDL_main.h must be included in exactly one file — the one containing main. It redefines main to SDL_main so SDL can install the platform entry point it needs on Windows, iOS and Android. Skipping it produces a program that links but never starts on Windows, or an unresolved WinMain error."
        )}
      </Callout>

      <H2>{tx(t, "sdl02_subsysTitle", "Subsystems and initialization")}</H2>
      <LessonTable
        headers={[tx(t, "sdl02_h0", "Flag"), tx(t, "sdl02_h1", "Initializes")]}
        rows={[
          ["SDL_INIT_VIDEO",   tx(t, "sdl02_s1", "Windows, the display list, and the event system it depends on.")],
          ["SDL_INIT_AUDIO",   tx(t, "sdl02_s2", "Audio devices and streams.")],
          ["SDL_INIT_GAMEPAD", tx(t, "sdl02_s3", "Gamepads. Implies the joystick subsystem.")],
          ["SDL_INIT_HAPTIC",  tx(t, "sdl02_s4", "Force feedback and rumble devices.")],
          ["SDL_INIT_CAMERA",  tx(t, "sdl02_s5", "Webcam capture — new in SDL3.")],
        ]}
      />

      <p>
        {tx(t, "sdl02_subsysBody",
          "Combine flags with a bitwise or. There is no SDL_INIT_TIMER any more — timing is always available. Subsystems can also be started later with SDL_InitSubSystem, which is worth doing for audio so a machine with no sound device does not block your window from opening."
        )}
      </p>

      <H2>{tx(t, "sdl02_raiiTitle", "Wrapping it in RAII")}</H2>
      <p>
        {tx(t, "sdl02_raiiBody",
          "SDL is a C API, so every Create has a matching Destroy that you must call on every exit path. A unique_ptr with a stateless deleter removes that burden completely and costs nothing at runtime."
        )}
      </p>

      <CodeBlock lang="cpp" filename="sdl_raii.hpp" t={t}>{`#include <memory>
#include <SDL3/SDL.h>

struct SDLDeleter {
    void operator()(SDL_Window*   w) const noexcept { SDL_DestroyWindow(w); }
    void operator()(SDL_Renderer* r) const noexcept { SDL_DestroyRenderer(r); }
    void operator()(SDL_Texture*  t) const noexcept { SDL_DestroyTexture(t); }
    void operator()(SDL_Surface*  s) const noexcept { SDL_DestroySurface(s); }
};

using WindowPtr   = std::unique_ptr<SDL_Window,   SDLDeleter>;
using RendererPtr = std::unique_ptr<SDL_Renderer, SDLDeleter>;
using TexturePtr  = std::unique_ptr<SDL_Texture,  SDLDeleter>;

// SDL_Init / SDL_Quit as a scope guard
struct SDLContext {
    explicit SDLContext(SDL_InitFlags flags) {
        if (!SDL_Init(flags)) throw std::runtime_error(SDL_GetError());
    }
    ~SDLContext() { SDL_Quit(); }
    SDLContext(const SDLContext&) = delete;
    SDLContext& operator=(const SDLContext&) = delete;
};`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "sdl02_orderTip",
          "Destruction order matters: the renderer must die before the window, and every texture before its renderer. Declaring the members in creation order inside a class gives you that for free, because C++ destroys members in reverse declaration order."
        )}
      </Callout>

    </article>
  );
}
