// src/lib/i18n/opengl/openglTranslations.ts
// All readable text from the OpenGL track chapters.
// Code snippets and GLSL source stay in English — that is standard in the field.

export const openglTranslations = {
  en: {
    // ── Shared lesson UI ────────────────────────────────────────────────────
    calloutNote:    "NOTE",
    calloutWarning: "WARNING",
    calloutTip:     "TIP",
    codeCopy:       "copy",
    codeCopied:     "copied",

    // ── Pipeline diagram ────────────────────────────────────────────────────
    pipelineProgrammable:     "programmable",
    pipelineStageVertex:      "Vertex\nData",
    pipelineStageVShader:     "Vertex\nShader",
    pipelineStagePrimAssembly:"Primitive\nAssembly",
    pipelineStageGShader:     "Geometry\nShader",
    pipelineStageRaster:      "Raster\nization",
    pipelineStageFShader:     "Fragment\nShader",
    pipelineStageOutput:      "Output\nMerge",
    pipelineCpuSide:          "CPU side",
    pipelineDriver:           "driver",
    pipelineGlsl:             "GLSL",
    pipelineGlslOpt:          "GLSL (optional)",

    // ── VBO flow diagram ────────────────────────────────────────────────────
    vboFlowCpuRam:       "CPU RAM",
    vboFlowGpuVram:      "GPU VRAM",
    vboFlowUpload:       "upload",
    vboFlowDrawCall:     "draw call",
    vboFlowVertexShader: "Vertex Shader",
    vboFlowVertexPos:    "= vertex pos",

    // ── VAO diagram ─────────────────────────────────────────────────────────
    vaoDiagramTitle: "VAO records bindings so you can replay them with one call",
    vaoBindOnce:     "bind once",
    vaoAttrib0:      "attrib 0 → VBO #1",
    vaoAttrib1:      "attrib 1 → VBO #1",
    vaoIndices:      "indices → EBO #1",
    vaoVboPositions: "VBO #1 (positions)",
    vaoVboTexCoords: "VBO #2 (tex coords)",
    vaoEboIndices:   "EBO #1 (indices)",

    // ── Shader qualifiers table ──────────────────────────────────────────────
    shaderTableHeader0:       "Qualifier",
    shaderTableHeader1:       "Used in",
    shaderTableHeader2:       "Meaning",
    shaderQualInVertex:       "vertex shader",
    shaderQualInFrag:         "fragment shader",
    shaderQualBoth:           "both",
    shaderQualInMeaning:      "Data coming from the VBO (one value per vertex)",
    shaderQualOutMeaning:     "Data passed to the next stage (interpolated)",
    shaderQualInFragMeaning:  "Receives the interpolated out from vertex shader",
    shaderQualUniformMeaning: "Value set from C++, same for all vertices and pixels",

    // ── VBO usage hint table ─────────────────────────────────────────────────
    vboTableHeader0: "Hint",
    vboTableHeader1: "When to use",
    vboStaticDesc:   "Data is set once, used many times. Good for static geometry like terrain or models.",
    vboDynamicDesc:  "Data is modified and used many times. Good for animated or procedural geometry.",
    vboStreamDesc:   "Data is set once, used a few times. Good for per-frame particle systems.",

    // ── Chapter 01: The Graphics Pipeline ───────────────────────────────────
    ch01_intro:
      "OpenGL operates in 3D space, but your screen is a 2D grid of pixels. The graphics pipeline is the sequence of steps that transforms your 3D vertex data into the colored pixels you see. Understanding it is the single most important thing you can do before writing a single line of OpenGL code.",
    ch01_stagesTitle: "The stages",
    ch01_stagesBody:
      "The pipeline is made up of stages, some of which are fixed (you cannot change them, only configure them), and some of which are programmable via small programs called shaders, written in GLSL (OpenGL Shading Language).",
    ch01_stagesNote:
      "The two stages you will interact with most are the Vertex Shader and the Fragment Shader. They are the minimum you need to write before drawing anything to the screen.",
    ch01_ndcTitle: "Normalized Device Coordinates",
    ch01_ndcBody:
      "OpenGL does not use pixel coordinates (0 to 800, 0 to 600). Instead, it defines a coordinate system called Normalized Device Coordinates (NDC) where every axis goes from -1.0 to +1.0. Any vertex outside this range is clipped and not drawn.",
    ch01_ndcAfter: "This is what the three vertices of a simple triangle look like in NDC:",
    ch01_ndcCallout:
      "NDC is not the same as screen space. After the vertex shader runs, OpenGL automatically converts NDC coordinates to screen pixels using the viewport dimensions you set with glViewport(). You do not do this conversion yourself.",
    ch01_vertexShaderTitle: "The Vertex Shader",
    ch01_vertexShaderBody:
      "The vertex shader runs once per vertex. Its only required job is to output the final clip-space position of the vertex through the built-in variable gl_Position. For now, we will pass the vertex position through unchanged.",
    ch01_fragmentShaderTitle: "The Fragment Shader",
    ch01_fragmentShaderBody:
      "After rasterization, the fragment shader runs once per pixel fragment. Its job is to output the final color of that pixel. The output variable can be named anything, but it must be declared as an out vec4.",
    ch01_colorTip:
      "Colors in GLSL are represented as floats in the range 0.0 to 1.0, not 0 to 255. To convert: divide your RGB value by 255. So rgb(255, 128, 51) becomes vec4(1.0, 0.5, 0.2, 1.0).",
    ch01_compileTitle: "How shaders get compiled",
    ch01_compileBody:
      "Shaders are not compiled on your CPU at build time. They are compiled at runtime by the GPU driver. The process looks like this:",
    ch01_compileWarn:
      "Always check for shader compile errors during development. A typo in your GLSL will silently produce a black screen without the error check. The error message from glGetShaderInfoLog tells you the exact line number that failed.",
    ch01_nextTitle: "What comes next",
    ch01_nextBody:
      "Now that you understand the pipeline stages, we need to actually get the vertex data from the CPU to the GPU. That is the job of Vertex Buffer Objects (VBOs), which is exactly what the next chapter covers.",

    // ── Chapter 02: Vertex Buffer Objects ───────────────────────────────────
    ch02_intro:
      "Your vertex data starts as a C++ array living in RAM. The GPU cannot access RAM directly, it can only read from its own memory (VRAM). A Vertex Buffer Object (VBO) is the mechanism OpenGL provides to copy that data from your CPU into the GPU, where the vertex shader can read it.",
    ch02_flowTitle: "The data flow",
    ch02_flowAfter:
      "You define the data, create a buffer on the GPU, upload the data to it with glBufferData, then issue a draw call. The GPU does the rest.",
    ch02_stepTitle:  "Creating a VBO step by step",
    ch02_step1Title: "Step 1: Generate the buffer",
    ch02_step1Body:
      "Everything in OpenGL is identified by an integer ID. You ask OpenGL to create a buffer object and it gives you back an ID you use for all future operations on that buffer.",
    ch02_step2Title: "Step 2: Bind the buffer",
    ch02_step2Body:
      "OpenGL is a state machine. To operate on a buffer, you first bind it, which means make this the currently active buffer of this type. From this point on, any buffer operation will apply to the bound buffer.",
    ch02_step2Callout:
      "OpenGL has multiple buffer targets. GL_ARRAY_BUFFER is for vertex data. You will also see GL_ELEMENT_ARRAY_BUFFER for index buffers when we cover indexed drawing later.",
    ch02_step3Title: "Step 3: Upload the data",
    ch02_step3Body:
      "Now you copy the vertex array from RAM to the GPU with glBufferData. The last argument is a hint to the driver about how often this data will change, which influences where the driver places the buffer in memory.",
    ch02_step3TableIntro: "The three usage hints you need to know:",
    ch02_usageHintTip:
      "These hints do not change the behavior of your program, they are just performance hints. The driver uses them to decide where in GPU memory to place the buffer. Getting them wrong will not break anything, but it may cause unnecessary memory transfers.",
    ch02_interpretTitle: "Telling OpenGL how to interpret the data",
    ch02_interpretBody:
      "The VBO is just a blob of bytes on the GPU. OpenGL does not know that your bytes represent three floats per vertex. You need to tell it using glVertexAttribPointer.",
    ch02_interpretWarn:
      "The first argument (0) must match the layout (location = 0) declaration in your vertex shader. If they do not match, the shader reads garbage data or nothing at all.",
    ch02_fullTitle: "The full VBO setup in one place",
    ch02_nextTitle: "Why you should not stop here",
    ch02_nextBody:
      "The code above works, but it has a problem: every frame you need to rebind the VBO and re-specify the vertex attribute layout. For a single triangle this is fine, but for a real scene with hundreds of meshes it becomes expensive and repetitive. The next chapter introduces Vertex Array Objects (VAOs), which let you record all the VBO bindings and attribute specifications once, then replay them with a single bind call.",

    // ── Chapter 03: Vertex Array Objects ────────────────────────────────────
    ch03_intro:
      "Every time you draw a mesh, OpenGL needs to know which buffer the vertex data lives in, and how that buffer is laid out. Without a VAO you would need to re-specify all of this before every draw call. A Vertex Array Object (VAO) records all of that state once so you can replay it with a single bind.",
    ch03_whatTitle: "What a VAO stores",
    ch03_whatAfter:
      "When a VAO is bound, every call to glVertexAttribPointer and glEnableVertexAttribArray is recorded inside it. The bound GL_ELEMENT_ARRAY_BUFFER (index buffer) is also stored. The GL_ARRAY_BUFFER binding itself is not stored directly, but the association between each attribute and its source buffer is.",
    ch03_createTitle: "Creating and using a VAO",
    ch03_renderLoop:  "Now in the render loop, instead of re-specifying all of that, you just bind the VAO:",
    ch03_goldenRule:
      "The golden rule: create your VAO before you set up your VBOs. If you bind the VBO first and the VAO after, the VAO will not have recorded the attribute pointers.",
    ch03_interleavedTitle: "Interleaved vertex data",
    ch03_interleavedBody:
      "Real vertices have more than just a position. A typical vertex has position, texture coordinates, and a normal vector, all packed together in a single buffer. The stride and offset arguments in glVertexAttribPointer handle this.",

    // ── Chapter 04: First Shaders ────────────────────────────────────────────
    ch04_intro:
      "Shaders are small programs that run on the GPU for every vertex or pixel. Writing them in GLSL feels different from writing C++, but the concepts are familiar: you have types, functions, and control flow. This chapter covers everything you need to write your first pair of shaders.",
    ch04_basicsTitle: "GLSL basics",
    ch04_passingTitle: "Passing data between stages",
    ch04_passingBody:
      "Data flows through the pipeline using qualifiers. The keywords changed between older and modern GLSL:",
    ch04_colorExampleTitle: "A color interpolation example",
    ch04_colorExampleBody:
      "Let us pass a color per vertex and let OpenGL interpolate it across the triangle. This is the classic OpenGL rainbow triangle.",
    ch04_interpolationNote:
      "When the GPU rasterizes a triangle, each pixel fragment gets a color that is the weighted average of the three vertex colors based on how close the pixel is to each vertex. This automatic interpolation is called barycentric interpolation and it is free, you do not need to write any code for it.",
    ch04_uniformTitle: "Uniforms",
    ch04_uniformBody:
      "A uniform is a value you set from your C++ code that stays the same for all vertices in a draw call. It is perfect for things like transformation matrices, time, or a global color tint.",
    ch04_uniformWarn:
      "You must call glUseProgram before setting uniforms. Uniforms belong to the currently active program. Setting a uniform on the wrong program has no effect.",

    // ── Chapter 05: Drawing the Triangle ────────────────────────────────────
    ch05_intro:
      "You now have all the pieces. This chapter puts them together to render a working triangle, the traditional Hello World of graphics programming.",
    ch05_fullTitle: "The complete program",
    ch05_blackScreenTip:
      "If you see a black screen with no errors, the most common causes are: the VAO was bound after the VBO setup, the shader location does not match the attribute pointer index, or the viewport was not set with glViewport.",
    ch05_nextTitle: "What to try next",
    ch05_nextBody:
      "Now that the triangle works, try these exercises before moving on: change the triangle color by modifying the fragment shader, add a second triangle by expanding the vertex array, and try passing a color per vertex as shown in the Shaders chapter.",
  },

  pt: {
    calloutNote:    "NOTA",
    calloutWarning: "ATENÇÃO",
    calloutTip:     "DICA",
    codeCopy:       "copiar",
    codeCopied:     "copiado",

    pipelineProgrammable:     "programável",
    pipelineStageVertex:      "Dados de\nVértice",
    pipelineStageVShader:     "Vertex\nShader",
    pipelineStagePrimAssembly:"Montagem\nPrimitiva",
    pipelineStageGShader:     "Geometry\nShader",
    pipelineStageRaster:      "Rasteriza\nção",
    pipelineStageFShader:     "Fragment\nShader",
    pipelineStageOutput:      "Mesclagem\nde Saída",
    pipelineCpuSide:          "lado CPU",
    pipelineDriver:           "driver",
    pipelineGlsl:             "GLSL",
    pipelineGlslOpt:          "GLSL (opcional)",

    vboFlowCpuRam:       "RAM do CPU",
    vboFlowGpuVram:      "VRAM do GPU",
    vboFlowUpload:       "envio",
    vboFlowDrawCall:     "draw call",
    vboFlowVertexShader: "Vertex Shader",
    vboFlowVertexPos:    "= posição do vértice",

    vaoDiagramTitle: "O VAO grava os bindings para você repeti-los com uma chamada",
    vaoBindOnce:     "bind uma vez",
    vaoAttrib0:      "attrib 0 → VBO #1",
    vaoAttrib1:      "attrib 1 → VBO #1",
    vaoIndices:      "índices → EBO #1",
    vaoVboPositions: "VBO #1 (posições)",
    vaoVboTexCoords: "VBO #2 (coord. textura)",
    vaoEboIndices:   "EBO #1 (índices)",

    shaderTableHeader0:       "Qualificador",
    shaderTableHeader1:       "Usado em",
    shaderTableHeader2:       "Significado",
    shaderQualInVertex:       "vertex shader",
    shaderQualInFrag:         "fragment shader",
    shaderQualBoth:           "ambos",
    shaderQualInMeaning:      "Dado vindo do VBO (um valor por vértice)",
    shaderQualOutMeaning:     "Dado passado para o próximo estágio (interpolado)",
    shaderQualInFragMeaning:  "Recebe o out interpolado do vertex shader",
    shaderQualUniformMeaning: "Valor definido em C++, igual para todos os vértices e pixels",

    vboTableHeader0: "Hint",
    vboTableHeader1: "Quando usar",
    vboStaticDesc:   "Dados definidos uma vez, usados muitas vezes. Bom para geometria estática como terrenos e modelos.",
    vboDynamicDesc:  "Dados modificados e usados muitas vezes. Bom para geometria animada ou procedural.",
    vboStreamDesc:   "Dados definidos uma vez, usados poucas vezes. Bom para sistemas de partículas por frame.",

    ch01_intro:
      "O OpenGL opera em espaço 3D, mas sua tela é uma grade 2D de pixels. O pipeline gráfico é a sequência de etapas que transforma os dados de vértice 3D nos pixels coloridos que você vê. Entendê-lo é a coisa mais importante que você pode fazer antes de escrever uma única linha de código OpenGL.",
    ch01_stagesTitle: "Os estágios",
    ch01_stagesBody:
      "O pipeline é composto de estágios: alguns são fixos (você não pode alterá-los, apenas configurá-los) e outros são programáveis através de pequenos programas chamados shaders, escritos em GLSL.",
    ch01_stagesNote:
      "Os dois estágios com que você mais vai interagir são o Vertex Shader e o Fragment Shader. Eles são o mínimo que você precisa escrever antes de desenhar qualquer coisa na tela.",
    ch01_ndcTitle: "Coordenadas de Dispositivo Normalizadas",
    ch01_ndcBody:
      "O OpenGL não usa coordenadas de pixel. Em vez disso, define um sistema chamado NDC onde cada eixo vai de -1.0 a +1.0. Qualquer vértice fora desse intervalo é cortado e não é desenhado.",
    ch01_ndcAfter: "Veja como os três vértices de um triângulo simples ficam em NDC:",
    ch01_ndcCallout:
      "NDC não é o mesmo que espaço de tela. Após o vertex shader executar, o OpenGL converte automaticamente as coordenadas NDC para pixels usando as dimensões do viewport definidas em glViewport(). Você não faz essa conversão manualmente.",
    ch01_vertexShaderTitle: "O Vertex Shader",
    ch01_vertexShaderBody:
      "O vertex shader executa uma vez por vértice. Sua única tarefa obrigatória é produzir a posição final do vértice no espaço de clip através da variável embutida gl_Position.",
    ch01_fragmentShaderTitle: "O Fragment Shader",
    ch01_fragmentShaderBody:
      "Após a rasterização, o fragment shader executa uma vez por fragmento de pixel. Seu trabalho é produzir a cor final daquele pixel. A variável de saída deve ser declarada como out vec4.",
    ch01_colorTip:
      "Cores em GLSL são representadas como floats no intervalo 0.0 a 1.0, não 0 a 255. Para converter: divida o valor RGB por 255. Então rgb(255, 128, 51) vira vec4(1.0, 0.5, 0.2, 1.0).",
    ch01_compileTitle: "Como os shaders são compilados",
    ch01_compileBody:
      "Shaders não são compilados no CPU em tempo de build. Eles são compilados em tempo de execução pelo driver da GPU.",
    ch01_compileWarn:
      "Sempre verifique erros de compilação do shader durante o desenvolvimento. Um erro de digitação no GLSL produzirá silenciosamente uma tela preta. A mensagem de glGetShaderInfoLog indica exatamente o número da linha que falhou.",
    ch01_nextTitle: "O que vem a seguir",
    ch01_nextBody:
      "Agora que você entende os estágios do pipeline, precisamos levar os dados de vértice do CPU para a GPU. Esse é o papel dos Vertex Buffer Objects (VBOs), que é exatamente o que o próximo capítulo cobre.",

    ch02_intro:
      "Seus dados de vértice começam como um array C++ na RAM. A GPU não consegue acessar a RAM diretamente, ela só pode ler da sua própria memória (VRAM). Um VBO é o mecanismo que o OpenGL fornece para copiar esses dados do CPU para a GPU.",
    ch02_flowTitle:       "O fluxo de dados",
    ch02_flowAfter:       "Você define os dados, cria um buffer na GPU, faz o upload com glBufferData e emite um draw call. A GPU faz o resto.",
    ch02_stepTitle:       "Criando um VBO passo a passo",
    ch02_step1Title:      "Passo 1: Gerar o buffer",
    ch02_step1Body:       "Tudo em OpenGL é identificado por um ID inteiro. Você pede ao OpenGL que crie um buffer e ele retorna um ID para operações futuras.",
    ch02_step2Title:      "Passo 2: Fazer o bind do buffer",
    ch02_step2Body:       "OpenGL é uma máquina de estados. Para operar em um buffer, você primeiro faz o bind dele, tornando-o o buffer ativo daquele tipo.",
    ch02_step2Callout:    "GL_ARRAY_BUFFER é para dados de vértice. Você também verá GL_ELEMENT_ARRAY_BUFFER para index buffers quando cobrirmos desenho indexado.",
    ch02_step3Title:      "Passo 3: Fazer o upload dos dados",
    ch02_step3Body:       "Você copia o array de vértices da RAM para a GPU com glBufferData. O último argumento é uma dica para o driver sobre a frequência de mudança dos dados.",
    ch02_step3TableIntro: "Os três hints de uso que você precisa conhecer:",
    ch02_usageHintTip:    "Esses hints são apenas dicas de performance. Usar o errado não vai quebrar nada, mas pode causar transferências desnecessárias de memória.",
    ch02_interpretTitle:  "Dizendo ao OpenGL como interpretar os dados",
    ch02_interpretBody:   "O VBO é apenas um bloco de bytes na GPU. O OpenGL não sabe que seus bytes representam três floats por vértice. Você precisa informá-lo usando glVertexAttribPointer.",
    ch02_interpretWarn:   "O primeiro argumento (0) deve corresponder à declaração layout (location = 0) no seu vertex shader. Se não corresponderem, o shader lê dados inválidos.",
    ch02_fullTitle:       "O setup completo do VBO em um só lugar",
    ch02_nextTitle:       "Por que você não deve parar aqui",
    ch02_nextBody:        "O próximo capítulo apresenta os VAOs, que permitem gravar todos os bindings e especificações de atributos uma vez e repeti-los com uma única chamada.",

    ch03_intro:
      "Toda vez que você desenha um mesh, o OpenGL precisa saber em qual buffer os dados de vértice estão e como esse buffer está organizado. Um VAO grava todo esse estado uma vez para que você possa repeti-lo com um único bind.",
    ch03_whatTitle:       "O que um VAO armazena",
    ch03_whatAfter:       "Quando um VAO está vinculado, cada chamada a glVertexAttribPointer e glEnableVertexAttribArray é gravada nele.",
    ch03_createTitle:     "Criando e usando um VAO",
    ch03_renderLoop:      "Agora no render loop, você apenas faz o bind do VAO:",
    ch03_goldenRule:      "A regra de ouro: crie o VAO antes de configurar os VBOs. Se você vincular o VBO primeiro, o VAO não terá gravado os attribute pointers.",
    ch03_interleavedTitle:"Dados de vértice intercalados",
    ch03_interleavedBody: "Vértices reais têm posição, coordenadas de textura e vetor normal, todos empacotados em um único buffer. Os argumentos stride e offset em glVertexAttribPointer lidam com isso.",

    ch04_intro:
      "Shaders são pequenos programas que executam na GPU para cada vértice ou pixel. Este capítulo cobre tudo que você precisa para escrever seu primeiro par de shaders.",
    ch04_basicsTitle:       "Fundamentos do GLSL",
    ch04_passingTitle:      "Passando dados entre estágios",
    ch04_passingBody:       "Os dados fluem pelo pipeline usando qualificadores:",
    ch04_colorExampleTitle: "Exemplo de interpolação de cores",
    ch04_colorExampleBody:  "Vamos passar uma cor por vértice e deixar o OpenGL interpolá-la pelo triângulo. Este é o clássico triângulo colorido do OpenGL.",
    ch04_interpolationNote: "Quando a GPU rasteriza um triângulo, cada fragmento recebe a média ponderada das três cores de vértice. Essa interpolação automática se chama interpolação baricêntrica e é gratuita.",
    ch04_uniformTitle:      "Uniforms",
    ch04_uniformBody:       "Um uniform é um valor que você define do C++ e que permanece igual para todos os vértices do draw call. Perfeito para matrizes de transformação, tempo ou cor global.",
    ch04_uniformWarn:       "Você deve chamar glUseProgram antes de definir uniforms. Os uniforms pertencem ao programa ativo no momento.",

    ch05_intro:          "Agora você tem todas as peças. Este capítulo as une para renderizar um triângulo funcional, o tradicional Hello World da programação gráfica.",
    ch05_fullTitle:      "O programa completo",
    ch05_blackScreenTip: "Se você ver uma tela preta sem erros, as causas mais comuns são: o VAO foi vinculado depois do setup do VBO, o location do shader não corresponde ao índice do attribute pointer, ou o viewport não foi configurado com glViewport.",
    ch05_nextTitle:      "O que tentar em seguida",
    ch05_nextBody:       "Agora que o triângulo funciona, tente: mudar a cor modificando o fragment shader, adicionar um segundo triângulo expandindo o array de vértices, e tentar passar uma cor por vértice como mostrado no capítulo de Shaders.",
  },

  es: {
    calloutNote:    "NOTA",
    calloutWarning: "ADVERTENCIA",
    calloutTip:     "CONSEJO",
    codeCopy:       "copiar",
    codeCopied:     "copiado",

    pipelineProgrammable:     "programable",
    pipelineStageVertex:      "Datos de\nVértice",
    pipelineStageVShader:     "Vertex\nShader",
    pipelineStagePrimAssembly:"Ensamblaje\nPrimitivo",
    pipelineStageGShader:     "Geometry\nShader",
    pipelineStageRaster:      "Rasteri\nzación",
    pipelineStageFShader:     "Fragment\nShader",
    pipelineStageOutput:      "Mezcla de\nSalida",
    pipelineCpuSide:          "lado CPU",
    pipelineDriver:           "driver",
    pipelineGlsl:             "GLSL",
    pipelineGlslOpt:          "GLSL (opcional)",

    vboFlowCpuRam:       "RAM del CPU",
    vboFlowGpuVram:      "VRAM del GPU",
    vboFlowUpload:       "carga",
    vboFlowDrawCall:     "draw call",
    vboFlowVertexShader: "Vertex Shader",
    vboFlowVertexPos:    "= posición del vértice",

    vaoDiagramTitle: "El VAO graba los bindings para reproducirlos con una sola llamada",
    vaoBindOnce:     "bind una vez",
    vaoAttrib0:      "attrib 0 → VBO #1",
    vaoAttrib1:      "attrib 1 → VBO #1",
    vaoIndices:      "índices → EBO #1",
    vaoVboPositions: "VBO #1 (posiciones)",
    vaoVboTexCoords: "VBO #2 (coord. textura)",
    vaoEboIndices:   "EBO #1 (índices)",

    shaderTableHeader0:       "Calificador",
    shaderTableHeader1:       "Usado en",
    shaderTableHeader2:       "Significado",
    shaderQualInVertex:       "vertex shader",
    shaderQualInFrag:         "fragment shader",
    shaderQualBoth:           "ambos",
    shaderQualInMeaning:      "Dato proveniente del VBO (un valor por vértice)",
    shaderQualOutMeaning:     "Dato enviado al siguiente estágio (interpolado)",
    shaderQualInFragMeaning:  "Recibe el out interpolado del vertex shader",
    shaderQualUniformMeaning: "Valor establecido desde C++, igual para todos los vértices y píxeles",

    vboTableHeader0: "Hint",
    vboTableHeader1: "Cuándo usar",
    vboStaticDesc:   "Datos definidos una vez, usados muchas veces. Bueno para geometría estática.",
    vboDynamicDesc:  "Datos modificados y usados muchas veces. Bueno para geometría animada.",
    vboStreamDesc:   "Datos definidos una vez, usados pocas veces. Bueno para partículas por fotograma.",

    ch01_intro:
      "OpenGL opera en espacio 3D, pero tu pantalla es una cuadrícula 2D de píxeles. El pipeline gráfico es la secuencia de pasos que transforma tus datos de vértice 3D en los píxeles de color que ves.",
    ch01_stagesTitle: "Los estágios",
    ch01_stagesBody:
      "El pipeline tiene etapas fijas (solo configurables) y etapas programables mediante shaders escritos en GLSL.",
    ch01_stagesNote:
      "Las dos etapas con las que más interactuarás son el Vertex Shader y el Fragment Shader.",
    ch01_ndcTitle: "Coordenadas de Dispositivo Normalizadas",
    ch01_ndcBody:
      "OpenGL usa un sistema de coordenadas llamado NDC donde cada eje va de -1.0 a +1.0. Cualquier vértice fuera de ese rango se recorta.",
    ch01_ndcAfter: "Así se ven los tres vértices de un triángulo simple en NDC:",
    ch01_ndcCallout:
      "NDC no es lo mismo que el espacio de pantalla. OpenGL convierte automáticamente las coordenadas NDC a píxeles usando las dimensiones del viewport de glViewport().",
    ch01_vertexShaderTitle: "El Vertex Shader",
    ch01_vertexShaderBody:
      "El vertex shader se ejecuta una vez por vértice. Su única tarea obligatoria es producir la posición final en clip-space a través de gl_Position.",
    ch01_fragmentShaderTitle: "El Fragment Shader",
    ch01_fragmentShaderBody:
      "Tras la rasterización, el fragment shader se ejecuta una vez por fragmento de píxel. Su trabajo es producir el color final del píxel.",
    ch01_colorTip:
      "Los colores en GLSL son floats de 0.0 a 1.0. Para convertir: divide tu valor RGB entre 255.",
    ch01_compileTitle: "Cómo se compilan los shaders",
    ch01_compileBody:
      "Los shaders se compilan en tiempo de ejecución por el driver de la GPU, no en tu CPU.",
    ch01_compileWarn:
      "Siempre comprueba errores de compilación del shader. Un error tipográfico producirá una pantalla negra sin avisar.",
    ch01_nextTitle: "Qué viene después",
    ch01_nextBody:
      "Necesitamos llevar los datos de vértice del CPU a la GPU. Ese es el trabajo de los Vertex Buffer Objects, el tema del próximo capítulo.",

    ch02_intro:
      "Tus datos de vértice comienzan como un array C++ en RAM. La GPU no puede acceder a la RAM directamente. Un VBO es el mecanismo que OpenGL proporciona para copiar esos datos al GPU.",
    ch02_flowTitle:       "El flujo de datos",
    ch02_flowAfter:       "Defines los datos, creas un buffer en la GPU, subes los datos con glBufferData y emites un draw call.",
    ch02_stepTitle:       "Creando un VBO paso a paso",
    ch02_step1Title:      "Paso 1: Generar el buffer",
    ch02_step1Body:       "Todo en OpenGL se identifica con un ID entero. Le pides a OpenGL que cree un buffer y te devuelve un ID.",
    ch02_step2Title:      "Paso 2: Hacer el bind del buffer",
    ch02_step2Body:       "OpenGL es una máquina de estados. Para operar en un buffer, primero haces su bind.",
    ch02_step2Callout:    "GL_ARRAY_BUFFER es para datos de vértice. GL_ELEMENT_ARRAY_BUFFER es para index buffers.",
    ch02_step3Title:      "Paso 3: Subir los datos",
    ch02_step3Body:       "Copias el array de vértices de RAM a la GPU con glBufferData.",
    ch02_step3TableIntro: "Los tres hints de uso que necesitas conocer:",
    ch02_usageHintTip:    "Estos hints son solo sugerencias de rendimiento. Usarlos incorrectamente no romperá nada.",
    ch02_interpretTitle:  "Diciéndole a OpenGL cómo interpretar los datos",
    ch02_interpretBody:   "El VBO es solo bytes en la GPU. Necesitas decirle a OpenGL cómo interpretarlos usando glVertexAttribPointer.",
    ch02_interpretWarn:   "El primer argumento (0) debe coincidir con layout (location = 0) en tu vertex shader.",
    ch02_fullTitle:       "El setup completo del VBO en un solo lugar",
    ch02_nextTitle:       "Por qué no deberías detenerte aquí",
    ch02_nextBody:        "El siguiente capítulo presenta los VAOs, que permiten grabar todos los bindings una vez y reproducirlos con una sola llamada.",

    ch03_intro:
      "Cada vez que dibujas un mesh, OpenGL necesita saber en qué buffer están los datos. Un VAO graba todo ese estado una vez.",
    ch03_whatTitle:       "Qué almacena un VAO",
    ch03_whatAfter:       "Cuando un VAO está vinculado, cada llamada a glVertexAttribPointer y glEnableVertexAttribArray se graba en él.",
    ch03_createTitle:     "Creando y usando un VAO",
    ch03_renderLoop:      "En el render loop, solo haces el bind del VAO:",
    ch03_goldenRule:      "La regla de oro: crea el VAO antes de configurar los VBOs.",
    ch03_interleavedTitle:"Datos de vértice intercalados",
    ch03_interleavedBody: "Los vértices reales tienen posición, coordenadas de textura y normal, todo en un solo buffer.",

    ch04_intro:
      "Los shaders son pequeños programas en la GPU para cada vértice o píxel. Este capítulo cubre todo lo necesario para tu primer par de shaders.",
    ch04_basicsTitle:       "Fundamentos de GLSL",
    ch04_passingTitle:      "Pasando datos entre etapas",
    ch04_passingBody:       "Los datos fluyen por el pipeline usando calificadores:",
    ch04_colorExampleTitle: "Ejemplo de interpolación de color",
    ch04_colorExampleBody:  "Vamos a pasar un color por vértice y dejar que OpenGL lo interpole en el triángulo.",
    ch04_interpolationNote: "La GPU interpola automáticamente los colores usando interpolación baricéntrica. No necesitas escribir código para esto.",
    ch04_uniformTitle:      "Uniforms",
    ch04_uniformBody:       "Un uniform es un valor definido desde C++ que permanece igual para todos los vértices del draw call.",
    ch04_uniformWarn:       "Debes llamar a glUseProgram antes de definir uniforms.",

    ch05_intro:          "Ya tienes todas las piezas. Este capítulo las une para renderizar el Hello World de la programación gráfica.",
    ch05_fullTitle:      "El programa completo",
    ch05_blackScreenTip: "Pantalla negra sin errores: el VAO se vinculó después del VBO, el location del shader no coincide, o falta glViewport.",
    ch05_nextTitle:      "Qué probar a continuación",
    ch05_nextBody:       "Cambia el color del triángulo, añade un segundo triángulo, y prueba a pasar colores por vértice.",
  },

  zh: {
    calloutNote:    "注意",
    calloutWarning: "警告",
    calloutTip:     "提示",
    codeCopy:       "复制",
    codeCopied:     "已复制",

    pipelineProgrammable:     "可编程",
    pipelineStageVertex:      "顶点\n数据",
    pipelineStageVShader:     "顶点\n着色器",
    pipelineStagePrimAssembly:"图元\n装配",
    pipelineStageGShader:     "几何\n着色器",
    pipelineStageRaster:      "光栅\n化",
    pipelineStageFShader:     "片段\n着色器",
    pipelineStageOutput:      "输出\n合并",
    pipelineCpuSide:          "CPU端",
    pipelineDriver:           "驱动",
    pipelineGlsl:             "GLSL",
    pipelineGlslOpt:          "GLSL（可选）",

    vboFlowCpuRam:       "CPU内存",
    vboFlowGpuVram:      "GPU显存",
    vboFlowUpload:       "上传",
    vboFlowDrawCall:     "绘制调用",
    vboFlowVertexShader: "顶点着色器",
    vboFlowVertexPos:    "= 顶点位置",

    vaoDiagramTitle: "VAO记录绑定状态，只需一次调用即可重放",
    vaoBindOnce:     "绑定一次",
    vaoAttrib0:      "属性0 → VBO #1",
    vaoAttrib1:      "属性1 → VBO #1",
    vaoIndices:      "索引 → EBO #1",
    vaoVboPositions: "VBO #1（位置）",
    vaoVboTexCoords: "VBO #2（纹理坐标）",
    vaoEboIndices:   "EBO #1（索引）",

    shaderTableHeader0:       "限定符",
    shaderTableHeader1:       "使用位置",
    shaderTableHeader2:       "含义",
    shaderQualInVertex:       "顶点着色器",
    shaderQualInFrag:         "片段着色器",
    shaderQualBoth:           "两者",
    shaderQualInMeaning:      "来自VBO的数据（每个顶点一个值）",
    shaderQualOutMeaning:     "传递给下一阶段的数据（已插值）",
    shaderQualInFragMeaning:  "接收来自顶点着色器的插值out",
    shaderQualUniformMeaning: "从C++设置的值，对所有顶点和像素相同",

    vboTableHeader0: "提示",
    vboTableHeader1: "使用场景",
    vboStaticDesc:   "数据设置一次，多次使用。适用于静态几何体。",
    vboDynamicDesc:  "数据频繁修改和使用。适用于动画几何体。",
    vboStreamDesc:   "数据设置一次，少量使用。适用于每帧粒子系统。",

    ch01_intro:
      "OpenGL在3D空间中运作，但屏幕是2D像素网格。图形管线是将3D顶点数据转换为屏幕像素的步骤序列，理解它是编写OpenGL代码前最重要的事情。",
    ch01_stagesTitle: "管线阶段",
    ch01_stagesBody:  "管线由固定阶段（只能配置）和可编程阶段（通过GLSL着色器）组成。",
    ch01_stagesNote:  "顶点着色器和片段着色器是你最常交互的两个阶段，也是绘制任何内容所需的最低要求。",
    ch01_ndcTitle:    "标准化设备坐标",
    ch01_ndcBody:     "OpenGL使用NDC坐标系，每个轴从-1.0到+1.0。超出范围的顶点会被裁剪。",
    ch01_ndcAfter:    "简单三角形的三个顶点在NDC中的样子：",
    ch01_ndcCallout:  "NDC不是屏幕空间。顶点着色器运行后，OpenGL自动将NDC坐标转换为像素，使用glViewport()设置的尺寸。",
    ch01_vertexShaderTitle: "顶点着色器",
    ch01_vertexShaderBody:  "顶点着色器每个顶点运行一次，必须通过gl_Position输出最终位置。",
    ch01_fragmentShaderTitle: "片段着色器",
    ch01_fragmentShaderBody:  "光栅化后，片段着色器每个像素片段运行一次，输出最终颜色，必须声明为out vec4。",
    ch01_colorTip:     "GLSL中颜色用0.0到1.0的浮点数表示。转换：将RGB值除以255。",
    ch01_compileTitle: "着色器如何编译",
    ch01_compileBody:  "着色器在运行时由GPU驱动编译，不是在构建时编译。",
    ch01_compileWarn:  "开发时务必检查着色器编译错误。GLSL拼写错误会悄无声息地产生黑屏。glGetShaderInfoLog会告诉你失败的行号。",
    ch01_nextTitle:    "接下来",
    ch01_nextBody:     "现在理解了管线，需要将顶点数据从CPU传输到GPU，这就是VBO的工作。",

    ch02_intro:
      "顶点数据是CPU RAM中的C++数组，GPU无法直接访问RAM。VBO是OpenGL提供的将数据复制到GPU显存的机制。",
    ch02_flowTitle:       "数据流",
    ch02_flowAfter:       "定义数据、在GPU创建缓冲区、用glBufferData上传、发出绘制调用，GPU完成其余工作。",
    ch02_stepTitle:       "逐步创建VBO",
    ch02_step1Title:      "第一步：生成缓冲区",
    ch02_step1Body:       "OpenGL中一切由整数ID标识。请求OpenGL创建缓冲区，它返回一个ID。",
    ch02_step2Title:      "第二步：绑定缓冲区",
    ch02_step2Body:       "OpenGL是状态机。要操作缓冲区，先绑定它，使其成为当前活动缓冲区。",
    ch02_step2Callout:    "GL_ARRAY_BUFFER用于顶点数据，GL_ELEMENT_ARRAY_BUFFER用于索引缓冲区。",
    ch02_step3Title:      "第三步：上传数据",
    ch02_step3Body:       "用glBufferData将顶点数组从RAM复制到GPU。最后参数是关于数据更改频率的提示。",
    ch02_step3TableIntro: "你需要了解的三个使用提示：",
    ch02_usageHintTip:    "这些提示只是性能建议，不影响程序行为。用错了不会破坏任何东西。",
    ch02_interpretTitle:  "告诉OpenGL如何解释数据",
    ch02_interpretBody:   "VBO只是GPU上的字节块，需要用glVertexAttribPointer告知OpenGL如何解释。",
    ch02_interpretWarn:   "第一个参数（0）必须与顶点着色器中的layout (location = 0)匹配。",
    ch02_fullTitle:       "完整的VBO设置",
    ch02_nextTitle:       "为什么不应在此停止",
    ch02_nextBody:        "下一章介绍VAO，允许你记录所有绑定和属性规格一次，然后用单次绑定重放。",

    ch03_intro:
      "每次绘制网格，OpenGL需要知道数据在哪个缓冲区。VAO将该状态记录一次，让你用单次绑定重放。",
    ch03_whatTitle:       "VAO存储什么",
    ch03_whatAfter:       "绑定VAO时，对glVertexAttribPointer和glEnableVertexAttribArray的每次调用都会被记录。",
    ch03_createTitle:     "创建和使用VAO",
    ch03_renderLoop:      "现在在渲染循环中，只需绑定VAO：",
    ch03_goldenRule:      "黄金法则：在设置VBO之前创建VAO。",
    ch03_interleavedTitle:"交错顶点数据",
    ch03_interleavedBody: "真实顶点有位置、纹理坐标和法向量，全部打包在一个缓冲区中。",

    ch04_intro:
      "着色器是在GPU上为每个顶点或像素运行的小程序。本章涵盖编写第一对着色器所需的一切。",
    ch04_basicsTitle:       "GLSL基础",
    ch04_passingTitle:      "在阶段间传递数据",
    ch04_passingBody:       "数据通过限定符在管线中流动：",
    ch04_colorExampleTitle: "颜色插值示例",
    ch04_colorExampleBody:  "为每个顶点传递颜色，让OpenGL在三角形上插值，这是经典的彩虹三角形。",
    ch04_interpolationNote: "GPU光栅化时自动进行重心插值，每个像素获得三个顶点颜色的加权平均值，完全免费。",
    ch04_uniformTitle:      "Uniform变量",
    ch04_uniformBody:       "uniform是从C++设置的值，在绘制调用的所有顶点中保持不变。",
    ch04_uniformWarn:       "设置uniform前必须调用glUseProgram。",

    ch05_intro:          "你现在拥有所有零件。本章将它们组合，渲染图形编程传统的Hello World。",
    ch05_fullTitle:      "完整程序",
    ch05_blackScreenTip: "黑屏无错误的常见原因：VAO在VBO设置后绑定、着色器location与属性指针索引不匹配、或未用glViewport设置视口。",
    ch05_nextTitle:      "接下来尝试什么",
    ch05_nextBody:       "修改片段着色器改变颜色，扩展顶点数组添加第二个三角形，尝试为每个顶点传递颜色。",
  },
};

export type OpenGLLang = keyof typeof openglTranslations;