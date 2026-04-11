const UserService = require('../user/user.service')

const findAllUser = async (req, res) => {
    const data = await UserService.findAllUser()
    return res.json(data)
}
const findOneUser = async (req, res) => {
    const data = await UserService.findOneUser(req,res)
    return res.json(data)
}
const findUserNameAndPassword = async (req, res) => {
    const data = await UserService.findUserNameAndPassword(req,res)
    return res.json(data)
}
const createUser = async (req, res) => {
    const data = await UserService.createUser(req, res)
    return res.json(data)
}
const updateUser = async (req, res) => {
    const data = await UserService.updateUser(req, res)
    return res.json(data)
}
const deleteUserById = async (req, res) => {
    const data = await UserService.deleteUserById(req, res)
    return res.json(data)
}


module.exports = {
    findAllUser,
    findOneUser,
    findUserNameAndPassword,
    createUser,
    updateUser,
    deleteUserById
}