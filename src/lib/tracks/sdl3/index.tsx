// src/lib/tracks/sdl3/index.tsx
"use client";

import { Track, TrackTranslations } from "@/lib/tracks/types";
import {
  CodeBlock, Callout, H2, LessonTable,
} from "@/components/lesson/LessonComponents";

// tx: returns translated string or English fallback. Never shows a key name.
function tx(t: TrackTranslations, key: string, fallback: string): string {
  const val = t?.[key];
  return val && val.length > 0 ? val : fallback;
}

// ── Chapter 01: SDL3 vs SDL2 ─────────────────────────────────────────────────

function WhatsNewContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "sdl01_intro",
          "SDL is the layer between your game and the operating system: it opens the window, reads the keyboard, plays the audio and hands you a graphics context. SDL 3.2.0 — released in January 2025 — was the first stable SDL3, and it is not a drop-in upgrade from SDL2. This chapter covers what changed, because almost every tutorial you will find online is still written for SDL2."
        )}
      </p>

      <H2>{tx(t, "sdl01_whyTitle", "Why a new major version")}</H2>
      <p>
        {tx(t, "sdl01_whyBody",
          "SDL2 shipped in 2013 and kept ABI compatibility for over a decade, which meant a decade of accumulated inconsistencies that could never be fixed. SDL3 spent that compatibility budget once: it normalized the naming, made the return conventions consistent, added a modern GPU abstraction, and restructured the main loop so the same code runs on desktop, mobile and the web."
        )}
      </p>

      <H2>{tx(t, "sdl01_tableTitle", "The changes that break your code")}</H2>
      <LessonTable
        headers={["SDL2", "SDL3", tx(t, "sdl01_h2", "Why")]}
        rows={[
          ["int SDL_Init(...) == 0",  "bool SDL_Init(...) == true", tx(t, "sdl01_r1", "Every function that could fail now returns bool. true is success.")],
          ["SDL_bool / SDL_TRUE",     "bool / true",                tx(t, "sdl01_r2", "SDL3 requires C99+, so the real bool type is used.")],
          ["SDL_CreateWindow(t,x,y,w,h,f)", "SDL_CreateWindow(t,w,h,f)", tx(t, "sdl01_r3", "Position is set separately or left to the window manager.")],
          ["SDL_Rect (int)",          "SDL_FRect (float)",          tx(t, "sdl01_r4", "The 2D renderer is float-based end to end — smooth camera motion, no rounding.")],
          ["SDL_QUIT",                "SDL_EVENT_QUIT",             tx(t, "sdl01_r5", "All event enumerators got the SDL_EVENT_ prefix.")],
          ["event.key.keysym.sym",    "event.key.key",              tx(t, "sdl01_r6", "The keysym struct was flattened into the event.")],
          ["SDL_RenderCopy",          "SDL_RenderTexture",          tx(t, "sdl01_r7", "Renderer functions renamed to say what they draw.")],
          ["SDL_FreeSurface",         "SDL_DestroySurface",         tx(t, "sdl01_r8", "Destroy is now used consistently for every SDL object.")],
          ["SDL_GetTicks() (ms, u32)","SDL_GetTicksNS() (ns, u64)", tx(t, "sdl01_r9", "Nanosecond timing, no 49-day wraparound.")],
          [tx(t, "sdl01_r10k", "— (did not exist)"), "SDL_GPU",     tx(t, "sdl01_r10", "A portable modern graphics API over Vulkan, D3D12 and Metal.")],
        ]}
      />

      <CodeBlock lang="cpp" filename="convention.cpp" t={t}>{`// SDL2 — 0 means success, negative means failure (the C convention)
if (SDL_Init(SDL_INIT_VIDEO) != 0) {
    SDL_Log("error: %s", SDL_GetError());
    return 1;
}

// SDL3 — true means success. This is the single most common porting bug:
// old code compiles fine and takes the wrong branch.
if (!SDL_Init(SDL_INIT_VIDEO)) {
    SDL_Log("error: %s", SDL_GetError());
    return 1;
}`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "sdl01_portWarn",
          "That return-value flip is silent. A ported SDL2 codebase will compile without a single warning and then behave as if every call failed — or worse, as if every call succeeded. When migrating, grep for every SDL call in a condition before you try to run anything."
        )}
      </Callout>

      <H2>{tx(t, "sdl01_newTitle", "What is genuinely new")}</H2>
      <ul className="space-y-3 ml-1">
        {[
          [tx(t, "sdl01_n1t", "SDL_GPU"), tx(t, "sdl01_n1b", "A command-buffer graphics API that targets Vulkan, Direct3D 12 and Metal from one source. It is the reason many people are moving to SDL3 at all.")],
          [tx(t, "sdl01_n2t", "Main callbacks"), tx(t, "sdl01_n2b", "Instead of owning the while loop, you provide four functions and SDL drives them. This is what makes the same code work on iOS, Android and Emscripten unchanged.")],
          [tx(t, "sdl01_n3t", "Properties"), tx(t, "sdl01_n3b", "A generic key-value store on every SDL object, which is how SDL3 adds platform-specific options without adding a hundred functions.")],
          [tx(t, "sdl01_n4t", "Storage abstraction"), tx(t, "sdl01_n4b", "Title storage for read-only game data and user storage for saves, so console certification requirements stop being a porting rewrite.")],
          [tx(t, "sdl01_n5t", "Camera and async I/O"), tx(t, "sdl01_n5b", "Webcam capture and asynchronous file reads are now part of the core library.")],
        ].map(([title, body], i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center font-mono text-[9px] font-bold text-emerald-500 mt-0.5">
              {i + 1}
            </span>
            <span>
              <strong className="text-[var(--text-main)] text-sm">{title}. </strong>
              {body}
            </span>
          </li>
        ))}
      </ul>

      <Callout type="tip" t={t}>
        {tx(t, "sdl01_migTip",
          "SDL ships an official migration document (docs/README-migration.md in the repository) that lists every renamed and removed function. It is the only reliable reference for porting — keep it open in a tab rather than guessing from the new headers."
        )}
      </Callout>

      <Callout type="info" t={t}>
        {tx(t, "sdl01_versionNote",
          "The 3.2.x line is the ABI-stable branch and the project ships point releases regularly, with satellite libraries (SDL3_image, SDL3_ttf, SDL3_mixer) versioned independently. Check the release notes for the version you install — SDL adds functions between point releases, so a snippet that fails to compile is usually a version gap rather than a mistake."
        )}
      </Callout>

    </article>
  );
}

// ── Chapter 02: Setup & First Window ─────────────────────────────────────────

