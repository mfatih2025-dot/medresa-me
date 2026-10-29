"use client";

import { getImageProps } from "next/image";
import Link from "next/link";
import { Bodoni_Moda, Newsreader } from "next/font/google";
import { motion, useReducedMotion, useTransform } from "framer-motion";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import type { Dictionary } from "@/content";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { ArrowRight, DocumentIcon } from "@/components/ui/icons";

/*
 * The hero's own display face: Bodoni Moda (SIL Open Font License), a
 * high-contrast Didone with an optical-size axis, so the large name gets its
 * finest hairlines. Latin Extended covers č ć š ž đ. Loaded by this component
 * only; the rest of the site keeps its typography.
 */
const display = Bodoni_Moda({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  variable: "--font-hero",
  display: "swap",
});

/* The admissions label: Newsreader (SIL OFL), an editorial text serif with an
   optical-size axis, calmer and more legible than the Didone at card size. */
const label = Newsreader({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  variable: "--font-hero-label",
  display: "swap",
});

/** The two arches of the mihrab outline, drawn upward from their feet (pathLength 1). */
const ARCHES = [
  "M40 640 V300 A320 320 0 0 1 200 22.9 A320 320 0 0 1 360 300 V640",
  "M66 640 V300 A268 268 0 0 1 200 68 A268 268 0 0 1 334 300 V640",
];

/*
 * Phones: where the mihrab stands in the film's own frame (788 x 1318, the size of
 * the loop and its poster). RIDGE is the sky above the hill on the right, traced
 * from the film (the same in every frame of the loop, within 2 px): the arches are
 * clipped to it, so the hill covers their feet and they never cross the building.
 * At rest the crown is at y 279, high in the sky, and the feet stand in the hill.
 */
const FRAME = { w: 788, h: 1318 };
const RIDGE =
  "M0 0H788V694L768 704L752 701L736 704L720 706L704 708L688 710L672 710L656 714L640 718L624 720L608 722L592 724L576 718L560 718L544 720L528 720L512 723L496 730L480 728L464 730L448 734L432 736L416 738L400 740L384 742L352 754L320 758L288 767L256 770L224 778L200 784L0 784Z";
const ARCH_AT = { x: 430, y: 261, scale: 0.8 };
const ARCH_CROWN = ARCH_AT.y + 22.9 * ARCH_AT.scale;
const ARCH_RIGHT = ARCH_AT.x + 360 * ARCH_AT.scale;
/** Least distance in px between the arch and a line of the name. */
const CLEAR = 10;

/**
 * Phones (below md) see the campus from the air in a seamless loop: clouds drift
 * over the building, which stays still. 3.6 s at 24 fps without sound, made from
 * the source film by cross-fading its last 1.5 s into its first; H.264 (590 KB,
 * hardware-decoded on every phone) with a VP9 WebM (390 KB) for browsers without
 * H.264. The poster is its first frame, so the still and the film meet without a
 * jump. Tablets and desktops keep the photograph.
 */
const PHONE = {
  mp4: "/images/hero/mobile-loop.mp4",
  webm: "/images/hero/mobile-loop.webm",
  poster: "/images/hero/mobile-loop.jpg",
};
const PHONE_QUERY = "(max-width: 767px) and (prefers-reduced-motion: no-preference)";

/*
 * Phones, under a moving film: two layers of the composition are drawn without the
 * per-frame cost they carry over video. (With the film, the mask and the soft-light
 * glow made the browser re-render the whole hero offscreen for every frame; GPU work
 * while scrolling fell from about 63% to 40% of a core with these, 36% without film.)
 * - The top fade: instead of masking the film to transparency, the sky gradient of
 *   the section is laid over it with the mask's opposite alpha (sampled every 2%):
 *   the same pixels, the entrance fade included.
 * - The warm glow at the right: a plain radial light in place of the soft-light blend,
 *   matched to its effect on the phone composition (it differs by 1/255 on average,
 *   at most 8/255, in the sky).
 * Tablets and desktops (the photograph) keep the mask and the blend.
 */
const PHONE_FADE =
  "linear-gradient(180deg,rgb(194.1 214.5 229.9 / 1) 0%,rgb(198.2 217.2 231.1 / 0.917) 2%,rgb(202.4 219.8 232.3 / 0.833) 4%,rgb(206.7 222.3 233.4 / 0.75) 6%,rgb(211 224.8 234.4 / 0.667) 8%,rgb(215.3 227.4 235.4 / 0.583) 10%,rgb(219.6 229.9 236.5 / 0.5) 12%,rgb(223.9 232.4 237.5 / 0.417) 14%,rgb(228.2 234.9 238.6 / 0.333) 16%,rgb(229.5 235.7 238.9 / 0.25) 18%,rgb(228.6 235.2 238.8 / 0.167) 20%,rgb(227.7 234.7 238.7 / 0.083) 22%,rgb(226.8 234.2 238.5 / 0) 24%)";
