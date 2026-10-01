"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Modal built on the native <dialog>: focus trap, Escape and inert background
 * come for free. Opens/closes with a CSS transition driven by `data-state`.
 */
export function Overlay({
  open,
  onClose,
  label,
  className = "",
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open) {
      if (!dlg.open) dlg.showModal();
      document.documentElement.style.overflow = "hidden";
      const raf = requestAnimationFrame(() => {
        dlg.dataset.state = "open";
      });
      return () => cancelAnimationFrame(raf);
    }
    dlg.dataset.state = "closed";
    const t = window.setTimeout(() => {
      if (dlg.open) dlg.close();
      document.documentElement.style.overflow = "";
    }, 500);
    return () => window.clearTimeout(t);
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      data-state="closed"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className={`fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-y-auto bg-transparent p-0 text-ivory backdrop:bg-transparent ${className}`}
    >
      {children}
    </dialog>
  );
}
