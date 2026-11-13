const express = require('express')
const router = express.Router()
const connMysql = require('../my_modules/mysql.js')
const connMssql = require('../my_modules/mssql.js')

router.post('/databaseList', async (req, res) => {
    let req_json = req.body

    let provider = req_json.provider;
    let user = req_json.user;
    let password = req_json.password;
    let host = req_json.host;
    let port = req_json.port;

    if (provider === 'mysql') {
        port = ['undefined', 0, ''].includes(port) ? 3306 : port
        try {

            let mysql = new connMysql.MysqlConnection({
                // "database": databaseName,
                "user": user,
                "password": password,
                "host": host,
                "port": port
            })
            await mysql.execSQL('SHOW DATABASES')
            res.json(mysql.dataSet)
        } catch (error) {
            console.log(error)
            res.json([])
        }

    }
    else if (provider === 'mssql') {
        let config = {
            user: user,
            password: password,
            server: host,
            options: {
                encrypt: false // Disable encryption
            }
        }
        let mssql = new connMssql.MssqlConnection(config)
        await mssql.execSQL('SELECT name as [Database] FROM master.dbo.sysdatabases')
        res.json(mssql.dataSet)
    }
    else {
        res.json([])
    }
})

router.post('/tableList', async (req, res) => {
    let req_json = req.body
    let provider = req_json.provider;
    let databaseName = req_json.databaseName;
    let user = req_json.user;
    let password = req_json.password;
    let host = req_json.host;
    let port = req_json.port;
    if (provider === 'mysql') {
        port = ['undefined', 0, ''].includes(port) ? 3306 : port
        try {

            let mysql = new connMysql.MysqlConnection({
                "database": databaseName,
                "user": user,
                "password": password,
                "host": host,
                "port": port
            })
            await mysql.execSQL(`SELECT table_name AS TableName FROM information_schema.tables WHERE table_schema='${databaseName}'`)
            res.json(mysql.dataSet)
        } catch (error) {
            console.log(error)
            res.json([])
        }

    }
    else if (provider === 'mssql') {
       
        try {
            let config = {
                user: user,
                password: password,
                server: host,
                options: {
                    encrypt: false // Disable encryption
                }
            }
            let mssql = new connMssql.MssqlConnection(config)
            await mssql.execSQL(`select distinct TABLE_NAME as TableName from ${databaseName}.INFORMATION_SCHEMA.COLUMNS`)
            res.json(mssql.dataSet)
            // await mssql.execSQL(`select distinct TABLE_NAME as TableName from ${databaseName}.INFORMATION_SCHEMA.COLUMNS`)
            // res.json(mysql.dataSet)
        } catch (error) {
            console.log(error)
            res.json([])
        }

    }
    else {
        res.json([])
    }
})

