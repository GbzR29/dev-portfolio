// src/lib/tracks/opengl/index.tsx
"use client";

// The OpenGL 4.6 track. This file only lists the chapters; each chapter's
// content lives in its own module under ./chapters and is loaded on demand.

import type { Chapter } from "@/lib/tracks/types";

// ── Exported track ────────────────────────────────────────────────────────────

const GETTING_STARTED = "Getting Started";
const TRANSFORMS      = "3D & Transformations";
const LIGHTING        = "Lighting";
const ADV_LIGHTING    = "Advanced Lighting";
const PBR             = "PBR";
const POST            = "Post-Processing & Effects";
const MODELS          = "Model Loading";
const ADVANCED        = "Advanced OpenGL";
const TECH            = "Advanced Techniques";
const PERF            = "Performance";
const MODERN          = "Modern OpenGL & Tooling";

export const openGLChapters: Chapter[] = [
  // ── Getting Started ──────────────────────────────────────────────────────
  { id: "legacy",          section: GETTING_STARTED, title: "Legacy & Modern OpenGL",    minRead: 10, load: () => import("./chapters/legacy").then((m) => m.LegacyContent) },
  { id: "setup",           section: GETTING_STARTED, title: "Window & Context",          minRead: 10, load: () => import("./chapters/setup").then((m) => m.SetupContent) },
  { id: "pipeline",        section: GETTING_STARTED, title: "The Graphics Pipeline",     minRead: 8,  load: () => import("./chapters/pipeline").then((m) => m.PipelineContent) },
  { id: "vbo",             section: GETTING_STARTED, title: "Vertex Buffer Objects",     minRead: 10, load: () => import("./chapters/vbo").then((m) => m.VBOContent) },
  { id: "vao",             section: GETTING_STARTED, title: "Vertex Array Objects",      minRead: 7,  load: () => import("./chapters/vao").then((m) => m.VAOContent) },
  { id: "shaders",         section: GETTING_STARTED, title: "First Shaders",             minRead: 9,  load: () => import("./chapters/shaders").then((m) => m.ShadersContent) },
  { id: "triangle",        section: GETTING_STARTED, title: "Drawing the Triangle",      minRead: 5,  load: () => import("./chapters/triangle").then((m) => m.TriangleContent) },
  { id: "ebo",             section: GETTING_STARTED, title: "Indexed Drawing (EBO)",     minRead: 8,  load: () => import("./chapters/ebo").then((m) => m.EBOContent) },
  { id: "textures",        section: GETTING_STARTED, title: "Textures",                  minRead: 12, load: () => import("./chapters/textures").then((m) => m.TexturesContent) },

  // ── 3D & Transformations ─────────────────────────────────────────────────
  { id: "linear-algebra",  section: TRANSFORMS,      title: "Linear Algebra for 3D",     minRead: 14, load: () => import("./chapters/linear-algebra").then((m) => m.LinearAlgebraContent) },
  { id: "transformations", section: TRANSFORMS,      title: "Transformations + GLM",     minRead: 11, load: () => import("./chapters/transformations").then((m) => m.TransformationsContent) },
  { id: "camera",          section: TRANSFORMS,      title: "Camera & View Matrix",      minRead: 11, load: () => import("./chapters/transforms").then((m) => m.CameraContent) },
  { id: "depth-testing",   section: TRANSFORMS,      title: "Depth Testing",             minRead: 9,  load: () => import("./chapters/transforms").then((m) => m.DepthTestingContent) },

  // ── Lighting ─────────────────────────────────────────────────────────────
  { id: "light-color",     section: LIGHTING,        title: "Light & Color",             minRead: 7,  load: () => import("./chapters/lighting-basics").then((m) => m.LightColorContent) },
  { id: "lighting",        section: LIGHTING,        title: "Basic Lighting (Phong)",    minRead: 18, load: () => import("./chapters/lighting-basics").then((m) => m.BasicLightingContent) },
  { id: "materials",       section: LIGHTING,        title: "Materials",                 minRead: 9,  load: () => import("./chapters/lighting-basics").then((m) => m.MaterialsContent) },
  { id: "lighting-maps",   section: LIGHTING,        title: "Lighting Maps",             minRead: 9,  load: () => import("./chapters/lighting-basics").then((m) => m.LightingMapsContent) },
  { id: "light-casters",   section: LIGHTING,        title: "Light Casters",             minRead: 14, load: () => import("./chapters/lighting-basics").then((m) => m.LightCastersContent) },
  { id: "multiple-lights", section: LIGHTING,        title: "Multiple Lights",           minRead: 9,  load: () => import("./chapters/lighting-basics").then((m) => m.MultipleLightsContent) },

  { id: "advanced-lighting", section: ADV_LIGHTING,  title: "Blinn-Phong",               minRead: 9,  load: () => import("./chapters/lighting-advanced").then((m) => m.BlinnPhongContent) },
  { id: "gamma",           section: ADV_LIGHTING,    title: "Gamma Correction",          minRead: 10, load: () => import("./chapters/lighting-advanced").then((m) => m.GammaContent) },
  { id: "shadow-mapping",  section: ADV_LIGHTING,    title: "Shadow Mapping",            minRead: 14, load: () => import("./chapters/lighting-advanced").then((m) => m.ShadowMappingContent) },
  { id: "point-shadows",   section: ADV_LIGHTING,    title: "Point Shadows",             minRead: 10, load: () => import("./chapters/lighting-advanced").then((m) => m.PointShadowsContent) },
  { id: "cascaded-shadows", section: ADV_LIGHTING,   title: "Cascaded Shadow Maps",      minRead: 15, load: () => import("./chapters/csm").then((m) => m.CascadedShadowsContent) },
  { id: "normal-mapping",  section: ADV_LIGHTING,    title: "Normal Mapping",            minRead: 12, load: () => import("./chapters/lighting-advanced").then((m) => m.NormalMappingContent) },
  { id: "hdr",             section: ADV_LIGHTING,    title: "HDR & Tone Mapping",        minRead: 10, load: () => import("./chapters/lighting-advanced").then((m) => m.HdrContent) },
  { id: "bloom",           section: ADV_LIGHTING,    title: "Bloom",                     minRead: 10, load: () => import("./chapters/lighting-advanced").then((m) => m.BloomContent) },
  { id: "color-spaces",    section: ADV_LIGHTING,    title: "Colour Spaces & ACES",      minRead: 15, load: () => import("./chapters/color").then((m) => m.ColorSpacesContent) },
  { id: "deferred",        section: ADV_LIGHTING,    title: "Deferred Shading",          minRead: 12, load: () => import("./chapters/lighting-advanced").then((m) => m.DeferredContent) },
  { id: "global-illumination", section: ADV_LIGHTING, title: "Global Illumination",      minRead: 16, load: () => import("./chapters/gi").then((m) => m.GiContent) },

  // ── PBR ──────────────────────────────────────────────────────────────────
  { id: "pbr-theory",      section: PBR,             title: "PBR Theory",                minRead: 16, load: () => import("./chapters/pbr").then((m) => m.PbrTheoryContent) },
  { id: "pbr-lighting",    section: PBR,             title: "Cook-Torrance Lighting",    minRead: 16, load: () => import("./chapters/pbr").then((m) => m.PbrLightingContent) },
  { id: "ibl-diffuse",     section: PBR,             title: "IBL: Diffuse Irradiance",   minRead: 13, load: () => import("./chapters/pbr").then((m) => m.IblDiffuseContent) },
  { id: "ibl-specular",    section: PBR,             title: "IBL: Specular",             minRead: 16, load: () => import("./chapters/pbr").then((m) => m.IblSpecularContent) },

  // ── Post-Processing & Effects ────────────────────────────────────────────
  { id: "post-processing", section: POST,            title: "Post-Processing",           minRead: 14, load: () => import("./chapters/post").then((m) => m.PostProcessingContent) },
  { id: "ssao",            section: POST,            title: "SSAO",                      minRead: 14, load: () => import("./chapters/post").then((m) => m.SsaoContent) },
  { id: "parallax-mapping", section: POST,           title: "Parallax Mapping",          minRead: 12, load: () => import("./chapters/post").then((m) => m.ParallaxContent) },
  { id: "anti-aliasing",   section: POST,            title: "Anti-Aliasing",             minRead: 14, load: () => import("./chapters/post").then((m) => m.AntiAliasingContent) },
  { id: "taa",             section: POST,            title: "Temporal AA & Upscaling",   minRead: 16, load: () => import("./chapters/temporal").then((m) => m.TaaContent) },

  // ── Model Loading ────────────────────────────────────────────────────────
  { id: "model-loading",   section: MODELS,          title: "Model Loading (Assimp)",    minRead: 13, load: () => import("./chapters/models").then((m) => m.ModelLoadingContent) },

  // ── Advanced OpenGL ──────────────────────────────────────────────────────
  { id: "stencil-testing", section: ADVANCED,        title: "Stencil Testing",           minRead: 12, load: () => import("./chapters/stencil").then((m) => m.StencilContent) },
  { id: "blending",        section: ADVANCED,        title: "Blending & Transparency",   minRead: 10, load: () => import("./chapters/advanced").then((m) => m.BlendingContent) },
  { id: "framebuffers",    section: ADVANCED,        title: "Framebuffers & Post-FX",    minRead: 12, load: () => import("./chapters/advanced").then((m) => m.FramebuffersContent) },
  { id: "cubemaps",        section: ADVANCED,        title: "Cubemaps & Skybox",         minRead: 32, load: () => import("./chapters/advanced").then((m) => m.CubemapsContent) },
  { id: "instancing",      section: ADVANCED,        title: "Instancing",                minRead: 9,  load: () => import("./chapters/advanced").then((m) => m.InstancingContent) },
  { id: "particles",       section: ADVANCED,        title: "Particles",                 minRead: 21, load: () => import("./chapters/particles").then((m) => m.ParticlesContent) },
  { id: "ubo",             section: ADVANCED,        title: "Uniform Buffer Objects",    minRead: 10, load: () => import("./chapters/advanced").then((m) => m.UBOContent) },
  { id: "geometry-shader", section: ADVANCED,        title: "Geometry Shader",           minRead: 13, load: () => import("./chapters/shader-stages").then((m) => m.GeometryShaderContent) },
  { id: "tessellation",    section: ADVANCED,        title: "Tessellation",              minRead: 15, load: () => import("./chapters/shader-stages").then((m) => m.TessellationContent) },

  // ── Advanced Techniques ──────────────────────────────────────────────────
  { id: "skeletal-animation", section: TECH,      title: "Skeletal Animation",        minRead: 18, load: () => import("./chapters/skeletal").then((m) => m.SkeletalContent) },
  { id: "text-rendering",  section: TECH,            title: "Text Rendering",            minRead: 14, load: () => import("./chapters/text").then((m) => m.TextContent) },
  { id: "picking",         section: TECH,            title: "Picking",                   minRead: 13, load: () => import("./chapters/picking").then((m) => m.PickingContent) },
  { id: "oit",             section: TECH,            title: "Order-Independent Transparency", minRead: 13, load: () => import("./chapters/oit").then((m) => m.OitContent) },
  { id: "reflections",     section: TECH,            title: "Reflections",               minRead: 14, load: () => import("./chapters/reflections").then((m) => m.ReflectionsContent) },
  { id: "volumetrics",     section: TECH,            title: "Atmosphere & Volumetrics",  minRead: 16, load: () => import("./chapters/volumetrics").then((m) => m.VolumetricsContent) },
  { id: "decals",          section: TECH,            title: "Decals",                    minRead: 11, load: () => import("./chapters/decals").then((m) => m.DecalsContent) },
  { id: "terrain",         section: TECH,            title: "Terrain Rendering",         minRead: 15, load: () => import("./chapters/terrain").then((m) => m.TerrainContent) },

  // ── Performance ──────────────────────────────────────────────────────────
  { id: "profiling",       section: PERF,            title: "Measuring Performance",     minRead: 13, load: () => import("./chapters/performance").then((m) => m.ProfilingContent) },
  { id: "winding",         section: PERF,            title: "Face Winding & Culling",    minRead: 11, load: () => import("./chapters/winding").then((m) => m.WindingContent) },
  { id: "frustum-culling", section: PERF,            title: "Frustum & Occlusion Culling", minRead: 14, load: () => import("./chapters/performance").then((m) => m.FrustumCullingContent) },
  { id: "draw-calls",      section: PERF,            title: "Draw Calls & State",        minRead: 13, load: () => import("./chapters/performance").then((m) => m.DrawCallsContent) },
  { id: "clustered-shading", section: PERF,          title: "Forward+ & Clustered Shading", minRead: 14, load: () => import("./chapters/clustered").then((m) => m.ClusteredContent) },
  { id: "lod",             section: PERF,            title: "Level of Detail",           minRead: 12, load: () => import("./chapters/performance").then((m) => m.LodContent) },
  { id: "texture-compression", section: PERF,        title: "Mipmapping & Texture Compression", minRead: 14, load: () => import("./chapters/texturecompression").then((m) => m.TextureCompressionContent) },
  { id: "streaming",       section: PERF,            title: "Buffer Streaming & Sync",   minRead: 12, load: () => import("./chapters/performance").then((m) => m.StreamingContent) },

  // ── Modern OpenGL & Tooling ──────────────────────────────────────────────
  { id: "dsa",             section: MODERN,          title: "Direct State Access (DSA)", minRead: 9,  load: () => import("./chapters/dsa").then((m) => m.DSAContent) },
  { id: "debugging",       section: MODERN,          title: "Debugging OpenGL",          minRead: 11, load: () => import("./chapters/tooling").then((m) => m.DebuggingContent) },
  { id: "compute",         section: MODERN,          title: "Compute Shaders",           minRead: 13, load: () => import("./chapters/tooling").then((m) => m.ComputeContent) },
];
