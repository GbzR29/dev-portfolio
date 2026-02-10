"use client";

import HeroAvatar from "@/components/HeroAvatar";
import HeroCard from "@/components/cards/HeroCard";
import { zIndex } from "@/lib/z-index";

export default function HeroSection() {
  return (
    <section 
      className="min-h-screen flex items-center px-6 sm:px-10 lg:px-20 pt-28 pb-12 lg:py-24"
    >
      <div className="
        w-full max-w-7xl mx-auto        
        flex flex-col-reverse lg:flex-row 
        items-center justify-center     
        gap-12 lg:gap-12               
        isolation-isolate
      ">
        
        
        <div 
          className="w-full lg:flex-1 flex justify-center lg:justify-start relative" 
          style={{ zIndex: zIndex.content }}
        >
          <HeroCard />
        </div>
        
        <div className="w-full lg:flex-1 flex justify-center lg:justify-end">
          <HeroAvatar />
        </div>
      </div>
    </section>
  );
}