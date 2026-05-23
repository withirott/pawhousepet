require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });
    try {
        await pool.query('UPDATE users SET verification_status = "verified"');
        console.log('All users verified');
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
run();
