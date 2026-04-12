/**
 * Unit Test Script: user.dao.js
 * File được test: backend/src/module/user/user.dao.js
 *
 * Mục tiêu:
 *  - Test DAO layer (SQL + DB call contract) một cách cô lập.
 *  - Không dùng DB thật (tránh side-effect, chạy nhanh, ổn định trong CI).
 *
 * CheckDB (theo yêu cầu đề bài):
 *  - Với các hàm có truy cập DB: verify `db.query` được gọi đúng số lần,
 *    đúng SQL (pattern) và đúng params.
 *
 * Rollback (theo yêu cầu đề bài):
 *  - Vì unit test mock hoàn toàn `db.query`, không có thay đổi DB thật để rollback.
 *  - Rollback ở mức unit test được thực hiện bằng `jest.clearAllMocks()` / reset mock
 *    trong `afterEach` để đảm bảo trạng thái trở lại như trước test.
 */

// ─── Mock configDB TRƯỚC khi require DAO ────────────────────────────────────
// user.dao.js require configDB ở top-level, nên mock phải được hoist sớm.
jest.mock('../../config/configDB', () => ({
	query: jest.fn(),
}))

const db = require('../../config/configDB')
const UserDAO = require('../../module/user/user.dao')

/**
 * Helper: tạo Error giống driver MySQL (có code)
 * @param {string} code
 * @param {string} message
 */
function createDbError(code, message) {
	const err = new Error(message)
	err.code = code
	return err
}

