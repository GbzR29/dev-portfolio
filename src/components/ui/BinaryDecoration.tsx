import Typewriter from "@/components/Typewriter";
import { useLanguage } from "@/components/providers/LanguageProvider";
import GlitchEffect from "../effects/GlitchEffect";

export default function BinaryDecoration({text} : {text: string}) {

  const { t } = useLanguage();

  return (

    

    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
      <div className="absolute top-10 left-10 font-mono text-[10px] text-[var(--primary)] select-none">
        <GlitchEffect text = {text}/>    
      </div>
    </div>
  );
}
