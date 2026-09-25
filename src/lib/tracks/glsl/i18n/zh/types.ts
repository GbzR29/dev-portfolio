// ZH text for src/lib/tracks/glsl/chapters/types.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  glsl01_intro: "GLSL在一个特定领域的类型系统比C++更丰富：直接映射到GPU寄存器的内置向量和矩阵类型。",
  glsl01_scalarsTitle: "标量类型",
  glsl01_scalarsBody: "GLSL有四种标量类型。float最常用，大多数着色器数学使用它。",
  glsl01_vectorsTitle: "向量类型",
  glsl01_vectorsBody: "向量是GLSL中最重要的类型：vec2、vec3、vec4用于位置、颜色、方向和UV坐标。",
  glsl01_swizzleTitle: "分量重排（Swizzling）",
  glsl01_swizzleBody: "Swizzling允许在单个表达式中重新排列和选择向量分量，可用.xyzw、.rgba或.stpq。",
  glsl01_constructorsTitle: "构造函数",
  glsl01_constructorsBody: "向量通过调用类型作为函数构造。单个标量填充所有分量：vec3(1.0)创建(1.0, 1.0, 1.0)。",
  glsl01_matricesTitle: "矩阵",
  glsl01_matricesBody: "mat4是列主序4×4矩阵。mat4(1.0)创建单位矩阵。",
  glsl01_castingTitle: "类型转换",
  glsl01_castingBody: "GLSL没有隐式转换，必须显式转换：float(myInt)、int(myFloat)。",
};

export default text;
