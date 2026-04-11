import UserDAO from '../../module/user/user.dao.js'

// Mock mysql2 connection pool
jest.mock('../../config/configDB.js')
import pool from '../../config/configDB.js'

describe('UserDAO', () => {
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
		pool.execute = jest.fn()
	})

	// TODO: add tests for findAll, findOneUser, createUser, updateUser, deleteUserById, findUserNameAndPassword
})
