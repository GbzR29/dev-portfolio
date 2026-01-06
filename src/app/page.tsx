import Image from "next/image";
import HeroImage from "@/components/HeroImage";
import Typewriter from "@/components/Typewriter";
import { MyButton } from "@/components/Button";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gray-700">
      <div className="w-[300px] h-[300px]">
        <HeroImage
          path="/perfil.jpeg"
          alt="fotinha bala do dev"
          width={300}
          height={300}
          fill={false}
        />
      </div>

      <h1 className="text-5xl font-kanit text-white">
        <Typewriter text="Gabriel Carvalho" speed={100} loop={true} pauseDuration={1000} />
      </h1>
      <h1 className="text-white">
        Fullstack developer | Graphic Designer | Game Developer
      </h1>

      <MyButton text="Contact-me"/>
      
    </main>
  );
}