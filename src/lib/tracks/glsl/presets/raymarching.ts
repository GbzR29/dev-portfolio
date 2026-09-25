// src/lib/tracks/glsl/presets/raymarching.ts
import type { PlaygroundPreset } from "@/components/lesson/glsl/ShaderPlayground";
// ── Raymarching ───────────────────────────────────────────────────────────────
const RM_LIB = `float sdSphere(vec3 p, float r) { return length(p) - r; }
float sdBox(vec3 p, vec3 b) { vec3 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0); }
float sdTorus(vec3 p, vec2 t) { vec2 q = vec2(length(p.xz) - t.x, p.y); return length(q) - t.y; }
float sdCapsule(vec3 p, vec3 a, vec3 b, float r) { vec3 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h) - r; }
float smin(float a, float b, float k) { float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }

// Orbit camera: drag to turn, otherwise it circles slowly
mat3 camera(vec3 ro, vec3 ta) {
    vec3 w = normalize(ta - ro), u = normalize(cross(w, vec3(0.0, 1.0, 0.0))), v = cross(u, w);
    return mat3(u, v, w);
}
vec3 orbit(float dist) {
    vec2 m = uMouse.xy / uResolution;
    float yaw   = uMouse.x + uMouse.y > 0.0 ? (m.x - 0.5) * 6.2832 : 0.5 + uTime * 0.15;
    float pitch = uMouse.x + uMouse.y > 0.0 ? clamp(m.y * 1.6 - 0.3, -0.1, 1.3) : 0.4;
    return dist * vec3(cos(pitch) * sin(yaw), sin(pitch), cos(pitch) * cos(yaw));
}
vec3 heat(float x) { return clamp(vec3(1.5 - abs(4.0 * x - 3.0), 1.5 - abs(4.0 * x - 2.0), 1.5 - abs(4.0 * x - 1.0)), 0.0, 1.0); }`;

