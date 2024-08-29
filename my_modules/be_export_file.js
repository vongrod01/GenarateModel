const express = require('express')
const router = express.Router()
const connectDB_router = require('../routers/connectDB_router')
const fs = require("fs")

let systemConfig = JSON.parse(fs.readFileSync('SystemConfig.json', 'utf-8'))

function baseVO_EXE(programming, provider) {
    let content = '';
    if (programming === 'nodejs') {
        let importDB = ''
        if (provider === 'mysql') {
            importDB = `const mysql = require('../my_modules/mysql.js')`
        }
        else {

        }
        content = `/*\n${header()}*/
        ${importDB}
        class BaseVO {
            constructor() {

            }
            assignTo(destination) {
                let jsonData = JSON.parse(JSON.stringify(this))
                for (var key in jsonData) {
                    if (destination[key] !== undefined) {
                        destination[key] = jsonData[key]
                    }
                    else {
                        console.log('This destination.attribute(' + key + ') does not exist in ' + this.constructor.name + '.')
                    }
                }
            }
            toJson() {
                let jsonData = JSON.parse(JSON.stringify(this))
                let newData = {}
                for (var key in jsonData) {
                    let newKey = key[0] === '_' ? key.slice(1, key.length) : key
                    newData[newKey] = jsonData[key]
                }
                return newData
            }
            jsonAssignToAttr(jsonData) {
                if (typeof jsonData === 'object') {
                    for (var key in jsonData) {
                        if (this[key] !== undefined) {
                            this[key] = jsonData[key]
                        }
                        else {
                            console.log('This attribute(' + key + ') does not exist in ' + this.constructor.name + '.')
                        }
                    }
                }
            }
        }
        class BaseEXE extends mysql.MysqlConnection {
            constructor(connDetail) {
                super(connDetail)
            }
            logErrorExec(err) {
                let dividingLine = ''
                for (let index = 0; index < dividingLine.length; index++) {
                    dividingLine += '-'

                }
                console.log(dividingLine)
                console.log(err)
                console.log(dividingLine)
            }
        }


        module.exports.BaseVO = BaseVO
        module.exports.BaseEXE = BaseEXE
                
            `
        return {
            export: true,
            content: content,
            fileName: 'BaseClass.js'
        }
    }
    else if (programming === 'python') {
        let importDB = ''
        if (provider === 'mysql') {
            importDB = `from .ConnectionMySQL import ConnectMySQL`
        }
        else {

        }
        content = `${header()}
        ${importDB}
        class BaseVO():
            def to_dict(self):
                return {key.replace(f'_{type(self).__name__}__', ''): value for key, value in self.__dict__.items() if
                    not key.startswith('__') and not callable(key)}
            def dict_to_props(self, data_dict):
                if type(data_dict) == dict:
                    for key in data_dict:
                        try:
                            getattr(self, key) #Check Key have in props obj
                            setattr(self, key, data_dict[key])
                        except Exception as e:
                            print(f'''Didn't find key : "{key}" in Object[{type(self).__name__}]''')
                    else:
                        print('*********** This data is not of type dict. ***********')

            def assign_to(self, destination):
                if(type(self) == type(destination)):
                    
                    destination.dict_to_props(self.to_dict())
                else:
                    print('type not map')

        class BaseEXE(ConnectMySQL):
            def __init__(self, config_connection):
                super(BaseEXE, self).__init__(config_connection)

            def err_exe(self, err_str):
                dividing_line = ''
                for i in err_str:
                    dividing_line += '-'
                print(dividing_line)
                print(err_str)
                print(dividing_line)
            `
        return {
            export: true,
            content: content,
            fileName: 'BaseClass.py'
        }
    }
    else if (programming === 'codeigniter4') {
        let result = {
            ecport : true,
            content : [],
            fileName : []
        }
        let importDB = ''
        if (provider === 'mssql') {
            // importDB = `from .ConnectionMySQL import ConnectMySQL`
        }
        else {

        }
        result.content.push(`<?php namespace App\\My_Models;
/*\n${header()}*/
${importDB}

abstract class BaseVO
{
    protected  $props = []; // ประกาศ protected property เพื่อไม่ให้ถูกใช้งานผ่าน object instant 

    public function assignTo($destination)
    {
        foreach ($this->props as $key => $value) {
            // เช็คว่ามี Key ที่ปลายทางหรือไม่
            if (array_key_exists($key, $destination->props)) {
                $destination->$key = $value;
            } else {
                $className = get_class($destination);
                error_log("!Warning function assignTo : This key[$key] does not exist in this object[$className].");
            }
        }
    }

    public function getProps()
    {
        return $this->props;
    }

    public function dataAssignToProps($arr)
    {
        foreach ($arr as $key => $value) {
            // เช็คว่ามี Key ที่ปลายทางหรือไม่
            if (array_key_exists($key, $this->props)) {
                $this->$key = $value;
            } else {
                $className = get_class($this);
                error_log("!Warning 'function dataAssignToProps' : This key[$key] does not exist in this object[$className].");
            }
        }
    }
   
}
    `)

    result.fileName.push(`BaseVO.php`)

    result.content.push(`<?php namespace App\\My_Models;     
/*\n${header()}*/
${importDB}

abstract class BaseEXE{
    public $db;
    public $data_set = [];
    function __construct($conn_group = null){
        // echo "$conn_group";
        if($conn_group != null){
            $this->db = \\Config\\Database::connect($conn_group);
        }
        else{
            $this->db = \\Config\\Database::connect('default');
        }
    }

    public function call_sp($name,$params){
        $params_map = implode(",",array_map(function ($val) {
            return "?";
        }, $params)); 
        $cmd = "exec $name $params_map;";
        try {
            $this->data_set = $this->db->query($cmd, $params)->getResult();
            return $this->data_set;
        } catch (\\Throwable $th) {
            $errors = $this->db->error();
            $this->log_error_db($errors);
            $this->data_set = [];
            return null;
        }
    }

    public function query($cmd){
       
        try {
            $this->data_set = $this->db->query($cmd)->getResult();
            return $this->data_set;
        } catch (\\Throwable $th) {
            $errors = $this->db->error();
            $this->log_error_db($errors);
            $this->data_set = [];
            return null;
        }
    }

    private function log_error_db($errors)
    {
        $message = $errors["message"];
        $code = $errors["code"];
        $message_err = "!Throwable Error [$code] : " . $message;

        $line = "";
        for ($i = 0; $i < strlen($message_err) + 6; $i++) {
            $line = $line . "-";
        }

        error_log($line);
        error_log("|  $message_err  |");
        error_log($line);
    }
    
}
    `)

    result.fileName.push(`BaseEXE.php`)



    return result
    }
    else {
        return {
            export: false

        }
    }

}


