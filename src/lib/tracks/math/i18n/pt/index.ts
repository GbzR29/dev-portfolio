// PT text for this track, loaded on demand by src/lib/i18n/lessons.ts.

import type { LessonText } from "@/lib/i18n/lessons";
import track from "./_track";
// ── Arithmetic ──
import numberLine from "./number-line";
import orderOfOperations from "./order-of-operations";
import fractions from "./fractions";
import ratios from "./ratios";
import divisibility from "./divisibility";
import powers from "./powers";
import bases from "./bases";
import modular from "./modular";
// ── Algebra ──
import expressions from "./expressions";
import linearEquations from "./linear-equations";
import inequalities from "./inequalities";
import functions from "./functions";
import linearSystems from "./linear-systems";
import quadratics from "./quadratics";
import polynomials from "./polynomials";
import polynomialDivision from "./polynomial-division";
import binomial from "./binomial";
import exponents from "./exponents";
import sequences from "./sequences";
// ── Logic & Proof ──
import sets from "./sets";
import logic from "./logic";
import proofs from "./proofs";
import summation from "./summation";
import induction from "./induction";
// ── Geometry ──
import angles from "./angles";
import triangles from "./triangles";
import area from "./area";
import pythagoras from "./pythagoras";
import similarity from "./similarity";
import circle from "./circle";
import volumes from "./volumes";
import analytic from "./analytic";
import transformations from "./transformations";
// ── Trigonometry ──
import trig from "./trig";
import unitCircle from "./unit-circle";
import triangleLaws from "./triangle-laws";
import identities from "./identities";
import trigEquations from "./trig-equations";
import polar from "./polar";
import waves from "./waves";
// ── Linear Algebra ──
import vectors from "./vectors";
import matrices from "./matrices";
import determinant from "./determinant";
import inverse from "./inverse";
import eigen from "./eigen";
import complex from "./complex";
import quaternions from "./quaternions";
// ── Calculus ──
import limits from "./limits";
import derivatives from "./derivatives";
import derivativeRules from "./derivative-rules";
import derivativeUses from "./derivative-uses";
import integrals from "./integrals";
import ftc from "./ftc";
import integrationTechniques from "./integration-techniques";
import series from "./series";
import partialDerivatives from "./partial-derivatives";
import multipleIntegrals from "./multiple-integrals";
import differentialEquations from "./differential-equations";
import vectorFields from "./vector-fields";
import lineIntegrals from "./line-integrals";
import greenStokes from "./green-stokes";
import fourier from "./fourier";
import calculusOfVariations from "./calculus-of-variations";
import pde from "./pde";
// ── Probability & Statistics ──
import descriptiveStats from "./descriptive-stats";
import counting from "./counting";
import probability from "./probability";
import conditional from "./conditional";
import randomVariables from "./random-variables";
import expectation from "./expectation";
import distributions from "./distributions";
import sampling from "./sampling";
import regression from "./regression";
import markovChains from "./markov-chains";
import absorbingChains from "./absorbing-chains";
// ── Discrete Mathematics ──
import graphsIntro from "./graphs-intro";
import eulerPaths from "./euler-paths";
import treesMath from "./trees-math";
import planarColoring from "./planar-coloring";
import recurrences from "./recurrences";

const bundle: LessonText = {
  strings: {
    ...numberLine, ...orderOfOperations, ...fractions, ...ratios, ...divisibility, ...powers, ...bases, ...modular,
    ...expressions, ...linearEquations, ...inequalities, ...functions, ...linearSystems, ...quadratics, ...polynomials, ...polynomialDivision, ...binomial, ...exponents, ...sequences,
    ...sets, ...logic, ...proofs, ...summation, ...induction,
    ...angles, ...triangles, ...area, ...pythagoras, ...similarity, ...circle, ...volumes, ...analytic, ...transformations,
    ...trig, ...unitCircle, ...triangleLaws, ...identities, ...trigEquations, ...polar, ...waves,
    ...vectors, ...matrices, ...determinant, ...inverse, ...eigen, ...complex, ...quaternions,
    ...limits, ...derivatives, ...derivativeRules, ...derivativeUses, ...integrals, ...ftc, ...integrationTechniques, ...series, ...partialDerivatives, ...multipleIntegrals, ...differentialEquations, ...vectorFields, ...lineIntegrals, ...greenStokes, ...fourier, ...calculusOfVariations, ...pde,
    ...descriptiveStats, ...counting, ...probability, ...conditional, ...randomVariables, ...expectation, ...distributions, ...sampling, ...regression, ...markovChains, ...absorbingChains,
    ...graphsIntro, ...eulerPaths, ...treesMath, ...planarColoring, ...recurrences,
  },
  titles: track.titles,
  sections: track.sections,
};

export default bundle;
