// src/lib/tracks/opengl/chapters/lighting-advanced.tsx
"use client";

// The "Advanced Lighting" section: Blinn-Phong → Gamma → Shadow Mapping →
// Point Shadows → Normal Mapping → HDR → Bloom → Deferred Shading.

import type { ReactNode } from "react";
import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { BlinnMathFigure } from "@/components/lesson/figures/advlighting/BlinnMathFigure";
import { BlinnCompareFigure } from "@/components/lesson/figures/advlighting/BlinnCompareFigure";
import { GammaFigure } from "@/components/lesson/figures/advlighting/GammaFigure";
import { ShadowAcneFigure } from "@/components/lesson/figures/advlighting/ShadowAcneFigure";
import { ShadowMapFigure } from "@/components/lesson/figures/advlighting/ShadowMapFigure";
import { PointShadowFigure } from "@/components/lesson/figures/advlighting/PointShadowFigure";
import { NormalMapFigure } from "@/components/lesson/figures/advlighting/NormalMapFigure";
import { HdrFigure } from "@/components/lesson/figures/advlighting/HdrFigure";
import { BloomFigure } from "@/components/lesson/figures/advlighting/BloomFigure";
import { DeferredFigure } from "@/components/lesson/figures/advlighting/DeferredFigure";

const r = String.raw;

export function KeyIdeas({ t, id, items }: { t: TrackTranslations; id: string; items: string[] }) {
  return (
    <div className="my-8 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary-low)] p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--primary)] mb-3">{tx(t, "keyIdeas", "Key ideas")}</p>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-[var(--text-main)]">
            <span className="text-[var(--primary)] font-bold">→</span><span>{tx(t, `${id}_key${i}`, it)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
export const Article = ({ children }: { children: ReactNode }) => (
  <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">{children}</article>
);
export const Lead = ({ children }: { children: ReactNode }) => <p className="text-lg text-[var(--text-main)]">{children}</p>;

// ═════════════════════════════════════════════════════════════════════════════
// Blinn-Phong
// ═════════════════════════════════════════════════════════════════════════════

export function BlinnPhongContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglBlinn_intro",
          "Phong's specular term has a flaw that only shows in some situations — low shininess, grazing angles — but when it shows, it is ugly: the highlight stops along a hard edge. Jim Blinn's fix in 1977 replaced one vector and became the default specular model in OpenGL's fixed pipeline for decades.")}
      </Lead>

      <H2>{tx(t, "oglBlinn_problemTitle", "Where Phong breaks")}</H2>
      <p>
        {tx(t, "oglBlinn_problemBody",
          "Phong measures the angle α between the reflected ray and the eye. Once α passes 90°, the dot product goes negative and max() clamps the whole term to zero. With a high exponent the highlight has already faded long before 90°, so nobody notices. With a low exponent the highlight is still bright at 90° — and it ends in a cliff.")}
      </p>
      <BlinnCompareFigure t={t} />

      <H2>{tx(t, "oglBlinn_halfTitle", "The halfway vector")}</H2>
      <p>
        {tx(t, "oglBlinn_halfBody",
          "Instead of reflecting the light, take the direction exactly between the light and the eye — the halfway vector — and ask how close it is to the normal. When the eye sits in the mirror direction, the halfway vector lines up with the normal, which is exactly when the highlight should peak.")}
      </p>
      <Equation label={tx(t, "oglBlinn_eqLabel", "Blinn-Phong specular")}
        where={[[r`\vH`, tx(t, "oglBlinn_wH", "the unit vector halfway between the light and view directions")]]}
        glsl="vec3 H = normalize(lightDir + viewDir);  float spec = pow(max(dot(N, H), 0.0), shininess);">
        {r`\vH = \frac{\vL + \vV}{\lVert \vL + \vV \rVert} \qquad I_s = k_s\,L_s\,\max(0,\,\dotp{\vN}{\vH})^{\alpha'}`}
      </Equation>
      <p>
        {tx(t, "oglBlinn_neverNeg",
          "Since the light and the eye are both above the surface, the halfway vector can never point more than 90° away from the normal, so n·h never needs clamping mid-highlight. The price is that the angle is smaller — which the next figure makes exact.")}
      </p>
      <BlinnMathFigure t={t} />
      <Equation label={tx(t, "oglBlinn_halfAngle", "In the plane of the three vectors")}
        note={tx(t, "oglBlinn_halfAngleNote", "With β = α/2, matching cos^n α near the peak needs cos^m(α/2) with m ≈ 4n — the usual rule of thumb for converting shininess.")}>
        {r`\angle(\vN, \vH) = \beta = \tfrac{1}{2}\,\angle(\vR, \vV) = \tfrac{\alpha}{2}
\qquad
\cos^{n}\alpha \;\approx\; \cos^{4n}\!\tfrac{\alpha}{2}`}
      </Equation>

      <CodeBlock lang="glsl" filename="blinn.glsl" t={t}>{`// Phong — the reflection vector
vec3  reflectDir = reflect(-lightDir, normal);
float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);

// Blinn-Phong — the halfway vector between light and view
vec3  halfwayDir = normalize(lightDir + viewDir);
float spec = pow(max(dot(normal, halfwayDir), 0.0), shininess * 4.0);`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "oglBlinn_perfNote",
          "Blinn-Phong is also cheaper when the light is directional and the viewer is far away: H is then the same for every fragment and can be computed once on the CPU. And it matches measured highlights better than Phong — the halfway vector is the ancestor of the microfacet normal that physically based rendering is built on.")}
      </Callout>

      <KeyIdeas t={t} id="oglBlinn" items={[
        "Phong clamps r·v at 90°, which cuts low-shininess highlights off with a hard edge.",
        "Blinn-Phong compares the normal with the halfway vector h = normalize(l + v) instead.",
        "The halfway angle is half the reflection angle, so use about 4× the exponent for the same look.",
      ]} />
    </Article>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Gamma correction
