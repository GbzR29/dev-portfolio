// src/lib/tracks/opengl/chapters/lighting-advanced/point-shadows.tsx
"use client";

import { CodeBlock, Callout, H2 } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { PointShadowFigure } from "@/components/lesson/figures/advlighting/PointShadowFigure";

const r = String.raw;

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

      <H2>{tx(t, "oglPShadow_pcfTitle", "Soft edges: PCF in a cube map")}</H2>
      <p>
        {tx(t, "oglPShadow_pcfBody",
          "One lookup gives hard, jagged shadow edges, exactly as with a 2D shadow map, and the fix is the same idea: take several lookups around the sample and average the yes/no answers (percentage-closer filtering). A cube map is looked up by direction, so the neighbours are made by adding small offsets to the direction vector. The obvious 4 × 4 × 4 grid of offsets is 64 lookups, and many of them are wasted: an offset that points along fragToLight only changes the vector's length, not its direction, so it reads the same texel again. Twenty offsets pointing to the corners and edge midpoints of a cube spread out in every direction and give a similar result for a third of the cost."
        )}
      </p>
      <CodeBlock lang="glsl" filename="point_shadow_pcf.frag" t={t}>{`uniform samplerCube depthCubemap;
uniform vec3  lightPos, viewPos;
uniform float farPlane;

const vec3 offsets[20] = vec3[](
    vec3( 1,  1,  1), vec3( 1, -1,  1), vec3(-1, -1,  1), vec3(-1,  1,  1),   // cube corners
    vec3( 1,  1, -1), vec3( 1, -1, -1), vec3(-1, -1, -1), vec3(-1,  1, -1),
    vec3( 1,  1,  0), vec3( 1, -1,  0), vec3(-1, -1,  0), vec3(-1,  1,  0),   // edge midpoints
    vec3( 1,  0,  1), vec3(-1,  0,  1), vec3( 1,  0, -1), vec3(-1,  0, -1),
    vec3( 0,  1,  1), vec3( 0, -1,  1), vec3( 0, -1, -1), vec3( 0,  1, -1));

float pointShadow(vec3 fragPos) {
    vec3  fragToLight = fragPos - lightPos;
    float current     = length(fragToLight);
    float bias        = 0.15;
    // Wider filter far from the camera (soft), narrower up close (crisp)
    float radius = (1.0 + length(viewPos - fragPos) / farPlane) / 25.0;

    float shadow = 0.0;
    for (int i = 0; i < 20; ++i) {
        float closest = texture(depthCubemap, fragToLight + offsets[i] * radius).r * farPlane;
        shadow += current - bias > closest ? 1.0 : 0.0;
    }
    return shadow / 20.0;      // 0 = fully lit, 1 = fully in shadow
}`}</CodeBlock>
      <p>
        {tx(t, "oglPShadow_pcfRadius",
          "The offset is added to a vector whose length is the fragment's distance to the light, so the same radius turns the lookup by a smaller angle for fragments far from the light. The radius term itself grows from 1/25 = 0.04 next to the camera to 2/25 = 0.08 at the far plane, which softens distant shadows, where their jagged edges would be hardest to hide, and keeps close ones sharp. Both constants are tuned by eye, and so is the bias: a cube-map shadow has no single light direction to scale it by, which is why a fixed value is used."
        )}
      </p>

      <Callout type="tip" t={t}>
        {tx(t, "oglPShadow_gsTip",
          "Six passes per light is expensive. Desktop OpenGL can do it in one pass with a geometry shader that emits each triangle six times, choosing the face through gl_Layer, or with instanced rendering and gl_Layer written in the vertex shader. That last option is not core in any OpenGL version; it needs the ARB_shader_viewport_layer_array extension, which current desktop drivers support.")}
      </Callout>

      <KeyIdeas t={t} id="oglPShadow" items={[
        "An omnidirectional light needs a cube map of depths: six 90° views.",
        "Write linear distance / far yourself; compare lengths in the lighting pass.",
        "The light-to-fragment vector is both the distance and the cube-map lookup direction.",
      ]} />
    </Article>
  );
}
