const { header } = require('./header')
const { describePk, noPkNote } = require('./pk')

function nodejsModelService(dataDescription) {
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
    // after add / edit the key is read back: an identity key comes back in its OUT parameter
    // (position = its place in the parameter list), a key the caller supplied is taken from the model
    const keyReadBack = pk.join(k => `let ${k.FieldName} = ${pk.isIdentity(k)
        ? `this.paramsOut.Param${pk.indexOf(k) + 1}`
        : `DataModel.${k.FieldName}`}`, `
            `)

    dataDescription.tbName.split('_').forEach(str => {
        // ตัด "_" ออก แล้วเปลี่ยนตัวอักษรแรกเป็นพิมพ์ใหญ่
        str.charAt(0).toUpperCase() + str.slice(1);
        className += str.charAt(0).toUpperCase() + str.slice(1)
    });
    let constructorService = `constructor(connDetail) {
        super(connDetail)
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
        paramsListService += `          DataModel.${field.FieldName},
    `
    });
    constructorModel += '}'
    classModel += `
class ${className}Model extends BaseClass.BaseModel {
    ${constructorModel}
    ${getterSetterModel}
}
     `
    // get / edit / delete need a key; without one only add and search are generated
    const methodGet = pk.has ? `    async get(${keyArgs}) {
        try {

            await this.callSp('${dataDescription.tbName}_get', [${keyArgs}])
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

` : ''
    const methodAdd = pk.has ? `    async add(DataModel) {
        try {
            let params = [
                ${paramsListService}
            ]
            await this.callSp('${dataDescription.tbName}_add', params)
            ${keyReadBack}
            return this.get(${keyArgs})

        } catch (error) {
            this.logErrorExec('****** Error ${dataDescription.tbName}_add : ' + error + '******')
            this.dataSet = []
            return null
        }
    }

` : `    // ${noPkNote(dataDescription.tbName)}
    async add(DataModel) {
        try {
            let params = [
                ${paramsListService}
            ]
            await this.callSp('${dataDescription.tbName}_add', params)
            return DataModel

        } catch (error) {
            this.logErrorExec('****** Error ${dataDescription.tbName}_add : ' + error + '******')
            this.dataSet = []
            return null
        }
    }

`
    const methodEdit = pk.has ? `    async edit(DataModel) {
        try {
            let params = [
                ${paramsListService}
            ]
            await this.callSp('${dataDescription.tbName}_edit', params)
            ${keyReadBack}
            return this.get(${keyArgs})

        } catch (error) {
            this.logErrorExec('****** Error ${dataDescription.tbName}_edit : ' + error + '******')
            this.dataSet = []
            return null
        }
    }

` : ''
    const methodDelete = pk.has ? `    async delete(${keyArgs}) {
        try {
            await this.callSp('${dataDescription.tbName}_delete', [${keyArgs}])
            return true

        } catch (error) {
            this.logErrorExec('****** Error ${dataDescription.tbName}_delete : ' + error + '******')
            return false
        }
    }

` : ''
    const methodSearch = `    async search(DataModel) {
        try {
            let params = [
                ${paramsListService}
            ]
            await this.callSp('${dataDescription.tbName}_search', params)
        } catch (error) {
            this.logErrorExec('****** Error ${dataDescription.tbName}_search : ' + error + '******')
            this.dataSet = []

        }
        return this.dataSet
    }

     `
    let methodService = `
${methodGet}${methodAdd}${methodEdit}${methodDelete}${methodSearch}`
    classService += `
class ${className}Service extends BaseClass.BaseService {
    ${constructorService}
    ${methodService}
}
    `

    let content = `/*\n${header()}*/
const BaseClass = require('./BaseClass')
    ${classModel}
    ${classService}
module.exports.${className}Model = ${className}Model
module.exports.${className}Service = ${className}Service
    `
    let result = {
        export: true,
        content: content,
        fileName: `${className}.js`
    }
    if (!pk.has) result.warning = noPkNote(dataDescription.tbName)
    return result
}

module.exports.nodejsModelService = nodejsModelService