// ═════════════════════════════════════════════════════════════════════════════

export function GammaContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglGamma_intro",
          "Every lighting formula so far assumed that doubling a colour value doubles the light it produces. Your monitor disagrees. Getting this wrong makes lighting look too harsh and too dark, falloff look wrong, and blending look muddy — and fixing it takes two lines.")}
      </Lead>

      <H2>{tx(t, "oglGamma_displayTitle", "What the display does")}</H2>
      <p>
        {tx(t, "oglGamma_displayBody",
          "A display turns the value it receives into light with a power curve: the light it emits is roughly the value raised to 2.2. This started as a property of CRT electron guns and was kept on purpose, because it spends more of the 256 available levels on dark tones, where human eyes are most sensitive. Run the test below on your own screen:")}
      </p>
      <GammaFigure t={t} />
      <Equation label={tx(t, "oglGamma_eqLabel", "The display and its inverse")}
        where={[[r`\gamma`, tx(t, "oglGamma_wG", "≈ 2.2 for sRGB displays")]]}>
        {r`L_{\text{emitted}} = V^{\gamma}
\qquad\Longrightarrow\qquad
V = L_{\text{wanted}}^{\,1/\gamma}
\qquad
0.5^{2.2} \approx 0.218,\;\; 0.5^{1/2.2} \approx 0.730`}
      </Equation>
      <p>
        {tx(t, "oglGamma_srgbBody",
          "The standard curve, sRGB, is a power of 2.4 with a short linear segment near black (so the curve has a finite slope at zero). 2.2 is the usual approximation:")}
      </p>
      <Equation label={tx(t, "oglGamma_srgbLabel", "The exact sRGB encoding")}>
        {r`C_{\text{sRGB}} = \begin{cases} 12.92\,C_{\text{lin}} & C_{\text{lin}} \le 0.0031308 \\[4pt] 1.055\,C_{\text{lin}}^{1/2.4} - 0.055 & \text{otherwise} \end{cases}`}
      </Equation>

      <H2>{tx(t, "oglGamma_workflowTitle", "The linear workflow")}</H2>
      <p>
        {tx(t, "oglGamma_workflowBody",
          "Light adds and multiplies linearly, so every lighting calculation must happen on linear values. That means decoding colour textures on the way in (artists paint in sRGB), and encoding the final colour once on the way out. Nothing else changes.")}
      </p>
      <LessonTable
        headers={[tx(t, "oglAdvLight_g0", "Stage"), tx(t, "oglAdvLight_g1", "Space"), tx(t, "oglAdvLight_g2", "What to do")]}
        rows={[
          [tx(t, "oglAdvLight_gs1", "Colour textures (albedo)"), "sRGB", tx(t, "oglAdvLight_ga1", "Upload as GL_SRGB8_ALPHA8 — the GPU linearizes on sample, for free.")],
          [tx(t, "oglAdvLight_gs2", "Data textures (normal, roughness)"), tx(t, "oglAdvLight_gsp2", "Linear"), tx(t, "oglAdvLight_ga2", "Upload as GL_RGBA8. Never gamma-correct these — they are numbers, not colours.")],
          [tx(t, "oglAdvLight_gs3", "All lighting maths"), tx(t, "oglAdvLight_gsp3", "Linear"), tx(t, "oglAdvLight_ga3", "Nothing. This is where it must happen.")],
          [tx(t, "oglAdvLight_gs4", "Final output"), "sRGB", tx(t, "oglAdvLight_ga4", "Encode back with pow(color, 1/2.2), or enable GL_FRAMEBUFFER_SRGB.")],
        ]}
      />
      <CodeBlock lang="cpp" filename="gamma.cpp" t={t}>{`// Option A — let the hardware do both conversions
glTexImage2D(GL_TEXTURE_2D, 0, GL_SRGB8_ALPHA8, w, h, 0,
             GL_RGBA, GL_UNSIGNED_BYTE, data);   // linearized on sample
glEnable(GL_FRAMEBUFFER_SRGB);                   // encoded on write

// Option B — do the final encode yourself in the shader
//   FragColor = vec4(pow(color, vec3(1.0 / 2.2)), 1.0);

// Pick ONE. Doing both washes the image out completely.`}</CodeBlock>

      <H2>{tx(t, "oglGamma_attTitle", "Why attenuation looked wrong")}</H2>
      <p>
        {tx(t, "oglGamma_attBody",
          "Remember the attenuation constants from Light Casters — the linear term was needed because pure 1/d² looked too dark. That was gamma in disguise: displayed without correction, 1/d² becomes (1/d²)^2.2 ≈ 1/d^4.4. In a linear workflow the physically correct inverse square looks right on its own.")}
      </p>
      <Equation>{r`\left(\frac{1}{d^{2}}\right)^{2.2} = \frac{1}{d^{4.4}} \qquad\text{(what an uncorrected pipeline shows)}`}</Equation>

      <Callout type="warn" t={t}>
        {tx(t, "oglAdvLight_doubleWarn",
          "Double-correcting is the most common mistake here, and it looks like a faded, milky image. If you enable GL_FRAMEBUFFER_SRGB, do not also apply pow(1/2.2) in the shader. And when you switch to a linear workflow, re-tune your light intensities — values tuned to look right under the wrong curve will all be too bright.")}
      </Callout>

      <KeyIdeas t={t} id="oglGamma" items={[
        "Displays emit roughly value^2.2: a pixel value of 0.5 is only ~22% of the light.",
        "Do all lighting on linear values: decode colour textures, encode the output once.",
        "Data textures (normals, roughness, specular masks) are never gamma-corrected.",
      ]} />
    </Article>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Shadow mapping
