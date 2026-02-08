"use client";

import { ChevronDown } from "lucide-react";
import { zIndex } from "@/lib/z-index";

type Props = {
  open: boolean;
  onToggle: () => void;
};

export default function ReadMoreButton({ open, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      className="
        flex
        flex-col lg:flex-row     
        items-center lg:items-center
        justify-center lg:justify-start

        gap-2

        w-full lg:w-auto        
        text-center lg:text-left

        text-blue-400 hover:text-blue-300
        font-semibold text-lg lg:text-base

        transition
        hover:scale-105 active:scale-95
        select-none
      "
      style={{ zIndex: zIndex.card }}
    >
      <span>
        {open ? "Read less" : "Read more"}
      </span>

      <ChevronDown
        size={20}
        className={`
          transition-transform duration-300
          ${open ? "rotate-180" : ""}
        `}
      />
    </button>
  );
}