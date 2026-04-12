jest.mock('../../config/configDB', () => ({
	query: jest.fn(),
	execute: jest.fn(),
	beginTransaction: jest.fn((cb) => cb && cb(null)),
	commit: jest.fn((cb) => cb && cb(null)),
	rollback: jest.fn((cb) => cb && cb(null)),
	end: jest.fn()
}))

const RequestDAO = require('../../module/request/request.dao')

describe('RequestDAO', () => {
	it('loads module (placeholder)', () => {
		expect(RequestDAO).toBeTruthy()
	})

	// TODO: add tests for requestSlip, getAllRequestSlip, approvedSlip
})
