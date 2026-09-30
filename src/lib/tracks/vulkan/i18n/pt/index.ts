// PT text for this track, loaded on demand by src/lib/i18n/lessons.ts.

import type { LessonText } from "@/lib/i18n/lessons";
import track from "./_track";
import devices from "./devices";
import instance from "./instance";
import swapchain from "./swapchain";
import whyVulkan from "./why-vulkan";

const bundle: LessonText = {
  strings: { ...devices, ...instance, ...swapchain, ...whyVulkan },
  titles: track.titles,
  sections: track.sections,
};

export default bundle;
