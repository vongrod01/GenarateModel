const { header } = require('./header')

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
    let methodService = `
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

    async add(DataModel) {
        try {
            let params = [
                ${paramsListService}
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

    async edit(DataModel) {
        try {
            let params = [
                ${paramsListService}
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

    async search(DataModel) {
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
    return {
        export: true,
        content: content,
        fileName: `${className}.js`
    }
}

module.exports.nodejsModelService = nodejsModelService
