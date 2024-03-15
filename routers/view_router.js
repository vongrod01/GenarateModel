
const express = require('express')
const router = express.Router()
const fs = require("fs")

let systemConfig = JSON.parse(fs.readFileSync('SystemConfig.json', 'utf-8'))

router.get('/genmodel', (req, res) => {
    res.render('index.ejs', systemConfig.description)
})

module.exports = router