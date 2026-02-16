"use client";

import { useState, useEffect, useCallback, memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

interface NavLinksProps {
  onClick?: () => void;
  vertical?: boolean;
  className?: string;
}

const NAV_ITEMS = [
  { label: "Home", section: "hero", href: "/" },
  { label: "About me", section: "about", href: "/#about" },
  { label: "Projects", section: "projects", href: "/#projects" },
  { label: "Blog", section: "blog", href: "/blog" },
  { label: "Learn", section: "learn", href: "/learn" },
  { label: "Contact", section: "contact", href: "/#contact" },
];

function _NavLinks({ onClick, vertical, className }: NavLinksProps) {
  const [activeSection, setActiveSection] = useState<string>("");
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  useEffect(() => {
    const handleResize = () => setIsMobileLayout(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Active link logic
  useEffect(() => {
    if (pathname.startsWith("/blog")) {
      setActiveSection("blog");
      return;
    }
    if (pathname.startsWith("/learn")) {
      setActiveSection("learn");
      return;
    }
    if (!isHomePage) {
      setActiveSection("");
      return;
    }

    const sections = ["about", "projects", "contact"];
    const onScroll = () => {
      const scrollPos = window.scrollY + (isMobileLayout ? 120 : 100);

      for (const section of sections) {
        const el = document.getElementById(section);
        if (!el) continue;
        const top = el.offsetTop;
        const height = el.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
          setActiveSection(section);
          return;
        }
      }
      if (window.scrollY < 300) setActiveSection("hero");
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [isMobileLayout, isHomePage, pathname]);

  const handleNavClick = useCallback(
    (section: string, e: React.MouseEvent, href: string) => {
      if (section === "blog" || section === "learn" || !isHomePage) {
        if (onClick) onClick();
        return; // let Next handle navigation
      }

      // Smooth scroll for anchors in Home
      if (href.startsWith("/#") || section === "hero") {
        e.preventDefault();
        const targetId = section === "hero" ? "top" : section;
        if (section === "hero") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          const el = document.getElementById(targetId);
          if (el) {
            window.scrollTo({
              top: el.offsetTop - (isMobileLayout ? 100 : 80),
              behavior: "smooth",
            });
          }
        }
        if (onClick) onClick();
      }
    },
    [isHomePage, isMobileLayout, onClick]
  );

  return (
    <nav
      className={`
        ${vertical ? "flex flex-col w-full gap-2" : "flex items-center gap-10"} 
        ${className || ""}
      `}
      aria-label="Primary"
    >
      {NAV_ITEMS.map(({ label, section, href }, index) => {
        const isActive = activeSection === section;
        return (
          <Link
            key={section}
            href={href}
            onClick={(e) => handleNavClick(section, e, href)}
            className={`
              group relative transition-all duration-300
              ${vertical ? "flex items-center justify-between py-5 border-b border-[var(--border)] last:border-0" : "py-1 text-[var(--text-navbar)] font-medium"}
              ${isActive ? "text-[var(--primary)]" : "text-[var(--text-main)] hover:text-[var(--primary)]"}
            `}
            aria-current={isActive ? "page" : undefined}
          >
            <div className="flex items-center gap-4">
              {vertical && (
                <span className="font-mono text-[10px] opacity-30 group-hover:opacity-100 transition-opacity">
                  0{index + 1}
                </span>
              )}
              <span
                className={`
                  transition-transform duration-300
                  ${vertical ? "text-2xl font-light tracking-tight group-active:scale-95" : ""}
                  ${isActive && vertical ? "font-normal translate-x-2" : ""}
                `}
              >
                {label}
              </span>
            </div>

            {vertical && <ChevronRight size={18} className={`transition-all duration-300 ${isActive ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 group-hover:opacity-50 group-hover:translate-x-0"}`} />}

            {!vertical && (
              <span
                className={`
                  absolute left-0 -bottom-1 h-[2px] bg-[var(--primary)]
                  transition-all duration-300 ease-in-out
                  ${isActive ? "w-full opacity-100" : "w-0 opacity-0 group-hover:w-full group-hover:opacity-50"}
                `}
                style={{ boxShadow: isActive ? "0 0 8px var(--primary)" : "none" }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export const NavLinks = memo(_NavLinks);
