"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, Slider, Btn, C } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Choosing k items from n letters, with the two questions that decide every
// count: does the order of the picks matter, and may an item be picked again?
// Every possible selection is listed as a chip, so the formula in the readout
// can be checked by counting the chips. With order and repetition both off,
// each chip stands for k! chips of the ordered list: that factor is exactly
// what the combination formula divides out.

const LETTERS = "ABCDEFG";
const COLORS = [C.red, C.blue, C.green, C.amber, C.purple, C.teal, C.pink];
const MAX_SHOWN = 240;

const fact = (n: number) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
const choose = (n: number, k: number) => (k < 0 || k > n ? 0 : Math.round(fact(n) / (fact(k) * fact(n - k))));

/** Every selection in dictionary order, stopping after `cap` of them. */
function list(n: number, k: number, order: boolean, rep: boolean, cap: number) {
  const out: number[][] = [], cur: number[] = [];
  const go = (start: number) => {
    if (out.length >= cap) return;
    if (cur.length === k) { out.push([...cur]); return; }
    for (let i = order ? 0 : start; i < n; i++) {
      if (!rep && cur.includes(i)) continue;
      cur.push(i); go(rep ? i : i + 1); cur.pop();
    }
  };
  go(0);
  return out;
}

/** The formula that fits the two answers, written out, and its value. */
function count(n: number, k: number, order: boolean, rep: boolean): [string, number] {
  if (order && rep) return [`nᵏ = ${n}^${k}`, n ** k];
  if (order) return [`n!/(n−k)! = ${n}!/${n - k}!`, fact(n) / fact(n - k)];
  if (rep) return [`C(n+k−1, k) = C(${n + k - 1}, ${k})`, choose(n + k - 1, k)];
  return [`n!/(k!(n−k)!) = ${n}!/(${k}!·${n - k}!)`, choose(n, k)];
}

export function CountingFigure({ t }: { t?: TrackTranslations }) {
  const [n, setN] = useState(4);
  const [kRaw, setK] = useState(2);
  const [order, setOrder] = useState(true);
  const [rep, setRep] = useState(false);

  const k = rep ? kRaw : Math.min(kRaw, n);
  const [formula, total] = count(n, k, order, rep);
  const items = list(n, k, order, rep, MAX_SHOWN);
  const more = total - items.length;

  return (
    <Figure
      title={tx(t, "figCnt_title", "Counting selections")}
      head={<>
        <Btn active={order} onClick={() => setOrder(v => !v)}>{tx(t, "figCnt_order", "order matters")}</Btn>
        <Btn active={rep} onClick={() => setRep(v => !v)}>{tx(t, "figCnt_rep", "repetition allowed")}</Btn>
      </>}
      controls={<>
        <Slider label={tx(t, "figCnt_n", "items n")} value={n} min={2} max={7} step={1} onChange={setN} fmt={v => String(v)} />
        <Slider label={tx(t, "figCnt_k", "picks k")} value={k} min={1} max={rep ? 5 : n} step={1} onChange={setK} fmt={v => String(v)} />
        <Row>
          <Readout color={C.blue}>{`${formula} = ${total}`}</Readout>
          {!order && !rep && <Readout color={C.amber}>{`${tx(t, "figCnt_ordered", "ordered")}: ${fact(n) / fact(n - k)} = ${total} × ${k}!`}</Readout>}
        </Row>
      </>}
      note={tx(t, "figCnt_note", "Each chip is one possible selection of k letters out of the first n. Switch \"order matters\" off and AB and BA become the same chip: the list shrinks by a factor of k!, because every set of k different letters can be put in order in k! ways. Switch repetition on and letters may repeat (AA, BB): with order it gives nᵏ sequences, without order it gives the multisets counted by stars and bars.")}
    >
      <div className="p-4 flex flex-wrap gap-1.5 max-h-[300px] overflow-y-auto">
        {items.map((s, i) => (
          <span key={i} className="font-mono text-[12px] font-semibold px-1.5 py-0.5 rounded-md border border-[var(--border)] bg-[var(--surface)]">
            {s.map((j, q) => <span key={q} style={{ color: COLORS[j] }}>{LETTERS[j]}</span>)}
          </span>
        ))}
        {more > 0 && <span className="font-mono text-[12px] px-1.5 py-0.5 text-[var(--text-muted)]">{`+ ${more} …`}</span>}
      </div>
    </Figure>
  );
}
