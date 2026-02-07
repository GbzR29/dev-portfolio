"use client";

import { useState } from "react";
import { Menu, X, Moon, Languages } from "lucide-react";
import Image from "next/image";
import { NavLinks } from "./NavLinks";
import { MobileMenu } from "./MobileMenu";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="w-full flex justify-between items-center px-8 lg:px-12 py-6">

        {/* logo */}
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="logo" width={42} height={42} />
          <span className="text-blue-400 font-semibold text-lg">
            gabrielfc.dev
          </span>
        </div>

        {/* desktop */}
        <div className="hidden lg:flex items-center gap-8">
          <NavLinks />

          <div className="flex gap-4 text-gray-400">
            <Moon className="cursor-pointer hover:text-blue-400" size={20} />
            <Languages className="cursor-pointer hover:text-blue-400" size={20} />
          </div>
        </div>

        {/* mobile button */}
        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden text-gray-300 z-50"
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </header>

      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}
