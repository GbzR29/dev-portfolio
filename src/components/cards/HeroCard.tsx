// components/cards/HeroCard.tsx
import { Card } from "@/components/ui/Card";
import Typewriter from "@/components/Typewriter";
import { MyButton } from "@/components/ui/Button";

export default function HeroCard() {
  return (
    <Card padding="2xl" className="space-y-6">
      <h1 className="text-3xl sm:text-5xl font-bold text-center">
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

      <div className="flex flex-col sm:flex-row gap-4 pt-2">
        <MyButton text="View projects" />
        <MyButton text="Contact" variant="outline" />
      </div>
    </Card>
  );
}