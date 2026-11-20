# Cloudflare Worker Deploy (codegenerator.vongrod.com) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve the Heart Code generator from a Cloudflare Worker at `https://codegenerator.vongrod.com/gencode`, deployed automatically by GitHub Actions on push to `main`.

**Architecture:** A separate `worker/` project (Hono + Workers Static Assets) reuses `my_modules/generators` unchanged. The Express/Docker app stays as is. DB access is per request (mysql2 / mssql), injected into the Hono app so routes are testable in plain Node. The page HTML is rendered once at build time.

**Tech Stack:** Node >=22.18, Hono, mysql2, mssql, ejs (build time only), Vite + `@cloudflare/vite-plugin@rc` (2.0.0-rc.2), `cf` CLI (beta), `node --test`, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-20-cloudflare-worker-deploy-design.md`

## Global Constraints

- Page path is `/gencode` (already merged to `main`); `/genmodel` must stay 404. `GET /` redirects to `/gencode`.
- `cf` needs Node >=22.18. This machine has 22.12.0: for local `cf`/`vite` runs put the portable Node first on PATH (`npm i node@22` in an empty scratchpad dir; verify with `node.exe --version`). Never change the installed Node.
- Plugin must be `@cloudflare/vite-plugin@rc` (`latest` 1.70 ignores `cloudflare.config.ts`). Pin exact versions in `worker/package-lock.json`.
- `cf dev` cannot load `mssql` (`require('process/')` in readable-stream). Test through `vite build` + `vite preview`, never `cf dev`.
- Config: worker name `codegenerator`, `domains: ["codegenerator.vongrod.com"]`, `compatibilityFlags: ["nodejs_compat"]`, workers.dev disabled, observability enabled, assets `htmlHandling: "drop-trailing-slash"`.
- mysql2 options: `disableEval: true`, `multipleStatements: true`, `connectTimeout` set. mssql: `encrypt:false`, port 1433 only (parity), **one connection/pool per request, closed in `finally`, never `mssql.connect()` global**.
- On any DB error return `[]` (same as Express). Unsupported provider returns `[]`.
- Workers cannot reach localhost/private IPs/port 25. No auth, no rate limit (accepted by the user).
- Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` already exist as GitHub repo secrets. Only the final deploy step may receive them. Never commit a token.
- Workflow YAML: Thai explanatory comments in the style of `ci.yml`/`cd.yml`. Existing `ci.yml`/`cd.yml`/Dockerfile behavior untouched.
- Git: branch from `origin/dev`, flow feature -> `dev` -> `main` with merge commits. Commit messages end with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`; PR bodies end with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
- Tests never connect to port 1433 or to a real SQL Server (a local one exists on this machine).

## Review Focus

1. MySQL `port` arrives as `""`, `0`, `"undefined"`, a number or a numeric string: expected default 3306 / pass-through. Pinned in Task 4.
2. Missing, empty or malformed JSON body: empty or missing fields give `[]`, malformed JSON gives HTTP 400 JSON error, never a 500 or a hang. Pinned in Task 5.
3. DB host unreachable or refusing: `[]` within the timeout, not a hang until the platform kills it. Pinned in Task 4.
4. Unsupported `provider` or `programming` (including `contentController` with `nodejs`/`python`, which hangs in Express): `[]` / `{export:false}`. Pinned in Task 5.
5. `/gencode/` with trailing slash, `/genmodel`, and relative assets (`css/glass.css`, `jquery/dist/jquery.min.js`): correct status and no 404 from the page. Pinned in Task 6.

---

### Task 1: Branch and Worker scaffold that builds and runs on workerd

**Files:**
- Create: `worker/package.json`, `worker/cloudflare.config.ts`, `worker/vite.config.js`, `worker/src/index.js` (placeholder route), `worker/.gitignore`
- Modify: `.dockerignore` (add `worker/` and `docs/`)
- Also commit: the two docs (`docs/superpowers/specs/...design.md`, this plan)

**Interfaces:**
- Produces: `npm run build` in `worker/` (builds output to `worker/.cloudflare/output/v1/`), `npm test` (`node --test`), `npm run preview` (`vite preview --port 4173`). Later tasks add to these scripts.

- [ ] **Step 1:** `git fetch && git switch -c cd/cloudflare origin/dev`; commit the two docs alone.
- [ ] **Step 2:** Create `worker/` as its own package (`"type":"module"`, `"engines":{"node":">=22.18"}`). Dependencies: `hono`, `mysql2`, `mssql`. Dev: `cf`, `vite`, `@cloudflare/vite-plugin@rc`, `ejs`, `jquery`. `worker/.gitignore`: `node_modules/`, `public/`, `.cloudflare/`, `.wrangler/`, `dist/`.
- [ ] **Step 3:** `cloudflare.config.ts` with the Global Constraints values; `vite.config.js` with `cloudflare()` plugin and `resolve.alias` mapping `/^process\/$/` to `node:process`; `src/index.js` default-exports a fetch handler returning `Response.json({ok:true})` for `/healthz`.
- [ ] **Step 4:** Verify: with portable Node first on PATH, `npm run build` succeeds and `npx vite preview --port 4173` then `curl localhost:4173/healthz` returns `{"ok":true}`. Stop the preview (kill only the process listening on 4173).
- [ ] **Step 5:** Commit (`worker/` scaffold + `.dockerignore`).

### Task 2: Pin generator output, then make `header.js` Worker-safe

**Files:**
- Create: `worker/test/fixtures/sample.mjs` (sample `dataDescription` objects, one MySQL-shaped, one MSSQL-shaped), `worker/scripts/make-golden.mjs`, `worker/test/golden/generators.json`, `worker/test/generators.test.mjs`
- Modify: `my_modules/generators/header.js`

**Interfaces:**
- Produces: `sample.mysql`, `sample.mssql` (`{dataSet: Row[], tbName, databaseName, provider}`), reused by Task 5.

- [ ] **Step 1:** Write `make-golden.mjs`: loads `../../my_modules/be_export_file.js` (CJS) and writes the output of every exported generator for both samples and each `programming` value to `generators.json`. Run it **before** touching `header.js`. Commit the golden file.
- [ ] **Step 2:** Write `generators.test.mjs`: for each golden entry, current output deep-equals golden. Run it: PASS.
- [ ] **Step 3:** Change `header.js`: drop `fs`/`path`, replace the `readFileSync` with `require('../../SystemConfig.json')`. Nothing else.
- [ ] **Step 4:** `npm test` still PASS (output unchanged) and `node -e "require('./my_modules/be_export_file')"` at repo root works. Commit.

### Task 3: Static page build

**Files:**
- Create: `worker/scripts/build-static.mjs`, `worker/test/static.test.mjs`
- Modify: `worker/package.json` (`"build:static"`, and `"build": "npm run build:static && cf build"`)

**Interfaces:**
- Produces: `worker/public/` containing `gencode.html`, everything from `../public/`, and `jquery/dist/jquery.min.js` (from `worker/node_modules/jquery`). `public/` is the Vite `publicDir`, so it becomes the Worker's static assets.

- [ ] **Step 1:** Test: after `node scripts/build-static.mjs`, `public/gencode.html` (a) equals `ejs.renderFile('../views/index.ejs', SystemConfig.description)`, (b) contains `Heart Code` and no `<%`, (c) every `src`/`href` that is a relative path in it exists under `public/`.
- [ ] **Step 2:** Run: FAIL (script missing).
- [ ] **Step 3:** Implement `build-static.mjs` (clean `public/`, render, copy). `asset` config in `cloudflare.config.ts`: `htmlHandling: "drop-trailing-slash"`.
- [ ] **Step 4:** Test PASS; commit.

### Task 4: SQL text and DB layer

**Files:**
- Create: `worker/src/queries.js`, `worker/src/db.js`, `worker/test/queries.test.mjs`, `worker/test/db.test.mjs`

**Interfaces:**
- Produces (`queries.js`, SQL copied verbatim from `routers/connectDB_router.js`; add a comment that it mirrors that file):
  `databaseListSql(provider: 'mysql'|'mssql'): string|null`, `tableListSql(provider, databaseName): string|null`, `tableDescriptionSql(provider, databaseName, tbName): string|null` (`null` for unknown provider).
- Produces (`db.js`):
  `normalizeMysqlPort(port: unknown): number|string`; `queryMysql(conn: {host,port,user,password,database?}, sql: string, opts?: {connectTimeoutMs?: number}): Promise<unknown>` (rows, or the raw multi-statement array); `queryMssql(conn: {host,user,password}, sql: string, opts?: {port?: number, timeoutMs?: number}): Promise<object[]>`; both return `[]` on any error and close the connection in `finally`.
  Type `Db = { queryMysql, queryMssql }`.

- [ ] **Step 1:** `queries.test.mjs`: `databaseListSql('mysql') === 'SHOW DATABASES'`; mssql one contains `master.dbo.sysdatabases`; `tableListSql('mysql','Rfam')` contains `table_schema='Rfam'`; mssql contains `Rfam.INFORMATION_SCHEMA.COLUMNS`; `tableDescriptionSql('mysql','Rfam','family')` starts with `USE information_schema;` and contains `COLUMNS.TABLE_SCHEMA = 'Rfam'` and `COLUMNS.TABLE_NAME = 'family'`; mssql contains `[Rfam].INFORMATION_SCHEMA.COLUMNS` and `c.TABLE_NAME = 'family'`; unknown provider returns `null`.
- [ ] **Step 2:** `db.test.mjs`: table-driven `normalizeMysqlPort`: `''`,`0`,`'undefined'` -> `3306`; `4497` -> `4497`; `'4497'` -> `'4497'`. `queryMysql({host:'127.0.0.1',port:1,user:'x',password:''}, 'SELECT 1')` resolves `[]` in under 3 s; `queryMssql({host:'127.0.0.1',user:'sa',password:'x'}, 'select 1', {port:1})` resolves `[]` in under 3 s. Optional integration test, only when `RFAM=1`: `queryMysql(RFAM, 'SHOW DATABASES')` returns >0 rows.
- [ ] **Step 3:** Run: FAIL. Implement both files. mysql2 via `mysql2/promise` (`createConnection` -> `query` -> `end` in `finally`), take `[results]`. mssql via a per-call `new ConnectionPool(...)`; default `opts.port` 1433.
- [ ] **Step 4:** `npm test` PASS. Run once with `RFAM=1` and confirm. Commit.

### Task 5: Hono app with all routes

**Files:**
- Create: `worker/src/app.js`, `worker/test/app.test.mjs`
- Modify: `worker/src/index.js` (`export default createApp({ queryMysql, queryMssql })`)

**Interfaces:**
- Consumes: `Db`, `queries.js`, `../../my_modules/be_export_file.js` (CJS default import).
- Produces: `createApp(db: Db): Hono`. Routes (mirror `routers/*.js`, port every `programming` branch of `/contentModelService` and `/contentController` verbatim): `GET /` -> 302 `/gencode`; POST `/databaseList`, `/tableList`, `/tableDescription`, `/contentDBService`, `/contentBase`, `/contentModelService`, `/contentController`, `/contentStoreProcedure`, `/contentIndexTable`. `GET /gencode` is not a Worker route (served by static assets). CORS enabled like Express `cors()`.

- [ ] **Step 1:** `app.test.mjs` using `app.request()` and a recording fake `Db`:
  - `/` -> 302 with `location` ending `/gencode`.
  - `/databaseList` with `provider:'mysql'` calls `queryMysql` with `sql === 'SHOW DATABASES'` and port 3306 when body port is `''`; returns the fake's rows; `provider:'mssql'` calls `queryMssql`; `provider:'oracle'` -> `[]`, no db call.
  - `/tableDescription`: SQL equals `tableDescriptionSql(...)`; two concurrent requests with different credentials reach the fake with their own credentials.
  - `/contentModelService` with each `programming` value and `/contentStoreProcedure`, `/contentIndexTable`, `/contentController` (codeigniter4, `.net 4.5`), `/contentDBService`, `/contentBase`: body JSON deep-equals the direct generator call on the same input (fake returns `sample.mysql.dataSet`).
  - `/contentController` with `nodejs` and with `python` -> `{export:false}`.
  - Body `{}` / empty -> `[]` (no throw); malformed JSON -> 400 with a JSON `error`; fake `Db` that returns `[]` -> `[]`.
- [ ] **Step 2:** Run: FAIL. Implement `createApp`. Parse body with `await c.req.json().catch(...)`: empty -> `{}`, malformed -> 400.
- [ ] **Step 3:** `npm test` PASS. Commit.

### Task 6: Smoke and parity scripts, proven on workerd

**Files:**
- Create: `worker/scripts/smoke.mjs`, `worker/scripts/parity.mjs`
- Modify: `worker/package.json` (`"preview"`, `"smoke"`, `"parity"`)

**Interfaces:**
- Produces: `node scripts/smoke.mjs <baseUrl> [--retry N]`: exit 0 only if: `GET /gencode` 200 containing `Heart Code`; `GET /gencode/` redirects to `/gencode`; `GET /genmodel` 404; `GET /` redirects to `/gencode`; `css/glass.css`, `jquery/dist/jquery.min.js`, `js/helper.js`, `img/icon-title.ico` all 200; POST `/databaseList` with `{provider:'mysql',host:'127.0.0.1',port:1,user:'x',password:''}` returns `[]` and POST `/databaseList` with `{provider:'mssql',host:'invalid.invalid',user:'sa',password:'x'}` returns `[]`; POST `/contentBase` returns JSON. `--retry` retries the whole check (live DNS/cert warm-up).
- Produces: `node scripts/parity.mjs <expressBase> <workerBase>`: posts identical bodies for all 9 routes against RFAM (`mysql-rfam-public.ebi.ac.uk:4497`, user `rfamro`, empty password, database `Rfam`, table `family`; every `programming` value) and prints PASS/FAIL per case. JSON equality after replacing any object that has both `fieldCount` and `affectedRows` with the string `"OK_PACKET"`. Skips `contentController` with `nodejs`/`python` (Express never answers); documented divergence.

- [ ] **Step 1:** Write both scripts.
- [ ] **Step 2:** Build, `vite preview --port 4173` (portable Node), run `node scripts/smoke.mjs http://localhost:4173`: PASS. This also proves both drivers load in the bundle.
- [ ] **Step 3:** With the Express app on `:5506` (the user's nodemon, or `node app.js`) run `node scripts/parity.mjs http://localhost:5506 http://localhost:4173`. Every case PASS. Any FAIL is a bug in `db.js`/`app.js` (e.g. result shape of multi-statement `tableDescription`: frontend reads index 1, `public/js/fe_connect_db.js:91`): fix and re-run. Kill the preview after.
- [ ] **Step 4:** Commit.

### Task 7: CD workflow

**Files:**
- Create: `.github/workflows/deploy-worker.yml`

**Interfaces:**
- Consumes: `npm ci`, `npm test`, `npm run build`, `npm run preview`, `npm run smoke` from `worker/`; secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

- [ ] **Step 1:** Write `deploy-worker.yml` (Thai comments, `defaults.run.working-directory: worker`, `permissions: contents: read`, `concurrency: {group: deploy-worker, cancel-in-progress: false}`). Triggers: `pull_request` to `main`/`dev` and `push` to `main`, both path-filtered on `worker/**`, `my_modules/generators/**`, `views/**`, `public/**`, `SystemConfig.json`, the workflow file. Steps in order: checkout, setup-node (`22`, npm cache keyed on `worker/package-lock.json`), `npm ci`, `npm test`, `npm run build`, start preview in background + `node scripts/smoke.mjs http://localhost:4173`, `npx cf deploy --prebuilt --dry-run`, then **only on `push`**: `npx cf deploy --prebuilt` with the two secrets in `env`, then `node scripts/smoke.mjs https://codegenerator.vongrod.com --retry 30` (delay between retries 5 s). Use the same `--mode` (or none) on build and deploy. Show preview log `if: failure()`.
- [ ] **Step 2:** Validate locally: `npx cf deploy --prebuilt --dry-run` in `worker/` (no credentials needed) passes. Lint the YAML with `node -e` parse or `gh workflow` check after push.
- [ ] **Step 3:** Commit.

### Task 8: Ship and verify live

- [ ] **Step 1:** Push `cd/cloudflare`; open PR into `dev`; wait for the PR job (build, tests, preview smoke, dry-run) green; merge with a merge commit.
- [ ] **Step 2:** Open PR `dev` -> `main`; green; merge. The push-to-main run deploys. Watch it (`gh run watch`). If `cf deploy` fails on permissions, report the exact error to the user, who edits the token (likely add Zone Read on `vongrod.com`), then `gh run rerun --failed`. Do not guess permissions.
- [ ] **Step 3:** After success: `node scripts/smoke.mjs https://codegenerator.vongrod.com --retry 30` passes locally too.
- [ ] **Step 4:** Browser check with Playwright MCP on the live page: connect to RFAM (provider mysql, host `mysql-rfam-public.ebi.ac.uk`, port `4497`, user `rfamro`, empty password), database list, table list, field list appear, generate one export of each kind the UI offers; no 404s and no console errors. Check `https://codegenerator.vongrod.com/genmodel` is 404.
- [ ] **Step 5:** Read CPU time per request from Workers observability (`cf cli search "workers observability"` to find the query). If it exceeds the Free-plan limit (10 ms as remembered, unverified), stop and tell the user the Paid-plan trade-off. Record the numbers.
- [ ] **Step 6:** MSSQL: ask the user for a publicly reachable MSSQL; if none, state in the final report that MSSQL is verified to driver/handshake level only.
- [ ] **Step 7:** Update `work_state` list `cloudflare-worker-genmodel`; report to the user in Thai.

## Self-Review notes

- Spec coverage: structure (T1), header.js (T2), static page + `/gencode` trap (T3, T6), DB layer (T4), routes + fallbacks + CORS (T5), CD incl. secrets-only-in-deploy-step (T7), acceptance 1-7 (T6, T8). Express/Docker untouched except `header.js`.
- Divergences from spec, deliberate: branch from `dev` (equals `main`); SQL strings are copied into `worker/src/queries.js` rather than shared with Express (parity script guards drift; refactor is out of scope).
- Not covered by tests, accepted: MSSQL end-to-end (no public server), CPU limit on Free plan (measured in T8).
