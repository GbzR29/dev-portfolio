"use client";

// "Collision Detection": bounding shapes, circle/AABB overlap tests, the
// minimum translation vector, simple response, tunnelling and swept tests,
// and the Separating Axis Theorem for convex polygons.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { OverlapFigure } from "@/components/lesson/figures/gamedev/OverlapFigure";
import { TunnelFigure } from "@/components/lesson/figures/gamedev/TunnelFigure";
import { SatFigure } from "@/components/lesson/figures/gamedev/SatFigure";

const r = String.raw;

// ═════════════════════════════════════════════════════════════════════════════
// Collision shapes & overlap tests
// ═════════════════════════════════════════════════════════════════════════════

export function CollisionContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "gdCol_intro",
          "A physics engine spends most of its time answering one question: are these two things touching? And if so, by how much, and in which direction? The first part is collision detection, the second is the contact information that collision response needs to push them apart. This chapter covers the shapes games use for that, the three tests every 2D game starts with, and the bug that lets fast bullets fly through walls.")}
      </Lead>

      <H2>{tx(t, "gdCol_shapesTitle", "Why simple shapes")}</H2>
      <p>
        {tx(t, "gdCol_shapesBody",
          "A character sprite may have thousands of pixels and a 3D model thousands of triangles, but testing those against each other is far too slow to do for every pair of objects, every step. So each object gets a simple invisible stand-in, a collider or bounding volume, and the physics only ever sees that. The trade-off is fit versus speed: a tight shape gives believable contacts, a simple shape gives fast tests.")}
      </p>
      <LessonTable
        headers={[tx(t, "gdCol_tShape", "Shape"), tx(t, "gdCol_tStore", "Stored as"), tx(t, "gdCol_tGood", "Good for"), tx(t, "gdCol_tCost", "Test cost")]}
        rows={[
          [tx(t, "gdCol_s1", "Circle / sphere"), tx(t, "gdCol_s1s", "centre + radius"), tx(t, "gdCol_s1g", "balls, projectiles, rough character bounds; rotation does not change it"), tx(t, "gdCol_s1c", "one distance")],
          [tx(t, "gdCol_s2", "AABB (axis-aligned box)"), tx(t, "gdCol_s2s", "min + max corners, or centre + half extents"), tx(t, "gdCol_s2g", "tiles, platforms, crates, broad-phase bounds"), tx(t, "gdCol_s2c", "4 comparisons in 2D")],
          [tx(t, "gdCol_s3", "Capsule"), tx(t, "gdCol_s3s", "segment + radius"), tx(t, "gdCol_s3g", "characters: rounded bottom slides over steps and slopes"), tx(t, "gdCol_s3c", "closest points of two segments")],
          [tx(t, "gdCol_s4", "OBB (oriented box)"), tx(t, "gdCol_s4s", "centre + half extents + rotation"), tx(t, "gdCol_s4g", "rotating crates, cars"), tx(t, "gdCol_s4c", "SAT with 4 axes (15 in 3D)")],
          [tx(t, "gdCol_s5", "Convex polygon / hull"), tx(t, "gdCol_s5s", "vertex list"), tx(t, "gdCol_s5g", "rocks, ships, anything irregular but convex"), tx(t, "gdCol_s5c", "SAT or GJK, grows with vertex count")],
          [tx(t, "gdCol_s6", "Triangle mesh"), tx(t, "gdCol_s6s", "triangles + an acceleration tree"), tx(t, "gdCol_s6g", "static level geometry only"), tx(t, "gdCol_s6c", "many triangle tests")],
        ]}
      />

      <H2>{tx(t, "gdCol_ccTitle", "Circle against circle")}</H2>
      <p>
        {tx(t, "gdCol_ccBody",
          "Two circles touch when the distance between their centres is less than the sum of their radii. If you walk from one centre toward the other, you are inside the first circle for r₁ units and inside the second for the last r₂ units; they overlap when those two stretches overlap. The figure below has all three tests of this chapter; start with circle–circle.")}
      </p>
      <Equation label={tx(t, "gdCol_eqCC", "Circle–circle")}
        where={[
          [r`\mathbf c_1, \mathbf c_2`, tx(t, "gdCol_wC", "the centres")],
          [r`r_1, r_2`, tx(t, "gdCol_wR", "the radii")],
          [r`d = \lVert \mathbf c_2 - \mathbf c_1 \rVert`, tx(t, "gdCol_wD", "the distance between centres; ‖·‖ is a vector's length, √(x² + y²)")],
          [r`\hat{\mathbf n}`, tx(t, "gdCol_wN", "the collision normal: the unit vector from c₁ toward c₂. Pushing circle 2 along it is the shortest way to separate them")],
          [r`p = r_1 + r_2 - d`, tx(t, "gdCol_wP", "the penetration depth: how far they overlap along the normal")],
        ]}
        note={tx(t, "gdCol_eqCCNote", "Comparing squared values, d² < (r₁ + r₂)², gives the same answer without the square root; only compute d when there is a hit and you need the normal. If d = 0 (same centre) the normal is undefined: pick any direction, for example (1, 0).")}>
        {r`\text{hit} \iff \lVert \mathbf c_2 - \mathbf c_1 \rVert^2 < (r_1 + r_2)^2 \qquad \hat{\mathbf n} = \frac{\mathbf c_2 - \mathbf c_1}{d}`}
      </Equation>

      <OverlapFigure t={t} />

      <H2>{tx(t, "gdCol_bbTitle", "AABB against AABB")}</H2>
      <p>
        {tx(t, "gdCol_bbBody",
          "An axis-aligned bounding box has its edges parallel to the x and y axes, so it is fully described by its smallest and largest x and y. Picture its shadow on the x axis: an interval [min.x, max.x]. Two boxes overlap exactly when their shadows overlap on the x axis and also on the y axis. If there is a gap on either axis, a straight line fits through the gap and the boxes are apart. Two intervals [a₀, a₁] and [b₀, b₁] overlap when each starts before the other ends.")}
      </p>
      <Equation label={tx(t, "gdCol_eqBB", "AABB–AABB")}
        where={[
          [r`A_{\min}, A_{\max}`, tx(t, "gdCol_wAminmax", "the lower-left and upper-right corners of box A (y up); same for B")],
          [r`o_x,\ o_y`, tx(t, "gdCol_wO", "the overlap of the two shadows on each axis: the smaller of the two right ends minus the larger of the two left ends. Positive means overlapping")],
        ]}
        note={tx(t, "gdCol_eqBBNote", "The shortest way out is along the axis with the smaller overlap. If o_x < o_y, move B horizontally by o_x, to the right if B's centre is right of A's, otherwise to the left. That vector is the minimum translation vector (MTV).")}>
        {r`o_x = \min(A_{\max,x}, B_{\max,x}) - \max(A_{\min,x}, B_{\min,x}) \qquad \text{hit} \iff o_x > 0 \ \land\ o_y > 0`}
      </Equation>
      <CodeBlock lang="cpp" filename="aabb.hpp" t={t}>{`struct AABB { Vec2 min, max; };

bool overlaps(const AABB& a, const AABB& b) {
    return a.min.x < b.max.x && b.min.x < a.max.x     // shadows overlap on x
        && a.min.y < b.max.y && b.min.y < a.max.y;    // and on y
}

// Minimum translation vector that pushes b out of a (zero if apart)
Vec2 mtv(const AABB& a, const AABB& b) {
    float ox = std::min(a.max.x, b.max.x) - std::max(a.min.x, b.min.x);
    float oy = std::min(a.max.y, b.max.y) - std::max(a.min.y, b.min.y);
    if (ox <= 0 || oy <= 0) return {0, 0};
    Vec2 d = (b.min + b.max) * 0.5f - (a.min + a.max) * 0.5f;    // centre to centre
    if (ox < oy) return { d.x < 0 ? -ox : ox, 0 };
    return { 0, d.y < 0 ? -oy : oy };
}`}</CodeBlock>

      <H2>{tx(t, "gdCol_cbTitle", "Circle against AABB")}</H2>
      <p>
        {tx(t, "gdCol_cbBody",
          "The trick for mixed shapes is to find the point of the box closest to the circle's centre, then do a point-in-circle test with it. For an axis-aligned box that closest point is just the centre clamped into the box: clamp each coordinate to the box's range. If the centre is left of the box, its x becomes the box's left edge; if it is between the edges, x stays as it is. Doing that for x and y lands on the nearest point of the box.")}
      </p>
      <Equation label={tx(t, "gdCol_eqCB", "Circle–AABB")}
        where={[
          [r`\mathbf c,\ r`, tx(t, "gdCol_wCr", "the circle's centre and radius")],
          [r`\operatorname{clamp}(v, lo, hi)`, tx(t, "gdCol_wClamp", "min(max(v, lo), hi): v forced into [lo, hi]")],
          [r`\mathbf q`, tx(t, "gdCol_wQ", "the closest point of the box to the circle's centre")],
          [r`\hat{\mathbf n}`, tx(t, "gdCol_wN2", "the push direction for the circle, (c − q)/‖c − q‖; the depth is r − ‖c − q‖")],
        ]}
        note={tx(t, "gdCol_eqCBNote", "When the centre is inside the box, q = c and the direction is 0/0. Handle that case separately: push the circle out through the nearest face, as AABB–AABB does, with depth equal to the distance to that face plus r.")}>
        {r`\mathbf q = \big(\operatorname{clamp}(c_x, B_{\min,x}, B_{\max,x}),\ \operatorname{clamp}(c_y, B_{\min,y}, B_{\max,y})\big) \qquad \text{hit} \iff \lVert \mathbf c - \mathbf q \rVert^2 < r^2`}
      </Equation>

      <H2>{tx(t, "gdCol_respTitle", "From detection to response")}</H2>
      <p>
        {tx(t, "gdCol_respBody",
          "Detection gives a normal n̂ and a depth p. Response has two parts. First, positional correction: move the objects apart by p along n̂ (all of it to the moving object if the other one is a wall, split by inverse mass if both move). Second, fix the velocity so they stop moving into each other. Split the velocity into the part along the normal, (v · n̂)n̂, and the part along the surface. If the normal part points into the surface (v · n̂ < 0), remove it to slide along the wall, or reverse it scaled by a restitution coefficient to bounce.")}
      </p>
      <Equation label={tx(t, "gdCol_eqResp", "Slide and bounce")}
        where={[
          [r`\mathbf v`, tx(t, "gdCol_wV", "the velocity of the object being corrected")],
          [r`\hat{\mathbf n}`, tx(t, "gdCol_wN3", "the unit collision normal, pointing out of the obstacle toward the object")],
          [r`\mathbf v\cdot\hat{\mathbf n}`, tx(t, "gdCol_wVn", "the signed speed along the normal; negative means approaching the surface. The Math track's dot product chapter explains this projection")],
          [r`e`, tx(t, "gdCol_wE", "the coefficient of restitution: 0 = no bounce (the normal speed is removed, the object slides), 1 = perfectly elastic (the normal speed is reversed in full). A rubber ball is around 0.8")],
        ]}
        note={tx(t, "gdCol_eqRespNote", "Only apply it when v · n̂ < 0. If the object is already moving away, changing its velocity would glue it to the surface.")}>
        {r`\mathbf v' = \mathbf v - (1 + e)\,(\mathbf v\cdot\hat{\mathbf n})\,\hat{\mathbf n}`}
      </Equation>
      <CodeBlock lang="cpp" filename="resolve.cpp" t={t}>{`void resolveAgainstStatic(Body& b, Vec2 n, float depth, float restitution) {
    b.pos += n * depth;                              // 1. push out of the wall
    float vn = dot(b.vel, n);
    if (vn < 0)                                      // 2. only if moving into it
        b.vel -= (1 + restitution) * vn * n;         // e = 0 slides, e = 1 bounces
}`}</CodeBlock>

      <H2>{tx(t, "gdCol_tunnelTitle", "Fast objects: tunnelling")}</H2>
      <p>
        {tx(t, "gdCol_tunnelBody",
          "Every test above looks at where objects are at the end of a step. A bullet at 1800 pixels per second moves 30 pixels per step at 60 Hz. If a wall is 12 pixels thick, the bullet can be in front of the wall at one step and behind it at the next, without ever overlapping it. This is tunnelling, and it is why players fall through thin floors when the game hitches.")}
      </p>

      <TunnelFigure t={t} />

      <p>
        {tx(t, "gdCol_sweptBody",
          "The robust fix is a swept (continuous) test: instead of the bullet's end position, test the segment it travelled during the step, from p to p + v·dt. For a point against a box, that is a ray against a box, solved with the slab method: the box is the intersection of an x-slab (between its left and right edges) and a y-slab. Compute when the ray enters and leaves each slab; it is inside the box when it is inside both slabs at once.")}
      </p>
      <Equation label={tx(t, "gdCol_eqSlab", "Ray–AABB: the slab method")}
        where={[
          [r`\mathbf p + s\,\mathbf d`, tx(t, "gdCol_wRay", "the path during the step: s = 0 at the start, s = 1 at the end when d = v·dt")],
          [r`s_{x,1},\ s_{x,2}`, tx(t, "gdCol_wSx", "the values of s where the path crosses the lines x = B_min,x and x = B_max,x. Dividing by d_x may give them in either order, so sort them into near and far")],
          [r`s_{\text{enter}}`, tx(t, "gdCol_wEnter", "the path is inside the box only after it has entered both slabs: the later of the two near crossings")],
          [r`s_{\text{exit}}`, tx(t, "gdCol_wExit", "and only until it leaves either one: the earlier of the two far crossings")],
        ]}
        note={tx(t, "gdCol_eqSlabNote", "The path hits the box during this step when s_enter ≤ s_exit, s_enter ≤ 1 and s_exit ≥ 0. s_enter is then the fraction of the step at which contact happens: move the bullet there instead of to the end. With d_x = 0, 1/d_x is ±infinity in IEEE floating point, which makes the formulas still work, as long as p is not exactly on a slab edge.")}>
        {r`s_{x,1,2} = \frac{B_{\min/\max,x} - p_x}{d_x} \qquad s_{\text{enter}} = \max(s_{x,\text{near}}, s_{y,\text{near}}) \qquad s_{\text{exit}} = \min(s_{x,\text{far}}, s_{y,\text{far}})`}
      </Equation>
      <CodeBlock lang="cpp" filename="swept.cpp" t={t}>{`// Returns the fraction of the step [0, 1] at which the moving point hits the box, or -1.
float sweepPointAABB(Vec2 p, Vec2 d, const AABB& b) {
    float inv[2] = { 1.f / d.x, 1.f / d.y };           // ±inf when a component is 0
    float lo = -INFINITY, hi = INFINITY;
    for (int i = 0; i < 2; ++i) {
        float s1 = (b.min[i] - p[i]) * inv[i];
        float s2 = (b.max[i] - p[i]) * inv[i];
        lo = std::max(lo, std::min(s1, s2));           // latest entry
        hi = std::min(hi, std::max(s1, s2));           // earliest exit
    }
    if (lo > hi || lo > 1.f || hi < 0.f) return -1.f;
    return std::max(lo, 0.f);
}

// A moving box against a static box: grow the static box by the mover's half
// size (a "Minkowski sum") and sweep the mover's centre as a point.`}</CodeBlock>
      <p>
        {tx(t, "gdCol_tunnelOther",
          "Other defences, from cheapest to most complete: clamp the maximum speed so that v·h is smaller than the thinnest collider; make walls thicker than they look; run several physics sub-steps per frame for fast objects only; or enable continuous collision detection (CCD) in the physics engine for bullets and fast bodies, which does swept tests for them.")}
      </p>

      <H2>{tx(t, "gdCol_broadTitle", "When there are many objects")}</H2>
      <p>
        {tx(t, "gdCol_broadBody",
          "Testing every pair of n objects takes n(n − 1)/2 tests: 45 pairs for 10 objects, but 499 500 for 1000. Real engines split the work in two. A broad phase uses cheap bounds and a spatial structure (a uniform grid or spatial hash, a quadtree, sweep-and-prune, a bounding volume hierarchy) to find the few pairs that might touch. The narrow phase runs the exact tests of this chapter only on those. Broad phases get their own chapter later in the track.")}
      </p>

      <KeyIdeas t={t} id="gdCol" items={[
        "Colliders are simple stand-ins: circles, AABBs, capsules, convex polygons.",
        "Circles: compare squared distance with (r₁ + r₂)²; normal along the centres.",
        "AABBs: overlap on x AND on y; push out along the axis with the smaller overlap.",
        "Circle vs box: clamp the centre into the box to get the closest point.",
        "Response: push out by the MTV, then v −= (1 + e)(v·n̂)n̂ if moving inward.",
        "Fast objects tunnel; sweep the path (slab method) or use CCD / sub-steps.",
      ]} />
    </Article>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// The Separating Axis Theorem
