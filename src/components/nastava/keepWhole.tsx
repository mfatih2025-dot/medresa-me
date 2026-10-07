import type { ReactNode } from "react";

/**
 * Hyphenated compounds („e-maila“, „odgojno-obrazovni“) never split at their
 * hyphen: each is wrapped so the line breaks before or after the whole word.
 */
export function keepWhole(text: string): ReactNode[] {
  return text.split(/(\S+-\S+)/).map((part, i) =>
    i % 2 ? (
      <span key={i} className="whitespace-nowrap">
        {part}
      </span>
    ) : (
      part
    ),
  );
}
