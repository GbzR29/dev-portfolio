// src/lib/tracks/glsl/presets/glass.ts
import type { PlaygroundPreset } from "@/components/lesson/glsl/ShaderPlayground";
import { pickTexture } from "@/components/lesson/glsl/textures";

const POOL = pickTexture("mat:squareceramicglossytile-aqua-blue:albedo", "uvgrid");
// ── Glass & Fresnel ───────────────────────────────────────────────────────────
export const GLASS_PRESETS: PlaygroundPreset[] = [
  {
    id: "glass", label: "glass ball: refraction + dispersion",
    channels: [POOL],
    note: "A glass sphere in front of a textured wall. Each ray refracts twice (air → glass, glass → air) with refract(); red, green and blue use slightly different indices, which splits the colours (dispersion). Fresnel blends in the reflection at the rim.",
    frag: `uniform float uIOR;         // @slider 1.0 2.4 1.5
uniform float uDispersion;  // @slider 0.0 0.1 0.03
uniform float uFresnel;     // @toggle 1
uniform vec3  uTint;        // @color 0.9 0.97 1.0

vec3 wall(vec3 ro, vec3 rd) {                         // the backdrop: plane z = -2.5
    float t = (-2.5 - ro.z) / rd.z;
    vec2 uv = (ro + rd * t).xy * 0.22 + vec2(uTime * 0.02, 0.0);
    return texture(uTex0, uv).rgb;
}
vec3 env(vec3 d) {                                    // what the reflection shows
    vec3 c = mix(vec3(0.08, 0.09, 0.12), vec3(0.8, 0.85, 0.95), smoothstep(-0.2, 0.9, d.y));
    return c + 4.0 * pow(max(dot(d, normalize(vec3(0.6, 0.7, 0.5))), 0.0), 120.0);
}
vec2 sphere(vec3 ro, vec3 rd, float r) {             // entry and exit distances
    float b = dot(ro, rd), c = dot(ro, ro) - r * r, h = b * b - c;
    if (h < 0.0) return vec2(-1.0);
    h = sqrt(h);
    return vec2(-b - h, -b + h);
}
vec3 through(vec3 ro, vec3 rd, float ior) {
    vec3 p  = ro + rd * sphere(ro, rd, 1.0).x;
    vec3 r1 = refract(rd, normalize(p), 1.0 / ior);    // entering: eta = n_air / n_glass
    vec3 q  = p + r1 * sphere(p, r1, 1.0).y;           // exit point
    vec3 n2 = -normalize(q);                           // normal facing the ray, inside
    vec3 r2 = refract(r1, n2, ior);                    // leaving: eta = n_glass / n_air
    if (dot(r2, r2) < 1e-4) return env(reflect(r1, n2)) * 0.5;   // total internal reflection
    return wall(q, r2);
}

void main() {
    vec2 p = (2.0 * gl_FragCoord.xy - uResolution) / uResolution.y;
    vec3 ro = vec3(0.0, 0.0, 3.5), rd = normalize(vec3(p, -2.2));
    vec3 col = wall(ro, rd);
    float t = sphere(ro, rd, 1.0).x;
    if (t > 0.0) {
        vec3 n = normalize(ro + rd * t);
        vec3 refr = vec3(through(ro, rd, uIOR - uDispersion).r,
                         through(ro, rd, uIOR).g,
                         through(ro, rd, uIOR + uDispersion).b) * uTint;
        float r0 = pow((uIOR - 1.0) / (uIOR + 1.0), 2.0);
        float F  = r0 + (1.0 - r0) * pow(1.0 - max(dot(-rd, n), 0.0), 5.0);
        col = mix(refr, env(reflect(rd, n)), uFresnel * F);
    }
    FragColor = vec4(col, 1.0);
}`,
  },
  {
    id: "rim", label: "Fresnel on a mesh",
    mode: "mesh", mesh: "torus",
    note: "Schlick's term alone, painted on a mesh: dark where the surface faces you, bright at grazing angles. Raise uPower to thin the rim. The same number drives reflections, rim lights and force-field shields.",
    frag: `uniform float uR0;     // @slider 0.0 1.0 0.04
uniform float uPower;  // @slider 1.0 10.0 5.0
uniform float uShowF;  // @toggle 0

vec3 env(vec3 d) {
    vec3 c = mix(vec3(0.1, 0.1, 0.12), vec3(0.75, 0.8, 0.9), smoothstep(-0.3, 0.8, d.y));
    return c + 3.0 * pow(max(dot(d, uLightDir), 0.0), 200.0);
}

void main() {
    vec3 N = normalize(vNormal), V = normalize(uCamPos - vWorld);
    float F = uR0 + (1.0 - uR0) * pow(1.0 - max(dot(N, V), 0.0), uPower);
    vec3 base = vec3(0.05, 0.06, 0.08) * (0.3 + max(dot(N, uLightDir), 0.0));
    vec3 col = mix(base, env(reflect(-V, N)), F);
    if (uShowF > 0.5) col = vec3(F);
    FragColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`,
  },
];
