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
        relative
        w-full
        py-24
        px-6 sm:px-10 lg:px-20
        border-t border-white/5
        /* No mobile, removemos min-h-screen e items-center para evitar bugs de scroll/clique */
        flex flex-col justify-center
        lg:min-h-screen lg:flex-row lg:items-center
      "
    >
      <div className="
        w-full max-w-7xl mx-auto
        flex flex-col lg:flex-row 
        items-center lg:items-start 
        justify-between 
        gap-16 lg:gap-12
        isolation-isolate
      ">
        
        {/* LADO ESQUERDO: Texto */}
        <div className="w-full lg:max-w-xl space-y-8 relative z-50 order-1">
          <h2 className="text-4xl font-bold">
            About me
          </h2>

          <div className="relative group">
            <div
              className={`
                space-y-10 text-gray-400 leading-relaxed
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

            {/* fade while closing */}
            {!open && (
              <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-[#0E1628] to-transparent pointer-events-none" />
            )}
          </div>

          {/* Wrapper do botão com pointer-events garantido */}
          <div className="relative z-50 pt-2 pointer-events-auto">
            <ReadMoreButton
              open={open}
              onToggle={() => setOpen(!open)}
            />
          </div>
        </div>

        {/* LADO DIREITO: Card */}
        {/* z-0 e order-2 garante que fique visualmente depois e "abaixo" na pilha de camadas */}
        <div className="
          relative z-0 order-2 
          w-full flex justify-center lg:justify-end
          mt-4 lg:mt-0
          pointer-events-none /* Desabilita cliques na área VAZIA ao redor do card */
        ">
          {/* Reabilitamos cliques apenas no card em si */}
          <div className="pointer-events-auto">
            <StackCard />
          </div>
        </div>

      </div>
    </section>
  );
}