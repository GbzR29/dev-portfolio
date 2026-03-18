// components/cards/StackCard.tsx
"use client";

import Card from "@/components/ui/Card";
import {
  SiCplusplus,
  SiC,
  SiPython,
  SiOpengl,
  SiReact,
  SiTypescript,
  SiTailwindcss,
  SiUnity,
  SiUnrealengine,
  SiGodotengine,
  SiOpenjdk,
  SiVulkan,
  SiNextdotjs,
} from "react-icons/si";
import {
  Cpu,
  Gamepad2,
  Globe,
  Code2,
  Layers,
  TriangleRight,
} from "lucide-react";
import { zIndex } from "@/lib/z-index";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Skill {
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  /** "learning" = mostra badge sutil de "studying" */
  learning?: boolean;
}

interface Category {
  title: string;
  icon: React.ReactNode;
  skills: Skill[];
}

// ─── Data ──────────────────────────────────────────────────────────────────────
// Reorganizado de forma honesta: categorias coerentes, sem misturar
// "Game Dev" genérico ou Java em "Graphics & Math".

const CATEGORIES: Category[] = [
  {
    title: "Systems & Low Level",
    icon: <Cpu size={16} className="text-emerald-400" />,
    skills: [
      { name: "C++",      icon: SiCplusplus,     color: "hover:text-blue-400" },
      { name: "C",        icon: SiC,             color: "hover:text-blue-300" },
      { name: "Java",     icon: SiOpenjdk,       color: "hover:text-red-400" },
      { name: "Python",   icon: SiPython,        color: "hover:text-yellow-400" },
    ],
  },
  {
    title: "Graphics & Rendering",
    icon: <TriangleRight size={16} className="text-purple-400" />,
    skills: [
      { name: "OpenGL",   icon: SiOpengl,        color: "hover:text-blue-300" },
      { name: "GLSL",     icon: Code2,           color: "hover:text-green-400" },
      { name: "Vulkan",   icon: SiVulkan,        color: "hover:text-red-400",   learning: true },
    ],
  },
  {
    title: "Game Engines",
    icon: <Gamepad2 size={16} className="text-red-400" />,
    skills: [
      { name: "Unity",    icon: SiUnity,         color: "hover:text-gray-300" },
      { name: "Unreal",   icon: SiUnrealengine,  color: "hover:text-blue-400" },
      { name: "Godot",    icon: SiGodotengine,   color: "hover:text-sky-400" },
      { name: "SFML",     icon: Layers,          color: "hover:text-green-400" },
    ],
  },
  {
    title: "Web & Frontend",
    icon: <Globe size={16} className="text-blue-400" />,
    skills: [
      { name: "React",       icon: SiReact,      color: "hover:text-cyan-400" },
      { name: "Next.js",     icon: SiNextdotjs,  color: "hover:text-white" },
      { name: "TypeScript",  icon: SiTypescript, color: "hover:text-blue-500" },
      { name: "Tailwind",    icon: SiTailwindcss,color: "hover:text-sky-400" },
    ],
  },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export default function StackCard() {
  return (
    <Card
      padding="xl"
      hoverable
      glow
      className="overflow-hidden relative w-full"
      style={{ zIndex: zIndex.card }}
    >
      {/* Ambient glow decoration */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Code2 className="text-blue-400" size={22} />
        </div>
        <div>
          <h3 className="text-white font-bold text-xl tracking-tight">
            Tech Stack
          </h3>
          <p className="text-[var(--text-muted)] text-xs mt-0.5">
            Tools I use and study
          </p>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-7">
        {CATEGORIES.map((cat) => (
          <div key={cat.title}>
            {/* Category header */}
            <div className="flex items-center gap-2 mb-3 px-1">
              {cat.icon}
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                {cat.title}
              </span>
            </div>

            {/* Skills grid */}
            <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {cat.skills.map(({ name, icon: Icon, color, learning }) => (
                <li
                  key={name}
                  className={`
                    group relative flex items-center gap-2.5
                    px-3 py-2 rounded-xl
                    bg-white/[0.03] border border-white/5
                    hover:bg-white/[0.07] hover:border-white/15
                    transition-all duration-300 cursor-default
                  `}
                >
                  <Icon
                    size={17}
                    className={`transition-colors duration-300 text-[var(--text-muted)] ${color} flex-shrink-0`}
                  />
                  <span className="text-sm font-medium text-[var(--text-muted)] group-hover:text-white transition-colors truncate leading-none">
                    {name}
                  </span>

                  {/* "Studying" badge for skills currently being learned */}
                  {learning && (
                    <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 leading-none">
                      WIP
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}