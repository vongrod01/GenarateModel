
const express = require('express')
const path = require('path')
const cors = require('cors')

// const csurf = require('csurf');
// const cookieParser = require('cookie-parser');
// const csrfMiddleware = csurf({
//     cookie: true
//   });


const app = express()
app.use(cors())
const fs=require("fs")
const myRouter = require('./routers/myRouter')
// const userRouter = require('./routers/userAPI')

// app.use(cookieParser());
// app.use(csrfMiddleware);
app.use(express.json());
app.set('views',path.join(__dirname,'views'))
app.set('view engine','ejs') // ทำให้ html เป็น dinamic โดยใช้ ejs
app.use(express.urlencoded({extended:false}))

// user router
app.use(myRouter)
// app.use(user)
app.use(express.static(path.join(__dirname,'node_modules')))
app.use(express.static(path.join(__dirname,'public')))

let systemConfig = JSON.parse(fs.readFileSync('SystemConfig.json','utf-8'))
const port = systemConfig.server.port
const serverHost = systemConfig.server.host





app.listen(port,serverHost,()=>{
    console.log(`start server in port ${port}, host name ${serverHost}`)
    
})