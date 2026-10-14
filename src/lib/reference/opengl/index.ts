// src/lib/reference/opengl/index.ts
// OpenGL function reference. One file per category; order here is display order.

import type { Reference } from "../types";
import { contextEntries } from "./context";
import { bufferEntries } from "./buffers";
import { bufferStorageEntries } from "./bufferStorage";
import { vertexArrayEntries } from "./vertexArrays";
import { vertexInputExtraEntries } from "./vertexInputExtras";
import { shaderEntries } from "./shaders";
import { uniformEntries } from "./uniforms";
import { uniformExtraEntries } from "./uniformExtras";
import { drawingEntries } from "./drawing";
import { drawingAdvancedEntries } from "./drawingAdvanced";
import { textureEntries } from "./textures";
import { textureUploadEntries } from "./textureUploads";
import { fragmentOpEntries } from "./fragmentOps";
import { blendingEntries } from "./blending";
import { rasterizationEntries } from "./rasterization";
import { stencilEntries } from "./stencil";
import { framebufferEntries } from "./framebuffers";
import { framebufferExtraEntries } from "./framebufferExtras";
import { dsaEntries } from "./dsa";
import { dsaBufferEntries } from "./dsaBuffers";
import { dsaTextureEntries } from "./dsaTextures";
import { dsaFramebufferEntries } from "./dsaFramebuffers";
import { computeEntries } from "./compute";
import { syncEntries } from "./sync";
import { queryEntries } from "./queries";
import { debugEntries } from "./debug";
import { legacyEntries } from "./legacy";
import { familyEntries } from "./families";

export const openGLReference: Reference = {
  trackPath: "OpenGL",
  title: "OpenGL 4.6",
  tokenPattern: /\bgl[A-Z][A-Za-z0-9]*\b/g,
  categories: [
    { id: "families",      title: { en: "Function families",         pt: "Famílias de funções" } },
    { id: "context",       title: { en: "Context & state",           pt: "Contexto e estado" } },
    { id: "buffers",       title: { en: "Buffers",                   pt: "Buffers" } },
    { id: "vertex-arrays", title: { en: "Vertex arrays",             pt: "Vertex arrays" } },
    { id: "shaders",       title: { en: "Shaders & programs",        pt: "Shaders e programas" } },
    { id: "uniforms",      title: { en: "Uniforms",                  pt: "Uniforms" } },
    { id: "drawing",       title: { en: "Drawing",                   pt: "Desenho" } },
    { id: "textures",      title: { en: "Textures",                  pt: "Texturas" } },
    { id: "fragment-ops",  title: { en: "Depth, blending & culling", pt: "Profundidade, blending e culling" } },
    { id: "stencil",       title: { en: "Stencil",                   pt: "Stencil" } },
    { id: "framebuffers",  title: { en: "Framebuffers",              pt: "Framebuffers" } },
    { id: "dsa",           title: { en: "Direct State Access",       pt: "Direct State Access" } },
    { id: "compute",       title: { en: "Compute",                   pt: "Compute" } },
    { id: "sync",          title: { en: "Sync & queries",            pt: "Sincronização e queries" } },
    { id: "debug",         title: { en: "Debugging",                 pt: "Depuração" } },
    { id: "legacy",        title: { en: "Legacy (immediate mode)",   pt: "Legado (immediate mode)" } },
  ],
  entries: [
    ...contextEntries,
    ...bufferEntries,
    ...bufferStorageEntries,
    ...vertexArrayEntries,
    ...vertexInputExtraEntries,
    ...shaderEntries,
    ...uniformEntries,
    ...uniformExtraEntries,
    ...drawingEntries,
    ...drawingAdvancedEntries,
    ...textureEntries,
    ...textureUploadEntries,
    ...fragmentOpEntries,
    ...blendingEntries,
    ...rasterizationEntries,
    ...stencilEntries,
    ...framebufferEntries,
    ...framebufferExtraEntries,
    ...dsaEntries,
    ...dsaBufferEntries,
    ...dsaTextureEntries,
    ...dsaFramebufferEntries,
    ...computeEntries,
    ...syncEntries,
    ...queryEntries,
    ...debugEntries,
    ...legacyEntries,
    ...familyEntries,
  ],
};
