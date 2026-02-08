// components/cards/ProjectCard.tsx

"use client";

import { SiGithub } from "react-icons/si";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { zIndex } from "@/lib/z-index";

type Props = {
  title: string;
  description: string;
  github: string;
};

export default function ProjectCard({ title, description, github }: Props) {
  // Remove espaços extras da URL (muito comum em cópias de links)
  const cleanGithubUrl = github.trim();

  return (
    <Link
      href={cleanGithubUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <Card 
        padding="xl" 
        className="flex justify-between items-center hover:-translate-y-1 transition-transform duration-300"
        style={{ zIndex: zIndex.card }}
      >
        <div className="space-y-2 pr-6">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-gray-400 text-sm leading-relaxed max-w-md">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-2 text-blue-400 opacity-70 group-hover:opacity-100 transition-opacity">
          <SiGithub size={20} />
          <span className="text-sm font-medium">GitHub</span>
        </div>
      </Card>
    </Link>
  );
}