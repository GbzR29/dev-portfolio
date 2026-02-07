import Typewriter from "@/components/Typewriter";
import { MyButton } from "@/components/ui/Button";

export default function HeroContent() {
  return (
    <div className="
      bg-white/5
      backdrop-blur-md
      border border-white/10
      rounded-2xl
      p-10
      space-y-6
      shadow-xl
    ">

      <h1 className="text-5xl font-bold">
        <Typewriter
          text="Gabriel Carvalho"
          speed={80}
          loop
          pauseDuration={1500}
        />
      </h1>

      <p className="text-blue-400 font-medium">
        Engine Programmer • Game Developer • Fullstack
      </p>

      <p className="text-gray-400 max-w-md">
        I build systems from scratch. Engines, games and tools that actually work.
      </p>

      <div className="flex gap-4 pt-2">
        <MyButton text="View projects" />
        <MyButton text="Contact" variant="outline" />
      </div>
    </div>
  );
}
