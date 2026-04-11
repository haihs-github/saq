const RequestService = require('../request/request.service')

const requestSlip = async (req, res) => {
    const data = await RequestService.requestSlip(req,res)
    return res.json(data)
}
const getRequestSlip = async (req, res) => {
    const data = await RequestService.getRequestSlip(req,res)
    return res.json(data)
}
const approvedSlip = async (req, res) => {
    const data = await RequestService.approvedSlip(req,res)
    return res.json(data)
}



module.exports = {
    requestSlip,
    getRequestSlip,
    approvedSlip
}