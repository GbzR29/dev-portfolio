"use client";

// "The Shader Playground": how the live editor used throughout the track works, and what it provides.

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "../../opengl/chapters/lighting-advanced";
import { ShaderPlayground } from "@/components/lesson/glsl/ShaderPlayground";
import { INTRO_PRESETS } from "../presets/basics";

export function PlaygroundContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "glslPg_intro",
          "From here on, almost every chapter has a live shader you can edit. The code is real GLSL ES 3.00, the same language as desktop GLSL 3.30+ apart from a precision line at the top, and it recompiles as you type. This chapter shows what the playground gives your shader, so you can focus on the maths in the rest of the track.")}
      </Lead>

      <ShaderPlayground presets={INTRO_PRESETS} t={t} id="glslPgIntro" />

      <H2>{tx(t, "glslPg_uniformsTitle", "What your shader receives")}</H2>
      <p>
        {tx(t, "glslPg_uniformsBody",
          "Everything below is declared for you, in a fixed prelude above your code. Error line numbers are shifted to match your code, not the prelude.")}
      </p>
      <LessonTable
        headers={[tx(t, "glslPg_thName", "Name"), tx(t, "glslPg_thType", "Type"), tx(t, "glslPg_thMeaning", "Meaning")]}
        rows={[
          ["uResolution", "vec2", tx(t, "glslPg_u1", "canvas size in pixels (device pixels, so it changes on HiDPI screens)")],
          ["uTime", "float", tx(t, "glslPg_u2", "seconds since start; stops while paused, ⟲ resets it")],
          ["uDelta, uFrame", "float, int", tx(t, "glslPg_u3", "seconds since the previous frame; frame counter")],
          ["uMouse", "vec4", tx(t, "glslPg_u4", "xy: pointer position in pixels while the button is held; zw: where it was pressed, negative after release (ShaderToy's iMouse)")],
          ["uTex0 … uTex3", "sampler2D", tx(t, "glslPg_u5", "textures chosen in the pickers that appear when your code uses them: procedural noise, real PBR material maps, prototype grids")],
          ["FragColor", "out vec4", tx(t, "glslPg_u6", "what the fragment shader writes, instead of the old gl_FragColor")],
        ]}
      />
      <p>
        {tx(t, "glslPg_meshBody",
          "Mesh presets add a vertex shader tab and render a real mesh (sphere, torus, cube or a finely subdivided plane) with an orbit camera. The vertex shader gets aPos, aNormal, aUV, aTangent and the uModel / uView / uProjection matrices. It passes vWorld, vNormal, vUV and vTangent to the fragment shader, which also receives uCamPos and uLightDir.")}
      </p>

      <H2>{tx(t, "glslPg_controlsTitle", "Controls from comments")}</H2>
      <p>
        {tx(t, "glslPg_controlsBody",
          "Any uniform followed by an annotation comment gets a control. Change the numbers in the comment, or add your own uniforms, and the control panel updates as you type:")}
      </p>
      <CodeBlock lang="glsl" filename="annotations.glsl" t={t}>{`uniform float uRadius;   // @slider 0.02 0.6 0.2       min max default [step]
uniform int   uMode;     // @slider 0 4 1              ints step by 1
uniform vec3  uColor;    // @color 1.0 0.55 0.1        a colour picker
uniform float uRings;    // @toggle 1                  a checkbox: 0.0 or 1.0`}</CodeBlock>
      <Callout type="tip" t={t}>
        {tx(t, "glslPg_toyTip",
          "Code from shadertoy.com runs unchanged: when your code defines mainImage() and no main(), the playground maps iTime, iResolution, iMouse and iChannel0..3 onto its own uniforms and calls mainImage for you. Use ⛶ for fullscreen with the editor beside the canvas.")}
      </Callout>

      <H2>{tx(t, "glslPg_debugTitle", "Debugging a shader")}</H2>
      <p>
        {tx(t, "glslPg_debugBody",
          "There is no printf on the GPU. The universal technique is to output the value you doubt as a colour. Write FragColor = vec4(vec3(x), 1.0) for a scalar, or vec4(v * 0.5 + 0.5, 1.0) for a direction in [−1, 1]. Then check that it looks the way you expect: black where it should be 0, white where 1, a smooth ramp where it should be continuous. Out-of-range values clip to black and white, so use fract(x) to see large values as bands.")}
      </p>
      <CodeBlock lang="glsl" filename="debug_views.glsl" t={t}>{`FragColor = vec4(vec3(d), 1.0);                   // a scalar
FragColor = vec4(normal * 0.5 + 0.5, 1.0);        // a direction
FragColor = vec4(fract(worldPos), 1.0);           // large coordinates as repeating bands
FragColor = vec4(d < 0.0 ? vec3(1, 0, 0) : vec3(0, 0, 1), 1.0);  // a sign
FragColor = vec4(isnan(x) || isinf(x) ? vec3(1, 0, 1) : vec3(0), 1.0);  // NaN hunting`}</CodeBlock>

      <KeyIdeas t={t} id="glslPg" items={[
        "The playground compiles real GLSL ES 3.00 as you type; errors point at your own line numbers.",
        "Built-ins: uResolution, uTime, uMouse (ShaderToy semantics), uTex0..3 textures, FragColor.",
        "// @slider, @color and @toggle after a uniform create controls automatically.",
        "Mesh presets add an editable vertex shader and an orbit camera.",
        "Debug by painting the value you doubt as a colour.",
      ]} />
    </Article>
  );
}
