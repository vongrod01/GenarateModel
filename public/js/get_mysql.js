async function connMysql(){
    reqAndRes('/structureDatabase','get',{
        provider:'mysql',
        databaseName:'denso_insp_mc',
        user:'root',
        password:'rt9125',
        host:'localhost',
        port:'3306',
    },async (res)=>{
        console.log(res)
    })
}