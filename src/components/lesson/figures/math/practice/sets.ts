// ── Which exercises each chapter practises ────────────────────────────────────
// A set is what one MathPracticeFigure offers: its title and one or more
// kinds of exercise (the reader can mix them or pick one). The set id is part
// of the storage key of the best score, so keep ids stable.

import type { Gen } from "./problem";
import { bases, fractions, gcdLcm, order, percent, powers, signed } from "./arithmetic";
import { modInverse, modPower, modReduce } from "./modular";
import { sumClosed, sumGeometric, sumTelescope } from "./summation";
import { indStart, indStep } from "./induction";
import { setMultiples, setSizes, setUnion } from "./setcount";
import { logicCount } from "./logic";
import { binomialChoose, binomialCoef, collect, evaluate, explog, linear, quadratic, sequences, system } from "./algebra";

export type Kind = { id: string; label: [string, string]; make: Gen };
export type PracticeSet = { title: [string, string]; kinds: Kind[] };

export const SETS = {
  signed:     { title: ["mpr_tSigned", "Practice: signed numbers"], kinds: [{ id: "signed", label: ["mpr_kSigned", "signed numbers"], make: signed }] },
  order:      { title: ["mpr_tOrder", "Practice: order of operations"], kinds: [{ id: "order", label: ["mpr_kOrder", "order of operations"], make: order }] },
  fractions:  { title: ["mpr_tFractions", "Practice: fractions"], kinds: [{ id: "fractions", label: ["mpr_kFractions", "fractions"], make: fractions }] },
  percent:    { title: ["mpr_tPercent", "Practice: percent and proportion"], kinds: [{ id: "percent", label: ["mpr_kPercent", "percent"], make: percent }] },
  divisors:   { title: ["mpr_tDivisors", "Practice: gcd and lcm"], kinds: [{ id: "gcd", label: ["mpr_kGcd", "gcd and lcm"], make: gcdLcm }] },
  powers:     { title: ["mpr_tPowers", "Practice: powers and roots"], kinds: [{ id: "powers", label: ["mpr_kPowers", "powers"], make: powers }] },
  bases:      { title: ["mpr_tBases", "Practice: number bases"], kinds: [{ id: "bases", label: ["mpr_kBases", "bases"], make: bases }] },
  modular:    { title: ["mpr_tModular", "Practice: modular arithmetic"], kinds: [
    { id: "reduce", label: ["mpr_kModReduce", "remainders"], make: modReduce },
    { id: "power", label: ["mpr_kModPow", "powers"], make: modPower },
    { id: "inverse", label: ["mpr_kModInv", "inverses"], make: modInverse },
  ] },
  expressions: { title: ["mpr_tExpressions", "Practice: expressions"], kinds: [
    { id: "eval", label: ["mpr_kEval", "evaluate"], make: evaluate },
    { id: "collect", label: ["mpr_kCollect", "simplify"], make: collect },
  ] },
  linear:     { title: ["mpr_tLinear", "Practice: linear equations"], kinds: [{ id: "linear", label: ["mpr_kLinear", "equations"], make: linear }] },
  systems:    { title: ["mpr_tSystems", "Practice: systems of equations"], kinds: [{ id: "system", label: ["mpr_kSystem", "systems"], make: system }] },
  quadratics: { title: ["mpr_tQuadratics", "Practice: quadratic equations"], kinds: [{ id: "quadratic", label: ["mpr_kQuadratic", "quadratics"], make: quadratic }] },
  binomial:   { title: ["mpr_tBinomial", "Practice: the binomial theorem"], kinds: [
    { id: "coef", label: ["mpr_kBinCoef", "coefficients"], make: binomialCoef },
    { id: "choose", label: ["mpr_kBinChoose", "C(n, k)"], make: binomialChoose },
  ] },
  explog:     { title: ["mpr_tExpLog", "Practice: exponents and logarithms"], kinds: [{ id: "explog", label: ["mpr_kExpLog", "exponents and logs"], make: explog }] },
  sequences:  { title: ["mpr_tSequences", "Practice: sequences"], kinds: [{ id: "sequences", label: ["mpr_kSequences", "sequences"], make: sequences }] },
  summation:  { title: ["mpr_tSummation", "Practice: sums"], kinds: [
    { id: "closed", label: ["mpr_kSumClosed", "closed forms"], make: sumClosed },
    { id: "telescope", label: ["mpr_kSumTele", "telescoping"], make: sumTelescope },
    { id: "geometric", label: ["mpr_kSumGeo", "geometric"], make: sumGeometric },
  ] },
  setCounting: { title: ["mpr_tSets", "Practice: counting with sets"], kinds: [
    { id: "union", label: ["mpr_kSetUnion", "unions"], make: setUnion },
    { id: "multiples", label: ["mpr_kSetMult", "multiples"], make: setMultiples },
    { id: "sizes", label: ["mpr_kSetSizes", "subsets and products"], make: setSizes },
  ] },
  logic:      { title: ["mpr_tLogic", "Practice: truth tables"], kinds: [{ id: "count", label: ["mpr_kLogic", "true rows"], make: logicCount }] },
  induction:  { title: ["mpr_tInduction", "Practice: induction"], kinds: [
    { id: "step", label: ["mpr_kIndStep", "use the hypothesis"], make: indStep },
    { id: "start", label: ["mpr_kIndStart", "where to start"], make: indStart },
  ] },
} satisfies Record<string, PracticeSet>;

export type SetId = keyof typeof SETS;
