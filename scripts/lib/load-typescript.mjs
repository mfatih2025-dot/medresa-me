import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import { Script } from "node:vm";
import ts from "typescript";
const require = createRequire(import.meta.url);
/** CLI/tests only: transpile modules in memory, without writing generated source. */
export function moduleLoader(overrides = {}) {
  const cache = new Map();
  function load(path) {
    const resolved = resolve(path);
    const file = [resolved, `${resolved}.ts`, `${resolved}.tsx`, `${resolved}/index.ts`].find(p => existsSync(p) && statSync(p).isFile());
    if (!file) throw new Error(`Module missing: ${path}`);
    if (cache.has(file)) return cache.get(file).exports;
    const compiledModule = { exports: {} }; cache.set(file, compiledModule);
    const compiled = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const localRequire = spec => spec in overrides ? overrides[spec] : spec.startsWith("@/") ? load(resolve("src", spec.slice(2))) : spec.startsWith(".") ? load(resolve(dirname(file), spec)) : require(spec);
    new Script(`(function(require,module,exports){${compiled}\n})`, { filename: file }).runInThisContext()(localRequire, compiledModule, compiledModule.exports);
    return compiledModule.exports;
  }
  return load;
}
