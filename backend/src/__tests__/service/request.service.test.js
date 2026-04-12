jest.mock('../../config/configDB', () => ({
	query: jest.fn(),
	execute: jest.fn(),
	getConnection: jest.fn(),
	beginTransaction: jest.fn(),
	commit: jest.fn(),
	rollback: jest.fn(),
	end: jest.fn(),
}))

jest.mock('../../module/request/request.dao')

const RequestService = require('../../module/request/request.service')

describe('RequestService', () => {
	it.todo('add tests for requestSlip, getRequestSlip, approvedSlip')
})
