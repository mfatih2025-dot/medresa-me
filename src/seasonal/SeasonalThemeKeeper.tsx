"use client";

import { useLayoutEffect } from "react";

/*
 * Keeps <html data-seasonal-theme> as the pre-paint script set it. Where React has
 * to render a page again in the browser (a page whose server HTML does not match,
 * as the news articles do today), it rebuilds <html> without that attribute; this
 * puts it back before the screen is painted. Runs the very script that set it.
 */
export function SeasonalThemeKeeper({ script }: { script: string }) {
  useLayoutEffect(() => {
    new Function(script)();
  }, [script]);
  return null;
}
