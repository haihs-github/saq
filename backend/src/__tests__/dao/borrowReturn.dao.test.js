jest.mock('../../config/configDB', () => ({
	query: jest.fn(),
	execute: jest.fn(),
	getConnection: jest.fn(),
	beginTransaction: jest.fn(),
	commit: jest.fn(),
	rollback: jest.fn(),
	end: jest.fn(),
}))

const db = require('../../config/configDB')
const BorrowReturnDAO = require('../../module/borrowReturn/borrowReturn.dao')

/**
 * BorrowReturnDAO - Unit tests (DAO layer)
 *
 * Mục tiêu:
 * - CheckDB: xác minh DAO tạo đúng SQL / params / thứ tự gọi db.
 * - Rollback: với logic transaction trong `borrowReturnSlipDAO`, luôn xác minh gọi rollback/commit đúng,
 *   và reset mocks sau mỗi test để đảm bảo trạng thái “như trước khi test”.
 *
 * Lưu ý: Test này mock hoàn toàn `configDB`, không đụng DB thật.
 */

function createUser(overrides = {}) {
	return {
		ID: 1,
		USER_FullName: 'Nguyễn Văn A',
		USER_UserName: 'nguyenvana',
		USER_Role: 'Giáo viên',
		...overrides,
	}
}

function createBorrowReturnEquipmentItem(overrides = {}) {
	return {
		ID: 10,
		EQUIPMENT_ITEM_Name: 'EPX200-001',
		...overrides,
	}
}

function createBorrowReturnRoomItem(overrides = {}) {
	return {
		ID: 3,
		ROOM_Name: 'A101',
		...overrides,
	}
}

function createBorrowSlipPayload(overrides = {}) {
	return {
		BORROW_RETURN_SLIP_Name: 'Phiếu mượn tiết 1',
		Note: 'Ghi chú',
		USER: createUser({ ID: 5 }),
		StartDate: ['1', '2026-04-11'],
		EndDate: ['2', '2026-04-11'],
		equipments: [createBorrowReturnEquipmentItem()],
		...overrides,
	}
}

function createReturnSlipRow(overrides = {}) {
	return {
		BORROW_RETURN_SLIP_ID: 1,
		items: [
			{
				EQUIPMENT_ITEM_ID: 10,
				EQUIPMENT_ITEM_Status: 'Đang mượn',
			},
		],
		...overrides,
	}
}

function mockQueryCallsInOrder(handlers) {
	/**
	 * Helper để mock `db.query` theo thứ tự gọi.
	 * - Hỗ trợ signature: (sql, cb) hoặc (sql, params, cb)
	 */
	let callIndex = 0
	db.query.mockImplementation((sql, paramsOrCb, maybeCb) => {
		const handler = handlers[callIndex]
		callIndex++
		if (!handler) {
			throw new Error(`Unexpected db.query call #${callIndex}`)
		}

		const cb = typeof paramsOrCb === 'function' ? paramsOrCb : maybeCb
		const params = typeof paramsOrCb === 'function' ? undefined : paramsOrCb
		return handler({ sql, params, cb })
	})
}

