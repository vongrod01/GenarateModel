
const express = require('express')
const path = require('path')
const cors = require('cors')

const session = require('express-session')

const app = express()
app.use(cors())
// let genuuid=require('uuid');
const fs = require("fs")
const connectDB_router = require('./routers/connectDB_router')
const exportFile_router = require('./routers/exportFile_router')
const view_router = require('./routers/view_router')
// const userRouter = require('./routers/userAPI')
function genuuid(){
    return require('uuid')
}
// app.use(cookieParser());
// app.use(csrfMiddleware);
app.use(express.json());
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs') // ทำให้ html เป็น dinamic โดยใช้ ejs
app.use(express.urlencoded({ extended: false }))

app.use(session(
    {
        name: 'SessionCookie',
        genid: function (req) {
            // console.log('session id created');
            return genuuid();
        },
        secret: 'Shsh!Secret!',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false, expires: 60000 }
    }));
// user router
app.use(view_router, connectDB_router, exportFile_router)
// app.use(user)
app.use(express.static(path.join(__dirname, 'node_modules')))
app.use(express.static(path.join(__dirname, 'public')))

let systemConfig = JSON.parse(fs.readFileSync('SystemConfig.json', 'utf-8'))
const port = systemConfig.server.port
const serverHost = systemConfig.server.host





app.listen(port, serverHost, () => {
    console.log(`start server in port ${port}, host name ${serverHost}`)

})