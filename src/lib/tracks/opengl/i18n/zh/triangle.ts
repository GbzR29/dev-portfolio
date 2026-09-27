// ZH text for src/lib/tracks/opengl/chapters/triangle.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  ch05_intro: "你现在拥有所有零件。本章将它们组合，渲染图形编程传统的Hello World。",
  ch05_fullTitle: "完整程序",
  ch05_blackScreenTip: "如果只看到清屏颜色且没有错误，最常见的原因是：glVertexAttribPointer执行时（或绘制时）没有绑定VAO；着色器的layout location与属性索引不一致；着色器编译或链接失败（像上面的代码那样检查两个日志）；或者顶点位于NDC的[-1, 1]范围之外。",
  ch05_nextTitle: "接下来尝试什么",
  ch05_nextBody: "修改片段着色器改变颜色，扩展顶点数组添加第二个三角形，尝试为每个顶点传递颜色。",
  ch05_windingWarn: "数组中顶点的顺序并不是随意的——它决定了面的环绕顺序。OpenGL默认把逆时针（CCW）的三角形视为正面。“面环绕与剔除”一章会解释这为什么重要。",
};

export default text;
