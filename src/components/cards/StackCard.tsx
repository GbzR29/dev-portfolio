// components/cards/StackCard.tsx
import { Card } from "@/components/ui/Card";
import {
  SiCplusplus,
  SiC,
  SiSharp,
  SiPython,
  SiOpengl,
  SiAssemblyscript,
} from "react-icons/si";
import { Cpu, Gamepad2, Brain } from "lucide-react";

export default function StackCard() {
  const stack = [
    { name: "C++", icon: SiCplusplus },
    { name: "C", icon: SiC },
    { name: "C#", icon: SiSharp },
    { name: "Python", icon: SiPython },
    { name: "OpenGL", icon: SiOpengl },
    { name: "SFML", icon: Gamepad2 },
    { name: "Game Dev", icon: Gamepad2 },
    { name: "Linear Algebra", icon: Brain },
    { name: "Systems", icon: Cpu },
    { name: "Assembly", icon: SiAssemblyscript },
  ];

  return (
    <Card maxWidth="sm">
      <h3 className="text-blue-400 font-semibold mb-6 text-2xl">
        My Skills
      </h3>

      <ul className="flex flex-wrap gap-3">
        {stack.map(({ name, icon: Icon }) => (
          <li
            key={name}
            className="
              flex items-center gap-2
              px-3 py-1.5
              rounded-lg
              bg-white/5
              border border-white/10
              text-base text-gray-300

              hover:bg-blue-500/10
              hover:border-blue-400/40
              hover:scale-105

              transition-all duration-200
              cursor-default
            "
          >
            <Icon size={16} className="text-blue-400 opacity-90" />
            {name}
          </li>
        ))}
      </ul>
    </Card>
  );
}