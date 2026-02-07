import HeroImage from "@/components/HeroImage";
import Typewriter from "@/components/Typewriter";
import { MyButton } from "@/components/Button";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0B1220] text-white flex flex-col">

      {/* NAVBAR */}
      <header className="w-full flex justify-between items-center px-12 py-6">

        

        <h1 className="text-xl font-semibold text-blue-400">
          gabrielfc.dev
        </h1>

        <nav className="flex gap-8 text-gray-300">
          <a href="#about" className="hover:text-blue-400 transition">About me</a>
          <a href="#projects" className="hover:text-blue-400 transition">Projects</a>
          <a href="#contact" className="hover:text-blue-400 transition">Contact</a>
        </nav>
      </header>


      {/* HERO */}
      <section className="flex flex-1 items-center justify-between px-20">

        {/* LEFT SIDE */}
        <div className="max-w-xl space-y-6">

          <h1 className="text-6xl font-bold">
            <Typewriter
              text="Gabriel Carvalho"
              speed={80}
              loop={true}
              pauseDuration={1500}
            />
          </h1>

          <p className="text-blue-400 text-lg font-medium">
            Engine Programmer • Game Developer • Fullstack
          </p>

          <p className="text-gray-400 max-w-md">
            I build systems from scratch. Engines, games and tools that actually work.
          </p>

          <div className="flex gap-4 pt-4">
            <MyButton text="View projects" />
            <MyButton text="Contact"/>
          </div>

        </div>

        <div className="relative w-[300px] h-[300px]">
          {/* glow layer */}
          <div className="
            absolute inset-0
            rounded-full
            bg-blue-500/40
            blur-3xl
            -z-10
          "/>

          {/* imagem */}
          <div className="rounded-full overflow-hidden">
            <HeroImage
              path="/perfil.jpeg"
              alt="Gabriel profile picture"
              width={300}
              height={300}
              fill={false}
            />
          </div>
        </div>


      </section>
    </main>
  );
}
