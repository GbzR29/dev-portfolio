"use client";

// SDL3 track — "Textures & Images".

import { TrackTranslations } from "@/lib/tracks/types";
import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";

export function TexturesContent({ t }: { t: TrackTranslations }) {
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
