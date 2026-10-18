# dev-portfolio

Next.js 16 (App Router) + React 19 + Tailwind. Personal portfolio (gabrielfrc.dev) with a blog (MongoDB)
and the page of the novel. The interactive courses that used to live here under `/learn` moved on
2026-10-18 to their own site and repo, **From Scratch Lab** (https://www.fromscratchlab.com,
C:\Users\gabri\Desktop\from-scratch-lab): lesson work happens there, not here. `next.config.ts`
redirects the old `/learn/*` and `/pt/learn/*` URLs to it (308).

Commands: `npm run dev`, `npm run build`, `npx tsc --noEmit -p .`, `npx eslint <path>`.
Record every change with its date at the top of `CHANGELOG.md` (Portuguese, newest first).
The build logs a MongoDB `ENOTFOUND` when offline — expected, the blog handles it.

## Where things live

```
src/app/page.tsx, src/components/home/ Home (and the book page /the-weight-of-being); styles in src/styles/home.css (--hm-* tokens, .home scope)
src/components/home/Now.tsx            "What I'm working on": the book + a card linking to From Scratch Lab (track list written by hand)
src/components/nav/                    SiteMenu (phone ☰ sheet, styles in src/styles/sitemenu.css) + siteLinks (links, languages);
                                       HomeNav is the nav of every page (blog/status borrow it via .hm-scope)
src/app/pt/                            Portuguese Home (/pt), a thin file reusing the English page; LanguageProvider reads the /pt prefix
src/lib/site.ts                        SITE_URL, LEARN_URL + learnUrl(lang, track), langOfPath/pathInLang/languageAlternates;
                                       in client components get the page's language with useUrlLang() (src/lib/i18n/useUrlLang.ts)
src/lib/i18n/                          UI strings (en/pt/zh/es): home + blog translations
src/app/blog/, src/components/blog/, src/services/postService   blog, posts from MongoDB (src/lib/db/mongo.ts)
src/app/sitemap.ts, src/app/robots.ts  Home (EN + PT, hreflang), the book and the blog
src/lib/og/                            link-preview images: card.tsx draws (fonts in src/assets/fonts), cards.tsx = the Home's text;
                                       each route's opengraph-image.tsx only picks a card
next.config.ts                         security headers + the /learn → fromscratchlab.com redirects
```

## Conventions

- Preserve the existing visual design; no cosmetic changes unless asked.
- Match the surrounding code style: section comments `// ── Title ───`, English
  code comments, CSS variables such as `var(--text-muted)` for colors.
- Keep files small with a single responsibility; split instead of growing past ~600 lines.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
