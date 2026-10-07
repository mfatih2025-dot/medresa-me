"use client";

import Image from "next/image";
import { motion, useInView, useTransform } from "framer-motion";
import { useRef, type CSSProperties } from "react";
import type { Photo } from "@/content/galerija";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { useScrollProgress } from "@/hooks/useScrollProgress";

/*
 * A photograph in the gallery: a button that opens the viewer.
 *
 * It appears through a mask opening from one side (the row decides which, so
 * neighbours don't all move alike) while the photo settles 1.03 → 1. A few large
 * frames also drift a little slower than the page (`travel`); most stay still.
 * The frame's size comes from its class (an aspect ratio), so nothing shifts;
 * the blur placeholder fills it until the photo arrives.
 */

const draw = [0.65, 0, 0.35, 1] as const;
const settle = [0.23, 1, 0.32, 1] as const;

export type Reveal = "up" | "down" | "left" | "right" | "center" | "fade";

const closed: Record<Reveal, string> = {
  up: "inset(100% 0% 0% 0%)",
  down: "inset(0% 0% 100% 0%)",
  left: "inset(0% 100% 0% 0%)",
  right: "inset(0% 0% 0% 100%)",
  center: "inset(0% 50% 0% 50%)",
  fade: "inset(0% 0% 0% 0%)",
};

export function Frame({
  photo,
  sizes,
  reveal = "up",
  delay = 0,
  travel = 0,
  priority = false,
  position,
  hidden = false,
  onOpen,
  className = "",
}: {
  photo: Photo;
  sizes: string;
  reveal?: Reveal;
  delay?: number;
  /** Drift inside the frame, % of its height each way (0: still). */
  travel?: number;
  priority?: boolean;
  /** object-position when the frame crops the photograph. */
  position?: string;
  /** Hidden while this photograph is open in the viewer (it is the one shown there). */
  hidden?: boolean;
  onOpen: (id: string, el: HTMLElement) => void;
  className?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const { reduced, compact } = useMotionProfile();
  const seen = useInView(ref, { once: true, margin: "0px 0px -8% 0px" });
  const p = useScrollProgress(ref, ["start end", "end start"]);
  const t = compact ? travel * 0.6 : travel;
  const y = useTransform(p, [0, 1], [`${(-t / (100 + 2 * t)) * 100}%`, `${(t / (100 + 2 * t)) * 100}%`]);

  const image = (
    <Image
      src={photo.src}
      alt={photo.alt}
      fill
      sizes={sizes}
      priority={priority}
      placeholder="blur"
      blurDataURL={photo.blur}
      className="object-cover"
      style={{ objectPosition: position }}
    />
  );

  const base = `group relative block w-full overflow-hidden bg-sand text-left focus-visible:outline-offset-4 ${className}`;
  const label = `Otvori fotografiju: ${photo.alt}`;
  const open = () => ref.current && onOpen(photo.id, ref.current);
  const fadeOut: CSSProperties = { opacity: hidden ? 0 : 1, transition: "opacity 120ms linear" };

  if (reduced)
    return (
      <button
        ref={ref}
        type="button"
        data-gal={photo.id}
        aria-label={label}
        onClick={open}
        className={base}
        style={fadeOut}
      >
        {image}
      </button>
    );

  const isFade = reveal === "fade";
  return (
    <motion.button
      ref={ref}
      type="button"
      data-gal={photo.id}
      aria-label={label}
      onClick={open}
      className={base}
      style={fadeOut}
      initial={isFade ? { opacity: 0 } : { clipPath: closed[reveal] }}
      animate={
        isFade
          ? { opacity: seen ? (hidden ? 0 : 1) : 0 }
          : { clipPath: seen ? "inset(0% 0% 0% 0%)" : closed[reveal] }
      }
      transition={{ duration: isFade ? 0.7 : 1.05, delay, ease: isFade ? settle : draw }}
    >
      <motion.span
        className="absolute inset-0 block"
        initial={{ scale: 1.03 }}
        animate={{ scale: seen ? 1 : 1.03 }}
        transition={{ duration: 1.5, delay, ease: settle }}
      >
        <motion.span
          className="absolute inset-x-0 block will-change-transform"
          style={t ? { top: `${-t}%`, bottom: `${-t}%`, y } : { top: 0, bottom: 0 }}
        >
          {image}
        </motion.span>
      </motion.span>
      {/* A quiet answer to hover: the photograph dims a touch. */}
      <span className="pointer-events-none absolute inset-0 bg-ink/0 transition-colors duration-300 group-hover:bg-ink/[0.04]" />
    </motion.button>
  );
}
