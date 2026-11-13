const express = require('express')
const router = express.Router()
const connectDB_router = require('./connectDB_router')
const be_export_file = require('../my_modules/be_export_file')

router.post('/contentDBService', async (req, res) => {
    let req_json = req.body
    let programming = req_json.programming;
    let provider = req_json.provider;
   let nameSpace = req_json.nameSpace;
    res.json(be_export_file.dbService(programming,provider,nameSpace))
})

router.post('/contentBase', async (req, res) => {
    let req_json = req.body
    let programming = req_json.programming;
    let provider = req_json.provider;
    let nameSpace = req_json.nameSpace;
    res.json(be_export_file.baseModelService(programming,provider,nameSpace))
})



router.post('/contentModelService', async (req, res) => {

    let req_json = req.body
    let nameSpace = req_json.nameSpace;
    let dataDescription = {
        dataSet : await connectDB_router.TableDescription(req_json),
        tbName : req_json.tbName,
        databaseName:req_json.databaseName,
    }
    
    
    // dataDescription.tbName = req_json.tbName
    if(req_json.programming === 'nodejs'){

        res.json(be_export_file.nodejsModelService(dataDescription))
    }
    else if(req_json.programming === 'nextjs'){

        res.json(be_export_file.nextjsModelService(dataDescription))
    }
    else if(req_json.programming === 'python'){

        res.json(be_export_file.pythonModelService(dataDescription))
    }
    else if(req_json.programming === 'codeigniter4'){

        res.json(be_export_file.codeigniterModelService(dataDescription))
    }
    else if(req_json.programming === '.net 4.5'){

        res.json(be_export_file.dotNet4_5_ModelService(dataDescription,nameSpace))
    }
    else{
        res.json({
            export:false,
        })
    }

})
router.post('/contentController', async (req, res) => {

    let req_json = req.body
    let dataDescription = {
        dataSet : await connectDB_router.TableDescription(req_json),
        tbName : req_json.tbName,
        databaseName:req_json.databaseName,
    }
    let nameSpace = req_json.nameSpace;
    
    // dataDescription.tbName = req_json.tbName
    if(req_json.programming === 'nodejs'){

        // res.json(be_export_file.nodejsModelService(dataDescription))
    }
    else if(req_json.programming === 'python'){

        // res.json(be_export_file.pythonModelService(dataDescription))
    }
    else if(req_json.programming === 'codeigniter4'){

        res.json(be_export_file.codeigniterController(dataDescription))
    }
    else if(req_json.programming === '.net 4.5'){

        res.json(be_export_file.dotNet4_5Controller(dataDescription,nameSpace))
    }
    else{
        res.json({
            export:false,
        })
    }

})

router.post('/contentStoreProcedure', async (req, res) => {

    let req_json = req.body
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

    //     // res.json(be_export_file.nodejsModelService(dataDescription))
    // }
    // else if(req_json.programming === 'python'){

    //     // res.json(be_export_file.pythonModelService(dataDescription))
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

router.post('/contentIndexTable', async (req, res) => {

    let req_json = req.body
    let dataDescription = {
        dataSet : await connectDB_router.TableDescription(req_json),
        tbName : req_json.tbName,
        provider : req_json.provider,
        databaseName:req_json.databaseName,
    }
    // console.log("dataDescription : ",dataDescription)
    res.json(be_export_file.indexTable(dataDescription))
    
    // dataDescription.tbName = req_json.tbName
    // if(req_json.programming === 'nodejs'){

    //     // res.json(be_export_file.nodejsModelService(dataDescription))
    // }
    // else if(req_json.programming === 'python'){

    //     // res.json(be_export_file.pythonModelService(dataDescription))
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