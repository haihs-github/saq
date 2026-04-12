jest.mock('../../config/configDB', () => ({
	query: jest.fn(),
	execute: jest.fn(),
	getConnection: jest.fn(),
	beginTransaction: jest.fn(),
	commit: jest.fn(),
	rollback: jest.fn(),
	end: jest.fn(),
}))

jest.mock('../../module/borrowReturn/borrowReturn.dao')

const BorrowReturnService = require('../../module/borrowReturn/borrowReturn.service')

describe('BorrowReturnService', () => {
	it.todo('add tests for createBorrowReturnSlip, borrowReturnSlip, findAllBorrowReturnSlip')
})
