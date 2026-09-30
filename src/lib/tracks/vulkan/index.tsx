"use client";

// The Vulkan track: the explicit GPU API, built up from an empty window to a
// textured, depth-tested, multisampled scene with two frames in flight, compute
// particles and bindless textures. Vulkan 1.3 core (dynamic rendering,
// synchronization2), the plain C API from C++, SDL3 for the window.

import type { Chapter } from "@/lib/tracks/types";

const FOUNDATIONS = "Foundations";
const PRESENTATION = "Presentation";
const RESOURCES = "Resources";
const FURTHER = "Going further";

export const vulkanChapters: Chapter[] = [
  { id: "why-vulkan", section: FOUNDATIONS,  title: "Why Vulkan: The Explicit GPU API",          minRead: 18, load: () => import("./chapters/why-vulkan").then((m) => m.WhyVulkanContent) },
  { id: "instance",   section: FOUNDATIONS,  title: "Instance, Extensions & Validation Layers",  minRead: 19, load: () => import("./chapters/instance").then((m) => m.InstanceContent) },
  { id: "devices",    section: FOUNDATIONS,  title: "Physical Devices, Queue Families & the Logical Device", minRead: 20, load: () => import("./chapters/devices").then((m) => m.DevicesContent) },

  { id: "swapchain",  section: PRESENTATION, title: "Surface, Swapchain & Image Views",          minRead: 22, load: () => import("./chapters/swapchain").then((m) => m.SwapchainContent) },
  { id: "pipeline",   section: PRESENTATION, title: "The Graphics Pipeline",                     minRead: 23, load: () => import("./chapters/pipeline").then((m) => m.PipelineContent) },
  { id: "commands",   section: PRESENTATION, title: "Command Buffers",                           minRead: 20, load: () => import("./chapters/commands").then((m) => m.CommandsContent) },
  { id: "synchronization", section: PRESENTATION, title: "Synchronization: Fences, Semaphores & Barriers", minRead: 24, load: () => import("./chapters/synchronization").then((m) => m.SynchronizationContent) },

  { id: "buffers-memory", section: RESOURCES, title: "Buffers & Memory",                         minRead: 22, load: () => import("./chapters/buffers-memory").then((m) => m.BuffersMemoryContent) },
  { id: "staging",    section: RESOURCES,    title: "Staging Buffers & Transfers",               minRead: 19, load: () => import("./chapters/staging").then((m) => m.StagingContent) },
  { id: "descriptors", section: RESOURCES,   title: "Descriptors, Uniforms & Push Constants",    minRead: 24, load: () => import("./chapters/descriptors").then((m) => m.DescriptorsContent) },
  { id: "textures",   section: RESOURCES,    title: "Textures & Samplers",                       minRead: 25, load: () => import("./chapters/textures").then((m) => m.TexturesContent) },
  { id: "depth",      section: RESOURCES,    title: "Depth Buffering & Face Culling",            minRead: 23, load: () => import("./chapters/depth").then((m) => m.DepthContent) },

  { id: "frames-in-flight", section: FURTHER, title: "Frames in Flight & Resizing",              minRead: 21, load: () => import("./chapters/frames-in-flight").then((m) => m.FramesInFlightContent) },
  { id: "mipmaps-msaa", section: FURTHER,    title: "Mipmaps & Multisampling",                   minRead: 25, load: () => import("./chapters/mipmaps-msaa").then((m) => m.MipmapsMsaaContent) },
  { id: "compute",    section: FURTHER,      title: "Compute Shaders",                           minRead: 24, load: () => import("./chapters/compute").then((m) => m.ComputeContent) },
  { id: "modern",     section: FURTHER,      title: "Modern Vulkan: Bindless, Device Addresses & Timelines", minRead: 24, load: () => import("./chapters/modern").then((m) => m.ModernContent) },
];
