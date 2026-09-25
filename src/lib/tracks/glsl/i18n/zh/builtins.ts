// ZH text for src/lib/tracks/glsl/chapters/builtins.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  glsl02_intro: "GLSL附带大型内置函数库，原生硬件实现，比自己编写的任何代码都快。",
  glsl02_mathTitle: "数学函数",
  glsl02_mathBody: "核心数学函数对向量逐分量操作，非常适合逐通道颜色运算。",
  glsl02_interpTitle: "插值函数",
  glsl02_interpBody: "GLSL中最常用的函数，控制值在状态间的过渡。",
  glsl02_smoothstepNote: "smoothstep产生平滑S曲线过渡，用于抗锯齿边缘和溶解效果。",
  glsl02_geoTitle: "几何函数",
  glsl02_geoBody: "在光照、物理和光线步进中大量使用，对整个向量操作。",
  glsl02_trigTitle: "三角函数",
  glsl02_trigBody: "所有三角函数使用弧度。结合sin和cos可以描绘圆形轨迹。",
};

export default text;
