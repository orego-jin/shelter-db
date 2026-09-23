const { mode } = require('../config');
let ready;
let sqlite;
let oracle;
function initialize() {
    if (!ready) ready = (async () => {
        if (mode === 'sqlite') {
            sqlite = require('./sqlite');
        } else {
            oracle = require('oracledb');
            await oracle.createPool({
                user: process.env.ORACLE_USER,
                password: process.env.ORACLE_PASS,
                connectString: `${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_DBNAME}`,
                poolMin: 1, poolMax: 3, poolIncrement: 1, poolTimeout: 60
            });
        }
    })();
    return ready;
}
async function withDatabase(action) {
    await initialize();
    if (sqlite) return action(sqlite);
    const connection = await oracle.getConnection();
    try { return await action(connection); }
    finally { await connection.close(); }
}
async function close() {
    if (!ready) return;
    await ready;
    if (sqlite) sqlite.close();
    else await oracle.getPool().close(10);
}
module.exports = { mode, initialize, withDatabase, close };