// ═════════════════════════════════════════════════════════════════════════════

export function ShadowMappingContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglShadow_intro",
          "A shadow is the absence of light, and the only question a shadow algorithm answers is: can this fragment see the light source? Shadow mapping answers it by rendering the scene once from the light's point of view, recording how far the light reaches in every direction, and then checking each fragment against that record.")}
      </Lead>

      <ShadowMapFigure t={t} />

      <H2>{tx(t, "oglShadow_passesTitle", "Two passes")}</H2>
      <LessonTable
        headers={[tx(t, "oglShadow_h0", "Pass"), tx(t, "oglShadow_h1", "Renders"), tx(t, "oglShadow_h2", "Output")]}
        rows={[
          [tx(t, "oglShadow_p1", "1 — Depth"), tx(t, "oglShadow_r1", "The scene from the light's position"), tx(t, "oglShadow_o1", "A depth texture: distance to the nearest surface")],
          [tx(t, "oglShadow_p2", "2 — Shading"), tx(t, "oglShadow_r2", "The scene from the camera"), tx(t, "oglShadow_o2", "Final image, sampling the depth texture per fragment")],
        ]}
      />

      <H2>{tx(t, "oglShadow_fboTitle", "The depth-only framebuffer")}</H2>
      <CodeBlock lang="cpp" filename="depth_fbo.cpp" t={t}>{`constexpr unsigned SHADOW_W = 2048, SHADOW_H = 2048;
unsigned int depthMapFBO, depthMap;
glGenFramebuffers(1, &depthMapFBO);
glGenTextures(1, &depthMap);
glBindTexture(GL_TEXTURE_2D, depthMap);
glTexImage2D(GL_TEXTURE_2D, 0, GL_DEPTH_COMPONENT24, SHADOW_W, SHADOW_H, 0,
             GL_DEPTH_COMPONENT, GL_FLOAT, nullptr);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
// Anything outside the light's frustum must be treated as LIT, not shadowed
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_BORDER);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_BORDER);
float border[] = {1.0f, 1.0f, 1.0f, 1.0f};
glTexParameterfv(GL_TEXTURE_2D, GL_TEXTURE_BORDER_COLOR, border);

glBindFramebuffer(GL_FRAMEBUFFER, depthMapFBO);
glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, depthMap, 0);
glDrawBuffer(GL_NONE);      // no colour attachment...
glReadBuffer(GL_NONE);      // ...and the FBO is still complete
glBindFramebuffer(GL_FRAMEBUFFER, 0);`}</CodeBlock>

      <H2>{tx(t, "oglShadow_matrixTitle", "The light-space matrix")}</H2>
      <p>
        {tx(t, "oglShadow_matrixBody",
          "A directional light has no position, so you place a virtual camera somewhere along its direction and use an orthographic projection — parallel rays, parallel frustum. A spotlight uses a perspective projection instead. Either way, the product of the two is the matrix that takes a world position to the light's clip space.")}
      </p>
      <Equation label={tx(t, "oglShadow_eqLS", "From world space to the shadow map")}
        where={[
          [r`P_{\text{light}}\,V_{\text{light}}`, tx(t, "oglShadow_wLS", "the light's projection and view — the lightSpaceMatrix")],
          [r`\mathbf{s}`, tx(t, "oglShadow_wS", "texture coordinates (xy) and depth (z) of the fragment as the light sees it")],
        ]}>
        {r`\mathbf{p}_{\text{light}} = P_{\text{light}}\,V_{\text{light}}\,\mathbf{p}_{\text{world}}
\qquad
\mathbf{s} = \tfrac12\,\frac{\mathbf{p}_{\text{light}}.xyz}{\mathbf{p}_{\text{light}}.w} + \tfrac12`}
      </Equation>
      <CodeBlock lang="cpp" filename="light_space.cpp" t={t}>{`// Directional light: orthographic. Fit the box tightly around the scene —
// a loose box wastes shadow-map resolution and makes everything blocky.
glm::mat4 lightProjection = glm::ortho(-10.0f, 10.0f, -10.0f, 10.0f, 1.0f, 25.0f);
glm::mat4 lightView       = glm::lookAt(lightPos, glm::vec3(0.0f), glm::vec3(0.0f, 1.0f, 0.0f));
glm::mat4 lightSpaceMatrix = lightProjection * lightView;

// Pass 1
glViewport(0, 0, SHADOW_W, SHADOW_H);      // match the texture, not the window
glBindFramebuffer(GL_FRAMEBUFFER, depthMapFBO);
glClear(GL_DEPTH_BUFFER_BIT);
depthShader.use();
depthShader.setMat4("uLightSpace", lightSpaceMatrix);
renderScene(depthShader);

// Pass 2
glBindFramebuffer(GL_FRAMEBUFFER, 0);
glViewport(0, 0, windowWidth, windowHeight);
glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
mainShader.use();
mainShader.setMat4("uLightSpace", lightSpaceMatrix);
glActiveTexture(GL_TEXTURE1);
glBindTexture(GL_TEXTURE_2D, depthMap);
renderScene(mainShader);`}</CodeBlock>

      <H2>{tx(t, "oglShadow_sampleTitle", "The shadow test")}</H2>
      <Equation label={tx(t, "oglShadow_testLabel", "In shadow when")}>
        {r`\text{shadow} = \begin{cases} 1 & s_z - b > \texttt{shadowMap}(s_x, s_y) \\ 0 & \text{otherwise} \end{cases}`}
      </Equation>
      <CodeBlock lang="glsl" filename="shadow.frag" t={t}>{`float shadowFactor(vec4 fragPosLightSpace, vec3 normal, vec3 lightDir) {
    // Manual perspective divide — gl_Position does this automatically, we must not
    vec3 proj = fragPosLightSpace.xyz / fragPosLightSpace.w;
    proj = proj * 0.5 + 0.5;                    // NDC [-1,1] to texture [0,1]
    if (proj.z > 1.0) return 0.0;               // beyond the far plane: lit

    float currentDepth = proj.z;
    // Slope-scaled bias: steep surfaces need more
    float bias = max(0.05 * (1.0 - dot(normal, lightDir)), 0.005);

    // PCF — average a 3x3 neighbourhood to soften the edge
    float shadow = 0.0;
    vec2 texelSize = 1.0 / textureSize(uShadowMap, 0);
    for (int x = -1; x <= 1; ++x)
        for (int y = -1; y <= 1; ++y) {
            float pcf = texture(uShadowMap, proj.xy + vec2(x, y) * texelSize).r;
            shadow += (currentDepth - bias > pcf) ? 1.0 : 0.0;
        }
    return shadow / 9.0;
}
// In main(): lighting = ambient + (1.0 - shadowFactor(...)) * (diffuse + specular);`}</CodeBlock>

      <H2>{tx(t, "oglShadow_acneTitle", "Why acne happens, and how much bias fixes it")}</H2>
      <p>
        {tx(t, "oglShadow_acneBody",
          "The shadow map is a grid. Each texel stores one depth — the one at its centre — but on a sloped surface the true depth keeps changing across that texel. Half of the fragments that fall inside it are slightly deeper than the stored value, so they fail the test against their own surface.")}
      </p>
      <ShadowAcneFigure t={t} />
      <Equation label={tx(t, "oglShadow_biasLabel", "Slope-scaled bias")}
        note={tx(t, "oglShadow_biasNote", "1 − n·l is 0 for surfaces facing the light and grows as they tilt away — exactly where depth changes fastest inside a texel.")}>
        {r`b = \max\!\big(b_{\max}\,(1 - \dotp{\vN}{\vL}),\; b_{\min}\big)`}
      </Equation>

      <H2>{tx(t, "oglShadow_artifactsTitle", "The three artefacts")}</H2>
      <LessonTable
        headers={[tx(t, "oglShadow_a0", "Artefact"), tx(t, "oglShadow_a1", "Looks like"), tx(t, "oglShadow_a2", "Fix")]}
        rows={[
          [tx(t, "oglShadow_ar1", "Shadow acne"), tx(t, "oglShadow_al1", "Striped moiré on lit surfaces"), tx(t, "oglShadow_af1", "Depth bias, scaled by surface slope")],
          [tx(t, "oglShadow_ar2", "Peter-panning"), tx(t, "oglShadow_al2", "Shadow detached from the object"), tx(t, "oglShadow_af2", "Too much bias. Reduce it, or cull front faces in pass 1")],
          [tx(t, "oglShadow_ar3", "Hard aliasing"), tx(t, "oglShadow_al3", "Blocky stair-stepped shadow edges"), tx(t, "oglShadow_af3", "PCF, a larger map, or cascaded shadow maps")],
        ]}
      />
      <Callout type="warn" t={t}>
        {tx(t, "oglShadow_biasWarn",
          "Acne and peter-panning are the same knob pulled in opposite directions, and you will spend real time balancing them. Culling front faces during the depth pass helps a lot for closed meshes: the stored depth becomes the back of the object, far from the lit front surface, so a tiny bias is enough.")}
      </Callout>
      <Callout type="tip" t={t}>
        {tx(t, "oglShadow_csmTip",
          "For an outdoor scene with a sun, a single shadow map cannot cover the whole view with usable resolution. The production answer is cascaded shadow maps: split the camera frustum into several depth ranges and give each its own map, so near objects get dense texels and distant ones share a coarse map. The Cascaded Shadow Maps chapter builds it step by step.")}
      </Callout>

      <KeyIdeas t={t} id="oglShadow" items={[
        "Render depth from the light, then test each fragment's light-space depth against it.",
        "Acne comes from one depth per texel on sloped surfaces; bias pushes the test back.",
        "Too much bias detaches shadows; front-face culling and PCF are the usual companions.",
      ]} />
    </Article>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Point shadows
