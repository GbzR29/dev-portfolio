"use client";

// Calculus 2: the derivative — average rate of change as a secant slope;
// the instantaneous rate as the limit of the difference quotient; the tangent
// line; derivatives of x², x³, 1/x and √x straight from the definition; the
// derivative as a function; notation and units; higher derivatives (velocity,
// acceleration, jerk); where derivatives fail; estimating derivatives from a
// table of measurements.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { DerivativeFigure } from "@/components/lesson/figures/math/DerivativeFigure";

const r = String.raw;
const num = (v: number, d = 4) => String(+v.toFixed(d)).replace("-", "−");
const par = (v: number) => (v < 0 ? `(${num(v)})` : num(v));
/** 0.0012 → 1.2 × 10⁻³, in TeX. */
const sci = (v: number) => {
  const [m, e] = v.toExponential(1).split("e");
  return r`${m} \times 10^{${e.replace("-", "−")}}`;
};

// ── Live formulas: the numbers plugged in ─────────────────────────────────────

/** The difference quotient of x² at a with step h: always 2a + h. */
function quotientNumbers(v: Record<string, number>) {
  const { a, h } = v, fa = a * a, fb = (a + h) ** 2, q = (fb - fa) / h;
  if (Math.abs(h) < 1e-9) return { tex: r`\frac{${par(a)}^2 - ${par(a)}^2}{0} = \red{\frac{0}{0}} \qquad f'(${num(a)}) = 2 \cdot ${par(a)} = \green{${num(2 * a)}}` };
  return {
    tex: r`\frac{${par(a + h)}^2 - ${par(a)}^2}{${num(h)}} = \frac{${num(fb)} - ${num(fa)}}{${num(h)}} = \amber{${num(q)}} \qquad f'(${num(a)}) = 2 \cdot ${par(a)} = \green{${num(2 * a)}}`,
  };
}

/** Forward and central differences of sin at x = 1, against the exact cos 1. */
const differenceNumbers = (t: TrackTranslations) => (v: Record<string, number>) => {
  const h = v.h, exact = Math.cos(1);
  const fwd = (Math.sin(1 + h) - Math.sin(1)) / h, cen = (Math.sin(1 + h) - Math.sin(1 - h)) / (2 * h);
  return {
    tex: r`\begin{aligned} \text{${tx(t, "mDer_liveFwd", "forward")}:}\quad \frac{\sin ${num(1 + h, 3)} - \sin 1}{${num(h, 3)}} &= \amber{${fwd.toFixed(5)}} & \text{${tx(t, "mDer_liveErr", "error")} } ${sci(Math.abs(fwd - exact))} \\ \text{${tx(t, "mDer_liveCen", "central")}:}\quad \frac{\sin ${num(1 + h, 3)} - \sin ${num(1 - h, 3)}}{${num(2 * h, 3)}} &= \green{${cen.toFixed(5)}} & \text{${tx(t, "mDer_liveErr", "error")} } ${sci(Math.abs(cen - exact))} \\ \text{${tx(t, "mDer_liveExact", "exact")}:}\quad \cos 1 &= ${exact.toFixed(5)} \end{aligned}`,
  };
};

