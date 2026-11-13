const { header } = require('./header')

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
        if (field.FieldName != 'AddWhen' && field.FieldName != 'UpdateWhen' && field.FieldName != 'DeleteBy' && field.FieldName != 'DeleteWhen') {
            if (field.FieldName == 'ID') {

                paramsListService.edit += `          $DataModel->${field.FieldName},
`
            }
            else if (field.FieldName == 'AddBy') {
                paramsListService.add += `          $DataModel->${field.FieldName},
`
            }
            else if (field.FieldName == 'UpdateBy') {
                paramsListService.edit += `          $DataModel->${field.FieldName},
`
            }
            else {
                paramsListService.add += `          $DataModel->${field.FieldName},
`
                paramsListService.search += `          $DataModel->${field.FieldName},
`
                paramsListService.edit += `          $DataModel->${field.FieldName},
`
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

    let methodService = `
    public function _Get($ID)
    {
        $this->call_sp('${tbFullName}_get', [$ID]);
        if (count($this->data_set) > 0) {
            $this->_result->dataAssignToProps($this->data_set[0]);
            return $this->_result;
        } else {
            return null;
        }  
    }

    public function _Search($DataModel)
    {
        $params = [
            ${paramsListService.search}
        ];
        return $this->call_sp('${tbFullName}_search', $params);
    }

    public function _Add($DataModel)
    {
        $params = [
            ${paramsListService.add}
        ];
        $result = $this->call_sp('${tbFullName}_add', $params);
        if ($result != null and count($result) > 0) {
            $ID = $result[0]->ID;
            return $this->_Get($ID);
        } else {
            return null;
        }
    }

    public function _Edit($DataModel)
    {
        $params = [
            ${paramsListService.edit}
        ];
        $this->call_sp('${tbFullName}_edit', $params);
        return $this->_Get($DataModel->ID);
    }
    
    public function _Delete($ID)
    {
        $this->call_sp('${tbFullName}_delete', [$ID]);
        if($this->_Get($ID) === null){
            return true;
        }
        else{
            return false;
        }
    }
     
     `
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
            $ID = (int)$this->request->getVar("ID");
            $${className}Model = new ${className}Model();
            $${className}Service = new ${className}Service();
            if ($method == "get" and $ID !== null and $ID !== 0) {
                // GET

                if ($${className}Service->_Get($ID) !== null) {
                    $${className}Service->_result->assignTo($${className}Model);
                    return $this->respond($${className}Model->getProps(), 200);
                } else {
                    return $this->respond(["Message" => "No Content"], 200);
                }
            } elseif ($method == "get") {
                // SEARCH
                $${className}Model->dataAssignToProps($data_req);
                $${className}Service->_Search($${className}Model);
                return $this->respond($${className}Service->data_set, 200);
            } elseif ($method == "post") {
                // ADD
                $${className}Model->dataAssignToProps($data_req);
                if ($${className}Service->_Add($${className}Model) !== null) {
                    $${className}Service->_result->assignTo($${className}Model);
                    return $this->respond($${className}Model->getProps(), 200);
                } else {
                    return $this->respond(["Message" => "Not Modified"], 200);
                }
            } elseif ($method == "put") {
                // EDIT
                if ($${className}Service->_Get($ID) !== null) {
                    $${className}Service->_result->assignTo($${className}Model);
                    $${className}Model->dataAssignToProps($data_req);
                    if ($${className}Service->_Edit($${className}Model) !== null) {
                        $${className}Service->_result->assignTo($${className}Model);
                        return $this->respond($${className}Model->getProps(), 200);
                    } else {
                        return $this->respond(["Message" => "Not Modified"], 200);
                    }
                } else {
                    return $this->respond(["Message" => "Not Modified"], 200);
                }
            } elseif ($method == "delete") {
                // DELETE
                if ($${className}Service->_Delete($ID)) {
                    return $this->respond(["Message" => "Successfully deleted data"], 200);
                } else {
                    return $this->respond(["Message" => "Not Modified"], 200);
                }
            }
        } catch (\\Throwable $th) {
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
