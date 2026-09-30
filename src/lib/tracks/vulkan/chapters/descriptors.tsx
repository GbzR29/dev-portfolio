"use client";

// Resources 3: descriptors, uniforms and push constants — how shaders reach
// data that is not a vertex; update frequency; the camera (GLM configured for
// Vulkan, the y flip, what it does to the winding); uniform buffer + std140
// with the Std140 figure and a worked layout; descriptor set layout, pipeline
// layout with a push-constant range, pool, allocation, vkUpdateDescriptorSets;
// writing the uniform each frame; binding and pushing per draw (two quads);
// the DescriptorChain "break it" figure; sets by frequency, dynamic offsets,
// what comes later (bindless, push descriptors); mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { Std140Figure } from "@/components/lesson/figures/vulkan/Std140Figure";
import { DescriptorChainFigure } from "@/components/lesson/figures/vulkan/DescriptorChainFigure";
import { VulkanObjectsFigure } from "@/components/lesson/figures/vulkan/VulkanObjectsFigure";

const r = String.raw;

export function DescriptorsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "vkDesc_intro",
          "Vertices are not the only data a shader needs. The camera's matrices, a material's colour, a light's position and, soon, textures all come from outside the draw's vertex stream. In OpenGL you called glUniformMatrix4fv on the bound program and the driver stored the value somewhere. Vulkan offers two explicit mechanisms: push constants, a few bytes written straight into the command buffer, and descriptors, which point the shader at buffers and images and are grouped into descriptor sets. This chapter uses both: a uniform buffer for the camera, shared by every draw, and a push constant for each object's model matrix. The quad becomes two quads, turning in perspective.")}
      </Lead>

      <H2>{tx(t, "vkDesc_freqTitle", "How often does the data change?")}</H2>
      <p>
        {tx(t, "vkDesc_freqBody",
          "The right mechanism depends on how often a value changes and how big it is. Data grouped by frequency can be bound once and left alone while the faster-changing data around it is switched:")}
      </p>
      <LessonTable
        headers={[tx(t, "vkDesc_tFreq", "Changes"), tx(t, "vkDesc_tExample", "Example"), tx(t, "vkDesc_tMech", "Usual mechanism")]}
        rows={[
          [tx(t, "vkDesc_q1", "once per frame"), tx(t, "vkDesc_q1b", "camera view and projection, time, lights"), tx(t, "vkDesc_q1c", "a uniform buffer in descriptor set 0")],
          [tx(t, "vkDesc_q2", "per material"), tx(t, "vkDesc_q2b", "textures, colour factors, roughness"), tx(t, "vkDesc_q2c", "descriptor set 1")],
          [tx(t, "vkDesc_q3", "per object"), tx(t, "vkDesc_q3b", "model matrix, object id"), tx(t, "vkDesc_q3c", "push constants, or a dynamic offset into one big buffer")],
          [tx(t, "vkDesc_q4", "per draw, a few bytes"), tx(t, "vkDesc_q4b", "an index, a tint, a flag"), tx(t, "vkDesc_q4c", "push constants")],
        ]}
      />

      <H2>{tx(t, "vkDesc_cameraTitle", "The camera, built for Vulkan")}</H2>
      <p>
        {tx(t, "vkDesc_cameraBody",
          "We use GLM for the matrix math, the same library as the OpenGL track. GLM was written for OpenGL's conventions, so two settings adapt it. GLM_FORCE_DEPTH_ZERO_TO_ONE makes glm::perspective produce depths from 0 to 1, Vulkan's range, instead of OpenGL's −1 to 1. And GLM builds a clip space with y pointing up, while Vulkan's y points down, so the projection's y scale is negated. The pipeline chapter showed the other way to flip, a negative viewport height; this track keeps a positive viewport and flips the matrix.")}
      </p>
      <CodeBlock lang="cpp" filename="camera.h" t={t}>{`#define GLM_FORCE_DEPTH_ZERO_TO_ONE        // clip-space z in [0, 1], as Vulkan expects
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>

struct CameraUbo {                          // must match the shader's uniform block byte for byte
    glm::mat4 view;                         // offset 0,  64 bytes
    glm::mat4 proj;                         // offset 64, 64 bytes
};

CameraUbo makeCamera(VkExtent2D extent) {
    CameraUbo c;
    c.view = glm::lookAt(glm::vec3(0.0f, 0.0f, 3.0f),       // eye: 3 units in front of the origin
                         glm::vec3(0.0f),                     // looking at the origin
                         glm::vec3(0.0f, 1.0f, 0.0f));        // world up is +y
    c.proj = glm::perspective(glm::radians(45.0f),          // vertical field of view
                              float(extent.width) / float(extent.height),   // aspect ratio
                              0.1f, 10.0f);                   // near and far planes
    c.proj[1][1] *= -1.0f;                  // GLM's y is up, Vulkan's clip-space y is down
    return c;
}`}</CodeBlock>
      <p>
        {tx(t, "vkDesc_flipBody",
          "proj[1][1] is column 1, row 1 of the matrix: the factor that scales y. Negating it mirrors the picture vertically, so world +y, up, ends up at the top of the window. That has a consequence for the quad. Its vertices are now positions in a y-up world, so vertex 0 at (−0.5, −0.5) is the bottom-left corner and the red corner moves to the bottom. Seen on screen the triangles now wind counter-clockwise; the rasterizer still draws them because cullMode is NONE. The Depth chapter turns back-face culling on with frontFace = COUNTER_CLOCKWISE, the convention of y-up models seen through a flipped projection.")}
      </p>

      <H2>{tx(t, "vkDesc_uboTitle", "The uniform buffer and its layout")}</H2>
      <CodeBlock lang="glsl" filename="shaders/quad.vert" t={t}>{`#version 450

layout(set = 0, binding = 0) uniform Camera {   // descriptor set 0, binding 0
    mat4 view;
    mat4 proj;
} cam;

layout(push_constant) uniform Push {           // at most 128 bytes are guaranteed
    mat4 model;
} pc;

layout(location = 0) in vec2 inPos;
layout(location = 1) in vec3 inColor;
layout(location = 0) out vec3 vColor;

void main() {
    gl_Position = cam.proj * cam.view * pc.model * vec4(inPos, 0.0, 1.0);
    vColor = inColor;
}`}</CodeBlock>
      <p>
        {tx(t, "vkDesc_uboBody",
          "set and binding form the address of the uniform block: set 0 is the first descriptor set bound, binding 0 is the first slot inside it. The shader reads the buffer's bytes at offsets fixed by the block's layout rules, and the C++ struct must put every member at exactly the same offset, or the shader reads the wrong bytes with no error at all. Uniform blocks use the std140 rules; storage buffers and push constants use std430, which differs only for arrays and nested structs. Each type has a size and a base alignment, and a member starts at the next multiple of its alignment:")}
      </p>
      <LessonTable
        headers={[tx(t, "vkDesc_tType", "GLSL type"), tx(t, "vkDesc_tSize", "Size"), tx(t, "vkDesc_tAlign140", "Alignment (std140)"), tx(t, "vkDesc_tAlign430", "Alignment (std430)")]}
        rows={[
          ["float, int, uint", "4", "4", "4"],
          ["vec2", "8", "8", "8"],
          ["vec3", "12", "16", "16"],
          ["vec4", "16", "16", "16"],
          ["mat4", tx(t, "vkDesc_sMat", "64 (four vec4 columns)"), "16", "16"],
          [tx(t, "vkDesc_sArr", "float[n]"), tx(t, "vkDesc_sArrSize", "std140: 16·n, std430: 4·n"), tx(t, "vkDesc_sArrA", "16: every element padded to 16 bytes"), "4"],
          [tx(t, "vkDesc_sStruct", "struct"), tx(t, "vkDesc_sStructSize", "rounded up to its alignment"), tx(t, "vkDesc_sStructA", "largest member, rounded up to 16"), tx(t, "vkDesc_sStructA430", "largest member")],
        ]}
      />
      <p>
        {tx(t, "vkDesc_trapBody",
          "The trap is vec3: 12 bytes big but aligned like a vec4. In C++ a glm::vec3 is three floats with 4-byte alignment, so after a float the C++ compiler places it at offset 4 while the shader expects 16. alignas(16) on the C++ member fixes it. The second trap is scalar arrays in std140: each element occupies 16 bytes, so float w[4] is 64 bytes in the shader and 16 in C++. Most engines avoid both by using only vec4 and mat4 in uniform blocks, or enable the scalarBlockLayout feature (core in Vulkan 1.2), which makes blocks follow plain C alignment.")}
      </p>
      <Std140Figure t={t} />

      <H3>{tx(t, "vkDesc_workedTitle", "Worked example: offsets by hand")}</H3>
      <CodeBlock lang="glsl" filename="std140" t={t}>{`layout(set = 0, binding = 1) uniform Params {
    float time;
    vec3  dir;
    vec2  uv;
    float w[2];
} params;`}</CodeBlock>
      <p>
        {tx(t, "vkDesc_workedIntro",
          "Keep a running offset o, starting at 0. For each member, round o up to the member's alignment, place the member there, and add its size:")}
      </p>
      <Equation label={tx(t, "vkDesc_eqOffset", "Placing one member")}
        where={[
          ["o", tx(t, "vkDesc_wO", "the running offset: the first byte after the previous member")],
          [r`a_m,\ s_m`, tx(t, "vkDesc_wAs", "the member's base alignment and size from the table")],
          [r`\text{offset}_m`, tx(t, "vkDesc_wOff", "where the member starts; the shader reads it there")],
        ]}>
        {r`\text{offset}_m = \text{alignUp}(o, a_m) \qquad o \leftarrow \text{offset}_m + s_m`}
      </Equation>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "vkDesc_w1", "time: alignment 4, alignUp(0, 4) = 0. It occupies bytes 0–3, o = 4.")}</li>
        <li>{tx(t, "vkDesc_w2", "dir: vec3, alignment 16, alignUp(4, 16) = 16. Bytes 4–15 are padding; dir occupies 16–27, o = 28.")}</li>
        <li>{tx(t, "vkDesc_w3", "uv: vec2, alignment 8, alignUp(28, 8) = 32. Four bytes of padding; uv occupies 32–39, o = 40.")}</li>
        <li>{tx(t, "vkDesc_w4", "w: array of 2 floats, std140 alignment 16 and element stride 16, alignUp(40, 16) = 48. w[0] is at 48, w[1] at 64, each followed by 12 bytes of padding; o = 48 + 2 · 16 = 80.")}</li>
        <li>{tx(t, "vkDesc_w5", "Block size: 80, already a multiple of 16. The shader reads 80 bytes. A naive C++ struct with the same members puts dir at 4, uv at 16 and w at 24, 32 bytes in total: only time would be read correctly.")}</li>
      </ol>
      <p>
        {tx(t, "vkDesc_workedFix",
          "The matching C++ struct: float time; alignas(16) glm::vec3 dir; alignas(8) glm::vec2 uv; and for the array, a struct of one float padded to 16 bytes, or simply glm::vec4 w[2] with the shader reading w[i].x. A static_assert(offsetof(Params, uv) == 32) next to the struct turns a silent mismatch into a compile error.")}
      </p>

      <H2>{tx(t, "vkDesc_objectsTitle", "Four objects between the shader and the buffer")}</H2>
      <LessonTable
        headers={[tx(t, "vkDesc_tObj", "Object"), tx(t, "vkDesc_tRole", "Role")]}
        rows={[
          ["VkDescriptorSetLayout", tx(t, "vkDesc_o1", "the shape of one set: which bindings it has, the descriptor type and count of each, and which shader stages may use it. It matches the shader's declarations.")],
          ["VkPipelineLayout", tx(t, "vkDesc_o2", "the list of set layouts (set 0, set 1…) plus the push-constant ranges. The pipeline is compiled against it.")],
          ["VkDescriptorPool", tx(t, "vkDesc_o3", "the memory descriptor sets are allocated from, sized in advance: how many sets, and how many descriptors of each type in total.")],
          ["VkDescriptorSet", tx(t, "vkDesc_o4", "an allocated set with a layout, whose bindings are filled with vkUpdateDescriptorSets (this buffer, this range) and which is bound while recording.")],
        ]}
      />
      <CodeBlock lang="cpp" filename="descriptors.cpp" t={t}>{`// App gains: VkDescriptorSetLayout setLayout; VkDescriptorPool descriptorPool;
//            VkDescriptorSet cameraSet; Buffer cameraUbo;
void createDescriptors(App& app) {                 // before createPipeline: the layout needs setLayout
    // 1. Layout: binding 0 is one uniform buffer, read by the vertex shader
    VkDescriptorSetLayoutBinding binding{};
    binding.binding         = 0;                            // layout(binding = 0)
    binding.descriptorType  = VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER;
    binding.descriptorCount = 1;                            // not an array
    binding.stageFlags      = VK_SHADER_STAGE_VERTEX_BIT;   // who may read it
    VkDescriptorSetLayoutCreateInfo layoutInfo{};
    layoutInfo.sType        = VK_STRUCTURE_TYPE_DESCRIPTOR_SET_LAYOUT_CREATE_INFO;
    layoutInfo.bindingCount = 1;
    layoutInfo.pBindings    = &binding;
    VK_CHECK(vkCreateDescriptorSetLayout(app.device, &layoutInfo, nullptr, &app.setLayout));

    // 2. Pool: room for one set holding one uniform-buffer descriptor
    VkDescriptorPoolSize poolSize{VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER, 1};
    VkDescriptorPoolCreateInfo poolInfo{};
    poolInfo.sType         = VK_STRUCTURE_TYPE_DESCRIPTOR_POOL_CREATE_INFO;
    poolInfo.maxSets       = 1;
    poolInfo.poolSizeCount = 1;
    poolInfo.pPoolSizes    = &poolSize;
    VK_CHECK(vkCreateDescriptorPool(app.device, &poolInfo, nullptr, &app.descriptorPool));

    // 3. Allocate the set
    VkDescriptorSetAllocateInfo alloc{};
    alloc.sType              = VK_STRUCTURE_TYPE_DESCRIPTOR_SET_ALLOCATE_INFO;
    alloc.descriptorPool     = app.descriptorPool;
    alloc.descriptorSetCount = 1;
    alloc.pSetLayouts        = &app.setLayout;
    VK_CHECK(vkAllocateDescriptorSets(app.device, &alloc, &app.cameraSet));

    // 4. The buffer: host-visible, persistently mapped, rewritten every frame
    app.cameraUbo = createBuffer(app, sizeof(CameraUbo), VK_BUFFER_USAGE_UNIFORM_BUFFER_BIT,
        VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT | VK_MEMORY_PROPERTY_HOST_COHERENT_BIT);

    // 5. Point binding 0 of the set at the buffer
    VkDescriptorBufferInfo bufferInfo{app.cameraUbo.buffer, 0, sizeof(CameraUbo)};   // buffer, offset, range
    VkWriteDescriptorSet write{};
    write.sType           = VK_STRUCTURE_TYPE_WRITE_DESCRIPTOR_SET;
    write.dstSet          = app.cameraSet;
    write.dstBinding      = 0;
    write.dstArrayElement = 0;
    write.descriptorType  = VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER;
    write.descriptorCount = 1;
    write.pBufferInfo     = &bufferInfo;
    vkUpdateDescriptorSets(app.device, 1, &write, 0, nullptr);   // writes, then copies
}`}</CodeBlock>
      <p>
        {tx(t, "vkDesc_writeBody",
          "vkUpdateDescriptorSets runs on the CPU, immediately: the set now refers to the buffer. The buffer's contents can change freely afterwards, as long as the GPU is not reading them at that moment; only pointing the set at a different buffer needs another update. A set must not be updated while a submitted command buffer that uses it is still pending, unless the binding was created with the UPDATE_AFTER_BIND flag.")}
      </p>

      <H3>{tx(t, "vkDesc_pushTitle", "The push-constant range and the pipeline layout")}</H3>
      <CodeBlock lang="cpp" filename="pipeline.cpp" t={t}>{`// in createPipeline, replacing the empty pipeline layout:
VkPushConstantRange push{};
push.stageFlags = VK_SHADER_STAGE_VERTEX_BIT;
push.offset     = 0;
push.size       = sizeof(glm::mat4);                // 64 bytes: the model matrix

VkPipelineLayoutCreateInfo layoutInfo{};
layoutInfo.sType                  = VK_STRUCTURE_TYPE_PIPELINE_LAYOUT_CREATE_INFO;
layoutInfo.setLayoutCount         = 1;
layoutInfo.pSetLayouts            = &app.setLayout; // set 0
layoutInfo.pushConstantRangeCount = 1;
layoutInfo.pPushConstantRanges    = &push;
VK_CHECK(vkCreatePipelineLayout(app.device, &layoutInfo, nullptr, &app.pipelineLayout));`}</CodeBlock>
      <p>
        {tx(t, "vkDesc_pushBody",
          "Push constants live inside the command buffer: vkCmdPushConstants copies the bytes into the recording, and the draws that follow see them. There is no buffer, no descriptor and no memory to manage, which makes them the fastest way to give each draw its own small data. The price is size: maxPushConstantsSize is at least 128 bytes on every device, and 256 on most desktop GPUs. A mat4 (64 bytes) plus a vec4 of material data (16) fits anywhere.")}
      </p>

      <H2>{tx(t, "vkDesc_frameTitle", "Updating, binding, pushing")}</H2>
      <CodeBlock lang="cpp" filename="sync.cpp" t={t}>{`// in drawFrame, after vkResetFences and before recordFrame:
const CameraUbo camera = makeCamera(app.swapExtent);
std::memcpy(app.cameraUbo.mapped, &camera, sizeof(camera));   // safe: the fence wait above
                                                              // proved the GPU is done with it`}</CodeBlock>
      <CodeBlock lang="cpp" filename="commands.cpp" t={t}>{`// in recordFrame, after binding the pipeline, vertex and index buffers:
vkCmdBindDescriptorSets(cmd, VK_PIPELINE_BIND_POINT_GRAPHICS, app.pipelineLayout,
                        0, 1, &app.cameraSet,       // firstSet 0, one set
                        0, nullptr);                // no dynamic offsets

const float time = float(SDL_GetTicks()) / 1000.0f;  // seconds since start
for (float x : {-0.7f, 0.7f}) {                     // two quads, side by side
    glm::mat4 model = glm::translate(glm::mat4(1.0f), glm::vec3(x, 0.0f, 0.0f));
    model = glm::rotate(model, time * (x < 0 ? 1.0f : -0.5f), glm::vec3(0.0f, 1.0f, 0.0f));
    vkCmdPushConstants(cmd, app.pipelineLayout, VK_SHADER_STAGE_VERTEX_BIT,
                       0, sizeof(model), &model);   // offset 0, 64 bytes
    vkCmdDrawIndexed(cmd, 6, 1, 0, 0, 0);
}`}</CodeBlock>
      <p>
        {tx(t, "vkDesc_frameBody",
          "The uniform buffer is written once per frame, and the one set bound once serves both draws. The model matrix changes between the draws, so it is pushed before each one: every draw uses the values pushed most recently before it was recorded. The matrices multiply right to left in the shader: pc.model rotates the quad about its own vertical axis and moves it sideways, view moves the world so the eye is at the origin, and proj applies perspective. Writing the uniform buffer on the CPU while the GPU could be reading it would be a race; here it is safe only because there is one frame in flight and the fence wait comes first. With two frames in flight each frame needs its own copy of the buffer and its own set, which is what the Frames in Flight chapter builds.")}
      </p>
      <Callout type="tip" t={t}>
        {tx(t, "vkDesc_run", "Build and run: two quads in perspective, the left one turning one way, the right one turning more slowly the other way. Their backs are visible as they turn, because culling is off; and where they would overlap there is no depth test yet, so the one drawn last wins, which the Depth chapter fixes. Resize the window: the aspect ratio in makeCamera follows the extent, so the quads keep their shape.")}
      </Callout>
      <DescriptorChainFigure t={t} />

      <H2>{tx(t, "vkDesc_moreTitle", "Sets by frequency, and what comes later")}</H2>
      <p>
        {tx(t, "vkDesc_moreBody",
          "vkCmdBindDescriptorSets binds a range of sets starting at firstSet. Binding set 1 leaves set 0 bound, as long as the pipeline layouts agree on set 0. That is why engines order sets by frequency: set 0 per frame, set 1 per material, set 2 per object; switching materials rebinds set 1 and below only. Three extensions of the idea appear later in the track or in real engines:")}
      </p>
      <LessonTable
        headers={[tx(t, "vkDesc_tFeature", "Feature"), tx(t, "vkDesc_tWhat", "What it does")]}
        rows={[
          [tx(t, "vkDesc_m1", "Dynamic uniform buffers"), tx(t, "vkDesc_m1b", "type UNIFORM_BUFFER_DYNAMIC: one descriptor points at a large buffer, and each bind passes an offset into it (the last two parameters of vkCmdBindDescriptorSets). Per-object data for thousands of objects in one buffer and one set. Each offset must be a multiple of minUniformBufferOffsetAlignment, at most 256 bytes.")],
          [tx(t, "vkDesc_m2", "Push descriptors"), tx(t, "vkDesc_m2b", "VK_KHR_push_descriptor: the descriptor writes are recorded into the command buffer like push constants, with no pool or set to allocate.")],
          [tx(t, "vkDesc_m3", "Bindless (descriptor indexing)"), tx(t, "vkDesc_m3b", "one huge array of every texture and buffer, bound once per frame; shaders select elements by index, often passed in a push constant. Covered in the Modern Vulkan chapter.")],
        ]}
      />

      <H2>{tx(t, "vkDesc_shutdownTitle", "Shutdown, updated")}</H2>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`destroyBuffer(app, app.cameraUbo);
vkDestroyDescriptorPool(app.device, app.descriptorPool, nullptr);    // frees its sets too
vkDestroyDescriptorSetLayout(app.device, app.setLayout, nullptr);
// ... then the pipeline and pipeline layout, as before`}</CodeBlock>
      <VulkanObjectsFigure t={t} initial="dset" />

      <H2>{tx(t, "vkDesc_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "vkDesc_tMistake", "Mistake"), tx(t, "vkDesc_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "vkDesc_e1", "A glm::vec3 after a float in a uniform struct"), tx(t, "vkDesc_e1b", "every member from there on is read at the wrong offset, silently. alignas(16), vec4 instead, and static_assert the offsets.")],
          [tx(t, "vkDesc_e2", "Forgetting proj[1][1] *= -1 (or the negative viewport)"), tx(t, "vkDesc_e2b", "the scene is upside down, and the winding flips with it.")],
          [tx(t, "vkDesc_e3", "Leaving out GLM_FORCE_DEPTH_ZERO_TO_ONE"), tx(t, "vkDesc_e3b", "depths in [−1, 1]: the near half of the scene is clipped once depth testing is on. Define it before every GLM include (or in the build flags).")],
          [tx(t, "vkDesc_e4", "Binding numbers or stages that disagree with the shader"), tx(t, "vkDesc_e4b", "vkCreateGraphicsPipelines reports that the shader uses a descriptor the layout does not have. Keep set, binding, type and stage in step.")],
          [tx(t, "vkDesc_e5", "Drawing with a set that was allocated but never written"), tx(t, "vkDesc_e5b", "the layer reports an invalid descriptor; without it, garbage or a device lost.")],
          [tx(t, "vkDesc_e6", "Pool too small"), tx(t, "vkDesc_e6b", "vkAllocateDescriptorSets returns VK_ERROR_OUT_OF_POOL_MEMORY. Size maxSets and poolSizes for everything you allocate, or grow a list of pools.")],
          [tx(t, "vkDesc_e7", "Pushing more bytes than the range declares"), tx(t, "vkDesc_e7b", "a validation error: offset + size must fit inside a range with matching stageFlags.")],
          [tx(t, "vkDesc_e8", "Updating a set or a uniform buffer the GPU is still using"), tx(t, "vkDesc_e8b", "the draw reads half-old, half-new data. Wait for the fence, or keep one per frame in flight.")],
        ]}
      />

      <KeyIdeas t={t} id="vkDesc" items={[
        "Push constants are a few bytes recorded into the command buffer; descriptors point shaders at buffers and images.",
        "Group data by how often it changes: per-frame data in set 0, per-material in set 1, per-draw in push constants.",
        "For Vulkan, GLM needs GLM_FORCE_DEPTH_ZERO_TO_ONE and a negated proj[1][1] (or a negative viewport height).",
        "Uniform blocks follow std140: vec3 is aligned to 16, scalar array elements take 16 bytes; the C++ struct must match every offset.",
        "offset = alignUp(o, alignment), then o = offset + size; static_assert offsets on the C++ side.",
        "A set layout describes bindings; the pipeline layout lists set layouts and push-constant ranges; sets come from a pool and are filled with vkUpdateDescriptorSets.",
        "vkCmdBindDescriptorSets binds sets for the following draws; vkCmdPushConstants changes per-draw data between draws.",
        "At least 128 bytes of push constants are guaranteed on every device.",
        "Never write a buffer or update a set that a pending command buffer is using.",
      ]} />
    </Article>
  );
}
