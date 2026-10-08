"use client";

// Presentation 3: command buffers — recording versus executing; command pools
// (flags, one per family and thread) and allocation (primary/secondary); the
// five-state lifecycle with the CmdLifecycle figure; image layouts and the
// transition helper (vkCmdPipelineBarrier2, explained fully in the next
// chapter); dynamic rendering (VkRenderingAttachmentInfo, VkRenderingInfo),
// load and store operations with the LoadStore figure; binding, dynamic
// viewport/scissor and vkCmdDraw's four parameters; the whole recordFrame;
// clear colours on an sRGB image, worked; common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { CmdLifecycleFigure } from "@/components/lesson/figures/vulkan/CmdLifecycleFigure";
import { LoadStoreFigure } from "@/components/lesson/figures/vulkan/LoadStoreFigure";

const r = String.raw;

export function CommandsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "vkCmd_intro",
          "An OpenGL call like glDrawArrays looks like it draws, but the driver only writes the request into a hidden command buffer and sends that buffer to the GPU later, when it decides to. Vulkan hands you that buffer. You record commands into a VkCommandBuffer, which costs CPU time and nothing else, and later submit the finished buffer to a queue, where the GPU executes it. Recording and executing are separate, so a buffer can be recorded on any thread, reused, and submitted exactly when you choose. This chapter creates the pool and buffer, and records everything one frame of the triangle needs.")}
      </Lead>

      <Goals t={t} id="vkCmd" items={[
        "Create a command pool and its command buffers.",
        "Record the commands of one frame with dynamic rendering.",
        "Move an image from one layout to another with a barrier.",
        "Say which state a command buffer is in and what you may do with it.",
      ]} />

      <H2>{tx(t, "vkCmd_poolTitle", "Command pools")}</H2>
      <p>
        {tx(t, "vkCmd_poolBody",
          "Command buffers are allocated from a VkCommandPool, which owns the memory their commands are written into. A pool is tied to one queue family: its buffers may only be submitted to queues of that family, because the encoded commands can differ between families. A pool is also not thread-safe: two threads must never record into buffers from the same pool at the same time. That is deliberate. Without locks, recording is fast, and a multithreaded engine simply gives each thread its own pool. The flags tell the driver how the buffers will be used:")}
      </p>
      <LessonTable
        headers={[tx(t, "vkCmd_tFlag", "Flag"), tx(t, "vkCmd_tMeaning", "Meaning")]}
        rows={[
          ["RESET_COMMAND_BUFFER_BIT", tx(t, "vkCmd_f1", "buffers from this pool may be reset one at a time (explicitly, or implicitly by vkBeginCommandBuffer). Without it, only the whole pool can be reset. We re-record the same buffer every frame, so we set it.")],
          ["TRANSIENT_BIT", tx(t, "vkCmd_f2", "a hint that buffers are short-lived and reset or freed often, so the driver may pick a faster allocation strategy. Useful for one-off upload commands.")],
          ["PROTECTED_BIT", tx(t, "vkCmd_f3", "for protected (DRM) content. Not used here.")],
        ]}
      />
      <CodeBlock lang="cpp" filename="commands.cpp" t={t}>{`// App gains: VkCommandPool commandPool; VkCommandBuffer cmd;
void createCommands(App& app) {
    VkCommandPoolCreateInfo poolInfo{};
    poolInfo.sType            = VK_STRUCTURE_TYPE_COMMAND_POOL_CREATE_INFO;
    poolInfo.flags            = VK_COMMAND_POOL_CREATE_RESET_COMMAND_BUFFER_BIT;
    poolInfo.queueFamilyIndex = app.families.graphics;   // buffers go to the graphics queue
    VK_CHECK(vkCreateCommandPool(app.device, &poolInfo, nullptr, &app.commandPool));

    VkCommandBufferAllocateInfo alloc{};
    alloc.sType              = VK_STRUCTURE_TYPE_COMMAND_BUFFER_ALLOCATE_INFO;
    alloc.commandPool        = app.commandPool;
    alloc.level              = VK_COMMAND_BUFFER_LEVEL_PRIMARY;
    alloc.commandBufferCount = 1;
    VK_CHECK(vkAllocateCommandBuffers(app.device, &alloc, &app.cmd));
}`}</CodeBlock>
      <p>
        {tx(t, "vkCmd_levelBody",
          "The level is PRIMARY or SECONDARY. A primary buffer is submitted to a queue. A secondary buffer cannot be submitted; it is recorded separately and executed from inside a primary one with vkCmdExecuteCommands. Engines use secondaries to record parts of one frame on several threads at once. Buffers are never destroyed on their own: they are freed with vkFreeCommandBuffers or, more simply, when their pool is destroyed.")}
      </p>

      <H2>{tx(t, "vkCmd_lifeTitle", "The lifecycle of a command buffer")}</H2>
      <p>
        {tx(t, "vkCmd_lifeBody",
          "A command buffer is always in one of five states, and each call is only valid in some of them. Most command-buffer bugs are calls made in the wrong state, which the validation layer reports precisely:")}
      </p>
      <LessonTable
        headers={[tx(t, "vkCmd_tState", "State"), tx(t, "vkCmd_tStateMeaning", "Meaning")]}
        rows={[
          ["initial", tx(t, "vkCmd_s1", "just allocated or reset: empty, ready to begin")],
          ["recording", tx(t, "vkCmd_s2", "between vkBeginCommandBuffer and vkEndCommandBuffer; vkCmd* calls append commands")],
          ["executable", tx(t, "vkCmd_s3", "recording ended; it can be submitted")],
          ["pending", tx(t, "vkCmd_s4", "submitted and not yet finished on the GPU. It must not be reset, re-recorded or freed. The only way to know it finished is a fence (next chapter).")],
          ["invalid", tx(t, "vkCmd_s5", "unusable until reset: a ONE_TIME_SUBMIT buffer that ran, or one that refers to an object destroyed since")],
        ]}
      />
      <CmdLifecycleFigure t={t} />

      <H2>{tx(t, "vkCmd_layoutTitle", "Image layouts")}</H2>
      <p>
        {tx(t, "vkCmd_layoutBody",
          "Before we can draw into the swapchain image, one Vulkan idea is new: an image's layout. GPUs store the pixels of an image in different arrangements depending on the job. For rendering, colour data is often compressed in blocks and arranged in tiles so the colour units write it quickly. For sampling, the texture units want an arrangement they can filter from. For presentation, the display engine may need plain, uncompressed rows. Vulkan exposes this as a VkImageLayout per image, and the program must move the image into the right layout before each kind of use. That move is a layout transition; the driver may decompress or rearrange data during it.")}
      </p>
      <LessonTable
        headers={[tx(t, "vkCmd_tLayout", "Layout"), tx(t, "vkCmd_tUse", "Used for")]}
        rows={[
          ["UNDEFINED", tx(t, "vkCmd_l1", "\"I don't care what is in it\". Valid only as the old layout of a transition, and the contents may be discarded. Right before a full clear it is exactly what we want.")],
          ["COLOR_ATTACHMENT_OPTIMAL", tx(t, "vkCmd_l2", "rendering into the image as a colour attachment")],
          ["SHADER_READ_ONLY_OPTIMAL", tx(t, "vkCmd_l3", "sampling it as a texture (Textures chapter)")],
          ["TRANSFER_SRC / TRANSFER_DST_OPTIMAL", tx(t, "vkCmd_l4", "copying from or into it")],
          ["PRESENT_SRC_KHR", tx(t, "vkCmd_l5", "handing a swapchain image to the presentation engine; vkQueuePresentKHR requires it")],
          ["GENERAL", tx(t, "vkCmd_l6", "any use, possibly slower; needed for storage images written by compute shaders")],
        ]}
      />
      <p>
        {tx(t, "vkCmd_transBody",
          "A transition is recorded as an image memory barrier. The next chapter explains barriers properly: the stage masks say which earlier work must finish before which later work may start, and the access masks make sure the written data is really visible to the next reader. For now it is enough to know that each transition names the old and new layout and the work on either side of it. The helper below takes all four masks as parameters, and the two calls in recordFrame use exactly the values the next chapter justifies.")}
      </p>
      <CodeBlock lang="cpp" filename="commands.cpp" t={t}>{`static void transitionImage(VkCommandBuffer cmd, VkImage image,
                            VkImageLayout oldLayout, VkImageLayout newLayout,
                            VkPipelineStageFlags2 srcStage, VkAccessFlags2 srcAccess,
                            VkPipelineStageFlags2 dstStage, VkAccessFlags2 dstAccess) {
    VkImageMemoryBarrier2 barrier{};
    barrier.sType         = VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER_2;
    barrier.srcStageMask  = srcStage;     // work before the barrier that must finish...
    barrier.srcAccessMask = srcAccess;    // ...and whose writes must be flushed
    barrier.dstStageMask  = dstStage;     // work after the barrier that must wait...
    barrier.dstAccessMask = dstAccess;    // ...and which must see those writes
    barrier.oldLayout     = oldLayout;
    barrier.newLayout     = newLayout;
    barrier.srcQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED;   // no ownership transfer
    barrier.dstQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED;
    barrier.image         = image;
    barrier.subresourceRange = {VK_IMAGE_ASPECT_COLOR_BIT, 0, 1, 0, 1};   // aspect, mips, layers

    VkDependencyInfo dep{};
    dep.sType                   = VK_STRUCTURE_TYPE_DEPENDENCY_INFO;
    dep.imageMemoryBarrierCount = 1;
    dep.pImageMemoryBarriers    = &barrier;
    vkCmdPipelineBarrier2(cmd, &dep);
}`}</CodeBlock>

      <H2>{tx(t, "vkCmd_renderingTitle", "Dynamic rendering")}</H2>
      <p>
        {tx(t, "vkCmd_renderingBody",
          "Draw commands must be inside a rendering scope, which names the attachments they write to. With dynamic rendering the scope is opened by vkCmdBeginRendering and closed by vkCmdEndRendering, with no render-pass or framebuffer objects created in advance. Each colour attachment is described by a VkRenderingAttachmentInfo:")}
      </p>
      <LessonTable
        headers={[tx(t, "vkCmd_tField", "Field"), tx(t, "vkCmd_tMeaning", "Meaning")]}
        rows={[
          ["imageView", tx(t, "vkCmd_a1", "the view to render into: the swapchain view of the acquired image")],
          ["imageLayout", tx(t, "vkCmd_a2", "the layout the image will be in during rendering: COLOR_ATTACHMENT_OPTIMAL, which the transition before it must establish")],
          ["loadOp", tx(t, "vkCmd_a3", "what the attachment contains when rendering begins: LOAD keeps the old contents, CLEAR fills it with clearValue, DONT_CARE leaves it undefined")],
          ["storeOp", tx(t, "vkCmd_a4", "what happens to the result when rendering ends: STORE writes it to memory, DONT_CARE allows the GPU to throw it away")],
          ["clearValue", tx(t, "vkCmd_a5", "the colour used by CLEAR, as four floats (r, g, b, a)")],
        ]}
      />
      <LoadStoreFigure t={t} />
      <p>
        {tx(t, "vkCmd_loadBody",
          "For the swapchain image the right pair is CLEAR and STORE: we draw a new picture every frame, so the old contents are not needed, and the result must reach memory because the screen will show it. The load and store operations matter more than they look. On the tile-based GPUs of phones, the attachment lives in small on-chip memory while a tile is rendered, and LOAD and STORE are real copies between that memory and RAM. Choosing CLEAR and DONT_CARE wherever possible is one of the cheapest optimisations on mobile.")}
      </p>
      <p>
        {tx(t, "vkCmd_areaBody",
          "VkRenderingInfo gathers the attachments with renderArea, the rectangle of pixels that will be rendered (the whole extent), and layerCount = 1. Inside the scope we bind the pipeline, set the dynamic viewport and scissor, and draw.")}
      </p>

      <H3>{tx(t, "vkCmd_drawTitle", "vkCmdDraw's four numbers")}</H3>
      <LessonTable
        headers={[tx(t, "vkCmd_tParam", "Parameter"), tx(t, "vkCmd_tMeaning", "Meaning")]}
        rows={[
          ["vertexCount", tx(t, "vkCmd_d1", "how many vertices to run the vertex shader for: 3 for one triangle")],
          ["instanceCount", tx(t, "vkCmd_d2", "how many copies of the whole draw (instancing); 1 for a normal draw. 0 is valid and draws nothing.")],
          ["firstVertex", tx(t, "vkCmd_d3", "the first value of gl_VertexIndex: the shader sees firstVertex, firstVertex + 1, …")],
          ["firstInstance", tx(t, "vkCmd_d4", "the first value of gl_InstanceIndex")],
        ]}
      />

      <H2>{tx(t, "vkCmd_recordTitle", "Recording one frame")}</H2>
      <CodeBlock lang="cpp" filename="commands.cpp" t={t}>{`void recordFrame(App& app, VkCommandBuffer cmd, uint32_t imageIndex) {
    VkCommandBufferBeginInfo begin{};
    begin.sType = VK_STRUCTURE_TYPE_COMMAND_BUFFER_BEGIN_INFO;
    begin.flags = VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT;   // re-recorded every frame
    VK_CHECK(vkBeginCommandBuffer(cmd, &begin));                 // implicit reset (pool flag)

    VkImage image = app.swapImages[imageIndex];

    // 1. UNDEFINED → COLOR_ATTACHMENT_OPTIMAL (old contents discarded: we clear anyway)
    transitionImage(cmd, image, VK_IMAGE_LAYOUT_UNDEFINED, VK_IMAGE_LAYOUT_COLOR_ATTACHMENT_OPTIMAL,
        VK_PIPELINE_STAGE_2_COLOR_ATTACHMENT_OUTPUT_BIT, VK_ACCESS_2_NONE,
        VK_PIPELINE_STAGE_2_COLOR_ATTACHMENT_OUTPUT_BIT, VK_ACCESS_2_COLOR_ATTACHMENT_WRITE_BIT);

    // 2. Render
    VkRenderingAttachmentInfo color{};
    color.sType       = VK_STRUCTURE_TYPE_RENDERING_ATTACHMENT_INFO;
    color.imageView   = app.swapViews[imageIndex];
    color.imageLayout = VK_IMAGE_LAYOUT_COLOR_ATTACHMENT_OPTIMAL;
    color.loadOp      = VK_ATTACHMENT_LOAD_OP_CLEAR;
    color.storeOp     = VK_ATTACHMENT_STORE_OP_STORE;
    color.clearValue.color = {{0.01f, 0.01f, 0.02f, 1.0f}};    // linear: a very dark blue

    VkRenderingInfo rendering{};
    rendering.sType                = VK_STRUCTURE_TYPE_RENDERING_INFO;
    rendering.renderArea           = {{0, 0}, app.swapExtent};
    rendering.layerCount           = 1;
    rendering.colorAttachmentCount = 1;
    rendering.pColorAttachments    = &color;
    vkCmdBeginRendering(cmd, &rendering);

    vkCmdBindPipeline(cmd, VK_PIPELINE_BIND_POINT_GRAPHICS, app.pipeline);
    const VkViewport viewport{0.0f, 0.0f, float(app.swapExtent.width), float(app.swapExtent.height), 0.0f, 1.0f};
    const VkRect2D scissor{{0, 0}, app.swapExtent};
    vkCmdSetViewport(cmd, 0, 1, &viewport);                      // x, y, width, height, minDepth, maxDepth
    vkCmdSetScissor(cmd, 0, 1, &scissor);
    vkCmdDraw(cmd, 3, 1, 0, 0);                                  // 3 vertices, 1 instance

    vkCmdEndRendering(cmd);

    // 3. COLOR_ATTACHMENT_OPTIMAL → PRESENT_SRC_KHR (the presentation engine reads it next)
    transitionImage(cmd, image, VK_IMAGE_LAYOUT_COLOR_ATTACHMENT_OPTIMAL, VK_IMAGE_LAYOUT_PRESENT_SRC_KHR,
        VK_PIPELINE_STAGE_2_COLOR_ATTACHMENT_OUTPUT_BIT, VK_ACCESS_2_COLOR_ATTACHMENT_WRITE_BIT,
        VK_PIPELINE_STAGE_2_NONE, VK_ACCESS_2_NONE);

    VK_CHECK(vkEndCommandBuffer(cmd));
}`}</CodeBlock>
      <p>
        {tx(t, "vkCmd_recordAfter",
          "Nothing in this function touched the GPU. It filled a buffer with eight commands: two barriers, begin rendering, bind, two dynamic states, draw and end rendering. The buffer runs only when it is submitted, and submitting it safely, so it does not draw into an image the screen is still showing, needs the semaphores and fence of the next chapter. The first triangle appears at the end of that chapter.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "vkCmd_bindNote", "State set by commands (the bound pipeline, the dynamic viewport and scissor) lasts only until the end of the command buffer. Every buffer starts with nothing bound, so each one must set everything it uses, unlike OpenGL's global state that persisted from frame to frame.")}
      </Callout>

      <H2>{tx(t, "vkCmd_workedTitle", "Worked example: the clear colour on an sRGB image")}</H2>
      <p>
        {tx(t, "vkCmd_worked1",
          "The swapchain format is B8G8R8A8_SRGB, and clear values, like shader outputs, are given in linear light. The GPU encodes them with the sRGB curve on the way into the image:")}
      </p>
      <Equation label={tx(t, "vkCmd_eqSrgb", "sRGB encoding of a linear value")}
        where={[
          ["c", tx(t, "vkCmd_wC", "the linear channel value in [0, 1], as written by the shader or the clear value")],
          ["s", tx(t, "vkCmd_wS", "the encoded value stored in the image, then scaled to 0–255 for an 8-bit channel")],
          ["0.0031308", tx(t, "vkCmd_wKnee", "the point where the curve switches from a straight line (for very dark values) to the power curve")],
          [r`1/2.4,\;1.055,\;0.055`, tx(t, "vkCmd_wConst", "the exponent and scale/offset of the power part, chosen so both pieces meet smoothly; together they approximate a gamma of about 2.2")],
        ]}>
        {r`s = \begin{cases} 12.92\,c & c \le 0.0031308 \\ 1.055\,c^{1/2.4} - 0.055 & c > 0.0031308 \end{cases}`}
      </Equation>
      <p>
        {tx(t, "vkCmd_worked2",
          "A clear value of 0.2 gives 0.2^(1/2.4) = e^(ln 0.2 / 2.4) = e^(−0.6706) ≈ 0.5114, then 1.055 · 0.5114 − 0.055 ≈ 0.4845, and 0.4845 · 255 ≈ 124 in the byte. So a \"20%\" grey is stored as 124 of 255, almost half: sRGB spends more of its 256 levels on dark values, where the eye tells them apart best. Our clear colour 0.01 is above the knee: 1.055 · 0.01^(1/2.4) − 0.055 ≈ 0.0998, about 25 in the byte. If the same 0.2 were written to a _UNORM image it would be stored as 51 and look much darker; that is the \"too dark\" mistake from the swapchain chapter.")}
      </p>

      <H2>{tx(t, "vkCmd_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "vkCmd_tMistake", "Mistake"), tx(t, "vkCmd_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "vkCmd_e1", "Re-recording a buffer the GPU is still executing"), tx(t, "vkCmd_e1b", "a validation error (the buffer is pending), and garbage or a device loss without the layer. Wait for its fence before beginning it again.")],
          [tx(t, "vkCmd_e2", "Recording into one pool from two threads"), tx(t, "vkCmd_e2b", "memory corruption inside the driver, often a crash far away. One pool per thread.")],
          [tx(t, "vkCmd_e3", "Drawing outside vkCmdBeginRendering / vkCmdEndRendering"), tx(t, "vkCmd_e3b", "a validation error: draws need a rendering scope with attachments.")],
          [tx(t, "vkCmd_e4", "Forgetting the transition to COLOR_ATTACHMENT_OPTIMAL"), tx(t, "vkCmd_e4b", "the layer reports the image is in the wrong layout; some GPUs show corruption. Every use needs its layout.")],
          [tx(t, "vkCmd_e5", "Forgetting the transition to PRESENT_SRC_KHR"), tx(t, "vkCmd_e5b", "vkQueuePresentKHR reports the wrong layout; the picture may be garbled or compressed data shown raw.")],
          [tx(t, "vkCmd_e6", "Relying on state from the previous frame's buffer"), tx(t, "vkCmd_e6b", "\"no pipeline bound\" or \"viewport not set\" errors. Each command buffer sets everything it uses.")],
          [tx(t, "vkCmd_e7", "loadOp = LOAD on the swapchain with oldLayout UNDEFINED"), tx(t, "vkCmd_e7b", "UNDEFINED discards the contents, so LOAD reads garbage. Use CLEAR, or keep the real old layout if you need the contents.")],
        ]}
      />

      <KeyIdeas t={t} id="vkCmd" items={[
        "Recording a command buffer only costs CPU time; the GPU runs it when it is submitted to a queue.",
        "Command pools belong to one queue family and are not thread-safe: one pool per recording thread.",
        "RESET_COMMAND_BUFFER_BIT lets a buffer be reset on its own, so the same buffer can be re-recorded each frame.",
        "A buffer is initial, recording, executable, pending or invalid; never touch a pending buffer until its fence signals.",
        "Images have layouts; transitions (image memory barriers) move them between uses: UNDEFINED → COLOR_ATTACHMENT_OPTIMAL → PRESENT_SRC_KHR for the swapchain.",
        "vkCmdBeginRendering opens a rendering scope with attachments described inline: view, layout, loadOp, storeOp, clear value.",
        "CLEAR and STORE for the swapchain; CLEAR and DONT_CARE wherever results are not needed later, which matters most on tile-based GPUs.",
        "Clear values and shader outputs are linear; an _SRGB image encodes them on write.",
        "Bound state lives only inside one command buffer.",
      ]} />
    </Article>
  );
}
