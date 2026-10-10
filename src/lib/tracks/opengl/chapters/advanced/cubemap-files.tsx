// src/lib/tracks/opengl/chapters/advanced/cubemap-files.tsx
"use client";

// Part of "Cubemaps & Skybox": crosses and panoramas, the single-image sky files, and how evenly each spends its pixels.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { panoNumbers, solidNumbers } from "@/lib/tracks/opengl/live/cubemaps";
import { SkyFormatsFigure } from "@/components/lesson/figures/sky/SkyFormatsFigure";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

const r = String.raw;

export function CubemapFiles({ t }: { t: TrackTranslations }) {
  return (
    <>
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
        note={tx(t, "oglCube_cellNote", "The vector is not normalised and does not need to be: a cube map only cares which way a vector points. Its largest component is always 1 (the f part), which is exactly the face-selection rule seen in the first figure, run backwards.")}
        words={tx(t, "oglCube_cellWords", "Start at the centre of the face the cell shows. Step a along the image's right direction and b along its down direction. The arrow from the cube's centre to that point is the direction the texel shows.")}>
        {r`\mathbf{d} = \mathbf{f} + a\,\mathbf{r} + b\,\mathbf{w}`}
      </Equation>
      <Derivation t={t} label={tx(t, "oglCube_cellDer", "Check: the right edge of the +X cell meets the +Z cell")}
        steps={[
          { full: true, tex: r`\begin{aligned} \mathbf f &= (1, 0, 0) \\ \mathbf r &= \mathbf f \times (0, 1, 0) \\ &= (0 \cdot 0 - 0 \cdot 1,\ 0 \cdot 0 - 1 \cdot 0,\ 1 \cdot 1 - 0 \cdot 0) = (0, 0, 1) \end{aligned}`,
            why: tx(t, "oglCube_cd1", "the +X cell looks along +X. Its right direction is the cross product with up, which comes out as +Z") },
          { full: true, tex: r`a = 1,\ b = 0: \quad \mathbf d = (1, 0, 0) + 1 \cdot (0, 0, 1) = (1, 0, 1)`,
            why: tx(t, "oglCube_cd2", "the middle of the cell's right edge: a = +1, b = 0") },
          { full: true, tex: r`|d_x| = |d_z| = 1`,
            why: tx(t, "oglCube_cd3", "x and z tie for the largest component: the direction lies exactly on the seam between +X and +Z. In the cross, the cell to the right of +X is +Z, so the picture continues across the edge, as it should") },
        ]} />

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
        glsl={`vec2 uv = vec2(atan(d.z, d.x) / (2.0 * PI) + 0.5, 0.5 - asin(d.y) / PI);`}
        words={tx(t, "oglCube_equiWords", "Measure the direction's angle around the vertical axis and divide by a full turn: that is how far across the image to go. Measure its angle above the horizon and divide by a half turn: that is how far down, counted from the top. Going back, the two angles give the direction with cosines and sines.")}>
        {r`\begin{gathered} u = \frac{\operatorname{atan2}(d_z, d_x)}{2\pi} + \frac12 \qquad v = \frac12 - \frac{\arcsin d_y}{\pi} \\[6pt] \mathbf{d} = (\cos\theta\cos\varphi,\ \sin\theta,\ \cos\theta\sin\varphi) \end{gathered}`}
      </Equation>
      <LiveFormula label={tx(t, "oglCube_livePano", "Try it: where does this direction land in the panorama?")}
        tex={r`u = \frac{\operatorname{atan2}(d_z, d_x)}{2\pi} + \frac12 \qquad v = \frac12 - \frac{\arcsin d_y}{\pi}`}
        vars={[
          { id: "phi", label: "φ", min: -180, max: 180, step: 5, value: 90, fmt: v => `${v}°` },
          { id: "theta", label: "θ", min: -90, max: 90, step: 5, value: 30, fmt: v => `${v}°` },
        ]}
        compute={panoNumbers()}
        note={tx(t, "oglCube_livePanoNote", "φ = 90° looks along +Z and lands three quarters across (u = 0.75); θ = 30° up is a third of the way from the horizon row to the top. At θ = ±90° every φ gives the same v: a whole row of pixels for one direction, the stretched pole.")} />

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
        note={tx(t, "oglCube_solidNote", "At a face corner (±1, ±1): 3^(−3/2) ≈ 0.19, so a cube map varies about 5× at most. A panorama goes to 0 at the poles, so it wastes resolution there and those pixels sparkle when minified. That is one reason renderers convert panoramas to cube maps.")}
        words={tx(t, "oglCube_solidWords", "A cube texel covers less sky the farther it is from the face centre, by the distance cubed. A panorama texel covers less sky the closer its row is to a pole, in proportion to the cosine of the latitude.")}>
        {r`\Delta\omega_{\text{cube}} \propto \left(1 + s_c^2 + t_c^2\right)^{-3/2} \qquad \Delta\omega_{\text{pano}} \propto \cos\theta`}
      </Equation>
      <LiveFormula label={tx(t, "oglCube_liveSolid", "Try it: how much sky does one texel cover?")}
        tex={r`\Delta\omega_{\text{cube}} \propto \left(1 + s_c^2 + t_c^2\right)^{-3/2} \qquad \Delta\omega_{\text{pano}} \propto \cos\theta`}
        vars={[
          { id: "s", label: <>s<sub>c</sub></>, min: -1, max: 1, step: 0.05, value: 1 },
          { id: "tc", label: <>t<sub>c</sub></>, min: -1, max: 1, step: 0.05, value: 1 },
          { id: "lat", label: "θ", min: 0, max: 90, step: 1, value: 80, fmt: v => `${v}°` },
        ]}
        compute={solidNumbers(t)}
        note={tx(t, "oglCube_liveSolidNote", "A cube corner keeps 0.19 of the centre's coverage, never less. A panorama row at 80° keeps 0.17, and it keeps falling: 0.035 at 88°, 0 at the pole.")} />

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
    </>
  );
}
