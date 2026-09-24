// src/lib/tracks/opengl/chapters/lighting-basics.tsx
"use client";

// The "Lighting" section: Light & Color → Phong → Materials → Lighting Maps →
// Light Casters → Multiple Lights. Each chapter goes intuition → maths →
// interactive figure → code → pitfalls → key ideas.

import type { ReactNode } from "react";
import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { PhongFigure } from "@/components/lesson/figures/PhongFigure";
import { ColorMixFigure } from "@/components/lesson/figures/lighting/ColorMixFigure";
import { LambertFigure } from "@/components/lesson/figures/lighting/LambertFigure";
import { ReflectFigure } from "@/components/lesson/figures/lighting/ReflectFigure";
import { NormalMatrixFigure } from "@/components/lesson/figures/lighting/NormalMatrixFigure";
import { MaterialsFigure } from "@/components/lesson/figures/lighting/MaterialsFigure";
import { LightingMapsFigure } from "@/components/lesson/figures/lighting/LightingMapsFigure";
import { AttenuationFigure } from "@/components/lesson/figures/lighting/AttenuationFigure";
import { SpotlightFigure } from "@/components/lesson/figures/lighting/SpotlightFigure";
import { LightingSceneFigure } from "@/components/lesson/figures/lighting/LightingSceneFigure";

const r = String.raw;

