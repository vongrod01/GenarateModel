import { test, before } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ejs from "ejs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", ".."); // repo root
const worker = join(root, "worker");
const pub = join(worker, "public");

let html;
before(() => {
  execFileSync(process.execPath, [join(worker, "scripts", "build-static.mjs")], { cwd: worker, stdio: "pipe" });
  html = readFileSync(join(pub, "gencode.html"), "utf8");
});

test("gencode.html equals the EJS template rendered with SystemConfig.description", async () => {
  const config = JSON.parse(readFileSync(join(root, "SystemConfig.json"), "utf8"));
  const expected = await ejs.renderFile(join(root, "views", "index.ejs"), config.description);
  assert.equal(html, expected);
});

test("gencode.html has the title and no unrendered EJS tags", () => {
  assert.match(html, /Heart Code/);
  assert.doesNotMatch(html, /<%/);
});

test("every local src/href in gencode.html exists under public/", () => {
  const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
  const local = refs.filter((r) => !/^(https?:)?\/\//.test(r) && !/^(data:|mailto:|#)/.test(r));
  assert.ok(local.length >= 5, `expected several local references, got ${local.length}`);
  for (const ref of local) {
    const file = join(pub, ref.replace(/^\//, ""));
    assert.ok(existsSync(file), `missing asset for "${ref}"`);
  }
});

test("jquery 3.x is copied to jquery/dist/jquery.min.js", () => {
  const file = join(pub, "jquery", "dist", "jquery.min.js");
  assert.ok(existsSync(file));
  assert.match(readFileSync(file, "utf8").slice(0, 120), /jQuery v3\./);
});

test("the root public/ folder is copied (css, js, img)", () => {
  for (const f of ["css/glass.css", "js/helper.js", "js/ui.js", "img/icon-title.ico"]) {
    assert.ok(existsSync(join(pub, f)), `missing ${f}`);
  }
});
