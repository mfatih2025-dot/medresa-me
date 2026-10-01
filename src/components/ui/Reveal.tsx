"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useMotionProfile } from "@/hooks/useMotionProfile";

const ease = [0.16, 1, 0.3, 1] as const;

/** Fade + short rise when entering the viewport. Opt-in, never decorative loops. */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "p" | "li" | "span";
}) {
  const { reduced, compact } = useMotionProfile();
  const Comp = motion[as];
  if (reduced) return <Comp className={className}>{children}</Comp>;
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y: compact ? y * 0.6 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 1.1, delay, ease }}
    >
      {children}
    </Comp>
  );
}

/** Headline revealed line by line from behind a mask. */
export function LineReveal({
  lines,
  className,
  accentIndex,
  accentClass = "text-gold-deep",
  delay = 0,
  immediate = false,
  as: Tag = "h2",
  id,
}: {
  lines: readonly string[];
  className?: string;
  accentIndex?: number;
  accentClass?: string;
  delay?: number;
  /** Animate on mount instead of on scroll (hero). */
  immediate?: boolean;
  as?: "h1" | "h2" | "h3" | "p";
  id?: string;
}) {
  const { reduced } = useMotionProfile();
  const MotionTag = motion[Tag];
  // The trigger lives on the (unclipped) heading; the masked lines inherit it.
  const trigger = immediate
    ? { animate: "show" as const }
    : { whileInView: "show" as const, viewport: { once: true, margin: "0px 0px -15% 0px" } };

  if (reduced) {
    return (
      <Tag className={className} id={id}>
        {lines.map((line, i) => (
          <span className="line-mask" key={line}>
            <span className={`block ${i === accentIndex ? accentClass : ""}`}>{line}</span>
          </span>
        ))}
      </Tag>
    );
  }

  return (
    <MotionTag className={className} id={id} initial="hide" {...trigger}>
      {lines.map((line, i) => (
        <span className="line-mask" key={line}>
          <motion.span
            className={`block ${i === accentIndex ? accentClass : ""}`}
            variants={{ hide: { y: "108%" }, show: { y: "0%" } }}
            transition={{ duration: 1.2, delay: delay + i * 0.12, ease }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  );
}
