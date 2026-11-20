import { createApp } from "./app.js";
import { queryMysql, queryMssql } from "./db.js";

// Hono apps expose fetch(), which is all a Worker needs. Static files (/gencode, css, js, ...)
// are answered by Workers Static Assets before this runs.
export default createApp({ queryMysql, queryMssql });
