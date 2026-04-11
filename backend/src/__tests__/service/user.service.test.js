/**
 * Unit Test Script: user.service.js
 * File được test: backend/src/module/user/user.service.js
 *
 * Chiến lược:
 *  - Mock toàn bộ Dao layer (user.dao.js) để test service độc lập
 *  - Mock dotenv để kiểm soát process.env.TOKEN
 *  - Không có thay đổi DB thực tế (mock hoàn toàn) → không cần rollback
 *  - CheckDB: xác minh Dao được gọi đúng tham số, đúng số lần
 *  - Rollback: jest.clearAllMocks() trong beforeEach đảm bảo trạng thái sạch
 *
 * Roles thực tế trong hệ thống:
 *   'Giáo viên' | 'Ban giám hiệu' | 'Ban quản lý' | 'Admin'
 * Status hợp lệ: 'Active' | 'Inactive'
 * Token format: {ID}{random20chars}{normalizedRole}
 */

// ─── Mock configDB TRƯỚC TIÊN (phải đứng trước mọi require khác) ─────────────
// Lý do: user.dao.js require configDB ở top-level → mysql2 cố kết nối DB thật
// → gây lỗi "Encoding not recognized" và "Jest environment torn down"
// jest.mock được hoist lên đầu file bởi babel-jest nên luôn chạy trước require
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
jest.mock('../../module/user/user.dao')
const Dao = require('../../module/user/user.dao')

// ─── Mock dotenv để kiểm soát TOKEN ──────────────────────────────────────────
jest.mock('dotenv', () => ({ config: jest.fn() }))

// ─── Import module cần test (sau khi đã mock xong dependencies) ──────────────
const UserService = require('../../module/user/user.service')

// ─── Setup chung ─────────────────────────────────────────────────────────────
beforeEach(() => {
	// Đặt bộ ký tự TOKEN cố định để test token() có thể kiểm tra charset
	process.env.TOKEN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	// Rollback: xóa toàn bộ mock state sau mỗi test → trạng thái sạch
	jest.clearAllMocks()
})

// =============================================================================
// 1. token(length)
// Nghiệp vụ: Tạo chuỗi ngẫu nhiên ghép vào session token (ID + token(20) + role)
// Không truy cập DB → không cần CheckDB / Rollback
// =============================================================================
describe('token(length)', () => {

	// TC_TOKEN_01: Token có đúng độ dài thực tế dùng trong hệ thống (20 ký tự)
	it('[TC_TOKEN_01] nên tạo token có đúng 20 ký tự (độ dài thực tế trong hệ thống)', () => {
		const tokenLength = 20
		const result = UserService.token(tokenLength)
		expect(result).toHaveLength(tokenLength)
	})

	// TC_TOKEN_02: Token có đúng độ dài với giá trị nhỏ
	it('[TC_TOKEN_02] nên tạo token có đúng 5 ký tự', () => {
		const tokenLength = 5
		const result = UserService.token(tokenLength)
		expect(result).toHaveLength(tokenLength)
	})

	// TC_TOKEN_03: Token có đúng độ dài với giá trị lớn
	it('[TC_TOKEN_03] nên tạo token có đúng 100 ký tự', () => {
		const tokenLength = 100
		const result = UserService.token(tokenLength)
		expect(result).toHaveLength(tokenLength)
	})

	// TC_TOKEN_04: Edge case — length = 0 trả về chuỗi rỗng
	it('[TC_TOKEN_04] nên trả về chuỗi rỗng khi length = 0', () => {
		const result = UserService.token(0)
		expect(result).toBe('')
	})

	// TC_TOKEN_05: Tính ngẫu nhiên — 2 token liên tiếp phải khác nhau (bảo mật)
	it('[TC_TOKEN_05] nên tạo 2 token khác nhau khi gọi liên tiếp (tính ngẫu nhiên)', () => {
		const token1 = UserService.token(20)
		const token2 = UserService.token(20)
		// Xác suất trùng nhau cực thấp với 62^20 khả năng
		expect(token1).not.toBe(token2)
	})

	// TC_TOKEN_06: Mỗi ký tự trong token phải thuộc bộ ký tự process.env.TOKEN
	it('[TC_TOKEN_06] nên chỉ chứa ký tự trong bộ ký tự process.env.TOKEN', () => {
		const charset = 'ABCabc123'
		process.env.TOKEN = charset
		const result = UserService.token(50)
		// Kiểm tra từng ký tự đều thuộc charset
		for (const char of result) {
			expect(charset).toContain(char)
		}
	})

	// TC_TOKEN_07: Kiểu dữ liệu trả về phải là string (để ghép chuỗi token)
	it('[TC_TOKEN_07] nên trả về kiểu string', () => {
		const result = UserService.token(10)
		expect(typeof result).toBe('string')
	})

	// TC_TOKEN_08: Biên dưới có nghĩa — length = 1
	it('[TC_TOKEN_08] nên tạo token có đúng 1 ký tự (biên dưới)', () => {
		const result = UserService.token(1)
		expect(result).toHaveLength(1)
	})
})

