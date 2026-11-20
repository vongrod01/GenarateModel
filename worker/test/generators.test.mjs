import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { collectAll } from "./helpers.mjs";

const golden = JSON.parse(readFileSync(new URL("./golden/generators.json", import.meta.url), "utf8"));
const current = collectAll();

test("generator golden file covers every generator entry", () => {
  assert.deepEqual(Object.keys(current).sort(), Object.keys(golden).sort());
});

for (const key of Object.keys(golden)) {
  test(`generator output unchanged: ${key}`, () => {
    assert.equal(current[key], golden[key]);
  });
}
