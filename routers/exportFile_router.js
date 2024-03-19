const express = require('express')
const router = express.Router()
const connectDB_router = require('./connectDB_router')
const be_export_file = require('../my_modules/be_export_file')

router.get('/contentBase', async (req, res) => {
    let req_json = JSON.parse(req.query.req_json)
    let programming = req_json.programming;
    let provider = req_json.provider;
    res.json(be_export_file.baseVO_EXE(programming,provider))
})



router.get('/contentVO_EXE', async (req, res) => {

    let req_json = JSON.parse(req.query.req_json)
    console.log(req_json)
    dataDescription = await connectDB_router.TableDescription(req_json)
    dataDescription.tbName = req_json.tbName
    if(req_json.programming === 'nodejs'){

        res.json(be_export_file.nodejsVO_EXE(dataDescription))
    }
    else if(req_json.programming === 'python'){

        res.json(be_export_file.pythonVO_EXE(dataDescription))
    }
    else{
        res.json({
            export:false,
        })
    }

})


module.exports = router