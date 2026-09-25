// src/lib/tracks/opengl/chapters/lighting-basics/lighting-maps.tsx
"use client";

import { CodeBlock, Callout, H2 } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { LightingMapsFigure } from "@/components/lesson/figures/lighting/LightingMapsFigure";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";

const r = String.raw;

// ═════════════════════════════════════════════════════════════════════════════
// 4. Lighting Maps
// ═════════════════════════════════════════════════════════════════════════════

export function LightingMapsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglMaps_intro",
          "A real crate is wood held together by steel: two materials on one object. One set of material values for the whole mesh cannot express that. The fix is to store material properties in textures — one value per texel instead of one per object.")}
      </Lead>

      <H2>{tx(t, "oglMaps_diffTitle", "Diffuse maps")}</H2>
      <p>
        {tx(t, "oglMaps_diffBody",
          "A diffuse map is just the texture from the Textures chapter, now used as the material's diffuse colour. The ambient colour is almost always the same as the diffuse one, so it is dropped and read from the same map:")}
      </p>
      <Equation>{r`\mathbf{k}_d \;\longrightarrow\; \mathbf{k}_d(u, v) = \texttt{texture}(\text{diffuseMap},\, uv)`}</Equation>

      <H2>{tx(t, "oglMaps_specTitle", "Specular maps")}</H2>
      <p>
        {tx(t, "oglMaps_specBody",
          "A specular map stores how strongly each texel reflects the highlight. It is usually greyscale: white where the surface is polished metal, black where it is wood. Multiplying the specular term by it switches highlights off exactly where they do not belong.")}
      </p>

      <LightingMapsFigure t={t} />

      <H2>{tx(t, "oglMaps_emTitle", "Emission maps")}</H2>
      <p>
        {tx(t, "oglMaps_emBody",
          "An emission map holds light the surface gives off by itself — screens, lava, glowing runes. It is added after all lighting, untouched by the light's direction, so emissive parts stay bright even in shadow.")}
      </p>
      <Equation label={tx(t, "oglMaps_eqLabel", "Phong with lighting maps")}>
        {r`\mathbf{c} = \mathbf{L}_a \odot \mathbf{D}(uv) + \mathbf{L}_d \odot \mathbf{D}(uv) \max(0,\dotp{\vN}{\vL}) + \mathbf{L}_s \odot \mathbf{S}(uv) \max(0,\dotp{\vR}{\vV})^{\alpha} + \mathbf{E}(uv)`}
      </Equation>

      <CodeBlock lang="glsl" filename="maps.frag" t={t}>{`struct Material {
    sampler2D diffuse;     // samplers can live in a struct uniform…
    sampler2D specular;
    sampler2D emission;
    float     shininess;
};
uniform Material material;
in vec2 TexCoords;

void main() {
    vec3 albedo   = texture(material.diffuse, TexCoords).rgb;
    vec3 ambient  = light.ambient  * albedo;
    vec3 diffuse  = light.diffuse  * diff * albedo;
    vec3 specular = light.specular * spec * texture(material.specular, TexCoords).rgb;
    vec3 emission = texture(material.emission, TexCoords).rgb;
    FragColor = vec4(ambient + diffuse + specular + emission, 1.0);
}`}</CodeBlock>
      <CodeBlock lang="cpp" filename="bind_maps.cpp" t={t}>{`// …but a sampler is still just the number of a texture unit
shader.setInt("material.diffuse",  0);
shader.setInt("material.specular", 1);
shader.setInt("material.emission", 2);

glActiveTexture(GL_TEXTURE0); glBindTexture(GL_TEXTURE_2D, diffuseMap);
glActiveTexture(GL_TEXTURE1); glBindTexture(GL_TEXTURE_2D, specularMap);
glActiveTexture(GL_TEXTURE2); glBindTexture(GL_TEXTURE_2D, emissionMap);`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "oglMaps_warn",
          "A struct containing a sampler can only ever be a uniform — never a vertex input, output or local variable. And do not forget the texture coordinates: the vertex layout grows to 8 floats (position, normal, uv), so the stride of every attribute changes.")}
      </Callout>

      <KeyIdeas t={t} id="oglMaps" items={[
        "Lighting maps turn per-object material values into per-texel ones.",
        "Diffuse map = colour (also used for ambient); specular map = where it shines.",
        "Emission is added after lighting, so it glows regardless of the light.",
      ]} />
    </Article>
  );
}
