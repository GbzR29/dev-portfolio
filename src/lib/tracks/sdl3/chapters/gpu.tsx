"use client";

// SDL3 track — "SDL_GPU".

import { TrackTranslations } from "@/lib/tracks/types";
import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";

export function GpuContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "sdl09_intro",
          "SDL_GPU is the headline addition in SDL3: one modern graphics API that runs on Vulkan, Direct3D 12 and Metal. It gives you command buffers, explicit pipelines and real shaders — the modern model — without the several thousand lines of setup that raw Vulkan demands, and without OpenGL's hidden global state."
        )}
      </p>

      <H2>{tx(t, "sdl09_whereTitle", "Where it sits")}</H2>
      <LessonTable
        headers={[tx(t, "sdl09_h0", "API"), tx(t, "sdl09_h1", "Control"), tx(t, "sdl09_h2", "Cost of a triangle")]}
        rows={[
          ["SDL_Renderer",  tx(t, "sdl09_a1", "Sprites and shapes, no shaders"),        tx(t, "sdl09_b1", "About 20 lines")],
          ["OpenGL 4.6",    tx(t, "sdl09_a2", "Full programmable pipeline, global state"), tx(t, "sdl09_b2", "About 100 lines")],
          ["SDL_GPU",       tx(t, "sdl09_a3", "Explicit pipelines and command buffers"),  tx(t, "sdl09_b3", "About 200 lines")],
          ["Vulkan",        tx(t, "sdl09_a4", "Everything, including memory and sync"),   tx(t, "sdl09_b4", "About 1000 lines")],
        ]}
      />

      <p>
        {tx(t, "sdl09_whereBody",
          "SDL_GPU deliberately sits where most games want to be: you get the explicit modern model — you decide when work is recorded and submitted — but SDL still owns memory allocation, synchronization and swapchain management, which is where most of Vulkan's difficulty lives."
        )}
      </p>

      <H2>{tx(t, "sdl09_shaderTitle", "The shader problem")}</H2>
      <p>
        {tx(t, "sdl09_shaderBody",
          "SDL_GPU does not define a shading language. Each backend consumes its own format: SPIR-V for Vulkan, DXIL for Direct3D 12, and MSL or a metallib for Metal. You either ship all the formats you support, or compile at build time from one source with a cross-compiler."
        )}
      </p>

      <LessonTable
        headers={[tx(t, "sdl09_s0", "Backend"), tx(t, "sdl09_s1", "Shader format")]}
        rows={[
          ["Vulkan",        "SPIR-V"],
          ["Direct3D 12",   "DXIL"],
          ["Metal",         tx(t, "sdl09_s2", "MSL source or a compiled metallib")],
        ]}
      />

      <Callout type="tip" t={t}>
        {tx(t, "sdl09_crossTip",
          "The usual workflow is to write shaders once in HLSL or GLSL and cross-compile them in your build step — SDL's shadercross tooling exists for exactly this. Query SDL_GetGPUShaderFormats at runtime to find out which formats the device you got will accept, and load the matching blob."
        )}
      </Callout>

      <H2>{tx(t, "sdl09_deviceTitle", "Creating a device")}</H2>

      <CodeBlock lang="cpp" filename="gpu_device.cpp" t={t}>{`#include <SDL3/SDL_gpu.h>

// Ask for the formats you actually shipped; SDL picks a matching backend
SDL_GPUDevice* device = SDL_CreateGPUDevice(
    SDL_GPU_SHADERFORMAT_SPIRV | SDL_GPU_SHADERFORMAT_DXIL | SDL_GPU_SHADERFORMAT_MSL,
    true,          // enable debug mode — turns on the validation layers
    nullptr);      // let SDL choose the backend

if (!device) { SDL_Log("CreateGPUDevice: %s", SDL_GetError()); return 1; }
SDL_Log("GPU backend: %s", SDL_GetGPUDeviceDriver(device));

// The window must be claimed before you can render to it
if (!SDL_ClaimWindowForGPUDevice(device, window)) {
    SDL_Log("ClaimWindow: %s", SDL_GetError());
    return 1;
}`}</CodeBlock>

      <H2>{tx(t, "sdl09_frameTitle", "The shape of a frame")}</H2>
      <p>
        {tx(t, "sdl09_frameBody",
          "Every frame follows the same five steps. Nothing executes when you call it — you are recording commands into a buffer, and submitting it hands the whole batch to the GPU at once."
        )}
      </p>

      <CodeBlock lang="cpp" filename="gpu_frame.cpp" t={t}>{`// 1. Acquire a command buffer to record into
SDL_GPUCommandBuffer* cmd = SDL_AcquireGPUCommandBuffer(device);

// 2. Acquire the swapchain texture for this window
SDL_GPUTexture* swapchain = nullptr;
Uint32 w = 0, h = 0;
if (!SDL_WaitAndAcquireGPUSwapchainTexture(cmd, window, &swapchain, &w, &h)) {
    SDL_SubmitGPUCommandBuffer(cmd);       // minimized or resizing — skip the frame
    return;
}

// 3. Describe the render pass: what to draw into, and how to clear it
SDL_GPUColorTargetInfo color{};
color.texture     = swapchain;
color.clear_color = SDL_FColor{0.06f, 0.07f, 0.10f, 1.0f};
color.load_op     = SDL_GPU_LOADOP_CLEAR;
color.store_op    = SDL_GPU_STOREOP_STORE;

SDL_GPURenderPass* pass = SDL_BeginGPURenderPass(cmd, &color, 1, nullptr);

// 4. Record draw commands
SDL_BindGPUGraphicsPipeline(pass, pipeline);
SDL_GPUBufferBinding vb{vertexBuffer, 0};
SDL_BindGPUVertexBuffers(pass, 0, &vb, 1);
SDL_DrawGPUPrimitives(pass, 3, 1, 0, 0);

SDL_EndGPURenderPass(pass);

// 5. Submit — this is where the GPU actually receives the work
SDL_SubmitGPUCommandBuffer(cmd);`}</CodeBlock>

      <H2>{tx(t, "sdl09_uploadTitle", "Getting data onto the GPU")}</H2>
      <p>
        {tx(t, "sdl09_uploadBody",
          "GPU buffers are not CPU-visible. You write into a transfer buffer, then record a copy pass that moves it into the real buffer — the same staging model Vulkan and D3D12 use, and the reason uploads are explicit rather than hidden inside a glBufferData call."
        )}
      </p>

      <CodeBlock lang="cpp" filename="gpu_upload.cpp" t={t}>{`// Destination: a vertex buffer the shader will read
SDL_GPUBufferCreateInfo bufInfo{};
bufInfo.usage = SDL_GPU_BUFFERUSAGE_VERTEX;
bufInfo.size  = sizeof(vertices);
SDL_GPUBuffer* vertexBuffer = SDL_CreateGPUBuffer(device, &bufInfo);

// Staging: CPU-writable memory
SDL_GPUTransferBufferCreateInfo tbInfo{};
tbInfo.usage = SDL_GPU_TRANSFERBUFFERUSAGE_UPLOAD;
tbInfo.size  = sizeof(vertices);
SDL_GPUTransferBuffer* staging = SDL_CreateGPUTransferBuffer(device, &tbInfo);

void* mapped = SDL_MapGPUTransferBuffer(device, staging, false);
SDL_memcpy(mapped, vertices, sizeof(vertices));
SDL_UnmapGPUTransferBuffer(device, staging);

// Record the copy
SDL_GPUCommandBuffer* cmd  = SDL_AcquireGPUCommandBuffer(device);
SDL_GPUCopyPass*      copy = SDL_BeginGPUCopyPass(cmd);

SDL_GPUTransferBufferLocation src{staging, 0};
SDL_GPUBufferRegion           dst{vertexBuffer, 0, sizeof(vertices)};
SDL_UploadToGPUBuffer(copy, &src, &dst, false);

SDL_EndGPUCopyPass(copy);
SDL_SubmitGPUCommandBuffer(cmd);

SDL_ReleaseGPUTransferBuffer(device, staging);   // staging was one-shot`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "sdl09_scopeNote",
          "The snippets above are the shape of the API, not a complete program — a working triangle also needs shader loading, a vertex input description and a graphics pipeline built from both. The SDL_gpu_examples repository maintained alongside SDL is the reference to work from, because it is updated with the API."
        )}
      </Callout>

      <H2>{tx(t, "sdl09_whenTitle", "When to choose it")}</H2>
      <LessonTable
        headers={[tx(t, "sdl09_w0", "You want to"), tx(t, "sdl09_w1", "Use")]}
        rows={[
          [tx(t, "sdl09_w2", "Ship a 2D game quickly"),                      "SDL_Renderer"],
          [tx(t, "sdl09_w3", "Learn graphics programming concepts"),         tx(t, "sdl09_w3b", "OpenGL — simpler mental model, endless material")],
          [tx(t, "sdl09_w4", "Custom shaders on desktop, console and mobile"), "SDL_GPU"],
          [tx(t, "sdl09_w5", "Control memory, sync and extensions yourself"), tx(t, "sdl09_w5b", "Vulkan directly")],
        ]}
      />

      <Callout type="tip" t={t}>
        {tx(t, "sdl09_learnTip",
          "SDL_GPU is easier to learn after OpenGL than before it. The OpenGL track in this series covers the concepts — vertex buffers, pipelines, shader stages, depth testing — with far less ceremony per experiment. Learn what a graphics pipeline is there, then come back and the SDL_GPU structs will read as labelled boxes you already understand."
        )}
      </Callout>

    </article>
  );
}
