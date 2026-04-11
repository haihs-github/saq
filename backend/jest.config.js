module.exports = {
	testEnvironment: 'node',
	transform: {
		'^.+\\.js$': 'babel-jest'
	},
	coverageDirectory: 'coverage',
	collectCoverageFrom: [
		'src/module/**/*.js',
		'!src/module/**/*.controller.js'
	],
	testMatch: ['**/__tests__/**/*.test.js'],
	coverageThreshold: {
		global: {
			branches: 80,
			functions: 80,
			lines: 80,
			statements: 80
		}
	},
	clearMocks: true,
	restoreMocks: true
}
