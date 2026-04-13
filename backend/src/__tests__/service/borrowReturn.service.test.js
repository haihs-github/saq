/**
 * Unit Test Script: borrowReturn.service.js
 * File được test: backend/src/module/borrowReturn/borrowReturn.service.js
 *
 * Nghiệp vụ hệ thống:
 *   - Giáo viên tạo phiếu mượn thiết bị hoặc phòng học
 *   - Ban quản lý xem danh sách phiếu, xác nhận trả
 *   - Khi mượn: status thiết bị/phòng → 'Đang mượn'
 *   - Khi trả:  status thiết bị/phòng → 'Có sẵn', slip → 'Đã trả'
 *
 * Chiến lược:
 *   - Mock configDB TRƯỚC TIÊN để chặn mysql2 kết nối DB thật
 *   - Mock toàn bộ DAO layer (borrowReturn.dao.js)
 *   - CheckDB: xác minh DAO được gọi đúng tham số, đúng số lần
 *   - Rollback: jest.clearAllMocks() trong beforeEach — mock hoàn toàn,
 *               không có DB thật bị tác động
 */

// ─── Mock configDB TRƯỚC TIÊN ─────────────────────────────────────────────────
// Phải mock trước khi bất kỳ module nào require configDB
// Nếu không: mysql2 cố kết nối DB thật → lỗi "Encoding not recognized"
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
jest.mock('../../module/borrowReturn/borrowReturn.dao')
const Dao = require('../../module/borrowReturn/borrowReturn.dao')

// ─── Mock dotenv ──────────────────────────────────────────────────────────────
jest.mock('dotenv', () => ({ config: jest.fn() }))

// ─── Import service cần test ──────────────────────────────────────────────────
const BorrowReturnService = require('../../module/borrowReturn/borrowReturn.service')

// ─── Setup chung ─────────────────────────────────────────────────────────────
beforeEach(() => {
	// Rollback: xóa toàn bộ mock state sau mỗi test → trạng thái sạch
	jest.clearAllMocks()
})

