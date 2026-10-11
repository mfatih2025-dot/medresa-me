import type { ReactNode } from "react";
import { Shell } from "@/app/_shell/Shell";

/** Preserve the real public renderer shell; every preview page verifies its session. */
export default function PreviewLayout({ children }: { children: ReactNode }) {
  return <Shell locale="bs">{children}</Shell>;
}
