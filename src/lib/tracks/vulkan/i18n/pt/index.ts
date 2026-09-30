// PT text for this track, loaded on demand by src/lib/i18n/lessons.ts.

import type { LessonText } from "@/lib/i18n/lessons";
import track from "./_track";
import buffersMemory from "./buffers-memory";
import commands from "./commands";
import compute from "./compute";
import depth from "./depth";
import descriptors from "./descriptors";
import devices from "./devices";
import framesInFlight from "./frames-in-flight";
import instance from "./instance";
import mipmapsMsaa from "./mipmaps-msaa";
import modern from "./modern";
import pipeline from "./pipeline";
import staging from "./staging";
import swapchain from "./swapchain";
import synchronization from "./synchronization";
import textures from "./textures";
import whyVulkan from "./why-vulkan";

const bundle: LessonText = {
  strings: { ...buffersMemory, ...commands, ...compute, ...depth, ...descriptors, ...devices, ...framesInFlight, ...instance, ...mipmapsMsaa, ...modern, ...pipeline, ...staging, ...swapchain, ...synchronization, ...textures, ...whyVulkan },
  titles: track.titles,
  sections: track.sections,
};

export default bundle;
