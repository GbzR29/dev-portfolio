"use client";

// The "Performance" section: Measuring → (Face Culling, in index.tsx) → Frustum & Occlusion Culling → Draw Calls & State → Level of Detail → Buffer Streaming & Sync.

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { FrameTimelineFigure } from "@/components/lesson/figures/perf/FrameTimelineFigure";
import { BottleneckLabFigure } from "@/components/lesson/figures/perf/BottleneckLabFigure";
import { FrustumCullFigure } from "@/components/lesson/figures/perf/FrustumCullFigure";
import { SortKeyFigure } from "@/components/lesson/figures/perf/SortKeyFigure";
import { LodFigure } from "@/components/lesson/figures/perf/LodFigure";
import { StreamingFigure } from "@/components/lesson/figures/perf/StreamingFigure";

const r = String.raw;

// ═════════════════════════════════════════════════════════════════════════════
// Measuring performance
// ═════════════════════════════════════════════════════════════════════════════

export function ProfilingContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglProf_intro",
          "Optimising without measuring is guessing, and in graphics the guesses are usually wrong. The GPU runs asynchronously, far behind the CPU, so a slow line of C++ may cost nothing while an innocent-looking call stalls everything. This chapter is about finding the actual bottleneck before touching any code. The rest of the section is about what to do once you know it.")}
      </Lead>

      <H2>{tx(t, "oglProf_msTitle", "Think in milliseconds, not FPS")}</H2>
      <Equation label={tx(t, "oglProf_msLabel", "Frame time and frame rate")}
        where={[[r`T`, tx(t, "oglProf_wT", "frame time in milliseconds")]]}
        note={tx(t, "oglProf_msNote", "FPS is the reciprocal of what you pay, so its changes are misleading. Going from 60 to 50 fps costs 3.3 ms, while 200 to 150 fps costs only 1.7 ms. Costs add in milliseconds: a 2 ms shadow pass plus a 3 ms post chain is 5 ms. At 60 Hz the whole budget is 16.7 ms, at 144 Hz 6.9 ms, and in VR at 90 Hz 11.1 ms, with some kept free for the compositor.")}>
        {r`\text{FPS} = \frac{1000}{T} \qquad \Delta T = \frac{1000}{\text{FPS}_{new}} - \frac{1000}{\text{FPS}_{old}}`}
      </Equation>

      <H2>{tx(t, "oglProf_pipeTitle", "Two processors on an assembly line")}</H2>
      <p>
        {tx(t, "oglProf_pipeBody",
          "GL calls do not execute when you make them. The driver records them into a command buffer that the GPU consumes a frame or two later. The CPU and the GPU therefore work in parallel on different frames, and the frame time is set by whichever of the two is slower. Speeding up the other one changes nothing, which is why guessing so often fails.")}
      </p>
      <Equation label={tx(t, "oglProf_boundLabel", "Steady-state frame time")}
        where={[
          [r`T_{CPU},\ T_{GPU}`, tx(t, "oglProf_wCG", "time each processor spends per frame")],
          [r`T_{vsync}`, tx(t, "oglProf_wV", "refresh interval, 16.7 ms at 60 Hz")],
        ]}
        note={tx(t, "oglProf_boundNote", "With vsync, a frame that misses the refresh by a little waits for the next one: 17 ms of work shows as 33.3 ms (30 fps) with double buffering. A synchronisation point, like reading a result back, breaks the overlap, and the two times add instead.")}>
        {r`T \approx \max(T_{CPU},\ T_{GPU}) \;\xrightarrow{\text{vsync}}\; \left\lceil \frac{\max(T_{CPU}, T_{GPU})}{T_{vsync}} \right\rceil T_{vsync} \qquad T_{sync} \approx T_{CPU} + T_{GPU}`}
      </Equation>
      <FrameTimelineFigure t={t} />

      <H2>{tx(t, "oglProf_gpuTitle", "Timing the GPU: timer queries")}</H2>
      <p>
        {tx(t, "oglProf_gpuBody",
          "std::chrono around a glDrawElements measures how long it took to record the command, not to execute it. To time GPU work, ask the GPU: a GL_TIME_ELAPSED query brackets a range of commands, and the GPU writes the elapsed nanoseconds when it gets there. Reading the result immediately would stall until the GPU catches up, so keep a small ring of queries and read the one from a few frames ago:")}
      </p>
      <CodeBlock lang="cpp" filename="gpu_timer.cpp" t={t}>{`struct GpuTimer {
    static constexpr int N = 4;              // > frames in flight: results are ready when read
    GLuint q[N];  int frame = 0;  double ms = 0;

    void init()  { glGenQueries(N, q); }
    void begin() { glBeginQuery(GL_TIME_ELAPSED, q[frame % N]); }
    void end() {
        glEndQuery(GL_TIME_ELAPSED);
        ++frame;
        if (frame >= N) {                    // the oldest query, N − 1 frames old
            GLuint oldest = q[frame % N], ready = 0;
            glGetQueryObjectuiv(oldest, GL_QUERY_RESULT_AVAILABLE, &ready);
            if (ready) {
                GLuint64 ns;
                glGetQueryObjectui64v(oldest, GL_QUERY_RESULT, &ns);
                ms = ms * 0.9 + (ns / 1e6) * 0.1;   // smooth: single frames are noisy
            }
        }
    }
};

shadowTimer.begin();  renderShadows();  shadowTimer.end();
gbufferTimer.begin(); renderGBuffer();  gbufferTimer.end();`}</CodeBlock>
      <p>
        {tx(t, "oglProf_nestBody",
          "GL_TIME_ELAPSED queries cannot be nested. For a hierarchical profiler (frame → pass → sub-pass), use glQueryCounter(q, GL_TIMESTAMP) at every boundary instead: each gives an absolute GPU time, and differences give every range. Label the same ranges with glPushDebugGroup so they show up by name in RenderDoc and Nsight.")}
      </p>

      <H2>{tx(t, "oglProf_findTitle", "Finding the bottleneck by experiment")}</H2>
      <p>
        {tx(t, "oglProf_findBody",
          "A frame is limited by exactly one thing at a time. The fastest way to find it is to change one load and watch the frame time. Anything that does not move the frame time is not the bottleneck:")}
      </p>
      <LessonTable
        headers={[tx(t, "oglProf_thTry", "Try"), tx(t, "oglProf_thIf", "If the frame gets faster…"), tx(t, "oglProf_thFix", "Look at")]}
        rows={[
          [tx(t, "oglProf_e1", "Render at ¼ the resolution"), tx(t, "oglProf_e1i", "fragment / fill / bandwidth bound"), tx(t, "oglProf_e1f", "shader cost, overdraw, blending, render-target formats, MSAA")],
          [tx(t, "oglProf_e2", "Replace fragment shaders with a flat colour"), tx(t, "oglProf_e2i", "fragment ALU / texture bound"), tx(t, "oglProf_e2f", "shader maths, texture fetches, mip use")],
          [tx(t, "oglProf_e3", "Skip every draw call but keep the CPU work"), tx(t, "oglProf_e3i", "GPU bound somewhere in the draws"), tx(t, "oglProf_e3f", "per-pass GPU timers")],
          [tx(t, "oglProf_e4", "Skip all GL calls entirely"), tx(t, "oglProf_e4i", "driver / API overhead (CPU)"), tx(t, "oglProf_e4f", "draw count, state changes — see Draw Calls & State")],
          [tx(t, "oglProf_e5", "Use lower-poly meshes"), tx(t, "oglProf_e5i", "vertex / primitive bound"), tx(t, "oglProf_e5f", "LOD, culling, vertex format size")],
          [tx(t, "oglProf_e6", "Nothing changes"), tx(t, "oglProf_e6i", "CPU bound in your own code, or vsync-capped"), tx(t, "oglProf_e6f", "a CPU profiler (Tracy, Superluminal, VTune), or turn vsync off")],
        ]}
      />
      <BottleneckLabFigure t={t} />

      <H2>{tx(t, "oglProf_toolsTitle", "Tools")}</H2>
      <LessonTable
        headers={[tx(t, "oglProf_thTool", "Tool"), tx(t, "oglProf_thUse", "Use it for")]}
        rows={[
          ["RenderDoc", tx(t, "oglProf_t1", "capture one frame; inspect every draw, its state, textures, meshes and shaders; per-draw GPU durations")],
          ["NVIDIA Nsight Graphics / AMD RGP / Intel GPA", tx(t, "oglProf_t2", "hardware counters: which unit (SM, texture, ROP, memory) is saturated, occupancy, stalls")],
          ["Tracy", tx(t, "oglProf_t3", "a frame profiler for CPU zones and GPU zones (it wraps timer queries) on one timeline")],
          ["apitrace", tx(t, "oglProf_t4", "record every GL call to a file and replay it; find redundant calls")],
          ["GL_KHR_debug", tx(t, "oglProf_t5", "performance warnings from the driver (\"buffer used as source while being written, stalling\")")],
        ]}
      />
      <Callout type="warn" t={t}>
        {tx(t, "oglProf_pitfalls",
          "Measure release builds with vsync off, and look at averages over hundreds of frames, or better the worst 1% (players feel stutters, not averages). Never put glFinish or glGetError in the hot loop outside debug builds, since both drain the pipeline. GPU clocks ramp up and down with load, so a nearly idle scene can be slower per frame than a busy one; warm up before measuring. And laptops switch GPUs and throttle when hot.")}
      </Callout>

      <KeyIdeas t={t} id="oglProf" items={[
        "Measure in milliseconds; costs add in ms, not in FPS.",
        "CPU and GPU overlap on different frames: T ≈ max(T_CPU, T_GPU). A readback or glFinish makes them add.",
        "Time GPU work with GL_TIME_ELAPSED / GL_TIMESTAMP queries, read a few frames later.",
        "Find the bottleneck by changing one load at a time (resolution, shader, draw count) and watching frame time.",
        "Use RenderDoc for correctness, vendor tools for hardware counters, a frame profiler for the timeline.",
      ]} />
    </Article>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Frustum & occlusion culling
