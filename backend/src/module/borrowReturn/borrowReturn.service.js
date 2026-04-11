const Dao = require('./borrowReturn.dao')
require('dotenv').config()

const findByUserBorrowReturnSlip = async(req,res) => {
    try {
        const data= await Dao.findByUserBorrowReturnSlipDAO(req.params.id)
        return data
    } catch (error) {
        return error
    }
}
const findBorrowReturnSlipDetail = async(req,res) => {
    try {
        const data= await Dao.findBorrowReturnSlipDetailDAO(req.params.id)
        return data
    } catch (error) {
        return error
    }
}
const findAllBorrowReturnSlip = async(req,res) => {
    try {
        const data= await Dao.findAllBorrowReturnSlipDAO()
        return data
    } catch (error) {
        return error
    }
}

const createBorrowReturnSlip = async(req,res) => {
    try {
        const data= await Dao.createBorrowReturnSlipDAO(req.body)
        return data
    } catch (error) {
        return error
    }
}
const borrowReturnSlip = async(req,res) => {
    try {
        let data= await Dao.borrowReturnSlipDAO(req.body)
        return data
    } catch (error) {
        return error
    }
}
const findAllBorrowReturn = async(req,res) => {
    try {
        let data= await Dao.findAllBorrowReturn()
        return data
    } catch (error) {
        return error
    }
}

module.exports = {
    findAllBorrowReturnSlip,
    createBorrowReturnSlip,
    borrowReturnSlip,
    findAllBorrowReturn,
    findByUserBorrowReturnSlip,
    findBorrowReturnSlipDetail
}