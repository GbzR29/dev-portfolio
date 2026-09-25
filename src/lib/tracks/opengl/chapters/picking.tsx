"use client";

// "Picking" (Advanced Techniques): turning a mouse position into "which object, and where".

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
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
        note={tx(t, "oglPick_ndcNote", "The divide by w undoes the perspective divide. Both points come out in world space, so the ray does too. An orthographic camera works unchanged: its near and far points simply share the same direction for every pixel.")}>
        {r`x_{ndc} = \frac{2 m_x}{W} - 1 \quad y_{ndc} = 1 - \frac{2 m_y}{H} \qquad \mathbf p_{n,f} = \frac{\big(M^{-1}(x_{ndc}, y_{ndc}, \mp 1, 1)\big)_{xyz}}{\big(M^{-1}(\ldots)\big)_w} \qquad \mathbf d = \frac{\mathbf p_f - \mathbf p_n}{\lVert \mathbf p_f - \mathbf p_n \rVert}`}
      </Equation>

      <H2>{tx(t, "oglPick_testsTitle", "Ray intersection tests")}</H2>
      <Equation label={tx(t, "oglPick_sphereLabel", "Ray vs sphere")}
        where={[[r`\mathbf o,\ \mathbf d`, tx(t, "oglPick_wOD", "ray origin and unit direction")], [r`\mathbf c,\ \rho`, tx(t, "oglPick_wC", "sphere centre and radius")]]}
        note={tx(t, "oglPick_sphereNote", "Substitute the ray into |p − c|² = ρ² and you get a quadratic in t. Negative h: the ray misses. Otherwise the smaller root is the entry point (if it is negative, the origin is inside the sphere and the larger root is the exit).")}>
        {r`\mathbf{oc} = \mathbf o - \mathbf c \qquad b = \mathbf{oc}\cdot\mathbf d \qquad h = b^2 - (\mathbf{oc}\cdot\mathbf{oc} - \rho^2) \qquad t = -b - \sqrt{h}`}
      </Equation>
      <Equation label={tx(t, "oglPick_slabLabel", "Ray vs axis-aligned box (slab test, Kay–Kajiya)")}
        where={[[r`\mathbf b_{min},\ \mathbf b_{max}`, tx(t, "oglPick_wB", "the box corners")], [r`\mathbf d^{-1}`, tx(t, "oglPick_wInv", "1 / d per component; ±∞ for axis-parallel rays is fine in IEEE floats")]]}>
        {r`\mathbf t_0 = (\mathbf b_{min} - \mathbf o) \odot \mathbf d^{-1} \quad \mathbf t_1 = (\mathbf b_{max} - \mathbf o) \odot \mathbf d^{-1} \qquad t_{enter} = \max(\min(\mathbf t_0, \mathbf t_1)) \quad t_{exit} = \min(\max(\mathbf t_0, \mathbf t_1)) \qquad \text{hit} \iff t_{enter} \le t_{exit} \wedge t_{exit} \ge 0`}
      </Equation>
      <SlabFigure t={t} />
      <Equation label={tx(t, "oglPick_mtLabel", "Ray vs triangle (Möller–Trumbore)")}
        where={[
          [r`\mathbf v_0, \mathbf v_1, \mathbf v_2`, tx(t, "oglPick_wV", "the triangle's vertices; e₁ = v₁ − v₀, e₂ = v₂ − v₀")],
          [r`u, v`, tx(t, "oglPick_wUV", "barycentric coordinates of the hit: inside the triangle when u ≥ 0, v ≥ 0, u + v ≤ 1")],
        ]}
        note={tx(t, "oglPick_mtNote", "It solves o + t·d = v₀ + u·e₁ + v·e₂ with Cramer's rule, sharing cross products between the three unknowns. A determinant near 0 means the ray is parallel to the triangle. The barycentrics also give the interpolated UV and normal at the hit, which you need for decals, bullet holes and painting.")}>
        {r`\mathbf p = \mathbf d \times \mathbf e_2 \quad \det = \mathbf e_1\cdot\mathbf p \quad \mathbf s = \mathbf o - \mathbf v_0 \quad u = \frac{\mathbf s\cdot\mathbf p}{\det} \quad \mathbf q = \mathbf s \times \mathbf e_1 \quad v = \frac{\mathbf d\cdot\mathbf q}{\det} \quad t = \frac{\mathbf e_2\cdot\mathbf q}{\det}`}
      </Equation>
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
