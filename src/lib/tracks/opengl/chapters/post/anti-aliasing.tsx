// src/lib/tracks/opengl/chapters/post/anti-aliasing.tsx
"use client";

// Anti-Aliasing (Post-Processing & Effects): sampling and Nyquist, resolve, SSAA,
// MSAA, FXAA and a first look at TAA.

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { costNumbers, fxaaNumbers, nyquistNumbers, resolveNumbers, FXAA_TAU } from "../../live/anti-aliasing";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { SamplePatternFigure } from "@/components/lesson/figures/post/SamplePatternFigure";
import { AaCompareFigure } from "@/components/lesson/figures/post/AaCompareFigure";

const r = String.raw;

export function AntiAliasingContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglAa_intro",
          "A screen is a grid of samples, and the scene is continuous. When the scene changes faster than the grid can represent (an edge, a thin wire, a fine pattern), the samples get it wrong in a structured way: staircases on edges, dotted lines instead of wires, shimmering and crawling as the camera moves. That is aliasing, and anti-aliasing is the family of techniques that fights it.")}
      </Lead>

      <Goals t={t} id="oglAa" items={[
        "Explain why jagged edges come from sampling.",
        "Compare SSAA, MSAA and FXAA: what each costs and what it fixes.",
        "Turn on MSAA and add an FXAA pass.",
      ]} />

      <H2>{tx(t, "oglAa_theoryTitle", "Why it happens: sampling")}</H2>
      <Equation label={tx(t, "oglAa_nyquistLabel", "Nyquist–Shannon sampling theorem")}
        where={[
          [r`f_s`, tx(t, "oglAa_wFs", "sampling rate — here, pixels per unit of screen")],
          [r`f_{max}`, tx(t, "oglAa_wFmax", "highest frequency in the signal — a hard edge has infinite frequency")],
        ]}
        note={tx(t, "oglAa_nyquistNote", "A geometric edge can never satisfy this. Every technique either takes more samples (raising fₛ), or removes high frequencies before sampling (filtering: mipmaps, blur). The third option is to reconstruct the edge afterwards (post-process AA).")}
        words={tx(t, "oglAa_nyquistWords", "To capture a pattern that repeats, you need more than two samples per repeat. With fewer, the samples still form a pattern, but a false, slower one: the alias.")}>
        {r`\begin{gathered} f_s > 2\,f_{max} \\ \Longrightarrow\ \text{${tx(t, "oglAa_nyquistTex", "a signal can be reconstructed exactly from its samples")}} \end{gathered}`}
      </Equation>
      <LiveFormula label={tx(t, "oglAa_liveNyq", "Try it: stripes p pixels apart, one sample per pixel")}
        tex={r`f = \frac{1}{p} \qquad f_s = 1 \qquad f > \tfrac{f_s}{2} \;\Rightarrow\; f_{alias} = \lvert f - \operatorname{round}(f) \rvert`}
        vars={[{ id: "p", label: "p", min: 0.5, max: 8, step: 0.05, value: 1.2, fmt: v => `${v.toFixed(2)} px` }]}
        where={[
          [r`p`, tx(t, "oglAa_wPer", "the stripe period: the distance in pixels from one dark stripe to the next")],
          [r`f_{alias}`, tx(t, "oglAa_wAlias", "the false frequency the samples show instead: the distance from f to the nearest whole number of cycles per pixel")],
        ]}
        compute={nyquistNumbers(t)}
        note={tx(t, "oglAa_liveNyqNote", "Stripes 1.2 px apart show up as wide bands every 6 px: that is the moiré on a fine fence or a distant tiled roof. At exactly 1 px every sample hits the same spot of its stripe and the pattern vanishes. Above 2 px every stripe survives.")} />
      <p>
        {tx(t, "oglAa_pixelIsPoint",
          "The rasteriser treats a pixel as a single point at its centre: inside the triangle or not. One sample means a pixel is either 0% or 100% covered, even when the edge cuts through the middle. With more samples per pixel, the coverage becomes a fraction and the edge blends:")}
      </p>
      <Equation label={tx(t, "oglAa_resolveLabel", "Resolve: the pixel colour is the average of its samples")}
        note={tx(t, "oglAa_resolveNote", "For a pixel half covered by an orange triangle on a dark background, 4 samples give 2 orange + 2 dark = a 50% blend: exactly the smooth edge we wanted.")}
        where={[
          [r`N`, tx(t, "oglAa_wN", "samples per pixel")],
          [r`c_i`, tx(t, "oglAa_wCi", "the colour stored in sample i: the triangle's colour if the triangle covers that sample, the background's if not")],
        ]}
        words={tx(t, "oglAa_resolveWords", "The final pixel is the plain average of its samples. So if a triangle covers a quarter of the samples, the pixel gets a quarter of the triangle's colour.")}>
        {r`C_{pixel} = \frac{1}{N}\sum_{i=1}^{N} c_i`}
      </Equation>
      <LiveFormula label={tx(t, "oglAa_liveRes", "Try it: an edge pixel with k of N samples covered")}
        tex={r`\begin{aligned} C = {} &\frac{k}{N}\,c_{\text{${tx(t, "oglAa_liveOrange", "orange")}}} \\ &+ \Big(1 - \frac{k}{N}\Big)\,c_{\text{${tx(t, "oglAa_liveDark", "dark")}}} \end{aligned}`}
        vars={[
          { id: "e", label: "N", min: 0, max: 4, step: 1, value: 2, fmt: v => String(2 ** v) },
          { id: "k", label: "k", min: 0, max: 16, step: 1, value: 1, fmt: v => String(v) },
        ]}
        where={[[r`k`, tx(t, "oglAa_wK", "how many of the N samples the triangle covers (at most N)")]]}
        compute={resolveNumbers(t)}
        note={tx(t, "oglAa_liveResNote", "With N = 1 a pixel is either orange or dark: two shades, a staircase. N = 4 gives five shades and N = 16 gives seventeen, so the edge fades smoothly.")} />
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
      <LiveFormula label={tx(t, "oglAa_liveCost", "Try it: SSAA against MSAA with the same number of samples")}
        tex={r`\begin{aligned} &N = k^2 \qquad \text{SSAA}: W H \cdot N \qquad \text{MSAA}: \approx W H \\ &\text{${tx(t, "oglAa_liveMemT", "memory")}}: W H \cdot N \cdot 8\ \text{B} \end{aligned}`}
        vars={[
          { id: "h", label: "H", min: 720, max: 2160, step: 360, value: 1080, fmt: v => `${v}p` },
          { id: "k", label: "k", min: 1, max: 4, step: 1, value: 2, fmt: v => `${v}×${v}` },
        ]}
        where={[
          [r`W,\ H`, tx(t, "oglAa_wWH", "the output resolution in pixels, 16:9")],
          [r`8\ \text{B}`, tx(t, "oglAa_w8B", "bytes per sample: 4 for an RGBA8 colour, 4 for a 24-bit depth + 8-bit stencil")],
        ]}
        compute={costNumbers(t)}
        note={tx(t, "oglAa_liveCostNote", "At 1080p with 4 samples, SSAA runs the fragment shader 8.3 million times per frame, MSAA about 2.1 million. Both need the same 63 MB of samples, which is why MSAA's real price is memory and bandwidth. At 4K with 16 samples it is about a gigabyte.")} />
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
          [r`\ell_{max},\ \ell_{min}`, tx(t, "oglAa_wLmm", "the brightest and darkest of those lumas")],
          [r`d_x,\ d_y`, tx(t, "oglAa_wDxy", "the direction to blur along: it runs along the edge, at right angles to the brightness change")],
        ]}
        words={tx(t, "oglAa_fxaaWords", "If the neighbourhood is nearly flat, do nothing. Otherwise compare the top corners with the bottom corners and the left corners with the right ones. The arrow built from those two differences runs along the edge, and FXAA averages a few samples along it.")}>
        {r`\begin{aligned}
&\text{edge} \iff \ell_{max} - \ell_{min} > \tau \\
&d_x = -\big[(\ell_{NW} + \ell_{NE}) - (\ell_{SW} + \ell_{SE})\big] \\
&d_y = (\ell_{NW} + \ell_{SW}) - (\ell_{NE} + \ell_{SE})
\end{aligned}`}
      </Equation>
      <LiveFormula label={tx(t, "oglAa_liveFxaa", "Try it: set the four corner lumas")}
        tex={r`\begin{aligned} &\tau = ${FXAA_TAU} \qquad d_x = -\big[(\ell_{NW} + \ell_{NE}) - (\ell_{SW} + \ell_{SE})\big] \\ &d_y = (\ell_{NW} + \ell_{SW}) - (\ell_{NE} + \ell_{SE}) \end{aligned}`}
        vars={[
          { id: "nw", label: <>ℓ<sub>NW</sub></>, min: 0, max: 1, step: 0.05, value: 1, fmt: v => v.toFixed(2) },
          { id: "ne", label: <>ℓ<sub>NE</sub></>, min: 0, max: 1, step: 0.05, value: 1, fmt: v => v.toFixed(2) },
          { id: "sw", label: <>ℓ<sub>SW</sub></>, min: 0, max: 1, step: 0.05, value: 0, fmt: v => v.toFixed(2) },
          { id: "se", label: <>ℓ<sub>SE</sub></>, min: 0, max: 1, step: 0.05, value: 0, fmt: v => v.toFixed(2) },
        ]}
        compute={fxaaNumbers(t)}
        note={tx(t, "oglAa_liveFxaaNote", "Bright top, dark bottom: a horizontal edge, and the direction comes out horizontal (180°, the sign does not matter for a blur). Make the left side bright instead and it turns vertical. Corners that differ by less than τ are not touched, which keeps flat areas and soft gradients sharp.")} />
      <p>
        {tx(t, "oglAa_smaaTaa",
          "SMAA (Jimenez et al., 2012) detects edges more precisely and recognises the typical shapes of jaggies (L, Z, U patterns), so it blurs less than FXAA. TAA spreads the extra samples over time instead of space. Each frame the projection matrix is jittered by a sub-pixel offset, usually from a Halton sequence. The previous frame is reprojected with motion vectors and blended with the current one:")}
      </p>
      <Equation label={tx(t, "oglAa_taaLabel", "Temporal accumulation (TAA)")}
        where={[
          [r`H_{t-1}`, tx(t, "oglAa_wH", "last frame's result, fetched at the pixel's previous position (motion vectors)")],
          [r`\alpha`, tx(t, "oglAa_wAlpha", "≈ 0.1: each frame contributes 10%, so ~10 jittered frames are blended — like 10× SSAA for a static scene")],
          [r`c_t`, tx(t, "oglAa_wCt", "this frame's freshly rendered, jittered colour")],
          [r`c_{min},\ c_{max}`, tx(t, "oglAa_wCmm", "the darkest and brightest colours among the current pixel's neighbours")],
          [r`C_t`, tx(t, "oglAa_wCT", "the result, which also becomes next frame's history")],
        ]}
        words={tx(t, "oglAa_taaWords", "Take last frame's result for this surface, force it into the range of colours around the pixel now, and mix in 10% of the new frame. The next chapter builds each piece.")}
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