function SetupContent({ t }: { t: TrackTranslations }) {
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

// ── Chapter 03: The Main Loop ────────────────────────────────────────────────

function MainLoopContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "sdl03_intro",
          "The classic game loop owns the process: your while loop runs until the player quits. That model breaks on platforms where the operating system owns the loop and calls you — the browser, iOS and Android all work that way. SDL3's main callbacks invert the control flow so one source file runs everywhere."
        )}
      </p>

      <H2>{tx(t, "sdl03_problemTitle", "Why the while loop is a portability problem")}</H2>
      <p>
        {tx(t, "sdl03_problemBody",
          "In a browser, JavaScript is single-threaded and the page must return to the event loop for anything to be drawn. A C++ while(true) loop compiled to WebAssembly freezes the tab. Emscripten's workaround is to hand your loop body to requestAnimationFrame, which is exactly what SDL3's callbacks standardize."
        )}
      </p>

      <H2>{tx(t, "sdl03_callbacksTitle", "The four callbacks")}</H2>
      <LessonTable
        headers={[tx(t, "sdl03_h0", "Function"), tx(t, "sdl03_h1", "Called")]}
        rows={[
          ["SDL_AppInit",    tx(t, "sdl03_c1", "Once at startup. Allocate your state and store it through appstate.")],
          ["SDL_AppEvent",   tx(t, "sdl03_c2", "Once per event, as they arrive. No polling loop of your own.")],
          ["SDL_AppIterate", tx(t, "sdl03_c3", "Once per frame. Update and render here.")],
          ["SDL_AppQuit",    tx(t, "sdl03_c4", "Once at shutdown, whatever caused it. Free everything.")],
        ]}
      />

      <p>
        {tx(t, "sdl03_returnBody",
          "Every callback returns an SDL_AppResult: SDL_APP_CONTINUE to keep running, SDL_APP_SUCCESS to exit cleanly, SDL_APP_FAILURE to exit with an error. There is no global running flag and no manual break."
        )}
      </p>

      <CodeBlock lang="cpp" filename="main_callbacks.cpp" t={t}>{`#define SDL_MAIN_USE_CALLBACKS 1     // must come before SDL_main.h
#include <SDL3/SDL.h>
#include <SDL3/SDL_main.h>

struct AppState {
    SDL_Window*   window   = nullptr;
    SDL_Renderer* renderer = nullptr;
    Uint64        lastTick = 0;
    float         x        = 0.0f;
};

SDL_AppResult SDL_AppInit(void** appstate, int argc, char* argv[]) {
    if (!SDL_Init(SDL_INIT_VIDEO)) {
        SDL_Log("init: %s", SDL_GetError());
        return SDL_APP_FAILURE;
    }

    auto* app = new AppState{};
    if (!SDL_CreateWindowAndRenderer("Callbacks", 1280, 720, 0,
                                     &app->window, &app->renderer)) {
        delete app;
        return SDL_APP_FAILURE;
    }
    app->lastTick = SDL_GetTicksNS();

    *appstate = app;         // SDL hands this back to every other callback
    return SDL_APP_CONTINUE;
}

SDL_AppResult SDL_AppEvent(void* appstate, SDL_Event* event) {
    if (event->type == SDL_EVENT_QUIT) return SDL_APP_SUCCESS;
    if (event->type == SDL_EVENT_KEY_DOWN && event->key.key == SDLK_ESCAPE)
        return SDL_APP_SUCCESS;
    return SDL_APP_CONTINUE;
}

SDL_AppResult SDL_AppIterate(void* appstate) {
    auto* app = static_cast<AppState*>(appstate);

    const Uint64 now = SDL_GetTicksNS();
    const float  dt  = float(now - app->lastTick) / 1e9f;
    app->lastTick = now;

    app->x += 240.0f * dt;
    if (app->x > 1280.0f) app->x = -100.0f;

    SDL_SetRenderDrawColor(app->renderer, 16, 18, 26, 255);
    SDL_RenderClear(app->renderer);

    SDL_FRect box{app->x, 300.0f, 100.0f, 100.0f};
    SDL_SetRenderDrawColor(app->renderer, 59, 130, 246, 255);
    SDL_RenderFillRect(app->renderer, &box);

    SDL_RenderPresent(app->renderer);
    return SDL_APP_CONTINUE;
}

void SDL_AppQuit(void* appstate, SDL_AppResult result) {
    if (auto* app = static_cast<AppState*>(appstate)) {
        SDL_DestroyRenderer(app->renderer);
        SDL_DestroyWindow(app->window);
        delete app;
    }
    SDL_Quit();
}`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "sdl03_bothNote",
          "Both models are fully supported — the classic while loop is not deprecated. Use callbacks if you might ever ship to the web or mobile, or if you want SDL to handle the frame pacing. Use the while loop if you are integrating SDL into an existing engine that already owns its loop."
        )}
      </Callout>

      <H2>{tx(t, "sdl03_timestepTitle", "Fixed timestep")}</H2>
      <p>
        {tx(t, "sdl03_timestepBody",
          "Physics stepped by a variable delta time is not deterministic: the same input produces different results at 60 and at 144 frames per second, and a single long frame can push objects through walls. Accumulate real time and consume it in fixed slices."
        )}
      </p>

      <CodeBlock lang="cpp" filename="timestep.cpp" t={t}>{`constexpr double FIXED_DT = 1.0 / 60.0;   // 60 physics steps per second

SDL_AppResult SDL_AppIterate(void* appstate) {
    auto* app = static_cast<AppState*>(appstate);

    const Uint64 now = SDL_GetTicksNS();
    double frameTime = double(now - app->lastTick) / 1e9;
    app->lastTick = now;

    // Clamp: after a breakpoint or a stall, do not try to catch up forever
    frameTime = SDL_min(frameTime, 0.25);
    app->accumulator += frameTime;

    while (app->accumulator >= FIXED_DT) {
        stepPhysics(app->world, float(FIXED_DT));
        app->accumulator -= FIXED_DT;
    }

    // Interpolate rendering between the last two physics states
    const float alpha = float(app->accumulator / FIXED_DT);
    render(app, alpha);

    return SDL_APP_CONTINUE;
}`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "sdl03_spiralWarn",
          "The clamp is not optional. Without it, a frame that took two seconds queues 120 physics steps, which take longer than a frame, which queues even more — the spiral of death. Capping the accumulated time makes the simulation run in slow motion for a moment instead of locking up."
        )}
      </Callout>

    </article>
  );
}

// ── Chapter 04: Events & Input ───────────────────────────────────────────────

function InputContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "sdl04_intro",
          "SDL delivers everything the user does as an SDL_Event: a tagged union where the type field tells you which member is valid. The distinction that trips up every newcomer is events versus state — events tell you something changed, state tells you what is true right now, and gameplay needs both."
        )}
      </p>

      <H2>{tx(t, "sdl04_loopTitle", "The event union")}</H2>

      <CodeBlock lang="cpp" filename="events.cpp" t={t}>{`SDL_Event e;
while (SDL_PollEvent(&e)) {
    switch (e.type) {
        case SDL_EVENT_QUIT:
            running = false;
            break;

        case SDL_EVENT_KEY_DOWN:
            if (e.key.repeat) break;          // ignore auto-repeat
            if (e.key.key == SDLK_SPACE) jump();
            break;

        case SDL_EVENT_MOUSE_MOTION:
            camera.yaw   += e.motion.xrel * sensitivity;
            camera.pitch -= e.motion.yrel * sensitivity;
            break;

        case SDL_EVENT_MOUSE_BUTTON_DOWN:
            if (e.button.button == SDL_BUTTON_LEFT) shoot();
            break;

        case SDL_EVENT_MOUSE_WHEEL:
            zoom += e.wheel.y;                // float in SDL3
            break;

        case SDL_EVENT_WINDOW_RESIZED:
            onResize(e.window.data1, e.window.data2);
            break;

        case SDL_EVENT_GAMEPAD_ADDED:
            openGamepad(e.gdevice.which);
            break;
    }
}`}</CodeBlock>

      <H2>{tx(t, "sdl04_scanTitle", "Scancode versus keycode")}</H2>
      <p>
        {tx(t, "sdl04_scanBody",
          "A scancode is a physical key position; a keycode is the character that key produces under the user's layout. On an AZERTY keyboard the key where W sits on QWERTY produces Z. Movement must use scancodes, or French players cannot walk forward. Shortcuts and text should use keycodes, so Ctrl+Z is wherever the user's Z actually is."
        )}
      </p>

      <CodeBlock lang="cpp" filename="keys.cpp" t={t}>{`// Events give you both
if (e.type == SDL_EVENT_KEY_DOWN) {
    SDL_Scancode physical = e.key.scancode;   // SDL_SCANCODE_W — always that key
    SDL_Keycode  logical  = e.key.key;        // SDLK_Z on AZERTY
}

// Polled state: "is it held down right now?" — this is what movement needs
const bool* keys = SDL_GetKeyboardState(nullptr);   // const bool* in SDL3
glm::vec2 dir{0.0f};
if (keys[SDL_SCANCODE_W]) dir.y -= 1.0f;
if (keys[SDL_SCANCODE_S]) dir.y += 1.0f;
if (keys[SDL_SCANCODE_A]) dir.x -= 1.0f;
if (keys[SDL_SCANCODE_D]) dir.x += 1.0f;
if (dir != glm::vec2{0.0f}) player.pos += glm::normalize(dir) * speed * dt;`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "sdl04_stateTip",
          "The rule of thumb: use events for things that happen once (jump, shoot, open a menu) and polled state for things that are continuous (walking, aiming, holding a trigger). Driving movement from key-down events gives you the operating system's key-repeat delay in the middle of your controls."
        )}
      </Callout>

      <H2>{tx(t, "sdl04_mouseTitle", "Mouse modes")}</H2>

      <CodeBlock lang="cpp" filename="mouse.cpp" t={t}>{`// Relative mode: hides the cursor, locks it to the window, and reports only
// deltas — the correct mode for a first-person camera
SDL_SetWindowRelativeMouseMode(window, true);

float mx, my;
SDL_MouseButtonFlags buttons = SDL_GetMouseState(&mx, &my);   // floats in SDL3
if (buttons & SDL_BUTTON_LMASK) { /* left held */ }`}</CodeBlock>

      <H2>{tx(t, "sdl04_padTitle", "Gamepads")}</H2>
      <p>
        {tx(t, "sdl04_padBody",
          "SDL_Gamepad is the high-level API: it maps any recognized controller onto the Xbox layout, so you write SDL_GAMEPAD_BUTTON_SOUTH once and it works on a DualSense, a Switch Pro controller and an Xbox pad. The low-level SDL_Joystick API exists for flight sticks and racing wheels that do not fit that layout."
        )}
      </p>

      <CodeBlock lang="cpp" filename="gamepad.cpp" t={t}>{`// Hotplug — never enumerate once at startup and assume it stays valid
case SDL_EVENT_GAMEPAD_ADDED:
    pad = SDL_OpenGamepad(e.gdevice.which);
    break;
case SDL_EVENT_GAMEPAD_REMOVED:
    SDL_CloseGamepad(pad);
    pad = nullptr;
    break;

// Axes are Sint16: -32768..32767. Always apply a deadzone.
if (pad) {
    float lx = SDL_GetGamepadAxis(pad, SDL_GAMEPAD_AXIS_LEFTX) / 32767.0f;
    float ly = SDL_GetGamepadAxis(pad, SDL_GAMEPAD_AXIS_LEFTY) / 32767.0f;

    glm::vec2 stick{lx, ly};
    const float len = glm::length(stick);
    if (len < 0.20f) stick = {0.0f, 0.0f};              // radial deadzone
    else stick = glm::normalize(stick) * ((len - 0.20f) / 0.80f);

    if (SDL_GetGamepadButton(pad, SDL_GAMEPAD_BUTTON_SOUTH)) jump();

    SDL_RumbleGamepad(pad, 0x8000, 0x4000, 200);        // low, high, ms
}`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "sdl04_deadzoneWarn",
          "Apply the deadzone to the stick's length, not to each axis separately. Per-axis deadzones produce a square dead area, so diagonal input near the centre behaves differently from cardinal input — players feel it as the stick sticking to the axes."
        )}
      </Callout>

      <H2>{tx(t, "sdl04_textTitle", "Text input")}</H2>

      <CodeBlock lang="cpp" filename="text.cpp" t={t}>{`// SDL3 scopes text input to a window, and it is off by default
SDL_StartTextInput(window);

case SDL_EVENT_TEXT_INPUT:
    buffer += e.text.text;      // UTF-8, already composed by the IME
    break;

SDL_StopTextInput(window);`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "sdl04_textNote",
          "Never build text from key-down events. SDL_EVENT_TEXT_INPUT is the only path that handles keyboard layouts, dead keys, and input method editors for Chinese, Japanese and Korean correctly — the event gives you finished UTF-8 characters, not keystrokes."
        )}
      </Callout>

    </article>
  );
}

// ── Chapter 05: The 2D Renderer ──────────────────────────────────────────────

function RendererContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "sdl05_intro",
          "SDL_Renderer is a hardware-accelerated 2D API that sits on whatever backend the platform offers — Direct3D, Metal, Vulkan or OpenGL. You get sprites, shapes and blending without writing a single shader. For a 2D game it is often all you need, and it is the fastest way to get something on screen while you learn the rest."
        )}
      </p>

      <H2>{tx(t, "sdl05_basicsTitle", "Clear, draw, present")}</H2>

      <CodeBlock lang="cpp" filename="draw.cpp" t={t}>{`SDL_SetRenderDrawColor(r, 16, 18, 26, 255);   // RGBA, 0-255
SDL_RenderClear(r);

// Everything is float — sub-pixel positions come free
SDL_FRect rect{100.5f, 80.0f, 220.0f, 140.0f};
SDL_SetRenderDrawColor(r, 59, 130, 246, 255);
SDL_RenderFillRect(r, &rect);

SDL_SetRenderDrawColor(r, 168, 85, 247, 255);
SDL_RenderRect(r, &rect);                     // outline only

SDL_RenderLine(r, 0.0f, 0.0f, 1280.0f, 720.0f);
SDL_RenderPoint(r, 640.0f, 360.0f);

SDL_RenderPresent(r);                         // swap — nothing appears before this`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "sdl05_alphaTip",
          "Alpha in SDL_SetRenderDrawColor does nothing until you enable blending with SDL_SetRenderDrawBlendMode(r, SDL_BLENDMODE_BLEND). The default is SDL_BLENDMODE_NONE, which writes the alpha straight into the target and looks like it was ignored."
        )}
      </Callout>

      <H2>{tx(t, "sdl05_logicalTitle", "Logical presentation — resolution independence")}</H2>
      <p>
        {tx(t, "sdl05_logicalBody",
          "Rather than scaling every coordinate by the window size, tell SDL the resolution you designed for and let it letterbox or stretch. Your game code then works in a fixed coordinate space no matter what the window does, including fullscreen and high-DPI displays."
        )}
      </p>

      <CodeBlock lang="cpp" filename="logical.cpp" t={t}>{`// Design at 640x360; SDL scales and letterboxes to any window size
SDL_SetRenderLogicalPresentation(renderer, 640, 360,
                                 SDL_LOGICAL_PRESENTATION_LETTERBOX);

// Mouse coordinates are in window space — convert them to your space
float lx, ly;
SDL_RenderCoordinatesFromWindow(renderer, e.motion.x, e.motion.y, &lx, &ly);`}</CodeBlock>

      <LessonTable
        headers={[tx(t, "sdl05_h0", "Mode"), tx(t, "sdl05_h1", "Behaviour")]}
        rows={[
          ["LETTERBOX",     tx(t, "sdl05_m1", "Keeps the aspect ratio, adds black bars. The safe default.")],
          ["OVERSCAN",      tx(t, "sdl05_m2", "Keeps the aspect ratio, crops the overflow. No bars, loses edges.")],
          ["INTEGER_SCALE", tx(t, "sdl05_m3", "Whole-number scaling only. The correct choice for pixel art.")],
          ["STRETCH",       tx(t, "sdl05_m4", "Fills the window, distorts the aspect ratio.")],
          ["DISABLED",      tx(t, "sdl05_m5", "No scaling — you handle it yourself.")],
        ]}
      />

      <H2>{tx(t, "sdl05_vsyncTitle", "VSync and frame pacing")}</H2>

      <CodeBlock lang="cpp" filename="vsync.cpp" t={t}>{`SDL_SetRenderVSync(renderer, 1);                    // sync to every refresh
SDL_SetRenderVSync(renderer, 2);                    // every second refresh
SDL_SetRenderVSync(renderer, SDL_RENDERER_VSYNC_DISABLED);

// Which backend actually got picked?
SDL_Log("renderer: %s", SDL_GetRendererName(renderer));`}</CodeBlock>

      <H2>{tx(t, "sdl05_geomTitle", "Custom geometry")}</H2>
      <p>
        {tx(t, "sdl05_geomBody",
          "SDL_RenderGeometry takes raw vertices with positions, colours and texture coordinates. It is the escape hatch when rectangles are not enough — rotated quads, trails, simple particle systems and immediate-mode UI all build on it."
        )}
      </p>

      <CodeBlock lang="cpp" filename="geometry.cpp" t={t}>{`SDL_Vertex verts[3] = {
    { {320.0f,  80.0f}, {255,   0,   0, 255}, {0.5f, 0.0f} },
    { {560.0f, 400.0f}, {  0, 255,   0, 255}, {1.0f, 1.0f} },
    { { 80.0f, 400.0f}, {  0,   0, 255, 255}, {0.0f, 1.0f} },
};
SDL_RenderGeometry(renderer, nullptr, verts, 3, nullptr, 0);
// pass a texture instead of nullptr to sample it through the uv coordinates`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "sdl05_limitWarn",
          "SDL_Renderer has no shaders, no render-to-multiple-targets and no compute. If you need lighting, post-processing or anything custom per pixel, that is the point where you move to SDL_GPU or to OpenGL — SDL_Renderer is deliberately a sprite pipeline, not a general graphics API."
        )}
      </Callout>

    </article>
  );
}

// ── Chapter 06: Textures & Images ────────────────────────────────────────────

function TexturesContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "sdl06_intro",
          "SDL has two image types and they live in different places. An SDL_Surface is pixels in system RAM that the CPU can read and write. An SDL_Texture is pixels in GPU memory that the renderer can draw fast but you cannot easily touch. Loading means creating a surface, uploading it, and throwing the surface away."
        )}
      </p>

      <LessonTable
        headers={[tx(t, "sdl06_h0", ""), "SDL_Surface", "SDL_Texture"]}
        rows={[
          [tx(t, "sdl06_r0", "Lives in"),      tx(t, "sdl06_r1", "System RAM"),                 tx(t, "sdl06_r2", "GPU memory")],
          [tx(t, "sdl06_r3", "Pixel access"),  tx(t, "sdl06_r4", "Direct — read and write"),    tx(t, "sdl06_r5", "Only via lock, or streaming textures")],
          [tx(t, "sdl06_r6", "Drawing speed"), tx(t, "sdl06_r7", "Slow — CPU blitting"),        tx(t, "sdl06_r8", "Fast — hardware accelerated")],
          [tx(t, "sdl06_r9", "Use it for"),    tx(t, "sdl06_r10", "Loading, and per-pixel work"), tx(t, "sdl06_r11", "Everything you actually draw")],
        ]}
      />

      <H2>{tx(t, "sdl06_loadTitle", "Loading an image")}</H2>

      <CodeBlock lang="cpp" filename="load_texture.cpp" t={t}>{`#include <SDL3_image/SDL_image.h>   // PNG, JPG, WEBP, AVIF and more

TexturePtr loadTexture(SDL_Renderer* r, const char* path) {
    SDL_Surface* surface = IMG_Load(path);        // core SDL only reads BMP
    if (!surface) {
        SDL_Log("IMG_Load(%s): %s", path, SDL_GetError());
        return nullptr;
    }

    TexturePtr tex{SDL_CreateTextureFromSurface(r, surface)};
    SDL_DestroySurface(surface);                  // the GPU has its own copy now

    if (!tex) SDL_Log("CreateTextureFromSurface: %s", SDL_GetError());
    return tex;
}

// SDL3_image no longer needs IMG_Init / IMG_Quit — decoders load on demand`}</CodeBlock>

      <H2>{tx(t, "sdl06_drawTitle", "Drawing sprites")}</H2>

      <CodeBlock lang="cpp" filename="sprites.cpp" t={t}>{`// Whole texture, stretched to the destination rectangle
SDL_FRect dst{x, y, w, h};
SDL_RenderTexture(renderer, tex, nullptr, &dst);

// A frame from a sprite sheet: src selects the region
SDL_FRect src{frame * 32.0f, row * 32.0f, 32.0f, 32.0f};
SDL_RenderTexture(renderer, sheet, &src, &dst);

// Rotation and flipping
SDL_FPoint pivot{dst.w * 0.5f, dst.h * 0.5f};    // centre of the destination
SDL_RenderTextureRotated(renderer, tex, &src, &dst,
                         angleDegrees, &pivot, SDL_FLIP_HORIZONTAL);

// Tint and fade the texture itself
SDL_SetTextureColorMod(tex, 255, 128, 128);      // multiplied into every pixel
SDL_SetTextureAlphaMod(tex, 180);
SDL_SetTextureBlendMode(tex, SDL_BLENDMODE_BLEND);`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "sdl06_pixelTip",
          "For pixel art, call SDL_SetTextureScaleMode(tex, SDL_SCALEMODE_NEAREST). The default is linear filtering, which blurs every sprite the moment it is not drawn at exactly 1:1. Combine it with INTEGER_SCALE logical presentation for a clean result at any window size."
        )}
      </Callout>

      <H2>{tx(t, "sdl06_targetTitle", "Render targets")}</H2>
      <p>
        {tx(t, "sdl06_targetBody",
          "A texture created with SDL_TEXTUREACCESS_TARGET can be drawn into. That gives you an off-screen buffer for a minimap, a cached tile layer that only needs redrawing when the world changes, or a fixed-resolution buffer you scale up at the end of the frame."
        )}
      </p>

      <CodeBlock lang="cpp" filename="render_target.cpp" t={t}>{`SDL_Texture* target = SDL_CreateTexture(renderer,
    SDL_PIXELFORMAT_RGBA8888, SDL_TEXTUREACCESS_TARGET, 320, 180);

SDL_SetRenderTarget(renderer, target);     // draw into the texture
SDL_SetRenderDrawColor(renderer, 0, 0, 0, 0);
SDL_RenderClear(renderer);
drawWorld(renderer);

SDL_SetRenderTarget(renderer, nullptr);    // back to the window
SDL_RenderTexture(renderer, target, nullptr, nullptr);   // scaled to the window`}</CodeBlock>

      <H2>{tx(t, "sdl06_streamTitle", "Streaming textures")}</H2>
      <p>
        {tx(t, "sdl06_streamBody",
          "When the CPU generates the pixels every frame — a software rasterizer, a raytracer, a video decoder — use a streaming texture and write directly into its locked memory."
        )}
      </p>

      <CodeBlock lang="cpp" filename="streaming.cpp" t={t}>{`SDL_Texture* fb = SDL_CreateTexture(renderer,
    SDL_PIXELFORMAT_ARGB8888, SDL_TEXTUREACCESS_STREAMING, W, H);

void* pixels = nullptr;
int   pitch  = 0;                      // bytes per row — NOT always W * 4
if (SDL_LockTexture(fb, nullptr, &pixels, &pitch)) {
    for (int y = 0; y < H; ++y) {
        auto* row = reinterpret_cast<Uint32*>(static_cast<Uint8*>(pixels) + y * pitch);
        for (int x = 0; x < W; ++x) row[x] = shade(x, y);
    }
    SDL_UnlockTexture(fb);
}
SDL_RenderTexture(renderer, fb, nullptr, nullptr);`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "sdl06_pitchWarn",
          "Always index rows using the pitch that SDL_LockTexture reports, never width times bytes-per-pixel. Drivers pad rows for alignment, so assuming a tight layout produces a skewed image on some GPUs and a correct one on yours — the worst kind of bug to debug remotely."
        )}
      </Callout>

    </article>
  );
}