export const RAYMARCH_PRESETS: PlaygroundPreset[] = [
  {
    id: "basic", label: "sphere tracing, step by step",
    note: "The smallest complete raymarcher: a camera ray per pixel, sphere tracing against map(), a normal from the gradient, diffuse light. Toggle the heat map to colour each pixel by the number of steps. Silhouettes and grazing floor are where the steps pile up.",
    frag: `uniform int   uSteps;  // @slider 8 200 80
uniform float uHeat;   // @toggle 0

${RM_LIB}

float map(vec3 p) {
    float ground = p.y + 1.0;
    float ball   = sdSphere(p - vec3(0.0, 0.2 * sin(uTime * 1.3), 0.0), 0.9);
    return min(ground, ball);
}
vec3 calcNormal(vec3 p) {
    const vec2 e = vec2(1e-3, 0.0);                          // central differences of the SDF
    return normalize(vec3(map(p + e.xyy) - map(p - e.xyy),
                          map(p + e.yxy) - map(p - e.yxy),
                          map(p + e.yyx) - map(p - e.yyx)));
}

void main() {
    vec2 p = (2.0 * gl_FragCoord.xy - uResolution) / uResolution.y;
    vec3 ro = orbit(4.0);
    vec3 rd = camera(ro, vec3(0.0)) * normalize(vec3(p, 1.8));

    float t = 0.0;
    int steps = 0;
    bool hit = false;
    for (int i = 0; i < 200; i++) {
        if (i >= uSteps) break;
        float h = map(ro + rd * t);          // safe distance
        steps = i + 1;
        if (h < 0.001 * t) { hit = true; break; }
        t += h;                              // jump exactly that far
        if (t > 40.0) break;
    }

    vec3 col = vec3(0.6, 0.7, 0.85) - rd.y * 0.3;
    if (hit) {
        vec3 pos = ro + rd * t, n = calcNormal(pos);
        vec3 L = normalize(vec3(0.6, 0.8, 0.4));
        bool floorHit = pos.y + 1.0 <= map(pos) + 1e-4;        // which SDF won the min()?
        vec3 albedo = floorHit ? vec3(0.4 + 0.2 * mod(floor(pos.x) + floor(pos.z), 2.0)) : vec3(0.9, 0.4, 0.25);
        col = albedo * (0.15 + 0.85 * max(dot(n, L), 0.0));
    }
    if (uHeat > 0.5) col = heat(float(steps) / float(uSteps));
    FragColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`,
  },
  {
    id: "scene", label: "shapes, smooth union, shadows, AO",
    note: "Several SDF primitives blended with smin, lit with soft shadows (a second march toward the light that records how close it passes to geometry) and ambient occlusion (a few samples along the normal). Drag to orbit.",
    frag: `uniform float uK;        // @slider 0.0 0.8 0.3
uniform float uShadowK;  // @slider 2.0 64.0 12.0
uniform float uAO;       // @toggle 1

${RM_LIB}

float map(vec3 p) {
    float ground = p.y + 1.0;
    float s   = sdSphere(p - vec3(0.9 * sin(uTime * 0.8), 0.0, 0.0), 0.55);
    float b   = sdBox(p - vec3(-0.5, -0.4, 0.3), vec3(0.4));
    float tor = sdTorus(p - vec3(0.8, -0.3, -0.7), vec2(0.45, 0.14));
    float cap = sdCapsule(p, vec3(-1.2, -1.0, -0.8), vec3(-0.9, 0.3, -0.9), 0.18);
    float k = max(uK, 1e-3);
    return min(ground, smin(smin(smin(s, b, k), tor, k), cap, k));
}
vec3 calcNormal(vec3 p) {
    const vec2 e = vec2(1e-3, 0.0);
    return normalize(vec3(map(p + e.xyy) - map(p - e.xyy), map(p + e.yxy) - map(p - e.yxy), map(p + e.yyx) - map(p - e.yyx)));
}
// Soft shadow: how close does the shadow ray pass to anything, relative to how far it went?
float softShadow(vec3 ro, vec3 rd, float k) {
    float res = 1.0, t = 0.02;
    for (int i = 0; i < 64; i++) {
        float h = map(ro + rd * t);
        res = min(res, k * h / t);
        t += clamp(h, 0.02, 0.25);
        if (res < 0.001 || t > 8.0) break;
    }
    return clamp(res, 0.0, 1.0);
}
// Ambient occlusion: compare the SDF with the distance travelled along the normal
float ambientOcclusion(vec3 p, vec3 n) {
    float occ = 0.0, w = 1.0;
    for (int i = 0; i < 5; i++) {
        float h = 0.02 + 0.12 * float(i);
        occ += (h - map(p + n * h)) * w;
        w *= 0.85;
    }
    return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
}

void main() {
    vec2 p = (2.0 * gl_FragCoord.xy - uResolution) / uResolution.y;
    vec3 ro = orbit(4.5);
    vec3 rd = camera(ro, vec3(0.0, -0.3, 0.0)) * normalize(vec3(p, 1.8));

    float t = 0.0;
    bool hit = false;
    for (int i = 0; i < 160; i++) {
        float h = map(ro + rd * t);
        if (h < 0.0005 * t) { hit = true; break; }
        t += h;
        if (t > 40.0) break;
    }
    vec3 col = vec3(0.62, 0.72, 0.86) - rd.y * 0.35;
    if (hit) {
        vec3 pos = ro + rd * t, n = calcNormal(pos);
        vec3 L = normalize(vec3(0.6, 0.7, 0.3));
        float dif = max(dot(n, L), 0.0) * softShadow(pos + n * 0.002, L, uShadowK);
        float ao  = uAO > 0.5 ? ambientOcclusion(pos, n) : 1.0;
        bool floorHit = pos.y + 1.0 <= map(pos) + 1e-4;
        vec3 albedo = floorHit ? vec3(0.35 + 0.15 * mod(floor(pos.x * 2.0) + floor(pos.z * 2.0), 2.0)) : vec3(0.85, 0.5, 0.3);
        col = albedo * (vec3(1.0, 0.92, 0.8) * dif * 1.2 + vec3(0.18, 0.22, 0.3) * ao);
        col = mix(col, vec3(0.62, 0.72, 0.86), 1.0 - exp(-0.004 * t * t));
    }
    FragColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`,
  },
  {
    id: "repeat", label: "infinite repetition",
    note: "One sphere-box shape, repeated forever with mod() on the position before evaluating it. The cost of an infinite field is the cost of one object, the same trick as tiling in 2D. Fog hides where the march gives up.",
    frag: `uniform float uSpacing;  // @slider 1.5 6.0 3.0
uniform float uMorph;    // @slider 0.0 1.0 0.5

${RM_LIB}

float map(vec3 p) {
    vec3 q = p;
    q = mod(q + 0.5 * uSpacing, uSpacing) - 0.5 * uSpacing;   // every cell holds the same copy
    float s = sdSphere(q, 0.6);
    float b = sdBox(q, vec3(0.45)) - 0.05;
    return mix(s, b, uMorph * (0.5 + 0.5 * sin(uTime + p.z * 0.3)));
}
vec3 calcNormal(vec3 p) {
    const vec2 e = vec2(1e-3, 0.0);
    return normalize(vec3(map(p + e.xyy) - map(p - e.xyy), map(p + e.yxy) - map(p - e.yxy), map(p + e.yyx) - map(p - e.yyx)));
}

void main() {
    vec2 p = (2.0 * gl_FragCoord.xy - uResolution) / uResolution.y;
    vec3 ro = vec3(0.5 * uSpacing, 0.5 * uSpacing, uTime * 2.0);
    float a = uTime * 0.1;
    vec3 rd = normalize(vec3(p.x * cos(a) - 1.6 * sin(a) * 0.3, p.y, 1.6));
    float t = 0.0;
    for (int i = 0; i < 120; i++) {
        float h = map(ro + rd * t);
        if (h < 0.001 * t || t > 60.0) break;
        t += h;
    }
    vec3 pos = ro + rd * t, n = calcNormal(pos);
    vec3 col = 0.5 + 0.5 * cos(vec3(0.0, 2.0, 4.0) + floor(pos.z / uSpacing) * 0.7);
    col *= 0.25 + 0.75 * max(dot(n, normalize(vec3(0.5, 0.8, -0.3))), 0.0);
    col = mix(col, vec3(0.05, 0.06, 0.09), 1.0 - exp(-0.0015 * t * t));
    FragColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`,
  },
];
