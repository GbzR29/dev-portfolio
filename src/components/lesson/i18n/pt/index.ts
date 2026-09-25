// PT widget text, loaded on demand by src/lib/i18n/lessons.ts.

import advgl from "./advgl";
import advlighting from "./advlighting";
import figures from "./figures";
import fog from "./fog";
import gamedev from "./gamedev";
import glass from "./glass";
import glsl from "./glsl";
import lighting from "./lighting";
import math from "./math";
import pbr from "./pbr";
import perf from "./perf";
import post from "./post";
import rt from "./rt";
import sky from "./sky";
import special from "./special";
import tech from "./tech";
import water from "./water";

const bundle: Record<string, string> = { ...advgl, ...advlighting, ...figures, ...fog, ...gamedev, ...glass, ...glsl, ...lighting, ...math, ...pbr, ...perf, ...post, ...rt, ...sky, ...special, ...tech, ...water };

export default bundle;
