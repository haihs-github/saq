const EquipmentService = require('./equipment.service')

const findOneEquipment = async (req, res) => {
    const data = await EquipmentService.findOneEquipment(req,res)
    return res.json(data)
}
const findAllEquipment = async (req, res) => {
    const data = await EquipmentService.findAllEquipment()
    return res.json(data)
}

const findAllThietBiHsd = async (req, res) => {
    const data = await ThietBiService.findAllThietBiHsd()
    return res.json(data)
}
const findAllRoom = async (req, res) => {
    const data = await EquipmentService.findAllRoom()
    return res.json(data)
}

const updateEquipment = async (req, res) => {
    const data = await EquipmentService.updateEquipment(req, res)
    return res.json(data)
}
const createEquipment = async (req, res) => {
    const data = await EquipmentService.createEquipment(req, res)
    return res.json(data)
}
const deleteEquipment = async (req, res) => {
    const data = await EquipmentService.deleteEquipment(req, res)
    return res.json(data)
}


module.exports = {
    findAllEquipment,
    findAllThietBiHsd,
    findAllRoom,
    findOneEquipment,
    createEquipment,
    updateEquipment,
    deleteEquipment
}