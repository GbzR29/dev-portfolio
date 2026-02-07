import Navbar from "@/components/Navbar";
import HeroContent from "@/components/HeroContent";
import HeroAvatar from "@/components/HeroAvatar";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0B1220] text-white flex flex-col">

      <Navbar />

      <section className="flex flex-1 items-center justify-between px-20">
        <HeroContent />
        <HeroAvatar />
      </section>

    </main>
  );
}
