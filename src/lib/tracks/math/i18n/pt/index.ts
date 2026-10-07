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
// ── Algebra ──
import expressions from "./expressions";
import linearEquations from "./linear-equations";
import inequalities from "./inequalities";
import functions from "./functions";
import linearSystems from "./linear-systems";
import quadratics from "./quadratics";
import polynomials from "./polynomials";
import exponents from "./exponents";
import sequences from "./sequences";
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

const bundle: LessonText = {
  strings: {
    ...numberLine, ...orderOfOperations, ...fractions, ...ratios, ...divisibility, ...powers, ...bases,
    ...expressions, ...linearEquations, ...inequalities, ...functions, ...linearSystems, ...quadratics, ...polynomials, ...exponents, ...sequences,
    ...angles, ...triangles, ...area, ...pythagoras, ...similarity, ...circle, ...volumes, ...analytic, ...transformations,
    ...trig, ...unitCircle, ...triangleLaws, ...identities, ...polar, ...waves,
    ...vectors, ...matrices, ...determinant, ...inverse, ...eigen, ...complex, ...quaternions,
    ...limits, ...derivatives, ...derivativeRules, ...derivativeUses, ...integrals, ...ftc, ...integrationTechniques, ...series, ...partialDerivatives, ...multipleIntegrals, ...differentialEquations,
    ...descriptiveStats, ...counting, ...probability, ...conditional, ...randomVariables, ...expectation, ...distributions, ...sampling, ...regression, ...markovChains,
  },
  titles: track.titles,
  sections: track.sections,
};

export default bundle;
