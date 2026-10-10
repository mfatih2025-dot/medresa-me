"use client";
import { useEffect, useRef, type CSSProperties } from "react";
import type { PublicCampaign } from "@/admin/campaigns/model";
import styles from "./popup.module.css";

/** Native modal supplies top-layer semantics, focus containment and background
 * inertness. No global stylesheet, animation, public layout, or renderer changes. */
export function PosterDialog({ campaign, onClose, onUnavailable }: { campaign: PublicCampaign; onClose: () => void; onUnavailable?: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null), close = useRef<HTMLButtonElement>(null), image = useRef<HTMLImageElement>(null), cta = useRef<HTMLAnchorElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const el = dialog.current, artwork = image.current; if (!el || !artwork) return;
    let opened = false;
    let focused: HTMLElement | null = null;
    const root = document.documentElement, body = document.body;
    let original: { rootOverflow: string; bodyOverflow: string; padding: string; overscroll: string } | null = null;
    const scrollLock = new MutationObserver(() => {
      // Existing menu/search close timers restore root overflow independently.
      // Own this property only while THIS modal is open; never change their code.
      if (opened && root.style.overflow !== "hidden") root.style.overflow = "hidden";
    });
    const open = () => {
      if (opened || !artwork.naturalWidth || document.querySelector("dialog[open]")) return;
      opened = true;
      focused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      original = { rootOverflow: root.style.overflow, bodyOverflow: body.style.overflow, padding: body.style.paddingRight, overscroll: body.style.overscrollBehavior };
      const gap = window.innerWidth - root.clientWidth;
      body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight) + gap}px`;
      root.style.overflow = "hidden"; body.style.overflow = "hidden"; body.style.overscrollBehavior = "none";
      scrollLock.observe(root, { attributes: true, attributeFilter: ["style"] });
      el.showModal(); close.current?.focus({ preventScroll: true });
    };
    const otherDialogs = new MutationObserver(() => { if (!opened && artwork.complete) open(); });
    otherDialogs.observe(body, { subtree: true, attributes: true, attributeFilter: ["open"] });
    // A closed native dialog loads its image without showing a blank public overlay.
    // Open only once the exact original poster is available.
    if (artwork.complete) open(); else artwork.addEventListener("load", open, { once: true });
    return () => {
      artwork.removeEventListener("load", open); scrollLock.disconnect(); otherDialogs.disconnect();
      if (!opened || !original) return;
      el.close(); root.style.overflow = original.rootOverflow; body.style.overflow = original.bodyOverflow;
      body.style.paddingRight = original.padding; body.style.overscrollBehavior = original.overscroll;
      if (focused?.isConnected) focused.focus({ preventScroll: true });
    };
  }, []);
  return <dialog ref={dialog} className={styles.dialog} aria-label="Obavijest Medrese" aria-modal="true" onKeyDown={event => {
    if (event.key !== "Tab") return;
    if (event.shiftKey && document.activeElement === close.current) { event.preventDefault(); cta.current?.focus(); }
    else if (!event.shiftKey && document.activeElement === cta.current) { event.preventDefault(); close.current?.focus(); }
  }} onCancel={event => { event.preventDefault(); onCloseRef.current(); }} onClick={event => { if (event.target === event.currentTarget) onCloseRef.current(); }}>
    <div className={styles.composition} style={{ "--poster-ratio": campaign.poster.width / campaign.poster.height, "--poster-width": `${campaign.poster.width}px` } as CSSProperties}>
      <button ref={close} type="button" className={styles.close} aria-label="Zatvori obavijest" onClick={onClose}>×</button>
      {/* Original upload: deliberately bypass image optimization/transcoding. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={image} className={styles.poster} src={campaign.poster.src} alt="Poster akcije Medrese" width={campaign.poster.width} height={campaign.poster.height} onError={onUnavailable ?? onClose} />
      <a ref={cta} className={styles.cta} href={campaign.ctaLink} onClick={onClose} rel="noopener noreferrer"><span>{campaign.ctaText}</span><span aria-hidden="true">→</span></a>
    </div>
  </dialog>;
}
