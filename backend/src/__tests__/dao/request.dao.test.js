import RequestDAO from '../../module/request/request.dao.js'

jest.mock('../../config/configDB.js')
import pool from '../../config/configDB.js'

describe('RequestDAO', () => {
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
	})

	// TODO: add tests for requestSlip, getAllRequestSlip, approvedSlip
})
