// PT text for src/lib/tracks/cpp/chapters/c-pointers.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  cPtr_intro: "Toda variável vive num endereço: o número do seu primeiro byte na memória. Um ponteiro é uma variável cujo valor é um endereço desses. Um ponteiro é só isso, e mesmo assim dá ao C a maior parte do seu poder. Uma função pode mudar uma variável de quem a chamou. Uma estrutura grande pode ser entregue sem ser copiada. Um array inteiro pode ser percorrido com um único endereço que anda. Ponteiros também estão por trás da maioria dos crashes em programas C, por isso este capítulo monta a imagem devagar, com caixas e setas.",
  cPtr_goal0: "Dizer o que um ponteiro guarda, e ler &x, *p e p em qualquer linha de código.",
  cPtr_goal1: "Escrever uma função que muda as variáveis de quem a chamou.",
  cPtr_goal2: "Percorrer um array com aritmética de ponteiros e explicar por que p + 1 pula sizeof(*p) bytes.",
  cPtr_goal3: "Passar um array para uma função do jeito certo, com o tamanho dele.",
  cPtr_goal4: "Ler const int * e int * const, e se proteger de NULL.",

  cPtr_addrTitle: "Endereços e o operador &",
  cPtr_addrBody: "O operador & antes de uma variável dá o endereço dela. Impresso com %p, é um número hexadecimal grande (base 16, dígitos 0–9 e a–f). O valor exato muda a cada execução, porque o sistema operacional põe a stack num lugar aleatório toda vez para dificultar ataques. O que não muda é o arranjo: variáveis declaradas juntas ficam a poucos bytes umas das outras.",

  cPtr_varTitle: "Variáveis ponteiro",
  cPtr_varBody: "Uma variável ponteiro é declarada com um * entre o tipo e o nome: int *p; lê-se \"p é um ponteiro para int\". Ela ocupa 8 bytes numa máquina de 64 bits, seja lá para o que aponte, porque só guarda um endereço. O tipo na frente (int aqui) diz ao compilador o que ele vai encontrar nesse endereço. Usar * numa expressão faz outra coisa: *p quer dizer \"o valor no endereço guardado em p\". Ler ou escrever *p se chama desreferenciar p.",
  cPtr_hExpr: "Expressão",
  cPtr_hType: "Tipo",
  cPtr_hMeans: "Significa (com int x = 5; int *p = &x;)",
  cPtr_e1: "o valor em x: 5",
  cPtr_e2: "o endereço de x",
  cPtr_e3: "o valor em p, que é o endereço de x",
  cPtr_e4: "o int nesse endereço: o próprio x. *p = 9 muda x",
  cPtr_e5: "o endereço de p: um ponteiro também é uma variável, com a sua própria caixa",
  cPtr_starWarn: "Em int *a, b; só a é ponteiro. b é um int comum: o * pertence ao nome, não ao tipo. Declare um ponteiro por linha e o problema nunca aparece.",

  cPtr_swapTitle: "Por que funções precisam de ponteiros",
  cPtr_swapBody: "O C passa todo argumento por valor: a função recebe uma cópia numa caixa nova do seu próprio frame. Mudar a cópia não toca no original. Então uma função que deve mudar as variáveis de quem a chamou precisa receber os endereços delas. Compare as duas versões de swap abaixo: a primeira troca as suas cópias e depois as joga fora; a segunda alcança os originais pelos ponteiros.",

  cPtr_arrTitle: "Arrays e aritmética de ponteiros",
  cPtr_arrBody: "Um array é um bloco de elementos lado a lado, sem buracos. Em quase toda expressão, o nome de um array vira um ponteiro para o seu primeiro elemento. Isso se chama decaimento (decay). Somar um inteiro n a um ponteiro o move n elementos para a frente, não n bytes: o compilador multiplica pelo tamanho do elemento. Então, para um ponteiro de int, p + 1 está 4 bytes adiante, e para um ponteiro de double, 8 bytes. O C define a indexação com essa regra: a[i] quer dizer exatamente *(a + i).",
  cPtr_hOp: "Operação",
  cPtr_hResult: "Resultado (int a[5]; int *p = a;)",
  cPtr_a1: "o endereço de a[i]: endereço de a + i × sizeof(int)",
  cPtr_a2: "o elemento a[i]",
  cPtr_a3: "p passa a apontar para o próximo elemento",
  cPtr_a4: "para dois ponteiros no mesmo array: quantos elementos os separam",
  cPtr_a5: "compara posições no mesmo array; usado como condição de laço",
  cPtr_a6: "uma posição depois do fim: permitido como marcador de parada, mas nunca pode ser lido",

  cPtr_passTitle: "Passando um array para uma função",
  cPtr_passBody: "Um array não pode ser passado por valor. Quando você escreve sum(a), a função recebe só o endereço de a[0], então não tem como saber quantos elementos vêm depois. Sempre passe o tamanho como segundo parâmetro. Dentro da função, sizeof do parâmetro dá o tamanho de um ponteiro (8), não do array: um erro clássico.",

  cPtr_nullTitle: "NULL e ponteiros que não apontam para lugar nenhum",
  cPtr_nullBody: "NULL é um valor especial de ponteiro que quer dizer \"não aponta para nada\". Funções o devolvem para indicar falha (malloc e fopen fazem isso), e você pode testá-lo com if (p == NULL) ou simplesmente if (!p). Desreferenciar NULL derruba o programa em sistemas de desktop, e esse é o resultado bom: o bug aparece na hora. O caso ruim é um ponteiro que nunca recebeu valor. Como toda variável sem inicialização, ele guarda lixo, então aponta para um endereço aleatório, e escrever por ele pode estragar outros dados em silêncio. Inicialize todo ponteiro, com NULL se ainda não houver nada melhor.",

  cPtr_constTitle: "const e ponteiros",
  cPtr_constBody: "const marca algo como somente leitura. Com ponteiros há duas coisas que podem ser somente leitura: o valor apontado e o próprio ponteiro. Leia a declaração a partir do nome, da direita para a esquerda.",
  cPtr_hDecl: "Declaração",
  cPtr_hRead: "Lê-se",
  cPtr_hAllowed: "Permitido",
  cPtr_c1: "p é um ponteiro para um const int",
  cPtr_c1b: "p = &y sim, *p = 1 não",
  cPtr_c2: "p é um ponteiro const para um int",
  cPtr_c2b: "*p = 1 sim, p = &y não",
  cPtr_c3: "um ponteiro const para um const int",
  cPtr_c3b: "nenhum dos dois",
  cPtr_constUse: "A primeira forma é a que você mais vai escrever. Um parâmetro declarado const int *a promete a quem chama que a função só lê o array, e o compilador garante a promessa.",

  cPtr_voidTitle: "void * e ponteiros para ponteiros",
  cPtr_voidBody: "Um void * guarda um endereço sem tipo associado. Ele não pode ser desreferenciado nem movido com + até ser convertido num tipo de ponteiro de verdade. Funções genéricas o usam: malloc devolve um void *, e memcpy copia bytes entre dois deles. Em C ele vira qualquer outro tipo de ponteiro sem cast; o C++ exige o cast.",
  cPtr_ppBody: "Um ponteiro é uma variável, então também tem endereço, e um ponteiro para ponteiro guarda esse endereço. Você encontra um na forma completa de main: int main(int argc, char **argv). argv aponta para um array de ponteiros, um por palavra da linha de comando, e cada um deles aponta para os caracteres da palavra.",

  cPtr_tryTitle: "Experimente",
  cPtr_try1: "Imprima &a[0], &a[1] e &a[2] para um array de int e para um de double. Quanto os endereços crescem a cada vez?",
  cPtr_try2: "Escreva void reverse(int *a, size_t n) com dois ponteiros, um em cada ponta, que trocam os valores e andam um em direção ao outro até se encontrarem.",
  cPtr_try3: "Escreva int *find(int *a, size_t n, int x), que devolve um ponteiro para o primeiro elemento igual a x, ou NULL. Use-o para mudar esse elemento pelo ponteiro.",

  cPtr_key0: "Um ponteiro é uma variável que guarda um endereço. &x produz um endereço e *p segue um.",
  cPtr_key1: "O C passa argumentos por valor. Para deixar uma função mudar a sua variável, passe o endereço dela.",
  cPtr_key2: "O nome de um array decai para um ponteiro ao seu primeiro elemento, e a[i] é *(a + i).",
  cPtr_key3: "p + 1 anda um elemento, sizeof(*p) bytes, não um byte.",
  cPtr_key4: "Uma função que recebe um array recebe só um ponteiro: passe o tamanho também.",
  cPtr_key5: "Inicialize todo ponteiro. NULL quer dizer lugar nenhum e pode ser testado; lixo, não.",
};

export default text;
