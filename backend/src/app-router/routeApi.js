const UserController = require("../module/user/user.controller")
const EquipmentController = require("../module/equipment/equipment.controller")
const BorrowReturnController = require("../module/borrowReturn/borrowReturn.comtroller")
const RequestController = require("../module/request/request.controller")

const router = require("express").Router()

router.post('/login', UserController.findUserNameAndPassword)
router.get('/user/:id', UserController.findOneUser)
router.get('/user', UserController.findAllUser)
router.post('/user', UserController.createUser)
router.put('/user', UserController.updateUser)
router.get('/user-delete/:id', UserController.deleteUserById)

router.get('/equipment', EquipmentController.findAllEquipment)
router.put('/equipment', EquipmentController.updateEquipment)
router.post('/equipment', EquipmentController.createEquipment)
router.post('/equipment-delete', EquipmentController.deleteEquipment)
router.get('/equipment/:id', EquipmentController.findOneEquipment)
router.get('/room', EquipmentController.findAllRoom)

router.get('/borrow-return-slip/:id', BorrowReturnController.findByUserBorrowReturnSlip)
router.get('/borrow-return-slip', BorrowReturnController.findAllBorrowReturnSlip)
router.get('/borrow-return-item', BorrowReturnController.findAllBorrowReturn)
router.post('/borrow-return-slip', BorrowReturnController.createBorrowReturnSlip)
router.get('/borrow-return-slip-detail/:id', BorrowReturnController.findBorrowReturnSlipDetail)
router.put('/borrow-return-slip', BorrowReturnController.borrowReturnSlip)


router.post('/request-slip', RequestController.requestSlip)
router.get('/request-slip', RequestController.getRequestSlip)
router.put('/approved', RequestController.approvedSlip)

module.exports = router