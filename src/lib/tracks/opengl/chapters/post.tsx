// src/lib/tracks/opengl/chapters/post.tsx
"use client";

// The "Post-Processing & Effects" section: Post-Processing → SSAO → Parallax Mapping → Anti-Aliasing.

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation, Tex } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "./lighting-advanced";
import { KernelFigure } from "@/components/lesson/figures/post/KernelFigure";
import { PostFxFigure } from "@/components/lesson/figures/post/PostFxFigure";
import { SsaoKernelFigure } from "@/components/lesson/figures/post/SsaoKernelFigure";
import { SsaoFigure } from "@/components/lesson/figures/post/SsaoFigure";
import { ParallaxRayFigure } from "@/components/lesson/figures/post/ParallaxRayFigure";
import { ParallaxFigure } from "@/components/lesson/figures/post/ParallaxFigure";
import { SamplePatternFigure } from "@/components/lesson/figures/post/SamplePatternFigure";
import { AaCompareFigure } from "@/components/lesson/figures/post/AaCompareFigure";

const r = String.raw;

// ═════════════════════════════════════════════════════════════════════════════
// Post-processing
// ═════════════════════════════════════════════════════════════════════════════

export function PostProcessingContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglPost_intro",
          "Render the scene into a texture, then draw one fullscreen triangle whose fragment shader reads that texture. Every pixel of the output can now look at any pixel of the input. That one trick, from the Framebuffers chapter, powers almost every modern screen effect: blur, bloom, colour grading, depth of field, motion blur, outlines, film grain.")}
      </Lead>

      <H2>{tx(t, "oglPost_pointTitle", "Point operations: one pixel in, one pixel out")}</H2>
      <p>
        {tx(t, "oglPost_pointBody",
          "The simplest effects only look at the pixel they are writing. They are pure functions of a colour, so the order in which you chain them matters, but they cost almost nothing:")}
      </p>
      <Equation label={tx(t, "oglPost_lumaLabel", "Luminance (Rec. 709) — greyscale")}
        note={tx(t, "oglPost_lumaNote", "The eye is far more sensitive to green than blue, so a plain average (r + g + b)/3 makes blue skies look too bright in greyscale.")}
        glsl="float Y = dot(c, vec3(0.2126, 0.7152, 0.0722));">
        {r`Y = 0.2126\,\red{R} + 0.7152\,\green{G} + 0.0722\,\blue{B}`}
      </Equation>
      <Equation label={tx(t, "oglPost_gradeLabel", "Exposure, saturation and contrast")}
        where={[
          [r`e`, tx(t, "oglPost_wE", "exposure — a plain multiplier")],
          [r`s`, tx(t, "oglPost_wS", "saturation: 0 = greyscale, 1 = unchanged, > 1 = more vivid (extrapolating away from grey)")],
          [r`k`, tx(t, "oglPost_wK", "contrast: pushes values away from mid-grey 0.5")],
        ]}
        glsl="c *= e;  c = mix(vec3(dot(c, LUMA)), c, s);  c = (c - 0.5) * k + 0.5;">
        {r`c' = e\,c \qquad c'' = Y + s\,(c' - Y) \qquad c''' = k\,(c'' - 0.5) + 0.5`}
      </Equation>
      <p>
        {tx(t, "oglPost_invert", "Inversion is 1 − c. Posterising quantises each channel to n levels with ")}
        <Tex>{r`\lfloor c\,n + 0.5 \rfloor / n`}</Tex>
        {tx(t, "oglPost_invert2", ". Sepia is a 3×3 matrix applied to the colour. All of these are one line of GLSL.")}
      </p>

      <H2>{tx(t, "oglPost_convTitle", "Convolution: looking at the neighbours")}</H2>
      <p>
        {tx(t, "oglPost_convBody",
          "Blur, sharpen and edge detection all have the same shape. For each output pixel, read a small neighbourhood of input pixels, multiply each by a weight from a kernel, and add them up. That is a discrete 2D convolution:")}
      </p>
      <Equation label={tx(t, "oglPost_convLabel", "Discrete convolution with a (2r+1)×(2r+1) kernel")}
        where={[
          [r`I`, tx(t, "oglPost_wI", "the input image (the scene texture)")],
          [r`K`, tx(t, "oglPost_wKer", "the kernel — a small grid of weights")],
        ]}
        note={tx(t, "oglPost_convNote", "Strictly, a convolution flips the kernel; for the symmetric kernels used here it makes no difference, and shaders just multiply in place (a correlation).")}>
        {r`(I * K)(x, y) = \sum_{j=-r}^{r}\sum_{i=-r}^{r} I(x + i,\; y + j)\; K(i, j)`}
      </Equation>
      <KernelFigure t={t} />
      <Equation label={tx(t, "oglPost_kernelsLabel", "Classic 3×3 kernels")}
        notes={[
          tx(t, "oglPost_kn1", "Blur kernels sum to 1, so a flat area keeps its brightness."),
          tx(t, "oglPost_kn2", "Sharpen = identity + (identity − blur): add back the detail a blur would remove."),
          tx(t, "oglPost_kn3", "Edge kernels sum to 0: flat areas become black, and only change survives."),
        ]}>
        {r`\underbrace{\tfrac{1}{16}\begin{bmatrix}1&2&1\\2&4&2\\1&2&1\end{bmatrix}}_{\text{Gaussian blur}}
\quad
\underbrace{\begin{bmatrix}0&-1&0\\-1&5&-1\\0&-1&0\end{bmatrix}}_{\text{sharpen}}
\quad
\underbrace{\begin{bmatrix}1&1&1\\1&-8&1\\1&1&1\end{bmatrix}}_{\text{Laplacian edges}}`}
      </Equation>
      <Equation label={tx(t, "oglPost_sobelLabel", "Sobel — edges with a direction")}
        note={tx(t, "oglPost_sobelNote", "Gx responds to vertical edges, Gy to horizontal ones. Their magnitude is the edge strength, and atan2(Gy, Gx) its direction. Outline shaders run Sobel on depth and normals instead of colour, so they catch shape edges and ignore texture detail.")}>
        {r`G_x = \begin{bmatrix}-1&0&1\\-2&0&2\\-1&0&1\end{bmatrix} * I \qquad G_y = \begin{bmatrix}-1&-2&-1\\0&0&0\\1&2&1\end{bmatrix} * I \qquad \lVert G \rVert = \sqrt{G_x^2 + G_y^2}`}
      </Equation>
      <CodeBlock lang="glsl" filename="kernel.frag" t={t}>{`uniform sampler2D screen;
uniform vec2 texel;            // 1.0 / textureSize(screen, 0)
uniform float kernel[9];

void main() {
    vec3 sum = vec3(0.0);
    for (int j = -1; j <= 1; ++j)
        for (int i = -1; i <= 1; ++i)
            sum += texture(screen, uv + vec2(i, -j) * texel).rgb * kernel[(j + 1) * 3 + (i + 1)];
    FragColor = vec4(sum, 1.0);
}`}</CodeBlock>

      <H2>{tx(t, "oglPost_gaussTitle", "Gaussian blur, and why it is two passes")}</H2>
      <Equation label={tx(t, "oglPost_gaussLabel", "The Gaussian and its separability")}
        where={[[r`\sigma`, tx(t, "oglPost_wSigma", "standard deviation — the blur radius; weights past 3σ are negligible")]]}
        note={tx(t, "oglPost_gaussNote", "Because G(x, y) = G(x)·G(y), a 2D blur equals a horizontal 1D blur followed by a vertical one. For radius r that is 2(2r + 1) reads per pixel instead of (2r + 1)²: 50 instead of 625 for r = 12.")}>
        {r`G(x) = \frac{1}{\sqrt{2\pi}\,\sigma}\,e^{-\frac{x^2}{2\sigma^2}} \qquad G(x, y) = G(x)\,G(y) = \frac{1}{2\pi\sigma^2}\,e^{-\frac{x^2 + y^2}{2\sigma^2}}`}
      </Equation>
      <CodeBlock lang="cpp" filename="pingpong.cpp" t={t}>{`// scene → A (horizontal) → B (vertical)
blurShader.use();
glBindFramebuffer(GL_FRAMEBUFFER, fboA);
glBindTexture(GL_TEXTURE_2D, sceneTex);
blurShader.setVec2("dir", 1.0f / width, 0.0f);
drawFullscreenTriangle();

glBindFramebuffer(GL_FRAMEBUFFER, fboB);
glBindTexture(GL_TEXTURE_2D, texA);
blurShader.setVec2("dir", 0.0f, 1.0f / height);
drawFullscreenTriangle();
// never read and write the same texture in one pass: that is a feedback loop, undefined results`}</CodeBlock>
      <Callout type="tip" t={t}>
        {tx(t, "oglPost_linearTip",
          "Two tricks halve the cost again. With GL_LINEAR filtering, one fetch placed between two texels returns their weighted average, so two taps cost one read. And blurring at half or quarter resolution is nearly invisible, because a blur removes exactly the high frequencies a smaller buffer cannot hold.")}
      </Callout>

      <H2>{tx(t, "oglPost_lensTitle", "Lens and film effects")}</H2>
      <Equation label={tx(t, "oglPost_lensLabel", "Vignette, chromatic aberration, pixelation")}
        where={[
          [r`d = \lVert uv - (0.5, 0.5) \rVert`, tx(t, "oglPost_wD", "distance from the screen centre")],
          [r`a`, tx(t, "oglPost_wA", "aberration strength — R and B are read at slightly different radii, like a cheap lens")],
          [r`p`, tx(t, "oglPost_wP", "pixel block size, in texels")],
        ]}>
        {r`\begin{aligned}
&\text{vignette:} && c \mathrel{*}= 1 - v\cdot\operatorname{smoothstep}(r_0, r_1, d) \\
&\text{aberration:} && c = \big(\red{I_r}(uv + a\,\vec d),\ \green{I_g}(uv),\ \blue{I_b}(uv - a\,\vec d)\big) \\
&\text{pixelate:} && uv' = \big(\lfloor uv / p \rfloor + 0.5\big)\,p
\end{aligned}`}
      </Equation>
      <PostFxFigure t={t} />

      <H2>{tx(t, "oglPost_orderTitle", "Where everything goes in the frame")}</H2>
      <LessonTable
        headers={[tx(t, "oglPost_thStage", "Stage"), tx(t, "oglPost_thSpace", "Works in"), tx(t, "oglPost_thWhy", "Why here")]}
        rows={[
          [tx(t, "oglPost_s1", "SSAO, SSR, fog, depth of field"), "HDR, linear", tx(t, "oglPost_s1w", "need depth / normals; physical light values")],
          [tx(t, "oglPost_s2", "Bloom, motion blur"), "HDR, linear", tx(t, "oglPost_s2w", "energy above 1.0 must still exist to bleed")],
          [tx(t, "oglPost_s3", "Tone mapping + exposure"), "HDR → LDR", tx(t, "oglPost_s3w", "squeezes [0, ∞) into [0, 1]")],
          [tx(t, "oglPost_s4", "Colour grading (3D LUT), vignette, grain"), "LDR", tx(t, "oglPost_s4w", "artistic look on displayable values")],
          [tx(t, "oglPost_s5", "Gamma / sRGB encode"), "LDR", tx(t, "oglPost_s5w", "last colour-space step")],
          [tx(t, "oglPost_s6", "FXAA / SMAA"), "LDR, sRGB", tx(t, "oglPost_s6w", "edge detection works on perceived luma")],
          [tx(t, "oglPost_s7", "UI / HUD"), tx(t, "oglPost_s7s", "screen"), tx(t, "oglPost_s7w", "drawn after, so text is never blurred or graded")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "oglPost_lutNote",
          "Games do colour grading with a 3D lookup table. An artist grades a screenshot in Photoshop or DaVinci, the same adjustments are applied to a neutral 16×16×16 or 32×32×32 colour cube, and the shader then does a single texture(lut3D, colour). Any combination of curves, hue shifts and split toning costs one fetch.")}
      </Callout>
      <Callout type="warn" t={t}>
        {tx(t, "oglPost_pitfalls",
          "Common mistakes: kernel taps that read outside the texture wrap to the other side unless the texture is GL_CLAMP_TO_EDGE; hard-coding 1.0/300.0 as the texel size instead of 1/textureSize(), which breaks at every other resolution; forgetting to resize the post-processing targets with the window. Every fullscreen pass costs fill rate: at 4K that is 8.3 million fragments per pass.")}
      </Callout>

      <KeyIdeas t={t} id="oglPost" items={[
        "Post-processing = render to texture, then fullscreen passes that read it; cost scales with pixels, not scene complexity.",
        "Point operations (luma, grading, inversion) use one pixel; convolutions use a weighted neighbourhood.",
        "Blur kernels sum to 1, edge kernels to 0; Sobel gives edge strength and direction.",
        "The Gaussian is separable: two 1D passes instead of one 2D pass.",
        "Order matters: HDR effects → tone map → grading → gamma → AA → UI.",
      ]} />
    </Article>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SSAO
// ═════════════════════════════════════════════════════════════════════════════

export function SsaoContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglSsao_intro",
          "The ambient term from the Phong chapter is a constant: every point receives the same amount of \"light from everywhere\". In reality, creases, corners and the space under a sofa receive less, because nearby geometry blocks most of the sky they could see. Ambient occlusion estimates how much is blocked. Screen-space ambient occlusion (Crytek, 2007) estimates it from the depth buffer alone, every frame.")}
      </Lead>

      <H2>{tx(t, "oglSsao_defTitle", "What ambient occlusion measures")}</H2>
      <Equation label={tx(t, "oglSsao_defLabel", "Ambient occlusion")}
        where={[
          [r`V(p, \omega)`, tx(t, "oglSsao_wV", "visibility: 1 if a ray from p in direction ω escapes, 0 if nearby geometry blocks it")],
          [r`\frac{1}{\pi}`, tx(t, "oglSsao_wPi", "normalises the cosine-weighted integral so an unblocked point gets exactly 1")],
        ]}
        note={tx(t, "oglSsao_defNote", "It is the reflectance-equation hemisphere from the PBR chapters again, with the light replaced by a yes/no visibility test. Offline renderers trace rays; SSAO fakes the rays with the depth buffer.")}>
        {r`A(p) = \frac{1}{\pi}\int_{\Omega} V(p, \omega)\,(\dotp{\vN}{\omega})\,d\omega \qquad L_{ambient} = A(p)\;k_a\,c`}
      </Equation>

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
        where={[[r`i`, tx(t, "oglSsao_wI", "sample index, 0 … N−1")]]}>
        {r`\mathbf{s}_i = \operatorname{normalize}(\xi_1 \cdot 2 - 1,\ \xi_2 \cdot 2 - 1,\ \xi_3)\cdot \xi_4 \cdot \operatorname{lerp}\!\Big(0.1,\ 1.0,\ \big(\tfrac{i}{N}\big)^2\Big)`}
      </Equation>
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
        glsl="vec3 T = normalize(rvec - n * dot(rvec, n));  vec3 B = cross(n, T);  mat3 TBN = mat3(T, B, n);">
        {r`\mathbf{t} = \frac{\mathbf{r} - \vN\,(\dotp{\mathbf{r}}{\vN})}{\lVert \mathbf{r} - \vN\,(\dotp{\mathbf{r}}{\vN}) \rVert} \qquad \mathbf{b} = \vN \times \mathbf{t} \qquad TBN = [\,\mathbf{t}\ \ \mathbf{b}\ \ \vN\,]`}
      </Equation>

      <H2>{tx(t, "oglSsao_passTitle", "3 · The SSAO pass")}</H2>
      <Equation label={tx(t, "oglSsao_testLabel", "Per sample: place, project, compare")}
        where={[
          [r`P`, tx(t, "oglSsao_wP", "projection matrix — takes the view-space sample to clip space")],
          [r`z_{buf}`, tx(t, "oglSsao_wZ", "view-space z stored in the G-buffer at the sample's screen position")],
          [r`b`, tx(t, "oglSsao_wB", "bias against self-occlusion (acne), as in shadow mapping")],
        ]}>
        {r`\mathbf{s}_v = \mathbf{p} + TBN\,\mathbf{s}_i\,R \qquad uv = \frac{(P\,\mathbf{s}_v)_{xy}}{(P\,\mathbf{s}_v)_w}\cdot 0.5 + 0.5 \qquad o_i = \big[\,z_{buf}(uv) \ge s_{v,z} + b\,\big]`}
      </Equation>
      <Equation label={tx(t, "oglSsao_rangeLabel", "Range check and the final factor")}
        note={tx(t, "oglSsao_rangeNote", "The range check fades out occluders much farther away in depth than the radius. Without it, a floor pixel next to a tall box is darkened by the box's front face, even though that face is metres away: a dark halo.")}>
        {r`w_i = \operatorname{smoothstep}\!\Big(0,\,1,\,\frac{R}{\lvert z_p - z_{buf} \rvert}\Big) \qquad A = \Big(1 - \frac{1}{N}\sum_{i=1}^{N} o_i\,w_i\Big)^{k}`}
      </Equation>
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

