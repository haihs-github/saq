jest.mock('../../module/request/request.dao')

const RequestService = require('../../module/request/request.service')

describe('RequestService', () => {
	it('loads module (placeholder)', () => {
		expect(RequestService).toBeTruthy()
	})

	// TODO: add tests for requestSlip, getRequestSlip, approvedSlip
})
