let connection

// Unit tests should not create real DB connections.
// Most unit tests mock this module, but this guard prevents accidental DB access.
if (process.env.NODE_ENV === 'test') {
    connection = {
        query: () => {
            throw new Error('configDB: query() called while NODE_ENV=test. Mock configDB in unit tests.')
        },
        execute: () => {
            throw new Error('configDB: execute() called while NODE_ENV=test. Mock configDB in unit tests.')
        },
        beginTransaction: (cb) => cb && cb(new Error('configDB: beginTransaction() not available in unit tests')),
        commit: (cb) => cb && cb(new Error('configDB: commit() not available in unit tests')),
        rollback: (cb) => cb && cb(),
        end: (cb) => cb && cb(),
    }
} else {
    const mysql = require('mysql2')
    require('dotenv').config()

    connection = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.USER,
        password: process.env.PASS,
        database: process.env.DATABASE,
        port: process.env.DB_PORT,
        multipleStatements: true
    })
    connection.connect(err => {
        if (err) {
            console.error('[LOG] Kết nối csdl không thành công!', err)
        } else {
            console.log('[LOG] Kết nối csdl thành công!')
        }
    })
}

module.exports = connection