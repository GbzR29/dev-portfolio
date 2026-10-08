"use client";

// Resources 4: textures and samplers — images versus buffers (tiling, formats,
// layouts); the Image helper (create, memory, view); decoding a PNG with
// stb_image and the sRGB question (Srgb figure, worked example); the upload
// with its two layout transitions (TextureUpload "break it" figure); the
// sampler, bilinear filtering and address modes (Sampler figure, worked
// example); a material descriptor set; UVs in the vertex and the shaders;
// shutdown; mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { SrgbFigure } from "@/components/lesson/figures/vulkan/SrgbFigure";
import { TextureUploadFigure } from "@/components/lesson/figures/vulkan/TextureUploadFigure";
import { SamplerFigure } from "@/components/lesson/figures/vulkan/SamplerFigure";
import { VulkanObjectsFigure } from "@/components/lesson/figures/vulkan/VulkanObjectsFigure";

const r = String.raw;

export function TexturesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "vkTex_intro",
          "A texture is an image the fragment shader reads colours from. In OpenGL, glTexImage2D took the pixels and the driver did the rest: it allocated memory, chose a memory arrangement, copied, and tracked how the texture was being used. In Vulkan each of those is a step you write. This chapter creates a VkImage and its memory, decodes a PNG, uploads it through a staging buffer with two layout transitions, creates a sampler that says how to filter it, and hands both to the shader in a second descriptor set. The two quads become textured.")}
      </Lead>

      <Goals t={t} id="vkTex" items={[
        "Create an image, give it memory and make a view of it.",
        "Upload a PNG to the GPU and move it to a layout shaders can read.",
        "Choose between an sRGB and a linear format for a texture.",
        "Create a sampler and bind the texture to a shader.",
      ]} />

      <H2>{tx(t, "vkTex_imagesTitle", "Images are not buffers")}</H2>
      <p>
        {tx(t, "vkTex_imagesBody",
          "A VkBuffer is a straight run of bytes, and byte k is at offset k. A VkImage is a grid of texels with a format, and where texel (x, y) lives in memory is up to the GPU. With VK_IMAGE_TILING_OPTIMAL, the tiling every sampled image should use, the texels are stored in small tiles or along a Z-shaped curve, so that texels that are neighbours in 2D are also neighbours in memory. Filtering reads a 2 × 2 block, and a triangle covers a 2D patch of the texture, so this arrangement is what makes texture caches work. The arrangement is private to the driver and differs between vendors, which has one practical consequence: the CPU cannot write pixels into an optimal image. The pixels go into a buffer first, and a GPU copy command, which knows the arrangement, puts them in place.")}
      </p>
      <LessonTable
        headers={[tx(t, "vkTex_tField", "VkImageCreateInfo field"), tx(t, "vkTex_tMeaning", "Meaning")]}
        rows={[
          ["imageType", tx(t, "vkTex_i1", "1D, 2D or 3D. A texture is 2D; cube maps and texture arrays are 2D images with several array layers.")],
          ["format", tx(t, "vkTex_i2", "how one texel is stored, for example VK_FORMAT_R8G8B8A8_SRGB: four 8-bit channels, colour decoded from sRGB when sampled.")],
          ["extent", tx(t, "vkTex_i3", "width, height and depth in texels; depth is 1 for a 2D image.")],
          ["mipLevels", tx(t, "vkTex_i4", "how many successively halved copies the image holds; 1 here, more in the Mipmaps chapter.")],
          ["arrayLayers", tx(t, "vkTex_i5", "how many images of the same size in one object; 1 here, 6 for a cube map.")],
          ["samples", tx(t, "vkTex_i6", "samples per texel; 1 except for multisampled render targets (MSAA).")],
          ["tiling", tx(t, "vkTex_i7", "OPTIMAL (driver-chosen arrangement) or LINEAR (plain rows, CPU-writable, but very limited: often no sampling support at all).")],
          ["usage", tx(t, "vkTex_i8", "every way the image will be used, as with buffers: TRANSFER_DST to be copied into, SAMPLED to be read by shaders, COLOR_ATTACHMENT or DEPTH_STENCIL_ATTACHMENT to be rendered into.")],
          ["initialLayout", tx(t, "vkTex_i9", "UNDEFINED (or PREINITIALIZED for linear images): a new image has no meaningful contents yet.")],
        ]}
      />

      <H3>{tx(t, "vkTex_layoutsTitle", "Layouts")}</H3>
      <p>
        {tx(t, "vkTex_layoutsBody",
          "Besides its fixed tiling, an image has a layout that changes during its life. A layout tells the GPU which job the image is prepared for, and the GPU may store the texels differently for each job: compressed for rendering, decompressed for sampling, rearranged for the copy engine. You already met three layouts on the swapchain images. A texture needs two new ones, and every change of layout is recorded as a barrier, the same transitionImage helper from the Command Buffers chapter:")}
      </p>
      <LessonTable
        headers={[tx(t, "vkTex_tLayout", "Layout"), tx(t, "vkTex_tFor", "Prepared for")]}
        rows={[
          ["UNDEFINED", tx(t, "vkTex_l1", "nothing: the contents may be thrown away. Valid only as the old layout of a transition.")],
          ["TRANSFER_DST_OPTIMAL", tx(t, "vkTex_l2", "being the destination of a copy (vkCmdCopyBufferToImage2, blits).")],
          ["SHADER_READ_ONLY_OPTIMAL", tx(t, "vkTex_l3", "being sampled or read by shaders.")],
          ["COLOR_ATTACHMENT_OPTIMAL", tx(t, "vkTex_l4", "being rendered into as a colour attachment.")],
          ["DEPTH_ATTACHMENT_OPTIMAL", tx(t, "vkTex_l5", "being the depth attachment (next chapter).")],
          ["PRESENT_SRC_KHR", tx(t, "vkTex_l6", "being shown by the presentation engine.")],
          ["GENERAL", tx(t, "vkTex_l7", "anything, including storage-image writes from compute shaders; on many GPUs slower for the jobs above.")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "vkTex_layoutNote", "Vulkan 1.3 also has the generic READ_ONLY_OPTIMAL and ATTACHMENT_OPTIMAL layouts, which pick the right variant from the image's format. Recent drivers add VK_KHR_unified_image_layouts, which lets most images stay in GENERAL at no cost. This track keeps the specific layouts: they are what the validation messages and every existing codebase use.")}
      </Callout>

      <H2>{tx(t, "vkTex_helperTitle", "An Image helper")}</H2>
      <p>
        {tx(t, "vkTex_helperBody",
          "Creating an image follows the pattern of createBuffer: create the object, ask for its memory requirements, allocate a matching memory type, bind. An image is always used through a view, so the helper creates that too. The depth buffer of the next chapter uses the same function with a different format, usage and aspect.")}
      </p>
      <CodeBlock lang="cpp" filename="image.cpp" t={t}>{`struct Image {
    VkImage        image  = VK_NULL_HANDLE;
    VkDeviceMemory memory = VK_NULL_HANDLE;
    VkImageView    view   = VK_NULL_HANDLE;
    VkExtent3D     extent{};
    VkFormat       format = VK_FORMAT_UNDEFINED;
};

Image createImage(App& app, VkExtent3D extent, VkFormat format,
                  VkImageUsageFlags usage, VkImageAspectFlags aspect) {
    Image img{.extent = extent, .format = format};

    VkImageCreateInfo info{};
    info.sType         = VK_STRUCTURE_TYPE_IMAGE_CREATE_INFO;
    info.imageType     = VK_IMAGE_TYPE_2D;
    info.format        = format;
    info.extent        = extent;                       // depth = 1 for a 2D image
    info.mipLevels     = 1;                            // the Mipmaps chapter raises this
    info.arrayLayers   = 1;
    info.samples       = VK_SAMPLE_COUNT_1_BIT;
    info.tiling        = VK_IMAGE_TILING_OPTIMAL;      // GPU-friendly arrangement
    info.usage         = usage;
    info.sharingMode   = VK_SHARING_MODE_EXCLUSIVE;    // one queue family at a time
    info.initialLayout = VK_IMAGE_LAYOUT_UNDEFINED;
    VK_CHECK(vkCreateImage(app.device, &info, nullptr, &img.image));

    VkMemoryRequirements req;                          // size, alignment, allowed memory types
    vkGetImageMemoryRequirements(app.device, img.image, &req);
    VkMemoryAllocateInfo alloc{};
    alloc.sType           = VK_STRUCTURE_TYPE_MEMORY_ALLOCATE_INFO;
    alloc.allocationSize  = req.size;                  // may exceed w·h·4: padding, tiling
    alloc.memoryTypeIndex = findMemoryType(app.gpu, req.memoryTypeBits, VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT);
    VK_CHECK(vkAllocateMemory(app.device, &alloc, nullptr, &img.memory));
    VK_CHECK(vkBindImageMemory(app.device, img.image, img.memory, 0));

    VkImageViewCreateInfo view{};
    view.sType            = VK_STRUCTURE_TYPE_IMAGE_VIEW_CREATE_INFO;
    view.image            = img.image;
    view.viewType         = VK_IMAGE_VIEW_TYPE_2D;
    view.format           = format;
    view.subresourceRange = {aspect, 0, 1, 0, 1};      // aspect, first mip, mip count, first layer, layer count
    VK_CHECK(vkCreateImageView(app.device, &view, nullptr, &img.view));
    return img;
}

void destroyImage(App& app, Image& img) {
    vkDestroyImageView(app.device, img.view, nullptr);  // the view first: it refers to the image
    vkDestroyImage(app.device, img.image, nullptr);
    vkFreeMemory(app.device, img.memory, nullptr);
    img = {};
}`}</CodeBlock>
      <p>
        {tx(t, "vkTex_reqBody",
          "req.size is often larger than width × height × bytes per texel, because the optimal arrangement pads the image to whole tiles, and req.alignment is often larger than for buffers (64 KiB is common). That is another reason to allocate what the requirements say, never what you computed.")}
      </p>

      <H2>{tx(t, "vkTex_pixelsTitle", "Decoding the pixels, and the sRGB question")}</H2>
      <p>
        {tx(t, "vkTex_pixelsBody",
          "PNG and JPEG are compressed files; the GPU wants raw texels. stb_image, a single-header C library, decodes both. Its last parameter is the number of channels you want back, whatever the file contains. RGB files have no alpha, and no common GPU format has three 8-bit channels (R8G8B8 is almost never supported for sampling), so we always ask for four with STBI_rgb_alpha.")}
      </p>
      <p>
        {tx(t, "vkTex_srgbBody",
          "The second decision is the format, and it is about what the bytes mean. A photo or a painted texture stores colour encoded with the sRGB curve, the same curve the Swapchain chapter chose for the output. Lighting has to be computed on linear values. With VK_FORMAT_R8G8B8A8_SRGB, the sampler decodes each texel to linear before the shader sees it, and filtering happens after decoding, as it should. With R8G8B8A8_UNORM the byte b is returned as b / 255, unchanged. Colour textures therefore use _SRGB. Textures that hold data rather than colour (normal maps, roughness, masks, height maps) use _UNORM, because their numbers were never encoded.")}
      </p>
      <SrgbFigure t={t} />
      <H3>{tx(t, "vkTex_srgbWorkedTitle", "Worked example: byte 128, lit at 50%")}</H3>
      <Equation label={tx(t, "vkTex_eqDecode", "sRGB decode (what an _SRGB format does when sampled)")}
        where={[
          ["c", tx(t, "vkTex_wC", "the stored value as a fraction: byte / 255")],
          ["v", tx(t, "vkTex_wV", "the linear value the shader receives")],
          ["0.04045,\\ 12.92", tx(t, "vkTex_wLin", "below this threshold the curve is a straight line with slope 1 / 12.92, which avoids an infinite slope at 0")],
          ["0.055,\\ 1.055,\\ 2.4", tx(t, "vkTex_wPow", "offset, scale and exponent of the power segment; together they approximate a gamma of 2.2")],
        ]}>
        {r`v = \begin{cases} c / 12.92 & c \le 0.04045 \\ \left(\dfrac{c + 0.055}{1.055}\right)^{2.4} & \text{otherwise} \end{cases}`}
      </Equation>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "vkTex_s1", "The file stores 128, so c = 128 / 255 = 0.502. Above the threshold: v = ((0.502 + 0.055) / 1.055)^2.4 = 0.528^2.4 = 0.216. Mid-grey in the file is only 21.6% of full light.")}</li>
        <li>{tx(t, "vkTex_s2", "The shader multiplies by a light of 0.5: 0.216 · 0.5 = 0.108 of full light, physically half as bright.")}</li>
        <li>{tx(t, "vkTex_s3", "The _SRGB swapchain encodes it: 1.055 · 0.108^(1/2.4) − 0.055 = 0.362, stored as round(0.362 · 255) = 92.")}</li>
        <li>{tx(t, "vkTex_s4", "With UNORM texture and UNORM swapchain, the shader halves 0.502 to 0.251 and stores 64: far darker than 92, because halving an encoded value is not halving the light. At light 1 both paths store 128, which is why the mistake looks fine until something is shaded.")}</li>
      </ol>

      <H2>{tx(t, "vkTex_uploadTitle", "The upload")}</H2>
      <p>
        {tx(t, "vkTex_uploadBody",
          "The upload reuses the Staging chapter's pieces: a host-visible staging buffer, immediateSubmit, and a fence wait before the staging buffer is destroyed. What is new is the image side. The image starts in UNDEFINED; it must be in TRANSFER_DST_OPTIMAL for the copy, and in SHADER_READ_ONLY_OPTIMAL before any shader samples it. transitionImage moves out of commands.cpp into a shared header, unchanged, so both files can use it.")}
      </p>
      <CodeBlock lang="cpp" filename="texture.cpp" t={t}>{`#define STB_IMAGE_IMPLEMENTATION                     // in exactly one .cpp file
#include <stb_image.h>

Image loadTexture(App& app, const char* path) {
    int w = 0, h = 0, channelsInFile = 0;
    stbi_uc* pixels = stbi_load(path, &w, &h, &channelsInFile, STBI_rgb_alpha);   // always 4 bytes per pixel
    if (!pixels) throw std::runtime_error(std::string("cannot load ") + path + ": " + stbi_failure_reason());
    const VkDeviceSize size = VkDeviceSize(w) * h * 4;

    Buffer staging = createBuffer(app, size, VK_BUFFER_USAGE_TRANSFER_SRC_BIT,
        VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT | VK_MEMORY_PROPERTY_HOST_COHERENT_BIT);
    std::memcpy(staging.mapped, pixels, size);
    stbi_image_free(pixels);                          // the CPU copy is no longer needed

    Image tex = createImage(app, {uint32_t(w), uint32_t(h), 1}, VK_FORMAT_R8G8B8A8_SRGB,
        VK_IMAGE_USAGE_TRANSFER_DST_BIT | VK_IMAGE_USAGE_SAMPLED_BIT, VK_IMAGE_ASPECT_COLOR_BIT);

    immediateSubmit(app, [&](VkCommandBuffer cmd) {
        // 1. UNDEFINED → TRANSFER_DST: nothing before it; the copy's writes wait for it
        transitionImage(cmd, tex.image, VK_IMAGE_LAYOUT_UNDEFINED, VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL,
            VK_PIPELINE_STAGE_2_NONE, VK_ACCESS_2_NONE,
            VK_PIPELINE_STAGE_2_COPY_BIT, VK_ACCESS_2_TRANSFER_WRITE_BIT);

        // 2. Buffer → image
        VkBufferImageCopy2 region{};
        region.sType             = VK_STRUCTURE_TYPE_BUFFER_IMAGE_COPY_2;
        region.bufferOffset      = 0;
        region.bufferRowLength   = 0;                  // 0 = rows are tightly packed (w texels)
        region.bufferImageHeight = 0;                  // 0 = h rows per image
        region.imageSubresource  = {VK_IMAGE_ASPECT_COLOR_BIT, 0, 0, 1};   // aspect, mip, first layer, layers
        region.imageOffset       = {0, 0, 0};
        region.imageExtent       = tex.extent;
        VkCopyBufferToImageInfo2 copy{};
        copy.sType          = VK_STRUCTURE_TYPE_COPY_BUFFER_TO_IMAGE_INFO_2;
        copy.srcBuffer      = staging.buffer;
        copy.dstImage       = tex.image;
        copy.dstImageLayout = VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL;   // the layout it is in now
        copy.regionCount    = 1;
        copy.pRegions       = &region;
        vkCmdCopyBufferToImage2(cmd, &copy);

        // 3. TRANSFER_DST → SHADER_READ_ONLY: after the copy's writes, before fragment-shader reads
        transitionImage(cmd, tex.image, VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL, VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL,
            VK_PIPELINE_STAGE_2_COPY_BIT, VK_ACCESS_2_TRANSFER_WRITE_BIT,
            VK_PIPELINE_STAGE_2_FRAGMENT_SHADER_BIT, VK_ACCESS_2_SHADER_SAMPLED_READ_BIT);
    });

    destroyBuffer(app, staging);                      // safe: immediateSubmit waited on its fence
    return tex;
}`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "vkTex_tBarrier", "Transition"), tx(t, "vkTex_tSrc", "src stage / access"), tx(t, "vkTex_tDst", "dst stage / access"), tx(t, "vkTex_tWhy", "Why")]}
        rows={[
          ["UNDEFINED → TRANSFER_DST", "NONE / NONE", "COPY / TRANSFER_WRITE", tx(t, "vkTex_b1", "the image is new, so no earlier work touches it. The copy's writes must wait until the layout change is done.")],
          ["TRANSFER_DST → SHADER_READ_ONLY", "COPY / TRANSFER_WRITE", "FRAGMENT_SHADER / SHADER_SAMPLED_READ", tx(t, "vkTex_b2", "the copy's writes must finish and be made visible to the sampler; the fragment shader is the first stage that samples this texture.")],
        ]}
      />
      <p>
        {tx(t, "vkTex_rowBody",
          "bufferRowLength and bufferImageHeight describe the buffer side, in texels. Zero means tightly packed, which is what stb_image returns. They matter when the source has padded rows, for example a frame captured from a video decoder whose rows are 2048 texels apart although the picture is 1920 wide: then bufferRowLength = 2048 and the copy skips the padding at the end of each row.")}
      </p>
      <TextureUploadFigure t={t} />

      <H2>{tx(t, "vkTex_samplerTitle", "The sampler")}</H2>
      <p>
        {tx(t, "vkTex_samplerBody",
          "The image holds texels; the sampler says how to read them. Texture coordinates are fractions: (0, 0) is the corner of the first texel in memory and (1, 1) the far corner of the last one, whatever the resolution. A fragment's uv almost never lands on a texel centre, and it may lie outside [0, 1]. Filtering decides what to return between texels, and the address mode decides what lies outside. In OpenGL both were properties of the texture object; in Vulkan a sampler is a separate object, and one sampler can serve any number of images.")}
      </p>
      <Equation label={tx(t, "vkTex_eqBilinear", "Bilinear filtering (LINEAR)")}
        where={[
          [r`u,\ v`, tx(t, "vkTex_wUv", "the texture coordinate of the fragment")],
          [r`W,\ H`, tx(t, "vkTex_wWh", "the image's width and height in texels")],
          [r`\tfrac12`, tx(t, "vkTex_wHalf", "texel i has its centre at (i + ½) / W, so subtracting ½ makes x an integer exactly at texel centres")],
          [r`i_0,\ j_0`, tx(t, "vkTex_wIj", "the texel up and to the left of the sample: ⌊x⌋ and ⌊y⌋; the other three are i₀+1 and j₀+1")],
          [r`\alpha,\ \beta`, tx(t, "vkTex_wAb", "how far the sample is from texel i₀ towards i₀+1 (and from j₀ towards j₀+1), from 0 to 1")],
          [r`t_{ij}`, tx(t, "vkTex_wT", "the colour of texel (i, j), after the address mode has mapped out-of-range indices")],
        ]}>
        {r`\begin{gathered} x = uW - \tfrac12,\ \ y = vH - \tfrac12,\ \ i_0 = \lfloor x \rfloor,\ j_0 = \lfloor y \rfloor,\ \ \alpha = x - i_0,\ \beta = y - j_0 \\[4pt] c = (1-\alpha)(1-\beta)\,t_{i_0 j_0} + \alpha(1-\beta)\,t_{i_0+1\,j_0} + (1-\alpha)\beta\,t_{i_0\,j_0+1} + \alpha\beta\,t_{i_0+1\,j_0+1} \end{gathered}`}
      </Equation>
      <p>
        {tx(t, "vkTex_nearestBody",
          "NEAREST skips the blend and returns texel (⌊uW⌋, ⌊vH⌋): crisp squares when magnified, which pixel art wants and photographs do not. The four weights of LINEAR always add up to 1, so the result is a weighted average: exactly one texel's colour at its centre, an equal mix of four at the point where they meet.")}
      </p>
      <H3>{tx(t, "vkTex_bilinWorkedTitle", "Worked example: one bilinear sample")}</H3>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "vkTex_bw1", "A 4 × 4 texture, uv = (0.4, 0.3). x = 0.4 · 4 − 0.5 = 1.1 and y = 0.3 · 4 − 0.5 = 0.7.")}</li>
        <li>{tx(t, "vkTex_bw2", "i₀ = ⌊1.1⌋ = 1, α = 0.1; j₀ = ⌊0.7⌋ = 0, β = 0.7. The four texels are (1, 0), (2, 0), (1, 1), (2, 1).")}</li>
        <li>{tx(t, "vkTex_bw3", "Weights: (1 − 0.1)(1 − 0.7) = 0.27 for (1, 0); 0.1 · 0.3 = 0.03 for (2, 0); 0.9 · 0.7 = 0.63 for (1, 1); 0.1 · 0.7 = 0.07 for (2, 1). Sum: 1.00.")}</li>
        <li>{tx(t, "vkTex_bw4", "The sample sits just right of texel column 1 and closer to row 1 than row 0, so texel (1, 1) dominates. This is the starting probe of the figure below.")}</li>
      </ol>
      <SamplerFigure t={t} />
      <CodeBlock lang="cpp" filename="texture.cpp" t={t}>{`void createSampler(App& app) {                        // App gains: VkSampler sampler;
    VkPhysicalDeviceProperties props;
    vkGetPhysicalDeviceProperties(app.gpu, &props);

    VkSamplerCreateInfo info{};
    info.sType            = VK_STRUCTURE_TYPE_SAMPLER_CREATE_INFO;
    info.magFilter        = VK_FILTER_LINEAR;           // texels larger than pixels (magnified)
    info.minFilter        = VK_FILTER_LINEAR;           // texels smaller than pixels (minified)
    info.mipmapMode       = VK_SAMPLER_MIPMAP_MODE_LINEAR;   // used once there are mips
    info.addressModeU     = VK_SAMPLER_ADDRESS_MODE_REPEAT;
    info.addressModeV     = VK_SAMPLER_ADDRESS_MODE_REPEAT;
    info.addressModeW     = VK_SAMPLER_ADDRESS_MODE_REPEAT;  // third axis, for 3D textures
    info.anisotropyEnable = VK_TRUE;                    // feature enabled in the Devices chapter
    info.maxAnisotropy    = std::min(16.0f, props.limits.maxSamplerAnisotropy);
    info.compareEnable    = VK_FALSE;                   // VK_TRUE for shadow-map comparisons
    info.minLod           = 0.0f;
    info.maxLod           = VK_LOD_CLAMP_NONE;          // allow every mip level
    info.borderColor      = VK_BORDER_COLOR_INT_OPAQUE_BLACK;   // only for CLAMP_TO_BORDER
    info.unnormalizedCoordinates = VK_FALSE;            // uv in [0, 1], not in texels
    VK_CHECK(vkCreateSampler(app.device, &info, nullptr, &app.sampler));
}`}</CodeBlock>
      <p>
        {tx(t, "vkTex_anisoBody",
          "Anisotropic filtering handles surfaces seen at a grazing angle, like a floor stretching away. One pixel there covers a long, thin strip of the texture, and a single bilinear sample (or a single mip level) blurs it. With anisotropy the sampler takes up to maxAnisotropy samples along the strip's long axis. The Devices chapter enabled the samplerAnisotropy feature; without it, anisotropyEnable = VK_TRUE is a validation error. 16 is the usual maximum and costs little on any desktop GPU.")}
      </p>

      <H2>{tx(t, "vkTex_descTitle", "A material set")}</H2>
      <p>
        {tx(t, "vkTex_descBody",
          "The descriptors chapter grouped data by how often it changes. The camera is per frame and lives in set 0; a texture belongs to a material, so it gets set 1 with its own layout. A combined image sampler descriptor holds an image view, a sampler and the layout the image will be in when it is sampled. (Vulkan can also keep them apart, as SAMPLED_IMAGE and SAMPLER descriptors combined in the shader; engines with many textures and few samplers do that.)")}
      </p>
      <CodeBlock lang="cpp" filename="descriptors.cpp" t={t}>{`// App gains: VkDescriptorSetLayout materialLayout; VkDescriptorSet materialSet; Image texture;
// in createDescriptors, which now runs after loadTexture and createSampler:
VkDescriptorSetLayoutBinding texBinding{};
texBinding.binding         = 0;                                // set 1, binding 0
texBinding.descriptorType  = VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER;
texBinding.descriptorCount = 1;
texBinding.stageFlags      = VK_SHADER_STAGE_FRAGMENT_BIT;     // only the fragment shader samples
VkDescriptorSetLayoutCreateInfo matInfo{};
matInfo.sType        = VK_STRUCTURE_TYPE_DESCRIPTOR_SET_LAYOUT_CREATE_INFO;
matInfo.bindingCount = 1;
matInfo.pBindings    = &texBinding;
VK_CHECK(vkCreateDescriptorSetLayout(app.device, &matInfo, nullptr, &app.materialLayout));

// the pool grows: two sets, one descriptor of each type
VkDescriptorPoolSize sizes[] = {{VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER, 1},
                                {VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER, 1}};
poolInfo.maxSets       = 2;
poolInfo.poolSizeCount = 2;
poolInfo.pPoolSizes    = sizes;

// ... allocate app.materialSet with app.materialLayout, as for the camera set, then:
VkDescriptorImageInfo imageInfo{};
imageInfo.sampler     = app.sampler;
imageInfo.imageView   = app.texture.view;
imageInfo.imageLayout = VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL;   // the layout at sampling time
VkWriteDescriptorSet write{};
write.sType           = VK_STRUCTURE_TYPE_WRITE_DESCRIPTOR_SET;
write.dstSet          = app.materialSet;
write.dstBinding      = 0;
write.descriptorType  = VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER;
write.descriptorCount = 1;
write.pImageInfo      = &imageInfo;                   // images use pImageInfo, buffers pBufferInfo
vkUpdateDescriptorSets(app.device, 1, &write, 0, nullptr);`}</CodeBlock>
      <CodeBlock lang="cpp" filename="pipeline.cpp / commands.cpp" t={t}>{`// pipeline layout: two set layouts, in set order
VkDescriptorSetLayout setLayouts[] = {app.setLayout, app.materialLayout};   // set 0, set 1
layoutInfo.setLayoutCount = 2;
layoutInfo.pSetLayouts    = setLayouts;

// recordFrame: bind both sets in one call
VkDescriptorSet sets[] = {app.cameraSet, app.materialSet};
vkCmdBindDescriptorSets(cmd, VK_PIPELINE_BIND_POINT_GRAPHICS, app.pipelineLayout,
                        0, 2, sets, 0, nullptr);      // firstSet 0, two sets`}</CodeBlock>

      <H2>{tx(t, "vkTex_uvTitle", "Texture coordinates in the vertices")}</H2>
      <p>
        {tx(t, "vkTex_uvBody",
          "Each vertex now carries a uv. Vulkan puts texture coordinate v = 0 at the first row of the image in memory, and stb_image returns the top row of the picture first, so v = 0 is the top of the picture. Our quad is in a y-up world since the Descriptors chapter, so its top vertices get v = 0 and its bottom vertices v = 1. OpenGL tutorials call stbi_set_flip_vertically_on_load(true), because OpenGL treats the first row as the bottom; carrying that habit over to Vulkan shows every texture upside down. The colour stays as a tint multiplied with the texture, set to white here.")}
      </p>
      <CodeBlock lang="cpp" filename="mesh.h" t={t}>{`struct Vertex {
    float pos[2];      // x, y in world units, y up     (offset 0)
    float color[3];    // tint, multiplied by the texture (offset 8)
    float uv[2];       // texture coordinate             (offset 20)
};                     // sizeof(Vertex) = 28: the new stride

constexpr Vertex kVertices[] = {
    {{-0.5f, -0.5f}, {1.0f, 1.0f, 1.0f}, {0.0f, 1.0f}},   // 0 bottom left  → last row of the image
    {{ 0.5f, -0.5f}, {1.0f, 1.0f, 1.0f}, {1.0f, 1.0f}},   // 1 bottom right
    {{ 0.5f,  0.5f}, {1.0f, 1.0f, 1.0f}, {1.0f, 0.0f}},   // 2 top right    → first row
    {{-0.5f,  0.5f}, {1.0f, 1.0f, 1.0f}, {0.0f, 0.0f}},   // 3 top left
};

// in createPipeline: a third attribute
attrs[2].location = 2;
attrs[2].binding  = 0;
attrs[2].format   = VK_FORMAT_R32G32_SFLOAT;           // two floats
attrs[2].offset   = offsetof(Vertex, uv);              // 20
vertexInput.vertexAttributeDescriptionCount = 3;`}</CodeBlock>
      <CodeBlock lang="glsl" filename="shaders/quad.vert + quad.frag" t={t}>{`// quad.vert: pass the uv through
layout(location = 2) in vec2 inUV;
layout(location = 1) out vec2 vUV;
// ... in main(): vUV = inUV;

// quad.frag
#version 450
layout(set = 1, binding = 0) uniform sampler2D albedo;   // set 1: the material

layout(location = 0) in vec3 vColor;
layout(location = 1) in vec2 vUV;                        // interpolated across the triangle
layout(location = 0) out vec4 outColor;

void main() {
    outColor = texture(albedo, vUV) * vec4(vColor, 1.0);  // filtered, sRGB-decoded texel × tint
}`}</CodeBlock>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`// init: ... → createCommands → createMesh
//       → app.texture = loadTexture(app, "textures/crate.png") → createSampler
//       → createDescriptors → createPipeline → createSync`}</CodeBlock>
      <Callout type="tip" t={t}>
        {tx(t, "vkTex_run", "Build and run: both quads now show the picture, the right way up, turning in perspective. If the picture is upside down, remove the vertical flip on load; if it is sheared with wrong colours, check STBI_rgb_alpha; if it is pale, the format is UNORM. Watch the quads as they turn edge-on: the texture stays sharp at steep angles thanks to anisotropy, and still shimmers a little as they shrink, which mipmaps fix later.")}
      </Callout>

      <H2>{tx(t, "vkTex_shutdownTitle", "Shutdown, updated")}</H2>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`vkDestroySampler(app.device, app.sampler, nullptr);
destroyImage(app, app.texture);                          // view, image, memory
vkDestroyDescriptorSetLayout(app.device, app.materialLayout, nullptr);
// ... then the camera buffer, the pool, set 0's layout, and the rest as before`}</CodeBlock>
      <VulkanObjectsFigure t={t} initial="sampler" />

      <H2>{tx(t, "vkTex_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "vkTex_tMistake", "Mistake"), tx(t, "vkTex_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "vkTex_e1", "stbi_load with 0 or 3 desired channels"), tx(t, "vkTex_e1b", "RGB files come back with 3 bytes per pixel: a sheared, discoloured texture and a read past the end of the array. Always pass STBI_rgb_alpha.")],
          [tx(t, "vkTex_e2", "UNORM for colour, or SRGB for a normal map"), tx(t, "vkTex_e2b", "a washed-out texture, or normals bent by the decode curve. Colour is _SRGB, data is _UNORM.")],
          [tx(t, "vkTex_e3", "Flipping the image on load, as in OpenGL"), tx(t, "vkTex_e3b", "every texture upside down. In Vulkan v = 0 is the first row in memory: do not flip.")],
          [tx(t, "vkTex_e4", "Copying into an image still in UNDEFINED"), tx(t, "vkTex_e4b", "a validation error, and texels in the wrong arrangement on some GPUs. Transition to TRANSFER_DST_OPTIMAL first.")],
          [tx(t, "vkTex_e5", "Sampling an image left in TRANSFER_DST_OPTIMAL"), tx(t, "vkTex_e5b", "the descriptor's imageLayout does not match the real one: a validation error at submit, scrambled texels on some hardware.")],
          [tx(t, "vkTex_e6", "Missing SAMPLED or TRANSFER_DST in usage"), tx(t, "vkTex_e6b", "a validation error when the descriptor is written or the copy recorded. List every use when the image is created.")],
          [tx(t, "vkTex_e7", "anisotropyEnable without the samplerAnisotropy feature"), tx(t, "vkTex_e7b", "a validation error at vkCreateSampler. Enable the feature at device creation, and clamp maxAnisotropy to the device limit.")],
          [tx(t, "vkTex_e8", "Allocating w·h·4 bytes for the image"), tx(t, "vkTex_e8b", "the layer reports the memory is too small: optimal tiling pads the image. Allocate req.size.")],
        ]}
      />

      <KeyIdeas t={t} id="vkTex" items={[
        "An optimal-tiling image stores texels in a driver-private arrangement, so pixels reach it through a staging buffer and a GPU copy.",
        "An image's layout says which job it is prepared for; each change is a barrier: UNDEFINED → TRANSFER_DST_OPTIMAL → SHADER_READ_ONLY_OPTIMAL for a texture.",
        "Images are created, given memory by their requirements, bound, and always used through a view.",
        "Colour textures use an _SRGB format so the sampler decodes them to linear; data textures use _UNORM.",
        "Always decode to four channels; no common GPU format has three 8-bit channels.",
        "A sampler is a separate object: filter (NEAREST, LINEAR), address mode (REPEAT, MIRRORED_REPEAT, CLAMP_TO_EDGE, CLAMP_TO_BORDER), anisotropy.",
        "LINEAR blends the four texels around x = uW − ½, y = vH − ½ with weights that add up to 1.",
        "A combined image sampler descriptor holds the sampler, the view and the layout at sampling time; textures belong in a per-material set.",
        "In Vulkan v = 0 is the first row of the image: do not flip images on load.",
      ]} />
    </Article>
  );
}
