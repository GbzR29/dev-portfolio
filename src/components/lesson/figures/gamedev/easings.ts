// ── Easing functions ──────────────────────────────────────────────────────────
// Each "in" curve maps t ∈ [0, 1] to progress with f(0) = 0 and f(1) = 1.
// "out" is the in curve played backwards and upside down: 1 − in(1 − t).
// "inOut" runs the in curve on the first half and the out curve on the second,
// each squeezed into half the time and half the height.

export type Ease = (t: number) => number;

const PI = Math.PI;
const C1 = 1.70158;            // Penner's "back" overshoot: gives a 10% overshoot
const C3 = C1 + 1;

export const IN: Record<string, Ease> = {
  linear: t => t,
  sine: t => 1 - Math.cos((t * PI) / 2),
  quad: t => t * t,
  cubic: t => t * t * t,
  quart: t => t ** 4,
  expo: t => (t === 0 ? 0 : 2 ** (10 * t - 10)),
  circ: t => 1 - Math.sqrt(1 - t * t),
  back: t => C3 * t * t * t - C1 * t * t,
  elastic: t => (t === 0 || t === 1 ? t : -(2 ** (10 * t - 10)) * Math.sin((t * 10 - 10.75) * ((2 * PI) / 3))),
  bounce: t => 1 - bounceOut(1 - t),
};

function bounceOut(t: number) {
  // Four parabolic arcs; 7.5625 = 1 / (1/2.75)² makes the first arc reach 1 at t = 1/2.75
  const n = 7.5625, d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
}

export type Variant = "in" | "out" | "inOut";

export function ease(name: string, variant: Variant): Ease {
  const f = IN[name] ?? IN.linear;
  if (variant === "in") return f;
  if (variant === "out") return t => 1 - f(1 - t);
  return t => (t < 0.5 ? f(2 * t) / 2 : 1 - f(2 - 2 * t) / 2);
}

/** Hermite smoothstep, the "free" ease every shader language ships with. */
export const smoothstep: Ease = t => t * t * (3 - 2 * t);
