const express = require('express')
const router = express.Router()
const connMysql = require('../my_modules/mysql.js')


router.get('/genmodel', (req, res) => {
    res.render('index.ejs', { data: 'test' })
})


router.get('/databaseList',async (req, res) => {
    let req_json = JSON.parse(req.query.req_json)
    req.session.connectionDB = req_json
    console.log('/databaseList req.session.connectionDB : ',req.session.connectionDB)
    if(req.session.connectionDB.provider === 'mysql'){
        req.session.connectionDB.port = ['undefined',0,''].includes(req.session.connectionDB.port)?3306:req.session.connectionDB.port
        try {
            
            let mysql = new connMysql.MysqlConnection({
                // "database": databaseName,
                "user": req.session.connectionDB.user,
                "password": req.session.connectionDB.password,
                "host": req.session.connectionDB.host,
                "port": req.session.connectionDB.port
            })
            await mysql.execSQL('SHOW DATABASES')
            res.json(mysql.dataSet) 
        } catch (error) {
            console.log(error)
            res.json([]) 
        }

    }
    else{
        res.json([])
    }
})

router.get('/tableList',async (req, res) => {
    let req_json = JSON.parse(req.query.req_json)
    req.session.connectionDB.databaseName = req_json.databaseName
    console.log('/tableList req.session.connectionDB : ',req.session.connectionDB)

    if(req.session.connectionDB.provider === 'mysql'){
        req.session.connectionDB.port = ['undefined',0,''].includes(req.session.connectionDB.port)?3306:req.session.connectionDB.port
        try {
            
            let mysql = new connMysql.MysqlConnection({
                "database": req.session.connectionDB.databaseName,
                "user": req.session.connectionDB.user,
                "password": req.session.connectionDB.password,
                "host": req.session.connectionDB.host,
                "port": req.session.connectionDB.port
            })
            await mysql.execSQL(`SELECT table_name AS TableName FROM information_schema.tables WHERE table_schema='${req.session.connectionDB.databaseName}'`)
            res.json(mysql.dataSet) 
        } catch (error) {
            console.log(error)
            res.json([]) 
        }

    }
    else{
        res.json([])
    }
})
router.get('/tableDescription',async (req, res) => {
    let req_json = JSON.parse(req.query.req_json)
    
    let tbName = req_json.tbName;
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
      CASE COALESCE(COLUMNS.COLUMN_NAME,'')                      
        WHEN 'RxNo' THEN 1                                         
        WHEN 'RecNo' THEN 1                                        
        ELSE 0                                                       
      END IsRunningKey,                                              
                                                                     
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
     COLUMNS.TABLE_SCHEMA = '${req.session.connectionDB.databaseName }' AND   
     COLUMNS.TABLE_NAME = '${tbName}'
    ORDER BY                                                         
      COLUMNS.ORDINAL_POSITION
    `

    if(req.session.connectionDB.provider === 'mysql'){
        req.session.connectionDB.port = ['undefined',0,''].includes(req.session.connectionDB.port)?3306:req.session.connectionDB.port
        try {
            
            let mysql = new connMysql.MysqlConnection({
                "database": req.session.connectionDB.databaseName,
                "user": req.session.connectionDB.user,
                "password": req.session.connectionDB.password,
                "host": req.session.connectionDB.host,
                "port": req.session.connectionDB.port
            })
            await mysql.execSQL(sqlStr)
            res.json(mysql.dataSet) 
        } catch (error) {
            console.log(error)
            res.json([]) 
        }

    }
    else{
        res.json([])
    }
})


module.exports = router