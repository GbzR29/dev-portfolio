"use client";

// Going further 1: frames in flight — why one frame in flight makes the CPU
// and GPU take turns (T = c + g) and two overlap them (T = max(c, g)), with
// the latency cost of a third (FramesInFlight figure); which objects are
// duplicated per frame, per swapchain image or shared, and why; FrameData,
// per-frame pools, fences, semaphores, uniform buffers and descriptor sets;
// the new drawFrame and its two counters; resizing without vkDeviceWaitIdle
// by retiring the old swapchain (SwapchainRetire figure); shutdown; mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { FramesInFlightFigure } from "@/components/lesson/figures/vulkan/FramesInFlightFigure";
import { SwapchainRetireFigure } from "@/components/lesson/figures/vulkan/SwapchainRetireFigure";

const r = String.raw;

export function FramesInFlightContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "vkFif_intro",
          "Since the Synchronization chapter, drawFrame has started by waiting for the GPU to finish the previous frame. That wait keeps things simple and safe: there is one command buffer, one uniform buffer, one fence, and the CPU never touches them while the GPU uses them. It also means the CPU and the GPU take turns, each idle while the other works. This chapter gives every frame its own set of those objects so the CPU can record the next frame while the GPU draws the current one, and then removes the last vkDeviceWaitIdle from the render loop: the one in swapchain recreation.")}
      </Lead>

      <Goals t={t} id="vkFif" items={[
        "Explain why waiting for every frame leaves the CPU and the GPU idle.",
        "Choose how many frames to keep in flight.",
        "Duplicate exactly the resources each frame needs, and no more.",
        "Resize the window without stalling the whole GPU.",
      ]} />

      <H2>{tx(t, "vkFif_whyTitle", "Why one frame in flight is slow")}</H2>
      <p>
        {tx(t, "vkFif_whyBody",
          "A frame is \"in flight\" from the moment the CPU starts recording it until the GPU finishes executing it. With one frame in flight, the loop is: wait for frame k − 1 to finish on the GPU, record frame k, submit, and go round again. While the CPU records, the GPU has nothing queued and waits; while the GPU executes, the CPU waits on the fence. With two frames in flight, the CPU waits only for frame k − 2, which has usually finished long ago, so it records frame k while the GPU is still busy with frame k − 1.")}
      </p>
      <Equation label={tx(t, "vkFif_eqT", "Frame time with one and with N frames in flight (steady state, no vsync)")}
        where={[
          ["c", tx(t, "vkFif_wC", "CPU time to prepare one frame: game logic, updating buffers, recording the command buffer")],
          ["g", tx(t, "vkFif_wG", "GPU time to execute one frame's commands")],
          ["T", tx(t, "vkFif_wT", "the time between two finished frames; 1000 / T (in ms) is the frame rate")],
          ["N", tx(t, "vkFif_wN", "the number of frames allowed in flight: kFramesInFlight")],
        ]}>
        {r`T_1 = c + g, \qquad T_N = \max(c,\ g) \quad (N \ge 2)`}
      </Equation>
      <p>
        {tx(t, "vkFif_whyEx",
          "Worked example: c = 6 ms, g = 10 ms. With one frame in flight T = 16 ms, 62.5 frames per second, and the GPU is busy 10 / 16 = 62% of the time. With two, T = max(6, 10) = 10 ms, 100 frames per second, and the GPU is never idle. The GPU is now the bottleneck (the frame is \"GPU-bound\"); making the CPU faster would change nothing, making the GPU faster would.")}
      </p>
      <p>
        {tx(t, "vkFif_latBody",
          "Overlap has a price: latency, the time from reading input (when recording starts) to the frame being finished. When the GPU is the bottleneck, the CPU runs ahead until it has N frames queued, and each new frame waits behind the others:")}
      </p>
      <Equation label={tx(t, "vkFif_eqL", "Latency when the GPU is the bottleneck (g > c)")}
        where={[
          ["L", tx(t, "vkFif_wL", "time from the start of recording a frame to the end of its GPU work")],
          [r`N,\ g`, tx(t, "vkFif_wNg", "frames in flight and GPU time per frame, as above")],
        ]}>
        {r`L \approx N \cdot g`}
      </Equation>
      <p>
        {tx(t, "vkFif_latEx",
          "In the example, one frame in flight gives L = c + g = 16 ms, two give 20 ms at 100 fps, and three give 30 ms at the same 100 fps: the third frame buys nothing when the times are steady and adds 10 ms of lag. It helps only when the frame times jitter, absorbing an occasional slow CPU frame. Two is the usual choice, and what this track uses.")}
      </p>
      <FramesInFlightFigure t={t} />

      <H2>{tx(t, "vkFif_dupTitle", "What gets duplicated, and what does not")}</H2>
      <p>
        {tx(t, "vkFif_dupBody",
          "The rule: anything the CPU writes or resets while preparing a frame needs one copy per frame in flight, because the GPU may still be reading the previous copy. Anything only the GPU touches, or that never changes after loading, can stay single.")}
      </p>
      <LessonTable
        headers={[tx(t, "vkFif_tObj", "Object"), tx(t, "vkFif_tHow", "How many"), tx(t, "vkFif_tWhy", "Why")]}
        rows={[
          [tx(t, "vkFif_o1", "command pool + command buffer"), tx(t, "vkFif_n1", "per frame"), tx(t, "vkFif_o1b", "the CPU re-records it every frame; re-recording one the GPU is executing is an error.")],
          [tx(t, "vkFif_o2", "fence"), tx(t, "vkFif_n2", "per frame"), tx(t, "vkFif_o2b", "it tells the CPU when that frame's command buffer and uniform buffer are free again.")],
          ["imageAvailable", tx(t, "vkFif_n3", "per frame"), tx(t, "vkFif_o3b", "passed to vkAcquireNextImageKHR before the image index is known, so it cannot be per image; the one used two frames ago is known to be free after the fence wait.")],
          ["renderFinished", tx(t, "vkFif_n4", "per swapchain image"), tx(t, "vkFif_o4b", "waited on by the presentation engine, which gives no signal when it is done with it. It is safe to reuse only once the same image is acquired again, which is exactly when the per-image copy is reused (Synchronization chapter).")],
          [tx(t, "vkFif_o5", "camera uniform buffer + its descriptor set"), tx(t, "vkFif_n5", "per frame"), tx(t, "vkFif_o5b", "the CPU writes it every frame; the set points at one specific buffer, so it is duplicated with it.")],
          [tx(t, "vkFif_o6", "vertex and index buffers, texture, sampler, material set"), tx(t, "vkFif_n6", "one"), tx(t, "vkFif_o6b", "written once at load time, then only read.")],
          [tx(t, "vkFif_o7", "depth image"), tx(t, "vkFif_n7", "one"), tx(t, "vkFif_o7b", "only the GPU touches it, and the GPU runs frames one after another on one queue; the per-frame barrier from the Depth chapter orders each frame's clear after the previous frame's depth writes.")],
          [tx(t, "vkFif_o8", "pipelines, layouts"), tx(t, "vkFif_n8", "one"), tx(t, "vkFif_o8b", "immutable objects.")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "vkFif_overlapNote", "Frames in flight overlap the CPU with the GPU, not two frames on the GPU with each other. Frame k − 1 and frame k still execute one after the other on the graphics queue, which is why the depth image does not need a copy per frame.")}
      </Callout>

      <H2>{tx(t, "vkFif_frameTitle", "FrameData")}</H2>
      <p>
        {tx(t, "vkFif_frameBody",
          "Everything duplicated goes into one struct, and the app holds an array of them. Each frame gets its own command pool instead of its own buffer from one shared pool: a pool is not thread-safe, it can be reset as a whole in one cheap call, and resetting it frees the memory its command buffer used last time. The pool no longer needs the RESET_COMMAND_BUFFER flag.")}
      </p>
      <CodeBlock lang="cpp" filename="frames.h" t={t}>{`constexpr uint32_t kFramesInFlight = 2;

struct FrameData {
    VkCommandPool   pool           = VK_NULL_HANDLE;   // this frame's own pool...
    VkCommandBuffer cmd            = VK_NULL_HANDLE;   // ...and the one buffer it records into
    VkFence         inFlight       = VK_NULL_HANDLE;   // signalled when this frame's submit has finished
    VkSemaphore     imageAvailable = VK_NULL_HANDLE;   // signalled when the acquired image is free
    Buffer          cameraUbo;                         // rewritten each time this slot comes round
    VkDescriptorSet cameraSet      = VK_NULL_HANDLE;   // set 0, pointing at cameraUbo
};

// App gains:  FrameData frames[kFramesInFlight];  uint64_t frameNumber = 0;
// App loses:  cmd, commandPool, inFlight, imageAvailable, cameraUbo, cameraSet
// (uploadPool stays: immediateSubmit still uses it at load time)`}</CodeBlock>
      <CodeBlock lang="cpp" filename="frames.cpp" t={t}>{`void createFrames(App& app) {
    for (FrameData& fr : app.frames) {
        VkCommandPoolCreateInfo pool{};
        pool.sType            = VK_STRUCTURE_TYPE_COMMAND_POOL_CREATE_INFO;
        pool.flags            = 0;                               // reset as a whole with vkResetCommandPool
        pool.queueFamilyIndex = app.families.graphics;
        VK_CHECK(vkCreateCommandPool(app.device, &pool, nullptr, &fr.pool));

        VkCommandBufferAllocateInfo alloc{};
        alloc.sType              = VK_STRUCTURE_TYPE_COMMAND_BUFFER_ALLOCATE_INFO;
        alloc.commandPool        = fr.pool;
        alloc.level              = VK_COMMAND_BUFFER_LEVEL_PRIMARY;
        alloc.commandBufferCount = 1;
        VK_CHECK(vkAllocateCommandBuffers(app.device, &alloc, &fr.cmd));

        VkFenceCreateInfo fence{};
        fence.sType = VK_STRUCTURE_TYPE_FENCE_CREATE_INFO;
        fence.flags = VK_FENCE_CREATE_SIGNALED_BIT;             // the first wait on each slot returns at once
        VK_CHECK(vkCreateFence(app.device, &fence, nullptr, &fr.inFlight));

        VkSemaphoreCreateInfo sem{};
        sem.sType = VK_STRUCTURE_TYPE_SEMAPHORE_CREATE_INFO;
        VK_CHECK(vkCreateSemaphore(app.device, &sem, nullptr, &fr.imageAvailable));

        fr.cameraUbo = createBuffer(app, sizeof(CameraUbo), VK_BUFFER_USAGE_UNIFORM_BUFFER_BIT,
            VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT | VK_MEMORY_PROPERTY_HOST_COHERENT_BIT);
    }
}`}</CodeBlock>

      <H3>{tx(t, "vkFif_setsTitle", "One camera set per frame")}</H3>
      <p>
        {tx(t, "vkFif_setsBody",
          "A descriptor set records which buffer it points at, so each frame's uniform buffer needs its own set. Both sets use the same layout (set 0 of the pipeline layout does not change), and the pool grows to hold them:")}
      </p>
      <CodeBlock lang="cpp" filename="descriptors.cpp" t={t}>{`// in createDescriptors (runs after createFrames, so the buffers exist):
VkDescriptorPoolSize sizes[] = {{VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER, kFramesInFlight},        // one per frame
                                {VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER, 1}};
poolInfo.maxSets = kFramesInFlight + 1;                   // the camera sets + the material set

for (FrameData& fr : app.frames) {
    alloc.pSetLayouts = &app.setLayout;                   // same layout for every frame
    VK_CHECK(vkAllocateDescriptorSets(app.device, &alloc, &fr.cameraSet));
    VkDescriptorBufferInfo bufferInfo{fr.cameraUbo.buffer, 0, sizeof(CameraUbo)};
    write.dstSet      = fr.cameraSet;                     // ...and this frame's own buffer
    write.pBufferInfo = &bufferInfo;
    vkUpdateDescriptorSets(app.device, 1, &write, 0, nullptr);
}`}</CodeBlock>

      <H2>{tx(t, "vkFif_drawTitle", "The new drawFrame")}</H2>
      <p>
        {tx(t, "vkFif_drawBody",
          "frameNumber counts the frames submitted so far; frameNumber mod kFramesInFlight picks the slot. The fence wait now proves that the frame submitted two frames ago has finished, and with it everything in its slot is free: the command pool can be reset and the uniform buffer rewritten.")}
      </p>
      <CodeBlock lang="cpp" filename="sync.cpp" t={t}>{`void drawFrame(App& app) {
    FrameData& fr = app.frames[app.frameNumber % kFramesInFlight];

    // 1. Wait for the frame that last used this slot (kFramesInFlight frames ago)
    VK_CHECK(vkWaitForFences(app.device, 1, &fr.inFlight, VK_TRUE, UINT64_MAX));
    destroyRetired(app, /*all=*/false);                      // resize leftovers nobody uses any more

    // 2. Acquire with this slot's semaphore
    uint32_t imageIndex = 0;
    VkResult res = vkAcquireNextImageKHR(app.device, app.swapchain, UINT64_MAX,
                                         fr.imageAvailable, VK_NULL_HANDLE, &imageIndex);
    if (res == VK_ERROR_OUT_OF_DATE_KHR) { recreateSwapchain(app); return; }   // same slot next time
    if (res != VK_SUCCESS && res != VK_SUBOPTIMAL_KHR) VK_CHECK(res);
    VK_CHECK(vkResetFences(app.device, 1, &fr.inFlight));

    // 3. This slot is free: rewrite its camera, reset its pool, record
    const CameraUbo camera = makeCamera(app.swapExtent);
    std::memcpy(fr.cameraUbo.mapped, &camera, sizeof(camera));
    VK_CHECK(vkResetCommandPool(app.device, fr.pool, 0));   // also resets fr.cmd
    recordFrame(app, fr, imageIndex);                       // binds fr.cameraSet as set 0

    // 4. Submit exactly as before, with this slot's objects
    wait.semaphore        = fr.imageAvailable;
    signal.semaphore      = app.renderFinished[imageIndex]; // still per image
    cmdInfo.commandBuffer = fr.cmd;
    VK_CHECK(vkQueueSubmit2(app.graphicsQueue, 1, &submit, fr.inFlight));
    app.frameNumber++;                                      // the next call uses the other slot

    // 5. Present, and recreate on OUT_OF_DATE / SUBOPTIMAL / resize, as before
}`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "vkFif_tChoice", "Choice"), tx(t, "vkFif_tReason", "Reason")]}
        rows={[
          [tx(t, "vkFif_c1", "slot from frameNumber, advanced only after a submit"), tx(t, "vkFif_c1b", "an OUT_OF_DATE acquire returns before submitting, and the slot's fence is still signalled; the next call reuses the same slot, whose wait returns at once.")],
          [tx(t, "vkFif_c2", "vkResetFences after a successful acquire"), tx(t, "vkFif_c2b", "as in the Synchronization chapter: a fence reset before an early return would never be signalled, and the next wait on it would hang forever.")],
          [tx(t, "vkFif_c3", "vkResetCommandPool, not vkResetCommandBuffer"), tx(t, "vkFif_c3b", "one call for everything the pool allocated, and it lets the driver recycle the memory in one go.")],
          [tx(t, "vkFif_c4", "memcpy into the uniform buffer after the fence wait"), tx(t, "vkFif_c4b", "that buffer was last read by the frame the fence belongs to; the other slot's buffer may be in use right now, and is not touched.")],
        ]}
      />

      <H3>{tx(t, "vkFif_countersTitle", "Two counters that are not the same")}</H3>
      <p>
        {tx(t, "vkFif_countersBody",
          "The frame slot and the swapchain image index are unrelated. The slot cycles 0, 1, 0, 1 because we choose it; the image index is whatever vkAcquireNextImageKHR returns, usually 0, 1, 2, 0, … with three images, but not guaranteed to be in any order. With 2 slots and 3 images:")}
      </p>
      <LessonTable
        headers={[tx(t, "vkFif_tFrame", "frameNumber"), tx(t, "vkFif_tSlot", "slot (fence, cmd, UBO, imageAvailable)"), tx(t, "vkFif_tImage", "image index (renderFinished)")]}
        rows={[
          ["0", "0", "0"], ["1", "1", "1"], ["2", "0", "2"], ["3", "1", "0"], ["4", "0", "1"],
        ]}
      />
      <p>
        {tx(t, "vkFif_countersEnd",
          "Frame 3 renders into image 0 with slot 1's objects. That is why renderFinished is indexed by image and everything else by slot, and why mixing the two up (renderFinished[slot]) makes the validation layer complain that a semaphore is signalled while a present may still be waiting on it.")}
      </p>

      <H2>{tx(t, "vkFif_resizeTitle", "Resizing without vkDeviceWaitIdle")}</H2>
      <p>
        {tx(t, "vkFif_resizeBody",
          "recreateSwapchain still starts with vkDeviceWaitIdle. The reason is real: the old swapchain's image views, its renderFinished semaphores and the old depth image may still be used by frames the GPU has not finished, and destroying them earlier is a use-after-free on the GPU. But while the user drags the window edge, recreation runs on almost every frame, and each wait drains the GPU. There is a cheaper way to know when the old objects are free: the fences we already wait on.")}
      </p>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "vkFif_r1", "When recreating, do not destroy anything. Move the old swapchain, its views, its semaphores and the depth image into a retired list, tagged with the number of the last frame that may use them: frameNumber − 1, the last frame submitted.")}</li>
        <li>{tx(t, "vkFif_r2", "Create the new swapchain with oldSwapchain pointing at the retired one, as before, plus new semaphores and a new depth image.")}</li>
        <li>{tx(t, "vkFif_r3", "At the start of every frame, after the fence wait, destroy the retired entries whose last frame has finished. Having waited on the slot of frame m, we know frame m − kFramesInFlight has finished, and the earlier ones too, since their fences were waited on in earlier calls.")}</li>
      </ol>
      <CodeBlock lang="cpp" filename="swapchain.cpp" t={t}>{`struct Retired {                           // what a recreate leaves behind
    VkSwapchainKHR           swapchain;
    std::vector<VkImageView> views;
    std::vector<VkSemaphore> renderFinished;
    Image                    depth;
    int64_t                  lastFrame;    // the last frame that may still use them
};
// App gains: std::vector<Retired> retired;

void recreateSwapchain(App& app) {
    int w = 0, h = 0;
    SDL_GetWindowSizeInPixels(app.window, &w, &h);
    if (w == 0 || h == 0) return;            // minimised: retry later

    app.retired.push_back({app.swapchain, app.swapViews, app.renderFinished, app.depth,
                           int64_t(app.frameNumber) - 1});
    createSwapchain(app);                    // oldSwapchain = app.swapchain, then overwrites it and the views
    createRenderFinished(app);               // fresh semaphores, one per new image
    createDepth(app);                        // at the new size
}

void destroyRetired(App& app, bool all) {
    const int64_t finished = int64_t(app.frameNumber) - int64_t(kFramesInFlight);   // this frame and older are done
    std::erase_if(app.retired, [&](Retired& r) {
        if (!all && r.lastFrame > finished) return false;                       // may still be in use
        for (VkImageView v : r.views) vkDestroyImageView(app.device, v, nullptr);
        vkDestroySwapchainKHR(app.device, r.swapchain, nullptr);
        for (VkSemaphore s : r.renderFinished) vkDestroySemaphore(app.device, s, nullptr);
        destroyImage(app, r.depth);
        return true;
    });
}`}</CodeBlock>
      <p>
        {tx(t, "vkFif_resizeEx",
          "Worked example with two frames in flight: frame 5 is submitted and presented, the present returns OUT_OF_DATE, and the recreate tags the old objects with lastFrame = 5 (frameNumber is already 6). Frame 6 waits on slot 0, proving frame 4 finished: finished = 6 − 2 = 4 < 5, keep. Frame 7 waits on slot 1, proving frame 5 finished: finished = 5, destroy. The old swapchain lives two frames longer, and nothing ever waits for the whole device.")}
      </p>
      <SwapchainRetireFigure t={t} />
      <Callout type="warn" t={t}>
        {tx(t, "vkFif_presentNote", "The fences cover the GPU's use of the old objects, not the presentation engine's. A semaphore passed to vkQueuePresentKHR is in use until the present operation has consumed it, and core Vulkan has no way to ask when that happens. In practice the present has long finished two frames later, and this is what most engines ship. The complete answer is the VK_EXT_swapchain_maintenance1 extension, which lets vkQueuePresentKHR signal a fence when the present no longer needs its semaphores and swapchain, and adds vkReleaseSwapchainImagesEXT for images acquired but never presented.")}
      </Callout>

      <H2>{tx(t, "vkFif_shutdownTitle", "Shutdown, updated")}</H2>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`vkDeviceWaitIdle(app.device);                 // still right here: nothing runs after this
destroyRetired(app, /*all=*/true);            // whatever the last resize left behind
for (FrameData& fr : app.frames) {
    destroyBuffer(app, fr.cameraUbo);
    vkDestroySemaphore(app.device, fr.imageAvailable, nullptr);
    vkDestroyFence(app.device, fr.inFlight, nullptr);
    vkDestroyCommandPool(app.device, fr.pool, nullptr);   // frees fr.cmd
}
// ... then the renderFinished semaphores, depth, texture, sampler, buffers and the rest as before`}</CodeBlock>
      <Callout type="tip" t={t}>
        {tx(t, "vkFif_run", "Build and run: the scene looks exactly the same, which is the point. Print the frame time, or watch a GPU profiler: with present mode MAILBOX or IMMEDIATE the rate climbs to max(c, g). Then drag the window edge: the cubes keep turning smoothly while the window resizes, where before each step of the drag stalled the GPU.")}
      </Callout>

      <H2>{tx(t, "vkFif_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "vkFif_tMistake", "Mistake"), tx(t, "vkFif_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "vkFif_e1", "Two frames in flight, one uniform buffer"), tx(t, "vkFif_e1b", "the CPU writes the camera while the GPU reads it for the previous frame: no error, just objects that jump or tear. One buffer and one set per frame.")],
          [tx(t, "vkFif_e2", "renderFinished indexed by frame slot"), tx(t, "vkFif_e2b", "a semaphore is signalled again while a present may still wait on it; the validation layer reports it. Index it by the image.")],
          [tx(t, "vkFif_e3", "imageAvailable indexed by image"), tx(t, "vkFif_e3b", "impossible to do correctly: the index is only known after the acquire that needs the semaphore. Index it by slot.")],
          [tx(t, "vkFif_e4", "Advancing the slot on an OUT_OF_DATE acquire"), tx(t, "vkFif_e4b", "harmless with this code's frameNumber scheme; with a separate counter it can skip a slot whose fence was reset, and the next wait on it hangs.")],
          [tx(t, "vkFif_e5", "Destroying the old swapchain right after creating the new one"), tx(t, "vkFif_e5b", "its views may be in use by the frame still on the GPU: an in-use error or a device-lost. Retire it until its last frame's fence has been waited on.")],
          [tx(t, "vkFif_e6", "kFramesInFlight = 3 \"for speed\""), tx(t, "vkFif_e6b", "no faster when frame times are steady, and one more frame of input lag. Measure before raising it.")],
          [tx(t, "vkFif_e7", "Duplicating the depth image per frame"), tx(t, "vkFif_e7b", "not wrong, just wasted memory: frames execute one after another on the queue, and the barrier already orders them.")],
        ]}
      />

      <KeyIdeas t={t} id="vkFif" items={[
        "With one frame in flight the CPU and GPU take turns: T = c + g. With two they overlap: T = max(c, g).",
        "When the GPU is the bottleneck, latency is about N · g, so a third frame adds lag without adding speed; two is the usual choice.",
        "Everything the CPU writes or resets per frame is duplicated: command pool and buffer, fence, imageAvailable, uniform buffer and its descriptor set.",
        "renderFinished stays per swapchain image; imageAvailable is per slot, because the image index is unknown before the acquire.",
        "Read-only resources, pipelines and the depth image stay single: the GPU still runs frames one after another on one queue.",
        "The slot is frameNumber mod kFramesInFlight, and frameNumber advances only after a submit.",
        "On resize, retire the old swapchain, views, semaphores and depth image with the last frame that used them; destroy them after that frame's fence wait.",
        "Fences cover the GPU, not the presentation engine; VK_EXT_swapchain_maintenance1 closes that gap with present fences.",
      ]} />
    </Article>
  );
}
