// app/the-weight-of-being/page.tsx

import "@/styles/home.css";
import BookContent from "@/components/home/BookContent";

export const metadata = {
  title: "The Weight of Being | Gabriel Carvalho",
  description: "The Weight of Being, a science-fiction novel by Gabriel Carvalho.",
  alternates: { canonical: "/the-weight-of-being" },
};

export default function BookPage() {
  return (
    <div className="home">
      <BookContent />
    </div>
  );
}
