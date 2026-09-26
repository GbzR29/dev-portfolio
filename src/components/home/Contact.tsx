"use client";

// ── Contact ─────────────────────────────────────────────────────────────────
// E-mail as copyable text plus GitHub / LinkedIn / CV rows.

import { useEffect, useRef, useState } from "react";
import { SiGithub, SiLinkedin } from "react-icons/si";
import { FileText } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { CONTACT } from "./links";

type CopyState = "idle" | "copied" | "selected";

export default function Contact() {
  const { t } = useLanguage();
  const [copy, setCopy] = useState<CopyState>("idle");
  const mailRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (copy === "idle") return;
    const id = setTimeout(() => setCopy("idle"), 1600);
    return () => clearTimeout(id);
  }, [copy]);

  // Clipboard can be blocked (insecure origin, permissions); then select the
  // text so a manual Ctrl+C still works.
  const selectMail = () => {
    const el = mailRef.current;
    const sel = window.getSelection();
    if (!el || !sel) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    sel.removeAllRanges();
    sel.addRange(range);
    setCopy("selected");
  };

  const onCopy = () => {
    if (!navigator.clipboard) return selectMail();
    navigator.clipboard.writeText(CONTACT.email).then(() => setCopy("copied"), selectMail);
  };

  const label = copy === "copied" ? t.contactCopied : copy === "selected" ? t.contactSelected : t.contactCopy;

  return (
    <section id="contact" className="hm-sec">
      <h2>{t.contactTitle}</h2>
      <div className="hm-contact">
        <div>
          <h3>{t.contactHeadline}</h3>
          <p>{t.contactBody}</p>
          <div className="hm-mail">
            <code ref={mailRef}>{CONTACT.email}</code>
            <button type="button" className="hm-copy" onClick={onCopy} aria-live="polite">
              {label}
            </button>
          </div>
        </div>
        <ul className="hm-rows">
          <li>
            <a href={CONTACT.github} target="_blank" rel="noopener noreferrer">
              <SiGithub aria-hidden="true" />GitHub<small>{CONTACT.githubUser} ↗</small>
            </a>
          </li>
          <li>
            <a href={CONTACT.linkedin} target="_blank" rel="noopener noreferrer">
              <SiLinkedin aria-hidden="true" />LinkedIn<small>gabriel-carvalho ↗</small>
            </a>
          </li>
          <li>
            <a href={CONTACT.cv} target="_blank" rel="noopener noreferrer">
              <FileText aria-hidden="true" />{t.contactCv}<small>PDF ↗</small>
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
}