/** The closing summary every lighting chapter ends with. */
function KeyIdeas({ t, id, items }: { t: TrackTranslations; id: string; items: string[] }) {
  return (
    <div className="my-8 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary-low)] p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--primary)] mb-3">
        {tx(t, "keyIdeas", "Key ideas")}
      </p>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-[var(--text-main)]">
            <span className="text-[var(--primary)] font-bold">→</span>
            <span>{tx(t, `${id}_key${i}`, it)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const Article = ({ children }: { children: ReactNode }) => (
  <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">{children}</article>
);
const Lead = ({ children }: { children: ReactNode }) => <p className="text-lg text-[var(--text-main)]">{children}</p>;

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

// ═════════════════════════════════════════════════════════════════════════════
// 2. Basic Lighting — Phong
// ═════════════════════════════════════════════════════════════════════════════

export function BasicLightingContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglPhong_intro",
          "Real light bounces around a scene countless times before reaching the eye. The Phong model skips all of that and approximates what we see with three cheap terms — ambient, diffuse and specular — each built from a few unit vectors at the point being shaded.")}
      </Lead>

      <Equation label={tx(t, "oglPhong_eqLabel", "The Phong reflection model")}
        where={[
          [r`k_a, k_d, k_s`, tx(t, "oglPhong_wK", "how much ambient, diffuse and specular light the material reflects")],
          [r`L_a, L_d, L_s`, tx(t, "oglPhong_wLight", "the light's ambient, diffuse and specular intensity")],
          [r`\vN`, tx(t, "oglPhong_wN", "surface normal")],
          [r`\vL`, tx(t, "oglPhong_wLdir", "direction from the point to the light")],
          [r`\vR`, tx(t, "oglPhong_wR", "that light direction mirrored about the normal")],
          [r`\vV`, tx(t, "oglPhong_wV", "direction from the point to the eye")],
          [r`\alpha`, tx(t, "oglPhong_wAlpha", "shininess — how tight the highlight is")],
        ]}>
        {r`I \;=\; \underbrace{k_a L_a}_{\text{ambient}} \;+\; \underbrace{k_d L_d \max(0,\, \dotp{\vN}{\vL})}_{\text{diffuse}} \;+\; \underbrace{k_s L_s \max(0,\, \dotp{\vR}{\vV})^{\alpha}}_{\text{specular}}`}
      </Equation>

      <p>{tx(t, "oglPhong_tour", "Drag the sun and the eye to see every vector and term change, then we will derive each one.")}</p>

      <PhongFigure t={t} />

      <H2>{tx(t, "oglPhong_ambTitle", "Ambient: light from everywhere")}</H2>
      <p>
        {tx(t, "oglPhong_ambBody",
          "In a real room, a surface facing away from the lamp is not black — light bounced off walls and ceiling reaches it. Simulating those bounces is global illumination and is expensive. Phong replaces it with a constant: a small fraction of the light that every point receives regardless of orientation.")}
      </p>
      <Equation>{r`I_a = k_a\, L_a \qquad (\text{e.g. } L_a = 0.1 \cdot \text{lightColor})`}</Equation>

      <H2>{tx(t, "oglPhong_diffTitle", "Diffuse: Lambert's cosine law")}</H2>
      <p>
        {tx(t, "oglPhong_diffBody",
          "A matte surface scatters light equally in all directions, so how bright it looks does not depend on where you stand — only on how much light lands on each bit of it. And that depends on the angle: a beam hitting at an angle spreads over more surface.")}
      </p>

      <LambertFigure t={t} />

      <p>
        {tx(t, "oglPhong_diffDerive",
          "Put numbers on it. A beam of cross-section A carries a power Φ. Tilted by θ from the normal, it lands on an area A / cos θ. The light per unit of surface — the irradiance E — is power over area:")}
      </p>
      <Equation label={tx(t, "oglPhong_irrLabel", "Irradiance on a tilted surface")}>
        {r`E \;=\; \frac{\Phi}{A / \cos\theta} \;=\; \frac{\Phi}{A}\cos\theta \;=\; E_0 \cos\theta`}
      </Equation>
      <p>
        {tx(t, "oglPhong_diffDot",
          "For unit vectors the dot product is exactly the cosine of the angle between them, so the shader never computes θ. Once the light goes behind the surface the cosine turns negative, which would subtract light — hence the max:")}
      </p>
      <Equation label={tx(t, "oglPhong_diffLabel", "Diffuse term")}
        where={[[r`\dotp{\vN}{\vL}`, tx(t, "oglPhong_wDot", "= |n||l| cos θ = cos θ, because both are normalized")]]}>
        {r`I_d \;=\; k_d\, L_d\, \max(0,\; \dotp{\vN}{\vL})`}
      </Equation>

      <CodeBlock lang="glsl" filename="diffuse.frag" t={t}>{`vec3 norm     = normalize(Normal);
vec3 lightDir = normalize(lightPos - FragPos);     // from the fragment TO the light
float diff    = max(dot(norm, lightDir), 0.0);
vec3 diffuse  = diff * lightColor;`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "oglPhong_normalizeWarn",
          "Normalize the normal in the fragment shader even if every vertex normal was unit length. The rasterizer interpolates it linearly between vertices, and the average of two unit vectors is shorter than 1 — skip the normalize and the middle of every triangle comes out slightly darker.")}
      </Callout>

      <H2>{tx(t, "oglPhong_nmTitle", "Moving normals: the normal matrix")}</H2>
      <p>
        {tx(t, "oglPhong_nmBody",
          "Lighting is computed in world space, so the normal has to be transformed like the vertices. The obvious choice — multiply it by the model matrix — breaks as soon as that matrix scales unevenly:")}
      </p>

      <NormalMatrixFigure t={t} />

      <p>
        {tx(t, "oglPhong_nmDerive",
          "The fix follows from the one property a normal must keep. Take any tangent t lying on the surface; the normal is perpendicular to it. After the model matrix M moves the tangent, we want a matrix G for the normal so that they are still perpendicular:")}
      </p>
      <Equation label={tx(t, "oglPhong_nmLabel", "Deriving the normal matrix")}>
        {r`\begin{aligned}
\mathbf{n}^{\mathsf T}\mathbf{t} &= 0 && \text{(perpendicular before)} \\
(G\mathbf{n})^{\mathsf T}(M\mathbf{t}) = \mathbf{n}^{\mathsf T} G^{\mathsf T} M\, \mathbf{t} &= 0 && \text{(perpendicular after)} \\
G^{\mathsf T} M = I \;\;\Longrightarrow\;\; \green{G} &= \green{(M^{-1})^{\mathsf T}}
\end{aligned}`}
      </Equation>
      <p>
        {tx(t, "oglPhong_nmTrans",
          "Only the upper-left 3×3 matters (a normal is a direction, so translation must not touch it). When M is a rotation, its inverse is its transpose and G = M — which is why the bug only shows up with non-uniform scaling.")}
      </p>
      <CodeBlock lang="cpp" filename="normal_matrix.cpp" t={t}>{`// Compute once per object on the CPU — inverse() per vertex is wasteful
glm::mat3 normalMatrix = glm::transpose(glm::inverse(glm::mat3(model)));
shader.setMat3("normalMatrix", normalMatrix);

// vertex shader
// Normal = normalMatrix * aNormal;`}</CodeBlock>

      <H2>{tx(t, "oglPhong_specTitle", "Specular: the highlight")}</H2>
      <p>
        {tx(t, "oglPhong_specBody",
          "Shiny surfaces reflect light mostly in one direction — the mirror direction. The highlight is bright when that reflected ray points at the eye and fades as it points away. First we need the mirror direction itself, and it takes only a projection to build it:")}
      </p>

      <ReflectFigure t={t} />

      <Equation label={tx(t, "oglPhong_reflLabel", "Reflection vector")}>
        {r`\vR \;=\; 2\,(\dotp{\vN}{\vL})\,\vN \;-\; \vL`}
      </Equation>
      <p>
        {tx(t, "oglPhong_specPow",
          "The cosine between the reflection and the view direction is again a dot product. Raising it to a power α keeps it near 1 only when the two almost coincide, so a larger exponent makes a smaller, sharper highlight:")}
      </p>
      <Equation label={tx(t, "oglPhong_specLabel", "Specular term")}
        where={[[r`\alpha`, tx(t, "oglPhong_wAlpha2", "shininess: 2–8 dull plastic, 32–64 polished, 128+ almost mirror")]]}>
        {r`I_s \;=\; k_s\, L_s\, \max(0,\; \dotp{\vR}{\vV})^{\alpha}`}
      </Equation>
      <CodeBlock lang="glsl" filename="specular.frag" t={t}>{`vec3 viewDir    = normalize(viewPos - FragPos);
vec3 reflectDir = reflect(-lightDir, norm);         // reflect() wants the INCOMING ray
float spec      = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
vec3 specular   = specularStrength * spec * lightColor;`}</CodeBlock>

      <H2>{tx(t, "oglPhong_fullTitle", "Putting it together")}</H2>
      <CodeBlock lang="glsl" filename="phong.vert" t={t}>{`#version 460 core
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aNormal;

out vec3 FragPos;   // world-space position
out vec3 Normal;    // world-space normal

uniform mat4 model, view, projection;
uniform mat3 normalMatrix;

void main() {
    FragPos     = vec3(model * vec4(aPos, 1.0));
    Normal      = normalMatrix * aNormal;
    gl_Position = projection * view * vec4(FragPos, 1.0);
}`}</CodeBlock>
      <CodeBlock lang="glsl" filename="phong.frag" t={t}>{`#version 460 core
in vec3 FragPos;
in vec3 Normal;
out vec4 FragColor;

uniform vec3 lightPos, viewPos, lightColor, objectColor;

void main() {
    vec3 norm     = normalize(Normal);
    vec3 lightDir = normalize(lightPos - FragPos);
    vec3 viewDir  = normalize(viewPos - FragPos);

    vec3 ambient  = 0.1 * lightColor;
    vec3 diffuse  = max(dot(norm, lightDir), 0.0) * lightColor;
    vec3 specular = 0.5 * pow(max(dot(viewDir, reflect(-lightDir, norm)), 0.0), 32.0) * lightColor;

    FragColor = vec4((ambient + diffuse + specular) * objectColor, 1.0);
}`}</CodeBlock>

      <LessonTable
        headers={[tx(t, "oglPhong_tSpace", "Where you light"), tx(t, "oglPhong_tPro", "Pros"), tx(t, "oglPhong_tCon", "Cons")]}
        rows={[
          [tx(t, "oglPhong_tWorld", "World space"), tx(t, "oglPhong_tWorldPro", "Intuitive; light positions stay as authored"), tx(t, "oglPhong_tWorldCon", "Needs viewPos as a uniform")],
          [tx(t, "oglPhong_tView", "View space"), tx(t, "oglPhong_tViewPro", "The eye is at the origin: viewDir = normalize(-FragPos)"), tx(t, "oglPhong_tViewCon", "Every light must be transformed by the view matrix first")],
          [tx(t, "oglPhong_tGouraud", "Per vertex (Gouraud)"), tx(t, "oglPhong_tGouraudPro", "Cheap: lighting runs once per vertex"), tx(t, "oglPhong_tGouraudCon", "Highlights smaller than a triangle vanish or look faceted")],
        ]}
      />

      <Callout type="tip" t={t}>
        {tx(t, "oglPhong_pitfalls",
          "The three classic Phong bugs: forgetting to normalize after interpolation (dim triangle centres), passing reflect() the direction TO the light instead of FROM it (the highlight appears on the wrong side), and transforming normals by the model matrix under non-uniform scale (lighting that bends as the object stretches).")}
      </Callout>

      <KeyIdeas t={t} id="oglPhong" items={[
        "Diffuse is Lambert's law: the same beam spread over 1 / cos θ more area — hence max(0, n·l).",
        "Specular measures how close the mirror direction r = 2(n·l)n − l comes to the eye, sharpened by a power.",
        "Normals transform with (M⁻¹)ᵀ, not M, so they stay perpendicular to the surface.",
        "Interpolated normals must be normalized again in the fragment shader.",
      ]} />
    </Article>
  );
}

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

