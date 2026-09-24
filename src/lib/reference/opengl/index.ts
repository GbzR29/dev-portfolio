// src/lib/reference/opengl/index.ts
// OpenGL function reference. One file per category; order here is display order.

import type { Reference } from "../types";
import { contextEntries } from "./context";
import { bufferEntries } from "./buffers";
import { vertexArrayEntries } from "./vertexArrays";
import { shaderEntries } from "./shaders";
import { uniformEntries } from "./uniforms";
import { drawingEntries } from "./drawing";
import { textureEntries } from "./textures";
import { fragmentOpEntries } from "./fragmentOps";
import { framebufferEntries } from "./framebuffers";
import { dsaEntries } from "./dsa";
import { computeEntries } from "./compute";
import { debugEntries } from "./debug";
import { legacyEntries } from "./legacy";

export const openGLReference: Reference = {
  trackPath: "OpenGL",
  title: "OpenGL 4.6",
  tokenPattern: /\bgl[A-Z][A-Za-z0-9]*\b/g,
  categories: [
    { id: "context",       title: { en: "Context & state",           pt: "Contexto e estado" } },
    { id: "buffers",       title: { en: "Buffers",                   pt: "Buffers" } },
    { id: "vertex-arrays", title: { en: "Vertex arrays",             pt: "Vertex arrays" } },
    { id: "shaders",       title: { en: "Shaders & programs",        pt: "Shaders e programas" } },
    { id: "uniforms",      title: { en: "Uniforms",                  pt: "Uniforms" } },
    { id: "drawing",       title: { en: "Drawing",                   pt: "Desenho" } },
    { id: "textures",      title: { en: "Textures",                  pt: "Texturas" } },
    { id: "fragment-ops",  title: { en: "Depth, blending & culling", pt: "Profundidade, blending e culling" } },
    { id: "framebuffers",  title: { en: "Framebuffers",              pt: "Framebuffers" } },
    { id: "dsa",           title: { en: "Direct State Access",       pt: "Direct State Access" } },
    { id: "compute",       title: { en: "Compute",                   pt: "Compute" } },
    { id: "debug",         title: { en: "Debugging",                 pt: "Depuração" } },
    { id: "legacy",        title: { en: "Legacy (immediate mode)",   pt: "Legado (immediate mode)" } },
  ],
  entries: [
    ...contextEntries,
    ...bufferEntries,
    ...vertexArrayEntries,
    ...shaderEntries,
    ...uniformEntries,
    ...drawingEntries,
    ...textureEntries,
    ...fragmentOpEntries,
    ...framebufferEntries,
    ...dsaEntries,
    ...computeEntries,
    ...debugEntries,
    ...legacyEntries,
  ],
};