// ═════════════════════════════════════════════════════════════════════════════

export function SatContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "gdSat_intro",
          "Circles and axis-aligned boxes cover a lot, but a rotating crate, a car or a spaceship needs a shape that can turn and has corners. The Separating Axis Theorem (SAT) is the standard test for any two convex polygons, and it generalises the AABB test you already know: there, you checked for a gap on the x axis and on the y axis. SAT checks for a gap on a few more, carefully chosen, axes.")}
      </Lead>

      <H2>{tx(t, "gdSat_convexTitle", "Convex shapes")}</H2>
      <p>
        {tx(t, "gdSat_convexBody",
          "A shape is convex when the straight segment between any two of its points stays inside it: no dents, holes or inward corners. Triangles, rectangles, regular polygons, circles and capsules are convex; an L-shape or a star is not. SAT only works for convex shapes. Concave shapes are split into convex pieces (convex decomposition) and each piece is tested separately.")}
      </p>

      <H2>{tx(t, "gdSat_theoremTitle", "The theorem")}</H2>
      <p>
        {tx(t, "gdSat_theoremBody",
          "Two convex shapes do not overlap if and only if you can draw a straight line between them (in 3D, a plane). That line is a separating line. Now look at the direction perpendicular to it, the separating axis: if you project (\"shine a light\" and take the shadow of) both shapes onto that axis, their shadows do not overlap. The difficulty is that there are infinitely many directions to try. The key insight for polygons is that you only need to try a handful: if a separating line exists, you can always slide and turn it until it lies flat against an edge of one of the two polygons. So the only candidate axes are the normals of the polygons' edges.")}
      </p>
      <Equation label={tx(t, "gdSat_eqProj", "Projecting a polygon onto an axis")}
        where={[
          [r`\hat{\mathbf n}`, tx(t, "gdSat_wN", "the candidate axis: the unit normal of one edge. For an edge from a to b, rotate (b − a) by 90°: (e_y, −e_x), then normalise")],
          [r`\mathbf v_i`, tx(t, "gdSat_wV", "the polygon's vertices")],
          [r`\mathbf v_i \cdot \hat{\mathbf n}`, tx(t, "gdSat_wDot", "the position of vertex i along the axis: the length of its shadow from the origin. See the Math track's dot product chapter")],
          [r`[\,s_{\min}, s_{\max}\,]`, tx(t, "gdSat_wInterval", "the polygon's shadow on the axis. For a convex polygon the smallest and largest vertex projections are its extremes: the edges in between cannot stick out further")],
        ]}
        note={tx(t, "gdSat_eqProjNote", "Strictly, the axis does not even need to be normalised just to detect overlap, because scaling the axis scales both shadows equally. It does need to be unit length if you want the overlap to be a real distance for the MTV.")}>
        {r`s_{\min} = \min_i\ \mathbf v_i\cdot\hat{\mathbf n}, \qquad s_{\max} = \max_i\ \mathbf v_i\cdot\hat{\mathbf n}`}
      </Equation>

      <SatFigure t={t} />

      <H2>{tx(t, "gdSat_algoTitle", "The algorithm")}</H2>
      <p>
        {tx(t, "gdSat_algoBody",
          "For every edge normal of polygon A, then every edge normal of polygon B: project both polygons, and compute the overlap of the two intervals. If any overlap is zero or negative, stop: that axis separates them, they do not collide. If every axis overlaps, they collide, and the axis with the smallest overlap is the collision normal, with that overlap as the penetration depth. That minimum is the MTV, the same idea as the smaller-overlap axis of the AABB test. The AABB test is in fact SAT with only two axes, because all four edges of both boxes are parallel to x or y.")}
      </p>
      <CodeBlock lang="cpp" filename="sat.cpp" t={t}>{`struct Interval { float lo, hi; };

Interval project(const std::vector<Vec2>& poly, Vec2 axis) {
    Interval r{ dot(poly[0], axis), dot(poly[0], axis) };
    for (const Vec2& v : poly) { float s = dot(v, axis); r.lo = std::min(r.lo, s); r.hi = std::max(r.hi, s); }
    return r;
}

// Returns true and fills normal/depth (pointing from a to b) if the convex polygons overlap.
bool satCollide(const std::vector<Vec2>& a, const std::vector<Vec2>& b, Vec2& normal, float& depth) {
    depth = INFINITY;
    for (const auto* poly : { &a, &b }) {
        for (size_t i = 0; i < poly->size(); ++i) {
            Vec2 e    = (*poly)[(i + 1) % poly->size()] - (*poly)[i];
            Vec2 axis = normalize(Vec2{ e.y, -e.x });            // edge normal
            Interval pa = project(a, axis), pb = project(b, axis);
            float overlap = std::min(pa.hi, pb.hi) - std::max(pa.lo, pb.lo);
            if (overlap <= 0) return false;                      // separating axis: early out
            if (overlap < depth) { depth = overlap; normal = axis; }
        }
    }
    // Make the normal point from a toward b
    if (dot(centroid(b) - centroid(a), normal) < 0) normal = -normal;
    return true;
}`}</CodeBlock>
      <H3>{tx(t, "gdSat_containTitle", "A subtle case: containment")}</H3>
      <p>
        {tx(t, "gdSat_containBody",
          "If a small polygon is completely inside a big one, the overlap on an axis is the small interval's length, but pushing the small polygon out requires moving it past the big polygon's edge, which is further. For correct depths in that case, compute the overlap as the smaller of (A.hi − B.lo) and (B.hi − A.lo) on each axis, and keep the direction that goes with it. Games with fast objects that can end up deep inside others need this; many simple engines ignore it.")}
      </p>

      <H2>{tx(t, "gdSat_otherTitle", "Circles, boxes and 3D")}</H2>
      <LessonTable
        headers={[tx(t, "gdSat_tPair", "Pair"), tx(t, "gdSat_tAxes", "Axes to test")]}
        rows={[
          [tx(t, "gdSat_p1", "polygon vs polygon (2D)"), tx(t, "gdSat_p1a", "all edge normals of both, parallel duplicates removed (a box has only 2 distinct normals, a regular hexagon 3)")],
          [tx(t, "gdSat_p2", "OBB vs OBB (2D)"), tx(t, "gdSat_p2a", "4: each box's two local axes")],
          [tx(t, "gdSat_p3", "polygon vs circle"), tx(t, "gdSat_p3a", "the polygon's edge normals, plus the axis from the circle's centre to the polygon's nearest vertex. A circle's projection on any unit axis is [c·n̂ − r, c·n̂ + r]")],
          [tx(t, "gdSat_p4", "convex polyhedra (3D)"), tx(t, "gdSat_p4a", "face normals of both, plus the cross product of every edge direction of A with every edge direction of B (two edges can be the closest features)")],
          [tx(t, "gdSat_p5", "OBB vs OBB (3D)"), tx(t, "gdSat_p5a", "15: 3 face axes of each box + 3 × 3 edge cross products")],
        ]}
      />

      <H2>{tx(t, "gdSat_perfTitle", "Cost and alternatives")}</H2>
      <p>
        {tx(t, "gdSat_perfBody",
          "For polygons with n and m vertices, SAT tests up to n + m axes and projects n + m vertices onto each, so the work grows with (n + m)². That is cheap for boxes and small hulls. Three standard tricks: precompute the edge normals in the shape's local space and rotate them with the shape instead of recomputing them; remember the last separating axis for each pair, since objects move little between steps, that axis will usually separate them again and the test ends after one projection (temporal coherence); and run SAT only on pairs the broad phase reported. For complex hulls, especially in 3D, engines use GJK (Gilbert–Johnson–Keerthi), which only needs a \"support function\" (the farthest point of a shape in a given direction) and finds the distance between convex shapes in a few iterations, with EPA to get the penetration depth.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "gdSat_contactsBody", "SAT tells you the normal and the depth, but not where the shapes touch. A box resting on the ground touches along an edge, and a physics engine needs contact points there to make it stop wobbling and to apply friction at the right place. Those come from clipping the two most parallel edges (the \"reference\" and \"incident\" faces) against each other, a topic for the physics chapters.")}
      </Callout>

      <KeyIdeas t={t} id="gdSat" items={[
        "Two convex shapes are apart iff some axis shows a gap between their shadows.",
        "For polygons the only candidate axes are the edge normals of both shapes.",
        "Shadow on an axis = [min, max] of vertex · axis.",
        "One gap = no collision (early out). No gaps = collision; the smallest overlap is the MTV.",
        "Concave shapes: split into convex parts. Many vertices or 3D: consider GJK + EPA.",
      ]} />
    </Article>
  );
}
