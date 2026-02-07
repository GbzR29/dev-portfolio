interface NavLinksProps {
  onClick?: () => void;
  vertical?: boolean;
}

export function NavLinks({ onClick, vertical }: NavLinksProps) {
  return (
    <nav
      className={`
        flex ${vertical ? "flex-col gap-10 text-lg" : "gap-8"} text-[var(--text)] text-lg
      `}
    >
      <a onClick={onClick} href="#about" className="hover:text-[var(--hover)]">
        About me
      </a>

      <a onClick={onClick} href="#projects" className="hover:text-[var(--hover)]">
        Projects
      </a>

      <a onClick={onClick} href="#contact" className="hover:text-[var(--hover)]">
        Contact
      </a>
    </nav>
  );
}
