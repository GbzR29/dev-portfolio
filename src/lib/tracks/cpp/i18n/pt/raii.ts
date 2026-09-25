// PT text for src/lib/tracks/cpp/chapters/raii.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  cpp04_intro: "RAII — Resource Acquisition Is Initialization, \"aquisição de recurso é inicialização\" — é a ideia que o C++ tem e a maioria das outras linguagens não. Um recurso é adquirido num construtor e liberado num destrutor, então o compilador gera a limpeza para você em todo caminho de saída: retorno normal, retorno antecipado, break e exceção lançada. Não existe bloco finally porque não há nada para lembrar.",
  cpp04_whyTitle: "Por que a limpeza manual falha",
  cpp04_ownershipTitle: "Escolhendo o tipo de posse",
  cpp04_h0: "Tipo",
  cpp04_h1: "Significado",
  cpp04_h2: "Custo",
  cpp04_r1: "Este objeto é dono dos dados diretamente. O padrão.",
  cpp04_c1: "Nenhum",
  cpp04_r2: "Posse exclusiva de um objeto no heap. Só pode ser movido.",
  cpp04_c2: "Um ponteiro, custo zero",
  cpp04_r3: "Posse compartilhada, liberada quando o último dono morre.",
  cpp04_c3: "Contagem de referências atômica + bloco de controle",
  cpp04_r4: "Observa um shared_ptr sem mantê-lo vivo. Quebra ciclos.",
  cpp04_c4: "Precisa de lock() antes de usar",
  cpp04_r5: "Observador sem posse. Nunca chame delete nele.",
  cpp04_c5: "Nenhum — mas sem garantia de tempo de vida",
  cpp04_rawNote: "Ponteiros crus não são proibidos no C++ moderno — ponteiros crus que são DONOS, sim. Um parâmetro T* que diz \"olhe isto, não libere\" é perfeitamente idiomático e não custa nada. A regra é que exatamente um tipo do seu programa deve saber destruir um determinado objeto.",
  cpp04_uniqueTitle: "unique_ptr na prática",
  cpp04_deleterTitle: "Deleters personalizados embrulham APIs em C",
  cpp04_deleterBody: "Bibliotecas gráficas e de plataforma são APIs em C com pares Create/Destroy. Um unique_ptr com deleter personalizado transforma qualquer uma delas num tipo RAII em três linhas — você vai usar isso o tempo todo com SDL, GLFW, Vulkan e FreeType.",
  cpp04_lambdaWarn: "Não use uma lambda com captura como deleter de unique_ptr sem necessidade — o estado da lambda fica guardado dentro do unique_ptr e dobra o seu tamanho. Uma struct sem estado com operator() some por completo graças à otimização de base vazia.",
  cpp04_sharedTitle: "shared_ptr e o seu custo real",
  cpp04_sharedBody: "shared_ptr não é o padrão seguro — é a resposta para uma pergunta específica: quem destrói isto, quando vários sistemas não relacionados o seguram e nenhum deles vive mais que os outros de forma previsível? Toda cópia é um incremento atômico, e atômicos num caminho quente não são de graça.",
  cpp04_gameTip: "Em código de jogo, a alternativa comum ao shared_ptr é um handle: um índice mais um contador de geração num array central. Ocupa 8 bytes, é trivialmente copiável, amigável ao cache, sobrevive à realocação do array e permite detectar referências obsoletas. Recorra a ele quando se pegar colocando shared_ptr num loop quente.",
};

export default text;
