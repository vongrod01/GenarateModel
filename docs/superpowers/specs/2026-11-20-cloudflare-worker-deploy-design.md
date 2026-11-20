# ขึ้น GenarateModel บน Cloudflare Workers (codegenerator.vongrod.com) พร้อม CD

สถานะ: **ร่าง รออนุมัติ** · วันที่ 2026-11-20

## 1. เป้าหมายและเหตุผล

ให้หน้าเว็บ code generator (Heart Code) เปิดใช้ได้ที่ `https://codegenerator.vongrod.com/gencode`
บน Cloudflare Workers (แผน Free ก่อน) และ push เข้า `main` แล้ว deploy อัตโนมัติผ่าน GitHub Actions
ต่อจาก CD ที่ push image ขึ้น GHCR อยู่แล้ว ผู้ใช้เรียน CI/CD ทีละขั้น จึงควรทำให้ workflow อ่านเข้าใจได้
(คอมเมนต์ภาษาไทยในไฟล์ YAML เหมือน `ci.yml`/`cd.yml`)

คำตอบที่ผู้ใช้ให้ไว้ (ใช้ตามนี้ ไม่เปิดใหม่):
- เลือกเขียนเป็น Worker จริง ไม่ใช้ Containers
- Worker ใช้กับ **DB สาธารณะเท่านั้น** DB หลัง VPN/localhost ใช้แอป Express/Docker เดิมบนเครื่องตัวเอง
- subdomain คือ `codegenerator` (โซน `vongrod.com` อยู่ในบัญชี Cloudflare แล้ว ไม่มี DNS record เดิมชนชื่อ)
- เปิดสาธารณะเฉย ๆ **ไม่ใส่ Cloudflare Access และไม่ใส่ตัวกันในโค้ด** (ผู้ใช้รับทราบความเสี่ยงแล้ว ดูข้อ 7)

## 2. Goals / Non-goals / Anti-goals

**Goals**
- หน้าเว็บและ API ทำงานเหมือนแอป Express เดิมทุก route: `GET /gencode` และ POST `/databaseList`, `/tableList`,
  `/tableDescription`, `/contentDBService`, `/contentBase`, `/contentModelService`, `/contentController`,
  `/contentStoreProcedure`, `/contentIndexTable` (หน้าเว็บส่ง JSON ด้วย `fetch` ตรง ๆ ไม่ต้องแก้ฝั่ง frontend)
- รองรับ MySQL และ MSSQL ที่เข้าถึงได้จากอินเทอร์เน็ต
- Push เข้า `main` -> deploy เอง; PR -> build + ทดสอบเท่านั้น ไม่ deploy

**Non-goals**
- ไม่รองรับ DB หลัง VPN / IP ภายใน / localhost (Workers บล็อกที่อยู่เหล่านี้ และบล็อกพอร์ต 25)
- ไม่เพิ่ม login/rate limit/allow-list พอร์ต (อาจเพิ่มภายหลัง)
- ไม่แก้พฤติกรรมแอป Express เดิม, Dockerfile, ci.yml, cd.yml **ยกเว้นการเปลี่ยนชื่อ path หน้าเว็บจาก `/genmodel` เป็น `/gencode`**
  (ผู้ใช้สั่ง ให้ใช้ชื่อเดียวกันทั้ง Express และ Worker) ซึ่งแตะ 4 บรรทัด: `routers/view_router.js:8`, `ci.yml:83` และคอมเมนต์ `ci.yml:69`,
  `cd.yml:35` ต้องแก้ **ใน commit/PR เดียวกัน** ไม่งั้น smoke test ของ CI/CD เดิมจะแดง
- ไม่เขียน generators ใหม่ ไม่ย้าย UI ไปเฟรมเวิร์กอื่น
- ไม่แก้ปัญหาเดิมของ MSSQL ที่ไม่ส่ง port (ใช้ 1433 อย่างเดียว) และ SQL ที่ต่อ string ใน v1 (คง parity ไว้ก่อน)

**Anti-goals** (ถือว่าล้มเหลวแม้ "ทำงาน")
- ทำให้ Express/Docker CD หรือ CI พัง
- Token/secret หลุดเข้า repo
- Worker ที่ทำงานได้เฉพาะ dev แต่ build จริงโหลดไดรเวอร์ไม่ขึ้น

## 3. วิธีที่พิจารณา

