"use client";

// OpenGL track — "Vectors for 3D", the first chapter of 3D & Transformations.
// Written for beginners: every operation is named in words, then drawn, then
// worked out with numbers, then shown in GLM. What a vector is (point or
// arrow, vec3 in the code so far); the math lab (a second small program,
// mathlab.cpp, next to main.cpp); adding and subtracting; scaling; length and
// the |a| notation; normalizing; the dot product (both formulas, the cos θ
// table, uses); the cross product (the component pattern, right-hand rule,
// area, triangle normals); the four kinds of "multiply"; the full mathlab.cpp
// with its expected output; common mistakes.

import { CodeBlock, Callout, H2, H3, IC, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { VectorFigure } from "@/components/lesson/figures/math/VectorFigure";
import { VectorOpsFigure } from "@/components/lesson/figures/VectorOpsFigure";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export function VectorsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglVec_intro",
          "So far the square sits still at fixed coordinates. To move it, spin it, and look at it through a camera, you need two tools: vectors and matrices. This chapter is about vectors. The next one is about matrices. Every operation is shown four ways: in words, in a picture, with real numbers, and as GLM code you can run.")}
      </Lead>

      <Goals t={t} id="oglVec" items={[
        "Add, scale and normalize vectors.",
        "Use the dot product to measure how much two directions agree.",
        "Use the cross product to get a direction perpendicular to two others.",
        "Write the same operations with GLM.",
      ]} />

      {/* ── WHAT A VECTOR IS ────────────────────────────────────────────── */}
      <H2>{tx(t, "oglVec_whatTitle", "What a vector is")}</H2>
      <p>
        {tx(t, "oglVec_what1",
          "In 3D code, a vector is a list of three numbers: (x, y, z). That is all it is in memory.")}
      </p>
      <p>
        {tx(t, "oglVec_what2",
          "The same three numbers can be read in two ways. As a point: a place in space, like \"the player is at (2, 0, 1)\". Or as an arrow: a move, like \"go 3 to the right and 1 up\". An arrow has a direction (which way it points) and a length (how far it goes). It does not have a fixed place: the arrow (3, 1, 0) is the same move wherever it starts.")}
      </p>
      <p>
        {tx(t, "oglVec_what3",
          "On paper, vectors are written as bold letters, like a and b. Their three parts are written with small letters below: aₓ, a_y, a_z. So a = (3, 1, 0) means aₓ = 3, a_y = 1 and a_z = 0.")}
      </p>
      <p>
        {tx(t, "oglVec_what4",
          "You have already used vectors. In your vertex shader, aPos is a vec3 (a point) and aColor is a vec3 (a colour). The table shows what a vec3 can hold in 3D code. The numbers do not know what they mean; your code decides.")}
      </p>
      <LessonTable
        headers={[tx(t, "oglVec_tMeaning", "A vec3 used as…"), tx(t, "oglVec_tExample", "Example"), tx(t, "oglVec_tWhere", "Where you meet it")]}
        rows={[
          [tx(t, "oglVec_m1", "a position (point)"), "(2, 0, 1)", tx(t, "oglVec_m1b", "aPos, a camera position, a light position")],
          [tx(t, "oglVec_m2", "a displacement (arrow)"), "(3, 0, 4)", tx(t, "oglVec_m2b", "\"from the player to the enemy\", a triangle edge")],
          [tx(t, "oglVec_m3", "a direction (arrow of length 1)"), "(0.6, 0, 0.8)", tx(t, "oglVec_m3b", "where the camera looks, where light comes from")],
          [tx(t, "oglVec_m4", "a normal"), "(0, 1, 0)", tx(t, "oglVec_m4b", "the arrow that sticks straight out of a surface; lighting uses it")],
          [tx(t, "oglVec_m5", "a colour"), "(1, 0.5, 0)", tx(t, "oglVec_m5b", "aColor, red-green-blue from 0 to 1")],
        ]}
      />
      <p>
        {tx(t, "oglVec_axes",
          "The axes in OpenGL: x points to the right, y points up, and z points out of the screen, toward you. So a point with a negative z is behind the screen, farther away.")}
      </p>

      {/* ── THE MATH LAB ────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglVec_labTitle", "Your math lab")}</H2>
      <p>
        {tx(t, "oglVec_lab1",
          "Each operation in this chapter comes with a line of GLM code, the math library already in your CMakeLists.txt. To check the numbers yourself, make a second, tiny program next to main.cpp. It opens no window. It only prints results. Your main.cpp does not change in this chapter.")}
      </p>
      <p>
        {tx(t, "oglVec_lab2",
          "Add two lines at the end of CMakeLists.txt. They create a second program called mathlab, which only needs GLM:")}
      </p>
      <CodeBlock lang="cmake" filename="CMakeLists.txt" t={t}>{`add_executable(mathlab src/mathlab.cpp)        # NEW: a second program
target_link_libraries(mathlab PRIVATE glm::glm)  # NEW: it only needs GLM`}</CodeBlock>
      <p>
        {tx(t, "oglVec_lab3",
          "Then create src/mathlab.cpp. Start with two small print helpers and an empty main. Each section below gives you lines to add inside main.")}
      </p>
      <CodeBlock lang="cpp" filename="src/mathlab.cpp" t={t}>{`#include <glm/glm.hpp>
#include <cmath>
#include <iostream>

// Prints a name and a vector:  a + b = (4, 3, 0)
void print(const char* name, glm::vec3 v) {
    std::cout << name << " = (" << v.x << ", " << v.y << ", " << v.z << ")\\n";
}

// Prints a name and a single number:  length = 5
void print(const char* name, float x) {
    std::cout << name << " = " << x << "\\n";
}

int main() {
    // the lines from each section go here
}`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "oglVec_tLine", "Line"), tx(t, "oglVec_tDoes", "What it does")]}
        rows={[
          [<IC key="1">{"#include <glm/glm.hpp>"}</IC>, tx(t, "oglVec_l1", "GLM's core: glm::vec3, and the functions dot, cross, length, normalize.")],
          [<IC key="2">{"#include <cmath>"}</IC>, tx(t, "oglVec_l2", "std::acos, used once to turn a dot product into an angle.")],
          [<IC key="3">{"void print(const char*, glm::vec3)"}</IC>, tx(t, "oglVec_l3", "Prints the three parts of a vector. v.x, v.y and v.z are its parts, as in GLSL.")],
          [<IC key="4">{"void print(const char*, float)"}</IC>, tx(t, "oglVec_l4", "The same name for single numbers. C++ picks the right one from the type you pass (this is called overloading).")],
        ]}
      />
      <p>
        {tx(t, "oglVec_lab4",
          "Build and run it like app. In an IDE, pick mathlab as the target. In a terminal, run cmake --build build --target mathlab, then run build/mathlab (with Visual Studio the file is build\\Debug\\mathlab.exe).")}
      </p>

      {/* ── ADD AND SUBTRACT ────────────────────────────────────────────── */}
      <H2>{tx(t, "oglVec_addTitle", "Adding vectors")}</H2>
      <p>
        {tx(t, "oglVec_add1",
          "In words: to add two vectors, add their matching parts. x with x, y with y, z with z. The result is a new vector.")}
      </p>
      <Equation label={tx(t, "oglVec_addLabel", "Vector addition")}
        glm="glm::vec3 r = a + b;">
        {String.raw`\blue{\mathbf{a}} + \amber{\mathbf{b}} \;=\; (\blue{a_x} + \amber{b_x},\; \blue{a_y} + \amber{b_y},\; \blue{a_z} + \amber{b_z})`}
      </Equation>
      <p>
        {tx(t, "oglVec_add2",
          "With numbers: a = (3, 1, 0) and b = (1, 2, 0). Then a + b = (3 + 1, 1 + 2, 0 + 0) = (4, 3, 0).")}
      </p>
      <p>
        {tx(t, "oglVec_add3",
          "As a picture: walk along a, then walk along b from where you stopped. a + b is the single arrow from where you started to where you ended. This is called \"tip to tail\": b's tail goes on a's tip. The order does not matter: b then a ends at the same place.")}
      </p>
      <p>
        {tx(t, "oglVec_add4",
          "Where 3D code uses it: moving a point. A point plus an arrow is the point moved by that arrow. If the player is at (2, 0, 1) and walks (1, 0, 0), the new position is (3, 0, 1). Every frame of a moving object does this: position = position + velocity × time.")}
      </p>

      <H3>{tx(t, "oglVec_subTitle", "Subtracting: the arrow from one point to another")}</H3>
      <p>
        {tx(t, "oglVec_sub1",
          "Subtraction works the same way: subtract the matching parts. Its meaning is the most useful thing in this section. b − a is the arrow that goes from point a to point b. A way to remember the order: \"to minus from\".")}
      </p>
      <Equation label={tx(t, "oglVec_subLabel", "Vector subtraction")}
        glm="glm::vec3 toB = b - a;   // from a to b">
        {String.raw`\amber{\mathbf{b}} - \blue{\mathbf{a}} \;=\; (\amber{b_x} - \blue{a_x},\; \amber{b_y} - \blue{a_y},\; \amber{b_z} - \blue{a_z})`}
      </Equation>
      <p>
        {tx(t, "oglVec_sub2",
          "With numbers: the player is at (2, 0, 1) and an enemy is at (5, 0, 5). The arrow from the player to the enemy is enemy − player = (5 − 2, 0 − 0, 5 − 1) = (3, 0, 4). Check: start at the player and add (3, 0, 4). You land on (5, 0, 5), the enemy.")}
      </p>
      <p>
        {tx(t, "oglVec_sub3",
          "Where 3D code uses it: the direction from the camera to what it looks at, from a surface to a light, and the edges of a triangle (B − A, C − A). You will see all three soon.")}
      </p>
      <CodeBlock lang="cpp" filename="src/mathlab.cpp (inside main)" t={t}>{`glm::vec3 a(3.0f, 1.0f, 0.0f);
glm::vec3 b(1.0f, 2.0f, 0.0f);
print("a + b", a + b);                       // (4, 3, 0)

glm::vec3 player(2.0f, 0.0f, 1.0f);
glm::vec3 enemy (5.0f, 0.0f, 5.0f);
glm::vec3 toEnemy = enemy - player;          // "to minus from"
print("enemy - player", toEnemy);            // (3, 0, 4)`}</CodeBlock>

      {/* ── SCALE ───────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglVec_scaleTitle", "Multiplying a vector by a number")}</H2>
      <p>
        {tx(t, "oglVec_scale1",
          "In words: to multiply a vector by a plain number k, multiply each of its parts by k. A plain number is called a scalar, because this is what it does to a vector: it scales it.")}
      </p>
      <Equation label={tx(t, "oglVec_scaleLabel", "Scaling")}
        glm="glm::vec3 r = k * a;">
        {String.raw`\green{k}\,\blue{\mathbf{a}} \;=\; (\green{k}\,\blue{a_x},\; \green{k}\,\blue{a_y},\; \green{k}\,\blue{a_z})`}
      </Equation>
      <p>
        {tx(t, "oglVec_scale2",
          "With numbers: 2 × (3, 1, 0) = (6, 2, 0), the same arrow twice as long. 0.5 × (3, 1, 0) = (1.5, 0.5, 0), half as long. −1 × (3, 1, 0) = (−3, −1, 0), the same length pointing the opposite way.")}
      </p>
      <p>
        {tx(t, "oglVec_scale3",
          "The direction stays the same (or flips, when k is negative). Only the length changes. Where 3D code uses it: speed. A direction times a speed is a velocity, and a velocity times the frame time is how far to move this frame.")}
      </p>
      <CodeBlock lang="cpp" filename="src/mathlab.cpp (inside main)" t={t}>{`print("2 * a", 2.0f * a);                    // (6, 2, 0)
print("0.5 * a", 0.5f * a);                  // (1.5, 0.5, 0)`}</CodeBlock>

      {/* ── LENGTH ──────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglVec_lenTitle", "Length, and what |a| means")}</H2>
      <p>
        {tx(t, "oglVec_len1",
          "The length of a vector is how long its arrow is. It is written |a|, read \"the length of a\". Some books write ‖a‖ or call it the magnitude or the norm; it is the same thing. It is always a single number, zero or positive.")}
      </p>
      <p>
        {tx(t, "oglVec_len2",
          "Start in 2D. The arrow (3, 4) goes 3 to the right and 4 up. Those two moves and the arrow form a right triangle, and the arrow is its longest side. Pythagoras' theorem gives that side: √(3² + 4²) = √(9 + 16) = √25 = 5.")}
      </p>
      <p>
        {tx(t, "oglVec_len3",
          "3D adds one more square under the root. The reason: first find the diagonal across the floor, √(x² + z²). That diagonal and the height y form a second right triangle, so the full length is √(diagonal² + y²) = √(x² + y² + z²).")}
      </p>
      <Equation label={tx(t, "oglVec_lenLabel", "Length of a vector")}
        glm="float l = glm::length(a);   float d = glm::distance(p, q);   // = length(q - p)"
        where={[
          [String.raw`\lvert\blue{\mathbf{a}}\rvert`, tx(t, "oglVec_wLen", "the length of a: one number, never negative")],
          [String.raw`\blue{a_x}^2`, tx(t, "oglVec_wSq", "aₓ times itself; squaring also makes negative parts positive")],
          [String.raw`\sqrt{\;\;}`, tx(t, "oglVec_wRoot", "the square root, which undoes the squaring")],
        ]}>
        {String.raw`\lvert\blue{\mathbf{a}}\rvert \;=\; \sqrt{\blue{a_x}^2 + \blue{a_y}^2 + \blue{a_z}^2}`}
      </Equation>
      <p>
        {tx(t, "oglVec_len4",
          "With numbers: |(2, 3, 6)| = √(4 + 9 + 36) = √49 = 7. And the player–enemy arrow: |(3, 0, 4)| = √(9 + 0 + 16) = 5. So the enemy is 5 units away. The distance between two points is the length of the arrow between them: |b − a|.")}
      </p>
      <CodeBlock lang="cpp" filename="src/mathlab.cpp (inside main)" t={t}>{`print("length(2, 3, 6)", glm::length(glm::vec3(2.0f, 3.0f, 6.0f)));  // 7
print("length(toEnemy)", glm::length(toEnemy));                       // 5
print("distance", glm::distance(player, enemy));                      // 5, the same thing`}</CodeBlock>

      {/* ── NORMALIZE ───────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglVec_normTitle", "Normalizing: keeping only the direction")}</H2>
      <p>
        {tx(t, "oglVec_norm1",
          "A unit vector is a vector of length exactly 1. It keeps only a direction, with no \"how far\". To normalize a vector means to make it length 1 without changing where it points: divide each part by the length. A unit vector is often written with a hat: â.")}
      </p>
      <Equation label={tx(t, "oglVec_normLabel", "Normalizing")}
        glm="glm::vec3 u = glm::normalize(a);">
        {String.raw`\hat{\mathbf{a}} \;=\; \frac{\blue{\mathbf{a}}}{\lvert\blue{\mathbf{a}}\rvert} \;=\; \left(\frac{\blue{a_x}}{\lvert\blue{\mathbf{a}}\rvert},\; \frac{\blue{a_y}}{\lvert\blue{\mathbf{a}}\rvert},\; \frac{\blue{a_z}}{\lvert\blue{\mathbf{a}}\rvert}\right)`}
      </Equation>
      <p>
        {tx(t, "oglVec_norm2",
          "With numbers: (3, 0, 4) has length 5, so normalized it is (3/5, 0/5, 4/5) = (0.6, 0, 0.8). Check the length: √(0.36 + 0 + 0.64) = √1 = 1.")}
      </p>
      <p>
        {tx(t, "oglVec_norm3",
          "Why 3D code needs it: often only the direction matters. To move the player toward the enemy at speed 2, use normalize(enemy − player) × 2 = (1.2, 0, 1.6). Without normalizing, (3, 0, 4) × 2 = (6, 0, 8) would move 10 units per second: faster when the enemy is far, slower when it is near. Lighting and cameras use unit vectors everywhere, for a reason the next section shows.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "oglVec_normWarn",
          "The zero vector (0, 0, 0) has length 0 and no direction. Normalizing it divides by zero, and the result is NaN (\"not a number\"). NaN spreads through every calculation it touches, and the object vanishes or flickers. Before normalizing a vector that can be zero, such as \"enemy − player\" when they stand on the same spot, check that its length is above a tiny number.")}
      </Callout>
      <CodeBlock lang="cpp" filename="src/mathlab.cpp (inside main)" t={t}>{`glm::vec3 dir = glm::normalize(toEnemy);
print("dir", dir);                           // (0.6, 0, 0.8)
print("length(dir)", glm::length(dir));      // 1
print("velocity", dir * 2.0f);               // (1.2, 0, 1.6): speed 2 toward the enemy`}</CodeBlock>
      <p>
        {tx(t, "oglVec_figIntro",
          "The figure has one tab per operation so far. Drag the tips of a and b and watch the numbers change. The last tab, \"move to target\", is the player-and-enemy example, with W the walker and G the goal.")}
      </p>
      <VectorFigure t={t} />

      {/* ── DOT ─────────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglVec_dotTitle", "The dot product: how much two arrows agree")}</H2>
      <p>
        {tx(t, "oglVec_dot1",
          "The dot product takes two vectors and gives back one number. It is written a · b, with a dot in the middle, which is where the name comes from. (It is also called the scalar product, because the result is a scalar, a single number.) It is not \"the\" way to multiply vectors: there are four kinds of vector multiplication, and the end of the chapter compares them.")}
      </p>
      <p>
        {tx(t, "oglVec_dot2",
          "How to compute it: multiply the matching parts, then add the three results.")}
      </p>
      <Equation label={tx(t, "oglVec_dotCalcLabel", "Dot product: how to compute it")}
        glm="float d = glm::dot(a, b);">
        {String.raw`\blue{\mathbf{a}} \cdot \amber{\mathbf{b}} \;=\; \blue{a_x}\amber{b_x} + \blue{a_y}\amber{b_y} + \blue{a_z}\amber{b_z}`}
      </Equation>
      <p>
        {tx(t, "oglVec_dot3",
          "With numbers: p = (1, 2, 3) and q = (4, −5, 6). p · q = 1×4 + 2×(−5) + 3×6 = 4 − 10 + 18 = 12.")}
      </p>
      <p>
        {tx(t, "oglVec_dot4",
          "12 on its own says little. The meaning comes from a second formula, which always gives the same number as the first:")}
      </p>
      <Equation label={tx(t, "oglVec_dotMeanLabel", "Dot product: what it means")}
        where={[
          [String.raw`\lvert\blue{\mathbf{a}}\rvert`, tx(t, "oglVec_wA", "the length of a")],
          [String.raw`\lvert\amber{\mathbf{b}}\rvert`, tx(t, "oglVec_wB", "the length of b")],
          [String.raw`\purple{\theta}`, tx(t, "oglVec_wTheta", "the angle between the two arrows, when their tails touch (theta, a Greek letter used for angles)")],
          [String.raw`\cos\purple{\theta}`, tx(t, "oglVec_wCos", "the cosine of that angle: 1 at 0°, 0 at 90°, −1 at 180° (table below)")],
        ]}>
        {String.raw`\blue{\mathbf{a}} \cdot \amber{\mathbf{b}} \;=\; \lvert\blue{\mathbf{a}}\rvert\;\lvert\amber{\mathbf{b}}\rvert\;\cos\purple{\theta}`}
      </Equation>
      <p>
        {tx(t, "oglVec_dot5",
          "Read it as: length of a, times length of b, times cos θ. The two lengths only make the number bigger or smaller. The part that carries the meaning is cos θ, which depends only on the angle:")}
      </p>
      <LessonTable
        headers={[tx(t, "oglVec_tAngle", "Angle θ"), "cos θ", tx(t, "oglVec_tArrows", "The two arrows…")]}
        rows={[
          ["0°", "1", tx(t, "oglVec_c0", "point the same way")],
          ["60°", "0.5", tx(t, "oglVec_c60", "point roughly the same way")],
          ["90°", "0", tx(t, "oglVec_c90", "are perpendicular (at a right angle)")],
          ["120°", "−0.5", tx(t, "oglVec_c120", "point roughly opposite ways")],
          ["180°", "−1", tx(t, "oglVec_c180", "point exactly opposite ways")],
        ]}
      />
      <p>
        {tx(t, "oglVec_dot6",
          "So the sign of a · b already tells you a lot. Positive: the arrows are less than 90° apart. Zero: perpendicular. Negative: more than 90° apart.")}
      </p>
      <p>
        {tx(t, "oglVec_dot7",
          "Now normalize both vectors first. Their lengths are 1, so the formula becomes 1 × 1 × cos θ: the dot product of two unit vectors is just cos θ. That is a clean score from −1 to 1 for \"how much do these two directions agree\". This is why lighting code normalizes everything before calling dot.")}
      </p>
      <p>
        {tx(t, "oglVec_dot8",
          "With numbers: right = (1, 0, 0) and u = (0.6, 0.8, 0) are both unit vectors. right · u = 1×0.6 + 0×0.8 + 0×0 = 0.6. So cos θ = 0.6, and the angle is the angle whose cosine is 0.6: acos(0.6) ≈ 53°. And right · (0, 1, 0) = 0, because the x axis and the y axis are perpendicular.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "oglVec_dotWhy",
          "Why do the two formulas agree? Take the 2D case a = (1, 0) and b = a unit arrow at angle θ, which is (cos θ, sin θ) by the definition of cosine and sine. The first formula gives 1 × cos θ + 0 × sin θ = cos θ, and the second gives 1 × 1 × cos θ: the same. Turning both arrows together changes neither their lengths nor the angle between them, so it changes neither formula. Any pair of arrows can be turned until a lies on the x axis, so the two formulas agree for every pair.")}
      </Callout>
      <p>
        {tx(t, "oglVec_dot9",
          "Where 3D code uses it:")}
      </p>
      <LessonTable
        headers={[tx(t, "oglVec_tTask", "Task"), tx(t, "oglVec_tHow", "How the dot product does it")]}
        rows={[
          [tx(t, "oglVec_u1", "How bright is a surface?"), tx(t, "oglVec_u1b", "dot(normal, toLight), both unit vectors: 1 when the light hits the surface head on, 0 when it grazes it, negative when the light is behind it. The Lighting chapters are built on this.")],
          [tx(t, "oglVec_u2", "Is the enemy in front of me?"), tx(t, "oglVec_u2b", "dot(forward, enemy − me) > 0 means in front, < 0 means behind. No angle needed.")],
          [tx(t, "oglVec_u3", "What is the angle between two directions?"), tx(t, "oglVec_u3b", "acos(dot(â, b̂)) for unit vectors, in radians.")],
          [tx(t, "oglVec_u4", "How far does b reach along a?"), tx(t, "oglVec_u4b", "dot(b, â) with a unit â: the length of b's \"shadow\" on a's line (the figure below shows it).")],
        ]}
      />
      <CodeBlock lang="cpp" filename="src/mathlab.cpp (inside main)" t={t}>{`glm::vec3 p(1.0f, 2.0f, 3.0f);
glm::vec3 q(4.0f, -5.0f, 6.0f);
print("dot(p, q)", glm::dot(p, q));          // 4 - 10 + 18 = 12

glm::vec3 right(1.0f, 0.0f, 0.0f);
glm::vec3 up   (0.0f, 1.0f, 0.0f);
print("dot(right, up)", glm::dot(right, up));          // 0: perpendicular
print("dot(right, -right)", glm::dot(right, -right));  // -1: opposite

float c = glm::dot(right, glm::vec3(0.6f, 0.8f, 0.0f));   // 0.6 = cos(angle)
print("angle in degrees", glm::degrees(std::acos(c)));    // 53.1301`}</CodeBlock>

      {/* ── CROSS ───────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglVec_crossTitle", "The cross product: an arrow perpendicular to two others")}</H2>
      <p>
        {tx(t, "oglVec_cross1",
          "The cross product takes two vectors and gives back a new vector that is perpendicular to both of them. It is written a × b, with a cross. (It is also called the vector product, because the result is a vector.) It exists only in 3D: in 3D there is exactly one line perpendicular to two non-parallel arrows.")}
      </p>
      <Equation label={tx(t, "oglVec_crossLabel", "Cross product")}
        glm="glm::vec3 n = glm::cross(a, b);">
        {String.raw`\blue{\mathbf{a}} \times \amber{\mathbf{b}} \;=\; \big(\,\blue{a_y}\amber{b_z} - \blue{a_z}\amber{b_y},\;\; \blue{a_z}\amber{b_x} - \blue{a_x}\amber{b_z},\;\; \blue{a_x}\amber{b_y} - \blue{a_y}\amber{b_x}\,\big)`}
      </Equation>
      <p>
        {tx(t, "oglVec_cross2",
          "There is a pattern that makes it easy to rebuild. Each part of the result uses the other two axes. The x part uses y and z; the y part uses z and x; the z part uses x and y. The order follows the cycle x → y → z → x. Each part is \"first-of-the-pair of a times second-of-the-pair of b, minus the reverse\".")}
      </p>
      <p>
        {tx(t, "oglVec_cross3",
          "With numbers, the simplest case: right = (1, 0, 0) and up = (0, 1, 0). x part: 0×0 − 0×1 = 0. y part: 0×0 − 1×0 = 0. z part: 1×1 − 0×0 = 1. So right × up = (0, 0, 1): the z axis, which points toward you. It is perpendicular to both, as promised.")}
      </p>
      <p>
        {tx(t, "oglVec_cross4",
          "Its direction follows the right-hand rule. Point the fingers of your right hand along a, curl them toward b, and your thumb points along a × b. The order matters: up × right = (0, 0, −1), the opposite arrow. In general b × a = −(a × b).")}
      </p>
      <p>
        {tx(t, "oglVec_cross5",
          "Its length means something too. It equals |a| |b| sin θ, which is the area of the parallelogram the two arrows span. sin θ is 0 at 0° and 180° and 1 at 90°, so parallel arrows give the zero vector (0, 0, 0): a flat parallelogram has no area, and there is no single perpendicular line.")}
      </p>
      <p>
        {tx(t, "oglVec_cross6",
          "With numbers: a triangle with corners A = (0, 0, 0), B = (2, 0, 0) and C = (1, 3, 0). Its edges from A are B − A = (2, 0, 0) and C − A = (1, 3, 0). Their cross product: x part 0×0 − 0×3 = 0, y part 0×1 − 2×0 = 0, z part 2×3 − 0×1 = 6. The result (0, 0, 6) is perpendicular to the triangle. Its length, 6, is the area of the parallelogram (base 2 times height 3), so the triangle's area is half of it, 3. Normalized, it is (0, 0, 1): the triangle's normal.")}
      </p>
      <p>
        {tx(t, "oglVec_cross7",
          "Where 3D code uses it: computing a surface normal from two edges of a triangle (exactly the example above), and building a camera's \"right\" direction from where it looks and which way is up (the Camera chapter does this). Since swapping the order flips the result, the order of the corners decides which side of the triangle the normal comes out of.")}
      </p>
      <CodeBlock lang="cpp" filename="src/mathlab.cpp (inside main)" t={t}>{`print("cross(right, up)", glm::cross(right, up));   // (0, 0, 1)
print("cross(up, right)", glm::cross(up, right));   // (0, 0, -1): order matters

glm::vec3 A(0.0f, 0.0f, 0.0f), B(2.0f, 0.0f, 0.0f), C(1.0f, 3.0f, 0.0f);
glm::vec3 n = glm::cross(B - A, C - A);
print("cross(B-A, C-A)", n);                 // (0, 0, 6): length 6 = parallelogram area
print("normal", glm::normalize(n));          // (0, 0, 1)

glm::vec3 pq = glm::cross(p, q);
print("cross(p, q)", pq);                    // (27, 6, -13)
print("dot(cross(p, q), p)", glm::dot(pq, p));   // 0: perpendicular to p
print("dot(cross(p, q), q)", glm::dot(pq, q));   // 0: perpendicular to q`}</CodeBlock>
      <p>
        {tx(t, "oglVec_cross8",
          "The last three lines use the dot product to check the cross product: a dot product of 0 means perpendicular, and the result is perpendicular to both p and q.")}
      </p>
      <p>
        {tx(t, "oglVec_vecFig",
          "The figure shows both products. In the dot tab, drag a and b: the thick segment is b's shadow on a's line, green when a · b is positive and red when it is negative. In the cross tab, orbit the view: the result stands straight up from the parallelogram of a and b.")}
      </p>
      <VectorOpsFigure t={t} />

      {/* ── FOUR MULTIPLIES ─────────────────────────────────────────────── */}
      <H2>{tx(t, "oglVec_mulTitle", "Four different things called \"multiply\"")}</H2>
      <p>
        {tx(t, "oglVec_mul1",
          "With plain numbers there is one multiplication. With vectors there are four, and mixing them up is a common source of bugs. The table uses p = (1, 2, 3) and q = (4, −5, 6).")}
      </p>
      <LessonTable
        headers={[tx(t, "oglVec_tOp", "Operation"), tx(t, "oglVec_tCode", "GLM / GLSL"), tx(t, "oglVec_tGives", "Gives"), tx(t, "oglVec_tEx", "Example"), tx(t, "oglVec_tUse", "Used for")]}
        rows={[
          [tx(t, "oglVec_o1", "number × vector (scaling)"), <IC key="1">{"2.0f * p"}</IC>, tx(t, "oglVec_vector", "a vector"), "(2, 4, 6)", tx(t, "oglVec_o1u", "speed, resizing an arrow")],
          [tx(t, "oglVec_o2", "part by part"), <IC key="2">{"p * q"}</IC>, tx(t, "oglVec_vector", "a vector"), "(4, −10, 18)", tx(t, "oglVec_o2u", "colours: light colour × surface colour")],
          [tx(t, "oglVec_o3", "dot product"), <IC key="3">{"dot(p, q)"}</IC>, tx(t, "oglVec_number", "a number"), "12", tx(t, "oglVec_o3u", "angles, facing, lighting")],
          [tx(t, "oglVec_o4", "cross product"), <IC key="4">{"cross(p, q)"}</IC>, tx(t, "oglVec_vector", "a vector"), "(27, 6, −13)", tx(t, "oglVec_o4u", "normals, perpendicular directions")],
        ]}
      />
      <Callout type="warn" t={t}>
        {tx(t, "oglVec_mulWarn",
          "In GLSL and GLM, p * q multiplies part by part. It is not the dot product. If you want a single number, write dot(p, q).")}
      </Callout>
      <CodeBlock lang="cpp" filename="src/mathlab.cpp (inside main)" t={t}>{`print("p * q", p * q);                       // (4, -10, 18): part by part, NOT the dot product`}</CodeBlock>

      {/* ── CHECKPOINT ──────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglVec_soFarTitle", "Your mathlab.cpp")}</H2>
      <p>
        {tx(t, "oglVec_soFar1",
          "Here is the whole file with every section's lines in place, so you can compare it with yours:")}
      </p>
      <CodeBlock lang="cpp" filename="src/mathlab.cpp" t={t}>{`#include <glm/glm.hpp>
#include <cmath>
#include <iostream>

void print(const char* name, glm::vec3 v) {
    std::cout << name << " = (" << v.x << ", " << v.y << ", " << v.z << ")\\n";
}

void print(const char* name, float x) {
    std::cout << name << " = " << x << "\\n";
}

int main() {
    // ── Adding and subtracting ──
    glm::vec3 a(3.0f, 1.0f, 0.0f);
    glm::vec3 b(1.0f, 2.0f, 0.0f);
    print("a + b", a + b);

    glm::vec3 player(2.0f, 0.0f, 1.0f);
    glm::vec3 enemy (5.0f, 0.0f, 5.0f);
    glm::vec3 toEnemy = enemy - player;
    print("enemy - player", toEnemy);

    // ── Scaling ──
    print("2 * a", 2.0f * a);
    print("0.5 * a", 0.5f * a);

    // ── Length ──
    print("length(2, 3, 6)", glm::length(glm::vec3(2.0f, 3.0f, 6.0f)));
    print("length(toEnemy)", glm::length(toEnemy));
    print("distance", glm::distance(player, enemy));

    // ── Normalizing ──
    glm::vec3 dir = glm::normalize(toEnemy);
    print("dir", dir);
    print("length(dir)", glm::length(dir));
    print("velocity", dir * 2.0f);

    // ── Dot product ──
    glm::vec3 p(1.0f, 2.0f, 3.0f);
    glm::vec3 q(4.0f, -5.0f, 6.0f);
    print("dot(p, q)", glm::dot(p, q));

    glm::vec3 right(1.0f, 0.0f, 0.0f);
    glm::vec3 up   (0.0f, 1.0f, 0.0f);
    print("dot(right, up)", glm::dot(right, up));
    print("dot(right, -right)", glm::dot(right, -right));

    float c = glm::dot(right, glm::vec3(0.6f, 0.8f, 0.0f));
    print("angle in degrees", glm::degrees(std::acos(c)));

    // ── Cross product ──
    print("cross(right, up)", glm::cross(right, up));
    print("cross(up, right)", glm::cross(up, right));

    glm::vec3 A(0.0f, 0.0f, 0.0f), B(2.0f, 0.0f, 0.0f), C(1.0f, 3.0f, 0.0f);
    glm::vec3 n = glm::cross(B - A, C - A);
    print("cross(B-A, C-A)", n);
    print("normal", glm::normalize(n));

    glm::vec3 pq = glm::cross(p, q);
    print("cross(p, q)", pq);
    print("dot(cross(p, q), p)", glm::dot(pq, p));
    print("dot(cross(p, q), q)", glm::dot(pq, q));

    // ── Part by part ──
    print("p * q", p * q);
}`}</CodeBlock>
      <p>
        {tx(t, "oglVec_soFarRun",
          "Run it and you should see exactly this. Every number is one this chapter worked out by hand:")}
      </p>
      <CodeBlock lang="text" filename="output" t={t}>{`a + b = (4, 3, 0)
enemy - player = (3, 0, 4)
2 * a = (6, 2, 0)
0.5 * a = (1.5, 0.5, 0)
length(2, 3, 6) = 7
length(toEnemy) = 5
distance = 5
dir = (0.6, 0, 0.8)
length(dir) = 1
velocity = (1.2, 0, 1.6)
dot(p, q) = 12
dot(right, up) = 0
dot(right, -right) = -1
angle in degrees = 53.1301
cross(right, up) = (0, 0, 1)
cross(up, right) = (0, 0, -1)
cross(B-A, C-A) = (0, 0, 6)
normal = (0, 0, 1)
cross(p, q) = (27, 6, -13)
dot(cross(p, q), p) = 0
dot(cross(p, q), q) = 0
p * q = (4, -10, 18)`}</CodeBlock>
      <Callout type="tip" t={t}>
        {tx(t, "oglVec_soFarTry",
          "Now change the numbers and predict the output before you run it. Move the enemy to (2, 0, 1), the player's own position, and see what normalize does with the zero vector (you will get nan, the NaN from the warning above).")}
      </Callout>

      {/* ── MISTAKES ────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglVec_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "oglVec_tMistake", "Mistake"), tx(t, "oglVec_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "oglVec_e1", "Subtracting in the wrong order"), tx(t, "oglVec_e1b", "a − b points from b to a: the object walks away instead of toward. Remember \"to minus from\".")],
          [tx(t, "oglVec_e2", "Writing a * b for the dot product"), tx(t, "oglVec_e2b", "you get a vector (part by part), not a number. Use dot(a, b).")],
          [tx(t, "oglVec_e3", "Forgetting to normalize before dot"), tx(t, "oglVec_e3b", "the result is cos θ times both lengths: lighting comes out too bright or too dark. Normalize both first.")],
          [tx(t, "oglVec_e4", "Normalizing the zero vector"), tx(t, "oglVec_e4b", "division by zero gives NaN, and the object vanishes. Check the length first.")],
          [tx(t, "oglVec_e5", "Swapping the order of a cross product"), tx(t, "oglVec_e5b", "the result points the opposite way: a normal points into the surface, and lighting turns black. cross(B − A, C − A) for corners listed counter-clockwise.")],
          [tx(t, "oglVec_e6", "Expecting a cross product of parallel vectors to work"), tx(t, "oglVec_e6b", "it is (0, 0, 0). A camera looking straight up with up = (0, 1, 0) hits this; the Camera chapter shows the fix.")],
        ]}
      />
      <p>
        {tx(t, "oglVec_next",
          "Vectors describe points and directions. The next chapter, Matrices for 3D, is about the tool that changes many points at once: one matrix moves, turns or resizes every vertex of a model in a single multiplication.")}
      </p>

      <KeyIdeas t={t} id="oglVec" items={[
        "A vec3 is three numbers, read as a point (a place) or an arrow (a direction and a length); the code decides which.",
        "Add and subtract part by part. b − a is the arrow from a to b: \"to minus from\".",
        "A number times a vector changes its length (and flips it when negative), never its line.",
        "|a| is the length of a, √(x² + y² + z²), from Pythagoras. The distance between two points is |b − a|.",
        "Normalizing divides by the length: same direction, length 1. Never normalize the zero vector.",
        "The dot product is one number, aₓbₓ + a_yb_y + a_zb_z = |a| |b| cos θ. For unit vectors it is cos θ: 1 same way, 0 perpendicular, −1 opposite.",
        "The cross product is a vector perpendicular to both, with length |a| |b| sin θ (the parallelogram's area). Order matters: b × a = −(a × b).",
        "In GLSL and GLM, a * b multiplies part by part; it is not the dot product.",
      ]} />
    </Article>
  );
}
