// ── JSON-LD ─────────────────────────────────────────────────────────────────
// Structured data for search engines, rendered on the server. `<` is escaped
// so no string inside can close the script tag (Next.js JSON-LD guide).

export function JsonLd({ data }: { data: object | null }) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