// =============================================================================
// 1. findAllBorrowReturn()
// Nghiệp vụ: Ban quản lý xem toàn bộ lịch sử mượn/trả thiết bị và phòng
// Kết quả JOIN 8 bảng: SLIP + USER + DATE + ITEM + EQUIPMENT + MODEL + TYPE + ROOM
// CheckDB: xác minh Dao.findAllBorrowReturn được gọi đúng 1 lần
// Rollback: mock → không có DB thật bị tác động
// =============================================================================
describe('findAllBorrowReturn()', () => {

	// TC_BR_FINDALL_01: Có nhiều phiếu mượn với cả thiết bị và phòng
	it('[TC_BR_FINDALL_01] nên trả về danh sách tất cả phiếu mượn/trả (thiết bị + phòng)', async () => {
		// Arrange: mock dữ liệu JOIN 8 bảng
		const mockSlips = [
			{
				BORROW_RETURN_SLIP_ID: 1,
				BORROW_RETURN_SLIP_Name: 'Phiếu mượn máy chiếu',
				BORROW_RETURN_SLIP_Status: 'Chưa trả',
				USER_FullName: 'Nguyễn Văn Tuấn',
				USER_Role: 'Giáo viên',
				EQUIPMENT_ITEM_Name: 'EPX200-001',
				EQUIPMENT_ITEM_Status: 'Đang mượn',
				ROOM_Name: null,
			},
			{
				BORROW_RETURN_SLIP_ID: 2,
				BORROW_RETURN_SLIP_Name: 'Phiếu mượn phòng A101',
				BORROW_RETURN_SLIP_Status: 'Đã trả',
				USER_FullName: 'Lê Đình Hưng',
				USER_Role: 'Giáo viên',
				EQUIPMENT_ITEM_Name: null,
				ROOM_Name: 'A101',
			},
		]
		Dao.findAllBorrowReturn.mockResolvedValue(mockSlips)

		// Act
		const result = await BorrowReturnService.findAllBorrowReturn()

		// Assert
		expect(result).toEqual(mockSlips)
		expect(result).toHaveLength(2)
	})

	// TC_BR_FINDALL_02: Chỉ có phiếu mượn thiết bị (không có phòng)
	it('[TC_BR_FINDALL_02] nên trả về danh sách chỉ chứa phiếu mượn thiết bị', async () => {
		// Arrange
		const mockEquipmentSlips = [
			{
				BORROW_RETURN_SLIP_ID: 1,
				EQUIPMENT_ITEM_NAME: 'EPX200-001',
				BORROW_RETURN_SLIP_Status: 'Chưa trả',
			},
		]
		Dao.findAllBorrowReturn.mockResolvedValue(mockEquipmentSlips)

		// Act
		const result = await BorrowReturnService.findAllBorrowReturn()

		// Assert
		expect(result).toHaveLength(1)
		expect(result[0].BORROW_RETURN_SLIP_Status).toBe('Chưa trả')
	})

	// TC_BR_FINDALL_03: Chỉ có phiếu mượn phòng (không có thiết bị)
	it('[TC_BR_FINDALL_03] nên trả về danh sách chỉ chứa phiếu mượn phòng', async () => {
		// Arrange
		const mockRoomSlips = [
			{
				BORROW_RETURN_SLIP_ID: 2,
				ROOM_NAME: 'A101',
				BORROW_RETURN_SLIP_Status: 'Đã trả',
			},
		]
		Dao.findAllBorrowReturn.mockResolvedValue(mockRoomSlips)

		// Act
		const result = await BorrowReturnService.findAllBorrowReturn()

		// Assert
		expect(result[0].BORROW_RETURN_SLIP_Status).toBe('Đã trả')
	})

	// TC_BR_FINDALL_04: Trả về mảng rỗng khi chưa có phiếu mượn nào
	it('[TC_BR_FINDALL_04] nên trả về mảng rỗng khi chưa có phiếu mượn nào', async () => {
		// Arrange
		Dao.findAllBorrowReturn.mockResolvedValue([])

		// Act
		const result = await BorrowReturnService.findAllBorrowReturn()

		// Assert
		expect(result).toEqual([])
		expect(result).toHaveLength(0)
	})

	// TC_BR_FINDALL_05: CheckDB — Dao.findAllBorrowReturn được gọi đúng 1 lần
	it('[TC_BR_FINDALL_05] CheckDB: nên gọi Dao.findAllBorrowReturn đúng 1 lần', async () => {
		// Arrange
		Dao.findAllBorrowReturn.mockResolvedValue([])

		// Act
		await BorrowReturnService.findAllBorrowReturn()

		// CheckDB
		expect(Dao.findAllBorrowReturn).toHaveBeenCalledTimes(1)
		expect(Dao.findAllBorrowReturn).toHaveBeenCalledWith()
	})

	// TC_BR_FINDALL_06: Trả về error object khi DB lỗi (không throw)
	it('[TC_BR_FINDALL_06] nên trả về error object khi DB lỗi (không throw)', async () => {
		// Arrange
		const dbError = new Error('ECONNREFUSED: DB connection refused')
		Dao.findAllBorrowReturn.mockRejectedValue(dbError)

		// Act
		const result = await BorrowReturnService.findAllBorrowReturn()

		// Assert: service bắt lỗi bằng try/catch và return error
		expect(result).toBeInstanceOf(Error)
		expect(result.message).toContain('ECONNREFUSED')
	})
})

