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

  // Gerencia o destaque do link ativo
  useEffect(() => {
    // 1. Se estiver em subpáginas, destaca o link correspondente
    if (pathname.includes('/blog')) {
      setActiveSection('blog');
      return;
    }
    if (pathname.includes('/learn')) {
      setActiveSection('learn');
      return;
    }

    // 2. Lógica de Scroll (apenas na home)
    if (!isHomePage) return;

    const handleScroll = () => {
      const sections = ["about", "projects", "contact"]; 
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
    // Se for link para páginas internas (Blog ou Learn)
    if (section === "blog" || section === "learn") {
      if (onClick) onClick(); // Fecha menu mobile
      return; // Deixa o Next.js navegar
    }

    // Para links de âncora (About, Projects, Contact)
    if (isHomePage) {
      e.preventDefault();
      const element = document.getElementById(section);
      if (element) {
        window.scrollTo({
          top: element.offsetTop - (isMobile ? 100 : 80),
          behavior: 'smooth'
        });
      }
    } else {
      // Se não estiver na Home, o <Link> redireciona para /#section automaticamente
      if (onClick) onClick();
    }
  };

  const navItems = [
    { label: "About me", section: "about", href: "/#about" },
    { label: "Projects", section: "projects", href: "/#projects" },
    { label: "Blog", section: "blog", href: "/blog" },
    { label: "Learn", section: "learn", href: "/learn" }, // Adicionado!
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