function header() {
    let dt = new Date();
    const month = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    dformat = `${dt.getDate()}-${month[dt.getMonth()]}-${dt.getFullYear()} ${dt.getHours()}:${dt.getMinutes()}:${dt.getSeconds()}`

    let genDateStr = `Generate Date : ${dformat}`
    let headerStr = `Generate By Genarate MVC : Ver ${systemConfig.description.version} (Developed by ${systemConfig.description.developer}) | ${genDateStr}`
    let frame = ``
    for (let i = 1; i <= 5; i++) {
        if (i === 1 || i === 5) {
            frame += '##########'
            headerStr.split('').map(() => {
                frame += '#'
            })
        }
        else if (i === 2 || i === 4) {
            frame += '#    '
            headerStr.split('').map(() => {
                frame += ' '
            })
            frame += '    #'
        }
        else if (i === 3) {
            frame += '#    ' + headerStr + '    #'
        }

        frame += '\n'
    }

    return frame
}

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
        if (['int', 'tinyint', 'smallint', 'decimal'].includes(field.FieldType)) {
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
        if (['int', 'tinyint', 'smallint', 'decimal'].includes(field.FieldType)) {
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

function codeigniterVO_EXE(dataDescription) {
    console.log('dataDescription.databaseName : ',dataDescription.databaseName)

    let tbFullName = `${dataDescription.databaseName}.dbo.${dataDescription.tbName}`
    let className = ''
    dataDescription.tbName.split('_').forEach(str => {
        // ตัด "_" ออก แล้วเปลี่ยนตัวอักษรแรกเป็นพิมพ์ใหญ่
        str.charAt(0).toUpperCase() + str.slice(1);
        className += str.charAt(0).toUpperCase() + str.slice(1)
    });
    let result = {
        export : true,
        content : [],
        fileName : []
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
    let paramsListEXE = `
`
    let constructorVO = `
    function __construct($objVO = null)
    {
    `
    // Construct
    dataDescription.dataSet.forEach(field => {
        let initValue
        if (['int', 'tinyint', 'smallint', 'decimal'].includes(field.FieldType)) {
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

        getterVO +=`
            case '${field.FieldName}':
                return $this->props[$prop_name];
                break;`
        setterVO +=`
            case '${field.FieldName}':
                $this->props[$prop_name] = ${['int', 'tinyint', 'smallint', 'decimal'].includes(field.FieldType)?'(int)':''}$value;
                break;`
        
      
        paramsListEXE += `          $DataVO->${field.FieldName},
`
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
        try {
            $this->call_sp('${tbFullName}_get', [$ID]);
            if (count($this->data_set) > 0) {
                $this->_result->dataAssignToProps($this->data_set[0]);
                return $this->_result;
            } else {
                return null;
            }
        } catch (\\Throwable $th) {
            return null;
        }
    }

    public function _Search($DataVO)
    {
        $params = [
            ${paramsListEXE}
        ];
        return $this->call_sp('${tbFullName}_search', $params);
    }

    public function _Add($DataVO)
    {
        $params = [
            ${paramsListEXE}
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
            ${paramsListEXE}
        ];
        $this->call_sp('${tbFullName}_edit', $params);
        return $this->_Get($DataVO->ID);
    }
    
    public function _Delete($ID) {
        try {
            $this->call_sp('${tbFullName}_delete', [$ID]);
            if($this->_Get($ID) === null){
                return true;
            }
            else{
                return false;
            }
           
        } catch (\\Throwable $th) {
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
        export : true,
        content : '',
        fileName : ''
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
                return $this->respond("Message" => "Successfully deleted data"], 200);
            } else {
                return $this->respond(["Message" => "Not Modified"], 200);
            }
        }
    }
}

    `;


    
  
    result.content = content;
    result.fileName = `${className}Controller.php`

    
    return result
}


function storeProcedure(dataDescription){
    let result = {
        export : false,
        content : '',
        fileName : ''
    }
    // console.log('provider : ',dataDescription.provider)
    // console.log('databaseName : ',dataDescription.databaseName) 
    // console.log('tbName : ',dataDescription.tbName) 
    console.table(dataDescription.dataSet)
    let spHeader = `USE [${dataDescription.databaseName}]
GO
IF OBJECT_ID('${dataDescription.tbName}_add', 'P') IS NOT NULL
    DROP PROCEDURE [dbo].[${dataDescription.tbName}_add]
GO

IF OBJECT_ID('${dataDescription.tbName}_delete', 'P') IS NOT NULL
    DROP PROCEDURE [dbo].[${dataDescription.tbName}_delete]
GO

IF OBJECT_ID('${dataDescription.tbName}_edit', 'P') IS NOT NULL
    DROP PROCEDURE [dbo].[${dataDescription.tbName}_edit]
GO

IF OBJECT_ID('${dataDescription.tbName}_get', 'P') IS NOT NULL
    DROP PROCEDURE [dbo].[${dataDescription.tbName}_get]
GO

IF OBJECT_ID('${dataDescription.tbName}_search', 'P') IS NOT NULL
    DROP PROCEDURE [dbo].[${dataDescription.tbName}_search]
GO
`
    let spSearch = ``
    let spGet = ``
    let spAdd = ``
    let spEdit = ``
    let spDelete = ``

    let paramsSp = {
        search:[],
        get:[],
        add:[],
        edit:[],
        delete:[],
    }

    let processAdd = {
        fields:[],
        values:[]
    }
    let processEdit = {
        set:[],
        
    }
    let conditionSp = {
        search:[],
        get:[],
        add:[],
        edit:[],
        delete:[],
    }
    let fieldName_List = []
    if(dataDescription.provider === 'mssql'){

        dataDescription.dataSet.forEach(row => {
            fieldName_List.push(row.FieldName)
            let type = ''
            if(row.FieldType == 'varchar' || row.FieldType == 'nvarchar'|| row.FieldType == 'char'|| row.FieldType == 'nchar'){
                type = `${row.FieldType}(${row.FieldSize == -1?'max':row.FieldSize})  = NULL`
            }
            else if(row.FieldType == 'numeric' || row.FieldType == 'decimal'){
                type = `${row.FieldType}(${row.FieldSize},${row.NumericScale == null?0:row.NumericScale})  = NULL`
            }
            else{
                type = `${row.FieldType} = NULL` 
            }

            let paramName = `@${row.FieldName} ${type}`
            // if(!row.FieldName.includes('AddWhen','UpdateWhen','DeleteWhen')){
            if(row.FieldName != 'AddWhen' && row.FieldName != 'UpdateWhen' && row.FieldName != 'DeleteWhen'){
                
                if(row.FieldName == 'ID'){
                    paramsSp.get.push(paramName)
                    paramsSp.edit.push(paramName)
                    paramsSp.delete.push(paramName)
                    
                }
                else if(row.FieldName == 'AddBy'){
                    paramsSp.add.push(paramName)
                    processAdd.fields.push(row.FieldName)
                    processAdd.values.push(`@${row.FieldName}`)
                }
                
                else if(row.FieldName == 'UpdateBy'){
                    paramsSp.edit.push(paramName)
                    processAdd.fields.push(row.FieldName)
                    processAdd.values.push(`@AddBy`)

                    processEdit.set.push(`${row.FieldName} = @${row.FieldName}`)
                }
                
                else if(row.FieldName == 'DeleteBy'){
                    // paramsSp.delete.push(paramName)
                    processAdd.fields.push(row.FieldName)
                    processAdd.values.push(`NULL`)
                }
                
                else{
                    paramsSp.search.push(paramName)
                    paramsSp.edit.push(paramName)
                    paramsSp.add.push(paramName)

                    processAdd.fields.push(row.FieldName)
                    processAdd.values.push(`@${row.FieldName}`)

                    processEdit.set.push(`${row.FieldName} = @${row.FieldName}`)


                    if(row.FieldType == 'varchar' || row.FieldType == 'nvarchar'|| row.FieldType == 'char'|| row.FieldType == 'nchar'){
                        conditionSp.search.push(`((isnull(@${row.FieldName},'') = '') OR (${row.FieldName} LIKE '%' + @${row.FieldName} + '%'))`)
                    }
                    else if(row.FieldType == 'numeric' || row.FieldType == 'decimal' || row.FieldType == 'int' || row.FieldType == 'float'){
                        conditionSp.search.push(`((isnull(@${row.FieldName},0) = 0) OR (${row.FieldName} = @${row.FieldName}))`)
                    }
                    else{
                        conditionSp.search.push(`((@${row.FieldName} = null) OR (${row.FieldName} = @${row.FieldName}))`)
                    }
                }
            }
            else{
                if(row.FieldName == 'AddWhen'){
                    processAdd.fields.push(row.FieldName)
                    processAdd.values.push('GETDATE()')
                }
                else if(row.FieldName == 'UpdateWhen'){
                    processAdd.fields.push(row.FieldName)
                    processAdd.values.push('GETDATE()')
                    processEdit.set.push(`${row.FieldName} = GETDATE()`)
                }
                else if(row.FieldName == 'DeleteWhen'){
                    processAdd.fields.push(row.FieldName)
                    processAdd.values.push(`NULL`)
                }
            }
        });
        spSearch +=`CREATE PROCEDURE [dbo].[${dataDescription.tbName}_search]
    ${paramsSp.search.join(`,
    `
    )}
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        ${fieldName_List.join(`,
        `
        )}  
    FROM dbo.${dataDescription.tbName}
    WHERE
        ${conditionSp.search.join(` AND
        `
        )}  
END
GO
        `

        spGet += `CREATE PROCEDURE [dbo].[${dataDescription.tbName}_get]
    ${paramsSp.get.join(`,
        `
        )}
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        ${fieldName_List.join(`,
        `
        )}  
    FROM dbo.${dataDescription.tbName}
    WHERE
        ID = @ID
END
GO
        `

        spAdd += `CREATE PROCEDURE [dbo].[${dataDescription.tbName}_add]
    ${paramsSp.add.join(`,
    `
    )}
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.${dataDescription.tbName}
    (
        ${processAdd.fields.join(`,
        `
        )}
    )

    OUTPUT Inserted.ID

    VALUES
    (
        ${processAdd.values.join(`,
        `
        )}
    )

    SELECT SCOPE_IDENTITY() AS ID;
   
END
GO
        `
        spEdit += `CREATE PROCEDURE [dbo].[${dataDescription.tbName}_edit]
    ${paramsSp.edit.join(`,
    `
    )}
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.${dataDescription.tbName}
    SET
        ${processEdit.set.join(`,
        `
        )}
    WHERE ID = @ID    
END
GO
        `

        spDelete += `CREATE PROCEDURE [dbo].[${dataDescription.tbName}_delete]
    ${paramsSp.delete.join(`,
        `
        )}
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.${dataDescription.tbName}
    SET 
        DeleteWhen = GETDATE()
    WHERE ID = @ID   
END
GO
        `

        result.content = `/*\n${header()}*/

${spHeader}
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

${spSearch}

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

${spGet}
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

${spAdd}
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

${spEdit}
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

${spDelete}

`
        result.export = true
        result.fileName = `sp_standard_${dataDescription.tbName}.sql`
}else if(dataDescription.provider === 'mysql'){

    }
    else{
        result.export = false;
    }
    // console.log('paramsSp : ',paramsSp) 

    // console.log(spSearch) 
    console.log(result.content) 
    return result
}



module.exports.baseVO_EXE = baseVO_EXE
module.exports.nodejsVO_EXE = nodejsVO_EXE
module.exports.pythonVO_EXE = pythonVO_EXE
module.exports.codeigniterVO_EXE = codeigniterVO_EXE
module.exports.codeigniterController = codeigniterController
module.exports.storeProcedure = storeProcedure