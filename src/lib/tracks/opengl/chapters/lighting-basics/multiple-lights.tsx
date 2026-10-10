// src/lib/tracks/opengl/chapters/lighting-basics/multiple-lights.tsx
"use client";

// Multiple Lights (explanation pass 2026-09-30): why light adds
// (superposition); the sum over casters with every symbol; one fragment with
// three lights worked by hand (LightingScene figure); one function per
// caster, the uniform array and its limits, an active-light count; the
// light's radius from its attenuation, worked out (LightSum figure);
// saturation; the cost of forward shading in numbers; mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { ATT_ROWS } from "../../live/light-casters";
import { costNumbers, radiusNumbers } from "../../live/multiple-lights";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { LightingSceneFigure } from "@/components/lesson/figures/lighting/LightingSceneFigure";
import { LightSumFigure } from "@/components/lesson/figures/lighting/LightSumFigure";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";

const r = String.raw;

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

      <Goals t={t} id="oglMulti" items={[
        "Explain why the light from several sources simply adds up.",
        "Organize the shader with one function per kind of light.",
        "Choose a light's radius, and estimate what many lights cost.",
      ]} />

      <H2>{tx(t, "oglMulti_whyTitle", "Why light simply adds")}</H2>
      <p>
        {tx(t, "oglMulti_whyBody",
          "Light from two lamps does not interact on the way: the photons from one pass through the photons from the other without noticing. A surface reflects each lamp's light exactly as if the other were off, and the eye receives both reflections together. So the reflected light is the sum of the reflections of each light on its own. This property is called superposition, and it is what lets a shader treat each light separately. (It holds for the light itself; what the screen can display is another matter, below.)")}
      </p>
      <Equation label={tx(t, "oglMulti_eqLabel", "Many lights")}
        where={[
          [r`\mathbf{c}_{\text{dir}}`, tx(t, "oglMulti_wDir", "the directional light's contribution: same direction everywhere, no attenuation")],
          [r`\mathbf{c}_{\text{point},\,i}`, tx(t, "oglMulti_wC", "one light's ambient + diffuse + specular, with its own attenuation and cone")],
          [r`N`, tx(t, "oglMulti_wN", "the number of point lights")],
          [r`\mathbf{c}_{\text{spot}}`, tx(t, "oglMulti_wSpot", "the spotlight (a flashlight held by the camera, for example)")],
          [r`\mathbf{E}`, tx(t, "oglMulti_wE", "emission from the material, added once")],
        ]}
        words={tx(t, "oglMulti_eqWords", "Light simply adds up: work out each light on its own, as if it were the only one, and add the colours. The material's own glow is added once at the end.")}>
        {r`\mathbf{c}_{\text{final}} \;=\; \mathbf{c}_{\text{dir}} \;+\; \sum_{i=0}^{N-1} \mathbf{c}_{\text{point},\,i} \;+\; \mathbf{c}_{\text{spot}} \;+\; \mathbf{E}`}
      </Equation>

      <H3>{tx(t, "oglMulti_workedTitle", "Worked example: one fragment, three lights")}</H3>
      <p>
        {tx(t, "oglMulti_workedIntro",
          "Diffuse only, to keep the numbers short. A coral fragment (albedo (1, 0.5, 0.31)) is lit by a weak sun and two lamps with the Light Casters attenuation for a 13 m range, att(d) = 1 / (1 + 0.35d + 0.44d²):")}
      </p>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "oglMulti_w1", "Sun: Ld = 0.4, N·L = 0.6, no attenuation: 0.4 · 0.6 = 0.240.")}</li>
        <li>{tx(t, "oglMulti_w2", "Lamp 1 at d = 2 m: att = 1 / (1 + 0.7 + 1.76) = 1 / 3.46 = 0.289. With Ld = 0.8 and N·L = 0.9: 0.289 · 0.8 · 0.9 = 0.208.")}</li>
        <li>{tx(t, "oglMulti_w3", "Lamp 2 at d = 4 m: att = 1 / (1 + 1.4 + 7.04) = 1 / 9.44 = 0.106. With Ld = 0.8 and N·L = 0.5: 0.106 · 0.8 · 0.5 = 0.042.")}</li>
        <li>{tx(t, "oglMulti_w4", "Sum of the light factors: 0.240 + 0.208 + 0.042 = 0.490. Times the albedo: (0.490, 0.245, 0.152). Lamp 2, twice as far as lamp 1, contributes a fifth as much: attenuation and the slanted angle together.")}</li>
      </ol>

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
      <LessonTable
        headers={[tx(t, "oglMulti_tChoice", "Choice"), tx(t, "oglMulti_tReason", "Reason")]}
        rows={[
          [tx(t, "oglMulti_c1", "#define for the array size"), tx(t, "oglMulti_c1b", "uniform arrays must have a size known when the shader compiles; the #define keeps the declaration and the loop in step.")],
          [tx(t, "oglMulti_c2", "normal and view direction computed once in main()"), tx(t, "oglMulti_c2b", "they do not depend on the light; normalising them inside each function would repeat the same work N times.")],
          [tx(t, "oglMulti_c3", "the light passed by value"), tx(t, "oglMulti_c3b", "GLSL has no pointers or references; the compiler inlines these functions, so the copy costs nothing.")],
          [tx(t, "oglMulti_c4", "uniform names built as strings"), tx(t, "oglMulti_c4b", "each array element's member is a separate uniform, \"pointLights[2].position\". Fine at setup; in a per-frame loop, look the locations up once and cache them.")],
        ]}
      />
      <H3>{tx(t, "oglMulti_limitTitle", "How many lights fit?")}</H3>
      <p>
        {tx(t, "oglMulti_limitBody",
          "Plain uniforms live in a small, fast memory. OpenGL 4.x guarantees only 1024 float components of them per fragment shader (GL_MAX_FRAGMENT_UNIFORM_COMPONENTS; real GPUs often give more). One PointLight is 15 floats, usually padded to 16 or more, and the material, matrices and other lights need room too, so plain uniform arrays top out at a few dozen lights. Larger light lists go into a Uniform Buffer Object or a Shader Storage Buffer (Advanced OpenGL section). To draw fewer lights than the array holds, add a uniform int numLights and loop to it; loops with a uniform bound are fine on every modern GPU.")}
      </p>

      <H2>{tx(t, "oglMulti_radiusTitle", "A light's radius")}</H2>
      <p>
        {tx(t, "oglMulti_radiusBody",
          "The attenuation 1 / (c + l·d + q·d²) never reaches zero, so in principle every light touches every fragment. In practice, once a light's contribution falls below what an 8-bit channel can show, it can be skipped. A common threshold is 5/256 of the light's brightest channel I. Setting I · att(d) = 5/256 and solving the quadratic for d:")}
      </p>
      <Derivation t={t} label={tx(t, "oglMulti_radDer", "Solving for the radius")}
        steps={[
          { full: true, tex: r`\frac{I_{\max}}{c + l\,d + q\,d^2} = \frac{5}{256}`,
            why: tx(t, "oglMulti_rd1", "the light's brightest channel, after attenuation, has dropped to the threshold") },
          { full: true, tex: r`c + l\,d + q\,d^2 = \tfrac{256}{5}\, I_{\max}`,
            why: tx(t, "oglMulti_rd2", "multiply both sides by the bottom and by 256/5: the distance is now out of the fraction") },
          { full: true, tex: r`q\,d^2 + l\,d + \left(c - \tfrac{256}{5} I_{\max}\right) = 0`,
            why: tx(t, "oglMulti_rd3", "move everything to one side: a quadratic in d, with a = q, b = l and a negative constant term") },
          { full: true, tex: r`d_{\max} = \frac{-l + \sqrt{l^2 - 4q\left(c - \tfrac{256}{5} I_{\max}\right)}}{2q}`,
            why: tx(t, "oglMulti_rd4", "the quadratic formula. The constant term is negative, so the square root is larger than l and only the + sign gives a positive distance") },
        ]} />
      <Equation label={tx(t, "oglMulti_eqRadius", "Radius beyond which a light can be ignored")}
        where={[
          [r`c, l, q`, tx(t, "oglMulti_wClq", "the constant, linear and quadratic attenuation terms")],
          [r`I_{\max}`, tx(t, "oglMulti_wImax", "the brightest channel of the light's colour times its strength")],
          [r`\tfrac{256}{5}`, tx(t, "oglMulti_w256", "the inverse of the threshold 5/256: a contribution smaller than that barely changes an 8-bit pixel")],
        ]}>
        {r`q\,d^2 + l\,d + \left(c - \tfrac{256}{5} I_{\max}\right) = 0 \quad\Longrightarrow\quad d_{\max} = \frac{-l + \sqrt{l^2 - 4q\left(c - \tfrac{256}{5} I_{\max}\right)}}{2q}`}
      </Equation>
      <LiveFormula label={tx(t, "oglMulti_liveRadius", "Try it: the radius of a light")}
        tex={r`d_{\max} = \frac{-l + \sqrt{l^2 - 4q\left(c - \tfrac{256}{5} I_{\max}\right)}}{2q}`}
        vars={[
          { id: "row", label: tx(t, "oglMulti_lvRow", "row (reach)"), min: 0, max: ATT_ROWS.length - 1, step: 1, value: 1, fmt: v => String(ATT_ROWS[v][0]) },
          { id: "imax", label: <>I<sub>max</sub></>, min: 0.25, max: 5, step: 0.25, value: 1, fmt: v => String(v) },
        ]}
        compute={radiusNumbers}
        note={tx(t, "oglMulti_liveRadiusNote", "The start is the paragraph's example: the 13-unit row with I = 1 gives 10.3. Each row's radius comes out a little short of its name, because the table aims at about 1% and this threshold, 5/256, is about 2%. Doubling I does not double the radius: far away the d² term rules, so the radius grows only like √I.")} />
      <p>
        {tx(t, "oglMulti_radiusEx",
          "For the 13 m preset (c, l, q) = (1, 0.35, 0.44) and I = 1: c − 51.2 = −50.2, the root is √(0.1225 + 4 · 0.44 · 50.2) = √88.47 = 9.41, so d = (−0.35 + 9.41) / 0.88 = 10.3 m. For the 7 m preset (1, 0.7, 1.8) with I = 1.5 it is 6.3 m. The radius is what light culling uses: tiled, clustered and deferred renderers only evaluate the lights whose sphere of that radius touches the fragment.")}
      </p>
      <LightSumFigure t={t} />

      <H3>{tx(t, "oglMulti_satTitle", "When the sum passes 1")}</H3>
      <p>
        {tx(t, "oglMulti_satBody",
          "Superposition holds for light, but the framebuffer can only store 0 to 1. Where several lights overlap, the sum passes 1 and is clipped: bright regions go flat and lose their detail, and a coloured light that is strong enough turns any surface white in the channels it saturates. The cure is to keep the sum in a floating-point buffer and compress it into [0, 1] at the very end, which is what the HDR & Tone Mapping chapter does.")}
      </p>

      <H2>{tx(t, "oglMulti_costTitle", "What it costs")}</H2>
      <p>
        {tx(t, "oglMulti_costBody",
          "Every light runs for every fragment of every object, lit or not, visible or not. The cost is roughly lights × fragments, so a forward renderer like this one stays comfortable up to a handful of lights. Beyond that, techniques such as deferred shading light only the pixels that end up on screen, and light culling skips lights that cannot reach a pixel — both come later in Advanced Lighting.")}
      </p>
      <Equation label={tx(t, "oglMulti_eqCost", "Light evaluations per frame")}
        where={[
          [r`N_{\text{lights}}`, tx(t, "oglMulti_wNl", "lights evaluated per fragment")],
          [r`N_{\text{fragments shaded}}`, tx(t, "oglMulti_wNf", "pixels on screen times the overdraw: how many times, on average, a pixel is shaded by overlapping objects")],
        ]}>
        {r`\text{cost} \;\approx\; N_{\text{lights}} \times N_{\text{fragments shaded}}`}
      </Equation>
      <p>
        {tx(t, "oglMulti_costEx",
          "At 1920 × 1080 (2.07 million pixels) with an overdraw of 2, that is 4.1 million fragments. With 32 lights: 133 million light evaluations per frame, 8 billion per second at 60 fps, most of them for lights too far away to matter or for fragments later hidden behind others. Culling by radius removes the first waste; deferred shading removes the second.")}
      </p>
      <LiveFormula label={tx(t, "oglMulti_liveCost", "Try it: light evaluations at 1080p and 60 fps")}
        tex={r`\text{cost} \approx N_{\text{lights}} \times 1920 \cdot 1080 \cdot \text{overdraw}`}
        vars={[
          { id: "n", label: tx(t, "oglMulti_lvN", "lights"), min: 1, max: 256, step: 1, value: 32, fmt: v => String(v) },
          { id: "over", label: "overdraw", min: 1, max: 4, step: 0.5, value: 2, fmt: v => `${v}×` },
        ]}
        compute={costNumbers}
        note={tx(t, "oglMulti_liveCostNote", "The start is the paragraph's example: 32 lights, overdraw 2. Each evaluation is a few dozen instructions (two normalizes, two dots, a pow, the attenuation), so billions per second is what a full GPU can do and nothing more. Cut the overdraw to 1 (deferred shading) or the lights per fragment to a handful (culling) and the number drops by the same factor.")} />

      <Callout type="warn" t={t}>
        {tx(t, "oglMulti_warn",
          "The ambient terms add up too: four point lights with ambient 0.05 each is already 0.2 of flat light everywhere, which washes out contrast. Keep each light's ambient tiny, or move ambient out of the per-light functions and add it once.")}
      </Callout>

      <H2>{tx(t, "oglMulti_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "oglMulti_tMistake", "Mistake"), tx(t, "oglMulti_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "oglMulti_e1", "An array element left unset"), tx(t, "oglMulti_e1b", "its constant, linear and quadratic are 0, so att = 1/0 = infinity: the whole screen goes white (or NaN black). Set every element, or loop only to numLights.")],
          [tx(t, "oglMulti_e2", "Looking up uniform locations by name every frame"), tx(t, "oglMulti_e2b", "string building and hash lookups for every member of every light. Cache the locations, or upload a UBO.")],
          [tx(t, "oglMulti_e3", "Ambient inside every light"), tx(t, "oglMulti_e3b", "flat light grows with the number of lights. Add ambient once.")],
          [tx(t, "oglMulti_e4", "Dividing the sum by the number of lights"), tx(t, "oglMulti_e4b", "adding a lamp would make the scene darker. Light adds; handle the excess with tone mapping.")],
          [tx(t, "oglMulti_e5", "The directional light's direction sign"), tx(t, "oglMulti_e5b", "uniforms usually store the direction the light travels; the shader needs the direction toward the light, −direction. With the wrong sign the lit and dark sides swap.")],
          [tx(t, "oglMulti_e6", "Normalising the interpolated normal inside each light function"), tx(t, "oglMulti_e6b", "correct but wasteful; do it once in main().")],
        ]}
      />

      <KeyIdeas t={t} id="oglMulti" items={[
        "Contributions from separate lights simply add.",
        "One function per caster keeps the shader readable; point lights go in a fixed-size array of structs.",
        "Forward shading costs lights × fragments — the reason deferred shading exists.",
        "Superposition: each light is reflected as if it were alone, so the shader loops and sums.",
        "Plain uniform arrays hold a few dozen lights at most; larger lists go in buffers.",
        "Solving I · att(d) = 5/256 gives each light a radius beyond which it can be skipped.",
        "Sums above 1 are clipped in an 8-bit framebuffer; HDR keeps them.",
      ]} />
    </Article>
  );
}
