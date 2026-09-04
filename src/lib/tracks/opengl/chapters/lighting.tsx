// src/lib/tracks/opengl/chapters/lighting.tsx
"use client";

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

// ── Light Casters & Multiple Lights ──────────────────────────────────────────

export function LightCastersContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "oglCast_intro",
          "The Phong chapter used a single point of light with no falloff, which is fine for one cube and wrong for a scene. Real scenes need three kinds of light source, and the only thing that changes between them is how you compute the light direction and how the intensity decays with distance."
        )}
      </p>

      <H2>{tx(t, "oglCast_typesTitle", "The three casters")}</H2>
      <LessonTable
        headers={[tx(t, "oglCast_h0", "Type"), tx(t, "oglCast_h1", "Direction is"), tx(t, "oglCast_h2", "Models")]}
        rows={[
          [tx(t, "oglCast_t1", "Directional"), tx(t, "oglCast_d1", "Constant everywhere — no position at all"), tx(t, "oglCast_m1", "The sun. Rays are effectively parallel.")],
          [tx(t, "oglCast_t2", "Point"),       tx(t, "oglCast_d2", "From the fragment to the light position"),  tx(t, "oglCast_m2", "A bulb or torch. Fades with distance.")],
          [tx(t, "oglCast_t3", "Spot"),        tx(t, "oglCast_d3", "Same as a point light, plus a cone test"),  tx(t, "oglCast_m3", "A flashlight or stage light.")],
        ]}
      />

      <H2>{tx(t, "oglCast_dirTitle", "Directional light")}</H2>
      <CodeBlock lang="glsl" filename="directional.frag" t={t}>{`struct DirLight {
    vec3 direction;   // pointing FROM the light, in world space
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};
uniform DirLight uDirLight;

vec3 calcDirLight(DirLight light, vec3 normal, vec3 viewDir) {
    vec3 lightDir = normalize(-light.direction);   // toward the light
    vec3 halfway  = normalize(lightDir + viewDir);

    float diff = max(dot(normal, lightDir), 0.0);
    float spec = pow(max(dot(normal, halfway), 0.0), uMaterial.shininess);

    vec3 ambient  = light.ambient  * texture(uMaterial.diffuse,  TexCoord).rgb;
    vec3 diffuse  = light.diffuse  * diff * texture(uMaterial.diffuse,  TexCoord).rgb;
    vec3 specular = light.specular * spec * texture(uMaterial.specular, TexCoord).rgb;
    return ambient + diffuse + specular;
}`}</CodeBlock>

      <H2>{tx(t, "oglCast_attenTitle", "Attenuation — the point light falloff")}</H2>
      <p>
        {tx(t, "oglCast_attenBody",
          "Physically, light intensity falls off with the inverse square of distance. In practice a pure inverse square looks harsh and blows out near the source, so the standard model adds a constant and a linear term to soften it."
        )}
      </p>

      <CodeBlock lang="glsl" filename="attenuation.glsl" t={t}>{`float d = length(light.position - FragPos);
float attenuation = 1.0 / (light.constant
                         + light.linear    * d
                         + light.quadratic * d * d);

// ambient, diffuse and specular all get multiplied by it`}</CodeBlock>

      <LessonTable
        headers={[tx(t, "oglCast_a0", "Useful range"), "constant", "linear", "quadratic"]}
        rows={[
          ["7",   "1.0", "0.7",   "1.8"],
          ["20",  "1.0", "0.22",  "0.20"],
          ["50",  "1.0", "0.09",  "0.032"],
          ["100", "1.0", "0.045", "0.0075"],
          ["325", "1.0", "0.014", "0.0007"],
        ]}
      />

      <Callout type="tip" t={t}>
        {tx(t, "oglCast_attenTip",
          "These constants are the classic Ogre3D table and they are still the fastest way to get a plausible result. Pick the row whose range roughly matches how far you want the light to reach. Keep constant at 1.0 — dropping below it makes the light brighter than its own source colour at close range."
        )}
      </Callout>

      <H2>{tx(t, "oglCast_spotTitle", "Spotlight and the soft edge")}</H2>
      <p>
        {tx(t, "oglCast_spotBody",
          "A spotlight is a point light that only illuminates within a cone. Comparing cosines rather than angles keeps it to a dot product. Two cutoff angles instead of one give you a soft edge rather than a hard circle."
        )}
      </p>

      <CodeBlock lang="glsl" filename="spot.glsl" t={t}>{`// cutOff and outerCutOff are stored as COSINES, computed on the CPU:
//   cos(radians(12.5)) and cos(radians(17.5))
float theta   = dot(lightDir, normalize(-light.direction));
float epsilon = light.cutOff - light.outerCutOff;
float intensity = clamp((theta - light.outerCutOff) / epsilon, 0.0, 1.0);

diffuse  *= intensity;
specular *= intensity;
// ambient is deliberately left alone, so the scene never goes fully black`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "oglCast_cosWarn",
          "Note the comparison direction: a larger cosine means a SMALLER angle. It reads backwards the first time. Comparing angles directly would work too, but that costs an inverse cosine per fragment for no benefit."
        )}
      </Callout>

      <H2>{tx(t, "oglCast_multiTitle", "Combining several lights")}</H2>
      <CodeBlock lang="glsl" filename="multi_light.frag" t={t}>{`#define NR_POINT_LIGHTS 4

uniform DirLight   uDirLight;
uniform PointLight uPointLights[NR_POINT_LIGHTS];
uniform SpotLight  uSpotLight;

void main() {
    vec3 norm    = normalize(Normal);
    vec3 viewDir = normalize(uViewPos - FragPos);

    vec3 result = calcDirLight(uDirLight, norm, viewDir);

    for (int i = 0; i < NR_POINT_LIGHTS; ++i)
        result += calcPointLight(uPointLights[i], norm, FragPos, viewDir);

    result += calcSpotLight(uSpotLight, norm, FragPos, viewDir);

    FragColor = vec4(result, 1.0);
}`}</CodeBlock>

      <CodeBlock lang="cpp" filename="set_array_uniforms.cpp" t={t}>{`// Array uniforms are addressed element by element, by name
for (int i = 0; i < 4; ++i) {
    const std::string base = "uPointLights[" + std::to_string(i) + "].";
    shader.setVec3 (base + "position",  positions[i]);
    shader.setVec3 (base + "diffuse",   colors[i]);
    shader.setFloat(base + "constant",  1.0f);
    shader.setFloat(base + "linear",    0.09f);
    shader.setFloat(base + "quadratic", 0.032f);
}`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "oglCast_perfWarn",
          "This forward-rendering approach costs every light for every fragment, whether that light reaches it or not. It falls apart somewhere around eight to sixteen lights. The industry answers are deferred shading — render surface data to a G-buffer, then light it once per pixel — and clustered or tiled forward rendering, which bins lights spatially. Both are worth knowing exist before you try to brute-force fifty lights."
        )}
      </Callout>

    </article>
  );
}

