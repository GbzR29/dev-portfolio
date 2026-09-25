// src/lib/tracks/opengl/chapters/lighting-basics/lighting.tsx
"use client";

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { PhongFigure } from "@/components/lesson/figures/PhongFigure";
import { LambertFigure } from "@/components/lesson/figures/lighting/LambertFigure";
import { ReflectFigure } from "@/components/lesson/figures/lighting/ReflectFigure";
import { NormalMatrixFigure } from "@/components/lesson/figures/lighting/NormalMatrixFigure";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";

const r = String.raw;

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
