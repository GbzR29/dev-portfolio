"use client";

import Card from "@/components/ui/Card";
import { 
  SiCplusplus, SiC, SiSharp, SiPython, SiOpengl, 
  SiAssemblyscript, SiReact, SiTypescript, SiTailwindcss,
  SiUnity, SiUnrealengine, SiGodotengine, SiOpenjdk 
} from "react-icons/si";
import { Cpu, Gamepad2, Brain, Globe, Code2 } from "lucide-react";
import { zIndex } from "@/lib/z-index";

export default function StackCard() {
  const categories = [
    {
      title: "Systems & Low Level",
      icon: <Cpu size={18} className="text-emerald-400" />,
      skills: [
        { name: "C++", icon: SiCplusplus, color: "hover:text-blue-500" },
        { name: "C", icon: SiC, color: "hover:text-blue-400" },
        { name: "Assembly", icon: SiAssemblyscript, color: "hover:text-yellow-400" },
        { name: "C#", icon: SiSharp, color: "hover:text-purple-400" },
      ],
    },
    {
      title: "Web & Frontend",
      icon: <Globe size={18} className="text-blue-400" />,
      skills: [
        { name: "React", icon: SiReact, color: "hover:text-cyan-400" },
        { name: "TypeScript", icon: SiTypescript, color: "hover:text-blue-500" },
        { name: "Tailwind", icon: SiTailwindcss, color: "hover:text-sky-400" },
        { name: "Python", icon: SiPython, color: "hover:text-yellow-500" },
      ],
    },
    {
      title: "Game Engines",
      icon: <Gamepad2 size={18} className="text-red-400" />,
      skills: [
        { name: "Unity", icon: SiUnity, color: "hover:text-gray-300" },
        { name: "Unreal", icon: SiUnrealengine, color: "hover:text-blue-400" },
        { name: "Godot", icon: SiGodotengine, color: "hover:text-sky-400" },
        { name: "SFML", icon: Gamepad2, color: "hover:text-green-400" },
      ],
    },
    {
      title: "Graphics & Math",
      icon: <Brain size={18} className="text-purple-400" />,
      skills: [
        { name: "OpenGL", icon: SiOpengl, color: "hover:text-blue-300" },
        { name: "Java", icon: SiOpenjdk, color: "hover:text-red-500" },
        { name: "Linear Algebra", icon: Brain, color: "hover:text-pink-400" },
        { name: "Game Dev", icon: Gamepad2, color: "hover:text-orange-400" },
      ],
    },
  ];

  return (
    <Card 
      // Remove o maxWidth para permitir que o card expanda naturalmente
      padding="xl"
      hoverable={true}
      glow={true}
      className="overflow-hidden relative w-full"
      style={{ zIndex: zIndex.card }}
    >
      {/* Background Decorativo Sutil */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none" />
      
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Code2 className="text-blue-400" size={24} />
        </div>
        <h3 className="text-white font-bold text-2xl tracking-tight">
          Tech Stack
        </h3>
      </div>

      <div className="space-y-8">
        {categories.map((cat) => (
          <div key={cat.title} className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              {cat.icon}
              <span className="text-xs font-bold uppercase tracking-widest text-foreground/50">
                {cat.title}
              </span>
            </div>

            {/* Grid responsivo: 2 colunas no mobile, 4 colunas no desktop */}
            <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {cat.skills.map(({ name, icon: Icon, color }) => (
                <li
                  key={name}
                  className={`
                    group flex items-center gap-2.5
                    px-3 py-2 rounded-xl
                    bg-white/[0.03] border border-white/5
                    hover:bg-white/[0.08] hover:border-white/20
                    hover:shadow-lg hover:shadow-black/20
                    transition-all duration-300 ease-out
                    cursor-default
                    w-full
                  `}
                >
                  <Icon 
                    size={18} 
                    className={`transition-colors duration-300 text-foreground/60 ${color} flex-shrink-0`} 
                  />
                  <span className="text-sm font-medium text-foreground/80 group-hover:text-white transition-colors truncate">
                    {name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}