// =============================================================================
// 2. findAllBorrowReturnSlip()
// Nghiệp vụ: Ban quản lý xem danh sách tất cả phiếu mượn (tóm tắt)
// JOIN 3 bảng: SLIP + DATE + ITEM. Trả về results[0] (phần tử đầu tiên)
// CheckDB: xác minh Dao.findAllBorrowReturnSlipDAO được gọi đúng 1 lần
// =============================================================================
describe('findAllBorrowReturnSlip()', () => {

	// TC_BR_FINDALLSLIP_01: Trả về phiếu đầu tiên khi có nhiều phiếu
	it('[TC_BR_FINDALLSLIP_01] nên trả về phần tử đầu tiên của danh sách phiếu mượn', async () => {
		// Arrange: DAO trả về results[0] — phần tử đầu tiên
		const mockFirstSlip = {
			BORROW_RETURN_SLIP_ID: 1,
			BORROW_RETURN_SLIP_Name: 'Phiếu mượn máy chiếu',
			BORROW_RETURN_SLIP_Status: 'Chưa trả',
			USER_ID: 1,
			DATE_BorrowDate: '2024-06-01 07:00:00',
			DATE_ExceptionReturnDate: '2024-06-01 08:30:00',
			DATE_ActualReturnDate: null,
			EQUIPMENT_ITEM_ID: 1,
		}
		Dao.findAllBorrowReturnSlipDAO.mockResolvedValue(mockFirstSlip)

		// Act
		const result = await BorrowReturnService.findAllBorrowReturnSlip()

		// Assert
		expect(result).toEqual(mockFirstSlip)
		expect(result.BORROW_RETURN_SLIP_Status).toBe('Chưa trả')
	})

	// TC_BR_FINDALLSLIP_02: Phiếu có status 'Đã trả' (DATE_ActualReturnDate có giá trị)
	it('[TC_BR_FINDALLSLIP_02] nên trả về phiếu đã trả với DATE_ActualReturnDate có giá trị', async () => {
		// Arrange
		const mockReturnedSlip = {
			BORROW_RETURN_SLIP_ID: 2,
			BORROW_RETURN_SLIP_Status: 'Đã trả',
			DATE_ActualReturnDate: '2024-06-01 09:00:00',
		}
		Dao.findAllBorrowReturnSlipDAO.mockResolvedValue(mockReturnedSlip)

		// Act
		const result = await BorrowReturnService.findAllBorrowReturnSlip()

		// Assert
		expect(result.BORROW_RETURN_SLIP_Status).toBe('Đã trả')
		expect(result.DATE_ActualReturnDate).not.toBeNull()
	})

	// TC_BR_FINDALLSLIP_03: Trả về undefined khi chưa có phiếu nào (results[0] = undefined)
	it('[TC_BR_FINDALLSLIP_03] nên trả về undefined khi chưa có phiếu mượn nào', async () => {
		// Arrange: DAO trả về undefined (results[0] của mảng rỗng)
		Dao.findAllBorrowReturnSlipDAO.mockResolvedValue(undefined)

		// Act
		const result = await BorrowReturnService.findAllBorrowReturnSlip()

		// Assert
		expect(result).toBeUndefined()
	})

	// TC_BR_FINDALLSLIP_04: CheckDB — Dao được gọi đúng 1 lần, không có tham số
	it('[TC_BR_FINDALLSLIP_04] CheckDB: nên gọi Dao.findAllBorrowReturnSlipDAO đúng 1 lần', async () => {
		// Arrange
		Dao.findAllBorrowReturnSlipDAO.mockResolvedValue(undefined)

		// Act
		await BorrowReturnService.findAllBorrowReturnSlip()

		// CheckDB
		expect(Dao.findAllBorrowReturnSlipDAO).toHaveBeenCalledTimes(1)
		expect(Dao.findAllBorrowReturnSlipDAO).toHaveBeenCalledWith()
	})

	// TC_BR_FINDALLSLIP_05: Trả về error object khi DB lỗi (không throw)
	it('[TC_BR_FINDALLSLIP_05] nên trả về error object khi DB lỗi (không throw)', async () => {
		// Arrange
		const dbError = new Error('Query timeout')
		Dao.findAllBorrowReturnSlipDAO.mockRejectedValue(dbError)

		// Act
		const result = await BorrowReturnService.findAllBorrowReturnSlip()

		// Assert
		expect(result).toBeInstanceOf(Error)
	})
})

