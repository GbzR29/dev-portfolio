# dev-portfolio

Next.js 16 (App Router) + React 19 + Tailwind. Personal portfolio with a blog
(MongoDB) and a set of interactive graphics-programming courses under `/learn`.

Commands: `npm run dev`, `npm run build`, `npx tsc --noEmit -p .`, `npx eslint <path>`.
`predev`/`prebuild` regenerate `src/lib/generated/assets.json` from `public/textures`.
The build logs a MongoDB `ENOTFOUND` when offline — expected, the blog handles it.

## Where things live

```
src/app/learn/page.tsx                 /learn landing — track cards (icons live here, data comes from the catalog)
src/app/learn/[trackPath]/page.tsx     the ONE page that renders every lesson of every track
src/app/learn/[trackPath]/reference/   function reference pages (src/lib/reference)
src/lib/tracks/catalog.ts              THE list of tracks: id, route path, title, color, status, level/description keys
src/lib/tracks/index.ts                registry: joins catalog entries with each track's chapter list (getTrack)
src/lib/tracks/types.ts                Track / Chapter types
src/lib/tracks/tx.ts                   tx(t, key, englishFallback) — the only translation helper to use
src/lib/tracks/<track>/index.tsx       exports `<track>Chapters: Chapter[]` (id, section, title, minRead, load) — metadata + lazy loaders
src/lib/tracks/<track>/chapters/*.tsx  lesson content, one module per chapter (or small group)
src/lib/tracks/<track>/presets/        shader sources used by the lessons (opengl, glsl)
src/lib/i18n/                          UI strings (en/pt/zh/es) + lessons.ts (loads lesson/widget text on demand)
src/lib/tracks/<track>/i18n/<lang>/    lesson translations, one file per chapter module + _track.ts (titles, sections)
src/components/lesson/i18n/<lang>/     widget translations, one file per figures/ topic folder
src/components/lesson/LessonComponents.tsx   CodeBlock, Callout, H2, H3, IC, LessonTable, MathBlock, diagrams
src/components/lesson/ChapterContent.tsx   renders the open chapter (React.lazy + Suspense), preloads the next one
src/components/lesson/Prose.tsx        Article, Lead, KeyIdeas — chapter page wrappers
src/components/lesson/Tex.tsx          Equation (KaTeX)
src/components/lesson/kit/             widget INFRASTRUCTURE (no lesson content):
  figure.tsx      SVG figure blocks (Figure, Slider, plot, useDrag, useRaf, useVisible…)
  vec3.ts         the only 3D vector math (Vec3, add, cross, norm, rotY…)
  scene3d.tsx     SVG 3D: projector, orbit controls, boxFaces/frontFacing, lookAt
  svg.tsx, Stepper.tsx, protoTexture.tsx (Arrow/Label, step animations, textured quads)
  gl/GLView.tsx   WebGL2 host: context, resize, look/orbit, context loss; useAnimationTime
  gl/gl.ts, gl/glx.ts, gl/context.ts   mat4, shaders, meshes, render targets, context release
src/components/lesson/figures/         the widgets themselves, grouped by topic folder
src/components/lesson/glsl/            ShaderPlayground + GLSL figures
src/components/lesson/DocsLayout.tsx, src/components/sidebar/LessonSidebar.tsx   shared lesson layout
```

Sidebar, prev/next, numbering, progress and section headers are all generated
from the `chapters` array — never hand-write them.

## Adding or editing a lesson

- Edit only the chapter module you need; don't load a whole track.
- New chapter: create `src/lib/tracks/<track>/chapters/<id>.tsx` exporting
  `XxxContent({ t }: { t: TrackTranslations })`, then add one line to the
  track's `index.tsx` with `load: () => import("./chapters/<id>").then((m) => m.XxxContent)`.
  Never import chapter modules statically — that pulls every lesson into every page.
  Model to copy: `src/lib/tracks/gamedev/`.
- New track: add it to `catalog.ts`, create `<track>/index.tsx`, register it in `tracks/index.ts`.
- All prose goes through `tx(t, "<prefix>_<key>", "English text")` from
  `@/lib/tracks/tx` — don't redefine `tx` locally.
- Keep URLs stable: chapter `id` and the registry key form the route.
- Chapter modules are `"use client"` (they use interactive components).
- English lives only in the `tx` fallbacks. Translations: add the key to the
  matching `i18n/<lang>/<chapter-module>.ts` (widgets: `components/lesson/i18n/<lang>/<topic>.ts`).
  A missing key simply shows English. `useLessonText` loads only the open track's file set.

## Widget rules

- Animated widgets pause off screen: `const vis = useVisible<HTMLElement>()`, `useAnimationTime(playing && vis.on)`, `<figure ref={vis.ref}>`.
- WebGL widgets render through `GLView`; a widget that creates its own context must call `claimContext`/`releaseContext` (kit/gl/context.ts).
- `boxFaces` faces wind CCW from outside (it fixes left-handed axes itself); `frontFacing` relies on that.

## Conventions

- Lessons must explain every formula term, step and constant (user preference).
- Preserve the existing visual design; no cosmetic changes unless asked.
- Match the surrounding code style: section comments `// ── Title ───`, English
  code comments, CSS variables such as `var(--text-muted)` for colors.
- Keep files small with a single responsibility; split instead of growing past ~600 lines.

## Still to do (agreed, one small step at a time)

- Translations: PT is complete (all tracks + widgets). ES/ZH exist only for OpenGL and GLSL lessons; no ES/ZH widget text yet.
- Widgets need a better mobile layout (design first).
- Pre-existing lint errors: `any` in LessonComponents.tsx, `t: any` + JSX comments in app/learn/page.tsx.