describe('backend/src/module/user/user.dao.js - UserDAO (DAO Layer)', () => {
	beforeEach(() => {
		// Rollback (unit level): reset trạng thái mock trước mỗi test.
		jest.clearAllMocks()
	})

	afterEach(() => {
		// Rollback (unit level): đảm bảo không còn mock state rò rỉ sang test khác.
		jest.clearAllMocks()
	})

	// ========================================================================
	// 1) findAll()
	// ========================================================================
	describe('findAll()', () => {
		// Test Case ID: TC_UDAO_FINDALL_01
		it('TC_UDAO_FINDALL_01 - nên resolve danh sách user khi DB trả nhiều bản ghi', async () => {
			// Arrange
			const mockUsers = [
				{ ID: 1, USER_UserName: 'gv1', USER_Role: 'Giáo viên', USER_Status: 'Active' },
				{ ID: 2, USER_UserName: 'bgh1', USER_Role: 'Ban giám hiệu', USER_Status: 'Active' },
				{ ID: 3, USER_UserName: 'bql1', USER_Role: 'Ban quản lý', USER_Status: 'Inactive' },
			]
			db.query.mockImplementation((sql, callback) => callback(null, mockUsers))

			// Act
			const result = await UserDAO.findAll({ ignored: true })

			// Assert
			expect(result).toEqual(mockUsers)
			// CheckDB: gọi đúng SQL và đúng số lần
			expect(db.query).toHaveBeenCalledTimes(1)
			expect(db.query.mock.calls[0][0]).toBe('SELECT * FROM datn.USER')
		})

		// Test Case ID: TC_UDAO_FINDALL_02
		it('TC_UDAO_FINDALL_02 - nên resolve mảng rỗng khi DB không có dữ liệu', async () => {
			// Arrange
			db.query.mockImplementation((sql, callback) => callback(null, []))

			// Act
			const result = await UserDAO.findAll()

			// Assert
			expect(result).toEqual([])
			// CheckDB
			expect(db.query).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_UDAO_FINDALL_03
		it('TC_UDAO_FINDALL_03 - nên trả về cả Active và Inactive (DAO không lọc)', async () => {
			// Arrange
			const mockUsers = [
				{ ID: 1, USER_Status: 'Active' },
				{ ID: 2, USER_Status: 'Inactive' },
			]
			db.query.mockImplementation((sql, callback) => callback(null, mockUsers))

			// Act
			const result = await UserDAO.findAll()

			// Assert
			expect(result).toHaveLength(2)
			expect(result.some(u => u.USER_Status === 'Active')).toBe(true)
			expect(result.some(u => u.USER_Status === 'Inactive')).toBe(true)
		})

		// Test Case ID: TC_UDAO_FINDALL_04
		it('TC_UDAO_FINDALL_04 - nên reject khi DB trả lỗi', async () => {
			// Arrange
			const dbError = createDbError('ECONNREFUSED', 'DB connection refused')
			db.query.mockImplementation((sql, callback) => callback(dbError))

			// Act + Assert
			await expect(UserDAO.findAll()).rejects.toBe(dbError)
			// CheckDB
			expect(db.query).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_UDAO_FINDALL_05
		it('TC_UDAO_FINDALL_05 - nên dùng đúng SQL (không bị ảnh hưởng bởi tham số data)', async () => {
			// Arrange
			db.query.mockImplementation((sql, callback) => callback(null, []))
			const unusedParam = { role: 'Admin', status: 'Active' }

			// Act
			await UserDAO.findAll(unusedParam)

			// Assert
			// CheckDB
			expect(db.query).toHaveBeenCalledTimes(1)
			expect(db.query.mock.calls[0][0]).toBe('SELECT * FROM datn.USER')
		})

		// Test Case ID: TC_UDAO_FINDALL_06
		it('TC_UDAO_FINDALL_06 - nên resolve mảng lớn 1000 rows (stress data shape)', async () => {
			// Arrange
			const largeUserList = Array.from({ length: 1000 }, (_, index) => ({
				ID: index + 1,
				USER_UserName: `user_${index + 1}`,
				USER_Status: index % 2 === 0 ? 'Active' : 'Inactive',
			}))
			db.query.mockImplementation((sql, callback) => callback(null, largeUserList))

			// Act
			const result = await UserDAO.findAll()

			// Assert
			expect(result).toHaveLength(1000)
			expect(result[0]).toEqual({ ID: 1, USER_UserName: 'user_1', USER_Status: 'Active' })
			// CheckDB
			expect(db.query).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_UDAO_FINDALL_07
		it('TC_UDAO_FINDALL_07 - không mutate dữ liệu trả về từ DB', async () => {
			// Arrange
			const rowsFromDb = [{ ID: 1, EXTRA_FIELD: 'keep-me' }]
			db.query.mockImplementation((sql, callback) => callback(null, rowsFromDb))

			// Act
			const result = await UserDAO.findAll()

			// Assert
			expect(result).toEqual(rowsFromDb)
		})

		// Test Case ID: TC_UDAO_FINDALL_08
		it('TC_UDAO_FINDALL_08 - nếu DB trả results=null thì resolve null (robustness)', async () => {
			// Arrange
			db.query.mockImplementation((sql, callback) => callback(null, null))

			// Act
			const result = await UserDAO.findAll()

			// Assert
			expect(result).toBeNull()
		})
	})

	// ========================================================================
	// 2) findOneUser(id)
	// ========================================================================
	describe('findOneUser(id)', () => {
		// Test Case ID: TC_UDAO_FINDONE_01
		it('TC_UDAO_FINDONE_01 - nên resolve đúng user khi ID tồn tại', async () => {
			// Arrange
			const userRow = { ID: 1, USER_UserName: 'gv1', USER_Role: 'Giáo viên', USER_Status: 'Active' }
			db.query.mockImplementation((sql, callback) => callback(null, [userRow]))

			// Act
			const result = await UserDAO.findOneUser(1)

			// Assert
			expect(result).toEqual(userRow)
			// CheckDB: SQL được build đúng
			expect(db.query).toHaveBeenCalledTimes(1)
			expect(db.query.mock.calls[0][0]).toBe('SELECT * FROM datn.USER WHERE ID = 1')
		})

		// Test Case ID: TC_UDAO_FINDONE_02
		it('TC_UDAO_FINDONE_02 - nên resolve undefined khi không có user', async () => {
			// Arrange
			db.query.mockImplementation((sql, callback) => callback(null, []))

			// Act
			const result = await UserDAO.findOneUser(9999)

			// Assert
			expect(result).toBeUndefined()
		})

		// Test Case ID: TC_UDAO_FINDONE_03
		it('TC_UDAO_FINDONE_03 - nếu DB trả nhiều dòng thì lấy dòng đầu tiên', async () => {
			// Arrange
			const firstRow = { ID: 1, USER_UserName: 'first' }
			const secondRow = { ID: 1, USER_UserName: 'second' }
			db.query.mockImplementation((sql, callback) => callback(null, [firstRow, secondRow]))

			// Act
			const result = await UserDAO.findOneUser(1)

			// Assert
			expect(result).toEqual(firstRow)
		})

		// Test Case ID: TC_UDAO_FINDONE_04
		it('TC_UDAO_FINDONE_04 - nên reject khi DB trả lỗi', async () => {
			// Arrange
			const dbError = createDbError('ER_PARSE_ERROR', 'SQL parse error')
			db.query.mockImplementation((sql, callback) => callback(dbError))

			// Act + Assert
			await expect(UserDAO.findOneUser(1)).rejects.toBe(dbError)
		})

		// Test Case ID: TC_UDAO_FINDONE_05
		it('TC_UDAO_FINDONE_05 - ID dạng string số (từ URL) vẫn build SQL tương ứng', async () => {
			// Arrange
			const userRow = { ID: 5, USER_UserName: 'u5' }
			db.query.mockImplementation((sql, callback) => callback(null, [userRow]))

			// Act
			const result = await UserDAO.findOneUser('5')

			// Assert
			expect(result).toEqual(userRow)
			// CheckDB
			expect(db.query.mock.calls[0][0]).toBe('SELECT * FROM datn.USER WHERE ID = 5')
		})

		// Test Case ID: TC_UDAO_FINDONE_06
		it('TC_UDAO_FINDONE_06 - ID=0 thường không có dữ liệu nên resolve undefined', async () => {
			// Arrange
			db.query.mockImplementation((sql, callback) => callback(null, []))

			// Act
			const result = await UserDAO.findOneUser(0)

			// Assert
			expect(result).toBeUndefined()
			// CheckDB
			expect(db.query.mock.calls[0][0]).toBe('SELECT * FROM datn.USER WHERE ID = 0')
		})

		// Test Case ID: TC_UDAO_FINDONE_07
		it('TC_UDAO_FINDONE_07 - ID âm (invalid) nếu DB trả [] thì resolve undefined', async () => {
			// Arrange
			db.query.mockImplementation((sql, callback) => callback(null, []))

			// Act
			const result = await UserDAO.findOneUser(-1)

			// Assert
			expect(result).toBeUndefined()
			// CheckDB
			expect(db.query.mock.calls[0][0]).toBe('SELECT * FROM datn.USER WHERE ID = -1')
		})

		// Test Case ID: TC_UDAO_FINDONE_08
		it('TC_UDAO_FINDONE_08 - ID không phải số (abc) gây lỗi SQL thì phải reject', async () => {
			// Arrange
			const dbError = createDbError('ER_BAD_FIELD_ERROR', 'Unknown column')
			db.query.mockImplementation((sql, callback) => callback(dbError))

			// Act + Assert
			await expect(UserDAO.findOneUser('abc')).rejects.toBe(dbError)
			// CheckDB
			expect(db.query).toHaveBeenCalledTimes(1)
			expect(db.query.mock.calls[0][0]).toBe('SELECT * FROM datn.USER WHERE ID = abc')
		})

		// Test Case ID: TC_UDAO_FINDONE_09
		it('TC_UDAO_FINDONE_09 - ID=undefined tạo SQL sai và phải reject', async () => {
			// Arrange
			const dbError = createDbError('ER_PARSE_ERROR', 'SQL parse error')
			db.query.mockImplementation((sql, callback) => callback(dbError))

			// Act + Assert
			await expect(UserDAO.findOneUser(undefined)).rejects.toBe(dbError)
			// CheckDB
			expect(db.query.mock.calls[0][0]).toBe('SELECT * FROM datn.USER WHERE ID = undefined')
		})

		// Test Case ID: TC_UDAO_FINDONE_10
		it('TC_UDAO_FINDONE_10 - security regression: SQL bị nối chuỗi nếu id chứa injection payload', async () => {
			// Arrange
			// Lưu ý: testcase này nhằm PHÁT HIỆN rủi ro injection hiện tại, không phải khẳng định đúng nghiệp vụ.
			const injectionPayload = '1 OR 1=1'
			db.query.mockImplementation((sql, callback) => callback(null, []))

			// Act
			await UserDAO.findOneUser(injectionPayload)

			// Assert
			// CheckDB: query bị build trực tiếp từ payload (đây là rủi ro cần refactor sang placeholder '?').
			expect(db.query).toHaveBeenCalledTimes(1)
			expect(db.query.mock.calls[0][0]).toBe(`SELECT * FROM datn.USER WHERE ID = ${injectionPayload}`)
		})
	})

	// ========================================================================
	// 3) createUser(data)
	// ========================================================================
	describe('createUser(data)', () => {
		// Test Case ID: TC_UDAO_CREATE_01
		it('TC_UDAO_CREATE_01 - nên tạo user mới thành công (happy path)', async () => {
			// Arrange
			const newUserData = {
				USER_FullName: 'Trần Thị B',
				USER_Email: 'b@gmail.com',
				USER_PhoneNumber: '0909999999',
				USER_UserName: 'tranthib',
				USER_Password: '123456',
				USER_Role: 'Giáo viên',
				USER_Status: 'Active',
			}
			const insertId = 10

			// 1) Check duplicate -> []
			db.query
				.mockImplementationOnce((sql, params, callback) => callback(null, []))
				// 2) Insert -> {insertId}
				.mockImplementationOnce((sql, params, callback) => callback(null, { insertId }))

			// Act
			const result = await UserDAO.createUser(newUserData)

			// Assert
			expect(result).toEqual({ id: insertId })
			// CheckDB: gọi check + insert
			expect(db.query).toHaveBeenCalledTimes(2)
		})

		// Test Case ID: TC_UDAO_CREATE_02
		it('TC_UDAO_CREATE_02 - không cho tạo khi username đã tồn tại', async () => {
			// Arrange
			const newUserData = {
				USER_UserName: 'existingUser',
				USER_Email: 'new@gmail.com',
				USER_FullName: 'X',
				USER_PhoneNumber: '0900000000',
				USER_Password: 'p',
				USER_Role: 'Giáo viên',
				USER_Status: 'Active',
			}
			// Duplicate found
			db.query.mockImplementationOnce((sql, params, callback) => callback(null, [{ ID: 1 }]))

			// Act + Assert
			await expect(UserDAO.createUser(newUserData)).rejects.toEqual({
				message: 'Username hoặc Email đã tồn tại',
			})
			// CheckDB: chỉ gọi check query, không insert
			expect(db.query).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_UDAO_CREATE_03
		it('TC_UDAO_CREATE_03 - không cho tạo khi email đã tồn tại', async () => {
			// Arrange
			const newUserData = {
				USER_UserName: 'newUser',
				USER_Email: 'existing@gmail.com',
				USER_FullName: 'X',
				USER_PhoneNumber: '0900000000',
				USER_Password: 'p',
				USER_Role: 'Giáo viên',
				USER_Status: 'Active',
			}
			db.query.mockImplementationOnce((sql, params, callback) => callback(null, [{ ID: 2 }]))

			// Act + Assert
			await expect(UserDAO.createUser(newUserData)).rejects.toEqual({
				message: 'Username hoặc Email đã tồn tại',
			})
			expect(db.query).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_UDAO_CREATE_04
		it('TC_UDAO_CREATE_04 - không cho tạo khi cả username và email đều trùng', async () => {
			// Arrange
			const newUserData = {
				USER_UserName: 'dupUser',
				USER_Email: 'dup@gmail.com',
				USER_FullName: 'X',
				USER_PhoneNumber: '0900000000',
				USER_Password: 'p',
				USER_Role: 'Giáo viên',
				USER_Status: 'Active',
			}
			db.query.mockImplementationOnce((sql, params, callback) => callback(null, [{ ID: 3 }]))

			// Act + Assert
			await expect(UserDAO.createUser(newUserData)).rejects.toEqual({
				message: 'Username hoặc Email đã tồn tại',
			})
			expect(db.query).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_UDAO_CREATE_05
		it('TC_UDAO_CREATE_05 - nên reject khi DB lỗi ở bước kiểm tra trùng', async () => {
			// Arrange
			const newUserData = { USER_UserName: 'u', USER_Email: 'e' }
			const dbError = createDbError('ECONNRESET', 'Connection reset')
			db.query.mockImplementationOnce((sql, params, callback) => callback(dbError))

			// Act + Assert
			await expect(UserDAO.createUser(newUserData)).rejects.toBe(dbError)
			// CheckDB: không insert
			expect(db.query).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_UDAO_CREATE_06
		it('TC_UDAO_CREATE_06 - nên reject khi DB lỗi ở bước INSERT', async () => {
			// Arrange
			const newUserData = {
				USER_FullName: 'A',
				USER_Email: 'a@a.com',
				USER_PhoneNumber: '0900000000',
				USER_UserName: 'a',
				USER_Password: 'p',
				USER_Role: 'Admin',
				USER_Status: 'Active',
			}
			const insertError = createDbError('ER_DUP_ENTRY', 'Duplicate entry')
			db.query
				.mockImplementationOnce((sql, params, callback) => callback(null, []))
				.mockImplementationOnce((sql, params, callback) => callback(insertError))

			// Act + Assert
			await expect(UserDAO.createUser(newUserData)).rejects.toBe(insertError)
			// CheckDB: đã gọi cả 2 lần
			expect(db.query).toHaveBeenCalledTimes(2)
		})

		// Test Case ID: TC_UDAO_CREATE_07
		it("TC_UDAO_CREATE_07 - CheckDB: bước check trùng phải dùng params array (chống injection)", async () => {
			// Arrange
			const newUserData = {
				USER_UserName: "a' OR 1=1 --",
				USER_Email: 'safe@gmail.com',
				USER_FullName: 'A',
				USER_PhoneNumber: '0900000000',
				USER_Password: 'p',
				USER_Role: 'Giáo viên',
				USER_Status: 'Active',
			}
			db.query
				.mockImplementationOnce((sql, params, callback) => callback(null, []))
				.mockImplementationOnce((sql, params, callback) => callback(null, { insertId: 1 }))

			// Act
			await UserDAO.createUser(newUserData)

			// Assert
			const [, checkParams] = db.query.mock.calls[0]
			expect(checkParams).toEqual([newUserData.USER_UserName, newUserData.USER_Email])
		})

		// Test Case ID: TC_UDAO_CREATE_08
		it('TC_UDAO_CREATE_08 - CheckDB: INSERT phải truyền params đúng thứ tự field', async () => {
			// Arrange
			const newUserData = {
				USER_FullName: 'Order Test',
				USER_Email: 'order@test.com',
				USER_PhoneNumber: '0901234567',
				USER_UserName: 'order_user',
				USER_Password: 'pass',
				USER_Role: 'Ban quản lý',
				USER_Status: 'Active',
			}
			db.query
				.mockImplementationOnce((sql, params, callback) => callback(null, []))
				.mockImplementationOnce((sql, params, callback) => callback(null, { insertId: 99 }))

			// Act
			await UserDAO.createUser(newUserData)

			// Assert
			const [insertSql, insertParams] = db.query.mock.calls[1]
			expect(insertSql).toContain('INSERT INTO datn.USER')
			expect(insertParams).toEqual([
				newUserData.USER_FullName,
				newUserData.USER_Email,
				newUserData.USER_PhoneNumber,
				newUserData.USER_UserName,
				newUserData.USER_Password,
				newUserData.USER_Role,
				newUserData.USER_Status,
			])
		})

		// Test Case ID: TC_UDAO_CREATE_09
		it("TC_UDAO_CREATE_09 - nên default USER_Status='Active' khi không truyền", async () => {
			// Arrange
			const newUserData = {
				USER_FullName: 'A',
				USER_Email: 'a@a.com',
				USER_PhoneNumber: '0900000000',
				USER_UserName: 'a',
				USER_Password: 'p',
				USER_Role: 'Giáo viên',
				USER_Status: undefined,
			}
			db.query
				.mockImplementationOnce((sql, params, callback) => callback(null, []))
				.mockImplementationOnce((sql, params, callback) => callback(null, { insertId: 7 }))

			// Act
			await UserDAO.createUser(newUserData)

			// Assert
			const [, insertParams] = db.query.mock.calls[1]
			expect(insertParams[6]).toBe('Active')
		})

		// Test Case ID: TC_UDAO_CREATE_10
		it("TC_UDAO_CREATE_10 - default USER_Status='Active' khi truyền chuỗi rỗng", async () => {
			// Arrange
			const newUserData = {
				USER_FullName: 'A',
				USER_Email: 'a@a.com',
				USER_PhoneNumber: '0900000000',
				USER_UserName: 'a',
				USER_Password: 'p',
				USER_Role: 'Giáo viên',
				USER_Status: '',
			}
			db.query
				.mockImplementationOnce((sql, params, callback) => callback(null, []))
				.mockImplementationOnce((sql, params, callback) => callback(null, { insertId: 11 }))

			// Act
			await UserDAO.createUser(newUserData)

			// Assert
			const [, insertParams] = db.query.mock.calls[1]
			expect(insertParams[6]).toBe('Active')
		})

		// Test Case ID: TC_UDAO_CREATE_11
		it("TC_UDAO_CREATE_11 - default USER_Status='Active' khi truyền null", async () => {
			// Arrange
			const newUserData = {
				USER_FullName: 'A',
				USER_Email: 'a@a.com',
				USER_PhoneNumber: '0900000000',
				USER_UserName: 'a',
				USER_Password: 'p',
				USER_Role: 'Giáo viên',
				USER_Status: null,
			}
			db.query
				.mockImplementationOnce((sql, params, callback) => callback(null, []))
				.mockImplementationOnce((sql, params, callback) => callback(null, { insertId: 12 }))

			// Act
			await UserDAO.createUser(newUserData)

			// Assert
			const [, insertParams] = db.query.mock.calls[1]
			expect(insertParams[6]).toBe('Active')
		})

		// Test Case ID: TC_UDAO_CREATE_12
		it("TC_UDAO_CREATE_12 - nên giữ USER_Status='Inactive' khi truyền explicit", async () => {
			// Arrange
			const newUserData = {
				USER_FullName: 'A',
				USER_Email: 'a@a.com',
				USER_PhoneNumber: '0900000000',
				USER_UserName: 'a',
				USER_Password: 'p',
				USER_Role: 'Giáo viên',
				USER_Status: 'Inactive',
			}
			db.query
				.mockImplementationOnce((sql, params, callback) => callback(null, []))
				.mockImplementationOnce((sql, params, callback) => callback(null, { insertId: 8 }))

			// Act
			await UserDAO.createUser(newUserData)

			// Assert
			const [, insertParams] = db.query.mock.calls[1]
			expect(insertParams[6]).toBe('Inactive')
		})

		// Test Case ID: TC_UDAO_CREATE_13
		it('TC_UDAO_CREATE_13 - thiếu USER_UserName thì DB báo lỗi và phải reject', async () => {
			// Arrange
			const newUserData = { USER_UserName: undefined, USER_Email: 'e@e.com' }
			const dbError = createDbError('ER_BAD_NULL_ERROR', 'USER_UserName cannot be null')
			db.query.mockImplementationOnce((sql, params, callback) => callback(dbError))

			// Act + Assert
			await expect(UserDAO.createUser(newUserData)).rejects.toBe(dbError)
			// CheckDB
			expect(db.query).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_UDAO_CREATE_14
		it('TC_UDAO_CREATE_14 - thiếu USER_Email thì DB báo lỗi và phải reject', async () => {
			// Arrange
			const newUserData = { USER_UserName: 'u', USER_Email: undefined }
			const dbError = createDbError('ER_BAD_NULL_ERROR', 'USER_Email cannot be null')
			db.query.mockImplementationOnce((sql, params, callback) => callback(dbError))

			// Act + Assert
			await expect(UserDAO.createUser(newUserData)).rejects.toBe(dbError)
		})

		// Test Case ID: TC_UDAO_CREATE_15
		it('TC_UDAO_CREATE_15 - thiếu USER_Password thì INSERT lỗi và phải reject', async () => {
			// Arrange
			const newUserData = {
				USER_FullName: 'A',
				USER_Email: 'a@a.com',
				USER_PhoneNumber: '0900000000',
				USER_UserName: 'a',
				USER_Password: undefined,
				USER_Role: 'Giáo viên',
				USER_Status: 'Active',
			}
			const insertError = createDbError('ER_BAD_NULL_ERROR', 'USER_Password cannot be null')
			db.query
				.mockImplementationOnce((sql, params, callback) => callback(null, []))
				.mockImplementationOnce((sql, params, callback) => callback(insertError))

			// Act + Assert
			await expect(UserDAO.createUser(newUserData)).rejects.toBe(insertError)
		})

		// Test Case ID: TC_UDAO_CREATE_16
		it('TC_UDAO_CREATE_16 - role không hợp lệ (nếu DB constraint) thì INSERT phải reject', async () => {
			// Arrange
			const newUserData = {
				USER_FullName: 'A',
				USER_Email: 'a@a.com',
				USER_PhoneNumber: '0900000000',
				USER_UserName: 'a',
				USER_Password: 'p',
				USER_Role: 'UnknownRole',
				USER_Status: 'Active',
			}
			const roleError = createDbError('ER_CHECK_CONSTRAINT_VIOLATED', 'Invalid role')
			db.query
				.mockImplementationOnce((sql, params, callback) => callback(null, []))
				.mockImplementationOnce((sql, params, callback) => callback(roleError))

			// Act + Assert
			await expect(UserDAO.createUser(newUserData)).rejects.toBe(roleError)
		})

		// Test Case ID: TC_UDAO_CREATE_17
		it('TC_UDAO_CREATE_17 - race condition: check pass nhưng insert bị trùng unique (ER_DUP_ENTRY)', async () => {
			// Arrange
			const newUserData = { USER_UserName: 'race', USER_Email: 'race@x.com' }
			const duplicateOnInsert = createDbError('ER_DUP_ENTRY', 'Duplicate entry')
			db.query
				.mockImplementationOnce((sql, params, callback) => callback(null, []))
				.mockImplementationOnce((sql, params, callback) => callback(duplicateOnInsert))

			// Act + Assert
			await expect(UserDAO.createUser(newUserData)).rejects.toBe(duplicateOnInsert)
		})

		// Test Case ID: TC_UDAO_CREATE_18
		it('TC_UDAO_CREATE_18 - insertId undefined vẫn resolve {id: undefined} (robustness)', async () => {
			// Arrange
			const newUserData = { USER_UserName: 'u', USER_Email: 'e@e.com' }
			db.query
				.mockImplementationOnce((sql, params, callback) => callback(null, []))
				.mockImplementationOnce((sql, params, callback) => callback(null, { insertId: undefined }))

			// Act
			const result = await UserDAO.createUser(newUserData)

			// Assert
			expect(result).toEqual({ id: undefined })
		})

		// Test Case ID: TC_UDAO_CREATE_19
		it('TC_UDAO_CREATE_19 - khi trùng thì không được gọi INSERT (call count = 1)', async () => {
			// Arrange
			const newUserData = { USER_UserName: 'dup', USER_Email: 'dup@x.com' }
			db.query.mockImplementationOnce((sql, params, callback) => callback(null, [{ ID: 1 }]))

			// Act
			await expect(UserDAO.createUser(newUserData)).rejects.toEqual({
				message: 'Username hoặc Email đã tồn tại',
			})

			// Assert
			expect(db.query).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_UDAO_CREATE_20
		it('TC_UDAO_CREATE_20 - không tự trim/normalize dữ liệu (giữ nguyên input)', async () => {
			// Arrange
			const newUserData = {
				USER_FullName: 'A',
				USER_Email: 'a@a.com',
				USER_PhoneNumber: '0900000000',
				USER_UserName: '  user  ',
				USER_Password: 'p',
				USER_Role: 'Giáo viên',
				USER_Status: 'Active',
			}
			db.query
				.mockImplementationOnce((sql, params, callback) => callback(null, []))
				.mockImplementationOnce((sql, params, callback) => callback(null, { insertId: 50 }))

			// Act
			await UserDAO.createUser(newUserData)

			// Assert
			const [, insertParams] = db.query.mock.calls[1]
			expect(insertParams[3]).toBe('  user  ')
		})
	})

	// ========================================================================
	// 4) updateUser(data)
	// ========================================================================
	describe('updateUser(data)', () => {
		beforeEach(() => {
			// Giảm noise từ console.log trong DAO
			jest.spyOn(console, 'log').mockImplementation(() => {})
			jest.spyOn(console, 'error').mockImplementation(() => {})
		})

		afterEach(() => {
			console.log.mockRestore?.()
			console.error.mockRestore?.()
		})

		// Test Case ID: TC_UDAO_UPDATE_01
		it('TC_UDAO_UPDATE_01 - Update thành công 1 bản ghi', async () => {
			// Arrange
			const updatePayload = {
				ID: 1,
				USER_FullName: 'Nguyễn Văn Tuấn',
				USER_Email: 'new@gmail.com',
				USER_PhoneNumber: '0901111111',
				USER_UserName: 'nguyenvantuan',
				USER_Password: 'newpass',
				USER_Role: 'Giáo viên',
				USER_Status: 'Active',
			}
			db.query.mockImplementation((sql, params, callback) => callback(null, { affectedRows: 1 }))

			// Act
			const result = await UserDAO.updateUser(updatePayload)

			// Assert
			expect(result).toEqual({ message: 'Cập nhật thành công', affectedRows: 1 })
			// CheckDB: called 1 lần
			expect(db.query).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_UDAO_UPDATE_02
		it('TC_UDAO_UPDATE_02 - ID không tồn tại → affectedRows = 0', async () => {
			// Arrange
			const updatePayload = {
				ID: 9999,
				USER_FullName: 'X',
				USER_Email: 'x@x.com',
				USER_PhoneNumber: '0900000000',
				USER_UserName: 'x',
				USER_Password: 'p',
				USER_Role: 'Admin',
				USER_Status: 'Active',
			}
			db.query.mockImplementation((sql, params, callback) => callback(null, { affectedRows: 0 }))

			// Act
			const result = await UserDAO.updateUser(updatePayload)

			// Assert
			expect(result).toEqual({ message: 'Cập nhật thành công', affectedRows: 0 })
		})

		// Test Case ID: TC_UDAO_UPDATE_03
		it('TC_UDAO_UPDATE_03 - nên reject khi DB trả lỗi', async () => {
			// Arrange
			const updatePayload = { ID: 1 }
			const dbError = createDbError('ECONNREFUSED', 'DB down')
			db.query.mockImplementation((sql, params, callback) => callback(dbError))

			// Act + Assert
			await expect(UserDAO.updateUser(updatePayload)).rejects.toBe(dbError)
		})

		// Test Case ID: TC_UDAO_UPDATE_04
		it('TC_UDAO_UPDATE_04 - CheckDB: query dùng placeholder và params đúng thứ tự', async () => {
			// Arrange
			const updatePayload = {
				ID: 1,
				USER_FullName: 'FN',
				USER_Email: 'e@e.com',
				USER_PhoneNumber: '0900',
				USER_UserName: 'uname',
				USER_Password: 'pwd',
				USER_Role: 'Admin',
				USER_Status: 'Active',
			}
			db.query.mockImplementation((sql, params, callback) => callback(null, { affectedRows: 1 }))

			// Act
			await UserDAO.updateUser(updatePayload)

			// Assert
			const [sql, params] = db.query.mock.calls[0]
			expect(sql).toContain('UPDATE datn.USER SET')
			expect(sql).toContain('WHERE ID = ?')
			expect(params).toEqual([
				updatePayload.USER_FullName,
				updatePayload.USER_Email,
				updatePayload.USER_PhoneNumber,
				updatePayload.USER_UserName,
				updatePayload.USER_Password,
				updatePayload.USER_Role,
				updatePayload.USER_Status,
				updatePayload.ID,
			])
		})

		// Test Case ID: TC_UDAO_UPDATE_05
		it('TC_UDAO_UPDATE_05 - Khóa tài khoản (Active → Inactive)', async () => {
			// Arrange
			const updatePayload = {
				ID: 2,
				USER_FullName: 'A',
				USER_Email: 'a@a.com',
				USER_PhoneNumber: '0900',
				USER_UserName: 'u',
				USER_Password: 'p',
				USER_Role: 'Giáo viên',
				USER_Status: 'Inactive',
			}
			db.query.mockImplementation((sql, params, callback) => callback(null, { affectedRows: 1 }))

			// Act
			const result = await UserDAO.updateUser(updatePayload)

			// Assert
			expect(result).toEqual({ message: 'Cập nhật thành công', affectedRows: 1 })
			const [, params] = db.query.mock.calls[0]
			expect(params[6]).toBe('Inactive')
		})

		// Test Case ID: TC_UDAO_UPDATE_06
		it('TC_UDAO_UPDATE_06 - Mở khóa tài khoản (Inactive → Active)', async () => {
			// Arrange
			const updatePayload = {
				ID: 3,
				USER_FullName: 'A',
				USER_Email: 'a@a.com',
				USER_PhoneNumber: '0900',
				USER_UserName: 'u',
				USER_Password: 'p',
				USER_Role: 'Giáo viên',
				USER_Status: 'Active',
			}
			db.query.mockImplementation((sql, params, callback) => callback(null, { affectedRows: 1 }))

			// Act
			const result = await UserDAO.updateUser(updatePayload)

			// Assert
			expect(result.affectedRows).toBe(1)
			const [, params] = db.query.mock.calls[0]
			expect(params[6]).toBe('Active')
		})

		// Test Case ID: TC_UDAO_UPDATE_07
		it('TC_UDAO_UPDATE_07 - Đổi role (Giáo viên → Ban quản lý)', async () => {
			// Arrange
			const updatePayload = {
				ID: 4,
				USER_FullName: 'A',
				USER_Email: 'a@a.com',
				USER_PhoneNumber: '0900',
				USER_UserName: 'u',
				USER_Password: 'p',
				USER_Role: 'Ban quản lý',
				USER_Status: 'Active',
			}
			db.query.mockImplementation((sql, params, callback) => callback(null, { affectedRows: 1 }))

			// Act
			await UserDAO.updateUser(updatePayload)

			// Assert
			const [, params] = db.query.mock.calls[0]
			expect(params[5]).toBe('Ban quản lý')
		})

		// Test Case ID: TC_UDAO_UPDATE_08
		it('TC_UDAO_UPDATE_08 - nên reject khi vi phạm unique constraint (ER_DUP_ENTRY)', async () => {
			// Arrange
			const updatePayload = { ID: 1, USER_UserName: 'dup' }
			const duplicateError = createDbError('ER_DUP_ENTRY', 'Duplicate entry')
			db.query.mockImplementation((sql, params, callback) => callback(duplicateError))

			// Act + Assert
			await expect(UserDAO.updateUser(updatePayload)).rejects.toBe(duplicateError)
		})

		// Test Case ID: TC_UDAO_UPDATE_09
		it('TC_UDAO_UPDATE_09 - status không hợp lệ (Blocked) thì DB constraint báo lỗi và reject', async () => {
			// Arrange
			const updatePayload = { ID: 1, USER_Status: 'Blocked' }
			const statusError = createDbError('ER_CHECK_CONSTRAINT_VIOLATED', 'Invalid status')
			db.query.mockImplementation((sql, params, callback) => callback(statusError))

			// Act + Assert
			await expect(UserDAO.updateUser(updatePayload)).rejects.toBe(statusError)
		})

		// Test Case ID: TC_UDAO_UPDATE_10
		it('TC_UDAO_UPDATE_10 - role không hợp lệ thì DB constraint báo lỗi và reject', async () => {
			// Arrange
			const updatePayload = { ID: 1, USER_Role: 'UnknownRole' }
			const roleError = createDbError('ER_CHECK_CONSTRAINT_VIOLATED', 'Invalid role')
			db.query.mockImplementation((sql, params, callback) => callback(roleError))

			// Act + Assert
			await expect(UserDAO.updateUser(updatePayload)).rejects.toBe(roleError)
		})

		// Test Case ID: TC_UDAO_UPDATE_11
		it("TC_UDAO_UPDATE_11 - data.ID là string số vẫn update được", async () => {
			// Arrange
			const updatePayload = {
				ID: '1',
				USER_FullName: 'A',
				USER_Email: 'a@a.com',
				USER_PhoneNumber: '0900',
				USER_UserName: 'u',
				USER_Password: 'p',
				USER_Role: 'Admin',
				USER_Status: 'Active',
			}
			db.query.mockImplementation((sql, params, callback) => callback(null, { affectedRows: 1 }))

			// Act
			const result = await UserDAO.updateUser(updatePayload)

			// Assert
			expect(result.affectedRows).toBe(1)
			const [, params] = db.query.mock.calls[0]
			expect(params[7]).toBe('1')
		})

		// Test Case ID: TC_UDAO_UPDATE_12
		it('TC_UDAO_UPDATE_12 - thiếu ID (undefined) thì DB trả lỗi và phải reject', async () => {
			// Arrange
			const updatePayload = { ID: undefined }
			const idError = createDbError('ER_PARSE_ERROR', 'SQL parse error')
			db.query.mockImplementation((sql, params, callback) => callback(idError))

			// Act + Assert
			await expect(UserDAO.updateUser(updatePayload)).rejects.toBe(idError)
		})

		// Test Case ID: TC_UDAO_UPDATE_13
		it('TC_UDAO_UPDATE_13 - USER_Email=null (NOT NULL) thì DB trả lỗi và reject', async () => {
			// Arrange
			const updatePayload = { ID: 1, USER_Email: null }
			const emailError = createDbError('ER_BAD_NULL_ERROR', 'USER_Email cannot be null')
			db.query.mockImplementation((sql, params, callback) => callback(emailError))

			// Act + Assert
			await expect(UserDAO.updateUser(updatePayload)).rejects.toBe(emailError)
		})

		// Test Case ID: TC_UDAO_UPDATE_14
		it('TC_UDAO_UPDATE_14 - dữ liệu quá dài (Data too long) thì reject', async () => {
			// Arrange
			const updatePayload = { ID: 1, USER_FullName: 'X'.repeat(5000) }
			const tooLongError = createDbError('ER_DATA_TOO_LONG', 'Data too long')
			db.query.mockImplementation((sql, params, callback) => callback(tooLongError))

			// Act + Assert
			await expect(UserDAO.updateUser(updatePayload)).rejects.toBe(tooLongError)
		})

		// Test Case ID: TC_UDAO_UPDATE_15
		it('TC_UDAO_UPDATE_15 - không mutate payload, chỉ truyền params đúng theo data', async () => {
			// Arrange
			const updatePayload = {
				ID: 5,
				USER_FullName: 'Name',
				USER_Email: 'name@x.com',
				USER_PhoneNumber: '0900',
				USER_UserName: 'uname',
				USER_Password: 'pwd',
				USER_Role: 'Giáo viên',
				USER_Status: 'Active',
			}
			const payloadSnapshot = { ...updatePayload }
			db.query.mockImplementation((sql, params, callback) => callback(null, { affectedRows: 1 }))

			// Act
			await UserDAO.updateUser(updatePayload)

			// Assert
			expect(updatePayload).toEqual(payloadSnapshot)
			const [, params] = db.query.mock.calls[0]
			expect(params).toEqual([
				updatePayload.USER_FullName,
				updatePayload.USER_Email,
				updatePayload.USER_PhoneNumber,
				updatePayload.USER_UserName,
				updatePayload.USER_Password,
				updatePayload.USER_Role,
				updatePayload.USER_Status,
				updatePayload.ID,
			])
		})
	})

	// ========================================================================
	// 5) deleteUserById(id)
	// ========================================================================
	describe('deleteUserById(id)', () => {
		beforeEach(() => {
			jest.spyOn(console, 'log').mockImplementation(() => {})
			jest.spyOn(console, 'error').mockImplementation(() => {})
		})

		afterEach(() => {
			console.log.mockRestore?.()
			console.error.mockRestore?.()
		})

		// Test Case ID: TC_UDAO_DELETE_01
		it('TC_UDAO_DELETE_01 - Xóa thành công 1 user', async () => {
			// Arrange
			db.query.mockImplementation((sql, params, callback) => callback(null, { affectedRows: 1 }))

			// Act
			const result = await UserDAO.deleteUserById(1)

			// Assert
			expect(result).toEqual({ message: 'Xóa người dùng thành công', affectedRows: 1 })
			// CheckDB: placeholder + params
			expect(db.query).toHaveBeenCalledTimes(1)
			const [sql, params] = db.query.mock.calls[0]
			expect(sql).toContain('DELETE FROM datn.USER')
			expect(sql).toContain('WHERE ID = ?')
			expect(params).toEqual([1])
		})

		// Test Case ID: TC_UDAO_DELETE_02
		it('TC_UDAO_DELETE_02 - ID không tồn tại → affectedRows=0', async () => {
			// Arrange
			db.query.mockImplementation((sql, params, callback) => callback(null, { affectedRows: 0 }))

			// Act
			const result = await UserDAO.deleteUserById(9999)

			// Assert
			expect(result).toEqual({ message: 'Xóa người dùng thành công', affectedRows: 0 })
		})

		// Test Case ID: TC_UDAO_DELETE_03
		it('TC_UDAO_DELETE_03 - nên reject khi DB lỗi', async () => {
			// Arrange
			const dbError = createDbError('ECONNREFUSED', 'DB down')
			db.query.mockImplementation((sql, params, callback) => callback(dbError))

			// Act + Assert
			await expect(UserDAO.deleteUserById(1)).rejects.toBe(dbError)
		})

		// Test Case ID: TC_UDAO_DELETE_04
		it('TC_UDAO_DELETE_04 - nên reject khi vi phạm khóa ngoại (ER_ROW_IS_REFERENCED_2)', async () => {
			// Arrange
			const fkError = createDbError('ER_ROW_IS_REFERENCED_2', 'Cannot delete or update a parent row')
			db.query.mockImplementation((sql, params, callback) => callback(fkError))

			// Act + Assert
			await expect(UserDAO.deleteUserById(1)).rejects.toBe(fkError)
		})

		// Test Case ID: TC_UDAO_DELETE_05
		it('TC_UDAO_DELETE_05 - CheckDB: delete phải truyền params array, không nối chuỗi SQL', async () => {
			// Arrange
			const injectionPayload = '1 OR 1=1'
			db.query.mockImplementation((sql, params, callback) => callback(null, { affectedRows: 0 }))

			// Act
			await UserDAO.deleteUserById(injectionPayload)

			// Assert
			const [, params] = db.query.mock.calls[0]
			expect(params).toEqual([injectionPayload])
		})

		// Test Case ID: TC_UDAO_DELETE_06
		it("TC_UDAO_DELETE_06 - ID là string số vẫn xóa được", async () => {
			// Arrange
			db.query.mockImplementation((sql, params, callback) => callback(null, { affectedRows: 1 }))

			// Act
			const result = await UserDAO.deleteUserById('2')

			// Assert
			expect(result.affectedRows).toBe(1)
			const [, params] = db.query.mock.calls[0]
			expect(params).toEqual(['2'])
		})

		// Test Case ID: TC_UDAO_DELETE_07
		it('TC_UDAO_DELETE_07 - ID=undefined gây lỗi DB thì phải reject', async () => {
			// Arrange
			const dbError = createDbError('ER_PARSE_ERROR', 'SQL parse error')
			db.query.mockImplementation((sql, params, callback) => callback(dbError))

			// Act + Assert
			await expect(UserDAO.deleteUserById(undefined)).rejects.toBe(dbError)
		})

		// Test Case ID: TC_UDAO_DELETE_08
		it('TC_UDAO_DELETE_08 - xóa user role Admin: DAO vẫn resolve (nghiệp vụ cấm thì ở service)', async () => {
			// Arrange
			db.query.mockImplementation((sql, params, callback) => callback(null, { affectedRows: 1 }))

			// Act
			const result = await UserDAO.deleteUserById(123)

			// Assert
			expect(result).toEqual({ message: 'Xóa người dùng thành công', affectedRows: 1 })
		})

		// Test Case ID: TC_UDAO_DELETE_09
		it("TC_UDAO_DELETE_09 - message trả về phải đúng 'Xóa người dùng thành công'", async () => {
			// Arrange
			db.query.mockImplementation((sql, params, callback) => callback(null, { affectedRows: 1 }))

			// Act
			const result = await UserDAO.deleteUserById(1)

			// Assert
			expect(result.message).toBe('Xóa người dùng thành công')
		})

		// Test Case ID: TC_UDAO_DELETE_10
		it('TC_UDAO_DELETE_10 - DB error thì reject Promise, không crash process', async () => {
			// Arrange
			const dbError = createDbError('ER_UNKNOWN_ERROR', 'Unknown error')
			db.query.mockImplementation((sql, params, callback) => callback(dbError))

			// Act + Assert
			await expect(UserDAO.deleteUserById(1)).rejects.toBe(dbError)
			// CheckDB
			expect(db.query).toHaveBeenCalledTimes(1)
		})
	})

	// ========================================================================
	// 6) findUserNameAndPassword(data)
	// ========================================================================
	describe('findUserNameAndPassword(data)', () => {
		// Test Case ID: TC_UDAO_LOGIN_01
		it('TC_UDAO_LOGIN_01 - Trả về user khi đăng nhập đúng và Active', async () => {
			// Arrange
			const activeUser = { ID: 1, USER_UserName: 'u', USER_Status: 'Active' }
			db.query.mockImplementation((sql, callback) => callback(null, [activeUser]))

			// Act
			const result = await UserDAO.findUserNameAndPassword({ userName: 'u', password: 'p' })

			// Assert
			expect(result).toEqual(activeUser)
			// CheckDB: SQL có điều kiện Active
			expect(db.query).toHaveBeenCalledTimes(1)
			const [sql] = db.query.mock.calls[0]
			expect(sql).toContain("USER_Status = 'Active'")
		})

		// Test Case ID: TC_UDAO_LOGIN_02
		it('TC_UDAO_LOGIN_02 - sai password thì resolve undefined', async () => {
			// Arrange
			db.query.mockImplementation((sql, callback) => callback(null, []))

			// Act
			const result = await UserDAO.findUserNameAndPassword({ userName: 'u', password: 'wrong' })

			// Assert
			expect(result).toBeUndefined()
		})

		// Test Case ID: TC_UDAO_LOGIN_03
		it('TC_UDAO_LOGIN_03 - username không tồn tại thì resolve undefined', async () => {
			// Arrange
			db.query.mockImplementation((sql, callback) => callback(null, []))

			// Act
			const result = await UserDAO.findUserNameAndPassword({ userName: 'notfound', password: 'p' })

			// Assert
			expect(result).toBeUndefined()
		})

		// Test Case ID: TC_UDAO_LOGIN_04
		it("TC_UDAO_LOGIN_04 - user Inactive không login được (WHERE lọc Active) → undefined", async () => {
			// Arrange
			// Nếu user Inactive, query WHERE ... AND USER_Status='Active' sẽ không trả dòng nào.
			db.query.mockImplementation((sql, callback) => callback(null, []))

			// Act
			const result = await UserDAO.findUserNameAndPassword({ userName: 'inactiveUser', password: 'p' })

			// Assert
			expect(result).toBeUndefined()
		})

		// Test Case ID: TC_UDAO_LOGIN_05
		it('TC_UDAO_LOGIN_05 - nên reject khi DB trả lỗi', async () => {
			// Arrange
			const dbError = createDbError('ETIMEDOUT', 'Query timeout')
			db.query.mockImplementation((sql, callback) => callback(dbError))

			// Act + Assert
			await expect(
				UserDAO.findUserNameAndPassword({ userName: 'u', password: 'p' })
			).rejects.toBe(dbError)
		})

		// Test Case ID: TC_UDAO_LOGIN_06
		it("TC_UDAO_LOGIN_06 - CheckDB: SQL phải có USER_Status='Active'", async () => {
			// Arrange
			db.query.mockImplementation((sql, callback) => callback(null, []))

			// Act
			await UserDAO.findUserNameAndPassword({ userName: 'a', password: 'b' })

			// Assert
			const [sql] = db.query.mock.calls[0]
			expect(sql).toContain("USER_Status = 'Active'")
		})

		// Test Case ID: TC_UDAO_LOGIN_07
		it("TC_UDAO_LOGIN_07 - CheckDB: SQL phải nhúng đúng username/password (string interpolation hiện tại)", async () => {
			// Arrange
			const userName = 'testuser'
			const password = 'testpass'
			db.query.mockImplementation((sql, callback) => callback(null, []))

			// Act
			await UserDAO.findUserNameAndPassword({ userName, password })

			// Assert
			const [sql] = db.query.mock.calls[0]
			expect(sql).toContain(`USER_UserName = '${userName}'`)
			expect(sql).toContain(`USER_Password = '${password}'`)
		})

		// Test Case ID: TC_UDAO_LOGIN_08
		it("TC_UDAO_LOGIN_08 - username có dấu nháy (') có thể làm lỗi SQL và phải reject", async () => {
			// Arrange
			const dbError = createDbError('ER_PARSE_ERROR', 'SQL parse error')
			db.query.mockImplementation((sql, callback) => callback(dbError))

			// Act + Assert
			await expect(
				UserDAO.findUserNameAndPassword({ userName: "o'reilly", password: 'p' })
			).rejects.toBe(dbError)
		})

		// Test Case ID: TC_UDAO_LOGIN_09
		it("TC_UDAO_LOGIN_09 - password có dấu nháy (') có thể làm lỗi SQL và phải reject", async () => {
			// Arrange
			const dbError = createDbError('ER_PARSE_ERROR', 'SQL parse error')
			db.query.mockImplementation((sql, callback) => callback(dbError))

			// Act + Assert
			await expect(
				UserDAO.findUserNameAndPassword({ userName: 'user', password: "p'1" })
			).rejects.toBe(dbError)
		})

		// Test Case ID: TC_UDAO_LOGIN_10
		it("TC_UDAO_LOGIN_10 - input rỗng (username/password='') thì resolve undefined", async () => {
			// Arrange
			db.query.mockImplementation((sql, callback) => callback(null, []))

			// Act
			const result = await UserDAO.findUserNameAndPassword({ userName: '', password: '' })

			// Assert
			expect(result).toBeUndefined()
		})

		// Test Case ID: TC_UDAO_LOGIN_11
		it('TC_UDAO_LOGIN_11 - username có khoảng trắng đầu/cuối: DAO không trim', async () => {
			// Arrange
			const userNameWithSpaces = '  user  '
			db.query.mockImplementation((sql, callback) => callback(null, []))

			// Act
			await UserDAO.findUserNameAndPassword({ userName: userNameWithSpaces, password: 'p' })

			// Assert
			const [sql] = db.query.mock.calls[0]
			expect(sql).toContain(`USER_UserName = '${userNameWithSpaces}'`)
		})

		// Test Case ID: TC_UDAO_LOGIN_12
		it('TC_UDAO_LOGIN_12 - DAO không tự lower/upper username (case-sensitivity do DB collation)', async () => {
			// Arrange
			const mixedCaseUserName = 'User'
			db.query.mockImplementation((sql, callback) => callback(null, []))

			// Act
			await UserDAO.findUserNameAndPassword({ userName: mixedCaseUserName, password: 'p' })

			// Assert
			const [sql] = db.query.mock.calls[0]
			expect(sql).toContain(`USER_UserName = '${mixedCaseUserName}'`)
		})

		// Test Case ID: TC_UDAO_LOGIN_13
		it('TC_UDAO_LOGIN_13 - nếu DB trả nhiều dòng thì resolve dòng đầu', async () => {
			// Arrange
			const firstUser = { ID: 1, USER_UserName: 'first' }
			const secondUser = { ID: 2, USER_UserName: 'second' }
			db.query.mockImplementation((sql, callback) => callback(null, [firstUser, secondUser]))

			// Act
			const result = await UserDAO.findUserNameAndPassword({ userName: 'u', password: 'p' })

			// Assert
			expect(result).toEqual(firstUser)
		})

		// Test Case ID: TC_UDAO_LOGIN_14
		it('TC_UDAO_LOGIN_14 - security regression: SQL injection payload trong username sẽ bị nối chuỗi', async () => {
			// Arrange
			const injectionPayload = "' OR 1=1 --"
			db.query.mockImplementation((sql, callback) => callback(null, []))

			// Act
			await UserDAO.findUserNameAndPassword({ userName: injectionPayload, password: 'p' })

			// Assert
			const [sql] = db.query.mock.calls[0]
			expect(sql).toContain(`USER_UserName = '${injectionPayload}'`)
			// Notes: Đây là rủi ro cần refactor sang query parameterized.
		})

		// Test Case ID: TC_UDAO_LOGIN_15
		it('TC_UDAO_LOGIN_15 - DAO bỏ qua data.table và luôn query FROM datn.USER', async () => {
			// Arrange
			db.query.mockImplementation((sql, callback) => callback(null, []))

			// Act
			await UserDAO.findUserNameAndPassword({ table: 'other.USER', userName: 'u', password: 'p' })

			// Assert
			const [sql] = db.query.mock.calls[0]
			expect(sql).toContain('FROM datn.USER')
			expect(sql).not.toContain('other.USER')
		})
	})
})
