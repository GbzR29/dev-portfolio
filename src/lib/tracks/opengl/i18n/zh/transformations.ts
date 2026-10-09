// ZH text for src/lib/tracks/opengl/chapters/transformations.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  ch08_intro: "目前所有内容都在固定NDC坐标。要移动旋转缩放对象并放置相机，需要矩阵数学。GLM是镜像GLSL数学类型的header-only C++库。",
  ch08_glmTitle: "向项目添加GLM",
  ch08_mvpTitle: "MVP矩阵",
  ch08_mvpBody: "每个顶点到达屏幕前经过三次变换。每次变换是4×4矩阵，逆序相乘：gl_Position = 投影 × 视图 × 模型 × 顶点。",
  mvpHeader0: "矩阵",
  mvpHeader1: "用途",
  mvpHeader2: "GLM函数",
  mvpModel: "在世界空间放置对象（平移/旋转/缩放）",
  mvpView: "模拟相机——将世界空间变换到相机空间",
  mvpProjection: "应用透视——远处物体显得更小",
  ch08_modelTitle: "模型矩阵——放置对象",
  ch08_modelBody: "从单位矩阵开始应用变换。顺序重要：先缩放，再旋转，再平移。",
  ch08_viewTitle: "视图矩阵——相机",
  ch08_viewBody: "glm::lookAt接受相机位置、观察点和向上方向三个向量。",
  ch08_projTitle: "投影矩阵——透视",
  ch08_projBody: "glm::perspective创建视锥体，远处物体显得更小。参数：垂直FOV、宽高比、近远裁剪面。",
  ch08_nearWarn: "近平面永远不要设为0。把n = 0代入上面的矩阵，第三行变成(0, 0, −1, 0)：z_clip = −z = w，于是透视除法之后所有点都落在z_ndc = 1，深度缓冲再也无法区分任何东西。即使是很小的正值near也代价不小，因为深度精度集中在相机正前方。在场景允许的范围内尽量把它推远（0.1是常见默认值）；“深度测试”一章会解释原因。",
  ch08_shaderTitle: "在顶点着色器中应用MVP",
  ch08_animTip: "将角度乘以glfwGetTime()可实现每帧旋转动画。",
  ch08_orthoTitle: "投影矩阵——正交",
  ch08_orthoBody: "正交投影没有透视：物体无论多远都保持大小，平行线保持平行。它的视锥体是一个盒子而不是棱锥，由六个平面确定：左、右、下、上、近、远。glm::ortho只用每个轴上的缩放和平移，就把这个盒子映射到NDC立方体。2D游戏和UI、CAD和编辑器视图、以及方向光的阴影贴图都使用它。",
  ch08_orthoEqLabel: "glm::ortho(l, r, b, t, n, f)",
  ch08_wLR: "盒子左、右两侧的x（观察空间）",
  ch08_wBT: "盒子下、上两侧的y",
  ch08_wNF2: "到相机前方近、远平面的距离（观察空间中z = −n和−f）",
  ch08_orthoEqNote: "对角线上的每一项把盒子的一条边长压缩到NDC的2个单位，最后一列把盒子中心移到0。最后一行是(0, 0, 0, 1)，所以w保持为1，除法不改变任何东西：这就是没有透视的原因。与透视投影不同，深度是线性存储的，并且允许n = 0。",
};

export default text;
