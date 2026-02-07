"use client";

import { SiGithub } from "react-icons/si";

type Props = {
  title: string;
  description: string;
  github: string;
};

export default function ProjectCard({ title, description, github }: Props) {
  return (
    <a
      href={github}
      target="_blank"
      className="
        group
        flex justify-between items-center
        p-7
        rounded-2xl
        bg-[#0B1220]/70
        backdrop-blur-xl
        border border-white/10
        hover:border-blue-400/30
        hover:-translate-y-1
        transition-all
      "
    >
      <div className="space-y-2 pr-6">
        <h3 className="text-lg font-semibold text-white">
          {title}
        </h3>

        <p className="text-gray-400 text-sm leading-relaxed max-w-md">
          {description}
        </p>
      </div>

      <div
        className="
          flex items-center gap-2
          text-blue-400
          opacity-70
          group-hover:opacity-100
          transition
        "
      >
        <SiGithub size={20} />
        <span className="text-sm font-medium">GitHub</span>
      </div>
    </a>
  );
}
