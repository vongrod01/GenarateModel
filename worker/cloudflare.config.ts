import { defineConfig } from "cf/config";

export default defineConfig({
  worker: {
    name: "codegenerator",
    entrypoint: "./src/index.js",
    compatibilityDate: "2026-11-13",
    // mysql2 / mssql need node:net, node:tls, node:process
    compatibilityFlags: ["nodejs_compat"],
    // the page is served from static assets at /gencode (no trailing slash,
    // because the HTML uses relative asset URLs such as css/glass.css)
    assets: { htmlHandling: "drop-trailing-slash" },
    domains: ["codegenerator.vongrod.com"],
    workersDev: false,
    observability: { enabled: true },
  },
});
