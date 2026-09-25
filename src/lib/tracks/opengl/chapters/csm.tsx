"use client";

// "Cascaded Shadow Maps" (Advanced Lighting): directional-light shadows that stay sharp from the player's feet to the horizon.

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { CsmSplitFigure } from "@/components/lesson/figures/advlighting/CsmSplitFigure";
import { CsmFigure } from "@/components/lesson/figures/advlighting/CsmFigure";

const r = String.raw;

export function CascadedShadowsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglCsm_intro",
          "The shadow-mapping chapter fitted one orthographic light frustum around a small scene. Outdoors that breaks down. The sun lights everything the camera can see, from the grass at your feet to the mountains a kilometre away, and a single 2048² map spread over that range gives each texel half a metre of ground. Cascaded shadow maps (CSM) use several maps instead: a small, dense one near the camera and progressively larger, coarser ones further out.")}
      </Lead>

      <H2>{tx(t, "oglCsm_whyTitle", "Perspective aliasing, in numbers")}</H2>
      <p>
        {tx(t, "oglCsm_whyBody",
          "What matters is how big a shadow texel is compared with a screen pixel at the same spot. Perspective makes near pixels tiny in world units. An orthographic shadow map has the same texel size everywhere, so near the camera one texel covers many pixels:")}
      </p>
      <Equation label={tx(t, "oglCsm_ratioLabel", "Texels per pixel at distance z")}
        where={[
          [r`s_{pix}(z)`, tx(t, "oglCsm_wPix", "world size of one screen pixel at view depth z")],
          [r`s_{tex}`, tx(t, "oglCsm_wTex", "world size of one shadow texel: the map's footprint E divided by its resolution N")],
          [r`H,\ \text{fov}`, tx(t, "oglCsm_wH", "screen height in pixels, vertical field of view")],
        ]}
        note={tx(t, "oglCsm_ratioNote", "At 1080p with a 60° fov, a pixel 2 m away is about 2.1 mm wide. A 2048² map covering 150 m has 7.3 cm texels, so ρ ≈ 1/34: one texel spans 34 pixels across. Cascades attack E, the only term you control per region.")}>
        {r`s_{pix}(z) = \frac{2\,z\tan(\text{fov}/2)}{H} \qquad s_{tex} = \frac{E}{N} \qquad \rho(z) = \frac{s_{pix}(z)}{s_{tex}}\quad\begin{cases}\rho \ge 1 & \text{sharp}\\ \rho \ll 1 & \text{blocky}\end{cases}`}
      </Equation>

      <H2>{tx(t, "oglCsm_splitTitle", "Splitting the view frustum")}</H2>
      <p>
        {tx(t, "oglCsm_splitBody",
          "Cut the camera frustum along its depth into N slices, the cascades, and give each its own shadow map. Where to cut is the first design decision. Uniform splits waste the first cascade on a huge range. Logarithmic splits match perspective in theory, but make the nearest slices absurdly thin. The practical split scheme (Zhang et al., Parallel-Split Shadow Maps, 2006) blends the two:")}
      </p>
      <Equation label={tx(t, "oglCsm_pssmLabel", "Practical split scheme")}
        where={[
          [r`n,\ f`, tx(t, "oglCsm_wNf", "near plane and shadow distance (often much shorter than the camera's far plane)")],
          [r`i = 0 \ldots N`, tx(t, "oglCsm_wI", "split index; z₀ = n and z_N = f")],
          [r`\lambda`, tx(t, "oglCsm_wLambda", "0 = uniform, 1 = logarithmic; 0.5–0.9 in practice")],
        ]}
        glm="float z = lambda * n * pow(f / n, i / float(N)) + (1 - lambda) * (n + (f - n) * i / float(N));">
        {r`z_i = \lambda\, n\left(\frac{f}{n}\right)^{i/N} + (1 - \lambda)\left(n + (f - n)\,\frac{i}{N}\right)`}
      </Equation>
      <CsmSplitFigure t={t} />

      <H2>{tx(t, "oglCsm_fitTitle", "Fitting a light frustum to each slice")}</H2>
      <p>
        {tx(t, "oglCsm_fitBody",
          "For each slice: compute its 8 corners in world space, transform them into the light's view, and build an orthographic projection around them. The near side must reach back toward the sun, because an object outside the slice (a tall tree behind the camera, a cliff) can still cast a shadow into it.")}
      </p>
      <CodeBlock lang="cpp" filename="cascade_fit.cpp" t={t}>{`glm::mat4 fitCascade(const Camera& cam, float zn, float zf, glm::vec3 sunDir, int mapSize) {
    // 1. Slice corners, straight from the camera basis
    float ty = tan(cam.fovY / 2), tx = ty * cam.aspect;
    std::array<glm::vec3, 8> c;
    int k = 0;
    for (float d : { zn, zf })
        for (float sx : { -1.f, 1.f })
            for (float sy : { -1.f, 1.f })
                c[k++] = cam.pos + cam.front * d + cam.right * (sx * d * tx) + cam.up * (sy * d * ty);

    // 2. A bounding sphere: its size does not change when the camera rotates
    glm::vec3 center(0);  for (auto& p : c) center += p;  center /= 8.f;
    float radius = 0;     for (auto& p : c) radius = glm::max(radius, glm::length(p - center));
    radius = std::ceil(radius * 16.f) / 16.f;

    // 3. Light view with no translation, so its texel grid is fixed in the world
    glm::mat4 lightRot = glm::lookAt(glm::vec3(0), -sunDir, glm::vec3(0, 1, 0));
    glm::vec3 lc = glm::vec3(lightRot * glm::vec4(center, 1));

    // 4. Snap the centre to whole texels: the map slides in texel steps, never fractions
    float texel = 2 * radius / mapSize;
    lc.x = std::floor(lc.x / texel) * texel;
    lc.y = std::floor(lc.y / texel) * texel;

    const float casterReach = 50.0f;                  // extend toward the sun
    glm::mat4 proj = glm::ortho(lc.x - radius, lc.x + radius, lc.y - radius, lc.y + radius,
                                -(lc.z + radius + casterReach), -(lc.z - radius));
    return proj * lightRot;
}`}</CodeBlock>
      <Equation label={tx(t, "oglCsm_snapLabel", "Why snapping removes shimmering")}
        where={[
          [r`c_L`, tx(t, "oglCsm_wCl", "the cascade centre in light space")],
          [r`\Delta = 2R/N`, tx(t, "oglCsm_wDelta", "world size of one texel for a cascade of radius R")],
        ]}
        note={tx(t, "oglCsm_snapNote", "If the projection moves by a fraction of a texel, every texel samples the scene at slightly different points than last frame, and shadow edges crawl and flicker as you walk. Keeping the size constant (sphere, not box) and moving only in whole texels makes consecutive frames rasterize the same texels, so edges stay put. The price is resolution: a sphere is larger than the tight box, often by 30–50%.")}>
        {r`c_L' = \Delta\left\lfloor \frac{c_L}{\Delta} \right\rfloor \qquad \text{(x and y only)}`}
      </Equation>

      <H2>{tx(t, "oglCsm_renderTitle", "Rendering and sampling")}</H2>
      <p>
        {tx(t, "oglCsm_renderBody",
          "Store the cascades as layers of a depth texture array. Render each layer with its own matrix, either as N passes or as one pass with a geometry shader that uses gl_Layer and invocations. In the lighting shader, pick the cascade from the fragment's view depth and sample that layer:")}
      </p>
      <CodeBlock lang="cpp" filename="csm_setup.cpp" t={t}>{`glTexImage3D(GL_TEXTURE_2D_ARRAY, 0, GL_DEPTH_COMPONENT32F, size, size, cascades, 0,
             GL_DEPTH_COMPONENT, GL_FLOAT, nullptr);
// Hardware comparison: texture() returns the fraction of the 2×2 footprint in light, filtered
glTexParameteri(GL_TEXTURE_2D_ARRAY, GL_TEXTURE_COMPARE_MODE, GL_COMPARE_REF_TO_TEXTURE);
glTexParameteri(GL_TEXTURE_2D_ARRAY, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
glTexParameteri(GL_TEXTURE_2D_ARRAY, GL_TEXTURE_MAG_FILTER, GL_LINEAR);

glEnable(GL_DEPTH_CLAMP);        // casters beyond the near plane get depth 0 instead of being clipped
for (int i = 0; i < cascades; ++i) {
    glFramebufferTextureLayer(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, shadowArray, 0, i);
    glClear(GL_DEPTH_BUFFER_BIT);
    depthShader.setMat4("lightSpace", cascadeMatrix[i]);
    drawShadowCasters(cascadeFrustum[i]);        // cull per cascade: far cascades see much more
}
glDisable(GL_DEPTH_CLAMP);`}</CodeBlock>
      <CodeBlock lang="glsl" filename="csm.frag" t={t}>{`uniform sampler2DArrayShadow shadowMap;
uniform mat4  lightSpace[4];
uniform float splitFar[4];      // view depth where each cascade ends
uniform float texelWorld[4];    // for normal offset, per cascade
uniform int   cascadeCount;

float shadow(vec3 worldPos, vec3 N, float viewDepth) {
    int c = cascadeCount - 1;
    for (int i = 0; i < cascadeCount; ++i)
        if (viewDepth < splitFar[i]) { c = i; break; }

    vec3 p = worldPos + N * texelWorld[c] * 1.5;          // normal offset scales with the cascade
    vec4 ls = lightSpace[c] * vec4(p, 1.0);
    vec3 uvz = ls.xyz * 0.5 + 0.5;                         // orthographic: no divide needed

    float lit = 0.0;
    vec2 texel = 1.0 / vec2(textureSize(shadowMap, 0).xy);
    for (int x = -1; x <= 1; ++x)
        for (int y = -1; y <= 1; ++y)                      // 3×3 taps × hardware 2×2 = 36-sample PCF
            lit += texture(shadowMap, vec4(uvz.xy + vec2(x, y) * texel, c, uvz.z));
    return 1.0 - lit / 9.0;
}`}</CodeBlock>
      <CsmFigure t={t} />

      <H2>{tx(t, "oglCsm_detailsTitle", "The details that make it shippable")}</H2>
      <LessonTable
        headers={[tx(t, "oglCsm_thProblem", "Problem"), tx(t, "oglCsm_thFix", "Fix")]}
        rows={[
          [tx(t, "oglCsm_p1", "Shimmering edges when the camera moves"), tx(t, "oglCsm_f1", "bounding sphere + texel snapping (stable CSM)")],
          [tx(t, "oglCsm_p2", "Visible seam where resolution jumps"), tx(t, "oglCsm_f2", "blend the last ~10% of each cascade with the next; or dither between them")],
          [tx(t, "oglCsm_p3", "Acne in far cascades, peter-panning in near ones"), tx(t, "oglCsm_f3", "scale bias and normal offset by each cascade's texel size")],
          [tx(t, "oglCsm_p4", "Tall casters outside the slice get clipped"), tx(t, "oglCsm_f4", "extend the near plane toward the light, or GL_DEPTH_CLAMP (\"pancaking\")")],
          [tx(t, "oglCsm_p5", "N shadow passes are expensive"), tx(t, "oglCsm_f5", "cull casters per cascade; update far cascades every 2nd–4th frame; cache static geometry")],
          [tx(t, "oglCsm_p6", "Splits wasted on empty sky or a close wall"), tx(t, "oglCsm_f6", "SDSM: read the depth buffer's min/max each frame and fit splits to what is actually visible")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "oglCsm_modernNote",
          "Typical settings: 3–4 cascades, 2048² each, λ ≈ 0.7, shadow distance 100–300 m, with distant terrain handled by baked or low-frequency shadows. Unreal Engine 5 replaced CSM with virtual shadow maps: one enormous 16k² virtual map, paged like virtual memory, where only the pages visible on screen are rendered at the resolution they need. It is the same idea, texel density where the pixels are, taken to its limit.")}
      </Callout>
      <Callout type="warn" t={t}>
        {tx(t, "oglCsm_pitfalls",
          "Pick the cascade from view depth, the distance along the camera's forward axis, not from the Euclidean distance to the camera, or the splits become spheres that don't match the slices you fitted. Rebuild the matrices every frame from the same camera state used for rendering; a one-frame lag shows up as shadows sliding. And if the sun is almost straight up, lookAt with up = (0, 1, 0) degenerates, so switch to another up axis.")}
      </Callout>

      <KeyIdeas t={t} id="oglCsm" items={[
        "A single sun shadow map cannot match perspective: near the camera one texel covers many pixels.",
        "CSM splits the view frustum by depth (practical scheme blends uniform and log with λ) and gives each slice its own map.",
        "Fit each light frustum to its slice; extend toward the sun to catch casters outside the view.",
        "Stable CSM: bounding sphere (constant size) + snapping to whole texels removes shimmering.",
        "Sample by view depth, scale bias per cascade, blend at seams, and store the maps in a depth texture array.",
      ]} />
    </Article>
  );
}
