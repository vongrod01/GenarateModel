const { header } = require('./header')
const { describePk, noPkNote } = require('./pk')

function pythonModelService(dataDescription) {
    let classModel = ``
    let classService = ``
    let className = ''
    let constructorModel = `def __init__(self):

        `
    let getterSetterModel = ''
    let paramsListService = ''

    // key columns come from the database (IsPrimaryKey / IsIdentity), not from column names
    const pk = describePk(dataDescription.dataSet)
    const keyArgs = pk.join(k => k.FieldName)                           // get(self, OrderID, LineNo)
    const keyFromModel = pk.join(k => `DataModel.${k.FieldName}`)       // DataModel.OrderID, DataModel.LineNo
    // after add: an identity key is handed back by the connection, a key the caller supplied is on the model
    const keyAfterAdd = pk.join(k => pk.isIdentity(k) ? 'self.result_params' : `DataModel.${k.FieldName}`)

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
    // get / edit / delete need a key; without one only add and search are generated
    const methodGet = pk.has ? `
    def get(self, ${keyArgs}):
        try:
            self.call_sp('${dataDescription.tbName}_get', [${keyArgs}])
            if len(self.data_set) > 0:
                self.result.dict_to_props(self.dataSet[0])
                return self.result
            else:
                return None
        except Exception as err:
            self.err_exe(f'****** Error ${dataDescription.tbName}_get : {err} ******')
            self.data_set = []
            return None
` : ''
    const methodAdd = pk.has ? `
    def add(self, DataModel):
        params = [
            ${paramsListService}
        ]
        try:
            self.call_sp('${dataDescription.tbName}_add', params)
            return self.get(${keyAfterAdd})
        except Exception as err:
            self.err_exe(f'****** Error ${dataDescription.tbName}_add : {err} ******')
            self.data_set = []
            return None
` : `
    # ${noPkNote(dataDescription.tbName)}
    def add(self, DataModel):
        params = [
            ${paramsListService}
        ]
        try:
            self.call_sp('${dataDescription.tbName}_add', params)
            return DataModel
        except Exception as err:
            self.err_exe(f'****** Error ${dataDescription.tbName}_add : {err} ******')
            self.data_set = []
            return None
`
    const methodEdit = pk.has ? `
    def edit(self, DataModel):
        params = [
            ${paramsListService}
        ]
        try:
            self.call_sp('${dataDescription.tbName}_edit', params)
            return self.get(${keyFromModel})
        except Exception as err:
            self.err_exe(f'****** Error ${dataDescription.tbName}_edit : {err} ******')
            self.data_set = []
            return None
` : ''
    const methodDelete = pk.has ? `
    def delete(self, ${keyArgs}):
        try:
            self.call_sp('${dataDescription.tbName}_delete', [${keyArgs}])
            return True
        except Exception as err:
            self.err_exe(f'****** Error ${dataDescription.tbName}_delete : {err} ******')
            return False
` : ''
    const methodSearch = `
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
    let methodService = `${methodGet}${methodAdd}${methodEdit}${methodDelete}${methodSearch}`
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
    let result = {
        export: true,
        content: content,
        fileName: `${className}.py`
    }
    if (!pk.has) result.warning = noPkNote(dataDescription.tbName)
    return result
}

module.exports.pythonModelService = pythonModelService
