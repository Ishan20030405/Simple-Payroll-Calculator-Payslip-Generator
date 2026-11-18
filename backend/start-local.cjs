const path = require('node:path');
process.title = 'HR Backend - localhost:5000';
process.chdir(__dirname);
delete process.env.VERCEL;
require('dotenv').config({path:path.join(__dirname,'.env'),override:true,quiet:true});
const app = require('./src/app');
const db = require('./src/config/db');
let server;
async function start() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw Error('Configure a JWT_SECRET of at least 32 characters in backend/.env.');
  await db.execute('SELECT 1');
  server = app.listen(5000, '127.0.0.1', () => {
    console.log('Backend ready: http://localhost:5000/api');
    console.log('Connected to configured database. Automatic schema initialization is disabled.');
  });
  server.on('error', error => {console.error('Backend listener failed:', error.code);process.exit(1);});
}
async function stop() {
  if (server) await new Promise(resolve => server.close(resolve));
  await db.end(); process.exit(0);
}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
start().catch(async error => {console.error('Backend startup failed:', error.code || error.message);await db.end();process.exitCode=1;});
