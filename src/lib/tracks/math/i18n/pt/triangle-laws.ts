// PT text for src/lib/tracks/math/chapters/triangle-laws.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  mTrig_eqCosLaw: "Lei dos cossenos",
  mTrig_wAB: "dois lados do triângulo (braço e antebraço)",
  mTrig_wCside: "o terceiro lado, oposto ao ângulo γ (a distância do ombro até o alvo)",
  mTrig_wGamma: "o ângulo entre a e b (o cotovelo). Isolando: cos γ = (a² + b² − c²) / 2ab",
  mTrig_eqCosLawNote: "Se c > a + b, o alvo está fora de alcance e a fração fica abaixo de −1: limite-a a [−1, 1] antes de chamar acos, senão o resultado é NaN.",
};

export default text;
