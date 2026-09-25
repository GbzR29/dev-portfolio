"use client";

// "Temporal AA & Upscaling" (Post-Processing & Effects): jitter, history,
// motion vectors, history rejection, and the temporal upscalers built on them.

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "./lighting-advanced";
import { TaaFigure } from "@/components/lesson/figures/post/TaaFigure";

const r = String.raw;

export function TaaContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglTaa_intro",
          "Supersampling fixes aliasing by shading many samples per pixel, which costs many times the work. Temporal anti-aliasing takes the same samples, but one per frame. Each frame the whole image is shifted by a different sub-pixel amount, and the results are averaged over time. At 60 frames per second, 16 samples take a quarter of a second to gather. The hard part is not the averaging. It is keeping moving things sharp while their pixels change underneath the average. This chapter builds TAA piece by piece, and the figure lets you switch each piece on.")}
      </Lead>

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
proj[2][1] -= (2.0f * jy) / height;`}>
        {r`P_{\text{jit}} = \begin{pmatrix} 1 & 0 & 0 & 2j_x/W \\ 0 & 1 & 0 & 2j_y/H \\ 0 & 0 & 1 & 0 \\ 0 & 0 & 0 & 1 \end{pmatrix} P \qquad (j_x, j_y) = \big(H_2(i) - \tfrac12,\ H_3(i) - \tfrac12\big)`}
      </Equation>

      <H2>{tx(t, "oglTaa_histTitle", "2. History: an average that never ends")}</H2>
      <Equation label={tx(t, "oglTaa_emaLabel", "Exponential moving average")}
        where={[
          [r`h_n`, tx(t, "oglTaa_wH", "the history: the resolved image after frame n, kept in a texture from one frame to the next")],
          [r`c_n`, tx(t, "oglTaa_wC", "this frame's jittered, aliased image")],
          [r`\alpha`, tx(t, "oglTaa_wAlpha", "how much the new frame counts, typically 0.05–0.1. Frame n−k still contributes α(1−α)^k: old frames fade out geometrically")],
        ]}
        note={tx(t, "oglTaa_emaNote", "An exponential average needs only one stored image, not the last 16 frames. It behaves roughly like an average of 2/α − 1 frames: α = 0.1 is about 19. Smaller α means smoother edges but slower reaction to change.")}>
        {r`h_n = \alpha\,c_n + (1 - \alpha)\,h_{n-1} \qquad N_{\text{eff}} \approx \frac{2}{\alpha} - 1`}
      </Equation>

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
vec2 velocity = (vCurr.xy / vCurr.w - vPrev.xy / vPrev.w) * 0.5;`}>
        {r`\mathbf v = \tfrac12\Big(\operatorname{ndc}\big(M_{\text{VP}}\,\mathbf x_{\text{world}}\big) - \operatorname{ndc}\big(M^{\text{prev}}_{\text{VP}}\,\mathbf x^{\text{prev}}_{\text{world}}\big)\Big) \qquad h_{\text{prev}} = \text{history}(\mathbf{uv} - \mathbf v)`}
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
        ]}
        note={tx(t, "oglTaa_clampNote", "Doing it in YCoCg colour space (luma + two chroma axes) instead of RGB keeps the box aligned with how colours vary in real images, so it rejects ghosts more precisely. Clipping toward the box centre along the line to the history colour, instead of clamping each channel, avoids colour shifts. These are the refinements from Karis's 2014 talk on Unreal Engine 4's TAA.")}
        glsl={`vec3 lo = vec3(1e9), hi = vec3(-1e9);
for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec3 c = texelFetch(uCurrent, px + ivec2(i, j), 0).rgb;
    lo = min(lo, c); hi = max(hi, c);
}
vec3 hist = clamp(texture(uHistory, uv - velocity).rgb, lo, hi);
FragColor = vec4(mix(hist, current, alpha), 1.0);`}>
        {r`h' = \operatorname{clamp}\big(h_{\text{prev}},\ \mathbf c_{\min},\ \mathbf c_{\max}\big) \quad\text{or}\quad h' = \operatorname{clip}\big(h_{\text{prev}},\ \mu - \gamma\sigma,\ \mu + \gamma\sigma\big)`}
      </Equation>

      <H2>{tx(t, "oglTaa_upTitle", "5. From TAA to temporal upscaling")}</H2>
      <p>
        {tx(t, "oglTaa_upBody",
          "If sixteen frames give sixteen samples per pixel, they can instead give four samples each to four times as many pixels. A temporal upscaler renders at a lower resolution with jitter and accumulates into a history at the output resolution, placing every sample where it actually landed. AMD FSR 2/3 does this with hand-written rules. NVIDIA DLSS and Intel XeSS replace the rejection heuristics with a neural network that decides, per pixel, how much of the history to trust. All of them need the same inputs as TAA: the jitter, motion vectors and depth. An engine with good TAA is already most of the way to supporting them.")}
      </p>
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
