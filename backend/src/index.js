const express  = require("express")
const app = express()
const path = require("path")
const cors = require('cors')
const PORT = process.env.PORT || 8080
const Router = require("./app-router/routeApi")
app.use(express.urlencoded({extended: true}))
app.use(express.json())
app.use(cors()) 

app.use('/public', express.static(path.join(__dirname, '/public')))
app.use('/api', Router)
 
app.listen(PORT, ()=>{
    console.log(`[INFO] Server is running on port ${PORT}`)
})
