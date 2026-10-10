// src/lib/tracks/opengl/chapters/advanced/cubemaps.tsx
"use client";

// "Cubemaps & Skybox". Two long sections live in their own files and are
// rendered in place: cubemap-files.tsx (crosses and panoramas) and
// cubemap-sky.tsx (the procedural sky).

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { faceNumbers, refractNumbers } from "@/lib/tracks/opengl/live/cubemaps";
import { CubemapExplorerFigure } from "@/components/lesson/figures/CubemapExplorerFigure";
import { SkyboxTrickFigure } from "@/components/lesson/figures/SkyboxTrickFigure";
import { SkyboxTypesFigure } from "@/components/lesson/figures/SkyboxTypesFigure";
import { EnvMapFigure } from "@/components/lesson/figures/EnvMapFigure";
import { CubemapFiles } from "./cubemap-files";
import { ProceduralSky } from "./cubemap-sky";
import { tx } from "@/lib/tracks/tx";
import { Goals } from "@/components/lesson/Prose";
import type { TrackTranslations } from "@/lib/tracks/types";

const r = String.raw;

// ── Cubemaps & Skybox ────────────────────────────────────────────────────────

export function CubemapsContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "oglCube_intro",
          "A cubemap is six square textures treated as the inside faces of a cube, sampled with a direction vector rather than a UV pair. You hand it a vec3 and it returns whatever colour lies that way. That single property makes it the natural representation for a sky, for environment reflections, and for omnidirectional shadow maps."
        )}
      </p>

      <Goals t={t} id="oglCube" items={[
        "Sample a cube map with a direction.",
        "Load the six faces, or convert a cross or a panorama.",
        "Draw a skybox behind everything else.",
        "Reflect and refract the surroundings on objects.",
      ]} />

      <H2>{tx(t, "oglCube_dirTitle", "Sampling with a direction")}</H2>
      <p>
        {tx(t, "oglCube_dirBody",
          "Picture yourself standing at the centre of a cube whose walls are painted with the scene around you. To know what you see in some direction, draw a ray from the centre and find where it hits a wall. That is exactly what texture(samplerCube, dir) does, and the GPU does it with almost no maths: the largest component of the direction picks the face, the other two, divided by it, give the position on that face."
        )}
      </p>

      <CubemapExplorerFigure t={t} />

      <LiveFormula label={tx(t, "oglCube_liveFaceLabel", "Try it: which face, and where on it?")}
        tex={r`\text{face} = \text{${tx(t, "oglCube_liveFaceTex", "largest")}}\ |d_i| \qquad s = \tfrac12\Big(\frac{s_c}{|m_a|} + 1\Big) \qquad t = \tfrac12\Big(\frac{t_c}{|m_a|} + 1\Big)`}
        vars={[
          { id: "phi", label: "φ", min: -180, max: 180, step: 5, value: 120, fmt: v => `${v}°` },
          { id: "theta", label: "θ", min: -85, max: 85, step: 5, value: 20, fmt: v => `${v}°` },
        ]}
        where={[
          [r`d_i`, tx(t, "oglCube_wDi", "the three components of the direction; the one with the largest size picks the face, its sign picks + or −")],
          [r`m_a`, tx(t, "oglCube_wMa", "that largest component. Dividing by it puts the direction on the face, at distance 1 from the centre")],
          [r`s_c,\ t_c`, tx(t, "oglCube_wSct", "the other two components, signed and ordered by OpenGL's table for that face (on −Z: s_c = −d_x, t_c = −d_y)")],
          [r`s,\ t`, tx(t, "oglCube_wSt", "the texture coordinate on the face, from 0 to 1: ½(… + 1) moves −1 … 1 into 0 … 1")],
        ]}
        compute={faceNumbers(t)}
        note={tx(t, "oglCube_liveFaceNote", "φ turns the direction around the vertical axis from +X towards +Z, θ lifts it above the horizon. Turn φ past 135° and the face switches from +Z to −X: at exactly 135° the two components are equal and the direction lies on the seam between the faces.")} />

      <Callout type="info" t={t}>
        {tx(t, "oglCube_handedNote",
          "Notice the labels in the unfolded cube read mirrored while they look right from inside. Cube maps follow a left-handed convention inherited from RenderMan, so faces are stored as if seen from outside. You rarely have to think about it — the six images you download are already authored for it — but it is why a hand-made cubemap often comes out flipped on the first try."
        )}
      </Callout>

      <H2>{tx(t, "oglCube_loadTitle", "Loading the six faces")}</H2>
      <p>
        {tx(t, "oglCube_loadBody",
          "A cubemap is one texture object with six images. The GL_TEXTURE_CUBE_MAP_POSITIVE_X … NEGATIVE_Z enums are consecutive integers, so the faces can be uploaded in a loop, as long as the files are listed in that exact order."
        )}
      </p>

      <LessonTable
        headers={[
          tx(t, "oglCube_tFace", "Target"),
          tx(t, "oglCube_tDir", "Direction"),
          tx(t, "oglCube_tFile", "Usual file names"),
        ]}
        rows={[
          ["GL_TEXTURE_CUBE_MAP_POSITIVE_X", "+X", "right · px · posx"],
          ["GL_TEXTURE_CUBE_MAP_NEGATIVE_X", "−X", "left · nx · negx"],
          ["GL_TEXTURE_CUBE_MAP_POSITIVE_Y", "+Y", "top · py · posy"],
          ["GL_TEXTURE_CUBE_MAP_NEGATIVE_Y", "−Y", "bottom · ny · negy"],
          ["GL_TEXTURE_CUBE_MAP_POSITIVE_Z", "+Z", "front · pz · posz"],
          ["GL_TEXTURE_CUBE_MAP_NEGATIVE_Z", "−Z", "back · nz · negz"],
        ]}
      />

      <CodeBlock lang="cpp" filename="cubemap.cpp" t={t}>{`// The order is fixed by the enum, and the enum values are consecutive:
// +X, -X, +Y, -Y, +Z, -Z  →  right, left, top, bottom, front, back
const std::array<std::string, 6> faces = {
    "right.jpg", "left.jpg", "top.jpg", "bottom.jpg", "front.jpg", "back.jpg"
};

unsigned int texID;
glGenTextures(1, &texID);
glBindTexture(GL_TEXTURE_CUBE_MAP, texID);

int w, h, channels;
for (unsigned i = 0; i < faces.size(); ++i) {
    unsigned char* data = stbi_load(faces[i].c_str(), &w, &h, &channels, 0);
    if (!data) { std::cerr << "missing face: " << faces[i] << "\\n"; continue; }
    glTexImage2D(GL_TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, GL_SRGB8,
                 w, h, 0, GL_RGB, GL_UNSIGNED_BYTE, data);
    stbi_image_free(data);
}

glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_R, GL_CLAMP_TO_EDGE);  // note R

// Filter across face edges instead of per face (core since GL 3.2)
glEnable(GL_TEXTURE_CUBE_MAP_SEAMLESS);`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "oglCube_flipWarn",
          "Do not flip cubemap faces vertically. The cubemap convention comes from RenderMan and has the opposite Y orientation to normal OpenGL textures, so the usual stbi_set_flip_vertically_on_load(true) produces an upside-down sky. Turn it off for these six loads specifically."
        )}
      </Callout>

      <CubemapFiles t={t} />

      <H2>{tx(t, "oglCube_skyTitle", "The skybox trick")}</H2>
      <p>
        {tx(t, "oglCube_skyBody",
          "A skybox is just a unit cube drawn around the camera with the cubemap on its inside. It must look infinitely far away, and three small lines achieve that: strip the translation out of the view matrix so the cube never moves relative to the camera, force its depth to the maximum so it loses every depth test against real geometry, and use GL_LEQUAL so that maximum depth still passes. Switch each one off in the figure below and walk around."
        )}
      </p>

      <SkyboxTrickFigure t={t} />

      <CodeBlock lang="glsl" filename="skybox.vert" t={t}>{`#version 460 core
layout (location = 0) in vec3 aPos;
out vec3 TexDir;

uniform mat4 uView;         // translation already removed on the CPU
uniform mat4 uProjection;

void main() {
    TexDir = aPos;                             // position IS the sample direction
    vec4 pos = uProjection * uView * vec4(aPos, 1.0);
    gl_Position = pos.xyww;                    // forces z/w == 1.0 → max depth
}`}</CodeBlock>

      <Derivation t={t} label={tx(t, "oglCube_depthDer", "Why .xyww puts the sky at the far plane, and why LESS then fails")}
        steps={[
          { full: true, tex: r`\text{gl\_Position} = (x,\ y,\ w,\ w)`,
            why: tx(t, "oglCube_dd1", "the swizzle copies w into the z slot, whatever the real z was") },
          { full: true, tex: r`z_{ndc} = \frac{w}{w} = 1`,
            why: tx(t, "oglCube_dd2", "the perspective divide turns z into z / w, which is now exactly 1, the far plane") },
          { full: true, tex: r`\text{depth} = \tfrac12\,z_{ndc} + \tfrac12 = 1`,
            why: tx(t, "oglCube_dd3", "the viewport maps −1 … 1 to the depth range 0 … 1, so every sky fragment has depth 1.0") },
          { full: true, tex: r`\text{LESS}: 1 < 1 \;\text{${tx(t, "oglCube_dd4f", "false")}} \qquad \text{LEQUAL}: 1 \le 1 \;\text{${tx(t, "oglCube_dd4t", "true")}}`,
            why: tx(t, "oglCube_dd4", "where nothing was drawn, the cleared depth is also 1.0. Equal is not less, so GL_LESS throws away every sky fragment; GL_LEQUAL lets them through, while any real object, with depth below 1, still wins") },
        ]} />

      <CodeBlock lang="cpp" filename="draw_skybox.cpp" t={t}>{`// Draw the skybox LAST so early-z rejects every pixel already covered
glDepthFunc(GL_LEQUAL);                            // depth is exactly 1.0
skyShader.use();
skyShader.setMat4("uView", glm::mat4(glm::mat3(camera.view())));  // drop translation
skyShader.setMat4("uProjection", projection);
glBindVertexArray(skyVAO);
glBindTexture(GL_TEXTURE_CUBE_MAP, texID);
glDrawArrays(GL_TRIANGLES, 0, 36);
glDepthFunc(GL_LESS);                              // restore`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "oglCube_lequalTip",
          "GL_LEQUAL is mandatory here. The cleared depth buffer holds 1.0 and the skybox writes exactly 1.0, so the default GL_LESS rejects every single fragment and you get no sky at all — with no error and nothing to debug. Drawing it last rather than first is a pure performance win: the depth buffer is already full, so almost all sky fragments die before the fragment shader runs."
        )}
      </Callout>

      <H2>{tx(t, "oglCube_kindsTitle", "Kinds of sky")}</H2>
      <p>
        {tx(t, "oglCube_kindsBody",
          "The skybox cube and its vertex shader never change. What changes is how the fragment shader turns a direction into a colour — from six images, from one panorama, or from a formula. Each has a place:"
        )}
      </p>

      <SkyboxTypesFigure t={t} />

      <LessonTable
        headers={[
          tx(t, "oglCube_kType", "Type"),
          tx(t, "oglCube_kData", "Data"),
          tx(t, "oglCube_kGood", "Strengths"),
          tx(t, "oglCube_kBad", "Weaknesses"),
        ]}
        rows={[
          [tx(t, "oglCube_kCube", "Cube map"), tx(t, "oglCube_kCubeData", "6 square images"),
            tx(t, "oglCube_kCubeGood", "No distortion, hardware filtering, direct sampling"),
            tx(t, "oglCube_kCubeBad", "Six files to author; resolution fixed per face")],
          [tx(t, "oglCube_kEqui", "Equirectangular"), tx(t, "oglCube_kEquiData", "1 image, 2:1"),
            tx(t, "oglCube_kEquiGood", "How HDRIs are shared; one file"),
            tx(t, "oglCube_kEquiBad", "Poles stretched, seam at u = 0|1, trig per pixel — usually converted to a cube map at load")],
          [tx(t, "oglCube_kProc", "Procedural"), tx(t, "oglCube_kProcData", "A shader + uniforms"),
            tx(t, "oglCube_kProcGood", "Zero texture memory, animates freely (time of day, weather)"),
            tx(t, "oglCube_kProcBad", "Costs ALU every pixel; realism depends on the model")],
          [tx(t, "oglCube_kDome", "Skydome"), tx(t, "oglCube_kDomeData", "Hemisphere mesh + texture"),
            tx(t, "oglCube_kDomeGood", "Easy to add clouds as layers, cheap on old hardware"),
            tx(t, "oglCube_kDomeBad", "Horizon seam; mostly superseded by the three above")],
        ]}
      />

      <Callout type="info" t={t}>
        {tx(t, "oglCube_hdrNote",
          "Modern renderers load an HDR equirectangular image once, render it into a floating-point cube map (six 90° views), and keep that. The same cube map is then blurred at several roughness levels to light the scene — image-based lighting. Everything in this chapter is the first step of that pipeline."
        )}
      </Callout>

      <ProceduralSky t={t} />

      <H2>{tx(t, "oglCube_reflectTitle", "Environment mapping")}</H2>
      <p>
        {tx(t, "oglCube_reflectBody",
          "Because a cubemap answers “what is in this direction?”, any shader that can compute a direction can use it. Reflect the view ray off the surface normal and you get a mirror; bend it with refract and you get glass."
        )}
      </p>

      <EnvMapFigure t={t} />

      <CodeBlock lang="glsl" filename="reflect.frag" t={t}>{`uniform samplerCube uSkybox;
uniform vec3 uCameraPos;

void main() {
    vec3 I = normalize(FragPos - uCameraPos);
    vec3 N = normalize(Normal);

    // Mirror
    vec3 R = reflect(I, N);

    // Glass — the ratio is airIOR / materialIOR
    // vec3 R = refract(I, N, 1.0 / 1.52);

    FragColor = vec4(texture(uSkybox, R).rgb, 1.0);
}`}</CodeBlock>

      <Equation label={tx(t, "oglCube_envLabel", "What reflect and refract compute")}
        where={[
          [r`\mathbf I`, tx(t, "oglCube_wI", "the view ray, from the camera to the fragment, normalised")],
          [r`\mathbf N`, tx(t, "oglCube_wN", "the surface normal, normalised")],
          [r`\eta = n_1 / n_2`, tx(t, "oglCube_wEta", "the ratio of refractive indices: 1.0 for air over 1.52 for glass, 1.33 for water, 2.42 for diamond")],
          [r`\theta_i,\ \theta_t`, tx(t, "oglCube_wTh", "the angles of the incoming and the bent ray, measured from the normal")],
        ]}
        words={tx(t, "oglCube_envWords", "Reflect removes twice the part of the ray that points into the surface, so it bounces off at the same angle. Refract keeps going into the surface, but tilts toward the normal: the sine of its angle shrinks by the ratio of the two indices.")}>
        {r`\operatorname{reflect}(\mathbf I, \mathbf N) = \mathbf I - 2\,(\mathbf N\cdot\mathbf I)\,\mathbf N \qquad n_1 \sin\theta_i = n_2 \sin\theta_t`}
      </Equation>
      <LiveFormula label={tx(t, "oglCube_liveRefract", "Try it: how much does glass bend the view ray?")}
        tex={r`\sin\theta_t = \frac{n_1}{n_2}\,\sin\theta_i`}
        vars={[
          { id: "th", label: <>θ<sub>i</sub></>, min: 0, max: 89, step: 1, value: 45, fmt: v => `${v}°` },
          { id: "n", label: <>n<sub>2</sub></>, min: 1, max: 2.5, step: 0.01, value: 1.52 },
        ]}
        compute={refractNumbers(t)}
        note={tx(t, "oglCube_liveRefractNote", "A ray at 45° into glass continues at 27.7°. Even a ray grazing the surface at 89° only reaches 41°: from inside, glass can see the whole outside world within a cone of 41°. Set n₂ to 1 and nothing bends.")} />

      <Callout type="info" t={t}>
        {tx(t, "oglCube_pbrNote",
          "This is a static reflection: the object mirrors the sky but never other objects, and it does not update as the scene changes. Rendering the scene into a dynamic cubemap fixes that at six times the cost. The same structure, pre-filtered by roughness, is what feeds image-based lighting in a PBR renderer — so this chapter is the foundation of that one."
        )}
      </Callout>

      <H2>{tx(t, "oglCube_dynTitle", "Dynamic cube maps")}</H2>
      <p>
        {tx(t, "oglCube_dynBody",
          "To reflect the scene itself, render it six times from the object's position — one 90° field of view per face — into a framebuffer whose colour attachment is a cube map face, then sample that cube map like any other. It costs six extra passes, so engines refresh it only every few frames, at low resolution, or only for the objects that need it."
        )}
      </p>

      <CodeBlock lang="cpp" filename="dynamic_cubemap.cpp" t={t}>{`glm::mat4 proj = glm::perspective(glm::radians(90.0f), 1.0f, 0.1f, 100.0f);
const glm::vec3 dirs[6] = { {1,0,0}, {-1,0,0}, {0,1,0}, {0,-1,0}, {0,0,1}, {0,0,-1} };
const glm::vec3 ups[6]  = { {0,-1,0}, {0,-1,0}, {0,0,1}, {0,0,-1}, {0,-1,0}, {0,-1,0} };

glBindFramebuffer(GL_FRAMEBUFFER, envFBO);
glViewport(0, 0, 256, 256);
for (int i = 0; i < 6; ++i) {
    glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0,
                           GL_TEXTURE_CUBE_MAP_POSITIVE_X + i, envCubemap, 0);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    glm::mat4 view = glm::lookAt(objectPos, objectPos + dirs[i], ups[i]);
    drawScene(view, proj);          // everything except the reflective object
}
glBindFramebuffer(GL_FRAMEBUFFER, 0);`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "oglCube_sourcesTip",
          "Free skies: Poly Haven publishes HDRIs under CC0 (equirectangular, several resolutions), and Humus' classic cube map collection ships ready-made six-face sets. For your own scenes, tools like cmgen or cmft convert between panoramas and cube maps."
        )}
      </Callout>

    </article>
  );
}
