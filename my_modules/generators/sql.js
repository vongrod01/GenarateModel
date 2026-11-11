const { header } = require('./header')

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
                    else if (['int','tinyint', 'numeric', 'decimal', 'float'].includes(row.FieldType)) {
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


module.exports.storeProcedure = storeProcedure
module.exports.indexTable = indexTable
