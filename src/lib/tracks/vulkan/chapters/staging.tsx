"use client";

// Resources 2: staging — why HOST_VISIBLE vertices are slow on a discrete
// card (PCIe versus VRAM bandwidth), worked with the UploadCost figure; the
// staging pattern; a one-time command buffer (transient pool, fence);
// vkCmdCopyBuffer2 and the buffer barrier that makes the copy visible to
// vertex input; createDeviceBuffer; the StagingSteps "break it" figure;
// batching uploads; when to skip staging (integrated GPUs, ReBAR);
// dedicated transfer queues and queue family ownership transfers; mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { UploadCostFigure } from "@/components/lesson/figures/vulkan/UploadCostFigure";
import { StagingStepsFigure } from "@/components/lesson/figures/vulkan/StagingStepsFigure";

const r = String.raw;

export function StagingContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "vkStg_intro",
          "The quad's buffers live in memory the CPU can write. On a discrete graphics card that memory is system RAM, on the other side of the PCIe bus, and the GPU fetches every vertex across that bus on every draw. The GPU's own memory, DEVICE_LOCAL, is many times faster, but the CPU cannot write it directly. The standard answer is a staging buffer: the CPU writes into a CPU-visible buffer, and the GPU copies it into device-local memory with a transfer command. This chapter measures why that is worth it, writes the upload path, and shows each step failing when it is left out.")}
      </Lead>

      <H2>{tx(t, "vkStg_whyTitle", "Where the bytes travel")}</H2>
      <p>
        {tx(t, "vkStg_whyBody",
          "A graphics card's VRAM is wired to its GPU with a very wide, very fast bus. The PCIe link between the card and the rest of the computer is an order of magnitude slower. Typical figures for a mid-range card:")}
      </p>
      <LessonTable
        headers={[tx(t, "vkStg_tPath", "Path"), tx(t, "vkStg_tBw", "Bandwidth, roughly"), tx(t, "vkStg_tWhen", "Used when")]}
        rows={[
          [tx(t, "vkStg_b1", "GPU ↔ its VRAM"), "400–1000 GB/s", tx(t, "vkStg_b1b", "the GPU reads a DEVICE_LOCAL buffer")],
          [tx(t, "vkStg_b2", "GPU ↔ system RAM over PCIe 4.0 ×16"), tx(t, "vkStg_b2v", "32 GB/s peak, about 25 in practice"), tx(t, "vkStg_b2b", "the GPU reads a HOST_VISIBLE buffer in system RAM, or copies from a staging buffer")],
          [tx(t, "vkStg_b3", "CPU memcpy within system RAM"), "10–20 GB/s", tx(t, "vkStg_b3b", "the CPU fills a mapped buffer")],
          [tx(t, "vkStg_b4", "integrated GPU ↔ shared RAM"), "50–100 GB/s", tx(t, "vkStg_b4b", "everything: there is only one memory")],
        ]}
      />
      <p>
        {tx(t, "vkStg_whyAfter",
          "Data that is read once, like a uniform buffer rewritten every frame, can stay in host-visible memory: it crosses the bus once either way. Data that is read many times, like a mesh drawn every frame (and often several times per frame, for shadows and the main pass), should cross the bus once and then be read from VRAM. The time to move a number of bytes over a link is simply:")}
      </p>
      <Equation label={tx(t, "vkStg_eqTime", "Transfer time")}
        where={[
          ["t", tx(t, "vkStg_wT", "the time the transfer takes, in seconds")],
          ["S", tx(t, "vkStg_wS", "the number of bytes moved")],
          ["B", tx(t, "vkStg_wB", "the link's bandwidth in bytes per second; for a sustained transfer the practical figure, not the peak")],
        ]}>
        {r`t = \frac{S}{B}`}
      </Equation>

      <H3>{tx(t, "vkStg_workedTitle", "Worked example: a 64 MiB mesh, drawn three times per frame")}</H3>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "vkStg_w1", "Size: 64 MiB = 64 · 1024 · 1024 = 67 108 864 bytes, about 67.1 MB (a mebibyte is 2²⁰ bytes, a megabyte 10⁶; bandwidths are quoted in decimal units).")}</li>
        <li>{tx(t, "vkStg_w2", "Left in system RAM, each pass reads it over PCIe at 25 GB/s: 67.1 · 10⁶ / 25 · 10⁹ ≈ 2.68 ms. Three passes: about 8.05 ms per frame, half of a 16.7 ms frame at 60 Hz, spent only on fetching vertices.")}</li>
        <li>{tx(t, "vkStg_w3", "In VRAM at 450 GB/s, each pass takes 67.1 · 10⁶ / 450 · 10⁹ ≈ 0.149 ms, so 0.45 ms for three.")}</li>
        <li>{tx(t, "vkStg_w4", "The one-time cost of staging: the CPU memcpy at 10 GB/s, 6.71 ms, plus the GPU copy over PCIe, 2.68 ms: about 9.4 ms, paid once at load time.")}</li>
        <li>{tx(t, "vkStg_w5", "Each frame saves 8.05 − 0.45 = 7.6 ms, so staging has paid for itself after 9.4 / 7.6 ≈ 1.2 frames. After ten seconds at 60 frames per second it has saved over 4.5 seconds of GPU time.")}</li>
      </ol>
      <UploadCostFigure t={t} />

      <H2>{tx(t, "vkStg_patternTitle", "The staging pattern")}</H2>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "vkStg_p1", "Create a staging buffer in HOST_VISIBLE | HOST_COHERENT memory with usage TRANSFER_SRC: it will only be copied from.")}</li>
        <li>{tx(t, "vkStg_p2", "memcpy the data into its mapped pointer.")}</li>
        <li>{tx(t, "vkStg_p3", "Create the real buffer in DEVICE_LOCAL memory with its real usage plus TRANSFER_DST: it will be copied into.")}</li>
        <li>{tx(t, "vkStg_p4", "Record a copy from one to the other, followed by a barrier that makes the copied bytes visible to the stage that will read them.")}</li>
        <li>{tx(t, "vkStg_p5", "Submit, wait for the copy to finish, and destroy the staging buffer.")}</li>
      </ol>

      <H3>{tx(t, "vkStg_immTitle", "A one-time command buffer")}</H3>
      <p>
        {tx(t, "vkStg_immBody",
          "The copy is a GPU command, so it needs a command buffer and a submit, outside the frame loop. We give uploads their own pool with the TRANSIENT flag (short-lived buffers), and a helper that records whatever it is given, submits it and waits on a fence. Waiting on the CPU is acceptable at load time; streaming data during gameplay would instead signal a semaphore or timeline value and keep going.")}
      </p>
      <CodeBlock lang="cpp" filename="upload.cpp" t={t}>{`// App gains: VkCommandPool uploadPool;   (created next to commandPool)
//   poolInfo.flags = VK_COMMAND_POOL_CREATE_TRANSIENT_BIT;
//   poolInfo.queueFamilyIndex = app.families.graphics;
template <class Record>
void immediateSubmit(App& app, Record&& record) {
    VkCommandBufferAllocateInfo alloc{};
    alloc.sType              = VK_STRUCTURE_TYPE_COMMAND_BUFFER_ALLOCATE_INFO;
    alloc.commandPool        = app.uploadPool;
    alloc.level              = VK_COMMAND_BUFFER_LEVEL_PRIMARY;
    alloc.commandBufferCount = 1;
    VkCommandBuffer cmd;
    VK_CHECK(vkAllocateCommandBuffers(app.device, &alloc, &cmd));

    VkCommandBufferBeginInfo begin{};
    begin.sType = VK_STRUCTURE_TYPE_COMMAND_BUFFER_BEGIN_INFO;
    begin.flags = VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT;
    VK_CHECK(vkBeginCommandBuffer(cmd, &begin));
    record(cmd);                                          // the caller's commands
    VK_CHECK(vkEndCommandBuffer(cmd));

    VkFenceCreateInfo fenceInfo{};
    fenceInfo.sType = VK_STRUCTURE_TYPE_FENCE_CREATE_INFO;   // unsignalled: we wait for this submit
    VkFence fence;
    VK_CHECK(vkCreateFence(app.device, &fenceInfo, nullptr, &fence));

    VkCommandBufferSubmitInfo cmdInfo{};
    cmdInfo.sType         = VK_STRUCTURE_TYPE_COMMAND_BUFFER_SUBMIT_INFO;
    cmdInfo.commandBuffer = cmd;
    VkSubmitInfo2 submit{};
    submit.sType                  = VK_STRUCTURE_TYPE_SUBMIT_INFO_2;
    submit.commandBufferInfoCount = 1;
    submit.pCommandBufferInfos    = &cmdInfo;
    VK_CHECK(vkQueueSubmit2(app.graphicsQueue, 1, &submit, fence));
    VK_CHECK(vkWaitForFences(app.device, 1, &fence, VK_TRUE, UINT64_MAX));

    vkDestroyFence(app.device, fence, nullptr);
    vkFreeCommandBuffers(app.device, app.uploadPool, 1, &cmd);
}`}</CodeBlock>

      <H3>{tx(t, "vkStg_copyTitle", "The copy and its barrier")}</H3>
      <CodeBlock lang="cpp" filename="upload.cpp" t={t}>{`Buffer createDeviceBuffer(App& app, const void* data, VkDeviceSize size, VkBufferUsageFlags usage,
                          VkPipelineStageFlags2 readStage, VkAccessFlags2 readAccess) {
    // 1-2. CPU-visible staging buffer, filled through its mapped pointer
    Buffer staging = createBuffer(app, size, VK_BUFFER_USAGE_TRANSFER_SRC_BIT,
        VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT | VK_MEMORY_PROPERTY_HOST_COHERENT_BIT);
    std::memcpy(staging.mapped, data, size);

    // 3. The real buffer, in VRAM
    Buffer gpu = createBuffer(app, size, usage | VK_BUFFER_USAGE_TRANSFER_DST_BIT,
                              VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT);

    // 4-5. Copy, make the result visible to its reader, wait
    immediateSubmit(app, [&](VkCommandBuffer cmd) {
        VkBufferCopy2 region{};
        region.sType     = VK_STRUCTURE_TYPE_BUFFER_COPY_2;
        region.srcOffset = 0;
        region.dstOffset = 0;
        region.size      = size;
        VkCopyBufferInfo2 copy{};
        copy.sType       = VK_STRUCTURE_TYPE_COPY_BUFFER_INFO_2;
        copy.srcBuffer   = staging.buffer;
        copy.dstBuffer   = gpu.buffer;
        copy.regionCount = 1;
        copy.pRegions    = &region;
        vkCmdCopyBuffer2(cmd, &copy);

        VkBufferMemoryBarrier2 barrier{};
        barrier.sType         = VK_STRUCTURE_TYPE_BUFFER_MEMORY_BARRIER_2;
        barrier.srcStageMask  = VK_PIPELINE_STAGE_2_COPY_BIT;          // after the copy has written...
        barrier.srcAccessMask = VK_ACCESS_2_TRANSFER_WRITE_BIT;
        barrier.dstStageMask  = readStage;                             // ...before the reader reads
        barrier.dstAccessMask = readAccess;
        barrier.srcQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED;
        barrier.dstQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED;
        barrier.buffer        = gpu.buffer;
        barrier.offset        = 0;
        barrier.size          = VK_WHOLE_SIZE;
        VkDependencyInfo dep{};
        dep.sType                    = VK_STRUCTURE_TYPE_DEPENDENCY_INFO;
        dep.bufferMemoryBarrierCount = 1;
        dep.pBufferMemoryBarriers    = &barrier;
        vkCmdPipelineBarrier2(cmd, &dep);
    });

    destroyBuffer(app, staging);                          // safe: the fence said the copy is done
    return gpu;
}`}</CodeBlock>
      <p>
        {tx(t, "vkStg_barrierBody",
          "The barrier deserves a second look, because the fence seems to make it unnecessary. The fence tells the CPU that the copy has finished executing. It does not make the copied bytes visible to the vertex-fetch hardware of a later command buffer: that is a memory dependency, and only a barrier (or a semaphore) creates one on the GPU side. A pipeline barrier applies to everything later in submission order on the same queue, including command buffers submitted afterwards, so recording it right after the copy covers every future draw that reads the buffer. The masks follow the Barriers chapter: COPY with TRANSFER_WRITE on the source side; on the destination side the stage and access that will read the buffer, which is why the function takes them as parameters.")}
      </p>
      <LessonTable
        headers={[tx(t, "vkStg_tBuf", "Buffer"), tx(t, "vkStg_tStage", "readStage"), tx(t, "vkStg_tAccess", "readAccess")]}
        rows={[
          [tx(t, "vkStg_r1", "vertex buffer"), "VERTEX_ATTRIBUTE_INPUT", "VERTEX_ATTRIBUTE_READ"],
          [tx(t, "vkStg_r2", "index buffer"), "INDEX_INPUT", "INDEX_READ"],
          [tx(t, "vkStg_r3", "uniform buffer read in the vertex shader"), "VERTEX_SHADER", "UNIFORM_READ"],
          [tx(t, "vkStg_r4", "storage buffer read by a compute shader"), "COMPUTE_SHADER", "SHADER_STORAGE_READ"],
        ]}
      />
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`void createMesh(App& app) {                  // now in VRAM
    app.vertexBuffer = createDeviceBuffer(app, kVertices, sizeof(kVertices),
        VK_BUFFER_USAGE_VERTEX_BUFFER_BIT,
        VK_PIPELINE_STAGE_2_VERTEX_ATTRIBUTE_INPUT_BIT, VK_ACCESS_2_VERTEX_ATTRIBUTE_READ_BIT);
    app.indexBuffer = createDeviceBuffer(app, kIndices, sizeof(kIndices),
        VK_BUFFER_USAGE_INDEX_BUFFER_BIT,
        VK_PIPELINE_STAGE_2_INDEX_INPUT_BIT, VK_ACCESS_2_INDEX_READ_BIT);
}
// destroy(): vkDestroyCommandPool(app.device, app.uploadPool, nullptr); next to the other pool`}</CodeBlock>
      <StagingStepsFigure t={t} />
      <Callout type="tip" t={t}>
        {tx(t, "vkStg_run", "Build and run: the same quad as before, which is the point. Nothing visible changes; the vertices are now fetched from VRAM. Turn on synchronization validation (vkconfig) once: if the barrier is correct it stays silent, and if you delete the barrier it reports a read-after-write hazard between the copy and the vertex input.")}
      </Callout>

      <H2>{tx(t, "vkStg_batchTitle", "Batching uploads")}</H2>
      <p>
        {tx(t, "vkStg_batchBody",
          "createDeviceBuffer does one submit and one CPU wait per buffer. For two buffers that is fine; for a level with thousands of meshes and textures, the waits dominate the loading time. A loader instead allocates one large staging buffer, copies every resource into it at increasing (aligned) offsets, records all the copies with their srcOffset into one command buffer, puts a single barrier at the end with the union of the destination stages, and submits once. vkCmdCopyBuffer2 takes an array of regions for exactly this reason. If the data is larger than the staging buffer, the loader fills it, submits, and refills it once the fence says the copies are done, or cycles between two staging buffers so the CPU fills one while the GPU copies the other.")}
      </p>

      <H2>{tx(t, "vkStg_skipTitle", "When staging is not needed")}</H2>
      <LessonTable
        headers={[tx(t, "vkStg_tCase", "Case"), tx(t, "vkStg_tDo", "What to do")]}
        rows={[
          [tx(t, "vkStg_c1", "Integrated GPU or phone (one memory)"), tx(t, "vkStg_c1b", "memory types are both DEVICE_LOCAL and HOST_VISIBLE: write straight into the final buffer. A staging copy would only move bytes within the same RAM. Check for such a type at start-up and skip the copy.")],
          [tx(t, "vkStg_c2", "Discrete GPU with Resizable BAR"), tx(t, "vkStg_c2b", "the CPU can map all of VRAM (a DEVICE_LOCAL | HOST_VISIBLE type on the VRAM heap). Writing sequentially through PCIe is about as fast as the staging copy, without the second buffer. Never read that memory from the CPU: uncached reads across PCIe are extremely slow.")],
          [tx(t, "vkStg_c3", "Data rewritten every frame (uniforms, particles)"), tx(t, "vkStg_c3b", "the GPU reads it about once, so keep it in host-visible memory, one copy per frame in flight, and skip the copy.")],
        ]}
      />

      <H2>{tx(t, "vkStg_queueTitle", "Dedicated transfer queues")}</H2>
      <p>
        {tx(t, "vkStg_queueBody",
          "Most discrete GPUs have a queue family with only TRANSFER_BIT, backed by DMA engines that copy while the graphics queue keeps drawing. Streaming engines upload through it. It adds two complications. The copy and the draw are on different queues, so a semaphore, not a barrier, orders them. And with sharingMode EXCLUSIVE, a buffer belongs to one queue family at a time: moving it from the transfer family to the graphics family is a queue family ownership transfer, a pair of identical buffer barriers, a release recorded on the transfer queue and an acquire on the graphics queue, with srcQueueFamilyIndex and dstQueueFamilyIndex set to the two families. Creating the buffer with CONCURRENT sharing avoids the transfer at a possible cost in speed. For loading at start-up, the graphics queue alone is simpler and fast enough, which is why this track uses it.")}
      </p>

      <H2>{tx(t, "vkStg_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "vkStg_tMistake", "Mistake"), tx(t, "vkStg_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "vkStg_e1", "Missing TRANSFER_DST on the device buffer (or TRANSFER_SRC on the staging one)"), tx(t, "vkStg_e1b", "the copy is a validation error. Add the transfer bits next to the real usage.")],
          [tx(t, "vkStg_e2", "Destroying the staging buffer before the copy has run"), tx(t, "vkStg_e2b", "the GPU copies from freed memory: garbage, or a device lost. Wait for the fence first.")],
          [tx(t, "vkStg_e3", "No barrier after the copy"), tx(t, "vkStg_e3b", "usually works on desktop, sometimes draws with stale or partial vertices. Record the barrier with the reader's stage and access.")],
          [tx(t, "vkStg_e4", "Reusing the frame's command buffer for uploads"), tx(t, "vkStg_e4b", "it may be pending, and a reset destroys the frame's recording. Uploads get their own buffer (and pool).")],
          [tx(t, "vkStg_e5", "One submit and wait per resource while loading a level"), tx(t, "vkStg_e5b", "correct but slow. Batch the copies into one command buffer and one submit.")],
          [tx(t, "vkStg_e6", "Reading back from DEVICE_LOCAL | HOST_VISIBLE memory"), tx(t, "vkStg_e6b", "uncached reads across PCIe crawl. Read back from a HOST_CACHED buffer that the GPU copied into.")],
          [tx(t, "vkStg_e7", "Forgetting the ownership transfer with a dedicated transfer queue"), tx(t, "vkStg_e7b", "undefined contents on the graphics queue with EXCLUSIVE sharing. Release on one family, acquire on the other, or use CONCURRENT.")],
        ]}
      />

      <KeyIdeas t={t} id="vkStg" items={[
        "On a discrete GPU, CPU-writable memory is usually system RAM across PCIe, an order of magnitude slower for the GPU than VRAM.",
        "Transfer time is t = S / B; data read many times belongs in DEVICE_LOCAL memory, data read once can stay host-visible.",
        "Staging: fill a HOST_VISIBLE buffer (TRANSFER_SRC), copy it on the GPU into a DEVICE_LOCAL buffer (usage + TRANSFER_DST).",
        "Uploads use their own transient command pool and a one-time command buffer, waited on with a fence at load time.",
        "A fence tells the CPU the copy finished; only a barrier makes the bytes visible to the GPU stage that reads them.",
        "The barrier after a copy is COPY / TRANSFER_WRITE → the reader's stage and access, and it covers later submissions on the same queue.",
        "Batch many copies into one command buffer and one submit when loading.",
        "Skip staging on integrated GPUs and with Resizable BAR; never read VRAM back through a mapping.",
        "A dedicated transfer queue needs a semaphore and, with EXCLUSIVE sharing, a queue family ownership transfer.",
      ]} />
    </Article>
  );
}
