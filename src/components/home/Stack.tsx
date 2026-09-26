"use client";

// ── Tools ───────────────────────────────────────────────────────────────────
// Quiet grouped lists: icons stay muted and take the brand colour on hover.

import type { ComponentType } from "react";
import {
  SiCplusplus, SiC, SiPython, SiOpenjdk,
  SiOpengl, SiVulkan,
  SiUnity, SiUnrealengine, SiGodotengine,
  SiReact, SiNextdotjs, SiTypescript, SiTailwindcss,
} from "react-icons/si";
import { AppWindow, Code2, Layers } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface Tool {
  name: string;
  icon: ComponentType<{ className?: string }>;
  /** Brand colour shown on hover; omitted for monochrome brands. */
  brand?: string;
  learning?: boolean;
}

type GroupKey = "stackLanguages" | "stackGraphics" | "stackEngines" | "stackWeb";

const GROUPS: { key: GroupKey; tools: Tool[] }[] = [
  {
    key: "stackLanguages",
    tools: [
      { name: "C++", icon: SiCplusplus, brand: "#00599C" },
      { name: "C", icon: SiC, brand: "#A8B9CC" },
      { name: "Java", icon: SiOpenjdk, brand: "#ED8B00" },
      { name: "Python", icon: SiPython, brand: "#3776AB" },
    ],
  },
  {
    key: "stackGraphics",
    tools: [
      { name: "OpenGL", icon: SiOpengl, brand: "#5586A4" },
      { name: "GLSL", icon: Code2 },
      { name: "Vulkan", icon: SiVulkan, brand: "#AC162C", learning: true },
    ],
  },
  {
    key: "stackEngines",
    tools: [
      { name: "Unity", icon: SiUnity },
      { name: "Unreal", icon: SiUnrealengine, brand: "#5E8CE0" },
      { name: "Godot", icon: SiGodotengine, brand: "#478CBF" },
      { name: "SFML", icon: Layers, brand: "#8CC445" },
      { name: "SDL3", icon: AppWindow, brand: "#1F5FA8" },
    ],
  },
  {
    key: "stackWeb",
    tools: [
      { name: "React", icon: SiReact, brand: "#61DAFB" },
      { name: "Next.js", icon: SiNextdotjs },
      { name: "TypeScript", icon: SiTypescript, brand: "#3178C6" },
      { name: "Tailwind", icon: SiTailwindcss, brand: "#06B6D4" },
    ],
  },
];

export default function Stack() {
  const { t } = useLanguage();

  return (
    <section className="hm-sec">
      <h2>{t.stackTitle}</h2>
      <div className="hm-stack">
        {GROUPS.map((g) => (
          <div key={g.key} className="hm-group">
            <h3>{t[g.key]}</h3>
            <ul>
              {g.tools.map(({ name, icon: Icon, brand, learning }) => (
                <li key={name} style={brand ? ({ "--brand": brand } as React.CSSProperties) : undefined}>
                  <Icon aria-hidden="true" />
                  {name}
                  {learning && <span className="hm-tag">{t.stackLearning}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
