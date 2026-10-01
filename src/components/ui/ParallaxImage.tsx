"use client";

import Image from "next/image";
import { motion, useTransform } from "framer-motion";
import { useRef } from "react";
import type { Img } from "@/content/bs";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { useScrollDrift } from "@/hooks/useScrollDrift";

type Props = {
  image: Img;
  sizes: string;
  className?: string;
  /** Vertical travel of the photo inside its frame, in % of frame height. */
  travel?: number;
  /** Start/end scale: the photo settles gently as it passes through view. */
  scale?: [number, number];
  /** Clip-path mask that opens as the frame enters. */
  mask?: boolean;
  priority?: boolean;
  /** Extra response to scroll velocity (desktop only). */
  drift?: number;
};

export function ParallaxImage({
  image,
  sizes,
  className = "",
  travel = 8,
  scale = [1.14, 1],
  mask = false,
  priority = false,
  drift = 0,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { reduced, compact } = useMotionProfile();
  const scrollYProgress = useScrollProgress(ref, ["start end", "end start"]);
  const t = compact ? travel * 0.5 : travel;
  const y = useTransform(scrollYProgress, [0, 1], [`${-t}%`, `${t}%`]);
  const s = useTransform(scrollYProgress, [0, 0.5], scale);
  const d = useScrollDrift(drift, !compact && !reduced && drift > 0);
  const clip = useTransform(
    scrollYProgress,
    [0, 0.34],
    compact ? ["inset(8% 6% 8% 6%)", "inset(0% 0% 0% 0%)"] : ["inset(14% 12% 14% 12%)", "inset(0% 0% 0% 0%)"],
  );
  const still = reduced;

  return (
    <motion.div
      ref={ref}
      className={`relative overflow-hidden bg-sand ${className}`}
      style={mask && !still ? { clipPath: clip } : undefined}
    >
      <motion.div
        className="absolute inset-[-10%] will-change-transform"
        style={still ? undefined : { y, scale: s }}
      >
        <motion.div className="absolute inset-0" style={still ? undefined : { y: d }}>
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover"
            style={{ objectPosition: image.position }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