// ═════════════════════════════════════════════════════════════════════════════
// Parallax mapping
// ═════════════════════════════════════════════════════════════════════════════

export function ParallaxContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglPar_intro",
          "Normal mapping fakes the lighting of a bumpy surface, but the texture stays glued to the flat polygon. Look at a brick wall at a grazing angle and the bricks should hide the mortar behind them, which normal mapping cannot do. Parallax mapping shifts the texture coordinates per pixel, using a depth map, to show what you would see if the surface really had depth.")}
      </Lead>

      <H2>{tx(t, "oglPar_ideaTitle", "The offset")}</H2>
      <p>
        {tx(t, "oglPar_ideaBody",
          "The view ray hits the flat polygon at texture coordinate A. On the real, bumpy surface it would have continued downward and hit a point further along, at B. If we knew B, sampling every texture (albedo, normal map) at B instead of A would produce the illusion. Plain parallax mapping estimates B with a single step: read the depth at A, and walk that far along the view direction projected onto the surface:")}
      </p>
      <Equation label={tx(t, "oglPar_offsetLabel", "Parallax offset in tangent space")}
        where={[
          [r`\vV`, tx(t, "oglPar_wV", "unit vector from the fragment toward the eye, in tangent space (z = along the normal)")],
          [r`d(A)`, tx(t, "oglPar_wD", "depth map value at A, in [0, 1] — white = deep")],
          [r`s`, tx(t, "oglPar_wS", "height scale: how deep 1.0 in the map is, in UV units (typically 0.02 – 0.1)")],
        ]}
        note={tx(t, "oglPar_offsetNote", "Dividing by V.z makes the offset grow at grazing angles, where a real surface would shift the most. Dropping that division gives \"parallax with offset limiting\": less accurate, but it cannot fly off at the horizon.")}
        glsl="vec2 p = V.xy / V.z * (texture(depthMap, uv).r * heightScale);  uv -= p;">
        {r`\mathbf{P} = \frac{\vV_{xy}}{\vV_z}\; d(A)\; s \qquad uv_B \approx uv_A - \mathbf{P}`}
      </Equation>
      <p>
        {tx(t, "oglPar_tangent",
          "The texture coordinates live in tangent space, so the view vector must be in tangent space too: the same TBN matrix as normal mapping, transposed (it is orthonormal, so transpose = inverse). Doing that in the vertex shader saves a matrix multiply per pixel.")}
      </p>
      <CodeBlock lang="glsl" filename="parallax.vert" t={t}>{`vec3 T = normalize(mat3(model) * aTangent);
vec3 N = normalize(mat3(model) * aNormal);
T = normalize(T - dot(T, N) * N);
vec3 B = cross(N, T);
mat3 TBN = transpose(mat3(T, B, N));          // world → tangent

vs_out.TangentViewPos = TBN * viewPos;
vs_out.TangentFragPos = TBN * vec3(model * vec4(aPos, 1.0));
vs_out.TangentLightPos = TBN * lightPos;`}</CodeBlock>

      <ParallaxRayFigure t={t} />

      <H2>{tx(t, "oglPar_steepTitle", "Steep parallax: march in layers")}</H2>
      <p>
        {tx(t, "oglPar_steepBody",
          "One step is too optimistic when the depth changes quickly. Steep parallax mapping walks along the ray in equal depth layers. At each step it moves the UV by P/n and goes down 1/n in depth, and it stops at the first layer that is below the depth map. Grazing views need more layers, so the count adapts to the angle:")}
      </p>
      <Equation label={tx(t, "oglPar_layersLabel", "Layer count and step")}
        glsl="float n = mix(maxLayers, minLayers, abs(dot(vec3(0,0,1), V)));  vec2 dUV = P / n;">
        {r`n = \operatorname{mix}(n_{max},\ n_{min},\ \lvert \vV_z \rvert) \qquad \Delta uv = \frac{\mathbf{P}}{n},\quad \Delta d = \frac{1}{n}`}
      </Equation>
      <CodeBlock lang="glsl" filename="steep_parallax.frag" t={t}>{`vec2 ParallaxMapping(vec2 texCoords, vec3 viewDir) {
    const float minLayers = 8.0, maxLayers = 32.0;
    float numLayers = mix(maxLayers, minLayers, abs(dot(vec3(0.0, 0.0, 1.0), viewDir)));
    float layerDepth = 1.0 / numLayers;
    vec2 P = viewDir.xy / viewDir.z * heightScale;
    vec2 deltaTexCoords = P / numLayers;

    float currentLayerDepth = 0.0;
    vec2  currentTexCoords  = texCoords;
    float currentDepthMapValue = texture(depthMap, currentTexCoords).r;
    while (currentLayerDepth < currentDepthMapValue) {
        currentTexCoords -= deltaTexCoords;
        currentDepthMapValue = texture(depthMap, currentTexCoords).r;
        currentLayerDepth += layerDepth;
    }
    return currentTexCoords;    // steep parallax stops here — POM continues below
}`}</CodeBlock>

      <H2>{tx(t, "oglPar_pomTitle", "Parallax occlusion mapping: interpolate")}</H2>
      <p>
        {tx(t, "oglPar_pomBody",
          "Steep parallax returns the first layer below the surface, so its answer snaps to the layer grid and shows slices. POM takes the last point above the surface and the first point below it. Between them the depth map is treated as a straight line, and it computes where the ray crosses that line:")}
      </p>
      <Equation label={tx(t, "oglPar_pomLabel", "Linear interpolation between the last two steps")}
        where={[
          [r`a = d(uv_k) - \ell_k`, tx(t, "oglPar_wA", "after: how far below the map the ray is at the first step past it (≤ 0)")],
          [r`b = d(uv_{k-1}) - \ell_{k-1}`, tx(t, "oglPar_wB", "before: how far above the map it was one step earlier (> 0)")],
        ]}>
        {r`w = \frac{a}{a - b} \qquad uv_{final} = w\,uv_{k-1} + (1 - w)\,uv_k`}
      </Equation>
      <CodeBlock lang="glsl" filename="pom.frag" t={t}>{`    vec2 prevTexCoords = currentTexCoords + deltaTexCoords;
    float afterDepth  = currentDepthMapValue - currentLayerDepth;
    float beforeDepth = texture(depthMap, prevTexCoords).r - currentLayerDepth + layerDepth;
    float weight = afterDepth / (afterDepth - beforeDepth);
    return prevTexCoords * weight + currentTexCoords * (1.0 - weight);
}

void main() {
    vec3 viewDir = normalize(fs_in.TangentViewPos - fs_in.TangentFragPos);
    vec2 uv = ParallaxMapping(fs_in.TexCoords, viewDir);
    if (uv.x > 1.0 || uv.y > 1.0 || uv.x < 0.0 || uv.y < 0.0) discard;   // clean edges
    vec3 normal = normalize(texture(normalMap, uv).rgb * 2.0 - 1.0);        // sample EVERYTHING at uv
    vec3 color  = texture(diffuseMap, uv).rgb;
    // … lighting as in Normal Mapping
}`}</CodeBlock>

      <ParallaxFigure t={t} />

      <LessonTable
        headers={[tx(t, "oglPar_thMethod", "Method"), tx(t, "oglPar_thReads", "Depth reads"), tx(t, "oglPar_thLooks", "Looks")]}
        rows={[
          [tx(t, "oglPar_m1", "Normal mapping"), "0", tx(t, "oglPar_m1l", "correct lighting, flat texture")],
          [tx(t, "oglPar_m2", "Parallax (one step)"), "1", tx(t, "oglPar_m2l", "good for shallow detail; swims at grazing angles")],
          [tx(t, "oglPar_m3", "Steep parallax"), "n (8 – 32)", tx(t, "oglPar_m3l", "real occlusion; visible layer slices")],
          [tx(t, "oglPar_m4", "POM"), "n + 1", tx(t, "oglPar_m4l", "smooth and solid — the standard choice")],
          [tx(t, "oglPar_m5", "Relief mapping / tessellation"), tx(t, "oglPar_m5r", "n + binary search / real geometry"), tx(t, "oglPar_m5l", "exact hit / true silhouettes")],
        ]}
      />
      <Callout type="warn" t={t}>
        {tx(t, "oglPar_pitfalls",
          "POM is still one flat polygon. Silhouettes and intersections with other geometry stay flat, and the depth buffer knows nothing about the fake depth. Sample the depth map with textureGrad or textureLod inside the loop: with dynamic loops the implicit derivatives are undefined, which on some GPUs gives sparkling pixels. A depth map where white means \"high\" (a height map) must be inverted first: use 1 − h.")}
      </Callout>

      <KeyIdeas t={t} id="oglPar" items={[
        "Parallax mapping moves the UV along the tangent-space view direction: P = V.xy / V.z · depth · scale.",
        "Every map (albedo, normal, roughness…) is then sampled at the shifted UV.",
        "Steep parallax marches in n depth layers (more at grazing angles) until it goes below the depth map.",
        "POM linearly interpolates between the last step above and the first below — smooth with few layers.",
        "It is a pixel illusion: silhouettes and depth-buffer intersections stay flat.",
      ]} />
    </Article>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Anti-aliasing
