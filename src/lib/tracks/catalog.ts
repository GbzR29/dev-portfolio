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
    id: "math", path: "Math", title: "Math", accentColor: "#14b8a6", status: "available", plannedLessons: 7,
    levelKey: "begAdv", levelFallback: "Beginner → Advanced",
    descKey: "trackMathDesc", descFallback: "Mathematics from the ground up: arithmetic, algebra, geometry, trigonometry, linear algebra and calculus, worked by hand — every formula explained, every idea interactive.",
  },
  {
    id: "algorithms", path: "Algorithms", title: "Algorithms & Data Structures", accentColor: "#ca8a04", status: "available", plannedLessons: 24,
    levelKey: "begAdv", levelFallback: "Beginner → Advanced",
    descKey: "trackAlgoDesc", descFallback: "Algorithms and data structures built from scratch in C++: memory and Big-O, recursion, sorting and searching, lists, hash tables, trees, heaps and graphs — every step traced in an interactive figure.",
  },
  {
    id: "vulkan", path: "Vulkan", title: "Vulkan 1.3", accentColor: "#ef4444", status: "available", plannedLessons: 16,
    levelKey: "advanced", descKey: "trackVulkanDesc",
  },
  {
    id: "ai", path: "AI", title: "Artificial Intelligence", accentColor: "#6366f1", status: "available", plannedLessons: 24,
    levelKey: "begAdv", levelFallback: "Beginner → Advanced",
    descKey: "trackAiDesc", descFallback: "Artificial intelligence from scratch in C++: data and features, regression and gradient descent, classic machine learning, neural networks and backpropagation, deep learning, reinforcement learning and game AI — every formula derived, every model trained by hand.",
  },
  {
    id: "physics", path: "Physics", title: "Physics", accentColor: "#0ea5e9", status: "coming-soon", plannedLessons: 24,
    levelKey: "begAdv", levelFallback: "Beginner → Advanced",
    descKey: "trackPhysicsDesc", descFallback: "Physics from the ground up: motion, forces, energy and momentum, rotation, gravity and orbits, oscillations and waves, then fluids, heat, light and electromagnetism — every law derived, every idea simulated.",
  },
  {
    id: "chemistry", path: "Chemistry", title: "Chemistry", accentColor: "#84cc16", status: "coming-soon", plannedLessons: 20,
    levelKey: "begAdv", levelFallback: "Beginner → Advanced",
    descKey: "trackChemistryDesc", descFallback: "Chemistry from the ground up: atoms and the periodic table, bonds and molecules, moles and reactions, gases and solutions, energy and reaction rates, equilibrium, acids and bases — every formula explained, every idea interactive.",
  },
  {
    id: "music", path: "Music", title: "Music", accentColor: "#f43f5e", status: "coming-soon", plannedLessons: 20,
    levelKey: "begAdv", levelFallback: "Beginner → Advanced",
    descKey: "trackMusicDesc", descFallback: "Music from the ground up: sound and pitch, rhythm and meter, notes and the staff, intervals and scales, chords and harmony, keys and progressions, melody and form — every idea heard, every rule explained.",
  },
];
