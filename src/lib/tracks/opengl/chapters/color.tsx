"use client";

// "Colour Spaces & ACES" (Advanced Lighting): what an RGB triple means, gamuts, scene- vs display-referred, tone mapping in depth, HDR output.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "./lighting-advanced";
import { ChromaticityFigure } from "@/components/lesson/figures/advlighting/ChromaticityFigure";
import { ToneMapFigure } from "@/components/lesson/figures/advlighting/ToneMapFigure";

const r = String.raw;

export function ColorSpacesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglColor_intro",
          "vec3(1.0, 0.0, 0.0) is not \"red\". It means \"full amount of the first primary of some colour space, none of the others\", and which red that is depends on the space. On an sRGB monitor it is one red, on a P3 phone a noticeably more saturated one, in an HDR pipeline something else again. This chapter covers what the numbers in a colour actually mean, why renderers do their maths in one space and display in another, and how the tone mapper squeezes unbounded light into what a screen can show.")}
      </Lead>

      <H2>{tx(t, "oglColor_spaceTitle", "What defines a colour space")}</H2>
      <LessonTable
        headers={[tx(t, "oglColor_thPart", "Part"), tx(t, "oglColor_thWhat", "What it fixes"), tx(t, "oglColor_thSrgb", "sRGB's choice")]}
        rows={[
          [tx(t, "oglColor_p1", "Primaries"), tx(t, "oglColor_p1w", "the exact red, green and blue that (1,0,0), (0,1,0), (0,0,1) mean"), "Rec.709: xy (0.64, 0.33), (0.30, 0.60), (0.15, 0.06)"],
          [tx(t, "oglColor_p2", "White point"), tx(t, "oglColor_p2w", "the colour of (1,1,1)"), "D65 (daylight, ~6504 K): xy (0.3127, 0.3290)"],
          [tx(t, "oglColor_p3", "Transfer function"), tx(t, "oglColor_p3w", "how stored numbers map to light: linear, gamma, log, PQ…"), tx(t, "oglColor_p3s", "piecewise: linear toe, then ≈ gamma 2.4 (the curve from the Gamma chapter)")],
        ]}
      />
      <p>
        {tx(t, "oglColor_xyzBody",
          "All spaces are defined relative to CIE XYZ (1931), a space derived from colour-matching experiments with human observers. It contains every visible colour, and Y is exactly luminance. Dividing out brightness gives the chromaticity coordinates x = X / (X + Y + Z) and y = Y / (X + Y + Z), plotted in the famous horseshoe diagram. A space's primaries are three points on it, and it can only reproduce the colours inside their triangle: its gamut.")}
      </p>
      <ChromaticityFigure t={t} />
      <Equation label={tx(t, "oglColor_matLabel", "Linear sRGB ↔ XYZ (D65)")}
        note={tx(t, "oglColor_matNote", "Each column of M is one primary's XYZ, scaled so R = G = B = 1 lands on the white point. The middle row is exactly the luminance weights 0.2126, 0.7152, 0.0722 you have been using. Converting between two RGB spaces means going through XYZ, M₂⁻¹ · M₁, one 3×3 matrix precomputed once, applied to linear values only.")}>
        {r`\begin{pmatrix} X \\ Y \\ Z \end{pmatrix} = \underbrace{\begin{pmatrix} 0.4124 & 0.3576 & 0.1805 \\ 0.2126 & 0.7152 & 0.0722 \\ 0.0193 & 0.1192 & 0.9505 \end{pmatrix}}_{M_{sRGB}} \begin{pmatrix} R \\ G \\ B \end{pmatrix}_{lin}`}
      </Equation>

      <H2>{tx(t, "oglColor_referredTitle", "Scene-referred and display-referred")}</H2>
      <p>
        {tx(t, "oglColor_referredBody",
          "The lighting pipeline computes physical quantities: radiance, which runs from starlight to the sun's disc across more than 20 stops. Those values are scene-referred: they describe the world and have no upper limit. A display emits between black and its peak brightness, a range of maybe 10 stops for SDR, so its values are display-referred. Somewhere in between, the scene has to be mapped to the display. That step, tone mapping, is as much an artistic decision as a technical one, because it decides what \"bright\" and \"dark\" look like.")}
      </p>
      <Equation label={tx(t, "oglColor_evLabel", "Exposure in stops (EV)")}
        where={[[r`L`, tx(t, "oglColor_wL", "scene luminance")], [r`k`, tx(t, "oglColor_wK", "exposure: set by the artist, or automatically from the scene's average log luminance (eye adaptation)")]]}
        note={tx(t, "oglColor_evNote", "One stop is a factor of 2 in light. Middle grey, 18% reflectance, is the anchor: exposure is chosen so middle grey lands where the tone curve puts mid-tones. Auto exposure measures the average of log2(L) over the frame (a mip chain or a histogram in compute) and eases k toward it over a second or so, like pupils adapting.")}>
        {r`L_{exposed} = L\cdot 2^{\,\text{EV}} \qquad \text{EV}_{auto} = \log_2\frac{0.18}{\exp\!\big(\overline{\ln L}\big)}`}
      </Equation>

      <H2>{tx(t, "oglColor_toneTitle", "Tone mapping, in depth")}</H2>
      <p>
        {tx(t, "oglColor_toneBody",
          "A good tone curve has three regions. The toe gently lifts or crushes deep shadows. The linear section in the middle keeps mid-tone contrast. The shoulder compresses highlights smoothly toward white, never clipping. Applied per RGB channel, the shoulder also desaturates bright colours, because the dominant channel is compressed more than the others. That creates a natural path to white, the way overexposed film and our eyes behave, but it also shifts hues.")}
      </p>
      <Equation label={tx(t, "oglColor_curvesLabel", "The curves in the figure")}
        where={[
          [r`x`, tx(t, "oglColor_wX", "exposed linear scene value (per channel, or luminance)")],
          [r`h(x)`, tx(t, "oglColor_wH", "Hable's filmic curve with A = 0.15, B = 0.50, C = 0.10, D = 0.20, E = 0.02, F = 0.30 (shoulder, linear, toe strengths)")],
          [r`W`, tx(t, "oglColor_wW", "Hable's white point: the scene value that maps to 1 (11.2)")],
        ]}
        notes={[
          tx(t, "oglColor_n1", "Reinhard has no toe and a very long shoulder. It is simple, but looks flat and grey."),
          tx(t, "oglColor_n2", "Hable (Uncharted 2) adds a toe and a proper shoulder: the first widely used \"filmic\" curve in games."),
          tx(t, "oglColor_n3", "Narkowicz's rational fit approximates the ACES RRT+ODT luminance curve in one line. Hill's fit adds the ACES input and output matrices, which changes how colours desaturate."),
        ]}>
        {r`\text{Reinhard: } \frac{x}{1 + x} \qquad h(x) = \frac{x(Ax + CB) + DE}{x(Ax + B) + DF} - \frac{E}{F},\ \ \text{Hable: } \frac{h(2x)}{h(W)} \qquad \text{ACES}_{fit}: \frac{x(2.51x + 0.03)}{x(2.43x + 0.59) + 0.14}`}
      </Equation>
      <ToneMapFigure t={t} />
      <H3>{tx(t, "oglColor_acesTitle", "ACES and AgX")}</H3>
      <p>
        {tx(t, "oglColor_acesBody",
          "The Academy Color Encoding System is the film industry's standard pipeline. An Input Transform brings every source (cameras, CG renders) into one wide scene-referred space, ACEScg. Grading and compositing happen there. A Reference Rendering Transform (RRT) applies the film-like tone curve, and an Output Transform (ODT) targets a specific display: sRGB monitor, Rec.2020 HDR TV, cinema projector. Games adopted it through fitted approximations. Its per-channel design produces well-known hue skews in bright saturated light, the \"notorious six\": blue → purple, red → orange and so on. AgX (Troy Sobotka, now Blender's default) insets the primaries before the curve and restores them after, which keeps bright colours on a cleaner path to white.")}
      </p>
      <CodeBlock lang="glsl" filename="tonemap.glsl" t={t}>{`// Stephen Hill's fit of ACES RRT+ODT (sRGB in, sRGB-linear out)
const mat3 ACES_IN  = mat3(0.59719, 0.07600, 0.02840,     // columns
                           0.35458, 0.90834, 0.13383,
                           0.04823, 0.01566, 0.83777);
const mat3 ACES_OUT = mat3( 1.60475, -0.10208, -0.00327,
                           -0.53108,  1.10813, -0.07276,
                           -0.07367, -0.00605,  1.07602);
vec3 rrtOdtFit(vec3 v) {
    vec3 a = v * (v + 0.0245786) - 0.000090537;
    vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
    return a / b;
}
vec3 acesFitted(vec3 c) { return clamp(ACES_OUT * rrtOdtFit(ACES_IN * c), 0.0, 1.0); }

// End of the frame: exposure → tone map → (grading LUT) → sRGB encode → dither
vec3 color = texture(hdrScene, uv).rgb * exp2(uExposureEV);
color = acesFitted(color);
FragColor = vec4(linearToSRGB(color), 1.0);`}</CodeBlock>

      <H2>{tx(t, "oglColor_hdrTitle", "HDR displays")}</H2>
      <p>
        {tx(t, "oglColor_hdrBody",
          "An HDR TV or monitor can show 1000 nits or more and the wide Rec.2020 gamut, but only if the signal says so. The swap chain switches to a 10-bit or float format, colours are converted to Rec.2020, and brightness is encoded with the PQ curve (SMPTE ST 2084), which is absolute: a given code value means a given number of nits. The tone mapper's output range becomes \"up to the display's peak\" instead of \"up to 1\", while the UI is drawn at a fixed \"paper white\" of about 200 nits so it does not glare.")}
      </p>
      <Equation label={tx(t, "oglColor_pqLabel", "PQ inverse EOTF (luminance in nits → signal)")}
        where={[[r`Y`, tx(t, "oglColor_wY", "luminance / 10000 nits")], [r`m_1, m_2, c_1, c_2, c_3`, tx(t, "oglColor_wPQ", "0.1593, 78.84, 0.8359, 18.85, 18.69: fitted to human contrast sensitivity, so each code value is one just-noticeable step")]]}>
        {r`E = \left(\frac{c_1 + c_2\,Y^{m_1}}{1 + c_3\,Y^{m_1}}\right)^{m_2}`}
      </Equation>
      <Callout type="warn" t={t}>
        {tx(t, "oglColor_pitfalls",
          "Colour textures are sRGB-encoded and must be linearised; data textures (normals, roughness) must not be. Do lighting and blending in linear space, tone map once, encode once. Applying sRGB encoding twice washes everything out, and forgetting it makes everything too dark and contrasty. Do colour grading after tone mapping with a 3D LUT, or before it in a log space, and be consistent. Render targets for HDR light need float formats (RGBA16F or R11G11B10F), or bright values clip before the tone mapper ever sees them.")}
      </Callout>

      <KeyIdeas t={t} id="oglColor" items={[
        "A colour space = primaries + white point + transfer function; RGB numbers mean nothing without it.",
        "XYZ is the common reference; converting RGB spaces is one 3×3 matrix on linear values.",
        "Lighting is scene-referred (unbounded); displays are display-referred; tone mapping bridges them.",
        "Tone curves have toe, linear section and shoulder; per-channel curves give a path to white, with hue skew.",
        "ACES: wide working space (ACEScg) + RRT + per-display ODT; AgX keeps bright hues cleaner.",
        "HDR output: Rec.2020 primaries, PQ encoding in absolute nits, UI at a fixed paper white.",
      ]} />
    </Article>
  );
}
