// src/lib/tracks/opengl/chapters/post/post-processing.tsx
"use client";

// Post-Processing (Post-Processing & Effects): point operations, convolution kernels,
// the separable Gaussian, lens effects and the order of passes in a frame.

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation, Tex } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { gaussCostNumbers, gradeNumbers, lumaNumbers, vignetteNumbers, GRADE_C, VIG_R0, VIG_R1 } from "../../live/post-processing";
import { vec } from "../../live/fmt";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { KernelFigure } from "@/components/lesson/figures/post/KernelFigure";
import { PostFxFigure } from "@/components/lesson/figures/post/PostFxFigure";

const r = String.raw;

export function PostProcessingContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglPost_intro",
          "Render the scene into a texture, then draw one fullscreen triangle whose fragment shader reads that texture. Every pixel of the output can now look at any pixel of the input. That one trick, from the Framebuffers chapter, powers almost every modern screen effect: blur, bloom, colour grading, depth of field, motion blur, outlines, film grain.")}
      </Lead>

      <Goals t={t} id="oglPost" items={[
        "Write effects that change each pixel on its own: inversion, greyscale, colour grading.",
        "Apply a convolution kernel to blur, sharpen or find edges.",
        "Blur with two separable Gaussian passes.",
        "Add lens and film effects, in the right order in the frame.",
      ]} />

      <H2>{tx(t, "oglPost_pointTitle", "Point operations: one pixel in, one pixel out")}</H2>
      <p>
        {tx(t, "oglPost_pointBody",
          "The simplest effects only look at the pixel they are writing. They are pure functions of a colour, so the order in which you chain them matters, but they cost almost nothing:")}
      </p>
      <Equation label={tx(t, "oglPost_lumaLabel", "Luminance (Rec. 709) — greyscale")}
        note={tx(t, "oglPost_lumaNote", "The eye is far more sensitive to green than blue, so a plain average (r + g + b)/3 makes blue skies look too bright in greyscale.")}
        glsl="float Y = dot(c, vec3(0.2126, 0.7152, 0.0722));"
        words={tx(t, "oglPost_lumaWords", "The grey value is a weighted sum of the three channels: about 21% of the red, 72% of the green and 7% of the blue. The weights add up to 1, so white stays white.")}>
        {r`Y = 0.2126\,\red{R} + 0.7152\,\green{G} + 0.0722\,\blue{B}`}
      </Equation>
      <LiveFormula label={tx(t, "oglPost_liveLuma", "Try it: how grey is this colour?")}
        tex={r`Y = 0.2126\,\red{R} + 0.7152\,\green{G} + 0.0722\,\blue{B}`}
        vars={[
          { id: "R", label: "R", min: 0, max: 1, step: 0.01, value: 0, fmt: v => v.toFixed(2) },
          { id: "G", label: "G", min: 0, max: 1, step: 0.01, value: 0, fmt: v => v.toFixed(2) },
          { id: "B", label: "B", min: 0, max: 1, step: 0.01, value: 1, fmt: v => v.toFixed(2) },
        ]}
        compute={lumaNumbers(t)}
        note={tx(t, "oglPost_liveLumaNote", "Pure blue gives Y = 0.07, almost black, while the plain average says 0.33. Pure green gives 0.72 against 0.33. That gap is why a sky turns too bright when greyscale uses the average.")} />
      <Equation label={tx(t, "oglPost_gradeLabel", "Exposure, saturation and contrast")}
        where={[
          [r`c`, tx(t, "oglPost_wC", "the pixel's colour, one value per channel")],
          [r`e`, tx(t, "oglPost_wE", "exposure — a plain multiplier")],
          [r`Y`, tx(t, "oglPost_wY", "the luminance of c′, from the formula above: the grey the saturation step moves toward or away from")],
          [r`s`, tx(t, "oglPost_wS", "saturation: 0 = greyscale, 1 = unchanged, > 1 = more vivid (extrapolating away from grey)")],
          [r`k`, tx(t, "oglPost_wK", "contrast: pushes values away from mid-grey 0.5")],
          [r`c',\ c'',\ c'''`, tx(t, "oglPost_wPrimes", "the colour after each step; each step reads the result of the one before")],
        ]}
        glsl="c *= e;  c = mix(vec3(dot(c, LUMA)), c, s);  c = (c - 0.5) * k + 0.5;"
        words={tx(t, "oglPost_gradeWords", "Three steps in a row. Multiply the colour to make it brighter. Then stretch it away from its own grey (or squeeze it toward that grey) to change saturation. Then stretch every channel away from 0.5 to change contrast.")}>
        {r`c' = e\,c \qquad c'' = Y + s\,(c' - Y) \qquad c''' = k\,(c'' - 0.5) + 0.5`}
      </Equation>
      <LiveFormula label={tx(t, "oglPost_liveGrade", "Try it: grade an orange pixel")}
        tex={r`\begin{aligned} &c = ${vec(GRADE_C)} \qquad c' = e\,c \\ &c'' = Y + s\,(c' - Y) \qquad c''' = k\,(c'' - 0.5) + 0.5 \end{aligned}`}
        vars={[
          { id: "e", label: "e", min: 0.25, max: 2, step: 0.05, value: 1, fmt: v => v.toFixed(2) },
          { id: "s", label: "s", min: 0, max: 2, step: 0.05, value: 1, fmt: v => v.toFixed(2) },
          { id: "k", label: "k", min: 0.5, max: 2, step: 0.05, value: 1, fmt: v => v.toFixed(2) },
        ]}
        compute={gradeNumbers}
        note={tx(t, "oglPost_liveGradeNote", "s = 0 makes all three channels equal to Y: grey. s = 2 doubles each channel's distance from Y. k = 1.5 moves 0.8 to 0.95 and 0.2 to 0.05. Values above 1 or below 0 are clipped when the image is shown.")} />
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
          [r`(x, y)`, tx(t, "oglPost_wXY", "the output pixel being computed")],
          [r`(i, j)`, tx(t, "oglPost_wIJ", "the offset of one neighbour from that pixel, from −r to r in each direction; (0, 0) is the pixel itself")],
          [r`r`, tx(t, "oglPost_wR", "the kernel's radius: r = 1 gives the 3×3 kernels below")],
        ]}
        note={tx(t, "oglPost_convNote", "Strictly, a convolution flips the kernel; for the symmetric kernels used here it makes no difference, and shaders just multiply in place (a correlation).")}
        words={tx(t, "oglPost_convWords", "Lay the kernel over the pixel. Multiply each pixel under it by the weight on top of it, and add up all the products. The sum is the new pixel.")}>
        {r`(I * K)(x, y) = \sum_{j=-r}^{r}\sum_{i=-r}^{r} I(x + i,\; y + j)\; K(i, j)`}
      </Equation>
      <KernelFigure t={t} />
      <Equation label={tx(t, "oglPost_kernelsLabel", "Classic 3×3 kernels")}
        notes={[
          tx(t, "oglPost_kn1", "Blur kernels sum to 1, so a flat area keeps its brightness."),
          tx(t, "oglPost_kn2b", "Sharpen = identity + 4 · (identity − the average of the four neighbours): add back, four times over, how much the pixel stands out from its neighbours."),
          tx(t, "oglPost_kn3", "Edge kernels sum to 0: flat areas become black, and only change survives."),
        ]}>
        {r`\underbrace{\tfrac{1}{16}\begin{bmatrix}1&2&1\\2&4&2\\1&2&1\end{bmatrix}}_{\text{Gaussian blur}}
\quad
\underbrace{\begin{bmatrix}0&-1&0\\-1&5&-1\\0&-1&0\end{bmatrix}}_{\text{sharpen}}
\quad
\underbrace{\begin{bmatrix}1&1&1\\1&-8&1\\1&1&1\end{bmatrix}}_{\text{Laplacian edges}}`}
      </Equation>
      <Derivation t={t} label={tx(t, "oglPost_flatDer", "Why the sum of the weights decides what happens to a flat area")}
        steps={[
          { full: true, tex: r`I(x + i,\ y + j) = a \quad \text{${tx(t, "oglPost_fd1t", "for every neighbour")}}`,
            why: tx(t, "oglPost_fd1", "a flat area: every pixel under the kernel has the same value a") },
          { full: true, tex: r`(I * K)(x, y) = \sum_{j}\sum_{i} a\,K(i, j) = a \sum_{j}\sum_{i} K(i, j)`,
            why: tx(t, "oglPost_fd2", "a is the same in every term, so it comes out of the sum") },
          { full: true, tex: r`\textstyle\sum K = 1 \;\Rightarrow\; a \qquad \sum K = 0 \;\Rightarrow\; 0`,
            why: tx(t, "oglPost_fd3", "the blur's weights add up to 16/16 = 1, so the flat area keeps its value. The Laplacian's add up to 8 − 8 = 0, so the flat area turns black, and only places where the image changes give a non-zero answer") },
        ]} />
      <Derivation t={t} label={tx(t, "oglPost_sharpDer", "Where the sharpen kernel comes from")}
        steps={[
          { full: true, tex: r`\text{id} = \begin{bmatrix}0&0&0\\0&1&0\\0&0&0\end{bmatrix} \qquad A_4 = \tfrac14\begin{bmatrix}0&1&0\\1&0&1\\0&1&0\end{bmatrix}`,
            why: tx(t, "oglPost_sd1", "two simple kernels: the identity copies the pixel, A₄ averages its four direct neighbours") },
          { full: true, tex: r`\text{id} - A_4 = \tfrac14\begin{bmatrix}0&-1&0\\-1&4&-1\\0&-1&0\end{bmatrix}`,
            why: tx(t, "oglPost_sd2", "how much the pixel stands out from its neighbours: 0 on a flat area, large on a fine detail") },
          { full: true, tex: r`\text{id} + 4\,(\text{id} - A_4) = \begin{bmatrix}0&-1&0\\-1&5&-1\\0&-1&0\end{bmatrix}`,
            why: tx(t, "oglPost_sd3", "add that difference back four times: the centre becomes 1 + 4 = 5 and each neighbour −1. The weights add up to 1, so flat areas stay the same and only details get stronger") },
        ]} />
      <Equation label={tx(t, "oglPost_sobelLabel", "Sobel — edges with a direction")}
        where={[
          [r`G_x,\ G_y`, tx(t, "oglPost_wGxy", "how fast the image changes from left to right, and from top to bottom, at this pixel")],
          [r`\lVert G \rVert`, tx(t, "oglPost_wGmag", "the edge strength: the length of the vector (Gx, Gy)")],
        ]}
        note={tx(t, "oglPost_sobelNote", "Gx responds to vertical edges, Gy to horizontal ones. Their magnitude is the edge strength, and atan2(Gy, Gx) its direction. Outline shaders run Sobel on depth and normals instead of colour, so they catch shape edges and ignore texture detail.")}
        words={tx(t, "oglPost_sobelWords", "Gx subtracts the left column from the right column, with the middle row counted twice. Gy does the same from top to bottom. Together they form an arrow that points across the edge, and its length is how strong the edge is.")}>
        {r`\begin{gathered} G_x = \begin{bmatrix}-1&0&1\\-2&0&2\\-1&0&1\end{bmatrix} * I \qquad G_y = \begin{bmatrix}-1&-2&-1\\0&0&0\\1&2&1\end{bmatrix} * I \\[6pt] \lVert G \rVert = \sqrt{G_x^2 + G_y^2} \end{gathered}`}
      </Equation>
      <Derivation t={t} label={tx(t, "oglPost_sobelDer", "Sobel on a vertical edge: dark a on the left, bright b on the right")}
        steps={[
          { full: true, tex: r`I = \begin{bmatrix}a&a&b\\a&a&b\\a&a&b\end{bmatrix}`,
            why: tx(t, "oglPost_sb1", "the 3×3 pixels around a point just left of the edge") },
          { full: true, tex: r`G_x = -(1 + 2 + 1)\,a + 0 \cdot a + (1 + 2 + 1)\,b = 4\,(b - a)`,
            why: tx(t, "oglPost_sb2", "multiply each pixel by the weight on top of it: the left column gets −1, −2, −1, the middle 0, the right 1, 2, 1") },
          { full: true, tex: r`G_y = -(a + 2a + b) + (a + 2a + b) = 0`,
            why: tx(t, "oglPost_sb3", "the top and bottom rows hold the same values, so they cancel: nothing changes from top to bottom") },
          { full: true, tex: r`\lVert G \rVert = 4\,\lvert b - a \rvert, \qquad \operatorname{atan2}(0,\ 4(b - a)) = 0^\circ`,
            why: tx(t, "oglPost_sb4", "the strength grows with the contrast across the edge, and the direction 0° points right, straight across the vertical edge. A flat area (a = b) gives 0") },
        ]} />
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
        where={[
          [r`\sigma`, tx(t, "oglPost_wSigma", "standard deviation — the blur radius; weights past 3σ are negligible")],
          [r`x,\ y`, tx(t, "oglPost_wGxy2", "the distance of a neighbour from the centre pixel, in pixels, horizontally and vertically")],
          [r`\frac{1}{\sqrt{2\pi}\,\sigma}`, tx(t, "oglPost_wGnorm", "the factor that makes all the weights add up to 1, so the blur keeps the brightness")],
        ]}
        note={tx(t, "oglPost_gaussNote", "Because G(x, y) = G(x)·G(y), a 2D blur equals a horizontal 1D blur followed by a vertical one. For radius r that is 2(2r + 1) reads per pixel instead of (2r + 1)²: 50 instead of 625 for r = 12.")}
        words={tx(t, "oglPost_gaussWords", "A neighbour's weight falls off like a bell curve with its distance from the centre. The 2D bell is just the horizontal bell times the vertical bell.")}>
        {r`G(x) = \frac{1}{\sqrt{2\pi}\,\sigma}\,e^{-\frac{x^2}{2\sigma^2}} \qquad G(x, y) = G(x)\,G(y) = \frac{1}{2\pi\sigma^2}\,e^{-\frac{x^2 + y^2}{2\sigma^2}}`}
      </Equation>
      <Derivation t={t} label={tx(t, "oglPost_sepDer", "Why one 2D blur equals two 1D passes")}
        steps={[
          { full: true, tex: r`e^{-\frac{x^2 + y^2}{2\sigma^2}} = e^{-\frac{x^2}{2\sigma^2}}\cdot e^{-\frac{y^2}{2\sigma^2}} \;\Rightarrow\; G(x, y) = G(x)\,G(y)`,
            why: tx(t, "oglPost_gs1", "an exponent that is a sum splits into a product: e^(u+v) = e^u · e^v") },
          { full: true, tex: r`\begin{aligned} &\sum_{j}\sum_{i} I(x + i,\ y + j)\,G(i)\,G(j) \\ &\quad = \sum_{j} G(j)\Big[\sum_{i} I(x + i,\ y + j)\,G(i)\Big] \end{aligned}`,
            why: tx(t, "oglPost_gs2", "G(j) does not depend on i, so it moves out of the inner sum") },
          { full: true, tex: r`\Big[\sum_{i} I(x + i,\ y + j)\,G(i)\Big] = H(x,\ y + j)`,
            why: tx(t, "oglPost_gs3", "the bracket is a horizontal 1D blur of row y + j. The first pass computes it for every pixel and stores it in the texture H") },
          { full: true, tex: r`(I * G)(x, y) = \sum_{j} H(x,\ y + j)\,G(j)`,
            why: tx(t, "oglPost_gs4", "what is left is a vertical 1D blur of H: the second pass. Each pass reads 2r + 1 pixels, so 2(2r + 1) in total") },
        ]} />
      <LiveFormula label={tx(t, "oglPost_liveGauss", "Try it: what does a blur of this size cost?")}
        tex={r`r = \lceil 3\sigma \rceil \qquad \text{2D}: (2r + 1)^2 \qquad \text{${tx(t, "oglPost_liveSep", "two passes")}}: 2\,(2r + 1)`}
        vars={[{ id: "sigma", label: "σ", min: 0.5, max: 8, step: 0.5, value: 4, fmt: v => `${v.toFixed(1)} px` }]}
        compute={gaussCostNumbers(t)}
        note={tx(t, "oglPost_liveGaussNote", "At σ = 4 the kernel is 25 × 25: 625 reads per pixel in one pass, 50 in two, 26 with the linear-filtering trick from the tip below. The last row is for a whole 1080p frame (2.07 million pixels).")} />
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
          [r`v`, tx(t, "oglPost_wV", "vignette strength: 0 = none, 1 = the corners go fully black")],
          [r`r_0,\ r_1`, tx(t, "oglPost_wR01", "the distances where the darkening starts and where it reaches full strength")],
          [r`\operatorname{smoothstep}`, tx(t, "oglPost_wSmooth", "0 below r₀, 1 above r₁, and an S-shaped curve x²(3 − 2x) in between, so the darkening has no visible edge")],
          [r`\vec d`, tx(t, "oglPost_wDvec", "the direction from the centre to this pixel, uv − (0.5, 0.5)")],
          [r`p`, tx(t, "oglPost_wP", "pixel block size, in texels")],
        ]}
        words={tx(t, "oglPost_lensWords", "Vignette: darken the pixel more the farther it is from the centre. Aberration: read red a little outward and blue a little inward. Pixelate: snap every uv to the centre of its block, so the whole block reads one texel.")}>
        {r`\begin{aligned}
&\text{vignette:} && c \mathrel{*}= 1 - v\cdot\operatorname{smoothstep}(r_0, r_1, d) \\
&\text{aberration:} && c = \big(\red{I_r}(uv + a\,\vec d),\ \green{I_g}(uv),\ \blue{I_b}(uv - a\,\vec d)\big) \\
&\text{pixelate:} && uv' = \big(\lfloor uv / p \rfloor + 0.5\big)\,p
\end{aligned}`}
      </Equation>
      <LiveFormula label={tx(t, "oglPost_liveVig", "Try it: how dark is the vignette here?")}
        tex={r`c \mathrel{*}= 1 - v\cdot\operatorname{smoothstep}(${VIG_R0},\ ${VIG_R1},\ d)`}
        vars={[
          { id: "d", label: "d", min: 0, max: 0.71, step: 0.01, value: 0.55, fmt: v => v.toFixed(2) },
          { id: "v", label: "v", min: 0, max: 1, step: 0.05, value: 0.6, fmt: v => v.toFixed(2) },
        ]}
        compute={vignetteNumbers(t)}
        note={tx(t, "oglPost_liveVigNote", "d = 0.5 is the middle of a screen edge, d = 0.71 a corner. Halfway through the fade (d = 0.55) smoothstep gives exactly 0.5, so v = 0.6 keeps 70% of the brightness.")} />
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
