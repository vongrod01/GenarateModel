const { header } = require('./header')
const { describePk, noPkNote } = require('./pk')

const NUMERIC_TYPES = ['int', 'tinyint', 'smallint', 'bigint', 'decimal', 'numeric']

function codeigniterModelService(dataDescription) {
    console.log('dataDescription.databaseName : ', dataDescription.databaseName)

    let tbFullName = `${dataDescription.databaseName}.dbo.${dataDescription.tbName}`
    let className = ''
    dataDescription.tbName.split('_').forEach(str => {
        // ตัด "_" ออก แล้วเปลี่ยนตัวอักษรแรกเป็นพิมพ์ใหญ่
        str.charAt(0).toUpperCase() + str.slice(1);
        className += str.charAt(0).toUpperCase() + str.slice(1)
    });
    let result = {
        export: true,
        content: [],
        fileName: []
    }
    let content = '';

    // key columns come from the database (IsPrimaryKey / IsIdentity), not from column names
    const pk = describePk(dataDescription.dataSet)
    const keyArgs = pk.join(k => `$${k.FieldName}`)                       // _Get($OrderID, $LineNo)
    const keyFromModel = pk.join(k => `$DataModel->${k.FieldName}`)       // $DataModel->OrderID, ...
    const keyFromRow = pk.join(k => `$${k.FieldName} = $result[0]->${k.FieldName};`, `
            `)                                                            // the add procedure OUTPUTs the key
    if (!pk.has) result.warning = noPkNote(dataDescription.tbName)

    let getterModel = `
    public function __get($prop_name)
    {
        switch ($prop_name) {
    `
    let setterModel = `
    public function __set($prop_name, $value)
    {
        switch ($prop_name) {
    `
    let paramsListService = {
        'add': '',
        'edit': '',
        'search': ''
    }
    let constructorModel = `
    function __construct($objModel = null)
    {
    `
    // Construct
    dataDescription.dataSet.forEach(field => {
        let initValue
        if (['int', 'tinyint', 'smallint', 'bigint', 'decimal'].includes(field.FieldType)) {
            initValue = '0;'
        }
        else if (['date', 'datetime'].includes(field.FieldType)) {
            initValue = 'date("Y-m-d H:i:s");'
        }
        else {
            initValue = '"";'
        }
        constructorModel += `  $this->${field.FieldName} = ${initValue}
        `

        getterModel += `
            case '${field.FieldName}':
                return $this->props[$prop_name];
                break;`
        setterModel += `
            case '${field.FieldName}':
                $this->props[$prop_name] = ${['int', 'tinyint', 'smallint', 'bigint', 'decimal'].includes(field.FieldType) ? '(int)' : ''}$value;
                break;`

        // call_sp passes parameters by position, so these lists must mirror the stored procedures
        // (see sql.js): an identity column is never sent to add / edit, a key the database does not
        // generate is sent to add, edit and search.
        const param = `          $DataModel->${field.FieldName},
`
        if (field.FieldName != 'AddWhen' && field.FieldName != 'UpdateWhen' && field.FieldName != 'DeleteBy' && field.FieldName != 'DeleteWhen') {
            if (pk.isKey(field)) {
                paramsListService.edit += param
                if (pk.isInsertKey(field)) {
                    paramsListService.add += param
                    paramsListService.search += param
                }
            }
            else if (field.FieldName == 'AddBy') {
                paramsListService.add += param
            }
            else if (field.FieldName == 'UpdateBy') {
                paramsListService.edit += param
            }
            else {
                paramsListService.search += param
                if (!pk.isIdentity(field)) {
                    paramsListService.add += param
                    paramsListService.edit += param
                }
            }

        }



        //         paramsListService += `          $DataModel->${field.FieldName},
        // `
    });

    constructorModel += `
    }
    `
    getterModel += `
            default:
                return null;
                break;
        }
    }
    `
    setterModel += `
            default:
                $this->props[$prop_name] = $value;
                break;
        }
    }
    `
    content = `<?php namespace App\\My_Models;
/*\n${header()}*/

use App\\My_Models\\BaseModel;

class ${className}Model extends BaseModel
{
${constructorModel}
${getterModel}
${setterModel}
}
    `
    result.content.push(content)
    result.fileName.push(`${className}Model.php`)
    // จบ Model
    // -----------------------------------------------------------


    let constructorService = `
    public $_result;
    function __construct($conn_group = null)
    {
        parent::__construct($conn_group);
        $this->_result = new ${className}Model();
    }
    `

    // get / edit / delete need a key; without one only add and search are generated
    const methodGet = pk.has ? `    public function _Get(${keyArgs})
    {
        $this->call_sp('${tbFullName}_get', [${keyArgs}]);
        if (count($this->data_set) > 0) {
            $this->_result->dataAssignToProps($this->data_set[0]);
            return $this->_result;
        } else {
            return null;
        }
    }

` : ''
    const methodSearch = `    public function _Search($DataModel)
    {
        $params = [
            ${paramsListService.search}
        ];
        return $this->call_sp('${tbFullName}_search', $params);
    }

`
    const methodAdd = pk.has ? `    public function _Add($DataModel)
    {
        $params = [
            ${paramsListService.add}
        ];
        $result = $this->call_sp('${tbFullName}_add', $params);
        if ($result != null and count($result) > 0) {
            ${keyFromRow}
            return $this->_Get(${keyArgs});
        } else {
            return null;
        }
    }

` : `    // ${noPkNote(dataDescription.tbName)}
    public function _Add($DataModel)
    {
        $params = [
            ${paramsListService.add}
        ];
        $this->call_sp('${tbFullName}_add', $params);
        return $DataModel;
    }

`
    const methodEdit = pk.has ? `    public function _Edit($DataModel)
    {
        $params = [
            ${paramsListService.edit}
        ];
        $this->call_sp('${tbFullName}_edit', $params);
        return $this->_Get(${keyFromModel});
    }

` : ''
    const methodDelete = pk.has ? `    public function _Delete(${keyArgs})
    {
        $this->call_sp('${tbFullName}_delete', [${keyArgs}]);
        if($this->_Get(${keyArgs}) === null){
            return true;
        }
        else{
            return false;
        }
    }

     ` : ''
    let methodService = `
${methodGet}${methodSearch}${methodAdd}${methodEdit}${methodDelete}`
    content = `<?php namespace App\\My_Models;
/*\n${header()}*/

use App\\My_Models\\BaseService;
use App\\My_Models\\${className}Model;

class ${className}Service extends BaseService
{
    ${constructorService}
    ${methodService}
}
    `
    result.content.push(content)
    result.fileName.push(`${className}Service.php`)
    // จบ Service
    // -----------------------------------------------------------


    return result
}

