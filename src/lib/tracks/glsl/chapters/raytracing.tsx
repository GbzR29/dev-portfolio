"use client";

// "Ray & Path Tracing": exact ray–object intersections, Whitted recursion,
// Monte Carlo path tracing with progressive accumulation, and the data
// structures and filters that make ray tracing fast enough to use.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { RayTreeFigure } from "@/components/lesson/figures/rt/RayTreeFigure";
import { WhittedFigure } from "@/components/lesson/figures/rt/WhittedFigure";
import { MonteCarloFigure } from "@/components/lesson/figures/rt/MonteCarloFigure";
import { PathTracerFigure } from "@/components/lesson/figures/rt/PathTracerFigure";
import { BvhFigure } from "@/components/lesson/figures/rt/BvhFigure";

const r = String.raw;

// ═════════════════════════════════════════════════════════════════════════════
// Ray Tracing
// ═════════════════════════════════════════════════════════════════════════════

export function RayTracingContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "glslRt_intro",
          "Raymarching walks along a ray in steps until a distance function says it has arrived. Ray tracing solves for the hit directly: for spheres, planes and triangles, where a ray meets a surface is the root of an equation. Turner Whitted's 1980 paper added the idea that made ray tracing famous: when a ray hits a mirror or glass, trace new rays from the hit point, recursively. Shadows, reflections and refraction all follow from one rule, with no special cases.")}
      </Lead>

      <H2>{tx(t, "glslRt_rayTitle", "A ray, and the first thing it hits")}</H2>
      <p>
        {tx(t, "glslRt_rayBody",
          "A ray is a starting point o and a unit direction d. Every point on it is o + t·d for some t ≥ 0, where t is the distance travelled. Intersecting the ray with a surface means finding the values of t where o + t·d lies on the surface. The one we want is the smallest positive t, the first surface in front of the ray. A scene is intersected by testing every object and keeping the nearest hit.")}
      </p>
      <Equation label={tx(t, "glslRt_sphLabel", "Ray–sphere intersection")}
        where={[
          [r`\lVert \mathbf o + t\mathbf d - \mathbf c\rVert^2 = R^2`, tx(t, "glslRt_wSphEq", "the ray point is on the sphere (centre c, radius R) when its distance to the centre is R. Expanding the square with |d| = 1 gives a quadratic in t")],
          [r`b = (\mathbf o - \mathbf c)\cdot\mathbf d`, tx(t, "glslRt_wB", "half the linear coefficient: how far along the ray the closest approach to the centre lies (with a minus sign)")],
          [r`c = \lVert \mathbf o - \mathbf c\rVert^2 - R^2`, tx(t, "glslRt_wC", "positive when the ray starts outside the sphere, negative when it starts inside")],
          [r`h = b^2 - c`, tx(t, "glslRt_wH", "a quarter of the discriminant. h < 0: the ray misses. h = 0: it grazes. h > 0: two hits, entering at −b − √h and leaving at −b + √h")],
        ]}
        note={tx(t, "glslRt_sphNote", "Take the near root. If it is behind the ray origin (t ≤ ε), the origin is inside the sphere and the far root is the exit point, which is exactly what a refracted ray inside a glass ball needs. The normal at the hit is (p − c)/R.")}
        glsl={`float sphere(vec3 o, vec3 d, vec4 s) {\n    vec3 oc = o - s.xyz;\n    float b = dot(oc, d), c = dot(oc, oc) - s.w * s.w;\n    float h = b * b - c;\n    if (h < 0.0) return -1.0;         // miss\n    h = sqrt(h);\n    float t = -b - h;\n    return t > 1e-3 ? t : -b + h;     // from inside: the far root\n}`}>
        {r`t^2 + 2b\,t + c = 0 \quad\Longrightarrow\quad t = -b \pm \sqrt{b^2 - c}`}
      </Equation>
      <Equation label={tx(t, "glslRt_planeLabel", "Ray–plane and ray–triangle")}
        where={[
          [r`\mathbf n\cdot\mathbf p = k`, tx(t, "glslRt_wPlane", "a plane: all points whose projection on the unit normal n equals k. Substituting the ray gives one linear equation. If n·d = 0 the ray is parallel and never hits")],
          [r`(u, v)`, tx(t, "glslRt_wUV", "barycentric coordinates of the hit inside the triangle (a, b, c): the point is a + u(b − a) + v(c − a). It is inside when u ≥ 0, v ≥ 0 and u + v ≤ 1")],
        ]}
        note={tx(t, "glslRt_triNote", "Meshes are triangles, so ray–triangle is the test real ray tracers run billions of times. Möller–Trumbore solves the 3×3 system o + t·d = a + u(b − a) + v(c − a) with Cramer's rule, using cross products. The barycentric (u, v) it returns also interpolates normals and UVs across the triangle for free.")}>
        {r`t_{\text{plane}} = \frac{k - \mathbf n\cdot\mathbf o}{\mathbf n\cdot\mathbf d} \qquad\qquad \mathbf o + t\,\mathbf d = \mathbf a + u\,(\mathbf b - \mathbf a) + v\,(\mathbf c - \mathbf a)`}
      </Equation>

      <H2>{tx(t, "glslRt_whitTitle", "Whitted's recursion")}</H2>
      <p>
        {tx(t, "glslRt_whitBody",
          "Once a ray hits something, Whitted's algorithm asks three questions. First: is this point lit? It traces a shadow ray toward each light and checks whether anything is in the way. Second: is the surface a mirror? It traces the reflected direction and adds what that ray sees, times the reflectivity. Third: is it transparent? It traces the refracted direction from Snell's law and adds what it sees, times the transmittance. The second and third questions call the tracer again, so one pixel becomes a tree of rays. The figure traces that tree for one pixel in 2D.")}
      </p>

      <RayTreeFigure t={t} />

      <Equation label={tx(t, "glslRt_whitLabel", "The colour of a ray (Whitted, 1980)")}
        where={[
          [r`L_{\text{local}}`, tx(t, "glslRt_wLocal", "direct lighting at the hit: ambient + diffuse (N·L) + a Phong highlight, each light counted only if its shadow ray reaches it")],
          [r`V(\mathbf p, \mathbf l)`, tx(t, "glslRt_wVis", "visibility, 0 or 1: does the segment from p to the light hit anything first? It is found by intersecting the shadow ray with the scene and comparing the hit distance with the light's distance")],
          [r`\mathbf r = \operatorname{reflect}(\mathbf d, \mathbf n)`, tx(t, "glslRt_wR", "the mirror direction d − 2(d·n)n")],
          [r`\mathbf t = \operatorname{refract}(\mathbf d, \mathbf n, \eta)`, tx(t, "glslRt_wT", "the refracted direction from Snell's law (see the Glass chapter). None exists past the critical angle, and then everything reflects")],
          [r`F`, tx(t, "glslRt_wF", "Fresnel reflectance (Schlick): how the energy splits between the two new rays. The two weights add up to 1 for glass")],
        ]}>
        {r`C(\mathbf o, \mathbf d) = L_{\text{local}}\,V(\mathbf p, \mathbf l) \;+\; k_r\,F\;C(\mathbf p, \mathbf r) \;+\; k_t\,(1 - F)\;C(\mathbf p, \mathbf t)`}
      </Equation>

      <H3>{tx(t, "glslRt_stackTitle", "Recursion without recursion")}</H3>
      <p>
        {tx(t, "glslRt_stackBody",
          "GLSL forbids recursion: a GPU thread has no call stack to grow. The ray tree is walked with an explicit stack instead, an array of pending rays in which each entry carries its own weight, the product of all the Fresnel and reflectivity factors on its way from the camera. A pixel pushes the camera ray, then repeats: pop a ray, intersect it, add its local shading times its weight, and push its children with their weights multiplied in. The loop ends when the stack is empty or an iteration limit is reached. The order in which rays are processed does not matter, because every contribution is simply added.")}
      </p>
      <CodeBlock lang="glsl" filename="whitted_stack.frag" t={t}>{`struct Ray { vec3 o; vec3 d; vec3 w; int depth; };   // w: this branch's weight
Ray stack[24];
int sp = 0;
stack[sp++] = Ray(camPos, rayDir, vec3(1.0), 0);
vec3 col = vec3(0.0);
for (int i = 0; i < 64 && sp > 0; i++) {
    Ray r = stack[--sp];
    Hit h = intersect(r.o, r.d);
    if (h.miss) { col += r.w * sky(r.d); continue; }
    vec3 p = r.o + r.d * h.t;
    col += r.w * localShading(p, h);                    // includes the shadow ray
    if (r.depth == MAX_DEPTH) continue;
    if (h.mirror) stack[sp++] = Ray(p + h.n * EPS, reflect(r.d, h.n), r.w * 0.9, r.depth + 1);
    if (h.glass) {
        float F = fresnel(...);
        stack[sp++] = Ray(p + n * EPS, reflect(r.d, n), r.w * F,         r.depth + 1);
        stack[sp++] = Ray(p - n * EPS, refract(r.d, n, eta), r.w * (1.0 - F), r.depth + 1);
    }
}`}</CodeBlock>

      <WhittedFigure t={t} />

      <H3>{tx(t, "glslRt_pitTitle", "The classic mistakes")}</H3>
      <LessonTable
        headers={[tx(t, "glslRt_tBug", "Symptom"), tx(t, "glslRt_tCause", "Cause"), tx(t, "glslRt_tFix", "Fix")]}
        rows={[
          [tx(t, "glslRt_b1", "Speckled black dots on lit surfaces (shadow acne)"), tx(t, "glslRt_c1", "the shadow ray starts exactly on the surface, and rounding makes it hit that same surface"), tx(t, "glslRt_f1", "start secondary rays at p + n·ε (reflection, shadow) or p − n·ε (refraction), and ignore hits with t < ε")],
          [tx(t, "glslRt_b2", "Glass looks black or solid"), tx(t, "glslRt_c2", "the inside of the ball uses the outward normal and the wrong η"), tx(t, "glslRt_f2", "if d·n > 0 the ray is inside: flip n and use η = n_glass / n_air")],
          [tx(t, "glslRt_b3", "Black spots inside glass"), tx(t, "glslRt_c3", "refract() returned vec3(0) (total internal reflection) and the zero vector was traced"), tx(t, "glslRt_f3", "when refract returns zero, set F = 1 and reflect only")],
          [tx(t, "glslRt_b4", "Frame time explodes with depth"), tx(t, "glslRt_c4", "every glass hit doubles the rays: the tree has up to 2^depth leaves"), tx(t, "glslRt_f4", "cap the depth, drop branches whose weight is below ~1%, and bound the stack size")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "glslRt_limits", "Whitted ray tracing gets perfect mirrors, sharp refraction and hard shadows right, and nothing else. A point light has no area, so shadows have no penumbra. A surface only sees light that arrives directly or along one exact mirror direction, so there is no light bouncing from a red wall onto a white floor, no blurry reflections and no soft sky lighting. Getting those requires tracing all the directions light can come from, not just a few. That is the next chapter.")}
      </Callout>

      <KeyIdeas t={t} id="glslRt" items={[
        "A ray is o + t·d; intersection = solving for t; keep the nearest positive root.",
        "Ray–sphere: t = −b ± √(b² − c), with b = (o − c)·d, c = |o − c|² − R².",
        "Whitted: local light with shadow rays + reflected ray + refracted ray, weighted by Fresnel.",
        "GLSL has no recursion: walk the ray tree with an explicit stack of weighted rays.",
        "Offset secondary rays by ε along the normal; handle inside/outside and total internal reflection.",
      ]} />
    </Article>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Path Tracing
// ═════════════════════════════════════════════════════════════════════════════

export function PathTracingContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "glslPt_intro",
          "A path tracer answers the question Whitted skipped: how much light reaches this point from every direction, not just from the lights and the mirror direction? The answer is an integral over the hemisphere, the rendering equation. It is estimated the only way such integrals can be: by averaging random samples. Each sample is one random path of light, bouncing from the camera through the scene. Average enough of them and the result is a physically correct image, with soft shadows, colour bleeding, glossy reflections and caustics, all falling out of the same loop.")}
      </Lead>

      <H2>{tx(t, "glslPt_reTitle", "The rendering equation")}</H2>
      <Equation label={tx(t, "glslPt_reLabel", "Kajiya's rendering equation (1986)")}
        where={[
          [r`L_o(\mathbf p, \boldsymbol\omega_o)`, tx(t, "glslPt_wLo", "radiance leaving point p toward the viewer ω_o: what the pixel measures")],
          [r`L_e`, tx(t, "glslPt_wLe", "light the surface emits by itself. Non-zero only for lights")],
          [r`\int_\Omega \ldots\, d\omega_i`, tx(t, "glslPt_wInt", "a sum over every incoming direction ω_i on the hemisphere Ω above the surface")],
          [r`f_r(\mathbf p, \boldsymbol\omega_i, \boldsymbol\omega_o)`, tx(t, "glslPt_wFr", "the BRDF: which fraction of light arriving from ω_i leaves toward ω_o. A matte (Lambert) surface scatters equally in all directions: f_r = albedo / π")],
          [r`L_i(\mathbf p, \boldsymbol\omega_i)`, tx(t, "glslPt_wLi", "radiance arriving from ω_i. This is the recursive part: it is the L_o of whatever the ray from p in direction ω_i hits")],
          [r`(\mathbf n\cdot\boldsymbol\omega_i)`, tx(t, "glslPt_wCos", "Lambert's cosine: light arriving at a grazing angle is spread over more area, so it counts less")],
        ]}
        note={tx(t, "glslPt_reNote", "The PBR chapters of the OpenGL track evaluate this same equation for a few point lights plus a pre-blurred environment. A path tracer evaluates it honestly, including the light that other surfaces bounce, which is called indirect or global illumination.")}>
        {r`L_o(\mathbf p, \boldsymbol\omega_o) = L_e(\mathbf p, \boldsymbol\omega_o) + \int_{\Omega} f_r(\mathbf p, \boldsymbol\omega_i, \boldsymbol\omega_o)\; L_i(\mathbf p, \boldsymbol\omega_i)\; (\mathbf n\cdot\boldsymbol\omega_i)\; d\omega_i`}
      </Equation>

      <H2>{tx(t, "glslPt_mcTitle", "Monte Carlo: integrals from random samples")}</H2>
      <p>
        {tx(t, "glslPt_mcBody",
          "An integral is an average value times the size of the domain. So pick random points, evaluate the function there and average. Each point counts divided by how likely it was to be picked, so points picked more often do not count more. This estimator is unbiased: its expected value is exactly the integral, for any number of samples. What changes with the sample count is only the noise.")}
      </p>
      <Equation label={tx(t, "glslPt_mcLabel", "The Monte Carlo estimator and its error")}
        where={[
          [r`x_k \sim p`, tx(t, "glslPt_wXk", "N random samples drawn with probability density p(x). p must be positive wherever f is non-zero")],
          [r`\frac{f(x_k)}{p(x_k)}`, tx(t, "glslPt_wRatio", "each sample's value divided by its probability density. With uniform samples on [0, 1], p = 1 and this is just the average of f")],
          [r`\sigma`, tx(t, "glslPt_wSigma", "the standard deviation of one sample f(x)/p(x). It is small when p has the same shape as f, which is the idea of importance sampling")],
        ]}
        note={tx(t, "glslPt_mcNote", "The error falls like 1/√N: halving the noise costs four times the samples. That is why a path-traced image clears quickly at first and then takes ages to lose its last grain. The only cheap way to do better is a smaller σ, by sampling where f is large.")}>
        {r`\int f(x)\,dx \;\approx\; \langle F_N \rangle = \frac{1}{N}\sum_{k=1}^{N} \frac{f(x_k)}{p(x_k)} \qquad \text{error} \sim \frac{\sigma}{\sqrt N}`}
      </Equation>

      <MonteCarloFigure t={t} />

      <H2>{tx(t, "glslPt_pathTitle", "One path per sample")}</H2>
      <p>
        {tx(t, "glslPt_pathBody",
          "Applying Monte Carlo to the rendering equation with one sample per bounce gives a simple loop. Shoot a camera ray. At each hit, add the light the surface emits, pick one random direction to continue in, and multiply a running weight, the throughput β, by that bounce's BRDF × cosine / pdf. The throughput is the fraction of light from further along the path that survives the bounces to reach the camera. A single path is a very noisy estimate of the pixel. Thousands of them, averaged, are exact.")}
      </p>
      <Equation label={tx(t, "glslPt_betaLabel", "Throughput, bounce by bounce")}
        where={[
          [r`\beta_0 = 1`, tx(t, "glslPt_wB0", "the camera ray carries everything")],
          [r`\boldsymbol\omega_{k}`, tx(t, "glslPt_wOk", "the new direction chosen at bounce k, drawn with density p(ω)")],
          [r`\text{uniform:}\ p = \frac{1}{2\pi}`, tx(t, "glslPt_wUni", "every hemisphere direction equally likely. For Lambert, β is multiplied by (albedo/π)·cosθ·2π = 2·albedo·cosθ, which is noisy because the factor cosθ varies from 0 to 1")],
          [r`\text{cosine:}\ p = \frac{\cos\theta}{\pi}`, tx(t, "glslPt_wCosW", "directions near the normal more likely, exactly as the integrand is. For Lambert, β is multiplied by (albedo/π)·cosθ / (cosθ/π) = albedo, a constant. The cosine cancels and the variance it caused is gone")],
        ]}
        glsl={`// cosine-weighted direction around n (Malley's method)\nfloat cosT = sqrt(1.0 - u1), sinT = sqrt(u1), phi = 2.0 * PI * u2;\nvec3 dir = t * cos(phi) * sinT + b * sin(phi) * sinT + n * cosT;\nthroughput *= albedo;                 // BRDF · cos / pdf, simplified`}>
        {r`L \approx \sum_{k} \beta_k\,L_e(\mathbf p_k), \qquad \beta_{k+1} = \beta_k\,\frac{f_r(\mathbf p_k, \boldsymbol\omega_k, \cdot)\,(\mathbf n_k\cdot\boldsymbol\omega_k)}{p(\boldsymbol\omega_k)}`}
      </Equation>
      <p>
        {tx(t, "glslPt_malley",
          "Where the cosine-weighted formulas come from (Malley's method): pick a point uniformly on the unit disk, at radius √u₁ and angle 2πu₂, and lift it straight up onto the hemisphere. Points near the centre of the disk land near the normal. The projection squashes area exactly by cos θ, so the directions come out with density cos θ / π. Two uniform random numbers in, one well-distributed direction out.")}
      </p>

      <H3>{tx(t, "glslPt_accTitle", "Progressive accumulation")}</H3>
      <Equation label={tx(t, "glslPt_accLabel", "A running average across frames")}
        where={[
          [r`\bar x_N`, tx(t, "glslPt_wAvg", "the average of the first N frames' samples, stored per pixel in a floating-point texture")],
          [r`x_N`, tx(t, "glslPt_wNew", "this frame's new sample (the average of its spp paths)")],
        ]}
        note={tx(t, "glslPt_accNote", "A shader cannot read and write the same texture, so two float textures take turns (ping-pong): frame N reads A and writes B, frame N+1 reads B and writes A. mix(prev, new, 1/(N+1)) is the same formula. Anything that changes the image (camera, material, light) must reset N to 0, or old samples linger as ghosts. Half-float textures, used here for WebGL compatibility, lose precision after a few thousand frames, which is why the figure stops at 4000.")}
        glsl={`vec3 prev = texture(uPrev, uv).rgb;\nFragColor = vec4(mix(prev, current, 1.0 / (uFrame + 1.0)), 1.0);`}>
        {r`\bar x_N = \bar x_{N-1} + \frac{x_N - \bar x_{N-1}}{N}`}
      </Equation>

      <PathTracerFigure t={t} />

      <H3>{tx(t, "glslPt_neeTitle", "Next event estimation: aim at the lights")}</H3>
      <p>
        {tx(t, "glslPt_neeBody",
          "A diffuse bounce picks a random direction, and a small light is rarely hit by chance. Most paths return nothing and a few return a lot: that is noise. Next event estimation adds, at every diffuse hit, a sample aimed directly at the light. It picks a random point on the light, traces a shadow ray to it, and adds its contribution if nothing is in the way. The integral over directions has to be rewritten as an integral over the light's area:")}
      </p>
      <Equation label={tx(t, "glslPt_neeLabel", "Direct light from a random point on an area light")}
        where={[
          [r`\mathbf q`, tx(t, "glslPt_wQ", "a point picked uniformly on the light, whose area is A. Its probability density per unit area is 1/A")],
          [r`d\omega = \frac{\cos\theta_l\,dA}{d^2}`, tx(t, "glslPt_wDw", "the change of variables from area to solid angle. A patch dA of the light, at distance d and tilted by θ_l from the direction to p, covers this much of p's sky")],
          [r`\cos\theta_x,\ \cos\theta_l`, tx(t, "glslPt_wCos2", "the angles at the surface (Lambert) and at the light (how squarely the light faces p)")],
          [r`V`, tx(t, "glslPt_wV", "the shadow ray's answer, 0 or 1")],
        ]}
        note={tx(t, "glslPt_neeNote", "Then the light must not be counted twice. When a diffuse bounce's random direction happens to hit the light, its emission is ignored, because NEE already accounted for it. Only camera rays and mirror or glass bounces, which NEE cannot sample, add emission when they hit the light. Combining both strategies with weights (multiple importance sampling) is the production refinement.")}>
        {r`L_{\text{direct}} \approx \frac{\text{albedo}}{\pi}\; L_e\; \frac{\cos\theta_x\,\cos\theta_l}{\lVert \mathbf q - \mathbf p\rVert^2}\; A\; V(\mathbf p, \mathbf q)`}
      </Equation>

      <H3>{tx(t, "glslPt_rrTitle", "Russian roulette: stopping without bias")}</H3>
      <Equation label={tx(t, "glslPt_rrLabel", "Continue with probability q, and compensate")}
        where={[
          [r`q`, tx(t, "glslPt_wQq", "the chance to keep going, here the brightest channel of the throughput, clamped to 5…95%. Dim paths are likely to stop and bright ones to continue")],
          [r`\beta / q`, tx(t, "glslPt_wBq", "survivors are boosted by 1/q. On average q·(β/q) + (1 − q)·0 = β, so the expected value is unchanged: the estimate stays unbiased")],
        ]}
        note={tx(t, "glslPt_rrNote", "A fixed maximum bounce count cuts off the light that longer paths would carry, which darkens the image (bias). Russian roulette lets paths be arbitrarily long in principle, while spending time mostly on paths that still carry energy.")}>
        {r`\beta' = \begin{cases} \beta / q & \text{with probability } q \\ \text{stop} & \text{otherwise} \end{cases} \qquad \mathbb E[\beta'] = \beta`}
      </Equation>

      <H3>{tx(t, "glslPt_matTitle", "Materials as sampling rules")}</H3>
      <LessonTable
        headers={[tx(t, "glslPt_tMat", "Material"), tx(t, "glslPt_tDir", "How the next direction is chosen"), tx(t, "glslPt_tW", "Throughput update")]}
        rows={[
          [tx(t, "glslPt_m1", "Diffuse (Lambert)"), tx(t, "glslPt_m1d", "cosine-weighted around n"), "β ← β · albedo"],
          [tx(t, "glslPt_m2", "Rough metal"), tx(t, "glslPt_m2d", "reflect(d, n) plus roughness × a random point in the unit ball; absorbed if it points into the surface"), "β ← β · albedo"],
          [tx(t, "glslPt_m3", "Glass"), tx(t, "glslPt_m3d", "reflect with probability F (Fresnel), otherwise refract. Choosing a branch at random with its own probability means the weight needs no change"), "β ← β"],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "glslPt_fireflies", "Isolated very bright pixels, called fireflies, are rare paths that found a bright light through an unlikely bounce, for example diffuse → glass → light. They are correct but converge painfully slowly. Renderers clamp each sample's contribution (biased but calm), use multiple importance sampling, or leave them to the denoiser. A caustic, the bright focus under the glass ball, is exactly this kind of path, which is why it is the last thing in the figure to clear up.")}
      </Callout>

      <KeyIdeas t={t} id="glslPt" items={[
        "The rendering equation: outgoing = emitted + ∫ BRDF × incoming × cos over the hemisphere.",
        "Monte Carlo: average f(x)/p(x); unbiased; error ∝ 1/√N; sample where f is large.",
        "A path multiplies its throughput by BRDF·cos/pdf per bounce; cosine sampling makes that just the albedo.",
        "Accumulate frames with a running average in ping-pong float textures; reset on any change.",
        "Next event estimation samples the light directly (area → solid angle: cosθ_l / d²); don't count the light twice.",
        "Russian roulette ends paths with probability 1 − q and divides survivors by q: shorter work, no bias.",
      ]} />
    </Article>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Acceleration & Denoising
