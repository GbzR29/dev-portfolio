// src/lib/tracks/math/index.tsx
"use client";

// The Math track: pure mathematics from arithmetic upward, worked by hand,
// each topic with interactive figures. The programming tracks link back here.

import type { Chapter } from "@/lib/tracks/types";

const ARITHMETIC = "Arithmetic";
const ALGEBRA = "Algebra";
const GEOMETRY = "Geometry";
const TRIGONOMETRY = "Trigonometry";
const LINEAR_ALGEBRA = "Linear Algebra";
const CALCULUS = "Calculus";
const PROBABILITY = "Probability & Statistics";

const chapters: Chapter[] = [
  { id: "number-line",         section: ARITHMETIC, title: "Numbers & the Number Line",    minRead: 16, load: () => import("./chapters/number-line").then((m) => m.NumberLineContent) },
  { id: "order-of-operations", section: ARITHMETIC, title: "Order of Operations",          minRead: 13, load: () => import("./chapters/order-of-operations").then((m) => m.OrderOfOperationsContent) },
  { id: "fractions",           section: ARITHMETIC, title: "Fractions & Decimals",         minRead: 19, load: () => import("./chapters/fractions").then((m) => m.FractionsContent) },
  { id: "ratios",              section: ARITHMETIC, title: "Ratios, Proportion & Percent", minRead: 16, load: () => import("./chapters/ratios").then((m) => m.RatiosContent) },
  { id: "divisibility",        section: ARITHMETIC, title: "Divisibility, Primes, GCD & LCM", minRead: 17, load: () => import("./chapters/divisibility").then((m) => m.DivisibilityContent) },
  { id: "powers",              section: ARITHMETIC, title: "Powers & Roots",               minRead: 17, load: () => import("./chapters/powers").then((m) => m.PowersContent) },
  { id: "bases",               section: ARITHMETIC, title: "Number Bases",                 minRead: 15, load: () => import("./chapters/bases").then((m) => m.BasesContent) },

  { id: "expressions",      section: ALGEBRA, title: "Expressions",               minRead: 15, load: () => import("./chapters/expressions").then((m) => m.ExpressionsContent) },
  { id: "linear-equations", section: ALGEBRA, title: "Linear Equations",          minRead: 17, load: () => import("./chapters/linear-equations").then((m) => m.LinearEquationsContent) },
  { id: "inequalities",     section: ALGEBRA, title: "Inequalities",              minRead: 15, load: () => import("./chapters/inequalities").then((m) => m.InequalitiesContent) },
  { id: "algebra",          section: ALGEBRA, title: "Functions & Graphs",        minRead: 17, load: () => import("./chapters/functions").then((m) => m.AlgebraContent) },
  { id: "linear-systems",   section: ALGEBRA, title: "Systems of Equations",      minRead: 16, load: () => import("./chapters/linear-systems").then((m) => m.LinearSystemsContent) },
  { id: "quadratics",       section: ALGEBRA, title: "Quadratics",                minRead: 19, load: () => import("./chapters/quadratics").then((m) => m.QuadraticsContent) },
  { id: "polynomials",      section: ALGEBRA, title: "Polynomials",               minRead: 18, load: () => import("./chapters/polynomials").then((m) => m.PolynomialsContent) },
  { id: "exponents",        section: ALGEBRA, title: "Exponents & Logarithms",    minRead: 13, load: () => import("./chapters/exponents").then((m) => m.ExpLogContent) },
  { id: "sequences",        section: ALGEBRA, title: "Sequences & Series",        minRead: 17, load: () => import("./chapters/sequences").then((m) => m.SequencesContent) },

  { id: "angles",          section: GEOMETRY, title: "Points, Lines & Angles",    minRead: 17, load: () => import("./chapters/angles").then((m) => m.AnglesContent) },
  { id: "triangles",       section: GEOMETRY, title: "Triangles & Congruence",    minRead: 18, load: () => import("./chapters/triangles").then((m) => m.TrianglesContent) },
  { id: "area",            section: GEOMETRY, title: "Perimeter & Area",          minRead: 18, load: () => import("./chapters/area").then((m) => m.AreaContent) },
  { id: "pythagoras",      section: GEOMETRY, title: "The Pythagorean Theorem",   minRead: 17, load: () => import("./chapters/pythagoras").then((m) => m.PythagorasContent) },
  { id: "similarity",      section: GEOMETRY, title: "Similarity & Scale",        minRead: 25, load: () => import("./chapters/similarity").then((m) => m.SimilarityContent) },
  { id: "circle",          section: GEOMETRY, title: "Circles & π",               minRead: 19, load: () => import("./chapters/circle").then((m) => m.CircleContent) },
  { id: "volumes",         section: GEOMETRY, title: "Volume & Surface Area",     minRead: 18, load: () => import("./chapters/volumes").then((m) => m.VolumesContent) },
  { id: "analytic",        section: GEOMETRY, title: "Coordinate Geometry & Conics", minRead: 20, load: () => import("./chapters/analytic").then((m) => m.AnalyticContent) },
  { id: "transformations", section: GEOMETRY, title: "Transformations",           minRead: 17, load: () => import("./chapters/transformations").then((m) => m.TransformationsContent) },

  { id: "trig",          section: TRIGONOMETRY, title: "Right-Triangle Trigonometry",  minRead: 18, load: () => import("./chapters/trig").then((m) => m.TrigContent) },
  { id: "unit-circle",   section: TRIGONOMETRY, title: "Radians & the Unit Circle",    minRead: 17, load: () => import("./chapters/unit-circle").then((m) => m.UnitCircleContent) },
  { id: "triangle-laws", section: TRIGONOMETRY, title: "Laws of Sines & Cosines",      minRead: 18, load: () => import("./chapters/triangle-laws").then((m) => m.TriangleLawsContent) },
  { id: "identities",    section: TRIGONOMETRY, title: "Identities & Rotation",        minRead: 17, load: () => import("./chapters/identities").then((m) => m.IdentitiesContent) },
  { id: "polar",         section: TRIGONOMETRY, title: "Polar Coordinates & atan2",    minRead: 16, load: () => import("./chapters/polar").then((m) => m.PolarContent) },
  { id: "waves",         section: TRIGONOMETRY, title: "Waves & Oscillation",          minRead: 17, load: () => import("./chapters/waves").then((m) => m.WavesContent) },

  { id: "vectors",   section: LINEAR_ALGEBRA, title: "Vectors",                   minRead: 13, load: () => import("./chapters/vectors").then((m) => m.VectorsContent) },
  { id: "dot",       section: LINEAR_ALGEBRA, title: "The Dot Product",           minRead: 14, load: () => import("./chapters/vectors").then((m) => m.DotContent) },
  { id: "cross",     section: LINEAR_ALGEBRA, title: "The Cross Product",         minRead: 14, load: () => import("./chapters/vectors").then((m) => m.CrossContent) },
  { id: "matrices",    section: LINEAR_ALGEBRA, title: "Matrices & Linear Maps",    minRead: 20, load: () => import("./chapters/matrices").then((m) => m.MatricesContent) },
  { id: "determinant", section: LINEAR_ALGEBRA, title: "The Determinant",           minRead: 18, load: () => import("./chapters/determinant").then((m) => m.DeterminantContent) },
  { id: "inverse",     section: LINEAR_ALGEBRA, title: "Inverses & Linear Systems", minRead: 19, load: () => import("./chapters/inverse").then((m) => m.InverseContent) },
  { id: "eigen",       section: LINEAR_ALGEBRA, title: "Eigenvalues & Eigenvectors", minRead: 18, load: () => import("./chapters/eigen").then((m) => m.EigenContent) },
  { id: "complex",     section: LINEAR_ALGEBRA, title: "Complex Numbers",           minRead: 19, load: () => import("./chapters/complex").then((m) => m.ComplexContent) },
  { id: "quaternions", section: LINEAR_ALGEBRA, title: "Quaternions & 3D Rotation", minRead: 20, load: () => import("./chapters/quaternions").then((m) => m.QuaternionsContent) },

  { id: "limits",           section: CALCULUS, title: "Limits & Continuity",         minRead: 19, load: () => import("./chapters/limits").then((m) => m.LimitsContent) },
  { id: "derivatives",      section: CALCULUS, title: "The Derivative",              minRead: 19, load: () => import("./chapters/derivatives").then((m) => m.DerivativesContent) },
  { id: "derivative-rules", section: CALCULUS, title: "Rules of Differentiation",    minRead: 20, load: () => import("./chapters/derivative-rules").then((m) => m.DerivativeRulesContent) },
  { id: "derivative-uses",  section: CALCULUS, title: "Using Derivatives",           minRead: 21, load: () => import("./chapters/derivative-uses").then((m) => m.DerivativeUsesContent) },
  { id: "integrals",        section: CALCULUS, title: "Integrals: Area by Strips",   minRead: 19, load: () => import("./chapters/integrals").then((m) => m.IntegralsContent) },
  { id: "ftc",              section: CALCULUS, title: "The Fundamental Theorem",     minRead: 18, load: () => import("./chapters/ftc").then((m) => m.FtcContent) },
  { id: "integration-techniques", section: CALCULUS, title: "Techniques of Integration", minRead: 22, load: () => import("./chapters/integration-techniques").then((m) => m.IntegrationTechniquesContent) },
  { id: "series",                 section: CALCULUS, title: "Taylor Series",             minRead: 21, load: () => import("./chapters/series").then((m) => m.SeriesContent) },
  { id: "partial-derivatives",    section: CALCULUS, title: "Partial Derivatives & the Gradient", minRead: 21, load: () => import("./chapters/partial-derivatives").then((m) => m.PartialDerivativesContent) },
  { id: "multiple-integrals",     section: CALCULUS, title: "Multiple Integrals",        minRead: 20, load: () => import("./chapters/multiple-integrals").then((m) => m.MultipleIntegralsContent) },
  { id: "differential-equations", section: CALCULUS, title: "Differential Equations",    minRead: 22, load: () => import("./chapters/differential-equations").then((m) => m.DifferentialEquationsContent) },

  { id: "descriptive-stats", section: PROBABILITY, title: "Descriptive Statistics",          minRead: 20, load: () => import("./chapters/descriptive-stats").then((m) => m.DescriptiveStatsContent) },
  { id: "counting",         section: PROBABILITY, title: "Counting: Permutations & Combinations", minRead: 20, load: () => import("./chapters/counting").then((m) => m.CountingContent) },
  { id: "probability",      section: PROBABILITY, title: "Probability Basics",              minRead: 19, load: () => import("./chapters/probability").then((m) => m.ProbabilityContent) },
  { id: "conditional",      section: PROBABILITY, title: "Conditional Probability & Bayes", minRead: 21, load: () => import("./chapters/conditional").then((m) => m.ConditionalContent) },
  { id: "random-variables", section: PROBABILITY, title: "Random Variables",                minRead: 20, load: () => import("./chapters/random-variables").then((m) => m.RandomVariablesContent) },
  { id: "expectation",       section: PROBABILITY, title: "Expectation & Variance",          minRead: 22, load: () => import("./chapters/expectation").then((m) => m.ExpectationContent) },
  { id: "distributions",     section: PROBABILITY, title: "Common Distributions",            minRead: 24, load: () => import("./chapters/distributions").then((m) => m.DistributionsContent) },
  { id: "sampling",          section: PROBABILITY, title: "Sampling & Inference",            minRead: 23, load: () => import("./chapters/sampling").then((m) => m.SamplingContent) },
  { id: "regression",        section: PROBABILITY, title: "Correlation & Linear Regression", minRead: 21, load: () => import("./chapters/regression").then((m) => m.RegressionContent) },
  { id: "markov-chains",     section: PROBABILITY, title: "Markov Chains",                   minRead: 34, load: () => import("./chapters/markov-chains").then((m) => m.MarkovChainsContent) },
  { id: "absorbing-chains",  section: PROBABILITY, title: "Absorbing Chains & Hitting Times", minRead: 38, load: () => import("./chapters/absorbing-chains").then((m) => m.AbsorbingChainsContent) },
];

