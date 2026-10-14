"use client";

// OpenGL track — "Drawing a Cube". Code-along continuation of the tilted,
// textured square from "Transformations + GLM": counting what a cube needs
// (8 corners, 12 triangles, 36 corners to read); the three ways to feed those
// 36 corners (glDrawArrays with 36 vertices, an EBO with 8, an EBO with 24) and
// what a vertex really is (figure); step 1, a colour cube from 8 vertices;
// step 2, the depth test; step 3, the textured cube from 24 vertices; the same
// cube with glDrawArrays (the LearnOpenGL layout); the code-along checkpoint;
// what you see and why; mistakes.

import { CodeBlock, Callout, H2, H3, IC, LessonTable } from "@/components/lesson/LessonComponents";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { CubeBuildFigure } from "@/components/lesson/figures/glintro/CubeBuildFigure";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export function CubeContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglCube_intro",
          "The last chapter ended with a square tilted back in perspective. A cube is six of those squares, folded into a box. That sounds like a small step, but it raises three new questions. How many vertices does a cube need? Do you need an index buffer? And why do the back faces show through the front ones? This chapter answers them one at a time, in three short steps.")}
      </Lead>

      <Goals t={t} id="oglCube" items={[
        "Count what a cube needs: 8 corners, 12 triangles, 36 corners to read.",
        "Choose between glDrawArrays, an EBO with 8 vertices and an EBO with 24.",
        "Draw a coloured cube, then a textured one, with the depth test on.",
        "Explain why one corner can be three different vertices.",
      ]} />

      {/* ── WHAT CHANGES ────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglCube_alongTitle", "What this chapter adds to main.cpp")}</H2>
      <p>
        {tx(t, "oglCube_alongBody",
          "It continues the main.cpp from the end of the Transformations + GLM chapter: a textured square, tilted back, seen through three matrices. There are three steps. Run the program after each one; each step says what you should see. The checkpoint at the end shows the whole file.")}
      </p>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "oglCube_along1", "Step 1: a cube with 8 vertices and 36 indices, coloured by its own positions. No texture yet, so less can go wrong.")}</li>
        <li>{tx(t, "oglCube_along2", "Step 2: the depth test, so the near faces hide the far ones.")}</li>
        <li>{tx(t, "oglCube_along3", "Step 3: the textured cube, with 24 vertices: the image sits right on all six faces.")}</li>
      </ol>

      {/* ── COUNTING ────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglCube_countTitle", "Counting a cube")}</H2>
      <p>
        {tx(t, "oglCube_count1",
          "The GPU only draws triangles. A cube has no triangles of its own, so first cut it into some. Each face is a square, and a square is two triangles, exactly like the square of the EBO chapter.")}
      </p>
      <LessonTable
        headers={[tx(t, "oglCube_tWhat", "What"), tx(t, "oglCube_tHowMany", "How many"), tx(t, "oglCube_tWhy", "Why")]}
        rows={[
          [tx(t, "oglCube_c1", "corners"), "8", tx(t, "oglCube_c1b", "4 on the front, 4 on the back")],
          [tx(t, "oglCube_c2", "faces"), "6", tx(t, "oglCube_c2b", "front, back, right, left, top, bottom")],
          [tx(t, "oglCube_c3", "triangles"), "12", tx(t, "oglCube_c3b", "2 per face × 6 faces")],
          [tx(t, "oglCube_c4", "triangle corners"), "36", tx(t, "oglCube_c4b", "3 per triangle × 12 triangles")],
        ]}
      />
      <p>
        {tx(t, "oglCube_count2",
          "That last number is the one in the draw call. With GL_TRIANGLES, the GPU reads corners three at a time, and each group of three becomes one triangle. So the count you pass is the number of corners to read, 36, not the number of triangles, 12. Pass 6 and you get one face; pass 12 and you get two.")}
      </p>

      {/* ── THREE WAYS ──────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglCube_waysTitle", "Three ways to give the GPU 36 corners")}</H2>
      <p>
        {tx(t, "oglCube_ways1",
          "The GPU always reads 36 corners. What changes is where it reads them from. Without an index buffer, it reads the vertex array in order, so the array must hold all 36. With an index buffer, it reads 36 numbers from the index list, and each number points at a vertex in the array. Then the array can be shorter, because many numbers can point at the same vertex.")}
      </p>
      <LessonTable
        headers={["", tx(t, "oglCube_tA", "A. No EBO"), tx(t, "oglCube_tB", "B. EBO, 8 vertices"), tx(t, "oglCube_tC", "C. EBO, 24 vertices")]}
        rows={[
          [tx(t, "oglCube_w1", "vertices in the VBO"), "36", "8", "24"],
          [tx(t, "oglCube_w2", "indices in the EBO"), "—", "36", "36"],
          [tx(t, "oglCube_w3", "draw call"), <IC key="a">{"glDrawArrays"}</IC>, <IC key="b">{"glDrawElements"}</IC>, <IC key="c">{"glDrawElements"}</IC>],
          [tx(t, "oglCube_w4", "one texture per face"), tx(t, "oglCube_yes", "yes"), tx(t, "oglCube_no", "no"), tx(t, "oglCube_yes", "yes")],
          [tx(t, "oglCube_w5", "used for"), tx(t, "oglCube_w5a", "LearnOpenGL's cube; quick tests"), tx(t, "oglCube_w5b", "shapes where each corner has one colour, or only a position (shadows, outlines)"), tx(t, "oglCube_w5c", "textured or lit cubes; how most real meshes are stored")],
        ]}
      />
      <p>
        {tx(t, "oglCube_ways2",
          "So yes, a cube can use an EBO, and usually does. But B and C are not the same EBO. The difference comes from one question: what is a vertex?")}
      </p>

      <H3>{tx(t, "oglCube_vertexTitle", "A vertex is the whole row, not the position")}</H3>
      <p>
        {tx(t, "oglCube_vertex1",
          "In everyday words, a vertex is a corner. To the GPU, a vertex is one row of the vertex array: the position and every other attribute that goes with it, such as a texture coordinate, a colour or, later, a normal. Two rows are the same vertex only if every number in them is the same.")}
      </p>
      <p>
        {tx(t, "oglCube_vertex2",
          "Now take the top-right front corner, (0.5, 0.5, 0.5). It belongs to three faces: front, right and top. On each face, the image must reach that corner from a different side, so the corner needs a different (u, v) on each face. Three different texture coordinates means three different rows. So with a texture, this one corner is three vertices, and the whole cube is 8 × 3 = 24 vertices. Without a texture, each corner has nothing but its position, and 8 vertices are enough.")}
      </p>
      <p>
        {tx(t, "oglCube_figIntro",
          "The figure draws the cube of this chapter the way the GPU draws it. Press play to watch the draw call work through the list, three numbers per triangle. Switch between the three layouts: the cube looks the same, but the numbers on its corners show what the VBO holds. Click a corner to see how many vertices sit there.")}
      </p>
      <CubeBuildFigure t={t} />

      {/* ── STEP 1 ──────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglCube_s1Title", "Step 1: a colour cube from 8 vertices")}</H2>
      <p>
        {tx(t, "oglCube_s1a",
          "Start with layout B. It has the fewest numbers to type, and no texture to get wrong. Number the corners like the square of the EBO chapter: the front face is 0 top-left, 1 bottom-left, 2 bottom-right and 3 top-right. Corners 4 to 7 are the same four, pushed back from z = 0.5 to z = −0.5. Replace the square's vertices and indices in step 4b:")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp (step 4b)" t={t}>{`float vertices[] = {
//     x      y      z
    -0.5f,  0.5f,  0.5f,   // 0: front top-left
    -0.5f, -0.5f,  0.5f,   // 1: front bottom-left
     0.5f, -0.5f,  0.5f,   // 2: front bottom-right
     0.5f,  0.5f,  0.5f,   // 3: front top-right
    -0.5f,  0.5f, -0.5f,   // 4: back  top-left     (corner 0, pushed back)
    -0.5f, -0.5f, -0.5f,   // 5: back  bottom-left  (corner 1, pushed back)
     0.5f, -0.5f, -0.5f,   // 6: back  bottom-right (corner 2, pushed back)
     0.5f,  0.5f, -0.5f,   // 7: back  top-right    (corner 3, pushed back)
};
GLuint indices[] = {
    0, 1, 2,   0, 2, 3,    // front  (+z)
    7, 6, 5,   7, 5, 4,    // back   (−z)
    3, 2, 6,   3, 6, 7,    // right  (+x)
    4, 5, 1,   4, 1, 0,    // left   (−x)
    4, 0, 3,   4, 3, 7,    // top    (+y)
    1, 5, 6,   1, 6, 2,    // bottom (−y)
};`}</CodeBlock>
      <p>
        {tx(t, "oglCube_s1b",
          "Each line of indices is one face, written the same way as the square: top-left, bottom-left, bottom-right, then top-left, bottom-right, top-right. \"Top-left\" means as you see the face from outside the cube. Walk around the cube and read each face:")}
      </p>
      <LessonTable
        headers={[tx(t, "oglCube_tFace", "Face"), tx(t, "oglCube_tSeenFrom", "Seen from"), tx(t, "oglCube_tCorners", "Its corners: top-left, bottom-left, bottom-right, top-right")]}
        rows={[
          [tx(t, "oglCube_fFront", "front"), tx(t, "oglCube_vFront", "in front (+z)"), "0, 1, 2, 3"],
          [tx(t, "oglCube_fBack", "back"), tx(t, "oglCube_vBack", "behind (−z): left and right swap"), "7, 6, 5, 4"],
          [tx(t, "oglCube_fRight", "right"), tx(t, "oglCube_vRight", "the right (+x): the front edge is on the left"), "3, 2, 6, 7"],
          [tx(t, "oglCube_fLeft", "left"), tx(t, "oglCube_vLeft", "the left (−x): the back edge is on the left"), "4, 5, 1, 0"],
          [tx(t, "oglCube_fTop", "top"), tx(t, "oglCube_vTop", "above (+y): the back edge is at the top"), "4, 0, 3, 7"],
          [tx(t, "oglCube_fBottom", "bottom"), tx(t, "oglCube_vBottom", "below (−y): the front edge is at the top"), "1, 5, 6, 2"],
        ]}
      />
      <p>
        {tx(t, "oglCube_s1c",
          "Written this way, every triangle runs counter-clockwise when seen from outside. Nothing checks that yet. It will matter in the Face Winding & Culling chapter, where the GPU skips the triangles that face away from the camera.")}
      </p>
      <p>
        {tx(t, "oglCube_s1d",
          "Each vertex is now 3 floats instead of 5: there is no (u, v). So the attribute setup in step 4b changes. Attribute 0 gets a stride of 3 floats, and attribute 1 goes away:")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp (step 4b, the attributes)" t={t}>{`glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);   // stride: was 5
glEnableVertexAttribArray(0);
// attribute 1 (the uv) is gone for now: delete its two lines`}</CodeBlock>
      <p>
        {tx(t, "oglCube_s1e",
          "Without a texture, the faces need some colour, or the cube is one flat shape. A simple trick is to colour each vertex by its own position. The vertex shader sends the colour out, and the fragment shader paints it. Replace both shaders at the top of main.cpp:")}
      </p>
      <CodeBlock lang="glsl" filename="vertex shader (in main.cpp)" t={t}>{`#version 460 core
layout (location = 0) in vec3 aPos;
out vec3 vColor;                       // NEW: replaces TexCoord
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
void main() {
    gl_Position = uProjection * uView * uModel * vec4(aPos, 1.0);
    vColor = aPos + 0.5;               // NEW: −0.5…0.5 becomes 0…1
}`}</CodeBlock>
      <CodeBlock lang="glsl" filename="fragment shader (in main.cpp)" t={t}>{`#version 460 core
in vec3 vColor;                        // NEW
out vec4 FragColor;
void main() {
    FragColor = vec4(vColor, 1.0);     // NEW: was texture(uTexture, TexCoord)
}`}</CodeBlock>
      <p>
        {tx(t, "oglCube_s1f",
          "Every coordinate of aPos is −0.5 or 0.5. Adding 0.5 turns those into 0 or 1, and a colour channel goes from 0 to 1. So x becomes red, y green and z blue. Between the corners, the GPU blends the colours across each triangle, as it did for the coloured square of the EBO chapter. A few corners:")}
      </p>
      <LessonTable
        headers={[tx(t, "oglCube_tCorner", "Corner"), "aPos", "vColor = aPos + 0.5", tx(t, "oglCube_tColour", "Colour")]}
        rows={[
          ["0", "(−0.5, 0.5, 0.5)", "(0, 1, 1)", tx(t, "oglCube_col0", "cyan")],
          ["2", "(0.5, −0.5, 0.5)", "(1, 0, 1)", tx(t, "oglCube_col2", "magenta")],
          ["3", "(0.5, 0.5, 0.5)", "(1, 1, 1)", tx(t, "oglCube_col3", "white")],
          ["5", "(−0.5, −0.5, −0.5)", "(0, 0, 0)", tx(t, "oglCube_col5", "black")],
        ]}
      />
      <p>
        {tx(t, "oglCube_s1g",
          "The texture code in step 4c can stay. The new fragment shader has no uTexture, so its location is −1, and setting location −1 is silently ignored. Step 3 brings the texture back.")}
      </p>
      <p>
        {tx(t, "oglCube_s1h",
          "Last, the loop. A cube seen straight from the front is just a square, so it has to turn. Replace the model matrix, and draw 36 indices instead of 6:")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp (step 5, in the render loop)" t={t}>{`float time = (float)glfwGetTime();
glm::mat4 model = glm::rotate(glm::mat4(1.0f), time * glm::radians(50.0f),
                              glm::vec3(0.5f, 1.0f, 0.0f));   // was the −55° tilt
// ... view, projection and the three glUniformMatrix4fv as before ...
glDrawElements(GL_TRIANGLES, 36, GL_UNSIGNED_INT, (void*)0);  // was 6`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "oglCube_tLine", "Line"), tx(t, "oglCube_tDoes", "What it does")]}
        rows={[
          [<IC key="1">{"time * glm::radians(50.0f)"}</IC>, tx(t, "oglCube_m1", "the angle grows by 50° every second, so one full turn takes 360 / 50 = 7.2 seconds. glm::rotate wants radians, hence glm::radians.")],
          [<IC key="2">{"glm::vec3(0.5f, 1.0f, 0.0f)"}</IC>, tx(t, "oglCube_m2", "the axis it turns around. It leans to the side, so the cube tumbles and shows all six faces in turn. Around (0, 1, 0) alone, the top and bottom would never face you. glm::rotate makes the axis length 1 by itself.")],
          [<IC key="3">{"36"}</IC>, tx(t, "oglCube_m3", "the number of indices to read: 12 triangles × 3 corners.")],
        ]}
      />
      <Callout type="warn" t={t}>
        {tx(t, "oglCube_s1Run",
          "Run it: a colourful cube tumbles in the middle of the window. But watch it for a few seconds. At some angles it looks wrong: a face that should be behind shows through the one in front, as if the cube were inside-out. That is not a bug in your vertices. Step 2 fixes it.")}
      </Callout>

      {/* ── STEP 2 ──────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglCube_s2Title", "Step 2: the near faces must win")}</H2>
      <p>
        {tx(t, "oglCube_s2a",
          "OpenGL draws the triangles in the order of the index list. Each one is painted over whatever is already in the window. It does not check whether something nearer is already there. So the order of the list decides what you see, not the distance:")}
      </p>
      <LessonTable
        headers={[tx(t, "oglCube_tOrder", "Order"), tx(t, "oglCube_tFace", "Face"), tx(t, "oglCube_tResult", "With the front of the cube toward you")]}
        rows={[
          ["1", tx(t, "oglCube_fFront", "front"), tx(t, "oglCube_o1", "painted first: you see it")],
          ["2", tx(t, "oglCube_fBack", "back"), tx(t, "oglCube_o2", "painted next, over the front face: now you see the back of the cube through its front")],
          ["3–6", tx(t, "oglCube_o3", "right, left, top, bottom"), tx(t, "oglCube_o3b", "each one covers whatever was there, near or far")],
        ]}
      />
      <p>
        {tx(t, "oglCube_s2b",
          "The fix is the depth test. Next to the colour of each pixel, OpenGL keeps a second number: its depth, the z that came out of the perspective divide. Near things have a small depth and far things a large one. Before painting a pixel, the GPU compares the new depth with the stored one. If the new one is nearer, it paints and stores the new depth. If not, it throws the new pixel away. Then the order no longer matters: the nearest surface always wins.")}
      </p>
      <p>{tx(t, "oglCube_s2c", "It takes one line in step 4, after the program is made:")}</p>
      <CodeBlock lang="cpp" filename="src/main.cpp (step 4d)" t={t}>{`glEnable(GL_DEPTH_TEST);   // keep the nearest surface in each pixel`}</CodeBlock>
      <p>
        {tx(t, "oglCube_s2d",
          "The stored depths must start fresh every frame, or the new frame would be compared with the old one. Your glClear already does that: its GL_DEPTH_BUFFER_BIT part has been there since the Window & Context chapter. It sets every stored depth to 1.0, the farthest value, so the first surface drawn on a pixel always passes.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "oglCube_s2Run",
          "Run it: the same cube, now solid at every angle. In the figure above, turn GL_DEPTH_TEST off and press play to see the inside-out cube again. The Depth Testing chapter, after Camera, shows how the depth values are computed and what else the test can do.")}
      </Callout>

      {/* ── STEP 3 ──────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglCube_s3Title", "Step 3: the textured cube, 24 vertices")}</H2>
      <p>
        {tx(t, "oglCube_s3a",
          "Now bring the image back. Can the 8 vertices just get a (u, v) each? Follow corner 3, (0.5, 0.5, 0.5), on its three faces:")}
      </p>
      <LessonTable
        headers={[tx(t, "oglCube_tFace", "Face"), tx(t, "oglCube_tWhere", "Where corner 3 sits on it"), tx(t, "oglCube_tUV", "(u, v) it needs")]}
        rows={[
          [tx(t, "oglCube_fFront", "front"), tx(t, "oglCube_p1", "top-right"), "(1, 1)"],
          [tx(t, "oglCube_fRight", "right"), tx(t, "oglCube_p2", "top-left"), "(0, 1)"],
          [tx(t, "oglCube_fTop", "top"), tx(t, "oglCube_p3", "bottom-right"), "(1, 0)"],
        ]}
      />
      <p>
        {tx(t, "oglCube_s3b",
          "One vertex can hold only one (u, v). Give corner 3 the front face's (1, 1), and the right and top faces get the image stretched and mirrored. So each face gets its own 4 vertices, with its own texture coordinates: 6 faces × 4 = 24. The positions repeat, and that is fine. Replace the vertices and indices in step 4b:")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp (step 4b)" t={t}>{`float vertices[] = {
//    x      y      z     u     v
    // front (+z)            vertices 0–3
    -0.5f,  0.5f,  0.5f, 0.0f, 1.0f,   -0.5f, -0.5f,  0.5f, 0.0f, 0.0f,
     0.5f, -0.5f,  0.5f, 1.0f, 0.0f,    0.5f,  0.5f,  0.5f, 1.0f, 1.0f,
    // back (−z)             vertices 4–7
     0.5f,  0.5f, -0.5f, 0.0f, 1.0f,    0.5f, -0.5f, -0.5f, 0.0f, 0.0f,
    -0.5f, -0.5f, -0.5f, 1.0f, 0.0f,   -0.5f,  0.5f, -0.5f, 1.0f, 1.0f,
    // right (+x)            vertices 8–11
     0.5f,  0.5f,  0.5f, 0.0f, 1.0f,    0.5f, -0.5f,  0.5f, 0.0f, 0.0f,
     0.5f, -0.5f, -0.5f, 1.0f, 0.0f,    0.5f,  0.5f, -0.5f, 1.0f, 1.0f,
    // left (−x)             vertices 12–15
    -0.5f,  0.5f, -0.5f, 0.0f, 1.0f,   -0.5f, -0.5f, -0.5f, 0.0f, 0.0f,
    -0.5f, -0.5f,  0.5f, 1.0f, 0.0f,   -0.5f,  0.5f,  0.5f, 1.0f, 1.0f,
    // top (+y)              vertices 16–19
    -0.5f,  0.5f, -0.5f, 0.0f, 1.0f,   -0.5f,  0.5f,  0.5f, 0.0f, 0.0f,
     0.5f,  0.5f,  0.5f, 1.0f, 0.0f,    0.5f,  0.5f, -0.5f, 1.0f, 1.0f,
    // bottom (−y)           vertices 20–23
    -0.5f, -0.5f,  0.5f, 0.0f, 1.0f,   -0.5f, -0.5f, -0.5f, 0.0f, 0.0f,
     0.5f, -0.5f, -0.5f, 1.0f, 0.0f,    0.5f, -0.5f,  0.5f, 1.0f, 1.0f,
};
GLuint indices[] = {
     0,  1,  2,   0,  2,  3,    // front
     4,  5,  6,   4,  6,  7,    // back
     8,  9, 10,   8, 10, 11,    // right
    12, 13, 14,  12, 14, 15,    // left
    16, 17, 18,  16, 18, 19,    // top
    20, 21, 22,  20, 22, 23,    // bottom
};`}</CodeBlock>
      <p>
        {tx(t, "oglCube_s3c",
          "Each face is the same four corners as in step 1, in the same order (top-left, bottom-left, bottom-right, top-right), now with the square's texture coordinates: (0, 1), (0, 0), (1, 0), (1, 1). That makes the index list very regular. Face number f uses vertices 4f to 4f + 3, in the pattern 0 1 2, 0 2 3 plus 4f. The front face is f = 0, the back face f = 1, and so on.")}
      </p>
      <p>
        {tx(t, "oglCube_s3d",
          "The rest goes back to how it was in the last chapter. Each vertex is 5 floats again, so attribute 0 gets a stride of 5 and attribute 1, the (u, v), returns:")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp (step 4b, the attributes)" t={t}>{`glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 5 * sizeof(float), (void*)0);
glEnableVertexAttribArray(0);
glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE, 5 * sizeof(float), (void*)(3 * sizeof(float)));
glEnableVertexAttribArray(1);`}</CodeBlock>
      <p>
        {tx(t, "oglCube_s3e",
          "And the two shaders go back to the textured ones from the last chapter, with TexCoord and uTexture instead of vColor. The checkpoint below shows them. The draw call stays at 36, and the depth test stays on.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "oglCube_s3Run",
          "Run it: your image sits upright on every face of a tumbling cube, in perspective, and the near faces hide the far ones.")}
      </Callout>

      <H3>{tx(t, "oglCube_arraysTitle", "The same cube without an EBO")}</H3>
      <p>
        {tx(t, "oglCube_arrays1",
          "Many tutorials, LearnOpenGL among them, draw the cube with layout A: no index buffer, 36 vertices, glDrawArrays. Each face is written as its two triangles in full, 6 rows per face:")}
      </p>
      <CodeBlock lang="cpp" filename="cube_no_ebo.cpp" t={t}>{`float vertices[] = {
//    x      y      z     u     v
    // front (+z): top-left, bottom-left, bottom-right,  top-left, bottom-right, top-right
    -0.5f,  0.5f,  0.5f, 0.0f, 1.0f,
    -0.5f, -0.5f,  0.5f, 0.0f, 0.0f,
     0.5f, -0.5f,  0.5f, 1.0f, 0.0f,
    -0.5f,  0.5f,  0.5f, 0.0f, 1.0f,   // top-left again
     0.5f, -0.5f,  0.5f, 1.0f, 0.0f,   // bottom-right again
     0.5f,  0.5f,  0.5f, 1.0f, 1.0f,
    // ... the other five faces the same way: 36 rows in all
};
// no indices[], no EBO: glGenBuffers / glBindBuffer / glBufferData for it go away

glDrawArrays(GL_TRIANGLES, 0, 36);   // first vertex 0, read 36 vertices`}</CodeBlock>
      <p>
        {tx(t, "oglCube_arrays2",
          "It works just as well. Each face simply stores its top-left and bottom-right vertex twice. If you follow LearnOpenGL, its array is this layout, only with the rows in a different order. Which one to pick? Count the bytes. A float is 4 bytes, and a GLuint index is 4 bytes too:")}
      </p>
      <LessonTable
        headers={[tx(t, "oglCube_tLayout", "Layout"), tx(t, "oglCube_tSum", "Bytes"), tx(t, "oglCube_tTotal", "Total")]}
        rows={[
          [tx(t, "oglCube_tA", "A. No EBO"), "36 × 5 × 4", "720"],
          [tx(t, "oglCube_tB", "B. EBO, 8 vertices"), "8 × 3 × 4 + 36 × 4", "240"],
          [tx(t, "oglCube_tC", "C. EBO, 24 vertices"), "24 × 5 × 4 + 36 × 4", "624"],
        ]}
      />
      <p>
        {tx(t, "oglCube_arrays3",
          "For a textured cube, the EBO saves little: 624 bytes instead of 720. A cube has sharp edges, so its faces cannot share vertices. The big savings come with smooth meshes, where every vertex really is shared by about six triangles: that is the grid of the EBO chapter, and every model you load later. So use whichever you find clearer for a cube. Layout C is what the rest of this track continues from.")}
      </p>

      {/* ── CHECKPOINT ──────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglCube_soFarTitle", "Your main.cpp so far")}</H2>
      <p>
        {tx(t, "oglCube_soFarBody",
          "The whole file after step 3. Compared with the Transformations + GLM version, the changes are marked NEW: the cube's 24 vertices and 36 indices, the depth test, the spinning model matrix and the 36 in the draw call. The helpers are shortened because they did not change.")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp" t={t}>{`#include <glad/glad.h>      // MUST come before glfw3.h
#include <GLFW/glfw3.h>
#include <iostream>
#include "stb_image.h"
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <glm/gtc/type_ptr.hpp>

// ── Shaders (the textured pair, as in Transformations + GLM) ────────────────
const char* vertexShaderSource = R"(#version 460 core
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec2 aTexCoord;
out vec2 TexCoord;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
void main() {
    gl_Position = uProjection * uView * uModel * vec4(aPos, 1.0);
    TexCoord = aTexCoord;
})";

const char* fragmentShaderSource = R"(#version 460 core
in vec2 TexCoord;
out vec4 FragColor;
uniform sampler2D uTexture;
void main() {
    FragColor = texture(uTexture, TexCoord);
})";

// ── Helpers (unchanged since First Shaders and Textures) ────────────────────
GLuint compileShader(GLenum type, const char* src) { /* ... */ }
GLuint makeProgram(const char* vsSrc, const char* fsSrc) { /* ... */ }
GLuint loadTexture(const char* path) { /* ... */ }

