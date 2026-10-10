// src/lib/tracks/opengl/chapters/lighting-basics/lighting.tsx
"use client";

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { highlightNumbers, phongNumbers } from "../../live/lighting";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { PhongFigure } from "@/components/lesson/figures/PhongFigure";
import { LambertFigure } from "@/components/lesson/figures/lighting/LambertFigure";
import { ReflectFigure } from "@/components/lesson/figures/lighting/ReflectFigure";
import { NormalMatrixFigure } from "@/components/lesson/figures/lighting/NormalMatrixFigure";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";

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

      <Goals t={t} id="oglPhong" items={[
        "Add ambient, diffuse and specular light to a surface.",
        "Compute diffuse light with Lambert's cosine law.",
        "Transform normals correctly with the normal matrix.",
        "Shape the highlight with the shininess exponent.",
      ]} />

      <Equation label={tx(t, "oglPhong_eqLabel", "The Phong reflection model")}
        where={[
          [r`k_a, k_d, k_s`, tx(t, "oglPhong_wK", "how much ambient, diffuse and specular light the material reflects")],
          [r`L_a, L_d, L_s`, tx(t, "oglPhong_wLight", "the light's ambient, diffuse and specular intensity")],
          [r`\vN`, tx(t, "oglPhong_wN", "surface normal")],
          [r`\vL`, tx(t, "oglPhong_wLdir", "direction from the point to the light")],
          [r`\vR`, tx(t, "oglPhong_wR", "that light direction mirrored about the normal")],
          [r`\vV`, tx(t, "oglPhong_wV", "direction from the point to the eye")],
          [r`\alpha`, tx(t, "oglPhong_wAlpha", "shininess — how tight the highlight is")],
        ]}
        words={tx(t, "oglPhong_eqWords", "The brightness of a point is three pieces added up: a small fixed amount of light that is always there, light that grows the more directly the surface faces the lamp, and a shine that appears only when the light's mirror direction points close to your eye.")}>
        {r`I \;=\; \underbrace{k_a L_a}_{\text{ambient}} \;+\; \underbrace{k_d L_d \max(0,\, \dotp{\vN}{\vL})}_{\text{diffuse}} \;+\; \underbrace{k_s L_s \max(0,\, \dotp{\vR}{\vV})^{\alpha}}_{\text{specular}}`}
      </Equation>

      <p>{tx(t, "oglPhong_tour", "Drag the sun and the eye to see every vector and term change, then we will derive each one.")}</p>

      <PhongFigure t={t} />

      <H2>{tx(t, "oglPhong_ambTitle", "Ambient: light from everywhere")}</H2>
      <p>
        {tx(t, "oglPhong_ambBody",
          "In a real room, a surface facing away from the lamp is not black — light bounced off walls and ceiling reaches it. Simulating those bounces is global illumination and is expensive. Phong replaces it with a constant: a small fraction of the light that every point receives regardless of orientation.")}
      </p>
      <Equation label={tx(t, "oglPhong_ambLabel", "Ambient term")}
        where={[
          [r`k_a`, tx(t, "oglPhong_wKa", "how much of that background light the material sends back (0 to 1)")],
          [r`L_a`, tx(t, "oglPhong_wLa", "the background light itself, usually a small part of the light's colour, such as 0.1 of it")],
        ]}>
        {r`I_a = k_a\, L_a \qquad (\text{${tx(t, "oglPhong_ambEg", "e.g.")}}\ L_a = 0.1 \cdot \text{lightColor})`}
      </Equation>

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
      <Derivation t={t} label={tx(t, "oglPhong_irrLabel", "Irradiance on a tilted surface")}
        steps={[
          { full: true, tex: r`E = \frac{\Phi}{\text{${tx(t, "oglPhong_irrArea", "area lit")}}}`,
            why: tx(t, "oglPhong_ir1", "irradiance is power per unit of area: the same light spread over more surface gives less to each bit") },
          { full: true, tex: r`\text{${tx(t, "oglPhong_irrArea", "area lit")}} = \frac{A}{\cos\theta}`,
            why: tx(t, "oglPhong_ir2", "tilting the surface by θ stretches the patch the beam covers: the beam's width A is that patch seen at an angle θ, so A = patch · cos θ, and the patch is A / cos θ") },
          { full: true, tex: r`E = \frac{\Phi}{A / \cos\theta} = \frac{\Phi}{A}\cos\theta`,
            why: tx(t, "oglPhong_ir3", "dividing by a fraction is multiplying by its reciprocal, so the cos θ moves up to the top") },
          { full: true, tex: r`E = E_0 \cos\theta, \qquad E_0 = \frac{\Phi}{A}`,
            why: tx(t, "oglPhong_ir4", "Φ/A is the irradiance when the beam hits head-on (θ = 0, cos 0 = 1); call it E₀. At 60° the surface gets cos 60° = half of it") },
        ]} />
      <p>
        {tx(t, "oglPhong_diffDot",
          "For unit vectors the dot product is exactly the cosine of the angle between them, so the shader never computes θ. Once the light goes behind the surface the cosine turns negative, which would subtract light — hence the max:")}
      </p>
      <Equation label={tx(t, "oglPhong_diffLabel", "Diffuse term")}
        where={[[r`\dotp{\vN}{\vL}`, tx(t, "oglPhong_wDot", "= |n||l| cos θ = cos θ, because both are normalized")]]}
        words={tx(t, "oglPhong_diffWords", "A matte surface is as bright as the cosine of the angle between its normal and the direction to the light: full brightness when it faces the lamp, half at 60°, nothing at 90° or beyond.")}>
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
      <Derivation t={t} label={tx(t, "oglPhong_nmLabel", "Deriving the normal matrix")}
        steps={[
          { full: true, tex: r`\mathbf{n}^{\mathsf T}\mathbf{t} = 0`,
            why: tx(t, "oglPhong_nm1", "perpendicular before: the dot product n · t, written as a row times a column, is 0 for every tangent t on the surface") },
          { full: true, tex: r`(G\mathbf{n})^{\mathsf T}(M\mathbf{t}) = 0`,
            why: tx(t, "oglPhong_nm2", "what we want after: the tangent moves with the model matrix M, the normal with an unknown matrix G, and they must still be perpendicular") },
          { full: true, tex: r`\mathbf{n}^{\mathsf T}\, G^{\mathsf T} M\, \mathbf{t} = 0`,
            why: tx(t, "oglPhong_nm3", "the transpose of a product reverses the order: (Gn)ᵀ = nᵀGᵀ") },
          { full: true, tex: r`G^{\mathsf T} M = I`,
            why: tx(t, "oglPhong_nm4", "if GᵀM is the identity, the line above becomes nᵀt = 0, which is true by the first line, for every tangent at once") },
          { full: true, tex: r`\green{G} = \green{(M^{-1})^{\mathsf T}}`,
            why: tx(t, "oglPhong_nm5", "multiply both sides on the right by M⁻¹ to get Gᵀ = M⁻¹, then transpose both sides") },
        ]} />
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

      <Derivation t={t} label={tx(t, "oglPhong_reflDer", "Building the mirror direction")}
        steps={[
          { full: true, tex: r`\mathbf p = (\dotp{\vN}{\vL})\,\vN`,
            why: tx(t, "oglPhong_rf1", "the part of l along the normal: its projection on n. n has length 1, so n · l is exactly how far l reaches along n") },
          { full: true, tex: r`\vL = \mathbf p + (\vL - \mathbf p)`,
            why: tx(t, "oglPhong_rf2", "split l into that part and the rest, which lies along the surface") },
          { full: true, tex: r`\vR = \mathbf p - (\vL - \mathbf p)`,
            why: tx(t, "oglPhong_rf3", "a mirror keeps the part along the normal and flips the part along the surface") },
          { full: true, tex: r`\vR = 2\,\mathbf p - \vL = 2\,(\dotp{\vN}{\vL})\,\vN - \vL`,
            why: tx(t, "oglPhong_rf4", "remove the brackets, collect the two p's and put p back in") },
        ]} />
      <Equation label={tx(t, "oglPhong_reflLabel", "Reflection vector")}
        where={[
          [r`\dotp{\vN}{\vL}`, tx(t, "oglPhong_wNl", "how far the light direction reaches along the normal (the cosine of the angle between them)")],
          [r`2\,(\dotp{\vN}{\vL})\,\vN`, tx(t, "oglPhong_wTwoP", "twice that projection along n; taking l away from it leaves the part along n and flips the part along the surface")],
        ]}>
        {r`\vR \;=\; 2\,(\dotp{\vN}{\vL})\,\vN \;-\; \vL`}
      </Equation>
      <p>
        {tx(t, "oglPhong_specPow",
          "The cosine between the reflection and the view direction is again a dot product. Raising it to a power α keeps it near 1 only when the two almost coincide, so a larger exponent makes a smaller, sharper highlight:")}
      </p>
      <Equation label={tx(t, "oglPhong_specLabel", "Specular term")}
        where={[[r`\alpha`, tx(t, "oglPhong_wAlpha2", "shininess: 2–8 dull plastic, 32–64 polished, 128+ almost mirror")]]}
        words={tx(t, "oglPhong_specWords", "Measure how closely the mirrored light lines up with your eye, as a cosine, and raise it to the power α. A number just below 1 raised to a high power falls quickly, so the higher α, the smaller the spot where the shine survives.")}>
        {r`I_s \;=\; k_s\, L_s\, \max(0,\; \dotp{\vR}{\vV})^{\alpha}`}
      </Equation>
      <LiveFormula label={tx(t, "oglPhong_liveHl", "Try it: how wide is the highlight?")}
        tex={r`\cos^{\alpha}\varphi = \tfrac12 \;\Rightarrow\; \varphi_{1/2} = \arccos\!\big(0.5^{1/\alpha}\big)`}
        vars={[{ id: "alpha", label: "α", min: 1, max: 256, step: 1, value: 32, fmt: v => String(v) }]}
        compute={highlightNumbers(t)}
        where={[[r`\varphi`, tx(t, "oglPhong_wPhi", "the angle between the mirror direction r and the direction to the eye v")]]}
        note={tx(t, "oglPhong_liveHlNote", "φ½ is how far the eye can move away from the mirror direction before the shine drops to half. α = 32 gives about 12°. Try 8 and 128: making α four times larger makes the highlight about half as wide, because near 0 the cosine is about 1 − φ²/2.")} />
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

      <LiveFormula label={tx(t, "oglPhong_livePhong", "Try it: Phong at one point, with this shader's numbers")}
        tex={r`I = 0.1 + 1 \cdot \max(0,\ \cos\theta) + 0.5 \cdot \max(0,\ \cos\varphi)^{\alpha}`}
        vars={[
          { id: "theta", label: "θ", min: 0, max: 120, step: 5, value: 40, fmt: v => `${v}°` },
          { id: "phi", label: "φ", min: 0, max: 60, step: 1, value: 20, fmt: v => `${v}°` },
          { id: "alpha", label: "α", min: 1, max: 128, step: 1, value: 32, fmt: v => String(v) },
        ]}
        compute={phongNumbers(t)}
        where={[
          [r`\theta`, tx(t, "oglPhong_wTheta", "the angle between the normal n and the direction to the light l, so cos θ = n · l")],
          [r`\varphi`, tx(t, "oglPhong_wPhi", "the angle between the mirror direction r and the direction to the eye v")],
        ]}
        note={tx(t, "oglPhong_livePhongNote", "0.1, 1 and 0.5 are the ambient, diffuse and specular strengths of phong.frag, with a white light, so this is one colour channel before the multiplication by objectColor. Push θ past 90°: the diffuse term stops at 0 and only the ambient 0.1 is left. The sum can pass 1; the screen clips it, which is why a strong highlight looks flat white.")} />

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
