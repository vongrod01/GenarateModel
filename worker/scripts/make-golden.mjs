// Records the CURRENT output of every shared generator into test/golden/generators.json.
// Run it before changing anything under my_modules/generators; test/generators.test.mjs
// then proves later changes did not alter what the generators produce.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { collectAll } from "../test/helpers.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const file = join(here, "..", "test", "golden", "generators.json");
mkdirSync(dirname(file), { recursive: true });
const all = collectAll();
writeFileSync(file, JSON.stringify(all, null, 1) + "\n");
const errors = Object.entries(all).filter(([, v]) => v.startsWith("ERROR:")).length;
console.log(`wrote ${Object.keys(all).length} entries (${errors} pinned as ERROR) -> ${file}`);
