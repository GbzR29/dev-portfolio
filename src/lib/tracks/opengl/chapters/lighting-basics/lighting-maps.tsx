// src/lib/tracks/opengl/chapters/lighting-basics/lighting-maps.tsx
"use client";

// Lighting Maps (explanation pass 2026-09-30): from per-object to per-texel
// material values; diffuse maps (and why ambient reuses them, sRGB);
// specular maps (greyscale, linear data); two texels worked by hand
// (TexelProbe figure, LightingMaps figure); emission maps and where they are
// added; other maps to come and channel packing; the shader, the texture
// units and the 8-float vertex layout with its choices; mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { LightingMapsFigure } from "@/components/lesson/figures/lighting/LightingMapsFigure";
import { TexelProbeFigure } from "@/components/lesson/figures/lighting/TexelProbeFigure";
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

      <H2>{tx(t, "oglMaps_perTexelTitle", "From one value per object to one per texel")}</H2>
      <p>
        {tx(t, "oglMaps_perTexelBody",
          "The Materials chapter set kd, ks and α once, as uniforms, for the whole mesh. Every fragment of the crate therefore got the same material. But each fragment also carries texture coordinates (u, v), interpolated from its triangle's vertices, which say where on the crate's image it lies. If the material is stored in an image instead of a uniform, each fragment can look up its own material at its own (u, v). The lighting formula does not change at all; only where its inputs come from:")}
      </p>
      <Equation label={tx(t, "oglMaps_eqLookup", "A material value becomes a texture lookup")}
        where={[
          [r`(u, v)`, tx(t, "oglMaps_wUv", "the fragment's texture coordinates, interpolated from the vertices; 0 to 1 across the image")],
          [r`\texttt{texture}(\ldots)`, tx(t, "oglMaps_wTex", "GLSL's sampling function: fetches (and filters) the texel colour at uv")],
        ]}>
        {r`\mathbf{k}_d \;\longrightarrow\; \mathbf{k}_d(u, v) = \texttt{texture}(\text{diffuseMap},\, uv)`}
      </Equation>

      <H2>{tx(t, "oglMaps_diffTitle", "Diffuse maps")}</H2>
      <p>
        {tx(t, "oglMaps_diffBody",
          "A diffuse map is just the texture from the Textures chapter, now used as the material's diffuse colour. The ambient colour is almost always the same as the diffuse one, so it is dropped and read from the same map:")}
      </p>
      <p>
        {tx(t, "oglMaps_diffWhy",
          "Why may ambient reuse the diffuse map? Both terms describe light that enters the surface and is scattered back by its pigments; they differ only in where the light came from (bounced from the room, or straight from the lamp). The pigment that colours one colours the other. A diffuse map is also called an albedo map: albedo is the fraction of light a surface scatters back, per channel.")}
      </p>

      <H2>{tx(t, "oglMaps_specTitle", "Specular maps")}</H2>
      <p>
        {tx(t, "oglMaps_specBody",
          "A specular map stores how strongly each texel reflects the highlight. It is usually greyscale: white where the surface is polished metal, black where it is wood. Multiplying the specular term by it switches highlights off exactly where they do not belong.")}
      </p>
      <p>
        {tx(t, "oglMaps_specColour",
          "A greyscale map fits dielectrics (wood, paint, plastic), whose highlights are the colour of the light. A coloured specular map lets metallic parts tint their highlights, like the gold in the previous chapter. Either way, the map holds data, not a picture: a value of 0.5 must mean exactly half. That matters for the next point.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "oglMaps_srgb", "Image files store colours gamma-encoded (sRGB), because that is what looks right on a screen. For the diffuse map, which is a colour, create the texture as GL_SRGB8_ALPHA8 so that sampling converts it back to linear values for the lighting maths. For a specular map (and later normal, roughness and height maps), which hold plain numbers, use GL_RGBA8: decoding them as sRGB would turn 0.5 into 0.21 and dim every highlight. The Gamma Correction chapter explains the conversion.")}
      </Callout>

      <H3>{tx(t, "oglMaps_workedTitle", "Worked example: a steel texel and a wood texel")}</H3>
      <p>
        {tx(t, "oglMaps_workedIntro",
          "Same light for both (Lₐ = 0.2, Ld = 0.5, Ls = 1.0, white), same geometry (N·L = 0.8, specular factor (R·V)^α = 0.35). Only the map values differ:")}
      </p>
      <LessonTable
        headers={["", tx(t, "oglMaps_tSteel", "steel rim"), tx(t, "oglMaps_tWood", "wood plank")]}
        rows={[
          [tx(t, "oglMaps_rD", "diffuse map D"), "(0.42, 0.43, 0.46)", "(0.62, 0.40, 0.20)"],
          [tx(t, "oglMaps_rS", "specular map S"), "0.80", "0.05"],
          [tx(t, "oglMaps_rA", "ambient 0.2 · D"), "(0.084, 0.086, 0.092)", "(0.124, 0.080, 0.040)"],
          [tx(t, "oglMaps_rDif", "diffuse 0.5 · 0.8 · D"), "(0.168, 0.172, 0.184)", "(0.248, 0.160, 0.080)"],
          [tx(t, "oglMaps_rSpec", "specular 1.0 · S · 0.35"), "0.280", "0.018"],
          [tx(t, "oglMaps_rSum", "sum"), "(0.532, 0.538, 0.556)", "(0.390, 0.258, 0.138)"],
        ]}
      />
      <p>
        {tx(t, "oglMaps_workedRead",
          "The wood is actually the brighter of the two before the highlight (0.372 against 0.252 in red), yet the steel ends up brighter and almost white, because more than half of its final colour is highlight. That is the whole visual difference between the two materials, and it comes entirely from one grey value in the specular map.")}
      </p>

      <TexelProbeFigure t={t} />
      <LightingMapsFigure t={t} />

      <H2>{tx(t, "oglMaps_emTitle", "Emission maps")}</H2>
      <p>
        {tx(t, "oglMaps_emBody",
          "An emission map holds light the surface gives off by itself — screens, lava, glowing runes. It is added after all lighting, untouched by the light's direction, so emissive parts stay bright even in shadow.")}
      </p>
      <Equation label={tx(t, "oglMaps_eqLabel", "Phong with lighting maps")}
        where={[
          [r`\mathbf{D}(uv)`, tx(t, "oglMaps_wD", "the diffuse map's colour at the fragment, used for both ambient and diffuse")],
          [r`\mathbf{S}(uv)`, tx(t, "oglMaps_wS", "the specular map's value (or colour) at the fragment")],
          [r`\mathbf{E}(uv)`, tx(t, "oglMaps_wE", "the emission map's colour: added as is, never multiplied by any light")],
        ]}>
        {r`\mathbf{c} = \mathbf{L}_a \odot \mathbf{D}(uv) + \mathbf{L}_d \odot \mathbf{D}(uv) \max(0,\dotp{\vN}{\vL}) + \mathbf{L}_s \odot \mathbf{S}(uv) \max(0,\dotp{\vR}{\vV})^{\alpha} + \mathbf{E}(uv)`}
      </Equation>
      <p>
        {tx(t, "oglMaps_emNote",
          "Emission makes the surface look lit, but it does not light anything else: the floor next to a glowing screen stays dark unless you also place a light there (or use the global illumination techniques of later chapters). With HDR rendering, emission values above 1 are what makes things bloom.")}
      </p>

      <H3>{tx(t, "oglMaps_moreTitle", "Other maps, later")}</H3>
      <LessonTable
        headers={[tx(t, "oglMaps_tMap", "Map"), tx(t, "oglMaps_tStores", "Stores"), tx(t, "oglMaps_tWhere", "Chapter")]}
        rows={[
          [tx(t, "oglMaps_m1", "normal map"), tx(t, "oglMaps_m1s", "a direction per texel, to fake bumps and grooves in the lighting"), tx(t, "oglMaps_m1w", "Normal Mapping")],
          [tx(t, "oglMaps_m2", "height / displacement map"), tx(t, "oglMaps_m2s", "how far each texel sits above the surface"), tx(t, "oglMaps_m2w", "Parallax Mapping, Terrain")],
          [tx(t, "oglMaps_m3", "roughness, metallic"), tx(t, "oglMaps_m3s", "the physically based replacements for shininess and specular colour"), tx(t, "oglMaps_m3w", "PBR")],
          [tx(t, "oglMaps_m4", "ambient occlusion"), tx(t, "oglMaps_m4s", "how much of the surroundings each texel can see: darkens creases"), tx(t, "oglMaps_m4w", "SSAO, PBR")],
        ]}
      />
      <p>
        {tx(t, "oglMaps_packing",
          "Greyscale maps use one channel, so engines often pack three of them into one RGB texture (for example occlusion in R, roughness in G, metallic in B, the \"ORM\" layout): one texture fetch instead of three, and a third of the memory.")}
      </p>

      <H2>{tx(t, "oglMaps_codeTitle", "The shader and the texture units")}</H2>
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
glActiveTexture(GL_TEXTURE2); glBindTexture(GL_TEXTURE_2D, emissionMap);

// Vertex layout: position (3) + normal (3) + uv (2) = 8 floats per vertex
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 8 * sizeof(float), (void*)0);
glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 8 * sizeof(float), (void*)(3 * sizeof(float)));
glVertexAttribPointer(2, 2, GL_FLOAT, GL_FALSE, 8 * sizeof(float), (void*)(6 * sizeof(float)));`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "oglMaps_tChoice", "Choice"), tx(t, "oglMaps_tReason", "Reason")]}
        rows={[
          [tx(t, "oglMaps_c1", "sampler = unit number, set once"), tx(t, "oglMaps_c1b", "a sampler uniform does not hold a texture; it names a texture unit. Which texture sits in that unit is decided by glActiveTexture + glBindTexture, which can change every draw.")],
          [tx(t, "oglMaps_c2", "setInt after glUseProgram, once"), tx(t, "oglMaps_c2b", "the unit numbers never change, so they are set when the shader is created, not every frame.")],
          [tx(t, "oglMaps_c3", "stride 8 floats, offsets 0, 3 and 6"), tx(t, "oglMaps_c3b", "each vertex is now position, normal and uv back to back; every attribute's stride and offset must be updated together.")],
          [tx(t, "oglMaps_c4", ".rgb of the specular sample"), tx(t, "oglMaps_c4b", "works for greyscale and coloured maps alike; a greyscale map simply has equal channels.")],
        ]}
      />

      <Callout type="warn" t={t}>
        {tx(t, "oglMaps_warn",
          "A struct containing a sampler can only ever be a uniform — never a vertex input, output or local variable. And do not forget the texture coordinates: the vertex layout grows to 8 floats (position, normal, uv), so the stride of every attribute changes.")}
      </Callout>

      <H2>{tx(t, "oglMaps_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "oglMaps_tMistake", "Mistake"), tx(t, "oglMaps_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "oglMaps_e1", "Forgetting to set the sampler uniforms"), tx(t, "oglMaps_e1b", "every sampler defaults to unit 0, so all three maps read the diffuse texture: highlights and glow take the wood's colour. Set each to its own unit.")],
          [tx(t, "oglMaps_e2", "glBindTexture without glActiveTexture first"), tx(t, "oglMaps_e2b", "each bind replaces the texture in whatever unit is active, so only the last map survives. Select the unit, then bind.")],
          [tx(t, "oglMaps_e3", "Specular map loaded as sRGB"), tx(t, "oglMaps_e3b", "mid-grey values shrink (0.5 becomes 0.21) and highlights are too weak. Load data maps as linear formats.")],
          [tx(t, "oglMaps_e4", "Emission multiplied by the light or the attenuation"), tx(t, "oglMaps_e4b", "the glow fades in shadow and with distance from the lamp. Add it after the lighting, on its own.")],
          [tx(t, "oglMaps_e5", "Old stride of 6 floats after adding uv"), tx(t, "oglMaps_e5b", "every attribute reads the wrong floats: a scrambled, stretched mesh. Stride 8, uv at offset 6.")],
          [tx(t, "oglMaps_e6", "Upside-down textures"), tx(t, "oglMaps_e6b", "image files start at the top row, OpenGL's v = 0 is the bottom. Flip on load (stbi_set_flip_vertically_on_load) or flip v.")],
        ]}
      />

      <KeyIdeas t={t} id="oglMaps" items={[
        "Lighting maps turn per-object material values into per-texel ones.",
        "Diffuse map = colour (also used for ambient); specular map = where it shines.",
        "Emission is added after lighting, so it glows regardless of the light.",
        "The lighting formula is unchanged; each input is now texture(map, uv) instead of a uniform.",
        "Colour maps are sRGB, data maps (specular, normal, roughness) are linear: pick the texture format to match.",
        "A sampler uniform names a texture unit; glActiveTexture + glBindTexture put a texture in that unit.",
      ]} />
    </Article>
  );
}
