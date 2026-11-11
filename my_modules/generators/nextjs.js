const { header } = require('./header')

function nextjsVO_EXE(dataDescription) {
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
    let constructorEXE = `constructor(connGroup) {
        super(connGroup)
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
        paramsListEXE += `          ${field.FieldName} : DataVO.${field.FieldName},
    `
    });
    constructorVO += '}'
    classVO += `
export class ${className}VO extends BaseVO {
    ${constructorVO}
    ${getterSetterVO}
}   
     `
    let methodEXE = `
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

    async add(DataVO) {
        try {
            let params = {
                ${paramsListEXE}
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

    async edit(DataVO) {
        try {
            let params = {
                ${paramsListEXE}
            }
            await this.callSp('${dataDescription.tbName}_edit', params)
            return this.get(DataVO.ID)

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

    async search(DataVO) {
        try {
            let params = {
                ${paramsListEXE}
            }
            const dataset = await this.callSp('${dataDescription.tbName}_search', params)
            return dataset
        } catch (error) {
            this.logErrorExec('****** Error ${dataDescription.tbName}_search : ' + error + '******')
            return []
        }
    }
     
     `
    classEXE += `
export class ${className}EXE extends BaseEXE {   
    ${constructorEXE}
    ${methodEXE}
}
    `

    let content = `/*\n${header()}*/
import 'server-only'
import { BaseVO, BaseEXE } from './BaseClass'
    ${classVO}
    ${classEXE}
    `
    return {
        export: true,
        content: content,
        fileName: `${className}.js`
    }
}

module.exports.nextjsVO_EXE = nextjsVO_EXE
