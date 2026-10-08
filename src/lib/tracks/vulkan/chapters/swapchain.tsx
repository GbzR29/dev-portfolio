"use client";

// Presentation 1: the surface and the swapchain — what a surface is; why the
// window's images belong to a presentation engine; querying capabilities,
// formats and present modes; choosing an sRGB format, a present mode (FIFO,
// FIFO_RELAXED, MAILBOX, IMMEDIATE, with the timeline figure), the extent
// (window size vs pixel size) and the image count; every swapchain create-info
// field; getting the images; image views and subresource ranges; recreating
// on resize and minimise (oldSwapchain); acquire/present in outline; shutdown
// order; a worked example with memory cost; common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { PresentModeFigure } from "@/components/lesson/figures/vulkan/PresentModeFigure";

const r = String.raw;

export function SwapchainContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "vkSwap_intro",
          "In OpenGL the window came with a default framebuffer: you drew, called SwapBuffers, and the picture appeared. Vulkan has no default framebuffer. The images a window shows belong to the operating system's presentation engine (the compositor on Windows and Linux desktops, the display controller on a phone), and a program borrows them through a swapchain: a small ring of images that travel between you and the screen. This chapter creates the swapchain, chooses its format, size, number of images and present mode, wraps each image in a view we can render into, and rebuilds everything when the window changes size.")}
      </Lead>

      <Goals t={t} id="vkSwap" items={[
        "Create a window surface and a swapchain that fits it.",
        "Choose an image format, a present mode and an image count.",
        "Create views for the swapchain's images.",
        "Recreate the swapchain when the window changes size.",
      ]} />

      <H2>{tx(t, "vkSwap_surfaceTitle", "The surface")}</H2>
      <p>
        {tx(t, "vkSwap_surfaceBody",
          "The previous chapter already created a VkSurfaceKHR with SDL_Vulkan_CreateSurface, because choosing a GPU required it. A surface is Vulkan's platform-independent name for \"a place that can show images\": behind it is a Win32 window handle, an X11 or Wayland window, an Android native window or a Metal layer, and SDL called the right platform function for us. The surface is created from the instance, not the device, since it exists independently of any GPU; several GPUs could present to it. It must outlive every swapchain built on it.")}
      </p>

      <H2>{tx(t, "vkSwap_whyTitle", "Why a chain of images")}</H2>
      <p>
        {tx(t, "vkSwap_whyBody",
          "The display reads the image it shows line by line, top to bottom, 60 or more times per second; that scan-out takes almost the whole refresh interval. If we drew into the same image while it was being scanned out, the screen would show half of the old frame and half of the new one. So we draw into a different image and swap them at the vertical blank (vblank), the short pause between one scan-out and the next. With two images that is double buffering; with three, triple buffering, where the GPU can already start a third frame while one is on screen and one is waiting. The swapchain is that set of images, with a protocol for passing them back and forth:")}
      </p>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "vkSwap_p1", "Acquire: vkAcquireNextImageKHR returns the index of an image the presentation engine is not using, so we may render into it.")}</li>
        <li>{tx(t, "vkSwap_p2", "Render into that image with the graphics queue.")}</li>
        <li>{tx(t, "vkSwap_p3", "Present: vkQueuePresentKHR gives the image back to the presentation engine, which shows it according to the present mode.")}</li>
      </ol>
      <p>
        {tx(t, "vkSwap_whyAfter",
          "Between acquire and present the image is ours; the rest of the time it belongs to the presentation engine and we must not touch it. The present mode decides what the engine does with the images we hand back, and it is the most visible choice of this chapter: it decides vsync, tearing and latency.")}
      </p>

      <H2>{tx(t, "vkSwap_queryTitle", "Asking what the surface supports")}</H2>
      <p>
        {tx(t, "vkSwap_queryBody",
          "Every combination of GPU and surface supports its own set of options, so we ask three questions before creating anything: the surface capabilities (image count limits, size limits, the current size and transform), the supported surface formats, and the supported present modes. The two lists use the two-call idiom.")}
      </p>
      <CodeBlock lang="cpp" filename="swapchain.cpp" t={t}>{`struct SwapchainSupport {
    VkSurfaceCapabilitiesKHR        caps{};
    std::vector<VkSurfaceFormatKHR> formats;
    std::vector<VkPresentModeKHR>   modes;
};

static SwapchainSupport querySupport(VkPhysicalDevice gpu, VkSurfaceKHR surface) {
    SwapchainSupport s;
    vkGetPhysicalDeviceSurfaceCapabilitiesKHR(gpu, surface, &s.caps);

    uint32_t n = 0;
    vkGetPhysicalDeviceSurfaceFormatsKHR(gpu, surface, &n, nullptr);
    s.formats.resize(n);
    vkGetPhysicalDeviceSurfaceFormatsKHR(gpu, surface, &n, s.formats.data());

    vkGetPhysicalDeviceSurfacePresentModesKHR(gpu, surface, &n, nullptr);
    s.modes.resize(n);
    vkGetPhysicalDeviceSurfacePresentModesKHR(gpu, surface, &n, s.modes.data());
    return s;
}`}</CodeBlock>

      <H3>{tx(t, "vkSwap_formatTitle", "The format and colour space")}</H3>
      <p>
        {tx(t, "vkSwap_formatBody",
          "A VkSurfaceFormatKHR pairs a pixel format with a colour space. The format says how a pixel is stored: VK_FORMAT_B8G8R8A8_SRGB means four 8-bit channels in the order blue, green, red, alpha, 4 bytes per pixel. The _SRGB suffix is the important part. As the OpenGL gamma chapter explained, monitors expect values encoded with the sRGB curve, while lighting maths must be done on linear values. With an _SRGB format the GPU applies the encoding automatically whenever a shader writes to the image, so shaders can output linear colour. With the _UNORM version of the same format the value is stored as written, and a picture computed in linear space looks too dark. The colour space VK_COLOR_SPACE_SRGB_NONLINEAR_KHR tells the presentation engine to interpret the stored values as sRGB; other colour spaces exist for HDR displays.")}
      </p>
      <CodeBlock lang="cpp" filename="swapchain.cpp" t={t}>{`static VkSurfaceFormatKHR chooseFormat(const std::vector<VkSurfaceFormatKHR>& formats) {
    for (const VkSurfaceFormatKHR& f : formats)
        if ((f.format == VK_FORMAT_B8G8R8A8_SRGB || f.format == VK_FORMAT_R8G8B8A8_SRGB) &&
            f.colorSpace == VK_COLOR_SPACE_SRGB_NONLINEAR_KHR)
            return f;
    return formats[0];   // otherwise whatever the surface prefers
}`}</CodeBlock>

      <H3>{tx(t, "vkSwap_modeTitle", "The present mode")}</H3>
      <p>
        {tx(t, "vkSwap_modeBody",
          "The present mode is the rule the presentation engine follows for the images we present. Four modes are common:")}
      </p>
      <LessonTable
        headers={[tx(t, "vkSwap_tMode", "Mode"), tx(t, "vkSwap_tRule", "Rule"), tx(t, "vkSwap_tResult", "Result")]}
        rows={[
          ["FIFO", tx(t, "vkSwap_m1", "presented images wait in a first-in, first-out queue; at each vblank the oldest one is shown. When the queue is full, acquiring blocks."), tx(t, "vkSwap_m1b", "vsync: no tearing, the frame rate is capped at the refresh rate, low power use. The only mode every implementation must support.")],
          ["FIFO_RELAXED", tx(t, "vkSwap_m2", "like FIFO, but if a frame arrives after the vblank it should have made, it is shown immediately instead of waiting for the next one."), tx(t, "vkSwap_m2b", "no stutter to half the rate when a frame is slightly late, at the cost of an occasional tear.")],
          ["MAILBOX", tx(t, "vkSwap_m3", "a queue of one: a newly presented image replaces the one waiting, which returns to the pool unseen. The waiting one is shown at the vblank."), tx(t, "vkSwap_m3b", "no tearing and low latency: the screen always shows the newest finished frame. The GPU renders frames that are never displayed, which costs power. Needs 3 images to work well.")],
          ["IMMEDIATE", tx(t, "vkSwap_m4", "the presented image is shown at once, even in the middle of a scan-out."), tx(t, "vkSwap_m4b", "the lowest latency, with visible tearing. Used by competitive games with vsync off.")],
        ]}
      />

      <PresentModeFigure t={t} />

      <p>
        {tx(t, "vkSwap_latencyBody",
          "The figure's latency readout measures from the moment the GPU starts a frame to the moment the display starts showing it. In FIFO with a fast GPU, finished frames queue up behind each other, so each one waits for several vblanks: more images means more latency, not less. That is the input lag of vsync. MAILBOX keeps the queue at one frame and throws older frames away, so the picture is at most about one refresh old. We choose FIFO by default, because it is always available and does not burn power on frames nobody sees, and MAILBOX when the program asks for low latency and the surface supports it.")}
      </p>
      <CodeBlock lang="cpp" filename="swapchain.cpp" t={t}>{`static VkPresentModeKHR chooseMode(const std::vector<VkPresentModeKHR>& modes, bool lowLatency) {
    if (lowLatency)
        for (VkPresentModeKHR m : modes)
            if (m == VK_PRESENT_MODE_MAILBOX_KHR) return m;
    return VK_PRESENT_MODE_FIFO_KHR;   // guaranteed to exist
}`}</CodeBlock>

      <H3>{tx(t, "vkSwap_extentTitle", "The extent: window size in pixels")}</H3>
      <p>
        {tx(t, "vkSwap_extentBody",
          "The extent is the size of the swapchain images in pixels. Usually the surface dictates it: caps.currentExtent is the window's current size and we must use exactly that. Some platforms (Wayland, for example) leave the choice to the program and signal it with the special value 0xFFFFFFFF (UINT32_MAX) in currentExtent. Then we ask SDL for the window's size in pixels and clamp it to the allowed range. Note the words \"in pixels\": on a high-DPI screen with 150% scaling, a window that is 1280 × 720 in the operating system's units has 1920 × 1080 real pixels. SDL_GetWindowSize returns the first, SDL_GetWindowSizeInPixels the second, and the swapchain needs the second, or the picture is upscaled and blurry.")}
      </p>
      <CodeBlock lang="cpp" filename="swapchain.cpp" t={t}>{`static VkExtent2D chooseExtent(const VkSurfaceCapabilitiesKHR& caps, SDL_Window* window) {
    if (caps.currentExtent.width != UINT32_MAX)
        return caps.currentExtent;                       // the surface decides

    int w = 0, h = 0;
    SDL_GetWindowSizeInPixels(window, &w, &h);           // real pixels, not scaled units
    return {
        std::clamp(uint32_t(w), caps.minImageExtent.width,  caps.maxImageExtent.width),
        std::clamp(uint32_t(h), caps.minImageExtent.height, caps.maxImageExtent.height),
    };
}`}</CodeBlock>

      <H3>{tx(t, "vkSwap_countTitle", "How many images")}</H3>
      <p>
        {tx(t, "vkSwap_countBody",
          "caps.minImageCount is the smallest number of images the presentation engine needs to work at all, usually 2 or 3. It may keep that many minus one for itself at any moment, so asking for exactly the minimum can make us wait for the engine to release an image. We ask for one more, and clamp to caps.maxImageCount, where 0 is a special value meaning \"no upper limit\". The count is a request: the driver may create more, which is why we read the real number back afterwards.")}
      </p>
      <Equation label={tx(t, "vkSwap_eqCount", "Requested image count")}
        where={[
          [r`n_{\min}`, tx(t, "vkSwap_wMin", "caps.minImageCount, the fewest images the presentation engine can work with")],
          [r`n_{\max}`, tx(t, "vkSwap_wMax", "caps.maxImageCount; the value 0 means there is no maximum, and then the min(…) is skipped")],
        ]}
        note={tx(t, "vkSwap_eqCountNote", "With the common n_min = 2 this gives 3: triple buffering, which is also what MAILBOX needs.")}>
        {r`n = \min(n_{\min} + 1,\; n_{\max})`}
      </Equation>

      <H2>{tx(t, "vkSwap_createTitle", "Creating the swapchain")}</H2>
      <p>
        {tx(t, "vkSwap_createBody",
          "The chosen values go into a VkSwapchainCreateInfoKHR along with a few more fields, each with a short story:")}
      </p>
      <LessonTable
        headers={[tx(t, "vkSwap_tField", "Field"), tx(t, "vkSwap_tMeaning", "Meaning")]}
        rows={[
          ["imageArrayLayers", tx(t, "vkSwap_f1", "layers per image: 1, except for stereoscopic 3D, where each image has a left and a right layer")],
          ["imageUsage", tx(t, "vkSwap_f2", "what we will do with the images. COLOR_ATTACHMENT means rendering into them, which is always supported. Copying or blitting into them needs TRANSFER_DST as well, which must first be checked in caps.supportedUsageFlags.")],
          ["imageSharingMode", tx(t, "vkSwap_f3", "EXCLUSIVE: an image belongs to one queue family at a time, and moving it to another family needs an explicit ownership transfer. CONCURRENT: the listed families may all use it, with some performance cost. We use CONCURRENT only in the rare case where graphics and present are different families, so no transfers are needed.")],
          ["preTransform", tx(t, "vkSwap_f4", "a rotation or mirror the presentation engine applies. On phones held sideways the display may be rotated; currentTransform means \"as it is now\" and is what we want.")],
          ["compositeAlpha", tx(t, "vkSwap_f5", "whether the window's alpha channel blends it with other windows behind it. OPAQUE ignores alpha, which is what a game wants; not every platform supports it, so we check.")],
          ["clipped", tx(t, "vkSwap_f6", "VK_TRUE lets the driver skip pixels hidden behind other windows. Only turn it off if you read the swapchain images back.")],
          ["oldSwapchain", tx(t, "vkSwap_f7", "when rebuilding, the swapchain being replaced, so the driver can reuse resources and finish presenting its images smoothly. VK_NULL_HANDLE the first time.")],
        ]}
      />
      <CodeBlock lang="cpp" filename="swapchain.cpp" t={t}>{`// App gains: VkSwapchainKHR swapchain; VkFormat swapFormat; VkExtent2D swapExtent;
//            std::vector<VkImage> swapImages; std::vector<VkImageView> swapViews;
void createSwapchain(App& app) {
    const SwapchainSupport s = querySupport(app.gpu, app.surface);
    const VkSurfaceFormatKHR format = chooseFormat(s.formats);
    const VkExtent2D extent = chooseExtent(s.caps, app.window);

    uint32_t count = s.caps.minImageCount + 1;
    if (s.caps.maxImageCount > 0 && count > s.caps.maxImageCount)
        count = s.caps.maxImageCount;                     // 0 means "no limit"

    VkSwapchainCreateInfoKHR info{};
    info.sType            = VK_STRUCTURE_TYPE_SWAPCHAIN_CREATE_INFO_KHR;
    info.surface          = app.surface;
    info.minImageCount    = count;
    info.imageFormat      = format.format;
    info.imageColorSpace  = format.colorSpace;
    info.imageExtent      = extent;
    info.imageArrayLayers = 1;
    info.imageUsage       = VK_IMAGE_USAGE_COLOR_ATTACHMENT_BIT;

    const uint32_t families[] = {app.families.graphics, app.families.present};
    if (families[0] != families[1]) {                     // the rare split case
        info.imageSharingMode      = VK_SHARING_MODE_CONCURRENT;
        info.queueFamilyIndexCount = 2;
        info.pQueueFamilyIndices   = families;
    } else {
        info.imageSharingMode = VK_SHARING_MODE_EXCLUSIVE;
    }

    info.preTransform   = s.caps.currentTransform;
    info.compositeAlpha = (s.caps.supportedCompositeAlpha & VK_COMPOSITE_ALPHA_OPAQUE_BIT_KHR)
        ? VK_COMPOSITE_ALPHA_OPAQUE_BIT_KHR
        : VkCompositeAlphaFlagBitsKHR(s.caps.supportedCompositeAlpha & -s.caps.supportedCompositeAlpha);  // lowest supported bit
    info.presentMode    = chooseMode(s.modes, /*lowLatency=*/false);
    info.clipped        = VK_TRUE;
    info.oldSwapchain   = app.swapchain;                  // VK_NULL_HANDLE the first time

    VK_CHECK(vkCreateSwapchainKHR(app.device, &info, nullptr, &app.swapchain));
    app.swapFormat = format.format;
    app.swapExtent = extent;
    createSwapchainViews(app);
}`}</CodeBlock>
      <p>
        {tx(t, "vkSwap_bitTrick",
          "The expression x & -x keeps only the lowest set bit of x (in two's complement, −x flips every bit above the lowest 1), so the fallback picks the first composite-alpha mode the surface supports.")}
      </p>

      <H2>{tx(t, "vkSwap_viewsTitle", "The images and their views")}</H2>
      <p>
        {tx(t, "vkSwap_viewsBody",
          "The swapchain created its images itself; we get their handles with the two-call idiom. These VkImage handles belong to the swapchain, so we never destroy them. To render into an image, Vulkan needs a VkImageView: a description of which part of the image to use and how to interpret it. An image can hold several mip levels and array layers, and can have colour, depth and stencil aspects; a view selects a subset. For the swapchain the view is the simplest possible one.")}
      </p>
      <LessonTable
        headers={[tx(t, "vkSwap_tField", "Field"), tx(t, "vkSwap_tMeaning", "Meaning")]}
        rows={[
          ["viewType", tx(t, "vkSwap_v1", "how to treat the image: 1D, 2D, 3D, CUBE, or an array of those. Ours is 2D.")],
          ["format", tx(t, "vkSwap_v2", "how to interpret the bytes, normally the image's own format. A view may use a compatible format, for example UNORM on an SRGB image, to skip the sRGB conversion.")],
          ["components", tx(t, "vkSwap_v3", "a swizzle: which channel to read for r, g, b and a. The zero value, IDENTITY, keeps each channel in place, so {} is correct.")],
          ["subresourceRange.aspectMask", tx(t, "vkSwap_v4", "which aspect: COLOR here; DEPTH and/or STENCIL for depth images")],
          ["baseMipLevel, levelCount", tx(t, "vkSwap_v5", "which mip levels: from level 0, one level (swapchain images have no mipmaps)")],
          ["baseArrayLayer, layerCount", tx(t, "vkSwap_v6", "which array layers: from layer 0, one layer")],
        ]}
      />
      <CodeBlock lang="cpp" filename="swapchain.cpp" t={t}>{`void createSwapchainViews(App& app) {
    uint32_t n = 0;
    vkGetSwapchainImagesKHR(app.device, app.swapchain, &n, nullptr);
    app.swapImages.resize(n);                             // may be more than we asked for
    vkGetSwapchainImagesKHR(app.device, app.swapchain, &n, app.swapImages.data());

    app.swapViews.resize(n);
    for (uint32_t i = 0; i < n; ++i) {
        VkImageViewCreateInfo v{};
        v.sType    = VK_STRUCTURE_TYPE_IMAGE_VIEW_CREATE_INFO;
        v.image    = app.swapImages[i];
        v.viewType = VK_IMAGE_VIEW_TYPE_2D;
        v.format   = app.swapFormat;
        // v.components left as {}: identity swizzle
        v.subresourceRange.aspectMask     = VK_IMAGE_ASPECT_COLOR_BIT;
        v.subresourceRange.baseMipLevel   = 0;
        v.subresourceRange.levelCount     = 1;
        v.subresourceRange.baseArrayLayer = 0;
        v.subresourceRange.layerCount     = 1;
        VK_CHECK(vkCreateImageView(app.device, &v, nullptr, &app.swapViews[i]));
    }
}

void destroySwapchainViews(App& app) {
    for (VkImageView v : app.swapViews) vkDestroyImageView(app.device, v, nullptr);
    app.swapViews.clear();                                // the images belong to the swapchain
}`}</CodeBlock>

      <H2>{tx(t, "vkSwap_recreateTitle", "When the window changes: recreating")}</H2>
      <p>
        {tx(t, "vkSwap_recreateBody",
          "A swapchain is built for one size. When the window is resized, or moved to a monitor with a different scale, its images no longer fit. Vulkan reports this in two ways: vkAcquireNextImageKHR or vkQueuePresentKHR return VK_ERROR_OUT_OF_DATE_KHR (the swapchain can no longer be used at all) or VK_SUBOPTIMAL_KHR (it still works, but no longer matches the surface exactly, for example after a rotation). Some platforms never return these for a resize, so we also listen for SDL's resize event. In every case the answer is the same: build a new swapchain and new views.")}
      </p>
      <CodeBlock lang="cpp" filename="swapchain.cpp" t={t}>{`void recreateSwapchain(App& app) {
    int w = 0, h = 0;
    SDL_GetWindowSizeInPixels(app.window, &w, &h);
    if (w == 0 || h == 0) return;          // minimised: a 0 × 0 swapchain is invalid; retry later

    vkDeviceWaitIdle(app.device);          // simple and safe; a later chapter avoids this stall
    destroySwapchainViews(app);
    VkSwapchainKHR old = app.swapchain;
    createSwapchain(app);                  // passes old as oldSwapchain
    vkDestroySwapchainKHR(app.device, old, nullptr);
}

// In the main loop:
while (SDL_PollEvent(&e)) {
    if (e.type == SDL_EVENT_QUIT) running = false;
    if (e.type == SDL_EVENT_WINDOW_PIXEL_SIZE_CHANGED) app.resized = true;
}
if (app.resized) { recreateSwapchain(app); app.resized = false; }`}</CodeBlock>
      <Callout type="warn" t={t}>
        {tx(t, "vkSwap_minNote", "A minimised window has a size of 0 × 0 on Windows, and a swapchain with a zero extent is invalid. Skip rendering and recreation until the window is restored; SDL sends SDL_EVENT_WINDOW_RESTORED and a new size event when that happens. Forgetting this is the classic \"crashes when I minimise\" bug.")}
      </Callout>
      <p>
        {tx(t, "vkSwap_outlineBody",
          "Acquiring and presenting need semaphores to tell the GPU when an image is really free and when rendering into it has finished, so the frame loop that uses this swapchain arrives in the Synchronization chapter. The swapchain is ready for it: a set of images, one view per image, a known format and extent, and a way to rebuild all of it.")}
      </p>

      <H2>{tx(t, "vkSwap_shutdownTitle", "Shutdown, updated")}</H2>
      <p>
        {tx(t, "vkSwap_shutdownBody",
          "The views were created from the device, the swapchain from the device on top of the surface. So the order is: wait idle, views, swapchain, device, surface, messenger, instance.")}
      </p>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`void destroy(App& app) {
    vkDeviceWaitIdle(app.device);
    destroySwapchainViews(app);
    vkDestroySwapchainKHR(app.device, app.swapchain, nullptr);   // also frees its images
    vkDestroyDevice(app.device, nullptr);
    vkDestroySurfaceKHR(app.instance, app.surface, nullptr);
    // ... messenger, instance, window, SDL_Quit() as before ...
}`}</CodeBlock>

      <H2>{tx(t, "vkSwap_workedTitle", "Worked example")}</H2>
      <p>
        {tx(t, "vkSwap_worked1",
          "A 2560 × 1440 monitor on Windows with 150% scaling, and a window of 1280 × 720 in scaled units. SDL_GetWindowSizeInPixels returns 1280 · 1.5 = 1920 by 720 · 1.5 = 1080. Windows fills currentExtent, and it is 1920 × 1080, so that is the extent. The surface reports minImageCount = 2 and maxImageCount = 8, so we ask for min(2 + 1, 8) = 3 images. The format list contains B8G8R8A8_UNORM and B8G8R8A8_SRGB, both with SRGB_NONLINEAR, and chooseFormat takes the SRGB one.")}
      </p>
      <p>
        {tx(t, "vkSwap_worked2",
          "Memory: one image is 1920 · 1080 pixels × 4 bytes = 8 294 400 bytes, about 7.9 MiB (1 MiB = 1 048 576 bytes). Three images take about 23.7 MiB of GPU memory. At 4K (3840 × 2160), each image is four times larger, about 31.6 MiB. That is one reason not to ask for more images than needed; the other, as the figure showed, is latency under FIFO.")}
      </p>

      <H2>{tx(t, "vkSwap_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "vkSwap_tMistake", "Mistake"), tx(t, "vkSwap_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "vkSwap_e1", "Using the window size in scaled units"), tx(t, "vkSwap_e1b", "a blurry picture on high-DPI screens, or a validation error when the extent does not match currentExtent. Use currentExtent, or SDL_GetWindowSizeInPixels when it is 0xFFFFFFFF.")],
          [tx(t, "vkSwap_e2", "Choosing a _UNORM format and writing linear colours"), tx(t, "vkSwap_e2b", "the picture looks too dark and dull. Use an _SRGB format, or apply the sRGB curve in the shader, never both (that looks washed out).")],
          [tx(t, "vkSwap_e3", "Asking for MAILBOX without checking"), tx(t, "vkSwap_e3b", "vkCreateSwapchainKHR fails on surfaces without it (common on laptops and phones). Check the list; FIFO is the only guaranteed mode.")],
          [tx(t, "vkSwap_e4", "Destroying the swapchain's images"), tx(t, "vkSwap_e4b", "they belong to the swapchain; calling vkDestroyImage on them is a validation error. Destroy only the views you created.")],
          [tx(t, "vkSwap_e5", "Assuming the image count you asked for"), tx(t, "vkSwap_e5b", "the driver may create more. Size per-image arrays from vkGetSwapchainImagesKHR.")],
          [tx(t, "vkSwap_e6", "Recreating while minimised"), tx(t, "vkSwap_e6b", "a zero extent is invalid. Wait until the window has a non-zero size.")],
          [tx(t, "vkSwap_e7", "Destroying the old swapchain while it is still in use"), tx(t, "vkSwap_e7b", "its images may still be queued for presentation. Here vkDeviceWaitIdle guards it; the frames-in-flight chapter shows a way without stalling.")],
        ]}
      />

      <KeyIdeas t={t} id="vkSwap" items={[
        "Vulkan has no default framebuffer: the window's images belong to the presentation engine and are borrowed through a swapchain.",
        "The protocol is acquire an image, render into it, present it; between acquire and present the image is ours.",
        "Query the surface's capabilities, formats and present modes before creating the swapchain.",
        "Prefer an _SRGB format with the SRGB_NONLINEAR colour space, so linear shader output is encoded for the display automatically.",
        "FIFO (vsync, always available), MAILBOX (newest frame, no tearing, needs 3 images) and IMMEDIATE (tearing, lowest latency) trade latency, power and tearing.",
        "The extent is in real pixels: currentExtent, or the clamped SDL_GetWindowSizeInPixels when it is 0xFFFFFFFF.",
        "Ask for minImageCount + 1 images, clamped to maxImageCount (0 = no limit), and read back the real count.",
        "Each image gets a VkImageView selecting its colour aspect, mip 0 and layer 0; the images themselves are never destroyed by us.",
        "Rebuild the swapchain on OUT_OF_DATE, SUBOPTIMAL or a resize event, skip it while minimised, and pass the old one as oldSwapchain.",
      ]} />
    </Article>
  );
}
