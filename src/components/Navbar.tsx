import { Moon, Languages } from "lucide-react";
import Image from "next/image";

export default function Navbar() {
  return (
    <header className="w-full flex justify-between items-center px-12 py-6">

      {/* LEFT */}
      <div className="flex items-center gap-3">
        <Image
          src="/logo.png"   // sua logo
          alt="logo"
          width={48}
          height={48}
        />
        <span className="text-blue-400 font-semibold text-lg">
          gabrielfc.dev
        </span>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-8">

        <nav className="flex gap-8 text-gray-300">
          <a href="#about" className="hover:text-blue-400">About me</a>
          <a href="#projects" className="hover:text-blue-400">Projects</a>
          <a href="#contact" className="hover:text-blue-400">Contact</a>
        </nav>

        {/* Icons */}
        <div className="flex gap-4 text-gray-400">
          <Moon className="cursor-pointer hover:text-blue-400" size={20} />
          <Languages className="cursor-pointer hover:text-blue-400" size={20} />
        </div>

      </div>
    </header>
  );
}
