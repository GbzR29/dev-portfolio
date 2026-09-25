// PT text for src/lib/tracks/sdl3/chapters/input.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  sdl04_intro: "O SDL entrega tudo o que o usuário faz como um SDL_Event: uma union com etiqueta, em que o campo type diz qual membro é válido. A distinção que confunde todo iniciante é evento versus estado — eventos dizem que algo mudou, o estado diz o que é verdade agora, e a jogabilidade precisa dos dois.",
  sdl04_loopTitle: "A union de eventos",
  sdl04_scanTitle: "Scancode versus keycode",
  sdl04_scanBody: "Um scancode é a posição física de uma tecla; um keycode é o caractere que essa tecla produz no layout do usuário. Num teclado AZERTY, a tecla que fica onde está o W no QWERTY produz Z. O movimento precisa usar scancodes, senão jogadores franceses não conseguem andar para frente. Atalhos e texto devem usar keycodes, para que o Ctrl+Z fique onde o Z do usuário realmente está.",
  sdl04_stateTip: "A regra prática: use eventos para o que acontece uma vez (pular, atirar, abrir um menu) e estado consultado para o que é contínuo (andar, mirar, segurar um gatilho). Guiar o movimento por eventos de tecla pressionada coloca o atraso de repetição de tecla do sistema operacional no meio dos seus controles.",
  sdl04_mouseTitle: "Modos do mouse",
  sdl04_padTitle: "Gamepads",
  sdl04_padBody: "SDL_Gamepad é a API de alto nível: ela mapeia qualquer controle reconhecido para o layout do Xbox, então você escreve SDL_GAMEPAD_BUTTON_SOUTH uma vez e funciona num DualSense, num Switch Pro e num controle de Xbox. A API de baixo nível SDL_Joystick existe para manches de voo e volantes que não se encaixam nesse layout.",
  sdl04_deadzoneWarn: "Aplique a zona morta ao comprimento do analógico, não a cada eixo separadamente. Zonas mortas por eixo produzem uma área morta quadrada, então uma entrada diagonal perto do centro se comporta diferente de uma entrada nos eixos — os jogadores sentem isso como o analógico \"grudando\" nos eixos.",
  sdl04_textTitle: "Entrada de texto",
  sdl04_textNote: "Nunca monte texto a partir de eventos de tecla pressionada. SDL_EVENT_TEXT_INPUT é o único caminho que trata corretamente layouts de teclado, teclas mortas e editores de método de entrada para chinês, japonês e coreano — o evento entrega caracteres UTF-8 prontos, não teclas.",
};

export default text;
