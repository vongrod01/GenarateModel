import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { databaseListSql, tableListSql, tableDescriptionSql } from "../src/queries.js";
import { be, normalizeTs } from "./helpers.mjs";
import { sample, mysqlMultiResult } from "./fixtures/sample.mjs";

// A recording fake Db. `mysql` / `mssql` decide what a query returns.
function makeDb({ mysql = () => [], mssql = () => [] } = {}) {
  const calls = { mysql: [], mssql: [] };
  return {
    calls,
    queryMysql: async (conn, sql) => {
      calls.mysql.push({ conn, sql });
      return mysql(conn, sql);
    },
    queryMssql: async (conn, sql) => {
      calls.mssql.push({ conn, sql });
      return mssql(conn, sql);
    },
  };
}

const post = (app, path, body, raw) =>
  app.request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw ?? JSON.stringify(body),
  });
const json = async (res) => res.json();
const norm = (value) => normalizeTs(JSON.stringify(value));

const conn = { host: "db.example", port: "", user: "u", password: "p" };

test("GET / redirects to /gencode", async () => {
  const res = await createApp(makeDb()).request("/");
  assert.equal(res.status, 302);
  assert.equal(res.headers.get("location"), "/gencode");
});

test("CORS: preflight allowed from any origin (like Express cors())", async () => {
  const res = await createApp(makeDb()).request("/databaseList", {
    method: "OPTIONS",
    headers: { Origin: "http://example.com", "Access-Control-Request-Method": "POST" },
  });
  assert.ok(res.status === 204 || res.status === 200);
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
});

test("/databaseList mysql runs SHOW DATABASES and returns the rows", async () => {
  const db = makeDb({ mysql: () => [{ Database: "a" }, { Database: "b" }] });
  const res = await post(createApp(db), "/databaseList", { provider: "mysql", ...conn });
  assert.deepEqual(await json(res), [{ Database: "a" }, { Database: "b" }]);
  assert.equal(db.calls.mysql.length, 1);
  assert.equal(db.calls.mysql[0].sql, databaseListSql("mysql"));
  const { database, ...rest } = db.calls.mysql[0].conn;
  assert.equal(database, undefined, "databaseList connects without a default database");
  assert.deepEqual(rest, { host: "db.example", port: "", user: "u", password: "p" });
});

test("/databaseList mssql goes to queryMssql with host/user/password", async () => {
  const db = makeDb({ mssql: () => [{ Database: "master" }] });
  const res = await post(createApp(db), "/databaseList", { provider: "mssql", ...conn });
  assert.deepEqual(await json(res), [{ Database: "master" }]);
  assert.equal(db.calls.mssql[0].sql, databaseListSql("mssql"));
  assert.deepEqual(db.calls.mssql[0].conn, { host: "db.example", user: "u", password: "p" });
  assert.equal(db.calls.mysql.length, 0);
});

test("unsupported provider returns [] without touching a database", async () => {
  const db = makeDb();
  for (const path of ["/databaseList", "/tableList", "/tableDescription"]) {
    const res = await post(createApp(db), path, { provider: "oracle", ...conn, databaseName: "d", tbName: "t" });
    assert.equal(res.status, 200);
    assert.deepEqual(await json(res), []);
  }
  assert.equal(db.calls.mysql.length + db.calls.mssql.length, 0);
});

test("/tableList sends the database name (mysql also selects it as the default database)", async () => {
  const db = makeDb({ mysql: () => [{ TableName: "family" }], mssql: () => [{ TableName: "t" }] });
  const app = createApp(db);
  await post(app, "/tableList", { provider: "mysql", ...conn, databaseName: "Rfam" });
  await post(app, "/tableList", { provider: "mssql", ...conn, databaseName: "Rfam" });
  assert.equal(db.calls.mysql[0].sql, tableListSql("mysql", "Rfam"));
  assert.equal(db.calls.mysql[0].conn.database, "Rfam");
  assert.equal(db.calls.mssql[0].sql, tableListSql("mssql", "Rfam"));
});

test("/tableDescription mysql returns the raw [packet, rows] result (the frontend reads index 1)", async () => {
  const db = makeDb({ mysql: () => mysqlMultiResult });
  const res = await post(createApp(db), "/tableDescription", { provider: "mysql", ...conn, databaseName: "Rfam", tbName: "family" });
  assert.deepEqual(await json(res), mysqlMultiResult);
  assert.equal(db.calls.mysql[0].sql, tableDescriptionSql("mysql", "Rfam", "family"));
  assert.equal(db.calls.mysql[0].conn.database, "Rfam");
});

test("/tableDescription mssql returns the rows", async () => {
  const db = makeDb({ mssql: () => sample.mssql.dataSet });
  const res = await post(createApp(db), "/tableDescription", { provider: "mssql", ...conn, databaseName: "Rfam", tbName: "family" });
  assert.deepEqual(await json(res), sample.mssql.dataSet);
  assert.equal(db.calls.mssql[0].sql, tableDescriptionSql("mssql", "Rfam", "family"));
});

