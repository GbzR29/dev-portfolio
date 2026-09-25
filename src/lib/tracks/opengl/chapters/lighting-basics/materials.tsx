// src/lib/tracks/opengl/chapters/lighting-basics/materials.tsx
"use client";

import { CodeBlock, Callout, H2 } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { MaterialsFigure } from "@/components/lesson/figures/lighting/MaterialsFigure";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";

const r = String.raw;

// ═════════════════════════════════════════════════════════════════════════════
// 3. Materials
// ═════════════════════════════════════════════════════════════════════════════

export function MaterialsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglMat_intro",
          "Steel and wood under the same lamp do not look alike: one throws back a tight white highlight, the other barely shines. A material gathers everything that makes a surface respond to light into one place, so the shader can treat every object the same way.")}
      </Lead>

      <H2>{tx(t, "oglMat_eqTitle", "Three colours and a number")}</H2>
      <p>
        {tx(t, "oglMat_eqBody",
          "In the previous chapter the strengths were plain numbers and the object had one colour. Give each term its own RGB colour and every channel reflects each kind of light differently — that is all a Phong material is:")}
      </p>
      <Equation label={tx(t, "oglMat_eqLabel", "Phong with a material")}
        where={[
          [r`\mathbf{k}_a, \mathbf{k}_d, \mathbf{k}_s`, tx(t, "oglMat_wK", "material colours for each term (vec3)")],
          [r`\mathbf{L}_a, \mathbf{L}_d, \mathbf{L}_s`, tx(t, "oglMat_wL", "light intensities for each term (vec3)")],
          [r`\alpha`, tx(t, "oglMat_wA", "material shininess")],
        ]}>
        {r`\mathbf{c} \;=\; \mathbf{k}_a \odot \mathbf{L}_a \;+\; \mathbf{k}_d \odot \mathbf{L}_d \max(0, \dotp{\vN}{\vL}) \;+\; \mathbf{k}_s \odot \mathbf{L}_s \max(0, \dotp{\vR}{\vV})^{\alpha}`}
      </Equation>

      <CodeBlock lang="glsl" filename="material.frag" t={t}>{`struct Material {
    vec3  ambient;
    vec3  diffuse;
    vec3  specular;
    float shininess;
};
struct Light {
    vec3 position;
    vec3 ambient;    // usually dim   (e.g. 0.2)
    vec3 diffuse;    // the light's colour (e.g. 0.5)
    vec3 specular;   // usually full  (1.0)
};
uniform Material material;
uniform Light    light;

void main() {
    // ...norm, lightDir, viewDir as before
    vec3 ambient  = light.ambient  * material.ambient;
    vec3 diffuse  = light.diffuse  * (diff * material.diffuse);
    vec3 specular = light.specular * (spec * material.specular);
    FragColor = vec4(ambient + diffuse + specular, 1.0);
}`}</CodeBlock>

      <p>
        {tx(t, "oglMat_uniforms",
          "Struct uniforms are set member by member, with the member name after a dot. There is no way to upload the whole struct at once with glUniform — that is one of the things Uniform Buffer Objects fix later.")}
      </p>
      <CodeBlock lang="cpp" filename="set_material.cpp" t={t}>{`shader.setVec3 ("material.ambient",   1.0f, 0.5f, 0.31f);
shader.setVec3 ("material.diffuse",   1.0f, 0.5f, 0.31f);
shader.setVec3 ("material.specular",  0.5f, 0.5f, 0.5f);
shader.setFloat("material.shininess", 32.0f);

shader.setVec3("light.ambient",  0.2f, 0.2f, 0.2f);
shader.setVec3("light.diffuse",  0.5f, 0.5f, 0.5f);
shader.setVec3("light.specular", 1.0f, 1.0f, 1.0f);`}</CodeBlock>

      <H2>{tx(t, "oglMat_tableTitle", "Real materials")}</H2>
      <p>
        {tx(t, "oglMat_tableBody",
          "Guessing these values is hard, so graphics programmers have long borrowed a table of measured-looking materials that shipped with the original OpenGL and VRML. Here it is, rendered with the exact formula above:")}
      </p>

      <MaterialsFigure t={t} />

      <Callout type="info" t={t}>
        {tx(t, "oglMat_tableNote",
          "The table assumes a light whose ambient, diffuse and specular are all 1.0. With the dimmer light values above, the materials come out darker than intended — set the light to vec3(1.0) to reproduce them.")}
      </Callout>

      <KeyIdeas t={t} id="oglMat" items={[
        "A Phong material is three colours (ambient, diffuse, specular) plus a shininess.",
        "The light has its own three intensities; each term multiplies light by material.",
        "Metals have coloured, tight highlights; plastics white, broad ones.",
      ]} />
    </Article>
  );
}
