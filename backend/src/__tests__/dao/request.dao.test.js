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
const RequestDAO = require('../../module/request/request.dao')


/**
 * RequestDAO - Unit tests (DAO layer)
 *
 * Mục tiêu:
 * - CheckDB: xác minh DAO tạo đúng SQL / params / thứ tự gọi db.
 * - Rollback semantics: với các flow có transaction, verify commit/rollback đúng khi success/error.
 * - Isolation: test mock hoàn toàn `configDB`, không đụng DB thật; reset mocks giữa các test.
 */

function createRequestItem(overrides = {}) {
	return {
		ID: 10,
		EQUIPMENT_ITEM_Name: 'EPX200-001',
		EQUIPMENT_ITEM_Description: 'Máy chiếu',
		EQUIPMENT_TYPE_Name: 'Projector',
		EQUIPMENT_ITEM_Status: 'Đề xuất',
		REQUEST_ITEM_Status: 'Chưa duyệt',
		...overrides,
	}
}

function createRequestSlipPayload(overrides = {}) {
	return {
		REQUEST_SLIP_Name: 'Yêu cầu mua mới thiết bị',
		REQUEST_SLIP_Note: 'Ghi chú yêu cầu',
		USER_ID: 5,
		items: [createRequestItem()],
		...overrides,
	}
}

function captureDbQueryCalls() {
	/**
	 * Helper để capture tất cả call `db.query` và cho phép test tự quyết định khi nào gọi callback.
	 * - Hỗ trợ signature: (sql, cb) hoặc (sql, params, cb)
	 */
	const calls = []
	db.query.mockImplementation((sql, paramsOrCb, maybeCb) => {
		const cb = typeof paramsOrCb === 'function' ? paramsOrCb : maybeCb
		const params = typeof paramsOrCb === 'function' ? undefined : paramsOrCb
		calls.push({ sql, params, cb })
	})
	return calls
}

