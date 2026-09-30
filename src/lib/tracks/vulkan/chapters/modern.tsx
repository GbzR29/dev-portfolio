"use client";

// Going further 4: modern Vulkan — the Vulkan 1.2 features in the pNext
// chain; bindless textures with descriptor indexing (binding flags, update
// after bind, nonuniformEXT) and the Bindless figure; buffer device address
// and vertex pulling (buffer_reference, the push-constant layout); timeline
// semaphores replacing the per-frame fences (Timeline figure) and between
// queues; Vulkan 1.4 and the extensions worth knowing; libraries and tools;
// what the track built; mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { BindlessFigure } from "@/components/lesson/figures/vulkan/BindlessFigure";
import { TimelineFigure } from "@/components/lesson/figures/vulkan/TimelineFigure";

export function ModernContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "vkMod_intro",
          "Vulkan 1.0 (2016) was designed around fixed descriptor sets, vertex buffers bound through fixed-function state, and binary semaphores plus fences. The later versions kept all of that working and added features that make large renderers simpler and faster. This track has used two of them from the start: dynamic rendering and synchronization2. This last chapter adds three more, all core since Vulkan 1.2: bindless descriptors, buffer device addresses and timeline semaphores. Together they are the base of GPU-driven rendering, where the GPU decides what to draw. The chapter ends with Vulkan 1.4, the extensions worth knowing, and where to go from here.")}
      </Lead>

      <H2>{tx(t, "vkMod_featTitle", "Enabling the 1.2 features")}</H2>
      <p>
        {tx(t, "vkMod_featBody",
          "The Devices chapter chained VkPhysicalDeviceVulkan13Features into VkPhysicalDeviceFeatures2. The 1.2 features live in their own struct, VkPhysicalDeviceVulkan12Features, which joins the same chain, first when querying (hasFeatures) and again when creating the device. Every Vulkan 1.3 driver supports these, because 1.3 made them required, but like every feature they must still be enabled to be used.")}
      </p>
      <CodeBlock lang="cpp" filename="device.cpp" t={t}>{`VkPhysicalDeviceVulkan12Features f12{};
f12.sType = VK_STRUCTURE_TYPE_PHYSICAL_DEVICE_VULKAN_1_2_FEATURES;
// bindless textures (descriptor indexing)
f12.descriptorIndexing                            = VK_TRUE;
f12.runtimeDescriptorArray                        = VK_TRUE;   // sampler2D textures[] with no size
f12.descriptorBindingPartiallyBound               = VK_TRUE;   // unwritten elements are allowed
f12.descriptorBindingSampledImageUpdateAfterBind  = VK_TRUE;   // write elements while the set is bound
f12.shaderSampledImageArrayNonUniformIndexing     = VK_TRUE;   // nonuniformEXT indices
// the other two
f12.bufferDeviceAddress = VK_TRUE;                             // 64-bit GPU pointers to buffers
f12.timelineSemaphore   = VK_TRUE;                             // counter semaphores

f13.pNext = &f12;                                              // features2 → f13 → f12
// hasFeatures checks the same fields on the queried chain`}</CodeBlock>

      <H2>{tx(t, "vkMod_bindlessTitle", "Bindless textures")}</H2>
      <p>
        {tx(t, "vkMod_bindlessBody",
          "Our material set holds one texture, so drawing objects with different textures means one set per material and a vkCmdBindDescriptorSets before each draw. A real scene has thousands of materials: thousands of sets to allocate and write, a bind per draw, and draws that cannot be merged because each needs different bindings. Bindless turns this around. One set holds an array of every texture in the scene, bound once per frame, and each draw only says which element to use, with a number in its push constant. The shader indexes the array with that number.")}
      </p>
      <LessonTable
        headers={[tx(t, "vkMod_tFlag", "Flag"), tx(t, "vkMod_tWhy", "Why it is needed")]}
        rows={[
          ["PARTIALLY_BOUND", tx(t, "vkMod_f1", "normally every element of an array binding must hold a valid descriptor whenever a draw could use the set. With this flag, only elements the shaders actually read must be valid, so the array can be much larger than the textures loaded so far.")],
          ["UPDATE_AFTER_BIND", tx(t, "vkMod_f2", "normally writing a descriptor invalidates command buffers that have the set bound. With this flag (on the binding, the set layout and the pool), elements not used by pending work can be written at any time: a texture streamed in during play gets a new element without touching the frames in flight.")],
          ["VARIABLE_DESCRIPTOR_COUNT", tx(t, "vkMod_f3", "optional: the last binding's array size is chosen when the set is allocated rather than in the layout. Not used here.")],
        ]}
      />
      <CodeBlock lang="cpp" filename="bindless.cpp" t={t}>{`constexpr uint32_t kMaxTextures = 1024;       // ≤ maxDescriptorSetUpdateAfterBindSampledImages
// App gains: VkDescriptorPool bindlessPool; VkDescriptorSet bindlessSet;
//            (materialLayout is redefined below; materialSet goes away)

void createBindless(App& app) {
    // 1. Layout: binding 0 = an array of kMaxTextures combined image samplers
    VkDescriptorSetLayoutBinding binding{};
    binding.binding         = 0;
    binding.descriptorType  = VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER;
    binding.descriptorCount = kMaxTextures;                        // the array size
    binding.stageFlags      = VK_SHADER_STAGE_FRAGMENT_BIT;
    const VkDescriptorBindingFlags flags = VK_DESCRIPTOR_BINDING_PARTIALLY_BOUND_BIT
                                         | VK_DESCRIPTOR_BINDING_UPDATE_AFTER_BIND_BIT;
    VkDescriptorSetLayoutBindingFlagsCreateInfo flagInfo{};
    flagInfo.sType         = VK_STRUCTURE_TYPE_DESCRIPTOR_SET_LAYOUT_BINDING_FLAGS_CREATE_INFO;
    flagInfo.bindingCount  = 1;                                    // one entry per binding
    flagInfo.pBindingFlags = &flags;
    VkDescriptorSetLayoutCreateInfo layoutInfo{};
    layoutInfo.sType        = VK_STRUCTURE_TYPE_DESCRIPTOR_SET_LAYOUT_CREATE_INFO;
    layoutInfo.pNext        = &flagInfo;
    layoutInfo.flags        = VK_DESCRIPTOR_SET_LAYOUT_CREATE_UPDATE_AFTER_BIND_POOL_BIT;
    layoutInfo.bindingCount = 1;
    layoutInfo.pBindings    = &binding;
    VK_CHECK(vkCreateDescriptorSetLayout(app.device, &layoutInfo, nullptr, &app.materialLayout));

    // 2. Its own pool, created with the matching flag
    VkDescriptorPoolSize size{VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER, kMaxTextures};
    VkDescriptorPoolCreateInfo poolInfo{};
    poolInfo.sType         = VK_STRUCTURE_TYPE_DESCRIPTOR_POOL_CREATE_INFO;
    poolInfo.flags         = VK_DESCRIPTOR_POOL_CREATE_UPDATE_AFTER_BIND_BIT;
    poolInfo.maxSets       = 1;
    poolInfo.poolSizeCount = 1;
    poolInfo.pPoolSizes    = &size;
    VK_CHECK(vkCreateDescriptorPool(app.device, &poolInfo, nullptr, &app.bindlessPool));
    // ... vkAllocateDescriptorSets(app.bindlessPool, app.materialLayout) → app.bindlessSet
}

// Put texture number \`index\` into element \`index\` of the array
void registerTexture(App& app, const Image& tex, uint32_t index) {
    VkDescriptorImageInfo imageInfo{app.sampler, tex.view, VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL};
    VkWriteDescriptorSet write{};
    write.sType           = VK_STRUCTURE_TYPE_WRITE_DESCRIPTOR_SET;
    write.dstSet          = app.bindlessSet;
    write.dstBinding      = 0;
    write.dstArrayElement = index;                                 // which element of the array
    write.descriptorCount = 1;
    write.descriptorType  = VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER;
    write.pImageInfo      = &imageInfo;
    vkUpdateDescriptorSets(app.device, 1, &write, 0, nullptr);
}
// init: app.textures = {loadTexture(app, "textures/crate.png"), loadTexture(app, "textures/metal.png")};
//       registerTexture(app, app.textures[0], 0);  registerTexture(app, app.textures[1], 1);`}</CodeBlock>
      <CodeBlock lang="glsl" filename="shaders/quad.frag" t={t}>{`#version 450
#extension GL_EXT_nonuniform_qualifier : require
layout(set = 1, binding = 0) uniform sampler2D textures[];     // every texture, no size
layout(push_constant) uniform Push {
    mat4 model;                                                // offset 0  (used by the vertex shader)
    uint textureIndex;                                         // offset 64 (new)
} pc;
layout(location = 0) in vec3 vColor;
layout(location = 1) in vec2 vUV;
layout(location = 0) out vec4 outColor;
void main() {
    outColor = texture(textures[pc.textureIndex], vUV) * vec4(vColor, 1.0);
}`}</CodeBlock>
      <p>
        {tx(t, "vkMod_pushBody",
          "The push constant grows to 68 bytes, and its range now covers the fragment stage too: stageFlags = VERTEX | FRAGMENT, size 68, in the pipeline layout and in vkCmdPushConstants. recordFrame binds the bindless set as set 1 once, and before each cube's draw pushes its model matrix and textureIndex (0 for the left cube, 1 for the right one).")}
      </p>
      <H3>{tx(t, "vkMod_nonUniformTitle", "Uniform and non-uniform indices")}</H3>
      <p>
        {tx(t, "vkMod_nonUniformBody",
          "The GPU runs fragments in subgroups of 32 or 64. If every invocation of a draw uses the same index, the index is dynamically uniform, and the hardware reads one descriptor for the whole subgroup. A push constant is the same for the whole draw, so pc.textureIndex is uniform and needs nothing more. If the index can differ between invocations of one draw, for example read from a per-vertex attribute or a buffer, it must be wrapped: textures[nonuniformEXT(i)]. Without the qualifier, some GPUs fetch the descriptor only once for the whole subgroup, and fragments get another object's texture, in blocks.")}
      </p>
      <BindlessFigure t={t} />

      <H2>{tx(t, "vkMod_bdaTitle", "Buffer device address")}</H2>
      <p>
        {tx(t, "vkMod_bdaBody",
          "A buffer lives at some address in the GPU's virtual memory. Buffer device address hands that address to the program as a 64-bit integer, VkDeviceAddress, and lets shaders use it as a pointer. A buffer then needs no descriptor at all: its address goes in a push constant, or inside another buffer, and structures can point to each other as they do on the CPU. It costs two flags when the buffer is created:")}
      </p>
      <CodeBlock lang="cpp" filename="buffer.cpp" t={t}>{`// createBuffer: when the usage asks for an address, the memory must allow one
VkMemoryAllocateFlagsInfo flagsInfo{};
flagsInfo.sType = VK_STRUCTURE_TYPE_MEMORY_ALLOCATE_FLAGS_INFO;
flagsInfo.flags = VK_MEMORY_ALLOCATE_DEVICE_ADDRESS_BIT;
if (usage & VK_BUFFER_USAGE_SHADER_DEVICE_ADDRESS_BIT)
    alloc.pNext = &flagsInfo;                                  // VkMemoryAllocateInfo

VkDeviceAddress bufferAddress(App& app, const Buffer& b) {
    VkBufferDeviceAddressInfo info{};
    info.sType  = VK_STRUCTURE_TYPE_BUFFER_DEVICE_ADDRESS_INFO;
    info.buffer = b.buffer;
    return vkGetBufferDeviceAddress(app.device, &info);        // stays valid until the buffer is destroyed
}

// createMesh: the vertex buffer becomes a storage-style buffer with an address
app.vertexBuffer = createDeviceBuffer(app, verts.data(), verts.size() * sizeof(Vertex),
    VK_BUFFER_USAGE_STORAGE_BUFFER_BIT | VK_BUFFER_USAGE_SHADER_DEVICE_ADDRESS_BIT,
    VK_PIPELINE_STAGE_2_VERTEX_SHADER_BIT, VK_ACCESS_2_SHADER_STORAGE_READ_BIT);
app.vertexAddress = bufferAddress(app, app.vertexBuffer);      // App gains: VkDeviceAddress vertexAddress;`}</CodeBlock>
      <p>
        {tx(t, "vkMod_pullBody",
          "The cube pipeline now reads its vertices itself, a technique called vertex pulling: the vertex input state becomes empty (no bindings, no attributes), vkCmdBindVertexBuffers goes away, and the vertex shader fetches element gl_VertexIndex through the pointer. The index buffer stays: with vkCmdDrawIndexed, gl_VertexIndex is the index read from it, so shared vertices still work.")}
      </p>
      <CodeBlock lang="glsl" filename="shaders/quad.vert" t={t}>{`#version 450
#extension GL_EXT_buffer_reference : require
struct Vertex { float pos[3]; float color[3]; float uv[2]; };   // float arrays: 32 bytes, as in C++
layout(buffer_reference, std430) readonly buffer VertexBuffer {  // a pointer type, not a binding
    Vertex v[];
};
layout(set = 0, binding = 0) uniform Camera { mat4 view; mat4 proj; } cam;
layout(push_constant) uniform Push {
    mat4         model;                   // offset 0
    uint         textureIndex;            // offset 64
    VertexBuffer vertices;                // offset 72: a 64-bit pointer, 8-byte aligned
} pc;
layout(location = 0) out vec3 vColor;
layout(location = 1) out vec2 vUV;
void main() {
    Vertex vx = pc.vertices.v[gl_VertexIndex];                   // dereference the pointer
    vec3 pos  = vec3(vx.pos[0], vx.pos[1], vx.pos[2]);
    gl_Position = cam.proj * cam.view * pc.model * vec4(pos, 1.0);
    vColor = vec3(vx.color[0], vx.color[1], vx.color[2]);
    vUV    = vec2(vx.uv[0], vx.uv[1]);
}`}</CodeBlock>
      <CodeBlock lang="cpp" filename="commands.cpp" t={t}>{`struct DrawPush {                         // must match the shader's push block byte for byte
    glm::mat4       model;                // 0
    uint32_t        textureIndex;         // 64
    uint32_t        pad;                  // 68: the address must start at a multiple of 8
    VkDeviceAddress vertices;             // 72
};                                        // 80 bytes, within the guaranteed 128
static_assert(offsetof(DrawPush, vertices) == 72 && sizeof(DrawPush) == 80);`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "vkMod_tAspect", "Aspect"), tx(t, "vkMod_tDetail", "Detail")]}
        rows={[
          [tx(t, "vkMod_a1", "why float[3], not vec3"), tx(t, "vkMod_a1b", "std430 aligns vec3 to 16 bytes, so a struct with vec3 fields would not match the 32-byte C++ Vertex. Arrays of floats have a 4-byte stride; the scalar block layout extension is the other way out.")],
          [tx(t, "vkMod_a2", "no bounds checking"), tx(t, "vkMod_a2b", "a pointer read past the end of the buffer is not caught by robustBufferAccess, and validation cannot see it. Keep sizes next to pointers and check them while developing.")],
          [tx(t, "vkMod_a3", "the barrier stays"), tx(t, "vkMod_a3b", "the upload's barrier now names the stage that really reads: VERTEX_SHADER with SHADER_STORAGE_READ, no longer VERTEX_ATTRIBUTE_INPUT.")],
          [tx(t, "vkMod_a4", "performance"), tx(t, "vkMod_a4b", "on current desktop GPUs vertex pulling runs about as fast as fixed-function vertex input; some mobile GPUs still prefer vertex buffers. The gain is flexibility: any vertex format, meshes selected on the GPU.")],
        ]}
      />

      <H2>{tx(t, "vkMod_tlTitle", "Timeline semaphores")}</H2>
      <p>
        {tx(t, "vkMod_tlBody",
          "The Synchronization chapter used two kinds of objects: binary semaphores, for GPU-to-GPU waits, and fences, for the CPU. A timeline semaphore replaces both with a 64-bit counter that only goes up. A submit can signal it to a value v when its work finishes; a submit can wait for it to reach at least v before a given stage; the CPU can wait for a value with vkWaitSemaphores, read it with vkGetSemaphoreCounterValue, or set it with vkSignalSemaphore. One timeline replaces the per-frame fences:")}
      </p>
      <CodeBlock lang="cpp" filename="sync.cpp" t={t}>{`// App gains: VkSemaphore frameTimeline;     FrameData loses: VkFence inFlight;
VkSemaphoreTypeCreateInfo type{};
type.sType         = VK_STRUCTURE_TYPE_SEMAPHORE_TYPE_CREATE_INFO;
type.semaphoreType = VK_SEMAPHORE_TYPE_TIMELINE;
type.initialValue  = 0;                                        // no frame has finished yet
VkSemaphoreCreateInfo info{};
info.sType = VK_STRUCTURE_TYPE_SEMAPHORE_CREATE_INFO;
info.pNext = &type;
VK_CHECK(vkCreateSemaphore(app.device, &info, nullptr, &app.frameTimeline));

// drawFrame, step 1: frame m − N signalled m − N + 1 when it finished
if (app.frameNumber >= kFramesInFlight) {
    const uint64_t value = app.frameNumber - kFramesInFlight + 1;
    VkSemaphoreWaitInfo wait{};
    wait.sType          = VK_STRUCTURE_TYPE_SEMAPHORE_WAIT_INFO;
    wait.semaphoreCount = 1;
    wait.pSemaphores    = &app.frameTimeline;
    wait.pValues        = &value;
    VK_CHECK(vkWaitSemaphores(app.device, &wait, UINT64_MAX));
}
// no vkResetFences anywhere: a counter is never reset

// step 4: signal "frame frameNumber has finished" next to renderFinished
VkSemaphoreSubmitInfo signals[2] = {signal, {}};               // [0]: renderFinished, binary, as before
signals[1].sType     = VK_STRUCTURE_TYPE_SEMAPHORE_SUBMIT_INFO;
signals[1].semaphore = app.frameTimeline;
signals[1].value     = app.frameNumber + 1;
signals[1].stageMask = VK_PIPELINE_STAGE_2_ALL_COMMANDS_BIT;
submit.signalSemaphoreInfoCount = 2;
submit.pSignalSemaphoreInfos    = signals;
VK_CHECK(vkQueueSubmit2(app.graphicsQueue, 1, &submit, VK_NULL_HANDLE));   // no fence

// destroyRetired: the counter says exactly how many frames have finished
uint64_t finished = 0;
vkGetSemaphoreCounterValue(app.device, app.frameTimeline, &finished);   // frames 0 … finished − 1
// destroy an entry when r.lastFrame < int64_t(finished)`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "vkMod_tChoice", "Choice"), tx(t, "vkMod_tReason", "Reason")]}
        rows={[
          [tx(t, "vkMod_t1", "frame m signals m + 1"), tx(t, "vkMod_t1b", "the counter starts at 0, meaning \"no frame finished\"; after frame m it equals the number of finished frames. Waiting for m − N + 1 is waiting for frame m − N, exactly what the slot's fence meant.")],
          [tx(t, "vkMod_t2", "imageAvailable and renderFinished stay binary"), tx(t, "vkMod_t2b", "vkAcquireNextImageKHR and vkQueuePresentKHR accept only binary semaphores. Timelines replace fences and GPU-to-GPU waits between your own submits.")],
          [tx(t, "vkMod_t3", "no reset, no early-return trap"), tx(t, "vkMod_t3b", "the fence had to be reset only after a successful acquire; a counter that only rises has no such ordering rule.")],
          [tx(t, "vkMod_t4", "exact retirement"), tx(t, "vkMod_t4b", "destroyRetired no longer derives what has finished from the slot it just waited on; it reads the number.")],
        ]}
      />
      <TimelineFigure t={t} />
      <p>
        {tx(t, "vkMod_tlQueues",
          "Timelines shine between queues. A texture streamed on a transfer queue can signal value u on a \"uploads\" timeline; the graphics submit that first uses it waits for ≥ u at the fragment-shader stage, and later uploads simply signal u + 1, u + 2. The same pattern links async compute to graphics. A wait may even be submitted before the matching signal (wait-before-signal), which binary semaphores forbid.")}
      </p>

      <H2>{tx(t, "vkMod_nextTitle", "Vulkan 1.4 and beyond")}</H2>
      <p>
        {tx(t, "vkMod_nextBody",
          "Vulkan 1.4 (December 2024) promoted another group of extensions to core and raised several minimum limits, so desktop and mobile GPUs share a larger common feature set. Some of it, and some extensions worth knowing:")}
      </p>
      <LessonTable
        headers={[tx(t, "vkMod_tFeature", "Feature"), tx(t, "vkMod_tDoes", "What it does")]}
        rows={[
          [tx(t, "vkMod_n1a", "push descriptors (core in 1.4)"), tx(t, "vkMod_n1", "vkCmdPushDescriptorSet writes descriptors straight into the command buffer: no pool, no set allocation. Convenient for a few per-draw bindings.")],
          [tx(t, "vkMod_n2a", "dynamic rendering local read (core in 1.4)"), tx(t, "vkMod_n2", "a fragment shader can read what earlier draws of the same rendering wrote to the attachments at its pixel: deferred shading that stays in tile memory on mobile GPUs.")],
          [tx(t, "vkMod_n3a", "maintenance5 and 6 (core in 1.4)"), tx(t, "vkMod_n3", "dozens of small fixes, such as a default point size of 1.0, vkCmdBindIndexBuffer2 with a size, and shader modules passed straight to pipeline creation.")],
          [tx(t, "vkMod_n4a", "host image copy (optional in 1.4)"), tx(t, "vkMod_n4", "copies pixels between CPU memory and an image without a staging buffer or a command buffer, on drivers that support it.")],
          ["VK_EXT_descriptor_buffer", tx(t, "vkMod_n5", "descriptors become bytes you write into ordinary buffers yourself; the next step after bindless for engines that manage everything.")],
          ["VK_EXT_mesh_shader", tx(t, "vkMod_n6", "replaces vertex input and the vertex stage with compute-like task and mesh shaders that generate triangles in groups (meshlets), with culling on the GPU.")],
          [tx(t, "vkMod_n7a", "ray tracing"), tx(t, "vkMod_n7", "VK_KHR_acceleration_structure, VK_KHR_ray_tracing_pipeline and VK_KHR_ray_query: BVHs built by the driver and rays traced from shaders.")],
          ["VK_EXT_shader_object", tx(t, "vkMod_n8", "shaders without pipeline objects, with all state set dynamically, much like OpenGL but explicit.")],
        ]}
      />
      <H3>{tx(t, "vkMod_toolsTitle", "Libraries and tools")}</H3>
      <LessonTable
        headers={[tx(t, "vkMod_tTool", "Tool"), tx(t, "vkMod_tFor", "What it is for")]}
        rows={[
          ["Vulkan Memory Allocator (VMA)", tx(t, "vkMod_l1", "sub-allocates big memory blocks for every buffer and image, picks memory types, and handles defragmentation: what the Buffers chapter's \"one allocation per buffer\" becomes in real code.")],
          ["volk", tx(t, "vkMod_l2", "loads Vulkan function pointers directly from the driver, skipping the loader's dispatch on every call.")],
          ["vk-bootstrap", tx(t, "vkMod_l3", "the instance, device and swapchain setup of the first chapters in a few lines, once you know what it does.")],
          ["RenderDoc, Nsight Graphics, Radeon GPU Profiler", tx(t, "vkMod_l4", "capture a frame and inspect every command, resource and pipeline state; measure where GPU time goes.")],
          ["Slang, glslc / shaderc", tx(t, "vkMod_l5", "shader compilers to SPIR-V; Slang adds modules, generics and one source for several APIs.")],
        ]}
      />

      <H2>{tx(t, "vkMod_recapTitle", "What the track built")}</H2>
      <p>
        {tx(t, "vkMod_recapBody",
          "Sixteen chapters ago the program was an empty window. It now has: an instance with validation layers; a chosen GPU and a logical device with the features it needs; a swapchain recreated on resize without stalling; two frames in flight with their own command pools, uniform buffers and descriptor sets; a timeline semaphore instead of fences; device-local vertex and index buffers uploaded through staging; a camera in a uniform buffer and per-object data in push constants; mipmapped sRGB textures in a bindless array, sampled with anisotropy; a depth buffer, back-face culling and 4× MSAA; and a compute shader that moves ten thousand particles drawn from the same buffer. Every one of those objects was created explicitly, and every hazard between them is covered by a barrier or a semaphore you can point to. That is the whole of Vulkan's model; everything else is more of the same objects.")}
      </p>
      <Callout type="tip" t={t}>
        {tx(t, "vkMod_run", "Build and run: the scene looks as before, except that the two cubes now have different textures chosen by an index. Turn on GPU-assisted validation (VK_VALIDATION_FEATURE_ENABLE_GPU_ASSISTED_EXT, or the Vulkan Configurator) and push an index past the textures you registered: the layer reports the read of an unwritten descriptor that PARTIALLY_BOUND made legal to leave empty but not to use.")}
      </Callout>

      <H2>{tx(t, "vkMod_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "vkMod_tMistake", "Mistake"), tx(t, "vkMod_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "vkMod_e1", "UPDATE_AFTER_BIND on the binding but not on the layout or pool"), tx(t, "vkMod_e1b", "a validation error at layout or set creation. The binding flag, the layout's UPDATE_AFTER_BIND_POOL flag and the pool's UPDATE_AFTER_BIND flag go together.")],
          [tx(t, "vkMod_e2", "A per-vertex texture index without nonuniformEXT"), tx(t, "vkMod_e2b", "works on some GPUs, and on others fragments sample another object's texture in blocks. Wrap indices that vary within a draw.")],
          [tx(t, "vkMod_e3", "Reading an unwritten element"), tx(t, "vkMod_e3b", "undefined, often a device lost. Keep a default texture in element 0 and point unused indices at it.")],
          [tx(t, "vkMod_e4", "SHADER_DEVICE_ADDRESS usage without the allocate flag"), tx(t, "vkMod_e4b", "a validation error at vkBindBufferMemory: the memory must be allocated with VK_MEMORY_ALLOCATE_DEVICE_ADDRESS_BIT.")],
          [tx(t, "vkMod_e5", "vec3 inside a buffer_reference struct"), tx(t, "vkMod_e5b", "std430 pads vec3 to 16 bytes and every vertex after the first is read from the wrong place. Use float arrays or scalar layout.")],
          [tx(t, "vkMod_e6", "C++ push struct without the padding"), tx(t, "vkMod_e6b", "the 64-bit address lands at offset 68 in C++ and 72 in GLSL: the shader reads half of textureIndex as part of the pointer and crashes the GPU. static_assert the offsets.")],
          [tx(t, "vkMod_e7", "Passing a timeline semaphore to present or acquire"), tx(t, "vkMod_e7b", "not allowed: the swapchain works only with binary semaphores. Keep imageAvailable and renderFinished binary.")],
          [tx(t, "vkMod_e8", "Signalling a timeline to a value it already has"), tx(t, "vkMod_e8b", "the value must strictly increase; signalling the same or a smaller value is a validation error. Derive values from a counter such as frameNumber.")],
        ]}
      />

      <KeyIdeas t={t} id="vkMod" items={[
        "The Vulkan 1.2 features struct joins the pNext chain; descriptor indexing, buffer device address and timeline semaphores are required in every 1.3 driver but must be enabled.",
        "Bindless: one set with an array of every texture, bound once; each draw pushes an index. PARTIALLY_BOUND allows empty elements, UPDATE_AFTER_BIND allows writing while bound.",
        "An index that is the same for the whole draw is uniform; one that varies within a draw needs nonuniformEXT.",
        "Buffer device address turns a buffer into a 64-bit pointer: SHADER_DEVICE_ADDRESS usage plus the DEVICE_ADDRESS allocate flag, then vkGetBufferDeviceAddress.",
        "Vertex pulling reads vertices through a buffer_reference in the shader; there are no vertex bindings, and the C++ and GLSL layouts must agree byte for byte.",
        "A timeline semaphore is a 64-bit counter: submits signal and wait for values, the CPU waits, reads and signals. One timeline replaces the per-frame fences; present still needs binary semaphores.",
        "Vulkan 1.4 made push descriptors, dynamic rendering local read and maintenance5/6 core; mesh shaders, ray tracing and descriptor buffers are the next extensions to learn.",
      ]} />
    </Article>
  );
}
