// src/lib/tracks/opengl/index.tsx
"use client";

// The OpenGL 4.6 track. This file only lists the chapters; each chapter's
// content lives in its own module under ./chapters.

import type { Chapter } from "@/lib/tracks/types";
import { LegacyContent } from "./chapters/legacy";
import { SetupContent } from "./chapters/setup";
import { PipelineContent } from "./chapters/pipeline";
import { VBOContent } from "./chapters/vbo";
import { VAOContent } from "./chapters/vao";
import { ShadersContent } from "./chapters/shaders";
import { TriangleContent } from "./chapters/triangle";
import { EBOContent } from "./chapters/ebo";
import { TexturesContent } from "./chapters/textures";
import { LinearAlgebraContent } from "./chapters/linear-algebra";
import { TransformationsContent } from "./chapters/transformations";
import { CameraContent, DepthTestingContent } from "./chapters/transforms";
import { LightColorContent, BasicLightingContent, MaterialsContent, LightingMapsContent, LightCastersContent, MultipleLightsContent } from "./chapters/lighting-basics";
import { BlinnPhongContent, GammaContent, ShadowMappingContent, PointShadowsContent, NormalMappingContent, HdrContent, BloomContent, DeferredContent } from "./chapters/lighting-advanced";
import { CascadedShadowsContent } from "./chapters/csm";
import { ColorSpacesContent } from "./chapters/color";
import { GiContent } from "./chapters/gi";
import { PbrTheoryContent, PbrLightingContent, IblDiffuseContent, IblSpecularContent } from "./chapters/pbr";
import { PostProcessingContent, SsaoContent, ParallaxContent, AntiAliasingContent } from "./chapters/post";
import { TaaContent } from "./chapters/temporal";
import { ModelLoadingContent } from "./chapters/models";
import { StencilContent } from "./chapters/stencil";
import { BlendingContent, FramebuffersContent, CubemapsContent, InstancingContent, UBOContent } from "./chapters/advanced";
import { ParticlesContent } from "./chapters/particles";
import { GeometryShaderContent, TessellationContent } from "./chapters/shader-stages";
import { SkeletalContent } from "./chapters/skeletal";
import { TextContent } from "./chapters/text";
import { PickingContent } from "./chapters/picking";
import { OitContent } from "./chapters/oit";
import { ReflectionsContent } from "./chapters/reflections";
import { VolumetricsContent } from "./chapters/volumetrics";
import { DecalsContent } from "./chapters/decals";
import { TerrainContent } from "./chapters/terrain";
import { ProfilingContent, FrustumCullingContent, DrawCallsContent, LodContent, StreamingContent } from "./chapters/performance";
import { WindingContent } from "./chapters/winding";
import { ClusteredContent } from "./chapters/clustered";
import { TextureCompressionContent } from "./chapters/texturecompression";
import { DSAContent } from "./chapters/dsa";
import { DebuggingContent, ComputeContent } from "./chapters/tooling";

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
  { id: "legacy",          section: GETTING_STARTED, title: "Legacy & Modern OpenGL",    minRead: 10, content: (t) => <LegacyContent          t={t} /> },
  { id: "setup",           section: GETTING_STARTED, title: "Window & Context",          minRead: 10, content: (t) => <SetupContent           t={t} /> },
  { id: "pipeline",        section: GETTING_STARTED, title: "The Graphics Pipeline",     minRead: 8,  content: (t) => <PipelineContent        t={t} /> },
  { id: "vbo",             section: GETTING_STARTED, title: "Vertex Buffer Objects",     minRead: 10, content: (t) => <VBOContent             t={t} /> },
  { id: "vao",             section: GETTING_STARTED, title: "Vertex Array Objects",      minRead: 7,  content: (t) => <VAOContent             t={t} /> },
  { id: "shaders",         section: GETTING_STARTED, title: "First Shaders",             minRead: 9,  content: (t) => <ShadersContent         t={t} /> },
  { id: "triangle",        section: GETTING_STARTED, title: "Drawing the Triangle",      minRead: 5,  content: (t) => <TriangleContent        t={t} /> },
  { id: "ebo",             section: GETTING_STARTED, title: "Indexed Drawing (EBO)",     minRead: 8,  content: (t) => <EBOContent             t={t} /> },
  { id: "textures",        section: GETTING_STARTED, title: "Textures",                  minRead: 12, content: (t) => <TexturesContent        t={t} /> },

  // ── 3D & Transformations ─────────────────────────────────────────────────
  { id: "linear-algebra",  section: TRANSFORMS,      title: "Linear Algebra for 3D",     minRead: 14, content: (t) => <LinearAlgebraContent   t={t} /> },
  { id: "transformations", section: TRANSFORMS,      title: "Transformations + GLM",     minRead: 11, content: (t) => <TransformationsContent t={t} /> },
  { id: "camera",          section: TRANSFORMS,      title: "Camera & View Matrix",      minRead: 11, content: (t) => <CameraContent          t={t} /> },
  { id: "depth-testing",   section: TRANSFORMS,      title: "Depth Testing",             minRead: 9,  content: (t) => <DepthTestingContent    t={t} /> },

  // ── Lighting ─────────────────────────────────────────────────────────────
  { id: "light-color",     section: LIGHTING,        title: "Light & Color",             minRead: 7,  content: (t) => <LightColorContent      t={t} /> },
  { id: "lighting",        section: LIGHTING,        title: "Basic Lighting (Phong)",    minRead: 18, content: (t) => <BasicLightingContent   t={t} /> },
  { id: "materials",       section: LIGHTING,        title: "Materials",                 minRead: 9,  content: (t) => <MaterialsContent       t={t} /> },
  { id: "lighting-maps",   section: LIGHTING,        title: "Lighting Maps",             minRead: 9,  content: (t) => <LightingMapsContent    t={t} /> },
  { id: "light-casters",   section: LIGHTING,        title: "Light Casters",             minRead: 14, content: (t) => <LightCastersContent    t={t} /> },
  { id: "multiple-lights", section: LIGHTING,        title: "Multiple Lights",           minRead: 9,  content: (t) => <MultipleLightsContent  t={t} /> },

  { id: "advanced-lighting", section: ADV_LIGHTING,  title: "Blinn-Phong",               minRead: 9,  content: (t) => <BlinnPhongContent      t={t} /> },
  { id: "gamma",           section: ADV_LIGHTING,    title: "Gamma Correction",          minRead: 10, content: (t) => <GammaContent           t={t} /> },
  { id: "shadow-mapping",  section: ADV_LIGHTING,    title: "Shadow Mapping",            minRead: 14, content: (t) => <ShadowMappingContent   t={t} /> },
  { id: "point-shadows",   section: ADV_LIGHTING,    title: "Point Shadows",             minRead: 10, content: (t) => <PointShadowsContent    t={t} /> },
  { id: "cascaded-shadows", section: ADV_LIGHTING,   title: "Cascaded Shadow Maps",      minRead: 15, content: (t) => <CascadedShadowsContent t={t} /> },
  { id: "normal-mapping",  section: ADV_LIGHTING,    title: "Normal Mapping",            minRead: 12, content: (t) => <NormalMappingContent   t={t} /> },
  { id: "hdr",             section: ADV_LIGHTING,    title: "HDR & Tone Mapping",        minRead: 10, content: (t) => <HdrContent             t={t} /> },
  { id: "bloom",           section: ADV_LIGHTING,    title: "Bloom",                     minRead: 10, content: (t) => <BloomContent           t={t} /> },
  { id: "color-spaces",    section: ADV_LIGHTING,    title: "Colour Spaces & ACES",      minRead: 15, content: (t) => <ColorSpacesContent     t={t} /> },
  { id: "deferred",        section: ADV_LIGHTING,    title: "Deferred Shading",          minRead: 12, content: (t) => <DeferredContent        t={t} /> },
  { id: "global-illumination", section: ADV_LIGHTING, title: "Global Illumination",      minRead: 16, content: (t) => <GiContent              t={t} /> },

  // ── PBR ──────────────────────────────────────────────────────────────────
  { id: "pbr-theory",      section: PBR,             title: "PBR Theory",                minRead: 16, content: (t) => <PbrTheoryContent       t={t} /> },
  { id: "pbr-lighting",    section: PBR,             title: "Cook-Torrance Lighting",    minRead: 16, content: (t) => <PbrLightingContent     t={t} /> },
  { id: "ibl-diffuse",     section: PBR,             title: "IBL: Diffuse Irradiance",   minRead: 13, content: (t) => <IblDiffuseContent      t={t} /> },
  { id: "ibl-specular",    section: PBR,             title: "IBL: Specular",             minRead: 16, content: (t) => <IblSpecularContent     t={t} /> },

  // ── Post-Processing & Effects ────────────────────────────────────────────
  { id: "post-processing", section: POST,            title: "Post-Processing",           minRead: 14, content: (t) => <PostProcessingContent  t={t} /> },
  { id: "ssao",            section: POST,            title: "SSAO",                      minRead: 14, content: (t) => <SsaoContent            t={t} /> },
  { id: "parallax-mapping", section: POST,           title: "Parallax Mapping",          minRead: 12, content: (t) => <ParallaxContent        t={t} /> },
  { id: "anti-aliasing",   section: POST,            title: "Anti-Aliasing",             minRead: 14, content: (t) => <AntiAliasingContent    t={t} /> },
  { id: "taa",             section: POST,            title: "Temporal AA & Upscaling",   minRead: 16, content: (t) => <TaaContent             t={t} /> },

  // ── Model Loading ────────────────────────────────────────────────────────
  { id: "model-loading",   section: MODELS,          title: "Model Loading (Assimp)",    minRead: 13, content: (t) => <ModelLoadingContent    t={t} /> },

  // ── Advanced OpenGL ──────────────────────────────────────────────────────
  { id: "stencil-testing", section: ADVANCED,        title: "Stencil Testing",           minRead: 12, content: (t) => <StencilContent         t={t} /> },
  { id: "blending",        section: ADVANCED,        title: "Blending & Transparency",   minRead: 10, content: (t) => <BlendingContent        t={t} /> },
  { id: "framebuffers",    section: ADVANCED,        title: "Framebuffers & Post-FX",    minRead: 12, content: (t) => <FramebuffersContent    t={t} /> },
  { id: "cubemaps",        section: ADVANCED,        title: "Cubemaps & Skybox",         minRead: 32, content: (t) => <CubemapsContent        t={t} /> },
  { id: "instancing",      section: ADVANCED,        title: "Instancing",                minRead: 9,  content: (t) => <InstancingContent      t={t} /> },
  { id: "particles",       section: ADVANCED,        title: "Particles",                 minRead: 21, content: (t) => <ParticlesContent       t={t} /> },
  { id: "ubo",             section: ADVANCED,        title: "Uniform Buffer Objects",    minRead: 10, content: (t) => <UBOContent             t={t} /> },
  { id: "geometry-shader", section: ADVANCED,        title: "Geometry Shader",           minRead: 13, content: (t) => <GeometryShaderContent  t={t} /> },
  { id: "tessellation",    section: ADVANCED,        title: "Tessellation",              minRead: 15, content: (t) => <TessellationContent    t={t} /> },

  // ── Advanced Techniques ──────────────────────────────────────────────────
  { id: "skeletal-animation", section: TECH,      title: "Skeletal Animation",        minRead: 18, content: (t) => <SkeletalContent        t={t} /> },
  { id: "text-rendering",  section: TECH,            title: "Text Rendering",            minRead: 14, content: (t) => <TextContent            t={t} /> },
  { id: "picking",         section: TECH,            title: "Picking",                   minRead: 13, content: (t) => <PickingContent         t={t} /> },
  { id: "oit",             section: TECH,            title: "Order-Independent Transparency", minRead: 13, content: (t) => <OitContent        t={t} /> },
  { id: "reflections",     section: TECH,            title: "Reflections",               minRead: 14, content: (t) => <ReflectionsContent     t={t} /> },
  { id: "volumetrics",     section: TECH,            title: "Atmosphere & Volumetrics",  minRead: 16, content: (t) => <VolumetricsContent     t={t} /> },
  { id: "decals",          section: TECH,            title: "Decals",                    minRead: 11, content: (t) => <DecalsContent          t={t} /> },
  { id: "terrain",         section: TECH,            title: "Terrain Rendering",         minRead: 15, content: (t) => <TerrainContent         t={t} /> },

  // ── Performance ──────────────────────────────────────────────────────────
  { id: "profiling",       section: PERF,            title: "Measuring Performance",     minRead: 13, content: (t) => <ProfilingContent       t={t} /> },
  { id: "winding",         section: PERF,            title: "Face Winding & Culling",    minRead: 11, content: (t) => <WindingContent         t={t} /> },
  { id: "frustum-culling", section: PERF,            title: "Frustum & Occlusion Culling", minRead: 14, content: (t) => <FrustumCullingContent t={t} /> },
  { id: "draw-calls",      section: PERF,            title: "Draw Calls & State",        minRead: 13, content: (t) => <DrawCallsContent       t={t} /> },
  { id: "clustered-shading", section: PERF,          title: "Forward+ & Clustered Shading", minRead: 14, content: (t) => <ClusteredContent     t={t} /> },
  { id: "lod",             section: PERF,            title: "Level of Detail",           minRead: 12, content: (t) => <LodContent             t={t} /> },
  { id: "texture-compression", section: PERF,        title: "Mipmapping & Texture Compression", minRead: 14, content: (t) => <TextureCompressionContent t={t} /> },
  { id: "streaming",       section: PERF,            title: "Buffer Streaming & Sync",   minRead: 12, content: (t) => <StreamingContent       t={t} /> },

  // ── Modern OpenGL & Tooling ──────────────────────────────────────────────
  { id: "dsa",             section: MODERN,          title: "Direct State Access (DSA)", minRead: 9,  content: (t) => <DSAContent             t={t} /> },
  { id: "debugging",       section: MODERN,          title: "Debugging OpenGL",          minRead: 11, content: (t) => <DebuggingContent       t={t} /> },
  { id: "compute",         section: MODERN,          title: "Compute Shaders",           minRead: 13, content: (t) => <ComputeContent         t={t} /> },
];
