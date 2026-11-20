// Per-request database access for the Worker. One connection per call, always closed in
// `finally`; nothing is shared between requests (a Worker isolate serves many users).
// Every function resolves to [] on any failure, like the Express app.
import mysql from "mysql2/promise";
import mssql from "mssql";

export const DEFAULT_CONNECT_TIMEOUT_MS = 8000;
export const DEFAULT_QUERY_TIMEOUT_MS = 20000;

// Express: ['undefined', 0, ''] -> 3306. Also treat a missing port as 3306 and turn
// numeric strings into numbers (the form field arrives as a string).
export function normalizeMysqlPort(port) {
  if (port === undefined || port === null || ["undefined", 0, ""].includes(port)) return 3306;
  if (typeof port === "string" && /^\d+$/.test(port)) return Number(port);
  return port;
}

// conn: { host, port, user, password, database? }
// Resolves to the rows, or for a multi-statement query ("USE x; SELECT ...") to [packet, rows].
export async function queryMysql(conn, sql, opts = {}) {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: conn.host,
      port: normalizeMysqlPort(conn.port),
      user: conn.user,
      password: conn.password,
      database: conn.database,
      multipleStatements: true,
      disableEval: true, // Workers forbid eval / new Function
      connectTimeout: opts.connectTimeoutMs ?? DEFAULT_CONNECT_TIMEOUT_MS,
    });
    const [results] = await connection.query({ sql, timeout: opts.queryTimeoutMs ?? DEFAULT_QUERY_TIMEOUT_MS });
    return results;
  } catch (error) {
    console.log("mysql query failed:", error?.code ?? error?.message);
    return [];
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch {
        connection.destroy();
      }
    }
  }
}

// conn: { host, user, password }. Port is 1433 (as in the Express app) unless opts.port is set.
export async function queryMssql(conn, sql, opts = {}) {
  const timeout = opts.timeoutMs ?? DEFAULT_CONNECT_TIMEOUT_MS;
  let pool;
  try {
    pool = new mssql.ConnectionPool({
      user: conn.user,
      password: conn.password,
      server: conn.host,
      port: opts.port ?? 1433,
      options: { encrypt: false }, // as in the Express app
      connectionTimeout: timeout,
      requestTimeout: opts.queryTimeoutMs ?? DEFAULT_QUERY_TIMEOUT_MS,
    });
    await pool.connect();
    const result = await pool.request().query(sql);
    return result.recordset ?? [];
  } catch (error) {
    console.log("mssql query failed:", error?.code ?? error?.message);
    return [];
  } finally {
    if (pool) {
      try {
        await pool.close();
      } catch {
        // already closed
      }
    }
  }
}
