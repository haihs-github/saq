jest.mock('../../config/configDB', () => ({
	query: jest.fn(),
	execute: jest.fn(),
	beginTransaction: jest.fn((cb) => cb && cb(null)),
	commit: jest.fn((cb) => cb && cb(null)),
	rollback: jest.fn((cb) => cb && cb(null)),
	end: jest.fn()
}))

const BorrowReturnDAO = require('../../module/borrowReturn/borrowReturn.dao')

describe('BorrowReturnDAO', () => {
	describe('convertDateArray()', () => {
		it('loads module (placeholder)', () => {
			expect(BorrowReturnDAO).toBeTruthy()
		})
	})

	// TODO: add tests for convertDateArray edge cases, createBorrowReturnSlipDAO, borrowReturnSlipDAO, findAllBorrowReturn
})