// =============================================================================
// 2. normalizeRole(role)
// Nghiệp vụ: Xóa whitespace khỏi role trước khi nhúng vào token
// Frontend parse token để xác định quyền → role phải liền mạch
// Không truy cập DB → không cần CheckDB / Rollback
// =============================================================================
describe('normalizeRole(role)', () => {

	// TC_ROLE_01: Role "Giáo viên" — role thực tế trong DB
	it('[TC_ROLE_01] nên normalize "Giáo viên" thành "Giáoviên"', () => {
		const result = UserService.normalizeRole('Giáo viên')
		expect(result).toBe('Giáoviên')
	})

	// TC_ROLE_02: Role "Ban giám hiệu" — role thực tế trong DB
	it('[TC_ROLE_02] nên normalize "Ban giám hiệu" thành "Bangiámhiệu"', () => {
		const result = UserService.normalizeRole('Ban giám hiệu')
		expect(result).toBe('Bangiámhiệu')
	})

	// TC_ROLE_03: Role "Ban quản lý" — role thực tế trong DB
	it('[TC_ROLE_03] nên normalize "Ban quản lý" thành "Banquảnlý"', () => {
		const result = UserService.normalizeRole('Ban quản lý')
		expect(result).toBe('Banquảnlý')
	})

	// TC_ROLE_04: Role "Admin" không có khoảng trắng — giữ nguyên
	it('[TC_ROLE_04] nên giữ nguyên "Admin" (không có khoảng trắng)', () => {
		const result = UserService.normalizeRole('Admin')
		expect(result).toBe('Admin')
	})

	// TC_ROLE_05: Xóa khoảng trắng ở đầu chuỗi (leading spaces)
	it('[TC_ROLE_05] nên xóa khoảng trắng ở đầu chuỗi', () => {
		const result = UserService.normalizeRole('  Giáo viên')
		expect(result).toBe('Giáoviên')
	})

	// TC_ROLE_06: Xóa khoảng trắng ở cuối chuỗi (trailing spaces)
	it('[TC_ROLE_06] nên xóa khoảng trắng ở cuối chuỗi', () => {
		const result = UserService.normalizeRole('Giáo viên  ')
		expect(result).toBe('Giáoviên')
	})

	// TC_ROLE_07: Xóa khoảng trắng ở đầu, giữa và cuối
	it('[TC_ROLE_07] nên xóa khoảng trắng ở đầu, giữa và cuối chuỗi', () => {
		const result = UserService.normalizeRole('  Ban quản lý  ')
		expect(result).toBe('Banquảnlý')
	})

	// TC_ROLE_08: Xóa nhiều khoảng trắng liên tiếp giữa các từ
	it('[TC_ROLE_08] nên xóa nhiều khoảng trắng liên tiếp giữa các từ', () => {
		const result = UserService.normalizeRole('Ban   quản   lý')
		expect(result).toBe('Banquảnlý')
	})

	// TC_ROLE_09: Xóa tab character (\t)
	it('[TC_ROLE_09] nên xóa tab character trong role', () => {
		const result = UserService.normalizeRole('Giáo\tviên')
		expect(result).toBe('Giáoviên')
	})

	// TC_ROLE_10: Xóa newline character (\n)
	it('[TC_ROLE_10] nên xóa newline character trong role', () => {
		const result = UserService.normalizeRole('Giáo\nviên')
		expect(result).toBe('Giáoviên')
	})

	// TC_ROLE_11: Edge case — input toàn khoảng trắng → chuỗi rỗng
	it('[TC_ROLE_11] nên trả về chuỗi rỗng khi input toàn khoảng trắng', () => {
		const result = UserService.normalizeRole('   ')
		expect(result).toBe('')
	})

	// TC_ROLE_12: Edge case — input rỗng → chuỗi rỗng
	it('[TC_ROLE_12] nên trả về chuỗi rỗng khi input rỗng', () => {
		const result = UserService.normalizeRole('')
		expect(result).toBe('')
	})

	// TC_ROLE_13: Chuỗi không có khoảng trắng không bị thay đổi
	it('[TC_ROLE_13] nên không thay đổi chuỗi đã chuẩn (không có khoảng trắng)', () => {
		const result = UserService.normalizeRole('Admin')
		expect(result).toBe('Admin')
	})

	// TC_ROLE_14: Kết quả normalize được nhúng đúng vào cuối token
	it('[TC_ROLE_14] nên nhúng role đã normalize vào cuối token trong findUserNameAndPassword', async () => {
		// Arrange: mock DAO trả về user với role có khoảng trắng
		const mockUser = { ID: 1, USER_Role: 'Giáo viên' }
		Dao.findUserNameAndPassword.mockResolvedValue(mockUser)
		// Dùng charset chỉ có 1 ký tự để phần random dễ kiểm tra
		process.env.TOKEN = 'A'
		const req = { body: { userName: 'nguyenvantuan', password: '123456' } }

		// Act
		const result = await UserService.findUserNameAndPassword(req)

		// Assert: token phải kết thúc bằng role đã normalize
		expect(result.token).toMatch(/Giáoviên$/)
	})
})

