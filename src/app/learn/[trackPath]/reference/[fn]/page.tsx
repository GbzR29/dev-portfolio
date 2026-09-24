// app/learn/[trackPath]/reference/[fn]/page.tsx
"use client";

import { Fragment, useEffect, useMemo, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, AlignLeft, BookOpen, ChevronRight, ExternalLink } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { DocsLayout } from "@/components/lesson/DocsLayout";
import { CodeBlock } from "@/components/lesson/LessonComponents";
import { ReferenceSidebar } from "@/components/reference/ReferenceSidebar";
import { ReferenceProvider, RefToken } from "@/components/reference/RefToken";
import { getTrack } from "@/lib/tracks";
import { chaptersUsing } from "@/lib/reference/usage";
import {
  getReference, loc, referenceHref, referenceIndex,
  type RefEntry, type RefParam, type Reference,
} from "@/lib/reference";

// ─── Pieces ───────────────────────────────────────────────────────────────────

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 mt-14 first:mt-0">
      <h2 className="text-xl font-bold tracking-tight text-[var(--text-main)] pb-2 mb-5 border-b border-[var(--separator)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Links known API names inside a run of plain text. */
function linkify(text: string, reference: Reference, keyPrefix: string): ReactNode[] {
  const index = referenceIndex(reference);
  const parts: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(reference.tokenPattern)) {
    const entry = index.get(m[0]);
    if (!entry || m.index === undefined) continue;
    parts.push(text.slice(last, m.index));
    parts.push(
      <code key={`${keyPrefix}-${m.index}`} className="font-mono text-[0.88em] text-[var(--primary)]">
        <RefToken entry={entry} />
      </code>,
    );
    last = m.index + m[0].length;
  }
  parts.push(text.slice(last));
  return parts;
}

/** Prose with API names linked and `backticks` as inline code; paragraphs split on blank lines. */
function RichText({ text, reference }: { text: string; reference: Reference }) {
  return (
    <>
      {text.split(/\n\s*\n/).map((para, i) => (
        <p key={i} className="mt-5 first:mt-0">
          {para.split(/`([^`]+)`/).map((seg, j) =>
            j % 2 === 1 ? (
              <code
                key={j}
                className="bg-[var(--surface)] border border-[var(--border)] px-1.5 py-0.5 rounded font-mono text-[0.85em] text-[var(--text-main)]"
              >
                {seg}
              </code>
            ) : (
              <Fragment key={j}>{linkify(seg, reference, `${i}-${j}`)}</Fragment>
            ),
          )}
        </p>
      ))}
    </>
  );
}

/** C prototype with parameter names highlighted. */
function Signature({ entry }: { entry: RefEntry }) {
  const open = entry.signature.indexOf("(");
  const head = entry.signature.slice(0, open);
  const args = entry.signature.slice(open);
  const names = entry.params.map((p) => p.name);
  const pattern = names.length ? new RegExp(`\\b(${names.join("|")})\\b(?=\\s*[,)\\[])`, "g") : null;

  const argParts: ReactNode[] = [];
  let last = 0;
  if (pattern) {
    for (const m of args.matchAll(pattern)) {
      if (m.index === undefined) continue;
      argParts.push(args.slice(last, m.index));
      argParts.push(
        <a key={m.index} href={`#param-${m[0]}`} className="text-[var(--primary)] font-semibold hover:underline">
          {m[0]}
        </a>,
      );
      last = m.index + m[0].length;
    }
  }
  argParts.push(args.slice(last));

  const nameAt = head.lastIndexOf(entry.name);
  return (
    <pre className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--code-bg)] px-5 py-4 font-mono text-[13px] leading-relaxed text-[var(--code-text)]">
      <span className="text-[var(--text-muted)]">{head.slice(0, nameAt)}</span>
      <span className="font-semibold text-[var(--text-main)]">{entry.name}</span>
      {argParts}
    </pre>
  );
}

