// Smoke test for a running Worker (vite preview, or the live site).
//   node scripts/smoke.mjs <baseUrl> [--retry N] [--delay SECONDS]
// Exits 0 only when every check passes. --retry repeats the WHOLE run (a freshly deployed
// custom domain needs a little time for DNS and the certificate).
const args = process.argv.slice(2);
const base = (args.find((a) => /^https?:\/\//.test(a)) ?? "").replace(/\/$/, "");
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? Number(args[i + 1]) : fallback;
};
const attempts = Math.max(1, opt("--retry", 1));
const delayMs = opt("--delay", 5) * 1000;
if (!base) {
  console.error("usage: node scripts/smoke.mjs <baseUrl> [--retry N] [--delay SECONDS]");
  process.exit(2);
}

const get = (path, init = {}) => fetch(base + path, { redirect: "manual", signal: AbortSignal.timeout(30000), ...init });
const post = (path, body, raw) =>
  fetch(base + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw ?? JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });
const must = (cond, message) => {
  if (!cond) throw new Error(message);
};
const redirectsTo = (res, path) => {
  must(res.status >= 300 && res.status < 400, `expected a redirect, got ${res.status}`);
  const location = res.headers.get("location") ?? "";
  must(new URL(location, base + "/").pathname === path, `redirects to "${location}", expected ${path}`);
};

const checks = [
  ["GET /gencode is 200 and contains 'Heart Code'", async () => {
    const res = await get("/gencode");
    must(res.status === 200, `status ${res.status}`);
    must((await res.text()).includes("Heart Code"), "page does not contain 'Heart Code'");
  }],
  ["GET /gencode/ redirects to /gencode", async () => redirectsTo(await get("/gencode/"), "/gencode")],
  ["GET / redirects to /gencode", async () => redirectsTo(await get("/"), "/gencode")],
  ["GET /genmodel is 404 (old path is gone)", async () => must((await get("/genmodel")).status === 404, "not 404")],
  ...["css/glass.css", "jquery/dist/jquery.min.js", "js/helper.js", "img/icon-title.ico"].map((p) => [
    `GET /${p} is 200`,
    async () => {
      const res = await get("/" + p);
      must(res.status === 200, `status ${res.status}`);
    },
  ]),
  ["POST /databaseList (mysql, refused port) answers []", async () => {
    const res = await post("/databaseList", { provider: "mysql", host: "127.0.0.1", port: 1, user: "x", password: "" });
    must(res.status === 200, `status ${res.status}`);
    must(JSON.stringify(await res.json()) === "[]", "not []");
  }],
  ["POST /databaseList (mssql, unresolvable host) answers []", async () => {
    const res = await post("/databaseList", { provider: "mssql", host: "invalid.invalid", user: "sa", password: "x" });
    must(res.status === 200, `status ${res.status}`);
    must(JSON.stringify(await res.json()) === "[]", "not []");
  }],
  ["POST /contentBase generates code (loads the generators in the bundle)", async () => {
    const res = await post("/contentBase", { programming: "nodejs", provider: "mysql", nameSpace: "Demo" });
    must(res.status === 200, `status ${res.status}`);
    const body = await res.json();
    must(body.export === true && typeof body.content === "string" && body.content.length > 100, "no generated content");
    must(/Asia\/Bangkok/.test(body.content), "header stamp missing");
  }],
  ["POST with malformed JSON answers 400", async () => {
    const res = await post("/databaseList", undefined, "{not json");
    must(res.status === 400, `status ${res.status}`);
  }],
];

async function runOnce() {
  let failed = 0;
  for (const [name, fn] of checks) {
    try {
      await fn();
      console.log(`PASS  ${name}`);
    } catch (error) {
      failed++;
      console.log(`FAIL  ${name}: ${error.message}`);
    }
  }
  return failed;
}

for (let attempt = 1; attempt <= attempts; attempt++) {
  const failed = await runOnce();
  if (failed === 0) {
    console.log(`\nsmoke OK (${base})`);
    process.exit(0);
  }
  if (attempt < attempts) {
    console.log(`\n${failed} check(s) failed, retry ${attempt}/${attempts - 1} in ${delayMs / 1000}s...\n`);
    await new Promise((r) => setTimeout(r, delayMs));
  } else {
    console.log(`\nsmoke FAILED (${base}): ${failed} check(s)`);
    process.exit(1);
  }
}
