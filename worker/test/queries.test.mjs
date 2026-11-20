import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { databaseListSql, tableListSql, tableDescriptionSql } from "../src/queries.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const routerSource = readFileSync(join(root, "routers", "connectDB_router.js"), "utf8");
const squash = (s) => s.replace(/\s+/g, " ").trim();

test("databaseListSql", () => {
  assert.equal(databaseListSql("mysql"), "SHOW DATABASES");
  assert.match(databaseListSql("mssql"), /master\.dbo\.sysdatabases/);
  assert.equal(databaseListSql("oracle"), null);
});

test("tableListSql interpolates the database name", () => {
  assert.match(tableListSql("mysql", "Rfam"), /table_schema='Rfam'/);
  assert.match(tableListSql("mssql", "Rfam"), /Rfam\.INFORMATION_SCHEMA\.COLUMNS/);
  assert.equal(tableListSql("oracle", "Rfam"), null);
});

test("tableDescriptionSql interpolates database and table", () => {
  const my = tableDescriptionSql("mysql", "Rfam", "family");
  assert.match(squash(my), /^USE information_schema; SELECT/);
  assert.match(my, /COLUMNS\.TABLE_SCHEMA = 'Rfam'/);
  assert.match(my, /COLUMNS\.TABLE_NAME = 'family'/);
  const ms = tableDescriptionSql("mssql", "Rfam", "family");
  assert.match(ms, /\[Rfam\]\.INFORMATION_SCHEMA\.COLUMNS/);
  assert.match(ms, /c\.TABLE_NAME = 'family'/);
  assert.equal(tableDescriptionSql("oracle", "Rfam", "family"), null);
});

// Guard against drift: the SQL must stay identical to the Express router's (whitespace aside).
test("SQL text mirrors routers/connectDB_router.js", () => {
  const templates = [...routerSource.matchAll(/let sqlStr = `([\s\S]*?)`/g)].map((m) => m[1]);
  assert.equal(templates.length, 2, "expected the mysql and mssql TableDescription templates");
  const fill = (t) => squash(t.replaceAll("${databaseName}", "DB").replaceAll("${tbName}", "TB"));
  assert.equal(squash(tableDescriptionSql("mysql", "DB", "TB")), fill(templates[0]));
  assert.equal(squash(tableDescriptionSql("mssql", "DB", "TB")), fill(templates[1]));
  assert.ok(routerSource.includes("SHOW DATABASES"));
  assert.ok(routerSource.includes("SELECT name as [Database] FROM master.dbo.sysdatabases"));
  assert.ok(routerSource.includes("SELECT table_name AS TableName FROM information_schema.tables WHERE table_schema='${databaseName}'"));
  assert.ok(routerSource.includes("select distinct TABLE_NAME as TableName from ${databaseName}.INFORMATION_SCHEMA.COLUMNS"));
});