// ═════════════════════════════════════════════════════════════════════════════

export function PointShadowsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglPShadow_intro",
          "A shadow map is a picture taken from the light, and a picture only covers what is in front of the camera. A bulb in the middle of a room shines in every direction at once — so it needs a picture in every direction at once: a cube map.")}
      </Lead>

      <PointShadowFigure t={t} />

      <H2>{tx(t, "oglPShadow_cubeTitle", "Six views of 90°")}</H2>
      <p>
        {tx(t, "oglPShadow_cubeBody",
          "Put a camera at the light and point it down each axis. With a square aspect and a 90° field of view the six frusta tile the whole sphere of directions exactly, with no gaps and no overlap — the same six faces a cube map has.")}
      </p>
      <Equation label={tx(t, "oglPShadow_projLabel", "One projection, six views")}
        where={[[r`V_i`, tx(t, "oglPShadow_wVi", "lookAt(lightPos, lightPos + axis_i, up_i) for the six cube-map faces")]]}>
        {r`P = \text{perspective}(90^\circ,\; 1,\; n,\; f) \qquad M_i = P\,V_i,\quad i = 0\ldots5`}
      </Equation>
      <CodeBlock lang="cpp" filename="point_shadow_pass.cpp" t={t}>{`glm::mat4 proj = glm::perspective(glm::radians(90.0f), 1.0f, nearPlane, farPlane);
const glm::vec3 dirs[6] = { {1,0,0}, {-1,0,0}, {0,1,0}, {0,-1,0}, {0,0,1}, {0,0,-1} };
const glm::vec3 ups[6]  = { {0,-1,0}, {0,-1,0}, {0,0,1}, {0,0,-1}, {0,-1,0}, {0,-1,0} };

glViewport(0, 0, SHADOW_SIZE, SHADOW_SIZE);
glBindFramebuffer(GL_FRAMEBUFFER, depthCubeFBO);
for (int i = 0; i < 6; ++i) {
    glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT,
                           GL_TEXTURE_CUBE_MAP_POSITIVE_X + i, depthCubemap, 0);
    glClear(GL_DEPTH_BUFFER_BIT);
    depthShader.setMat4("uLightViewProj", proj * glm::lookAt(lightPos, lightPos + dirs[i], ups[i]));
    renderScene(depthShader);
}`}</CodeBlock>

      <H2>{tx(t, "oglPShadow_linTitle", "Store distance, not depth")}</H2>
      <p>
        {tx(t, "oglPShadow_linBody",
          "Ordinary depth is non-linear and belongs to one face's projection, which makes comparing across faces awkward. Point-shadow shaders write their own value instead: the straight-line distance to the light, divided by the far plane. The lighting pass then needs only one subtraction and a length.")}
      </p>
      <Equation label={tx(t, "oglPShadow_testLabel", "The test")}>
        {r`\text{stored} = \frac{\lVert \mathbf{p} - \mathbf{p}_{\text{light}} \rVert}{f}
\qquad
\text{shadow} \iff \lVert \mathbf{p} - \mathbf{p}_{\text{light}} \rVert - b \;>\; f\cdot\texttt{texture}(\text{depthCube},\; \mathbf{p} - \mathbf{p}_{\text{light}}).r`}
      </Equation>
      <CodeBlock lang="glsl" filename="point_shadow.frag" t={t}>{`// depth pass
gl_FragDepth = length(FragPos - lightPos) / farPlane;

// lighting pass
vec3  fragToLight = FragPos - lightPos;               // also the lookup direction
float closest = texture(depthCubemap, fragToLight).r * farPlane;
float current = length(fragToLight);
float shadow  = current - bias > closest ? 1.0 : 0.0;`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "oglPShadow_gsTip",
          "Six passes per light is expensive. Desktop OpenGL can do it in one pass with a geometry shader that emits each triangle six times, choosing the face through gl_Layer, or with instanced rendering and gl_Layer in the vertex shader (GL 4.x / ARB_shader_viewport_layer_array).")}
      </Callout>

      <KeyIdeas t={t} id="oglPShadow" items={[
        "An omnidirectional light needs a cube map of depths: six 90° views.",
        "Write linear distance / far yourself; compare lengths in the lighting pass.",
        "The light-to-fragment vector is both the distance and the cube-map lookup direction.",
      ]} />
    </Article>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Normal mapping
