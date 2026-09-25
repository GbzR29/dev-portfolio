"use client";

// SDL3 track — "Platform Layer".

import { TrackTranslations } from "@/lib/tracks/types";
import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";

export function PlatformContent({ t }: { t: TrackTranslations }) {
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
