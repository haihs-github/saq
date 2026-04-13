/**
 * Unit Test Script: equipment.service.js
 * File được test: backend/src/module/equipment/equipment.service.js
 *
 * Chiến lược:
 *  - Mock configDB để chặn mysql2 kết nối DB thật
 *  - Mock toàn bộ Dao layer (equipment.dao.js) để test service độc lập
 *  - Không có thay đổi DB thực tế → không cần rollback DB thật
 *  - CheckDB: xác minh Dao được gọi đúng tham số, đúng số lần
 *  - Rollback: jest.clearAllMocks() trong beforeEach đảm bảo trạng thái sạch
 *
 * Nghiệp vụ hệ thống:
 *  - 2 loại đối tượng: Thiết bị (EQUIPMENT_ITEM) và Phòng (ROOM)
 *  - Xóa là soft delete: đặt status = 'inactive', không xóa vật lý
 *  - Tạo/cập nhật thiết bị: transaction 3 bảng (TYPE → MODEL → ITEM)
 *  - Tạo/cập nhật phòng: transaction 2 bảng (ROOM_TYPE → ROOM)
 *  - findOne dùng format ID đặc biệt: "{id}|{type}" (vd: "1|equipment", "2|room")
 */

// ─── Mock configDB TRƯỚC TIÊN ─────────────────────────────────────────────────
// Chặn mysql2 kết nối DB thật → tránh lỗi "Encoding not recognized: cesu8"
jest.mock('../../config/configDB', () => ({
	query: jest.fn(),
	execute: jest.fn(),
	getConnection: jest.fn(),
	beginTransaction: jest.fn(),
	commit: jest.fn(),
	rollback: jest.fn(),
	end: jest.fn(),
}))

// ─── Mock toàn bộ DAO layer ───────────────────────────────────────────────────
jest.mock('../../module/equipment/equipment.dao')
const Dao = require('../../module/equipment/equipment.dao')

// ─── Mock dotenv ──────────────────────────────────────────────────────────────
jest.mock('dotenv', () => ({ config: jest.fn() }))

// ─── Import module cần test ───────────────────────────────────────────────────
const EquipmentService = require('../../module/equipment/equipment.service')

// ─── Setup chung ─────────────────────────────────────────────────────────────
beforeEach(() => {
	process.env.DATABASE = 'datn'
	// Rollback: xóa toàn bộ mock state sau mỗi test → trạng thái sạch
	jest.clearAllMocks()
})

// =============================================================================
// 1. findAllEquipment()
// Nghiệp vụ: Lấy danh sách thiết bị đang hoạt động (status != 'inactive')
// để hiển thị cho người dùng mượn. JOIN 3 bảng: ITEM + MODEL + TYPE
// CheckDB: xác minh Dao.findAll được gọi đúng 1 lần, không tham số
// Rollback: mock → không có DB thật bị tác động
// =============================================================================
describe('findAllEquipment()', () => {

	// TC_EQ_FINDALL_01: Có nhiều thiết bị đang hoạt động với nhiều loại khác nhau
	it('[TC_EQ_FINDALL_01] nên trả về danh sách thiết bị đang hoạt động', async () => {
		// Arrange: mock dữ liệu thiết bị thực tế trong hệ thống
		const mockEquipments = [
			{
				ID: 1, EQUIPMENT_ITEM_Name: 'EPX200-001',
				EQUIPMENT_ITEM_Status: 'Có sẵn', EQUIPMENT_ITEM_Price: 12000000,
				EQUIPMENT_MODEL_Name: 'Epson X200', EQUIPMENT_MODEL_Branch: 'Epson',
				EQUIPMENT_TYPE_Name: 'Projector',
			},
			{
				ID: 4, EQUIPMENT_ITEM_Name: 'DL15-001',
				EQUIPMENT_ITEM_Status: 'Có sẵn', EQUIPMENT_ITEM_Price: 15000000,
				EQUIPMENT_MODEL_NAME: 'Dell Inspiron 15', EQUIPMENT_MODEL_Branch: 'Dell',
				EQUIPMENT_TYPE_Name: 'Laptop',
			},
		]
		Dao.findAll.mockResolvedValue(mockEquipments)

		// Act
		const result = await EquipmentService.findAllEquipment()

		// Assert
		expect(result).toEqual(mockEquipments)
		expect(result).toHaveLength(2)
	})

	// TC_EQ_FINDALL_02: Thiết bị inactive không xuất hiện (DAO đã lọc)
	it('[TC_EQ_FINDALL_02] nên không chứa thiết bị inactive (DAO lọc WHERE status != inactive)', async () => {
		// Arrange: DAO đã lọc sẵn, chỉ trả về thiết bị active
		const mockActiveOnly = [
			{ ID: 1, EQUIPMENT_ITEM_Name: 'EPX200-001', EQUIPMENT_ITEM_Status: 'Có sẵn' },
		]
		Dao.findAll.mockResolvedValue(mockActiveOnly)

		// Act
		const result = await EquipmentService.findAllEquipment()

		// Assert: không có thiết bị nào có status 'inactive'
		expect(result.every(e => e.EQUIPMENT_ITEM_Status !== 'inactive')).toBe(true)
	})

	// TC_EQ_FINDALL_03: Tất cả thiết bị đều inactive → trả về mảng rỗng
	it('[TC_EQ_FINDALL_03] nên trả về mảng rỗng khi tất cả thiết bị đều inactive', async () => {
		// Arrange
		Dao.findAll.mockResolvedValue([])

		// Act
		const result = await EquipmentService.findAllEquipment()

		// Assert
		expect(result).toEqual([])
		expect(result).toHaveLength(0)
	})

	// TC_EQ_FINDALL_04: Hệ thống chưa có thiết bị nào
	it('[TC_EQ_FINDALL_04] nên trả về mảng rỗng khi chưa có thiết bị nào trong hệ thống', async () => {
		// Arrange
		Dao.findAll.mockResolvedValue([])

		// Act
		const result = await EquipmentService.findAllEquipment()

		// Assert
		expect(result).toEqual([])
	})

	// TC_EQ_FINDALL_05: Kiểm tra cấu trúc dữ liệu JOIN 3 bảng đầy đủ
	it('[TC_EQ_FINDALL_05] nên trả về đúng cấu trúc dữ liệu JOIN 3 bảng (ITEM + MODEL + TYPE)', async () => {
		// Arrange
		const mockFullStructure = [{
			ID: 1,
			EQUIPMENT_ITEM_Name: 'EPX200-001',
			EQUIPMENT_ITEM_PurchaseDate: '2024-01-10',
			EQUIPMENT_ITEM_Price: 12000000,
			EQUIPMENT_ITEM_Quantity: 1,
			EQUIPMENT_ITEM_Status: 'Có sẵn',
			EQUIPMENT_ITEM_Description: 'Máy chiếu phòng học 1',
			EQUIPMENT_MODEL_ID: 1,
			EQUIPMENT_MODEL_Name: 'Epson X200',
			EQUIPMENT_MODEL_Branch: 'Epson',
			EQUIPMENT_TYPE_ID: 1,
			EQUIPMENT_TYPE_Name: 'Projector',
			EQUIPMENT_TYPE_Description: 'Máy chiếu phục vụ giảng dạy',
		}]
		Dao.findAll.mockResolvedValue(mockFullStructure)

		// Act
		const result = await EquipmentService.findAllEquipment()

		// Assert: kiểm tra đủ field từ 3 bảng
		const item = result[0]
		expect(item).toHaveProperty('ID')
		expect(item).toHaveProperty('EQUIPMENT_ITEM_Name')
		expect(item).toHaveProperty('EQUIPMENT_MODEL_Name')
		expect(item).toHaveProperty('EQUIPMENT_TYPE_Name')
	})

	// TC_EQ_FINDALL_06: Trả về thiết bị với nhiều loại khác nhau (Projector, Laptop, Speaker)
	it('[TC_EQ_FINDALL_06] nên trả về thiết bị với nhiều loại khác nhau', async () => {
		// Arrange
		const mockMultipleTypes = [
			{ ID: 1, EQUIPMENT_TYPE_Name: 'Projector' },
			{ ID: 4, EQUIPMENT_TYPE_Name: 'Laptop' },
			{ ID: 6, EQUIPMENT_TYPE_Name: 'Speaker' },
		]
		Dao.findAll.mockResolvedValue(mockMultipleTypes)

		// Act
		const result = await EquipmentService.findAllEquipment()

		// Assert: có đủ 3 loại thiết bị
		const types = result.map(e => e.EQUIPMENT_TYPE_Name)
		expect(types).toContain('Projector')
		expect(types).toContain('Laptop')
		expect(types).toContain('Speaker')
	})

	// TC_EQ_FINDALL_07: CheckDB — Dao.findAll được gọi đúng 1 lần, không tham số
	it('[TC_EQ_FINDALL_07] CheckDB: nên gọi Dao.findAll đúng 1 lần và không truyền tham số', async () => {
		// Arrange
		Dao.findAll.mockResolvedValue([])

		// Act
		await EquipmentService.findAllEquipment()

		// CheckDB: xác minh DAO được gọi đúng cách
		expect(Dao.findAll).toHaveBeenCalledTimes(1)
		expect(Dao.findAll).toHaveBeenCalledWith()
	})

	// TC_EQ_FINDALL_08: Trả về error object khi DB mất kết nối (không throw)
	it('[TC_EQ_FINDALL_08] nên trả về error object khi DB mất kết nối (không throw)', async () => {
		// Arrange
		const dbError = new Error('ECONNREFUSED: DB connection refused')
		Dao.findAll.mockRejectedValue(dbError)

		// Act
		const result = await EquipmentService.findAllEquipment()

		// Assert: service bắt lỗi bằng try/catch và return error
		expect(result).toBeInstanceOf(Error)
		expect(result.message).toContain('ECONNREFUSED')
	})

	// TC_EQ_FINDALL_09: Trả về error object khi DB timeout
	it('[TC_EQ_FINDALL_09] nên trả về error object khi DB timeout (không throw)', async () => {
		// Arrange
		const timeoutError = new Error('Query timeout')
		Dao.findAll.mockRejectedValue(timeoutError)

		// Act
		const result = await EquipmentService.findAllEquipment()

		// Assert
		expect(result).toBeInstanceOf(Error)
		expect(result.message).toBe('Query timeout')
	})
})

