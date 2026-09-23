const path = require('node:path');
try { process.loadEnvFile(path.join(__dirname, '.env')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const mode = process.env.DB_MODE || 'sqlite';
if (!['sqlite', 'demo', 'oracle'].includes(mode)) throw new Error('DB_MODE must be sqlite, demo, or oracle');
module.exports = { mode: mode === 'demo' ? 'sqlite' : mode };
