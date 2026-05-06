const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        console.log("Adding 'address' to users...");
        await pool.query('ALTER TABLE users ADD COLUMN address TEXT AFTER bio');
        console.log("Success.");
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log("'address' already exists.");
        else console.error(e);
    }

    try {
        console.log("Adding 'vaccine_cert' to products...");
        await pool.query('ALTER TABLE products ADD COLUMN vaccine_cert VARCHAR(255) AFTER vaccine_status');
        console.log("Success.");
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log("'vaccine_cert' already exists.");
        else console.error(e);
    }

    console.log("Migration complete.");
    process.exit(0);
}

runMigration();
