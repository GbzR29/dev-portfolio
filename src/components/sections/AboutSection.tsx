// components/sections/AboutSection.tsx
"use client";

import { useState } from "react";
import StackCard from "@/components/cards/StackCard";
import ReadMoreButton from "@/components/ui/ReadMoreButton";

export default function AboutSection() {
  const [open, setOpen] = useState(false);

  return (
    <section
      id="about"
      className="
        w-full
        py-24
        px-6 sm:px-10 lg:px-20
        border-t border-white/5
        flex flex-col justify-center
        lg:min-h-screen lg:flex-row lg:items-center
      "
    >
      <div className="
        w-full max-w-7xl mx-auto
        flex flex-col lg:flex-row 
        lg:items-center
        justify-between 
        gap-16 lg:gap-12
      ">
        
        {/* LADO ESQUERDO: Texto */}
        <div className="w-full lg:max-w-xl space-y-8">
          <h2 className="text-4xl font-bold">About me</h2>

          <div className="relative">
            <div
              className={`
                space-y-10 text-[var(--text-muted)] leading-relaxed
                overflow-hidden transition-all duration-500
                ${open ? "max-h-[1000px]" : "max-h-[140px]"}
              `}
            >
              <p>
                My interest in programming began in 2015 because I was captivated by the mechanics of interactive systems. 
                I was never just interested in using software. I wanted to understand the intersection of logic and performance
                that makes a digital experience feel seamless.
              </p>

              <p>
                Since making a full commitment to software and game development in 2023, I have focused on building a solid foundation in C++
                and computer graphics. I use my personal projects as a way to explore complex areas like low level development. Working with 
                OpenGL and SDL2 has been a rewarding way for me to practice system design and performance optimization.
              </p>

              <p>
                These projects are where I go to satisfy my technical curiosity
                and challenge myself with problems from the ground up.
              </p>
            </div>

            {/* Fade out effect */}
            {!open && (
              <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-[var(--background)] to-transparent pointer-events-none" />
            )}
          </div>

          <div className="pt-2">
            <ReadMoreButton
              open={open}
              onToggle={() => setOpen(!open)}
            />
          </div>
        </div>

        {/* LADO DIREITO: Card */}
        <div className="
          w-full max-w-sm
          flex justify-center lg:justify-end
          lg:ml-4
        ">
          <StackCard />
        </div>
      </div>
    </section>
  );
}