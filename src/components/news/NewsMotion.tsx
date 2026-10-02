"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { Img } from "@/content/bs";
import { useMotionProfile } from "@/hooks/useMotionProfile";

const ease = [0.16, 1, 0.3, 1] as const;
const inView = { once: true, margin: "0px 0px -8% 0px" } as const;

/**
 * News photograph with a single, restrained entrance: the frame opens from a
 * slight bottom crop while the photo settles from 1.05 to 1. The image is in its
 * box from the first frame (no empty space while it animates). Hover zoom is a
 * gated CSS transition on the image itself.
 */
export function NewsImage({
  image,
  sizes,
  className = "",
  priority = false,
  quiet = false,
}: {
  image: Img;
  sizes: string;
  className?: string;
  priority?: boolean;
  /** Smaller stories answer hover more quietly. */
  quiet?: boolean;
}) {
  const { reduced } = useMotionProfile();
  // Reduced motion is known only after hydration: settle explicitly instead of leaving
  // the initial crop/scale in place.
  const frame = reduced
    ? { initial: false as const, animate: { clipPath: "inset(0% 0% 0% 0%)" }, transition: { duration: 0 } }
    : {
        initial: { clipPath: "inset(0% 0% 7% 0%)" },
        whileInView: { clipPath: "inset(0% 0% 0% 0%)" },
        viewport: inView,
        transition: { duration: 0.9, ease },
      };
  const photo = reduced
    ? { initial: false as const, animate: { scale: 1 }, transition: { duration: 0 } }
    : {
        initial: { scale: 1.05 },
        whileInView: { scale: 1 },
        viewport: inView,
        transition: { duration: 1.1, ease },
      };

  return (
    <motion.div className={`relative overflow-hidden bg-sand ${className}`} {...frame}>
      <motion.div className="absolute inset-0" {...photo}>
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes={sizes}
          priority={priority}
          className={`object-cover transition-transform duration-[600ms] ease-[var(--ease-out-expo)] motion-reduce:group-hover:scale-100 ${quiet ? "group-hover:scale-[1.02]" : "group-hover:scale-[1.03]"}`}
          style={{ objectPosition: image.position }}
        />
      </motion.div>
      {/* hover light: a faint wash from the top, pointer devices only (group-hover is hover-gated) */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgb(255_255_255/0.1),rgb(255_255_255/0)_60%)] opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
      />
    </motion.div>
  );
}

/** A thin gold hairline that draws in once: from the left, or from the top when vertical. */
export function GoldRule({ className = "", vertical = false }: { className?: string; vertical?: boolean }) {
  const { reduced } = useMotionProfile();
  const axis = vertical ? "scaleY" : "scaleX";
  const motionProps = reduced
    ? { initial: false as const, animate: { [axis]: 1 }, transition: { duration: 0 } }
    : {
        initial: { [axis]: 0 },
        whileInView: { [axis]: 1 },
        viewport: inView,
        transition: { duration: vertical ? 1.2 : 0.9, ease },
      };
  return (
    <motion.span
      aria-hidden
      className={`block bg-gold/70 ${vertical ? "w-px origin-top" : "h-px origin-left"} ${className}`}
      {...motionProps}
    />
  );
}