void framebufferSizeCallback(GLFWwindow*, int width, int height) {
    glViewport(0, 0, width, height);
}

int main() {
    // ── 1–3. Window, GLAD, viewport (unchanged) ─────────────────────────────
    if (!glfwInit()) return 1;
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 4);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 6);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
    GLFWwindow* window = glfwCreateWindow(1280, 720, "GLApp", nullptr, nullptr);
    if (!window) { glfwTerminate(); return 1; }
    glfwMakeContextCurrent(window);
    glfwSwapInterval(1);
    if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)) return 1;
    int fbw, fbh;
    glfwGetFramebufferSize(window, &fbw, &fbh);
    glViewport(0, 0, fbw, fbh);
    glfwSetFramebufferSizeCallback(window, framebufferSizeCallback);

    // ── 4. One-time setup ────────────────────────────────────────────────────
    // 4a. Shaders → program (unchanged)
    GLuint shaderProgram = makeProgram(vertexShaderSource, fragmentShaderSource);
    if (shaderProgram == 0) { glfwTerminate(); return 1; }

    // 4b. Vertex data → VAO + VBO + EBO            >>> NEW: a cube, 24 vertices
    float vertices[] = {
    //    x      y      z     u     v
        // front (+z)
        -0.5f,  0.5f,  0.5f, 0.0f, 1.0f,   -0.5f, -0.5f,  0.5f, 0.0f, 0.0f,
         0.5f, -0.5f,  0.5f, 1.0f, 0.0f,    0.5f,  0.5f,  0.5f, 1.0f, 1.0f,
        // back (−z)
         0.5f,  0.5f, -0.5f, 0.0f, 1.0f,    0.5f, -0.5f, -0.5f, 0.0f, 0.0f,
        -0.5f, -0.5f, -0.5f, 1.0f, 0.0f,   -0.5f,  0.5f, -0.5f, 1.0f, 1.0f,
        // right (+x)
         0.5f,  0.5f,  0.5f, 0.0f, 1.0f,    0.5f, -0.5f,  0.5f, 0.0f, 0.0f,
         0.5f, -0.5f, -0.5f, 1.0f, 0.0f,    0.5f,  0.5f, -0.5f, 1.0f, 1.0f,
        // left (−x)
        -0.5f,  0.5f, -0.5f, 0.0f, 1.0f,   -0.5f, -0.5f, -0.5f, 0.0f, 0.0f,
        -0.5f, -0.5f,  0.5f, 1.0f, 0.0f,   -0.5f,  0.5f,  0.5f, 1.0f, 1.0f,
        // top (+y)
        -0.5f,  0.5f, -0.5f, 0.0f, 1.0f,   -0.5f,  0.5f,  0.5f, 0.0f, 0.0f,
         0.5f,  0.5f,  0.5f, 1.0f, 0.0f,    0.5f,  0.5f, -0.5f, 1.0f, 1.0f,
        // bottom (−y)
        -0.5f, -0.5f,  0.5f, 0.0f, 1.0f,   -0.5f, -0.5f, -0.5f, 0.0f, 0.0f,
         0.5f, -0.5f, -0.5f, 1.0f, 0.0f,    0.5f, -0.5f,  0.5f, 1.0f, 1.0f,
    };
    GLuint indices[] = {
         0,  1,  2,   0,  2,  3,    // front
         4,  5,  6,   4,  6,  7,    // back
         8,  9, 10,   8, 10, 11,    // right
        12, 13, 14,  12, 14, 15,    // left
        16, 17, 18,  16, 18, 19,    // top
        20, 21, 22,  20, 22, 23,    // bottom
    };
    //                                               <<< end of NEW
    GLuint vao, vbo, ebo;
    glGenVertexArrays(1, &vao);
    glGenBuffers(1, &vbo);
    glGenBuffers(1, &ebo);

    glBindVertexArray(vao);
    glBindBuffer(GL_ARRAY_BUFFER, vbo);
    glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 5 * sizeof(float), (void*)0);
    glEnableVertexAttribArray(0);
    glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE, 5 * sizeof(float), (void*)(3 * sizeof(float)));
    glEnableVertexAttribArray(1);
    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, ebo);
    glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);
    glBindVertexArray(0);

    // 4c. Texture + sampler (unchanged)
    GLuint texture = loadTexture(ASSET_DIR "wall.jpg");
    if (texture == 0) { glfwTerminate(); return 1; }
    glUseProgram(shaderProgram);
    glUniform1i(glGetUniformLocation(shaderProgram, "uTexture"), 0);

    // 4d. Matrices and depth
    GLint modelLoc      = glGetUniformLocation(shaderProgram, "uModel");
    GLint viewLoc       = glGetUniformLocation(shaderProgram, "uView");
    GLint projectionLoc = glGetUniformLocation(shaderProgram, "uProjection");
    glEnable(GL_DEPTH_TEST);                                         // NEW

    // ── 5. The render loop ───────────────────────────────────────────────────
    while (!glfwWindowShouldClose(window)) {
        if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
            glfwSetWindowShouldClose(window, true);

        glClearColor(0.06f, 0.07f, 0.10f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

        float time = (float)glfwGetTime();                           // NEW
        glm::mat4 model = glm::rotate(glm::mat4(1.0f), time * glm::radians(50.0f),
                                      glm::vec3(0.5f, 1.0f, 0.0f));  // NEW: spin, not tilt
        glm::mat4 view  = glm::translate(glm::mat4(1.0f), glm::vec3(0.0f, 0.0f, -3.0f));
        int width, height;
        glfwGetFramebufferSize(window, &width, &height);
        float aspect = height > 0 ? (float)width / (float)height : 1.0f;
        glm::mat4 projection = glm::perspective(glm::radians(45.0f), aspect, 0.1f, 100.0f);

        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_2D, texture);
        glUseProgram(shaderProgram);
        glUniformMatrix4fv(modelLoc,      1, GL_FALSE, glm::value_ptr(model));
        glUniformMatrix4fv(viewLoc,       1, GL_FALSE, glm::value_ptr(view));
        glUniformMatrix4fv(projectionLoc, 1, GL_FALSE, glm::value_ptr(projection));
        glBindVertexArray(vao);
        glDrawElements(GL_TRIANGLES, 36, GL_UNSIGNED_INT, (void*)0);  // NEW: 36

        glfwSwapBuffers(window);
        glfwPollEvents();
    }

    // ── 6. Clean up (unchanged) ──────────────────────────────────────────────
    glDeleteTextures(1, &texture);
    glDeleteVertexArrays(1, &vao);
    glDeleteBuffers(1, &vbo);
    glDeleteBuffers(1, &ebo);
    glDeleteProgram(shaderProgram);
    glfwTerminate();
    return 0;
}`}</CodeBlock>

      {/* ── WHAT YOU SEE ────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglCube_seeTitle", "If it does not look right")}</H2>
      <LessonTable
        headers={[tx(t, "oglCube_tSee", "What you see"), tx(t, "oglCube_tCause", "Likely cause")]}
        rows={[
          [tx(t, "oglCube_r1", "a square, not a cube"), tx(t, "oglCube_r1b", "the cube is not turning, so you only see its front face. Check that the model matrix uses time, and that it is sent every frame.")],
          [tx(t, "oglCube_r2", "only one face, or a few triangles"), tx(t, "oglCube_r2b", "the draw call still says 6 (or 12…) instead of 36.")],
          [tx(t, "oglCube_r3", "back faces show through the front ones"), tx(t, "oglCube_r3b", "glEnable(GL_DEPTH_TEST) is missing, or glClear lacks GL_DEPTH_BUFFER_BIT.")],
          [tx(t, "oglCube_r4", "triangles in wild places, spikes, garbage"), tx(t, "oglCube_r4b", "the stride does not match the array: 3 floats per vertex in step 1, 5 in step 3. Or an index is larger than the last vertex (23 in step 3, 7 in step 1).")],
          [tx(t, "oglCube_r5", "the texture is right on two faces and smeared or mirrored on the others"), tx(t, "oglCube_r5b", "the cube was given a (u, v) per corner, with 8 vertices. A textured cube needs 24.")],
          [tx(t, "oglCube_r6", "nothing at all, only the clear colour"), tx(t, "oglCube_r6b", "the EBO was bound while no VAO was bound, or glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, 0) ran before glBindVertexArray(0). The VAO remembers its EBO, so the EBO must be bound while the VAO is.")],
          [tx(t, "oglCube_r7", "a part of the cube is missing"), tx(t, "oglCube_r7b", "glBufferData was given sizeof of a pointer instead of the array. That happens when the array is passed to a function: inside it, sizeof gives 8, not the array's size. Pass the size in bytes as well.")],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "oglCube_try",
          "Try it: draw the same cube several times. One VAO is enough; only the model matrix changes. Put a few positions in an array, and in the loop, for each one, build model = translate(position) × rotate(…), send it, and call glDrawElements again. Then remove glEnable(GL_DEPTH_TEST) to see what the depth test was doing.")}
      </Callout>
      <CodeBlock lang="cpp" filename="many_cubes.cpp" t={t}>{`glm::vec3 positions[] = {
    glm::vec3( 0.0f,  0.0f,  0.0f),
    glm::vec3( 2.0f,  1.0f, -5.0f),
    glm::vec3(-1.5f, -1.0f, -2.5f),
};
for (int i = 0; i < 3; ++i) {
    glm::mat4 model = glm::translate(glm::mat4(1.0f), positions[i]);   // acts last: move into place
    model = glm::rotate(model, time + i, glm::vec3(0.5f, 1.0f, 0.0f)); // acts first: spin around its centre
    glUniformMatrix4fv(modelLoc, 1, GL_FALSE, glm::value_ptr(model));
    glDrawElements(GL_TRIANGLES, 36, GL_UNSIGNED_INT, (void*)0);
}`}</CodeBlock>

      {/* ── MISTAKES ────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglCube_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "oglCube_tMistake", "Mistake"), tx(t, "oglCube_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "oglCube_e1", "Passing the number of triangles"), tx(t, "oglCube_e1b", "glDrawElements(GL_TRIANGLES, 12, …) draws 4 triangles, not 12. The count is how many indices (or vertices) to read: 36.")],
          [tx(t, "oglCube_e2", "Index type does not match the array"), tx(t, "oglCube_e2b", "indices declared as GLuint must be drawn with GL_UNSIGNED_INT. Say GL_UNSIGNED_SHORT and the GPU reads each 4-byte number as two 2-byte ones: the wrong vertices.")],
          [tx(t, "oglCube_e3", "Writing a face clockwise"), tx(t, "oglCube_e3b", "nothing changes yet. Once face culling is on (Face Winding & Culling), that face vanishes when it faces you. Keep every face counter-clockwise from outside.")],
          [tx(t, "oglCube_e4", "Enabling the depth test inside the loop"), tx(t, "oglCube_e4b", "it works, but it is a setting, not an action: once is enough. Turn it on in step 4.")],
          [tx(t, "oglCube_e5", "Counting on glDrawArrays to use the EBO"), tx(t, "oglCube_e5b", "glDrawArrays never reads the index list. With an EBO, draw with glDrawElements.")],
        ]}
      />
      <p>
        {tx(t, "oglCube_next",
          "Next, Camera & View Matrix draws five of these cubes and replaces the fixed translate(0, 0, −3) with a real camera: glm::lookAt, the mouse to look around and the keyboard to move.")}
      </p>

      <KeyIdeas t={t} id="oglCube" items={[
        "A cube is 8 corners, 6 faces, 12 triangles and 36 triangle corners. The draw call's count is those 36, not the 12 triangles.",
        "Without an EBO, the vertex array holds all 36 corners (glDrawArrays). With one, the 36 indices point into a shorter array (glDrawElements).",
        "A vertex is a whole row of attributes. Two rows are the same vertex only if every number matches.",
        "With positions only, the 8 corners are enough. With a texture, each corner needs a different (u, v) on each of its three faces, so the cube needs 24 vertices.",
        "Triangles are painted in list order. glEnable(GL_DEPTH_TEST), plus GL_DEPTH_BUFFER_BIT in glClear, keeps the nearest surface in each pixel.",
        "For a sharp-edged cube the EBO saves little; it pays off on smooth meshes where each vertex is shared by many triangles.",
      ]} />
    </Article>
  );
}
