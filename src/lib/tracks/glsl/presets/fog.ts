// src/lib/tracks/glsl/presets/fog.ts
import type { PlaygroundPreset } from "@/components/lesson/glsl/ShaderPlayground";
// ── Fog ───────────────────────────────────────────────────────────────────────
export const FOG_PRESETS: PlaygroundPreset[] = [
  {
    id: "fog", label: "four kinds of fog",
    note: "A raymarched field of pillars. uFog: 0 none, 1 linear, 2 exponential, 3 exp², 4 height fog (analytic integral). The fog colour picks up the sun when looking toward it, a cheap trick that reads as light scattering.",
    frag: `uniform int   uFog;      // @slider 0 4 4
uniform float uDensity;  // @slider 0.0 0.12 0.04
uniform float uFalloff;  // @slider 0.05 1.5 0.35
uniform vec3  uFogColor; // @color 0.62 0.68 0.76

float sdBox(vec3 p, vec3 b) { vec3 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0); }
float hash21(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

// Pillars repeat every 4 units, each cell with its own height. With a
// different shape per cell, the nearest surface may be in a NEIGHBOURING
// cell, so the 3×3 cells around p are all checked. Checking only p's own
// cell lets the ray jump into a taller neighbour and cut its top off.
float pillars(vec3 p) {
    vec2 cell = floor(p.xz / 4.0);
    float d = 1e9;
    for (int j = -1; j <= 1; j++)
    for (int i = -1; i <= 1; i++) {
        vec2 c = cell + vec2(i, j);
        float h = 0.5 + 3.5 * hash21(c);
        vec3 q = p - vec3(c.x * 4.0 + 2.0, h, c.y * 4.0 + 2.0);   // centre of that cell's pillar
        d = min(d, sdBox(q, vec3(0.45, h, 0.45)));
    }
    return d;
}
float map(vec3 p) { return min(p.y, pillars(p)); }
vec3 normal(vec3 p) {
    const vec2 e = vec2(1e-3, 0.0);
    return normalize(vec3(map(p + e.xyy) - map(p - e.xyy), map(p + e.yxy) - map(p - e.yxy), map(p + e.yyx) - map(p - e.yyx)));
}

void main() {
    vec2 p = (2.0 * gl_FragCoord.xy - uResolution) / uResolution.y;
    vec3 ro = vec3(0.0, 1.6, uTime * 2.0);                   // x = 0: between two rows of pillars
    vec3 rd = normalize(vec3(p.x, p.y - 0.15, 1.6));
    vec3 sun = normalize(vec3(0.3, 0.35, 1.0));

    float t = 0.0;
    for (int i = 0; i < 160; i++) {
        float h = map(ro + rd * t);
        if (h < 0.001 * t || t > 150.0) break;
        t += h;
    }
    vec3 col = mix(vec3(0.75, 0.8, 0.88), vec3(0.3, 0.45, 0.7), clamp(rd.y * 2.0, 0.0, 1.0));
    if (t < 150.0) {
        vec3 pos = ro + rd * t, n = normal(pos);
        bool floorHit = pos.y < pillars(pos);                 // which surface is closer
        vec3 albedo = floorHit ? vec3(0.3 + 0.1 * mod(floor(pos.x) + floor(pos.z), 2.0)) : vec3(0.75, 0.6, 0.45);
        col = albedo * (0.25 + 0.9 * max(dot(n, sun), 0.0));
    } else t = 400.0;

    vec3 fogCol = mix(uFogColor, vec3(1.0, 0.85, 0.6), pow(max(dot(rd, sun), 0.0), 8.0));
    float vis = 1.0;
    if      (uFog == 1) vis = clamp((60.0 - t) / (60.0 - 5.0), 0.0, 1.0);
    else if (uFog == 2) vis = exp(-uDensity * t);
    else if (uFog == 3) vis = exp(-pow(uDensity * t, 2.0));
    else if (uFog == 4) {
        // density a·e^(-b·y) integrated from the camera along the ray
        float a = uDensity * 3.0, b = uFalloff;
        // near-horizontal rays: the limit of the formula, a·e^(-b·y0)·t (avoids 0/0)
        float amount = abs(rd.y) < 1e-4 ? a * exp(-b * ro.y) * t
                     : (a / b) * exp(-b * ro.y) * (1.0 - exp(-b * rd.y * t)) / rd.y;
        vis = exp(-amount);
    }
    col = mix(fogCol, col, vis);
    FragColor = vec4(pow(col, vec3(0.9)), 1.0);
}`,
  },
];
