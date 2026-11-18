// backend/src/config/db.js
const mysql = require('mysql2/promise');

const databaseConfig = {
    host: (process.env.DB_HOST || 'localhost').trim(),
    port: Number(process.env.DB_PORT || 3306),
    user: (process.env.DB_USER || 'root').trim(),
    password: (process.env.DB_PASSWORD || '').replace(/[\r\n]+$/, ''),
    ...(process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: true } } : {}),
};
const databaseName = (process.env.DB_NAME || 'payroll_db').trim();
const connectionLimit = Number(process.env.DB_CONNECTION_LIMIT || (process.env.VERCEL ? 3 : 10));
if (!Number.isInteger(connectionLimit) || connectionLimit < 1 || connectionLimit > 100) {
    throw new Error('DB_CONNECTION_LIMIT must be an integer from 1 to 100');
}

async function ensureDatabase() {
    if (!/^[A-Za-z0-9_$]+$/.test(databaseName)) {
        throw new Error('DB_NAME contains unsupported characters');
    }

    const connection = await mysql.createConnection(databaseConfig);
    try {
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``);
    } catch (err) {
        // Shared cloud hosts (like AlwaysData) block CREATE DATABASE privileges.
        // Ignore ER_DBACCESS_DENIED_ERROR if the database already exists.
        if (err.code !== 'ER_DBACCESS_DENIED_ERROR') {
            throw err;
        }
    } finally {
        await connection.end();
    }
}

// Create connection pool
const pool = mysql.createPool({
    ...databaseConfig,
    database: databaseName,
    dateStrings: true,
    waitForConnections: true,
    connectionLimit,
    maxIdle: process.env.VERCEL ? 1 : connectionLimit,
    idleTimeout: process.env.VERCEL ? 5000 : 60000,
    queueLimit: 0
});

if (process.env.VERCEL) require('@vercel/functions').attachDatabasePool(pool.pool);

pool.ensureDatabase = ensureDatabase;
module.exports = require('./transactions')(pool);
