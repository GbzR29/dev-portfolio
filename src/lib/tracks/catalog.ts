// src/lib/tracks/catalog.ts
// The single list of learning tracks: identity, route and presentation data.
// Plain data only — no chapter content is imported here.
//
// To add a track: add an entry here, then register its chapters in ./index.ts
// (tracks without chapters show up as "coming soon" on /learn).

export type TrackStatus = "available" | "coming-soon";

export interface TrackInfo {
  id: string;
  /** The /learn/[trackPath] route segment. Changing it breaks existing URLs. */
  path: string;
  title: string;
  accentColor: string;
  status: TrackStatus;
  /** Shown on the /learn card only while the track has no chapters yet. */
  plannedLessons: number;
  /** Translation keys (learning bundle) for the card, with an English fallback. */
  levelKey: string;
  levelFallback?: string;
  descKey: string;
  descFallback?: string;
}

export const TRACK_CATALOG: TrackInfo[] = [
  {
    id: "cpp", path: "C++", title: "Modern C++", accentColor: "#3b82f6", status: "available", plannedLessons: 15,
    levelKey: "begAdv", descKey: "trackCppDesc",
  },
  {
    id: "opengl", path: "OpenGL", title: "OpenGL 4.6", accentColor: "#8b5cf6", status: "available", plannedLessons: 13,
    levelKey: "intermediate", descKey: "trackOpenglDesc",
  },
  {
    id: "glsl", path: "GLSL", title: "GLSL Shaders", accentColor: "#EC4899", status: "available", plannedLessons: 6,
    levelKey: "intermediate", levelFallback: "Intermediate",
    descKey: "trackGlslDesc", descFallback: "Master GLSL types, built-in functions, SDFs, procedural noise and shader techniques — from first principles to a production-ready Shader class.",
  },
  {
    id: "sdl3", path: "SDL3", title: "SDL3 Framework", accentColor: "#22c55e", status: "available", plannedLessons: 10,
    levelKey: "beginner", descKey: "trackSdlDesc",
  },
  {
    id: "gamedev", path: "GameDev", title: "Game Development", accentColor: "#f97316", status: "available", plannedLessons: 8,
    levelKey: "begAdv", levelFallback: "Beginner → Advanced",
    descKey: "trackGameDevDesc", descFallback: "Game loops and fixed timesteps, easing and springs, randomness and Perlin noise, collision detection and the patterns behind fast game code — with interactive figures.",
  },
  {
    id: "math", path: "Math", title: "Math for Graphics", accentColor: "#14b8a6", status: "available", plannedLessons: 7,
    levelKey: "begAdv", levelFallback: "Beginner → Advanced",
    descKey: "trackMathDesc", descFallback: "Mathematics from the ground up: arithmetic, algebra, geometry, trigonometry, linear algebra and calculus, worked by hand — every formula explained, every idea interactive.",
  },
  {
    id: "vulkan", path: "Vulkan", title: "Vulkan API", accentColor: "#ef4444", status: "coming-soon", plannedLessons: 12,
    levelKey: "advanced", descKey: "trackVulkanDesc",
  },
];
