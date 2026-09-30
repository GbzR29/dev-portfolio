// src/lib/tracks/opengl/chapters/lighting-advanced/point-shadows.tsx
"use client";

// Point shadows (explanation pass 2026-09-30): why six 90° views tile the
// sphere; the projection and the six view matrices with their odd up vectors;
// the cube-map texture setup; storing linear distance; how a direction picks a
// face; one fragment and its occluder worked by hand (and why the bias saves
// the occluder itself); PCF in a cube map; cost and memory; choices in the
// code; mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
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
      <p>
        {tx(t, "oglPShadow_whyNinety",
          "Why exactly 90°? Picture the light at the centre of a cube. Each face of the cube, seen from the centre, spans 45° to either side of the axis through it, 90° in total, both horizontally and vertically, so a square 90° view sees one face exactly. A wider angle would overlap the neighbours and waste pixels; a narrower one would leave cracks where no face looks and light would leak through.")}
      </p>
      <Equation label={tx(t, "oglPShadow_projLabel", "One projection, six views")}
        where={[
          [r`90^\circ,\ 1`, tx(t, "oglPShadow_wFov", "the vertical field of view and the aspect ratio (square), so every face sees exactly one face of the cube")],
          [r`n, f`, tx(t, "oglPShadow_wNF", "near and far planes: n small but not tiny (0.1–1) for depth precision, f the farthest distance the light should cast shadows")],
          [r`V_i`, tx(t, "oglPShadow_wVi", "lookAt(lightPos, lightPos + axis_i, up_i) for the six cube-map faces")],
          [r`M_i`, tx(t, "oglPShadow_wMi", "the light-space matrix for face i, used exactly like the single matrix of a directional shadow map")],
        ]}>
        {r`P = \text{perspective}(90^\circ,\; 1,\; n,\; f) \qquad M_i = P\,V_i,\quad i = 0\ldots5`}
      </Equation>

      <H3>{tx(t, "oglPShadow_texTitle", "The depth cube map")}</H3>
      <CodeBlock lang="cpp" filename="depth_cubemap.cpp" t={t}>{`GLuint depthCubemap;
glGenTextures(1, &depthCubemap);
glBindTexture(GL_TEXTURE_CUBE_MAP, depthCubemap);
for (int i = 0; i < 6; ++i)                       // one square depth image per face
    glTexImage2D(GL_TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, GL_DEPTH_COMPONENT32F,
                 SHADOW_SIZE, SHADOW_SIZE, 0, GL_DEPTH_COMPONENT, GL_FLOAT, nullptr);
glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_R, GL_CLAMP_TO_EDGE);

glBindFramebuffer(GL_FRAMEBUFFER, depthCubeFBO);
glDrawBuffer(GL_NONE);                            // depth only: no colour attachment
glReadBuffer(GL_NONE);`}</CodeBlock>
      <p>
        {tx(t, "oglPShadow_texBody",
          "The six face targets are consecutive enum values (POSITIVE_X, NEGATIVE_X, POSITIVE_Y, NEGATIVE_Y, POSITIVE_Z, NEGATIVE_Z), so adding i walks through them in that order. The render loop below uses the same order for its directions. GL_NEAREST because the lighting pass compares distances; averaging stored distances from several texels would produce a distance nothing in the scene actually has.")}
      </p>
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
      <p>
        {tx(t, "oglPShadow_upsBody",
          "The up vectors look arbitrary, and in a sense they are: they come from the cube-map convention, inherited from RenderMan, which defines how each face image is oriented when viewed from inside the cube. For the four side faces the image's up is −y; the +y face has +z up and the −y face −z. With any other up vector the depth images would be rotated inside their faces, and every shadow would land in the wrong place, typically rotated by 90° or 180° on some walls and right on others.")}
      </p>

      <H2>{tx(t, "oglPShadow_linTitle", "Store distance, not depth")}</H2>
      <p>
        {tx(t, "oglPShadow_linBody",
          "Ordinary depth is non-linear and belongs to one face's projection, which makes comparing across faces awkward. Point-shadow shaders write their own value instead: the straight-line distance to the light, divided by the far plane. The lighting pass then needs only one subtraction and a length.")}
      </p>
      <Equation label={tx(t, "oglPShadow_testLabel", "The test")}
        where={[
          [r`\mathbf{p}, \mathbf{p}_{\text{light}}`, tx(t, "oglPShadow_wP", "the fragment's and the light's world positions")],
          [r`f`, tx(t, "oglPShadow_wF", "the far plane; dividing by it maps distances into [0, 1], the range a depth texture stores")],
          [r`b`, tx(t, "oglPShadow_wB", "the bias: a small distance that stops a surface from shadowing itself because of rounding")],
          [r`\texttt{texture}(\ldots).r`, tx(t, "oglPShadow_wTex", "the stored (distance / f) of the closest surface in that direction")],
        ]}>
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
      <p>
        {tx(t, "oglPShadow_lookupBody",
          "The lookup direction does not need to be normalised. The GPU picks the face from the component with the largest absolute value (its sign chooses + or −), then divides the other two by it to find the texel on that face. So (3, −4, 2) reads the −Y face, because |−4| is the largest, at the point (3/4, 2/4) of that face (before the face's own orientation is applied). Scaling the vector does not change which texel it hits.")}
      </p>

      <H3>{tx(t, "oglPShadow_workedTitle", "Worked example: one fragment and its occluder")}</H3>
      <p>
        {tx(t, "oglPShadow_workedIntro",
          "A light at (0, 4, 0), far plane 25, bias 0.15. A floor fragment at (3, 0, 2), and a box whose top surface is at height 2, sitting between them.")}
      </p>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "oglPShadow_w1", "fragToLight = (3, 0, 2) − (0, 4, 0) = (3, −4, 2). Its length is √(9 + 16 + 4) = √29 = 5.385, and it looks up the −Y face.")}</li>
        <li>{tx(t, "oglPShadow_w2", "The ray from the light to the fragment crosses height 2 halfway down, at (1.5, 2, 1), which is on the box top. In the depth pass that point was drawn in the same direction, with distance √(1.5² + 2² + 1²) = 2.693, stored as 2.693 / 25 = 0.1077.")}</li>
        <li>{tx(t, "oglPShadow_w3", "Lighting pass for the floor fragment: closest = 0.1077 · 25 = 2.693, current = 5.385. Is 5.385 − 0.15 = 5.235 greater than 2.693? Yes: in shadow.")}</li>
        <li>{tx(t, "oglPShadow_w4", "Lighting pass for the box-top point itself: current = 2.693 and closest = 2.693, perhaps 2.694 or 2.692 after rounding. Without the bias the comparison flips randomly from texel to texel (shadow acne); with it, 2.543 > 2.693 is false, so the box top is lit.")}</li>
      </ol>

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

      <H2>{tx(t, "oglPShadow_costTitle", "What it costs")}</H2>
      <p>
        {tx(t, "oglPShadow_costBody",
          "A 1024 × 1024 face with 32-bit depth is 4 MiB, so one point light's cube map is 24 MiB, and the scene is drawn six extra times per light per frame. Eight shadowed point lights mean 48 extra scene passes. That is why games give shadows to only the few nearest or brightest lights, lower the resolution of distant ones (256² is often enough), re-render a light's cube map only when something near it moves, and cull each face's draw calls against that face's frustum, so an object only appears in the faces that can see it.")}
      </p>

      <Callout type="tip" t={t}>
        {tx(t, "oglPShadow_gsTip",
          "Six passes per light is expensive. Desktop OpenGL can do it in one pass with a geometry shader that emits each triangle six times, choosing the face through gl_Layer, or with instanced rendering and gl_Layer written in the vertex shader. That last option is not core in any OpenGL version; it needs the ARB_shader_viewport_layer_array extension, which current desktop drivers support.")}
      </Callout>

      <LessonTable
        headers={[tx(t, "oglPShadow_tChoice", "Choice"), tx(t, "oglPShadow_tReason", "Reason")]}
        rows={[
          [tx(t, "oglPShadow_c1", "gl_FragDepth = distance / far"), tx(t, "oglPShadow_c1b", "gives a value that means the same on all six faces. Writing gl_FragDepth turns off early depth testing for that pass; the alternative is to keep normal depth and write the distance to an R32F colour target.")],
          [tx(t, "oglPShadow_c2", "one projection for all faces"), tx(t, "oglPShadow_c2b", "the faces differ only in orientation, so only the view matrix changes.")],
          [tx(t, "oglPShadow_c3", "fixed bias 0.15"), tx(t, "oglPShadow_c3b", "in world units; it must exceed the rounding error and the texel size at the distances used, but a large bias detaches shadows from their casters (peter-panning).")],
          [tx(t, "oglPShadow_c4", "20 PCF offsets instead of 64"), tx(t, "oglPShadow_c4b", "offsets along the lookup direction only change the length and re-read the same texel; the 20 spread directions keep the useful ones.")],
        ]}
      />

      <H2>{tx(t, "oglPShadow_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "oglPShadow_tMistake", "Mistake"), tx(t, "oglPShadow_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "oglPShadow_e1", "Wrong up vectors"), tx(t, "oglPShadow_e1b", "shadows are correct on some walls and rotated or mirrored on others. Use the table in the code above.")],
          [tx(t, "oglPShadow_e2", "Aspect ratio from the window, not 1"), tx(t, "oglPShadow_e2b", "the faces no longer tile the sphere: gaps leak light and overlaps double shadows along the cube's edges.")],
          [tx(t, "oglPShadow_e3", "Different far planes in the two passes"), tx(t, "oglPShadow_e3b", "the stored distances are scaled by one value and read back by another, so shadows grow or shrink with the light. Pass the same farPlane uniform to both.")],
          [tx(t, "oglPShadow_e4", "Viewport not restored after the shadow pass"), tx(t, "oglPShadow_e4b", "the scene renders into a SHADOW_SIZE square in a corner of the window. Call glViewport with the window size again.")],
          [tx(t, "oglPShadow_e5", "Seams along the cube's edges"), tx(t, "oglPShadow_e5b", "PCF offsets near an edge read one face only and stop there. glEnable(GL_TEXTURE_CUBE_MAP_SEAMLESS) makes filtering cross between faces.")],
          [tx(t, "oglPShadow_e6", "The light placed inside a mesh"), tx(t, "oglPShadow_e6b", "for a bulb modelled as a small sphere, that sphere occludes everything: the whole room is dark. Draw the light's own geometry without casting shadows.")],
        ]}
      />

      <KeyIdeas t={t} id="oglPShadow" items={[
        "An omnidirectional light needs a cube map of depths: six 90° views.",
        "Write linear distance / far yourself; compare lengths in the lighting pass.",
        "The light-to-fragment vector is both the distance and the cube-map lookup direction.",
        "The face is chosen by the largest component of the lookup vector; its length does not matter.",
        "The bias keeps a surface from shadowing itself: 2.693 vs 2.693 must count as lit.",
        "One 1024² point light costs 24 MiB and six scene passes; shadow only the lights that matter.",
      ]} />
    </Article>
  );
}
