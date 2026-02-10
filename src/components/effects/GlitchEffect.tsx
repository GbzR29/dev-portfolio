
export default function GlitchEffect({ text } : {text: string}){
    
    return(
        
        <div>
            {/* Camada Principal Branca */}
            <span className="relative glitch-base text-white">
                {text}
            </span>
            {/* Camada Cyan */}
            <span className="absolute inset-0 glitch-cyan opacity-90 select-none" aria-hidden="true">
                {text}
            </span>

            {/* Camada Vermelha */}
            <span className="absolute inset-0 glitch-red opacity-90 select-none" aria-hidden="true">
                {text}
            </span>
        </div>
    );
}