import { createRequire } from "node:module";
import { sample } from "./fixtures/sample.mjs";

const require = createRequire(import.meta.url);

// The shared generators (CommonJS), exactly as the Express app and the Worker use them.
export const be = require("../../my_modules/be_export_file.js");

const PROGRAMMING = ["nodejs", "python", "codeigniter4", ".net 4.5", "nextjs"];
const PROVIDERS = ["mysql", "mssql"];

// header() stamps the current time ("Generated : 20-November-2026 16:33:35 (Asia/Bangkok)"),
// so every comparison must blank it out first.
export const normalizeTs = (text) =>
  text.replace(/Generated : .*? \(Asia\/Bangkok\)/g, "Generated : <TS> (Asia/Bangkok)");

const run = (fn) => {
  try {
    return normalizeTs(JSON.stringify(fn()));
  } catch (e) {
    return `ERROR: ${e.message}`;
  }
};

// Every generator output we care about, keyed by "<function>|<args>", normalized to a string.
export function collectAll() {
  const out = {};
  for (const programming of PROGRAMMING) {
    for (const provider of PROVIDERS) {
      out[`dbService|${programming}|${provider}`] = run(() => be.dbService(programming, provider, "Demo"));
      out[`baseModelService|${programming}|${provider}`] = run(() => be.baseModelService(programming, provider, "Demo"));
    }
  }
  const perTable = {
    nodejsModelService: (d) => be.nodejsModelService(d),
    nextjsModelService: (d) => be.nextjsModelService(d),
    pythonModelService: (d) => be.pythonModelService(d),
    codeigniterModelService: (d) => be.codeigniterModelService(d),
    codeigniterController: (d) => be.codeigniterController(d),
    dotNet4_5Controller: (d) => be.dotNet4_5Controller(d, "Demo"),
    dotNet4_5_ModelService: (d) => be.dotNet4_5_ModelService(d, "Demo"),
    storeProcedure: (d) => be.storeProcedure(d),
    indexTable: (d) => be.indexTable(d),
  };
  for (const [name, fn] of Object.entries(perTable)) {
    for (const [shape, dd] of Object.entries(sample)) {
      out[`${name}|${shape}`] = run(() => fn(structuredClone(dd)));
    }
  }
  return out;
}
