// src/lib/tracks/opengl/chapters/lighting-advanced/shadow-mapping.tsx
"use client";

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { acneNumbers } from "../../live/shadow-mapping";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { ShadowAcneFigure } from "@/components/lesson/figures/advlighting/ShadowAcneFigure";
import { ShadowMapFigure } from "@/components/lesson/figures/advlighting/ShadowMapFigure";

const r = String.raw;

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

      <Goals t={t} id="oglShadow" items={[
        "Render a shadow map from the light's point of view.",
        "Build the light-space matrix.",
        "Test whether a fragment is in shadow.",
        "Fix shadow acne, floating shadows and blocky edges.",
      ]} />

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
          [r`\mathbf{p}_{\text{world}}`, tx(t, "oglShadow_wPw", "the fragment's position in world space, with w = 1")],
          [r`\mathbf{p}_{\text{light}}`, tx(t, "oglShadow_wPl", "the same point in the light's clip space, as the depth pass put it on screen")],
        ]}
        words={tx(t, "oglShadow_eqLSWords", "Move the point exactly as the depth pass moved it, with the light's view and projection. Then divide by w and squeeze the result from −1…1 into 0…1: x and y say where to read the shadow map, z is how far the point is from the light.")}>
        {r`\mathbf{p}_{\text{light}} = P_{\text{light}}\,V_{\text{light}}\,\mathbf{p}_{\text{world}}
\qquad
\mathbf{s} = \tfrac12\,\frac{\mathbf{p}_{\text{light}}.xyz}{\mathbf{p}_{\text{light}}.w} + \tfrac12`}
      </Equation>
      <Derivation t={t} label={tx(t, "oglShadow_sDer", "From clip space to a texture lookup")}
        steps={[
          { full: true, tex: r`\mathbf{n} = \frac{\mathbf{p}_{\text{light}}.xyz}{\mathbf{p}_{\text{light}}.w}, \qquad -1 \le n_x, n_y, n_z \le 1`,
            why: tx(t, "oglShadow_sd1", "the perspective divide that the GPU does by itself for gl_Position; here we read the matrix result in our own shader, so we divide by hand. With an orthographic light w = 1 and nothing changes, but the line keeps spotlights working") },
          { full: true, tex: r`-\tfrac12 \le \tfrac12\,\mathbf{n} \le \tfrac12`,
            why: tx(t, "oglShadow_sd2", "halving shrinks the range from width 2 to width 1") },
          { full: true, tex: r`0 \le \mathbf{s} = \tfrac12\,\mathbf{n} + \tfrac12 \le 1`,
            why: tx(t, "oglShadow_sd3", "adding ½ slides it to start at 0: texture coordinates and stored depths both live in 0…1. The centre of the light's view, n = 0, lands on s = 0.5, the middle of the map") },
        ]} />
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
      <Equation label={tx(t, "oglShadow_testLabel", "In shadow when")}
        where={[
          [r`s_x, s_y`, tx(t, "oglShadow_wSxy", "where the fragment lands in the shadow map, 0–1")],
          [r`s_z`, tx(t, "oglShadow_wSz", "the fragment's own depth as seen from the light")],
          [r`\texttt{shadowMap}(s_x, s_y)`, tx(t, "oglShadow_wMap", "the depth of the closest surface the light saw in that direction")],
          [r`b`, tx(t, "oglShadow_wB", "the bias: a small amount subtracted so a surface does not shadow itself (below)")],
        ]}
        words={tx(t, "oglShadow_testWords", "Look up what the light saw in this fragment's direction. If something stored there is closer to the light than the fragment (by more than the bias), that something blocks the light: the fragment is in shadow.")}>
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
        note={tx(t, "oglShadow_biasNote", "1 − n·l is 0 for surfaces facing the light and grows as they tilt away — exactly where depth changes fastest inside a texel.")}
        where={[
          [r`b_{\max}`, tx(t, "oglShadow_wBmax", "the bias for a surface edge-on to the light; 0.05 in the shader above")],
          [r`b_{\min}`, tx(t, "oglShadow_wBmin", "the floor the bias never goes under, for surfaces facing the light; 0.005 above")],
          [r`\dotp{\vN}{\vL}`, tx(t, "oglShadow_wNl", "the cosine of the angle between the normal and the direction to the light")],
        ]}
        words={tx(t, "oglShadow_biasWords", "Facing the light, use the small minimum bias. The more the surface tilts away, the faster its depth changes across one texel, so the bias grows, up to the maximum for a surface seen edge-on.")}>
        {r`b = \max\!\big(b_{\max}\,(1 - \dotp{\vN}{\vL}),\; b_{\min}\big)`}
      </Equation>
      <LiveFormula label={tx(t, "oglShadow_liveLabel", "Try it: is the bias enough, and what does it cost?")}
        tex={r`\Delta = \frac{\text{texel}}{2}\tan\theta \qquad b \ge \frac{\Delta}{24}\ ?`}
        vars={[
          { id: "theta", label: "θ", min: 0, max: 89, step: 1, value: 60, fmt: v => `${v}°` },
          { id: "k", label: tx(t, "oglShadow_vSize", "map size"), min: 8, max: 12, step: 1, value: 11, fmt: v => String(2 ** v) },
        ]}
        where={[
          [r`\theta`, tx(t, "oglShadow_wTheta", "how far the surface is tilted away from the light (the angle between N and L)")],
          [r`\text{texel}`, tx(t, "oglShadow_wTexel", "the width one shadow-map texel covers: the light box is 20 units wide (ortho −10…10) split into the map's columns")],
          [r`\Delta`, tx(t, "oglShadow_wDelta", "how much deeper the surface is half a texel away from the texel's centre, where the depth was stored")],
          [r`24`, tx(t, "oglShadow_w24", "the light box's depth range, far − near = 25 − 1: dividing by it turns world units into the 0–1 depth the map stores")],
        ]}
        compute={acneNumbers(t)}
        note={tx(t, "oglShadow_liveNote", "With the chapter's 2048 map the constants are generous: even at 89° the bias beats the error. Drop to 256 and steep surfaces get acne again. The last line is the price: a caster closer than that gap to the surface below it no longer counts, which shows as peter-panning. Fit the light box tighter, and both numbers shrink.")} />

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
