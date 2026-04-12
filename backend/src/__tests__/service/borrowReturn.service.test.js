jest.mock('../../module/borrowReturn/borrowReturn.dao')

const BorrowReturnService = require('../../module/borrowReturn/borrowReturn.service')

describe('BorrowReturnService', () => {
	it('loads module (placeholder)', () => {
		expect(BorrowReturnService).toBeTruthy()
	})

	// TODO: add tests for createBorrowReturnSlip, borrowReturnSlip, findAllBorrowReturnSlip
})