describe('backend/src/module/borrowReturn/borrowReturn.dao.js - BorrowReturnDAO (DAO Layer)', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		// Rollback semantics (mock): luôn reset state, và cho rollback/commit chạy callback để Promise settle.
		db.beginTransaction.mockImplementation(cb => cb && cb(null))
		db.commit.mockImplementation(cb => cb && cb(null))
		db.rollback.mockImplementation(cb => cb && cb())
	})

	// =====================================================================
	// 1) convertDateArray()
	// =====================================================================
	describe('convertDateArray(dateArray, gioBatDau, phutMoiTiet)', () => {
		// Test Case ID: TC_BRDAO_CONVERT_01
		it("TC_BRDAO_CONVERT_01 - convert đúng tiết 1 mặc định (07:00:00)", () => {
			const result = BorrowReturnDAO.convertDateArray(['1', '2026-04-11'])
			// Chỉ assert phần giờ/phút theo logic; phần date phụ thuộc parse nhưng vẫn phải đúng format.
			expect(result).toMatch(/^\d{4}-\d{2}-\d{2} 07:00:00$/)
		})

		// Test Case ID: TC_BRDAO_CONVERT_02
		it('TC_BRDAO_CONVERT_02 - convert đúng tiết 2 (07:45:00)', () => {
			const result = BorrowReturnDAO.convertDateArray(['2', '2026-04-11'])
			expect(result).toMatch(/^\d{4}-\d{2}-\d{2} 07:45:00$/)
		})

		// Test Case ID: TC_BRDAO_CONVERT_03
		it('TC_BRDAO_CONVERT_03 - convert đúng tiết 3 (08:30:00)', () => {
			const result = BorrowReturnDAO.convertDateArray(['3', '2026-04-11'])
			expect(result).toMatch(/^\d{4}-\d{2}-\d{2} 08:30:00$/)
		})

		// Test Case ID: TC_BRDAO_CONVERT_08
		it('TC_BRDAO_CONVERT_08 - custom gioBatDau (08:00:00)', () => {
			const result = BorrowReturnDAO.convertDateArray(['1', '2026-04-11'], 8)
			expect(result).toMatch(/^\d{4}-\d{2}-\d{2} 08:00:00$/)
		})

		// Test Case ID: TC_BRDAO_CONVERT_09
		it('TC_BRDAO_CONVERT_09 - custom phutMoiTiet=50 (tiết 2 -> 07:50:00)', () => {
			const result = BorrowReturnDAO.convertDateArray(['2', '2026-04-11'], 7, 50)
			expect(result).toMatch(/^\d{4}-\d{2}-\d{2} 07:50:00$/)
		})

		// Test Case ID: TC_BRDAO_CONVERT_15
		it('TC_BRDAO_CONVERT_15 - ngày invalid trả về chuỗi chứa NaN (ghi nhận edge)', () => {
			const result = BorrowReturnDAO.convertDateArray(['1', 'not-a-date'])
			expect(result).toContain('NaN')
		})

		// Test Case ID: TC_BRDAO_CONVERT_18
		it('TC_BRDAO_CONVERT_18 - dateArray=null -> throw TypeError', () => {
			expect(() => BorrowReturnDAO.convertDateArray(null)).toThrow()
		})
	})

	// =====================================================================
	// 2) findAllBorrowReturn()
	// =====================================================================
	describe('findAllBorrowReturn()', () => {
		// Test Case ID: TC_BRDAO_FINDALLBR_01
		it('TC_BRDAO_FINDALLBR_01 - resolve danh sách khi DB trả nhiều dòng', async () => {
			const rows = [
				{ BORROW_RETURN_SLIP_ID: 1, BORROW_RETURN_ITEM_ID: 100 },
				{ BORROW_RETURN_SLIP_ID: 2, BORROW_RETURN_ITEM_ID: 200 },
			]
			db.query.mockImplementation((sql, cb) => cb(null, rows))

			const result = await BorrowReturnDAO.findAllBorrowReturn()
			expect(result).toBe(rows)
		})

		// Test Case ID: TC_BRDAO_FINDALLBR_02
		it('TC_BRDAO_FINDALLBR_02 - resolve [] khi DB trả []', async () => {
			db.query.mockImplementation((sql, cb) => cb(null, []))
			const result = await BorrowReturnDAO.findAllBorrowReturn()
			expect(result).toEqual([])
		})

		// Test Case ID: TC_BRDAO_FINDALLBR_11
		it('TC_BRDAO_FINDALLBR_11 - reject khi db.query trả lỗi', async () => {
			const dbError = new Error('DB timeout')
			db.query.mockImplementation((sql, cb) => cb(dbError))
			await expect(BorrowReturnDAO.findAllBorrowReturn()).rejects.toBe(dbError)
		})

		// Test Case ID: TC_BRDAO_FINDALLBR_09
		it('TC_BRDAO_FINDALLBR_09 - CheckDB: SQL có ORDER BY brs.ID', async () => {
			db.query.mockImplementation((sql, cb) => cb(null, []))
			await BorrowReturnDAO.findAllBorrowReturn()
			expect(db.query).toHaveBeenCalledTimes(1)
			const [sqlArg] = db.query.mock.calls[0]
			expect(sqlArg).toContain('ORDER BY brs.ID')
		})

		// Test Case ID: TC_BRDAO_FINDALLBR_10
		it('TC_BRDAO_FINDALLBR_10 - CheckDB: SQL JOIN đủ bảng trọng yếu', async () => {
			db.query.mockImplementation((sql, cb) => cb(null, []))
			await BorrowReturnDAO.findAllBorrowReturn()
			const [sqlArg] = db.query.mock.calls[0]
			expect(sqlArg).toContain('FROM datn.BORROW_RETURN_SLIP')
			expect(sqlArg).toContain('JOIN datn.`USER`')
			expect(sqlArg).toContain('JOIN datn.BORROW_RETURN_DATE')
			expect(sqlArg).toContain('JOIN datn.BORROW_RETURN_ITEM')
		})
	})

	// =====================================================================
	// 3) findByUserBorrowReturnSlipDAO(userId)
	// =====================================================================
	describe('findByUserBorrowReturnSlipDAO(userId)', () => {
		// Test Case ID: TC_BRDAO_FINDBYUSER_01
		it('TC_BRDAO_FINDBYUSER_01 - resolve danh sách phiếu theo user', async () => {
			const rows = [{ ID: 3, USER_ID: 1 }, { ID: 2, USER_ID: 1 }]
			db.query.mockImplementation((sql, params, cb) => cb(null, rows))

			const result = await BorrowReturnDAO.findByUserBorrowReturnSlipDAO(1)
			expect(result).toBe(rows)
		})

		// Test Case ID: TC_BRDAO_FINDBYUSER_05
		it('TC_BRDAO_FINDBYUSER_05 - CheckDB: query dùng placeholder ? và params [userId]', async () => {
			db.query.mockImplementation((sql, params, cb) => cb(null, []))
			await BorrowReturnDAO.findByUserBorrowReturnSlipDAO(99)

			expect(db.query).toHaveBeenCalledTimes(1)
			const [sqlArg, paramsArg] = db.query.mock.calls[0]
			expect(sqlArg).toContain('WHERE brs.USER_ID = ?')
			expect(paramsArg).toEqual([99])
		})

		// Test Case ID: TC_BRDAO_FINDBYUSER_07
		it('TC_BRDAO_FINDBYUSER_07 - CheckDB: SQL có ORDER BY brs.ID DESC', async () => {
			db.query.mockImplementation((sql, params, cb) => cb(null, []))
			await BorrowReturnDAO.findByUserBorrowReturnSlipDAO(1)
			const [sqlArg] = db.query.mock.calls[0]
			expect(sqlArg).toContain('ORDER BY brs.ID DESC')
		})

		// Test Case ID: TC_BRDAO_FINDBYUSER_06
		it('TC_BRDAO_FINDBYUSER_06 - Security: userId injection payload vẫn truyền qua params (không nối chuỗi)', async () => {
			db.query.mockImplementation((sql, params, cb) => cb(null, []))
			await BorrowReturnDAO.findByUserBorrowReturnSlipDAO('1 OR 1=1')
			const [, paramsArg] = db.query.mock.calls[0]
			expect(paramsArg).toEqual(['1 OR 1=1'])
		})

		// Test Case ID: TC_BRDAO_FINDBYUSER_08
		it('TC_BRDAO_FINDBYUSER_08 - reject khi DB lỗi', async () => {
			const dbError = new Error('ECONNREFUSED')
			db.query.mockImplementation((sql, params, cb) => cb(dbError))
			await expect(BorrowReturnDAO.findByUserBorrowReturnSlipDAO(1)).rejects.toBe(dbError)
		})
	})

	// =====================================================================
	// 4) findAllBorrowReturnSlipDAO(data)
	// =====================================================================
	describe('findAllBorrowReturnSlipDAO(data)', () => {
		// Test Case ID: TC_BRDAO_FINDALLSLIP_01
		it('TC_BRDAO_FINDALLSLIP_01 - resolve chỉ dòng đầu tiên khi DB trả nhiều dòng (behavior hiện tại)', async () => {
			const rows = [
				{ BORROW_RETURN_SLIP_ID: 1, BORROW_RETURN_ITEM_ID: 100 },
				{ BORROW_RETURN_SLIP_ID: 2, BORROW_RETURN_ITEM_ID: 200 },
			]
			db.query.mockImplementation((sql, cb) => cb(null, rows))

			const result = await BorrowReturnDAO.findAllBorrowReturnSlipDAO({})
			expect(result).toEqual(rows[0])
		})

		// Test Case ID: TC_BRDAO_FINDALLSLIP_03
		it('TC_BRDAO_FINDALLSLIP_03 - DB trả [] -> resolve undefined', async () => {
			db.query.mockImplementation((sql, cb) => cb(null, []))
			const result = await BorrowReturnDAO.findAllBorrowReturnSlipDAO({})
			expect(result).toBeUndefined()
		})

		// Test Case ID: TC_BRDAO_FINDALLSLIP_04
		it('TC_BRDAO_FINDALLSLIP_04 - reject khi DB lỗi', async () => {
			const dbError = new Error('DB error')
			db.query.mockImplementation((sql, cb) => cb(dbError))
			await expect(BorrowReturnDAO.findAllBorrowReturnSlipDAO({})).rejects.toBe(dbError)
		})

		// Test Case ID: TC_BRDAO_FINDALLSLIP_05
		it('TC_BRDAO_FINDALLSLIP_05 - CheckDB: SQL JOIN đủ bảng slip/date/item', async () => {
			db.query.mockImplementation((sql, cb) => cb(null, []))
			await BorrowReturnDAO.findAllBorrowReturnSlipDAO({})
			const [sqlArg] = db.query.mock.calls[0]
			expect(sqlArg).toContain('FROM datn.BORROW_RETURN_SLIP')
			expect(sqlArg).toContain('JOIN datn.BORROW_RETURN_DATE')
			expect(sqlArg).toContain('JOIN datn.BORROW_RETURN_ITEM')
		})

		// Test Case ID: TC_BRDAO_FINDALLSLIP_10
		it('TC_BRDAO_FINDALLSLIP_10 - results=null -> promise reject (ghi nhận bug/edge)', async () => {
			db.query.mockImplementation((sql, cb) => cb(null, null))
			await expect(BorrowReturnDAO.findAllBorrowReturnSlipDAO({})).rejects.toBeInstanceOf(Error)
		})
	})

	// =====================================================================
	// 5) createBorrowReturnSlipDAO(data)
	// =====================================================================
	describe('createBorrowReturnSlipDAO(data)', () => {
		// Test Case ID: TC_BRDAO_CREATE_01
		it('TC_BRDAO_CREATE_01 - tạo phiếu mượn thiết bị 1 item thành công', async () => {
			const payload = createBorrowSlipPayload({
				equipments: [createBorrowReturnEquipmentItem({ ID: 10, EQUIPMENT_ITEM_Name: 'EPX200-001' })],
			})
			db.query.mockImplementation((sql, cb) => cb(null, [{ insertId: 123 }]))

			const result = await BorrowReturnDAO.createBorrowReturnSlipDAO(payload)
			expect(result).toEqual({
				borrowReturnSlipId: 123,
				equipments: [10],
				message: 'Tạo phiếu mượn thành công',
			})
		})

		// Test Case ID: TC_BRDAO_CREATE_03
		it('TC_BRDAO_CREATE_03 - tạo phiếu mượn phòng 1 item thành công', async () => {
			const payload = createBorrowSlipPayload({
				equipments: [createBorrowReturnRoomItem({ ID: 3 })],
			})
			db.query.mockImplementation((sql, cb) => cb(null, [{ insertId: 555 }]))

			const result = await BorrowReturnDAO.createBorrowReturnSlipDAO(payload)
			expect(result).toEqual({
				borrowReturnSlipId: 555,
				equipments: [3],
				message: 'Tạo phiếu mượn thành công',
			})
		})

		// Test Case ID: TC_BRDAO_CREATE_05
		it("TC_BRDAO_CREATE_05 - CheckDB: SQL insert BORROW_RETURN_SLIP status 'Chưa trả'", async () => {
			const payload = createBorrowSlipPayload()
			db.query.mockImplementation((sql, cb) => cb(null, [{ insertId: 1 }]))

			await BorrowReturnDAO.createBorrowReturnSlipDAO(payload)
			const [sqlArg] = db.query.mock.calls[0]
			expect(sqlArg).toContain("INSERT INTO datn.BORROW_RETURN_SLIP")
			expect(sqlArg).toContain("('Chưa trả'")
		})

		// Test Case ID: TC_BRDAO_CREATE_06
		it('TC_BRDAO_CREATE_06 - CheckDB: SQL có LAST_INSERT_ID() và @slipId', async () => {
			const payload = createBorrowSlipPayload()
			db.query.mockImplementation((sql, cb) => cb(null, [{ insertId: 1 }]))
			await BorrowReturnDAO.createBorrowReturnSlipDAO(payload)
			const [sqlArg] = db.query.mock.calls[0]
			expect(sqlArg).toContain('LAST_INSERT_ID()')
			expect(sqlArg).toContain('@slipId')
		})

		// Test Case ID: TC_BRDAO_CREATE_10
		it("TC_BRDAO_CREATE_10 - CheckDB: equipment branch update status 'Đang mượn'", async () => {
			const payload = createBorrowSlipPayload({
				equipments: [createBorrowReturnEquipmentItem({ ID: 10, EQUIPMENT_ITEM_Name: 'EPX200-001' })],
			})
			db.query.mockImplementation((sql, cb) => cb(null, [{ insertId: 1 }]))
			await BorrowReturnDAO.createBorrowReturnSlipDAO(payload)
			const [sqlArg] = db.query.mock.calls[0]
			expect(sqlArg).toContain("UPDATE datn.EQUIPMENT_ITEM")
			expect(sqlArg).toContain("SET EQUIPMENT_ITEM_Status = 'Đang mượn'")
		})

		// Test Case ID: TC_BRDAO_CREATE_11
		it("TC_BRDAO_CREATE_11 - CheckDB: room branch update status 'Đang mượn'", async () => {
			const payload = createBorrowSlipPayload({
				equipments: [createBorrowReturnRoomItem({ ID: 3 })],
			})
			db.query.mockImplementation((sql, cb) => cb(null, [{ insertId: 1 }]))
			await BorrowReturnDAO.createBorrowReturnSlipDAO(payload)
			const [sqlArg] = db.query.mock.calls[0]
			expect(sqlArg).toContain('UPDATE datn.ROOM')
			expect(sqlArg).toContain("SET ROOM_Status = 'Đang mượn'")
		})

		// Test Case ID: TC_BRDAO_CREATE_20
		it('TC_BRDAO_CREATE_20 - reject khi db.query trả lỗi', async () => {
			const payload = createBorrowSlipPayload()
			const dbError = new Error('Insert failed')
			db.query.mockImplementation((sql, cb) => cb(dbError))
			await expect(BorrowReturnDAO.createBorrowReturnSlipDAO(payload)).rejects.toBe(dbError)
		})

		// Test Case ID: TC_BRDAO_CREATE_15
		it('TC_BRDAO_CREATE_15 - equipments=[] -> throw (ghi nhận validate thiếu)', () => {
			const payload = createBorrowSlipPayload({ equipments: [] })
			expect(() => BorrowReturnDAO.createBorrowReturnSlipDAO(payload)).toThrow()
		})
	})

	// =====================================================================
	// 6) borrowReturnSlipDAO(data)
	// =====================================================================
	describe('borrowReturnSlipDAO(data)', () => {
		// Test Case ID: TC_BRDAO_RETURN_01
		it('TC_BRDAO_RETURN_01 - reject khi data không phải array', async () => {
			await expect(BorrowReturnDAO.borrowReturnSlipDAO(null)).rejects.toThrow('Data is empty or invalid')
		})

		// Test Case ID: TC_BRDAO_RETURN_02
		it('TC_BRDAO_RETURN_02 - reject khi data=[]', async () => {
			await expect(BorrowReturnDAO.borrowReturnSlipDAO([])).rejects.toThrow('Data is empty or invalid')
		})

		// Test Case ID: TC_BRDAO_RETURN_06
		it('TC_BRDAO_RETURN_06 - reject khi slipId không hợp lệ', async () => {
			const payload = [createReturnSlipRow({ BORROW_RETURN_SLIP_ID: 'abc' })]
			await expect(BorrowReturnDAO.borrowReturnSlipDAO(payload)).rejects.toThrow('Invalid BORROW_RETURN_SLIP_ID')
		})

		// Test Case ID: TC_BRDAO_RETURN_08
		it('TC_BRDAO_RETURN_08 - beginTransaction lỗi -> reject và không query', async () => {
			const payload = [createReturnSlipRow({ BORROW_RETURN_SLIP_ID: 1 })]
			const txError = new Error('TX begin failed')
			db.beginTransaction.mockImplementation(cb => cb(txError))

			await expect(BorrowReturnDAO.borrowReturnSlipDAO(payload)).rejects.toBe(txError)
			expect(db.query).not.toHaveBeenCalled()
		})

		// Test Case ID: TC_BRDAO_RETURN_10
		it('TC_BRDAO_RETURN_10 - update slip lỗi -> rollback + reject', async () => {
			const payload = [createReturnSlipRow({ BORROW_RETURN_SLIP_ID: 1 })]
			const dbError = new Error('Update slip failed')
			mockQueryCallsInOrder([
				({ cb }) => cb(dbError),
			])

			await expect(BorrowReturnDAO.borrowReturnSlipDAO(payload)).rejects.toBe(dbError)
			expect(db.rollback).toHaveBeenCalledTimes(1)
			// Rollback: đảm bảo không commit
			expect(db.commit).not.toHaveBeenCalled()
		})

		// Test Case ID: TC_BRDAO_RETURN_12
		it('TC_BRDAO_RETURN_12 - update date lỗi -> rollback + reject', async () => {
			const payload = [createReturnSlipRow({ BORROW_RETURN_SLIP_ID: 1 })]
			const dbError = new Error('Update date failed')
			mockQueryCallsInOrder([
				({ cb }) => cb(null),
				({ cb }) => cb(dbError),
			])

			await expect(BorrowReturnDAO.borrowReturnSlipDAO(payload)).rejects.toBe(dbError)
			expect(db.rollback).toHaveBeenCalledTimes(1)
			expect(db.commit).not.toHaveBeenCalled()
		})

		// Test Case ID: TC_BRDAO_RETURN_13
		it("TC_BRDAO_RETURN_13 - trả thiết bị 1 item: 'Đang mượn' -> 'Có sẵn' và commit", async () => {
			const payload = [
				createReturnSlipRow({
					BORROW_RETURN_SLIP_ID: 1,
					items: [
						{ EQUIPMENT_ITEM_ID: 10, EQUIPMENT_ITEM_Status: 'Đang mượn' },
					],
				}),
			]

			mockQueryCallsInOrder([
				// 1) update slip
				({ sql, params, cb }) => {
					expect(sql).toContain("UPDATE datn.BORROW_RETURN_SLIP")
					expect(params).toEqual([1])
					cb(null)
				},
				// 2) update date
				({ sql, params, cb }) => {
					expect(sql).toContain('CONVERT_TZ(NOW()')
					expect(params).toEqual([1])
					cb(null)
				},
				// 3) update equipment status
				({ sql, params, cb }) => {
					expect(sql).toContain('UPDATE datn.EQUIPMENT_ITEM')
					expect(params).toEqual(['Có sẵn', 10])
					cb(null)
				},
			])

			const result = await BorrowReturnDAO.borrowReturnSlipDAO(payload)
			expect(result).toBe(true)
			expect(db.commit).toHaveBeenCalledTimes(1)
			expect(db.rollback).not.toHaveBeenCalled()
		})

		// Test Case ID: TC_BRDAO_RETURN_16
		it('TC_BRDAO_RETURN_16 - trả thiết bị: thiếu EQUIPMENT_ITEM_ID -> rollback + reject error cụ thể', async () => {
			const payload = [
				createReturnSlipRow({
					BORROW_RETURN_SLIP_ID: 1,
					// Đảm bảo vào nhánh thiết bị: items[0] phải có EQUIPMENT_ITEM_ID.
					items: [
						{ EQUIPMENT_ITEM_ID: 10, EQUIPMENT_ITEM_Status: 'Đang mượn' },
						{ EQUIPMENT_ITEM_Status: 'Đang mượn' },
					],
				}),
			]
			mockQueryCallsInOrder([
				({ cb }) => cb(null),
				({ cb }) => cb(null),
				// Update cho item đầu tiên OK; item thứ 2 thiếu ID sẽ rollback trước khi gọi db.query.
				({ cb }) => cb(null),
			])

			await expect(BorrowReturnDAO.borrowReturnSlipDAO(payload)).rejects.toThrow('EQUIPMENT_ITEM_ID missing')
			expect(db.rollback).toHaveBeenCalledTimes(1)
			expect(db.commit).not.toHaveBeenCalled()
		})

		// Test Case ID: TC_BRDAO_RETURN_17
		it('TC_BRDAO_RETURN_17 - trả thiết bị: update 1 item lỗi -> rollback + reject', async () => {
			const payload = [createReturnSlipRow({ BORROW_RETURN_SLIP_ID: 1 })]
			const dbError = new Error('Update equipment failed')
			mockQueryCallsInOrder([
				({ cb }) => cb(null),
				({ cb }) => cb(null),
				({ cb }) => cb(dbError),
			])

			await expect(BorrowReturnDAO.borrowReturnSlipDAO(payload)).rejects.toBe(dbError)
			expect(db.rollback).toHaveBeenCalledTimes(1)
			expect(db.commit).not.toHaveBeenCalled()
		})

		// Test Case ID: TC_BRDAO_RETURN_18
		it('TC_BRDAO_RETURN_18 - commit callback trả lỗi -> reject', async () => {
			const payload = [createReturnSlipRow({ BORROW_RETURN_SLIP_ID: 1 })]
			const commitError = new Error('Commit failed')
			db.commit.mockImplementation(cb => cb && cb(commitError))
			mockQueryCallsInOrder([
				({ cb }) => cb(null),
				({ cb }) => cb(null),
				({ cb }) => cb(null),
			])

			await expect(BorrowReturnDAO.borrowReturnSlipDAO(payload)).rejects.toBe(commitError)
			expect(db.rollback).not.toHaveBeenCalled()
		})

		// Test Case ID: TC_BRDAO_RETURN_20
		it("TC_BRDAO_RETURN_20 - trả phòng: 'Đang mượn' -> 'Có sẵn' và commit", async () => {
			const payload = [
				createReturnSlipRow({
					BORROW_RETURN_SLIP_ID: 2,
					items: [{ ROOM_ID: 3, ROOM_Status: 'Đang mượn' }],
				}),
			]

			mockQueryCallsInOrder([
				({ cb }) => cb(null),
				({ cb }) => cb(null),
				({ sql, params, cb }) => {
					expect(sql).toContain('UPDATE datn.ROOM')
					expect(params).toEqual(['Có sẵn', 3])
					cb(null)
				},
			])

			const result = await BorrowReturnDAO.borrowReturnSlipDAO(payload)
			expect(result).toBe(true)
			expect(db.commit).toHaveBeenCalledTimes(1)
			expect(db.rollback).not.toHaveBeenCalled()
		})

		// Test Case ID: TC_BRDAO_RETURN_22
		it('TC_BRDAO_RETURN_22 - trả phòng: thiếu ROOM_ID -> rollback + reject', async () => {
			const payload = [
				createReturnSlipRow({
					BORROW_RETURN_SLIP_ID: 2,
					items: [{ ROOM_Status: 'Đang mượn' }],
				}),
			]
			mockQueryCallsInOrder([
				({ cb }) => cb(null),
				({ cb }) => cb(null),
			])
			await expect(BorrowReturnDAO.borrowReturnSlipDAO(payload)).rejects.toThrow('ROOM_ID or status not found')
			expect(db.rollback).toHaveBeenCalledTimes(1)
			expect(db.commit).not.toHaveBeenCalled()
		})
	})
})