export function DerivativesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mDer_intro",
          "The slope of a straight line tells you how fast it climbs, and it is the same everywhere. A curve climbs at different rates at different places. The derivative measures that rate at a single point: how fast the output changes per unit change of the input, right there. It is speed from position, acceleration from speed, the steepness of a hill under your feet, and the key to finding the highest and lowest points of anything.")}
      </Lead>

      <Goals t={t} id="mDer" items={[
        "Go from an average rate of change to the rate at one instant.",
        "Compute a derivative from its definition.",
        "Read a derivative's units and notation, and take a second derivative.",
        "Spot where a derivative does not exist, and estimate one from data.",
      ]} />

      <H2>{tx(t, "mDer_avgTitle", "Average rate of change")}</H2>
      <p>
        {tx(t, "mDer_avgBody",
          "A ball rolls down a ramp, and its distance from the start after t seconds is s(t) = t² metres. Between t = 1 and t = 3 it goes from s = 1 to s = 9: 8 metres in 2 seconds, an average speed of 4 m/s. On the graph that average is the slope of the straight line through the two points (1, 1) and (3, 9), rise over run as in the functions chapter. A line through two points of a curve is called a secant (from the Latin for \"cutting\"). Its slope is the average rate of change over the interval.")}
      </p>
      <Equation label={tx(t, "mDer_eqAvg", "Average rate of change from a to a + h")}
        where={[
          [r`h`, tx(t, "mDer_wH", "the length of the interval, the run (it may be negative: then the second point is to the left)")],
          [r`f(a + h) - f(a)`, tx(t, "mDer_wRise", "the change in output over that interval, the rise")],
        ]}
        note={tx(t, "mDer_avgNote", "This fraction is called the difference quotient. For the ball, a = 1 and h = 2: (s(3) − s(1))/2 = (9 − 1)/2 = 4 m/s.")}
        words={tx(t, "mDer_avgWords", "How much the output changed, divided by how much the input changed.")}>
        {r`\text{average rate} = \frac{f(a + h) - f(a)}{h}`}
      </Equation>

      <H2>{tx(t, "mDer_instTitle", "From average to instant")}</H2>
      <p>
        {tx(t, "mDer_instBody",
          "How fast is the ball going at exactly t = 1? Shrink the interval and watch the averages. From 1 to 1.1: (1.21 − 1)/0.1 = 2.1 m/s. From 1 to 1.01: (1.0201 − 1)/0.01 = 2.01. From 1 to 1.001: 2.001. The averages close in on 2, and algebra confirms it for every h at once: (1 + h)² − 1 = 2h + h², and dividing by h gives 2 + h. As h → 0 that tends to 2. The speed at t = 1 is 2 m/s. We could not simply put h = 0 (that is 0/0); we took a limit, exactly as in the previous chapter.")}
      </p>
      <LessonTable
        headers={["h", "1", "0.1", "0.01", "0.001", "→ 0"]}
        rows={[[tx(t, "mDer_tAvg", "average speed (s(1 + h) − s(1))/h"), "3", "2.1", "2.01", "2.001", "2"]]}
      />
      <LiveFormula label={tx(t, "mDer_liveQuot", "Try it: the difference quotient of x²")}
        tex={r`\frac{(a + h)^2 - a^2}{h} = 2a + h \;\xrightarrow{\;h \to 0\;}\; 2a`}
        vars={[
          { id: "a", label: "a", min: -2, max: 2, step: 0.5, value: 1, fmt: v => num(v) },
          { id: "h", label: "h", min: -1, max: 1, step: 0.01, value: 0.1, fmt: v => num(v, 2) },
        ]}
        compute={quotientNumbers}
        note={tx(t, "mDer_liveQuotNote", "Starts on the ball at t = 1 with h = 0.1: 2.1, as in the table. Whatever a is, the amber result is always 2a + h, so it lands on the green 2a as h shrinks. At h = 0 itself the fraction is 0/0: the derivative is only reached as a limit.")} />

      <H2>{tx(t, "mDer_defTitle", "The definition")}</H2>
      <p>
        {tx(t, "mDer_defBody",
          "The derivative of f at a is the limit of the difference quotient as the interval shrinks to nothing. Geometrically, as the second point slides into the first, the secant turns into the tangent line, the line that just grazes the curve at that point and has the same direction as the curve there. So the derivative is the slope of the tangent. If the limit exists, f is called differentiable at a.")}
      </p>
      <Equation label={tx(t, "mDer_eqDef", "The derivative of f at a")}
        where={[
          [r`f'(a)`, tx(t, "mDer_wFp", "\"f prime of a\": the instantaneous rate of change of f at a, the slope of the tangent there")],
          [r`\lim_{h \to 0}`, tx(t, "mDer_wLim", "the limit as the interval shrinks, from both sides; h itself is never 0")],
          [r`\frac{f(a+h) - f(a)}{h}`, tx(t, "mDer_wQuot", "the slope of the secant through (a, f(a)) and (a + h, f(a + h))")],
        ]}
        words={tx(t, "mDer_defWords", "The slope at a is what the slopes of the secants from a settle on as the second point slides into a.")}>
        {r`f'(a) = \lim_{h \to 0} \frac{f(a + h) - f(a)}{h}`}
      </Equation>
      <p>
        {tx(t, "mDer_tanBody",
          "Once the slope is known, the tangent line itself comes from the point-slope form of the analytic geometry chapter: it passes through (a, f(a)) with slope f′(a). Near a, this line is the best straight-line imitation of the curve; zoom into any smooth curve far enough and it looks straight, and the straight line it looks like is the tangent. That idea, local linearity, is behind almost every application in the next chapters.")}
      </p>
      <Equation label={tx(t, "mDer_eqTan", "The tangent line at a")}
        where={[
          [r`(a, f(a))`, tx(t, "mDer_wPt", "the point of contact")],
          [r`f'(a)`, tx(t, "mDer_wSl", "its slope")],
        ]}
        note={tx(t, "mDer_tanNote", "For s(t) = t² at t = 1: y = 1 + 2(t − 1) = 2t − 1.")}
        words={tx(t, "mDer_tanWords", "Start at the height of the curve at a, and for every step away from a, climb by the slope there times the step.")}>
        {r`y = f(a) + f'(a)\,(x - a)`}
      </Equation>

      <DerivativeFigure t={t} />

      <H2>{tx(t, "mDer_fnTitle", "The derivative as a function")}</H2>
      <p>
        {tx(t, "mDer_fnGen",
          "Nothing in the ball calculation depended on a being 1. Doing it for a general x gives the slope of x² everywhere at once.")}
      </p>
      <Derivation t={t} label={tx(t, "mDer_eqSq", "The derivative of x², from the definition")}
        steps={[
          { tex: r`\frac{d}{dx}\,x^2` },
          { tex: r`= \lim_{h \to 0} \frac{(x + h)^2 - x^2}{h}`, why: tx(t, "mDer_q1", "the definition, with f(x) = x²") },
          { tex: r`= \lim_{h \to 0} \frac{x^2 + 2xh + h^2 - x^2}{h}`, why: tx(t, "mDer_q2", "expand (x + h)² = x² + 2xh + h²") },
          { tex: r`= \lim_{h \to 0} \frac{2xh + h^2}{h}`, why: tx(t, "mDer_q3", "x² and −x² cancel") },
          { tex: r`= \lim_{h \to 0} \,(2x + h)`, why: tx(t, "mDer_q4", "divide by h, allowed because h ≠ 0 while it shrinks") },
          { tex: r`= \green{2x}`, why: tx(t, "mDer_q5", "no 0/0 any more: let h go to 0") },
        ]} />
      <p>
        {tx(t, "mDer_fnGen2",
          "So the derivative is itself a function, f′(x) = 2x. The second mode of the figure draws it by recording the tangent's slope as you drag: the curve that appears underneath is f′. The same recipe (expand, cancel h, let h → 0) handles more functions.")}
      </p>
      <LessonTable
        headers={["f(x)", tx(t, "mDer_tSteps", "Difference quotient, simplified"), "f′(x)"]}
        rows={[
          ["c " + tx(t, "mDer_tConst", "(constant)"), "(c − c)/h = 0", "0"],
          ["mx + b", "(m(x + h) + b − mx − b)/h = m", "m"],
          ["x²", "(2xh + h²)/h = 2x + h", "2x"],
          ["x³", "(3x²h + 3xh² + h³)/h = 3x² + 3xh + h²", "3x²"],
          ["1/x", "(x − (x + h))/(h·x(x + h)) = −1/(x(x + h))", "−1/x²"],
          ["√x", tx(t, "mDer_tSqrt", "multiply by the conjugate: ((x + h) − x)/(h(√(x + h) + √x)) = 1/(√(x + h) + √x)"), "1/(2√x)"],
        ]}
      />
      <p>
        {tx(t, "mDer_fnBody2",
          "Each row makes sense geometrically. A constant is flat, slope 0. A line has the same slope m everywhere. The parabola x² is flat at the bottom (2 · 0 = 0), falls to the left (negative slope) and rises ever more steeply to the right. 1/x always falls, and the fall is steepest near 0. √x rises steeply at first and then flattens out. The (x + h)³ expansion comes from multiplying (x + h)(x + h)(x + h) out, as in the polynomials chapter; the rules chapter turns this pattern into a one-line rule for any power.")}
      </p>

      <H2>{tx(t, "mDer_notTitle", "Notation and units")}</H2>
      <p>
        {tx(t, "mDer_notBody",
          "Several notations are in use, and all mean the same. Lagrange's f′(x) is compact. Leibniz's dy/dx (read \"d y d x\") recalls the fraction it came from, Δy/Δx, with the d meaning \"an infinitely small change in\"; it is not really a fraction, but it often behaves like one, which the chain rule will exploit. d/dx on its own is an instruction: \"take the derivative with respect to x of whatever follows\". Physicists write a dot for time derivatives, ẋ. Whatever the notation, the units are output units per input unit: metres per second for a position, degrees per metre for a slope angle, gold per minute for a resource counter.")}
      </p>
      <Equation label={tx(t, "mDer_eqNot", "Four ways to write the same derivative")}
        where={[
          [r`\frac{dy}{dx}`, tx(t, "mDer_wLeib", "Leibniz: the change in y per change in x, in the limit")],
          [r`\frac{d}{dx}`, tx(t, "mDer_wOp", "the operator \"differentiate with respect to x\"")],
          [r`\dot{x}`, tx(t, "mDer_wDot", "Newton's dot: the rate of change of x with respect to time")],
        ]}>
        {r`f'(x) \;=\; \frac{dy}{dx} \;=\; \frac{d}{dx}\,f(x) \qquad \text{(and } \dot{x} = \tfrac{dx}{dt}\text{)}`}
      </Equation>

      <H2>{tx(t, "mDer_higherTitle", "Derivatives of derivatives")}</H2>
      <p>
        {tx(t, "mDer_higherBody",
          "The derivative of f′ is the second derivative f″ (or d²y/dx²): the rate at which the slope itself changes. Motion is the classic chain. Position s(t); its derivative is velocity v = s′ (how fast the position changes); the derivative of velocity is acceleration a = v′ = s″ (how fast the velocity changes); the next one, rarely named in school but important in engineering, is jerk, the rate of change of acceleration. For the ball, s = t², v = 2t, a = 2: a constant acceleration of 2 m/s², which is what a ball on a ramp does. A lift or a train whose acceleration jumps suddenly feels like a kick even when the velocity is continuous, which is why their controls are designed to keep the jerk small.")}
      </p>
      <Equation label={tx(t, "mDer_eqMotion", "Position, velocity, acceleration")}
        where={[
          [r`s(t)`, tx(t, "mDer_wS", "position at time t (m)")],
          [r`v(t) = s'(t)`, tx(t, "mDer_wV", "velocity (m/s): the slope of the position graph")],
          [r`a(t) = v'(t) = s''(t)`, tx(t, "mDer_wA", "acceleration (m/s²): the slope of the velocity graph")],
        ]}>
        {r`s = t^2 \;\xrightarrow{\;d/dt\;}\; v = 2t \;\xrightarrow{\;d/dt\;}\; a = 2`}
      </Equation>

      <H2>{tx(t, "mDer_failTitle", "Where the derivative does not exist")}</H2>
      <p>
        {tx(t, "mDer_failBody",
          "The limit in the definition can fail in three typical ways. At a corner, such as |x| at 0, secants from the right have slope +1 and from the left −1; no single tangent fits (try it in the figure). At a vertical tangent, such as the cube root ∛x at 0, the secants get steeper without bound and the slope would be infinite. At a break, a jump or a hole, there is no well-defined point to be tangent to. Every differentiable function is continuous (a jump would make the rise stay large while the run shrinks), but a continuous function may still have corners, so differentiable is the stronger demand.")}
      </p>

      <H2>{tx(t, "mDer_numTitle", "Estimating derivatives from data")}</H2>
      <p>
        {tx(t, "mDer_numBody",
          "When a function is only known from measurements (positions read off a stopwatch, temperatures every hour, heights along a path), its derivative can be estimated by taking the definition with a small but finite h, the spacing of the data. The forward difference is exactly the difference quotient. The central difference steps half-way in both directions and is far more accurate: its errors from the two sides cancel, so its error shrinks like h² instead of h. Halving h cuts the forward difference's error in half but the central difference's to a quarter.")}
      </p>
      <Equation label={tx(t, "mDer_eqNum", "Forward and central differences")}
        where={[
          [r`h`, tx(t, "mDer_wHnum", "a small step, but not too small (see below)")],
          [r`O(h),\ O(h^2)`, tx(t, "mDer_wOrder", "how the error scales: proportional to h, or to h²")],
        ]}
        words={tx(t, "mDer_numWords", "Forward: the slope from x to one step ahead. Central: the slope from one step behind to one step ahead, which sits evenly round x.")}>
        {r`f'(x) \approx \frac{f(x + h) - f(x)}{h} \;\;\text{error} \sim O(h) \qquad f'(x) \approx \frac{f(x + h) - f(x - h)}{2h} \;\;\text{error} \sim O(h^2)`}
      </Equation>
      <LiveFormula label={tx(t, "mDer_liveDiff", "Try it: the slope of sin x at x = 1")}
        tex={r`\frac{\sin(1 + h) - \sin 1}{h} \qquad \frac{\sin(1 + h) - \sin(1 - h)}{2h} \qquad \cos 1`}
        vars={[{ id: "h", label: "h", min: 0.01, max: 0.5, step: 0.01, value: 0.1, fmt: v => num(v, 2) }]}
        compute={differenceNumbers(t)}
        note={tx(t, "mDer_liveDiffNote", "Halve h, from 0.2 to 0.1: the forward error halves, the central error drops to a quarter. At h = 0.01 the central difference matches cos 1 to four digits, the forward one only to one, as in worked example 4.")} />
      <p>
        {tx(t, "mDer_numBody2",
          "How small should h be? With measured data there is no choice: h is the time or distance between readings. With a formula and a calculator, a smaller h is better only up to a point. The limits chapter showed that subtracting two nearly equal numbers throws away digits, and dividing by a tiny h magnifies what is left; on a 10-digit calculator, h around 0.001 is a good compromise. Measurements also carry small errors, and differences magnify those too, so a derivative estimated from rough data is always rougher than the data.")}
      </p>
      <LessonTable
        headers={["t (s)", "0", "1", "2", "3", "4"]}
        rows={[[tx(t, "mDer_tPos", "position s (m)"), "0", "3", "12", "27", "48"]]}
      />
      <p>
        {tx(t, "mDer_tableBody",
          "A car's position is read every second (the readings happen to follow s = 3t²). Its speed at t = 2 s: the forward difference gives (27 − 12)/1 = 15 m/s, the backward difference (12 − 3)/1 = 9 m/s, and the central difference (27 − 3)/2 = 12 m/s. The exact speed is s′ = 6t = 12 m/s: the central difference hits it, because for a parabola its errors from the two sides cancel completely.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "mDer_secondTip", "The same three readings give the second derivative: (f(x + h) − 2f(x) + f(x − h))/h², the change between the slope on the right and the slope on the left, divided by h. For the car: (27 − 2 · 12 + 3)/1² = 6 m/s², exactly s″ = 6.")}
      </Callout>

      <H2>{tx(t, "mDer_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mDer_ex1", "1. f(x) = 3x² from the definition: (3(x + h)² − 3x²)/h = (6xh + 3h²)/h = 6x + 3h → 6x. At x = 2 the slope is 12.")}</p>
      <p>{tx(t, "mDer_ex2", "2. Tangent to y = x³ at x = 1: f(1) = 1, f′(1) = 3 · 1² = 3, so y = 1 + 3(x − 1) = 3x − 2. At x = 1.1 the curve gives 1.331 and the tangent 1.3: close, because the point is near.")}</p>
      <p>{tx(t, "mDer_ex3", "3. A ball thrown straight up has height h(t) = 20t − 5t² metres. Velocity h′(t) = 20 − 10t m/s (differentiate each term, using the table). It stops rising when 20 − 10t = 0, at t = 2 s, at a height of 20 m. Acceleration h″ = −10 m/s²: gravity, pointing down.")}</p>
      <H3>{tx(t, "mDer_ex4Title", "A numeric check")}</H3>
      <p>{tx(t, "mDer_ex4", "4. Estimate the slope of sin x at x = 1 with h = 0.01. Forward: (sin 1.01 − sin 1)/0.01 = 0.53609. Central: (sin 1.01 − sin 0.99)/0.02 = 0.54029. The exact value, as the next chapter shows, is cos 1 = 0.54030. The central difference is right to four digits; the forward one only to one.")}</p>

      <H2>{tx(t, "mDer_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mDer_tWrong", "Wrong"), tx(t, "mDer_tRight", "Right"), tx(t, "mDer_tWhy", "Why")]}
        rows={[
          [tx(t, "mDer_m1w", "setting h = 0 in the quotient"), tx(t, "mDer_m1r", "simplify first, then let h → 0"), tx(t, "mDer_m1", "h = 0 gives 0/0")],
          [tx(t, "mDer_m2w", "f′(a) is the slope of any line through (a, f(a))"), tx(t, "mDer_m2r", "only the tangent's slope"), tx(t, "mDer_m2", "secants give average rates, not the rate at a point")],
          [tx(t, "mDer_m3w", "continuous means differentiable"), tx(t, "mDer_m3r", "corners are continuous but not differentiable"), tx(t, "mDer_m3", "|x| at 0")],
          [tx(t, "mDer_m4w", "the tiniest h the calculator allows"), tx(t, "mDer_m4r", "a moderate h, central differences"), tx(t, "mDer_m4", "rounding error grows as h shrinks")],
          [tx(t, "mDer_m5w", "forgetting units"), tx(t, "mDer_m5r", "output units per input unit"), tx(t, "mDer_m5", "m per s, not m")],
        ]}
      />

      <KeyIdeas t={t} id="mDer" items={[
        "Secant slope (f(a + h) − f(a))/h is an average rate of change.",
        "The derivative f′(a) is its limit as h → 0: the tangent's slope, the instantaneous rate.",
        "The tangent line y = f(a) + f′(a)(x − a) is the best straight-line imitation of f near a.",
        "f′ is a function: x² → 2x, x³ → 3x², 1/x → −1/x², √x → 1/(2√x).",
        "Position → velocity → acceleration → jerk: each is the derivative of the one before.",
        "No derivative at corners, vertical tangents or breaks.",
        "From data, use the central difference (f(x + h) − f(x − h))/2h; its error shrinks like h².",
      ]} />
    </Article>
  );
}
