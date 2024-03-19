const express = require('express')
const router = express.Router()
const connectDB_router = require('../routers/connectDB_router')
const fs = require("fs")

let systemConfig = JSON.parse(fs.readFileSync('SystemConfig.json', 'utf-8'))

function baseVO_EXE(programming, provider) {
    let content = ''
    if (programming === 'nodejs') {
        let importDB = ''
        if (provider === 'mysql') {
            importDB = `const mysql = require('../my_modules/mysql.js')`
        }
        else {

        }
        content = `/*\n${header()}*/
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
        return {
            export:true,
            content: content,
            fileName: 'BaseClass.js'
        }
    }
    else if (programming === 'python') {
        let importDB = ''
        if (provider === 'mysql') {
            importDB = `from .ConnectionMySQL import ConnectMySQL`
        }
        else {

        }
        content = `${header()}
${importDB}
class BaseVO():
    def to_dict(self):
        return {key.replace(f'_{type(self).__name__}__', ''): value for key, value in self.__dict__.items() if
            not key.startswith('__') and not callable(key)}
    def dict_to_props(self, data_dict):
        if type(data_dict) == dict:
            for key in data_dict:
                try:
                    getattr(self, key) #Check Key have in props obj
                    setattr(self, key, data_dict[key])
                except Exception as e:
                    print(f'''Didn't find key : "{key}" in Object[{type(self).__name__}]''')
            else:
                print('*********** This data is not of type dict. ***********')

    def assign_to(self, destination):
        if(type(self) == type(destination)):
            
            destination.dict_to_props(self.to_dict())
        else:
            print('type not map')

class BaseEXE(ConnectMySQL):
    def __init__(self, config_connection):
        super(BaseEXE, self).__init__(config_connection)

    def err_exe(self, err_str):
        dividing_line = ''
        for i in err_str:
            dividing_line += '-'
        print(dividing_line)
        print(err_str)
        print(dividing_line)
    `
        return {
            export:true,
            content: content,
            fileName: 'BaseClass.py'
        }
    }
    else {
        return {
            export:false
            
        }
    }

}


function header() {
    let headerStr = `Generate By Genarate Model : Ver ${systemConfig.description.version} (Developed by ${systemConfig.description.developer})`
    let frame = ``
    for (let i = 1; i <= 5; i++) {
        if (i === 1 || i === 5) {
            frame += '##########'
            headerStr.split('').map(() => {
                frame += '#'
            })
        }
        else if (i === 2 || i === 4) {
            frame += '#    '
            headerStr.split('').map(() => {
                frame += ' '
            })
            frame += '    #'
        }
        else if (i === 3) {
            frame += '#    ' + headerStr + '    #'
        }

        frame += '\n'
    }

    return frame
}

function nodejsVO_EXE(dataDescription) {
    let classVO = ``
    let classEXE = ``
    let className = ''
    let constructorVO = `constructor() {
        super()
        `
    let getterSetterVO = ''
    let paramsListEXE = ''

    dataDescription.tbName.split('_').forEach(str => {
        // ตัด "_" ออก แล้วเปลี่ยนตัวอักษรแรกเป็นพิมพ์ใหญ่
        str.charAt(0).toUpperCase() + str.slice(1);
        className += str.charAt(0).toUpperCase() + str.slice(1)
    });
    let constructorEXE = `constructor(connDetail) {
        super(connDetail)
        this.result = new ${className}VO()
    }`

    dataDescription[1].forEach(field => {
        let initValue
        if (['int', 'tinyint', 'smallint', 'decimal'].includes(field.FieldType)) {
            initValue = 0
        }
        else if (['date', 'datetime'].includes(field.FieldType)) {
            initValue = 'new Date()'
        }
        else {
            initValue = "''"
        }
        constructorVO += `this._${field.FieldName} = ${initValue}
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

            await this.callSp('${dataDescription.tbName}_get', [RxNo])
            if (this.dataSet.length > 0) {
                this.result.jsonAssignToAttr(this.dataSet[0])
                return this.result
            }
            else {
                return null
            }
        } catch (error) {
            this.logErrorExec('****** Error ${dataDescription.tbName}_get : ' + error + '******')
            this.dataSet = []
            return null
        }
    }

    async add(DataVO) {
        try {
            let params = [
                ${paramsListEXE}
            ]
            await this.callSp('${dataDescription.tbName}_add', params)
            let RxNo = this.paramsOut.Param1
            return this.get(RxNo)

        } catch (error) {
            this.logErrorExec('****** Error ${dataDescription.tbName}_add : ' + error + '******')
            this.dataSet = []
            return null
        }
    }

    async edit(DataVO) {
        try {
            let params = [
                ${paramsListEXE}
            ]
            await this.callSp('${dataDescription.tbName}_edit', params)
            let RxNo = this.paramsOut.Param1
            return this.get(RxNo)

        } catch (error) {
            this.logErrorExec('****** Error ${dataDescription.tbName}_edit : ' + error + '******')
            this.dataSet = []
            return null
        }
    }

    async delete(RxNo) {
        try {
            await this.callSp('${dataDescription.tbName}_delete', [RxNo])
            return true

        } catch (error) {
            this.logErrorExec('****** Error ${dataDescription.tbName}_delete : ' + error + '******')
            return false
        }
    }

    async search(DataVO) {
        try {
            let params = [
                ${paramsListEXE}
            ]
            await this.callSp('${dataDescription.tbName}_search', params)
        } catch (error) {
            this.logErrorExec('****** Error ${dataDescription.tbName}_search : ' + error + '******')
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

    let content = `/*\n${header()}*/
const BaseClass = require('./BaseClass')
    ${classVO}
    ${classEXE}
module.exports.${className}VO = ${className}VO
module.exports.${className}EXE = ${className}EXE
    `
    return {
        export: true,
        content: content,
        fileName: `${className}.js`
    }
}
function pythonVO_EXE(dataDescription) {
    let classVO = ``
    let classEXE = ``
    let className = ''
    let constructorVO = `def __init__(self):
        
        `
    let getterSetterVO = ''
    let paramsListEXE = ''

    dataDescription.tbName.split('_').forEach(str => {
        // ตัด "_" ออก แล้วเปลี่ยนตัวอักษรแรกเป็นพิมพ์ใหญ่
        str.charAt(0).toUpperCase() + str.slice(1);
        className += str.charAt(0).toUpperCase() + str.slice(1)
    });
    let constructorEXE = `def __init__(self, config_connection):
        super(${className}EXE, self).__init__(config_connection)
        self.result = ${className}VO()
        `

    dataDescription[1].forEach(field => {
        let initValue
        if (['int', 'tinyint', 'smallint', 'decimal'].includes(field.FieldType)) {
            initValue = 0
        }
        else if (['date', 'datetime'].includes(field.FieldType)) {
            initValue = 'datetime.datetime.now()'
        }
        else {
            initValue = "''"
        }
        constructorVO += `self.${field.FieldName} = ${initValue}
        `
        getterSetterVO += `
    @property
    def ${field.FieldName}(self):
        return self.__${field.FieldName}

    @${field.FieldName}.setter
    def ${field.FieldName}(self, ${field.FieldName}):
        self.__${field.FieldName} = ${field.FieldName}
    `
        paramsListEXE += `          DataVO.${field.FieldName},
    `
    });

    classVO += `
class ${className}VO(BaseVO):
    ${constructorVO}
    ${getterSetterVO}   
     `
    let methodEXE = `
    def get(self, RxNo):
        try:
            self.call_sp('${dataDescription.tbName}_get', [RxNo])
            if len(self.data_set) > 0:
                self.result.dict_to_props(self.dataSet[0])
                return self.result
            else:
                return None
        except Exception as err:
            self.err_exe(f'****** Error ${dataDescription.tbName}_get : {err} ******')
            self.data_set = []
            return None

    def add(self, DataVO):
        params = [
            ${paramsListEXE}
        ]
        try:
            self.call_sp('${dataDescription.tbName}_add', params)
            return self.get(self.result_params)
        except Exception as err:
            self.err_exe(f'****** Error ${dataDescription.tbName}_add : {err} ******')
            self.data_set = []
            return None

    def edit(self, DataVO):
        params = [
            ${paramsListEXE}
        ]
        try:
            self.call_sp('${dataDescription.tbName}_edit', params)
            return self.get(DataVO.RxNo)
        except Exception as err:
            self.err_exe(f'****** Error ${dataDescription.tbName}_edit : {err} ******')
            self.data_set = []
            return None

    def delete(self, RxNo):
        try:
            self.call_sp('${dataDescription.tbName}_delete', [RxNo])
            return True
        except Exception as err:
            self.err_exe(f'****** Error ${dataDescription.tbName}_delete : {err} ******')
            return False

    def search(self, DataVO):
        params = [
            ${paramsListEXE}
        ]
        try:
            self.call_sp('${dataDescription.tbName}_search', params)
        except Exception as err:
            self.err_exe(f'****** Error ${dataDescription.tbName}_search : {err} ******')
            self.data_set = []
        return self.data_set
     `
    classEXE += `
class ${className}EXE(BaseEXE):   
    ${constructorEXE}
    ${methodEXE}

    `

    let content = `${header()}
from .BaseClass import BaseVO,BaseEXE
import datetime
    ${classVO}
    ${classEXE}
    `
    return {
        export: true,
        content: content,
        fileName: `${className}.py`
    }
}

module.exports.baseVO_EXE = baseVO_EXE
module.exports.nodejsVO_EXE = nodejsVO_EXE
module.exports.pythonVO_EXE = pythonVO_EXE