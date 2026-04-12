/**
 * Unit Test Script: equipment.service.js
 * File được test: backend/src/module/equipment/equipment.service.js
 *
 * Mục tiêu:
 *  - Test service layer (wrapper/flow + error handling) một cách cô lập.
 *  - Không dùng DB thật, không gọi DAO thật.
 *
 * CheckDB (theo yêu cầu đề bài):
 *  - Service không truy cập DB trực tiếp, nhưng có “điểm chạm DB” thông qua DAO.
 *  - Vì vậy CheckDB ở đây được hiểu là verify: gọi đúng hàm DAO, đúng số lần,
 *    đúng tham số (args) để đảm bảo truy cập DB (ở tầng DAO) là đúng theo yêu cầu.
 *
 * Rollback (theo yêu cầu đề bài):
 *  - Service unit tests dùng mock DAO hoàn toàn nên không có thay đổi DB thật để rollback.
 *  - Rollback ở mức unit test được thực hiện bằng việc reset mock state + khôi phục env
 *    (process.env.DATABASE) sau mỗi test để đảm bảo trạng thái trở về như trước test.
 */

// ─── Mock DAO TRƯỚC khi require Service ───────────────────────────────────
jest.mock('../../module/equipment/equipment.dao', () => ({
	findAll: jest.fn(),
	findAllRoom: jest.fn(),
	findOne: jest.fn(),
	createEquipment: jest.fn(),
	updateEquipment: jest.fn(),
	deleteEquipment: jest.fn(),
}))

const EquipmentDao = require('../../module/equipment/equipment.dao')
const EquipmentService = require('../../module/equipment/equipment.service')

function createMockReq({ params = {}, body = {} } = {}) {
	return { params, body }
}

function createMockRes() {
	return {}
}

