// src/lib/tracks/glsl/presets/water.ts
import type { PlaygroundPreset } from "@/components/lesson/glsl/ShaderPlayground";
import { pickTexture } from "@/components/lesson/glsl/textures";

const POOL = pickTexture("mat:squareceramicglossytile-aqua-blue:albedo", "uvgrid");
// ── Water ─────────────────────────────────────────────────────────────────────
export const WATER_PRESETS: PlaygroundPreset[] = [
  {
    id: "ripples", label: "raindrops on a pool",
    channels: [POOL],
    note: "Each drop is a travelling wave packet: a ring whose radius grows with age and whose height fades. The heights are summed, the gradient gives the surface normal, and the normal bends the view of the tiles below (refraction) and adds a highlight.",
    frag: `uniform float uDrops;     // @slider 1 12 7
uniform float uStrength;  // @slider 0.0 0.05 0.018
uniform float uSpeed;     // @slider 0.1 1.0 0.35

float hash11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }

// A ring-shaped wave packet: centred on the front, decaying with age
float ripple(vec2 p, vec2 c, float age) {
    float x = length(p - c) - age * uSpeed;              // distance behind the front
    return sin(x * 55.0) * exp(-x * x * 90.0) * exp(-age * 1.3);
}

float height(vec2 p) {
    float h = 0.0;
    const float PERIOD = 2.5;
    for (int i = 0; i < 12; i++) {
        if (float(i) >= uDrops) break;
        float fi = float(i);
        float t = uTime + hash11(fi * 7.13) * PERIOD;     // each drop has its own clock
        float cycle = floor(t / PERIOD), age = mod(t, PERIOD);
        vec2 c = vec2(hash11(fi * 3.1 + cycle * 1.7), hash11(fi * 5.7 + cycle * 2.3)) * 2.0 - 1.0;
        c.x *= uResolution.x / uResolution.y;
        h += ripple(p, c, age);
    }
    return h;
}

void main() {
    vec2 p = (2.0 * gl_FragCoord.xy - uResolution) / uResolution.y;
    float e = 2.0 / uResolution.y;
    float h  = height(p);
    vec2 grad = vec2(height(p + vec2(e, 0.0)) - h, height(p + vec2(0.0, e)) - h) / e;
    vec3 n = normalize(vec3(-grad * uStrength, 1.0));

    vec2 uv = p * 0.6 + n.xy * 0.12;                      // refraction: look through a tilted surface
    vec3 col = texture(uTex0, uv).rgb * (0.9 + 0.35 * h);  // crests focus light (fake caustics)
    vec3 L = normalize(vec3(0.4, 0.6, 1.0));
    float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 80.0);
    FragColor = vec4(col + spec * 0.8, 1.0);
}`,
  },
  {
    id: "ocean", label: "Gerstner ocean (vertex shader)",
    mode: "mesh", mesh: "plane",
    note: "Four Gerstner waves displace the grid in the vertex shader (see the 'vertex' tab), which also builds the exact normal from the analytic tangents. The fragment shader mixes a sky reflection and the water body with Schlick's Fresnel (R₀ ≈ 0.02 for water). Toggle Gerstner off to get plain sines.",
    vert: `uniform float uSteep;     // @slider 0.0 1.2 0.75
uniform float uAmp;       // @slider 0.0 0.1 0.04
uniform float uGerstner;  // @toggle 1

void main() {
    vec2  dirs[4] = vec2[4](normalize(vec2(1.0, 0.3)), normalize(vec2(0.6, 1.0)),
                            normalize(vec2(-0.4, 0.9)), normalize(vec2(0.9, -0.5)));
    float wls[4]  = float[4](0.9, 0.55, 0.37, 0.23);        // wavelengths

    vec3 disp = vec3(0.0);
    vec3 T = vec3(1.0, 0.0, 0.0), B = vec3(0.0, 0.0, 1.0);  // ∂P/∂x, ∂P/∂z
    for (int i = 0; i < 4; i++) {
        vec2  D = dirs[i];
        float k = 6.28318 / wls[i];
        float A = uAmp * wls[i] / wls[0];                   // shorter waves are lower
        float w = sqrt(9.81 * k) * 0.35;                    // deep-water dispersion, slowed down
        float Q = uGerstner * uSteep / (k * A * 4.0 + 1e-5);// steepness, shared by 4 waves
        float th = k * dot(D, aPos.xz) - w * uTime;
        float s = sin(th), c = cos(th);
        disp += vec3(Q * A * D.x * c, A * s, Q * A * D.y * c);
        T += vec3(-Q * A * k * D.x * D.x * s, A * k * D.x * c, -Q * A * k * D.x * D.y * s);
        B += vec3(-Q * A * k * D.x * D.y * s, A * k * D.y * c, -Q * A * k * D.y * D.y * s);
    }
    vec3 p = (aPos + disp) * 1.6;

    vec4 world = uModel * vec4(p, 1.0);
    vWorld   = world.xyz;
    vNormal  = normalize(cross(B, T));
    vUV      = aUV;
    vTangent = normalize(T);
    gl_Position = uProjection * uView * world;
}`,
    frag: `uniform vec3 uDeep;     // @color 0.01 0.1 0.18
uniform vec3 uShallow;  // @color 0.06 0.38 0.45

vec3 sky(vec3 d) {
    vec3 col = mix(vec3(0.75, 0.82, 0.9), vec3(0.2, 0.4, 0.75), clamp(d.y * 1.5, 0.0, 1.0));
    return col + vec3(6.0, 5.0, 4.0) * pow(max(dot(d, uLightDir), 0.0), 600.0);   // the sun
}

void main() {
    vec3 N = normalize(vNormal);
    if (!gl_FrontFacing) N = -N;
    vec3 V = normalize(uCamPos - vWorld);
    float F = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);  // Schlick, water
    vec3 refl = sky(reflect(-V, N));
    vec3 body = mix(uDeep, uShallow, clamp(vWorld.y * 5.0 + 0.4, 0.0, 1.0));  // crests look lighter
    vec3 col = mix(body, refl, F);
    col += vec3(0.8) * smoothstep(0.07, 0.11, vWorld.y);                    // foam on the highest crests
    FragColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`,
  },
];
