"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface NavLinksProps {
  onClick?: () => void;
  vertical?: boolean;
}

export function NavLinks({ onClick, vertical }: NavLinksProps) {
  const [activeSection, setActiveSection] = useState<string>("");
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isHomePage = pathname === "/";

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Gerencia o destaque do link ativo baseado no scroll (apenas na home)
  useEffect(() => {
    if (!isHomePage) {
      if (pathname.includes('/blog')) setActiveSection('blog');
      return;
    }

    const handleScroll = () => {
      const sections = ["about", "projects", "contact"]; // 'blog' removido do scroll se for página externa
      const scrollPosition = window.scrollY + (isMobile ? 120 : 100);

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetHeight = element.offsetHeight;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile, isHomePage, pathname]);

  const handleNavClick = (section: string, e: React.MouseEvent) => {
    // Se for o link do Blog, deixa o Next.js navegar normalmente para /blog
    if (section === "blog") {
      if (onClick) onClick(); // Fecha menu mobile
      return;
    }

    // Para outros links:
    if (isHomePage) {
      // Se já estiver na Home, faz scroll suave
      e.preventDefault();
      const element = document.getElementById(section);
      if (element) {
        window.scrollTo({
          top: element.offsetTop - (isMobile ? 100 : 80),
          behavior: 'smooth'
        });
      }
    } else {
      // Se não estiver na Home, o comportamento padrão do <Link> vai redirecionar para /#section
      if (onClick) onClick();
    }
    
    if (onClick && isMobile) setTimeout(onClick, 300);
  };

  const navItems = [
    { label: "About me", section: "about", href: "/#about" },
    { label: "Projects", section: "projects", href: "/#projects" },
    { label: "Blog", section: "blog", href: "/blog" },
    { label: "Contact", section: "contact", href: "/#contact" }
  ];

  return (
    <nav className={`${vertical ? "flex flex-col gap-6 text-xl" : "flex items-center gap-10 text-[var(--text-navbar)]"} font-medium`}>
      {navItems.map(({ label, section, href }) => (
        <Link
          key={section}
          href={href}
          onClick={(e) => handleNavClick(section, e)}
          className={`
            relative py-1 transition-all duration-300 group inline-block
            ${vertical ? "text-[var(--text-main)] hover:text-[var(--primary)]" : "text-[var(--text-navbar)] hover:text-[var(--primary)]"}
            ${activeSection === section ? "text-[var(--primary)] !font-bold" : ""}
          `}
        >
          {label}
          
          <span 
            className={`
              absolute left-0 -bottom-1 h-[2px] bg-[var(--primary)]
              transition-all duration-300 ease-in-out
              ${activeSection === section ? "w-full opacity-100" : "w-0 opacity-0 group-hover:w-full group-hover:opacity-50"}
              ${vertical ? "hidden" : "block"} 
            `}
            style={{ boxShadow: activeSection === section ? '0 0 8px var(--primary)' : 'none' }}
          />
        </Link>
      ))}
    </nav>
  );
}