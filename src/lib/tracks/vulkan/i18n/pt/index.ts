// PT text for this track, loaded on demand by src/lib/i18n/lessons.ts.

import type { LessonText } from "@/lib/i18n/lessons";
import track from "./_track";
import buffersMemory from "./buffers-memory";
import commands from "./commands";
import descriptors from "./descriptors";
import devices from "./devices";
import instance from "./instance";
import pipeline from "./pipeline";
import staging from "./staging";
import swapchain from "./swapchain";
import synchronization from "./synchronization";
import whyVulkan from "./why-vulkan";

const bundle: LessonText = {
  strings: { ...buffersMemory, ...commands, ...descriptors, ...devices, ...instance, ...pipeline, ...staging, ...swapchain, ...synchronization, ...whyVulkan },
  titles: track.titles,
  sections: track.sections,
};

export default bundle;
