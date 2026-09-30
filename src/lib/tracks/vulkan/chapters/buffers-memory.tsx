"use client";

// Resources 1: buffers and memory — why the triangle's data leaves the
// shader; VkBuffer (size, usage, sharing) versus VkDeviceMemory; memory
// requirements, heaps and types, the property flags, with the MemoryType
// figure; findMemoryType worked bit by bit; createBuffer (allocate, bind,
// persistent map); coherent versus non-coherent memory and flushing; one
// allocation per resource versus sub-allocation (alignment, the SubAlloc
// figure, VMA); the vertex input state (binding, attributes, formats); an
// index buffer and vkCmdDrawIndexed; shutdown; common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { MemoryTypeFigure } from "@/components/lesson/figures/vulkan/MemoryTypeFigure";
import { SubAllocFigure } from "@/components/lesson/figures/vulkan/SubAllocFigure";
import { VulkanObjectsFigure } from "@/components/lesson/figures/vulkan/VulkanObjectsFigure";

const r = String.raw;

export function BuffersMemoryContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "vkBuf_intro",
          "The first triangle kept its three corners inside the vertex shader. Real meshes have thousands of vertices loaded from files, so they must live in GPU-readable memory that the program fills. OpenGL did this in one call, glBufferData, and the driver decided where the bytes went. Vulkan splits it into three decisions you make yourself: a buffer object that describes the bytes, a block of memory of a type you choose, and the binding of one to the other. This chapter makes those decisions, moves the vertices into a vertex buffer, adds an index buffer, and draws a quad.")}
      </Lead>

      <H2>{tx(t, "vkBuf_twoTitle", "Two objects: the buffer and its memory")}</H2>
      <p>
        {tx(t, "vkBuf_twoBody",
          "A VkBuffer is only a description: a size in bytes and a list of the ways it will be used. It owns no memory. A VkDeviceMemory is a raw block of memory with no structure at all. Binding the buffer to an offset inside the memory makes the buffer usable. Keeping them apart lets one allocation hold many buffers, and lets the program choose exactly which kind of memory each buffer lives in.")}
      </p>
      <LessonTable
        headers={[tx(t, "vkBuf_tField", "VkBufferCreateInfo field"), tx(t, "vkBuf_tMeaning", "Meaning")]}
        rows={[
          ["size", tx(t, "vkBuf_f1", "the size in bytes. It cannot change later: a bigger buffer is a new buffer.")],
          ["usage", tx(t, "vkBuf_f2", "every way the buffer will be used, as bits: VERTEX_BUFFER, INDEX_BUFFER, UNIFORM_BUFFER, STORAGE_BUFFER, TRANSFER_SRC (copied from), TRANSFER_DST (copied into)… Using a buffer in a way not listed is an error. The driver may also pick a different alignment or memory type from these bits.")],
          ["sharingMode", tx(t, "vkBuf_f3", "EXCLUSIVE: one queue family at a time (transfers between families need an explicit hand-over). CONCURRENT: several families listed in pQueueFamilyIndices may use it at once, sometimes at a small cost. We use EXCLUSIVE; everything runs on the graphics queue.")],
          ["flags", tx(t, "vkBuf_f4", "sparse binding and protected memory; 0 here")],
        ]}
      />

      <H2>{tx(t, "vkBuf_memTitle", "Memory heaps and memory types")}</H2>
      <p>
        {tx(t, "vkBuf_memBody",
          "vkGetPhysicalDeviceMemoryProperties describes the GPU's memory in two lists. Heaps are physical pools of memory with a size: the video memory (VRAM) on a graphics card, a portion of system RAM the GPU can reach. Types are the ways of using a heap: each type points to one heap and carries property flags. A buffer is always allocated from one type, and the flags decide who can touch the memory and how fast.")}
      </p>
      <LessonTable
        headers={[tx(t, "vkBuf_tFlag", "Property (VK_MEMORY_PROPERTY_…)"), tx(t, "vkBuf_tFlagMeaning", "Meaning")]}
        rows={[
          ["DEVICE_LOCAL", tx(t, "vkBuf_p1", "the fastest memory for the GPU to read and write. On a discrete card, VRAM; on an integrated GPU, all memory is local, since GPU and CPU share the same RAM.")],
          ["HOST_VISIBLE", tx(t, "vkBuf_p2", "the CPU can map it with vkMapMemory and read or write it through a pointer")],
          ["HOST_COHERENT", tx(t, "vkBuf_p3", "CPU writes become visible to the GPU without an explicit flush, and GPU writes to the CPU without an explicit invalidate")],
          ["HOST_CACHED", tx(t, "vkBuf_p4", "CPU reads go through the CPU's cache, so reading back is fast. Without it, mapped memory is usually write-combined: fast to write in order, very slow to read.")],
          ["LAZILY_ALLOCATED", tx(t, "vkBuf_p5", "memory the driver may never actually allocate, for attachments that live only in on-chip tile memory (tile-based GPUs). Never HOST_VISIBLE.")],
        ]}
      />
      <MemoryTypeFigure t={t} />
      <p>
        {tx(t, "vkBuf_memAfter",
          "Before allocating, the buffer tells us what it needs with vkGetBufferMemoryRequirements: size (it can be larger than the size we asked for, rounded up by the driver), alignment (the offset inside the memory must be a multiple of this) and memoryTypeBits, a bit mask with bit i set if memory type i is allowed for this buffer. The allowed types depend on the usage bits and on the GPU. We then look for the first type that is both allowed and has every property we want.")}
      </p>
      <CodeBlock lang="cpp" filename="buffers.cpp" t={t}>{`uint32_t findMemoryType(VkPhysicalDevice gpu, uint32_t typeBits, VkMemoryPropertyFlags want) {
    VkPhysicalDeviceMemoryProperties mem;
    vkGetPhysicalDeviceMemoryProperties(gpu, &mem);
    for (uint32_t i = 0; i < mem.memoryTypeCount; ++i) {
        const bool allowed = typeBits & (1u << i);                              // bit i of the mask
        const bool hasAll  = (mem.memoryTypes[i].propertyFlags & want) == want; // every wanted flag
        if (allowed && hasAll) return i;
    }
    std::fprintf(stderr, "no memory type with flags 0x%x\\n", want);
    std::abort();
}`}</CodeBlock>

      <H3>{tx(t, "vkBuf_workedTitle", "Worked example: picking a type, bit by bit")}</H3>
      <p>
        {tx(t, "vkBuf_worked1",
          "Take the discrete card in the figure. Its types are: 0 system RAM with no flags, 1 VRAM with DEVICE_LOCAL, 2 system RAM with HOST_VISIBLE | HOST_COHERENT, 3 system RAM with HOST_VISIBLE | HOST_COHERENT | HOST_CACHED, and 4 the small 256 MiB window of VRAM with DEVICE_LOCAL | HOST_VISIBLE | HOST_COHERENT. A vertex buffer reports memoryTypeBits = 0b11110 = 30: types 1 to 4 are allowed, type 0 is not.")}
      </p>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "vkBuf_w1", "want = HOST_VISIBLE | HOST_COHERENT (so the CPU can write the vertices). i = 0: bit 0 of 0b11110 is 0, not allowed. i = 1: allowed, but its flags DEVICE_LOCAL do not contain HOST_VISIBLE, since flags & want = 0 ≠ want. i = 2: allowed, flags & want = want. The answer is type 2, plain system RAM.")}</li>
        <li>{tx(t, "vkBuf_w2", "want = DEVICE_LOCAL. i = 1 is the first allowed type with it: VRAM. Type 4 would also match, but the loop stops at the first.")}</li>
        <li>{tx(t, "vkBuf_w3", "Why the first match is a good answer: the specification orders the types so that, among types with the same performance, one whose flags are a subset of another's comes first. The first match is therefore the one with the fewest extra properties, and extras like HOST_VISIBLE on VRAM are scarce and worth leaving for those who need them.")}</li>
      </ol>
      <p>
        {tx(t, "vkBuf_worked2",
          "The test (flags & want) == want is the standard way to check that a set contains a subset. The & keeps only the wanted bits that are present; if that equals want, none were missing. The common mistake is writing (flags & want) != 0, which accepts a type that has any one of the wanted flags: asking for HOST_VISIBLE | HOST_COHERENT would then accept VRAM that is only HOST_VISIBLE, and every write would need a flush you do not do.")}
      </p>

      <H2>{tx(t, "vkBuf_createTitle", "Creating a buffer")}</H2>
      <CodeBlock lang="cpp" filename="buffers.cpp" t={t}>{`struct Buffer {
    VkBuffer       buffer = VK_NULL_HANDLE;
    VkDeviceMemory memory = VK_NULL_HANDLE;
    VkDeviceSize   size   = 0;
    void*          mapped = nullptr;     // set while HOST_VISIBLE memory stays mapped
};

Buffer createBuffer(App& app, VkDeviceSize size, VkBufferUsageFlags usage,
                    VkMemoryPropertyFlags props) {
    Buffer b;
    b.size = size;

    VkBufferCreateInfo info{};
    info.sType       = VK_STRUCTURE_TYPE_BUFFER_CREATE_INFO;
    info.size        = size;
    info.usage       = usage;
    info.sharingMode = VK_SHARING_MODE_EXCLUSIVE;
    VK_CHECK(vkCreateBuffer(app.device, &info, nullptr, &b.buffer));

    VkMemoryRequirements req;                             // size, alignment, memoryTypeBits
    vkGetBufferMemoryRequirements(app.device, b.buffer, &req);

    VkMemoryAllocateInfo alloc{};
    alloc.sType           = VK_STRUCTURE_TYPE_MEMORY_ALLOCATE_INFO;
    alloc.allocationSize  = req.size;                     // not size: the driver may need more
    alloc.memoryTypeIndex = findMemoryType(app.gpu, req.memoryTypeBits, props);
    VK_CHECK(vkAllocateMemory(app.device, &alloc, nullptr, &b.memory));
    VK_CHECK(vkBindBufferMemory(app.device, b.buffer, b.memory, 0));   // offset 0: always aligned

    if (props & VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT)      // map once, keep the pointer
        VK_CHECK(vkMapMemory(app.device, b.memory, 0, VK_WHOLE_SIZE, 0, &b.mapped));
    return b;
}

void destroyBuffer(App& app, Buffer& b) {
    vkDestroyBuffer(app.device, b.buffer, nullptr);
    vkFreeMemory(app.device, b.memory, nullptr);          // freeing mapped memory unmaps it
    b = {};
}`}</CodeBlock>
      <p>
        {tx(t, "vkBuf_createBody",
          "vkMapMemory returns a CPU pointer to the memory. Mapping is not free, and in Vulkan it is legal to keep memory mapped for as long as it exists, even while the GPU uses it, so we map once when the buffer is created and keep the pointer. This is called persistent mapping. What is not legal is to write through the pointer while the GPU is reading those same bytes: the fence of the frame loop already prevents that for anything written between frames.")}
      </p>

      <H3>{tx(t, "vkBuf_coherentTitle", "Coherent and non-coherent memory")}</H3>
      <p>
        {tx(t, "vkBuf_coherentBody",
          "Without HOST_COHERENT, CPU writes may stay in the CPU's caches where the GPU cannot see them. After writing you must call vkFlushMappedMemoryRanges on the range you wrote, and before reading GPU results you must call vkInvalidateMappedMemoryRanges. The range's offset and size must be multiples of nonCoherentAtomSize (a device limit, often 64 or 256 bytes), or reach the end of the allocation with VK_WHOLE_SIZE. Asking for HOST_COHERENT avoids both calls; every desktop GPU offers it, so we do. The flush is not a synchronization with the GPU: it only moves the data out of the CPU's cache. The fence and the submit still order the work.")}
      </p>

      <H2>{tx(t, "vkBuf_allocTitle", "One allocation per buffer? Sub-allocation")}</H2>
      <p>
        {tx(t, "vkBuf_allocBody",
          "createBuffer calls vkAllocateMemory once per buffer, which is fine for the handful of buffers in this track and wrong for an engine. Allocations are slow (they go to the operating system's video memory manager), and the number of allocations alive at once is limited by maxMemoryAllocationCount, which is 4096 on most Windows drivers, while a game can have tens of thousands of buffers and images. The fix is to allocate a few large blocks, say 64 or 256 MiB each, and place many resources inside each one at different offsets. Each resource's offset must respect its own alignment:")}
      </p>
      <Equation label={tx(t, "vkBuf_eqAlign", "Rounding an offset up to an alignment")}
        where={[
          ["o", tx(t, "vkBuf_wO", "the first free byte in the block, where the previous resource ended")],
          ["a", tx(t, "vkBuf_wA", "the resource's required alignment from its memory requirements; Vulkan guarantees it is a power of two")],
          [r`a-1`, tx(t, "vkBuf_wMask", "a mask of the low bits, all ones: for a = 256, 255 = 0xFF")],
          [r`\sim(a-1)`, tx(t, "vkBuf_wNot", "its bitwise complement, which clears the low bits of anything it is AND-ed with")],
        ]}
        note={tx(t, "vkBuf_eqAlignNote", "Adding a − 1 pushes any offset that is not already a multiple past the next multiple; clearing the low bits then drops it back onto that multiple. For o = 1000 and a = 256: 1000 + 255 = 1255, and 1255 with its low 8 bits cleared is 1024 = 4 · 256. The 24 bytes between 1000 and 1024 are padding. An offset that is already aligned, like 1024, stays 1024.")}>
        {r`\text{alignUp}(o, a) = (o + a - 1)\ \&\ {\sim}(a - 1)`}
      </Equation>
      <SubAllocFigure t={t} />
      <p>
        {tx(t, "vkBuf_vmaBody",
          "Writing a good sub-allocator (free lists, defragmentation, separate blocks for buffers and optimally tiled images because of bufferImageGranularity) is a project on its own. Almost every Vulkan program uses the Vulkan Memory Allocator library (VMA) from AMD, whose vmaCreateBuffer does everything createBuffer does, sub-allocating from shared blocks. We keep our own two functions so every step stays visible, and mention VMA wherever it would change the code.")}
      </p>

      <H2>{tx(t, "vkBuf_vertexTitle", "Vertex data")}</H2>
      <p>
        {tx(t, "vkBuf_vertexBody",
          "The triangle becomes a quad of four vertices, each with a 2D position and a colour. Two triangles share the diagonal, so instead of six vertices we store four and an index list of six entries that says which vertices form each triangle. The positions are in NDC with y down, and both triangles go clockwise on screen, matching frontFace = CLOCKWISE from the pipeline chapter.")}
      </p>
      <CodeBlock lang="cpp" filename="mesh.h" t={t}>{`struct Vertex {
    float pos[2];      // x, y in NDC        (offset 0, 8 bytes)
    float color[3];    // linear r, g, b     (offset 8, 12 bytes)
};                     // sizeof(Vertex) = 20: the stride

constexpr Vertex kVertices[] = {
    {{-0.5f, -0.5f}, {1.0f, 0.0f, 0.0f}},   // 0 top left
    {{ 0.5f, -0.5f}, {0.0f, 1.0f, 0.0f}},   // 1 top right
    {{ 0.5f,  0.5f}, {0.0f, 0.0f, 1.0f}},   // 2 bottom right
    {{-0.5f,  0.5f}, {1.0f, 1.0f, 1.0f}},   // 3 bottom left
};
constexpr uint16_t kIndices[] = {0, 1, 2,  2, 3, 0};   // two clockwise triangles`}</CodeBlock>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`// App gains: Buffer vertexBuffer, indexBuffer;
void createMesh(App& app) {
    constexpr VkMemoryPropertyFlags kHost =
        VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT | VK_MEMORY_PROPERTY_HOST_COHERENT_BIT;
    app.vertexBuffer = createBuffer(app, sizeof(kVertices), VK_BUFFER_USAGE_VERTEX_BUFFER_BIT, kHost);
    std::memcpy(app.vertexBuffer.mapped, kVertices, sizeof(kVertices));   // 80 bytes
    app.indexBuffer  = createBuffer(app, sizeof(kIndices), VK_BUFFER_USAGE_INDEX_BUFFER_BIT, kHost);
    std::memcpy(app.indexBuffer.mapped, kIndices, sizeof(kIndices));      // 12 bytes
}`}</CodeBlock>
      <Callout type="info" t={t}>
        {tx(t, "vkBuf_hostNote", "These buffers live in HOST_VISIBLE memory, which on a discrete card is system RAM: the GPU reads the vertices across the PCIe bus every time it draws. For four vertices it does not matter. The next chapter moves them into DEVICE_LOCAL memory with a staging copy and measures the difference.")}
      </Callout>

      <H3>{tx(t, "vkBuf_viTitle", "Describing the layout to the pipeline")}</H3>
      <p>
        {tx(t, "vkBuf_viBody",
          "The pipeline's vertex input state, empty until now, tells the GPU how to cut the buffer into vertices. A binding description says how a buffer is walked: which binding slot, how many bytes from one vertex to the next (the stride) and whether it advances per vertex or per instance. Attribute descriptions say where each shader input sits inside one vertex: its location in the shader, the binding it reads from, its format and its byte offset.")}
      </p>
      <CodeBlock lang="cpp" filename="pipeline.cpp" t={t}>{`// in createPipeline, replacing the empty vertex input:
VkVertexInputBindingDescription binding{};
binding.binding   = 0;                                  // slot 0 of vkCmdBindVertexBuffers
binding.stride    = sizeof(Vertex);                     // 20 bytes per vertex
binding.inputRate = VK_VERTEX_INPUT_RATE_VERTEX;        // INSTANCE would advance per instance

VkVertexInputAttributeDescription attrs[2]{};
attrs[0].location = 0;                                  // layout(location = 0) in vec2 inPos
attrs[0].binding  = 0;
attrs[0].format   = VK_FORMAT_R32G32_SFLOAT;            // two 32-bit floats
attrs[0].offset   = offsetof(Vertex, pos);              // 0
attrs[1].location = 1;                                  // layout(location = 1) in vec3 inColor
attrs[1].binding  = 0;
attrs[1].format   = VK_FORMAT_R32G32B32_SFLOAT;         // three 32-bit floats
attrs[1].offset   = offsetof(Vertex, color);            // 8

VkPipelineVertexInputStateCreateInfo vertexInput{};
vertexInput.sType                           = VK_STRUCTURE_TYPE_PIPELINE_VERTEX_INPUT_STATE_CREATE_INFO;
vertexInput.vertexBindingDescriptionCount   = 1;
vertexInput.pVertexBindingDescriptions      = &binding;
vertexInput.vertexAttributeDescriptionCount = 2;
vertexInput.pVertexAttributeDescriptions    = attrs;`}</CodeBlock>
      <p>
        {tx(t, "vkBuf_formatBody",
          "Attribute formats reuse the image format names, read as \"which channels, how many bits each, how to interpret them\". R32G32_SFLOAT is two signed 32-bit floats, which the shader sees as a vec2. R8G8B8A8_UNORM would be four bytes read as numbers from 0 to 1, a compact way to store colours (4 bytes instead of 12). R16G16_SINT would be two 16-bit integers for an ivec2. The shader's type must match the format's number of components and kind (float or integer); a missing component reads as 0, and a missing alpha as 1.")}
      </p>
      <CodeBlock lang="glsl" filename="shaders/quad.vert" t={t}>{`#version 450

layout(location = 0) in vec2 inPos;      // attribute 0: offset 0 in each vertex
layout(location = 1) in vec3 inColor;    // attribute 1: offset 8

layout(location = 0) out vec3 vColor;

void main() {
    gl_Position = vec4(inPos, 0.0, 1.0);
    vColor = inColor;
}`}</CodeBlock>

      <H3>{tx(t, "vkBuf_drawTitle", "Binding and drawing with indices")}</H3>
      <CodeBlock lang="cpp" filename="commands.cpp" t={t}>{`// in recordFrame, replacing vkCmdDraw(cmd, 3, 1, 0, 0):
const VkDeviceSize offset = 0;
vkCmdBindVertexBuffers(cmd, 0, 1, &app.vertexBuffer.buffer, &offset);     // first binding 0
vkCmdBindIndexBuffer(cmd, app.indexBuffer.buffer, 0, VK_INDEX_TYPE_UINT16);
vkCmdDrawIndexed(cmd, 6, 1, 0, 0, 0);   // indexCount, instanceCount, firstIndex, vertexOffset, firstInstance`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "vkBuf_tParam", "vkCmdDrawIndexed parameter"), tx(t, "vkBuf_tMeaning", "Meaning")]}
        rows={[
          ["indexCount", tx(t, "vkBuf_d1", "how many indices to read: 6, two triangles of three")],
          ["instanceCount", tx(t, "vkBuf_d2", "copies of the draw, as in vkCmdDraw; 1")],
          ["firstIndex", tx(t, "vkBuf_d3", "where to start in the index buffer, counted in indices, not bytes")],
          ["vertexOffset", tx(t, "vkBuf_d4", "a number added to every index before the vertex is fetched. It lets many meshes share one vertex buffer while each keeps indices that start at 0.")],
          ["firstInstance", tx(t, "vkBuf_d5", "the first gl_InstanceIndex; 0")],
        ]}
      />
      <p>
        {tx(t, "vkBuf_indexBody",
          "UINT16 indices can address 65 536 vertices and take half the space of UINT32. Indexing saves more than memory: the GPU keeps the results of recently shaded vertices in a small post-transform cache keyed by index, so a vertex shared by several triangles is usually shaded once. Our quad runs the vertex shader 4 times instead of 6.")}
      </p>
      <Callout type="tip" t={t}>
        {tx(t, "vkBuf_run", "Build and run: a square with red, green, blue and white corners. If it shows only one triangle, indexCount is still 3; if it looks torn or stretched, compare the attribute offsets and formats with the Vertex struct; if nothing appears and the layer complains about the vertex input, the shader's locations and the attribute locations do not match.")}
      </Callout>

      <H2>{tx(t, "vkBuf_shutdownTitle", "Shutdown, updated")}</H2>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`void destroy(App& app) {
    vkDeviceWaitIdle(app.device);
    destroyBuffer(app, app.indexBuffer);            // buffers and memory are device children:
    destroyBuffer(app, app.vertexBuffer);           // gone before the device
    vkDestroyFence(app.device, app.inFlight, nullptr);
    // ... semaphores, command pool, pipeline, swapchain, device, instance as before ...
}`}</CodeBlock>
      <VulkanObjectsFigure t={t} initial="buffer" />

      <H2>{tx(t, "vkBuf_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "vkBuf_tMistake", "Mistake"), tx(t, "vkBuf_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "vkBuf_e1", "Allocating the size you asked for instead of req.size"), tx(t, "vkBuf_e1b", "the layer reports the memory is too small for the buffer. Always allocate the requirement's size.")],
          [tx(t, "vkBuf_e2", "(flags & want) != 0 in findMemoryType"), tx(t, "vkBuf_e2b", "picks a type with only some of the wanted flags, for example without HOST_COHERENT, and writes silently stay in the CPU cache. Test (flags & want) == want.")],
          [tx(t, "vkBuf_e3", "Ignoring memoryTypeBits"), tx(t, "vkBuf_e3b", "binding fails with a validation error, or works on one GPU and not on another. Only types whose bit is set are allowed.")],
          [tx(t, "vkBuf_e4", "Missing a usage bit"), tx(t, "vkBuf_e4b", "binding a buffer as vertex buffer without VERTEX_BUFFER_BIT is an error, even if it \"works\". List every use at creation.")],
          [tx(t, "vkBuf_e5", "Stride or offsets that do not match the struct"), tx(t, "vkBuf_e5b", "garbled geometry. Use sizeof and offsetof, never hand-counted numbers.")],
          [tx(t, "vkBuf_e6", "Index type that does not match the data"), tx(t, "vkBuf_e6b", "UINT32 read from uint16_t data pairs two indices into one huge number: wild triangles or a device lost. Match VK_INDEX_TYPE to the array.")],
          [tx(t, "vkBuf_e7", "One vkAllocateMemory per resource in a real engine"), tx(t, "vkBuf_e7b", "slow loading, then VK_ERROR_TOO_MANY_OBJECTS past maxMemoryAllocationCount. Sub-allocate, or use VMA.")],
          [tx(t, "vkBuf_e8", "Writing a mapped buffer the GPU is reading this frame"), tx(t, "vkBuf_e8b", "flickering or torn data. Write only after the fence says the GPU is done with it, or keep one copy per frame in flight.")],
        ]}
      />

      <KeyIdeas t={t} id="vkBuf" items={[
        "A VkBuffer describes bytes (size, usage); a VkDeviceMemory holds them; vkBindBufferMemory joins the two at an offset.",
        "Memory heaps are physical pools; memory types are ways of using a heap, each with property flags.",
        "DEVICE_LOCAL is fastest for the GPU; HOST_VISIBLE can be mapped; HOST_COHERENT needs no flush; HOST_CACHED is fast to read back.",
        "Pick the first type whose bit is set in memoryTypeBits and whose flags contain all wanted flags: (flags & want) == want.",
        "Allocate req.size, not the size you asked for, and respect req.alignment when sharing a block.",
        "Map once and keep the pointer (persistent mapping); never write bytes the GPU is reading.",
        "alignUp(o, a) = (o + a − 1) & ~(a − 1); engines sub-allocate large blocks instead of one allocation per resource (VMA).",
        "The vertex input state gives a binding (stride, rate) and attributes (location, format, offset).",
        "Indexed drawing shares vertices between triangles and lets the GPU reuse shaded vertices.",
      ]} />
    </Article>
  );
}
