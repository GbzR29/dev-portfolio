"use client"; // Corrigindo o erro de Build

import { useState, useEffect } from "react";
import Image from "next/image";
// Importamos os componentes reais que você já tem no projeto
import Navbar from "@/components/navbar/Navbar"; 
import Footer from "@/components/footer/Footer";

import TriangleParticles from "@/components/particles/TriangleParticles";

import StatusPage from "../status/page";

// Mock data atualizado com temas mais voltados ao seu perfil
const POSTS = [
  {
    id: 1,
    title: "Fractal Engine: Deep Dive",
    excerpt: "How to render complex fractals in real time by optimizing GPU usage with advanced shader programming techniques...",
    category: "Insights",
    date: "05 Fev, 2026",
    image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800"
  },
  {
    id: 2,
    title: "C++ Memory Management",
    excerpt: "Tips on how to manage memory efficiently in game engines, avoiding leaks and optimizing allocations...",
    category: "Tutorial",
    date: "01 Fev, 2026",
    image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=800"
  },
  {
    id: 3,
    title: "OpenGL Performance Optimization",
    excerpt: "Advanced techniques for improving the performance of 3D applications, including instancing and level of detail...",
    category: "Technical",
    date: "28 Jan, 2026",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800"
  }
];

export default function BlogPage() {

  //return <StatusPage type="development" />;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text-main)] transition-colors duration-300">

      <TriangleParticles />
      <Navbar />
      
      <main className="flex-grow pt-32 pb-20">
        <section className="container mx-auto px-6 lg:px-20">
          {/* Header da Página */}
          <div className="mb-16 text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6">
              My blog<span className="text-[var(--primary)]"></span>
            </h1>
            <p className="text-xl text-[var(--text-muted)] leading-relaxed">
              Tutorials, technical insights, and experiments in the world of software development and game engines.
            </p>
          </div>

          {/* Grid de Posts */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {POSTS.map((post) => (
              <article 
                key={post.id} 
                className="group flex flex-col bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden hover:border-[var(--primary)]/50 transition-all duration-300 shadow-xl shadow-black/5"
              >
                {/* Imagem do Post */}
                <div className="relative aspect-video overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--card)] to-transparent opacity-60" />
                  <span className="absolute top-4 left-4 px-3 py-1 bg-[var(--primary)] text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg">
                    {post.category}
                  </span>
                </div>
                
                {/* Conteúdo */}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-2 mb-4 text-xs text-[var(--text-muted)] font-medium">
                    <span>{post.date}</span>
                    <span className="w-1 h-1 rounded-full bg-[var(--border)]" />
                    <span>5 min read</span>
                  </div>
                  
                  <h2 className="text-xl font-bold mb-3 text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                  
                  <p className="text-[var(--text-muted)] text-sm mb-6 flex-grow leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>

                  <button className="flex items-center gap-2 text-sm font-bold text-[var(--primary)] group-hover:gap-4 transition-all">
                    READ MORE 
                    <span className="text-lg">→</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
          
          {/* Newsletter / CTA */}
          <div className="mt-20 p-8 md:p-12 rounded-3xl bg-gradient-to-br from-[var(--card)] to-[var(--bg)] border border-[var(--border)] relative overflow-hidden text-center">
            <div className="relative z-10">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Stay up to date with the latest news.</h3>
              <p className="text-[var(--text-muted)] mb-8 max-w-md mx-auto">
                Receive notifications of new technical articles and project updates directly to your email.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Your best email"
                  className="flex-grow px-6 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                />
                <button className="bg-[var(--primary)] text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-[var(--primary)]/20">
                  Subscribe
                </button>
              </div>
            </div>
            {/* Elemento decorativo de fundo */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)] opacity-[0.03] blur-[100px] -mr-32 -mt-32" />
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}