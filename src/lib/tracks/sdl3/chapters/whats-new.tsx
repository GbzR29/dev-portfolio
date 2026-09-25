"use client";

// SDL3 track — "SDL3 vs SDL2".

import { TrackTranslations } from "@/lib/tracks/types";
import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";

export function WhatsNewContent({ t }: { t: TrackTranslations }) {
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
