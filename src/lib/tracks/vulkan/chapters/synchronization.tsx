"use client";

// Presentation 4: synchronization and the first triangle — why nothing waits
// unless told; fences, binary semaphores and barriers; creating them (fence
// born signalled, one renderFinished semaphore per swapchain image); the
// frame loop (wait, acquire, reset, record, submit2, present) with the
// FrameSync figure; why the acquire wait sits at COLOR_ATTACHMENT_OUTPUT;
// OUT_OF_DATE/SUBOPTIMAL and minimising; barriers in depth (execution vs
// memory dependency, available/visible, stage and access masks) with the
// Barrier figure, then the two swapchain transitions justified; one frame in
// flight, worked; shutdown; common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { FrameSyncFigure } from "@/components/lesson/figures/vulkan/FrameSyncFigure";
import { BarrierFigure } from "@/components/lesson/figures/vulkan/BarrierFigure";
import { VulkanObjectsFigure } from "@/components/lesson/figures/vulkan/VulkanObjectsFigure";

const r = String.raw;

export function SynchronizationContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "vkSync_intro",
          "Three things run at the same time in a Vulkan program: the CPU, the GPU, and the presentation engine that owns the screen. vkQueueSubmit2 returns as soon as the work is queued, long before the GPU runs it; vkAcquireNextImageKHR can return an image index before that image has left the screen; the GPU overlaps one command with the next whenever it can. OpenGL's driver inserted waits for you, conservatively, everywhere. Vulkan inserts none. This chapter introduces the three tools that say \"wait\" (fences, semaphores and barriers), writes the frame loop with them, and puts the first triangle on screen.")}
      </Lead>

      <Goals t={t} id="vkSync" items={[
        "Choose between a fence, a semaphore and a barrier for an ordering problem.",
        "Write a frame loop that waits, acquires, records, submits and presents in the right order.",
        "Write a pipeline barrier with the right stages and access masks.",
      ]} />

      <H2>{tx(t, "vkSync_toolsTitle", "Three tools, three directions")}</H2>
      <LessonTable
        headers={[tx(t, "vkSync_tTool", "Tool"), tx(t, "vkSync_tWho", "Who waits for whom"), tx(t, "vkSync_tHow", "How it is used")]}
        rows={[
          ["VkFence", tx(t, "vkSync_t1", "the CPU waits for the GPU"), tx(t, "vkSync_t1b", "passed to a submit; the GPU signals it when all that submission's work is done. The CPU waits with vkWaitForFences and must reset it with vkResetFences before reusing it.")],
          [tx(t, "vkSync_t2a", "VkSemaphore (binary)"), tx(t, "vkSync_t2", "one queue operation waits for another, on the GPU side"), tx(t, "vkSync_t2b", "signalled by one operation (an acquire, a submit) and waited on by a later one (a submit, a present). The wait also unsignals it. The CPU never sees it.")],
          [tx(t, "vkSync_t3a", "Pipeline barrier"), tx(t, "vkSync_t3", "later commands wait for earlier ones in the same queue"), tx(t, "vkSync_t3b", "recorded into a command buffer with vkCmdPipelineBarrier2; also performs image layout transitions.")],
        ]}
      />
      <p>
        {tx(t, "vkSync_toolsBody",
          "A frame needs all three. The acquire tells us an image index, but the image may still be on screen: a semaphore (imageAvailable) makes the rendering wait until the presentation engine really lets it go. The present must not start before rendering finishes: a second semaphore (renderFinished). And before recording into the command buffer again, the CPU must know the GPU is done with it: a fence (inFlight). Inside the command buffer, barriers order the layout transitions against the drawing.")}
      </p>

      <H2>{tx(t, "vkSync_createTitle", "Creating the objects")}</H2>
      <CodeBlock lang="cpp" filename="sync.cpp" t={t}>{`// App gains: VkSemaphore imageAvailable; std::vector<VkSemaphore> renderFinished;
//            VkFence inFlight;
void createRenderFinished(App& app) {                 // one per swapchain image
    VkSemaphoreCreateInfo info{};
    info.sType = VK_STRUCTURE_TYPE_SEMAPHORE_CREATE_INFO;
    app.renderFinished.resize(app.swapImages.size());
    for (VkSemaphore& s : app.renderFinished)
        VK_CHECK(vkCreateSemaphore(app.device, &info, nullptr, &s));
}

void createSync(App& app) {
    VkSemaphoreCreateInfo sem{};
    sem.sType = VK_STRUCTURE_TYPE_SEMAPHORE_CREATE_INFO;
    VK_CHECK(vkCreateSemaphore(app.device, &sem, nullptr, &app.imageAvailable));
    createRenderFinished(app);

    VkFenceCreateInfo fence{};
    fence.sType = VK_STRUCTURE_TYPE_FENCE_CREATE_INFO;
    fence.flags = VK_FENCE_CREATE_SIGNALED_BIT;       // the first frame has nothing to wait for
    VK_CHECK(vkCreateFence(app.device, &fence, nullptr, &app.inFlight));
}`}</CodeBlock>
      <p>
        {tx(t, "vkSync_createBody",
          "Two details. The fence is created already signalled: the frame loop starts by waiting for the previous frame's fence, and on the very first frame there is no previous frame, so an unsignalled fence would make it wait forever. And renderFinished has one semaphore per swapchain image, not one in total. vkQueuePresentKHR gives no signal when it has consumed its wait semaphore, so a single semaphore could be signalled again by the next submit while the presentation engine still holds the previous signal, which the validation layer reports. An image cannot be acquired again until its previous present is finished, so a semaphore indexed by the image is always free when we use it. imageAvailable does not have this problem, because the fence wait at the start of the next frame guarantees the submit that waited on it has run.")}
      </p>

      <H2>{tx(t, "vkSync_loopTitle", "The frame loop")}</H2>
      <CodeBlock lang="cpp" filename="sync.cpp" t={t}>{`void drawFrame(App& app) {
    // 1. Wait until the GPU has finished the previous frame, so app.cmd is free again
    VK_CHECK(vkWaitForFences(app.device, 1, &app.inFlight, VK_TRUE, UINT64_MAX));

    // 2. Ask for an image; imageAvailable is signalled when it has really left the screen
    uint32_t imageIndex = 0;
    VkResult res = vkAcquireNextImageKHR(app.device, app.swapchain, UINT64_MAX,
                                         app.imageAvailable, VK_NULL_HANDLE, &imageIndex);
    if (res == VK_ERROR_OUT_OF_DATE_KHR) { recreateSwapchain(app); return; }
    if (res != VK_SUCCESS && res != VK_SUBOPTIMAL_KHR) VK_CHECK(res);

    VK_CHECK(vkResetFences(app.device, 1, &app.inFlight));   // only now that we will submit

    // 3. Record (previous chapter)
    recordFrame(app, app.cmd, imageIndex);

    // 4. Submit: wait for the image before writing colour, signal when everything is done
    VkSemaphoreSubmitInfo wait{};
    wait.sType     = VK_STRUCTURE_TYPE_SEMAPHORE_SUBMIT_INFO;
    wait.semaphore = app.imageAvailable;
    wait.stageMask = VK_PIPELINE_STAGE_2_COLOR_ATTACHMENT_OUTPUT_BIT;

    VkSemaphoreSubmitInfo signal{};
    signal.sType     = VK_STRUCTURE_TYPE_SEMAPHORE_SUBMIT_INFO;
    signal.semaphore = app.renderFinished[imageIndex];
    signal.stageMask = VK_PIPELINE_STAGE_2_ALL_COMMANDS_BIT;   // after all of it, transitions included

    VkCommandBufferSubmitInfo cmdInfo{};
    cmdInfo.sType         = VK_STRUCTURE_TYPE_COMMAND_BUFFER_SUBMIT_INFO;
    cmdInfo.commandBuffer = app.cmd;

    VkSubmitInfo2 submit{};
    submit.sType                    = VK_STRUCTURE_TYPE_SUBMIT_INFO_2;
    submit.waitSemaphoreInfoCount   = 1;
    submit.pWaitSemaphoreInfos      = &wait;
    submit.commandBufferInfoCount   = 1;
    submit.pCommandBufferInfos      = &cmdInfo;
    submit.signalSemaphoreInfoCount = 1;
    submit.pSignalSemaphoreInfos    = &signal;
    VK_CHECK(vkQueueSubmit2(app.graphicsQueue, 1, &submit, app.inFlight));   // fence signals at the end

    // 5. Present once renderFinished is signalled
    VkPresentInfoKHR present{};
    present.sType              = VK_STRUCTURE_TYPE_PRESENT_INFO_KHR;
    present.waitSemaphoreCount = 1;
    present.pWaitSemaphores    = &app.renderFinished[imageIndex];
    present.swapchainCount     = 1;
    present.pSwapchains        = &app.swapchain;
    present.pImageIndices      = &imageIndex;
    res = vkQueuePresentKHR(app.presentQueue, &present);
    if (res == VK_ERROR_OUT_OF_DATE_KHR || res == VK_SUBOPTIMAL_KHR || app.resized) {
        app.resized = false;
        recreateSwapchain(app);
    } else {
        VK_CHECK(res);
    }
}`}</CodeBlock>
      <FrameSyncFigure t={t} />

      <H3>{tx(t, "vkSync_stepsTitle", "Why each step is where it is")}</H3>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "vkSync_s1", "The fence wait comes first because the next thing we do, recording, rewrites app.cmd. UINT64_MAX is the timeout in nanoseconds: wait as long as it takes. VK_TRUE means \"all of the fences\", which is irrelevant with one.")}</li>
        <li>{tx(t, "vkSync_s2", "Acquire returns an index quickly, often before the image is free; the semaphore carries the \"really free\" moment to the GPU. OUT_OF_DATE means this swapchain can no longer present: rebuild and skip the frame. SUBOPTIMAL still delivered an image and signals the semaphore, so we draw this frame and rebuild after presenting.")}</li>
        <li>{tx(t, "vkSync_s3", "The fence is reset only after a successful acquire. Resetting it before an early return would leave it unsignalled with no submit coming to signal it, and the next frame's wait would never return: a deadlock on every resize.")}</li>
        <li>{tx(t, "vkSync_s4", "The submit waits on imageAvailable only at the COLOR_ATTACHMENT_OUTPUT stage. Everything before that stage (reading vertices, running the vertex shader) may start immediately; only writing pixels waits for the image. With TOP_OF_PIPE or ALL_COMMANDS there, the whole frame would wait, which is correct but slower.")}</li>
        <li>{tx(t, "vkSync_s5", "The present waits on renderFinished, which the submit signals after all its commands, including the final transition to PRESENT_SRC_KHR. The present queue may be a different queue from the graphics one; the semaphore works across queues.")}</li>
      </ol>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`// init: createInstance → createSurface → pickGpu → createDevice → createSwapchain
//       → createPipeline → createCommands → createSync
bool running = true;
while (running) {
    SDL_Event e;
    while (SDL_PollEvent(&e)) {
        if (e.type == SDL_EVENT_QUIT) running = false;
        if (e.type == SDL_EVENT_WINDOW_PIXEL_SIZE_CHANGED) app.resized = true;
    }
    if (SDL_GetWindowFlags(app.window) & SDL_WINDOW_MINIMIZED) {   // 0 × 0: nothing to draw into
        SDL_WaitEvent(nullptr);                                     // sleep until something happens
        continue;
    }
    drawFrame(app);
}
destroy(app);

// recreateSwapchain (swapchain chapter) gains, after createSwapchain(app):
//     for (VkSemaphore s : app.renderFinished) vkDestroySemaphore(app.device, s, nullptr);
//     createRenderFinished(app);               // the image count may have changed`}</CodeBlock>
      <Callout type="tip" t={t}>
        {tx(t, "vkSync_triangle", "Build and run: a dark blue window with a triangle whose corners are red, green and blue, blended smoothly across its surface by the rasterizer's interpolation of vColor. Resize the window; the triangle keeps its place relative to the window, because its coordinates are in NDC and the viewport follows the extent. If the validation layer is silent while you resize, minimise and close, the whole chain from instance to present is correct.")}
      </Callout>

      <H2>{tx(t, "vkSync_barrierTitle", "Barriers in depth")}</H2>
      <p>
        {tx(t, "vkSync_barrierBody",
          "Commands in one queue start in the order they were recorded, but nothing says the previous one has finished when the next begins: the GPU overlaps them to keep its units busy. When a later command reads what an earlier one wrote, a barrier has to say so. A barrier creates two kinds of dependency, and both are needed.")}
      </p>
      <H3>{tx(t, "vkSync_execTitle", "Execution dependency: the stage masks")}</H3>
      <p>
        {tx(t, "vkSync_execBody",
          "Each command passes through pipeline stages. srcStageMask names stages of the commands before the barrier, dstStageMask stages of the commands after it: the named later stages may not start until the named earlier stages have finished. The rest keeps overlapping, so a precise pair of stages costs less than a broad one. The stages a draw goes through, in order:")}
      </p>
      <LessonTable
        headers={[tx(t, "vkSync_tStage", "Stage (VK_PIPELINE_STAGE_2_…)"), tx(t, "vkSync_tStageWhat", "What happens there")]}
        rows={[
          ["DRAW_INDIRECT", tx(t, "vkSync_st1", "reading the arguments of indirect draws from a buffer")],
          ["VERTEX_ATTRIBUTE_INPUT", tx(t, "vkSync_st2", "fetching vertex attributes from vertex buffers (INDEX_INPUT for index buffers)")],
          ["VERTEX_SHADER", tx(t, "vkSync_st3", "running the vertex shader")],
          ["EARLY_FRAGMENT_TESTS", tx(t, "vkSync_st4", "depth and stencil tests before the fragment shader")],
          ["FRAGMENT_SHADER", tx(t, "vkSync_st5", "running the fragment shader, including its texture reads")],
          ["LATE_FRAGMENT_TESTS", tx(t, "vkSync_st6", "depth and stencil tests after the fragment shader, and the depth writes")],
          ["COLOR_ATTACHMENT_OUTPUT", tx(t, "vkSync_st7", "blending and writing colour attachments; also loadOp/storeOp for colour")],
          ["COMPUTE_SHADER / COPY / BLIT…", tx(t, "vkSync_st8", "non-graphics work: dispatches and transfer commands, each with its own stage")],
          ["NONE / ALL_COMMANDS", tx(t, "vkSync_st9", "no stage at all, or every stage: the two extremes")],
        ]}
      />
      <H3>{tx(t, "vkSync_memTitle", "Memory dependency: the access masks")}</H3>
      <p>
        {tx(t, "vkSync_memBody",
          "Finishing is not the same as being visible. GPUs have caches at many levels, and a write can sit in the cache of the unit that made it after the command has finished. Two steps are needed: the write is made available (flushed from the writer's cache to memory that everything shares), then made visible to the reader (the reader's cache is invalidated so it fetches the new data). srcAccessMask names the kinds of writes to make available, and dstAccessMask the kinds of reads to make them visible to. Access masks only mean something together with their stages: COLOR_ATTACHMENT_WRITE belongs to COLOR_ATTACHMENT_OUTPUT, SHADER_SAMPLED_READ to the shader stages, TRANSFER_WRITE to COPY.")}
      </p>
      <BarrierFigure t={t} />
      <p>
        {tx(t, "vkSync_barrierAfter",
          "A missing access mask is the most treacherous bug in Vulkan. On a desktop GPU with coherent caches it often works, because the data happens to reach memory in time; on another GPU, or with another driver version, the reader sees old data one frame in a thousand. The validation layer's synchronization checker (enable VK_VALIDATION_FEATURE_ENABLE_SYNCHRONIZATION_VALIDATION_EXT, or tick it in vkconfig) finds these hazards by tracking every access.")}
      </p>

      <H3>{tx(t, "vkSync_twoTitle", "The two swapchain transitions, justified")}</H3>
      <p>
        {tx(t, "vkSync_two1",
          "UNDEFINED → COLOR_ATTACHMENT_OPTIMAL, at the start of the frame: srcStage COLOR_ATTACHMENT_OUTPUT with srcAccess NONE, dstStage COLOR_ATTACHMENT_OUTPUT with dstAccess COLOR_ATTACHMENT_WRITE. The source side has no writes to flush (the old contents are discarded), so its access is NONE. Its stage is chosen to match the semaphore wait: the submit's wait blocks COLOR_ATTACHMENT_OUTPUT until the image is available, and a barrier whose source stage is that same stage continues the chain. So the layout transition happens after the image left the screen, and the drawing's colour writes happen after the transition. With srcStage NONE the transition could run before the semaphore wait, while the image is still being displayed.")}
      </p>
      <p>
        {tx(t, "vkSync_two2",
          "COLOR_ATTACHMENT_OPTIMAL → PRESENT_SRC_KHR, at the end: srcStage COLOR_ATTACHMENT_OUTPUT with srcAccess COLOR_ATTACHMENT_WRITE, because the drawing's colour writes must be finished and made available before the layout changes. The destination is NONE with no access: nothing later in this queue uses the image. The presentation engine is outside the queue; the renderFinished semaphore (signalled after ALL_COMMANDS) orders it, and a semaphore signal also makes all prior writes available to whoever waits on it.")}
      </p>

      <H2>{tx(t, "vkSync_workedTitle", "Worked example: one frame in flight")}</H2>
      <p>
        {tx(t, "vkSync_worked1",
          "This loop has one command buffer and one fence, so the CPU waits for the GPU at the start of every frame, and the GPU waits for the CPU while it records. Suppose recording and submitting take the CPU 4 ms and the GPU needs 10 ms for the frame:")}
      </p>
      <Equation label={tx(t, "vkSync_eqFrame", "Frame time, serial versus overlapped")}
        where={[
          [r`t_{cpu}`, tx(t, "vkSync_wCpu", "CPU time per frame: waiting excluded, recording and submitting included (here 4 ms)")],
          [r`t_{gpu}`, tx(t, "vkSync_wGpu", "GPU time per frame (here 10 ms)")],
        ]}
        note={tx(t, "vkSync_eqFrameNote", "Serial: 4 + 10 = 14 ms, about 71 frames per second. Overlapped, where the CPU records frame N+1 while the GPU draws frame N: max(4, 10) = 10 ms, 100 frames per second, from the same hardware.")}>
        {r`T_{serial} = t_{cpu} + t_{gpu} \qquad T_{overlap} = \max(t_{cpu},\, t_{gpu})`}
      </Equation>
      <p>
        {tx(t, "vkSync_worked2",
          "Overlapping needs a second set of per-frame objects (command buffer, fence, imageAvailable semaphore), so the CPU can record into one while the GPU runs the other: two frames in flight. That, and resizing without vkDeviceWaitIdle, is the subject of the Frames in Flight chapter. Under FIFO at 60 Hz the difference is hidden while both times are under 16.7 ms, since vsync caps the rate anyway; it matters as soon as a frame is heavy or vsync is off.")}
      </p>

      <H2>{tx(t, "vkSync_shutdownTitle", "Shutdown, updated")}</H2>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`void destroy(App& app) {
    vkDeviceWaitIdle(app.device);                  // the GPU and the presentation engine are done
    vkDestroyFence(app.device, app.inFlight, nullptr);
    for (VkSemaphore s : app.renderFinished) vkDestroySemaphore(app.device, s, nullptr);
    vkDestroySemaphore(app.device, app.imageAvailable, nullptr);
    vkDestroyCommandPool(app.device, app.commandPool, nullptr);   // frees app.cmd too
    vkDestroyPipeline(app.device, app.pipeline, nullptr);
    vkDestroyPipelineLayout(app.device, app.pipelineLayout, nullptr);
    destroySwapchainViews(app);
    vkDestroySwapchainKHR(app.device, app.swapchain, nullptr);
    vkDestroyDevice(app.device, nullptr);
    // ... surface, messenger, instance, window, SDL_Quit() as before ...
}`}</CodeBlock>
      <VulkanObjectsFigure t={t} initial="sem" />

      <H2>{tx(t, "vkSync_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "vkSync_tMistake", "Mistake"), tx(t, "vkSync_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "vkSync_e1", "Creating the fence unsignalled"), tx(t, "vkSync_e1b", "the first vkWaitForFences never returns. Create it with SIGNALED_BIT.")],
          [tx(t, "vkSync_e2", "Resetting the fence before the acquire can return early"), tx(t, "vkSync_e2b", "a deadlock on the first OUT_OF_DATE. Reset right before the submit.")],
          [tx(t, "vkSync_e3", "One renderFinished semaphore for all images"), tx(t, "vkSync_e3b", "the layer reports a semaphore signalled while the swapchain may still use it. One per swapchain image.")],
          [tx(t, "vkSync_e4", "Waiting for imageAvailable at TOP_OF_PIPE"), tx(t, "vkSync_e4b", "correct, but the vertex work can no longer start early. COLOR_ATTACHMENT_OUTPUT is enough.")],
          [tx(t, "vkSync_e5", "srcStage NONE on the first transition"), tx(t, "vkSync_e5b", "the transition is not chained to the semaphore wait and may change the image while it is on screen. Use the stage the semaphore waits at.")],
          [tx(t, "vkSync_e6", "Access masks left at NONE"), tx(t, "vkSync_e6b", "works on your GPU, stale data on someone else's. Name the write and the read; run synchronization validation.")],
          [tx(t, "vkSync_e7", "vkDeviceWaitIdle every frame to be safe"), tx(t, "vkSync_e7b", "correct and slow: CPU and GPU never overlap. Use it only for shutdown and (for now) recreation.")],
          [tx(t, "vkSync_e8", "Destroying objects without waiting at shutdown"), tx(t, "vkSync_e8b", "errors about objects in use by a command buffer or the swapchain. vkDeviceWaitIdle first.")],
        ]}
      />

      <KeyIdeas t={t} id="vkSync" items={[
        "Nothing in Vulkan waits unless told: submits return immediately, commands overlap, and acquire returns before the image is free.",
        "Fences let the CPU wait for the GPU; binary semaphores order queue operations on the GPU; barriers order commands inside a queue.",
        "The frame loop is: wait fence, acquire (signals imageAvailable), reset fence, record, submit (waits imageAvailable, signals renderFinished and the fence), present (waits renderFinished).",
        "The fence starts signalled, and is reset only once a submit is certain.",
        "Use one renderFinished semaphore per swapchain image.",
        "Wait for the acquired image at COLOR_ATTACHMENT_OUTPUT, and give the first transition that same source stage so it chains after the wait.",
        "A barrier needs both an execution dependency (stage masks) and a memory dependency (access masks: make writes available, then visible).",
        "Precise stage masks keep the GPU overlapped; ALL_COMMANDS is correct but stalls more.",
        "One frame in flight costs t_cpu + t_gpu per frame; overlapping frames brings it down to max(t_cpu, t_gpu).",
      ]} />
    </Article>
  );
}
