const { header } = require('./header')

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

    dataDescription.dataSet.forEach(field => {
        let initValue
        if (['int', 'tinyint', 'smallint', 'bigint', 'decimal'].includes(field.FieldType)) {
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

module.exports.pythonVO_EXE = pythonVO_EXE