const PHONE_GLOW = "radial-gradient(70% 42% at 100% 30%,rgb(255 245 225/0.05) 0%,rgb(255 245 225/0) 100%)";

/** CSS entrance timing (see .hero-in in globals.css): delay and duration in seconds. */
const enter = (delay: number, duration?: number) =>
  ({ "--in-delay": `${delay}s`, ...(duration ? { "--in-dur": `${duration}s` } : {}) }) as CSSProperties;

/**
 * Editorial cover. The real campus photograph fills the frame; the sky over it
 * brightens toward the horizon, where the identity stands as a monumental
 * serif: MEDRESA, then MEHMED / FATIH, then the signature. A faint mihrab
 * outline (the footer's arch language) rises at the side. The admissions
 * results float as dark green glass over the lower photograph.
 *
 * Entrance (CSS, so nothing stays hidden if scripts fail): MEDRESA → MEHMED →
 * FATIH → signature → results. Scroll adds restrained depth only: the
 * photograph scales and drifts, the type lifts away, the glass settles out.
 */
export function Hero({ dict, resultsEnabled = true }: { dict: Dictionary; resultsEnabled?: boolean }) {
  const { hero } = dict;
  const [first, ...rest] = hero.name.split(" ");
  const second = rest.join(" ");
  const ref = useRef<HTMLElement>(null);
  const { reduced, compact } = useMotionProfile();
  const p = useScrollProgress(ref, ["start start", "end start"]);
  // Known on the first client render, unlike useMotionProfile (settles after hydration).
  const prefersReduced = useReducedMotion();
  const still = reduced || prefersReduced === true;

  const imgScale = useTransform(p, [0, 1], [1, compact ? 1.06 : 1.1]);
  const imgY = useTransform(p, [0, 1], ["0%", compact ? "8%" : "14%"]);
  // Depth separation: the photograph sinks, the name rises a little, the lines
  // around it rise least. Opacity holds, then eases out late. Phones move less.
  const nameY = useTransform(p, [0, 1], ["0vh", compact ? "-5vh" : "-10vh"]);
  const nameOpacity = useTransform(p, [0.22, 0.62], [1, 0]);
  const lineY = useTransform(p, [0, 1], ["0vh", compact ? "-3vh" : "-6vh"]);
  const lineOpacity = useTransform(p, [0.14, 0.48], [1, 0]);
  const glassY = useTransform(p, [0, 1], [0, compact ? 30 : 60]);
  const glassOpacity = useTransform(p, [0, 0.45], [1, 0]);

  return (
    <section
      ref={ref}
      aria-labelledby="hero-title"
      className={`hero-frame ${display.variable} ${label.variable} relative isolate overflow-hidden bg-[linear-gradient(180deg,#a9c6de_0%,#c9dbe8_14%,#e6ecef_26%,#dfe8ee_40%)]`}
      style={{ height: "max(36rem, 100svh)" }}
    >
      {/* The photograph, full bleed: the architecture fills the lower frame. */}
      <motion.div
        className="absolute inset-x-0 bottom-0 top-[11svh] -z-20 will-change-transform md:top-[12svh] lg:top-0"
        style={still ? undefined : { scale: imgScale, y: imgY }}
      >
        <div className="hero-photo-in absolute inset-0 md:[mask-image:linear-gradient(180deg,transparent_0%,#000_24%)] lg:[mask-image:none]">
          <HeroPicture src={hero.image.src} alt={hero.image.alt} />
          <HeroLoop />
          <div aria-hidden className="absolute inset-0 md:hidden" style={{ backgroundImage: PHONE_FADE }} />
        </div>
      </motion.div>

      {/* Light. The sky brightens toward the horizon where the name stands (the
          photograph stays visible under the header); on wide screens the light also
          comes from the left, leaving the architecture clear. A low warm glow at the
          side, and soft shade under the glass. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(247_246_240/0.18)_0%,rgb(247_246_240/0.72)_14%,rgb(247_246_240/0.86)_27%,rgb(247_246_240/0.6)_40%,rgb(247_246_240/0.16)_51%,rgb(247_246_240/0)_60%)] md:bg-[linear-gradient(180deg,rgb(247_246_240/0.18)_0%,rgb(247_246_240/0.74)_15%,rgb(247_246_240/0.86)_32%,rgb(247_246_240/0.66)_44%,rgb(247_246_240/0)_58%)] lg:bg-[radial-gradient(46%_44%_at_20%_37%,rgb(247_246_240/0.9)_0%,rgb(247_246_240/0.78)_45%,rgb(247_246_240/0)_100%),linear-gradient(180deg,rgb(247_246_240/0.3)_0%,rgb(247_246_240/0)_24%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 max-md:hidden bg-[radial-gradient(70%_42%_at_100%_30%,rgb(255_222_160/0.32)_0%,rgb(255_222_160/0)_100%)] mix-blend-soft-light lg:bg-[radial-gradient(48%_55%_at_96%_28%,rgb(255_222_160/0.4)_0%,rgb(255_222_160/0)_100%)]"
      />
      <div aria-hidden className="absolute inset-0 -z-10 md:hidden" style={{ backgroundImage: PHONE_GLOW }} />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-[38%] bg-[linear-gradient(0deg,rgb(8_26_22/0.4)_0%,rgb(8_26_22/0)_100%)]"
      />

      {/* Phones: the mihrab rises from behind the hill of the film (PhoneArch). */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 top-[11svh] -z-10 md:hidden"
        style={still ? undefined : { scale: imgScale, y: imgY }}
      >
        <div className="hero-photo-in absolute inset-0">
          <PhoneArch />
        </div>
      </motion.div>

      {/* Tablets and desktops: the mihrab outline, two concentric pointed arches,
          hairline. Its crown rises behind the clear header; its lines end at the
          mountain ridge of the photograph (see .hero-arch-box), so it never crosses
          the building. */}
      <motion.div
        aria-hidden
        className="hero-arch-box pointer-events-none absolute right-[-6%] top-2 -z-10 h-[46svh] w-[44%] max-md:hidden lg:right-[9%] lg:h-[52svh] lg:w-[24%]"
        style={still ? undefined : { y: lineY }}
      >
        <svg viewBox="0 0 400 640" preserveAspectRatio="xMidYMin meet" className="hero-arch h-full w-full">
          {ARCHES.map((d) => (
            <path key={d} d={d} pathLength={1} />
          ))}
        </svg>
      </motion.div>

      {/* Identity (MEDRESA, the name on two lines, the signature) above, the
          admissions results at the foot of the same column. */}
      <div className="absolute inset-x-[max(var(--gutter),calc((100%-var(--max))/2+var(--gutter)))] bottom-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] top-[clamp(7.25rem,15svh,9rem)] flex flex-col md:bottom-[clamp(2rem,5svh,3rem)] md:top-[clamp(10rem,15.5svh,12.5rem)] lg:bottom-[clamp(1.75rem,4svh,2.75rem)] lg:top-[clamp(8.75rem,18.5svh,11.5rem)]">
        {/* MEDRESA, the name and the signature are scaled as one composition (93%). */}
        <h1 id="hero-title" className="w-fit max-w-full origin-top-left scale-[0.93]">
          <motion.span className="block" style={still ? undefined : { y: lineY, opacity: lineOpacity }}>
            <span className="hero-in flex items-center gap-3 md:gap-4" style={enter(0.15)}>
              <span aria-hidden className="h-px w-9 bg-gold md:w-14 lg:w-16" />
              <span className="text-[0.8125rem] font-normal uppercase tracking-[0.46em] text-gold-deep md:text-[1.0625rem] lg:text-[clamp(1rem,0.7rem+0.45vw,1.375rem)]">
                {hero.pre}
              </span>
            </span>
          </motion.span>{" "}
          <motion.span
            className="mt-2.5 block md:mt-4"
            style={still ? undefined : { y: nameY, opacity: nameOpacity }}
          >
            <span className="hero-name block font-[family-name:var(--font-hero)] text-[clamp(3.5rem,18.5cqw,6.25rem)] font-semibold uppercase leading-[0.9] tracking-[-0.012em] md:text-[clamp(6rem,15.5cqw,9.5rem)] lg:text-[clamp(6.5rem,9.4cqw,11.5rem)]">
              <span className="hero-in relative block w-fit text-green-deep" style={enter(0.35, 1.3)}>
                {first}
                <span aria-hidden className="hero-sheen absolute inset-0">
                  {first}
                </span>
              </span>{" "}
              {second && (
                <span className="hero-in relative block w-fit" style={enter(0.5, 1.3)}>
                  <span className="hero-gilt">{second}</span>
                  <span
                    aria-hidden
                    className="hero-sheen absolute inset-0"
                    style={{ animationDelay: "2.75s" }}
                  >
                    {second}
                  </span>
                </span>
              )}
            </span>
          </motion.span>{" "}
          <motion.span
            className="mt-3.5 block md:mt-6"
            style={still ? undefined : { y: lineY, opacity: lineOpacity }}
          >
            <span
              className="hero-in block pl-[0.1em] text-[0.75rem] font-normal uppercase tracking-[0.42em] text-ink min-[400px]:text-[0.8125rem] md:text-[1rem] lg:text-[clamp(0.9375rem,0.6rem+0.42vw,1.25rem)]"
              style={enter(0.85)}
            >
              {hero.signature}
            </span>
          </motion.span>
        </h1>

        {/* Admissions results: dark green glass over the photograph. */}
        <motion.div
          className="mt-auto w-full md:w-[30rem] lg:w-[min(34rem,max(30rem,40vw))]"
          style={still ? undefined : { y: glassY, opacity: glassOpacity }}
        >
          <div className="hero-in" style={enter(1.1, 1.1)}>
            <Link
              href={hero.admissions.href}
              className="group flex items-center gap-3 rounded-[22px] border border-gold-soft/35 bg-[linear-gradient(135deg,rgb(30_52_38/0.74),rgb(12_34_27/0.66))] py-3.5 pl-4 pr-3 text-ivory shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_18px_44px_-22px_rgb(0_0_0/0.6)] backdrop-blur-xl backdrop-saturate-[1.2] transition-[background-color,border-color,translate,scale] duration-300 ease-out hover:-translate-y-0.5 hover:border-gold-soft/55 active:scale-[0.985] md:gap-5 md:rounded-[26px] md:py-4 md:pl-6 md:pr-4 lg:py-5 lg:pl-7 lg:pr-5"
            >
              <span aria-hidden className="hidden shrink-0 text-gold-soft min-[360px]:block">
                {resultsEnabled && <DocumentIcon width={26} height={26} className="md:size-7" />}
              </span>
              <span
                aria-hidden
                className="mr-0.5 hidden h-10 w-px shrink-0 bg-gold-soft/30 min-[360px]:block md:h-12"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-gold-soft md:text-xs">
                  {hero.admissions.kicker}
                </span>
                <span className="mt-1 line-clamp-2 font-[family-name:var(--font-hero-label)] text-[0.9375rem] font-medium leading-[1.15] text-ivory min-[380px]:text-[1.0625rem] min-[410px]:text-[1.125rem] min-[428px]:text-[1.1875rem] md:text-[1.5rem] lg:text-[clamp(1.375rem,0.9rem+0.55vw,1.625rem)]">
                  {hero.admissions.label}
                </span>
              </span>
              <span
                aria-hidden
                className="grid size-10 shrink-0 place-items-center rounded-full border border-gold-soft/55 text-ivory transition-[background-color,border-color] duration-300 ease-out group-hover:border-gold-soft group-hover:bg-gold-soft/10 md:size-12"
              >
                <ArrowRight className="transition-transform duration-300 ease-out group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/**
 * The photograph from md up, the film's first frame on phones: one <picture>, so each
 * device downloads only its own image (art direction, see next/image getImageProps).
 */
function HeroPicture({ src, alt }: { src: string; alt: string }) {
  const common = { alt, fill: true, priority: true, sizes: "100vw", quality: 85 } as const;
  const { srcSet: wide } = getImageProps({ ...common, src }).props;
  const { srcSet: phone, ...img } = getImageProps({ ...common, src: PHONE.poster }).props;
  return (
    <picture>
      <source media="(min-width: 768px)" srcSet={wide} sizes="100vw" />
      <img
        {...img}
        srcSet={phone}
        alt={alt}
        className="object-cover object-[50%_100%] md:object-[34%_100%] lg:object-[46%_62%]"
      />
    </picture>
  );
}

/**
 * Phones: the mihrab outline in the film's frame, laid out exactly as the film is
 * (object-fit: cover from the bottom, as xMidYMax slice), so it stays on the
 * landscape at every phone size and moves with it. It rises slowly from behind the
 * hill as its lines draw (.hero-arch-rise); the clip to the sky keeps the hill in
 * front. Where a line of the name stands over the arch (short or narrow phones), the
 * arch stands lower behind the hill, its crown always clear of that line.
 */
function PhoneArch() {
  const id = useId();
  const ref = useRef<SVGGElement>(null);

  useEffect(() => {
    const g = ref.current;
    const layer = g?.ownerSVGElement?.parentElement?.parentElement;
    const section = layer?.closest("section");
    const title = section?.querySelector("h1");
    if (!g || !layer || !section || !title) return;
    const place = () => {
      // Read at rest only: scrolled, the name and the film have moved apart.
      if (window.scrollY > 0) return;
      const top = section.getBoundingClientRect().top;
      const w = layer.offsetWidth;
      const h = layer.offsetHeight;
      const k = Math.max(w / FRAME.w, h / FRAME.h);
      const crown = layer.offsetTop + h - (FRAME.h - ARCH_CROWN) * k;
      const shift = (FRAME.w * k - w) / 2;
      // The lines of the name as drawn (their text, not their boxes).
      const range = document.createRange();
      // Where each line comes to rest: less what is left of its entrance (.hero-in).
      const settle = title.getBoundingClientRect().height / title.offsetHeight;
      const lines = [...title.querySelectorAll<HTMLElement>(".hero-in")].map((line) => {
        range.selectNodeContents(line);
        const q = range.getBoundingClientRect();
        const rise = new DOMMatrix(getComputedStyle(line).transform).m42 * settle;
        return { left: q.left - CLEAR, right: q.right + CLEAR, bottom: q.bottom - rise - top + CLEAR };
      });
      // The arch's outer left edge (a pointed arch: narrow at the crown) at a depth below it.
      const edge = (depth: number) => {
        const d = depth / (k * ARCH_AT.scale);
        const x = d >= 277.1 ? 40 : 360 - Math.sqrt(320 ** 2 - (277.1 - d) ** 2);
        return (ARCH_AT.x + x * ARCH_AT.scale) * k - shift;
      };
      const touches = (c: number) =>
        lines.some((l) => l.bottom > c && edge(l.bottom - c) < l.right && ARCH_RIGHT * k - shift > l.left);
      let drop = 0;
      while (drop < 400 && touches(crown + drop * k)) drop += 2;
      g.style.transform = `translateY(${drop}px)`;
      g.ownerSVGElement?.setAttribute("data-placed", "");
      g.style.visibility = drop > 260 ? "hidden" : "";
    };
    place();
    // Any later change (the fonts arriving, a turned phone) glides, never jumps.
    requestAnimationFrame(() => g.classList.add("hero-arch-place"));
    const ro = new ResizeObserver(place);
    ro.observe(section);
    let live = true;
    document.fonts?.ready.then(() => live && place());
    return () => {
      live = false;
      ro.disconnect();
    };
  }, []);

  return (
    <svg
      viewBox={`0 0 ${FRAME.w} ${FRAME.h}`}
      preserveAspectRatio="xMidYMax slice"
      className="hero-arch-phone absolute inset-0 h-full w-full"
    >
      <clipPath id={`${id}sky`}>
        <path d={RIDGE} />
      </clipPath>
      <g clipPath={`url(#${id}sky)`}>
        <g ref={ref}>
          <g className="hero-arch-rise">
            <g transform={`translate(${ARCH_AT.x} ${ARCH_AT.y}) scale(${ARCH_AT.scale})`}>
              {ARCHES.map((d) => (
                <path key={d} d={d} pathLength={1} />
              ))}
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}

/**
 * The phone loop over its poster. Created only in the browser and only on a phone
 * that allows motion (and has not asked to save data), so tablets, desktops and
 * reduced motion never download it; shown once it plays (the poster is the same
 * frame), paused while the hero is out of view: scrolled away, or held under the
 * sections that cover it (HeroStage marks it data-covered).
 */
function HeroLoop() {
  const [on, setOn] = useState(false);
  const [playing, setPlaying] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mq = window.matchMedia(PHONE_QUERY);
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    const update = () => setOn(mq.matches && !saveData);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const v = ref.current;
    if (!on || !v) return;
    // Muted before playing, so every phone browser allows autoplay.
    v.muted = true;
    v.defaultMuted = true;
    const holder = v.closest("section")?.parentElement;
    let inView = true;
    const sync = () => {
      if (inView && !holder?.hasAttribute("data-covered")) v.play().catch(() => {});
      else v.pause();
    };
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      sync();
    });
    io.observe(v);
    const mo = new MutationObserver(sync);
    if (holder) mo.observe(holder, { attributes: true, attributeFilter: ["data-covered"] });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [on]);

  if (!on) return null;
  return (
    <video
      ref={ref}
      aria-hidden
      poster={PHONE.poster}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      disableRemotePlayback
      tabIndex={-1}
      onPlaying={() => setPlaying(true)}
      className={`pointer-events-none absolute inset-0 h-full w-full object-cover object-[50%_100%] md:hidden ${playing ? "" : "opacity-0"}`}
    >
      <source src={PHONE.mp4} type='video/mp4; codecs="avc1.640028"' />
      <source src={PHONE.webm} type='video/webm; codecs="vp9"' />
    </video>
  );
}