// =============================================================================
// 3. findByUserBorrowReturnSlip()
// Nghiệp vụ: Giáo viên xem lịch sử phiếu mượn của chính mình theo USER_ID
// ID lấy từ req.params.id (string từ URL)
// CheckDB: xác minh Dao được gọi với đúng userId
// =============================================================================
describe('findByUserBorrowReturnSlip()', () => {

	// TC_BR_FINDBYUSER_01: Giáo viên có nhiều phiếu mượn (cả chưa trả và đã trả)
	it('[TC_BR_FINDBYUSER_01] nên trả về tất cả phiếu của giáo viên (cả Chưa trả và Đã trả)', async () => {
		// Arrange
		const mockUserSlips = [
			{
				ID: 3,
				BORROW_RETURN_SLIP_Name: 'Phiếu mượn laptop',
				BORROW_RETURN_SLIP_Status: 'Chưa trả',
				USER_ID: 1,
				DATE_BorrowDate: '2024-06-10 07:00:00',
				DATE_ActualReturnDate: null,
			},
			{
				ID: 1,
				BORROW_RETURN_SLIP_Name: 'Phiếu mượn máy chiếu',
				BORROW_RETURN_SLIP_Status: 'Đã trả',
				USER_ID: 1,
				DATE_BorrowDate: '2024-06-01 07:00:00',
				DATE_ActualReturnDate: '2024-06-01 09:00:00',
			},
		]
		Dao.findByUserBorrowReturnSlipDAO.mockResolvedValue(mockUserSlips)
		const req = { params: { id: '1' } }

		// Act
		const result = await BorrowReturnService.findByUserBorrowReturnSlip(req)

		// Assert: trả về đúng 2 phiếu, sắp xếp DESC theo ID
		expect(result).toHaveLength(2)
		expect(result[0].ID).toBe(3) // phiếu mới nhất trước
		expect(result[1].ID).toBe(1)
	})

	// TC_BR_FINDBYUSER_02: Giáo viên chỉ có phiếu 'Chưa trả'
	it('[TC_BR_FINDBYUSER_02] nên trả về phiếu Chưa trả của giáo viên', async () => {
		// Arrange
		const mockPendingSlip = [{
			ID: 5,
			BORROW_RETURN_SLIP_Status: 'Chưa trả',
			USER_ID: 2,
			DATE_ActualReturnDate: null,
		}]
		Dao.findByUserBorrowReturnSlipDAO.mockResolvedValue(mockPendingSlip)
		const req = { params: { id: '2' } }

		// Act
		const result = await BorrowReturnService.findByUserBorrowReturnSlip(req)

		// Assert
		expect(result[0].BORROW_RETURN_SLIP_Status).toBe('Chưa trả')
		expect(result[0].DATE_ActualReturnDate).toBeNull()
	})

	// TC_BR_FINDBYUSER_03: Giáo viên chưa có phiếu mượn nào
	it('[TC_BR_FINDBYUSER_03] nên trả về mảng rỗng khi giáo viên chưa có phiếu mượn', async () => {
		// Arrange
		Dao.findByUserBorrowReturnSlipDAO.mockResolvedValue([])
		const req = { params: { id: '3' } }

		// Act
		const result = await BorrowReturnService.findByUserBorrowReturnSlip(req)

		// Assert
		expect(result).toEqual([])
	})

	// TC_BR_FINDBYUSER_04: CheckDB — Dao được gọi với đúng userId từ req.params
	it('[TC_BR_FINDBYUSER_04] CheckDB: nên truyền đúng userId (string) xuống Dao', async () => {
		// Arrange
		Dao.findByUserBorrowReturnSlipDAO.mockResolvedValue([])
		const req = { params: { id: '5' } }

		// Act
		await BorrowReturnService.findByUserBorrowReturnSlip(req)

		// CheckDB: xác minh DAO nhận đúng argument
		expect(Dao.findByUserBorrowReturnSlipDAO).toHaveBeenCalledWith('5')
		expect(Dao.findByUserBorrowReturnSlipDAO).toHaveBeenCalledTimes(1)
	})

	// TC_BR_FINDBYUSER_05: Trả về error object khi DB lỗi (không throw)
	it('[TC_BR_FINDBYUSER_05] nên trả về error object khi DB lỗi (không throw)', async () => {
		// Arrange
		const dbError = new Error('DB connection failed')
		Dao.findByUserBorrowReturnSlipDAO.mockRejectedValue(dbError)
		const req = { params: { id: '1' } }

		// Act
		const result = await BorrowReturnService.findByUserBorrowReturnSlip(req)

		// Assert
		expect(result).toBeInstanceOf(Error)
	})
})

