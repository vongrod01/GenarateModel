// Sample table description rows, shaped like what routers/connectDB_router.js
// TableDescription() returns once the rows are extracted.

const col = (FieldName, FieldType, FieldTypeDefine, FieldSize, extra = {}) => ({
  FieldName,
  FieldType,
  FieldTypeDefine,
  FieldSize,
  IsPrimaryKey: 0,
  IsIdentity: 0,
  ...extra,
});

// MSSQL shape (NumericScale, no MySQL-only columns)
const mssqlRows = [
  col("id", "int", "", 10, { NumericScale: 0, IsPrimaryKey: 1, IsIdentity: 1 }),
  col("name", "varchar", "", 50, { NumericScale: null }),
  col("amount", "decimal", "", 10, { NumericScale: 2 }),
  col("created_at", "datetime", "", "", { NumericScale: null }),
  col("note", "text", "", 2147483647, { NumericScale: null }),
];

// MySQL shape (extra catalog columns, FieldSize/Precision/Scale numeric)
const mysqlRows = [
  col("id", "int", "int(11)", 0, { TABLE_SCHEMA: "demo", TableName: "tb_order", FieldNo: 1, FieldPrecision: 10, FieldScale: 0, IsNullable: 0, IsPrimaryKey: 1, IsIdentity: 1 }),
  col("name", "varchar", "varchar(50)", 50, { TABLE_SCHEMA: "demo", TableName: "tb_order", FieldNo: 2, FieldPrecision: 0, FieldScale: 0, IsNullable: 1 }),
  col("amount", "decimal", "decimal(10,2)", 0, { TABLE_SCHEMA: "demo", TableName: "tb_order", FieldNo: 3, FieldPrecision: 10, FieldScale: 2, IsNullable: 1 }),
  col("created_at", "datetime", "datetime", 0, { TABLE_SCHEMA: "demo", TableName: "tb_order", FieldNo: 4, FieldPrecision: 0, FieldScale: 0, IsNullable: 1 }),
  col("note", "text", "text", 65535, { TABLE_SCHEMA: "demo", TableName: "tb_order", FieldNo: 5, FieldPrecision: 0, FieldScale: 0, IsNullable: 1 }),
];

export const sample = {
  mysql: { provider: "mysql", tbName: "tb_order", databaseName: "demo", dataSet: mysqlRows },
  mssql: { provider: "mssql", tbName: "tb_order", databaseName: "demo", dataSet: mssqlRows },
};

// What the DB layer returns for the MySQL tableDescription query:
// USE ...; SELECT ... gives [header packet for USE, rows]
export const mysqlMultiResult = [
  { fieldCount: 0, affectedRows: 0, insertId: 0, serverStatus: 10, warningCount: 0, message: "", protocol41: true, changedRows: 0 },
  mysqlRows,
];
