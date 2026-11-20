// Builds worker/public/ (the Worker's static assets):
//   gencode.html          views/index.ejs rendered once with SystemConfig.json "description"
//                         (Workers forbid new Function, so EJS cannot run at request time)
//   css/ img/ js/ ...     copied from the repo's public/
//   jquery/dist/...       copied from node_modules (the Express app serves it from node_modules)
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ejs from "ejs";

const worker = join(dirname(fileURLToPath(import.meta.url)), "..");
const root = join(worker, "..");
const out = join(worker, "public");

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

cpSync(join(root, "public"), out, { recursive: true });

mkdirSync(join(out, "jquery", "dist"), { recursive: true });
cpSync(join(worker, "node_modules", "jquery", "dist", "jquery.min.js"), join(out, "jquery", "dist", "jquery.min.js"));

const config = JSON.parse(readFileSync(join(root, "SystemConfig.json"), "utf8"));
const html = await ejs.renderFile(join(root, "views", "index.ejs"), config.description);
writeFileSync(join(out, "gencode.html"), html);

console.log(`static assets built -> ${out}`);
