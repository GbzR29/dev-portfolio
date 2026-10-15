// PT chapter titles and section names for the asm track (see asm/index.tsx).

const track = {
  titles: {
    "what-is-assembly": "O que é assembly?",
    registers: "Registradores: as variáveis da CPU",
    "first-program": "O seu primeiro programa",
    "mov-addressing": "mov, memória e modos de endereçamento",
    "arithmetic-flags": "Aritmética e flags",
    "jumps-loops": "Saltos e laços",
    "stack-calls": "A pilha e as chamadas de função",
    "calling-convention": "A convenção de chamada",
  } as Record<string, string>,
  sections: {
    Foundations: "Fundamentos",
    "Control Flow & Functions": "Controle de fluxo e funções",
  } as Record<string, string>,
};

export default track;
