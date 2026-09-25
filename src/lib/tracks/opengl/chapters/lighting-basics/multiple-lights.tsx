// src/lib/tracks/opengl/chapters/lighting-basics/multiple-lights.tsx
"use client";

import { CodeBlock, Callout, H2 } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { LightingSceneFigure } from "@/components/lesson/figures/lighting/LightingSceneFigure";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";

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