// ═════════════════════════════════════════════════════════════════════════════

export function FrustumCullingContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglCull_intro",
          "The fastest draw call is the one you never make. The GPU would clip an off-screen object anyway, but only after the CPU has issued its draw and the GPU has transformed every vertex. Culling decides on the CPU, or earlier on the GPU, that an object cannot be visible, using a cheap bounding volume instead of its triangles. In a typical open scene more than half of everything is behind or beside the camera.")}
      </Lead>

      <H2>{tx(t, "oglCull_planesTitle", "The frustum as six planes")}</H2>
      <p>
        {tx(t, "oglCull_planesBody",
          "A point is inside the view frustum exactly when its clip-space coordinates satisfy −w ≤ x, y, z ≤ w. Each inequality is a plane, and because clip = M·p with M = projection · view, the plane equations can be read straight out of the rows of M (Gribb & Hartmann, 2001). No trigonometry, and it works for any projection:")}
      </p>
      <Equation label={tx(t, "oglCull_ghLabel", "Extracting planes from the view-projection matrix")}
        where={[
          [r`m_i`, tx(t, "oglCull_wRow", "row i of M = P·V (as a 4-vector)")],
          [r`(\mathbf n, d)`, tx(t, "oglCull_wPlane", "a plane: points with n·p + d ≥ 0 are inside")],
        ]}
        note={tx(t, "oglCull_ghNote", "Normalise each plane (divide by ‖n‖) so n·p + d is a true distance, which the sphere test needs. Pass M = P·V·Model instead and the planes come out in that object's local space.")}>
        {r`\begin{aligned}
\text{left} &= m_3 + m_0 & \text{right} &= m_3 - m_0 \\
\text{bottom} &= m_3 + m_1 & \text{top} &= m_3 - m_1 \\
\text{near} &= m_3 + m_2 & \text{far} &= m_3 - m_2
\end{aligned}`}
      </Equation>
      <CodeBlock lang="cpp" filename="frustum.cpp" t={t}>{`struct Plane { glm::vec3 n; float d; };

std::array<Plane, 6> extractPlanes(const glm::mat4& m) {   // m = projection * view
    auto row = [&](int i) { return glm::vec4(m[0][i], m[1][i], m[2][i], m[3][i]); };  // GLM is column-major
    glm::vec4 r0 = row(0), r1 = row(1), r2 = row(2), r3 = row(3);
    glm::vec4 p[6] = { r3 + r0, r3 - r0, r3 + r1, r3 - r1, r3 + r2, r3 - r2 };
    std::array<Plane, 6> out;
    for (int i = 0; i < 6; ++i) {
        float len = glm::length(glm::vec3(p[i]));
        out[i] = { glm::vec3(p[i]) / len, p[i].w / len };
    }
    return out;
}`}</CodeBlock>

      <H2>{tx(t, "oglCull_testsTitle", "Testing bounding volumes")}</H2>
      <Equation label={tx(t, "oglCull_sphereLabel", "Sphere and AABB against a plane")}
        where={[
          [r`c,\ \rho`, tx(t, "oglCull_wSphere", "sphere centre and radius")],
          [r`\mathbf e`, tx(t, "oglCull_wExt", "AABB half-extents (from its centre c)")],
          [r`p^{+}`, tx(t, "oglCull_wPv", "the box corner furthest along n (the \"p-vertex\")")],
        ]}
        note={tx(t, "oglCull_testNote", "Test all six planes; outside any one of them means culled. The AABB form with |n| gives the box's projected radius onto n: that is the p-vertex test in one line and no branches. Both tests are conservative. Near the frustum's corners, a volume can be outside the frustum yet not fully behind any single plane, so it passes. That costs an extra draw, never a missing object.")}>
        {r`\text{sphere outside} \iff \exists\,i:\ \mathbf n_i\cdot c + d_i < -\rho \qquad \text{AABB outside} \iff \exists\,i:\ \mathbf n_i\cdot c + d_i < -\,\mathbf e\cdot|\mathbf n_i|`}
      </Equation>
      <CodeBlock lang="cpp" filename="cull.cpp" t={t}>{`bool visible(const std::array<Plane, 6>& f, glm::vec3 c, glm::vec3 e) {
    for (const Plane& p : f) {
        float r = glm::dot(e, glm::abs(p.n));        // box "radius" along this normal
        if (glm::dot(p.n, c) + p.d < -r) return false;
    }
    return true;
}

visibleList.clear();
for (const Object& o : objects)
    if (visible(frustum, o.worldBounds.center, o.worldBounds.extent))
        visibleList.push_back(&o);`}</CodeBlock>
      <FrustumCullFigure t={t} />

      <H2>{tx(t, "oglCull_hierTitle", "Hierarchies: not testing everything")}</H2>
      <p>
        {tx(t, "oglCull_hierBody",
          "Testing 100 000 objects one by one is itself a cost. Group them in a spatial structure (a grid, an octree or a bounding volume hierarchy) and test the groups first. A group outside the frustum removes everything in it with one test, and a group fully inside accepts everything without further tests. Only groups that straddle a plane are opened. Data layout matters as much as the algorithm: store bounds in flat, contiguous arrays (structure of arrays), so the test loop streams through memory and vectorises.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "oglCull_gameDev", "Building and updating these structures for moving objects (quadtrees, loose octrees, BVH refits) is covered in the Game Dev track. Here the point is what they buy the renderer.")}
      </Callout>

      <H2>{tx(t, "oglCull_occTitle", "Occlusion culling: hidden behind something")}</H2>
      <p>
        {tx(t, "oglCull_occBody",
          "Frustum culling keeps everything inside the view, including the 500 rooms behind the wall in front of you. Occlusion culling removes objects hidden by other objects. The GPU can answer \"would any pixel of this pass the depth test?\" with an occlusion query. Drawing just the bounding box with colour and depth writes off, you get a sample count back:")}
      </p>
      <CodeBlock lang="cpp" filename="occlusion.cpp" t={t}>{`// Frame N: draw big occluders first, then test cheap proxies
glColorMask(GL_FALSE, GL_FALSE, GL_FALSE, GL_FALSE);
glDepthMask(GL_FALSE);
for (auto& o : candidates) {
    glBeginQuery(GL_ANY_SAMPLES_PASSED_CONSERVATIVE, o.query);
    drawBoundingBox(o);
    glEndQuery(GL_ANY_SAMPLES_PASSED_CONSERVATIVE);
}
glColorMask(GL_TRUE, GL_TRUE, GL_TRUE, GL_TRUE);
glDepthMask(GL_TRUE);

// Let the GPU decide, without a CPU round trip:
for (auto& o : candidates) {
    glBeginConditionalRender(o.query, GL_QUERY_NO_WAIT);   // draws if unsure (result not ready)
    drawObject(o);
    glEndConditionalRender();
}`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "oglCull_thTech", "Technique"), tx(t, "oglCull_thHow", "How"), tx(t, "oglCull_thNote", "Trade-off")]}
        rows={[
          [tx(t, "oglCull_o1", "Occlusion queries + conditional render"), tx(t, "oglCull_o1h", "GPU tests proxies; draw is skipped on the GPU"), tx(t, "oglCull_o1n", "saves GPU work, not the CPU's draw call; one query per object")],
          [tx(t, "oglCull_o2", "Last frame's results"), tx(t, "oglCull_o2h", "read queries one frame late (no stall)"), tx(t, "oglCull_o2n", "objects appearing suddenly pop in one frame late")],
          [tx(t, "oglCull_o3", "Hi-Z (hierarchical depth) culling"), tx(t, "oglCull_o3h", "build a depth mip chain (max depth per texel); a compute shader tests each object's screen rectangle against it and writes an indirect draw list"), tx(t, "oglCull_o3n", "the modern GPU-driven standard; millions of objects, no CPU involvement")],
          [tx(t, "oglCull_o4", "Software rasterised occluders"), tx(t, "oglCull_o4h", "rasterise a few low-poly occluders on the CPU (SIMD) into a small depth buffer"), tx(t, "oglCull_o4n", "no GPU latency; used by Frostbite and Intel's Masked Occlusion Culling")],
          [tx(t, "oglCull_o5", "Portals / PVS"), tx(t, "oglCull_o5h", "precomputed cell-to-cell visibility for indoor levels"), tx(t, "oglCull_o5n", "nearly free at runtime; only for static, room-based levels (Quake, Source)")],
        ]}
      />
      <Equation label={tx(t, "oglCull_hizLabel", "Hi-Z test for one object")}
        where={[
          [r`R`, tx(t, "oglCull_wR", "the object's screen-space bounding rectangle, in pixels")],
          [r`\ell`, tx(t, "oglCull_wL", "the mip level where R covers about 2×2 texels, so 4 fetches suffice")],
          [r`z_{near}`, tx(t, "oglCull_wZ", "the closest depth of the object's bounds")],
        ]}
        note={tx(t, "oglCull_hizNote", "Each Hi-Z texel stores the farthest depth of the pixels it covers. If even the nearest point of the object lies behind the farthest occluder depth in that area, every pixel of the object would fail the depth test.")}>
        {r`\ell = \left\lceil \log_2 \max(R_w, R_h) \right\rceil - 1 \qquad \text{occluded} \iff z_{near} > \max_{2\times 2}\ \text{HiZ}_\ell(R)`}
      </Equation>
      <Callout type="warn" t={t}>
        {tx(t, "oglCull_pitfalls",
          "Cull with the object's world-space bounds and recompute them when it moves or animates. Skinned characters need bounds that cover every pose. Remember shadow passes: an object outside the camera frustum can still cast a shadow into it, so shadow maps are culled against the light's frustum (plus an extension toward the light), not the camera's. And freeze the culling camera while flying the real one away: it is the quickest way to see what is being culled.")}
      </Callout>

      <KeyIdeas t={t} id="oglCull" items={[
        "Culling skips whole objects using cheap bounds before any vertex work.",
        "The six frustum planes come straight from the rows of projection·view (Gribb–Hartmann).",
        "Sphere: outside if n·c + d < −r. AABB: outside if n·c + d < −e·|n|. Both are conservative.",
        "Hierarchies (grid, octree, BVH) reject or accept whole groups with one test.",
        "Occlusion culling removes hidden objects: queries + conditional render, or GPU-driven Hi-Z.",
      ]} />
    </Article>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Draw calls & state
