"use client";

// ── Recent writing ──────────────────────────────────────────────────────────
// The latest blog posts, fetched on the server by app/page.tsx.

import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { Post } from "@/types/post";

export default function RecentWriting({ posts }: { posts: Post[] }) {
  const { t } = useLanguage();

  return (
    <section className="hm-sec">
      <h2>
        {t.writingTitle} <small>{t.writingFromBlog}</small>
      </h2>
      {posts.length > 0 ? (
        <ul className="hm-posts">
          {posts.map((p) => (
            <li key={p.id}>
              <Link href={`/blog/${p.id}`}>
                <time>{p.date}</time>
                <span>{p.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="hm-ph" style={{ margin: 0 }}>{t.writingEmpty}</p>
      )}
      <Link className="hm-more" href="/blog">{t.writingAll}</Link>
    </section>
  );
}
