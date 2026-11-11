const { header } = require('./header')

function nodejsVO_EXE(dataDescription) {
    // console.table(dataDescription)
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

module.exports.nodejsVO_EXE = nodejsVO_EXE
