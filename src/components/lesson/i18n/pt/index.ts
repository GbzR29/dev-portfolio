// PT widget text, loaded on demand by src/lib/i18n/lessons.ts.

import advgl from "./advgl";
import ai from "./ai";
import advlighting from "./advlighting";
import blackhole from "./blackhole";
import figures from "./figures";
import fog from "./fog";
import gamedev from "./gamedev";
import glass from "./glass";
import glintro from "./glintro";
import glsl from "./glsl";
import lighting from "./lighting";
import markov from "./markov";
import math from "./math";
import mathAlgebra from "./mathAlgebra";
import mathGeometry from "./mathGeometry";
import mathTrig from "./mathTrig";
import mathLinAlg from "./mathLinAlg";
import mathCalculus from "./mathCalculus";
import mathProbability from "./mathProbability";
import music from "./music";
import ocean from "./ocean";
import pbr from "./pbr";
import perf from "./perf";
import pool from "./pool";
import river from "./river";
import post from "./post";
import rt from "./rt";
import sky from "./sky";
import special from "./special";
import tech from "./tech";
import underwater from "./underwater";
import vulkan from "./vulkan";
import water from "./water";

const bundle: Record<string, string> = { ...advgl, ...ai,...advlighting, ...blackhole, ...figures, ...fog, ...gamedev, ...glass, ...glintro, ...glsl, ...lighting, ...markov, ...math, ...mathAlgebra, ...mathGeometry, ...mathTrig, ...mathLinAlg, ...mathCalculus, ...mathProbability, ...music, ...ocean, ...pbr, ...perf, ...pool, ...post, ...river, ...rt, ...sky, ...special, ...tech, ...underwater, ...vulkan, ...water };

export default bundle;
