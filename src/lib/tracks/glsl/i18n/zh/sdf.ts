// ZH text for src/lib/tracks/glsl/chapters/sdf.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  glsl04_intro: "有符号距离函数(SDF)返回点到形状最近表面的距离。负值在内部，正值在外部，零在边缘上。",
  glsl04_conceptTitle: "概念",
  glsl04_conceptBody: "在当前UV位置采样SDF。负值（内部）输出形状颜色，用smoothstep实现边缘抗锯齿。",
  glsl04_circleTitle: "SDF：圆形",
  glsl04_circleBody: "最简单的SDF：length(p) - r。",
  glsl04_boxTitle: "SDF：矩形",
  glsl04_boxBody: "精确盒子SDF使用逐分量操作，b是盒子的半尺寸。",
  glsl04_combineTitle: "组合形状",
  glsl04_combineBody: "SDF返回距离，可以用简单数学组合——无需特殊API。",
  glsl04_combineWarn: "平滑联合(smin)用参数k平滑混合两个形状边界，这是制作有机形态和元球的方法。",
};

export default text;
