/**
 * The shape of a translation: the Bosnian content's structure with every text
 * widened to `string`. Typing sq/en content with it makes the compiler check
 * that no key, list item or field of the Bosnian master is missing.
 */
export type Localized<T> = T extends string
  ? string
  : T extends number | boolean | null | undefined
    ? T
    : T extends readonly (infer U)[]
      ? readonly Localized<U>[]
      : T extends object
        ? { readonly [K in keyof T]: Localized<T[K]> }
        : T;