// ── Chapter 07: Text ─────────────────────────────────────────────────────────

function TextContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "sdl07_intro",
          "Core SDL cannot draw text at all — there is no font rasterizer in it. SDL3_ttf wraps FreeType and gives you two paths: render a string to a surface and upload it as a texture, or use the text engine that manages glyph atlases for you. The second is what you want for anything that changes every frame."
        )}
      </p>

      <H2>{tx(t, "sdl07_basicTitle", "The classic path: string to texture")}</H2>

      <CodeBlock lang="cpp" filename="text_basic.cpp" t={t}>{`#include <SDL3_ttf/SDL_ttf.h>

if (!TTF_Init()) { SDL_Log("TTF_Init: %s", SDL_GetError()); return 1; }

TTF_Font* font = TTF_OpenFont("assets/inter.ttf", 24.0f);   // float size in SDL3_ttf
if (!font) { SDL_Log("TTF_OpenFont: %s", SDL_GetError()); return 1; }

SDL_Color white{255, 255, 255, 255};

// SDL3_ttf takes an explicit length — 0 means "null-terminated"
SDL_Surface* surf = TTF_RenderText_Blended(font, "Score: 1200", 0, white);
SDL_Texture* tex  = SDL_CreateTextureFromSurface(renderer, surf);

SDL_FRect dst{16.0f, 16.0f, float(surf->w), float(surf->h)};
SDL_DestroySurface(surf);

SDL_RenderTexture(renderer, tex, nullptr, &dst);

// shutdown
SDL_DestroyTexture(tex);
TTF_CloseFont(font);
TTF_Quit();`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "sdl07_perfWarn",
          "Never do this every frame. Rasterizing a string and uploading a texture is orders of magnitude more expensive than drawing one, so a frame counter rebuilt 60 times a second will cost more than your entire scene. Cache the texture and rebuild it only when the string actually changes."
        )}
      </Callout>

      <H2>{tx(t, "sdl07_qualityTitle", "Rendering modes")}</H2>
      <LessonTable
        headers={[tx(t, "sdl07_h0", "Function"), tx(t, "sdl07_h1", "Quality"), tx(t, "sdl07_h2", "Use for")]}
        rows={[
          ["TTF_RenderText_Solid",   tx(t, "sdl07_q1", "Aliased, 1-bit edges"), tx(t, "sdl07_u1", "Fast debug overlays, pixel-art fonts")],
          ["TTF_RenderText_Blended", tx(t, "sdl07_q2", "Antialiased with alpha"), tx(t, "sdl07_u2", "Everything the player reads")],
          ["TTF_RenderText_LCD",     tx(t, "sdl07_q3", "Subpixel antialiasing"), tx(t, "sdl07_u3", "Small text on a known-orientation LCD")],
          ["..._Wrapped variants",   tx(t, "sdl07_q4", "Same, plus line breaking"), tx(t, "sdl07_u4", "Paragraphs — pass a wrap width in pixels")],
        ]}
      />

      <H2>{tx(t, "sdl07_engineTitle", "The text engine")}</H2>
      <p>
        {tx(t, "sdl07_engineBody",
          "SDL3_ttf added a text object API that keeps glyphs in an atlas and only re-shapes what changed. You create an engine bound to your renderer, create TTF_Text objects, and update their strings — the library handles caching, so changing text every frame is cheap."
        )}
      </p>

      <CodeBlock lang="cpp" filename="text_engine.cpp" t={t}>{`TTF_TextEngine* engine = TTF_CreateRendererTextEngine(renderer);

TTF_Text* score = TTF_CreateText(engine, font, "Score: 0", 0);
TTF_SetTextColor(score, 255, 255, 255, 255);

// Per frame — cheap, only re-shapes when the string differs
TTF_SetTextString(score, scoreString.c_str(), scoreString.size());
TTF_DrawRendererText(score, 16.0f, 16.0f);

// shutdown
TTF_DestroyText(score);
TTF_DestroyRendererTextEngine(engine);`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "sdl07_engineNote",
          "There are engine variants for the different rendering paths — one for SDL_Renderer, one that produces surfaces, and one that gives you raw geometry to feed into SDL_GPU or OpenGL yourself. Check the SDL3_ttf headers for the exact set available in your version."
        )}
      </Callout>

      <H2>{tx(t, "sdl07_metricsTitle", "Measuring and laying out")}</H2>

      <CodeBlock lang="cpp" filename="metrics.cpp" t={t}>{`int w = 0, h = 0;
TTF_GetStringSize(font, "Continue", 0, &w, &h);   // size it before drawing it

const int lineSkip = TTF_GetFontLineSkip(font);  // recommended line spacing
const int ascent   = TTF_GetFontAscent(font);    // baseline alignment

// Centre a label inside a button
SDL_FRect button{100.0f, 200.0f, 240.0f, 56.0f};
float tx_ = button.x + (button.w - float(w)) * 0.5f;
float ty_ = button.y + (button.h - float(h)) * 0.5f;`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "sdl07_dpiTip",
          "Open the font at the size you will actually draw it. Rasterizing at 16pt and scaling the texture to 32 gives you a blurry result — reopen the font at the new size instead, and on high-DPI displays multiply the point size by the display scale from SDL_GetWindowDisplayScale."
        )}
      </Callout>

    </article>
  );
}

// ── Chapter 08: Audio ────────────────────────────────────────────────────────

function AudioContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "sdl08_intro",
          "SDL3 rewrote audio around streams. In SDL2 you opened a device in one specific format and converted everything yourself; in SDL3 you open a stream, tell it the format your data is in, and SDL converts and resamples on the way to the device. Several streams can feed the same device and SDL mixes them."
        )}
      </p>

      <H2>{tx(t, "sdl08_conceptTitle", "Streams, devices and logical devices")}</H2>
      <p>
        {tx(t, "sdl08_conceptBody",
          "A physical device is the sound card. A logical device is your program's handle on it, and several can be open at once without fighting. A stream is a queue with format conversion built in: you push samples in your format, SDL pulls them in the device's format."
        )}
      </p>

      <CodeBlock lang="cpp" filename="audio_wav.cpp" t={t}>{`SDL_Init(SDL_INIT_AUDIO);

// Load a WAV — SDL fills in whatever format the file happens to be
SDL_AudioSpec spec;
Uint8* buffer = nullptr;
Uint32 length = 0;
if (!SDL_LoadWAV("assets/shoot.wav", &spec, &buffer, &length)) {
    SDL_Log("LoadWAV: %s", SDL_GetError());
}

// Open a stream on the default device, in the file's format.
// SDL resamples to whatever the hardware wants — you never convert by hand.
SDL_AudioStream* stream =
    SDL_OpenAudioDeviceStream(SDL_AUDIO_DEVICE_DEFAULT_PLAYBACK, &spec, nullptr, nullptr);

SDL_ResumeAudioStreamDevice(stream);      // devices start paused

SDL_PutAudioStreamData(stream, buffer, int(length));   // fire and forget

// cleanup
SDL_DestroyAudioStream(stream);
SDL_free(buffer);`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "sdl08_pauseWarn",
          "SDL_OpenAudioDeviceStream returns a paused device. Forgetting SDL_ResumeAudioStreamDevice is the single most common reason for 'my audio code runs and nothing plays' — there is no error, the samples just queue up forever."
        )}
      </Callout>

      <H2>{tx(t, "sdl08_callbackTitle", "Generating audio in a callback")}</H2>
      <p>
        {tx(t, "sdl08_callbackBody",
          "For synthesized audio, pass a callback when opening the stream. SDL calls it from the audio thread whenever the stream needs more data — which means the usual audio-thread rules apply."
        )}
      </p>

      <CodeBlock lang="cpp" filename="audio_synth.cpp" t={t}>{`void SDLCALL feed(void* userdata, SDL_AudioStream* stream,
                  int additionalAmount, int totalAmount) {
    auto* osc = static_cast<Oscillator*>(userdata);
    const int samples = additionalAmount / int(sizeof(float));

    static float buf[4096];
    const int n = SDL_min(samples, 4096);
    for (int i = 0; i < n; ++i) buf[i] = osc->next();

    SDL_PutAudioStreamData(stream, buf, n * int(sizeof(float)));
}

SDL_AudioSpec spec{SDL_AUDIO_F32, 1, 48000};
SDL_AudioStream* stream = SDL_OpenAudioDeviceStream(
    SDL_AUDIO_DEVICE_DEFAULT_PLAYBACK, &spec, feed, &oscillator);
SDL_ResumeAudioStreamDevice(stream);`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "sdl08_threadWarn",
          "The audio callback runs on a real-time thread with a hard deadline of a few milliseconds. No allocation, no mutex that a game thread might hold, no file I/O, no logging. Miss the deadline and the user hears a click. Communicate with a lock-free ring buffer or an atomic, and do the heavy work elsewhere."
        )}
      </Callout>

      <H2>{tx(t, "sdl08_mixTitle", "Mixing several sounds")}</H2>
      <p>
        {tx(t, "sdl08_mixBody",
          "You do not need a mixer for simple cases: bind several streams to the same logical device and SDL sums them. Gain is per stream, so a music stream and a sound-effect stream can have independent volume."
        )}
      </p>

      <CodeBlock lang="cpp" filename="mixing.cpp" t={t}>{`SDL_AudioDeviceID dev =
    SDL_OpenAudioDevice(SDL_AUDIO_DEVICE_DEFAULT_PLAYBACK, nullptr);

SDL_AudioStream* music = SDL_CreateAudioStream(&musicSpec, nullptr);
SDL_AudioStream* sfx   = SDL_CreateAudioStream(&sfxSpec,   nullptr);

SDL_BindAudioStream(dev, music);
SDL_BindAudioStream(dev, sfx);      // SDL mixes both into the device

SDL_SetAudioStreamGain(music, 0.35f);
SDL_SetAudioStreamGain(sfx,   1.00f);
SDL_ResumeAudioDevice(dev);`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "sdl08_mixerTip",
          "For a real game, SDL3_mixer gives you MP3, OGG and FLAC decoding, a channel model, fades and looping on top of all this. Core SDL audio is the right layer when you are synthesizing sound or building your own mixer; SDL3_mixer is the right layer when you just want to play the assets an audio designer handed you."
        )}
      </Callout>

    </article>
  );
}

// ── Chapter 09: SDL_GPU ──────────────────────────────────────────────────────

function GpuContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "sdl09_intro",
          "SDL_GPU is the headline addition in SDL3: one modern graphics API that runs on Vulkan, Direct3D 12 and Metal. It gives you command buffers, explicit pipelines and real shaders — the modern model — without the several thousand lines of setup that raw Vulkan demands, and without OpenGL's hidden global state."
        )}
      </p>

      <H2>{tx(t, "sdl09_whereTitle", "Where it sits")}</H2>
      <LessonTable
        headers={[tx(t, "sdl09_h0", "API"), tx(t, "sdl09_h1", "Control"), tx(t, "sdl09_h2", "Cost of a triangle")]}
        rows={[
          ["SDL_Renderer",  tx(t, "sdl09_a1", "Sprites and shapes, no shaders"),        tx(t, "sdl09_b1", "About 20 lines")],
          ["OpenGL 4.6",    tx(t, "sdl09_a2", "Full programmable pipeline, global state"), tx(t, "sdl09_b2", "About 100 lines")],
          ["SDL_GPU",       tx(t, "sdl09_a3", "Explicit pipelines and command buffers"),  tx(t, "sdl09_b3", "About 200 lines")],
          ["Vulkan",        tx(t, "sdl09_a4", "Everything, including memory and sync"),   tx(t, "sdl09_b4", "About 1000 lines")],
        ]}
      />

      <p>
        {tx(t, "sdl09_whereBody",
          "SDL_GPU deliberately sits where most games want to be: you get the explicit modern model — you decide when work is recorded and submitted — but SDL still owns memory allocation, synchronization and swapchain management, which is where most of Vulkan's difficulty lives."
        )}
      </p>

      <H2>{tx(t, "sdl09_shaderTitle", "The shader problem")}</H2>
      <p>
        {tx(t, "sdl09_shaderBody",
          "SDL_GPU does not define a shading language. Each backend consumes its own format: SPIR-V for Vulkan, DXIL for Direct3D 12, and MSL or a metallib for Metal. You either ship all the formats you support, or compile at build time from one source with a cross-compiler."
        )}
      </p>

      <LessonTable
        headers={[tx(t, "sdl09_s0", "Backend"), tx(t, "sdl09_s1", "Shader format")]}
        rows={[
          ["Vulkan",        "SPIR-V"],
          ["Direct3D 12",   "DXIL"],
          ["Metal",         tx(t, "sdl09_s2", "MSL source or a compiled metallib")],
        ]}
      />

      <Callout type="tip" t={t}>
        {tx(t, "sdl09_crossTip",
          "The usual workflow is to write shaders once in HLSL or GLSL and cross-compile them in your build step — SDL's shadercross tooling exists for exactly this. Query SDL_GetGPUShaderFormats at runtime to find out which formats the device you got will accept, and load the matching blob."
        )}
      </Callout>

      <H2>{tx(t, "sdl09_deviceTitle", "Creating a device")}</H2>

      <CodeBlock lang="cpp" filename="gpu_device.cpp" t={t}>{`#include <SDL3/SDL_gpu.h>

// Ask for the formats you actually shipped; SDL picks a matching backend
SDL_GPUDevice* device = SDL_CreateGPUDevice(
    SDL_GPU_SHADERFORMAT_SPIRV | SDL_GPU_SHADERFORMAT_DXIL | SDL_GPU_SHADERFORMAT_MSL,
    true,          // enable debug mode — turns on the validation layers
    nullptr);      // let SDL choose the backend

if (!device) { SDL_Log("CreateGPUDevice: %s", SDL_GetError()); return 1; }
SDL_Log("GPU backend: %s", SDL_GetGPUDeviceDriver(device));

// The window must be claimed before you can render to it
if (!SDL_ClaimWindowForGPUDevice(device, window)) {
    SDL_Log("ClaimWindow: %s", SDL_GetError());
    return 1;
}`}</CodeBlock>

      <H2>{tx(t, "sdl09_frameTitle", "The shape of a frame")}</H2>
      <p>
        {tx(t, "sdl09_frameBody",
          "Every frame follows the same five steps. Nothing executes when you call it — you are recording commands into a buffer, and submitting it hands the whole batch to the GPU at once."
        )}
      </p>

      <CodeBlock lang="cpp" filename="gpu_frame.cpp" t={t}>{`// 1. Acquire a command buffer to record into
SDL_GPUCommandBuffer* cmd = SDL_AcquireGPUCommandBuffer(device);

// 2. Acquire the swapchain texture for this window
SDL_GPUTexture* swapchain = nullptr;
Uint32 w = 0, h = 0;
if (!SDL_WaitAndAcquireGPUSwapchainTexture(cmd, window, &swapchain, &w, &h)) {
    SDL_SubmitGPUCommandBuffer(cmd);       // minimized or resizing — skip the frame
    return;
}

// 3. Describe the render pass: what to draw into, and how to clear it
SDL_GPUColorTargetInfo color{};
color.texture     = swapchain;
color.clear_color = SDL_FColor{0.06f, 0.07f, 0.10f, 1.0f};
color.load_op     = SDL_GPU_LOADOP_CLEAR;
color.store_op    = SDL_GPU_STOREOP_STORE;

SDL_GPURenderPass* pass = SDL_BeginGPURenderPass(cmd, &color, 1, nullptr);

// 4. Record draw commands
SDL_BindGPUGraphicsPipeline(pass, pipeline);
SDL_GPUBufferBinding vb{vertexBuffer, 0};
SDL_BindGPUVertexBuffers(pass, 0, &vb, 1);
SDL_DrawGPUPrimitives(pass, 3, 1, 0, 0);

SDL_EndGPURenderPass(pass);

// 5. Submit — this is where the GPU actually receives the work
SDL_SubmitGPUCommandBuffer(cmd);`}</CodeBlock>

      <H2>{tx(t, "sdl09_uploadTitle", "Getting data onto the GPU")}</H2>
      <p>
        {tx(t, "sdl09_uploadBody",
          "GPU buffers are not CPU-visible. You write into a transfer buffer, then record a copy pass that moves it into the real buffer — the same staging model Vulkan and D3D12 use, and the reason uploads are explicit rather than hidden inside a glBufferData call."
        )}
      </p>

      <CodeBlock lang="cpp" filename="gpu_upload.cpp" t={t}>{`// Destination: a vertex buffer the shader will read
SDL_GPUBufferCreateInfo bufInfo{};
bufInfo.usage = SDL_GPU_BUFFERUSAGE_VERTEX;
bufInfo.size  = sizeof(vertices);
SDL_GPUBuffer* vertexBuffer = SDL_CreateGPUBuffer(device, &bufInfo);

// Staging: CPU-writable memory
SDL_GPUTransferBufferCreateInfo tbInfo{};
tbInfo.usage = SDL_GPU_TRANSFERBUFFERUSAGE_UPLOAD;
tbInfo.size  = sizeof(vertices);
SDL_GPUTransferBuffer* staging = SDL_CreateGPUTransferBuffer(device, &tbInfo);

void* mapped = SDL_MapGPUTransferBuffer(device, staging, false);
SDL_memcpy(mapped, vertices, sizeof(vertices));
SDL_UnmapGPUTransferBuffer(device, staging);

// Record the copy
SDL_GPUCommandBuffer* cmd  = SDL_AcquireGPUCommandBuffer(device);
SDL_GPUCopyPass*      copy = SDL_BeginGPUCopyPass(cmd);

SDL_GPUTransferBufferLocation src{staging, 0};
SDL_GPUBufferRegion           dst{vertexBuffer, 0, sizeof(vertices)};
SDL_UploadToGPUBuffer(copy, &src, &dst, false);

SDL_EndGPUCopyPass(copy);
SDL_SubmitGPUCommandBuffer(cmd);

SDL_ReleaseGPUTransferBuffer(device, staging);   // staging was one-shot`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "sdl09_scopeNote",
          "The snippets above are the shape of the API, not a complete program — a working triangle also needs shader loading, a vertex input description and a graphics pipeline built from both. The SDL_gpu_examples repository maintained alongside SDL is the reference to work from, because it is updated with the API."
        )}
      </Callout>

      <H2>{tx(t, "sdl09_whenTitle", "When to choose it")}</H2>
      <LessonTable
        headers={[tx(t, "sdl09_w0", "You want to"), tx(t, "sdl09_w1", "Use")]}
        rows={[
          [tx(t, "sdl09_w2", "Ship a 2D game quickly"),                      "SDL_Renderer"],
          [tx(t, "sdl09_w3", "Learn graphics programming concepts"),         tx(t, "sdl09_w3b", "OpenGL — simpler mental model, endless material")],
          [tx(t, "sdl09_w4", "Custom shaders on desktop, console and mobile"), "SDL_GPU"],
          [tx(t, "sdl09_w5", "Control memory, sync and extensions yourself"), tx(t, "sdl09_w5b", "Vulkan directly")],
        ]}
      />

      <Callout type="tip" t={t}>
        {tx(t, "sdl09_learnTip",
          "SDL_GPU is easier to learn after OpenGL than before it. The OpenGL track in this series covers the concepts — vertex buffers, pipelines, shader stages, depth testing — with far less ceremony per experiment. Learn what a graphics pipeline is there, then come back and the SDL_GPU structs will read as labelled boxes you already understand."
        )}
      </Callout>

    </article>
  );
}

// ── Chapter 10: Platform Layer ───────────────────────────────────────────────

function PlatformContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "sdl10_intro",
          "The last twenty percent of shipping a game is everything around the game: where the save file goes on each platform, how the log gets written, what happens on a laptop with a 90 Hz display. SDL covers most of it, and using its abstractions instead of the platform's is what makes the port to the next platform boring."
        )}
      </p>

      <H2>{tx(t, "sdl10_timeTitle", "Time")}</H2>

      <CodeBlock lang="cpp" filename="time.cpp" t={t}>{`Uint64 ns = SDL_GetTicksNS();       // since SDL_Init, nanoseconds, monotonic
Uint64 ms = SDL_GetTicks();         // same clock, milliseconds

// Highest resolution the platform offers — use for profiling a block
Uint64 start = SDL_GetPerformanceCounter();
doWork();
double seconds = double(SDL_GetPerformanceCounter() - start)
               / double(SDL_GetPerformanceFrequency());

SDL_DelayNS(1'000'000);             // sleep 1 ms — precise where the OS allows`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "sdl10_refreshTip",
          "Do not hardcode 60 FPS. Query the display mode with SDL_GetCurrentDisplayMode and read its refresh_rate — players have 60, 90, 120, 144 and 165 Hz displays, and a game that assumes 60 either runs at half speed or burns battery rendering frames nobody sees."
        )}
      </Callout>

      <H2>{tx(t, "sdl10_fsTitle", "Files and save data")}</H2>
      <p>
        {tx(t, "sdl10_fsBody",
          "Writing next to the executable fails the moment your game is installed in Program Files or a read-only app bundle. SDL gives you the two directories every platform actually has: where your assets are, and where you are allowed to write."
        )}
      </p>

      <CodeBlock lang="cpp" filename="paths.cpp" t={t}>{`const char* base = SDL_GetBasePath();          // next to the executable — read-only
char* prefs = SDL_GetPrefPath("MyStudio", "MyGame");
// Windows: %APPDATA%/MyStudio/MyGame/
// macOS:   ~/Library/Application Support/MyStudio/MyGame/
// Linux:   ~/.local/share/MyStudio/MyGame/

saveGame(std::string{prefs} + "slot1.sav");
SDL_free(prefs);                               // SDL allocated it; you free it

// Whole-file helpers, no fopen dance
size_t size = 0;
void*  data = SDL_LoadFile("assets/level1.json", &size);
SDL_free(data);`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "sdl10_storageNote",
          "SDL3 also adds a storage abstraction — SDL_OpenTitleStorage for read-only game content and SDL_OpenUserStorage for saves. On desktop it is a thin wrapper over the filesystem; on consoles it maps to the platform's certified save API. Using it from the start turns a console port's save system from a rewrite into a configuration change."
        )}
      </Callout>

      <H2>{tx(t, "sdl10_threadTitle", "Threads")}</H2>
      <p>
        {tx(t, "sdl10_threadBody",
          "SDL has threads, mutexes and condition variables because it must support C. In a C++ project prefer std::jthread and std::mutex — they are RAII, they integrate with the rest of the standard library, and ThreadSanitizer understands them. The one SDL rule that overrides everything: all window, renderer and event calls must happen on the thread that called SDL_Init."
        )}
      </p>

      <CodeBlock lang="cpp" filename="threads.cpp" t={t}>{`// Background loading, results handed back through a custom event
std::jthread loader{[&](std::stop_token stop) {
    auto* asset = loadHeavyAsset();

    SDL_Event ev{};
    ev.type       = assetLoadedEventType;   // from SDL_RegisterEvents(1)
    ev.user.data1 = asset;
    SDL_PushEvent(&ev);                     // thread-safe — this one is allowed
}};`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "sdl10_threadWarn",
          "Creating a window, drawing, or pumping events from a worker thread is undefined behaviour and fails differently on every platform — macOS in particular requires UI calls on the main thread. SDL_PushEvent is explicitly thread-safe and is the intended way for a worker to talk back to the main loop."
        )}
      </Callout>

      <H2>{tx(t, "sdl10_hintsTitle", "Hints and logging")}</H2>

      <CodeBlock lang="cpp" filename="hints.cpp" t={t}>{`// Hints configure behaviour without new API — set them before SDL_Init
SDL_SetHint(SDL_HINT_RENDER_VSYNC, "1");
SDL_SetHint(SDL_HINT_VIDEO_MINIMIZE_ON_FOCUS_LOSS, "0");   // fullscreen debugging

// Categorized logging with levels — SDL_Log is the unconditional shortcut
SDL_SetLogPriority(SDL_LOG_CATEGORY_APPLICATION, SDL_LOG_PRIORITY_DEBUG);
SDL_LogInfo(SDL_LOG_CATEGORY_APPLICATION, "loaded %zu meshes", meshes.size());
SDL_LogError(SDL_LOG_CATEGORY_RENDER, "pipeline: %s", SDL_GetError());`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "sdl10_errWarn",
          "SDL_GetError returns the last error set on the current thread, and it is not cleared by a successful call. Read it immediately after the function that failed — checking it later gives you a stale message from an unrelated call, which sends you debugging the wrong subsystem."
        )}
      </Callout>

      <H2>{tx(t, "sdl10_shipTitle", "Shipping")}</H2>
      <LessonTable
        headers={[tx(t, "sdl10_h0", "Target"), tx(t, "sdl10_h1", "What to watch for")]}
        rows={[
          ["Windows",  tx(t, "sdl10_p1", "Ship SDL3.dll beside the executable. SDL_main.h supplies WinMain for you.")],
          ["macOS",    tx(t, "sdl10_p2", "Bundle the dylib in the .app, then codesign and notarize or it will not launch.")],
          ["Linux",    tx(t, "sdl10_p3", "Prefer the system SDL3 when packaging; bundle it for Steam or an AppImage.")],
          ["Web",      tx(t, "sdl10_p4", "Emscripten. Main callbacks are effectively required — a blocking loop hangs the tab.")],
          [tx(t, "sdl10_p5k", "Mobile"), tx(t, "sdl10_p5", "Handle SDL_EVENT_WILL_ENTER_BACKGROUND — release GPU resources or you get killed.")],
        ]}
      />

      <Callout type="tip" t={t}>
        {tx(t, "sdl10_nextTip",
          "From here, the two natural directions are up and down the stack. Down: the OpenGL and GLSL tracks, for what actually happens when you submit a draw call. Up: build something small and finish it — a complete Pong with sound, a menu and a save file will teach you more about the platform layer than any further reading."
        )}
      </Callout>

    </article>
  );
}

// ── Exported track ────────────────────────────────────────────────────────────

export const sdl3Track: Track = {
  id: "sdl3",
  title: "SDL3 Framework",
  chapters: [
    { id: "whats-new", section: "Foundations", title: "SDL3 vs SDL2",              minRead: 9,  content: (t) => <WhatsNewContent  t={t} /> },
    { id: "setup", section: "Foundations",     title: "Setup & First Window",      minRead: 10, content: (t) => <SetupContent     t={t} /> },
    { id: "main-loop", section: "Foundations", title: "The Main Loop",             minRead: 11, content: (t) => <MainLoopContent  t={t} /> },
    { id: "input", section: "Input & 2D",     title: "Events & Input",            minRead: 12, content: (t) => <InputContent     t={t} /> },
    { id: "renderer", section: "Input & 2D",  title: "The 2D Renderer",           minRead: 10, content: (t) => <RendererContent  t={t} /> },
    { id: "textures", section: "Input & 2D",  title: "Textures & Images",         minRead: 11, content: (t) => <TexturesContent  t={t} /> },
    { id: "text", section: "Input & 2D",      title: "Text with SDL3_ttf",        minRead: 9,  content: (t) => <TextContent      t={t} /> },
    { id: "audio", section: "Audio & Graphics",     title: "Audio Streams",             minRead: 10, content: (t) => <AudioContent     t={t} /> },
    { id: "gpu", section: "Audio & Graphics",       title: "SDL_GPU — Modern Graphics", minRead: 14, content: (t) => <GpuContent       t={t} /> },
    { id: "platform", section: "Shipping",  title: "Time, Files & Shipping",    minRead: 11, content: (t) => <PlatformContent  t={t} /> },
  ],
};