// ── Prerequisites ────────────────────────────────────────────────────────────
// What each chapter builds on, listed in its "Before you start" box. Only
// earlier chapters; the direct needs, not everything they in turn need.

const requires: Record<string, string[]> = {
  "order-of-operations": ["number-line"],
  "fractions":           ["number-line", "order-of-operations"],
  "ratios":              ["fractions"],
  "divisibility":        ["fractions"],
  "powers":              ["order-of-operations"],
  "bases":               ["powers", "divisibility"],

  "expressions":      ["order-of-operations", "fractions"],
  "linear-equations": ["expressions"],
  "inequalities":     ["linear-equations"],
  "algebra":          ["linear-equations"],
  "linear-systems":   ["linear-equations", "algebra"],
  "quadratics":       ["algebra", "powers"],
  "polynomials":      ["quadratics"],
  "exponents":        ["powers", "algebra"],
  "sequences":        ["exponents"],

  "angles":          ["number-line"],
  "triangles":       ["angles"],
  "area":            ["triangles"],
  "pythagoras":      ["area", "powers"],
  "similarity":      ["triangles", "ratios"],
  "circle":          ["area", "pythagoras"],
  "volumes":         ["circle", "similarity"],
  "analytic":        ["pythagoras", "algebra", "quadratics", "circle"],
  "transformations": ["analytic", "angles"],

  "trig":          ["pythagoras", "similarity"],
  "unit-circle":   ["trig", "circle"],
  "triangle-laws": ["unit-circle"],
  "identities":    ["unit-circle", "transformations"],
  "polar":         ["unit-circle", "analytic"],
  "waves":         ["unit-circle", "algebra"],

  "vectors":     ["pythagoras", "trig"],
  "dot":         ["vectors"],
  "cross":       ["dot"],
  "matrices":    ["vectors", "linear-systems", "identities"],
  "determinant": ["matrices", "area"],
  "inverse":     ["determinant", "linear-systems"],
  "eigen":       ["inverse", "quadratics"],
  "complex":     ["polar", "identities", "quadratics"],
  "quaternions": ["complex", "cross", "matrices"],

  "limits":                 ["algebra", "sequences"],
  "derivatives":            ["limits"],
  "derivative-rules":       ["derivatives", "exponents", "identities"],
  "derivative-uses":        ["derivative-rules"],
  "integrals":              ["limits", "sequences"],
  "ftc":                    ["integrals", "derivative-rules"],
  "integration-techniques": ["ftc"],
  "series":                 ["derivative-rules", "sequences"],
  "partial-derivatives":    ["derivative-rules", "dot"],
  "multiple-integrals":     ["ftc", "polar"],
  "differential-equations": ["integration-techniques", "exponents"],

  "descriptive-stats": ["ratios", "powers"],
  "counting":          ["powers"],
  "probability":       ["counting", "fractions"],
  "conditional":       ["probability"],
  "random-variables":  ["conditional", "integrals", "ftc", "descriptive-stats"],
  "expectation":       ["random-variables"],
  "distributions":     ["expectation", "counting", "exponents"],
  "sampling":          ["distributions", "descriptive-stats"],
  "regression":        ["descriptive-stats", "partial-derivatives", "dot"],
  "markov-chains":     ["conditional", "random-variables", "matrices", "sequences"],
  "absorbing-chains":  ["markov-chains", "expectation", "inverse"],
};

export const mathChapters: Chapter[] = chapters.map((c) => ({ ...c, requires: requires[c.id] }));
