import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";

// readable-stream (pulled in by mssql -> tedious -> bl) does require("process/"),
// which the bundler cannot resolve as an external; point it at the built-in
// node:process (available under nodejs_compat).
export default defineConfig({
  plugins: [cloudflare()],
  resolve: { alias: [{ find: /^process\/$/, replacement: "node:process" }] },
});
