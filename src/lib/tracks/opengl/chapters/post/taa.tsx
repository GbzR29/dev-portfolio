// src/lib/tracks/opengl/chapters/post/taa.tsx
"use client";

// "Temporal AA & Upscaling" (Post-Processing & Effects): jitter, history,
// motion vectors, history rejection, and the temporal upscalers built on them.

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { clipNumbers, emaNumbers, haltonNumbers, upscaleNumbers } from "../../live/taa";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { TaaFigure } from "@/components/lesson/figures/post/TaaFigure";

const r = String.raw;

export function TaaContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglTaa_intro",
          "Supersampling fixes aliasing by shading many samples per pixel, which costs many times the work. Temporal anti-aliasing takes the same samples, but one per frame. Each frame the whole image is shifted by a different sub-pixel amount, and the results are averaged over time. At 60 frames per second, 16 samples take a quarter of a second to gather. The hard part is not the averaging. It is keeping moving things sharp while their pixels change underneath the average. This chapter builds TAA piece by piece, and the figure lets you switch each piece on.")}
      </Lead>

      <Goals t={t} id="oglTaa" items={[
        "Jitter the camera so every frame samples different points.",
        "Blend each frame into a running history.",
        "Find where a pixel was in the last frame with motion vectors.",
        "Reject history that is wrong, and explain how temporal upscaling builds on this.",
      ]} />

      <H2>{tx(t, "oglTaa_jitTitle", "1. Jitter: a different sample every frame")}</H2>
      <p>
        {tx(t, "oglTaa_jitBody",
          "Rasterisation samples each pixel at its centre. To sample elsewhere, the whole projection is shifted by a sub-pixel offset (j_x, j_y), different every frame. The offset is added in clip space after the projection, so it moves everything on screen by exactly that fraction of a pixel, whatever the depth.")}
      </p>
      <Equation label={tx(t, "oglTaa_jitLabel", "Jittered projection and the Halton sequence")}
        where={[
          [r`(j_x, j_y) \in [-\tfrac12, \tfrac12]^2`, tx(t, "oglTaa_wJ", "this frame's offset, in pixels")],
          [r`\tfrac{2 j_x}{W},\ \tfrac{2 j_y}{H}`, tx(t, "oglTaa_wNdc", "the same offset in normalised device coordinates, where the screen spans 2 units. W and H are the render size in pixels")],
          [r`H_b(i)`, tx(t, "oglTaa_wHalton", "the radical inverse of i in base b: write i in base b and mirror its digits after the point. H₂(1…4) = ½, ¼, ¾, ⅛. Each new value falls in the largest gap left so far")],
        ]}
        note={tx(t, "oglTaa_jitNote", "Random offsets would clump, leaving parts of the pixel unsampled for many frames. The Halton pair (H₂(i), H₃(i)) is a low-discrepancy sequence: any run of consecutive frames covers the pixel evenly. 8 or 16 offsets are cycled. Everything that must not wobble, such as UI, reads from the un-jittered matrix.")}
        glsl={`// C++ (GLM, column-major): P_jit = T · P adds (2j/W)·w_clip to x_clip.
// GLM's perspective has w_clip = −z_view (row 3 = 0, 0, −1, 0),
// so the offset lands in the z column with a minus sign.
proj[2][0] -= (2.0f * jx) / width;
proj[2][1] -= (2.0f * jy) / height;`}
        words={tx(t, "oglTaa_jitWords", "Before the perspective divide, add a small amount to x and y, scaled by w. After the divide that becomes the same sub-pixel shift for every vertex, near or far. Each frame takes its shift from the next pair of Halton numbers.")}>
        {r`\begin{gathered} P_{\text{jit}} = \begin{pmatrix} 1 & 0 & 0 & 2j_x/W \\ 0 & 1 & 0 & 2j_y/H \\ 0 & 0 & 1 & 0 \\ 0 & 0 & 0 & 1 \end{pmatrix} P \\[4pt] (j_x, j_y) = \big(H_2(i) - \tfrac12,\ H_3(i) - \tfrac12\big) \end{gathered}`}
      </Equation>
      <Derivation t={t} label={tx(t, "oglTaa_jitDer", "From the matrix to the two lines of C++")}
        steps={[
          { full: true, tex: r`x'_{\text{clip}} = x_{\text{clip}} + \tfrac{2j_x}{W}\,w_{\text{clip}} \;\Rightarrow\; x'_{\text{ndc}} = \frac{x'_{\text{clip}}}{w_{\text{clip}}} = x_{\text{ndc}} + \tfrac{2j_x}{W}`,
            why: tx(t, "oglTaa_jd1", "the first row of the jitter matrix adds 2jₓ/W times w. The perspective divide cancels the w, so every vertex moves by the same 2jₓ/W in NDC: jₓ pixels, whatever its depth") },
          { full: true, tex: r`\text{${tx(t, "oglTaa_jd2t", "row 0 of")}}\ P_{\text{jit}} = \text{${tx(t, "oglTaa_jd2t", "row 0 of")}}\ P + \tfrac{2j_x}{W}\cdot \text{${tx(t, "oglTaa_jd2u", "row 3 of")}}\ P`,
            why: tx(t, "oglTaa_jd2", "multiplying by the jitter matrix on the left adds 2jₓ/W times the last row of P to its first row") },
          { full: true, tex: r`\text{${tx(t, "oglTaa_jd2u", "row 3 of")}}\ P = (0,\ 0,\ -1,\ 0) \;\Rightarrow\; P_{\text{jit},02} = P_{02} - \tfrac{2j_x}{W}`,
            why: tx(t, "oglTaa_jd3", "in GLM's perspective matrix the last row is (0, 0, −1, 0), which makes w_clip = −z_view. So only the entry in column 2 changes, by minus the offset") },
          { full: true, tex: r`P_{02} = \texttt{proj[2][0]} \;\Rightarrow\; \texttt{proj[2][0] -= 2*jx/W}`,
            why: tx(t, "oglTaa_jd4", "GLM stores matrices column by column, so proj[column][row]: the entry in row 0, column 2 is proj[2][0]. The y offset changes row 1 the same way: proj[2][1]") },
        ]} />
      <LiveFormula label={tx(t, "oglTaa_liveHalton", "Try it: which offset does frame i use?")}
        tex={r`(j_x, j_y) = \big(H_2(i) - \tfrac12,\ H_3(i) - \tfrac12\big)`}
        vars={[{ id: "i", label: "i", min: 1, max: 16, step: 1, value: 6, fmt: v => String(v) }]}
        compute={haltonNumbers}
        note={tx(t, "oglTaa_liveHaltonNote", "Step i from 1 to 4: H₂ gives 0.5, 0.25, 0.75, 0.125, and each new value lands in the middle of the largest gap left. H₃ does the same in thirds. Because 2 and 3 share no factor, the two sequences never fall into step, so the points spread evenly over the pixel. The NDC offset is tiny: half a pixel is only 0.00052 at 1920 wide.")} />

      <H2>{tx(t, "oglTaa_histTitle", "2. History: an average that never ends")}</H2>
      <Equation label={tx(t, "oglTaa_emaLabel", "Exponential moving average")}
        where={[
          [r`h_n`, tx(t, "oglTaa_wH", "the history: the resolved image after frame n, kept in a texture from one frame to the next")],
          [r`c_n`, tx(t, "oglTaa_wC", "this frame's jittered, aliased image")],
          [r`\alpha`, tx(t, "oglTaa_wAlpha", "how much the new frame counts, typically 0.05–0.1. Frame n−k still contributes α(1−α)^k: old frames fade out geometrically")],
        ]}
        note={tx(t, "oglTaa_emaNote", "An exponential average needs only one stored image, not the last 16 frames. It behaves roughly like an average of 2/α − 1 frames: α = 0.1 is about 19. Smaller α means smoother edges but slower reaction to change.")}
        words={tx(t, "oglTaa_emaWords", "The new result is 10% of this frame plus 90% of the old result. The old result already holds the frames before it, so every past frame is still in there, with a weight that shrinks by 10% per frame.")}>
        {r`h_n = \alpha\,c_n + (1 - \alpha)\,h_{n-1} \qquad N_{\text{eff}} \approx \frac{2}{\alpha} - 1`}
      </Equation>
      <Derivation t={t} label={tx(t, "oglTaa_emaDer", "Unrolling the average, and where 2/α − 1 comes from")}
        steps={[
          { full: true, tex: r`\begin{aligned} h_n &= \alpha\,c_n + (1 - \alpha)\big(\alpha\,c_{n-1} + (1 - \alpha)\,h_{n-2}\big) \\ &= \alpha\,c_n + \alpha(1 - \alpha)\,c_{n-1} + (1 - \alpha)^2\,h_{n-2} \end{aligned}`,
            why: tx(t, "oglTaa_ed1", "replace h_{n−1} by its own formula") },
          { full: true, tex: r`h_n = \alpha \sum_{k=0}^{n-1} (1 - \alpha)^k\,c_{n-k} + (1 - \alpha)^n\,h_0`,
            why: tx(t, "oglTaa_ed2", "keep going back to the first frame: the frame k steps ago has weight α(1 − α)^k, and the starting image fades as (1 − α)^n") },
          { full: true, tex: r`\alpha \sum_{k=0}^{\infty} (1 - \alpha)^k = \alpha \cdot \frac{1}{1 - (1 - \alpha)} = 1`,
            why: tx(t, "oglTaa_ed3", "a geometric series: the weights add up to 1, so the history keeps the image's brightness") },
          { full: true, tex: r`\operatorname{Var}(h) = \alpha^2 \sum_{k=0}^{\infty} (1 - \alpha)^{2k}\,\sigma^2 = \frac{\alpha^2}{1 - (1 - \alpha)^2}\,\sigma^2 = \frac{\alpha}{2 - \alpha}\,\sigma^2`,
            why: tx(t, "oglTaa_ed4", "give every frame independent noise of variance σ² (the jitter makes each frame's aliasing different). The variance of a weighted sum is the sum of squared weights times σ², and 1 − (1 − α)² = α(2 − α)") },
          { full: true, tex: r`\frac{\sigma^2}{N} = \frac{\alpha}{2 - \alpha}\,\sigma^2 \;\Rightarrow\; N = \frac{2 - \alpha}{\alpha} = \frac{2}{\alpha} - 1`,
            why: tx(t, "oglTaa_ed5", "a plain average of N frames divides the variance by N. The N that removes as much noise as the exponential average is 2/α − 1") },
        ]} />
      <LiveFormula label={tx(t, "oglTaa_liveEma", "Try it: how many frames does α blend?")}
        tex={r`\begin{aligned} &N_{\text{eff}} \approx \frac{2}{\alpha} - 1 \\ &\text{${tx(t, "oglTaa_liveWk", "weight of frame k back")}}: \alpha(1 - \alpha)^k \end{aligned}`}
        vars={[{ id: "alpha", label: "α", min: 0.02, max: 0.5, step: 0.01, value: 0.1, fmt: v => v.toFixed(2) }]}
        compute={emaNumbers(t)}
        note={tx(t, "oglTaa_liveEmaNote", "α = 0.1 blends about 19 frames, and a frame fades below 1% of its first weight after 44 frames: 0.73 s at 60 fps. That delay is how long a ghost can linger if nothing rejects the history. α = 0.5 reacts within a few frames but blends only 3.")} />

      <H2>{tx(t, "oglTaa_mvTitle", "3. Motion vectors: find the pixel's past")}</H2>
      <p>
        {tx(t, "oglTaa_mvBody",
          "Averaging a pixel with its own past only works if the same surface was there in the past. When the camera or an object moves, it was somewhere else. So every frame also writes a velocity buffer: for each pixel, how far its surface moved on screen since the last frame. The resolve pass reads the history at the pixel's previous position instead of its current one (reprojection).")}
      </p>
      <Equation label={tx(t, "oglTaa_mvLabel", "Motion vector from two frames' transforms")}
        where={[
          [r`\mathbf x_{\text{world}}`, tx(t, "oglTaa_wX", "the surface point being shaded. For a skinned or animated mesh, compute it twice in the vertex shader: with this frame's bones or transforms and with last frame's")],
          [r`M_{\text{VP}},\ M^{\text{prev}}_{\text{VP}}`, tx(t, "oglTaa_wVP", "this frame's and last frame's view-projection matrices, both without jitter, so the vectors measure real motion only")],
          [r`\operatorname{ndc}(\cdot)`, tx(t, "oglTaa_wNdcF", "perspective divide: xy / w")],
        ]}
        note={tx(t, "oglTaa_mvNote", "Static geometry only moves because the camera does, so its velocity can be reconstructed from depth alone, with no extra geometry pass. Anything procedural, such as the spinning wheel in the figure, particles or scrolling textures, needs its motion written explicitly, or it ghosts.")}
        glsl={`// vertex shader: pass both clip positions
vCurr = uViewProj     * uModel     * vec4(aPos, 1.0);
vPrev = uPrevViewProj * uPrevModel * vec4(aPos, 1.0);
// fragment shader: velocity in UV units
vec2 velocity = (vCurr.xy / vCurr.w - vPrev.xy / vPrev.w) * 0.5;`}
        words={tx(t, "oglTaa_mvWords", "Project the point with this frame's matrices and with last frame's, and subtract the two screen positions. Halving turns the difference from NDC (2 units wide) into UV (1 unit wide). To find the pixel's past, read the history that far back.")}>
        {r`\begin{gathered} \mathbf v = \tfrac12\Big(\operatorname{ndc}\big(M_{\text{VP}}\,\mathbf x_{\text{world}}\big) - \operatorname{ndc}\big(M^{\text{prev}}_{\text{VP}}\,\mathbf x^{\text{prev}}_{\text{world}}\big)\Big) \\[4pt] h_{\text{prev}} = \text{history}(\mathbf{uv} - \mathbf v) \end{gathered}`}
      </Equation>

      <TaaFigure t={t} />

      <H2>{tx(t, "oglTaa_rejTitle", "4. Rejecting history that is wrong")}</H2>
      <p>
        {tx(t, "oglTaa_rejBody",
          "Reprojection fails in three common cases. The surface was hidden last frame (disocclusion), so the history there shows whatever used to cover it. The shading changed (a light turned on, a shadow moved). Or the reprojected position lands between different surfaces. The fix used by almost every engine is to trust the current frame's neighbourhood. Whatever colour the history holds, it should lie within the range of colours around this pixel now. If it does not, it is stale, and it is pulled into that range before blending.")}
      </p>
      <Equation label={tx(t, "oglTaa_clampLabel", "Neighbourhood clamping and variance clipping")}
        where={[
          [r`\mathbf c_{\min},\ \mathbf c_{\max}`, tx(t, "oglTaa_wMinMax", "the per-channel minimum and maximum of the current frame's 3×3 pixels around this one: a box in colour space")],
          [r`\mu,\ \sigma`, tx(t, "oglTaa_wMuSig", "the mean and standard deviation of those 9 colours. Variance clipping uses the tighter box μ ± γσ (γ ≈ 1), which is less fooled by a single outlier")],
          [r`h_{\text{prev}}`, tx(t, "oglTaa_wHprev", "the history colour read at the reprojected position")],
          [r`\gamma`, tx(t, "oglTaa_wGamma", "how many standard deviations wide the box is")],
          [r`h'`, tx(t, "oglTaa_wHp", "the history after the fix, the value that gets blended with α")],
        ]}
        words={tx(t, "oglTaa_clampWords", "Find the range of colours around the pixel in the current frame. If the history colour falls outside that range, it belongs to something that is no longer there, so move it to the nearest edge of the range.")}
        note={tx(t, "oglTaa_clampNote", "Doing it in YCoCg colour space (luma + two chroma axes) instead of RGB keeps the box aligned with how colours vary in real images, so it rejects ghosts more precisely. Clipping toward the box centre along the line to the history colour, instead of clamping each channel, avoids colour shifts. These are the refinements from Karis's 2014 talk on Unreal Engine 4's TAA.")}
        glsl={`vec3 lo = vec3(1e9), hi = vec3(-1e9);
for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec3 c = texelFetch(uCurrent, px + ivec2(i, j), 0).rgb;
    lo = min(lo, c); hi = max(hi, c);
}
vec3 hist = clamp(texture(uHistory, uv - velocity).rgb, lo, hi);
FragColor = vec4(mix(hist, current, alpha), 1.0);`}>
        {r`\begin{gathered} h' = \operatorname{clamp}\big(h_{\text{prev}},\ \mathbf c_{\min},\ \mathbf c_{\max}\big) \\ \text{${tx(t, "oglTaa_clampOr", "or")}} \\ h' = \operatorname{clip}\big(h_{\text{prev}},\ \mu - \gamma\sigma,\ \mu + \gamma\sigma\big) \end{gathered}`}
      </Equation>
      <LiveFormula label={tx(t, "oglTaa_liveClip", "Try it: a white object has just moved away from a dark pixel")}
        tex={r`h' = \operatorname{clamp}\big(h_{\text{prev}},\ \mu - \gamma\sigma,\ \mu + \gamma\sigma\big) \qquad 0.9\,h' + 0.1\,c`}
        vars={[
          { id: "h", label: <>h<sub>prev</sub></>, min: 0, max: 1, step: 0.05, value: 0.9, fmt: v => v.toFixed(2) },
          { id: "mu", label: "μ", min: 0, max: 1, step: 0.05, value: 0.2, fmt: v => v.toFixed(2) },
          { id: "sigma", label: "σ", min: 0, max: 0.3, step: 0.01, value: 0.05, fmt: v => v.toFixed(2) },
          { id: "gamma", label: "γ", min: 0.5, max: 3, step: 0.25, value: 1, fmt: v => v.toFixed(2) },
        ]}
        where={[[r`c`, tx(t, "oglTaa_wCcur", "the current pixel, here taken equal to μ; one colour channel only")]]}
        compute={clipNumbers(t)}
        note={tx(t, "oglTaa_liveClipNote", "The history still remembers the white object (0.9), but the pixel's neighbourhood is now dark (0.2 ± 0.05). Clipping pulls the history down to 0.25 and the result is 0.245, almost right in one frame. Without it the result is 0.83, a bright ghost that fades over dozens of frames.")} />

      <H2>{tx(t, "oglTaa_upTitle", "5. From TAA to temporal upscaling")}</H2>
      <p>
        {tx(t, "oglTaa_upBody",
          "If sixteen frames give sixteen samples per pixel, they can instead give four samples each to four times as many pixels. A temporal upscaler renders at a lower resolution with jitter and accumulates into a history at the output resolution, placing every sample where it actually landed. AMD FSR 2/3 does this with hand-written rules. NVIDIA DLSS and Intel XeSS replace the rejection heuristics with a neural network that decides, per pixel, how much of the history to trust. All of them need the same inputs as TAA: the jitter, motion vectors and depth. An engine with good TAA is already most of the way to supporting them.")}
      </p>
      <LiveFormula label={tx(t, "oglTaa_liveUp", "Try it: a 4K image from a smaller render")}
        tex={r`\begin{aligned} &\text{${tx(t, "oglTaa_liveRender", "render")}}: \frac{W}{s} \times \frac{H}{s} \\ &\text{${tx(t, "oglTaa_liveUpT", "samples per output pixel after n frames")}}: \frac{n}{s^2} \end{aligned}`}
        vars={[
          { id: "s", label: "s", min: 1, max: 3, step: 0.25, value: 2, fmt: v => `${v.toFixed(2)}×` },
          { id: "n", label: "n", min: 1, max: 32, step: 1, value: 16, fmt: v => String(v) },
        ]}
        where={[
          [r`s`, tx(t, "oglTaa_wScale", "the scale factor per axis: 1.5 is a typical \"quality\" mode, 2 \"performance\", 3 \"ultra performance\"")],
          [r`n`, tx(t, "oglTaa_wNfr", "how many jittered frames the history has gathered")],
        ]}
        compute={upscaleNumbers(t)}
        note={tx(t, "oglTaa_liveUpNote", "At s = 2 the GPU shades only 2.07 million pixels instead of 8.3 million, a quarter. After a 16-frame jitter cycle every output pixel has still gathered 4 samples, as many as 4× SSAA, provided the history survived. That is why motion and disocclusion are where upscalers look worst.")} />
      <LessonTable
        headers={[tx(t, "oglTaa_tSym", "Artefact"), tx(t, "oglTaa_tCause", "Cause"), tx(t, "oglTaa_tFix", "Remedy")]}
        rows={[
          [tx(t, "oglTaa_a1", "Ghosting (trails behind moving objects)"), tx(t, "oglTaa_a1c", "missing or wrong motion vectors; history not rejected"), tx(t, "oglTaa_a1f", "write velocity for everything that moves; neighbourhood clamp; depth-based disocclusion test")],
          [tx(t, "oglTaa_a2", "Blurry image"), tx(t, "oglTaa_a2c", "bilinear history reads blur a little every frame, and the blur accumulates"), tx(t, "oglTaa_a2f", "sample the history with a sharper (bicubic/Catmull-Rom) filter; a light sharpening pass afterwards (CAS)")],
          [tx(t, "oglTaa_a3", "Flicker on thin, high-contrast details"), tx(t, "oglTaa_a3c", "the clamp box is too wide on edges, or α too high"), tx(t, "oglTaa_a3f", "variance clipping; lower α; luminance weighting of the blend")],
          [tx(t, "oglTaa_a4", "A black or white blob that never leaves"), tx(t, "oglTaa_a4c", "one NaN or infinite value got into the history and is averaged back in forever"), tx(t, "oglTaa_a4f", "sanitise the current frame (isnan / isinf) before blending")],
          [tx(t, "oglTaa_a5", "Wobbling UI or particles"), tx(t, "oglTaa_a5c", "drawn with the jittered projection after the resolve"), tx(t, "oglTaa_a5f", "draw them after TAA with the un-jittered matrix, or write their motion")],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "oglTaa_tip", "Order matters in the frame. TAA runs on the HDR image, after lighting and before bloom, tone mapping and UI. Bloom and tone mapping then work on a stable image instead of a flickering one. Put post effects that need pixel-accurate edges, such as outlines, after TAA.")}
      </Callout>
      <CodeBlock lang="cpp" filename="taa_frame.cpp" t={t}>{`// Per frame
glm::vec2 j = halton16[frame % 16] - 0.5f;          // this frame's sub-pixel offset
glm::mat4 projJit = projection;
projJit[2][0] -= 2.0f * j.x / width;                  // see the jitter equation above
projJit[2][1] -= 2.0f * j.y / height;

renderGBuffer(projJit * view, prevViewProj);          // also writes the velocity buffer
lightingPass();                                       // HDR colour in "current"
taaResolve(current, history[ping], velocity, depth, history[1 - ping]);
ping = 1 - ping;
bloomAndToneMap(history[ping]);
prevViewProj = projection * view;                     // un-jittered, for next frame's vectors`}</CodeBlock>

      <KeyIdeas t={t} id="oglTaa" items={[
        "Jitter the projection by a Halton sub-pixel offset each frame: one sample per pixel per frame.",
        "Blend into a history with h = α·c + (1 − α)·h; α ≈ 0.1 averages about 19 frames.",
        "Motion vectors (current minus previous screen position) let the history follow moving surfaces.",
        "Clamp or clip the history to the current 3×3 neighbourhood's colour range to kill ghosts.",
        "Temporal upscalers (FSR, DLSS, XeSS) are TAA that accumulates into a higher resolution than it renders.",
      ]} />
    </Article>
  );
}