// ═════════════════════════════════════════════════════════════════════════════

export function NormalMappingContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglNMap_intro",
          "Lighting depends on the normal, not on the geometry. So instead of modelling every groove in a brick wall with triangles, store how the normal would tilt at each texel and light a flat quad as if the grooves were there.")}
      </Lead>

      <NormalMapFigure t={t} />

      <H2>{tx(t, "oglNMap_encodeTitle", "Normals stored as colours")}</H2>
      <p>
        {tx(t, "oglNMap_encodeBody",
          "A unit normal has components in [−1, 1]; a texture stores [0, 1]. The mapping is a scale and a shift. Most texels point straight out of the surface, (0, 0, 1), which encodes to (0.5, 0.5, 1) — the reason normal maps look mostly lavender blue.")}
      </p>
      <Equation label={tx(t, "oglNMap_encLabel", "Encoding and decoding")}>
        {r`\text{rgb} = \tfrac12\,\mathbf{n} + \tfrac12 \qquad\Longleftrightarrow\qquad \mathbf{n} = 2\,\text{rgb} - 1`}
      </Equation>

      <H2>{tx(t, "oglNMap_tangentTitle", "Tangent space")}</H2>
      <p>
        {tx(t, "oglNMap_tangentBody",
          "The normals in the map are relative to the surface: z means \"out of the surface\", x points along the texture's u direction and y along v. To light with them we need, at each vertex, the world directions that u and v run in — the tangent T and bitangent B — alongside the normal N.")}
      </p>
      <p>
        {tx(t, "oglNMap_deriveBody",
          "Take a triangle with corners P0, P1, P2 and texture coordinates (u, v). Its two edges are some combination of T and B, weighted by how much u and v change along them:")}
      </p>
      <Equation label={tx(t, "oglNMap_deriveLabel", "Solving for the tangent and bitangent")}
        where={[
          [r`E_1, E_2`, tx(t, "oglNMap_wE", "triangle edges P1 − P0 and P2 − P0")],
          [r`\Delta u_i, \Delta v_i`, tx(t, "oglNMap_wUV", "the change in texture coordinates along each edge")],
        ]}>
        {r`\begin{aligned}
E_1 &= \Delta u_1\,\red{T} + \Delta v_1\,\green{B} \\
E_2 &= \Delta u_2\,\red{T} + \Delta v_2\,\green{B}
\end{aligned}
\;\;\Longrightarrow\;\;
\begin{bmatrix} \red{T} \\ \green{B} \end{bmatrix}
= \frac{1}{\Delta u_1 \Delta v_2 - \Delta u_2 \Delta v_1}
\begin{bmatrix} \Delta v_2 & -\Delta v_1 \\ -\Delta u_2 & \Delta u_1 \end{bmatrix}
\begin{bmatrix} E_1 \\ E_2 \end{bmatrix}`}
      </Equation>
      <CodeBlock lang="cpp" filename="tangents.cpp" t={t}>{`glm::vec3 e1 = p1 - p0, e2 = p2 - p0;
glm::vec2 d1 = uv1 - uv0, d2 = uv2 - uv0;
float f = 1.0f / (d1.x * d2.y - d2.x * d1.y);

glm::vec3 tangent   = f * (d2.y * e1 - d1.y * e2);
glm::vec3 bitangent = f * (-d2.x * e1 + d1.x * e2);
// Assimp computes these for you with aiProcess_CalcTangentSpace`}</CodeBlock>

      <H2>{tx(t, "oglNMap_tbnTitle", "The TBN matrix")}</H2>
      <p>
        {tx(t, "oglNMap_tbnBody",
          "Put the three world-space axes in the columns of a matrix and it converts any tangent-space vector into world space — exactly what the sampled normal needs. After interpolation T may no longer be perpendicular to N, so re-orthogonalize it with one Gram-Schmidt step and rebuild B with a cross product.")}
      </p>
      <Equation label={tx(t, "oglNMap_tbnLabel", "From the map to world space")}>
        {r`TBN = \begin{bmatrix} \red{T} & \green{B} & \blue{N} \end{bmatrix}
\qquad
\mathbf{n}_{\text{world}} = TBN\,(2\,\text{rgb} - 1)
\qquad
\red{T'} = \operatorname{normalize}\big(\red{T} - (\red{T}\cdot\blue{N})\,\blue{N}\big)`}
      </Equation>
      <CodeBlock lang="glsl" filename="normal_mapping.vert" t={t}>{`layout (location = 3) in vec3 aTangent;
out mat3 TBN;

void main() {
    vec3 T = normalize(normalMatrix * aTangent);
    vec3 N = normalize(normalMatrix * aNormal);
    T = normalize(T - dot(T, N) * N);     // Gram-Schmidt
    vec3 B = cross(N, T);
    TBN = mat3(T, B, N);
    // ...
}`}</CodeBlock>
      <CodeBlock lang="glsl" filename="normal_mapping.frag" t={t}>{`vec3 normal = texture(normalMap, TexCoords).rgb * 2.0 - 1.0;   // tangent space
normal = normalize(TBN * normal);                                // world space
// ...then use it exactly like the vertex normal before`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "oglNMap_warn",
          "Two conventions bite. Normal maps are data: load them as GL_RGBA8, never as sRGB. And the green channel's direction differs between tools — OpenGL-style maps have +y up, DirectX-style have +y down. If bumps look lit from the wrong side, flip green.")}
      </Callout>

      <KeyIdeas t={t} id="oglNMap" items={[
        "A normal map stores a tangent-space normal per texel: n = 2·rgb − 1.",
        "T and B come from solving the triangle's edges against its UV deltas.",
        "TBN = [T B N] turns the sampled normal into world space; re-orthogonalize T first.",
      ]} />
    </Article>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// HDR
