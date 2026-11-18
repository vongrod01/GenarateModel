const { header } = require('./header')
const { describePk, noPkNote } = require('./pk')

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

    // key columns come from the database (IsPrimaryKey / IsIdentity), not from column names
    const pk = describePk(dataDescription.dataSet)
    const keyArgs = pk.join(k => k.FieldName)                           // get(OrderID, LineNo)
    const keyFromModel = pk.join(k => `DataModel.${k.FieldName}`)       // DataModel.OrderID, DataModel.LineNo
    const keyFromRow = pk.join(k => `dataset[0].${k.FieldName}`)        // the add procedure OUTPUTs the key

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
    // get / edit / delete need a key; without one only add and search are generated
    const methodGet = pk.has ? `    async get(${keyArgs}) {
        try {

            const dataset = await this.callSp('${dataDescription.tbName}_get', { ${keyArgs} })
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

` : ''
    const methodAdd = pk.has ? `    async add(DataModel) {
        try {
            let params = {
                ${paramsListService}
            }
            const dataset = await this.callSp('${dataDescription.tbName}_add', params)
            if (dataset.length > 0) {
                return this.get(${keyFromRow})
            }
            else {
                return null
            }

        } catch (error) {
            this.logErrorExec('****** Error ${dataDescription.tbName}_add : ' + error + '******')
            return null
        }
    }

` : `    // ${noPkNote(dataDescription.tbName)}
    async add(DataModel) {
        try {
            let params = {
                ${paramsListService}
            }
            await this.callSp('${dataDescription.tbName}_add', params)
            return DataModel

        } catch (error) {
            this.logErrorExec('****** Error ${dataDescription.tbName}_add : ' + error + '******')
            return null
        }
    }

`
    const methodEdit = pk.has ? `    async edit(DataModel) {
        try {
            let params = {
                ${paramsListService}
            }
            await this.callSp('${dataDescription.tbName}_edit', params)
            return this.get(${keyFromModel})

        } catch (error) {
            this.logErrorExec('****** Error ${dataDescription.tbName}_edit : ' + error + '******')
            return null
        }
    }

` : ''
    const methodDelete = pk.has ? `    async delete(${keyArgs}) {
        try {
            await this.callSp('${dataDescription.tbName}_delete', { ${keyArgs} })
            return true

        } catch (error) {
            this.logErrorExec('****** Error ${dataDescription.tbName}_delete : ' + error + '******')
            return false
        }
    }

` : ''
    const methodSearch = `    async search(DataModel) {
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
    let methodService = `
${methodGet}${methodAdd}${methodEdit}${methodDelete}${methodSearch}`
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
    let result = {
        export: true,
        content: content,
        fileName: `${className}.js`
    }
    if (!pk.has) result.warning = noPkNote(dataDescription.tbName)
    return result
}

module.exports.nextjsModelService = nextjsModelService
