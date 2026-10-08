"use client";

// Going further 3: compute shaders — what a dispatch is (workgroups,
// invocations, the built-in IDs, subgroups, limits) with the Dispatch figure;
// storage buffers and std430; the particle simulation (inverse-square pull,
// semi-implicit Euler, circular orbit speed); the storage-and-vertex buffer;
// descriptor set, compute pipeline; recording the dispatch between two
// buffer barriers (WAR and RAW) with the Particle figure; drawing the
// particles as points with a second graphics pipeline; shared memory and
// workgroup barriers; async compute; shutdown; mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { DispatchFigure } from "@/components/lesson/figures/vulkan/DispatchFigure";
import { ParticleFigure } from "@/components/lesson/figures/vulkan/ParticleFigure";

const r = String.raw;

export function ComputeContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "vkComp_intro",
          "Everything the GPU has run so far was part of drawing: vertex shaders placing vertices, fragment shaders colouring pixels. A compute shader is the GPU's general-purpose side: a function run many thousands of times in parallel, with no triangles, no rasterizer and no attachments, reading and writing buffers and images directly. Physics, particles, culling, post-processing, image filters, skinning and much of modern rendering run this way. This chapter adds ten thousand particles orbiting the two cubes: a compute shader moves them every frame, and the same buffer is then drawn as points.")}
      </Lead>

      <Goals t={t} id="vkComp" items={[
        "Write a compute shader and choose its workgroup size.",
        "Dispatch it between the right barriers.",
        "Run a particle simulation on the GPU and draw the result.",
      ]} />

      <H2>{tx(t, "vkComp_dispatchTitle", "A dispatch: workgroups and invocations")}</H2>
      <p>
        {tx(t, "vkComp_dispatchBody",
          "A compute shader declares the size of a workgroup, local_size_x × local_size_y × local_size_z invocations. vkCmdDispatch(x, y, z) launches a grid of x × y × z workgroups. Every invocation runs main() once and finds out which one it is from built-in variables:")}
      </p>
      <LessonTable
        headers={[tx(t, "vkComp_tBuiltin", "Built-in"), tx(t, "vkComp_tMeaning", "Meaning")]}
        rows={[
          ["gl_WorkGroupSize", tx(t, "vkComp_b1", "the local size declared in the shader, e.g. (256, 1, 1)")],
          ["gl_NumWorkGroups", tx(t, "vkComp_b2", "the x, y, z passed to vkCmdDispatch")],
          ["gl_WorkGroupID", tx(t, "vkComp_b3", "which workgroup this invocation belongs to, from (0, 0, 0) to gl_NumWorkGroups − 1")],
          ["gl_LocalInvocationID", tx(t, "vkComp_b4", "its position inside the workgroup, from (0, 0, 0) to gl_WorkGroupSize − 1")],
          ["gl_GlobalInvocationID", tx(t, "vkComp_b5", "its position in the whole grid: gl_WorkGroupID · gl_WorkGroupSize + gl_LocalInvocationID. Usually the index of the element to process.")],
          ["gl_LocalInvocationIndex", tx(t, "vkComp_b6", "the local ID flattened to one number: z · sx · sy + y · sx + x")],
        ]}
      />
      <p>
        {tx(t, "vkComp_groupBody",
          "Why groups at all? The invocations of one workgroup run on the same compute unit at the same time, so they can share fast on-chip memory and wait for each other; invocations of different workgroups cannot. Inside a workgroup, the hardware executes invocations in subgroups (NVIDIA calls them warps, AMD wavefronts) of 32 or 64 that step through the shader in lockstep. A workgroup should therefore be a multiple of the subgroup size: 64 or 256 are the usual choices. The specification guarantees at least 128 invocations per workgroup (maxComputeWorkGroupInvocations; desktop GPUs allow 1024), 65535 workgroups per dimension, and 16 KiB of shared memory.")}
      </p>
      <Equation label={tx(t, "vkComp_eqGroups", "Workgroups needed to cover n elements")}
        where={[
          ["n", tx(t, "vkComp_wN", "the number of elements to process: particles, pixels along one axis…")],
          [r`s`, tx(t, "vkComp_wS", "the workgroup size along that axis, local_size_x")],
          [r`g`, tx(t, "vkComp_wG", "the workgroup count passed to vkCmdDispatch; rounding up launches up to s − 1 extra invocations")],
        ]}>
        {r`g = \left\lceil \frac{n}{s} \right\rceil = \left\lfloor \frac{n + s - 1}{s} \right\rfloor`}
      </Equation>
      <p>
        {tx(t, "vkComp_groupEx",
          "Worked example: 10,000 particles with local_size_x = 256. g = ⌈10000 / 256⌉ = ⌈39.06⌉ = 40 workgroups, 40 × 256 = 10,240 invocations; the last 240 have gl_GlobalInvocationID.x ≥ 10,000 and must do nothing. For a 1920 × 1080 image with 8 × 8 workgroups: 1920 / 8 = 240 and 1080 / 8 = 135, so vkCmdDispatch(240, 135, 1) with no waste; at 1366 × 768 the width needs ⌈170.75⌉ = 171 groups and 2 columns of invocations fall outside.")}
      </p>
      <DispatchFigure t={t} />

      <H2>{tx(t, "vkComp_simTitle", "The simulation")}</H2>
      <p>
        {tx(t, "vkComp_simBody",
          "Each particle is pulled towards the origin, where the cubes are, with a force that falls off with the square of the distance, like gravity. Each frame, every particle updates its own velocity and position, and no particle reads another one, so one invocation per particle can run with no coordination at all:")}
      </p>
      <Equation label={tx(t, "vkComp_eqSim", "Acceleration and one semi-implicit Euler step")}
        where={[
          [r`\mathbf{x},\ \mathbf{v}`, tx(t, "vkComp_wXv", "the particle's position and velocity")],
          ["K", tx(t, "vkComp_wK", "the strength of the pull (1 here); plays the role of G · M in gravity")],
          [r`\varepsilon`, tx(t, "vkComp_wEps", "softening (0.02): keeps the pull finite when a particle passes through the centre")],
          [r`\Delta t`, tx(t, "vkComp_wDt", "the frame time in seconds, passed in a push constant")],
        ]}>
        {r`\mathbf{a} = -K\,\frac{\mathbf{x}}{\left(|\mathbf{x}|^2 + \varepsilon\right)^{3/2}}, \qquad \mathbf{v} \leftarrow \mathbf{v} + \mathbf{a}\,\Delta t, \qquad \mathbf{x} \leftarrow \mathbf{x} + \mathbf{v}\,\Delta t`}
      </Equation>
      <p>
        {tx(t, "vkComp_simWhy",
          "The magnitude of a is K / |x|² (the x on top only gives the direction, and cancels one power of the distance), which is why the denominator has the exponent 3/2. Updating the velocity first and then moving with the new velocity is semi-implicit (symplectic) Euler; it keeps orbits closed for thousands of steps, where plain Euler, which moves with the old velocity, spirals every particle slowly outwards. The Game Dev track's Integrators chapter compares the two.")}
      </p>
      <p>
        {tx(t, "vkComp_orbitBody",
          "For a particle to circle at radius r, the pull must supply exactly the centripetal acceleration v² / r: v² / r = K / r², so v = √(K / r). With K = 1: at r = 1 the speed is 1 and one orbit (2πr / v) takes 6.3 s; at r = 2, v = 0.71 and an orbit takes 17.8 s. Starting every particle at that speed, perpendicular to its radius, gives a disc of nearly circular orbits, inner ones faster.")}
      </p>

      <H3>{tx(t, "vkComp_shaderTitle", "The compute shader")}</H3>
      <CodeBlock lang="glsl" filename="shaders/particles.comp" t={t}>{`#version 450
layout(local_size_x = 256) in;                  // 256 invocations per workgroup, along x

struct Particle {
    vec4 pos;                                   // xyz; w unused, keeps every field 16-byte aligned
    vec4 vel;
};                                              // 32 bytes, in std430 and in C++

layout(std430, set = 0, binding = 0) buffer Particles {
    Particle p[];                               // runtime-sized: as many as the buffer holds
};

layout(push_constant) uniform Push {
    float dt;                                   // seconds since the last frame
    uint  count;                                // number of particles
} pc;

const float K    = 1.0;                         // strength of the pull
const float SOFT = 0.02;                        // softening ε

void main() {
    uint i = gl_GlobalInvocationID.x;
    if (i >= pc.count) return;                  // the last workgroup runs past the end
    vec3 x = p[i].pos.xyz;
    vec3 v = p[i].vel.xyz;
    float d2 = dot(x, x) + SOFT;
    vec3 a = -K * x / (d2 * sqrt(d2));          // |x|² + ε to the power 3/2
    v += a * pc.dt;                             // velocity first...
    x += v * pc.dt;                             // ...then position, with the new velocity
    p[i].pos = vec4(x, 1.0);
    p[i].vel = vec4(v, 0.0);
}`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "vkComp_tDecl", "Declaration"), tx(t, "vkComp_tWhat", "What it means")]}
        rows={[
          ["buffer Particles", tx(t, "vkComp_d1", "a storage buffer (descriptor type STORAGE_BUFFER): readable and writable by the shader, unlike a uniform buffer, and as large as the GPU's memory allows (maxStorageBufferRange is at least 128 MiB).")],
          ["std430", tx(t, "vkComp_d2", "the layout rule for storage buffers from the Descriptors chapter: arrays of scalars are packed tightly, but a vec3 is still aligned to 16 bytes. Two vec4 avoid the classic vec3 mismatch with the C++ struct.")],
          ["Particle p[]", tx(t, "vkComp_d3", "a runtime-sized array; it must be the last member of the block. p.length() would return how many fit in the bound range.")],
          ["push_constant { dt, count }", tx(t, "vkComp_d4", "8 bytes of per-dispatch parameters, recorded into the command buffer like the model matrix of the cubes.")],
        ]}
      />

      <H3>{tx(t, "vkComp_bufferTitle", "One buffer, two uses")}</H3>
      <p>
        {tx(t, "vkComp_bufferBody",
          "The particles live in one device-local buffer with two usages: STORAGE_BUFFER, so the compute shader can write it, and VERTEX_BUFFER, so the draw can read it as vertices. Nothing is copied between the simulation and the drawing, and nothing ever goes back to the CPU. The initial state is uploaded once through the staging path from the Staging chapter:")}
      </p>
      <CodeBlock lang="cpp" filename="particles.cpp" t={t}>{`struct Particle { glm::vec4 pos, vel; };            // must match the shader
static_assert(sizeof(Particle) == 32);
constexpr uint32_t kParticles = 10000;

std::vector<Particle> makeParticles(uint32_t n) {
    std::mt19937 rng(7);                                    // fixed seed: the same disc every run
    std::uniform_real_distribution<float> U(0.0f, 1.0f);
    std::vector<Particle> ps(n);
    for (Particle& q : ps) {
        const float r = 1.2f + 1.4f * U(rng);               // 1.2 to 2.6 units from the centre, clear of the cubes
        const float a = 6.2831853f * U(rng);                // angle around the y axis
        const float y = 0.15f * (U(rng) - 0.5f);            // a thin disc
        const float v = std::sqrt(1.0f / r);                // circular-orbit speed, K = 1
        q.pos = {r * std::cos(a), y, r * std::sin(a), 1.0f};
        q.vel = {-v * std::sin(a), 0.0f, v * std::cos(a), 0.0f};   // perpendicular to the radius
    }
    return ps;
}

// App gains: Buffer particles;
const std::vector<Particle> ps = makeParticles(kParticles);
app.particles = createDeviceBuffer(app, ps.data(), ps.size() * sizeof(Particle),
    VK_BUFFER_USAGE_STORAGE_BUFFER_BIT | VK_BUFFER_USAGE_VERTEX_BUFFER_BIT,
    VK_PIPELINE_STAGE_2_COMPUTE_SHADER_BIT,                 // first reader: the first dispatch
    VK_ACCESS_2_SHADER_STORAGE_READ_BIT | VK_ACCESS_2_SHADER_STORAGE_WRITE_BIT);`}</CodeBlock>

      <H2>{tx(t, "vkComp_pipeTitle", "Descriptor set and compute pipeline")}</H2>
      <p>
        {tx(t, "vkComp_pipeBody",
          "A compute pipeline has a single stage and no fixed-function state at all: no vertex input, rasterizer, blending or attachment formats. It needs a layout (its own descriptor set with the storage buffer, plus the 8-byte push constant) and the shader module:")}
      </p>
      <CodeBlock lang="cpp" filename="compute.cpp" t={t}>{`// App gains: VkDescriptorSetLayout particleLayout; VkDescriptorSet particleSet;
//            VkPipelineLayout computeLayout; VkPipeline computePipeline;
struct ParticlePush { float dt; uint32_t count; };          // 8 bytes, as in the shader

void createComputePipeline(App& app) {
    // 1. Set layout: binding 0 is one storage buffer, used by the compute stage
    VkDescriptorSetLayoutBinding binding{};
    binding.binding         = 0;
    binding.descriptorType  = VK_DESCRIPTOR_TYPE_STORAGE_BUFFER;
    binding.descriptorCount = 1;
    binding.stageFlags      = VK_SHADER_STAGE_COMPUTE_BIT;
    VkDescriptorSetLayoutCreateInfo setInfo{};
    setInfo.sType        = VK_STRUCTURE_TYPE_DESCRIPTOR_SET_LAYOUT_CREATE_INFO;
    setInfo.bindingCount = 1;
    setInfo.pBindings    = &binding;
    VK_CHECK(vkCreateDescriptorSetLayout(app.device, &setInfo, nullptr, &app.particleLayout));
    // (createDescriptors: the pool gains {VK_DESCRIPTOR_TYPE_STORAGE_BUFFER, 1} and one more set;
    //  app.particleSet is allocated and written with {app.particles.buffer, 0, VK_WHOLE_SIZE})

    // 2. Pipeline layout: that set, and the push constant
    VkPushConstantRange push{VK_SHADER_STAGE_COMPUTE_BIT, 0, sizeof(ParticlePush)};
    VkPipelineLayoutCreateInfo layoutInfo{};
    layoutInfo.sType                  = VK_STRUCTURE_TYPE_PIPELINE_LAYOUT_CREATE_INFO;
    layoutInfo.setLayoutCount         = 1;
    layoutInfo.pSetLayouts            = &app.particleLayout;
    layoutInfo.pushConstantRangeCount = 1;
    layoutInfo.pPushConstantRanges    = &push;
    VK_CHECK(vkCreatePipelineLayout(app.device, &layoutInfo, nullptr, &app.computeLayout));

    // 3. The pipeline: one stage, nothing else
    VkShaderModule module = createShaderModule(app.device, readSpirv("shaders/particles.comp.spv"));
    VkComputePipelineCreateInfo info{};
    info.sType        = VK_STRUCTURE_TYPE_COMPUTE_PIPELINE_CREATE_INFO;
    info.stage.sType  = VK_STRUCTURE_TYPE_PIPELINE_SHADER_STAGE_CREATE_INFO;
    info.stage.stage  = VK_SHADER_STAGE_COMPUTE_BIT;
    info.stage.module = module;
    info.stage.pName  = "main";
    info.layout       = app.computeLayout;
    VK_CHECK(vkCreateComputePipelines(app.device, VK_NULL_HANDLE, 1, &info, nullptr, &app.computePipeline));
    vkDestroyShaderModule(app.device, module, nullptr);      // the pipeline keeps what it needs
}`}</CodeBlock>
      <Callout type="info" t={t}>
        {tx(t, "vkComp_queueNote", "The dispatch goes to the graphics queue. A queue family that supports graphics supports compute on every desktop and mobile GPU (the specification requires at least one family with both), and it is the one the Devices chapter picked; a strict pickGpu can also check VK_QUEUE_COMPUTE_BIT on it.")}
      </Callout>

      <H2>{tx(t, "vkComp_recordTitle", "Recording: the dispatch between two barriers")}</H2>
      <p>
        {tx(t, "vkComp_recordBody",
          "vkCmdDispatch is not allowed inside vkCmdBeginRendering / vkCmdEndRendering, so it is recorded at the start of recordFrame, before the image transitions. The same buffer is written by the dispatch and read by the draw in the same frame, and read by the previous frame's draw: two hazards, two barriers. A small helper records one buffer barrier:")}
      </p>
      <CodeBlock lang="cpp" filename="commands.cpp" t={t}>{`void bufferBarrier(VkCommandBuffer cmd, VkBuffer buffer,
                   VkPipelineStageFlags2 srcStage, VkAccessFlags2 srcAccess,
                   VkPipelineStageFlags2 dstStage, VkAccessFlags2 dstAccess) {
    VkBufferMemoryBarrier2 b{};
    b.sType               = VK_STRUCTURE_TYPE_BUFFER_MEMORY_BARRIER_2;
    b.srcStageMask        = srcStage;
    b.srcAccessMask       = srcAccess;
    b.dstStageMask        = dstStage;
    b.dstAccessMask       = dstAccess;
    b.srcQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED;        // no ownership transfer
    b.dstQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED;
    b.buffer              = buffer;
    b.offset              = 0;
    b.size                = VK_WHOLE_SIZE;
    VkDependencyInfo dep{};
    dep.sType                    = VK_STRUCTURE_TYPE_DEPENDENCY_INFO;
    dep.bufferMemoryBarrierCount = 1;
    dep.pBufferMemoryBarriers    = &b;
    vkCmdPipelineBarrier2(cmd, &dep);
}

// recordFrame, right after vkBeginCommandBuffer:
// a. the previous frame's draw read the particles as vertices: finish that before overwriting (WAR)
bufferBarrier(cmd, app.particles.buffer,
    VK_PIPELINE_STAGE_2_VERTEX_ATTRIBUTE_INPUT_BIT, VK_ACCESS_2_NONE,
    VK_PIPELINE_STAGE_2_COMPUTE_SHADER_BIT, VK_ACCESS_2_SHADER_STORAGE_READ_BIT | VK_ACCESS_2_SHADER_STORAGE_WRITE_BIT);

vkCmdBindPipeline(cmd, VK_PIPELINE_BIND_POINT_COMPUTE, app.computePipeline);
vkCmdBindDescriptorSets(cmd, VK_PIPELINE_BIND_POINT_COMPUTE, app.computeLayout,
                        0, 1, &app.particleSet, 0, nullptr);
const ParticlePush push{app.dt, kParticles};
vkCmdPushConstants(cmd, app.computeLayout, VK_SHADER_STAGE_COMPUTE_BIT, 0, sizeof(push), &push);
vkCmdDispatch(cmd, (kParticles + 255) / 256, 1, 1);          // ⌈10000 / 256⌉ = 40 workgroups

// b. the new positions must be written before the vertex fetch reads them (RAW)
bufferBarrier(cmd, app.particles.buffer,
    VK_PIPELINE_STAGE_2_COMPUTE_SHADER_BIT, VK_ACCESS_2_SHADER_STORAGE_WRITE_BIT,
    VK_PIPELINE_STAGE_2_VERTEX_ATTRIBUTE_INPUT_BIT, VK_ACCESS_2_VERTEX_ATTRIBUTE_READ_BIT);
// ... then the image transitions and rendering, as before`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "vkComp_tChoice", "Choice"), tx(t, "vkComp_tReason", "Reason")]}
        rows={[
          [tx(t, "vkComp_c1", "barrier a: src access NONE"), tx(t, "vkComp_c1b", "the previous frame only read the buffer. A write after a read needs only the execution dependency: the dispatch must not start writing until those reads are done. With two frames in flight it is the previous frame's submission this barrier waits on; a barrier orders against all earlier work on the queue.")],
          [tx(t, "vkComp_c2", "barrier b: STORAGE_WRITE → VERTEX_ATTRIBUTE_READ"), tx(t, "vkComp_c2b", "a real memory dependency: the compute writes must be made available and visible to the vertex-input stage, which reads the buffer through a different path (the vertex fetch hardware and its caches).")],
          [tx(t, "vkComp_c3", "one buffer, updated in place"), tx(t, "vkComp_c3b", "safe because invocation i reads and writes only particle i. A simulation where particles read their neighbours (flocking, fluids) needs two buffers, read from one and write to the other, swapped every frame (ping-pong).")],
          [tx(t, "vkComp_c4", "app.dt clamped"), tx(t, "vkComp_c4b", "measured in the main loop with SDL_GetTicksNS and clamped to 0.05 s, so a pause (dragging the window, a breakpoint) does not produce one huge step that flings particles away.")],
        ]}
      />
      <ParticleFigure t={t} />

      <H2>{tx(t, "vkComp_drawTitle", "Drawing the particles")}</H2>
      <p>
        {tx(t, "vkComp_drawBody",
          "The particles are drawn as points by a second graphics pipeline, built by the same createPipeline code as the cubes with a few differences. It can reuse the cubes' pipeline layout: that layout declares set 0 (the camera), set 1 and the push constant, and a shader is allowed to use only part of what its layout declares. Because the layout is the same, the sets bound for the cubes stay bound when the pipeline changes.")}
      </p>
      <CodeBlock lang="cpp" filename="pipeline.cpp" t={t}>{`// createParticlePipeline: as createPipeline, except:
// shaders:  particles.vert / particles.frag;   layout: app.pipelineLayout (reused)
binding.stride = sizeof(Particle);                               // 32 bytes per vertex
attrs[0] = {0, 0, VK_FORMAT_R32G32B32A32_SFLOAT, offsetof(Particle, pos)};   // location, binding, format, offset
attrs[1] = {1, 0, VK_FORMAT_R32G32B32A32_SFLOAT, offsetof(Particle, vel)};
vertexInput.vertexAttributeDescriptionCount = 2;
inputAssembly.topology = VK_PRIMITIVE_TOPOLOGY_POINT_LIST;       // one point per vertex
raster.cullMode        = VK_CULL_MODE_NONE;                      // points have no winding
multisample.rasterizationSamples = app.samples;                  // same pass, same sample count

// recordFrame, inside rendering, after the cubes:
vkCmdBindPipeline(cmd, VK_PIPELINE_BIND_POINT_GRAPHICS, app.particlePipeline);
VkDeviceSize offset = 0;
vkCmdBindVertexBuffers(cmd, 0, 1, &app.particles.buffer, &offset);   // the storage buffer, as vertices
vkCmdDraw(cmd, kParticles, 1, 0, 0);                                  // no index buffer`}</CodeBlock>
      <CodeBlock lang="glsl" filename="shaders/particles.vert + particles.frag" t={t}>{`// particles.vert
#version 450
layout(set = 0, binding = 0) uniform Camera { mat4 view; mat4 proj; } cam;
layout(location = 0) in vec4 inPos;               // Particle.pos
layout(location = 1) in vec4 inVel;               // Particle.vel
layout(location = 0) out vec3 vColor;
void main() {
    gl_Position  = cam.proj * cam.view * vec4(inPos.xyz, 1.0);
    gl_PointSize = 1.0;                           // must be written for POINT_LIST; > 1 needs largePoints
    float s = clamp((length(inVel.xyz) - 0.6) / 0.35, 0.0, 1.0);   // speed 0.6 → 0, 0.95 → 1
    vColor = mix(vec3(0.2, 0.4, 1.0), vec3(1.0, 0.8, 0.3), s);      // slow blue, fast gold
}

// particles.frag
#version 450
layout(location = 0) in vec3 vColor;
layout(location = 0) out vec4 outColor;
void main() { outColor = vec4(vColor, 1.0); }`}</CodeBlock>
      <Callout type="tip" t={t}>
        {tx(t, "vkComp_run", "Build and run: a disc of ten thousand points orbits the cubes, the inner ones faster and golden, the outer ones slower and blue; the depth test hides the points behind the cubes and MSAA smooths them. Then break it on purpose, with synchronization validation on: delete barrier b and the layer reports a read-after-write hazard between the dispatch and the vertex input; remove the bounds check and, with robustBufferAccess off, the 240 extra invocations write past the end of the buffer.")}
      </Callout>

      <H2>{tx(t, "vkComp_sharedTitle", "Beyond one invocation per element")}</H2>
      <p>
        {tx(t, "vkComp_sharedBody",
          "The particles never talk to each other. Many compute jobs do: summing an array, blurring an image, building a histogram. For that, the invocations of a workgroup have shared memory, declared with the shared qualifier, much faster than a buffer, and barrier(), which makes every invocation of the group wait until all of them reach it. A workgroup sum of 256 values halves the number of active invocations at every step, finishing in log₂ 256 = 8 steps instead of 255 additions in a row:")}
      </p>
      <CodeBlock lang="glsl" filename="reduce.comp" t={t}>{`shared float partial[256];                        // one slot per invocation of the group
void main() {
    uint l = gl_LocalInvocationID.x;
    partial[l] = values[gl_GlobalInvocationID.x];
    barrier();                                     // every slot written before anyone reads
    for (uint stride = 128; stride > 0; stride /= 2) {
        if (l < stride) partial[l] += partial[l + stride];
        barrier();                                 // this step done before the next one
    }
    if (l == 0) sums[gl_WorkGroupID.x] = partial[0];   // one result per workgroup
}`}</CodeBlock>
      <p>
        {tx(t, "vkComp_sharedEnd",
          "barrier() must be reached by every invocation of the group, so it may not sit inside a branch that some of them skip. Subgroup operations (GL_KHR_shader_subgroup, core in Vulkan 1.1) go further: subgroupAdd sums a value across the 32 or 64 lanes of a subgroup in one instruction, with no shared memory at all.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "vkComp_asyncNote", "Many GPUs also have queue families that support compute but not graphics. Work submitted there can run at the same time as the graphics queue, filling shader units that rendering leaves idle (async compute). It costs more code: a second queue and command buffers, semaphores between the queues, and either CONCURRENT sharing or queue-family ownership transfers for the shared buffers. It is worth it for large, independent jobs, and only after a profiler shows idle units.")}
      </Callout>

      <H2>{tx(t, "vkComp_shutdownTitle", "Shutdown, updated")}</H2>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`vkDestroyPipeline(app.device, app.particlePipeline, nullptr);
vkDestroyPipeline(app.device, app.computePipeline, nullptr);
vkDestroyPipelineLayout(app.device, app.computeLayout, nullptr);
vkDestroyDescriptorSetLayout(app.device, app.particleLayout, nullptr);   // the set goes with the pool
destroyBuffer(app, app.particles);
// ... then the rest as before`}</CodeBlock>

      <H2>{tx(t, "vkComp_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "vkComp_tMistake", "Mistake"), tx(t, "vkComp_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "vkComp_e1", "Passing the element count to vkCmdDispatch"), tx(t, "vkComp_e1b", "vkCmdDispatch(10000, 1, 1) launches 10,000 workgroups of 256: 2.56 million invocations. It takes workgroup counts: ⌈n / 256⌉.")],
          [tx(t, "vkComp_e2", "No bounds check"), tx(t, "vkComp_e2b", "the invocations past the end of the last workgroup read and write beyond the buffer: corrupted neighbours, or discarded writes with robustBufferAccess. Compare against the count and return.")],
          [tx(t, "vkComp_e3", "vec3 in a storage-buffer struct"), tx(t, "vkComp_e3b", "std430 aligns a vec3 to 16 bytes, C++ packs glm::vec3 in 12: every particle after the first is read from the wrong offset. Use vec4, or float[3].")],
          [tx(t, "vkComp_e4", "No barrier between dispatch and draw"), tx(t, "vkComp_e4b", "the vertex fetch may read before the writes land: jittering particles, a hazard in synchronization validation. Record barrier b.")],
          [tx(t, "vkComp_e5", "Dispatching inside rendering"), tx(t, "vkComp_e5b", "a validation error: vkCmdDispatch is not allowed between vkCmdBeginRendering and vkCmdEndRendering. Record compute work before or after.")],
          [tx(t, "vkComp_e6", "Forgetting VERTEX_BUFFER usage on the storage buffer"), tx(t, "vkComp_e6b", "a validation error at vkCmdBindVertexBuffers. A buffer may have several usages; declare every one.")],
          [tx(t, "vkComp_e7", "barrier() inside a branch"), tx(t, "vkComp_e7b", "undefined behaviour, usually a hang: some invocations wait for others that never arrive. Keep barrier() in uniform control flow.")],
          [tx(t, "vkComp_e8", "Using the raw frame time"), tx(t, "vkComp_e8b", "after any stall the next step is huge and the orbits explode. Clamp dt, or run the simulation at a fixed step.")],
        ]}
      />

      <KeyIdeas t={t} id="vkComp" items={[
        "A compute shader runs main() once per invocation; vkCmdDispatch counts workgroups, each of local_size invocations.",
        "gl_GlobalInvocationID = gl_WorkGroupID · gl_WorkGroupSize + gl_LocalInvocationID picks the element; round the group count up and bounds-check.",
        "Workgroups run on one compute unit, as subgroups of 32 or 64 in lockstep: use multiples of the subgroup size, 64 or 256.",
        "Storage buffers are read-write and use std430; avoid vec3 in shared structs.",
        "A compute pipeline is one stage plus a layout; its sets and push constants are bound at the COMPUTE bind point.",
        "One buffer can be a storage buffer and a vertex buffer: the simulation never leaves the GPU.",
        "Dispatch outside rendering, between a WAR barrier (previous draw → compute) and a RAW barrier (compute write → vertex attribute read).",
        "Shared memory and barrier() let a workgroup cooperate; subgroup operations go further without shared memory.",
      ]} />
    </Article>
  );
}
