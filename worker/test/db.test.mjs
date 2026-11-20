import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeMysqlPort, queryMysql, queryMssql } from "../src/db.js";

test("normalizeMysqlPort defaults empty-ish values to 3306", () => {
  for (const empty of ["", 0, "undefined", undefined, null]) {
    assert.equal(normalizeMysqlPort(empty), 3306, `input ${JSON.stringify(empty)}`);
  }
});

test("normalizeMysqlPort keeps numbers and turns numeric strings into numbers", () => {
  assert.equal(normalizeMysqlPort(4497), 4497);
  assert.equal(normalizeMysqlPort("4497"), 4497);
  assert.equal(normalizeMysqlPort("abc"), "abc"); // invalid stays invalid: the connect fails -> []
});

const timed = async (fn) => {
  const t0 = Date.now();
  const result = await fn();
  return { result, ms: Date.now() - t0 };
};

test("queryMysql returns [] quickly when the host refuses the connection", async () => {
  const { result, ms } = await timed(() =>
    queryMysql({ host: "127.0.0.1", port: 1, user: "x", password: "" }, "SELECT 1", { connectTimeoutMs: 2000 }),
  );
  assert.deepEqual(result, []);
  assert.ok(ms < 3500, `took ${ms} ms`);
});

test("queryMssql returns [] quickly when the host refuses the connection (never port 1433)", async () => {
  const { result, ms } = await timed(() =>
    queryMssql({ host: "127.0.0.1", user: "sa", password: "x" }, "select 1", { port: 1, timeoutMs: 2000 }),
  );
  assert.deepEqual(result, []);
  assert.ok(ms < 3500, `took ${ms} ms`);
});

// Network integration test against the public RFAM database. Run with: RFAM=1 npm test
test("queryMysql lists databases on public RFAM", { skip: !process.env.RFAM }, async () => {
  const conn = { host: "mysql-rfam-public.ebi.ac.uk", port: 4497, user: "rfamro", password: "" };
  const dbs = await queryMysql(conn, "SHOW DATABASES");
  assert.ok(Array.isArray(dbs) && dbs.length > 0);
  const multi = await queryMysql({ ...conn, database: "Rfam" }, "USE information_schema; SELECT COLUMN_NAME AS FieldName FROM COLUMNS WHERE TABLE_SCHEMA='Rfam' AND TABLE_NAME='family' LIMIT 3");
  assert.equal(multi.length, 2, "multi-statement result is [packet, rows]");
  assert.ok(Array.isArray(multi[1]) && multi[1].length === 3);
});