| | วิธี | ผล |
|---|---|---|
| **A (เลือก)** | โฟลเดอร์ `worker/` แยก: Hono + Workers Static Assets ใช้ `my_modules/generators` ร่วมกับแอปเดิม | แอปเดิมไม่ถูกแตะ งานน้อยที่สุดที่ยัง "เป็น Worker จริง" |
| B | แปลงทั้งโปรเจ็คเป็น Worker แทน Express | โค้ดชุดเดียว แต่ Docker/GHCR CD ใช้ไม่ได้ และ DB หลัง VPN หมดทางใช้ |
| C | Cloudflare Containers รัน image เดิม | ไม่แก้โค้ด แต่ต้องแผน Workers Paid ($5/เดือน) ผู้ใช้เลือกไม่ใช้ |

## 4. ผล spike (ทิ้งแล้ว อยู่ใน scratchpad) ที่ผูกกับดีไซน์

ทดสอบบน workerd จริง ผ่าน `vite build` + `vite preview`:
- `mysql2` ต่อ RFAM สาธารณะได้ รัน `SHOW DATABASES` และ query `information_schema` ได้ (ต้องส่ง `disableEval: true`)
- `mssql`/tedious โหลดได้ เปิด TCP และคุย TDS ถึงขั้นได้คำตอบ login จากเซิร์ฟเวอร์ แต่ **ยังไม่เคยต่อสำเร็จจริง**
  และไม่ได้ทดสอบผ่านเครือข่ายสาธารณะ
- `cf dev` (โหมด dev) โหลด `mssql` ไม่ได้ เพราะ `readable-stream` เรียก `require('process/')` ที่ bundler ของ dev
  จัดการไม่ได้ (alias ใน Vite config ไม่ช่วย) ส่วน build จริงไม่มีปัญหา -> ทดสอบ MSSQL ผ่าน build + preview
- ขนาด bundle ประมาณ 0.8 MB หลัง gzip (เพดาน Free คือ 3 MB)
- `cf` v0.15 ต้องใช้ Node >= 22.18 และ `@cloudflare/vite-plugin@rc` (2.0.0-rc.2) เพราะ `latest` (1.70) ยังไม่อ่าน
  `cloudflare.config.ts`; ตอนนี้ `cf` เป็น beta/RC รูปแบบอาจเปลี่ยนก่อนรุ่น stable

## 5. การออกแบบ

### 5.1 โครงสร้าง

```
worker/                      <- โปรเจ็คแยก มี package.json ("type":"module") และ lockfile ของตัวเอง
  cloudflare.config.ts       <- worker name "codegenerator", domains ["codegenerator.vongrod.com"],
                                compatibilityFlags ["nodejs_compat"], workersDev ปิด, observability เปิด
  vite.config.js             <- plugin cloudflare()
  src/index.js               <- Hono app: route ตรงกับ Express ทุกตัว
  src/db/mysql.js, mssql.js  <- ตัวห่อไดรเวอร์ (ดู 5.3)
  scripts/build-static.mjs   <- render views/index.ejs เป็น HTML ตอน build และรวบรวม static
my_modules/generators/header.js  <- fs.readFileSync(SystemConfig.json) -> require('../../SystemConfig.json')
routers/view_router.js           <- route '/genmodel' -> '/gencode'
.github/workflows/ci.yml, cd.yml <- smoke test ชี้ /gencode แทน /genmodel (ชื่อ image genmodel:test ไม่เกี่ยว ไม่ต้องแก้)
.github/workflows/deploy-worker.yml
.dockerignore                <- เพิ่ม worker/ และ docs/ ไม่ให้เข้า image
```

### 5.2 หน้าเว็บและ static
- `index.ejs` ใช้ตัวแปร 3 ตัว (`titleHeader`, `version`, `developer`) จึง render เป็น HTML ครั้งเดียวตอน build
  (Workers ห้าม `new Function` จึงรัน EJS ตอน runtime ไม่ได้) ผลต้องเหมือนที่ Express render ทุกไบต์
- เสิร์ฟผ่าน Workers Static Assets: `public/*` (css/img/js) และ `jquery/dist/jquery.min.js` (แอปเดิมเสิร์ฟจาก `node_modules`)
- **กับดัก:** HTML ใช้ path แบบ relative (`css/glass.css`) หน้าต้องตอบที่ `/gencode` (ไม่มี `/` ท้าย)
  ไม่งั้น asset จะไปที่ `/gencode/css/...` และ 404 -> ใช้ `gencode.html` กับ `htmlHandling: "drop-trailing-slash"`
  แล้วตรวจจริงในเบราว์เซอร์
