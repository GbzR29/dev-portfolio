"use client";

// Geometry 7: volume and surface area — unit cubes and units, prisms and
// cylinders (base × height), Cavalieri's principle, pyramids and cones (⅓),
// the sphere by slicing, surface area from nets (box, cylinder, cone, sphere),
// k³ and the surface-to-volume ratio, and C++.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { VolumeFigure } from "@/components/lesson/figures/math/VolumeFigure";
import { NetFigure } from "@/components/lesson/figures/math/NetFigure";

const r = String.raw;

export function VolumesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mVol_intro",
          "Games are 3D, so sooner or later you need to know how much space a thing fills and how much skin it has. Volume gives a physics body its mass from its density, decides how much water a tank holds and how much a buoyant crate floats. Surface area decides how much texture a model needs, how fast something heats up or cools down, and how much paint a level artist's barrel would use. This chapter builds every standard formula from the area chapter, the circle chapter and one clever idea about slices.")}
      </Lead>

      <H2>{tx(t, "mVol_unitTitle", "Volume: counting unit cubes")}</H2>
      <p>
        {tx(t, "mVol_unitBody",
          "Area counts unit squares; volume counts unit cubes, cubes whose edges are 1 unit long. A cube 1 cm on each edge has a volume of 1 cubic centimetre, written 1 cm³. The small ³ is there because a volume is a length times a length times a length. That is also why unit conversions for volume are cubed: 1 m = 100 cm, so 1 m³ = 100 × 100 × 100 cm³ = 1 000 000 cm³. Liquids are measured in litres: 1 litre (L) is exactly 1000 cm³, the volume of a 10 cm cube, so 1 m³ holds 1000 L.")}
      </p>

      <H2>{tx(t, "mVol_prismTitle", "Boxes and prisms: base times height")}</H2>
      <p>
        {tx(t, "mVol_prismBody",
          "A box (the proper name is rectangular cuboid) a units long, b wide and c tall is built from layers of cubes. The bottom layer has a · b cubes, which is just the area of the floor, and there are c such layers. The first mode of the figure fills the layers one by one. The same argument works for any prism: a solid with the same cross-section all the way up, like a triangular tent, a hexagonal pencil or a brick with a hole. Each layer 1 unit thick holds (base area) cubes, so the volume is the base area times the height.")}
      </p>
      <Equation label={tx(t, "mVol_eqPrism", "Box, cube and any prism")}
        where={[
          [r`a,\ b,\ c`, tx(t, "mVol_wABC", "the length, width and height of the box")],
          [r`s`, tx(t, "mVol_wS", "the edge of a cube; s³ is literally \"s cubed\"")],
          [r`B`, tx(t, "mVol_wB", "the area of the base, the cross-section that repeats all the way up")],
          [r`h`, tx(t, "mVol_wH", "the height, measured perpendicular to the base")],
        ]}
        note={tx(t, "mVol_prismNote", "Example: a triangular tent with a triangle base 2 m wide and 1.5 m tall, 3 m long: B = ½ · 2 · 1.5 = 1.5 m², V = 1.5 · 3 = 4.5 m³.")}>
        {r`V_\text{box} = a\,b\,c \qquad V_\text{cube} = s^3 \qquad V_\text{prism} = B\,h`}
      </Equation>

      <VolumeFigure t={t} />

      <H2>{tx(t, "mVol_cavTitle", "Cavalieri's principle and the cylinder")}</H2>
      <p>
        {tx(t, "mVol_cavBody",
          "A cylinder is a prism whose base is a disc: every horizontal slice is the same circle. Its volume is therefore base times height, with the disc's area πr² as the base. To handle solids that lean or change shape, imagine them as stacks of extremely thin slices, like a deck of cards. Bonaventura Cavalieri noticed in 1635 that if two solids have the same height and their slices at every height have equal areas, their volumes must be equal, whatever each slice looks like. The second mode of the figure pushes a stack sideways: the volume cannot change, because no slice changed. So a leaning (oblique) cylinder or prism still has V = B h, as long as h is the straight-up height, not the length of the slanted side.")}
      </p>
      <Equation label={tx(t, "mVol_eqCyl", "Cylinder")}
        where={[
          [r`\pi r^2`, tx(t, "mVol_wDisc", "the area of the circular base, from the circle chapter")],
          [r`h`, tx(t, "mVol_wHc", "the height between the two circles, measured perpendicular to them")],
        ]}
        note={tx(t, "mVol_cylNote", "Example: a drink can with radius 3.3 cm and height 12 cm: V = π · 3.3² · 12 ≈ 410 cm³ ≈ 0.41 L.")}>
        {r`V_\text{cylinder} = \pi r^2 h`}
      </Equation>

      <H2>{tx(t, "mVol_coneTitle", "Pyramids and cones: one third")}</H2>
      <p>
        {tx(t, "mVol_coneBody",
          "A pyramid rises from its base to a single point, the apex; a cone is a pyramid with a circular base. It takes exactly three of them to fill the prism or cylinder with the same base and height; the cone mode of the figure pours them in. For a cube there is a neat way to see it: pick one corner of the cube, and the three faces that do not touch that corner are the bases of three identical square pyramids with their apex in that corner. They fill the cube exactly, so each one is ⅓ of it. Cavalieri extends the ⅓ to every pyramid and cone: at the same height, pyramids with equal base area and height have equal slices.")}
      </p>
      <Equation label={tx(t, "mVol_eqCone", "Pyramid and cone")}
        where={[
          [r`B`, tx(t, "mVol_wBp", "the area of the base (a square, a triangle, a disc…)")],
          [r`h`, tx(t, "mVol_wHp", "the perpendicular height, from the base up to the apex")],
          [r`\tfrac13`, tx(t, "mVol_wThird", "three pyramids fill the prism with the same base and height")],
        ]}
        note={tx(t, "mVol_coneNote", "Example: an ice-cream cone with radius 2.5 cm and height 10 cm holds ⅓ · π · 2.5² · 10 ≈ 65 cm³. The Great Pyramid, with a 230 m square base and 146 m height, is about ⅓ · 230² · 146 ≈ 2.6 million m³.")}>
        {r`V_\text{pyramid} = \tfrac13 B\,h \qquad V_\text{cone} = \tfrac13 \pi r^2 h`}
      </Equation>

      <H2>{tx(t, "mVol_sphereTitle", "The sphere")}</H2>
      <p>
        {tx(t, "mVol_sphereBody",
          "A sphere is the 3D circle: every point at distance r from a centre. Archimedes found its volume with the slicing idea, and the last mode of the figure repeats his argument with Pythagoras. Put a hemisphere (half a sphere) of radius r next to a cylinder of radius r and height r, from which a cone has been scooped out, point down. Cut both at height h. The hemisphere's slice is a disc whose radius ρ, the height h and the radius r form a right triangle: ρ² = r² − h², so the slice has area π(r² − h²). The other slice is a ring: the cylinder's disc πr² minus the cone's disc, whose radius is h (the cone is as wide as it is high), so πr² − πh². The two slices are always equal, so the volumes are equal.")}
      </p>
      <Equation label={tx(t, "mVol_eqSphere", "Volume of a sphere")}
        notes={[
          tx(t, "mVol_s1", "hemisphere = cylinder (height r) − cone (height r), by Cavalieri"),
          tx(t, "mVol_s2", "πr² · r − ⅓πr² · r = ⅔πr³"),
          tx(t, "mVol_s3", "a whole sphere is two hemispheres"),
        ]}>
        {r`V_\text{hemi} = \pi r^3 - \tfrac13 \pi r^3 = \tfrac23 \pi r^3 \;\Rightarrow\; V_\text{sphere} = \tfrac43 \pi r^3`}
      </Equation>
      <p>
        {tx(t, "mVol_sphereEx",
          "Example: a football with radius 11 cm has V = 4/3 · π · 11³ ≈ 5575 cm³ ≈ 5.6 L. A sphere fills 4/3 π r³ out of the (2r)³ = 8r³ of the cube around it: π/6 ≈ 52%. That is why a sphere collider around a boxy crate always leaves a lot of empty space.")}
      </p>

      <H2>{tx(t, "mVol_surfTitle", "Surface area: unfold it")}</H2>
      <p>
        {tx(t, "mVol_surfBody",
          "The surface area of a solid is the total area of its outside, measured in square units (cm², m²). For a solid with flat faces, cut along some edges and fold it out flat: the result is a net, and its area is the surface area. The figure below unfolds a box. A box has three pairs of equal rectangles, so its surface is 2(ab + bc + ca); a cube with edge s has 6s².")}
      </p>

      <NetFigure t={t} />

      <H3>{tx(t, "mVol_cylSurfTitle", "Cylinder and cone")}</H3>
      <p>
        {tx(t, "mVol_cylSurfBody",
          "A cylinder's surface is two discs and a curved side. Cut the side straight down and unroll it, like the label of a can: it becomes a rectangle, as tall as the can (h) and as long as the circle around it (2πr). A cone's curved side unrolls into a sector (a pizza slice) whose radius is the slant height l, the distance from the apex down the side to the rim, and whose arc is the base's circumference 2πr. The circle chapter showed that a sector's area is the same fraction of its full circle as its arc: (2πr / 2πl) · πl² = πrl. The slant height comes from Pythagoras: l = √(r² + h²).")}
      </p>
      <Equation label={tx(t, "mVol_eqSurf", "Surface areas")}
        where={[
          [r`2\pi r h`, tx(t, "mVol_wSide", "the cylinder's unrolled side: a 2πr × h rectangle")],
          [r`l = \sqrt{r^2 + h^2}`, tx(t, "mVol_wSlant", "the cone's slant height, apex to rim")],
          [r`\pi r l`, tx(t, "mVol_wConeSide", "the cone's unrolled side, a sector of radius l")],
        ]}>
        {r`S_\text{box} = 2(ab + bc + ca) \qquad S_\text{cyl} = 2\pi r^2 + 2\pi r h \qquad S_\text{cone} = \pi r^2 + \pi r l`}
      </Equation>
      <H3>{tx(t, "mVol_sphSurfTitle", "The sphere's surface")}</H3>
      <p>
        {tx(t, "mVol_sphSurfBody",
          "A sphere cannot be unrolled flat without stretching (that is why every world map distorts something), so it needs another argument. Cover the surface with tiny patches and join each one to the centre: the sphere becomes many thin pyramids, each with a patch as its base and height r. Their volumes add up to the sphere's: ⅓ · (all the patches) · r = ⅓ · S · r. Setting that equal to 4/3 πr³ and dividing by r/3 gives S = 4πr², exactly four times the area of the circle through the sphere's middle.")}
      </p>
      <Equation label={tx(t, "mVol_eqSphS", "Surface of a sphere")}
        where={[
          [r`S`, tx(t, "mVol_wSs", "the area of the whole sphere's skin")],
          [r`\tfrac13 S\,r`, tx(t, "mVol_wPyr", "all the thin pyramids together: bases S, height r")],
        ]}>
        {r`\tfrac13\,S\,r = \tfrac43 \pi r^3 \;\Rightarrow\; S_\text{sphere} = 4\pi r^2`}
      </Equation>

      <H2>{tx(t, "mVol_scaleTitle", "Scaling: k² for skin, k³ for bulk")}</H2>
      <p>
        {tx(t, "mVol_scaleBody",
          "The similarity chapter's rule now has all its parts: scale a solid by k and its surface area is multiplied by k², its volume by k³. So the ratio of surface to volume is multiplied by k²/k³ = 1/k: bigger things have less skin for their bulk. A mouse loses heat much faster for its size than an elephant; crushed ice melts faster than one big block; small particles in a physics simulation need proportionally more surface forces (drag) than large ones. And a model scaled up 2× needs 4× the texture resolution to look as sharp but weighs 8× as much if its density stays the same.")}
      </p>
      <LessonTable
        headers={[tx(t, "mVol_tSolid", "Solid"), tx(t, "mVol_tVol", "Volume"), tx(t, "mVol_tSurf", "Surface area")]}
        rows={[
          [tx(t, "mVol_r1", "box a × b × c"), "abc", "2(ab + bc + ca)"],
          [tx(t, "mVol_r2", "cube, edge s"), "s³", "6s²"],
          [tx(t, "mVol_r3", "prism, base B, height h"), "Bh", tx(t, "mVol_r3s", "2B + perimeter of base · h")],
          [tx(t, "mVol_r4", "cylinder"), "πr²h", "2πr² + 2πrh"],
          [tx(t, "mVol_r5", "pyramid"), "⅓Bh", tx(t, "mVol_r5s", "base + triangular sides")],
          [tx(t, "mVol_r6", "cone"), "⅓πr²h", "πr² + πrl"],
          [tx(t, "mVol_r7", "sphere"), "4/3 πr³", "4πr²"],
        ]}
      />

      <H2>{tx(t, "mVol_exTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "mVol_ex1",
          "1. A physics crate is 1 m × 0.8 m × 0.5 m and made of wood with density 600 kg/m³. V = 0.4 m³, so its mass is 600 · 0.4 = 240 kg. Engines like PhysX and Box2D compute mass this way when you give them a density instead of a mass.")}
      </p>
      <p>
        {tx(t, "mVol_ex2",
          "2. A cylindrical water tower has radius 3 m and is filled 4 m high: V = π · 9 · 4 ≈ 113 m³ ≈ 113 000 L. To double its capacity by widening, the radius must grow by √2 (area k²), to about 4.24 m, not to 6 m.")}
      </p>
      <p>
        {tx(t, "mVol_ex3",
          "3. A planet is shown as a sphere of radius 50 units. Its surface is 4π · 50² ≈ 31 416 square units. With one texel per square unit that is about a 256 × 128 texture's worth of texels (32 768), since an equirectangular map has a 2 : 1 shape.")}
      </p>

      <H2>{tx(t, "mVol_codeTitle", "Volumes in C++")}</H2>
      <p>
        {tx(t, "mVol_codeBody",
          "The formulas are one-liners. A useful pattern is to give each collider shape a volume function so that mass follows from a density, which keeps big and small objects of the same material physically consistent.")}
      </p>
      <CodeBlock lang="cpp" filename="volume.hpp" t={t}>{`#include <cmath>
#include <numbers>

constexpr float PI = std::numbers::pi_v<float>;

struct Box      { float a, b, c; };
struct Cylinder { float r, h; };
struct Cone     { float r, h; };
struct Sphere   { float r; };

float volume(const Box& s)      { return s.a * s.b * s.c; }
float volume(const Cylinder& s) { return PI * s.r * s.r * s.h; }
float volume(const Cone& s)     { return PI * s.r * s.r * s.h / 3.0f; }
float volume(const Sphere& s)   { return 4.0f / 3.0f * PI * s.r * s.r * s.r; }

float surface(const Box& s)      { return 2.0f * (s.a * s.b + s.b * s.c + s.c * s.a); }
float surface(const Cylinder& s) { return 2.0f * PI * s.r * (s.r + s.h); }
float surface(const Cone& s)     { return PI * s.r * (s.r + std::sqrt(s.r * s.r + s.h * s.h)); }
float surface(const Sphere& s)   { return 4.0f * PI * s.r * s.r; }

// Mass from density (kg/m^3) and any shape above
template <class Shape>
float mass(const Shape& s, float density) { return density * volume(s); }`}</CodeBlock>
      <Callout type="warn" t={t}>
        {tx(t, "mVol_intWarn", "Write 4.0f / 3.0f, not 4 / 3. Between two integers, / is integer division in C++, so 4 / 3 is 1 and every sphere would come out 25% too small, with no warning.")}
      </Callout>

      <H2>{tx(t, "mVol_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mVol_tWrong", "Wrong"), tx(t, "mVol_tRight", "Right"), tx(t, "mVol_tWhy", "Why")]}
        rows={[
          ["1 m³ = 100 cm³", "1 m³ = 1 000 000 cm³", tx(t, "mVol_m1", "a volume has three lengths, so the factor 100 is cubed")],
          [tx(t, "mVol_m2w", "using the slanted side as the height"), tx(t, "mVol_m2r", "use the perpendicular height"), tx(t, "mVol_m2", "Cavalieri: leaning does not change volume, but the slant is longer than h")],
          [tx(t, "mVol_m3w", "forgetting the ⅓ for cones and pyramids"), "⅓Bh", tx(t, "mVol_m3", "three of them fill the prism")],
          [tx(t, "mVol_m4w", "sphere surface 4πr³ or volume 4πr²"), tx(t, "mVol_m4r", "S = 4πr², V = 4/3 πr³"), tx(t, "mVol_m4", "an area has r², a volume r³")],
          [tx(t, "mVol_m5w", "double the size, double the mass"), tx(t, "mVol_m5r", "double the size, 8× the mass"), tx(t, "mVol_m5", "volume scales by k³")],
          ["4 / 3 * PI * r*r*r", "4.0f / 3.0f * PI * r*r*r", tx(t, "mVol_m6", "integer division makes 4 / 3 equal 1")],
        ]}
      />

      <KeyIdeas t={t} id="mVol" items={[
        "Volume counts unit cubes; units are cubed (1 m³ = 10⁶ cm³, 1 L = 1000 cm³).",
        "Prisms and cylinders: base area × perpendicular height.",
        "Cavalieri: equal slices at every height mean equal volumes, so leaning does not matter.",
        "Pyramids and cones are ⅓ of the matching prism or cylinder.",
        "Sphere: V = 4/3 πr³ by slicing, S = 4πr² from thin pyramids.",
        "Surface area is the area of the net; box 2(ab + bc + ca).",
        "Scaling by k: surface ×k², volume ×k³.",
      ]} />
    </Article>
  );
}