// =============================================================================
// 2. findOneEquipment()
// Nghiệp vụ: Xem chi tiết 1 thiết bị hoặc phòng để hiển thị form chỉnh sửa
// ID format đặc biệt: "{id}|{type}" — vd: "1|equipment", "2|room"
// Thiết bị/phòng inactive không được trả về (DAO lọc)
// CheckDB: xác minh Dao.findOne được gọi với đúng {id}
// Rollback: mock → không có DB thật bị tác động
// =============================================================================
describe('findOneEquipment()', () => {

	// TC_EQ_FINDONE_01: Tìm thấy thiết bị theo ID hợp lệ (type=equipment)
	it('[TC_EQ_FINDONE_01] nên trả về thiết bị khi tìm theo ID hợp lệ (type=equipment)', async () => {
		// Arrange
		const mockEquipment = {
			ID: 1, EQUIPMENT_ITEM_Name: 'EPX200-001',
			EQUIPMENT_ITEM_Status: 'Có sẵn', EQUIPMENT_TYPE_Name: 'Projector',
		}
		Dao.findOne.mockResolvedValue(mockEquipment)
		const req = { params: { id: '1|equipment' } }

		// Act
		const result = await EquipmentService.findOneEquipment(req)

		// Assert
		expect(result).toEqual(mockEquipment)
		expect(result.EQUIPMENT_ITEM_Status).toBe('Có sẵn')
	})

	// TC_EQ_FINDONE_02: Tìm thấy phòng theo ID hợp lệ (type=room)
	it('[TC_EQ_FINDONE_02] nên trả về phòng khi tìm theo ID hợp lệ (type=room)', async () => {
		// Arrange
		const mockRoom = {
			ID: 1, ROOM_Name: 'A101',
			ROOM_Status: 'Có sẵn', ROOM_TYPE_Name: 'Classroom',
		}
		Dao.findOne.mockResolvedValue(mockRoom)
		const req = { params: { id: '1|room' } }

		// Act
		const result = await EquipmentService.findOneEquipment(req)

		// Assert
		expect(result).toEqual(mockRoom)
		expect(result.ROOM_Status).toBe('Có sẵn')
	})

	// TC_EQ_FINDONE_03: Thiết bị đã soft delete (inactive) → DAO trả về undefined
	it('[TC_EQ_FINDONE_03] nên trả về undefined khi thiết bị đã bị soft delete (inactive)', async () => {
		// Arrange: DAO lọc status != 'inactive' → trả về undefined
		Dao.findOne.mockResolvedValue(undefined)
		const req = { params: { id: '5|equipment' } }

		// Act
		const result = await EquipmentService.findOneEquipment(req)

		// Assert
		expect(result).toBeUndefined()
	})

	// TC_EQ_FINDONE_04: Phòng đã soft delete (inactive) → DAO trả về undefined
	it('[TC_EQ_FINDONE_04] nên trả về undefined khi phòng đã bị soft delete (inactive)', async () => {
		// Arrange
		Dao.findOne.mockResolvedValue(undefined)
		const req = { params: { id: '2|room' } }

		// Act
		const result = await EquipmentService.findOneEquipment(req)

		// Assert
		expect(result).toBeUndefined()
	})

	// TC_EQ_FINDONE_05: ID thiết bị không tồn tại trong DB
	it('[TC_EQ_FINDONE_05] nên trả về undefined khi ID thiết bị không tồn tại trong DB', async () => {
		// Arrange
		Dao.findOne.mockResolvedValue(undefined)
		const req = { params: { id: '9999|equipment' } }

		// Act
		const result = await EquipmentService.findOneEquipment(req)

		// Assert
		expect(result).toBeUndefined()
	})

	// TC_EQ_FINDONE_06: ID phòng không tồn tại trong DB
	it('[TC_EQ_FINDONE_06] nên trả về undefined khi ID phòng không tồn tại trong DB', async () => {
		// Arrange
		Dao.findOne.mockResolvedValue(undefined)
		const req = { params: { id: '9999|room' } }

		// Act
		const result = await EquipmentService.findOneEquipment(req)

		// Assert
		expect(result).toBeUndefined()
	})

	// TC_EQ_FINDONE_07: CheckDB — Dao.findOne được gọi với đúng object {id}
	it('[TC_EQ_FINDONE_07] CheckDB: nên truyền đúng {id} xuống Dao.findOne', async () => {
		// Arrange
		Dao.findOne.mockResolvedValue({ ID: 3 })
		const req = { params: { id: '3|equipment' } }

		// Act
		await EquipmentService.findOneEquipment(req)

		// CheckDB: xác minh DAO nhận đúng argument
		expect(Dao.findOne).toHaveBeenCalledWith({ id: '3|equipment' })
		expect(Dao.findOne).toHaveBeenCalledTimes(1)
	})

	// TC_EQ_FINDONE_08: Kiểm tra cấu trúc JOIN 3 bảng cho thiết bị
	it('[TC_EQ_FINDONE_08] nên trả về đúng cấu trúc JOIN 3 bảng cho thiết bị', async () => {
		// Arrange
		const mockFullEquipment = {
			ID: 1,
			EQUIPMENT_ITEM_Name: 'EPX200-001',
			EQUIPMENT_MODEL_ID: 1,
			EQUIPMENT_MODEL_Name: 'Epson X200',
			EQUIPMENT_MODEL_Branch: 'Epson',
			EQUIPMENT_TYPE_ID: 1,
			EQUIPMENT_TYPE_Name: 'Projector',
			EQUIPMENT_TYPE_Description: 'Máy chiếu phục vụ giảng dạy',
		}
		Dao.findOne.mockResolvedValue(mockFullEquipment)
		const req = { params: { id: '1|equipment' } }

		// Act
		const result = await EquipmentService.findOneEquipment(req)

		// Assert: đủ field từ 3 bảng
		expect(result).toHaveProperty('EQUIPMENT_ITEM_Name')
		expect(result).toHaveProperty('EQUIPMENT_MODEL_Name')
		expect(result).toHaveProperty('EQUIPMENT_TYPE_Name')
	})

	// TC_EQ_FINDONE_09: Kiểm tra cấu trúc JOIN 2 bảng cho phòng
	it('[TC_EQ_FINDONE_09] nên trả về đúng cấu trúc JOIN 2 bảng cho phòng', async () => {
		// Arrange
		const mockFullRoom = {
			ID: 1, ROOM_Name: 'A101', ROOM_Capacity: 40,
			ROOM_Status: 'Có sẵn', LOCATION_Building: 'A', LOCATION_Floor: 1,
			ROOM_TYPE_ID: 1, ROOM_TYPE_Name: 'Classroom',
		}
		Dao.findOne.mockResolvedValue(mockFullRoom)
		const req = { params: { id: '1|room' } }

		// Act
		const result = await EquipmentService.findOneEquipment(req)

		// Assert: đủ field từ 2 bảng
		expect(result).toHaveProperty('ROOM_Name')
		expect(result).toHaveProperty('ROOM_TYPE_Name')
		expect(result).toHaveProperty('LOCATION_Building')
	})

	// TC_EQ_FINDONE_10: Trả về error object khi DB lỗi (không throw)
	it('[TC_EQ_FINDONE_10] nên trả về error object khi DB lỗi (không throw)', async () => {
		// Arrange
		const dbError = new Error('DB error')
		Dao.findOne.mockRejectedValue(dbError)
		const req = { params: { id: '1|equipment' } }

		// Act
		const result = await EquipmentService.findOneEquipment(req)

		// Assert
		expect(result).toBeInstanceOf(Error)
	})

	// TC_EQ_FINDONE_11: Trả về error khi type không hợp lệ
	it('[TC_EQ_FINDONE_11] nên trả về error khi type không hợp lệ', async () => {
		// Arrange: DAO reject vì type không phải 'equipment' hay 'room'
		const typeError = new Error('Type không hợp lệ')
		Dao.findOne.mockRejectedValue(typeError)
		const req = { params: { id: '1|invalid' } }

		// Act
		const result = await EquipmentService.findOneEquipment(req)

		// Assert
		expect(result).toBeInstanceOf(Error)
		expect(result.message).toBe('Type không hợp lệ')
	})
})