function ParamCard({ param, language, reference }: { param: RefParam; language: "en" | "pt" | "zh" | "es"; reference: Reference }) {
  const { t } = useLanguage();
  const tt = t as Record<string, string | undefined>;
  return (
    <div id={`param-${param.name}`} className="scroll-mt-28 rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
        <span className="font-mono text-[15px] font-semibold text-[var(--primary)]">{param.name}</span>
        <span className="font-mono text-[11px] text-[var(--text-muted)] rounded border border-[var(--border)] px-1.5 py-0.5">
          {param.type}
        </span>
      </div>
      <div className="text-[15px] leading-relaxed text-[var(--text-muted)]">
        <RichText text={loc(param.desc, language)} reference={reference} />
      </div>
      {param.values && param.values.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)] mb-2">
            {tt.refAcceptedValues ?? "Common values"}
          </p>
          <dl className="divide-y divide-[var(--separator)] rounded-lg border border-[var(--separator)] overflow-hidden">
            {param.values.map((v) => (
              <div key={v.name} className="grid sm:grid-cols-[minmax(0,15rem)_1fr] gap-x-4 gap-y-0.5 px-3.5 py-2.5 bg-[var(--bg)]">
                <dt className="font-mono text-[12px] text-[var(--text-main)] break-words">{v.name}</dt>
                <dd className="text-[13px] leading-relaxed text-[var(--text-muted)]">{loc(v.desc, language)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReferenceEntryPage() {
  const params = useParams();
  const router = useRouter();
  const { language, t } = useLanguage();
  const tt = t as Record<string, string | undefined>;

  const trackPath = params?.trackPath ? decodeURIComponent(params.trackPath as string) : "";
  const fn        = params?.fn ? decodeURIComponent(params.fn as string) : "";
  const reference = getReference(trackPath);
  const track     = getTrack(trackPath);
  const entry     = reference ? referenceIndex(reference).get(fn) : undefined;

  useEffect(() => {
    if (reference && !entry) router.replace(referenceHref(reference));
    else if (!reference && trackPath) router.replace(`/learn/${encodeURIComponent(trackPath)}`);
  }, [reference, entry, trackPath, router]);

  const usedIn = useMemo(
    () => (track && reference && entry ? chaptersUsing(track, reference, entry.name) : []),
    [track, reference, entry],
  );

  useEffect(() => { window.scrollTo({ top: 0 }); }, [fn]);

  if (!reference || !entry) return null;

  const index    = referenceIndex(reference);
  const category = reference.categories.find((c) => c.id === entry.category);
  const related  = (entry.related ?? []).map((n) => index.get(n)).filter((e) => e !== undefined);

  const sections = [
    { id: "signature",   title: tt.refSignature ?? "Signature",       show: true },
    { id: "description", title: tt.refDescription ?? "How it works",  show: !!entry.description },
    { id: "parameters",  title: tt.refParameters ?? "Parameters",     show: entry.params.length > 0 },
    { id: "returns",     title: tt.refReturns ?? "Return value",      show: !!entry.returns },
    { id: "notes",       title: tt.refNotes ?? "Tips & pitfalls",     show: !!entry.notes?.length },
    { id: "errors",      title: tt.refErrors ?? "Errors",             show: !!entry.errors?.length },
    { id: "example",     title: tt.refExample ?? "Example",           show: !!entry.example },
    { id: "used-in",     title: tt.refUsedIn ?? "Used in lessons",    show: usedIn.length > 0 },
    { id: "related",     title: tt.refRelated ?? "Related",           show: related.length > 0 },
  ].filter((s) => s.show);
  const title = (id: string) => sections.find((s) => s.id === id)!.title;

  return (
    <ReferenceProvider reference={reference}>
      <DocsLayout
        drawerTitle={tt.refTitle ?? "Function reference"}
        drawerKey={fn}
        left={<ReferenceSidebar reference={reference} activeName={entry.name} />}
        right={
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--text-muted)] mb-4 flex items-center gap-1.5">
              <AlignLeft size={11} />
              {tt.refOnThisPage ?? "On this page"}
            </p>
            <nav className="space-y-0.5 border-l border-[var(--separator)]">
              {sections.map((s) => (
                <Fragment key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="block -ml-px border-l border-transparent pl-4 py-1.5 text-[12.5px] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-strong)] transition-colors"
                  >
                    {s.title}
                  </a>
                  {s.id === "parameters" && entry.params.map((p) => (
                    <a
                      key={p.name}
                      href={`#param-${p.name}`}
                      className="block -ml-px border-l border-transparent pl-7 py-1 font-mono text-[11.5px] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                    >
                      {p.name}
                    </a>
                  ))}
                </Fragment>
              ))}
            </nav>
          </div>
        }
      >
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)] font-mono mb-8">
          <Link href={`/learn/${encodeURIComponent(trackPath)}`} className="hover:text-[var(--text-main)] transition-colors">
            {reference.title}
          </Link>
          <ChevronRight size={12} className="opacity-40" />
          <Link href={referenceHref(reference)} className="hover:text-[var(--text-main)] transition-colors">
            {tt.refTitle ?? "Function reference"}
          </Link>
          {category && (
            <>
              <ChevronRight size={12} className="opacity-40" />
              <Link href={`${referenceHref(reference)}#${category.id}`} className="hover:text-[var(--text-main)] transition-colors">
                {loc(category.title, language)}
              </Link>
            </>
          )}
        </div>

        {/* Header */}
        <header className="mb-12 pb-10 border-b border-[var(--separator)]">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {category && (
              <span className="font-mono text-[11px] text-[var(--primary)] uppercase tracking-[0.25em]">
                {loc(category.title, language)}
              </span>
            )}
            {entry.since && (
              <span className="font-mono text-[10px] text-[var(--text-muted)] rounded border border-[var(--border)] px-1.5 py-0.5">
                {entry.since}
              </span>
            )}
          </div>
          <h1 className="font-mono text-3xl md:text-[2.4rem] font-bold tracking-tight mb-5 break-words">
            {entry.name}
          </h1>
          <p className="text-lg leading-relaxed text-[var(--text-main)]">
            {loc(entry.summary, language)}
          </p>

          {entry.deprecated && (
            <div className="mt-6 flex gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm leading-relaxed text-[var(--text-muted)]">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5 text-yellow-500" />
              <div>
                <span className="font-semibold text-yellow-500">{tt.refDeprecated ?? "Removed from the core profile."} </span>
                {loc(entry.deprecated, language)}
              </div>
            </div>
          )}
        </header>

        <div className="text-[1.0625rem] leading-[1.85] text-[var(--text-muted)]">
          <Section id="signature" title={title("signature")}>
            <Signature entry={entry} />
          </Section>

          {entry.description && (
            <Section id="description" title={title("description")}>
              <RichText text={loc(entry.description, language)} reference={reference} />
            </Section>
          )}

          {entry.params.length > 0 && (
            <Section id="parameters" title={title("parameters")}>
              <div className="space-y-4">
                {entry.params.map((p) => (
                  <ParamCard key={p.name} param={p} language={language} reference={reference} />
                ))}
              </div>
            </Section>
          )}

          {entry.returns && (
            <Section id="returns" title={title("returns")}>
              <RichText text={loc(entry.returns, language)} reference={reference} />
            </Section>
          )}

          {entry.notes && entry.notes.length > 0 && (
            <Section id="notes" title={title("notes")}>
              <ul className="space-y-3">
                {entry.notes.map((n, i) => (
                  <li key={i} className="flex gap-3 rounded-xl border border-green-500/25 bg-green-500/5 px-4 py-3 text-[15px]">
                    <span className="mt-[0.7em] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
                    <span><RichText text={loc(n, language)} reference={reference} /></span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {entry.errors && entry.errors.length > 0 && (
            <Section id="errors" title={title("errors")}>
              <p className="text-[15px] mb-4">
                {tt.refErrorsHint ?? "When the call is invalid it does nothing and sets an error, which glGetError returns:"}
              </p>
              <dl className="divide-y divide-[var(--separator)] rounded-xl border border-[var(--border)] overflow-hidden">
                {entry.errors.map((e) => (
                  <div key={e.code} className="grid sm:grid-cols-[minmax(0,14rem)_1fr] gap-x-4 gap-y-1 px-4 py-3 bg-[var(--card)]">
                    <dt className="font-mono text-[12.5px] text-red-400 break-words">{e.code}</dt>
                    <dd className="text-[14px] leading-relaxed">{loc(e.when, language)}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          )}

          {entry.example && (
            <Section id="example" title={title("example")}>
              <CodeBlock lang="cpp" filename="example.cpp" t={t}>{entry.example}</CodeBlock>
            </Section>
          )}

          {usedIn.length > 0 && (
            <Section id="used-in" title={title("used-in")}>
              <div className="grid gap-2 sm:grid-cols-2">
                {usedIn.map((c) => (
                  <Link
                    key={c.id}
                    href={`/learn/${encodeURIComponent(trackPath)}?chapter=${c.id}`}
                    className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm hover:border-[var(--primary)]/50 hover:bg-[var(--primary-low)] transition-colors"
                  >
                    <BookOpen size={15} className="flex-shrink-0 text-[var(--primary)]" />
                    <span className="flex flex-col min-w-0">
                      <span className="font-medium text-[var(--text-main)] truncate">{c.title}</span>
                      {c.section && <span className="text-[11px] text-[var(--text-muted)] truncate">{c.section}</span>}
                    </span>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {related.length > 0 && (
            <Section id="related" title={title("related")}>
              <div className="grid gap-2 sm:grid-cols-2">
                {related.map((r) => (
                  <Link
                    key={r.name}
                    href={referenceHref(reference, r.name)}
                    className="group flex flex-col gap-1 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 hover:border-[var(--primary)]/50 hover:bg-[var(--primary-low)] transition-colors"
                  >
                    <span className="font-mono text-[13px] font-semibold text-[var(--text-main)] group-hover:text-[var(--primary)]">{r.name}</span>
                    <span className="text-xs leading-relaxed text-[var(--text-muted)] line-clamp-2">{loc(r.summary, language)}</span>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {entry.khronos && (
            <a
              href={entry.khronos}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-14 inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
            >
              <ExternalLink size={14} />
              {tt.refKhronos ?? "Official Khronos documentation"}
            </a>
          )}
        </div>
      </DocsLayout>
    </ReferenceProvider>
  );
}
