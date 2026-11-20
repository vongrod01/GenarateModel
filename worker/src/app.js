// The Worker's HTTP API. Mirrors routers/connectDB_router.js and routers/exportFile_router.js
// (the Express app); the page itself (/gencode) is a static asset served before this code runs.
// `db` is injected ({ queryMysql, queryMssql }) so the routes are testable in plain Node.
import { Hono } from "hono";
import { cors } from "hono/cors";
import be from "../../my_modules/be_export_file.js";
import { databaseListSql, tableListSql, tableDescriptionSql } from "./queries.js";

// Empty body -> {}; malformed JSON -> null (the caller answers 400).
async function readBody(c) {
  const text = await c.req.text();
  if (!text.trim()) return {};
  try {
    const value = JSON.parse(text);
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return null;
  }
}

// "USE db; SELECT ..." on MySQL comes back as [packet, rows]; generators need just the rows.
// (Express passes the raw pair, which makes its MySQL output unusable: this is a deliberate fix.)
const rowsOf = (result) =>
  Array.isArray(result) && result.length === 2 && Array.isArray(result[1]) ? result[1] : result;

export function createApp(db) {
  const app = new Hono();
  app.use("*", cors());

  // handler(body, c) -> any JSON-able value
  const jsonRoute = (path, handler) =>
    app.post(path, async (c) => {
      const body = await readBody(c);
      if (body === null) return c.json({ error: "request body is not valid JSON" }, 400);
      return c.json(await handler(body, c));
    });

  const mysqlConn = (b, database) => ({ host: b.host, port: b.port, user: b.user, password: b.password, database });
  const mssqlConn = (b) => ({ host: b.host, user: b.user, password: b.password });

  async function run(provider, b, sql, database) {
    if (sql === null) return [];
    if (provider === "mysql") return db.queryMysql(mysqlConn(b, database), sql);
    if (provider === "mssql") return db.queryMssql(mssqlConn(b), sql);
    return [];
  }

  const tableDescription = (b) => run(b.provider, b, tableDescriptionSql(b.provider, b.databaseName, b.tbName), b.databaseName);

  app.get("/", (c) => c.redirect("/gencode", 302));

  jsonRoute("/databaseList", (b) => run(b.provider, b, databaseListSql(b.provider)));
  jsonRoute("/tableList", (b) => run(b.provider, b, tableListSql(b.provider, b.databaseName), b.databaseName));
  jsonRoute("/tableDescription", (b) => tableDescription(b));

  jsonRoute("/contentDBService", (b) => be.dbService(b.programming, b.provider, b.nameSpace));
  jsonRoute("/contentBase", (b) => be.baseModelService(b.programming, b.provider, b.nameSpace));

  const describe = async (b, extra = {}) => ({
    dataSet: rowsOf(await tableDescription(b)),
    tbName: b.tbName,
    databaseName: b.databaseName,
    ...extra,
  });

  jsonRoute("/contentModelService", async (b) => {
    const dd = await describe(b);
    switch (b.programming) {
      case "nodejs": return be.nodejsModelService(dd);
      case "nextjs": return be.nextjsModelService(dd);
      case "python": return be.pythonModelService(dd);
      case "codeigniter4": return be.codeigniterModelService(dd);
      case ".net 4.5": return be.dotNet4_5_ModelService(dd, b.nameSpace);
      default: return { export: false };
    }
  });

  jsonRoute("/contentController", async (b) => {
    // Only these two languages have a controller generator. Express never answers for
    // nodejs / python (the request hangs); here every other value answers {export:false}.
    if (b.programming !== "codeigniter4" && b.programming !== ".net 4.5") return { export: false };
    const dd = await describe(b);
    return b.programming === "codeigniter4" ? be.codeigniterController(dd) : be.dotNet4_5Controller(dd, b.nameSpace);
  });

  jsonRoute("/contentStoreProcedure", async (b) => be.storeProcedure(await describe(b, { provider: b.provider })));
  jsonRoute("/contentIndexTable", async (b) => be.indexTable(await describe(b, { provider: b.provider })));

  app.onError((err, c) => {
    console.log("unhandled error:", err?.message);
    return c.json({ error: "internal error" }, 500);
  });

  return app;
}
