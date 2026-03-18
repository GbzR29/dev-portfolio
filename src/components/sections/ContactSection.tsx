// components/sections/ContactSection.tsx
"use client";

import { SiGithub, SiLinkedin } from "react-icons/si";
import { Mail, Terminal } from "lucide-react";
import { MyButton } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function ContactSection() {
  const { t } = useLanguage();

  return (
    <section
      id="contact"
      className="px-6 sm:px-10 lg:px-20 py-32 border-t border-white/5 bg-gradient-to-b from-transparent to-blue-500/5"
    >
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">

          {/* Left */}
          <div className="space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              {t.contactAvailable}
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              {t.contactHeadline}
            </h2>

            <p className="text-[var(--text-muted)] text-lg max-w-md leading-relaxed">
              {t.contactBody}
            </p>

            <div className="flex items-center gap-4 text-gray-300 pt-2">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 flex-shrink-0">
                <Mail size={18} className="text-blue-400" />
              </div>
              <span className="text-sm md:text-base font-mono">gabrielfeliperc@hotmail.com</span>
            </div>
          </div>

          {/* Right: Terminal card */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-10" />
            <Card padding="none" hoverable={false} className="relative border border-white/10 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.03]">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Terminal size={13} className="text-blue-400/70" />
                  <span className="font-mono">contact.sh</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                </div>
              </div>
              <div className="px-5 py-4 font-mono text-xs border-b border-white/5 bg-black/20 space-y-1 select-none">
                <p><span className="text-blue-400/60">$</span> <span className="text-white/40">./send_message --to gabriel</span></p>
                <p className="text-green-400/50">✓ Connection established. Ready to receive.</p>
              </div>
              <div className="p-6 space-y-4">
                <Link href="mailto:gabrielfeliperc@hotmail.com" className="block">
                  <MyButton text={t.contactSendEmail} icon={<Mail size={17} />} className="w-full py-5" />
                </Link>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="https://github.com/GbzR29" target="_blank" rel="noopener noreferrer">
                    <MyButton text="GitHub" variant="outline" icon={<SiGithub size={17} />} className="w-full py-5 border-white/10 text-white hover:border-blue-500" />
                  </Link>
                  <Link href="https://www.linkedin.com/in/gabriel-carvalho-479740234/" target="_blank" rel="noopener noreferrer">
                    <MyButton text="LinkedIn" variant="outline" icon={<SiLinkedin size={17} />} className="w-full py-5 border-white/10 text-white hover:border-blue-500" />
                  </Link>
                </div>
                <p className="text-center text-xs text-[var(--text-muted)] font-mono pt-1">{t.contactResponseTime}</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}