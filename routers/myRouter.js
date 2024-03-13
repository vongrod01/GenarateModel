const express = require('express')
const router = express.Router()
const connMysql = require('../my_modules/mysql.js')


router.get('/', (req, res) => {
    res.render('index.ejs', { data: 'test' })
})

router.get('/structureDatabase',async (req, res) => {
    let req_json = JSON.parse(req.query.req_json)
    let provider = req_json.provider;
    let databaseName = req_json.databaseName;
    let user = req_json.user;
    let password = req_json.password;
    let host = req_json.host;
    let port = req_json.port;

    if(provider === 'mysql'){
        port = port === 'undefined'?'3306':port
        try {
            
            let mysql = new connMysql.MysqlConnection({
                "database": databaseName,
                "user": user,
                "password": password,
                "host": host,
                "port": "3306"
            })
            await mysql.execSQL('SHOW DATABASES')
            res.json(mysql.dataSet) 
        } catch (error) {
            res.json([]) 
        }

    }
})

router.get('/databaseList',async (req, res) => {
    let req_json = JSON.parse(req.query.req_json)
    console.log(req_json)
    let provider = req_json.provider;
    let user = req_json.user;
    let password = req_json.password;
    let host = req_json.host;
    let port = req_json.port;

    if(provider === 'mysql'){
        port = ['undefined',0,''].includes(port)?3306:port
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
    else{
        res.json([])
    }
})

router.get('/tableList',async (req, res) => {
    let req_json = JSON.parse(req.query.req_json)
    let provider = req_json.provider;
    let databaseName = req_json.databaseName;
    let user = req_json.user;
    let password = req_json.password;
    let host = req_json.host;
    let port = req_json.port;

    if(provider === 'mysql'){
        port = ['undefined',0,''].includes(port)?3306:port
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
    else{
        res.json([])
    }
})


module.exports = router