// ═════════════════════════════════════════════════════════════════════════════

export function HdrContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglHdr_intro",
          "The sun is thousands of times brighter than a lamp, which is brighter than a shaded wall — but a default framebuffer stores each channel in 8 bits clamped to [0, 1]. High dynamic range rendering keeps the real values while lighting and only squeezes them into the displayable range at the very end.")}
      </Lead>

      <H2>{tx(t, "oglHdr_fbTitle", "A floating-point framebuffer")}</H2>
      <p>
        {tx(t, "oglHdr_fbBody",
          "Render the scene into a texture whose format can hold values above 1: GL_RGBA16F is the usual choice — half floats reach 65504 with plenty of precision for colour. Then a fullscreen pass reads it and writes the tone-mapped result to the screen.")}
      </p>
      <CodeBlock lang="cpp" filename="hdr_fbo.cpp" t={t}>{`glBindTexture(GL_TEXTURE_2D, colorBuffer);
glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA16F, width, height, 0, GL_RGBA, GL_FLOAT, nullptr);
glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, colorBuffer, 0);
// + a depth renderbuffer, as for any 3D pass`}</CodeBlock>

      <HdrFigure t={t} />

      <H2>{tx(t, "oglHdr_toneTitle", "Tone mapping operators")}</H2>
      <p>
        {tx(t, "oglHdr_toneBody",
          "A tone-mapping operator is a curve from [0, ∞) to [0, 1). Each makes a different trade between keeping highlights and keeping contrast:")}
      </p>
      <Equation label={tx(t, "oglHdr_opsLabel", "Three classic operators")}
        where={[
          [r`x`, tx(t, "oglHdr_wX", "HDR colour, per channel, after multiplying by the exposure")],
          [r`e`, tx(t, "oglHdr_wE", "exposure — like a camera's, it picks which brightness becomes mid-grey")],
        ]}>
        {r`\underbrace{\;\frac{x}{1 + x}\;}_{\text{Reinhard}}
\qquad
\underbrace{\;1 - e^{-e\,x}\;}_{\text{exposure}}
\qquad
\underbrace{\;\frac{x\,(2.51x + 0.03)}{x\,(2.43x + 0.59) + 0.14}\;}_{\text{ACES (Narkowicz fit)}}`}
      </Equation>
      <CodeBlock lang="glsl" filename="tonemap.frag" t={t}>{`vec3 hdr = texture(hdrBuffer, TexCoords).rgb;
vec3 mapped = vec3(1.0) - exp(-hdr * exposure);   // exposure tone mapping
mapped = pow(mapped, vec3(1.0 / 2.2));             // then gamma-encode
FragColor = vec4(mapped, 1.0);`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "oglHdr_autoNote",
          "Games usually pick the exposure automatically: compute the scene's average luminance (downsample the HDR buffer to 1×1, or use glGenerateMipmap and read the last level), then ease the exposure toward it over time. That is the \"eye adaptation\" you see when walking out of a dark tunnel.")}
      </Callout>

      <KeyIdeas t={t} id="oglHdr" items={[
        "Light in a float (RGBA16F) framebuffer so values above 1.0 survive.",
        "Tone mapping is a curve from [0, ∞) into [0, 1): Reinhard, exposure, ACES…",
        "Tone map first, gamma-encode last.",
      ]} />
    </Article>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Bloom
