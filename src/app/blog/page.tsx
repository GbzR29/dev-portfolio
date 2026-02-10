"use client";

import Navbar from "@/components/navbar/Navbar"; 
import Footer from "@/components/footer/Footer";
import TriangleParticles from "@/components/particles/TriangleParticles";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Card } from "@/components/ui/Card"; // Importando seu Card
import { MyButton } from "@/components/ui/Button"; // Importando seu MyButton
import { InputBox } from "@/components/ui/InputBox";

import { Mail } from "lucide-react";

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
  const { t } = useLanguage();

  if (!t) return null;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text-main)] transition-colors duration-300">
      <TriangleParticles />
      <Navbar />
      
      <main className="flex-grow pt-32 pb-20">
        <section className="container mx-auto px-6 lg:px-20">
          
          <div className="mb-16 text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6">
              {t.blogTitle}<span className="text-[var(--primary)]">.</span>
            </h1>
            <p className="text-xl text-[var(--text-muted)] leading-relaxed">
              {t.blogSubtitle}
            </p>
          </div>

         
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {POSTS.map((post) => (
              <Card 
                key={post.id} 
                padding="sm" 
                className="flex flex-col h-full overflow-hidden border border-[var(--border)]"
                hoverable={true}
              >
               
                <div className="relative aspect-video overflow-hidden -mx-4 -mt-4 mb-6 rounded-t-xl">
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--card)] to-transparent opacity-60" />
                  <span className="absolute top-4 left-4 px-3 py-1 bg-[var(--primary)] text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                    {post.category}
                  </span>
                </div>
                
               
                <div className="flex flex-col flex-grow px-2 pb-2">
                  <div className="flex items-center gap-2 mb-4 text-xs text-[var(--text-muted)] font-medium">
                    <span>{post.date}</span>
                    <span className="w-1 h-1 rounded-full bg-[var(--border)]" />
                    <span>5 {t.readTime}</span>
                  </div>
                  
                  <h2 className="text-xl font-bold mb-3 text-[var(--text-main)] group-hover:text-[var(--primary)]">
                    {post.title}
                  </h2>
                  
                  <p className="text-[var(--text-muted)] text-sm mb-6 flex-grow leading-relaxed">
                    {post.excerpt}
                  </p>

                  
                  <MyButton 
                    text={t.readMore} 
                    variant="outline" 
                    className="w-full sm:w-auto self-start"
                    onClick={() => console.log(`Navigating to post ${post.id}`)}
                  />
                </div>
              </Card>
            ))}
          </div>
          
          
          <Card 
            padding="2xl" 
            className="mt-20 border border-[var(--border)] relative overflow-hidden text-center"
            hoverable={false}
          >
            <div className="relative z-10">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                {t.newsletterTitle}
              </h3>
              <p className="text-[var(--text-muted)] mb-8 max-w-md mx-auto">
                {t.newsletterDesc}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">

                <InputBox
                  type="email"
                  placeholder={t.emailPlaceholder}
                  icon={<Mail size={18} />}
                />
                <MyButton 
                  text={t.subscribe} 
                  className="h-[50px] whitespace-nowrap" // h-[50px] para alinhar com o input py-3
                />
              </div>
            </div>
           
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)] opacity-[0.05] blur-[100px] -mr-32 -mt-32" />
          </Card>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}