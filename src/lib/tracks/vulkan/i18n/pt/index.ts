// PT text for this track, loaded on demand by src/lib/i18n/lessons.ts.

import type { LessonText } from "@/lib/i18n/lessons";
import track from "./_track";
import commands from "./commands";
import devices from "./devices";
import instance from "./instance";
import pipeline from "./pipeline";
import swapchain from "./swapchain";
import synchronization from "./synchronization";
import whyVulkan from "./why-vulkan";

const bundle: LessonText = {
  strings: { ...commands, ...devices, ...instance, ...pipeline, ...swapchain, ...synchronization, ...whyVulkan },
  titles: track.titles,
  sections: track.sections,
};

export default bundle;