// ── Blinn-Phong & Gamma ──────────────────────────────────────────────────────

export function AdvancedLightingContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "oglAdvLight_intro",
          "Two corrections separate a scene that looks like a tutorial from one that looks right. The first fixes a visible artefact in Phong specular highlights. The second fixes the fact that almost every renderer written before 2010 was doing its maths in the wrong colour space."
        )}
      </p>

      <H2>{tx(t, "oglAdvLight_blinnTitle", "Blinn-Phong")}</H2>
      <p>
        {tx(t, "oglAdvLight_blinnBody",
          "Phong computes the specular term from the angle between the reflected light ray and the view direction. When the light is nearly behind a surface, that angle exceeds 90 degrees, the dot product clamps to zero, and the highlight is cut off with a hard visible edge. Blinn-Phong compares the normal against the halfway vector instead, which never produces that discontinuity."
        )}
      </p>

      <CodeBlock lang="glsl" filename="blinn.glsl" t={t}>{`// Phong — the reflection vector
vec3  reflectDir = reflect(-lightDir, normal);
float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);

// Blinn-Phong — the halfway vector between light and view
vec3  halfwayDir = normalize(lightDir + viewDir);
float spec = pow(max(dot(normal, halfwayDir), 0.0), shininess);`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "oglAdvLight_shininessNote",
          "The halfway angle is roughly half the reflection angle, so the same exponent gives a wider highlight. Multiply your shininess by two to four when converting a material from Phong to Blinn-Phong, or everything turns glossy and plastic."
        )}
      </Callout>

      <H2>{tx(t, "oglAdvLight_gammaTitle", "Gamma correction")}</H2>
      <p>
        {tx(t, "oglAdvLight_gammaBody",
          "Monitors do not display colour linearly. A pixel value of 0.5 emits roughly 21% of maximum brightness, not 50% — the display applies a curve of approximately x raised to 2.2. Human vision has a matching non-linearity, which is why 8-bit sRGB images store values pre-bent this way. The problem is that lighting maths — adding two light contributions, halving an intensity — is only correct in linear space."
        )}
      </p>

      <LessonTable
        headers={[tx(t, "oglAdvLight_g0", "Stage"), tx(t, "oglAdvLight_g1", "Space"), tx(t, "oglAdvLight_g2", "What to do")]}
        rows={[
          [tx(t, "oglAdvLight_gs1", "Colour textures (albedo)"), "sRGB",   tx(t, "oglAdvLight_ga1", "Upload as GL_SRGB8_ALPHA8 — the GPU linearizes on sample, for free.")],
          [tx(t, "oglAdvLight_gs2", "Data textures (normal, roughness)"), tx(t, "oglAdvLight_gsp2", "Linear"), tx(t, "oglAdvLight_ga2", "Upload as GL_RGBA8. Never gamma-correct these — they are numbers, not colours.")],
          [tx(t, "oglAdvLight_gs3", "All lighting maths"),        tx(t, "oglAdvLight_gsp3", "Linear"), tx(t, "oglAdvLight_ga3", "Nothing. This is where it must happen.")],
          [tx(t, "oglAdvLight_gs4", "Final output"),              "sRGB",   tx(t, "oglAdvLight_ga4", "Encode back with pow(color, 1/2.2), or enable GL_FRAMEBUFFER_SRGB.")],
        ]}
      />

      <CodeBlock lang="cpp" filename="gamma.cpp" t={t}>{`// Option A — let the hardware do both conversions
glTexImage2D(GL_TEXTURE_2D, 0, GL_SRGB8_ALPHA8, w, h, 0,
             GL_RGBA, GL_UNSIGNED_BYTE, data);   // linearized on sample
glEnable(GL_FRAMEBUFFER_SRGB);                   // encoded on write

// Option B — do the final encode yourself in the shader
//   FragColor = vec4(pow(color, vec3(1.0 / 2.2)), 1.0);
// Pick ONE. Doing both washes the image out completely.`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "oglAdvLight_doubleWarn",
          "Double-correcting is the most common mistake here, and it looks like a faded, milky image. If you enable GL_FRAMEBUFFER_SRGB, do not also apply pow(1/2.2) in the shader. And when you switch to gamma-correct rendering, your attenuation constants will look wrong — that is expected, because you had been compensating for the missing correction by tuning them."
        )}
      </Callout>

      <H2>{tx(t, "oglAdvLight_hdrTitle", "A note on HDR")}</H2>
      <p>
        {tx(t, "oglAdvLight_hdrBody",
          "Once lighting is linear, bright areas start clipping at 1.0 and lose all detail. The fix is to render into a floating-point framebuffer, let values exceed 1.0, and compress them back to display range at the end with a tone-mapping curve. It is the natural next step after gamma, and it needs the framebuffer chapter first."
        )}
      </p>

      <CodeBlock lang="glsl" filename="tonemap.frag" t={t}>{`vec3 hdr = texture(uHdrBuffer, TexCoord).rgb;

vec3 mapped = vec3(1.0) - exp(-hdr * uExposure);   // exposure tone mapping
mapped = pow(mapped, vec3(1.0 / 2.2));             // then encode to sRGB

FragColor = vec4(mapped, 1.0);`}</CodeBlock>

    </article>
  );
}