// ═════════════════════════════════════════════════════════════════════════════

export function AntiAliasingContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglAa_intro",
          "A screen is a grid of samples, and the scene is continuous. When the scene changes faster than the grid can represent (an edge, a thin wire, a fine pattern), the samples get it wrong in a structured way: staircases on edges, dotted lines instead of wires, shimmering and crawling as the camera moves. That is aliasing, and anti-aliasing is the family of techniques that fights it.")}
      </Lead>

      <H2>{tx(t, "oglAa_theoryTitle", "Why it happens: sampling")}</H2>
      <Equation label={tx(t, "oglAa_nyquistLabel", "Nyquist–Shannon sampling theorem")}
        where={[
          [r`f_s`, tx(t, "oglAa_wFs", "sampling rate — here, pixels per unit of screen")],
          [r`f_{max}`, tx(t, "oglAa_wFmax", "highest frequency in the signal — a hard edge has infinite frequency")],
        ]}
        note={tx(t, "oglAa_nyquistNote", "A geometric edge can never satisfy this. Every technique either takes more samples (raising fₛ), or removes high frequencies before sampling (filtering: mipmaps, blur). The third option is to reconstruct the edge afterwards (post-process AA).")}>
        {r`f_s > 2\,f_{max} \quad\Longrightarrow\quad \text{a signal can be reconstructed exactly from its samples}`}
      </Equation>
      <p>
        {tx(t, "oglAa_pixelIsPoint",
          "The rasteriser treats a pixel as a single point at its centre: inside the triangle or not. One sample means a pixel is either 0% or 100% covered, even when the edge cuts through the middle. With more samples per pixel, the coverage becomes a fraction and the edge blends:")}
      </p>
      <Equation label={tx(t, "oglAa_resolveLabel", "Resolve: the pixel colour is the average of its samples")}
        note={tx(t, "oglAa_resolveNote", "For a pixel half covered by an orange triangle on a dark background, 4 samples give 2 orange + 2 dark = a 50% blend: exactly the smooth edge we wanted.")}>
        {r`C_{pixel} = \frac{1}{N}\sum_{i=1}^{N} c_i`}
      </Equation>
      <SamplePatternFigure t={t} />

      <H2>{tx(t, "oglAa_ssaaTitle", "SSAA — brute force")}</H2>
      <p>
        {tx(t, "oglAa_ssaaBody",
          "Supersampling renders the whole frame at k times the resolution in each direction and averages it down. It fixes everything: geometric edges, shader aliasing and texture shimmer. It also costs everything: k² times the fragment work and memory. It survives in games as a \"resolution scale > 100%\" option and in offline screenshots.")}
      </p>

      <H2>{tx(t, "oglAa_msaaTitle", "MSAA — coverage is cheap, shading is not")}</H2>
      <p>
        {tx(t, "oglAa_msaaBody",
          "Multisampling stores N colour and depth samples per pixel, and the rasteriser tests coverage and depth at each one. The fragment shader, however, runs once per pixel per triangle, and its output is copied into every sample that triangle covered. Triangle edges get N-level smoothing for close to the cost of no AA, plus N times the framebuffer memory and bandwidth.")}
      </p>
      <CodeBlock lang="cpp" filename="msaa_default.cpp" t={t}>{`// The simple way: a multisampled default framebuffer
glfwWindowHint(GLFW_SAMPLES, 4);
// ... create window ...
glEnable(GL_MULTISAMPLE);        // on by default in most drivers, but be explicit`}</CodeBlock>
      <p>
        {tx(t, "oglAa_msaaOffscreen",
          "With post-processing you render off screen, so the FBO itself must be multisampled. A multisampled texture cannot be sampled like a normal one (only with texelFetch on a sampler2DMS). The usual route is to resolve it into a regular texture with a blit:")}
      </p>
      <CodeBlock lang="cpp" filename="msaa_fbo.cpp" t={t}>{`// Multisampled attachments
glBindRenderbuffer(GL_RENDERBUFFER, msColor);
glRenderbufferStorageMultisample(GL_RENDERBUFFER, 4, GL_RGBA16F, width, height);
glBindRenderbuffer(GL_RENDERBUFFER, msDepth);
glRenderbufferStorageMultisample(GL_RENDERBUFFER, 4, GL_DEPTH24_STENCIL8, width, height);
glBindFramebuffer(GL_FRAMEBUFFER, msFBO);
glFramebufferRenderbuffer(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_RENDERBUFFER, msColor);
glFramebufferRenderbuffer(GL_FRAMEBUFFER, GL_DEPTH_STENCIL_ATTACHMENT, GL_RENDERBUFFER, msDepth);

// Each frame: draw the scene into msFBO, then resolve (average the samples)
glBindFramebuffer(GL_READ_FRAMEBUFFER, msFBO);
glBindFramebuffer(GL_DRAW_FRAMEBUFFER, resolveFBO);      // has a normal texture attached
glBlitFramebuffer(0, 0, width, height, 0, 0, width, height, GL_COLOR_BUFFER_BIT, GL_NEAREST);
// now post-process resolveTexture as usual`}</CodeBlock>
      <Callout type="info" t={t}>
        {tx(t, "oglAa_msaaLimits",
          "MSAA only smooths triangle edges. Aliasing produced by the shader, such as thin procedural lines, sharp specular highlights or alpha-tested foliage, is untouched, because the shader ran once. glEnable(GL_SAMPLE_SHADING) with glMinSampleShading(1.0) forces per-sample shading, which is SSAA for those pixels. GL_SAMPLE_ALPHA_TO_COVERAGE turns alpha into a coverage mask and fixes foliage cheaply. MSAA and deferred shading do not mix well: a multisampled G-buffer multiplies an already huge bandwidth.")}
      </Callout>

      <H2>{tx(t, "oglAa_fxaaTitle", "FXAA — find edges, blur along them")}</H2>
      <p>
        {tx(t, "oglAa_fxaaBody",
          "Post-process AA works on the finished image, so it is independent of how the frame was rendered, deferred or not. FXAA (Lottes, NVIDIA 2009) checks the luma contrast of each pixel against its neighbours. Where the contrast is high enough to be an edge, it estimates the edge direction from the luma gradient and averages a few samples along it:")}
      </p>
      <Equation label={tx(t, "oglAa_fxaaLabel", "FXAA's edge test and direction")}
        where={[
          [r`\ell`, tx(t, "oglAa_wL", "luma of the pixel and its four diagonal neighbours (NW, NE, SW, SE)")],
          [r`\tau`, tx(t, "oglAa_wTau", "contrast threshold — below it the pixel is left alone")],
        ]}>
        {r`\begin{aligned}
&\text{edge} \iff \ell_{max} - \ell_{min} > \tau \\
&d_x = -\big[(\ell_{NW} + \ell_{NE}) - (\ell_{SW} + \ell_{SE})\big] \\
&d_y = (\ell_{NW} + \ell_{SW}) - (\ell_{NE} + \ell_{SE})
\end{aligned}`}
      </Equation>
      <p>
        {tx(t, "oglAa_smaaTaa",
          "SMAA (Jimenez et al., 2012) detects edges more precisely and recognises the typical shapes of jaggies (L, Z, U patterns), so it blurs less than FXAA. TAA spreads the extra samples over time instead of space. Each frame the projection matrix is jittered by a sub-pixel offset, usually from a Halton sequence. The previous frame is reprojected with motion vectors and blended with the current one:")}
      </p>
      <Equation label={tx(t, "oglAa_taaLabel", "Temporal accumulation (TAA)")}
        where={[
          [r`H_{t-1}`, tx(t, "oglAa_wH", "last frame's result, fetched at the pixel's previous position (motion vectors)")],
          [r`\alpha`, tx(t, "oglAa_wAlpha", "≈ 0.1: each frame contributes 10%, so ~10 jittered frames are blended — like 10× SSAA for a static scene")],
        ]}
        note={tx(t, "oglAa_taaNote", "The history is clamped to the colour range of the current pixel's neighbourhood; otherwise moving objects leave ghosts. TAA is the base that DLSS, FSR and XeSS upscalers build on.")}>
        {r`C_t = \operatorname{mix}\big(\operatorname{clamp}(H_{t-1},\ c_{min},\ c_{max}),\ c_t,\ \alpha\big)`}
      </Equation>

      <AaCompareFigure t={t} />

      <LessonTable
        headers={[tx(t, "oglAa_thTech", "Technique"), tx(t, "oglAa_thCost", "Cost"), tx(t, "oglAa_thFixes", "Fixes"), tx(t, "oglAa_thIssue", "Weak spot")]}
        rows={[
          ["SSAA 4×", tx(t, "oglAa_ssaaCost", "4× shading, 4× memory"), tx(t, "oglAa_all", "everything"), tx(t, "oglAa_ssaaIssue", "far too expensive at high resolution")],
          ["MSAA 4×", tx(t, "oglAa_msaaCost", "~1× shading, 4× memory/bandwidth"), tx(t, "oglAa_edges", "geometric edges"), tx(t, "oglAa_msaaIssue", "shader/texture aliasing; awkward with deferred")],
          ["FXAA", tx(t, "oglAa_fxaaCost", "one cheap pass (~1 ms at 4K)"), tx(t, "oglAa_contrast", "any high-contrast edge"), tx(t, "oglAa_fxaaIssue", "blurs texture detail and text; no sub-pixel recovery")],
          ["SMAA", tx(t, "oglAa_smaaCost", "three passes"), tx(t, "oglAa_contrast", "any high-contrast edge"), tx(t, "oglAa_smaaIssue", "more complex; still spatial only")],
          ["TAA", tx(t, "oglAa_taaCost", "one pass + history buffer + motion vectors"), tx(t, "oglAa_temporal", "edges, shader aliasing, shimmer"), tx(t, "oglAa_taaIssue", "ghosting and softness in motion")],
        ]}
      />
      <Callout type="warn" t={t}>
        {tx(t, "oglAa_pitfalls",
          "Resolve MSAA before any post-processing that samples neighbours. For HDR, averaging samples before tone mapping lets a very bright sample dominate its pixel, which gives jaggy highlights, so high-end renderers tone map per sample, resolve, and then un-tone-map. Texture aliasing is fixed by mipmaps and anisotropic filtering, not by AA. Run FXAA on gamma-encoded LDR, since its thresholds assume perceptual luma.")}
      </Callout>

      <KeyIdeas t={t} id="oglAa" items={[
        "Aliasing = sampling a signal above half the sampling rate; hard edges always do.",
        "SSAA renders more pixels and averages: fixes everything, costs k².",
        "MSAA tests coverage per sample but shades once per pixel: cheap smooth edges, no help for shader aliasing.",
        "Offscreen MSAA: glRenderbufferStorageMultisample + glBlitFramebuffer to resolve.",
        "FXAA/SMAA fix edges in post; TAA accumulates jittered frames over time and underpins modern upscalers.",
      ]} />
    </Article>
  );
}