// =============================================================================
// 3. findAllUser()
// Nghiệp vụ: Admin xem danh sách toàn bộ user (mọi role, mọi status)
// CheckDB: xác minh Dao.findAll được gọi đúng 1 lần, không có tham số
// Rollback: mock → không có DB thật bị tác động
// =============================================================================
describe('findAllUser()', () => {

	// TC_FINDALL_01: Hệ thống có nhiều user với các role khác nhau
	it('[TC_FINDALL_01] nên trả về danh sách user với nhiều role khác nhau', async () => {
		// Arrange: mock dữ liệu 3 role thực tế trong hệ thống
		const mockUsers = [
			{ ID: 1, USER_FullName: 'Nguyễn Văn Tuấn', USER_Role: 'Giáo viên', USER_Status: 'Active' },
			{ ID: 2, USER_FullName: 'Lê Đình Hưng', USER_Role: 'Ban giám hiệu', USER_Status: 'Active' },
			{ ID: 3, USER_FullName: 'Lương Văn Luyện', USER_Role: 'Ban quản lý', USER_Status: 'Active' },
		]
		Dao.findAll.mockResolvedValue(mockUsers)

		// Act
		const result = await UserService.findAllUser()

		// Assert
		expect(result).toEqual(mockUsers)
		expect(result).toHaveLength(3)
	})

	// TC_FINDALL_02: Danh sách bao gồm cả user Active và Inactive (không lọc)
	it('[TC_FINDALL_02] nên trả về cả user Active và Inactive (không lọc theo status)', async () => {
		// Arrange
		const mockUsers = [
			{ ID: 1, USER_UserName: 'user1', USER_Status: 'Active' },
			{ ID: 2, USER_UserName: 'user2', USER_Status: 'Inactive' },
		]
		Dao.findAll.mockResolvedValue(mockUsers)

		// Act
		const result = await UserService.findAllUser()

		// Assert: cả 2 user đều có trong kết quả
		expect(result).toHaveLength(2)
		expect(result.some(u => u.USER_Status === 'Active')).toBe(true)
		expect(result.some(u => u.USER_Status === 'Inactive')).toBe(true)
	})

	// TC_FINDALL_03: Hệ thống chỉ có 1 user
	it('[TC_FINDALL_03] nên trả về mảng 1 phần tử khi hệ thống chỉ có 1 user', async () => {
		// Arrange
		const mockUsers = [{ ID: 1, USER_UserName: 'admin', USER_Role: 'Admin' }]
		Dao.findAll.mockResolvedValue(mockUsers)

		// Act
		const result = await UserService.findAllUser()

		// Assert
		expect(result).toHaveLength(1)
		expect(result[0].USER_UserName).toBe('admin')
	})

	// TC_FINDALL_04: Hệ thống chưa có user nào
	it('[TC_FINDALL_04] nên trả về mảng rỗng khi chưa có user nào trong hệ thống', async () => {
		// Arrange
		Dao.findAll.mockResolvedValue([])

		// Act
		const result = await UserService.findAllUser()

		// Assert
		expect(result).toEqual([])
		expect(result).toHaveLength(0)
	})

	// TC_FINDALL_05: Kiểm tra cấu trúc dữ liệu đầy đủ 7 field
	it('[TC_FINDALL_05] nên trả về đúng cấu trúc dữ liệu user với đủ các field', async () => {
		// Arrange
		const mockUser = {
			ID: 1,
			USER_FullName: 'Nguyễn Văn Tuấn',
			USER_Email: 'nguyenvantuan@gmail.com',
			USER_PhoneNumber: '0901234567',
			USER_UserName: 'nguyenvantuan',
			USER_Role: 'Giáo viên',
			USER_Status: 'Active',
		}
		Dao.findAll.mockResolvedValue([mockUser])

		// Act
		const result = await UserService.findAllUser()

		// Assert: kiểm tra đủ 7 field
		const user = result[0]
		expect(user).toHaveProperty('ID')
		expect(user).toHaveProperty('USER_FullName')
		expect(user).toHaveProperty('USER_Email')
		expect(user).toHaveProperty('USER_PhoneNumber')
		expect(user).toHaveProperty('USER_UserName')
		expect(user).toHaveProperty('USER_Role')
		expect(user).toHaveProperty('USER_Status')
	})

	// TC_FINDALL_06: CheckDB — Dao.findAll được gọi đúng 1 lần, không có tham số
	it('[TC_FINDALL_06] CheckDB: nên gọi Dao.findAll đúng 1 lần và không truyền tham số', async () => {
		// Arrange
		Dao.findAll.mockResolvedValue([])

		// Act
		await UserService.findAllUser()

		// CheckDB: xác minh DAO được gọi đúng cách
		expect(Dao.findAll).toHaveBeenCalledTimes(1)
		expect(Dao.findAll).toHaveBeenCalledWith()
	})

	// TC_FINDALL_07: Trả về error object khi DB mất kết nối (không throw ra ngoài)
	it('[TC_FINDALL_07] nên trả về error object khi DB mất kết nối (không throw)', async () => {
		// Arrange
		const dbError = new Error('ECONNREFUSED: DB connection refused')
		Dao.findAll.mockRejectedValue(dbError)

		// Act
		const result = await UserService.findAllUser()

		// Assert: service bắt lỗi bằng try/catch và return error (không throw)
		expect(result).toBeInstanceOf(Error)
		expect(result.message).toContain('ECONNREFUSED')
	})

	// TC_FINDALL_08: Trả về error object khi DB timeout
	it('[TC_FINDALL_08] nên trả về error object khi DB timeout (không throw)', async () => {
		// Arrange
		const timeoutError = new Error('Query timeout')
		Dao.findAll.mockRejectedValue(timeoutError)

		// Act
		const result = await UserService.findAllUser()

		// Assert
		expect(result).toBeInstanceOf(Error)
		expect(result.message).toBe('Query timeout')
	})
})

// =============================================================================
// 4. findOneUser()
// Nghiệp vụ: Admin xem chi tiết 1 user theo ID (từ req.params.id — luôn là string)
// CheckDB: xác minh Dao.findOneUser được gọi với đúng ID
// Rollback: mock → không có DB thật bị tác động
// =============================================================================
describe('findOneUser()', () => {

	// TC_FINDONE_01: Tìm thấy user Giáo viên đang Active
	it('[TC_FINDONE_01] nên trả về user Giáo viên Active khi tìm theo ID hợp lệ', async () => {
		// Arrange
		const mockUser = {
			ID: 1, USER_FullName: 'Nguyễn Văn Tuấn',
			USER_Role: 'Giáo viên', USER_Status: 'Active',
		}
		Dao.findOneUser.mockResolvedValue(mockUser)
		const req = { params: { id: '1' } }

		// Act
		const result = await UserService.findOneUser(req)

		// Assert
		expect(result).toEqual(mockUser)
		expect(result.USER_Status).toBe('Active')
	})

	// TC_FINDONE_02: Tìm thấy user đang Inactive (admin vẫn cần xem)
	it('[TC_FINDONE_02] nên trả về user Inactive (admin cần xem tài khoản bị khóa)', async () => {
		// Arrange
		const mockInactiveUser = { ID: 2, USER_UserName: 'ledinhhung', USER_Status: 'Inactive' }
		Dao.findOneUser.mockResolvedValue(mockInactiveUser)
		const req = { params: { id: '2' } }

		// Act
		const result = await UserService.findOneUser(req)

		// Assert
		expect(result.USER_Status).toBe('Inactive')
		expect(result.ID).toBe(2)
	})

	// TC_FINDONE_03: ID không tồn tại trong DB → trả về undefined
	it('[TC_FINDONE_03] nên trả về undefined khi ID không tồn tại trong DB', async () => {
		// Arrange
		Dao.findOneUser.mockResolvedValue(undefined)
		const req = { params: { id: '9999' } }

		// Act
		const result = await UserService.findOneUser(req)

		// Assert
		expect(result).toBeUndefined()
	})

	// TC_FINDONE_04: CheckDB — Dao.findOneUser được gọi với đúng ID string từ req.params
	it('[TC_FINDONE_04] CheckDB: nên truyền đúng ID (string) xuống Dao.findOneUser', async () => {
		// Arrange
		Dao.findOneUser.mockResolvedValue({ ID: 5 })
		const req = { params: { id: '5' } }

		// Act
		await UserService.findOneUser(req)

		// CheckDB: xác minh DAO nhận đúng argument
		expect(Dao.findOneUser).toHaveBeenCalledWith('5')
		expect(Dao.findOneUser).toHaveBeenCalledTimes(1)
	})

	// TC_FINDONE_05: ID = "1" (biên dưới)
	it('[TC_FINDONE_05] nên tìm được user với ID = "1" (biên dưới)', async () => {
		// Arrange
		const mockUser = { ID: 1, USER_UserName: 'nguyenvantuan' }
		Dao.findOneUser.mockResolvedValue(mockUser)
		const req = { params: { id: '1' } }

		// Act
		const result = await UserService.findOneUser(req)

		// Assert
		expect(result).toBeDefined()
		expect(result.ID).toBe(1)
	})

	// TC_FINDONE_06: Trả về đúng user theo ID, không nhầm lẫn với user khác
	it('[TC_FINDONE_06] nên trả về đúng user theo ID, không nhầm lẫn với user khác', async () => {
		// Arrange
		const mockUser = { ID: 2, USER_UserName: 'ledinhhung', USER_Role: 'Ban giám hiệu' }
		Dao.findOneUser.mockResolvedValue(mockUser)
		const req = { params: { id: '2' } }

		// Act
		const result = await UserService.findOneUser(req)

		// Assert: đúng user ID=2, không phải user khác
		expect(result.ID).toBe(2)
		expect(result.USER_UserName).toBe('ledinhhung')
	})

	// TC_FINDONE_07: Trả về error object khi DB lỗi (không throw)
	it('[TC_FINDONE_07] nên trả về error object khi DB lỗi (không throw)', async () => {
		// Arrange
		const dbError = new Error('DB error')
		Dao.findOneUser.mockRejectedValue(dbError)
		const req = { params: { id: '1' } }

		// Act
		const result = await UserService.findOneUser(req)

		// Assert
		expect(result).toBeInstanceOf(Error)
	})

	// TC_FINDONE_08: CheckDB — Dao.findOneUser được gọi đúng 1 lần
	it('[TC_FINDONE_08] CheckDB: nên gọi Dao.findOneUser đúng 1 lần', async () => {
		// Arrange
		Dao.findOneUser.mockResolvedValue({ ID: 3 })
		const req = { params: { id: '3' } }

		// Act
		await UserService.findOneUser(req)

		// CheckDB
		expect(Dao.findOneUser).toHaveBeenCalledTimes(1)
	})
})

