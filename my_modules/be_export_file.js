const express = require('express')
const router = express.Router()
const connectDB_router = require('../routers/connectDB_router')
const fs = require("fs")

let systemConfig = JSON.parse(fs.readFileSync('SystemConfig.json', 'utf-8'))

function dbService(programming, provider, nameSpace = '') {
    console.log("dbService : ", { programming, provider, nameSpace })
    let content = '';

    if (programming === '.net 4.5') {

        if (provider == 'mssql') {

            content = `/*\n${header()}*/
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;

${nameSpace.trim() != '' ? `namespace ${nameSpace.trim()}.Services\n{` : ''}
    public class DBService
    {
        public List<Dictionary<string, object>> Dataset { get; private set; }

        public void QuerySQL(string sqlQuery)
        {
            var connection = DatabaseConnection.ConnectToDB();
            if (string.IsNullOrWhiteSpace(sqlQuery))
                throw new ArgumentException("sqlQuery is required", "sqlQuery");

            try
            {
                using (var command = new SqlCommand(sqlQuery, connection))
                {
                    command.CommandType = CommandType.Text;
                    command.CommandTimeout = 180;

                    connection.Open();
                    using (var reader = command.ExecuteReader())
                    {
                        Dataset = ReadData(reader);
                    }
                }
            }
            catch (Exception ex)
            {
                
                System.Diagnostics.Debug.WriteLine("Error executing SQL: " + ex);
                throw;
            }
        }

        public void CallSp(string spName, Dictionary<string, object> spParameter)
        {
            if (string.IsNullOrWhiteSpace(spName))
                throw new ArgumentException("spName is required", "spName");

            try
            {
                var connection = DatabaseConnection.ConnectToDB();
                using (var command = new SqlCommand(spName, connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.CommandTimeout = 180;

                    if (spParameter != null)
                    {
                        foreach (var p in spParameter)
                        {
                            command.Parameters.AddWithValue(p.Key, p.Value ?? DBNull.Value);
                        }
                    }

                    connection.Open();
                    using (var reader = command.ExecuteReader())
                    {
                        Dataset = ReadData(reader);
                    }
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("Error executing stored procedure [" + spName + "]: " + ex);
                throw;
            }
        }

    
        public static List<Dictionary<string, object>> ReadData(SqlDataReader reader)
        {
            var dataTable = new DataTable();
            dataTable.Load(reader);

            var results = new List<Dictionary<string, object>>(dataTable.Rows.Count);

            foreach (DataRow row in dataTable.Rows)
            {
                var dict = new Dictionary<string, object>(dataTable.Columns.Count, StringComparer.OrdinalIgnoreCase);

                foreach (DataColumn col in dataTable.Columns)
                {
                    var value = row[col];
                    dict[col.ColumnName] = (value == DBNull.Value) ? null : value;
                }

                results.Add(dict);
            }

            return results;
        }
    }
${nameSpace.trim() != '' ? `}` : ''}  
`
        }


        return {
            export: true,
            content: content,
            fileName: 'DBService.cs'
        }
    }
    else {
        return {
            export: false

        }
    }

}
function baseVO_EXE(programming, provider, nameSpace = '') {
    console.log({ programming, provider, nameSpace })
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
    else if (programming === 'nextjs') {
        let importDB = ''
        if (provider === 'mssql') {
            importDB = `import { Db } from '../db/Db'`
        }
        else {

        }
        content = `/*\n${header()}*/
        import 'server-only'
        ${importDB}
        export class BaseVO {
            constructor() {

            }
            assignTo(destination) {
                let jsonData = { ...this }
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
                let jsonData = { ...this }
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
            
        export class BaseEXE extends Db {
            constructor(connGroup = 'default') {
                super(connGroup)
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
            ecport: true,
            content: [],
            fileName: []
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
            throw new \\Exception($errors["message"], $errors["code"], $th);
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
            throw new \\Exception($errors["message"], $errors["code"], $th);
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
    else if (programming === '.net 4.5') {
        let result = {
            ecport: true,
            content: [],
            fileName: []
        }
        let importDB = ''
        if (provider === 'mssql') {
            // importDB = `from .ConnectionMySQL import ConnectMySQL`
        }
        else {

        }
        result.content.push(`/*\n${header()}*/          
using System.Collections.Generic;
using System.Reflection;
${nameSpace.trim() != '' ? `namespace ${nameSpace.trim()}.Models\n{` : ''}

    public class BaseModel
    {
        public Dictionary<string, object> ToDict()
        {
            var dict = new Dictionary<string, object>();

            var props = GetType().GetProperties(BindingFlags.Public | BindingFlags.Instance);
            foreach (var p in props)
            {
                if (!p.CanRead) continue;
                dict[p.Name] = p.GetValue(this, null);
            }

            return dict;
        }
    }
${nameSpace.trim() != '' ? `}` : ''}
`)

        result.fileName.push(`BaseModel.cs`)

        result.content.push(`/*\n${header()}*/   
using System;
using System.Runtime.CompilerServices;
${nameSpace.trim() != '' ? `namespace ${nameSpace.trim()}.Services\n{` : ''}
    public abstract class BaseService
    {
        public class MethodException : Exception
        {
            public string Code { get; }
            public string SourceMethod { get; }

            public MethodException(string code, string sourceMethod, Exception inner = null)
                : base(sourceMethod, inner)
            {
                Code = code;
                SourceMethod = sourceMethod;
            }
        }
    }
${nameSpace.trim() != '' ? `}` : ''}
    `)

        result.fileName.push(`BaseService.cs`)



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
    const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    dformat = `${dt.getDate()}-${month[dt.getMonth()]}-${dt.getFullYear()} ${dt.getHours()}:${dt.getMinutes()}:${dt.getSeconds()}`

    // let genDateStr = `Generate Date : ${dformat}`
    // let headerStr = `Generate By Genarate MVC : Ver ${systemConfig.description.version} (Developed by ${systemConfig.description.developer}) | ${genDateStr}`

    // let frame = ``
    // for (let i = 1; i <= 5; i++) {
    //     if (i === 1 || i === 5) {
    //         frame += '##########'
    //         headerStr.split('').map(() => {
    //             frame += '#'
    //         })
    //     }
    //     else if (i === 2 || i === 4) {
    //         frame += '#    '
    //         headerStr.split('').map(() => {
    //             frame += ' '
    //         })
    //         frame += '    #'
    //     }
    //     else if (i === 3) {
    //         frame += '#    ' + headerStr + '    #'
    //     }

    //     frame += '\n'
    // }

    // return frame

    const now = new Date();

    const pad = (n) => n.toString().padStart(2, '0');

    const formattedDate =
        `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
        `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const lines = [
        "===============================================================================",
        "",
        `Generator : ${systemConfig.description.titleHeader} v${systemConfig.description.version}`,
        `Author    : ${systemConfig.description.developer}`,
        `Generated : ${dformat} (Asia/Bangkok)`,
        '',
        "==============================================================================="
    ];
    let h = lines.map(line => `# ${line}`).join("\n");
    return h + '\n';
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

function dotNet4_5Controller(dataDescription,nameSpace = '') {
    let className = ''
    dataDescription.tbName.split('_').forEach(str => {
        // ตัด "_" ออก แล้วเปลี่ยนตัวอักษรแรกเป็นพิมพ์ใหญ่
        str.charAt(0).toUpperCase() + str.slice(1);
        className += str.charAt(0).toUpperCase() + str.slice(1)
    });

    let instanceService = `${className[0].toLowerCase() + className.slice(1)}Service`
    let instanceModel = `${className[0].toLowerCase() + className.slice(1)}Model`
    let result = {
        export: true,
        content: '',
        fileName: ''
    }
    let content = `/*\n${header()}*/
using System;
using System.Collections.Generic;
using System.Web.Mvc;
${nameSpace.trim() != '' ? `using ${nameSpace.trim()}.Models;\nusing ${nameSpace.trim()}.Services;\nusing MethodException = ${nameSpace.trim()}.Services.BaseService.MethodException;` : ''}

${nameSpace.trim() != '' ? `namespace ${nameSpace.trim()}.Controllers\n{` : ''}
    public class ${className}Controller : Controller
    {
        private class DataResponse
        {
            public Boolean Succress { get; set; }
            public object Message { get; set; }
            public List<Dictionary<string, object>> Data { get; set; }
            public object Error { get; set; }
        }

        // GET: /${className}/get?id=1
        [HttpGet]
        public JsonResult get(int id = 0)
        {

            try
            {
                var ${instanceService} = new ${className}Service();
                var ${instanceModel} = new SurveyDiffReasonModel();
                var result = new DataResponse()
                {
                    Succress = true,
                    /*
                    Message = new
                    {
                        API_Version = "v1.0.0",
                        Code = "001",
                        Message = "Success"
                    }
                    */
                };

                if (${instanceService}.Get(id) != null)
                {
                    ${instanceService}.Result.AssignTo(${instanceModel});
                    result.Data = new List<Dictionary<string, object>> { ${instanceModel}.ToDict() };
                }

                return Json(result, JsonRequestBehavior.AllowGet);
            }
            catch (MethodException ex)
            {

                var result = new DataResponse()
                {
                    Succress = false,
                    Error = new { Code = ex.Code, Source = ex.SourceMethod }

                };
                return Json(result, JsonRequestBehavior.AllowGet);
            }
        }

        // POST: /${className}/add
        // Content-Type: application/json
        [HttpPost]
        public JsonResult add(${className}Model data)
        {

            if (data == null)
            {
                var result = new DataResponse()
                {
                    Succress = false,
                    Message = new { Message = "Invalid body" },

                };

                return Json(result, JsonRequestBehavior.AllowGet);
            }

            try
            {
                var ${instanceService} = new ${className}Service();
                var ${instanceModel} = new ${className}Model();
                var result = new DataResponse();
                if (${instanceService}.Add(data) != null)
                {
                    ${instanceService}.Result.AssignTo(${instanceModel});
                    result.Succress = true;
                    /*
                    Message = new
                    {
                        API_Version = "v1.0.0",
                        Code = "001",
                        Message = "Success"
                    }
                    */
                    result.Data = new List<Dictionary<string, object>> { ${instanceModel}.ToDict() };
                }

                return Json(result, JsonRequestBehavior.AllowGet);
            }
            catch (MethodException ex)
            {

                var result = new DataResponse()
                {
                    Succress = false,
                    Error = new { Code = ex.Code, Source = ex.SourceMethod }

                };
                return Json(result, JsonRequestBehavior.AllowGet);
            }
        }

        // POST: /${className}/edit
        [HttpPost]
        public JsonResult edit(${className}Model data)
        {
            if (data == null)
            {
                var result = new DataResponse()
                {
                    Succress = false,
                    Message = new { Message = "Invalid body" },

                };

                return Json(result, JsonRequestBehavior.AllowGet);
            }

            try
            {
                var ${instanceService} = new ${className}Service();
                var ${instanceModel} = new ${className}Model();
                var result = new DataResponse();
                if (${instanceService}.Edit(data) != null)
                {
                    ${instanceService}.Result.AssignTo(${instanceModel});
                    result.Succress = true;
                    /*
                    Message = new
                    {
                        API_Version = "v1.0.0",
                        Code = "001",
                        Message = "Success"
                    }
                    */
                    result.Data = new List<Dictionary<string, object>> { ${instanceModel}.ToDict() };
                }

                return Json(result, JsonRequestBehavior.AllowGet);
            }

            catch (MethodException ex)
            {

                var result = new DataResponse()
                {
                    Succress = false,
                    Error = new { Code = ex.Code, Source = ex.SourceMethod }

                };
                return Json(result, JsonRequestBehavior.AllowGet);
            }
        }

        // GET: /${className}/search?param1=value1&param2=value2.......
        [HttpGet]
        public JsonResult search(${className}Model data)
        {
            try
            {
                var ${instanceService} = new ${className}Service();
                ${instanceService}.Search(data);
                var result = new DataResponse()
                {
                    Succress = true,
                    /*
                    Message = new
                    {
                        API_Version = "v1.0.0",
                        Code = "001",
                        Message = "Success"
                    }
                    */
                    Data =  ${instanceService}.Dataset ?? new List<Dictionary<string, object>>()

                };

                return Json(result, JsonRequestBehavior.AllowGet);
            }
            catch (MethodException ex)
            {

                var result = new DataResponse()
                {
                    Succress = false,
                    Error = new { Code = ex.Code, Source = ex.SourceMethod }
                };
                return Json(result, JsonRequestBehavior.AllowGet);
            }
        }

        // POST: /${className}/delete
        // Content-Type: application/json
        [HttpPost]
        public JsonResult delete(${className}Model data)
        {

            if (data == null)
            {
                var result = new DataResponse()
                {
                    Succress = false,
                    Message = new { Message = "Invalid body" },
                };

                return Json(result, JsonRequestBehavior.AllowGet);
            }

            try
            {
                var ${instanceService} = new ${className}Service();

                var result = new DataResponse()
                {
                    Succress = ${instanceService}.Delete(data),
                    /*
                    Message = new
                    {
                        API_Version = "v1.0.0",
                        Code = "001",
                        Message = "Success"
                    }
                    */
                };

                return Json(result, JsonRequestBehavior.AllowGet);
            }
            catch (MethodException ex)
            {
                var result = new DataResponse()
                {
                    Succress = false,
                    Error = new { Code = ex.Code, Source = ex.SourceMethod }
                };
                return Json(result, JsonRequestBehavior.AllowGet);
            }
        }
    }
${nameSpace.trim() != '' ? `}` : ''}
    `;




    result.content = content;
    result.fileName = `${className}Controller.cs`
    return result
}

function dotNet4_5_VO_EXE(dataDescription, nameSpace = '') {
    console.log({ dataDescription, nameSpace })

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

    let paramsListEXE = {
        'add': '',
        'edit': '',
        'search': ''
    }

    let property = ''
    let methodAssignTo = ''
    let mapResult = ''
    // Construct
    dataDescription.dataSet.forEach(field => {
        function genType(field) {
            const t = (field.FieldType || '').toLowerCase().trim();
            const isNullable = !!field.IsNullable;

            const nullable = (csType, isValueType = true) => {
                if (!isNullable) return csType;
                if (!isValueType) return csType; // string/byte[] ไม่ต้อง ?
                return `${csType}?`;
            };

            // Date/Time => string ตามที่คุณต้องการ
            if (['date', 'datetime', 'datetime2', 'smalldatetime', 'time', 'datetimeoffset'].includes(t)) {
                return nullable('string', false);
            }

            // string types
            if (['char', 'varchar', 'nchar', 'nvarchar', 'text', 'ntext', 'xml'].includes(t)) {
                return nullable('string', false);
            }

            // Boolean
            if (t === 'bit') return nullable('bool', true);

            // Integers
            if (t === 'tinyint') return nullable('int', true);
            if (t === 'smallint') return nullable('int', true);
            if (t === 'int') {
                return nullable(`int${field.FieldName == 'DeleteBy' ? '?' : ''}`, true);
            }
            if (t === 'bigint') return nullable('int', true);

            // Decimal / Numeric / Money
            if (['decimal', 'numeric', 'money', 'smallmoney'].includes(t)) return nullable('decimal', true);

            // Floating
            if (t === 'float') return nullable('double', true);
            if (t === 'real') return nullable('float', true);

            // Guid
            if (t === 'uniqueidentifier') return nullable('Guid', true);

            // Binary / Blob
            if (['binary', 'varbinary', 'image', 'rowversion', 'timestamp'].includes(t)) return 'byte[]';

            // fallback
            return 'object';
        }

        function genInitValue(field, csType) {
            const isNullable = !!field.IsNullable;
            const t = (field.FieldType || '').toLowerCase().trim();

            // ถ้า nullable (value type) -> ไม่ต้อง init (default = null)
            // แต่ string/byte[] ถึง nullable ก็ไม่จำเป็นต้อง init
            if (isNullable) {
                // ถ้าคุณอยาก “ให้ nullable string เป็น ""” ก็แก้ตรงนี้ได้
                return null; // ไม่ใส่ "= ..."
            }

            // csType อาจเป็น "int?" แต่กรณีไม่ nullable จะไม่เกิด
            switch (csType) {
                case 'string':
                    return '= "";';
                case 'bool':
                    return '= false;';
                case 'byte':
                case 'short':
                case 'int':
                case 'long':
                    return '= 0;';
                case 'decimal':
                    return '= 0m;';
                case 'float':
                    return '= 0f;';
                case 'double':
                    return '= 0d;';
                case 'Guid':
                    return '= Guid.Empty;';
                case 'byte[]':
                    // แล้วแต่คุณ: new byte[0] หรือ null
                    return '= new byte[0];';
                case 'object':
                    return '= null;';
                default:
                    // กันพลาด: ถ้าเป็น value type อื่น ๆ ให้ไม่ init
                    return null;
            }
        }

        function genSqlParameter(field) {
            const typeMap = {
                nvarchar: "SqlDbType.NVarChar",
                varchar: "SqlDbType.VarChar",
                int: "SqlDbType.Int",
                bigint: "SqlDbType.BigInt",
                smallint: "SqlDbType.SmallInt",
                tinyint: "SqlDbType.TinyInt",
                bit: "SqlDbType.Bit",
                datetime: "SqlDbType.DateTime",
                date: "SqlDbType.Date",
                decimal: "SqlDbType.Decimal",
                numeric: "SqlDbType.Decimal"
            };

            const sqlType = typeMap[field.FieldType.toLowerCase()] || "SqlDbType.Variant";
            const name = field.FieldName;

            // ถ้ามี size เช่น nvarchar(500)
            if (field.FieldSize && field.FieldSize > 0) {
                return `cmd.Parameters.Add("@${name}", ${sqlType}, ${field.FieldSize}).Value = data.${name};`;
            }

            return `cmd.Parameters.Add("@${name}", ${sqlType}).Value = data.${name};`;
        }

        function genMapResultLine(field, options = {}) {
            const {
                resultVar = "this.Result",
                readerVar = "reader",
                // กำหนดว่าฟิลด์นี้เป็น nullable int? (เช่น DeleteBy)
                nullableIntFields = new Set(["DeleteBy"]),
                // กำหนดว่าฟิลด์นี้เป็น string ที่อยากให้ default เป็น null (เช่น DeleteWhen)
                nullStringFields = new Set(["DeleteWhen"]),
            } = options;

            const name = field.FieldName;
            const type = String(field.FieldType || "").toLowerCase();

            const isNullableInt = nullableIntFields.has(name);
            const isNullString = nullStringFields.has(name);

            const col = `${readerVar}["${name}"]`;
            const assignLeft = `${resultVar}.${name}`;

            // string
            if (["nvarchar", "varchar", "nchar", "char", "text", "ntext"].includes(type)) {
                const defaultVal = isNullString ? "null" : `""`;
                return `${assignLeft} = ${col} == DBNull.Value ? ${defaultVal} : ${col}.ToString();`;
            }

            // int family
            if (["int", "smallint", "tinyint"].includes(type)) {
                if (isNullableInt) {
                    return `${assignLeft} = ${col} == DBNull.Value ? (int?)null : Convert.ToInt32(${col});`;
                }
                return `${assignLeft} = ${col} == DBNull.Value ? 0 : Convert.ToInt32(${col});`;
            }

            // bigint -> Int64
            if (type === "bigint") {
                return `${assignLeft} = ${col} == DBNull.Value ? 0 : Convert.ToInt64(${col});`;
            }

            // bit -> bool
            if (type === "bit") {
                return `${assignLeft} = ${col} == DBNull.Value ? false : Convert.ToBoolean(${col});`;
            }

            // decimal/numeric
            if (["decimal", "numeric", "money", "smallmoney"].includes(type)) {
                return `${assignLeft} = ${col} == DBNull.Value ? 0 : Convert.ToDecimal(${col});`;
            }

            // datetime/date/time -> (ในโค้ดคุณเก็บเป็น string) => ToString()
            if (["datetime", "datetime2", "smalldatetime", "date", "time"].includes(type)) {
                // คุณตัวอย่าง: AddWhen default "" , DeleteWhen default null
                const defaultVal = isNullString ? "null" : `""`;
                return `${assignLeft} = ${col} == DBNull.Value ? ${defaultVal} : ${col}.ToString();`;
            }

            // fallback
            return `${assignLeft} = ${col} == DBNull.Value ? null : ${col};`;
        }
        const csType = genType(field);

        // if (['int', 'tinyint', 'smallint', 'bigint', 'decimal'].includes(field.FieldType)) {
        //     initValue = '0;'
        // }
        // // else if (['date', 'datetime'].includes(field.FieldType)) {
        // //     initValue = 'date("Y-m-d H:i:s");'
        // // }
        // else {
        //     initValue = '"";'
        // }
        // console.log({field})

        // console.log(genMapResultLine(field))
        mapResult += `  ${genMapResultLine(field)}
        `

        property += `   public ${genType(field)} ${field.FieldName} { get; set; } ${field.FieldName.toLowerCase().includes('delete') ? '' : genInitValue(field, csType)}
        `
        methodAssignTo += `     destination.${field.FieldName} = this.${field.FieldName};
        `



        if (field.FieldName != 'AddWhen' && field.FieldName != 'UpdateWhen' && field.FieldName != 'DeleteBy' && field.FieldName != 'DeleteWhen') {
            if (field.FieldName == 'ID') {
                paramsListEXE.edit += `          ${genSqlParameter(field)}
`
            }
            else if (field.FieldName == 'AddBy') {
                paramsListEXE.add += `          ${genSqlParameter(field)}
`
            }
            else if (field.FieldName == 'UpdateBy') {
                paramsListEXE.edit += `         ${genSqlParameter(field)}
`
            }
            else {
                paramsListEXE.add += `          ${genSqlParameter(field)}
`
                paramsListEXE.search += `       ${genSqlParameter(field)}
`
                paramsListEXE.edit += `         ${genSqlParameter(field)}
`
            }



        }



        //         paramsListEXE += `          $DataVO->${field.FieldName},
        // `
    });


    content = `/*\n${header()}*/
using System;
${nameSpace.trim() != '' ? `namespace ${nameSpace.trim()}.Models\n{` : ''}
    public class ${className}Model : BaseModel
    {
    ${property}
        public void AssignTo(${className}Model destination)
        {
        ${methodAssignTo}
        }
    }
${nameSpace.trim() != '' ? `}` : ''}
    `
    result.content.push(content)
    result.fileName.push(`${className}Model.cs`)
    // จบ VO
    // -----------------------------------------------------------



    content = `/*\n${header()}*/

using System;
using System.Data;
using System.Data.SqlClient;
using System.Collections.Generic;
${nameSpace.trim() != '' ? `using ${nameSpace.trim()}.Models;` : ''}

${nameSpace.trim() != '' ? `namespace ${nameSpace.trim()}.Services\n{` : ''}
    public class ${className}Service : BaseService
    {
        public ${className}Model Result { get; private set; } = new ${className}Model();
        public List<Dictionary<string, object>> Dataset { get; private set; }

        public ${className}Model Get(int id)
        {
            if (id <= 0) return null;

            const string procedureName = "${dataDescription.databaseName}.dbo.${dataDescription.tbName}_get";
            try
            {
                using (SqlConnection conn = DatabaseConnection.ConnectToDB())
                using (SqlCommand cmd = new SqlCommand(procedureName, conn))
                {
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.Add("@ID", SqlDbType.Int).Value = id;

                    if (conn.State != ConnectionState.Open)
                    conn.Open();

                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        if (!reader.Read())
                            return null;

                        MapResult(reader);
                        return Result;
                    }
                }
            }
            catch (Exception ex)
            {
                throw new MethodException("500", "${className}Service.Get", ex);
            }
        }

        public ${className}Model Add(${className}Model data)
        {
            const string procedureName = "${dataDescription.databaseName}.dbo.${dataDescription.tbName}_add";

            try
            {
                using (SqlConnection conn = DatabaseConnection.ConnectToDB())
                using (SqlCommand cmd = new SqlCommand(procedureName, conn))
                {
                    cmd.CommandType = CommandType.StoredProcedure;

                    ${paramsListEXE.add}

                    if (conn.State != ConnectionState.Open)
                        conn.Open();

                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        if (!reader.Read())
                            return null;

                        return this.Get(reader["ID"] == DBNull.Value ? 0 : Convert.ToInt32(reader["ID"]));
                    }
                }
            }
            catch (Exception ex)
            {
                throw new MethodException("500", "${className}Service.Add", ex);
            }   
        }

        public ${className}Model Edit(${className}Model data)
        {

            const string procedureName = "${dataDescription.databaseName}.dbo.${dataDescription.tbName}_edit";

            try
            {
                using (SqlConnection conn = DatabaseConnection.ConnectToDB())
                using (SqlCommand cmd = new SqlCommand(procedureName, conn))
                {
                    cmd.CommandType = CommandType.StoredProcedure;

                    ${paramsListEXE.edit}

                    if (conn.State != ConnectionState.Open)
                        conn.Open();

                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        return this.Get(data.ID);
                    }
                }
            }
            catch (Exception ex)
            {
                throw new MethodException("500", "${className}Service.Edit", ex);
            }   
        }

        public void Search(${className}Model data)
        {
            const string procedureName = "${dataDescription.databaseName}.dbo.${dataDescription.tbName}_search";

            try
            {
                using (SqlConnection conn = DatabaseConnection.ConnectToDB())
                using (SqlCommand cmd = new SqlCommand(procedureName, conn))
                {
                    cmd.CommandType = CommandType.StoredProcedure;

                    ${paramsListEXE.search}

                    if (conn.State != ConnectionState.Open)
                        conn.Open();

                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        this.Dataset = DBService.ReadData(reader);
                    }
                }
            }
            catch (Exception ex)
            {
                throw new MethodException("500", "${className}Service.Search", ex);
            }
        }

        public Boolean Delete(${className}Model data)
        {
            const string procedureName = "${dataDescription.databaseName}.dbo.${dataDescription.tbName}_delete";
            try
            {
                using (SqlConnection conn = DatabaseConnection.ConnectToDB())
                using (SqlCommand cmd = new SqlCommand(procedureName, conn))
                {
                    cmd.CommandType = CommandType.StoredProcedure;

                    cmd.Parameters.Add("@ID", SqlDbType.Int).Value = data.ID;
                    cmd.Parameters.Add("@DeleteBy", SqlDbType.Int).Value = data.DeleteBy;

                    if (conn.State != ConnectionState.Open)
                        conn.Open();

                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        if (this.Get(data.ID) != null && this.Result.DeleteWhen != null)
                        {
                            return true;
                        }
                        else
                        {
                            return false;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                throw new MethodException("500", "${className}Service.Delete", ex);
            }
        }

        private void MapResult(SqlDataReader reader)
        {
        ${mapResult}
        }

    }

    
${nameSpace.trim() != '' ? `}` : ''}
    `
    result.content.push(content)
    result.fileName.push(`${className}Service.cs`)
    // จบ EXE
    // -----------------------------------------------------------


    return result
}



function storeProcedure(dataDescription) {
    let result = {
        export: false,
        content: '',
        fileName: ''
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
        search: [],
        get: [],
        add: [],
        edit: [],
        delete: [],
    }

    let processAdd = {
        fields: [],
        values: []
    }
    let processEdit = {
        set: [],

    }
    let conditionSp = {
        search: [],
        get: [],
        add: [],
        edit: [],
        delete: [],
    }
    let fieldName_List = []
    if (dataDescription.provider === 'mssql') {

        dataDescription.dataSet.forEach(row => {
            fieldName_List.push(row.FieldName)
            let type = ''
            if (['varchar', 'nvarchar', 'char', 'nchar'].includes(row.FieldType)) {
                type = `${row.FieldType}(${row.FieldSize == -1 ? 'max' : row.FieldSize})  = NULL`
            }
            else if ([, 'numeric', 'decimal',].includes(row.FieldType)) {
                type = `${row.FieldType}(${row.FieldSize},${row.NumericScale == null ? 0 : row.NumericScale})  = NULL`
            }
            else {
                type = `${row.FieldType} = NULL`
            }

            let paramName = `@${row.FieldName} ${type}`
            // if(!row.FieldName.includes('AddWhen','UpdateWhen','DeleteWhen')){
            if (row.FieldName != 'AddWhen' && row.FieldName != 'UpdateWhen' && row.FieldName != 'DeleteWhen') {

                if (row.FieldName == 'ID') {
                    paramsSp.get.push(paramName)
                    paramsSp.edit.push(paramName)
                    paramsSp.delete.push(paramName)

                }
                else if (row.FieldName == 'AddBy') {
                    paramsSp.add.push(paramName)
                    processAdd.fields.push(row.FieldName)
                    processAdd.values.push(`@${row.FieldName}`)
                }

                else if (row.FieldName == 'UpdateBy') {
                    paramsSp.edit.push(paramName)
                    processAdd.fields.push(row.FieldName)
                    processAdd.values.push(`@AddBy`)

                    processEdit.set.push(`${row.FieldName} = @${row.FieldName}`)
                }

                else if (row.FieldName == 'DeleteBy') {
                    paramsSp.delete.push(paramName)
                    processAdd.fields.push(row.FieldName)
                    processAdd.values.push(`NULL`)
                }



                else {
                    paramsSp.search.push(paramName)
                    paramsSp.edit.push(paramName)
                    paramsSp.add.push(paramName)

                    processAdd.fields.push(row.FieldName)
                    processAdd.values.push(`@${row.FieldName}`)

                    processEdit.set.push(`${row.FieldName} = @${row.FieldName}`)


                    if (['varchar', 'nvarchar', 'char', 'nchar'].includes(row.FieldType)) {
                        conditionSp.search.push(`((isnull(@${row.FieldName},'') = '') OR (${row.FieldName} LIKE '%' + @${row.FieldName} + '%'))`)
                    }
                    else if (['tinyint', 'numeric', 'decimal', 'float'].includes(row.FieldType)) {
                        conditionSp.search.push(`((isnull(@${row.FieldName},0) = 0) OR (${row.FieldName} = @${row.FieldName}))`)
                    }
                    // else {
                    //     conditionSp.search.push(`((@${row.FieldName} = null) OR (${row.FieldName} = @${row.FieldName}))`)
                    // }
                }
            }
            else {
                if (row.FieldName == 'AddWhen') {
                    processAdd.fields.push(row.FieldName)
                    processAdd.values.push('GETDATE()')
                }
                else if (row.FieldName == 'UpdateWhen') {
                    processAdd.fields.push(row.FieldName)
                    processAdd.values.push('GETDATE()')
                    processEdit.set.push(`${row.FieldName} = GETDATE()`)
                }
                else if (row.FieldName == 'DeleteWhen') {
                    processAdd.fields.push(row.FieldName)
                    processAdd.values.push(`NULL`)
                }
            }
        });
        spSearch += `CREATE PROCEDURE [dbo].[${dataDescription.tbName}_search]
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
        DeleteBy = @DeleteBy,
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
    } else if (dataDescription.provider === 'mysql') {

    }
    else {
        result.export = false;
    }
    // console.log('paramsSp : ',paramsSp) 

    // console.log(spSearch) 
    // console.log(result.content) 
    return result
}

function indexTable(dataDescription) {

    let result = {
        export: false,
        content: '',
        fileName: ''
    }
    let foreignKeyList = []
    dataDescription.dataSet.forEach(Field => {
        if (Field.FieldName.includes("ID_")) {
            foreignKeyList.push(Field.FieldName)
        }
    });

    if (dataDescription.provider === 'mssql') {
        console.log(foreignKeyList)
        let createIdx = ``
        if (foreignKeyList.length > 0) {
            foreignKeyList.forEach(fldName => {
                createIdx += `
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_${fldName}' AND object_id = OBJECT_ID('${dataDescription.tbName}'))
BEGIN
    DROP INDEX idx_${fldName} ON ${dataDescription.tbName};
END

CREATE NONCLUSTERED INDEX idx_${fldName} ON ${dataDescription.tbName}(${fldName});`
            });

            result.content = `/*\n${header()}*/
            
USE [${dataDescription.databaseName}]
GO

${createIdx}
            `
            result.fileName = `idx_standard_${dataDescription.tbName}.sql`
            result.export = true
        }
        else {

            result.export = false
        }

    }
    else if (dataDescription.provider === 'mysql') {

    }

    return result

}


module.exports.dbService = dbService
module.exports.baseVO_EXE = baseVO_EXE
module.exports.nodejsVO_EXE = nodejsVO_EXE
module.exports.nextjsVO_EXE = nextjsVO_EXE
module.exports.pythonVO_EXE = pythonVO_EXE
module.exports.codeigniterVO_EXE = codeigniterVO_EXE
module.exports.codeigniterController = codeigniterController
module.exports.dotNet4_5Controller = dotNet4_5Controller
module.exports.dotNet4_5_VO_EXE = dotNet4_5_VO_EXE
module.exports.storeProcedure = storeProcedure
module.exports.indexTable = indexTable