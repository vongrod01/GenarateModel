const { header } = require('./header')

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

module.exports.dbService = dbService
module.exports.baseVO_EXE = baseVO_EXE
