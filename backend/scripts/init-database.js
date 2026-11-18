// Explicit one-time setup from a trusted machine, never during a Vercel build.
require('dotenv').config({ path: require('node:path').resolve(__dirname, '../.env') });
const db = require('../src/config/db');
const initDatabase = require('../src/config/initDatabase');
(async () => {
    try {
        await initDatabase();
    } catch (error) {
        console.error('Database setup failed. Check connection settings and schema privileges. Code:', error.code || 'INITIALIZATION_FAILED');
        process.exitCode = 1;
    } finally {
        await db.end();
    }
})();