// ═════════════════════════════════════════════════════════════════════════════

export function BloomContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglBloom_intro",
          "Real lenses and eyes scatter a little of very bright light onto its surroundings, so a lamp glows. A monitor cannot actually be that bright, but reproducing the glow tells the brain it is. Bloom needs HDR: only with values above 1.0 do we know what is bright enough to bleed.")}
      </Lead>

      <BloomFigure t={t} />

      <H2>{tx(t, "oglBloom_brightTitle", "1. Extract the bright parts")}</H2>
      <p>
        {tx(t, "oglBloom_brightBody",
          "Measure each pixel's brightness as luminance — the eye is far more sensitive to green than blue — and keep only what exceeds a threshold. A soft knee instead of a hard cut avoids flickering pixels at the boundary.")}
      </p>
      <Equation label={tx(t, "oglBloom_lumLabel", "Luminance (Rec. 709 weights)")}>
        {r`Y = 0.2126\,R + 0.7152\,G + 0.0722\,B
\qquad
\text{bright} = \mathbf{c}\cdot\operatorname{smoothstep}(\tau,\; \tau + k,\; Y)`}
      </Equation>

      <H2>{tx(t, "oglBloom_blurTitle", "2. Blur it — separably")}</H2>
      <p>
        {tx(t, "oglBloom_blurBody",
          "A Gaussian blur weighs neighbours by a bell curve. Its key property: the 2D Gaussian is the product of two 1D Gaussians, so one expensive 2D pass can be replaced by a horizontal pass followed by a vertical one.")}
      </p>
      <Equation label={tx(t, "oglBloom_sepLabel", "Why the blur can be split")}
        note={tx(t, "oglBloom_sepNote", "With a 9-tap kernel that is 18 samples per pixel instead of 81 — and repeating the pair of passes widens the blur further at the same cost each time.")}>
        {r`G(x, y) = \frac{1}{2\pi\sigma^2}\,e^{-\frac{x^2 + y^2}{2\sigma^2}}
= \underbrace{\frac{1}{\sqrt{2\pi}\sigma}e^{-\frac{x^2}{2\sigma^2}}}_{\text{horizontal}}
\cdot
\underbrace{\frac{1}{\sqrt{2\pi}\sigma}e^{-\frac{y^2}{2\sigma^2}}}_{\text{vertical}}
\qquad
N^2 \;\to\; 2N \text{ samples}`}
      </Equation>
      <CodeBlock lang="glsl" filename="blur.frag" t={t}>{`uniform bool horizontal;
uniform float weight[5] = float[](0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);

void main() {
    vec2 texel = 1.0 / textureSize(image, 0);
    vec2 dir = horizontal ? vec2(texel.x, 0.0) : vec2(0.0, texel.y);
    vec3 result = texture(image, TexCoords).rgb * weight[0];
    for (int i = 1; i < 5; ++i) {
        result += texture(image, TexCoords + dir * float(i)).rgb * weight[i];
        result += texture(image, TexCoords - dir * float(i)).rgb * weight[i];
    }
    FragColor = vec4(result, 1.0);
}`}</CodeBlock>
      <CodeBlock lang="cpp" filename="ping_pong.cpp" t={t}>{`bool horizontal = true, first = true;
for (int i = 0; i < 10; ++i) {                  // 5 horizontal + 5 vertical passes
    glBindFramebuffer(GL_FRAMEBUFFER, pingpongFBO[horizontal]);
    blurShader.setInt("horizontal", horizontal);
    glBindTexture(GL_TEXTURE_2D, first ? brightTexture : pingpongTex[!horizontal]);
    renderQuad();
    horizontal = !horizontal;
    first = false;
}`}</CodeBlock>

      <H2>{tx(t, "oglBloom_combineTitle", "3. Add it back")}</H2>
      <Equation>{r`\mathbf{c}_{\text{out}} = \operatorname{tonemap}\big(\mathbf{c}_{\text{scene}} + s\cdot\mathbf{c}_{\text{bloom}}\big)`}</Equation>

      <Callout type="tip" t={t}>
        {tx(t, "oglBloom_tip",
          "Blurring at half (or quarter) resolution is almost free and looks the same, since the result is soft anyway. Modern engines go further: downsample the bright buffer into a chain of mip levels, blur each a little, then upsample and add them together — a wide, stable bloom at a fraction of the cost.")}
      </Callout>

      <KeyIdeas t={t} id="oglBloom" items={[
        "Bloom works on HDR values: keep only luminance above a threshold.",
        "A Gaussian is separable — two 1D passes replace one 2D pass (2N vs N² samples).",
        "Add the blurred glow back before tone mapping.",
      ]} />
    </Article>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Deferred shading
