const { header } = require('./header')

function pythonModelService(dataDescription) {
    let classModel = ``
    let classService = ``
    let className = ''
    let constructorModel = `def __init__(self):
        
        `
    let getterSetterModel = ''
    let paramsListService = ''

    dataDescription.tbName.split('_').forEach(str => {
        // ตัด "_" ออก แล้วเปลี่ยนตัวอักษรแรกเป็นพิมพ์ใหญ่
        str.charAt(0).toUpperCase() + str.slice(1);
        className += str.charAt(0).toUpperCase() + str.slice(1)
    });
    let constructorService = `def __init__(self, config_connection):
        super(${className}Service, self).__init__(config_connection)
        self.result = ${className}Model()
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
        constructorModel += `self.${field.FieldName} = ${initValue}
        `
        getterSetterModel += `
    @property
    def ${field.FieldName}(self):
        return self.__${field.FieldName}

    @${field.FieldName}.setter
    def ${field.FieldName}(self, ${field.FieldName}):
        self.__${field.FieldName} = ${field.FieldName}
    `
        paramsListService += `          DataModel.${field.FieldName},
    `
    });

    classModel += `
class ${className}Model(BaseModel):
    ${constructorModel}
    ${getterSetterModel}   
     `
    let methodService = `
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

    def add(self, DataModel):
        params = [
            ${paramsListService}
        ]
        try:
            self.call_sp('${dataDescription.tbName}_add', params)
            return self.get(self.result_params)
        except Exception as err:
            self.err_exe(f'****** Error ${dataDescription.tbName}_add : {err} ******')
            self.data_set = []
            return None

    def edit(self, DataModel):
        params = [
            ${paramsListService}
        ]
        try:
            self.call_sp('${dataDescription.tbName}_edit', params)
            return self.get(DataModel.RxNo)
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

    def search(self, DataModel):
        params = [
            ${paramsListService}
        ]
        try:
            self.call_sp('${dataDescription.tbName}_search', params)
        except Exception as err:
            self.err_exe(f'****** Error ${dataDescription.tbName}_search : {err} ******')
            self.data_set = []
        return self.data_set
     `
    classService += `
class ${className}Service(BaseService):   
    ${constructorService}
    ${methodService}

    `

    let content = `${header()}
from .BaseClass import BaseModel,BaseService
import datetime
    ${classModel}
    ${classService}
    `
    return {
        export: true,
        content: content,
        fileName: `${className}.py`
    }
}

module.exports.pythonModelService = pythonModelService
