

export function ContactSection() {
  return (
    <section
      id="contact"
      className="
        px-6 sm:px-10 lg:px-20
        py-24
        border-t border-white/5
      "
    >
      <div className="max-w-3xl mx-auto space-y-10 text-center">
        <h2 className="text-3xl font-semibold">Contact</h2>

        <p className="text-gray-400">
          Want to talk about projects, games, or technology? Send me a message.
        </p>

        <div className="flex justify-center gap-6">
          <a
            href="mailto:gabrielfeliperc@hotmail.com"
            className="px-6 py-3 bg-blue-500 rounded-xl hover:bg-blue-600 transition"
          >
            Send email
          </a>

          <a
            href="https://github.com"
            className="px-6 py-3 border border-white/10 rounded-xl hover:bg-white/5 transition"
          >
            GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