- `GET /` redirect ไป `/gencode`

### 5.3 ชั้น DB (ต่อ DB ของผู้ใช้ตาม host/user/password ที่ส่งมาแต่ละ request)
- MySQL ใช้ `mysql2` (`disableEval: true`, `multipleStatements: true`, ตั้ง `connectTimeout`) ส่วน MSSQL ใช้ `mssql`
  (`encrypt:false` ตามเดิม)
- **หนึ่ง request หนึ่ง connection แล้วปิดใน `finally`** ห้ามใช้ `mssql.connect()` แบบ global pool ที่แอปเดิมใช้
  (Worker ใช้ข้าม request ไม่ได้) ห้ามเก็บ connection ข้าม request
- **รูปผลลัพธ์ต้องเท่าเดิม** โดยเฉพาะ MySQL `tableDescription` ที่ส่ง `USE ...; SELECT ...` ในรอบเดียว:
  frontend อ่านแถวจาก `dataRes[1]` (`public/js/fe_connect_db.js:91`) และ `mysql` กับ `mysql2` คืน header packet ต่างชนิดกัน
  ต้องจัดให้ index 1 ยังเป็นแถวข้อมูล
- พฤติกรรมเมื่อ error คงเดิม: คืน `[]`
- `/contentController` ของแอปเดิมไม่ตอบอะไรเลยเมื่อเป็น `nodejs`/`python` (request ค้าง) Worker ตอบ `{ "export": false }`
  แทน (เหมือน branch `else` เดิม)
- CORS: คง `cors()` ให้ตรงกับแอปเดิม

### 5.4 CD (`deploy-worker.yml`)
- **PR เข้า main/dev** (path filter: `worker/**`, `my_modules/generators/**`, `views/**`, `public/**`, `SystemConfig.json`,
  ตัว workflow): ติดตั้ง Node >= 22.18, `npm ci`, build, รัน preview แล้ว smoke test: หน้า `/gencode` มีคำว่า "Heart Code",
  asset 200, และ POST `/databaseList` ไปยัง host ที่ต่อไม่ได้ต้องได้ `[]` (พิสูจน์ว่าไดรเวอร์ทั้งสองโหลดได้
  โดยไม่พึ่ง DB ของคนอื่น)
- **push เข้า main:** ทำตามรูปแบบที่เอกสาร `cf` ใน CI แนะนำ: `cf build` ครั้งเดียว -> `cf deploy --prebuilt --dry-run` ตรวจ ->
  เฉพาะ push main รัน `cf deploy --prebuilt` (**เฉพาะขั้น deploy ขั้นสุดท้ายเท่านั้นที่ได้รับ secret**) จากนั้น smoke test URL จริง
  (retry เหมือน `cd.yml` เผื่อ DNS/ใบรับรองยังไม่พร้อม)
- ใช้ `concurrency` กัน deploy ซ้อน สิทธิ์ `contents: read`; secret ชื่อ `CLOUDFLARE_API_TOKEN` และ `CLOUDFLARE_ACCOUNT_ID`
  ใน GitHub **ห้าม commit**
- **Token:** ผู้ใช้สร้างเองใน dashboard (Account API tokens) จากเทมเพลต "Edit Cloudflare Workers" ที่เอกสาร Cloudflare แนะนำ
  จำกัดเฉพาะบัญชีนี้และโซน `vongrod.com` ตั้งวันหมดอายุ (`cf` ที่ login ด้วย OAuth ของเซสชันนี้สร้าง/ดูรายการ token ไม่ได้ ได้ 403)
  สิทธิ์ที่คาดว่าต้องมี: Account Workers Scripts Edit, Account Settings Read, Zone Workers Routes Edit, Zone DNS Edit
  (custom domain สร้าง DNS record และใบรับรองให้เอง จึงต้องมีสิทธิ์ฝั่งโซน) **ยังไม่ยืนยัน** รายการที่แน่ชัดดูจากการ deploy จริงครั้งแรก
  ถ้าติด error เรื่องสิทธิ์ ให้เพิ่มทีละข้อเฉพาะโซนนั้น
- deploy ครั้งแรกทำจาก Actions เพื่อไม่ต้องอัปเกรด Node บนเครื่องผู้ใช้ (22.12.0 ต่ำกว่าที่ `cf` ต้องการ)

