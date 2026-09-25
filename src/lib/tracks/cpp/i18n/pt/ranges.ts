// PT text for src/lib/tracks/cpp/chapters/ranges.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  cpp08_intro: "Os algoritmos do C++98 recebiam dois iteradores, o que significava que toda chamada começava com begin() e end() e nenhuma chamada podia ser encadeada. Ranges recebem o próprio container e se compõem com o operador pipe, então um loop de cinco linhas vira uma expressão legível que continua compilando para um loop.",
  cpp08_algosTitle: "Algoritmos de range",
  cpp08_viewsTitle: "Views são pipelines preguiçosos",
  cpp08_viewsBody: "Uma view não possui nem copia nada e não faz trabalho algum até você iterá-la. Encadear dez views ainda percorre a origem exatamente uma vez.",
  cpp08_catalogTitle: "As views que vale decorar",
  cpp08_h0: "View",
  cpp08_h1: "Faz",
  cpp08_h2: "Desde",
  cpp08_r1: "Mantém os elementos que casam / transforma cada elemento.",
  cpp08_r2: "Os N primeiros / tudo depois dos N primeiros.",
  cpp08_r3: "Itera de trás para frente sem iterador reverso.",
  cpp08_r4: "Uma sequência preguiçosa de números — substitui o for com índice.",
  cpp08_r5: "Produz pares (índice, elemento). O que todo mundo queria desde o primeiro dia.",
  cpp08_r6: "Percorre vários ranges em paralelo, como tuplas.",
  cpp08_r7: "Blocos de tamanho fixo / janela deslizante. Ótimo para os triângulos de uma malha.",
  cpp08_r8: "Achata um range de ranges com um separador.",
  cpp08_dangleWarn: "Uma view referencia a sua origem. Se a origem for um temporário, a view fica pendurada — auto v = getVector() | views::filter(f); é um use-after-free esperando para acontecer. A biblioteca pega muitos desses casos em tempo de compilação via borrowed_range, mas não todos. Mantenha o container dono vivo enquanto a view existir.",
  cpp08_perfTip: "Views otimizam bem em -O2, mas ficam drasticamente mais lentas em builds de debug sem otimização, porque cada etapa é um adaptador de iterador separado que o inliner ainda não colapsou. Se o frame rate em debug importa para você, mantenha os loops mais internos de cada frame simples e use views no código de setup e de ferramentas.",
};

export default text;