function codeigniterController(dataDescription) {
    let className = ''
    dataDescription.tbName.split('_').forEach(str => {
        // ตัด "_" ออก แล้วเปลี่ยนตัวอักษรแรกเป็นพิมพ์ใหญ่
        str.charAt(0).toUpperCase() + str.slice(1);
        className += str.charAt(0).toUpperCase() + str.slice(1)
    });
    let result = {
        export: true,
        content: '',
        fileName: ''
    }

    // key columns come from the database (IsPrimaryKey), not from column names
    const pk = describePk(dataDescription.dataSet)
    const keyArgs = pk.join(k => `$${k.FieldName}`)
    const isNumeric = (k) => NUMERIC_TYPES.includes(k.FieldType)
    // read each key from the request; a key counts as present when it is not null / 0 (numbers) or not '' (text)
    const keyRead = pk.join(k => `$${k.FieldName} = ${isNumeric(k) ? '(int)' : '(string)'}$this->request->getVar("${k.FieldName}");`, `
            `)
    const keyPresent = pk.join(k => isNumeric(k)
        ? `$${k.FieldName} !== null and $${k.FieldName} !== 0`
        : `$${k.FieldName} !== null and $${k.FieldName} !== ''`, ' and ')
    if (!pk.has) result.warning = noPkNote(dataDescription.tbName)

    const M = `$${className}Model`
    const S = `$${className}Service`
    // [condition, body] per HTTP method; get / put / delete by key only exist when the table has a key
    const branches = []
    if (pk.has) {
        branches.push([`$method == "get" and ${keyPresent}`, `                // GET

                if (${S}->_Get(${keyArgs}) !== null) {
                    ${S}->_result->assignTo(${M});
                    return $this->respond(${M}->getProps(), 200);
                } else {
                    return $this->respond(["Message" => "No Content"], 200);
                }
`])
    }
    branches.push([`$method == "get"`, `                // SEARCH
                ${M}->dataAssignToProps($data_req);
                ${S}->_Search(${M});
                return $this->respond(${S}->data_set, 200);
`])
    branches.push([`$method == "post"`, `                // ADD
                ${M}->dataAssignToProps($data_req);
                if (${S}->_Add(${M}) !== null) {
                    ${S}->_result->assignTo(${M});
                    return $this->respond(${M}->getProps(), 200);
                } else {
                    return $this->respond(["Message" => "Not Modified"], 200);
                }
`])
    if (pk.has) {
        branches.push([`$method == "put"`, `                // EDIT
                if (${S}->_Get(${keyArgs}) !== null) {
                    ${S}->_result->assignTo(${M});
                    ${M}->dataAssignToProps($data_req);
                    if (${S}->_Edit(${M}) !== null) {
                        ${S}->_result->assignTo(${M});
                        return $this->respond(${M}->getProps(), 200);
                    } else {
                        return $this->respond(["Message" => "Not Modified"], 200);
                    }
                } else {
                    return $this->respond(["Message" => "Not Modified"], 200);
                }
`])
        branches.push([`$method == "delete"`, `                // DELETE
                if (${S}->_Delete(${keyArgs})) {
                    return $this->respond(["Message" => "Successfully deleted data"], 200);
                } else {
                    return $this->respond(["Message" => "Not Modified"], 200);
                }
`])
    }
    const chain = branches.map(([cond, body], i) => `            ${i === 0 ? 'if' : '} elseif'} (${cond}) {
${body}`).join('') + '            }\n'

    let content = `<?php namespace App\\Controllers;
/*\n${header()}*/

use CodeIgniter\\RESTful\\ResourceController;
use App\\My_Models\\${className}Model;
use App\\My_Models\\${className}Service;

class ${className}Controller extends ResourceController
{
    public function Process()
    {
        try {
            $method = $this->request->getMethod();
            $data_req = $this->request->getVar();
            ${pk.has ? keyRead : `// ${noPkNote(dataDescription.tbName)}`}
            ${M} = new ${className}Model();
            ${S} = new ${className}Service();
${chain}        } catch (\\Throwable $th) {
            return $this->respond(["error" => $th->getMessage()], 404);
        }
    }
}

    `;




    result.content = content;
    result.fileName = `${className}Controller.php`


    return result
}

module.exports.codeigniterModelService = codeigniterModelService
module.exports.codeigniterController = codeigniterController
