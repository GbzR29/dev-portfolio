"use client";

// ── Blog ────────────────────────────────────────────────────────────────────
// /blog on the Home look (home.css): hero, category filter, the newest post as
// a wide card, the rest in a grid, the newsletter box and the Home footer.
// Posts come from MongoDB via app/blog/page.tsx.

import "@/styles/home.css";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import HomeNav from "@/components/home/HomeNav";
import Stars from "@/components/home/Stars";
import Particles from "@/components/home/Particles";
import HomeFooter from "@/components/home/HomeFooter";
import Reveal from "@/components/home/Reveal";
import type { Post } from "@/types/post";

const ALL = "All";

// ── Post card ───────────────────────────────────────────────────────────────

function PostCard({ post, lead = false }: { post: Post; lead?: boolean }) {
  const { t } = useLanguage();

  return (
    <Link href={`/blog/${post.id}`} className={`hm-card hm-post${lead ? " hm-post-lead" : ""}`}>
      <div className="hm-post-img">
        <Image
          src={post.image}
          alt=""
          fill
          className="object-cover"
          sizes={lead ? "(max-width: 760px) 100vw, 480px" : "(max-width: 760px) 100vw, 300px"}
        />
      </div>
      <div className="hm-post-body">
        <div className="hm-kind">
          {lead && <>{t.featuredLabel} · </>}
          {post.category}
        </div>
        <h3>{post.title}</h3>
        <p>{post.excerpt}</p>
        <div className="hm-meta">
          <span>{post.date}</span>
          <span>5 {t.readTime}</span>
        </div>
        <span className="hm-more">{t.readMore}</span>
      </div>
    </Link>
  );
}

// ── Newsletter ──────────────────────────────────────────────────────────────

function Newsletter() {
  const { t } = useLanguage();

  return (
    <section className="hm-sec">
      <h2>Newsletter</h2>
      <div className="hm-news">
        <div>
          <h3>{t.newsletterTitle}</h3>
          <p>{t.newsletterDesc}</p>
        </div>
        <form className="hm-news-form" onSubmit={(e) => e.preventDefault()}>
          <input type="email" required placeholder={t.emailPlaceholder} aria-label={t.emailPlaceholder} />
          <button type="submit" className="hm-copy">{t.subscribe}</button>
        </form>
      </div>
    </section>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function BlogClientContent({ initialPosts }: { initialPosts: Post[] }) {
  const { t } = useLanguage();
  const [active, setActive] = useState<string>(ALL);
  if (!t) return null;

  const categories = [ALL, ...Array.from(new Set(initialPosts.map((p) => p.category)))];
  const filtered = active === ALL ? initialPosts : initialPosts.filter((p) => p.category === active);
  const [lead, ...rest] = filtered;
  const eyebrow = (t.blogEyebrow ?? "blog · {n} posts").replace("{n}", String(initialPosts.length));

  return (
    <div className="home">
      <Particles />
      <header className="hm-hero-wrap">
        <Stars />
        <div className="hm-in">
          <HomeNav />
          <div className="hm-hero">
            <div className="hm-eyebrow">{eyebrow}</div>
            <h1>{t.blogTitle}</h1>
            <p className="hm-lead">{t.blogSubtitle}</p>
          </div>
        </div>
        <div className="hm-horizon" aria-hidden="true" />
      </header>

      <main className="hm-in">
        <section className="hm-sec">
          <div className="hm-blog-head">
            <h2>{t.allPosts}</h2>
            {categories.length > 2 && (
              <div className="hm-filter" role="group" aria-label="Categories">
                {categories.map((cat) => (
                  <button key={cat} type="button" className="hm-pill" aria-pressed={active === cat} onClick={() => setActive(cat)}>
                    {cat === ALL ? (t.blogAll ?? "all") : cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {lead ? (
            <>
              <PostCard post={lead} lead />
              {rest.length > 0 && (
                <div className="hm-post-grid">
                  {rest.map((post) => <PostCard key={post.id} post={post} />)}
                </div>
              )}
            </>
          ) : (
            <p className="hm-ph" style={{ margin: 0 }}>{t.writingEmpty}</p>
          )}
        </section>

        <Newsletter />
        <HomeFooter />
      </main>
      <Reveal />
    </div>
  );
}