// ═════════════════════════════════════════════════════════════════════════════

export function DrawCallsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglDraw_intro",
          "A draw call itself is cheap for the GPU. The cost is on the CPU: before each draw the driver checks that the state is valid, resolves bindings, may recompile a shader variant for the current state, and writes commands. With OpenGL that is typically a few microseconds per draw, so 5 000 naive draws can eat most of a 16 ms frame on the CPU while the GPU sits half idle. The cure is to draw less often and change state less often.")}
      </Lead>

      <H2>{tx(t, "oglDraw_costTitle", "Not all state costs the same")}</H2>
      <p>
        {tx(t, "oglDraw_costBody",
          "Changing some state forces the driver to flush or revalidate far more than others. The ranking below, from Cass Everitt and John McDonald's \"Approaching Zero Driver Overhead\" talk, has held across vendors for a decade. It is the order to sort by:")}
      </p>
      <LessonTable
        headers={[tx(t, "oglDraw_thState", "State change"), tx(t, "oglDraw_thRel", "Relative cost"), tx(t, "oglDraw_thEx", "Examples")]}
        rows={[
          [tx(t, "oglDraw_s1", "Render target"), "≈ 60 000 / s", "glBindFramebuffer"],
          [tx(t, "oglDraw_s2", "Program"), "≈ 300 000 / s", "glUseProgram"],
          [tx(t, "oglDraw_s3", "ROP / blend / depth state"), "", "glBlendFunc, glDepthFunc, glColorMask"],
          [tx(t, "oglDraw_s4", "Texture bindings"), "≈ 1.5 M / s", "glBindTextureUnit"],
          [tx(t, "oglDraw_s5", "Vertex format"), "", tx(t, "oglDraw_s5e", "switching VAOs with different layouts")],
          [tx(t, "oglDraw_s6", "UBO / vertex buffer bindings"), "", "glBindBufferRange, glBindVertexBuffer"],
          [tx(t, "oglDraw_s7", "Uniform updates"), "≈ 10 M / s", "glUniform*"],
        ]}
      />
      <p>
        {tx(t, "oglDraw_costNote", "(Changes per second a driver could sustain on the hardware of the time. The ratios matter, not the absolute numbers.)")}
      </p>

      <H2>{tx(t, "oglDraw_sortTitle", "Sorting draws with a key")}</H2>
      <p>
        {tx(t, "oglDraw_sortBody",
          "Instead of walking the scene graph and drawing as you go, collect every draw of the frame into a list, give each a 64-bit key that packs its state from most to least expensive, sort the integers, and submit in order. Identical states become neighbours, and the renderer skips redundant binds by comparing with the previous draw:")}
      </p>
      <Equation label={tx(t, "oglDraw_keyLabel", "A sort key (one common layout)")}
        notes={[
          tx(t, "oglDraw_kn1", "Opaque: program, then material, then mesh, then depth front to back. Early-Z then rejects hidden pixels before shading."),
          tx(t, "oglDraw_kn2", "Transparent: depth back to front must come first, even though it breaks state grouping, because blending is order-dependent."),
          tx(t, "oglDraw_kn3", "Sorting 10 000 64-bit keys takes well under a millisecond (radix sort: two or three passes)."),
        ]}>
        {r`\text{key} = \underbrace{\text{layer}}_{\text{pass}} \,\|\, \underbrace{\text{program}}_{\text{most expensive}} \,\|\, \text{material} \,\|\, \text{mesh} \,\|\, \underbrace{\text{depth}}_{\text{least}}`}
      </Equation>
      <SortKeyFigure t={t} />
      <CodeBlock lang="cpp" filename="submit.cpp" t={t}>{`std::sort(draws.begin(), draws.end(), [](auto& a, auto& b) { return a.key < b.key; });

GLuint curProgram = 0, curMaterial = ~0u, curVao = 0;
for (const Draw& d : draws) {
    if (d.program  != curProgram)  { glUseProgram(d.program);      curProgram  = d.program; }
    if (d.material != curMaterial) { bindMaterial(d.material);     curMaterial = d.material; }
    if (d.vao      != curVao)      { glBindVertexArray(d.vao);     curVao      = d.vao; }
    glUniformMatrix4fv(uModel, 1, GL_FALSE, &d.model[0][0]);
    glDrawElements(GL_TRIANGLES, d.count, GL_UNSIGNED_INT, (void*)(d.first * sizeof(GLuint)));
}`}</CodeBlock>

      <H2>{tx(t, "oglDraw_fewerTitle", "Fewer draws")}</H2>
      <LessonTable
        headers={[tx(t, "oglDraw_thHow", "Technique"), tx(t, "oglDraw_thWhen", "When"), tx(t, "oglDraw_thCost", "Catch")]}
        rows={[
          [tx(t, "oglDraw_f1", "Static batching"), tx(t, "oglDraw_f1w", "many static meshes with one material: merge them into one vertex buffer at load time"), tx(t, "oglDraw_f1c", "no per-object culling or movement; memory for duplicated geometry")],
          [tx(t, "oglDraw_f2", "Instancing"), tx(t, "oglDraw_f2w", "many copies of the same mesh (see Instancing)"), tx(t, "oglDraw_f2c", "same mesh and material; per-instance data in a buffer")],
          [tx(t, "oglDraw_f3", "Texture arrays / atlases"), tx(t, "oglDraw_f3w", "different textures would split batches: put them in one GL_TEXTURE_2D_ARRAY and index by layer"), tx(t, "oglDraw_f3c", "same size and format per array; atlases bleed at mip edges")],
          [tx(t, "oglDraw_f4", "Big shared buffers"), tx(t, "oglDraw_f4w", "all meshes in one vertex/index buffer, drawn by offset (baseVertex)"), tx(t, "oglDraw_f4c", "one VAO for everything; needs an allocator")],
          [tx(t, "oglDraw_f5", "Multi-draw indirect"), tx(t, "oglDraw_f5w", "thousands of different meshes in one call: glMultiDrawElementsIndirect reads draw parameters from a buffer"), tx(t, "oglDraw_f5c", "GL 4.3; per-draw data fetched with gl_DrawID (GL 4.6)")],
          [tx(t, "oglDraw_f6", "Bindless textures"), tx(t, "oglDraw_f6w", "textures become 64-bit handles stored in a buffer; no binding at all"), tx(t, "oglDraw_f6c", "ARB_bindless_texture: widely available on desktop, not core")],
        ]}
      />
      <CodeBlock lang="cpp" filename="mdi.cpp" t={t}>{`struct DrawElementsIndirectCommand {
    GLuint count, instanceCount, firstIndex;
    GLint  baseVertex;
    GLuint baseInstance;          // free slot: use it to index per-object data
};

// All meshes live in one vertex + index buffer; per-object data in an SSBO
std::vector<DrawElementsIndirectCommand> cmds = buildCommands(visibleList);
glNamedBufferSubData(indirectBuf, 0, cmds.size() * sizeof(cmds[0]), cmds.data());
glBindBuffer(GL_DRAW_INDIRECT_BUFFER, indirectBuf);
glMultiDrawElementsIndirect(GL_TRIANGLES, GL_UNSIGNED_INT, nullptr, GLsizei(cmds.size()), 0);

// vertex shader
// layout(std430, binding = 0) readonly buffer Objects { mat4 model[]; };
// mat4 M = model[gl_DrawID];     // or gl_BaseInstance`}</CodeBlock>
      <Callout type="info" t={t}>
        {tx(t, "oglDraw_gpuDriven", "Combine the last three rows with the Hi-Z culling from the previous chapter and you get a GPU-driven renderer. A compute shader culls every object and writes the indirect command buffer; one glMultiDrawElementsIndirectCount draws what survived. The CPU cost per frame no longer depends on the object count. Vulkan and D3D12 were designed around the same idea.")}
      </Callout>
      <Callout type="warn" t={t}>
        {tx(t, "oglDraw_pitfalls",
          "Redundant state calls are not free just because the value did not change: the driver still has to check. Filter them yourself. Avoid glGet* for anything you set yourself; keep a shadow copy. Changing a uniform of a program that is not bound needs glProgramUniform or DSA, not a program switch. And measure first: a GPU-bound frame gains nothing from fewer draw calls.")}
      </Callout>

      <KeyIdeas t={t} id="oglDraw" items={[
        "Draw-call cost is CPU/driver validation; state changes differ by orders of magnitude.",
        "Collect draws, sort by a 64-bit key (pass | program | material | mesh | depth), skip redundant binds.",
        "Opaque front to back for early-Z; transparent back to front for correct blending.",
        "Reduce draws with batching, instancing, texture arrays, shared buffers and multi-draw indirect.",
        "GPU-driven rendering: compute culls, writes indirect commands, one call draws the scene.",
      ]} />
    </Article>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Level of detail
