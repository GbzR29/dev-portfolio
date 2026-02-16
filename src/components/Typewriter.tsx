// components/Typewriter.tsx
"use client";
import { useState, useEffect, useRef } from "react";

interface TypewriterProps {
  text: string;
  speed?: number;
  loop?: boolean;
  pauseDuration?: number;
  // Nova prop: uma função que recebe o texto atual e retorna o JSX
  children?: (displayText: string) => React.ReactNode; 
}

export default function Typewriter({
  text,
  speed = 50,
  loop = false,
  pauseDuration = 1000,
  children
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState("");
  const indexRef = useRef(0);
  const isDeletingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleTyping = () => {
      const currentText = text || ""; // Evita erros se o i18n demorar
      
      if (!isDeletingRef.current) {
        if (indexRef.current < currentText.length) {
          indexRef.current += 1;
          setDisplayText(currentText.substring(0, indexRef.current));
          timeoutRef.current = setTimeout(handleTyping, speed);
        } else if (loop) {
          timeoutRef.current = setTimeout(() => {
            isDeletingRef.current = true;
            handleTyping();
          }, pauseDuration);
        }
      } else {
        if (indexRef.current > 0) {
          indexRef.current -= 1;
          setDisplayText(currentText.substring(0, indexRef.current));
          timeoutRef.current = setTimeout(handleTyping, speed);
        } else if (loop) {
          timeoutRef.current = setTimeout(() => {
            isDeletingRef.current = false;
            handleTyping();
          }, pauseDuration);
        }
      }
    };

    timeoutRef.current = setTimeout(handleTyping, speed);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [text, speed, loop, pauseDuration]);

  // Se tiver a função children, usa ela. Se não, usa o padrão antigo.
  return (
    <>
      {children ? children(displayText) : (
        <span>
          {displayText}
          <span className="cursor">|</span>
        </span>
      )}
      
      
    </>
  );
}