// =============================================================================
// 3. findAllRoom()
// Nghiệp vụ: Lấy danh sách phòng đang hoạt động (status != 'inactive')
// để hiển thị khi tạo phiếu mượn thiết bị. JOIN 2 bảng: ROOM + ROOM_TYPE
// Hệ thống có 3 loại phòng: Classroom, Lab, Conference
// CheckDB: xác minh Dao.findAllRoom được gọi đúng 1 lần
// Rollback: mock → không có DB thật bị tác động
// =============================================================================
describe('findAllRoom()', () => {

	// TC_ROOM_FINDALL_01: Có nhiều phòng đang hoạt động với 3 loại
	it('[TC_ROOM_FINDALL_01] nên trả về danh sách phòng đang hoạt động (3 loại)', async () => {
		// Arrange: mock 3 loại phòng thực tế trong hệ thống
		const mockRooms = [
			{ ID: 1, ROOM_Name: 'A101', ROOM_Status: 'Có sẵn', ROOM_TYPE_Name: 'Classroom' },
			{ ID: 2, ROOM_Name: 'B201', ROOM_Status: 'Có sẵn', ROOM_TYPE_Name: 'Lab' },
			{ ID: 3, ROOM_Name: 'C01', ROOM_Status: 'Có sẵn', ROOM_TYPE_Name: 'Conference' },
		]
		Dao.findAllRoom.mockResolvedValue(mockRooms)

		// Act
		const result = await EquipmentService.findAllRoom()

		// Assert
		expect(result).toHaveLength(3)
		expect(result).toEqual(mockRooms)
	})

	// TC_ROOM_FINDALL_02: Phòng inactive không xuất hiện (DAO đã lọc)
	it('[TC_ROOM_FINDALL_02] nên không chứa phòng inactive (DAO lọc WHERE status != inactive)', async () => {
		// Arrange: DAO đã lọc sẵn
		const mockActiveRooms = [
			{ ID: 1, ROOM_Name: 'A101', ROOM_Status: 'Có sẵn' },
		]
		Dao.findAllRoom.mockResolvedValue(mockActiveRooms)

		// Act
		const result = await EquipmentService.findAllRoom()

		// Assert: không có phòng nào có status 'inactive'
		expect(result.every(r => r.ROOM_Status !== 'inactive')).toBe(true)
	})

	// TC_ROOM_FINDALL_03: Tất cả phòng đều inactive → trả về mảng rỗng
	it('[TC_ROOM_FINDALL_03] nên trả về mảng rỗng khi tất cả phòng đều inactive', async () => {
		// Arrange
		Dao.findAllRoom.mockResolvedValue([])

		// Act
		const result = await EquipmentService.findAllRoom()

		// Assert
		expect(result).toEqual([])
	})

	// TC_ROOM_FINDALL_04: Hệ thống chưa có phòng nào
	it('[TC_ROOM_FINDALL_04] nên trả về mảng rỗng khi chưa có phòng nào trong hệ thống', async () => {
		// Arrange
		Dao.findAllRoom.mockResolvedValue([])

		// Act
		const result = await EquipmentService.findAllRoom()

		// Assert
		expect(result).toEqual([])
	})

	// TC_ROOM_FINDALL_05: Kiểm tra cấu trúc dữ liệu JOIN 2 bảng đầy đủ
	it('[TC_ROOM_FINDALL_05] nên trả về đúng cấu trúc dữ liệu JOIN 2 bảng (ROOM + ROOM_TYPE)', async () => {
		// Arrange
		const mockFullRoom = [{
			ID: 1, ROOM_Name: 'A101', ROOM_Capacity: 40,
			ROOM_Description: 'Phòng học lớn', ROOM_Status: 'Có sẵn',
			LOCATION_Building: 'A', LOCATION_Floor: 1,
			ROOM_TYPE_Name: 'Classroom', ROOM_TYPE_Description: 'Phòng học tiêu chuẩn',
		}]
		Dao.findAllRoom.mockResolvedValue(mockFullRoom)

		// Act
		const result = await EquipmentService.findAllRoom()

		// Assert: đủ field từ 2 bảng
		const room = result[0]
		expect(room).toHaveProperty('ROOM_Name')
		expect(room).toHaveProperty('ROOM_Capacity')
		expect(room).toHaveProperty('LOCATION_Building')
		expect(room).toHaveProperty('LOCATION_Floor')
		expect(room).toHaveProperty('ROOM_TYPE_Name')
	})

	// TC_ROOM_FINDALL_06: Trả về thông tin vị trí phòng (tòa nhà, tầng)
	it('[TC_ROOM_FINDALL_06] nên trả về thông tin vị trí phòng (tòa nhà, tầng) để giáo viên biết', async () => {
		// Arrange
		const mockRoomsWithLocation = [
			{ ID: 1, ROOM_Name: 'A101', LOCATION_Building: 'A', LOCATION_Floor: 1 },
			{ ID: 2, ROOM_Name: 'B201', LOCATION_Building: 'B', LOCATION_Floor: 2 },
		]
		Dao.findAllRoom.mockResolvedValue(mockRoomsWithLocation)

		// Act
		const result = await EquipmentService.findAllRoom()

		// Assert: mỗi phòng có thông tin vị trí
		result.forEach(room => {
			expect(room).toHaveProperty('LOCATION_Building')
			expect(room).toHaveProperty('LOCATION_Floor')
		})
	})

	// TC_ROOM_FINDALL_07: CheckDB — Dao.findAllRoom được gọi đúng 1 lần
	it('[TC_ROOM_FINDALL_07] CheckDB: nên gọi Dao.findAllRoom đúng 1 lần', async () => {
		// Arrange
		Dao.findAllRoom.mockResolvedValue([])

		// Act
		await EquipmentService.findAllRoom()

		// CheckDB
		expect(Dao.findAllRoom).toHaveBeenCalledTimes(1)
	})

	// TC_ROOM_FINDALL_08: Trả về error object khi DB mất kết nối (không throw)
	it('[TC_ROOM_FINDALL_08] nên trả về error object khi DB mất kết nối (không throw)', async () => {
		// Arrange
		const dbError = new Error('ECONNREFUSED')
		Dao.findAllRoom.mockRejectedValue(dbError)

		// Act
		const result = await EquipmentService.findAllRoom()

		// Assert
		expect(result).toBeInstanceOf(Error)
	})

	// TC_ROOM_FINDALL_09: Trả về error object khi DB timeout
	it('[TC_ROOM_FINDALL_09] nên trả về error object khi DB timeout (không throw)', async () => {
		// Arrange
		const timeoutError = new Error('Query timeout')
		Dao.findAllRoom.mockRejectedValue(timeoutError)

		// Act
		const result = await EquipmentService.findAllRoom()

		// Assert
		expect(result).toBeInstanceOf(Error)
	})
})

