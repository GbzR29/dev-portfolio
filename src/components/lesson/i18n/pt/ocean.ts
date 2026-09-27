// PT text for the ocean widgets (figures/ocean). Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  figOcean_title: "Laboratório do Oceano (FFT)",
  figOcean_cascades: "cascatas",
  figOcean_mss: "inclinação²",
  figOcean_hint: "arraste para olhar · role para dar zoom · Hs, λp e Tp são a altura significativa de onda, o comprimento de onda de pico e o período de pico deste estado de mar",
  figOcean_n0: "Milhares de ondas ao mesmo tempo: cada texel dos três espectros é uma onda com comprimento, direção e fase aleatória próprios. Desligue cascatas para ver o que cada faixa acrescenta.",
  figOcean_n1: "A normal a partir das inclinações somadas das três cascatas. Ao longe, as texturas de derivadas são lidas de mips menores, o que tira a média de detalhes que os pixels não conseguiriam mostrar.",
  figOcean_n2: "J a partir das derivadas do deslocamento horizontal. Vermelho é J < 0: o deslocamento choppy dobrou a superfície. Aumente o vento ou a choppiness para ver mais disso.",
  figOcean_n5: "O Fresnel de Schlick, como no Laboratório de Água: água escura perto, o espelho do céu em direção ao horizonte.",
  figOcean_n6: "A densidade de espuma que a simulação mantém. Dobras injetam espuma; a cada frame a espuma antiga é multiplicada por e^(−dt/τ), então os rastros brancos atrás de uma crista que quebra se apagam em poucos segundos.",
  figOcean_n7: "Qual cascata move mais cada ponto: vermelho é o tile de 500 m (swell), verde o de 83 m, azul o de 14 m (mar picado e ondulações).",
  figSpectrum_title: "O espectro JONSWAP",
  figSpectrum_U: "vento U (m/s)",
  figSpectrum_F: "pista F (km)",
  figSpectrum_g: "pico γ",
  figSpectrum_pm: "tracejado: γ = 1 (Pierson–Moskowitz)",
  figSpectrum_note: "Mais vento ou mais pista leva o pico para frequências mais baixas (ondas mais longas e rápidas) e sobe a curva inteira. A área sob a curva é a variância da altura da superfície, e Hs = 4·√área. As faixas sombreadas são as frequências que cada cascata FFT do Laboratório do Oceano carrega: vermelho o tile de 500 m, verde o de 83 m, azul o de 14 m.",
};

export default text;