## 6. เกณฑ์ผ่าน
1. `https://codegenerator.vongrod.com/gencode` ตอบ 200 มี "Heart Code" `/` ไป `/gencode` และเปิดในเบราว์เซอร์แล้วไม่มี asset 404
2. **Parity test:** ยิง body เดียวกันไปที่ Express (local) กับ Worker (preview) ทั้ง 9 route กับ RFAM (MySQL) ผล JSON ต้องตรงกัน
3. ใช้หน้าเว็บจริงกับ RFAM ครบ: connect -> เลือก DB/ตาราง/ฟิลด์ -> generate ทุกชนิดที่ UI มี
4. MSSQL: ทดสอบกับ MSSQL ที่เข้าถึงได้จากอินเทอร์เน็ต **ถ้ามี** ถ้าไม่มี ให้ส่งมอบพร้อมบันทึกว่า MSSQL ผ่านแค่ระดับไดรเวอร์
   (handshake) ยังไม่เคยต่อสำเร็จจริง
5. PR ได้ build+smoke เขียว, push main ได้ deploy+smoke เขียว, ci.yml/cd.yml/Docker เดิมยังเขียว
6. วัด CPU time ต่อ request หลัง deploy (Workers observability) ถ้าเกินเพดาน Free ให้หยุดและถามผู้ใช้เรื่องย้ายไป Paid ($5/เดือน)
7. ไม่มี token/secret ใน repo

## 7. ความเสี่ยงที่ยอมรับ
- **เปิดสาธารณะ = ใครก็ใช้เป็นตัวกลางต่อ DB ได้** และ password ที่พิมพ์ในหน้าเว็บผ่าน Worker นี้ (ผู้ใช้ตัดสินใจแล้ว) เพิ่ม Access/rate limit ภายหลังได้
  โดยไม่ต้องรื้อดีไซน์
- แผน Free มีเพดาน CPU ต่อ request: ยังไม่เคยวัด (ข้อ 6.6)
- `cf` และ Vite plugin 2.0 เป็น beta/RC รูปแบบ config อาจเปลี่ยน -> pin เวอร์ชันใน lockfile
- SQL ที่ต่อ string (`databaseName`, `tbName`) เป็นปัญหาเดิมของแอป คงไว้เพราะผู้ใช้พิมพ์ credential ของตัวเอง

## 8. ปล่อยให้ผู้สร้างตัดสินใจ
กลไกคัดลอก static เข้า asset directory ให้เข้ากับ `cf`/Vite plugin 2.0, รูปแบบฟังก์ชันของตัวห่อ DB, ค่า timeout, เวอร์ชัน
ที่ pin, ชื่อ job/step, และวิธีที่ smoke test เรียก preview

## 9. การตัดสินใจที่ผู้เขียนเลือกเอง (ขอให้ตรวจ)
- ชื่อ Worker = `codegenerator`; ปิด `workers.dev` เพื่อให้มี URL สาธารณะเดียว
- `GET /` -> redirect `/gencode` (แอปเดิมไม่มี route นี้)
- smoke test ใน CI ไม่พึ่ง RFAM (ไม่ให้ CI พังเพราะ DB ของคนอื่นล่ม) ส่วน parity test กับ RFAM รันด้วยมือตอนพัฒนา
- แยกไฟล์ workflow ใหม่ ไม่ยัดลง `cd.yml` เพื่อให้ Docker CD ที่ใช้งานได้อยู่ไม่ถูกแตะ
- เปิด observability เพื่อวัด CPU time
- ใช้ branch ใหม่ `cd/cloudflare` จาก `origin/main` (`cd/docker` ถูก merge หมดแล้ว)
- `/contentController` ตอบ `{export:false}` แทนการค้าง (แก้ปัญหาเดิมเล็กน้อย)

## 10. การตัดสินใจของผู้ใช้หลังร่างแรก
- เปลี่ยน path หน้าเว็บเป็น `/gencode` **ทั้งสองที่** (ผู้ใช้เลือกตัวเลือกที่แนะนำ ไม่เก็บ `/genmodel` ไว้ redirect)
  ผลที่ตามมา: `localhost:5506/genmodel` ที่เคยบุ๊กมาร์กไว้จะไม่เจอหลัง build image ใหม่ และ image `:latest` ที่อยู่บน GHCR ตอนนี้
  ยังตอบ `/genmodel` จนกว่า CD รอบถัดไปจะ push ตัวใหม่
