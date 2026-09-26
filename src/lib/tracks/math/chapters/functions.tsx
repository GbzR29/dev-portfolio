"use client";

// Algebra 4: functions and graphs — the idea of a function, notation,
// domain and range, reading a graph, linear functions and slope, piecewise
// functions, the four graph transformations, composition and inverses.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { FunctionFigure } from "@/components/lesson/figures/math/FunctionFigure";

const r = String.raw;

export function AlgebraContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mFn_intro",
          "The previous chapters solved for one unknown value. A function describes a whole relationship at once: how damage depends on distance, how brightness depends on the time of day, how a position depends on time. It is the single most important idea in the mathematics of graphics and games, because almost everything a program computes is a function of something else. This chapter defines functions carefully, shows how to read them as graphs, and gives you the tools to build new functions by moving, stretching, combining and reversing known ones.")}
      </Lead>

      <H2>{tx(t, "mAlg_fnTitle", "Functions")}</H2>
      <p>
        {tx(t, "mAlg_fnBody",
          "A function is a rule that turns each input into exactly one output: f(x) = x² turns 3 into 9. The set of allowed inputs is the domain (√x only accepts x ≥ 0 among reals), the set of outputs it can produce is the range (x² never produces negatives). Its graph is the set of all points (x, f(x)), drawn as a curve. Games are full of functions: damage as a function of distance, experience needed as a function of level, brightness as a function of time of day. Thinking of them as curves you can see and reshape makes them much easier to design.")}
      </p>
      <Equation label={tx(t, "mFn_eqNotation", "Function notation")}
        where={[
          [r`f`, tx(t, "mFn_wF", "the name of the function, the rule itself. Other letters work too: g, h, or descriptive names like damage")],
          [r`x`, tx(t, "mFn_wX", "the input, also called the argument or the independent variable")],
          [r`f(x)`, tx(t, "mFn_wFx", "the output for input x, read \"f of x\". It is not f times x: the parentheses hold the input")],
          [r`f(3) = 2 \cdot 3 + 1 = 7`, tx(t, "mFn_wEval", "evaluating: replace every x in the rule with the input, in parentheses")],
        ]}>
        {r`f(x) = 2x + 1 \qquad f(3) = 7 \qquad f(-1) = -1 \qquad f(a + 1) = 2a + 3`}
      </Equation>
      <p>
        {tx(t, "mFn_machineBody",
          "A good mental picture is a machine: an input goes in, the rule is applied, one output comes out. The same input always gives the same output. That is precisely what a pure C++ function with one parameter does, and it is why functions without side effects are so easy to test and reason about. The only requirement is \"exactly one output per input\"; two different inputs may share an output (x² gives 4 for both 2 and −2).")}
      </p>
      <LessonTable
        headers={[tx(t, "mFn_tForm", "Form"), tx(t, "mFn_tExample", "Example"), tx(t, "mFn_tGood", "Good for")]}
        rows={[
          [tx(t, "mFn_r1", "formula"), "f(x) = 2x + 1", tx(t, "mFn_r1g", "exact values, algebra")],
          [tx(t, "mFn_r2", "table"), "x: 0, 1, 2 → f: 1, 3, 5", tx(t, "mFn_r2g", "measured data, lookup tables (LUTs), keyframes")],
          [tx(t, "mFn_r3", "graph"), tx(t, "mFn_r3e", "a straight line through (0, 1) and (1, 3)"), tx(t, "mFn_r3g", "seeing the shape: growth, peaks, where it is zero")],
          [tx(t, "mFn_r4", "code"), "float f(float x) { return 2*x + 1; }", tx(t, "mFn_r4g", "computing it millions of times")],
        ]}
      />

      <H3>{tx(t, "mFn_domTitle", "Domain and range")}</H3>
      <p>
        {tx(t, "mFn_domBody",
          "Among real numbers, three things restrict the domain: you cannot divide by zero, you cannot take an even root (like √) of a negative number, and you cannot take the logarithm of zero or a negative number. So 1/(x − 2) has domain \"every x except 2\", and √(x + 3) has domain x ≥ −3 (an inequality, solved as in the previous chapter). In code these are exactly the inputs that produce inf or NaN, so finding the domain is finding what your function must guard against. The range is found by asking which outputs can actually occur: x² + 1 is never below 1, so its range is [1, ∞).")}
      </p>

      <H2>{tx(t, "mFn_readTitle", "Reading a graph")}</H2>
      <p>
        {tx(t, "mFn_readBody",
          "A graph turns a function into a picture you can read at a glance. The horizontal position is the input, the height is the output. Where the curve crosses the x axis the output is 0: those inputs are the zeros or roots, the solutions of f(x) = 0. Where it crosses the y axis is f(0), the y-intercept. Where the curve goes up from left to right, the function is increasing; where it goes down, decreasing. Its highest and lowest points are its maxima and minima. A curve is the graph of a function only if every vertical line meets it at most once (the vertical line test), because each input has one output.")}
      </p>
      <LessonTable
        headers={[tx(t, "mFn_tQuestion", "Question"), tx(t, "mFn_tLook", "Look at the graph for")]}
        rows={[
          [tx(t, "mFn_q1", "What is f(2)?"), tx(t, "mFn_q1l", "the height of the curve above x = 2")],
          [tx(t, "mFn_q2", "Solve f(x) = 0"), tx(t, "mFn_q2l", "where the curve crosses the x axis")],
          [tx(t, "mFn_q3", "Solve f(x) = 5"), tx(t, "mFn_q3l", "where the curve crosses the horizontal line y = 5")],
          [tx(t, "mFn_q4", "Solve f(x) > 0"), tx(t, "mFn_q4l", "the x values where the curve is above the axis")],
          [tx(t, "mFn_q5", "Solve f(x) = g(x)"), tx(t, "mFn_q5l", "where the two curves cross (the next chapter)")],
        ]}
      />

      <H2>{tx(t, "mFn_linTitle", "Linear functions and slope")}</H2>
      <p>
        {tx(t, "mFn_linBody",
          "The simplest functions change at a constant rate: every step of 1 in x changes y by the same amount m. Their graphs are straight lines. The slope m is that rate, \"rise over run\": pick any two points on the line, divide the change in y by the change in x. A positive slope rises, a negative one falls, 0 is flat, and a larger |m| is steeper. Speed is a slope (metres per second), and so is a price per item.")}
      </p>
      <Equation label={tx(t, "mAlg_eqLine", "Linear functions")}
        where={[
          [r`m`, tx(t, "mAlg_wM", "the slope: how much y changes when x increases by 1. Between two points it is rise over run, (y₂ − y₁)/(x₂ − x₁)")],
          [r`b`, tx(t, "mAlg_wB", "the intercept: the value at x = 0, where the line crosses the y axis")],
        ]}
        note={tx(t, "mAlg_eqLineNote", "A straight line through two points (x₁, y₁) and (x₂, y₂) is y = y₁ + m(x − x₁). If you set x₁ = 0, x₂ = 1, this is exactly lerp(y₁, y₂, x) from the Game Dev track.")}>
        {r`y = m\,x + b`}
      </Equation>
      <p>
        {tx(t, "mFn_linEx",
          "Example: a line through (1, 3) and (4, 9). The slope is (9 − 3)/(4 − 1) = 6/3 = 2. Then y = 3 + 2(x − 1) = 2x + 1. Check the other point: 2 · 4 + 1 = 9 ✓. Its zero is where 2x + 1 = 0, the linear equation x = −½.")}
      </p>

      <H2>{tx(t, "mFn_pieceTitle", "Piecewise functions")}</H2>
      <p>
        {tx(t, "mFn_pieceBody",
          "Many useful functions use different rules on different parts of the domain. The absolute value is the classic: |x| is x when x ≥ 0 and −x when x < 0. clamp, step and a damage falloff (\"full damage up to 2 m, then decreasing to 0 at 10 m\") are all piecewise. In code a piecewise function is simply an if, or a min/max. When designing one, check the joins: if the pieces do not meet where they switch, the output jumps, which on screen shows up as a pop.")}
      </p>
      <Equation label={tx(t, "mFn_eqFalloff", "A damage falloff")}
        where={[
          [r`d`, tx(t, "mFn_wD", "the distance to the explosion, in metres")],
          [r`100`, tx(t, "mFn_w100", "full damage, dealt at 2 m or closer")],
          [r`100\,\frac{10 - d}{8}`, tx(t, "mFn_wLin", "a straight line from 100 at d = 2 down to 0 at d = 10; 8 is the width of the falloff zone")],
        ]}
        note={tx(t, "mFn_eqFalloffNote", "The pieces meet: at d = 2 the middle rule gives 100 · 8/8 = 100, and at d = 10 it gives 0. No jumps.")}>
        {r`D(d) = \begin{cases} 100 & d \le 2 \\ 100\,\dfrac{10 - d}{8} & 2 < d < 10 \\ 0 & d \ge 10 \end{cases}`}
      </Equation>
      <CodeBlock lang="cpp" filename="falloff.cpp" t={t}>{`float damage(float d) {
    if (d <= 2)  return 100;
    if (d >= 10) return 0;
    return 100 * (10 - d) / 8;
}
// The same function without branches, using clamp:
float damage2(float d) { return 100 * std::clamp((10 - d) / 8, 0.0f, 1.0f); }`}</CodeBlock>

      <H2>{tx(t, "mAlg_transTitle", "Moving and stretching graphs")}</H2>
      <p>
        {tx(t, "mAlg_transBody",
          "You rarely need a brand-new function; you need a known one moved or stretched into place. Four numbers do all of it. Two act on the output (outside f), two on the input (inside f). The outside ones behave the way you expect. The inside ones behave in reverse, because they change which input f sees: to see what f normally shows at 0, the input must be c, so subtracting c moves the graph right.")}
      </p>
      <Equation label={tx(t, "mAlg_eqTrans", "The four transformations")}
        where={[
          [r`a`, tx(t, "mAlg_wA", "vertical scale: multiplies every output. a = 2 doubles heights; a < 0 flips the graph upside down")],
          [r`b`, tx(t, "mAlg_wBh", "horizontal scale: multiplies the input, so b = 2 makes things happen twice as fast (half as wide); b < 0 mirrors left–right")],
          [r`c`, tx(t, "mAlg_wC", "horizontal shift: the graph moves right by c")],
          [r`d`, tx(t, "mAlg_wD", "vertical shift: the graph moves up by d")],
        ]}>
        {r`y = a\cdot f\big(b\,(x - c)\big) + d`}
      </Equation>

      <FunctionFigure t={t} />

      <H2>{tx(t, "mAlg_compTitle", "Composition and inverses")}</H2>
      <p>
        {tx(t, "mFn_compBody",
          "Feeding one function's output into another is composition, written (f ∘ g)(x) = f(g(x)): apply g first, then f. The order matters: squaring then adding 1 is not adding 1 then squaring. Graphics pipelines are long compositions: model transform, then view, then projection. An inverse function f⁻¹ undoes f: f⁻¹(f(x)) = x. It only exists if f never sends two inputs to the same output (x² sends 2 and −2 to 4, so √ can only undo it for x ≥ 0). The graph of f⁻¹ is the graph of f mirrored across the diagonal line y = x, because inverting swaps the roles of input and output. You will see that mirror again in the exponents chapter, between exponentials and logarithms.")}
      </p>
      <Equation label={tx(t, "mAlg_eqInv", "Inverting a linear function")}
        where={[
          [r`y = m\,x + b`, tx(t, "mAlg_wFwd", "the forward function")],
          [r`x = (y - b) / m`, tx(t, "mAlg_wBack", "solving for x gives the inverse. Inverse lerp, (v − a)/(b − a), is exactly this")],
        ]}>
        {r`f(x) = m\,x + b \quad\Longrightarrow\quad f^{-1}(y) = \frac{y - b}{m}`}
      </Equation>
      <p>
        {tx(t, "mFn_invSteps",
          "The recipe for finding an inverse is the one from the linear equations chapter: write y = f(x), solve for x, then rename. For f(x) = 3x − 6: y = 3x − 6, so y + 6 = 3x and x = (y + 6)/3. Check: f⁻¹(f(4)) = f⁻¹(6) = 12/3 = 4 ✓.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "mFn_remapInfo", "The most used composition in shader and gameplay code is remap: take a value from the range [a, b] to the range [c, d]. It is inverse lerp (where is v between a and b, as a fraction t?) followed by lerp (the same fraction between c and d): remap(v) = lerp(c, d, (v − a)/(b − a)). Two linear functions composed are again linear.")}
      </Callout>

      <H2>{tx(t, "mFn_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mFn_tWrong", "Wrong"), tx(t, "mFn_tRight", "Right"), tx(t, "mFn_tWhy", "Why")]}
        rows={[
          ["f(x + 1) = f(x) + 1", tx(t, "mFn_m1r", "substitute x + 1 for x"), tx(t, "mFn_m1", "for f(x) = x², f(x + 1) = x² + 2x + 1, not x² + 1")],
          ["f⁻¹(x) = 1/f(x)", tx(t, "mFn_m2r", "the function that undoes f"), tx(t, "mFn_m2", "the −1 means inverse function, not reciprocal")],
          [tx(t, "mFn_m3w", "f(x + c) moves right"), tx(t, "mFn_m3r", "f(x − c) moves right"), tx(t, "mFn_m3", "inside the function the shift works in reverse")],
          ["(f ∘ g)(x) = g(f(x))", "(f ∘ g)(x) = f(g(x))", tx(t, "mFn_m4", "read compositions right to left: g first")],
          [tx(t, "mFn_m5w", "ignoring the domain"), tx(t, "mFn_m5r", "guard 1/x, √x, log x"), tx(t, "mFn_m5", "outside the domain code returns inf or NaN, which then spreads")],
        ]}
      />

      <KeyIdeas t={t} id="mFn" items={[
        "A function gives exactly one output for each input; f(x) is the output, not f times x.",
        "The domain is the allowed inputs: no division by 0, no √ or log of negatives.",
        "Read graphs: height = output, crossings of the x axis = zeros, rising = increasing.",
        "y = mx + b: the slope m is rise over run, b is the value at 0.",
        "Piecewise functions switch rules; check the pieces meet so nothing jumps.",
        "y = a·f(b(x − c)) + d: outside knobs act as expected, inside knobs act in reverse.",
        "(f ∘ g)(x) = f(g(x)); an inverse undoes a function and mirrors its graph across y = x.",
      ]} />
    </Article>
  );
}
