"use client";

// SDL3 track — "The Main Loop".

import { TrackTranslations } from "@/lib/tracks/types";
import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";

export function MainLoopContent({ t }: { t: TrackTranslations }) {
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