// =============================================================================
// 4. createEquipment()
// Nghiệp vụ: Ban quản lý thêm thiết bị hoặc phòng mới
// Phân biệt loại qua field: EQUIPMENT_ITEM_Name → thiết bị, ROOM_Name → phòng
// Transaction: thiết bị 3 bảng (TYPE→MODEL→ITEM), phòng 2 bảng (ROOM_TYPE→ROOM)
// CheckDB: xác minh Dao.createEquipment được gọi với đúng req.body
// Rollback: mock → không có DB thật bị tác động
//           Nếu test DB thật: afterEach DELETE các bản ghi vừa INSERT
// =============================================================================
describe('createEquipment()', () => {

	// Dữ liệu thiết bị hợp lệ dùng chung
	const validEquipmentBody = {
		EQUIPMENT_ITEM_Name: 'EPX200-004',
		EQUIPMENT_ITEM_PurchaseDate: '2024-06-01',
		EQUIPMENT_ITEM_Price: 12000000,
		EQUIPMENT_ITEM_Quantity: 1,
		EQUIPMENT_ITEM_Status: 'Có sẵn',
		EQUIPMENT_ITEM_Description: 'Máy chiếu mới',
		EQUIPMENT_MODEL_Name: 'Epson X200',
		EQUIPMENT_MODEL_Branch: 'Epson',
		EQUIPMENT_TYPE_Name: 'Projector',
		EQUIPMENT_TYPE_Description: 'Máy chiếu phục vụ giảng dạy',
	}

	// Dữ liệu phòng hợp lệ dùng chung
	const validRoomBody = {
		ROOM_Name: 'A102',
		ROOM_Capacity: 40,
		ROOM_Description: 'Phòng học mới',
		ROOM_Status: 'Có sẵn',
		LOCATION_Building: 'A',
		LOCATION_Floor: 1,
		ROOM_TYPE_Name: 'Classroom',
		ROOM_TYPE_Description: 'Phòng học tiêu chuẩn',
	}

	// TC_EQ_CREATE_01: Tạo thiết bị Projector mới thành công
	it('[TC_EQ_CREATE_01] nên tạo thiết bị Projector mới thành công', async () => {
		// Arrange
		Dao.createEquipment.mockResolvedValue({ message: 'Thêm thiết bị thành công' })
		const req = { body: validEquipmentBody }

		// Act
		const result = await EquipmentService.createEquipment(req)

		// Assert
		expect(result.message).toBe('Thêm thiết bị thành công')
	})

	// TC_EQ_CREATE_02: Tạo thiết bị Laptop mới thành công
	it('[TC_EQ_CREATE_02] nên tạo thiết bị Laptop mới thành công', async () => {
		// Arrange
		const laptopBody = { ...validEquipmentBody, EQUIPMENT_ITEM_Name: 'DL15-003', EQUIPMENT_TYPE_Name: 'Laptop' }
		Dao.createEquipment.mockResolvedValue({ message: 'Thêm thiết bị thành công' })
		const req = { body: laptopBody }

		// Act
		const result = await EquipmentService.createEquipment(req)

		// Assert
		expect(result.message).toBe('Thêm thiết bị thành công')
	})

	// TC_EQ_CREATE_03: Tạo phòng Classroom mới thành công
	it('[TC_EQ_CREATE_03] nên tạo phòng Classroom mới thành công', async () => {
		// Arrange
		Dao.createEquipment.mockResolvedValue({ message: 'Thêm phòng thành công' })
		const req = { body: validRoomBody }

		// Act
		const result = await EquipmentService.createEquipment(req)

		// Assert
		expect(result.message).toBe('Thêm phòng thành công')
	})

	// TC_EQ_CREATE_04: Tạo phòng Lab mới thành công
	it('[TC_EQ_CREATE_04] nên tạo phòng Lab mới thành công', async () => {
		// Arrange
		const labBody = { ...validRoomBody, ROOM_Name: 'B202', ROOM_TYPE_Name: 'Lab' }
		Dao.createEquipment.mockResolvedValue({ message: 'Thêm phòng thành công' })
		const req = { body: labBody }

		// Act
		const result = await EquipmentService.createEquipment(req)

		// Assert
		expect(result.message).toBe('Thêm phòng thành công')
	})

	// TC_EQ_CREATE_05: Tạo phòng Conference mới thành công
	it('[TC_EQ_CREATE_05] nên tạo phòng Conference mới thành công', async () => {
		// Arrange
		const conferenceBody = { ...validRoomBody, ROOM_Name: 'C02', ROOM_TYPE_Name: 'Conference' }
		Dao.createEquipment.mockResolvedValue({ message: 'Thêm phòng thành công' })
		const req = { body: conferenceBody }

		// Act
		const result = await EquipmentService.createEquipment(req)

		// Assert
		expect(result.message).toBe('Thêm phòng thành công')
	})

	// TC_EQ_CREATE_06: CheckDB — Dao.createEquipment được gọi với đúng req.body
	it('[TC_EQ_CREATE_06] CheckDB: nên truyền đúng req.body xuống Dao.createEquipment', async () => {
		// Arrange
		Dao.createEquipment.mockResolvedValue({ message: 'Thêm thiết bị thành công' })
		const req = { body: validEquipmentBody }

		// Act
		await EquipmentService.createEquipment(req)

		// CheckDB: xác minh DAO nhận đúng dữ liệu
		expect(Dao.createEquipment).toHaveBeenCalledWith(validEquipmentBody)
		expect(Dao.createEquipment).toHaveBeenCalledTimes(1)
	})

	// TC_EQ_CREATE_07: Transaction rollback khi INSERT EQUIPMENT_TYPE thất bại
	it('[TC_EQ_CREATE_07] nên trả về error khi transaction thất bại ở bước INSERT EQUIPMENT_TYPE', async () => {
		// Arrange: DAO reject → transaction đã rollback bên trong DAO
		const txError = new Error('Duplicate entry for EQUIPMENT_TYPE')
		Dao.createEquipment.mockRejectedValue(txError)
		const req = { body: validEquipmentBody }

		// Act
		const result = await EquipmentService.createEquipment(req)

		// Assert: service bắt lỗi và return (không throw)
		expect(result).toBeInstanceOf(Error)
		expect(result.message).toContain('Duplicate entry')
	})

	// TC_EQ_CREATE_08: Transaction rollback khi INSERT EQUIPMENT_MODEL thất bại
	it('[TC_EQ_CREATE_08] nên trả về error khi transaction thất bại ở bước INSERT EQUIPMENT_MODEL', async () => {
		// Arrange
		const txError = new Error('FK constraint failed on EQUIPMENT_MODEL')
		Dao.createEquipment.mockRejectedValue(txError)
		const req = { body: validEquipmentBody }

		// Act
		const result = await EquipmentService.createEquipment(req)

		// Assert
		expect(result).toBeInstanceOf(Error)
	})

	// TC_EQ_CREATE_09: Transaction rollback khi INSERT EQUIPMENT_ITEM thất bại
	it('[TC_EQ_CREATE_09] nên trả về error khi transaction thất bại ở bước INSERT EQUIPMENT_ITEM', async () => {
		// Arrange
		const txError = new Error('FK constraint failed on EQUIPMENT_ITEM')
		Dao.createEquipment.mockRejectedValue(txError)
		const req = { body: validEquipmentBody }

		// Act
		const result = await EquipmentService.createEquipment(req)

		// Assert
		expect(result).toBeInstanceOf(Error)
	})

	// TC_EQ_CREATE_10: Transaction rollback khi INSERT ROOM_TYPE thất bại
	it('[TC_EQ_CREATE_10] nên trả về error khi transaction thất bại ở bước INSERT ROOM_TYPE', async () => {
		// Arrange
		const txError = new Error('DB error on ROOM_TYPE')
		Dao.createEquipment.mockRejectedValue(txError)
		const req = { body: validRoomBody }

		// Act
		const result = await EquipmentService.createEquipment(req)

		// Assert
		expect(result).toBeInstanceOf(Error)
	})

	// TC_EQ_CREATE_11: Data không có EQUIPMENT_ITEM_Name lẫn ROOM_Name → Unknown data type
	it('[TC_EQ_CREATE_11] nên trả về error "Unknown data type" khi data không hợp lệ', async () => {
		// Arrange: body không có field nhận dạng loại
		const invalidBody = { someOtherField: 'value' }
		Dao.createEquipment.mockRejectedValue('Unknown data type')
		const req = { body: invalidBody }

		// Act
		const result = await EquipmentService.createEquipment(req)

		// Assert
		expect(result).toBe('Unknown data type')
	})

	// TC_EQ_CREATE_12: CheckDB — Dao.createEquipment được gọi đúng 1 lần
	it('[TC_EQ_CREATE_12] CheckDB: nên gọi Dao.createEquipment đúng 1 lần', async () => {
		// Arrange
		Dao.createEquipment.mockResolvedValue({ message: 'Thêm thiết bị thành công' })
		const req = { body: validEquipmentBody }

		// Act
		await EquipmentService.createEquipment(req)

		// CheckDB
		expect(Dao.createEquipment).toHaveBeenCalledTimes(1)
	})

	// TC_EQ_CREATE_13: Trả về error khi DB mất kết nối (không throw)
	it('[TC_EQ_CREATE_13] nên trả về error object khi DB mất kết nối (không throw)', async () => {
		// Arrange
		const dbError = new Error('ECONNREFUSED')
		Dao.createEquipment.mockRejectedValue(dbError)
		const req = { body: validEquipmentBody }

		// Act
		const result = await EquipmentService.createEquipment(req)

		// Assert
		expect(result).toBeInstanceOf(Error)
	})
})