async function TableDescription(connDetail) {
    let provider = connDetail.provider;
    let databaseName = connDetail.databaseName;
    let user = connDetail.user;
    let password = connDetail.password;
    let host = connDetail.host;
    let port = connDetail.port;
    let tbName = connDetail.tbName;


    if (provider === 'mysql') {
        let sqlStr = `

USE information_schema;
   SELECT                                                            
      COLUMNS.TABLE_SCHEMA,                                        
      COLUMNS.TABLE_NAME AS TableName,                             
      COLUMNS.ORDINAL_POSITION AS FieldNo,                         
      COLUMNS.COLUMN_NAME AS FieldName,                            
      CAST(COLUMNS.DATA_TYPE as CHAR(100)) AS FieldType,           
      CAST(COLUMNS.COLUMN_TYPE as CHAR(100)) AS FieldTypeDefine,   
      COALESCE(COLUMNS.CHARACTER_MAXIMUM_LENGTH,0) AS FieldSize,   
      COALESCE(COLUMNS.NUMERIC_PRECISION,0) AS FieldPrecision,     
      COALESCE(COLUMNS.NUMERIC_SCALE,0) AS FieldScale,             
      CASE COLUMNS.IS_NULLABLE                                     
        WHEN 'YES' THEN 1                                          
        WHEN 'NO' THEN 0                                           
      END AS IsNullable,                                             
      CASE COALESCE(COLUMNS.COLUMN_KEY,'')                       
        WHEN 'PRI' THEN 1                                          
        ELSE 0                                                       
      END AS IsPrimaryKey,                                           
      CASE
        WHEN COLUMNS.EXTRA LIKE '%auto_increment%' THEN 1
        ELSE 0
      END AS IsIdentity,
                                                                     
      CASE COALESCE(COLUMNS.COLUMN_NAME,'')                      
        WHEN 'AddBy' THEN 1                                        
        ELSE 0                                                       
      END AS IsCreateUser,                                           
                                                                     
      CASE COALESCE(COLUMNS.COLUMN_NAME,'')                      
        WHEN 'UpdateBy' THEN 1                                     
        ELSE 0                                                       
      END AS IsModifyUser,                                           
                                                                     
      CASE COALESCE(COLUMNS.COLUMN_NAME,'')                      
        WHEN 'AddDate' THEN 1                                      
        WHEN 'CreateDate' THEN 1                                   
        WHEN 'create_date' THEN 1                                  
        ELSE 0                                                       
      END AS IsCreateDate,                                           
                                                                     
      CASE COALESCE(COLUMNS.COLUMN_NAME,'')                      
        WHEN 'UpdateDate' THEN 1                                   
        WHEN 'EditDate' THEN 1                                     
        WHEN 'update_date' THEN 1                                  
        ELSE 0                                                       
      END AS IsModifyDate                                            
    FROM                                                             
      COLUMNS                                                      
    WHERE                                                            
     COLUMNS.TABLE_SCHEMA = '${databaseName}' AND   
     COLUMNS.TABLE_NAME = '${tbName}'
    ORDER BY                                                         
      COLUMNS.ORDINAL_POSITION
    `
        port = ['undefined', 0, ''].includes(port) ? 3306 : port
        try {

            let mysql = new connMysql.MysqlConnection({
                "database": databaseName,
                "user": user,
                "password": password,
                "host": host,
                "port": port
            })
            await mysql.execSQL(sqlStr)
            return mysql.dataSet

        } catch (error) {
            console.log(error)
            return []
        }

    }
    else if (provider === 'mssql') {

        try {
            let config = {
                user: user,
                password: password,
                server: host,
                options: {
                    encrypt: false // Disable encryption
                }
            }
            let mssql = new connMssql.MssqlConnection(config)
            // IsPrimaryKey / IsIdentity come from the catalog (not from column names), and are what the
            // generators use as the key. sys.* is read through the [database] prefix because the
            // connection has no default database.
            let sqlStr = `
                select
                c.COLUMN_NAME as FieldName,
                c.DATA_TYPE as FieldType,
                '' as FieldTypeDefine,
                case when c.CHARACTER_MAXIMUM_LENGTH is not null then
                c.CHARACTER_MAXIMUM_LENGTH
                when c.NUMERIC_PRECISION is not null then
                c.NUMERIC_PRECISION
                else '' end as FieldSize,
                c.NUMERIC_SCALE as NumericScale,
                case when pk.COLUMN_NAME is not null then 1 else 0 end as IsPrimaryKey,
                case when sc.is_identity = 1 then 1 else 0 end as IsIdentity
                from [${databaseName}].INFORMATION_SCHEMA.COLUMNS c
                left join (
                    select kcu.TABLE_SCHEMA, kcu.TABLE_NAME, kcu.COLUMN_NAME
                    from [${databaseName}].INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
                    join [${databaseName}].INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
                      on kcu.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA
                     and kcu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
                     and kcu.TABLE_NAME = tc.TABLE_NAME
                    where tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
                ) pk
                  on pk.TABLE_SCHEMA = c.TABLE_SCHEMA
                 and pk.TABLE_NAME = c.TABLE_NAME
                 and pk.COLUMN_NAME = c.COLUMN_NAME
                left join [${databaseName}].sys.schemas ss on ss.name = c.TABLE_SCHEMA
                left join [${databaseName}].sys.tables st on st.name = c.TABLE_NAME and st.schema_id = ss.schema_id
                left join [${databaseName}].sys.columns sc on sc.object_id = st.object_id and sc.name = c.COLUMN_NAME
                where c.TABLE_NAME = '${tbName}'
                order by c.ORDINAL_POSITION
            `
            // console.log(sqlStr)
            await mssql.execSQL(sqlStr)
            // console.table(mssql.dataSet)
            return mssql.dataSet
            // await mssql.execSQL(`select distinct TABLE_NAME as TableName from ${databaseName}.INFORMATION_SCHEMA.COLUMNS`)
            // res.json(mysql.dataSet)
        } catch (error) {
            console.log(error)
            return []
        }

    }
    else {
        return []
    }
}

router.post('/tableDescription', async (req, res) => {
    let req_json = req.body
    let dataRes = await TableDescription(req_json)
    res.json(dataRes)
})


module.exports = router
module.exports.TableDescription = TableDescription