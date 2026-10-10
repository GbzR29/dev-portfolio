"use client";

// "Picking" (Advanced Techniques): turning a mouse position into "which object, and where".

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { ndcNumbers, sphereNumbers, mtNumbers } from "@/lib/tracks/opengl/live/picking";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { SlabFigure } from "@/components/lesson/figures/tech/SlabFigure";
import { PickingFigure } from "@/components/lesson/figures/tech/PickingFigure";

const r = String.raw;

export function PickingContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglPick_intro",
          "Clicking a unit in a strategy game, selecting a mesh in an editor, aiming at an enemy: all ask the same question, which object is under this pixel, and often where on it. The GPU drew the image but does not remember what it drew where. There are two ways to find out: shoot a ray back into the scene mathematically, or ask the GPU to draw object ids and read the pixel.")}
      </Lead>

      <Goals t={t} id="oglPick" items={[
        "Turn a mouse position into a ray in the world.",
        "Test that ray against spheres, boxes and triangles.",
        "Pick objects exactly with an ID buffer.",
      ]} />

      <H2>{tx(t, "oglPick_unprojTitle", "From a pixel back to a ray")}</H2>
      <p>
        {tx(t, "oglPick_unprojBody",
          "Rendering took a world point through view, projection, the perspective divide and the viewport to reach a pixel. Picking runs that chain backwards. A pixel does not correspond to one point, since depth was lost in the divide. It corresponds to a whole line of points, which is exactly the ray we want. Unproject the pixel at the near plane (z = −1) and at the far plane (z = +1), and the ray runs from the first point through the second:")}
      </p>
      <Equation label={tx(t, "oglPick_ndcLabel", "Mouse → NDC → world ray")}
        where={[
          [r`(m_x, m_y)`, tx(t, "oglPick_wM", "the mouse position in window pixels, y pointing down (as the OS reports it)")],
          [r`W, H`, tx(t, "oglPick_wWH", "the viewport size in pixels. Mind HiDPI: mouse coordinates are often in logical pixels, the framebuffer in physical ones")],
          [r`M = P\,V`, tx(t, "oglPick_wPV", "projection times view: the same matrix used to render")],
        ]}
        words={tx(t, "oglPick_ndcWords", "Rescale the mouse position to the −1…1 square, flipping y. Run that point back through the inverse camera matrices once on the near plane and once on the far plane, and the ray goes from the first to the second.")}
        note={tx(t, "oglPick_ndcNote", "The divide by w undoes the perspective divide. Both points come out in world space, so the ray does too. An orthographic camera works unchanged: its near and far points simply share the same direction for every pixel.")}>
        {r`\begin{gathered} x_{ndc} = \frac{2 m_x}{W} - 1 \quad y_{ndc} = 1 - \frac{2 m_y}{H} \\[4pt] \mathbf p_{n,f} = \frac{\big(M^{-1}(x_{ndc}, y_{ndc}, \mp 1, 1)\big)_{xyz}}{\big(M^{-1}(\ldots)\big)_w} \qquad \mathbf d = \frac{\mathbf p_f - \mathbf p_n}{\lVert \mathbf p_f - \mathbf p_n \rVert} \end{gathered}`}
      </Equation>
      <LiveFormula label={tx(t, "oglPick_ndcLive", "Try it: a click on a 1920 × 1080 window")}
        tex={r`x_{ndc} = \frac{2 m_x}{W} - 1 \qquad y_{ndc} = 1 - \frac{2 m_y}{H}`}
        vars={[
          { id: "mx", label: <>m<sub>x</sub></>, min: 0, max: 1920, step: 10, value: 1440, fmt: v => `${v} px` },
          { id: "my", label: <>m<sub>y</sub></>, min: 0, max: 1080, step: 10, value: 270, fmt: v => `${v} px` },
        ]}
        compute={ndcNumbers()}
        note={tx(t, "oglPick_ndcLiveNote", "The centre (960, 540) gives (0, 0); the top-left corner (0, 0) gives (−1, +1), because window y grows downward and NDC y upward. (1440, 270) is halfway to the right edge and halfway to the top: (0.5, 0.5).")} />

      <H2>{tx(t, "oglPick_testsTitle", "Ray intersection tests")}</H2>
      <Equation label={tx(t, "oglPick_sphereLabel", "Ray vs sphere")}
        where={[[r`\mathbf o,\ \mathbf d`, tx(t, "oglPick_wOD", "ray origin and unit direction")], [r`\mathbf c,\ \rho`, tx(t, "oglPick_wC", "sphere centre and radius")]]}
        words={tx(t, "oglPick_sphereWords", "Ask for which distances t along the ray the point is exactly ρ from the centre. That is a quadratic equation: no real solution means a miss, and the smaller solution is where the ray enters.")}
        note={tx(t, "oglPick_sphereNote", "Substitute the ray into |p − c|² = ρ² and you get a quadratic in t. Negative h: the ray misses. Otherwise the smaller root is the entry point (if it is negative, the origin is inside the sphere and the larger root is the exit).")}>
        {r`\begin{gathered} \mathbf{oc} = \mathbf o - \mathbf c \qquad b = \mathbf{oc}\cdot\mathbf d \\[4pt] h = b^2 - (\mathbf{oc}\cdot\mathbf{oc} - \rho^2) \qquad t = -b - \sqrt{h} \end{gathered}`}
      </Equation>
      <Derivation t={t} label={tx(t, "oglPick_sphDer", "Where the quadratic comes from")}
        steps={[
          { full: true, tex: r`\lVert \mathbf o + t\,\mathbf d - \mathbf c \rVert^2 = \rho^2`,
            why: tx(t, "oglPick_sd1", "a point of the ray, o + t·d, is on the sphere when its distance to the centre is ρ. Squaring both sides removes the square root of the length") },
          { full: true, tex: r`(\mathbf{oc} + t\,\mathbf d)\cdot(\mathbf{oc} + t\,\mathbf d) = \rho^2`,
            why: tx(t, "oglPick_sd2", "write o − c as oc; a squared length is the dot product of the vector with itself") },
          { full: true, tex: r`t^2\,(\mathbf d\cdot\mathbf d) + 2t\,(\mathbf{oc}\cdot\mathbf d) + \mathbf{oc}\cdot\mathbf{oc} - \rho^2 = 0`,
            why: tx(t, "oglPick_sd3", "expand the dot product like (x + y)², and move ρ² to the left") },
          { full: true, tex: r`t^2 + 2b\,t + (\mathbf{oc}\cdot\mathbf{oc} - \rho^2) = 0`,
            why: tx(t, "oglPick_sd4", "d has length 1, so d·d = 1; name b = oc·d") },
          { full: true, tex: r`t = -b \pm \sqrt{b^2 - (\mathbf{oc}\cdot\mathbf{oc} - \rho^2)} = -b \pm \sqrt{h}`,
            why: tx(t, "oglPick_sd5", "the quadratic formula with a = 1 and a middle coefficient of 2b: the 2s and the 4 cancel, leaving this short form. h is what sits under the root") },
        ]} />
      <LiveFormula label={tx(t, "oglPick_sphLive", "Try it: a ray along x at a sphere 5 units away")}
        tex={r`\begin{gathered} \mathbf{oc} = \mathbf o - \mathbf c \qquad b = \mathbf{oc}\cdot\mathbf d \\[4pt] h = b^2 - (\mathbf{oc}\cdot\mathbf{oc} - \rho^2) \qquad t = -b - \sqrt{h} \end{gathered}`}
        vars={[
          { id: "cy", label: <>c<sub>y</sub></>, min: -3, max: 3, step: 0.1, value: 1, fmt: v => v.toFixed(1) },
          { id: "rho", label: "ρ", min: 0.5, max: 3, step: 0.1, value: 2, fmt: v => v.toFixed(1) },
        ]}
        where={[
          [r`\mathbf o,\ \mathbf d`, tx(t, "oglPick_wOD2", "the ray starts at the origin and points along +x: d = (1, 0, 0)")],
          [r`\mathbf c`, tx(t, "oglPick_wC2", "the sphere's centre, (5, c_y, 0): 5 ahead and c_y off the ray's line")],
        ]}
        compute={sphereNumbers(t)}
        note={tx(t, "oglPick_sphLiveNote", "Here h works out to ρ² − c_y²: the ray hits when the centre is less than one radius off its line. With c_y = 1 and ρ = 2 the hit is at t = 5 − √3 ≈ 3.27. Push c_y past ρ and h turns negative: a miss. At c_y = ±ρ exactly, h = 0 and the ray only grazes the sphere.")} />
      <Equation label={tx(t, "oglPick_slabLabel", "Ray vs axis-aligned box (slab test, Kay–Kajiya)")}
        where={[[r`\mathbf b_{min},\ \mathbf b_{max}`, tx(t, "oglPick_wB", "the box corners")], [r`\mathbf d^{-1}`, tx(t, "oglPick_wInv", "1 / d per component; ±∞ for axis-parallel rays is fine in IEEE floats")]]}
        words={tx(t, "oglPick_slabWords", "For each axis, find when the ray crosses the box's two walls on that axis. The ray is inside the box only while it is between the walls on every axis at once: after the last entry and before the first exit.")}>
        {r`\begin{gathered} \mathbf t_0 = (\mathbf b_{min} - \mathbf o) \odot \mathbf d^{-1} \quad \mathbf t_1 = (\mathbf b_{max} - \mathbf o) \odot \mathbf d^{-1} \\[4pt] t_{enter} = \max(\min(\mathbf t_0, \mathbf t_1)) \quad t_{exit} = \min(\max(\mathbf t_0, \mathbf t_1)) \\[4pt] \text{hit} \iff t_{enter} \le t_{exit} \wedge t_{exit} \ge 0 \end{gathered}`}
      </Equation>
      <SlabFigure t={t} />
      <Equation label={tx(t, "oglPick_mtLabel", "Ray vs triangle (Möller–Trumbore)")}
        where={[
          [r`\mathbf v_0, \mathbf v_1, \mathbf v_2`, tx(t, "oglPick_wV", "the triangle's vertices; e₁ = v₁ − v₀, e₂ = v₂ − v₀")],
          [r`u, v`, tx(t, "oglPick_wUV", "barycentric coordinates of the hit: inside the triangle when u ≥ 0, v ≥ 0, u + v ≤ 1")],
        ]}
        words={tx(t, "oglPick_mtWords", "Write the hit point two ways, as a point of the ray and as a point of the triangle's plane, and solve for the three unknowns t, u and v at once. The hit counts only if u and v land inside the triangle.")}
        note={tx(t, "oglPick_mtNote", "It solves o + t·d = v₀ + u·e₁ + v·e₂ with Cramer's rule, sharing cross products between the three unknowns. A determinant near 0 means the ray is parallel to the triangle. The barycentrics also give the interpolated UV and normal at the hit, which you need for decals, bullet holes and painting.")}>
        {r`\begin{gathered} \mathbf p = \mathbf d \times \mathbf e_2 \quad \det = \mathbf e_1\cdot\mathbf p \quad \mathbf s = \mathbf o - \mathbf v_0 \quad u = \frac{\mathbf s\cdot\mathbf p}{\det} \\[4pt] \mathbf q = \mathbf s \times \mathbf e_1 \quad v = \frac{\mathbf d\cdot\mathbf q}{\det} \quad t = \frac{\mathbf e_2\cdot\mathbf q}{\det} \end{gathered}`}
      </Equation>
      <LiveFormula label={tx(t, "oglPick_mtLive", "Try it: a ray falling on the triangle (0,0,0), (1,0,0), (0,1,0)")}
        tex={r`\begin{gathered} \mathbf p = \mathbf d \times \mathbf e_2 \quad \det = \mathbf e_1\cdot\mathbf p \quad u = \frac{\mathbf s\cdot\mathbf p}{\det} \\[4pt] \mathbf q = \mathbf s \times \mathbf e_1 \quad v = \frac{\mathbf d\cdot\mathbf q}{\det} \quad t = \frac{\mathbf e_2\cdot\mathbf q}{\det} \end{gathered}`}
        vars={[
          { id: "ox", label: <>o<sub>x</sub></>, min: -0.5, max: 1.5, step: 0.05, value: 0.2, fmt: v => v.toFixed(2) },
          { id: "oy", label: <>o<sub>y</sub></>, min: -0.5, max: 1.5, step: 0.05, value: 0.3, fmt: v => v.toFixed(2) },
          { id: "dx", label: <>d<sub>x</sub></>, min: -1, max: 1, step: 0.05, value: 0, fmt: v => v.toFixed(2) },
        ]}
        where={[
          [r`\mathbf o`, tx(t, "oglPick_wO3", "the ray's origin, (o_x, o_y, 1): one unit above the triangle's plane z = 0")],
          [r`\mathbf d`, tx(t, "oglPick_wD3", "the ray's direction, (d_x, 0, −1): straight down, tilted along x by d_x")],
          [r`\mathbf e_1,\ \mathbf e_2`, tx(t, "oglPick_wE", "the edges from v₀: (1, 0, 0) and (0, 1, 0)")],
        ]}
        compute={mtNumbers(t)}
        note={tx(t, "oglPick_mtLiveNote", "With this triangle u and v are simply the hit's x and y, so you can check every number by eye: the default ray lands at (0.2, 0.3) after t = 1. Tilt it with d_x and u moves by d_x, since the ray drifts sideways while it falls. Push o_x + o_y past 1 and the hit leaves the triangle across its long edge.")} />
      <H3>{tx(t, "oglPick_localTitle", "Test in object space")}</H3>
      <p>
        {tx(t, "oglPick_localBody",
          "Rotated and scaled objects need no special tests. Transform the ray by the inverse of the model matrix (the origin with w = 1, the direction with w = 0) and test against the object's local shape: the unit cube, the unit sphere, the mesh's own triangles. Leave the direction unnormalised and the t you get is the same t as in world space, so hits from different objects can be compared directly. A mesh with thousands of triangles puts them in a BVH, so only a handful are actually tested.")}
      </p>
      <CodeBlock lang="cpp" filename="pick_ray.cpp" t={t}>{`Ray mouseRay(glm::vec2 mouse, glm::vec2 viewport, const glm::mat4& proj, const glm::mat4& view) {
    glm::vec2 ndc = { 2.0f * mouse.x / viewport.x - 1.0f, 1.0f - 2.0f * mouse.y / viewport.y };
    glm::mat4 inv = glm::inverse(proj * view);
    glm::vec4 n = inv * glm::vec4(ndc, -1.0f, 1.0f);   n /= n.w;   // near plane
    glm::vec4 f = inv * glm::vec4(ndc,  1.0f, 1.0f);   f /= f.w;   // far plane
    return { glm::vec3(n), glm::normalize(glm::vec3(f - n)) };
}

std::optional<Hit> pick(const Ray& ray, const std::vector<Object>& objects) {
    std::optional<Hit> best;
    for (const Object& o : objects) {
        if (!raySphere(ray, o.worldBoundingSphere)) continue;          // cheap rejection first
        glm::mat4 inv = glm::inverse(o.model);
        Ray local = { glm::vec3(inv * glm::vec4(ray.origin, 1.0f)),
                      glm::vec3(inv * glm::vec4(ray.dir,    0.0f)) };  // not normalised: t stays in world units
        if (auto t = o.mesh.intersect(local); t && (!best || *t < best->t))
            best = Hit{ &o, *t, ray.origin + *t * ray.dir };
    }
    return best;
}`}</CodeBlock>

      <H2>{tx(t, "oglPick_idTitle", "Picking with an ID buffer")}</H2>
      <p>
        {tx(t, "oglPick_idBody",
          "The other approach lets the GPU answer. Render the scene into an offscreen framebuffer with an integer colour attachment, writing each object's id instead of its colour, with depth testing on. The pixel under the mouse then holds the id of exactly the object the player sees there, whatever its shape: alpha-tested foliage, skinned characters, tessellated terrain, text. It often shares the depth pre-pass, or is written as an extra render target of the G-buffer, so it costs almost nothing.")}
      </p>
      <CodeBlock lang="cpp" filename="id_buffer.cpp" t={t}>{`// Setup: a 32-bit unsigned integer colour attachment (no normalisation, no blending)
glTextureStorage2D(idTex, 1, GL_R32UI, width, height);
glNamedFramebufferTexture(idFbo, GL_COLOR_ATTACHMENT0, idTex, 0);

// Draw: fragment shader
//   layout(location = 0) out uint outId;
//   uniform uint uObjectId;
//   void main() { outId = uObjectId; }
GLuint clear = 0;                                        // 0 = "nothing"
glClearNamedFramebufferuiv(idFbo, GL_COLOR, 0, &clear);
for (auto& o : objects) { idShader.setUint("uObjectId", o.id); draw(o); }

// Read one pixel: window y points down, OpenGL y points up
glBindBuffer(GL_PIXEL_PACK_BUFFER, pbo);
glReadPixels(mx, height - 1 - my, 1, 1, GL_RED_INTEGER, GL_UNSIGNED_INT, nullptr);
GLsync fence = glFenceSync(GL_SYNC_GPU_COMMANDS_COMPLETE, 0);   // map it next frame: no stall`}</CodeBlock>
      <PickingFigure t={t} />
      <LessonTable
        headers={[tx(t, "oglPick_thMethod", "Method"), tx(t, "oglPick_thPros", "Strengths"), tx(t, "oglPick_thCons", "Weaknesses")]}
        rows={[
          [tx(t, "oglPick_r1", "Ray vs bounding volumes"), tx(t, "oglPick_r1p", "no GPU work; any time, even off-screen; great first rejection pass"), tx(t, "oglPick_r1c", "loose: picks empty space near objects")],
          [tx(t, "oglPick_r2", "Ray vs triangles (+BVH)"), tx(t, "oglPick_r2p", "exact; gives hit point, normal, UV; works for gameplay (line of sight, bullets)"), tx(t, "oglPick_r2c", "needs CPU copies of meshes and a BVH; skinning and GPU deformation are not in the CPU data")],
          [tx(t, "oglPick_r3", "ID buffer"), tx(t, "oglPick_r3p", "pixel-exact for anything the GPU can draw; trivial to add; picks through alpha correctly"), tx(t, "oglPick_r3c", "one frame of latency (async readback); only visible objects; no hit point unless you also read depth")],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "oglPick_worldPosTip", "Read the depth buffer at the same pixel and unproject (x_ndc, y_ndc, 2·depth − 1) through (PV)⁻¹, and the ID buffer also gives the exact world-space hit point. That is how editors place objects on whatever surface is under the cursor. For rectangle selection, build a small frustum from the rectangle's corners and cull against it, as in Frustum Culling.")}
      </Callout>
      <Callout type="warn" t={t}>
        {tx(t, "oglPick_pitfalls",
          "Flip y: window coordinates grow downward, OpenGL's upward. Use framebuffer pixels, not CSS or window points, on HiDPI displays. An RGBA8 id buffer only holds 2²⁴ ids and breaks if blending, sRGB conversion or MSAA resolve touch it, which is why GL_R32UI exists. Thin lines and small icons are hard to hit exactly, so read a 5×5 block and take the most common or nearest id.")}
      </Callout>

      <KeyIdeas t={t} id="oglPick" items={[
        "Unproject the pixel at z = −1 and z = +1 through (P·V)⁻¹ and divide by w: that line is the pick ray.",
        "Ray vs sphere is a quadratic; ray vs box is the slab test; ray vs triangle is Möller–Trumbore.",
        "Transform the ray into object space with the inverse model matrix to handle any rotation and scale.",
        "An ID buffer (GL_R32UI) picks pixel-exactly; read it back asynchronously with a PBO and a fence.",
        "Combine: bounding volumes to reject, exact tests or the ID buffer to decide.",
      ]} />
    </Article>
  );
}
