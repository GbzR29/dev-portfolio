"use client";

// SDL3 track — "The 2D Renderer".

import { TrackTranslations } from "@/lib/tracks/types";
import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";

export function RendererContent({ t }: { t: TrackTranslations }) {
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
