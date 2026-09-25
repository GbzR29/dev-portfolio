// PT text for src/lib/tracks/cpp/chapters/performance.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  cpp13_intro: "A 60 quadros por segundo, você tem 16,6 milissegundos para tudo. No hardware moderno, o fator limitante quase nunca é a aritmética — é esperar pela memória. Um cache miss custa algumas centenas de ciclos, tempo suficiente para ter feito cem multiplicações. Design orientado a dados é a prática de organizar os dados para que esses misses não aconteçam.",
  cpp13_cacheTitle: "Os números que guiam cada decisão",
  cpp13_h0: "Acesso",
  cpp13_h1: "Custo aproximado",
  cpp13_h2: "Em perspectiva",
  cpp13_r1: "Praticamente de graça",
  cpp13_r2: "Perceptível num loop apertado",
  cpp13_r3: "Agora você está limitado pela memória",
  cpp13_r4: "Cem multiplicações desperdiçadas",
  cpp13_r5k: "Linha de cache",
  cpp13_r5: "Você sempre paga 64 bytes, mesmo lendo um",
  cpp13_soaTitle: "Array de structs vs. struct de arrays",
  cpp13_soaBody: "Esta é a mudança de maior efeito na maior parte do código de partículas, física e ECS. Se um loop toca dois campos de uma struct gorda, o layout AoS arrasta os outros sessenta bytes pelo cache à toa.",
  cpp13_allocTitle: "Alocação é a outra metade",
  cpp13_containersTitle: "Containers mais novos que vale conhecer",
  cpp13_ch0: "Container",
  cpp13_ch1: "O que ele oferece",
  cpp13_ch2: "Desde",
  cpp13_c1: "Semântica de map sobre dois vectors ordenados. Comportamento de cache muito melhor que uma árvore rubro-negra nas buscas; inserções lentas.",
  cpp13_c2: "Um vector de capacidade fixa guardado inline. Nenhuma alocação no heap — ideal para buffers por frame.",
  cpp13_c3: "Armazenamento em blocos com referências estáveis e remoção O(1). Feito para entidades criadas e destruídas o tempo todo.",
  cpp13_c4: "Uma visão multidimensional, sem posse, sobre um buffer plano. Texturas e grades de voxels sem aritmética de índices.",
  cpp13_c5: "Vetorização explícita e portável. Escreva uma vez, receba SSE / AVX / NEON.",
  cpp13_measureWarn: "Toda afirmação desta página é uma hipótese até você medir com os seus dados. Os compiladores vetorizam, fazem prefetch e eliminam código agressivamente em -O2, e os preditores de desvio modernos são extremamente bons. Faça o profiling primeiro, mude uma coisa, faça o profiling de novo — e nunca meça um build de debug, em que a biblioteca padrão está cheia de verificações de iterador que não existem em release.",
  cpp13_toolsTip: "As ferramentas que se pagam: perf ou VTune para ver para onde vai o tempo, Compiler Explorer para ver o que o compilador realmente gerou, cachegrind para as taxas de miss e Tracy para uma linha do tempo, frame a frame, de um jogo rodando.",
};

export default text;
