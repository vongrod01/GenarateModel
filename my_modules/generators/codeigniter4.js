const { header } = require('./header')

function codeigniterVO_EXE(dataDescription) {
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
    let getterVO = `
    public function __get($prop_name)
    {
        switch ($prop_name) {
    `
    let setterVO = `
    public function __set($prop_name, $value)
    {
        switch ($prop_name) {
    `
    let paramsListEXE = {
        'add': '',
        'edit': '',
        'search': ''
    }
    let constructorVO = `
    function __construct($objVO = null)
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
        constructorVO += `  $this->${field.FieldName} = ${initValue}
        `

        getterVO += `
            case '${field.FieldName}':
                return $this->props[$prop_name];
                break;`
        setterVO += `
            case '${field.FieldName}':
                $this->props[$prop_name] = ${['int', 'tinyint', 'smallint', 'bigint', 'decimal'].includes(field.FieldType) ? '(int)' : ''}$value;
                break;`
        if (field.FieldName != 'AddWhen' && field.FieldName != 'UpdateWhen' && field.FieldName != 'DeleteBy' && field.FieldName != 'DeleteWhen') {
            if (field.FieldName == 'ID') {

                paramsListEXE.edit += `          $DataVO->${field.FieldName},
`
            }
            else if (field.FieldName == 'AddBy') {
                paramsListEXE.add += `          $DataVO->${field.FieldName},
`
            }
            else if (field.FieldName == 'UpdateBy') {
                paramsListEXE.edit += `          $DataVO->${field.FieldName},
`
            }
            else {
                paramsListEXE.add += `          $DataVO->${field.FieldName},
`
                paramsListEXE.search += `          $DataVO->${field.FieldName},
`
                paramsListEXE.edit += `          $DataVO->${field.FieldName},
`
            }

        }



        //         paramsListEXE += `          $DataVO->${field.FieldName},
        // `
    });

    constructorVO += `
    }
    `
    getterVO += `
            default:
                return null;
                break;
        }
    }
    `
    setterVO += `
            default:
                $this->props[$prop_name] = $value;
                break;
        }
    }
    `
    content = `<?php namespace App\\My_Models;
/*\n${header()}*/

use App\\My_Models\\BaseVO;

class ${className}VO extends BaseVO
{
${constructorVO}
${getterVO}
${setterVO}
}
    `
    result.content.push(content)
    result.fileName.push(`${className}VO.php`)
    // จบ VO
    // -----------------------------------------------------------


    let constructorEXE = `
    public $_result;
    function __construct($conn_group = null)
    {
        parent::__construct($conn_group);
        $this->_result = new ${className}VO();
    }        
    `

    let methodEXE = `
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

    public function _Search($DataVO)
    {
        $params = [
            ${paramsListEXE.search}
        ];
        return $this->call_sp('${tbFullName}_search', $params);
    }

    public function _Add($DataVO)
    {
        $params = [
            ${paramsListEXE.add}
        ];
        $result = $this->call_sp('${tbFullName}_add', $params);
        if ($result != null and count($result) > 0) {
            $ID = $result[0]->ID;
            return $this->_Get($ID);
        } else {
            return null;
        }
    }

    public function _Edit($DataVO)
    {
        $params = [
            ${paramsListEXE.edit}
        ];
        $this->call_sp('${tbFullName}_edit', $params);
        return $this->_Get($DataVO->ID);
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

use App\\My_Models\\BaseEXE;
use App\\My_Models\\${className}VO;

class ${className}EXE extends BaseEXE
{
    ${constructorEXE}
    ${methodEXE}
}
    `
    result.content.push(content)
    result.fileName.push(`${className}EXE.php`)
    // จบ EXE
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
use App\\My_Models\\${className}VO;
use App\\My_Models\\${className}EXE;

class ${className}Controller extends ResourceController
{
    public function Process()
    {
        try {
            $method = $this->request->getMethod();
            $data_req = $this->request->getVar();
            $ID = (int)$this->request->getVar("ID");
            $${className}VO = new ${className}VO();
            $${className}EXE = new ${className}EXE();
            if ($method == "get" and $ID !== null and $ID !== 0) {
                // GET

                if ($${className}EXE->_Get($ID) !== null) {
                    $${className}EXE->_result->assignTo($${className}VO);
                    return $this->respond($${className}VO->getProps(), 200);
                } else {
                    return $this->respond(["Message" => "No Content"], 200);
                }
            } elseif ($method == "get") {
                // SEARCH
                $${className}VO->dataAssignToProps($data_req);
                $${className}EXE->_Search($${className}VO);
                return $this->respond($${className}EXE->data_set, 200);
            } elseif ($method == "post") {
                // ADD
                $${className}VO->dataAssignToProps($data_req);
                if ($${className}EXE->_Add($${className}VO) !== null) {
                    $${className}EXE->_result->assignTo($${className}VO);
                    return $this->respond($${className}VO->getProps(), 200);
                } else {
                    return $this->respond(["Message" => "Not Modified"], 200);
                }
            } elseif ($method == "put") {
                // EDIT
                if ($${className}EXE->_Get($ID) !== null) {
                    $${className}EXE->_result->assignTo($${className}VO);
                    $${className}VO->dataAssignToProps($data_req);
                    if ($${className}EXE->_Edit($${className}VO) !== null) {
                        $${className}EXE->_result->assignTo($${className}VO);
                        return $this->respond($${className}VO->getProps(), 200);
                    } else {
                        return $this->respond(["Message" => "Not Modified"], 200);
                    }
                } else {
                    return $this->respond(["Message" => "Not Modified"], 200);
                }
            } elseif ($method == "delete") {
                // DELETE
                if ($${className}EXE->_Delete($ID)) {
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

module.exports.codeigniterVO_EXE = codeigniterVO_EXE
module.exports.codeigniterController = codeigniterController
