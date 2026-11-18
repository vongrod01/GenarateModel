// รวม generator ทุกภาษาไว้ที่เดียว — แต่ละภาษาอยู่ในโฟลเดอร์ ./generators
const base = require('./generators/base')
const nodejs = require('./generators/nodejs')
const nextjs = require('./generators/nextjs')
const python = require('./generators/python')
const codeigniter4 = require('./generators/codeigniter4')
const dotnet4_5 = require('./generators/dotnet4_5')
const sql = require('./generators/sql')

module.exports = {
    ...base,          // dbService, baseModelService
    ...nodejs,        // nodejsModelService
    ...nextjs,        // nextjsModelService
    ...python,        // pythonModelService
    ...codeigniter4,  // codeigniterModelService, codeigniterController
    ...dotnet4_5,     // dotNet4_5Controller, dotNet4_5_ModelService
    ...sql,           // storeProcedure, indexTable
}
