const express = require('express')
const router = express.Router()
const connectDB_router = require('./connectDB_router')
const be_export_file = require('../my_modules/be_export_file')

router.get('/contentBase', async (req, res) => {
    let req_json = req.query
    let programming = req_json.programming;
    let provider = req_json.provider;
    res.json(be_export_file.baseVO_EXE(programming,provider))
})



router.get('/contentVO_EXE', async (req, res) => {

    let req_json = req.query
    console.log(req_json)
    let dataDescription = {
        dataSet : await connectDB_router.TableDescription(req_json),
        tbName : req_json.tbName,
        databaseName:req_json.databaseName,
    }
    
    
    // dataDescription.tbName = req_json.tbName
    if(req_json.programming === 'nodejs'){

        res.json(be_export_file.nodejsVO_EXE(dataDescription))
    }
    else if(req_json.programming === 'python'){

        res.json(be_export_file.pythonVO_EXE(dataDescription))
    }
    else if(req_json.programming === 'codeigniter4'){

        res.json(be_export_file.codeigniterVO_EXE(dataDescription))
    }
    else{
        res.json({
            export:false,
        })
    }

})
router.get('/contentController', async (req, res) => {

    let req_json = req.query
    console.log(req_json)
    let dataDescription = {
        dataSet : await connectDB_router.TableDescription(req_json),
        tbName : req_json.tbName,
        databaseName:req_json.databaseName,
    }
    
    
    // dataDescription.tbName = req_json.tbName
    if(req_json.programming === 'nodejs'){

        // res.json(be_export_file.nodejsVO_EXE(dataDescription))
    }
    else if(req_json.programming === 'python'){

        // res.json(be_export_file.pythonVO_EXE(dataDescription))
    }
    else if(req_json.programming === 'codeigniter4'){

        res.json(be_export_file.codeigniterController(dataDescription))
    }
    else{
        res.json({
            export:false,
        })
    }

})

router.get('/contentStoreProcedure', async (req, res) => {

    let req_json = req.query
    console.log(req_json)
    let dataDescription = {
        dataSet : await connectDB_router.TableDescription(req_json),
        tbName : req_json.tbName,
        provider : req_json.provider,
        databaseName:req_json.databaseName,
    }
    // console.log(req_json)
    res.json(be_export_file.storeProcedure(dataDescription))
    // dataDescription.tbName = req_json.tbName
    // if(req_json.programming === 'nodejs'){

    //     // res.json(be_export_file.nodejsVO_EXE(dataDescription))
    // }
    // else if(req_json.programming === 'python'){

    //     // res.json(be_export_file.pythonVO_EXE(dataDescription))
    // }
    // else if(req_json.programming === 'codeigniter4'){

    //     res.json(be_export_file.codeigniterController(dataDescription))
    // }
    // else{
    //     res.json({
    //         export:false,
    //     })
    // }

})


module.exports = router