// ── Shadow Mapping ───────────────────────────────────────────────────────────

export function ShadowMappingContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "oglShadow_intro",
          "A shadow is the absence of light, and the only question a shadow algorithm answers is: can this fragment see the light source? Shadow mapping answers it by rendering the scene once from the light's point of view, keeping only the depth buffer, and then asking during the main pass whether each fragment is farther from the light than whatever the light saw first."
        )}
      </p>

      <H2>{tx(t, "oglShadow_passesTitle", "Two passes")}</H2>
      <LessonTable
        headers={[tx(t, "oglShadow_h0", "Pass"), tx(t, "oglShadow_h1", "Renders"), tx(t, "oglShadow_h2", "Output")]}
        rows={[
          [tx(t, "oglShadow_p1", "1 — Depth"),  tx(t, "oglShadow_r1", "The scene from the light's position"), tx(t, "oglShadow_o1", "A depth texture: distance to the nearest surface")],
          [tx(t, "oglShadow_p2", "2 — Shading"),tx(t, "oglShadow_r2", "The scene from the camera"),           tx(t, "oglShadow_o2", "Final image, sampling the depth texture per fragment")],
        ]}
      />

      <H2>{tx(t, "oglShadow_fboTitle", "The depth-only framebuffer")}</H2>
      <CodeBlock lang="cpp" filename="depth_fbo.cpp" t={t}>{`constexpr unsigned SHADOW_W = 2048, SHADOW_H = 2048;

unsigned int depthMapFBO, depthMap;
glGenFramebuffers(1, &depthMapFBO);
glGenTextures(1, &depthMap);

glBindTexture(GL_TEXTURE_2D, depthMap);
glTexImage2D(GL_TEXTURE_2D, 0, GL_DEPTH_COMPONENT24, SHADOW_W, SHADOW_H, 0,
             GL_DEPTH_COMPONENT, GL_FLOAT, nullptr);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);

// Anything outside the light's frustum must be treated as LIT, not shadowed
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_BORDER);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_BORDER);
float border[] = {1.0f, 1.0f, 1.0f, 1.0f};
glTexParameterfv(GL_TEXTURE_2D, GL_TEXTURE_BORDER_COLOR, border);

glBindFramebuffer(GL_FRAMEBUFFER, depthMapFBO);
glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, depthMap, 0);
glDrawBuffer(GL_NONE);      // no colour attachment...
glReadBuffer(GL_NONE);      // ...and the FBO is still complete
glBindFramebuffer(GL_FRAMEBUFFER, 0);`}</CodeBlock>

      <H2>{tx(t, "oglShadow_matrixTitle", "The light-space matrix")}</H2>
      <p>
        {tx(t, "oglShadow_matrixBody",
          "A directional light has no position, so you place a virtual camera somewhere along its direction and use an orthographic projection — parallel rays, parallel frustum. A spotlight uses a perspective projection instead, matching its cone."
        )}
      </p>

      <CodeBlock lang="cpp" filename="light_space.cpp" t={t}>{`// Directional light: orthographic. Fit the box tightly around the scene —
// a loose box wastes shadow-map resolution and makes everything blocky.
glm::mat4 lightProjection = glm::ortho(-10.0f, 10.0f, -10.0f, 10.0f, 1.0f, 25.0f);
glm::mat4 lightView       = glm::lookAt(lightPos,
                                        glm::vec3(0.0f),
                                        glm::vec3(0.0f, 1.0f, 0.0f));
glm::mat4 lightSpaceMatrix = lightProjection * lightView;

// Pass 1
glViewport(0, 0, SHADOW_W, SHADOW_H);      // match the texture, not the window
glBindFramebuffer(GL_FRAMEBUFFER, depthMapFBO);
glClear(GL_DEPTH_BUFFER_BIT);
depthShader.use();
depthShader.setMat4("uLightSpace", lightSpaceMatrix);
renderScene(depthShader);

// Pass 2
glBindFramebuffer(GL_FRAMEBUFFER, 0);
glViewport(0, 0, windowWidth, windowHeight);
glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
mainShader.use();
mainShader.setMat4("uLightSpace", lightSpaceMatrix);
glActiveTexture(GL_TEXTURE1);
glBindTexture(GL_TEXTURE_2D, depthMap);
renderScene(mainShader);`}</CodeBlock>

      <H2>{tx(t, "oglShadow_sampleTitle", "The shadow test")}</H2>
      <CodeBlock lang="glsl" filename="shadow.frag" t={t}>{`float shadowFactor(vec4 fragPosLightSpace, vec3 normal, vec3 lightDir) {
    // Manual perspective divide — gl_Position does this automatically, we must not
    vec3 proj = fragPosLightSpace.xyz / fragPosLightSpace.w;
    proj = proj * 0.5 + 0.5;                    // NDC [-1,1] to texture [0,1]

    if (proj.z > 1.0) return 0.0;               // beyond the far plane: lit

    float currentDepth = proj.z;

    // Slope-scaled bias: steep surfaces need more
    float bias = max(0.05 * (1.0 - dot(normal, lightDir)), 0.005);

    // PCF — average a 3x3 neighbourhood to soften the edge
    float shadow = 0.0;
    vec2 texelSize = 1.0 / textureSize(uShadowMap, 0);
    for (int x = -1; x <= 1; ++x)
        for (int y = -1; y <= 1; ++y) {
            float pcf = texture(uShadowMap, proj.xy + vec2(x, y) * texelSize).r;
            shadow += (currentDepth - bias > pcf) ? 1.0 : 0.0;
        }
    return shadow / 9.0;
}

// In main(): lighting = ambient + (1.0 - shadowFactor(...)) * (diffuse + specular);`}</CodeBlock>

      <H2>{tx(t, "oglShadow_artifactsTitle", "The three artefacts")}</H2>
      <LessonTable
        headers={[tx(t, "oglShadow_a0", "Artefact"), tx(t, "oglShadow_a1", "Looks like"), tx(t, "oglShadow_a2", "Fix")]}
        rows={[
          [tx(t, "oglShadow_ar1", "Shadow acne"),  tx(t, "oglShadow_al1", "Striped moiré on lit surfaces"),      tx(t, "oglShadow_af1", "Depth bias, scaled by surface slope")],
          [tx(t, "oglShadow_ar2", "Peter-panning"),tx(t, "oglShadow_al2", "Shadow detached from the object"),    tx(t, "oglShadow_af2", "Too much bias. Reduce it, or cull front faces in pass 1")],
          [tx(t, "oglShadow_ar3", "Hard aliasing"),tx(t, "oglShadow_al3", "Blocky stair-stepped shadow edges"),  tx(t, "oglShadow_af3", "PCF, a larger map, or cascaded shadow maps")],
        ]}
      />

      <Callout type="warn" t={t}>
        {tx(t, "oglShadow_biasWarn",
          "Acne and peter-panning are the same knob pulled in opposite directions, and you will spend real time balancing them. Acne happens because one shadow-map texel covers many screen fragments, so a sloped surface partially shadows itself. Too much bias to hide it lifts the shadow off the ground. Front-face culling during the depth pass sidesteps the trade-off for closed geometry."
        )}
      </Callout>

      <Callout type="tip" t={t}>
        {tx(t, "oglShadow_csmTip",
          "For an outdoor scene with a sun, a single shadow map cannot cover the whole view with usable resolution. The production answer is cascaded shadow maps: split the camera frustum into several depth ranges and give each its own map, so nearby geometry gets a tight high-resolution box. Everything you learned here applies per cascade."
        )}
      </Callout>

    </article>
  );
}
