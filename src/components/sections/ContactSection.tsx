"use client";

import { SiGithub, SiLinkedin } from "react-icons/si";
import { Mail, MessageSquare } from "lucide-react";
import { MyButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card"; // Certifique-se de que o path está correto
import Link from "next/link";

export function ContactSection() {
  return (
    <section
      id="contact"
      className="px-6 sm:px-10 lg:px-20 py-32 border-t border-white/5 bg-gradient-to-b from-transparent to-blue-500/5"
    >
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          
          {/* Coluna de Texto */}
          <div className="space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Available for new opportunities
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Let&apos;s build something <span className="text-blue-500">epic</span> together.
            </h2>
            
            <p className="text-gray-400 text-lg max-w-md leading-relaxed">
              Whether you have a question about game engine architecture, C++, or just want to say hi, my inbox is always open.
            </p>

            <div className="flex flex-col gap-4 pt-4">
              <div className="flex items-center gap-4 text-gray-300">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <Mail size={20} className="text-blue-400" />
                </div>
                <span className="text-sm md:text-base">gabrielfeliperc@hotmail.com</span>
              </div>
            </div>
          </div>

          {/* Coluna do Card de Ação usando seu componente Card */}
          <div className="relative">
            {/* Efeito de brilho externo (opcional, já que o Card tem glow próprio) */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-10"></div>
            
            <Card 
              padding="lg" 
              hoverable={false} 
              className="relative border border-white/10 space-y-6"
            >
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <MessageSquare size={20} className="text-blue-500" />
                Quick Links
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <Link href="mailto:gabrielfeliperc@hotmail.com" className="w-full">
                  <MyButton 
                    text="Send Email" 
                    icon={<Mail size={18} />} 
                    className="w-full py-6"
                  />
                </Link>

                <div className="grid grid-cols-2 gap-4">
                  <Link href="https://github.com/GbzR29" target="_blank" rel="noopener noreferrer">
                    <MyButton 
                      text="GitHub" 
                      variant="outline"
                      icon={<SiGithub size={18} />} 
                      className="w-full py-6 border-white/10 text-white hover:border-blue-500"
                    />
                  </Link>
                  
                  <Link href="https://www.linkedin.com/in/gabriel-carvalho-479740234/" target="_blank" rel="noopener noreferrer">
                    <MyButton 
                      text="LinkedIn" 
                      variant="outline"
                      icon={<SiLinkedin size={18} />}
                      className="w-full py-6 border-white/10 text-white hover:border-blue-500"
                    />
                  </Link>
                </div>
              </div>

              <p className="text-center text-xs text-gray-500 italic">
                Typical response time: Within 24 hours
              </p>
            </Card>
          </div>

        </div>
      </div>
    </section>
  );
}