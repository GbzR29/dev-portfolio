// PT text for src/lib/tracks/math/chapters/number-line.tsx. Keys match the tx() calls there; English is the fallback in the code.
// Only the interactive parts (in words, derivations) for now; the rest of the chapter still shows English.

const text: Record<string, string> = {
  mNL_subWords: "Tirar b de a dá o mesmo resultado que somar a a o oposto de b.",
  mNL_whyNN: "A imagem da virada explica a regra; as leis da aritmética (no fim deste capítulo) a provam. Se (−3) × (−4) fosse qualquer coisa diferente de 12, a lei distributiva quebraria. Siga linha por linha:",
  mNL_dNN: "Por que (−3) × (−4) = 12",
  mNL_dNN0: "comece do 0 e reescreva-o, um passo permitido de cada vez",
  mNL_dNN1: "qualquer coisa vezes 0 é 0",
  mNL_dNN2: "escreva 0 como −4 + 4: um número mais o seu oposto",
  mNL_dNN3: "lei distributiva: multiplique cada termo da soma",
  mNL_dNN4: "um fator negativo: (−3) × 4 = −12, da tabela acima",
  mNL_dNN5: "a linha diz: este produto menos 12 é 0. Some 12 dos dois lados",
  mNL_absWords: "O valor absoluto de um número é o tamanho dele sem o sinal: um número positivo fica como está, um negativo perde o menos. A distância entre dois números é o tamanho da diferença entre eles.",
  mNL_lawsWords: "Multiplicar uma soma dá o mesmo resultado que multiplicar cada termo dela e depois somar.",
  mNL_dMental: "25 × 7 × 4 de cabeça, uma lei por linha",
  mNL_dM1: "lei associativa: uma cadeia de × pode ser agrupada como você quiser",
  mNL_dM2: "lei comutativa: troque 7 e 4 de lugar dentro dos parênteses",
  mNL_dM3: "lei associativa de novo: agora agrupe 25 com 4",
  mNL_dM4: "25 × 4 = 100, e multiplicar por 100 é fácil. Cada passo foi uma lei, então o valor nunca mudou",
};

export default text;
