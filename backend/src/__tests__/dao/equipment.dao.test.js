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
const EquipmentDAO = require('../../module/equipment/equipment.dao')

function createEquipmentData(overrides = {}) {
	return {
		ID: 1,
		EQUIPMENT_ITEM_Name: 'EPX200-004',
		EQUIPMENT_ITEM_PurchaseDate: '2024-06-01',
		EQUIPMENT_ITEM_Price: 12000000,
		EQUIPMENT_ITEM_Quantity: 1,
		EQUIPMENT_ITEM_Status: 'Có sẵn',
		EQUIPMENT_ITEM_Description: 'Máy chiếu mới',
		EQUIPMENT_MODEL_ID: 10,
		EQUIPMENT_MODEL_Name: 'Epson X200',
		EQUIPMENT_MODEL_Branch: 'Epson',
		EQUIPMENT_TYPE_ID: 5,
		EQUIPMENT_TYPE_Name: 'Projector',
		EQUIPMENT_TYPE_Description: 'Máy chiếu',
		...overrides,
	}
}

function createRoomData(overrides = {}) {
	return {
		ID: 2,
		ROOM_Name: 'A102',
		ROOM_Capacity: 40,
		ROOM_Description: 'Phòng học mới',
		ROOM_Status: 'Có sẵn',
		LOCATION_Building: 'A',
		LOCATION_Floor: 1,
		ROOM_TYPE_ID: 3,
		ROOM_TYPE_Name: 'Classroom',
		ROOM_TYPE_Description: 'Phòng học tiêu chuẩn',
		...overrides,
	}
}

