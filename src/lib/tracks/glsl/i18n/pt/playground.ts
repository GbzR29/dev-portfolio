// PT text for src/lib/tracks/glsl/chapters/playground.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  glslPg_intro: "Daqui em diante, quase todo capítulo tem um shader ao vivo que você pode editar. O código é GLSL ES 3.00 de verdade, a mesma linguagem do GLSL 3.30+ de desktop, a não ser por uma linha de precisão no topo, e ele recompila enquanto você digita. Este capítulo mostra o que o playground entrega ao seu shader, para você poder se concentrar na matemática no resto da trilha.",
  glslPg_uniformsTitle: "O que o seu shader recebe",
  glslPg_uniformsBody: "Tudo abaixo já está declarado para você, num prelúdio fixo acima do seu código. Os números de linha dos erros são ajustados para bater com o seu código, não com o prelúdio.",
  glslPg_thName: "Nome",
  glslPg_thType: "Tipo",
  glslPg_thMeaning: "Significado",
  glslPg_u1: "tamanho do canvas em pixels (pixels do dispositivo, então muda em telas de alta densidade)",
  glslPg_u2: "segundos desde o início; para enquanto está pausado, ⟲ zera",
  glslPg_u3: "segundos desde o frame anterior; contador de frames",
  glslPg_u4: "xy: posição do ponteiro em pixels enquanto o botão está pressionado; zw: onde foi pressionado, negativo depois de soltar (o iMouse do ShaderToy)",
  glslPg_u5: "texturas escolhidas nos seletores que aparecem quando o seu código as usa: ruído procedural, mapas de materiais PBR reais, grades de protótipo",
  glslPg_u6: "o que o fragment shader escreve, no lugar do antigo gl_FragColor",
  glslPg_meshBody: "Presets de malha acrescentam uma aba de vertex shader e renderizam uma malha de verdade (esfera, toro, cubo ou um plano bem subdividido) com uma câmera orbital. O vertex shader recebe aPos, aNormal, aUV, aTangent e as matrizes uModel / uView / uProjection. Ele passa vWorld, vNormal, vUV e vTangent para o fragment shader, que também recebe uCamPos e uLightDir.",
  glslPg_controlsTitle: "Controles a partir de comentários",
  glslPg_controlsBody: "Qualquer uniform seguido de um comentário de anotação ganha um controle. Mude os números no comentário, ou acrescente os seus próprios uniforms, e o painel de controles se atualiza enquanto você digita:",
  glslPg_toyTip: "Código do shadertoy.com roda sem alterações: quando o seu código define mainImage() e nenhum main(), o playground mapeia iTime, iResolution, iMouse e iChannel0..3 para os seus próprios uniforms e chama mainImage por você. Use ⛶ para tela cheia com o editor ao lado do canvas.",
  glslPg_debugTitle: "Depurando um shader",
  glslPg_debugBody: "Não existe printf na GPU. A técnica universal é mostrar como cor o valor de que você desconfia. Escreva FragColor = vec4(vec3(x), 1.0) para um escalar, ou vec4(v * 0.5 + 0.5, 1.0) para uma direção em [−1, 1]. Depois confira se ela tem a cara que você espera: preto onde deveria ser 0, branco onde deveria ser 1, uma rampa suave onde deveria ser contínua. Valores fora da faixa são cortados em preto e branco, então use fract(x) para ver valores grandes como faixas.",
  glslPg_key0: "O playground compila GLSL ES 3.00 de verdade enquanto você digita; os erros apontam para as suas próprias linhas.",
  glslPg_key1: "Embutidos: uResolution, uTime, uMouse (semântica do ShaderToy), texturas uTex0..3, FragColor.",
  glslPg_key2: "// @slider, @color e @toggle depois de um uniform criam controles automaticamente.",
  glslPg_key3: "Presets de malha acrescentam um vertex shader editável e uma câmera orbital.",
  glslPg_key4: "Depure pintando como cor o valor de que você desconfia.",
};

export default text;
