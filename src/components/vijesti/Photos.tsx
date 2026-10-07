"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Photo } from "@/content/galerija";
import { Lightbox } from "@/components/galerija/Lightbox";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { NewsPhoto } from "./Motion";

/*
 * An article's photographs open in the site's photo viewer (the Galerija
 * lightbox, unchanged): every photograph of the article — the lead, any placed
 * in the text, the rest after it — in one sequence, opened from the tile that
 * was tapped and returning to it.
 */

type Labels = { open: string; viewer: string; close: string; prev: string; next: string };
type Ctx = { open: (id: string) => void; label: string };

const ViewerContext = createContext<Ctx | null>(null);

export function PhotoViewer({
  photos,
  labels,
  children,
}: {
  photos: readonly Photo[];
  labels: Labels;
  children: ReactNode;
}) {
  const { reduced } = useMotionProfile();
  const [index, setIndex] = useState<number | null>(null);
  const ctx = useMemo<Ctx>(
    () => ({
      open: (id) => {
        const i = photos.findIndex((p) => p.id === id);
        if (i >= 0) setIndex(i);
      },
      label: labels.open,
    }),
    [photos, labels.open],
  );
  return (
    <ViewerContext.Provider value={ctx}>
      {children}
      {index !== null && (
        <Lightbox
          list={photos}
          index={index}
          onIndex={setIndex}
          onClose={() => setIndex(null)}
          reduced={reduced}
          ui={labels}
        />
      )}
    </ViewerContext.Provider>
  );
}

/**
 * A photograph of the article at its own proportions (never cropped), as a
 * button that opens the viewer. `maxH` caps a tall portrait on large screens.
 */
export function PhotoTile({
  photo,
  sizes,
  priority = false,
  immediate = false,
  className = "",
}: {
  photo: Photo & { focus?: string };
  sizes: string;
  priority?: boolean;
  immediate?: boolean;
  className?: string;
}) {
  const ctx = useContext(ViewerContext);
  return (
    <button
      type="button"
      data-gal={photo.id}
      onClick={() => ctx?.open(photo.id)}
      aria-label={`${ctx?.label ?? ""}: ${photo.alt}`}
      className={`group block w-full cursor-zoom-in touch-manipulation text-left ${className}`}
      style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
    >
      <NewsPhoto
        photo={photo}
        sizes={sizes}
        priority={priority}
        immediate={immediate}
        className="h-full w-full"
      />
    </button>
  );
}
