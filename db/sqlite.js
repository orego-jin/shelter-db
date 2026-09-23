const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');
const filename = process.env.SQLITE_PATH || path.join(__dirname, '../data/demo.sqlite');
if (filename !== ':memory:') fs.mkdirSync(path.dirname(path.resolve(filename)), { recursive: true });
const db = new DatabaseSync(filename);
db.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
// A schema version, rather than row counts, prevents deleted demo rows reappearing on restart.
if (db.prepare('PRAGMA user_version').get().user_version === 0) {
    db.exec('BEGIN IMMEDIATE');
    try {
        db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
        db.exec(fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8'));
        db.exec('PRAGMA user_version = 1; COMMIT');
    } catch (error) { db.exec('ROLLBACK'); db.close(); throw error; }
}
module.exports = {
    execute(sql, binds = {}) {
        try {
            const statement = db.prepare(sql);
            if (statement.columns().length) {
                statement.setReturnArrays(true);
                return { rows: statement.all(binds) };
            }
            return { rowsAffected: statement.run(binds).changes };
        } catch (error) {
            // Preserve the service's existing constraint-specific messages.
            if (error.errcode === 787) error.errorNum = 2291;
            if ([1555, 2067].includes(error.errcode)) error.errorNum = 1;
            if (error.errcode === 1299) error.errorNum = 1400;
            throw error;
        }
    },
    close() { db.close(); }
};
