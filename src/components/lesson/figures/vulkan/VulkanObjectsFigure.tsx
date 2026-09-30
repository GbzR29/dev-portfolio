"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Readout, Row, C, T } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The map of Vulkan objects used in this track. Solid lines are "created
// from" (the parent must outlive the child); dashed lines, drawn only for the
// selected object, are "uses". The VkDevice is a band because almost
// everything hangs from it. Clicking an object shows how it is made, what it
// is for and which chapter builds it.

type Obj = {
  id: string; name: string; fn: string; x: number; y: number;
  parent?: string; uses?: string[]; ch: string; desc: string;
};

const W = 736, H = 338, NW = 106, NH = 24, BAND_Y = 112;
const XP = 74, XC = 194, XL = 314, XA = 434, XB = 554, XS = 674;

const OBJS: Obj[] = [
  { id: "instance", name: "VkInstance", fn: "vkCreateInstance", x: 360, y: 14, ch: "instance", desc: "The connection between your program and the Vulkan loader. It holds the enabled instance extensions and layers, and every other object hangs from it." },
  { id: "messenger", name: "DebugUtilsMessenger", fn: "vkCreateDebugUtilsMessengerEXT", x: 120, y: 62, parent: "instance", ch: "instance", desc: "A callback that the validation layers call with their messages. Only created in debug builds." },
  { id: "surface", name: "VkSurfaceKHR", fn: "SDL_Vulkan_CreateSurface", x: 270, y: 62, parent: "instance", ch: "swapchain", desc: "The window as Vulkan sees it: a platform-independent handle to something that can show images." },
  { id: "physical", name: "VkPhysicalDevice", fn: "vkEnumeratePhysicalDevices", x: 520, y: 62, parent: "instance", ch: "devices", desc: "One GPU installed in the machine. You do not create it: you list the GPUs and read their properties, features, memory types and queue families." },
  { id: "queue", name: "VkQueue", fn: "vkGetDeviceQueue", x: XC, y: 168, ch: "devices", desc: "Where work is submitted. Queues are created together with the device; you only fetch their handles, and never destroy them." },
  { id: "pool", name: "VkCommandPool", fn: "vkCreateCommandPool", x: XC, y: 212, uses: ["queue"], ch: "commands", desc: "An allocator for command buffers, tied to one queue family. Pools are not thread-safe, so each recording thread gets its own." },
  { id: "cmd", name: "VkCommandBuffer", fn: "vkAllocateCommandBuffers", x: XC, y: 256, parent: "pool", ch: "commands", desc: "A recorded list of GPU commands: begin rendering, bind, draw, copy. Recording costs CPU time only; nothing runs until the buffer is submitted to a queue." },
  { id: "swapchain", name: "VkSwapchainKHR", fn: "vkCreateSwapchainKHR", x: XP, y: 168, uses: ["surface"], ch: "swapchain", desc: "A small ring of images owned by the presentation engine. You render into one, present it, and take the next." },
  { id: "swapimg", name: "VkImage (swap)", fn: "vkGetSwapchainImagesKHR", x: XP, y: 212, parent: "swapchain", ch: "swapchain", desc: "The swapchain's images. The swapchain created them, so the swapchain destroys them; you never call vkDestroyImage on these." },
  { id: "shader", name: "VkShaderModule", fn: "vkCreateShaderModule", x: XL, y: 168, ch: "pipeline", desc: "Compiled SPIR-V code for one or more shader stages. It is only needed while pipelines are being created, and can be destroyed right after." },
  { id: "dsl", name: "DescriptorSetLayout", fn: "vkCreateDescriptorSetLayout", x: XL, y: 212, ch: "descriptors", desc: "The shape of a group of shader resources: binding 0 is a uniform buffer, binding 1 is a texture, and so on." },
  { id: "layout", name: "VkPipelineLayout", fn: "vkCreatePipelineLayout", x: XL, y: 256, uses: ["dsl"], ch: "pipeline", desc: "Every resource the pipeline's shaders can reach: the descriptor set layouts plus the push-constant ranges." },
  { id: "pipeline", name: "VkPipeline", fn: "vkCreateGraphicsPipelines", x: XL, y: 300, uses: ["shader", "layout"], ch: "pipeline", desc: "All the state needed to draw, baked into one immutable object: shaders, vertex format, rasterizer, depth test, blending." },
  { id: "memory", name: "VkDeviceMemory", fn: "vkAllocateMemory", x: XA, y: 168, ch: "buffers", desc: "A raw block of memory from one memory type (GPU-only, CPU-visible…). Buffers and images are bound to ranges inside it." },
  { id: "buffer", name: "VkBuffer", fn: "vkCreateBuffer", x: XA, y: 212, uses: ["memory"], ch: "buffers", desc: "A linear range of bytes: vertices, indices, uniforms, anything. It owns no memory until you bind some to it." },
  { id: "image", name: "VkImage", fn: "vkCreateImage", x: XA, y: 256, uses: ["memory"], ch: "textures", desc: "A 1D, 2D or 3D array of texels with a format, mip levels and a layout that the GPU changes between uses. It also needs memory bound to it." },
  { id: "view", name: "VkImageView", fn: "vkCreateImageView", x: XA, y: 300, uses: ["image", "swapimg"], ch: "swapchain", desc: "How to look at an image: which format, which mips and layers, which aspect (colour or depth). Rendering and shaders use views, never bare images." },
  { id: "sampler", name: "VkSampler", fn: "vkCreateSampler", x: XB, y: 168, ch: "textures", desc: "Filtering and addressing state for reading textures: linear or nearest, repeat or clamp, anisotropy. It is independent of any image." },
  { id: "dpool", name: "DescriptorPool", fn: "vkCreateDescriptorPool", x: XB, y: 212, ch: "descriptors", desc: "An allocator for descriptor sets." },
  { id: "dset", name: "VkDescriptorSet", fn: "vkAllocateDescriptorSets", x: XB, y: 256, parent: "dpool", uses: ["dsl", "buffer", "view", "sampler"], ch: "descriptors", desc: "A filled-in group of resources matching a layout: this buffer at binding 0, this texture at binding 1. Bound before drawing." },
  { id: "fence", name: "VkFence", fn: "vkCreateFence", x: XS, y: 168, ch: "sync", desc: "A GPU → CPU signal: the CPU waits on it to know that a submission has finished." },
  { id: "sem", name: "VkSemaphore", fn: "vkCreateSemaphore", x: XS, y: 212, ch: "sync", desc: "A GPU → GPU signal between queue operations (acquire → render → present), with no CPU waiting." },
];
const BY_ID = Object.fromEntries(OBJS.map(o => [o.id, o]));
// Everything below the band without its own parent was created from the device.
const parentOf = (o: Obj) => o.parent ?? (o.y > BAND_Y ? "device" : undefined);

