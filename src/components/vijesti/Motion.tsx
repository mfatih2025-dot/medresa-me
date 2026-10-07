"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useMotionProfile } from "@/hooks/useMotionProfile";

const ease = [0.16, 1, 0.3, 1] as const;
const inView = { once: true, margin: "0px 0px -10% 0px" } as const;

type Pic = { src: string; alt: string; width: number; height: number; blur?: string; focus?: string };

/**
 * A news photograph with one entrance: the frame opens from a slight bottom
 * crop while the picture settles from 1.03 to 1. The picture is in its box
 * from the first frame, so nothing jumps. `fit="contain"` shows a graphic or
 * an uncropped portrait whole, on sand. `drift` adds a few pixels of parallax
 * inside the frame (wide photographic moments only).
 */
export function NewsPhoto({
  photo,
  sizes,
  className = "",
  priority = false,
  fit = "cover",
  drift = false,
  hover = true,
  immediate = false,
}: {
  photo: Pic;
  sizes: string;
  className?: string;
  priority?: boolean;
  fit?: "cover" | "contain";
  drift?: boolean;
  hover?: boolean;
  /** Reveal on mount (the article's lead photograph) rather than on scroll. */
  immediate?: boolean;
}) {
  const { reduced } = useMotionProfile();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-3%", "3%"]);
  const trigger = immediate
    ? { animate: "show" as const }
    : { whileInView: "show" as const, viewport: inView };

  const frame = reduced
    ? {}
    : {
        initial: "hide" as const,
        ...trigger,
        variants: { hide: { clipPath: "inset(0% 0% 6% 0%)" }, show: { clipPath: "inset(0% 0% 0% 0%)" } },
        transition: { duration: 0.9, ease },
      };
  const settle = reduced
    ? {}
    : {
        initial: "hide" as const,
        ...trigger,
        variants: { hide: { scale: 1.03 }, show: { scale: 1 } },
        transition: { duration: 1.1, ease },
      };
  const contain = fit === "contain";

  return (
    <motion.div ref={ref} className={`relative overflow-hidden bg-sand ${className}`} {...frame}>
      <motion.div
        className={`absolute ${drift && !reduced && !contain ? "-inset-y-[4%] inset-x-0" : "inset-0"}`}
        style={drift && !reduced && !contain ? { y } : undefined}
      >
        <motion.div className="absolute inset-0" {...settle}>
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes={sizes}
            priority={priority}
            placeholder={photo.blur ? "blur" : "empty"}
            blurDataURL={photo.blur}
            className={`${contain ? "object-contain" : "object-cover"} ${
              hover && !contain
                ? "transition-transform duration-[600ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.025] motion-reduce:group-hover:scale-100"
                : ""
            }`}
            style={contain ? undefined : { objectPosition: photo.focus ?? "50% 50%" }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
