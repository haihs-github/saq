jest.mock('../../module/equipment/equipment.dao')

const EquipmentService = require('../../module/equipment/equipment.service')

describe('EquipmentService', () => {
	it('loads module (placeholder)', () => {
		expect(EquipmentService).toBeTruthy()
	})

	// TODO: add tests for findAllEquipment, findOneEquipment, createEquipment, updateEquipment, deleteEquipment
})
