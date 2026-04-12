jest.mock('../../config/configDB', () => ({
	query: jest.fn(),
	execute: jest.fn(),
	beginTransaction: jest.fn((cb) => cb && cb(null)),
	commit: jest.fn((cb) => cb && cb(null)),
	rollback: jest.fn((cb) => cb && cb(null)),
	end: jest.fn()
}))

const EquipmentDAO = require('../../module/equipment/equipment.dao')

describe('EquipmentDAO', () => {
	it('loads module (placeholder)', () => {
		expect(EquipmentDAO).toBeTruthy()
	})

	// TODO: add tests for findAll, findOne, createEquipment, updateEquipment, deleteEquipment
})
