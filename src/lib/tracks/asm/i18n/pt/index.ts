// PT text for this track, loaded on demand by src/lib/i18n/lessons.ts.

import type { LessonText } from "@/lib/i18n/lessons";
import track from "./_track";
import arithmeticFlags from "./arithmetic-flags";
import callingConvention from "./calling-convention";
import firstProgram from "./first-program";
import movAddressing from "./mov-addressing";
import jumpsLoops from "./jumps-loops";
import registers from "./registers";
import stackCalls from "./stack-calls";
import whatIsAssembly from "./what-is-assembly";
import readingCompilerOutput from "./reading-compiler-output";
import arraysStructs from "./arrays-structs";
import floatingPoint from "./floating-point";
import pointersAndMemory from "./pointers-and-memory";
import simd from "./simd";
import cpuPipeline from "./cpu-pipeline";
import arm64 from "./arm64";
import inlineAsm from "./inline-asm";

const bundle: LessonText = {
  strings: { ...whatIsAssembly, ...registers, ...firstProgram, ...movAddressing,
    ...arithmeticFlags, ...jumpsLoops, ...stackCalls, ...callingConvention,
    ...readingCompilerOutput, ...arraysStructs, ...floatingPoint, ...pointersAndMemory,
    ...simd, ...cpuPipeline, ...arm64, ...inlineAsm },
  titles: track.titles,
  sections: track.sections,
};

export default bundle;