// ═════════════════════════════════════════════════════════════════════════════
// 5. Light Casters
// ═════════════════════════════════════════════════════════════════════════════

export function LightCastersContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglCast_intro",
          "So far the light was a point hanging next to the object. Real scenes need three kinds of light source, and each one differs in just one thing: how the direction to the light, and how much of it arrives, change from fragment to fragment.")}
      </Lead>

      <LessonTable
        headers={[tx(t, "oglCast_tType", "Caster"), tx(t, "oglCast_tDir", "Direction to light"), tx(t, "oglCast_tAmount", "How much arrives")]}
        rows={[
          [tx(t, "oglCast_tDirL", "Directional (sun)"), tx(t, "oglCast_tDirD", "The same for every fragment"), tx(t, "oglCast_tDirA", "Constant")],
          [tx(t, "oglCast_tPoint", "Point (bulb)"), tx(t, "oglCast_tPointD", "normalize(lightPos − fragPos)"), tx(t, "oglCast_tPointA", "Falls off with distance")],
          [tx(t, "oglCast_tSpot", "Spot (torch)"), tx(t, "oglCast_tSpotD", "Like a point light"), tx(t, "oglCast_tSpotA", "Falls off with distance and only inside a cone")],
        ]}
      />

      <H2>{tx(t, "oglCast_dirTitle", "Directional light")}</H2>
      <p>
        {tx(t, "oglCast_dirBody",
          "The sun is so far away that its rays are parallel by the time they reach us. The light has no position, only a direction, and that direction is the same for every fragment. Remember the w trick: a direction is a vec4 with w = 0, so translation never touches it.")}
      </p>
      <LightingSceneFigure t={t} mode="directional" />
      <CodeBlock lang="glsl" filename="directional.frag" t={t}>{`struct DirLight { vec3 direction; vec3 ambient, diffuse, specular; };
// direction points FROM the light; flip it to get "towards the light"
vec3 lightDir = normalize(-light.direction);`}</CodeBlock>

      <H2>{tx(t, "oglCast_attenTitle", "Point lights and attenuation")}</H2>
      <p>
        {tx(t, "oglCast_attenPhys",
          "A bulb sends its light out in every direction. At distance d that light is spread over the surface of a sphere of radius d, so the intensity per unit area falls with that area — the inverse-square law:")}
      </p>
      <Equation label={tx(t, "oglCast_isqLabel", "Inverse-square law")}>
        {r`I(d) \;=\; \frac{\Phi}{4\pi d^{2}} \;\;\propto\;\; \frac{1}{d^{2}}`}
      </Equation>
      <p>
        {tx(t, "oglCast_attenPractical",
          "Used raw, 1/d² explodes near the light and never quite reaches zero. The classic real-time formula keeps the quadratic falloff but adds a constant and a linear term to tame both ends:")}
      </p>
      <Equation label={tx(t, "oglCast_attLabel", "Attenuation")}
        where={[
          [r`K_c`, tx(t, "oglCast_wKc", "constant, usually 1 — keeps F ≤ 1 near the light")],
          [r`K_l`, tx(t, "oglCast_wKl", "linear — dominates at medium distance")],
          [r`K_q`, tx(t, "oglCast_wKq", "quadratic — takes over far away")],
        ]}>
        {r`F_{att}(d) \;=\; \frac{1}{K_c + K_l\, d + K_q\, d^{2}}`}
      </Equation>

      <AttenuationFigure t={t} />
      <LightingSceneFigure t={t} mode="point" />

      <CodeBlock lang="glsl" filename="point.frag" t={t}>{`float d = length(light.position - FragPos);
float attenuation = 1.0 / (light.constant + light.linear * d + light.quadratic * d * d);
ambient  *= attenuation;   // attenuate all three terms
diffuse  *= attenuation;
specular *= attenuation;`}</CodeBlock>

      <H2>{tx(t, "oglCast_spotTitle", "Spotlight")}</H2>
      <p>
        {tx(t, "oglCast_spotBody",
          "A spotlight is a point light that only shines inside a cone. For each fragment we measure the angle θ between the spotlight's direction and the direction to the fragment, and compare it with the cone's cut-off angle. Since θ comes from a dot product, everything is compared as cosines — and cosines shrink as angles grow, so the test is reversed: inside the cone means cos θ > cos φ.")}
      </p>
      <Equation label={tx(t, "oglCast_softLabel", "Soft-edged spotlight")}
        where={[
          [r`\theta`, tx(t, "oglCast_wTheta", "angle between the spot direction and the direction to the fragment")],
          [r`\phi`, tx(t, "oglCast_wPhi", "inner cut-off: full intensity inside")],
          [r`\gamma`, tx(t, "oglCast_wGamma", "outer cut-off: zero outside")],
        ]}>
        {r`I \;=\; \operatorname{clamp}\!\left(\frac{\cos\theta - \cos\gamma}{\cos\phi - \cos\gamma},\; 0,\; 1\right)`}
      </Equation>

      <SpotlightFigure t={t} />
      <LightingSceneFigure t={t} mode="spot" />

      <Callout type="tip" t={t}>
        {tx(t, "oglCast_flashTip",
          "A flashlight is a spotlight whose position is the camera position and whose direction is the camera's front vector, updated every frame. With a single cut-off the edge is razor sharp; the inner/outer pair is what makes it look like a real torch.")}
      </Callout>

      <KeyIdeas t={t} id="oglCast" items={[
        "Directional: one direction for the whole scene, no falloff.",
        "Point: light spreads over a sphere, so it falls roughly as 1/d²; Kc, Kl and Kq tame the curve.",
        "Spot: a point light limited to a cone, compared with cosines; two cut-offs give a soft edge.",
      ]} />
    </Article>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// 6. Multiple Lights
