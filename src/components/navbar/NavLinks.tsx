interface NavLinksProps {
  onClick?: () => void;
  vertical?: boolean;
}

export function NavLinks({ onClick, vertical }: NavLinksProps) {
  return (
    <nav
      className={`
        flex ${vertical ? "flex-col gap-10 text-lg" : "gap-8"}
        text-gray-300
      `}
    >
      <a onClick={onClick} href="#about" className="hover:text-blue-400">
        About me
      </a>

      <a onClick={onClick} href="#projects" className="hover:text-blue-400">
        Projects
      </a>

      <a onClick={onClick} href="#contact" className="hover:text-blue-400">
        Contact
      </a>
    </nav>
  );
}