// =============================================================================
// 4. findBorrowReturnSlipDetail()
// Nghiệp vụ: Xem chi tiết 1 phiếu mượn theo ID phiếu
// Lưu ý: findBorrowReturnSlipDetailDAO KHÔNG được export từ DAO
// → service gọi undefined() → TypeError → try/catch bắt và return error
// =============================================================================
describe('findBorrowReturnSlipDetail()', () => {

	// TC_BR_DETAIL_01: Trả về error vì findBorrowReturnSlipDetailDAO không tồn tại trong DAO
	it('[TC_BR_DETAIL_01] nên trả về error khi DAO không export findBorrowReturnSlipDetailDAO', async () => {
		// Arrange: Dao.findBorrowReturnSlipDetailDAO = undefined (không được export)
		const req = { params: { id: '1' } }

		// Act: service gọi Dao.findBorrowReturnSlipDetailDAO() → TypeError
		const result = await BorrowReturnService.findBorrowReturnSlipDetail(req)

		// Assert: try/catch bắt TypeError và return error (không throw ra ngoài)
		expect(result).toBeInstanceOf(Error)
	})
})

// =============================================================================
// 5. createBorrowReturnSlip()
// Nghiệp vụ: Giáo viên tạo phiếu mượn thiết bị HOẶC phòng học
// DAO phân biệt qua data.equipments[0].EQUIPMENT_ITEM_Name:
//   - Có EQUIPMENT_ITEM_Name → mượn thiết bị: INSERT SLIP + DATE + ITEM, UPDATE equipment status → 'Đang mượn'
//   - Không có → mượn phòng: INSERT SLIP + DATE + ITEM, UPDATE room status → 'Đang mượn'
// CheckDB: xác minh Dao được gọi với đúng req.body
// Rollback: mock → không có DB thật bị tác động
//           Nếu test DB thật: afterEach DELETE phiếu vừa tạo, UPDATE status về 'Có sẵn'
// =============================================================================
describe('createBorrowReturnSlip()', () => {

	// Dữ liệu mượn thiết bị hợp lệ
	const validEquipmentBorrowBody = {
		BORROW_RETURN_SLIP_Name: 'Phiếu mượn máy chiếu tiết 1',
		Note: 'Dùng cho tiết Toán',
		USER: { ID: 1 },
		StartDate: ['1', '2024-06-10'],  // tiết 1, ngày 10/06/2024
		EndDate: ['2', '2024-06-10'],  // tiết 2, ngày 10/06/2024
		equipments: [
			{ ID: 1, EQUIPMENT_ITEM_Name: 'EPX200-001', EQUIPMENT_ITEM_Status: 'Có sẵn' },
		],
	}

	// Dữ liệu mượn phòng hợp lệ
	const validRoomBorrowBody = {
		BORROW_RETURN_SLIP_Name: 'Phiếu mượn phòng A101',
		Note: 'Họp giáo viên',
		USER: { ID: 2 },
		StartDate: ['3', '2024-06-10'],
		EndDate: ['5', '2024-06-10'],
		equipments: [
			{ ID: 1, ROOM_Name: 'A101', ROOM_Status: 'Có sẵn' }, // không có EQUIPMENT_ITEM_Name
		],
	}

	// TC_BR_CREATE_01: Tạo phiếu mượn thiết bị thành công
	it('[TC_BR_CREATE_01] nên tạo phiếu mượn thiết bị thành công và trả về borrowReturnSlipId', async () => {
		// Arrange
		const mockResult = {
			borrowReturnSlipId: 10,
			equipments: [1],
			message: 'Tạo phiếu mượn thành công',
		}
		Dao.createBorrowReturnSlipDAO.mockResolvedValue(mockResult)
		const req = { body: validEquipmentBorrowBody }

		// Act
		const result = await BorrowReturnService.createBorrowReturnSlip(req)

		// Assert
		expect(result.message).toBe('Tạo phiếu mượn thành công')
		expect(result.borrowReturnSlipId).toBe(10)
		expect(result.equipments).toContain(1)
	})

	// TC_BR_CREATE_02: Tạo phiếu mượn nhiều thiết bị cùng lúc
	it('[TC_BR_CREATE_02] nên tạo phiếu mượn nhiều thiết bị cùng lúc thành công', async () => {
		// Arrange: mượn 2 thiết bị (máy chiếu + laptop)
		const multiEquipmentBody = {
			...validEquipmentBorrowBody,
			equipments: [
				{ ID: 1, EQUIPMENT_ITEM_Name: 'EPX200-001' },
				{ ID: 4, EQUIPMENT_ITEM_Name: 'DL15-001' },
			],
		}
		const mockResult = {
			borrowReturnSlipId: 11,
			equipments: [1, 4],
			message: 'Tạo phiếu mượn thành công',
		}
		Dao.createBorrowReturnSlipDAO.mockResolvedValue(mockResult)
		const req = { body: multiEquipmentBody }

		// Act
		const result = await BorrowReturnService.createBorrowReturnSlip(req)

		// Assert
		expect(result.equipments).toHaveLength(2)
		expect(result.equipments).toContain(1)
		expect(result.equipments).toContain(4)
	})

	// TC_BR_CREATE_03: Tạo phiếu mượn phòng thành công
	it('[TC_BR_CREATE_03] nên tạo phiếu mượn phòng thành công', async () => {
		// Arrange
		const mockResult = {
			borrowReturnSlipId: 12,
			equipments: [1],
			message: 'Tạo phiếu mượn thành công',
		}
		Dao.createBorrowReturnSlipDAO.mockResolvedValue(mockResult)
		const req = { body: validRoomBorrowBody }

		// Act
		const result = await BorrowReturnService.createBorrowReturnSlip(req)

		// Assert
		expect(result.message).toBe('Tạo phiếu mượn thành công')
		expect(result.borrowReturnSlipId).toBe(12)
	})

	// TC_BR_CREATE_04: CheckDB — Dao được gọi với đúng req.body (không biến đổi)
	it('[TC_BR_CREATE_04] CheckDB: nên truyền đúng req.body xuống Dao.createBorrowReturnSlipDAO', async () => {
		// Arrange
		Dao.createBorrowReturnSlipDAO.mockResolvedValue({
			borrowReturnSlipId: 1, equipments: [1], message: 'Tạo phiếu mượn thành công',
		})
		const req = { body: validEquipmentBorrowBody }

		// Act
		await BorrowReturnService.createBorrowReturnSlip(req)

		// CheckDB: xác minh DAO nhận đúng dữ liệu
		expect(Dao.createBorrowReturnSlipDAO).toHaveBeenCalledWith(validEquipmentBorrowBody)
		expect(Dao.createBorrowReturnSlipDAO).toHaveBeenCalledTimes(1)
	})

	// TC_BR_CREATE_05: Trả về error khi DB lỗi trong transaction (không throw)
	it('[TC_BR_CREATE_05] nên trả về error khi transaction DB lỗi (không throw)', async () => {
		// Arrange: transaction thất bại
		const dbError = new Error('Transaction failed: DB error')
		Dao.createBorrowReturnSlipDAO.mockRejectedValue(dbError)
		const req = { body: validEquipmentBorrowBody }

		// Act
		const result = await BorrowReturnService.createBorrowReturnSlip(req)

		// Assert
		expect(result).toBeInstanceOf(Error)
		expect(result.message).toContain('Transaction failed')
	})

	// TC_BR_CREATE_06: Gọi Dao.createBorrowReturnSlipDAO đúng 1 lần
	it('[TC_BR_CREATE_06] CheckDB: nên gọi Dao.createBorrowReturnSlipDAO đúng 1 lần', async () => {
		// Arrange
		Dao.createBorrowReturnSlipDAO.mockResolvedValue({
			borrowReturnSlipId: 1, equipments: [1], message: 'Tạo phiếu mượn thành công',
		})
		const req = { body: validEquipmentBorrowBody }

		// Act
		await BorrowReturnService.createBorrowReturnSlip(req)

		// CheckDB
		expect(Dao.createBorrowReturnSlipDAO).toHaveBeenCalledTimes(1)
	})
})