// =============================================================================
// 5. findUserNameAndPassword()
// Nghiệp vụ: Đăng nhập — chỉ user Active mới được đăng nhập
// Token format: {ID}{random20chars}{normalizedRole}
// CheckDB: xác minh Dao được gọi với đúng {table, userName, password}
// Rollback: mock → không có DB thật bị tác động
// =============================================================================
describe('findUserNameAndPassword()', () => {

	// TC_LOGIN_01: Đăng nhập thành công với tài khoản Giáo viên Active
	it('[TC_LOGIN_01] nên trả về token khi đăng nhập thành công với tài khoản Giáo viên', async () => {
		// Arrange
		const mockUser = { ID: 1, USER_Role: 'Giáo viên', USER_Status: 'Active' }
		Dao.findUserNameAndPassword.mockResolvedValue(mockUser)
		const req = { body: { userName: 'nguyenvantuan', password: '123456' } }

		// Act
		const result = await UserService.findUserNameAndPassword(req)

		// Assert: có token, bắt đầu bằng ID, kết thúc bằng role normalize
		expect(result).toHaveProperty('token')
		expect(result.token).toMatch(/^1/)
		expect(result.token).toMatch(/Giáoviên$/)
	})

	// TC_LOGIN_02: Đăng nhập thành công với tài khoản Ban quản lý
	it('[TC_LOGIN_02] nên trả về token với role "Banquảnlý" khi đăng nhập Ban quản lý', async () => {
		// Arrange
		const mockUser = { ID: 3, USER_Role: 'Ban quản lý', USER_Status: 'Active' }
		Dao.findUserNameAndPassword.mockResolvedValue(mockUser)
		const req = { body: { userName: 'luongvanluyen', password: '123456' } }

		// Act
		const result = await UserService.findUserNameAndPassword(req)

		// Assert: role "Ban quản lý" → normalize thành "Banquảnlý"
		expect(result.token).toMatch(/^3/)
		expect(result.token).toMatch(/Banquảnlý$/)
	})

	// TC_LOGIN_03: Đăng nhập thành công với tài khoản Ban giám hiệu
	it('[TC_LOGIN_03] nên trả về token với role "Bangiámhiệu" khi đăng nhập Ban giám hiệu', async () => {
		// Arrange
		const mockUser = { ID: 2, USER_Role: 'Ban giám hiệu', USER_Status: 'Active' }
		Dao.findUserNameAndPassword.mockResolvedValue(mockUser)
		const req = { body: { userName: 'ledinhhung', password: '123456' } }

		// Act
		const result = await UserService.findUserNameAndPassword(req)

		// Assert
		expect(result.token).toMatch(/^2/)
		expect(result.token).toMatch(/Bangiámhiệu$/)
	})

	// TC_LOGIN_04: Token bắt đầu bằng đúng ID của user
	it('[TC_LOGIN_04] nên tạo token bắt đầu bằng đúng ID của user', async () => {
		// Arrange: user có ID=5
		const mockUser = { ID: 5, USER_Role: 'Admin' }
		Dao.findUserNameAndPassword.mockResolvedValue(mockUser)
		const req = { body: { userName: 'admin', password: 'adminpass' } }

		// Act
		const result = await UserService.findUserNameAndPassword(req)

		// Assert: token phải bắt đầu bằng '5'
		expect(result.token.startsWith('5')).toBe(true)
	})

	// TC_LOGIN_05: Phần random giữa token có đúng 20 ký tự
	it('[TC_LOGIN_05] nên tạo phần random 20 ký tự ở giữa token', async () => {
		// Arrange: dùng charset 1 ký tự để dễ tính toán
		process.env.TOKEN = 'X'
		const mockUser = { ID: 1, USER_Role: 'Admin' }
		Dao.findUserNameAndPassword.mockResolvedValue(mockUser)
		const req = { body: { userName: 'admin', password: 'pass' } }

		// Act
		const result = await UserService.findUserNameAndPassword(req)

		// Assert: token = "1" + "XXXXXXXXXXXXXXXXXXXX"(20) + "Admin"
		// Độ dài = 1(ID) + 20(random) + 5(Admin) = 26
		const idPart = String(mockUser.ID)           // "1"
		const rolePart = 'Admin'                        // không có space
		const randomPart = result.token.slice(idPart.length, result.token.length - rolePart.length)
		expect(randomPart).toHaveLength(20)
	})

	// TC_LOGIN_06: Token kết thúc bằng role đã normalize
	it('[TC_LOGIN_06] nên tạo token kết thúc bằng role đã normalize', async () => {
		// Arrange
		const mockUser = { ID: 1, USER_Role: 'Giáo viên' }
		Dao.findUserNameAndPassword.mockResolvedValue(mockUser)
		const req = { body: { userName: 'nguyenvantuan', password: '123456' } }

		// Act
		const result = await UserService.findUserNameAndPassword(req)

		// Assert: "Giáo viên" → "Giáoviên" (xóa space)
		expect(result.token.endsWith('Giáoviên')).toBe(true)
	})

	// TC_LOGIN_07: CheckDB — Dao được gọi với đúng {table, userName, password}
	it('[TC_LOGIN_07] CheckDB: nên gọi Dao với đúng {table, userName, password}', async () => {
		// Arrange
		const mockUser = { ID: 1, USER_Role: 'Admin' }
		Dao.findUserNameAndPassword.mockResolvedValue(mockUser)
		const req = { body: { userName: 'testuser', password: 'testpass' } }

		// Act
		await UserService.findUserNameAndPassword(req)

		// CheckDB: xác minh DAO nhận đúng tham số
		expect(Dao.findUserNameAndPassword).toHaveBeenCalledWith({
			table: 'datn.USER',
			userName: 'testuser',
			password: 'testpass',
		})
		expect(Dao.findUserNameAndPassword).toHaveBeenCalledTimes(1)
	})

	// TC_LOGIN_08: Đăng nhập thất bại khi sai password (DAO trả về undefined)
	it('[TC_LOGIN_08] nên trả về error khi sai password (DAO trả về undefined)', async () => {
		// Arrange: DAO trả về undefined khi không khớp username+password+Active
		Dao.findUserNameAndPassword.mockResolvedValue(undefined)
		const req = { body: { userName: 'nguyenvantuan', password: 'wrongpass' } }

		// Act
		const result = await UserService.findUserNameAndPassword(req)

		// Assert: service bắt TypeError (undefined.ID) và return error
		expect(result).toBeInstanceOf(Error)
	})

	// TC_LOGIN_09: Đăng nhập thất bại khi username không tồn tại
	it('[TC_LOGIN_09] nên trả về error khi username không tồn tại trong hệ thống', async () => {
		// Arrange
		Dao.findUserNameAndPassword.mockResolvedValue(undefined)
		const req = { body: { userName: 'khongtontai', password: '123456' } }

		// Act
		const result = await UserService.findUserNameAndPassword(req)

		// Assert
		expect(result).toBeInstanceOf(Error)
	})

	// TC_LOGIN_10: Đăng nhập thất bại khi tài khoản bị khóa (Inactive)
	it('[TC_LOGIN_10] nên trả về error khi tài khoản bị khóa (Inactive — DAO lọc status=Active)', async () => {
		// Arrange: DAO lọc USER_Status='Active' → user Inactive trả về undefined
		Dao.findUserNameAndPassword.mockResolvedValue(undefined)
		const req = { body: { userName: 'lockeduser', password: '123456' } }

		// Act
		const result = await UserService.findUserNameAndPassword(req)

		// Assert
		expect(result).toBeInstanceOf(Error)
	})

	// TC_LOGIN_11: Đăng nhập thất bại khi cả username và password đều sai
	it('[TC_LOGIN_11] nên trả về error khi cả username và password đều sai', async () => {
		// Arrange
		Dao.findUserNameAndPassword.mockResolvedValue(undefined)
		const req = { body: { userName: 'wrong', password: 'wrong' } }

		// Act
		const result = await UserService.findUserNameAndPassword(req)

		// Assert
		expect(result).toBeInstanceOf(Error)
	})

	// TC_LOGIN_12: Response phải có đúng key 'token'
	it('[TC_LOGIN_12] nên trả về object có property "token"', async () => {
		// Arrange
		Dao.findUserNameAndPassword.mockResolvedValue({ ID: 1, USER_Role: 'Admin' })
		const req = { body: { userName: 'admin', password: 'pass' } }

		// Act
		const result = await UserService.findUserNameAndPassword(req)

		// Assert
		expect(result).toHaveProperty('token')
	})

	// TC_LOGIN_13: Token phải là kiểu string (để lưu vào sessionStorage)
	it('[TC_LOGIN_13] nên trả về token kiểu string (để lưu vào sessionStorage)', async () => {
		// Arrange
		Dao.findUserNameAndPassword.mockResolvedValue({ ID: 1, USER_Role: 'Admin' })
		const req = { body: { userName: 'admin', password: 'pass' } }

		// Act
		const result = await UserService.findUserNameAndPassword(req)

		// Assert
		expect(typeof result.token).toBe('string')
	})

	// TC_LOGIN_14: Trả về error object khi DB lỗi (không throw)
	it('[TC_LOGIN_14] nên trả về error object khi DB lỗi (không throw)', async () => {
		// Arrange
		const dbError = new Error('DB connection failed')
		Dao.findUserNameAndPassword.mockRejectedValue(dbError)
		const req = { body: { userName: 'admin', password: 'pass' } }

		// Act
		const result = await UserService.findUserNameAndPassword(req)

		// Assert
		expect(result).toBeInstanceOf(Error)
		expect(result.message).toBe('DB connection failed')
	})

	// TC_LOGIN_15: 2 lần đăng nhập cùng user tạo token khác nhau (phần random)
	it('[TC_LOGIN_15] nên tạo token khác nhau cho 2 lần đăng nhập cùng user', async () => {
		// Arrange
		const mockUser = { ID: 1, USER_Role: 'Admin' }
		Dao.findUserNameAndPassword.mockResolvedValue(mockUser)
		const req = { body: { userName: 'admin', password: 'pass' } }

		// Act: gọi 2 lần
		const result1 = await UserService.findUserNameAndPassword(req)
		const result2 = await UserService.findUserNameAndPassword(req)

		// Assert: phần random khác nhau → token khác nhau
		expect(result1.token).not.toBe(result2.token)
	})
})

