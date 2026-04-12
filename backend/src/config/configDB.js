require('dotenv').config()

if (process.env.NODE_ENV === 'test') {
    module.exports = {
        query: () => {
            throw new Error('DB connection is disabled when NODE_ENV=test. Mock configDB in unit tests.')
        },
        execute: () => {
            throw new Error('DB connection is disabled when NODE_ENV=test. Mock configDB in unit tests.')
        },
        getConnection: async () => {
            throw new Error('DB connection is disabled when NODE_ENV=test. Mock configDB in unit tests.')
        },
        beginTransaction: async () => {
            throw new Error('DB connection is disabled when NODE_ENV=test. Mock configDB in unit tests.')
        },
        commit: async () => {
            throw new Error('DB connection is disabled when NODE_ENV=test. Mock configDB in unit tests.')
        },
        rollback: async () => {
            throw new Error('DB connection is disabled when NODE_ENV=test. Mock configDB in unit tests.')
        },
        end: async () => {
            /* no-op */
        }
    }
} else {
    const mysql = require('mysql2')

    const connection = mysql.createConnection({
        host:process.env.DB_HOST,
        user:process.env.USER,
        password:process.env.PASS,
        database:process.env.DATABASE,
        port:process.env.DB_PORT,
        multipleStatements: true 
    })

    connection.connect(err => {
        if (err) {
            console.error('[LOG] Kết nối csdl không thành công!', err)
        } else {
            console.log('[LOG] Kết nối csdl thành công!')
        }
    })

    module.exports = connection
}