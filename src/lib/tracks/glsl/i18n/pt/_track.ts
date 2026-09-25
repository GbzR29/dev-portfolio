// PT chapter titles and section names for the glsl track (see glsl/index.tsx).

const track = {
  titles: {
    types: "Tipos e vetores",
    builtins: "Funções embutidas",
    fragcoord: "Coordenadas de fragmento e UV",
    playground: "O playground de shaders",
    sdf: "Funções de distância com sinal",
    patterns: "Padrões e transformações",
    color: "Cor",
    noise: "Ruído e padrões procedurais",
    texturing: "Truques de texturização",
    water: "Ondas e água",
    glass: "Vidro, refração e Fresnel",
    fog: "Neblina",
    stylized: "Toon, dissolve e holograma",
    raymarching: "Raymarching",
    raytracing: "Ray tracing",
    pathtracing: "Path tracing",
    "rt-accel": "Aceleração e denoising",
    shaderclass: "Classe Shader em C++",
  } as Record<string, string>,
  sections: {
    "Language Basics": "Fundamentos da linguagem",
    "Shapes, Patterns & Colour": "Formas, padrões e cor",
    "Effect Recipes": "Receitas de efeitos",
    Raymarching: "Raymarching",
    "Ray & Path Tracing": "Ray tracing e path tracing",
    Tooling: "Ferramentas",
  } as Record<string, string>,
};

export default track;
