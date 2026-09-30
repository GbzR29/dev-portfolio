"use client";

// The Vulkan track: the explicit GPU API, built up from an empty window to a
// textured, depth-tested scene. Vulkan 1.3 core (dynamic rendering,
// synchronization2), the plain C API from C++, SDL3 for the window.

import type { Chapter } from "@/lib/tracks/types";

const FOUNDATIONS = "Foundations";
const PRESENTATION = "Presentation";

export const vulkanChapters: Chapter[] = [
  { id: "why-vulkan", section: FOUNDATIONS,  title: "Why Vulkan: The Explicit GPU API",          minRead: 18, load: () => import("./chapters/why-vulkan").then((m) => m.WhyVulkanContent) },
  { id: "instance",   section: FOUNDATIONS,  title: "Instance, Extensions & Validation Layers",  minRead: 19, load: () => import("./chapters/instance").then((m) => m.InstanceContent) },
  { id: "devices",    section: FOUNDATIONS,  title: "Physical Devices, Queue Families & the Logical Device", minRead: 20, load: () => import("./chapters/devices").then((m) => m.DevicesContent) },

  { id: "swapchain",  section: PRESENTATION, title: "Surface, Swapchain & Image Views",          minRead: 22, load: () => import("./chapters/swapchain").then((m) => m.SwapchainContent) },
  { id: "pipeline",   section: PRESENTATION, title: "The Graphics Pipeline",                     minRead: 23, load: () => import("./chapters/pipeline").then((m) => m.PipelineContent) },
  { id: "commands",   section: PRESENTATION, title: "Command Buffers",                           minRead: 20, load: () => import("./chapters/commands").then((m) => m.CommandsContent) },
  { id: "synchronization", section: PRESENTATION, title: "Synchronization: Fences, Semaphores & Barriers", minRead: 24, load: () => import("./chapters/synchronization").then((m) => m.SynchronizationContent) },
];
