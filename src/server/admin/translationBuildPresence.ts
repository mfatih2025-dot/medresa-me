/** Safe seed. The Preview prebuild hook replaces this with presence booleans only. */
export const translationBuildPresence = {
  captured: false,
  keyDefined: false,
  keyNonEmpty: false,
  keyHasNonWhitespace: false,
  previewEnvironment: false,
  adminBranch: false,
  commitSha: null as string | null,
};
