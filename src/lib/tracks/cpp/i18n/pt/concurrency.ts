// PT text for src/lib/tracks/cpp/chapters/concurrency.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  cpp12_intro: "Um jogo moderno roda em oito a dezesseis núcleos e numa thread de renderização que não pode travar. O C++ oferece threads portáveis, mas a parte interessante não é iniciar uma thread — é o modelo de memória, que diz quando uma thread pode enxergar as escritas de outra.",
  cpp12_jthreadTitle: "jthread — a que você deve usar",
  cpp12_syncTitle: "Primitivas de sincronização",
  cpp12_h0: "Ferramenta",
  cpp12_h1: "Use para",
  cpp12_r1: "Travar um ou mais mutexes de uma vez, sem deadlock. O padrão.",
  cpp12_r2: "Muitos leitores, um escritor. Só compensa quando as leituras dominam com folga.",
  cpp12_r3: "Um único valor compartilhado sem mutex — contadores, flags, índices.",
  cpp12_r4: "Esperar N tarefas terminarem. barrier é reutilizável a cada frame, latch é de uso único.",
  cpp12_r5: "Limitar o acesso concorrente a um recurso finito.",
  cpp12_r6: "Um worker dormindo até haver trabalho. Sempre espere com um predicado.",
  cpp12_atomicTitle: "Atômicos e ordem de memória",
  cpp12_atomicBody: "Uma operação atômica é indivisível, mas também restringe como o compilador e a CPU podem reordenar as operações ao redor dela. O padrão, seq_cst, é o mais forte e o mais lento; relaxed dá atomicidade sem nenhuma garantia de ordem.",
  cpp12_relaxedWarn: "Use o padrão memory_order_seq_cst até um profiler provar que ele é o seu gargalo. Código relaxed e acquire/release que parece obviamente correto está errado com frequência, de formas que só aparecem em outra arquitetura de CPU, meses depois, no log de crash de um cliente. Verifique com o ThreadSanitizer, não lendo o código.",
  cpp12_sharingTitle: "False sharing",
  cpp12_execTitle: "std::execution (C++26)",
  cpp12_execBody: "O C++26 padroniza senders e receivers: um modelo composável para trabalho assíncrono, em que você descreve um grafo de operações e depois o executa num scheduler escolhido — um thread pool, um stream da GPU, um event loop. É a base de que o padrão precisava antes de oferecer algoritmos assíncronos de verdade.",
  cpp12_execNote: "std::execution é grande e novíssimo. Existem implementações de referência (a stdexec é a que a maioria usa hoje), mas o suporte nas bibliotecas padrão ainda está chegando. Aprenda o modelo agora — sender, scheduler, receiver — porque a história assíncrona do C++ vai ser construída sobre ele na próxima década.",
};

export default text;
