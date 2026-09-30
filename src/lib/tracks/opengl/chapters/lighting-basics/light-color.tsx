// src/lib/tracks/opengl/chapters/lighting-basics/light-color.tsx
"use client";

// Light & Color (explanation pass 2026-09-30): what light is (a spectrum),
// why three numbers are enough for the eye; light × surface channel by
// channel, worked by hand (ColorMix figure); why multiply and why values stay
// ≤ 1 for surfaces; the RGB product as an approximation of the spectral
// integral (Spectrum figure); light intensities above 1; the object + lamp
// scene with its choices; mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { ColorMixFigure } from "@/components/lesson/figures/lighting/ColorMixFigure";
import { SpectrumFigure } from "@/components/lesson/figures/lighting/SpectrumFigure";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";

const r = String.raw;

// ═════════════════════════════════════════════════════════════════════════════
// 1. Light & Color
// ═════════════════════════════════════════════════════════════════════════════

export function LightColorContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglColor_intro",
          "Before lighting a scene we need to agree on what colour even is. An object is not \"red\" by itself — it is red because, of all the light that hits it, it throws back mostly the red part and swallows the rest. Computer graphics models that with one multiplication.")}
      </Lead>

      <H2>{tx(t, "oglColor_whatTitle", "What light is, and why three numbers")}</H2>
      <p>
        {tx(t, "oglColor_whatBody",
          "Visible light is electromagnetic radiation with wavelengths between about 400 nm (violet) and 700 nm (red). A light source is described by its spectrum: how much power it emits at each wavelength. Daylight has some of everything; a sodium street lamp puts almost all of its power into one yellow line at 589 nm. A full spectrum is a whole curve, but the eye does not see curves. The retina has three kinds of colour-sensitive cells (cones), most sensitive to long, medium and short wavelengths, and each reports a single number: how strongly it was stimulated. Everything we perceive as colour is those three numbers.")}
      </p>
      <p>
        {tx(t, "oglColor_whatRgb",
          "That is why a screen can fake any colour with only three kinds of sub-pixel, red, green and blue: it only needs to excite the three cones in the same proportions as the real light would. Two different spectra that excite the cones the same way look identical (they are called metamers). So graphics describes every light and every surface with three numbers, R, G and B, and does all its arithmetic on those.")}
      </p>

      <H2>{tx(t, "oglColor_mulTitle", "Light times surface")}</H2>
      <p>
        {tx(t, "oglColor_mulBody",
          "We describe both the light and the surface with three numbers between 0 and 1: how much red, green and blue. For the light that is how much it emits; for the surface, the fraction of each channel it reflects. The colour that reaches the eye is the product, channel by channel:")}
      </p>

      <Equation label={tx(t, "oglColor_eqLabel", "Reflected colour")}
        where={[
          [r`\mathbf{L}`, tx(t, "oglColor_wL", "light colour (what the source emits)")],
          [r`\mathbf{S}`, tx(t, "oglColor_wS", "surface colour (fraction of each channel it reflects)")],
          [r`\odot`, tx(t, "oglColor_wOdot", "component-wise product — what vec3 * vec3 does in GLSL")],
        ]}>
        {r`\mathbf{c} \;=\; \mathbf{L} \odot \mathbf{S} \;=\; \begin{pmatrix} \red{L_r S_r} \\ \green{L_g S_g} \\ \blue{L_b S_b} \end{pmatrix}`}
      </Equation>

      <H3>{tx(t, "oglColor_workedTitle", "Worked example: one coral surface, three lights")}</H3>
      <p>
        {tx(t, "oglColor_workedIntro",
          "Take the coral surface S = (1.0, 0.5, 0.31): it reflects all of the red, half of the green and 31% of the blue that reaches it.")}
      </p>
      <LessonTable
        headers={[tx(t, "oglColor_tLight", "Light L"), tx(t, "oglColor_tProduct", "L ⊙ S"), tx(t, "oglColor_tLooks", "What we see")]}
        rows={[
          [tx(t, "oglColor_l1", "white (1, 1, 1)"), "(1.0, 0.5, 0.31)", tx(t, "oglColor_l1r", "coral: the surface's own colour, because white light has every channel at full strength")],
          [tx(t, "oglColor_l2", "warm bulb (1, 0.78, 0.5)"), "(1.0, 0.39, 0.155)", tx(t, "oglColor_l2r", "a deeper orange: the light has less blue and green to give")],
          [tx(t, "oglColor_l3", "pure green (0, 1, 0)"), "(0, 0.5, 0)", tx(t, "oglColor_l3r", "a dark green: the only channel the light contains is one the surface reflects half of")],
          [tx(t, "oglColor_l4", "pure blue (0, 0, 1)"), "(0, 0, 0.31)", tx(t, "oglColor_l4r", "a dim navy, nearly black: coral is a poor reflector of blue")],
        ]}
      />
      <p>
        {tx(t, "oglColor_mulTry",
          "Try it below. A coral surface under white light looks coral. Under a pure green light it turns almost black: it reflects only half of the green channel and there is no red or blue left in the light for it to reflect.")}
      </p>

      <ColorMixFigure t={t} />

      <H3>{tx(t, "oglColor_whyMulTitle", "Why multiply, and why surfaces stay at or below 1")}</H3>
      <p>
        {tx(t, "oglColor_whyMulBody",
          "A surface cannot create light; it can only send back part of what arrives. The part it does not send back is absorbed and turns into heat. A fraction of something is a multiplication by a number between 0 and 1, so surface colours live in [0, 1] per channel. Adding the two colours instead would make a white wall under a dim red lamp brighter than the lamp itself, which is impossible. Light colours have no such limit: a lamp can be twice as bright as another, so L = (2, 2, 2) is perfectly valid, as long as the result is computed in floating point before it reaches the screen (the HDR chapter uses exactly that).")}
      </p>

      <CodeBlock lang="glsl" filename="color.frag" t={t}>{`#version 460 core
out vec4 FragColor;

uniform vec3 objectColor;   // e.g. (1.0, 0.5, 0.31) — coral
uniform vec3 lightColor;    // e.g. (1.0, 1.0, 1.0)  — white

void main() {
    FragColor = vec4(lightColor * objectColor, 1.0);   // component-wise
}`}</CodeBlock>

      <H2>{tx(t, "oglColor_specTitle", "The RGB product is an approximation")}</H2>
      <p>
        {tx(t, "oglColor_specBody",
          "Physically, the multiplication happens at every wavelength, and only afterwards does the eye reduce the result to three numbers:")}
      </p>
      <Equation label={tx(t, "oglColor_eqSpec", "The spectral version of \"light × surface\"")}
        where={[
          [r`E(\lambda)`, tx(t, "oglColor_wE", "the light's power at wavelength λ (its spectrum)")],
          [r`\rho(\lambda)`, tx(t, "oglColor_wRho", "the surface's reflectance at λ: the fraction it sends back, between 0 and 1")],
          [r`s_k(\lambda)`, tx(t, "oglColor_wSk", "the sensitivity of channel k (R, G or B) to wavelength λ")],
          [r`\int \ldots\, d\lambda`, tx(t, "oglColor_wInt", "the sum over all visible wavelengths, 400 to 700 nm")],
        ]}>
        {r`c_k \;=\; \int_{400}^{700} E(\lambda)\,\rho(\lambda)\,s_k(\lambda)\,d\lambda, \qquad k \in \{R, G, B\}`}
      </Equation>
      <p>
        {tx(t, "oglColor_specWhy",
          "The shader instead first reduces E to three numbers L, and ρ to three numbers S, and then multiplies them. The two orders give the same answer only when the spectra are smooth inside each channel's band. Where a light or a surface has sharp peaks, the three numbers forget where inside the band the energy sits, and the shortcut drifts from the truth. With the simplified sensitivities in the figure below:")}
      </p>
      <ul className="list-disc pl-6 space-y-1.5">
        <li>{tx(t, "oglColor_s1", "Coral under daylight: spectral (0.58, 0.31, 0.12), shortcut (0.59, 0.32, 0.12). The largest error is 0.009, invisible.")}</li>
        <li>{tx(t, "oglColor_s2", "Coral under a sodium lamp: spectral (0.67, 0.35, 0.02), shortcut (0.67, 0.21, 0.02). The green channel is off by 0.14: the lamp's one yellow line falls where coral reflects well, and the shortcut does not know that.")}</li>
        <li>{tx(t, "oglColor_s3", "A grey card, ρ = 0.5 at every wavelength, is exact under every light: a constant reflectance comes out of the integral as a plain factor, so multiplying before or after makes no difference.")}</li>
      </ul>
      <SpectrumFigure t={t} />
      <Callout type="info" t={t}>
        {tx(t, "oglColor_specNote",
          "Games and real-time engines accept this approximation almost everywhere; the errors are small for natural light and materials. Film renderers that must match real photographs (and anything simulating prisms, rainbows or fluorescence) render spectrally, carrying many wavelengths per ray.")}
      </Callout>

      <H2>{tx(t, "oglColor_sceneTitle", "A scene to light: object and lamp")}</H2>
      <p>
        {tx(t, "oglColor_sceneBody",
          "The next chapters light a cube with a lamp. The lamp is also drawn — a small white cube — but it must not be affected by the lighting maths, or it would shade itself. So it gets its own trivial shader and its own VAO, while sharing the same vertex buffer.")}
      </p>

      <CodeBlock lang="glsl" filename="lamp.frag" t={t}>{`#version 460 core
out vec4 FragColor;
void main() { FragColor = vec4(1.0); }   // always full white, never lit`}</CodeBlock>

      <CodeBlock lang="cpp" filename="scene_setup.cpp" t={t}>{`// One VBO with the cube, two VAOs that read it
glBindVertexArray(cubeVAO);
glBindBuffer(GL_ARRAY_BUFFER, VBO);
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)0);
glEnableVertexAttribArray(0);

glBindVertexArray(lampVAO);
glBindBuffer(GL_ARRAY_BUFFER, VBO);                 // same data
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)0);
glEnableVertexAttribArray(0);

// The lamp is the same cube, moved to the light and shrunk
glm::vec3 lightPos(1.2f, 1.0f, 2.0f);
glm::mat4 lampModel = glm::translate(glm::mat4(1.0f), lightPos);
lampModel = glm::scale(lampModel, glm::vec3(0.2f));`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "oglColor_tChoice", "Choice"), tx(t, "oglColor_tReason", "Reason")]}
        rows={[
          [tx(t, "oglColor_c1", "one VBO, two VAOs"), tx(t, "oglColor_c1b", "the geometry is identical, so it is uploaded once; a VAO only records how to read it, and the lamp will never need the normals the lit cube reads from attribute 1.")],
          [tx(t, "oglColor_c2", "stride 6 floats"), tx(t, "oglColor_c2b", "each vertex already holds a position and a normal (3 + 3 floats) for the next chapter; the lamp's VAO simply skips the normal.")],
          [tx(t, "oglColor_c3", "translate, then scale"), tx(t, "oglColor_c3b", "GLM multiplies on the right, so the scale is applied to the vertices first: the cube shrinks around its own centre and is then moved to the light, not shrunk toward the world origin.")],
          [tx(t, "oglColor_c4", "a separate shader for the lamp"), tx(t, "oglColor_c4b", "the lamp is the light; lighting it with its own light would darken its far side and make it look like an ordinary object.")],
        ]}
      />

      <Callout type="info" t={t}>
        {tx(t, "oglColor_linearNote",
          "These numbers are linear intensities, not the values a colour picker shows. Multiplying them is physically meaningful only in linear space — a subtlety that returns in the Gamma Correction chapter, where it explains why naive lighting looks too dark.")}
      </Callout>

      <H2>{tx(t, "oglColor_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "oglColor_tMistake", "Mistake"), tx(t, "oglColor_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "oglColor_e1", "Colours written as 0–255"), tx(t, "oglColor_e1b", "vec3(255, 127, 80) is 255 times too bright and everything turns white. Divide by 255: (1.0, 0.5, 0.31).")],
          [tx(t, "oglColor_e2", "Adding light and surface colours"), tx(t, "oglColor_e2b", "surfaces glow brighter than the light and dark lights no longer darken. Reflection is a product.")],
          [tx(t, "oglColor_e3", "A light with a channel at exactly 0"), tx(t, "oglColor_e3b", "every surface is black in that channel, however bright it is: pure-colour lights look harsh. Real coloured lights keep a little of every channel.")],
          [tx(t, "oglColor_e4", "Lighting the lamp with the object shader"), tx(t, "oglColor_e4b", "the lamp is shaded like any cube and stops looking like a light. Give it its own unlit shader.")],
          [tx(t, "oglColor_e5", "Mixing picker (sRGB) values into lighting maths"), tx(t, "oglColor_e5b", "results come out too dark and hues shift. Convert to linear first (Gamma Correction chapter).")],
        ]}
      />

      <KeyIdeas t={t} id="oglColor" items={[
        "The colour we see is light × surface, one channel at a time.",
        "A surface can only reflect channels the light actually contains.",
        "Light sources get their own simple shader so they are never lit themselves.",
        "Light is a spectrum; three numbers suffice because the eye has three kinds of cone.",
        "Surface colours are fractions in [0, 1]; light colours can exceed 1 when computed in floating point.",
        "The RGB product approximates a per-wavelength product; it is exact for flat reflectances and off for spiky lights like sodium lamps.",
      ]} />
    </Article>
  );
}
