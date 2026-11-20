// Compares the Worker with the Express app on the same requests, against the public RFAM MySQL.
//   node scripts/parity.mjs <expressBase> <workerBase>
// e.g. node scripts/parity.mjs http://localhost:5506 http://localhost:4173
//
// exact : the two answers must be identical (after blanking time stamps and OK packets)
// sane  : the Worker answer must be real generated code for the table. Express feeds MySQL's
//         [packet, rows] pair to the generators (output full of "undefined", and for ".net 4.5"
//         an unhandled error that CRASHES the Express process), the Worker feeds the rows, so
//         equality is not expected and Express is deliberately NOT asked these questions.
// worker: Express never answers (it hangs) or crashes; only the Worker is asked and must answer the
//         expected "not supported" JSON
const [expressBase, workerBase] = process.argv.slice(2).map((u) => u?.replace(/\/$/, ""));
if (!expressBase || !workerBase) {
  console.error("usage: node scripts/parity.mjs <expressBase> <workerBase>");
  process.exit(2);
}

const rfam = {
  provider: "mysql",
  host: "mysql-rfam-public.ebi.ac.uk",
  port: 4497,
  user: "rfamro",
  password: "",
  databaseName: "Rfam",
  tbName: "family",
  nameSpace: "Demo",
};
const LANGS = ["nodejs", "nextjs", "python", "codeigniter4", ".net 4.5"];

const normalize = (value) =>
  JSON.stringify(value, (_k, v) =>
    v && typeof v === "object" && "fieldCount" in v && "affectedRows" in v ? "OK_PACKET" : v,
  ).replace(/Generated : .*? \(Asia\/Bangkok\)/g, "Generated : <TS> (Asia/Bangkok)");

async function ask(base, path, body, timeoutMs = 60000) {
  const res = await fetch(base + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  return { status: res.status, body: await res.json() };
}

const cases = [];
const exact = (name, path, body) => cases.push({ kind: "exact", name, path, body });
const sane = (name, path, body) => cases.push({ kind: "sane", name, path, body });

exact("databaseList", "/databaseList", rfam);
exact("tableList", "/tableList", rfam);
exact("tableDescription", "/tableDescription", rfam);
for (const programming of LANGS) {
  for (const provider of ["mysql", "mssql"]) {
    exact(`contentDBService ${programming} ${provider}`, "/contentDBService", { ...rfam, programming, provider });
    exact(`contentBase ${programming} ${provider}`, "/contentBase", { ...rfam, programming, provider });
  }
  sane(`contentModelService ${programming}`, "/contentModelService", { ...rfam, programming });
}
for (const programming of ["codeigniter4", ".net 4.5"]) sane(`contentController ${programming}`, "/contentController", { ...rfam, programming });
// the generators answer {export:false} for MySQL stored procedures / indexes (unsupported), without
// reading the table rows, so Express and the Worker must agree exactly
exact("contentStoreProcedure (mysql: not supported)", "/contentStoreProcedure", rfam);
cases.push({ kind: "worker", name: "contentController nodejs", path: "/contentController", body: { ...rfam, programming: "nodejs" }, note: "(Express hangs here)" });
cases.push({ kind: "worker", name: "contentController python", path: "/contentController", body: { ...rfam, programming: "python" }, note: "(Express hangs here)" });
// Express crashes (unhandled error) on indexTable with MySQL data; the Worker must answer "not supported"
cases.push({ kind: "worker", name: "contentIndexTable (mysql: not supported)", path: "/contentIndexTable", body: rfam, expect: '{"export":false,"content":"","fileName":""}', note: "(Express crashes here)" });

let failed = 0;
const report = (ok, name, note = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${note ? "  " + note : ""}`);
};

// the static page: Express renders EJS per request, the Worker serves it pre-rendered
{
  const [a, b] = await Promise.all([fetch(expressBase + "/gencode"), fetch(workerBase + "/gencode")]);
  report(a.status === 200 && b.status === 200 && (await a.text()) === (await b.text()), "GET /gencode page is byte-identical");
}

for (const c of cases) {
  try {
    if (c.kind === "worker") {
      const w = await ask(workerBase, c.path, c.body);
      report(w.status === 200 && normalize(w.body) === (c.expect ?? '{"export":false}'), c.name, c.note);
      continue;
    }
    if (c.kind === "exact") {
      const [e, w] = await Promise.all([ask(expressBase, c.path, c.body), ask(workerBase, c.path, c.body)]);
      report(e.status === w.status && normalize(e.body) === normalize(w.body), c.name);
    } else {
      const w = await ask(workerBase, c.path, c.body);
      const text = normalize(w.body);
      const real = w.status === 200 && !text.includes('"export":false') && !/undefined/.test(text) && text.includes("rfam_acc");
      report(real, c.name, "(Worker only)");
    }
  } catch (error) {
    report(false, c.name, `error: ${error.message}`);
  }
}

console.log(failed === 0 ? "\nparity OK" : `\nparity FAILED: ${failed} case(s)`);
process.exit(failed === 0 ? 0 : 1);
