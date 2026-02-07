"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import StackCard from "@/components/cards/StackCard";



export default function AboutSection() {
  const [open, setOpen] = useState(false);

  return (
    <section
      id="about"
      className="
        min-h-screen flex items-center
        px-6 sm:px-10 lg:px-20
        py-24
        border-t border-white/5
      "
    >
      <div className="flex flex-1 items-center justify-between gap-24 px-25 max-lg:flex-col-reverse max-lg:justify-center max-lg:gap-12 max-lg:px-6 max-lg:py-12">

        {/* text */}
        <div className="flex-1 max-w-2xl space-y-8">

          <h2 className="text-4xl font-bold">
            About me
          </h2>

          {/* collapsible block */}
          <div className="relative">

            <div
              className={`
                space-y-10 text-gray-400 leading-relaxed
                overflow-hidden transition-all duration-500
                ${open ? "max-h-[600px]" : "max-h-[140px]"}
              `}
            >
              <p>
                My interest in programming began in 2015 because I was captivated by the mechanics of interactive systems. 
                I was never just interested in using software. I wanted to understand the intersection of logic and performance
                that makes a digital experience feel seamless.
              </p>

              <p>
                ​Since making a full commitment to software and game development in 2023, I have focused on building a solid foundation in C++
                and computer graphics. I use my personal projects as a way to explore complex areas like low level development. Working with 
                OpenGL and SDL2 has been a rewarding way for me to practice system design and performance optimization.
                These projects are where I go to satisfy my technical curiosity and challenge myself with problems from the ground up
              </p>

              <p>
                These projects are where I go to satisfy my technical curiosity
                and challenge myself with problems from the ground up.
              </p>
            </div>

            {/* fade while closing */}
            {!open && (
              <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-[#0E1628] to-transparent pointer-events-none" />
            )}
          </div>

          {/* button */}
          <button
            onClick={() => setOpen(!open)}
            className="
              flex items-center gap-2
              text-blue-400
              hover:text-blue-300
              transition font-medium
            "
          >
            {open ? "Read less" : "Read more"}

            <ChevronDown
              size={18}
              className={`transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
        </div>


        {/* card stack */}
        <StackCard />

      </div>
    </section>
  );
}
