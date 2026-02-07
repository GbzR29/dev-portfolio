"use client";

import { Moon, Languages } from "lucide-react";
import { NavLinks } from "./NavLinks";
import { useEffect } from "react";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {

  // trava scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);

  return (
    <>
      {/* overlay blur */}
      <div
        onClick={onClose}
        className={`
          fixed inset-0 z-40
          bg-black/40 backdrop-blur-2xl
          transition-opacity duration-300
          ${open ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
      />

      {/* wrapper (top aligned) */}
      <div className="fixed inset-0 z-50 flex justify-center pt-24 pointer-events-none">

        {/* card */}
        <div
          className={`
            pointer-events-auto
            flex flex-col items-center gap-10

            backdrop-blur-xl
            bg-[#0B1220]/60

            rounded-2xl
            border border-white/10
            shadow-2xl

            px-10 py-12
            w-[94%] max-w-lg

            transition-all duration-300 ease-out
            ${open ? "opacity-100 scale-100 translate-y-0"
                    : "opacity-0 scale-95 -translate-y-4"}
          `}
        >

          <NavLinks vertical onClick={onClose} />

          <div className="w-32 h-px bg-gray-700/60" />

          <div className="flex gap-8 text-gray-400">
            <Moon size={24} className="hover:text-blue-400 cursor-pointer" />
            <Languages size={24} className="hover:text-blue-400 cursor-pointer" />
          </div>

        </div>
      </div>
    </>
  );
}
