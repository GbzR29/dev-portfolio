"use client";

// Presentation 2: the graphics pipeline — why Vulkan bakes all draw state into
// one immutable VkPipeline; GLSL → SPIR-V with glslc; the first triangle's
// shaders (positions from gl_VertexIndex); Vulkan's clip space (y down,
// depth 0..1) and the viewport transform, with the ClipSpace figure; shader
// modules; every fixed-function create-info (vertex input, input assembly,
// viewport/scissor as dynamic state, rasterizer, multisampling, colour
// blending) with the PipelineState figure; the pipeline layout; dynamic
// rendering's VkPipelineRenderingCreateInfo; creation, pipeline caches and
// hitching; a worked viewport example; common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { ClipSpaceFigure } from "@/components/lesson/figures/vulkan/ClipSpaceFigure";
import { PipelineStateFigure } from "@/components/lesson/figures/vulkan/PipelineStateFigure";
import { VulkanObjectsFigure } from "@/components/lesson/figures/vulkan/VulkanObjectsFigure";

const r = String.raw;

export function PipelineContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "vkPipe_intro",
          "In OpenGL, drawing state was a set of switches you flipped one at a time: bind a program, enable blending, set the cull face, change the polygon mode, then draw. The driver only learned the full combination at the draw call, and if that combination was new it had to compile machine code for it right there, in the middle of your frame. Vulkan asks for the whole combination up front. A VkPipeline holds the shaders and every fixed-function setting together, is compiled once when you create it, and cannot change afterwards. This chapter writes the first triangle's shaders, compiles them to SPIR-V, and fills in every part of a graphics pipeline.")}
      </Lead>

      <H2>{tx(t, "vkPipe_whyTitle", "Why one immutable object")}</H2>
      <p>
        {tx(t, "vkPipe_whyBody",
          "A GPU does not execute GLSL, and many of the \"fixed-function\" settings are not really fixed hardware either. On most GPUs the vertex format is turned into instructions at the start of the vertex shader, blending into instructions at the end of the fragment shader, and the colour attachment's format decides how outputs are packed. So a change of blend mode or vertex layout can mean a different compiled shader. OpenGL hides that by recompiling behind your back, which shows up as hitches the first time an object appears. Vulkan makes the cost explicit: you describe the full state, the driver compiles it once in vkCreateGraphicsPipelines, and a draw only has to bind the finished result. The price is that a program needs one pipeline per combination it uses, and creating them takes real time (from under a millisecond to hundreds of milliseconds each), so engines create them during loading.")}
      </p>
      <p>
        {tx(t, "vkPipe_whyDynamic",
          "Not everything is baked in. A short list of settings can be declared dynamic state: the pipeline leaves them open and a command sets them while recording. We will make the viewport and the scissor dynamic, so resizing the window does not require new pipelines. Vulkan 1.3 made many more settings optionally dynamic (cull mode, front face, topology, depth test…), which is useful for engines with many combinations; the first triangle needs only the two.")}
      </p>

      <H2>{tx(t, "vkPipe_spirvTitle", "Shaders: GLSL compiled to SPIR-V")}</H2>
      <p>
        {tx(t, "vkPipe_spirvBody",
          "Vulkan drivers do not accept shader source code. They accept SPIR-V, a binary intermediate language: a list of 32-bit words that describe the shader after parsing and type checking. Every file starts with the magic number 0x07230203, which is how a loader recognises SPIR-V and its byte order. Moving the front end of the compiler out of the driver means every vendor reads exactly the same program, so a shader that works on one GPU no longer fails to compile on another because of a different GLSL parser. We keep writing GLSL and compile it ahead of time with glslc, which ships with the Vulkan SDK (glslangValidator does the same job, and HLSL can be compiled to SPIR-V with DXC).")}
      </p>
      <p>
        {tx(t, "vkPipe_shaderBody",
          "The first triangle does not need a vertex buffer yet: its three positions and colours are written into the vertex shader as constant arrays, and the shader picks one with gl_VertexIndex, the index of the vertex being processed (0, 1 or 2 for a draw of three vertices). Vertex buffers arrive in the Buffers & Memory chapter.")}
      </p>
      <CodeBlock lang="glsl" filename="shaders/triangle.vert" t={t}>{`#version 450

// Positions in Vulkan's clip space: x to the right, y DOWN, both in [-1, 1].
const vec2 POSITIONS[3] = vec2[](
    vec2( 0.0, -0.5),   // top
    vec2( 0.5,  0.5),   // bottom right
    vec2(-0.5,  0.5)    // bottom left
);
const vec3 COLORS[3] = vec3[](
    vec3(1.0, 0.0, 0.0),
    vec3(0.0, 1.0, 0.0),
    vec3(0.0, 0.0, 1.0)
);

layout(location = 0) out vec3 vColor;    // an output to the fragment shader, slot 0

void main() {
    gl_Position = vec4(POSITIONS[gl_VertexIndex], 0.0, 1.0);
    vColor = COLORS[gl_VertexIndex];
}`}</CodeBlock>
      <CodeBlock lang="glsl" filename="shaders/triangle.frag" t={t}>{`#version 450

layout(location = 0) in  vec3 vColor;    // must match the vertex shader's location 0
layout(location = 0) out vec4 outColor;  // colour attachment 0

void main() {
    outColor = vec4(vColor, 1.0);        // linear colour; the _SRGB swapchain encodes it
}`}</CodeBlock>
      <p>
        {tx(t, "vkPipe_shaderExplain",
          "Two differences from OpenGL's GLSL. First, #version 450 without \"core\": this is GLSL for Vulkan (the GL_KHR_vulkan_glsl rules), where gl_VertexID is spelled gl_VertexIndex. Second, every input and output that crosses between stages needs an explicit layout(location = N). Vulkan matches a vertex output to a fragment input by that number, not by name, so vColor could be called anything in the fragment shader. The fragment shader's out at location 0 is written to colour attachment 0, the swapchain image. The build step compiles each file:")}
      </p>
      <CodeBlock lang="bash" filename="terminal" t={t}>{`glslc shaders/triangle.vert -o shaders/triangle.vert.spv
glslc shaders/triangle.frag -o shaders/triangle.frag.spv
# glslc picks the stage from the extension (.vert, .frag, .comp…); -O optimises`}</CodeBlock>

      <H2>{tx(t, "vkPipe_clipTitle", "Vulkan's clip space")}</H2>
      <p>
        {tx(t, "vkPipe_clipBody",
          "The vertex shader's gl_Position is a clip-space position (x, y, z, w). After clipping, the GPU divides by w to get normalized device coordinates (NDC), exactly as in OpenGL. Two conventions differ. In Vulkan, NDC y = −1 is the top of the viewport and +1 the bottom, because framebuffer rows are counted from the top, like the rows of an image file; in OpenGL −1 is the bottom. And Vulkan's depth range is 0 to 1, where OpenGL's is −1 to 1. That is why the positions above put the top vertex at y = −0.5. The viewport transform turns NDC into framebuffer pixels:")}
      </p>
      <Equation label={tx(t, "vkPipe_eqViewport", "Viewport transform")}
        where={[
          [r`x_{ndc},\,y_{ndc},\,z_{ndc}`, tx(t, "vkPipe_wNdc", "the vertex after the divide by w: x and y in [−1, 1], z in [0, 1]")],
          [r`x_0,\,y_0`, tx(t, "vkPipe_wOrigin", "the viewport's x and y, the top-left corner in framebuffer pixels (usually 0, 0)")],
          [r`w,\,h`, tx(t, "vkPipe_wSize", "the viewport's width and height in pixels, usually the swapchain extent")],
          [r`d_{\min},\,d_{\max}`, tx(t, "vkPipe_wDepth", "minDepth and maxDepth, normally 0 and 1, so the depth is stored unchanged")],
          [r`x_f,\,y_f,\,z_f`, tx(t, "vkPipe_wFb", "the framebuffer position: column, row counted from the top, and the value compared by the depth test")],
        ]}
        note={tx(t, "vkPipe_eqViewportNote", "(x + 1) / 2 maps the range [−1, 1] to [0, 1]; multiplying by the size stretches it over the viewport; adding the origin moves it to where the viewport starts.")}>
        {r`x_f = \frac{x_{ndc}+1}{2}\,w + x_0,\qquad y_f = \frac{y_{ndc}+1}{2}\,h + y_0,\qquad z_f = z_{ndc}\,(d_{\max}-d_{\min}) + d_{\min}`}
      </Equation>
      <ClipSpaceFigure t={t} />
      <p>
        {tx(t, "vkPipe_flipBody",
          "Code and assets written for OpenGL can be kept by flipping the viewport: set y to the height and height to minus the height. Then y_f = (y + 1)/2 · (−h) + h = (1 − y)/2 · h, which counts from the bottom again. Negative heights have been allowed since Vulkan 1.1. The flip also reverses the on-screen winding, as the figure shows, so the front face setting must follow whichever convention you pick. This track stays with Vulkan's own convention: y down, and in later chapters a projection matrix built for depth 0 to 1.")}
      </p>

      <H2>{tx(t, "vkPipe_moduleTitle", "Shader modules")}</H2>
      <p>
        {tx(t, "vkPipe_moduleBody",
          "A VkShaderModule wraps a block of SPIR-V words. The file is read as bytes, but Vulkan takes a pointer to uint32_t and a size in bytes that must be a multiple of 4, so we read straight into a std::vector<uint32_t>, which is also correctly aligned. A module is only needed while pipelines are being created from it: it can be destroyed right after, because the pipeline holds its own compiled code.")}
      </p>
      <CodeBlock lang="cpp" filename="pipeline.cpp" t={t}>{`static std::vector<uint32_t> readSpirv(const char* path) {
    std::ifstream file(path, std::ios::binary | std::ios::ate);   // ate: start at the end
    if (!file) throw std::runtime_error(std::string("cannot open ") + path);
    const size_t bytes = size_t(file.tellg());                    // position at the end = size
    if (bytes == 0 || bytes % 4 != 0) throw std::runtime_error("not SPIR-V");

    std::vector<uint32_t> words(bytes / 4);
    file.seekg(0);
    file.read(reinterpret_cast<char*>(words.data()), std::streamsize(bytes));
    if (words[0] != 0x07230203) throw std::runtime_error("bad SPIR-V magic number");
    return words;
}

static VkShaderModule createShaderModule(VkDevice device, const std::vector<uint32_t>& code) {
    VkShaderModuleCreateInfo info{};
    info.sType    = VK_STRUCTURE_TYPE_SHADER_MODULE_CREATE_INFO;
    info.codeSize = code.size() * sizeof(uint32_t);               // in BYTES
    info.pCode    = code.data();
    VkShaderModule module;
    VK_CHECK(vkCreateShaderModule(device, &info, nullptr, &module));
    return module;
}`}</CodeBlock>

      <H2>{tx(t, "vkPipe_stateTitle", "The pipeline, one struct at a time")}</H2>
      <p>
        {tx(t, "vkPipe_stateBody",
          "VkGraphicsPipelineCreateInfo points to one struct per part of the pipeline, in the order the data flows through it. Each is small; together they are the complete description of how a draw turns vertices into pixels.")}
      </p>

      <H3>{tx(t, "vkPipe_stagesTitle", "Shader stages")}</H3>
      <p>
        {tx(t, "vkPipe_stagesBody",
          "One VkPipelineShaderStageCreateInfo per stage: which stage it is, which module, and pName, the name of the entry-point function. A single SPIR-V module may contain several entry points, which is why the name is needed; ours is \"main\".")}
      </p>

      <H3>{tx(t, "vkPipe_viTitle", "Vertex input and input assembly")}</H3>
      <p>
        {tx(t, "vkPipe_viBody",
          "Vertex input describes the vertex buffers: how many bytes per vertex (stride) and where each attribute sits inside a vertex. The first triangle reads no buffers, so the struct is left empty. Input assembly then groups the incoming vertices into primitives. topology says how: a list uses every vertex once (three per triangle), a strip reuses the last two vertices for the next triangle. primitiveRestartEnable lets a special index (0xFFFF or 0xFFFFFFFF) end one strip and begin the next inside a single indexed draw; we leave it off.")}
      </p>

      <H3>{tx(t, "vkPipe_vpTitle", "Viewport and scissor")}</H3>
      <p>
        {tx(t, "vkPipe_vpBody",
          "The viewport is the transform above; the scissor is a rectangle outside of which fragments are discarded, independent of the viewport. Both usually cover the whole swapchain image. Because we declare them dynamic, the pipeline only records how many there are (one each), and the actual rectangles are set with vkCmdSetViewport and vkCmdSetScissor while recording, using the current extent.")}
      </p>

      <H3>{tx(t, "vkPipe_rsTitle", "The rasterizer")}</H3>
      <p>
        {tx(t, "vkPipe_rsBody",
          "The rasterizer finds which pixels each primitive covers and produces a fragment for each. Its settings:")}
      </p>
      <LessonTable
        headers={[tx(t, "vkPipe_tField", "Field"), tx(t, "vkPipe_tMeaning", "Meaning")]}
        rows={[
          ["polygonMode", tx(t, "vkPipe_rs1", "FILL fills triangles; LINE draws only their edges (wireframe) and POINT only their corners. Anything other than FILL needs the fillModeNonSolid device feature.")],
          ["cullMode", tx(t, "vkPipe_rs2", "which faces to discard before shading: NONE, BACK_BIT, FRONT_BIT or both. Culling back faces halves the work for closed meshes, whose back faces are never visible.")],
          ["frontFace", tx(t, "vkPipe_rs3", "which on-screen winding counts as the front: COUNTER_CLOCKWISE or CLOCKWISE. The winding is judged in framebuffer space, after the viewport, where y points down.")],
          ["lineWidth", tx(t, "vkPipe_rs4", "the width of lines in pixels. It must be 1.0 unless the wideLines feature is enabled.")],
          ["depthClampEnable", tx(t, "vkPipe_rs5", "clamp depths outside [0, 1] instead of clipping those fragments away (used for shadow maps; needs the depthClamp feature). Off.")],
          ["rasterizerDiscardEnable", tx(t, "vkPipe_rs6", "throw every primitive away before rasterization, for pipelines that only use the vertex stage's side effects. Off, or nothing is drawn.")],
          ["depthBiasEnable", tx(t, "vkPipe_rs7", "add a constant and a slope-scaled offset to depth, used against shadow acne. Off.")],
        ]}
      />
      <PipelineStateFigure t={t} />
      <p>
        {tx(t, "vkPipe_windBody",
          "Our triangle's vertices, top → bottom right → bottom left, go clockwise on a y-down screen, so with frontFace = CLOCKWISE it is front-facing. We set cullMode = NONE while getting the first triangle on screen, so a winding mistake cannot hide it; once meshes arrive, BACK with the matching front face is the normal choice.")}
      </p>

      <H3>{tx(t, "vkPipe_msTitle", "Multisampling, depth and colour blending")}</H3>
      <p>
        {tx(t, "vkPipe_msBody",
          "Multisampling (MSAA) is covered in a later chapter; for now rasterizationSamples = 1 sample per pixel. There is no depth buffer yet, so pDepthStencilState stays null. Colour blending decides how a fragment's colour is combined with the colour already in the attachment. With blendEnable = VK_FALSE the new colour simply replaces the old one. With it on, the result is computed per channel:")}
      </p>
      <Equation label={tx(t, "vkPipe_eqBlend", "Blend equation (colour channels)")}
        where={[
          [r`C_{src}`, tx(t, "vkPipe_wSrc", "the colour the fragment shader wrote")],
          [r`C_{dst}`, tx(t, "vkPipe_wDst", "the colour already stored in the attachment")],
          [r`F_{src},\,F_{dst}`, tx(t, "vkPipe_wFactors", "srcColorBlendFactor and dstColorBlendFactor, for example SRC_ALPHA and ONE_MINUS_SRC_ALPHA")],
          [r`\oplus`, tx(t, "vkPipe_wOp", "colorBlendOp: ADD, SUBTRACT, MIN or MAX")],
        ]}
        note={tx(t, "vkPipe_eqBlendNote", "With SRC_ALPHA, ONE_MINUS_SRC_ALPHA and ADD, a fragment with alpha 0.25 gives 0.25 of the new colour plus 0.75 of the old: ordinary transparency. Alpha uses its own factors and operation.")}>
        {r`C = C_{src}\,F_{src} \;\oplus\; C_{dst}\,F_{dst}`}
      </Equation>
      <p>
        {tx(t, "vkPipe_maskBody",
          "One field matters even with blending off: colorWriteMask, which says which channels may be written at all. Its zero value means \"write nothing\", so a forgotten mask gives a perfectly valid pipeline that draws nothing. We set R | G | B | A.")}
      </p>

      <H3>{tx(t, "vkPipe_layoutTitle", "The pipeline layout")}</H3>
      <p>
        {tx(t, "vkPipe_layoutBody",
          "A VkPipelineLayout lists every resource the shaders can reach from outside: descriptor set layouts (uniform buffers, textures) and push-constant ranges (small values pushed with the commands). The triangle's shaders use none, so the layout is empty, but a pipeline still requires one. It is a separate object because many pipelines can share it, and binding resources is defined against the layout, not against one pipeline.")}
      </p>

      <H3>{tx(t, "vkPipe_renderingTitle", "Dynamic rendering: the attachment formats")}</H3>
      <p>
        {tx(t, "vkPipe_renderingBody",
          "The compiled code depends on the formats it writes to, so the pipeline must know them. Before Vulkan 1.3 this came from a VkRenderPass object, created in advance and passed as renderPass. With dynamic rendering, which the devices chapter enabled, we instead chain a VkPipelineRenderingCreateInfo into pNext with the formats of the colour attachments (and of depth and stencil, later), and leave renderPass as VK_NULL_HANDLE. The format given here must match the image we render into, the swapchain's format.")}
      </p>

      <H2>{tx(t, "vkPipe_createTitle", "Creating the pipeline")}</H2>
      <CodeBlock lang="cpp" filename="pipeline.cpp" t={t}>{`// App gains: VkPipelineLayout pipelineLayout; VkPipeline pipeline;
void createPipeline(App& app) {
    VkShaderModule vert = createShaderModule(app.device, readSpirv("shaders/triangle.vert.spv"));
    VkShaderModule frag = createShaderModule(app.device, readSpirv("shaders/triangle.frag.spv"));

    VkPipelineShaderStageCreateInfo stages[2]{};
    stages[0].sType  = VK_STRUCTURE_TYPE_PIPELINE_SHADER_STAGE_CREATE_INFO;
    stages[0].stage  = VK_SHADER_STAGE_VERTEX_BIT;
    stages[0].module = vert;
    stages[0].pName  = "main";                                    // entry point
    stages[1] = stages[0];
    stages[1].stage  = VK_SHADER_STAGE_FRAGMENT_BIT;
    stages[1].module = frag;

    VkPipelineVertexInputStateCreateInfo vertexInput{};           // no vertex buffers yet
    vertexInput.sType = VK_STRUCTURE_TYPE_PIPELINE_VERTEX_INPUT_STATE_CREATE_INFO;

    VkPipelineInputAssemblyStateCreateInfo inputAssembly{};
    inputAssembly.sType    = VK_STRUCTURE_TYPE_PIPELINE_INPUT_ASSEMBLY_STATE_CREATE_INFO;
    inputAssembly.topology = VK_PRIMITIVE_TOPOLOGY_TRIANGLE_LIST;

    VkPipelineViewportStateCreateInfo viewport{};                 // the rectangles are dynamic,
    viewport.sType         = VK_STRUCTURE_TYPE_PIPELINE_VIEWPORT_STATE_CREATE_INFO;
    viewport.viewportCount = 1;                                   // but their count is not
    viewport.scissorCount  = 1;

    VkPipelineRasterizationStateCreateInfo raster{};
    raster.sType       = VK_STRUCTURE_TYPE_PIPELINE_RASTERIZATION_STATE_CREATE_INFO;
    raster.polygonMode = VK_POLYGON_MODE_FILL;
    raster.cullMode    = VK_CULL_MODE_NONE;                       // BACK once meshes arrive
    raster.frontFace   = VK_FRONT_FACE_CLOCKWISE;                 // on a y-down screen
    raster.lineWidth   = 1.0f;

    VkPipelineMultisampleStateCreateInfo multisample{};
    multisample.sType                = VK_STRUCTURE_TYPE_PIPELINE_MULTISAMPLE_STATE_CREATE_INFO;
    multisample.rasterizationSamples = VK_SAMPLE_COUNT_1_BIT;

    VkPipelineColorBlendAttachmentState blendAttachment{};        // blendEnable = VK_FALSE
    blendAttachment.colorWriteMask = VK_COLOR_COMPONENT_R_BIT | VK_COLOR_COMPONENT_G_BIT |
                                     VK_COLOR_COMPONENT_B_BIT | VK_COLOR_COMPONENT_A_BIT;
    VkPipelineColorBlendStateCreateInfo blend{};
    blend.sType           = VK_STRUCTURE_TYPE_PIPELINE_COLOR_BLEND_STATE_CREATE_INFO;
    blend.attachmentCount = 1;                                    // one per colour attachment
    blend.pAttachments    = &blendAttachment;

    const VkDynamicState dynamicStates[] = {VK_DYNAMIC_STATE_VIEWPORT, VK_DYNAMIC_STATE_SCISSOR};
    VkPipelineDynamicStateCreateInfo dynamic{};
    dynamic.sType             = VK_STRUCTURE_TYPE_PIPELINE_DYNAMIC_STATE_CREATE_INFO;
    dynamic.dynamicStateCount = 2;
    dynamic.pDynamicStates    = dynamicStates;

    VkPipelineLayoutCreateInfo layoutInfo{};                      // no descriptors, no push constants
    layoutInfo.sType = VK_STRUCTURE_TYPE_PIPELINE_LAYOUT_CREATE_INFO;
    VK_CHECK(vkCreatePipelineLayout(app.device, &layoutInfo, nullptr, &app.pipelineLayout));

    VkPipelineRenderingCreateInfo rendering{};                    // dynamic rendering (1.3)
    rendering.sType                   = VK_STRUCTURE_TYPE_PIPELINE_RENDERING_CREATE_INFO;
    rendering.colorAttachmentCount    = 1;
    rendering.pColorAttachmentFormats = &app.swapFormat;          // must match the image we draw into

    VkGraphicsPipelineCreateInfo info{};
    info.sType               = VK_STRUCTURE_TYPE_GRAPHICS_PIPELINE_CREATE_INFO;
    info.pNext               = &rendering;
    info.stageCount          = 2;
    info.pStages             = stages;
    info.pVertexInputState   = &vertexInput;
    info.pInputAssemblyState = &inputAssembly;
    info.pViewportState      = &viewport;
    info.pRasterizationState = &raster;
    info.pMultisampleState   = &multisample;
    info.pDepthStencilState  = nullptr;                           // no depth buffer yet
    info.pColorBlendState    = &blend;
    info.pDynamicState       = &dynamic;
    info.layout              = app.pipelineLayout;
    info.renderPass          = VK_NULL_HANDLE;                    // dynamic rendering instead

    VK_CHECK(vkCreateGraphicsPipelines(app.device, VK_NULL_HANDLE, 1, &info, nullptr, &app.pipeline));

    vkDestroyShaderModule(app.device, frag, nullptr);             // the pipeline has its own copy
    vkDestroyShaderModule(app.device, vert, nullptr);
}`}</CodeBlock>
      <p>
        {tx(t, "vkPipe_createAfter",
          "vkCreateGraphicsPipelines takes an array, so an engine can create many pipelines in one call, and a VkPipelineCache as its second argument (VK_NULL_HANDLE here). A pipeline cache stores the compiled results; saving its contents to disk with vkGetPipelineCacheData and passing them back on the next run lets the driver skip compilation. That is how games avoid the \"compiling shaders\" stutter on the second launch. Because the pipeline depends only on the swapchain's format, not its size, a resize does not require a new pipeline: the viewport and scissor are dynamic.")}
      </p>
      <VulkanObjectsFigure t={t} initial="pipeline" />
      <p>
        {tx(t, "vkPipe_shutdownBody",
          "Both new objects come from the device, so they are destroyed before it, in reverse order of creation: vkDestroyPipeline, then vkDestroyPipelineLayout, right after the swapchain views and swapchain in destroy().")}
      </p>

      <H2>{tx(t, "vkPipe_workedTitle", "Worked example")}</H2>
      <p>
        {tx(t, "vkPipe_worked1",
          "The swapchain is 800 × 600, so the viewport is x0 = 0, y0 = 0, w = 800, h = 600. The top vertex has NDC (0, −0.5). Then x_f = (0 + 1)/2 · 800 + 0 = 400 and y_f = (−0.5 + 1)/2 · 600 + 0 = 0.25 · 600 = 150: column 400, row 150 counted from the top, so a quarter of the way down the window. The bottom-right vertex (0.5, 0.5) lands at x_f = 1.5/2 · 800 = 600 and y_f = 1.5/2 · 600 = 450; the bottom-left one (−0.5, 0.5) at (200, 450). The triangle points up, as intended.")}
      </p>
      <p>
        {tx(t, "vkPipe_worked2",
          "With the flipped viewport y0 = 600, h = −600, the top vertex gives y_f = 0.25 · (−600) + 600 = 450, and the others 0.75 · (−600) + 600 = 150: the same triangle now points down, which is what these coordinates would draw in OpenGL. On the y-down screen the unflipped triangle goes (400, 150) → (600, 450) → (200, 450): right and down, then left, then back up, which is clockwise, and that is why we set frontFace = CLOCKWISE.")}
      </p>

      <H2>{tx(t, "vkPipe_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "vkPipe_tMistake", "Mistake"), tx(t, "vkPipe_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "vkPipe_e1", "Passing the GLSL file instead of the .spv"), tx(t, "vkPipe_e1b", "vkCreateShaderModule fails or the validation layer reports invalid SPIR-V. Compile with glslc and load the .spv; the magic-number check catches this early.")],
          [tx(t, "vkPipe_e2", "codeSize in words instead of bytes"), tx(t, "vkPipe_e2b", "only a quarter of the shader is read. codeSize is in bytes: word count × 4.")],
          [tx(t, "vkPipe_e3", "Relative shader paths from the wrong working directory"), tx(t, "vkPipe_e3b", "\"cannot open\" when the program is started from the IDE. Copy the shaders next to the executable in the build, or build the path from SDL_GetBasePath().")],
          [tx(t, "vkPipe_e4", "renderPass = VK_NULL_HANDLE without VkPipelineRenderingCreateInfo"), tx(t, "vkPipe_e4b", "a validation error: the pipeline has no attachment formats. Chain the rendering info into pNext.")],
          [tx(t, "vkPipe_e5", "colorWriteMask left at 0"), tx(t, "vkPipe_e5b", "a valid pipeline that writes nothing: the window stays the clear colour. Set R | G | B | A.")],
          [tx(t, "vkPipe_e6", "Triangle missing with culling on"), tx(t, "vkPipe_e6b", "the winding is judged on the y-down screen, so OpenGL-style CCW data is back-facing. Match frontFace to your data, or cull NONE until it works.")],
          [tx(t, "vkPipe_e7", "Dynamic viewport with viewportCount = 0"), tx(t, "vkPipe_e7b", "a validation error. The rectangles are dynamic, the count still belongs to the pipeline: 1.")],
          [tx(t, "vkPipe_e8", "A location mismatch between stages"), tx(t, "vkPipe_e8b", "the fragment input reads garbage or zero, and the layer warns about an unmatched interface. Match layout(location) numbers, not names.")],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "vkPipe_tip", "Compile shaders as part of the build (a CMake custom command running glslc per file) so a changed .vert can never be paired with a stale .spv. glslc -g keeps debug information, which lets RenderDoc show your GLSL source while stepping through a shader.")}
      </Callout>

      <KeyIdeas t={t} id="vkPipe" items={[
        "A VkPipeline bakes shaders and all fixed-function state into one immutable object, compiled once, so draws never trigger hidden recompiles.",
        "Settings declared as dynamic state (here viewport and scissor) are set while recording, so a resize needs no new pipeline.",
        "Shaders are compiled ahead of time from GLSL to SPIR-V with glslc; the driver never sees source code.",
        "Stage interfaces match by layout(location), and Vulkan GLSL uses gl_VertexIndex.",
        "Vulkan's NDC has y = −1 at the top and depth in [0, 1]; the viewport maps NDC to pixels, and a negative height flips it.",
        "Winding is judged on the y-down screen: frontFace must match the data, and cullMode NONE is the safe start.",
        "colorWriteMask must be set, or nothing is written.",
        "With dynamic rendering the pipeline gets its attachment formats from VkPipelineRenderingCreateInfo, and renderPass is null.",
        "Pipeline creation is expensive: create pipelines at load time and keep a pipeline cache on disk.",
      ]} />
    </Article>
  );
}