describe('backend/src/module/request/request.dao.js - RequestDAO (DAO Layer)', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		// Đảm bảo Promise luôn settle trong test.
		db.beginTransaction.mockImplementation(cb => cb && cb(null))
		db.commit.mockImplementation(cb => cb && cb(null))
		db.rollback.mockImplementation(cb => cb && cb())
	})

	// =====================================================================
	// 1) requestSlip(data)
	// =====================================================================
	describe('requestSlip(data)', () => {
		// Test Case ID: TC_REQDAO_REQSLIP_06
		it('TC_REQDAO_REQSLIP_06 - CheckDB: gọi beginTransaction đúng 1 lần', async () => {
			const queryCalls = captureDbQueryCalls()
			const payload = createRequestSlipPayload({ items: [] })

			const promise = RequestDAO.requestSlip(payload)
			// 1) insert slip
			expect(queryCalls).toHaveLength(1)
			queryCalls[0].cb(null, { insertId: 123 })
			await promise

			expect(db.beginTransaction).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_REQDAO_REQSLIP_01
		it('TC_REQDAO_REQSLIP_01 - tạo phiếu yêu cầu thành công với 1 item', async () => {
			const queryCalls = captureDbQueryCalls()
			const payload = createRequestSlipPayload({
				items: [createRequestItem({ ID: 10, EQUIPMENT_ITEM_Name: 'EPX200-001' })],
			})

			const promise = RequestDAO.requestSlip(payload)
			// 1) insert slip
			expect(queryCalls).toHaveLength(1)
			queryCalls[0].cb(null, { insertId: 555 })
			// 2) insert item
			expect(queryCalls).toHaveLength(2)
			queryCalls[1].cb(null)

			await expect(promise).resolves.toEqual({ slipId: 555 })
			expect(db.commit).toHaveBeenCalledTimes(1)
			expect(db.rollback).not.toHaveBeenCalled()
		})

		// Test Case ID: TC_REQDAO_REQSLIP_02
		it('TC_REQDAO_REQSLIP_02 - tạo phiếu yêu cầu thành công với 3 items, commit chỉ sau item cuối', async () => {
			const queryCalls = captureDbQueryCalls()
			const payload = createRequestSlipPayload({
				items: [
					createRequestItem({ ID: 1, EQUIPMENT_ITEM_Name: 'TB-1' }),
					createRequestItem({ ID: 2, EQUIPMENT_ITEM_Name: 'TB-2' }),
					createRequestItem({ ID: 3, EQUIPMENT_ITEM_Name: 'TB-3' }),
				],
			})

			let commitCalledAt = 0
			db.commit.mockImplementation(cb => {
				commitCalledAt = queryCalls.length
				cb && cb(null)
			})

			const promise = RequestDAO.requestSlip(payload)
			queryCalls[0].cb(null, { insertId: 999 })

			// Sau khi insert slip, phải có đúng 3 call insert item.
			expect(queryCalls).toHaveLength(1 + 3)
			expect(db.commit).not.toHaveBeenCalled()

			// Callback items về out-of-order; commit vẫn chỉ xảy ra khi đủ 3.
			queryCalls[2].cb(null)
			expect(db.commit).not.toHaveBeenCalled()
			queryCalls[1].cb(null)
			expect(db.commit).not.toHaveBeenCalled()
			queryCalls[3].cb(null)

			await expect(promise).resolves.toEqual({ slipId: 999 })
			expect(db.commit).toHaveBeenCalledTimes(1)
			// commitCalledAt = tổng số queryCalls đã được register tại thời điểm commit.
			expect(commitCalledAt).toBe(4)
		})

		// Test Case ID: TC_REQDAO_REQSLIP_03
		it('TC_REQDAO_REQSLIP_03 - items=[] -> commit và resolve slipId (không insert item)', async () => {
			const queryCalls = captureDbQueryCalls()
			const payload = createRequestSlipPayload({ items: [] })

			const promise = RequestDAO.requestSlip(payload)
			queryCalls[0].cb(null, { insertId: 123 })
			await expect(promise).resolves.toEqual({ slipId: 123 })

			expect(db.query).toHaveBeenCalledTimes(1)
			expect(db.commit).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_REQDAO_REQSLIP_04
		it('TC_REQDAO_REQSLIP_04 - items=null (không phải array) -> commit và resolve slipId', async () => {
			const queryCalls = captureDbQueryCalls()
			const payload = createRequestSlipPayload({ items: null })

			const promise = RequestDAO.requestSlip(payload)
			queryCalls[0].cb(null, { insertId: 77 })
			await expect(promise).resolves.toEqual({ slipId: 77 })
			expect(db.query).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_REQDAO_REQSLIP_05
		it('TC_REQDAO_REQSLIP_05 - không truyền items -> commit và resolve slipId', async () => {
			const queryCalls = captureDbQueryCalls()
			const payload = createRequestSlipPayload()
			delete payload.items

			const promise = RequestDAO.requestSlip(payload)
			queryCalls[0].cb(null, { insertId: 888 })
			await expect(promise).resolves.toEqual({ slipId: 888 })
			// Chỉ insert slip, không insert item.
			expect(db.query).toHaveBeenCalledTimes(1)
			expect(db.commit).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_REQDAO_REQSLIP_07
		it('TC_REQDAO_REQSLIP_07 - CheckDB: Insert slip dùng placeholder ? và truyền đúng slipValues', async () => {
			const queryCalls = captureDbQueryCalls()
			const payload = createRequestSlipPayload({
				REQUEST_SLIP_Name: "x'); DROP TABLE datn.REQUEST_SLIP; --",
				REQUEST_SLIP_Note: "I'm ok",
				USER_ID: 42,
				items: [],
			})

			const promise = RequestDAO.requestSlip(payload)
			expect(queryCalls).toHaveLength(1)
			const { sql, params } = queryCalls[0]
			expect(sql).toContain('INSERT INTO datn.REQUEST_SLIP')
			expect(sql).toContain('VALUES (?, NOW(), ?, ?, NULL, ?, NULL)')
			expect(params).toEqual([
				payload.REQUEST_SLIP_Name,
				'Chưa duyệt',
				payload.REQUEST_SLIP_Note,
				payload.USER_ID,
			])

			queryCalls[0].cb(null, { insertId: 1 })
			await expect(promise).resolves.toEqual({ slipId: 1 })
		})

		// Test Case ID: TC_REQDAO_REQSLIP_12
		it('TC_REQDAO_REQSLIP_12 - CheckDB: Insert item truyền đúng 7 params theo thứ tự', async () => {
			const queryCalls = captureDbQueryCalls()
			const payload = createRequestSlipPayload({
				items: [
					createRequestItem({
						ID: 88,
						EQUIPMENT_ITEM_Name: 'TB-88',
						EQUIPMENT_ITEM_Description: 'Mô tả 88',
						EQUIPMENT_TYPE_Name: 'Type-88',
						EQUIPMENT_ITEM_Status: 'Đề xuất',
						REQUEST_ITEM_Status: 'Chưa duyệt',
					}),
				],
			})

			const promise = RequestDAO.requestSlip(payload)
			queryCalls[0].cb(null, { insertId: 321 })

			expect(queryCalls).toHaveLength(2)
			const itemCall = queryCalls[1]
			expect(itemCall.sql).toContain('INSERT INTO datn.REQUEST_ITEM')
			expect(itemCall.params).toEqual([
				321,
				'TB-88',
				'Mô tả 88',
				'Type-88',
				'Đề xuất',
				'Chưa duyệt',
				88,
			])

			itemCall.cb(null)
			await expect(promise).resolves.toEqual({ slipId: 321 })
		})

		// Test Case ID: TC_REQDAO_REQSLIP_14
		it('TC_REQDAO_REQSLIP_14 - beginTransaction lỗi -> reject và không gọi query', async () => {
			const payload = createRequestSlipPayload({ items: [] })
			const txError = new Error('TX begin failed')
			db.beginTransaction.mockImplementation(cb => cb && cb(txError))

			await expect(RequestDAO.requestSlip(payload)).rejects.toBe(txError)
			expect(db.query).not.toHaveBeenCalled()
		})

		// Test Case ID: TC_REQDAO_REQSLIP_15
		it('TC_REQDAO_REQSLIP_15 - insert slip lỗi -> rollback + reject', async () => {
			const queryCalls = captureDbQueryCalls()
			const payload = createRequestSlipPayload({ items: [] })
			const dbError = new Error('Insert slip failed')

			const promise = RequestDAO.requestSlip(payload)
			queryCalls[0].cb(dbError)

			await expect(promise).rejects.toBe(dbError)
			expect(db.rollback).toHaveBeenCalledTimes(1)
			expect(db.commit).not.toHaveBeenCalled()
		})

		// Test Case ID: TC_REQDAO_REQSLIP_16
		it('TC_REQDAO_REQSLIP_16 - insert item lỗi -> rollback + reject, không commit', async () => {
			const queryCalls = captureDbQueryCalls()
			const payload = createRequestSlipPayload({
				items: [
					createRequestItem({ ID: 1, EQUIPMENT_ITEM_Name: 'TB-1' }),
					createRequestItem({ ID: 2, EQUIPMENT_ITEM_Name: 'TB-2' }),
				],
			})
			const dbError = new Error('Insert item failed')

			const promise = RequestDAO.requestSlip(payload)
			queryCalls[0].cb(null, { insertId: 11 })
			// item1 ok
			queryCalls[1].cb(null)
			// item2 error
			queryCalls[2].cb(dbError)

			await expect(promise).rejects.toBe(dbError)
			expect(db.rollback).toHaveBeenCalledTimes(1)
			expect(db.commit).not.toHaveBeenCalled()
		})

		// Test Case ID: TC_REQDAO_REQSLIP_17
		it('TC_REQDAO_REQSLIP_17 - commit lỗi (no item path) -> reject commit err', async () => {
			const queryCalls = captureDbQueryCalls()
			const payload = createRequestSlipPayload({ items: [] })
			const commitError = new Error('Commit failed')
			db.commit.mockImplementation(cb => cb && cb(commitError))

			const promise = RequestDAO.requestSlip(payload)
			queryCalls[0].cb(null, { insertId: 1 })
			await expect(promise).rejects.toBe(commitError)
			// Lưu ý: nhánh này không rollback trong code khi commit fail.
			expect(db.rollback).not.toHaveBeenCalled()
		})

		// Test Case ID: TC_REQDAO_REQSLIP_18
		it('TC_REQDAO_REQSLIP_18 - commit lỗi (after items) -> reject commit err', async () => {
			const queryCalls = captureDbQueryCalls()
			const payload = createRequestSlipPayload({ items: [createRequestItem()] })
			const commitError = new Error('Commit failed')
			db.commit.mockImplementation(cb => cb && cb(commitError))

			const promise = RequestDAO.requestSlip(payload)
			queryCalls[0].cb(null, { insertId: 2 })
			queryCalls[1].cb(null)
			await expect(promise).rejects.toBe(commitError)
			expect(db.rollback).not.toHaveBeenCalled()
		})
	})

	// =====================================================================
	// 2) getAllRequestSlip()
	// =====================================================================
	describe('getAllRequestSlip()', () => {
		// Test Case ID: TC_REQDAO_GETALL_01
		it('TC_REQDAO_GETALL_01 - resolve danh sách khi DB trả nhiều dòng', async () => {
			const rows = [
				{ REQUEST_SLIP_ID: 1, REQUEST_ITEM_ID: 11, USER_FullName: 'Nguyễn Văn A' },
				{ REQUEST_SLIP_ID: 2, REQUEST_ITEM_ID: null, USER_FullName: null },
			]
			db.query.mockImplementation((sql, cb) => cb(null, rows))
			await expect(RequestDAO.getAllRequestSlip()).resolves.toBe(rows)
		})

		// Test Case ID: TC_REQDAO_GETALL_02
		it('TC_REQDAO_GETALL_02 - resolve [] khi DB trả []', async () => {
			db.query.mockImplementation((sql, cb) => cb(null, []))
			await expect(RequestDAO.getAllRequestSlip()).resolves.toEqual([])
		})

		// Test Case ID: TC_REQDAO_GETALL_08
		it('TC_REQDAO_GETALL_08 - reject khi db.query trả lỗi', async () => {
			const dbError = new Error('DB timeout')
			db.query.mockImplementation((sql, cb) => cb(dbError))
			await expect(RequestDAO.getAllRequestSlip()).rejects.toBe(dbError)
		})

		// Test Case ID: TC_REQDAO_GETALL_09
		it('TC_REQDAO_GETALL_09 - DB trả results=null -> resolve null (ghi nhận behavior hiện tại)', async () => {
			db.query.mockImplementation((sql, cb) => cb(null, null))
			await expect(RequestDAO.getAllRequestSlip()).resolves.toBeNull()
		})

		// Test Case ID: TC_REQDAO_GETALL_05
		it('TC_REQDAO_GETALL_05 - CheckDB: SQL có ORDER BY RequestDate DESC', async () => {
			db.query.mockImplementation((sql, cb) => cb(null, []))
			await RequestDAO.getAllRequestSlip()
			const [sqlArg] = db.query.mock.calls[0]
			expect(sqlArg).toContain('ORDER BY rs.REQUEST_SLIP_RequestDate DESC')
		})

		// Test Case ID: TC_REQDAO_GETALL_06
		it('TC_REQDAO_GETALL_06 - CheckDB: SQL có LEFT JOIN REQUEST_ITEM', async () => {
			db.query.mockImplementation((sql, cb) => cb(null, []))
			await RequestDAO.getAllRequestSlip()
			const [sqlArg] = db.query.mock.calls[0]
			expect(sqlArg).toContain('LEFT JOIN datn.REQUEST_ITEM')
		})

		// Test Case ID: TC_REQDAO_GETALL_07
		it('TC_REQDAO_GETALL_07 - CheckDB: SQL có LEFT JOIN USER u', async () => {
			db.query.mockImplementation((sql, cb) => cb(null, []))
			await RequestDAO.getAllRequestSlip()
			const [sqlArg] = db.query.mock.calls[0]
			expect(sqlArg).toContain('LEFT JOIN datn.USER u')
		})

		// Test Case ID: TC_REQDAO_GETALL_15
		it('TC_REQDAO_GETALL_15 - CheckDB: gọi db.query(sql, cb) không truyền params', async () => {
			db.query.mockImplementation((sql, cb) => cb(null, []))
			await RequestDAO.getAllRequestSlip()
			expect(db.query).toHaveBeenCalledTimes(1)
			expect(db.query.mock.calls[0]).toHaveLength(2)
		})
	})

	// =====================================================================
	// 3) approvedSlip(data)
	// =====================================================================
	describe('approvedSlip(data)', () => {
		// Test Case ID: TC_REQDAO_APPROVE_01
		it('TC_REQDAO_APPROVE_01 - items=[] -> commit và resolve message no-item', async () => {
			const queryCalls = captureDbQueryCalls()
			const payload = {
				REQUEST_SLIP_ID: 1,
				REQUEST_SLIP_Status: 'Đã duyệt',
				REQUEST_SLIP_ApproveNotes: 'OK',
				items: [],
			}

			const promise = RequestDAO.approvedSlip(payload)
			// 1) update slip
			expect(queryCalls).toHaveLength(1)
			queryCalls[0].cb(null)
			await expect(promise).resolves.toEqual({ message: 'Duyệt phiếu (không có item)' })
			expect(db.commit).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_REQDAO_APPROVE_12
		it('TC_REQDAO_APPROVE_12 - items=null -> coi như [] và resolve message no-item', async () => {
			const queryCalls = captureDbQueryCalls()
			const payload = {
				REQUEST_SLIP_ID: 1,
				REQUEST_SLIP_Status: 'Đã duyệt',
				REQUEST_SLIP_ApproveNotes: 'OK',
				items: null,
			}

			const promise = RequestDAO.approvedSlip(payload)
			queryCalls[0].cb(null)
			await expect(promise).resolves.toEqual({ message: 'Duyệt phiếu (không có item)' })
			// Chỉ update slip, không update EQUIPMENT_ITEM.
			expect(db.query).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_REQDAO_APPROVE_11
		it('TC_REQDAO_APPROVE_11 - items undefined -> coi như [] và resolve message no-item', async () => {
			const queryCalls = captureDbQueryCalls()
			const payload = {
				REQUEST_SLIP_ID: 1,
				REQUEST_SLIP_Status: 'Đã duyệt',
				REQUEST_SLIP_ApproveNotes: 'OK',
			}

			const promise = RequestDAO.approvedSlip(payload)
			queryCalls[0].cb(null)
			await expect(promise).resolves.toEqual({ message: 'Duyệt phiếu (không có item)' })
		})

		// Test Case ID: TC_REQDAO_APPROVE_05
		it('TC_REQDAO_APPROVE_05 - CheckDB: update REQUEST_SLIP dùng params [status, notes, slipId]', async () => {
			const queryCalls = captureDbQueryCalls()
			const payload = {
				REQUEST_SLIP_ID: 99,
				REQUEST_SLIP_Status: 'Từ chối',
				REQUEST_SLIP_ApproveNotes: 'Không đủ ngân sách',
				items: [],
			}

			const promise = RequestDAO.approvedSlip(payload)
			expect(queryCalls).toHaveLength(1)
			expect(queryCalls[0].sql).toContain('UPDATE datn.REQUEST_SLIP')
			expect(queryCalls[0].sql).toContain('SET REQUEST_SLIP_Status = ?, REQUEST_SLIP_ApproveNotes = ?')
			expect(queryCalls[0].params).toEqual([
				'Từ chối',
				'Không đủ ngân sách',
				99,
			])

			queryCalls[0].cb(null)
			await expect(promise).resolves.toEqual({ message: 'Duyệt phiếu (không có item)' })
		})

		// Test Case ID: TC_REQDAO_APPROVE_02
		it('TC_REQDAO_APPROVE_02 - có 1 item -> update thiết bị và commit', async () => {
			const queryCalls = captureDbQueryCalls()
			const payload = {
				REQUEST_SLIP_ID: 1,
				REQUEST_SLIP_Status: 'Đã duyệt',
				REQUEST_SLIP_ApproveNotes: 'OK',
				items: [{ EQUIPMENT_ITEM_Name: 'EPX200-001' }],
			}

			const promise = RequestDAO.approvedSlip(payload)
			queryCalls[0].cb(null)
			expect(queryCalls).toHaveLength(2)
			// 2) update equipment by name
			expect(queryCalls[1].sql).toContain('UPDATE datn.EQUIPMENT_ITEM')
			expect(queryCalls[1].sql).toContain("SET EQUIPMENT_ITEM_Status = 'Có sẵn'")
			expect(queryCalls[1].sql).toContain('WHERE EQUIPMENT_ITEM_Name = ?')
			expect(queryCalls[1].params).toEqual(['EPX200-001'])

			queryCalls[1].cb(null)
			await expect(promise).resolves.toEqual({ message: 'Duyệt phiếu & cập nhật thiết bị thành công' })
			expect(db.commit).toHaveBeenCalledTimes(1)
			expect(db.rollback).not.toHaveBeenCalled()
		})

		// Test Case ID: TC_REQDAO_APPROVE_03
		it('TC_REQDAO_APPROVE_03 - nhiều item (3) -> commit sau khi update đủ 3', async () => {
			const queryCalls = captureDbQueryCalls()
			const payload = {
				REQUEST_SLIP_ID: 2,
				REQUEST_SLIP_Status: 'Đã duyệt',
				REQUEST_SLIP_ApproveNotes: 'OK',
				items: [
					{ EQUIPMENT_ITEM_Name: 'TB-1' },
					{ EQUIPMENT_ITEM_Name: 'TB-2' },
					{ EQUIPMENT_ITEM_Name: 'TB-3' },
				],
			}

			const promise = RequestDAO.approvedSlip(payload)
			queryCalls[0].cb(null)
			expect(queryCalls).toHaveLength(4)
			expect(db.commit).not.toHaveBeenCalled()
			// out-of-order callbacks
			queryCalls[2].cb(null)
			expect(db.commit).not.toHaveBeenCalled()
			queryCalls[1].cb(null)
			expect(db.commit).not.toHaveBeenCalled()
			queryCalls[3].cb(null)

			await expect(promise).resolves.toEqual({ message: 'Duyệt phiếu & cập nhật thiết bị thành công' })
			expect(db.commit).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_REQDAO_APPROVE_08
		it('TC_REQDAO_APPROVE_08 - beginTransaction lỗi -> reject và không query', async () => {
			const txError = new Error('TX begin failed')
			db.beginTransaction.mockImplementation(cb => cb && cb(txError))
			await expect(RequestDAO.approvedSlip({})).rejects.toBe(txError)
			expect(db.query).not.toHaveBeenCalled()
		})

		// Test Case ID: TC_REQDAO_APPROVE_09
		it('TC_REQDAO_APPROVE_09 - update slip lỗi -> rollback + reject', async () => {
			const queryCalls = captureDbQueryCalls()
			const payload = {
				REQUEST_SLIP_ID: 1,
				REQUEST_SLIP_Status: 'Đã duyệt',
				REQUEST_SLIP_ApproveNotes: 'OK',
				items: [],
			}
			const dbError = new Error('Update slip failed')

			const promise = RequestDAO.approvedSlip(payload)
			queryCalls[0].cb(dbError)
			await expect(promise).rejects.toBe(dbError)
			expect(db.rollback).toHaveBeenCalledTimes(1)
			expect(db.commit).not.toHaveBeenCalled()
		})

		// Test Case ID: TC_REQDAO_APPROVE_10
		it('TC_REQDAO_APPROVE_10 - update thiết bị lỗi -> rollback + reject', async () => {
			const queryCalls = captureDbQueryCalls()
			const payload = {
				REQUEST_SLIP_ID: 1,
				REQUEST_SLIP_Status: 'Đã duyệt',
				REQUEST_SLIP_ApproveNotes: 'OK',
				items: [{ EQUIPMENT_ITEM_Name: 'EPX200-001' }],
			}
			const dbError = new Error('Update equipment failed')

			const promise = RequestDAO.approvedSlip(payload)
			queryCalls[0].cb(null)
			queryCalls[1].cb(dbError)
			await expect(promise).rejects.toBe(dbError)
			expect(db.rollback).toHaveBeenCalledTimes(1)
			expect(db.commit).not.toHaveBeenCalled()
		})

		// Test Case ID: TC_REQDAO_APPROVE_17
		it("TC_REQDAO_APPROVE_17 - status='Từ chối' nhưng có items: vẫn update thiết bị (behavior hiện tại)", async () => {
			const queryCalls = captureDbQueryCalls()
			const payload = {
				REQUEST_SLIP_ID: 7,
				REQUEST_SLIP_Status: 'Từ chối',
				REQUEST_SLIP_ApproveNotes: 'Không hợp lệ',
				items: [{ EQUIPMENT_ITEM_Name: 'TB-REFUSE-1' }],
			}

			const promise = RequestDAO.approvedSlip(payload)
			queryCalls[0].cb(null)
			expect(queryCalls[1].sql).toContain('UPDATE datn.EQUIPMENT_ITEM')
			expect(queryCalls[1].params).toEqual(['TB-REFUSE-1'])
			queryCalls[1].cb(null)
			await expect(promise).resolves.toEqual({ message: 'Duyệt phiếu & cập nhật thiết bị thành công' })
		})

		// Test Case ID: TC_REQDAO_APPROVE_30
		it('TC_REQDAO_APPROVE_30 - commit callback nhận err vẫn resolve (ghi nhận behavior hiện tại)', async () => {
			const queryCalls = captureDbQueryCalls()
			const payload = {
				REQUEST_SLIP_ID: 1,
				REQUEST_SLIP_Status: 'Đã duyệt',
				REQUEST_SLIP_ApproveNotes: 'OK',
				items: [],
			}
			// Code gọi db.commit(() => resolve(...)) nên nếu commit callback bị gọi với err,
			// arrow function bỏ qua arg => vẫn resolve.
			db.commit.mockImplementation(cb => cb && cb(new Error('Commit failed but ignored')))

			const promise = RequestDAO.approvedSlip(payload)
			queryCalls[0].cb(null)
			await expect(promise).resolves.toEqual({ message: 'Duyệt phiếu (không có item)' })
		})

		// Test Case ID: TC_REQDAO_APPROVE_21
		it('TC_REQDAO_APPROVE_21 - Security: slipId injection payload vẫn chỉ đi qua params (không nối chuỗi)', async () => {
			const queryCalls = captureDbQueryCalls()
			const payload = {
				REQUEST_SLIP_ID: '1 OR 1=1',
				REQUEST_SLIP_Status: 'Đã duyệt',
				REQUEST_SLIP_ApproveNotes: 'OK',
				items: [],
			}

			const promise = RequestDAO.approvedSlip(payload)
			expect(queryCalls[0].params).toEqual(['Đã duyệt', 'OK', '1 OR 1=1'])
			queryCalls[0].cb(null)
			await expect(promise).resolves.toEqual({ message: 'Duyệt phiếu (không có item)' })
		})
	})
})
