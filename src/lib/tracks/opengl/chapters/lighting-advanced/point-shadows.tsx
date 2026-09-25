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
