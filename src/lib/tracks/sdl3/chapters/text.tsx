"use client";

// SDL3 track — "Text".

import { TrackTranslations } from "@/lib/tracks/types";
import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";

export function TextContent({ t }: { t: TrackTranslations }) {
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
