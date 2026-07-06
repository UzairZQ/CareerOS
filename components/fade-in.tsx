"use client";

import { useEffect, useState } from "react";

type FadeInProps = {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
};

export function FadeIn({
  children,
  delay = 0,
  duration = 700,
  className = "",
}: FadeInProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), delay);
    return () => window.clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transition-opacity ${visible ? "opacity-100" : "opacity-0"} ${className}`}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}
