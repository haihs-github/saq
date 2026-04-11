const Dao = require('./request.dao')
require('dotenv').config()


const requestSlip = async(req,res) => {
        try {
       const data = await Dao.requestSlip(req.body)
        return data
    } catch (error) {
        return error
    }
}
const getRequestSlip = async(req,res) => {
        try {
       const data = await Dao.getAllRequestSlip(req.body)
        return data
    } catch (error) {
        return error
    }
}
const approvedSlip = async(req,res) => {
        try {
       const data = await Dao.approvedSlip(req.body)
        return data
    } catch (error) {
        return error
    }
}


module.exports = {
    requestSlip,
    getRequestSlip,
    approvedSlip
}