// ═════════════════════════════════════════════════════════════════════════════

export function LodContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglLod_intro",
          "A rock 200 m away is eight pixels tall. Drawing it with the same 5 000 triangles as when it sits at your feet wastes vertex work, and worse: triangles smaller than a pixel shade very inefficiently. Level of detail (LOD) keeps several versions of each mesh and picks, per frame, the cheapest one that still looks the same at its current size on screen.")}
      </Lead>

      <H2>{tx(t, "oglLod_metricTitle", "Choosing by projected size")}</H2>
      <p>
        {tx(t, "oglLod_metricBody",
          "Distance alone is a poor metric: it ignores the field of view (a sniper scope zooms in, so LOD must go up), the resolution and the object's own size. Projected size in pixels accounts for all three:")}
      </p>
      <Equation label={tx(t, "oglLod_pxLabel", "Projected radius in pixels")}
        where={[
          [r`\rho`, tx(t, "oglLod_wRho", "radius of the object's bounding sphere")],
          [r`d`, tx(t, "oglLod_wD", "distance from the camera to the sphere's centre")],
          [r`H,\ \text{fov}`, tx(t, "oglLod_wH", "viewport height in pixels, vertical field of view")],
          [r`b`, tx(t, "oglLod_wB", "LOD bias: a quality knob (and a per-platform setting)")],
        ]}
        note={tx(t, "oglLod_pxNote", "Pick the first level whose threshold r_px exceeds. Artists often author thresholds as \"screen size\", the fraction of the screen height the object covers, which is the same number divided by H.")}>
        {r`r_{px} = b \cdot \frac{\rho}{d} \cdot \frac{H}{2\tan(\text{fov}/2)} \qquad \text{LOD} = \min\{\,i : r_{px} > \tau_i\,\}`}
      </Equation>

      <H2>{tx(t, "oglLod_popTitle", "Popping, hysteresis and cross-fades")}</H2>
      <p>
        {tx(t, "oglLod_popBody",
          "Switching levels changes the silhouette in one frame, a \"pop\". An object sitting right at a threshold, or a camera bobbing while walking, makes it pop back and forth every frame. Hysteresis fixes the flicker: switching to a coarser level uses a slightly lower threshold than switching back.")}
      </p>
      <Equation label={tx(t, "oglLod_hystLabel", "Hysteresis band")}
        where={[[r`h`, tx(t, "oglLod_wHyst", "hysteresis fraction, e.g. 0.1–0.2")]]}>
        {r`\text{refine to } i \text{ when } r_{px} > \tau_i\,(1 + h) \qquad \text{coarsen past } i \text{ when } r_{px} < \tau_i\,(1 - h)`}
      </Equation>
      <p>
        {tx(t, "oglLod_fadeBody",
          "To hide the pop itself, draw both levels for a short time and blend. Alpha blending would need sorting, so engines use a dithered cross-fade instead. Each level discards a complementary pattern of pixels (a 4×4 Bayer matrix) according to the fade factor, and TAA smooths the pattern out. Unreal and Unity both do this.")}
      </p>
      <CodeBlock lang="glsl" filename="lod_fade.frag" t={t}>{`uniform float fade;       // 0..1 coverage of this level during the transition
uniform bool  isIncoming; // the other level uses the complementary mask

float bayer4(ivec2 p) {
    const int m[16] = int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);
    return (float(m[(p.x & 3) + (p.y & 3) * 4]) + 0.5) / 16.0;
}

void main() {
    float b = bayer4(ivec2(gl_FragCoord.xy));
    if (isIncoming ? b > fade : b <= fade) discard;   // together they cover every pixel once
    // … normal shading
}`}</CodeBlock>
      <LodFigure t={t} />

      <H2>{tx(t, "oglLod_makeTitle", "Where the levels come from")}</H2>
      <p>
        {tx(t, "oglLod_makeBody",
          "LODs are generated offline by mesh simplification, most often edge collapse guided by the quadric error metric (Garland & Heckbert, 1997). Every vertex accumulates the planes of its surrounding triangles into a 4×4 matrix. Collapsing an edge to a point v costs the sum of squared distances from v to those planes, and the cheapest collapses are done first until the triangle budget is met. meshoptimizer and Simplygon implement it.")}
      </p>
      <Equation label={tx(t, "oglLod_qemLabel", "Quadric error metric")}
        where={[
          [r`\mathbf p = (a, b, c, d)`, tx(t, "oglLod_wP", "a triangle's plane, ax + by + cz + d = 0 with (a, b, c) unit length")],
          [r`\bar v = (x, y, z, 1)`, tx(t, "oglLod_wV", "the candidate position in homogeneous form")],
          [r`Q_i`, tx(t, "oglLod_wQ", "sum of pᵀp over the triangles around vertex i")],
        ]}
        note={tx(t, "oglLod_qemNote", "Collapsing edge (i, j) uses Q = Qᵢ + Qⱼ. The best position solves ∂Δ/∂v = 0, a 3×3 linear system; if it is singular, try the endpoints and the midpoint. UV seams and normals are protected by adding extra weighted planes along the borders.")}>
        {r`\Delta(v) = \sum_{\mathbf p \in \text{planes}} (\mathbf p^{\mathsf T} \bar v)^2 = \bar v^{\mathsf T} \Big(\sum \mathbf p\,\mathbf p^{\mathsf T}\Big) \bar v = \bar v^{\mathsf T} Q\,\bar v`}
      </Equation>
      <LessonTable
        headers={[tx(t, "oglLod_thKind", "Kind"), tx(t, "oglLod_thIdea", "Idea"), tx(t, "oglLod_thUse", "Used for")]}
        rows={[
          [tx(t, "oglLod_k1", "Discrete LOD"), tx(t, "oglLod_k1i", "3–5 prebuilt meshes, each ~50% of the previous"), tx(t, "oglLod_k1u", "almost everything")],
          [tx(t, "oglLod_k2", "Impostors"), tx(t, "oglLod_k2i", "the last level is a camera-facing quad with a pre-rendered image (often several angles plus normals)"), tx(t, "oglLod_k2u", "trees and props far away")],
          [tx(t, "oglLod_k3", "HLOD"), tx(t, "oglLod_k3i", "far away, whole groups of objects are replaced by one merged, simplified mesh"), tx(t, "oglLod_k3u", "open worlds: one draw per city block")],
          [tx(t, "oglLod_k4", "Continuous / terrain"), tx(t, "oglLod_k4i", "detail varies smoothly across one mesh (tessellation, clipmaps, CDLOD)"), tx(t, "oglLod_k4u", "terrain, water")],
          [tx(t, "oglLod_k5", "Cluster LOD (Nanite)"), tx(t, "oglLod_k5i", "a hierarchy of small clusters, each simplified; the GPU picks per cluster so the error stays below a pixel"), tx(t, "oglLod_k5u", "film-quality assets at any distance")],
        ]}
      />
      <p>
        {tx(t, "oglLod_texBody", "Mipmaps are LOD for textures, applied automatically per pixel. Shading can have LOD too: skip normal mapping, parallax or extra lights for small objects. Even animation has LOD, updating distant characters' skeletons at a lower rate.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "oglLod_pitfalls",
          "Compute the metric from the same camera for every view that uses it. Shadow passes should usually reuse the main camera's LOD choice, or the shadow silhouette differs from the object. Keep LOD thresholds resolution-aware (r_px already is). Don't forget the vertex format: a simplified mesh with a 64-byte vertex can still cost more than a denser one with a 16-byte vertex.")}
      </Callout>

      <KeyIdeas t={t} id="oglLod" items={[
        "Pick LOD by projected size in pixels, which accounts for distance, fov, resolution and object size.",
        "Hysteresis stops flicker at thresholds; dithered cross-fades hide the pop.",
        "Levels are generated by edge collapse with the quadric error metric.",
        "Impostors, HLOD, terrain LOD and cluster LOD extend the idea.",
        "Tiny triangles are inefficient: LOD saves vertex and fragment work at once.",
      ]} />
    </Article>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Buffer streaming & sync
