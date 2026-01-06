"use client";

import { useState, useEffect, useRef } from "react";

interface TypewriterProps {
  text: string;
  speed?: number;
  loop?: boolean;
  pauseDuration?: number;
}

export default function Typewriter({
  text,
  speed = 50,
  loop = false,
  pauseDuration = 1000,
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState("");
  const indexRef = useRef(0);
  const isDeletingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleTyping = () => {
      if (!isDeletingRef.current) {
        if (indexRef.current < text.length) {
          indexRef.current += 1;
          setDisplayText(text.substring(0, indexRef.current));
          timeoutRef.current = setTimeout(handleTyping, speed);
        } else if (loop) {
          timeoutRef.current = setTimeout(() => {
            isDeletingRef.current = true;
            timeoutRef.current = setTimeout(handleTyping, speed);
          }, pauseDuration);
        }
      } else {
        if (indexRef.current > 0) {
          indexRef.current -= 1;
          setDisplayText(text.substring(0, indexRef.current));
          timeoutRef.current = setTimeout(handleTyping, speed);
        } else if (loop) {
          timeoutRef.current = setTimeout(() => {
            isDeletingRef.current = false;
            timeoutRef.current = setTimeout(handleTyping, speed);
          }, pauseDuration);
        }
      }
    };

    timeoutRef.current = setTimeout(handleTyping, speed);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [text, speed, loop, pauseDuration]);

  return (
    <span>
      {displayText}
      <span className="cursor">|</span>
      <style jsx>{`
        .cursor {
          display: inline-block;
          margin-left: 2px;
          animation: blink 1s infinite;
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          50.01%, 100% { opacity: 0; }
        }
      `}</style>
    </span>
  );
}
