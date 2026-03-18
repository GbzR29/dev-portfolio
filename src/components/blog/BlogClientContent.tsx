// components/blog/BlogClientContent.tsx
"use client";

import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
import TriangleParticles from "@/components/particles/TriangleParticles";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { MyButton } from "@/components/ui/Button";
import { InputBox } from "@/components/ui/InputBox";
import { Mail, Clock, ArrowUpRight, Rss } from "lucide-react";
import { Post } from "@/types/post";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface BlogClientProps {
  initialPosts: Post[];
}

// ─── Post card ────────────────────────────────────────────────────────────────

function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  const { t } = useLanguage();

  if (featured) {
    return (
      <Link href={`/blog/${post.id}`} className="group block">
        <article className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] hover:border-[var(--primary)]/40 transition-all duration-300">
          {/* Image */}
          <div className="relative h-64 sm:h-80 overflow-hidden">
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a] via-[#0a0e1a]/40 to-transparent" />
            {/* Featured badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-[var(--primary)] text-white text-[10px] font-bold uppercase tracking-widest">
                {t.featuredLabel}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest">
                {post.category}
              </span>
            </div>
          </div>

          {/* Content — overlaps image via negative margin */}
          <div className="p-6 sm:p-8 -mt-12 relative z-10">
            <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] font-mono mb-3">
              <Clock size={12} />
              <span>{post.date}</span>
              <span className="opacity-40">·</span>
              <span>5 {t.readTime}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 group-hover:text-[var(--primary)] transition-colors leading-tight">
              {post.title}
            </h2>
            <p className="text-[var(--text-muted)] leading-relaxed mb-5 max-w-2xl">{post.excerpt}</p>
            <span className="inline-flex items-center gap-2 text-[var(--primary)] text-sm font-semibold group-hover:gap-3 transition-all">
              {t.readMore} <ArrowUpRight size={16} />
            </span>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/blog/${post.id}`} className="group block h-full">
      <article className="h-full flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] hover:border-[var(--primary)]/40 hover:bg-white/[0.04] transition-all duration-300">
        {/* Image */}
        <div className="relative h-44 overflow-hidden flex-shrink-0">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a]/80 to-transparent" />
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white">
            {post.category}
          </span>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-grow p-5">
          <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-mono mb-3">
            <Clock size={10} />
            <span>{post.date}</span>
            <span className="opacity-40">·</span>
            <span>5 {t.readTime}</span>
          </div>
          <h2 className="text-lg font-bold text-white mb-2 group-hover:text-[var(--primary)] transition-colors leading-snug flex-grow">
            {post.title}
          </h2>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4 line-clamp-2">
            {post.excerpt}
          </p>
          <span className="inline-flex items-center gap-1.5 text-[var(--primary)] text-xs font-semibold mt-auto">
            {t.readMore} <ArrowUpRight size={13} />
          </span>
        </div>
      </article>
    </Link>
  );
}

// ─── Newsletter banner ────────────────────────────────────────────────────────

function NewsletterBanner() {
  const { t } = useLanguage();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--primary)]/20 bg-white/[0.02]">
      {/* Background glow */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-[var(--primary)] opacity-5 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-blue-400 opacity-4 blur-3xl rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 p-8 md:p-10">
        {/* Icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center">
          <Rss size={22} className="text-[var(--primary)]" />
        </div>

        {/* Text */}
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-xl font-bold text-white mb-1">{t.newsletterTitle}</h3>
          <p className="text-[var(--text-muted)] text-sm max-w-md">{t.newsletterDesc}</p>
        </div>

        {/* Input + button */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-shrink-0">
          <InputBox
            type="email"
            placeholder={t.emailPlaceholder}
            icon={<Mail size={16} />}
            className="sm:w-64"
          />
          <MyButton text={t.subscribe} className="whitespace-nowrap h-[46px]" />
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BlogClientContent({ initialPosts }: BlogClientProps) {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string>("All");

  if (!t) return null;

  // Derive unique categories from posts
  const categories = ["All", ...Array.from(new Set(initialPosts.map((p) => p.category)))];

  const filtered =
    activeCategory === "All"
      ? initialPosts
      : initialPosts.filter((p) => p.category === activeCategory);

  const [featured, ...rest] = filtered;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text-main)] transition-colors duration-300">
      <TriangleParticles />
      <Navbar />

      <main className="flex-grow pt-28 pb-24">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 space-y-16">

          {/* ── Page header ────────────────────────────────────────────────── */}
          <header className="space-y-5 max-w-2xl">
            {/* Tagline */}
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-[var(--primary)]" />
              <span className="font-mono text-[10px] text-[var(--primary)] uppercase tracking-[0.3em]">
                // gabrielfc.dev
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
              {t.blogTitle}<span className="text-[var(--primary)]">.</span>
            </h1>
            <p className="text-xl text-[var(--text-muted)] leading-relaxed">
              {t.blogSubtitle}
            </p>
          </header>

          {/* ── Category filter ────────────────────────────────────────────── */}
          <div className="flex items-center gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`
                  px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                  ${activeCategory === cat
                    ? "bg-[var(--primary)] text-white"
                    : "bg-white/[0.04] border border-white/10 text-[var(--text-muted)] hover:border-[var(--primary)]/40 hover:text-white"
                  }
                `}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* ── Featured post (first result) ───────────────────────────────── */}
          {featured && <PostCard post={featured} featured />}

          {/* ── Post grid ──────────────────────────────────────────────────── */}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="text-center py-20 text-[var(--text-muted)]">
              <p className="font-mono text-sm">// no posts in this category yet</p>
            </div>
          )}

          {/* ── Newsletter ─────────────────────────────────────────────────── */}
          <NewsletterBanner />
        </div>
      </main>

      <Footer />
    </div>
  );
}