// ═════════════════════════════════════════════════════════════════════════════

export function DeferredContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglDeferred_intro",
          "Forward rendering lights every fragment of every object, including the ones later hidden behind something else. Deferred shading splits rendering in two: first record what is visible at each pixel, then light each pixel exactly once.")}
      </Lead>

      <Equation label={tx(t, "oglDeferred_costLabel", "Where the cost goes")}
        where={[
          [r`F`, tx(t, "oglDeferred_wF", "fragments shaded, including overdraw")],
          [r`P`, tx(t, "oglDeferred_wP", "pixels on screen")],
          [r`L`, tx(t, "oglDeferred_wL", "lights")],
        ]}>
        {r`\text{forward} \approx F \times L
\qquad\qquad
\text{deferred} \approx F \;+\; P \times L`}
      </Equation>

      <DeferredFigure t={t} />

      <H2>{tx(t, "oglDeferred_gTitle", "The G-buffer")}</H2>
      <p>
        {tx(t, "oglDeferred_gBody",
          "The geometry pass uses a framebuffer with several colour attachments and a fragment shader with several outputs — multiple render targets. Everything the lighting needs is stored per pixel: position (or depth), normal, albedo and specular strength.")}
      </p>
      <CodeBlock lang="glsl" filename="gbuffer.frag" t={t}>{`layout (location = 0) out vec3 gPosition;
layout (location = 1) out vec3 gNormal;
layout (location = 2) out vec4 gAlbedoSpec;

void main() {
    gPosition        = FragPos;
    gNormal          = normalize(Normal);
    gAlbedoSpec.rgb  = texture(texture_diffuse1, TexCoords).rgb;
    gAlbedoSpec.a    = texture(texture_specular1, TexCoords).r;
}`}</CodeBlock>
      <CodeBlock lang="cpp" filename="gbuffer.cpp" t={t}>{`// Position and normal need precision: 16-bit float. Colour fits in 8 bits.
glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA16F, w, h, 0, GL_RGBA, GL_FLOAT, nullptr);       // gPosition
glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA16F, w, h, 0, GL_RGBA, GL_FLOAT, nullptr);       // gNormal
glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA,    w, h, 0, GL_RGBA, GL_UNSIGNED_BYTE, nullptr); // gAlbedoSpec

unsigned attachments[3] = { GL_COLOR_ATTACHMENT0, GL_COLOR_ATTACHMENT1, GL_COLOR_ATTACHMENT2 };
glDrawBuffers(3, attachments);        // write all three at once`}</CodeBlock>

      <H2>{tx(t, "oglDeferred_volTitle", "Light volumes")}</H2>
      <p>
        {tx(t, "oglDeferred_volBody",
          "A pixel far from a light receives nothing from it, yet the naive lighting pass still loops over every light. Solve the attenuation formula for the distance where the light drops below visible, and skip — or better, only draw a sphere of that radius for each light:")}
      </p>
      <Equation label={tx(t, "oglDeferred_radiusLabel", "Radius of a light volume")}
        note={tx(t, "oglDeferred_radiusNote", "Setting F_att · I_max = 5/256 and solving the quadratic K_q d² + K_l d + K_c − 256·I_max/5 = 0.")}>
        {r`r = \frac{-K_l + \sqrt{K_l^{2} - 4K_q\left(K_c - \frac{256}{5} I_{\max}\right)}}{2K_q}`}
      </Equation>

      <LessonTable
        headers={[tx(t, "oglDeferred_t0", "Deferred…"), tx(t, "oglDeferred_t1", "Because")]}
        rows={[
          [tx(t, "oglDeferred_tp1", "✓ scales to hundreds of lights"), tx(t, "oglDeferred_tp1b", "each pixel is lit once, only by lights that reach it")],
          [tx(t, "oglDeferred_tc1", "✗ cannot do transparency"), tx(t, "oglDeferred_tc1b", "the G-buffer holds one surface per pixel; blended objects need a forward pass afterwards")],
          [tx(t, "oglDeferred_tc2", "✗ struggles with MSAA"), tx(t, "oglDeferred_tc2b", "multisampled G-buffers are huge; most engines use post-process AA instead")],
          [tx(t, "oglDeferred_tc3", "✗ one lighting model"), tx(t, "oglDeferred_tc3b", "every material shares the same lighting shader (a material ID in the G-buffer helps)")],
        ]}
      />

      <KeyIdeas t={t} id="oglDeferred" items={[
        "Geometry pass: write position, normal, albedo and specular to a G-buffer with MRT.",
        "Lighting pass: one fullscreen pass, each pixel lit once — cost ≈ pixels × lights.",
        "Light volumes limit each light to the pixels it can actually reach.",
      ]} />
    </Article>
  );
}
