jest.mock('../../config/configDB', () => ({
	query: jest.fn(),
	execute: jest.fn(),
	beginTransaction: jest.fn((cb) => cb && cb(null)),
	commit: jest.fn((cb) => cb && cb(null)),
	rollback: jest.fn((cb) => cb && cb(null)),
	end: jest.fn()
}))

const UserDAO = require('../../module/user/user.dao')

describe('UserDAO', () => {
	it('loads module (placeholder)', () => {
		expect(UserDAO).toBeTruthy()
	})

	// TODO: add tests for findAll, findOneUser, createUser, updateUser, deleteUserById, findUserNameAndPassword
})
