const Dao = require('../user/user.dao')
require('dotenv').config()

const token = (length) => {
    const characters = process.env.TOKEN
    let result = ''
    const charactersLength = characters.length
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
}
function normalizeRole(role) {
    return role.replace(/\s+/g, '');
}

const findAllUser = async (req, res) => {
    try {
        const data = await Dao.findAll()
        return data
    } catch (error) {
        return error
    }
}
const findOneUser = async (req, res) => {
    try {
        const data = await Dao.findOneUser(req.params.id)
        return data
    } catch (error) {
        return error
    }
}
const findUserNameAndPassword = async (req, res) => {
    try {
        const data = await Dao.findUserNameAndPassword({ table: `datn.USER`, userName: req.body.userName, password: req.body.password })
        return { token: data.ID + token(20) + normalizeRole(data.USER_Role) }
    } catch (error) {
        return error
    }
}
const createUser = async (req, res) => {
    try {
        const data = await Dao.createUser(req.body)
        return data
    } catch (error) {
        return error
    }
}
const updateUser = async (req, res) => {
    try {
        const data = await Dao.updateUser(req.body)
        return data
    } catch (error) {
        return error
    }
}
const deleteUserById = async (req, res) => {
    try {
        const data = await Dao.deleteUserById(req.params.id)
        return data
    } catch (error) {
        return error
    }
}


module.exports = {
    token,           // export để test trực tiếp
    normalizeRole,   // export để test trực tiếp
    findAllUser,
    findOneUser,
    findUserNameAndPassword,
    createUser,
    updateUser,
    deleteUserById
}