// ═════════════════════════════════════════════════════════════════════════════

export function StreamingContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglStream_intro",
          "Every frame something has to travel from the CPU to the GPU: instance transforms, particle positions, UI vertices, skinning matrices. Upload it the wrong way and the CPU quietly waits for the GPU, destroying the overlap the whole pipeline depends on. Getting it right is about one idea: never write memory the GPU might still be reading.")}
      </Lead>

      <H2>{tx(t, "oglStream_implicitTitle", "Implicit synchronisation")}</H2>
      <p>
        {tx(t, "oglStream_implicitBody",
          "When you call glBufferSubData on a buffer used by a draw that the GPU has not executed yet, the driver has two choices. It can block until the GPU is done, or copy your data into a temporary buffer and schedule a GPU-side copy. Either way you pay, and you have no control over which. The same happens with glMapBuffer without flags, glTexSubImage on a texture in use, and glReadPixels into client memory.")}
      </p>
      <StreamingFigure t={t} />

      <H2>{tx(t, "oglStream_orphanTitle", "Orphaning")}</H2>
      <CodeBlock lang="cpp" filename="orphan.cpp" t={t}>{`glBindBuffer(GL_ARRAY_BUFFER, vbo);
glBufferData(GL_ARRAY_BUFFER, capacity, nullptr, GL_STREAM_DRAW);   // "I don't need the old contents"
glBufferSubData(GL_ARRAY_BUFFER, 0, used, data);                    // fresh storage: no wait

// Same effect with mapping:
void* p = glMapBufferRange(GL_ARRAY_BUFFER, 0, used,
                           GL_MAP_WRITE_BIT | GL_MAP_INVALIDATE_BUFFER_BIT);`}</CodeBlock>
      <p>
        {tx(t, "oglStream_orphanBody",
          "Orphaning tells the driver the old contents are no longer needed. The GPU keeps the old storage alive until it is done with it, and you get a new block right away. It is simple and works everywhere, including WebGL, but the driver does allocation and bookkeeping work on every call. Some mobile drivers handle it poorly.")}
      </p>

      <H2>{tx(t, "oglStream_persistTitle", "Persistent mapping with fences")}</H2>
      <p>
        {tx(t, "oglStream_persistBody",
          "OpenGL 4.4's glBufferStorage lets you map a buffer once and keep the pointer forever. The driver no longer protects you: you promise not to write what the GPU is reading. Split the buffer into N regions (3 is usual: one being written, one queued, one being read), and after submitting the draws that read region k, insert a fence. Before writing region k again, wait on its fence. That fence is N frames old and has almost always signalled already.")}
      </p>
      <Equation label={tx(t, "oglStream_ringLabel", "Ring indexing")}
        where={[
          [r`i`, tx(t, "oglStream_wI", "frame number")],
          [r`N`, tx(t, "oglStream_wN", "regions in the ring; must exceed the frames the GPU can lag behind")],
          [r`S`, tx(t, "oglStream_wS", "region size, rounded up to GL_UNIFORM_BUFFER_OFFSET_ALIGNMENT (or 256) if bound as a UBO range")],
        ]}>
        {r`\text{region}(i) = i \bmod N \qquad \text{offset}(i) = S\,(i \bmod N) \qquad \text{wait on fence}(i - N)`}
      </Equation>
      <CodeBlock lang="cpp" filename="persistent_ring.cpp" t={t}>{`constexpr int N = 3;
const GLbitfield flags = GL_MAP_WRITE_BIT | GL_MAP_PERSISTENT_BIT | GL_MAP_COHERENT_BIT;
glCreateBuffers(1, &buf);
glNamedBufferStorage(buf, N * regionSize, nullptr, flags);        // immutable storage
auto* base = static_cast<std::byte*>(glMapNamedBufferRange(buf, 0, N * regionSize, flags));
GLsync fence[N] = {};

void frame(int i) {
    int k = i % N;
    if (fence[k]) {                                                // was region k read yet?
        while (glClientWaitSync(fence[k], GL_SYNC_FLUSH_COMMANDS_BIT, 1'000'000) == GL_TIMEOUT_EXPIRED) {}
        glDeleteSync(fence[k]);
    }
    std::memcpy(base + k * regionSize, instances.data(), instances.size() * sizeof(Instance));

    glBindBufferRange(GL_SHADER_STORAGE_BUFFER, 0, buf, k * regionSize, regionSize);
    drawEverything();
    fence[k] = glFenceSync(GL_SYNC_GPU_COMMANDS_COMPLETE, 0);     // signalled when the draws above finish
}`}</CodeBlock>
      <Callout type="info" t={t}>
        {tx(t, "oglStream_coherentNote",
          "GL_MAP_COHERENT_BIT makes CPU writes visible to the GPU automatically at the next draw. Without it, call glFlushMappedBufferRange for the bytes you wrote (and map with GL_MAP_FLUSH_EXPLICIT_BIT). Coherent mappings are usually write-combined memory: fast to write sequentially, extremely slow to read, so never read back through the pointer.")}
      </Callout>

      <H2>{tx(t, "oglStream_readTitle", "Reading back without stalling")}</H2>
      <p>
        {tx(t, "oglStream_readBody",
          "The same rule applies in reverse. glReadPixels into a pointer, glGetBufferSubData, or glGetQueryObject on a fresh query all force the CPU to wait for the GPU to finish everything before it. Read into a buffer object (a pixel pack buffer) instead, fence it, and map it a frame or two later, when the fence has signalled. Screenshots, GPU picking, auto-exposure and occlusion results all work this way.")}
      </p>
      <CodeBlock lang="cpp" filename="async_readback.cpp" t={t}>{`// Frame i: queue the copy into a PBO, returns immediately
glBindBuffer(GL_PIXEL_PACK_BUFFER, pbo[i % 2]);
glReadPixels(x, y, 1, 1, GL_RED_INTEGER, GL_UNSIGNED_INT, nullptr);   // offset into the PBO
readFence[i % 2] = glFenceSync(GL_SYNC_GPU_COMMANDS_COMPLETE, 0);

// Frame i + 1 (or later): only map when the GPU is done
GLenum s = glClientWaitSync(readFence[(i + 1) % 2], 0, 0);             // timeout 0: just ask
if (s == GL_ALREADY_SIGNALED || s == GL_CONDITION_SATISFIED) {
    auto* id = (GLuint*)glMapNamedBufferRange(pbo[(i + 1) % 2], 0, 4, GL_MAP_READ_BIT);
    pickedObject = *id;
    glUnmapNamedBuffer(pbo[(i + 1) % 2]);
}`}</CodeBlock>

      <LessonTable
        headers={[tx(t, "oglStream_thWay", "Method"), tx(t, "oglStream_thGL", "GL"), tx(t, "oglStream_thVerdict", "Verdict")]}
        rows={[
          ["glBufferSubData", "1.5", tx(t, "oglStream_v1", "fine for data the GPU is not using (loading); stalls or copies for per-frame data")],
          [tx(t, "oglStream_m2", "Orphaning"), "1.5", tx(t, "oglStream_v2", "simple, portable, WebGL-compatible; driver overhead per call")],
          [tx(t, "oglStream_m3", "glMapBufferRange + UNSYNCHRONIZED + own fences"), "3.0", tx(t, "oglStream_v3", "no driver sync; you manage the ring; map/unmap each frame")],
          [tx(t, "oglStream_m4", "Persistent + coherent ring"), "4.4", tx(t, "oglStream_v4", "the fastest: map once, memcpy, fence — the AZDO standard")],
        ]}
      />
      <Callout type="warn" t={t}>
        {tx(t, "oglStream_pitfalls",
          "Fences must be deleted after waiting, or they leak. Do not wait on a fence you just created: that is a glFinish in disguise. With too few ring regions (N ≤ frames in flight) you are back to stalling, and with triple buffering in the swap chain the GPU can be three frames behind. Watch GL_KHR_debug output: drivers warn about implicit synchronisation explicitly.")}
      </Callout>

      <KeyIdeas t={t} id="oglStream" items={[
        "Never overwrite memory the GPU may still be reading; the driver will stall or copy for you.",
        "Orphaning (glBufferData(NULL) or INVALIDATE) gives fresh storage cheaply and portably.",
        "Persistent mapped ring of N regions + glFenceSync / glClientWaitSync: map once, no driver sync.",
        "Read back through pixel pack buffers, fenced, a frame or two later.",
        "A wait on a just-created fence is glFinish: always keep a frame of distance.",
      ]} />
    </Article>
  );
}

