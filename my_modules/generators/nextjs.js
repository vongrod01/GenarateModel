const { header } = require('./header')

function nextjsModelService(dataDescription) {
    // console.table(dataDescription)
    let classModel = ``
    let classService = ``
    let className = ''
    let constructorModel = `constructor() {
        super()
        `
    let getterSetterModel = ''
    let paramsListService = ''

    dataDescription.tbName.split('_').forEach(str => {
        // ตัด "_" ออก แล้วเปลี่ยนตัวอักษรแรกเป็นพิมพ์ใหญ่
        str.charAt(0).toUpperCase() + str.slice(1);
        className += str.charAt(0).toUpperCase() + str.slice(1)
    });
    let constructorService = `constructor(connGroup) {
        super(connGroup)
        this.result = new ${className}Model()
    }`

    dataDescription.dataSet.forEach(field => {
        let initValue
        if (['int', 'tinyint', 'smallint', 'bigint', 'decimal'].includes(field.FieldType)) {
            initValue = 0
        }
        else if (['date', 'datetime'].includes(field.FieldType)) {
            initValue = 'new Date()'
        }
        else {
            initValue = "''"
        }
        constructorModel += `this._${field.FieldName} = ${initValue}
        `
        getterSetterModel += `
    get ${field.FieldName}() {
        return this._${field.FieldName};
    }
    set ${field.FieldName}(value) {
        this._${field.FieldName} = value
    }
        `
        paramsListService += `          ${field.FieldName} : DataModel.${field.FieldName},
    `
    });
    constructorModel += '}'
    classModel += `
export class ${className}Model extends BaseModel {
    ${constructorModel}
    ${getterSetterModel}
}   
     `
    let methodService = `
    async get(ID) {
        try {

            const dataset = await this.callSp('${dataDescription.tbName}_get', { ID })
            if (dataset.length > 0) {
                this.result.jsonAssignToAttr(dataset[0])
                return this.result
            }
            else {
                return null
            }
        } catch (error) {
            this.logErrorExec('****** Error ${dataDescription.tbName}_get : ' + error + '******')
            return null
        }
    }

    async add(DataModel) {
        try {
            let params = {
                ${paramsListService}
            }
            const dataset = await this.callSp('${dataDescription.tbName}_add', params)
            if (dataset.length > 0) {
                return this.get(dataset[0].ID)
            }
            else {
                return null
            }

        } catch (error) {
            this.logErrorExec('****** Error ${dataDescription.tbName}_add : ' + error + '******')
            return null
        }
    }

    async edit(DataModel) {
        try {
            let params = {
                ${paramsListService}
            }
            await this.callSp('${dataDescription.tbName}_edit', params)
            return this.get(DataModel.ID)

        } catch (error) {
            this.logErrorExec('****** Error ${dataDescription.tbName}_edit : ' + error + '******')
            return null
        }
    }

    async delete(ID) {
        try {
            await this.callSp('${dataDescription.tbName}_delete', { ID })
            return true

        } catch (error) {
            this.logErrorExec('****** Error ${dataDescription.tbName}_delete : ' + error + '******')
            return false
        }
    }

    async search(DataModel) {
        try {
            let params = {
                ${paramsListService}
            }
            const dataset = await this.callSp('${dataDescription.tbName}_search', params)
            return dataset
        } catch (error) {
            this.logErrorExec('****** Error ${dataDescription.tbName}_search : ' + error + '******')
            return []
        }
    }
     
     `
    classService += `
export class ${className}Service extends BaseService {   
    ${constructorService}
    ${methodService}
}
    `

    let content = `/*\n${header()}*/
import 'server-only'
import { BaseModel, BaseService } from './BaseClass'
    ${classModel}
    ${classService}
    `
    return {
        export: true,
        content: content,
        fileName: `${className}.js`
    }
}

module.exports.nextjsModelService = nextjsModelService