describe('backend/src/module/equipment/equipment.dao.js - EquipmentDAO (DAO Layer)', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		db.beginTransaction.mockImplementation(cb => cb(null))
		db.commit.mockImplementation(cb => cb && cb())
		db.rollback.mockImplementation(cb => cb && cb())
	})

	// =====================================================================
	// 1) findAll()
	// =====================================================================
	describe('findAll()', () => {
		// Test Case ID: TC_EQDAO_FINDALL_01
		it("TC_EQDAO_FINDALL_01 - resolve danh sách thiết bị nhiều trạng thái hợp lệ", async () => {
			const rows = [
				{ ID: 1, EQUIPMENT_ITEM_Status: 'Có sẵn' },
				{ ID: 2, EQUIPMENT_ITEM_Status: 'Đang sử dụng' },
				{ ID: 3, EQUIPMENT_ITEM_Status: 'Hỏng' },
			]
			db.query.mockImplementation((sql, cb) => cb(null, rows))

			const result = await EquipmentDAO.findAll()

			expect(result).toBe(rows)
		})

		// Test Case ID: TC_EQDAO_FINDALL_02
		it('TC_EQDAO_FINDALL_02 - resolve [] khi không có thiết bị active', async () => {
			db.query.mockImplementation((sql, cb) => cb(null, []))

			const result = await EquipmentDAO.findAll()

			expect(result).toEqual([])
		})

		// Test Case ID: TC_EQDAO_FINDALL_03
		it('TC_EQDAO_FINDALL_03 - CheckDB: SQL JOIN đủ 3 bảng ITEM/MODEL/TYPE', async () => {
			db.query.mockImplementation((sql, cb) => cb(null, []))

			await EquipmentDAO.findAll()

			const sql = db.query.mock.calls[0][0]
			expect(sql).toContain('FROM datn.EQUIPMENT_ITEM')
			expect(sql).toContain('JOIN datn.EQUIPMENT_MODEL')
			expect(sql).toContain('JOIN datn.EQUIPMENT_TYPE')
		})

		// Test Case ID: TC_EQDAO_FINDALL_04
		it("TC_EQDAO_FINDALL_04 - CheckDB: SQL có filter Status != 'inactive'", async () => {
			db.query.mockImplementation((sql, cb) => cb(null, []))

			await EquipmentDAO.findAll()

			const sql = db.query.mock.calls[0][0]
			expect(sql).toContain("WHERE ei.EQUIPMENT_ITEM_Status != 'inactive'")
		})

		// Test Case ID: TC_EQDAO_FINDALL_05
		it('TC_EQDAO_FINDALL_05 - CheckDB: không truyền params (query gọi 2 args)', async () => {
			db.query.mockImplementation((sql, cb) => cb(null, []))

			await EquipmentDAO.findAll()

			expect(db.query).toHaveBeenCalledTimes(1)
			expect(db.query.mock.calls[0]).toHaveLength(2)
			expect(typeof db.query.mock.calls[0][1]).toBe('function')
		})

		// Test Case ID: TC_EQDAO_FINDALL_06
		it('TC_EQDAO_FINDALL_06 - reject khi DB trả lỗi', async () => {
			const err = new Error('DB error')
			db.query.mockImplementation((sql, cb) => cb(err))

			await expect(EquipmentDAO.findAll()).rejects.toBe(err)
		})

		// Test Case ID: TC_EQDAO_FINDALL_07
		it('TC_EQDAO_FINDALL_07 - resolve null khi DB trả results=null', async () => {
			db.query.mockImplementation((sql, cb) => cb(null, null))

			const result = await EquipmentDAO.findAll()

			expect(result).toBeNull()
		})

		// Test Case ID: TC_EQDAO_FINDALL_08
		it('TC_EQDAO_FINDALL_08 - không mutate object/field trả về từ DB', async () => {
			const row = { ID: 1, SOME_WEIRD_FIELD: 'keep-me' }
			const rows = [row]
			db.query.mockImplementation((sql, cb) => cb(null, rows))

			const result = await EquipmentDAO.findAll()

			expect(result[0]).toBe(row)
			expect(result[0].SOME_WEIRD_FIELD).toBe('keep-me')
		})

		// Test Case ID: TC_EQDAO_FINDALL_09
		it('TC_EQDAO_FINDALL_09 - dữ liệu lớn 1000 dòng vẫn resolve đúng length', async () => {
			const rows = Array.from({ length: 1000 }, (_, i) => ({ ID: i + 1 }))
			db.query.mockImplementation((sql, cb) => cb(null, rows))

			const result = await EquipmentDAO.findAll()

			expect(result).toHaveLength(1000)
		})

		// Test Case ID: TC_EQDAO_FINDALL_10
		it('TC_EQDAO_FINDALL_10 - data bẩn trùng ID vẫn resolve nguyên mảng', async () => {
			const rows = [{ ID: 1 }, { ID: 1 }]
			db.query.mockImplementation((sql, cb) => cb(null, rows))

			const result = await EquipmentDAO.findAll()

			expect(result).toEqual(rows)
		})
	})

	// =====================================================================
	// 2) findAllRoom()
	// =====================================================================
	describe('findAllRoom()', () => {
		// Test Case ID: TC_EQDAO_FINDALLROOM_01
		it('TC_EQDAO_FINDALLROOM_01 - resolve danh sách phòng nhiều loại phòng', async () => {
			const rooms = [
				{ ID: 1, ROOM_TYPE_Name: 'Classroom' },
				{ ID: 2, ROOM_TYPE_Name: 'Lab' },
				{ ID: 3, ROOM_TYPE_Name: 'Conference' },
			]
			db.query.mockImplementation((sql, cb) => cb(null, rooms))

			const result = await EquipmentDAO.findAllRoom()

			expect(result).toBe(rooms)
		})

		// Test Case ID: TC_EQDAO_FINDALLROOM_02
		it('TC_EQDAO_FINDALLROOM_02 - resolve [] khi không có phòng active', async () => {
			db.query.mockImplementation((sql, cb) => cb(null, []))

			const result = await EquipmentDAO.findAllRoom()

			expect(result).toEqual([])
		})

		// Test Case ID: TC_EQDAO_FINDALLROOM_03
		it('TC_EQDAO_FINDALLROOM_03 - CheckDB: SQL JOIN datn.ROOM_TYPE', async () => {
			db.query.mockImplementation((sql, cb) => cb(null, []))

			await EquipmentDAO.findAllRoom()

			const sql = db.query.mock.calls[0][0]
			expect(sql).toContain('FROM datn.ROOM r')
			expect(sql).toContain('JOIN datn.ROOM_TYPE')
		})

		// Test Case ID: TC_EQDAO_FINDALLROOM_04
		it("TC_EQDAO_FINDALLROOM_04 - CheckDB: SQL lọc ROOM_Status != 'inactive'", async () => {
			db.query.mockImplementation((sql, cb) => cb(null, []))

			await EquipmentDAO.findAllRoom()

			const sql = db.query.mock.calls[0][0]
			expect(sql).toContain("WHERE r.ROOM_Status != 'inactive'")
		})

		// Test Case ID: TC_EQDAO_FINDALLROOM_05
		it('TC_EQDAO_FINDALLROOM_05 - reject khi DB trả lỗi', async () => {
			const err = new Error('DB error')
			db.query.mockImplementation((sql, cb) => cb(err))

			await expect(EquipmentDAO.findAllRoom()).rejects.toBe(err)
		})

		// Test Case ID: TC_EQDAO_FINDALLROOM_06
		it('TC_EQDAO_FINDALLROOM_06 - resolve null khi DB trả results=null', async () => {
			db.query.mockImplementation((sql, cb) => cb(null, null))

			const result = await EquipmentDAO.findAllRoom()

			expect(result).toBeNull()
		})

		// Test Case ID: TC_EQDAO_FINDALLROOM_07
		it('TC_EQDAO_FINDALLROOM_07 - kết quả có đủ field vị trí (tòa/tầng)', async () => {
			const rooms = [{ ID: 1, LOCATION_Building: 'A', LOCATION_Floor: 1 }]
			db.query.mockImplementation((sql, cb) => cb(null, rooms))

			const result = await EquipmentDAO.findAllRoom()

			expect(result[0]).toHaveProperty('LOCATION_Building')
			expect(result[0]).toHaveProperty('LOCATION_Floor')
		})

		// Test Case ID: TC_EQDAO_FINDALLROOM_08
		it('TC_EQDAO_FINDALLROOM_08 - không mutate dữ liệu phòng trả về', async () => {
			const room = { ID: 1, SOME_WEIRD_FIELD: 'keep-me' }
			const rooms = [room]
			db.query.mockImplementation((sql, cb) => cb(null, rooms))

			const result = await EquipmentDAO.findAllRoom()

			expect(result[0]).toBe(room)
			expect(result[0].SOME_WEIRD_FIELD).toBe('keep-me')
		})
	})

	// =====================================================================
	// 3) findOne(data)
	// =====================================================================
	describe('findOne(data)', () => {
		// Test Case ID: TC_EQDAO_FINDONE_01
		it("TC_EQDAO_FINDONE_01 - resolve thiết bị khi type=equipment và ID tồn tại", async () => {
			const eq = { ID: 1, EQUIPMENT_ITEM_Name: 'EPX200-001' }
			db.query.mockImplementation((sql, params, cb) => cb(null, [eq]))

			const result = await EquipmentDAO.findOne({ id: '1|equipment' })

			expect(result).toBe(eq)
		})

		// Test Case ID: TC_EQDAO_FINDONE_02
		it('TC_EQDAO_FINDONE_02 - resolve undefined khi thiết bị không tồn tại', async () => {
			db.query.mockImplementation((sql, params, cb) => cb(null, []))

			const result = await EquipmentDAO.findOne({ id: '9999|equipment' })

			expect(result).toBeUndefined()
		})

		// Test Case ID: TC_EQDAO_FINDONE_03
		it('TC_EQDAO_FINDONE_03 - resolve undefined khi thiết bị inactive (bị lọc)', async () => {
			db.query.mockImplementation((sql, params, cb) => cb(null, []))

			const result = await EquipmentDAO.findOne({ id: '5|equipment' })

			expect(result).toBeUndefined()
		})

		// Test Case ID: TC_EQDAO_FINDONE_04
		it('TC_EQDAO_FINDONE_04 - reject khi DB lỗi ở query thiết bị', async () => {
			const err = new Error('DB error')
			db.query.mockImplementation((sql, params, cb) => cb(err))

			await expect(EquipmentDAO.findOne({ id: '1|equipment' })).rejects.toBe(err)
		})

		// Test Case ID: TC_EQDAO_FINDONE_05
		it('TC_EQDAO_FINDONE_05 - CheckDB: equipment query dùng placeholder ? và params [id]', async () => {
			db.query.mockImplementation((sql, params, cb) => cb(null, []))

			await EquipmentDAO.findOne({ id: '7|equipment' })

			const [sql, params] = db.query.mock.calls[0]
			expect(sql).toMatch(/WHERE\s+ei\.ID\s*=\s*\?/)
			expect(params).toEqual(['7'])
		})

		// Test Case ID: TC_EQDAO_FINDONE_06
		it("TC_EQDAO_FINDONE_06 - CheckDB: SQL equipment JOIN đủ 3 bảng và lọc inactive", async () => {
			db.query.mockImplementation((sql, params, cb) => cb(null, []))

			await EquipmentDAO.findOne({ id: '7|equipment' })

			const sql = db.query.mock.calls[0][0]
			expect(sql).toContain('JOIN datn.EQUIPMENT_MODEL')
			expect(sql).toContain('JOIN datn.EQUIPMENT_TYPE')
			expect(sql).toContain("ei.EQUIPMENT_ITEM_Status != 'inactive'")
		})

		// Test Case ID: TC_EQDAO_FINDONE_07
		it('TC_EQDAO_FINDONE_07 - resolve phòng khi type=room và ID tồn tại', async () => {
			const room = { ID: 2, ROOM_Name: 'A101' }
			db.query.mockImplementation((sql, params, cb) => cb(null, [room]))

			const result = await EquipmentDAO.findOne({ id: '2|room' })

			expect(result).toBe(room)
		})

		// Test Case ID: TC_EQDAO_FINDONE_08
		it('TC_EQDAO_FINDONE_08 - resolve undefined khi phòng không tồn tại', async () => {
			db.query.mockImplementation((sql, params, cb) => cb(null, []))

			const result = await EquipmentDAO.findOne({ id: '9999|room' })

			expect(result).toBeUndefined()
		})

		// Test Case ID: TC_EQDAO_FINDONE_09
		it('TC_EQDAO_FINDONE_09 - resolve undefined khi phòng inactive (bị lọc)', async () => {
			db.query.mockImplementation((sql, params, cb) => cb(null, []))

			const result = await EquipmentDAO.findOne({ id: '9|room' })

			expect(result).toBeUndefined()
		})

		// Test Case ID: TC_EQDAO_FINDONE_10
		it('TC_EQDAO_FINDONE_10 - reject khi DB lỗi ở query phòng', async () => {
			const err = new Error('DB error')
			db.query.mockImplementation((sql, params, cb) => cb(err))

			await expect(EquipmentDAO.findOne({ id: '2|room' })).rejects.toBe(err)
		})

		// Test Case ID: TC_EQDAO_FINDONE_11
		it('TC_EQDAO_FINDONE_11 - CheckDB: room query dùng placeholder ? và params [id]', async () => {
			db.query.mockImplementation((sql, params, cb) => cb(null, []))

			await EquipmentDAO.findOne({ id: '2|room' })

			const [sql, params] = db.query.mock.calls[0]
			expect(sql).toMatch(/WHERE\s+r\.ID\s*=\s*\?/)
			expect(params).toEqual(['2'])
		})

		// Test Case ID: TC_EQDAO_FINDONE_12
		it('TC_EQDAO_FINDONE_12 - reject Error khi type không hợp lệ', async () => {
			await expect(EquipmentDAO.findOne({ id: '1|invalid' })).rejects.toThrow('Type không hợp lệ')
			expect(db.query).not.toHaveBeenCalled()
		})

		// Test Case ID: TC_EQDAO_FINDONE_13
		it('TC_EQDAO_FINDONE_13 - reject Error khi thiếu delimiter |', async () => {
			await expect(EquipmentDAO.findOne({ id: '1' })).rejects.toThrow('Type không hợp lệ')
			expect(db.query).not.toHaveBeenCalled()
		})

		// Test Case ID: TC_EQDAO_FINDONE_14
		it('TC_EQDAO_FINDONE_14 - nhiều delimiter: lấy 2 phần đầu (equipment)', async () => {
			db.query.mockImplementation((sql, params, cb) => cb(null, []))

			await EquipmentDAO.findOne({ id: '1|equipment|extra' })

			const params = db.query.mock.calls[0][1]
			expect(params).toEqual(['1'])
		})

		// Test Case ID: TC_EQDAO_FINDONE_15
		it("TC_EQDAO_FINDONE_15 - idType rỗng ('|equipment') vẫn query params ['']", async () => {
			db.query.mockImplementation((sql, params, cb) => cb(null, []))

			const result = await EquipmentDAO.findOne({ id: '|equipment' })

			expect(result).toBeUndefined()
			expect(db.query.mock.calls[0][1]).toEqual([''])
		})

		// Test Case ID: TC_EQDAO_FINDONE_16
		it('TC_EQDAO_FINDONE_16 - Security: payload injection trong id vẫn là params', async () => {
			db.query.mockImplementation((sql, params, cb) => cb(null, []))

			await EquipmentDAO.findOne({ id: '1 OR 1=1|equipment' })

			expect(db.query.mock.calls[0][1]).toEqual(['1 OR 1=1'])
		})

		// Test Case ID: TC_EQDAO_FINDONE_17
		it('TC_EQDAO_FINDONE_17 - DB trả nhiều dòng thì lấy dòng đầu', async () => {
			const row1 = { ID: 1 }
			const row2 = { ID: 2 }
			db.query.mockImplementation((sql, params, cb) => cb(null, [row1, row2]))

			const result = await EquipmentDAO.findOne({ id: '1|equipment' })

			expect(result).toBe(row1)
		})

		// Test Case ID: TC_EQDAO_FINDONE_18
		it("TC_EQDAO_FINDONE_18 - type sai casing ('Equipment') bị coi là không hợp lệ", async () => {
			await expect(EquipmentDAO.findOne({ id: '1|Equipment' })).rejects.toThrow('Type không hợp lệ')
			expect(db.query).not.toHaveBeenCalled()
		})
	})

	// =====================================================================
	// 4) createEquipment(data)
	// =====================================================================
	describe('createEquipment(data)', () => {
		// Test Case ID: TC_EQDAO_CREATE_01
		it("TC_EQDAO_CREATE_01 - tạo thiết bị mới thành công (commit)", async () => {
			const data = createEquipmentData()
			db.query
				.mockImplementationOnce((sql, params, cb) => cb(null, { insertId: 5 }))
				.mockImplementationOnce((sql, params, cb) => cb(null, { insertId: 9 }))
				.mockImplementationOnce((sql, params, cb) => cb(null))

			const result = await EquipmentDAO.createEquipment(data)

			expect(result).toEqual({ message: 'Thêm thiết bị thành công' })
			expect(db.commit).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_EQDAO_CREATE_02
		it('TC_EQDAO_CREATE_02 - CheckDB: thứ tự query tạo thiết bị TYPE → MODEL → ITEM', async () => {
			const data = createEquipmentData()
			db.query
				.mockImplementationOnce((sql, params, cb) => cb(null, { insertId: 5 }))
				.mockImplementationOnce((sql, params, cb) => cb(null, { insertId: 9 }))
				.mockImplementationOnce((sql, params, cb) => cb(null))

			await EquipmentDAO.createEquipment(data)

			const sql1 = db.query.mock.calls[0][0]
			const sql2 = db.query.mock.calls[1][0]
			const sql3 = db.query.mock.calls[2][0]
			expect(sql1).toContain('INSERT INTO datn.EQUIPMENT_TYPE')
			expect(sql2).toContain('INSERT INTO datn.EQUIPMENT_MODEL')
			expect(sql3).toContain('INSERT INTO datn.EQUIPMENT_ITEM')
		})

		// Test Case ID: TC_EQDAO_CREATE_03
		it('TC_EQDAO_CREATE_03 - CheckDB: INSERT EQUIPMENT_TYPE params đúng', async () => {
			const data = createEquipmentData({ EQUIPMENT_TYPE_Name: 'Laptop', EQUIPMENT_TYPE_Description: 'Máy tính' })
			db.query
				.mockImplementationOnce((sql, params, cb) => cb(null, { insertId: 5 }))
				.mockImplementationOnce((sql, params, cb) => cb(null, { insertId: 9 }))
				.mockImplementationOnce((sql, params, cb) => cb(null))

			await EquipmentDAO.createEquipment(data)

			expect(db.query.mock.calls[0][1]).toEqual(['Laptop', 'Máy tính'])
		})

		// Test Case ID: TC_EQDAO_CREATE_04
		it('TC_EQDAO_CREATE_04 - CheckDB: INSERT EQUIPMENT_MODEL nhận đúng typeId từ insertId', async () => {
			const data = createEquipmentData()
			db.query
				.mockImplementationOnce((sql, params, cb) => cb(null, { insertId: 5 }))
				.mockImplementationOnce((sql, params, cb) => cb(null, { insertId: 9 }))
				.mockImplementationOnce((sql, params, cb) => cb(null))

			await EquipmentDAO.createEquipment(data)

			const params2 = db.query.mock.calls[1][1]
			expect(params2[2]).toBe(5)
		})

		// Test Case ID: TC_EQDAO_CREATE_05
		it('TC_EQDAO_CREATE_05 - CheckDB: INSERT EQUIPMENT_ITEM nhận đúng modelId từ insertId', async () => {
			const data = createEquipmentData()
			db.query
				.mockImplementationOnce((sql, params, cb) => cb(null, { insertId: 5 }))
				.mockImplementationOnce((sql, params, cb) => cb(null, { insertId: 9 }))
				.mockImplementationOnce((sql, params, cb) => cb(null))

			await EquipmentDAO.createEquipment(data)

			const params3 = db.query.mock.calls[2][1]
			expect(params3[6]).toBe(9)
		})

		// Test Case ID: TC_EQDAO_CREATE_06
		it('TC_EQDAO_CREATE_06 - convert PurchaseDate thành MySQL datetime string', async () => {
			const data = createEquipmentData({ EQUIPMENT_ITEM_PurchaseDate: '2024-06-01' })
			db.query
				.mockImplementationOnce((sql, params, cb) => cb(null, { insertId: 5 }))
				.mockImplementationOnce((sql, params, cb) => cb(null, { insertId: 9 }))
				.mockImplementationOnce((sql, params, cb) => cb(null))

			await EquipmentDAO.createEquipment(data)

			const purchaseDateParam = db.query.mock.calls[2][1][1]
			expect(purchaseDateParam).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
		})

		// Test Case ID: TC_EQDAO_CREATE_07
		it('TC_EQDAO_CREATE_07 - không convert PurchaseDate nếu field không tồn tại', async () => {
			const data = createEquipmentData({ EQUIPMENT_ITEM_PurchaseDate: undefined })
			db.query
				.mockImplementationOnce((sql, params, cb) => cb(null, { insertId: 5 }))
				.mockImplementationOnce((sql, params, cb) => cb(null, { insertId: 9 }))
				.mockImplementationOnce((sql, params, cb) => cb(null))

			await EquipmentDAO.createEquipment(data)

			const purchaseDateParam = db.query.mock.calls[2][1][1]
			expect(purchaseDateParam).toBeUndefined()
		})

		// Test Case ID: TC_EQDAO_CREATE_08
		it('TC_EQDAO_CREATE_08 - throw RangeError khi PurchaseDate invalid (Invalid Date)', () => {
			const data = createEquipmentData({ EQUIPMENT_ITEM_PurchaseDate: 'not-a-date' })

			expect(() => EquipmentDAO.createEquipment(data)).toThrow(RangeError)
			expect(db.beginTransaction).not.toHaveBeenCalled()
		})

		// Test Case ID: TC_EQDAO_CREATE_09
		it('TC_EQDAO_CREATE_09 - reject khi beginTransaction lỗi', async () => {
			const beginErr = new Error('beginTransaction failed')
			db.beginTransaction.mockImplementation(cb => cb(beginErr))

			await expect(EquipmentDAO.createEquipment(createEquipmentData())).rejects.toBe(beginErr)
			expect(db.query).not.toHaveBeenCalled()
		})

		// Test Case ID: TC_EQDAO_CREATE_10
		it('TC_EQDAO_CREATE_10 - rollback + reject khi INSERT TYPE lỗi', async () => {
			const queryErr = new Error('INSERT TYPE failed')
			db.query.mockImplementationOnce((sql, params, cb) => cb(queryErr))

			await expect(EquipmentDAO.createEquipment(createEquipmentData())).rejects.toBe(queryErr)
			expect(db.rollback).toHaveBeenCalledTimes(1)
			expect(db.commit).not.toHaveBeenCalled()
		})

		// Test Case ID: TC_EQDAO_CREATE_11
		it('TC_EQDAO_CREATE_11 - rollback + reject khi INSERT MODEL lỗi', async () => {
			const queryErr = new Error('INSERT MODEL failed')
			db.query
				.mockImplementationOnce((sql, params, cb) => cb(null, { insertId: 5 }))
				.mockImplementationOnce((sql, params, cb) => cb(queryErr))

			await expect(EquipmentDAO.createEquipment(createEquipmentData())).rejects.toBe(queryErr)
			expect(db.rollback).toHaveBeenCalledTimes(1)
			expect(db.commit).not.toHaveBeenCalled()
		})

		// Test Case ID: TC_EQDAO_CREATE_12
		it('TC_EQDAO_CREATE_12 - rollback + reject khi INSERT ITEM lỗi', async () => {
			const queryErr = new Error('INSERT ITEM failed')
			db.query
				.mockImplementationOnce((sql, params, cb) => cb(null, { insertId: 5 }))
				.mockImplementationOnce((sql, params, cb) => cb(null, { insertId: 9 }))
				.mockImplementationOnce((sql, params, cb) => cb(queryErr))

			await expect(EquipmentDAO.createEquipment(createEquipmentData())).rejects.toBe(queryErr)
			expect(db.rollback).toHaveBeenCalledTimes(1)
			expect(db.commit).not.toHaveBeenCalled()
		})

		// Test Case ID: TC_EQDAO_CREATE_13
		it('TC_EQDAO_CREATE_13 - tạo phòng mới thành công (commit)', async () => {
			const data = createRoomData()
			db.query
				.mockImplementationOnce((sql, params, cb) => cb(null, { insertId: 4 }))
				.mockImplementationOnce((sql, params, cb) => cb(null))

			const result = await EquipmentDAO.createEquipment(data)

			expect(result).toEqual({ message: 'Thêm phòng thành công' })
			expect(db.commit).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_EQDAO_CREATE_14
		it('TC_EQDAO_CREATE_14 - CheckDB: INSERT ROOM_TYPE params đúng', async () => {
			const data = createRoomData({ ROOM_TYPE_Name: 'Lab', ROOM_TYPE_Description: 'Phòng lab' })
			db.query
				.mockImplementationOnce((sql, params, cb) => cb(null, { insertId: 4 }))
				.mockImplementationOnce((sql, params, cb) => cb(null))

			await EquipmentDAO.createEquipment(data)

			expect(db.query.mock.calls[0][1]).toEqual(['Lab', 'Phòng lab'])
		})

		// Test Case ID: TC_EQDAO_CREATE_15
		it('TC_EQDAO_CREATE_15 - CheckDB: INSERT ROOM nhận đúng typeId từ insertId', async () => {
			const data = createRoomData()
			db.query
				.mockImplementationOnce((sql, params, cb) => cb(null, { insertId: 4 }))
				.mockImplementationOnce((sql, params, cb) => cb(null))

			await EquipmentDAO.createEquipment(data)

			const params2 = db.query.mock.calls[1][1]
			expect(params2[6]).toBe(4)
		})

		// Test Case ID: TC_EQDAO_CREATE_16
		it('TC_EQDAO_CREATE_16 - rollback + reject khi INSERT ROOM_TYPE lỗi', async () => {
			const queryErr = new Error('INSERT ROOM_TYPE failed')
			db.query.mockImplementationOnce((sql, params, cb) => cb(queryErr))

			await expect(EquipmentDAO.createEquipment(createRoomData())).rejects.toBe(queryErr)
			expect(db.rollback).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_EQDAO_CREATE_17
		it('TC_EQDAO_CREATE_17 - rollback + reject khi INSERT ROOM lỗi', async () => {
			const queryErr = new Error('INSERT ROOM failed')
			db.query
				.mockImplementationOnce((sql, params, cb) => cb(null, { insertId: 4 }))
				.mockImplementationOnce((sql, params, cb) => cb(queryErr))

			await expect(EquipmentDAO.createEquipment(createRoomData())).rejects.toBe(queryErr)
			expect(db.rollback).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_EQDAO_CREATE_18
		it('TC_EQDAO_CREATE_18 - rollback + reject "Unknown data type" khi input không đúng', async () => {
			await expect(EquipmentDAO.createEquipment({})).rejects.toBe('Unknown data type')
			expect(db.rollback).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_EQDAO_CREATE_19
		it('TC_EQDAO_CREATE_19 - insertId TYPE undefined: MODEL insert fail → rollback', async () => {
			const queryErr = new Error('FK fail')
			db.query
				.mockImplementationOnce((sql, params, cb) => cb(null, { insertId: undefined }))
				.mockImplementationOnce((sql, params, cb) => cb(queryErr))

			await expect(EquipmentDAO.createEquipment(createEquipmentData())).rejects.toBe(queryErr)
			expect(db.query.mock.calls[1][1][2]).toBeUndefined()
			expect(db.rollback).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_EQDAO_CREATE_20
		it('TC_EQDAO_CREATE_20 - insertId MODEL undefined: ITEM insert fail → rollback', async () => {
			const queryErr = new Error('FK fail')
			db.query
				.mockImplementationOnce((sql, params, cb) => cb(null, { insertId: 5 }))
				.mockImplementationOnce((sql, params, cb) => cb(null, { insertId: undefined }))
				.mockImplementationOnce((sql, params, cb) => cb(queryErr))

			await expect(EquipmentDAO.createEquipment(createEquipmentData())).rejects.toBe(queryErr)
			expect(db.query.mock.calls[2][1][6]).toBeUndefined()
			expect(db.rollback).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_EQDAO_CREATE_21
		it('TC_EQDAO_CREATE_21 - thiếu field bắt buộc → DB lỗi và rollback', async () => {
			const queryErr = new Error('Column cannot be null')
			const data = createEquipmentData({ EQUIPMENT_TYPE_Name: null })
			db.query.mockImplementationOnce((sql, params, cb) => cb(queryErr))

			await expect(EquipmentDAO.createEquipment(data)).rejects.toBe(queryErr)
			expect(db.rollback).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_EQDAO_CREATE_22
		it('TC_EQDAO_CREATE_22 - duplicate entry → rollback + reject', async () => {
			const queryErr = Object.assign(new Error('ER_DUP_ENTRY'), { code: 'ER_DUP_ENTRY' })
			db.query.mockImplementationOnce((sql, params, cb) => cb(queryErr))

			await expect(EquipmentDAO.createEquipment(createEquipmentData())).rejects.toBe(queryErr)
			expect(db.rollback).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_EQDAO_CREATE_23
		it('TC_EQDAO_CREATE_23 - commit được gọi đúng 1 lần khi thành công', async () => {
			db.query
				.mockImplementationOnce((sql, params, cb) => cb(null, { insertId: 5 }))
				.mockImplementationOnce((sql, params, cb) => cb(null, { insertId: 9 }))
				.mockImplementationOnce((sql, params, cb) => cb(null))

			await EquipmentDAO.createEquipment(createEquipmentData())

			expect(db.commit).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_EQDAO_CREATE_24
		it('TC_EQDAO_CREATE_24 - không gọi rollback khi thành công', async () => {
			db.query
				.mockImplementationOnce((sql, params, cb) => cb(null, { insertId: 5 }))
				.mockImplementationOnce((sql, params, cb) => cb(null, { insertId: 9 }))
				.mockImplementationOnce((sql, params, cb) => cb(null))

			await EquipmentDAO.createEquipment(createEquipmentData())

			expect(db.rollback).not.toHaveBeenCalled()
		})
	})

	// =====================================================================
	// 5) updateEquipment(data)
	// =====================================================================
	describe('updateEquipment(data)', () => {
		// Test Case ID: TC_EQDAO_UPDATE_01
		it('TC_EQDAO_UPDATE_01 - update thiết bị thành công (commit)', async () => {
			const data = createEquipmentData()
			db.query
				.mockImplementationOnce((sql, params, cb) => cb(null, { affectedRows: 1 }))
				.mockImplementationOnce((sql, params, cb) => cb(null, { affectedRows: 1 }))
				.mockImplementationOnce((sql, params, cb) => cb(null, { affectedRows: 1 }))

			const result = await EquipmentDAO.updateEquipment(data)

			expect(result).toEqual({ message: 'Update equipment thành công' })
			expect(db.commit).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_EQDAO_UPDATE_02
		it('TC_EQDAO_UPDATE_02 - CheckDB: thứ tự update thiết bị ITEM → MODEL → TYPE', async () => {
			const data = createEquipmentData()
			db.query
				.mockImplementationOnce((sql, params, cb) => cb(null))
				.mockImplementationOnce((sql, params, cb) => cb(null))
				.mockImplementationOnce((sql, params, cb) => cb(null))

			await EquipmentDAO.updateEquipment(data)

			const sql1 = db.query.mock.calls[0][0]
			const sql2 = db.query.mock.calls[1][0]
			const sql3 = db.query.mock.calls[2][0]
			expect(sql1).toContain('UPDATE datn.EQUIPMENT_ITEM')
			expect(sql2).toContain('UPDATE datn.EQUIPMENT_MODEL')
			expect(sql3).toContain('UPDATE datn.EQUIPMENT_TYPE')
		})

		// Test Case ID: TC_EQDAO_UPDATE_03
		it('TC_EQDAO_UPDATE_03 - CheckDB: Update ITEM params đúng thứ tự', async () => {
			const data = createEquipmentData({
				EQUIPMENT_ITEM_Name: 'Name',
				EQUIPMENT_ITEM_PurchaseDate: '2024-01-10',
				EQUIPMENT_ITEM_Price: 111,
				EQUIPMENT_ITEM_Quantity: 2,
				EQUIPMENT_ITEM_Status: 'Có sẵn',
				EQUIPMENT_ITEM_Description: 'Desc',
				ID: 77,
			})
			db.query
				.mockImplementationOnce((sql, params, cb) => cb(null))
				.mockImplementationOnce((sql, params, cb) => cb(null))
				.mockImplementationOnce((sql, params, cb) => cb(null))

			await EquipmentDAO.updateEquipment(data)

			const params1 = db.query.mock.calls[0][1]
			expect(params1[0]).toBe('Name')
			expect(params1[1]).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
			expect(params1[2]).toBe(111)
			expect(params1[3]).toBe(2)
			expect(params1[4]).toBe('Có sẵn')
			expect(params1[5]).toBe('Desc')
			expect(params1[6]).toBe(77)
		})

		// Test Case ID: TC_EQDAO_UPDATE_04
		it('TC_EQDAO_UPDATE_04 - convert PurchaseDate: params là MySQL datetime string', async () => {
			const data = createEquipmentData({ EQUIPMENT_ITEM_PurchaseDate: '2024-01-10' })
			db.query
				.mockImplementationOnce((sql, params, cb) => cb(null))
				.mockImplementationOnce((sql, params, cb) => cb(null))
				.mockImplementationOnce((sql, params, cb) => cb(null))

			await EquipmentDAO.updateEquipment(data)

			const purchaseDateParam = db.query.mock.calls[0][1][1]
			expect(purchaseDateParam).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
		})

		// Test Case ID: TC_EQDAO_UPDATE_05
		it('TC_EQDAO_UPDATE_05 - throw RangeError khi PurchaseDate invalid', () => {
			const data = createEquipmentData({ EQUIPMENT_ITEM_PurchaseDate: 'invalid' })

			expect(() => EquipmentDAO.updateEquipment(data)).toThrow(RangeError)
			expect(db.beginTransaction).not.toHaveBeenCalled()
		})

		// Test Case ID: TC_EQDAO_UPDATE_06
		it('TC_EQDAO_UPDATE_06 - reject khi beginTransaction lỗi', async () => {
			const beginErr = new Error('beginTransaction failed')
			db.beginTransaction.mockImplementation(cb => cb(beginErr))

			await expect(EquipmentDAO.updateEquipment(createEquipmentData())).rejects.toBe(beginErr)
			expect(db.query).not.toHaveBeenCalled()
		})

		// Test Case ID: TC_EQDAO_UPDATE_07
		it('TC_EQDAO_UPDATE_07 - rollback + reject khi UPDATE ITEM lỗi', async () => {
			const queryErr = new Error('UPDATE ITEM failed')
			db.query.mockImplementationOnce((sql, params, cb) => cb(queryErr))

			await expect(EquipmentDAO.updateEquipment(createEquipmentData())).rejects.toBe(queryErr)
			expect(db.rollback).toHaveBeenCalledTimes(1)
			// Nếu rollback xảy ra, không nên chạy các query sau
			expect(db.query).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_EQDAO_UPDATE_08
		it('TC_EQDAO_UPDATE_08 - rollback + reject khi UPDATE MODEL lỗi', async () => {
			const queryErr = new Error('UPDATE MODEL failed')
			db.query
				.mockImplementationOnce((sql, params, cb) => cb(null))
				.mockImplementationOnce((sql, params, cb) => cb(queryErr))

			await expect(EquipmentDAO.updateEquipment(createEquipmentData())).rejects.toBe(queryErr)
			expect(db.rollback).toHaveBeenCalledTimes(1)
			expect(db.query).toHaveBeenCalledTimes(2)
		})

		// Test Case ID: TC_EQDAO_UPDATE_09
		it('TC_EQDAO_UPDATE_09 - rollback + reject khi UPDATE TYPE lỗi', async () => {
			const queryErr = new Error('UPDATE TYPE failed')
			db.query
				.mockImplementationOnce((sql, params, cb) => cb(null))
				.mockImplementationOnce((sql, params, cb) => cb(null))
				.mockImplementationOnce((sql, params, cb) => cb(queryErr))

			await expect(EquipmentDAO.updateEquipment(createEquipmentData())).rejects.toBe(queryErr)
			expect(db.rollback).toHaveBeenCalledTimes(1)
			expect(db.query).toHaveBeenCalledTimes(3)
		})

		// Test Case ID: TC_EQDAO_UPDATE_10
		it('TC_EQDAO_UPDATE_10 - update phòng thành công (commit)', async () => {
			const data = createRoomData()
			db.query
				.mockImplementationOnce((sql, params, cb) => cb(null, { affectedRows: 1 }))
				.mockImplementationOnce((sql, params, cb) => cb(null, { affectedRows: 1 }))

			const result = await EquipmentDAO.updateEquipment(data)

			expect(result).toEqual({ message: 'Update room thành công' })
			expect(db.commit).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_EQDAO_UPDATE_11
		it('TC_EQDAO_UPDATE_11 - CheckDB: thứ tự update phòng ROOM → ROOM_TYPE', async () => {
			const data = createRoomData()
			db.query
				.mockImplementationOnce((sql, params, cb) => cb(null))
				.mockImplementationOnce((sql, params, cb) => cb(null))

			await EquipmentDAO.updateEquipment(data)

			const sql1 = db.query.mock.calls[0][0]
			const sql2 = db.query.mock.calls[1][0]
			expect(sql1).toContain('UPDATE datn.ROOM')
			expect(sql2).toContain('UPDATE datn.ROOM_TYPE')
		})

		// Test Case ID: TC_EQDAO_UPDATE_12
		it('TC_EQDAO_UPDATE_12 - rollback + reject khi UPDATE ROOM lỗi', async () => {
			const queryErr = new Error('UPDATE ROOM failed')
			db.query.mockImplementationOnce((sql, params, cb) => cb(queryErr))

			await expect(EquipmentDAO.updateEquipment(createRoomData())).rejects.toBe(queryErr)
			expect(db.rollback).toHaveBeenCalledTimes(1)
			expect(db.query).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_EQDAO_UPDATE_13
		it('TC_EQDAO_UPDATE_13 - rollback + reject khi UPDATE ROOM_TYPE lỗi', async () => {
			const queryErr = new Error('UPDATE ROOM_TYPE failed')
			db.query
				.mockImplementationOnce((sql, params, cb) => cb(null))
				.mockImplementationOnce((sql, params, cb) => cb(queryErr))

			await expect(EquipmentDAO.updateEquipment(createRoomData())).rejects.toBe(queryErr)
			expect(db.rollback).toHaveBeenCalledTimes(1)
			expect(db.query).toHaveBeenCalledTimes(2)
		})

		// Test Case ID: TC_EQDAO_UPDATE_14
		it('TC_EQDAO_UPDATE_14 - rollback + reject "Unknown data type" khi input thiếu EQUIPMENT_ITEM_Name/ROOM_Name', async () => {
			await expect(EquipmentDAO.updateEquipment({ ID: 1 })).rejects.toBe('Unknown data type')
			expect(db.rollback).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_EQDAO_UPDATE_15
		it('TC_EQDAO_UPDATE_15 - affectedRows=0 vẫn commit và trả message success', async () => {
			const data = createEquipmentData({ ID: 9999 })
			db.query
				.mockImplementationOnce((sql, params, cb) => cb(null, { affectedRows: 0 }))
				.mockImplementationOnce((sql, params, cb) => cb(null, { affectedRows: 0 }))
				.mockImplementationOnce((sql, params, cb) => cb(null, { affectedRows: 0 }))

			const result = await EquipmentDAO.updateEquipment(data)

			expect(result).toEqual({ message: 'Update equipment thành công' })
			expect(db.commit).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_EQDAO_UPDATE_16
		it("TC_EQDAO_UPDATE_16 - status thiết bị 'Đang sử dụng' vẫn update được", async () => {
			const data = createEquipmentData({ EQUIPMENT_ITEM_Status: 'Đang sử dụng' })
			db.query
				.mockImplementationOnce((sql, params, cb) => cb(null))
				.mockImplementationOnce((sql, params, cb) => cb(null))
				.mockImplementationOnce((sql, params, cb) => cb(null))

			await EquipmentDAO.updateEquipment(data)

			const params1 = db.query.mock.calls[0][1]
			expect(params1[4]).toBe('Đang sử dụng')
		})

		// Test Case ID: TC_EQDAO_UPDATE_17
		it("TC_EQDAO_UPDATE_17 - status thiết bị 'Hỏng' vẫn update được", async () => {
			const data = createEquipmentData({ EQUIPMENT_ITEM_Status: 'Hỏng' })
			db.query
				.mockImplementationOnce((sql, params, cb) => cb(null))
				.mockImplementationOnce((sql, params, cb) => cb(null))
				.mockImplementationOnce((sql, params, cb) => cb(null))

			await EquipmentDAO.updateEquipment(data)

			const params1 = db.query.mock.calls[0][1]
			expect(params1[4]).toBe('Hỏng')
		})

		// Test Case ID: TC_EQDAO_UPDATE_18
		it("TC_EQDAO_UPDATE_18 - status phòng 'Đang sửa chữa' vẫn update được", async () => {
			const data = createRoomData({ ROOM_Status: 'Đang sửa chữa' })
			db.query
				.mockImplementationOnce((sql, params, cb) => cb(null))
				.mockImplementationOnce((sql, params, cb) => cb(null))

			await EquipmentDAO.updateEquipment(data)

			const params1 = db.query.mock.calls[0][1]
			expect(params1[3]).toBe('Đang sửa chữa')
		})

		// Test Case ID: TC_EQDAO_UPDATE_19
		it('TC_EQDAO_UPDATE_19 - thiếu ID/model_id/type_id → DB lỗi và rollback', async () => {
			const queryErr = new Error('Missing ID')
			const data = createEquipmentData({ ID: undefined })
			db.query.mockImplementationOnce((sql, params, cb) => cb(queryErr))

			await expect(EquipmentDAO.updateEquipment(data)).rejects.toBe(queryErr)
			expect(db.rollback).toHaveBeenCalledTimes(1)
		})

		// Test Case ID: TC_EQDAO_UPDATE_20
		it('TC_EQDAO_UPDATE_20 - không gọi rollback khi thành công', async () => {
			const data = createEquipmentData()
			db.query
				.mockImplementationOnce((sql, params, cb) => cb(null))
				.mockImplementationOnce((sql, params, cb) => cb(null))
				.mockImplementationOnce((sql, params, cb) => cb(null))

			await EquipmentDAO.updateEquipment(data)

			expect(db.rollback).not.toHaveBeenCalled()
		})
	})

	// =====================================================================
	// 6) deleteEquipment(data)
	// =====================================================================
	describe('deleteEquipment(data)', () => {
		// Test Case ID: TC_EQDAO_DELETE_01
		it('TC_EQDAO_DELETE_01 - soft delete thiết bị thành công (type=equipment)', async () => {
			const results = { affectedRows: 1 }
			db.query.mockImplementation((sql, params, cb) => cb(null, results))

			const result = await EquipmentDAO.deleteEquipment({ id: 1, type: 'equipment' })

			expect(result).toBe(results)
		})

		// Test Case ID: TC_EQDAO_DELETE_02
		it('TC_EQDAO_DELETE_02 - soft delete phòng thành công (type=room)', async () => {
			const results = { affectedRows: 1 }
			db.query.mockImplementation((sql, params, cb) => cb(null, results))

			const result = await EquipmentDAO.deleteEquipment({ id: 2, type: 'room' })

			expect(result).toBe(results)
		})

		// Test Case ID: TC_EQDAO_DELETE_03
		it('TC_EQDAO_DELETE_03 - CheckDB: delete equipment UPDATE EQUIPMENT_ITEM set inactive với params [id]', async () => {
			db.query.mockImplementation((sql, params, cb) => cb(null, { affectedRows: 1 }))

			await EquipmentDAO.deleteEquipment({ id: 1, type: 'equipment' })

			const [sql, params] = db.query.mock.calls[0]
			expect(sql).toContain('UPDATE datn.EQUIPMENT_ITEM')
			expect(sql).toContain("EQUIPMENT_ITEM_Status = 'inactive'")
			expect(sql).toContain('WHERE ID = ?')
			expect(params).toEqual([1])
		})

		// Test Case ID: TC_EQDAO_DELETE_04
		it('TC_EQDAO_DELETE_04 - CheckDB: delete room UPDATE ROOM set inactive với params [id]', async () => {
			db.query.mockImplementation((sql, params, cb) => cb(null, { affectedRows: 1 }))

			await EquipmentDAO.deleteEquipment({ id: 2, type: 'room' })

			const [sql, params] = db.query.mock.calls[0]
			expect(sql).toContain('UPDATE datn.ROOM')
			expect(sql).toContain("ROOM_Status = 'inactive'")
			expect(sql).toContain('WHERE ID = ?')
			expect(params).toEqual([2])
		})

		// Test Case ID: TC_EQDAO_DELETE_05
		it('TC_EQDAO_DELETE_05 - resolve affectedRows=0 khi ID không tồn tại', async () => {
			const results = { affectedRows: 0 }
			db.query.mockImplementation((sql, params, cb) => cb(null, results))

			const result = await EquipmentDAO.deleteEquipment({ id: 9999, type: 'equipment' })

			expect(result).toBe(results)
		})

		// Test Case ID: TC_EQDAO_DELETE_06
		it('TC_EQDAO_DELETE_06 - reject khi DB lỗi (equipment)', async () => {
			const err = new Error('DB error')
			db.query.mockImplementation((sql, params, cb) => cb(err))

			await expect(EquipmentDAO.deleteEquipment({ id: 1, type: 'equipment' })).rejects.toBe(err)
		})

		// Test Case ID: TC_EQDAO_DELETE_07
		it('TC_EQDAO_DELETE_07 - reject khi DB lỗi (room)', async () => {
			const err = new Error('DB error')
			db.query.mockImplementation((sql, params, cb) => cb(err))

			await expect(EquipmentDAO.deleteEquipment({ id: 2, type: 'room' })).rejects.toBe(err)
		})

		// Test Case ID: TC_EQDAO_DELETE_08
		it('TC_EQDAO_DELETE_08 - reject Error khi type không hợp lệ', async () => {
			await expect(EquipmentDAO.deleteEquipment({ id: 1, type: 'invalid' })).rejects.toThrow('Type không hợp lệ')
			expect(db.query).not.toHaveBeenCalled()
		})

		// Test Case ID: TC_EQDAO_DELETE_09
		it('TC_EQDAO_DELETE_09 - reject Error khi thiếu type (undefined)', async () => {
			await expect(EquipmentDAO.deleteEquipment({ id: 1 })).rejects.toThrow('Type không hợp lệ')
			expect(db.query).not.toHaveBeenCalled()
		})

		// Test Case ID: TC_EQDAO_DELETE_10
		it('TC_EQDAO_DELETE_10 - id undefined: DB trả lỗi và phải reject', async () => {
			const err = new Error('Invalid id')
			db.query.mockImplementation((sql, params, cb) => cb(err))

			await expect(EquipmentDAO.deleteEquipment({ id: undefined, type: 'equipment' })).rejects.toBe(err)
		})

		// Test Case ID: TC_EQDAO_DELETE_11
		it('TC_EQDAO_DELETE_11 - Security: payload injection trong id vẫn là params', async () => {
			db.query.mockImplementation((sql, params, cb) => cb(null, { affectedRows: 1 }))

			await EquipmentDAO.deleteEquipment({ id: '1 OR 1=1', type: 'room' })

			expect(db.query.mock.calls[0][1]).toEqual(['1 OR 1=1'])
		})
	})
})
