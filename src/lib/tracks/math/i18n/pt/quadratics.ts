// PT text for src/lib/tracks/math/chapters/quadratics.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  mAlg_completeBody: "A fórmula vem de um truque chamado completar o quadrado. Divida por a: x² + (b/a)x + c/a = 0. Os dois primeiros termos são o começo de um quadrado perfeito: (x + b/2a)² = x² + (b/a)x + b²/4a². Então some e subtraia b²/4a²: (x + b/2a)² = b²/4a² − c/a = (b² − 4ac)/4a². Tire a raiz quadrada dos dois lados (com os dois sinais) e subtraia b/2a.",
  mAlg_eqQuad: "A fórmula quadrática",
  mAlg_wABC: "os coeficientes de ax² + bx + c = 0, com a ≠ 0",
  mAlg_wDisc: "o discriminante. Δ > 0: duas soluções reais; Δ = 0: uma (a parábola toca o eixo); Δ < 0: nenhuma, porque nenhum número real ao quadrado dá negativo",
  mAlg_wVertex: "o x do vértice, o ponto de virada da parábola. As raízes ficam simétricas em torno dele",
  mAlg_wSpread: "a distância de cada raiz até o vértice",
};

export default text;
