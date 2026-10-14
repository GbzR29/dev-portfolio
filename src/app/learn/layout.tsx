// app/learn/layout.tsx
// Metadata for /learn (the page itself is a client component). Track and
// lesson pages set their own.

import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Learn — free interactive courses: OpenGL, GLSL, Vulkan, C++, math, AI",
  description:
    "Free interactive courses in graphics programming and the math behind it: OpenGL, GLSL shaders, Vulkan, modern C++, SDL3, game dev, algorithms, AI and music. Every step explained, with live figures.",
};

export default function LearnLayout({ children }: { children: ReactNode }) {
  return children;
}
