"use client";

import { useEffect, useState } from "react";

type AnimatedHeadingProps = {
  text: string;
  className?: string;
};

const charDelay = 30;
const initialDelay = 200;

export function AnimatedHeading({ text, className = "" }: AnimatedHeadingProps) {
  const [visible, setVisible] = useState(false);
  const lines = text.split("\n");

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), initialDelay);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <h1 className={className} style={{ letterSpacing: "-0.04em" }}>
      {lines.map((line, lineIndex) => {
        const lineOffset = lines
          .slice(0, lineIndex)
          .reduce((total, currentLine) => total + currentLine.length, 0);

        return (
          <span className="block" key={`${line}-${lineIndex}`}>
            {line.split("").map((character, charIndex) => {
              const delay = initialDelay + (lineOffset + charIndex) * charDelay;

              return (
                <span
                  aria-hidden="true"
                  className="inline-block transition-all"
                  key={`${character}-${lineIndex}-${charIndex}`}
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateX(0)" : "translateX(-18px)",
                    transitionDelay: `${delay}ms`,
                    transitionDuration: "500ms",
                  }}
                >
                  {character === " " ? "\u00A0" : character}
                </span>
              );
            })}
          </span>
        );
      })}
      <span className="sr-only">{text}</span>
    </h1>
  );
}