// =============================================================================
// 6. createUser()
// Nghiệp vụ: Admin tạo tài khoản mới — username và email phải duy nhất
// CheckDB: xác minh Dao.createUser được gọi với đúng req.body
// Rollback: mock → không có DB thật bị tác động
//           Nếu test với DB thật: afterEach DELETE FROM USER WHERE ID = insertedId
// =============================================================================
describe('createUser()', () => {

	// Dữ liệu user hợp lệ dùng chung
	const validGiaoVienBody = {
		USER_FullName: 'Trần Thị B',
		USER_Email: 'tranthib@gmail.com',
		USER_PhoneNumber: '0909999999',
		USER_UserName: 'tranthib',
		USER_Password: '123456',
		USER_Role: 'Giáo viên',
		USER_Status: 'Active',
	}

	// TC_CREATE_01: Tạo tài khoản Giáo viên mới thành công
	it('[TC_CREATE_01] nên tạo tài khoản Giáo viên mới thành công và trả về insertId', async () => {
		// Arrange
		Dao.createUser.mockResolvedValue({ id: 4 })
		const req = { body: validGiaoVienBody }

		// Act
		const result = await UserService.createUser(req)

		// Assert
		expect(result).toEqual({ id: 4 })
		expect(result.id).toBe(4)
	})

	// TC_CREATE_02: Tạo tài khoản Ban quản lý thành công
	it('[TC_CREATE_02] nên tạo tài khoản Ban quản lý thành công', async () => {
		// Arrange
		const banQuanLyBody = { ...validGiaoVienBody, USER_Role: 'Ban quản lý', USER_UserName: 'quanly01' }
		Dao.createUser.mockResolvedValue({ id: 5 })
		const req = { body: banQuanLyBody }

		// Act
		const result = await UserService.createUser(req)

		// Assert
		expect(result.id).toBe(5)
	})

	// TC_CREATE_03: Tạo tài khoản Ban giám hiệu thành công
	it('[TC_CREATE_03] nên tạo tài khoản Ban giám hiệu thành công', async () => {
		// Arrange
		const banGiamHieuBody = { ...validGiaoVienBody, USER_Role: 'Ban giám hiệu', USER_UserName: 'giamhieu01' }
		Dao.createUser.mockResolvedValue({ id: 6 })
		const req = { body: banGiamHieuBody }

		// Act
		const result = await UserService.createUser(req)

		// Assert
		expect(result.id).toBe(6)
	})

	// TC_CREATE_04: Tạo tài khoản không truyền USER_Status → DAO xử lý default 'Active'
	it('[TC_CREATE_04] nên tạo tài khoản thành công khi không truyền USER_Status (DAO default Active)', async () => {
		// Arrange: không có USER_Status trong body
		const bodyWithoutStatus = {
			USER_FullName: 'Test User', USER_Email: 'test@test.com',
			USER_UserName: 'testuser', USER_Password: 'pass', USER_Role: 'Giáo viên',
		}
		Dao.createUser.mockResolvedValue({ id: 7 })
		const req = { body: bodyWithoutStatus }

		// Act
		const result = await UserService.createUser(req)

		// Assert: service truyền body xuống DAO, DAO xử lý default
		expect(result.id).toBe(7)
	})

	// TC_CREATE_05: Tạo tài khoản với USER_Status = 'Inactive' (tạo tài khoản bị khóa ngay)
	it('[TC_CREATE_05] nên tạo tài khoản Inactive thành công (admin tạo tài khoản bị khóa)', async () => {
		// Arrange
		const inactiveBody = { ...validGiaoVienBody, USER_Status: 'Inactive', USER_UserName: 'inactive01' }
		Dao.createUser.mockResolvedValue({ id: 8 })
		const req = { body: inactiveBody }

		// Act
		const result = await UserService.createUser(req)

		// Assert
		expect(result.id).toBe(8)
	})

	// TC_CREATE_06: Thất bại khi username đã tồn tại
	it('[TC_CREATE_06] nên trả về error khi username đã tồn tại trong hệ thống', async () => {
		// Arrange: DAO reject vì username trùng
		const duplicateError = { message: 'Username hoặc Email đã tồn tại' }
		Dao.createUser.mockRejectedValue(duplicateError)
		const req = { body: { ...validGiaoVienBody, USER_UserName: 'nguyenvantuan' } }

		// Act
		const result = await UserService.createUser(req)

		// Assert: service bắt lỗi và return
		expect(result).toEqual(duplicateError)
		expect(result.message).toBe('Username hoặc Email đã tồn tại')
	})

	// TC_CREATE_07: Thất bại khi email đã tồn tại
	it('[TC_CREATE_07] nên trả về error khi email đã tồn tại trong hệ thống', async () => {
		// Arrange
		const duplicateError = { message: 'Username hoặc Email đã tồn tại' }
		Dao.createUser.mockRejectedValue(duplicateError)
		const req = { body: { ...validGiaoVienBody, USER_Email: 'guyenvantuan22@gmail.com' } }

		// Act
		const result = await UserService.createUser(req)

		// Assert
		expect(result.message).toBe('Username hoặc Email đã tồn tại')
	})

	// TC_CREATE_08: Thất bại khi cả username và email đều trùng
	it('[TC_CREATE_08] nên trả về error khi cả username và email đều đã tồn tại', async () => {
		// Arrange
		const duplicateError = { message: 'Username hoặc Email đã tồn tại' }
		Dao.createUser.mockRejectedValue(duplicateError)
		const req = {
			body: { ...validGiaoVienBody, USER_UserName: 'nguyenvantuan', USER_Email: 'guyenvantuan22@gmail.com' },
		}

		// Act
		const result = await UserService.createUser(req)

		// Assert
		expect(result.message).toBe('Username hoặc Email đã tồn tại')
	})

	// TC_CREATE_09: CheckDB — Dao.createUser được gọi với đúng req.body (không biến đổi)
	it('[TC_CREATE_09] CheckDB: nên truyền đúng req.body xuống Dao.createUser (không biến đổi)', async () => {
		// Arrange
		Dao.createUser.mockResolvedValue({ id: 10 })
		const req = { body: validGiaoVienBody }

		// Act
		await UserService.createUser(req)

		// CheckDB: xác minh DAO nhận đúng dữ liệu
		expect(Dao.createUser).toHaveBeenCalledWith(validGiaoVienBody)
		expect(Dao.createUser).toHaveBeenCalledTimes(1)
	})

	// TC_CREATE_10: Trả về đúng insertId từ DAO
	it('[TC_CREATE_10] nên trả về đúng insertId từ DAO sau khi tạo thành công', async () => {
		// Arrange
		Dao.createUser.mockResolvedValue({ id: 99 })
		const req = { body: validGiaoVienBody }

		// Act
		const result = await UserService.createUser(req)

		// Assert
		expect(result.id).toBe(99)
	})

	// TC_CREATE_11: CheckDB — Dao.createUser được gọi đúng 1 lần
	it('[TC_CREATE_11] CheckDB: nên gọi Dao.createUser đúng 1 lần', async () => {
		// Arrange
		Dao.createUser.mockResolvedValue({ id: 1 })
		const req = { body: validGiaoVienBody }

		// Act
		await UserService.createUser(req)

		// CheckDB
		expect(Dao.createUser).toHaveBeenCalledTimes(1)
	})

	// TC_CREATE_12: Trả về error object khi DB lỗi (không throw)
	it('[TC_CREATE_12] nên trả về error object khi DB lỗi (không throw)', async () => {
		// Arrange
		const dbError = new Error('DB connection failed')
		Dao.createUser.mockRejectedValue(dbError)
		const req = { body: validGiaoVienBody }

		// Act
		const result = await UserService.createUser(req)

		// Assert
		expect(result).toBeInstanceOf(Error)
		expect(result.message).toBe('DB connection failed')
	})
})

