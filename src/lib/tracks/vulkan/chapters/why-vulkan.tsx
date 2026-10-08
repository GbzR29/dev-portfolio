"use client";

// Foundations 1: why Vulkan — what the OpenGL driver did behind your back
// (global state, per-draw validation, shader variants compiled at draw time,
// hidden synchronization and memory, one thread); what "explicit" means
// (pipelines up front, command buffers, queues, your memory, your sync); the
// cost in code and responsibility; the object model (create-info structs,
// sType/pNext, handles, VkResult, destroy order); one frame in outline; the
// version this track uses (1.3: dynamic rendering, synchronization2); the SDK,
// tools and project setup; the track map; common misconceptions.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { DriverCostFigure } from "@/components/lesson/figures/vulkan/DriverCostFigure";
import { VulkanObjectsFigure } from "@/components/lesson/figures/vulkan/VulkanObjectsFigure";

export function WhyVulkanContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "vkWhy_intro",
          "Vulkan is a graphics and compute API, like OpenGL: a set of C functions your program calls to make the GPU draw triangles and run shaders. The GPU is the same, the shaders are almost the same, the triangles come out the same. What changes is who is responsible for what. OpenGL hides a large, clever driver between you and the hardware; Vulkan removes most of that driver and hands its decisions to you. This chapter explains what the driver used to do, why removing it is worth the extra code, and how the pieces of Vulkan fit together, so that the following chapters, which build a renderer object by object, always have a map to return to.")}
      </Lead>

      <Goals t={t} id="vkWhy" items={[
        "Say which jobs the OpenGL driver did that Vulkan hands to you.",
        "Explain what Vulkan gains in return, and what it costs.",
        "Recognize the create-info pattern that every Vulkan object follows.",
        "Set up a project ready for the rest of the track.",
      ]} />
      <Callout type="info" t={t}>
        {tx(t, "vkWhy_prereq", "This track assumes the OpenGL track (or equivalent experience): vertex buffers, shaders, textures, the depth buffer and the transform pipeline are not re-explained here, only how Vulkan does them. It also assumes the C++ track: pointers, structs, RAII and std::vector. All code uses the plain C API of Vulkan from C++20, with SDL3 for the window.")}
      </Callout>

      <H2>{tx(t, "vkWhy_glTitle", "What the OpenGL driver did for you")}</H2>
      <p>
        {tx(t, "vkWhy_glBody",
          "In OpenGL you set state on a global context (bind this texture, enable blending, use this program) and then call glDrawArrays. That call looks cheap, but at that moment the driver must work out what the GPU actually needs. Four jobs hide inside every draw:")}
      </p>
      <LessonTable
        headers={[tx(t, "vkWhy_tJob", "Hidden job"), tx(t, "vkWhy_tWhat", "What the driver does at draw time")]}
        rows={[
          [tx(t, "vkWhy_j1", "Validation"), tx(t, "vkWhy_j1b", "checks that the bound program, buffers, textures and framebuffer are complete and compatible, and sets glGetError if not. Every draw pays for it, even in a finished, bug-free game.")],
          [tx(t, "vkWhy_j2", "State translation"), tx(t, "vkWhy_j2b", "turns the scattered glEnable/glBlendFunc/glDepthFunc settings into the hardware's real configuration. On many GPUs blending, vertex format and render-target format are part of the compiled shader, so a state change the driver has never seen means compiling a new shader variant, right there in the middle of your frame: a hitch.")],
          [tx(t, "vkWhy_j3", "Hazard tracking"), tx(t, "vkWhy_j3b", "if you overwrite a buffer with glBufferSubData while an earlier draw that reads it is still queued on the GPU, the driver must notice and either wait or secretly copy the data. It tracks every resource to find such hazards.")],
          [tx(t, "vkWhy_j4", "Memory management"), tx(t, "vkWhy_j4b", "glBufferData and glTexImage2D allocate GPU memory where the driver sees fit, and the driver may move it later. You never learn where anything lives.")],
        ]}
      />
      <p>
        {tx(t, "vkWhy_glThread",
          "On top of that, an OpenGL context belongs to one thread at a time. A modern CPU has 8 or 16 cores, but all rendering commands must go through the single thread that owns the context, and the driver's work runs there too. When a scene has thousands of draw calls, that one thread becomes the bottleneck long before the GPU is busy. The driver's guesses also make performance unpredictable: the same code can hitch on one vendor's driver and not on another's, because each driver compiles, copies and waits under different conditions.")}
      </p>

      <H2>{tx(t, "vkWhy_explicitTitle", "What \"explicit\" means")}</H2>
      <p>
        {tx(t, "vkWhy_explicitBody",
          "Vulkan was published by the Khronos Group in 2016, built from AMD's Mantle, to give that work back to the application, which knows much more about its own frame than a driver can guess. Each hidden job becomes something you do explicitly, once, at a moment you choose:")}
      </p>
      <LessonTable
        headers={[tx(t, "vkWhy_tGl", "OpenGL: the driver, at draw time"), tx(t, "vkWhy_tVk", "Vulkan: you, when you decide")]}
        rows={[
          [tx(t, "vkWhy_c1", "Global state set piece by piece, combined at every draw"), tx(t, "vkWhy_c1b", "A VkPipeline: shaders, vertex format, rasterizer, depth and blend state compiled together into one immutable object, usually at load time. Drawing just binds it.")],
          [tx(t, "vkWhy_c2", "Each gl call is (eventually) sent to the GPU by the driver"), tx(t, "vkWhy_c2b", "You record commands into command buffers, on any thread, and submit the finished buffers to a queue yourself.")],
          [tx(t, "vkWhy_c3", "Validation on every call, always"), tx(t, "vkWhy_c3b", "No validation in the driver at all. Optional validation layers check everything during development and are simply not loaded in release builds.")],
          [tx(t, "vkWhy_c4", "Driver finds and resolves hazards"), tx(t, "vkWhy_c4b", "You declare the dependencies: barriers, semaphores and fences say which work must finish before which other work starts.")],
          [tx(t, "vkWhy_c5", "Driver allocates and places memory"), tx(t, "vkWhy_c5b", "You query the memory types the GPU offers, allocate blocks and place your buffers and images inside them.")],
        ]}
      />
      <p>
        {tx(t, "vkWhy_costBody",
          "The payoff is CPU time and predictability. A draw call in Vulkan is a few bytes written into a command buffer, with nothing to check or guess, and recording can be spread across all cores. Nothing is compiled in the middle of a frame unless you ask for it. The figure compares the CPU cost of submitting a frame both ways; move the sliders to see where one thread stops being enough.")}
      </p>

      <DriverCostFigure t={t} />

      <H3>{tx(t, "vkWhy_priceTitle", "The price")}</H3>
      <p>
        {tx(t, "vkWhy_priceBody",
          "What the driver no longer does, you must do, and do correctly. The first triangle takes about a thousand lines instead of a hundred, because every object between the program and the screen (the GPU choice, the queues, the images the window shows, the render state, the synchronization) is created by hand. Mistakes are also treated differently: a Vulkan function called with wrong arguments has undefined behaviour. It may work, crash, draw garbage or hang the GPU, and it may do something different on another machine. That is why the validation layers of the next chapter are not optional during development. In return, once it works, it works the same everywhere, and you know exactly what each line costs.")}
      </p>
      <LessonTable
        headers={[tx(t, "vkWhy_tChoose", "Choose"), tx(t, "vkWhy_tWhen", "When")]}
        rows={[
          ["OpenGL", tx(t, "vkWhy_w1", "learning graphics, tools and prototypes, small scenes where the CPU is not the bottleneck, and when a shorter path to pixels matters more than control")],
          ["Vulkan", tx(t, "vkWhy_w2", "engines and games with many draw calls, multithreaded rendering, predictable frame times, Android and Linux, and features OpenGL never got (ray tracing, mesh shaders, bindless resources)")],
          [tx(t, "vkWhy_w3a", "A higher-level layer"), tx(t, "vkWhy_w3", "SDL3 GPU, WebGPU or an engine, when you want modern GPU concepts without writing the synchronization yourself. They are built on the same ideas, so this track helps you use them too")],
        ]}
      />

      <H2>{tx(t, "vkWhy_modelTitle", "The object model: one pattern for everything")}</H2>
      <p>
        {tx(t, "vkWhy_modelBody",
          "Vulkan has dozens of object types, but almost all of them are made and destroyed the same way, so learning the pattern once pays off in every chapter. To create an object you fill in a create-info struct describing it and pass it to a vkCreate function, which writes a handle into a variable you provide and returns a result code. To get rid of it you call the matching vkDestroy function.")}
      </p>
      <CodeBlock lang="cpp" filename="pattern.cpp" t={t}>{`VkBufferCreateInfo info{};                        // {} zero-fills every field
info.sType = VK_STRUCTURE_TYPE_BUFFER_CREATE_INFO; // says which struct this is
info.pNext = nullptr;                             // optional extension structs
info.size  = 1024;                                // what to create...
info.usage = VK_BUFFER_USAGE_VERTEX_BUFFER_BIT;
info.sharingMode = VK_SHARING_MODE_EXCLUSIVE;

VkBuffer buffer = VK_NULL_HANDLE;                 // the handle is written here
VkResult result = vkCreateBuffer(device, &info, nullptr, &buffer);
if (result != VK_SUCCESS) { /* handle the error */ }

// ... use it ...

vkDestroyBuffer(device, buffer, nullptr);         // same parent, same allocator`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "vkWhy_tPiece", "Piece"), tx(t, "vkWhy_tMeaning", "Meaning")]}
        rows={[
          ["sType", tx(t, "vkWhy_m1", "every struct starts with a tag naming its own type. The driver reads it first, so it always knows what it was given, even through a void pointer. Forgetting it is the most common beginner bug; the validation layers catch it.")],
          ["pNext", tx(t, "vkWhy_m2", "a pointer to a chain of extra structs (each with its own sType and pNext). Newer features add their settings this way without changing the old struct. nullptr when unused.")],
          [tx(t, "vkWhy_m3a", "The first parameter"), tx(t, "vkWhy_m3", "the parent the object is created from, usually the VkDevice. The same parent is passed again to destroy it.")],
          [tx(t, "vkWhy_m4a", "The allocator (nullptr)"), tx(t, "vkWhy_m4", "optional callbacks to control the driver's own CPU-side allocations. Almost everyone passes nullptr, and this track always does.")],
          [tx(t, "vkWhy_m5a", "Handles"), tx(t, "vkWhy_m5", "VkBuffer, VkDevice and the rest are opaque: you cannot look inside, only pass them back to Vulkan. VK_NULL_HANDLE means \"no object\"; destroying a null handle is allowed and does nothing.")],
          ["VkResult", tx(t, "vkWhy_m6", "VK_SUCCESS (0), a positive status such as VK_INCOMPLETE or VK_SUBOPTIMAL_KHR, or a negative error such as VK_ERROR_OUT_OF_DEVICE_MEMORY. Functions that cannot fail return void.")],
        ]}
      />
      <p>
        {tx(t, "vkWhy_checkBody",
          "Checking every VkResult by hand quickly becomes noise, so this track uses a small macro. It stops the program with the failing call, its result and the source line. string_VkResult, from the SDK header vk_enum_string_helper.h, turns the number into its name. A real engine would log and recover from some errors (a lost device, an out-of-date swapchain), which later chapters do explicitly.")}
      </p>
      <CodeBlock lang="cpp" filename="vk_check.h" t={t}>{`#pragma once
#include <vulkan/vulkan.h>
#include <vulkan/vk_enum_string_helper.h>
#include <cstdio>
#include <cstdlib>

#define VK_CHECK(call)                                                     \\
    do {                                                                   \\
        VkResult r_ = (call);                                              \\
        if (r_ != VK_SUCCESS) {                                            \\
            std::fprintf(stderr, "%s failed: %s (%s:%d)\\n",                \\
                         #call, string_VkResult(r_), __FILE__, __LINE__);  \\
            std::abort();                                                  \\
        }                                                                  \\
    } while (0)`}</CodeBlock>
      <p>
        {tx(t, "vkWhy_destroyBody",
          "Objects form a tree: a buffer is created from a device, the device from a physical device, which comes from the instance. A parent must outlive its children, so shutdown destroys everything in the reverse order of creation, children first and the instance last. The map below shows every object this track creates and who creates whom. Click around; each chapter adds a few of these boxes to our program.")}
      </p>

      <VulkanObjectsFigure t={t} />

      <H2>{tx(t, "vkWhy_frameTitle", "One frame, in outline")}</H2>
      <p>
        {tx(t, "vkWhy_frameBody",
          "Before the details, here is what every frame of a Vulkan renderer does, so each chapter can say where its piece fits. Each step gets a chapter of its own.")}
      </p>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "vkWhy_f1", "Wait on a fence until the GPU has finished the frame that last used this frame's resources, so they can be overwritten.")}</li>
        <li>{tx(t, "vkWhy_f2", "Acquire the next image from the swapchain: the presentation engine hands over one of the window's images (signalling a semaphore when it is really free).")}</li>
        <li>{tx(t, "vkWhy_f3", "Record a command buffer: transition the image to a drawable layout, begin rendering into it, bind a pipeline and descriptor sets, draw, end rendering, transition it for presentation.")}</li>
        <li>{tx(t, "vkWhy_f4", "Submit the command buffer to the graphics queue: wait on the acquire semaphore, signal a render-finished semaphore and the fence from step 1.")}</li>
        <li>{tx(t, "vkWhy_f5", "Present the image: hand it back to the presentation engine, which waits on the render-finished semaphore and shows it on screen.")}</li>
      </ol>
      <p>
        {tx(t, "vkWhy_frameAfter",
          "The CPU does not wait for the GPU anywhere in these five steps except the fence in step 1, and even that normally returns at once, because the CPU works one or two frames ahead of the GPU. That overlap is where Vulkan's speed comes from, and keeping it correct is what synchronization is about.")}
      </p>

      <H2>{tx(t, "vkWhy_versionTitle", "Which Vulkan this track uses")}</H2>
      <p>
        {tx(t, "vkWhy_versionBody",
          "Vulkan grows by extensions: a new feature first appears as an extension with a suffix (KHR for Khronos-approved, EXT for multi-vendor, NV or AMD for one vendor) and later may be promoted into a core version. This track targets Vulkan 1.3 (2022), supported on every desktop GPU from roughly 2016 onwards with current drivers and on recent Android phones. Two 1.3 core features remove much of Vulkan's early boilerplate, and we use both from the start:")}
      </p>
      <LessonTable
        headers={[tx(t, "vkWhy_tFeature", "1.3 feature"), tx(t, "vkWhy_tReplaces", "What it replaces")]}
        rows={[
          [tx(t, "vkWhy_v1", "Dynamic rendering"), tx(t, "vkWhy_v1b", "the VkRenderPass and VkFramebuffer objects of Vulkan 1.0, which had to be created in advance for every combination of attachments. With dynamic rendering you name the images you draw into when you begin rendering, much like binding a framebuffer in OpenGL. Render passes still matter on some mobile GPUs and appear briefly when we reach them.")],
          [tx(t, "vkWhy_v2", "Synchronization2"), tx(t, "vkWhy_v2b", "the original barrier and submit functions, whose split of stages and access masks was easy to get wrong. The new versions (vkCmdPipelineBarrier2, vkQueueSubmit2) keep each stage next to its access, which reads more clearly.")],
        ]}
      />

      <H2>{tx(t, "vkWhy_setupTitle", "Tools and project setup")}</H2>
      <p>
        {tx(t, "vkWhy_setupBody",
          "Install the Vulkan SDK from LunarG (vulkan.lunarg.com). It contains the headers, the loader library your program links against, the validation layers, the glslc compiler that turns GLSL into SPIR-V (the bytecode Vulkan's shaders are given in), the vkconfig tool to switch layers on and off, and vulkaninfo, which prints everything your GPU supports. Your GPU driver provides the actual Vulkan implementation; any current driver from NVIDIA, AMD or Intel does. RenderDoc (renderdoc.org) is the frame debugger: it captures one frame and shows every command, every image and every buffer at each step, and you will want it the first time the screen stays black.")}
      </p>
      <CodeBlock lang="cmake" filename="CMakeLists.txt" t={t}>{`cmake_minimum_required(VERSION 3.24)
project(vkfirst LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 20)

find_package(Vulkan REQUIRED)           # headers + loader, from the SDK
find_package(SDL3 REQUIRED CONFIG)      # the window, as in the SDL3 track

add_executable(vkfirst src/main.cpp)
target_link_libraries(vkfirst PRIVATE Vulkan::Vulkan SDL3::SDL3)`}</CodeBlock>
      <Callout type="tip" t={t}>
        {tx(t, "vkWhy_macNote", "macOS has no native Vulkan driver. The SDK includes MoltenVK, which translates Vulkan to Metal. It works for everything in this track, but it is a \"portability\" implementation, so the instance and device need one extra flag and extension each; the next two chapters show where.")}
      </Callout>

      <H2>{tx(t, "vkWhy_mapTitle", "The road ahead")}</H2>
      <LessonTable
        headers={[tx(t, "vkWhy_tSection", "Section"), tx(t, "vkWhy_tYouBuild", "You build")]}
        rows={[
          [tx(t, "vkWhy_r1", "Foundations"), tx(t, "vkWhy_r1b", "the instance and validation layers, the choice of GPU, its queues and the logical device")],
          [tx(t, "vkWhy_r2", "Presentation"), tx(t, "vkWhy_r2b", "the window surface and swapchain, the graphics pipeline, command buffers and synchronization: the first triangle")],
          [tx(t, "vkWhy_r3", "Resources"), tx(t, "vkWhy_r3b", "buffers and memory types, staging uploads, uniforms and descriptor sets, push constants, textures and samplers, the depth buffer: a textured, rotating 3D model")],
          [tx(t, "vkWhy_r4", "Going further"), tx(t, "vkWhy_r4b", "mipmaps and MSAA, compute shaders, resizing and frames in flight done properly, and modern Vulkan: bindless descriptors, buffer device addresses, timeline semaphores")],
        ]}
      />

      <H2>{tx(t, "vkWhy_mythsTitle", "Common misconceptions")}</H2>
      <LessonTable
        headers={[tx(t, "vkWhy_tMyth", "Misconception"), tx(t, "vkWhy_tReality", "Reality")]}
        rows={[
          [tx(t, "vkWhy_e1", "\"Vulkan makes the GPU faster\""), tx(t, "vkWhy_e1b", "the shaders run on the same hardware at the same speed. Vulkan saves CPU time and removes hitches; a GPU-bound scene (heavy pixel shaders) gains little.")],
          [tx(t, "vkWhy_e2", "\"Porting from OpenGL gives an instant speed-up\""), tx(t, "vkWhy_e2b", "a direct translation that waits for the GPU after every frame, or rebuilds pipelines while drawing, can be slower than the OpenGL driver, which was tuned for years. The gains come from designing for Vulkan: prebuilt pipelines, frames in flight, parallel recording.")],
          [tx(t, "vkWhy_e3", "\"It worked, so it is correct\""), tx(t, "vkWhy_e3b", "undefined behaviour often works on the developer's GPU and fails on another. A program is correct when the validation layers report nothing, not when the picture looks right.")],
          [tx(t, "vkWhy_e4", "\"Render passes are required\""), tx(t, "vkWhy_e4b", "only before 1.3. Tutorials written for 1.0 spend chapters on VkRenderPass and VkFramebuffer; with dynamic rendering you can skip both.")],
          [tx(t, "vkWhy_e5", "\"Vulkan replaced OpenGL\""), tx(t, "vkWhy_e5b", "OpenGL 4.6 is finished but still fully supported and still the easier choice for many programs. Vulkan is the lower-level option, not the new version of the same thing.")],
        ]}
      />

      <KeyIdeas t={t} id="vkWhy" items={[
        "OpenGL's driver validates, translates state, compiles shader variants, tracks hazards and places memory at draw time, all on one thread.",
        "Vulkan moves those jobs to the application: prebuilt pipeline objects, command buffers recorded on any thread, explicit memory and explicit synchronization.",
        "The gain is lower, parallel and predictable CPU cost; the price is much more code and undefined behaviour when you get it wrong.",
        "Every object is made with vkCreateX(parent, &createInfo, nullptr, &handle) and destroyed with vkDestroyX, children before parents.",
        "Every create-info struct starts with sType and pNext; pNext chains extension structs.",
        "A frame is: wait fence, acquire image, record, submit, present.",
        "This track uses Vulkan 1.3 core with dynamic rendering and synchronization2, the plain C API, SDL3 and the LunarG SDK.",
      ]} />
    </Article>
  );
}
