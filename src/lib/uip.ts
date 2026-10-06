import type { Location } from "@/content/uip";

/*
 * Derived views of the Uprava i profesori source data. Nothing here adds
 * information: a person is the exact name string as published, and their
 * subjects are every subject (in source order) whose list contains that exact
 * string — within one location only.
 */

export type Person = { name: string; subjects: string[] };
export type LetterGroup = { letter: string; people: Person[] };

/*
 * Bosnian alphabetical order (A B C Č Ć D Dž Đ E … L Lj … N Nj … S Š … Z Ž),
 * computed here rather than by Intl.Collator: browsers and Node disagree on
 * where Đ belongs, which would order the list differently on server and client.
 * Letters outside the alphabet (q, w, x, y, ç) sit beside their nearest kin.
 */
const ALPHABET = [
  "a",
  "b",
  "c",
  "ç",
  "č",
  "ć",
  "d",
  "dž",
  "đ",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "lj",
  "m",
  "n",
  "nj",
  "o",
  "p",
  "q",
  "r",
  "s",
  "š",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "ž",
];
const RANK = new Map(ALPHABET.map((l, i) => [l, i]));

function keyOf(name: string): number[] {
  const s = name.toLocaleLowerCase("bs");
  const key: number[] = [];
  for (let i = 0; i < s.length; i++) {
    const two = s.slice(i, i + 2);
    if (RANK.has(two) && two.length === 2) {
      key.push(RANK.get(two)! + 1);
      i++;
    } else if (RANK.has(s[i])) key.push(RANK.get(s[i])! + 1);
    else if (s[i] === " ") key.push(0);
  }
  return key;
}

function compare(a: string, b: string) {
  const x = keyOf(a);
  const y = keyOf(b);
  for (let i = 0; i < Math.min(x.length, y.length); i++) if (x[i] !== y[i]) return x[i] - y[i];
  return x.length - y.length;
}

/** One entry per person, with all of their subjects, alphabetical (Bosnian collation). */
export function people(loc: Location): Person[] {
  const map = new Map<string, string[]>();
  for (const s of loc.subjects) {
    for (const t of s.teachers) {
      const list = map.get(t) ?? [];
      if (!list.includes(s.name)) list.push(s.name);
      map.set(t, list);
    }
  }
  return [...map.entries()]
    .map(([name, subjects]) => ({ name, subjects }))
    .sort((a, b) => compare(a.name, b.name));
}

/** First letter as Bosnian readers group it (Č, Ć, Đ, Š, Ž, Dž, Lj, Nj are letters of their own). */
export function letterOf(name: string) {
  const two = name.slice(0, 2);
  if (["Dž", "Lj", "Nj"].includes(two)) return two;
  return name.charAt(0).toLocaleUpperCase("bs");
}

export function byLetter(list: Person[]): LetterGroup[] {
  const groups: LetterGroup[] = [];
  for (const p of list) {
    const letter = letterOf(p.name);
    const last = groups[groups.length - 1];
    if (last?.letter === letter) last.people.push(p);
    else groups.push({ letter, people: [p] });
  }
  return groups;
}

/** Case- and diacritic-insensitive form for search (č → c, đ → d, ç → c …). */
export function fold(s: string) {
  return s.toLocaleLowerCase("bs").replace(/đ/g, "d").normalize("NFD").replace(/\p{M}/gu, "").trim();
}

/** Every query word must appear somewhere in the text. */
export function matches(text: string, query: string) {
  const q = fold(query);
  if (!q) return true;
  const t = fold(text);
  return q.split(/\s+/).every((w) => t.includes(w));
}

/** Stable DOM id for a person or subject within a location. */
export function anchorId(kind: "p" | "s", loc: string, name: string) {
  return `${kind}-${loc}-${fold(name).replace(/[^a-z0-9]+/g, "-")}`;
}
