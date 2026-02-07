export function ProjectsSection() {
  return (
    <section
      id="projects"
      className="
        px-6 sm:px-10 lg:px-20
        py-24
        border-t border-white/5
      "
    >
      <div className="max-w-6xl mx-auto space-y-12">
        <h2 className="text-3xl font-semibold">Projetos</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="
                p-6 rounded-2xl
                bg-[#0B1220]/60
                backdrop-blur-xl
                border border-white/10
                hover:-translate-y-1
                transition
              "
            >
              <h3 className="font-medium mb-2">Projeto {item}</h3>
              <p className="text-gray-400 text-sm">
                Descrição curta do projeto aqui.
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
