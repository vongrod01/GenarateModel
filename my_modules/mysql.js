const mysql = require('mysql');
const util = require('util')
class MysqlConnection {
    constructor(connDetail) {
        this._dataSet = []
        this._paramsOut = []
        let conn = ''

        try {
            connDetail.insecureAuth = true
            connDetail.multipleStatements = true
            connDetail.localAddress = connDetail.host
            // console.log('connDetail : ',connDetail)
            conn = mysql.createConnection(connDetail);
            conn.connect(function (err) {
                if (err) {
                    console.log(err)
                } else {

                    console.log(`[${connDetail.host}.${connDetail.database}] Connected!`);
                }
            });

            this.query = util.promisify(conn.query).bind(conn)
        } catch (error) {
            console.log('connection error : ', error)
        }
    }

    get dataSet() {
        return this._dataSet
    }
    set dataSet(value) {
        if (typeof value === 'undefined') {
            this._dataSet = []
        }
        else {
            this._dataSet = value
        }
    }

    get paramsOut() {
        return this._paramsOut
    }
    set paramsOut(value) {
        if (typeof value === 'undefined') {
            this._paramsOut = []
        }
        else {
            this._paramsOut = value
        }
    }

    async execSQL(sql) {
        try {
            this.dataSet = await this.query(sql)
        } catch (error) {
            this.dataSet = []
        }
    }

    async callSp(spName, params) {
        this.dataSet = []
        this.paramsOut = []

        try {
            function valType(val) {
                if (typeof val === 'string') {
                    return `'${val}'`
                }
                else if (val instanceof Date) {
                    return `'${val.getFullYear().toString() + "/" + (val.getMonth() + 1).toString() + "/" + val.getDate() + ' ' + val.getHours() + ":" + val.getMinutes() + ":" + val.getSeconds()}'`
                }
                else {
                    return val
                }
            }
            let callSpScript = `call ${spName}(`
            let setVar = ''
            let outParams = 'select '
            if (params.length > 0) {

                for (let i = 0; i < params.length; i++) {
                    setVar += `set @param${i + 1} = ${valType(params[i])};`
                    if (i !== params.length - 1) {

                        outParams += `@param${i + 1} as Param${i + 1},`
                        callSpScript += `@param${i + 1},`
                    }
                    else {
                        outParams += `@param${i + 1} as Param${i + 1};`
                        callSpScript += `@param${i + 1});`
                    }

                }
            }
            else {
                outParams = ''
                callSpScript = `call ${spName}();`
            }


            let data = await this.query(setVar + callSpScript + outParams)
            if (typeof data[params.length][0] === 'undefined') {
                this.dataSet = []
            }
            else {
                this.dataSet = data[params.length]
            }
            this.paramsOut = data[params.length + 1][0]
        } catch (error) {
            console.log(error)
        }


    }

}
module.exports.MysqlConnection = MysqlConnection
