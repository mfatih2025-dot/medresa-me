"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useMotionProfile } from "@/hooks/useMotionProfile";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Entrance on first view. Variants give each kind of content its own motion so a
 * section reads in order instead of everything fading up the same way:
 *   rise  – supporting content: short rise + fade (default)
 *   label – eyebrows/labels: a small horizontal slide, quicker
 *   fade  – opacity only, for content that should not move
 * Full transform strings keep the motion on the compositor.
 */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  variant = "rise",
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  variant?: "rise" | "label" | "fade";
  className?: string;
  as?: "div" | "p" | "li" | "span";
}) {
  const { reduced, compact } = useMotionProfile();
  const Comp = motion[as];
  const settled = { opacity: 1, transform: "translate3d(0px, 0px, 0px)" };
  // Reduced motion is detected after hydration, when this element may already hold its
  // initial hidden style — so settle it to visible explicitly rather than unstyled.
  if (reduced)
    return (
      <Comp className={className} initial={false} animate={settled} transition={{ duration: 0 }}>
        {children}
      </Comp>
    );
  const distance = compact ? y * 0.6 : y;
  const from =
    variant === "label"
      ? `translate3d(${compact ? -8 : -12}px, 0px, 0px)`
      : variant === "fade"
        ? "translate3d(0px, 0px, 0px)"
        : `translate3d(0px, ${distance}px, 0px)`;
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, transform: from }}
      whileInView={settled}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: variant === "rise" ? 0.8 : 0.6, delay, ease }}
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
  lineClasses,
  accentClass = "text-gold-deep",
  delay = 0.06,
  immediate = false,
  as: Tag = "h2",
  id,
}: {
  lines: readonly string[];
  className?: string;
  accentIndex?: number;
  /** Optional extra classes per line (e.g. a smaller subtitle line). */
  lineClasses?: readonly string[];
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
            <span className={`block ${i === accentIndex ? accentClass : ""} ${lineClasses?.[i] ?? ""}`}>
              {line}
            </span>
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
            className={`block ${i === accentIndex ? accentClass : ""} ${lineClasses?.[i] ?? ""}`}
            variants={{ hide: { transform: "translateY(108%)" }, show: { transform: "translateY(0%)" } }}
            transition={{ duration: 0.8, delay: delay + i * 0.08, ease }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  );
}
