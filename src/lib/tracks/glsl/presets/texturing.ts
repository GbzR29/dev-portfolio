// src/lib/tracks/glsl/presets/texturing.ts
import type { PlaygroundPreset } from "@/components/lesson/glsl/ShaderPlayground";
import { pickTexture } from "@/components/lesson/glsl/textures";

const PAVER = pickTexture("mat:squarestackedpavertexture-grey:albedo", "checker");
const PAVER_N = pickTexture("mat:squarestackedpavertexture-grey:normal", "mat:clayceramicglossy:normal", "noise");
const PAVER_R = pickTexture("mat:squarestackedpavertexture-grey:roughness", "clouds");
const GRID = pickTexture("proto:orange:8", "checker");
// ── Texturing tricks ──────────────────────────────────────────────────────────
export const TEXTURE_PRESETS: PlaygroundPreset[] = [
  {
    id: "sampling", label: "nearest · bilinear · explicit LOD",
    channels: [GRID],
    note: "Left: texelFetch with integer coordinates (nearest, no filtering). Middle: texture(), bilinear + mipmaps picked by the hardware. Right: textureLod with a mip level you choose. Zoom out (small uZoom) to see aliasing on the left and mips on the right.",
    frag: `uniform float uZoom;   // @slider 0.05 4.0 0.3
uniform float uLod;    // @slider 0.0 8.0 2.0

void main() {
    vec2 uv  = gl_FragCoord.xy / uResolution.y / uZoom + vec2(uTime * 0.02, 0.0);
    vec2 sz  = vec2(textureSize(uTex0, 0));
    float x  = gl_FragCoord.x / uResolution.x;
    vec3 col;
    if (x < 0.333)      col = texelFetch(uTex0, ivec2(mod(floor(uv * sz), sz)), 0).rgb;  // nearest, by hand
    else if (x < 0.667) col = texture(uTex0, uv).rgb;                                     // automatic
    else                col = textureLod(uTex0, uv, uLod).rgb;                            // chosen mip
    float e = min(abs(x - 0.333), abs(x - 0.667)) * uResolution.x;
    FragColor = vec4(mix(vec3(0.0), col, smoothstep(0.0, 2.0, e)), 1.0);
}`,
  },
  {
    id: "distort", label: "heat haze / flowing distortion",
    channels: [PAVER, "clouds"],
    note: "A second texture (uTex1, smooth noise) is scrolled in two directions and used to offset the UV of the first. The same trick makes heat haze, underwater wobble, force fields and flowing lava.",
    frag: `uniform float uStrength;  // @slider 0.0 0.08 0.025
uniform float uSpeed;     // @slider 0.0 1.0 0.2

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.y;
    // two layers of noise moving in different directions never look like a simple scroll
    vec2 n1 = texture(uTex1, uv * 0.7 + vec2(uTime * uSpeed, 0.0)).rg;
    vec2 n2 = texture(uTex1, uv * 1.3 - vec2(0.0, uTime * uSpeed * 0.7)).rg;
    vec2 offset = (n1 + n2 - 1.0) * uStrength;
    // stronger at the bottom, like hot air rising from the ground
    offset *= smoothstep(0.9, 0.0, gl_FragCoord.y / uResolution.y);
    FragColor = vec4(texture(uTex0, uv + offset).rgb, 1.0);
}`,
  },
  {
    id: "triplanar", label: "triplanar mapping",
    mode: "mesh", mesh: "torus", channels: [PAVER],
    note: "No UVs: the texture is projected along X, Y and Z in world space and the three samples are blended by the normal. Seamless on any shape, which is why terrain and rocks use it. Toggle the weights to see which projection wins where.",
    frag: `uniform float uScale;   // @slider 0.2 4.0 1.3
uniform float uSharp;   // @slider 1.0 16.0 4.0
uniform float uWeights; // @toggle 0

void main() {
    vec3 N = normalize(vNormal);
    vec3 w = pow(abs(N), vec3(uSharp));
    w /= w.x + w.y + w.z;                                   // weights sum to 1

    vec3 p  = vWorld * uScale;
    vec3 cx = texture(uTex0, p.zy).rgb;                     // seen from ±X
    vec3 cy = texture(uTex0, p.xz).rgb;                     // seen from ±Y
    vec3 cz = texture(uTex0, p.xy).rgb;                     // seen from ±Z
    vec3 albedo = cx * w.x + cy * w.y + cz * w.z;
    if (uWeights > 0.5) albedo = w;

    float diff = max(dot(N, uLightDir), 0.0);
    FragColor = vec4(pow(albedo * (0.15 + 0.85 * diff), vec3(1.0 / 2.2)) * 1.3, 1.0);
}`,
  },
  {
    id: "normalmap", label: "normal + roughness maps",
    mode: "mesh", mesh: "sphere", channels: [PAVER, PAVER_N, PAVER_R],
    note: "Albedo (uTex0), tangent-space normal map (uTex1) and roughness (uTex2) from a real material set. The TBN matrix turns the map's normals into world space. Set strength to 0 to see how flat the geometry really is.",
    frag: `uniform float uStrength;  // @slider 0.0 2.0 1.0
uniform float uTiling;    // @slider 1.0 8.0 3.0

void main() {
    vec2 uv = vUV * vec2(2.0, 1.0) * uTiling;
    vec3 N = normalize(vNormal);
    vec3 T = normalize(vTangent - N * dot(vTangent, N));      // Gram-Schmidt
    vec3 B = cross(N, T);

    vec3 tn = texture(uTex1, uv).xyz * 2.0 - 1.0;             // [0,1] → [-1,1]
    tn.xy *= uStrength;
    vec3 n = normalize(mat3(T, B, N) * tn);

    float rough  = texture(uTex2, uv).r;
    vec3  albedo = pow(texture(uTex0, uv).rgb, vec3(2.2));    // sRGB → linear
    vec3  V = normalize(uCamPos - vWorld), H = normalize(uLightDir + V);
    float diff = max(dot(n, uLightDir), 0.0);
    float spec = pow(max(dot(n, H), 0.0), mix(256.0, 8.0, rough)) * (1.0 - rough) * 1.5;

    vec3 col = albedo * (0.06 + diff) + spec;
    FragColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`,
  },
];
