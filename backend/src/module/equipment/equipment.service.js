const Dao = require('./equipment.dao')
require('dotenv').config()

const findOneEquipment = async(req,res) => {
    try {
        const data= await Dao.findOne({id:req.params.id})
        return data
    } catch (error) {
        return error
    }
}
const findAllEquipment = async(req,res) => {
    try {
        let data= await Dao.findAll()
        return data
    } catch (error) {
        return error
    }
}

const findAllRoom = async(req,res) => {
    try {
        let data= await Dao.findAllRoom({table:`${process.env.DATABASE}.room`})
        return data
    } catch (error) {
        return error
    }
}

const updateEquipment = async(req,res) => {
    try {
        const data = await Dao.updateEquipment(req.body)
        return data
    } catch (error) {
        return error
    }
}
const createEquipment = async(req,res) => {
    try {
        const data = await Dao.createEquipment(req.body)
        return data
    } catch (error) {
        return error
    }
}
const deleteEquipment = async(req,res) => {
    try {
        const data = await Dao.deleteEquipment(req.body)
        return data
    } catch (error) {
        return error
    }
}

module.exports = {
    findAllEquipment,
    findAllRoom,
    findOneEquipment,
    createEquipment,
    updateEquipment,
    deleteEquipment
}