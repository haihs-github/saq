import BorrowReturnDAO from '../../module/borrowReturn/borrowReturn.dao.js'

jest.mock('../../config/configDB.js')
import pool from '../../config/configDB.js'

describe('BorrowReturnDAO', () => {
	describe('convertDateArray()', () => {
		it('should convert date array to correct format', () => {
			// TODO: add test cases based on actual implementation
		})
	})

	// TODO: add tests for createBorrowReturnSlipDAO, borrowReturnSlipDAO, findAllBorrowReturn
})
