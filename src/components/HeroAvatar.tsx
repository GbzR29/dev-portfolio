import HeroImage from "@/components/HeroImage";

export default function HeroAvatar() {
  return (
    <div className="relative w-[300px] h-[300px]">

      {/* glow */}
      <div className="absolute inset-0 rounded-full blur-3xl bg-blue-500/30" />

      {/* image */}
      <div className="relative rounded-full overflow-hidden">
        <HeroImage
          path="/perfil.jpeg"
          alt="Gabriel profile picture"
          width={300}
          height={300}
          fill={false}
        />
      </div>

    </div>
  );
}