// ═════════════════════════════════════════════════════════════════════════════

export function MultipleLightsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglMulti_intro",
          "Light adds up. Two lamps on the same wall make it exactly as bright as each lamp alone, summed. That makes many lights easy in principle: compute each light's contribution with the formulas from the last chapters and add them all together.")}
      </Lead>

      <Equation label={tx(t, "oglMulti_eqLabel", "Many lights")}
        where={[[r`\mathbf{c}_i`, tx(t, "oglMulti_wC", "one light's ambient + diffuse + specular, with its own attenuation and cone")]]}>
        {r`\mathbf{c}_{\text{final}} \;=\; \mathbf{c}_{\text{dir}} \;+\; \sum_{i=0}^{N-1} \mathbf{c}_{\text{point},\,i} \;+\; \mathbf{c}_{\text{spot}} \;+\; \mathbf{E}`}
      </Equation>

      <LightingSceneFigure t={t} mode="multi" />

      <H2>{tx(t, "oglMulti_structTitle", "One function per caster")}</H2>
      <p>
        {tx(t, "oglMulti_structBody",
          "Keep main() readable by moving each caster into a function that returns its contribution. The point lights live in a fixed-size array of structs; GLSL needs the size at compile time, hence the #define.")}
      </p>
      <CodeBlock lang="glsl" filename="multiple_lights.frag" t={t}>{`#define NR_POINT_LIGHTS 4

struct PointLight {
    vec3 position;
    float constant, linear, quadratic;
    vec3 ambient, diffuse, specular;
};
uniform DirLight   dirLight;
uniform PointLight pointLights[NR_POINT_LIGHTS];
uniform SpotLight  spotLight;

vec3 CalcPointLight(PointLight light, vec3 normal, vec3 fragPos, vec3 viewDir) {
    vec3 lightDir = normalize(light.position - fragPos);
    float diff = max(dot(normal, lightDir), 0.0);
    float spec = pow(max(dot(viewDir, reflect(-lightDir, normal)), 0.0), material.shininess);
    float d    = length(light.position - fragPos);
    float att  = 1.0 / (light.constant + light.linear * d + light.quadratic * d * d);
    vec3 albedo = texture(material.diffuse, TexCoords).rgb;
    return att * (light.ambient  * albedo
                + light.diffuse  * diff * albedo
                + light.specular * spec * texture(material.specular, TexCoords).rgb);
}

void main() {
    vec3 norm    = normalize(Normal);
    vec3 viewDir = normalize(viewPos - FragPos);
    vec3 result  = CalcDirLight(dirLight, norm, viewDir);
    for (int i = 0; i < NR_POINT_LIGHTS; i++)
        result += CalcPointLight(pointLights[i], norm, FragPos, viewDir);
    result += CalcSpotLight(spotLight, norm, FragPos, viewDir);
    FragColor = vec4(result, 1.0);
}`}</CodeBlock>

      <CodeBlock lang="cpp" filename="set_point_lights.cpp" t={t}>{`for (int i = 0; i < 4; ++i) {
    const std::string base = "pointLights[" + std::to_string(i) + "].";
    shader.setVec3 (base + "position",  pointLightPositions[i]);
    shader.setVec3 (base + "diffuse",   pointLightColors[i]);
    shader.setFloat(base + "constant",  1.0f);
    shader.setFloat(base + "linear",    0.35f);
    shader.setFloat(base + "quadratic", 0.44f);
}`}</CodeBlock>

      <H2>{tx(t, "oglMulti_costTitle", "What it costs")}</H2>
      <p>
        {tx(t, "oglMulti_costBody",
          "Every light runs for every fragment of every object, lit or not, visible or not. The cost is roughly lights × fragments, so a forward renderer like this one stays comfortable up to a handful of lights. Beyond that, techniques such as deferred shading light only the pixels that end up on screen, and light culling skips lights that cannot reach a pixel — both come later in Advanced Lighting.")}
      </p>
      <Equation>{r`\text{cost} \;\approx\; N_{\text{lights}} \times N_{\text{fragments shaded}}`}</Equation>

      <Callout type="warn" t={t}>
        {tx(t, "oglMulti_warn",
          "The ambient terms add up too: four point lights with ambient 0.05 each is already 0.2 of flat light everywhere, which washes out contrast. Keep each light's ambient tiny, or move ambient out of the per-light functions and add it once.")}
      </Callout>

      <KeyIdeas t={t} id="oglMulti" items={[
        "Contributions from separate lights simply add.",
        "One function per caster keeps the shader readable; point lights go in a fixed-size array of structs.",
        "Forward shading costs lights × fragments — the reason deferred shading exists.",
      ]} />
    </Article>
  );
}