// =============================================================================
// 7. updateUser()
// Nghiệp vụ: Admin cập nhật role/status/password — đổi role ảnh hưởng quyền truy cập
// CheckDB: xác minh Dao.updateUser được gọi với đúng req.body
// Rollback: mock → không có DB thật bị tác động
//           Nếu test với DB thật: afterEach UPDATE lại giá trị cũ
// =============================================================================
describe('updateUser()', () => {

	// Dữ liệu update hợp lệ dùng chung
	const validUpdateBody = {
		ID: 1,
		USER_FullName: 'Nguyễn Văn Tuấn',
		USER_Email: 'nguyenvantuan@gmail.com',
		USER_PhoneNumber: '0901234567',
		USER_UserName: 'nguyenvantuan',
		USER_Password: 'newpass123',
		USER_Role: 'Giáo viên',
		USER_Status: 'Active',
	}

	// TC_UPDATE_01: Cập nhật thông tin cơ bản thành công
	it('[TC_UPDATE_01] nên cập nhật thông tin user thành công', async () => {
		// Arrange
		Dao.updateUser.mockResolvedValue({ message: 'Cập nhật thành công', affectedRows: 1 })
		const req = { body: validUpdateBody }

		// Act
		const result = await UserService.updateUser(req)

		// Assert
		expect(result.message).toBe('Cập nhật thành công')
		expect(result.affectedRows).toBe(1)
	})

	// TC_UPDATE_02: Nâng cấp role từ Giáo viên lên Ban quản lý
	it('[TC_UPDATE_02] nên nâng cấp role từ Giáo viên lên Ban quản lý thành công', async () => {
		// Arrange: đổi role → ảnh hưởng quyền truy cập
		const upgradeRoleBody = { ...validUpdateBody, USER_Role: 'Ban quản lý' }
		Dao.updateUser.mockResolvedValue({ message: 'Cập nhật thành công', affectedRows: 1 })
		const req = { body: upgradeRoleBody }

		// Act
		const result = await UserService.updateUser(req)

		// Assert
		expect(result.affectedRows).toBe(1)
	})

	// TC_UPDATE_03: Hạ cấp role từ Ban quản lý xuống Giáo viên
	it('[TC_UPDATE_03] nên hạ cấp role từ Ban quản lý xuống Giáo viên thành công', async () => {
		// Arrange: thu hồi quyền quản lý
		const downgradeRoleBody = { ...validUpdateBody, ID: 3, USER_Role: 'Giáo viên' }
		Dao.updateUser.mockResolvedValue({ message: 'Cập nhật thành công', affectedRows: 1 })
		const req = { body: downgradeRoleBody }

		// Act
		const result = await UserService.updateUser(req)

		// Assert
		expect(result.affectedRows).toBe(1)
	})

	// TC_UPDATE_04: Khóa tài khoản (Active → Inactive) — user sẽ không đăng nhập được
	it('[TC_UPDATE_04] nên khóa tài khoản user (Active → Inactive) thành công', async () => {
		// Arrange
		const lockAccountBody = { ...validUpdateBody, USER_Status: 'Inactive' }
		Dao.updateUser.mockResolvedValue({ message: 'Cập nhật thành công', affectedRows: 1 })
		const req = { body: lockAccountBody }

		// Act
		const result = await UserService.updateUser(req)

		// Assert
		expect(result.message).toBe('Cập nhật thành công')
		expect(result.affectedRows).toBe(1)
	})

	// TC_UPDATE_05: Mở khóa tài khoản (Inactive → Active)
	it('[TC_UPDATE_05] nên mở khóa tài khoản user (Inactive → Active) thành công', async () => {
		// Arrange
		const unlockAccountBody = { ...validUpdateBody, USER_Status: 'Active' }
		Dao.updateUser.mockResolvedValue({ message: 'Cập nhật thành công', affectedRows: 1 })
		const req = { body: unlockAccountBody }

		// Act
		const result = await UserService.updateUser(req)

		// Assert
		expect(result.affectedRows).toBe(1)
	})

	// TC_UPDATE_06: Đổi password của user
	it('[TC_UPDATE_06] nên đổi password của user thành công', async () => {
		// Arrange
		const changePasswordBody = { ...validUpdateBody, USER_Password: 'newpassword123' }
		Dao.updateUser.mockResolvedValue({ message: 'Cập nhật thành công', affectedRows: 1 })
		const req = { body: changePasswordBody }

		// Act
		const result = await UserService.updateUser(req)

		// Assert
		expect(result.affectedRows).toBe(1)
	})

	// TC_UPDATE_07: Cập nhật số điện thoại
	it('[TC_UPDATE_07] nên cập nhật số điện thoại của user thành công', async () => {
		// Arrange
		const updatePhoneBody = { ...validUpdateBody, USER_PhoneNumber: '0999888777' }
		Dao.updateUser.mockResolvedValue({ message: 'Cập nhật thành công', affectedRows: 1 })
		const req = { body: updatePhoneBody }

		// Act
		const result = await UserService.updateUser(req)

		// Assert
		expect(result.affectedRows).toBe(1)
	})

	// TC_UPDATE_08: affectedRows = 0 khi ID không tồn tại
	it('[TC_UPDATE_08] nên trả về affectedRows = 0 khi ID không tồn tại trong DB', async () => {
		// Arrange
		const nonExistentBody = { ...validUpdateBody, ID: 9999 }
		Dao.updateUser.mockResolvedValue({ message: 'Cập nhật thành công', affectedRows: 0 })
		const req = { body: nonExistentBody }

		// Act
		const result = await UserService.updateUser(req)

		// Assert: không có bản ghi nào bị cập nhật
		expect(result.affectedRows).toBe(0)
	})

	// TC_UPDATE_09: CheckDB — Dao.updateUser được gọi với đúng req.body
	it('[TC_UPDATE_09] CheckDB: nên truyền đúng req.body xuống Dao.updateUser (không biến đổi)', async () => {
		// Arrange
		Dao.updateUser.mockResolvedValue({ message: 'Cập nhật thành công', affectedRows: 1 })
		const req = { body: validUpdateBody }

		// Act
		await UserService.updateUser(req)

		// CheckDB: xác minh DAO nhận đúng dữ liệu
		expect(Dao.updateUser).toHaveBeenCalledWith(validUpdateBody)
		expect(Dao.updateUser).toHaveBeenCalledTimes(1)
	})

	// TC_UPDATE_10: CheckDB — Dao.updateUser được gọi đúng 1 lần
	it('[TC_UPDATE_10] CheckDB: nên gọi Dao.updateUser đúng 1 lần', async () => {
		// Arrange
		Dao.updateUser.mockResolvedValue({ message: 'Cập nhật thành công', affectedRows: 1 })
		const req = { body: validUpdateBody }

		// Act
		await UserService.updateUser(req)

		// CheckDB
		expect(Dao.updateUser).toHaveBeenCalledTimes(1)
	})

	// TC_UPDATE_11: Trả về error object khi DB lỗi (không throw)
	it('[TC_UPDATE_11] nên trả về error object khi DB lỗi (không throw)', async () => {
		// Arrange
		const dbError = new Error('DB error')
		Dao.updateUser.mockRejectedValue(dbError)
		const req = { body: validUpdateBody }

		// Act
		const result = await UserService.updateUser(req)

		// Assert
		expect(result).toBeInstanceOf(Error)
	})
})

