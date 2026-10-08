// src/lib/tracks/opengl/chapters/lighting-basics/materials.tsx
"use client";

// Materials (explanation pass 2026-09-30): the Phong material equation with
// every symbol; what each term models physically; shininess as the width of
// the highlight (half-intensity angles); one fragment worked by hand
// (FragmentProbe figure); struct uniforms and how they are set; metals vs
// plastics; the classic material table (Materials figure); energy and
// clipping; mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { MaterialsFigure } from "@/components/lesson/figures/lighting/MaterialsFigure";
import { FragmentProbeFigure } from "@/components/lesson/figures/lighting/FragmentProbeFigure";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";

const r = String.raw;

// ═════════════════════════════════════════════════════════════════════════════
// 3. Materials
// ═════════════════════════════════════════════════════════════════════════════

export function MaterialsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglMtl_intro",
          "Steel and wood under the same lamp do not look alike: one throws back a tight white highlight, the other barely shines. A material gathers everything that makes a surface respond to light into one place, so the shader can treat every object the same way.")}
      </Lead>

      <Goals t={t} id="oglMtl" items={[
        "Describe a surface with three colours and a shininess value.",
        "Work out the colour of one fragment by hand.",
        "Pass a material to the shader as a struct.",
        "Make metals and plastics look different.",
      ]} />

      <H2>{tx(t, "oglMtl_eqTitle", "Three colours and a number")}</H2>
      <p>
        {tx(t, "oglMtl_eqBody",
          "In the previous chapter the strengths were plain numbers and the object had one colour. Give each term its own RGB colour and every channel reflects each kind of light differently — that is all a Phong material is:")}
      </p>
      <Equation label={tx(t, "oglMtl_eqLabel", "Phong with a material")}
        where={[
          [r`\mathbf{k}_a, \mathbf{k}_d, \mathbf{k}_s`, tx(t, "oglMtl_wK", "material colours for each term (vec3)")],
          [r`\mathbf{L}_a, \mathbf{L}_d, \mathbf{L}_s`, tx(t, "oglMtl_wL", "light intensities for each term (vec3)")],
          [r`\vN, \vL, \vV, \vR`, tx(t, "oglMtl_wVecs", "unit vectors at the fragment: the normal, toward the light, toward the eye, and L mirrored about N")],
          [r`\max(0, \cdot)`, tx(t, "oglMtl_wMax", "a surface facing away from the light gets no direct light, instead of a negative amount")],
          [r`\alpha`, tx(t, "oglMtl_wA", "material shininess")],
        ]}>
        {r`\mathbf{c} \;=\; \mathbf{k}_a \odot \mathbf{L}_a \;+\; \mathbf{k}_d \odot \mathbf{L}_d \max(0, \dotp{\vN}{\vL}) \;+\; \mathbf{k}_s \odot \mathbf{L}_s \max(0, \dotp{\vR}{\vV})^{\alpha}`}
      </Equation>

      <H3>{tx(t, "oglMtl_termsTitle", "What each number stands for")}</H3>
      <LessonTable
        headers={[tx(t, "oglMtl_tTerm", "Term"), tx(t, "oglMtl_tModels", "What it imitates"), tx(t, "oglMtl_tTypical", "Typical values")]}
        rows={[
          [tx(t, "oglMtl_ta", "ambient kₐ"), tx(t, "oglMtl_taM", "light that has bounced around the room and arrives from everywhere: a crude stand-in for global illumination, so shadowed sides are not pitch black"), tx(t, "oglMtl_taT", "usually equal to kd; the light's Lₐ keeps it dim (0.1–0.2)")],
          [tx(t, "oglMtl_td", "diffuse kd"), tx(t, "oglMtl_tdM", "light that enters the surface, scatters among pigments and leaves in all directions, coloured by them: the object's own colour"), tx(t, "oglMtl_tdT", "the albedo: coral (1, 0.5, 0.31)")],
          [tx(t, "oglMtl_ts", "specular ks"), tx(t, "oglMtl_tsM", "light mirrored straight off the outer surface, before it can enter: the highlight"), tx(t, "oglMtl_tsT", "grey for paint, plastic, wood (0.04–0.5); coloured and strong for metals")],
          [tx(t, "oglMtl_tAlpha", "shininess α"), tx(t, "oglMtl_tAlphaM", "how smooth the surface is: a smooth one mirrors light into a narrow cone, a rough one spreads it"), tx(t, "oglMtl_tAlphaT", "2–10 rough, 32 plastic, 128–256 polished")],
        ]}
      />
      <H3>{tx(t, "oglMtl_shinTitle", "Shininess is the width of the highlight")}</H3>
      <p>
        {tx(t, "oglMtl_shinBody",
          "R·V is the cosine of the angle θ between the mirror direction and the eye. Raising it to the power α keeps values near 1 near 1 and crushes everything else, so a large α makes a small, sharp highlight. A useful measure is the angle at which the highlight has dropped to half its peak: cos θ = 0.5^(1/α).")}
      </p>
      <LessonTable
        headers={["α", "2", "8", "32", "128", "256"]}
        rows={[[tx(t, "oglMtl_tHalf", "half-intensity angle"), "45°", "23.5°", "11.9°", "6.0°", "4.2°"]]}
      />
      <p>
        {tx(t, "oglMtl_shinRead",
          "Each factor of 4 in α halves the size of the highlight. Note that α does not change how bright the peak is: at θ = 0, 1^α = 1 for every α. A sharper highlight therefore carries less total light, which Phong does not compensate for; physically based shading (PBR section) does.")}
      </p>

      <H2>{tx(t, "oglMtl_workedTitle", "Worked example: one fragment")}</H2>
      <p>
        {tx(t, "oglMtl_workedIntro",
          "The coral material kₐ = kd = (1, 0.5, 0.31), ks = (0.5, 0.5, 0.5), α = 32, under the light used below: Lₐ = 0.2, Ld = 0.5, Ls = 1.0 (white). Take a fragment where N·L = 0.8 and R·V = 0.95:")}
      </p>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "oglMtl_w1", "Ambient: 0.2 · (1, 0.5, 0.31) = (0.2, 0.1, 0.062).")}</li>
        <li>{tx(t, "oglMtl_w2", "Diffuse: 0.5 · 0.8 · (1, 0.5, 0.31) = 0.4 · (1, 0.5, 0.31) = (0.4, 0.2, 0.124).")}</li>
        <li>{tx(t, "oglMtl_w3", "Specular factor: 0.95³² = e^(32 · ln 0.95) = e^(−1.64) = 0.194. Specular: 1.0 · 0.5 · 0.194 = 0.097 in every channel, because ks is grey.")}</li>
        <li>{tx(t, "oglMtl_w4", "Sum: (0.2 + 0.4 + 0.097, 0.1 + 0.2 + 0.097, 0.062 + 0.124 + 0.097) = (0.697, 0.397, 0.283): coral with a whitish lift from the highlight. Move about 8° further from the highlight (R·V = 0.9) and the specular factor collapses to 0.9³² = 0.034.")}</li>
      </ol>
      <FragmentProbeFigure t={t} />

      <H2>{tx(t, "oglMtl_codeTitle", "In the shader")}</H2>
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
        {tx(t, "oglMtl_uniforms",
          "Struct uniforms are set member by member, with the member name after a dot. There is no way to upload the whole struct at once with glUniform — that is one of the things Uniform Buffer Objects fix later.")}
      </p>
      <CodeBlock lang="cpp" filename="set_material.cpp" t={t}>{`shader.setVec3 ("material.ambient",   1.0f, 0.5f, 0.31f);
shader.setVec3 ("material.diffuse",   1.0f, 0.5f, 0.31f);
shader.setVec3 ("material.specular",  0.5f, 0.5f, 0.5f);
shader.setFloat("material.shininess", 32.0f);

shader.setVec3("light.ambient",  0.2f, 0.2f, 0.2f);
shader.setVec3("light.diffuse",  0.5f, 0.5f, 0.5f);
shader.setVec3("light.specular", 1.0f, 1.0f, 1.0f);`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "oglMtl_tChoice", "Choice"), tx(t, "oglMtl_tReason", "Reason")]}
        rows={[
          [tx(t, "oglMtl_c1", "the light has three intensities too"), tx(t, "oglMtl_c1b", "a real lamp has one colour, but splitting it lets you dim the fake ambient term separately from the direct light; later chapters collapse them back to one colour plus a strength.")],
          [tx(t, "oglMtl_c2", "diff and spec computed once, outside the terms"), tx(t, "oglMtl_c2b", "they depend only on geometry (N, L, V), not on colour, so each is one float reused for all three channels.")],
          [tx(t, "oglMtl_c3", "\"material.ambient\" as the uniform name"), tx(t, "oglMtl_c3b", "each struct member is its own uniform with its own location; glGetUniformLocation needs the full dotted name.")],
        ]}
      />

      <H2>{tx(t, "oglMtl_metalTitle", "Metals and plastics")}</H2>
      <p>
        {tx(t, "oglMtl_metalBody",
          "The specular colour is what separates the two families. A plastic or painted surface is clear varnish over coloured pigment: the varnish mirrors a little of the light with its colour unchanged (white highlight), the pigment beneath gives the body colour. A metal has no pigment underneath: light that enters is absorbed at once, so there is almost no diffuse term, and the mirror reflection itself is tinted (gold reflects red and green more than blue). So metals have a dark diffuse, a strong coloured specular and a tight highlight; plastics have a strong diffuse and a weak white specular.")}
      </p>

      <H2>{tx(t, "oglMtl_tableTitle", "Real materials")}</H2>
      <p>
        {tx(t, "oglMtl_tableBody",
          "Guessing these values is hard, so graphics programmers have long borrowed a table of measured-looking materials that shipped with the original OpenGL and VRML. Here it is, rendered with the exact formula above:")}
      </p>

      <MaterialsFigure t={t} />

      <Callout type="info" t={t}>
        {tx(t, "oglMtl_tableNote",
          "The table assumes a light whose ambient, diffuse and specular are all 1.0. With the dimmer light values above, the materials come out darker than intended — set the light to vec3(1.0) to reproduce them.")}
      </Callout>

      <H3>{tx(t, "oglMtl_energyTitle", "When the sum passes 1")}</H3>
      <p>
        {tx(t, "oglMtl_energyBody",
          "Nothing in the Phong formula stops the three terms from adding up to more than 1. Gold under a light of 1.0 at the peak of its highlight gives about 0.25 + 0.75 + 0.63 = 1.63 in red. An 8-bit framebuffer stores only 0–1, so the value is clipped to 1 and the highlight turns into a flat patch. A real surface can never send back more light than arrives; a rule of thumb for Phong is to keep kd + ks ≤ 1 per channel. Physically based materials (PBR section) enforce this by construction.")}
      </p>

      <H2>{tx(t, "oglMtl_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "oglMtl_tMistake", "Mistake"), tx(t, "oglMtl_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "oglMtl_e1", "A typo in a member name (\"material.shinyness\")"), tx(t, "oglMtl_e1b", "glGetUniformLocation returns −1, the set call silently does nothing and the member stays 0. Check for −1 once, when the shader is loaded.")],
          [tx(t, "oglMtl_e2", "Shininess 0"), tx(t, "oglMtl_e2b", "x⁰ = 1 for every x, so the \"highlight\" covers the whole lit side (and pow(0, 0) is undefined in GLSL). Keep α ≥ 1.")],
          [tx(t, "oglMtl_e3", "Using the table's shininess (0–1) directly"), tx(t, "oglMtl_e3b", "α = 0.4 is almost flat. The table stores α / 128: multiply by 128.")],
          [tx(t, "oglMtl_e4", "Bright white specular on every material"), tx(t, "oglMtl_e4b", "everything looks like wet plastic. Wood and cloth need ks around 0.05 and a low α.")],
          [tx(t, "oglMtl_e5", "Ambient as strong as diffuse"), tx(t, "oglMtl_e5b", "the object looks flat, because the shadowed side is nearly as bright as the lit one. Keep Lₐ small.")],
          [tx(t, "oglMtl_e6", "Specular added on the unlit side"), tx(t, "oglMtl_e6b", "R can still point toward the eye when N·L < 0, giving highlights on the dark side. Set spec = 0 when N·L ≤ 0.")],
        ]}
      />

      <KeyIdeas t={t} id="oglMtl" items={[
        "A Phong material is three colours (ambient, diffuse, specular) plus a shininess.",
        "The light has its own three intensities; each term multiplies light by material.",
        "Metals have coloured, tight highlights; plastics white, broad ones.",
        "Ambient fakes bounced light, diffuse is the body colour, specular is the mirror-like highlight.",
        "Shininess sets the highlight's width, not its peak: the half-intensity angle shrinks from 45° at α = 2 to 6° at α = 128.",
        "The three terms can add up past 1 and get clipped; keep kd + ks ≤ 1 for believable materials.",
      ]} />
    </Article>
  );
}