describe('backend/src/module/equipment/equipment.service.js - EquipmentService (Service Layer)', () => {
	const originalDatabaseEnv = process.env.DATABASE

	beforeEach(() => {
		// Rollback (unit level): reset trạng thái mock trước mỗi test.
		jest.clearAllMocks()
		process.env.DATABASE = originalDatabaseEnv
	})

	afterEach(() => {
		// Rollback (unit level): đảm bảo không rò rỉ mock/env sang test khác.
		jest.clearAllMocks()
		process.env.DATABASE = originalDatabaseEnv
	})

	// =====================================================================
	// 1) findAllEquipment()
	// =====================================================================
	describe('findAllEquipment()', () => {
		// Test Case ID: TC_EQ_FINDALL_01
		it('TC_EQ_FINDALL_01 - nên trả về danh sách thiết bị khi DAO resolve nhiều bản ghi', async () => {
			// Arrange
			const mockEquipments = [
				{ ID: 1, EQUIPMENT_ITEM_Name: 'EPX200-001', EQUIPMENT_ITEM_Status: 'Có sẵn', EQUIPMENT_TYPE_Name: 'Projector' },
				{ ID: 2, EQUIPMENT_ITEM_Name: 'DL15-001', EQUIPMENT_ITEM_Status: 'Có sẵn', EQUIPMENT_TYPE_Name: 'Laptop' },
			]
			EquipmentDao.findAll.mockResolvedValue(mockEquipments)

			// Act
			const result = await EquipmentService.findAllEquipment(createMockReq(), createMockRes())

			// Assert
			expect(result).toEqual(mockEquipments)
			// CheckDB: verify gọi đúng DAO
			expect(EquipmentDao.findAll).toHaveBeenCalledTimes(1)
			expect(EquipmentDao.findAll).toHaveBeenCalledWith()
		})

		// Test Case ID: TC_EQ_FINDALL_02
		it('TC_EQ_FINDALL_02 - nên trả về chỉ thiết bị active khi DAO đã lọc inactive', async () => {
			// Arrange
			const mockEquipments = [{ ID: 1, EQUIPMENT_ITEM_Status: 'Có sẵn' }]
			EquipmentDao.findAll.mockResolvedValue(mockEquipments)

			// Act
			const result = await EquipmentService.findAllEquipment(createMockReq(), createMockRes())

			// Assert
			expect(result).toEqual(mockEquipments)
			expect(EquipmentDao.findAll).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_EQ_FINDALL_03
		it('TC_EQ_FINDALL_03 - nên trả về mảng rỗng khi DAO trả []', async () => {
			// Arrange
			EquipmentDao.findAll.mockResolvedValue([])

			// Act
			const result = await EquipmentService.findAllEquipment(createMockReq(), createMockRes())

			// Assert
			expect(result).toEqual([])
			// CheckDB
			expect(EquipmentDao.findAll).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_EQ_FINDALL_04
		it('TC_EQ_FINDALL_04 - nên trả về mảng rỗng khi hệ thống chưa có thiết bị', async () => {
			// Arrange
			EquipmentDao.findAll.mockResolvedValue([])

			// Act
			const result = await EquipmentService.findAllEquipment(createMockReq(), createMockRes())

			// Assert
			expect(result).toEqual([])
		})

		// Test Case ID: TC_EQ_FINDALL_05
		it('TC_EQ_FINDALL_05 - nên trả về đúng cấu trúc dữ liệu JOIN 3 bảng như DAO trả về', async () => {
			// Arrange
			const joinedRow = {
				ID: 1,
				EQUIPMENT_ITEM_Name: 'EPX200-001',
				EQUIPMENT_ITEM_PurchaseDate: '2024-01-10',
				EQUIPMENT_ITEM_Price: 12000000,
				EQUIPMENT_ITEM_Quantity: 1,
				EQUIPMENT_ITEM_Status: 'Có sẵn',
				EQUIPMENT_MODEL_ID: 1,
				EQUIPMENT_MODEL_Name: 'Epson X200',
				EQUIPMENT_MODEL_Branch: 'Epson',
				EQUIPMENT_TYPE_ID: 1,
				EQUIPMENT_TYPE_Name: 'Projector',
			}
			EquipmentDao.findAll.mockResolvedValue([joinedRow])

			// Act
			const result = await EquipmentService.findAllEquipment(createMockReq(), createMockRes())

			// Assert
			expect(result).toEqual([joinedRow])
		})

		// Test Case ID: TC_EQ_FINDALL_06
		it('TC_EQ_FINDALL_06 - nên trả về nhiều loại thiết bị khác nhau như DAO trả về', async () => {
			// Arrange
			const mockEquipments = [
				{ ID: 1, EQUIPMENT_TYPE_Name: 'Projector' },
				{ ID: 2, EQUIPMENT_TYPE_Name: 'Laptop' },
				{ ID: 3, EQUIPMENT_TYPE_Name: 'Speaker' },
			]
			EquipmentDao.findAll.mockResolvedValue(mockEquipments)

			// Act
			const result = await EquipmentService.findAllEquipment(createMockReq(), createMockRes())

			// Assert
			expect(result).toHaveLength(3)
			expect(result.map(r => r.EQUIPMENT_TYPE_Name)).toEqual(['Projector', 'Laptop', 'Speaker'])
		})

		// Test Case ID: TC_EQ_FINDALL_07
		it('TC_EQ_FINDALL_07 - CheckDB: gọi Dao.findAll đúng 1 lần, không truyền tham số', async () => {
			// Arrange
			EquipmentDao.findAll.mockResolvedValue([])

			// Act
			await EquipmentService.findAllEquipment(createMockReq(), createMockRes())

			// Assert (CheckDB)
			expect(EquipmentDao.findAll).toHaveBeenCalledTimes(1)
			expect(EquipmentDao.findAll).toHaveBeenCalledWith()
		})

		// Test Case ID: TC_EQ_FINDALL_08
		it('TC_EQ_FINDALL_08 - nên trả về error object khi DAO reject (mất kết nối)', async () => {
			// Arrange
			const daoError = new Error('ECONNREFUSED')
			EquipmentDao.findAll.mockRejectedValue(daoError)

			// Act
			const result = await EquipmentService.findAllEquipment(createMockReq(), createMockRes())

			// Assert
			expect(result).toBe(daoError)
		})

		// Test Case ID: TC_EQ_FINDALL_09
		it('TC_EQ_FINDALL_09 - nên trả về error object khi DAO reject (timeout)', async () => {
			// Arrange
			const daoError = new Error('Query timeout')
			EquipmentDao.findAll.mockRejectedValue(daoError)

			// Act
			const result = await EquipmentService.findAllEquipment(createMockReq(), createMockRes())

			// Assert
			expect(result).toBe(daoError)
		})
	})

	// =====================================================================
	// 2) findOneEquipment()
	// =====================================================================
	describe('findOneEquipment()', () => {
		// Test Case ID: TC_EQ_FINDONE_01
		it('TC_EQ_FINDONE_01 - nên trả về thiết bị khi req.params.id hợp lệ (type=equipment)', async () => {
			// Arrange
			const req = createMockReq({ params: { id: '1|equipment' } })
			const mockEquipment = { ID: 1, EQUIPMENT_ITEM_Name: 'EPX200-001', EQUIPMENT_ITEM_Status: 'Có sẵn' }
			EquipmentDao.findOne.mockResolvedValue(mockEquipment)

			// Act
			const result = await EquipmentService.findOneEquipment(req, createMockRes())

			// Assert
			expect(result).toEqual(mockEquipment)
			// CheckDB
			expect(EquipmentDao.findOne).toHaveBeenCalledTimes(1)
			expect(EquipmentDao.findOne).toHaveBeenCalledWith({ id: '1|equipment' })
		})

		// Test Case ID: TC_EQ_FINDONE_02
		it('TC_EQ_FINDONE_02 - nên trả về phòng khi req.params.id hợp lệ (type=room)', async () => {
			// Arrange
			const req = createMockReq({ params: { id: '1|room' } })
			const mockRoom = { ID: 1, ROOM_Name: 'A101', ROOM_Status: 'Có sẵn' }
			EquipmentDao.findOne.mockResolvedValue(mockRoom)

			// Act
			const result = await EquipmentService.findOneEquipment(req, createMockRes())

			// Assert
			expect(result).toEqual(mockRoom)
			expect(EquipmentDao.findOne).toHaveBeenCalledWith({ id: '1|room' })
		})

		// Test Case ID: TC_EQ_FINDONE_03
		it('TC_EQ_FINDONE_03 - nên trả về undefined khi DAO resolve undefined (thiết bị inactive)', async () => {
			// Arrange
			const req = createMockReq({ params: { id: '5|equipment' } })
			EquipmentDao.findOne.mockResolvedValue(undefined)

			// Act
			const result = await EquipmentService.findOneEquipment(req, createMockRes())

			// Assert
			expect(result).toBeUndefined()
		})

		// Test Case ID: TC_EQ_FINDONE_04
		it('TC_EQ_FINDONE_04 - nên trả về undefined khi DAO resolve undefined (phòng inactive)', async () => {
			// Arrange
			const req = createMockReq({ params: { id: '2|room' } })
			EquipmentDao.findOne.mockResolvedValue(undefined)

			// Act
			const result = await EquipmentService.findOneEquipment(req, createMockRes())

			// Assert
			expect(result).toBeUndefined()
		})

		// Test Case ID: TC_EQ_FINDONE_05
		it('TC_EQ_FINDONE_05 - nên trả về undefined khi ID thiết bị không tồn tại', async () => {
			// Arrange
			const req = createMockReq({ params: { id: '9999|equipment' } })
			EquipmentDao.findOne.mockResolvedValue(undefined)

			// Act
			const result = await EquipmentService.findOneEquipment(req, createMockRes())

			// Assert
			expect(result).toBeUndefined()
		})

		// Test Case ID: TC_EQ_FINDONE_06
		it('TC_EQ_FINDONE_06 - nên trả về undefined khi ID phòng không tồn tại', async () => {
			// Arrange
			const req = createMockReq({ params: { id: '9999|room' } })
			EquipmentDao.findOne.mockResolvedValue(undefined)

			// Act
			const result = await EquipmentService.findOneEquipment(req, createMockRes())

			// Assert
			expect(result).toBeUndefined()
		})

		// Test Case ID: TC_EQ_FINDONE_07
		it('TC_EQ_FINDONE_07 - CheckDB: truyền đúng object {id} xuống DAO', async () => {
			// Arrange
			const req = createMockReq({ params: { id: '3|equipment' } })
			EquipmentDao.findOne.mockResolvedValue({ ID: 3 })

			// Act
			await EquipmentService.findOneEquipment(req, createMockRes())

			// Assert (CheckDB)
			expect(EquipmentDao.findOne).toHaveBeenCalledTimes(1)
			expect(EquipmentDao.findOne).toHaveBeenCalledWith({ id: '3|equipment' })
		})

		// Test Case ID: TC_EQ_FINDONE_08
		it('TC_EQ_FINDONE_08 - nên trả về đúng cấu trúc JOIN 3 bảng cho thiết bị như DAO trả', async () => {
			// Arrange
			const req = createMockReq({ params: { id: '1|equipment' } })
			const joinedEquipment = {
				ID: 1,
				EQUIPMENT_ITEM_Name: 'EPX200-001',
				EQUIPMENT_MODEL_Name: 'Epson X200',
				EQUIPMENT_MODEL_Branch: 'Epson',
				EQUIPMENT_TYPE_Name: 'Projector',
				EQUIPMENT_TYPE_Description: 'Máy chiếu phục vụ giảng dạy',
			}
			EquipmentDao.findOne.mockResolvedValue(joinedEquipment)

			// Act
			const result = await EquipmentService.findOneEquipment(req, createMockRes())

			// Assert
			expect(result).toEqual(joinedEquipment)
		})

		// Test Case ID: TC_EQ_FINDONE_09
		it('TC_EQ_FINDONE_09 - nên trả về đúng cấu trúc JOIN 2 bảng cho phòng như DAO trả', async () => {
			// Arrange
			const req = createMockReq({ params: { id: '1|room' } })
			const joinedRoom = {
				ID: 1,
				ROOM_Name: 'A101',
				ROOM_Capacity: 40,
				ROOM_Status: 'Có sẵn',
				LOCATION_Building: 'A',
				LOCATION_Floor: 1,
				ROOM_TYPE_Name: 'Classroom',
			}
			EquipmentDao.findOne.mockResolvedValue(joinedRoom)

			// Act
			const result = await EquipmentService.findOneEquipment(req, createMockRes())

			// Assert
			expect(result).toEqual(joinedRoom)
		})

		// Test Case ID: TC_EQ_FINDONE_10
		it('TC_EQ_FINDONE_10 - nên trả về error object khi DAO reject', async () => {
			// Arrange
			const req = createMockReq({ params: { id: '1|equipment' } })
			const daoError = new Error('DB error')
			EquipmentDao.findOne.mockRejectedValue(daoError)

			// Act
			const result = await EquipmentService.findOneEquipment(req, createMockRes())

			// Assert
			expect(result).toBe(daoError)
		})

		// Test Case ID: TC_EQ_FINDONE_11
		it('TC_EQ_FINDONE_11 - nên trả về error object khi type không hợp lệ (DAO reject)', async () => {
			// Arrange
			const req = createMockReq({ params: { id: '1|invalid' } })
			const daoError = new Error('Type không hợp lệ')
			EquipmentDao.findOne.mockRejectedValue(daoError)

			// Act
			const result = await EquipmentService.findOneEquipment(req, createMockRes())

			// Assert
			expect(result).toBe(daoError)
			// CheckDB
			expect(EquipmentDao.findOne).toHaveBeenCalledWith({ id: '1|invalid' })
		})
	})

	// =====================================================================
	// 3) findAllRoom()
	// =====================================================================
	describe('findAllRoom()', () => {
		// Test Case ID: TC_ROOM_FINDALL_01
		it('TC_ROOM_FINDALL_01 - nên trả về danh sách phòng khi DAO resolve nhiều phòng active', async () => {
			// Arrange
			process.env.DATABASE = 'datn'
			const mockRooms = [
				{ ID: 1, ROOM_Name: 'A101', ROOM_Status: 'Có sẵn', ROOM_TYPE_Name: 'Classroom' },
				{ ID: 2, ROOM_Name: 'B201', ROOM_Status: 'Có sẵn', ROOM_TYPE_Name: 'Lab' },
				{ ID: 3, ROOM_Name: 'C01', ROOM_Status: 'Có sẵn', ROOM_TYPE_Name: 'Conference' },
			]
			EquipmentDao.findAllRoom.mockResolvedValue(mockRooms)

			// Act
			const result = await EquipmentService.findAllRoom(createMockReq(), createMockRes())

			// Assert
			expect(result).toEqual(mockRooms)
			// CheckDB
			expect(EquipmentDao.findAllRoom).toHaveBeenCalledTimes(1)
			expect(EquipmentDao.findAllRoom).toHaveBeenCalledWith({ table: 'datn.room' })
		})

		// Test Case ID: TC_ROOM_FINDALL_02
		it('TC_ROOM_FINDALL_02 - nên trả về chỉ phòng active khi DAO đã lọc inactive', async () => {
			// Arrange
			process.env.DATABASE = 'datn'
			EquipmentDao.findAllRoom.mockResolvedValue([{ ID: 1, ROOM_Status: 'Có sẵn' }])

			// Act
			const result = await EquipmentService.findAllRoom(createMockReq(), createMockRes())

			// Assert
			expect(result).toEqual([{ ID: 1, ROOM_Status: 'Có sẵn' }])
		})

		// Test Case ID: TC_ROOM_FINDALL_03
		it('TC_ROOM_FINDALL_03 - nên trả về [] khi DAO trả [] (tất cả phòng inactive)', async () => {
			// Arrange
			process.env.DATABASE = 'datn'
			EquipmentDao.findAllRoom.mockResolvedValue([])

			// Act
			const result = await EquipmentService.findAllRoom(createMockReq(), createMockRes())

			// Assert
			expect(result).toEqual([])
		})

		// Test Case ID: TC_ROOM_FINDALL_04
		it('TC_ROOM_FINDALL_04 - nên trả về [] khi hệ thống chưa có phòng', async () => {
			// Arrange
			process.env.DATABASE = 'datn'
			EquipmentDao.findAllRoom.mockResolvedValue([])

			// Act
			const result = await EquipmentService.findAllRoom(createMockReq(), createMockRes())

			// Assert
			expect(result).toEqual([])
		})

		// Test Case ID: TC_ROOM_FINDALL_05
		it('TC_ROOM_FINDALL_05 - nên trả về đúng cấu trúc JOIN 2 bảng như DAO trả về', async () => {
			// Arrange
			process.env.DATABASE = 'datn'
			const joinedRoom = {
				ID: 1,
				ROOM_Name: 'A101',
				ROOM_Capacity: 40,
				ROOM_Description: 'Phòng học lớn',
				ROOM_Status: 'Có sẵn',
				LOCATION_Building: 'A',
				LOCATION_Floor: 1,
				ROOM_TYPE_Name: 'Classroom',
				ROOM_TYPE_Description: 'Phòng học tiêu chuẩn',
			}
			EquipmentDao.findAllRoom.mockResolvedValue([joinedRoom])

			// Act
			const result = await EquipmentService.findAllRoom(createMockReq(), createMockRes())

			// Assert
			expect(result).toEqual([joinedRoom])
		})

		// Test Case ID: TC_ROOM_FINDALL_06
		it('TC_ROOM_FINDALL_06 - mỗi phòng nên có thông tin vị trí (tòa nhà, tầng) nếu DAO trả về', async () => {
			// Arrange
			process.env.DATABASE = 'datn'
			const rooms = [
				{ ROOM_Name: 'A101', LOCATION_Building: 'A', LOCATION_Floor: 1 },
				{ ROOM_Name: 'B201', LOCATION_Building: 'B', LOCATION_Floor: 2 },
			]
			EquipmentDao.findAllRoom.mockResolvedValue(rooms)

			// Act
			const result = await EquipmentService.findAllRoom(createMockReq(), createMockRes())

			// Assert
			expect(result).toEqual(rooms)
			expect(result[0]).toHaveProperty('LOCATION_Building')
			expect(result[0]).toHaveProperty('LOCATION_Floor')
		})

		// Test Case ID: TC_ROOM_FINDALL_07
		it('TC_ROOM_FINDALL_07 - CheckDB: truyền đúng table name xuống DAO dựa trên process.env.DATABASE', async () => {
			// Arrange
			process.env.DATABASE = 'datn'
			EquipmentDao.findAllRoom.mockResolvedValue([])

			// Act
			await EquipmentService.findAllRoom(createMockReq(), createMockRes())

			// Assert
			expect(EquipmentDao.findAllRoom).toHaveBeenCalledTimes(1)
			expect(EquipmentDao.findAllRoom).toHaveBeenCalledWith({ table: 'datn.room' })
		})

		// Test Case ID: TC_ROOM_FINDALL_08
		it('TC_ROOM_FINDALL_08 - nên trả về error object khi DAO reject (mất kết nối)', async () => {
			// Arrange
			process.env.DATABASE = 'datn'
			const daoError = new Error('ECONNREFUSED')
			EquipmentDao.findAllRoom.mockRejectedValue(daoError)

			// Act
			const result = await EquipmentService.findAllRoom(createMockReq(), createMockRes())

			// Assert
			expect(result).toBe(daoError)
		})

		// Test Case ID: TC_ROOM_FINDALL_09
		it('TC_ROOM_FINDALL_09 - nên trả về error object khi DAO reject (timeout)', async () => {
			// Arrange
			process.env.DATABASE = 'datn'
			const daoError = new Error('Query timeout')
			EquipmentDao.findAllRoom.mockRejectedValue(daoError)

			// Act
			const result = await EquipmentService.findAllRoom(createMockReq(), createMockRes())

			// Assert
			expect(result).toBe(daoError)
		})
	})

	// =====================================================================
	// 4) createEquipment()
	// =====================================================================
	describe('createEquipment()', () => {
		// Test Case ID: TC_EQ_CREATE_01
		it('TC_EQ_CREATE_01 - nên trả về message thành công khi tạo thiết bị (DAO resolve)', async () => {
			// Arrange
			const reqBody = {
				EQUIPMENT_ITEM_Name: 'EPX200-004',
				EQUIPMENT_ITEM_PurchaseDate: '2024-06-01',
				EQUIPMENT_ITEM_Price: 12000000,
				EQUIPMENT_ITEM_Quantity: 1,
				EQUIPMENT_ITEM_Status: 'Có sẵn',
				EQUIPMENT_ITEM_Description: 'Máy chiếu mới',
				EQUIPMENT_MODEL_Name: 'Epson X200',
				EQUIPMENT_MODEL_Branch: 'Epson',
				EQUIPMENT_TYPE_Name: 'Projector',
				EQUIPMENT_TYPE_Description: 'Máy chiếu',
			}
			const req = createMockReq({ body: reqBody })
			EquipmentDao.createEquipment.mockResolvedValue({ message: 'Thêm thiết bị thành công' })

			// Act
			const result = await EquipmentService.createEquipment(req, createMockRes())

			// Assert
			expect(result).toEqual({ message: 'Thêm thiết bị thành công' })
			// CheckDB
			expect(EquipmentDao.createEquipment).toHaveBeenCalledTimes(1)
			expect(EquipmentDao.createEquipment).toHaveBeenCalledWith(reqBody)
		})

		// Test Case ID: TC_EQ_CREATE_02
		it('TC_EQ_CREATE_02 - nên trả về message thành công khi tạo Laptop (DAO resolve)', async () => {
			// Arrange
			const reqBody = { EQUIPMENT_ITEM_Name: 'DL15-003', EQUIPMENT_TYPE_Name: 'Laptop', EQUIPMENT_MODEL_Name: 'Dell Inspiron 15' }
			EquipmentDao.createEquipment.mockResolvedValue({ message: 'Thêm thiết bị thành công' })

			// Act
			const result = await EquipmentService.createEquipment(createMockReq({ body: reqBody }), createMockRes())

			// Assert
			expect(result).toEqual({ message: 'Thêm thiết bị thành công' })
			expect(EquipmentDao.createEquipment).toHaveBeenCalledWith(reqBody)
		})

		// Test Case ID: TC_EQ_CREATE_03
		it('TC_EQ_CREATE_03 - nên trả về message thành công khi tạo phòng (DAO resolve)', async () => {
			// Arrange
			const reqBody = {
				ROOM_Name: 'A102',
				ROOM_Capacity: 40,
				ROOM_Description: 'Phòng học mới',
				ROOM_Status: 'Có sẵn',
				LOCATION_Building: 'A',
				LOCATION_Floor: 1,
				ROOM_TYPE_Name: 'Classroom',
				ROOM_TYPE_Description: 'Phòng học tiêu chuẩn',
			}
			EquipmentDao.createEquipment.mockResolvedValue({ message: 'Thêm phòng thành công' })

			// Act
			const result = await EquipmentService.createEquipment(createMockReq({ body: reqBody }), createMockRes())

			// Assert
			expect(result).toEqual({ message: 'Thêm phòng thành công' })
			expect(EquipmentDao.createEquipment).toHaveBeenCalledWith(reqBody)
		})

		// Test Case ID: TC_EQ_CREATE_04
		it('TC_EQ_CREATE_04 - tạo phòng Lab mới thành công khi DAO resolve', async () => {
			// Arrange
			const reqBody = { ROOM_Name: 'B202', ROOM_TYPE_Name: 'Lab' }
			EquipmentDao.createEquipment.mockResolvedValue({ message: 'Thêm phòng thành công' })

			// Act
			const result = await EquipmentService.createEquipment(createMockReq({ body: reqBody }), createMockRes())

			// Assert
			expect(result).toEqual({ message: 'Thêm phòng thành công' })
		})

		// Test Case ID: TC_EQ_CREATE_05
		it('TC_EQ_CREATE_05 - tạo phòng họp mới thành công khi DAO resolve', async () => {
			// Arrange
			const reqBody = { ROOM_Name: 'C02', ROOM_TYPE_Name: 'Conference' }
			EquipmentDao.createEquipment.mockResolvedValue({ message: 'Thêm phòng thành công' })

			// Act
			const result = await EquipmentService.createEquipment(createMockReq({ body: reqBody }), createMockRes())

			// Assert
			expect(result).toEqual({ message: 'Thêm phòng thành công' })
		})

		// Test Case ID: TC_EQ_CREATE_06
		it('TC_EQ_CREATE_06 - CheckDB: truyền đúng req.body xuống Dao.createEquipment', async () => {
			// Arrange
			const reqBody = { EQUIPMENT_ITEM_Name: 'Test', EQUIPMENT_TYPE_Name: 'Projector' }
			EquipmentDao.createEquipment.mockResolvedValue({ message: 'Thêm thiết bị thành công' })

			// Act
			await EquipmentService.createEquipment(createMockReq({ body: reqBody }), createMockRes())

			// Assert
			expect(EquipmentDao.createEquipment).toHaveBeenCalledTimes(1)
			expect(EquipmentDao.createEquipment).toHaveBeenCalledWith(reqBody)
		})

		// Test Case ID: TC_EQ_CREATE_07
		it('TC_EQ_CREATE_07 - nên trả về error object khi DAO reject (transaction lỗi bước 1)', async () => {
			// Arrange
			const daoError = new Error('Duplicate entry for EQUIPMENT_TYPE')
			EquipmentDao.createEquipment.mockRejectedValue(daoError)

			// Act
			const result = await EquipmentService.createEquipment(createMockReq({ body: { EQUIPMENT_ITEM_Name: 'X' } }), createMockRes())

			// Assert
			expect(result).toBe(daoError)
		})

		// Test Case ID: TC_EQ_CREATE_08
		it('TC_EQ_CREATE_08 - nên trả về error object khi DAO reject (transaction lỗi bước 2)', async () => {
			// Arrange
			const daoError = new Error('FK constraint failed on EQUIPMENT_MODEL')
			EquipmentDao.createEquipment.mockRejectedValue(daoError)

			// Act
			const result = await EquipmentService.createEquipment(createMockReq({ body: { EQUIPMENT_ITEM_Name: 'X' } }), createMockRes())

			// Assert
			expect(result).toBe(daoError)
		})

		// Test Case ID: TC_EQ_CREATE_09
		it('TC_EQ_CREATE_09 - nên trả về error object khi DAO reject (transaction lỗi bước 3)', async () => {
			// Arrange
			const daoError = new Error('FK constraint failed on EQUIPMENT_ITEM')
			EquipmentDao.createEquipment.mockRejectedValue(daoError)

			// Act
			const result = await EquipmentService.createEquipment(createMockReq({ body: { EQUIPMENT_ITEM_Name: 'X' } }), createMockRes())

			// Assert
			expect(result).toBe(daoError)
		})

		// Test Case ID: TC_EQ_CREATE_10
		it('TC_EQ_CREATE_10 - nên trả về error object khi DAO reject (transaction tạo phòng lỗi)', async () => {
			// Arrange
			const daoError = new Error('DB error on ROOM_TYPE')
			EquipmentDao.createEquipment.mockRejectedValue(daoError)

			// Act
			const result = await EquipmentService.createEquipment(createMockReq({ body: { ROOM_Name: 'A102' } }), createMockRes())

			// Assert
			expect(result).toBe(daoError)
		})

		// Test Case ID: TC_EQ_CREATE_11
		it('TC_EQ_CREATE_11 - nên trả về error object khi DAO reject "Unknown data type"', async () => {
			// Arrange
			EquipmentDao.createEquipment.mockRejectedValue('Unknown data type')

			// Act
			const result = await EquipmentService.createEquipment(createMockReq({ body: { someOtherField: 'value' } }), createMockRes())

			// Assert
			expect(result).toBe('Unknown data type')
		})

		// Test Case ID: TC_EQ_CREATE_12
		it('TC_EQ_CREATE_12 - CheckDB: gọi Dao.createEquipment đúng 1 lần', async () => {
			// Arrange
			EquipmentDao.createEquipment.mockResolvedValue({ message: 'Thêm thiết bị thành công' })
			const reqBody = { EQUIPMENT_ITEM_Name: 'EPX', EQUIPMENT_TYPE_Name: 'Projector' }

			// Act
			await EquipmentService.createEquipment(createMockReq({ body: reqBody }), createMockRes())

			// Assert
			expect(EquipmentDao.createEquipment).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_EQ_CREATE_13
		it('TC_EQ_CREATE_13 - nên trả về error object khi DAO reject (DB mất kết nối)', async () => {
			// Arrange
			const daoError = new Error('ECONNREFUSED')
			EquipmentDao.createEquipment.mockRejectedValue(daoError)

			// Act
			const result = await EquipmentService.createEquipment(createMockReq({ body: { EQUIPMENT_ITEM_Name: 'X' } }), createMockRes())

			// Assert
			expect(result).toBe(daoError)
		})
	})

	// =====================================================================
	// 5) updateEquipment()
	// =====================================================================
	describe('updateEquipment()', () => {
		// Test Case ID: TC_EQ_UPDATE_01
		it('TC_EQ_UPDATE_01 - nên trả về message thành công khi update thiết bị (DAO resolve)', async () => {
			// Arrange
			const reqBody = { ID: 1, EQUIPMENT_ITEM_Name: 'EPX200-001 (Updated)', EQUIPMENT_ITEM_Status: 'Có sẵn' }
			EquipmentDao.updateEquipment.mockResolvedValue({ message: 'Update equipment thành công' })

			// Act
			const result = await EquipmentService.updateEquipment(createMockReq({ body: reqBody }), createMockRes())

			// Assert
			expect(result).toEqual({ message: 'Update equipment thành công' })
			// CheckDB
			expect(EquipmentDao.updateEquipment).toHaveBeenCalledWith(reqBody)
		})

		// Test Case ID: TC_EQ_UPDATE_02
		it('TC_EQ_UPDATE_02 - nên trả về message thành công khi update phòng (DAO resolve)', async () => {
			// Arrange
			const reqBody = { ID: 1, ROOM_Name: 'A101 (Updated)', ROOM_Status: 'Có sẵn' }
			EquipmentDao.updateEquipment.mockResolvedValue({ message: 'Update room thành công' })

			// Act
			const result = await EquipmentService.updateEquipment(createMockReq({ body: reqBody }), createMockRes())

			// Assert
			expect(result).toEqual({ message: 'Update room thành công' })
		})

		// Test Case ID: TC_EQ_UPDATE_03
		it("TC_EQ_UPDATE_03 - cập nhật status thiết bị sang 'Đang sử dụng' trả về success", async () => {
			// Arrange
			const reqBody = { ID: 1, EQUIPMENT_ITEM_Name: 'EPX200-001', EQUIPMENT_ITEM_Status: 'Đang sử dụng' }
			EquipmentDao.updateEquipment.mockResolvedValue({ message: 'Update equipment thành công' })

			// Act
			const result = await EquipmentService.updateEquipment(createMockReq({ body: reqBody }), createMockRes())

			// Assert
			expect(result).toEqual({ message: 'Update equipment thành công' })
		})

		// Test Case ID: TC_EQ_UPDATE_04
		it("TC_EQ_UPDATE_04 - cập nhật status thiết bị về 'Có sẵn' trả về success", async () => {
			// Arrange
			const reqBody = { ID: 1, EQUIPMENT_ITEM_Name: 'EPX200-001', EQUIPMENT_ITEM_Status: 'Có sẵn' }
			EquipmentDao.updateEquipment.mockResolvedValue({ message: 'Update equipment thành công' })

			// Act
			const result = await EquipmentService.updateEquipment(createMockReq({ body: reqBody }), createMockRes())

			// Assert
			expect(result).toEqual({ message: 'Update equipment thành công' })
		})

		// Test Case ID: TC_EQ_UPDATE_05
		it("TC_EQ_UPDATE_05 - cập nhật status thiết bị sang 'Hỏng' trả về success", async () => {
			// Arrange
			const reqBody = { ID: 2, EQUIPMENT_ITEM_Name: 'DL15-001', EQUIPMENT_ITEM_Status: 'Hỏng' }
			EquipmentDao.updateEquipment.mockResolvedValue({ message: 'Update equipment thành công' })

			// Act
			const result = await EquipmentService.updateEquipment(createMockReq({ body: reqBody }), createMockRes())

			// Assert
			expect(result).toEqual({ message: 'Update equipment thành công' })
		})

		// Test Case ID: TC_EQ_UPDATE_06
		it('TC_EQ_UPDATE_06 - cập nhật giá thiết bị trả về success', async () => {
			// Arrange
			const reqBody = { ID: 1, EQUIPMENT_ITEM_Name: 'EPX200-001', EQUIPMENT_ITEM_Price: 15000000 }
			EquipmentDao.updateEquipment.mockResolvedValue({ message: 'Update equipment thành công' })

			// Act
			const result = await EquipmentService.updateEquipment(createMockReq({ body: reqBody }), createMockRes())

			// Assert
			expect(result).toEqual({ message: 'Update equipment thành công' })
		})

		// Test Case ID: TC_EQ_UPDATE_07
		it('TC_EQ_UPDATE_07 - cập nhật sức chứa phòng trả về success', async () => {
			// Arrange
			const reqBody = { ID: 1, ROOM_Name: 'A101', ROOM_Capacity: 50 }
			EquipmentDao.updateEquipment.mockResolvedValue({ message: 'Update room thành công' })

			// Act
			const result = await EquipmentService.updateEquipment(createMockReq({ body: reqBody }), createMockRes())

			// Assert
			expect(result).toEqual({ message: 'Update room thành công' })
		})

		// Test Case ID: TC_EQ_UPDATE_08
		it("TC_EQ_UPDATE_08 - cập nhật status phòng sang 'Đang sửa chữa' trả về success", async () => {
			// Arrange
			const reqBody = { ID: 2, ROOM_Name: 'B201', ROOM_Status: 'Đang sửa chữa' }
			EquipmentDao.updateEquipment.mockResolvedValue({ message: 'Update room thành công' })

			// Act
			const result = await EquipmentService.updateEquipment(createMockReq({ body: reqBody }), createMockRes())

			// Assert
			expect(result).toEqual({ message: 'Update room thành công' })
		})

		// Test Case ID: TC_EQ_UPDATE_09
		it('TC_EQ_UPDATE_09 - nên trả về error object khi DAO reject (transaction update thiết bị lỗi bước 1)', async () => {
			// Arrange
			const daoError = new Error('DB error on EQUIPMENT_ITEM update')
			EquipmentDao.updateEquipment.mockRejectedValue(daoError)

			// Act
			const result = await EquipmentService.updateEquipment(createMockReq({ body: { EQUIPMENT_ITEM_Name: 'X' } }), createMockRes())

			// Assert
			expect(result).toBe(daoError)
		})

		// Test Case ID: TC_EQ_UPDATE_10
		it('TC_EQ_UPDATE_10 - nên trả về error object khi DAO reject (transaction update thiết bị lỗi bước 2)', async () => {
			// Arrange
			const daoError = new Error('DB error on EQUIPMENT_MODEL update')
			EquipmentDao.updateEquipment.mockRejectedValue(daoError)

			// Act
			const result = await EquipmentService.updateEquipment(createMockReq({ body: { EQUIPMENT_ITEM_Name: 'X' } }), createMockRes())

			// Assert
			expect(result).toBe(daoError)
		})

		// Test Case ID: TC_EQ_UPDATE_11
		it('TC_EQ_UPDATE_11 - nên trả về error object khi DAO reject (transaction update thiết bị lỗi bước 3)', async () => {
			// Arrange
			const daoError = new Error('DB error on EQUIPMENT_TYPE update')
			EquipmentDao.updateEquipment.mockRejectedValue(daoError)

			// Act
			const result = await EquipmentService.updateEquipment(createMockReq({ body: { EQUIPMENT_ITEM_Name: 'X' } }), createMockRes())

			// Assert
			expect(result).toBe(daoError)
		})

		// Test Case ID: TC_EQ_UPDATE_12
		it('TC_EQ_UPDATE_12 - nên trả về error object khi DAO reject "Unknown data type"', async () => {
			// Arrange
			EquipmentDao.updateEquipment.mockRejectedValue('Unknown data type')

			// Act
			const result = await EquipmentService.updateEquipment(createMockReq({ body: { ID: 1, someField: 'value' } }), createMockRes())

			// Assert
			expect(result).toBe('Unknown data type')
		})

		// Test Case ID: TC_EQ_UPDATE_13
		it('TC_EQ_UPDATE_13 - CheckDB: truyền đúng req.body xuống Dao.updateEquipment', async () => {
			// Arrange
			const reqBody = { ID: 1, EQUIPMENT_ITEM_Name: 'Test' }
			EquipmentDao.updateEquipment.mockResolvedValue({ message: 'Update equipment thành công' })

			// Act
			await EquipmentService.updateEquipment(createMockReq({ body: reqBody }), createMockRes())

			// Assert
			expect(EquipmentDao.updateEquipment).toHaveBeenCalledTimes(1)
			expect(EquipmentDao.updateEquipment).toHaveBeenCalledWith(reqBody)
		})

		// Test Case ID: TC_EQ_UPDATE_14
		it('TC_EQ_UPDATE_14 - CheckDB: gọi Dao.updateEquipment đúng 1 lần', async () => {
			// Arrange
			EquipmentDao.updateEquipment.mockResolvedValue({ message: 'Update equipment thành công' })

			// Act
			await EquipmentService.updateEquipment(createMockReq({ body: { ID: 1, EQUIPMENT_ITEM_Name: 'X' } }), createMockRes())

			// Assert
			expect(EquipmentDao.updateEquipment).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_EQ_UPDATE_15
		it('TC_EQ_UPDATE_15 - nên trả về error object khi DAO reject (DB mất kết nối)', async () => {
			// Arrange
			const daoError = new Error('ECONNREFUSED')
			EquipmentDao.updateEquipment.mockRejectedValue(daoError)

			// Act
			const result = await EquipmentService.updateEquipment(createMockReq({ body: { ID: 1, EQUIPMENT_ITEM_Name: 'X' } }), createMockRes())

			// Assert
			expect(result).toBe(daoError)
		})
	})

	// =====================================================================
	// 6) deleteEquipment()
	// =====================================================================
	describe('deleteEquipment()', () => {
		// Test Case ID: TC_EQ_DELETE_01
		it('TC_EQ_DELETE_01 - soft delete thiết bị thành công khi DAO resolve', async () => {
			// Arrange
			const reqBody = { id: 1, type: 'equipment' }
			EquipmentDao.deleteEquipment.mockResolvedValue({ affectedRows: 1 })

			// Act
			const result = await EquipmentService.deleteEquipment(createMockReq({ body: reqBody }), createMockRes())

			// Assert
			expect(result).toEqual({ affectedRows: 1 })
			// CheckDB
			expect(EquipmentDao.deleteEquipment).toHaveBeenCalledWith(reqBody)
		})

		// Test Case ID: TC_EQ_DELETE_02
		it('TC_EQ_DELETE_02 - soft delete phòng thành công khi DAO resolve', async () => {
			// Arrange
			const reqBody = { id: 1, type: 'room' }
			EquipmentDao.deleteEquipment.mockResolvedValue({ affectedRows: 1 })

			// Act
			const result = await EquipmentService.deleteEquipment(createMockReq({ body: reqBody }), createMockRes())

			// Assert
			expect(result).toEqual({ affectedRows: 1 })
		})

		// Test Case ID: TC_EQ_DELETE_03
		it('TC_EQ_DELETE_03 - sau khi soft delete thiết bị, service vẫn trả kết quả DAO (không tự query lại)', async () => {
			// Arrange
			const reqBody = { id: 1, type: 'equipment' }
			EquipmentDao.deleteEquipment.mockResolvedValue({ affectedRows: 1 })

			// Act
			const result = await EquipmentService.deleteEquipment(createMockReq({ body: reqBody }), createMockRes())

			// Assert
			expect(result).toEqual({ affectedRows: 1 })
			expect(EquipmentDao.deleteEquipment).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_EQ_DELETE_04
		it('TC_EQ_DELETE_04 - sau khi soft delete phòng, service vẫn trả kết quả DAO (không tự query lại)', async () => {
			// Arrange
			const reqBody = { id: 1, type: 'room' }
			EquipmentDao.deleteEquipment.mockResolvedValue({ affectedRows: 1 })

			// Act
			const result = await EquipmentService.deleteEquipment(createMockReq({ body: reqBody }), createMockRes())

			// Assert
			expect(result).toEqual({ affectedRows: 1 })
		})

		// Test Case ID: TC_EQ_DELETE_05
		it('TC_EQ_DELETE_05 - trả về affectedRows=0 khi ID thiết bị không tồn tại (DAO resolve)', async () => {
			// Arrange
			const reqBody = { id: 9999, type: 'equipment' }
			EquipmentDao.deleteEquipment.mockResolvedValue({ affectedRows: 0 })

			// Act
			const result = await EquipmentService.deleteEquipment(createMockReq({ body: reqBody }), createMockRes())

			// Assert
			expect(result).toEqual({ affectedRows: 0 })
		})

		// Test Case ID: TC_EQ_DELETE_06
		it('TC_EQ_DELETE_06 - trả về affectedRows=0 khi ID phòng không tồn tại (DAO resolve)', async () => {
			// Arrange
			const reqBody = { id: 9999, type: 'room' }
			EquipmentDao.deleteEquipment.mockResolvedValue({ affectedRows: 0 })

			// Act
			const result = await EquipmentService.deleteEquipment(createMockReq({ body: reqBody }), createMockRes())

			// Assert
			expect(result).toEqual({ affectedRows: 0 })
		})

		// Test Case ID: TC_EQ_DELETE_07
		it('TC_EQ_DELETE_07 - nên trả về error object khi type không hợp lệ (DAO reject)', async () => {
			// Arrange
			const reqBody = { id: 1, type: 'invalid' }
			const daoError = new Error('Type không hợp lệ')
			EquipmentDao.deleteEquipment.mockRejectedValue(daoError)

			// Act
			const result = await EquipmentService.deleteEquipment(createMockReq({ body: reqBody }), createMockRes())

			// Assert
			expect(result).toBe(daoError)
		})

		// Test Case ID: TC_EQ_DELETE_08
		it('TC_EQ_DELETE_08 - CheckDB: truyền đúng req.body xuống Dao.deleteEquipment', async () => {
			// Arrange
			const reqBody = { id: 2, type: 'equipment' }
			EquipmentDao.deleteEquipment.mockResolvedValue({ affectedRows: 1 })

			// Act
			await EquipmentService.deleteEquipment(createMockReq({ body: reqBody }), createMockRes())

			// Assert
			expect(EquipmentDao.deleteEquipment).toHaveBeenCalledTimes(1)
			expect(EquipmentDao.deleteEquipment).toHaveBeenCalledWith(reqBody)
		})

		// Test Case ID: TC_EQ_DELETE_09
		it('TC_EQ_DELETE_09 - CheckDB: gọi Dao.deleteEquipment đúng 1 lần', async () => {
			// Arrange
			EquipmentDao.deleteEquipment.mockResolvedValue({ affectedRows: 1 })

			// Act
			await EquipmentService.deleteEquipment(createMockReq({ body: { id: 2, type: 'equipment' } }), createMockRes())

			// Assert
			expect(EquipmentDao.deleteEquipment).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_EQ_DELETE_10
		it('TC_EQ_DELETE_10 - nên trả về error object khi DAO reject (DB lỗi)', async () => {
			// Arrange
			const daoError = new Error('DB connection failed')
			EquipmentDao.deleteEquipment.mockRejectedValue(daoError)

			// Act
			const result = await EquipmentService.deleteEquipment(createMockReq({ body: { id: 1, type: 'equipment' } }), createMockRes())

			// Assert
			expect(result).toBe(daoError)
		})

		// Test Case ID: TC_EQ_DELETE_11
		it('TC_EQ_DELETE_11 - soft delete thiết bị đang có phiếu mượn chưa trả: service vẫn trả kết quả DAO', async () => {
			// Arrange
			const reqBody = { id: 1, type: 'equipment' }
			EquipmentDao.deleteEquipment.mockResolvedValue({ affectedRows: 1 })

			// Act
			const result = await EquipmentService.deleteEquipment(createMockReq({ body: reqBody }), createMockRes())

			// Assert
			expect(result).toEqual({ affectedRows: 1 })
		})
	})
})
