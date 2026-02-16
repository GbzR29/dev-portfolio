// components/effects/GlitchEffect.tsx
export default function GlitchEffect({ text }: { text: string }) {
  return (
    <div className="relative inline-block">
      {/* Camada Principal Branca */}
      <span className="relative glitch-base text-white z-10">
        {text}
      </span>
      
      {/* Camada Cyan */}
      <span 
        className="absolute inset-0 glitch-cyan opacity-90 select-none z-0" 
        aria-hidden="true"
        style={{ transform: 'translate(-2px, 0)' }} // Pequeno offset manual se necessário
      >
        {text}
      </span>

      {/* Camada Vermelha */}
      <span 
        className="absolute inset-0 glitch-red opacity-90 select-none z-0" 
        aria-hidden="true"
        style={{ transform: 'translate(2px, 0)' }}
      >
        {text}
      </span>
    </div>
  );
}