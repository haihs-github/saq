const BorrowReturnService = require('./borrowReturn.service')
const findByUserBorrowReturnSlip = async (req, res) => {
    const data = await BorrowReturnService.findByUserBorrowReturnSlip(req,res)
    return res.json(data)
}
const findBorrowReturnSlipDetail = async (req, res) => {
    const data = await BorrowReturnService.findBorrowReturnSlipDetail(req,res)
    return res.json(data)
}
const findAllBorrowReturnSlip = async (req, res) => {
    const data = await BorrowReturnService.findAllBorrowReturnSlip()
    return res.json(data)
}
const findAllBorrowReturn = async (req, res) => {
    const data = await BorrowReturnService.findAllBorrowReturn(req, res)
    return res.json(data)
}
const borrowReturnSlip = async (req, res) => {
    const data = await BorrowReturnService.borrowReturnSlip(req, res)
    return res.json(data)
}
const createBorrowReturnSlip = async (req, res) => {
    const data = await BorrowReturnService.createBorrowReturnSlip(req, res)
    return res.json(data)
}


module.exports = {
    findAllBorrowReturnSlip,
    findAllBorrowReturn,
    createBorrowReturnSlip,
    borrowReturnSlip,
    findByUserBorrowReturnSlip,
    findBorrowReturnSlipDetail
}