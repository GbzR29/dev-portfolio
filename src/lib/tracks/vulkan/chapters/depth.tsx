"use client";

// Resources 5: the depth buffer and face culling — why drawing order cannot
// sort intersecting surfaces; the per-fragment test and the compare ops
// (DepthTest figure); what the projection writes as depth, with a worked
// example; precision, depth formats and reversed Z (DepthPrecision figure);
// choosing a format; the depth image and resizing; pipeline state; recording
// (transition with its write-after-write barrier, attachment, clear);
// back-face culling with frontFace = COUNTER_CLOCKWISE; the quads become
// cubes; shutdown; mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { DepthTestFigure } from "@/components/lesson/figures/vulkan/DepthTestFigure";
import { DepthPrecisionFigure } from "@/components/lesson/figures/vulkan/DepthPrecisionFigure";
import { PipelineStateFigure } from "@/components/lesson/figures/vulkan/PipelineStateFigure";

const r = String.raw;

export function DepthContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "vkDepth_intro",
          "Watch the two quads of the last chapter where they cross: the one drawn second is always in front, even where it is behind. Drawing far things first (the painter's algorithm) cannot fix that, because the quads intersect: along the line where they cross, each is in front on one side. The fix is per pixel. A depth buffer stores, for every pixel, how far away the nearest surface drawn so far is, and each new fragment is compared with it. This chapter adds a depth attachment, turns on the depth test and back-face culling, and replaces the quads with two textured cubes that pass through each other.")}
      </Lead>

      <Goals t={t} id="vkDepth" items={[
        "Add a depth buffer so nearer surfaces hide farther ones.",
        "Choose a depth format and explain where depth precision goes.",
        "Turn on back-face culling with the right winding order.",
        "Draw cubes instead of flat quads.",
      ]} />

      <H2>{tx(t, "vkDepth_testTitle", "The depth test, per fragment")}</H2>
      <p>
        {tx(t, "vkDepth_testBody",
          "The rasterizer gives every fragment a depth z, interpolated across the triangle from its vertices, in the range [0, 1] set by the viewport's minDepth and maxDepth. Then, for each fragment:")}
      </p>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "vkDepth_t1", "Read the value stored in the depth attachment at that pixel.")}</li>
        <li>{tx(t, "vkDepth_t2", "Compare: depthCompareOp(z, stored). With LESS, the fragment passes if z < stored, that is, if it is nearer than everything drawn there so far.")}</li>
        <li>{tx(t, "vkDepth_t3", "If it fails, the fragment is discarded and the colour attachment is left untouched.")}</li>
        <li>{tx(t, "vkDepth_t4", "If it passes, its colour is written, and if depthWriteEnable is on, z replaces the stored value.")}</li>
      </ol>
      <p>
        {tx(t, "vkDepth_clearBody",
          "Each frame starts by clearing the depth attachment to 1.0, the far plane, so the first fragment at every pixel passes. The result no longer depends on drawing order for opaque surfaces, and intersections come out right automatically, because the comparison happens at every pixel separately.")}
      </p>
      <LessonTable
        headers={[tx(t, "vkDepth_tOp", "depthCompareOp"), tx(t, "vkDepth_tPasses", "Passes when"), tx(t, "vkDepth_tUse", "Typical use")]}
        rows={[
          ["LESS", "z < stored", tx(t, "vkDepth_op1", "the standard test: nearer wins")],
          ["LESS_OR_EQUAL", "z ≤ stored", tx(t, "vkDepth_op2", "a second pass over the same geometry (decals, multi-pass lighting), where depths are exactly equal")],
          ["GREATER / GREATER_OR_EQUAL", "z > stored", tx(t, "vkDepth_op3", "reversed Z, where near is 1 and far is 0")],
          ["EQUAL", "z = stored", tx(t, "vkDepth_op4", "shading only the surfaces a depth pre-pass has already chosen")],
          ["ALWAYS / NEVER", tx(t, "vkDepth_opAlways", "always / never"), tx(t, "vkDepth_op5", "the test is effectively off, but writes can still happen (ALWAYS)")],
        ]}
      />
      <DepthTestFigure t={t} />
      <Callout type="info" t={t}>
        {tx(t, "vkDepth_earlyNote", "The test can run before the fragment shader (early fragment tests), so hidden fragments cost no shading at all. GPUs do this automatically unless the shader writes gl_FragDepth or uses discard, which move the test after the shader. That is why drawing opaque objects roughly front to back makes frames faster, and why transparent objects, which must blend with what is behind them, are drawn after the opaque ones, back to front, with the test on and depth writes off.")}
      </Callout>

      <H2>{tx(t, "vkDepth_valueTitle", "What the projection writes as depth")}</H2>
      <p>
        {tx(t, "vkDepth_valueBody",
          "The depth is not the distance itself. The projection matrix from the Descriptors chapter, with GLM_FORCE_DEPTH_ZERO_TO_ONE, produces a clip-space z and a w equal to the distance d along the view direction; the hardware divides z by w. The result is:")}
      </p>
      <Equation label={tx(t, "vkDepth_eqZ", "Depth written by a zero-to-one perspective projection")}
        where={[
          ["d", tx(t, "vkDepth_wD", "the distance from the camera along its view direction (−z in view space)")],
          [r`n,\ f`, tx(t, "vkDepth_wNf", "the near and far planes passed to glm::perspective (0.1 and 10 in our camera)")],
          ["z", tx(t, "vkDepth_wZ", "the value stored in the depth buffer: 0 at d = n, 1 at d = f")],
        ]}>
        {r`z = \frac{f\,(d - n)}{(f - n)\,d}`}
      </Equation>
      <p>
        {tx(t, "vkDepth_hyperBody",
          "The 1 / d makes z grow fast near the camera and flatten out far away. That shape is not a design flaw: after the perspective divide, z is a linear function of the screen position across a triangle, so the rasterizer can interpolate it with a plain linear formula, and comparing z values sorts surfaces in the same order as comparing distances. The cost is how the range is spent.")}
      </p>
      <H3>{tx(t, "vkDepth_workedTitle", "Worked example: where the depth range goes")}</H3>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "vkDepth_w1", "Our camera: n = 0.1, f = 10, so f − n = 9.9. At d = 1: z = 10 · 0.9 / (9.9 · 1) = 0.909.")}</li>
        <li>{tx(t, "vkDepth_w2", "At d = 5: z = 10 · 4.9 / (9.9 · 5) = 0.990. At d = 10: z = 10 · 9.9 / (9.9 · 10) = 1.")}</li>
        <li>{tx(t, "vkDepth_w3", "Half of the range: z = 0.5 when d = 2fn / (f + n) = 2 / 10.1 = 0.198. The first tenth of a unit past the near plane uses half of all depth values.")}</li>
        <li>{tx(t, "vkDepth_w4", "Everything from d = 1 to d = 10, where the whole scene is, shares the last 9% of the range. Moving the near plane from 0.1 to 0.5 moves that half-way point to 0.95 and gives the scene far more of the range.")}</li>
      </ol>

      <H2>{tx(t, "vkDepth_precTitle", "Precision and depth formats")}</H2>
      <p>
        {tx(t, "vkDepth_precBody",
          "A depth format can only store certain values. Two surfaces whose depths round to the same stored value flicker against each other as the camera moves: z-fighting. The smallest separation that still sorts at distance d is the spacing ε between stored values near z, divided by how fast z changes with distance:")}
      </p>
      <Equation label={tx(t, "vkDepth_eqPrec", "Smallest resolvable gap at distance d")}
        where={[
          [r`\varepsilon`, tx(t, "vkDepth_wEps", "the gap between neighbouring stored values near z: 1 / (2²⁴ − 1) everywhere for D24_UNORM; for a 32-bit float it depends on z, about z · 2⁻²³")],
          [r`\frac{dz}{dd}`, tx(t, "vkDepth_wSlope", "the slope of the depth curve: the derivative of z = f(d − n) / ((f − n) d) with respect to d")],
          [r`\Delta d`, tx(t, "vkDepth_wDelta", "surfaces closer together than this at distance d get the same stored depth")],
        ]}>
        {r`\Delta d \approx \frac{\varepsilon}{\left|dz/dd\right|} = \varepsilon \cdot \frac{(f - n)\,d^2}{f\,n}`}
      </Equation>
      <p>
        {tx(t, "vkDepth_precEx",
          "With n = 0.1, f = 1000 and D24, at d = 100: Δd = 6 · 10⁻⁸ · 999.9 · 10⁴ / 100 = 0.006. Two walls 5 millimetres apart, 100 metres away, flicker. The d² means precision falls off fast with distance, and the n in the denominator is why the single most effective fix is a larger near plane: n = 1 makes the same gap ten times smaller.")}
      </p>
      <LessonTable
        headers={[tx(t, "vkDepth_tFormat", "Format"), tx(t, "vkDepth_tBytes", "Bytes"), tx(t, "vkDepth_tNotes", "Notes")]}
        rows={[
          ["D16_UNORM", "2", tx(t, "vkDepth_f1", "supported everywhere; enough for shadow maps and small scenes")],
          ["X8_D24_UNORM_PACK32 / D24_UNORM_S8_UINT", "4", tx(t, "vkDepth_f2", "24 evenly spaced steps (plus 8 stencil bits); not supported on every GPU, notably some AMD cards")],
          ["D32_SFLOAT", "4", tx(t, "vkDepth_f3", "a 32-bit float; supported almost everywhere, and the one to use with reversed Z")],
          ["D32_SFLOAT_S8_UINT", "5–8", tx(t, "vkDepth_f4", "float depth plus stencil, usually stored as two planes")],
        ]}
      />
      <p>
        {tx(t, "vkDepth_revBody",
          "A float is dense near 0 and sparse near 1. The standard depth curve puts distant surfaces near 1, so D32_SFLOAT is barely better than D24 exactly where precision is short. Reversed Z stores 1 − z instead: near is 1, far is 0, and the density of floats near 0 cancels the 1 / d curve almost perfectly. It takes three changes: pass far and near swapped to glm::perspective, clear the depth to 0.0, and use GREATER. This track keeps the standard setup for now, so the code matches other tutorials; the figure shows what switching buys.")}
      </p>
      <DepthPrecisionFigure t={t} />

      <H2>{tx(t, "vkDepth_formatTitle", "Choosing the format")}</H2>
      <p>
        {tx(t, "vkDepth_formatBody",
          "The specification guarantees D16_UNORM, at least one of X8_D24_UNORM_PACK32 and D32_SFLOAT, and at least one of D24_UNORM_S8_UINT and D32_SFLOAT_S8_UINT as depth attachments. We need no stencil yet, so we try D32_SFLOAT first and fall back:")}
      </p>
      <CodeBlock lang="cpp" filename="depth.cpp" t={t}>{`VkFormat findDepthFormat(VkPhysicalDevice gpu) {
    for (VkFormat f : {VK_FORMAT_D32_SFLOAT, VK_FORMAT_X8_D24_UNORM_PACK32, VK_FORMAT_D16_UNORM}) {
        VkFormatProperties props;
        vkGetPhysicalDeviceFormatProperties(gpu, f, &props);
        if (props.optimalTilingFeatures & VK_FORMAT_FEATURE_DEPTH_STENCIL_ATTACHMENT_BIT)
            return f;                                   // first one the GPU can render depth into
    }
    throw std::runtime_error("no depth format");        // cannot happen: D16 is required
}`}</CodeBlock>

      <H2>{tx(t, "vkDepth_imageTitle", "The depth image")}</H2>
      <p>
        {tx(t, "vkDepth_imageBody",
          "The depth attachment is an ordinary image from the previous chapter's createImage, with a depth format, DEPTH_STENCIL_ATTACHMENT usage and the DEPTH aspect. It must be exactly as large as the colour attachment it is used with, so it is rebuilt whenever the swapchain is. One depth image is enough for every swapchain image: frames are rendered one after another on one queue, and the barrier below makes each frame wait for the previous one's depth writes.")}
      </p>
      <CodeBlock lang="cpp" filename="depth.cpp" t={t}>{`// App gains: Image depth; VkFormat depthFormat;   (depthFormat = findDepthFormat(app.gpu) after pickGpu)
void createDepth(App& app) {
    app.depth = createImage(app, {app.swapExtent.width, app.swapExtent.height, 1}, app.depthFormat,
        VK_IMAGE_USAGE_DEPTH_STENCIL_ATTACHMENT_BIT,    // rendered into, never sampled (yet)
        VK_IMAGE_ASPECT_DEPTH_BIT);                     // the view sees the depth aspect
}

// recreateSwapchain, after createSwapchain(app):
destroyImage(app, app.depth);
createDepth(app);`}</CodeBlock>

      <H2>{tx(t, "vkDepth_pipeTitle", "Pipeline state")}</H2>
      <CodeBlock lang="cpp" filename="pipeline.cpp" t={t}>{`VkPipelineDepthStencilStateCreateInfo depth{};
depth.sType                 = VK_STRUCTURE_TYPE_PIPELINE_DEPTH_STENCIL_STATE_CREATE_INFO;
depth.depthTestEnable       = VK_TRUE;              // compare each fragment with the buffer
depth.depthWriteEnable      = VK_TRUE;              // and store the depth of the ones that pass
depth.depthCompareOp        = VK_COMPARE_OP_LESS;   // nearer wins; the buffer is cleared to 1.0
depth.depthBoundsTestEnable = VK_FALSE;             // optional extra test against a fixed range
depth.stencilTestEnable     = VK_FALSE;
info.pDepthStencilState     = &depth;               // was nullptr

rendering.depthAttachmentFormat = app.depthFormat;  // VkPipelineRenderingCreateInfo: must match the image

raster.cullMode  = VK_CULL_MODE_BACK_BIT;           // was NONE
raster.frontFace = VK_FRONT_FACE_COUNTER_CLOCKWISE; // y-up models through the flipped projection`}</CodeBlock>

      <H2>{tx(t, "vkDepth_recordTitle", "Recording: the transition, the attachment, the clear")}</H2>
      <p>
        {tx(t, "vkDepth_recordBody",
          "transitionImage has always used the colour aspect. A depth image needs the depth aspect in its subresource range, so the helper gains a last parameter with the colour aspect as default; every earlier call stays as it is.")}
      </p>
      <CodeBlock lang="cpp" filename="commands.cpp" t={t}>{`void transitionImage(VkCommandBuffer cmd, VkImage image,
                     VkImageLayout oldLayout, VkImageLayout newLayout,
                     VkPipelineStageFlags2 srcStage, VkAccessFlags2 srcAccess,
                     VkPipelineStageFlags2 dstStage, VkAccessFlags2 dstAccess,
                     VkImageAspectFlags aspect = VK_IMAGE_ASPECT_COLOR_BIT) {
    // ... as before, with:
    barrier.subresourceRange = {aspect, 0, 1, 0, 1};
}

// recordFrame, next to the colour transition:
constexpr VkPipelineStageFlags2 kDepthStages =
    VK_PIPELINE_STAGE_2_EARLY_FRAGMENT_TESTS_BIT | VK_PIPELINE_STAGE_2_LATE_FRAGMENT_TESTS_BIT;
transitionImage(cmd, app.depth.image, VK_IMAGE_LAYOUT_UNDEFINED, VK_IMAGE_LAYOUT_DEPTH_ATTACHMENT_OPTIMAL,
    kDepthStages, VK_ACCESS_2_DEPTH_STENCIL_ATTACHMENT_WRITE_BIT,          // the previous frame's depth writes...
    kDepthStages, VK_ACCESS_2_DEPTH_STENCIL_ATTACHMENT_READ_BIT |
                  VK_ACCESS_2_DEPTH_STENCIL_ATTACHMENT_WRITE_BIT,          // ...before this frame's clear and tests
    VK_IMAGE_ASPECT_DEPTH_BIT);

VkRenderingAttachmentInfo depthAtt{};
depthAtt.sType       = VK_STRUCTURE_TYPE_RENDERING_ATTACHMENT_INFO;
depthAtt.imageView   = app.depth.view;
depthAtt.imageLayout = VK_IMAGE_LAYOUT_DEPTH_ATTACHMENT_OPTIMAL;
depthAtt.loadOp      = VK_ATTACHMENT_LOAD_OP_CLEAR;
depthAtt.storeOp     = VK_ATTACHMENT_STORE_OP_DONT_CARE;       // nobody reads it after the frame
depthAtt.clearValue.depthStencil = {1.0f, 0};                  // depth 1.0 = the far plane, stencil 0

rendering.pDepthAttachment = &depthAtt;                        // VkRenderingInfo, next to the colour one`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "vkDepth_tChoice", "Choice"), tx(t, "vkDepth_tReason", "Reason")]}
        rows={[
          [tx(t, "vkDepth_r1", "old layout UNDEFINED"), tx(t, "vkDepth_r1b", "last frame's depth values are not needed, because the attachment is cleared. UNDEFINED lets the GPU skip preserving them.")],
          [tx(t, "vkDepth_r2", "src = fragment tests / depth write, not NONE"), tx(t, "vkDepth_r2b", "the same image was written by the previous frame. Clearing it before those writes finish would be a write-after-write hazard, which synchronization validation reports. The barrier orders against all earlier work on the queue, including the previous frame's submit.")],
          [tx(t, "vkDepth_r3", "early and late fragment tests"), tx(t, "vkDepth_r3b", "the depth test runs in the early stage or, when the shader writes depth or discards, in the late stage; the barrier must cover both.")],
          [tx(t, "vkDepth_r4", "loadOp CLEAR, 1.0"), tx(t, "vkDepth_r4b", "every pixel starts at the far plane, so the first fragment there passes LESS.")],
          [tx(t, "vkDepth_r5", "storeOp DONT_CARE"), tx(t, "vkDepth_r5b", "depth is only needed during the frame. On tile-based mobile GPUs the depth values then never leave on-chip memory at all.")],
        ]}
      />

      <H2>{tx(t, "vkDepth_cullTitle", "Back-face culling")}</H2>
      <p>
        {tx(t, "vkDepth_cullBody",
          "The inside of a closed mesh can never be seen from outside, and every triangle facing away from the camera is on the far side of the mesh, hidden by the front. Culling discards those triangles before they are rasterized, about half of a mesh's triangles, with no visible change. Which side is the front is decided by winding: the order in which the three vertices go around the triangle on screen. Our meshes list the vertices of every outward face counter-clockwise as seen from outside, in a y-up world; the projection's y flip keeps them counter-clockwise on the screen, hence frontFace = COUNTER_CLOCKWISE.")}
      </p>
      <p>
        {tx(t, "vkDepth_cullCheck",
          "A check with vectors: for a triangle a, b, c, the cross product (b − a) × (c − a) points out of the side from which a, b, c look counter-clockwise. The front face of the cube, at z = +0.5, starts with a = (−0.5, −0.5), b = (0.5, −0.5), c = (0.5, 0.5): (1, 0, 0) × (1, 1, 0) = (0, 0, 1), pointing at the camera, which sits at +z. Seen from the camera it is counter-clockwise, so it is front-facing and drawn. The same face seen from behind would be clockwise and culled. If a mesh ever looks inside out, showing its far inner walls, the winding and frontFace disagree.")}
      </p>
      <PipelineStateFigure t={t} />

      <H2>{tx(t, "vkDepth_cubeTitle", "From quads to cubes")}</H2>
      <p>
        {tx(t, "vkDepth_cubeBody",
          "A flat quad has nothing to hide, so the scene becomes two cubes. Each face needs its own four vertices, because the uv of a corner differs from face to face: 6 faces × 4 = 24 vertices and 6 × 6 = 36 indices. A face is described by its outward normal n and two axes u and v along its edges, chosen so that u × v = n; walking the corners (−u, −v), (+u, −v), (+u, +v), (−u, +v) is then counter-clockwise seen from outside. There is no lighting yet, so a fixed shade per face, stored in the vertex colour, keeps the edges readable.")}
      </p>
      <CodeBlock lang="cpp" filename="mesh.h" t={t}>{`struct Vertex {
    float pos[3];      // x, y, z in model space   (offset 0)   ← now 3D
    float color[3];    // per-face shade            (offset 12)
    float uv[2];       //                           (offset 24)
};                     // sizeof(Vertex) = 32

struct Face { glm::vec3 n, u, v; float shade; };          // u × v = n
const Face kFaces[6] = {
    {{ 1, 0, 0}, { 0, 0,-1}, {0, 1, 0}, 0.80f},   // +x, right
    {{-1, 0, 0}, { 0, 0, 1}, {0, 1, 0}, 0.80f},   // −x, left
    {{ 0, 1, 0}, { 1, 0, 0}, {0, 0,-1}, 1.00f},   // +y, top
    {{ 0,-1, 0}, { 1, 0, 0}, {0, 0, 1}, 0.50f},   // −y, bottom
    {{ 0, 0, 1}, { 1, 0, 0}, {0, 1, 0}, 0.90f},   // +z, front
    {{ 0, 0,-1}, {-1, 0, 0}, {0, 1, 0}, 0.65f},   // −z, back
};

void makeCube(std::vector<Vertex>& verts, std::vector<uint16_t>& indices) {
    const float su[4] = {-1, 1, 1, -1}, sv[4] = {-1, -1, 1, 1};   // corners, counter-clockwise
    for (const Face& f : kFaces) {
        const uint16_t base = uint16_t(verts.size());
        for (int k = 0; k < 4; k++) {
            const glm::vec3 p = 0.5f * (f.n + su[k] * f.u + sv[k] * f.v);   // unit cube around 0
            verts.push_back({{p.x, p.y, p.z}, {f.shade, f.shade, f.shade},
                             {(su[k] + 1) * 0.5f, (1 - sv[k]) * 0.5f}});      // v = 0 on the +v edge
        }
        for (uint16_t i : {0, 1, 2, 2, 3, 0}) indices.push_back(uint16_t(base + i));
    }
}`}</CodeBlock>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`// createMesh: build the cube, upload as before  (App gains: uint32_t indexCount;)
std::vector<Vertex> verts;  std::vector<uint16_t> indices;
makeCube(verts, indices);                                   // 24 vertices, 36 indices
app.vertexBuffer = createDeviceBuffer(app, verts.data(), verts.size() * sizeof(Vertex), /* ... */);
app.indexBuffer  = createDeviceBuffer(app, indices.data(), indices.size() * sizeof(uint16_t), /* ... */);
app.indexCount   = uint32_t(indices.size());

// createPipeline: attribute 0 is now three floats
attrs[0].format = VK_FORMAT_R32G32B32_SFLOAT;               // offsetof(Vertex, pos) = 0
// attrs[1].offset = offsetof(Vertex, color) = 12, attrs[2].offset = offsetof(Vertex, uv) = 24

// recordFrame: draw every index
vkCmdDrawIndexed(cmd, app.indexCount, 1, 0, 0, 0);

// makeCamera: look down at the cubes a little, so the tops show
c.view = glm::lookAt(glm::vec3(0.0f, 1.5f, 3.5f), glm::vec3(0.0f), glm::vec3(0.0f, 1.0f, 0.0f));`}</CodeBlock>
      <CodeBlock lang="glsl" filename="shaders/quad.vert" t={t}>{`layout(location = 0) in vec3 inPos;                                  // was vec2
// ...
gl_Position = cam.proj * cam.view * pc.model * vec4(inPos, 1.0);     // z comes from the mesh now`}</CodeBlock>
      <Callout type="tip" t={t}>
        {tx(t, "vkDepth_run", "Build and run: two textured cubes turning in opposite directions, sunk into each other in the middle. Where they intersect, the crossing edge is sharp and moves as they turn: the depth test decides it pixel by pixel. To see what each part does, set depthTestEnable to VK_FALSE (the later cube covers the other), set cullMode back to NONE (no visible change, which is the point), or set frontFace to CLOCKWISE (the cubes turn inside out: only their inner far walls remain).")}
      </Callout>

      <H2>{tx(t, "vkDepth_shutdownTitle", "Shutdown, updated")}</H2>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`destroyImage(app, app.depth);          // with the swapchain views: it has the swapchain's size
// ... then the texture, the sampler, the buffers and the rest as before`}</CodeBlock>

      <H2>{tx(t, "vkDepth_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "vkDepth_tMistake", "Mistake"), tx(t, "vkDepth_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "vkDepth_e1", "Clearing depth to 0.0 with LESS"), tx(t, "vkDepth_e1b", "nothing is ever nearer than 0, so the screen stays at the clear colour. Clear to 1.0, or use GREATER with reversed Z.")],
          [tx(t, "vkDepth_e2", "Forgetting depthAttachmentFormat in VkPipelineRenderingCreateInfo"), tx(t, "vkDepth_e2b", "a validation error at the draw: the pipeline's formats do not match the rendering's attachments.")],
          [tx(t, "vkDepth_e3", "Not recreating the depth image on resize"), tx(t, "vkDepth_e3b", "the render area is larger than the depth attachment: a validation error, then a crash or a device lost.")],
          [tx(t, "vkDepth_e4", "COLOR aspect in the depth transition"), tx(t, "vkDepth_e4b", "a validation error: the aspect must match the format. Pass VK_IMAGE_ASPECT_DEPTH_BIT (and STENCIL for a combined format).")],
          [tx(t, "vkDepth_e5", "srcStage NONE on the per-frame depth transition"), tx(t, "vkDepth_e5b", "a write-after-write hazard with the previous frame; it usually works, until it does not. Wait on the fragment-test stages.")],
          [tx(t, "vkDepth_e6", "A tiny near plane (0.001) to avoid clipping"), tx(t, "vkDepth_e6b", "z-fighting in the distance. Use the largest near plane the scene allows, or reversed Z with D32_SFLOAT.")],
          [tx(t, "vkDepth_e7", "Winding and frontFace that disagree"), tx(t, "vkDepth_e7b", "inside-out meshes: the front faces are culled and the far inner walls drawn. Match frontFace to how the mesh is wound after the y flip.")],
          [tx(t, "vkDepth_e8", "Assuming D24_UNORM_S8_UINT exists"), tx(t, "vkDepth_e8b", "vkCreateImage fails on GPUs without it. Query the format features and fall back.")],
        ]}
      />

      <KeyIdeas t={t} id="vkDepth" items={[
        "Drawing order cannot sort intersecting surfaces; a depth buffer compares every fragment with the nearest depth drawn at its pixel.",
        "With LESS and a clear of 1.0, a fragment passes when it is nearer, and depthWriteEnable stores its depth.",
        "The stored depth is z = f(d − n) / ((f − n) d): half the range is spent between n and about 2n.",
        "The smallest gap that still sorts grows with d² and shrinks with n: push the near plane out before anything else.",
        "Reversed Z with D32_SFLOAT (swap near and far, clear to 0, GREATER) gives almost even precision at every distance.",
        "The depth image is created like any image, with a depth format, DEPTH_STENCIL_ATTACHMENT usage and the DEPTH aspect, and rebuilt with the swapchain.",
        "The per-frame depth transition waits on the previous frame's depth writes; storeOp is DONT_CARE.",
        "Back-face culling drops triangles whose on-screen winding is not frontFace; our y-up meshes are COUNTER_CLOCKWISE.",
        "The pipeline needs depthStencil state and the depth format in VkPipelineRenderingCreateInfo.",
      ]} />
    </Article>
  );
}
