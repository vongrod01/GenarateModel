// SQL text used by the Worker. It MIRRORS routers/connectDB_router.js (the Express app):
// test/queries.test.mjs fails if the two drift apart (whitespace aside).
// Database and table names are interpolated as in the Express app (they come from the
// user's own connection, so they can only affect the user's own database).

export function databaseListSql(provider) {
  if (provider === "mysql") return "SHOW DATABASES";
  if (provider === "mssql") return "SELECT name as [Database] FROM master.dbo.sysdatabases";
  return null;
}

export function tableListSql(provider, databaseName) {
  if (provider === "mysql") {
    return `SELECT table_name AS TableName FROM information_schema.tables WHERE table_schema='${databaseName}'`;
  }
  if (provider === "mssql") {
    return `select distinct TABLE_NAME as TableName from ${databaseName}.INFORMATION_SCHEMA.COLUMNS`;
  }
  return null;
}

export function tableDescriptionSql(provider, databaseName, tbName) {
  if (provider === "mysql") {
    return `

USE information_schema;
   SELECT
      COLUMNS.TABLE_SCHEMA,
      COLUMNS.TABLE_NAME AS TableName,
      COLUMNS.ORDINAL_POSITION AS FieldNo,
      COLUMNS.COLUMN_NAME AS FieldName,
      CAST(COLUMNS.DATA_TYPE as CHAR(100)) AS FieldType,
      CAST(COLUMNS.COLUMN_TYPE as CHAR(100)) AS FieldTypeDefine,
      COALESCE(COLUMNS.CHARACTER_MAXIMUM_LENGTH,0) AS FieldSize,
      COALESCE(COLUMNS.NUMERIC_PRECISION,0) AS FieldPrecision,
      COALESCE(COLUMNS.NUMERIC_SCALE,0) AS FieldScale,
      CASE COLUMNS.IS_NULLABLE
        WHEN 'YES' THEN 1
        WHEN 'NO' THEN 0
      END AS IsNullable,
      CASE COALESCE(COLUMNS.COLUMN_KEY,'')
        WHEN 'PRI' THEN 1
        ELSE 0
      END AS IsPrimaryKey,
      CASE
        WHEN COLUMNS.EXTRA LIKE '%auto_increment%' THEN 1
        ELSE 0
      END AS IsIdentity,

      CASE COALESCE(COLUMNS.COLUMN_NAME,'')
        WHEN 'AddBy' THEN 1
        ELSE 0
      END AS IsCreateUser,

      CASE COALESCE(COLUMNS.COLUMN_NAME,'')
        WHEN 'UpdateBy' THEN 1
        ELSE 0
      END AS IsModifyUser,

      CASE COALESCE(COLUMNS.COLUMN_NAME,'')
        WHEN 'AddDate' THEN 1
        WHEN 'CreateDate' THEN 1
        WHEN 'create_date' THEN 1
        ELSE 0
      END AS IsCreateDate,

      CASE COALESCE(COLUMNS.COLUMN_NAME,'')
        WHEN 'UpdateDate' THEN 1
        WHEN 'EditDate' THEN 1
        WHEN 'update_date' THEN 1
        ELSE 0
      END AS IsModifyDate
    FROM
      COLUMNS
    WHERE
     COLUMNS.TABLE_SCHEMA = '${databaseName}' AND
     COLUMNS.TABLE_NAME = '${tbName}'
    ORDER BY
      COLUMNS.ORDINAL_POSITION
    `;
  }
  if (provider === "mssql") {
    return `
                select
                c.COLUMN_NAME as FieldName,
                c.DATA_TYPE as FieldType,
                '' as FieldTypeDefine,
                case when c.CHARACTER_MAXIMUM_LENGTH is not null then
                c.CHARACTER_MAXIMUM_LENGTH
                when c.NUMERIC_PRECISION is not null then
                c.NUMERIC_PRECISION
                else '' end as FieldSize,
                c.NUMERIC_SCALE as NumericScale,
                case when pk.COLUMN_NAME is not null then 1 else 0 end as IsPrimaryKey,
                case when sc.is_identity = 1 then 1 else 0 end as IsIdentity
                from [${databaseName}].INFORMATION_SCHEMA.COLUMNS c
                left join (
                    select kcu.TABLE_SCHEMA, kcu.TABLE_NAME, kcu.COLUMN_NAME
                    from [${databaseName}].INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
                    join [${databaseName}].INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
                      on kcu.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA
                     and kcu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
                     and kcu.TABLE_NAME = tc.TABLE_NAME
                    where tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
                ) pk
                  on pk.TABLE_SCHEMA = c.TABLE_SCHEMA
                 and pk.TABLE_NAME = c.TABLE_NAME
                 and pk.COLUMN_NAME = c.COLUMN_NAME
                left join [${databaseName}].sys.schemas ss on ss.name = c.TABLE_SCHEMA
                left join [${databaseName}].sys.tables st on st.name = c.TABLE_NAME and st.schema_id = ss.schema_id
                left join [${databaseName}].sys.columns sc on sc.object_id = st.object_id and sc.name = c.COLUMN_NAME
                where c.TABLE_NAME = '${tbName}'
                order by c.ORDINAL_POSITION
            `;
  }
  return null;
}
