import type { SVGProps } from "react";

const base = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export const SearchIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </svg>
);

export const ArrowRight = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} width={18} height={18} {...p}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </svg>
);

export const DocumentIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} strokeWidth={1.25} {...p}>
    <path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5L14 3Z" />
    <path d="M14 3v4.5h4.5M9 12h6M9 15h6M9 18h4" />
  </svg>
);

export const ArrowDown = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} width={18} height={18} {...p}>
    <path d="M12 4v15M6 13l6 6 6-6" />
  </svg>
);

export const ChevronDown = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} width={18} height={18} {...p}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const PlayIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} fill="currentColor" stroke="none" width={14} height={14} {...p}>
    <path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5Z" />
  </svg>
);

export const PauseIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} fill="currentColor" stroke="none" width={14} height={14} {...p}>
    <rect x="6" y="4.5" width="4" height="15" rx="1" />
    <rect x="14" y="4.5" width="4" height="15" rx="1" />
  </svg>
);

export const CloseIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M5 5l14 14M19 5 5 19" />
  </svg>
);

export const MenuIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M4 8h16M4 16h16" />
  </svg>
);

export const PhoneIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M5.5 4h2.8l1.5 3.8-1.9 1.3a10.5 10.5 0 0 0 5 5l1.3-1.9 3.8 1.5v2.8a2 2 0 0 1-2 2A15.5 15.5 0 0 1 3.5 6a2 2 0 0 1 2-2Z" />
  </svg>
);

export const MailIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <rect x="3.25" y="5.5" width="17.5" height="13" rx="1.25" />
    <path d="m4 6.5 8 6 8-6" />
  </svg>
);

export const PinIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M12 20.5s-6.25-5.4-6.25-10.6a6.25 6.25 0 0 1 12.5 0c0 5.2-6.25 10.6-6.25 10.6Z" />
    <circle cx="12" cy="9.9" r="2.3" />
  </svg>
);

export const ClockIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.25" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const ArrowUpRight = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} width={18} height={18} {...p}>
    <path d="M7 17 17 7M9 7h8v8" />
  </svg>
);

/** Share: an arrow rising out of an open box (the platform share gesture). */
export const ShareIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} width={18} height={18} {...p}>
    <path d="M12 3.5v11M8 7.5l4-4 4 4M8.5 10.5H7A1.5 1.5 0 0 0 5.5 12v7A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5h-1.5" />
  </svg>
);