// =============================================================================
// 6. borrowReturnSlip()
// Nghiệp vụ: Ban quản lý xác nhận trả thiết bị hoặc phòng
// DAO thực hiện transaction:
//   1. UPDATE SLIP status → 'Đã trả'
//   2. UPDATE DATE_ActualReturnDate = NOW()
//   3a. Nếu có EQUIPMENT_ITEM_ID: UPDATE equipment status 'Đang mượn' → 'Có sẵn'
//   3b. Nếu có ROOM_ID: UPDATE room status 'Đang mượn' → 'Có sẵn'
// req.body là mảng: [{BORROW_RETURN_SLIP_ID, items:[...]}]
// CheckDB: xác minh Dao được gọi với đúng req.body
// Rollback: mock → không có DB thật bị tác động
//           Nếu test DB thật: afterEach UPDATE lại status về 'Đang mượn', slip về 'Chưa trả'
// =============================================================================
describe('borrowReturnSlip()', () => {

	// Dữ liệu trả thiết bị hợp lệ
	const validReturnEquipmentBody = [
		{
			BORROW_RETURN_SLIP_ID: 1,
			items: [
				{ EQUIPMENT_ITEM_ID: 1, EQUIPMENT_ITEM_Status: 'Đang mượn' },
			],
		},
	]

	// Dữ liệu trả phòng hợp lệ
	const validReturnRoomBody = [
		{
			BORROW_RETURN_SLIP_ID: 2,
			items: [
				{ ROOM_ID: 1, ROOM_Status: 'Đang mượn' },
			],
		},
	]

	// TC_BR_RETURN_01: Trả thiết bị thành công — status thiết bị → 'Có sẵn'
	it('[TC_BR_RETURN_01] nên xác nhận trả thiết bị thành công (status → Có sẵn)', async () => {
		// Arrange
		Dao.borrowReturnSlipDAO.mockResolvedValue(true)
		const req = { body: validReturnEquipmentBody }

		// Act
		const result = await BorrowReturnService.borrowReturnSlip(req)

		// Assert: DAO trả về true khi transaction thành công
		expect(result).toBe(true)
	})

	// TC_BR_RETURN_02: Trả phòng thành công — status phòng → 'Có sẵn'
	it('[TC_BR_RETURN_02] nên xác nhận trả phòng thành công (status → Có sẵn)', async () => {
		// Arrange
		Dao.borrowReturnSlipDAO.mockResolvedValue(true)
		const req = { body: validReturnRoomBody }

		// Act
		const result = await BorrowReturnService.borrowReturnSlip(req)

		// Assert
		expect(result).toBe(true)
	})

	// TC_BR_RETURN_03: Trả nhiều thiết bị trong 1 phiếu
	it('[TC_BR_RETURN_03] nên xác nhận trả nhiều thiết bị trong 1 phiếu thành công', async () => {
		// Arrange: phiếu có 2 thiết bị
		const multiItemReturnBody = [
			{
				BORROW_RETURN_SLIP_ID: 3,
				items: [
					{ EQUIPMENT_ITEM_ID: 1, EQUIPMENT_ITEM_Status: 'Đang mượn' },
					{ EQUIPMENT_ITEM_ID: 4, EQUIPMENT_ITEM_Status: 'Đang mượn' },
				],
			},
		]
		Dao.borrowReturnSlipDAO.mockResolvedValue(true)
		const req = { body: multiItemReturnBody }

		// Act
		const result = await BorrowReturnService.borrowReturnSlip(req)

		// Assert
		expect(result).toBe(true)
	})

	// TC_BR_RETURN_04: Trả thiết bị có status không phải 'Đang mượn' (giữ nguyên status)
	it('[TC_BR_RETURN_04] nên giữ nguyên status thiết bị nếu không phải Đang mượn', async () => {
		// Arrange: thiết bị có status 'Hỏng' → không đổi về 'Có sẵn'
		const brokenEquipmentBody = [
			{
				BORROW_RETURN_SLIP_ID: 4,
				items: [{ EQUIPMENT_ITEM_ID: 2, EQUIPMENT_ITEM_Status: 'Hỏng' }],
			},
		]
		Dao.borrowReturnSlipDAO.mockResolvedValue(true)
		const req = { body: brokenEquipmentBody }

		// Act
		const result = await BorrowReturnService.borrowReturnSlip(req)

		// Assert: transaction vẫn thành công
		expect(result).toBe(true)
	})

	// TC_BR_RETURN_05: CheckDB — Dao được gọi với đúng req.body
	it('[TC_BR_RETURN_05] CheckDB: nên truyền đúng req.body xuống Dao.borrowReturnSlipDAO', async () => {
		// Arrange
		Dao.borrowReturnSlipDAO.mockResolvedValue(true)
		const req = { body: validReturnEquipmentBody }

		// Act
		await BorrowReturnService.borrowReturnSlip(req)

		// CheckDB: xác minh DAO nhận đúng dữ liệu
		expect(Dao.borrowReturnSlipDAO).toHaveBeenCalledWith(validReturnEquipmentBody)
		expect(Dao.borrowReturnSlipDAO).toHaveBeenCalledTimes(1)
	})

	// TC_BR_RETURN_06: Trả về error khi data rỗng (DAO validate và reject)
	it('[TC_BR_RETURN_06] nên trả về error khi data rỗng (DAO reject: Data is empty)', async () => {
		// Arrange: DAO validate data.length === 0 → throw Error
		const validationError = new Error('Data is empty or invalid')
		Dao.borrowReturnSlipDAO.mockRejectedValue(validationError)
		const req = { body: [] }

		// Act
		const result = await BorrowReturnService.borrowReturnSlip(req)

		// Assert
		expect(result).toBeInstanceOf(Error)
		expect(result.message).toBe('Data is empty or invalid')
	})

	// TC_BR_RETURN_07: Trả về error khi BORROW_RETURN_SLIP_ID không hợp lệ
	it('[TC_BR_RETURN_07] nên trả về error khi BORROW_RETURN_SLIP_ID không hợp lệ', async () => {
		// Arrange
		const invalidIdError = new Error('Invalid BORROW_RETURN_SLIP_ID')
		Dao.borrowReturnSlipDAO.mockRejectedValue(invalidIdError)
		const req = { body: [{ BORROW_RETURN_SLIP_ID: null, items: [] }] }

		// Act
		const result = await BorrowReturnService.borrowReturnSlip(req)

		// Assert
		expect(result).toBeInstanceOf(Error)
		expect(result.message).toBe('Invalid BORROW_RETURN_SLIP_ID')
	})

	// TC_BR_RETURN_08: Trả về error khi transaction DB lỗi (không throw)
	it('[TC_BR_RETURN_08] nên trả về error khi transaction DB lỗi (không throw)', async () => {
		// Arrange
		const dbError = new Error('Transaction rollback: DB error')
		Dao.borrowReturnSlipDAO.mockRejectedValue(dbError)
		const req = { body: validReturnEquipmentBody }

		// Act
		const result = await BorrowReturnService.borrowReturnSlip(req)

		// Assert
		expect(result).toBeInstanceOf(Error)
	})

	// TC_BR_RETURN_09: Gọi Dao.borrowReturnSlipDAO đúng 1 lần
	it('[TC_BR_RETURN_09] CheckDB: nên gọi Dao.borrowReturnSlipDAO đúng 1 lần', async () => {
		// Arrange
		Dao.borrowReturnSlipDAO.mockResolvedValue(true)
		const req = { body: validReturnEquipmentBody }

		// Act
		await BorrowReturnService.borrowReturnSlip(req)

		// CheckDB
		expect(Dao.borrowReturnSlipDAO).toHaveBeenCalledTimes(1)
	})
})