// =============================================================================
// 5. updateEquipment()
// Nghiệp vụ: Ban quản lý cập nhật thiết bị hoặc phòng
// Phân biệt loại qua field: EQUIPMENT_ITEM_Name → thiết bị, ROOM_Name → phòng
// Cập nhật status thiết bị ảnh hưởng đến khả năng mượn
// Transaction: thiết bị 3 bảng, phòng 2 bảng — rollback nếu bất kỳ bước nào lỗi
// CheckDB: xác minh Dao.updateEquipment được gọi với đúng req.body
// Rollback: mock → không có DB thật bị tác động
//           Nếu test DB thật: afterEach UPDATE lại giá trị cũ
// =============================================================================
describe('updateEquipment()', () => {

	// Dữ liệu update thiết bị hợp lệ
	const validUpdateEquipmentBody = {
		ID: 1,
		EQUIPMENT_ITEM_Name: 'EPX200-001 (Updated)',
		EQUIPMENT_ITEM_PurchaseDate: '2024-01-10',
		EQUIPMENT_ITEM_Price: 13000000,
		EQUIPMENT_ITEM_Quantity: 1,
		EQUIPMENT_ITEM_Status: 'Có sẵn',
		EQUIPMENT_ITEM_Description: 'Cập nhật mô tả',
		EQUIPMENT_MODEL_ID: 1,
		EQUIPMENT_MODEL_Name: 'Epson X200',
		EQUIPMENT_MODEL_Branch: 'Epson',
		EQUIPMENT_TYPE_ID: 1,
		EQUIPMENT_TYPE_Name: 'Projector',
		EQUIPMENT_TYPE_Description: 'Máy chiếu phục vụ giảng dạy',
	}

	// Dữ liệu update phòng hợp lệ
	const validUpdateRoomBody = {
		ID: 1,
		ROOM_Name: 'A101 (Updated)',
		ROOM_Capacity: 45,
		ROOM_Description: 'Phòng học lớn hơn',
		ROOM_Status: 'Có sẵn',
		LOCATION_Building: 'A',
		LOCATION_Floor: 1,
		ROOM_TYPE_ID: 1,
		ROOM_TYPE_Name: 'Classroom',
		ROOM_TYPE_Description: 'Phòng học tiêu chuẩn',
	}

	// TC_EQ_UPDATE_01: Cập nhật thông tin thiết bị thành công
	it('[TC_EQ_UPDATE_01] nên cập nhật thông tin thiết bị thành công', async () => {
		// Arrange
		Dao.updateEquipment.mockResolvedValue({ message: 'Update equipment thành công' })
		const req = { body: validUpdateEquipmentBody }

		// Act
		const result = await EquipmentService.updateEquipment(req)

		// Assert
		expect(result.message).toBe('Update equipment thành công')
	})

	// TC_EQ_UPDATE_02: Cập nhật thông tin phòng thành công
	it('[TC_EQ_UPDATE_02] nên cập nhật thông tin phòng thành công', async () => {
		// Arrange
		Dao.updateEquipment.mockResolvedValue({ message: 'Update room thành công' })
		const req = { body: validUpdateRoomBody }

		// Act
		const result = await EquipmentService.updateEquipment(req)

		// Assert
		expect(result.message).toBe('Update room thành công')
	})

	// TC_EQ_UPDATE_03: Cập nhật status thiết bị từ 'Có sẵn' sang 'Đang sử dụng'
	it('[TC_EQ_UPDATE_03] nên cập nhật status thiết bị sang "Đang sử dụng" thành công', async () => {
		// Arrange: thiết bị đang được mượn
		const inUseBody = { ...validUpdateEquipmentBody, EQUIPMENT_ITEM_Status: 'Đang sử dụng' }
		Dao.updateEquipment.mockResolvedValue({ message: 'Update equipment thành công' })
		const req = { body: inUseBody }

		// Act
		const result = await EquipmentService.updateEquipment(req)

		// Assert
		expect(result.message).toBe('Update equipment thành công')
	})

	// TC_EQ_UPDATE_04: Cập nhật status thiết bị từ 'Đang sử dụng' về 'Có sẵn' (sau khi trả)
	it('[TC_EQ_UPDATE_04] nên cập nhật status thiết bị về "Có sẵn" sau khi trả thành công', async () => {
		// Arrange
		const availableBody = { ...validUpdateEquipmentBody, EQUIPMENT_ITEM_Status: 'Có sẵn' }
		Dao.updateEquipment.mockResolvedValue({ message: 'Update equipment thành công' })
		const req = { body: availableBody }

		// Act
		const result = await EquipmentService.updateEquipment(req)

		// Assert
		expect(result.message).toBe('Update equipment thành công')
	})

	// TC_EQ_UPDATE_05: Đánh dấu thiết bị bị hỏng
	it('[TC_EQ_UPDATE_05] nên cập nhật status thiết bị sang "Hỏng" thành công', async () => {
		// Arrange
		const brokenBody = { ...validUpdateEquipmentBody, EQUIPMENT_ITEM_Status: 'Hỏng' }
		Dao.updateEquipment.mockResolvedValue({ message: 'Update equipment thành công' })
		const req = { body: brokenBody }

		// Act
		const result = await EquipmentService.updateEquipment(req)

		// Assert
		expect(result.message).toBe('Update equipment thành công')
	})

	// TC_EQ_UPDATE_06: Cập nhật giá thiết bị (định giá lại tài sản)
	it('[TC_EQ_UPDATE_06] nên cập nhật giá thiết bị thành công', async () => {
		// Arrange
		const newPriceBody = { ...validUpdateEquipmentBody, EQUIPMENT_ITEM_Price: 15000000 }
		Dao.updateEquipment.mockResolvedValue({ message: 'Update equipment thành công' })
		const req = { body: newPriceBody }

		// Act
		const result = await EquipmentService.updateEquipment(req)

		// Assert
		expect(result.message).toBe('Update equipment thành công')
	})

	// TC_EQ_UPDATE_07: Cập nhật sức chứa phòng
	it('[TC_EQ_UPDATE_07] nên cập nhật sức chứa phòng thành công', async () => {
		// Arrange
		const newCapacityBody = { ...validUpdateRoomBody, ROOM_Capacity: 50 }
		Dao.updateEquipment.mockResolvedValue({ message: 'Update room thành công' })
		const req = { body: newCapacityBody }

		// Act
		const result = await EquipmentService.updateEquipment(req)

		// Assert
		expect(result.message).toBe('Update room thành công')
	})

	// TC_EQ_UPDATE_08: Cập nhật status phòng sang 'Đang sửa chữa'
	it('[TC_EQ_UPDATE_08] nên cập nhật status phòng sang "Đang sửa chữa" thành công', async () => {
		// Arrange
		const maintenanceBody = { ...validUpdateRoomBody, ROOM_Status: 'Đang sửa chữa' }
		Dao.updateEquipment.mockResolvedValue({ message: 'Update room thành công' })
		const req = { body: maintenanceBody }

		// Act
		const result = await EquipmentService.updateEquipment(req)

		// Assert
		expect(result.message).toBe('Update room thành công')
	})

	// TC_EQ_UPDATE_09: Transaction rollback khi UPDATE EQUIPMENT_ITEM thất bại
	it('[TC_EQ_UPDATE_09] nên trả về error khi transaction thất bại ở bước UPDATE EQUIPMENT_ITEM', async () => {
		// Arrange: DAO reject → transaction đã rollback bên trong DAO
		const txError = new Error('DB error on EQUIPMENT_ITEM update')
		Dao.updateEquipment.mockRejectedValue(txError)
		const req = { body: validUpdateEquipmentBody }

		// Act
		const result = await EquipmentService.updateEquipment(req)

		// Assert
		expect(result).toBeInstanceOf(Error)
	})

	// TC_EQ_UPDATE_10: Transaction rollback khi UPDATE EQUIPMENT_MODEL thất bại
	it('[TC_EQ_UPDATE_10] nên trả về error khi transaction thất bại ở bước UPDATE EQUIPMENT_MODEL', async () => {
		// Arrange
		const txError = new Error('DB error on EQUIPMENT_MODEL update')
		Dao.updateEquipment.mockRejectedValue(txError)
		const req = { body: validUpdateEquipmentBody }

		// Act
		const result = await EquipmentService.updateEquipment(req)

		// Assert
		expect(result).toBeInstanceOf(Error)
	})

	// TC_EQ_UPDATE_11: Transaction rollback khi UPDATE EQUIPMENT_TYPE thất bại
	it('[TC_EQ_UPDATE_11] nên trả về error khi transaction thất bại ở bước UPDATE EQUIPMENT_TYPE', async () => {
		// Arrange
		const txError = new Error('DB error on EQUIPMENT_TYPE update')
		Dao.updateEquipment.mockRejectedValue(txError)
		const req = { body: validUpdateEquipmentBody }

		// Act
		const result = await EquipmentService.updateEquipment(req)

		// Assert
		expect(result).toBeInstanceOf(Error)
	})

	// TC_EQ_UPDATE_12: Data không có EQUIPMENT_ITEM_Name lẫn ROOM_Name → Unknown data type
	it('[TC_EQ_UPDATE_12] nên trả về error "Unknown data type" khi data không hợp lệ', async () => {
		// Arrange
		Dao.updateEquipment.mockRejectedValue('Unknown data type')
		const req = { body: { ID: 1, someField: 'value' } }

		// Act
		const result = await EquipmentService.updateEquipment(req)

		// Assert
		expect(result).toBe('Unknown data type')
	})

	// TC_EQ_UPDATE_13: CheckDB — Dao.updateEquipment được gọi với đúng req.body
	it('[TC_EQ_UPDATE_13] CheckDB: nên truyền đúng req.body xuống Dao.updateEquipment', async () => {
		// Arrange
		Dao.updateEquipment.mockResolvedValue({ message: 'Update equipment thành công' })
		const req = { body: validUpdateEquipmentBody }

		// Act
		await EquipmentService.updateEquipment(req)

		// CheckDB
		expect(Dao.updateEquipment).toHaveBeenCalledWith(validUpdateEquipmentBody)
		expect(Dao.updateEquipment).toHaveBeenCalledTimes(1)
	})

	// TC_EQ_UPDATE_14: CheckDB — Dao.updateEquipment được gọi đúng 1 lần
	it('[TC_EQ_UPDATE_14] CheckDB: nên gọi Dao.updateEquipment đúng 1 lần', async () => {
		// Arrange
		Dao.updateEquipment.mockResolvedValue({ message: 'Update equipment thành công' })
		const req = { body: validUpdateEquipmentBody }

		// Act
		await EquipmentService.updateEquipment(req)

		// CheckDB
		expect(Dao.updateEquipment).toHaveBeenCalledTimes(1)
	})

	// TC_EQ_UPDATE_15: Trả về error khi DB mất kết nối (không throw)
	it('[TC_EQ_UPDATE_15] nên trả về error object khi DB mất kết nối (không throw)', async () => {
		// Arrange
		const dbError = new Error('ECONNREFUSED')
		Dao.updateEquipment.mockRejectedValue(dbError)
		const req = { body: validUpdateEquipmentBody }

		// Act
		const result = await EquipmentService.updateEquipment(req)

		// Assert
		expect(result).toBeInstanceOf(Error)
	})
})

