// Playground presets for the Atmosphere & Volumetrics chapter.
import type { PlaygroundPreset } from "@/components/lesson/glsl/ShaderPlayground";

export const SKY_PRESETS: PlaygroundPreset[] = [
  {
    id: "sky", label: "physical sky (Rayleigh + Mie)",
    note: "Single scattering, integrated numerically: 16 samples along the view ray, and from each one 8 samples toward the sun to measure how much sunlight survives to reach it. The blue sky, the white haze around the sun and the red sunset all come out of the same equations. Lower the sun below 0.1 rad and watch the light path through the atmosphere get long enough to remove the blue.",
    frag: `uniform float uSunElev;   // @slider -0.08 1.4 0.2
uniform float uSunAz;     // @slider -1.2 1.2 0.75
uniform float uHaze;      // @slider 0.0 6.0 1.0
uniform float uExposure;  // @slider 1.0 40.0 5.0

const float PI  = 3.14159265;
const float R_E = 6360e3;                                  // Earth radius (m)
const float R_A = 6420e3;                                  // top of the atmosphere (m)
const vec3  BETA_R = vec3(5.8e-6, 13.5e-6, 33.1e-6);      // Rayleigh scattering at sea level, per metre (R, G, B)
const float BETA_M = 21e-6;                                // Mie (aerosol) scattering at sea level
const float H_R = 8000.0;                                  // Rayleigh scale height: density falls by e every 8 km
const float H_M = 1200.0;                                  // Mie scale height: haze stays low
const float G   = 0.76;                                    // Mie anisotropy: strongly forward-scattering

vec2 raySphere(vec3 ro, vec3 rd, float r) {                // entry, exit distances (sphere at the origin)
    float b = dot(ro, rd), c = dot(ro, ro) - r * r, h = b * b - c;
    if (h < 0.0) return vec2(-1.0);
    h = sqrt(h);
    return vec2(-b - h, -b + h);
}

vec3 sky(vec3 ro, vec3 rd, vec3 sun, out vec3 transmittance) {
    float tEnd = raySphere(ro, rd, R_A).y;
    float tGround = raySphere(ro, rd, R_E).x;
    if (tGround > 0.0) tEnd = tGround;                     // looking down: stop at the ground

    const int N = 16, NL = 8;
    float ds = tEnd / float(N);
    float mu = dot(rd, sun);                               // cos of the scattering angle
    float phaseR = 3.0 / (16.0 * PI) * (1.0 + mu * mu);
    float phaseM = 3.0 / (8.0 * PI) * ((1.0 - G * G) * (1.0 + mu * mu))
                 / ((2.0 + G * G) * pow(1.0 + G * G - 2.0 * G * mu, 1.5));

    vec3 sumR = vec3(0.0), sumM = vec3(0.0);
    float odR = 0.0, odM = 0.0;                            // optical depth from the camera
    for (int i = 0; i < N; i++) {
        vec3 p = ro + rd * (ds * (float(i) + 0.5));
        float h = length(p) - R_E;
        float dR = exp(-h / H_R) * ds, dM = exp(-h / H_M) * ds;
        odR += dR; odM += dM;

        float tl = raySphere(p, sun, R_A).y;               // march toward the sun
        float dl = tl / float(NL), lR = 0.0, lM = 0.0;
        bool blocked = false;
        for (int j = 0; j < NL; j++) {
            float hq = length(p + sun * (dl * (float(j) + 0.5))) - R_E;
            if (hq < 0.0) { blocked = true; break; }       // the planet is in the way: night side
            lR += exp(-hq / H_R) * dl; lM += exp(-hq / H_M) * dl;
        }
        if (blocked) continue;
        vec3 tau = BETA_R * (odR + lR) + BETA_M * uHaze * 1.1 * (odM + lM);   // camera→p→sun extinction
        vec3 att = exp(-tau);
        sumR += att * dR;
        sumM += att * dM;
    }
    transmittance = exp(-(BETA_R * odR + BETA_M * uHaze * 1.1 * odM));
    return 20.0 * (sumR * BETA_R * phaseR + sumM * BETA_M * uHaze * phaseM);  // 20 = sun irradiance
}

void main() {
    vec2 p = (2.0 * gl_FragCoord.xy - uResolution) / uResolution.y;
    vec3 ro = vec3(0.0, R_E + 2.0, 0.0);                   // 2 m above the ground
    vec3 rd = normalize(vec3(p.x, p.y + 0.45, -1.3));      // looking at the horizon, a bit upward
    vec3 sun = normalize(vec3(sin(uSunAz) * cos(uSunElev), sin(uSunElev), -cos(uSunAz) * cos(uSunElev)));

    vec3 T;
    vec3 col = sky(ro, rd, sun, T);
    col += 18.0 * T * smoothstep(0.99985, 0.9999, dot(rd, sun));   // the sun disc, dimmed by the air in front of it
    col = 1.0 - exp(-col * uExposure);                              // simple exposure tone map
    FragColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`,
  },
  {
    id: "shafts", label: "volumetric light shafts",
    note: "A room filled with thin fog and a sunny wall with three windows. Every view ray is marched through the fog. At each sample, a closed-form test asks whether the sun is visible through a window from there, and if so adds sunlight scattered toward the eye (Henyey–Greenstein phase), dimmed by the fog in between (Beer–Lambert). Raise g to see how forward scattering makes the shafts glow when you look toward the light.",
    frag: `uniform float uDensity;  // @slider 0.0 0.3 0.08
uniform float uG;        // @slider -0.5 0.95 0.6
uniform float uSunElev;  // @slider 0.15 1.0 0.45
uniform float uSunAz;    // @slider -0.6 0.6 0.25
uniform float uNoise;    // @toggle 1

const float PI = 3.14159265;
const float WALL_Z = -4.0;                                 // the window wall
float hash(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
float noise3(vec3 p) {
    vec3 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1, 0, 0)), u.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), u.x), u.y),
               mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), u.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), u.x), u.y), u.z);
}
bool inWindow(vec2 xy) {                                   // three tall windows in the wall
    if (xy.y < 1.0 || xy.y > 3.6) return false;
    return abs(xy.x + 2.6) < 0.55 || abs(xy.x) < 0.55 || abs(xy.x - 2.6) < 0.55;
}
// Is the sun visible from p? Follow the ray toward the sun to the wall plane (closed form).
float sunVisible(vec3 p, vec3 L) {
    if (p.z <= WALL_Z) return 1.0;                         // already outside
    float t = (WALL_Z - p.z) / L.z;                        // L.z < 0: the sun is behind the wall
    return inWindow((p + L * t).xy) ? 1.0 : 0.0;
}
float phaseHG(float mu, float g) {                         // Henyey–Greenstein
    float d = 1.0 + g * g - 2.0 * g * mu;
    return (1.0 - g * g) / (4.0 * PI * d * sqrt(d));
}

void main() {
    vec2 p = (2.0 * gl_FragCoord.xy - uResolution) / uResolution.y;
    vec3 ro = vec3(0.4 * sin(uTime * 0.2), 1.6, 6.0);
    vec3 rd = normalize(vec3(p.x, p.y + 0.1, -1.4));
    vec3 L  = normalize(vec3(sin(uSunAz), uSunElev, -1.0));   // toward the sun
    vec3 sunCol = vec3(1.0, 0.9, 0.75) * 7.0;

    // What does the ray hit? The floor (y = 0) or the wall (z = WALL_Z); through a window: the bright outside
    float tFloor = rd.y < 0.0 ? -ro.y / rd.y : 1e9;
    float tWall = (WALL_Z - ro.z) / rd.z;
    float tHit = min(tFloor, tWall);
    vec3 hit = ro + rd * tHit;
    vec3 surf;
    if (tFloor < tWall) {                                  // floor: sunlit patches where windows let light in
        float check = mod(floor(hit.x) + floor(hit.z), 2.0);
        vec3 albedo = mix(vec3(0.35, 0.3, 0.26), vec3(0.45, 0.4, 0.34), check);
        surf = albedo * (0.08 + sunCol * 0.12 * sunVisible(hit + vec3(0.0, 1e-3, 0.0), L) * max(L.y, 0.0));
    } else if (inWindow(hit.xy)) {
        surf = vec3(1.4, 1.5, 1.7) + sunCol * pow(max(dot(rd, L), 0.0), 60.0);   // the sky outside
        tHit = min(tHit, 30.0);
    } else surf = vec3(0.08, 0.075, 0.07);                 // the wall's shaded inner side

    // March through the fog, front to back
    const int N = 64;
    float ds = tHit / float(N);
    float jitter = hash(vec3(gl_FragCoord.xy, uTime));     // breaks the step pattern into fine noise
    float T = 1.0;                                         // transmittance so far
    vec3 inscatter = vec3(0.0);
    float ph = phaseHG(dot(rd, L), uG);
    for (int i = 0; i < N; i++) {
        vec3 x = ro + rd * (ds * (float(i) + jitter));
        float rho = uDensity * (uNoise > 0.5 ? 0.4 + 1.2 * noise3(x * 0.7 + vec3(0.0, 0.0, uTime * 0.15)) : 1.0);
        inscatter += T * rho * ds * ph * sunCol * sunVisible(x, L) * 4.0;   // light scattered toward the eye here
        inscatter += T * rho * ds * vec3(0.05, 0.06, 0.08);                 // dim ambient fill
        T *= exp(-rho * ds);                                                 // Beer–Lambert
    }
    vec3 col = surf * T + inscatter;
    col = 1.0 - exp(-col * 1.4);
    FragColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`,
  },
  {
    id: "godrays", label: "screen-space god rays (post)",
    note: "The post-process version (Mitchell, GPU Gems 3). Each pixel walks toward the sun's screen position, summing the brightness of the unoccluded sky it passes, with each sample decaying. Occluders cut dark wedges into the glow. It costs a single pass and works only while the sun is on screen. Click and drag to move the sun.",
    frag: `uniform int   uSamples;  // @slider 8 128 64
uniform float uDensity;  // @slider 0.1 1.0 0.9
uniform float uDecay;    // @slider 0.9 1.0 0.97
uniform float uWeight;   // @slider 0.0 0.2 0.06

float hash11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }

// 1 where the sky (and sun) are visible, 0 where the skyline blocks it. This is the occlusion mask.
float skyMask(vec2 uv, vec2 sun) {
    float x = uv.x * 24.0, b = floor(x);
    float h = 0.12 + 0.28 * hash11(b) * step(0.25, hash11(b + 7.0));          // building heights
    float trees = 0.18 + 0.05 * sin(uv.x * 60.0) * sin(uv.x * 23.0 + 1.0);   // a wavy tree line
    float ground = max(h, trees);
    if (uv.y < ground) return 0.0;
    float d = length((uv - sun) * vec2(uResolution.x / uResolution.y, 1.0));
    return 0.25 + 3.0 * smoothstep(0.06, 0.0, d);                            // sky, plus the bright sun disc
}

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;
    vec2 sun = uMouse.x + uMouse.y > 0.0 ? uMouse.xy / uResolution : vec2(0.5 + 0.3 * sin(uTime * 0.3), 0.42);
    vec3 base = skyMask(uv, sun) > 0.0 ? mix(vec3(0.9, 0.55, 0.3), vec3(0.25, 0.35, 0.6), uv.y) : vec3(0.03, 0.03, 0.05);

    // Radial blur toward the sun: accumulate the mask along the line
    vec2 delta = (uv - sun) * uDensity / float(uSamples);
    vec2 c = uv;
    float illum = 1.0, rays = 0.0;
    for (int i = 0; i < 128; i++) {
        if (i >= uSamples) break;
        c -= delta;
        rays += skyMask(c, sun) * illum * uWeight;
        illum *= uDecay;                                   // farther samples count less
    }
    vec3 col = base + vec3(1.0, 0.8, 0.55) * rays;
    FragColor = vec4(1.0 - exp(-col * 1.2), 1.0);
}`,
  },
];
