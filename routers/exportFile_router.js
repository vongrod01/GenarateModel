const express = require('express')
const router = express.Router()
const connMysql = require('../my_modules/mysql.js')
const connectDB_router = require('./connectDB_router')

router.get('/contentBase', async (req, res) => {
    let req_json = JSON.parse(req.query.req_json)
    let programming = req_json.programming;
    let provider = req_json.provider;
    let content = ''
    if (programming === 'nodejs') {
        let importDB = ''
        if (provider === 'mysql') {
            importDB = `const mysql = require('../my_modules/mysql.js')`
        }
        else {

        }
        content = `
${importDB}
class BaseVO {
    constructor() {

    }
    assignTo(destination) {
        let jsonData = JSON.parse(JSON.stringify(this))
        for (var key in jsonData) {
            if (destination[key] !== undefined) {
                destination[key] = jsonData[key]
            }
            else {
                console.log('This destination.attribute(' + key + ') does not exist in ' + this.constructor.name + '.')
            }
        }
    }
    toJson() {
        let jsonData = JSON.parse(JSON.stringify(this))
        let newData = {}
        for (var key in jsonData) {
            let newKey = key[0] === '_' ? key.slice(1, key.length) : key
            newData[newKey] = jsonData[Key]
        }
        return newData
    }
    jsonAssignToAttr(jsonData) {
        if (typeof jsonData === 'object') {
            for (var key in jsonData) {
                if (this[key] !== undefined) {
                    this[key] = jsonData[key]
                }
                else {
                    console.log('This attribute(' + key + ') does not exist in ' + this.constructor.name + '.')
                }
            }
        }
    }
}
class BaseEXE extends mysql.MysqlConnection {
    constructor(connDetail) {
        super(connDetail)
    }
    logErrorExec(err) {
        let dividingLine = ''
        for (let index = 0; index < dividingLine.length; index++) {
            dividingLine += '-'

        }
        console.log(dividingLine)
        console.log(err)
        console.log(dividingLine)
    }
}


module.exports.BaseVO = BaseVO
module.exports.BaseEXE = BaseEXE
        
    `
        res.json({
            content: content,
            fileName: 'BaseClass.js'
        })
    }
    else {
        res.json([])
    }
})

router.get('/contentVO_EXE', async (req, res) => {

    let req_json = JSON.parse(req.query.req_json)
    dataDescription = await connectDB_router.TableDescription(req_json)
    let classVO = ``
    let classEXE = ``
    let className = ''
    let constructorVO = `constructor() {
        super()
        `
    let getterSetterVO = ''
    let paramsListEXE = ''
    
    req_json.tbName.split('_').forEach(str => {
        // ตัด "_" ออก แล้วเปลี่ยนตัวอักษรแรกเป็นพิมพ์ใหญ่
        str.charAt(0).toUpperCase() + str.slice(1);
        className += str.charAt(0).toUpperCase() + str.slice(1)
    });
    let constructorEXE = `constructor(connDetail) {
        super(connDetail)
        this.result = new ${className}VO()
    }`

    dataDescription[1].forEach(field => {
        constructorVO += `this._${field.FieldName} = ${['int', 'tinyint', 'smallint', 'decimal'].includes(field.FieldType) ? 0 : "''"}
        `
        getterSetterVO += `
    get ${field.FieldName}() {
        return this._${field.FieldName};
    }
    set ${field.FieldName}(value) {
        this._${field.FieldName} = value
    }
        `
    paramsListEXE += `          DataVO.${field.FieldName},
    `
    });
    constructorVO += '}'
    classVO += `
class ${className}VO extends BaseClass.BaseVO {
    ${constructorVO}
    ${getterSetterVO}
}   
     `
    let methodEXE = `
    async get(RxNo) {
        try {

            await this.callSp('${req_json.tbName}_get', [RxNo])
            if (this.dataSet.length > 0) {
                this.result.jsonAssignToAttr(this.dataSet[0])
                return this.result
            }
            else {
                return null
            }
        } catch (error) {
            this.logErrorExec('****** Error req_json.tbName_get : ' + error + '******')
            this.dataSet = []
            return null
        }
    }

    async add(DataVO) {
        try {
            let params = [
                ${paramsListEXE}
            ]
            await this.callSp('${req_json.tbName}_add', params)
            let RxNo = this.paramsOut.Param1
            return this.get(RxNo)

        } catch (error) {
            this.logErrorExec('****** Error ${req_json.tbName}_add : ' + error + '******')
            this.dataSet = []
            return null
        }
    }

    async edit(DataVO) {
        try {
            let params = [
                ${paramsListEXE}
            ]
            await this.callSp('${req_json.tbName}_edit', params)
            let RxNo = this.paramsOut.Param1
            return this.get(RxNo)

        } catch (error) {
            this.logErrorExec('****** Error ${req_json.tbName}_edit : ' + error + '******')
            this.dataSet = []
            return null
        }
    }

    async delete(RxNo) {
        try {
            await this.callSp('${req_json.tbName}_delete', [RxNo])
            return true

        } catch (error) {
            this.logErrorExec('****** Error ${req_json.tbName}_delete : ' + error + '******')
            return false
        }
    }

    async search(DataVO) {
        try {
            let params = [
                ${paramsListEXE}
            ]
            await this.callSp('${req_json.tbName}_search', params)
        } catch (error) {
            this.logErrorExec('****** Error ${req_json.tbName}_search : ' + error + '******')
            this.dataSet = []

        }
        return this.dataSet
    }
     
     `
    classEXE += `
class ${className}EXE extends BaseClass.BaseEXE {   
    ${constructorEXE}
    ${methodEXE}
}
    `

    let content = `const BaseClass = require('./BaseClass')
    ${classVO}
    ${classEXE}
module.exports.${className}VO = ${className}VO
module.exports.${className}EXE = ${className}EXE
    `

    res.json({
        content: content,
        fileName: `${className}.js`
    })
    // console.log(data)
})


module.exports = router