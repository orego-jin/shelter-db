require('./config');
const path = require('node:path');
const express = require('express');
const database = require('./db');
const appController = require('./appController');
const app = express();
const PORT = process.env.PORT || 65534;
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use('/', appController);
async function start() {
    await database.initialize();
    const server = app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${server.address().port}/ (${database.mode})`);
    });
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => {
        server.close(async () => { await database.close(); process.exit(0); });
    });
}
start().catch(error => { console.error('Database initialization failed:', error.message); process.exit(1); });
