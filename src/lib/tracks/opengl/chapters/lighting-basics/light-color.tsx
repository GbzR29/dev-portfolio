// src/lib/tracks/opengl/chapters/lighting-basics/light-color.tsx
"use client";

import { CodeBlock, Callout, H2 } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { ColorMixFigure } from "@/components/lesson/figures/lighting/ColorMixFigure";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";

const r = String.raw;

// ═════════════════════════════════════════════════════════════════════════════
// 1. Light & Color
// ═════════════════════════════════════════════════════════════════════════════

export function LightColorContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglColor_intro",
          "Before lighting a scene we need to agree on what colour even is. An object is not \"red\" by itself — it is red because, of all the light that hits it, it throws back mostly the red part and swallows the rest. Computer graphics models that with one multiplication.")}
      </Lead>

      <H2>{tx(t, "oglColor_mulTitle", "Light times surface")}</H2>
      <p>
        {tx(t, "oglColor_mulBody",
          "We describe both the light and the surface with three numbers between 0 and 1: how much red, green and blue. For the light that is how much it emits; for the surface, the fraction of each channel it reflects. The colour that reaches the eye is the product, channel by channel:")}
      </p>

      <Equation label={tx(t, "oglColor_eqLabel", "Reflected colour")}
        where={[
          [r`\mathbf{L}`, tx(t, "oglColor_wL", "light colour (what the source emits)")],
          [r`\mathbf{S}`, tx(t, "oglColor_wS", "surface colour (fraction of each channel it reflects)")],
          [r`\odot`, tx(t, "oglColor_wOdot", "component-wise product — what vec3 * vec3 does in GLSL")],
        ]}>
        {r`\mathbf{c} \;=\; \mathbf{L} \odot \mathbf{S} \;=\; \begin{pmatrix} \red{L_r S_r} \\ \green{L_g S_g} \\ \blue{L_b S_b} \end{pmatrix}`}
      </Equation>

      <p>
        {tx(t, "oglColor_mulTry",
          "Try it below. A coral surface under white light looks coral. Under a pure green light it turns almost black: it reflects only half of the green channel and there is no red or blue left in the light for it to reflect.")}
      </p>

      <ColorMixFigure t={t} />

      <CodeBlock lang="glsl" filename="color.frag" t={t}>{`#version 460 core
out vec4 FragColor;

uniform vec3 objectColor;   // e.g. (1.0, 0.5, 0.31) — coral
uniform vec3 lightColor;    // e.g. (1.0, 1.0, 1.0)  — white

void main() {
    FragColor = vec4(lightColor * objectColor, 1.0);   // component-wise
}`}</CodeBlock>

      <H2>{tx(t, "oglColor_sceneTitle", "A scene to light: object and lamp")}</H2>
      <p>
        {tx(t, "oglColor_sceneBody",
          "The next chapters light a cube with a lamp. The lamp is also drawn — a small white cube — but it must not be affected by the lighting maths, or it would shade itself. So it gets its own trivial shader and its own VAO, while sharing the same vertex buffer.")}
      </p>

      <CodeBlock lang="glsl" filename="lamp.frag" t={t}>{`#version 460 core
out vec4 FragColor;
void main() { FragColor = vec4(1.0); }   // always full white, never lit`}</CodeBlock>

      <CodeBlock lang="cpp" filename="scene_setup.cpp" t={t}>{`// One VBO with the cube, two VAOs that read it
glBindVertexArray(cubeVAO);
glBindBuffer(GL_ARRAY_BUFFER, VBO);
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)0);
glEnableVertexAttribArray(0);

glBindVertexArray(lampVAO);
glBindBuffer(GL_ARRAY_BUFFER, VBO);                 // same data
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)0);
glEnableVertexAttribArray(0);

// The lamp is the same cube, moved to the light and shrunk
glm::vec3 lightPos(1.2f, 1.0f, 2.0f);
glm::mat4 lampModel = glm::translate(glm::mat4(1.0f), lightPos);
lampModel = glm::scale(lampModel, glm::vec3(0.2f));`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "oglColor_linearNote",
          "These numbers are linear intensities, not the values a colour picker shows. Multiplying them is physically meaningful only in linear space — a subtlety that returns in the Gamma Correction chapter, where it explains why naive lighting looks too dark.")}
      </Callout>

      <KeyIdeas t={t} id="oglColor" items={[
        "The colour we see is light × surface, one channel at a time.",
        "A surface can only reflect channels the light actually contains.",
        "Light sources get their own simple shader so they are never lit themselves.",
      ]} />
    </Article>
  );
}