// =============================================================================
// 6. deleteEquipment()
// Nghiệp vụ: Ban quản lý xóa thiết bị hoặc phòng — SOFT DELETE
// Chỉ đặt status = 'inactive', không xóa vật lý → lịch sử mượn trả giữ nguyên
// req.body phải có {id, type} — type là 'equipment' hoặc 'room'
// CheckDB: xác minh Dao.deleteEquipment được gọi với đúng req.body
// Rollback: mock → không có DB thật bị tác động
//           Nếu test DB thật: afterEach UPDATE status về 'Có sẵn'
// =============================================================================
describe('deleteEquipment()', () => {

	// TC_EQ_DELETE_01: Soft delete thiết bị thành công (type=equipment)
	it('[TC_EQ_DELETE_01] nên soft delete thiết bị thành công (đặt status = inactive)', async () => {
		// Arrange
		const mockResult = { affectedRows: 1 }
		Dao.deleteEquipment.mockResolvedValue(mockResult)
		const req = { body: { id: 1, type: 'equipment' } }

		// Act
		const result = await EquipmentService.deleteEquipment(req)

		// Assert
		expect(result.affectedRows).toBe(1)
	})

	// TC_EQ_DELETE_02: Soft delete phòng thành công (type=room)
	it('[TC_EQ_DELETE_02] nên soft delete phòng thành công (đặt status = inactive)', async () => {
		// Arrange
		const mockResult = { affectedRows: 1 }
		Dao.deleteEquipment.mockResolvedValue(mockResult)
		const req = { body: { id: 1, type: 'room' } }

		// Act
		const result = await EquipmentService.deleteEquipment(req)

		// Assert
		expect(result.affectedRows).toBe(1)
	})

	// TC_EQ_DELETE_03: Sau soft delete thiết bị, không còn xuất hiện trong findAllEquipment
	it('[TC_EQ_DELETE_03] nên đảm bảo thiết bị không còn xuất hiện sau khi soft delete', async () => {
		// Arrange: sau khi delete, findAll trả về mảng không có thiết bị ID=1
		Dao.deleteEquipment.mockResolvedValue({ affectedRows: 1 })
		Dao.findAll.mockResolvedValue([]) // DAO lọc inactive → không trả về
		const deleteReq = { body: { id: 1, type: 'equipment' } }

		// Act: soft delete
		await EquipmentService.deleteEquipment(deleteReq)
		// Sau đó lấy danh sách
		const listResult = await EquipmentService.findAllEquipment()

		// Assert: thiết bị ID=1 không còn trong danh sách
		expect(listResult.find(e => e.ID === 1)).toBeUndefined()
	})

	// TC_EQ_DELETE_04: Sau soft delete phòng, không còn xuất hiện trong findAllRoom
	it('[TC_EQ_DELETE_04] nên đảm bảo phòng không còn xuất hiện sau khi soft delete', async () => {
		// Arrange
		Dao.deleteEquipment.mockResolvedValue({ affectedRows: 1 })
		Dao.findAllRoom.mockResolvedValue([])
		const deleteReq = { body: { id: 1, type: 'room' } }

		// Act
		await EquipmentService.deleteEquipment(deleteReq)
		const listResult = await EquipmentService.findAllRoom()

		// Assert
		expect(listResult.find(r => r.ID === 1)).toBeUndefined()
	})

	// TC_EQ_DELETE_05: affectedRows = 0 khi ID thiết bị không tồn tại
	it('[TC_EQ_DELETE_05] nên trả về affectedRows = 0 khi ID thiết bị không tồn tại', async () => {
		// Arrange
		Dao.deleteEquipment.mockResolvedValue({ affectedRows: 0 })
		const req = { body: { id: 9999, type: 'equipment' } }

		// Act
		const result = await EquipmentService.deleteEquipment(req)

		// Assert
		expect(result.affectedRows).toBe(0)
	})

	// TC_EQ_DELETE_06: affectedRows = 0 khi ID phòng không tồn tại
	it('[TC_EQ_DELETE_06] nên trả về affectedRows = 0 khi ID phòng không tồn tại', async () => {
		// Arrange
		Dao.deleteEquipment.mockResolvedValue({ affectedRows: 0 })
		const req = { body: { id: 9999, type: 'room' } }

		// Act
		const result = await EquipmentService.deleteEquipment(req)

		// Assert
		expect(result.affectedRows).toBe(0)
	})

	// TC_EQ_DELETE_07: Trả về error khi type không hợp lệ
	it('[TC_EQ_DELETE_07] nên trả về error khi type không hợp lệ (không phải equipment/room)', async () => {
		// Arrange
		const typeError = new Error('Type không hợp lệ')
		Dao.deleteEquipment.mockRejectedValue(typeError)
		const req = { body: { id: 1, type: 'invalid' } }

		// Act
		const result = await EquipmentService.deleteEquipment(req)

		// Assert
		expect(result).toBeInstanceOf(Error)
		expect(result.message).toBe('Type không hợp lệ')
	})

	// TC_EQ_DELETE_08: CheckDB — Dao.deleteEquipment được gọi với đúng {id, type}
	it('[TC_EQ_DELETE_08] CheckDB: nên truyền đúng {id, type} xuống Dao.deleteEquipment', async () => {
		// Arrange
		Dao.deleteEquipment.mockResolvedValue({ affectedRows: 1 })
		const deleteBody = { id: 2, type: 'equipment' }
		const req = { body: deleteBody }

		// Act
		await EquipmentService.deleteEquipment(req)

		// CheckDB: xác minh DAO nhận đúng argument
		expect(Dao.deleteEquipment).toHaveBeenCalledWith(deleteBody)
		expect(Dao.deleteEquipment).toHaveBeenCalledTimes(1)
	})

	// TC_EQ_DELETE_09: CheckDB — Dao.deleteEquipment được gọi đúng 1 lần
	it('[TC_EQ_DELETE_09] CheckDB: nên gọi Dao.deleteEquipment đúng 1 lần', async () => {
		// Arrange
		Dao.deleteEquipment.mockResolvedValue({ affectedRows: 1 })
		const req = { body: { id: 1, type: 'equipment' } }

		// Act
		await EquipmentService.deleteEquipment(req)

		// CheckDB
		expect(Dao.deleteEquipment).toHaveBeenCalledTimes(1)
	})

	// TC_EQ_DELETE_10: Trả về error khi DB lỗi (không throw)
	it('[TC_EQ_DELETE_10] nên trả về error object khi DB lỗi (không throw)', async () => {
		// Arrange
		const dbError = new Error('DB connection failed')
		Dao.deleteEquipment.mockRejectedValue(dbError)
		const req = { body: { id: 1, type: 'equipment' } }

		// Act
		const result = await EquipmentService.deleteEquipment(req)

		// Assert
		expect(result).toBeInstanceOf(Error)
	})

	// TC_EQ_DELETE_11: Soft delete thiết bị đang có phiếu mượn — không vi phạm FK
	it('[TC_EQ_DELETE_11] nên soft delete thành công dù thiết bị đang có phiếu mượn (không vi phạm FK)', async () => {
		// Arrange: soft delete chỉ UPDATE status, không DELETE → không vi phạm FK
		Dao.deleteEquipment.mockResolvedValue({ affectedRows: 1 })
		const req = { body: { id: 1, type: 'equipment' } }

		// Act
		const result = await EquipmentService.deleteEquipment(req)

		// Assert: thành công vì chỉ đổi status, không xóa vật lý
		expect(result.affectedRows).toBe(1)
	})
})
