import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const headerPath = fileURLToPath(new URL("../../my_modules/generators/header.js", import.meta.url));
const require = createRequire(import.meta.url);

test("header() stamps Asia/Bangkok time (UTC+7) for the given instant", () => {
  const { header } = require(headerPath);
  const text = header(new Date("2026-11-20T10:00:00Z"));
  assert.match(text, /Generated : 20-November-2026 17:0:0 \(Asia\/Bangkok\)/);
});

test("header() crosses midnight correctly in Bangkok time", () => {
  const { header } = require(headerPath);
  const text = header(new Date("2026-12-31T18:30:05Z"));
  assert.match(text, /Generated : 1-January-2027 1:30:5 \(Asia\/Bangkok\)/);
});

// The Worker bundle is strict-mode ESM: an undeclared assignment (dformat = ...) throws there.
test("header.js runs in strict mode without relying on fs or implicit globals", () => {
  // earlier tests may have leaked a global `dformat` (the old sloppy-mode assignment): clear it
  delete globalThis.dformat;
  const src = readFileSync(headerPath, "utf8");
  const mod = { exports: {} };
  const load = new Function("require", "module", "exports", "__dirname", `"use strict";\n${src}`);
  load(createRequire(headerPath), mod, mod.exports, dirname(headerPath));
  assert.doesNotThrow(() => mod.exports.header());
  assert.doesNotMatch(src, /require\(["']fs["']\)/);
});
