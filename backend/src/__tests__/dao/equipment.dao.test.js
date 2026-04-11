import EquipmentDAO from '../../module/equipment/equipment.dao.js'

jest.mock('../../config/configDB.js')
import pool from '../../config/configDB.js'

describe('EquipmentDAO', () => {
	let mockConnection

	beforeEach(() => {
		mockConnection = {
			query: jest.fn(),
			execute: jest.fn(),
			release: jest.fn(),
			beginTransaction: jest.fn(),
			commit: jest.fn(),
			rollback: jest.fn()
		}
		pool.getConnection = jest.fn().mockResolvedValue(mockConnection)
		pool.execute = jest.fn()
	})

	// TODO: add tests for findAll, findOne, createEquipment, updateEquipment, deleteEquipment
})
