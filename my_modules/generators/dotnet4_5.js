const { header } = require('./header')

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
            public Boolean Success { get; set; }
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
                var ${instanceModel} = new ${className}Model();
                var result = new DataResponse()
                {
                    Success = true,
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
                    Success = false,
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
                    Success = false,
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
                    result.Success = true;
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
                    Success = false,
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
                    Success = false,
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
                    result.Success = true;
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
                    Success = false,
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
                    Success = true,
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
                    Success = false,
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
                    Success = false,
                    Message = new { Message = "Invalid body" },
                };

                return Json(result, JsonRequestBehavior.AllowGet);
            }

            try
            {
                var ${instanceService} = new ${className}Service();

                var result = new DataResponse()
                {
                    Success = ${instanceService}.Delete(data),
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
                    Success = false,
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



module.exports.dotNet4_5Controller = dotNet4_5Controller
module.exports.dotNet4_5_VO_EXE = dotNet4_5_VO_EXE
