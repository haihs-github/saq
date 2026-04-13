/**
 * Unit Test Script: request.service.js
 * File được test: backend/src/module/request/request.service.js
 *
 * Nghiệp vụ hệ thống:
 *   - Giáo viên tạo phiếu yêu cầu mua sắm thiết bị mới (requestSlip)
 *   - Ban quản lý / Ban giám hiệu xem danh sách phiếu (getRequestSlip)
 *   - Ban quản lý / Ban giám hiệu phê duyệt hoặc từ chối phiếu (approvedSlip)
 *   - Status phiếu: 'Chưa duyệt' → 'Đã duyệt' hoặc 'Từ chối'
 *   - Khi duyệt có items: EQUIPMENT_ITEM_Status → 'Có sẵn' (theo tên thiết bị)
 *
 * Chiến lược:
 *   - Mock configDB TRƯỚC TIÊN để chặn mysql2 kết nối DB thật
 *   - Mock toàn bộ DAO layer (request.dao.js)
 *   - CheckDB: xác minh DAO được gọi đúng tham số, đúng số lần
 *   - Rollback: jest.clearAllMocks() trong beforeEach — mock hoàn toàn,
 *               không có DB thật bị tác động
 *               Nếu test DB thật: afterEach DELETE phiếu vừa tạo / UPDATE lại status cũ
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
// Mọi thay đổi/truy cập DB đều đi qua mock này → không có DB thật bị tác động
jest.mock('../../module/request/request.dao')
const Dao = require('../../module/request/request.dao')

// ─── Mock dotenv ──────────────────────────────────────────────────────────────
jest.mock('dotenv', () => ({ config: jest.fn() }))

// ─── Import service cần test ──────────────────────────────────────────────────
const RequestService = require('../../module/request/request.service')

// ─── Setup chung ─────────────────────────────────────────────────────────────
beforeEach(() => {
	// Rollback: xóa toàn bộ mock state sau mỗi test → trạng thái sạch
	jest.clearAllMocks()
})

// =============================================================================
// 1. requestSlip()
// Nghiệp vụ: Giáo viên tạo phiếu yêu cầu mua sắm thiết bị mới
// DAO transaction: INSERT REQUEST_SLIP (status='Chưa duyệt') + INSERT REQUEST_ITEM(s)
// CheckDB: xác minh Dao.requestSlip được gọi với đúng req.body
// Rollback: mock → không có DB thật bị tác động
//           Nếu test DB thật: afterEach DELETE FROM REQUEST_SLIP WHERE ID = slipId
// =============================================================================
describe('requestSlip()', () => {

	// Dữ liệu phiếu yêu cầu có items hợp lệ
	const validSlipWithItemsBody = {
		REQUEST_SLIP_Name: 'Yêu cầu mua máy chiếu',
		REQUEST_SLIP_Note: 'Phòng A101 cần thêm máy chiếu',
		USER_ID: 1,
		items: [
			{
				ID: null,
				EQUIPMENT_ITEM_Name: 'Máy chiếu Epson',
				EQUIPMENT_ITEM_Description: 'Máy chiếu 4K',
				EQUIPMENT_TYPE_Name: 'Projector',
				EQUIPMENT_ITEM_Status: 'Chưa có',
				REQUEST_ITEM_Status: 'Chờ duyệt',
			},
		],
	}

	// Dữ liệu phiếu yêu cầu không có items
	const validSlipNoItemsBody = {
		REQUEST_SLIP_Name: 'Yêu cầu khẩn',
		REQUEST_SLIP_Note: 'Cần thiết bị gấp',
		USER_ID: 2,
		items: [],
	}

	// TC_REQ_CREATE_01: Tạo phiếu yêu cầu thành công với danh sách thiết bị
	it('[TC_REQ_CREATE_01] nên tạo phiếu yêu cầu thành công với items và trả về slipId', async () => {
		// Arrange
		Dao.requestSlip.mockResolvedValue({ slipId: 5 })
		const req = { body: validSlipWithItemsBody }

		// Act
		const result = await RequestService.requestSlip(req)

		// Assert
		expect(result).toEqual({ slipId: 5 })
		expect(result.slipId).toBe(5)
	})

	// TC_REQ_CREATE_02: Tạo phiếu yêu cầu với nhiều thiết bị cần mua
	it('[TC_REQ_CREATE_02] nên tạo phiếu yêu cầu thành công với nhiều items', async () => {
		// Arrange: phiếu có 3 thiết bị cần mua
		const multiItemBody = {
			REQUEST_SLIP_Name: 'Yêu cầu mua thiết bị phòng lab',
			USER_ID: 1,
			items: [
				{ EQUIPMENT_ITEM_Name: 'Laptop Dell', EQUIPMENT_TYPE_Name: 'Laptop' },
				{ EQUIPMENT_ITEM_Name: 'Loa JBL', EQUIPMENT_TYPE_Name: 'Speaker' },
				{ EQUIPMENT_ITEM_Name: 'Máy chiếu', EQUIPMENT_TYPE_Name: 'Projector' },
			],
		}
		Dao.requestSlip.mockResolvedValue({ slipId: 6 })
		const req = { body: multiItemBody }

		// Act
		const result = await RequestService.requestSlip(req)

		// Assert
		expect(result.slipId).toBe(6)
	})

	// TC_REQ_CREATE_03: Tạo phiếu yêu cầu không có items (chỉ có thông tin phiếu)
	it('[TC_REQ_CREATE_03] nên tạo phiếu yêu cầu thành công khi items rỗng (DAO commit ngay)', async () => {
		// Arrange: items = [] → DAO commit ngay sau INSERT SLIP
		Dao.requestSlip.mockResolvedValue({ slipId: 7 })
		const req = { body: validSlipNoItemsBody }

		// Act
		const result = await RequestService.requestSlip(req)

		// Assert
		expect(result.slipId).toBe(7)
	})

	// TC_REQ_CREATE_04: Phiếu được tạo với status mặc định 'Chưa duyệt' (hardcode trong DAO)
	it('[TC_REQ_CREATE_04] nên tạo phiếu với status Chưa duyệt (DAO hardcode, không nhận từ client)', async () => {
		// Arrange: client không truyền status → DAO tự đặt 'Chưa duyệt'
		Dao.requestSlip.mockResolvedValue({ slipId: 8 })
		const req = { body: { REQUEST_SLIP_Name: 'Yêu cầu mới', USER_ID: 1, items: [] } }

		// Act
		const result = await RequestService.requestSlip(req)

		// Assert: service trả về slipId, không trả về status (status do DAO xử lý)
		expect(result).toHaveProperty('slipId')
	})

	// TC_REQ_CREATE_05: Mỗi lần tạo phiếu trả về slipId khác nhau
	it('[TC_REQ_CREATE_05] nên trả về slipId khác nhau cho mỗi lần tạo phiếu', async () => {
		// Arrange: 2 lần gọi trả về slipId khác nhau
		Dao.requestSlip
			.mockResolvedValueOnce({ slipId: 5 })
			.mockResolvedValueOnce({ slipId: 6 })
		const req = { body: validSlipNoItemsBody }

		// Act
		const result1 = await RequestService.requestSlip(req)
		const result2 = await RequestService.requestSlip(req)

		// Assert: mỗi phiếu có ID riêng
		expect(result1.slipId).toBe(5)
		expect(result2.slipId).toBe(6)
		expect(result1.slipId).not.toBe(result2.slipId)
	})

	// TC_REQ_CREATE_06: CheckDB — Dao.requestSlip được gọi với đúng req.body
	it('[TC_REQ_CREATE_06] CheckDB: nên truyền đúng req.body xuống Dao.requestSlip (không biến đổi)', async () => {
		// Arrange
		Dao.requestSlip.mockResolvedValue({ slipId: 1 })
		const req = { body: validSlipWithItemsBody }

		// Act
		await RequestService.requestSlip(req)

		// CheckDB: xác minh DAO nhận đúng dữ liệu
		expect(Dao.requestSlip).toHaveBeenCalledWith(validSlipWithItemsBody)
		expect(Dao.requestSlip).toHaveBeenCalledTimes(1)
	})

	// TC_REQ_CREATE_07: CheckDB — Dao.requestSlip được gọi đúng 1 lần
	it('[TC_REQ_CREATE_07] CheckDB: nên gọi Dao.requestSlip đúng 1 lần', async () => {
		// Arrange
		Dao.requestSlip.mockResolvedValue({ slipId: 1 })
		const req = { body: validSlipNoItemsBody }

		// Act
		await RequestService.requestSlip(req)

		// CheckDB
		expect(Dao.requestSlip).toHaveBeenCalledTimes(1)
	})

	// TC_REQ_CREATE_08: Trả về error khi transaction INSERT REQUEST_SLIP thất bại
	it('[TC_REQ_CREATE_08] nên trả về error khi transaction INSERT SLIP thất bại (không throw)', async () => {
		// Arrange: transaction rollback ở bước INSERT SLIP
		const transactionError = new Error('Transaction failed: INSERT SLIP error')
		Dao.requestSlip.mockRejectedValue(transactionError)
		const req = { body: validSlipWithItemsBody }

		// Act
		const result = await RequestService.requestSlip(req)

		// Assert: service bắt lỗi bằng try/catch và return error
		expect(result).toBeInstanceOf(Error)
		expect(result.message).toContain('INSERT SLIP error')
	})

	// TC_REQ_CREATE_09: Trả về error khi transaction INSERT REQUEST_ITEM thất bại
	it('[TC_REQ_CREATE_09] nên trả về error khi transaction INSERT ITEM thất bại (không throw)', async () => {
		// Arrange: transaction rollback ở bước INSERT ITEM
		const itemError = new Error('Transaction failed: INSERT ITEM error')
		Dao.requestSlip.mockRejectedValue(itemError)
		const req = { body: validSlipWithItemsBody }

		// Act
		const result = await RequestService.requestSlip(req)

		// Assert
		expect(result).toBeInstanceOf(Error)
		expect(result.message).toContain('INSERT ITEM error')
	})

	// TC_REQ_CREATE_10: Trả về error khi DB mất kết nối (không throw)
	it('[TC_REQ_CREATE_10] nên trả về error khi DB mất kết nối (không throw)', async () => {
		// Arrange
		const dbError = new Error('ECONNREFUSED: DB connection refused')
		Dao.requestSlip.mockRejectedValue(dbError)
		const req = { body: validSlipNoItemsBody }

		// Act
		const result = await RequestService.requestSlip(req)

		// Assert
		expect(result).toBeInstanceOf(Error)
		expect(result.message).toContain('ECONNREFUSED')
	})

	// TC_REQ_CREATE_11: slipId trả về là số nguyên dương
	it('[TC_REQ_CREATE_11] nên trả về slipId là số nguyên dương', async () => {
		// Arrange
		Dao.requestSlip.mockResolvedValue({ slipId: 99 })
		const req = { body: validSlipNoItemsBody }

		// Act
		const result = await RequestService.requestSlip(req)

		// Assert
		expect(result.slipId).toBe(99)
		expect(typeof result.slipId).toBe('number')
		expect(result.slipId).toBeGreaterThan(0)
	})
})

// =============================================================================
// 2. getRequestSlip()
// Nghiệp vụ: Ban quản lý / Ban giám hiệu xem danh sách tất cả phiếu yêu cầu
// JOIN 3 bảng: REQUEST_SLIP + REQUEST_ITEM + USER, sắp xếp theo ngày tạo DESC
// Lưu ý: getAllRequestSlip trong DAO không nhận tham số (bỏ qua req.body)
// CheckDB: xác minh Dao.getAllRequestSlip được gọi đúng 1 lần
// Rollback: mock → không có DB thật bị tác động
// =============================================================================
describe('getRequestSlip()', () => {

	// TC_REQ_GETALL_01: Có nhiều phiếu với đủ 3 trạng thái
	it('[TC_REQ_GETALL_01] nên trả về danh sách phiếu với đủ 3 trạng thái (Chưa duyệt, Đã duyệt, Từ chối)', async () => {
		// Arrange: mock dữ liệu JOIN 3 bảng, sắp xếp DESC theo ngày tạo
		const mockSlips = [
			{
				REQUEST_SLIP_ID: 3,
				REQUEST_SLIP_Name: 'Yêu cầu mới nhất',
				REQUEST_SLIP_Status: 'Chưa duyệt',
				REQUEST_SLIP_ApproveNotes: null,
				USER_FullName: 'Nguyễn Văn Tuấn',
				REQUESTER_ID: 1,
			},
			{
				REQUEST_SLIP_ID: 2,
				REQUEST_SLIP_Name: 'Yêu cầu đã duyệt',
				REQUEST_SLIP_Status: 'Đã duyệt',
				REQUEST_SLIP_ApproveNotes: 'Đồng ý mua thêm thiết bị',
				USER_FullName: 'Lê Đình Hưng',
				REQUESTER_ID: 2,
			},
			{
				REQUEST_SLIP_ID: 1,
				REQUEST_SLIP_Name: 'Yêu cầu bị từ chối',
				REQUEST_SLIP_Status: 'Từ chối',
				REQUEST_SLIP_ApproveNotes: 'Ngân sách không đủ',
				USER_FullName: 'Nguyễn Văn Tuấn',
				REQUESTER_ID: 1,
			},
		]
		Dao.getAllRequestSlip.mockResolvedValue(mockSlips)
		const req = { body: {} }

		// Act
		const result = await RequestService.getRequestSlip(req)

		// Assert: trả về đủ 3 phiếu, sắp xếp mới nhất trước
		expect(result).toHaveLength(3)
		expect(result[0].REQUEST_SLIP_Status).toBe('Chưa duyệt')
		expect(result[1].REQUEST_SLIP_Status).toBe('Đã duyệt')
		expect(result[2].REQUEST_SLIP_Status).toBe('Từ chối')
	})

	// TC_REQ_GETALL_02: Chỉ có phiếu 'Chưa duyệt' (hệ thống mới)
	it('[TC_REQ_GETALL_02] nên trả về danh sách chỉ có phiếu Chưa duyệt khi hệ thống mới', async () => {
		// Arrange
		const mockPendingSlips = [
			{ REQUEST_SLIP_ID: 1, REQUEST_SLIP_Status: 'Chưa duyệt', REQUEST_SLIP_ApproveNotes: null },
		]
		Dao.getAllRequestSlip.mockResolvedValue(mockPendingSlips)
		const req = { body: {} }

		// Act
		const result = await RequestService.getRequestSlip(req)

		// Assert
		expect(result).toHaveLength(1)
		expect(result[0].REQUEST_SLIP_Status).toBe('Chưa duyệt')
	})

	// TC_REQ_GETALL_03: Trả về mảng rỗng khi chưa có phiếu yêu cầu nào
	it('[TC_REQ_GETALL_03] nên trả về mảng rỗng khi chưa có phiếu yêu cầu nào', async () => {
		// Arrange
		Dao.getAllRequestSlip.mockResolvedValue([])
		const req = { body: {} }

		// Act
		const result = await RequestService.getRequestSlip(req)

		// Assert
		expect(result).toEqual([])
		expect(result).toHaveLength(0)
	})

	// TC_REQ_GETALL_04: Trả về đúng cấu trúc dữ liệu JOIN 3 bảng
	it('[TC_REQ_GETALL_04] nên trả về đúng cấu trúc dữ liệu JOIN 3 bảng (SLIP + ITEM + USER)', async () => {
		// Arrange: object đầy đủ field từ 3 bảng
		const mockFullSlip = {
			REQUEST_SLIP_ID: 1,
			REQUEST_SLIP_Name: 'Yêu cầu mua máy chiếu',
			REQUEST_SLIP_RequestDate: '2024-06-01T00:00:00.000Z',
			REQUEST_SLIP_Status: 'Chưa duyệt',
			REQUEST_SLIP_Description: 'Cần thêm máy chiếu',
			REQUEST_SLIP_ApproveNotes: null,
			REQUESTER_ID: 1,
			USER_FullName: 'Nguyễn Văn Tuấn',
			REQUEST_ITEM_ID: 1,
			EQUIPMENT_ITEM_Name: 'Máy chiếu Epson',
			EQUIPMENT_ITEM_Description: 'Máy chiếu 4K',
			EQUIPMENT_TYPE_Name: 'Projector',
			EQUIPMENT_ITEM_Status: 'Chưa có',
			REQUEST_ITEM_Status: 'Chờ duyệt',
		}
		Dao.getAllRequestSlip.mockResolvedValue([mockFullSlip])
		const req = { body: {} }

		// Act
		const result = await RequestService.getRequestSlip(req)

		// Assert: kiểm tra đủ các field quan trọng
		const slip = result[0]
		expect(slip).toHaveProperty('REQUEST_SLIP_ID')
		expect(slip).toHaveProperty('REQUEST_SLIP_Status')
		expect(slip).toHaveProperty('USER_FullName')
		expect(slip).toHaveProperty('EQUIPMENT_ITEM_Name')
		expect(slip).toHaveProperty('REQUEST_ITEM_Status')
	})

	// TC_REQ_GETALL_05: Phiếu 'Chưa duyệt' có REQUEST_SLIP_ApproveNotes = null
	it('[TC_REQ_GETALL_05] nên trả về REQUEST_SLIP_ApproveNotes = null cho phiếu Chưa duyệt', async () => {
		// Arrange: phiếu chưa được xử lý → ApproveNotes chưa có
		const mockPendingSlip = [{
			REQUEST_SLIP_ID: 1,
			REQUEST_SLIP_Status: 'Chưa duyệt',
			REQUEST_SLIP_ApproveNotes: null,
		}]
		Dao.getAllRequestSlip.mockResolvedValue(mockPendingSlip)
		const req = { body: {} }

		// Act
		const result = await RequestService.getRequestSlip(req)

		// Assert
		expect(result[0].REQUEST_SLIP_ApproveNotes).toBeNull()
	})

	// TC_REQ_GETALL_06: Phiếu 'Đã duyệt' có REQUEST_SLIP_ApproveNotes có giá trị
	it('[TC_REQ_GETALL_06] nên trả về REQUEST_SLIP_ApproveNotes có giá trị cho phiếu Đã duyệt', async () => {
		// Arrange
		const mockApprovedSlip = [{
			REQUEST_SLIP_ID: 2,
			REQUEST_SLIP_Status: 'Đã duyệt',
			REQUEST_SLIP_ApproveNotes: 'Đồng ý mua thêm thiết bị',
		}]
		Dao.getAllRequestSlip.mockResolvedValue(mockApprovedSlip)
		const req = { body: {} }

		// Act
		const result = await RequestService.getRequestSlip(req)

		// Assert
		expect(result[0].REQUEST_SLIP_ApproveNotes).toBe('Đồng ý mua thêm thiết bị')
	})

	// TC_REQ_GETALL_07: Phiếu 'Từ chối' có ghi chú lý do từ chối
	it('[TC_REQ_GETALL_07] nên trả về lý do từ chối trong REQUEST_SLIP_ApproveNotes', async () => {
		// Arrange
		const mockRejectedSlip = [{
			REQUEST_SLIP_ID: 3,
			REQUEST_SLIP_Status: 'Từ chối',
			REQUEST_SLIP_ApproveNotes: 'Ngân sách không đủ',
		}]
		Dao.getAllRequestSlip.mockResolvedValue(mockRejectedSlip)
		const req = { body: {} }

		// Act
		const result = await RequestService.getRequestSlip(req)

		// Assert
		expect(result[0].REQUEST_SLIP_Status).toBe('Từ chối')
		expect(result[0].REQUEST_SLIP_ApproveNotes).toBe('Ngân sách không đủ')
	})

	// TC_REQ_GETALL_08: Phiếu có nhiều items → LEFT JOIN tạo nhiều dòng cùng REQUEST_SLIP_ID
	it('[TC_REQ_GETALL_08] nên trả về nhiều dòng cùng REQUEST_SLIP_ID khi phiếu có nhiều items (LEFT JOIN)', async () => {
		// Arrange: 1 phiếu có 2 items → 2 dòng kết quả
		const mockMultiItemSlip = [
			{ REQUEST_SLIP_ID: 1, EQUIPMENT_ITEM_Name: 'Máy chiếu Epson' },
			{ REQUEST_SLIP_ID: 1, EQUIPMENT_ITEM_Name: 'Laptop Dell' },
		]
		Dao.getAllRequestSlip.mockResolvedValue(mockMultiItemSlip)
		const req = { body: {} }

		// Act
		const result = await RequestService.getRequestSlip(req)

		// Assert: 2 dòng cùng REQUEST_SLIP_ID=1
		expect(result).toHaveLength(2)
		expect(result[0].REQUEST_SLIP_ID).toBe(result[1].REQUEST_SLIP_ID)
	})

	// TC_REQ_GETALL_09: CheckDB — Dao.getAllRequestSlip được gọi đúng 1 lần
	it('[TC_REQ_GETALL_09] CheckDB: nên gọi Dao.getAllRequestSlip đúng 1 lần', async () => {
		// Arrange
		Dao.getAllRequestSlip.mockResolvedValue([])
		const req = { body: {} }

		// Act
		await RequestService.getRequestSlip(req)

		// CheckDB: DAO không nhận tham số (bỏ qua req.body)
		expect(Dao.getAllRequestSlip).toHaveBeenCalledTimes(1)
	})

	// TC_REQ_GETALL_10: Trả về error object khi DB mất kết nối (không throw)
	it('[TC_REQ_GETALL_10] nên trả về error object khi DB mất kết nối (không throw)', async () => {
		// Arrange
		const dbError = new Error('ECONNREFUSED: DB connection refused')
		Dao.getAllRequestSlip.mockRejectedValue(dbError)
		const req = { body: {} }

		// Act
		const result = await RequestService.getRequestSlip(req)

		// Assert
		expect(result).toBeInstanceOf(Error)
		expect(result.message).toContain('ECONNREFUSED')
	})

	// TC_REQ_GETALL_11: Trả về error object khi DB timeout (không throw)
	it('[TC_REQ_GETALL_11] nên trả về error object khi DB timeout (không throw)', async () => {
		// Arrange
		const timeoutError = new Error('Query timeout')
		Dao.getAllRequestSlip.mockRejectedValue(timeoutError)
		const req = { body: {} }

		// Act
		const result = await RequestService.getRequestSlip(req)

		// Assert
		expect(result).toBeInstanceOf(Error)
		expect(result.message).toBe('Query timeout')
	})
})

// =============================================================================
// 3. approvedSlip()
// Nghiệp vụ: Ban quản lý / Ban giám hiệu phê duyệt hoặc từ chối phiếu yêu cầu
// DAO transaction:
//   1. UPDATE REQUEST_SLIP: đặt status và ApproveNotes
//   2a. Nếu có items: UPDATE EQUIPMENT_ITEM_Status = 'Có sẵn' theo tên thiết bị
//   2b. Nếu không có items: commit ngay
// CheckDB: xác minh Dao.approvedSlip được gọi với đúng req.body
// Rollback: mock → không có DB thật bị tác động
//           Nếu test DB thật: afterEach UPDATE REQUEST_SLIP SET status='Chưa duyệt'
//                             và UPDATE EQUIPMENT_ITEM SET status về trạng thái cũ
// =============================================================================
describe('approvedSlip()', () => {

	// Dữ liệu phê duyệt có items
	const validApproveWithItemsBody = {
		REQUEST_SLIP_ID: 1,
		REQUEST_SLIP_Status: 'Đã duyệt',
		REQUEST_SLIP_ApproveNotes: 'Đồng ý mua thêm thiết bị',
		items: [
			{ EQUIPMENT_ITEM_Name: 'Máy chiếu Epson' },
		],
	}

	// Dữ liệu từ chối (không có items)
	const validRejectNoItemsBody = {
		REQUEST_SLIP_ID: 2,
		REQUEST_SLIP_Status: 'Từ chối',
		REQUEST_SLIP_ApproveNotes: 'Ngân sách không đủ',
		items: [],
	}

	// TC_REQ_APPROVE_01: Phê duyệt phiếu thành công — status → 'Đã duyệt', thiết bị → 'Có sẵn'
	it('[TC_REQ_APPROVE_01] nên phê duyệt phiếu thành công và cập nhật thiết bị → Có sẵn', async () => {
		// Arrange
		Dao.approvedSlip.mockResolvedValue({ message: 'Duyệt phiếu & cập nhật thiết bị thành công' })
		const req = { body: validApproveWithItemsBody }

		// Act
		const result = await RequestService.approvedSlip(req)

		// Assert
		expect(result.message).toBe('Duyệt phiếu & cập nhật thiết bị thành công')
	})

	// TC_REQ_APPROVE_02: Từ chối phiếu — status → 'Từ chối', ghi lý do, không cập nhật thiết bị
	it('[TC_REQ_APPROVE_02] nên từ chối phiếu thành công với ghi chú lý do (không cập nhật thiết bị)', async () => {
		// Arrange: items rỗng → DAO commit ngay sau UPDATE SLIP
		Dao.approvedSlip.mockResolvedValue({ message: 'Duyệt phiếu (không có item)' })
		const req = { body: validRejectNoItemsBody }

		// Act
		const result = await RequestService.approvedSlip(req)

		// Assert
		expect(result.message).toBe('Duyệt phiếu (không có item)')
	})

	// TC_REQ_APPROVE_03: Phê duyệt phiếu có nhiều thiết bị — tất cả → 'Có sẵn'
	it('[TC_REQ_APPROVE_03] nên phê duyệt phiếu có nhiều thiết bị thành công (tất cả → Có sẵn)', async () => {
		// Arrange: phiếu có 2 thiết bị cần cập nhật status
		const multiItemApproveBody = {
			REQUEST_SLIP_ID: 3,
			REQUEST_SLIP_Status: 'Đã duyệt',
			REQUEST_SLIP_ApproveNotes: 'OK',
			items: [
				{ EQUIPMENT_ITEM_Name: 'Laptop Dell' },
				{ EQUIPMENT_ITEM_Name: 'Loa JBL' },
			],
		}
		Dao.approvedSlip.mockResolvedValue({ message: 'Duyệt phiếu & cập nhật thiết bị thành công' })
		const req = { body: multiItemApproveBody }

		// Act
		const result = await RequestService.approvedSlip(req)

		// Assert
		expect(result.message).toBe('Duyệt phiếu & cập nhật thiết bị thành công')
	})

	// TC_REQ_APPROVE_04: Phê duyệt phiếu không có items — chỉ cập nhật status phiếu
	it('[TC_REQ_APPROVE_04] nên phê duyệt phiếu không có items thành công (chỉ cập nhật status phiếu)', async () => {
		// Arrange: items rỗng → DAO commit ngay sau UPDATE SLIP
		const approveNoItemsBody = {
			REQUEST_SLIP_ID: 4,
			REQUEST_SLIP_Status: 'Đã duyệt',
			REQUEST_SLIP_ApproveNotes: 'Đồng ý',
			items: [],
		}
		Dao.approvedSlip.mockResolvedValue({ message: 'Duyệt phiếu (không có item)' })
		const req = { body: approveNoItemsBody }

		// Act
		const result = await RequestService.approvedSlip(req)

		// Assert
		expect(result.message).toBe('Duyệt phiếu (không có item)')
	})

	// TC_REQ_APPROVE_05: Từ chối với ghi chú lý do chi tiết
	it('[TC_REQ_APPROVE_05] nên từ chối phiếu với ghi chú lý do chi tiết', async () => {
		// Arrange
		const detailedRejectBody = {
			REQUEST_SLIP_ID: 5,
			REQUEST_SLIP_Status: 'Từ chối',
			REQUEST_SLIP_ApproveNotes: 'Thiết bị đã có đủ trong kho, không cần mua thêm',
			items: [],
		}
		Dao.approvedSlip.mockResolvedValue({ message: 'Duyệt phiếu (không có item)' })
		const req = { body: detailedRejectBody }

		// Act
		const result = await RequestService.approvedSlip(req)

		// Assert
		expect(result.message).toBe('Duyệt phiếu (không có item)')
	})

	// TC_REQ_APPROVE_06: Đổi status từ 'Từ chối' → 'Đã duyệt' (xem xét lại)
	it('[TC_REQ_APPROVE_06] nên cho phép đổi status từ Từ chối sang Đã duyệt (xem xét lại)', async () => {
		// Arrange: phiếu đã bị từ chối, nay được duyệt lại
		const reconsiderBody = {
			REQUEST_SLIP_ID: 6,
			REQUEST_SLIP_Status: 'Đã duyệt',
			REQUEST_SLIP_ApproveNotes: 'Xem xét lại, đồng ý',
			items: [],
		}
		Dao.approvedSlip.mockResolvedValue({ message: 'Duyệt phiếu (không có item)' })
		const req = { body: reconsiderBody }

		// Act
		const result = await RequestService.approvedSlip(req)

		// Assert
		expect(result.message).toBe('Duyệt phiếu (không có item)')
	})

	// TC_REQ_APPROVE_07: CheckDB — Dao.approvedSlip được gọi với đúng req.body
	it('[TC_REQ_APPROVE_07] CheckDB: nên truyền đúng req.body xuống Dao.approvedSlip (không biến đổi)', async () => {
		// Arrange
		Dao.approvedSlip.mockResolvedValue({ message: 'Duyệt phiếu (không có item)' })
		const req = { body: validRejectNoItemsBody }

		// Act
		await RequestService.approvedSlip(req)

		// CheckDB: xác minh DAO nhận đúng dữ liệu
		expect(Dao.approvedSlip).toHaveBeenCalledWith(validRejectNoItemsBody)
		expect(Dao.approvedSlip).toHaveBeenCalledTimes(1)
	})

	// TC_REQ_APPROVE_08: CheckDB — Dao.approvedSlip được gọi đúng 1 lần
	it('[TC_REQ_APPROVE_08] CheckDB: nên gọi Dao.approvedSlip đúng 1 lần', async () => {
		// Arrange
		Dao.approvedSlip.mockResolvedValue({ message: 'Duyệt phiếu (không có item)' })
		const req = { body: validRejectNoItemsBody }

		// Act
		await RequestService.approvedSlip(req)

		// CheckDB
		expect(Dao.approvedSlip).toHaveBeenCalledTimes(1)
	})

	// TC_REQ_APPROVE_09: Trả về error khi transaction UPDATE REQUEST_SLIP thất bại
	it('[TC_REQ_APPROVE_09] nên trả về error khi transaction UPDATE SLIP thất bại (không throw)', async () => {
		// Arrange: rollback ở bước UPDATE SLIP
		const slipUpdateError = new Error('Transaction failed: UPDATE SLIP error')
		Dao.approvedSlip.mockRejectedValue(slipUpdateError)
		const req = { body: validApproveWithItemsBody }

		// Act
		const result = await RequestService.approvedSlip(req)

		// Assert
		expect(result).toBeInstanceOf(Error)
		expect(result.message).toContain('UPDATE SLIP error')
	})

	// TC_REQ_APPROVE_10: Trả về error khi transaction UPDATE EQUIPMENT_ITEM thất bại
	it('[TC_REQ_APPROVE_10] nên trả về error khi transaction UPDATE EQUIPMENT_ITEM thất bại (không throw)', async () => {
		// Arrange: rollback ở bước UPDATE ITEM
		const itemUpdateError = new Error('Transaction failed: UPDATE ITEM error')
		Dao.approvedSlip.mockRejectedValue(itemUpdateError)
		const req = { body: validApproveWithItemsBody }

		// Act
		const result = await RequestService.approvedSlip(req)

		// Assert
		expect(result).toBeInstanceOf(Error)
		expect(result.message).toContain('UPDATE ITEM error')
	})

	// TC_REQ_APPROVE_11: Trả về error khi REQUEST_SLIP_ID không tồn tại
	it('[TC_REQ_APPROVE_11] nên trả về error khi REQUEST_SLIP_ID không tồn tại trong DB', async () => {
		// Arrange
		const notFoundError = new Error('Slip ID not found')
		Dao.approvedSlip.mockRejectedValue(notFoundError)
		const req = { body: { ...validRejectNoItemsBody, REQUEST_SLIP_ID: 9999 } }

		// Act
		const result = await RequestService.approvedSlip(req)

		// Assert
		expect(result).toBeInstanceOf(Error)
		expect(result.message).toBe('Slip ID not found')
	})

	// TC_REQ_APPROVE_12: Trả về error khi DB mất kết nối (không throw)
	it('[TC_REQ_APPROVE_12] nên trả về error khi DB mất kết nối (không throw)', async () => {
		// Arrange
		const dbError = new Error('ECONNREFUSED: DB connection refused')
		Dao.approvedSlip.mockRejectedValue(dbError)
		const req = { body: validApproveWithItemsBody }

		// Act
		const result = await RequestService.approvedSlip(req)

		// Assert
		expect(result).toBeInstanceOf(Error)
		expect(result.message).toContain('ECONNREFUSED')
	})
})
