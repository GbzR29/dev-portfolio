// PT text for src/lib/tracks/cpp/chapters/c-io-files.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  cIo_intro: "Um programa que não lê nem escreve é uma caixa fechada. O C conversa com o mundo de fora por streams (fluxos): sequências de bytes que entram ou saem, uma depois da outra. O teclado, o terminal, um arquivo no disco e a saída de outro programa, todos parecem streams, e o mesmo punhado de funções de <stdio.h> funciona em qualquer um deles. Essa ideia veio direto do Unix, onde \"tudo é arquivo\". Este capítulo trata dos três streams com que todo programa começa e depois dos arquivos: abri-los, ler e escrever texto e dados binários, e perceber quando algo falha.",
  cIo_goal0: "Usar stdin, stdout e stderr, e redirecioná-los pelo shell.",
  cIo_goal1: "Abrir, ler, escrever e fechar um arquivo, conferindo cada passo.",
  cIo_goal2: "Ler um arquivo de texto linha a linha e transformar o texto em números.",
  cIo_goal3: "Explicar o buffer de saída e quando chamar fflush.",
  cIo_goal4: "Salvar e carregar dados binários, sabendo por que structs crus não são portáveis.",

  cIo_streamsTitle: "Três streams já estão abertos",
  cIo_hStream: "Stream",
  cIo_hIs: "O que é",
  cIo_hUse: "Usado por",
  cIo_s1: "entrada padrão: o teclado, a não ser que seja redirecionada",
  cIo_s2: "saída padrão: o terminal, a não ser que seja redirecionada",
  cIo_s3: "saída de erro: também o terminal, mas um canal separado para mensagens",
  cIo_redirBody: "O shell pode ligar esses streams a arquivos ou a outros programas sem que o programa saiba. É por isso que erros vão para o stderr: quando a saída normal é mandada para um arquivo, os erros continuam chegando à tela.",

  cIo_openTitle: "Abrindo e fechando um arquivo",
  cIo_openBody: "fopen(caminho, modo) abre um arquivo e devolve um FILE *, um ponteiro para uma estrutura que a biblioteca aloca para acompanhar o arquivo aberto: o identificador do sistema operacional para ele, a posição atual e um buffer. Toda função que trabalha com o arquivo recebe esse ponteiro. fclose libera tudo isso. A string de modo diz o que você pretende fazer.",
  cIo_hMode: "Modo",
  cIo_hMeaning: "Significado",
  cIo_hMissing: "Se o arquivo não existe",
  cIo_m1: "ler",
  cIo_m1x: "falha: devolve NULL",
  cIo_m2: "escrever, apagando o que havia",
  cIo_m2x: "cria",
  cIo_m3: "acrescentar: escrever no fim",
  cIo_m3x: "cria",
  cIo_m4: "ler e escrever, mantendo o conteúdo",
  cIo_m4x: "falha",
  cIo_m5: "binário: os bytes passam sem mudança (importa no Windows, onde o modo texto converte \\n em \\r\\n)",
  cIo_m5x: "como acima",
  cIo_figBody: "Um FILE é um recurso como um bloco do malloc: precisa ser devolvido. Avance pelo programa, depois remova o fclose e veja o que o resumo diz.",

  cIo_readTitle: "Lendo texto linha a linha",
  cIo_readBody: "fgets(buf, tamanho, f) lê uma linha para buf, no máximo tamanho − 1 caracteres, e acrescenta o '\\0'. Ele mantém o '\\n' se a linha inteira coube. Devolve NULL no fim do arquivo ou num erro, o que o torna uma condição de laço natural. Para transformar o texto em números, use strtol ou strtod: ao contrário do atoi, eles dizem onde o número terminou, então você detecta texto que nem era um número.",
  cIo_feofWarn: "Não faça o laço com while (!feof(f)). feof só fica verdadeiro depois que uma leitura já falhou, então o corpo do laço roda uma vez a mais com dados velhos. Faça o laço sobre o valor de retorno da própria leitura, como acima.",

  cIo_writeTitle: "Escrevendo, e o buffer no meio do caminho",
  cIo_writeBody: "fprintf(f, …) funciona como printf para dentro de um arquivo, e fputs(s, f) escreve uma string. Nenhum dos dois vai direto para o disco. Pedir ao sistema operacional para escrever é lento comparado a copiar bytes na memória, então o stdio junta a saída no buffer do FILE e a escreve em pedaços grandes. O buffer é escrito (esvaziado, flush) quando enche, quando você chama fflush(f) ou fclose(f), e quando o programa termina normalmente. A saída para um terminal também é esvaziada a cada '\\n'; a saída para um arquivo ou pipe, não.",
  cIo_crashNote: "Se o programa trava, o que ainda estiver num buffer se perde. É por isso que as últimas linhas de um log muitas vezes parecem faltar depois de um crash, e por que o stderr não tem buffer por padrão.",

  cIo_binTitle: "Arquivos binários",
  cIo_binBody: "fwrite(ptr, tamanho, quantidade, f) copia quantidade itens de tamanho bytes da memória para o arquivo, sem mudança; fread faz o inverso. Os dois devolvem quantos itens inteiros conseguiram, então uma contagem menor quer dizer fim do arquivo ou erro. Arquivos binários são compactos e rápidos de carregar, e por isso jogos os usam para saves e assets.",
  cIo_portTitle: "Por que um struct cru não é um formato de arquivo",
  cIo_portBody: "Escrever um struct de uma vez copia o seu arranjo na memória, e esse arranjo depende da máquina e do compilador: o tamanho de cada tipo, o padding entre os campos e a ordem dos bytes (little-endian no x86 e no ARM, big-endian em alguns outros). Um arquivo escrito por um build pode não carregar em outro. Tipos de largura fixa como uint32_t, um número mágico, um campo de versão e nenhum ponteiro no struct resolvem a maioria dos casos. Para arquivos que precisam viajar entre máquinas muito diferentes, escreva cada campo separado, numa ordem de bytes fixa.",

  cIo_errTitle: "Quando algo dá errado: errno",
  cIo_errBody: "A maioria das funções da biblioteca informa a falha pelo valor de retorno e deixa o motivo num inteiro global chamado errno (de <errno.h>). perror(\"texto\") imprime o seu texto seguido do motivo por extenso; strerror(errno) devolve as mesmas palavras como string. Leia errno logo depois da chamada que falhou, porque a próxima chamada pode mudá-lo.",
  cIo_hFn: "Função",
  cIo_hFail: "Indica falha com",
  cIo_f2: "NULL (fim do arquivo ou erro: ferror(f) diz qual)",
  cIo_f3: "devolvendo menos itens que o pedido",
  cIo_f4: "um valor negativo ou EOF",
  cIo_f5: "ponteiro de fim inalterado, ou errno valendo ERANGE",

  cIo_tryTitle: "Experimente",
  cIo_try1: "Escreva uma versão mínima do cat: imprima cada arquivo citado na linha de comando, e informe os que faltam no stderr com perror.",
  cIo_try2: "Conte as linhas, palavras e bytes de um arquivo, como a ferramenta wc do Unix.",
  cIo_try3: "Salve o struct SaveGame, depois carregue-o e imprima. Mude o tipo de um campo, recompile e tente carregar o arquivo antigo. O que o campo de versão permite fazer?",

  cIo_key0: "Todo programa começa com stdin, stdout e stderr; erros vão para o stderr para que o redirecionamento não os esconda.",
  cIo_key1: "fopen devolve um FILE * ou NULL; todo arquivo aberto precisa de exatamente um fclose.",
  cIo_key2: "Faça o laço sobre o retorno de fgets ou fread, nunca sobre feof. Converta números com strtol, que avisa entrada inválida.",
  cIo_key3: "A saída tem buffer: chega ao arquivo quando o buffer enche, no fflush ou no fclose.",
  cIo_key4: "Arquivos binários são rápidos mas presos ao arranjo dos dados: use tipos de largura fixa, um número mágico e uma versão.",
  cIo_key5: "Confira todo valor de retorno; errno e perror explicam a falha.",
};

export default text;
