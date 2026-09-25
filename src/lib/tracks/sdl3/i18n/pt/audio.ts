// PT text for src/lib/tracks/sdl3/chapters/audio.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  sdl08_intro: "O SDL3 reescreveu o áudio em torno de streams. No SDL2 você abria um dispositivo num formato específico e convertia tudo sozinho; no SDL3 você abre um stream, diz em que formato estão os seus dados, e o SDL converte e reamostra no caminho até o dispositivo. Vários streams podem alimentar o mesmo dispositivo, e o SDL os mistura.",
  sdl08_conceptTitle: "Streams, dispositivos e dispositivos lógicos",
  sdl08_conceptBody: "Um dispositivo físico é a placa de som. Um dispositivo lógico é o handle do seu programa para ela, e vários podem estar abertos ao mesmo tempo sem brigar. Um stream é uma fila com conversão de formato embutida: você empurra amostras no seu formato, e o SDL as puxa no formato do dispositivo.",
  sdl08_pauseWarn: "SDL_OpenAudioDeviceStream devolve um dispositivo pausado. Esquecer o SDL_ResumeAudioStreamDevice é o motivo mais comum de \"meu código de áudio roda e nada toca\" — não há erro nenhum, as amostras simplesmente se acumulam na fila para sempre.",
  sdl08_callbackTitle: "Gerando áudio num callback",
  sdl08_callbackBody: "Para áudio sintetizado, passe um callback ao abrir o stream. O SDL o chama a partir da thread de áudio sempre que o stream precisa de mais dados — o que significa que valem as regras de sempre da thread de áudio.",
  sdl08_threadWarn: "O callback de áudio roda numa thread de tempo real com prazo rígido de poucos milissegundos. Nada de alocação, nada de mutex que uma thread do jogo possa estar segurando, nada de E/S de arquivo, nada de log. Perca o prazo e o usuário ouve um estalo. Comunique-se com um ring buffer sem trava ou com um atômico, e faça o trabalho pesado em outro lugar.",
  sdl08_mixTitle: "Misturando vários sons",
  sdl08_mixBody: "Você não precisa de um mixer para casos simples: ligue vários streams ao mesmo dispositivo lógico e o SDL os soma. O ganho é por stream, então um stream de música e um de efeitos sonoros podem ter volumes independentes.",
  sdl08_mixerTip: "Para um jogo de verdade, o SDL3_mixer acrescenta decodificação de MP3, OGG e FLAC, um modelo de canais, fades e loops por cima de tudo isso. O áudio básico do SDL é a camada certa quando você está sintetizando som ou construindo o seu próprio mixer; o SDL3_mixer é a camada certa quando você só quer tocar os arquivos que o designer de áudio te entregou.",
};

export default text;
