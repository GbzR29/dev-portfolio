// src/lib/tracks/opengl/chapters/post/ssao.tsx
"use client";

// SSAO (Post-Processing & Effects): ambient occlusion from the depth buffer —
// sample kernel, noise rotation, the per-sample test, range check and blur.

import { CodeBlock, Callout, H2 } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { aoNumbers, kernelScaleNumbers } from "../../live/ssao";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { SsaoKernelFigure } from "@/components/lesson/figures/post/SsaoKernelFigure";
import { SsaoFigure } from "@/components/lesson/figures/post/SsaoFigure";

const r = String.raw;

export function SsaoContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglSsao_intro",
          "The ambient term from the Phong chapter is a constant: every point receives the same amount of \"light from everywhere\". In reality, creases, corners and the space under a sofa receive less, because nearby geometry blocks most of the sky they could see. Ambient occlusion estimates how much is blocked. Screen-space ambient occlusion (Crytek, 2007) estimates it from the depth buffer alone, every frame.")}
      </Lead>

      <Goals t={t} id="oglSsao" items={[
        "Explain what ambient occlusion measures.",
        "Estimate it from the depth buffer with a kernel of samples.",
        "Blur the result and use it in the lighting.",
      ]} />

      <H2>{tx(t, "oglSsao_defTitle", "What ambient occlusion measures")}</H2>
      <Equation label={tx(t, "oglSsao_defLabel", "Ambient occlusion")}
        where={[
          [r`V(p, \omega)`, tx(t, "oglSsao_wV", "visibility: 1 if a ray from p in direction ω escapes, 0 if nearby geometry blocks it")],
          [r`\frac{1}{\pi}`, tx(t, "oglSsao_wPi", "normalises the cosine-weighted integral so an unblocked point gets exactly 1")],
          [r`\Omega`, tx(t, "oglSsao_wOmega", "the hemisphere of directions above the surface at p")],
          [r`\dotp{\vN}{\omega}`, tx(t, "oglSsao_wCos", "the cosine between the normal and the direction: light from straight above counts fully, light from the horizon almost not at all")],
          [r`k_a\,c`, tx(t, "oglSsao_wKa", "the constant ambient term of the Phong chapter: ambient strength times surface colour")],
        ]}
        note={tx(t, "oglSsao_defNote", "It is the reflectance-equation hemisphere from the PBR chapters again, with the light replaced by a yes/no visibility test. Offline renderers trace rays; SSAO fakes the rays with the depth buffer.")}
        words={tx(t, "oglSsao_defWords", "Look out from the point in every direction of the hemisphere above it, counting directions near the normal more. A is the share of those directions that reach the open sky. The ambient light is multiplied by that share.")}>
        {r`A(p) = \frac{1}{\pi}\int_{\Omega} V(p, \omega)\,(\dotp{\vN}{\omega})\,d\omega \qquad L_{ambient} = A(p)\;k_a\,c`}
      </Equation>
      <Derivation t={t} label={tx(t, "oglSsao_aoDer", "Two checks: an open point, and a point against a wall")}
        steps={[
          { full: true, tex: r`V = 1 \;\Rightarrow\; A = \frac{1}{\pi}\int_{\Omega} \cos\theta\,d\omega = \frac{1}{\pi}\int_0^{2\pi}\!\!\int_0^{\pi/2} \cos\theta\,\sin\theta\,d\theta\,d\varphi`,
            why: tx(t, "oglSsao_ad1", "nothing blocks the sky. Write the hemisphere in angles: θ from the normal, φ around it, and dω = sin θ dθ dφ (PBR Theory)") },
          { full: true, tex: r`\int_0^{\pi/2} \cos\theta\,\sin\theta\,d\theta = \Big[\tfrac12 \sin^2\theta\Big]_0^{\pi/2} = \tfrac12 \;\Rightarrow\; A = \frac{1}{\pi}\cdot 2\pi \cdot \tfrac12 = 1`,
            why: tx(t, "oglSsao_ad2", "the θ integral is ½ and the φ integral is 2π, so the 1/π in front makes an open point exactly 1") },
          { full: true, tex: r`\varphi \in [0, \pi] \text{ ${tx(t, "oglSsao_ad3t", "blocked")}} \;\Rightarrow\; A = \frac{1}{\pi}\cdot \pi \cdot \tfrac12 = \tfrac12`,
            why: tx(t, "oglSsao_ad3", "a tall wall right next to the point blocks every direction on its side: half of the φ range. The θ integral is still ½, so half the ambient light remains") },
        ]} />

      <H2>{tx(t, "oglSsao_ideaTitle", "The screen-space trick")}</H2>
      <p>
        {tx(t, "oglSsao_ideaBody",
          "Put some sample points in a small hemisphere around the pixel's surface position and test each one. If the depth buffer says there is something closer to the camera at that sample's screen position, the sample is \"inside\" geometry and counts as occluded. The fraction of free samples approximates the integral.")}
      </p>
      <SsaoKernelFigure t={t} />

      <H2>{tx(t, "oglSsao_gbufTitle", "1 · A G-buffer in view space")}</H2>
      <p>
        {tx(t, "oglSsao_gbufBody",
          "SSAO needs each pixel's position and normal. The deferred-shading G-buffer already has them. Store them in view space, where the camera sits at the origin looking down −Z, so the depth comparison is just a comparison of z values:")}
      </p>
      <CodeBlock lang="glsl" filename="geometry.frag" t={t}>{`layout (location = 0) out vec4 gPosition;   // RGBA16F — view-space position
layout (location = 1) out vec4 gNormal;     // RGBA16F — view-space normal
layout (location = 2) out vec4 gAlbedo;

in vec3 FragPos;     // = (view * model * vec4(aPos, 1.0)).xyz
in vec3 Normal;      // = mat3(transpose(inverse(view * model))) * aNormal

void main() {
    gPosition = vec4(FragPos, 1.0);
    gNormal   = vec4(normalize(Normal), 1.0);
    gAlbedo   = vec4(albedo, 1.0);
}`}</CodeBlock>

      <H2>{tx(t, "oglSsao_kernelTitle", "2 · The sample kernel")}</H2>
      <p>
        {tx(t, "oglSsao_kernelBody",
          "Generate N points once on the CPU, inside a unit hemisphere around +Z (tangent space). Occluders close to the surface matter most, so the points are pushed toward the centre with an accelerating curve:")}
      </p>
      <Equation label={tx(t, "oglSsao_scaleLabel", "Sample distribution")}
        where={[
          [r`i`, tx(t, "oglSsao_wI", "sample index, 0 … N−1")],
          [r`N`, tx(t, "oglSsao_wN", "the number of samples, 64 in the code below")],
          [r`\xi_1 \dots \xi_4`, tx(t, "oglSsao_wXi", "four fresh random numbers in [0, 1). ·2 − 1 spreads x and y over [−1, 1]; z stays ≥ 0, so the point is above the surface")],
          [r`\operatorname{lerp}(a, b, f)`, tx(t, "oglSsao_wLerp", "a + (b − a)·f: from a at f = 0 to b at f = 1")],
        ]}
        words={tx(t, "oglSsao_scaleWords", "Pick a random direction above the surface and a random length up to 1. Then shrink it more for the first samples: the first one reaches at most 10% of the radius, the last one the full radius, along a curve that keeps most samples close in.")}>
        {r`\begin{aligned} \mathbf{s}_i = {} &\operatorname{normalize}(\xi_1 \cdot 2 - 1,\ \xi_2 \cdot 2 - 1,\ \xi_3)\cdot \xi_4 \\ &\cdot \operatorname{lerp}\!\Big(0.1,\ 1.0,\ \big(\tfrac{i}{N}\big)^2\Big) \end{aligned}`}
      </Equation>
      <LiveFormula label={tx(t, "oglSsao_liveScale", "Try it: how far may sample i reach?")}
        tex={r`\operatorname{lerp}\!\Big(0.1,\ 1.0,\ \big(\tfrac{i}{N}\big)^2\Big)`}
        vars={[
          { id: "i", label: "i", min: 0, max: 63, step: 1, value: 32, fmt: v => String(v) },
          { id: "N", label: "N", min: 64, max: 256, step: 64, value: 64, fmt: v => String(v) },
        ]}
        compute={kernelScaleNumbers(t)}
        note={tx(t, "oglSsao_liveScaleNote", "Sample 32 of 64 sits halfway through the list but may reach only about a third of the radius (0.325). Two thirds of all samples stay within half the radius, whatever N is, and the random length ξ₄ pulls them in further.")} />
      <CodeBlock lang="cpp" filename="ssao_kernel.cpp" t={t}>{`std::uniform_real_distribution<float> rnd(0.0f, 1.0f);
std::default_random_engine gen;
std::vector<glm::vec3> kernel;
for (unsigned i = 0; i < 64; ++i) {
    glm::vec3 s(rnd(gen) * 2.0f - 1.0f, rnd(gen) * 2.0f - 1.0f, rnd(gen));   // z ≥ 0: hemisphere
    s = glm::normalize(s) * rnd(gen);
    float scale = float(i) / 64.0f;
    scale = glm::mix(0.1f, 1.0f, scale * scale);                             // cluster near the origin
    kernel.push_back(s * scale);
}

// 4×4 random rotations around Z (tangent space), tiled over the screen
std::vector<glm::vec3> noise;
for (unsigned i = 0; i < 16; ++i)
    noise.push_back({rnd(gen) * 2.0f - 1.0f, rnd(gen) * 2.0f - 1.0f, 0.0f});
glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA16F, 4, 4, 0, GL_RGB, GL_FLOAT, noise.data());
// GL_REPEAT + GL_NEAREST: the tile repeats every 4 pixels`}</CodeBlock>
      <p>
        {tx(t, "oglSsao_noiseBody",
          "With 64 samples per pixel, banding would appear: every pixel uses exactly the same pattern. Rotating the kernel by a random angle per pixel, from a tiled 4×4 noise texture, turns the banding into fine noise that a 4×4 blur removes completely.")}
      </p>
      <Equation label={tx(t, "oglSsao_tbnLabel", "A random tangent frame (Gram-Schmidt)")}
        note={tx(t, "oglSsao_tbnNote", "Subtract from the random vector its component along n, and what remains is perpendicular to n. That gives a tangent frame per pixel without any mesh tangents.")}
        glsl="vec3 T = normalize(rvec - n * dot(rvec, n));  vec3 B = cross(n, T);  mat3 TBN = mat3(T, B, n);"
        where={[
          [r`\mathbf{r}`, tx(t, "oglSsao_wRvec", "this pixel's random vector from the noise texture, lying in the xy plane")],
          [r`\vN`, tx(t, "oglSsao_wNrm", "the pixel's unit normal, from the G-buffer")],
          [r`\mathbf{t},\ \mathbf{b}`, tx(t, "oglSsao_wTB", "tangent and bitangent: two unit vectors along the surface, perpendicular to n and to each other")],
          [r`TBN`, tx(t, "oglSsao_wTBN", "the matrix with t, b, n as columns: it turns a kernel sample from tangent space (z = up from the surface) into view space")],
        ]}
        words={tx(t, "oglSsao_tbnWords", "Remove from the random vector the part that points along the normal, and make what is left length 1: that is the tangent. The cross product of the normal and the tangent gives the third axis.")}>
        {r`\mathbf{t} = \frac{\mathbf{r} - \vN\,(\dotp{\mathbf{r}}{\vN})}{\lVert \mathbf{r} - \vN\,(\dotp{\mathbf{r}}{\vN}) \rVert} \qquad \mathbf{b} = \vN \times \mathbf{t} \qquad TBN = [\,\mathbf{t}\ \ \mathbf{b}\ \ \vN\,]`}
      </Equation>
      <Derivation t={t} label={tx(t, "oglSsao_gsDer", "Check: what is left really is perpendicular to n")}
        steps={[
          { tex: r`\big(\mathbf{r} - \vN\,(\dotp{\mathbf{r}}{\vN})\big)\cdot\vN`,
            why: tx(t, "oglSsao_gs1", "two vectors are perpendicular when their dot product is 0") },
          { tex: r`= \dotp{\mathbf{r}}{\vN} - (\dotp{\mathbf{r}}{\vN})\,(\dotp{\vN}{\vN})`,
            why: tx(t, "oglSsao_gs2", "the dot product spreads over the subtraction, and the number r·n comes out in front") },
          { tex: r`= \dotp{\mathbf{r}}{\vN} - \dotp{\mathbf{r}}{\vN} = 0`,
            why: tx(t, "oglSsao_gs3", "n has length 1, so n·n = 1. Dividing by the length afterwards only rescales, it keeps the vector perpendicular") },
        ]} />

      <H2>{tx(t, "oglSsao_passTitle", "3 · The SSAO pass")}</H2>
      <Equation label={tx(t, "oglSsao_testLabel", "Per sample: place, project, compare")}
        where={[
          [r`P`, tx(t, "oglSsao_wP", "projection matrix — takes the view-space sample to clip space")],
          [r`z_{buf}`, tx(t, "oglSsao_wZ", "view-space z stored in the G-buffer at the sample's screen position")],
          [r`b`, tx(t, "oglSsao_wB", "bias against self-occlusion (acne), as in shadow mapping")],
          [r`\mathbf{p}`, tx(t, "oglSsao_wPpos", "the pixel's view-space position, from the G-buffer")],
          [r`R`, tx(t, "oglSsao_wRad", "the kernel radius in view-space units (0.5 in the code)")],
          [r`\mathbf{s}_v`, tx(t, "oglSsao_wSv", "the sample placed around p in view space; s_{v,z} is its depth")],
          [r`[\,\cdot\,]`, tx(t, "oglSsao_wIver", "1 if the statement inside is true, 0 if not")],
        ]}
        words={tx(t, "oglSsao_testWords", "Turn the kernel sample to face along the normal, scale it to the radius and put it next to the pixel. Project it to find which pixel it falls on, and read the depth stored there. If the stored surface is in front of the sample, the sample is buried: count it as occluded.")}>
        {r`\begin{gathered} \mathbf{s}_v = \mathbf{p} + TBN\,\mathbf{s}_i\,R \qquad uv = \frac{(P\,\mathbf{s}_v)_{xy}}{(P\,\mathbf{s}_v)_w}\cdot 0.5 + 0.5 \\[4pt] o_i = \big[\,z_{buf}(uv) \ge s_{v,z} + b\,\big] \end{gathered}`}
      </Equation>
      <Equation label={tx(t, "oglSsao_rangeLabel", "Range check and the final factor")}
        where={[
          [r`w_i`, tx(t, "oglSsao_wWi", "how much sample i's occluder counts: 1 when it is within R in depth, falling toward 0 the farther behind or in front it is")],
          [r`z_p`, tx(t, "oglSsao_wZp", "the depth of the pixel itself")],
          [r`o_i`, tx(t, "oglSsao_wOi", "1 if sample i is occluded, 0 if not (the test above)")],
          [r`k`, tx(t, "oglSsao_wPow", "an artistic power: k > 1 darkens the creases more")],
        ]}
        note={tx(t, "oglSsao_rangeNote", "The range check fades out occluders much farther away in depth than the radius. Without it, a floor pixel next to a tall box is darkened by the box's front face, even though that face is metres away: a dark halo.")}
        words={tx(t, "oglSsao_rangeWords", "Count the occluded samples, but let occluders that are far away in depth count less. Divide by the number of samples to get the blocked share, subtract it from 1, and raise the result to a power to tune the look.")}>
        {r`\begin{gathered} w_i = \operatorname{smoothstep}\!\Big(0,\,1,\,\frac{R}{\lvert z_p - z_{buf} \rvert}\Big) \\[4pt] A = \Big(1 - \frac{1}{N}\sum_{i=1}^{N} o_i\,w_i\Big)^{k} \end{gathered}`}
      </Equation>
      <LiveFormula label={tx(t, "oglSsao_liveAo", "Try it: m of 64 samples occluded, by geometry this far away")}
        tex={r`w = \operatorname{smoothstep}\!\Big(0,\,1,\,\frac{R}{\lvert \Delta z \rvert}\Big) \qquad A = \Big(1 - \frac{m\,w}{64}\Big)^{k}`}
        vars={[
          { id: "m", label: "m", min: 0, max: 64, step: 1, value: 24, fmt: v => String(v) },
          { id: "gap", label: <>|Δz| / R</>, min: 0.25, max: 6, step: 0.25, value: 1, fmt: v => v.toFixed(2) },
          { id: "k", label: "k", min: 1, max: 4, step: 1, value: 1, fmt: v => String(v) },
        ]}
        where={[[r`\lvert \Delta z \rvert = \lvert z_p - z_{buf} \rvert`, tx(t, "oglSsao_wDz", "how far the occluder is from the pixel in depth, here the same for all m samples")]]}
        compute={aoNumbers(t)}
        note={tx(t, "oglSsao_liveAoNote", "A crease with 24 occluded samples keeps 62.5% of its ambient light. Move the occluder to 4R behind (a box metres away) and w drops to 0.16: the pixel keeps 94%, so no halo. k = 2 turns the same 62.5% into 39%.")} />
      <CodeBlock lang="glsl" filename="ssao.frag" t={t}>{`uniform sampler2D gPosition, gNormal, texNoise;
uniform vec3 samples[64];
uniform mat4 projection;
const vec2 noiseScale = vec2(1920.0 / 4.0, 1080.0 / 4.0);   // screen / noise size
const float radius = 0.5, bias = 0.025;

void main() {
    vec3 fragPos   = texture(gPosition, TexCoords).xyz;
    vec3 normal    = normalize(texture(gNormal, TexCoords).rgb);
    vec3 randomVec = normalize(texture(texNoise, TexCoords * noiseScale).xyz);
    vec3 tangent   = normalize(randomVec - normal * dot(randomVec, normal));
    vec3 bitangent = cross(normal, tangent);
    mat3 TBN       = mat3(tangent, bitangent, normal);

    float occlusion = 0.0;
    for (int i = 0; i < 64; ++i) {
        vec3 samplePos = fragPos + TBN * samples[i] * radius;       // view space
        vec4 offset = projection * vec4(samplePos, 1.0);            // → clip
        offset.xy = offset.xy / offset.w * 0.5 + 0.5;               // → [0, 1]
        float sampleDepth = texture(gPosition, offset.xy).z;
        float rangeCheck = smoothstep(0.0, 1.0, radius / abs(fragPos.z - sampleDepth));
        occlusion += (sampleDepth >= samplePos.z + bias ? 1.0 : 0.0) * rangeCheck;
    }
    FragColor = 1.0 - occlusion / 64.0;       // a single-channel GL_RED target is enough
}`}</CodeBlock>

      <H2>{tx(t, "oglSsao_blurTitle", "4 · Blur, then light")}</H2>
      <CodeBlock lang="glsl" filename="ssao_blur.frag + lighting.frag" t={t}>{`// blur: average the 4×4 block the noise tile repeats over
vec2 texel = 1.0 / vec2(textureSize(ssaoInput, 0));
float result = 0.0;
for (int x = -2; x < 2; ++x)
    for (int y = -2; y < 2; ++y)
        result += texture(ssaoInput, TexCoords + vec2(x, y) * texel).r;
FragColor = result / 16.0;

// lighting: AO only scales the ambient term
float AO = texture(ssaoBlurred, TexCoords).r;
vec3 ambient = vec3(0.3 * albedo * AO);
vec3 lighting = ambient + diffuse + specular;   // direct light is not occluded by AO`}</CodeBlock>
      <SsaoFigure t={t} />

      <Callout type="info" t={t}>
        {tx(t, "oglSsao_variants",
          "SSAO has well-known successors. HBAO (NVIDIA) marches along screen-space directions and finds the horizon angle, which is closer to the true integral. GTAO (Activision) adds a cosine weighting and multi-bounce correction, and it is what most current engines ship. All of them keep the same core idea: reconstruct occlusion from the depth buffer, usually at half resolution, followed by a depth-aware (bilateral) blur so the AO does not bleed across object edges.")}
      </Callout>
      <Callout type="warn" t={t}>
        {tx(t, "oglSsao_pitfalls",
          "Classic SSAO bugs: positions stored in an 8-bit texture, which gives blocky, banded AO (use RGBA16F or reconstruct from the depth buffer); a missing bias, which makes flat surfaces grey and noisy; a radius in the wrong units (it is in view-space metres, so change the scene scale and you must change it too); applying AO to direct light, which draws black outlines around sunlit objects. SSAO also cannot see what is off screen or hidden behind the front surface, so occlusion appears and vanishes at screen edges.")}
      </Callout>

      <KeyIdeas t={t} id="oglSsao" items={[
        "AO = cosine-weighted fraction of the hemisphere that is not blocked; it scales only the ambient term.",
        "SSAO approximates it with N kernel samples tested against the depth buffer (view-space z comparison).",
        "Kernel samples are clustered near the surface; a tiled 4×4 noise rotates them per pixel, and a 4×4 blur removes the noise.",
        "The range check stops distant geometry from creating dark halos; the bias prevents self-occlusion.",
        "Modern variants (HBAO, GTAO) keep the idea and improve the estimator.",
      ]} />
    </Article>
  );
}