// =============================================================================
// 8. deleteUserById()
// Nghiệp vụ: Admin xóa vĩnh viễn tài khoản — không thể hoàn tác
// CheckDB: xác minh Dao.deleteUserById được gọi với đúng ID
// Rollback: mock → không có DB thật bị tác động
//           Nếu test với DB thật: afterEach INSERT lại user đã xóa
// =============================================================================
describe('deleteUserById()', () => {

	// TC_DELETE_01: Xóa thành công user Giáo viên
	it('[TC_DELETE_01] nên xóa thành công user Giáo viên và trả về affectedRows = 1', async () => {
		// Arrange
		Dao.deleteUserById.mockResolvedValue({ message: 'Xóa người dùng thành công', affectedRows: 1 })
		const req = { params: { id: '1' } }

		// Act
		const result = await UserService.deleteUserById(req)

		// Assert
		expect(result.message).toBe('Xóa người dùng thành công')
		expect(result.affectedRows).toBe(1)
	})

	// TC_DELETE_02: Xóa thành công user Ban quản lý
	it('[TC_DELETE_02] nên xóa thành công user Ban quản lý', async () => {
		// Arrange
		Dao.deleteUserById.mockResolvedValue({ message: 'Xóa người dùng thành công', affectedRows: 1 })
		const req = { params: { id: '3' } }

		// Act
		const result = await UserService.deleteUserById(req)

		// Assert
		expect(result.affectedRows).toBe(1)
	})

	// TC_DELETE_03: affectedRows = 0 khi ID không tồn tại
	it('[TC_DELETE_03] nên trả về affectedRows = 0 khi ID không tồn tại trong DB', async () => {
		// Arrange
		Dao.deleteUserById.mockResolvedValue({ message: 'Xóa người dùng thành công', affectedRows: 0 })
		const req = { params: { id: '9999' } }

		// Act
		const result = await UserService.deleteUserById(req)

		// Assert: không có bản ghi nào bị xóa
		expect(result.affectedRows).toBe(0)
	})

	// TC_DELETE_04: CheckDB — Dao.deleteUserById được gọi với đúng ID string
	it('[TC_DELETE_04] CheckDB: nên truyền đúng ID (string) xuống Dao.deleteUserById', async () => {
		// Arrange
		Dao.deleteUserById.mockResolvedValue({ message: 'Xóa người dùng thành công', affectedRows: 1 })
		const req = { params: { id: '5' } }

		// Act
		await UserService.deleteUserById(req)

		// CheckDB: xác minh DAO nhận đúng argument
		expect(Dao.deleteUserById).toHaveBeenCalledWith('5')
		expect(Dao.deleteUserById).toHaveBeenCalledTimes(1)
	})

	// TC_DELETE_05: Trả về error khi user có ràng buộc khóa ngoại (đang có phiếu mượn)
	it('[TC_DELETE_05] nên trả về error khi user đang có phiếu mượn thiết bị (FK constraint)', async () => {
		// Arrange: DAO reject vì vi phạm FK (user có BORROW_RETURN_SLIP liên kết)
		const fkError = new Error('ER_ROW_IS_REFERENCED_2: Cannot delete or update a parent row')
		Dao.deleteUserById.mockRejectedValue(fkError)
		const req = { params: { id: '1' } }

		// Act
		const result = await UserService.deleteUserById(req)

		// Assert: service bắt lỗi và return (không throw)
		expect(result).toBeInstanceOf(Error)
		expect(result.message).toContain('ER_ROW_IS_REFERENCED_2')
	})

	// TC_DELETE_06: Trả về error object khi DB lỗi (không throw)
	it('[TC_DELETE_06] nên trả về error object khi DB lỗi (không throw)', async () => {
		// Arrange
		const dbError = new Error('DB connection failed')
		Dao.deleteUserById.mockRejectedValue(dbError)
		const req = { params: { id: '1' } }

		// Act
		const result = await UserService.deleteUserById(req)

		// Assert
		expect(result).toBeInstanceOf(Error)
	})

	// TC_DELETE_07: Trả về đúng message sau khi xóa thành công
	it('[TC_DELETE_07] nên trả về đúng message "Xóa người dùng thành công"', async () => {
		// Arrange
		Dao.deleteUserById.mockResolvedValue({ message: 'Xóa người dùng thành công', affectedRows: 1 })
		const req = { params: { id: '2' } }

		// Act
		const result = await UserService.deleteUserById(req)

		// Assert
		expect(result.message).toBe('Xóa người dùng thành công')
	})

	// TC_DELETE_08: CheckDB — Dao.deleteUserById được gọi đúng 1 lần
	it('[TC_DELETE_08] CheckDB: nên gọi Dao.deleteUserById đúng 1 lần', async () => {
		// Arrange
		Dao.deleteUserById.mockResolvedValue({ message: 'Xóa người dùng thành công', affectedRows: 1 })
		const req = { params: { id: '2' } }

		// Act
		await UserService.deleteUserById(req)

		// CheckDB
		expect(Dao.deleteUserById).toHaveBeenCalledTimes(1)
	})

	// TC_DELETE_09: Xóa user với ID = "1" (biên dưới)
	it('[TC_DELETE_09] nên xóa thành công user với ID = "1" (biên dưới)', async () => {
		// Arrange
		Dao.deleteUserById.mockResolvedValue({ message: 'Xóa người dùng thành công', affectedRows: 1 })
		const req = { params: { id: '1' } }

		// Act
		const result = await UserService.deleteUserById(req)

		// Assert
		expect(result.affectedRows).toBe(1)
		expect(result.message).toBe('Xóa người dùng thành công')
	})
})