// ═════════════════════════════════════════════════════════════════════════════

export function RtAccelContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "glslRtA_intro",
          "The figures in the last two chapters test every ray against every object, which is fine for seven objects. A game scene has millions of triangles, and a path-traced frame needs hundreds of millions of rays. Two ideas make that feasible: a spatial hierarchy, so each ray tests a few dozen triangles instead of all of them, and a denoiser, so a handful of samples per pixel looks like thousands. Together with ray-tracing hardware, they are how real-time ray tracing works in games today.")}
      </Lead>

      <H2>{tx(t, "glslRtA_bvhTitle", "Bounding volume hierarchies")}</H2>
      <p>
        {tx(t, "glslRtA_bvhBody",
          "Wrap all the primitives in one box. Split them into two groups, each with its own box, then split those, and so on down to leaves of a few primitives: that is a BVH. To trace a ray, test the root box. If the ray misses it, it misses everything inside, and one cheap test has ruled out the whole scene. If it hits, test both children and descend only into the boxes the ray actually crosses. On average a ray visits a number of nodes that grows with the logarithm of the scene size.")}
      </p>

      <BvhFigure t={t} />

      <Equation label={tx(t, "glslRtA_slabLabel", "Ray–box: the slab test")}
        where={[
          [r`t_{x0},\ t_{x1}`, tx(t, "glslRtA_wTx", "where the ray crosses the box's two x planes: (x₀ − o_x)/d_x and (x₁ − o_x)/d_x, swapped if needed so that t_{x0} ≤ t_{x1}. The same is done for y and z")],
          [r`t_{\text{enter}},\ t_{\text{exit}}`, tx(t, "glslRtA_wTe", "the ray is inside the box only while it is inside all three slabs at once: from the latest entry to the earliest exit")],
        ]}
        note={tx(t, "glslRtA_slabNote", "It costs six subtractions, six multiplications by the precomputed 1/d, and some min/max: far cheaper than a triangle test. A division by a zero component gives ±∞, which the min/max handle correctly.")}
        glsl={`vec3 t0 = (bmin - o) * invD, t1 = (bmax - o) * invD;\nvec3 tn = min(t0, t1), tf = max(t0, t1);\nfloat enter = max(max(tn.x, tn.y), tn.z), exit = min(min(tf.x, tf.y), tf.z);\nbool hit = enter <= exit && exit > 0.0;`}>
        {r`t_{\text{enter}} = \max(t_{x0}, t_{y0}, t_{z0}) \qquad t_{\text{exit}} = \min(t_{x1}, t_{y1}, t_{z1}) \qquad \text{hit} \iff t_{\text{enter}} \le t_{\text{exit}},\ t_{\text{exit}} > 0`}
      </Equation>
      <Equation label={tx(t, "glslRtA_sahLabel", "Where to split: the surface area heuristic")}
        where={[
          [r`A_L / A,\ A_R / A`, tx(t, "glslRtA_wA", "the probability that a random ray hitting the parent box also hits each child box. For uniformly random rays it equals the ratio of their surface areas")],
          [r`N_L,\ N_R`, tx(t, "glslRtA_wN", "the number of primitives on each side of the candidate split")],
          [r`C_{\text{trav}},\ C_{\text{isect}}`, tx(t, "glslRtA_wCost", "the cost of visiting a node and of testing a primitive")],
        ]}
        note={tx(t, "glslRtA_sahNote", "The figure splits at the median, which is simple and balanced. The SAH evaluates the expected cost of many candidate splits and keeps the cheapest. It prefers splits that cut off empty space, and gives BVHs that trace roughly twice as fast. Every production ray tracer uses it or a close relative.")}>
        {r`C_{\text{split}} = C_{\text{trav}} + \frac{A_L}{A}\,N_L\,C_{\text{isect}} + \frac{A_R}{A}\,N_R\,C_{\text{isect}}`}
      </Equation>
      <CodeBlock lang="glsl" filename="bvh_traverse.glsl" t={t}>{`// The BVH flattened into a texture: node i holds its box and either two
// child indices or a range of triangles. Traversal uses a small stack.
int stack[32]; int sp = 0; stack[sp++] = 0;
float best = 1e30;
while (sp > 0) {
    Node n = fetchNode(stack[--sp]);
    if (!hitBox(o, invD, n.bmin, n.bmax, best)) continue;   // also skip boxes beyond the best hit
    if (n.isLeaf) {
        for (int k = n.first; k < n.first + n.count; k++) best = min(best, hitTriangle(o, d, k));
    } else {
        stack[sp++] = n.right;                                // push the far child first,
        stack[sp++] = n.left;                                 // so the near one is popped next
    }
}`}</CodeBlock>

      <H2>{tx(t, "glslRtA_denTitle", "Denoising")}</H2>
      <p>
        {tx(t, "glslRtA_denBody",
          "A game can afford one or two paths per pixel per frame. The Cornell box figure shows what that looks like: a speckled mess. Denoisers turn it into a clean image by borrowing samples from neighbours in space and time, while taking care not to blur across edges.")}
      </p>
      <LessonTable
        headers={[tx(t, "glslRtA_tTech", "Technique"), tx(t, "glslRtA_tIdea", "Idea"), tx(t, "glslRtA_tUse", "Where")]}
        rows={[
          [tx(t, "glslRtA_d1", "Temporal accumulation"), tx(t, "glslRtA_d1i", "reproject last frame's result with motion vectors and blend in the new sample: the running average of the figure, but surviving camera motion"), tx(t, "glslRtA_d1u", "everywhere; the first stage of every real-time denoiser")],
          [tx(t, "glslRtA_d2", "Edge-avoiding à-trous filter"), tx(t, "glslRtA_d2i", "blur with a sparse kernel whose gaps double each pass (1, 2, 4, 8… pixels), weighting each neighbour by how similar its normal, depth and colour are, so edges stay sharp"), tx(t, "glslRtA_d2u", "SVGF (spatiotemporal variance-guided filtering), 2017")],
          [tx(t, "glslRtA_d3", "Variance guidance"), tx(t, "glslRtA_d3i", "estimate per pixel how noisy the accumulated value still is, and filter noisy pixels harder than converged ones"), tx(t, "glslRtA_d3u", "SVGF, NVIDIA NRD")],
          [tx(t, "glslRtA_d4", "Neural denoisers"), tx(t, "glslRtA_d4i", "a network trained on pairs of noisy and converged images, fed with the noisy colour plus albedo and normal buffers"), tx(t, "glslRtA_d4u", "Intel Open Image Denoise, OptiX, DLSS Ray Reconstruction")],
          [tx(t, "glslRtA_d5", "ReSTIR"), tx(t, "glslRtA_d5i", "reservoir resampling: each pixel keeps its best light sample and reuses its neighbours' and last frame's, so a few rays behave like thousands of candidate lights"), tx(t, "glslRtA_d5u", "direct and global illumination with many lights (Cyberpunk 2077 path tracing)")],
        ]}
      />

      <H2>{tx(t, "glslRtA_hwTitle", "Ray tracing in hardware")}</H2>
      <p>
        {tx(t, "glslRtA_hwBody",
          "Since 2018 GPUs have units that traverse BVHs and intersect triangles in fixed-function hardware. APIs expose them as DirectX Raytracing and Vulkan's VK_KHR_ray_tracing_pipeline / ray_query. The driver builds the BVH as two levels: a bottom-level structure per mesh (BLAS), and a top-level structure of instances with transforms (TLAS), so moving an object only updates the small top level. Shaders get new stages: ray generation (the per-pixel loop), closest-hit, any-hit (for alpha-tested leaves) and miss. Ray queries let an ordinary fragment or compute shader trace a ray inline. OpenGL has no official ray-tracing API. Engines that want hardware RT use Vulkan or DirectX 12, while everything in these chapters runs anywhere, because it is plain shader code.")}
      </p>
      <LessonTable
        headers={[tx(t, "glslRtA_cWay", "Approach"), tx(t, "glslRtA_cScene", "Scene"), tx(t, "glslRtA_cGood", "Good at"), tx(t, "glslRtA_cCost", "Cost")]}
        rows={[
          [tx(t, "glslRtA_r1", "Rasterisation"), tx(t, "glslRtA_r1s", "triangles"), tx(t, "glslRtA_r1g", "primary visibility, millions of triangles at high frame rates"), tx(t, "glslRtA_r1c", "reflections, shadows and GI need tricks (maps, screen-space, probes)")],
          [tx(t, "glslRtA_r2", "Raymarching"), tx(t, "glslRtA_r2s", "distance functions"), tx(t, "glslRtA_r2g", "fractals, smooth blends, volumes, soft shadows cheaply"), tx(t, "glslRtA_r2c", "many steps per ray; arbitrary meshes are hard")],
          [tx(t, "glslRtA_r3", "Whitted ray tracing"), tx(t, "glslRtA_r3s", "analytic shapes or triangles + BVH"), tx(t, "glslRtA_r3g", "exact mirrors, glass and hard shadows"), tx(t, "glslRtA_r3c", "no soft or indirect light")],
          [tx(t, "glslRtA_r4", "Path tracing"), tx(t, "glslRtA_r4s", "same"), tx(t, "glslRtA_r4g", "everything, physically correct"), tx(t, "glslRtA_r4c", "noise: many samples or a denoiser")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "glslRtA_hybrid", "Real-time engines combine them. They rasterise the primary view into a G-buffer, as in the Deferred Shading chapter, then trace rays only where rasterisation is weak: reflections, shadows from area lights, ambient occlusion and one bounce of global illumination, each at one sample per pixel and denoised. This is hybrid rendering, the approach behind most ray-traced games.")}
      </Callout>

      <KeyIdeas t={t} id="glslRtA" items={[
        "A BVH lets a ray skip whole groups of primitives: cost grows like log N instead of N.",
        "Ray–box is the slab test: latest entry vs earliest exit over the three axes.",
        "Split nodes with the surface area heuristic for faster trees than a median split.",
        "Denoisers reuse samples across time (reprojection) and space (edge-aware filters), or learn to (neural).",
        "Hardware RT: BLAS/TLAS acceleration structures and ray-gen/hit/miss shaders in DXR and Vulkan; OpenGL has none.",
      ]} />
    </Article>
  );
}
