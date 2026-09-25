// src/lib/tracks/opengl/chapters/advanced/cubemaps.tsx
"use client";

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { CubemapExplorerFigure } from "@/components/lesson/figures/CubemapExplorerFigure";
import { SkyboxTrickFigure } from "@/components/lesson/figures/SkyboxTrickFigure";
import { SkyboxTypesFigure } from "@/components/lesson/figures/SkyboxTypesFigure";
import { EnvMapFigure } from "@/components/lesson/figures/EnvMapFigure";
import { SkyFormatsFigure } from "@/components/lesson/figures/sky/SkyFormatsFigure";
import { ProceduralSkyFigure } from "@/components/lesson/figures/sky/ProceduralSkyFigure";
import { SkyBuilderFigure } from "@/components/lesson/figures/sky/SkyBuilderFigure";
import { tx } from "@/lib/tracks/tx";
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

      <H2>{tx(t, "oglCube_dirTitle", "Sampling with a direction")}</H2>
      <p>
        {tx(t, "oglCube_dirBody",
          "Picture yourself standing at the centre of a cube whose walls are painted with the scene around you. To know what you see in some direction, draw a ray from the centre and find where it hits a wall. That is exactly what texture(samplerCube, dir) does, and the GPU does it with almost no maths: the largest component of the direction picks the face, the other two, divided by it, give the position on that face."
        )}
      </p>

      <CubemapExplorerFigure t={t} />

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

      <H2>{tx(t, "oglCube_filesTitle", "Crosses and panoramas: the files you actually download")}</H2>
      <p>
        {tx(t, "oglCube_filesBody",
          "Six separate files are the tidy case. Skies are just as often shipped as a single image, in one of two layouts. A cross is the cube unfolded flat: a 4×3 grid of squares where six cells hold the faces and the other six are empty. A panorama is the whole sphere unrolled the way a world map unrolls the Earth: 2:1, longitude across and latitude down. Both hold the same sky as six faces, just stored differently. The figure shows the two files of one sky: point at either image and the same direction lights up in the other."
        )}
      </p>

      <SkyFormatsFigure t={t} />

      <H3>{tx(t, "oglCube_crossTitle", "Cutting a cross into six faces")}</H3>
      <p>
        {tx(t, "oglCube_crossBody",
          "Every cell is N = width / 4 pixels square. A cross is drawn as you would see the sky from inside the cube: along the middle row you turn right as you move right, and the top and bottom cells fold up and down from the second cell. That makes each cell a small camera. It looks along a direction f, the image's right points along r and the image's down points along w. The texel at (a, b), with both running from −1 at one edge to +1 at the other, looks along:"
        )}
      </p>

      <Equation label={tx(t, "oglCube_cellLabel", "Direction seen through one texel of a cross cell")}
        where={[
          [r`\mathbf{f}`, tx(t, "oglCube_wF", "where the cell looks: the centre of the face, e.g. (1, 0, 0) for the cell that becomes +X")],
          [r`\mathbf{r},\ \mathbf{w}`, tx(t, "oglCube_wRW", "unit vectors along the image's right and down directions for that cell. For the four side cells w = (0, −1, 0) and r = f × (0, 1, 0)")],
          [r`a,\ b`, tx(t, "oglCube_wAB", "position inside the cell, −1 … +1 from the left/top edge to the right/bottom edge: a = 2·(x + ½)/N − 1")],
        ]}
        note={tx(t, "oglCube_cellNote", "The vector is not normalised and does not need to be: a cube map only cares which way a vector points. Its largest component is always 1 (the f part), which is exactly the face-selection rule seen in the first figure, run backwards.")}>
        {r`\mathbf{d} = \mathbf{f} + a\,\mathbf{r} + b\,\mathbf{w}`}
      </Equation>

      <p>
        {tx(t, "oglCube_crossMatch",
          "OpenGL defines each face with its own table: face texel (s, t) looks along, for example, (1, −t, −s) on +X. Setting the two directions equal tells you which cell texel each face texel must read. For the crosses shipped with this site the answer is a mirror for the four side faces and a mirror plus a quarter turn for the top and bottom:"
        )}
      </p>

      <LessonTable
        headers={[
          tx(t, "oglCube_xFace", "Face"),
          tx(t, "oglCube_xCell", "Cell (col, row)"),
          tx(t, "oglCube_xRead", "Face texel (x, y) reads cell texel"),
          tx(t, "oglCube_xWhat", "What happens to the picture"),
        ]}
        rows={[
          ["+X, −X, +Z, −Z", "(1,1) (3,1) (2,1) (0,1)", "(N−1−x, y)", tx(t, "oglCube_xSide", "mirrored left ↔ right")],
          ["+Y", "(1, 0)", "(y, x)", tx(t, "oglCube_xTop", "transposed: mirrored and turned a quarter")],
          ["−Y", "(1, 2)", "(N−1−y, N−1−x)", tx(t, "oglCube_xBottom", "transposed across the other diagonal")],
        ]}
      />

      <p>
        {tx(t, "oglCube_mirrorWhy",
          "Why mirrored? The cube map convention comes from RenderMan and describes each face as seen from outside the cube, in a left-handed frame. A picture of the view from inside is that face's mirror image. This is the same fact as the Callout above about labels reading backwards in the unfolded cube."
        )}
      </p>

      <CodeBlock lang="cpp" filename="load_cross.cpp" t={t}>{`// A 4x3 horizontal cross drawn as seen from inside, second column = +X.
struct Cell { int col, row, op; };        // op: how face texel (x,y) reads the cell
const Cell cells[6] = {                   // in GL order: +X -X +Y -Y +Z -Z
    {1, 1, 0}, {3, 1, 0}, {1, 0, 1}, {1, 2, 2}, {2, 1, 0}, {0, 1, 0},
};

int W, H, ch;
unsigned char* img = stbi_load("sky_cross.png", &W, &H, &ch, 4);   // force RGBA
const int N = W / 4;                       // H must be 3N
std::vector<unsigned char> face(N * N * 4);

for (int f = 0; f < 6; ++f) {
    const Cell& c = cells[f];
    for (int y = 0; y < N; ++y)
        for (int x = 0; x < N; ++x) {
            int a = c.op == 0 ? N - 1 - x : c.op == 1 ? y : N - 1 - y;
            int b = c.op == 0 ? y         : c.op == 1 ? x : N - 1 - x;
            const unsigned char* src = img + ((c.row * N + b) * W + (c.col * N + a)) * 4;
            std::memcpy(&face[(y * N + x) * 4], src, 4);
        }
    glTexImage2D(GL_TEXTURE_CUBE_MAP_POSITIVE_X + f, 0, GL_SRGB8_ALPHA8,
                 N, N, 0, GL_RGBA, GL_UNSIGNED_BYTE, face.data());
}
stbi_image_free(img);`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "oglCube_crossWarn",
          "Crosses are not standardised. Some tools lay the middle row out as −X, +Z, +X, −Z, others put the top cell above the third column, and some already store each cell in OpenGL's orientation. For those, the upload needs no copy at all: set GL_UNPACK_ROW_LENGTH to W and GL_UNPACK_SKIP_PIXELS / GL_UNPACK_SKIP_ROWS to the cell's corner, and glTexImage2D reads the cell straight out of the big image. Before trusting any layout, load a test cross with the face names written on it and look around."
        )}
      </Callout>

      <H3>{tx(t, "oglCube_panoTitle", "Reading a panorama")}</H3>
      <p>
        {tx(t, "oglCube_panoBody",
          "A panorama is indexed by longitude and latitude. A direction's longitude is its angle around the vertical axis, and its latitude is its angle above the horizon. Each one is scaled into the 0…1 range of a texture coordinate:"
        )}
      </p>

      <Equation label={tx(t, "oglCube_equiLabel", "Direction → panorama coordinate, and back")}
        where={[
          [r`\operatorname{atan2}(d_z, d_x)`, tx(t, "oglCube_wAtan", "longitude φ in (−π, π]: the angle of the direction's horizontal part, measured from +X toward +Z. atan2 (not atan) keeps the quadrant")],
          [r`\arcsin(d_y)`, tx(t, "oglCube_wAsin", "latitude θ in [−π/2, π/2]: for a unit vector the height d_y is the sine of the elevation")],
          [r`\tfrac{1}{2\pi},\ \tfrac{1}{\pi}`, tx(t, "oglCube_wScale", "the full turn (2π) spans the width and the half turn from pole to pole (π) spans the height, hence the 2:1 image")],
          [r`\tfrac12 -`, tx(t, "oglCube_wFlip", "v is flipped because image rows start at the top, where the sky's zenith is")],
        ]}
        glsl={`vec2 uv = vec2(atan(d.z, d.x) / (2.0 * PI) + 0.5, 0.5 - asin(d.y) / PI);`}>
        {r`u = \frac{\operatorname{atan2}(d_z, d_x)}{2\pi} + \frac12 \qquad v = \frac12 - \frac{\arcsin d_y}{\pi} \qquad\Longleftrightarrow\qquad \mathbf{d} = (\cos\theta\cos\varphi,\ \sin\theta,\ \cos\theta\sin\varphi)`}
      </Equation>

      <p>
        {tx(t, "oglCube_distBody",
          "Neither format spends its pixels evenly over the sphere, and the figure's last two numbers measure by how much. A cube face is a flat square at distance 1 from the centre. A texel at (s_c, t_c) is √(1 + s_c² + t_c²) away and tilted away from the centre by the same factor, so it covers less of the sphere toward the corners. A panorama row at latitude θ is a circle of radius cos θ stretched to the full image width, so near the poles a whole row of pixels describes a tiny patch."
        )}
      </p>

      <Equation label={tx(t, "oglCube_solidLabel", "How much sky one texel covers (relative to the largest)")}
        where={[
          [r`s_c,\ t_c`, tx(t, "oglCube_wSc", "position on the face, −1 … +1 (0 = face centre)")],
          [r`(\,\cdot\,)^{-3/2}`, tx(t, "oglCube_wPow", "with ρ = √(1 + s_c² + t_c²), the texel’s distance from the centre: ρ⁻² because farther patches look smaller, times ρ⁻¹ because a tilted patch looks narrower (the cosine of its tilt is 1/ρ). Together ρ⁻³")],
          [r`\cos\theta`, tx(t, "oglCube_wCos", "the circumference of the latitude circle, relative to the equator")],
        ]}
        note={tx(t, "oglCube_solidNote", "At a face corner (±1, ±1): 3^(−3/2) ≈ 0.19, so a cube map varies about 5× at most. A panorama goes to 0 at the poles, so it wastes resolution there and those pixels sparkle when minified. That is one reason renderers convert panoramas to cube maps.")}>
        {r`\Delta\omega_{\text{cube}} \propto \left(1 + s_c^2 + t_c^2\right)^{-3/2} \qquad \Delta\omega_{\text{pano}} \propto \cos\theta`}
      </Equation>

      <CodeBlock lang="glsl" filename="equirect_to_cube.frag" t={t}>{`// Run once per face into a cube map attached to an FBO (six draws).
// uFace picks the row of OpenGL's face table; vUV is the texel's (s, t).
uniform sampler2D uPanorama;
uniform int uFace;
in vec2 vUV;
out vec4 FragColor;
const float PI = 3.14159265;

vec3 faceDir(int f, vec2 st) {
    vec2 c = st * 2.0 - 1.0;                        // (sc, tc) in [-1, 1]
    if (f == 0) return vec3( 1.0, -c.y, -c.x);
    if (f == 1) return vec3(-1.0, -c.y,  c.x);
    if (f == 2) return vec3( c.x,  1.0,  c.y);
    if (f == 3) return vec3( c.x, -1.0, -c.y);
    if (f == 4) return vec3( c.x, -c.y,  1.0);
    return            vec3(-c.x, -c.y, -1.0);
}

void main() {
    vec3 d = normalize(faceDir(uFace, vUV));
    vec2 uv = vec2(atan(d.z, d.x) / (2.0 * PI) + 0.5, 0.5 - asin(d.y) / PI);
    FragColor = textureLod(uPanorama, uv, 0.0);     // lod 0: no seam at u = 0|1
}`}</CodeBlock>

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

      <H2>{tx(t, "oglCube_procTitle", "A procedural sky, layer by layer")}</H2>
      <p>
        {tx(t, "oglCube_procBody",
          "A procedural sky is one function: it receives the view direction d (a unit vector) and returns the light arriving from that direction. The one below is built from five independent layers. Each is a function of d and of the direction toward the sun, s. They are summed, and the clouds are blended over the result. Try the time presets, then use S to solo each layer while reading its formula."
        )}
      </p>

      <ProceduralSkyFigure t={t} />

      <H3>{tx(t, "oglCube_pGradTitle", "1 · The base sky, the artist way")}</H3>
      <p>
        {tx(t, "oglCube_pGradBody",
          "The cheapest sky blends two colours by height, with a curve that concentrates the change near the horizon. The colours themselves depend on how high the sun is."
        )}
      </p>
      <Equation label={tx(t, "oglCube_gradLabel", "Gradient sky")}
        where={[
          [r`d_y`, tx(t, "oglCube_wDy", "height of the view direction: 0 at the horizon, 1 straight up")],
          [r`k = 0.45`, tx(t, "oglCube_wK", "an exponent below 1 bends the curve upward. d_y^0.45 is already 0.5 at d_y = 0.21, about 12° up, so most of the colour change sits near the horizon, as in real skies")],
          [r`\text{day}`, tx(t, "oglCube_wDay", "smoothstep(−0.25, 0.35, s_y): 0 at night, 1 in daylight, a smooth S-curve between. It blends the night and day versions of both colours")],
        ]}
        note={tx(t, "oglCube_gradNote", "A third term warms the horizon colour at dusk, more on the side facing the sun. Everything here is chosen by eye, so it is fast and easy to art-direct, but no physics links the colours to each other.")}>
        {r`C(\mathbf{d}) = \operatorname{mix}\!\big(C_{\text{horizon}},\ C_{\text{zenith}},\ d_y^{\,k}\big)`}
      </Equation>

      <H3>{tx(t, "oglCube_pScatTitle", "1 · The base sky, the physical way")}</H3>
      <p>
        {tx(t, "oglCube_pScatBody",
          "The sky is blue because air scatters short wavelengths more than long ones. A simple version of that physics treats the atmosphere as a flat, uniform slab one unit thick and follows light that scatters once. Four ideas are enough."
        )}
      </p>
      <Equation label={tx(t, "oglCube_massLabel", "Air mass: how much air a ray crosses")}
        where={[
          [r`d_y`, tx(t, "oglCube_wMassY", "the cosine of the angle from straight up. A ray at that angle crosses 1/cos of the slab's thickness")],
          [r`0.025`, tx(t, "oglCube_wEps", "keeps the horizon finite (1/0.025 = 40). On the real, curved Earth the horizon air mass is about 38")],
        ]}>
        {r`m(y) = \frac{1}{y + 0.025}`}
      </Equation>
      <Equation label={tx(t, "oglCube_beerLabel", "Beer–Lambert: light surviving a path")}
        where={[
          [r`\beta`, tx(t, "oglCube_wBeta", "how strongly one unit of air removes light, per colour channel")],
          [r`\beta_R \propto \lambda^{-4}`, tx(t, "oglCube_wRay", "Rayleigh scattering by air molecules. With λ = 700, 530 and 400 nm, (400/700)⁴ ≈ 0.107 and (400/530)⁴ ≈ 0.324, giving β_R = (0.035, 0.107, 0.33). Blue is scattered about ten times more than red")],
          [r`\beta_M,\ \beta_O`, tx(t, "oglCube_wMieO", "haze (Mie, grey, 0.012) and ozone. Ozone absorbs orange and green but scatters nothing, and it is what keeps the twilight zenith blue instead of olive")],
        ]}>
        {r`T = e^{-\beta\, m} \qquad L_{\text{sun}} = E\; e^{-(\beta_R + \beta_M + \beta_O)\, m(s_y)}`}
      </Equation>
      <Equation label={tx(t, "oglCube_scatLabel", "Single scattering toward the eye")}
        where={[
          [r`1 - e^{-\beta m(d_y)}`, tx(t, "oglCube_wFrac", "the fraction of light scattered somewhere along the view ray. It is small for blue at the zenith and close to 1 for every colour at the horizon, which is why the horizon turns white")],
          [r`\mu = \mathbf{d}\cdot\mathbf{s}`, tx(t, "oglCube_wMu", "cosine of the angle between the view and the sun")],
          [r`P_R(\mu) = \tfrac{3}{16\pi}(1+\mu^2)`, tx(t, "oglCube_wPR", "Rayleigh phase function: how much of the scattered light turns toward us. It is slightly brighter toward and away from the sun")],
          [r`P_{HG}(\mu, g)`, tx(t, "oglCube_wHG", "Henyey–Greenstein phase: (1 − g²) / (4π (1 + g² − 2gμ)^{3/2}). With g = 0.8, haze throws most light forward, which makes the bright glow around the sun")],
        ]}
        note={tx(t, "oglCube_scatNote", "One correction keeps sunsets right. For a high view, the air that scatters toward us sits higher up, where the sunlight reaching it has crossed less air. So the sun's air mass is multiplied by 0.25 + 0.75·e^(−3 d_y). Without it the whole sky takes the sun's orange tint at dusk.")}>
        {r`L(\mathbf{d}) = L_{\text{sun}} \Big[\big(1 - e^{-\beta_R m(d_y)}\big) P_R(\mu) + \big(1 - e^{-\beta_M m(d_y)}\big) P_{HG}(\mu, 0.8)\Big]`}
      </Equation>

      <H3>{tx(t, "oglCube_pSunTitle", "2 · The sun")}</H3>
      <Equation label={tx(t, "oglCube_sunLabel", "A disc is a threshold on the angle")}
        where={[
          [r`\mu`, tx(t, "oglCube_wMu2", "cos of the angle to the sun. It shrinks as the angle grows, so “inside the disc” means μ > cos R")],
          [r`R`, tx(t, "oglCube_wR", "angular radius, here 0.7° (the real sun is 0.27°, too small to see at this resolution)")],
          [r`\operatorname{smoothstep}`, tx(t, "oglCube_wSmooth", "an antialiased step: 0 outside cos(1.15R), 1 inside cos R, smooth in between")],
        ]}
        note={tx(t, "oglCube_sunNote", "Its colour is L_sun, the same attenuated sunlight that lights the sky, so it turns orange at sunset without any extra code.")}>
        {r`\text{disc} = \operatorname{smoothstep}\big(\cos 1.15R,\ \cos R,\ \mu\big)`}
      </Equation>

      <H3>{tx(t, "oglCube_pToolsTitle", "Tools first: hash, value noise and fBm")}</H3>
      <p>
        {tx(t, "oglCube_pToolsBody",
          "Stars, the Milky Way and clouds are all built from three small functions. None of them is specific to skies: the same three make fire, water ripples, terrain and marble. They are worth knowing by heart.")}
      </p>
      <Equation label={tx(t, "oglCube_hashLabel", "1. A hash: integer id → repeatable random number")}
        where={[
          [r`\mathbf p`, tx(t, "oglCube_wHashP", "an integer cell id (stored in a vec3). The same id must always give the same number")],
          [r`\operatorname{fract}(\mathbf p \cdot 0.1031)`, tx(t, "oglCube_wHashF", "scales the id and keeps only the fractional part, which scrambles the digits")],
          [r`\mathbf p \cdot (\mathbf p_{zyx} + 31.32)`, tx(t, "oglCube_wHashD", "mixes the three components into each other, so neighbouring ids give unrelated results")],
        ]}
        note={tx(t, "oglCube_hashNote", "This is Dave Hoskins' “hash without sine”. The older fract(sin(dot(p, k)) · 43758.5) works too, but sin loses precision for large arguments on some GPUs, and the pattern then turns into visible stripes. A hash is not random: it is a deterministic function that only looks random. That is what makes a procedural sky stable from one frame to the next.")}
        glsl={`float hash13(vec3 p) {\n    p = fract(p * 0.1031);\n    p += dot(p, p.zyx + 31.32);\n    return fract((p.x + p.y) * p.z);\n}`}>
        {r`h(\mathbf p) = \operatorname{fract}\big((q_x + q_y)\,q_z\big), \qquad \mathbf q = \mathbf f + \mathbf f\cdot(\mathbf f_{zyx} + 31.32),\quad \mathbf f = \operatorname{fract}(0.1031\,\mathbf p)`}
      </Equation>
      <Equation label={tx(t, "oglCube_noiseLabel", "2. Value noise: random values at grid points, smoothly blended")}
        where={[
          [r`\lfloor x\rfloor,\ f = x - \lfloor x\rfloor`, tx(t, "oglCube_wNoiseI", "the grid point to the left and the position between it and the next one (0 … 1)")],
          [r`h(\lfloor x\rfloor),\ h(\lfloor x\rfloor + 1)`, tx(t, "oglCube_wNoiseH", "the hashed values at the two surrounding grid points")],
          [r`u(f) = 3f^2 - 2f^3`, tx(t, "oglCube_wNoiseU", "the smoothstep curve. Its slope is 6f − 6f², which is 0 at both ends, so neighbouring segments join without a corner. Plain linear blending would leave a crease at every grid line")],
        ]}
        note={tx(t, "oglCube_noiseNote", "In 2D the same blend is done twice along x (the bottom and top pair of corners) and once along y between the results. In 3D there are four x-blends, two y-blends and one z-blend, eight corners in all. That is noise3() in the shader.")}>
        {r`n(x) = \operatorname{mix}\!\big(h(\lfloor x\rfloor),\ h(\lfloor x\rfloor + 1),\ u(f)\big)`}
      </Equation>
      <Equation label={tx(t, "oglCube_fbmLabel", "3. fBm: octaves of noise, each twice as fine and half as strong")}
        where={[
          [r`2^i`, tx(t, "oglCube_wFbmF", "frequency of octave i (the lacunarity is 2): each octave has features half the size of the previous one")],
          [r`0.5^{\,i+1}`, tx(t, "oglCube_wFbmA", "its amplitude (the gain is 0.5): fine detail is fainter than large shapes, as in clouds, coastlines and mountains")],
          [r`R`, tx(t, "oglCube_wFbmR", "a small rotation plus an offset between octaves, so the grids of different octaves never line up")],
        ]}
        note={tx(t, "oglCube_fbmNote", "The amplitudes add up to 1 − 0.5^N, so the sum stays in 0…1 but clusters around 0.5. This is why the cloud coverage slides its threshold between 0.3 and 0.7 rather than over the whole 0…1 range.")}>
        {r`\operatorname{fbm}(\mathbf p) = \sum_{i=0}^{N-1} 0.5^{\,i+1}\; n\big(2^i R^i\,\mathbf p\big)`}
      </Equation>

      <H3>{tx(t, "oglCube_pStarsTitle", "3 · Stars from a hash")}</H3>
      <p>
        {tx(t, "oglCube_pStarsBody",
          "Storing thousands of stars is unnecessary. Scale the direction and round it down, and the sky is cut into cells: floor(70·d) is a 3D integer cell index. A hash function turns that index into a number that looks random but is always the same for the same cell. Keep a star only if the number is below a threshold, place it at a jittered point inside the cell, and give it a brightness from a second hash. Step through it; the equation after the figure sums it up."
        )}
      </p>
      <SkyBuilderFigure t={t} part="stars" />
      <Equation label={tx(t, "oglCube_starLabel", "One star per lucky cell")}
        where={[
          [r`h_1 < 0.35\,\rho`, tx(t, "oglCube_wKeep", "keep the cell's star if its hash is below the density slider ρ times 0.35")],
          [r`\mathbf{c}`, tx(t, "oglCube_wC", "the star's centre: the cell centre plus up to ±0.3 cells of hashed jitter, so the grid never shows")],
          [r`e^{-90 r^2}`, tx(t, "oglCube_wGauss", "a Gaussian spot: r is the distance from p to c in cell units, and 90 makes the spot about a tenth of a cell wide")],
          [r`h_2^{\,6}`, tx(t, "oglCube_wMag", "raising a uniform random number to the 6th power makes most stars faint and a few bright, much like the real sky")],
        ]}
        note={tx(t, "oglCube_starNote", "Two more factors: a slow sine per star for twinkle, and a fade near the horizon (smoothstep(0, 0.25, d_y)), where thick air dims starlight. The whole layer is multiplied by night = 1 − smoothstep(−0.18, 0.04, s_y).")}>
        {r`\mathbf{p} = 70\,\mathbf{d} \qquad \text{cell} = \lfloor \mathbf{p} \rfloor \qquad \text{star} = e^{-90\,\lVert \mathbf{p} - \mathbf{c}\rVert^2}\,\big(0.3 + 6\,h_2^{\,6}\big)`}
      </Equation>

      <H3>{tx(t, "oglCube_pMilkyTitle", "4 · The Milky Way")}</H3>
      <SkyBuilderFigure t={t} part="milky" />
      <Equation label={tx(t, "oglCube_milkyLabel", "A soft band around a great circle")}
        where={[
          [r`\mathbf{G}`, tx(t, "oglCube_wG", "the normal of the galaxy's plane. Directions on the band are perpendicular to it, so x = d·G is 0 on the band and grows off it (x is the sine of the angle off the plane)")],
          [r`\sigma = 0.12`, tx(t, "oglCube_wSigma", "the band's half-width, about 7°. A Gaussian of x fades it softly on both sides")],
          [r`\operatorname{fbm}`, tx(t, "oglCube_wFbm", "fractal noise: fbm(p) = Σ 0.5^(i+1)·noise(2^i p), octaves at double the frequency and half the strength. It gives the band's clumpy texture")],
        ]}
        note={tx(t, "oglCube_milkyNote", "A second, narrower Gaussian (width 0.07) multiplied by noise darkens a dust lane down the middle. The colour warms toward a chosen galactic-centre direction, which is also where the band is brightest.")}>
        {r`x = \mathbf{d}\cdot\mathbf{G} \qquad \text{band} = e^{-x^2 / 2\sigma^2}\ \operatorname{fbm}(6\,\mathbf{d})`}
      </Equation>

      <H3>{tx(t, "oglCube_pCloudTitle", "5 · Clouds on a plane")}</H3>
      <p>
        {tx(t, "oglCube_pCloudBody",
          "Real clouds are volumes, and the Volumetrics chapter marches through them. A convincing cheap version treats the cloud layer as a flat sheet at height 1. For each view ray, find where it meets the sheet and read 2D noise there. Eight steps take it from a checkerboard to lit, drifting clouds."
        )}
      </p>
      <SkyBuilderFigure t={t} part="clouds" />
      <Equation label={tx(t, "oglCube_cloudLabel", "Ray–plane hit, coverage and one step of light")}
        where={[
          [r`t = 1/d_y`, tx(t, "oglCube_wT", "the distance along d to the plane y = 1, since the ray's height is t·d_y. Near the horizon t explodes, so hits far away are spread over huge areas")],
          [r`\mathbf{p}`, tx(t, "oglCube_wP", "the hit point's horizontal position, scaled, plus a wind offset that grows with time")],
          [r`e`, tx(t, "oglCube_wE", "the coverage edge, mix(0.7, 0.3, cover): the lower it is, the more of the noise counts as cloud")],
          [r`n(\mathbf{p}+\boldsymbol{\delta}) - n(\mathbf{p})`, tx(t, "oglCube_wLit", "one step toward the sun. If the noise is denser there, sunlight had to cross more cloud to arrive, so this point is darker (Beer–Lambert again, with a step of 0.12)")],
          [r`e^{-0.12\,t}`, tx(t, "oglCube_wFade", "distance fade. Far clouds dissolve into the haze before their noise turns into flicker")],
        ]}
        note={tx(t, "oglCube_cloudNote", "Thick parts are darkened further, since little light reaches a cloud's underside. A Henyey–Greenstein term brightens edges when you look toward the sun: the silver lining.")}>
        {r`\mathbf{p} = t\,(d_x, d_z)\cdot 0.7 + \mathbf{v}_{\text{wind}}\,\text{time} \qquad \alpha = \operatorname{smoothstep}\big(e,\ e + 0.2,\ n(\mathbf{p})\big) \qquad \text{lit} = e^{-8\,\max(n(\mathbf{p}+\boldsymbol\delta) - n(\mathbf{p}),\,0)}`}
      </Equation>

      <p>
        {tx(t, "oglCube_pToneBody",
          "Everything above is radiance, with the sun thousands of times brighter than a star. One tone map at the very end, 1 − e^(−exposure·c), squeezes that range into 0…1 before the gamma encode. It is the same idea as the HDR chapter."
        )}
      </p>

      <Callout type="tip" t={t}>
        {tx(t, "oglCube_procTip",
          "Evaluating this per pixel every frame costs a few noise lookups per pixel, which is fine for a sky. When the same sky also has to feed reflections or image-based lighting, render it into a small cube map whenever the time of day changes and sample that instead. It is the equirectangular-to-cube pass above with sky(d) in place of the texture read."
        )}
      </Callout>

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
