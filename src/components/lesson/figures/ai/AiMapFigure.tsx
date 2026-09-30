"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, C, T } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The field as nested regions: artificial intelligence contains hand-written
// rules, search and planning, and machine learning; machine learning splits
// into supervised, unsupervised and reinforcement learning, and deep learning
// (neural networks with many layers) cuts across all three. Clicking a region
// shows what it is, a concrete example, and where this track covers it.

type Key = "ai" | "rules" | "search" | "ml" | "sup" | "unsup" | "rl" | "dl";
type Box = { k: Key; x: number; y: number; w: number; h: number; color: string; label: string };

export function AiMapFigure({ t }: { t?: TrackTranslations }) {
  const [sel, setSel] = useState<Key>("sup");
  const L = (k: string, en: string) => tx(t, `figAiMap_${k}`, en);

  const boxes: Box[] = [
    { k: "ai", x: 8, y: 8, w: 624, h: 290, color: "#94a3b8", label: L("ai", "Artificial intelligence") },
    { k: "rules", x: 22, y: 38, w: 150, h: 116, color: C.amber, label: L("rules", "Hand-written rules") },
    { k: "search", x: 22, y: 166, w: 150, h: 118, color: C.orange, label: L("search", "Search & planning") },
    { k: "ml", x: 186, y: 38, w: 432, h: 246, color: C.sky, label: L("ml", "Machine learning") },
    { k: "sup", x: 198, y: 66, w: 132, h: 206, color: C.blue, label: L("sup", "Supervised") },
    { k: "unsup", x: 340, y: 66, w: 132, h: 206, color: C.teal, label: L("unsup", "Unsupervised") },
    { k: "rl", x: 482, y: 66, w: 124, h: 206, color: C.green, label: L("rl", "Reinforcement") },
  ];
  const dl = { x: 198, y: 204, w: 408, h: 44 };

  const info: Record<Key, [string, string, string]> = {
    ai: [L("aiD", "Any program that makes decisions we would call intelligent: choosing a move, recognising a face, planning a path, answering a question."), L("aiE", "A chess engine, a spam filter, a game enemy that flanks you, a chatbot."), L("aiW", "The whole track.")],
    rules: [L("rulesD", "A person writes the decision logic by hand: if-then rules, state machines, behaviour trees. Nothing is learned from data; the program is only as smart as its author."), L("rulesE", "An enemy that attacks when the player is within 5 m and flees below 20% health."), L("rulesW", "Mentioned here; state machines and behaviour trees live in the Game Dev track.")],
    search: [L("searchD", "The program explores possible futures and picks the best: it needs a model of the world (the rules of the game) but no training data."), L("searchE", "A* finding a path on a map, minimax choosing a chess move, Monte Carlo tree search in Go."), L("searchW", "Section RL & Game AI (minimax, MCTS); A* is in the Algorithms track.")],
    ml: [L("mlD", "The program's behaviour is a function with adjustable numbers (parameters), and an algorithm sets those numbers from examples so that the function fits them."), L("mlE", "Predicting a delivery time from the distance, after seeing past deliveries."), L("mlW", "Everything from the Foundations section on.")],
    sup: [L("supD", "Learning from examples that come with the right answer (the label). Regression predicts a number, classification predicts a category."), L("supE", "Distance → delivery time (regression); an email's words → spam or not (classification)."), L("supW", "Foundations and Classic Machine Learning; most of Neural Networks.")],
    unsup: [L("unsupD", "Learning from examples without answers: finding groups, directions of variation or a compact description of the data."), L("unsupE", "Grouping players by play style from their statistics, with no style labels given."), L("unsupW", "Classic Machine Learning (k-means); embeddings in Deep Learning.")],
    rl: [L("rlD", "Learning by acting: an agent tries actions, receives rewards, and learns which actions lead to more reward over time. No one gives it the right answer."), L("rlE", "An agent that learns to balance a pole or win a game by playing it thousands of times."), L("rlW", "Section RL & Game AI (bandits, MDPs, Q-learning).")],
    dl: [L("dlD", "Machine learning with neural networks of many layers, which learn their own features from raw data. It is a kind of model, not a kind of learning, so it appears in all three columns."), L("dlE", "Recognising digits from pixels, translating text, a language model."), L("dlW", "Sections Neural Networks and Deep Learning.")],
  };

  const pick = (k: Key) => (e: React.MouseEvent) => { e.stopPropagation(); setSel(k); };
  const [desc, ex, where] = info[sel];

  return (
    <Figure
      title={L("title", "A map of artificial intelligence")}
      controls={<div className="space-y-1.5 text-[12.5px] leading-relaxed">
        <p><b style={{ color: "var(--text-main)" }}>{sel === "dl" ? L("dl", "Deep learning") : boxes.find(b => b.k === sel)!.label}.</b> {desc}</p>
        <p><span className="text-[var(--text-muted)]">{L("example", "Example")}:</span> {ex}</p>
        <p><span className="text-[var(--text-muted)]">{L("where", "In this track")}:</span> {where}</p>
      </div>}
      note={L("note", "Click any region. The nesting is the point: machine learning is one way of building AI, not all of it, and deep learning is one family of machine-learning models. Real systems mix them: a game character may use rules to pick a goal, search to plan a path to it, and a learned model to aim.")}
    >
      <svg viewBox="0 0 640 306" className="w-full h-auto" role="img" style={{ cursor: "pointer" }}>
        {boxes.map(b => (
          <g key={b.k} onClick={pick(b.k)}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={10} fill={b.color} fillOpacity={sel === b.k ? 0.22 : 0.07}
              stroke={b.color} strokeWidth={sel === b.k ? 2.2 : 1.2} />
            <T x={b.x + 10} y={b.y + 17} size={10} bold color={b.color}>{b.label}</T>
          </g>
        ))}
        <g onClick={pick("dl")}>
          <rect x={dl.x} y={dl.y} width={dl.w} height={dl.h} rx={8} fill={C.purple} fillOpacity={sel === "dl" ? 0.35 : 0.18} stroke={C.purple} strokeWidth={sel === "dl" ? 2.2 : 1.2} strokeDasharray="5 3" />
          <T x={dl.x + dl.w / 2} y={dl.y + 27} size={10} bold anchor="middle" color={C.purple}>{L("dl", "Deep learning")}</T>
        </g>
        <T x={32} y={78} size={8.5}>if / else, FSM,</T>
        <T x={32} y={92} size={8.5}>{L("bt", "behaviour trees")}</T>
        <T x={32} y={206} size={8.5}>A*, minimax,</T>
        <T x={32} y={220} size={8.5}>MCTS</T>
        <T x={208} y={96} size={8.5}>{L("regr", "regression")}</T>
        <T x={208} y={110} size={8.5}>{L("classif", "classification")}</T>
        <T x={350} y={96} size={8.5}>{L("clust", "clustering")}</T>
        <T x={350} y={110} size={8.5}>{L("dimred", "dimension reduction")}</T>
        <T x={492} y={96} size={8.5}>{L("reward", "reward, policy")}</T>
        <T x={492} y={110} size={8.5}>Q-learning</T>
      </svg>
    </Figure>
  );
}