test("concurrent requests with different credentials never share state", async () => {
  const db = makeDb({
    mysql: async (c) => {
      await new Promise((r) => setTimeout(r, c.user === "slow" ? 40 : 5));
      return [{ owner: c.user }];
    },
  });
  const app = createApp(db);
  const [a, b] = await Promise.all([
    post(app, "/databaseList", { provider: "mysql", host: "h1", user: "slow", password: "1" }),
    post(app, "/databaseList", { provider: "mysql", host: "h2", user: "fast", password: "2" }),
  ]);
  assert.deepEqual(await json(a), [{ owner: "slow" }]);
  assert.deepEqual(await json(b), [{ owner: "fast" }]);
  assert.deepEqual(db.calls.mysql.map((c) => `${c.conn.host}:${c.conn.user}`).sort(), ["h1:slow", "h2:fast"]);
});

// ---- content (generator) routes ----------------------------------------------------------
const descBody = (provider, extra = {}) => ({ provider, ...conn, databaseName: "demo", tbName: "tb_order", nameSpace: "Demo", ...extra });
const dbWithSample = () =>
  makeDb({ mysql: () => mysqlMultiResult, mssql: () => sample.mssql.dataSet });
const ddOf = (provider, extra = {}) => ({
  dataSet: sample[provider].dataSet, // generators get the ROWS, also for MySQL (see ledger ruling)
  tbName: "tb_order",
  databaseName: "demo",
  ...extra,
});

for (const provider of ["mysql", "mssql"]) {
  test(`/contentModelService (${provider}) matches the generators for every language`, async () => {
    const app = createApp(dbWithSample());
    const expected = {
      nodejs: be.nodejsModelService(ddOf(provider)),
      nextjs: be.nextjsModelService(ddOf(provider)),
      python: be.pythonModelService(ddOf(provider)),
      codeigniter4: be.codeigniterModelService(ddOf(provider)),
      ".net 4.5": be.dotNet4_5_ModelService(ddOf(provider), "Demo"),
      cobol: { export: false },
    };
    for (const [programming, want] of Object.entries(expected)) {
      const res = await post(app, "/contentModelService", descBody(provider, { programming }));
      assert.equal(norm(await json(res)), norm(want), `programming ${programming}`);
    }
  });

  test(`generated model for ${provider} contains the real field names (no "undefined")`, async () => {
    const res = await post(createApp(dbWithSample()), "/contentModelService", descBody(provider, { programming: "nodejs" }));
    const { content } = await json(res);
    assert.match(content, /get created_at\(\)/);
    assert.doesNotMatch(content, /undefined/);
  });

  test(`/contentStoreProcedure and /contentIndexTable (${provider}) match the generators`, async () => {
    const app = createApp(dbWithSample());
    const sp = await post(app, "/contentStoreProcedure", descBody(provider));
    assert.equal(norm(await json(sp)), norm(be.storeProcedure(ddOf(provider, { provider }))));
    const ix = await post(app, "/contentIndexTable", descBody(provider));
    assert.equal(norm(await json(ix)), norm(be.indexTable(ddOf(provider, { provider }))));
  });

  test(`/contentDBService and /contentBase (${provider}) need no database`, async () => {
    const db = makeDb();
    const app = createApp(db);
    for (const programming of ["nodejs", "python", "codeigniter4", ".net 4.5", "nextjs"]) {
      const a = await post(app, "/contentDBService", { programming, provider, nameSpace: "Demo" });
      assert.equal(norm(await json(a)), norm(be.dbService(programming, provider, "Demo")));
      const b = await post(app, "/contentBase", { programming, provider, nameSpace: "Demo" });
      assert.equal(norm(await json(b)), norm(be.baseModelService(programming, provider, "Demo")));
    }
    assert.equal(db.calls.mysql.length + db.calls.mssql.length, 0);
  });
}

test("/contentController: codeigniter4 and .net 4.5 generate; nodejs and python answer {export:false} (Express hangs)", async () => {
  const app = createApp(dbWithSample());
  const ci = await post(app, "/contentController", descBody("mssql", { programming: "codeigniter4" }));
  assert.equal(norm(await json(ci)), norm(be.codeigniterController(ddOf("mssql"))));
  const net = await post(app, "/contentController", descBody("mssql", { programming: ".net 4.5" }));
  assert.equal(norm(await json(net)), norm(be.dotNet4_5Controller(ddOf("mssql"), "Demo")));
  for (const programming of ["nodejs", "python", "cobol"]) {
    const res = await post(app, "/contentController", descBody("mssql", { programming }));
    assert.equal(res.status, 200);
    assert.deepEqual(await json(res), { export: false });
  }
});

// ---- bad input ----------------------------------------------------------------------------
test("empty or field-less bodies answer [] without a database call or a crash", async () => {
  const db = makeDb();
  const app = createApp(db);
  for (const path of ["/databaseList", "/tableList", "/tableDescription"]) {
    const empty = await post(app, path, undefined, "");
    assert.equal(empty.status, 200);
    assert.deepEqual(await json(empty), []);
    const noFields = await post(app, path, {});
    assert.deepEqual(await json(noFields), []);
  }
  assert.equal(db.calls.mysql.length + db.calls.mssql.length, 0);
});

test("malformed JSON answers 400 with a JSON error (not a 500, not a hang)", async () => {
  const res = await post(createApp(makeDb()), "/databaseList", undefined, "{not json");
  assert.equal(res.status, 400);
  assert.match(res.headers.get("content-type"), /json/);
  assert.ok((await json(res)).error);
});

test("a database that fails (the DB layer returns []) gives []", async () => {
  const res = await post(createApp(makeDb()), "/tableList", { provider: "mysql", ...conn, databaseName: "x" });
  assert.deepEqual(await json(res), []);
});
