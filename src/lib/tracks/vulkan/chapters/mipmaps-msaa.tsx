"use client";

// Going further 2: mipmaps and multisampling — minification aliasing; the
// mip chain (level count, sizes, the 4/3 memory series); level selection
// (ρ, λ, trilinear) with the Mipmap figure; generating the chain on the GPU
// with vkCmdBlitImage2 and per-level barriers; edge aliasing and MSAA
// (coverage per sample, shading per pixel, resolve) with the Msaa figure;
// the sample count; multisampled colour and depth targets; the resolve in
// dynamic rendering; sample shading and tile-based GPUs; shutdown; mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { MipmapFigure } from "@/components/lesson/figures/vulkan/MipmapFigure";
import { MsaaFigure } from "@/components/lesson/figures/vulkan/MsaaFigure";

const r = String.raw;

export function MipmapsMsaaContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "vkMip_intro",
          "Two kinds of jagged, flickering pixels are left in the scene. When the cubes turn edge-on or move away, their texture shimmers, because each pixel then covers many texels and picks one of them almost at random. And the cube silhouettes are staircases, because each pixel is either inside a triangle or outside it. Both are aliasing: a signal with more detail than the pixel grid can hold, sampled once per pixel. This chapter fixes the first with mipmaps, pre-filtered smaller copies of the texture, and the second with multisample anti-aliasing (MSAA), which tests coverage at several points per pixel.")}
      </Lead>

      <H2>{tx(t, "vkMip_aliasTitle", "Minification: when a pixel covers many texels")}</H2>
      <p>
        {tx(t, "vkMip_aliasBody",
          "The fragment shader samples the texture once, at the uv of the pixel's centre. If the texture is shown larger than its resolution (magnified), neighbouring pixels read neighbouring points inside the same texel and LINEAR filtering blends smoothly between texels. If it is shown smaller (minified), neighbouring pixels land many texels apart. A pixel should show the average colour of everything it covers, but it gets one sample, or with LINEAR the blend of four texels around one point. Which texels those are changes with every tiny movement of the object, so the picture crawls and shimmers, and regular patterns turn into moiré.")}
      </p>

      <H2>{tx(t, "vkMip_chainTitle", "The mip chain")}</H2>
      <p>
        {tx(t, "vkMip_chainBody",
          "The fix is to pre-compute the averages. Level 0 is the texture itself; level 1 is half its width and height, each texel the average of a 2 × 2 block of level 0; level 2 halves level 1, and so on down to a single texel. When a pixel covers a 4 × 4 block of level-0 texels, the sampler reads level 2, where one texel already holds that block's average. The levels are called mipmaps, from the Latin multum in parvo, \"much in a small space\".")}
      </p>
      <Equation label={tx(t, "vkMip_eqLevels", "Number of levels and size of level i")}
        where={[
          [r`w,\ h`, tx(t, "vkMip_wWh", "width and height of level 0, in texels")],
          ["L", tx(t, "vkMip_wL", "the number of levels, down to and including 1 × 1: mipLevels in VkImageCreateInfo")],
          [r`w_i,\ h_i`, tx(t, "vkMip_wWi", "the size of level i; each dimension halves, rounding down, and stops at 1")],
        ]}>
        {r`L = \lfloor \log_2 \max(w, h) \rfloor + 1, \qquad w_i = \max\!\left(1, \left\lfloor w / 2^i \right\rfloor\right)`}
      </Equation>
      <p>
        {tx(t, "vkMip_chainEx",
          "Worked example: a 1024 × 512 texture. max(w, h) = 1024 = 2¹⁰, so L = 10 + 1 = 11 levels: 1024 × 512, 512 × 256, 256 × 128, …, 2 × 1, then 1 × 1, where the height has stopped at 1 one level before the width. A 300 × 200 texture: log₂ 300 = 8.23, so L = 9, ending 2 × 1, 1 × 1; each halving rounds down (300, 150, 75, 37, 18, 9, 4, 2, 1).")}
      </p>
      <p>
        {tx(t, "vkMip_memBody",
          "The memory cost is small. Each level has a quarter of the texels of the one above, so the whole chain adds a geometric series to level 0:")}
      </p>
      <Equation label={tx(t, "vkMip_eqMem", "Memory of a full mip chain, relative to level 0")}
        where={[
          [r`(1/4)^i`, tx(t, "vkMip_wQ", "level i has half the width and half the height, a quarter of the texels of level i − 1")],
        ]}>
        {r`\sum_{i=0}^{\infty} \left(\tfrac{1}{4}\right)^i = \frac{1}{1 - 1/4} = \frac{4}{3}`}
      </Equation>
      <p>
        {tx(t, "vkMip_memEx",
          "A third more memory: a 1024 × 1024 RGBA8 texture is 4 MiB alone and about 5.33 MiB with its mips. In exchange, distant surfaces read small levels that fit in the texture cache, which usually makes mipmapped rendering faster, not slower.")}
      </p>

      <H2>{tx(t, "vkMip_lodTitle", "Which level: ρ and λ")}</H2>
      <p>
        {tx(t, "vkMip_lodBody",
          "The GPU shades pixels in 2 × 2 quads, so it knows how much the uv changes from one pixel to the next: the screen-space derivatives ∂u/∂x, ∂v/∂x (to the pixel on the right) and ∂u/∂y, ∂v/∂y (to the pixel below). Multiplied by the texture size, they give how many level-0 texels one pixel step crosses:")}
      </p>
      <Equation label={tx(t, "vkMip_eqLod", "Texels per pixel and the level of detail")}
        where={[
          [r`\rho`, tx(t, "vkMip_wRho", "the footprint: level-0 texels crossed by one pixel step, along the worse of the two screen axes")],
          [r`\partial u / \partial x,\ \dots`, tx(t, "vkMip_wDeriv", "how much u (or v) changes between horizontally (or vertically) adjacent pixels; GLSL's dFdx and dFdy")],
          [r`w,\ h`, tx(t, "vkMip_wSize", "the texture size, which turns uv units into texels")],
          [r`\lambda`, tx(t, "vkMip_wLambda", "the level of detail: λ ≤ 0 means magnification (level 0, magFilter); λ = 2 means level 2, where one texel is one pixel")],
        ]}>
        {r`\rho = \max\!\left( \sqrt{\left(w\,\tfrac{\partial u}{\partial x}\right)^2 + \left(h\,\tfrac{\partial v}{\partial x}\right)^2},\ \sqrt{\left(w\,\tfrac{\partial u}{\partial y}\right)^2 + \left(h\,\tfrac{\partial v}{\partial y}\right)^2} \right), \qquad \lambda = \log_2 \rho`}
      </Equation>
      <p>
        {tx(t, "vkMip_lodEx",
          "Worked example: a 1024 × 1024 texture on a face 128 pixels wide, seen head-on. u goes from 0 to 1 across 128 pixels, so ∂u/∂x = 1/128 and w · ∂u/∂x = 8 texels per pixel; the same vertically. ρ = 8, λ = log₂ 8 = 3: level 3, which is 128 × 128, exactly one texel per pixel. If the face shrinks to 90 pixels, ρ = 11.4 and λ = 3.51, between levels 3 and 4.")}
      </p>
      <LessonTable
        headers={[tx(t, "vkMip_tSetting", "Sampler setting"), tx(t, "vkMip_tEffect", "Effect")]}
        rows={[
          ["mipmapMode = NEAREST", tx(t, "vkMip_s1", "use the one level nearest to λ. Cheaper, but a visible seam where the choice jumps from one level to the next.")],
          ["mipmapMode = LINEAR", tx(t, "vkMip_s2", "sample the two levels around λ and blend by its fractional part: with LINEAR min filtering this is trilinear filtering, 8 texels per sample. Our sampler already uses it.")],
          ["minLod, maxLod", tx(t, "vkMip_s3", "clamp λ. maxLod = VK_LOD_CLAMP_NONE allows every level; maxLod = 0 turns mipmapping off without touching the image.")],
          ["mipLodBias", tx(t, "vkMip_s4", "added to λ: a negative bias sharpens (and brings some shimmer back), a positive one blurs.")],
          [tx(t, "vkMip_s5a", "anisotropy"), tx(t, "vkMip_s5", "at grazing angles the footprint is a long thin ellipse, and ρ, taken from its long axis, makes the result blurry. Anisotropic filtering picks λ from the short axis and takes several samples along the long one (Textures chapter).")],
        ]}
      />
      <MipmapFigure t={t} />

      <H2>{tx(t, "vkMip_genTitle", "Generating the chain on the GPU")}</H2>
      <p>
        {tx(t, "vkMip_genBody",
          "Most engines ship textures with their mips already computed, in KTX2 or DDS files, often with a better filter than a 2 × 2 box. A PNG has only level 0, so we build the rest on the GPU right after the upload, with vkCmdBlitImage2: a copy between two image regions of different sizes, with filtering. Blitting level i − 1 into level i with LINEAR filtering samples each destination texel at the corner shared by four source texels, which averages them. For an _SRGB format the blit decodes to linear, averages and encodes again, so the mips keep the right brightness.")}
      </p>
      <p>
        {tx(t, "vkMip_featBody",
          "A blit with LINEAR filtering needs the format to support BLIT_SRC, BLIT_DST and SAMPLED_IMAGE_FILTER_LINEAR with optimal tiling. The specification guarantees all three for R8G8B8A8_SRGB, but not for every format (several float and compressed formats lack them), so a general loader checks:")}
      </p>
      <CodeBlock lang="cpp" filename="texture.cpp" t={t}>{`uint32_t mipLevelCount(uint32_t w, uint32_t h) {
    return uint32_t(std::floor(std::log2(std::max(w, h)))) + 1;   // 1024 × 512 → 11
}

bool canGenerateMips(VkPhysicalDevice gpu, VkFormat format) {
    VkFormatProperties props;
    vkGetPhysicalDeviceFormatProperties(gpu, format, &props);
    const VkFormatFeatureFlags need = VK_FORMAT_FEATURE_BLIT_SRC_BIT | VK_FORMAT_FEATURE_BLIT_DST_BIT
                                    | VK_FORMAT_FEATURE_SAMPLED_IMAGE_FILTER_LINEAR_BIT;
    return (props.optimalTilingFeatures & need) == need;
}`}</CodeBlock>
      <p>
        {tx(t, "vkMip_imgBody",
          "createImage learns about levels and, for later in this chapter, samples. Both parameters have defaults, so every existing call stays as it is. The view covers every level, so the sampler can reach them all. transitionImage gains the range of levels it applies to, also with defaults (level 0, one level).")}
      </p>
      <CodeBlock lang="cpp" filename="image.cpp" t={t}>{`// Image gains: uint32_t mipLevels = 1;
Image createImage(App& app, VkExtent3D extent, VkFormat format, VkImageUsageFlags usage,
                  VkImageAspectFlags aspect, uint32_t mipLevels = 1,
                  VkSampleCountFlagBits samples = VK_SAMPLE_COUNT_1_BIT) {
    Image img{.extent = extent, .format = format, .mipLevels = mipLevels};
    // ... as before, with:
    info.mipLevels = mipLevels;
    info.samples   = samples;
    // ... and in the view:
    view.subresourceRange = {aspect, 0, mipLevels, 0, 1};   // every level is visible to the sampler
}

void transitionImage(VkCommandBuffer cmd, VkImage image, VkImageLayout oldLayout, VkImageLayout newLayout,
                     VkPipelineStageFlags2 srcStage, VkAccessFlags2 srcAccess,
                     VkPipelineStageFlags2 dstStage, VkAccessFlags2 dstAccess,
                     VkImageAspectFlags aspect = VK_IMAGE_ASPECT_COLOR_BIT,
                     uint32_t baseMip = 0, uint32_t levelCount = 1) {
    // ... as before, with:
    barrier.subresourceRange = {aspect, baseMip, levelCount, 0, 1};
}`}</CodeBlock>
      <p>
        {tx(t, "vkMip_loopBody",
          "Each level is written once (by the copy or a blit) and then read once (by the next blit), so each level makes its own trip through the layouts: TRANSFER_DST while it is written, TRANSFER_SRC while the next level is made from it, then SHADER_READ_ONLY. The barriers are per level, because at any moment different levels are in different layouts.")}
      </p>
      <CodeBlock lang="cpp" filename="texture.cpp" t={t}>{`void generateMipmaps(VkCommandBuffer cmd, const Image& img) {
    int32_t w = int32_t(img.extent.width), h = int32_t(img.extent.height);
    for (uint32_t i = 1; i < img.mipLevels; ++i) {
        // a. Level i − 1 has just been written (by the copy or the previous blit): make it a source
        transitionImage(cmd, img.image, VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL, VK_IMAGE_LAYOUT_TRANSFER_SRC_OPTIMAL,
            VK_PIPELINE_STAGE_2_ALL_TRANSFER_BIT, VK_ACCESS_2_TRANSFER_WRITE_BIT,
            VK_PIPELINE_STAGE_2_BLIT_BIT, VK_ACCESS_2_TRANSFER_READ_BIT,
            VK_IMAGE_ASPECT_COLOR_BIT, i - 1, 1);

        // b. Halve it into level i
        const int32_t nw = std::max(w / 2, 1), nh = std::max(h / 2, 1);
        VkImageBlit2 region{};
        region.sType          = VK_STRUCTURE_TYPE_IMAGE_BLIT_2;
        region.srcSubresource = {VK_IMAGE_ASPECT_COLOR_BIT, i - 1, 0, 1};   // aspect, level, first layer, layers
        region.srcOffsets[1]  = {w, h, 1};                                   // [0] stays {0, 0, 0}: the whole level
        region.dstSubresource = {VK_IMAGE_ASPECT_COLOR_BIT, i, 0, 1};
        region.dstOffsets[1]  = {nw, nh, 1};
        VkBlitImageInfo2 blit{};
        blit.sType          = VK_STRUCTURE_TYPE_BLIT_IMAGE_INFO_2;
        blit.srcImage       = img.image;
        blit.srcImageLayout = VK_IMAGE_LAYOUT_TRANSFER_SRC_OPTIMAL;
        blit.dstImage       = img.image;                                     // same image, next level
        blit.dstImageLayout = VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL;
        blit.regionCount    = 1;
        blit.pRegions       = &region;
        blit.filter         = VK_FILTER_LINEAR;                              // average, do not pick
        vkCmdBlitImage2(cmd, &blit);

        // c. Level i − 1 is final: hand it to the fragment shader
        transitionImage(cmd, img.image, VK_IMAGE_LAYOUT_TRANSFER_SRC_OPTIMAL, VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL,
            VK_PIPELINE_STAGE_2_BLIT_BIT, VK_ACCESS_2_NONE,                  // it was only read: nothing to flush
            VK_PIPELINE_STAGE_2_FRAGMENT_SHADER_BIT, VK_ACCESS_2_SHADER_SAMPLED_READ_BIT,
            VK_IMAGE_ASPECT_COLOR_BIT, i - 1, 1);
        w = nw;
        h = nh;
    }
    // The last level was written and never read: straight to the shader
    transitionImage(cmd, img.image, VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL, VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL,
        VK_PIPELINE_STAGE_2_ALL_TRANSFER_BIT, VK_ACCESS_2_TRANSFER_WRITE_BIT,
        VK_PIPELINE_STAGE_2_FRAGMENT_SHADER_BIT, VK_ACCESS_2_SHADER_SAMPLED_READ_BIT,
        VK_IMAGE_ASPECT_COLOR_BIT, img.mipLevels - 1, 1);
}`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "vkMip_tChoice", "Choice"), tx(t, "vkMip_tReason", "Reason")]}
        rows={[
          [tx(t, "vkMip_c1", "src stage ALL_TRANSFER in step a"), tx(t, "vkMip_c1b", "level 0 was written by the copy (COPY stage), the others by a blit (BLIT stage); ALL_TRANSFER covers both, so one line serves every level.")],
          [tx(t, "vkMip_c2", "src access NONE in step c"), tx(t, "vkMip_c2b", "the blit only read level i − 1. A write-after-read needs the execution dependency (the layout change must wait for the reads) but no memory to be made available.")],
          [tx(t, "vkMip_c3", "std::max(w / 2, 1)"), tx(t, "vkMip_c3b", "a non-square texture reaches 1 in one dimension first; a zero-sized region would be invalid.")],
          [tx(t, "vkMip_c4", "odd sizes"), tx(t, "vkMip_c4b", "halving 75 gives 37, so the blit squeezes 75 texels into 37 and a few source texels get slightly less weight. Offline tools handle this exactly; for textures it is invisible.")],
        ]}
      />
      <CodeBlock lang="cpp" filename="texture.cpp" t={t}>{`// loadTexture, changed lines:
const uint32_t levels = mipLevelCount(uint32_t(w), uint32_t(h));
Image tex = createImage(app, {uint32_t(w), uint32_t(h), 1}, VK_FORMAT_R8G8B8A8_SRGB,
    VK_IMAGE_USAGE_TRANSFER_SRC_BIT |                        // new: the blits read from it
    VK_IMAGE_USAGE_TRANSFER_DST_BIT | VK_IMAGE_USAGE_SAMPLED_BIT,
    VK_IMAGE_ASPECT_COLOR_BIT, levels);
immediateSubmit(app, [&](VkCommandBuffer cmd) {
    transitionImage(cmd, tex.image, VK_IMAGE_LAYOUT_UNDEFINED, VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL,
        VK_PIPELINE_STAGE_2_NONE, VK_ACCESS_2_NONE,
        VK_PIPELINE_STAGE_2_COPY_BIT, VK_ACCESS_2_TRANSFER_WRITE_BIT,
        VK_IMAGE_ASPECT_COLOR_BIT, 0, levels);               // every level at once
    vkCmdCopyBufferToImage2(cmd, &copy);                     // into level 0, as before
    generateMipmaps(cmd, tex);                               // replaces the final transition
});`}</CodeBlock>
      <p>
        {tx(t, "vkMip_samplerBody",
          "The sampler from the Textures chapter already has mipmapMode = LINEAR and maxLod = VK_LOD_CLAMP_NONE, so nothing else changes: the texture is now sampled trilinearly, with anisotropy on top.")}
      </p>

      <H2>{tx(t, "vkMip_msaaTitle", "Edge aliasing and multisampling")}</H2>
      <p>
        {tx(t, "vkMip_msaaBody",
          "Mipmaps smooth what happens inside a triangle. The staircase along a triangle's edge has a different cause: the rasterizer tests one point per pixel, its centre, and the pixel is either fully the triangle's colour or not at all. Rendering at a higher resolution and shrinking the result (supersampling) fixes it, at the cost of shading every extra pixel. MSAA is the cheaper version:")}
      </p>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "vkMip_m1", "Each pixel of the colour and depth attachments holds S samples, at fixed positions inside the pixel.")}</li>
        <li>{tx(t, "vkMip_m2", "Coverage and the depth test are evaluated for every sample.")}</li>
        <li>{tx(t, "vkMip_m3", "The fragment shader runs once per pixel the triangle touches, as before, and its output is written to every covered sample that passed the depth test.")}</li>
        <li>{tx(t, "vkMip_m4", "At the end of rendering, a resolve averages each pixel's samples into an ordinary single-sample image: the swapchain image.")}</li>
      </ol>
      <Equation label={tx(t, "vkMip_eqResolve", "The resolved colour of one pixel")}
        where={[
          ["S", tx(t, "vkMip_wS", "the sample count, rasterizationSamples: 1, 2, 4, 8 (sometimes 16, 32, 64)")],
          [r`c_s`, tx(t, "vkMip_wCs", "the colour stored in sample s: the shader output of the last triangle that covered it and passed the depth test")],
        ]}>
        {r`c_{\text{pixel}} = \frac{1}{S} \sum_{s=1}^{S} c_s`}
      </Equation>
      <p>
        {tx(t, "vkMip_msaaEx",
          "An edge pixel with 3 of its 4 samples inside an orange triangle and 1 on the dark background resolves to 3/4 orange + 1/4 background: one of the in-between shades that make the edge look smooth. Inside a triangle, all samples hold the same colour and the average changes nothing, which is why MSAA costs little shading: only pixels on edges, where two or more triangles meet, run the shader more than once.")}
      </p>
      <MsaaFigure t={t} />
      <p>
        {tx(t, "vkMip_costBody",
          "The cost is memory and bandwidth. At 1920 × 1080 (2,073,600 pixels) with 4 samples, a 4-byte colour format and D32 depth take 2,073,600 × 4 × (4 + 4) bytes = 66 MB, against 16.6 MB without MSAA, plus the resolved image. On desktop GPUs that traffic is real but compressed; on tile-based mobile GPUs the samples live in on-chip tile memory, the resolve happens there, and the multisampled images never need to exist in RAM at all, which makes 4× MSAA almost free.")}
      </p>

      <H2>{tx(t, "vkMip_countTitle", "Choosing the sample count")}</H2>
      <p>
        {tx(t, "vkMip_countBody",
          "The colour and depth attachments must have the same sample count, so the count must be supported for both: the intersection of two device limits. The specification requires 1 and 4 in both, so asking for 4 always works; 8 is common on desktop GPUs.")}
      </p>
      <CodeBlock lang="cpp" filename="msaa.cpp" t={t}>{`VkSampleCountFlagBits pickSampleCount(VkPhysicalDevice gpu, VkSampleCountFlagBits wanted) {
    VkPhysicalDeviceProperties props;
    vkGetPhysicalDeviceProperties(gpu, &props);
    const VkSampleCountFlags ok = props.limits.framebufferColorSampleCounts
                                & props.limits.framebufferDepthSampleCounts;   // both attachments
    for (uint32_t s = wanted; s > 1; s >>= 1)                // 8 → 4 → 2
        if (ok & s) return VkSampleCountFlagBits(s);
    return VK_SAMPLE_COUNT_1_BIT;
}
// App gains: VkSampleCountFlagBits samples; Image msaaColor;
// after pickGpu:  app.samples = pickSampleCount(app.gpu, VK_SAMPLE_COUNT_4_BIT);`}</CodeBlock>

      <H2>{tx(t, "vkMip_targetsTitle", "Multisampled render targets")}</H2>
      <p>
        {tx(t, "vkMip_targetsBody",
          "Swapchain images always have one sample, so we render into our own multisampled colour image and resolve into the swapchain image. The depth image becomes multisampled too. Both are only used during the frame, so they get the TRANSIENT_ATTACHMENT usage, which tells the driver their contents never need to reach memory. createDepth becomes createRenderTargets:")}
      </p>
      <CodeBlock lang="cpp" filename="msaa.cpp" t={t}>{`void createRenderTargets(App& app) {          // replaces createDepth; rebuilt in recreateSwapchain
    const VkExtent3D size{app.swapExtent.width, app.swapExtent.height, 1};
    app.msaaColor = createImage(app, size, app.swapFormat,         // same format as the resolve target
        VK_IMAGE_USAGE_COLOR_ATTACHMENT_BIT | VK_IMAGE_USAGE_TRANSIENT_ATTACHMENT_BIT,
        VK_IMAGE_ASPECT_COLOR_BIT, 1, app.samples);
    app.depth = createImage(app, size, app.depthFormat,
        VK_IMAGE_USAGE_DEPTH_STENCIL_ATTACHMENT_BIT | VK_IMAGE_USAGE_TRANSIENT_ATTACHMENT_BIT,
        VK_IMAGE_ASPECT_DEPTH_BIT, 1, app.samples);                 // must match the colour sample count
}
// Retired (Frames in Flight chapter) gains: Image msaaColor;  destroyRetired destroys it too.`}</CodeBlock>
      <H3>{tx(t, "vkMip_recordTitle", "The pipeline and the resolve")}</H3>
      <p>
        {tx(t, "vkMip_recordBody",
          "The pipeline must be created for the same sample count as the attachments. In dynamic rendering the resolve is part of the colour attachment: the attachment is the multisampled image, and resolveImageView names the single-sample image to average into when rendering ends.")}
      </p>
      <CodeBlock lang="cpp" filename="pipeline.cpp / commands.cpp" t={t}>{`// createPipeline:
multisample.rasterizationSamples = app.samples;               // was VK_SAMPLE_COUNT_1_BIT

// recordFrame, next to the depth transition: the samples of last frame are not needed
transitionImage(cmd, app.msaaColor.image, VK_IMAGE_LAYOUT_UNDEFINED, VK_IMAGE_LAYOUT_COLOR_ATTACHMENT_OPTIMAL,
    VK_PIPELINE_STAGE_2_COLOR_ATTACHMENT_OUTPUT_BIT, VK_ACCESS_2_COLOR_ATTACHMENT_WRITE_BIT,   // previous frame
    VK_PIPELINE_STAGE_2_COLOR_ATTACHMENT_OUTPUT_BIT, VK_ACCESS_2_COLOR_ATTACHMENT_WRITE_BIT);

color.imageView          = app.msaaColor.view;                 // draw into the samples...
color.imageLayout        = VK_IMAGE_LAYOUT_COLOR_ATTACHMENT_OPTIMAL;
color.resolveMode        = VK_RESOLVE_MODE_AVERAGE_BIT;        // ...average them when rendering ends...
color.resolveImageView   = app.swapViews[imageIndex];          // ...into the swapchain image
color.resolveImageLayout = VK_IMAGE_LAYOUT_COLOR_ATTACHMENT_OPTIMAL;
color.loadOp             = VK_ATTACHMENT_LOAD_OP_CLEAR;
color.storeOp            = VK_ATTACHMENT_STORE_OP_DONT_CARE;   // the samples are not needed after the resolve
// depthAtt.imageView = app.depth.view as before: it is multisampled now, nothing else changes`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "vkMip_tChoice", "Choice"), tx(t, "vkMip_tReason", "Reason")]}
        rows={[
          [tx(t, "vkMip_d1", "swapchain transitions unchanged"), tx(t, "vkMip_d1b", "the resolve writes the swapchain image in the COLOR_ATTACHMENT_OUTPUT stage with COLOR_ATTACHMENT_WRITE access, exactly like drawing into it did, so both of its barriers stay as they were.")],
          [tx(t, "vkMip_d2", "msaaColor: src COLOR_ATTACHMENT_OUTPUT / WRITE"), tx(t, "vkMip_d2b", "the previous frame wrote (and resolved from) the same image; its writes must finish before this frame clears it: the same write-after-write reasoning as for depth.")],
          [tx(t, "vkMip_d3", "storeOp DONT_CARE on the samples"), tx(t, "vkMip_d3b", "only the resolved result is kept. Storing the samples would write 4 × the colour data to memory for nothing.")],
          [tx(t, "vkMip_d4", "resolveMode AVERAGE"), tx(t, "vkMip_d4b", "the box average of the equation above. Integer colour formats cannot be averaged and must use SAMPLE_ZERO; depth can be resolved too (SAMPLE_ZERO, MIN or MAX, core since 1.2) when a later pass needs it.")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "vkMip_shadingNote", "MSAA smooths geometry edges only. A high-contrast texture or a sharp specular highlight inside a triangle is still sampled once per pixel. Setting sampleShadingEnable with minSampleShading = 1.0 runs the fragment shader for every sample (the sampleRateShading device feature), which fixes that at up to S times the shading cost. Mipmaps handle the texture case much more cheaply, which is why the two techniques are used together.")}
      </Callout>
      <Callout type="tip" t={t}>
        {tx(t, "vkMip_run", "Build and run: turn the cubes edge-on and push the camera back (eye at z = 8): the texture fades smoothly to its average instead of crawling, and the cube outlines are soft instead of stair-stepped. Set maxLod = 0 in the sampler to switch mips off, and app.samples to VK_SAMPLE_COUNT_1_BIT (with resolveMode NONE and the swapchain view as the attachment) to switch MSAA off, and compare.")}
      </Callout>

      <H2>{tx(t, "vkMip_shutdownTitle", "Shutdown, updated")}</H2>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`destroyImage(app, app.msaaColor);       // with the depth image: both have the swapchain's size
destroyImage(app, app.depth);
// the texture's destroyImage frees every mip level with the image`}</CodeBlock>

      <H2>{tx(t, "vkMip_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "vkMip_tMistake", "Mistake"), tx(t, "vkMip_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "vkMip_e1", "View with levelCount = 1 on a mipmapped image"), tx(t, "vkMip_e1b", "the sampler sees only level 0 and the texture shimmers as before. The view must cover all levels.")],
          [tx(t, "vkMip_e2", "Forgetting TRANSFER_SRC usage"), tx(t, "vkMip_e2b", "a validation error at the first blit: the image cannot be a transfer source.")],
          [tx(t, "vkMip_e3", "One barrier for all levels inside the loop"), tx(t, "vkMip_e3b", "the levels are in different layouts at that moment; the old layout does not match for most of them, which is a validation error and undefined contents.")],
          [tx(t, "vkMip_e4", "Leaving the last level in TRANSFER_DST"), tx(t, "vkMip_e4b", "the loop only transitions levels it has read from. The smallest level must be transitioned separately, or sampling it is an error about the layout.")],
          [tx(t, "vkMip_e5", "Depth and colour with different sample counts"), tx(t, "vkMip_e5b", "a validation error at vkCmdBeginRendering. Create both with app.samples.")],
          [tx(t, "vkMip_e6", "rasterizationSamples not matching the attachments"), tx(t, "vkMip_e6b", "a validation error at the draw. Every pipeline used in the pass, including later ones such as the particles of the next chapter, needs the same count.")],
          [tx(t, "vkMip_e7", "Storing the multisampled image"), tx(t, "vkMip_e7b", "correct but wasteful: storeOp STORE writes all samples to memory. DONT_CARE plus the resolve is enough.")],
          [tx(t, "vkMip_e8", "Expecting MSAA to fix texture shimmer"), tx(t, "vkMip_e8b", "it only adds samples along edges. Mipmaps (and sample shading, if needed) handle the inside of triangles.")],
        ]}
      />

      <KeyIdeas t={t} id="vkMip" items={[
        "Minification aliasing: one sample per pixel cannot represent the many texels a pixel covers, so textures shimmer and form moiré.",
        "A mip chain holds successively halved, averaged copies: L = ⌊log₂ max(w, h)⌋ + 1 levels for 4/3 of the memory.",
        "The GPU picks the level from the screen-space uv derivatives: ρ texels per pixel, λ = log₂ ρ; LINEAR mipmapMode blends two levels (trilinear).",
        "vkCmdBlitImage2 with LINEAR filtering halves each level into the next; each level goes TRANSFER_DST → TRANSFER_SRC → SHADER_READ_ONLY with its own barriers.",
        "MSAA stores S samples per pixel, tests coverage and depth per sample, shades once per pixel, and resolves by averaging.",
        "Colour and depth attachments and every pipeline in the pass must use the same sample count; 4 is always supported.",
        "In dynamic rendering the resolve is part of the colour attachment: resolveMode AVERAGE, resolveImageView = the swapchain view, samples stored with DONT_CARE.",
        "Multisampled targets are TRANSIENT_ATTACHMENT; on tile-based GPUs they never leave on-chip memory.",
      ]} />
    </Article>
  );
}