/** The object and every object above it, up to the instance. */
function ancestors(sel: string) {
  const out = new Set<string>();
  for (let id: string | undefined = sel; id; id = id === "device" ? "physical" : BY_ID[id] ? parentOf(BY_ID[id]) : undefined) out.add(id);
  return out;
}

const CHAPTERS: Record<string, string> = {
  instance: "Instance, Extensions & Validation Layers",
  devices: "Physical Devices, Queue Families & the Logical Device",
  swapchain: "Surface, Swapchain & Image Views",
  pipeline: "The Graphics Pipeline",
  commands: "Command Buffers",
  sync: "Synchronization",
  buffers: "Buffers & Memory",
  descriptors: "Descriptors, Uniforms & Push Constants",
  textures: "Textures & Samplers",
};
const GROUPS: [number, string, string][] = [
  [XP, "figVkObj_gPresent", "present"], [XC, "figVkObj_gCmd", "commands"], [XL, "figVkObj_gPipe", "pipelines"],
  [(XA + XB) / 2, "figVkObj_gRes", "resources"], [XS, "figVkObj_gSync", "sync"],
];

export function VulkanObjectsFigure({ t, initial = "device" }: { t?: TrackTranslations; initial?: string }) {
  const [sel, setSel] = useState(initial);

  // Ancestors of the selection, its direct children and what it uses.
  const lineage = ancestors(sel);
  const kids = new Set(OBJS.filter(o => parentOf(o) === sel).map(o => o.id));
  if (sel === "physical") kids.add("device");
  if (sel === "instance") kids.add("device");
  const uses = new Set(sel === "device" ? [] : BY_ID[sel]?.uses ?? []);
  const lit = (id: string) => lineage.has(id) || kids.has(id) || uses.has(id);

  const box = (o: { id: string; name: string; x: number; y: number }) => {
    const on = o.id === sel;
    return (
      <g key={o.id} onClick={() => setSel(o.id)} style={{ cursor: "pointer" }} opacity={lit(o.id) ? 1 : 0.45}>
        <rect x={o.x - NW / 2} y={o.y} width={NW} height={NH} rx={5}
          fill={on ? C.red : uses.has(o.id) ? C.amber : kids.has(o.id) ? C.sky : "var(--card)"} fillOpacity={on ? 0.9 : uses.has(o.id) || kids.has(o.id) ? 0.3 : 1}
          stroke={on ? C.red : C.axis} strokeWidth={on ? 1.6 : 1} />
        <T x={o.x} y={o.y + 15.5} size={8.6} anchor="middle" color={on ? "#fff" : C.fg} bold={on}>{o.name}</T>
      </g>
    );
  };

  const info = sel === "device"
    ? { name: "VkDevice", fn: "vkCreateDevice", ch: "devices", desc: "Your opened session with one GPU, with exactly the features, extensions and queues you asked for. Almost every other object is created from it, belongs to it and must be destroyed before it." }
    : BY_ID[sel];
  const edge = (a: Obj | undefined, b: Obj, dashed: boolean) => a && (
    <line key={`${a.id}-${b.id}-${dashed}`} x1={a.x} y1={a.y + NH} x2={b.x} y2={b.y}
      stroke={dashed ? C.amber : lineage.has(b.id) || kids.has(b.id) ? C.red : C.axis}
      strokeWidth={dashed ? 1.4 : 1.2} strokeDasharray={dashed ? "4 3" : undefined} />
  );

  return (
    <Figure
      title={tx(t, "figVkObj_title", "The Vulkan object map")}
      controls={info && <>
        <Row>
          <Readout color={C.red}>{info.name}</Readout>
          <Readout>{info.fn}</Readout>
        </Row>
        <p className="text-[13px] text-[var(--text-main)] leading-relaxed">{tx(t, `figVkObj_d_${sel}`, info.desc)}</p>
        <p className="text-[11px] font-mono text-[var(--text-muted)]">
          {tx(t, "figVkObj_chapter", "Built in")}: {tx(t, `figVkObj_ch_${info.ch}`, CHAPTERS[info.ch])}
        </p>
      </>}
      note={tx(t, "figVkObj_note", "Click any object. Solid lines mean \"created from\": the parent must stay alive until every child is destroyed, so shutdown walks the map bottom-up. Blue boxes are the selection's children, amber boxes (dashed lines) are objects it uses. Nearly everything is created from the VkDevice, which is why it is drawn as a band.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        {OBJS.filter(o => o.y < BAND_Y || o.parent).map(o => edge(BY_ID[o.parent!], o, false))}
        {/* physical device → device band */}
        <line x1={BY_ID.physical.x} y1={62 + NH} x2={BY_ID.physical.x} y2={BAND_Y} stroke={lineage.has("device") ? C.red : C.axis} strokeWidth={1.2} />
        {/* One bus per column, left of the boxes, with a stub to each device child */}
        {OBJS.filter(o => parentOf(o) === "device").map(o => {
          const bx = o.x - NW / 2 - 5, on = sel === "device" || lineage.has(o.id);
          return (
            <path key={`t-${o.id}`} d={`M${bx} ${BAND_Y + 22} L${bx} ${o.y + NH / 2} L${o.x - NW / 2} ${o.y + NH / 2}`}
              fill="none" stroke={on ? C.red : C.axis} strokeWidth={1.1} />
          );
        })}
        {sel !== "device" && [...uses].map(u => {
          const a = BY_ID[u], b = BY_ID[sel];
          if (!a || !b) return null;
          const x1 = a.x + (a.x < b.x ? NW / 2 : a.x > b.x ? -NW / 2 : 0), y1 = a.y + NH / 2;
          const x2 = b.x + (a.x < b.x ? -NW / 2 : a.x > b.x ? NW / 2 : 0), y2 = b.y + NH / 2;
          return <path key={`u-${u}`} d={a.x === b.x ? `M${a.x - NW / 2} ${y1} C${a.x - NW / 2 - 18} ${y1} ${b.x - NW / 2 - 18} ${y2} ${b.x - NW / 2} ${y2}` : `M${x1} ${y1} L${x2} ${y2}`}
            fill="none" stroke={C.amber} strokeWidth={1.4} strokeDasharray="4 3" />;
        })}
        {/* The device band */}
        <g onClick={() => setSel("device")} style={{ cursor: "pointer" }} opacity={lit("device") ? 1 : 0.45}>
          <rect x={14} y={BAND_Y} width={W - 28} height={22} rx={5} fill={sel === "device" ? C.red : kids.has("device") ? C.sky : "var(--card)"}
            fillOpacity={sel === "device" ? 0.9 : kids.has("device") ? 0.3 : 1} stroke={sel === "device" ? C.red : C.axis} />
          <T x={W / 2} y={BAND_Y + 15} size={9.5} anchor="middle" bold color={sel === "device" ? "#fff" : C.fg}>VkDevice</T>
        </g>
        {GROUPS.map(([x, k, en]) => <T key={k} x={x} y={156} size={8} anchor="middle">{tx(t, k, en)}</T>)}
        {OBJS.map(box)}
      </svg>
    </Figure>
  );
}
